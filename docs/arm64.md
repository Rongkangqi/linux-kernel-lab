# 05 · 走进 ARM64 处理器

**第 15–19 周 · RK3576 真板，K230 架构对照 · 目标：连接指令执行、异常、地址转换与多核系统。**

## 先分清四层

**架构**定义软件可见的规则；**CPU 微架构**实现流水线、执行和缓存等；**SoC**集成 CPU、内存控制器和外设；**开发板**增加存储、供电与连接。AArch64、Cortex-A72、RK3576、某块 RK3576 板分别位于这些层次。

不要把 Cortex 核的数据手册当成 Rockchip 外设寄存器手册，也不要用 QEMU virt 的地址去操作 RK3576。

## 第 15–16 周：异常级与启动

学习通用寄存器、PC/SP、PSTATE、系统寄存器与异常向量，区分同步异常、IRQ、FIQ、SError。EL0–EL3 是权限与功能框架，不是所有系统都会把每级都以同一种软件布局使用。普通应用通常在 EL0，常见内核运行在 EL1；虚拟化或 VHE 等配置需要另查。

保存 RK3576 正常启动的串口日志，查找内核版本、CPU 和控制台初始化。想在第一行日志前停住内核时，可用 [L06](lab-qemu.md) 在 QEMU 中单步。从 `arch/arm64/kernel/head.S` 追到 `start_kernel`，标记进入内核时的启动协议、页表准备、栈与 MMU 状态。区分 Boot ROM、固件、引导加载器和 Linux 自身负责的工作。

## 第 17 周：MMU 与 TLB

学习页粒度、VA/PA、页表项权限与属性、TTBR、TCR、MAIR 的职责。先按选定配置推演一条 VA 的索引与偏移，再核对实际页大小和地址位数；不能默认所有 ARM64 系统都是 4KB 页和相同页表层数。

MMU 执行地址转换与权限检查，TLB 缓存转换结果。修改页表后的同步与 TLB 维护有架构规则；TLB miss 和 page fault 不是同义词。源码入口：`arch/arm64/mm/`、`arch/arm64/include/asm/pgtable*.h`。

## 第 18 周：Cache、一致性、顺序

画出三张图：缓存层次；多核共享数据的一致性；软件要求的访问先后关系。Cache coherent 不能替代锁或内存屏障，也不能自动覆盖系统中每个 DMA master。区分指令/数据缓存、Normal/Device 内存属性与设备寄存器访问。

把“CPU 看到旧值”“设备看到旧缓冲区”“寄存器访问顺序错误”列为三个假设，分别寻找需要的同步机制。拓展阅读 DMB/DSB/ISB，但驱动优先使用 Linux 提供的 I/O、DMA 和锁接口，不能随手插一条屏障当通用修复。

## 第 19 周：GIC、定时器与多核

理解本地与共享中断、IRQ 路由、CPU interface 与分发职责。通过实际 DTS 和配置核对 GIC 版本；PSCI 提供固件接口，参与 CPU 启停和电源管理；IPI 用于核间通知，它们与调度器分工不同。

源码入口：`drivers/irqchip/irq-gic-v3.c`（适用于匹配 GICv3 的平台）、`drivers/firmware/psci/`、`arch/arm64/kernel/smp.c`。对照 QEMU 生成的 DT 与 RK3576 的 DT，不复制硬件编号。

## 阶段验收

完成 [L10](lab-fault.md) 对照两种架构的异常入口，做 [L12](lab-k230.md) 区分固件、hart 和操作系统。交付启动日志、内核配置、一张异常入口图、一张 VA→PA 图、一张 GIC/CPU/设备图。能说明 syscall 和外设中断为何都能进入内核，但触发源与路径不同；能解释 Cache flush 与 TLB invalidate 的区别。

一手资料：[Arm A-profile 学习路径](https://www.arm.com/architecture/learn-the-architecture/a-profile)、[异常模型](https://developer.arm.com/documentation/102412/latest)、[内存管理](https://developer.arm.com/documentation/101811/latest)、[ARM64 启动协议](https://docs.kernel.org/arch/arm64/booting.html)。
