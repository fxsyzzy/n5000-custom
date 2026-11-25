'use strict';
'require view';
'require poll';

function npFmt(b) {
	b = Number(b) || 0;
	if (b > 1099511627776) return (b / 1099511627776).toFixed(2) + ' TB';
	if (b > 1073741824) return (b / 1073741824).toFixed(2) + ' GB';
	if (b > 1048576) return (b / 1048576).toFixed(1) + ' MB';
	if (b > 1024) return (b / 1024).toFixed(0) + ' KB';
	return b + ' B';
}
function npUptime(s) {
	s = Math.max(0, Math.floor(s || 0));
	var d = Math.floor(s / 86400), h = Math.floor(s % 86400 / 3600), m = Math.floor(s % 3600 / 60);
	if (d > 0) return d + '天 ' + h + '时';
	if (h > 0) return h + '时 ' + m + '分';
	return m + '分';
}

var NPCSS = [
	'.np{display:flex;flex-direction:column;gap:12px}',
	'.np-top{display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:10px 14px;border-radius:14px;',
	'border:1px solid rgba(131,217,220,.24);background:linear-gradient(180deg,rgba(200,244,249,.07),rgba(13,44,84,.28));',
	'backdrop-filter:blur(12px) saturate(150%);-webkit-backdrop-filter:blur(12px) saturate(150%)}',
	'.np-brand{display:flex;align-items:center;gap:8px;font-weight:600;font-size:14px}',
	'.np-signal{width:26px;height:26px;border-radius:8px;display:flex;align-items:center;justify-content:center;',
	'background:var(--primary,#48A9C5);color:#04121a}',
	'.np-badge{font-size:11px;padding:2px 8px;border-radius:999px;border:1px solid rgba(131,217,220,.3);opacity:.85}',
	'.np-chips{margin-left:auto;display:flex;gap:8px;flex-wrap:wrap}',
	'.np-chip{font-size:11.5px;padding:4px 10px;border-radius:999px;border:1px solid rgba(131,217,220,.24);',
	'background:rgba(13,44,84,.35)}',
	'.np-main{display:grid;grid-template-columns:1fr 330px;gap:12px;align-items:stretch}',
	'.np-panel{border:1px solid rgba(131,217,220,.24);border-radius:16px;',
	'background:linear-gradient(180deg,rgba(200,244,249,.06),rgba(13,44,84,.28));',
	'backdrop-filter:blur(14px) saturate(160%);-webkit-backdrop-filter:blur(14px) saturate(160%)}',
	'.np-hero{position:relative;overflow:hidden;display:flex;flex-direction:column;align-items:center;padding:16px;min-height:440px}',
	'.np-hero-head{width:100%;display:flex;align-items:center;gap:8px;font-size:12px;opacity:.75}',
	'.np-art{width:min(420px,86%);height:auto;margin:6px auto 2px;filter:drop-shadow(0 18px 30px rgba(0,0,0,.35))}',
	'.np-name{font-size:22px;font-weight:700;letter-spacing:.4px;margin-top:2px}',
	'.np-sub{font-size:12px;opacity:.6;margin-top:4px}',
	'.np-callouts{display:flex;gap:10px;margin-top:12px;flex-wrap:wrap;justify-content:center}',
	'.np-call{font-size:11.5px;padding:4px 11px;border-radius:999px;border:1px solid rgba(131,217,220,.3);',
	'background:rgba(13,44,84,.4)}',
	'.np-rates{width:100%;display:flex;align-items:flex-end;gap:18px;margin-top:auto;padding-top:14px}',
	'.np-rate{font-size:13px;opacity:.85}',
	'.np-rate b{font-size:17px;font-weight:700;margin-left:3px}',
	'.np-spark{flex:1;height:46px;min-width:80px}',
	'.np-side{display:flex;flex-direction:column;gap:10px}',
	'.np-card{padding:11px 14px}',
	'.np-card .t{display:flex;justify-content:space-between;align-items:baseline;font-size:12px;opacity:.8}',
	'.np-card .t b{font-size:20px;font-weight:700;opacity:1}',
	'.np-card .s{font-size:11.5px;opacity:.55;margin-top:3px}',
	'.np-bar{height:4px;border-radius:3px;background:rgba(127,127,127,.25);overflow:hidden;margin-top:7px}',
	'.np-bar>i{display:block;height:100%;border-radius:3px;background:var(--primary,#48A9C5);width:0;transition:width .4s}',
	'.np-mini{display:grid;grid-template-columns:1fr 1fr;gap:8px}',
	'.np-apps{display:flex;gap:8px;margin-top:8px;overflow:hidden}',
	'.np-app{flex:1;min-width:0;text-align:center}',
	'.np-tile{width:34px;height:34px;border-radius:10px;margin:0 auto 4px;display:flex;align-items:center;justify-content:center;',
	'font-size:14px;font-weight:700;color:#04121a}',
	'.np-app .n{font-size:10.5px;opacity:.8;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
	'.np-app .v{font-size:10px;opacity:.5}',
	'.np-bottom{padding:12px 16px;display:flex;flex-direction:column;gap:10px}',
	'.np-stats{display:grid;grid-template-columns:repeat(6,1fr);gap:10px}',
	'.np-stat{display:flex;flex-direction:column;gap:2px}',
	'.np-stat .l{font-size:10.5px;letter-spacing:.1em;opacity:.55;text-transform:uppercase}',
	'.np-stat .v{font-size:16px;font-weight:700}',
	'.np-actions{display:grid;grid-template-columns:repeat(9,1fr);gap:8px;border-top:1px solid rgba(131,217,220,.16);padding-top:10px}',
	'.np-act{display:flex;flex-direction:column;align-items:center;gap:4px;font-size:10.5px;opacity:.8;text-decoration:none;',
	'color:inherit;padding:6px 2px;border-radius:10px}',
	'.np-act:hover{background:rgba(72,169,197,.16);opacity:1}',
	'.np-act .i{font-size:17px;line-height:1}',
	'.np-ok{color:#35c48a}.np-warn{color:#e6a23c}.np-bad{color:#e05a5a}',
	'@media(max-width:1100px){.np-main{grid-template-columns:1fr}.np-actions{grid-template-columns:repeat(5,1fr)}.np-stats{grid-template-columns:repeat(3,1fr)}}',
	'@media(max-width:640px){.np-actions{grid-template-columns:repeat(4,1fr)}.np-stats{grid-template-columns:repeat(2,1fr)}}'
].join('\n');

