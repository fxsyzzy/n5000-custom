'use strict';
'require view';
'require poll';

function dbFmt(b) {
	b = Number(b) || 0;
	if (b > 1099511627776) return (b / 1099511627776).toFixed(2) + ' TB';
	if (b > 1073741824) return (b / 1073741824).toFixed(2) + ' GB';
	if (b > 1048576) return (b / 1048576).toFixed(1) + ' MB';
	if (b > 1024) return (b / 1024).toFixed(0) + ' KB';
	return b + ' B';
}

function dbCatName(k) {
	var m = { video: '视频', game: '游戏', social: '社交', office: '办公', shopping: '购物', music: '音乐', cloud: '网盘', news: '新闻', edu: '教育', system: '系统更新', other: '其他', unknown: '未识别' };
	return m[k] || k;
}

function dbSiteName(d) {
	d = String(d || '').toLowerCase().replace(/^www\./, '').replace(/\.$/, '');
	if (!d) return { n: '未知', h: '' };
	if (d === 'unknown' || d === 'none' || d === 'unknown-cdn') return { n: '未识别流量', h: '无域名记录（直连 IP / 加密 DNS）' };
	var exact = {
		'bilibili.com': '哔哩哔哩', 'hdslb.com': '哔哩哔哩', 'bilivideo.com': '哔哩哔哩',
		'iqiyi.com': '爱奇艺', 'qiyi.com': '爱奇艺', 'youku.com': '优酷', 'mgtv.com': '芒果TV',
		'qq.com': '腾讯 QQ', 'weixin.qq.com': '微信', 'v.qq.com': '腾讯视频', 'tencent.com': '腾讯',
		'baidu.com': '百度', 'bdstatic.com': '百度', 'pan.baidu.com': '百度网盘',
		'taobao.com': '淘宝', 'tmall.com': '天猫', 'alicdn.com': '阿里 CDN', 'alipay.com': '支付宝',
		'alibaba.com': '阿里巴巴', 'aliyun.com': '阿里云', 'alibabacloud.com': '阿里云',
		'jd.com': '京东', '360buyimg.com': '京东', 'pinduoduo.com': '拼多多', 'yangkeduo.com': '拼多多',
		'meituan.com': '美团', 'dianping.com': '大众点评', 'ele.me': '饿了么',
		'douyin.com': '抖音', 'amemv.com': '抖音', 'kuaishou.com': '快手', 'xiaohongshu.com': '小红书',
		'xhscdn.com': '小红书', 'zhihu.com': '知乎', 'weibo.com': '微博', 'weibo.cn': '微博',
		'sina.com.cn': '新浪', '163.com': '网易', '126.net': '网易', 'netease.com': '网易',
		'sohu.com': '搜狐', 'ifeng.com': '凤凰网', 'toutiao.com': '今日头条', 'douban.com': '豆瓣',
		'apple.com': '苹果', 'icloud.com': '苹果 iCloud', 'mzstatic.com': '苹果',
		'google.com': '谷歌', 'gstatic.com': '谷歌', 'youtube.com': 'YouTube', 'googlevideo.com': 'YouTube',
		'ytimg.com': 'YouTube', 'github.com': 'GitHub', 'githubusercontent.com': 'GitHub',
		'gitlab.com': 'GitLab', 'microsoft.com': '微软', 'windowsupdate.com': 'Windows 更新',
		'office.com': '微软 Office', 'live.com': '微软', 'msftconnecttest.com': '微软',
		'nvidia.com': 'NVIDIA', 'amd.com': 'AMD', 'intel.com': 'Intel',
		'steamcommunity.com': 'Steam', 'steampowered.com': 'Steam', 'epicgames.com': 'Epic Games',
		'playstation.com': 'PlayStation', 'xbox.com': 'Xbox', 'nintendo.com': '任天堂',
		'cloudflare.com': 'Cloudflare', 'akamai.net': 'Akamai', 'fastly.net': 'Fastly', 'jsdelivr.net': 'jsDelivr',
		'deepseek.com': 'DeepSeek', 'openai.com': 'OpenAI', 'chatgpt.com': 'ChatGPT',
		'anthropic.com': 'Anthropic', 'claude.ai': 'Claude', 'adobe.com': 'Adobe',
		'spotify.com': 'Spotify', 'netflix.com': 'Netflix', 'telegram.org': 'Telegram',
		'whatsapp.com': 'WhatsApp', 'facebook.com': 'Facebook', 'instagram.com': 'Instagram',
		'twitter.com': 'X（Twitter）', 'x.com': 'X（Twitter）', 'reddit.com': 'Reddit',
		'wikipedia.org': '维基百科', 'archive.org': '互联网档案馆',
		'mi.com': '小米', 'xiaomi.com': '小米', 'huawei.com': '华为', 'vivo.com': 'vivo',
		'oppo.com': 'OPPO', 'honor.com': '荣耀', 'amap.com': '高德地图', 'autonavi.com': '高德地图',
		'12306.cn': '铁路 12306', 'ctrip.com': '携程', 'qunar.com': '去哪儿', 'airbnb.com': '爱彼迎',
		'openwrt.org': 'OpenWrt', 'speedtest.net': '测速'
	};
	if (exact[d]) return { n: exact[d], h: d };
	var rules = [
		['bilibili', '哔哩哔哩'], ['hdslb', '哔哩哔哩'], ['bilivideo', '哔哩哔哩'],
		['biliapi', '哔哩哔哩'], ['bilicdn', '哔哩哔哩'], ['acgvideo', '哔哩哔哩'],
		['iqiyi', '爱奇艺'], ['qiyi', '爱奇艺'], ['youku', '优酷'], ['mgtv', '芒果TV'],
		['tdnsvod', '视频 CDN'], ['smtcdns', '视频 CDN'], ['vodtylego', '视频 CDN'],
		['weixin', '微信'], ['wechat', '微信'], ['qq.com', '腾讯 QQ'], ['tencent', '腾讯'],
		['myqcloud', '腾讯云'], ['daxuesoutijiang', '作业帮'],
		['baidu', '百度'], ['bdydns', '百度云加速'], ['bdurl', '百度'],
		['taobao', '淘宝'], ['tmall', '天猫'], ['alicdn', '阿里 CDN'], ['alipay', '支付宝'],
		['alibaba', '阿里巴巴'], ['aliyun', '阿里云'], ['aliyuncs', '阿里云'],
		['cdngslb', '阿里云 CDN'], ['kunlungr', '阿里云 CDN'], ['alibabadns', '阿里云 CDN'],
		['jd.com', '京东'], ['360buy', '京东'], ['pinduoduo', '拼多多'], ['yangkeduo', '拼多多'],
		['meituan', '美团'], ['dianping', '大众点评'], ['ele.me', '饿了么'],
		['douyin', '抖音'], ['amemv', '抖音'], ['toutiao', '今日头条'], ['bytedance', '字节跳动'],
		['kuaishou', '快手'], ['xiaohongshu', '小红书'], ['xhscdn', '小红书'],
		['zhihu', '知乎'], ['weibo', '微博'], ['sina', '新浪'], ['163.com', '网易'], ['126.net', '网易'],
		['netease', '网易'], ['sohu', '搜狐'], ['ifeng', '凤凰网'], ['douban', '豆瓣'],
		['apple', '苹果'], ['icloud', '苹果'], ['mzstatic', '苹果'],
		['gstatic', '谷歌'], ['google', '谷歌'], ['googlevideo', 'YouTube'], ['youtube', 'YouTube'],
		['ytimg', 'YouTube'], ['github', 'GitHub'], ['gitlab', 'GitLab'], ['microsoft', '微软'],
		['msedge', '微软 Edge'], ['cloud.microsoft', '微软云'], ['windowsupdate', 'Windows 更新'],
		['nvidia', 'NVIDIA'], ['steam', 'Steam'], ['epicgames', 'Epic Games'],
		['cloudflare', 'Cloudflare'], ['akamai', 'Akamai'], ['fastly', 'Fastly'], ['jsdelivr', 'jsDelivr'],
		['cloudfront', 'AWS CloudFront'], ['amazonaws', 'AWS'],
		['cdnhwc', '华为云 CDN'], ['huaweicloud', '华为云'], ['huawei', '华为'],
		['queniuk', '七牛 CDN'], ['queniuiq', '七牛 CDN'], ['queniuyk', '七牛 CDN'], ['qiniu', '七牛云'],
		['eccdnx', '白山云 CDN'], ['baishangeek', '白山云 CDN'], ['ctot', '白山云 CDN'],
		['deepseek', 'DeepSeek'], ['openai', 'OpenAI'], ['chatgpt', 'ChatGPT'], ['anthropic', 'Anthropic'],
		['adobe', 'Adobe'], ['spotify', 'Spotify'], ['netflix', 'Netflix'], ['telegram', 'Telegram'],
		['whatsapp', 'WhatsApp'], ['facebook', 'Facebook'], ['instagram', 'Instagram'],
		['reddit', 'Reddit'], ['wikipedia', '维基百科'], ['openwrt', 'OpenWrt'], ['speedtest', '测速'],
		['xiaomi', '小米'], ['amap', '高德地图'], ['autonavi', '高德地图']
	];
	for (var i = 0; i < rules.length; i++) {
		if (d.indexOf(rules[i][0]) !== -1) return { n: rules[i][1], h: d };
	}
	var parts = d.split('.');
	var base = parts.length >= 2 ? parts[parts.length - 2] : d;
	return { n: base.charAt(0).toUpperCase() + base.slice(1), h: d };
}

