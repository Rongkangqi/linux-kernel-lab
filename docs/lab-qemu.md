# L06 · 启动自己的 ARM64 内核

**环境：Ubuntu / WSL2 + QEMU · 首次约 3 小时以上。** 构建和下载耗时取决于机器。以下方案使用交叉编译，不修改 WSL 正在运行的内核。

RK3576 主线把本页用作早期启动调试选修。真板串口与运行设备树见 [L08](lab-board.md)，K230 的固件交接见 [L12](lab-k230.md)。

## 固定输入与检查资源

先完成[工具安装](environment.md)。确认交叉编译器、QEMU、GDB 可用，检查磁盘余量。源码使用已锁定的 Linux v6.12 教学基线；保存实际 SHA 和配置。rootfs 需要 **AArch64 用户程序**，不能把 x86 可执行文件塞进去。

## 构建内核

在 Linux 源码目录执行，`O` 输出目录与源码分开。先使用 4 个编译作业，内存不足时降低。

```bash
make ARCH=arm64 CROSS_COMPILE=aarch64-linux-gnu- O=../out-arm64 defconfig
make ARCH=arm64 CROSS_COMPILE=aarch64-linux-gnu- O=../out-arm64 -j4 Image
```

为 GDB 增加调试信息时，使用同一个输出目录的 `menuconfig` 检查 `CONFIG_DEBUG_INFO` 相关选项并重新构建。具体菜单取决于版本；保留 `vmlinux`，不要只保留压缩/裸 Image。

## 用 BusyBox 准备最小 initramfs

