'use strict';
'require view';
'require poll';

var SCSS = [
	'.sb-hero{padding:18px 20px;border:1px solid #d9d9d9;background:#fafafa;border-radius:2px;margin-bottom:14px;display:flex;align-items:center;gap:16px;flex-wrap:wrap;color:#111}',
	'.sb-hero .ico{font-size:40px;line-height:1}',
	'.sb-hero .txt{flex:1;min-width:220px}',
	'.sb-hero .txt b{font-size:17px}',
	'.sb-hero .txt .sub{font-size:12px;opacity:.65;line-height:1.6;margin-top:4px}',
	'.sb-switch{font:inherit;font-size:13px;padding:9px 26px;border-radius:2px;cursor:pointer;border:1px solid #bbb;background:#fff;color:#111}',
	'.sb-switch:hover{background:#f0f0f0}',
	'.sb-switch.on{background:#0a7a3d;border-color:#0a7a3d;color:#fff}',
	'.sb-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:14px}',
	'@media(max-width:900px){.sb-grid{grid-template-columns:1fr 1fr}}',
	'.sb-card{padding:14px 16px;border:1px solid #d9d9d9;background:#fff;border-radius:2px;color:#111}',
	'.sb-card .l{font-size:10.5px;letter-spacing:.14em;text-transform:uppercase;opacity:.6;font-weight:600}',
	'.sb-card .v{font-size:16px;font-weight:700;margin-top:6px}',
	'.sb-card .s{font-size:11.5px;opacity:.6;margin-top:3px;line-height:1.5}',
	'.sb-ok{color:#0a7a3d}.sb-warn{color:#8a6a00}.sb-bad{color:#a3121c}',
	'.sb-list{font-size:13px;line-height:2;padding:14px 16px;border:1px solid #d9d9d9;background:#fff;border-radius:2px;margin-bottom:14px;color:#111}',
	'.sb-btn{font:inherit;font-size:12px;padding:6px 14px;border-radius:2px;cursor:pointer;border:1px solid #bbb;background:#fff;color:#111;margin-left:8px}',
	'.sb-btn:hover{background:#f0f0f0}',
	'.sb-btn.danger{border-color:#c05;color:#a3121c}',
	'.sb-msg{display:none;font-size:12.5px;line-height:1.6;padding:8px 10px;border-radius:2px;margin:0 0 12px}',
	'.sb-msg.show{display:block}',
	'.sb-msg.ok{background:#e9f7ef;border:1px solid #bfe6cf;color:#0a7a3d}',
	'.sb-msg.err{background:#fdecee;border:1px solid #f3c2c8;color:#a3121c}',
	'html[data-argon-mode="dark"] .sb-card, html[data-np-dark="1"] .sb-card, html[data-argon-mode="dark"] .sb-list, html[data-np-dark="1"] .sb-list, html[data-argon-mode="dark"] .sb-hero, html[data-np-dark="1"] .sb-hero{background:#141a21;border-color:#2a3440;color:#e6e6e6}',
	'html[data-argon-mode="dark"] .sb-btn, html[data-np-dark="1"] .sb-btn, html[data-argon-mode="dark"] .sb-switch, html[data-np-dark="1"] .sb-switch{background:#1a222b;border-color:#39424d;color:#e6e6e6}',
	'html[data-argon-mode="dark"] .sb-btn.danger, html[data-np-dark="1"] .sb-btn.danger{border-color:#c05;color:#ff8fab}',
	'html[data-argon-mode="dark"] .sb-msg.ok, html[data-np-dark="1"] .sb-msg.ok{background:#10231a;border-color:#1f4a33;color:#7fe0a8}',
	'html[data-argon-mode="dark"] .sb-msg.err, html[data-np-dark="1"] .sb-msg.err{background:#2a1215;border-color:#5c2026;color:#ff9aa8}'
].join('\n');

function mkn(tag, attrs, children) {
	return E(tag, attrs || {}, children || []);
}

