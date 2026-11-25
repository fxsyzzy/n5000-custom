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
			E('h3', {}, ['WAN 实时速率']),
			E('div', { 'style': 'display:flex;gap:20px;font-size:12px;margin-bottom:6px' }, [
				E('span', { 'id': 'db-down' }, ['↓ 0.00 Mbps']),
				E('span', { 'id': 'db-up' }, ['↑ 0.00 Mbps'])
			]),
			canvas
		]);

		var root = E('div', {}, [
			E('style', {}, [DBCSS]),
			E('h2', {}, ['N5000 流量仪表盘']),
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
			chart,
			E('div', { 'class': 'db-cols' }, [
				E('div', { 'class': 'cbi-section' }, [E('h3', {}, ['分类流量']), E('div', { 'id': 'db-cats' }, [' '])]),
				E('div', { 'class': 'cbi-section' }, [E('h3', {}, ['网站 Top 10']), E('div', { 'id': 'db-sites' }, [' '])])
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
					E('div', {}, [E('h4', { 'style': 'margin:4px 0 8px' }, ['流量用在哪（网站 Top 10）']), E('div', { 'id': 'db-tsites' }, [' '])])
				]),
				E('div', { 'class': 'db-note', 'style': 'margin-top:12px' }, ['近 30 天每日流量']),
				E('canvas', { 'id': 'db-days', 'style': 'width:100%;height:120px;display:block' })
			]),
			E('div', { 'class': 'cbi-section' }, [E('h3', {}, ['设备流量']), E('div', { 'id': 'db-devs' }, [' '])]),

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
			line('down', 'var(--primary)' === '' ? '#48A9C5' : '#48A9C5');
			line('up', '#83D9DC');
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
			arr.forEach(function(s) {
				sl.appendChild(E('div', { 'class': 'db-row' }, [
					E('span', { 'class': 'nm', 'title': s.d }, [s.d]),
					E('span', { 'class': 'vl' }, [dbFmt(s.b)])
				]));
			});

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
			sites.slice(0, 10).forEach(function(x) {
				sl.appendChild(E('div', { 'class': 'db-row' }, [
					E('span', { 'class': 'nm', 'title': x.domain }, [x.domain]),
					E('span', { 'class': 'vl' }, [dbFmt(x.bytes)])
				]));
			});

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
				ctx.fillStyle = (i === n - 1) ? '#48A9C5' : 'rgba(72,169,197,.42)';
				ctx.fillRect(xx, h - bh - 2, bw, bh);
			});
			ctx.fillStyle = 'rgba(200,244,249,.55)';
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
		}, 5);

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
