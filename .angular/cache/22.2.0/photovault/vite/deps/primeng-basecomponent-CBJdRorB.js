import { n as _defineProperty, t as _objectSpread2 } from "./objectSpread2-weooBxVk.js";
import { Bt as computed, Dl as signal, En as ElementRef, Fn as Injectable, Hc as PLATFORM_ID, In as Input, Mc as Injector, Ml as ɵɵdefineInjectable, Wi as setClassMetadata, X as input, bc as DestroyRef, gl as isSignal, io as ɵɵdefineDirective, ir as Renderer2, jc as InjectionToken, jo as ɵɵgetInheritedFactory, la as ɵɵNgOnChangesFeature, ol as effect, pl as inject, r as ChangeDetectorRef, ua as ɵɵProvidersFeature, wn as Directive, yc as DOCUMENT } from "./core-C91JEChX.js";
import { a as isPlatformServer } from "./common-C2OsAfsp.js";
import { r as c$1 } from "./primeng-bind-lNQcJjFS.js";
import { a as K, h as m$1, m as l$1, r as C, t as A, u as c$2, v as x$1 } from "./dist-DWYgOqP_.js";
import { a as showInvalidLicenseBanner, c as UseStyle, l as R, n as PrimeNG, o as BaseStyle, s as base, u as S } from "./primeng-config-E0BbIPgU.js";
//#region node_modules/@primeuix/utils/dist/mergeprops/index.mjs
var c = Object.defineProperty;
var d = Object.getOwnPropertySymbols;
var x = Object.prototype.hasOwnProperty;
var y = Object.prototype.propertyIsEnumerable;
var m = (t, o, e) => o in t ? c(t, o, {
	enumerable: !0,
	configurable: !0,
	writable: !0,
	value: e
}) : t[o] = e;
var l = (t, o) => {
	for (var e in o || (o = {})) x.call(o, e) && m(t, e, o[e]);
	if (d) for (var e of d(o)) y.call(o, e) && m(t, e, o[e]);
	return t;
};
function i(...t) {
	let o = [];
	for (let e = 0; e < t.length; e++) {
		let n = t[e];
		if (!n) continue;
		let r = typeof n;
		if (r === "string" || r === "number") o.push(n);
		else if (r === "object") {
			let a = Array.isArray(n) ? [i(...n)] : Object.entries(n).map(([s, f]) => f ? s : void 0);
			o = a.length ? o.concat(a.filter((s) => !!s)) : o;
		}
	}
	return o.join(" ").trim();
}
function u(t) {
	return typeof t == "function" && "call" in t && "apply" in t;
}
function p({ skipUndefined: t = !1 }, ...o) {
	return o == null ? void 0 : o.reduce((e, n = {}) => {
		for (let r in n) {
			let a = n[r];
			if (!(t && a === void 0)) if (r === "style") e.style = l(l({}, e.style), n.style);
			else if (r === "class" || r === "className") e[r] = i(e[r], n[r]);
			else if (u(a)) {
				let s = e[r];
				e[r] = s ? (...f) => {
					s(...f), a(...f);
				} : a;
			} else e[r] = a;
		}
		return e;
	}, {});
}
function F(...t) {
	return p({ skipUndefined: !1 }, ...t);
}
//#endregion
//#region node_modules/@primeuix/utils/dist/uuid/index.mjs
var t = {};
function s(n = "pui_id_") {
	return Object.hasOwn(t, n) || (t[n] = 0), t[n]++, `${n}${t[n]}`;
}
//#endregion
//#region node_modules/primeng/fesm2022/primeng-basecomponent.mjs
var _BaseComponentStyle;
var _BaseComponent;
var BaseComponentStyle = class extends BaseStyle {
	constructor(..._args) {
		super(..._args);
		_defineProperty(this, "name", "common");
	}
};
_BaseComponentStyle = BaseComponentStyle;
_defineProperty(BaseComponentStyle, "ɵfac", /*@__PURE__*/ (() => {
	let ɵBaseComponentStyle_BaseFactory = void 0;
	return function BaseComponentStyle_Factory(__ngFactoryType__) {
		return (ɵBaseComponentStyle_BaseFactory || (ɵBaseComponentStyle_BaseFactory = ɵɵgetInheritedFactory(_BaseComponentStyle)))(__ngFactoryType__ || _BaseComponentStyle);
	};
})());
_defineProperty(BaseComponentStyle, "ɵprov", /*@__PURE__*/ ɵɵdefineInjectable({
	token: _BaseComponentStyle,
	factory: _BaseComponentStyle.ɵfac,
	providedIn: "root"
}));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(BaseComponentStyle, [{
		type: Injectable,
		args: [{ providedIn: "root" }]
	}], null, null);
})();
var PARENT_INSTANCE = new InjectionToken("PARENT_INSTANCE");
var BaseComponent = class {
	get $name() {
		return this["componentName"] || "UnknownComponent";
	}
	get $hostName() {
		const hostName = this["hostName"];
		return isSignal(hostName) ? hostName() : hostName;
	}
	get $el() {
		var _this$el;
		return (_this$el = this.el) === null || _this$el === void 0 ? void 0 : _this$el.nativeElement;
	}
	get $globalPT() {
		var _this$config;
		return this._getPT((_this$config = this.config) === null || _this$config === void 0 ? void 0 : _this$config.pt(), void 0, (value) => x$1(value, this.$params));
	}
	get $defaultPT() {
		var _this$config2;
		return this._getPT((_this$config2 = this.config) === null || _this$config2 === void 0 ? void 0 : _this$config2.pt(), void 0, (value) => this._getOptionValue(value, this.$hostName || this.$name, this.$params) || x$1(value, this.$params));
	}
	get $style() {
		if (!this._$styleCache) this._$styleCache = _objectSpread2(_objectSpread2({
			theme: void 0,
			css: void 0,
			classes: void 0,
			inlineStyles: void 0
		}, (this._getHostInstance(this) || {}).$style), this["_componentStyle"]);
		return this._$styleCache;
	}
	get $styleOptions() {
		var _this$config3;
		return { nonce: (_this$config3 = this.config) === null || _this$config3 === void 0 ? void 0 : _this$config3.csp().nonce };
	}
	get $params() {
		if (!this._$paramsCache) {
			const parentInstance = this._getHostInstance(this) || this.$parentInstance;
			this._$paramsCache = {
				instance: this,
				parent: { instance: parentInstance }
			};
		}
		return this._$paramsCache;
	}
	/******************** Lifecycle Hooks ********************/
	onInit() {}
	onChanges(_changes) {}
	onDoCheck() {}
	onAfterContentInit() {}
	onAfterContentChecked() {}
	onAfterViewInit() {}
	onAfterViewChecked() {}
	onDestroy() {}
	/******************** Angular Lifecycle Hooks ********************/
	constructor() {
		var _inject;
		_defineProperty(this, "document", inject(DOCUMENT));
		_defineProperty(this, "platformId", inject(PLATFORM_ID));
		_defineProperty(this, "el", inject(ElementRef));
		_defineProperty(this, "injector", inject(Injector));
		_defineProperty(this, "cd", inject(ChangeDetectorRef));
		_defineProperty(this, "renderer", inject(Renderer2));
		_defineProperty(this, "config", inject(PrimeNG));
		_defineProperty(this, "$parentInstance", (_inject = inject(PARENT_INSTANCE, {
			optional: true,
			skipSelf: true
		})) !== null && _inject !== void 0 ? _inject : void 0);
		_defineProperty(this, "baseComponentStyle", inject(BaseComponentStyle));
		_defineProperty(this, "baseStyle", inject(BaseStyle));
		_defineProperty(this, "scopedStyleEl", void 0);
		_defineProperty(this, "parent", this.$params.parent);
		_defineProperty(this, "cn", c$1);
		_defineProperty(this, "_themeScopedListener", void 0);
		_defineProperty(this, "themeChangeListenerMap", /* @__PURE__ */ new Map());
		_defineProperty(
			this,
			/******************** Inputs ********************/
			/**
			* Defines scoped design tokens of the component.
			* @defaultValue undefined
			* @group Props
			*/
			"dt",
			input(...ngDevMode ? [void 0, { debugName: "dt" }] : /* istanbul ignore next */ [])
		);
		_defineProperty(
			this,
			/**
			* Indicates whether the component should be rendered without styles.
			* @defaultValue undefined
			* @group Props
			*/
			"unstyled",
			input(...ngDevMode ? [void 0, { debugName: "unstyled" }] : /* istanbul ignore next */ [])
		);
		_defineProperty(
			this,
			/**
			* Used to pass attributes to DOM elements inside the component.
			* @defaultValue undefined
			* @group Props
			*/
			"pt",
			input(...ngDevMode ? [void 0, { debugName: "pt" }] : /* istanbul ignore next */ [])
		);
		_defineProperty(
			this,
			/**
			* Used to configure passthrough(pt) options of the component.
			* @group Props
			* @defaultValue undefined
			*/
			"ptOptions",
			input(...ngDevMode ? [void 0, { debugName: "ptOptions" }] : /* istanbul ignore next */ [])
		);
		_defineProperty(
			this,
			/******************** Computed ********************/
			"$attrSelector",
			s("pc")
		);
		_defineProperty(this, "directivePT", signal(void 0, ...ngDevMode ? [{ debugName: "directivePT" }] : /* istanbul ignore next */ []));
		_defineProperty(this, "directiveUnstyled", signal(void 0, ...ngDevMode ? [{ debugName: "directiveUnstyled" }] : /* istanbul ignore next */ []));
		_defineProperty(this, "$unstyled", computed(() => {
			var _ref, _ref2, _this$unstyled, _this$config4;
			return (_ref = (_ref2 = (_this$unstyled = this.unstyled()) !== null && _this$unstyled !== void 0 ? _this$unstyled : this.directiveUnstyled()) !== null && _ref2 !== void 0 ? _ref2 : (_this$config4 = this.config) === null || _this$config4 === void 0 ? void 0 : _this$config4.unstyled()) !== null && _ref !== void 0 ? _ref : false;
		}, ...ngDevMode ? [{ debugName: "$unstyled" }] : /* istanbul ignore next */ []));
		_defineProperty(this, "$pt", computed(() => x$1(this.pt() || this.directivePT(), this.$params), ...ngDevMode ? [{ debugName: "$pt" }] : /* istanbul ignore next */ []));
		_defineProperty(this, "_$styleCache", void 0);
		_defineProperty(this, "_$paramsCache", void 0);
		this._shareStylesWithShadowRoot();
		effect((onCleanup) => {
			if (this.document && !isPlatformServer(this.platformId)) {
				if (this.dt()) {
					this._loadScopedThemeStyles(this.dt());
					this._themeScopedListener = () => this._loadScopedThemeStyles(this.dt());
					this._themeChangeListener("_themeScopedListener", this._themeScopedListener);
				} else this._unloadScopedThemeStyles();
			}
			onCleanup(() => {
				this._offThemeChangeListener("_themeScopedListener");
			});
		});
		effect((onCleanup) => {
			if (this.document && !isPlatformServer(this.platformId)) {
				if (!this.$unstyled()) {
					this._loadCoreStyles();
					this._themeChangeListener("_loadCoreStyles", this._loadCoreStyles);
				}
			}
			onCleanup(() => {
				this._offThemeChangeListener("_loadCoreStyles");
			});
		});
		this._hook("onBeforeInit");
	}
	/**
	* ⚠ Do not override ngOnInit!
	*
	* Use 'onInit()' in subclasses instead.
	*/
	ngOnInit() {
		this._$paramsCache = void 0;
		this._$styleCache = void 0;
		this._loadCoreStyles();
		this._loadStyles();
		this.onInit();
		this._hook("onInit");
	}
	/**
	* ⚠ Do not override ngOnChanges!
	*
	* Use 'onChanges(changes: SimpleChanges)' in subclasses instead.
	*/
	ngOnChanges(changes) {
		this.onChanges(changes);
		this._hook("onChanges", changes);
	}
	/**
	* ⚠ Do not override ngDoCheck!
	*
	* Use 'onDoCheck()' in subclasses instead.
	*/
	ngDoCheck() {
		this.onDoCheck();
		this._hook("onDoCheck");
	}
	/**
	* ⚠ Do not override ngAfterContentInit!
	*
	* Use 'onAfterContentInit()' in subclasses instead.
	*/
	ngAfterContentInit() {
		this.onAfterContentInit();
		this._hook("onAfterContentInit");
	}
	/**
	* ⚠ Do not override ngAfterContentChecked!
	*
	* Use 'onAfterContentChecked()' in subclasses instead.
	*/
	ngAfterContentChecked() {
		this.onAfterContentChecked();
		this._hook("onAfterContentChecked");
	}
	/**
	* ⚠ Do not override ngAfterViewInit!
	*
	* Use 'onAfterViewInit()' in subclasses instead.
	*/
	ngAfterViewInit() {
		var _this$$el, _this$config5;
		(_this$$el = this.$el) === null || _this$$el === void 0 || _this$$el.setAttribute(this.$attrSelector, "");
		if (((_this$config5 = this.config) === null || _this$config5 === void 0 ? void 0 : _this$config5.verified()) === false) showInvalidLicenseBanner();
		this.onAfterViewInit();
		this._hook("onAfterViewInit");
	}
	/**
	* ⚠ Do not override ngAfterViewChecked!
	*
	* Use 'onAfterViewChecked()' in subclasses instead.
	*/
	ngAfterViewChecked() {
		this.onAfterViewChecked();
		this._hook("onAfterViewChecked");
	}
	/**
	* ⚠ Do not override ngOnDestroy!
	*
	* Use 'onDestroy()' in subclasses instead.
	*/
	ngOnDestroy() {
		this._removeThemeListeners();
		this._unloadScopedThemeStyles();
		this.onDestroy();
		this._hook("onDestroy");
	}
	/******************** Methods ********************/
	_mergeProps(fn, ...args) {
		return m$1(fn) ? fn(...args) : F(...args);
	}
	_getHostInstance(instance) {
		return instance ? this.$hostName ? this.$name === this.$hostName ? instance : this._getHostInstance(instance.$parentInstance) : instance.$parentInstance : void 0;
	}
	_getPropValue(name) {
		var _this$_getHostInstanc;
		return this[name] || ((_this$_getHostInstanc = this._getHostInstance(this)) === null || _this$_getHostInstanc === void 0 ? void 0 : _this$_getHostInstanc[name]);
	}
	_getOptionValue(options, key = "", params = {}) {
		return K(options, key, params);
	}
	_hook(hookName, ...args) {
		var _this$config6;
		if (this.$hostName) return;
		if (!this.pt() && !this.directivePT() && !((_this$config6 = this.config) === null || _this$config6 === void 0 ? void 0 : _this$config6.pt())) return;
		const selfHook = this._usePT(this._getPT(this.$pt(), this.$name), this._getOptionValue, `hooks.${hookName}`);
		const defaultHook = this._useDefaultPT(this._getOptionValue, `hooks.${hookName}`);
		selfHook === null || selfHook === void 0 || selfHook(...args);
		defaultHook === null || defaultHook === void 0 || defaultHook(...args);
	}
	/********** Load Styles **********/
	_load() {
		if (!base.isStyleNameLoaded("base")) {
			this.baseStyle.loadBaseCSS(this.$styleOptions);
			this._loadGlobalStyles();
			base.setLoadedStyleName("base");
		}
		this._loadThemeStyles();
	}
	_loadStyles() {
		this._load();
		this._themeChangeListener("_load", () => this._load());
	}
	_shareStylesWithShadowRoot() {
		var _this$$el2, _this$$el2$getRootNod;
		if (isPlatformServer(this.platformId)) return;
		const rootNode = (_this$$el2 = this.$el) === null || _this$$el2 === void 0 || (_this$$el2$getRootNod = _this$$el2.getRootNode) === null || _this$$el2$getRootNod === void 0 ? void 0 : _this$$el2$getRootNod.call(_this$$el2);
		if (typeof ShadowRoot === "undefined" || !(rootNode instanceof ShadowRoot)) return;
		inject(DestroyRef).onDestroy(inject(UseStyle).addShadowRoot(rootNode));
	}
	_loadGlobalStyles() {
		const globalCSS = this._useGlobalPT(this._getOptionValue, "global.css", this.$params);
		if (l$1(globalCSS)) this.baseStyle.load(globalCSS, _objectSpread2({ name: "global" }, this.$styleOptions));
	}
	_loadCoreStyles() {
		var _this$$style, _this$$style2;
		if (!base.isStyleNameLoaded((_this$$style = this.$style) === null || _this$$style === void 0 ? void 0 : _this$$style.name) && ((_this$$style2 = this.$style) === null || _this$$style2 === void 0 ? void 0 : _this$$style2.name)) {
			this.baseComponentStyle.loadCSS(this.$styleOptions);
			this.$style.loadCSS(this.$styleOptions);
			base.setLoadedStyleName(this.$style.name);
		}
	}
	_loadThemeStyles() {
		var _this$config7, _this$$style4, _this$$style5;
		if (this.$unstyled() || ((_this$config7 = this.config) === null || _this$config7 === void 0 ? void 0 : _this$config7.theme()) === "none") return;
		if (!S.isStyleNameLoaded("common")) {
			var _this$$style3, _this$$style3$getComm;
			const { primitive, semantic, global, style } = ((_this$$style3 = this.$style) === null || _this$$style3 === void 0 || (_this$$style3$getComm = _this$$style3.getCommonTheme) === null || _this$$style3$getComm === void 0 ? void 0 : _this$$style3$getComm.call(_this$$style3)) || {};
			this.baseStyle.load(primitive === null || primitive === void 0 ? void 0 : primitive.css, _objectSpread2({
				name: "primitive-variables",
				variables: true
			}, this.$styleOptions));
			this.baseStyle.load(semantic === null || semantic === void 0 ? void 0 : semantic.css, _objectSpread2({
				name: "semantic-variables",
				variables: true
			}, this.$styleOptions));
			this.baseStyle.load(global === null || global === void 0 ? void 0 : global.css, _objectSpread2({
				name: "global-variables",
				variables: true
			}, this.$styleOptions));
			this.baseStyle.loadBaseStyle(_objectSpread2({ name: "global-style" }, this.$styleOptions), style);
			S.setLoadedStyleName("common");
		}
		if (!S.isStyleNameLoaded((_this$$style4 = this.$style) === null || _this$$style4 === void 0 ? void 0 : _this$$style4.name) && ((_this$$style5 = this.$style) === null || _this$$style5 === void 0 ? void 0 : _this$$style5.name)) {
			var _this$$style6, _this$$style6$getComp, _this$$style7, _this$$style8, _this$$style9, _this$$style10, _this$$style11;
			const { css, style } = ((_this$$style6 = this.$style) === null || _this$$style6 === void 0 || (_this$$style6$getComp = _this$$style6.getComponentTheme) === null || _this$$style6$getComp === void 0 ? void 0 : _this$$style6$getComp.call(_this$$style6)) || {};
			(_this$$style7 = this.$style) === null || _this$$style7 === void 0 || _this$$style7.load(css, _objectSpread2({
				name: `${(_this$$style8 = this.$style) === null || _this$$style8 === void 0 ? void 0 : _this$$style8.name}-variables`,
				variables: true
			}, this.$styleOptions));
			(_this$$style9 = this.$style) === null || _this$$style9 === void 0 || _this$$style9.loadStyle(_objectSpread2({ name: `${(_this$$style10 = this.$style) === null || _this$$style10 === void 0 ? void 0 : _this$$style10.name}-style` }, this.$styleOptions), style);
			S.setLoadedStyleName((_this$$style11 = this.$style) === null || _this$$style11 === void 0 ? void 0 : _this$$style11.name);
		}
		if (!S.isStyleNameLoaded("layer-order")) {
			var _this$$style12, _this$$style12$getLay;
			const layerOrder = (_this$$style12 = this.$style) === null || _this$$style12 === void 0 || (_this$$style12$getLay = _this$$style12.getLayerOrderThemeCSS) === null || _this$$style12$getLay === void 0 ? void 0 : _this$$style12$getLay.call(_this$$style12);
			this.baseStyle.load(layerOrder, _objectSpread2({
				name: "layer-order",
				first: true
			}, this.$styleOptions));
			S.setLoadedStyleName("layer-order");
		}
	}
	_loadScopedThemeStyles(preset) {
		var _this$config8, _this$$style13, _this$$style14, _this$$style14$getPre, _this$$style15, _this$$style16;
		if (((_this$config8 = this.config) === null || _this$config8 === void 0 || (_this$config8 = _this$config8.theme()) === null || _this$config8 === void 0 || (_this$config8 = _this$config8.options) === null || _this$config8 === void 0 ? void 0 : _this$config8.cssVariables) === false && ((_this$$style13 = this.$style) === null || _this$$style13 === void 0 ? void 0 : _this$$style13.name)) {
			if (S.addScopedToken({ [this.$style.name]: preset })) {
				S.deleteLoadedStyleName(this.$style.name);
				this._loadThemeStyles();
			}
		}
		const { css } = ((_this$$style14 = this.$style) === null || _this$$style14 === void 0 || (_this$$style14$getPre = _this$$style14.getPresetTheme) === null || _this$$style14$getPre === void 0 ? void 0 : _this$$style14$getPre.call(_this$$style14, preset, `[${this.$attrSelector}]`)) || {};
		const scopedStyle = (_this$$style15 = this.$style) === null || _this$$style15 === void 0 ? void 0 : _this$$style15.load(css, _objectSpread2({ name: `${this.$attrSelector}-${(_this$$style16 = this.$style) === null || _this$$style16 === void 0 ? void 0 : _this$$style16.name}` }, this.$styleOptions));
		this.scopedStyleEl = scopedStyle === null || scopedStyle === void 0 ? void 0 : scopedStyle.el;
	}
	_unloadScopedThemeStyles() {
		var _this$$style17;
		this.baseStyle.useStyle.remove(`${this.$attrSelector}-${(_this$$style17 = this.$style) === null || _this$$style17 === void 0 ? void 0 : _this$$style17.name}`);
	}
	_themeChangeListener(id, callback = () => {}) {
		this._offThemeChangeListener(id);
		base.clearLoadedStyleNames();
		const hold = callback.bind(this);
		this.themeChangeListenerMap.set(id, hold);
		R.on("theme:change", hold);
	}
	_removeThemeListeners() {
		this._offThemeChangeListener("_themeScopedListener");
		this._offThemeChangeListener("_loadCoreStyles");
		this._offThemeChangeListener("_load");
	}
	_offThemeChangeListener(id) {
		if (this.themeChangeListenerMap.has(id)) {
			R.off("theme:change", this.themeChangeListenerMap.get(id));
			this.themeChangeListenerMap.delete(id);
		}
	}
	/********** Passthrough **********/
	_getPTValue(obj = {}, key = "", params = {}, searchInDefaultPT = true) {
		var _this$_getPropValue, _this$config9, _this$config9$ptOptio;
		const searchOut = /./g.test(key) && !!params[key.split(".")[0]];
		const { mergeSections = true, mergeProps: useMergeProps = false } = ((_this$_getPropValue = this._getPropValue("ptOptions")) === null || _this$_getPropValue === void 0 ? void 0 : _this$_getPropValue()) || ((_this$config9 = this.config) === null || _this$config9 === void 0 || (_this$config9$ptOptio = _this$config9["ptOptions"]) === null || _this$config9$ptOptio === void 0 ? void 0 : _this$config9$ptOptio.call(_this$config9)) || {};
		const global = searchInDefaultPT ? searchOut ? this._useGlobalPT(this._getPTClassValue, key, params) : this._useDefaultPT(this._getPTClassValue, key, params) : void 0;
		const self = searchOut ? void 0 : this._usePT(this._getPT(obj, this.$hostName || this.$name), this._getPTClassValue, key, _objectSpread2(_objectSpread2({}, params), {}, { global: global || {} }));
		const datasets = this._getPTDatasets(key);
		return mergeSections || !mergeSections && self ? useMergeProps ? this._mergeProps(useMergeProps, global, self, datasets) : _objectSpread2(_objectSpread2(_objectSpread2({}, global), self), datasets) : _objectSpread2(_objectSpread2({}, self), datasets);
	}
	_getPTDatasets(key = "") {
		var _this$$pt, _this$$pt2, _key$split$at;
		const datasetPrefix = "data-pc-";
		const isExtended = key === "root" && l$1((_this$$pt = this.$pt()) === null || _this$$pt === void 0 ? void 0 : _this$$pt["data-pc-section"]);
		return key !== "transition" && _objectSpread2(_objectSpread2({}, key === "root" && _objectSpread2(_objectSpread2({ [`${datasetPrefix}name`]: C(isExtended ? (_this$$pt2 = this.$pt()) === null || _this$$pt2 === void 0 ? void 0 : _this$$pt2["data-pc-section"] : this.$name) }, isExtended && { [`${datasetPrefix}extend`]: C(this.$name) }), {}, { [`${this.$attrSelector}`]: "" })), {}, { [`${datasetPrefix}section`]: C(key.includes(".") ? (_key$split$at = key.split(".").at(-1)) !== null && _key$split$at !== void 0 ? _key$split$at : "" : key) });
	}
	_getPTClassValue(options, key, params) {
		const value = this._getOptionValue(options, key, params);
		return c$2(value) || A(value) ? { class: value } : value;
	}
	_getPT(pt, key = "", callback) {
		const getValue = (value, checkSameKey = false) => {
			var _ref3;
			const computedValue = callback ? callback(value) : value;
			const _key = C(key);
			const _cKey = C(this.$hostName || this.$name);
			return (_ref3 = checkSameKey ? _key !== _cKey ? computedValue === null || computedValue === void 0 ? void 0 : computedValue[_key] : void 0 : computedValue === null || computedValue === void 0 ? void 0 : computedValue[_key]) !== null && _ref3 !== void 0 ? _ref3 : computedValue;
		};
		return pt != null && Object.prototype.hasOwnProperty.call(pt, "_usept") ? {
			_usept: pt["_usept"],
			originalValue: getValue(pt.originalValue),
			value: getValue(pt.value)
		} : getValue(pt, true);
	}
	_usePT(pt, callback, key, params) {
		const fn = (value) => callback === null || callback === void 0 ? void 0 : callback.call(this, value, key, params);
		if (pt != null && Object.prototype.hasOwnProperty.call(pt, "_usept")) {
			var _this$config10;
			const { mergeSections = true, mergeProps: useMergeProps = false } = pt["_usept"] || ((_this$config10 = this.config) === null || _this$config10 === void 0 ? void 0 : _this$config10["ptOptions"]()) || {};
			const originalValue = fn(pt.originalValue);
			const value = fn(pt.value);
			if (originalValue === void 0 && value === void 0) return void 0;
			else if (c$2(value)) return value;
			else if (c$2(originalValue)) return originalValue;
			return mergeSections || !mergeSections && value ? useMergeProps ? this._mergeProps(useMergeProps, originalValue, value) : _objectSpread2(_objectSpread2({}, originalValue), value) : value;
		}
		return fn(pt);
	}
	_useGlobalPT(callback, key, params) {
		return this._usePT(this.$globalPT, callback, key, params);
	}
	_useDefaultPT(callback, key, params) {
		return this._usePT(this.$defaultPT, callback, key, params);
	}
	/******************** Exposed API ********************/
	ptm(key = "", params = {}) {
		return this._getPTValue(this.$pt(), key, _objectSpread2(_objectSpread2({}, this.$params), params));
	}
	ptms(keys, params = {}) {
		return keys.reduce((acc, arg) => {
			acc = F(acc, this.ptm(arg, params)) || {};
			return acc;
		}, {});
	}
	ptmo(obj = {}, key = "", params = {}) {
		return this._getPTValue(obj, key, _objectSpread2({ instance: this }, params), false);
	}
	cx(key, params = {}) {
		return !this.$unstyled() ? c$1(this._getOptionValue(this.$style.classes, key, _objectSpread2(_objectSpread2({}, this.$params), params))) : void 0;
	}
	sx(key = "", when = true, params = {}) {
		if (when) {
			const self = this._getOptionValue(this.$style.inlineStyles, key, _objectSpread2(_objectSpread2({}, this.$params), params));
			const base = this._getOptionValue(this.baseComponentStyle.inlineStyles, key, _objectSpread2(_objectSpread2({}, this.$params), params));
			return _objectSpread2(_objectSpread2({}, base), self);
		}
	}
	translate(key, subKey) {
		const value = this.config.getTranslation(key);
		return subKey ? value === null || value === void 0 ? void 0 : value[subKey] : value;
	}
};
_BaseComponent = BaseComponent;
_defineProperty(BaseComponent, "ɵfac", function BaseComponent_Factory(__ngFactoryType__) {
	return new (__ngFactoryType__ || _BaseComponent)();
});
_defineProperty(BaseComponent, "ɵdir", /*@__PURE__*/ ɵɵdefineDirective({
	type: _BaseComponent,
	inputs: {
		dt: [1, "dt"],
		unstyled: [1, "unstyled"],
		pt: [1, "pt"],
		ptOptions: [1, "ptOptions"]
	},
	features: [ɵɵProvidersFeature([BaseComponentStyle, BaseStyle]), ɵɵNgOnChangesFeature]
}));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(BaseComponent, [{
		type: Directive,
		args: [{
			standalone: true,
			providers: [BaseComponentStyle, BaseStyle]
		}]
	}], () => [], {
		dt: [{
			type: Input,
			args: [{
				isSignal: true,
				alias: "dt",
				required: false
			}]
		}],
		unstyled: [{
			type: Input,
			args: [{
				isSignal: true,
				alias: "unstyled",
				required: false
			}]
		}],
		pt: [{
			type: Input,
			args: [{
				isSignal: true,
				alias: "pt",
				required: false
			}]
		}],
		ptOptions: [{
			type: Input,
			args: [{
				isSignal: true,
				alias: "ptOptions",
				required: false
			}]
		}]
	});
})();
//#endregion
export { PARENT_INSTANCE as n, BaseComponent as t };
