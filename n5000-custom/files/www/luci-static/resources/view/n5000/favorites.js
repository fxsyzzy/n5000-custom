'use strict';
'require view';

var FAVCSS = [
	'.fav-toolbar{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px;align-items:center}',
	'.fav-search{flex:1;min-width:160px;max-width:320px;padding:8px 12px;border-radius:8px;',
	'border:1px solid rgba(131,217,220,.30);background:rgba(13,44,84,.35);color:inherit;font:inherit;font-size:13px}',
	'.fav-panel{display:none;margin-bottom:14px;padding:14px;border-radius:12px;',
	'border:1px solid rgba(131,217,220,.28);background:linear-gradient(180deg,rgba(200,244,249,.06),rgba(13,44,84,.30));',
	'backdrop-filter:blur(12px) saturate(150%);-webkit-backdrop-filter:blur(12px) saturate(150%)}',
	'.fav-panel.on{display:block}',
	'.fav-panel .row{margin-bottom:10px}',
	'.fav-panel label{display:block;font-size:12px;opacity:.7;margin-bottom:4px}',
	'.fav-panel input[type=text],.fav-panel select{width:100%;padding:8px 10px;border-radius:8px;',
	'border:1px solid rgba(131,217,220,.30);background:rgba(13,44,84,.35);color:inherit;font:inherit;font-size:13px}',
	'.fav-panel .actions{display:flex;gap:8px;justify-content:flex-end;margin-top:6px}',
	'.fav-catrow{display:flex;gap:8px;align-items:center;margin-bottom:8px}',
	'.fav-catrow input[type=text]{flex:1}',
	'.fav-cat{margin-bottom:16px}',
	'.fav-cat h3{display:flex;align-items:center;gap:8px;margin:0 0 10px;font-size:14px}',
	'.fav-count{font-size:11px;opacity:.6;font-weight:400}',
	'.fav-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:10px}',
	'.fav-card{display:flex;flex-direction:column;gap:6px;padding:12px 14px;border-radius:12px;',
	'border:1px solid rgba(131,217,220,.24);background:linear-gradient(180deg,rgba(200,244,249,.06),rgba(13,44,84,.28));',
	'backdrop-filter:blur(12px) saturate(150%);-webkit-backdrop-filter:blur(12px) saturate(150%)}',
	'.fav-card .t{display:flex;align-items:center;gap:8px}',
	'.fav-ico{width:26px;height:26px;flex:0 0 auto;border-radius:8px;display:flex;align-items:center;justify-content:center;',
	'font-size:13px;font-weight:600;background:var(--primary,#48A9C5);color:#04121a;opacity:.95}',
	'.fav-name{font-size:13.5px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
	'.fav-url{font-size:11.5px;opacity:.6;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
	'.fav-note{font-size:11.5px;opacity:.55;line-height:1.4}',
	'.fav-actions{display:flex;gap:6px;margin-top:2px}',
	'.fav-btn{font-size:11.5px;padding:3px 9px;border-radius:6px;border:1px solid rgba(131,217,220,.32);',
	'background:rgba(13,44,84,.35);color:inherit;cursor:pointer;text-decoration:none}',
	'.fav-btn:hover{background:rgba(72,169,197,.25)}',
	'.fav-btn.prim{background:var(--primary,#48A9C5);border-color:transparent;color:#04121a;font-weight:600}',
	'.fav-empty{opacity:.6;font-size:13px;padding:8px 0}'
].join('\n');

