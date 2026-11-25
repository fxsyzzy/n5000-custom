'use strict';
/* 全局快捷入口：顶部栏「⚡ 面板」+「☀/🌙 主题」按钮（所有 LuCI 页面常驻） */
(function() {
	function $(sel, root) { return (root || document).querySelector(sel); }

	function inject() {
		var body = document.body;
		if (!body || body.classList.contains('login') || body.dataset.page === 'login') return;
		if (document.getElementById('n5-quick')) return;
		var host = $('header .main-right') || $('header') || $('.main .main-right');
		if (!host) return;

		var dark = (document.documentElement.getAttribute('data-argon-mode') || 'dark') !== 'light';
		var glass = 'display:inline-flex;align-items:center;gap:5px;padding:5px 12px;border-radius:999px;' +
			'border:1px solid rgba(131,217,220,.28);background:rgba(13,44,84,.22);color:inherit;' +
			'font-size:12.5px;text-decoration:none;line-height:1.2;cursor:pointer;margin-right:6px';

		var box = document.createElement('div');
		box.id = 'n5-quick';
		box.style.cssText = 'display:flex;align-items:center;gap:2px;margin-right:6px';

		var home = document.createElement('a');
		home.href = '/cgi-bin/luci/admin/n5000';
		home.textContent = '⚡ 面板';
		home.title = '返回 N5000 面板';
		home.style.cssText = glass;

		var theme = document.createElement('button');
		theme.type = 'button';
		theme.textContent = dark ? '☀' : '🌙';
		theme.title = dark ? '切换到晨光模式' : '切换到暗夜模式';
		theme.style.cssText = glass + ';font-size:13px';
		theme.onclick = function() {
			fetch('/cgi-bin/theme?to=' + (dark ? 'light' : 'dark'), { cache: 'no-store' })
				.then(function(r) { return r.json(); })
				.then(function() { location.reload(); })
				.catch(function() { location.reload(); });
		};

		box.appendChild(home);
		box.appendChild(theme);
		host.insertBefore(box, host.firstChild);
	}

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', function() { setTimeout(inject, 400); });
	} else {
		setTimeout(inject, 400);
	}
})();
