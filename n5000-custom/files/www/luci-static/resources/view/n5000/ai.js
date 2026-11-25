'use strict';
'require view';
'require ui';

var AICSS = [
	'.ai-toolbar{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:10px}',
	'.ai-badge{font-size:12px;padding:3px 10px;border-radius:999px;border:1px solid rgba(127,127,127,.35);opacity:.85}',
	'.ai-dot{display:inline-block;width:8px;height:8px;border-radius:50%;background:#35c48a;margin-right:6px}',
	'.ai-dot.off{background:#e05a5a}',
	'.ai-chat{display:flex;flex-direction:column;gap:10px;height:min(58vh,520px);overflow-y:auto;padding:12px;',
	'border:1px solid rgba(127,127,127,.28);border-radius:12px;background:rgba(127,127,127,.05)}',
	'.ai-msg{display:flex;gap:10px;max-width:92%}',
	'.ai-msg.me{align-self:flex-end;flex-direction:row-reverse}',
	'.ai-av{width:30px;height:30px;flex:0 0 auto;border-radius:9px;display:flex;align-items:center;justify-content:center;',
	'font-size:12px;font-weight:600;background:var(--primary,#4C7DFF);color:#fff;opacity:.9}',
	'.ai-msg.me .ai-av{background:rgba(127,127,127,.45);color:#fff}',
	'.ai-bubble{white-space:pre-wrap;word-break:break-word;font-size:13.5px;line-height:1.6;padding:10px 13px;border-radius:12px;',
	'border:1px solid rgba(127,127,127,.3);background:rgba(255,255,255,.05)}',
	'.ai-msg.me .ai-bubble{background:rgba(76,125,255,.16);border-color:rgba(76,125,255,.35)}',
	'.ai-inputrow{display:flex;gap:8px;margin-top:10px;align-items:flex-end}',
	'.ai-input{flex:1;resize:none;min-height:44px;max-height:140px;padding:10px 12px;border-radius:10px;',
	'border:1px solid rgba(127,127,127,.35);background:rgba(255,255,255,.05);color:inherit;font:inherit;font-size:13.5px;line-height:1.5}',
	'.ai-send{border:none;border-radius:10px;padding:0 18px;height:44px;font:inherit;font-size:13.5px;font-weight:600;',
	'background:var(--primary,#4C7DFF);color:#fff;cursor:pointer}',
	'.ai-send:disabled{opacity:.5;cursor:not-allowed}',
	'.ai-form .cbi-value{display:block;margin-bottom:10px}',
	'.ai-form label{display:block;font-size:12px;opacity:.7;margin-bottom:4px}',
	'.ai-form input,.ai-form textarea{width:100%;padding:8px 10px;border-radius:8px;border:1px solid rgba(127,127,127,.35);',
	'background:rgba(255,255,255,.05);color:inherit;font:inherit;font-size:13px}',
	'.ai-form textarea{min-height:84px;resize:vertical}',
	'.ai-hint{font-size:11.5px;opacity:.6;margin-top:4px;line-height:1.5}',
	'.ai-tools{font-size:11px;opacity:.55;margin-top:2px}'
].join('\n');

