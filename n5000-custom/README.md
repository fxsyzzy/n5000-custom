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

## 专属吉祥物：大肥鱼

- 主题吉祥物「大肥鱼」（蓝发鲸鱼尾 Q 版角色，透明背景 PNG）
- 出现在：N5000 面板顶部（随水温/负载变化的碎碎念）、流量仪表盘右下角（点击会游走）、应用过滤页（报告当前管控规则数）
- 页面 favicon 使用大肥鱼头像
- 资源：`/www/luci-static/n5000/mascot.png`（全身）、`mascot-icon.png`（头像 192px）、`mascot-64.png`（favicon）

### 大肥鱼人设（来自 B 站社区）

- 「大肥鱼」/「蓝色大肥鱼」是中文社区对 DeepSeek 蓝鲸 logo 的拟人爱称（DeepSeek 娘 / 鲸鱼娘），形象为蓝发、鲸鱼尾、女仆装、呆毛的 Q 版角色
- 社区人设：傲娇、爱吃白饭、爱摸鱼、经常 DeepSleep（打瞌睡）、思考链超长
- 面板/仪表盘气泡文案按该人设写（傲娇吐槽风），并随温度/负载/在线设备数变化

### 大肥鱼白饭彩蛋 & 左下角常驻

- 大肥鱼挂件固定在所有 LuCI 页面（登录页除外）**左下角**，一直可见
- 点击大肥鱼 = 喂一碗白饭：🍚 飘字 + 白饭计数（localStorage 持久化）
- 白饭数量里程碑会触发专属台词：1/2/3/5/7/10/20/50 碗各不相同；每 5 碗会开心地游过屏幕
- 台词按温度/负载/在线设备数变化（傲娇/吐槽风），每 20 秒自动换一句；每 90 秒自动游一趟
- 实现：`/www/luci-static/n5000/mascot.js`，通过 `/etc/uci-defaults/93-mascot-inject` 注入 Argon/Carbon 的页面脚本

### 大肥鱼挂件（v2：不游动版）

- 固定在所有 LuCI 页面**左下角**，静态站立（不游动），尺寸加大（桌面 168px）
- **白饭彩蛋**：点一下放一碗饭在**头顶**（最多叠 5 碗，6 秒后自己吃掉），白饭累计数存 localStorage；1/2/3/5/7/10/20/50 碗有专属傲娇台词
- 台词随温度/负载/在线设备数变化，傲娇吐槽风



## 收藏夹（网站收藏 + 分类）

- 入口：LuCI 菜单「N5000 面板」→「收藏夹」
- 功能：
  - 收藏任意网站（名称 / 网址 / 分类 / 备注）
  - 自定义分类（新增、改名、删除；删除分类时收藏自动并入其它分类）
  - 按分类分组展示，卡片可一键打开、编辑、删除
  - 顶部搜索框实时过滤
- 存储：`/etc/config/favorites`（UCI），接口 `/cgi-bin/favorites`，视图 `/www/luci-static/resources/view/n5000/favorites.js`

## AI 助手（LuCI 原生页面）

- 入口：LuCI 菜单「N5000 面板」→「AI 助手」
- 功能：多轮对话、DeepSeek/OpenAI 兼容接口、可调系统提示词、可选工具调用（重启 / 重启 WiFi / 改 WiFi 密码）
- 设置页可填 API 地址 / Key / 模型 / 提示词，保存在路由器本地 `/etc/config/aichat`
- 后端：`/www/cgi-bin/aichat`（聊天/配置/snapshot），视图 `view/n5000/ai.js`
- 微信机器人后端仍在：`/www/cgi-bin/wechat` + `aichat.wechat.*` 配置（需公众号 + 公网回调才能用）

## 主题配色：潘多拉纳美蓝

- 配色来源：Avatar 潘多拉星球纳美族生物发光蓝
  - `#0D2C54` 深海蓝（背景基底）
  - `#1E5B8C` 中层蓝（浅色主色）
  - `#48A9C5` 纳美蓝（主强调色）
  - `#83D9DC` 生物光青（高亮/次级）
  - `#C8F4F9` 冰蓝高光（文字亮部）
- 应用于：Argon 主题主色/暗色主色、LuCI 玻璃皮肤背景、N5000 面板、收藏夹、AI 助手、应用过滤、流量仪表盘、独立页面

## 磨砂玻璃效果

- Argon 主题切到深色玻璃模式：`mode=dark`、`blur_dark=14`、`transparency_dark=0.35`
- `/www/luci-static/glass.css` 增加磨砂规则：主要面板/卡片/弹窗/登录框 `backdrop-filter: blur(14px) saturate(160%)`，侧边栏/顶栏 `blur(16px)`，输入框 `blur(8px)`
- 移动端自动降级为 `blur(8px)`，避免低性能设备卡顿
- 独立页面（dashboard.html / appfilter.html）卡片同样加了磨砂

## 微信远程控制（公众号）

后端 `/www/cgi-bin/wechat` 已就绪，微信里发消息即可控制和查询 N5000：

| 指令 | 作用 |
|---|---|
| 帮助 / help | 列出所有指令 |
| 状态 | 主机、运行时间、负载、温度、内存、WAN/LAN、WiFi、PassWall、Docker |
| 流量 | 总流量、设备数、Top 网站 |
| 设备 | 在线设备（IP + 名称） |
| 重启 | 重启路由器 |
| 重启wifi | 重启 WiFi |
| 改密码 新密码 | 修改 WiFi 密码（≥8位） |
| 改ssid 新名称 | 修改 WiFi 名称（自动加 -2G/-5G） |
| docker状态 | Docker 运行状态与容器 |
| 重启docker | 重启 Docker |
| 其它任意文字 | 交给 DeepSeek AI 回答（需在 LuCI AI 助手配置 Key） |