function dbAggSites(list) {
	var agg = {};
	(list || []).forEach(function(x) {
		var domain = x.domain || x.d || '';
		var bytes = Number(x.bytes || x.b || 0);
		var info = dbSiteName(domain);
		var key = info.n;
		if (!agg[key]) agg[key] = { name: info.n, host: info.h || domain, domains: {}, bytes: 0, count: 0 };
		agg[key].bytes += bytes;
		agg[key].count += 1;
		agg[key].domains[domain] = 1;
	});
	return Object.keys(agg).map(function(k) { return agg[k]; }).sort(function(a, b) { return b.bytes - a.bytes; });
}

function dbSiteRowAgg(item, max) {
	var pct = max > 0 ? Math.round((item.bytes || 0) / max * 100) : 0;
	var host = item.count > 1 ? (item.count + ' 个域名 · ' + item.host) : item.host;
	return E('div', { 'class': 'db-row two' }, [
		E('span', { 'class': 'nm' }, [
			E('span', { 'class': 'n' }, [item.name]),
			E('span', { 'class': 'h', 'title': host }, [host])
		]),
		E('span', { 'class': 'bar' }, [E('i', { 'style': 'width:' + Math.max(2, pct) + '%' })]),
		E('span', { 'class': 'vl' }, [dbFmt(item.bytes)])
	]);
}

