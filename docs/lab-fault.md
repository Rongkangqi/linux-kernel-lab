# L10 · 同一段代码，两种缺页入口

约 90 分钟。先在 RK3576 的 Linux 用户态运行，再在 K230 的 Linux 端按其工具链重新编译。保留第一份记录，第二块板晚些接入也能继续对照。

## 提出预测

匿名映射建立后，分别测量两次逐页写入的次缺页增量。预测哪一遍较多，写下页大小、透明大页和 libc 首次执行路径可能带来的影响。默认申请 2 MiB，先看板上可用内存。

## 编译并运行

保存为 `touch.c`。若开发板带有 C 编译器，直接执行下方命令。交叉编译时使用与目标镜像 ABI、动态加载器匹配的 SDK 编译器。

```c
#define _GNU_SOURCE
#include <stdio.h>
#include <sys/mman.h>
#include <sys/resource.h>
#include <unistd.h>

int main(void)
{
    long page = sysconf(_SC_PAGESIZE);
    size_t bytes = 2 * 1024 * 1024;
    if (page <= 0) return 1;
    volatile unsigned char *p = mmap(NULL, bytes, PROT_READ | PROT_WRITE,
                                     MAP_PRIVATE | MAP_ANONYMOUS, -1, 0);
    if (p == MAP_FAILED) { perror("mmap"); return 1; }

    struct rusage sample[3];
    if (getrusage(RUSAGE_SELF, &sample[0])) return 1;
    for (int pass = 0; pass < 2; ++pass) {
        for (size_t i = 0; i < bytes; i += (size_t)page)
            p[i] = (unsigned char)(pass + 1);
        if (getrusage(RUSAGE_SELF, &sample[pass + 1])) return 1;
    }
    printf("page=%ld first=%ld second=%ld\n", page,
           sample[1].ru_minflt - sample[0].ru_minflt,
           sample[2].ru_minflt - sample[1].ru_minflt);
    return munmap((void *)p, bytes) != 0;
}
```

```bash
cc -O2 -Wall -Wextra touch.c -o touch
uname -m
./touch
./touch
```

## 找到分叉与汇合

在带版本号的两份源码中，从各自异常处理入口追到 `handle_mm_fault`。为 ARM64 注明访存异常信息的获取位置，为 RISC-V 注明 store page fault 的判别位置。运行计数给出现象，源码说明可能的路径；若要确认本次调用经过某个函数，还需在支持的内核上取得跟踪证据。[跨架构阅读表](arch-riscv.md)

## 验收与反例

交付两行板卡记录，包含 ISA、内核 SHA 或来源、页大小、两次增量和观测次数。把映射缩为一页重跑，用它检验“次缺页增量总等于写入的基础页数”这一说法。解释合法匿名页为何能在内核处理后回到原指令。
