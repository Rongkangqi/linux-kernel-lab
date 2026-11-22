# L04 · 按需分配与写时复制

**环境：RK3576 或 WSL2 · 约 120 分钟 · 使用 32 MiB，避免给系统制造内存压力。**

## 实验设计

写一个分阶段暂停的 C 程序，用 `mmap(MAP_PRIVATE | MAP_ANONYMOUS)` 获得 32 MiB 区域，使用 `sysconf(_SC_PAGESIZE)` 获取页大小。每个阶段打印 PID 并等待回车，便于另一个终端取样。

1. 映射成功但不访问；
2. 每页读取一个字节，将结果汇总到最终打印的校验值中，避免被优化掉；
3. 每页写一个字节；
4. `fork`，父子都暂停，子进程尚未修改；
5. 只允许子进程改写一半页面，父进程保持不写，再取样；
6. 子进程退出，父进程 `waitpid`，最终 `munmap`。

先运行下面的参考实现，再尝试自己写同等的阶段控制。把代码保存为 `cow.c`。父进程负责终端交互，一根管道发命令，另一根收回执。子进程改写完毕后仍然存活，另一个终端此时可以同时观察两份映射。

```c
#define _GNU_SOURCE
#include <errno.h>
#include <stdio.h>
#include <stdlib.h>
#include <sys/mman.h>
#include <sys/wait.h>
#include <unistd.h>

static void fail(const char *name) { perror(name); exit(1); }
static void checkpoint(const char *stage) {
    printf("%s  [Enter]\n", stage);
    if (getchar() == EOF) exit(1);
}
static void send_mark(int fd) {
    if (write(fd, "x", 1) != 1) fail("write");
}
static void wait_mark(int fd) {
    char mark;
    ssize_t n = read(fd, &mark, 1);
    if (n < 0) fail("read");
    if (n == 0) { fputs("partner closed pipe\n", stderr); exit(1); }
}
int main(void) {
    setbuf(stdout, NULL);
    size_t len = 32UL * 1024 * 1024;
    long page = sysconf(_SC_PAGESIZE);
    if (page <= 0) fail("sysconf");
    volatile unsigned char *p = mmap(NULL, len, PROT_READ | PROT_WRITE,
                                     MAP_PRIVATE | MAP_ANONYMOUS, -1, 0);
    if (p == MAP_FAILED) fail("mmap");
    printf("parent=%ld start=%p page=%ld\n", (long)getpid(), (void *)p, page);
    checkpoint("1 mapped");
    unsigned sum = 0;
    for (size_t i = 0; i < len; i += page) sum += p[i];
    printf("sum=%u\n", sum);
    checkpoint("2 first read");
    for (size_t i = 0; i < len; i += page) p[i] = 1;
    checkpoint("3 first write");
    int cmd[2], ack[2];
    if (pipe(cmd) || pipe(ack)) fail("pipe");
    pid_t child = fork();
    if (child == -1) fail("fork");
    if (child == 0) {
        close(cmd[1]); close(ack[0]);
        wait_mark(cmd[0]);
        for (size_t i = 0; i < len / 2; i += page) p[i] = 2;
        printf("child byte=%u\n", (unsigned)p[0]);
        send_mark(ack[1]);
        wait_mark(cmd[0]);
        _exit(0);
    }
    close(cmd[0]); close(ack[1]);
    printf("child=%ld\n", (long)child);
    checkpoint("4 after fork");
    send_mark(cmd[1]); wait_mark(ack[0]);
    printf("parent byte=%u\n", (unsigned)p[0]);
    checkpoint("5 child wrote half");
    send_mark(cmd[1]);
    int status;
    if (waitpid(child, &status, 0) < 0) fail("waitpid");
    if (!WIFEXITED(status) || WEXITSTATUS(status)) return 1;
    if (munmap((void *)p, len)) fail("munmap");
    return 0;
}
```