从[BusyBox 官方下载页](https://busybox.net/downloads/)选择一个固定发布包，记录版本和校验值并解压到独立目录。在 BusyBox 源码目录执行：

```bash
make ARCH=arm64 CROSS_COMPILE=aarch64-linux-gnu- defconfig
make ARCH=arm64 CROSS_COMPILE=aarch64-linux-gnu- menuconfig
# 在 Settings 中启用 Build static binary (no shared libs)
make ARCH=arm64 CROSS_COMPILE=aarch64-linux-gnu- -j4
make ARCH=arm64 CROSS_COMPILE=aarch64-linux-gnu- CONFIG_PREFIX="$HOME/kernel-lab/rootfs-arm64" install
file "$HOME/kernel-lab/rootfs-arm64/bin/busybox"
```

确认 `file` 显示 AArch64 且静态链接；若编译报兼容性错误，保留版本/日志并解决，不继续打包错误架构文件。另一条可行路线是使用固定版本的 Buildroot 生成 rootfs，但不要把两套未核实步骤混在一起。

新建 `~/kernel-lab/rootfs-arm64/init`：

```sh
#!/bin/sh
mount -t proc proc /proc
mount -t sysfs sysfs /sys
mount -t devtmpfs devtmpfs /dev
exec </dev/console >/dev/console 2>&1
echo "ARM64 kernel lab ready"
exec /bin/sh
```

在 Ubuntu 中打包（目录需要是你新建的实验 rootfs）：

```bash
cd ~/kernel-lab/rootfs-arm64
mkdir -p dev proc sys tmp
chmod +x init
find . -print0 | cpio --null -o --format=newc | gzip -9 > ../rootfs-arm64.cpio.gz
```

内核需包含 initramfs、gzip 解压、proc/sysfs、devtmpfs 和 PL011 控制台支持；在生成的 `.config` 中核对，不把所有版本的 defconfig 视为相同。

启动前在 WSL 核对三件物品。`Image` 是 QEMU 加载的内核，`vmlinux` 为 GDB 提供这一构建的符号，归档包含内核运行的第一个用户程序及其解释器。`/init` 挂好 devtmpfs 后重新打开 `/dev/console`，即使归档里没有预制控制台设备节点，shell 也能从串口读写。

```bash
out="$HOME/kernel-lab/src/out-arm64"
grep -E '^CONFIG_(BLK_DEV_INITRD|RD_GZIP|DEVTMPFS|PROC_FS|SYSFS|BINFMT_ELF|BINFMT_SCRIPT|SERIAL_AMBA_PL011_CONSOLE)=y' "$out/.config"
gzip -dc ~/kernel-lab/rootfs-arm64.cpio.gz | cpio -it | grep -E '^(\./)?(init|bin/(sh|busybox))$'
file "$out/vmlinux" ~/kernel-lab/rootfs-arm64/bin/busybox
```

## 启动

假定上述内核输出位于 `~/kernel-lab/src/out-arm64`，文件名按你的真实位置调整：

```bash
qemu-system-aarch64 \
  -machine virt,gic-version=3 -cpu cortex-a72 -smp 2 -m 1024 \
  -nographic \
  -kernel ~/kernel-lab/src/out-arm64/arch/arm64/boot/Image \
  -initrd ~/kernel-lab/rootfs-arm64.cpio.gz \
  -append 'console=ttyAMA0 rdinit=/init nokaslr'
```

看到提示符后运行 `uname -m`、`cat /proc/cpuinfo`、`cat /proc/interrupts`。`Ctrl+A` 后按 `X` 退出 QEMU。QEMU virt 是通用虚拟板，以上地址布局不适用于 RK3576。x86 主机模拟 ARM64 使用软件翻译，不能拿结果评估 Cortex-A72 的真实 IPC 或 Cache 时延。

客体内再运行 `cat /proc/cmdline` 和 `readlink /proc/1/exe`。前者应包含传入的 `rdinit=/init`，后者通常指向 BusyBox，因为脚本最后用 `exec` 把自己替换成 shell，保留了 PID 1。内核日志可依次找控制台初始化、解包 initramfs 和运行 init 的线索。若能看到内核日志却不能在 shell 输入，先区分日志输出与用户进程的标准输入是否都连到控制台。

## GDB 与启动断点

在启动命令末尾加 `-S -gdb tcp:127.0.0.1:1234`，QEMU 会暂停。第二终端执行：

```bash
gdb-multiarch ~/kernel-lab/src/out-arm64/vmlinux
# GDB 内
target remote 127.0.0.1:1234
hbreak start_kernel
continue
```

需要带符号的 `vmlinux`，地址随机化通过此实验中的 `nokaslr` 关闭；生产环境不照搬此参数。启动早期优先使用硬件断点，避免向尚未映射的内核虚拟地址插入软件断点。断点不命中时先核对是否相同构建、符号、架构和连接端口。参见 [QEMU GDB 说明](https://www.qemu.org/docs/master/system/gdb.html)。

## 故障定位与验收

1. GDB 命中 `start_kernel` 就说明已经执行 `/init` 吗？**参考解释**：此时 CPU 正执行通用内核初始化，用户空间尚未运行。用 `bt` 看调用栈，再 `continue`，到串口出现实验标志后取 PID 1 的证据。
2. 串口提示无法执行 `/init`，但 `cpio -it` 列出了它，下一步是什么？**参考解释**：检查执行位、首行是否使用 Unix 换行、`/bin/sh` 链接及其 BusyBox 目标，然后确认 ELF 架构和加载器。路径存在只解决了查找入口这一个条件。

`No working init found` 检查 `/init`、权限、解释器路径、架构与静态链接；无控制台输出检查串口和控制台配置；内存不足降低并发和 QEMU 内存需求。

提交构建版本、配置、rootfs 版本、启动命令、日志、断点截图或文本。解释进入 `start_kernel` 前后哪些工作属于架构初始化，哪些属于通用内核。此流程是课程实验方案，未承诺适用于所有工具版本或未知主机配置。

参考：[QEMU virt](https://www.qemu.org/docs/master/system/arm/virt.html)、[ARM64 启动协议](https://docs.kernel.org/arch/arm64/booting.html)。
