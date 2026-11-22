# 环境与版本基线

WSL2 Ubuntu 24.04 用作构建主机，RK3576 从第 1 周运行实验。系统发行版版本、正在运行的 Linux 内核版本、你阅读的源码版本是三个独立信息，必须分别记录。

## 第一次环境检查

以下 Linux 命令在 Ubuntu 终端中执行。`wsl` 命令只在 Windows PowerShell 执行。

```powershell
# 在 Windows 的 PowerShell 中查看发行版名称和 VERSION 列，确认本次启动的是 WSL 2。
wsl --list --verbose
```

```bash
# 发行版由根文件系统提供；uname 报告当前内核。把两者分别记下来。
cat /etc/os-release
uname -a
uname -m
# 查询本机基础页大小，稍后计算逐页访问的步长。
getconf PAGE_SIZE
# 检查当前 PATH 是否能找到编译、跟踪和脚本工具。
command -v cc git make strace python3
# 源码、实验、笔记和产物分别存放，方便复用同一内核基线。
mkdir -p ~/kernel-lab/{src,experiments,notes,artifacts}
```

`uname -m` 用来确认实际架构；不要因为以后学习 ARM64 就假设 WSL 当前也是 ARM64。把输出存入自己的环境笔记，站点不会代替你检测本机。

## 安装学习工具

以下操作会安装软件、占用磁盘并需要 sudo。只在决定使用这些实验工具时执行；可先安装基础组，架构阶段再装交叉工具链。

```bash
# 先刷新软件索引，再安装本机编译、内核配置和调试依赖。
sudo apt update
sudo apt install build-essential git ripgrep strace gdb python3 \
  pkg-config bc bison flex libssl-dev libelf-dev libncurses-dev
# 需要交叉编译或 QEMU 调试时执行
# 额外安装 AArch64 交叉工具链、多架构 GDB、QEMU 及制作早期根文件系统的工具。
sudo apt install gcc-aarch64-linux-gnu gdb-multiarch \
  qemu-system-arm cpio xz-utils busybox-static
```

`busybox-static` 在 x86 Ubuntu 上通常是宿主架构构建，不能直接放进 ARM64 rootfs。ARM64 根文件系统的准备见[L06](lab-qemu.md)。某些 perf、trace 或模块实验依赖运行内核配置，安装用户态命令不等于内核功能已经可用。

## 源码基线

通用机制可以选用 **Linux v6.12 作为固定阅读基线**，这是课程的教学选择，不表示它是最新版本，也不表示它完整支持你的 RK3576 板。真实行为优先对照正在运行的内核或 BSP。

```bash
# 在源码目录固定到 v6.12 教学基线，浅克隆只取所选版本附近的提交。
cd ~/kernel-lab/src
git clone --depth 1 --branch v6.12 \
  https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git linux-v6.12
cd linux-v6.12
# 把实际提交号记入实验笔记，之后才能定位完全相同的函数与行号。
git rev-parse HEAD
```

下载可能较大，先检查网络和可用空间。ARM64 构建、rootfs 与 BSP 会进一步占用空间；保留足够余量，不把 Windows 或板卡原始启动分区当临时目录。

## 一份实验需要哪些版本信息

| 项目 | 记录方式 |
| --- | --- |
| 用户环境 | `/etc/os-release`、工具版本 |
| 运行内核 | `uname -a`、可获得时保存配置 |
| 阅读/编译源码 | 仓库 URL、分支、完整 commit SHA、是否有本地改动 |
| 编译环境 | 编译器版本、ARCH、CROSS_COMPILE、`.config` |
| 虚拟平台 | QEMU 版本、完整启动命令、rootfs 构建版本 |
| 开发板 | 厂商、板型、硬件版本、BSP、DTB、启动介质 |

不能拿上游源码行号解释未知 BSP，也不能把 `uname -r` 相同当成源码完全相同。

## 读懂架构、工具链和产物的三种输出

在 WSL 的 Linux 终端执行。`file -L` 会跟随符号链接读到可执行文件；`-dumpmachine` 让编译器报告其默认目标。若交叉编译器尚未安装，先记录前三行。

```bash
# uname 看运行内核，file 跟随 /bin/sh 的链接查看用户态 ELF。
uname -m
file -L /bin/sh
# 比较本机 cc 和交叉编译器各自默认的目标三元组。
cc -dumpmachine
command -v aarch64-linux-gnu-gcc && aarch64-linux-gnu-gcc -dumpmachine
```

举例来说，同一台主机可以依次报告 `x86_64`、`ELF 64-bit ... x86-64`、`x86_64-linux-gnu` 和 `aarch64-linux-gnu`。前三项描述当前内核可见架构、现有程序与本机编译目标。最后一项表示交叉编译器能在此处生成 ARM64 程序。编译后，用 `readelf -h ./pid_threads` 的 `Machine` 核实这一个文件；板上执行时，再查板端 `uname -m`。

**Ubuntu 24.04 能告诉我应该读哪一个内核提交吗？** 它标识用户空间发行版。`uname -r` 给运行内核的 release，BSP 或发行包记录才能进一步关联源码提交、配置和补丁。

**板上明明看得到程序，运行却说找不到，先查什么？** 先确认路径。若是动态 ELF，在 WSL 用 `readelf -l ./程序名` 查 `Requesting program interpreter`，再去板上核实该绝对路径的加载器。若报 `Exec format error`，先核对 ELF 的 `Machine` 和目标系统架构。

## 目录约定

建议 Linux 源码和编译放在 WSL 的 Linux 文件系统，例如 `~/kernel-lab`。网站仓库可以单独克隆；源码构建产物、板卡镜像、日志原件不要直接提交到网站仓库。

```text
kernel-lab/
  src/           固定版本的源码
  experiments/   小程序与实验脚本
  notes/         你的解释与实验记录
  artifacts/     日志、配置、trace，按实验分目录
```

遇到工具缺失先记录报错，再判断是包未安装、权限不足、内核配置缺失还是平台不支持。能在用户空间完成的实验先继续，内核专用功能移到可控的 QEMU 环境。

## 把第一个程序带到 RK3576

在板上运行 `uname -m` 确认是 AArch64 Linux。对于兼容的 Debian/Ubuntu 用户空间，可在 WSL 安装 `gcc-aarch64-linux-gnu`，进入保存了 [L01 源码](lab-pid.md)的目录，编译静态测试程序。板厂 SDK 可使用其提供的编译器和 sysroot。

```bash
# 从主机构建 AArch64 静态程序；-pthread 启用线程支持，-g 保留符号。
aarch64-linux-gnu-gcc -Wall -O0 -g -static -pthread pid_threads.c -o pid_threads
# 上板前先确认 ELF 架构和静态链接方式。
file pid_threads
```

用板上已配置的 SSH 或可移动介质传入程序。在板端实验目录运行 `chmod +x pid_threads` 和 `./pid_threads`，用第二个板端终端观察任务。板上若有编译器也可传源文件直接构建。先确认 ps、strace 等工具及选项可用。系统集成阶段转到 [Armbian 与 Buildroot](system-buildroot.md)。
