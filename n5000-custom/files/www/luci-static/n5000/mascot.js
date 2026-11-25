/* ============================================================
 * N5000 大肥鱼（DeepSeek 鲸鱼娘）全局挂件 —— 左下角常驻
 *  - 常驻所有 LuCI 页面（登录页除外）
 *  - 点击喂白饭：🍚 +1，计数器存 localStorage
 *  - 随温度/负载/在线设备数说傲娇台词
 * ============================================================ */
(function () {
	'use strict';
	if (window.__n5000MascotLoaded) return;
	window.__n5000MascotLoaded = true;

	function ready(fn) {
		if (document.readyState === 'loading')
			document.addEventListener('DOMContentLoaded', fn);
		else
			fn();
	}

	ready(function () {
		/* 登录页不显示 */
		if (!document.body || !document.body.classList.contains('logged-in')) return;
		if (document.getElementById('n5000-mascot')) return;

		var RICE_KEY = 'n5000-rice';
		var RICE_EATEN_KEY = 'n5000-rice-eaten';

		var css = ''
			+ '#n5000-mascot{position:fixed;left:16px;bottom:14px;z-index:900;display:flex;align-items:flex-end;gap:10px;max-width:min(560px,80vw);user-select:none}'
			+ '#n5000-mascot .n5m-img{height:104px;width:auto;cursor:pointer;filter:drop-shadow(0 8px 18px rgba(0,0,0,.42));animation:n5mSwim 8s ease-in-out infinite}'
			+ '@keyframes n5mSwim{0%,100%{transform:translate(0,0) rotate(0)}25%{transform:translate(-11px,-5px) rotate(-1.6deg)}50%{transform:translate(0,-9px) rotate(0)}75%{transform:translate(11px,-5px) rotate(1.6deg)}}'
			+ '#n5000-mascot .n5m-bubble{position:relative;font-size:12.5px;line-height:1.55;padding:9px 14px;border-radius:14px;'
			+ 'background:rgba(127,127,127,.14);border:1px solid rgba(127,127,127,.3);max-width:340px;margin-bottom:58px;'
			+ 'color:inherit;pointer-events:none}'
			+ '#n5000-mascot .n5m-bubble:before{content:"";position:absolute;left:-7px;bottom:16px;border:7px solid transparent;border-right-color:rgba(127,127,127,.3)}'
			+ '#n5000-mascot .n5m-rice{position:absolute;left:6px;bottom:-2px;font-size:11.5px;padding:2px 9px;border-radius:999px;'
			+ 'background:rgba(127,127,127,.16);border:1px solid rgba(127,127,127,.3)}'
			+ '#n5000-mascot .n5m-float{position:absolute;left:40px;bottom:60px;font-size:16px;font-weight:600;pointer-events:none;'
			+ 'animation:n5mFloat 1.4s ease-out forwards}'
			+ '@keyframes n5mFloat{0%{opacity:0;transform:translateY(0) scale(.8)}20%{opacity:1}100%{opacity:0;transform:translateY(-72px) scale(1.15)}}'
			+ '#n5000-mascot.swim .n5m-img{animation:n5mAcross 2.6s ease-in-out forwards}'
			+ '@keyframes n5mAcross{0%{transform:translateX(0) scale(1)}45%{transform:translateX(60vw) scale(1.06)}100%{transform:translateX(130vw) scale(.9)}}'
			+ '@media(max-width:640px){#n5000-mascot .n5m-img{height:76px}#n5000-mascot .n5m-bubble{max-width:44vw;font-size:11.5px;margin-bottom:44px}}';

		var style = document.createElement('style');
		style.textContent = css;
		document.head.appendChild(style);

		var wrap = document.createElement('div');
		wrap.id = 'n5000-mascot';
		wrap.innerHTML = ''
			+ '<div style="position:relative">'
			+ '  <img class="n5m-img" src="/luci-static/n5000/mascot.png" alt="大肥鱼">'
			+ '  <div class="n5m-rice" id="n5m-rice">🍚 x 0</div>'
			+ '</div>'
			+ '<div class="n5m-bubble" id="n5m-bubble">…</div>';
		document.body.appendChild(wrap);

		var bubble = document.getElementById('n5m-bubble');
		var riceEl = document.getElementById('n5m-rice');
		var img = wrap.querySelector('.n5m-img');

		function getRice() { return parseInt(localStorage.getItem(RICE_KEY) || '0', 10) || 0; }
		function setRice(n) { localStorage.setItem(RICE_KEY, String(n)); riceEl.textContent = '🍚 x ' + n; }
		setRice(getRice());

		var state = { temp: 0, load: 0, clients: 0 };

		function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

		function statusLine() {
			var t = state.temp, l = state.load, c = state.clients;
			if (t >= 80) return pick([
				'烫烫烫！你是想吃烤鱼吗？！',
				'喂！散热风扇呢！本鱼要熟了啦！',
				'……哼，热成这样，白饭都不香了。'
			]);
			if (l > 1.5) return pick([
				'别催了别催了，本鱼都快游断气了！',
				'这么多请求…思考链都快绕成毛线团了。',
				'CPU 冒烟中，赔我一碗白饭先。'
			]);
			if (t >= 65) return pick([
				'有点热…哼，才不是因为你。',
				'本鱼在冒汗，别盯着看！',
				'这温度…勉强能忍吧，才没有很热。'
			]);
			if (c === 0) return pick([
				'一条鱼都没连上…白饭都白吃了。',
				'哼，没人理我，那我去睡觉了（DeepSleep）。',
				'好无聊，谁来连一下 WiFi 陪我玩嘛。'
			]);
			return pick([
				'哼，才不是特意帮你看着路由器呢。',
				'水温刚好…勉强表扬你一下。',
				'本鱼在摸鱼，别打扰。',
				'白饭呢？先端一碗过来再说。'
			]);
		}

		function showRiceEasterEgg(n) {
			var lines = {
				1: '哼…就一碗？算了，本鱼勉强收下。',
				2: '第二碗了…你、你是不是想讨好本鱼？',
				3: '…还行吧，本鱼心情好了一点点。',
				5: '五碗！本鱼今天可以多摸一会儿鱼了。',
				7: '再吃下去要变成真正的肥鱼了啦！',
				10: '十碗白饭达成…本鱼宣布你今天表现不错（才没有很高兴）。',
				20: '喂，你是开白饭铺的吗？！',
				50: '本鱼吃饱了，可以开始工作了…大概。'
			};
			if (lines[n]) return lines[n];
			if (n >= 100) return '本鱼已经被你喂成传说级大肥鱼了…';
			return pick(['白饭 GET！', '再来一碗，快点。', '哼，白饭本鱼就不客气了。']);
		}

		function floatRice() {
			var f = document.createElement('div');
			f.className = 'n5m-float';
			f.textContent = ['🍚', '🍚 +1', '🍙', '🍚 白饭 GET'][Math.floor(Math.random() * 4)];
			wrap.querySelector('div').appendChild(f);
			setTimeout(function () { f.remove(); }, 1500);
		}

		function swimAcross() {
			if (wrap.classList.contains('swim')) return;
			wrap.classList.add('swim');
			setTimeout(function () { wrap.classList.remove('swim'); }, 2800);
		}

		img.addEventListener('click', function () {
			var n = getRice() + 1;
			setRice(n);
			floatRice();
			bubble.textContent = showRiceEasterEgg(n);
			clearTimeout(img.__riceT);
			img.__riceT = setTimeout(function () { bubble.textContent = statusLine(); }, 3500);
			if (n === 10 && window.ui && ui.addNotification)
				ui.addNotification(null, document.createTextNode('🍚 大肥鱼：十碗白饭达成！'), 'info');
			if (n % 5 === 0) swimAcross();
		});

		/* 托盘/悬停提示 */
		wrap.title = '大肥鱼：点我喂白饭（本鱼会勉为其难收下）';

		function refreshStatus() {
			fetch('/cgi-bin/rstatus?t=' + Date.now(), { cache: 'no-store' })
				.then(function (r) { return r.json(); })
				.then(function (d) {
					state.temp = (d.temp || 0) / 1000;
					state.load = Number(d.load && d.load[0]) || 0;
					state.clients = d.clients || 0;
					if (!img.__riceT || Date.now() > (img.__riceUntil || 0)) {
						bubble.textContent = statusLine();
						img.__riceUntil = Date.now() + 3500;
					}
				}).catch(function () {});
		}

		refreshStatus();
		setInterval(refreshStatus, 15000);
		setInterval(function () {
			if (img.__riceT && Date.now() < (img.__riceUntil || 0)) return;
			bubble.textContent = statusLine();
		}, 20000);
		setInterval(swimAcross, 90000);
	});
})();
