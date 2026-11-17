# L01 · 亲眼观察 PID / TID

**环境：WSL2 / 任意常见 Linux · 约 60 分钟 · 前置：会编译 C。** 本实验不依赖 RK3576 特性。

## 运行前先预测

一个主线程创建两个线程：会有几个 PID？几个 TID？`pthread_self()` 与 `gettid()` 是同一个接口吗？把答案写下来再运行。

## 准备程序

在自己的实验目录新建 `pid_threads.c`，保存下面的完整观察程序。它会保留约 30 秒，便于另一个终端查看。

```c
#define _GNU_SOURCE
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <pthread.h>

static void *worker(void *arg)
{
    const char *name = arg;
    printf("%s: pid=%ld tid=%ld\n", name,
           (long)getpid(), (long)gettid());
    sleep(30);
    return NULL;
}

int main(void)
{
    pthread_t a, b;
    setbuf(stdout, NULL);
    printf("main: pid=%ld tid=%ld\n",
           (long)getpid(), (long)gettid());
    int rc = pthread_create(&a, NULL, worker, "worker-a");
    if (rc != 0) { fprintf(stderr, "%s\n", strerror(rc)); return 1; }
    rc = pthread_create(&b, NULL, worker, "worker-b");
    if (rc != 0) {
        fprintf(stderr, "%s\n", strerror(rc));
        pthread_join(a, NULL);
        return 1;
    }
    pthread_join(a, NULL);
    pthread_join(b, NULL);
    return 0;
}
```

```bash
cc -Wall -Wextra -g -O0 -pthread pid_threads.c -o pid_threads
./pid_threads &
pid=$!
ps -L -p "$pid" -o pid,tid,stat,comm
ls "/proc/$pid/task"
grep -E 'Name|State|Tgid|Pid|Threads' "/proc/$pid/status"
wait "$pid"
```

以上命令放在同一个终端顺序执行；也可在第二个终端手动填入输出中的 PID。程序退出后 `/proc` 目录消失是正常行为。

## 应当看到什么

成功创建两个线程时共三个 task：`getpid()` 结果相同，各线程 TID 不同，主线程的 TID 与进程 PID 相同。`/proc/PID/task` 列出这三个 TID。打印先后次序可能不同，这不影响线程身份。

`pthread_t` 是线程库的标识类型，不应该把它当成 Linux TID；不要依靠把它强制转换成整数后的值推导内核任务 ID。

## 回到源码

在锁定的内核源码中找 `include/linux/sched.h` 的 `task_struct`，只记录标识、状态、`mm`、`files` 等字段的职责。再查 `kernel/fork.c`，理解创建线程与共享资源的关系。实际 namespace 转换通过内核 helper 处理，入门时先限定在同一 PID namespace 内观察。

## 改一个条件

把其中一个线程的休眠时间改成 5 秒，重复观察 `/proc/PID/task` 的数量变化；再用 `fork()` 创建子进程，对照 PID 和地址空间模型。不要仅凭输出顺序判断调度策略。

## 验收与提交

提交程序、编译命令、一次完整输出和一张 task/资源关系图。能解释“一个进程三个任务”与“同一 PID 不代表同一线程”，再标记完成。

依据：[gettid(2)](https://man7.org/linux/man-pages/man2/gettid.2.html)、[/proc/PID/status](https://man7.org/linux/man-pages/man5/proc_pid_status.5.html)。下一实验：[L02](lab-wait.md)。
