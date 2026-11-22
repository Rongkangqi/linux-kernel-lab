# L12 · 在 K230 上定位启动交接

约 90 分钟。用已经能正常启动的 K230 镜像、一份匹配的 SDK 源码和串口日志。在记录中写明 SDK 目标、板型、固件与内核版本。

## 从镜像规则预测运行位置

在经典 SDK 中读顶层 Makefile 和所选配置，查找 `little-core-opensbi`、`big-core-opensbi`、镜像打包规则。记录它们的输入文件、payload 和启用条件。对每个核预测最早能观察到的固件标识和系统入口。使用其他 SDK 时从其打包脚本重新建表。[经典 SDK 构建规则](https://github.com/kendryte/k230_sdk/blob/main/Makefile)

## 在 Linux 控制台核对

取得启动日志，标注第一条可见固件信息、Linux 启动、内存范围与控制台。确认当前登录的是 Linux 后运行以下只读命令。固件可关闭日志，未看到 banner 时改用镜像规则作旁证。

```sh
uname -a
cat /sys/devices/system/cpu/online
cat /proc/cpuinfo
cat /proc/iomem
tr '\000' '\n' < /sys/firmware/devicetree/base/compatible
```

若系统未导出设备树，从镜像对应的 DTB 入手，同时注明 bootloader 可能修订过设备树。`cpu/online` 记录 Linux 当前调度得到的逻辑 CPU；hart ID、Linux CPU 编号与开发板串口号分别保留。

## 追一次固件到内核的交接

在所用版本的 `arch/riscv/kernel/head.S` 定位早期入口。按 RISC-V Linux 启动约定核对 `a0` 中的 hart ID 与 `a1` 中的设备树地址，注明你使用的启动方式与依据。沿 DT 的 memory 和 reserved-memory 节点找出 Linux 可用范围与保留区，把源码预计范围与板上日志放在图的两侧。[Linux RISC-V 启动约定](https://docs.kernel.org/arch/riscv/boot.html)

## 验收与下一步

交付一张包含“镜像 → 固件 → 目标核 → OS → 内存范围”的图，每一条连线写明来自构建配置、代码还是启动日志。解释为什么 SoC 的核数与 Linux 在线 CPU 数可能不同。随后用 [L10](lab-fault.md) 检查相同用户程序在新架构上的行为。
