import { n as _defineProperty, t as _objectSpread2 } from "./objectSpread2-weooBxVk.js";
import { $i as unwrapSafeValue, Al as truncateMiddle, Ar as _sanitizeUrl, Bc as NgZone, Br as bypassSanitizationTrustUrl, Bt as computed, Cc as EnvironmentInjector, Cr as TracingService, Dl as signal, Ei as performanceMarkFeature, Fn as Injectable, Gc as PendingTasks, Il as ɵɵinject, Ir as bypassSanitizationTrustHtml, Jc as RuntimeError, Jl as Observable, Kl as createOperatorSubscriber, Lr as bypassSanitizationTrustResourceUrl, Lt as ResourceImpl, Mc as Injector, Ml as ɵɵdefineInjectable, Nl as ɵɵdefineInjector, Pn as Inject, Pr as allowSanitizationBypassAndThrow, Pt as CACHE_ACTIVE, Qc as Version, Rr as bypassSanitizationTrustScript, Tl as runInInjectionContext, Ul as map, Vt as encapsulateResourceError, Wi as setClassMetadata, Wt as linkedSignal, Xc as TransferState, Yc as SecurityContext, Yt as APP_BOOTSTRAP_LISTENER, _c as CSP_NONCE, ao as ɵɵdefineNgModule, bc as DestroyRef, bl as makeStateKey, bt as withI18nSupport$1, cl as forwardRef, dr as Service, fn as Console, jc as InjectionToken, jn as IS_ENABLED_BLOCKING_INITIAL_NAVIGATION, kr as _sanitizeHtml, nl as assertInInjectionContext, nu as isFunction, pc as _asyncToGenerator, pl as inject, ql as operate, qn as NgModule, qt as untracked, sl as formatRuntimeError, so as ɵɵdefineService, tl as _global, tn as ApplicationRef, ut as provideStabilityDebugging, vt as withDomHydration, xc as ENVIRONMENT_INITIALIZER, xt as withIncrementalHydration$1, yc as DOCUMENT, yl as makeEnvironmentProviders, yt as withEventReplay$1, zr as bypassSanitizationTrustStyle } from "./core-C91JEChX.js";
import { a as popScheduler, n as executeSchedule, r as innerFrom, t as from } from "./from-DN_lzLcs.js";
import { _ as getDOM, g as PlatformLocation } from "./common-C2OsAfsp.js";
import { l as CSS_VAR_NAMESPACE, v as XhrFactory, y as parseCookieValue } from "./_browser-chunk-Bw-ozMnS.js";
//#region node_modules/rxjs/dist/esm5/internal/observable/of.js
function of() {
	var args = [];
	for (var _i = 0; _i < arguments.length; _i++) args[_i] = arguments[_i];
	var scheduler = popScheduler(args);
	return from(args, scheduler);
}
//#endregion
//#region node_modules/rxjs/dist/esm5/internal/operators/mergeInternals.js
function mergeInternals(source, subscriber, project, concurrent, onBeforeNext, expand, innerSubScheduler, additionalFinalizer) {
	var buffer = [];
	var active = 0;
	var index = 0;
	var isComplete = false;
	var checkComplete = function() {
		if (isComplete && !buffer.length && !active) subscriber.complete();
	};
	var outerNext = function(value) {
		return active < concurrent ? doInnerSub(value) : buffer.push(value);
	};
	var doInnerSub = function(value) {
		expand && subscriber.next(value);
		active++;
		var innerComplete = false;
		innerFrom(project(value, index++)).subscribe(createOperatorSubscriber(subscriber, function(innerValue) {
			onBeforeNext === null || onBeforeNext === void 0 || onBeforeNext(innerValue);
			if (expand) outerNext(innerValue);
			else subscriber.next(innerValue);
		}, function() {
			innerComplete = true;
		}, void 0, function() {
			if (innerComplete) try {
				active--;
				var _loop_1 = function() {
					var bufferedValue = buffer.shift();
					if (innerSubScheduler) executeSchedule(subscriber, innerSubScheduler, function() {
						return doInnerSub(bufferedValue);
					});
					else doInnerSub(bufferedValue);
				};
				while (buffer.length && active < concurrent) _loop_1();
				checkComplete();
			} catch (err) {
				subscriber.error(err);
			}
		}));
	};
	source.subscribe(createOperatorSubscriber(subscriber, outerNext, function() {
		isComplete = true;
		checkComplete();
	}));
	return function() {
		additionalFinalizer === null || additionalFinalizer === void 0 || additionalFinalizer();
	};
}
//#endregion
//#region node_modules/rxjs/dist/esm5/internal/operators/mergeMap.js
function mergeMap(project, resultSelector, concurrent) {
	if (concurrent === void 0) concurrent = Infinity;
	if (isFunction(resultSelector)) return mergeMap(function(a, i) {
		return map(function(b, ii) {
			return resultSelector(a, b, i, ii);
		})(innerFrom(project(a, i)));
	}, concurrent);
	else if (typeof resultSelector === "number") concurrent = resultSelector;
	return operate(function(source, subscriber) {
		return mergeInternals(source, subscriber, project, concurrent);
	});
}
//#endregion
//#region node_modules/rxjs/dist/esm5/internal/operators/filter.js
function filter(predicate, thisArg) {
	return operate(function(source, subscriber) {
		var index = 0;
		source.subscribe(createOperatorSubscriber(subscriber, function(value) {
			return predicate.call(thisArg, value, index++) && subscriber.next(value);
		}));
	});
}
//#endregion
//#region node_modules/rxjs/dist/esm5/internal/operators/concatMap.js
function concatMap(project, resultSelector) {
	return isFunction(resultSelector) ? mergeMap(project, resultSelector, 1) : mergeMap(project, 1);
}
//#endregion
//#region node_modules/rxjs/dist/esm5/internal/operators/finalize.js
function finalize(callback) {
	return operate(function(source, subscriber) {
		try {
			source.subscribe(subscriber);
		} finally {
			subscriber.add(callback);
		}
	});
}
//#endregion
//#region node_modules/rxjs/dist/esm5/internal/operators/switchMap.js
function switchMap(project, resultSelector) {
	return operate(function(source, subscriber) {
		var innerSubscriber = null;
		var index = 0;
		var isComplete = false;
		var checkComplete = function() {
			return isComplete && !innerSubscriber && subscriber.complete();
		};
		source.subscribe(createOperatorSubscriber(subscriber, function(value) {
			innerSubscriber === null || innerSubscriber === void 0 || innerSubscriber.unsubscribe();
			var innerIndex = 0;
			var outerIndex = index++;
			innerFrom(project(value, outerIndex)).subscribe(innerSubscriber = createOperatorSubscriber(subscriber, function(innerValue) {
				return subscriber.next(resultSelector ? resultSelector(value, innerValue, outerIndex, innerIndex++) : innerValue);
			}, function() {
				innerSubscriber = null;
				checkComplete();
			}));
		}, function() {
			isComplete = true;
			checkComplete();
		}));
	});
}
//#endregion
//#region node_modules/@angular/common/fesm2022/_module-chunk.mjs
/**
* @license Angular v22.2.0
* (c) 2010-2026 Google LLC. https://angular.dev/
* License: MIT
*/
var _FetchBackend;
var _HttpXsrfCookieExtractor;
var _HttpXsrfTokenExtractor;
var _HttpXsrfInterceptor;
var _HttpBackend;
var _HttpInterceptorHandler;
var _HttpHandler;
var _HttpClient;
var _JsonpClientBackend;
var _JsonpInterceptor;
var _HttpXhrBackend;
var _HttpClientXsrfModule;
var _HttpClientModule;
var _HttpClientJsonpModule;
var HttpHeaders = class HttpHeaders {
	constructor(headers) {
		_defineProperty(this, "headers", void 0);
		_defineProperty(this, "normalizedNames", /* @__PURE__ */ new Map());
		_defineProperty(this, "lazyInit", void 0);
		_defineProperty(this, "lazyUpdate", null);
		if (!headers) this.headers = /* @__PURE__ */ new Map();
		else if (typeof headers === "string") this.lazyInit = () => {
			this.headers = /* @__PURE__ */ new Map();
			headers.split("\n").forEach((line) => {
				const index = line.indexOf(":");
				if (index > 0) {
					const name = line.slice(0, index);
					const value = line.slice(index + 1).trim();
					this.addHeaderEntry(name, value);
				}
			});
		};
		else if (typeof Headers !== "undefined" && headers instanceof Headers) {
			this.headers = /* @__PURE__ */ new Map();
			headers.forEach((value, name) => {
				this.addHeaderEntry(name, value);
			});
		} else this.lazyInit = () => {
			if (typeof ngDevMode === "undefined" || ngDevMode) assertValidHeaders(headers);
			this.headers = /* @__PURE__ */ new Map();
			Object.entries(headers).forEach(([name, values]) => {
				this.setHeaderEntries(name, values);
			});
		};
	}
	has(name) {
		this.init();
		return this.headers.has(name.toLowerCase());
	}
	get(name) {
		this.init();
		const values = this.headers.get(name.toLowerCase());
		return values && values.length > 0 ? values[0] : null;
	}
	keys() {
		this.init();
		return Array.from(this.normalizedNames.values());
	}
	getAll(name) {
		this.init();
		return this.headers.get(name.toLowerCase()) || null;
	}
	append(name, value) {
		return this.clone({
			name,
			value,
			op: "a"
		});
	}
	set(name, value) {
		return this.clone({
			name,
			value,
			op: "s"
		});
	}
	delete(name, value) {
		return this.clone({
			name,
			value,
			op: "d"
		});
	}
	maybeSetNormalizedName(name, lcName) {
		if (!this.normalizedNames.has(lcName)) this.normalizedNames.set(lcName, name);
	}
	init() {
		if (!!this.lazyInit) {
			if (this.lazyInit instanceof HttpHeaders) this.copyFrom(this.lazyInit);
			else this.lazyInit();
			this.lazyInit = null;
			if (!!this.lazyUpdate) {
				this.lazyUpdate.forEach((update) => this.applyUpdate(update));
				this.lazyUpdate = null;
			}
		}
	}
	copyFrom(other) {
		other.init();
		for (const [key, values] of other.headers.entries()) {
			this.headers.set(key, values);
			this.normalizedNames.set(key, other.normalizedNames.get(key));
		}
	}
	clone(update) {
		const clone = new HttpHeaders();
		clone.lazyInit = !!this.lazyInit && this.lazyInit instanceof HttpHeaders ? this.lazyInit : this;
		clone.lazyUpdate = (this.lazyUpdate || []).concat([update]);
		return clone;
	}
	applyUpdate(update) {
		const key = update.name.toLowerCase();
		switch (update.op) {
			case "a":
			case "s":
				let value = update.value;
				if (typeof value === "string") value = [value];
				if (value.length === 0) return;
				this.maybeSetNormalizedName(update.name, key);
				const base = update.op === "a" ? (this.headers.get(key) || []).slice() : [];
				base.push(...value);
				this.headers.set(key, base);
				break;
			case "d":
				const toDelete = update.value;
				if (toDelete === void 0) {
					this.headers.delete(key);
					this.normalizedNames.delete(key);
				} else {
					const valuesToDelete = Array.isArray(toDelete) ? toDelete : [toDelete];
					let existing = this.headers.get(key);
					if (!existing) return;
					existing = existing.filter((value) => valuesToDelete.indexOf(value) === -1);
					if (existing.length === 0) {
						this.headers.delete(key);
						this.normalizedNames.delete(key);
					} else this.headers.set(key, existing);
				}
		}
	}
	addHeaderEntry(name, value) {
		const key = name.toLowerCase();
		this.maybeSetNormalizedName(name, key);
		if (this.headers.has(key)) this.headers.get(key).push(value);
		else this.headers.set(key, [value]);
	}
	setHeaderEntries(name, values) {
		const headerValues = (Array.isArray(values) ? values : [values]).map((value) => value.toString());
		const key = name.toLowerCase();
		this.headers.set(key, headerValues);
		this.maybeSetNormalizedName(name, key);
	}
	forEach(fn) {
		this.init();
		Array.from(this.normalizedNames.keys()).forEach((key) => fn(this.normalizedNames.get(key), this.headers.get(key)));
	}
};
function assertValidHeaders(headers) {
	for (const [key, value] of Object.entries(headers)) if (!(typeof value === "string" || typeof value === "number") && !Array.isArray(value)) throw new Error(`Unexpected value of the \`${key}\` header provided. Expecting either a string, a number or an array, but got: \`${value}\`.`);
}
var HttpContext = class {
	constructor() {
		_defineProperty(this, "map", /* @__PURE__ */ new Map());
	}
	set(token, value) {
		this.map.set(token, value);
		return this;
	}
	get(token) {
		if (!this.map.has(token)) this.map.set(token, token.defaultValue());
		return this.map.get(token);
	}
	delete(token) {
		this.map.delete(token);
		return this;
	}
	has(token) {
		return this.map.has(token);
	}
	keys() {
		return this.map.keys();
	}
};
var HttpUrlEncodingCodec = class {
	encodeKey(key) {
		return standardEncoding(key);
	}
	encodeValue(value) {
		return standardEncoding(value);
	}
	decodeKey(key) {
		return decodeURIComponent(key);
	}
	decodeValue(value) {
		return decodeURIComponent(value);
	}
};
function paramParser(rawParams, codec) {
	const map = /* @__PURE__ */ new Map();
	if (rawParams.length > 0) rawParams.replace(/^\?/, "").split("&").forEach((param) => {
		const eqIdx = param.indexOf("=");
		const [key, val] = eqIdx == -1 ? [codec.decodeKey(param), ""] : [codec.decodeKey(param.slice(0, eqIdx)), codec.decodeValue(param.slice(eqIdx + 1))];
		const list = map.get(key) || [];
		list.push(val);
		map.set(key, list);
	});
	return map;
}
var STANDARD_ENCODING_REGEX = /%(\d[a-f0-9])/gi;
var STANDARD_ENCODING_REPLACEMENTS = {
	"40": "@",
	"3A": ":",
	"24": "$",
	"2C": ",",
	"3B": ";",
	"3D": "=",
	"3F": "?",
	"2F": "/"
};
function standardEncoding(v) {
	return encodeURIComponent(v).replace(STANDARD_ENCODING_REGEX, (s, t) => {
		var _STANDARD_ENCODING_RE;
		return (_STANDARD_ENCODING_RE = STANDARD_ENCODING_REPLACEMENTS[t]) !== null && _STANDARD_ENCODING_RE !== void 0 ? _STANDARD_ENCODING_RE : s;
	});
}
function valueToString(value) {
	return `${value}`;
}
var HttpParams = class HttpParams {
	constructor(options = {}) {
		_defineProperty(this, "map", void 0);
		_defineProperty(this, "encoder", void 0);
		_defineProperty(this, "updates", null);
		_defineProperty(this, "cloneFrom", null);
		this.encoder = options.encoder || new HttpUrlEncodingCodec();
		if (options.fromString) {
			if (options.fromObject) throw new RuntimeError(2805, ngDevMode && "Cannot specify both fromString and fromObject.");
			this.map = paramParser(options.fromString, this.encoder);
		} else if (!!options.fromObject) {
			this.map = /* @__PURE__ */ new Map();
			Object.keys(options.fromObject).forEach((key) => {
				const value = options.fromObject[key];
				const values = Array.isArray(value) ? value.map(valueToString) : [valueToString(value)];
				this.map.set(key, values);
			});
		} else this.map = null;
	}
	has(param) {
		this.init();
		return this.map.has(param);
	}
	get(param) {
		this.init();
		const res = this.map.get(param);
		return !!res ? res[0] : null;
	}
	getAll(param) {
		this.init();
		return this.map.get(param) || null;
	}
	keys() {
		this.init();
		return Array.from(this.map.keys());
	}
	append(param, value) {
		return this.clone({
			param,
			value,
			op: "a"
		});
	}
	appendAll(params) {
		const updates = [];
		Object.keys(params).forEach((param) => {
			const value = params[param];
			if (Array.isArray(value)) value.forEach((_value) => {
				updates.push({
					param,
					value: _value,
					op: "a"
				});
			});
			else updates.push({
				param,
				value,
				op: "a"
			});
		});
		return this.clone(updates);
	}
	set(param, value) {
		return this.clone({
			param,
			value,
			op: "s"
		});
	}
	delete(param, value) {
		return this.clone({
			param,
			value,
			op: "d"
		});
	}
	toString() {
		this.init();
		return this.keys().map((key) => {
			const eKey = this.encoder.encodeKey(key);
			return this.map.get(key).map((value) => eKey + "=" + this.encoder.encodeValue(value)).join("&");
		}).filter((param) => param !== "").join("&");
	}
	clone(update) {
		const clone = new HttpParams({ encoder: this.encoder });
		clone.cloneFrom = this.cloneFrom || this;
		clone.updates = (this.updates || []).concat(update);
		return clone;
	}
	init() {
		if (this.map === null) this.map = /* @__PURE__ */ new Map();
		if (this.cloneFrom !== null) {
			this.cloneFrom.init();
			for (const [key, values] of this.cloneFrom.map.entries()) this.map.set(key, values);
			this.updates.forEach((update) => {
				switch (update.op) {
					case "a":
					case "s":
						const base = update.op === "a" ? (this.map.get(update.param) || []).slice() : [];
						base.push(valueToString(update.value));
						this.map.set(update.param, base);
						break;
					case "d": if (update.value !== void 0) {
						const base = (this.map.get(update.param) || []).slice();
						const idx = base.indexOf(valueToString(update.value));
						if (idx !== -1) base.splice(idx, 1);
						if (base.length > 0) this.map.set(update.param, base);
						else this.map.delete(update.param);
					} else {
						this.map.delete(update.param);
						break;
					}
				}
			});
			this.cloneFrom = this.updates = null;
		}
	}
};
function mightHaveBody(method) {
	switch (method) {
		case "DELETE":
		case "GET":
		case "HEAD":
		case "OPTIONS":
		case "JSONP": return false;
		default: return true;
	}
}
function isArrayBuffer(value) {
	return typeof ArrayBuffer !== "undefined" && value instanceof ArrayBuffer;
}
function isBlob(value) {
	return typeof Blob !== "undefined" && value instanceof Blob;
}
function isFormData(value) {
	return typeof FormData !== "undefined" && value instanceof FormData;
}
function isUrlSearchParams(value) {
	return typeof URLSearchParams !== "undefined" && value instanceof URLSearchParams;
}
var CONTENT_TYPE_HEADER = "Content-Type";
var ACCEPT_HEADER = "Accept";
var TEXT_CONTENT_TYPE = "text/plain";
var JSON_CONTENT_TYPE = "application/json";
var ACCEPT_HEADER_VALUE = `${JSON_CONTENT_TYPE}, ${TEXT_CONTENT_TYPE}, */*`;
var HttpRequest = class HttpRequest {
	constructor(method, url, third, fourth) {
		var _this$headers, _this$context;
		_defineProperty(this, "url", void 0);
		_defineProperty(this, "body", null);
		_defineProperty(this, "headers", void 0);
		_defineProperty(this, "context", void 0);
		_defineProperty(this, "reportProgress", false);
		_defineProperty(this, "reportUploadProgress", false);
		_defineProperty(this, "reportDownloadProgress", false);
		_defineProperty(this, "withCredentials", false);
		_defineProperty(this, "credentials", void 0);
		_defineProperty(this, "keepalive", false);
		_defineProperty(this, "cache", void 0);
		_defineProperty(this, "priority", void 0);
		_defineProperty(this, "mode", void 0);
		_defineProperty(this, "redirect", void 0);
		_defineProperty(this, "referrer", void 0);
		_defineProperty(this, "integrity", void 0);
		_defineProperty(this, "referrerPolicy", void 0);
		_defineProperty(this, "responseType", "json");
		_defineProperty(this, "method", void 0);
		_defineProperty(this, "params", void 0);
		_defineProperty(this, "urlWithParams", void 0);
		_defineProperty(this, "transferCache", void 0);
		_defineProperty(this, "timeout", void 0);
		this.url = url;
		this.method = method.toUpperCase();
		let options;
		if (mightHaveBody(this.method) || !!fourth) {
			this.body = third !== void 0 ? third : null;
			options = fourth;
		} else options = third;
		if (options) {
			this.reportProgress = !!options.reportProgress;
			this.reportUploadProgress = !!options.reportUploadProgress;
			this.reportDownloadProgress = !!options.reportDownloadProgress;
			this.withCredentials = !!options.withCredentials;
			this.keepalive = !!options.keepalive;
			if (!!options.responseType) this.responseType = options.responseType;
			if (options.headers) this.headers = options.headers;
			if (options.context) this.context = options.context;
			if (options.params) this.params = options.params;
			if (options.priority) this.priority = options.priority;
			if (options.cache) this.cache = options.cache;
			if (options.credentials) this.credentials = options.credentials;
			if (typeof options.timeout === "number") {
				if (options.timeout < 1 || !Number.isInteger(options.timeout)) throw new RuntimeError(2822, ngDevMode ? "`timeout` must be a positive integer value" : "");
				this.timeout = options.timeout;
			}
			if (options.mode) this.mode = options.mode;
			if (options.redirect) this.redirect = options.redirect;
			if (options.integrity) this.integrity = options.integrity;
			if (options.referrer !== void 0) this.referrer = options.referrer;
			if (options.referrerPolicy) this.referrerPolicy = options.referrerPolicy;
			this.transferCache = options.transferCache;
		}
		(_this$headers = this.headers) !== null && _this$headers !== void 0 || (this.headers = new HttpHeaders());
		(_this$context = this.context) !== null && _this$context !== void 0 || (this.context = new HttpContext());
		if (!this.params) {
			this.params = new HttpParams();
			this.urlWithParams = url;
		} else {
			const params = this.params.toString();
			if (params.length === 0) this.urlWithParams = url;
			else {
				let urlWithoutFragment = url;
				let fragment = "";
				const hashIdx = url.indexOf("#");
				if (hashIdx !== -1) {
					fragment = url.substring(hashIdx);
					urlWithoutFragment = url.substring(0, hashIdx);
				}
				const qIdx = urlWithoutFragment.indexOf("?");
				const sep = qIdx === -1 ? "?" : qIdx < urlWithoutFragment.length - 1 ? "&" : "";
				this.urlWithParams = urlWithoutFragment + sep + params + fragment;
			}
		}
	}
	serializeBody() {
		if (this.body === null) return null;
		if (typeof this.body === "string" || isArrayBuffer(this.body) || isBlob(this.body) || isFormData(this.body) || isUrlSearchParams(this.body)) return this.body;
		if (this.body instanceof HttpParams) return this.body.toString();
		if (typeof this.body === "object" || typeof this.body === "boolean" || Array.isArray(this.body)) return JSON.stringify(this.body);
		return this.body.toString();
	}
	detectContentTypeHeader() {
		if (this.body === null) return null;
		if (isFormData(this.body)) return null;
		if (isBlob(this.body)) return this.body.type || null;
		if (isArrayBuffer(this.body)) return null;
		if (typeof this.body === "string") return TEXT_CONTENT_TYPE;
		if (this.body instanceof HttpParams) return "application/x-www-form-urlencoded;charset=UTF-8";
		if (typeof this.body === "object" || typeof this.body === "number" || typeof this.body === "boolean") return JSON_CONTENT_TYPE;
		return null;
	}
	clone(update = {}) {
		var _update$keepalive, _update$referrer, _update$transferCache, _update$timeout, _update$withCredentia, _update$reportProgres, _update$reportUploadP, _update$reportDownloa, _update$context;
		const method = update.method || this.method;
		const url = update.url || this.url;
		const responseType = update.responseType || this.responseType;
		const keepalive = (_update$keepalive = update.keepalive) !== null && _update$keepalive !== void 0 ? _update$keepalive : this.keepalive;
		const priority = update.priority || this.priority;
		const cache = update.cache || this.cache;
		const mode = update.mode || this.mode;
		const redirect = update.redirect || this.redirect;
		const credentials = update.credentials || this.credentials;
		const referrer = (_update$referrer = update.referrer) !== null && _update$referrer !== void 0 ? _update$referrer : this.referrer;
		const integrity = update.integrity || this.integrity;
		const referrerPolicy = update.referrerPolicy || this.referrerPolicy;
		const transferCache = (_update$transferCache = update.transferCache) !== null && _update$transferCache !== void 0 ? _update$transferCache : this.transferCache;
		const timeout = (_update$timeout = update.timeout) !== null && _update$timeout !== void 0 ? _update$timeout : this.timeout;
		const body = update.body !== void 0 ? update.body : this.body;
		const withCredentials = (_update$withCredentia = update.withCredentials) !== null && _update$withCredentia !== void 0 ? _update$withCredentia : this.withCredentials;
		const reportProgress = (_update$reportProgres = update.reportProgress) !== null && _update$reportProgres !== void 0 ? _update$reportProgres : this.reportProgress;
		const reportUploadProgress = (_update$reportUploadP = update.reportUploadProgress) !== null && _update$reportUploadP !== void 0 ? _update$reportUploadP : this.reportUploadProgress;
		const reportDownloadProgress = (_update$reportDownloa = update.reportDownloadProgress) !== null && _update$reportDownloa !== void 0 ? _update$reportDownloa : this.reportDownloadProgress;
		let headers = update.headers || this.headers;
		let params = update.params || this.params;
		const context = (_update$context = update.context) !== null && _update$context !== void 0 ? _update$context : this.context;
		if (update.setHeaders !== void 0) headers = Object.keys(update.setHeaders).reduce((headers, name) => headers.set(name, update.setHeaders[name]), headers);
		if (update.setParams) params = Object.keys(update.setParams).reduce((params, param) => params.set(param, update.setParams[param]), params);
		return new HttpRequest(method, url, body, {
			params,
			headers,
			context,
			reportProgress,
			reportUploadProgress,
			reportDownloadProgress,
			responseType,
			withCredentials,
			transferCache,
			keepalive,
			cache,
			priority,
			timeout,
			mode,
			redirect,
			credentials,
			referrer,
			integrity,
			referrerPolicy
		});
	}
};
var HttpEventType;
(function(HttpEventType) {
	HttpEventType[HttpEventType["Sent"] = 0] = "Sent";
	HttpEventType[HttpEventType["UploadProgress"] = 1] = "UploadProgress";
	HttpEventType[HttpEventType["ResponseHeader"] = 2] = "ResponseHeader";
	HttpEventType[HttpEventType["DownloadProgress"] = 3] = "DownloadProgress";
	HttpEventType[HttpEventType["Response"] = 4] = "Response";
	HttpEventType[HttpEventType["User"] = 5] = "User";
})(HttpEventType || (HttpEventType = {}));
var HttpResponseBase = class {
	constructor(init, defaultStatus = 200, defaultStatusText = "OK") {
		_defineProperty(this, "headers", void 0);
		_defineProperty(this, "status", void 0);
		_defineProperty(this, "statusText", void 0);
		_defineProperty(this, "url", void 0);
		_defineProperty(this, "ok", void 0);
		_defineProperty(this, "type", void 0);
		_defineProperty(this, "redirected", void 0);
		_defineProperty(this, "responseType", void 0);
		this.headers = init.headers || new HttpHeaders();
		this.status = init.status !== void 0 ? init.status : defaultStatus;
		this.statusText = init.statusText || defaultStatusText;
		this.url = init.url || null;
		this.redirected = init.redirected;
		this.responseType = init.responseType;
		this.ok = this.status >= 200 && this.status < 300;
	}
};
var HttpHeaderResponse = class HttpHeaderResponse extends HttpResponseBase {
	constructor(init = {}) {
		super(init);
		_defineProperty(this, "type", HttpEventType.ResponseHeader);
	}
	clone(update = {}) {
		return new HttpHeaderResponse({
			headers: update.headers || this.headers,
			status: update.status !== void 0 ? update.status : this.status,
			statusText: update.statusText || this.statusText,
			url: update.url || this.url || void 0
		});
	}
};
var HttpResponse = class HttpResponse extends HttpResponseBase {
	constructor(init = {}) {
		super(init);
		_defineProperty(this, "body", void 0);
		_defineProperty(this, "type", HttpEventType.Response);
		this.body = init.body !== void 0 ? init.body : null;
	}
	clone(update = {}) {
		var _update$redirected, _update$responseType;
		return new HttpResponse({
			body: update.body !== void 0 ? update.body : this.body,
			headers: update.headers || this.headers,
			status: update.status !== void 0 ? update.status : this.status,
			statusText: update.statusText || this.statusText,
			url: update.url || this.url || void 0,
			redirected: (_update$redirected = update.redirected) !== null && _update$redirected !== void 0 ? _update$redirected : this.redirected,
			responseType: (_update$responseType = update.responseType) !== null && _update$responseType !== void 0 ? _update$responseType : this.responseType
		});
	}
};
var HttpErrorResponse = class extends HttpResponseBase {
	constructor(init) {
		super(init, 0, "Unknown Error");
		_defineProperty(this, "name", "HttpErrorResponse");
		_defineProperty(this, "message", void 0);
		_defineProperty(this, "error", void 0);
		_defineProperty(this, "ok", false);
		if (this.status >= 200 && this.status < 300) this.message = `Http failure during parsing for ${init.url || "(unknown url)"}`;
		else this.message = `Http failure response for ${init.url || "(unknown url)"}: ${init.status} ${init.statusText}`;
		this.error = init.error || null;
	}
};
var HTTP_STATUS_CODE_OK = 200;
var HTTP_STATUS_CODE_NO_CONTENT = 204;
var HttpStatusCode;
(function(HttpStatusCode) {
	HttpStatusCode[HttpStatusCode["Continue"] = 100] = "Continue";
	HttpStatusCode[HttpStatusCode["SwitchingProtocols"] = 101] = "SwitchingProtocols";
	HttpStatusCode[HttpStatusCode["Processing"] = 102] = "Processing";
	HttpStatusCode[HttpStatusCode["EarlyHints"] = 103] = "EarlyHints";
	HttpStatusCode[HttpStatusCode["Ok"] = 200] = "Ok";
	HttpStatusCode[HttpStatusCode["Created"] = 201] = "Created";
	HttpStatusCode[HttpStatusCode["Accepted"] = 202] = "Accepted";
	HttpStatusCode[HttpStatusCode["NonAuthoritativeInformation"] = 203] = "NonAuthoritativeInformation";
	HttpStatusCode[HttpStatusCode["NoContent"] = 204] = "NoContent";
	HttpStatusCode[HttpStatusCode["ResetContent"] = 205] = "ResetContent";
	HttpStatusCode[HttpStatusCode["PartialContent"] = 206] = "PartialContent";
	HttpStatusCode[HttpStatusCode["MultiStatus"] = 207] = "MultiStatus";
	HttpStatusCode[HttpStatusCode["AlreadyReported"] = 208] = "AlreadyReported";
	HttpStatusCode[HttpStatusCode["ImUsed"] = 226] = "ImUsed";
	HttpStatusCode[HttpStatusCode["MultipleChoices"] = 300] = "MultipleChoices";
	HttpStatusCode[HttpStatusCode["MovedPermanently"] = 301] = "MovedPermanently";
	HttpStatusCode[HttpStatusCode["Found"] = 302] = "Found";
	HttpStatusCode[HttpStatusCode["SeeOther"] = 303] = "SeeOther";
	HttpStatusCode[HttpStatusCode["NotModified"] = 304] = "NotModified";
	HttpStatusCode[HttpStatusCode["UseProxy"] = 305] = "UseProxy";
	HttpStatusCode[HttpStatusCode["Unused"] = 306] = "Unused";
	HttpStatusCode[HttpStatusCode["TemporaryRedirect"] = 307] = "TemporaryRedirect";
	HttpStatusCode[HttpStatusCode["PermanentRedirect"] = 308] = "PermanentRedirect";
	HttpStatusCode[HttpStatusCode["BadRequest"] = 400] = "BadRequest";
	HttpStatusCode[HttpStatusCode["Unauthorized"] = 401] = "Unauthorized";
	HttpStatusCode[HttpStatusCode["PaymentRequired"] = 402] = "PaymentRequired";
	HttpStatusCode[HttpStatusCode["Forbidden"] = 403] = "Forbidden";
	HttpStatusCode[HttpStatusCode["NotFound"] = 404] = "NotFound";
	HttpStatusCode[HttpStatusCode["MethodNotAllowed"] = 405] = "MethodNotAllowed";
	HttpStatusCode[HttpStatusCode["NotAcceptable"] = 406] = "NotAcceptable";
	HttpStatusCode[HttpStatusCode["ProxyAuthenticationRequired"] = 407] = "ProxyAuthenticationRequired";
	HttpStatusCode[HttpStatusCode["RequestTimeout"] = 408] = "RequestTimeout";
	HttpStatusCode[HttpStatusCode["Conflict"] = 409] = "Conflict";
	HttpStatusCode[HttpStatusCode["Gone"] = 410] = "Gone";
	HttpStatusCode[HttpStatusCode["LengthRequired"] = 411] = "LengthRequired";
	HttpStatusCode[HttpStatusCode["PreconditionFailed"] = 412] = "PreconditionFailed";
	HttpStatusCode[HttpStatusCode["PayloadTooLarge"] = 413] = "PayloadTooLarge";
	HttpStatusCode[HttpStatusCode["UriTooLong"] = 414] = "UriTooLong";
	HttpStatusCode[HttpStatusCode["UnsupportedMediaType"] = 415] = "UnsupportedMediaType";
	HttpStatusCode[HttpStatusCode["RangeNotSatisfiable"] = 416] = "RangeNotSatisfiable";
	HttpStatusCode[HttpStatusCode["ExpectationFailed"] = 417] = "ExpectationFailed";
	HttpStatusCode[HttpStatusCode["ImATeapot"] = 418] = "ImATeapot";
	HttpStatusCode[HttpStatusCode["MisdirectedRequest"] = 421] = "MisdirectedRequest";
	HttpStatusCode[HttpStatusCode["UnprocessableEntity"] = 422] = "UnprocessableEntity";
	HttpStatusCode[HttpStatusCode["Locked"] = 423] = "Locked";
	HttpStatusCode[HttpStatusCode["FailedDependency"] = 424] = "FailedDependency";
	HttpStatusCode[HttpStatusCode["TooEarly"] = 425] = "TooEarly";
	HttpStatusCode[HttpStatusCode["UpgradeRequired"] = 426] = "UpgradeRequired";
	HttpStatusCode[HttpStatusCode["PreconditionRequired"] = 428] = "PreconditionRequired";
	HttpStatusCode[HttpStatusCode["TooManyRequests"] = 429] = "TooManyRequests";
	HttpStatusCode[HttpStatusCode["RequestHeaderFieldsTooLarge"] = 431] = "RequestHeaderFieldsTooLarge";
	HttpStatusCode[HttpStatusCode["UnavailableForLegalReasons"] = 451] = "UnavailableForLegalReasons";
	HttpStatusCode[HttpStatusCode["InternalServerError"] = 500] = "InternalServerError";
	HttpStatusCode[HttpStatusCode["NotImplemented"] = 501] = "NotImplemented";
	HttpStatusCode[HttpStatusCode["BadGateway"] = 502] = "BadGateway";
	HttpStatusCode[HttpStatusCode["ServiceUnavailable"] = 503] = "ServiceUnavailable";
	HttpStatusCode[HttpStatusCode["GatewayTimeout"] = 504] = "GatewayTimeout";
	HttpStatusCode[HttpStatusCode["HttpVersionNotSupported"] = 505] = "HttpVersionNotSupported";
	HttpStatusCode[HttpStatusCode["VariantAlsoNegotiates"] = 506] = "VariantAlsoNegotiates";
	HttpStatusCode[HttpStatusCode["InsufficientStorage"] = 507] = "InsufficientStorage";
	HttpStatusCode[HttpStatusCode["LoopDetected"] = 508] = "LoopDetected";
	HttpStatusCode[HttpStatusCode["NotExtended"] = 510] = "NotExtended";
	HttpStatusCode[HttpStatusCode["NetworkAuthenticationRequired"] = 511] = "NetworkAuthenticationRequired";
})(HttpStatusCode || (HttpStatusCode = {}));
var XSSI_PREFIX$1 = /^\)\]\}',?\n/;
var HTTP_FETCH_MAX_RESPONSE_SIZE = new InjectionToken(typeof ngDevMode !== "undefined" && ngDevMode ? "HTTP_FETCH_MAX_RESPONSE_SIZE" : "", { factory: () => null });
var FetchBackend = class {
	constructor() {
		var _inject$fetch, _inject;
		_defineProperty(this, "fetchImpl", (_inject$fetch = (_inject = inject(FetchFactory, { optional: true })) === null || _inject === void 0 ? void 0 : _inject.fetch) !== null && _inject$fetch !== void 0 ? _inject$fetch : ((...args) => globalThis.fetch(...args)));
		_defineProperty(this, "ngZone", inject(NgZone));
		_defineProperty(this, "destroyRef", inject(DestroyRef));
		_defineProperty(this, "maxResponseSize", inject(HTTP_FETCH_MAX_RESPONSE_SIZE));
	}
	handle(request) {
		return new Observable((observer) => {
			const aborter = new AbortController();
			let done = false;
			const wrappedObserver = {
				next: (val) => {
					if (val.type === HttpEventType.Response) done = true;
					observer.next(val);
				},
				error: (err) => {
					done = true;
					observer.error(err);
				},
				complete: () => {
					done = true;
					observer.complete();
				}
			};
			this.doRequest(request, aborter.signal, wrappedObserver).then(noop, (error) => wrappedObserver.error(new HttpErrorResponse({ error })));
			let timeoutId;
			if (request.timeout) timeoutId = this.ngZone.runOutsideAngular(() => setTimeout(() => {
				if (!aborter.signal.aborted) aborter.abort(new DOMException("signal timed out", "TimeoutError"));
			}, request.timeout));
			return () => {
				if (timeoutId !== void 0) clearTimeout(timeoutId);
				if (!done && !aborter.signal.aborted) aborter.abort();
			};
		});
	}
	doRequest(request, signal, observer) {
		var _this = this;
		return _asyncToGenerator(function* () {
			const init = _this.createRequestInit(request);
			let response;
			try {
				const fetchPromise = _this.ngZone.runOutsideAngular(() => _this.fetchImpl(request.urlWithParams, _objectSpread2({ signal }, init)));
				silenceSuperfluousUnhandledPromiseRejection(fetchPromise);
				observer.next({ type: HttpEventType.Sent });
				response = yield fetchPromise;
			} catch (error) {
				var _error$status;
				observer.error(new HttpErrorResponse({
					error,
					status: (_error$status = error.status) !== null && _error$status !== void 0 ? _error$status : 0,
					statusText: error.statusText,
					url: request.urlWithParams,
					headers: error.headers
				}));
				return;
			}
			const headers = new HttpHeaders(response.headers);
			const statusText = response.statusText;
			const url = response.url || request.urlWithParams;
			let status = response.status;
			let body = null;
			const reportDownloadProgress = request.reportProgress || request.reportDownloadProgress;
			if (reportDownloadProgress) observer.next(new HttpHeaderResponse({
				headers,
				status,
				statusText,
				url
			}));
			if (response.body) {
				var _response$headers$get;
				const contentType = (_response$headers$get = response.headers.get(CONTENT_TYPE_HEADER)) !== null && _response$headers$get !== void 0 ? _response$headers$get : "";
				const contentLength = response.headers.get("content-length");
				const contentLengthValue = contentLength !== null ? Number(contentLength) : NaN;
				if (_this.maxResponseSize !== null && Number.isFinite(contentLengthValue) && contentLengthValue > _this.maxResponseSize) {
					yield response.body.cancel();
					throwBodyTooLargeError(_this.maxResponseSize);
				}
				const chunks = [];
				const reader = response.body.getReader();
				let receivedLength = 0;
				let decoder;
				let partialText;
				const reqZone = typeof Zone !== "undefined" && Zone.current;
				let canceled = false;
				yield _this.ngZone.runOutsideAngular(_asyncToGenerator(function* () {
					while (true) {
						if (_this.destroyRef.destroyed) {
							yield reader.cancel();
							canceled = true;
							break;
						}
						const { done, value } = yield reader.read();
						if (done) break;
						chunks.push(value);
						receivedLength += value.length;
						if (_this.maxResponseSize !== null && receivedLength > _this.maxResponseSize) {
							yield reader.cancel();
							throwBodyTooLargeError(_this.maxResponseSize);
						}
						if (reportDownloadProgress) {
							var _partialText, _decoder;
							partialText = request.responseType === "text" ? ((_partialText = partialText) !== null && _partialText !== void 0 ? _partialText : "") + ((_decoder = decoder) !== null && _decoder !== void 0 ? _decoder : decoder = getTextDecoder(contentType)).decode(value, { stream: true }) : void 0;
							const reportProgress = () => observer.next({
								type: HttpEventType.DownloadProgress,
								total: Number.isFinite(contentLengthValue) ? contentLengthValue : void 0,
								loaded: receivedLength,
								partialText
							});
							reqZone ? reqZone.run(reportProgress) : reportProgress();
						}
					}
				}));
				if (canceled) {
					observer.complete();
					return;
				}
				const chunksAll = _this.concatChunks(chunks, receivedLength);
				try {
					body = _this.parseBody(request, chunksAll, contentType, status);
				} catch (error) {
					observer.error(new HttpErrorResponse({
						error,
						headers: new HttpHeaders(response.headers),
						status: response.status,
						statusText: response.statusText,
						url: response.url || request.urlWithParams
					}));
					return;
				}
			}
			if (status === 0) status = body ? HTTP_STATUS_CODE_OK : 0;
			const ok = status >= 200 && status < 300;
			const redirected = response.redirected;
			const responseType = response.type;
			if (ok) {
				observer.next(new HttpResponse({
					body,
					headers,
					status,
					statusText,
					url,
					redirected,
					responseType
				}));
				observer.complete();
			} else observer.error(new HttpErrorResponse({
				error: body,
				headers,
				status,
				statusText,
				url,
				redirected,
				responseType
			}));
		})();
	}
	parseBody(request, binContent, contentType, status) {
		switch (request.responseType) {
			case "json":
				const text = new TextDecoder().decode(binContent).replace(XSSI_PREFIX$1, "");
				if (text === "") return null;
				try {
					return JSON.parse(text);
				} catch (e) {
					if (status < 200 || status >= 300) return text;
					throw e;
				}
			case "text": return getTextDecoder(contentType).decode(binContent);
			case "blob": return new Blob([binContent], { type: contentType });
			case "arraybuffer": return binContent.buffer;
		}
	}
	createRequestInit(req) {
		if (req.reportUploadProgress) throw new RuntimeError(2824, ngDevMode && "The FetchBackend does not support upload progress reporting. Please use `withXhr()` on your `provideHttpClient()` configuration if you want to report upload progress.");
		const headers = {};
		let credentials;
		credentials = req.credentials;
		if (req.withCredentials) {
			(typeof ngDevMode === "undefined" || ngDevMode) && warningOptionsMessage(req);
			credentials = "include";
		}
		req.headers.forEach((name, values) => headers[name] = values.join(","));
		if (!req.headers.has(ACCEPT_HEADER)) headers[ACCEPT_HEADER] = ACCEPT_HEADER_VALUE;
		if (!req.headers.has(CONTENT_TYPE_HEADER)) {
			const detectedType = req.detectContentTypeHeader();
			if (detectedType !== null) headers[CONTENT_TYPE_HEADER] = detectedType;
		}
		return {
			body: req.serializeBody(),
			method: req.method,
			headers,
			credentials,
			keepalive: req.keepalive,
			cache: req.cache,
			priority: req.priority,
			mode: req.mode,
			redirect: req.redirect,
			referrer: req.referrer,
			integrity: req.integrity,
			referrerPolicy: req.referrerPolicy
		};
	}
	concatChunks(chunks, totalLength) {
		const chunksAll = new Uint8Array(totalLength);
		let position = 0;
		for (const chunk of chunks) {
			chunksAll.set(chunk, position);
			position += chunk.length;
		}
		return chunksAll;
	}
};
_FetchBackend = FetchBackend;
_defineProperty(FetchBackend, "ɵfac", function FetchBackend_Factory(__ngFactoryType__) {
	return new (__ngFactoryType__ || _FetchBackend)();
});
_defineProperty(FetchBackend, "ɵprov", /*@__PURE__*/ ɵɵdefineService({
	token: _FetchBackend,
	factory: _FetchBackend.ɵfac
}));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(FetchBackend, [{ type: Service }], null, null);
})();
var FetchFactory = class {};
function noop() {}
function warningOptionsMessage(req) {
	if (req.credentials && req.withCredentials) console.warn(formatRuntimeError(2819, `Angular detected that a \`HttpClient\` request has both \`withCredentials: true\` and \`credentials: '${req.credentials}'\` options. The \`withCredentials\` option is overriding the explicit \`credentials\` setting to 'include'. Consider removing \`withCredentials\` and using \`credentials: '${req.credentials}'\` directly for clarity.`));
}
function silenceSuperfluousUnhandledPromiseRejection(promise) {
	promise.then(noop, noop);
}
function throwBodyTooLargeError(maxResponseSize) {
	throw new RuntimeError(-2825, ngDevMode && `Fetch response body exceeded the configured buffer limit (${maxResponseSize} bytes).`);
}
var CHARSET_REGEX = /charset=\s*["']?([^;"'\s]+)["']?/i;
function getTextDecoder(contentType) {
	const match = contentType.match(CHARSET_REGEX);
	if (match !== null) try {
		return new TextDecoder(match[1]);
	} catch (_unused) {}
	return new TextDecoder();
}
var XSRF_ENABLED = new InjectionToken(typeof ngDevMode !== "undefined" && ngDevMode ? "XSRF_ENABLED" : "", { factory: () => true });
var XSRF_DEFAULT_COOKIE_NAME = "XSRF-TOKEN";
var XSRF_COOKIE_NAME = new InjectionToken(typeof ngDevMode !== "undefined" && ngDevMode ? "XSRF_COOKIE_NAME" : "", { factory: () => XSRF_DEFAULT_COOKIE_NAME });
var XSRF_DEFAULT_HEADER_NAME = "X-XSRF-TOKEN";
var XSRF_HEADER_NAME = new InjectionToken(typeof ngDevMode !== "undefined" && ngDevMode ? "XSRF_HEADER_NAME" : "", { factory: () => XSRF_DEFAULT_HEADER_NAME });
var HttpXsrfCookieExtractor = class {
	constructor() {
		_defineProperty(this, "cookieName", inject(XSRF_COOKIE_NAME));
		_defineProperty(this, "doc", inject(DOCUMENT));
		_defineProperty(this, "lastCookieString", "");
		_defineProperty(this, "lastToken", null);
		_defineProperty(this, "parseCount", 0);
	}
	getToken() {
		const cookieString = this.doc.cookie || "";
		if (cookieString !== this.lastCookieString) {
			this.parseCount++;
			this.lastToken = parseCookieValue(cookieString, this.cookieName);
			this.lastCookieString = cookieString;
		}
		return this.lastToken;
	}
};
_HttpXsrfCookieExtractor = HttpXsrfCookieExtractor;
_defineProperty(HttpXsrfCookieExtractor, "ɵfac", function HttpXsrfCookieExtractor_Factory(__ngFactoryType__) {
	return new (__ngFactoryType__ || _HttpXsrfCookieExtractor)();
});
_defineProperty(HttpXsrfCookieExtractor, "ɵprov", /*@__PURE__*/ ɵɵdefineService({
	token: _HttpXsrfCookieExtractor,
	factory: _HttpXsrfCookieExtractor.ɵfac
}));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(HttpXsrfCookieExtractor, [{ type: Service }], null, null);
})();
var HttpXsrfTokenExtractor = class {};
_HttpXsrfTokenExtractor = HttpXsrfTokenExtractor;
_defineProperty(HttpXsrfTokenExtractor, "ɵfac", function HttpXsrfTokenExtractor_Factory(__ngFactoryType__) {
	return new (__ngFactoryType__ || _HttpXsrfTokenExtractor)();
});
_defineProperty(HttpXsrfTokenExtractor, "ɵprov", /*@__PURE__*/ ɵɵdefineInjectable({
	token: _HttpXsrfTokenExtractor,
	factory: function HttpXsrfTokenExtractor_Factory(__ngFactoryType__) {
		let __ngConditionalFactory__ = null;
		if (__ngFactoryType__) __ngConditionalFactory__ = new (__ngFactoryType__ || _HttpXsrfTokenExtractor)();
		else __ngConditionalFactory__ = ɵɵinject(HttpXsrfCookieExtractor);
		return __ngConditionalFactory__;
	},
	providedIn: "root"
}));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(HttpXsrfTokenExtractor, [{
		type: Injectable,
		args: [{
			providedIn: "root",
			useExisting: HttpXsrfCookieExtractor
		}]
	}], null, null);
})();
function xsrfInterceptorFn(req, next) {
	if (!inject(XSRF_ENABLED) || req.method === "GET" || req.method === "HEAD") return next(req);
	try {
		const locationHref = inject(PlatformLocation).href;
		const { origin: locationOrigin } = new URL(locationHref);
		const { origin: requestOrigin } = new URL(req.url, locationOrigin);
		if (locationOrigin !== requestOrigin) return next(req);
	} catch (_unused2) {
		return next(req);
	}
	const token = inject(HttpXsrfTokenExtractor).getToken();
	const headerName = inject(XSRF_HEADER_NAME);
	if (token != null && !req.headers.has(headerName)) req = req.clone({ headers: req.headers.set(headerName, token) });
	return next(req);
}
var HttpXsrfInterceptor = class {
	constructor() {
		_defineProperty(this, "injector", inject(EnvironmentInjector));
	}
	intercept(initialRequest, next) {
		return runInInjectionContext(this.injector, () => xsrfInterceptorFn(initialRequest, (downstreamRequest) => next.handle(downstreamRequest)));
	}
};
_HttpXsrfInterceptor = HttpXsrfInterceptor;
_defineProperty(HttpXsrfInterceptor, "ɵfac", function HttpXsrfInterceptor_Factory(__ngFactoryType__) {
	return new (__ngFactoryType__ || _HttpXsrfInterceptor)();
});
_defineProperty(HttpXsrfInterceptor, "ɵprov", /*@__PURE__*/ ɵɵdefineInjectable({
	token: _HttpXsrfInterceptor,
	factory: _HttpXsrfInterceptor.ɵfac
}));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(HttpXsrfInterceptor, [{ type: Injectable }], null, null);
})();
function interceptorChainEndFn(req, finalHandlerFn) {
	return finalHandlerFn(req);
}
function adaptLegacyInterceptorToChain(chainTailFn, interceptor) {
	return (initialRequest, finalHandlerFn) => interceptor.intercept(initialRequest, { handle: (downstreamRequest) => chainTailFn(downstreamRequest, finalHandlerFn) });
}
function chainedInterceptorFn(chainTailFn, interceptorFn, injector) {
	return (initialRequest, finalHandlerFn) => runInInjectionContext(injector, () => interceptorFn(initialRequest, (downstreamRequest) => chainTailFn(downstreamRequest, finalHandlerFn)));
}
var HTTP_INTERCEPTORS = new InjectionToken(typeof ngDevMode !== "undefined" && ngDevMode ? "HTTP_INTERCEPTORS" : "");
var HTTP_INTERCEPTOR_FNS = new InjectionToken(typeof ngDevMode !== "undefined" && ngDevMode ? "HTTP_INTERCEPTOR_FNS" : "", { factory: () => [xsrfInterceptorFn] });
var HTTP_ROOT_INTERCEPTOR_FNS = new InjectionToken(typeof ngDevMode !== "undefined" && ngDevMode ? "HTTP_ROOT_INTERCEPTOR_FNS" : "");
var REQUESTS_CONTRIBUTE_TO_STABILITY = new InjectionToken(typeof ngDevMode !== "undefined" && ngDevMode ? "REQUESTS_CONTRIBUTE_TO_STABILITY" : "", { factory: () => true });
function legacyInterceptorFnFactory() {
	let chain = null;
	return (req, handler) => {
		if (chain === null) {
			var _inject2;
			chain = ((_inject2 = inject(HTTP_INTERCEPTORS, { optional: true })) !== null && _inject2 !== void 0 ? _inject2 : []).reduceRight(adaptLegacyInterceptorToChain, interceptorChainEndFn);
		}
		const pendingTasks = inject(PendingTasks);
		if (inject(REQUESTS_CONTRIBUTE_TO_STABILITY)) {
			const removeTask = pendingTasks.add();
			return chain(req, handler).pipe(finalize(removeTask));
		} else return chain(req, handler);
	};
}
var HttpBackend = class {};
_HttpBackend = HttpBackend;
_defineProperty(HttpBackend, "ɵfac", function HttpBackend_Factory(__ngFactoryType__) {
	return new (__ngFactoryType__ || _HttpBackend)();
});
_defineProperty(HttpBackend, "ɵprov", /*@__PURE__*/ ɵɵdefineInjectable({
	token: _HttpBackend,
	factory: function HttpBackend_Factory(__ngFactoryType__) {
		let __ngConditionalFactory__ = null;
		if (__ngFactoryType__) __ngConditionalFactory__ = new (__ngFactoryType__ || _HttpBackend)();
		else __ngConditionalFactory__ = ɵɵinject(FetchBackend);
		return __ngConditionalFactory__;
	},
	providedIn: "root"
}));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(HttpBackend, [{
		type: Injectable,
		args: [{
			providedIn: "root",
			useExisting: FetchBackend
		}]
	}], null, null);
})();
var HttpInterceptorHandler = class {
	constructor(backend, injector) {
		_defineProperty(this, "backend", void 0);
		_defineProperty(this, "injector", void 0);
		_defineProperty(this, "chain", null);
		_defineProperty(this, "pendingTasks", inject(PendingTasks));
		_defineProperty(this, "contributeToStability", inject(REQUESTS_CONTRIBUTE_TO_STABILITY));
		this.backend = backend;
		this.injector = injector;
		if ((typeof ngDevMode === "undefined" || ngDevMode) && true) this.backend.isTestingBackend;
	}
	handle(initialRequest) {
		if (this.chain === null) {
			const parentHandler = this.injector.get(HttpHandler, null, { skipSelf: true });
			const isDelegating = parentHandler !== null && this.backend === parentHandler;
			const rootInterceptorFns = this.injector.get(HTTP_ROOT_INTERCEPTOR_FNS, [], isDelegating ? { self: true } : void 0);
			const dedupedInterceptorFns = Array.from(/* @__PURE__ */ new Set([...this.injector.get(HTTP_INTERCEPTOR_FNS), ...rootInterceptorFns]));
			this.chain = dedupedInterceptorFns.reduceRight((nextSequencedFn, interceptorFn) => chainedInterceptorFn(nextSequencedFn, interceptorFn, this.injector), interceptorChainEndFn);
		}
		const chain = this.chain;
		if (this.contributeToStability) {
			const removeTask = this.pendingTasks.add();
			return untracked(() => chain(initialRequest, (downstreamRequest) => this.backend.handle(downstreamRequest))).pipe(finalize(removeTask));
		} else return untracked(() => chain(initialRequest, (downstreamRequest) => this.backend.handle(downstreamRequest)));
	}
};
_HttpInterceptorHandler = HttpInterceptorHandler;
_defineProperty(HttpInterceptorHandler, "ɵfac", function HttpInterceptorHandler_Factory(__ngFactoryType__) {
	return new (__ngFactoryType__ || _HttpInterceptorHandler)(ɵɵinject(HttpBackend), ɵɵinject(EnvironmentInjector));
});
_defineProperty(HttpInterceptorHandler, "ɵprov", /*@__PURE__*/ ɵɵdefineInjectable({
	token: _HttpInterceptorHandler,
	factory: _HttpInterceptorHandler.ɵfac,
	providedIn: "root"
}));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(HttpInterceptorHandler, [{
		type: Injectable,
		args: [{ providedIn: "root" }]
	}], () => [{ type: HttpBackend }, { type: EnvironmentInjector }], null);
})();
var HttpHandler = class {};
_HttpHandler = HttpHandler;
_defineProperty(HttpHandler, "ɵfac", function HttpHandler_Factory(__ngFactoryType__) {
	return new (__ngFactoryType__ || _HttpHandler)();
});
_defineProperty(HttpHandler, "ɵprov", /*@__PURE__*/ ɵɵdefineInjectable({
	token: _HttpHandler,
	factory: function HttpHandler_Factory(__ngFactoryType__) {
		let __ngConditionalFactory__ = null;
		if (__ngFactoryType__) __ngConditionalFactory__ = new (__ngFactoryType__ || _HttpHandler)();
		else __ngConditionalFactory__ = ɵɵinject(HttpInterceptorHandler);
		return __ngConditionalFactory__;
	},
	providedIn: "root"
}));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(HttpHandler, [{
		type: Injectable,
		args: [{
			providedIn: "root",
			useExisting: HttpInterceptorHandler
		}]
	}], null, null);
})();
function addBody(options, body) {
	return _objectSpread2({ body }, options);
}
var HttpClient = class {
	constructor(handler) {
		_defineProperty(this, "handler", void 0);
		this.handler = handler;
	}
	request(first, url, options = {}) {
		let req;
		if (first instanceof HttpRequest) req = first;
		else {
			let headers = void 0;
			if (options.headers instanceof HttpHeaders) headers = options.headers;
			else headers = new HttpHeaders(options.headers);
			let params = void 0;
			if (!!options.params) {
				if (options.params instanceof HttpParams) params = options.params;
				else params = new HttpParams({ fromObject: options.params });
			}
			req = new HttpRequest(first, url, options.body !== void 0 ? options.body : null, {
				headers,
				context: options.context,
				params,
				reportProgress: options.reportProgress,
				reportUploadProgress: options.reportUploadProgress,
				reportDownloadProgress: options.reportDownloadProgress,
				responseType: options.responseType || "json",
				withCredentials: options.withCredentials,
				transferCache: options.transferCache,
				keepalive: options.keepalive,
				priority: options.priority,
				cache: options.cache,
				mode: options.mode,
				redirect: options.redirect,
				credentials: options.credentials,
				referrer: options.referrer,
				referrerPolicy: options.referrerPolicy,
				integrity: options.integrity,
				timeout: options.timeout
			});
		}
		const events$ = of(req).pipe(concatMap((req) => this.handler.handle(req)));
		if (first instanceof HttpRequest || options.observe === "events") return events$;
		const res$ = events$.pipe(filter((event) => event instanceof HttpResponse));
		switch (options.observe || "body") {
			case "body": switch (req.responseType) {
				case "arraybuffer": return res$.pipe(map((res) => {
					if (res.body !== null && !(res.body instanceof ArrayBuffer)) throw new RuntimeError(2806, ngDevMode && "Response is not an ArrayBuffer.");
					return res.body;
				}));
				case "blob": return res$.pipe(map((res) => {
					if (res.body !== null && !(res.body instanceof Blob)) throw new RuntimeError(2807, ngDevMode && "Response is not a Blob.");
					return res.body;
				}));
				case "text": return res$.pipe(map((res) => {
					if (res.body !== null && typeof res.body !== "string") throw new RuntimeError(2808, ngDevMode && "Response is not a string.");
					return res.body;
				}));
				default: return res$.pipe(map((res) => res.body));
			}
			case "response": return res$;
			default: throw new RuntimeError(2809, ngDevMode && `Unreachable: unhandled observe type ${options.observe}}`);
		}
	}
	delete(url, options = {}) {
		return this.request("DELETE", url, options);
	}
	get(url, options = {}) {
		return this.request("GET", url, options);
	}
	head(url, options = {}) {
		return this.request("HEAD", url, options);
	}
	jsonp(url, callbackParam) {
		return this.request("JSONP", url, {
			params: new HttpParams().append(callbackParam, "JSONP_CALLBACK"),
			observe: "body",
			responseType: "json"
		});
	}
	options(url, options = {}) {
		return this.request("OPTIONS", url, options);
	}
	patch(url, body, options = {}) {
		return this.request("PATCH", url, addBody(options, body));
	}
	post(url, body, options = {}) {
		return this.request("POST", url, addBody(options, body));
	}
	put(url, body, options = {}) {
		return this.request("PUT", url, addBody(options, body));
	}
};
_HttpClient = HttpClient;
_defineProperty(HttpClient, "ɵfac", function HttpClient_Factory(__ngFactoryType__) {
	return new (__ngFactoryType__ || _HttpClient)(ɵɵinject(HttpHandler));
});
_defineProperty(HttpClient, "ɵprov", /*@__PURE__*/ ɵɵdefineInjectable({
	token: _HttpClient,
	factory: _HttpClient.ɵfac,
	providedIn: "root"
}));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(HttpClient, [{
		type: Injectable,
		args: [{ providedIn: "root" }]
	}], () => [{ type: HttpHandler }], null);
})();
var nextRequestId = 0;
var foreignDocument;
var JSONP_ERR_NO_CALLBACK = "JSONP injected script did not invoke callback.";
var JSONP_ERR_WRONG_METHOD = "JSONP requests must use JSONP request method.";
var JSONP_ERR_WRONG_RESPONSE_TYPE = "JSONP requests must use Json response type.";
var JSONP_ERR_HEADERS_NOT_SUPPORTED = "JSONP requests do not support headers.";
var JSONP_ERR_UNSAFE_URL = "JSONP requests only support absolute URLs with HTTP(S) protocols.";
var JsonpCallbackContext = class {};
function jsonpCallbackContext() {
	if (typeof window === "object") return window;
	return {};
}
var JsonpClientBackend = class {
	constructor(callbackMap, document) {
		_defineProperty(this, "callbackMap", void 0);
		_defineProperty(this, "document", void 0);
		_defineProperty(this, "resolvedPromise", Promise.resolve());
		_defineProperty(this, "nonce", inject(CSP_NONCE, { optional: true }));
		this.callbackMap = callbackMap;
		this.document = document;
		if (typeof ngDevMode === "undefined" || ngDevMode) console.warn("JSONP support is deprecated as it can cause XSS vulnerabilities, and will be removed in a future version of Angular. Please use standard HTTP requests instead.");
	}
	nextCallback() {
		return `ng_jsonp_callback_${nextRequestId++}`;
	}
	handle(req) {
		if (req.method !== "JSONP") throw new RuntimeError(2810, ngDevMode && JSONP_ERR_WRONG_METHOD);
		else if (req.responseType !== "json") throw new RuntimeError(2811, ngDevMode && JSONP_ERR_WRONG_RESPONSE_TYPE);
		if (req.headers.keys().length > 0) throw new RuntimeError(2812, ngDevMode && JSONP_ERR_HEADERS_NOT_SUPPORTED);
		if (!this.isAllowedJsonpUrl(req.urlWithParams)) throw new RuntimeError(2826, ngDevMode && JSONP_ERR_UNSAFE_URL);
		return new Observable((observer) => {
			const callback = this.nextCallback();
			const url = req.urlWithParams.replace(/=JSONP_CALLBACK(&|$)/, `=${callback}$1`);
			const node = this.document.createElement("script");
			node.src = url;
			if (this.nonce) node.setAttribute("nonce", this.nonce);
			let body = null;
			let finished = false;
			this.callbackMap[callback] = (data) => {
				delete this.callbackMap[callback];
				body = data;
				finished = true;
			};
			const cleanup = () => {
				node.removeEventListener("load", onLoad);
				node.removeEventListener("error", onError);
				node.remove();
				delete this.callbackMap[callback];
			};
			const onLoad = () => {
				this.resolvedPromise.then(() => {
					cleanup();
					if (!finished) {
						observer.error(new HttpErrorResponse({
							url,
							status: 0,
							statusText: "JSONP Error",
							error: /* @__PURE__ */ new Error(JSONP_ERR_NO_CALLBACK)
						}));
						return;
					}
					observer.next(new HttpResponse({
						body,
						status: HTTP_STATUS_CODE_OK,
						statusText: "OK",
						url
					}));
					observer.complete();
				});
			};
			const onError = (error) => {
				cleanup();
				observer.error(new HttpErrorResponse({
					error,
					status: 0,
					statusText: "JSONP Error",
					url
				}));
			};
			node.addEventListener("load", onLoad);
			node.addEventListener("error", onError);
			this.document.body.appendChild(node);
			observer.next({ type: HttpEventType.Sent });
			return () => {
				if (!finished) this.removeListeners(node);
				cleanup();
			};
		});
	}
	removeListeners(script) {
		var _foreignDocument;
		(_foreignDocument = foreignDocument) !== null && _foreignDocument !== void 0 || (foreignDocument = this.document.implementation.createHTMLDocument());
		foreignDocument.adoptNode(script);
	}
	isAllowedJsonpUrl(url) {
		return /^https?:\/\//i.test(url);
	}
};
_JsonpClientBackend = JsonpClientBackend;
_defineProperty(JsonpClientBackend, "ɵfac", function JsonpClientBackend_Factory(__ngFactoryType__) {
	return new (__ngFactoryType__ || _JsonpClientBackend)(ɵɵinject(JsonpCallbackContext), ɵɵinject(DOCUMENT));
});
_defineProperty(JsonpClientBackend, "ɵprov", /*@__PURE__*/ ɵɵdefineInjectable({
	token: _JsonpClientBackend,
	factory: _JsonpClientBackend.ɵfac
}));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(JsonpClientBackend, [{ type: Injectable }], () => [{ type: JsonpCallbackContext }, {
		type: void 0,
		decorators: [{
			type: Inject,
			args: [DOCUMENT]
		}]
	}], null);
})();
function jsonpInterceptorFn(req, next) {
	if (req.method === "JSONP") return inject(JsonpClientBackend).handle(req);
	return next(req);
}
var JsonpInterceptor = class {
	constructor(injector) {
		_defineProperty(this, "injector", void 0);
		this.injector = injector;
	}
	intercept(initialRequest, next) {
		return runInInjectionContext(this.injector, () => jsonpInterceptorFn(initialRequest, (downstreamRequest) => next.handle(downstreamRequest)));
	}
};
_JsonpInterceptor = JsonpInterceptor;
_defineProperty(JsonpInterceptor, "ɵfac", function JsonpInterceptor_Factory(__ngFactoryType__) {
	return new (__ngFactoryType__ || _JsonpInterceptor)(ɵɵinject(EnvironmentInjector));
});
_defineProperty(JsonpInterceptor, "ɵprov", /*@__PURE__*/ ɵɵdefineInjectable({
	token: _JsonpInterceptor,
	factory: _JsonpInterceptor.ɵfac
}));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(JsonpInterceptor, [{ type: Injectable }], () => [{ type: EnvironmentInjector }], null);
})();
var XSSI_PREFIX = /^\)\]\}',?\n/;
function validateXhrCompatibility(req) {
	for (const { property, errorCode } of [
		{
			property: "keepalive",
			errorCode: 2813
		},
		{
			property: "cache",
			errorCode: 2814
		},
		{
			property: "priority",
			errorCode: 2815
		},
		{
			property: "mode",
			errorCode: 2816
		},
		{
			property: "redirect",
			errorCode: 2817
		},
		{
			property: "credentials",
			errorCode: 2818
		},
		{
			property: "integrity",
			errorCode: 2820
		},
		{
			property: "referrer",
			errorCode: 2821
		},
		{
			property: "referrerPolicy",
			errorCode: 2823
		}
	]) if (req[property]) console.warn(formatRuntimeError(errorCode, `Angular detected that a \`HttpClient\` request with the \`${property}\` option was sent using XHR, which does not support it. To use the \`${property}\` option, use the Fetch API by removing \`withXhr()\` from the \`provideHttpClient()\` call.`));
}
var HttpXhrBackend = class {
	constructor(xhrFactory) {
		_defineProperty(this, "xhrFactory", void 0);
		_defineProperty(this, "tracingService", inject(TracingService, { optional: true }));
		this.xhrFactory = xhrFactory;
	}
	maybePropagateTrace(fn) {
		var _this$tracingService;
		return ((_this$tracingService = this.tracingService) === null || _this$tracingService === void 0 ? void 0 : _this$tracingService.propagate) ? this.tracingService.propagate(fn) : fn;
	}
	handle(req) {
		if (req.method === "JSONP") throw new RuntimeError(-2800, (typeof ngDevMode === "undefined" || ngDevMode) && `Cannot make a JSONP request without JSONP support. To fix the problem, either add the \`withJsonpSupport()\` call (if \`provideHttpClient()\` is used) or import the \`HttpClientJsonpModule\` in the root NgModule.`);
		ngDevMode && validateXhrCompatibility(req);
		const xhrFactory = this.xhrFactory;
		return of(null).pipe(switchMap(() => {
			return new Observable((observer) => {
				const xhr = xhrFactory.build();
				xhr.open(req.method, req.urlWithParams);
				if (req.withCredentials) xhr.withCredentials = true;
				req.headers.forEach((name, values) => xhr.setRequestHeader(name, values.join(",")));
				if (!req.headers.has(ACCEPT_HEADER)) xhr.setRequestHeader(ACCEPT_HEADER, ACCEPT_HEADER_VALUE);
				if (!req.headers.has(CONTENT_TYPE_HEADER)) {
					const detectedType = req.detectContentTypeHeader();
					if (detectedType !== null) xhr.setRequestHeader(CONTENT_TYPE_HEADER, detectedType);
				}
				if (req.timeout) xhr.timeout = req.timeout;
				if (req.responseType) {
					const responseType = req.responseType.toLowerCase();
					xhr.responseType = responseType !== "json" ? responseType : "text";
				}
				const reqBody = req.serializeBody();
				let headerResponse = null;
				const partialFromXhr = () => {
					if (headerResponse !== null) return headerResponse;
					const statusText = xhr.statusText || "OK";
					const headers = new HttpHeaders(xhr.getAllResponseHeaders());
					const url = xhr.responseURL || req.url;
					headerResponse = new HttpHeaderResponse({
						headers,
						status: xhr.status,
						statusText,
						url
					});
					return headerResponse;
				};
				const onLoad = this.maybePropagateTrace(() => {
					let { headers, status, statusText, url } = partialFromXhr();
					let body = null;
					if (status !== HTTP_STATUS_CODE_NO_CONTENT) body = typeof xhr.response === "undefined" ? xhr.responseText : xhr.response;
					if (status === 0) status = !!body ? HTTP_STATUS_CODE_OK : 0;
					let ok = status >= 200 && status < 300;
					if (req.responseType === "json" && typeof body === "string") {
						const originalBody = body;
						body = body.replace(XSSI_PREFIX, "");
						try {
							body = body !== "" ? JSON.parse(body) : null;
						} catch (error) {
							body = originalBody;
							if (ok) {
								ok = false;
								body = {
									error,
									text: body
								};
							}
						}
					}
					if (ok) {
						observer.next(new HttpResponse({
							body,
							headers,
							status,
							statusText,
							url: url || void 0
						}));
						observer.complete();
					} else observer.error(new HttpErrorResponse({
						error: body,
						headers,
						status,
						statusText,
						url: url || void 0
					}));
				});
				const onError = this.maybePropagateTrace((error) => {
					const { url } = partialFromXhr();
					const res = new HttpErrorResponse({
						error,
						status: xhr.status || 0,
						statusText: xhr.statusText || "Unknown Error",
						url: url || void 0
					});
					observer.error(res);
				});
				let onTimeout = onError;
				if (req.timeout) onTimeout = this.maybePropagateTrace((_) => {
					const { url } = partialFromXhr();
					const res = new HttpErrorResponse({
						error: new DOMException("Request timed out", "TimeoutError"),
						status: xhr.status || 0,
						statusText: xhr.statusText || "Request timeout",
						url: url || void 0
					});
					observer.error(res);
				});
				let sentHeaders = false;
				const onDownProgress = this.maybePropagateTrace((event) => {
					if (!sentHeaders) {
						observer.next(partialFromXhr());
						sentHeaders = true;
					}
					let progressEvent = {
						type: HttpEventType.DownloadProgress,
						loaded: event.loaded
					};
					if (event.lengthComputable) progressEvent.total = event.total;
					if (req.responseType === "text" && !!xhr.responseText) progressEvent.partialText = xhr.responseText;
					observer.next(progressEvent);
				});
				const onUpProgress = this.maybePropagateTrace((event) => {
					let progress = {
						type: HttpEventType.UploadProgress,
						loaded: event.loaded
					};
					if (event.lengthComputable) progress.total = event.total;
					observer.next(progress);
				});
				xhr.addEventListener("load", onLoad);
				xhr.addEventListener("error", onError);
				xhr.addEventListener("timeout", onTimeout);
				xhr.addEventListener("abort", onError);
				const reportUploadProgress = req.reportProgress || req.reportUploadProgress;
				const reportDownloadProgress = req.reportProgress || req.reportDownloadProgress;
				if (reportDownloadProgress) xhr.addEventListener("progress", onDownProgress);
				if (reportUploadProgress && reqBody !== null && xhr.upload) xhr.upload.addEventListener("progress", onUpProgress);
				xhr.send(reqBody);
				observer.next({ type: HttpEventType.Sent });
				return () => {
					xhr.removeEventListener("error", onError);
					xhr.removeEventListener("abort", onError);
					xhr.removeEventListener("load", onLoad);
					xhr.removeEventListener("timeout", onTimeout);
					if (reportDownloadProgress) xhr.removeEventListener("progress", onDownProgress);
					if (reportUploadProgress && reqBody !== null && xhr.upload) xhr.upload.removeEventListener("progress", onUpProgress);
					if (xhr.readyState !== xhr.DONE) xhr.abort();
				};
			});
		}));
	}
};
_HttpXhrBackend = HttpXhrBackend;
_defineProperty(HttpXhrBackend, "ɵfac", function HttpXhrBackend_Factory(__ngFactoryType__) {
	return new (__ngFactoryType__ || _HttpXhrBackend)(ɵɵinject(XhrFactory));
});
_defineProperty(HttpXhrBackend, "ɵprov", /*@__PURE__*/ ɵɵdefineInjectable({
	token: _HttpXhrBackend,
	factory: _HttpXhrBackend.ɵfac,
	providedIn: "root"
}));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(HttpXhrBackend, [{
		type: Injectable,
		args: [{ providedIn: "root" }]
	}], () => [{ type: XhrFactory }], null);
})();
var HttpFeatureKind;
(function(HttpFeatureKind) {
	HttpFeatureKind[HttpFeatureKind["Interceptors"] = 0] = "Interceptors";
	HttpFeatureKind[HttpFeatureKind["LegacyInterceptors"] = 1] = "LegacyInterceptors";
	HttpFeatureKind[HttpFeatureKind["CustomXsrfConfiguration"] = 2] = "CustomXsrfConfiguration";
	HttpFeatureKind[HttpFeatureKind["NoXsrfProtection"] = 3] = "NoXsrfProtection";
	HttpFeatureKind[HttpFeatureKind["JsonpSupport"] = 4] = "JsonpSupport";
	HttpFeatureKind[HttpFeatureKind["RequestsMadeViaParent"] = 5] = "RequestsMadeViaParent";
	HttpFeatureKind[HttpFeatureKind["Fetch"] = 6] = "Fetch";
	HttpFeatureKind[HttpFeatureKind["Xhr"] = 7] = "Xhr";
})(HttpFeatureKind || (HttpFeatureKind = {}));
function makeHttpFeature(kind, providers) {
	return {
		ɵkind: kind,
		ɵproviders: providers
	};
}
function provideHttpClient(...features) {
	if (ngDevMode) {
		const featureKinds = new Set(features.map((f) => f.ɵkind));
		if (featureKinds.has(HttpFeatureKind.NoXsrfProtection) && featureKinds.has(HttpFeatureKind.CustomXsrfConfiguration)) throw new Error(`Configuration error: found both withXsrfConfiguration() and withNoXsrfProtection() in the same call to provideHttpClient(), which is a contradiction.`);
		const hasBackendOverride = featureKinds.has(HttpFeatureKind.Fetch) || featureKinds.has(HttpFeatureKind.Xhr);
		if (featureKinds.has(HttpFeatureKind.RequestsMadeViaParent) && hasBackendOverride) throw new Error(`Configuration error: withRequestsMadeViaParent() cannot be combined with withFetch() or withXhr() in the same call to provideHttpClient().`);
	}
	const providers = [
		HttpClient,
		FetchBackend,
		HttpInterceptorHandler,
		{
			provide: HttpHandler,
			useExisting: HttpInterceptorHandler
		},
		{
			provide: HttpBackend,
			useFactory: () => {
				return inject(FetchBackend);
			}
		},
		{
			provide: HTTP_INTERCEPTOR_FNS,
			useValue: xsrfInterceptorFn,
			multi: true
		}
	];
	for (const feature of features) providers.push(...feature.ɵproviders);
	return makeEnvironmentProviders(providers);
}
var LEGACY_INTERCEPTOR_FN = new InjectionToken(typeof ngDevMode !== "undefined" && ngDevMode ? "LEGACY_INTERCEPTOR_FN" : "");
function withInterceptorsFromDi() {
	return makeHttpFeature(HttpFeatureKind.LegacyInterceptors, [{
		provide: LEGACY_INTERCEPTOR_FN,
		useFactory: legacyInterceptorFnFactory
	}, {
		provide: HTTP_INTERCEPTOR_FNS,
		useExisting: LEGACY_INTERCEPTOR_FN,
		multi: true
	}]);
}
function withXsrfConfiguration({ cookieName, headerName }) {
	const providers = [];
	if (cookieName !== void 0) providers.push({
		provide: XSRF_COOKIE_NAME,
		useValue: cookieName
	});
	if (headerName !== void 0) providers.push({
		provide: XSRF_HEADER_NAME,
		useValue: headerName
	});
	return makeHttpFeature(HttpFeatureKind.CustomXsrfConfiguration, providers);
}
function withNoXsrfProtection() {
	return makeHttpFeature(HttpFeatureKind.NoXsrfProtection, [{
		provide: XSRF_ENABLED,
		useValue: false
	}]);
}
function withJsonpSupport() {
	return makeHttpFeature(HttpFeatureKind.JsonpSupport, [
		JsonpClientBackend,
		{
			provide: JsonpCallbackContext,
			useFactory: jsonpCallbackContext
		},
		{
			provide: HTTP_INTERCEPTOR_FNS,
			useValue: jsonpInterceptorFn,
			multi: true
		}
	]);
}
function withXhr() {
	return makeHttpFeature(HttpFeatureKind.Xhr, [HttpXhrBackend, {
		provide: HttpBackend,
		useExisting: HttpXhrBackend
	}]);
}
var HttpClientXsrfModule = class HttpClientXsrfModule {
	static disable() {
		return {
			ngModule: HttpClientXsrfModule,
			providers: [withNoXsrfProtection().ɵproviders]
		};
	}
	static withOptions(options = {}) {
		return {
			ngModule: HttpClientXsrfModule,
			providers: withXsrfConfiguration(options).ɵproviders
		};
	}
};
_HttpClientXsrfModule = HttpClientXsrfModule;
_defineProperty(HttpClientXsrfModule, "ɵfac", function HttpClientXsrfModule_Factory(__ngFactoryType__) {
	return new (__ngFactoryType__ || _HttpClientXsrfModule)();
});
_defineProperty(HttpClientXsrfModule, "ɵmod", /*@__PURE__*/ ɵɵdefineNgModule({ type: _HttpClientXsrfModule }));
_defineProperty(HttpClientXsrfModule, "ɵinj", /*@__PURE__*/ ɵɵdefineInjector({ providers: [
	HttpXsrfInterceptor,
	{
		provide: HTTP_INTERCEPTORS,
		useExisting: HttpXsrfInterceptor,
		multi: true
	},
	{
		provide: HttpXsrfTokenExtractor,
		useClass: HttpXsrfCookieExtractor
	},
	withXsrfConfiguration({
		cookieName: XSRF_DEFAULT_COOKIE_NAME,
		headerName: XSRF_DEFAULT_HEADER_NAME
	}).ɵproviders,
	{
		provide: XSRF_ENABLED,
		useValue: true
	}
] }));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(HttpClientXsrfModule, [{
		type: NgModule,
		args: [{ providers: [
			HttpXsrfInterceptor,
			{
				provide: HTTP_INTERCEPTORS,
				useExisting: HttpXsrfInterceptor,
				multi: true
			},
			{
				provide: HttpXsrfTokenExtractor,
				useClass: HttpXsrfCookieExtractor
			},
			withXsrfConfiguration({
				cookieName: XSRF_DEFAULT_COOKIE_NAME,
				headerName: XSRF_DEFAULT_HEADER_NAME
			}).ɵproviders,
			{
				provide: XSRF_ENABLED,
				useValue: true
			}
		] }]
	}], null, null);
})();
var HttpClientModule = class {};
_HttpClientModule = HttpClientModule;
_defineProperty(HttpClientModule, "ɵfac", function HttpClientModule_Factory(__ngFactoryType__) {
	return new (__ngFactoryType__ || _HttpClientModule)();
});
_defineProperty(HttpClientModule, "ɵmod", /*@__PURE__*/ ɵɵdefineNgModule({ type: _HttpClientModule }));
_defineProperty(HttpClientModule, "ɵinj", /*@__PURE__*/ ɵɵdefineInjector({ providers: [provideHttpClient(withInterceptorsFromDi(), withXhr())] }));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(HttpClientModule, [{
		type: NgModule,
		args: [{ providers: [provideHttpClient(withInterceptorsFromDi(), withXhr())] }]
	}], null, null);
})();
var HttpClientJsonpModule = class {};
_HttpClientJsonpModule = HttpClientJsonpModule;
_defineProperty(HttpClientJsonpModule, "ɵfac", function HttpClientJsonpModule_Factory(__ngFactoryType__) {
	return new (__ngFactoryType__ || _HttpClientJsonpModule)();
});
_defineProperty(HttpClientJsonpModule, "ɵmod", /*@__PURE__*/ ɵɵdefineNgModule({ type: _HttpClientJsonpModule }));
_defineProperty(HttpClientJsonpModule, "ɵinj", /*@__PURE__*/ ɵɵdefineInjector({ providers: [withJsonpSupport().ɵproviders] }));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(HttpClientJsonpModule, [{
		type: NgModule,
		args: [{ providers: [withJsonpSupport().ɵproviders] }]
	}], null, null);
})();
//#endregion
//#region node_modules/@angular/common/fesm2022/http.mjs
/**
* @license Angular v22.2.0
* (c) 2010-2026 Google LLC. https://angular.dev/
* License: MIT
*/
var HTTP_TRANSFER_CACHE_ORIGIN_MAP = new InjectionToken(typeof ngDevMode !== "undefined" && ngDevMode ? "HTTP_TRANSFER_CACHE_ORIGIN_MAP" : "");
var BODY = "b";
var HEADERS = "h";
var STATUS = "s";
var STATUS_TEXT = "st";
var REQ_URL = "u";
var RESPONSE_TYPE = "rt";
var CACHE_OPTIONS = new InjectionToken(typeof ngDevMode !== "undefined" && ngDevMode ? "HTTP_TRANSFER_STATE_CACHE_OPTIONS" : "");
var ALLOWED_METHODS = ["GET", "HEAD"];
function canUseOrCacheRequest(req, options) {
	const { isCacheActive, filter, includePostRequests, includeRequestsWithAuthHeaders, includeRequestsWithCredentials, includeNonCacheableRequests } = options;
	const { transferCache: requestOptions, method: requestMethod } = req;
	if (!isCacheActive || requestOptions === false || requestMethod === "POST" && !includePostRequests && !requestOptions || requestMethod !== "POST" && !ALLOWED_METHODS.includes(requestMethod) || !includeRequestsWithAuthHeaders && hasAuthHeaders(req) || !includeRequestsWithCredentials && hasOutgoingCredentials(req) || !includeNonCacheableRequests && (hasUncacheableCacheControl(req.headers) || isNonCacheableRequest(req.cache)) || (filter === null || filter === void 0 ? void 0 : filter(req)) === false) return false;
	return true;
}
function getHeadersToInclude(options, requestOptions) {
	return typeof requestOptions === "object" && requestOptions.includeHeaders ? requestOptions.includeHeaders : options.includeHeaders;
}
function retrieveStateFromCache(req, options, transferState, originMap, storeKey, skipUseCacheChecks = false) {
	if (!skipUseCacheChecks && !canUseOrCacheRequest(req, options)) return null;
	if (originMap) throw new RuntimeError(2803, ngDevMode && "Angular detected that the `HTTP_TRANSFER_CACHE_ORIGIN_MAP` token is configured and present in the client side code. Please ensure that this token is only provided in the server code of the application.");
	if (!storeKey) {
		const requestUrl = req.url;
		storeKey = makeCacheKey(req, requestUrl);
	}
	const response = transferState.get(storeKey, null);
	if (!response) return null;
	const { [BODY]: undecodedBody, [RESPONSE_TYPE]: responseType, [HEADERS]: httpHeaders, [STATUS]: status, [STATUS_TEXT]: statusText, [REQ_URL]: url } = response;
	let body = undecodedBody;
	switch (responseType) {
		case "arraybuffer":
			body = fromBase64(undecodedBody);
			break;
		case "blob": body = new Blob([fromBase64(undecodedBody)]);
	}
	let headers = new HttpHeaders(httpHeaders);
	if (typeof ngDevMode === "undefined" || ngDevMode) {
		const { transferCache: requestOptions } = req;
		const headersToInclude = getHeadersToInclude(options, requestOptions);
		headers = appendMissingHeadersDetection(req.url, headers, headersToInclude !== null && headersToInclude !== void 0 ? headersToInclude : []);
	}
	return new HttpResponse({
		body,
		headers,
		status,
		statusText,
		url
	});
}
function transferCacheInterceptorFn(req, next) {
	const options = inject(CACHE_OPTIONS);
	if (!canUseOrCacheRequest(req, options)) return next(req);
	const transferState = inject(TransferState);
	inject(HTTP_TRANSFER_CACHE_ORIGIN_MAP, { optional: true });
	const requestUrl = req.url;
	const cachedResponse = retrieveStateFromCache(req, options, transferState, null, makeCacheKey(req, requestUrl), true);
	if (cachedResponse) return of(cachedResponse);
	return next(req);
}
function hasAuthHeaders(req) {
	const headers = req.headers;
	return headers.has("authorization") || headers.has("proxy-authorization") || headers.has("cookie");
}
var UNCACHEABLE_CACHE_CONTROL_DIRECTIVES = /* @__PURE__ */ new Set([
	"no-store",
	"private",
	"no-cache"
]);
function hasUncacheableCacheControl(headers) {
	const cacheControl = headers.get("cache-control");
	if (!cacheControl) return false;
	return cacheControl.split(",").some((directive) => {
		const directiveName = directive.split("=", 1)[0].trim().toLowerCase();
		return UNCACHEABLE_CACHE_CONTROL_DIRECTIVES.has(directiveName);
	});
}
function isNonCacheableRequest(cache) {
	return cache === "no-cache" || cache === "no-store";
}
function hasOutgoingCredentials(req) {
	const { withCredentials, credentials } = req;
	return withCredentials || credentials === "include" || credentials === "same-origin";
}
function sortAndConcatParams(params) {
	const searchParams = new URLSearchParams(params instanceof URLSearchParams ? params : params.toString());
	searchParams.sort();
	return searchParams.toString();
}
function makeCacheKey(request, mappedRequestUrl) {
	const { params, method, responseType } = request;
	const encodedParams = sortAndConcatParams(params);
	let serializedBody = request.serializeBody();
	if (serializedBody instanceof URLSearchParams) serializedBody = sortAndConcatParams(serializedBody);
	else if (typeof serializedBody !== "string") serializedBody = "";
	const hash = generateHash([
		method,
		responseType,
		mappedRequestUrl,
		serializedBody,
		encodedParams
	].join("\0"));
	return makeStateKey(hash);
}
function fromBase64(base64) {
	const binary = atob(base64);
	return Uint8Array.from(binary, (c) => c.charCodeAt(0)).buffer;
}
function withHttpTransferCache(cacheOptions) {
	return [
		{
			provide: CACHE_OPTIONS,
			useFactory: () => {
				performanceMarkFeature("NgHttpTransferCache");
				return _objectSpread2({ isCacheActive: true }, cacheOptions);
			}
		},
		{
			provide: HTTP_ROOT_INTERCEPTOR_FNS,
			useValue: transferCacheInterceptorFn,
			multi: true
		},
		{
			provide: APP_BOOTSTRAP_LISTENER,
			multi: true,
			useFactory: () => {
				const appRef = inject(ApplicationRef);
				const cacheState = inject(CACHE_OPTIONS);
				return () => {
					appRef.whenStable().then(() => {
						cacheState.isCacheActive = false;
					});
				};
			}
		}
	];
}
function appendMissingHeadersDetection(url, headers, headersToInclude) {
	const warningProduced = /* @__PURE__ */ new Set();
	return new Proxy(headers, { get(target, prop) {
		const value = Reflect.get(target, prop);
		if (typeof value !== "function" || !(/* @__PURE__ */ new Set([
			"get",
			"has",
			"getAll"
		])).has(prop)) return value;
		return (headerName) => {
			const key = (prop + ":" + headerName).toLowerCase();
			if (!headersToInclude.includes(headerName) && !warningProduced.has(key)) {
				warningProduced.add(key);
				const truncatedUrl = truncateMiddle(url);
				console.warn(formatRuntimeError(-2802, `Angular detected that the \`${headerName}\` header is accessed, but the value of the header was not transferred from the server to the client by the HttpTransferCache. To include the value of the \`${headerName}\` header for the \`${truncatedUrl}\` request, use the \`includeHeaders\` list. The \`includeHeaders\` can be defined either on a request level by adding the \`transferCache\` parameter, or on an application level by adding the \`httpCacheTransfer.includeHeaders\` argument to the \`provideClientHydration()\` call. `));
			}
			return value.apply(target, [headerName]);
		};
	} });
}
var SHA256_ROUND_CONSTANTS = /* @__PURE__ */ new Uint32Array([
	1116352408,
	1899447441,
	3049323471,
	3921009573,
	961987163,
	1508970993,
	2453635748,
	2870763221,
	3624381080,
	310598401,
	607225278,
	1426881987,
	1925078388,
	2162078206,
	2614888103,
	3248222580,
	3835390401,
	4022224774,
	264347078,
	604807628,
	770255983,
	1249150122,
	1555081692,
	1996064986,
	2554220882,
	2821834349,
	2952996808,
	3210313671,
	3336571891,
	3584528711,
	113926993,
	338241895,
	666307205,
	773529912,
	1294757372,
	1396182291,
	1695183700,
	1986661051,
	2177026350,
	2456956037,
	2730485921,
	2820302411,
	3259730800,
	3345764771,
	3516065817,
	3600352804,
	4094571909,
	275423344,
	430227734,
	506948616,
	659060556,
	883997877,
	958139571,
	1322822218,
	1537002063,
	1747873779,
	1955562222,
	2024104815,
	2227730452,
	2361852424,
	2428436474,
	2756734187,
	3204031479,
	3329325298
]);
var textEncoder;
function generateHash(value) {
	var _textEncoder;
	(_textEncoder = textEncoder) !== null && _textEncoder !== void 0 || (textEncoder = new TextEncoder());
	const inputBytes = textEncoder.encode(value);
	let hashState0 = 1779033703;
	let hashState1 = 3144134277;
	let hashState2 = 1013904242;
	let hashState3 = 2773480762;
	let hashState4 = 1359893119;
	let hashState5 = 2600822924;
	let hashState6 = 528734635;
	let hashState7 = 1541459225;
	const messageLengthInBits = inputBytes.length * 8;
	const paddedLengthInBytes = (inputBytes.length + 8 >> 6) + 1 << 6;
	const paddedBytes = new Uint8Array(paddedLengthInBytes);
	paddedBytes.set(inputBytes);
	paddedBytes[inputBytes.length] = 128;
	const paddedBytesView = new DataView(paddedBytes.buffer);
	const lowBits = messageLengthInBits >>> 0;
	const highBits = messageLengthInBits / 4294967296 >>> 0;
	paddedBytesView.setUint32(paddedLengthInBytes - 8, highBits, false);
	paddedBytesView.setUint32(paddedLengthInBytes - 4, lowBits, false);
	const messageSchedule = /* @__PURE__ */ new Uint32Array(64);
	for (let chunkOffset = 0; chunkOffset < paddedLengthInBytes; chunkOffset += 64) {
		for (let i = 0; i < 16; i++) messageSchedule[i] = paddedBytesView.getUint32(chunkOffset + i * 4, false);
		for (let i = 16; i < 64; i++) {
			const prevWord15 = messageSchedule[i - 15];
			const sigma0 = ((prevWord15 >>> 7 | prevWord15 << 25) ^ (prevWord15 >>> 18 | prevWord15 << 14) ^ prevWord15 >>> 3) >>> 0;
			const prevWord2 = messageSchedule[i - 2];
			const sigma1 = ((prevWord2 >>> 17 | prevWord2 << 15) ^ (prevWord2 >>> 19 | prevWord2 << 13) ^ prevWord2 >>> 10) >>> 0;
			messageSchedule[i] = messageSchedule[i - 16] + sigma0 + messageSchedule[i - 7] + sigma1 >>> 0;
		}
		let workingStateA = hashState0;
		let workingStateB = hashState1;
		let workingStateC = hashState2;
		let workingStateD = hashState3;
		let workingStateE = hashState4;
		let workingStateF = hashState5;
		let workingStateG = hashState6;
		let workingStateH = hashState7;
		for (let i = 0; i < 64; i++) {
			const capitalSigma1 = ((workingStateE >>> 6 | workingStateE << 26) ^ (workingStateE >>> 11 | workingStateE << 21) ^ (workingStateE >>> 25 | workingStateE << 7)) >>> 0;
			const chFunction = (workingStateE & workingStateF ^ ~workingStateE & workingStateG) >>> 0;
			const temp1 = workingStateH + capitalSigma1 + chFunction + SHA256_ROUND_CONSTANTS[i] + messageSchedule[i] >>> 0;
			const temp2 = (((workingStateA >>> 2 | workingStateA << 30) ^ (workingStateA >>> 13 | workingStateA << 19) ^ (workingStateA >>> 22 | workingStateA << 10)) >>> 0) + ((workingStateA & workingStateB ^ workingStateA & workingStateC ^ workingStateB & workingStateC) >>> 0) >>> 0;
			workingStateH = workingStateG;
			workingStateG = workingStateF;
			workingStateF = workingStateE;
			workingStateE = workingStateD + temp1 >>> 0;
			workingStateD = workingStateC;
			workingStateC = workingStateB;
			workingStateB = workingStateA;
			workingStateA = temp1 + temp2 >>> 0;
		}
		hashState0 = hashState0 + workingStateA >>> 0;
		hashState1 = hashState1 + workingStateB >>> 0;
		hashState2 = hashState2 + workingStateC >>> 0;
		hashState3 = hashState3 + workingStateD >>> 0;
		hashState4 = hashState4 + workingStateE >>> 0;
		hashState5 = hashState5 + workingStateF >>> 0;
		hashState6 = hashState6 + workingStateG >>> 0;
		hashState7 = hashState7 + workingStateH >>> 0;
	}
	return [
		hashState0,
		hashState1,
		hashState2,
		hashState3,
		hashState4,
		hashState5,
		hashState6,
		hashState7
	].map((x) => x.toString(16).padStart(8, "0")).join("");
}
(() => {
	const jsonFn = makeHttpResourceFn("json");
	jsonFn.arrayBuffer = makeHttpResourceFn("arraybuffer");
	jsonFn.blob = makeHttpResourceFn("blob");
	jsonFn.text = makeHttpResourceFn("text");
	return jsonFn;
})();
function makeHttpResourceFn(responseType) {
	return function httpResource(request, options) {
		var _options$injector;
		if (ngDevMode && !(options === null || options === void 0 ? void 0 : options.injector)) assertInInjectionContext(httpResource);
		const injector = (_options$injector = options === null || options === void 0 ? void 0 : options.injector) !== null && _options$injector !== void 0 ? _options$injector : inject(Injector);
		const cacheOptions = injector.get(CACHE_OPTIONS, null, { optional: true });
		const transferState = injector.get(TransferState, null, { optional: true });
		const originMap = injector.get(HTTP_TRANSFER_CACHE_ORIGIN_MAP, null, { optional: true });
		const getInitialStream = (req) => {
			if (cacheOptions && transferState && req) {
				const cachedResponse = retrieveStateFromCache(req, cacheOptions, transferState, originMap);
				if (cachedResponse) try {
					const body = cachedResponse.body;
					const parsed = (options === null || options === void 0 ? void 0 : options.parse) ? options.parse(body) : body;
					return signal({ value: parsed });
				} catch (e) {
					if (typeof ngDevMode === "undefined" || ngDevMode) console.warn(`Angular detected an error while parsing the cached response for the httpResource at \`${req.url}\`. The resource will fall back to its default value and try again asynchronously.`, e);
				}
			}
		};
		return new HttpResourceImpl(injector, (ctx) => normalizeRequest(ctx, request, responseType), options === null || options === void 0 ? void 0 : options.defaultValue, options === null || options === void 0 ? void 0 : options.debugName, options === null || options === void 0 ? void 0 : options.parse, options === null || options === void 0 ? void 0 : options.equal, getInitialStream);
	};
}
function normalizeRequest(ctx, request, responseType) {
	var _unwrappedRequest$met, _unwrappedRequest$bod;
	let unwrappedRequest = typeof request === "function" ? request(ctx) : request;
	if (unwrappedRequest === void 0) return;
	else if (typeof unwrappedRequest === "string") unwrappedRequest = { url: unwrappedRequest };
	const headers = unwrappedRequest.headers instanceof HttpHeaders ? unwrappedRequest.headers : new HttpHeaders(unwrappedRequest.headers);
	const params = unwrappedRequest.params instanceof HttpParams ? unwrappedRequest.params : new HttpParams({ fromObject: unwrappedRequest.params });
	return new HttpRequest((_unwrappedRequest$met = unwrappedRequest.method) !== null && _unwrappedRequest$met !== void 0 ? _unwrappedRequest$met : "GET", unwrappedRequest.url, (_unwrappedRequest$bod = unwrappedRequest.body) !== null && _unwrappedRequest$bod !== void 0 ? _unwrappedRequest$bod : null, {
		headers,
		params,
		reportProgress: unwrappedRequest.reportProgress,
		withCredentials: unwrappedRequest.withCredentials,
		keepalive: unwrappedRequest.keepalive,
		cache: unwrappedRequest.cache,
		priority: unwrappedRequest.priority,
		mode: unwrappedRequest.mode,
		redirect: unwrappedRequest.redirect,
		responseType,
		context: unwrappedRequest.context,
		transferCache: unwrappedRequest.transferCache,
		credentials: unwrappedRequest.credentials,
		referrer: unwrappedRequest.referrer,
		referrerPolicy: unwrappedRequest.referrerPolicy,
		integrity: unwrappedRequest.integrity,
		timeout: unwrappedRequest.timeout
	});
}
var HttpResourceImpl = class extends ResourceImpl {
	constructor(injector, request, defaultValue, debugName, parse, equal, getInitialStream) {
		super(request, ({ params: request, abortSignal }) => {
			let sub;
			let aborted = false;
			const onAbort = () => {
				aborted = true;
				sub === null || sub === void 0 || sub.unsubscribe();
			};
			abortSignal.addEventListener("abort", onAbort, { once: true });
			const stream = signal({ value: void 0 }, ...ngDevMode ? [{ debugName: "stream" }] : []);
			let resolve;
			const promise = new Promise((r) => resolve = r);
			const send = (value) => {
				stream.set(value);
				resolve === null || resolve === void 0 || resolve(stream);
				resolve = void 0;
			};
			sub = this.client.request(request).subscribe({
				next: (event) => {
					switch (event.type) {
						case HttpEventType.Response:
							this._headers.set(event.headers);
							this._statusCode.set(event.status);
							try {
								send({ value: parse ? parse(event.body) : event.body });
							} catch (error) {
								send({ error: encapsulateResourceError(error) });
							}
							break;
						case HttpEventType.DownloadProgress: this._progress.set(event);
					}
				},
				error: (error) => {
					if (error instanceof HttpErrorResponse) {
						this._headers.set(error.headers);
						this._statusCode.set(error.status);
					}
					send({ error });
					abortSignal.removeEventListener("abort", onAbort);
				},
				complete: () => {
					if (resolve) send({ error: new RuntimeError(-991, ngDevMode && "Resource completed before producing a value") });
					abortSignal.removeEventListener("abort", onAbort);
				}
			});
			if (aborted) sub.unsubscribe();
			return promise;
		}, defaultValue, equal, debugName, injector, void 0, getInitialStream);
		_defineProperty(this, "client", void 0);
		_defineProperty(this, "_headers", linkedSignal(_objectSpread2(_objectSpread2({}, ngDevMode ? { debugName: "_headers" } : {}), {}, {
			source: this.extRequest,
			computation: () => void 0
		})));
		_defineProperty(this, "_progress", linkedSignal(_objectSpread2(_objectSpread2({}, ngDevMode ? { debugName: "_progress" } : {}), {}, {
			source: this.extRequest,
			computation: () => void 0
		})));
		_defineProperty(this, "_statusCode", linkedSignal(_objectSpread2(_objectSpread2({}, ngDevMode ? { debugName: "_statusCode" } : {}), {}, {
			source: this.extRequest,
			computation: () => void 0
		})));
		_defineProperty(this, "headers", computed(() => this.status() === "resolved" || this.status() === "error" ? this._headers() : void 0, ...ngDevMode ? [{ debugName: "headers" }] : []));
		_defineProperty(this, "progress", this._progress.asReadonly());
		_defineProperty(this, "statusCode", this._statusCode.asReadonly());
		this.client = injector.get(HttpClient);
	}
	set(value) {
		super.set(value);
		this._headers.set(void 0);
		this._progress.set(void 0);
		this._statusCode.set(void 0);
	}
};
//#endregion
//#region node_modules/@angular/platform-browser/fesm2022/platform-browser.mjs
var _Meta;
var _Title;
var _CssVarNamespacer;
var _DomSanitizer;
var _DomSanitizerImpl;
/**
* @license Angular v22.2.0
* (c) 2010-2026 Google LLC. https://angular.dev/
* License: MIT
*/
var Meta = class {
	constructor() {
		_defineProperty(this, "_doc", inject(DOCUMENT));
		_defineProperty(this, "_dom", getDOM());
		_defineProperty(this, "_cachedHead", void 0);
	}
	addTag(tag, forceCreation = false) {
		if (!tag) return null;
		return this._getOrCreateElement(tag, forceCreation);
	}
	addTags(tags, forceCreation = false) {
		return tags.filter((tag) => !!tag).map((tag) => this._getOrCreateElement(tag, forceCreation));
	}
	getTag(attrSelector) {
		if (!attrSelector) return null;
		const meta = this._doc.querySelector(buildMetaSelector(attrSelector));
		return isMetaTag(meta) ? meta : null;
	}
	getTags(attrSelector) {
		if (!attrSelector) return [];
		const list = this._doc.querySelectorAll(buildMetaSelector(attrSelector));
		return list ? Array.from(list).filter((elem) => isMetaTag(elem)) : [];
	}
	updateTag(tag, selector) {
		var _selector;
		validateMetaDefinition(tag);
		(_selector = selector) !== null && _selector !== void 0 || (selector = parseSelector(tag));
		const meta = this.getTag(selector);
		if (meta) {
			setMetaElementAttributes(tag, meta);
			return meta;
		}
		return this._getOrCreateElement(tag, true);
	}
	removeTag(attrSelector) {
		this.removeTagElement(this.getTag(attrSelector));
	}
	removeTagElement(meta) {
		if (meta) this._dom.remove(meta);
	}
	_getOrCreateElement(meta, forceCreation = false) {
		validateMetaDefinition(meta);
		if (!forceCreation) {
			const selector = parseSelector(meta);
			const elem = this.getTags(selector).filter((elem) => containsAttributes(meta, elem))[0];
			if (elem !== void 0) return elem;
		}
		const element = this._dom.createElement("meta");
		setMetaElementAttributes(meta, element);
		this._doc.getElementsByTagName("head")[0].appendChild(element);
		return element;
	}
};
_Meta = Meta;
_defineProperty(Meta, "ɵfac", function Meta_Factory(__ngFactoryType__) {
	return new (__ngFactoryType__ || _Meta)();
});
_defineProperty(Meta, "ɵprov", /*@__PURE__*/ ɵɵdefineService({
	token: _Meta,
	factory: _Meta.ɵfac
}));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(Meta, [{ type: Service }], null, null);
})();
function buildMetaSelector(attrSelector) {
	return `meta[${attrSelector}]`;
}
function setMetaElementAttributes(tag, el) {
	Object.keys(tag).forEach((prop) => el.setAttribute(getMetaKeyMap(prop), tag[prop]));
}
function validateMetaDefinition(tag) {
	for (const prop of Object.keys(tag)) {
		const attributeName = getMetaKeyMap(prop);
		if (attributeName.toLowerCase().startsWith("on")) throw new RuntimeError(5203, (typeof ngDevMode === "undefined" || ngDevMode) && `The Meta service does not allow setting event handler attribute '${attributeName}' for security reasons.`);
	}
}
function parseSelector(tag) {
	const attr = tag.name ? "name" : "property";
	return `${attr}=${escapeSelectorValue(String(tag[attr]))}`;
}
function escapeSelectorValue(value) {
	return `"${value.replace(/\\/g, "\\\\").replace(/"/g, "\\\"")}"`;
}
function containsAttributes(tag, elem) {
	return Object.keys(tag).every((key) => elem.getAttribute(getMetaKeyMap(key)) === tag[key]);
}
function getMetaKeyMap(prop) {
	return Object.hasOwn(META_KEYS_MAP, prop) ? META_KEYS_MAP[prop] : prop;
}
function isMetaTag(tag) {
	return (tag === null || tag === void 0 ? void 0 : tag.nodeName.toLowerCase()) === "meta";
}
var META_KEYS_MAP = { httpEquiv: "http-equiv" };
var Title = class {
	constructor(_doc) {
		_defineProperty(this, "_doc", void 0);
		this._doc = _doc;
	}
	getTitle() {
		return this._doc.title;
	}
	setTitle(newTitle) {
		this._doc.title = newTitle || "";
	}
};
_Title = Title;
_defineProperty(Title, "ɵfac", function Title_Factory(__ngFactoryType__) {
	return new (__ngFactoryType__ || _Title)(ɵɵinject(DOCUMENT));
});
_defineProperty(Title, "ɵprov", /*@__PURE__*/ ɵɵdefineInjectable({
	token: _Title,
	factory: _Title.ɵfac,
	providedIn: "root"
}));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(Title, [{
		type: Injectable,
		args: [{ providedIn: "root" }]
	}], () => [{
		type: void 0,
		decorators: [{
			type: Inject,
			args: [DOCUMENT]
		}]
	}], null);
})();
function exportNgVar(name, value) {
	if (typeof COMPILED === "undefined" || !COMPILED) {
		const ng = _global["ng"] = _global["ng"] || {};
		ng[name] = value;
	}
}
var ChangeDetectionPerfRecord = class {
	constructor(msPerTick, numTicks) {
		_defineProperty(this, "msPerTick", void 0);
		_defineProperty(this, "numTicks", void 0);
		this.msPerTick = msPerTick;
		this.numTicks = numTicks;
	}
};
var AngularProfiler = class {
	constructor(ref) {
		_defineProperty(this, "appRef", void 0);
		this.appRef = ref.injector.get(ApplicationRef);
	}
	timeChangeDetection(config) {
		const record = config && config["record"];
		const profileName = "Change Detection";
		if (record && "profile" in console && typeof console.profile === "function") console.profile(profileName);
		const start = performance.now();
		let numTicks = 0;
		while (numTicks < 5 || performance.now() - start < 500) {
			this.appRef.tick();
			numTicks++;
		}
		const end = performance.now();
		if (record && "profileEnd" in console && typeof console.profileEnd === "function") console.profileEnd(profileName);
		const msPerTick = (end - start) / numTicks;
		console.log(`ran ${numTicks} change detection cycles`);
		console.log(`${msPerTick.toFixed(2)} ms per check`);
		return new ChangeDetectionPerfRecord(msPerTick, numTicks);
	}
};
var PROFILER_GLOBAL_NAME = "profiler";
function enableDebugTools(ref) {
	exportNgVar(PROFILER_GLOBAL_NAME, new AngularProfiler(ref));
	return ref;
}
function disableDebugTools() {
	exportNgVar(PROFILER_GLOBAL_NAME, null);
}
var By = class {
	static all() {
		return () => true;
	}
	static css(selector) {
		return (debugElement) => {
			return debugElement.nativeElement != null ? elementMatches(debugElement.nativeElement, selector) : false;
		};
	}
	static directive(type) {
		return (debugNode) => debugNode.providerTokens.indexOf(type) !== -1;
	}
};
function elementMatches(n, selector) {
	if (getDOM().isElementNode(n)) return n.matches && n.matches(selector) || n.msMatchesSelector && n.msMatchesSelector(selector) || n.webkitMatchesSelector && n.webkitMatchesSelector(selector);
	return false;
}
var CssVarNamespacer = class {
	constructor() {
		var _inject;
		_defineProperty(this, "namespacePrefix", (_inject = inject(CSS_VAR_NAMESPACE, { optional: true })) !== null && _inject !== void 0 ? _inject : "");
	}
	namespace(name) {
		if (typeof ngDevMode === "undefined" || ngDevMode) {
			if (!name.startsWith("--")) throw new Error(`CSS variable names passed to \`CssVarNamespacer\` must start with '--', got: '${name}'`);
		}
		if (!this.namespacePrefix) return name;
		return `--${this.namespacePrefix}${name.substring(2)}`;
	}
};
_CssVarNamespacer = CssVarNamespacer;
_defineProperty(CssVarNamespacer, "ɵfac", function CssVarNamespacer_Factory(__ngFactoryType__) {
	return new (__ngFactoryType__ || _CssVarNamespacer)();
});
_defineProperty(CssVarNamespacer, "ɵprov", /*@__PURE__*/ ɵɵdefineService({
	token: _CssVarNamespacer,
	factory: _CssVarNamespacer.ɵfac
}));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(CssVarNamespacer, [{ type: Service }], null, null);
})();
var HydrationFeatureKind;
(function(HydrationFeatureKind) {
	HydrationFeatureKind[HydrationFeatureKind["NoHttpTransferCache"] = 0] = "NoHttpTransferCache";
	HydrationFeatureKind[HydrationFeatureKind["HttpTransferCacheOptions"] = 1] = "HttpTransferCacheOptions";
	HydrationFeatureKind[HydrationFeatureKind["I18nSupport"] = 2] = "I18nSupport";
	HydrationFeatureKind[HydrationFeatureKind["EventReplay"] = 3] = "EventReplay";
	HydrationFeatureKind[HydrationFeatureKind["IncrementalHydration"] = 4] = "IncrementalHydration";
	HydrationFeatureKind[HydrationFeatureKind["NoIncrementalHydration"] = 5] = "NoIncrementalHydration";
})(HydrationFeatureKind || (HydrationFeatureKind = {}));
function hydrationFeature(ɵkind, ɵproviders = [], ɵoptions = {}) {
	return {
		ɵkind,
		ɵproviders
	};
}
function withNoHttpTransferCache() {
	return hydrationFeature(HydrationFeatureKind.NoHttpTransferCache);
}
function withHttpTransferCacheOptions(options) {
	return hydrationFeature(HydrationFeatureKind.HttpTransferCacheOptions, withHttpTransferCache(options));
}
function withI18nSupport() {
	return hydrationFeature(HydrationFeatureKind.I18nSupport, withI18nSupport$1());
}
function withEventReplay() {
	return hydrationFeature(HydrationFeatureKind.EventReplay, withEventReplay$1());
}
function withIncrementalHydration() {
	return hydrationFeature(HydrationFeatureKind.IncrementalHydration, withIncrementalHydration$1());
}
function withNoIncrementalHydration() {
	return hydrationFeature(HydrationFeatureKind.NoIncrementalHydration);
}
function provideEnabledBlockingInitialNavigationDetector() {
	return [{
		provide: ENVIRONMENT_INITIALIZER,
		useValue: () => {
			if (inject(IS_ENABLED_BLOCKING_INITIAL_NAVIGATION, { optional: true })) {
				const console = inject(Console);
				const message = formatRuntimeError(5001, "Configuration error: found both hydration and enabledBlocking initial navigation in the same application, which is a contradiction.");
				console.warn(message);
			}
		},
		multi: true
	}];
}
function provideClientHydration(...features) {
	const providers = [];
	const featuresKind = /* @__PURE__ */ new Set();
	for (const { ɵproviders, ɵkind } of features) {
		featuresKind.add(ɵkind);
		if (ɵproviders.length) providers.push(ɵproviders);
	}
	const hasHttpTransferCacheOptions = featuresKind.has(HydrationFeatureKind.HttpTransferCacheOptions);
	if (typeof ngDevMode !== "undefined" && ngDevMode) {
		if (featuresKind.has(HydrationFeatureKind.NoHttpTransferCache) && hasHttpTransferCacheOptions) throw new RuntimeError(5001, "Configuration error: found both withHttpTransferCacheOptions() and withNoHttpTransferCache() in the same call to provideClientHydration(), which is a contradiction.");
		if (featuresKind.has(HydrationFeatureKind.IncrementalHydration) && featuresKind.has(HydrationFeatureKind.NoIncrementalHydration)) throw new RuntimeError(5001, "Configuration error: found both withIncrementalHydration() and withNoIncrementalHydration() in the same call to provideClientHydration(), which is a contradiction.");
	}
	return makeEnvironmentProviders([
		typeof ngDevMode !== "undefined" && ngDevMode ? provideEnabledBlockingInitialNavigationDetector() : [],
		typeof ngDevMode !== "undefined" && ngDevMode ? provideStabilityDebugging() : [],
		withDomHydration(),
		featuresKind.has(HydrationFeatureKind.NoHttpTransferCache) || hasHttpTransferCacheOptions ? [] : withHttpTransferCache({}),
		featuresKind.has(HydrationFeatureKind.NoIncrementalHydration) ? [] : withIncrementalHydration$1(),
		providers,
		{
			provide: CACHE_ACTIVE,
			useValue: { isActive: true }
		},
		{
			provide: APP_BOOTSTRAP_LISTENER,
			multi: true,
			useFactory: () => {
				const appRef = inject(ApplicationRef);
				const cacheState = inject(CACHE_ACTIVE);
				return () => {
					appRef.whenStable().then(() => {
						cacheState.isActive = false;
					});
				};
			}
		}
	]);
}
var DomSanitizer = class {};
_DomSanitizer = DomSanitizer;
_defineProperty(DomSanitizer, "ɵfac", function DomSanitizer_Factory(__ngFactoryType__) {
	return new (__ngFactoryType__ || _DomSanitizer)();
});
_defineProperty(DomSanitizer, "ɵprov", /*@__PURE__*/ ɵɵdefineInjectable({
	token: _DomSanitizer,
	factory: function DomSanitizer_Factory(__ngFactoryType__) {
		let __ngConditionalFactory__ = null;
		if (__ngFactoryType__) __ngConditionalFactory__ = new (__ngFactoryType__ || _DomSanitizer)();
		else __ngConditionalFactory__ = ɵɵinject(DomSanitizerImpl);
		return __ngConditionalFactory__;
	},
	providedIn: "root"
}));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(DomSanitizer, [{
		type: Injectable,
		args: [{
			providedIn: "root",
			useExisting: forwardRef(() => DomSanitizerImpl)
		}]
	}], null, null);
})();
var DomSanitizerImpl = class extends DomSanitizer {
	constructor(..._args) {
		super(..._args);
		_defineProperty(this, "_doc", inject(DOCUMENT));
	}
	sanitize(ctx, value) {
		if (value == null) return null;
		switch (ctx) {
			case SecurityContext.NONE: return value;
			case SecurityContext.HTML:
				if (allowSanitizationBypassAndThrow(value, "HTML")) return unwrapSafeValue(value);
				return _sanitizeHtml(this._doc, String(value)).toString();
			case SecurityContext.STYLE:
				if (allowSanitizationBypassAndThrow(value, "Style")) return unwrapSafeValue(value);
				return value;
			case SecurityContext.SCRIPT:
				if (allowSanitizationBypassAndThrow(value, "Script")) return unwrapSafeValue(value);
				throw new RuntimeError(5200, (typeof ngDevMode === "undefined" || ngDevMode) && "unsafe value used in a script context");
			case SecurityContext.URL:
				if (allowSanitizationBypassAndThrow(value, "URL")) return unwrapSafeValue(value);
				return _sanitizeUrl(String(value));
			case SecurityContext.RESOURCE_URL:
				if (allowSanitizationBypassAndThrow(value, "ResourceURL")) return unwrapSafeValue(value);
				throw new RuntimeError(-5201, (typeof ngDevMode === "undefined" || ngDevMode) && `unsafe value used in a resource URL context (see https://angular.dev/best-practices/security#preventing-cross-site-scripting-xss)`);
			default: throw new RuntimeError(5202, (typeof ngDevMode === "undefined" || ngDevMode) && `Unexpected SecurityContext ${ctx} (see https://angular.dev/best-practices/security#preventing-cross-site-scripting-xss)`);
		}
	}
	bypassSecurityTrustHtml(value) {
		return bypassSanitizationTrustHtml(value);
	}
	bypassSecurityTrustStyle(value) {
		return bypassSanitizationTrustStyle(value);
	}
	bypassSecurityTrustScript(value) {
		return bypassSanitizationTrustScript(value);
	}
	bypassSecurityTrustUrl(value) {
		return bypassSanitizationTrustUrl(value);
	}
	bypassSecurityTrustResourceUrl(value) {
		return bypassSanitizationTrustResourceUrl(value);
	}
};
_DomSanitizerImpl = DomSanitizerImpl;
_defineProperty(DomSanitizerImpl, "ɵfac", function DomSanitizerImpl_Factory(__ngFactoryType__) {
	return new (__ngFactoryType__ || _DomSanitizerImpl)();
});
_defineProperty(DomSanitizerImpl, "ɵprov", /*@__PURE__*/ ɵɵdefineService({
	token: _DomSanitizerImpl,
	factory: _DomSanitizerImpl.ɵfac
}));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(DomSanitizerImpl, [{ type: Service }], null, null);
})();
var VERSION = /* @__PURE__ */ new Version("22.2.0");
//#endregion
export { of as C, mergeMap as S, withNoIncrementalHydration as _, HydrationFeatureKind as a, concatMap as b, VERSION as c, provideClientHydration as d, withEventReplay as f, withNoHttpTransferCache as g, withIncrementalHydration as h, DomSanitizerImpl as i, disableDebugTools as l, withI18nSupport as m, CssVarNamespacer as n, Meta as o, withHttpTransferCacheOptions as p, DomSanitizer as r, Title as s, By as t, enableDebugTools as u, switchMap as v, filter as x, finalize as y };