return view.extend({
	load: function() {
		return fetch('/cgi-bin/favorites?action=list', { cache: 'no-store' })
			.then(function(r) { return r.json(); })
			.catch(function() { return { code: -1, categories: [], sites: [] }; });
	},

	renderInner: function(state) {
		var self = this;
		this.state = state || { categories: [], sites: [] };
		this.filter = '';
		this.mode = null;       /* null | 'add' | 'edit' */
		this.editId = null;

		/* ---------- 网站表单（内嵌） ---------- */
		this.f = {};
		this.f.name = E('input', { 'type': 'text', 'placeholder': '例如：Bilibili' });
		this.f.url = E('input', { 'type': 'text', 'placeholder': 'https://www.bilibili.com' });
		this.f.cat = E('select', {});
		this.f.note = E('input', { 'type': 'text', 'placeholder': '备注（可选）' });
		var mkRow = function(label, input) {
			return E('div', { 'class': 'row' }, [E('label', {}, [label]), input]);
		};
		this.formPanel = E('div', { 'class': 'fav-panel', 'id': 'fav-form' }, [
			E('div', { 'id': 'fav-form-title', 'style': 'font-size:13.5px;font-weight:600;margin-bottom:10px' }, ['添加网站']),
			mkRow('名称', this.f.name),
			mkRow('网址', this.f.url),
			mkRow('分类', this.f.cat),
			mkRow('备注', this.f.note),
			E('div', { 'class': 'actions' }, [
				E('button', { 'class': 'btn cbi-button', click: function() { self.hideForm(); } }, ['取消']),
				E('button', { 'class': 'btn cbi-button cbi-button-save', click: function() { self.saveSite(); } }, ['保存'])
			])
		]);

		/* ---------- 分类管理（内嵌） ---------- */
		this.catPanel = E('div', { 'class': 'fav-panel', 'id': 'fav-catpanel' }, [
			E('div', { 'style': 'font-size:13.5px;font-weight:600;margin-bottom:10px' }, ['管理分类']),
			E('div', { 'id': 'fav-catrows' }),
			E('div', { 'class': 'fav-catrow', 'style': 'margin-top:10px' }, [
				E('input', { 'type': 'text', 'id': 'fav-newcat', 'placeholder': '新分类名称，例如：下载站' }),
				E('button', { 'class': 'fav-btn prim', click: function() { self.addCategory(); } }, ['添加'])
			]),
			E('div', { 'class': 'actions' }, [
				E('button', { 'class': 'btn cbi-button', click: function() { self.hideCatPanel(); } }, ['关闭']),
				E('button', { 'class': 'btn cbi-button cbi-button-save', click: function() { self.saveCategories(); } }, ['保存修改'])
			])
		]);

		var root = E('div', {}, [
			E('style', {}, [FAVCSS]),
			E('h2', {}, ['收藏夹']),
			E('div', { 'class': 'fav-toolbar' }, [
				E('button', { 'class': 'btn cbi-button cbi-button-save', click: function() { self.showForm(); } }, ['＋ 添加网站']),
				E('button', { 'class': 'btn cbi-button', click: function() { self.showCatPanel(); } }, ['管理分类']),
				E('input', { 'class': 'fav-search', 'type': 'text', 'placeholder': '搜索收藏…',
					input: function(e) { self.filter = (e.target.value || '').toLowerCase(); self.paint(); } })
			]),
			this.formPanel,
			this.catPanel,
			E('div', { 'id': 'fav-list' })
		]);

		setTimeout(function() {
			self.paint();
			self.renderCatRows();
		}, 80);
		return root;
	},

	/* ---------- 列表渲染 ---------- */
	paint: function() {
		var self = this;
		var host = document.getElementById('fav-list');
		if (!host) return;
		host.innerHTML = '';
		var cats = (this.state.categories || []).slice().sort(function(a, b) {
			return (Number(a.order) || 99) - (Number(b.order) || 99);
		});
		var sites = this.state.sites || [];
		var f = this.filter || '';

		/* 更新表单分类下拉 */
		if (this.f && this.f.cat) {
			var cur = this.f.cat.value;
			this.f.cat.innerHTML = '';
			cats.forEach(function(c) {
				var opt = E('option', { 'value': c.id }, [c.name]);
				if (c.id === cur) opt.selected = true;
				self.f.cat.appendChild(opt);
			});
			if (!cats.length) this.f.cat.appendChild(E('option', { 'value': '' }, ['（先去管理分类添加）']));
		}

		var shown = 0;
		if (!cats.length)
			host.appendChild(E('div', { 'class': 'fav-empty' }, ['还没有分类，点「管理分类」添加一个吧。']));

		cats.forEach(function(cat) {
			var list = sites.filter(function(s) {
				if (s.category !== cat.id) return false;
				if (!f) return true;
				return ((s.name || '') + ' ' + (s.url || '') + ' ' + (s.note || '')).toLowerCase().indexOf(f) >= 0;
			});
			shown += list.length;
			if (f && !list.length) return;
			var grid = E('div', { 'class': 'fav-grid' });
			list.forEach(function(site) { grid.appendChild(self.siteCard(site)); });
			if (!list.length) grid.appendChild(E('div', { 'class': 'fav-empty' }, ['这个分类还是空的']));
			host.appendChild(E('div', { 'class': 'fav-cat' }, [
				E('h3', {}, [cat.name, E('span', { 'class': 'fav-count' }, ['　' + list.length + ' 个收藏'])]),
				grid
			]));
		});

		/* 未分类 */
		var known = {};
		cats.forEach(function(c) { known[c.id] = 1; });
		var orphans = sites.filter(function(s) { return !known[s.category]; });
		if (orphans.length) {
			var g2 = E('div', { 'class': 'fav-grid' });
			orphans.forEach(function(site) { g2.appendChild(self.siteCard(site)); });
			host.appendChild(E('div', { 'class': 'fav-cat' }, [
				E('h3', {}, ['未分类', E('span', { 'class': 'fav-count' }, ['　' + orphans.length + ' 个收藏'])]),
				g2
			]));
			shown += orphans.length;
		}
		if (!sites.length)
			host.appendChild(E('div', { 'class': 'fav-empty' }, ['还没有收藏，点「＋ 添加网站」收藏第一个网站。']));
		else if (f && !shown)
			host.appendChild(E('div', { 'class': 'fav-empty' }, ['没有匹配「' + f + '」的收藏。']));
	},

	siteCard: function(site) {
		var self = this;
		var name = site.name || site.url || '未命名';
		var url = site.url || '#';
		var initial = (name || '?').trim().charAt(0).toUpperCase();
		var hostname = url.replace(/^https?:\/\//, '').split('/')[0];
		var card = E('div', { 'class': 'fav-card' }, [
			E('div', { 'class': 't' }, [
				E('div', { 'class': 'fav-ico' }, [initial]),
				E('div', { 'style': 'min-width:0' }, [
					E('div', { 'class': 'fav-name', 'title': name }, [name]),
					E('div', { 'class': 'fav-url', 'title': url }, [hostname])
				])
			])
		]);
		if (site.note) card.appendChild(E('div', { 'class': 'fav-note' }, [site.note]));
		card.appendChild(E('div', { 'class': 'fav-actions' }, [
			E('a', { 'class': 'fav-btn prim', 'href': url, 'target': '_blank', 'rel': 'noopener' }, ['打开']),
			E('button', { 'class': 'fav-btn', click: function() { self.showForm(site); } }, ['编辑']),
			E('button', { 'class': 'fav-btn', click: function() { self.delSite(site); } }, ['删除'])
		]));
		return card;
	},

	/* ---------- 网站表单 ---------- */
	showForm: function(site) {
		var el = document.getElementById('fav-form');
		if (!el) return;
		this.mode = site ? 'edit' : 'add';
		this.editId = site ? site.id : null;
		var title = document.getElementById('fav-form-title');
		if (title) title.textContent = site ? ('编辑收藏：' + (site.name || site.url)) : '添加网站';
		this.f.name.value = site ? (site.name || '') : '';
		this.f.url.value = site ? (site.url || '') : '';
		this.f.note.value = site ? (site.note || '') : '';
		this.paint(); /* 刷新下拉选项 */
		if (site && site.category) this.f.cat.value = site.category;
		el.className = 'fav-panel on';
		if (el.scrollIntoView) el.scrollIntoView({ block: 'nearest' });
	},

	hideForm: function() {
		var el = document.getElementById('fav-form');
		if (el) el.className = 'fav-panel';
		this.mode = null;
		this.editId = null;
	},

	saveSite: function() {
		var self = this;
		var data = {
			id: this.editId || '',
			name: (this.f.name.value || '').trim(),
			url: (this.f.url.value || '').trim(),
			category: this.f.cat.value || '',
			note: (this.f.note.value || '').trim()
		};
		if (!data.name || !data.url) { alert('名称和网址不能为空'); return; }
		fetch('/cgi-bin/favorites?action=save_site', {
			method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data)
		}).then(function(r) { return r.json(); }).then(function(j) {
			if (j.code === 0) { self.hideForm(); self.reload(); }
			else alert('保存失败：' + (j.error || '未知错误'));
		}).catch(function(e) { alert('保存失败：' + e.message); });
	},

	delSite: function(site) {
		var self = this;
		if (!confirm('删除收藏「' + (site.name || site.url) + '」？')) return;
		fetch('/cgi-bin/favorites?action=del_site', {
			method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: site.id })
		}).then(function(r) { return r.json(); }).then(function() { self.reload(); });
	},

	/* ---------- 分类管理 ---------- */
	showCatPanel: function() {
		var el = document.getElementById('fav-catpanel');
		if (!el) return;
		this.renderCatRows();
		el.className = 'fav-panel on';
		if (el.scrollIntoView) el.scrollIntoView({ block: 'nearest' });
	},

	hideCatPanel: function() {
		var el = document.getElementById('fav-catpanel');
		if (el) el.className = 'fav-panel';
	},

	renderCatRows: function() {
		var host = document.getElementById('fav-catrows');
		if (!host) return;
		var self = this;
		host.innerHTML = '';
		var cats = (this.state.categories || []).slice().sort(function(a, b) {
			return (Number(a.order) || 99) - (Number(b.order) || 99);
		});
		if (!cats.length) host.appendChild(E('div', { 'class': 'fav-empty' }, ['还没有分类']));
		cats.forEach(function(c) {
			var inp = E('input', { 'type': 'text', 'value': c.name });
			inp.setAttribute('data-cat', c.id);
			host.appendChild(E('div', { 'class': 'fav-catrow' }, [
				inp,
				E('button', { 'class': 'fav-btn', click: function() {
					if (!confirm('删除分类「' + c.name + '」？其中的收藏会移到其它分类。')) return;
					fetch('/cgi-bin/favorites?action=del_cat', {
						method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: c.id })
					}).then(function(r) { return r.json(); }).then(function() { self.reload(); });
				} }, ['删除'])
			]));
		});
	},

	saveCategories: function() {
		var self = this;
		var host = document.getElementById('fav-catrows');
		if (!host) return;
		var tasks = [];
		host.querySelectorAll('input[data-cat]').forEach(function(inp) {
			var id = inp.getAttribute('data-cat');
			var name = (inp.value || '').trim();
			if (name)
				tasks.push(fetch('/cgi-bin/favorites?action=save_cat', {
					method: 'POST', headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ id: id, name: name })
				}));
		});
		Promise.all(tasks).then(function() { self.hideCatPanel(); self.reload(); });
	},

	addCategory: function() {
		var self = this;
		var inp = document.getElementById('fav-newcat');
		var name = inp ? (inp.value || '').trim() : '';
		if (!name) return;
		fetch('/cgi-bin/favorites?action=save_cat', {
			method: 'POST', headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ id: '', name: name })
		}).then(function(r) { return r.json(); }).then(function() {
			if (inp) inp.value = '';
			self.reload();
		});
	},

	reload: function() {
		var self = this;
		fetch('/cgi-bin/favorites?action=list', { cache: 'no-store' })
			.then(function(r) { return r.json(); })
			.then(function(st) {
				self.state = st;
				self.paint();
				self.renderCatRows();
			}).catch(function() {});
	},

	render: function(data) {
		try {
			return this.renderInner(data);
		}
		catch (e) {
			return E('div', {}, [E('h2', {}, ['收藏夹']), E('p', {}, ['加载失败: ' + (e && e.message ? e.message : e)])]);
		}
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
