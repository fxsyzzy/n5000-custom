'use strict';
/* 菜单缓存自动失效：菜单文件变化时清掉浏览器的菜单缓存并刷新一次 */
(function() {
	var KEY = 'n5-menuver';

	function forceReload() {
		try {
			if (window.L && L.require) {
				L.require('ui').then(function(ui) {
					try { ui.menu.flushCache(); } catch (e) {}
					location.reload();
				}).catch(function() { location.reload(); });
				return;
			}
		} catch (e) {}
		location.reload();
	}

	try {
		/* 手动强制刷新入口：?n5flushmenu=1 */
		if (location.search.indexOf('n5flushmenu=1') >= 0)
			localStorage.removeItem(KEY);

		fetch('/cgi-bin/menuver?t=' + Date.now(), { cache: 'no-store' })
			.then(function(r) { return r.text(); })
			.then(function(v) {
				v = (v || '').trim();
				if (!v) return;
				var old = localStorage.getItem(KEY);
				if (old !== v) {
					localStorage.setItem(KEY, v);
					forceReload();
				}
			})
			.catch(function() {});
	} catch (e) {}
})();
