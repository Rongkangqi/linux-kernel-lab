# 官方资料与源码入口

以一手资料为主，按阶段查阅。最新文档用于理解当前接口；分析某个实验时以对应版本的文档和源码为准。以下是阅读入口，不要求全部通读。

## 用一个具体问题选资料

假设你刚读到「`read` 返回 0」，想知道管道读端发生了什么。先从接口的可观察语义读起，再转到运行版本的实现。

1. 查 `pipe(7)` 的读写语义：还有写端且暂时没有数据时，阻塞读可等待；写端都关闭且缓冲已空时，读端获得 EOF。这里默认请求读取的长度大于零。[Linux 管道手册](https://man7.org/linux/man-pages/man7/pipe.7.html)
2. 在自己固定的内核树打开 `fs/pipe.c`。从 `pipe_read` 附近找「有数据」「还有写者」「允许睡眠」三个判定，逐个和试验条件对应。源码版本写进笔记。[Linux v6.12 管道实现](https://github.com/torvalds/linux/blob/v6.12/fs/pipe.c)
3. 用 [L02](lab-wait.md) 的读写两端改变一个条件，保留返回值或 trace。现在你有接口依据、这版代码可能经过的分支，以及这次运行观察到的结果。

**为什么最新内核文档说有某个事件，板上却找不到？** 查板上的 `uname -r`、内核配置和 tracefs 的 `available_events`，再到本版源码找定义。文档解释可用接口，板上清单回答这次构建暴露了哪些接口。

**查资料什么时候可以停？** 能为眼前的具体判断找到对应接口或源码，并能说出用哪条观测验证，就可以回到实验。例如证明 EOF 只需控制写端和剩余数据，暂时不必读完整个调度器。

## 内核总入口

- [Linux 官方文档](https://docs.kernel.org/)：按主题检索。
- [Linux 源码仓库](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/)：固定 tag/SHA 后阅读。
- [开发流程](https://docs.kernel.org/process/development-process.html)：理解补丁、讨论与评审。
- [Linux man-pages](https://man7.org/linux/man-pages/)：核对用户 API 的语义和错误条件。

## 任务、并发与内存

- [调度文档](https://docs.kernel.org/scheduler/index.html)：公平调度、EEVDF 与其他调度类。
- [锁与同步](https://docs.kernel.org/locking/index.html)：先看 locktypes，再看具体原语。
- [内存屏障](https://docs.kernel.org/core-api/wrappers/memory-barriers.html)：进阶主题，配合模型和源码阅读。
- [内存管理](https://docs.kernel.org/mm/index.html)、[管理员 MM 指南](https://docs.kernel.org/admin-guide/mm/index.html)：机制与观测两种视角。
- [proc 文件系统](https://docs.kernel.org/filesystems/proc.html)：核对统计字段。

## I/O、驱动与调试

- [VFS](https://docs.kernel.org/filesystems/vfs.html)、[块层](https://docs.kernel.org/block/index.html)、[网络](https://docs.kernel.org/networking/index.html)。
- [驱动 API](https://docs.kernel.org/driver-api/index.html)、[设备树 bindings](https://docs.kernel.org/devicetree/bindings/index.html)。
- [DMA API](https://docs.kernel.org/core-api/dma-api-howto.html)、[DMA-BUF](https://docs.kernel.org/driver-api/dma-buf.html)。
- [Tracing](https://docs.kernel.org/trace/index.html)：选择实际可用事件，理解开销和丢事件。

## ARM64 与虚拟平台

- [Arm A-profile 学习资料](https://www.arm.com/architecture/learn-the-architecture/a-profile)。
- [Arm 异常模型](https://developer.arm.com/documentation/102412/latest)。
- [Arm 内存管理](https://developer.arm.com/documentation/101811/latest)。
- [Linux ARM64 文档](https://docs.kernel.org/arch/arm64/index.html)。
- [QEMU virt](https://www.qemu.org/docs/master/system/arm/virt.html)。
- [BusyBox 官方站](https://busybox.net/)、[Buildroot 手册](https://buildroot.org/downloads/manual/manual.html)：准备用户空间，选一条可复现路径。

## Rockchip 与平台

- [RK3576 产品资料](https://www.rock-chips.com/a/en/products/RK35_Series/2024/1212/2033.html)。
- [RK3588 产品资料](https://www.rock-chips.com/a/en/products/RK35_Series/2022/0926/1660.html)。
- [上游 Rockchip 设备树目录](https://github.com/torvalds/linux/tree/master/arch/arm64/boot/dts/rockchip)：动态入口，报告改用提交链接。
- [Rockchip MPP](https://github.com/rockchip-linux/mpp)：与板上库版本配套核对。
- 板厂 BSP、原理图与恢复手册：需要按你实际的开发板补入，当前不假设板型。

## 参考书如何使用

经典内核书可帮助形成框架，但其中调度器、锁、VMA 容器、驱动 API 和 ARM 启动细节可能与现版本不同。用书建立问题，用源码与实验确认当前答案。主线阶段不需要为了“准备充分”购买大量书籍。

## RISC-V、系统构建与全志平台

- 在[RISC-V 特权架构规范](https://docs.riscv.org/reference/isa/priv/priv-index.html)查异常原因与地址转换，在[Linux RISC-V 启动文档](https://docs.kernel.org/arch/riscv/boot.html)核对入口参数。
- [嘉楠 K230 SDK](https://github.com/kendryte/k230_sdk)提供经典双系统源码与镜像规则。配套实验见 [L12](lab-k230.md)。
- [Buildroot 手册](https://buildroot.org/downloads/manual/manual.html)覆盖工具链、defconfig、rootfs overlay 和 BR2_EXTERNAL。[Armbian 文档](https://docs.armbian.com/)用于核对板型与镜像。
- [V821](https://www.allwinnertech.com/index.php?c=product&id=136)、[V861](https://www.allwinnertech.com/index.php?a=index&c=product&id=148)、[F101](https://www.allwinnertech.com/index.php?a=index&c=product&id=155)分别查规格，配合所用板卡、固件与 SDK 取证。
