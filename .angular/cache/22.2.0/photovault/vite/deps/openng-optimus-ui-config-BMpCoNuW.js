import { n as _defineProperty, t as _objectSpread2 } from "./objectSpread2-weooBxVk.js";
import { Di as provideAppInitializer, Dl as signal, Fn as Injectable, Gl as Subject, Hc as PLATFORM_ID, Ml as ɵɵdefineInjectable, Wi as setClassMetadata, fc as _objectWithoutProperties, jc as InjectionToken, jo as ɵɵgetInheritedFactory, ol as effect, pl as inject, qt as untracked, yc as DOCUMENT, yl as makeEnvironmentProviders } from "./core-C91JEChX.js";
import "./common-C2OsAfsp.js";
import { a as V, c as e$1, d as l$1, h as w$1, i as O$1, l as g, n as M$1, o as _, s as a, t as A$2 } from "./dist-CbKW6MfK.js";
import { FilterMatchMode } from "./@openng_optimus-ui_api.js";
//#region node_modules/@openng/optimus-ui-utils/dist/dom/index.mjs
function t(e, t) {
	return e ? e.classList ? e.classList.contains(t) : RegExp(`(^| )` + t + `( |$)`, `gi`).test(e.className) : !1;
}
function n(e, n) {
	if (e && n) {
		let r = (n) => {
			t(e, n) || (e.classList ? e.classList.add(n) : e.className += ` ` + n);
		};
		[n].flat().filter(Boolean).forEach((e) => e.split(` `).forEach(r));
	}
}
function s(e, t) {
	if (e && t) {
		let n = (t) => {
			e.classList ? e.classList.remove(t) : e.className = e.className.replace(RegExp(`(^|\\b)` + t.split(` `).join(`|`) + `(\\b|$)`, `gi`), ` `);
		};
		[t].flat().filter(Boolean).forEach((e) => e.split(` `).forEach(n));
	}
}
function l(e) {
	var _document;
	for (let t of (_document = document) === null || _document === void 0 ? void 0 : _document.styleSheets) try {
		for (let n of t === null || t === void 0 ? void 0 : t.cssRules) for (let t of n === null || n === void 0 ? void 0 : n.style) if (e.test(t)) return {
			name: t,
			value: n.style.getPropertyValue(t).trim()
		};
	} catch (_unused) {}
	return null;
}
function f(e) {
	return e ? Math.abs(e.scrollLeft) : 0;
}
function v(e, t) {
	if (e instanceof HTMLElement) {
		let n = e.offsetWidth;
		if (t) {
			let t = getComputedStyle(e);
			n += parseFloat(t.marginLeft) + parseFloat(t.marginRight);
		}
		return n;
	}
	return 0;
}
function C$1(e) {
	return typeof Element < `u` ? e instanceof Element : typeof e == `object` && !!e && e.nodeType === 1 && typeof e.nodeName == `string`;
}
function A$1(e, t = {}) {
	if (C$1(e)) {
		let n = (t, r) => {
			var _e$$attrs, _e$$attrs2;
			let i = (e === null || e === void 0 || (_e$$attrs = e.$attrs) === null || _e$$attrs === void 0 ? void 0 : _e$$attrs[t]) ? [e === null || e === void 0 || (_e$$attrs2 = e.$attrs) === null || _e$$attrs2 === void 0 ? void 0 : _e$$attrs2[t]] : [];
			return [r].flat().reduce((e, r) => {
				if (r != null) {
					let i = typeof r;
					if (i === `string` || i === `number`) e.push(r);
					else if (i === `object`) {
						let i = Array.isArray(r) ? n(t, r) : Object.entries(r).map(([e, n]) => t === `style` && (n || n === 0) ? `${e.replace(/([a-z])([A-Z])/g, `$1-$2`).toLowerCase()}:${n}` : n ? e : void 0);
						e = i.length ? e.concat(i.filter((e) => !!e)) : e;
					}
				}
				return e;
			}, i);
		}, r = (t) => {
			n(`style`, t).forEach((t) => {
				let n = t.indexOf(`:`);
				if (n < 0) return;
				let r = t.slice(0, n).trim(), i = t.slice(n + 1).trim();
				r && e.style.setProperty(r, i);
			});
		};
		Object.entries(t).forEach(([t, i]) => {
			if (i != null) {
				let a = t.match(/^on(.+)/);
				a ? e.addEventListener(a[1].toLowerCase(), i) : t === `p-bind` || t === `pBind` ? A$1(e, i) : t === `style` ? (r(i), (e.$attrs = e.$attrs || {}) && (e.$attrs[t] = e.style.cssText)) : (i = t === `class` ? [...new Set(n(`class`, i))].join(` `).trim() : i, (e.$attrs = e.$attrs || {}) && (e.$attrs[t] = i), e.setAttribute(t, i));
			}
		});
	}
}
function j$1(e, t = {}, ...n) {
	if (e) {
		let r = document.createElement(e);
		return A$1(r, t), r.append(...n), r;
	}
}
function L(e, t) {
	return C$1(e) ? e.matches(t) ? e : e.querySelector(t) : null;
}
function W(e) {
	if (e) {
		let t = e.offsetHeight, n = getComputedStyle(e);
		return t -= parseFloat(n.paddingTop) + parseFloat(n.paddingBottom) + parseFloat(n.borderTopWidth) + parseFloat(n.borderBottomWidth), t;
	}
	return 0;
}
function q$1(e) {
	if (e) {
		let t = e.getBoundingClientRect();
		return {
			top: t.top + (window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0),
			left: t.left + (window.pageXOffset || f(document.documentElement) || f(document.body) || 0)
		};
	}
	return {
		top: `auto`,
		left: `auto`
	};
}
function J$1(e, t) {
	if (e) {
		let n = e.offsetHeight;
		if (t) {
			let t = getComputedStyle(e);
			n += parseFloat(t.marginTop) + parseFloat(t.marginBottom);
		}
		return n;
	}
	return 0;
}
function _e(e) {
	if (e) {
		let t = e.offsetWidth, n = getComputedStyle(e);
		return t -= parseFloat(n.paddingLeft) + parseFloat(n.paddingRight) + parseFloat(n.borderLeftWidth) + parseFloat(n.borderRightWidth), t;
	}
	return 0;
}
function Me(e) {
	var _e$parentNode;
	e && (`remove` in Element.prototype ? e.remove() : (_e$parentNode = e.parentNode) === null || _e$parentNode === void 0 || _e$parentNode.removeChild(e));
}
function Ie(e, t = ``, n) {
	if (C$1(e) && n != null) {
		if (t === `style`) {
			typeof n == `string` ? e.style.cssText = n : typeof n == `object` && Object.entries(n).forEach(([t, n]) => {
				if (n == null) return;
				let r = t.startsWith(`--`) ? t : t.replace(/([a-z])([A-Z])/g, `$1-$2`).toLowerCase();
				e.style.setProperty(r, String(n));
			});
			return;
		}
		e.setAttribute(t, n);
	}
}
//#endregion
//#region node_modules/@openng/optimus-ui-utils/dist/eventbus/index.mjs
function e() {
	let e = /* @__PURE__ */ new Map();
	return {
		on(t, n) {
			let r = e.get(t);
			return r ? r.push(n) : r = [n], e.set(t, r), this;
		},
		off(t, n) {
			let r = e.get(t);
			return r && r.splice(r.indexOf(n) >>> 0, 1), this;
		},
		emit(t, n) {
			let r = e.get(t);
			r && r.forEach((e) => {
				e(n);
			});
		},
		clear() {
			e.clear();
		}
	};
}
//#endregion
//#region node_modules/@openng/optimus-ui-styled/dist/index.mjs
var _excluded = ["colorScheme"];
var b = e();
var x = /{([^}]*)}/g;
var S = /(\d+\s+[\+\-\*\/]\s+\d+)/g;
var C = /var\([^)]+\)/g;
function w(e) {
	return _(e) ? e.replace(/[A-Z]/g, (e, t) => t === 0 ? e : `.` + e.toLowerCase()).toLowerCase() : e;
}
function E(e) {
	return l$1(e) && e.hasOwnProperty(`$value`) && e.hasOwnProperty(`$type`) ? e.$value : e;
}
function O(e) {
	return e.replaceAll(/ /g, ``).replace(/[^\w]/g, `-`);
}
function k(e = ``, t = ``) {
	return O(`${_(e, !1) && _(t, !1) ? `${e}-` : e}${t}`);
}
function A(e = ``, t = ``) {
	return `--${k(e, t)}`;
}
function j(e = ``) {
	return ((e.match(/{/g) || []).length + (e.match(/}/g) || []).length) % 2 != 0;
}
function M(e, t = ``, n = ``, r = [], o) {
	if (_(e)) {
		let t = e.trim();
		if (j(t)) return;
		if (O$1(t, x)) {
			let e = t.replaceAll(x, (e) => `var(${A(n, V(e.replace(/{|}/g, ``).split(`.`).filter((e) => !r.some((t) => O$1(e, t))).join(`-`)))}${a(o) ? `, ${o}` : ``})`);
			return O$1(e.replace(C, `0`), S) ? `calc(${e})` : e;
		}
		return t;
	} else if (w$1(e)) return e;
}
function P(e, t, n) {
	_(t, !1) && e.push(`${t}:${n};`);
}
function F(e, t) {
	return e ? `${e}{${t}}` : ``;
}
function I(e, t) {
	if (e.indexOf(`dt(`) === -1) return e;
	function n(e, t) {
		let n = [], i = 0, a = ``, o = null, s = 0;
		for (; i <= e.length;) {
			let c = e[i];
			if ((c === `"` || c === `'` || c === "`") && e[i - 1] !== `\\` && (o = o === c ? null : c), !o && (c === `(` && s++, c === `)` && s--, (c === `,` || i === e.length) && s === 0)) {
				let e = a.trim();
				e.startsWith(`dt(`) ? n.push(I(e, t)) : n.push(r(e)), a = ``, i++;
				continue;
			}
			c !== void 0 && (a += c), i++;
		}
		return n;
	}
	function r(e) {
		let t = e[0];
		if ((t === `"` || t === `'` || t === "`") && e[e.length - 1] === t) return e.slice(1, -1);
		let n = Number(e);
		return isNaN(n) ? e : n;
	}
	let i = [], a = [];
	for (let t = 0; t < e.length; t++) if (e[t] === `d` && e.slice(t, t + 3) === `dt(`) a.push(t), t += 2;
	else if (e[t] === `)` && a.length > 0) {
		let e = a.pop();
		a.length === 0 && i.push([e, t]);
	}
	if (!i.length) return e;
	for (let r = i.length - 1; r >= 0; r--) {
		let [a, o] = i[r], s = t(...n(e.slice(a + 3, o), t));
		e = e.slice(0, a) + s + e.slice(o + 1);
	}
	return e;
}
var K = (...e) => q(Q.getTheme(), ...e);
var q = (e = {}, t, n, i) => {
	if (t) {
		let { variable: a, options: o } = Q.defaults || {}, { prefix: s, transform: l } = (e === null || e === void 0 ? void 0 : e.options) || o || {}, u = O$1(t, x) ? t : `{${t}}`;
		return i === `value` || e$1(i) && l === `strict` ? Q.getTokenValue(t) : M(u, void 0, s, [a.excludedKeyRegex], n);
	}
	return ``;
};
function J(e, ...t) {
	return e instanceof Array ? I(e.reduce((e, n, r) => {
		var _v;
		return e + n + ((_v = g(t[r], { dt: K })) !== null && _v !== void 0 ? _v : ``);
	}, ``), K) : g(e, { dt: K });
}
function X(e, t = {}) {
	let n = Q.defaults.variable, { prefix: r = n.prefix, selector: i = n.selector, excludedKeyRegex: a = n.excludedKeyRegex } = t, s = [], l = [], u = [{
		node: e,
		path: r
	}];
	for (; u.length;) {
		let { node: e, path: t } = u.pop();
		for (let n in e) {
			let i = e[n], d = E(i), f = O$1(n, a) ? k(t) : k(t, V(n));
			if (l$1(d)) u.push({
				node: d,
				path: f
			});
			else {
				P(l, A(f), M(d, f, r, [a]));
				let e = f;
				r && e.startsWith(r + `-`) && (e = e.slice(r.length + 1)), s.push(e.replace(/-/g, `.`));
			}
		}
	}
	let d = l.join(``);
	return {
		value: l,
		tokens: s,
		declarations: d,
		css: F(i, d)
	};
}
var Z = {
	regex: {
		rules: {
			class: {
				pattern: /^\.([a-zA-Z][\w-]*)$/,
				resolve(e) {
					return {
						type: `class`,
						selector: e,
						matched: this.pattern.test(e.trim())
					};
				}
			},
			attr: {
				pattern: /^\[(.*)\]$/,
				resolve(e) {
					return {
						type: `attr`,
						selector: `:root${e},:host${e}`,
						matched: this.pattern.test(e.trim())
					};
				}
			},
			media: {
				pattern: /^@media (.*)$/,
				resolve(e) {
					return {
						type: `media`,
						selector: e,
						matched: this.pattern.test(e.trim())
					};
				}
			},
			system: {
				pattern: /^system$/,
				resolve(e) {
					return {
						type: `system`,
						selector: `@media (prefers-color-scheme: dark)`,
						matched: this.pattern.test(e.trim())
					};
				}
			},
			custom: { resolve(e) {
				return {
					type: `custom`,
					selector: e,
					matched: !0
				};
			} }
		},
		resolve(e) {
			let t = Object.keys(this.rules).filter((e) => e !== `custom`).map((e) => this.rules[e]);
			return [e].flat().map((e) => {
				var _t$map$find;
				return (_t$map$find = t.map((t) => t.resolve(e)).find((e) => e.matched)) !== null && _t$map$find !== void 0 ? _t$map$find : this.rules.custom.resolve(e);
			});
		}
	},
	_toVariables(e, t) {
		return X(e, { prefix: t === null || t === void 0 ? void 0 : t.prefix });
	},
	getCommon({ name: e = ``, theme: t = {}, params: n, set: r, defaults: a$1 }) {
		let { preset: o, options: s } = t, c, l, u, p, m, h, g$1;
		if (a(o) && s.transform !== `strict`) {
			var _E$declarations, _D$declarations, _O$declarations, _k$declarations, _A$declarations, _j$declarations, _M$declarations;
			let { primitive: t, semantic: n, extend: _ } = o, v = n === null || n === void 0 ? void 0 : n.colorScheme, y = M$1(n, `colorScheme`), b = _ === null || _ === void 0 ? void 0 : _.colorScheme, x = M$1(_, `colorScheme`), S = v === null || v === void 0 ? void 0 : v.dark, C = M$1(v, `dark`), w = b === null || b === void 0 ? void 0 : b.dark, T = M$1(b, `dark`), E = a(t) ? this._toVariables({ primitive: t }, s) : {}, D = a(y) ? this._toVariables({ semantic: y }, s) : {}, O = a(C) ? this._toVariables({ light: C }, s) : {}, k = a(S) ? this._toVariables({ dark: S }, s) : {}, A = a(x) ? this._toVariables({ semantic: x }, s) : {}, j = a(T) ? this._toVariables({ light: T }, s) : {}, M = a(w) ? this._toVariables({ dark: w }, s) : {}, [N, P] = [(_E$declarations = E.declarations) !== null && _E$declarations !== void 0 ? _E$declarations : ``, E.tokens], [F, I] = [(_D$declarations = D.declarations) !== null && _D$declarations !== void 0 ? _D$declarations : ``, D.tokens || []], [L, R] = [(_O$declarations = O.declarations) !== null && _O$declarations !== void 0 ? _O$declarations : ``, O.tokens || []], [z, B] = [(_k$declarations = k.declarations) !== null && _k$declarations !== void 0 ? _k$declarations : ``, k.tokens || []], [V, H] = [(_A$declarations = A.declarations) !== null && _A$declarations !== void 0 ? _A$declarations : ``, A.tokens || []], [U, W] = [(_j$declarations = j.declarations) !== null && _j$declarations !== void 0 ? _j$declarations : ``, j.tokens || []], [G, q] = [(_M$declarations = M.declarations) !== null && _M$declarations !== void 0 ? _M$declarations : ``, M.tokens || []];
			c = this.transformCSS(e, N, `light`, `variable`, s, r, a$1), l = P, u = `${this.transformCSS(e, `${L}${F}`, `light`, `variable`, s, r, a$1)}${this.transformCSS(e, `${z}`, `dark`, `variable`, s, r, a$1)}`, p = [.../* @__PURE__ */ new Set([
				...I,
				...R,
				...B
			])], m = `${this.transformCSS(e, `${U}${V}color-scheme:light`, `light`, `variable`, s, r, a$1)}${this.transformCSS(e, `${G}color-scheme:dark`, `dark`, `variable`, s, r, a$1)}`, h = [.../* @__PURE__ */ new Set([
				...H,
				...W,
				...q
			])], g$1 = g(o.css, { dt: K });
		}
		return {
			primitive: {
				css: c,
				tokens: l
			},
			semantic: {
				css: u,
				tokens: p
			},
			global: {
				css: m,
				tokens: h
			},
			style: g$1
		};
	},
	getPreset({ name: e = ``, preset: t = {}, options: n, params: r, set: a$2, defaults: o, selector: s }) {
		let c, l, u;
		if (a(t) && n.transform !== `strict`) {
			var _C$declarations, _w$declarations, _T$declarations;
			let r = e.replace(`-directive`, ``), { colorScheme: p, extend: m, css: h } = t, g$2 = M$1(t, `colorScheme`, `extend`, `css`), _ = m === null || m === void 0 ? void 0 : m.colorScheme, v = M$1(m, `colorScheme`), y = p === null || p === void 0 ? void 0 : p.dark, b = M$1(p, `dark`), x = _ === null || _ === void 0 ? void 0 : _.dark, S = M$1(_, `dark`), C = a(g$2) ? this._toVariables({ [r]: _objectSpread2(_objectSpread2({}, g$2), v) }, n) : {}, w = a(b) ? this._toVariables({ [r]: _objectSpread2(_objectSpread2({}, b), S) }, n) : {}, T = a(y) ? this._toVariables({ [r]: _objectSpread2(_objectSpread2({}, y), x) }, n) : {}, [E, D] = [(_C$declarations = C.declarations) !== null && _C$declarations !== void 0 ? _C$declarations : ``, C.tokens || []], [O, k] = [(_w$declarations = w.declarations) !== null && _w$declarations !== void 0 ? _w$declarations : ``, w.tokens || []], [A, j] = [(_T$declarations = T.declarations) !== null && _T$declarations !== void 0 ? _T$declarations : ``, T.tokens || []];
			c = `${this.transformCSS(r, `${O}${E}`, `light`, `variable`, n, a$2, o, s)}${this.transformCSS(r, A, `dark`, `variable`, n, a$2, o, s)}`, l = [.../* @__PURE__ */ new Set([
				...D,
				...k,
				...j
			])], u = g(h, { dt: K });
		}
		return {
			css: c,
			tokens: l,
			style: u
		};
	},
	getPresetC({ name: e = ``, theme: t = {}, params: n, set: r, defaults: i }) {
		var _a$components;
		let { preset: a, options: o } = t, s = a === null || a === void 0 || (_a$components = a.components) === null || _a$components === void 0 ? void 0 : _a$components[e];
		return this.getPreset({
			name: e,
			preset: s,
			options: o,
			params: n,
			set: r,
			defaults: i
		});
	},
	getPresetD({ name: e = ``, theme: t = {}, params: n, set: r, defaults: i }) {
		var _o$components, _o$directives;
		let a = e.replace(`-directive`, ``), { preset: o, options: s } = t, c = (o === null || o === void 0 || (_o$components = o.components) === null || _o$components === void 0 ? void 0 : _o$components[a]) || (o === null || o === void 0 || (_o$directives = o.directives) === null || _o$directives === void 0 ? void 0 : _o$directives[a]);
		return this.getPreset({
			name: a,
			preset: c,
			options: s,
			params: n,
			set: r,
			defaults: i
		});
	},
	applyDarkColorScheme(e) {
		return e.darkModeSelector !== `none` && e.darkModeSelector !== !1;
	},
	getColorSchemeOption(e, t) {
		var _e$darkModeSelector;
		return this.applyDarkColorScheme(e) ? this.regex.resolve(e.darkModeSelector === !0 ? t.options.darkModeSelector : (_e$darkModeSelector = e.darkModeSelector) !== null && _e$darkModeSelector !== void 0 ? _e$darkModeSelector : t.options.darkModeSelector) : [];
	},
	getLayerOrder(e, t = {}, n, r) {
		let { cssLayer: i } = t;
		return i ? `@layer ${g(i.order || i.name || `optimus`, n)}` : ``;
	},
	getCommonStyleSheet({ name: e = ``, theme: t = {}, params: n, props: r = {}, set: i, defaults: a }) {
		let s = this.getCommon({
			name: e,
			theme: t,
			params: n,
			set: i,
			defaults: a
		}), c = Object.entries(r).reduce((e, [t, n]) => e.push(`${t}="${n}"`) && e, []).join(` `);
		return Object.entries(s || {}).reduce((e, [t, n]) => {
			if (l$1(n) && Object.hasOwn(n, `css`)) {
				let r = A$2(n.css), i = `${t}-variables`;
				e.push(`<style type="text/css" data-optimus-style-id="${i}" ${c}>${r}</style>`);
			}
			return e;
		}, []).join(``);
	},
	getStyleSheet({ name: e = ``, theme: t = {}, params: n, props: r = {}, set: i, defaults: a }) {
		var _ref;
		let o = {
			name: e,
			theme: t,
			params: n,
			set: i,
			defaults: a
		}, s = (_ref = e.includes(`-directive`) ? this.getPresetD(o) : this.getPresetC(o)) === null || _ref === void 0 ? void 0 : _ref.css, c = Object.entries(r).reduce((e, [t, n]) => e.push(`${t}="${n}"`) && e, []).join(` `);
		return s ? `<style type="text/css" data-optimus-style-id="${e}-variables" ${c}>${A$2(s)}</style>` : ``;
	},
	createTokens(e = {}, t, n = ``, i = ``, a = {}) {
		let s = function(e, t = {}, n = []) {
			if (n.includes(this.path)) return console.warn(`Circular reference detected at ${this.path}`), {
				colorScheme: e,
				path: this.path,
				paths: t,
				value: void 0
			};
			n.push(this.path), t.name = this.path, t.binding || (t.binding = {});
			let i = this.value;
			if (typeof this.value == `string` && x.test(this.value)) {
				let r = this.value.trim().replace(x, (r) => {
					var _o$value;
					let i = r.slice(1, -1), a = this.tokens[i];
					if (!a) return console.warn(`Token not found for path: ${i}`), `__UNRESOLVED__`;
					let o = a.computed(e, t, n);
					return Array.isArray(o) && o.length === 2 ? `light-dark(${o[0].value},${o[1].value})` : (_o$value = o === null || o === void 0 ? void 0 : o.value) !== null && _o$value !== void 0 ? _o$value : `__UNRESOLVED__`;
				});
				i = S.test(r.replace(C, `0`)) ? `calc(${r})` : r;
			}
			return e$1(t.binding) && delete t.binding, n.pop(), {
				colorScheme: e,
				path: this.path,
				paths: t,
				value: i.includes(`__UNRESOLVED__`) ? void 0 : i
			};
		}, l = (e, n, r) => {
			Object.entries(e).forEach(([e, i]) => {
				let u = O$1(e, t.variable.excludedKeyRegex) ? n : n ? `${n}.${w(e)}` : w(e), d = r ? `${r}.${e}` : e;
				l$1(i) ? l(i, u, d) : (a[u] || (a[u] = {
					paths: [],
					computed: (e, t = {}, n = []) => {
						if (a[u].paths.length === 1) return a[u].paths[0].computed(a[u].paths[0].scheme, t.binding, n);
						if (e && e !== `none`) for (let r = 0; r < a[u].paths.length; r++) {
							let i = a[u].paths[r];
							if (i.scheme === e) return i.computed(e, t.binding, n);
						}
						return a[u].paths.map((e) => e.computed(e.scheme, t[e.scheme], n));
					}
				}), a[u].paths.push({
					path: d,
					value: i,
					scheme: d.includes(`colorScheme.light`) ? `light` : d.includes(`colorScheme.dark`) ? `dark` : `none`,
					computed: s,
					tokens: a
				}));
			});
		};
		return l(e, n, i), a;
	},
	getTokenValue(e, t, n) {
		var _e$r;
		let r = ((e) => e.split(`.`).filter((e) => !O$1(e.toLowerCase(), n.variable.excludedKeyRegex)).join(`.`))(t), i = t.includes(`colorScheme.light`) ? `light` : t.includes(`colorScheme.dark`) ? `dark` : void 0, a = [(_e$r = e[r]) === null || _e$r === void 0 ? void 0 : _e$r.computed(i)].flat().filter((e) => e);
		return a.length === 1 ? a[0].value : a.reduce((e = {}, t) => {
			let { colorScheme: n } = t;
			return e[n] = _objectWithoutProperties(t, _excluded), e;
		}, void 0);
	},
	getSelectorRule(e, t, n, r) {
		return n === `class` || n === `attr` ? F(a(t) ? `${e}${t},${e} ${t}` : e, r) : F(e, F(t !== null && t !== void 0 ? t : `:root,:host`, r));
	},
	transformCSS(e, t, n, r, a$3 = {}, s, c, l) {
		if (a(t)) {
			let { cssLayer: u } = a$3;
			if (r !== `style`) {
				let e = this.getColorSchemeOption(a$3, c);
				t = n === `dark` ? e.reduce((e, { type: n, selector: r }) => (a(r) && (e += r.includes(`[CSS]`) ? r.replace(`[CSS]`, t) : this.getSelectorRule(r, l, n, t)), e), ``) : F(l !== null && l !== void 0 ? l : `:root,:host`, t);
			}
			if (u) {
				let n = {
					name: `optimus`,
					order: `optimus`
				};
				l$1(u) && (n.name = g(u.name, {
					name: e,
					type: r
				})), a(n.name) && (t = F(`@layer ${n.name}`, t), s === null || s === void 0 || s.layerNames(n.name));
			}
			return t;
		}
		return ``;
	}
};
var Q = {
	defaults: {
		variable: {
			prefix: `p`,
			selector: `:root,:host`,
			excludedKeyRegex: /^(primitive|semantic|components|directives|variables|colorscheme|light|dark|common|root|states|extend|css)$/gi
		},
		options: {
			prefix: `p`,
			darkModeSelector: `system`,
			cssLayer: !1
		}
	},
	_theme: void 0,
	_layerNames: /* @__PURE__ */ new Set(),
	_loadedStyleNames: /* @__PURE__ */ new Set(),
	_loadingStyles: /* @__PURE__ */ new Set(),
	_tokens: {},
	update(e = {}) {
		let { theme: t } = e;
		t && (this._theme = _objectSpread2(_objectSpread2({}, t), {}, { options: _objectSpread2(_objectSpread2({}, this.defaults.options), t.options) }), this._tokens = Z.createTokens(this.preset, this.defaults), this.clearLoadedStyleNames());
	},
	get theme() {
		return this._theme;
	},
	get preset() {
		var _this$theme;
		return ((_this$theme = this.theme) === null || _this$theme === void 0 ? void 0 : _this$theme.preset) || {};
	},
	get options() {
		var _this$theme2;
		return ((_this$theme2 = this.theme) === null || _this$theme2 === void 0 ? void 0 : _this$theme2.options) || {};
	},
	get tokens() {
		return this._tokens;
	},
	getTheme() {
		return this.theme;
	},
	setTheme(e) {
		this.update({ theme: e }), b.emit(`theme:change`, e);
	},
	getPreset() {
		return this.preset;
	},
	setPreset(e) {
		this._theme = _objectSpread2(_objectSpread2({}, this.theme), {}, { preset: e }), this._tokens = Z.createTokens(e, this.defaults), this.clearLoadedStyleNames(), b.emit(`preset:change`, e), b.emit(`theme:change`, this.theme);
	},
	getOptions() {
		return this.options;
	},
	setOptions(e) {
		this._theme = _objectSpread2(_objectSpread2({}, this.theme), {}, { options: e }), this.clearLoadedStyleNames(), b.emit(`options:change`, e), b.emit(`theme:change`, this.theme);
	},
	getLayerNames() {
		return [...this._layerNames];
	},
	setLayerNames(e) {
		this._layerNames.add(e);
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
		return Z.getTokenValue(this.tokens, e, this.defaults);
	},
	getCommon(e = ``, t) {
		return Z.getCommon({
			name: e,
			theme: this.theme,
			params: t,
			defaults: this.defaults,
			set: { layerNames: this.setLayerNames.bind(this) }
		});
	},
	getComponent(e = ``, t) {
		let n = {
			name: e,
			theme: this.theme,
			params: t,
			defaults: this.defaults,
			set: { layerNames: this.setLayerNames.bind(this) }
		};
		return Z.getPresetC(n);
	},
	getDirective(e = ``, t) {
		let n = {
			name: e,
			theme: this.theme,
			params: t,
			defaults: this.defaults,
			set: { layerNames: this.setLayerNames.bind(this) }
		};
		return Z.getPresetD(n);
	},
	getCustomPreset(e = ``, t, n, r) {
		let i = {
			name: e,
			preset: t,
			options: this.options,
			selector: n,
			params: r,
			defaults: this.defaults,
			set: { layerNames: this.setLayerNames.bind(this) }
		};
		return Z.getPreset(i);
	},
	getLayerOrderCSS(e = ``) {
		return Z.getLayerOrder(e, this.options, { names: this.getLayerNames() }, this.defaults);
	},
	transformCSS(e = ``, t, n = `style`, r) {
		return Z.transformCSS(e, t, r, n, this.options, { layerNames: this.setLayerNames.bind(this) }, this.defaults);
	},
	getCommonStyleSheet(e = ``, t, n = {}) {
		return Z.getCommonStyleSheet({
			name: e,
			theme: this.theme,
			params: t,
			props: n,
			defaults: this.defaults,
			set: { layerNames: this.setLayerNames.bind(this) }
		});
	},
	getStyleSheet(e, t, n = {}) {
		return Z.getStyleSheet({
			name: e,
			theme: this.theme,
			params: t,
			props: n,
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
		this._loadingStyles.size && (this._loadingStyles.delete(t), b.emit(`theme:${t}:load`, e), !this._loadingStyles.size && b.emit(`theme:load`));
	}
};
//#endregion
//#region node_modules/@openng/optimus-ui-styles/dist/base/index.mjs
var style = `
    *,
    ::before,
    ::after {
        box-sizing: border-box;
    }

    .p-collapsible-enter-active {
        animation: p-animate-collapsible-expand 0.2s ease-out;
        overflow: hidden;
    }

    .p-collapsible-leave-active {
        animation: p-animate-collapsible-collapse 0.2s ease-out;
        overflow: hidden;
    }

    @keyframes p-animate-collapsible-expand {
        from {
            grid-template-rows: 0fr;
        }
        to {
            grid-template-rows: 1fr;
        }
    }

    @keyframes p-animate-collapsible-collapse {
        from {
            grid-template-rows: 1fr;
        }
        to {
            grid-template-rows: 0fr;
        }
    }

    .p-disabled,
    .p-disabled * {
        cursor: default;
        pointer-events: none;
        user-select: none;
    }

    .p-disabled,
    .p-component:disabled {
        opacity: dt('disabled.opacity');
    }

    .pi {
        font-size: dt('icon.size');
    }

    .p-icon {
        width: dt('icon.size');
        height: dt('icon.size');
    }

    .p-overlay-mask {
        background: var(--px-mask-background, dt('mask.background'));
        color: dt('mask.color');
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
    }

    .p-overlay-mask-enter-active {
        animation: p-animate-overlay-mask-enter dt('mask.transition.duration') forwards;
    }

    .p-overlay-mask-leave-active {
        animation: p-animate-overlay-mask-leave dt('mask.transition.duration') forwards;
    }

    @keyframes p-animate-overlay-mask-enter {
        from {
            background: transparent;
        }
        to {
            background: var(--px-mask-background, dt('mask.background'));
        }
    }
    @keyframes p-animate-overlay-mask-leave {
        from {
            background: var(--px-mask-background, dt('mask.background'));
        }
        to {
            background: transparent;
        }
    }

    .p-anchored-overlay-enter-active {
        animation: p-animate-anchored-overlay-enter 300ms cubic-bezier(.19,1,.22,1);
    }

    .p-anchored-overlay-leave-active {
        animation: p-animate-anchored-overlay-leave 300ms cubic-bezier(.19,1,.22,1);
    }

    @keyframes p-animate-anchored-overlay-enter {
        from {
            opacity: 0;
            transform: scale(0.93);
        }
    }

    @keyframes p-animate-anchored-overlay-leave {
        to {
            opacity: 0;
            transform: scale(0.93);
        }
    }
`;
//#endregion
//#region node_modules/@openng/optimus-ui/fesm2022/openng-optimus-ui-usestyle.mjs
var _UseStyle;
var _id = 0;
var UseStyle = class {
	constructor() {
		_defineProperty(this, "document", inject(DOCUMENT));
	}
	use(css, options = {}) {
		let cssRef = css;
		let styleRef = null;
		const { immediate = true, manual = false, name = `style_${++_id}`, id = void 0, media = void 0, nonce = void 0, first = false, props = {} } = options;
		if (!this.document) return;
		styleRef = this.document.querySelector(`style[data-optimus-style-id="${name}"]`) || id && this.document.getElementById(id) || this.document.createElement("style");
		if (styleRef) {
			if (!styleRef.isConnected) {
				cssRef = css;
				const HEAD = this.document.head;
				Ie(styleRef, "nonce", nonce);
				first && HEAD.firstChild ? HEAD.insertBefore(styleRef, HEAD.firstChild) : HEAD.appendChild(styleRef);
				A$1(styleRef, {
					type: "text/css",
					media,
					nonce,
					"data-optimus-style-id": name
				});
			}
			if (styleRef.textContent !== cssRef) styleRef.textContent = cssRef;
		}
		return {
			id,
			name,
			el: styleRef,
			css: cssRef
		};
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
//#region node_modules/@openng/optimus-ui/fesm2022/openng-optimus-ui-base.mjs
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
			const computedStyle = transform(J`${g(style, { dt: K })}`);
			return computedStyle ? this.useStyle.use(A$2(computedStyle), _objectSpread2({ name: this.name }, options)) : {};
		});
		_defineProperty(this, "loadCSS", (options = {}) => {
			return this.load(this.css, options);
		});
		_defineProperty(this, "loadStyle", (options = {}, style = "") => {
			return this.load(this.style, options, (computedStyle = "") => Q.transformCSS(options.name || this.name, `${computedStyle}${J`${style}`}`));
		});
		_defineProperty(this, "loadBaseCSS", (options = {}) => {
			return this.load(css, options);
		});
		_defineProperty(this, "loadBaseStyle", (options = {}, style$1 = "") => {
			return this.load(style, options, (computedStyle = "") => Q.transformCSS(options.name || this.name, `${computedStyle}${J`${style$1}`}`));
		});
		_defineProperty(this, "getCommonTheme", (params) => {
			return Q.getCommon(this.name, params);
		});
		_defineProperty(this, "getComponentTheme", (params) => {
			return Q.getComponent(this.name, params);
		});
		_defineProperty(this, "getPresetTheme", (preset, selector, params) => {
			return Q.getCustomPreset(this.name, preset, selector, params);
		});
		_defineProperty(this, "getLayerOrderThemeCSS", () => {
			return Q.getLayerOrderCSS(this.name);
		});
		_defineProperty(this, "getStyleSheet", (extendedCSS = "", props = {}) => {
			if (this.css) {
				const _css = g(this.css, { dt: K });
				const _style = A$2(J`${_css}${extendedCSS}`);
				const _props = Object.entries(props).reduce((acc, [k, v]) => acc.push(`${k}="${v}"`) && acc, []).join(" ");
				return `<style type="text/css" data-optimus-style-id="${this.name}" ${_props}>${_style}</style>`;
			}
			return "";
		});
		_defineProperty(this, "getCommonThemeStyleSheet", (params, props = {}) => {
			return Q.getCommonStyleSheet(this.name, params, props);
		});
		_defineProperty(this, "getThemeStyleSheet", (params, props = {}) => {
			let css = [Q.getStyleSheet(this.name, params, props)];
			if (this.style) {
				const name = this.name === "base" ? "global-style" : `${this.name}-style`;
				const _css = J`${g(this.style, { dt: K })}`;
				const _style = A$2(Q.transformCSS(name, _css));
				const _props = Object.entries(props).reduce((acc, [k, v]) => acc.push(`${k}="${v}"`) && acc, []).join(" ");
				css.push(`<style type="text/css" data-optimus-style-id="${name}" ${_props}>${_style}</style>`);
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
//#region node_modules/@openng/optimus-ui/fesm2022/openng-optimus-ui-config.mjs
var _ThemeProvider;
var _Optimus;
var ThemeProvider = class {
	constructor() {
		_defineProperty(this, "theme", signal(void 0, ...ngDevMode ? [{ debugName: "theme" }] : /* istanbul ignore next */ []));
		_defineProperty(this, "csp", signal({ nonce: void 0 }, ...ngDevMode ? [{ debugName: "csp" }] : /* istanbul ignore next */ []));
		_defineProperty(this, "isThemeChanged", false);
		_defineProperty(this, "document", inject(DOCUMENT));
		_defineProperty(this, "baseStyle", inject(BaseStyle));
		effect(() => {
			b.on("theme:change", (newTheme) => {
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
		Q.clearLoadedStyleNames();
		b.clear();
	}
	onThemeChange(value) {
		Q.setTheme(value);
		if (this.document) this.loadCommonTheme();
	}
	loadCommonTheme() {
		if (this.theme() === "none") return;
		if (!Q.isStyleNameLoaded("common")) {
			var _this$baseStyle$getCo, _this$baseStyle, _this$csp;
			const { primitive, semantic, global, style } = ((_this$baseStyle$getCo = (_this$baseStyle = this.baseStyle).getCommonTheme) === null || _this$baseStyle$getCo === void 0 ? void 0 : _this$baseStyle$getCo.call(_this$baseStyle)) || {};
			const styleOptions = { nonce: (_this$csp = this.csp) === null || _this$csp === void 0 || (_this$csp = _this$csp.call(this)) === null || _this$csp === void 0 ? void 0 : _this$csp.nonce };
			this.baseStyle.load(primitive === null || primitive === void 0 ? void 0 : primitive.css, _objectSpread2({ name: "primitive-variables" }, styleOptions));
			this.baseStyle.load(semantic === null || semantic === void 0 ? void 0 : semantic.css, _objectSpread2({ name: "semantic-variables" }, styleOptions));
			this.baseStyle.load(global === null || global === void 0 ? void 0 : global.css, _objectSpread2({ name: "global-variables" }, styleOptions));
			this.baseStyle.loadBaseStyle(_objectSpread2({ name: "global-style" }, styleOptions), style);
			Q.setLoadedStyleName("common");
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
var Optimus = class extends ThemeProvider {
	constructor(..._args) {
		super(..._args);
		_defineProperty(this, "ripple", signal(false, ...ngDevMode ? [{ debugName: "ripple" }] : /* istanbul ignore next */ []));
		_defineProperty(this, "platformId", inject(PLATFORM_ID));
		_defineProperty(
			this,
			/**
			* @deprecated Since v20. Use `inputVariant` instead.
			*/
			"inputStyle",
			signal(null, ...ngDevMode ? [{ debugName: "inputStyle" }] : /* istanbul ignore next */ [])
		);
		_defineProperty(this, "inputVariant", signal(null, ...ngDevMode ? [{ debugName: "inputVariant" }] : /* istanbul ignore next */ []));
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
				home: "Home",
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
	getTranslation(key) {
		return this.translation[key];
	}
	setTranslation(value) {
		this.translation = _objectSpread2(_objectSpread2({}, this.translation), value);
		this.translationSource.next(this.translation);
	}
	setConfig(config) {
		const { csp, ripple, inputStyle, inputVariant, theme, overlayOptions, translation, filterMatchModeOptions, overlayAppendTo, zIndex, ptOptions, pt, unstyled } = config || {};
		if (csp) this.csp.set(csp);
		if (overlayAppendTo) this.overlayAppendTo.set(overlayAppendTo);
		if (ripple) this.ripple.set(ripple);
		if (inputStyle) this.inputStyle.set(inputStyle);
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
_Optimus = Optimus;
_defineProperty(Optimus, "ɵfac", /*@__PURE__*/ (() => {
	let ɵOptimus_BaseFactory = void 0;
	return function Optimus_Factory(__ngFactoryType__) {
		return (ɵOptimus_BaseFactory || (ɵOptimus_BaseFactory = ɵɵgetInheritedFactory(_Optimus)))(__ngFactoryType__ || _Optimus);
	};
})());
_defineProperty(Optimus, "ɵprov", /*@__PURE__*/ ɵɵdefineInjectable({
	token: _Optimus,
	factory: _Optimus.ɵfac,
	providedIn: "root"
}));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(Optimus, [{
		type: Injectable,
		args: [{ providedIn: "root" }]
	}], null, null);
})();
var OPTIMUS_CONFIG = new InjectionToken("OPTIMUS_CONFIG");
function provideOptimus(...features) {
	const providers = features === null || features === void 0 ? void 0 : features.map((feature) => ({
		provide: OPTIMUS_CONFIG,
		useValue: feature,
		multi: false
	}));
	const initializer = provideAppInitializer(() => {
		const config = inject(Optimus);
		features === null || features === void 0 || features.forEach((feature) => config.setConfig(feature));
	});
	return makeEnvironmentProviders([...providers, initializer]);
}
//#endregion
export { q$1 as _, BaseStyle as a, v as b, b as c, Me as d, W as f, n as g, l as h, provideOptimus as i, J$1 as l, j$1 as m, Optimus as n, base as o, _e as p, ThemeProvider as r, Q as s, OPTIMUS_CONFIG as t, L as u, s as v, t as y };
