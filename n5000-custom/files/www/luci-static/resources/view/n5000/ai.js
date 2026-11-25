'use strict';
'require view';

var AICSS = [
	'.ai-toolbar{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:10px}',
	'.ai-badge{font-size:12px;padding:3px 10px;border-radius:999px;border:1px solid rgba(127,127,127,.35);opacity:.85}',
	'.ai-dot{display:inline-block;width:8px;height:8px;border-radius:50%;background:#35c48a;margin-right:6px}',
	'.ai-dot.off{background:#e05a5a}',
	'.ai-settings{display:none;margin-bottom:12px;padding:14px;border-radius:12px;',
	'border:1px solid rgba(127,127,127,.3);background:rgba(127,127,127,.06)}',
	'.ai-settings.on{display:block}',
	'.ai-settings .row{margin-bottom:10px}',
	'.ai-settings label{display:block;font-size:12px;opacity:.7;margin-bottom:4px}',
	'.ai-settings input[type=text],.ai-settings input[type=password],.ai-settings textarea{width:100%;padding:8px 10px;',
	'border-radius:8px;border:1px solid rgba(127,127,127,.35);background:rgba(255,255,255,.05);color:inherit;font:inherit;font-size:13px}',
	'.ai-settings textarea{min-height:76px;resize:vertical}',
	'.ai-settings .chk{display:flex;align-items:center;gap:8px;font-size:13px;margin-bottom:8px}',
	'.ai-settings .hint{font-size:11.5px;opacity:.6;margin-top:4px;line-height:1.5}',
	'.ai-settings .actions{display:flex;gap:8px;justify-content:flex-end;margin-top:6px}',
	'.ai-chat{display:flex;flex-direction:column;gap:10px;height:min(56vh,500px);overflow-y:auto;padding:12px;',
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
	'.ai-tools{font-size:11px;opacity:.55;margin-top:2px}'
].join('\n');

