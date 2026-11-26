'use strict';
'require view';
'require poll';

var GACSS = [
	'.ga-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:12px}',
	'.ga-card{padding:14px 16px}',
	'.ga-label{font-size:10.5px;letter-spacing:.14em;text-transform:uppercase;opacity:.6;font-weight:600}',
	'.ga-big{font-size:22px;font-weight:700;margin-top:4px}',
	'.ga-note{font-size:11.5px;opacity:.6;margin-top:2px;line-height:1.45}',
	'.ga-seg{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}',
	'.ga-btn{font:inherit;font-size:12.5px;padding:8px 18px;border-radius:2px;cursor:pointer;border:1px solid #cccccc;background:#ffffff;color:#111111}',
	'.ga-btn:hover{background:#f0f0f0}',
	'.ga-btn.on{background:#111111;border-color:#111111;color:#fafafa}',
	'.ga-row{display:flex;align-items:center;gap:10px;margin-bottom:8px;font-size:13px}',
	'.ga-row .nm{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
	'.ga-row .vl{opacity:.65;font-size:12px}',
	'.ga-mini{font:inherit;font-size:11.5px;padding:3px 10px;border-radius:2px;cursor:pointer;border:1px solid #cccccc;background:#fff;color:#111}',
	'.ga-mini:hover{background:#f0f0f0}',
	'.ga-form{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-top:10px}',
	'.ga-form input,.ga-form select{font:inherit;font-size:12.5px;padding:7px 10px;border:1px solid #cccccc;border-radius:2px;background:#fff;color:#111;min-width:90px}',
	'.ga-form input:focus,.ga-form select:focus{outline:none;border-color:#111}',
	'.ga-ok{color:#0a7a3d}.ga-warn{color:#8a6a00}.ga-bad{color:#a3121c}'
].join('\n');

