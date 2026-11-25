'use strict';
/* 菜单缓存自动失效（安全版）：
   - 只在拿到合法版本号、且与本机记录不同时，清菜单缓存并刷新一次
   - 用 sessionStorage 守卫，防止循环刷新 */
(function() {
	var KEY = 'n5-menuver';
	var GUARD = 'n5-menuver-guard';
	try {
		fetch('/cgi-bin/menuver?t=' + Date.now(), { cache: 'no-store' })
			.then(function(r) { return r.ok ? r.text() : Promise.reject(); })
			.then(function(v) {
				v = (v || '').trim();
				if (!/^[0-9a-f]{32}$/.test(v)) return;
				var old = localStorage.getItem(KEY);
				if (old === v) return;
				localStorage.setItem(KEY, v);
				if (sessionStorage.getItem(GUARD) === v) return;
				sessionStorage.setItem(GUARD, v);
				if (window.L && L.require) {
					L.require('ui').then(function(ui) {
						try { ui.menu.flushCache(); } catch (e) {}
						location.reload();
					}).catch(function() { location.reload(); });
				} else {
					location.reload();
				}
			})
			.catch(function() {});
	} catch (e) {}
})();
