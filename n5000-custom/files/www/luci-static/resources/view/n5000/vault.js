'use strict';
'require view';

/* 密码本（隐藏入口）：内嵌本地加密密码本页面，仅通过直链访问 */
return view.extend({
	load: function() {
		return Promise.resolve();
	},

	render: function() {
		var iframe = E('iframe', {
			'src': '/vault.html',
			'style': 'width:100%;height:calc(100vh - 190px);min-height:560px;border:0;border-radius:14px;' +
				'background:transparent;display:block'
		});
		return E('div', {}, [
			E('style', {}, [
				'.n5v-note{font-size:12px;opacity:.6;margin:0 0 8px;line-height:1.5}',
				'.n5v-wrap{border:1px solid rgba(131,217,220,.22);border-radius:16px;overflow:hidden;' +
					'backdrop-filter:blur(14px) saturate(160%);background:rgba(13,44,84,.25)}'
			]),
			E('h2', {}, ['密码本']),
			E('div', { 'class': 'n5v-note' }, ['本地 AES-256 加密，主密码保护。此页面不在菜单中显示，只有知道地址才能访问。']),
			E('div', { 'class': 'n5v-wrap' }, [iframe])
		]);
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
