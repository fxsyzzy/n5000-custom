/* N5000 护眼模式（暖色滤镜，适配晨光/浅色主题）
 * 配置保存在浏览器 localStorage：n5000-eye = '1' | '0'
 * 通过 html[data-np-eye="1"] 覆盖一层暖色滤镜，不改变页面结构
 */
(function() {
	var KEY = 'n5000-eye';
	var STYLE_ID = 'np-eyecare-style';
	var CSS = 'html[data-np-eye="1"]::before{content:"";position:fixed;inset:0;pointer-events:none;z-index:2147483646;background:linear-gradient(180deg,rgba(255,199,128,.22),rgba(255,170,92,.19));mix-blend-mode:multiply}' +
		'html[data-np-eye="1"] img,html[data-np-eye="1"] canvas{filter:sepia(.10) saturate(1.02)}';

	function ensureStyle() {
		if (document.getElementById(STYLE_ID)) return;
		var st = document.createElement('style');
		st.id = STYLE_ID;
		st.appendChild(document.createTextNode(CSS));
		(document.head || document.documentElement).appendChild(st);
	}

	function set(on) {
		try { localStorage.setItem(KEY, on ? '1' : '0'); } catch (e) {}
		ensureStyle();
		if (on) document.documentElement.setAttribute('data-np-eye', '1');
		else document.documentElement.removeAttribute('data-np-eye');
	}

	function isOn() {
		return document.documentElement.getAttribute('data-np-eye') === '1';
	}

	function toggle() {
		set(!isOn());
		return isOn();
	}

	window.npEyeCare = { isOn: isOn, set: set, toggle: toggle };

	var saved = '0';
	try { saved = localStorage.getItem(KEY) || '0'; } catch (e) {}
	if (saved === '1') set(true);
})();
