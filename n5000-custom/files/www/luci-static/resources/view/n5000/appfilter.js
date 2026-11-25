'use strict';
'require view';
'require poll';
'require ui';

function afFmt(b) {
	b = Number(b) || 0;
	if (b > 1099511627776) return (b / 1099511627776).toFixed(2) + ' TB';
	if (b > 1073741824) return (b / 1073741824).toFixed(2) + ' GB';
	if (b > 1048576) return (b / 1048576).toFixed(1) + ' MB';
	if (b > 1024) return (b / 1024).toFixed(0) + ' KB';
	return b + ' B';
}

var AFCSS = [
	'.af-wrap{display:flex;flex-direction:column;gap:12px}',
	'.af-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}',
	'.af-stat{padding:14px 16px}',
	'.af-label{font-size:11px;letter-spacing:.12em;text-transform:uppercase;opacity:.65;font-weight:600}',
	'.af-big{font-size:24px;font-weight:600;margin-top:4px;font-variant-numeric:tabular-nums}',
	'.af-cols{display:grid;grid-template-columns:1fr 1fr;gap:12px}',
	'.af-row{display:flex;align-items:center;gap:10px;font-size:12.5px;margin-bottom:8px}',
	'.af-row .nm{width:110px;flex:0 0 auto;opacity:.75;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
	'.af-row .bar{flex:1;height:6px;border-radius:3px;background:rgba(127,127,127,.22);overflow:hidden}',
	'.af-row .bar>i{display:block;height:100%;border-radius:3px;background:var(--primary,#4C7DFF)}',
	'.af-row .vl{width:90px;text-align:right;font-variant-numeric:tabular-nums}',
	'.af-dev{display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid rgba(127,127,127,.18);font-size:12.5px}',
	'.af-dev:last-child{border-bottom:none}',
	'.af-dev .nm{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
	'.af-dev .vl{width:90px;text-align:right;font-variant-numeric:tabular-nums}',
	'.af-toolbar{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px}',
	'.af-chk{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-top:4px}',
	'.af-chk label{display:flex;align-items:center;gap:6px;padding:6px 8px;border:1px solid rgba(127,127,127,.3);border-radius:6px;cursor:pointer}',
	'.af-days{display:flex;gap:6px;flex-wrap:wrap;margin-top:4px}',
	'.af-days label{display:flex;align-items:center;gap:4px;padding:4px 8px;border:1px solid rgba(127,127,127,.3);border-radius:6px;cursor:pointer}',
	'.af-hint{font-size:11.5px;opacity:.6;margin-top:6px;line-height:1.45}',
	'.af-modal .cbi-value{display:block}',
	'@media(max-width:1000px){.af-stats{grid-template-columns:repeat(2,1fr)}.af-cols{grid-template-columns:1fr}}'
].join('\n');

function afMatchCat(domain, cats) {
	var best = null, bestLen = -1;
	(cats || []).forEach(function(c) {
		(c.domains || []).forEach(function(dd) {
			if (!dd) return;
			if (domain === dd || domain.slice(-(dd.length + 1)) === '.' + dd) {
				if (dd.length > bestLen) { best = c.key; bestLen = dd.length; }
			}
		});
	});
	return best || 'other';
}

function afCatName(k, cats) {
	for (var i = 0; i < cats.length; i++)
		if (cats[i].key === k)
			return cats[i].name;
	var m = { other: '其他', unknown: '未识别', video: '视频', game: '游戏', social: '社交', office: '办公',
		shopping: '购物', music: '音乐', cloud: '网盘', news: '新闻', edu: '教育', system: '系统更新' };
	return m[k] || k;
}

