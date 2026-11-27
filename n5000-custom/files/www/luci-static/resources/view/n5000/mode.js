'use strict';
'require view';
'require poll';

var MCSS = [
	'.md-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px;margin-bottom:14px}',
	'@media(max-width:900px){.md-grid{grid-template-columns:1fr}}',
	'.md-card{padding:16px 18px;border:1px solid #d9d9d9;background:#fff;border-radius:2px;transition:border-color .2s}',
	'.md-card.cur{border-color:#111;box-shadow:0 0 0 1px #111}',
	'.md-card h3{margin:0 0 6px;font-size:15px;font-weight:700;display:flex;align-items:center;gap:8px}',
	'.md-card h3 .ico{font-size:20px}',
	'.md-card .desc{font-size:12px;opacity:.65;line-height:1.6;margin-bottom:10px}',
	'.md-card .tags{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px}',
	'.md-card .tag{font-size:11px;padding:2px 8px;border:1px solid #ccc;border-radius:2px;opacity:.75}',
	'.md-btn{font:inherit;font-size:12.5px;padding:7px 18px;border-radius:2px;cursor:pointer;border:1px solid #bbb;background:#fff;color:#111}',
	'.md-btn:hover{background:#f0f0f0}',
	'.md-btn.on{background:#111;border-color:#111;color:#fafafa;cursor:default}',
	'.md-status{padding:14px 16px;border:1px solid #d9d9d9;background:#fafafa;border-radius:2px;font-size:13px;line-height:1.9;margin-bottom:14px}',
	'.md-status b{font-weight:700}',
	'.md-cur{display:inline-block;font-size:11px;padding:2px 10px;border-radius:2px;background:#111;color:#fafafa;margin-left:8px;vertical-align:middle}'
].join('\n');

var MODES = [
	{ id: 'high', ico: '🚀', name: '高速运行', desc: 'CPU 满频 2.0GHz（performance），硬件加速开启，SQM 关闭。转发/下载性能最强，发热与功耗较高。', tags: ['满频 2.0GHz', 'HNAT 开', '无整形'] },
	{ id: 'low', ico: '🌙', name: '低速运行（省电）', desc: 'CPU 限制 1.3GHz（powersave），硬件加速保持开启。功耗/发热最低，适合夜间或轻负载；网速基本不受影响。', tags: ['限频 1.3GHz', 'HNAT 开', '省电'] },
	{ id: 'entertainment', ico: '🎬', name: '娱乐模式', desc: 'CPU 按需调频（schedutil），硬件加速开启，SQM 关闭。看视频/下载/日常使用，性能与功耗平衡（默认）。', tags: ['schedutil', 'HNAT 开', '无整形'] },
	{ id: 'game', ico: '🎮', name: '游戏模式', desc: 'CPU 满频（performance），关闭硬件加速并启用 SQM cake 低延迟整形 + DSCP 分级。网络满载时游戏不跳 ping，吞吐略降。', tags: ['满频 2.0GHz', 'SQM cake', 'DSCP 优先'] }
];

return view.extend({
	load: function() {
		return fetch('/cgi-bin/mode?action=status', { cache: 'no-store' })
			.then(function(r) { return r.json(); })
			.catch(function() { return null; });
	},

	api: function(body) {
		var self = this;
		return fetch('/cgi-bin/mode?action=set', {
			method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body || {})
		}).then(function(r) { return r.json(); }).then(function(j) {
			if (j && j.code === 0) { self.st = j; self.paint(); return j; }
			alert((j && j.error) || '切换失败');
			return j;
		}).catch(function(e) { alert('请求失败: ' + e.message); });
	},

	renderInner: function(st) {
		var self = this;
		this.st = st || {};
		this.btns = {};

		var cards = MODES.map(function(m) {
			var btn = E('button', { 'class': 'md-btn', click: function() { self.api({ mode: m.id }); } }, ['切换到此模式']);
			self.btns[m.id] = btn;
			return E('div', { 'class': 'md-card', 'id': 'md-' + m.id }, [
				E('h3', {}, [E('span', { 'class': 'ico' }, [m.ico]), m.name]),
				E('div', { 'class': 'desc' }, [m.desc]),
				E('div', { 'class': 'tags' }, m.tags.map(function(t) { return E('span', { 'class': 'tag' }, [t]); })),
				btn
			]);
		});

		var root = E('div', {}, [
			E('style', {}, [MCSS]),
			E('h2', {}, ['运行模式']),
			E('div', { 'class': 'md-status', 'id': 'md-status' }, [' ']),
			E('div', { 'class': 'md-grid' }, cards),
			E('div', { 'style': 'font-size:11.5px;opacity:.6;line-height:1.6' }, [
				'提示：切换会立即重载防火墙与 SQM，网络中断 1~2 秒属正常。游戏模式需要先在「游戏加速」页设置正确的 SQM 带宽（下行/上行 kbps），否则会被限速。'
			])
		]);

		setTimeout(function() { self.paint(); }, 60);
		poll.add(function() {
			return fetch('/cgi-bin/mode?action=status', { cache: 'no-store' })
				.then(function(r) { return r.json(); })
				.then(function(j) { if (j && j.code === 0) { self.st = j; self.paint(); } });
		}, 10);
		return root;
	},

	paint: function() {
		var st = this.st || {};
		var ids = ['high', 'low', 'entertainment', 'game'];
		var names = { high: '高速运行', low: '低速运行（省电）', entertainment: '娱乐模式', game: '游戏模式' };
		ids.forEach(function(id) {
			var card = document.getElementById('md-' + id);
			var btn = document.getElementById('md-' + id) ? document.getElementById('md-' + id).querySelector('.md-btn') : null;
			var cur = (st.mode === id);
			if (card) card.className = 'md-card' + (cur ? ' cur' : '');
			if (btn) {
				btn.className = 'md-btn' + (cur ? ' on' : '');
				btn.textContent = cur ? '当前模式' : '切换到此模式';
			}
		});
		var el = document.getElementById('md-status');
		if (!el) return;
		var gov = st.governor || '--';
		var freq = st.max_freq ? (st.max_freq / 1000) + ' MHz' : '--';
		var sqm = st.sqm && st.sqm.enabled ? ('开（' + (st.sqm.download || 0) + ' / ' + (st.sqm.upload || 0) + ' kbps）') : '关';
		var warn = (st.warn ? '<div style="margin-top:8px;padding:8px 10px;border:1px solid #c98a00;background:#fff7e0;color:#7a5a00;font-size:12px;line-height:1.6">⚠ ' + st.warn + '</div>' : '');
		el.innerHTML = '当前：<b>' + (names[st.mode] || st.mode || '--') + '</b><span class="md-cur">' + (st.mode || '') + '</span><br>' +
			'CPU 调速：<b>' + gov + '</b> · 最高频率：<b>' + freq + '</b> · 温度：<b>' + (st.temp || '--') + '°C</b>' +
			'<br>硬件加速：<b>' + (st.hnat ? '开启' : '关闭') + '</b> · SQM：<b>' + sqm + '</b> · PPE 条目：<b>' + (st.ppe || 0) + '</b>' + warn;
	},

	render: function(data) {
		try { return this.renderInner(data); }
		catch (e) { return E('div', {}, [E('h2', {}, ['运行模式']), E('p', {}, ['加载失败: ' + (e && e.message ? e.message : e)])]); }
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
