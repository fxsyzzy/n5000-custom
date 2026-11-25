# 鲲鹏 NRadio N5000 定制 OpenWrt（云编译）

基于官方 `openwrt/openwrt` main 源码 + [veildawn/nradio-n5000](https://github.com/veildawn/nradio-n5000) 的板级支持（MT7987A / MT7992 / TF 卡双系统），通过 GitHub Actions 云端编译。

## 硬件

| 项目 | 规格 |
| --- | --- |
| SoC | MediaTek MT7987A（4×Cortex-A53） |
| 内存 | 1 GB |
| 无线 | MT7992（Wi-Fi 7，BE5040） |
| 有线 | 双 2.5G（LAN=EN8811H，WAN=片内 2.5G PHY） |
| 存储 | TF 卡第二系统分区（`/dev/mmcblk0p4`），原厂系统可随时切回 |
| USB | USB 3.0（可接 5G 模组 / 移动硬盘） |

## 固件内容

**包含**
- 纯净 OpenWrt 底座（官方 main，无厂商私货）
- 两套主题：**Argon**（简洁美观）+ **Carbon**（暗色玻璃，黑客感）
- **中英双语**：LuCI 可切中文/English，仪表盘带「中 / EN」按钮
- **N5000 专属仪表盘主页**：`http://192.168.88.1` 直接显示实时状态（运行时间/负载/温度/内存/TF 卡/WAN 流量曲线/WiFi/PassWall/Docker/5G 模组）
- **PassWall**（含依赖：xray/sing-box 等）
- **Adblock**（轻量去广告）
- **Docker** + **luci-app-dockerman**
  - 数据目录固定指向 `/mnt/sda1/docker`（USB 外挂盘），**绝不写 TF 卡**
  - 自动创建 **2GB swap**（`/mnt/sda1/swapfile`）
- USB 存储支持（ext4 / vfat / UAS）
- 5G USB 模组支持（ECM/RNDIS/NCM/QMI 驱动）
- 板级功能：双系统切换、在线升级、风扇温控、zram

**不含**（按需自行安装，避免挤占资源）
- NAS 套件、Aria2 等下载工具
- 其他代理/去广告套件

## 目录结构

```
.github/workflows/build.yml    # GitHub Actions 云编译流程
board/                         # N5000 板级支持（DTS/设备定义/脚本）
configs/n5000-custom.config    # 固件配置文件（改这里增删组件）
files/                         # 注入固件的自定义文件
  etc/uci-defaults/            # 首次启动初始化（去标识、Argon、Docker 目录）
  etc/init.d/n5000-usb-setup   # USB 挂载后建 Docker 目录 + 2GB Swap
  etc/hotplug.d/block/         # USB 插入自动处理
```

## 使用方法

1. **Fork / 新建仓库**，把本目录内容推到 GitHub（默认分支 `main`）。
2. 进入仓库 **Actions → N5000 Custom OpenWrt Build → Run workflow**。
3. 等待编译完成（约 1.5–2.5 小时），在 **Artifacts** 下载 `n5000-custom-firmware`。
4. 校验 `sha256sums.txt`，得到 `openwrt-mediatek-filogic-nradio_n5000-squashfs-sysupgrade.bin`。

## 刷机步骤

> 前提：原厂固件为 NROS-2.3.9 或以上，TF 卡在机内（≥2GB）。

1. 网线接 N5000 的 **LAN 口**，浏览器打开 `http://192.168.88.1`（默认密码 `admin`）。
2. **高级设置 → 系统 → Storage Manager → Create Boot Disk**，上传 `sysupgrade.bin`，确认擦除第二系统分区。
3. 烧录完成后在 **Boot Setting** 选择 **Secondary System First**，重启。
4. 启动失败会自动回退原厂系统，不会变砖。

## 首次进入

| 项目 | 默认值 |
| --- | --- |
| 管理地址 | `http://192.168.88.1` |
| 账号 | `root` |
| 密码 | `n5000-openwrt`（**登录后请立即修改**） |
| Wi-Fi | `OpenWrt-2G` / `OpenWrt-5G`，密码 `12345678` |
| 主机名 | `OpenWrt` |

## 主页与主题

- **主页**：`http://192.168.88.1` 打开的是 N5000 仪表盘（每 2 秒刷新），右上角可进 LuCI。
- **仪表盘语言**：右上角 **「中 / EN」按钮**一键切换中英文（自动记住选择）。
- **默认主题**：Argon（简洁）。
- **切换主题**：SSH 登录后执行

  ```sh
  theme argon     # 简洁美观
  theme carbon    # 暗色玻璃（黑客感，进 LuCI 后可再切深色）
  ```

  也可以在 LuCI「系统 → 系统 → 语言与界面」里改。

## 语言（中 / 英）

- LuCI 默认英文，已内置**简体中文**语言包（base / firewall / package-manager / adblock / dockerman / passwall 等）。
- 在 LuCI「系统 → 系统 → 语言与界面 → 语言」里可随时切换 **中文 / English**。
- 仪表盘主页自带 **中 / EN** 切换按钮，独立于 LuCI 语言。

## 代理使用（PassWall）

- LuCI → 服务 → **PassWall**，添加订阅/节点，启用即可
- 需要 Xray/sing-box 等内核时，PassWall 界面可一键更新

## Docker 与 Swap 要求

- 准备一个 **ext4 格式**的 U 盘/移动硬盘，第一个分区为 `/dev/sda1`（建议 ≥16GB）。
- 固件启动后会自动挂载到 `/mnt/sda1`，并创建：
  - `/mnt/sda1/docker` → Docker 数据目录
  - `/mnt/sda1/swapfile`（2GB）→ 启用 swap
- 若 U 盘未接：Docker 不会启动，系统其余功能正常；接上后会自动准备并启动 Docker。
- 查看状态：`df -h /mnt/sda1`、`free -m`、`docker info`。

## 自定义

- **增删组件**：编辑 `configs/n5000-custom.config`，在 `CONFIG_PACKAGE_xxx=y` 处修改。
- **改默认值**：编辑 `files/etc/uci-defaults/99-zz-custom-branding`。
- **改 Docker 路径**：修改 `99-zz-custom-branding` 与 `files/etc/init.d/n5000-usb-setup` 中的 `/mnt/sda1`。

## 注意

- **LAN 网段已改为 `192.168.88.0/24`**（默认 `192.168.88.1`），避免和 TR3600 的 `192.168.1.1` 冲突。
  如果 N5000 是 TR3600 的上级路由，请把 TR3600 的 WAN 改成 DHCP 或静态 `192.168.88.x`。
- 本项目是**云编译工程**，需要你自己的 GitHub 账号运行 Actions；首次构建可能因上游 feed 变动需要小修（日志在 Artifacts 的 `build-log`）。
- 板级支持来源于 [veildawn/nradio-n5000](https://github.com/veildawn/nradio-n5000)（DTS 逆向自原厂 NROS-2.3.9），上游 OpenWrt 官方尚未合并 N5000 设备。
- 刷机有风险，请保留原厂系统分区（双系统机制可回退）。

## 微信机器人（公众号）

> 微信个人号没有官方机器人接口；这里用**微信公众号**做合法接入。

1. 注册微信公众号（订阅号即可）：https://mp.weixin.qq.com
2. 公众号后台 → 设置与开发 → 基本配置 → 服务器配置：
   - URL：`http://你的公网地址/cgi-bin/wechat`
   - Token：自己随便填一个字符串（比如 `n5000ai123`）
   - 消息加解密方式：明文模式
3. SSH 登录路由器配置（网页管理页已移除）：
   - 执行：`uci set aichat.wechat.token=你的Token && uci set aichat.wechat.enabled=1 && uci commit aichat`
4. 微信里给公众号发消息即可对话，还支持快捷指令：
   - `状态` / `status`：直接返回路由器状态
   - `重启` / `reboot`：重启路由器
   - `重启wifi`：重启 WiFi
   - `改密码 新密码`：修改 WiFi 密码

**没有公网 IP 怎么办**：路由器在 NAT 后面时，微信服务器访问不到。方案：
- 用 ngrok/cloudflared 内网穿透，把本地 80 端口映射出去，获得公网 URL 填到公众号
- 或使用有公网 IP 的 VPS 做 frp 反向代理

> 微信公众号回调要求 5 秒内回复，AI 生成太慢会超时；本实现已做超时处理（超时会提示再发一次）。如需稳定异步回复，需要认证服务号的客服消息接口。

## 界面主题：液态玻璃（Liquid Glass）

- 首页仪表盘、应用过滤页已使用液态玻璃风格
- LuCI 后台（Argon / Carbon 主题）通过 `/www/luci-static/glass.css` 全局覆盖为玻璃风
- 生效机制：`/etc/uci-defaults/97-glass-theme` 首次启动时把 `@import url("/luci-static/glass.css")` 注入主题 CSS，切换主题后同样生效
- 效果：动态极光背景、磨砂玻璃面板、内高光描边、圆角胶囊控件、渐变按钮

## Docker 与防火墙（iptables/nftables 混用警告）

- 本固件默认 fw4(nftables)。Docker 旧版默认写 iptables 规则，LuCI 会提示「检测到旧版 iptables 规则」。
- 已通过 `/etc/dockerd.json` 设置 `"firewall-backend": "nftables"`，并在 `/etc/config/dockerd` 里设置 `alt_config_file` + `iptables=0`，Docker 全部走 nftables，警告消失。
- Docker 数据目录在 `/mnt/sda1/docker`，**必须插入 USB 移动硬盘并格式化为 ext4**（TF 卡的 f2fs 不支持 overlay2 存储驱动，容器会启动失败）。
- 国内拉取镜像：`docker.io` 经常被污染，可在 `/etc/dockerd.json` 加 `"registry-mirrors": ["https://你的镜像加速地址"]` 后重启 Docker。

## 常用插件清单（可扩展）

### 网络优化
| 插件 | 包名 | 用途 |
|---|---|---|
| SQM QoS | `sqm-scripts` + `luci-app-sqm` | 智能限速 / 缓冲控制（cake），保障游戏、视频流畅 |
| SmartDNS | `smartdns` + `luci-app-smartdns` | 多上游 DNS 并发测速，优选低延迟结果 |

### 安全与广告拦截
| 插件 | 包名 | 用途 |
|---|---|---|
| AdGuard Home | `adguardhome` + `luci-app-adguardhome` | DNS 级去广告、恶意域名拦截、查询统计 |
| DNSCrypt | `dnscrypt-proxy2` | 加密 DNS 防劫持（无官方 LuCI 界面，改配置文件） |
| 上网时间管控 | `luci-app-wifischedule` | WiFi 定时开关（按时间管控上网） |

### 高级功能
| 插件 | 包名 | 用途 |
|---|---|---|
| WireGuard | `wireguard-tools` + `kmod-wireguard` + `luci-proto-wireguard` | 高速 VPN（客户端/服务端） |

### ⚠️ DNS 插件冲突说明
`AdGuard Home`、`SmartDNS`、`DNSCrypt`、`adblock` 都会占用 53 端口 / DNS 链路，**同一时间只能启用一套**。推荐组合：
- 方案 A（简单）：AdGuard Home 单独用（广告拦截 + DNS）
- 方案 B（极致速度）：SmartDNS（解析优选）+ DNSCrypt（加密）串联
- 方案 C：dnsmasq + adblock（最轻量）

### 应用过滤（App Filter）
官方 OpenWrt 源没有「应用过滤」包，需要第三方 OpenAppFilter（含内核模块 + DPI 引擎，可识别数千种应用并按设备限速/封禁）。是否需要引入第三方源可另行决定。

## 自研应用过滤 + 流量统计（appfilter）

自研轻量实现（无第三方源、无内核模块）：`/usr/sbin/appfilter` + `/www/appfilter.html`

### 能力
- **分类流量**：视频娱乐 / 游戏 / 社交 / 办公 / 购物 / 音乐 / 网盘 / 新闻 / 教育 / 系统更新（域名库 `/usr/share/appfilter/domains.json`，可自行扩充）
- **网站明细**：按域名统计每个网站的流量（来自 DNS 应答日志的域名↔IP 精确映射 + conntrack 字节数）
- **设备明细**：每台设备的总流量、分类占比、Top 网站
- **拦截规则**：按设备封禁指定分类/域名；支持时间段（周几 + 起止时间）
- **实时生效**：每 30 秒重建 nftables 规则；新连接立即被拦截（已建立的连接需重连）

### 原理
1. dnsmasq 打开查询日志（`/var/log/dnsmasq.log`，log-queries=extra）
2. 解析日志得到「设备 IP → 域名 → 解析 IP」精确映射
3. 读取 `/proc/net/nf_conntrack` 按会话字节数统计流量
4. 用 nftables `inet appfilter` 表按设备 IP + 目标 IP 集合 drop

### 使用
- 打开 `http://192.168.88.1/appfilter.html`（仪表盘右上角「流量」按钮也可进入）
- 顶部「启用拦截/停用拦截」控制总开关
- 设备列表点「管控」→ 勾选禁止分类 / 填额外域名 / 设时间段 → 保存
- 统计为「本次开机以来」（存在内存，重启清零）

### 限制
- 纯域名/DNS 级识别：直连 IP 的游戏对局流量无法识别（需 DPI）
- 共享 CDN IP 可能被归到某个域名（统计为参考值）
- 已建立的连接要重连后才会被拦截



## LuCI 原生面板（N5000 面板）

- 登录 LuCI 后默认首页即为「N5000 面板」（也可从菜单「状态 → N5000 面板」进入）
- 内容与仪表盘一致：运行时间 / 负载 / 温度 / 内存、WAN/WiFi/存储/服务状态、应用分类流量、网站 Top、设备与网站计数
- 每 5 秒自动刷新，样式跟随 Argon 玻璃主题（克莱因蓝）
- 页面底部有快捷入口：应用过滤页、独立大屏仪表盘
- 实现：`/www/luci-static/resources/view/n5000/panel.js` + 菜单 `/usr/share/luci/menu.d/luci-app-n5000-panel.json` + ACL

## LuCI 菜单结构（v5 起）

```
N5000 面板（登录后默认首页）
 ├─ 应用过滤      ← 分类/网站/设备流量 + 按设备封禁（原生 LuCI 页面）
 └─ 流量仪表盘    ← 大卡片 + WAN 实时速率曲线 + 分类/网站/设备统计
```

- 顶层「N5000 面板」置顶，原「状态 → N5000 面板」重复入口已移除
- 应用过滤与流量仪表盘均已改为 LuCI 原生视图（非 iframe）
- 原独立页面 `/appfilter.html`、`/dashboard.html` 仍保留，可继续直接访问
- 实现文件：`www/luci-static/resources/view/n5000/{panel,appfilter,dashboard}.js` + `menu.d/luci-app-n5000-panel.json`

## 专属小特色：大肥鱼 🐟

- 「大肥鱼」是这套固件的吉祥物（SVG 动效：摆尾、眨眼、吐泡泡），出现在：
  - N5000 面板：顶部会「碎碎念」——水温舒服 / 冒汗 / 鱼要熟了（按 CPU 温度、负载、在线设备数变化）
  - 流量仪表盘：右下角浮动，**点一下会游走**，再点回来
  - 应用过滤：鱼会报告当前守着几条管控规则
- 页面图标（favicon）也换成了大肥鱼
- 实现：`/www/luci-static/n5000/fish.svg`（纯 SVG + CSS 动画，无图片资源、零额外开销）
