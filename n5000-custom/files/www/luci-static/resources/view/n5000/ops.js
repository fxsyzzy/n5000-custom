'use strict';
'require view';
'require poll';

var OCSS = [
	'.op-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:12px}',
	'@media(max-width:1000px){.op-grid{grid-template-columns:repeat(2,1fr)}}',
	'.op-card{padding:14px 16px;border:1px solid #d9d9d9;background:#fff;border-radius:2px;color:#111}',
	'.op-card .l{font-size:10.5px;letter-spacing:.14em;text-transform:uppercase;opacity:.6;font-weight:600}',
	'.op-card .v{font-size:17px;font-weight:700;margin-top:6px}',
	'.op-card .s{font-size:11.5px;opacity:.6;margin-top:3px}',
	'.op-sec{padding:14px 16px;border:1px solid #d9d9d9;background:#fff;border-radius:2px;margin-bottom:12px;color:#111}',
	'.op-sec .h{display:flex;align-items:center;gap:10px;font-size:14px;font-weight:700;margin-bottom:10px}',
	'.op-sec .h .sub{font-size:11.5px;opacity:.55;font-weight:400}',
	'.op-btn{font:inherit;font-size:12px;padding:6px 14px;border-radius:2px;cursor:pointer;border:1px solid #bbb;background:#fff;color:#111;margin-left:auto}',
	'.op-btn:hover{background:#f0f0f0}',
	'.op-btn.prim{background:#111;border-color:#111;color:#fafafa}',
	'.op-btn.danger{border-color:#c05;color:#a3121c}',
	'.op-row{display:flex;align-items:center;gap:10px;font-size:12.5px;padding:5px 0;border-bottom:1px dashed #e5e5e5}',
	'.op-row .nm{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
	'.op-row .vl{opacity:.65;font-size:11.5px}',
	'.op-chip{display:inline-block;font-size:11px;padding:3px 9px;border:1px solid #ccc;border-radius:2px;margin:3px 4px 3px 0}',
	'.op-input{font:inherit;font-size:12.5px;padding:7px 10px;border:1px solid #ccc;border-radius:2px;background:#fff;color:#111;min-width:180px;margin-right:8px;margin-bottom:6px}',
	'.op-ok{color:#0a7a3d}.op-warn{color:#8a6a00}.op-bad{color:#a3121c}',
	'html[data-argon-mode="dark"] .op-card, html[data-np-dark="1"] .op-card, html[data-argon-mode="dark"] .op-sec, html[data-np-dark="1"] .op-sec{background:#141a21;border-color:#2a3440;color:#e6e6e6}',
	'html[data-argon-mode="dark"] .op-btn, html[data-np-dark="1"] .op-btn{background:#1a222b;border-color:#39424d;color:#e6e6e6}',
	'html[data-argon-mode="dark"] .op-btn.prim, html[data-np-dark="1"] .op-btn.prim{background:#e6e6e6;border-color:#e6e6e6;color:#111}',
	'html[data-argon-mode="dark"] .op-input, html[data-np-dark="1"] .op-input{background:#1a222b;border-color:#39424d;color:#e6e6e6}',
	'html[data-argon-mode="dark"] .op-row, html[data-np-dark="1"] .op-row{border-bottom-color:#2a3440}',
	'html[data-argon-mode="dark"] .op-chip, html[data-np-dark="1"] .op-chip{border-color:#39424d}'
].join('\n');

