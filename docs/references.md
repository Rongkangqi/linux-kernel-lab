# 官方资料与源码入口

以一手资料为主，按阶段查阅。最新文档用于理解当前接口；分析某个实验时以对应版本的文档和源码为准。以下是阅读入口，不要求全部通读。

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
