# L07 · DMA 地址与生命周期

**环境：RK3576 对应 BSP 源码，先静态阅读再实机观测 · 约 120 分钟。** 不直接操作寄存器，不通过猜地址验证。

## 选取一个真实调用点

先在对应 BSP 中搜索，可能因版本和驱动框架出现不同接口：

```bash
rg -n 'dma_alloc_coherent|dma_map_sg|dma_map_single' drivers
rg -n 'dma_buf_attach|dma_buf_map_attachment|dma_buf_begin_cpu_access' drivers
```

选择一个与板上已工作的设备有关的路径，记录设备、驱动、源码提交与配置。搜索命中不证明实际运行，一定要把 DT、绑定驱动和用例对上。

## 画两个地址视角

CPU 使用虚拟地址，经 CPU MMU 到物理地址；设备使用 DMA 地址，可能经 IOMMU 到物理内存。IOMMU 不存在或旁路时也不能不经 API 就假设总线地址等于 CPU 物理地址。具体关系由平台决定。

对每个变量标注类型：`void *`、`phys_addr_t`、`dma_addr_t`、sg_table、用户态指针或 fd。不要把 fd 当内存地址，不用 `virt_to_phys` 绕过 DMA API 的要求。

## 画一条所有权时间线

申请/导入 → 映射给设备 → CPU 填写或同步 → 提交 → 设备访问 → 完成事件 → CPU 再访问 → 解除映射/释放。真实顺序按 API 类型与方向核对，不机械套用每一步。

记录：谁负责 map/unmap；是否检查失败；是否可能多设备共享；何时允许 CPU 访问；超时/取消/移除后如何确保硬件不再访问；scatter-gather 映射前后条目数如何正确使用。

## 区分四个问题

| 问题 | 要找的机制 |
| --- | --- |
| 设备能够寻址这段内存吗？ | DMA mask、映射、IOMMU |
| CPU 和设备看见的数据正确吗？ | DMA API 的一致性/同步规则 |
| 设备是否已经处理完？ | IRQ、状态、fence 或驱动完成协议 |
| 对象是否还活着？ | 引用、队列状态、取消与释放顺序 |

## 实机观察与验收

只运行已验证的正常用例，记录对应设备 IRQ 的变化和可用日志。若驱动没有暴露地址或同步信息，保持“源码推断”标注，不为了获得数值直接读取受限物理内存。

提交地址图、生命周期表、正常与超时路径的分析。解释 coherent 不代表所有访问无需排序，DMA-BUF 不自动意味着设备已完成，IOVA 也不天然在不同设备域中相同。

依据：[DMA API 指南](https://docs.kernel.org/core-api/dma-api-howto.html)、[DMA-BUF](https://docs.kernel.org/driver-api/dma-buf.html)。