return view.extend({
	load: function() {
		return fetch('/cgi-bin/ops?action=status', { cache: 'no-store' })
			.then(function(r) { return r.json(); })
			.catch(function() { return null; });
	},

	api: function(action, body, confirmMsg) {
		var self = this;
		if (confirmMsg && !confirm(confirmMsg)) return Promise.resolve();
		return fetch('/cgi-bin/ops?action=' + action, {
			method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body || {})
		}).then(function(r) { return r.json(); }).then(function(j) {
			if (j && j.code === 0) { if (j.health || j.system) { self.st = j; self.paint(); } return j; }
			alert((j && j.error) || '操作失败');
			return j;
		}).catch(function(e) { alert('请求失败: ' + e.message); });
	},

	simple: function(action, label) {
		var self = this;
		return fetch('/cgi-bin/ops?action=' + action, { cache: 'no-store' })
			.then(function(r) { return r.json(); })
			.then(function(j) { if (label === 'verify' || label === 'health') alert(j.result || '完成'); if (j.health || j.system) { self.st = j; self.paint(); } })
			.catch(function(e) { alert('请求失败: ' + e.message); });
	},

	renderInner: function(st) {
		var self = this;
		this.st = st || {};
		this.filled = false;

		this.elCards = E('div', { 'class': 'op-grid' }, [' ']);
		this.elHealth = E('div', { 'id': 'op-health' }, [' ']);
		this.elBackups = E('div', { 'id': 'op-backups' }, [' ']);
		this.elF2b = E('div', { 'id': 'op-f2b' }, [' ']);
		this.fWebhook = E('input', { 'class': 'op-input', 'type': 'text', 'placeholder': 'https://example.com/webhook（POST JSON）' });
		this.fBark = E('input', { 'class': 'op-input', 'type': 'text', 'placeholder': 'https://api.day.app/你的KEY' });
		this.fMin = E('input', { 'class': 'op-input', 'type': 'text', 'placeholder': '30', 'style': 'min-width:70px' });
		this.fGuestKey = E('input', { 'class': 'op-input', 'type': 'text', 'placeholder': '访客 WiFi 密码（≥8 位）' });

		var root = E('div', {}, [
			E('style', {}, [OCSS]),
			E('h2', {}, ['运维中心']),
			this.elCards,

			E('div', { 'class': 'op-sec' }, [
				E('div', { 'class': 'h' }, ['健康检查', E('span', { 'class': 'sub' }, ['每 5 分钟自动检查']),
					E('button', { 'class': 'op-btn', click: function() { self.simple('health', 'health'); } }, ['立即检查'])]),
				this.elHealth
			]),

			E('div', { 'class': 'op-sec' }, [
				E('div', { 'class': 'h' }, ['配置备份', E('span', { 'class': 'sub' }, ['AES-256 加密，保留最近 8 份']),
					E('button', { 'class': 'op-btn prim', click: function() { self.api('backup', {}); } }, ['立即备份']),
					E('button', { 'class': 'op-btn', click: function() { self.simple('verify', 'verify'); } }, ['验证最新'])]),
				this.elBackups
			]),

			E('div', { 'class': 'op-sec' }, [
				E('div', { 'class': 'h' }, ['防暴破（SSH/LuCI 登录防护）', E('span', { 'class': 'sub' }, ['5 次失败自动封禁 1 小时']),
					E('button', { 'class': 'op-btn danger', click: function() { self.api('unbanall', {}); } }, ['全部解封'])]),
				this.elF2b
			]),

			E('div', { 'class': 'op-sec' }, [
				E('div', { 'class': 'h' }, ['告警推送', E('span', { 'class': 'sub' }, ['健康异常时通知（Bark / 通用 Webhook）'])]),
				E('div', { 'style': 'margin-bottom:8px' }, [this.fWebhook]),
				E('div', { 'style': 'margin-bottom:8px' }, [this.fBark]),
				E('div', { 'style': 'margin-bottom:8px' }, ['重复间隔(分钟): ', this.fMin]),
				E('button', { 'class': 'op-btn prim', click: function() {
					self.api('alerts', { webhook: self.fWebhook.value.trim(), bark: self.fBark.value.trim(), min: self.fMin.value.trim() });
				} }, ['保存告警配置'])
			]),

			E('div', { 'class': 'op-sec' }, [
				E('div', { 'class': 'h' }, ['访客网络', E('span', { 'class': 'sub' }, ['独立网段 192.168.89.x，隔离内网，仅能上网'])]),
				E('div', { 'id': 'op-guest', 'style': 'margin-bottom:8px' }, [' ']),
				E('div', { 'style': 'margin-bottom:8px' }, [this.fGuestKey]),
				E('button', { 'class': 'op-btn prim', click: function() {
					var k = self.fGuestKey.value.trim();
					var body = {};
					if (k) body.key = k;
					self.api('guest', body);
				} }, ['修改访客密码']),
				E('button', { 'class': 'op-btn', click: function() { self.api('guest', { enabled: true }); } }, ['启用访客 WiFi']),
				E('button', { 'class': 'op-btn danger', click: function() { self.api('guest', { enabled: false }); } }, ['停用访客 WiFi'])
			])
		]);

		this.elGuest = null;
		setTimeout(function() { self.paint(); }, 60);
		poll.add(function() {
			return fetch('/cgi-bin/ops?action=status', { cache: 'no-store' })
				.then(function(r) { return r.json(); })
				.then(function(j) { if (j && j.code === 0) { self.st = j; self.paint(); } });
		}, 15);
		return root;
	},

	paint: function() {
		var self = this;
		var st = this.st || {};
		if (!document.getElementById('op-health')) return;
		var sys = st.system || {};
		var h = st.health || {};
		var modeNames = { high: '高速运行', low: '低速运行', entertainment: '娱乐模式', game: '游戏模式' };
		var cards = [
			{ l: '运行模式', v: modeNames[sys.mode] || sys.mode || '--', s: 'CPU ' + (sys.governor || '--') },
			{ l: '温度', v: (sys.temp || '--') + ' °C', s: '负载 ' + (sys.load || 0) },
			{ l: '在线时长', v: Math.floor((sys.uptime || 0) / 3600) + ' 小时', s: '防火墙防洪水 ' + (sys.syn_flood ? '开' : '关') },
			{ l: '健康状态', v: h.state === 'ok' ? '正常' : (h.state === 'bad' ? '异常' : '未知'), s: h.issues || '一切正常' }
		];
		var g = '';
		cards.forEach(function(c) {
			var cls = c.l === '健康状态' ? (h.state === 'ok' ? 'op-ok' : 'op-bad') : '';
			g += '<div class="op-card"><div class="l">' + c.l + '</div><div class="v ' + cls + '">' + c.v + '</div><div class="s">' + c.s + '</div></div>';
		});
		this.elCards.innerHTML = g;

		/* 健康 */
		var hh = '';
		if (h.ts) {
			hh = '状态: <b class="' + (h.state === 'ok' ? 'op-ok' : 'op-bad') + '">' + (h.state === 'ok' ? '正常' : '异常 (' + (h.issues || '') + ')') + '</b>' +
				' · 温度 ' + (h.temp ? Math.round(h.temp / 1000) : '--') + '°C · overlay 剩余 ' + Math.round((h.overlay_kb || 0) / 1024) + ' MB · TF 错误 ' + (h.tf_errors || 0);
		} else { hh = '暂无健康数据'; }
		this.elHealth.innerHTML = hh;

		/* 备份 */
		var b = '';
		var list = st.backups || [];
		if (!list.length) b = '暂无备份';
		list.forEach(function(x) {
			b += '<div class="op-row"><span class="nm">' + x.name + '</span><span class="vl">' + Math.round((x.size || 0) / 1024) + ' KB · ' + (x.mtime || '') + '</span></div>';
		});
		this.elBackups.innerHTML = b;

		/* fail2ban */
		var f = st.fail2ban || {};
		var html = '';
		var blocked = f.blocked || [];
		if (blocked.length) {
			blocked.forEach(function(x) {
				html += '<span class="op-chip">' + x.ip + ' <a href="#" data-unban="' + x.ip + '" style="color:#a3121c">解封</a></span>';
			});
			html += '<div style="margin-top:6px"><button class="op-btn" id="op-unbanall">全部解封</button></div>';
		} else { html = '<div class="op-ok">当前没有封禁中的 IP</div>'; }
		var rf = f.recent_failures || [];
		if (rf.length) {
			html += '<div style="margin-top:8px;font-size:11.5px;opacity:.65">最近失败来源：</div>';
			rf.forEach(function(x) { html += '<div class="op-row"><span class="nm">' + x.ip + '</span><span class="vl">' + (x.count || 0) + ' 次</span></div>'; });
		}
		this.elF2b.innerHTML = html;
		Array.prototype.forEach.call(this.elF2b.querySelectorAll('[data-unban]'), function(a) {
			a.addEventListener('click', function(ev) {
				ev.preventDefault();
				self.api('unban', { ip: a.getAttribute('data-unban') });
			});
		});
		var ub = document.getElementById('op-unbanall');
		if (ub) ub.addEventListener('click', function() { self.api('unbanall', {}); });

		/* 首次填充输入框 */
		if (!this.filled) {
			this.filled = true;
			var al = st.alerts || {};
			this.fWebhook.value = al.webhook || '';
			this.fBark.value = al.bark || '';
			this.fMin.value = al.min || '30';
		}

		/* 访客 */
		var gs = st.guest || {};
		var ge = document.getElementById('op-guest');
		if (ge) {
			ge.innerHTML = 'SSID: <b>' + (gs.ssid || '--') + '</b> · 状态: <b class="' + (gs.enabled ? 'op-ok' : 'op-warn') + '">' + (gs.enabled ? '已启用' : '已停用') + '</b>' +
				' · 当前连接: <b>' + (gs.clients || 0) + '</b> 台 · 密码: <b>' + (gs.key || '--') + '</b>';
		}
	},

	render: function(data) {
		try { return this.renderInner(data); }
		catch (e) { return E('div', {}, [E('h2', {}, ['运维中心']), E('p', {}, ['加载失败: ' + (e && e.message ? e.message : e)])]); }
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
