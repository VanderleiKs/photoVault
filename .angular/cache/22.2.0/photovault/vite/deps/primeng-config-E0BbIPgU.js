import { n as _defineProperty, t as _objectSpread2 } from "./objectSpread2-weooBxVk.js";
import { Di as provideAppInitializer, Dl as signal, Fn as Injectable, Gl as Subject, Hc as PLATFORM_ID, Ml as ɵɵdefineInjectable, Wi as setClassMetadata, jc as InjectionToken, jo as ɵɵgetInheritedFactory, ol as effect, pl as inject, qt as untracked, yc as DOCUMENT, yl as makeEnvironmentProviders } from "./core-C91JEChX.js";
import "./common-C2OsAfsp.js";
import { _ as s$1, c as ae$1, g as p$1, i as H$1, m as l$1, n as B$1, o as N$2, p as fe$1, s as Z$1, u as c$1, v as x$1 } from "./dist-DWYgOqP_.js";
import { FilterMatchMode } from "./primeng_api.js";
//#region node_modules/@primeuix/utils/dist/dom/index.mjs
function I$1(t, e) {
	return t ? t.classList ? t.classList.contains(e) : new RegExp("(^| )" + e + "( |$)", "gi").test(t.className) : !1;
}
function R$2(t, e) {
	if (t && e) {
		let o = (n) => {
			I$1(t, n) || (t.classList ? t.classList.add(n) : t.className += " " + n);
		};
		[e].flat().filter(Boolean).forEach((n) => n.split(" ").forEach(o));
	}
}
function W$1(t, e) {
	if (t && e) {
		let o = (n) => {
			t.classList ? t.classList.remove(n) : t.className = t.className.replace(new RegExp("(^|\\b)" + n.split(" ").join("|") + "(\\b|$)", "gi"), " ");
		};
		[e].flat().filter(Boolean).forEach((n) => n.split(" ").forEach(o));
	}
}
function w$1(t) {
	if (typeof document == "undefined") return null;
	for (let e of Array.from(document.styleSheets || [])) try {
		for (let o of Array.from(e.cssRules || [])) {
			let n = o.style;
			if (n) {
				for (let r of Array.from(n)) if (t.lastIndex = 0, t.test(r)) return {
					name: r,
					value: n.getPropertyValue(r).trim()
				};
			}
		}
	} catch (o) {
		continue;
	}
	return null;
}
function E$1(t) {
	return t ? Math.abs(t.scrollLeft) : 0;
}
var ge$2 = /expression\s*\(|url\s*\(\s*['"]?\s*(?:javascript|vbscript):|@import\s+['"]?\s*(?:javascript|vbscript|data):/i;
var xt$1 = /url\s*\(\s*['"]?\s*(data:[^'")]*)/gi;
var he$2 = /* @__PURE__ */ new Set([
	"href",
	"src",
	"xlink:href",
	"action",
	"formaction"
]);
var ye$2 = /* @__PURE__ */ new Set([
	"http",
	"https",
	"mailto",
	"tel",
	"sms",
	"ftp",
	"ftps",
	"blob"
]);
var wt = /^data:image\/(?:png|gif|jpeg|jpg|webp|bmp|avif);base64,[a-z0-9+/=\s]+$/i;
function _$1(t) {
	if (typeof t != "string") return !1;
	if (ge$2.test(t)) return !0;
	xt$1.lastIndex = 0;
	let e;
	for (; e = xt$1.exec(t);) if (!wt.test(e[1].trim())) return !0;
	return !1;
}
function be(t) {
	let e = "";
	for (let o of t) {
		let n = o.charCodeAt(0);
		n <= 31 || n === 127 || /\s/.test(o) || (e += o);
	}
	return e;
}
function xe(t, e) {
	var i, s;
	let o = be(t), n = e.toLowerCase();
	if (o.startsWith("#") || o.startsWith("/") || o.startsWith("./") || o.startsWith("../") || o.startsWith("?")) return !0;
	let r = (s = (i = o.match(/^([a-z][a-z0-9+.-]*):/i)) == null ? void 0 : i[1]) == null ? void 0 : s.toLowerCase();
	return r ? r === "data" ? (n === "src" || n === "xlink:href") && wt.test(t.trim()) : ye$2.has(r) : !0;
}
function P$2(t, e) {
	return typeof e == "string" && he$2.has(t.toLowerCase()) && !xe(e, t);
}
function O$1(t, e) {
	return t.toLowerCase() === "srcdoc" && typeof e == "string" && /<\s*script\b|on\w+\s*=|javascript:|data:text\/html/i.test(e);
}
function Ee(t) {
	return t.startsWith("--") ? t : t.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
}
function X$1(t, e, o = {}) {
	o.clear && (t.style.cssText = ""), e.forEach((n) => {
		let r = n.indexOf(":");
		if (r < 0) return;
		let i = n.slice(0, r).trim(), s = n.slice(r + 1).trim();
		if (!i || _$1(s)) return;
		let l = "";
		/!\s*important$/i.test(s) && (s = s.replace(/!\s*important$/i, "").trim(), l = "important"), t.style.setProperty(i, s, l);
	});
}
function Se$1(t, e) {
	let o = 0;
	for (; e - 1 - o >= 0 && t[e - 1 - o] === "\\";) o++;
	return o % 2 === 1;
}
function ve(t) {
	let e = [], o = 0, n = "", r = 0;
	for (let i = 0; i < t.length; i++) {
		let s = t[i];
		n ? s === n && !Se$1(t, i) && (n = "") : s === "'" || s === "\"" ? n = s : s === "(" ? r++ : s === ")" ? r = Math.max(0, r - 1) : s === ";" && r === 0 && (e.push(t.slice(o, i)), o = i + 1);
	}
	return e.push(t.slice(o)), e;
}
function S$2(t, e, o = {}) {
	if (typeof e == "string") {
		X$1(t, ve(e), o);
		return;
	}
	o.clear && (t.style.cssText = ""), Object.entries(e).forEach(([n, r]) => {
		if (r == null || _$1(r)) return;
		let i = String(r), s = "";
		/!\s*important$/i.test(i) && (i = i.replace(/!\s*important$/i, "").trim(), s = "important"), t.style.setProperty(Ee(n), i, s);
	});
}
function L$2(t, e) {
	if (t instanceof HTMLElement) {
		let o = t.offsetWidth;
		if (e) {
			let n = getComputedStyle(t);
			o += parseFloat(n.marginLeft) + parseFloat(n.marginRight);
		}
		return o;
	}
	return 0;
}
function p(t) {
	return typeof Element != "undefined" ? t instanceof Element : t !== null && typeof t == "object" && t.nodeType === 1 && typeof t.nodeName == "string";
}
function A$1(t, e, o) {
	if (typeof o != "function" && !(typeof o == "object" && o !== null && "handleEvent" in o)) return;
	let n = t, r = n._pListeners || (n._pListeners = []), i = !1;
	for (let s = r.length - 1; s >= 0; s--) r[s][0] === e && (r[s][1] === o ? i = !0 : (t.removeEventListener(e, r[s][1]), r.splice(s, 1)));
	i || (t.addEventListener(e, o), r.push([e, o]));
}
function $$2(t, e = {}) {
	if (p(t)) {
		let o = t == null ? void 0 : t.$attrs, n = (s, l) => {
			let d = o != null && o[s] ? [o[s]] : [];
			return [l].flat().reduce((f, a) => {
				if (a != null) {
					let u = typeof a;
					if (u === "string" || u === "number") f.push(a);
					else if (u === "object") {
						let c = Array.isArray(a) ? n(s, a) : Object.entries(a).map(([m, v]) => s === "style" && (v || v === 0) ? `${m.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase()}:${v}` : v ? m : void 0);
						f = c.length ? f.concat(c.filter((m) => !!m)) : f;
					}
				}
				return f;
			}, d);
		}, r = (s) => {
			X$1(t, n("style", s));
		}, i = t;
		Object.entries(e).forEach(([s, l]) => {
			if (l != null) {
				let d = s.match(/^on(.+)/);
				if (d) A$1(t, d[1].toLowerCase(), l);
				else if (s === "p-bind" || s === "pBind") $$2(t, l);
				else if (s === "style") r(l), i.$attrs = i.$attrs || {}, i.$attrs[s] = t.style.cssText;
				else {
					if (P$2(s, l) || O$1(s, l)) return;
					l = s === "class" ? [...new Set(n("class", l))].join(" ").trim() : l, i.$attrs = i.$attrs || {}, i.$attrs[s] = l, t.setAttribute(s, l);
				}
			}
		});
	}
}
function Q$1(t) {
	return String(t).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function Ft(t) {
	if (t) {
		let e = t.offsetHeight, o = getComputedStyle(t);
		return e -= parseFloat(o.paddingTop) + parseFloat(o.paddingBottom) + parseFloat(o.borderTopWidth) + parseFloat(o.borderBottomWidth), e;
	}
	return 0;
}
function st(t) {
	if (t) {
		let e = t.getBoundingClientRect();
		return {
			top: e.top + (window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0),
			left: e.left + (window.pageXOffset || E$1(document.documentElement) || E$1(document.body) || 0)
		};
	}
	return {
		top: "auto",
		left: "auto"
	};
}
function k$1(t, e) {
	if (t) {
		let o = t.offsetHeight;
		if (e) {
			let n = getComputedStyle(t);
			o += parseFloat(n.marginTop) + parseFloat(n.marginBottom);
		}
		return o;
	}
	return 0;
}
function zt(t) {
	if (t) {
		let e = t.offsetWidth, o = getComputedStyle(t);
		return e -= parseFloat(o.paddingLeft) + parseFloat(o.paddingRight) + parseFloat(o.borderLeftWidth) + parseFloat(o.borderRightWidth), e;
	}
	return 0;
}
function le$1(t) {
	var e;
	t && ("remove" in Element.prototype ? t.remove() : (e = t.parentNode) == null || e.removeChild(t));
}
function ce$2(t, e = "", o) {
	if (p(t) && o !== null && o !== void 0) {
		let n = e.toLowerCase();
		if (/^on[a-z]/.test(n)) {
			A$1(t, n.slice(2), o);
			return;
		}
		if (n === "style") {
			typeof o == "string" ? S$2(t, o, { clear: !0 }) : typeof o == "object" && S$2(t, o);
			return;
		}
		if (P$2(e, o) || O$1(e, o)) return;
		t.setAttribute(e, o);
	}
}
//#endregion
//#region node_modules/@primeuix/utils/dist/eventbus/index.mjs
function v$1() {
	let s = /* @__PURE__ */ new Map(), r = {
		on(n, t) {
			let e = s.get(n);
			return e ? e.push(t) : e = [t], s.set(n, e), r;
		},
		off(n, t) {
			let e = s.get(n);
			if (e) {
				let o = e.indexOf(t);
				o !== -1 && e.splice(o, 1);
			}
			return r;
		},
		emit(n, ...t) {
			let e = s.get(n);
			e && e.forEach((o) => {
				o(t[0]);
			});
		},
		clear() {
			s.clear();
		}
	};
	return r;
}
//#endregion
//#region node_modules/@primeuix/styled/dist/index.mjs
var nt = Object.defineProperty;
var ot = Object.defineProperties;
var it = Object.getOwnPropertyDescriptors;
var te$1 = Object.getOwnPropertySymbols;
var Se = Object.prototype.hasOwnProperty;
var Oe = Object.prototype.propertyIsEnumerable;
var ye$1 = (e, t, s) => t in e ? nt(e, t, {
	enumerable: !0,
	configurable: !0,
	writable: !0,
	value: s
}) : e[t] = s;
var y$1 = (e, t) => {
	for (var s in t || (t = {})) Se.call(t, s) && ye$1(e, s, t[s]);
	if (te$1) for (var s of te$1(t)) Oe.call(t, s) && ye$1(e, s, t[s]);
	return e;
};
var C$1 = (e, t) => ot(e, it(t));
var V$1 = (e, t) => {
	var s = {};
	for (var r in e) Se.call(e, r) && t.indexOf(r) < 0 && (s[r] = e[r]);
	if (e != null && te$1) for (var r of te$1(e)) t.indexOf(r) < 0 && Oe.call(e, r) && (s[r] = e[r]);
	return s;
};
var R$1 = v$1();
var P$1 = /{([^}]*)}/g;
var re$1 = /(\d+\s+[+*/-]\s+\d+)/g;
var ne$1 = /var\([^)]+\)/g;
function K$1(e) {
	return c$1(e) ? e.replace(/[A-Z]/g, (t, s) => s === 0 ? t : "." + t.toLowerCase()).toLowerCase() : e;
}
function Pe(e) {
	return s$1(e) && Object.prototype.hasOwnProperty.call(e, "$value") && Object.prototype.hasOwnProperty.call(e, "$type") ? e.$value : e;
}
function pt(e) {
	return e.replaceAll(/ /g, "").replace(/[^\w]/g, "-");
}
function oe$1(e = "", t = "") {
	return pt(`${c$1(e, !1) && c$1(t, !1) ? `${e}-` : e}${t}`);
}
function ce$1(e = "", t = "") {
	return `--${oe$1(e, t)}`;
}
function gt(e = "") {
	return ((e.match(/{/g) || []).length + (e.match(/}/g) || []).length) % 2 !== 0;
}
function L$1(e, t = "", s = "", r = [], o) {
	if (c$1(e)) {
		let i = e.trim();
		if (gt(i)) return;
		if (H$1(i, P$1)) {
			let n = i.replaceAll(P$1, (u) => {
				let a = u.replace(/{|}/g, "").split(".").filter((l) => !r.some((c) => H$1(l, c)));
				return `var(${ce$1(s, fe$1(a.join("-")))}${l$1(o) ? `, ${o}` : ""})`;
			});
			return H$1(n.replace(ne$1, "0"), re$1) ? `calc(${n})` : n;
		}
		return i;
	} else if (Z$1(e)) return e;
}
function $e(e, t, s) {
	c$1(t, !1) && e.push(`${t}:${s};`);
}
function j$1(e, t) {
	return e ? `${e}{${t}}` : "";
}
function ue$1(e, t) {
	if (e.indexOf("dt(") === -1) return e;
	function s(n, u) {
		let m = [], a = 0, l = "", c = null, p = 0;
		for (; a <= n.length;) {
			let g = n[a];
			if ((g === "\"" || g === "'" || g === "`") && n[a - 1] !== "\\" && (c = c === g ? null : g), !c && (g === "(" && p++, g === ")" && p--, (g === "," || a === n.length) && p === 0)) {
				let f = l.trim();
				f.startsWith("dt(") ? m.push(ue$1(f, u)) : m.push(r(f)), l = "", a++;
				continue;
			}
			g !== void 0 && (l += g), a++;
		}
		return m;
	}
	function r(n) {
		let u = n[0];
		if ((u === "\"" || u === "'" || u === "`") && n[n.length - 1] === u) return n.slice(1, -1);
		let m = Number(n);
		return isNaN(m) ? n : m;
	}
	let o = [], i = [];
	for (let n = 0; n < e.length; n++) if (e[n] === "d" && e.slice(n, n + 3) === "dt(") i.push(n), n += 2;
	else if (e[n] === ")" && i.length > 0) {
		let u = i.pop();
		i.length === 0 && o.push([u, n]);
	}
	if (!o.length) return e;
	for (let n = o.length - 1; n >= 0; n--) {
		let [u, m] = o[n], c = t(...s(e.slice(u + 3, m), t));
		e = e.slice(0, u) + c + e.slice(m + 1);
	}
	return e;
}
var St = (e, t) => {
	let s = e.split("."), r = "";
	for (let o = 0; o < s.length; o++) {
		let i = K$1(s[o]);
		t.lastIndex = 0, !t.test(i) && (r = r ? `${r}.${i}` : i);
	}
	return r;
};
var he$1 = (e, t, s, r, o) => {
	if (typeof e != "string") return e != null ? e : S$1.getTokenValue(t);
	if (P$1.lastIndex = 0, !P$1.test(e)) return e;
	let i = t.slice(0, t.indexOf("."));
	return L$1(e.replace(P$1, (u) => {
		let m = u.slice(1, -1), a = m.indexOf(".");
		if ((a === -1 ? m : m.slice(0, a)) !== i) return u;
		let l = S$1.getTokenValue(m);
		return l == null ? u : `${l}`;
	}), void 0, s, [r], o);
};
var Ot = (e, t, s, r) => {
	var l, c, p, g;
	let o = St(e, s), i = S$1.tokens, n = i.__strictCache;
	n || (n = /* @__PURE__ */ new Map(), Object.defineProperty(i, "__strictCache", {
		value: n,
		enumerable: !1,
		configurable: !0
	}));
	let u = r == null || typeof r != "object", m = u && r != null ? `${t}|${o}|${r}` : `${t}|${o}`, a = u ? n.get(m) : void 0;
	if (a === void 0 && (!u || !n.has(m))) {
		let f = (l = i[o]) == null ? void 0 : l.paths, h = f == null ? void 0 : f.find((k) => k.scheme === "none"), d = (c = f == null ? void 0 : f.find((k) => k.scheme === "light")) != null ? c : h, T = (p = f == null ? void 0 : f.find((k) => k.scheme === "dark")) != null ? p : h;
		if (d && T && d !== T) {
			let k = he$1(d.value, o, t, s, r), b = he$1(T.value, o, t, s, r);
			a = k === b ? k : `light-dark(${k},${b})`;
		} else a = he$1((g = d != null ? d : T) == null ? void 0 : g.value, o, t, s, r);
		u && n.set(m, a);
	}
	return S$1.hasScopedTokenPath(o) ? L$1(`{${o}}`, void 0, t, [s], a) : a;
};
var N$1 = (e, t, s) => pe$1(S$1.getTheme(), e, t, s);
var pe$1 = (e = {}, t, s, r) => {
	var m, a, l, c, p, g, f, h, d, T;
	if (!t) return "";
	let o = (m = S$1.defaults) == null ? void 0 : m.variable, i = (p = (a = e == null ? void 0 : e.options) == null ? void 0 : a.prefix) != null ? p : (c = (l = S$1.defaults) == null ? void 0 : l.options) == null ? void 0 : c.prefix, n = (T = (d = (g = e == null ? void 0 : e.options) == null ? void 0 : g.cssVariables) != null ? d : (h = (f = S$1.defaults) == null ? void 0 : f.options) == null ? void 0 : h.cssVariables) != null ? T : !0;
	if (r === "value") return S$1.getTokenValue(t);
	if (p$1(r) && !n) return Ot(t, i, o.excludedKeyRegex, s);
	return L$1(H$1(t, P$1) ? t : `{${t}}`, void 0, i, [o.excludedKeyRegex], s);
};
var xt = (...e) => {
	var t;
	return `${(t = N$1(...e)) != null ? t : ""}`;
};
function gs(e, ...t) {
	if (e instanceof Array) return ue$1(e.reduce((r, o, i) => {
		var n;
		return r + o + ((n = x$1(t[i], { dt: N$1 })) != null ? n : "");
	}, ""), xt);
	return x$1(e, { dt: N$1 });
}
function ge$1(e, t = {}) {
	let s = S$1.defaults.variable, { prefix: r = s.prefix, selector: o = s.selector, excludedKeyRegex: i = s.excludedKeyRegex } = t, n = [], u = [], m = [{
		node: e,
		path: r
	}];
	for (; m.length;) {
		let { node: l, path: c } = m.pop();
		for (let p in l) {
			let g = l[p], f = Pe(g), d = H$1(p, i) ? oe$1(c) : oe$1(c, fe$1(p));
			if (s$1(f)) m.push({
				node: f,
				path: d
			});
			else {
				let T = ce$1(d), k = L$1(f, d, r, [i]);
				$e(u, T, k == null ? k : `${k}`);
				let b = d;
				r && b.startsWith(r + "-") && (b = b.slice(r.length + 1)), n.push(b.replace(/-/g, "."));
			}
		}
	}
	let a = u.join("");
	return {
		value: u,
		tokens: n,
		declarations: a,
		css: j$1(o, a)
	};
}
var $$1 = {
	regex: {
		rules: {
			class: {
				pattern: /^\.([a-zA-Z][\w-]*)$/,
				resolve(e) {
					return {
						type: "class",
						selector: e,
						matched: this.pattern.test(e.trim())
					};
				}
			},
			attr: {
				pattern: /^\[(.*)\]$/,
				resolve(e) {
					return {
						type: "attr",
						selector: `:root${e},:host${e}`,
						matched: this.pattern.test(e.trim())
					};
				}
			},
			media: {
				pattern: /^@media (.*)$/,
				resolve(e) {
					return {
						type: "media",
						selector: e,
						matched: this.pattern.test(e.trim())
					};
				}
			},
			system: {
				pattern: /^system$/,
				resolve(e) {
					return {
						type: "system",
						selector: "@media (prefers-color-scheme: dark)",
						matched: this.pattern.test(e.trim())
					};
				}
			},
			custom: { resolve(e) {
				return {
					type: "custom",
					selector: e,
					matched: !0
				};
			} }
		},
		resolve(e) {
			let t = Object.keys(this.rules).filter((s) => s !== "custom").map((s) => this.rules[s]);
			return [e].flat().map((s) => {
				var r;
				return (r = t.map((o) => o.resolve(s)).find((o) => o.matched)) != null ? r : this.rules.custom.resolve(s);
			});
		}
	},
	_toVariables(e, t) {
		return ge$1(e, { prefix: t == null ? void 0 : t.prefix });
	},
	getCommon({ name: e = "", theme: t = {}, params: s, set: r, defaults: o }) {
		var k, b, O, v, E, _, w;
		let { preset: i, options: n } = t, u, m, a, l, c, p, g;
		if (l$1(i)) {
			let { primitive: z, semantic: G, extend: I } = i, f = G || {}, { colorScheme: ae } = f, U = V$1(f, ["colorScheme"]), h = I || {}, { colorScheme: H } = h, M = V$1(h, ["colorScheme"]), d = ae || {}, { dark: B } = d, W = V$1(d, ["dark"]), T = H || {}, { dark: q } = T, F = V$1(T, ["dark"]), Z = l$1(z) ? this._toVariables({ primitive: z }, n) : {}, J = l$1(U) ? this._toVariables({ semantic: U }, n) : {}, Q = l$1(W) ? this._toVariables({ light: W }, n) : {}, Y = l$1(B) ? this._toVariables({ dark: B }, n) : {}, ee = l$1(M) ? this._toVariables({ semantic: M }, n) : {}, Te = l$1(F) ? this._toVariables({ light: F }, n) : {}, be = l$1(q) ? this._toVariables({ dark: q }, n) : {}, [Ke, Xe] = [(k = Z.declarations) != null ? k : "", Z.tokens], [ze, Ge] = [(b = J.declarations) != null ? b : "", J.tokens || []], [Ie, Ue] = [(O = Q.declarations) != null ? O : "", Q.tokens || []], [He, We] = [(v = Y.declarations) != null ? v : "", Y.tokens || []], [qe, Fe] = [(E = ee.declarations) != null ? E : "", ee.tokens || []], [Ze, Je] = [(_ = Te.declarations) != null ? _ : "", Te.tokens || []], [Qe, Ye] = [(w = be.declarations) != null ? w : "", be.tokens || []];
			u = this.transformCSS(e, Ke, "light", "variable", n, r, o), m = Xe;
			a = `${this.transformCSS(e, `${ze}${Ie}`, "light", "variable", n, r, o)}${this.transformCSS(e, `${He}`, "dark", "variable", n, r, o)}`, l = [.../* @__PURE__ */ new Set([
				...Ge,
				...Ue,
				...We
			])];
			c = `${this.transformCSS(e, `${qe}${Ze}color-scheme:light`, "light", "variable", n, r, o)}${this.transformCSS(e, `${Qe}color-scheme:dark`, "dark", "variable", n, r, o)}`, p = [.../* @__PURE__ */ new Set([
				...Fe,
				...Je,
				...Ye
			])], g = x$1(i.css, { dt: N$1 });
		}
		return {
			primitive: {
				css: u,
				tokens: m
			},
			semantic: {
				css: a,
				tokens: l
			},
			global: {
				css: c,
				tokens: p
			},
			style: g
		};
	},
	getPreset({ name: e = "", preset: t = {}, options: s, params: r, set: o, defaults: i, selector: n, isScopedTokenPaths: u }) {
		var c, d, T, k;
		let m, a, l;
		if (l$1(t) && ((c = s == null ? void 0 : s.cssVariables) == null || c || u)) {
			let b = e.replace("-directive", ""), p = t, { colorScheme: O, extend: v, css: E } = p, _ = V$1(p, [
				"colorScheme",
				"extend",
				"css"
			]), g = v || {}, { colorScheme: w } = g, z = V$1(g, ["colorScheme"]), f = O || {}, { dark: G } = f, I = V$1(f, ["dark"]), h = w || {}, { dark: ae } = h, U = V$1(h, ["dark"]), H = l$1(_) ? this._toVariables({ [b]: y$1(y$1({}, _), z) }, s) : {}, M = l$1(I) ? this._toVariables({ [b]: y$1(y$1({}, I), U) }, s) : {}, B = l$1(G) ? this._toVariables({ [b]: y$1(y$1({}, G), ae) }, s) : {}, [W, q] = [(d = H.declarations) != null ? d : "", H.tokens || []], [F, Z] = [(T = M.declarations) != null ? T : "", M.tokens || []], [J, Q] = [(k = B.declarations) != null ? k : "", B.tokens || []];
			m = `${this.transformCSS(b, `${W}${F}`, "light", "variable", s, o, i, n)}${this.transformCSS(b, J, "dark", "variable", s, o, i, n)}`, a = [.../* @__PURE__ */ new Set([
				...q,
				...Z,
				...Q
			])], l = x$1(E, { dt: N$1 });
		}
		return {
			css: m,
			tokens: a,
			style: l
		};
	},
	getScopedSelector(e, t) {
		if (!(!(t != null && t.scoped) || !e)) return `[data-styled="${e}"]`;
	},
	getPresetC({ name: e = "", theme: t = {}, params: s, set: r, defaults: o }) {
		var a;
		let { preset: i, options: n } = t, u = (a = i == null ? void 0 : i.components) == null ? void 0 : a[e], m = this.getScopedSelector(e, n);
		return this.getPreset({
			name: e,
			preset: u,
			options: n,
			params: s,
			set: r,
			defaults: o,
			selector: m
		});
	},
	getPresetD({ name: e = "", theme: t = {}, params: s, set: r, defaults: o }) {
		var l, c;
		let i = e.replace("-directive", ""), { preset: n, options: u } = t, m = ((l = n == null ? void 0 : n.components) == null ? void 0 : l[i]) || ((c = n == null ? void 0 : n.directives) == null ? void 0 : c[i]), a = this.getScopedSelector(i, u);
		return this.getPreset({
			name: i,
			preset: m,
			options: u,
			params: s,
			set: r,
			defaults: o,
			selector: a
		});
	},
	applyDarkColorScheme(e) {
		let t = e.darkModeSelector;
		return !(t === "none" || t === !1);
	},
	getColorSchemeOption(e, t) {
		var s;
		return this.applyDarkColorScheme(e) ? this.regex.resolve(e.darkModeSelector === !0 ? t.options.darkModeSelector : (s = e.darkModeSelector) != null ? s : t.options.darkModeSelector) : [];
	},
	getLayerOrder(e, t = {}, s, r) {
		let { cssLayer: o } = t;
		return o ? `@layer ${x$1(o.order || o.name || "primeui", s)}` : "";
	},
	getCommonStyleSheet({ name: e = "", theme: t = {}, params: s, props: r = {}, set: o, defaults: i }) {
		let n = this.getCommon({
			name: e,
			theme: t,
			params: s,
			set: o,
			defaults: i
		}), u = Object.entries(r).reduce((m, [a, l]) => (m.push(`${a}="${Q$1(l)}"`), m), []).join(" ");
		return Object.entries(n || {}).reduce((m, [a, l]) => {
			if (s$1(l) && Object.hasOwn(l, "css")) {
				let c = B$1(l.css), p = `${a}-variables`;
				m.push(`<style type="text/css" data-primevue-style-id="${p}" ${u}>${c}</style>`);
			}
			return m;
		}, []).join("");
	},
	getStyleSheet({ name: e = "", theme: t = {}, params: s, props: r = {}, set: o, defaults: i }) {
		var a;
		let n = {
			name: e,
			theme: t,
			params: s,
			set: o,
			defaults: i
		}, u = (a = e.includes("-directive") ? this.getPresetD(n) : this.getPresetC(n)) == null ? void 0 : a.css, m = Object.entries(r).reduce((l, [c, p]) => (l.push(`${c}="${Q$1(p)}"`), l), []).join(" ");
		return u ? `<style type="text/css" data-primevue-style-id="${e}-variables" ${m}>${B$1(u)}</style>` : "";
	},
	createTokens(e = {}, t, s = "", r = "", o = {}) {
		let i = function(a, l, c, p) {
			return a.replace(P$1, (g) => {
				var T;
				let f = g.slice(1, -1), h = this.tokens[f];
				if (!h) return console.warn(`Token not found for path: ${f}`), "__UNRESOLVED__";
				let d = h.computed(l, c, p);
				if (Array.isArray(d) && d.length === 2) {
					let k = d[0].value, b = d[1].value;
					return k === b ? k != null ? k : "__UNRESOLVED__" : `light-dark(${k},${b})`;
				}
				return (T = d == null ? void 0 : d.value) != null ? T : "__UNRESOLVED__";
			});
		}, n = function(a, l, c, p) {
			if (a.indexOf("light-dark(") === -1) return a;
			let g = [], f = a.length, h = 0;
			for (; h < f;) {
				let d = a.indexOf("light-dark(", h);
				if (d === -1) {
					g.push(a.slice(h));
					break;
				}
				g.push(a.slice(h, d));
				let T = 1, k = d + 11, b = -1;
				for (; k < f && T > 0;) {
					let _ = a.charCodeAt(k);
					_ === 40 ? T++ : _ === 41 ? T-- : _ === 44 && T === 1 && b === -1 && (b = k), k++;
				}
				if (T !== 0 || b === -1) {
					g.push(a.slice(d));
					break;
				}
				let O = a.slice(d + 11, b).trim(), v = a.slice(b + 1, k - 1).trim(), E = l && l !== "none" ? l : null;
				if (E === "light") g.push(n.call(this, O, "light", c, p));
				else if (E === "dark") g.push(n.call(this, v, "dark", c, p));
				else {
					let _ = i.call(this, n.call(this, O, "light", c, p), "light", c, p), w = i.call(this, n.call(this, v, "dark", c, p), "dark", c, p);
					g.push(_ === w ? _ : `light-dark(${_},${w})`);
				}
				h = k;
			}
			return g.join("");
		}, u = function(a, l = {}, c = []) {
			if (c.includes(this.path)) return console.warn(`Circular reference detected at ${this.path}`), {
				colorScheme: a,
				path: this.path,
				paths: l,
				value: void 0
			};
			c.push(this.path), l.name = this.path, l.binding || (l.binding = {});
			let p = this.value;
			if (typeof this.value == "string") {
				let g = this.value.trim(), f = g.indexOf("light-dark(") !== -1, h = g.indexOf("{") !== -1;
				if (f || h) {
					let d = f ? n.call(this, g, a, l, c) : g, T = d.indexOf("{") !== -1 ? i.call(this, d, a, l, c) : d;
					re$1.lastIndex = 0, ne$1.lastIndex = 0, p = re$1.test(T.replace(ne$1, "0")) ? `calc(${T})` : T;
				}
			}
			return p$1(l.binding) && delete l.binding, c.pop(), {
				colorScheme: a,
				path: this.path,
				paths: l,
				value: typeof p == "string" && p.indexOf("__UNRESOLVED__") !== -1 ? void 0 : p
			};
		}, m = (a, l, c) => {
			Object.entries(a).forEach(([p, g]) => {
				let f = H$1(p, t.variable.excludedKeyRegex) ? l : l ? `${l}.${K$1(p)}` : K$1(p), h = c ? `${c}.${p}` : p;
				s$1(g) ? m(g, f, h) : (o[f] || (o[f] = {
					paths: [],
					computed: (d, T = {}, k = []) => {
						let b = o[f].paths;
						if (b.length === 1) {
							let O = b[0], v = O.scheme !== "none" ? O.scheme : d;
							return O.computed(v, T.binding, k);
						} else if (d && d !== "none") for (let O = 0; O < b.length; O++) {
							let v = b[O];
							if (v.scheme === d) return v.computed(d, T.binding, k);
						}
						return b.map((O) => O.computed(O.scheme, T[O.scheme], k));
					}
				}), o[f].paths.push({
					path: h,
					value: g,
					scheme: h.includes("colorScheme.light") ? "light" : h.includes("colorScheme.dark") ? "dark" : "none",
					computed: u,
					tokens: o
				}));
			});
		};
		return m(e, s, r), o;
	},
	getTokenValue(e, t, s) {
		var p, g, f;
		let r = e.__cache;
		r || (r = /* @__PURE__ */ new Map(), Object.defineProperty(e, "__cache", {
			value: r,
			enumerable: !1,
			configurable: !0
		}));
		let o = r.get(t);
		if (o !== void 0 || r.has(t)) return o;
		let i = s.variable.excludedKeyRegex, n = t.split("."), u = [];
		for (let h = 0; h < n.length; h++) {
			let d = n[h];
			i.lastIndex = 0, i.test(d.toLowerCase()) || u.push(d);
		}
		let m = u.join("."), a = t.indexOf("colorScheme.light") !== -1 ? "light" : t.indexOf("colorScheme.dark") !== -1 ? "dark" : void 0, l = e[m];
		if (!l) {
			r.set(t, void 0);
			return;
		}
		let c;
		if (a) {
			let h = l.computed(a);
			if (Array.isArray(h)) {
				for (let d = 0; d < h.length; d++) if (((p = h[d]) == null ? void 0 : p.colorScheme) === a) {
					c = h[d].value;
					break;
				}
			} else c = h == null ? void 0 : h.value;
		} else {
			let h = l.computed("light"), d = l.computed("dark"), T, k;
			if (Array.isArray(h)) {
				for (let b = 0; b < h.length; b++) if (((g = h[b]) == null ? void 0 : g.colorScheme) === "light") {
					T = h[b].value;
					break;
				}
			} else T = h == null ? void 0 : h.value;
			if (Array.isArray(d)) {
				for (let b = 0; b < d.length; b++) if (((f = d[b]) == null ? void 0 : f.colorScheme) === "dark") {
					k = d[b].value;
					break;
				}
			} else k = d == null ? void 0 : d.value;
			T === void 0 && k === void 0 ? c = void 0 : T === void 0 ? c = k : k === void 0 || T === k ? c = T : c = `light-dark(${T},${k})`;
		}
		return r.set(t, c), c;
	},
	getSelectorRule(e, t, s, r, o = ":root,:host") {
		return s === "class" || s === "attr" ? j$1(l$1(t) ? `${e}${t},${e} ${t}` : e, r) : j$1(e, j$1(t != null ? t : o, r));
	},
	transformCSS(e, t, s, r, o = {}, i, n, u) {
		var m, a;
		if (l$1(t)) {
			let { cssLayer: l } = o;
			if (r !== "style") {
				let c = this.getColorSchemeOption(o, n), p = (a = (m = n == null ? void 0 : n.variable) == null ? void 0 : m.selector) != null ? a : ":root,:host";
				t = s === "dark" ? c.reduce((g, { type: f, selector: h }) => (l$1(h) && (g += h.includes("[CSS]") ? h.replace("[CSS]", t) : this.getSelectorRule(h, u, f, t, p)), g), "") : j$1(u != null ? u : p, t);
			}
			if (l) {
				let c = {
					name: "primeui",
					order: "primeui"
				};
				s$1(l) && (c.name = x$1(l.name, {
					name: e,
					type: r
				})), l$1(c.name) && (t = j$1(`@layer ${c.name}`, t), i == null || i.layerNames(c.name));
			}
			return t;
		}
		return "";
	}
};
var S$1 = {
	defaults: {
		variable: {
			prefix: "p",
			selector: ":root,:host",
			excludedKeyRegex: /^(primitive|semantic|components|directives|variables|colorscheme|light|dark|common|root|states|extend|css)$/gi
		},
		options: {
			prefix: "p",
			darkModeSelector: "system",
			cssLayer: !1,
			cssVariables: !0,
			scoped: !1
		}
	},
	_theme: void 0,
	_layerNames: /* @__PURE__ */ new Set(),
	_loadedStyleNames: /* @__PURE__ */ new Set(),
	_loadingStyles: /* @__PURE__ */ new Set(),
	_tokens: {},
	_scopedTokenPaths: /* @__PURE__ */ new Set(),
	update(e = {}) {
		let { theme: t } = e;
		t && (this._theme = C$1(y$1({}, t), { options: y$1(y$1({}, this.defaults.options), t.options) }), this._tokens = $$1.createTokens(this.preset, this.defaults), this.resetCaches());
	},
	get theme() {
		return this._theme;
	},
	get preset() {
		var e;
		return ((e = this.theme) == null ? void 0 : e.preset) || {};
	},
	get options() {
		var e;
		return ((e = this.theme) == null ? void 0 : e.options) || {};
	},
	get tokens() {
		return this._tokens;
	},
	hasScopedTokenPath(e) {
		return this._scopedTokenPaths.has(e);
	},
	getScopedTokenPaths() {
		return [...this._scopedTokenPaths];
	},
	addScopedToken(e) {
		let t = !1;
		return e && Object.keys(e).length && N$2(e).forEach((s) => {
			let r = ae$1(s);
			this._scopedTokenPaths.has(r) || (this._scopedTokenPaths.add(r), t = !0);
		}), t;
	},
	clearScopedTokenPaths() {
		this._scopedTokenPaths.clear();
	},
	getTheme() {
		return this.theme;
	},
	setTheme(e) {
		this.update({ theme: e }), R$1.emit("theme:change", e);
	},
	getPreset() {
		return this.preset;
	},
	setPreset(e) {
		this._theme = C$1(y$1({}, this.theme), { preset: e }), this._tokens = $$1.createTokens(e, this.defaults), this.resetCaches(), R$1.emit("preset:change", e), R$1.emit("theme:change", this.theme);
	},
	getOptions() {
		return this.options;
	},
	setOptions(e) {
		this._theme = C$1(y$1({}, this.theme), { options: e }), this.resetStyleCaches(), R$1.emit("options:change", e), R$1.emit("theme:change", this.theme);
	},
	resetStyleCaches() {
		this.clearLoadedStyleNames(), this.clearLayerNames();
	},
	resetCaches() {
		this.resetStyleCaches(), this.clearScopedTokenPaths();
	},
	getLayerNames() {
		return [...this._layerNames];
	},
	setLayerNames(e) {
		this._layerNames.add(e);
	},
	clearLayerNames() {
		this._layerNames.clear();
	},
	getLoadedStyleNames() {
		return this._loadedStyleNames;
	},
	isStyleNameLoaded(e) {
		return this._loadedStyleNames.has(e);
	},
	setLoadedStyleName(e) {
		this._loadedStyleNames.add(e);
	},
	deleteLoadedStyleName(e) {
		this._loadedStyleNames.delete(e);
	},
	clearLoadedStyleNames() {
		this._loadedStyleNames.clear();
	},
	getTokenValue(e) {
		return $$1.getTokenValue(this.tokens, e, this.defaults);
	},
	getCommon(e = "", t) {
		return $$1.getCommon({
			name: e,
			theme: this.theme,
			params: t,
			defaults: this.defaults,
			set: { layerNames: this.setLayerNames.bind(this) }
		});
	},
	getComponent(e = "", t) {
		let s = {
			name: e,
			theme: this.theme,
			params: t,
			defaults: this.defaults,
			set: { layerNames: this.setLayerNames.bind(this) }
		};
		return $$1.getPresetC(s);
	},
	getDirective(e = "", t) {
		let s = {
			name: e,
			theme: this.theme,
			params: t,
			defaults: this.defaults,
			set: { layerNames: this.setLayerNames.bind(this) }
		};
		return $$1.getPresetD(s);
	},
	getCustomPreset(e = "", t, s, r) {
		let o = {
			name: e,
			preset: t,
			options: this.options,
			selector: s,
			params: r,
			defaults: this.defaults,
			set: { layerNames: this.setLayerNames.bind(this) },
			isScopedTokenPaths: !0
		};
		return $$1.getPreset(o);
	},
	getLayerOrderCSS(e = "") {
		return $$1.getLayerOrder(e, this.options, { names: this.getLayerNames() }, this.defaults);
	},
	transformCSS(e = "", t, s = "style", r) {
		return $$1.transformCSS(e, t, r, s, this.options, { layerNames: this.setLayerNames.bind(this) }, this.defaults);
	},
	getCommonStyleSheet(e = "", t, s = {}) {
		return $$1.getCommonStyleSheet({
			name: e,
			theme: this.theme,
			params: t,
			props: s,
			defaults: this.defaults,
			set: { layerNames: this.setLayerNames.bind(this) }
		});
	},
	getStyleSheet(e, t, s = {}) {
		return $$1.getStyleSheet({
			name: e,
			theme: this.theme,
			params: t,
			props: s,
			defaults: this.defaults,
			set: { layerNames: this.setLayerNames.bind(this) }
		});
	},
	onStyleMounted(e) {
		this._loadingStyles.add(e);
	},
	onStyleUpdated(e) {
		this._loadingStyles.add(e);
	},
	onStyleLoaded(e, { name: t }) {
		this._loadingStyles.size && (this._loadingStyles.delete(t), R$1.emit(`theme:${t}:load`, e), this._loadingStyles.size || R$1.emit("theme:load"));
	}
};
//#endregion
//#region node_modules/@primeuix/styles/dist/base/index.mjs
var style = "\n    *,\n    ::before,\n    ::after {\n        box-sizing: border-box;\n    }\n\n    .p-component {\n        font-family: dt('typography.font.family');\n        font-feature-settings: inherit;\n        line-height: dt('typography.line.height');\n    }\n\n    .p-collapsible-enter-active {\n        animation: p-animate-collapsible-expand 0.2s ease-out;\n        overflow: hidden;\n    }\n\n    .p-collapsible-leave-active {\n        animation: p-animate-collapsible-collapse 0.2s ease-out;\n        overflow: hidden;\n    }\n\n    @keyframes p-animate-collapsible-expand {\n        from {\n            grid-template-rows: 0fr;\n        }\n        to {\n            grid-template-rows: 1fr;\n        }\n    }\n\n    @keyframes p-animate-collapsible-collapse {\n        from {\n            grid-template-rows: 1fr;\n        }\n        to {\n            grid-template-rows: 0fr;\n        }\n    }\n\n    .p-disabled,\n    .p-disabled * {\n        cursor: default;\n        pointer-events: none;\n        user-select: none;\n    }\n\n    .p-disabled,\n    .p-component:disabled {\n        opacity: dt('disabled.opacity');\n    }\n\n    .pi {\n        font-size: dt('icon.size');\n    }\n\n    .p-icon {\n        width: var(--px-icon-size, dt('icon.size'));\n        height: var(--px-icon-size, dt('icon.size'));\n        flex-shrink: 0;\n    }\n\n    .p-icon-spin {\n        -webkit-animation: p-icon-spin 2s infinite linear;\n        animation: p-icon-spin 2s infinite linear;\n    }\n\n    @-webkit-keyframes p-icon-spin {\n        0% {\n            -webkit-transform: rotate(0deg);\n            transform: rotate(0deg);\n        }\n        100% {\n            -webkit-transform: rotate(359deg);\n            transform: rotate(359deg);\n        }\n    }\n\n    @keyframes p-icon-spin {\n        0% {\n            -webkit-transform: rotate(0deg);\n            transform: rotate(0deg);\n        }\n        100% {\n            -webkit-transform: rotate(359deg);\n            transform: rotate(359deg);\n        }\n    }\n\n    .p-overlay-mask {\n        background: var(--px-mask-background, dt('mask.background'));\n        color: dt('mask.color');\n        position: fixed;\n        top: 0;\n        left: 0;\n        width: 100%;\n        height: 100%;\n    }\n\n    .p-overlay-mask-enter-active {\n        animation: p-animate-overlay-mask-enter dt('mask.transition.duration') forwards;\n    }\n\n    .p-overlay-mask-leave-active {\n        animation: p-animate-overlay-mask-leave dt('mask.transition.duration') forwards;\n    }\n\n    @keyframes p-animate-overlay-mask-enter {\n        from {\n            background: transparent;\n        }\n        to {\n            background: var(--px-mask-background, dt('mask.background'));\n        }\n    }\n    @keyframes p-animate-overlay-mask-leave {\n        from {\n            background: var(--px-mask-background, dt('mask.background'));\n        }\n        to {\n            background: transparent;\n        }\n    }\n\n    .p-anchored-overlay-enter-active {\n        animation: p-animate-anchored-overlay-enter 300ms cubic-bezier(.19,1,.22,1);\n    }\n\n    .p-anchored-overlay-leave-active {\n        animation: p-animate-anchored-overlay-leave 300ms cubic-bezier(.19,1,.22,1);\n    }\n\n    @keyframes p-animate-anchored-overlay-enter {\n        from {\n            opacity: 0;\n            transform: scale(0.93);\n        }\n    }\n\n    @keyframes p-animate-anchored-overlay-leave {\n        to {\n            opacity: 0;\n            transform: scale(0.93);\n        }\n    }\n";
//#endregion
//#region node_modules/primeng/fesm2022/primeng-usestyle.mjs
var _UseStyle;
var _id = 0;
var UseStyle = class {
	constructor() {
		_defineProperty(this, "document", inject(DOCUMENT));
		_defineProperty(this, "styleSheets", /* @__PURE__ */ new Map());
		_defineProperty(this, "shadowRoots", /* @__PURE__ */ new Set());
	}
	/**
	* Applies the injected styles inside the given shadow root.
	*/
	addShadowRoot(shadowRoot) {
		if (!this.isAdoptionSupported() || !(shadowRoot instanceof ShadowRoot)) return () => {};
		if (!this.shadowRoots.has(shadowRoot)) {
			this.shadowRoots.add(shadowRoot);
			shadowRoot.adoptedStyleSheets = [...shadowRoot.adoptedStyleSheets, ...[...this.styleSheets.values()].filter((styleSheet) => !shadowRoot.adoptedStyleSheets.includes(styleSheet))];
		}
		return () => this.removeShadowRoot(shadowRoot);
	}
	/**
	* Stops applying the injected styles inside the given shadow root.
	*/
	removeShadowRoot(shadowRoot) {
		if (!this.shadowRoots.delete(shadowRoot)) return;
		const styleSheets = new Set(this.styleSheets.values());
		shadowRoot.adoptedStyleSheets = shadowRoot.adoptedStyleSheets.filter((styleSheet) => !styleSheets.has(styleSheet));
	}
	/**
	* Removes an injected style from the document and from the shadow roots that adopted it.
	*/
	remove(name) {
		var _this$document;
		const styleSheet = this.styleSheets.get(name);
		this.styleSheets.delete(name);
		(_this$document = this.document) === null || _this$document === void 0 || (_this$document = _this$document.querySelector(`style[data-primeng-style-id="${name}"]`)) === null || _this$document === void 0 || _this$document.remove();
		if (!styleSheet) return;
		this.shadowRoots.forEach((shadowRoot) => {
			shadowRoot.adoptedStyleSheets = shadowRoot.adoptedStyleSheets.filter((adopted) => adopted !== styleSheet);
		});
	}
	use(css, options = {}) {
		let cssRef = css;
		let styleRef = null;
		const { name = `style_${++_id}`, id = void 0, media = void 0, nonce = void 0, first = false, variables = false } = options;
		if (!this.document) return;
		styleRef = this.document.querySelector(`style[data-primeng-style-id="${name}"]`) || id && this.document.getElementById(id) || this.document.createElement("style");
		if (styleRef) {
			if (!styleRef.isConnected) {
				cssRef = css;
				const HEAD = this.document.head;
				ce$2(styleRef, "nonce", nonce);
				if (first && HEAD.firstChild) HEAD.insertBefore(styleRef, HEAD.firstChild);
				else HEAD.appendChild(styleRef);
				$$2(styleRef, {
					type: "text/css",
					media,
					nonce,
					"data-primeng-style-id": name
				});
			}
			if (styleRef.textContent !== cssRef) styleRef.textContent = cssRef;
		}
		if (!variables) {
			var _cssRef;
			this.adoptStyleSheet(name, (_cssRef = cssRef) !== null && _cssRef !== void 0 ? _cssRef : "", first);
		}
		return {
			id,
			name,
			el: styleRef,
			css: cssRef
		};
	}
	adoptStyleSheet(name, css, first) {
		if (!this.isAdoptionSupported()) return;
		const styleSheet = this.styleSheets.get(name);
		if (styleSheet) {
			styleSheet.replaceSync(css);
			return;
		}
		const added = new CSSStyleSheet();
		added.replaceSync(css);
		this.styleSheets = first ? new Map([[name, added], ...this.styleSheets]) : this.styleSheets.set(name, added);
		this.shadowRoots.forEach((shadowRoot) => {
			shadowRoot.adoptedStyleSheets = first ? [added, ...shadowRoot.adoptedStyleSheets] : [...shadowRoot.adoptedStyleSheets, added];
		});
	}
	isAdoptionSupported() {
		return typeof ShadowRoot !== "undefined" && typeof CSSStyleSheet !== "undefined" && typeof CSSStyleSheet.prototype.replaceSync === "function";
	}
};
_UseStyle = UseStyle;
_defineProperty(UseStyle, "ɵfac", function UseStyle_Factory(__ngFactoryType__) {
	return new (__ngFactoryType__ || _UseStyle)();
});
_defineProperty(UseStyle, "ɵprov", /*@__PURE__*/ ɵɵdefineInjectable({
	token: _UseStyle,
	factory: _UseStyle.ɵfac,
	providedIn: "root"
}));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(UseStyle, [{
		type: Injectable,
		args: [{ providedIn: "root" }]
	}], null, null);
})();
//#endregion
//#region node_modules/primeng/fesm2022/primeng-base.mjs
var _BaseStyle;
var base = {
	_loadedStyleNames: /* @__PURE__ */ new Set(),
	getLoadedStyleNames() {
		return this._loadedStyleNames;
	},
	isStyleNameLoaded(name) {
		return this._loadedStyleNames.has(name);
	},
	setLoadedStyleName(name) {
		this._loadedStyleNames.add(name);
	},
	deleteLoadedStyleName(name) {
		this._loadedStyleNames.delete(name);
	},
	clearLoadedStyleNames() {
		this._loadedStyleNames.clear();
	}
};
var css = `
.p-hidden-accessible {
    border: 0;
    clip: rect(0 0 0 0);
    height: 1px;
    margin: -1px;
    overflow: hidden;
    padding: 0;
    position: absolute;
    width: 1px;
}

.p-hidden-accessible input,
.p-hidden-accessible select {
    transform: scale(0);
}

.p-overflow-hidden {
    overflow: hidden;
    padding-right: dt('scrollbar.width');
}
`;
var BaseStyle = class {
	constructor() {
		_defineProperty(this, "name", "base");
		_defineProperty(this, "useStyle", inject(UseStyle));
		_defineProperty(this, "css", void 0);
		_defineProperty(this, "style", void 0);
		_defineProperty(this, "classes", {});
		_defineProperty(this, "inlineStyles", {});
		_defineProperty(this, "load", (style, options = {}, transform = (cs) => cs) => {
			const computedStyle = transform(gs`${x$1(style, { dt: N$1 })}`);
			return computedStyle ? this.useStyle.use(B$1(computedStyle), _objectSpread2({ name: this.name }, options)) : {};
		});
		_defineProperty(this, "loadCSS", (options = {}) => this.load(this.css, options));
		_defineProperty(this, "loadStyle", (options = {}, style = "") => this.load(this.style, options, (computedStyle = "") => S$1.transformCSS(options.name || this.name, `${computedStyle}${gs`${style}`}`)));
		_defineProperty(this, "loadBaseCSS", (options = {}) => this.load(css, options));
		_defineProperty(this, "loadBaseStyle", (options = {}, style$1 = "") => this.load(style, options, (computedStyle = "") => S$1.transformCSS(options.name || this.name, `${computedStyle}${gs`${style$1}`}`)));
		_defineProperty(this, "getCommonTheme", (params) => S$1.getCommon(this.name, params));
		_defineProperty(this, "getComponentTheme", (params) => S$1.getComponent(this.name, params));
		_defineProperty(this, "getPresetTheme", (preset, selector, params) => S$1.getCustomPreset(this.name, preset, selector, params));
		_defineProperty(this, "getLayerOrderThemeCSS", () => S$1.getLayerOrderCSS(this.name));
		_defineProperty(this, "getStyleSheet", (extendedCSS = "", props = {}) => {
			if (this.css) {
				const _css = x$1(this.css, { dt: N$1 });
				const _style = B$1(gs`${_css}${extendedCSS}`);
				const _props = Object.entries(props).reduce((acc, [k, v]) => acc.push(`${k}="${v}"`) && acc, []).join(" ");
				return `<style type="text/css" data-primeng-style-id="${this.name}" ${_props}>${_style}</style>`;
			}
			return "";
		});
		_defineProperty(this, "getCommonThemeStyleSheet", (params, props = {}) => S$1.getCommonStyleSheet(this.name, params, props));
		_defineProperty(this, "getThemeStyleSheet", (params, props = {}) => {
			let css = [S$1.getStyleSheet(this.name, params, props)];
			if (this.style) {
				const name = this.name === "base" ? "global-style" : `${this.name}-style`;
				const _css = gs`${x$1(this.style, { dt: N$1 })}`;
				const _style = B$1(S$1.transformCSS(name, _css));
				const _props = Object.entries(props).reduce((acc, [k, v]) => acc.push(`${k}="${v}"`) && acc, []).join(" ");
				css.push(`<style type="text/css" data-primeng-style-id="${name}" ${_props}>${_style}</style>`);
			}
			return css.join("");
		});
	}
};
_BaseStyle = BaseStyle;
_defineProperty(BaseStyle, "ɵfac", function BaseStyle_Factory(__ngFactoryType__) {
	return new (__ngFactoryType__ || _BaseStyle)();
});
_defineProperty(BaseStyle, "ɵprov", /*@__PURE__*/ ɵɵdefineInjectable({
	token: _BaseStyle,
	factory: _BaseStyle.ɵfac,
	providedIn: "root"
}));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(BaseStyle, [{
		type: Injectable,
		args: [{ providedIn: "root" }]
	}], null, null);
})();
//#endregion
//#region node_modules/@primeui/license-manager/dist/index.mjs
var e = Object.defineProperty;
var t = Object.getOwnPropertySymbols;
var r = Object.prototype.hasOwnProperty;
var n = Object.prototype.propertyIsEnumerable;
var i = (t, r, n) => r in t ? e(t, r, {
	enumerable: !0,
	configurable: !0,
	writable: !0,
	value: n
}) : t[r] = n;
var o = (e, o) => {
	for (var c in o || (o = {})) r.call(o, c) && i(e, c, o[c]);
	if (t) for (var c of t(o)) n.call(o, c) && i(e, c, o[c]);
	return e;
};
var c = (e, t, r) => new Promise((n, i) => {
	var o = (e) => {
		try {
			u(r.next(e));
		} catch (e) {
			i(e);
		}
	}, c = (e) => {
		try {
			u(r.throw(e));
		} catch (e) {
			i(e);
		}
	}, u = (e) => e.done ? n(e.value) : Promise.resolve(e.value).then(o, c);
	u((r = r.apply(e, t)).next());
});
var u = class extends Error {};
var l = (e) => " " === e || "\n" === e || "\r" === e || "	" === e;
var a = (e) => void 0 !== e && e >= "0" && e <= "9";
function s(e) {
	if (void 0 === e) throw new u("Bad escape");
	if (e >= "0" && e <= "9") return e.charCodeAt(0) - 48;
	if (e >= "a" && e <= "f") return e.charCodeAt(0) - 87;
	if (e >= "A" && e <= "F") return e.charCodeAt(0) - 55;
	throw new u("Bad escape");
}
var f = (() => {
	const e = Object.create(null);
	for (let t = 0; t < 64; t++) e["ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_"[t]] = t;
	return e;
})();
function d(e) {
	if (1 == e.length % 4) throw new Error("Invalid base64url length");
	const t = Math.floor(6 * e.length / 8), r = new Uint8Array(t);
	let n = 0, i = 0, o = 0;
	for (let t = 0; t < e.length; t++) {
		const u = f[e[t]];
		if (void 0 === u) throw new Error("Invalid base64url character");
		n = n << 6 | u, i += 6, i >= 8 && (i -= 8, r[o++] = n >> i & 255);
	}
	if (i > 0 && n & (1 << i) - 1) throw new Error("Invalid base64url trailing bits");
	return r;
}
var y = Object.freeze({
	primeui: "primeui",
	scheduler: "primeui-pro:scheduler",
	texteditor: "primeui-pro:text-editor",
	charts: "primeui-pro:charts",
	diagram: "primeui-pro:diagram",
	pdfviewer: "primeui-pro:pdf-viewer",
	taskboard: "primeui-pro:task-board",
	datagrid: "primeui-pro:datagrid",
	ganttchart: "primeui-pro:gantt-chart",
	filemanager: "primeui-pro:file-manager"
});
var g = 16;
var v = 65536;
var m = () => new Array(g).fill(0);
function b(e) {
	const t = m();
	let r = e;
	for (let e = 0; e < g && 0 !== r; e++) t[e] = r % v, r = Math.floor(r / v);
	return t;
}
var x = m();
var U = b(1);
var E = (() => {
	const e = m();
	e[0] = 65517;
	for (let t = 1; t < 15; t++) e[t] = 65535;
	return e[15] = 32767, e;
})();
function z(e, t) {
	let r = t;
	for (; 0 !== r;) {
		let t = 38 * r;
		r = 0;
		for (let r = 0; r < g; r++) {
			const n = e[r] + t;
			if (t = Math.floor(n / v), e[r] = n - t * v, 0 === t) break;
		}
		r = t;
	}
}
function k(e, t) {
	const r = new Array(32).fill(0);
	for (let n = 0; n < g; n++) {
		const i = e[n];
		if (0 !== i) {
			for (let e = 0; e < g; e++) r[n + e] = r[n + e] + i * t[e];
			if (n % 4 == 3) {
				let e = 0;
				for (let t = 0; t < 32; t++) {
					const n = r[t] + e;
					e = Math.floor(n / v), r[t] = n - e * v;
				}
			}
		}
	}
	return function(e) {
		for (let t = g; t < e.length; t++) e[t - g] = e[t - g] + 38 * e[t], e[t] = 0;
		let t = 0;
		for (let r = 0; r < g; r++) {
			const n = e[r] + t;
			t = Math.floor(n / v), e[r] = n - t * v;
		}
		const r = e.slice(0, g);
		return z(r, t), r;
	}(r);
}
function A(e) {
	return k(e, e);
}
function O(e, t) {
	const r = m();
	let n = 0;
	for (let i = 0; i < g; i++) {
		const o = e[i] + t[i] + n;
		n = o >= v ? 1 : 0, r[i] = o - n * v;
	}
	return z(r, n), r;
}
function j(e, t) {
	const r = m();
	let n = 0;
	for (let i = 0; i < g; i++) {
		const o = e[i] - t[i] - n;
		n = o < 0 ? 1 : 0, r[i] = o + n * v;
	}
	return z(r, -n), r;
}
function P(e) {
	return j(x, e);
}
function I(e) {
	for (let t = 15; t >= 0; t--) {
		if (e[t] > E[t]) return !0;
		if (e[t] < E[t]) return !1;
	}
	return !0;
}
function D(e) {
	const t = function(e) {
		const t = e.slice();
		let r = 0;
		for (let e = 0; e < g; e++) {
			const n = t[e] + r;
			r = Math.floor(n / v), t[e] = n - r * v;
		}
		z(t, r);
		for (let e = 0; e < 2 && I(t); e++) {
			let e = 0;
			for (let r = 0; r < g; r++) {
				const n = t[r] - E[r] - e;
				e = n < 0 ? 1 : 0, t[r] = n + e * v;
			}
		}
		return t;
	}(e), r = /* @__PURE__ */ new Uint8Array(32);
	for (let e = 0; e < g; e++) r[2 * e] = 255 & t[e], r[2 * e + 1] = t[e] >> 8 & 255;
	return r;
}
function T(e) {
	const t = D(e);
	let r = 0;
	for (let e = 0; e < 32; e++) r |= t[e];
	return 0 === r;
}
function F(e, t) {
	return T(j(e, t));
}
function C(e, t) {
	let r = e;
	for (let e = 0; e < t; e++) r = A(r);
	return r;
}
function M(e) {
	const t = A(e), r = k(e, C(t, 2)), n = k(t, r), i = k(r, A(n)), o = k(C(i, 5), i), c = k(C(o, 10), o), l = k(C(k(C(c, 20), c), 10), o), a = k(C(l, 50), l);
	return {
		z11: n,
		z250: k(C(k(C(a, 100), a), 50), l)
	};
}
function $(e) {
	const { z11: t, z250: r } = M(e);
	return k(C(r, 5), t);
}
var B = k(P(b(121665)), $(b(121666)));
var N = (() => {
	const e = /* @__PURE__ */ new Uint8Array(32);
	e[0] = 251;
	for (let t = 1; t < 31; t++) e[t] = 255;
	e[31] = 31;
	let t = U, r = b(2);
	for (let n = 0; n < 32; n++) for (let i = 0; i < 8; i++) 1 == (e[n] >> i & 1) && (t = k(t, r)), r = A(r);
	return t;
})();
function L(e, t) {
	const r = k(j(e.y, e.x), j(t.y, t.x)), n = k(O(e.y, e.x), O(t.y, t.x)), i = k(k(O(B, B), e.t), t.t), o = k(O(e.z, e.z), t.z), c = j(n, r), u = j(o, i), l = O(o, i), a = O(n, r);
	return {
		x: k(c, u),
		y: k(l, a),
		z: k(u, l),
		t: k(c, a)
	};
}
function S(e) {
	return L(e, e);
}
function _(e, t) {
	let r = {
		x: x.slice(),
		y: U.slice(),
		z: U.slice(),
		t: x.slice()
	}, n = !1;
	for (let i = e.length - 1; i >= 0; i--) for (let o = 7; o >= 0; o--) n && (r = S(r)), 1 == (e[i] >> o & 1) && (n ? r = L(r, t) : (r = {
		x: t.x.slice(),
		y: t.y.slice(),
		z: t.z.slice(),
		t: t.t.slice()
	}, n = !0));
	return r;
}
function V(e) {
	if (32 !== e.length) return null;
	const t = Uint8Array.from(e), r = 1 == (t[31] >> 7 & 1);
	t[31] = 127 & t[31];
	const n = function(e) {
		const t = m();
		for (let r = 0; r < g; r++) t[r] = e[2 * r] | e[2 * r + 1] << 8;
		return t;
	}(t);
	if (I(n)) return null;
	const i = A(n), o = j(i, U), c = O(k(B, i), U), u = k(A(c), c), l = k(A(u), c);
	let a = k(k(o, u), function(e) {
		const { z250: t } = M(e);
		return k(C(t, 2), e);
	}(k(o, l)));
	return F(k(A(a), c), o) || (a = k(a, N), F(k(A(a), c), o)) ? T(a) && r ? null : (!(1 & ~D(a)[0]) !== r && (a = P(a)), {
		x: a,
		y: n,
		z: U.slice(),
		t: k(a, n)
	}) : null;
}
var W = (() => {
	const e = V(D(k(b(4), $(b(5)))));
	if (!e) throw new Error("[@primeui/license-manager] Ed25519 base point failed to initialise");
	return e;
})();
function G(e) {
	const t = S(S(S(e)));
	return T(k(t.x, t.z)) && F(t.y, t.z);
}
var R = new Uint8Array([
	237,
	211,
	245,
	92,
	26,
	99,
	18,
	88,
	214,
	156,
	247,
	162,
	222,
	249,
	222,
	20,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	16
]);
function q(e) {
	for (let t = 31; t >= 0; t--) {
		if (e[t] < R[t]) return !0;
		if (e[t] > R[t]) return !1;
	}
	return !1;
}
var K = Object.freeze({
	primeui: "PrimeUI",
	scheduler: "Scheduler",
	texteditor: "TextEditor",
	charts: "Charts",
	diagram: "Diagram",
	pdfviewer: "PDF Viewer",
	taskboard: "Task Board",
	datagrid: "DataGrid",
	ganttchart: "Gantt",
	filemanager: "File Manager"
});
var H = (e, t) => Object.prototype.hasOwnProperty.call(e, t);
function J(e) {
	return H(K, e) ? K[e] : "PrimeUI";
}
function Q(e) {
	return H(y, e) ? y[e] : void 0;
}
function X(e, t = "PrimeUI") {
	switch (e) {
		case "active": return `${t} license is active.`;
		case "grace": return `${t} license is in its grace period. Renew soon to keep using this version.`;
		case "expired": return `${t} license does not cover this version. Renew at primeui.store, or downgrade to a version released within your updates window.`;
		case "tampered": return `${t} license signature is invalid.`;
		case "wrong-product": return `License does not cover ${t}.`;
		case "missing": return `No license key configured for ${t}.`;
		case "invalid": return `${t} license is malformed.`;
		case "unconfigured": return `${t} license is not configured.`;
		default: return `${t} license status unknown.`;
	}
}
var Y = [
	[1116352408, 3609767458],
	[1899447441, 602891725],
	[3049323471, 3964484399],
	[3921009573, 2173295548],
	[961987163, 4081628472],
	[1508970993, 3053834265],
	[2453635748, 2937671579],
	[2870763221, 3664609560],
	[3624381080, 2734883394],
	[310598401, 1164996542],
	[607225278, 1323610764],
	[1426881987, 3590304994],
	[1925078388, 4068182383],
	[2162078206, 991336113],
	[2614888103, 633803317],
	[3248222580, 3479774868],
	[3835390401, 2666613458],
	[4022224774, 944711139],
	[264347078, 2341262773],
	[604807628, 2007800933],
	[770255983, 1495990901],
	[1249150122, 1856431235],
	[1555081692, 3175218132],
	[1996064986, 2198950837],
	[2554220882, 3999719339],
	[2821834349, 766784016],
	[2952996808, 2566594879],
	[3210313671, 3203337956],
	[3336571891, 1034457026],
	[3584528711, 2466948901],
	[113926993, 3758326383],
	[338241895, 168717936],
	[666307205, 1188179964],
	[773529912, 1546045734],
	[1294757372, 1522805485],
	[1396182291, 2643833823],
	[1695183700, 2343527390],
	[1986661051, 1014477480],
	[2177026350, 1206759142],
	[2456956037, 344077627],
	[2730485921, 1290863460],
	[2820302411, 3158454273],
	[3259730800, 3505952657],
	[3345764771, 106217008],
	[3516065817, 3606008344],
	[3600352804, 1432725776],
	[4094571909, 1467031594],
	[275423344, 851169720],
	[430227734, 3100823752],
	[506948616, 1363258195],
	[659060556, 3750685593],
	[883997877, 3785050280],
	[958139571, 3318307427],
	[1322822218, 3812723403],
	[1537002063, 2003034995],
	[1747873779, 3602036899],
	[1955562222, 1575990012],
	[2024104815, 1125592928],
	[2227730452, 2716904306],
	[2361852424, 442776044],
	[2428436474, 593698344],
	[2756734187, 3733110249],
	[3204031479, 2999351573],
	[3329325298, 3815920427],
	[3391569614, 3928383900],
	[3515267271, 566280711],
	[3940187606, 3454069534],
	[4118630271, 4000239992],
	[116418474, 1914138554],
	[174292421, 2731055270],
	[289380356, 3203993006],
	[460393269, 320620315],
	[685471733, 587496836],
	[852142971, 1086792851],
	[1017036298, 365543100],
	[1126000580, 2618297676],
	[1288033470, 3409855158],
	[1501505948, 4234509866],
	[1607167915, 987167468],
	[1816402316, 1246189591]
];
var Z = [
	[1779033703, 4089235720],
	[3144134277, 2227873595],
	[1013904242, 4271175723],
	[2773480762, 1595750129],
	[1359893119, 2917565137],
	[2600822924, 725511199],
	[528734635, 4215389547],
	[1541459225, 327033209]
];
function ee(e, t, r) {
	return 32 === r ? [0 | t, 0 | e] : r < 32 ? [e >>> r | t << 32 - r, t >>> r | e << 32 - r] : [t >>> r - 32 | e << 64 - r, e >>> r - 32 | t << 64 - r];
}
function te(e, t, r) {
	return r < 32 ? [e >>> r, t >>> r | e << 32 - r] : [0, e >>> r - 32];
}
function re(e, t, r, n) {
	const i = (t >>> 0) + (n >>> 0);
	return [e + r + (i / 4294967296 | 0) | 0, 0 | i];
}
function ne(e) {
	const t = e.length, r = Math.floor(t / 536870912), n = t << 3 >>> 0, i = 128 * Math.ceil((t + 17) / 128), o = new Uint8Array(i);
	o.set(e), o[t] = 128;
	const c = new DataView(o.buffer);
	c.setUint32(i - 8, r), c.setUint32(i - 4, n);
	const u = Z.map((e) => [e[0], e[1]]), l = new Array(160);
	for (let e = 0; e < i; e += 128) {
		for (let t = 0; t < 16; t++) l[2 * t] = c.getUint32(e + 8 * t), l[2 * t + 1] = c.getUint32(e + 8 * t + 4);
		for (let e = 16; e < 80; e++) {
			const t = l[2 * (e - 15)], r = l[2 * (e - 15) + 1], [n, i] = ee(t, r, 1), [o, c] = ee(t, r, 8), [u, a] = te(t, r, 7), s = n ^ o ^ u, f = i ^ c ^ a, d = l[2 * (e - 2)], p = l[2 * (e - 2) + 1], [h, w] = ee(d, p, 19), [y, g] = ee(d, p, 61), [v, m] = te(d, p, 6), b = h ^ y ^ v, x = w ^ g ^ m;
			let [U, E] = re(l[2 * (e - 16)], l[2 * (e - 16) + 1], s, f);
			[U, E] = re(U, E, l[2 * (e - 7)], l[2 * (e - 7) + 1]), [U, E] = re(U, E, b, x), l[2 * e] = U, l[2 * e + 1] = E;
		}
		let [t, r] = u[0], [n, i] = u[1], [o, a] = u[2], [s, f] = u[3], [d, p] = u[4], [h, w] = u[5], [y, g] = u[6], [v, m] = u[7];
		for (let e = 0; e < 80; e++) {
			const [c, u] = ee(d, p, 14), [b, x] = ee(d, p, 18), [U, E] = ee(d, p, 41), z = c ^ b ^ U, k = u ^ x ^ E, A = d & h ^ ~d & y, O = p & w ^ ~p & g;
			let [j, P] = re(v, m, z, k);
			[j, P] = re(j, P, A, O), [j, P] = re(j, P, Y[e][0], Y[e][1]), [j, P] = re(j, P, l[2 * e], l[2 * e + 1]);
			const [I, D] = ee(t, r, 28), [T, F] = ee(t, r, 34), [C, M] = ee(t, r, 39), [S, _] = re(I ^ T ^ C, D ^ F ^ M, t & n ^ t & o ^ n & o, r & i ^ r & a ^ i & a);
			v = y, m = g, y = h, g = w, h = d, w = p, [d, p] = re(s, f, j, P), s = o, f = a, o = n, a = i, n = t, i = r, [t, r] = re(j, P, S, _);
		}
		u[0] = re(u[0][0], u[0][1], t, r), u[1] = re(u[1][0], u[1][1], n, i), u[2] = re(u[2][0], u[2][1], o, a), u[3] = re(u[3][0], u[3][1], s, f), u[4] = re(u[4][0], u[4][1], d, p), u[5] = re(u[5][0], u[5][1], h, w), u[6] = re(u[6][0], u[6][1], y, g), u[7] = re(u[7][0], u[7][1], v, m);
	}
	const a = /* @__PURE__ */ new Uint8Array(64), s = new DataView(a.buffer);
	for (let e = 0; e < 8; e++) s.setUint32(8 * e, u[e][0] >>> 0), s.setUint32(8 * e + 4, u[e][1] >>> 0);
	return a;
}
var ie = 864e5;
var oe = Date.UTC(2025, 0, 1);
var ce = (() => Object.assign(Object.create(null), {
	community: !0,
	commercial: !0
}))();
var ue = Object.create(null);
var le = [];
function ae(e) {
	let t = "";
	for (let r = 0; r < e.length; r++) t += (256 | e[r]).toString(16).slice(1);
	return t;
}
function se(e, t, r = {}) {
	return o({
		valid: "active" === e || "grace" === e,
		status: e,
		message: X(e, t)
	}, r);
}
function fe(e) {
	return "community" === e.tier;
}
function de(e, t) {
	return c(this, null, function* () {
		const r = t.productLabel;
		if ("string" != typeof e || e.length > 2048 || !e.includes(".")) return se("invalid", r);
		const n = e.split(".");
		if (2 !== n.length) return se("invalid", r);
		const [i, o] = n;
		let f;
		try {
			f = function(e) {
				let t = 0;
				const r = () => {
					for (; t < e.length && l(e[t]);) t++;
				}, n = (r) => {
					if (e.substr(t, r.length) !== r) throw new u("Unexpected token");
					t += r.length;
				}, i = () => {
					let r = "";
					for (;;) {
						if (t >= e.length) throw new u("Unterminated string");
						const n = e[t++];
						if ("\"" === n) return r;
						if (n < " ") throw new u("Control character in string");
						if ("\\" !== n) {
							r += n;
							continue;
						}
						const i = e[t++];
						switch (i) {
							case "\"":
							case "\\":
							case "/":
								r += i;
								break;
							case "b":
								r += "\b";
								break;
							case "f":
								r += "\f";
								break;
							case "n":
								r += "\n";
								break;
							case "r":
								r += "\r";
								break;
							case "t":
								r += "	";
								break;
							case "u": {
								const n = s(e[t]) << 12 | s(e[t + 1]) << 8 | s(e[t + 2]) << 4 | s(e[t + 3]);
								t += 4, r += String.fromCharCode(n);
								break;
							}
							default: throw new u("Bad escape");
						}
					}
				}, o = (c) => {
					if (c > 16) throw new u("Too deep");
					r();
					const l = e[t];
					if (void 0 === l) throw new u("Unexpected end");
					if ("{" === l) {
						t++;
						const n = {};
						if (r(), "}" === e[t]) return t++, n;
						for (;;) {
							if (r(), "\"" !== e[t]) throw new u("Expected key");
							t++;
							const l = i();
							if ("__proto__" === l || Object.prototype.hasOwnProperty.call(n, l)) throw new u("Bad key");
							if (r(), ":" !== e[t]) throw new u("Expected colon");
							if (t++, n[l] = o(c + 1), r(), "," !== e[t]) {
								if ("}" === e[t]) return t++, n;
								throw new u("Expected , or }");
							}
							t++;
						}
					}
					if ("[" === l) {
						t++;
						const n = [];
						if (r(), "]" === e[t]) return t++, n;
						for (;;) {
							if (n.push(o(c + 1)), r(), "," !== e[t]) {
								if ("]" === e[t]) return t++, n;
								throw new u("Expected , or ]");
							}
							t++;
						}
					}
					if ("\"" === l) return t++, i();
					if ("t" === l) return n("true"), !0;
					if ("f" === l) return n("false"), !1;
					if ("n" === l) return n("null"), null;
					if ("-" === l || a(l)) return (() => {
						const r = t;
						if ("-" === e[t] && t++, "0" === e[t]) t++;
						else {
							if (!a(e[t])) throw new u("Bad number");
							for (; a(e[t]);) t++;
						}
						if ("." === e[t]) {
							if (t++, !a(e[t])) throw new u("Bad number");
							for (; a(e[t]);) t++;
						}
						if ("e" === e[t] || "E" === e[t]) {
							if (t++, "+" !== e[t] && "-" !== e[t] || t++, !a(e[t])) throw new u("Bad number");
							for (; a(e[t]);) t++;
						}
						return Number(e.slice(r, t));
					})();
					throw new u("Unexpected token");
				}, c = o(0);
				if (r(), t !== e.length) throw new u("Trailing characters");
				return c;
			}(function(e) {
				const t = [];
				let r = 0;
				for (; r < e.length;) {
					const n = e[r++];
					if (n < 128) {
						t.push(n);
						continue;
					}
					let i, o, c;
					if (n >= 194 && n <= 223) i = 31 & n, o = 1, c = 128;
					else if (n >= 224 && n <= 239) i = 15 & n, o = 2, c = 2048;
					else {
						if (!(n >= 240 && n <= 244)) throw new u("Invalid UTF-8");
						i = 7 & n, o = 3, c = 65536;
					}
					if (r + o > e.length) throw new u("Invalid UTF-8");
					for (let t = 0; t < o; t++) {
						const t = e[r++];
						if (128 != (192 & t)) throw new u("Invalid UTF-8");
						i = i << 6 | 63 & t;
					}
					if (i < c || i > 1114111 || i >= 55296 && i <= 57343) throw new u("Invalid UTF-8");
					i >= 65536 ? (i -= 65536, t.push(55296 | i >> 10, 56320 | 1023 & i)) : t.push(i);
				}
				let n = "";
				for (let e = 0; e < t.length; e += 4096) n += String.fromCharCode.apply(null, t.slice(e, e + 4096));
				return n;
			}(d(i)));
		} catch (e) {
			return se("invalid", r);
		}
		if (!f || "object" != typeof f || Array.isArray(f)) return se("invalid", r);
		const p = f, y = (e) => Object.prototype.hasOwnProperty.call(p, e) ? p[e] : void 0, g = {
			id: y("id"),
			product: y("product"),
			tier: y("tier"),
			type: y("type"),
			iat: y("iat"),
			exp: y("exp")
		};
		if ("string" != typeof g.product || "string" != typeof g.type || !Number.isFinite(g.exp) || !Number.isFinite(g.iat) || "string" != typeof g.id) return se("invalid", r);
		if (void 0 !== g.tier && ("string" != typeof g.tier || !0 !== ce[g.tier])) return se("invalid", r);
		if (g.product === "primeui" && void 0 === g.tier) return se("invalid", r);
		let v, m, b;
		try {
			v = d(o), m = new TextEncoder().encode(i);
		} catch (e) {
			return se("invalid", r);
		}
		try {
			b = function(e) {
				if (!/^[0-9a-fA-F]*$/.test(e)) throw new Error("Invalid hex character");
				const t = /* @__PURE__ */ new Uint8Array(32);
				for (let r = 0; r < t.length; r++) t[r] = parseInt(e.slice(2 * r, 2 * r + 2), 16);
				return t;
			}("dae75e66b9f59bebf87d4bb29ca6494f37deccfcc2b132b98ee159ee7505373b");
		} catch (e) {
			return se("invalid", r);
		}
		let x = !1;
		try {
			x = yield function(e, t, r) {
				return c(this, null, function* () {
					if (!function(e, t, r) {
						const n = ae(r) + ":" + ae(e) + ":" + ae(t), i = ue[n];
						if (!0 === i || !1 === i) return i;
						const o = function(e, t, r, n) {
							if (64 !== e.length || 32 !== r.length) return !1;
							const i = e.slice(32, 64);
							if (!q(i)) return !1;
							const o = V(r);
							if (!o) return !1;
							if (G(o)) return !1;
							const c = e.slice(0, 32), u = V(c);
							if (!u) return !1;
							if (G(u)) return !1;
							const l = new Uint8Array(64 + t.length);
							l.set(c, 0), l.set(r, 32), l.set(t, 64);
							const a = function(e) {
								const t = /* @__PURE__ */ new Uint8Array(32);
								for (let r = e.length - 1; r >= 0; r--) {
									let n = e[r];
									for (let e = 0; e < 32; e++) {
										const r = 256 * t[e] + n;
										t[e] = 255 & r, n = r >> 8;
									}
									for (; n > 0 || !q(t);) {
										let e = 0;
										for (let r = 0; r < 32; r++) {
											const n = t[r] - R[r] - e;
											e = n < 0 ? 1 : 0, t[r] = n + 256 * e;
										}
										n -= e, n < 0 && (n = 0);
									}
								}
								return t;
							}(n(l)), s = _(i, W);
							return d = L(u, _(a, o)), F(k((f = s).x, d.z), k(d.x, f.z)) && F(k(f.y, d.z), k(d.y, f.z));
							var f, d;
						}(e, t, r, ne);
						return le.length >= 32 && delete ue[le.shift()], le.push(n), ue[n] = !0 === o, !0 === o;
					}(e, t, r)) return !1;
					const i = yield function(e, t, r) {
						return c(this, null, function* () {
							var n;
							const i = "undefined" != typeof globalThis ? globalThis : "undefined" != typeof self ? self : "undefined" != typeof window ? window : void 0, o = null == (n = null == i ? void 0 : i.crypto) ? void 0 : n.subtle;
							if (o) try {
								const n = yield o.importKey("raw", r, { name: "Ed25519" }, !1, ["verify"]);
								return yield o.verify({ name: "Ed25519" }, n, e, t);
							} catch (e) {
								return;
							}
						});
					}(e, t, r);
					return void 0 === i || !0 === i;
				});
			}(v, m, b);
		} catch (e) {
			return se("tampered", r, { payload: g });
		}
		if (!x) return se("tampered", r, { payload: g });
		if (!function(e, t) {
			return e.product === t || !(!t.startsWith("primeui-pro:") || e.product !== "primeui" || "commercial" !== e.tier);
		}(g, t.product)) return se("wrong-product", r, { payload: g });
		const U = 1e3 * g.exp, E = Date.now(), z = Math.floor((U - E) / ie), A = function(e) {
			const t = function(e) {
				if ("number" == typeof e) return Number.isFinite(e) ? 1e3 * e : null;
				if ("string" != typeof e || "" === e) return null;
				const t = Date.parse(e);
				return Number.isNaN(t) ? null : t;
			}(e);
			return null !== t && t >= oe ? t : null;
		}(t.releaseDate);
		if (null === A && !fe(g)) return se("invalid", r, {
			daysUntilExpiry: z,
			payload: g
		});
		if (null !== A && A > U) return se("expired", r, {
			daysUntilExpiry: z,
			payload: g
		});
		if (fe(g)) {
			if (E > U + 30 * ie) return se("expired", r, {
				daysUntilExpiry: z,
				payload: g
			});
			if (E > U) return se("grace", r, {
				daysUntilExpiry: z,
				payload: g
			});
		}
		return se("active", r, {
			daysUntilExpiry: z,
			payload: g
		});
	});
}
function pe(e, t) {
	const r = Object.prototype.hasOwnProperty.call(e, t) ? e[t] : void 0;
	return "string" == typeof r ? r : void 0;
}
function he(e, t) {
	return {
		valid: !1,
		status: e,
		message: X(e, t)
	};
}
function we(e, t) {
	const r = {};
	return {
		verify(t, n) {
			return c(this, null, function* () {
				const i = Q(t), c = J(t), u = null == n ? void 0 : n.releaseDate;
				if (!i) return he("invalid", c);
				const l = pe(e, t), a = pe(e, "primeui");
				if (l) {
					const e = yield de(l, o({
						product: i,
						productLabel: c,
						releaseDate: u
					}, r));
					if (e.valid) return e;
					if ("wrong-product" !== e.status) return e;
				}
				return a && "primeui" !== t && i.startsWith("primeui-pro:") ? de(a, o({
					product: i,
					productLabel: c,
					releaseDate: u
				}, r)) : he(l ? "wrong-product" : "missing", c);
			});
		},
		has(t) {
			const r = Q(t);
			return !!r && (!!pe(e, t) || "primeui" !== t && r.startsWith("primeui-pro:") && !!pe(e, "primeui"));
		}
	};
}
var ye = null;
function ge(e, t) {
	if (!e) throw new Error("[@primeui/license-manager] registerLicense: keys argument is required.");
	return ye = we(e);
}
function me(e, t) {
	if (!ye) {
		const t = J(e);
		return Promise.resolve({
			valid: !1,
			status: "unconfigured",
			message: X("unconfigured", t)
		});
	}
	return ye.verify(e, t);
}
//#endregion
//#region node_modules/primeng/fesm2022/primeng-license.mjs
/**
* Inject a fixed-positioned banner into the bottom-right of the page when the
* PrimeNG license cannot be verified.
*
* The banner content is rendered inside a closed-mode shadow root so page-level
* CSS cannot reach into it. `all:initial` on the host element blocks inherited
* styles. The host carries no semantically obvious id, slowing down trivial
* hide-by-selector attempts.
*
* Idempotent — guarded by the host id, so multiple call sites (the providePrimeNG
* initializer resolving, BaseComponent detecting a failed verify) cannot produce
* more than one banner per page.
*
* SSR-safe — short-circuits when `document` is undefined.
*
* Note: client-side license enforcement is anti-honest-user signaling, not
* anti-piracy. The cryptographic signature (Ed25519) is what actually prevents
* forging valid tokens. This banner just makes the licensing problem visible
* to a legitimate customer whose key needs attention.
*/
function showInvalidLicenseBanner() {
	if (typeof document === "undefined") return;
	if (document.getElementById("p-license-host")) return;
	const host = document.createElement("div");
	host.id = "p-license-host";
	host.style.cssText = "all:initial;position:fixed;bottom:16px;right:16px;z-index:2147483647;pointer-events:none;";
	const shadow = host.attachShadow({ mode: "closed" });
	shadow.innerHTML = "<div role=\"alert\" style=\"padding:10px 14px;background:#991b1b;color:#fff;font:600 13px/1.2 system-ui,-apple-system,sans-serif;border-radius:6px;box-shadow:0 4px 12px rgba(0,0,0,0.2);\">Invalid PrimeUI License</div>";
	document.body.appendChild(host);
}
//#endregion
//#region node_modules/primeng/fesm2022/primeng-config.mjs
var _ThemeProvider;
var _PrimeNG;
var ThemeProvider = class {
	constructor() {
		_defineProperty(this, "theme", signal(void 0, ...ngDevMode ? [{ debugName: "theme" }] : /* istanbul ignore next */ []));
		_defineProperty(this, "csp", signal({ nonce: void 0 }, ...ngDevMode ? [{ debugName: "csp" }] : /* istanbul ignore next */ []));
		_defineProperty(this, "isThemeChanged", false);
		_defineProperty(this, "document", inject(DOCUMENT));
		_defineProperty(this, "baseStyle", inject(BaseStyle));
		effect(() => {
			R$1.on("theme:change", (newTheme) => {
				untracked(() => {
					this.isThemeChanged = true;
					this.theme.set(newTheme);
				});
			});
		});
		effect(() => {
			const themeValue = this.theme();
			if (this.document && themeValue) {
				if (!this.isThemeChanged) this.onThemeChange(themeValue);
				this.isThemeChanged = false;
			}
		});
	}
	ngOnDestroy() {
		S$1.clearLoadedStyleNames();
		R$1.clear();
	}
	onThemeChange(value) {
		S$1.setTheme(value);
		if (this.document) this.loadCommonTheme();
	}
	loadCommonTheme() {
		if (this.theme() === "none") return;
		if (!S$1.isStyleNameLoaded("common")) {
			var _this$baseStyle$getCo, _this$baseStyle, _this$csp;
			const { primitive, semantic, global, style } = ((_this$baseStyle$getCo = (_this$baseStyle = this.baseStyle).getCommonTheme) === null || _this$baseStyle$getCo === void 0 ? void 0 : _this$baseStyle$getCo.call(_this$baseStyle)) || {};
			const styleOptions = { nonce: (_this$csp = this.csp) === null || _this$csp === void 0 || (_this$csp = _this$csp.call(this)) === null || _this$csp === void 0 ? void 0 : _this$csp.nonce };
			this.baseStyle.load(primitive === null || primitive === void 0 ? void 0 : primitive.css, _objectSpread2({
				name: "primitive-variables",
				variables: true
			}, styleOptions));
			this.baseStyle.load(semantic === null || semantic === void 0 ? void 0 : semantic.css, _objectSpread2({
				name: "semantic-variables",
				variables: true
			}, styleOptions));
			this.baseStyle.load(global === null || global === void 0 ? void 0 : global.css, _objectSpread2({
				name: "global-variables",
				variables: true
			}, styleOptions));
			this.baseStyle.loadBaseStyle(_objectSpread2({ name: "global-style" }, styleOptions), style);
			S$1.setLoadedStyleName("common");
		}
	}
	setThemeConfig(config) {
		const { theme, csp } = config || {};
		if (theme) this.theme.set(theme);
		if (csp) this.csp.set(csp);
	}
};
_ThemeProvider = ThemeProvider;
_defineProperty(ThemeProvider, "ɵfac", function ThemeProvider_Factory(__ngFactoryType__) {
	return new (__ngFactoryType__ || _ThemeProvider)();
});
_defineProperty(ThemeProvider, "ɵprov", /*@__PURE__*/ ɵɵdefineInjectable({
	token: _ThemeProvider,
	factory: _ThemeProvider.ɵfac,
	providedIn: "root"
}));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(ThemeProvider, [{
		type: Injectable,
		args: [{ providedIn: "root" }]
	}], () => [], null);
})();
var PrimeNG = class extends ThemeProvider {
	constructor(..._args) {
		super(..._args);
		_defineProperty(this, "ripple", signal(false, ...ngDevMode ? [{ debugName: "ripple" }] : /* istanbul ignore next */ []));
		_defineProperty(this, "platformId", inject(PLATFORM_ID));
		_defineProperty(this, "inputVariant", signal(null, ...ngDevMode ? [{ debugName: "inputVariant" }] : /* istanbul ignore next */ []));
		_defineProperty(this, "_verified", signal(null, ...ngDevMode ? [{ debugName: "_verified" }] : /* istanbul ignore next */ []));
		_defineProperty(this, "verified", this._verified.asReadonly());
		_defineProperty(this, "overlayAppendTo", signal("self", ...ngDevMode ? [{ debugName: "overlayAppendTo" }] : /* istanbul ignore next */ []));
		_defineProperty(this, "overlayOptions", {});
		_defineProperty(this, "csp", signal({ nonce: void 0 }, ...ngDevMode ? [{ debugName: "csp" }] : /* istanbul ignore next */ []));
		_defineProperty(this, "unstyled", signal(void 0, ...ngDevMode ? [{ debugName: "unstyled" }] : /* istanbul ignore next */ []));
		_defineProperty(this, "pt", signal(void 0, ...ngDevMode ? [{ debugName: "pt" }] : /* istanbul ignore next */ []));
		_defineProperty(this, "ptOptions", signal(void 0, ...ngDevMode ? [{ debugName: "ptOptions" }] : /* istanbul ignore next */ []));
		_defineProperty(this, "filterMatchModeOptions", {
			text: [
				FilterMatchMode.STARTS_WITH,
				FilterMatchMode.CONTAINS,
				FilterMatchMode.NOT_CONTAINS,
				FilterMatchMode.ENDS_WITH,
				FilterMatchMode.EQUALS,
				FilterMatchMode.NOT_EQUALS
			],
			numeric: [
				FilterMatchMode.EQUALS,
				FilterMatchMode.NOT_EQUALS,
				FilterMatchMode.LESS_THAN,
				FilterMatchMode.LESS_THAN_OR_EQUAL_TO,
				FilterMatchMode.GREATER_THAN,
				FilterMatchMode.GREATER_THAN_OR_EQUAL_TO
			],
			date: [
				FilterMatchMode.DATE_IS,
				FilterMatchMode.DATE_IS_NOT,
				FilterMatchMode.DATE_BEFORE,
				FilterMatchMode.DATE_AFTER
			]
		});
		_defineProperty(this, "translation", {
			startsWith: "Starts with",
			contains: "Contains",
			notContains: "Not contains",
			endsWith: "Ends with",
			equals: "Equals",
			notEquals: "Not equals",
			noFilter: "No Filter",
			lt: "Less than",
			lte: "Less than or equal to",
			gt: "Greater than",
			gte: "Greater than or equal to",
			is: "Is",
			isNot: "Is not",
			before: "Before",
			after: "After",
			dateIs: "Date is",
			dateIsNot: "Date is not",
			dateBefore: "Date is before",
			dateAfter: "Date is after",
			clear: "Clear",
			apply: "Apply",
			matchAll: "Match All",
			matchAny: "Match Any",
			addRule: "Add Rule",
			removeRule: "Remove Rule",
			accept: "Yes",
			reject: "No",
			choose: "Choose",
			completed: "Completed",
			upload: "Upload",
			cancel: "Cancel",
			pending: "Pending",
			fileSizeTypes: [
				"B",
				"KB",
				"MB",
				"GB",
				"TB",
				"PB",
				"EB",
				"ZB",
				"YB"
			],
			dayNames: [
				"Sunday",
				"Monday",
				"Tuesday",
				"Wednesday",
				"Thursday",
				"Friday",
				"Saturday"
			],
			dayNamesShort: [
				"Sun",
				"Mon",
				"Tue",
				"Wed",
				"Thu",
				"Fri",
				"Sat"
			],
			dayNamesMin: [
				"Su",
				"Mo",
				"Tu",
				"We",
				"Th",
				"Fr",
				"Sa"
			],
			monthNames: [
				"January",
				"February",
				"March",
				"April",
				"May",
				"June",
				"July",
				"August",
				"September",
				"October",
				"November",
				"December"
			],
			monthNamesShort: [
				"Jan",
				"Feb",
				"Mar",
				"Apr",
				"May",
				"Jun",
				"Jul",
				"Aug",
				"Sep",
				"Oct",
				"Nov",
				"Dec"
			],
			chooseYear: "Choose Year",
			chooseMonth: "Choose Month",
			chooseDate: "Choose Date",
			prevDecade: "Previous Decade",
			nextDecade: "Next Decade",
			prevYear: "Previous Year",
			nextYear: "Next Year",
			prevMonth: "Previous Month",
			nextMonth: "Next Month",
			prevHour: "Previous Hour",
			nextHour: "Next Hour",
			prevMinute: "Previous Minute",
			nextMinute: "Next Minute",
			prevSecond: "Previous Second",
			nextSecond: "Next Second",
			am: "am",
			pm: "pm",
			dateFormat: "mm/dd/yy",
			firstDayOfWeek: 0,
			today: "Today",
			weekHeader: "Wk",
			weak: "Weak",
			medium: "Medium",
			strong: "Strong",
			passwordPrompt: "Enter a password",
			emptyMessage: "No results found",
			searchMessage: "Search results are available",
			selectionMessage: "{0} items selected",
			emptySelectionMessage: "No selected item",
			emptySearchMessage: "No results found",
			emptyFilterMessage: "No results found",
			fileChosenMessage: "Files",
			noFileChosenMessage: "No file chosen",
			aria: {
				trueLabel: "True",
				falseLabel: "False",
				nullLabel: "Not Selected",
				star: "1 star",
				stars: "{star} stars",
				selectAll: "All items selected",
				unselectAll: "All items unselected",
				close: "Close",
				previous: "Previous",
				next: "Next",
				navigation: "Navigation",
				scrollTop: "Scroll Top",
				moveTop: "Move Top",
				moveUp: "Move Up",
				moveDown: "Move Down",
				moveBottom: "Move Bottom",
				moveToTarget: "Move to Target",
				moveToSource: "Move to Source",
				moveAllToTarget: "Move All to Target",
				moveAllToSource: "Move All to Source",
				pageLabel: "{page}",
				firstPageLabel: "First Page",
				lastPageLabel: "Last Page",
				nextPageLabel: "Next Page",
				prevPageLabel: "Previous Page",
				rowsPerPageLabel: "Rows per page",
				previousPageLabel: "Previous Page",
				jumpToPageDropdownLabel: "Jump to Page Dropdown",
				jumpToPageInputLabel: "Jump to Page Input",
				selectRow: "Row Selected",
				unselectRow: "Row Unselected",
				expandRow: "Row Expanded",
				collapseRow: "Row Collapsed",
				expand: "Expand",
				collapse: "Collapse",
				showFilterMenu: "Show Filter Menu",
				hideFilterMenu: "Hide Filter Menu",
				filterOperator: "Filter Operator",
				filterConstraint: "Filter Constraint",
				editRow: "Row Edit",
				saveEdit: "Save Edit",
				cancelEdit: "Cancel Edit",
				listView: "List View",
				gridView: "Grid View",
				slide: "Slide",
				slideNumber: "{slideNumber}",
				zoomImage: "Zoom Image",
				zoomIn: "Zoom In",
				zoomOut: "Zoom Out",
				rotateRight: "Rotate Right",
				rotateLeft: "Rotate Left",
				listLabel: "Option List",
				selectColor: "Select a color",
				removeLabel: "Remove",
				browseFiles: "Browse Files",
				maximizeLabel: "Maximize",
				minimizeLabel: "Minimize"
			}
		});
		_defineProperty(this, "zIndex", {
			modal: 1100,
			overlay: 1e3,
			menu: 1e3,
			tooltip: 1100
		});
		_defineProperty(this, "translationSource", new Subject());
		_defineProperty(this, "translationObserver", this.translationSource.asObservable());
	}
	_setVerified(value) {
		this._verified.set(value);
	}
	getTranslation(key) {
		return this.translation[key];
	}
	setTranslation(value) {
		this.translation = _objectSpread2(_objectSpread2({}, this.translation), value);
		this.translationSource.next(this.translation);
	}
	setConfig(config) {
		const { csp, ripple, inputVariant, theme, overlayOptions, translation, filterMatchModeOptions, overlayAppendTo, zIndex, ptOptions, pt, unstyled } = config || {};
		if (csp) this.csp.set(csp);
		if (overlayAppendTo) this.overlayAppendTo.set(overlayAppendTo);
		if (ripple) this.ripple.set(ripple);
		if (inputVariant) this.inputVariant.set(inputVariant);
		if (overlayOptions) this.overlayOptions = overlayOptions;
		if (translation) this.setTranslation(translation);
		if (filterMatchModeOptions) this.filterMatchModeOptions = filterMatchModeOptions;
		if (zIndex) this.zIndex = zIndex;
		if (pt) this.pt.set(pt);
		if (ptOptions) this.ptOptions.set(ptOptions);
		if (unstyled) this.unstyled.set(unstyled);
		if (theme) this.setThemeConfig({
			theme,
			csp
		});
	}
};
_PrimeNG = PrimeNG;
_defineProperty(PrimeNG, "ɵfac", /*@__PURE__*/ (() => {
	let ɵPrimeNG_BaseFactory = void 0;
	return function PrimeNG_Factory(__ngFactoryType__) {
		return (ɵPrimeNG_BaseFactory || (ɵPrimeNG_BaseFactory = ɵɵgetInheritedFactory(_PrimeNG)))(__ngFactoryType__ || _PrimeNG);
	};
})());
_defineProperty(PrimeNG, "ɵprov", /*@__PURE__*/ ɵɵdefineInjectable({
	token: _PrimeNG,
	factory: _PrimeNG.ɵfac,
	providedIn: "root"
}));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(PrimeNG, [{
		type: Injectable,
		args: [{ providedIn: "root" }]
	}], null, null);
})();
var PRIME_NG_CONFIG = new InjectionToken("PRIME_NG_CONFIG");
var RELEASE_DATE = "2026-09-09";
function providePrimeNG(...features) {
	const providers = features === null || features === void 0 ? void 0 : features.map((feature) => ({
		provide: PRIME_NG_CONFIG,
		useValue: feature,
		multi: false
	}));
	const initializer = provideAppInitializer(() => {
		const PrimeNGConfig = inject(PrimeNG);
		features === null || features === void 0 || features.forEach((feature) => PrimeNGConfig.setConfig(feature));
		const license = features === null || features === void 0 ? void 0 : features.map((f) => f.license).find(Boolean);
		if (license) ge({ primeui: license });
		me("primeui", { releaseDate: RELEASE_DATE }).then((result) => {
			PrimeNGConfig._setVerified(result.valid);
			if (!result.valid) {
				console.warn(`[PrimeUI] ${result.message}`);
				showInvalidLicenseBanner();
			}
		});
	});
	return makeEnvironmentProviders([...providers, initializer]);
}
//#endregion
export { st as _, showInvalidLicenseBanner as a, UseStyle as c, Ft as d, L$2 as f, le$1 as g, k$1 as h, providePrimeNG as i, R$1 as l, W$1 as m, PrimeNG as n, BaseStyle as o, R$2 as p, ThemeProvider as r, base as s, PRIME_NG_CONFIG as t, S$1 as u, w$1 as v, zt as y };
