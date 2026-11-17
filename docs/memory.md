# 03 · 内存管理

**第 8–11 周 · WSL2 + 可控内核 · 目标：把地址空间、物理页和分配行为分清。**

## 第 8 周：三个不同层次

用户态指针属于进程虚拟地址空间；VMA 描述一段映射的范围与属性；页表参与地址转换；物理页是实际内存管理对象。映射存在不意味着每页已经有独占的物理内存，也不意味着该地址可以被某个设备直接访问。

画出 `task → mm_struct → VMA / 页表 → page/folio`。观察 `/proc/PID/maps`，标出程序、堆、栈、共享库和匿名映射。源码从 `include/linux/mm_types.h`、`mm/mmap.c` 开始；VMA 的容器实现随版本变化，先看职责。

## 第 9 周：缺页与按需分配

完成[L04](lab-memory.md)的匿名映射实验：比较分配后、逐页读后、逐页写后的统计。虚拟内存大小、RSS、PSS、脏页和缺页计数是不同指标。

一次 page fault 可能是合法的按需映射、写时复制，也可能是非法访问。minor/major 的统计不能简单翻译为“小错误/大错误”，也不能只凭耗时推断是否读盘。源码入口：`mm/memory.c`；选择一条匿名页故障路径。

## 第 10 周：fork 与 COW

理解父子进程拥有独立地址空间，但一些底层页可在写入前共享。写时复制发生时，内核处理写保护故障并安排可写副本；具体是否复用、复制和如何统计要按实际实现判断。

对照父子进程的 PSS 和 Private_Dirty，修改一页与全部页，说明证据能证明什么。不要用 `/proc/PID/pagemap` 在无权限时读到的受限值推导物理地址。接口参考：[fork(2)](https://man7.org/linux/man-pages/man2/fork.2.html)、[smaps](https://man7.org/linux/man-pages/man5/proc_pid_smaps.5.html)。

## 第 11 周：内核分配与回收

比较页分配器、slab 系列、`kmalloc`、`vmalloc`：关注虚拟/物理连续性、对象大小、分配上下文与失败处理。不能因为得到指针就默认适合 DMA。

观察 `/proc/meminfo`、`/proc/buddyinfo`，权限允许时看 slab 统计；先记录现象，再追 `mm/page_alloc.c`、`mm/slub.c`、`mm/vmalloc.c`。理解回收与文件页缓存的关系，区分内存压力、碎片、泄漏和缓存增长。不要为了“验证 OOM”在工作系统里无限分配。

## 阶段实验与交付

交付一份同一程序的 `maps/smaps` 快照、缺页统计、触页策略与解释；画出匿名页从分配到 fork 后写入的状态变化。再为一个驱动选择合适的内存分配方式，列出尚需核对的 DMA 约束。

## 阶段验收

能解释“malloc 成功但 RSS 没立即增长”；能解释父子进程中相同数值指针为何不表示同一地址空间；能区分 VMA 与页表；能说明 `vmalloc` 的虚拟连续与 DMA 要求之间的关系。

资料入口：[内存管理文档](https://docs.kernel.org/mm/index.html)、[管理员内存指南](https://docs.kernel.org/admin-guide/mm/index.html)。NUMA、THP、回收算法和内存压缩作为后续专题。
