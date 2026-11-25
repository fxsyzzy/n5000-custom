/* ============================================================
 * N5000 大肥鱼（DeepSeek 鲸鱼娘）全局挂件 —— 左下角常驻
 *  - 静态站立（不游动），点击喂白饭：饭放头上，一叠一碗
 *  - 白饭计数存 localStorage，里程碑有专属台词
 * 素材：社区二创（xxnb0/deepseek-chan-fanpack，CC BY-NC-SA 4.0）
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
		if (!document.body || !document.body.classList.contains('logged-in')) return;
		if (document.getElementById('n5000-mascot')) return;

		var RICE_KEY = 'n5000-rice';
		var BASE = '/luci-static/n5000/';

		var css = ''
			+ '#n5000-mascot{position:fixed;left:14px;bottom:88px;z-index:900;display:flex;align-items:flex-end;gap:12px;max-width:min(640px,90vw);user-select:none;touch-action:none}'
			+ '#n5000-mascot .n5m-body{position:relative;flex:0 0 auto}'
			+ '#n5000-mascot .n5m-img{height:168px;width:auto;display:block;cursor:grab;filter:drop-shadow(0 10px 22px rgba(0,0,0,.45))}'
			+ '#n5000-mascot .n5m-img.dragging{cursor:grabbing}'
			+ '#n5000-mascot .n5m-head{position:absolute;left:50%;bottom:132px;transform:translateX(-50%);width:0;height:0;pointer-events:none}'
			+ '#n5000-mascot .n5m-bowl{position:absolute;left:-22px;bottom:0;font-size:26px;line-height:1;'
			+ 'filter:drop-shadow(0 3px 4px rgba(0,0,0,.35));animation:n5mDrop .38s cubic-bezier(.2,1.5,.5,1) both}'
			+ '@keyframes n5mDrop{0%{opacity:0;transform:translateY(-46px) scale(.5) rotate(-18deg)}70%{opacity:1;transform:translateY(3px) scale(1.06) rotate(3deg)}100%{opacity:1;transform:translateY(0) scale(1) rotate(0)}}'
			+ '#n5000-mascot .n5m-bowl.eat{animation:n5mEat .5s ease-in forwards}'
			+ '@keyframes n5mEat{0%{opacity:1;transform:translateY(0) scale(1)}100%{opacity:0;transform:translateY(-14px) scale(1.5) rotate(12deg)}}'
			+ '#n5000-mascot .n5m-bubble{position:relative;font-size:12.5px;line-height:1.55;padding:9px 14px;border-radius:14px;'
			+ 'background:rgba(127,127,127,.14);border:1px solid rgba(127,127,127,.3);max-width:340px;margin-bottom:76px;pointer-events:none}'
			+ '#n5000-mascot .n5m-bubble:before{content:"";position:absolute;left:-7px;bottom:16px;border:7px solid transparent;border-right-color:rgba(127,127,127,.3)}'
			+ '#n5000-mascot .n5m-rice{position:absolute;left:50%;top:100%;transform:translateX(-50%);margin-top:2px;font-size:11.5px;'
			+ 'padding:2px 9px;border-radius:999px;background:rgba(127,127,127,.16);border:1px solid rgba(127,127,127,.3);white-space:nowrap}'
			+ 'font-size:11.5px;padding:3px 9px;border-radius:10px;background:rgba(127,127,127,.16);border:1px solid rgba(127,127,127,.3)}'

		var style = document.createElement('style');
		style.textContent = css;
		document.head.appendChild(style);

		var wrap = document.createElement('div');
		wrap.id = 'n5000-mascot';
		wrap.innerHTML = ''
			+ '<div class="n5m-body">'
			+ '  <img class="n5m-img" src="' + BASE + 'mascot.png" alt="大肥鱼">'
			+ '  <div class="n5m-head" id="n5m-head"></div>'
			+ '  <div class="n5m-rice" id="n5m-rice">🍚 x 0</div>'
			+ '</div>'
			+ '<div class="n5m-bubble" id="n5m-bubble">…</div>';
		document.body.appendChild(wrap);

		var bubble = document.getElementById('n5m-bubble');
		var riceEl = document.getElementById('n5m-rice');
		var headEl = document.getElementById('n5m-head');
		var img = wrap.querySelector('.n5m-img');

		function getRice() { return parseInt(localStorage.getItem(RICE_KEY) || '0', 10) || 0; }
		function setRice(n) { localStorage.setItem(RICE_KEY, String(n)); riceEl.textContent = '🍚 x ' + n; }
		setRice(getRice());

		/* ---------- 头上叠饭 ---------- */
		var bowlCount = 0;
		function stackBowl() {
			var b = document.createElement('span');
			b.className = 'n5m-bowl';
			b.textContent = '🍚';
			var stackIndex = bowlCount % 5;
			b.style.bottom = (stackIndex * 17) + 'px';
			b.style.transform = 'rotate(' + ((Math.random() * 28) - 14).toFixed(1) + 'deg)';
			b.style.left = (-22 + (Math.random() * 12 - 6)).toFixed(1) + 'px';
			headEl.appendChild(b);
			bowlCount++;
			if (bowlCount > 5) {
				var first = headEl.querySelector('.n5m-bowl');
				if (first) { first.classList.add('eat'); setTimeout(function () { first.remove(); }, 520); }
			}
			setTimeout(function () {
				if (b.parentNode && !b.classList.contains('eat')) {
					b.classList.add('eat');
					setTimeout(function () { b.remove(); }, 520);
				}
			}, 6000);
		}

		/* ---------- 状态台词 ---------- */
		var state = { temp: 0, load: 0, clients: 0 };
		var riceHold = 0;

		function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

		function statusLine() {
			var t = state.temp, l = state.load, c = state.clients;
			if (t >= 80) return pick(['烫烫烫！你是想吃烤鱼吗？！', '喂！散热风扇呢！本鱼要熟了啦！', '……哼，热成这样，白饭都不香了。']);
			if (l > 1.5) return pick(['别催了别催了，本鱼都快游断气了！', '这么多请求…思考链都快绕成毛线团了。', 'CPU 冒烟中，赔我一碗白饭先。']);
			if (t >= 65) return pick(['有点热…哼，才不是因为你。', '本鱼在冒汗，别盯着看！', '这温度…勉强能忍吧，才没有很热。']);
			if (c === 0) return pick(['一条鱼都没连上…白饭都白吃了。', '哼，没人理我，那我去睡觉了（DeepSleep）。', '好无聊，谁来连一下 WiFi 陪我玩嘛。']);
			return pick(['哼，才不是特意帮你看着路由器呢。', '水温刚好…勉强表扬你一下。', '本鱼在摸鱼，别打扰。', '白饭呢？先端一碗过来再说。']);
		}

		function riceLine(n) {
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
			if (n >= 100) return '本鱼已经被你喂成传说级大肥鱼了…';
			return lines[n] || pick(['白饭 GET！放头上刚刚好。', '再来一碗，快点。', '哼，白饭本鱼就不客气了。']);
		}

		function feedRice() {
			var n = getRice() + 1;
			setRice(n);
			stackBowl();
			bubble.textContent = riceLine(n);
			riceHold = Date.now() + 3200;
			if (n === 10 && window.ui && ui.addNotification)
				ui.addNotification(null, document.createTextNode('🍚 大肥鱼：十碗白饭达成！'), 'info');
		}
		wrap.title = '大肥鱼：点我喂白饭，按住可以拖到任意位置';

		/* ---------- 鼠标/触摸拖拽 ---------- */
		var POS_KEY = 'n5000-mascot-pos';
		function applyPos(p) {
			if (!p) return;
			wrap.style.left = p.left + 'px';
			wrap.style.top = p.top + 'px';
			wrap.style.bottom = 'auto';
		}
		function clampPos(l, t) {
			var r = wrap.getBoundingClientRect();
			var maxL = Math.max(4, window.innerWidth - r.width - 4);
			var maxT = Math.max(4, window.innerHeight - r.height - 4);
			return { left: Math.max(4, Math.min(l, maxL)), top: Math.max(4, Math.min(t, maxT)) };
		}
		try {
			var savedPos = JSON.parse(localStorage.getItem(POS_KEY) || 'null');
			if (savedPos && typeof savedPos.left === 'number') applyPos(clampPos(savedPos.left, savedPos.top));
		} catch (e) {}
		window.addEventListener('resize', function () {
			if (wrap.style.top) {
				var r = wrap.getBoundingClientRect();
				applyPos(clampPos(r.left, r.top));
			}
		});
		var drag = null;
		wrap.addEventListener('pointerdown', function (e) {
			if (e.button !== undefined && e.button !== 0) return;
			var r = wrap.getBoundingClientRect();
			drag = { id: e.pointerId, sx: e.clientX, sy: e.clientY, ox: r.left, oy: r.top, moved: 0 };
			try { wrap.setPointerCapture(e.pointerId); } catch (err) {}
			img.classList.add('dragging');
			e.preventDefault();
		});
		wrap.addEventListener('pointermove', function (e) {
			if (!drag || e.pointerId !== drag.id) return;
			var dx = e.clientX - drag.sx, dy = e.clientY - drag.sy;
			drag.moved = Math.max(drag.moved, Math.abs(dx) + Math.abs(dy));
			var p = clampPos(drag.ox + dx, drag.oy + dy);
			wrap.style.left = p.left + 'px';
			wrap.style.top = p.top + 'px';
			wrap.style.bottom = 'auto';
		});
		function endDrag(e) {
			if (!drag || e.pointerId !== drag.id) return;
			var wasDrag = drag.moved > 6;
			drag = null;
			img.classList.remove('dragging');
			if (wasDrag) {
				var r = wrap.getBoundingClientRect();
				try { localStorage.setItem(POS_KEY, JSON.stringify({ left: Math.round(r.left), top: Math.round(r.top) })); } catch (err) {}
			} else {
				feedRice();
			}
		}
		wrap.addEventListener('pointerup', endDrag);
		wrap.addEventListener('pointercancel', function () { drag = null; img.classList.remove('dragging'); });


		/* ---------- AI 语录（大肥鱼 × DeepSeek） ---------- */
		var AI_LINE_KEY = 'n5000-ai-line';
		function applyLine(text) {
			if (!text || !bubble) return;
			bubble.textContent = text;
			riceHold = Math.max(riceHold, Date.now() + 30000);
		}
		function fetchAiLine() {
			try {
				var cache = JSON.parse(localStorage.getItem(AI_LINE_KEY) || 'null');
				if (cache && cache.l && cache.t && (Date.now() - cache.t) < 240000) {
					applyLine(cache.l);
					return;
				}
			} catch (e) {}
			if (document.visibilityState === 'hidden') return;
			fetch('/cgi-bin/aichat?action=line', { cache: 'no-store' })
				.then(function(r) { return r.json(); })
				.then(function(j) {
					if (j && j.code === 0 && j.line) {
						applyLine(j.line);
						try { localStorage.setItem(AI_LINE_KEY, JSON.stringify({ t: Date.now(), l: j.line })); } catch (e) {}
					}
				}).catch(function() {});
		}
		setTimeout(fetchAiLine, 15000);
		setInterval(fetchAiLine, 300000);
		document.addEventListener('visibilitychange', function() {
			if (document.visibilityState === 'visible') fetchAiLine();
		});

		/* ---------- 状态刷新 ---------- */
		function refreshStatus() {
			fetch('/cgi-bin/rstatus?t=' + Date.now(), { cache: 'no-store' })
				.then(function (r) { return r.json(); })
				.then(function (d) {
					state.temp = (d.temp || 0) / 1000;
					state.load = Number(d.load && d.load[0]) || 0;
					state.clients = d.clients || 0;
					if (Date.now() > riceHold) bubble.textContent = statusLine();
				}).catch(function () {});
		}
		refreshStatus();
		setInterval(refreshStatus, 30000);
		setInterval(function () {
			if (Date.now() > riceHold) bubble.textContent = statusLine();
		}, 30000);
	});
})();
