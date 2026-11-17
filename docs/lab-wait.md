# L02 · 一个 read 为什么睡眠

**环境：WSL2 · 约 90 分钟 · 前置：L01、基本管道语义。** 使用两个终端和同一个实验目录。

## 先明确实验问题

空管道上仍有写端打开时，阻塞 read 会等数据；所有写端都关闭且数据耗尽时，read 返回 0。非阻塞模式又会走不同分支。先预测三种情况下的结果。

## 终端 A：创建命名管道并启动读者

```bash
mkdir -p ~/kernel-lab/experiments/wait
cd ~/kernel-lab/experiments/wait
# 若已存在 lab.fifo，先确认它是上次实验的 FIFO；不要覆盖其他文件
test -e lab.fifo || mkfifo lab.fifo
strace -tt -T -o reader.trace python3 -c '
import os
fd = os.open("lab.fifo", os.O_RDONLY)
print("opened", flush=True)
data = os.read(fd, 32)
print("read returned:", repr(data), flush=True)
os.close(fd)
'
```

此时可能先阻塞在 FIFO 的 `openat`，尚未到 read。这个细节必须在 trace 中区分。

## 终端 B：打开写端，延迟发送

```bash
cd ~/kernel-lab/experiments/wait
python3 -c '
import os, time
fd = os.open("lab.fifo", os.O_WRONLY)
print("writer opened; waiting 8 seconds", flush=True)
time.sleep(8)
os.write(fd, b"hello\n")
time.sleep(2)
os.close(fd)
'
```

在 8 秒窗口内，用第三个终端或其他空闲终端 `ps -ef` 找到读者 PID，再运行 `ps -p PID -o pid,stat,wchan,comm`，把 PID 替换为实际数字。`wchan` 受权限、符号和配置影响，不保证显示固定名称。

## 应当看到什么

读者先在 open 等写端，随后打印 opened，再在 read 等待约 8 秒，最终得到 `hello\n`。查 `reader.trace` 中 FIFO 对应 fd 的 `openat` 和 `read`；Python 启动时也有很多无关 read，不能把最后一个 read 或最长一个 read 直接当目标。

`strace -T` 反映系统调用从进入到退出的观测时长，里面可能包含睡眠和调度，不是纯 CPU 执行时间。唤醒意味着具备继续执行的机会，不保证立即返回用户态。

## 两个反例

1. 写者打开后不写数据，等待几秒直接关闭。预测并验证读者收到空字节串，即 read 返回 0。
2. 把读者改为 `O_RDONLY | O_NONBLOCK`，确保写者打开但未写数据时再调用 read。通常会得到 EAGAIN；若根本没有写端，可能先看到 EOF，因此必须控制打开顺序。

## 源码与时间线

在 `fs/pipe.c` 中找读路径与等待条件，结合 `include/linux/wait.h` 画：条件检查、等待者登记、释放锁/调度、写入、唤醒、重新检查、复制数据。实际函数名和细节按版本查找。

## 验收

给出正常数据、EOF、EAGAIN 三组结果。解释为什么“没有数据”不足以判断 read 是否睡眠；为什么 syscall 时长不能直接当设备耗时；为什么唤醒后还要检查条件。参考：[pipe(7)](https://man7.org/linux/man-pages/man7/pipe.7.html)、[fifo(7)](https://man7.org/linux/man-pages/man7/fifo.7.html)。
