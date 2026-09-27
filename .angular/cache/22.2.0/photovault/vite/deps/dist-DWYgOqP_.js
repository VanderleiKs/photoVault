//#region node_modules/@primeuix/utils/dist/object/index.mjs
function p(e) {
	return e == null || e === "" || Array.isArray(e) && e.length === 0 || !(e instanceof Date) && typeof e == "object" && Object.keys(e).length === 0;
}
function O(e, t, n) {
	if (e === t || e !== e && t !== t) return !0;
	if (!e || !t || typeof e != "object" || typeof t != "object") return !1;
	n || (n = /* @__PURE__ */ new WeakMap());
	let r = n.get(e);
	if (r != null && r.has(t)) return !0;
	r || n.set(e, r = /* @__PURE__ */ new WeakSet()), r.add(t);
	let o = Array.isArray(e), u = Array.isArray(t), i = !0;
	if (o && u) {
		if (e.length !== t.length) i = !1;
		else for (let f = e.length; f-- !== 0;) if (!O(e[f], t[f], n)) {
			i = !1;
			break;
		}
	} else if (o !== u) i = !1;
	else {
		let f = e instanceof Date, a = t instanceof Date;
		if (f !== a) i = !1;
		else if (f && a) i = e.getTime() === t.getTime();
		else {
			let y = e instanceof RegExp, k = t instanceof RegExp;
			if (y !== k) i = !1;
			else if (y && k) i = e.toString() === t.toString();
			else if (e instanceof Map || t instanceof Map) {
				if (!(e instanceof Map && t instanceof Map) || e.size !== t.size) i = !1;
				else for (let [g, w] of e) if (!t.has(g) || !O(w, t.get(g), n)) {
					i = !1;
					break;
				}
			} else if (e instanceof Set || t instanceof Set) {
				if (!(e instanceof Set && t instanceof Set) || e.size !== t.size) i = !1;
				else for (let g of e) if (!t.has(g)) {
					i = !1;
					break;
				}
			} else {
				let g = Object.keys(e), w = g.length;
				if (w !== Object.keys(t).length) i = !1;
				else {
					for (let h = w; h-- !== 0;) if (!Object.prototype.hasOwnProperty.call(t, g[h])) {
						i = !1;
						break;
					}
					if (i) for (let h = w; h-- !== 0;) {
						let M = g[h];
						if (!O(e[M], t[M], n)) {
							i = !1;
							break;
						}
					}
				}
			}
		}
	}
	return i || r.delete(t), i;
}
function R(e, t) {
	return O(e, t);
}
function m(e) {
	return typeof e == "function" && "call" in e && "apply" in e;
}
function l(e) {
	return !p(e);
}
function d(e, t) {
	if (!e || !t) return null;
	let n = e;
	try {
		let r = n[t];
		if (l(r)) return r;
	} catch (r) {}
	if (Object.keys(n).length) {
		if (m(t)) return t(e);
		if (t.indexOf(".") === -1) return n[t];
		{
			let r = t.split("."), o = e;
			for (let u = 0, i = r.length; u < i; ++u) {
				if (o == null) return null;
				o = o[r[u]];
			}
			return o;
		}
	}
	return null;
}
function b(e, t, n) {
	return n ? d(e, n) === d(t, n) : R(e, t);
}
function s(e, t = !0) {
	return e instanceof Object && e.constructor === Object && (t || Object.keys(e).length !== 0);
}
function x$1(e, ...t) {
	return m(e) ? e(...t) : e;
}
function c(e, t = !0) {
	return typeof e == "string" && (t || e !== "");
}
function C(e) {
	return c(e) ? e.replace(/(-|_)/g, "").toLowerCase() : e;
}
function K(e, t = "", n = {}) {
	let r = C(t).split("."), o = r.shift();
	if (o) {
		if (s(e) || Array.isArray(e)) return K(x$1(e[Object.keys(e).find((i) => C(i) === o) || ""], n), r.join("."), n);
		return;
	}
	return x$1(e, n);
}
function A(e, t = !0) {
	return Array.isArray(e) && (t || e.length !== 0);
}
function Z(e) {
	return l(e) && !isNaN(e);
}
function H(e, t) {
	if (t) {
		t.lastIndex = 0;
		let n = t.test(e);
		return t.lastIndex = 0, n;
	}
	return !1;
}
function de(e, t) {
	let n = 0;
	for (; t - 1 - n >= 0 && e[t - 1 - n] === "\\";) n++;
	return n % 2 === 1;
}
function X(e) {
	return e.replace(/[\r\n\t]+/g, "").replace(/ {2,}/g, " ").replace(/ ([{:}]) /g, "$1").replace(/([;,]) /g, "$1").replace(/ !/g, "!").replace(/: /g, ":");
}
function B(e) {
	if (!e) return e;
	let t = "", n = "", r = 0;
	for (; r < e.length;) {
		let o = e[r];
		if (o === "/" && e[r + 1] === "*") {
			let u = e.indexOf("*/", r + 2);
			r = u === -1 ? e.length : u + 2;
		} else if (o === "\"" || o === "'") {
			t += X(n), n = "";
			let u = r + 1;
			for (; u < e.length && (e[u] !== o || de(e, u));) u++;
			t += e.slice(r, Math.min(u + 1, e.length)), r = u + 1;
		} else n += o, r++;
	}
	return (t + X(n)).trim();
}
function N(e = {}, t = "") {
	return Object.entries(e).reduce((n, [r, o]) => {
		let u = t ? `${t}.${r}` : r;
		return s(o) ? n = n.concat(N(o, u)) : n.push(u), n;
	}, []);
}
var xe = /[\xC0-\xFF\u0100-\u017E]/;
var j = {
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
	k: /[\u0137\u0138]/g,
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
function ee(e) {
	if (e && xe.test(e)) for (let t in j) e = e.replace(j[t], t);
	return e;
}
function fe(e) {
	return c(e) ? e.replace(/(_)/g, "-").replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase() : e;
}
function ae(e) {
	return c(e) ? e.replace(/[A-Z]/g, (t, n) => n === 0 ? t : "." + t.toLowerCase()).toLowerCase() : e;
}
//#endregion
export { s as _, K as a, ae as c, d, ee as f, p as g, m as h, H as i, b as l, l as m, B as n, N as o, fe as p, C as r, Z as s, A as t, c as u, x$1 as v };