return view.extend({
	load: function() {
		return Promise.all([
			fetch('/cgi-bin/appfilter?action=state', { cache: 'no-store' }).then(function(r) { return r.json(); }).catch(function() { return null; }),
			fetch('/cgi-bin/appfilter?action=cats', { cache: 'no-store' }).then(function(r) { return r.json(); }).catch(function() { return []; })
		]);
	},

	renderInner: function(data) {
		var state = data[0] || {}, cats = data[1] || [];
		var self = this;

		var root = E('div', { 'class': 'af-wrap' }, [
			E('style', {}, [AFCSS]),
			E('div', { 'class': 'af-toolbar' }, [
				E('button', { 'class': 'btn cbi-button', 'id': 'af-toggle', click: function() { self.toggleBlock(); } },
					['启用/停用拦截']),
				E('button', { 'class': 'btn cbi-button', 'id': 'af-refresh', click: function() { self.refresh(); } },
					['立即刷新']),
				E('button', { 'class': 'btn cbi-button cbi-button-remove', 'id': 'af-reset', click: function() { self.resetStats(); } },
					['清空统计'])
			]),
			E('div', { 'class': 'af-stats' }, [
				E('div', { 'class': 'cbi-section af-stat' }, [
					E('div', { 'class': 'af-label' }, ['总流量']),
					E('div', { 'class': 'af-big', 'id': 'af-total' }, ['--'])
				]),
				E('div', { 'class': 'cbi-section af-stat' }, [
					E('div', { 'class': 'af-label' }, ['有流量设备']),
					E('div', { 'class': 'af-big', 'id': 'af-devs' }, ['--'])
				]),
				E('div', { 'class': 'cbi-section af-stat' }, [
					E('div', { 'class': 'af-label' }, ['识别网站']),
					E('div', { 'class': 'af-big', 'id': 'af-sites' }, ['--'])
				]),
				E('div', { 'class': 'cbi-section af-stat' }, [
					E('div', { 'class': 'af-label' }, ['管控设备']),
					E('div', { 'class': 'af-big', 'id': 'af-rules' }, ['--'])
				])
			]),
			E('div', { 'class': 'af-cols' }, [
				E('div', { 'class': 'cbi-section' }, [
					E('h3', {}, ['分类流量']),
					E('div', { 'id': 'af-catlist' }, [' '])
				]),
				E('div', { 'class': 'cbi-section' }, [
					E('h3', {}, ['设备流量']),
					E('div', { 'id': 'af-devlist' }, [' '])
				])
			]),
			E('div', { 'class': 'cbi-section' }, [
				E('h3', {}, ['网站流量明细（Top 100）']),
				E('div', { 'id': 'af-sitetable' }, [' '])
			])
		]);

		var paint = function() {
			if (!document.getElementById('af-total')) return;
			var devs = state.devices || [], rules = state.rules || [], catsData = state.categories || [];
			var total = 0, sites = {};
			devs.forEach(function(dev) {
				total += dev.total || 0;
				(dev.sites || []).forEach(function(s) { sites[s.domain] = (sites[s.domain] || 0) + s.bytes; });
			});
			var siteCount = Object.keys(sites).length;
			document.getElementById('af-total').textContent = afFmt(total);
			document.getElementById('af-devs').textContent = devs.length;
			document.getElementById('af-sites').textContent = siteCount;
			document.getElementById('af-rules').textContent = rules.length;
			var tb = document.getElementById('af-toggle');
			if (tb) {
				tb.textContent = state.block_enabled ? '停用拦截' : '启用拦截';
				tb.className = 'btn cbi-button' + (state.block_enabled ? ' cbi-button-save' : '');
			}

			/* 分类 */
			var maxB = 1;
			catsData.forEach(function(c) { maxB = Math.max(maxB, c.bytes || 0); });
			var cl = document.getElementById('af-catlist');
			cl.innerHTML = '';
			if (!catsData.length) cl.appendChild(E('em', {}, ['暂无数据']));
			catsData.slice(0, 10).forEach(function(c) {
				cl.appendChild(E('div', { 'class': 'af-row' }, [
					E('span', { 'class': 'nm' }, [afCatName(c.cat, cats)]),
					E('span', { 'class': 'bar' }, [E('i', { 'style': 'width:' + Math.round((c.bytes || 0) / maxB * 100) + '%' })]),
					E('span', { 'class': 'vl' }, [afFmt(c.bytes)])
				]));
			});

			/* 设备 */
			var dl = document.getElementById('af-devlist');
			dl.innerHTML = '';
			var leases = state.leases || [];
			var ipOf = function(mac) {
				for (var i = 0; i < leases.length; i++) if (leases[i].mac === mac) return leases[i].name || '';
				return '';
			};
			if (!devs.length) dl.appendChild(E('em', {}, ['暂无数据']));
			devs.forEach(function(dev) {
				var hasRule = rules.some(function(r) { return r.mac === dev.mac; });
				dl.appendChild(E('div', { 'class': 'af-dev' }, [
					E('span', { 'class': 'nm' }, [(dev.name || dev.mac) + (hasRule ? ' · 已管控' : '')]),
					E('span', { 'class': 'vl' }, [afFmt(dev.total)]),
					E('button', {
						'class': 'btn cbi-button',
						click: function() { self.openRule(dev.mac, dev.name); }
					}, ['管控'])
				]));
			});

			/* 网站表 */
			var arr = Object.keys(sites).map(function(k) { return { d: k, b: sites[k] }; })
				.sort(function(x, y) { return y.b - x.b; }).slice(0, 100);
			var st = document.getElementById('af-sitetable');
			st.innerHTML = '';
			var tbl = E('table', { 'class': 'table' }, [
				E('tr', { 'class': 'tr table-titles' }, [
					E('th', { 'class': 'th' }, ['网站 / 域名']),
					E('th', { 'class': 'th', 'style': 'width:120px' }, ['分类']),
					E('th', { 'class': 'th', 'style': 'width:130px;text-align:right' }, ['流量'])
				])
			]);
			arr.forEach(function(s) {
				var cat = afMatchCat(s.d, cats);
				tbl.appendChild(E('tr', { 'class': 'tr' }, [
					E('td', { 'class': 'td' }, [s.d]),
					E('td', { 'class': 'td' }, [afCatName(cat, cats)]),
					E('td', { 'class': 'td', 'style': 'text-align:right' }, [afFmt(s.b)])
				]));
			});
			if (!arr.length) st.appendChild(E('em', {}, ['暂无数据']));
			else st.appendChild(tbl);
		};

		setTimeout(paint, 100);

		poll.add(function() {
			return fetch('/cgi-bin/appfilter?action=state', { cache: 'no-store' })
				.then(function(r) { return r.json(); })
				.then(function(st) { state = st; paint(); });
		}, 5);

		/* ---------- 操作 ---------- */
		this.toggleBlock = function() {
			data[0] = state;
			fetch('/cgi-bin/appfilter?action=save', {
				method: 'POST', headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					global: { enabled: state.enabled, block_enabled: !state.block_enabled },
					devices: state.rules || []
				})
			}).then(function(r) { return r.json(); }).then(function() {
				return fetch('/cgi-bin/appfilter?action=state', { cache: 'no-store' }).then(function(r) { return r.json(); });
			}).then(function(st) { state = st; paint(); });
		};

		this.refresh = function() {
			fetch('/cgi-bin/appfilter?action=update', { method: 'POST' }).then(function(r) { return r.json(); });
			ui.addNotification(null, E('p', {}, ['已触发刷新，稍后自动更新']), 'info');
			setTimeout(self.reload, 1500);
		};

		this.resetStats = function() {
			if (!confirm('清空本次开机以来的流量统计？')) return;
			fetch('/cgi-bin/appfilter?action=reset', { method: 'POST' }).then(function() {
				ui.addNotification(null, E('p', {}, ['统计已清空']), 'info');
				self.reload();
			});
		};

		this.reload = function() {
			window.location.reload();
		};

		this.openRule = function(mac, name) {
			var rule = null;
			(state.rules || []).forEach(function(r) { if (r.mac === mac) rule = r; });
			var selCats = rule && rule.block_cats ? rule.block_cats.split(',') : [];
			var selDays = rule && rule.schedule_days ? rule.schedule_days.split(',') : [];
			var catBoxes = [];
			var chkGrid = E('div', { 'class': 'af-chk' });
			cats.forEach(function(c) {
				var cb = E('input', { 'type': 'checkbox' });
				cb.checked = selCats.indexOf(c.key) >= 0;
				catBoxes.push({ key: c.key, cb: cb });
				chkGrid.appendChild(E('label', {}, [cb, ' ', c.name]));
			});
			var domInput = E('input', { 'type': 'text', 'class': 'cbi-input-text', 'style': 'width:100%',
				'placeholder': '如 douyin.com,qq.com', 'value': (rule && rule.block_domains) || '' });
			var stInput = E('input', { 'type': 'time', 'class': 'cbi-input-text', 'value': (rule && rule.schedule_start) || '' });
			var etInput = E('input', { 'type': 'time', 'class': 'cbi-input-text', 'value': (rule && rule.schedule_end) || '' });
			var dayNames = ['一', '二', '三', '四', '五', '六', '日'];
			var dayBoxes = [];
			var dayGrid = E('div', { 'class': 'af-days' });
			for (var di = 1; di <= 7; di++) {
				(function(d) {
					var cb = E('input', { 'type': 'checkbox' });
					cb.checked = selDays.indexOf(String(d)) >= 0;
					dayBoxes.push({ d: d, cb: cb });
					dayGrid.appendChild(E('label', {}, [cb, ' 周' + dayNames[d - 1]]));
				})(di);
			}

			var content = E('div', { 'class': 'af-modal' }, [
				E('p', {}, [E('b', {}, [name || mac]) + ' （' + mac + '）']),
				E('div', { 'class': 'cbi-value' }, [
					E('label', { 'class': 'cbi-value-title' }, ['禁止分类']),
					E('div', { 'class': 'cbi-value-field' }, [chkGrid])
				]),
				E('div', { 'class': 'cbi-value' }, [
					E('label', { 'class': 'cbi-value-title' }, ['额外禁止域名']),
					E('div', { 'class': 'cbi-value-field' }, [domInput])
				]),
				E('div', { 'class': 'cbi-value' }, [
					E('label', { 'class': 'cbi-value-title' }, ['生效时间段']),
					E('div', { 'class': 'cbi-value-field' }, [
						E('div', { 'style': 'display:flex;gap:8px;align-items:center' }, [stInput, ' — ', etInput]),
						dayGrid,
						E('div', { 'class': 'af-hint' }, ['留空=全天；未选星期=每天'])
					])
				])
			]);

			var save = function() {
				var blockedCats = [];
				catBoxes.forEach(function(o) { if (o.cb.checked) blockedCats.push(o.key); });
				var blockedDays = [];
				dayBoxes.forEach(function(o) { if (o.cb.checked) blockedDays.push(String(o.d)); });
				var newRule = {
					mac: mac, name: name || mac,
					block_cats: blockedCats.join(','),
					block_domains: domInput.value.trim(),
					schedule_start: stInput.value, schedule_end: etInput.value,
					schedule_days: blockedDays.join(',')
				};
				var rules = (state.rules || []).filter(function(r) { return r.mac !== mac; });
				if (newRule.block_cats || newRule.block_domains) rules.push(newRule);
				fetch('/cgi-bin/appfilter?action=save', {
					method: 'POST', headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ global: { enabled: state.enabled, block_enabled: state.block_enabled }, devices: rules })
				}).then(function(r) { return r.json(); }).then(function() {
					ui.hideModal();
					return fetch('/cgi-bin/appfilter?action=state', { cache: 'no-store' }).then(function(r) { return r.json(); });
				}).then(function(st) { state = st; paint(); });
			};

			var remove = function() {
				var rules = (state.rules || []).filter(function(r) { return r.mac !== mac; });
				fetch('/cgi-bin/appfilter?action=save', {
					method: 'POST', headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ global: { enabled: state.enabled, block_enabled: state.block_enabled }, devices: rules })
				}).then(function(r) { return r.json(); }).then(function() {
					ui.hideModal();
					return fetch('/cgi-bin/appfilter?action=state', { cache: 'no-store' }).then(function(r) { return r.json(); });
				}).then(function(st) { state = st; paint(); });
			};

			ui.showModal('设备管控：' + (name || mac), content, [
				E('button', { 'class': 'btn cbi-button cbi-button-remove', click: remove }, ['删除规则']),
				E('button', { 'class': 'btn cbi-button', click: ui.hideModal }, ['取消']),
				E('button', { 'class': 'btn cbi-button cbi-button-save', click: save }, ['保存'])
			]);
		};

		return root;
	},

	render: function(data) {
		try {
			return this.renderInner(data);
		}
		catch (e) {
			return E('div', {}, [
				E('h2', {}, ['应用过滤']),
				E('p', {}, ['页面加载失败: ' + (e && e.message ? e.message : e)])
			]);
		}
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