### 接通步骤（需要用户操作）

1. 注册微信公众号（个人订阅号免费）：https://mp.weixin.qq.com
2. 内网穿透：ngrok 免费账号 → 创建免费静态域名（形如 `xxx.ngrok-free.app`）→ 拿到 authtoken
3. 把 authtoken 给 AI，由 AI 在路由器上安装 ngrok + 启动隧道（映射 80 端口）
4. 公众号后台 → 设置与开发 → 基本配置 → 服务器配置：
   - URL：`https://xxx.ngrok-free.app/cgi-bin/wechat`
   - Token：与 `uci set aichat.wechat.token=...` 一致
   - 消息加解密：明文模式
5. `uci set aichat.wechat.enabled=1 && uci commit aichat`
6. 微信里给公众号发“帮助”验证

> 说明：微信个人号没有官方机器人接口，第三方协议机器人有封号风险；公众号是合规方案。

### 微信接入（已接通版）

- 公网回调（Tailscale Funnel，免费、无需域名）：
  **https://n5000.tail05e50c.ts.net/cgi-bin/wechat**
- 公众号后台配置：
  - URL：`https://n5000.tail05e50c.ts.net/cgi-bin/wechat`
  - Token：`n5000wx2026`（可用 `uci set aichat.wechat.token=...` 修改，两处要一致）
  - 消息加解密方式：**明文模式**
- 安全：Funnel 只暴露 127.0.0.1:8081 上的微信专用 uhttpd 实例（`/etc/init.d/n5000-wechat-http`），LuCI 后台不会暴露到公网。
- 持久化：tailscaled 的 Funnel 配置在服务重启后保留；刷机后执行
  `echo 'tskey-auth-...' > /etc/tailscale/authkey && /usr/sbin/n5000-tunnel-up` 即可恢复。
- 相关文件：`/etc/init.d/n5000-wechat-http`（专用回调服务）、`/usr/sbin/n5000-tunnel-up`（一键恢复 Tailscale+Funnel）、`/etc/uci-defaults/91-tailscale-wechat`。

## 大肥鱼 × AI 语录

- 大肥鱼的对话气泡会定时（约 5 分钟）向 DeepSeek 要一句「傲娇/吐槽」语录，结合实时路由状态（温度/负载/在线设备）生成
- 没配 API Key 或关闭开关时自动回退到本地固定语录，不影响使用
- 开关：LuCI → N5000 面板 → AI 助手 → 设置 →「让大肥鱼用 AI 生成语录」
- 接口：`/cgi-bin/aichat?action=line`（短回复，max_tokens 60，成本极低）
- 前端缓存 4 分钟，切换页面不会重复请求

## 密码本（隐藏入口，本地加密）

- **入口（不在任何菜单/页面中显示，只有知道地址才能进）**：
  `http://192.168.88.1/vault.html`（建议用 `https://192.168.88.1/vault.html`，自签证书）
- 特性：
  - AES-256-CBC + PBKDF2(100k) 加密存于 `/etc/vault.enc`（600 权限），**主密码不落盘**
  - 解锁后会话 15 分钟（`/tmp/vault-sess`），页面 10 分钟无操作自动锁定
  - 增删改查、搜索、一键复制密码、随机密码生成、改主密码
  - 完全本地，不上传、不同步
- 注意：忘记主密码无法恢复（只能删除 `/etc/vault.enc` 重置）；需要备份时复制 `/etc/vault.enc` 即可（加密文件）
- 实现：`/www/cgi-bin/vault`（接口）、`/www/vault.html`（页面）、openssl-util


## N5000 面板 v2（仿 MWRT 首页布局）

- 结构参考 NRadio MWRT 首页：顶部状态条 + 中间产品主图 + 右侧信息卡 + 底部统计/快捷操作
- 顶部：设备名、WAN 连接状态、温度/负载/运行时间/WAN IP 胶囊
- 主图区：按真机重绘的 N5000 插画（铝合金方形机身、NR radio 标识、前面黑色玻璃带、双 2.5G 网口 + USB 3.2 + USB-C、WiFi 7 波纹），型号说明（MT7987A 四核 / WiFi 7 BE5000 / 1GB RAM / 双 2.5G）、实时上下行速率与迷你曲线
- 右侧：CPU/内存/存储占用（带进度条）、网络（WAN/LAN）、服务状态（PassWall/Docker/TF）、活跃应用 TOP5（按域名流量）
- 底部：处理器/内存/温度/运行时间/在线设备/识别网站 六项统计 + 快捷入口（无线设置、应用过滤、收藏夹、AI 助手、流量仪表盘、系统日志、系统概览、重启、系统设置）
- 保持纳美蓝深色玻璃主题（与全站一致）


## 晨光模式（浅色纳美蓝主题）

- 面板右上角胶囊按钮 **「☀ 晨光模式 / 🌙 暗夜模式」** 一键切换，无需重启
- 实现：`/cgi-bin/theme?to=light|dark` 修改 `argon.mode`，`glass.css` 中 `html[data-argon-mode="light"]` 提供整套晨光配色（浅青白背景、深蓝文字、纳美蓝强调）
- 覆盖范围：LuCI 主题（侧边栏/顶栏/表单/表格）+ 自定义页面卡片（面板/仪表盘/应用过滤/收藏夹/AI）
- 活跃应用 TOP5 图标：优先加载 `https://<域名>/favicon.ico`，失败自动回退首字母彩块
