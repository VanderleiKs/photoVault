import { n as _defineProperty, t as _objectSpread2 } from "./objectSpread2-weooBxVk.js";
import { Bc as NgZone, Cr as TracingService, Dr as ViewEncapsulation, F as createPlatformFactory, Fn as Injectable, Hc as PLATFORM_ID, Il as ɵɵinject, Jc as RuntimeError, Ki as setDocument, Ml as ɵɵdefineInjectable, Nl as ɵɵdefineInjector, Nr as allLeavingAnimations, Pn as Inject, Qn as Optional, Tr as USE_PENDING_TASKS, Uc as PLATFORM_INITIALIZER, Wi as setClassMetadata, Xr as describeDomNode, Z as internalCreateApplication, _c as CSP_NONCE, ao as ɵɵdefineNgModule, ar as RendererFactory2, br as TestabilityRegistry, dr as Service, hc as APP_ID, hr as TESTABILITY_GETTER, jc as InjectionToken, kc as INJECTOR_SCOPE, mr as TESTABILITY, or as RendererStyleFlags2, ot as platformCore, pc as _asyncToGenerator, pl as inject, qn as NgModule, so as ɵɵdefineService, sr as SHARED_STYLES_HOST, t as ApplicationModule, tl as _global, wc as ErrorHandler, yc as DOCUMENT, yl as makeEnvironmentProviders, yr as Testability } from "./core-C91JEChX.js";
import { _ as getDOM, m as DomAdapter, n as PLATFORM_BROWSER_ID, v as setRootDomAdapter } from "./common-C2OsAfsp.js";
import { t as CommonModule } from "./_common_module-chunk-CeoAXkM2.js";
//#region node_modules/@angular/common/fesm2022/_xhr-chunk.mjs
/**
* @license Angular v22.2.0
* (c) 2010-2026 Google LLC. https://angular.dev/
* License: MIT
*/
var _BrowserXhr;
var _XhrFactory;
function parseCookieValue(cookieStr, name) {
	name = encodeURIComponent(name);
	for (const cookie of cookieStr.split(";")) {
		const eqIndex = cookie.indexOf("=");
		const [cookieName, cookieValue] = eqIndex == -1 ? [cookie, ""] : [cookie.slice(0, eqIndex), cookie.slice(eqIndex + 1)];
		if (cookieName.trim() !== name) continue;
		let value = cookieValue;
		try {
			value = decodeURIComponent(cookieValue);
		} catch (_unused) {}
		if (value.length > 1 && value[0] === "\"" && value[value.length - 1] === "\"") value = value.slice(1, -1);
		return value;
	}
	return null;
}
var BrowserXhr = class {
	build() {
		return new XMLHttpRequest();
	}
};
_BrowserXhr = BrowserXhr;
_defineProperty(BrowserXhr, "ɵfac", function BrowserXhr_Factory(__ngFactoryType__) {
	return new (__ngFactoryType__ || _BrowserXhr)();
});
_defineProperty(BrowserXhr, "ɵprov", /*@__PURE__*/ ɵɵdefineService({
	token: _BrowserXhr,
	factory: _BrowserXhr.ɵfac
}));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(BrowserXhr, [{ type: Service }], null, null);
})();
var XhrFactory = class {};
_XhrFactory = XhrFactory;
_defineProperty(XhrFactory, "ɵfac", function XhrFactory_Factory(__ngFactoryType__) {
	return new (__ngFactoryType__ || _XhrFactory)();
});
_defineProperty(XhrFactory, "ɵprov", /*@__PURE__*/ ɵɵdefineInjectable({
	token: _XhrFactory,
	factory: function XhrFactory_Factory(__ngFactoryType__) {
		let __ngConditionalFactory__ = null;
		if (__ngFactoryType__) __ngConditionalFactory__ = new (__ngFactoryType__ || _XhrFactory)();
		else __ngConditionalFactory__ = ɵɵinject(BrowserXhr);
		return __ngConditionalFactory__;
	},
	providedIn: "root"
}));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(XhrFactory, [{
		type: Injectable,
		args: [{
			providedIn: "root",
			useExisting: BrowserXhr
		}]
	}], null, null);
})();
//#endregion
//#region node_modules/@angular/platform-browser/fesm2022/_dom_renderer-chunk.mjs
/**
* @license Angular v22.2.0
* (c) 2010-2026 Google LLC. https://angular.dev/
* License: MIT
*/
var _DomEventsPlugin;
var _EventManager;
var _SharedStylesHost;
var _DomRendererFactory;
var EventManagerPlugin = class {
	constructor(_doc) {
		_defineProperty(this, "_doc", void 0);
		_defineProperty(this, "manager", void 0);
		this._doc = _doc;
	}
};
var DomEventsPlugin = class extends EventManagerPlugin {
	constructor(doc) {
		super(doc);
	}
	supports(eventName) {
		return true;
	}
	addEventListener(element, eventName, handler, options) {
		element.addEventListener(eventName, handler, options);
		return () => this.removeEventListener(element, eventName, handler, options);
	}
	removeEventListener(target, eventName, callback, options) {
		return target.removeEventListener(eventName, callback, options);
	}
};
_DomEventsPlugin = DomEventsPlugin;
_defineProperty(DomEventsPlugin, "ɵfac", function DomEventsPlugin_Factory(__ngFactoryType__) {
	return new (__ngFactoryType__ || _DomEventsPlugin)(ɵɵinject(DOCUMENT));
});
_defineProperty(DomEventsPlugin, "ɵprov", /*@__PURE__*/ ɵɵdefineInjectable({
	token: _DomEventsPlugin,
	factory: _DomEventsPlugin.ɵfac
}));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(DomEventsPlugin, [{ type: Injectable }], () => [{
		type: void 0,
		decorators: [{
			type: Inject,
			args: [DOCUMENT]
		}]
	}], null);
})();
var EVENT_MANAGER_PLUGINS = new InjectionToken(typeof ngDevMode !== "undefined" && ngDevMode ? "EventManagerPlugins" : "");
var EventManager = class {
	constructor(plugins, _zone) {
		_defineProperty(this, "_zone", void 0);
		_defineProperty(this, "_plugins", void 0);
		_defineProperty(this, "_eventNameToPlugin", /* @__PURE__ */ new Map());
		this._zone = _zone;
		plugins.forEach((plugin) => {
			plugin.manager = this;
		});
		const otherPlugins = plugins.filter((p) => !(p instanceof DomEventsPlugin));
		this._plugins = otherPlugins.slice().reverse();
		const domEventPlugin = plugins.find((p) => p instanceof DomEventsPlugin);
		if (domEventPlugin) this._plugins.push(domEventPlugin);
	}
	addEventListener(element, eventName, handler, options) {
		return this._findPluginFor(eventName).addEventListener(element, eventName, handler, options);
	}
	getZone() {
		return this._zone;
	}
	_findPluginFor(eventName) {
		let plugin = this._eventNameToPlugin.get(eventName);
		if (plugin) return plugin;
		plugin = this._plugins.find((plugin) => plugin.supports(eventName));
		if (!plugin) throw new RuntimeError(-5101, (typeof ngDevMode === "undefined" || ngDevMode) && `No event manager plugin found for event ${eventName}`);
		this._eventNameToPlugin.set(eventName, plugin);
		return plugin;
	}
};
_EventManager = EventManager;
_defineProperty(EventManager, "ɵfac", function EventManager_Factory(__ngFactoryType__) {
	return new (__ngFactoryType__ || _EventManager)(ɵɵinject(EVENT_MANAGER_PLUGINS), ɵɵinject(NgZone));
});
_defineProperty(EventManager, "ɵprov", /*@__PURE__*/ ɵɵdefineInjectable({
	token: _EventManager,
	factory: _EventManager.ɵfac
}));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(EventManager, [{ type: Injectable }], () => [{
		type: void 0,
		decorators: [{
			type: Inject,
			args: [EVENT_MANAGER_PLUGINS]
		}]
	}, { type: NgZone }], null);
})();
var APP_ID_ATTRIBUTE_NAME = "ng-app-id";
function removeElements(elements) {
	for (const element of elements) element.remove();
}
function createStyleElement(style, doc) {
	const styleElement = doc.createElement("style");
	styleElement.textContent = style;
	return styleElement;
}
function addServerStyles(doc, appId, inline, external) {
	var _doc$head;
	const elements = (_doc$head = doc.head) === null || _doc$head === void 0 ? void 0 : _doc$head.querySelectorAll(`style[${APP_ID_ATTRIBUTE_NAME}="${appId}"],link[${APP_ID_ATTRIBUTE_NAME}="${appId}"]`);
	if (!elements || elements.length === 0) return false;
	for (const styleElement of elements) {
		styleElement.removeAttribute(APP_ID_ATTRIBUTE_NAME);
		if (styleElement instanceof HTMLLinkElement) external.set(styleElement.href.slice(styleElement.href.lastIndexOf("/") + 1), {
			usage: 0,
			elements: [styleElement]
		});
		else if (styleElement.textContent) inline.set(styleElement.textContent, {
			usage: 0,
			elements: [styleElement]
		});
	}
	return true;
}
function createLinkElement(url, doc) {
	const linkElement = doc.createElement("link");
	linkElement.setAttribute("rel", "stylesheet");
	linkElement.setAttribute("href", url);
	return linkElement;
}
var SharedStylesHost = class {
	constructor(doc, appId, nonce, platformId = {}) {
		_defineProperty(this, "doc", void 0);
		_defineProperty(this, "appId", void 0);
		_defineProperty(this, "nonce", void 0);
		_defineProperty(this, "inline", /* @__PURE__ */ new Map());
		_defineProperty(this, "external", /* @__PURE__ */ new Map());
		_defineProperty(this, "hosts", /* @__PURE__ */ new Set());
		this.doc = doc;
		this.appId = appId;
		this.nonce = nonce;
		if (addServerStyles(doc, appId, this.inline, this.external)) this.hosts.add(doc.head);
	}
	addStyles(styles, urls) {
		for (const value of styles) this.addUsage(value, this.inline, createStyleElement);
		urls === null || urls === void 0 || urls.forEach((value) => this.addUsage(value, this.external, createLinkElement));
	}
	removeStyles(styles, urls) {
		for (const value of styles) this.removeUsage(value, this.inline);
		urls === null || urls === void 0 || urls.forEach((value) => this.removeUsage(value, this.external));
	}
	addUsage(value, usages, creator) {
		const record = usages.get(value);
		if (record) {
			if ((typeof ngDevMode === "undefined" || ngDevMode) && record.usage === 0) record.elements.forEach((element) => element.setAttribute("ng-style-reused", ""));
			record.usage++;
		} else usages.set(value, {
			usage: 1,
			elements: [...this.hosts].map((host) => this.addElement(host, creator(value, this.doc)))
		});
	}
	removeUsage(value, usages) {
		const record = usages.get(value);
		if (record) {
			record.usage--;
			if (record.usage <= 0) {
				removeElements(record.elements);
				usages.delete(value);
			}
		}
	}
	ngOnDestroy() {
		for (const [, { elements }] of [...this.inline, ...this.external]) removeElements(elements);
		this.hosts.clear();
	}
	addHost(hostNode) {
		if (this.hosts.has(hostNode)) return;
		this.hosts.add(hostNode);
		for (const [style, { elements }] of this.inline) elements.push(this.addElement(hostNode, createStyleElement(style, this.doc)));
		for (const [url, { elements }] of this.external) elements.push(this.addElement(hostNode, createLinkElement(url, this.doc)));
	}
	removeHost(hostNode) {
		this.hosts.delete(hostNode);
		for (const record of [...this.inline.values(), ...this.external.values()]) {
			const remaining = [];
			for (const element of record.elements) if (element.parentNode === hostNode) element.remove();
			else remaining.push(element);
			record.elements = remaining;
		}
	}
	addElement(host, element) {
		if (this.nonce) element.setAttribute("nonce", this.nonce);
		return host.appendChild(element);
	}
};
_SharedStylesHost = SharedStylesHost;
_defineProperty(SharedStylesHost, "ɵfac", function SharedStylesHost_Factory(__ngFactoryType__) {
	return new (__ngFactoryType__ || _SharedStylesHost)(ɵɵinject(DOCUMENT), ɵɵinject(APP_ID), ɵɵinject(CSP_NONCE, 8), ɵɵinject(PLATFORM_ID));
});
_defineProperty(SharedStylesHost, "ɵprov", /*@__PURE__*/ ɵɵdefineInjectable({
	token: _SharedStylesHost,
	factory: _SharedStylesHost.ɵfac
}));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(SharedStylesHost, [{ type: Injectable }], () => [
		{
			type: Document,
			decorators: [{
				type: Inject,
				args: [DOCUMENT]
			}]
		},
		{
			type: void 0,
			decorators: [{
				type: Inject,
				args: [APP_ID]
			}]
		},
		{
			type: void 0,
			decorators: [{
				type: Inject,
				args: [CSP_NONCE]
			}, { type: Optional }]
		},
		{
			type: void 0,
			decorators: [{
				type: Inject,
				args: [PLATFORM_ID]
			}]
		}
	], null);
})();
var NAMESPACE_URIS = {
	"svg": "http://www.w3.org/2000/svg",
	"xhtml": "http://www.w3.org/1999/xhtml",
	"xlink": "http://www.w3.org/1999/xlink",
	"xml": "http://www.w3.org/XML/1998/namespace",
	"xmlns": "http://www.w3.org/2000/xmlns/",
	"math": "http://www.w3.org/1998/Math/MathML"
};
var COMPONENT_REGEX = /%COMP%/g;
var SOURCEMAP_URL_REGEXP = /\/\*#\s*sourceMappingURL=([^\s*]+)\s*\*\//;
var PROTOCOL_REGEXP = /^https?:/;
var COMPONENT_VARIABLE = "%COMP%";
var HOST_ATTR = `_nghost-${COMPONENT_VARIABLE}`;
var CONTENT_ATTR = `_ngcontent-${COMPONENT_VARIABLE}`;
var REMOVE_STYLES_ON_COMPONENT_DESTROY_DEFAULT = true;
var REMOVE_STYLES_ON_COMPONENT_DESTROY = new InjectionToken(typeof ngDevMode !== "undefined" && ngDevMode ? "RemoveStylesOnCompDestroy" : "", { factory: () => REMOVE_STYLES_ON_COMPONENT_DESTROY_DEFAULT });
var CSS_VAR_NAMESPACE = new InjectionToken(typeof ngDevMode !== "undefined" && ngDevMode ? "CSS_VAR_NAMESPACE" : "");
function provideCssVarNamespacing(namespace) {
	return makeEnvironmentProviders([{
		provide: CSS_VAR_NAMESPACE,
		useFactory: (appId) => `${namespace !== null && namespace !== void 0 ? namespace : appId}_`,
		deps: [APP_ID]
	}]);
}
function shimContentAttribute(componentShortId) {
	return CONTENT_ATTR.replace(COMPONENT_REGEX, componentShortId);
}
function shimHostAttribute(componentShortId) {
	return HOST_ATTR.replace(COMPONENT_REGEX, componentShortId);
}
function shimStylesContent(compId, styles) {
	return styles.map((s) => s.replace(COMPONENT_REGEX, compId));
}
function addBaseHrefToCssSourceMap(baseHref, styles) {
	if (!baseHref) return styles;
	const absoluteBaseHrefUrl = new URL(baseHref, "http://localhost");
	return styles.map((cssContent) => {
		if (!cssContent.includes("sourceMappingURL=")) return cssContent;
		return cssContent.replace(SOURCEMAP_URL_REGEXP, (_, sourceMapUrl) => {
			if (sourceMapUrl[0] === "/" || sourceMapUrl.startsWith("data:") || PROTOCOL_REGEXP.test(sourceMapUrl)) return `/*# sourceMappingURL=${sourceMapUrl} */`;
			const { pathname: resolvedSourceMapUrl } = new URL(sourceMapUrl, absoluteBaseHrefUrl);
			return `/*# sourceMappingURL=${resolvedSourceMapUrl} */`;
		});
	});
}
var DomRendererFactory2 = class {
	constructor(eventManager, sharedStylesHost, appId, removeStylesOnCompDestroy, doc, ngZone, nonce = null, tracingService = null, cssVarNamespace = null) {
		_defineProperty(this, "eventManager", void 0);
		_defineProperty(this, "sharedStylesHost", void 0);
		_defineProperty(this, "appId", void 0);
		_defineProperty(this, "removeStylesOnCompDestroy", void 0);
		_defineProperty(this, "doc", void 0);
		_defineProperty(this, "ngZone", void 0);
		_defineProperty(this, "nonce", void 0);
		_defineProperty(this, "tracingService", void 0);
		_defineProperty(this, "rendererByCompId", /* @__PURE__ */ new Map());
		_defineProperty(this, "defaultRenderer", void 0);
		_defineProperty(this, "cssVarNamespace", void 0);
		this.eventManager = eventManager;
		this.sharedStylesHost = sharedStylesHost;
		this.appId = appId;
		this.removeStylesOnCompDestroy = removeStylesOnCompDestroy;
		this.doc = doc;
		this.ngZone = ngZone;
		this.nonce = nonce;
		this.tracingService = tracingService;
		this.cssVarNamespace = cssVarNamespace !== null && cssVarNamespace !== void 0 ? cssVarNamespace : "";
		this.defaultRenderer = new DefaultDomRenderer2(eventManager, doc, ngZone, this.tracingService, this.cssVarNamespace);
	}
	createRenderer(element, type) {
		if (!element || !type) return this.defaultRenderer;
		const renderer = this.getOrCreateRenderer(element, type);
		if (renderer instanceof EmulatedEncapsulationDomRenderer2) renderer.applyToHost(element);
		else if (renderer instanceof NoneEncapsulationDomRenderer) renderer.applyStyles();
		return renderer;
	}
	getOrCreateRenderer(element, type) {
		const rendererByCompId = this.rendererByCompId;
		let renderer = rendererByCompId.get(type.id);
		if (!renderer) {
			const doc = this.doc;
			const ngZone = this.ngZone;
			const eventManager = this.eventManager;
			const sharedStylesHost = this.sharedStylesHost;
			const removeStylesOnCompDestroy = this.removeStylesOnCompDestroy;
			const tracingService = this.tracingService;
			switch (type.encapsulation) {
				case ViewEncapsulation.Emulated:
					renderer = new EmulatedEncapsulationDomRenderer2(eventManager, sharedStylesHost, type, this.appId, removeStylesOnCompDestroy, doc, ngZone, tracingService, this.cssVarNamespace);
					break;
				case ViewEncapsulation.ShadowDom: return new ShadowDomRenderer(eventManager, element, type, doc, ngZone, this.nonce, tracingService, this.cssVarNamespace, sharedStylesHost);
				case ViewEncapsulation.ExperimentalIsolatedShadowDom: return new ShadowDomRenderer(eventManager, element, type, doc, ngZone, this.nonce, tracingService, this.cssVarNamespace);
				default: renderer = new NoneEncapsulationDomRenderer(eventManager, sharedStylesHost, type, removeStylesOnCompDestroy, doc, ngZone, tracingService, this.cssVarNamespace);
			}
			rendererByCompId.set(type.id, renderer);
		}
		return renderer;
	}
	ngOnDestroy() {
		this.rendererByCompId.clear();
	}
	componentReplaced(componentId) {
		this.rendererByCompId.delete(componentId);
	}
};
_DomRendererFactory = DomRendererFactory2;
_defineProperty(DomRendererFactory2, "ɵfac", function DomRendererFactory2_Factory(__ngFactoryType__) {
	return new (__ngFactoryType__ || _DomRendererFactory)(ɵɵinject(EventManager), ɵɵinject(SHARED_STYLES_HOST), ɵɵinject(APP_ID), ɵɵinject(REMOVE_STYLES_ON_COMPONENT_DESTROY), ɵɵinject(DOCUMENT), ɵɵinject(NgZone), ɵɵinject(CSP_NONCE), ɵɵinject(TracingService, 8), ɵɵinject(CSS_VAR_NAMESPACE, 8));
});
_defineProperty(DomRendererFactory2, "ɵprov", /*@__PURE__*/ ɵɵdefineInjectable({
	token: _DomRendererFactory,
	factory: _DomRendererFactory.ɵfac
}));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(DomRendererFactory2, [{ type: Injectable }], () => [
		{ type: EventManager },
		{
			type: SharedStylesHost,
			decorators: [{
				type: Inject,
				args: [SHARED_STYLES_HOST]
			}]
		},
		{
			type: void 0,
			decorators: [{
				type: Inject,
				args: [APP_ID]
			}]
		},
		{
			type: void 0,
			decorators: [{
				type: Inject,
				args: [REMOVE_STYLES_ON_COMPONENT_DESTROY]
			}]
		},
		{
			type: Document,
			decorators: [{
				type: Inject,
				args: [DOCUMENT]
			}]
		},
		{ type: NgZone },
		{
			type: void 0,
			decorators: [{
				type: Inject,
				args: [CSP_NONCE]
			}]
		},
		{
			type: TracingService,
			decorators: [{
				type: Inject,
				args: [TracingService]
			}, { type: Optional }]
		},
		{
			type: void 0,
			decorators: [{
				type: Inject,
				args: [CSS_VAR_NAMESPACE]
			}, { type: Optional }]
		}
	], null);
})();
var DefaultDomRenderer2 = class {
	constructor(eventManager, doc, ngZone, tracingService, cssVarNamespace = "") {
		_defineProperty(this, "eventManager", void 0);
		_defineProperty(this, "doc", void 0);
		_defineProperty(this, "ngZone", void 0);
		_defineProperty(this, "tracingService", void 0);
		_defineProperty(this, "cssVarNamespace", void 0);
		_defineProperty(this, "data", Object.create(null));
		_defineProperty(this, "throwOnSyntheticProps", true);
		_defineProperty(this, "destroyNode", null);
		this.eventManager = eventManager;
		this.doc = doc;
		this.ngZone = ngZone;
		this.tracingService = tracingService;
		this.cssVarNamespace = cssVarNamespace;
	}
	destroy() {}
	createElement(name, namespace) {
		if (namespace) return this.doc.createElementNS(NAMESPACE_URIS[namespace] || namespace, name);
		return this.doc.createElement(name);
	}
	createComment(value) {
		return this.doc.createComment(value);
	}
	createText(value) {
		return this.doc.createTextNode(value);
	}
	appendChild(parent, newChild) {
		(isTemplateNode(parent) ? parent.content : parent).appendChild(newChild);
	}
	insertBefore(parent, newChild, refChild) {
		if (parent) {
			const targetParent = isTemplateNode(parent) ? parent.content : parent;
			if (refChild != null && refChild.parentNode !== targetParent) throw new RuntimeError(-5106, ngDevMode && `Angular could not insert a node before ${describeDomNode(refChild)} because it is no longer a child of ${describeDomNode(targetParent)}. This can happen when code outside of Angular's control (for example, a browser extension or a script that directly manipulates the DOM) has moved or removed a node that Angular is still managing.`);
			targetParent.insertBefore(newChild, refChild);
		}
	}
	removeChild(_parent, oldChild) {
		oldChild.remove();
	}
	selectRootElement(selectorOrNode, preserveContent) {
		let el = typeof selectorOrNode === "string" ? this.doc.querySelector(selectorOrNode) : selectorOrNode;
		if (!el) throw new RuntimeError(-5104, (typeof ngDevMode === "undefined" || ngDevMode) && `The selector "${selectorOrNode}" did not match any elements`);
		if (!preserveContent) el.textContent = "";
		return el;
	}
	parentNode(node) {
		return node.parentNode;
	}
	nextSibling(node) {
		return node.nextSibling;
	}
	setAttribute(el, name, value, namespace) {
		if (namespace) {
			name = namespace + ":" + name;
			const namespaceUri = NAMESPACE_URIS[namespace];
			if (namespaceUri) el.setAttributeNS(namespaceUri, name, value);
			else el.setAttribute(name, value);
		} else el.setAttribute(name, value);
	}
	removeAttribute(el, name, namespace) {
		if (namespace) {
			const namespaceUri = NAMESPACE_URIS[namespace];
			if (namespaceUri) el.removeAttributeNS(namespaceUri, name);
			else el.removeAttribute(`${namespace}:${name}`);
		} else el.removeAttribute(name);
	}
	addClass(el, name) {
		el.classList.add(name);
	}
	removeClass(el, name) {
		el.classList.remove(name);
	}
	setStyle(el, style, value, flags) {
		const isVariable = style.startsWith("--");
		if (isVariable) style = style.replace("%NS%", this.cssVarNamespace);
		if (isVariable || flags & (RendererStyleFlags2.DashCase | RendererStyleFlags2.Important)) el.style.setProperty(style, value, flags & RendererStyleFlags2.Important ? "important" : "");
		else el.style[style] = value;
	}
	removeStyle(el, style, flags) {
		const isVariable = style.startsWith("--");
		if (isVariable) style = style.replace("%NS%", this.cssVarNamespace);
		if (isVariable || flags & RendererStyleFlags2.DashCase) el.style.removeProperty(style);
		else el.style[style] = "";
	}
	setProperty(el, name, value) {
		if (el == null) return;
		(typeof ngDevMode === "undefined" || ngDevMode) && this.throwOnSyntheticProps && checkNoSyntheticProp(name, "property");
		el[name] = value;
	}
	setValue(node, value) {
		node.nodeValue = value;
	}
	listen(target, event, callback, options) {
		var _this$tracingService;
		(typeof ngDevMode === "undefined" || ngDevMode) && this.throwOnSyntheticProps && checkNoSyntheticProp(event, "listener");
		if (typeof target === "string") {
			target = getDOM().getGlobalEventTarget(this.doc, target);
			if (!target) throw new RuntimeError(-5102, (typeof ngDevMode === "undefined" || ngDevMode) && `Unsupported event target ${target} for event ${event}`);
		}
		let wrappedCallback = this.decoratePreventDefault(callback);
		if ((_this$tracingService = this.tracingService) === null || _this$tracingService === void 0 ? void 0 : _this$tracingService.wrapEventListener) wrappedCallback = this.tracingService.wrapEventListener(target, event, wrappedCallback);
		return this.eventManager.addEventListener(target, event, wrappedCallback, options);
	}
	decoratePreventDefault(eventHandler) {
		return (event) => {
			if (event === "__ngUnwrap__") return eventHandler;
			if (eventHandler(event) === false) event.preventDefault();
		};
	}
};
var AT_CHARCODE = (() => "@".charCodeAt(0))();
function checkNoSyntheticProp(name, nameKind) {
	if (name.charCodeAt(0) === AT_CHARCODE) throw new RuntimeError(5105, `Unexpected synthetic ${nameKind} ${name} found. Please make sure that:
  - Make sure \`provideAnimationsAsync()\`, \`provideAnimations()\` or \`provideNoopAnimations()\` call was added to a list of providers used to bootstrap an application.
  - There is a corresponding animation configuration named \`${name}\` defined in the \`animations\` field of the \`@Component\` decorator (see https://angular.dev/api/core/Component#animations).`);
}
function isTemplateNode(node) {
	return node.tagName === "TEMPLATE" && node.content !== void 0;
}
var ShadowDomRenderer = class extends DefaultDomRenderer2 {
	constructor(eventManager, hostEl, component, doc, ngZone, nonce, tracingService, cssVarNamespace, sharedStylesHost) {
		var _component$getExterna;
		super(eventManager, doc, ngZone, tracingService, cssVarNamespace);
		_defineProperty(this, "hostEl", void 0);
		_defineProperty(this, "sharedStylesHost", void 0);
		_defineProperty(this, "shadowRoot", void 0);
		this.hostEl = hostEl;
		this.sharedStylesHost = sharedStylesHost;
		this.shadowRoot = hostEl.attachShadow({ mode: "open" });
		if (this.sharedStylesHost) this.sharedStylesHost.addHost(this.shadowRoot);
		let styles = component.styles;
		if (ngDevMode) {
			var _getDOM$getBaseHref;
			styles = addBaseHrefToCssSourceMap((_getDOM$getBaseHref = getDOM().getBaseHref(doc)) !== null && _getDOM$getBaseHref !== void 0 ? _getDOM$getBaseHref : "", styles);
		}
		styles = shimStylesContent(component.id, styles).map((s) => s.replace(/%NS%/g, cssVarNamespace));
		for (const style of styles) {
			const styleEl = document.createElement("style");
			if (nonce) styleEl.setAttribute("nonce", nonce);
			styleEl.textContent = style;
			this.shadowRoot.appendChild(styleEl);
		}
		const styleUrls = (_component$getExterna = component.getExternalStyles) === null || _component$getExterna === void 0 ? void 0 : _component$getExterna.call(component);
		if (styleUrls) for (const styleUrl of styleUrls) {
			const linkEl = createLinkElement(styleUrl, doc);
			if (nonce) linkEl.setAttribute("nonce", nonce);
			this.shadowRoot.appendChild(linkEl);
		}
	}
	nodeOrShadowRoot(node) {
		return node === this.hostEl ? this.shadowRoot : node;
	}
	appendChild(parent, newChild) {
		return super.appendChild(this.nodeOrShadowRoot(parent), newChild);
	}
	insertBefore(parent, newChild, refChild) {
		return super.insertBefore(this.nodeOrShadowRoot(parent), newChild, refChild);
	}
	removeChild(_parent, oldChild) {
		return super.removeChild(null, oldChild);
	}
	parentNode(node) {
		return this.nodeOrShadowRoot(super.parentNode(this.nodeOrShadowRoot(node)));
	}
	destroy() {
		if (this.sharedStylesHost) this.sharedStylesHost.removeHost(this.shadowRoot);
	}
};
var NoneEncapsulationDomRenderer = class extends DefaultDomRenderer2 {
	constructor(eventManager, sharedStylesHost, component, removeStylesOnCompDestroy, doc, ngZone, tracingService, cssVarNamespace, compId) {
		var _component$getExterna2;
		super(eventManager, doc, ngZone, tracingService, cssVarNamespace);
		_defineProperty(this, "sharedStylesHost", void 0);
		_defineProperty(this, "removeStylesOnCompDestroy", void 0);
		_defineProperty(this, "styles", void 0);
		_defineProperty(this, "styleUrls", void 0);
		this.sharedStylesHost = sharedStylesHost;
		this.removeStylesOnCompDestroy = removeStylesOnCompDestroy;
		let styles = component.styles;
		if (ngDevMode) {
			var _getDOM$getBaseHref2;
			styles = addBaseHrefToCssSourceMap((_getDOM$getBaseHref2 = getDOM().getBaseHref(doc)) !== null && _getDOM$getBaseHref2 !== void 0 ? _getDOM$getBaseHref2 : "", styles);
		}
		const shimmed = compId ? shimStylesContent(compId, styles) : styles;
		this.styles = shimmed.map((s) => s.replace(/%NS%/g, cssVarNamespace));
		this.styleUrls = (_component$getExterna2 = component.getExternalStyles) === null || _component$getExterna2 === void 0 ? void 0 : _component$getExterna2.call(component, compId);
	}
	applyStyles() {
		this.sharedStylesHost.addStyles(this.styles, this.styleUrls);
	}
	destroy() {
		if (!this.removeStylesOnCompDestroy) return;
		if (allLeavingAnimations.size === 0) this.sharedStylesHost.removeStyles(this.styles, this.styleUrls);
	}
};
var EmulatedEncapsulationDomRenderer2 = class extends NoneEncapsulationDomRenderer {
	constructor(eventManager, sharedStylesHost, component, appId, removeStylesOnCompDestroy, doc, ngZone, tracingService, cssVarNamespace) {
		const compId = appId + "-" + component.id;
		super(eventManager, sharedStylesHost, component, removeStylesOnCompDestroy, doc, ngZone, tracingService, cssVarNamespace, compId);
		_defineProperty(this, "contentAttr", void 0);
		_defineProperty(this, "hostAttr", void 0);
		this.contentAttr = shimContentAttribute(compId);
		this.hostAttr = shimHostAttribute(compId);
	}
	applyToHost(element) {
		this.applyStyles();
		this.setAttribute(element, this.hostAttr, "");
	}
	createElement(parent, name) {
		const el = super.createElement(parent, name);
		super.setAttribute(el, this.contentAttr, "");
		return el;
	}
};
//#endregion
//#region node_modules/@angular/platform-browser/fesm2022/_browser-chunk.mjs
/**
* @license Angular v22.2.0
* (c) 2010-2026 Google LLC. https://angular.dev/
* License: MIT
*/
var _KeyEventsPlugin;
var _BrowserModule;
var BrowserDomAdapter = class BrowserDomAdapter extends DomAdapter {
	constructor(..._args) {
		super(..._args);
		_defineProperty(this, "supportsDOMEvents", true);
	}
	static makeCurrent() {
		setRootDomAdapter(new BrowserDomAdapter());
	}
	onAndCancel(el, evt, listener, options) {
		el.addEventListener(evt, listener, options);
		return () => {
			el.removeEventListener(evt, listener, options);
		};
	}
	dispatchEvent(el, evt) {
		el.dispatchEvent(evt);
	}
	remove(node) {
		node.remove();
	}
	createElement(tagName, doc) {
		doc = doc || this.getDefaultDocument();
		return doc.createElement(tagName);
	}
	createHtmlDocument() {
		return document.implementation.createHTMLDocument("fakeTitle");
	}
	getDefaultDocument() {
		return document;
	}
	isElementNode(node) {
		return node.nodeType === Node.ELEMENT_NODE;
	}
	isShadowRoot(node) {
		return node instanceof DocumentFragment;
	}
	getGlobalEventTarget(doc, target) {
		if (target === "window") return window;
		if (target === "document") return doc;
		if (target === "body") return doc.body;
		return null;
	}
	getBaseHref(doc) {
		const href = getBaseElementHref();
		return href == null ? null : relativePath(href);
	}
	resetBaseElement() {
		baseElement = null;
	}
	getUserAgent() {
		return window.navigator.userAgent;
	}
	getCookie(name) {
		return parseCookieValue(document.cookie, name);
	}
};
var baseElement = null;
function getBaseElementHref() {
	baseElement = baseElement || document.head.querySelector("base");
	return baseElement ? baseElement.getAttribute("href") : null;
}
function relativePath(url) {
	return new URL(url, document.baseURI).pathname;
}
var BrowserGetTestability = class {
	addToWindow(registry) {
		_global["getAngularTestability"] = (elem, findInAncestors = true) => {
			const testability = registry.findTestabilityInTree(elem, findInAncestors);
			if (testability == null) throw new RuntimeError(5103, (typeof ngDevMode === "undefined" || ngDevMode) && "Could not find testability for element.");
			return testability;
		};
		_global["getAllAngularTestabilities"] = () => registry.getAllTestabilities();
		_global["getAllAngularRootElements"] = () => registry.getAllRootElements();
		const whenAllStable = (callback) => {
			const testabilities = _global["getAllAngularTestabilities"]();
			let count = testabilities.length;
			const decrement = function() {
				count--;
				if (count == 0) callback();
			};
			testabilities.forEach((testability) => {
				testability.whenStable(decrement);
			});
		};
		if (!_global["frameworkStabilizers"]) _global["frameworkStabilizers"] = [];
		_global["frameworkStabilizers"].push(whenAllStable);
	}
	findTestabilityInTree(registry, elem, findInAncestors) {
		if (elem == null) return null;
		const t = registry.getTestability(elem);
		if (t != null) return t;
		else if (!findInAncestors) return null;
		if (getDOM().isShadowRoot(elem)) return this.findTestabilityInTree(registry, elem.host, true);
		return this.findTestabilityInTree(registry, elem.parentElement, true);
	}
};
var MODIFIER_KEYS = [
	"alt",
	"control",
	"meta",
	"shift"
];
var _keyMap = {
	"\b": "Backspace",
	"	": "Tab",
	"": "Delete",
	"\x1B": "Escape",
	"Del": "Delete",
	"Esc": "Escape",
	"Left": "ArrowLeft",
	"Right": "ArrowRight",
	"Up": "ArrowUp",
	"Down": "ArrowDown",
	"Menu": "ContextMenu",
	"Scroll": "ScrollLock",
	"Win": "OS"
};
var MODIFIER_KEY_GETTERS = {
	"alt": (event) => event.altKey,
	"control": (event) => event.ctrlKey,
	"meta": (event) => event.metaKey,
	"shift": (event) => event.shiftKey
};
var KeyEventsPlugin = class KeyEventsPlugin extends EventManagerPlugin {
	constructor(doc) {
		super(doc);
	}
	supports(eventName) {
		return KeyEventsPlugin.parseEventName(eventName) != null;
	}
	addEventListener(element, eventName, handler, options) {
		const parsedEvent = KeyEventsPlugin.parseEventName(eventName);
		const outsideHandler = KeyEventsPlugin.eventCallback(parsedEvent["fullKey"], handler, this.manager.getZone());
		return this.manager.getZone().runOutsideAngular(() => {
			return getDOM().onAndCancel(element, parsedEvent["domEventName"], outsideHandler, options);
		});
	}
	static parseEventName(eventName) {
		const parts = eventName.toLowerCase().split(".");
		const domEventName = parts.shift();
		if (parts.length === 0 || !(domEventName === "keydown" || domEventName === "keyup")) return null;
		const key = KeyEventsPlugin._normalizeKey(parts.pop());
		let fullKey = "";
		let codeIX = parts.indexOf("code");
		if (codeIX > -1) {
			parts.splice(codeIX, 1);
			fullKey = "code.";
		}
		MODIFIER_KEYS.forEach((modifierName) => {
			const index = parts.indexOf(modifierName);
			if (index > -1) {
				parts.splice(index, 1);
				fullKey += modifierName + ".";
			}
		});
		fullKey += key;
		if (parts.length != 0 || key.length === 0) return null;
		const result = {};
		result["domEventName"] = domEventName;
		result["fullKey"] = fullKey;
		return result;
	}
	static matchEventFullKeyCode(event, fullKeyCode) {
		let keycode = _keyMap[event.key] || event.key;
		let key = "";
		if (fullKeyCode.indexOf("code.") > -1) {
			keycode = event.code;
			key = "code.";
		}
		if (keycode == null || !keycode) return false;
		keycode = keycode.toLowerCase();
		if (keycode === " ") keycode = "space";
		else if (keycode === ".") keycode = "dot";
		MODIFIER_KEYS.forEach((modifierName) => {
			if (modifierName !== keycode) {
				const modifierGetter = MODIFIER_KEY_GETTERS[modifierName];
				if (modifierGetter(event)) key += modifierName + ".";
			}
		});
		key += keycode;
		return key === fullKeyCode;
	}
	static eventCallback(fullKey, handler, zone) {
		return (event) => {
			if (KeyEventsPlugin.matchEventFullKeyCode(event, fullKey)) zone.runGuarded(() => handler(event));
		};
	}
	static _normalizeKey(keyName) {
		return keyName === "esc" ? "escape" : keyName;
	}
};
_KeyEventsPlugin = KeyEventsPlugin;
_defineProperty(KeyEventsPlugin, "ɵfac", function KeyEventsPlugin_Factory(__ngFactoryType__) {
	return new (__ngFactoryType__ || _KeyEventsPlugin)(ɵɵinject(DOCUMENT));
});
_defineProperty(KeyEventsPlugin, "ɵprov", /*@__PURE__*/ ɵɵdefineInjectable({
	token: _KeyEventsPlugin,
	factory: _KeyEventsPlugin.ɵfac
}));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(KeyEventsPlugin, [{ type: Injectable }], () => [{
		type: void 0,
		decorators: [{
			type: Inject,
			args: [DOCUMENT]
		}]
	}], null);
})();
function bootstrapApplication(_x, _x2, _x3) {
	return _bootstrapApplication.apply(this, arguments);
}
function _bootstrapApplication() {
	_bootstrapApplication = _asyncToGenerator(function* (rootComponent, options, context) {
		const config = _objectSpread2({ rootComponent }, createProvidersConfig(options, context));
		return internalCreateApplication(config);
	});
	return _bootstrapApplication.apply(this, arguments);
}
function createApplication(_x4, _x5) {
	return _createApplication.apply(this, arguments);
}
function _createApplication() {
	_createApplication = _asyncToGenerator(function* (options, context) {
		return internalCreateApplication(createProvidersConfig(options, context));
	});
	return _createApplication.apply(this, arguments);
}
function createProvidersConfig(options, context) {
	var _options$providers;
	return {
		platformRef: context === null || context === void 0 ? void 0 : context.platformRef,
		appProviders: [...BROWSER_MODULE_PROVIDERS, ...(_options$providers = options === null || options === void 0 ? void 0 : options.providers) !== null && _options$providers !== void 0 ? _options$providers : []],
		platformProviders: INTERNAL_BROWSER_PLATFORM_PROVIDERS
	};
}
function provideProtractorTestingSupport(options = {}) {
	var _options$usePendingTa;
	return [...TESTABILITY_PROVIDERS, (options === null || options === void 0 ? void 0 : options.usePendingTasksForStability) !== void 0 ? {
		provide: USE_PENDING_TASKS,
		useValue: (_options$usePendingTa = options.usePendingTasksForStability) !== null && _options$usePendingTa !== void 0 ? _options$usePendingTa : false
	} : []];
}
function initDomAdapter() {
	BrowserDomAdapter.makeCurrent();
}
function errorHandler() {
	return new ErrorHandler();
}
function _document() {
	setDocument(document);
	return document;
}
var INTERNAL_BROWSER_PLATFORM_PROVIDERS = [
	{
		provide: PLATFORM_ID,
		useValue: PLATFORM_BROWSER_ID
	},
	{
		provide: PLATFORM_INITIALIZER,
		useValue: initDomAdapter,
		multi: true
	},
	{
		provide: DOCUMENT,
		useFactory: _document
	}
];
var platformBrowser = createPlatformFactory(platformCore, "browser", INTERNAL_BROWSER_PLATFORM_PROVIDERS);
var BROWSER_MODULE_PROVIDERS_MARKER = new InjectionToken(typeof ngDevMode === "undefined" || ngDevMode ? "BrowserModule Providers Marker" : "");
var TESTABILITY_PROVIDERS = [
	{
		provide: TESTABILITY_GETTER,
		useClass: BrowserGetTestability
	},
	{
		provide: TESTABILITY,
		useClass: Testability,
		deps: [
			NgZone,
			TestabilityRegistry,
			TESTABILITY_GETTER
		]
	},
	{
		provide: Testability,
		useClass: Testability,
		deps: [
			NgZone,
			TestabilityRegistry,
			TESTABILITY_GETTER
		]
	}
];
var BROWSER_MODULE_PROVIDERS = [
	{
		provide: INJECTOR_SCOPE,
		useValue: "root"
	},
	{
		provide: ErrorHandler,
		useFactory: errorHandler
	},
	{
		provide: EVENT_MANAGER_PLUGINS,
		useClass: DomEventsPlugin,
		multi: true
	},
	{
		provide: EVENT_MANAGER_PLUGINS,
		useClass: KeyEventsPlugin,
		multi: true
	},
	DomRendererFactory2,
	{
		provide: SHARED_STYLES_HOST,
		useClass: SharedStylesHost
	},
	{
		provide: SharedStylesHost,
		useExisting: SHARED_STYLES_HOST
	},
	EventManager,
	{
		provide: RendererFactory2,
		useExisting: DomRendererFactory2
	},
	typeof ngDevMode === "undefined" || ngDevMode ? {
		provide: BROWSER_MODULE_PROVIDERS_MARKER,
		useValue: true
	} : []
];
var BrowserModule = class {
	constructor() {
		if (typeof ngDevMode === "undefined" || ngDevMode) {
			if (inject(BROWSER_MODULE_PROVIDERS_MARKER, {
				optional: true,
				skipSelf: true
			})) throw new RuntimeError(5100, "Providers from the `BrowserModule` have already been loaded. If you need access to common directives such as NgIf and NgFor, import the `CommonModule` instead.");
		}
	}
};
_BrowserModule = BrowserModule;
_defineProperty(BrowserModule, "ɵfac", function BrowserModule_Factory(__ngFactoryType__) {
	return new (__ngFactoryType__ || _BrowserModule)();
});
_defineProperty(BrowserModule, "ɵmod", /*@__PURE__*/ ɵɵdefineNgModule({
	type: _BrowserModule,
	exports: [CommonModule, ApplicationModule]
}));
_defineProperty(BrowserModule, "ɵinj", /*@__PURE__*/ ɵɵdefineInjector({
	providers: [...BROWSER_MODULE_PROVIDERS, ...TESTABILITY_PROVIDERS],
	imports: [CommonModule, ApplicationModule]
}));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(BrowserModule, [{
		type: NgModule,
		args: [{
			providers: [...BROWSER_MODULE_PROVIDERS, ...TESTABILITY_PROVIDERS],
			exports: [CommonModule, ApplicationModule]
		}]
	}], () => [], null);
})();
//#endregion
export { provideCssVarNamespacing as _, bootstrapApplication as a, provideProtractorTestingSupport as c, DomRendererFactory2 as d, EVENT_MANAGER_PLUGINS as f, SharedStylesHost as g, REMOVE_STYLES_ON_COMPONENT_DESTROY as h, KeyEventsPlugin as i, CSS_VAR_NAMESPACE as l, EventManagerPlugin as m, BrowserGetTestability as n, createApplication as o, EventManager as p, BrowserModule as r, platformBrowser as s, BrowserDomAdapter as t, DomEventsPlugin as u, XhrFactory as v, parseCookieValue as y };
