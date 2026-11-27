'use strict';
'require view';
'require poll';

var SCSS = [
	'.sb-hero{padding:18px 20px;border:1px solid #d9d9d9;background:#fafafa;border-radius:2px;margin-bottom:14px;display:flex;align-items:center;gap:16px;flex-wrap:wrap}',
	'.sb-hero .ico{font-size:40px;line-height:1}',
	'.sb-hero .txt{flex:1;min-width:220px}',
	'.sb-hero .txt b{font-size:17px}',
	'.sb-hero .txt .sub{font-size:12px;opacity:.65;line-height:1.6;margin-top:4px}',
	'.sb-switch{font:inherit;font-size:13px;padding:9px 26px;border-radius:2px;cursor:pointer;border:1px solid #bbb;background:#fff;color:#111}',
	'.sb-switch:hover{background:#f0f0f0}',
	'.sb-switch.on{background:#0a7a3d;border-color:#0a7a3d;color:#fff}',
	'.sb-switch.on:hover{background:#096a34}',
	'.sb-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:14px}',
	'@media(max-width:900px){.sb-grid{grid-template-columns:1fr 1fr}}',
	'.sb-card{padding:14px 16px;border:1px solid #d9d9d9;background:#fff;border-radius:2px}',
	'.sb-card .l{font-size:10.5px;letter-spacing:.14em;text-transform:uppercase;opacity:.6;font-weight:600}',
	'.sb-card .v{font-size:16px;font-weight:700;margin-top:6px}',
	'.sb-card .s{font-size:11.5px;opacity:.6;margin-top:3px;line-height:1.5}',
	'.sb-ok{color:#0a7a3d}.sb-warn{color:#8a6a00}.sb-bad{color:#a3121c}',
	'.sb-list{font-size:13px;line-height:2;padding:14px 16px;border:1px solid #d9d9d9;background:#fff;border-radius:2px;margin-bottom:14px}',
	'.sb-btn{font:inherit;font-size:12px;padding:6px 14px;border-radius:2px;cursor:pointer;border:1px solid #bbb;background:#fff;color:#111;margin-left:8px}',
	'.sb-btn:hover{background:#f0f0f0}',
	'.sb-btn.danger{border-color:#c05;color:#a3121c}'
].join('\n');

return view.extend({
	load: function() {
		return fetch('/cgi-bin/safebrowse?action=status', { cache: 'no-store' })
			.then(function(r) { return r.json(); })
			.catch(function() { return null; });
	},

	act: function(action, confirmMsg) {
		var self = this;
		if (confirmMsg && !confirm(confirmMsg)) return Promise.resolve();
		return fetch('/cgi-bin/safebrowse?action=' + action, { cache: 'no-store' })
			.then(function(r) { return r.json(); })
			.then(function(j) {
				if (j && j.code === 0) { self.st = j; self.paint(); return j; }
				alert((j && j.error) || '操作失败');
				return j;
			})
			.catch(function(e) { alert('请求失败: ' + e.message); });
	},

	renderInner: function(st) {
		var self = this;
		this.st = st || {};

		this.elSwitch = E('button', { 'class': 'sb-switch', click: function() {
			if (self.st && self.st.enabled) self.act('off');
			else self.act('on', '开启安全浏览将停止本地流量/网站记录并启用广告跟踪拦截，确定吗？');
		} }, ['--']);

		var hero = E('div', { 'class': 'sb-hero', 'id': 'sb-hero' }, [
			E('div', { 'class': 'ico' }, ['🛡']),
			E('div', { 'class': 'txt' }, [
				E('b', {}, ['安全浏览模式']),
				E('div', { 'class': 'sub' }, ['拦截广告与跟踪域名、停止本地浏览记录（DNS 查询日志 / 流量统计 / 应用识别），并强制走加密 DNS。类似“路由器级无痕”。'])
			]),
			this.elSwitch
		]);

		this.elGrid = E('div', { 'class': 'sb-grid' }, [' ']);
		this.elList = E('div', { 'class': 'sb-list' }, [' ']);

		var root = E('div', {}, [
			E('style', {}, [SCSS]),
			E('h2', {}, ['安全浏览']),
			hero,
			this.elGrid,
			this.elList,
			E('div', { 'style': 'font-size:11.5px;opacity:.65;line-height:1.7' }, [
				E('div', {}, ['说明：']),
				E('div', {}, ['• 开启后，路由器不再记录你访问过哪些网站（DNS 日志清空并停止写入），流量统计与应用识别暂停。']),
				E('div', {}, ['• 内置广告/跟踪域名拦截列表（约 8 万条），对全屋设备生效。']),
				E('div', {}, ['• 浏览器端的 Cookie、历史、缓存仍需浏览器“无痕模式”处理，路由器管不到。']),
				E('div', {}, ['• 本模式不能隐藏你的出口 IP 或 ISP 可见的流量特征；要隐藏目的地需要 VPN/代理。']),
				E('div', {}, ['• 关闭后恢复原有的流量统计/应用识别功能。'])
			])
		]);

		setTimeout(function() { self.paint(); }, 60);
		poll.add(function() {
			return fetch('/cgi-bin/safebrowse?action=status', { cache: 'no-store' })
				.then(function(r) { return r.json(); })
				.then(function(j) { if (j && j.code === 0) { self.st = j; self.paint(); } });
		}, 15);
		return root;
	},

	paint: function() {
		var st = this.st || {};
		if (!document.getElementById('sb-hero')) return;
		var on = !!st.enabled;
		var btn = this.elSwitch;
		btn.textContent = on ? '已开启 · 点击关闭' : '已关闭 · 点击开启';
		btn.className = 'sb-switch' + (on ? ' on' : '');

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
		var head = E('div', {}, [E('b', {}, ['本地记录清理']), E('span', { 'style': 'opacity:.6;margin-left:10px' }, ['（清除 DNS 日志与流量统计历史）']),
			E('button', { 'class': 'sb-btn danger', click: function() {
				if (confirm('确定清除本地 DNS 日志和流量统计历史吗？此操作不可恢复。')) {
					fetch('/cgi-bin/safebrowse?action=clear', { cache: 'no-store' }).then(function(r) { return r.json(); }).then(function() { location.reload(); });
				}
			} }, ['清除本地记录'])]);
		this.elList.appendChild(head);
		this.elList.appendChild(E('div', { 'style': 'font-size:12px;opacity:.6;margin-top:6px' }, [
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
