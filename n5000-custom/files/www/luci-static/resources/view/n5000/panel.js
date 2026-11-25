'use strict';
'require view';
'require poll';

function n5fmtBytes(b) {
	b = Number(b) || 0;
	if (b > 1099511627776) return (b / 1099511627776).toFixed(2) + ' TB';
	if (b > 1073741824) return (b / 1073741824).toFixed(2) + ' GB';
	if (b > 1048576) return (b / 1048576).toFixed(1) + ' MB';
	if (b > 1024) return (b / 1024).toFixed(0) + ' KB';
	return b + ' B';
}

function n5fmtUptime(s, zh) {
	s = Math.max(0, Math.floor(s || 0));
	var d = Math.floor(s / 86400), h = Math.floor(s % 86400 / 3600), m = Math.floor(s % 3600 / 60);
	if (zh) {
		if (d > 0) return d + ' 天 ' + h + ' 小时';
		if (h > 0) return h + ' 小时 ' + m + ' 分';
		return m + ' 分钟';
	}
	if (d > 0) return d + 'd ' + h + 'h';
	if (h > 0) return h + 'h ' + m + 'm';
	return m + 'm';
}

function n5card(label, valueNodes, noteNode) {
	return E('div', { 'class': 'cbi-section n5-card' }, [
		E('div', { 'class': 'n5-label' }, [label]),
		E('div', { 'class': 'n5-value' }, valueNodes),
		noteNode || E('div', { 'class': 'n5-note' }, [' '])
	]);
}

var N5CSS = [
	'.n5-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:14px}',
	'.n5-grid .n5-card{display:flex;flex-direction:column;gap:4px;min-height:86px}',
	'.n5-label{font-size:11px;letter-spacing:.12em;text-transform:uppercase;opacity:.65;font-weight:600}',
	'.n5-value{font-size:26px;font-weight:600;line-height:1.15;font-variant-numeric:tabular-nums}',
	'.n5-value small{font-size:12px;font-weight:500;opacity:.7;margin-left:4px}',
	'.n5-note{font-size:11.5px;opacity:.6;line-height:1.45}',
	'.n5-bar{height:5px;border-radius:3px;background:rgba(127,127,127,.22);overflow:hidden;margin-top:6px}',
	'.n5-bar>i{display:block;height:100%;border-radius:3px;background:var(--primary,#4C7DFF)}',
	'.n5-row{display:flex;align-items:center;gap:10px;font-size:12.5px;margin-bottom:7px}',
	'.n5-row .name{width:110px;flex:0 0 auto;opacity:.75;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
	'.n5-row .bar{flex:1;margin:0}',
	'.n5-row .val{width:90px;text-align:right;font-variant-numeric:tabular-nums}',
	'.n5-ok{color:#35c48a}.n5-warn{color:#e6a23c}.n5-bad{color:#e05a5a}',
	'.n5-cols{display:grid;grid-template-columns:1fr 1fr;gap:12px}',
	'@media(max-width:1000px){.n5-grid{grid-template-columns:repeat(2,1fr)}.n5-cols{grid-template-columns:1fr}}',
	'@media(max-width:600px){.n5-grid{grid-template-columns:1fr 1fr}}',
	'.n5-head{display:flex;align-items:flex-end;gap:14px;margin-bottom:8px;flex-wrap:wrap}',
	'.n5-head h2{margin:0 0 6px}',
	'.n5-mascot{height:118px;width:auto;flex:0 0 auto;filter:drop-shadow(0 8px 16px rgba(0,0,0,.35));animation:n5bob 3.4s ease-in-out infinite}',
	'@keyframes n5bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-7px)}}',
	'.n5-bubble{max-width:440px;font-size:12.5px;line-height:1.55;padding:9px 14px;border-radius:14px;background:rgba(127,127,127,.12);border:1px solid rgba(127,127,127,.25);position:relative;margin-bottom:6px}',
	'.n5-bubble:before{content:"";position:absolute;left:-7px;bottom:18px;border:7px solid transparent;border-right-color:rgba(127,127,127,.25)}',
].join('\n');

