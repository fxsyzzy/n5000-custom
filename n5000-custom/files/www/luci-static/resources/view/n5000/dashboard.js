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
	'.db-bar>i{display:block;height:100%;border-radius:3px;background:var(--primary,#4C7DFF)}',
	'.db-ok{color:#35c48a}.db-warn{color:#e6a23c}.db-bad{color:#e05a5a}',
	'.db-cols{display:grid;grid-template-columns:1fr 1fr;gap:12px}',
	'.db-row{display:flex;align-items:center;gap:10px;font-size:12.5px;margin-bottom:8px}',
	'.db-row .nm{width:110px;flex:0 0 auto;opacity:.75;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
	'.db-row .bar{flex:1;margin:0}',
	'.db-row .vl{width:90px;text-align:right;font-variant-numeric:tabular-nums}',
	'@media(max-width:1000px){.db-grid{grid-template-columns:repeat(2,1fr)}.db-cols{grid-template-columns:1fr}}',
	'.db-mascot{position:fixed;right:20px;bottom:14px;z-index:600;display:flex;align-items:flex-end;gap:10px;cursor:pointer;user-select:none;max-width:66vw}',
	'.db-mascot img{height:132px;width:auto;filter:drop-shadow(0 8px 18px rgba(0,0,0,.4));animation:dbBob 3.4s ease-in-out infinite}',
	'@keyframes dbBob{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}',
	'.db-mascot .msg{font-size:12px;line-height:1.5;padding:9px 13px;border-radius:14px;background:rgba(127,127,127,.14);border:1px solid rgba(127,127,127,.28);max-width:340px}',
	'.db-mascot.swim img{animation:dbSwim 2.6s ease-in-out forwards}',
	'@keyframes dbSwim{0%{transform:translateX(0) scale(1)}45%{transform:translateX(-60vw) scale(1.06)}100%{transform:translateX(-130vw) scale(.92)}}',
].join('\n');

return view.extend({
	load: function() {
		return Promise.all([
			fetch('/cgi-bin/rstatus?t=' + Date.now(), { cache: 'no-store' }).then(function(r) { return r.json(); }).catch(function() { return null; }),
			fetch('/cgi-bin/appfilter?action=state', { cache: 'no-store' }).then(function(r) { return r.json(); }).catch(function() { return null; })
		]);
	},

	renderInner: function(data) {
		var d = data[0] || {}, af = data[1] || {};
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
			E('div', { 'class': 'cbi-section' }, [E('h3', {}, ['设备流量']), E('div', { 'id': 'db-devs' }, [' '])]),
			E('div', { 'class': 'db-mascot', 'id': 'db-mascot', click: function() {
				var m = document.getElementById('db-mascot');
				if (!m || m.classList.contains('swim')) return;
				m.classList.add('swim');
				setTimeout(function() { m.classList.remove('swim'); }, 2800);
			}}, [
				E('div', { 'class': 'msg', 'id': 'db-mascotmsg' }, [' ']),
				E('img', { 'src': '/luci-static/n5000/mascot.png', 'alt': '大肥鱼' })
			])

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
			line('down', 'var(--primary)' === '' ? '#4C7DFF' : '#4C7DFF');
			line('up', '#7FA8FF');
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

			/* 大肥鱼 */
			var mmEl = document.getElementById('db-mascotmsg');
			if (mmEl) {
				var mt;
				if (tv >= 80) mt = '好烫…大肥鱼要烤熟了！';
				else if (Number(d.load[0]) > 1.5) mt = '大肥鱼在拼命游…';
				else if (tv >= 65) mt = '有点热，大肥鱼在冒汗…';
				else if ((d.clients || 0) === 0) mt = '好安静，大肥鱼在发呆…';
				else mt = '水温刚好，' + d.clients + ' 条小鱼在游（点我试试）';
				mmEl.textContent = mt;
			}
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

		setTimeout(paint, 100);
		window.addEventListener('resize', drawChart);

		poll.add(function() {
			return Promise.all([
				fetch('/cgi-bin/rstatus?t=' + Date.now(), { cache: 'no-store' }).then(function(r) { return r.json(); }).catch(function() { return null; }),
				fetch('/cgi-bin/appfilter?action=state', { cache: 'no-store' }).then(function(r) { return r.json(); }).catch(function() { return null; })
			]).then(function(res) { if (res[0]) d = res[0]; if (res[1]) af = res[1]; paint(); });
		}, 3);

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
