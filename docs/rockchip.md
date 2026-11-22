# 07 · 把知识落到 RK3576

**第 24–27 周 · RK3576 实机 · 目标：从“芯片参数”走向有证据的系统结构。**

## 第 24 周：建立自己的板卡事实

完成[L08](lab-board.md)。记录板型、硬件版本、内核/BSP 来源、DTB、启动介质、串口参数和恢复方式。未知字段保持未知，不从网上相似板卡复制答案。

区分上游 Linux、Rockchip BSP 与板厂定制。相同版本字符串不保证相同补丁和驱动行为；有些功能可能只在特定 BSP 中可用。实际支持情况要依据启动日志、驱动绑定、可运行样例和对应提交。

## 第 25 周 · 构建用户空间并核对 CPU 与内存

完成 [L11](lab-rootfs.md) 的构建与 chroot 部分，记录 ELF 架构、归档、运行内核版本。用第 1 周的程序作对照。

RK3576 集成 4 个 Cortex-A72 与 4 个 Cortex-A53；从[厂商产品页](https://www.rock-chips.com/a/en/products/RK35_Series/2024/1212/2033.html)和实际 DT/拓扑交叉确认。学习大小核组合时区分 ISA、微架构、容量、频率与调度策略，不能只凭主频排序所有工作负载。

画 SoC 地图：CPU 核与缓存、DDR 控制器、GIC、互连、IOMMU 与一个媒体设备。对每条连接注明资料出处；没有公开资料的互连细节只写推断，不补造图。

使用 `/sys/devices/system/cpu/` 中可用的 topology、cache 和 cpufreq 信息对照文档。缓存层次、频率策略和节点布局以当前系统为准。不要为了测频率直接禁用热保护或电源管理。

### 读懂一份 CPU 调频策略表

一个 `cpufreq policy` 描述由同一个调频策略管理的一组 CPU。先列出本板在线 CPU，再读策略与核心的关系。脚本只取已有节点，缺失字段保留为未知。

```bash
cat /sys/devices/system/cpu/online
for p in /sys/devices/system/cpu/cpufreq/policy*; do
    [ -r "$p/related_cpus" ] || continue
    printf '%s manages ' "${p##*/}"
    cat "$p/related_cpus"
    [ ! -r "$p/scaling_driver" ] || cat "$p/scaling_driver"
done
```

假设某次读到 `policy0 manages 0 1 2 3`，你能得出“这四个逻辑 CPU 在同一调频策略集合中”。这条输出没有给出 Cortex 型号、缓存共享范围或哪个核更快。接着用 `tr '\000' '\n' < /sys/devices/system/cpu/cpu0/of_node/compatible` 寻找实现标识，并到 `cpu0/cache/index*/shared_cpu_list` 核对缓存拓扑。若 CPU 设备未导出 `of_node`，从运行设备树的 `/cpus` 节点读 `compatible`，核对 `reg` 与逻辑 CPU 的映射后再贴标签。

**自测一：** 为何 `online` 只列 6 个 CPU，芯片规格仍可能是八核？比较同目录的 `possible`、`present` 与 `offline`，再查启动日志。固件描述、内核限制或热插拔状态均可能影响数量。

**自测二：** 按频率最高的一组标为 A72，就能解释任务慢吗？还需确认核型及任务实际运行的 CPU，控制负载和温度，记录频率及时间。只有同一负载的可重复测量才支持性能结论。

## 第 26 周：追一个外设的依赖

选串口、I²C 或媒体设备中的一个，整理引脚复用、时钟、复位、电源域、IRQ 和 IOMMU。沿 DT 引用追到提供者驱动，解释资源为何在 probe 中获取，何时启动和停止。

把“无日志”“probe defer”“IRQ 不增长”“已提交但等待超时”分别映射到假设树。先排查依赖和软件路径，再考虑硬件异常。调试阶段保留正常基线，不同时改很多 DT 属性。

## 第 27 周 · 独立介质启动与迁移

依本板文档完成 [L11](lab-rootfs.md) 的独立启动验收。沿串口日志找到内核挂载根设备和启动用户进程的位置。

选读[RK3588 对照](platform-compare.md)，选 CPU、GIC/中断描述、时钟电源、媒体/IOMMU 四个维度比较。重点是判断通用机制如何迁移，哪些寄存器、驱动和固件依赖必须重新验证，不要求购买第二块板。

准备综合项目时优先使用板厂已经验证的媒体样例和输入，先建立成功基线，再做 trace。不要假设所有 MPP 版本都使用同一设备节点和 ioctl 路径。

## 阶段验收

别人能凭你的文档找到：所用 BSP 提交、实际 DT 节点、驱动匹配入口、IRQ 观察、时钟/电源依赖和一个可运行用例。你能解释一条 CPU→内存→设备→IRQ→任务的链路，并指出尚未验证的部分。

参考源码：[上游 RK3576 DTS](https://github.com/torvalds/linux/blob/master/arch/arm64/boot/dts/rockchip/rk3576.dtsi)是动态参考；正式报告需改用你锁定的提交链接，不能用 master 作为复现版本。
