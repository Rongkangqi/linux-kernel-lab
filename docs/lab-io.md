# L05 · 跟踪文件与 socket

**环境：WSL2 · 约 90 分钟 · 不依赖真实外设。**

## 文件实验

在 Linux 文件系统的实验目录执行，下面只创建一个小文件：

```bash
mkdir -p ~/kernel-lab/experiments/io
cd ~/kernel-lab/experiments/io
strace -tt -T -o file.trace python3 -c '
import os
fd = os.open("sample.dat", os.O_CREAT | os.O_TRUNC | os.O_RDWR, 0o600)
os.write(fd, b"kernel-lab\n")
os.fsync(fd)
os.lseek(fd, 0, os.SEEK_SET)
print(os.read(fd, 64))
os.close(fd)
'
```

找到目标文件的 fd，关联 write、fsync、lseek、read、close。记录返回值，解释它们分别证明了什么。再次运行读取不构成严格的存储性能测试，可能命中缓存。

## socket 实验

用 Python 的 `socket.socketpair()` 建立一对本地 socket，读端先等待，另一个线程延迟 2 秒后发送 4 字节并关闭。使用 `strace -f -tt -T` 观察各线程的调用。再把读者改为 nonblocking + `select` 或 `poll`，对照等待位置的变化。

这是本地 socket 实验，不经过完整的以太网硬件路径。下一步如想研究 TCP，单独在 loopback 上搭建服务端与客户端，并明确区别。

## 回到对象关系

画 fd 表、file 对象与 file_operations，解释普通文件、socket、设备节点分别连接到什么实现。通过 `dup` 验证同一打开文件描述的偏移共享：原 fd 读一字节，再用副本读，预测第二次读的位置。

## 验收

提交一段标注过的 trace 与两张分层图。能说明系统调用耗时、CPU 时间、设备完成和持久化之间的区别；能解释 `poll` 可读后为什么还应处理短读、EOF、错误或竞争变化。

参考：[open(2)](https://man7.org/linux/man-pages/man2/open.2.html)、[fsync(2)](https://man7.org/linux/man-pages/man2/fsync.2.html)、[poll(2)](https://man7.org/linux/man-pages/man2/poll.2.html)。
