# WSL2 的位置与边界

WSL2 适合先学习通用 Linux 机制。PID/TID、管道等待、mmap、fork、文件与 socket 等实验不需要使用 RK3576 的专有硬件。

## 能在这里学什么

用户态 C 与线程、系统调用、`/proc`、GDB、strace、源码导航、交叉编译和文档记录。把工具用熟后，再把问题迁移到可控 QEMU 内核与真实开发板。

## 需要另一个环境的情况

WSL 的运行内核、虚拟硬件、模块和 trace 功能与开发板不同。自定义 ARM64 启动、GIC/PSCI、Rockchip 时钟/复位、外设寄存器、DMA master 与 MPP 实机链路，不能仅凭 WSL 的结果验证。

如果需要自定义调试配置和故障注入，优先在 QEMU 启动自己编译的内核。前期不用为了学习任务与内存而先替换 WSL 内核。

## 架构必须实际检查

```bash
# uname 报告运行内核的机器架构，file -L 检查当前用户空间 shell 的 ELF 架构。
uname -m
file -L /bin/sh
```

WSL 的架构取决于宿主环境。x86_64 WSL 可以交叉编译 AArch64，也能用 QEMU 软件模拟，但这不把它变成真实 Cortex-A72。指令集行为、微架构性能和 SoC 外设需要不同层次的验证。

## 同一个终端里的内核和文件来自哪里

运行 `pwd` 看当前目录，再执行下面的只读命令。第一组分清系统层次；第二组查文件落在哪个挂载点。读 `df` 时找 `Type` 和 `Mounted on` 两列。

```bash
# 把发行版名称和 WSL 所用 Linux 内核版本分别记录。
grep '^PRETTY_NAME=' /etc/os-release
uname -r
# df -T 显示主目录所在文件系统的类型，再和已挂载的 Windows 盘对照。
df -T "$HOME"
test ! -d /mnt/c || df -T /mnt/c
```

若第一组显示 Ubuntu 24.04 和带有 WSL 标识的内核 release，它们分别回答「命令和库来自哪个发行版」「系统调用进入哪一个内核」。第二组可能显示家目录和 Windows 盘用了不同的文件系统。做[文件 I/O 实验](lab-io.md)时固定目录，才方便解释冷、热缓存等变化。一次跨挂载点的耗时差无法把原因定位到磁盘硬件。

**为什么 WSL 看得见 `/proc/interrupts`，却对不上板子的设备树？** 文件由当前内核生成。在 WSL 读到的对象属于虚拟机；要为 RK3576 外设标注 IRQ，需在板端采样。

**板子没接好，今天能完成什么？** 在 WSL 编译 L01 并对照三个线程号，或者跑 L02 的读写条件实验，把平台填为 WSL2。板上补测时复用相同源码，分别保留两份输出。

## 开始顺序

[环境基线](environment.md) → [L01](lab-pid.md) → [L02](lab-wait.md) → [L04](lab-memory.md)。遇到 WSL 配置限制时记录限制，继续不受影响的用户态实验。

官方资料：[Microsoft WSL 文档](https://learn.microsoft.com/windows/wsl/)。
