import { n as _defineProperty } from "./objectSpread2-weooBxVk.js";
import { Bt as computed, Dl as signal, En as ElementRef, In as Input, Nl as ɵɵdefineInjector, Sa as ɵɵclassMap, Vs as ɵɵstyleMap, Wi as setClassMetadata, X as input, ao as ɵɵdefineNgModule, io as ɵɵdefineDirective, ir as Renderer2, ol as effect, pl as inject, qn as NgModule, wn as Directive } from "./core-C91JEChX.js";
import { l as b } from "./dist-DWYgOqP_.js";
//#region node_modules/@primeuix/utils/dist/classnames/index.mjs
function c(...e) {
	let t = [];
	for (let s = 0; s < e.length; s++) {
		let n = e[s];
		if (!n) continue;
		let r = typeof n;
		if (r === "string" || r === "number") t.push(n);
		else if (r === "object") {
			let o = Array.isArray(n) ? [c(...n)] : Object.entries(n).map(([i, u]) => u ? i : void 0);
			t = o.length ? t.concat(o.filter((i) => !!i)) : t;
		}
	}
	return t.join(" ").trim();
}
//#endregion
//#region node_modules/primeng/fesm2022/primeng-bind.mjs
var _Bind;
var _BindModule;
/**
* Bind directive provides dynamic attribute, property, and event listener binding functionality.
* @group Components
*/
var Bind = class {
	constructor() {
		_defineProperty(
			this,
			/**
			* Dynamic attributes, properties, and event listeners to be applied to the host element.
			* @group Props
			*/
			"pBind",
			input(void 0, ...ngDevMode ? [{ debugName: "pBind" }] : /* istanbul ignore next */ [])
		);
		_defineProperty(this, "_attrs", signal(void 0, ...ngDevMode ? [{ debugName: "_attrs" }] : /* istanbul ignore next */ []));
		_defineProperty(this, "attrs", computed(() => this._attrs() || this.pBind(), ...ngDevMode ? [{ debugName: "attrs" }] : /* istanbul ignore next */ []));
		_defineProperty(this, "styles", computed(() => {
			var _this$attrs;
			return (_this$attrs = this.attrs()) === null || _this$attrs === void 0 ? void 0 : _this$attrs.style;
		}, ...ngDevMode ? [{ debugName: "styles" }] : /* istanbul ignore next */ []));
		_defineProperty(this, "classes", computed(() => {
			var _this$attrs2;
			return c((_this$attrs2 = this.attrs()) === null || _this$attrs2 === void 0 ? void 0 : _this$attrs2.class);
		}, ...ngDevMode ? [{ debugName: "classes" }] : /* istanbul ignore next */ []));
		_defineProperty(this, "listeners", []);
		_defineProperty(this, "el", inject(ElementRef));
		_defineProperty(this, "renderer", inject(Renderer2));
		effect(() => {
			const attrs = this.attrs() || {};
			const rest = Object.fromEntries(Object.entries(attrs).filter(([key]) => key !== "style" && key !== "class"));
			for (const [key, value] of Object.entries(rest)) if (key.startsWith("on") && typeof value === "function") {
				const eventName = key.slice(2).toLowerCase();
				if (!this.listeners.some((l) => l.eventName === eventName)) {
					const unlisten = this.renderer.listen(this.el.nativeElement, eventName, value);
					this.listeners.push({
						eventName,
						unlisten
					});
				}
			} else if (value === null || value === void 0) this.renderer.removeAttribute(this.el.nativeElement, key);
			else {
				this.renderer.setAttribute(this.el.nativeElement, key, value.toString());
				if (key in this.el.nativeElement) this.el.nativeElement[key] = value;
			}
		});
	}
	ngOnDestroy() {
		this.clearListeners();
	}
	setAttrs(attrs) {
		if (!b(this._attrs(), attrs)) this._attrs.set(attrs);
	}
	clearListeners() {
		this.listeners.forEach(({ unlisten }) => unlisten());
		this.listeners = [];
	}
};
_Bind = Bind;
_defineProperty(Bind, "ɵfac", function Bind_Factory(__ngFactoryType__) {
	return new (__ngFactoryType__ || _Bind)();
});
_defineProperty(Bind, "ɵdir", /*@__PURE__*/ ɵɵdefineDirective({
	type: _Bind,
	selectors: [[
		"",
		"pBind",
		""
	]],
	hostVars: 4,
	hostBindings: function Bind_HostBindings(rf, ctx) {
		if (rf & 2) {
			ɵɵstyleMap(ctx.styles());
			ɵɵclassMap(ctx.classes());
		}
	},
	inputs: { pBind: [1, "pBind"] }
}));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(Bind, [{
		type: Directive,
		args: [{
			selector: "[pBind]",
			standalone: true,
			host: {
				"[style]": "styles()",
				"[class]": "classes()"
			}
		}]
	}], () => [], { pBind: [{
		type: Input,
		args: [{
			isSignal: true,
			alias: "pBind",
			required: false
		}]
	}] });
})();
var BindModule = class {};
_BindModule = BindModule;
_defineProperty(BindModule, "ɵfac", function BindModule_Factory(__ngFactoryType__) {
	return new (__ngFactoryType__ || _BindModule)();
});
_defineProperty(BindModule, "ɵmod", /*@__PURE__*/ ɵɵdefineNgModule({
	type: _BindModule,
	imports: [Bind],
	exports: [Bind]
}));
_defineProperty(BindModule, "ɵinj", /*@__PURE__*/ ɵɵdefineInjector({}));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(BindModule, [{
		type: NgModule,
		args: [{
			imports: [Bind],
			exports: [Bind]
		}]
	}], null, null);
})();
//#endregion
export { BindModule as n, c as r, Bind as t };
