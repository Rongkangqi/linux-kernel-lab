# 从 ARM64 进入 RISC-V

第 15–19 周与 [ARM64 章节](arm64.md)配套阅读。先用 RK3576 解释一次缺页，再把同一程序放到 K230。目标是找出第一个依赖架构的处理步骤，以及两条路径第一次使用同一段 Linux 代码的位置。

## 把软件职责对应起来

| 要回答的问题 | ARM64 阅读入口 | RISC-V 阅读入口 |
| --- | --- | --- |
| 普通进程与内核以什么权限执行？ | 常见 Linux 用户态 EL0，内核 EL1 | 常见 Linux 用户态 U，内核 S，机器级固件可运行在 M |
| 如何找到异常向量与异常原因？ | VBAR_EL1、ESR_EL1，相关异常查 FAR_EL1 | stvec、scause，相关异常查 stval，sepc 保存返回相关位置 |
| 地址转换由谁配置？ | TTBR、TCR 描述根表和转换设置 | satp 包含地址转换模式与根页表信息，模式需核实 |
| 修改映射后如何维护转换缓存？ | 读内核 TLB 维护例程及 TLBI | 查本地 SFENCE.VMA 与远端 hart 的同步路径 |

表中名称是查阅手册的索引。区分处理器实现了什么、固件委托了什么、当前内核实际启用了什么。用户态程序用系统调用进入内核，在常见 S 模式配置中，内核还可通过 SBI 调用固件提供的服务。[RISC-V 特权架构规范](https://docs.riscv.org/reference/isa/priv/priv-index.html) · [RISC-V SBI 规范](https://github.com/riscv-non-isa/riscv-sbi-doc)

## 沿一次匿名写缺页阅读源码

在固定版本里，从 `arch/arm64/mm/fault.c` 和 `arch/riscv/mm/fault.c` 找当前版本的页错误处理路径。标出异常原因如何解码、VMA 权限在哪里判定、哪一步进入 `handle_mm_fault`，以及处理成功后如何回到发生异常的指令。交付两条调用链，每条都注明提交和文件位置。[Linux v6.12 ARM64](https://github.com/torvalds/linux/blob/v6.12/arch/arm64/mm/fault.c) · [Linux v6.12 RISC-V](https://github.com/torvalds/linux/blob/v6.12/arch/riscv/mm/fault.c)

## 手解一次 store page fault

trap 指执行流因为异常或中断而转到处理程序。假定某个 RISC-V Linux 进程在可写匿名映射中第一次执行 `sb a1,0(a0)`，即把寄存器 a1 的低八位写到 a0 指向的虚拟地址。下面是专为解码练习构造的 S 模式 trap 现场。

| 字段 | 教学值 | 读法 |
| --- | --- | --- |
| `scause` | `0x0f` | 最高位为 0，属于同步异常。原因码 15 是 store/AMO page fault。 |
| `sepc` | `0x10120` | 此例中指向执行写操作的指令。 |
| `stval` | `0x40002000` | 此例中硬件提供了导致异常的访存虚拟地址。 |

Linux 需要两类信息才能决定能否重试。先根据原因码识别写访问，再用访存地址找到覆盖它的 VMA（描述一段虚拟地址及其权限的内核对象）。若映射允许写，通用内存管理代码可准备页面并建立页表项，返回用户态后重新执行同一条写指令。在 v6.12 源码中查 `arch/riscv/kernel/traps.c` 的 `do_page_fault`，再追到 `arch/riscv/mm/fault.c` 的 `handle_page_fault` 和通用接口 `handle_mm_fault`。[Linux v6.12 RISC-V trap 入口](https://github.com/torvalds/linux/blob/v6.12/arch/riscv/kernel/traps.c)

**自测：只看原因码 15，能判定本次会成功重试吗？** 还须知道这个地址是否属于允许写入的映射，以及页错误的处理结果。若手头只有用户态程序输出，保留这条路径作为候选。用匹配内核的源码定位分支，在支持跟踪的镜像上核实。普通用户进程无法通过读取特权 CSR 取得刚才内核捕获的现场。

## 用反例检验解释

同一缓冲区的第二遍写入通常触发更少的次缺页。若两次计数接近，先检查采样区间、首次触碰和页大小。一个次缺页计数无法告诉你触发时的 scause 或 ESR 值。在缺少相应内核观测的报告中，把这些值的解释标为按手册推导。[L10 · 跨架构缺页对照](lab-fault.md)

## 再到全志验证

转到 [V821](platform-v821.md) 与 [V861](platform-v861.md) 时，重新核对内核配置、工具链 ABI、在线 hart 和中断拓扑。到 [F101](platform-f101.md) 转向实时固件，将观察对象换成中断服务、任务与内存布局。验收时说明哪段分析可以复用，哪项结论依赖于 Linux 或特定芯片。
