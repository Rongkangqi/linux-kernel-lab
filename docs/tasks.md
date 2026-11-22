# 01 · 任务与调度

**第 2–4 周 · RK3576 实测，WSL2 可复现 · 目标：把任务对象、CPU 时间和事件等待连在一起。**

## 第 2 周：任务与资源

Linux 中每个线程对应一个 `task_struct`。同一线程组的线程在常见用户 API 里看到相同的 PID（TGID），但各自有独立 TID。主线程通常满足 TID = TGID。标识与 PID namespace 有关，不能不加上下文地把内核字段数值当用户可见 ID。

用[L01](lab-pid.md)建立直觉，再画出 task 与地址空间、文件表、信号相关对象的关系。线程之间共享什么由创建方式决定；“线程轻量”不能代替资源共享分析。

源码入口：`include/linux/sched.h`、`kernel/fork.c`。找任务创建、资源复制/共享、退出与回收的边界。先理解 `fork → exec → wait`，再看 clone 标志细节。

### fork、exec 和 wait 各改变什么

以 shell 启动普通前台程序为例，可用这个模型理解过程：父进程先 `fork` 出子进程，子进程取得新的 PID；随后子进程调用 `execve` 装入目标程序，成功后保留进程身份，但用户地址空间换成新程序；父进程用 `wait` 系列接口取得子进程退出状态。实际 shell 也可能用其他创建接口实现这个语义。

再和 L01 对照。`pthread_create` 给 Linux 增加一个可独立调度的 task，新线程加入同一线程组，并与其他线程共享地址空间和文件描述符表。于是同一进程可有不同的栈和寄存器现场，且能共同读写同一块堆内存。一个线程阻塞时，另一个线程是否继续执行，要看另一个线程自己的状态、依赖和可用 CPU。

## 第 3 周：获得 CPU 的条件

区分“可以运行”和“此刻正在运行”。可运行任务可能正在等待 CPU；被事件阻塞的任务要先满足等待条件。上下文切换保存与恢复执行现场，不等同于系统调用，也不等同于切换地址空间。

实验：启动两个 CPU 密集任务，观察 `ps -L`、`top -H` 与 `taskset` 限制亲和性后的差异。记录宿主负载，避免把 WSL 的观测作为 RK3576 性能结论。

源码入口：`kernel/sched/core.c`、`kernel/sched/fair.c`。先定位 `schedule`、调度类与 runqueue，不从第一行通读。CFS 的公平思想有助于理解历史设计；现代内核的公平类已引入 EEVDF，实际选取逻辑要按版本阅读，不能一概说“总选最小 vruntime”。参见[调度文档](https://docs.kernel.org/scheduler/index.html)。

## 第 4 周：阻塞与唤醒

完成[L02](lab-wait.md)。围绕三个问题追踪：谁检查等待条件，谁发布事件，谁让任务重新获得运行机会？

等待队列负责组织等待者，唤醒不保证立刻获得 CPU。真正恢复执行后通常还要重新检查条件。线程睡眠时用户态函数调用栈仍然存在，内核在合适的位置调度出去。

源码入口：`fs/pipe.c`、`include/linux/wait.h`、`kernel/sched/wait.c`。画出 `read → 条件不满足 → 等待 → write 发布数据 → 唤醒 → 再调度 → read 返回`；再增加 EOF、信号、非阻塞条件。

## 算一算读线程到底在等什么

在板上开一个终端，运行下面的命令。`$!` 是刚启动的后台任务 PID。读 `status` 时，`sleep` 通常已经处于 `S`（可中断睡眠），`voluntary_ctxt_switches` 记录任务自愿交出 CPU 的累计次数。一次采样也可能撞上启动窗口，重复运行核对。

```bash
sleep 4 & sleeper=$!
sleep 1
grep -E '^(Name|State|voluntary_ctxt_switches):' "/proc/$sleeper/status"
wait "$sleeper"
```

一次 WSL2 采样读到 `Name: sleep`、`State: S (sleeping)`、`voluntary_ctxt_switches: 1`。这三项说明当时的状态和累计切换次数；要确定哪一刻切出、谁唤醒任务，还需事件时间戳。

换成阻塞读管道，等的是数据或写端状态。下面是用于练习的同一时钟时间线（单位 ms）。假设只跟踪一个读线程，没有中途再次阻塞。

| 时刻 | 读线程的事件 |
| --- | --- |
| 10 | 在 `read` 中等待，调度切出 |
| 18 | 写者发布数据，读者收到 `sched_wakeup` |
| 21 | `sched_switch` 的 `next_pid` 是读者 TID |
| 22 | `read` 返回 |

10 到 18 共 8 ms 在等事件，18 到 21 的 3 ms 已可运行但还没上 CPU，最后 1 ms 包含恢复执行和返回。抄录实际 trace 时同时看 TID、时间戳和事件名；CPU 迁移后同一任务的事件可能分布在不同 CPU 列。

**追问一：** 已看到 `wakeup`，能把后面的 3 ms 算作读者运行时间吗？不能。第一次切入读者的记录才是重新获得 CPU 的证据。

**追问二：** 写者退出了，为什么读者还在睡？检查其他进程是否还持有管道写端，例如 `fork` 后父进程忘关副本。所有写端关闭、现存数据读尽后，阻塞读才以零字节表示 EOF。

## 需要交付的三张图

| 图 | 必须回答 |
| --- | --- |
| 对象图 | 哪个 task 拥有哪些资源，哪些资源共享？ |
| 状态图 | runnable、running、sleeping 在什么事件下转换？ |
| 时序图 | 读者、写者、调度器各自何时执行？ |

## 阶段验收

不看笔记解释：同一个进程为什么能同时有多个 TID；一个线程在 `read` 中睡眠时其他线程能否执行；为什么 `wake_up` 后观察到的返回仍可能很晚；为什么 `R` 状态不能证明该任务此刻占用 CPU。

非阻塞读空管道时，仍有写端且没有数据通常得到 `-1` 和 `errno=EAGAIN`，表示稍后可再试。若所有写端都已关闭且数据已读尽，则 `read` 返回 0。另一个线程可以在读者睡眠时继续获得 CPU，两者各有独立的 `task_struct`。把两种返回都记录进时序图，再用 `fs/pipe.c` 核对等待条件。

接口参考：[/proc/PID/task](https://man7.org/linux/man-pages/man5/proc_pid_task.5.html)、[pipe(7)](https://man7.org/linux/man-pages/man7/pipe.7.html)。
