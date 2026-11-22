# L11 · 为 RK3576 构建最小用户空间

约 2 小时起，首次下载和工具链编译另计。在 WSL2 里构建 AArch64 根文件系统，先在运行中的 RK3576 上验证 BusyBox，再安排独立介质启动。准备一份可读的板厂镜像、串口记录与可用的独立实验空间。

## 在 WSL2 选择构建目标

在 Linux 文件系统里解压并进入一个固定发布版的 Buildroot 源码目录，记录版本与归档校验和。检查宿主构建依赖，运行以下命令。`menuconfig` 中选择 Target Architecture 为 AArch64，启用 BusyBox，选择 tar 根文件系统，保留默认内部工具链。本轮无需为未知板型构建引导程序或内核。[宿主依赖与配置](https://buildroot.org/downloads/manual/manual.html)

```bash
make O="$HOME/br-rk-lab" menuconfig
make O="$HOME/br-rk-lab"
make O="$HOME/br-rk-lab" savedefconfig
file "$HOME/br-rk-lab/target/bin/busybox"
tar -tf "$HOME/br-rk-lab/images/rootfs.tar" | head
sha256sum "$HOME/br-rk-lab/images/rootfs.tar"
```

归档中的文件权限、符号链接与设备条目由镜像生成阶段处理。向板上传输 `images/rootfs.tar`，同时保存输出目录的 `defconfig`。`target/` 用于检查构建结果。

## 在同一块板上只换用户空间

在板上新建**空目录**，确保可用空间足够、所在文件系统允许执行程序，并确认 tar 文件已经传到当前目录。以下步骤需要板上的 root 权限。BusyBox 的 `echo` 可以在无需挂载 proc、sysfs 或 devtmpfs 的情况下验证架构与加载器。

```bash
labroot=$(mktemp -d) || exit 1
sudo tar -xpf rootfs.tar -C "$labroot" &&
sudo chroot "$labroot" /bin/busybox echo 'Buildroot userspace ready'
uname -r
sudo chroot "$labroot" /bin/busybox uname -r
```

预期两次内核 release 一致。`chroot` 改变进程查找文件的根目录，仍在使用已启动的内核。如果 BusyBox 明明存在却报找不到文件，在 WSL 用 `readelf -l` 检查解释器路径，再看目标归档中对应加载器是否存在。若报执行格式错误，核对 ELF 机器类型。

## 验证真实启动

从板厂文档找出本板对独立 SD 卡、USB 或网络根文件系统的支持，保留原有启动项和可恢复镜像。使用同一套内核与 DTB，为独立介质准备根文件系统，并按板级流程选取根设备。通过串口保存内核寻找 root、执行 init、出现控制台的日志。用 `cat /proc/cmdline`、`cat /proc/mounts` 和 `readlink /proc/1/exe` 核实启动结果。一些 BSP 需要外部模块或固件，复用时匹配内核 release 和实际提交。

## 交付与判据

交付 defconfig、归档校验、BusyBox 架构和两份日志。把“在旧内核中运行新用户空间”和“从独立介质启动到新 PID 1”分别记录。若只有第一项成功，报告现有证据与下一处待验证的启动交接点。[回到系统构建路线](system-buildroot.md)