return view.extend({
	load: function() {
		return Promise.all([
			fetch('/cgi-bin/rstatus?t=' + Date.now(), { cache: 'no-store' })
				.then(function(r) { return r.json(); }).catch(function() { return null; }),
			fetch('/cgi-bin/appfilter?action=state', { cache: 'no-store' })
				.then(function(r) { return r.json(); }).catch(function() { return null; })
		]);
	},

	renderInner: function(data) {
		var d = data[0] || {};
		var a = data[1] || {};
		var zh = (L.env.lang || '').indexOf('zh') === 0
			|| (L.env.lang || '').indexOf('zh-cn') === 0;
		var _s = function(zhS, enS) { return zh ? zhS : enS; };

		var style = E('style', {}, [N5CSS]);

		/* 第一行：运行时间 / 负载 / 温度 / 内存 */
		var uptime = E('div', { 'class': 'n5-value', 'id': 'n5-uptime' }, ['--']);
		var load1 = E('div', { 'class': 'n5-value', 'id': 'n5-load' }, ['--']);
		var temp = E('div', { 'class': 'n5-value', 'id': 'n5-temp' }, ['--']);
		var mem = E('div', { 'class': 'n5-value', 'id': 'n5-mem' }, ['--']);

		var grid1 = E('div', { 'class': 'n5-grid' }, [
			n5card(_s('运行时间', 'Uptime'), [uptime], E('div', { 'class': 'n5-note', 'id': 'n5-boot' }, [' '])),
			n5card(_s('CPU 负载', 'CPU Load'), [load1], E('div', { 'class': 'n5-note', 'id': 'n5-loadavg' }, [' '])),
			n5card(_s('CPU 温度', 'CPU Temp'), [temp], E('div', { 'class': 'n5-note', 'id': 'n5-tempnote' }, [' '])),
			n5card(_s('内存', 'Memory'), [mem], E('div', { 'class': 'n5-note', 'id': 'n5-memnote' }, [' ']))
		]);

		/* 第二行：WAN 流量 / WiFi / TF 存储 / 服务状态 */
		var wanRow = E('div', { 'class': 'n5-row' }, [
			E('span', { 'class': 'name' }, [_s('WAN 累计', 'WAN total')]),
			E('span', { 'class': 'val', 'id': 'n5-wan' }, ['--']),
			E('span', { 'class': 'val', 'id': 'n5-wanip' }, ['--'])
		]);
		var wifiRow = E('div', { 'class': 'n5-row' }, [
			E('span', { 'class': 'name' }, [_s('WiFi', 'WiFi')]),
			E('span', { 'class': 'val', 'id': 'n5-ssid' }, ['--']),
			E('span', { 'class': 'val', 'id': 'n5-clients' }, ['--'])
		]);
		var tfRow = E('div', { 'class': 'n5-row' }, [
			E('span', { 'class': 'name' }, [_s('TF 卡', 'TF card')]),
			E('span', { 'class': 'val', 'id': 'n5-tf' }, ['--'])
		]);
		var svcRow = E('div', { 'class': 'n5-row' }, [
			E('span', { 'class': 'name' }, [_s('服务', 'Services')]),
			E('span', { 'class': 'val', 'id': 'n5-svc' }, ['--'])
		]);

		var grid2 = E('div', { 'class': 'n5-grid' }, [
			E('div', { 'class': 'cbi-section n5-card' }, [
				E('div', { 'class': 'n5-label' }, [_s('网络流量', 'Traffic')]), wanRow, wifiRow
			]),
			E('div', { 'class': 'cbi-section n5-card' }, [
				E('div', { 'class': 'n5-label' }, [_s('存储', 'Storage')]), tfRow,
				E('div', { 'class': 'n5-bar' }, [E('i', { 'id': 'n5-tfbar', 'style': 'width:0' })])
			]),
			E('div', { 'class': 'cbi-section n5-card' }, [
				E('div', { 'class': 'n5-label' }, [_s('服务状态', 'Service status')]), svcRow
			]),
			E('div', { 'class': 'cbi-section n5-card' }, [
				E('div', { 'class': 'n5-label' }, [_s('设备 / 网站', 'Devices / Sites')]),
				E('div', { 'class': 'n5-note', 'id': 'n5-appfilter' }, ['--'])
			])
		]);

		/* 第三行：分类流量 + 网站 Top */
		var catBox = E('div', { 'class': 'cbi-section', 'id': 'n5-cats' }, [
			E('h3', {}, [_s('应用分类流量', 'Traffic by category')]),
			E('div', { 'id': 'n5-catlist' }, [E('em', {}, [_s('暂无数据', 'No data')])])
		]);
		var siteBox = E('div', { 'class': 'cbi-section', 'id': 'n5-sites' }, [
			E('h3', {}, [_s('网站流量 Top', 'Top sites')]),
			E('div', { 'id': 'n5-sitelist' }, [E('em', {}, [_s('暂无数据', 'No data')])])
		]);

		var links = E('div', { 'class': 'cbi-section' }, [
			E('a', { 'class': 'btn cbi-button', 'href': (typeof L !== 'undefined' && L.url) ? L.url('admin/n5000/appfilter') : '/cgi-bin/luci/admin/n5000/appfilter' },
				[_s('应用过滤 →', 'App filter →')]),
			' ',
			E('a', { 'class': 'btn cbi-button', 'href': (typeof L !== 'undefined' && L.url) ? L.url('admin/n5000/dashboard') : '/cgi-bin/luci/admin/n5000/dashboard' },
				[_s('流量仪表盘 →', 'Traffic dashboard →')])
		]);

		var root = E('div', {}, [
			style,
			E('div', { 'class': 'n5-head' }, [
				E('div', {}, [
					E('h2', {}, [_s('N5000 面板', 'N5000 Panel')]),
					E('div', { 'class': 'n5-bubble', 'id': 'n5-mascotmsg' }, [' '])
				]),
				E('img', { 'class': 'n5-mascot', 'src': '/luci-static/n5000/mascot.png', 'alt': '大肥鱼' })
			]),
			grid1, grid2,
			E('div', { 'class': 'n5-cols' }, [catBox, siteBox]),
			links
		]);

		var self = this;

		function paint(d, a) {
			if (!d || !d.ts) return;
			if (!document.getElementById('n5-uptime')) return;
			var tv = (d.temp || 0) / 1000;
			var memTotal = d.mem_total || 0, memAvail = d.mem_avail || 0;
			var memPct = memTotal ? (memTotal - memAvail) / memTotal * 100 : 0;
			var tfPct = d.tf_total ? (d.tf_used || 0) / d.tf_total * 100 : 0;
			var swUsed = Math.max(0, (d.swap_total || 0) - (d.swap_free || 0));
			/* 大肥鱼的碎碎念 */
			var mm = document.getElementById('n5-mascotmsg');
			if (mm) {
				var mtext;
				if (tv >= 80) mtext = _s('好烫…大肥鱼要烤熟了！', 'Too hot… the mascot is cooking!');
				else if (Number(d.load[0]) > 1.5) mtext = _s('大肥鱼在拼命游，CPU 快冒烟了', 'Mascot is sprinting, CPU is hot');
				else if (tv >= 65) mtext = _s('有点热，大肥鱼在冒汗…', 'Warm, the mascot is sweating…');
				else if ((d.clients || 0) === 0) mtext = _s('好安静，大肥鱼在发呆…', 'So quiet, the mascot is spacing out…');
				else mtext = _s('水温刚好，' + d.clients + ' 条小鱼在游～', 'Nice water, ' + d.clients + ' little fish online~');
				mm.textContent = mtext;
			}

			document.getElementById('n5-uptime').textContent = n5fmtUptime(d.uptime, zh);
			document.getElementById('n5-boot').textContent =
				_s('开机于 ', 'Booted ') + new Date((d.ts - d.uptime) * 1000).toLocaleString();
			document.getElementById('n5-load').textContent = Number(d.load[0]).toFixed(2);
			document.getElementById('n5-loadavg').textContent =
				'5m ' + Number(d.load[1]).toFixed(2) + ' · 15m ' + Number(d.load[2]).toFixed(2);
			var te = document.getElementById('n5-temp');
			te.textContent = tv.toFixed(1);
			te.className = 'n5-value ' + (tv >= 80 ? 'n5-bad' : tv >= 65 ? 'n5-warn' : 'n5-ok');
			document.getElementById('n5-tempnote').textContent =
				tv >= 80 ? _s('温度偏高', 'Hot') : tv >= 65 ? _s('正常偏高', 'Warm') : _s('温度正常', 'Normal');

			var me = document.getElementById('n5-mem');
			me.textContent = memPct.toFixed(0) + '%';
			me.className = 'n5-value ' + (memPct >= 85 ? 'n5-bad' : memPct >= 70 ? 'n5-warn' : '');
			document.getElementById('n5-memnote').textContent =
				n5fmtBytes((memTotal - memAvail) * 1024) + ' / ' + n5fmtBytes(memTotal * 1024) +
				' · swap ' + (swUsed / 1024).toFixed(1) + ' GB';

			document.getElementById('n5-wan').textContent =
				n5fmtBytes(d.wan_rx) + ' ↓ / ' + n5fmtBytes(d.wan_tx) + ' ↑';
			document.getElementById('n5-wanip').textContent = d.wan_ip || '--';
			document.getElementById('n5-ssid').textContent = d.ssid || '--';
			document.getElementById('n5-clients').textContent = (d.clients || 0) + _s(' 台', ' clients');
			document.getElementById('n5-tf').textContent =
				n5fmtBytes((d.tf_used || 0) * 1024) + ' / ' + n5fmtBytes((d.tf_total || 0) * 1024) +
				' (' + tfPct.toFixed(0) + '%)';
			document.getElementById('n5-tfbar').style.width = Math.min(100, tfPct) + '%';

			var svc = [];
			svc.push((d.pw ? 'PassWall ✓' : 'PassWall ✗'));
			svc.push((d.docker ? 'Docker ✓' : 'Docker ✗'));
			svc.push(d.errs > 0 ? _s('TF 错误 ', 'TF errors ') + d.errs : _s('TF 正常', 'TF OK'));
			document.getElementById('n5-svc').textContent = svc.join(' · ');

			if (a && a.devices) {
				var devN = a.devices.length;
				var cats = a.categories || [];
				var sites = {};
				a.devices.forEach(function(dev) {
					(dev.sites || []).forEach(function(s) { sites[s.domain] = (sites[s.domain] || 0) + s.bytes; });
				});
				var siteN = Object.keys(sites).length;
				document.getElementById('n5-appfilter').textContent =
					devN + _s(' 台设备有流量 · ', ' devices · ') + siteN + _s(' 个网站', ' sites');

				var maxB = 1;
				cats.forEach(function(c) { maxB = Math.max(maxB, c.bytes || 0); });
				var catList = cats.slice(0, 8).map(function(c) {
					return E('div', { 'class': 'n5-row' }, [
						E('span', { 'class': 'name' }, [n5catName(c.cat)]),
						E('span', { 'class': 'bar' }, [E('i', { 'style': 'width:' + Math.round((c.bytes || 0) / maxB * 100) + '%' })]),
						E('span', { 'class': 'val' }, [n5fmtBytes(c.bytes)])
					]);
				});
				var cl = document.getElementById('n5-catlist');
				cl.innerHTML = '';
				if (catList.length) catList.forEach(function(x) { cl.appendChild(x); });
				else cl.appendChild(E('em', {}, [_s('暂无数据', 'No data')]));

				var arr = Object.keys(sites).map(function(k) { return { d: k, b: sites[k] }; })
					.sort(function(x, y) { return y.b - x.b; }).slice(0, 8);
				var sl = document.getElementById('n5-sitelist');
				sl.innerHTML = '';
				if (arr.length) arr.forEach(function(s) {
					sl.appendChild(E('div', { 'class': 'n5-row' }, [
						E('span', { 'class': 'name', 'title': s.d }, [s.d]),
						E('span', { 'class': 'val' }, [n5fmtBytes(s.b)])
					]));
				});
				else sl.appendChild(E('em', {}, [_s('暂无数据', 'No data')]));
			}
		}

		function n5catName(k) {
			var map = {
				video: _s('视频', 'Video'), game: _s('游戏', 'Games'), social: _s('社交', 'Social'),
				office: _s('办公', 'Office'), shopping: _s('购物', 'Shopping'), music: _s('音乐', 'Music'),
				cloud: _s('网盘', 'Cloud'), news: _s('新闻', 'News'), edu: _s('教育', 'Education'),
				system: _s('系统更新', 'System'), other: _s('其他', 'Other'), unknown: _s('未识别', 'Unknown')
			};
			return map[k] || k;
		}

		setTimeout(function() { paint(d, a); }, 100);

		poll.add(function() {
			return Promise.all([
				fetch('/cgi-bin/rstatus?t=' + Date.now(), { cache: 'no-store' }).then(function(r) { return r.json(); }).catch(function() { return null; }),
				fetch('/cgi-bin/appfilter?action=state', { cache: 'no-store' }).then(function(r) { return r.json(); }).catch(function() { return null; })
			]).then(function(res) { paint(res[0], res[1]); });
		}, 5);

		return root;
	},

	render: function(data) {
		try {
			return this.renderInner(data);
		}
		catch (e) {
			return E('div', {}, [
				E('h2', {}, ['N5000 面板']),
				E('p', {}, ['面板加载失败: ' + (e && e.message ? e.message : e)]),
				E('a', { 'href': '/dashboard.html', 'class': 'btn cbi-button' }, ['打开独立仪表盘'])
			]);
		}
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});


