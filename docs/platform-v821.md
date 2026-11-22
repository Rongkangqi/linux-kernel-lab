# V821 · 追踪 Linux 与实时核的资源分工

**第 33–34 周。** 拿一个外设或一块共享内存，查清由哪个核初始化、谁能访问，以及 Linux 能看到其中哪一段。这是把 K230 上学到的异构系统知识迁移到另一种 RISC-V 实现的第一步。

## 先认清板上的两个核

全志 V821 产品页以 V821L2-WXX 为例，列出一个 RISC-V CPU、一个 RISC-V MCU，以及 Tina Linux 和 FreeRTOS。Avaota F1 的 SyterKit 板级适配列出 Andes A27L2 和玄铁 E907。在这块板上，从运行 Tina Linux 的应用核追外设驱动，再到 E907 的 RTOS 工程查另一侧。使用其他子型号时先记下板号、SDK 版本、所选板级配置和实际装载的固件。[全志 V821 产品规格](https://www.allwinnertech.com/index.php?a=index&c=product&id=136) · [SyterKit 板级支持表](https://github.com/YuzukiHD/SyterKit)

## 第 33 周的位置图

在能正常启动的 Tina 镜像上保存串口日志。在 Linux shell 运行下面的只读命令，记录内核标识、运行设备树和当前 Linux 在线 CPU 列表。

```sh
uname -a
tr '\000' '\n' < /sys/firmware/devicetree/base/compatible
cat /sys/devices/system/cpu/online
cat /proc/cpuinfo
```

在同版 SDK 找到 Linux 内核、应用 ELF、RTOS 固件和板级配置。用对应工具链的 `readelf -h` 检查一个应用 ELF，用运行日志核对固件是否装载。把“文件是什么架构”“哪个镜像包含它”“哪个核实际执行它”分别记下。Linux 显示的在线 CPU 数只能回答调度器管理了多少逻辑 CPU。

## 第 34 周的共享内存实验

1. 在 SDK 的板级设备树中查 `reserved-memory`，选择一块文档明确用途的区域。全志示例中有供两核通信的 `e907_rpbuf_reserved`，自己的版本可能使用其他名称。[V821 SDK 系统资源配置](https://docs.aw-ol.com/v821/software/sdk_sys_conf/)
2. 分别在 Linux 和 RTOS 工程查这一块区域的起始地址、大小和使用者。按父节点的地址单元数解码 `reg`，再与实际运行的设备树或启动日志核对。记录地址单位及所处的地址空间。
3. 若 SDK 带能正常运行的核间通信示例，发送一条带序号的短消息，保存两端收发记录。手头只有 Linux 日志时，把实时核接收端列为待验证，并标出下一步需要哪个固件日志或 SDK 回调。

## 验收

交付一张图，标出两颗核、各自的系统、选择的共享区、收发双方和完成通知。用不同线型区分源码声明和运行记录。答辩时解释一个反例：即使启动配置中已预留共享区，接收端仍可能尚未启动。什么证据能区分这两种状态？

下一步在 [V861](platform-v861.md) 上学习 Linux 如何跨核调度，再用 [L13 中断与时间线](lab-allwinner.md)验证一个外设事件。