function dbIsLight() {
	return document.documentElement.getAttribute('data-argon-mode') === 'light';
}

function dbUptime(s) {
	s = Math.max(0, Math.floor(s || 0));
	var d = Math.floor(s / 86400), h = Math.floor(s % 86400 / 3600), m = Math.floor(s % 3600 / 60);
	if (d > 0) return d + ' 天 ' + h + ' 小时';
	if (h > 0) return h + ' 小时 ' + m + ' 分';
	return m + ' 分钟';
}

var DBCSS = [
	'.db-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:12px}',
	'.db-card{padding:14px 16px}',
	'.db-label{font-size:10.5px;letter-spacing:.14em;text-transform:uppercase;opacity:.62;font-weight:600}',
	'.db-big{font-size:28px;font-weight:600;line-height:1.15;margin-top:4px;font-variant-numeric:tabular-nums}',
	'.db-big.sm{font-size:20px}',
	'.db-note{font-size:11.5px;opacity:.6;margin-top:2px;line-height:1.4}',
	'.db-chart{padding:12px 16px}',
	'.db-chart canvas{width:100%;height:110px;display:block}',
	'.db-bar{height:5px;border-radius:3px;background:rgba(127,127,127,.22);overflow:hidden;margin-top:6px}',
	'.db-bar>i{display:block;height:100%;border-radius:3px;background:var(--primary,#48A9C5)}',
	'.db-ok{color:#35c48a}.db-warn{color:#e6a23c}.db-bad{color:#e05a5a}',
	'.db-cols{display:grid;grid-template-columns:1fr 1fr;gap:12px}',
	'.db-row{display:flex;align-items:center;gap:10px;font-size:12.5px;margin-bottom:8px}',
	'.db-row .nm{width:110px;flex:0 0 auto;opacity:.75;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
	'.db-row .bar{flex:1;margin:0}',
	'.db-row .vl{width:90px;text-align:right;font-variant-numeric:tabular-nums}',
	'.db-row.two .nm{width:160px}',
	'.db-row .n{display:block;font-size:12.5px;font-weight:600;line-height:1.25;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
	'.db-row .h{display:block;font-size:10.5px;opacity:.5;line-height:1.2;margin-top:1px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
	'.db-row.two{margin-bottom:10px;align-items:center}',
	'.db-sec{display:flex;align-items:baseline;justify-content:space-between;gap:10px;margin:20px 0 10px}',
	'.db-sec h3{margin:0}',
	'.db-sec .sub{font-size:11.5px;opacity:.55}',
	'.db-cols .cbi-section{margin-top:0}',
	'.db-cols .cbi-section h3{margin-top:0}',
	'.db-traffic .db-grid .db-card{padding:12px 14px}',
	'@media(max-width:700px){.db-row.two .nm{width:120px}.db-row .bar{display:none}}',
	'@media(max-width:1000px){.db-grid{grid-template-columns:repeat(2,1fr)}.db-cols{grid-template-columns:1fr}}',
	'.db-traffic-head{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap}',
	'.db-seg{display:flex;gap:4px;background:rgba(127,127,127,.14);border-radius:10px;padding:3px}',
	'.db-segbtn{border:0;background:transparent;color:inherit;font:inherit;font-size:12.5px;padding:5px 16px;border-radius:8px;cursor:pointer;opacity:.72}',
	'.db-segbtn.on{background:var(--primary,#48A9C5);color:#04121a;font-weight:600;opacity:1}',
	'.db-traffic .db-row .bar{flex:1}',
].join('\n');

