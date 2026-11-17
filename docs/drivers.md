# 06 · 内核如何管理硬件

**第 20–23 周 · QEMU → RK3576 · 目标：把驱动接口与硬件资源、缓冲区生命周期连接起来。**

## 第 20 周：设备模型与设备树

复习 bus、device、driver、match、probe。设备树描述硬件及其连接，不直接执行初始化代码。`compatible`、`reg`、`interrupts`、`clocks`、`resets`、`power-domains`、`iommus` 等属性要按对应 binding 和父节点规则解释。

选一个已经工作的外设，画 DT 节点→平台设备→匹配表→probe→资源获取。源码入口：`drivers/base/`、`drivers/of/`、目标驱动；绑定文件在 `Documentation/devicetree/bindings/`。未知属性查 schema，不猜 cells 含义。

## 第 21 周：资源、IRQ 与电源

追踪资源何时申请、何时启用、失败如何回滚、移除时何时停止硬件。`devm_*` 帮助管理资源释放，但不能替代停止 DMA、取消异步工作或保证回调不再访问已释放对象。

整理 clock、reset、regulator、power domain 和 runtime PM 的依赖。检查 probe defer 的原因：依赖资源尚未可用，并不等于目标设备永久不支持。比较“有设备节点”“驱动绑定成功”“硬件真正工作”三种证据。

## 第 22 周：DMA 与地址

完成[L07](lab-dma.md)。把 CPU 虚拟地址、CPU 物理地址、设备 DMA 地址分别画出。IOMMU 存在并被使用时可提供设备侧地址转换；**DMA 地址不能普遍假设等于物理地址**。

比较 coherent 分配与 streaming mapping，标出 DMA 方向、mapping error、CPU/设备所有权转换与 unmap。Cache coherent 也不消除所有顺序要求。依据：[Linux DMA 指南](https://docs.kernel.org/core-api/dma-api-howto.html)。

## 第 23 周：DMA-BUF 与同步

DMA-BUF 是跨驱动/设备共享缓冲区的框架，围绕 exporter、importer、attach、map、CPU access 等角色理解。它不自动证明零拷贝、格式兼容或设备写入已完成。把缓冲区共享、设备地址映射、缓存维护、完成同步分别分析。

理解 dma-fence 与 dma-resv 在同步中的角色。源码入口：`drivers/dma-buf/`、`include/linux/dma-buf.h`、目标驱动实际调用点。参考：[DMA-BUF 文档](https://docs.kernel.org/driver-api/dma-buf.html)。

## 阶段交付

一份设备资源依赖图、一份 probe/失败/移除生命周期表、一份缓冲区提交与回收时序。每条 DMA API 都要能说出调用者、方向、有效期、失败处理与同步前提。

## 阶段验收

回答：为什么不能把 `malloc` 的指针写进设备寄存器；`devm` 是否意味着任何时刻都可直接退出；DMA-BUF fd 相同是否说明两个设备看到相同 IOVA；一次超时后立即释放缓冲区有什么风险。

代码实验先在可恢复的环境进行。板上寄存器读写、解绑驱动、改时钟或替换 DTB 都应先准备串口日志和恢复介质；本课程的首次实机实验以只读取证为主。
