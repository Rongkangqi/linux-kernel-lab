# 00 · 搭好实验台

**第 1 周 · WSL2 构建，RK3576 运行 · 目标：能够构建、观察并解释一个最小 Linux 程序。**

## 需要补齐的基础

C 语言重点复习指针与数组、结构体、函数指针、位操作、内存生命周期和编译链接。遇到 `container_of`、链表或回调时，先写一个用户态小例子理解地址关系。暂时不用为读内核而把整本 C 书重学一遍。

Shell 重点掌握管道、重定向、退出码、后台任务、`ps`、`/proc`。Git 需要会看差异、创建提交、记录 SHA。能区分源码、目标文件、可执行文件、调试符号和运行进程。

## 本周步骤

1. 按[环境基线](environment.md)建立目录与版本记录。
2. 用 `cc -Wall -Wextra -g -O0` 编译一个程序；用 `file`、`readelf -h` 查看架构。
3. 完成[L01](lab-pid.md)，观察多个线程对应的 TID。
4. 在固定内核源码中找到 `task_struct`；只读 `mm`、`files`、`signal` 等对象关系，记录暂时不懂的字段。

## 核心模型

程序是文件；进程是一次运行所形成的资源与执行实体关系；Linux 内核用任务表示调度实体。一次程序运行可以产生多个线程，每个线程都有自己的执行状态，同时共享一部分资源。

源码不是运行结果本身。一个条件编译分支是否存在、函数是否真正走到，需要结合配置、版本与观测。

## 从 ELF 文件找到正在运行的进程

在有 C 编译器的 Linux 终端新建一个空目录，保存下面的 `identity.c`。ELF 是 Linux 常用的可执行文件格式。编译器先把 C 源码变成目标文件，链接器再把程序和所需运行库的引用组合成可执行文件。

```c
#include <stdio.h>
#include <unistd.h>

int main(void)
{
    printf("PID=%ld\n", (long)getpid());
    fflush(stdout);
    sleep(20);
    return 0;
}
```

```bash
cc -Wall -Wextra -g -O0 -c identity.c -o identity.o
cc identity.o -o identity
readelf -h identity.o | grep -E 'Type:|Machine:'
readelf -h identity | grep -E 'Type:|Machine:'
./identity & child=$!
sleep 1
readlink "/proc/$child/exe"
wait "$child"
```

`-c` 停在编译阶段，`identity.o` 的类型应为 `REL`。链接后的文件可能是 `EXEC`，也可能是支持地址随机化的 `DYN`。程序打印的 PID 应与同一 shell 看到的 `$!` 一致，`exe` 符号链接指向刚编译的文件。再启动一次，比较文件路径和 PID，理解一个文件能对应多次执行。

在一次 x86-64 WSL2 Ubuntu 24.04 的复跑中，目标文件显示 `REL`，可执行文件显示 `DYN (Position-Independent Executable file)`，两者的 `Machine` 都是 x86-64。程序打印 `PID=3370`，对应的 `exe` 链接指回实验目录里的 `identity`。在 RK3576 原生编译时，请保留板上的 `Machine` 行作比较。

**追问一：** 把 WSL 中编译出的程序拷到板上，报 `Exec format error`，先检查什么？分别比较两端的 `uname -m` 和文件的 `Machine`。若宿主是 x86-64，需在 ARM64 板上编译，或在 WSL 用与板上用户空间匹配的交叉工具链重编。

**追问二：** 程序已经打印 PID，却读不到 `/proc/数字/exe`，编译失败了吗？先看它是否已结束，再确认查询在同一个 Linux 实例、同一个 PID 命名空间。进程退出后，磁盘上的 ELF 文件仍可存在。

## 验收

- 能说明可执行文件与进程的区别，编译错误与运行错误的区别。
- 能独立编译 L01，解释同一进程各线程的 `getpid()` 与 `gettid()` 结果。
- 能找到 `task_struct` 定义并解释“每个线程一个任务对象”的含义。
- 提交一份包含预测、命令、输出和待验证问题的记录。

## 卡住时缩小范围

编译失败先分辨缺头文件、缺库、语法错误还是架构不匹配；运行观察不到线程时检查程序是否已经退出。不要把 `pthread_t` 的数值当 Linux TID。

继续：[01 · 任务与调度](tasks.md)。接口依据：[gettid(2)](https://man7.org/linux/man-pages/man2/gettid.2.html)、[pthreads(7)](https://man7.org/linux/man-pages/man7/pthreads.7.html)。