return view.extend({
	load: function() {
		return Promise.all([
			fetch('/cgi-bin/rstatus?t=' + Date.now(), { cache: 'no-store' }).then(function(r) { return r.json(); }).catch(function() { return null; }),
			fetch('/cgi-bin/appfilter?action=state', { cache: 'no-store' }).then(function(r) { return r.json(); }).catch(function() { return null; }),
			fetch('/cgi-bin/traffic?action=summary', { cache: 'no-store' }).then(function(r) { return r.json(); }).catch(function() { return null; })
		]);
	},

	renderInner: function(data) {
		var d = data[0] || {}, af = data[1] || {}, tr = data[2] || {};
		var self = this;
		this.range = this.range || 'today';
		var samples = [], prev = null, MAX = 80;

		var mkCard = function(label, bigId, noteId) {
			return E('div', { 'class': 'cbi-section db-card' }, [
				E('div', { 'class': 'db-label' }, [label]),
				E('div', { 'class': 'db-big', 'id': bigId }, ['--']),
				E('div', { 'class': 'db-note', 'id': noteId }, [' '])
			]);
		};

		var canvas = E('canvas', { 'id': 'db-chart' });
		var chart = E('div', { 'class': 'cbi-section db-chart' }, [
			E('div', { 'style': 'display:flex;gap:20px;font-size:12px;margin-bottom:6px' }, [
				E('span', { 'id': 'db-down' }, ['↓ 0.00 Mbps']),
				E('span', { 'id': 'db-up' }, ['↑ 0.00 Mbps'])
			]),
			canvas
		]);

		var root = E('div', {}, [
			E('style', {}, [DBCSS]),
			E('h2', {}, ['流量仪表盘']),
			E('div', { 'class': 'db-sec' }, [E('h3', {}, ['系统状态']), E('span', { 'class': 'sub' }, ['实时刷新'])]),
			E('div', { 'class': 'db-grid' }, [
				mkCard('运行时间', 'db-uptime', 'db-boot'),
				mkCard('CPU 负载', 'db-load', 'db-loadavg'),
				mkCard('CPU 温度', 'db-temp', 'db-tempnote'),
				mkCard('内存占用', 'db-mem', 'db-memnote'),
				mkCard('WAN IP', 'db-wanip', 'db-wanrate'),
				mkCard('WiFi', 'db-ssid', 'db-clients'),
				mkCard('TF 存储', 'db-tf', 'db-tfnote'),
				mkCard('服务状态', 'db-svc', 'db-svcnone')
			]),
			E('div', { 'class': 'db-sec' }, [E('h3', {}, ['实时速率']), E('span', { 'class': 'sub' }, ['WAN 上行 / 下行'])]),
			chart,
			E('div', { 'class': 'db-sec' }, [E('h3', {}, ['分类与网站']), E('span', { 'class': 'sub' }, ['近 24 小时（应用识别）'])]),
			E('div', { 'class': 'db-cols' }, [
				E('div', { 'class': 'cbi-section' }, [E('h3', {}, ['分类流量']), E('div', { 'id': 'db-cats' }, [' '])]),
				E('div', { 'class': 'cbi-section' }, [E('h3', {}, ['网站 / 应用 Top 10']), E('div', { 'id': 'db-sites' }, [' '])])
			]),
			E('div', { 'class': 'cbi-section db-traffic' }, [
				E('div', { 'class': 'db-traffic-head' }, [
					E('h3', { 'style': 'margin:0' }, ['流量统计（自动累计）']),
					E('div', { 'class': 'db-seg' }, [
						E('button', { 'class': 'db-segbtn on', 'id': 'db-seg-today', click: function() { self.range = 'today'; self.paintTraffic(tr); } }, ['今日']),
						E('button', { 'class': 'db-segbtn', 'id': 'db-seg-month', click: function() { self.range = 'month'; self.paintTraffic(tr); } }, ['本月'])
					])
				]),
				E('div', { 'class': 'db-grid', 'style': 'margin:10px 0' }, [
					E('div', { 'class': 'cbi-section db-card' }, [E('div', { 'class': 'db-label' }, ['流量合计']), E('div', { 'class': 'db-big', 'id': 'db-t-total' }, ['--'])]),
					E('div', { 'class': 'cbi-section db-card' }, [E('div', { 'class': 'db-label' }, ['下载']), E('div', { 'class': 'db-big', 'id': 'db-t-rx' }, ['--'])]),
					E('div', { 'class': 'cbi-section db-card' }, [E('div', { 'class': 'db-label' }, ['上传']), E('div', { 'class': 'db-big', 'id': 'db-t-tx' }, ['--'])]),
					E('div', { 'class': 'cbi-section db-card' }, [E('div', { 'class': 'db-label' }, ['统计天数']), E('div', { 'class': 'db-big', 'id': 'db-t-days' }, ['--'])])
				]),
				E('div', { 'class': 'db-cols' }, [
					E('div', {}, [E('h4', { 'style': 'margin:4px 0 8px' }, ['流量用在哪（分类）']), E('div', { 'id': 'db-tcats' }, [' '])]),
					E('div', {}, [E('h4', { 'style': 'margin:4px 0 8px' }, ['流量用在哪（网站/应用 Top 10）']), E('div', { 'id': 'db-tsites' }, [' '])])
				]),
				E('div', { 'class': 'db-note', 'style': 'margin-top:12px' }, ['近 30 天每日流量']),
				E('canvas', { 'id': 'db-days', 'style': 'width:100%;height:120px;display:block' })
			]),
			E('div', { 'class': 'db-sec' }, [E('h3', {}, ['设备流量']), E('span', { 'class': 'sub' }, ['按设备累计'])]),
			E('div', { 'class': 'cbi-section' }, [E('div', { 'id': 'db-devs' }, [' '])]),

		]);

		var drawChart = function() {
			var c = document.getElementById('db-chart');
			if (!c) return;
			var dpr = window.devicePixelRatio || 1;
			var w = c.clientWidth, h = c.clientHeight;
			if (!w || !h) return;
			if (c.width !== Math.round(w * dpr) || c.height !== Math.round(h * dpr)) {
				c.width = Math.round(w * dpr);
				c.height = Math.round(h * dpr);
			}
			var ctx = c.getContext('2d');
			ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
			ctx.clearRect(0, 0, w, h);
			ctx.strokeStyle = 'rgba(127,127,127,.22)';
			ctx.lineWidth = 1;
			for (var i = 1; i < 4; i++) {
				var y = h * i / 4;
				ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
			}
			if (samples.length < 2) return;
			var maxV = 1;
			samples.forEach(function(s) { maxV = Math.max(maxV, s.down, s.up); });
			maxV *= 1.2;
			var line = function(key, color) {
				ctx.beginPath();
				samples.forEach(function(s, idx) {
					var x = idx / (MAX - 1) * w;
					var yy = h - (s[key] / maxV) * h * 0.92 - 2;
					if (idx === 0) ctx.moveTo(x, yy); else ctx.lineTo(x, yy);
				});
				ctx.strokeStyle = color;
				ctx.lineWidth = 2;
				ctx.stroke();
			};
			line('down', dbIsLight() ? '#1A1A1A' : '#F0F0F0');
			line('up', dbIsLight() ? '#888888' : '#9E9E9E');
		};

		var paint = function() {
			if (!document.getElementById('db-uptime')) return;
			var tv = (d.temp || 0) / 1000;
			var memTotal = d.mem_total || 0, memAvail = d.mem_avail || 0;
			var memPct = memTotal ? (memTotal - memAvail) / memTotal * 100 : 0;
			var tfPct = d.tf_total ? (d.tf_used || 0) / d.tf_total * 100 : 0;

			document.getElementById('db-uptime').textContent = dbUptime(d.uptime);
			document.getElementById('db-boot').textContent = '开机于 ' +
				new Date((d.ts - d.uptime) * 1000).toLocaleString();
			document.getElementById('db-load').textContent = Number(d.load[0]).toFixed(2);
			document.getElementById('db-loadavg').textContent =
				'5m ' + Number(d.load[1]).toFixed(2) + ' · 15m ' + Number(d.load[2]).toFixed(2);

			var te = document.getElementById('db-temp');
			te.textContent = tv.toFixed(1) + ' °C';
			te.className = 'db-big ' + (tv >= 80 ? 'db-bad' : tv >= 65 ? 'db-warn' : 'db-ok');
			document.getElementById('db-tempnote').textContent =
				tv >= 80 ? '温度偏高' : tv >= 65 ? '正常偏高' : '温度正常';

			var me = document.getElementById('db-mem');
			me.textContent = memPct.toFixed(0) + '%';
			me.className = 'db-big ' + (memPct >= 85 ? 'db-bad' : memPct >= 70 ? 'db-warn' : '');
			document.getElementById('db-memnote').textContent =
				dbFmt((memTotal - memAvail) * 1024) + ' 已用 / ' + dbFmt(memTotal * 1024);

			document.getElementById('db-wanip').textContent = d.wan_ip || '--';
			document.getElementById('db-ssid').textContent = d.ssid || '--';
			document.getElementById('db-clients').textContent = (d.clients || 0) + ' 台在线 · LAN ' + (d.lan_ip || '--');
			document.getElementById('db-tf').textContent = tfPct.toFixed(0) + '%';
			document.getElementById('db-tfnote').textContent =
				dbFmt((d.tf_used || 0) * 1024) + ' / ' + dbFmt((d.tf_total || 0) * 1024);

			var svc = [];
			svc.push('PassWall ' + (d.pw ? '运行' : '停止'));
			svc.push('Docker ' + (d.docker ? '运行' : '停止'));
			svc.push('TF ' + (d.errs > 0 ? d.errs + ' 错误' : '正常'));
			document.getElementById('db-svc').textContent = '';
			document.getElementById('db-svc').appendChild(E('span', { 'class': 'db-big sm' }, [svc.join(' · ')]));
			document.getElementById('db-svcnone').textContent = '';

			/* 速率 */
			var down = 0, up = 0;
			if (prev && d.ts > prev.ts) {
				var dt = d.ts - prev.ts;
				down = Math.max(0, (d.wan_rx - prev.rx) * 8 / dt / 1e6);
				up = Math.max(0, (d.wan_tx - prev.tx) * 8 / dt / 1e6);
			}
			prev = { ts: d.ts, rx: d.wan_rx, tx: d.wan_tx };
			document.getElementById('db-down').textContent = '↓ ' + down.toFixed(2) + ' Mbps';
			document.getElementById('db-up').textContent = '↑ ' + up.toFixed(2) + ' Mbps';
			document.getElementById('db-wanrate').textContent =
				dbFmt(d.wan_rx) + ' ↓ · ' + dbFmt(d.wan_tx) + ' ↑ 累计';
			samples.push({ down: down, up: up });
			if (samples.length > MAX) samples.shift();
			drawChart();

			/* appfilter 数据 */
			var devs = af.devices || [], catsData = af.categories || [];
			var maxB = 1;
			catsData.forEach(function(c) { maxB = Math.max(maxB, c.bytes || 0); });
			var cl = document.getElementById('db-cats');
			cl.innerHTML = '';
			var catList = catsData.slice(0, 8);
			if (!catList.length) cl.appendChild(E('em', {}, ['暂无数据']));
			catList.forEach(function(c) {
				cl.appendChild(E('div', { 'class': 'db-row' }, [
					E('span', { 'class': 'nm' }, [dbCatName(c.cat)]),
					E('span', { 'class': 'bar' }, [E('i', { 'style': 'width:' + Math.round((c.bytes || 0) / maxB * 100) + '%' })]),
					E('span', { 'class': 'vl' }, [dbFmt(c.bytes)])
				]));
			});

			var sites = {};
			devs.forEach(function(dev) { (dev.sites || []).forEach(function(s) { sites[s.domain] = (sites[s.domain] || 0) + s.bytes; }); });
			var arr = Object.keys(sites).map(function(k) { return { d: k, b: sites[k] }; })
				.sort(function(x, y) { return y.b - x.b; }).slice(0, 10);
			var sl = document.getElementById('db-sites');
			sl.innerHTML = '';
			if (!arr.length) sl.appendChild(E('em', {}, ['暂无数据']));
			var aggS = dbAggSites(arr.map(function(s) { return { domain: s.d, bytes: s.b }; }));
			var maxSb = aggS.length ? aggS[0].bytes : 1;
			aggS.slice(0, 10).forEach(function(it) { sl.appendChild(dbSiteRowAgg(it, maxSb)); });

			var dl = document.getElementById('db-devs');
			dl.innerHTML = '';
			if (!devs.length) dl.appendChild(E('em', {}, ['暂无数据']));
			devs.forEach(function(dev) {
				dl.appendChild(E('div', { 'class': 'db-row' }, [
					E('span', { 'class': 'nm' }, [dev.name || dev.mac]),
					E('span', { 'class': 'vl' }, [dbFmt(dev.total)])
				]));
			});
		};

		self.paintTraffic = function(tdata) {
			tdata = tdata || tr || {};
			if (!document.getElementById('db-t-total')) return;
			var isMonth = self.range === 'month';
			var segT = document.getElementById('db-seg-today'), segM = document.getElementById('db-seg-month');
			if (segT && segM) {
				segT.className = 'db-segbtn' + (isMonth ? '' : ' on');
				segM.className = 'db-segbtn' + (isMonth ? ' on' : '');
			}
			var r = isMonth ? (tdata.month || {}) : (tdata.today || {});
			document.getElementById('db-t-total').textContent = dbFmt(r.total || 0);
			document.getElementById('db-t-rx').textContent = dbFmt(r.rx || 0);
			document.getElementById('db-t-tx').textContent = dbFmt(r.tx || 0);
			document.getElementById('db-t-days').textContent = isMonth ? ((r.days || 0) + ' 天') : '今日';

			var cats = r.cats || [], maxC = 1;
			cats.forEach(function(c) { maxC = Math.max(maxC, c.bytes || 0); });
			var cl = document.getElementById('db-tcats');
			cl.innerHTML = '';
			if (!cats.length) cl.appendChild(E('em', {}, ['暂无数据（统计服务刚启动）']));
			cats.slice(0, 10).forEach(function(c) {
				cl.appendChild(E('div', { 'class': 'db-row' }, [
					E('span', { 'class': 'nm' }, [dbCatName(c.cat)]),
					E('span', { 'class': 'bar' }, [E('i', { 'style': 'width:' + Math.round((c.bytes || 0) / maxC * 100) + '%' })]),
					E('span', { 'class': 'vl' }, [dbFmt(c.bytes)])
				]));
			});

			var sites = r.sites || [];
			var sl = document.getElementById('db-tsites');
			sl.innerHTML = '';
			if (!sites.length) sl.appendChild(E('em', {}, ['暂无数据']));
			var aggT = dbAggSites(sites);
			var maxTs = aggT.length ? aggT[0].bytes : 1;
			aggT.slice(0, 10).forEach(function(it) { sl.appendChild(dbSiteRowAgg(it, maxTs)); });

			drawDays(tdata.days || []);
		};

		var drawDays = function(days) {
			var c = document.getElementById('db-days');
			if (!c || !c.getContext) return;
			var dpr = window.devicePixelRatio || 1;
			var w = c.clientWidth, h = c.clientHeight;
			if (!w || !h) return;
			if (c.width !== Math.round(w * dpr) || c.height !== Math.round(h * dpr)) {
				c.width = Math.round(w * dpr);
				c.height = Math.round(h * dpr);
			}
			var ctx = c.getContext('2d');
			ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
			ctx.clearRect(0, 0, w, h);
			var list = days.slice(-30);
			ctx.fillStyle = 'rgba(127,127,127,.55)';
			ctx.font = '10px sans-serif';
			if (!list.length) { ctx.fillText('暂无历史数据', 8, h - 8); return; }
			var max = 1;
			list.forEach(function(x) { max = Math.max(max, x.total || 0); });
			var n = list.length, gap = 4;
			var bw = Math.max(1, (w - gap * (n - 1)) / n);
			list.forEach(function(x, i) {
				var bh = Math.max(1, (x.total || 0) / max * (h - 20));
				var xx = i * (bw + gap);
				ctx.fillStyle = dbIsLight() ? ((i === n - 1) ? '#111111' : 'rgba(17,17,17,.35)') : ((i === n - 1) ? '#F5F5F5' : 'rgba(255,255,255,.35)');
				ctx.fillRect(xx, h - bh - 2, bw, bh);
			});
			ctx.fillStyle = dbIsLight() ? 'rgba(17,17,17,.55)' : 'rgba(255,255,255,.55)';
			ctx.fillText(list[0].date, 0, h - 4);
			var lastTxt = list[list.length - 1].date;
			var tw = ctx.measureText(lastTxt).width;
			ctx.fillText(lastTxt, w - tw, h - 4);
		};

		setTimeout(function() { paint(); self.paintTraffic(tr); }, 100);
		window.addEventListener('resize', function() { drawChart(); drawDays(tr.days || []); });


		poll.add(function() {
			return Promise.all([
				fetch('/cgi-bin/rstatus?t=' + Date.now(), { cache: 'no-store' }).then(function(r) { return r.json(); }).catch(function() { return null; }),
				fetch('/cgi-bin/appfilter?action=state', { cache: 'no-store' }).then(function(r) { return r.json(); }).catch(function() { return null; }),
				fetch('/cgi-bin/traffic?action=summary', { cache: 'no-store' }).then(function(r) { return r.json(); }).catch(function() { return null; })
			]).then(function(res) { if (res[0]) d = res[0]; if (res[1]) af = res[1]; if (res[2]) tr = res[2]; paint(); self.paintTraffic(tr); });
		}, 10);

		return root;
	},

	render: function(data) {
		try {
			return this.renderInner(data);
		}
		catch (e) {
			return E('div', {}, [E('h2', {}, ['N5000 流量仪表盘']), E('p', {}, ['加载失败: ' + (e && e.message ? e.message : e)])]);
		}
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
