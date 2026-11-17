# 01 · 任务与调度

**第 2–4 周 · WSL2 为主 · 目标：把任务对象、CPU 时间和事件等待连在一起。**

## 第 2 周：任务与资源

Linux 中每个线程对应一个 `task_struct`。同一线程组的线程在常见用户 API 里看到相同的 PID（TGID），但各自有独立 TID。主线程通常满足 TID = TGID。标识与 PID namespace 有关，不能不加上下文地把内核字段数值当用户可见 ID。

用[L01](lab-pid.md)建立直觉，再画出 task 与地址空间、文件表、信号相关对象的关系。线程之间共享什么由创建方式决定；“线程轻量”不能代替资源共享分析。

源码入口：`include/linux/sched.h`、`kernel/fork.c`。找任务创建、资源复制/共享、退出与回收的边界。先理解 `fork → exec → wait`，再看 clone 标志细节。

## 第 3 周：获得 CPU 的条件

区分“可以运行”和“此刻正在运行”。可运行任务可能正在等待 CPU；被事件阻塞的任务要先满足等待条件。上下文切换保存与恢复执行现场，不等同于系统调用，也不等同于切换地址空间。

实验：启动两个 CPU 密集任务，观察 `ps -L`、`top -H` 与 `taskset` 限制亲和性后的差异。记录宿主负载，避免把 WSL 的观测作为 RK3576 性能结论。

源码入口：`kernel/sched/core.c`、`kernel/sched/fair.c`。先定位 `schedule`、调度类与 runqueue，不从第一行通读。CFS 的公平思想有助于理解历史设计；现代内核的公平类已引入 EEVDF，实际选取逻辑要按版本阅读，不能一概说“总选最小 vruntime”。参见[调度文档](https://docs.kernel.org/scheduler/index.html)。

## 第 4 周：阻塞与唤醒

完成[L02](lab-wait.md)。围绕三个问题追踪：谁检查等待条件，谁发布事件，谁让任务重新获得运行机会？

等待队列负责组织等待者，唤醒不保证立刻获得 CPU。真正恢复执行后通常还要重新检查条件。线程睡眠时用户态函数调用栈仍然存在，内核在合适的位置调度出去。

源码入口：`fs/pipe.c`、`include/linux/wait.h`、`kernel/sched/wait.c`。画出 `read → 条件不满足 → 等待 → write 发布数据 → 唤醒 → 再调度 → read 返回`；再增加 EOF、信号、非阻塞条件。

## 需要交付的三张图

| 图 | 必须回答 |
| --- | --- |
| 对象图 | 哪个 task 拥有哪些资源，哪些资源共享？ |
| 状态图 | runnable、running、sleeping 在什么事件下转换？ |
| 时序图 | 读者、写者、调度器各自何时执行？ |

## 阶段验收

不看笔记解释：同一个进程为什么能同时有多个 TID；一个线程在 `read` 中睡眠时其他线程能否执行；为什么 `wake_up` 后观察到的返回仍可能很晚；为什么 `R` 状态不能证明该任务此刻占用 CPU。

把阻塞读改为非阻塞读并解释错误返回，再制造所有写端关闭的情况解释 EOF。能用观测和源码共同回答，才算完成。调度器数学细节留作拓展，不阻塞后续学习。

接口参考：[/proc/PID/task](https://man7.org/linux/man-pages/man5/proc_pid_task.5.html)、[pipe(7)](https://man7.org/linux/man-pages/man7/pipe.7.html)。