```bash
cc -Wall -Wextra -O2 cow.c -o cow
./cow
```

只在第一个终端按回车。到 `1 mapped` 后，在第二个终端设置 `pid=实际父进程号`（用数字替换）。到第 4 阶段再记录子 PID。子进程不需要第二个键盘输入。发生权限错误时，先确认取样与目标进程属于同一用户，若仍受限制，可以先记录程序打印的数据。

## 观测命令

将 PID 替换为实际进程号，分别记录父子进程。程序暂停时运行：

```bash
cat "/proc/$pid/maps"
grep -E '^(Rss|Pss|Private_Dirty|Shared_Dirty):' "/proc/$pid/smaps_rollup"
ps -p "$pid" -o pid,vsz,rss,min_flt,maj_flt,comm
```

如果内核不提供 `smaps_rollup`，使用 `smaps` 并定位目标匿名区域。进程有其他分配，整体统计会包含噪声；更严谨时解析目标映射，记录页大小、THP 和相关配置。

## 如何解释结果

映射后的虚拟地址范围可能先增长，而驻留和私有脏页不会立即按同等大小增长；匿名读可使用共享零页等实现，不能把一次读直接当成分配独占页。逐页写与 fork 后的子进程写入，会改变驻留、共享和私有情况。

PSS 对共享页做比例分摊，RSS 可能在多个进程中重复统计共享驻留页。父子 RSS 相加不能直接表示实际物理消耗。

下面是在 x86_64 WSL2 中运行本页程序的一次实测，单位均为 kB，取自整个进程的 `smaps_rollup`。先只读父进程的三列，找出“分配并写脏”和“既有页改记为共享”的转折点，再对照最后一行子进程的数据。

| 采样时刻 | 父 RSS | 父 Shared_Dirty | 父 Private_Dirty | 子 Private_Dirty |
| --- | ---: | ---: | ---: | ---: |
| 刚映射 | 1612 | 0 | 112 | — |
| 逐页读过 | 1612 | 0 | 112 | — |
| 逐页写过 | 34380 | 0 | 32880 | — |
| fork 后、子未写 | 34508 | 32840 | 40 | 32 |
| 子写半区后 | 34508 | 16456 | 16424 | 16420 |

最后父进程保持不写，私有脏页仍然增加。子进程取得部分页的另一个副本后，对应旧页只剩父进程使用，它们在父进程的统计分类也变了。父进程首字节实测仍为 1，子进程已读到 2。

## 避免误判

fork 前的 stdio 缓冲可能导致输出重复；用 `fflush` 或无缓冲输出。父子若都持续写，会破坏只改变一个变量的设计。内存统计还受分配器、THP、系统负载与内核实现影响，不要求得到固定整数。

## 源码回看与验收

1. 为什么程序的 `sum` 是 0，逐页写后才明显增加私有脏页？**参考解释**：匿名映射承诺初始读取为零；创建 VMA 只描述可访问范围。不同系统可以在首次读时映射零页，首次写时再准备可写的私有页。结合 RSS 和故障计数判断本机情况。
2. 子进程打印 2 而父进程仍打印 1，是否说明内核在 `fork` 时已经复制了 32 MiB？**参考解释**：这个输出只证明写入互相隔离。第 4、5 阶段的共享脏页、私有脏页及 PSS 变化，才能支持“先共享，写时分离”的解释。大页会影响每次故障覆盖的范围。

追 `mm/memory.c` 中匿名页与写保护故障相关路径，解释 VMA、页表权限和物理页关系。提交各阶段快照及一张共享→写入后分离的示意图。

能回答：同一个数值的地址为什么可对应不同页；page fault 为什么不一定异常退出；为什么不能简单用“fork 后 RSS 翻倍”判定 COW 失效。

参考：[mmap(2)](https://man7.org/linux/man-pages/man2/mmap.2.html)、[smaps](https://man7.org/linux/man-pages/man5/proc_pid_smaps.5.html)。