return view.extend({
	load: function() {
		return Promise.all([
			fetch('/cgi-bin/aichat?action=config', { cache: 'no-store' }).then(function(r) { return r.json(); }).catch(function() { return {}; }),
			fetch('/cgi-bin/aichat?action=snapshot', { cache: 'no-store' }).then(function(r) { return r.json(); }).catch(function() { return {}; })
		]);
	},

	renderInner: function(data) {
		var self = this;
		this.cfg = data[0] || {};
		this.history = [];
		this.busy = false;

		var root = E('div', {}, [
			E('style', {}, [AICSS]),
			E('h2', {}, ['AI 助手']),
			E('div', { 'class': 'ai-toolbar' }, [
				E('span', { 'class': 'ai-badge' }, [
					E('span', { 'class': 'ai-dot' + (this.cfg.has_key ? '' : ' off'), 'id': 'ai-dot' }),
					E('span', { 'id': 'ai-model' }, [this.cfg.model || 'deepseek-chat'])
				]),
				E('button', { 'class': 'btn cbi-button', click: function() { self.openSettings(); } }, ['设置']),
				E('button', { 'class': 'btn cbi-button', click: function() { self.clearChat(); } }, ['清空对话']),
				E('span', { 'class': 'ai-hint', 'id': 'ai-status' }, [' '])
			]),
			E('div', { 'class': 'ai-chat', 'id': 'ai-chat' }),
			E('div', { 'class': 'ai-inputrow' }, [
				E('textarea', { 'class': 'ai-input', 'id': 'ai-input', 'rows': '1',
					'placeholder': '问点什么…（Enter 发送，Shift+Enter 换行）' }),
				E('button', { 'class': 'ai-send', 'id': 'ai-send', click: function() { self.send(); } }, ['发送'])
			])
		]);

		setTimeout(function() { self.initChat(); }, 80);
		return root;
	},

	initChat: function() {
		var self = this;
		var input = document.getElementById('ai-input');
		if (!input) return;
		input.addEventListener('keydown', function(e) {
			if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); self.send(); }
		});
		input.addEventListener('input', function() {
			this.style.height = 'auto';
			this.style.height = Math.min(this.scrollHeight, 140) + 'px';
		});
		this.welcome();
		if (!this.cfg.has_key)
			this.appendMsg('ai', '还没有配置 API Key。点上面的「设置」填一个 DeepSeek Key（https://platform.deepseek.com）就能聊天了。');
	},

	status: function(text) {
		var el = document.getElementById('ai-status');
		if (el) el.textContent = text || ' ';
	},

	appendMsg: function(role, text, tools) {
		var box = document.getElementById('ai-chat');
		if (!box) return null;
		var wrap = E('div', { 'class': 'ai-msg ' + (role === 'user' ? 'me' : '') }, [
			E('div', { 'class': 'ai-av' }, [role === 'user' ? '你' : 'AI']),
			E('div', {}, [
				E('div', { 'class': 'ai-bubble' }, [text]),
				tools ? E('div', { 'class': 'ai-tools' }, ['调用工具：' + tools]) : null
			])
		]);
		box.appendChild(wrap);
		box.scrollTop = box.scrollHeight;
		return wrap;
	},

	welcome: function() {
		this.appendMsg('ai', '你好，我是 N5000 的 AI 助手。可以问路由器状态、网络问题，也可以让我重启设备 / 重启 WiFi / 改 WiFi 密码（需要在设置里勾选允许操作）。');
	},

	clearChat: function() {
		var box = document.getElementById('ai-chat');
		if (box) box.innerHTML = '';
		this.history = [];
		this.welcome();
		this.status('已清空');
	},

	send: function() {
		var self = this;
		var input = document.getElementById('ai-input');
		if (!input || this.busy) return;
		var text = input.value.trim();
		if (!text) return;
		input.value = '';
		input.style.height = 'auto';
		this.appendMsg('user', text);
		this.history.push({ role: 'user', content: text });
		this.busy = true;
		document.getElementById('ai-send').disabled = true;
		this.status('思考中…');
		var pending = this.appendMsg('ai', '…');

		fetch('/cgi-bin/aichat?action=chat', {
			method: 'POST', headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ messages: this.history.slice(-20) })
		}).then(function(r) { return r.json(); }).then(function(j) {
			self.busy = false;
			document.getElementById('ai-send').disabled = false;
			self.status('');
			if (j && j.code === 0) {
				if (pending && pending.lastChild) pending.lastChild.lastChild.textContent = j.reply;
				else self.appendMsg('ai', j.reply);
				if (j.tools) {
					var w = E('div', { 'class': 'ai-msg' }, [E('div', { 'class': 'ai-av' }, ['AI']),
						E('div', {}, [E('div', { 'class': 'ai-tools' }, ['调用工具：' + j.tools])])]);
					var box = document.getElementById('ai-chat');
					if (box) { box.appendChild(w); box.scrollTop = box.scrollHeight; }
				}
				self.history.push({ role: 'assistant', content: j.reply });
			}
			else {
				var msg = (j && j.error) || '请求失败';
				if (pending && pending.lastChild) pending.lastChild.lastChild.textContent = msg;
				else self.appendMsg('ai', msg);
			}
		}).catch(function(e) {
			self.busy = false;
			document.getElementById('ai-send').disabled = false;
			self.status('');
			var msg = '请求失败：' + (e && e.message ? e.message : e);
			if (pending && pending.lastChild) pending.lastChild.lastChild.textContent = msg;
			else self.appendMsg('ai', msg);
		});
	},

	openSettings: function() {
		var self = this;
		var baseI = E('input', { 'type': 'text', 'value': this.cfg.api_base || 'https://api.deepseek.com' });
		var keyI = E('input', { 'type': 'password', 'placeholder': this.cfg.has_key ? '已保存（留空不改）' : 'sk-...' });
		var modelI = E('input', { 'type': 'text', 'value': this.cfg.model || 'deepseek-chat' });
		var promptI = E('textarea', {}, [this.cfg.system_prompt || '']);
		var toolsCb = E('input', { 'type': 'checkbox' });
		toolsCb.checked = !!this.cfg.allow_tools;
		var enabledCb = E('input', { 'type': 'checkbox' });
		enabledCb.checked = this.cfg.enabled !== false;

		var save = function() {
			var d = {
				api_base: baseI.value.trim(), model: modelI.value.trim(),
				system_prompt: promptI.value, allow_tools: toolsCb.checked, enabled: enabledCb.checked
			};
			var k = keyI.value.trim();
			if (k) d.api_key = k;
			fetch('/cgi-bin/aichat?action=config', {
				method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(d)
			}).then(function(r) { return r.json(); }).then(function(j) {
				if (j && j.code === 0) {
					ui.hideModal();
					fetch('/cgi-bin/aichat?action=config', { cache: 'no-store' }).then(function(r) { return r.json(); })
						.then(function(cfg) {
							self.cfg = cfg;
							var m = document.getElementById('ai-model');
							if (m) m.textContent = cfg.model || 'deepseek-chat';
							var dot = document.getElementById('ai-dot');
							if (dot) dot.className = 'ai-dot' + (cfg.has_key ? '' : ' off');
							ui.addNotification(null, E('p', {}, ['已保存']), 'info');
						});
				} else ui.addNotification(null, E('p', {}, ['保存失败']), 'danger');
			});
		};

		ui.showModal('AI 设置', E('div', { 'class': 'ai-form' }, [
			E('div', { 'class': 'cbi-value' }, [E('label', {}, ['API 地址（OpenAI 兼容）']), baseI,
				E('div', { 'class': 'ai-hint' }, ['DeepSeek: https://api.deepseek.com'])]),
			E('div', { 'class': 'cbi-value' }, [E('label', {}, ['API Key']), keyI,
				E('div', { 'class': 'ai-hint' }, ['保存在路由器本地，不会上传'])]),
			E('div', { 'class': 'cbi-value' }, [E('label', {}, ['模型']), modelI,
				E('div', { 'class': 'ai-hint' }, ['例如 deepseek-chat'])]),
			E('div', { 'class': 'cbi-value' }, [E('label', {}, ['系统提示词']), promptI]),
			E('div', { 'class': 'cbi-value', style: 'display:flex;align-items:center;gap:8px' }, [
				toolsCb, E('label', { style: 'margin:0' }, ['允许 AI 执行路由器操作（重启 / 重启 WiFi / 改 WiFi 密码）'])
			]),
			E('div', { 'class': 'cbi-value', style: 'display:flex;align-items:center;gap:8px' }, [
				enabledCb, E('label', { style: 'margin:0' }, ['启用 AI 助手'])
			])
		]), [
			E('button', { 'class': 'btn cbi-button', click: ui.hideModal }, ['取消']),
			E('button', { 'class': 'btn cbi-button cbi-button-save', click: save }, ['保存'])
		]);
	},

	render: function(data) {
		try {
			return this.renderInner(data);
		}
		catch (e) {
			return E('div', {}, [E('h2', {}, ['AI 助手']), E('p', {}, ['加载失败: ' + (e && e.message ? e.message : e)])]);
		}
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