return view.extend({
	load: function() {
		return fetch('/cgi-bin/gameaccel?action=status', { cache: 'no-store' })
			.then(function(r) { return r.json(); })
			.catch(function() { return null; });
	},

	api: function(action, body) {
		var self = this;
		return fetch('/cgi-bin/gameaccel?action=' + action, {
			method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body || {})
		}).then(function(r) { return r.json(); }).then(function(j) {
			if (j && j.code === 0) { self.st = j; self.fillForm(); self.paint(); return j; }
			alert((j && j.error) || '操作失败');
			return j;
		}).catch(function(e) { alert('请求失败: ' + e.message); });
	},

	renderInner: function(st) {
		var self = this;
		this.st = st || {};

		this.fDown = E('input', { 'type': 'text', 'placeholder': '下行 kbps，如 500000' });
		this.fUp = E('input', { 'type': 'text', 'placeholder': '上行 kbps，如 50000' });
		this.selLease = E('select', {});
		this.fProto = E('select', {}, [
			E('option', { 'value': 'udp' }, ['UDP']),
			E('option', { 'value': 'tcp' }, ['TCP']),
			E('option', { 'value': 'tcpudp' }, ['TCP+UDP'])
		]);
		this.fExt = E('input', { 'type': 'text', 'placeholder': '外部端口' });
		this.fInt = E('input', { 'type': 'text', 'placeholder': '内部端口(可空)' });
		this.fIP = E('input', { 'type': 'text', 'placeholder': '内网 IP，如 192.168.88.150' });

		var modeCard = E('div', { 'class': 'cbi-section ga-card' }, [
			E('div', { 'class': 'ga-label' }, ['当前模式']),
			E('div', { 'class': 'ga-big', 'id': 'ga-mode' }, ['--']),
			E('div', { 'class': 'ga-note', 'id': 'ga-modenote' }, [' ']),
			E('div', { 'class': 'ga-seg' }, [
				E('button', { 'class': 'ga-btn', 'id': 'ga-speed', click: function() { self.api('mode', { mode: 'speed' }); } }, ['高速模式（硬件加速）']),
				E('button', { 'class': 'ga-btn', 'id': 'ga-low', click: function() { self.api('mode', { mode: 'lowlatency', download: (self.fDown.value || '').trim(), upload: (self.fUp.value || '').trim() }); } }, ['低延迟模式（SQM）'])
			])
		]);

		var statCard = E('div', { 'class': 'cbi-section ga-card' }, [
			E('div', { 'class': 'ga-label' }, ['加速状态']),
			E('div', { 'id': 'ga-stat', 'style': 'margin-top:8px;font-size:13px;line-height:1.8' }, [' '])
		]);

		var bwCard = E('div', { 'class': 'cbi-section ga-card' }, [
			E('div', { 'class': 'ga-label' }, ['SQM 带宽（低延迟模式生效）']),
			E('div', { 'class': 'ga-form' }, [
				this.fDown, this.fUp,
				E('button', { 'class': 'ga-btn', click: function() { self.api('bw', { download: (self.fDown.value || '').trim(), upload: (self.fUp.value || '').trim() }); } }, ['保存带宽'])
			]),
			E('div', { 'class': 'ga-note', 'style': 'margin-top:8px' }, ['单位 kbps。例：500M 下行 = 500000，50M 上行 = 50000。设准了才不会误限速。'])
		]);

		this.elDevs = E('div', { 'id': 'ga-devs', 'style': 'margin-top:8px' }, [' ']);
		var devCard = E('div', { 'class': 'cbi-section ga-card', 'style': 'margin-bottom:12px' }, [
			E('div', { 'class': 'ga-label' }, ['游戏设备优先（DSCP EF 标记）']),
			this.elDevs,
			E('div', { 'class': 'ga-form' }, [
				this.selLease,
				E('button', { 'class': 'ga-btn', click: function() { self.addDevice(); } }, ['添加设备'])
			]),
			E('div', { 'class': 'ga-note', 'style': 'margin-top:8px' }, ['加入后该设备的上行流量会被打上高优先级标记（配合低延迟模式效果更好）。'])
		]);

		this.elPorts = E('div', { 'id': 'ga-ports', 'style': 'margin-top:8px' }, [' ']);
		var portCard = E('div', { 'class': 'cbi-section ga-card' }, [
			E('div', { 'class': 'ga-label' }, ['游戏端口映射（改善 NAT 类型）']),
			this.elPorts,
			E('div', { 'class': 'ga-form' }, [
				this.fProto, this.fExt, this.fInt, this.fIP,
				E('button', { 'class': 'ga-btn', click: function() { self.addPort(); } }, ['添加映射'])
			]),
			E('div', { 'class': 'ga-note', 'style': 'margin-top:8px' }, ['把游戏的 UDP/TCP 端口映射到内网设备，可改善部分游戏的 NAT 类型。说明：当前内核没有 fullcone NAT 模块，无法实现「全锥形 NAT」。'])
		]);

		var root = E('div', {}, [
			E('style', {}, [GACSS]),
			E('h2', {}, ['游戏加速']),
			E('div', { 'class': 'ga-grid' }, [modeCard, statCard, bwCard]),
			devCard,
			portCard
		]);

		setTimeout(function() { self.fillForm(); self.paint(); }, 60);
		poll.add(function() {
			return fetch('/cgi-bin/gameaccel?action=status', { cache: 'no-store' })
				.then(function(r) { return r.json(); })
				.then(function(j) { if (j && j.code === 0) { self.st = j; self.paint(); } });
		}, 10);
		return root;
	},

	fillForm: function() {
		if (this.fDown && !this.fDown.value) this.fDown.value = String((this.st.sqm && this.st.sqm.download) || '');
		if (this.fUp && !this.fUp.value) this.fUp.value = String((this.st.sqm && this.st.sqm.upload) || '');
	},

	addDevice: function() {
		var ip = this.selLease ? this.selLease.value : '';
		if (!ip) { alert('请选择设备'); return; }
		var name = '';
		(this.st.leases || []).forEach(function(l) { if (l.ip === ip) name = l.name || ''; });
		this.api('dev_add', { ip: ip, name: name });
	},

	addPort: function() {
		var ip = (this.fIP.value || '').trim();
		var ext = (this.fExt.value || '').trim();
		if (!ip || !ext) { alert('请填外部端口和内网 IP'); return; }
		this.api('port_add', { proto: this.fProto.value, ext: ext, int: (this.fInt.value || '').trim(), ip: ip });
	},

	paint: function() {
		var self = this;
		var st = this.st || {};
		if (!document.getElementById('ga-mode')) return;

		var low = (st.mode === 'lowlatency');
		var modeEl = document.getElementById('ga-mode');
		modeEl.textContent = low ? '低延迟模式（SQM + DSCP）' : '高速模式（HNAT 硬件加速）';
		modeEl.className = 'ga-big ' + (low ? 'ga-warn' : 'ga-ok');
		document.getElementById('ga-modenote').textContent = low
			? 'SQM cake 整形 + DSCP 分级，网络满载时游戏不跳 ping；吞吐略降。'
			: 'MTK 硬件流量加速（PPE），延迟低、CPU 占用低；无 QoS 整形。';
		document.getElementById('ga-speed').className = 'ga-btn' + (low ? '' : ' on');
		document.getElementById('ga-low').className = 'ga-btn' + (low ? ' on' : '');

		var stat = [];
		stat.push('PPE 硬件加速条目：<b>' + (st.ppe || 0) + '</b>');
		stat.push('流量 offload：' + (st.firewall && st.firewall.flow ? '软件开' : '软件关') + ' / ' + (st.firewall && st.firewall.flow_hw ? '硬件开' : '硬件关'));
		stat.push('SQM：' + (st.sqm && st.sqm.enabled ? ('已启用（' + (st.sqm.download || 0) + ' / ' + (st.sqm.upload || 0) + ' kbps，' + (st.sqm.script || '') + '）') : '未启用'));
		document.getElementById('ga-stat').innerHTML = stat.join('<br>');

		var dl = document.getElementById('ga-devs');
		dl.innerHTML = '';
		var devs = st.devices || [];
		if (!devs.length) dl.appendChild(E('div', { 'class': 'ga-note' }, ['还没有添加游戏设备']));
		devs.forEach(function(d) {
			dl.appendChild(E('div', { 'class': 'ga-row' }, [
				E('span', { 'class': 'nm' }, [(d.name || '设备') + '  ' + d.ip]),
				E('span', { 'class': 'vl' }, ['DSCP EF']),
				E('button', { 'class': 'ga-mini', click: function() { self.api('dev_del', { ip: d.ip }); } }, ['删除'])
			]));
		});

		var pl = document.getElementById('ga-ports');
		pl.innerHTML = '';
		var ports = st.ports || [];
		if (!ports.length) pl.appendChild(E('div', { 'class': 'ga-note' }, ['还没有端口映射']));
		ports.forEach(function(p) {
			pl.appendChild(E('div', { 'class': 'ga-row' }, [
				E('span', { 'class': 'nm' }, [(p.proto || '') + '  ' + (p.ext || '') + ' → ' + (p.ip || '') + ':' + (p.int || '')]),
				E('button', { 'class': 'ga-mini', click: function() { self.api('port_del', { name: p.name }); } }, ['删除'])
			]));
		});

		var sel = this.selLease;
		if (sel) {
			var cur = sel.value;
			sel.innerHTML = '';
			(st.leases || []).forEach(function(l) {
				sel.appendChild(E('option', { 'value': l.ip }, [(l.name || l.mac) + '  ' + l.ip]));
			});
			if (cur) sel.value = cur;
		}
	},

	render: function(data) {
		try { return this.renderInner(data); }
		catch (e) { return E('div', {}, [E('h2', {}, ['游戏加速']), E('p', {}, ['加载失败: ' + (e && e.message ? e.message : e)])]); }
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
