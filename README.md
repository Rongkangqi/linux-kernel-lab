# Linux Kernel Lab · 内核学习实验室

从 WSL2 上的 Linux 基础实验，到 ARM64 架构，再到 RK3576 实机分析的中文学习文档站。

**在线学习**　[打开 Linux Kernel Lab](https://rongkangqi.github.io/linux-kernel-lab/) · [32 周完整路线](https://rongkangqi.github.io/linux-kernel-lab/#/docs/roadmap) · [第一个实验](https://rongkangqi.github.io/linux-kernel-lab/#/docs/lab-pid)

也可以在仓库内阅读 [Markdown 文档](docs/) 和 [Wiki](https://github.com/Rongkangqi/linux-kernel-lab/wiki)。

## 学习路线

参考 32 周、每周 5–8 小时，以实验验收推进：

1. 实验环境与 C / 构建基础（第 1 周）
2. 任务、线程、调度与等待唤醒（第 2–4 周）
3. 中断、并发、锁与内存序（第 5–7 周）
4. 地址空间、缺页、COW 与内存分配（第 8–11 周）
5. VFS、页缓存、块层与 socket（第 12–14 周）
6. ARM64 异常、启动、MMU/TLB、Cache、GIC/PSCI/SMP（第 15–19 周）
7. 设备模型、设备树、资源管理与 DMA/IOMMU/DMA-BUF（第 20–23 周）
8. RK3576 SoC、BSP、时钟电源与 RK3588 对照（第 24–27 周）
9. 端到端分析与综合答辩（第 28–32 周）

仓库收录 29 篇课程文档，其中有 9 份实验手册。在 GitHub 阅读时，可用[实验记录模板](docs/notebook.md)保存自己的进度。下方的本地网页阅读器还支持全文搜索和学习进度导出。

## 从哪里开始

- [开始学习](docs/start.md)
- [完整周计划](docs/roadmap.md)
- [环境与版本](docs/environment.md)
- [第一个实验：PID / TID](docs/lab-pid.md)
- [RK3576 架构地图](docs/platform-rk3576.md)
- [综合项目标准](docs/capstone.md)

文档使用相对 Markdown 链接，可在 GitHub 直接阅读；构建时自动转换成站点路由。最终目标是能够用版本明确的源码、实验与 trace 解释常见内核机制，并连接到真实芯片；不以读完全部源码或掌握芯片 RTL 设计为目标。

## 本地构建

网页通过 GitHub Pages 发布。仓库 Settings → Pages 中选择 GitHub Actions 后，每次推送到 `main` 都会构建、检查并发布 `dist/`。在 Actions 的发布工作流中也可以手动重新部署。

需要 Node.js 20 或更新版本。首次执行 `npm ci`，之后：

```bash
npm run build
npm run check
npm run dev
```

访问终端输出的本地地址，默认 `http://127.0.0.1:4173`。生成目录为 `dist/`，可作为静态站点托管。Hash 路由适用于子路径托管。

```text
docs/                    课程正文与实验手册
content/curriculum.json  阶段与平台信息
content/manifest.json    文档目录与元数据
web/                     网站界面与交互
scripts/                 构建、验证与本地服务
.openai/hosting.json      当前 Sites 项目和静态输出配置
```

## 内容与验证边界

通用阅读示例固定 Linux v6.12；RK3576 应使用实际板卡 BSP 与完整提交号。板型、BSP、MPP 版本尚未确定，站点不伪造实机验证结果。QEMU/内核编译步骤是学习实验方案，需按自己的工具版本执行并记录结果。

文档参考 Linux、Arm、QEMU、Microsoft 与 Rockchip 官方资料；引用入口见 [references.md](docs/references.md)。发现错误请附版本、复现步骤和证据提交 Issue。