return view.extend({
	load: function() {
		return fetch('/cgi-bin/safebrowse?action=status', { cache: 'no-store' })
			.then(function(r) { return r.json(); })
			.catch(function() { return null; });
	},

	notify: function(text, ok) {
		var self = this;
		if (!this.elMsg) return;
		this.elMsg.className = 'sb-msg show ' + (ok ? 'ok' : 'err');
		this.elMsg.textContent = text;
		clearTimeout(this._msgTimer);
		this._msgTimer = setTimeout(function() {
			if (self.elMsg) self.elMsg.className = 'sb-msg';
		}, 4000);
	},

	act: function(action, confirmMsg) {
		var self = this;
		if (confirmMsg && !window.confirm(confirmMsg)) return;
		this.notify('操作中…', true);
		fetch('/cgi-bin/safebrowse?action=' + action, { cache: 'no-store' })
			.then(function(r) { return r.json().then(function(j) { return { code: r.status, body: j }; }); })
			.then(function(res) {
				var j = res.body || {};
				if (j.code === 0) {
					self.st = j;
					self.paint();
					self.notify(action === 'clear' ? '本地记录已清除' : (action === 'on' ? '安全浏览已开启' : '安全浏览已关闭'), true);
					if (action === 'clear') setTimeout(function() { location.reload(); }, 800);
				} else {
					self.notify('操作失败：' + (j.error || ('HTTP ' + res.code)), false);
				}
			})
			.catch(function(e) {
				self.notify('请求失败：' + e.message, false);
			});
	},

	renderInner: function(st) {
		var self = this;
		this.st = st || {};
		try {
			var _c = getComputedStyle(document.body).color || '';
			var _m = _c.match(/(\d+)/g);
			if (_m && _m.length >= 3) {
				var _l = 0.299 * +_m[0] + 0.587 * +_m[1] + 0.114 * +_m[2];
				document.documentElement.setAttribute('data-np-dark', _l > 160 ? '1' : '');
			}
		} catch (e) {}

		this.elMsg = mkn('div', { 'class': 'sb-msg' }, [' ']);
		this.elSwitch = mkn('button', { 'class': 'sb-switch', 'type': 'button', click: function() {
			if (self.st && self.st.enabled) self.act('off');
			else self.act('on', '开启安全浏览将停止本地流量/网站记录并启用广告跟踪拦截，确定吗？');
		} }, ['--']);
		this.elGrid = mkn('div', { 'class': 'sb-grid' }, [' ']);
		this.elList = mkn('div', { 'class': 'sb-list' }, [' ']);

		var hero = mkn('div', { 'class': 'sb-hero', 'id': 'sb-hero' }, [
			mkn('div', { 'class': 'ico' }, ['🛡']),
			mkn('div', { 'class': 'txt' }, [
				mkn('b', {}, ['安全浏览模式']),
				mkn('div', { 'class': 'sub' }, ['拦截广告与跟踪域名、停止本地浏览记录（DNS 查询日志 / 流量统计 / 应用识别），并强制走加密 DNS。类似“路由器级无痕”。'])
			]),
			this.elSwitch
		]);

		var root = mkn('div', {}, [
			mkn('style', {}, [SCSS]),
			mkn('h2', {}, ['安全浏览']),
			this.elMsg,
			hero,
			this.elGrid,
			this.elList,
			mkn('div', { 'style': 'font-size:11.5px;opacity:.65;line-height:1.7' }, [
				mkn('div', {}, ['说明：']),
				mkn('div', {}, ['• 开启后，路由器不再记录你访问过哪些网站（DNS 日志清空并停止写入），流量统计与应用识别暂停。']),
				mkn('div', {}, ['• 内置广告/跟踪域名拦截列表（约 8 万条），对全屋设备生效。']),
				mkn('div', {}, ['• 浏览器端的 Cookie、历史、缓存仍需浏览器“无痕模式”处理，路由器管不到。']),
				mkn('div', {}, ['• 本模式不能隐藏你的出口 IP 或 ISP 可见的流量特征；要隐藏目的地需要 VPN/代理。']),
				mkn('div', {}, ['• 关闭后恢复原有的流量统计/应用识别功能。'])
			])
		]);

		setTimeout(function() { self.paint(); }, 80);
		poll.add(function() {
			return fetch('/cgi-bin/safebrowse?action=status', { cache: 'no-store' })
				.then(function(r) { return r.json(); })
				.then(function(j) { if (j && j.code === 0) { self.st = j; self.paint(); } })
				.catch(function() {});
		}, 10);
		return root;
	},

	paint: function() {
		var self = this;
		var st = this.st || {};
		if (!document.getElementById('sb-hero') || !this.elSwitch) return;
		var on = !!st.enabled;
		this.elSwitch.textContent = on ? '已开启 · 点击关闭' : '已关闭 · 点击开启';
		this.elSwitch.className = 'sb-switch' + (on ? ' on' : '');

		var cards = [
			{ l: '广告/跟踪拦截', v: (st.blocklist_entries || 0).toLocaleString() + ' 条', s: on ? '已生效' : '未启用' },
			{ l: '加密 DNS (DoH)', v: st.encrypted_dns ? '运行中' : '已停止', s: 'dnscrypt-proxy' },
			{ l: 'DNS 泄漏防护', v: st.dns_hijack ? '已启用' : '未启用', s: 'LAN 53 强制劫持' },
			{ l: '本地 DNS 记录', v: st.dns_logging ? '记录中' : '已关闭', s: '查询日志 ' + Math.round((st.dns_log_size || 0) / 1024) + ' KB' },
			{ l: '流量统计记录', v: st.trafficd_running ? '记录中' : '已暂停', s: 'trafficd' },
			{ l: '应用识别', v: st.appfilter_running ? '记录中' : '已暂停', s: 'appfilter' }
		];
		var g = '';
		cards.forEach(function(c) {
			g += '<div class="sb-card"><div class="l">' + c.l + '</div><div class="v">' + c.v + '</div><div class="s">' + c.s + '</div></div>';
		});
		this.elGrid.innerHTML = g;

		this.elList.innerHTML = '';
		this.elList.appendChild(mkn('div', {}, [
			mkn('b', {}, ['本地记录清理']),
			mkn('span', { 'style': 'opacity:.6;margin-left:10px' }, ['（清除 DNS 日志与流量统计历史）']),
			mkn('button', { 'class': 'sb-btn danger', 'type': 'button', click: function() {
				self.act('clear', '确定清除本地 DNS 日志和流量统计历史吗？此操作不可恢复。');
			} }, ['清除本地记录'])
		]));
		this.elList.appendChild(mkn('div', { 'style': 'font-size:12px;opacity:.6;margin-top:6px' }, [
			'当前 DNS 日志大小：' + Math.round((st.dns_log_size || 0) / 1024) + ' KB；开启安全浏览时会自动清空并停止写入。'
		]));
	},

	render: function(data) {
		try { return this.renderInner(data); }
		catch (e) { return E('div', {}, [E('h2', {}, ['安全浏览']), E('p', {}, ['加载失败: ' + (e && e.message ? e.message : e)])]); }
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
