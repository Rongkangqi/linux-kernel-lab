# 对照 RK3588 学迁移

比较芯片的目的，是训练识别“架构通用机制”和“具体实现差异”。不要求购买 RK3588 开发板，先用官方资料与固定源码做对照。

## 对照表

| 维度 | RK3576 | RK3588 | 要验证的问题 |
| --- | --- | --- | --- |
| CPU 核组合 | 4 × Cortex-A72 + 4 × Cortex-A53 | 4 × Cortex-A76 + 4 × Cortex-A55 | ISA 能力、微架构和调度容量如何分别描述？ |
| Linux 通用对象 | task/mm/file 等 | 同样使用通用框架 | 哪些语义跨平台保持，哪些实现依版本变化？ |
| SoC 集成 | 按 RK3576 DT/BSP | 按 RK3588 DT/BSP | IRQ、clock/reset、IOMMU、PM 如何重新核对？ |
| 媒体路径 | 以当前 BSP 支持为准 | 以当前 BSP 支持为准 | 用户 API 相近时，底层硬件与驱动是否相同？ |

CPU 组合来源：[RK3576 官方产品页](https://www.rock-chips.com/a/en/products/RK35_Series/2024/1212/2033.html)、[RK3588 官方产品页](https://www.rock-chips.com/a/en/products/RK35_Series/2022/0926/1660.html)。不要把 CPU 代际差异直接等同于某个负载的性能倍数。

## 做一次文档实验

在同一上游提交或注明各自 BSP 提交下，对照两份 SoC `.dtsi`。选择 CPU、一个中断控制节点、一个外设和 IOMMU/电源域引用，整理 compatible、资源和提供者。表格每一格都填文件位置或资料出处。

再为一段通用驱动逻辑标记：哪些是 Linux API，哪些依赖 SoC 数据表，哪些依赖板级连接。若要移植，列出需要重新验证的启动、IRQ、DMA、时钟、电源和缓存前提。

## 读两份真实的 I²C 描述

Linux v6.16 的两份 SoC 设备树都把一个控制器标成 `i2c0`。读取该标签下的 `compatible`、`reg` 和 `status`，先只比较源码里直接写出的三个属性。[RK3576 设备树](https://github.com/torvalds/linux/blob/v6.16/arch/arm64/boot/dts/rockchip/rk3576.dtsi) · [RK3588 基础设备树](https://github.com/torvalds/linux/blob/v6.16/arch/arm64/boot/dts/rockchip/rk3588-base.dtsi)

| 阅读位置 | RK3576 | RK3588 | 可以得到的结论 |
| --- | --- | --- | --- |
| 节点名与寄存器窗口起点 | `i2c@27300000` | `i2c@fd880000` | 同名控制器在两颗 SoC 上位于不同地址 |
| 第一个 compatible | `rockchip,rk3576-i2c` | `rockchip,rk3588-i2c` | 各自声明最具体的硬件身份 |
| 后续 compatible | `rockchip,rk3399-i2c` | `rockchip,rk3399-i2c` | 都声明兼容已有的硬件接口，可以继续查同一份驱动匹配表 |

在这两份 SoC 描述中控制器默认关闭。到板级 DTS 搜 `&i2c0`，检查该板是否启用它、使用哪一组引脚，以及是否描述了外接器件。地址和 compatible 取自源码，板上实际绑定需要运行设备树、sysfs 与日志证明。

**共同的 compatible 到底复用了什么？** Linux 驱动可以按这个字符串选择对应实现，随后从各自的设备节点取地址、中断与时钟。移植时要核实这些具体资源以及板级走线。

**有 IOMMU 就可以跳过 DMA 的同步吗？** IOMMU 解决设备地址映射与访问控制。CPU 与设备何时可安全读写同一缓冲区，还要看 DMA API、平台一致性和本次传输是否完成。两种机制回答了不同的问题。[DMA API 说明](https://docs.kernel.org/core-api/dma-api-howto.html)

## 答辩与参考判断

对照上面的 I²C0，说明哪些字段决定驱动候选、哪些字段提供这块硬件的资源，再解释为什么两颗 ARM64 芯片仍需各自的 DTB。参考判断是：CPU 指令集相同允许复用相应架构的软件接口，控制器的地址、中断、时钟和板级电气连接仍要逐项匹配。

交付 2–3 页比较报告，明确文档结论与实机测量的区别。没有第二块板时，不报告自己未测得的性能数据。
