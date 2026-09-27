import { n as _defineProperty } from "./objectSpread2-weooBxVk.js";
import { Bt as computed, Dl as signal, En as ElementRef, In as Input, Nl as ɵɵdefineInjector, Sa as ɵɵclassMap, Vs as ɵɵstyleMap, Wi as setClassMetadata, X as input, ao as ɵɵdefineNgModule, co as ɵɵdirectiveInject, fc as _objectWithoutProperties, io as ɵɵdefineDirective, ir as Renderer2, ol as effect, qn as NgModule, wn as Directive } from "./core-C91JEChX.js";
import { p as s } from "./dist-CbKW6MfK.js";
//#region node_modules/@openng/optimus-ui-utils/dist/classnames/index.mjs
function e(...t) {
	if (t) {
		let n = [];
		for (let r = 0; r < t.length; r++) {
			let i = t[r];
			if (!i) continue;
			let a = typeof i;
			if (a === `string` || a === `number`) n.push(i);
			else if (a === `object`) {
				let t = Array.isArray(i) ? [e(...i)] : Object.entries(i).map(([e, t]) => t ? e : void 0);
				n = t.length ? n.concat(t.filter((e) => !!e)) : n;
			}
		}
		return n.join(` `).trim();
	}
}
//#endregion
//#region node_modules/@openng/optimus-ui/fesm2022/openng-optimus-ui-bind.mjs
var _excluded = ["style", "class"];
var _Bind;
var _BindModule;
/**
* Bind directive provides dynamic attribute, property, and event listener binding functionality.
* @group Components
*/
var Bind = class {
	constructor(el, renderer) {
		_defineProperty(this, "el", void 0);
		_defineProperty(this, "renderer", void 0);
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
			return e((_this$attrs2 = this.attrs()) === null || _this$attrs2 === void 0 ? void 0 : _this$attrs2.class);
		}, ...ngDevMode ? [{ debugName: "classes" }] : /* istanbul ignore next */ []));
		_defineProperty(this, "listeners", []);
		this.el = el;
		this.renderer = renderer;
		effect(() => {
			const _ref = this.attrs() || {}, { style, class: className } = _ref, rest = _objectWithoutProperties(_ref, _excluded);
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
		if (!s(this._attrs(), attrs)) this._attrs.set(attrs);
	}
	clearListeners() {
		this.listeners.forEach(({ unlisten }) => unlisten());
		this.listeners = [];
	}
};
_Bind = Bind;
_defineProperty(Bind, "ɵfac", function Bind_Factory(__ngFactoryType__) {
	return new (__ngFactoryType__ || _Bind)(ɵɵdirectiveInject(ElementRef), ɵɵdirectiveInject(Renderer2));
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
	}], () => [{ type: ElementRef }, { type: Renderer2 }], { pBind: [{
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
export { BindModule as n, e as r, Bind as t };
