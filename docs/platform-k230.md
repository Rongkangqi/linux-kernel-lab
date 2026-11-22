# K230 开发板与 SDK

在 RK3576 上完成一次进程、缺页与中断观察后，带同一个问题进入 K230。先确定手里这块板运行的镜像，再决定能在哪个核上观察 Linux。

## 确认启动的软件组合

嘉楠经典 `k230_sdk` 的 Linux + RT-Smart 配置将 Linux 放在小核，RT-Smart 放在大核。SDK 将两边的源码、固件和镜像分开。嘉楠另有独立 Linux SDK。记录仓库、提交、板级 defconfig、编译目标、启动日志与登录的串口。同名 SoC 上不同镜像可能给出不同结果。Linux-only SDK 也要核对实际 CPU 节点与在线列表。可以从 [CanMV 固定版本的 defconfig](https://github.com/kendryte/k230_linux_sdk/blob/83d829db083f6432515b663aa363c1e5d005cf71/buildroot-overlay/configs/k230_canmv_defconfig) 找出内核提交，回到对应树查板级 DTS。[经典 SDK 与目录说明](https://github.com/kendryte/k230_sdk) · [K230 Linux SDK](https://github.com/kendryte/k230_linux_sdk)

## 先画出 hart 和内存归属

hart 是 RISC-V 软件可见的硬件执行线程。在所用 SDK 找启动入口、传入的设备树以及内存布局。给 Linux、固件和第二个系统分别标出可确认的 hart 与物理内存范围。用串口日志、CPU 在线列表和设备树核实这张图。只拿到一侧日志时，另一侧写成待验证。

## 选择能回答问题的实验

| 问题 | 观察方法 | 可交付的证据 |
| --- | --- | --- |
| 用户进程第一次写匿名页，哪段代码处理？ | 运行与 RK3576 相同的小程序，查本板内核的异常入口 | 计数差值、两份源码路径 |
| 固件交给 Linux 什么？ | 对照启动日志、镜像构建规则和内核入口 | 标出 hart ID 和 DT 地址的交接图 |
| 两个系统怎样协作？ | 在双系统镜像中选一个已有通信示例，读共享内存布局和通知接口 | 一次消息的生产者、消费者、地址范围与完成条件 |

在报告开头写清 Linux 实际看见的 CPU 数。研究 Linux 多核调度时用已确认多个 CPU 在线的配置。继续读[RISC-V 异常与地址空间](arch-riscv.md)和[K230 启动实验](lab-k230.md)。
