'use strict';
'require view';
'require poll';

var STCSS = [
	'.st-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:14px}',
	'@media(max-width:1000px){.st-grid{grid-template-columns:repeat(2,1fr)}}',
	'.st-card{padding:16px 18px;border:1px solid #d9d9d9;background:#fff;border-radius:2px;color:#111}',
	'.st-card .l{font-size:10.5px;letter-spacing:.14em;text-transform:uppercase;opacity:.6;font-weight:600}',
	'.st-card .v{font-size:24px;font-weight:700;margin-top:6px}',
	'.st-card .u{font-size:11px;opacity:.55;margin-left:4px}',
	'.st-card .s{font-size:11.5px;opacity:.6;margin-top:3px}',
	'.st-bar{height:6px;background:#eee;border-radius:2px;overflow:hidden;margin:10px 0}',
	'.st-bar i{display:block;height:100%;width:0;background:#111;transition:width .3s}',
	'.st-row{display:flex;align-items:center;gap:12px;flex-wrap:wrap}',
	'.st-btn{font:inherit;font-size:14px;padding:10px 28px;border-radius:2px;cursor:pointer;border:0;background:#111;color:#fafafa}',
	'.st-btn:hover{background:#333}',
	'.st-btn:disabled{opacity:.45;cursor:default}',
	'.st-note{font-size:11.5px;opacity:.6;line-height:1.7;margin-top:12px}',
	'.st-phase{font-size:13px;font-weight:600}',
	'html[data-argon-mode="dark"] .st-card, html[data-np-dark="1"] .st-card{background:#141a21;border-color:#2a3440;color:#e6e6e6}',
	'html[data-argon-mode="dark"] .st-btn, html[data-np-dark="1"] .st-btn{background:#e6e6e6;color:#111}',
	'html[data-argon-mode="dark"] .st-bar, html[data-np-dark="1"] .st-bar{background:#2a3440}',
	'html[data-argon-mode="dark"] .st-bar i, html[data-np-dark="1"] .st-bar i{background:#e6e6e6}'
].join('\n');

var PHASES = { ping: '测试延迟…', download: '测试下行速度…', upload: '测试上行速度…', done: '完成', idle: '未开始' };

return view.extend({
	load: function() {
		return fetch('/cgi-bin/speedtest?action=status', { cache: 'no-store' })
			.then(function(r) { return r.json(); })
			.catch(function() { return { state: 'idle' }; });
	},

	start: function() {
		var self = this;
		if (this.running) return Promise.resolve();
		this.running = true;
		this.paint({ state: 'running', phase: 'ping' });
		return fetch('/cgi-bin/speedtest?action=start', { cache: 'no-store' })
			.then(function(r) { return r.json(); })
			.then(function(j) { if (j && j.state) self.st = j; self.paint(j); })
			.catch(function(e) { self.running = false; self.paint({ state: 'error' }); });
	},

	renderInner: function(st) {
		var self = this;
		this.st = st || { state: 'idle' };
		this.running = (this.st.state === 'running');

		this.btn = E('button', { 'class': 'st-btn', click: function() { self.start(); } }, ['开始测速']);
		this.phase = E('div', { 'class': 'st-phase', 'id': 'st-phase' }, [' ']);
		this.bar = E('div', { 'class': 'st-bar' }, [E('i', { 'id': 'st-bar-i' })]);
		this.cards = E('div', { 'class': 'st-grid' }, [' ']);

		var root = E('div', {}, [
			E('style', {}, [STCSS]),
			E('h2', {}, ['测速面板']),
			E('div', { 'class': 'cbi-section', 'style': 'padding:18px 20px;border:1px solid #d9d9d9;background:#fff;border-radius:2px;color:#111' }, [
				E('div', { 'class': 'st-row' }, [this.btn, this.phase]),
				this.bar
			]),
			this.cards,
			E('div', { 'class': 'st-note' }, [
				E('div', {}, ['• 测速由路由器发起（WAN 侧到公网），结果为「路由器→互联网」的带宽，不是单台设备的无线速率。']),
				E('div', {}, ['• 下行使用清华/中科大镜像与 Cloudflare 三个源并行取最快；上行使用 Cloudflare 上传端点。']),
				E('div', {}, ['• 测速会产生约 30~60MB 流量，请避开正在下载/看视频的时段。']),
				E('div', {}, ['• 上行显示「不可测」表示当前网络到测试服务器上传不通，不代表宽带没有上行。'])
			])
		]);

		setTimeout(function() { self.paint(self.st); }, 60);
		poll.add(function() {
			return fetch('/cgi-bin/speedtest?action=status', { cache: 'no-store' })
				.then(function(r) { return r.json(); })
				.then(function(j) {
					if (!j) return;
					if (j.state === 'running') { self.running = true; self.st = j; self.paint(j); }
					else if (self.running) { self.running = false; self.st = j; self.paint(j); }
				});
		}, 2);
		return root;
	},

	paint: function(st) {
		st = st || {};
		if (!document.getElementById('st-phase')) return;
		var running = (st.state === 'running');
		this.btn.disabled = running;
		this.btn.textContent = running ? '测速中…' : '开始测速';
		this.phase.textContent = PHASES[st.phase] || (st.state === 'idle' ? '未开始' : '');
		var pct = { ping: 12, download: 45, upload: 80, done: 100 }[st.phase] || 0;
		var bar = document.getElementById('st-bar-i');
		if (bar) bar.style.width = pct + '%';

		var mbps = function(v) {
			if (v === undefined || v === null || v === -1) return '--';
			return (v * 8 / 1000000).toFixed(1);
		};
		var down = st.down ? mbps(st.down) : '--';
		var up = st.up === -1 ? '不可测' : (st.up ? mbps(st.up) : '--');
		var cards = [
			{ l: '下行', v: down, u: down === '--' ? '' : 'Mbps', s: '下载' },
			{ l: '上行', v: up, u: (up === '--' || up === '不可测') ? '' : 'Mbps', s: '上传' },
			{ l: '延迟', v: st.ping ? Math.round(st.ping) : '--', u: st.ping ? 'ms' : '', s: '到 223.5.5.5' },
			{ l: '状态', v: PHASES[st.phase] || (st.state === 'idle' ? '未开始' : st.state), u: '', s: st.cost ? ('耗时 ' + st.cost + ' 秒') : '' }
		];
		var html = '';
		cards.forEach(function(c) {
			html += '<div class="st-card"><div class="l">' + c.l + '</div><div class="v">' + c.v + '<span class="u">' + c.u + '</span></div><div class="s">' + c.s + '</div></div>';
		});
		this.cards.innerHTML = html;
	},

	render: function(data) {
		try { return this.renderInner(data); }
		catch (e) { return E('div', {}, [E('h2', {}, ['测速面板']), E('p', {}, ['加载失败: ' + (e && e.message ? e.message : e)])]); }
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