var NP_COLORS = ['#48A9C5', '#83D9DC', '#1E5B8C', '#7FA8FF', '#5ef2c0'];

return view.extend({
	load: function() {
		return Promise.all([
			fetch('/cgi-bin/rstatus?t=' + Date.now(), { cache: 'no-store' }).then(function(r) { return r.json(); }).catch(function() { return null; }),
			fetch('/cgi-bin/appfilter?action=state', { cache: 'no-store' }).then(function(r) { return r.json(); }).catch(function() { return null; })
		]);
	},

	renderInner: function(data) {
		var self = this;
		var d = data[0] || {}, af = data[1] || {};
		var samples = [], prev = null;

		function url(p) { return (typeof L !== 'undefined' && L.url) ? L.url(p) : '/cgi-bin/luci/' + p; }

		function card(id, title, extra) {
			return E('div', { 'class': 'np-panel np-card' }, [
				E('div', { 'class': 't' }, [E('span', {}, [title]), E('b', { 'id': id }, ['--'])]),
				E('div', { 'class': 's', 'id': id + '-s' }, [' ']),
				E('div', { 'class': 'np-bar' }, [E('i', { 'id': id + '-bar' })])
			].concat(extra || []));
		}

		var spark = E('canvas', { 'class': 'np-spark', 'id': 'np-spark' });
		var hero = E('div', { 'class': 'np-panel np-hero' }, [
			E('div', { 'class': 'np-hero-head' }, [
				E('span', { 'class': 'np-badge' }, ['N5000 路由']),
				E('span', { 'id': 'np-herostatus' }, ['在线']),
				E('span', { 'style': 'margin-left:auto', 'id': 'np-heroip' }, [' '])
			]),
			E('img', { 'class': 'np-art', 'src': '/luci-static/n5000/router.svg', 'alt': 'N5000' }),
			E('div', { 'class': 'np-name' }, ['NRadio N5000']),
			E('div', { 'class': 'np-sub' }, ['MT7987A 四核 ARM · WiFi 7 BE5000 · 1GB RAM · 双 2.5G']),
			E('div', { 'class': 'np-callouts' }, [
				E('span', { 'class': 'np-call' }, ['WAN 2.5G']),
				E('span', { 'class': 'np-call' }, ['LAN 2.5G · 192.168.88.1']),
				E('span', { 'class': 'np-call', 'id': 'np-wifi' }, ['WiFi --'])
			]),
			E('div', { 'class': 'np-rates' }, [
				E('span', { 'class': 'np-rate' }, ['↓', E('b', { 'id': 'np-down' }, ['0.00']), ' Mbps']),
				E('span', { 'class': 'np-rate' }, ['↑', E('b', { 'id': 'np-up' }, ['0.00']), ' Mbps']),
				spark
			])
		]);

		var side = E('div', { 'class': 'np-side' }, [
			card('np-cpu', 'CPU 占用'),
			card('np-mem', '内存占用'),
			card('np-tf', '存储占用'),
			E('div', { 'class': 'np-panel np-card' }, [
				E('div', { 'class': 't' }, [E('span', {}, ['网络']), E('span', { 'class': 'np-badge', 'id': 'np-wanstate' }, ['--'])]),
				E('div', { 'class': 's', 'id': 'np-wan' }, [' ']),
				E('div', { 'class': 's', 'id': 'np-lan' }, [' '])
			]),
			E('div', { 'class': 'np-panel np-card' }, [
				E('div', { 'class': 't' }, [E('span', {}, ['服务状态'])]),
				E('div', { 'class': 's', 'id': 'np-svc' }, [' '])
			]),
			E('div', { 'class': 'np-panel np-card' }, [
				E('div', { 'class': 't' }, [E('span', {}, ['活跃应用 TOP5']), E('span', { 'class': 'np-badge', 'id': 'np-apps-total' }, ['--'])]),
				E('div', { 'class': 'np-apps', 'id': 'np-apps' }, [])
			])
		]);

		var stats = E('div', { 'class': 'np-stats' }, [
			E('div', { 'class': 'np-stat' }, [E('div', { 'class': 'l' }, ['处理器']), E('div', { 'class': 'v', 'id': 'np-st-cpu' }, ['--'])]),
			E('div', { 'class': 'np-stat' }, [E('div', { 'class': 'l' }, ['内存']), E('div', { 'class': 'v', 'id': 'np-st-mem' }, ['--'])]),
			E('div', { 'class': 'np-stat' }, [E('div', { 'class': 'l' }, ['温度']), E('div', { 'class': 'v', 'id': 'np-st-temp' }, ['--'])]),
			E('div', { 'class': 'np-stat' }, [E('div', { 'class': 'l' }, ['运行时间']), E('div', { 'class': 'v', 'id': 'np-st-uptime' }, ['--'])]),
			E('div', { 'class': 'np-stat' }, [E('div', { 'class': 'l' }, ['在线设备']), E('div', { 'class': 'v', 'id': 'np-st-clients' }, ['--'])]),
			E('div', { 'class': 'np-stat' }, [E('div', { 'class': 'l' }, ['识别网站']), E('div', { 'class': 'v', 'id': 'np-st-sites' }, ['--'])])
		]);

		var actions = E('div', { 'class': 'np-actions' }, [
			E('a', { 'class': 'np-act', 'href': url('admin/network/wireless') }, [E('span', { 'class': 'i' }, ['📶']), E('span', {}, ['无线设置'])]),
			E('a', { 'class': 'np-act', 'href': url('admin/n5000/appfilter') }, [E('span', { 'class': 'i' }, ['🧱']), E('span', {}, ['应用过滤'])]),
			E('a', { 'class': 'np-act', 'href': url('admin/n5000/favorites') }, [E('span', { 'class': 'i' }, ['⭐']), E('span', {}, ['收藏夹'])]),
			E('a', { 'class': 'np-act', 'href': url('admin/n5000/ai') }, [E('span', { 'class': 'i' }, ['🤖']), E('span', {}, ['AI 助手'])]),
			E('a', { 'class': 'np-act', 'href': url('admin/n5000/dashboard') }, [E('span', { 'class': 'i' }, ['📈']), E('span', {}, ['流量仪表盘'])]),
			E('a', { 'class': 'np-act', 'href': url('admin/status/syslog') }, [E('span', { 'class': 'i' }, ['📋']), E('span', {}, ['系统日志'])]),
			E('a', { 'class': 'np-act', 'href': url('admin/status/overview') }, [E('span', { 'class': 'i' }, ['🗂']), E('span', {}, ['系统概览'])]),
			E('a', { 'class': 'np-act', 'href': url('admin/system/reboot') }, [E('span', { 'class': 'i' }, ['⟳']), E('span', {}, ['重启设备'])]),
			E('a', { 'class': 'np-act', 'href': url('admin/system/admin') }, [E('span', { 'class': 'i' }, ['⚙']), E('span', {}, ['系统设置'])])
		]);

		var root = E('div', { 'class': 'np' }, [
			E('style', {}, [NPCSS]),
			E('div', { 'class': 'np-top' }, [
				E('div', { 'class': 'np-brand' }, [
					E('span', { 'class': 'np-signal' }, ['📡']),
					E('span', { 'id': 'np-host' }, [d.host || 'N5000']),
					E('span', { 'class': 'np-badge', 'id': 'np-link' }, ['--'])
				]),
				E('div', { 'class': 'np-chips' }, [
					(function() {
						var cur = document.documentElement.getAttribute('data-argon-mode') || 'dark';
						var isDark = cur !== 'light';
						return E('button', {
							'class': 'np-chip',
							'style': 'cursor:pointer;color:inherit;font:inherit',
							click: function() {
								fetch('/cgi-bin/theme?to=' + (isDark ? 'light' : 'dark'), { cache: 'no-store' })
									.then(function(r) { return r.json(); })
									.then(function() { location.reload(); })
									.catch(function() { location.reload(); });
							}
						}, [isDark ? '☀ 晨光模式' : '🌙 暗夜模式']);
					})(),
					E('span', { 'class': 'np-chip', 'id': 'np-chip-temp' }, ['温度 --']),
					E('span', { 'class': 'np-chip', 'id': 'np-chip-load' }, ['负载 --']),
					E('span', { 'class': 'np-chip', 'id': 'np-chip-uptime' }, ['运行 --']),
					E('span', { 'class': 'np-chip', 'id': 'np-chip-wan' }, ['WAN --'])
				])
			]),
			E('div', { 'class': 'np-main' }, [hero, side]),
			E('div', { 'class': 'np-panel np-bottom' }, [stats, actions])
		]);

		function drawSpark() {
			var c = document.getElementById('np-spark');
			if (!c || !c.getContext) return;
			var dpr = window.devicePixelRatio || 1;
			var w = c.clientWidth, h = c.clientHeight;
			if (!w || !h) return;
			if (c.width !== Math.round(w * dpr) || c.height !== Math.round(h * dpr)) {
				c.width = Math.round(w * dpr); c.height = Math.round(h * dpr);
			}
			var ctx = c.getContext('2d');
			ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
			ctx.clearRect(0, 0, w, h);
			if (samples.length < 2) return;
			var max = 1;
			samples.forEach(function(s) { max = Math.max(max, s.down, s.up); });
			max *= 1.2;
			function line(key, color) {
				ctx.beginPath();
				samples.forEach(function(s, i) {
					var x = i / (samples.length - 1) * w;
					var y = h - (s[key] / max) * h * 0.9 - 1;
					if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
				});
				ctx.strokeStyle = color; ctx.lineWidth = 1.8; ctx.stroke();
			}
			line('down', '#48A9C5');
			line('up', '#83D9DC');
		}

		function paint(d2, af2) {
			if (!d2 || !document.getElementById('np-cpu')) return;
			var tv = (d2.temp || 0) / 1000;
			var memTotal = d2.mem_total || 0, memAvail = d2.mem_avail || 0;
			var memPct = memTotal ? (memTotal - memAvail) / memTotal * 100 : 0;
			var tfPct = d2.tf_total ? (d2.tf_used || 0) / d2.tf_total * 100 : 0;
			var load1 = Number(d2.load && d2.load[0]) || 0;

			var host = document.getElementById('np-host');
			if (host) host.textContent = d2.host || 'N5000';
			document.getElementById('np-herostatus').textContent = '在线 · 运行 ' + npUptime(d2.uptime);
			document.getElementById('np-heroip').textContent = 'WAN ' + (d2.wan_ip || '--');
			document.getElementById('np-wifi').textContent = 'WiFi ' + (d2.ssid || '--');
			document.getElementById('np-link').textContent = 'WAN ' + (d2.wan_ip ? '已连接' : '未连接');
			document.getElementById('np-chip-temp').textContent = '温度 ' + tv.toFixed(1) + '°C';
			document.getElementById('np-chip-load').textContent = '负载 ' + load1.toFixed(2);
			document.getElementById('np-chip-uptime').textContent = '运行 ' + npUptime(d2.uptime);
			document.getElementById('np-chip-wan').textContent = 'WAN ' + (d2.wan_ip || '--');

			/* CPU */
			var cpuPct = Math.min(100, Math.round(load1 / 2 * 100));
			document.getElementById('np-cpu').textContent = cpuPct + '%';
			document.getElementById('np-cpu-s').textContent = '4 核 · 负载 ' + load1.toFixed(2);
			document.getElementById('np-cpu-bar').style.width = cpuPct + '%';
			/* 内存 */
			document.getElementById('np-mem').textContent = memPct.toFixed(0) + '%';
			document.getElementById('np-mem-s').textContent = npFmt((memTotal - memAvail) * 1024) + ' / ' + npFmt(memTotal * 1024);
			document.getElementById('np-mem-bar').style.width = Math.min(100, memPct) + '%';
			/* 存储 */
			document.getElementById('np-tf').textContent = tfPct.toFixed(0) + '%';
			document.getElementById('np-tf-s').textContent = npFmt((d2.tf_used || 0) * 1024) + ' / ' + npFmt((d2.tf_total || 0) * 1024);
			document.getElementById('np-tf-bar').style.width = Math.min(100, tfPct) + '%';
			/* 网络 */
			document.getElementById('np-wanstate').textContent = d2.wan_ip ? '已连接' : '未连接';
			document.getElementById('np-wan').textContent = 'WAN eth1 · ' + (d2.wan_ip || '--') + ' · ' + npFmt(d2.wan_rx) + '↓ ' + npFmt(d2.wan_tx) + '↑';
			document.getElementById('np-lan').textContent = 'LAN br-lan · ' + (d2.lan_ip || '--') + ' · ' + npFmt(d2.lan_rx) + '↓ ' + npFmt(d2.lan_tx) + '↑';
			/* 服务 */
			var svc = [];
			svc.push('PassWall ' + (d2.pw ? '✓' : '✗'));
			svc.push('Docker ' + (d2.docker ? '✓' : '✗'));
			svc.push('TF ' + ((d2.errs || 0) > 0 ? ('✗ ' + d2.errs) : '✓'));
			document.getElementById('np-svc').textContent = svc.join(' · ');
			/* 底部 */
			document.getElementById('np-st-cpu').textContent = cpuPct + '%';
			document.getElementById('np-st-mem').textContent = memPct.toFixed(0) + '%';
			var te = document.getElementById('np-st-temp');
			te.textContent = tv.toFixed(0) + '°C';
			te.className = 'v ' + (tv >= 80 ? 'np-bad' : tv >= 65 ? 'np-warn' : 'np-ok');
			document.getElementById('np-st-uptime').textContent = npUptime(d2.uptime);
			document.getElementById('np-st-clients').textContent = (d2.clients || 0) + ' 台';

			/* 活跃应用 TOP5 */
			var devs = (af2 && af2.devices) || [];
			var sites = {};
			devs.forEach(function(dv) { (dv.sites || []).forEach(function(s) { sites[s.domain] = (sites[s.domain] || 0) + s.bytes; }); });
			var arr = Object.keys(sites).map(function(k) { return { d: k, b: sites[k] }; })
				.sort(function(a, b) { return b.b - a.b; }).slice(0, 5);
			var siteN = Object.keys(sites).length;
			document.getElementById('np-st-sites').textContent = siteN;
			document.getElementById('np-apps-total').textContent = siteN + ' 个';
			var box = document.getElementById('np-apps');
			if (box) {
				box.innerHTML = '';
				arr.forEach(function(s, i) {
					var label = (s.d || '?').replace(/^www\./, '').split('.')[0] || '?';
					var color = NP_COLORS[i % NP_COLORS.length];
					var tile = E('div', { 'class': 'np-tile', 'style': 'background:' + color + ';overflow:hidden' });
					var img = E('img', {
						'src': 'https://' + s.d + '/favicon.ico',
						'width': '20', 'height': '20',
						'style': 'display:block;border-radius:4px',
						'alt': '',
						'loading': 'lazy'
					});
					img.addEventListener('error', function() {
						if (img.parentNode) img.parentNode.removeChild(img);
						tile.textContent = label.charAt(0).toUpperCase();
					});
					tile.appendChild(img);
					box.appendChild(E('div', { 'class': 'np-app' }, [
						tile,
						E('div', { 'class': 'n', 'title': s.d }, [label.slice(0, 8)]),
						E('div', { 'class': 'v' }, [npFmt(s.b)])
					]));
				});
				if (!arr.length) box.appendChild(E('div', { 'class': 's' }, ['暂无数据']));
			}

			/* 速率 */
			var down = 0, up = 0;
			if (prev && d2.ts > prev.ts) {
				var dt = d2.ts - prev.ts;
				down = Math.max(0, (d2.wan_rx - prev.rx) * 8 / dt / 1e6);
				up = Math.max(0, (d2.wan_tx - prev.tx) * 8 / dt / 1e6);
			}
			prev = { ts: d2.ts, rx: d2.wan_rx, tx: d2.wan_tx };
			document.getElementById('np-down').textContent = down.toFixed(2);
			document.getElementById('np-up').textContent = up.toFixed(2);
			samples.push({ down: down, up: up });
			if (samples.length > 60) samples.shift();
			drawSpark();
		}

		setTimeout(function() { paint(d, af); }, 100);

		poll.add(function() {
			return Promise.all([
				fetch('/cgi-bin/rstatus?t=' + Date.now(), { cache: 'no-store' }).then(function(r) { return r.json(); }).catch(function() { return null; }),
				fetch('/cgi-bin/appfilter?action=state', { cache: 'no-store' }).then(function(r) { return r.json(); }).catch(function() { return null; })
			]).then(function(res) { paint(res[0] || d, res[1] || af); });
		}, 5);

		return root;
	},

	render: function(data) {
		try {
			return this.renderInner(data);
		}
		catch (e) {
			return E('div', {}, [E('h2', {}, ['N5000 面板']), E('p', {}, ['加载失败: ' + (e && e.message ? e.message : e)])]);
		}
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
