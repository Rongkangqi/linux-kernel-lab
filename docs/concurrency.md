# 02 · 并发与中断

**第 5–7 周 · 用户态建立模型，QEMU 中验证内核行为。** 前置：任务状态与等待/唤醒。

## 第 5 周：先问“现在在哪个上下文”

区分任务上下文、硬中断、softirq、线程化中断和 workqueue。不要仅凭函数名判断是否允许睡眠，要结合调用路径、持锁状态与内核配置。普通 workqueue 的回调运行在工作线程中，也需要遵守自己的锁与生命周期约束。

先做上下文表，列出：由谁触发、能否被抢占、是否允许阻塞、共享对象如何保护。再在 QEMU 中观察 `/proc/interrupts` 与可用 trace 事件；WSL 没有开放相应功能时记录限制即可。

源码入口：`kernel/irq/`、`kernel/softirq.c`、`kernel/workqueue.c`。研究一个事件从 IRQ 到延迟处理的路径，暂不展开所有软中断类型。

## 第 6 周：锁保护的到底是什么

先定义不变量，例如“队列中的元素数量与计数器一致”，再列出所有访问路径。单核也会发生抢占与中断并发；关闭本 CPU 的中断不能替代跨 CPU 的互斥。

完成[L03](lab-lock.md)。比较普通读改写、C 原子操作和互斥锁。用户态数据竞争实验不能用于推导 C 语言保证以外的行为。

内核中的 mutex、spinlock、raw_spinlock、原子操作、refcount、RCU 各有适用前提；不要背“一个永远睡眠、一个永远自旋”的绝对口号。**PREEMPT_RT 会改变部分锁类型的语义**，本阶段先按明确配置分析，再对照 RT 文档。参见[锁类型及规则](https://docs.kernel.org/locking/locktypes.html)。

## 第 7 周：事件、生命周期与可见性

把 waitqueue、completion、workqueue 分开：它们分别解决等待者组织、一次性/计数式完成通知、把工作交给工作线程等问题；都不能自动解决对象释放过早。重点分析取消工作、超时、设备移除与回调正在执行的竞态。

内存序解决访问顺序和可见性，原子性解决操作不可分割；它们不是同一个概念。`volatile` 不能当作线程同步。先用 acquire/release 的发布与消费模型理解，再读[内存屏障文档](https://docs.kernel.org/core-api/wrappers/memory-barriers.html)。

## 一份锁审查记录

对一个队列写下：共享字段、读者、写者、执行上下文、锁顺序、允许睡眠的位置、引用从哪里获得和释放。然后人为加入“超时同时完成”和“设备移除同时回调”两个场景，检查是否遗漏路径。

源码入口：`include/linux/mutex.h`、`include/linux/spinlock.h`、`include/linux/completion.h`、`include/linux/refcount.h`。运行内核实验前启用可控 QEMU 的调试配置，错误实验不要放在日常工作环境或唯一可用开发板上。

## 阶段验收

能解释锁保护的不变量，指出一次丢失更新；能说明 wakeup、锁和内存屏障分别解决什么；能对一个 IRQ→workqueue→等待线程链路标注上下文与资源生命周期。给出锁顺序反例，并解释为什么加更多锁也可能导致死锁。

拓展方向：lockdep、KCSAN、RCU、优先级反转与 PREEMPT_RT。先做到能识别问题，再追算法与实现。
