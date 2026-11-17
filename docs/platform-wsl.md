# WSL2 的位置与边界

WSL2 适合先学习通用 Linux 机制。PID/TID、管道等待、mmap、fork、文件与 socket 等实验不需要使用 RK3576 的专有硬件。

## 能在这里学什么

用户态 C 与线程、系统调用、`/proc`、GDB、strace、源码导航、交叉编译和文档记录。把工具用熟后，再把问题迁移到可控 QEMU 内核与真实开发板。

## 需要另一个环境的情况

WSL 的运行内核、虚拟硬件、模块和 trace 功能与开发板不同。自定义 ARM64 启动、GIC/PSCI、Rockchip 时钟/复位、外设寄存器、DMA master 与 MPP 实机链路，不能仅凭 WSL 的结果验证。

如果需要自定义调试配置和故障注入，优先在 QEMU 启动自己编译的内核。前期不用为了学习任务与内存而先替换 WSL 内核。

## 架构必须实际检查

```bash
uname -m
file /bin/sh
```

WSL 的架构取决于宿主环境。x86_64 WSL 可以交叉编译 AArch64，也能用 QEMU 软件模拟，但这不把它变成真实 Cortex-A72。指令集行为、微架构性能和 SoC 外设需要不同层次的验证。

## 开始顺序

[环境基线](environment.md) → [L01](lab-pid.md) → [L02](lab-wait.md) → [L04](lab-memory.md)。遇到 WSL 配置限制时记录限制，继续不受影响的用户态实验。

官方资料：[Microsoft WSL 文档](https://learn.microsoft.com/windows/wsl/)。
