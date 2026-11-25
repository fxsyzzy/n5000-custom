'use strict';
'require view';
'require ui';

var FAVCSS = [
	'.fav-toolbar{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px;align-items:center}',
	'.fav-search{flex:1;min-width:160px;max-width:320px;padding:8px 12px;border-radius:8px;',
	'border:1px solid rgba(127,127,127,.35);background:rgba(255,255,255,.05);color:inherit;font:inherit;font-size:13px}',
	'.fav-cat{margin-bottom:16px}',
	'.fav-cat h3{display:flex;align-items:center;gap:8px;margin:0 0 10px;font-size:14px}',
	'.fav-count{font-size:11px;opacity:.6;font-weight:400}',
	'.fav-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:10px}',
	'.fav-card{display:flex;flex-direction:column;gap:6px;padding:12px 14px;border-radius:12px;',
	'border:1px solid rgba(127,127,127,.28);background:linear-gradient(180deg,rgba(255,255,255,.05),rgba(255,255,255,.02))}',
	'.fav-card .t{display:flex;align-items:center;gap:8px}',
	'.fav-ico{width:26px;height:26px;flex:0 0 auto;border-radius:8px;display:flex;align-items:center;justify-content:center;',
	'font-size:13px;font-weight:600;background:var(--primary,#48A9C5);color:#fff;opacity:.9}',
	'.fav-name{font-size:13.5px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
	'.fav-url{font-size:11.5px;opacity:.6;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
	'.fav-note{font-size:11.5px;opacity:.55;line-height:1.4}',
	'.fav-actions{display:flex;gap:6px;margin-top:2px}',
	'.fav-btn{font-size:11.5px;padding:3px 9px;border-radius:6px;border:1px solid rgba(127,127,127,.35);',
	'background:rgba(255,255,255,.05);color:inherit;cursor:pointer;text-decoration:none}',
	'.fav-btn:hover{background:rgba(255,255,255,.12)}',
	'.fav-btn.prim{background:var(--primary,#48A9C5);border-color:transparent;color:#fff}',
	'.fav-empty{opacity:.6;font-size:13px;padding:8px 0}',
	'.fav-form .cbi-value{display:block;margin-bottom:10px}',
	'.fav-form label{display:block;font-size:12px;opacity:.7;margin-bottom:4px}',
	'.fav-form input,.fav-form select,.fav-form textarea{width:100%;padding:8px 10px;border-radius:8px;',
	'border:1px solid rgba(127,127,127,.35);background:rgba(255,255,255,.05);color:inherit;font:inherit;font-size:13px}',
	'.fav-catrow{display:flex;gap:8px;align-items:center;margin-bottom:8px}',
	'.fav-catrow input{flex:1}'
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

		var root = E('div', {}, [
			E('style', {}, [FAVCSS]),
			E('h2', {}, ['收藏夹']),
			E('div', { 'class': 'fav-toolbar' }, [
				E('button', { 'class': 'btn cbi-button cbi-button-save', click: function() { self.editSite(null); } }, ['＋ 添加网站']),
				E('button', { 'class': 'btn cbi-button', click: function() { self.manageCats(); } }, ['管理分类']),
				E('input', { 'class': 'fav-search', 'type': 'text', 'placeholder': '搜索收藏…',
					input: function(e) { self.filter = (e.target.value || '').toLowerCase(); self.paint(); } })
			]),
			E('div', { 'id': 'fav-list' })
		]);

		setTimeout(function() { self.paint(); }, 80);
		return root;
	},

	/* ---------- 渲染列表 ---------- */
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
		var shown = 0;

		if (!cats.length) {
			host.appendChild(E('div', { 'class': 'fav-empty' }, ['还没有分类，点「管理分类」添加一个吧。']));
		}

		cats.forEach(function(cat) {
			var list = sites.filter(function(s) {
				if (s.category !== cat.id) return false;
				if (!f) return true;
				return ((s.name || '') + ' ' + (s.url || '') + ' ' + (s.note || '')).toLowerCase().indexOf(f) >= 0;
			});
			if (list.length) shown += list.length;
			if (f && !list.length) return;
			var grid = E('div', { 'class': 'fav-grid' });
			list.forEach(function(site) { grid.appendChild(self.siteCard(site)); });
			if (!list.length) grid.appendChild(E('div', { 'class': 'fav-empty' }, ['这个分类还是空的']));
			host.appendChild(E('div', { 'class': 'fav-cat' }, [
				E('h3', {}, [cat.name, E('span', { 'class': 'fav-count' }, ['　' + list.length + ' 个收藏'])]),
				grid
			]));
		});

		/* 未分类/分类丢失的收藏 */
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
		if (!sites.length) {
			host.appendChild(E('div', { 'class': 'fav-empty' }, ['还没有收藏，点「＋ 添加网站」收藏第一个网站。']));
		}
		else if (f && !shown) {
			host.appendChild(E('div', { 'class': 'fav-empty' }, ['没有匹配「' + f + '」的收藏。']));
		}
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
			E('button', { 'class': 'fav-btn', click: function() { self.editSite(site); } }, ['编辑']),
			E('button', { 'class': 'fav-btn', click: function() { self.delSite(site); } }, ['删除'])
		]));
		return card;
	},

	/* ---------- 操作 ---------- */
	reload: function() {
		var self = this;
		fetch('/cgi-bin/favorites?action=list', { cache: 'no-store' })
			.then(function(r) { return r.json(); })
			.then(function(st) { self.state = st; self.paint(); })
			.catch(function() {});
	},

	editSite: function(site) {
		var self = this;
		var isNew = !site;
		site = site || { name: '', url: '', category: (this.state.categories[0] || {}).id || '', note: '' };
		var nameI = E('input', { 'type': 'text', 'value': site.name || '', 'placeholder': '例如：Bilibili' });
		var urlI = E('input', { 'type': 'text', 'value': site.url || '', 'placeholder': 'https://www.bilibili.com' });
		var catSel = E('select', {});
		(this.state.categories || []).forEach(function(c) {
			var opt = E('option', { 'value': c.id }, [c.name]);
			if (c.id === site.category) opt.selected = true;
			catSel.appendChild(opt);
		});
		if (!(this.state.categories || []).length) {
			catSel.appendChild(E('option', { 'value': '' }, ['（无分类，先去管理分类添加）']));
		}
		var noteI = E('input', { 'type': 'text', 'value': site.note || '', 'placeholder': '备注（可选）' });

		var save = function() {
			var data = { id: isNew ? '' : site.id, name: nameI.value.trim(), url: urlI.value.trim(),
				category: catSel.value, note: noteI.value.trim() };
			if (!data.name || !data.url) { ui.addNotification(null, E('p', {}, ['名称和网址不能为空']), 'warning'); return; }
			fetch('/cgi-bin/favorites?action=save_site', {
				method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data)
			}).then(function(r) { return r.json(); }).then(function(j) {
				if (j.code === 0) { ui.hideModal(); self.reload(); }
				else ui.addNotification(null, E('p', {}, [j.error || '保存失败']), 'danger');
			});
		};

		ui.showModal(isNew ? '添加网站收藏' : '编辑收藏', E('div', { 'class': 'fav-form' }, [
			E('div', { 'class': 'cbi-value' }, [E('label', {}, ['名称']), nameI]),
			E('div', { 'class': 'cbi-value' }, [E('label', {}, ['网址']), urlI]),
			E('div', { 'class': 'cbi-value' }, [E('label', {}, ['分类']), catSel]),
			E('div', { 'class': 'cbi-value' }, [E('label', {}, ['备注']), noteI])
		]), [
			E('button', { 'class': 'btn cbi-button', click: ui.hideModal }, ['取消']),
			E('button', { 'class': 'btn cbi-button cbi-button-save', click: save }, ['保存'])
		]);
	},

	delSite: function(site) {
		var self = this;
		if (!confirm('删除收藏「' + (site.name || site.url) + '」？')) return;
		fetch('/cgi-bin/favorites?action=del_site', {
			method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: site.id })
		}).then(function(r) { return r.json(); }).then(function() { self.reload(); });
	},

	manageCats: function() {
		var self = this;
		var cats = (this.state.categories || []).slice();
		var rows = {};
		var wrap = E('div', { 'class': 'fav-form' });
		cats.forEach(function(c) {
			var inp = E('input', { 'type': 'text', 'value': c.name });
			rows[c.id] = inp;
			wrap.appendChild(E('div', { 'class': 'fav-catrow' }, [
				inp,
				E('button', { 'class': 'fav-btn', click: function() {
					if (!confirm('删除分类「' + c.name + '」？其中的收藏会移到其它分类。')) return;
					fetch('/cgi-bin/favorites?action=del_cat', {
						method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: c.id })
					}).then(function(r) { return r.json(); }).then(function() { ui.hideModal(); self.reload(); });
				} }, ['删除'])
			]));
		});
		var newI = E('input', { 'type': 'text', 'placeholder': '新分类名称，例如：下载站' });
		var saveAll = function() {
			var tasks = [];
			cats.forEach(function(c) {
				var v = rows[c.id].value.trim();
				if (v && v !== c.name)
					tasks.push(fetch('/cgi-bin/favorites?action=save_cat', {
						method: 'POST', headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({ id: c.id, name: v })
					}));
			});
			var nv = newI.value.trim();
			if (nv)
				tasks.push(fetch('/cgi-bin/favorites?action=save_cat', {
					method: 'POST', headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ id: '', name: nv })
				}));
			Promise.all(tasks).then(function() { ui.hideModal(); self.reload(); });
		};
		wrap.appendChild(E('div', { 'class': 'fav-catrow' }, [newI,
			E('button', { 'class': 'fav-btn prim', click: function() {
				var nv = newI.value.trim();
				if (!nv) return;
				fetch('/cgi-bin/favorites?action=save_cat', {
					method: 'POST', headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ id: '', name: nv })
				}).then(function(r) { return r.json(); }).then(function() { ui.hideModal(); self.reload(); });
			} }, ['添加'])]));
		ui.showModal('管理分类', wrap, [
			E('button', { 'class': 'btn cbi-button', click: ui.hideModal }, ['关闭']),
			E('button', { 'class': 'btn cbi-button cbi-button-save', click: saveAll }, ['保存修改'])
		]);
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
