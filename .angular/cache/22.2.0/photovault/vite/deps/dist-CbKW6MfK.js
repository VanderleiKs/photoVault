import { t as _objectSpread2 } from "./objectSpread2-weooBxVk.js";
//#region node_modules/@openng/optimus-ui-utils/dist/object-BnaHlJGK.mjs
function e$1(e) {
	return e == null || e === `` || Array.isArray(e) && e.length === 0 || !(e instanceof Date) && typeof e == `object` && Object.keys(e).length === 0;
}
function n(e, t, r = /* @__PURE__ */ new WeakSet()) {
	if (e === t) return !0;
	if (!e || !t || typeof e != `object` || typeof t != `object` || r.has(e) || r.has(t)) return !1;
	r.add(e).add(t);
	let i = Array.isArray(e), a = Array.isArray(t), o, s, c;
	if (i && a) {
		if (s = e.length, s != t.length) return !1;
		for (o = s; o-- !== 0;) if (!n(e[o], t[o], r)) return !1;
		return !0;
	}
	if (i != a) return !1;
	let l = e instanceof Date, u = t instanceof Date;
	if (l != u) return !1;
	if (l && u) return e.getTime() == t.getTime();
	let d = e instanceof RegExp, f = t instanceof RegExp;
	if (d != f) return !1;
	if (d && f) return e.toString() == t.toString();
	let p = Object.keys(e);
	if (s = p.length, s !== Object.keys(t).length) return !1;
	for (o = s; o-- !== 0;) if (!Object.prototype.hasOwnProperty.call(t, p[o])) return !1;
	for (o = s; o-- !== 0;) if (c = p[o], !n(e[c], t[c], r)) return !1;
	return !0;
}
function r(e, t) {
	return n(e, t);
}
function i(e) {
	return typeof e == `function` && `call` in e && `apply` in e;
}
function a(t) {
	return !e$1(t);
}
function o(e, t) {
	if (!e || !t) return null;
	try {
		let n = e[t];
		if (a(n)) return n;
	} catch (_unused) {}
	if (Object.keys(e).length) {
		if (i(t)) return t(e);
		if (t.indexOf(`.`) === -1) return e[t];
		{
			let n = t.split(`.`), r = e;
			for (let e = 0, t = n.length; e < t; ++e) {
				if (r == null) return null;
				r = r[n[e]];
			}
			return r;
		}
	}
	return null;
}
function s(e, t, n) {
	return n ? o(e, n) === o(t, n) : r(e, t);
}
function l(e, t = !0) {
	return e instanceof Object && e.constructor === Object && (t || Object.keys(e).length !== 0);
}
function g(e, ...t) {
	return i(e) ? e(...t) : e;
}
function _(e, t = !0) {
	return typeof e == `string` && (t || e !== ``);
}
function v(e) {
	return _(e) ? e.replace(/(-|_)/g, ``).toLowerCase() : e;
}
function y(e, t = ``, n = {}) {
	let r = v(t).split(`.`), i = r.shift();
	return i ? l(e) ? y(g(e[Object.keys(e).find((e) => v(e) === i) || ``], n), r.join(`.`), n) : void 0 : g(e, n);
}
function x(e, t = !0) {
	return Array.isArray(e) && (t || e.length !== 0);
}
function w(e) {
	return a(e) && !isNaN(e);
}
function O(e, t) {
	if (t) {
		let n = t.test(e);
		return t.lastIndex = 0, n;
	}
	return !1;
}
function A(e) {
	return e && e.replace(/\/\*(?:(?!\*\/)[\s\S])*\*\/|[\r\n\t]+/g, ``).replace(/ {2,}/g, ` `).replace(/ ([{:}]) /g, `$1`).replace(/([;,]) /g, `$1`).replace(/ !/g, `!`).replace(/: /g, `:`).trim();
}
function M(e, ...t) {
	if (!l(e)) return e;
	let n = _objectSpread2({}, e);
	return t === null || t === void 0 || t.flat().forEach((e) => delete n[e]), n;
}
function N(e) {
	if (e && /[\xC0-\xFF\u0100-\u017E]/.test(e)) {
		let t = {
			A: /[\xC0-\xC5\u0100\u0102\u0104]/g,
			AE: /[\xC6]/g,
			C: /[\xC7\u0106\u0108\u010A\u010C]/g,
			D: /[\xD0\u010E\u0110]/g,
			E: /[\xC8-\xCB\u0112\u0114\u0116\u0118\u011A]/g,
			G: /[\u011C\u011E\u0120\u0122]/g,
			H: /[\u0124\u0126]/g,
			I: /[\xCC-\xCF\u0128\u012A\u012C\u012E\u0130]/g,
			IJ: /[\u0132]/g,
			J: /[\u0134]/g,
			K: /[\u0136]/g,
			L: /[\u0139\u013B\u013D\u013F\u0141]/g,
			N: /[\xD1\u0143\u0145\u0147\u014A]/g,
			O: /[\xD2-\xD6\xD8\u014C\u014E\u0150]/g,
			OE: /[\u0152]/g,
			R: /[\u0154\u0156\u0158]/g,
			S: /[\u015A\u015C\u015E\u0160]/g,
			T: /[\u0162\u0164\u0166]/g,
			U: /[\xD9-\xDC\u0168\u016A\u016C\u016E\u0170\u0172]/g,
			W: /[\u0174]/g,
			Y: /[\xDD\u0176\u0178]/g,
			Z: /[\u0179\u017B\u017D]/g,
			a: /[\xE0-\xE5\u0101\u0103\u0105]/g,
			ae: /[\xE6]/g,
			c: /[\xE7\u0107\u0109\u010B\u010D]/g,
			d: /[\u010F\u0111]/g,
			e: /[\xE8-\xEB\u0113\u0115\u0117\u0119\u011B]/g,
			g: /[\u011D\u011F\u0121\u0123]/g,
			i: /[\xEC-\xEF\u0129\u012B\u012D\u012F\u0131]/g,
			ij: /[\u0133]/g,
			j: /[\u0135]/g,
			k: /[\u0137,\u0138]/g,
			l: /[\u013A\u013C\u013E\u0140\u0142]/g,
			n: /[\xF1\u0144\u0146\u0148\u014B]/g,
			p: /[\xFE]/g,
			o: /[\xF2-\xF6\xF8\u014D\u014F\u0151]/g,
			oe: /[\u0153]/g,
			r: /[\u0155\u0157\u0159]/g,
			s: /[\u015B\u015D\u015F\u0161]/g,
			t: /[\u0163\u0165\u0167]/g,
			u: /[\xF9-\xFC\u0169\u016B\u016D\u016F\u0171\u0173]/g,
			w: /[\u0175]/g,
			y: /[\xFD\xFF\u0177]/g,
			z: /[\u017A\u017C\u017E]/g
		};
		for (let n in t) e = e.replace(t[n], n);
	}
	return e;
}
function V(e) {
	return _(e) ? e.replace(/(_)/g, `-`).replace(/([a-z])([A-Z])/g, `$1-$2`).toLowerCase() : e;
}
//#endregion
export { y as _, V as a, e$1 as c, l as d, o as f, x as g, w as h, O as i, g as l, v as m, M as n, _ as o, s as p, N as r, a as s, A as t, i as u };
