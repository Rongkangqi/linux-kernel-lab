# 04 · VFS 与 I/O

**第 12–14 周 · WSL2 · 目标：知道系统调用跨过了哪些对象与层次。**

## 第 12 周：fd 只是入口

文件描述符是进程文件表中的索引，不等于 inode，也不等于磁盘文件。打开文件描述对应内核的 file 对象；dentry、inode、superblock 各描述不同职责。`dup` 与 `fork` 后的文件偏移共享，需要沿对象引用关系分析。

用[L05](lab-io.md)观察 `openat/read/write/close`，再写一个 `dup` 后交替读的小程序，预测文件偏移。源码入口：`fs/open.c`、`fs/read_write.c`、`include/linux/fs.h`。参见[VFS 概览](https://docs.kernel.org/filesystems/vfs.html)。

## 第 13 周：缓存、块层与完成

普通文件的 buffered I/O 通常经过页缓存。应用的 write 返回不等于数据已经持久化到设备；`fsync`、文件系统、块层与存储硬件共同影响持久性语义。direct I/O 的条件、对齐和一致性另行分析，不能只把它理解成“更快”。

在 Linux 文件系统上的实验目录比较读写与 `fsync` 的系统调用时间。WSL 中 `/mnt/c` 和 Linux 文件系统可能走不同路径，实验先放在 `~/kernel-lab`，结论标记路径和环境。不要用简单热缓存测试代表实际磁盘吞吐。

源码入口：`mm/filemap.c`、`fs/` 中所用文件系统、`block/blk-mq.c`。先画分层图，再选一个请求追踪。块层细节见[块设备文档](https://docs.kernel.org/block/index.html)。

## 第 14 周：socket 也是 fd，但路径不同

运行本地 loopback socket 实验，观察 `socket/bind/listen/accept/connect/send/recv/poll`。对照管道的等待模型，说明“可读事件”是继续尝试读取的条件，不保证任意长度读取都会立即完成。

理解协议处理、缓冲队列与唤醒，不要求三周内读完 TCP。源码入口：`net/socket.c`、`net/ipv4/`、`fs/eventpoll.c`。接口参考：[socket(2)](https://man7.org/linux/man-pages/man2/socket.2.html)、[epoll(7)](https://man7.org/linux/man-pages/man7/epoll.7.html)。

## 阶段验收

画出 fd→file→具体 file_operations 的关系；解释普通文件、socket 与设备节点为何都能使用 fd，却不能共用一套内部路径；解释 buffered write 返回、设备完成和持久化之间的区别。

给出一份阻塞 I/O 的时序，把运行、等待事件、唤醒和返回分开。如果只看到 `strace` 时长，不能据此断言耗时全部发生在硬件上，需在综合阶段补充内核 trace。

延伸：网络协议栈、文件系统日志、io_uring、块调度策略。先掌握接口与对象边界，再选择支线。
