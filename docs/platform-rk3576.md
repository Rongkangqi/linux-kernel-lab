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
