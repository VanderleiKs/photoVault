import { n as _defineProperty, t as _objectSpread2 } from "./objectSpread2-weooBxVk.js";
import { Bt as computed, Dl as signal, En as ElementRef, Fn as Injectable, Hc as PLATFORM_ID, In as Input, Mc as Injector, Ml as ɵɵdefineInjectable, Wi as setClassMetadata, X as input, io as ɵɵdefineDirective, ir as Renderer2, jc as InjectionToken, jo as ɵɵgetInheritedFactory, la as ɵɵNgOnChangesFeature, ol as effect, pl as inject, r as ChangeDetectorRef, ua as ɵɵProvidersFeature, wn as Directive, yc as DOCUMENT } from "./core-C91JEChX.js";
import { a as isPlatformServer } from "./common-C2OsAfsp.js";
import { r as e$1 } from "./openng-optimus-ui-bind-D2jYyy13.js";
import { _ as y, g as x, l as g, m as v, o as _, s as a, u as i } from "./dist-CbKW6MfK.js";
import { a as BaseStyle, c as b, n as Optimus, o as base, s as Q } from "./openng-optimus-ui-config-BMpCoNuW.js";
//#region node_modules/@openng/optimus-ui-utils/dist/mergeprops/index.mjs
function n({ skipUndefined: n = !1 }, ...r) {
	return r === null || r === void 0 ? void 0 : r.reduce((r, i$1 = {}) => {
		for (let a in i$1) {
			let o = i$1[a];
			if (!(n && o === void 0)) if (a === `style`) r.style = _objectSpread2(_objectSpread2({}, r.style), i$1.style);
			else if (a === `class` || a === `className`) r[a] = e$1(r[a], i$1[a]);
			else if (i(o)) {
				let e = r[a];
				r[a] = e ? (...t) => {
					e(...t), o(...t);
				} : o;
			} else r[a] = o;
		}
		return r;
	}, {});
}
function r(...e) {
	return n({ skipUndefined: !1 }, ...e);
}
//#endregion
//#region node_modules/@openng/optimus-ui-utils/dist/uuid/index.mjs
var e = {};
function t(t = `pui_id_`) {
	return Object.hasOwn(e, t) || (e[t] = 0), e[t]++, `${t}${e[t]}`;
}
//#endregion
//#region node_modules/@openng/optimus-ui/fesm2022/openng-optimus-ui-basecomponent.mjs
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
		return this["hostName"];
	}
	get $el() {
		var _this$el;
		return (_this$el = this.el) === null || _this$el === void 0 ? void 0 : _this$el.nativeElement;
	}
	get $globalPT() {
		var _this$config;
		return this._getPT((_this$config = this.config) === null || _this$config === void 0 ? void 0 : _this$config.pt(), void 0, (value) => g(value, this.$params));
	}
	get $defaultPT() {
		var _this$config2;
		return this._getPT((_this$config2 = this.config) === null || _this$config2 === void 0 ? void 0 : _this$config2.pt(), void 0, (value) => this._getOptionValue(value, this.$hostName || this.$name, this.$params) || g(value, this.$params));
	}
	get $style() {
		return _objectSpread2(_objectSpread2({
			theme: void 0,
			css: void 0,
			classes: void 0,
			inlineStyles: void 0
		}, (this._getHostInstance(this) || {}).$style), this["_componentStyle"]);
	}
	get $styleOptions() {
		var _this$config3;
		return { nonce: (_this$config3 = this.config) === null || _this$config3 === void 0 ? void 0 : _this$config3.csp().nonce };
	}
	get $params() {
		const parentInstance = this._getHostInstance(this) || this.$parentInstance;
		return {
			instance: this,
			parent: { instance: parentInstance }
		};
	}
	/******************** Lifecycle Hooks ********************/
	onInit() {}
	onChanges(changes) {}
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
		_defineProperty(this, "config", inject(Optimus));
		_defineProperty(this, "$parentInstance", (_inject = inject(PARENT_INSTANCE, {
			optional: true,
			skipSelf: true
		})) !== null && _inject !== void 0 ? _inject : void 0);
		_defineProperty(this, "baseComponentStyle", inject(BaseComponentStyle));
		_defineProperty(this, "baseStyle", inject(BaseStyle));
		_defineProperty(this, "scopedStyleEl", void 0);
		_defineProperty(this, "parent", this.$params.parent);
		_defineProperty(this, "cn", e$1);
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
			t("pc")
		);
		_defineProperty(this, "directivePT", signal(void 0, ...ngDevMode ? [{ debugName: "directivePT" }] : /* istanbul ignore next */ []));
		_defineProperty(this, "directiveUnstyled", signal(void 0, ...ngDevMode ? [{ debugName: "directiveUnstyled" }] : /* istanbul ignore next */ []));
		_defineProperty(this, "$unstyled", computed(() => {
			var _ref, _ref2, _this$unstyled, _this$config4;
			return (_ref = (_ref2 = (_this$unstyled = this.unstyled()) !== null && _this$unstyled !== void 0 ? _this$unstyled : this.directiveUnstyled()) !== null && _ref2 !== void 0 ? _ref2 : (_this$config4 = this.config) === null || _this$config4 === void 0 ? void 0 : _this$config4.unstyled()) !== null && _ref !== void 0 ? _ref : false;
		}, ...ngDevMode ? [{ debugName: "$unstyled" }] : /* istanbul ignore next */ []));
		_defineProperty(this, "$pt", computed(() => {
			return g(this.pt() || this.directivePT(), this.$params);
		}, ...ngDevMode ? [{ debugName: "$pt" }] : /* istanbul ignore next */ []));
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
		var _this$$el;
		(_this$$el = this.$el) === null || _this$$el === void 0 || _this$$el.setAttribute(this.$attrSelector, "");
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
		return i(fn) ? fn(...args) : r(...args);
	}
	_getHostInstance(instance) {
		return instance ? this.$hostName ? this.$name === this.$hostName ? instance : this._getHostInstance(instance.$parentInstance) : instance.$parentInstance : void 0;
	}
	_getPropValue(name) {
		var _this$_getHostInstanc;
		return this[name] || ((_this$_getHostInstanc = this._getHostInstance(this)) === null || _this$_getHostInstanc === void 0 ? void 0 : _this$_getHostInstanc[name]);
	}
	_getOptionValue(options, key = "", params = {}) {
		return y(options, key, params);
	}
	_hook(hookName, ...args) {
		if (!this.$hostName) {
			const selfHook = this._usePT(this._getPT(this.$pt(), this.$name), this._getOptionValue, `hooks.${hookName}`);
			const defaultHook = this._useDefaultPT(this._getOptionValue, `hooks.${hookName}`);
			selfHook === null || selfHook === void 0 || selfHook(...args);
			defaultHook === null || defaultHook === void 0 || defaultHook(...args);
		}
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
	_loadGlobalStyles() {
		const globalCSS = this._useGlobalPT(this._getOptionValue, "global.css", this.$params);
		a(globalCSS) && this.baseStyle.load(globalCSS, _objectSpread2({ name: "global" }, this.$styleOptions));
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
		var _this$config5, _this$$style4, _this$$style5;
		if (this.$unstyled() || ((_this$config5 = this.config) === null || _this$config5 === void 0 ? void 0 : _this$config5.theme()) === "none") return;
		if (!Q.isStyleNameLoaded("common")) {
			var _this$$style3, _this$$style3$getComm;
			const { primitive, semantic, global, style } = ((_this$$style3 = this.$style) === null || _this$$style3 === void 0 || (_this$$style3$getComm = _this$$style3.getCommonTheme) === null || _this$$style3$getComm === void 0 ? void 0 : _this$$style3$getComm.call(_this$$style3)) || {};
			this.baseStyle.load(primitive === null || primitive === void 0 ? void 0 : primitive.css, _objectSpread2({ name: "primitive-variables" }, this.$styleOptions));
			this.baseStyle.load(semantic === null || semantic === void 0 ? void 0 : semantic.css, _objectSpread2({ name: "semantic-variables" }, this.$styleOptions));
			this.baseStyle.load(global === null || global === void 0 ? void 0 : global.css, _objectSpread2({ name: "global-variables" }, this.$styleOptions));
			this.baseStyle.loadBaseStyle(_objectSpread2({ name: "global-style" }, this.$styleOptions), style);
			Q.setLoadedStyleName("common");
		}
		if (!Q.isStyleNameLoaded((_this$$style4 = this.$style) === null || _this$$style4 === void 0 ? void 0 : _this$$style4.name) && ((_this$$style5 = this.$style) === null || _this$$style5 === void 0 ? void 0 : _this$$style5.name)) {
			var _this$$style6, _this$$style6$getComp, _this$$style7, _this$$style8, _this$$style9, _this$$style10, _this$$style11;
			const { css, style } = ((_this$$style6 = this.$style) === null || _this$$style6 === void 0 || (_this$$style6$getComp = _this$$style6.getComponentTheme) === null || _this$$style6$getComp === void 0 ? void 0 : _this$$style6$getComp.call(_this$$style6)) || {};
			(_this$$style7 = this.$style) === null || _this$$style7 === void 0 || _this$$style7.load(css, _objectSpread2({ name: `${(_this$$style8 = this.$style) === null || _this$$style8 === void 0 ? void 0 : _this$$style8.name}-variables` }, this.$styleOptions));
			(_this$$style9 = this.$style) === null || _this$$style9 === void 0 || _this$$style9.loadStyle(_objectSpread2({ name: `${(_this$$style10 = this.$style) === null || _this$$style10 === void 0 ? void 0 : _this$$style10.name}-style` }, this.$styleOptions), style);
			Q.setLoadedStyleName((_this$$style11 = this.$style) === null || _this$$style11 === void 0 ? void 0 : _this$$style11.name);
		}
		if (!Q.isStyleNameLoaded("layer-order")) {
			var _this$$style12, _this$$style12$getLay;
			const layerOrder = (_this$$style12 = this.$style) === null || _this$$style12 === void 0 || (_this$$style12$getLay = _this$$style12.getLayerOrderThemeCSS) === null || _this$$style12$getLay === void 0 ? void 0 : _this$$style12$getLay.call(_this$$style12);
			this.baseStyle.load(layerOrder, _objectSpread2({
				name: "layer-order",
				first: true
			}, this.$styleOptions));
			Q.setLoadedStyleName("layer-order");
		}
	}
	_loadScopedThemeStyles(preset) {
		var _this$$style13, _this$$style13$getPre, _this$$style14, _this$$style15;
		const { css } = ((_this$$style13 = this.$style) === null || _this$$style13 === void 0 || (_this$$style13$getPre = _this$$style13.getPresetTheme) === null || _this$$style13$getPre === void 0 ? void 0 : _this$$style13$getPre.call(_this$$style13, preset, `[${this.$attrSelector}]`)) || {};
		const scopedStyle = (_this$$style14 = this.$style) === null || _this$$style14 === void 0 ? void 0 : _this$$style14.load(css, _objectSpread2({ name: `${this.$attrSelector}-${(_this$$style15 = this.$style) === null || _this$$style15 === void 0 ? void 0 : _this$$style15.name}` }, this.$styleOptions));
		this.scopedStyleEl = scopedStyle === null || scopedStyle === void 0 ? void 0 : scopedStyle.el;
	}
	_unloadScopedThemeStyles() {
		var _this$scopedStyleEl;
		(_this$scopedStyleEl = this.scopedStyleEl) === null || _this$scopedStyleEl === void 0 || _this$scopedStyleEl.remove();
	}
	_themeChangeListener(id, callback = () => {}) {
		this._offThemeChangeListener(id);
		base.clearLoadedStyleNames();
		const hold = callback.bind(this);
		this.themeChangeListenerMap.set(id, hold);
		b.on("theme:change", hold);
	}
	_removeThemeListeners() {
		this._offThemeChangeListener("_themeScopedListener");
		this._offThemeChangeListener("_loadCoreStyles");
		this._offThemeChangeListener("_load");
	}
	_offThemeChangeListener(id) {
		if (this.themeChangeListenerMap.has(id)) {
			b.off("theme:change", this.themeChangeListenerMap.get(id));
			this.themeChangeListenerMap.delete(id);
		}
	}
	/********** Passthrough **********/
	_getPTValue(obj = {}, key = "", params = {}, searchInDefaultPT = true) {
		var _this$_getPropValue, _this$config6, _this$config6$ptOptio;
		const searchOut = /./g.test(key) && !!params[key.split(".")[0]];
		const { mergeSections = true, mergeProps: useMergeProps = false } = ((_this$_getPropValue = this._getPropValue("ptOptions")) === null || _this$_getPropValue === void 0 ? void 0 : _this$_getPropValue()) || ((_this$config6 = this.config) === null || _this$config6 === void 0 || (_this$config6$ptOptio = _this$config6["ptOptions"]) === null || _this$config6$ptOptio === void 0 ? void 0 : _this$config6$ptOptio.call(_this$config6)) || {};
		const global = searchInDefaultPT ? searchOut ? this._useGlobalPT(this._getPTClassValue, key, params) : this._useDefaultPT(this._getPTClassValue, key, params) : void 0;
		const self = searchOut ? void 0 : this._usePT(this._getPT(obj, this.$hostName || this.$name), this._getPTClassValue, key, _objectSpread2(_objectSpread2({}, params), {}, { global: global || {} }));
		const datasets = this._getPTDatasets(key);
		return mergeSections || !mergeSections && self ? useMergeProps ? this._mergeProps(useMergeProps, global, self, datasets) : _objectSpread2(_objectSpread2(_objectSpread2({}, global), self), datasets) : _objectSpread2(_objectSpread2({}, self), datasets);
	}
	_getPTDatasets(key = "") {
		var _this$$pt, _this$$pt2, _key$split$at;
		const datasetPrefix = "data-pc-";
		const isExtended = key === "root" && a((_this$$pt = this.$pt()) === null || _this$$pt === void 0 ? void 0 : _this$$pt["data-pc-section"]);
		return key !== "transition" && _objectSpread2(_objectSpread2({}, key === "root" && _objectSpread2(_objectSpread2({ [`${datasetPrefix}name`]: v(isExtended ? (_this$$pt2 = this.$pt()) === null || _this$$pt2 === void 0 ? void 0 : _this$$pt2["data-pc-section"] : this.$name) }, isExtended && { [`${datasetPrefix}extend`]: v(this.$name) }), {}, { [`${this.$attrSelector}`]: "" })), {}, { [`${datasetPrefix}section`]: v(key.includes(".") ? (_key$split$at = key.split(".").at(-1)) !== null && _key$split$at !== void 0 ? _key$split$at : "" : key) });
	}
	_getPTClassValue(options, key, params) {
		const value = this._getOptionValue(options, key, params);
		return _(value) || x(value) ? { class: value } : value;
	}
	_getPT(pt, key = "", callback) {
		const getValue = (value, checkSameKey = false) => {
			var _ref3;
			const computedValue = callback ? callback(value) : value;
			const _key = v(key);
			const _cKey = v(this.$hostName || this.$name);
			return (_ref3 = checkSameKey ? _key !== _cKey ? computedValue === null || computedValue === void 0 ? void 0 : computedValue[_key] : void 0 : computedValue === null || computedValue === void 0 ? void 0 : computedValue[_key]) !== null && _ref3 !== void 0 ? _ref3 : computedValue;
		};
		return (pt === null || pt === void 0 ? void 0 : pt.hasOwnProperty("_usept")) ? {
			_usept: pt["_usept"],
			originalValue: getValue(pt.originalValue),
			value: getValue(pt.value)
		} : getValue(pt, true);
	}
	_usePT(pt, callback, key, params) {
		const fn = (value) => callback === null || callback === void 0 ? void 0 : callback.call(this, value, key, params);
		if (pt === null || pt === void 0 ? void 0 : pt.hasOwnProperty("_usept")) {
			var _this$config7;
			const { mergeSections = true, mergeProps: useMergeProps = false } = pt["_usept"] || ((_this$config7 = this.config) === null || _this$config7 === void 0 ? void 0 : _this$config7["ptOptions"]()) || {};
			const originalValue = fn(pt.originalValue);
			const value = fn(pt.value);
			if (originalValue === void 0 && value === void 0) return void 0;
			else if (_(value)) return value;
			else if (_(originalValue)) return originalValue;
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
			acc = r(acc, this.ptm(arg, params)) || {};
			return acc;
		}, {});
	}
	ptmo(obj = {}, key = "", params = {}) {
		return this._getPTValue(obj, key, _objectSpread2({ instance: this }, params), false);
	}
	cx(key, params = {}) {
		return !this.$unstyled() ? e$1(this._getOptionValue(this.$style.classes, key, _objectSpread2(_objectSpread2({}, this.$params), params))) : void 0;
	}
	sx(key = "", when = true, params = {}) {
		if (when) {
			const self = this._getOptionValue(this.$style.inlineStyles, key, _objectSpread2(_objectSpread2({}, this.$params), params));
			const base = this._getOptionValue(this.baseComponentStyle.inlineStyles, key, _objectSpread2(_objectSpread2({}, this.$params), params));
			return _objectSpread2(_objectSpread2({}, base), self);
		}
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
export { PARENT_INSTANCE as n, t as r, BaseComponent as t };