return view.extend({
	load: function() {
		return fetch('/cgi-bin/aichat?action=config', { cache: 'no-store' })
			.then(function(r) { return r.json(); })
			.catch(function() { return {}; });
	},

	renderInner: function(cfg) {
		var self = this;
		this.cfg = cfg || {};
		this.history = [];
		this.busy = false;
		this.settingsOpen = false;

		/* ---- 内嵌设置面板 ---- */
		this.f = {};
		var mkRow = function(label, inputEl, hint) {
			var kids = [E('label', {}, [label]), inputEl];
			if (hint) kids.push(E('div', { 'class': 'hint' }, [hint]));
			return E('div', { 'class': 'row' }, kids);
		};
		this.f.base = E('input', { 'type': 'text', 'value': this.cfg.api_base || 'https://api.deepseek.com' });
		this.f.key = E('input', { 'type': 'password', 'placeholder': this.cfg.has_key ? '已保存，留空表示不修改' : 'sk-...' });
		this.f.model = E('input', { 'type': 'text', 'value': this.cfg.model || 'deepseek-chat' });
		this.f.prompt = E('textarea', {}, [this.cfg.system_prompt || '']);
		this.f.tools = E('input', { 'type': 'checkbox' });
		this.f.tools.checked = !!this.cfg.allow_tools;
		this.f.enabled = E('input', { 'type': 'checkbox' });
		this.f.enabled.checked = this.cfg.enabled !== false;

		var settings = E('div', { 'class': 'ai-settings', 'id': 'ai-settings' }, [
			mkRow('API 地址（OpenAI 兼容）', this.f.base, 'DeepSeek 填 https://api.deepseek.com'),
			mkRow('API Key', this.f.key, '保存在路由器本地，不会上传'),
			mkRow('模型', this.f.model, '例如 deepseek-chat'),
			mkRow('系统提示词', this.f.prompt),
			E('div', { 'class': 'chk' }, [this.f.tools, E('span', {}, ['允许 AI 执行路由器操作（重启 / 重启 WiFi / 改 WiFi 密码）'])]),
			E('div', { 'class': 'chk' }, [this.f.enabled, E('span', {}, ['启用 AI 助手'])]),
			E('div', { 'class': 'actions' }, [
				E('button', { 'class': 'btn cbi-button', 'id': 'ai-cancel', click: function() { self.toggleSettings(false); } }, ['取消']),
				E('button', { 'class': 'btn cbi-button cbi-button-save', 'id': 'ai-save', click: function() { self.saveSettings(); } }, ['保存'])
			])
		]);

		var root = E('div', {}, [
			E('style', {}, [AICSS]),
			E('h2', {}, ['AI 助手']),
			E('div', { 'class': 'ai-toolbar' }, [
				E('span', { 'class': 'ai-badge' }, [
					E('span', { 'class': 'ai-dot' + (this.cfg.has_key ? '' : ' off'), 'id': 'ai-dot' }),
					E('span', { 'id': 'ai-model' }, [this.cfg.model || 'deepseek-chat'])
				]),
				E('button', { 'class': 'btn cbi-button', 'id': 'ai-setbtn', click: function() { self.toggleSettings(); } }, ['设置']),
				E('button', { 'class': 'btn cbi-button', 'id': 'ai-clear', click: function() { self.clearChat(); } }, ['清空对话']),
				E('span', { 'class': 'hint', 'id': 'ai-status' }, [' '])
			]),
			settings,
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
		var input = document.getElementById('ai-input');
		if (!input) return;
		var self = this;
		input.addEventListener('keydown', function(e) {
			if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); self.send(); }
		});
		input.addEventListener('input', function() {
			this.style.height = 'auto';
			this.style.height = Math.min(this.scrollHeight, 140) + 'px';
		});
		this.welcome();
		if (!this.cfg.has_key)
			this.appendMsg('ai', '还没有配置 API Key。点「设置」填一个 DeepSeek Key（platform.deepseek.com）就能聊天了。');
	},

	toggleSettings: function(force) {
		var el = document.getElementById('ai-settings');
		if (!el) return;
		this.settingsOpen = (force === undefined) ? !this.settingsOpen : !!force;
		el.className = 'ai-settings' + (this.settingsOpen ? ' on' : '');
		if (this.settingsOpen) {
			var b = document.getElementById('ai-settings');
			var base = document.getElementById('ai-setbtn');
			if (b && b.scrollIntoView) b.scrollIntoView({ block: 'nearest' });
			if (base) base.textContent = '收起设置';
		}
		else {
			var btn = document.getElementById('ai-setbtn');
			if (btn) btn.textContent = '设置';
		}
	},

	saveSettings: function() {
		var self = this;
		var d = {
			api_base: (this.f.base.value || '').trim(),
			model: (this.f.model.value || '').trim(),
			system_prompt: this.f.prompt.value || '',
			allow_tools: !!this.f.tools.checked,
			enabled: !!this.f.enabled.checked
		};
		var k = (this.f.key.value || '').trim();
		if (k) d.api_key = k;
		this.status('保存中…');
		fetch('/cgi-bin/aichat?action=config', {
			method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(d)
		}).then(function(r) { return r.json(); }).then(function(j) {
			self.status('');
			if (j && j.code === 0) {
				self.cfg = {
					api_base: d.api_base, model: d.model, system_prompt: d.system_prompt,
					allow_tools: d.allow_tools, enabled: d.enabled,
					has_key: !!k || self.cfg.has_key
				};
				self.f.key.value = '';
				var m = document.getElementById('ai-model');
				if (m) m.textContent = d.model || 'deepseek-chat';
				var dot = document.getElementById('ai-dot');
				if (dot) dot.className = 'ai-dot' + (self.cfg.has_key ? '' : ' off');
				self.appendMsg('ai', '设置已保存。');
				self.toggleSettings(false);
			} else {
				self.appendMsg('ai', '保存失败：' + ((j && j.error) || '未知错误'));
			}
		}).catch(function(e) {
			self.status('');
			self.appendMsg('ai', '保存失败：' + (e && e.message ? e.message : e));
		});
	},

	status: function(text) {
		var el = document.getElementById('ai-status');
		if (el) el.textContent = text || ' ';
	},

	appendMsg: function(role, text) {
		var box = document.getElementById('ai-chat');
		if (!box) return null;
		var wrap = E('div', { 'class': 'ai-msg ' + (role === 'user' ? 'me' : '') }, [
			E('div', { 'class': 'ai-av' }, [role === 'user' ? '你' : 'AI']),
			E('div', {}, [E('div', { 'class': 'ai-bubble' }, [text])])
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
	},

	setBubble: function(pending, text) {
		if (pending) {
			var b = pending.querySelector ? pending.querySelector('.ai-bubble') : null;
			if (b) { b.textContent = text; return; }
		}
		this.appendMsg('ai', text);
	},

	send: function() {
		var self = this;
		var input = document.getElementById('ai-input');
		if (!input || this.busy) return;
		var text = (input.value || '').trim();
		if (!text) return;
		input.value = '';
		input.style.height = 'auto';
		this.appendMsg('user', text);
		this.history.push({ role: 'user', content: text });
		this.busy = true;
		var btn = document.getElementById('ai-send');
		if (btn) btn.disabled = true;
		this.status('思考中…');
		var pending = this.appendMsg('ai', '…');

		fetch('/cgi-bin/aichat?action=chat', {
			method: 'POST', headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ messages: this.history.slice(-20) })
		}).then(function(r) { return r.json(); }).then(function(j) {
			self.busy = false;
			if (btn) btn.disabled = false;
			self.status('');
			if (j && j.code === 0) {
				self.setBubble(pending, j.reply);
				if (j.tools) self.appendTools(j.tools);
				self.history.push({ role: 'assistant', content: j.reply });
			} else {
				self.setBubble(pending, '请求失败：' + ((j && j.error) || '未知错误'));
			}
		}).catch(function(e) {
			self.busy = false;
			if (btn) btn.disabled = false;
			self.status('');
			self.setBubble(pending, '请求失败：' + (e && e.message ? e.message : e));
		});
	},

	appendTools: function(tools) {
		var box = document.getElementById('ai-chat');
		if (!box) return;
		box.appendChild(E('div', { 'class': 'ai-msg' }, [
			E('div', { 'class': 'ai-av' }, ['AI']),
			E('div', {}, [E('div', { 'class': 'ai-tools' }, ['调用工具：' + tools])])
		]));
		box.scrollTop = box.scrollHeight;
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
