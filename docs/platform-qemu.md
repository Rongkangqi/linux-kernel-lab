# QEMU ARM64 平台

QEMU 提供可重复启动、暂停和调试的 ARM64 实验环境。课程选择 `virt` 虚拟板，而不是模拟一个真实 RK3576 开发板。

## 它解决什么问题

可以使用自己的内核配置，保留符号，在 GDB 中停住启动路径，实验异常、页表、调度与驱动框架。坏配置通常不会影响 WSL 主系统；保留正常 Image/rootfs 后可快速重新启动。

## 它不能证明什么

QEMU virt 的设备、地址、中断与时钟不等于 Rockchip SoC。所选 CPU 模型提供相应架构能力，不代表精确还原 Cortex 的流水线、分支预测、Cache 时延与真实性能。跨 ISA 模拟通常依赖软件翻译，不能套用同架构硬件虚拟化的加速假设。

## 建议实验集

1. 用[L06](lab-qemu.md)启动最小 ARM64 内核与 rootfs。
2. 保存 `.config`、vmlinux、Image 和完整启动参数。
3. GDB 断在 `start_kernel`，找到异常向量与页表相关代码。
4. 使用明确配置观察 GIC 和 SMP；比较一核与两核时的 CPU/IRQ 输出。
5. 逐步启用 tracing、lockdep 等调试能力，记录额外开销。

## 不编内核也能先看虚拟硬件

设备树（DT）是传给内核的硬件描述。QEMU 的 `virt` 可以把这份描述写成二进制 DTB。下面在新的实验目录操作，需要 `qemu-system-aarch64` 和 `dtc`（Ubuntu 的 `device-tree-compiler` 包）。

```bash
mkdir -p ~/kernel-lab/experiments/virt-dt
cd ~/kernel-lab/experiments/virt-dt
qemu-system-aarch64 -machine virt,dumpdtb=two.dtb -cpu cortex-a57 -smp 2 -m 512 -nographic
dtc -I dtb -O dts -o two.dts two.dtb
grep -nE 'cpu@|device_type = "cpu"' two.dts
```

`-machine virt` 选虚拟板，`-cpu` 选 CPU 模型，`-smp 2` 请求两个虚拟 CPU，`-m 512` 配置 512 MiB 内存。指定 `dumpdtb` 后，QEMU 写出描述即退出。找两个带 `device_type = "cpu"` 的节点，再将输出名字改成 `one.dtb`、核数改成 1 重做，反编译新文件比较 CPU 节点数。[QEMU virt 文档](https://www.qemu.org/docs/master/system/arm/virt.html)

**看到两个节点，已经证明 Linux 调度过两个线程了吗？** 这说明虚拟硬件公布了两个 CPU。启动来宾后看 `/sys/devices/system/cpu/online`，要观察某个线程真的在哪里运行，再看调度记录。

**能用这份 DTB 启动 RK3576 吗？** 真板的内存映射、中断控制器和外设资源由 SoC 与电路板决定。可以复用读 CPU 节点的方法，板上启动时使用对应板型的 DTB。

## 到实机的迁移

任务、VFS、地址转换框架等通用知识可以迁移；启动固件、寄存器、设备树、clock/reset/power 驱动和媒体路径必须对照 RK3576。把同一问题分别放到虚拟平台与实机上，能帮助判断是通用机制还是平台集成问题。

参考：[QEMU ARM virt 官方说明](https://www.qemu.org/docs/master/system/arm/virt.html)。
