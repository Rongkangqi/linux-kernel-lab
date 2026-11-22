# RK3576 架构阅读地图

RK3576 是本路线的主力实机平台。它把 ARM CPU 核与内存、互连、中断控制、媒体、显示及其他外设集成在一个 SoC 中。

## 四层阅读法

| 层次 | 你要问什么 | 主要资料 |
| --- | --- | --- |
| AArch64 / Arm 架构 | 异常、权限、地址转换规则是什么？ | Arm Architecture / 学习材料 |
| Cortex-A72 / A53 | 核心执行与 Cache 有什么特性？ | 对应核的技术参考手册 |
| RK3576 SoC | 外设、中断、地址、时钟与电源怎样连接？ | Rockchip 芯片资料、binding、驱动 |
| 你的开发板 | 引脚、存储、供电、启动介质如何配置？ | 板厂原理图、板卡手册、BSP |

厂商资料确认其 CPU 组合为 **4 × Cortex-A72 + 4 × Cortex-A53**。更细的缓存、互连和外设能力请按资料版本与实际 BSP 核对，不从相近型号推断支持情况。[RK3576 产品页](https://www.rock-chips.com/a/en/products/RK35_Series/2024/1212/2033.html)

## 走一次证据链：Linux 怎么知道这块板上有哪几种 CPU？

在 RK3576 终端读运行中的设备树，再对照 Linux 启用的 CPU。设备树的 `compatible` 是一个可以含多个字符串的属性，各字符串以空字节结尾；`tr` 用空格把它们分开。读不到目录时，先检查镜像是否导出了设备树，再用该镜像对应的 DTB 离线查看。

```sh
tree=/sys/firmware/devicetree/base
for cpu in "$tree"/cpus/cpu@*; do
    [ -r "$cpu/compatible" ] || continue
    printf '%s ' "${cpu##*/}"
    tr '\000' ' ' < "$cpu/compatible"
    printf '\n'
done
cat /sys/devices/system/cpu/online
```

若某一行含 `arm,cortex-a72`，它说明固件传入的树将这个节点描述为 Cortex-A72。若 `online` 返回 `0-7`，表示当前 Linux 有八个逻辑 CPU 在线。把两项放进不同列：前者是硬件描述，后者是运行状态。要进一步回答线程在哪个核上实际运行，还需调度事件的 CPU 列。DT 节点名里的单元地址不宜直接作为 Linux 的逻辑 CPU 编号。

**产品页说有八核，板上只看到四个怎么办？** 先比较 `/sys/devices/system/cpu/{possible,present,online}` 的内容，分别了解内核可能支持、当前识别和当前在线的集合，再对照启动日志、内核配置与固件给出的 CPU 节点。三个集合的差异可以缩小排查范围。

**一个任务在某个 A72 上用时更短，能归因于核型吗？** 先把频率、温度、允许的 CPU 和后台负载固定或记录，再用相同输入重复测量。核型只是候选因素之一。

## 六条阅读线

1. **CPU 与调度：** 核心拓扑、capacity、频率和热管理如何影响任务放置。
2. **内存：** CPU VA/PA、DDR、缓存一致性与设备 DMA 地址如何连接。
3. **中断：** 设备事件如何经控制器进入 CPU，怎样唤醒等待者。
4. **资源：** clock/reset/pinctrl/regulator/power domain 的依赖和生命周期。
5. **固件：** Boot ROM、loader、可信固件、U-Boot 与 Linux 的职责边界。
6. **媒体：** MPP 用户库、驱动、DMA-BUF、硬件队列与完成同步。

## 源码取证

先在自己的 BSP 中列出相关文件：

```bash
git ls-files '*rk3576*'
rg -n 'rockchip,rk3576|arm,cortex-a72|arm,cortex-a53' arch/arm64/boot/dts
```

主线参考：[rk3576.dtsi](https://github.com/torvalds/linux/blob/master/arch/arm64/boot/dts/rockchip/rk3576.dtsi)。这个链接会变化；用实际 SHA 固定后才能作为实验基线。通用阅读基线 v6.12 与 RK3576 平台支持不是同一个选择，不预设该标签包含所有平台文件。

## 开始实机前

完成[L08](lab-board.md)档案；知道串口、正常启动镜像和恢复方式。首轮只读观察。没有公开 TRM 时可以先用厂商简要资料、运行 DT、binding 和驱动建立地图，但明确哪些寄存器细节尚未确认。

验收重点是解释一个真实设备的完整依赖与数据路径，不是背出所有参数。
