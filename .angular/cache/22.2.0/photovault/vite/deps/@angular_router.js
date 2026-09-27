import { n as _defineProperty, t as _objectSpread2 } from "./objectSpread2-weooBxVk.js";
import { $n as Output, $o as ɵɵloadQuery, Ac as INTERNAL_APPLICATION_ERROR_HANDLER, Bc as NgZone, Bo as ɵɵinjectAttribute, Bt as computed, Cc as EnvironmentInjector, Cl as provideEnvironmentInitializer, Di as provideAppInitializer, Dl as signal, Ei as performanceMarkFeature, En as ElementRef, Er as ViewContainerRef, Fn as Injectable, Gl as Subject, Il as ɵɵinject, In as Input, Jc as RuntimeError, Jl as Observable, Kc as PendingTasksInternal, Kl as createOperatorSubscriber, Ls as ɵɵsanitizeUrlOrResourceUrl, Mc as Injector, Mi as publishNonCoreGlobalUtil, Ml as ɵɵdefineInjectable, Mn as IS_HYDRATION_DOM_REUSE_ENABLED, Mr as afterNextRender, Nl as ɵɵdefineInjector, O as booleanAttribute, Oa as ɵɵcontentQuery, Qc as Version, Ql as noop$1, Qo as ɵɵlistener, Tc as EventEmitter, Tl as runInInjectionContext, Ul as map, Wi as setClassMetadata, Wl as BehaviorSubject, Wt as linkedSignal, X as input, Xl as identity, Yl as pipe, Yn as NgModuleFactory$1, Yt as APP_BOOTSTRAP_LISTENER, Zo as ɵɵinvalidFactory, _l as isStandalone, a as ContentChildren, an as ChangeDetectionStrategy, ao as ɵɵdefineNgModule, bc as DestroyRef, cn as Component, co as ɵɵdirectiveInject, dr as Service, et as maybeUnwrapDefaultExport, eu as Subscription, f as HostAttributeToken, fn as Console, ft as reflectComponentType, hl as isInjectable, io as ɵɵdefineDirective, ir as Renderer2, jc as InjectionToken, jn as IS_ENABLED_BLOCKING_INITIAL_NAVIGATION, kn as HostListener, la as ɵɵNgOnChangesFeature, nl as assertInInjectionContext, nn as Attribute, nu as isFunction$1, ol as effect, on as Compiler, pc as _asyncToGenerator, pl as inject, pt as resourceFromSnapshots, ql as operate, qn as NgModule, qr as createEnvironmentInjector, qt as untracked, r as ChangeDetectorRef, ro as ɵɵdefineComponent, sl as formatRuntimeError, so as ɵɵdefineService, tn as ApplicationRef, tu as createErrorClass, uu as __values, vi as isNgModule, vo as ɵɵelement, wn as Directive, xc as ENVIRONMENT_INITIALIZER, xl as promiseWithResolvers, xs as ɵɵqueryRefresh, ya as ɵɵattribute, yc as DOCUMENT, yi as isPromise, yl as makeEnvironmentProviders } from "./core-C91JEChX.js";
import { a as popScheduler, i as popResultSelector, n as executeSchedule, r as innerFrom, t as from } from "./from-DN_lzLcs.js";
import { C as of, S as mergeMap, b as concatMap, s as Title, v as switchMap, x as filter, y as finalize } from "./platform-browser-BYPnOvIu.js";
import { n as argsArgArrayOrObject, r as mapOneOrManyArgs, t as createObject } from "./createObject-Dh3GAWl2.js";
import { d as PathLocationStrategy, g as PlatformLocation, h as LOCATION_INITIALIZED, l as Location, o as PRECOMMIT_HANDLER_SUPPORTED, r as ViewportScroller, s as PlatformNavigation, t as NavigationAdapterForLocation, u as LocationStrategy } from "./common-C2OsAfsp.js";
import { n as HashLocationStrategy } from "./_common_module-chunk-BJJFMmtK.js";
//#region node_modules/rxjs/dist/esm5/internal/observable/empty.js
var EMPTY = new Observable(function(subscriber) {
	return subscriber.complete();
});
//#endregion
//#region node_modules/rxjs/dist/esm5/internal/observable/throwError.js
function throwError(errorOrErrorFactory, scheduler) {
	var errorFactory = isFunction$1(errorOrErrorFactory) ? errorOrErrorFactory : function() {
		return errorOrErrorFactory;
	};
	var init = function(subscriber) {
		return subscriber.error(errorFactory());
	};
	return new Observable(scheduler ? function(subscriber) {
		return scheduler.schedule(init, 0, subscriber);
	} : init);
}
//#endregion
//#region node_modules/rxjs/dist/esm5/internal/util/isObservable.js
function isObservable(obj) {
	return !!obj && (obj instanceof Observable || isFunction$1(obj.lift) && isFunction$1(obj.subscribe));
}
//#endregion
//#region node_modules/rxjs/dist/esm5/internal/util/EmptyError.js
var EmptyError = createErrorClass(function(_super) {
	return function EmptyErrorImpl() {
		_super(this);
		this.name = "EmptyError";
		this.message = "no elements in sequence";
	};
});
//#endregion
//#region node_modules/rxjs/dist/esm5/internal/observable/combineLatest.js
function combineLatest() {
	var args = [];
	for (var _i = 0; _i < arguments.length; _i++) args[_i] = arguments[_i];
	var scheduler = popScheduler(args);
	var resultSelector = popResultSelector(args);
	var _a = argsArgArrayOrObject(args), observables = _a.args, keys = _a.keys;
	if (observables.length === 0) return from([], scheduler);
	var result = new Observable(combineLatestInit(observables, scheduler, keys ? function(values) {
		return createObject(keys, values);
	} : identity));
	return resultSelector ? result.pipe(mapOneOrManyArgs(resultSelector)) : result;
}
function combineLatestInit(observables, scheduler, valueTransform) {
	if (valueTransform === void 0) valueTransform = identity;
	return function(subscriber) {
		maybeSchedule(scheduler, function() {
			var length = observables.length;
			var values = new Array(length);
			var active = length;
			var remainingFirstValues = length;
			var _loop_1 = function(i) {
				maybeSchedule(scheduler, function() {
					var source = from(observables[i], scheduler);
					var hasFirstValue = false;
					source.subscribe(createOperatorSubscriber(subscriber, function(value) {
						values[i] = value;
						if (!hasFirstValue) {
							hasFirstValue = true;
							remainingFirstValues--;
						}
						if (!remainingFirstValues) subscriber.next(valueTransform(values.slice()));
					}, function() {
						if (!--active) subscriber.complete();
					}));
				}, subscriber);
			};
			for (var i = 0; i < length; i++) _loop_1(i);
		}, subscriber);
	};
}
function maybeSchedule(scheduler, execute, subscription) {
	if (scheduler) executeSchedule(subscription, scheduler, execute);
	else execute();
}
//#endregion
//#region node_modules/rxjs/dist/esm5/internal/operators/mergeAll.js
function mergeAll(concurrent) {
	if (concurrent === void 0) concurrent = Infinity;
	return mergeMap(identity, concurrent);
}
//#endregion
//#region node_modules/rxjs/dist/esm5/internal/operators/concatAll.js
function concatAll() {
	return mergeAll(1);
}
//#endregion
//#region node_modules/rxjs/dist/esm5/internal/observable/concat.js
function concat() {
	var args = [];
	for (var _i = 0; _i < arguments.length; _i++) args[_i] = arguments[_i];
	return concatAll()(from(args, popScheduler(args)));
}
//#endregion
//#region node_modules/rxjs/dist/esm5/internal/observable/defer.js
function defer(observableFactory) {
	return new Observable(function(subscriber) {
		innerFrom(observableFactory()).subscribe(subscriber);
	});
}
//#endregion
//#region node_modules/rxjs/dist/esm5/internal/operators/catchError.js
function catchError(selector) {
	return operate(function(source, subscriber) {
		var innerSub = null;
		var syncUnsub = false;
		var handledResult;
		innerSub = source.subscribe(createOperatorSubscriber(subscriber, void 0, void 0, function(err) {
			handledResult = innerFrom(selector(err, catchError(selector)(source)));
			if (innerSub) {
				innerSub.unsubscribe();
				innerSub = null;
				handledResult.subscribe(subscriber);
			} else syncUnsub = true;
		}));
		if (syncUnsub) {
			innerSub.unsubscribe();
			innerSub = null;
			handledResult.subscribe(subscriber);
		}
	});
}
//#endregion
//#region node_modules/rxjs/dist/esm5/internal/operators/defaultIfEmpty.js
function defaultIfEmpty(defaultValue) {
	return operate(function(source, subscriber) {
		var hasValue = false;
		source.subscribe(createOperatorSubscriber(subscriber, function(value) {
			hasValue = true;
			subscriber.next(value);
		}, function() {
			if (!hasValue) subscriber.next(defaultValue);
			subscriber.complete();
		}));
	});
}
//#endregion
//#region node_modules/rxjs/dist/esm5/internal/operators/take.js
function take(count) {
	return count <= 0 ? function() {
		return EMPTY;
	} : operate(function(source, subscriber) {
		var seen = 0;
		source.subscribe(createOperatorSubscriber(subscriber, function(value) {
			if (++seen <= count) {
				subscriber.next(value);
				if (count <= seen) subscriber.complete();
			}
		}));
	});
}
//#endregion
//#region node_modules/rxjs/dist/esm5/internal/operators/throwIfEmpty.js
function throwIfEmpty(errorFactory) {
	if (errorFactory === void 0) errorFactory = defaultErrorFactory;
	return operate(function(source, subscriber) {
		var hasValue = false;
		source.subscribe(createOperatorSubscriber(subscriber, function(value) {
			hasValue = true;
			subscriber.next(value);
		}, function() {
			return hasValue ? subscriber.complete() : subscriber.error(errorFactory());
		}));
	});
}
function defaultErrorFactory() {
	return new EmptyError();
}
//#endregion
//#region node_modules/rxjs/dist/esm5/internal/operators/first.js
function first(predicate, defaultValue) {
	var hasDefaultValue = arguments.length >= 2;
	return function(source) {
		return source.pipe(predicate ? filter(function(v, i) {
			return predicate(v, i, source);
		}) : identity, take(1), hasDefaultValue ? defaultIfEmpty(defaultValue) : throwIfEmpty(function() {
			return new EmptyError();
		}));
	};
}
//#endregion
//#region node_modules/rxjs/dist/esm5/internal/operators/takeLast.js
function takeLast(count) {
	return count <= 0 ? function() {
		return EMPTY;
	} : operate(function(source, subscriber) {
		var buffer = [];
		source.subscribe(createOperatorSubscriber(subscriber, function(value) {
			buffer.push(value);
			count < buffer.length && buffer.shift();
		}, function() {
			var e_1, _a;
			try {
				for (var buffer_1 = __values(buffer), buffer_1_1 = buffer_1.next(); !buffer_1_1.done; buffer_1_1 = buffer_1.next()) {
					var value = buffer_1_1.value;
					subscriber.next(value);
				}
			} catch (e_1_1) {
				e_1 = { error: e_1_1 };
			} finally {
				try {
					if (buffer_1_1 && !buffer_1_1.done && (_a = buffer_1.return)) _a.call(buffer_1);
				} finally {
					if (e_1) throw e_1.error;
				}
			}
			subscriber.complete();
		}, void 0, function() {
			buffer = null;
		}));
	});
}
//#endregion
//#region node_modules/rxjs/dist/esm5/internal/operators/startWith.js
function startWith() {
	var values = [];
	for (var _i = 0; _i < arguments.length; _i++) values[_i] = arguments[_i];
	var scheduler = popScheduler(values);
	return operate(function(source, subscriber) {
		(scheduler ? concat(values, source, scheduler) : concat(values, source)).subscribe(subscriber);
	});
}
//#endregion
//#region node_modules/rxjs/dist/esm5/internal/operators/takeUntil.js
function takeUntil(notifier) {
	return operate(function(source, subscriber) {
		innerFrom(notifier).subscribe(createOperatorSubscriber(subscriber, function() {
			return subscriber.complete();
		}, noop$1));
		!subscriber.closed && source.subscribe(subscriber);
	});
}
//#endregion
//#region node_modules/rxjs/dist/esm5/internal/operators/tap.js
function tap(observerOrNext, error, complete) {
	var tapObserver = isFunction$1(observerOrNext) || error || complete ? {
		next: observerOrNext,
		error,
		complete
	} : observerOrNext;
	return tapObserver ? operate(function(source, subscriber) {
		var _a;
		(_a = tapObserver.subscribe) === null || _a === void 0 || _a.call(tapObserver);
		var isUnsub = true;
		source.subscribe(createOperatorSubscriber(subscriber, function(value) {
			var _a;
			(_a = tapObserver.next) === null || _a === void 0 || _a.call(tapObserver, value);
			subscriber.next(value);
		}, function() {
			var _a;
			isUnsub = false;
			(_a = tapObserver.complete) === null || _a === void 0 || _a.call(tapObserver);
			subscriber.complete();
		}, function(err) {
			var _a;
			isUnsub = false;
			(_a = tapObserver.error) === null || _a === void 0 || _a.call(tapObserver, err);
			subscriber.error(err);
		}, function() {
			var _a, _b;
			if (isUnsub) (_a = tapObserver.unsubscribe) === null || _a === void 0 || _a.call(tapObserver);
			(_b = tapObserver.finalize) === null || _b === void 0 || _b.call(tapObserver);
		}));
	}) : identity;
}
//#endregion
//#region node_modules/@angular/router/fesm2022/_router-chunk.mjs
/**
* @license Angular v22.2.0
* (c) 2010-2026 Google LLC. https://angular.dev/
* License: MIT
*/
var _UrlSerializer;
var _ChildrenOutletContexts;
var _RouterOutlet;
var _RoutedComponentInputBinder;
var _ɵEmptyOutletComponent;
var _TitleStrategy;
var _DefaultTitleStrategy;
var _RouterConfigLoader;
var _UrlHandlingStrategy;
var _DefaultUrlHandlingStrategy;
var _NavigationTransitions;
var _RouteReuseStrategy;
var _DefaultRouteReuseStrategy;
var _StateManager;
var _HistoryStateManager;
var _Router;
var PRIMARY_OUTLET = "primary";
var RouteTitleKey = /* @__PURE__ */ Symbol("RouteTitle");
var ParamsAsMap = class {
	constructor(params) {
		_defineProperty(this, "params", void 0);
		this.params = params || {};
	}
	has(name) {
		return Object.hasOwn(this.params, name);
	}
	get(name) {
		if (this.has(name)) {
			const v = this.params[name];
			return Array.isArray(v) ? v[0] : v;
		}
		return null;
	}
	getAll(name) {
		if (this.has(name)) {
			const v = this.params[name];
			return Array.isArray(v) ? v : [v];
		}
		return [];
	}
	get keys() {
		return Object.keys(this.params);
	}
};
function convertToParamMap(params) {
	return new ParamsAsMap(params);
}
function matchParts(routeParts, urlSegments, posParams) {
	for (let i = 0; i < routeParts.length; i++) {
		const part = routeParts[i];
		const segment = urlSegments[i];
		if (part[0] === ":") posParams[part.substring(1)] = segment;
		else if (part !== segment.path) return false;
	}
	return true;
}
function defaultUrlMatcher(segments, segmentGroup, route) {
	const parts = route.path.split("/");
	const wildcardIndex = parts.indexOf("**");
	if (wildcardIndex === -1) {
		if (parts.length > segments.length) return null;
		if (route.pathMatch === "full" && (segmentGroup.hasChildren() || parts.length < segments.length)) return null;
		const posParams = {};
		const consumed = segments.slice(0, parts.length);
		if (!matchParts(parts, consumed, posParams)) return null;
		return {
			consumed,
			posParams
		};
	}
	if (wildcardIndex !== parts.lastIndexOf("**")) return null;
	const pre = parts.slice(0, wildcardIndex);
	const post = parts.slice(wildcardIndex + 1);
	if (pre.length + post.length > segments.length) return null;
	if (route.pathMatch === "full" && segmentGroup.hasChildren() && route.path !== "**") return null;
	const posParams = {};
	if (!matchParts(pre, segments.slice(0, pre.length), posParams)) return null;
	if (!matchParts(post, segments.slice(segments.length - post.length), posParams)) return null;
	return {
		consumed: segments,
		posParams
	};
}
function firstValueFrom(source) {
	return new Promise((resolve, reject) => {
		source.pipe(first()).subscribe({
			next: (value) => resolve(value),
			error: (err) => reject(err)
		});
	});
}
function shallowEqualArrays(a, b) {
	if (a.length !== b.length) return false;
	for (let i = 0; i < a.length; ++i) if (!shallowEqual(a[i], b[i])) return false;
	return true;
}
function shallowEqual(a, b) {
	const k1 = a ? getDataKeys(a) : void 0;
	const k2 = b ? getDataKeys(b) : void 0;
	if (!k1 || !k2 || k1.length != k2.length) return false;
	let key;
	for (let i = 0; i < k1.length; i++) {
		key = k1[i];
		if (!equalArraysOrString(a[key], b[key])) return false;
	}
	return true;
}
function getDataKeys(obj) {
	return [...Object.keys(obj), ...Object.getOwnPropertySymbols(obj)];
}
function equalArraysOrString(a, b) {
	if (Array.isArray(a) && Array.isArray(b)) {
		if (a.length !== b.length) return false;
		const aSorted = [...a].sort();
		const bSorted = [...b].sort();
		return aSorted.every((val, index) => bSorted[index] === val);
	} else return a === b;
}
function last(a) {
	return a.length > 0 ? a[a.length - 1] : null;
}
function wrapIntoObservable(value) {
	if (isObservable(value)) return value;
	if (isPromise(value)) return from(Promise.resolve(value));
	return of(value);
}
function wrapIntoPromise(value) {
	if (isObservable(value)) return firstValueFrom(value);
	return Promise.resolve(value);
}
var pathCompareMap = {
	"exact": equalSegmentGroups,
	"subset": containsSegmentGroup
};
var paramCompareMap = {
	"exact": equalParams,
	"subset": containsParams,
	"ignored": () => true
};
var exactMatchOptions = {
	paths: "exact",
	fragment: "ignored",
	matrixParams: "ignored",
	queryParams: "exact"
};
var subsetMatchOptions = {
	paths: "subset",
	fragment: "ignored",
	matrixParams: "ignored",
	queryParams: "subset"
};
function isActive(url, router, matchOptions) {
	const urlTree = url instanceof UrlTree ? url : router.parseUrl(url);
	return computed(() => {
		var _router$lastSuccessfu, _router$lastSuccessfu2;
		return containsTree((_router$lastSuccessfu = (_router$lastSuccessfu2 = router.lastSuccessfulNavigation()) === null || _router$lastSuccessfu2 === void 0 ? void 0 : _router$lastSuccessfu2.finalUrl) !== null && _router$lastSuccessfu !== void 0 ? _router$lastSuccessfu : new UrlTree(), urlTree, matchOptions);
	});
}
function containsTree(container, containee, options) {
	const matchOptions = _objectSpread2(_objectSpread2({}, subsetMatchOptions), options || {});
	return pathCompareMap[matchOptions.paths](container.root, containee.root, matchOptions.matrixParams) && paramCompareMap[matchOptions.queryParams](container.queryParams, containee.queryParams) && !(matchOptions.fragment === "exact" && container.fragment !== containee.fragment);
}
function equalParams(container, containee) {
	return shallowEqual(container, containee);
}
function equalSegmentGroups(container, containee, matrixParams) {
	if (!equalPath(container.segments, containee.segments)) return false;
	if (!matrixParamsMatch(container.segments, containee.segments, matrixParams)) return false;
	if (container.numberOfChildren !== containee.numberOfChildren) return false;
	for (const c in containee.children) {
		if (!container.children[c]) return false;
		if (!equalSegmentGroups(container.children[c], containee.children[c], matrixParams)) return false;
	}
	return true;
}
function containsParams(container, containee) {
	return Object.keys(containee).length <= Object.keys(container).length && Object.keys(containee).every((key) => equalArraysOrString(container[key], containee[key]));
}
function containsSegmentGroup(container, containee, matrixParams) {
	return containsSegmentGroupHelper(container, containee, containee.segments, matrixParams);
}
function containsSegmentGroupHelper(container, containee, containeePaths, matrixParams) {
	if (container.segments.length > containeePaths.length) {
		const current = container.segments.slice(0, containeePaths.length);
		if (!equalPath(current, containeePaths)) return false;
		if (containee.hasChildren()) return false;
		if (!matrixParamsMatch(current, containeePaths, matrixParams)) return false;
		return true;
	} else if (container.segments.length === containeePaths.length) {
		if (!equalPath(container.segments, containeePaths)) return false;
		if (!matrixParamsMatch(container.segments, containeePaths, matrixParams)) return false;
		for (const c in containee.children) {
			if (!container.children[c]) return false;
			if (!containsSegmentGroup(container.children[c], containee.children[c], matrixParams)) return false;
		}
		return true;
	} else {
		const current = containeePaths.slice(0, container.segments.length);
		const next = containeePaths.slice(container.segments.length);
		if (!equalPath(container.segments, current)) return false;
		if (!matrixParamsMatch(container.segments, current, matrixParams)) return false;
		if (!container.children["primary"]) return false;
		return containsSegmentGroupHelper(container.children[PRIMARY_OUTLET], containee, next, matrixParams);
	}
}
function matrixParamsMatch(containerPaths, containeePaths, options) {
	return containeePaths.every((containeeSegment, i) => {
		return paramCompareMap[options](containerPaths[i].parameters, containeeSegment.parameters);
	});
}
var UrlTree = class {
	constructor(root = new UrlSegmentGroup([], {}), queryParams = {}, fragment = null) {
		_defineProperty(this, "root", void 0);
		_defineProperty(this, "queryParams", void 0);
		_defineProperty(this, "fragment", void 0);
		_defineProperty(this, "_queryParamMap", void 0);
		this.root = root;
		this.queryParams = queryParams;
		this.fragment = fragment;
		if (typeof ngDevMode === "undefined" || ngDevMode) {
			if (root.segments.length > 0) throw new RuntimeError(4015, "The root `UrlSegmentGroup` should not contain `segments`. Instead, these segments belong in the `children` so they can be associated with a named outlet.");
		}
	}
	get queryParamMap() {
		var _this$_queryParamMap;
		(_this$_queryParamMap = this._queryParamMap) !== null && _this$_queryParamMap !== void 0 || (this._queryParamMap = convertToParamMap(this.queryParams));
		return this._queryParamMap;
	}
	toString() {
		return DEFAULT_SERIALIZER.serialize(this);
	}
};
var UrlSegmentGroup = class {
	constructor(segments, children) {
		_defineProperty(this, "segments", void 0);
		_defineProperty(this, "children", void 0);
		_defineProperty(this, "parent", null);
		this.segments = segments;
		this.children = children;
		Object.values(children).forEach((v) => v.parent = this);
	}
	hasChildren() {
		return this.numberOfChildren > 0;
	}
	get numberOfChildren() {
		return Object.keys(this.children).length;
	}
	toString() {
		return serializePaths(this);
	}
};
var UrlSegment = class {
	constructor(path, parameters) {
		_defineProperty(this, "path", void 0);
		_defineProperty(this, "parameters", void 0);
		_defineProperty(this, "_parameterMap", void 0);
		this.path = path;
		this.parameters = parameters;
	}
	get parameterMap() {
		var _this$_parameterMap;
		(_this$_parameterMap = this._parameterMap) !== null && _this$_parameterMap !== void 0 || (this._parameterMap = convertToParamMap(this.parameters));
		return this._parameterMap;
	}
	toString() {
		return serializePath(this);
	}
};
function equalSegments(as, bs) {
	return equalPath(as, bs) && as.every((a, i) => shallowEqual(a.parameters, bs[i].parameters));
}
function equalPath(as, bs) {
	if (as.length !== bs.length) return false;
	return as.every((a, i) => a.path === bs[i].path);
}
function mapChildrenIntoArray(segment, fn) {
	let res = [];
	Object.entries(segment.children).forEach(([childOutlet, child]) => {
		if (childOutlet === "primary") res = res.concat(fn(child, childOutlet));
	});
	Object.entries(segment.children).forEach(([childOutlet, child]) => {
		if (childOutlet !== "primary") res = res.concat(fn(child, childOutlet));
	});
	return res;
}
var UrlSerializer = class {};
_UrlSerializer = UrlSerializer;
_defineProperty(UrlSerializer, "ɵfac", function UrlSerializer_Factory(__ngFactoryType__) {
	return new (__ngFactoryType__ || _UrlSerializer)();
});
_defineProperty(UrlSerializer, "ɵprov", /*@__PURE__*/ ɵɵdefineService({
	token: _UrlSerializer,
	factory: () => {
		return (() => {
			return new DefaultUrlSerializer();
		})();
	}
}));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(UrlSerializer, [{
		type: Service,
		args: [{ factory: () => new DefaultUrlSerializer() }]
	}], null, null);
})();
var DefaultUrlSerializer = class {
	parse(url) {
		const p = new UrlParser(url);
		return new UrlTree(p.parseRootSegment(), p.parseQueryParams(), p.parseFragment());
	}
	serialize(tree) {
		return `${`/${serializeSegment(tree.root, true)}`}${serializeQueryParams(tree.queryParams)}${typeof tree.fragment === `string` ? `#${encodeUriFragment(tree.fragment)}` : ""}`;
	}
};
var DEFAULT_SERIALIZER = new DefaultUrlSerializer();
function serializePaths(segment) {
	return segment.segments.map((p) => serializePath(p)).join("/");
}
function serializeSegment(segment, root) {
	if (!segment.hasChildren()) return serializePaths(segment);
	if (root) {
		const primary = segment.children["primary"] ? serializeSegment(segment.children[PRIMARY_OUTLET], false) : "";
		const children = [];
		Object.entries(segment.children).forEach(([k, v]) => {
			if (k !== "primary") children.push(`${k}:${serializeSegment(v, false)}`);
		});
		return children.length > 0 ? `${primary}(${children.join("//")})` : primary;
	} else {
		const children = mapChildrenIntoArray(segment, (v, k) => {
			if (k === "primary") return [serializeSegment(segment.children[PRIMARY_OUTLET], false)];
			return [`${k}:${serializeSegment(v, false)}`];
		});
		if (Object.keys(segment.children).length === 1 && segment.children["primary"] != null) return `${serializePaths(segment)}/${children[0]}`;
		return `${serializePaths(segment)}/(${children.join("//")})`;
	}
}
function encodeUriString(s) {
	return encodeURIComponent(s).replace(/%40/g, "@").replace(/%3A/gi, ":").replace(/%24/g, "$").replace(/%2C/gi, ",");
}
function encodeUriQuery(s) {
	return encodeUriString(s).replace(/%3B/gi, ";");
}
function encodeUriFragment(s) {
	return encodeURI(s);
}
function encodeUriSegment(s) {
	return encodeUriString(s).replace(/\(/g, "%28").replace(/\)/g, "%29").replace(/%26/gi, "&");
}
function decode(s) {
	return decodeURIComponent(s);
}
function decodeQuery(s) {
	return decode(s.replace(/\+/g, "%20"));
}
function serializePath(path) {
	return `${encodeUriSegment(path.path)}${serializeMatrixParams(path.parameters)}`;
}
function serializeMatrixParams(params) {
	return Object.entries(params).map(([key, value]) => `;${encodeUriSegment(key)}=${encodeUriSegment(value)}`).join("");
}
function serializeQueryParams(params) {
	const strParams = Object.entries(params).map(([name, value]) => {
		return Array.isArray(value) ? value.map((v) => `${encodeUriQuery(name)}=${encodeUriQuery(v)}`).join("&") : `${encodeUriQuery(name)}=${encodeUriQuery(value)}`;
	}).filter((s) => s);
	return strParams.length ? `?${strParams.join("&")}` : "";
}
var SLOW_ELEMENTS_SENTINEL = 1073741824;
function setUrlDerivedKey(target, key, value) {
	if (Number(key) >= 32 && !Object.hasOwn(target, SLOW_ELEMENTS_SENTINEL)) {
		target[SLOW_ELEMENTS_SENTINEL] = value;
		delete target[SLOW_ELEMENTS_SENTINEL];
	}
	target[key] = value;
}
var SEGMENT_RE = /^[^\/()?;#]+/;
function matchSegments(str) {
	const match = str.match(SEGMENT_RE);
	return match ? match[0] : "";
}
var MATRIX_PARAM_SEGMENT_RE = /^[^\/()?;=#]+/;
function matchMatrixKeySegments(str) {
	const match = str.match(MATRIX_PARAM_SEGMENT_RE);
	return match ? match[0] : "";
}
var QUERY_PARAM_RE = /^[^=?&#]+/;
function matchQueryParams(str) {
	const match = str.match(QUERY_PARAM_RE);
	return match ? match[0] : "";
}
var QUERY_PARAM_VALUE_RE = /^[^&#]+/;
function matchUrlQueryParamValue(str) {
	const match = str.match(QUERY_PARAM_VALUE_RE);
	return match ? match[0] : "";
}
var UrlParser = class {
	constructor(url) {
		_defineProperty(this, "url", void 0);
		_defineProperty(this, "remaining", void 0);
		this.url = url;
		this.remaining = url;
	}
	parseRootSegment() {
		while (this.consumeOptional("/"));
		if (this.remaining === "" || this.peekStartsWith("?") || this.peekStartsWith("#")) return new UrlSegmentGroup([], {});
		return new UrlSegmentGroup([], this.parseChildren());
	}
	parseQueryParams() {
		const params = {};
		if (this.consumeOptional("?")) do
			this.parseQueryParam(params);
		while (this.consumeOptional("&"));
		return params;
	}
	parseFragment() {
		return this.consumeOptional("#") ? decodeURIComponent(this.remaining) : null;
	}
	parseChildren(depth = 0) {
		if (depth > 50) throw new RuntimeError(4010, (typeof ngDevMode === "undefined" || ngDevMode) && "URL is too deep");
		if (this.remaining === "") return {};
		this.consumeOptional("/");
		const segments = [];
		if (!this.peekStartsWith("(")) segments.push(this.parseSegment());
		while (this.peekStartsWith("/") && !this.peekStartsWith("//") && !this.peekStartsWith("/(")) {
			this.capture("/");
			segments.push(this.parseSegment());
		}
		let children = {};
		if (this.peekStartsWith("/(")) {
			this.capture("/");
			children = this.parseParens(true, depth);
		}
		let res = {};
		if (this.peekStartsWith("(")) res = this.parseParens(false, depth);
		if (segments.length > 0 || Object.keys(children).length > 0) res[PRIMARY_OUTLET] = new UrlSegmentGroup(segments, children);
		return res;
	}
	parseSegment() {
		const path = matchSegments(this.remaining);
		if (path === "" && this.peekStartsWith(";")) throw new RuntimeError(4009, (typeof ngDevMode === "undefined" || ngDevMode) && `Empty path url segment cannot have parameters: '${this.remaining}'.`);
		this.capture(path);
		return new UrlSegment(decode(path), this.parseMatrixParams());
	}
	parseMatrixParams() {
		const params = {};
		while (this.consumeOptional(";")) this.parseParam(params);
		return params;
	}
	parseParam(params) {
		const key = matchMatrixKeySegments(this.remaining);
		if (!key) return;
		this.capture(key);
		let value = "";
		if (this.consumeOptional("=")) {
			const valueMatch = matchSegments(this.remaining);
			if (valueMatch) {
				value = valueMatch;
				this.capture(value);
			}
		}
		setUrlDerivedKey(params, decode(key), decode(value));
	}
	parseQueryParam(params) {
		const key = matchQueryParams(this.remaining);
		if (!key) return;
		this.capture(key);
		let value = "";
		if (this.consumeOptional("=")) {
			const valueMatch = matchUrlQueryParamValue(this.remaining);
			if (valueMatch) {
				value = valueMatch;
				this.capture(value);
			}
		}
		const decodedKey = decodeQuery(key);
		const decodedVal = decodeQuery(value);
		if (Object.hasOwn(params, decodedKey)) {
			let currentVal = params[decodedKey];
			if (!Array.isArray(currentVal)) {
				currentVal = [currentVal];
				params[decodedKey] = currentVal;
			}
			currentVal.push(decodedVal);
		} else params[decodedKey] = decodedVal;
	}
	parseParens(allowPrimary, depth) {
		const segments = Object.create(null);
		this.capture("(");
		while (!this.consumeOptional(")") && this.remaining.length > 0) {
			var _outletName;
			const path = matchSegments(this.remaining);
			const next = this.remaining[path.length];
			if (next !== "/" && next !== ")" && next !== ";") throw new RuntimeError(4010, (typeof ngDevMode === "undefined" || ngDevMode) && `Cannot parse url '${this.url}'`);
			let outletName;
			if (path.indexOf(":") > -1) {
				outletName = path.slice(0, path.indexOf(":"));
				this.capture(outletName);
				this.capture(":");
			} else if (allowPrimary) outletName = PRIMARY_OUTLET;
			const children = this.parseChildren(depth + 1);
			const child = Object.keys(children).length === 1 && children["primary"] ? children[PRIMARY_OUTLET] : new UrlSegmentGroup([], children);
			setUrlDerivedKey(segments, (_outletName = outletName) !== null && _outletName !== void 0 ? _outletName : PRIMARY_OUTLET, child);
			this.consumeOptional("//");
		}
		return segments;
	}
	peekStartsWith(str) {
		return this.remaining.startsWith(str);
	}
	consumeOptional(str) {
		if (this.peekStartsWith(str)) {
			this.remaining = this.remaining.substring(str.length);
			return true;
		}
		return false;
	}
	capture(str) {
		if (!this.consumeOptional(str)) throw new RuntimeError(4011, (typeof ngDevMode === "undefined" || ngDevMode) && `Expected "${str}".`);
	}
};
function createRoot(rootCandidate) {
	return rootCandidate.segments.length > 0 ? new UrlSegmentGroup([], { [PRIMARY_OUTLET]: rootCandidate }) : rootCandidate;
}
function squashSegmentGroup(segmentGroup) {
	const newChildren = Object.create(null);
	for (const [childOutlet, child] of Object.entries(segmentGroup.children)) {
		const childCandidate = squashSegmentGroup(child);
		if (childOutlet === "primary" && childCandidate.segments.length === 0 && childCandidate.hasChildren()) for (const [grandChildOutlet, grandChild] of Object.entries(childCandidate.children)) setUrlDerivedKey(newChildren, grandChildOutlet, grandChild);
		else if (childCandidate.segments.length > 0 || childCandidate.hasChildren()) setUrlDerivedKey(newChildren, childOutlet, childCandidate);
	}
	return mergeTrivialChildren(new UrlSegmentGroup(segmentGroup.segments, newChildren));
}
function mergeTrivialChildren(s) {
	if (s.numberOfChildren === 1 && s.children["primary"]) {
		const c = s.children[PRIMARY_OUTLET];
		return new UrlSegmentGroup(s.segments.concat(c.segments), c.children);
	}
	return s;
}
function isUrlTree(v) {
	return v instanceof UrlTree;
}
function createUrlTreeFromSnapshot(relativeTo, commands, queryParams = null, fragment = null, urlSerializer = new DefaultUrlSerializer()) {
	return createUrlTreeFromSegmentGroup(createSegmentGroupFromRoute(relativeTo), commands, queryParams, fragment, urlSerializer);
}
function createSegmentGroupFromRoute(route) {
	var _targetGroup;
	let targetGroup;
	function createSegmentGroupFromRouteRecursive(currentRoute) {
		const childOutlets = {};
		for (const childSnapshot of currentRoute.children) {
			const root = createSegmentGroupFromRouteRecursive(childSnapshot);
			childOutlets[childSnapshot.outlet] = root;
		}
		const segmentGroup = new UrlSegmentGroup(currentRoute.url, childOutlets);
		if (currentRoute === route) targetGroup = segmentGroup;
		return segmentGroup;
	}
	const rootSegmentGroup = createRoot(createSegmentGroupFromRouteRecursive(route.root));
	return (_targetGroup = targetGroup) !== null && _targetGroup !== void 0 ? _targetGroup : rootSegmentGroup;
}
function createUrlTreeFromSegmentGroup(relativeTo, commands, queryParams, fragment, urlSerializer) {
	let root = relativeTo;
	while (root.parent) root = root.parent;
	if (commands.length === 0) return tree(root, root, root, queryParams, fragment, urlSerializer);
	const nav = computeNavigation(commands);
	if (nav.toRoot()) return tree(root, root, new UrlSegmentGroup([], {}), queryParams, fragment, urlSerializer);
	const position = findStartingPositionForTargetGroup(nav, root, relativeTo);
	const newSegmentGroup = position.processChildren ? updateSegmentGroupChildren(position.segmentGroup, position.index, nav.commands) : updateSegmentGroup(position.segmentGroup, position.index, nav.commands);
	return tree(root, position.segmentGroup, newSegmentGroup, queryParams, fragment, urlSerializer);
}
function isMatrixParams(command) {
	return typeof command === "object" && command != null && !command.outlets && !command.segmentPath;
}
function isCommandWithOutlets(command) {
	return typeof command === "object" && command != null && command.outlets;
}
function normalizeQueryParams(k, v, urlSerializer) {
	k || (k = "ɵ");
	const tree = new UrlTree();
	tree.queryParams = { [k]: v };
	return urlSerializer.parse(urlSerializer.serialize(tree)).queryParams[k];
}
function tree(oldRoot, oldSegmentGroup, newSegmentGroup, queryParams, fragment, urlSerializer) {
	const qp = {};
	for (const [key, value] of Object.entries(queryParams !== null && queryParams !== void 0 ? queryParams : {})) qp[key] = Array.isArray(value) ? value.map((v) => normalizeQueryParams(key, v, urlSerializer)) : normalizeQueryParams(key, value, urlSerializer);
	let rootCandidate;
	if (oldRoot === oldSegmentGroup) rootCandidate = newSegmentGroup;
	else rootCandidate = replaceSegment(oldRoot, oldSegmentGroup, newSegmentGroup);
	return new UrlTree(createRoot(squashSegmentGroup(rootCandidate)), qp, fragment);
}
function replaceSegment(current, oldSegment, newSegment) {
	const children = Object.create(null);
	Object.entries(current.children).forEach(([outletName, c]) => {
		if (c === oldSegment) children[outletName] = newSegment;
		else children[outletName] = replaceSegment(c, oldSegment, newSegment);
	});
	return new UrlSegmentGroup(current.segments, children);
}
var Navigation = class {
	constructor(isAbsolute, numberOfDoubleDots, commands) {
		_defineProperty(this, "isAbsolute", void 0);
		_defineProperty(this, "numberOfDoubleDots", void 0);
		_defineProperty(this, "commands", void 0);
		this.isAbsolute = isAbsolute;
		this.numberOfDoubleDots = numberOfDoubleDots;
		this.commands = commands;
		if (isAbsolute && commands.length > 0 && isMatrixParams(commands[0])) throw new RuntimeError(4003, (typeof ngDevMode === "undefined" || ngDevMode) && "Root segment cannot have matrix parameters");
		const cmdWithOutlet = commands.find(isCommandWithOutlets);
		if (cmdWithOutlet && cmdWithOutlet !== last(commands)) throw new RuntimeError(4004, (typeof ngDevMode === "undefined" || ngDevMode) && "{outlets:{}} has to be the last command");
	}
	toRoot() {
		return this.isAbsolute && this.commands.length === 1 && this.commands[0] == "/";
	}
};
function computeNavigation(commands) {
	if (typeof commands[0] === "string" && commands.length === 1 && commands[0] === "/") return new Navigation(true, 0, commands);
	let numberOfDoubleDots = 0;
	let isAbsolute = false;
	const res = commands.reduce((res, cmd, cmdIdx) => {
		if (typeof cmd === "object" && cmd != null) {
			if (cmd.outlets) {
				const outlets = {};
				Object.entries(cmd.outlets).forEach(([name, commands]) => {
					outlets[name] = typeof commands === "string" ? commands.split("/") : commands;
				});
				return [...res, { outlets }];
			}
			if (cmd.segmentPath) return [...res, cmd.segmentPath];
		}
		if (!(typeof cmd === "string")) return [...res, cmd];
		if (cmdIdx === 0) {
			cmd.split("/").forEach((urlPart, partIndex) => {
				if (partIndex == 0 && urlPart === ".");
				else if (partIndex == 0 && urlPart === "") isAbsolute = true;
				else if (urlPart === "..") numberOfDoubleDots++;
				else if (urlPart != "") res.push(urlPart);
			});
			return res;
		}
		return [...res, cmd];
	}, []);
	return new Navigation(isAbsolute, numberOfDoubleDots, res);
}
var Position = class {
	constructor(segmentGroup, processChildren, index) {
		_defineProperty(this, "segmentGroup", void 0);
		_defineProperty(this, "processChildren", void 0);
		_defineProperty(this, "index", void 0);
		this.segmentGroup = segmentGroup;
		this.processChildren = processChildren;
		this.index = index;
	}
};
function findStartingPositionForTargetGroup(nav, root, target) {
	if (nav.isAbsolute) return new Position(root, true, 0);
	if (!target) return new Position(root, false, NaN);
	if (target.parent === null) return new Position(target, true, 0);
	const modifier = isMatrixParams(nav.commands[0]) ? 0 : 1;
	return createPositionApplyingDoubleDots(target, target.segments.length - 1 + modifier, nav.numberOfDoubleDots);
}
function createPositionApplyingDoubleDots(group, index, numberOfDoubleDots) {
	let g = group;
	let ci = index;
	let dd = numberOfDoubleDots;
	while (dd > ci) {
		dd -= ci;
		g = g.parent;
		if (!g) throw new RuntimeError(4005, (typeof ngDevMode === "undefined" || ngDevMode) && "Invalid number of '../'");
		ci = g.segments.length;
	}
	return new Position(g, false, ci - dd);
}
function getOutlets(commands) {
	if (isCommandWithOutlets(commands[0])) return commands[0].outlets;
	return { [PRIMARY_OUTLET]: commands };
}
function updateSegmentGroup(segmentGroup, startIndex, commands) {
	var _segmentGroup;
	(_segmentGroup = segmentGroup) !== null && _segmentGroup !== void 0 || (segmentGroup = new UrlSegmentGroup([], {}));
	if (segmentGroup.segments.length === 0 && segmentGroup.hasChildren()) return updateSegmentGroupChildren(segmentGroup, startIndex, commands);
	const m = prefixedWith(segmentGroup, startIndex, commands);
	const slicedCommands = commands.slice(m.commandIndex);
	if (m.match && m.pathIndex < segmentGroup.segments.length) {
		const g = new UrlSegmentGroup(segmentGroup.segments.slice(0, m.pathIndex), {});
		g.children[PRIMARY_OUTLET] = new UrlSegmentGroup(segmentGroup.segments.slice(m.pathIndex), segmentGroup.children);
		return updateSegmentGroupChildren(g, 0, slicedCommands);
	} else if (m.match && slicedCommands.length === 0) return new UrlSegmentGroup(segmentGroup.segments, {});
	else if (m.match && !segmentGroup.hasChildren()) return createNewSegmentGroup(segmentGroup, startIndex, commands);
	else if (m.match) return updateSegmentGroupChildren(segmentGroup, 0, slicedCommands);
	else return createNewSegmentGroup(segmentGroup, startIndex, commands);
}
function updateSegmentGroupChildren(segmentGroup, startIndex, commands) {
	if (commands.length === 0) return new UrlSegmentGroup(segmentGroup.segments, {});
	else {
		const outlets = getOutlets(commands);
		const children = Object.create(null);
		if (Object.keys(outlets).some((o) => o !== "primary") && segmentGroup.children["primary"] && segmentGroup.numberOfChildren === 1 && segmentGroup.children["primary"].segments.length === 0) {
			const childrenOfEmptyChild = updateSegmentGroupChildren(segmentGroup.children[PRIMARY_OUTLET], startIndex, commands);
			return new UrlSegmentGroup(segmentGroup.segments, childrenOfEmptyChild.children);
		}
		Object.entries(outlets).forEach(([outlet, commands]) => {
			if (typeof commands === "string") commands = [commands];
			if (commands !== null) children[outlet] = updateSegmentGroup(segmentGroup.children[outlet], startIndex, commands);
		});
		Object.entries(segmentGroup.children).forEach(([childOutlet, child]) => {
			if (outlets[childOutlet] === void 0) children[childOutlet] = child;
		});
		return new UrlSegmentGroup(segmentGroup.segments, children);
	}
}
function prefixedWith(segmentGroup, startIndex, commands) {
	let currentCommandIndex = 0;
	let currentPathIndex = startIndex;
	const noMatch = {
		match: false,
		pathIndex: 0,
		commandIndex: 0
	};
	while (currentPathIndex < segmentGroup.segments.length) {
		if (currentCommandIndex >= commands.length) return noMatch;
		const path = segmentGroup.segments[currentPathIndex];
		const command = commands[currentCommandIndex];
		if (isCommandWithOutlets(command)) break;
		const curr = `${command}`;
		const next = currentCommandIndex < commands.length - 1 ? commands[currentCommandIndex + 1] : null;
		if (currentPathIndex > 0 && curr === void 0) break;
		if (curr && next && typeof next === "object" && next.outlets === void 0) {
			if (!compare(curr, next, path)) return noMatch;
			currentCommandIndex += 2;
		} else {
			if (!compare(curr, {}, path)) return noMatch;
			currentCommandIndex++;
		}
		currentPathIndex++;
	}
	return {
		match: true,
		pathIndex: currentPathIndex,
		commandIndex: currentCommandIndex
	};
}
function createNewSegmentGroup(segmentGroup, startIndex, commands) {
	const paths = segmentGroup.segments.slice(0, startIndex);
	let i = 0;
	while (i < commands.length) {
		const command = commands[i];
		if (isCommandWithOutlets(command)) return new UrlSegmentGroup(paths, createNewSegmentChildren(command.outlets));
		if (i === 0 && isMatrixParams(commands[0])) {
			const p = segmentGroup.segments[startIndex];
			paths.push(new UrlSegment(p.path, stringify(commands[0])));
			i++;
			continue;
		}
		const curr = isCommandWithOutlets(command) ? command.outlets[PRIMARY_OUTLET] : `${command}`;
		const next = i < commands.length - 1 ? commands[i + 1] : null;
		if (curr && next && isMatrixParams(next)) {
			paths.push(new UrlSegment(curr, stringify(next)));
			i += 2;
		} else {
			paths.push(new UrlSegment(curr, {}));
			i++;
		}
	}
	return new UrlSegmentGroup(paths, {});
}
function createNewSegmentChildren(outlets) {
	const children = {};
	Object.entries(outlets).forEach(([outlet, commands]) => {
		if (typeof commands === "string") commands = [commands];
		if (commands !== null) children[outlet] = createNewSegmentGroup(new UrlSegmentGroup([], {}), 0, commands);
	});
	return children;
}
function stringify(params) {
	const res = {};
	Object.entries(params).forEach(([k, v]) => res[k] = `${v}`);
	return res;
}
function compare(path, params, segment) {
	return path == segment.path && shallowEqual(params, segment.parameters);
}
var OutletContext = class {
	get injector() {
		var _this$route$snapshot$, _this$route;
		return (_this$route$snapshot$ = (_this$route = this.route) === null || _this$route === void 0 ? void 0 : _this$route.snapshot._environmentInjector) !== null && _this$route$snapshot$ !== void 0 ? _this$route$snapshot$ : this.rootInjector;
	}
	constructor(rootInjector) {
		_defineProperty(this, "rootInjector", void 0);
		_defineProperty(this, "outlet", null);
		_defineProperty(this, "route", null);
		_defineProperty(this, "children", void 0);
		_defineProperty(this, "attachRef", null);
		this.rootInjector = rootInjector;
		this.children = new ChildrenOutletContexts(this.rootInjector);
	}
	resetChildren() {
		this.children = new ChildrenOutletContexts(this.rootInjector);
	}
};
var ChildrenOutletContexts = class {
	constructor(rootInjector) {
		_defineProperty(this, "rootInjector", void 0);
		_defineProperty(this, "contexts", /* @__PURE__ */ new Map());
		this.rootInjector = rootInjector;
	}
	onChildOutletCreated(childName, outlet) {
		const context = this.getOrCreateContext(childName);
		context.outlet = outlet;
		this.contexts.set(childName, context);
	}
	onChildOutletDestroyed(childName) {
		const context = this.getContext(childName);
		if (context) {
			context.outlet = null;
			context.attachRef = null;
		}
	}
	onOutletDeactivated() {
		const contexts = this.contexts;
		this.contexts = /* @__PURE__ */ new Map();
		return contexts;
	}
	onOutletReAttached(contexts) {
		this.contexts = contexts;
	}
	getOrCreateContext(childName) {
		let context = this.getContext(childName);
		if (!context) {
			context = new OutletContext(this.rootInjector);
			this.contexts.set(childName, context);
		}
		return context;
	}
	getContext(childName) {
		return this.contexts.get(childName) || null;
	}
};
_ChildrenOutletContexts = ChildrenOutletContexts;
_defineProperty(ChildrenOutletContexts, "ɵfac", function ChildrenOutletContexts_Factory(__ngFactoryType__) {
	return new (__ngFactoryType__ || _ChildrenOutletContexts)(ɵɵinject(EnvironmentInjector));
});
_defineProperty(ChildrenOutletContexts, "ɵprov", /*@__PURE__*/ ɵɵdefineInjectable({
	token: _ChildrenOutletContexts,
	factory: _ChildrenOutletContexts.ɵfac,
	providedIn: "root"
}));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(ChildrenOutletContexts, [{
		type: Injectable,
		args: [{ providedIn: "root" }]
	}], () => [{ type: EnvironmentInjector }], null);
})();
var Tree = class {
	constructor(root) {
		_defineProperty(this, "_root", void 0);
		this._root = root;
	}
	get root() {
		return this._root.value;
	}
	parent(t) {
		const p = this.pathFromRoot(t);
		return p.length > 1 ? p[p.length - 2] : null;
	}
	children(t) {
		const n = findNode(t, this._root);
		return n ? n.children.map((t) => t.value) : [];
	}
	firstChild(t) {
		const n = findNode(t, this._root);
		return n && n.children.length > 0 ? n.children[0].value : null;
	}
	siblings(t) {
		const p = findPath(t, this._root);
		if (p.length < 2) return [];
		return p[p.length - 2].children.map((c) => c.value).filter((cc) => cc !== t);
	}
	pathFromRoot(t) {
		return findPath(t, this._root).map((s) => s.value);
	}
};
function findNode(value, node) {
	if (value === node.value) return node;
	for (const child of node.children) {
		const node = findNode(value, child);
		if (node) return node;
	}
	return null;
}
function findPath(value, node) {
	if (value === node.value) return [node];
	for (const child of node.children) {
		const path = findPath(value, child);
		if (path.length) {
			path.unshift(node);
			return path;
		}
	}
	return [];
}
var TreeNode = class {
	constructor(value, children) {
		_defineProperty(this, "value", void 0);
		_defineProperty(this, "children", void 0);
		this.value = value;
		this.children = children;
	}
	toString() {
		return `TreeNode(${this.value})`;
	}
};
function nodeChildrenAsMap(node) {
	const map = {};
	if (node) node.children.forEach((child) => map[child.value.outlet] = child);
	return map;
}
var RouterState = class extends Tree {
	constructor(root, snapshot) {
		super(root);
		_defineProperty(this, "snapshot", void 0);
		this.snapshot = snapshot;
		setRouterState(this, root);
	}
	toString() {
		return this.snapshot.toString();
	}
};
function createEmptyState(rootComponent, injector) {
	const snapshot = createEmptyStateSnapshot(rootComponent, injector);
	const emptyUrl = new BehaviorSubject([new UrlSegment("", {})]);
	const emptyParams = new BehaviorSubject({});
	const emptyData = new BehaviorSubject({});
	const activated = new ActivatedRoute(emptyUrl, emptyParams, new BehaviorSubject({}), new BehaviorSubject(""), emptyData, PRIMARY_OUTLET, rootComponent, snapshot.root);
	activated.snapshot = snapshot.root;
	return new RouterState(new TreeNode(activated, []), snapshot);
}
function createEmptyStateSnapshot(rootComponent, injector) {
	return new RouterStateSnapshot("", new TreeNode(new ActivatedRouteSnapshot([], {}, {}, "", {}, PRIMARY_OUTLET, rootComponent, null, {}, injector), []));
}
var ActivatedRoute = class {
	constructor(urlSubject, paramsSubject, queryParamsSubject, fragmentSubject, dataSubject, outlet, component, futureSnapshot) {
		var _this$dataSubject$pip, _this$dataSubject;
		_defineProperty(this, "urlSubject", void 0);
		_defineProperty(this, "paramsSubject", void 0);
		_defineProperty(this, "queryParamsSubject", void 0);
		_defineProperty(this, "fragmentSubject", void 0);
		_defineProperty(this, "dataSubject", void 0);
		_defineProperty(this, "outlet", void 0);
		_defineProperty(this, "component", void 0);
		_defineProperty(this, "snapshot", void 0);
		_defineProperty(this, "_futureSnapshot", void 0);
		_defineProperty(this, "_routerState", void 0);
		_defineProperty(this, "_paramMap", void 0);
		_defineProperty(this, "_queryParamMap", void 0);
		_defineProperty(this, "title", void 0);
		_defineProperty(this, "url", void 0);
		_defineProperty(this, "params", void 0);
		_defineProperty(this, "queryParams", void 0);
		_defineProperty(this, "fragment", void 0);
		_defineProperty(this, "data", void 0);
		_defineProperty(this, "resources", void 0);
		_defineProperty(this, "_localInjector", void 0);
		_defineProperty(this, "pending", void 0);
		_defineProperty(this, "paramsSignal", void 0);
		_defineProperty(this, "queryParamsSignal", void 0);
		_defineProperty(this, "paramMapSignal", void 0);
		_defineProperty(this, "queryParamMapSignal", void 0);
		_defineProperty(this, "fragmentSignal", void 0);
		_defineProperty(this, "dataSignal", void 0);
		this.urlSubject = urlSubject;
		this.paramsSubject = paramsSubject;
		this.queryParamsSubject = queryParamsSubject;
		this.fragmentSubject = fragmentSubject;
		this.dataSubject = dataSubject;
		this.outlet = outlet;
		this.component = component;
		this._futureSnapshot = futureSnapshot;
		this.title = (_this$dataSubject$pip = (_this$dataSubject = this.dataSubject) === null || _this$dataSubject === void 0 ? void 0 : _this$dataSubject.pipe(map((d) => d[RouteTitleKey]))) !== null && _this$dataSubject$pip !== void 0 ? _this$dataSubject$pip : of(void 0);
		this.url = urlSubject;
		this.params = paramsSubject;
		this.queryParams = queryParamsSubject;
		this.fragment = fragmentSubject;
		this.data = dataSubject;
	}
	get routeConfig() {
		return this._futureSnapshot.routeConfig;
	}
	get root() {
		return this._routerState.root;
	}
	get parent() {
		return this._routerState.parent(this);
	}
	get firstChild() {
		return this._routerState.firstChild(this);
	}
	get children() {
		return this._routerState.children(this);
	}
	get pathFromRoot() {
		return this._routerState.pathFromRoot(this);
	}
	get paramMap() {
		var _this$_paramMap;
		(_this$_paramMap = this._paramMap) !== null && _this$_paramMap !== void 0 || (this._paramMap = this.params.pipe(map((p) => convertToParamMap(p))));
		return this._paramMap;
	}
	get queryParamMap() {
		var _this$_queryParamMap2;
		(_this$_queryParamMap2 = this._queryParamMap) !== null && _this$_queryParamMap2 !== void 0 || (this._queryParamMap = this.queryParams.pipe(map((p) => convertToParamMap(p))));
		return this._queryParamMap;
	}
	toString() {
		return this.snapshot ? this.snapshot.toString() : `Future(${this._futureSnapshot})`;
	}
	_setPending(snapshot) {
		var _this$pending;
		this._futureSnapshot = snapshot;
		(_this$pending = this.pending) === null || _this$pending === void 0 || _this$pending.set(true);
	}
};
var DEFAULT_PARAMS_INHERITANCE_STRATEGY = "always";
function getInherited(route, parent, paramsInheritanceStrategy) {
	var _parent$routeConfig;
	let inherited;
	const { routeConfig } = route;
	if (parent !== null && (paramsInheritanceStrategy === "always" || (routeConfig === null || routeConfig === void 0 ? void 0 : routeConfig.path) === "" || !parent.component && !((_parent$routeConfig = parent.routeConfig) === null || _parent$routeConfig === void 0 ? void 0 : _parent$routeConfig.loadComponent))) inherited = {
		params: _objectSpread2(_objectSpread2({}, parent.params), route.params),
		data: _objectSpread2(_objectSpread2({}, parent.data), route.data),
		resolve: _objectSpread2(_objectSpread2(_objectSpread2(_objectSpread2({}, route.data), parent.data), routeConfig === null || routeConfig === void 0 ? void 0 : routeConfig.data), route._resolvedData)
	};
	else {
		var _route$_resolvedData;
		inherited = {
			params: _objectSpread2({}, route.params),
			data: _objectSpread2({}, route.data),
			resolve: _objectSpread2(_objectSpread2({}, route.data), (_route$_resolvedData = route._resolvedData) !== null && _route$_resolvedData !== void 0 ? _route$_resolvedData : {})
		};
	}
	if (routeConfig && hasStaticTitle(routeConfig)) inherited.resolve[RouteTitleKey] = routeConfig.title;
	return inherited;
}
var ActivatedRouteSnapshot = class {
	get title() {
		var _this$data;
		return (_this$data = this.data) === null || _this$data === void 0 ? void 0 : _this$data[RouteTitleKey];
	}
	constructor(url, params, queryParams, fragment, data, outlet, component, routeConfig, resolve, environmentInjector) {
		_defineProperty(this, "url", void 0);
		_defineProperty(this, "params", void 0);
		_defineProperty(this, "queryParams", void 0);
		_defineProperty(this, "fragment", void 0);
		_defineProperty(this, "data", void 0);
		_defineProperty(this, "outlet", void 0);
		_defineProperty(this, "component", void 0);
		_defineProperty(this, "routeConfig", void 0);
		_defineProperty(this, "_resolve", void 0);
		_defineProperty(this, "_resolvedData", void 0);
		_defineProperty(this, "_routerState", void 0);
		_defineProperty(this, "_paramMap", void 0);
		_defineProperty(this, "_queryParamMap", void 0);
		_defineProperty(this, "_environmentInjector", void 0);
		_defineProperty(this, "resources", void 0);
		this.url = url;
		this.params = params;
		this.queryParams = queryParams;
		this.fragment = fragment;
		this.data = data;
		this.outlet = outlet;
		this.component = component;
		this.routeConfig = routeConfig;
		this._resolve = resolve;
		this._environmentInjector = environmentInjector;
	}
	get root() {
		return this._routerState.root;
	}
	get parent() {
		return this._routerState.parent(this);
	}
	get firstChild() {
		return this._routerState.firstChild(this);
	}
	get children() {
		return this._routerState.children(this);
	}
	get pathFromRoot() {
		return this._routerState.pathFromRoot(this);
	}
	get paramMap() {
		var _this$_paramMap2;
		(_this$_paramMap2 = this._paramMap) !== null && _this$_paramMap2 !== void 0 || (this._paramMap = convertToParamMap(this.params));
		return this._paramMap;
	}
	get queryParamMap() {
		var _this$_queryParamMap3;
		(_this$_queryParamMap3 = this._queryParamMap) !== null && _this$_queryParamMap3 !== void 0 || (this._queryParamMap = convertToParamMap(this.queryParams));
		return this._queryParamMap;
	}
	toString() {
		return `Route(url:'${this.url.map((segment) => segment.toString()).join("/")}', path:'${this.routeConfig ? this.routeConfig.path : ""}')`;
	}
};
var RouterStateSnapshot = class extends Tree {
	constructor(url, root) {
		super(root);
		_defineProperty(this, "url", void 0);
		this.url = url;
		setRouterState(this, root);
	}
	toString() {
		return serializeNode(this._root);
	}
};
function setRouterState(state, node) {
	node.value._routerState = state;
	node.children.forEach((c) => setRouterState(state, c));
}
function serializeNode(node) {
	const c = node.children.length > 0 ? ` { ${node.children.map(serializeNode).join(", ")} } ` : "";
	return `${node.value}${c}`;
}
function advanceActivatedRoute(route) {
	if (route.snapshot) {
		const currentSnapshot = route.snapshot;
		const nextSnapshot = route._futureSnapshot;
		route.snapshot = nextSnapshot;
		if (!shallowEqual(currentSnapshot.queryParams, nextSnapshot.queryParams)) route.queryParamsSubject.next(nextSnapshot.queryParams);
		if (currentSnapshot.fragment !== nextSnapshot.fragment) route.fragmentSubject.next(nextSnapshot.fragment);
		if (!shallowEqual(currentSnapshot.params, nextSnapshot.params)) route.paramsSubject.next(nextSnapshot.params);
		if (!shallowEqualArrays(currentSnapshot.url, nextSnapshot.url)) route.urlSubject.next(nextSnapshot.url);
		if (!shallowEqual(currentSnapshot.data, nextSnapshot.data)) route.dataSubject.next(nextSnapshot.data);
	} else {
		route.snapshot = route._futureSnapshot;
		route.dataSubject.next(route._futureSnapshot.data);
	}
}
function initializeActivatedRoute(route) {
	if (route.paramsSignal !== void 0) return;
	const writableRoute = route;
	const pendingSignal = signal(false, ...ngDevMode ? [{ debugName: "pendingSignal" }] : []);
	writableRoute.pending = pendingSignal;
	writableRoute.paramsSignal = computed(() => pendingSignal() || !route.snapshot ? route._futureSnapshot.params : route.snapshot.params, ...ngDevMode ? [{ debugName: "paramsSignal" }] : []);
	writableRoute.queryParamsSignal = computed(() => pendingSignal() || !route.snapshot ? route._futureSnapshot.queryParams : route.snapshot.queryParams, ...ngDevMode ? [{ debugName: "queryParamsSignal" }] : []);
	writableRoute.paramMapSignal = computed(() => convertToParamMap(route.paramsSignal()), ...ngDevMode ? [{ debugName: "paramMapSignal" }] : []);
	writableRoute.queryParamMapSignal = computed(() => convertToParamMap(route.queryParamsSignal()), ...ngDevMode ? [{ debugName: "queryParamMapSignal" }] : []);
	writableRoute.fragmentSignal = computed(() => pendingSignal() || !route.snapshot ? route._futureSnapshot.fragment : route.snapshot.fragment, ...ngDevMode ? [{ debugName: "fragmentSignal" }] : []);
	writableRoute.dataSignal = computed(() => pendingSignal() || !route.snapshot ? route._futureSnapshot.data : route.snapshot.data, ...ngDevMode ? [{ debugName: "dataSignal" }] : []);
	writableRoute._setPending = (snapshot) => {
		route._futureSnapshot = snapshot;
		pendingSignal.set(true);
	};
}
function equalParamsAndUrlSegments(a, b) {
	const equalUrlParams = shallowEqual(a.params, b.params) && equalSegments(a.url, b.url);
	const parentsMismatch = !a.parent !== !b.parent;
	return equalUrlParams && !parentsMismatch && (!a.parent || equalParamsAndUrlSegments(a.parent, b.parent));
}
function hasStaticTitle(config) {
	return typeof config.title === "string" || config.title === null;
}
var ROUTER_OUTLET_DATA = new InjectionToken(typeof ngDevMode !== "undefined" && ngDevMode ? "RouterOutlet data" : "");
var RouterOutlet = class {
	constructor() {
		_defineProperty(this, "activated", null);
		_defineProperty(this, "_activatedRoute", null);
		_defineProperty(this, "name", PRIMARY_OUTLET);
		_defineProperty(this, "activateEvents", new EventEmitter());
		_defineProperty(this, "deactivateEvents", new EventEmitter());
		_defineProperty(this, "attachEvents", new EventEmitter());
		_defineProperty(this, "detachEvents", new EventEmitter());
		_defineProperty(this, "routerOutletData", input(...ngDevMode ? [void 0, { debugName: "routerOutletData" }] : []));
		_defineProperty(this, "parentContexts", inject(ChildrenOutletContexts));
		_defineProperty(this, "location", inject(ViewContainerRef));
		_defineProperty(this, "changeDetector", inject(ChangeDetectorRef));
		_defineProperty(this, "inputBinder", inject(INPUT_BINDER, { optional: true }));
		_defineProperty(this, "supportsBindingToComponentInputs", true);
	}
	get activatedComponentRef() {
		return this.activated;
	}
	ngOnChanges(changes) {
		if (changes["name"]) {
			const { firstChange, previousValue } = changes["name"];
			if (firstChange) return;
			if (this.isTrackedInParentContexts(previousValue)) {
				this.deactivate();
				this.parentContexts.onChildOutletDestroyed(previousValue);
			}
			this.initializeOutletWithName();
		}
	}
	ngOnDestroy() {
		var _this$inputBinder;
		if (this.isTrackedInParentContexts(this.name)) this.parentContexts.onChildOutletDestroyed(this.name);
		(_this$inputBinder = this.inputBinder) === null || _this$inputBinder === void 0 || _this$inputBinder.unsubscribeFromRouteData(this);
	}
	isTrackedInParentContexts(outletName) {
		var _this$parentContexts$;
		return ((_this$parentContexts$ = this.parentContexts.getContext(outletName)) === null || _this$parentContexts$ === void 0 ? void 0 : _this$parentContexts$.outlet) === this;
	}
	ngOnInit() {
		this.initializeOutletWithName();
	}
	initializeOutletWithName() {
		this.parentContexts.onChildOutletCreated(this.name, this);
		if (this.activated) return;
		const context = this.parentContexts.getContext(this.name);
		if (context === null || context === void 0 ? void 0 : context.route) {
			if (context.attachRef) this.attach(context.attachRef, context.route);
			else this.activateWith(context.route, context.injector);
		}
	}
	get isActivated() {
		return !!this.activated;
	}
	get component() {
		if (!this.activated) throw new RuntimeError(4012, (typeof ngDevMode === "undefined" || ngDevMode) && "Outlet is not activated");
		return this.activated.instance;
	}
	get activatedRoute() {
		if (!this.activated) throw new RuntimeError(4012, (typeof ngDevMode === "undefined" || ngDevMode) && "Outlet is not activated");
		return this._activatedRoute;
	}
	get activatedRouteData() {
		if (this._activatedRoute) return this._activatedRoute.snapshot.data;
		return {};
	}
	detach() {
		if (!this.activated) throw new RuntimeError(4012, (typeof ngDevMode === "undefined" || ngDevMode) && "Outlet is not activated");
		this.location.detach();
		const cmp = this.activated;
		this.activated = null;
		this._activatedRoute = null;
		this.detachEvents.emit(cmp.instance);
		return cmp;
	}
	attach(ref, activatedRoute) {
		var _this$inputBinder2;
		this.activated = ref;
		this._activatedRoute = activatedRoute;
		this.location.insert(ref.hostView);
		(_this$inputBinder2 = this.inputBinder) === null || _this$inputBinder2 === void 0 || _this$inputBinder2.bindActivatedRouteToOutletComponent(this, this.location.injector);
		this.attachEvents.emit(ref.instance);
	}
	deactivate() {
		if (this.activated) {
			const c = this.component;
			this.activated.destroy();
			this.activated = null;
			this._activatedRoute = null;
			this.deactivateEvents.emit(c);
		}
	}
	activateWith(activatedRoute, environmentInjector) {
		var _this$inputBinder3;
		if (this.isActivated) throw new RuntimeError(4013, (typeof ngDevMode === "undefined" || ngDevMode) && "Cannot activate an already activated outlet");
		this._activatedRoute = activatedRoute;
		const location = this.location;
		const component = activatedRoute.snapshot.component;
		const childContexts = this.parentContexts.getOrCreateContext(this.name).children;
		const injector = new OutletInjector(activatedRoute, childContexts, location.injector, this.routerOutletData);
		this.activated = location.createComponent(component, {
			index: location.length,
			injector,
			environmentInjector
		});
		this.changeDetector.markForCheck();
		(_this$inputBinder3 = this.inputBinder) === null || _this$inputBinder3 === void 0 || _this$inputBinder3.bindActivatedRouteToOutletComponent(this, this.location.injector);
		this.activateEvents.emit(this.activated.instance);
	}
};
_RouterOutlet = RouterOutlet;
_defineProperty(RouterOutlet, "ɵfac", function RouterOutlet_Factory(__ngFactoryType__) {
	return new (__ngFactoryType__ || _RouterOutlet)();
});
_defineProperty(RouterOutlet, "ɵdir", /*@__PURE__*/ ɵɵdefineDirective({
	type: _RouterOutlet,
	selectors: [["router-outlet"]],
	inputs: {
		name: "name",
		routerOutletData: [1, "routerOutletData"]
	},
	outputs: {
		activateEvents: "activate",
		deactivateEvents: "deactivate",
		attachEvents: "attach",
		detachEvents: "detach"
	},
	exportAs: ["outlet"],
	features: [ɵɵNgOnChangesFeature]
}));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(RouterOutlet, [{
		type: Directive,
		args: [{
			selector: "router-outlet",
			exportAs: "outlet"
		}]
	}], null, {
		name: [{ type: Input }],
		activateEvents: [{
			type: Output,
			args: ["activate"]
		}],
		deactivateEvents: [{
			type: Output,
			args: ["deactivate"]
		}],
		attachEvents: [{
			type: Output,
			args: ["attach"]
		}],
		detachEvents: [{
			type: Output,
			args: ["detach"]
		}],
		routerOutletData: [{
			type: Input,
			args: [{
				isSignal: true,
				alias: "routerOutletData",
				required: false
			}]
		}]
	});
})();
var OutletInjector = class {
	constructor(route, childContexts, parent, outletData) {
		_defineProperty(this, "route", void 0);
		_defineProperty(this, "childContexts", void 0);
		_defineProperty(this, "parent", void 0);
		_defineProperty(this, "outletData", void 0);
		this.route = route;
		this.childContexts = childContexts;
		this.parent = parent;
		this.outletData = outletData;
	}
	get(token, notFoundValue) {
		if (token === ActivatedRoute) return this.route;
		if (token === ChildrenOutletContexts) return this.childContexts;
		if (token === ROUTER_OUTLET_DATA) return this.outletData;
		return this.parent.get(token, notFoundValue);
	}
};
var INPUT_BINDER = new InjectionToken(typeof ngDevMode !== "undefined" && ngDevMode ? "Router Input Binder" : "");
var RoutedComponentInputBinder = class {
	constructor(options, feature = null) {
		var _this$options, _this$options$queryPa;
		_defineProperty(this, "options", void 0);
		_defineProperty(this, "feature", void 0);
		_defineProperty(this, "outletDataSubscriptions", /* @__PURE__ */ new Map());
		_defineProperty(this, "outletSeenKeys", /* @__PURE__ */ new Map());
		_defineProperty(this, "outletEffects", /* @__PURE__ */ new Map());
		this.options = options;
		this.feature = feature;
		(_this$options$queryPa = (_this$options = this.options).queryParams) !== null && _this$options$queryPa !== void 0 || (_this$options.queryParams = true);
	}
	bindActivatedRouteToOutletComponent(outlet, injector) {
		this.unsubscribeFromRouteData(outlet);
		this.subscribeToRouteData(outlet, injector);
	}
	unsubscribeFromRouteData(outlet) {
		var _this$outletDataSubsc, _this$outletEffects$g;
		(_this$outletDataSubsc = this.outletDataSubscriptions.get(outlet)) === null || _this$outletDataSubsc === void 0 || _this$outletDataSubsc.unsubscribe();
		this.outletDataSubscriptions.delete(outlet);
		this.outletSeenKeys.delete(outlet);
		(_this$outletEffects$g = this.outletEffects.get(outlet)) === null || _this$outletEffects$g === void 0 || _this$outletEffects$g.forEach((effect) => effect.destroy());
		this.outletEffects.delete(outlet);
	}
	subscribeToRouteData(outlet, injector) {
		var _this$feature;
		const { activatedRoute } = outlet;
		const effects = [];
		let keysBoundToBlockingResources = [];
		if (((_this$feature = this.feature) === null || _this$feature === void 0 ? void 0 : _this$feature.createResourceOutletBindingEffects) && outlet.activatedComponentRef) {
			const { handledKeys, createdEffects } = this.feature.createResourceOutletBindingEffects(outlet.activatedComponentRef, activatedRoute);
			effects.push(...createdEffects);
			keysBoundToBlockingResources = handledKeys;
		}
		if (effects.length > 0) this.outletEffects.set(outlet, effects);
		const dataSubscription = combineLatest([
			this.options.queryParams ? activatedRoute.queryParams : of({}),
			activatedRoute.params,
			activatedRoute.data
		]).pipe(switchMap(([queryParams, params, data], index) => {
			data = _objectSpread2(_objectSpread2(_objectSpread2(_objectSpread2({}, queryParams), params), data), activatedRoute.resources);
			if (index === 0) return of(data);
			return Promise.resolve(data);
		})).subscribe((data) => {
			var _this$options$unmatch;
			if (!outlet.isActivated || !outlet.activatedComponentRef || outlet.activatedRoute !== activatedRoute || activatedRoute.component === null) {
				this.unsubscribeFromRouteData(outlet);
				return;
			}
			const currentMirror = reflectComponentType(activatedRoute.component);
			if (!currentMirror) {
				this.unsubscribeFromRouteData(outlet);
				return;
			}
			let seenKeys = this.outletSeenKeys.get(outlet);
			if (!seenKeys) {
				seenKeys = /* @__PURE__ */ new Set();
				this.outletSeenKeys.set(outlet, seenKeys);
			}
			for (const key of Object.keys(data)) seenKeys.add(key);
			const behavior = (_this$options$unmatch = this.options.unmatchedInputBehavior) !== null && _this$options$unmatch !== void 0 ? _this$options$unmatch : "alwaysUndefined";
			for (const { templateName } of currentMirror.inputs) {
				if (keysBoundToBlockingResources.includes(templateName)) continue;
				const value = data[templateName];
				if (value !== void 0 || behavior === "alwaysUndefined" || seenKeys.has(templateName)) outlet.activatedComponentRef.setInput(templateName, value);
			}
		});
		this.outletDataSubscriptions.set(outlet, dataSubscription);
	}
};
_RoutedComponentInputBinder = RoutedComponentInputBinder;
_defineProperty(RoutedComponentInputBinder, "ɵfac", function RoutedComponentInputBinder_Factory(__ngFactoryType__) {
	ɵɵinvalidFactory();
});
_defineProperty(RoutedComponentInputBinder, "ɵprov", /*@__PURE__*/ ɵɵdefineInjectable({
	token: _RoutedComponentInputBinder,
	factory: _RoutedComponentInputBinder.ɵfac
}));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(RoutedComponentInputBinder, [{ type: Injectable }], () => [{ type: void 0 }, { type: void 0 }], null);
})();
var ɵEmptyOutletComponent = class {};
_ɵEmptyOutletComponent = ɵEmptyOutletComponent;
_defineProperty(ɵEmptyOutletComponent, "ɵfac", function ɵEmptyOutletComponent_Factory(__ngFactoryType__) {
	return new (__ngFactoryType__ || _ɵEmptyOutletComponent)();
});
_defineProperty(ɵEmptyOutletComponent, "ɵcmp", /*@__PURE__*/ ɵɵdefineComponent({
	type: _ɵEmptyOutletComponent,
	selectors: [["ng-component"]],
	exportAs: ["emptyRouterOutlet"],
	decls: 1,
	vars: 0,
	template: function _EmptyOutletComponent_Template(rf, ctx) {
		if (rf & 1) ɵɵelement(0, "router-outlet");
	},
	dependencies: [RouterOutlet],
	encapsulation: 2,
	changeDetection: 1
}));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(ɵEmptyOutletComponent, [{
		type: Component,
		args: [{
			template: `<router-outlet />`,
			imports: [RouterOutlet],
			exportAs: "emptyRouterOutlet",
			changeDetection: ChangeDetectionStrategy.Eager
		}]
	}], null, null);
})();
function standardizeConfig(r) {
	const children = r.children && r.children.map(standardizeConfig);
	const c = children ? _objectSpread2(_objectSpread2({}, r), {}, { children }) : _objectSpread2({}, r);
	if (!c.component && !c.loadComponent && (children || c.loadChildren) && c.outlet && c.outlet !== "primary") c.component = ɵEmptyOutletComponent;
	return c;
}
var IMPERATIVE_NAVIGATION = "imperative";
var EventType;
(function(EventType) {
	EventType[EventType["NavigationStart"] = 0] = "NavigationStart";
	EventType[EventType["NavigationEnd"] = 1] = "NavigationEnd";
	EventType[EventType["NavigationCancel"] = 2] = "NavigationCancel";
	EventType[EventType["NavigationError"] = 3] = "NavigationError";
	EventType[EventType["RoutesRecognized"] = 4] = "RoutesRecognized";
	EventType[EventType["ResolveStart"] = 5] = "ResolveStart";
	EventType[EventType["ResolveEnd"] = 6] = "ResolveEnd";
	EventType[EventType["GuardsCheckStart"] = 7] = "GuardsCheckStart";
	EventType[EventType["GuardsCheckEnd"] = 8] = "GuardsCheckEnd";
	EventType[EventType["RouteConfigLoadStart"] = 9] = "RouteConfigLoadStart";
	EventType[EventType["RouteConfigLoadEnd"] = 10] = "RouteConfigLoadEnd";
	EventType[EventType["ChildActivationStart"] = 11] = "ChildActivationStart";
	EventType[EventType["ChildActivationEnd"] = 12] = "ChildActivationEnd";
	EventType[EventType["ActivationStart"] = 13] = "ActivationStart";
	EventType[EventType["ActivationEnd"] = 14] = "ActivationEnd";
	EventType[EventType["Scroll"] = 15] = "Scroll";
	EventType[EventType["NavigationSkipped"] = 16] = "NavigationSkipped";
})(EventType || (EventType = {}));
var RouterEvent = class {
	constructor(id, url) {
		_defineProperty(this, "id", void 0);
		_defineProperty(this, "url", void 0);
		this.id = id;
		this.url = url;
	}
};
var NavigationStart = class extends RouterEvent {
	constructor(id, url, navigationTrigger = "imperative", restoredState = null) {
		super(id, url);
		_defineProperty(this, "type", EventType.NavigationStart);
		_defineProperty(this, "navigationTrigger", void 0);
		_defineProperty(this, "restoredState", void 0);
		this.navigationTrigger = navigationTrigger;
		this.restoredState = restoredState;
	}
	toString() {
		return `NavigationStart(id: ${this.id}, url: '${this.url}')`;
	}
};
var NavigationEnd = class extends RouterEvent {
	constructor(id, url, urlAfterRedirects) {
		super(id, url);
		_defineProperty(this, "urlAfterRedirects", void 0);
		_defineProperty(this, "type", EventType.NavigationEnd);
		this.urlAfterRedirects = urlAfterRedirects;
	}
	toString() {
		return `NavigationEnd(id: ${this.id}, url: '${this.url}', urlAfterRedirects: '${this.urlAfterRedirects}')`;
	}
};
var NavigationCancellationCode;
(function(NavigationCancellationCode) {
	NavigationCancellationCode[NavigationCancellationCode["Redirect"] = 0] = "Redirect";
	NavigationCancellationCode[NavigationCancellationCode["SupersededByNewNavigation"] = 1] = "SupersededByNewNavigation";
	NavigationCancellationCode[NavigationCancellationCode["NoDataFromResolver"] = 2] = "NoDataFromResolver";
	NavigationCancellationCode[NavigationCancellationCode["GuardRejected"] = 3] = "GuardRejected";
	NavigationCancellationCode[NavigationCancellationCode["Aborted"] = 4] = "Aborted";
})(NavigationCancellationCode || (NavigationCancellationCode = {}));
var NavigationSkippedCode;
(function(NavigationSkippedCode) {
	NavigationSkippedCode[NavigationSkippedCode["IgnoredSameUrlNavigation"] = 0] = "IgnoredSameUrlNavigation";
	NavigationSkippedCode[NavigationSkippedCode["IgnoredByUrlHandlingStrategy"] = 1] = "IgnoredByUrlHandlingStrategy";
})(NavigationSkippedCode || (NavigationSkippedCode = {}));
var NavigationCancel = class extends RouterEvent {
	constructor(id, url, reason, code) {
		super(id, url);
		_defineProperty(this, "reason", void 0);
		_defineProperty(this, "code", void 0);
		_defineProperty(this, "type", EventType.NavigationCancel);
		this.reason = reason;
		this.code = code;
	}
	toString() {
		return `NavigationCancel(id: ${this.id}, url: '${this.url}')`;
	}
};
function isRedirectingEvent(event) {
	return event instanceof NavigationCancel && (event.code === NavigationCancellationCode.Redirect || event.code === NavigationCancellationCode.SupersededByNewNavigation);
}
var NavigationSkipped = class extends RouterEvent {
	constructor(id, url, reason, code) {
		super(id, url);
		_defineProperty(this, "reason", void 0);
		_defineProperty(this, "code", void 0);
		_defineProperty(this, "type", EventType.NavigationSkipped);
		this.reason = reason;
		this.code = code;
	}
};
var NavigationError = class extends RouterEvent {
	constructor(id, url, error, target) {
		super(id, url);
		_defineProperty(this, "error", void 0);
		_defineProperty(this, "target", void 0);
		_defineProperty(this, "type", EventType.NavigationError);
		this.error = error;
		this.target = target;
	}
	toString() {
		return `NavigationError(id: ${this.id}, url: '${this.url}', error: ${this.error})`;
	}
};
var RoutesRecognized = class extends RouterEvent {
	constructor(id, url, urlAfterRedirects, state) {
		super(id, url);
		_defineProperty(this, "urlAfterRedirects", void 0);
		_defineProperty(this, "state", void 0);
		_defineProperty(this, "type", EventType.RoutesRecognized);
		this.urlAfterRedirects = urlAfterRedirects;
		this.state = state;
	}
	toString() {
		return `RoutesRecognized(id: ${this.id}, url: '${this.url}', urlAfterRedirects: '${this.urlAfterRedirects}', state: ${this.state})`;
	}
};
var GuardsCheckStart = class extends RouterEvent {
	constructor(id, url, urlAfterRedirects, state) {
		super(id, url);
		_defineProperty(this, "urlAfterRedirects", void 0);
		_defineProperty(this, "state", void 0);
		_defineProperty(this, "type", EventType.GuardsCheckStart);
		this.urlAfterRedirects = urlAfterRedirects;
		this.state = state;
	}
	toString() {
		return `GuardsCheckStart(id: ${this.id}, url: '${this.url}', urlAfterRedirects: '${this.urlAfterRedirects}', state: ${this.state})`;
	}
};
var GuardsCheckEnd = class extends RouterEvent {
	constructor(id, url, urlAfterRedirects, state, shouldActivate) {
		super(id, url);
		_defineProperty(this, "urlAfterRedirects", void 0);
		_defineProperty(this, "state", void 0);
		_defineProperty(this, "shouldActivate", void 0);
		_defineProperty(this, "type", EventType.GuardsCheckEnd);
		this.urlAfterRedirects = urlAfterRedirects;
		this.state = state;
		this.shouldActivate = shouldActivate;
	}
	toString() {
		return `GuardsCheckEnd(id: ${this.id}, url: '${this.url}', urlAfterRedirects: '${this.urlAfterRedirects}', state: ${this.state}, shouldActivate: ${this.shouldActivate})`;
	}
};
var ResolveStart = class extends RouterEvent {
	constructor(id, url, urlAfterRedirects, state) {
		super(id, url);
		_defineProperty(this, "urlAfterRedirects", void 0);
		_defineProperty(this, "state", void 0);
		_defineProperty(this, "type", EventType.ResolveStart);
		this.urlAfterRedirects = urlAfterRedirects;
		this.state = state;
	}
	toString() {
		return `ResolveStart(id: ${this.id}, url: '${this.url}', urlAfterRedirects: '${this.urlAfterRedirects}', state: ${this.state})`;
	}
};
var ResolveEnd = class extends RouterEvent {
	constructor(id, url, urlAfterRedirects, state) {
		super(id, url);
		_defineProperty(this, "urlAfterRedirects", void 0);
		_defineProperty(this, "state", void 0);
		_defineProperty(this, "type", EventType.ResolveEnd);
		this.urlAfterRedirects = urlAfterRedirects;
		this.state = state;
	}
	toString() {
		return `ResolveEnd(id: ${this.id}, url: '${this.url}', urlAfterRedirects: '${this.urlAfterRedirects}', state: ${this.state})`;
	}
};
var RouteConfigLoadStart = class {
	constructor(route) {
		_defineProperty(this, "route", void 0);
		_defineProperty(this, "type", EventType.RouteConfigLoadStart);
		this.route = route;
	}
	toString() {
		return `RouteConfigLoadStart(path: ${this.route.path})`;
	}
};
var RouteConfigLoadEnd = class {
	constructor(route) {
		_defineProperty(this, "route", void 0);
		_defineProperty(this, "type", EventType.RouteConfigLoadEnd);
		this.route = route;
	}
	toString() {
		return `RouteConfigLoadEnd(path: ${this.route.path})`;
	}
};
var ChildActivationStart = class {
	constructor(snapshot) {
		_defineProperty(this, "snapshot", void 0);
		_defineProperty(this, "type", EventType.ChildActivationStart);
		this.snapshot = snapshot;
	}
	toString() {
		return `ChildActivationStart(path: '${this.snapshot.routeConfig && this.snapshot.routeConfig.path || ""}')`;
	}
};
var ChildActivationEnd = class {
	constructor(snapshot) {
		_defineProperty(this, "snapshot", void 0);
		_defineProperty(this, "type", EventType.ChildActivationEnd);
		this.snapshot = snapshot;
	}
	toString() {
		return `ChildActivationEnd(path: '${this.snapshot.routeConfig && this.snapshot.routeConfig.path || ""}')`;
	}
};
var ActivationStart = class {
	constructor(snapshot) {
		_defineProperty(this, "snapshot", void 0);
		_defineProperty(this, "type", EventType.ActivationStart);
		this.snapshot = snapshot;
	}
	toString() {
		return `ActivationStart(path: '${this.snapshot.routeConfig && this.snapshot.routeConfig.path || ""}')`;
	}
};
var ActivationEnd = class {
	constructor(snapshot) {
		_defineProperty(this, "snapshot", void 0);
		_defineProperty(this, "type", EventType.ActivationEnd);
		this.snapshot = snapshot;
	}
	toString() {
		return `ActivationEnd(path: '${this.snapshot.routeConfig && this.snapshot.routeConfig.path || ""}')`;
	}
};
var Scroll = class {
	constructor(routerEvent, position, anchor, scrollBehavior) {
		_defineProperty(this, "routerEvent", void 0);
		_defineProperty(this, "position", void 0);
		_defineProperty(this, "anchor", void 0);
		_defineProperty(this, "scrollBehavior", void 0);
		_defineProperty(this, "type", EventType.Scroll);
		this.routerEvent = routerEvent;
		this.position = position;
		this.anchor = anchor;
		this.scrollBehavior = scrollBehavior;
	}
	toString() {
		const pos = this.position ? `${this.position[0]}, ${this.position[1]}` : null;
		return `Scroll(anchor: '${this.anchor}', position: '${pos}')`;
	}
};
var BeforeActivateRoutes = class {};
var BeforeRoutesRecognized = class {};
var RedirectRequest = class {
	constructor(url, navigationBehaviorOptions) {
		_defineProperty(this, "url", void 0);
		_defineProperty(this, "navigationBehaviorOptions", void 0);
		this.url = url;
		this.navigationBehaviorOptions = navigationBehaviorOptions;
	}
};
function isPublicRouterEvent(e) {
	return !(e instanceof BeforeActivateRoutes) && !(e instanceof RedirectRequest) && !(e instanceof BeforeRoutesRecognized);
}
function stringifyEvent(routerEvent) {
	switch (routerEvent.type) {
		case EventType.ActivationEnd:
			var _routerEvent$snapshot;
			return `ActivationEnd(path: '${((_routerEvent$snapshot = routerEvent.snapshot.routeConfig) === null || _routerEvent$snapshot === void 0 ? void 0 : _routerEvent$snapshot.path) || ""}')`;
		case EventType.ActivationStart:
			var _routerEvent$snapshot2;
			return `ActivationStart(path: '${((_routerEvent$snapshot2 = routerEvent.snapshot.routeConfig) === null || _routerEvent$snapshot2 === void 0 ? void 0 : _routerEvent$snapshot2.path) || ""}')`;
		case EventType.ChildActivationEnd:
			var _routerEvent$snapshot3;
			return `ChildActivationEnd(path: '${((_routerEvent$snapshot3 = routerEvent.snapshot.routeConfig) === null || _routerEvent$snapshot3 === void 0 ? void 0 : _routerEvent$snapshot3.path) || ""}')`;
		case EventType.ChildActivationStart:
			var _routerEvent$snapshot4;
			return `ChildActivationStart(path: '${((_routerEvent$snapshot4 = routerEvent.snapshot.routeConfig) === null || _routerEvent$snapshot4 === void 0 ? void 0 : _routerEvent$snapshot4.path) || ""}')`;
		case EventType.GuardsCheckEnd: return `GuardsCheckEnd(id: ${routerEvent.id}, url: '${routerEvent.url}', urlAfterRedirects: '${routerEvent.urlAfterRedirects}', state: ${routerEvent.state}, shouldActivate: ${routerEvent.shouldActivate})`;
		case EventType.GuardsCheckStart: return `GuardsCheckStart(id: ${routerEvent.id}, url: '${routerEvent.url}', urlAfterRedirects: '${routerEvent.urlAfterRedirects}', state: ${routerEvent.state})`;
		case EventType.NavigationCancel: return `NavigationCancel(id: ${routerEvent.id}, url: '${routerEvent.url}')`;
		case EventType.NavigationSkipped: return `NavigationSkipped(id: ${routerEvent.id}, url: '${routerEvent.url}')`;
		case EventType.NavigationEnd: return `NavigationEnd(id: ${routerEvent.id}, url: '${routerEvent.url}', urlAfterRedirects: '${routerEvent.urlAfterRedirects}')`;
		case EventType.NavigationError: return `NavigationError(id: ${routerEvent.id}, url: '${routerEvent.url}', error: ${routerEvent.error})`;
		case EventType.NavigationStart: return `NavigationStart(id: ${routerEvent.id}, url: '${routerEvent.url}')`;
		case EventType.ResolveEnd: return `ResolveEnd(id: ${routerEvent.id}, url: '${routerEvent.url}', urlAfterRedirects: '${routerEvent.urlAfterRedirects}', state: ${routerEvent.state})`;
		case EventType.ResolveStart: return `ResolveStart(id: ${routerEvent.id}, url: '${routerEvent.url}', urlAfterRedirects: '${routerEvent.urlAfterRedirects}', state: ${routerEvent.state})`;
		case EventType.RouteConfigLoadEnd: return `RouteConfigLoadEnd(path: ${routerEvent.route.path})`;
		case EventType.RouteConfigLoadStart: return `RouteConfigLoadStart(path: ${routerEvent.route.path})`;
		case EventType.RoutesRecognized: return `RoutesRecognized(id: ${routerEvent.id}, url: '${routerEvent.url}', urlAfterRedirects: '${routerEvent.urlAfterRedirects}', state: ${routerEvent.state})`;
		case EventType.Scroll:
			const pos = routerEvent.position ? `${routerEvent.position[0]}, ${routerEvent.position[1]}` : null;
			return `Scroll(anchor: '${routerEvent.anchor}', position: '${pos}')`;
	}
}
function createRouterState(routeReuseStrategy, curr, prevState) {
	const newlyCreatedRoutes = /* @__PURE__ */ new Set();
	return {
		newlyCreatedRoutes,
		state: new RouterState(createNode(routeReuseStrategy, curr._root, prevState ? prevState._root : void 0, newlyCreatedRoutes), curr)
	};
}
function createNode(routeReuseStrategy, curr, prevState, newlyCreatedRoutes) {
	if (prevState && routeReuseStrategy.shouldReuseRoute(curr.value, prevState.value.snapshot)) {
		const value = prevState.value;
		value._setPending(curr.value);
		return new TreeNode(value, createOrReuseChildren(routeReuseStrategy, curr, prevState, newlyCreatedRoutes));
	} else {
		if (routeReuseStrategy.shouldAttach(curr.value)) {
			const detachedRouteHandle = routeReuseStrategy.retrieve(curr.value);
			if (detachedRouteHandle !== null) {
				const tree = detachedRouteHandle.route;
				tree.value._setPending(curr.value);
				tree.children = curr.children.map((c) => createNode(routeReuseStrategy, c, void 0, newlyCreatedRoutes));
				return tree;
			}
		}
		const value = createActivatedRoute(curr.value);
		value._setPending(curr.value);
		newlyCreatedRoutes.add(value);
		return new TreeNode(value, curr.children.map((c) => createNode(routeReuseStrategy, c, void 0, newlyCreatedRoutes)));
	}
}
function createOrReuseChildren(routeReuseStrategy, curr, prevState, newlyCreatedRoutes) {
	return curr.children.map((child) => {
		for (const p of prevState.children) if (routeReuseStrategy.shouldReuseRoute(child.value, p.value.snapshot)) return createNode(routeReuseStrategy, child, p, newlyCreatedRoutes);
		return createNode(routeReuseStrategy, child, void 0, newlyCreatedRoutes);
	});
}
function createActivatedRoute(c) {
	return new ActivatedRoute(new BehaviorSubject(c.url), new BehaviorSubject(c.params), new BehaviorSubject(c.queryParams), new BehaviorSubject(c.fragment), new BehaviorSubject(c.data), c.outlet, c.component, c);
}
var RedirectCommand = class RedirectCommand extends Error {
	constructor(redirectTo, navigationBehaviorOptions) {
		super();
		_defineProperty(this, "redirectTo", void 0);
		_defineProperty(this, "navigationBehaviorOptions", void 0);
		this.redirectTo = redirectTo;
		this.navigationBehaviorOptions = navigationBehaviorOptions;
		Object.setPrototypeOf(this, RedirectCommand.prototype);
	}
};
var NAVIGATION_CANCELING_ERROR = "ngNavigationCancelingError";
function redirectingNavigationError(urlSerializer, redirect) {
	const { redirectTo, navigationBehaviorOptions } = isUrlTree(redirect) ? {
		redirectTo: redirect,
		navigationBehaviorOptions: void 0
	} : redirect;
	const error = navigationCancelingError(ngDevMode && `Redirecting to "${urlSerializer.serialize(redirectTo)}"`, NavigationCancellationCode.Redirect);
	error.url = redirectTo;
	error.navigationBehaviorOptions = navigationBehaviorOptions;
	return error;
}
function navigationCancelingError(message, code) {
	const error = /* @__PURE__ */ new Error(`NavigationCancelingError: ${message || ""}`);
	error[NAVIGATION_CANCELING_ERROR] = true;
	error.cancellationCode = code;
	return error;
}
function isRedirectingNavigationCancelingError(error) {
	return isNavigationCancelingError(error) && isUrlTree(error.url);
}
function isNavigationCancelingError(error) {
	return !!error && error[NAVIGATION_CANCELING_ERROR];
}
var warnedAboutUnsupportedInputBinding = false;
var ActivateRoutes = class {
	constructor(routeReuseStrategy, futureState, currState, forwardEvent, inputBindingEnabled) {
		_defineProperty(this, "routeReuseStrategy", void 0);
		_defineProperty(this, "futureState", void 0);
		_defineProperty(this, "currState", void 0);
		_defineProperty(this, "forwardEvent", void 0);
		_defineProperty(this, "inputBindingEnabled", void 0);
		this.routeReuseStrategy = routeReuseStrategy;
		this.futureState = futureState;
		this.currState = currState;
		this.forwardEvent = forwardEvent;
		this.inputBindingEnabled = inputBindingEnabled;
	}
	activate(parentContexts) {
		const futureRoot = this.futureState._root;
		const currRoot = this.currState ? this.currState._root : null;
		this.deactivateChildRoutes(futureRoot, currRoot, parentContexts);
		advanceActivatedRoute(this.futureState.root);
		this.activateChildRoutes(futureRoot, currRoot, parentContexts);
	}
	deactivateChildRoutes(futureNode, currNode, contexts) {
		const children = nodeChildrenAsMap(currNode);
		futureNode.children.forEach((futureChild) => {
			const childOutletName = futureChild.value.outlet;
			this.deactivateRoutes(futureChild, children[childOutletName], contexts);
			delete children[childOutletName];
		});
		Object.values(children).forEach((v) => {
			this.deactivateRouteAndItsChildren(v, contexts);
		});
	}
	deactivateRoutes(futureNode, currNode, parentContext) {
		const future = futureNode.value;
		const curr = currNode ? currNode.value : null;
		if (future === curr) {
			if (future.component) {
				const context = parentContext.getContext(future.outlet);
				if (context) this.deactivateChildRoutes(futureNode, currNode, context.children);
			} else this.deactivateChildRoutes(futureNode, currNode, parentContext);
		} else if (curr) this.deactivateRouteAndItsChildren(currNode, parentContext);
	}
	deactivateRouteAndItsChildren(route, parentContexts) {
		if (route.value.component && this.routeReuseStrategy.shouldDetach(route.value.snapshot)) this.detachAndStoreRouteSubtree(route, parentContexts);
		else this.deactivateRouteAndOutlet(route, parentContexts);
	}
	detachAndStoreRouteSubtree(route, parentContexts) {
		const context = parentContexts.getContext(route.value.outlet);
		const contexts = context && route.value.component ? context.children : parentContexts;
		const children = nodeChildrenAsMap(route);
		for (const treeNode of Object.values(children)) this.deactivateRouteAndItsChildren(treeNode, contexts);
		if (context && context.outlet) {
			const componentRef = context.outlet.detach();
			const contexts = context.children.contexts;
			context.resetChildren();
			this.routeReuseStrategy.store(route.value.snapshot, {
				componentRef,
				route,
				contexts
			});
		}
	}
	deactivateRouteAndOutlet(route, parentContexts) {
		var _route$value$_localIn;
		const context = parentContexts.getContext(route.value.outlet);
		const contexts = context && route.value.component ? context.children : parentContexts;
		const children = nodeChildrenAsMap(route);
		for (const treeNode of Object.values(children)) this.deactivateRouteAndItsChildren(treeNode, contexts);
		if (context) {
			if (context.outlet) {
				context.outlet.deactivate();
				context.children.onOutletDeactivated();
			}
			context.attachRef = null;
			context.route = null;
		}
		(_route$value$_localIn = route.value._localInjector) === null || _route$value$_localIn === void 0 || _route$value$_localIn.destroy();
	}
	activateChildRoutes(futureNode, currNode, contexts) {
		const children = nodeChildrenAsMap(currNode);
		futureNode.children.forEach((c) => {
			this.activateRoutes(c, children[c.value.outlet], contexts);
			this.forwardEvent(new ActivationEnd(c.value.snapshot));
		});
		if (futureNode.children.length) this.forwardEvent(new ChildActivationEnd(futureNode.value.snapshot));
	}
	activateRoutes(futureNode, currNode, parentContexts) {
		const future = futureNode.value;
		const curr = currNode ? currNode.value : null;
		advanceActivatedRoute(future);
		if (future === curr) {
			if (future.component) {
				const context = parentContexts.getOrCreateContext(future.outlet);
				this.activateChildRoutes(futureNode, currNode, context.children);
			} else this.activateChildRoutes(futureNode, currNode, parentContexts);
		} else if (future.component) {
			const context = parentContexts.getOrCreateContext(future.outlet);
			if (this.routeReuseStrategy.shouldAttach(future.snapshot)) {
				const stored = this.routeReuseStrategy.retrieve(future.snapshot);
				this.routeReuseStrategy.store(future.snapshot, null);
				context.children.onOutletReAttached(stored.contexts);
				context.attachRef = stored.componentRef;
				context.route = stored.route.value;
				if (context.outlet) context.outlet.attach(stored.componentRef, stored.route.value);
				advanceActivatedRoute(stored.route.value);
				this.activateChildRoutes(futureNode, null, context.children);
			} else {
				context.attachRef = null;
				context.route = future;
				if (context.outlet) context.outlet.activateWith(future, context.injector);
				this.activateChildRoutes(futureNode, null, context.children);
			}
		} else this.activateChildRoutes(futureNode, null, parentContexts);
		if (typeof ngDevMode === "undefined" || ngDevMode) {
			const outlet = parentContexts.getOrCreateContext(future.outlet).outlet;
			if (outlet && this.inputBindingEnabled && !outlet.supportsBindingToComponentInputs && !warnedAboutUnsupportedInputBinding) {
				console.warn("'withComponentInputBinding' feature is enabled but this application is using an outlet that may not support binding to component inputs.");
				warnedAboutUnsupportedInputBinding = true;
			}
		}
	}
};
var CanActivate = class {
	constructor(path) {
		_defineProperty(this, "path", void 0);
		_defineProperty(this, "route", void 0);
		this.path = path;
		this.route = this.path[this.path.length - 1];
	}
};
var CanDeactivate = class {
	constructor(component, route) {
		_defineProperty(this, "component", void 0);
		_defineProperty(this, "route", void 0);
		this.component = component;
		this.route = route;
	}
};
function getAllRouteGuards(future, curr, parentContexts) {
	const futureRoot = future._root;
	return getChildRouteGuards(futureRoot, curr ? curr._root : null, parentContexts, [futureRoot.value]);
}
function getCanActivateChild(p) {
	const canActivateChild = p.routeConfig ? p.routeConfig.canActivateChild : null;
	if (!canActivateChild || canActivateChild.length === 0) return null;
	return {
		node: p,
		guards: canActivateChild
	};
}
function getTokenOrFunctionIdentity(tokenOrFunction, injector) {
	const NOT_FOUND = Symbol();
	const result = injector.get(tokenOrFunction, NOT_FOUND);
	if (result === NOT_FOUND) {
		if (typeof tokenOrFunction === "function" && !isInjectable(tokenOrFunction)) return tokenOrFunction;
		else return injector.get(tokenOrFunction);
	}
	return result;
}
function getChildRouteGuards(futureNode, currNode, contexts, futurePath, checks = {
	canDeactivateChecks: [],
	canActivateChecks: []
}) {
	const prevChildren = nodeChildrenAsMap(currNode);
	futureNode.children.forEach((c) => {
		getRouteGuards(c, prevChildren[c.value.outlet], contexts, futurePath.concat([c.value]), checks);
		delete prevChildren[c.value.outlet];
	});
	Object.entries(prevChildren).forEach(([k, v]) => deactivateRouteAndItsChildren(v, contexts.getContext(k), contexts, checks));
	return checks;
}
function getRouteGuards(futureNode, currNode, parentContexts, futurePath, checks = {
	canDeactivateChecks: [],
	canActivateChecks: []
}) {
	const future = futureNode.value;
	const curr = currNode ? currNode.value : null;
	const context = parentContexts ? parentContexts.getContext(futureNode.value.outlet) : null;
	if (curr && future.routeConfig === curr.routeConfig) {
		const shouldRun = shouldRunGuardsAndResolvers(curr, future, future.routeConfig.runGuardsAndResolvers);
		if (shouldRun) checks.canActivateChecks.push(new CanActivate(futurePath));
		else {
			future.data = curr.data;
			future._resolvedData = curr._resolvedData;
		}
		if (future.component) getChildRouteGuards(futureNode, currNode, context ? context.children : null, futurePath, checks);
		else getChildRouteGuards(futureNode, currNode, parentContexts, futurePath, checks);
		if (shouldRun && context && context.outlet && context.outlet.isActivated) checks.canDeactivateChecks.push(new CanDeactivate(context.outlet.component, curr));
	} else {
		if (curr) deactivateRouteAndItsChildren(currNode, context, parentContexts, checks);
		checks.canActivateChecks.push(new CanActivate(futurePath));
		if (future.component) getChildRouteGuards(futureNode, null, context ? context.children : null, futurePath, checks);
		else getChildRouteGuards(futureNode, null, parentContexts, futurePath, checks);
	}
	return checks;
}
function shouldRunGuardsAndResolvers(curr, future, mode) {
	if (typeof mode === "function") return runInInjectionContext(future._environmentInjector, () => mode(curr, future));
	switch (mode) {
		case "pathParamsChange": return !equalPath(curr.url, future.url);
		case "pathParamsOrQueryParamsChange": return !equalPath(curr.url, future.url) || !shallowEqual(curr.queryParams, future.queryParams);
		case "always": return true;
		case "paramsOrQueryParamsChange": return !equalParamsAndUrlSegments(curr, future) || !shallowEqual(curr.queryParams, future.queryParams);
		default: return !equalParamsAndUrlSegments(curr, future);
	}
}
function deactivateRouteAndItsChildren(route, context, parentContexts, checks) {
	const children = nodeChildrenAsMap(route);
	const r = route.value;
	Object.entries(children).forEach(([childName, node]) => {
		if (!r.component) deactivateRouteAndItsChildren(node, parentContexts ? parentContexts.getContext(childName) : null, parentContexts, checks);
		else if (context) deactivateRouteAndItsChildren(node, context.children.getContext(childName), context.children, checks);
		else deactivateRouteAndItsChildren(node, null, null, checks);
	});
	if (!r.component) checks.canDeactivateChecks.push(new CanDeactivate(null, r));
	else if (context && context.outlet && context.outlet.isActivated) checks.canDeactivateChecks.push(new CanDeactivate(context.outlet.component, r));
	else checks.canDeactivateChecks.push(new CanDeactivate(null, r));
}
function isFunction(v) {
	return typeof v === "function";
}
function isBoolean(v) {
	return typeof v === "boolean";
}
function isCanLoad(guard) {
	return guard && isFunction(guard.canLoad);
}
function isCanActivate(guard) {
	return guard && isFunction(guard.canActivate);
}
function isCanActivateChild(guard) {
	return guard && isFunction(guard.canActivateChild);
}
function isCanDeactivate(guard) {
	return guard && isFunction(guard.canDeactivate);
}
function isCanMatch(guard) {
	return guard && isFunction(guard.canMatch);
}
function isEmptyError(e) {
	return e instanceof EmptyError || (e === null || e === void 0 ? void 0 : e.name) === "EmptyError";
}
var INITIAL_VALUE = /* @__PURE__ */ Symbol("INITIAL_VALUE");
function prioritizedGuardValue() {
	return switchMap((obs) => {
		return combineLatest(obs.map((o) => o.pipe(take(1), startWith(INITIAL_VALUE)))).pipe(map((results) => {
			for (const result of results) if (result === true) continue;
			else if (result === INITIAL_VALUE) return INITIAL_VALUE;
			else if (result === false || isRedirect(result)) return result;
			return true;
		}), filter((item) => item !== INITIAL_VALUE), take(1));
	});
}
function isRedirect(val) {
	return isUrlTree(val) || val instanceof RedirectCommand;
}
function abortSignalToObservable(signal) {
	if (signal.aborted) return of(void 0).pipe(take(1));
	return new Observable((subscriber) => {
		const handler = () => {
			subscriber.next();
			subscriber.complete();
		};
		signal.addEventListener("abort", handler);
		return () => signal.removeEventListener("abort", handler);
	});
}
function takeUntilAbort(signal) {
	return takeUntil(abortSignalToObservable(signal));
}
function checkGuards(forwardEvent) {
	return mergeMap((t) => {
		const { targetSnapshot, currentSnapshot, guards: { canActivateChecks, canDeactivateChecks } } = t;
		if (canDeactivateChecks.length === 0 && canActivateChecks.length === 0) return of(_objectSpread2(_objectSpread2({}, t), {}, { guardsResult: true }));
		return runCanDeactivateChecks(canDeactivateChecks, targetSnapshot, currentSnapshot).pipe(mergeMap((canDeactivate) => {
			return canDeactivate && isBoolean(canDeactivate) ? runCanActivateChecks(targetSnapshot, canActivateChecks, forwardEvent) : of(canDeactivate);
		}), map((guardsResult) => _objectSpread2(_objectSpread2({}, t), {}, { guardsResult })));
	});
}
function runCanDeactivateChecks(checks, futureRSS, currRSS) {
	return from(checks).pipe(mergeMap((check) => runCanDeactivate(check.component, check.route, currRSS, futureRSS)), first((result) => {
		return result !== true;
	}, true));
}
function runCanActivateChecks(futureSnapshot, checks, forwardEvent) {
	return from(checks).pipe(concatMap((check) => {
		return concat(fireChildActivationStart(check.route.parent, forwardEvent), fireActivationStart(check.route, forwardEvent), runCanActivateChild(futureSnapshot, check.path), runCanActivate(futureSnapshot, check.route));
	}), first((result) => {
		return result !== true;
	}, true));
}
function fireActivationStart(snapshot, forwardEvent) {
	if (snapshot !== null && forwardEvent) forwardEvent(new ActivationStart(snapshot));
	return of(true);
}
function fireChildActivationStart(snapshot, forwardEvent) {
	if (snapshot !== null && forwardEvent) forwardEvent(new ChildActivationStart(snapshot));
	return of(true);
}
function runCanActivate(futureRSS, futureARS) {
	const canActivate = futureARS.routeConfig ? futureARS.routeConfig.canActivate : null;
	if (!canActivate || canActivate.length === 0) return of(true);
	const canActivateObservables = canActivate.map((canActivate) => {
		return defer(() => {
			const closestInjector = futureARS._environmentInjector;
			const guard = getTokenOrFunctionIdentity(canActivate, closestInjector);
			return wrapIntoObservable(isCanActivate(guard) ? guard.canActivate(futureARS, futureRSS) : runInInjectionContext(closestInjector, () => guard(futureARS, futureRSS))).pipe(first());
		});
	});
	return of(canActivateObservables).pipe(prioritizedGuardValue());
}
function runCanActivateChild(futureRSS, path) {
	const futureARS = path[path.length - 1];
	const canActivateChildGuardsMapped = path.slice(0, path.length - 1).reverse().map((p) => getCanActivateChild(p)).filter((_) => _ !== null).map((d) => {
		return defer(() => {
			const guardsMapped = d.guards.map((canActivateChild) => {
				const closestInjector = d.node._environmentInjector;
				const guard = getTokenOrFunctionIdentity(canActivateChild, closestInjector);
				return wrapIntoObservable(isCanActivateChild(guard) ? guard.canActivateChild(futureARS, futureRSS) : runInInjectionContext(closestInjector, () => guard(futureARS, futureRSS))).pipe(first());
			});
			return of(guardsMapped).pipe(prioritizedGuardValue());
		});
	});
	return of(canActivateChildGuardsMapped).pipe(prioritizedGuardValue());
}
function runCanDeactivate(component, currARS, currRSS, futureRSS) {
	const canDeactivate = currARS && currARS.routeConfig ? currARS.routeConfig.canDeactivate : null;
	if (!canDeactivate || canDeactivate.length === 0) return of(true);
	const canDeactivateObservables = canDeactivate.map((c) => {
		const closestInjector = currARS._environmentInjector;
		const guard = getTokenOrFunctionIdentity(c, closestInjector);
		return wrapIntoObservable(isCanDeactivate(guard) ? guard.canDeactivate(component, currARS, currRSS, futureRSS) : runInInjectionContext(closestInjector, () => guard(component, currARS, currRSS, futureRSS))).pipe(first());
	});
	return of(canDeactivateObservables).pipe(prioritizedGuardValue());
}
function runCanLoadGuards(injector, route, segments, urlSerializer, abortSignal) {
	const canLoad = route.canLoad;
	if (canLoad === void 0 || canLoad.length === 0) return of(true);
	const canLoadObservables = canLoad.map((injectionToken) => {
		const guard = getTokenOrFunctionIdentity(injectionToken, injector);
		const obs$ = wrapIntoObservable(isCanLoad(guard) ? guard.canLoad(route, segments) : runInInjectionContext(injector, () => guard(route, segments)));
		return abortSignal ? obs$.pipe(takeUntilAbort(abortSignal)) : obs$;
	});
	return of(canLoadObservables).pipe(prioritizedGuardValue(), redirectIfUrlTree(urlSerializer));
}
function redirectIfUrlTree(urlSerializer) {
	return pipe(tap((result) => {
		if (typeof result === "boolean") return;
		throw redirectingNavigationError(urlSerializer, result);
	}), map((result) => result === true));
}
function runCanMatchGuards(injector, route, segments, urlSerializer, currentSnapshot, abortSignal) {
	const canMatch = route.canMatch;
	if (!canMatch || canMatch.length === 0) return of(true);
	const canMatchObservables = canMatch.map((injectionToken) => {
		const guard = getTokenOrFunctionIdentity(injectionToken, injector);
		return wrapIntoObservable(isCanMatch(guard) ? guard.canMatch(route, segments, currentSnapshot) : runInInjectionContext(injector, () => guard(route, segments, currentSnapshot))).pipe(takeUntilAbort(abortSignal));
	});
	return of(canMatchObservables).pipe(prioritizedGuardValue(), redirectIfUrlTree(urlSerializer));
}
var NoMatch = class NoMatch extends Error {
	constructor(segmentGroup) {
		super();
		_defineProperty(this, "segmentGroup", void 0);
		this.segmentGroup = segmentGroup || null;
		Object.setPrototypeOf(this, NoMatch.prototype);
	}
};
var AbsoluteRedirect = class AbsoluteRedirect extends Error {
	constructor(urlTree) {
		super();
		_defineProperty(this, "urlTree", void 0);
		this.urlTree = urlTree;
		Object.setPrototypeOf(this, AbsoluteRedirect.prototype);
	}
};
function namedOutletsRedirect(redirectTo) {
	throw new RuntimeError(4e3, (typeof ngDevMode === "undefined" || ngDevMode) && `Only absolute redirects can have named outlets. redirectTo: '${redirectTo}'`);
}
function canLoadFails(route) {
	throw navigationCancelingError((typeof ngDevMode === "undefined" || ngDevMode) && `Cannot load children because the guard of the route "path: '${route.path}'" returned false`, NavigationCancellationCode.GuardRejected);
}
var ApplyRedirects = class {
	constructor(urlSerializer, urlTree) {
		_defineProperty(this, "urlSerializer", void 0);
		_defineProperty(this, "urlTree", void 0);
		this.urlSerializer = urlSerializer;
		this.urlTree = urlTree;
	}
	lineralizeSegments(route, urlTree) {
		return _asyncToGenerator(function* () {
			let res = [];
			let c = urlTree.root;
			while (true) {
				res = res.concat(c.segments);
				if (c.numberOfChildren === 0) return res;
				if (c.numberOfChildren > 1 || !c.children["primary"]) throw namedOutletsRedirect(`${route.redirectTo}`);
				c = c.children[PRIMARY_OUTLET];
			}
		})();
	}
	applyRedirectCommands(segments, redirectTo, posParams, currentSnapshot, injector) {
		var _this = this;
		return _asyncToGenerator(function* () {
			const redirect = yield getRedirectResult(redirectTo, currentSnapshot, injector);
			if (redirect instanceof UrlTree) throw new AbsoluteRedirect(redirect);
			const newTree = _this.applyRedirectCreateUrlTree(redirect, _this.urlSerializer.parse(redirect), segments, posParams);
			if (redirect[0] === "/") throw new AbsoluteRedirect(newTree);
			return newTree;
		})();
	}
	applyRedirectCreateUrlTree(redirectTo, urlTree, segments, posParams) {
		return new UrlTree(this.createSegmentGroup(redirectTo, urlTree.root, segments, posParams), this.createQueryParams(urlTree.queryParams, this.urlTree.queryParams), urlTree.fragment);
	}
	createQueryParams(redirectToParams, actualParams) {
		const res = {};
		Object.entries(redirectToParams).forEach(([k, v]) => {
			if (typeof v === "string" && v[0] === ":") {
				const sourceName = v.substring(1);
				res[k] = actualParams[sourceName];
			} else res[k] = v;
		});
		return res;
	}
	createSegmentGroup(redirectTo, group, segments, posParams) {
		const updatedSegments = this.createSegments(redirectTo, group.segments, segments, posParams);
		let children = Object.create(null);
		Object.entries(group.children).forEach(([name, child]) => {
			children[name] = this.createSegmentGroup(redirectTo, child, segments, posParams);
		});
		return new UrlSegmentGroup(updatedSegments, children);
	}
	createSegments(redirectTo, redirectToSegments, actualSegments, posParams) {
		return redirectToSegments.map((s) => s.path[0] === ":" ? this.findPosParam(redirectTo, s, posParams) : this.findOrReturn(s, actualSegments));
	}
	findPosParam(redirectTo, redirectToUrlSegment, posParams) {
		const pos = posParams[redirectToUrlSegment.path.substring(1)];
		if (!pos) throw new RuntimeError(4001, (typeof ngDevMode === "undefined" || ngDevMode) && `Cannot redirect to '${redirectTo}'. Cannot find '${redirectToUrlSegment.path}'.`);
		return pos;
	}
	findOrReturn(redirectToUrlSegment, actualSegments) {
		let idx = 0;
		for (const s of actualSegments) {
			if (s.path === redirectToUrlSegment.path) {
				actualSegments.splice(idx);
				return s;
			}
			idx++;
		}
		return redirectToUrlSegment;
	}
};
function getRedirectResult(redirectTo, currentSnapshot, injector) {
	if (typeof redirectTo === "string") return Promise.resolve(redirectTo);
	const redirectToFn = redirectTo;
	return firstValueFrom(wrapIntoObservable(runInInjectionContext(injector, () => redirectToFn(currentSnapshot))));
}
function getOrCreateRouteInjectorIfNeeded(route, currentInjector) {
	var _route$_injector;
	if (route.providers && !route._injector) route._injector = createEnvironmentInjector(route.providers, currentInjector, `Route: ${route.path}`);
	return (_route$_injector = route._injector) !== null && _route$_injector !== void 0 ? _route$_injector : currentInjector;
}
function validateConfig(config, parentPath = "", requireStandaloneComponents = false) {
	for (let i = 0; i < config.length; i++) {
		const route = config[i];
		validateNode(route, getFullPath(parentPath, route), requireStandaloneComponents);
	}
}
function assertStandalone(fullPath, component) {
	if (component && isNgModule(component)) throw new RuntimeError(4014, `Invalid configuration of route '${fullPath}'. You are using 'loadComponent' with a module, but it must be used with standalone components. Use 'loadChildren' instead.`);
	else if (component && !isStandalone(component)) throw new RuntimeError(4014, `Invalid configuration of route '${fullPath}'. The component must be standalone.`);
}
function validateNode(route, fullPath, requireStandaloneComponents) {
	if (typeof ngDevMode === "undefined" || ngDevMode) {
		if (!route) throw new RuntimeError(4014, `
      Invalid configuration of route '${fullPath}': Encountered undefined route.
      The reason might be an extra comma.

      Example:
      const routes: Routes = [
        { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
        { path: 'dashboard',  component: DashboardComponent },, << two commas
        { path: 'detail/:id', component: HeroDetailComponent }
      ];
    `);
		if (Array.isArray(route)) throw new RuntimeError(4014, `Invalid configuration of route '${fullPath}': Array cannot be specified`);
		if (!route.redirectTo && !route.component && !route.loadComponent && !route.children && !route.loadChildren && route.outlet && route.outlet !== "primary") throw new RuntimeError(4014, `Invalid configuration of route '${fullPath}': a componentless route without children or loadChildren cannot have a named outlet set`);
		if (route.redirectTo && route.children) throw new RuntimeError(4014, `Invalid configuration of route '${fullPath}': redirectTo and children cannot be used together`);
		if (route.redirectTo && route.loadChildren) throw new RuntimeError(4014, `Invalid configuration of route '${fullPath}': redirectTo and loadChildren cannot be used together`);
		if (route.children && route.loadChildren) throw new RuntimeError(4014, `Invalid configuration of route '${fullPath}': children and loadChildren cannot be used together`);
		if (route.component && route.loadComponent) throw new RuntimeError(4014, `Invalid configuration of route '${fullPath}': component and loadComponent cannot be used together`);
		if (route.redirectTo) {
			if (route.component || route.loadComponent) throw new RuntimeError(4014, `Invalid configuration of route '${fullPath}': redirectTo and component/loadComponent cannot be used together`);
			if (route.canMatch || route.canActivate) throw new RuntimeError(4014, `Invalid configuration of route '${fullPath}': redirectTo and ${route.canMatch ? "canMatch" : "canActivate"} cannot be used together.Redirects happen before guards are executed.`);
		}
		if (route.path && route.matcher) throw new RuntimeError(4014, `Invalid configuration of route '${fullPath}': path and matcher cannot be used together`);
		if (route.redirectTo === void 0 && !route.component && !route.loadComponent && !route.children && !route.loadChildren) throw new RuntimeError(4014, `Invalid configuration of route '${fullPath}'. One of the following must be provided: component, loadComponent, redirectTo, children or loadChildren`);
		if (route.path === void 0 && route.matcher === void 0) throw new RuntimeError(4014, `Invalid configuration of route '${fullPath}': routes must have either a path or a matcher specified`);
		if (typeof route.path === "string" && route.path.charAt(0) === "/") throw new RuntimeError(4014, `Invalid configuration of route '${fullPath}': path cannot start with a slash`);
		if (route.path === "" && route.redirectTo !== void 0 && route.pathMatch === void 0) throw new RuntimeError(4014, `Invalid configuration of route '{path: "${fullPath}", redirectTo: "${route.redirectTo}"}': please provide 'pathMatch'. The default value of 'pathMatch' is 'prefix', but often the intent is to use 'full'.`);
		if (requireStandaloneComponents) assertStandalone(fullPath, route.component);
	}
	if (route.children) validateConfig(route.children, fullPath, requireStandaloneComponents);
}
function getFullPath(parentPath, currentRoute) {
	if (!currentRoute) return parentPath;
	if (!parentPath && !currentRoute.path) return "";
	else if (parentPath && !currentRoute.path) return `${parentPath}/`;
	else if (!parentPath && currentRoute.path) return currentRoute.path;
	else return `${parentPath}/${currentRoute.path}`;
}
function getOutlet(route) {
	return route.outlet || "primary";
}
function sortByMatchingOutlets(routes, outletName) {
	const sortedConfig = routes.filter((r) => getOutlet(r) === outletName);
	sortedConfig.push(...routes.filter((r) => getOutlet(r) !== outletName));
	return sortedConfig;
}
var noMatch = {
	matched: false,
	consumedSegments: [],
	remainingSegments: [],
	parameters: {},
	positionalParamSegments: {}
};
function createPreMatchRouteSnapshot(snapshot) {
	return {
		routeConfig: snapshot.routeConfig,
		url: snapshot.url,
		params: snapshot.params,
		queryParams: snapshot.queryParams,
		fragment: snapshot.fragment,
		data: snapshot.data,
		outlet: snapshot.outlet,
		title: snapshot.title,
		paramMap: snapshot.paramMap,
		queryParamMap: snapshot.queryParamMap
	};
}
function matchWithChecks(segmentGroup, route, segments, injector, urlSerializer, createSnapshot, abortSignal) {
	const result = match(segmentGroup, route, segments);
	if (!result.matched) return of(result);
	const currentSnapshot = createPreMatchRouteSnapshot(createSnapshot(result));
	injector = getOrCreateRouteInjectorIfNeeded(route, injector);
	return runCanMatchGuards(injector, route, segments, urlSerializer, currentSnapshot, abortSignal).pipe(map((v) => v === true ? result : _objectSpread2({}, noMatch)));
}
function match(segmentGroup, route, segments) {
	var _res$posParams, _res$posParams2;
	if (route.path === "") {
		if (route.pathMatch === "full" && (segmentGroup.hasChildren() || segments.length > 0)) return _objectSpread2({}, noMatch);
		return {
			matched: true,
			consumedSegments: [],
			remainingSegments: segments,
			parameters: {},
			positionalParamSegments: {}
		};
	}
	const res = (route.matcher || defaultUrlMatcher)(segments, segmentGroup, route);
	if (!res) return _objectSpread2({}, noMatch);
	const posParams = {};
	Object.entries((_res$posParams = res.posParams) !== null && _res$posParams !== void 0 ? _res$posParams : {}).forEach(([k, v]) => {
		posParams[k] = v.path;
	});
	const parameters = res.consumed.length > 0 ? _objectSpread2(_objectSpread2({}, posParams), res.consumed[res.consumed.length - 1].parameters) : posParams;
	return {
		matched: true,
		consumedSegments: res.consumed,
		remainingSegments: segments.slice(res.consumed.length),
		parameters,
		positionalParamSegments: (_res$posParams2 = res.posParams) !== null && _res$posParams2 !== void 0 ? _res$posParams2 : {}
	};
}
function split(segmentGroup, consumedSegments, slicedSegments, config, outlet) {
	if (slicedSegments.length > 0 && containsEmptyPathMatchesWithNamedOutlets(segmentGroup, slicedSegments, config, outlet)) return {
		segmentGroup: new UrlSegmentGroup(consumedSegments, createChildrenForEmptyPaths(config, new UrlSegmentGroup(slicedSegments, segmentGroup.children))),
		slicedSegments: []
	};
	if (slicedSegments.length === 0 && containsEmptyPathMatches(segmentGroup, slicedSegments, config)) return {
		segmentGroup: new UrlSegmentGroup(segmentGroup.segments, addEmptyPathsToChildrenIfNeeded(segmentGroup, slicedSegments, config, segmentGroup.children)),
		slicedSegments
	};
	return {
		segmentGroup: new UrlSegmentGroup(segmentGroup.segments, segmentGroup.children),
		slicedSegments
	};
}
function addEmptyPathsToChildrenIfNeeded(segmentGroup, slicedSegments, routes, children) {
	const res = {};
	for (const r of routes) if (emptyPathMatch(segmentGroup, slicedSegments, r) && !children[getOutlet(r)]) {
		const s = new UrlSegmentGroup([], {});
		res[getOutlet(r)] = s;
	}
	return _objectSpread2(_objectSpread2({}, children), res);
}
function createChildrenForEmptyPaths(routes, primarySegment) {
	const res = {};
	res[PRIMARY_OUTLET] = primarySegment;
	for (const r of routes) if (r.path === "" && getOutlet(r) !== "primary") {
		const s = new UrlSegmentGroup([], {});
		res[getOutlet(r)] = s;
	}
	return res;
}
function containsEmptyPathMatchesWithNamedOutlets(segmentGroup, slicedSegments, routes, outlet) {
	return routes.some((r) => {
		if (!emptyPathMatch(segmentGroup, slicedSegments, r)) return false;
		if (!(getOutlet(r) !== "primary")) return false;
		return !(outlet !== void 0 && getOutlet(r) === outlet);
	});
}
function containsEmptyPathMatches(segmentGroup, slicedSegments, routes) {
	return routes.some((r) => emptyPathMatch(segmentGroup, slicedSegments, r));
}
function emptyPathMatch(segmentGroup, slicedSegments, r) {
	if ((segmentGroup.hasChildren() || slicedSegments.length > 0) && r.pathMatch === "full") return false;
	return r.path === "";
}
function noLeftoversInUrl(segmentGroup, segments, outlet) {
	return segments.length === 0 && !segmentGroup.children[outlet];
}
var NoLeftoversInUrl = class {};
function recognize$1(_x, _x2, _x3, _x4, _x5, _x6, _x7, _x8) {
	return _recognize$.apply(this, arguments);
}
function _recognize$() {
	_recognize$ = _asyncToGenerator(function* (injector, configLoader, rootComponentType, config, urlTree, urlSerializer, paramsInheritanceStrategy, abortSignal) {
		return new Recognizer(injector, configLoader, rootComponentType, config, urlTree, paramsInheritanceStrategy, urlSerializer, abortSignal).recognize();
	});
	return _recognize$.apply(this, arguments);
}
var MAX_ALLOWED_REDIRECTS = 31;
var Recognizer = class {
	constructor(injector, configLoader, rootComponentType, config, urlTree, paramsInheritanceStrategy, urlSerializer, abortSignal) {
		_defineProperty(this, "injector", void 0);
		_defineProperty(this, "configLoader", void 0);
		_defineProperty(this, "rootComponentType", void 0);
		_defineProperty(this, "config", void 0);
		_defineProperty(this, "urlTree", void 0);
		_defineProperty(this, "paramsInheritanceStrategy", void 0);
		_defineProperty(this, "urlSerializer", void 0);
		_defineProperty(this, "abortSignal", void 0);
		_defineProperty(this, "applyRedirects", void 0);
		_defineProperty(this, "absoluteRedirectCount", 0);
		_defineProperty(this, "allowRedirects", true);
		this.injector = injector;
		this.configLoader = configLoader;
		this.rootComponentType = rootComponentType;
		this.config = config;
		this.urlTree = urlTree;
		this.paramsInheritanceStrategy = paramsInheritanceStrategy;
		this.urlSerializer = urlSerializer;
		this.abortSignal = abortSignal;
		this.applyRedirects = new ApplyRedirects(this.urlSerializer, this.urlTree);
	}
	noMatchError(e) {
		return new RuntimeError(4002, typeof ngDevMode === "undefined" || ngDevMode ? `Cannot match any routes. URL Segment: '${e.segmentGroup}'` : `'${e.segmentGroup}'`);
	}
	recognize() {
		var _this2 = this;
		return _asyncToGenerator(function* () {
			const rootSegmentGroup = split(_this2.urlTree.root, [], [], _this2.config).segmentGroup;
			const { children, rootSnapshot } = yield _this2.match(rootSegmentGroup);
			const routeState = new RouterStateSnapshot("", new TreeNode(rootSnapshot, children));
			const tree = createUrlTreeFromSnapshot(rootSnapshot, [], _this2.urlTree.queryParams, _this2.urlTree.fragment);
			tree.queryParams = _this2.urlTree.queryParams;
			routeState.url = _this2.urlSerializer.serialize(tree);
			return {
				state: routeState,
				tree
			};
		})();
	}
	match(rootSegmentGroup) {
		var _this3 = this;
		return _asyncToGenerator(function* () {
			const rootSnapshot = new ActivatedRouteSnapshot([], Object.freeze({}), Object.freeze(_objectSpread2({}, _this3.urlTree.queryParams)), _this3.urlTree.fragment, Object.freeze({}), PRIMARY_OUTLET, _this3.rootComponentType, null, {}, _this3.injector);
			try {
				return {
					children: yield _this3.processSegmentGroup(_this3.injector, _this3.config, rootSegmentGroup, PRIMARY_OUTLET, rootSnapshot),
					rootSnapshot
				};
			} catch (e) {
				if (e instanceof AbsoluteRedirect) {
					_this3.urlTree = e.urlTree;
					return _this3.match(e.urlTree.root);
				}
				if (e instanceof NoMatch) throw _this3.noMatchError(e);
				throw e;
			}
		})();
	}
	processSegmentGroup(injector, config, segmentGroup, outlet, parentRoute) {
		var _this4 = this;
		return _asyncToGenerator(function* () {
			if (segmentGroup.segments.length === 0 && segmentGroup.hasChildren()) return _this4.processChildren(injector, config, segmentGroup, parentRoute);
			const child = yield _this4.processSegment(injector, config, segmentGroup, segmentGroup.segments, outlet, true, parentRoute);
			return child instanceof TreeNode ? [child] : [];
		})();
	}
	processChildren(injector, config, segmentGroup, parentRoute) {
		var _this5 = this;
		return _asyncToGenerator(function* () {
			const childOutlets = [];
			for (const child of Object.keys(segmentGroup.children)) if (child === "primary") childOutlets.unshift(child);
			else childOutlets.push(child);
			let children = [];
			for (const childOutlet of childOutlets) {
				const child = segmentGroup.children[childOutlet];
				const sortedConfig = sortByMatchingOutlets(config, childOutlet);
				const outletChildren = yield _this5.processSegmentGroup(injector, sortedConfig, child, childOutlet, parentRoute);
				children.push(...outletChildren);
			}
			const mergedChildren = mergeEmptyPathMatches(children);
			if (typeof ngDevMode === "undefined" || ngDevMode) checkOutletNameUniqueness(mergedChildren);
			sortActivatedRouteSnapshots(mergedChildren);
			return mergedChildren;
		})();
	}
	processSegment(injector, routes, segmentGroup, segments, outlet, allowRedirects, parentRoute) {
		var _this6 = this;
		return _asyncToGenerator(function* () {
			for (const r of routes) try {
				var _r$_injector;
				return yield _this6.processSegmentAgainstRoute((_r$_injector = r._injector) !== null && _r$_injector !== void 0 ? _r$_injector : injector, routes, r, segmentGroup, segments, outlet, allowRedirects, parentRoute);
			} catch (e) {
				if (e instanceof NoMatch || isEmptyError(e)) continue;
				throw e;
			}
			if (noLeftoversInUrl(segmentGroup, segments, outlet)) return new NoLeftoversInUrl();
			throw new NoMatch(segmentGroup);
		})();
	}
	processSegmentAgainstRoute(injector, routes, route, rawSegment, segments, outlet, allowRedirects, parentRoute) {
		var _this7 = this;
		return _asyncToGenerator(function* () {
			if (getOutlet(route) !== outlet && (outlet === "primary" || !emptyPathMatch(rawSegment, segments, route))) throw new NoMatch(rawSegment);
			if (route.redirectTo === void 0) return _this7.matchSegmentAgainstRoute(injector, rawSegment, route, segments, outlet, parentRoute);
			if (_this7.allowRedirects && allowRedirects) return _this7.expandSegmentAgainstRouteUsingRedirect(injector, rawSegment, routes, route, segments, outlet, parentRoute);
			throw new NoMatch(rawSegment);
		})();
	}
	expandSegmentAgainstRouteUsingRedirect(injector, segmentGroup, routes, route, segments, outlet, parentRoute) {
		var _this8 = this;
		return _asyncToGenerator(function* () {
			const { matched, parameters, consumedSegments, positionalParamSegments, remainingSegments } = match(segmentGroup, route, segments);
			if (!matched) throw new NoMatch(segmentGroup);
			if (typeof route.redirectTo === "string" && route.redirectTo[0] === "/") {
				_this8.absoluteRedirectCount++;
				if (_this8.absoluteRedirectCount > MAX_ALLOWED_REDIRECTS) {
					if (ngDevMode) throw new RuntimeError(4016, `Detected possible infinite redirect when redirecting from '${_this8.urlTree}' to '${route.redirectTo}'.\nThis is currently a dev mode only error but will become a call stack size exceeded error in production in a future major version.`);
					_this8.allowRedirects = false;
				}
			}
			const currentSnapshot = _this8.createSnapshot(injector, route, segments, parameters, parentRoute);
			if (_this8.abortSignal.aborted) throw new Error(_this8.abortSignal.reason);
			const newTree = yield _this8.applyRedirects.applyRedirectCommands(consumedSegments, route.redirectTo, positionalParamSegments, createPreMatchRouteSnapshot(currentSnapshot), injector);
			const newSegments = yield _this8.applyRedirects.lineralizeSegments(route, newTree);
			return _this8.processSegment(injector, routes, segmentGroup, newSegments.concat(remainingSegments), outlet, false, parentRoute);
		})();
	}
	createSnapshot(injector, route, segments, parameters, parentRoute) {
		var _ref, _route$component;
		const snapshot = new ActivatedRouteSnapshot(segments, parameters, Object.freeze(_objectSpread2({}, this.urlTree.queryParams)), this.urlTree.fragment, getData(route), getOutlet(route), (_ref = (_route$component = route.component) !== null && _route$component !== void 0 ? _route$component : route._loadedComponent) !== null && _ref !== void 0 ? _ref : null, route, getResolve(route), injector);
		const inherited = getInherited(snapshot, parentRoute, this.paramsInheritanceStrategy);
		snapshot.params = Object.freeze(inherited.params);
		snapshot.data = Object.freeze(inherited.data);
		return snapshot;
	}
	matchSegmentAgainstRoute(injector, rawSegment, route, segments, outlet, parentRoute) {
		var _this9 = this;
		return _asyncToGenerator(function* () {
			var _route$_injector2, _route$_loadedInjecto;
			if (_this9.abortSignal.aborted) throw new Error(_this9.abortSignal.reason);
			const createSnapshot = (result) => _this9.createSnapshot(injector, route, result.consumedSegments, result.parameters, parentRoute);
			const result = yield firstValueFrom(matchWithChecks(rawSegment, route, segments, injector, _this9.urlSerializer, createSnapshot, _this9.abortSignal));
			if (route.path === "**") rawSegment.children = {};
			if (!(result === null || result === void 0 ? void 0 : result.matched)) throw new NoMatch(rawSegment);
			injector = (_route$_injector2 = route._injector) !== null && _route$_injector2 !== void 0 ? _route$_injector2 : injector;
			const { routes: childConfig } = yield _this9.getChildConfig(injector, route, segments);
			const childInjector = (_route$_loadedInjecto = route._loadedInjector) !== null && _route$_loadedInjecto !== void 0 ? _route$_loadedInjecto : injector;
			const { parameters, consumedSegments, remainingSegments } = result;
			const snapshot = _this9.createSnapshot(injector, route, consumedSegments, parameters, parentRoute);
			const { segmentGroup, slicedSegments } = split(rawSegment, consumedSegments, remainingSegments, childConfig, outlet);
			if (slicedSegments.length === 0 && segmentGroup.hasChildren()) return new TreeNode(snapshot, yield _this9.processChildren(childInjector, childConfig, segmentGroup, snapshot));
			if (childConfig.length === 0 && slicedSegments.length === 0) return new TreeNode(snapshot, []);
			const matchedOnOutlet = getOutlet(route) === outlet;
			const child = yield _this9.processSegment(childInjector, childConfig, segmentGroup, slicedSegments, matchedOnOutlet ? PRIMARY_OUTLET : outlet, true, snapshot);
			return new TreeNode(snapshot, child instanceof TreeNode ? [child] : []);
		})();
	}
	getChildConfig(injector, route, segments) {
		var _this10 = this;
		return _asyncToGenerator(function* () {
			if (route.children) return {
				routes: route.children,
				injector
			};
			if (route.loadChildren) {
				if (route._loadedRoutes !== void 0) {
					const ngModuleFactory = route._loadedNgModuleFactory;
					if (ngModuleFactory && !route._loadedInjector) route._loadedInjector = ngModuleFactory.create(injector).injector;
					return {
						routes: route._loadedRoutes,
						injector: route._loadedInjector
					};
				}
				if (_this10.abortSignal.aborted) throw new Error(_this10.abortSignal.reason);
				if (yield firstValueFrom(runCanLoadGuards(injector, route, segments, _this10.urlSerializer, _this10.abortSignal))) {
					const cfg = yield _this10.configLoader.loadChildren(injector, route);
					route._loadedRoutes = cfg.routes;
					route._loadedInjector = cfg.injector;
					route._loadedNgModuleFactory = cfg.factory;
					return cfg;
				}
				throw canLoadFails(route);
			}
			return {
				routes: [],
				injector
			};
		})();
	}
};
function sortActivatedRouteSnapshots(nodes) {
	nodes.sort((a, b) => {
		if (a.value.outlet === "primary") return -1;
		if (b.value.outlet === "primary") return 1;
		return a.value.outlet.localeCompare(b.value.outlet);
	});
}
function hasEmptyPathConfig(node) {
	const config = node.value.routeConfig;
	return config && config.path === "";
}
function mergeEmptyPathMatches(nodes) {
	const result = [];
	const mergedNodes = /* @__PURE__ */ new Set();
	for (const node of nodes) {
		if (!hasEmptyPathConfig(node)) {
			result.push(node);
			continue;
		}
		const duplicateEmptyPathNode = result.find((resultNode) => node.value.routeConfig === resultNode.value.routeConfig);
		if (duplicateEmptyPathNode !== void 0) {
			duplicateEmptyPathNode.children.push(...node.children);
			mergedNodes.add(duplicateEmptyPathNode);
		} else result.push(node);
	}
	for (const mergedNode of mergedNodes) {
		const mergedChildren = mergeEmptyPathMatches(mergedNode.children);
		result.push(new TreeNode(mergedNode.value, mergedChildren));
	}
	return result.filter((n) => !mergedNodes.has(n));
}
function checkOutletNameUniqueness(nodes) {
	const names = {};
	nodes.forEach((n) => {
		const routeWithSameOutletName = names[n.value.outlet];
		if (routeWithSameOutletName) {
			const p = routeWithSameOutletName.url.map((s) => s.toString()).join("/");
			const c = n.value.url.map((s) => s.toString()).join("/");
			throw new RuntimeError(4006, (typeof ngDevMode === "undefined" || ngDevMode) && `Two segments cannot have the same outlet name: '${p}' and '${c}'.`);
		}
		names[n.value.outlet] = n.value;
	});
}
function getData(route) {
	return route.data || {};
}
function getResolve(route) {
	return route.resolve || {};
}
function recognize(injector, configLoader, rootComponentType, config, serializer, paramsInheritanceStrategy, abortSignal) {
	return mergeMap(function() {
		var _ref2 = _asyncToGenerator(function* (t) {
			const { state: targetSnapshot, tree: urlAfterRedirects } = yield recognize$1(injector, configLoader, rootComponentType, config, t.extractedUrl, serializer, paramsInheritanceStrategy, abortSignal);
			return _objectSpread2(_objectSpread2({}, t), {}, {
				targetSnapshot,
				urlAfterRedirects
			});
		});
		return function(_x9) {
			return _ref2.apply(this, arguments);
		};
	}());
}
function resolveData(paramsInheritanceStrategy) {
	return mergeMap((t) => {
		const { targetSnapshot, guards: { canActivateChecks } } = t;
		if (!canActivateChecks.length) return of(t);
		const routesWithResolversToRun = new Set(canActivateChecks.map((check) => check.route));
		const routesNeedingDataUpdates = /* @__PURE__ */ new Set();
		for (const route of routesWithResolversToRun) {
			if (routesNeedingDataUpdates.has(route)) continue;
			for (const newRoute of flattenRouteTree(route)) routesNeedingDataUpdates.add(newRoute);
		}
		let routesProcessed = 0;
		return from(routesNeedingDataUpdates).pipe(concatMap((route) => {
			if (routesWithResolversToRun.has(route)) return runResolve(route, targetSnapshot, paramsInheritanceStrategy);
			else {
				route.data = getInherited(route, route.parent, paramsInheritanceStrategy).resolve;
				return of(void 0);
			}
		}), tap(() => routesProcessed++), takeLast(1), mergeMap((_) => routesProcessed === routesNeedingDataUpdates.size ? of(t) : EMPTY));
	});
}
function flattenRouteTree(route) {
	return [route, ...route.children.map((child) => flattenRouteTree(child)).flat()];
}
function runResolve(futureARS, futureRSS, paramsInheritanceStrategy) {
	const config = futureARS.routeConfig;
	const resolve = futureARS._resolve;
	if ((config === null || config === void 0 ? void 0 : config.title) !== void 0 && !hasStaticTitle(config)) resolve[RouteTitleKey] = config.title;
	return defer(() => {
		futureARS.data = getInherited(futureARS, futureARS.parent, paramsInheritanceStrategy).resolve;
		return resolveNode(resolve, futureARS, futureRSS).pipe(map((resolvedData) => {
			futureARS._resolvedData = resolvedData;
			futureARS.data = _objectSpread2(_objectSpread2({}, futureARS.data), resolvedData);
			return null;
		}));
	});
}
function resolveNode(resolve, futureARS, futureRSS) {
	const keys = getDataKeys(resolve);
	if (keys.length === 0) return of({});
	const data = {};
	return from(keys).pipe(mergeMap((key) => getResolver(resolve[key], futureARS, futureRSS).pipe(first(), tap((value) => {
		if (value instanceof RedirectCommand) throw redirectingNavigationError(new DefaultUrlSerializer(), value);
		data[key] = value;
	}))), takeLast(1), map(() => data), catchError((e) => isEmptyError(e) ? EMPTY : throwError(e)));
}
function getResolver(injectionToken, futureARS, futureRSS) {
	const closestInjector = futureARS._environmentInjector;
	const resolver = getTokenOrFunctionIdentity(injectionToken, closestInjector);
	return wrapIntoObservable(resolver.resolve ? resolver.resolve(futureARS, futureRSS) : runInInjectionContext(closestInjector, () => resolver(futureARS, futureRSS)));
}
var ROUTER_RESOURCES_FEATURE = new InjectionToken(typeof ngDevMode === "undefined" || ngDevMode ? "Router Resources Feature" : "");
function switchTap(next) {
	return switchMap((v) => {
		const nextResult = next(v);
		if (nextResult) return from(nextResult).pipe(map(() => v));
		return of(v);
	});
}
var TitleStrategy = class {
	buildTitle(snapshot) {
		let pageTitle;
		let route = snapshot.root;
		while (route !== void 0) {
			var _this$getResolvedTitl;
			pageTitle = (_this$getResolvedTitl = this.getResolvedTitleForRoute(route)) !== null && _this$getResolvedTitl !== void 0 ? _this$getResolvedTitl : pageTitle;
			route = route.children.find((child) => child.outlet === PRIMARY_OUTLET);
		}
		return pageTitle;
	}
	getResolvedTitleForRoute(snapshot) {
		return snapshot.data[RouteTitleKey];
	}
};
_TitleStrategy = TitleStrategy;
_defineProperty(TitleStrategy, "ɵfac", function TitleStrategy_Factory(__ngFactoryType__) {
	return new (__ngFactoryType__ || _TitleStrategy)();
});
_defineProperty(TitleStrategy, "ɵprov", /*@__PURE__*/ ɵɵdefineService({
	token: _TitleStrategy,
	factory: () => {
		return (() => {
			return inject(DefaultTitleStrategy);
		})();
	}
}));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(TitleStrategy, [{
		type: Service,
		args: [{ factory: () => inject(DefaultTitleStrategy) }]
	}], null, null);
})();
var DefaultTitleStrategy = class extends TitleStrategy {
	constructor(title) {
		super();
		_defineProperty(this, "title", void 0);
		this.title = title;
	}
	updateTitle(snapshot) {
		const title = this.buildTitle(snapshot);
		if (title !== void 0) this.title.setTitle(title);
	}
};
_DefaultTitleStrategy = DefaultTitleStrategy;
_defineProperty(DefaultTitleStrategy, "ɵfac", function DefaultTitleStrategy_Factory(__ngFactoryType__) {
	return new (__ngFactoryType__ || _DefaultTitleStrategy)(ɵɵinject(Title));
});
_defineProperty(DefaultTitleStrategy, "ɵprov", /*@__PURE__*/ ɵɵdefineInjectable({
	token: _DefaultTitleStrategy,
	factory: _DefaultTitleStrategy.ɵfac,
	providedIn: "root"
}));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(DefaultTitleStrategy, [{
		type: Injectable,
		args: [{ providedIn: "root" }]
	}], () => [{ type: Title }], null);
})();
var ROUTER_CONFIGURATION = new InjectionToken(typeof ngDevMode === "undefined" || ngDevMode ? "router config" : "", { factory: () => ({}) });
var ROUTES = new InjectionToken(typeof ngDevMode !== "undefined" && ngDevMode ? "ROUTES" : "");
var RouterConfigLoader = class {
	constructor() {
		_defineProperty(this, "componentLoaders", /* @__PURE__ */ new WeakMap());
		_defineProperty(this, "childrenLoaders", /* @__PURE__ */ new WeakMap());
		_defineProperty(this, "onLoadStartListener", void 0);
		_defineProperty(this, "onLoadEndListener", void 0);
		_defineProperty(this, "compiler", inject(Compiler));
	}
	loadComponent(injector, route) {
		var _this11 = this;
		return _asyncToGenerator(function* () {
			if (_this11.componentLoaders.get(route)) return _this11.componentLoaders.get(route);
			else if (route._loadedComponent) return Promise.resolve(route._loadedComponent);
			if (_this11.onLoadStartListener) _this11.onLoadStartListener(route);
			const loader = _asyncToGenerator(function* () {
				try {
					var _route$path;
					const loaded = yield wrapIntoPromise(runInInjectionContext(injector, () => route.loadComponent()));
					const component = yield maybeResolveResources(maybeUnwrapDefaultExport(loaded));
					if (_this11.onLoadEndListener) _this11.onLoadEndListener(route);
					(typeof ngDevMode === "undefined" || ngDevMode) && assertStandalone((_route$path = route.path) !== null && _route$path !== void 0 ? _route$path : "", component);
					route._loadedComponent = component;
					return component;
				} finally {
					_this11.componentLoaders.delete(route);
				}
			})();
			_this11.componentLoaders.set(route, loader);
			return loader;
		})();
	}
	loadChildren(parentInjector, route) {
		var _this12 = this;
		if (this.childrenLoaders.get(route)) return this.childrenLoaders.get(route);
		else if (route._loadedRoutes) return Promise.resolve({
			routes: route._loadedRoutes,
			injector: route._loadedInjector
		});
		if (this.onLoadStartListener) this.onLoadStartListener(route);
		const loader = _asyncToGenerator(function* () {
			try {
				const result = yield loadChildren(route, _this12.compiler, parentInjector, _this12.onLoadEndListener);
				route._loadedRoutes = result.routes;
				route._loadedInjector = result.injector;
				route._loadedNgModuleFactory = result.factory;
				return result;
			} finally {
				_this12.childrenLoaders.delete(route);
			}
		})();
		this.childrenLoaders.set(route, loader);
		return loader;
	}
};
_RouterConfigLoader = RouterConfigLoader;
_defineProperty(RouterConfigLoader, "ɵfac", function RouterConfigLoader_Factory(__ngFactoryType__) {
	return new (__ngFactoryType__ || _RouterConfigLoader)();
});
_defineProperty(RouterConfigLoader, "ɵprov", /*@__PURE__*/ ɵɵdefineService({
	token: _RouterConfigLoader,
	factory: _RouterConfigLoader.ɵfac
}));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(RouterConfigLoader, [{ type: Service }], null, null);
})();
function loadChildren(_x10, _x11, _x12, _x13) {
	return _loadChildren.apply(this, arguments);
}
function _loadChildren() {
	_loadChildren = _asyncToGenerator(function* (route, compiler, parentInjector, onLoadEndListener) {
		const loaded = yield wrapIntoPromise(runInInjectionContext(parentInjector, () => route.loadChildren()));
		const t = yield maybeResolveResources(maybeUnwrapDefaultExport(loaded));
		let factoryOrRoutes;
		if (t instanceof NgModuleFactory$1 || Array.isArray(t)) factoryOrRoutes = t;
		else factoryOrRoutes = yield compiler.compileModuleAsync(t);
		if (onLoadEndListener) onLoadEndListener(route);
		let injector;
		let rawRoutes;
		let requireStandaloneComponents = false;
		let factory = void 0;
		if (Array.isArray(factoryOrRoutes)) {
			rawRoutes = factoryOrRoutes;
			requireStandaloneComponents = true;
		} else {
			injector = factoryOrRoutes.create(parentInjector).injector;
			factory = factoryOrRoutes;
			rawRoutes = injector.get(ROUTES, [], {
				optional: true,
				self: true
			}).flat();
		}
		const routes = rawRoutes.map(standardizeConfig);
		(typeof ngDevMode === "undefined" || ngDevMode) && validateConfig(routes, route.path, requireStandaloneComponents);
		return {
			routes,
			injector,
			factory
		};
	});
	return _loadChildren.apply(this, arguments);
}
function maybeResolveResources(_x14) {
	return _maybeResolveResources.apply(this, arguments);
}
function _maybeResolveResources() {
	_maybeResolveResources = _asyncToGenerator(function* (value) {
		return value;
	});
	return _maybeResolveResources.apply(this, arguments);
}
var UrlHandlingStrategy = class {};
_UrlHandlingStrategy = UrlHandlingStrategy;
_defineProperty(UrlHandlingStrategy, "ɵfac", function UrlHandlingStrategy_Factory(__ngFactoryType__) {
	return new (__ngFactoryType__ || _UrlHandlingStrategy)();
});
_defineProperty(UrlHandlingStrategy, "ɵprov", /*@__PURE__*/ ɵɵdefineService({
	token: _UrlHandlingStrategy,
	factory: () => {
		return (() => {
			return inject(DefaultUrlHandlingStrategy);
		})();
	}
}));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(UrlHandlingStrategy, [{
		type: Service,
		args: [{ factory: () => inject(DefaultUrlHandlingStrategy) }]
	}], null, null);
})();
var DefaultUrlHandlingStrategy = class {
	shouldProcessUrl(url) {
		return true;
	}
	extract(url) {
		return url;
	}
	merge(newUrlPart, wholeUrl) {
		return newUrlPart;
	}
};
_DefaultUrlHandlingStrategy = DefaultUrlHandlingStrategy;
_defineProperty(DefaultUrlHandlingStrategy, "ɵfac", function DefaultUrlHandlingStrategy_Factory(__ngFactoryType__) {
	return new (__ngFactoryType__ || _DefaultUrlHandlingStrategy)();
});
_defineProperty(DefaultUrlHandlingStrategy, "ɵprov", /*@__PURE__*/ ɵɵdefineService({
	token: _DefaultUrlHandlingStrategy,
	factory: _DefaultUrlHandlingStrategy.ɵfac
}));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(DefaultUrlHandlingStrategy, [{ type: Service }], null, null);
})();
var CREATE_VIEW_TRANSITION = new InjectionToken(typeof ngDevMode !== "undefined" && ngDevMode ? "view transition helper" : "");
var VIEW_TRANSITION_OPTIONS = new InjectionToken(typeof ngDevMode !== "undefined" && ngDevMode ? "view transition options" : "");
function createViewTransition(injector, from, to, hasUAVisualTransition) {
	const transitionOptions = injector.get(VIEW_TRANSITION_OPTIONS);
	const document = injector.get(DOCUMENT);
	if (hasUAVisualTransition) {
		transitionOptions.skipNextTransition = false;
		return;
	}
	if (!document.startViewTransition || transitionOptions.skipNextTransition) {
		transitionOptions.skipNextTransition = false;
		return new Promise((resolve) => setTimeout(resolve));
	}
	let resolveViewTransitionStarted;
	const viewTransitionStarted = new Promise((resolve) => {
		resolveViewTransitionStarted = resolve;
	});
	const transition = document.startViewTransition(() => {
		resolveViewTransitionStarted();
		return createRenderPromise(injector);
	});
	transition.updateCallbackDone.catch((error) => {
		if (typeof ngDevMode === "undefined" || ngDevMode) console.error(error);
	});
	transition.ready.catch((error) => {
		if (typeof ngDevMode === "undefined" || ngDevMode) console.error(error);
	});
	transition.finished.catch((error) => {
		if (typeof ngDevMode === "undefined" || ngDevMode) console.error(error);
	});
	const { onViewTransitionCreated } = transitionOptions;
	if (onViewTransitionCreated) runInInjectionContext(injector, () => onViewTransitionCreated({
		transition,
		from,
		to
	}));
	return viewTransitionStarted;
}
function createRenderPromise(injector) {
	return new Promise((resolve) => {
		afterNextRender({ read: () => setTimeout(resolve) }, { injector });
	});
}
var noop = () => {};
var NAVIGATION_ERROR_HANDLER = new InjectionToken(typeof ngDevMode === "undefined" || ngDevMode ? "navigation error handler" : "");
var NavigationTransitions = class {
	get hasRequestedNavigation() {
		return this.navigationId !== 0;
	}
	constructor() {
		_defineProperty(this, "currentNavigation", signal(null, _objectSpread2(_objectSpread2({}, ngDevMode ? { debugName: "currentNavigation" } : {}), {}, { equal: () => false })));
		_defineProperty(this, "currentTransition", null);
		_defineProperty(this, "lastSuccessfulNavigation", signal(null, ...ngDevMode ? [{ debugName: "lastSuccessfulNavigation" }] : []));
		_defineProperty(this, "events", new Subject());
		_defineProperty(this, "transitionAbortWithErrorSubject", new Subject());
		_defineProperty(this, "configLoader", inject(RouterConfigLoader));
		_defineProperty(this, "environmentInjector", inject(EnvironmentInjector));
		_defineProperty(this, "destroyRef", inject(DestroyRef));
		_defineProperty(this, "urlSerializer", inject(UrlSerializer));
		_defineProperty(this, "rootContexts", inject(ChildrenOutletContexts));
		_defineProperty(this, "location", inject(Location));
		_defineProperty(this, "inputBindingEnabled", inject(INPUT_BINDER, { optional: true }) !== null);
		_defineProperty(this, "titleStrategy", inject(TitleStrategy));
		_defineProperty(this, "options", inject(ROUTER_CONFIGURATION, { optional: true }) || {});
		_defineProperty(this, "paramsInheritanceStrategy", this.options.paramsInheritanceStrategy || DEFAULT_PARAMS_INHERITANCE_STRATEGY);
		_defineProperty(this, "urlHandlingStrategy", inject(UrlHandlingStrategy));
		_defineProperty(this, "createViewTransition", inject(CREATE_VIEW_TRANSITION, { optional: true }));
		_defineProperty(this, "navigationErrorHandler", inject(NAVIGATION_ERROR_HANDLER, { optional: true }));
		_defineProperty(this, "routerResourcesFeature", inject(ROUTER_RESOURCES_FEATURE, { optional: true }));
		_defineProperty(this, "navigationId", 0);
		_defineProperty(this, "transitions", void 0);
		_defineProperty(this, "afterPreactivation", () => of(void 0));
		_defineProperty(this, "rootComponentType", null);
		_defineProperty(this, "destroyed", false);
		const onLoadStart = (r) => this.events.next(new RouteConfigLoadStart(r));
		const onLoadEnd = (r) => this.events.next(new RouteConfigLoadEnd(r));
		this.configLoader.onLoadEndListener = onLoadEnd;
		this.configLoader.onLoadStartListener = onLoadStart;
		this.destroyRef.onDestroy(() => {
			this.destroyed = true;
		});
	}
	complete() {
		var _this$transitions;
		(_this$transitions = this.transitions) === null || _this$transitions === void 0 || _this$transitions.complete();
	}
	handleNavigationRequest(request) {
		const id = ++this.navigationId;
		untracked(() => {
			var _this$transitions2;
			(_this$transitions2 = this.transitions) === null || _this$transitions2 === void 0 || _this$transitions2.next(_objectSpread2(_objectSpread2({}, request), {}, {
				extractedUrl: this.urlHandlingStrategy.extract(request.rawUrl),
				targetSnapshot: null,
				targetRouterState: null,
				guards: {
					canActivateChecks: [],
					canDeactivateChecks: []
				},
				guardsResult: null,
				id,
				routesRecognizeHandler: {},
				beforeActivateHandler: {}
			}));
		});
	}
	setupNavigations(router) {
		this.transitions = new BehaviorSubject(null);
		return this.transitions.pipe(filter((t) => t !== null), switchMap((overallTransitionState) => {
			var _this$routerResources, _this$routerResources2;
			let abortable = true;
			let completedOrAborted = false;
			const abortController = new AbortController();
			const shouldContinueNavigation = () => {
				var _this$currentTransiti;
				return !completedOrAborted && ((_this$currentTransiti = this.currentTransition) === null || _this$currentTransiti === void 0 ? void 0 : _this$currentTransiti.id) === overallTransitionState.id;
			};
			return of(overallTransitionState).pipe(switchMap((t) => {
				var _t$extras$onSameUrlNa;
				if (this.navigationId > overallTransitionState.id) {
					const cancellationReason = typeof ngDevMode === "undefined" || ngDevMode ? `Navigation ID ${overallTransitionState.id} is not equal to the current navigation id ${this.navigationId}` : "";
					this.cancelNavigationTransition(overallTransitionState, cancellationReason, NavigationCancellationCode.SupersededByNewNavigation);
					return EMPTY;
				}
				this.currentTransition = overallTransitionState;
				const lastSuccessfulNavigation = this.lastSuccessfulNavigation();
				this.currentNavigation.set({
					id: t.id,
					initialUrl: t.rawUrl,
					extractedUrl: t.extractedUrl,
					targetBrowserUrl: typeof t.extras.browserUrl === "string" ? this.urlSerializer.parse(t.extras.browserUrl) : t.extras.browserUrl,
					trigger: t.source,
					extras: t.extras,
					previousNavigation: !lastSuccessfulNavigation ? null : _objectSpread2(_objectSpread2({}, lastSuccessfulNavigation), {}, { previousNavigation: null }),
					abort: () => abortController.abort(),
					routesRecognizeHandler: t.routesRecognizeHandler,
					beforeActivateHandler: t.beforeActivateHandler
				});
				const urlTransition = !router.navigated || this.isUpdatingInternalState() || this.isUpdatedBrowserUrl();
				const onSameUrlNavigation = (_t$extras$onSameUrlNa = t.extras.onSameUrlNavigation) !== null && _t$extras$onSameUrlNa !== void 0 ? _t$extras$onSameUrlNa : router.onSameUrlNavigation;
				if (!urlTransition && onSameUrlNavigation !== "reload") {
					const reason = typeof ngDevMode === "undefined" || ngDevMode ? `Navigation to ${t.rawUrl} was ignored because it is the same as the current Router URL.` : "";
					this.events.next(new NavigationSkipped(t.id, this.urlSerializer.serialize(t.rawUrl), reason, NavigationSkippedCode.IgnoredSameUrlNavigation));
					t.resolve(false);
					return EMPTY;
				}
				if (this.urlHandlingStrategy.shouldProcessUrl(t.rawUrl)) return of(t).pipe(switchMap((t) => {
					this.events.next(new NavigationStart(t.id, this.urlSerializer.serialize(t.extractedUrl), t.source, t.restoredState));
					if (t.id !== this.navigationId) return EMPTY;
					return Promise.resolve(t);
				}), recognize(this.environmentInjector, this.configLoader, this.rootComponentType, router.config, this.urlSerializer, this.paramsInheritanceStrategy, abortController.signal), tap((t) => {
					overallTransitionState.targetSnapshot = t.targetSnapshot;
					overallTransitionState.urlAfterRedirects = t.urlAfterRedirects;
					this.currentNavigation.update((nav) => {
						nav.finalUrl = t.urlAfterRedirects;
						return nav;
					});
					this.events.next(new BeforeRoutesRecognized());
				}), switchMap((value) => {
					var _overallTransitionSta;
					return from((_overallTransitionSta = overallTransitionState.routesRecognizeHandler.deferredHandle) !== null && _overallTransitionSta !== void 0 ? _overallTransitionSta : of(void 0)).pipe(map(() => value));
				}), tap(() => {
					const routesRecognized = new RoutesRecognized(t.id, this.urlSerializer.serialize(t.extractedUrl), this.urlSerializer.serialize(t.urlAfterRedirects), t.targetSnapshot);
					this.events.next(routesRecognized);
				}));
				else if (urlTransition && this.urlHandlingStrategy.shouldProcessUrl(t.currentRawUrl)) {
					const { id, extractedUrl, source, restoredState, extras } = t;
					const navStart = new NavigationStart(id, this.urlSerializer.serialize(extractedUrl), source, restoredState);
					this.events.next(navStart);
					const targetSnapshot = createEmptyState(this.rootComponentType, this.environmentInjector).snapshot;
					this.currentTransition = overallTransitionState = _objectSpread2(_objectSpread2({}, t), {}, {
						targetSnapshot,
						urlAfterRedirects: extractedUrl,
						extras: _objectSpread2(_objectSpread2({}, extras), {}, {
							skipLocationChange: false,
							replaceUrl: false
						})
					});
					this.currentNavigation.update((nav) => {
						nav.finalUrl = extractedUrl;
						return nav;
					});
					return of(overallTransitionState);
				} else {
					const reason = typeof ngDevMode === "undefined" || ngDevMode ? `Navigation was ignored because the UrlHandlingStrategy indicated neither the current URL ${t.currentRawUrl} nor target URL ${t.rawUrl} should be processed.` : "";
					this.events.next(new NavigationSkipped(t.id, this.urlSerializer.serialize(t.extractedUrl), reason, NavigationSkippedCode.IgnoredByUrlHandlingStrategy));
					t.resolve(false);
					return EMPTY;
				}
			}), map((t) => {
				const guardsStart = new GuardsCheckStart(t.id, this.urlSerializer.serialize(t.extractedUrl), this.urlSerializer.serialize(t.urlAfterRedirects), t.targetSnapshot);
				this.events.next(guardsStart);
				this.currentTransition = overallTransitionState = _objectSpread2(_objectSpread2({}, t), {}, { guards: getAllRouteGuards(t.targetSnapshot, t.currentSnapshot, this.rootContexts) });
				return overallTransitionState;
			}), checkGuards((evt) => this.events.next(evt)), switchMap((t) => {
				overallTransitionState.guardsResult = t.guardsResult;
				if (t.guardsResult && typeof t.guardsResult !== "boolean") throw redirectingNavigationError(this.urlSerializer, t.guardsResult);
				const guardsEnd = new GuardsCheckEnd(t.id, this.urlSerializer.serialize(t.extractedUrl), this.urlSerializer.serialize(t.urlAfterRedirects), t.targetSnapshot, !!t.guardsResult);
				this.events.next(guardsEnd);
				if (!shouldContinueNavigation()) return EMPTY;
				if (!t.guardsResult) {
					this.cancelNavigationTransition(t, "", NavigationCancellationCode.GuardRejected);
					return EMPTY;
				}
				if (t.guards.canActivateChecks.length === 0) return of(t);
				const resolveStart = new ResolveStart(t.id, this.urlSerializer.serialize(t.extractedUrl), this.urlSerializer.serialize(t.urlAfterRedirects), t.targetSnapshot);
				this.events.next(resolveStart);
				if (!shouldContinueNavigation()) return EMPTY;
				let dataResolved = false;
				return of(t).pipe(resolveData(this.paramsInheritanceStrategy), tap({
					next: () => {
						dataResolved = true;
						const resolveEnd = new ResolveEnd(t.id, this.urlSerializer.serialize(t.extractedUrl), this.urlSerializer.serialize(t.urlAfterRedirects), t.targetSnapshot);
						this.events.next(resolveEnd);
					},
					complete: () => {
						if (!dataResolved) this.cancelNavigationTransition(t, typeof ngDevMode === "undefined" || ngDevMode ? `At least one route resolver didn't emit any value.` : "", NavigationCancellationCode.NoDataFromResolver);
					}
				}));
			}), switchTap((t) => {
				const loadComponents = (route) => {
					var _route$routeConfig, _route$routeConfig3;
					const loaders = [];
					if ((_route$routeConfig = route.routeConfig) === null || _route$routeConfig === void 0 ? void 0 : _route$routeConfig._loadedComponent) {
						var _route$routeConfig2;
						route.component = (_route$routeConfig2 = route.routeConfig) === null || _route$routeConfig2 === void 0 ? void 0 : _route$routeConfig2._loadedComponent;
					} else if ((_route$routeConfig3 = route.routeConfig) === null || _route$routeConfig3 === void 0 ? void 0 : _route$routeConfig3.loadComponent) {
						const injector = route._environmentInjector;
						loaders.push(this.configLoader.loadComponent(injector, route.routeConfig).then((loadedComponent) => {
							route.component = loadedComponent;
						}));
					}
					for (const child of route.children) loaders.push(...loadComponents(child));
					return loaders;
				};
				const loaders = loadComponents(t.targetSnapshot.root);
				return loaders.length === 0 ? of(t) : from(Promise.all(loaders).then(() => t));
			}), switchMap((t) => {
				const { newlyCreatedRoutes, state } = createRouterState(router.routeReuseStrategy, t.targetSnapshot, t.currentRouterState);
				this.currentTransition = overallTransitionState = t = _objectSpread2(_objectSpread2({}, t), {}, {
					targetRouterState: state,
					newlyCreatedRoutes
				});
				this.currentNavigation.update((nav) => {
					nav.targetRouterState = state;
					return nav;
				});
				return of(t);
			}), (_this$routerResources = (_this$routerResources2 = this.routerResourcesFeature) === null || _this$routerResources2 === void 0 ? void 0 : _this$routerResources2.setupAndRunResources(abortController.signal)) !== null && _this$routerResources !== void 0 ? _this$routerResources : ((t) => t), switchTap(() => this.afterPreactivation()), switchMap(() => {
				var _this$createViewTrans;
				const { currentSnapshot, targetSnapshot } = overallTransitionState;
				const viewTransitionStarted = (_this$createViewTrans = this.createViewTransition) === null || _this$createViewTrans === void 0 ? void 0 : _this$createViewTrans.call(this, this.environmentInjector, currentSnapshot.root, targetSnapshot.root, overallTransitionState.hasUAVisualTransition);
				return viewTransitionStarted ? from(viewTransitionStarted).pipe(map(() => overallTransitionState)) : of(overallTransitionState);
			}), take(1), switchMap((t) => {
				abortable = false;
				this.events.next(new BeforeActivateRoutes());
				const deferred = overallTransitionState.beforeActivateHandler.deferredHandle;
				return deferred ? from(deferred.then(() => t)) : of(t);
			}), tap((t) => {
				var _t$newlyCreatedRoutes, _this$titleStrategy;
				new ActivateRoutes(router.routeReuseStrategy, overallTransitionState.targetRouterState, overallTransitionState.currentRouterState, (evt) => this.events.next(evt), this.inputBindingEnabled).activate(this.rootContexts);
				(_t$newlyCreatedRoutes = t.newlyCreatedRoutes) === null || _t$newlyCreatedRoutes === void 0 || _t$newlyCreatedRoutes.clear();
				if (!shouldContinueNavigation()) return;
				resetPendingRoutes(t.targetRouterState);
				completedOrAborted = true;
				this.currentNavigation.update((nav) => {
					nav.abort = noop;
					return nav;
				});
				this.lastSuccessfulNavigation.set(untracked(this.currentNavigation));
				this.events.next(new NavigationEnd(t.id, this.urlSerializer.serialize(t.extractedUrl), this.urlSerializer.serialize(t.urlAfterRedirects)));
				(_this$titleStrategy = this.titleStrategy) === null || _this$titleStrategy === void 0 || _this$titleStrategy.updateTitle(t.targetRouterState.snapshot);
				t.resolve(true);
			}), takeUntil(abortSignalToObservable(abortController.signal).pipe(filter(() => !completedOrAborted && abortable), tap(() => {
				this.cancelNavigationTransition(overallTransitionState, abortController.signal.reason + "", NavigationCancellationCode.Aborted);
			}))), tap({ complete: () => {
				completedOrAborted = true;
			} }), takeUntil(this.transitionAbortWithErrorSubject.pipe(tap((err) => {
				throw err;
			}))), finalize(() => {
				var _this$currentTransiti2;
				abortController.abort();
				if (!completedOrAborted) {
					const cancelationReason = typeof ngDevMode === "undefined" || ngDevMode ? `Navigation ID ${overallTransitionState.id} is not equal to the current navigation id ${this.navigationId}` : "";
					this.cancelNavigationTransition(overallTransitionState, cancelationReason, NavigationCancellationCode.SupersededByNewNavigation);
				}
				if (((_this$currentTransiti2 = this.currentTransition) === null || _this$currentTransiti2 === void 0 ? void 0 : _this$currentTransiti2.id) === overallTransitionState.id) {
					this.currentNavigation.set(null);
					this.currentTransition = null;
				}
			}), catchError((e) => {
				completedOrAborted = true;
				rollbackState(overallTransitionState);
				if (this.destroyed) {
					overallTransitionState.resolve(false);
					return EMPTY;
				}
				if (e instanceof RedirectCommand) e = redirectingNavigationError(this.urlSerializer, e);
				if (isNavigationCancelingError(e)) {
					this.events.next(new NavigationCancel(overallTransitionState.id, this.urlSerializer.serialize(overallTransitionState.extractedUrl), e.message, e.cancellationCode));
					if (!isRedirectingNavigationCancelingError(e)) overallTransitionState.resolve(false);
					else this.events.next(new RedirectRequest(e.url, e.navigationBehaviorOptions));
				} else {
					var _overallTransitionSta2;
					const navigationError = new NavigationError(overallTransitionState.id, this.urlSerializer.serialize(overallTransitionState.extractedUrl), e, (_overallTransitionSta2 = overallTransitionState.targetSnapshot) !== null && _overallTransitionSta2 !== void 0 ? _overallTransitionSta2 : void 0);
					try {
						const navigationErrorHandlerResult = runInInjectionContext(this.environmentInjector, () => {
							var _this$navigationError;
							return (_this$navigationError = this.navigationErrorHandler) === null || _this$navigationError === void 0 ? void 0 : _this$navigationError.call(this, navigationError);
						});
						if (navigationErrorHandlerResult instanceof RedirectCommand) {
							const { message, cancellationCode } = redirectingNavigationError(this.urlSerializer, navigationErrorHandlerResult);
							this.events.next(new NavigationCancel(overallTransitionState.id, this.urlSerializer.serialize(overallTransitionState.extractedUrl), message, cancellationCode));
							this.events.next(new RedirectRequest(navigationErrorHandlerResult.redirectTo, navigationErrorHandlerResult.navigationBehaviorOptions));
						} else {
							this.events.next(navigationError);
							throw e;
						}
					} catch (ee) {
						if (this.options.resolveNavigationPromiseOnError) overallTransitionState.resolve(false);
						else overallTransitionState.reject(ee);
					}
				}
				return EMPTY;
			}));
		}));
	}
	cancelNavigationTransition(t, reason, code) {
		rollbackState(t);
		const navCancel = new NavigationCancel(t.id, this.urlSerializer.serialize(t.extractedUrl), reason, code);
		this.events.next(navCancel);
		t.resolve(false);
	}
	isUpdatingInternalState() {
		var _this$currentTransiti3, _this$currentTransiti4;
		return ((_this$currentTransiti3 = this.currentTransition) === null || _this$currentTransiti3 === void 0 ? void 0 : _this$currentTransiti3.extractedUrl.toString()) !== ((_this$currentTransiti4 = this.currentTransition) === null || _this$currentTransiti4 === void 0 ? void 0 : _this$currentTransiti4.currentUrlTree.toString());
	}
	isUpdatedBrowserUrl() {
		var _currentNavigation$ta;
		const currentBrowserUrl = this.urlHandlingStrategy.extract(this.urlSerializer.parse(this.location.path(true)));
		const currentNavigation = untracked(this.currentNavigation);
		const targetBrowserUrl = (_currentNavigation$ta = currentNavigation === null || currentNavigation === void 0 ? void 0 : currentNavigation.targetBrowserUrl) !== null && _currentNavigation$ta !== void 0 ? _currentNavigation$ta : currentNavigation === null || currentNavigation === void 0 ? void 0 : currentNavigation.extractedUrl;
		return currentBrowserUrl.toString() !== (targetBrowserUrl === null || targetBrowserUrl === void 0 ? void 0 : targetBrowserUrl.toString()) && !(currentNavigation === null || currentNavigation === void 0 ? void 0 : currentNavigation.extras.skipLocationChange);
	}
};
_NavigationTransitions = NavigationTransitions;
_defineProperty(NavigationTransitions, "ɵfac", function NavigationTransitions_Factory(__ngFactoryType__) {
	return new (__ngFactoryType__ || _NavigationTransitions)();
});
_defineProperty(NavigationTransitions, "ɵprov", /*@__PURE__*/ ɵɵdefineService({
	token: _NavigationTransitions,
	factory: _NavigationTransitions.ɵfac
}));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(NavigationTransitions, [{ type: Service }], () => [], null);
})();
function isBrowserTriggeredNavigation(source) {
	return source !== IMPERATIVE_NAVIGATION;
}
function rollbackState(t) {
	var _t$newlyCreatedRoutes2;
	for (const r of (_t$newlyCreatedRoutes2 = t.newlyCreatedRoutes) !== null && _t$newlyCreatedRoutes2 !== void 0 ? _t$newlyCreatedRoutes2 : []) {
		var _r$_localInjector;
		(_r$_localInjector = r._localInjector) === null || _r$_localInjector === void 0 || _r$_localInjector.destroy();
		r._localInjector = void 0;
	}
	resetPendingRoutes(t.targetRouterState);
}
function resetPendingRoutes(targetRouterState) {
	if (!targetRouterState) return;
	const traverse = (node) => {
		var _node$value$pending;
		(_node$value$pending = node.value.pending) === null || _node$value$pending === void 0 || _node$value$pending.set(false);
		node.children.forEach(traverse);
	};
	traverse(targetRouterState._root);
}
var ROUTE_INJECTOR_CLEANUP = new InjectionToken(typeof ngDevMode === "undefined" || ngDevMode ? "RouteInjectorCleanup" : "");
function routeInjectorCleanup(routeReuseStrategy, routerState, config) {
	var _routeReuseStrategy$r;
	const activeRoutes = /* @__PURE__ */ new Set();
	if (routerState.snapshot.root) collectDescendants(routerState.snapshot.root, activeRoutes);
	const storedHandles = ((_routeReuseStrategy$r = routeReuseStrategy.retrieveStoredRouteHandles) === null || _routeReuseStrategy$r === void 0 ? void 0 : _routeReuseStrategy$r.call(routeReuseStrategy)) || [];
	for (const handle of storedHandles) {
		var _internalHandle$route;
		const internalHandle = handle;
		if (internalHandle === null || internalHandle === void 0 || (_internalHandle$route = internalHandle.route) === null || _internalHandle$route === void 0 || (_internalHandle$route = _internalHandle$route.value) === null || _internalHandle$route === void 0 ? void 0 : _internalHandle$route.snapshot) {
			for (const snapshot of internalHandle.route.value.snapshot.pathFromRoot) if (snapshot.routeConfig) activeRoutes.add(snapshot.routeConfig);
		}
	}
	destroyUnusedInjectors(config, activeRoutes, routeReuseStrategy, false);
}
function collectDescendants(snapshot, activeRoutes) {
	if (snapshot.routeConfig) activeRoutes.add(snapshot.routeConfig);
	for (const child of snapshot.children) collectDescendants(child, activeRoutes);
}
function destroyUnusedInjectors(routes, activeRoutes, strategy, inheritedForceDestroy) {
	for (const route of routes) {
		var _strategy$shouldDestr, _strategy$shouldDestr2;
		const shouldDestroyCurrentRoute = inheritedForceDestroy || !!((route._injector || route._loadedInjector) && !activeRoutes.has(route) && ((_strategy$shouldDestr = (_strategy$shouldDestr2 = strategy.shouldDestroyInjector) === null || _strategy$shouldDestr2 === void 0 ? void 0 : _strategy$shouldDestr2.call(strategy, route)) !== null && _strategy$shouldDestr !== void 0 ? _strategy$shouldDestr : false));
		if (route.children) destroyUnusedInjectors(route.children, activeRoutes, strategy, shouldDestroyCurrentRoute);
		if (route.loadChildren && route._loadedRoutes) destroyUnusedInjectors(route._loadedRoutes, activeRoutes, strategy, shouldDestroyCurrentRoute);
		if (shouldDestroyCurrentRoute) {
			if (route._injector) {
				route._injector.destroy();
				route._injector = void 0;
			}
			if (route._loadedInjector) {
				route._loadedInjector.destroy();
				route._loadedInjector = void 0;
			}
		}
	}
}
function destroyDetachedRouteHandle(handle) {
	const internalHandle = handle;
	if (internalHandle && internalHandle.componentRef) {
		var _internalHandle$route2;
		internalHandle.componentRef.destroy();
		(_internalHandle$route2 = internalHandle.route.value._localInjector) === null || _internalHandle$route2 === void 0 || _internalHandle$route2.destroy();
	}
}
var RouteReuseStrategy = class {};
_RouteReuseStrategy = RouteReuseStrategy;
_defineProperty(RouteReuseStrategy, "ɵfac", function RouteReuseStrategy_Factory(__ngFactoryType__) {
	return new (__ngFactoryType__ || _RouteReuseStrategy)();
});
_defineProperty(RouteReuseStrategy, "ɵprov", /*@__PURE__*/ ɵɵdefineService({
	token: _RouteReuseStrategy,
	factory: () => {
		return (() => {
			return inject(DefaultRouteReuseStrategy);
		})();
	}
}));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(RouteReuseStrategy, [{
		type: Service,
		args: [{ factory: () => inject(DefaultRouteReuseStrategy) }]
	}], null, null);
})();
var BaseRouteReuseStrategy = class {
	shouldDetach(route) {
		return false;
	}
	store(route, detachedTree) {}
	shouldAttach(route) {
		return false;
	}
	retrieve(route) {
		return null;
	}
	shouldReuseRoute(future, curr) {
		return future.routeConfig === curr.routeConfig;
	}
	shouldDestroyInjector(route) {
		return true;
	}
};
var DefaultRouteReuseStrategy = class extends BaseRouteReuseStrategy {};
_DefaultRouteReuseStrategy = DefaultRouteReuseStrategy;
_defineProperty(DefaultRouteReuseStrategy, "ɵfac", function DefaultRouteReuseStrategy_Factory(__ngFactoryType__) {
	return new (__ngFactoryType__ || _DefaultRouteReuseStrategy)();
});
_defineProperty(DefaultRouteReuseStrategy, "ɵprov", /*@__PURE__*/ ɵɵdefineService({
	token: _DefaultRouteReuseStrategy,
	factory: _DefaultRouteReuseStrategy.ɵfac
}));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(DefaultRouteReuseStrategy, [{ type: Service }], null, null);
})();
var StateManager = class {
	constructor() {
		_defineProperty(this, "urlSerializer", inject(UrlSerializer));
		_defineProperty(this, "options", inject(ROUTER_CONFIGURATION, { optional: true }) || {});
		_defineProperty(this, "canceledNavigationResolution", this.options.canceledNavigationResolution || "replace");
		_defineProperty(this, "location", inject(Location));
		_defineProperty(this, "urlHandlingStrategy", inject(UrlHandlingStrategy));
		_defineProperty(this, "urlUpdateStrategy", this.options.urlUpdateStrategy || "deferred");
		_defineProperty(this, "currentUrlTree", new UrlTree());
		_defineProperty(this, "rawUrlTree", this.currentUrlTree);
		_defineProperty(this, "routerState", createEmptyState(null, inject(EnvironmentInjector)));
		_defineProperty(this, "_stateMemento", this.createStateMemento());
	}
	getCurrentUrlTree() {
		return this.currentUrlTree;
	}
	getRawUrlTree() {
		return this.rawUrlTree;
	}
	createBrowserPath({ finalUrl, initialUrl, targetBrowserUrl }) {
		const rawUrl = finalUrl !== void 0 ? this.urlHandlingStrategy.merge(finalUrl, initialUrl) : initialUrl;
		const url = targetBrowserUrl !== null && targetBrowserUrl !== void 0 ? targetBrowserUrl : rawUrl;
		return url instanceof UrlTree ? this.urlSerializer.serialize(url) : url;
	}
	routerUrlState(navigation) {
		if ((navigation === null || navigation === void 0 ? void 0 : navigation.targetBrowserUrl) === void 0 || (navigation === null || navigation === void 0 ? void 0 : navigation.finalUrl) === void 0) return {};
		return { ɵrouterUrl: this.urlSerializer.serialize(navigation.finalUrl) };
	}
	commitTransition({ targetRouterState, finalUrl, initialUrl }) {
		if (finalUrl && targetRouterState) {
			this.currentUrlTree = finalUrl;
			this.rawUrlTree = this.urlHandlingStrategy.merge(finalUrl, initialUrl);
			this.routerState = targetRouterState;
		} else this.rawUrlTree = initialUrl;
	}
	getRouterState() {
		return this.routerState;
	}
	get stateMemento() {
		return this._stateMemento;
	}
	updateStateMemento() {
		this._stateMemento = this.createStateMemento();
	}
	createStateMemento() {
		return {
			rawUrlTree: this.rawUrlTree,
			currentUrlTree: this.currentUrlTree,
			routerState: this.routerState
		};
	}
	restoredState() {
		return this.location.getState();
	}
};
_StateManager = StateManager;
_defineProperty(StateManager, "ɵfac", function StateManager_Factory(__ngFactoryType__) {
	return new (__ngFactoryType__ || _StateManager)();
});
_defineProperty(StateManager, "ɵprov", /*@__PURE__*/ ɵɵdefineService({
	token: _StateManager,
	factory: () => {
		return (() => {
			return inject(HistoryStateManager);
		})();
	}
}));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(StateManager, [{
		type: Service,
		args: [{ factory: () => inject(HistoryStateManager) }]
	}], null, null);
})();
var HistoryStateManager = class extends StateManager {
	constructor(..._args) {
		super(..._args);
		_defineProperty(this, "currentPageId", 0);
		_defineProperty(this, "lastSuccessfulId", -1);
	}
	get browserPageId() {
		var _this$restoredState$, _this$restoredState;
		if (this.canceledNavigationResolution !== "computed") return this.currentPageId;
		return (_this$restoredState$ = (_this$restoredState = this.restoredState()) === null || _this$restoredState === void 0 ? void 0 : _this$restoredState.ɵrouterPageId) !== null && _this$restoredState$ !== void 0 ? _this$restoredState$ : this.currentPageId;
	}
	registerNonRouterCurrentEntryChangeListener(listener) {
		return this.location.subscribe((event) => {
			if (event["type"] === "popstate") setTimeout(() => {
				listener(event["url"], event.state, "popstate", { replaceUrl: true }, event.hasUAVisualTransition);
			});
		});
	}
	handleRouterEvent(e, currentTransition) {
		if (e instanceof NavigationStart) this.updateStateMemento();
		else if (e instanceof NavigationSkipped) this.commitTransition(currentTransition);
		else if (e instanceof RoutesRecognized) {
			if (this.urlUpdateStrategy === "eager") {
				if (!currentTransition.extras.skipLocationChange) this.setBrowserUrl(this.createBrowserPath(currentTransition), currentTransition);
			}
		} else if (e instanceof BeforeActivateRoutes) {
			this.commitTransition(currentTransition);
			if (this.urlUpdateStrategy === "deferred" && !currentTransition.extras.skipLocationChange) this.setBrowserUrl(this.createBrowserPath(currentTransition), currentTransition);
		} else if (e instanceof NavigationCancel && !isRedirectingEvent(e)) this.restoreHistory(currentTransition);
		else if (e instanceof NavigationError) this.restoreHistory(currentTransition, true);
		else if (e instanceof NavigationEnd) {
			this.lastSuccessfulId = e.id;
			this.currentPageId = this.browserPageId;
		}
	}
	setBrowserUrl(path, navigation) {
		const { extras, id } = navigation;
		const { replaceUrl, state } = extras;
		if (this.location.isCurrentPathEqualTo(path) || !!replaceUrl) {
			const currentBrowserPageId = this.browserPageId;
			const newState = _objectSpread2(_objectSpread2({}, state), this.generateNgRouterState(id, currentBrowserPageId, navigation));
			this.location.replaceState(path, "", newState);
		} else {
			const newState = _objectSpread2(_objectSpread2({}, state), this.generateNgRouterState(id, this.browserPageId + 1, navigation));
			this.location.go(path, "", newState);
		}
	}
	restoreHistory(navigation, restoringFromCaughtError = false) {
		if (this.canceledNavigationResolution === "computed") {
			const currentBrowserPageId = this.browserPageId;
			const targetPagePosition = this.currentPageId - currentBrowserPageId;
			if (targetPagePosition !== 0) this.location.historyGo(targetPagePosition);
			else if (this.getCurrentUrlTree() === navigation.finalUrl && targetPagePosition === 0) {
				this.resetInternalState(navigation);
				this.resetUrlToCurrentUrlTree();
			}
		} else if (this.canceledNavigationResolution === "replace") {
			if (restoringFromCaughtError) this.resetInternalState(navigation);
			this.resetUrlToCurrentUrlTree();
		}
	}
	resetInternalState({ finalUrl }) {
		this.routerState = this.stateMemento.routerState;
		this.currentUrlTree = this.stateMemento.currentUrlTree;
		this.rawUrlTree = this.urlHandlingStrategy.merge(this.currentUrlTree, finalUrl !== null && finalUrl !== void 0 ? finalUrl : this.rawUrlTree);
	}
	resetUrlToCurrentUrlTree() {
		this.location.replaceState(this.urlSerializer.serialize(this.getRawUrlTree()), "", this.generateNgRouterState(this.lastSuccessfulId, this.currentPageId));
	}
	generateNgRouterState(navigationId, routerPageId, navigation) {
		if (this.canceledNavigationResolution === "computed") return _objectSpread2({
			navigationId,
			ɵrouterPageId: routerPageId
		}, this.routerUrlState(navigation));
		return _objectSpread2({ navigationId }, this.routerUrlState(navigation));
	}
};
_HistoryStateManager = HistoryStateManager;
_defineProperty(HistoryStateManager, "ɵfac", function HistoryStateManager_Factory(__ngFactoryType__) {
	return new (__ngFactoryType__ || _HistoryStateManager)();
});
_defineProperty(HistoryStateManager, "ɵprov", /*@__PURE__*/ ɵɵdefineService({
	token: _HistoryStateManager,
	factory: _HistoryStateManager.ɵfac
}));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(HistoryStateManager, [{ type: Service }], null, null);
})();
function afterNextNavigation(router, action) {
	router.events.pipe(filter((e) => e instanceof NavigationEnd || e instanceof NavigationCancel || e instanceof NavigationError || e instanceof NavigationSkipped), map((e) => {
		if (e instanceof NavigationEnd || e instanceof NavigationSkipped) return 0;
		return (e instanceof NavigationCancel ? e.code === NavigationCancellationCode.Redirect || e.code === NavigationCancellationCode.SupersededByNewNavigation : false) ? 2 : 1;
	}), filter((result) => result !== 2), take(1)).subscribe(() => {
		action();
	});
}
var Router = class {
	get currentUrlTree() {
		return this.stateManager.getCurrentUrlTree();
	}
	get rawUrlTree() {
		return this.stateManager.getRawUrlTree();
	}
	get events() {
		return this._events;
	}
	get routerState() {
		return this.stateManager.getRouterState();
	}
	constructor() {
		var _inject$flat, _inject;
		_defineProperty(this, "disposed", false);
		_defineProperty(this, "nonRouterCurrentEntryChangeSubscription", void 0);
		_defineProperty(this, "console", inject(Console));
		_defineProperty(this, "stateManager", inject(StateManager));
		_defineProperty(this, "options", inject(ROUTER_CONFIGURATION, { optional: true }) || {});
		_defineProperty(this, "pendingTasks", inject(PendingTasksInternal));
		_defineProperty(this, "urlUpdateStrategy", this.options.urlUpdateStrategy || "deferred");
		_defineProperty(this, "navigationTransitions", inject(NavigationTransitions));
		_defineProperty(this, "urlSerializer", inject(UrlSerializer));
		_defineProperty(this, "location", inject(Location));
		_defineProperty(this, "urlHandlingStrategy", inject(UrlHandlingStrategy));
		_defineProperty(this, "injector", inject(EnvironmentInjector));
		_defineProperty(this, "_events", new Subject());
		_defineProperty(this, "navigated", false);
		_defineProperty(this, "routeReuseStrategy", inject(RouteReuseStrategy));
		_defineProperty(this, "injectorCleanup", inject(ROUTE_INJECTOR_CLEANUP, { optional: true }));
		_defineProperty(this, "onSameUrlNavigation", this.options.onSameUrlNavigation || "ignore");
		_defineProperty(this, "config", (_inject$flat = (_inject = inject(ROUTES, { optional: true })) === null || _inject === void 0 ? void 0 : _inject.flat()) !== null && _inject$flat !== void 0 ? _inject$flat : []);
		_defineProperty(this, "componentInputBindingEnabled", !!inject(INPUT_BINDER, { optional: true }));
		_defineProperty(this, "currentNavigation", this.navigationTransitions.currentNavigation.asReadonly());
		_defineProperty(this, "eventsSubscription", new Subscription());
		this.resetConfig(this.config);
		this.navigationTransitions.setupNavigations(this).subscribe({ error: (e) => {} });
		this.subscribeToNavigationEvents();
	}
	subscribeToNavigationEvents() {
		const subscription = this.navigationTransitions.events.subscribe((e) => {
			try {
				const currentTransition = this.navigationTransitions.currentTransition;
				const currentNavigation = untracked(this.navigationTransitions.currentNavigation);
				if (currentTransition !== null && currentNavigation !== null) {
					this.stateManager.handleRouterEvent(e, currentNavigation);
					if (e instanceof NavigationCancel && e.code !== NavigationCancellationCode.Redirect && e.code !== NavigationCancellationCode.SupersededByNewNavigation) this.navigated = true;
					else if (e instanceof NavigationEnd) {
						var _this$injectorCleanup;
						this.navigated = true;
						(_this$injectorCleanup = this.injectorCleanup) === null || _this$injectorCleanup === void 0 || _this$injectorCleanup.call(this, this.routeReuseStrategy, this.routerState, this.config);
					} else if (e instanceof RedirectRequest) {
						const opts = e.navigationBehaviorOptions;
						const mergedTree = this.urlHandlingStrategy.merge(e.url, currentTransition.currentRawUrl);
						const extras = _objectSpread2({
							scroll: currentTransition.extras.scroll,
							browserUrl: currentTransition.extras.browserUrl,
							info: currentTransition.extras.info,
							skipLocationChange: currentTransition.extras.skipLocationChange,
							replaceUrl: currentTransition.extras.replaceUrl || this.urlUpdateStrategy === "eager" || isBrowserTriggeredNavigation(currentTransition.source)
						}, opts);
						this.scheduleNavigation(mergedTree, IMPERATIVE_NAVIGATION, null, extras, currentTransition.hasUAVisualTransition, {
							resolve: currentTransition.resolve,
							reject: currentTransition.reject,
							promise: currentTransition.promise
						});
					}
				}
				if (isPublicRouterEvent(e)) this._events.next(e);
			} catch (e) {
				this.navigationTransitions.transitionAbortWithErrorSubject.next(e);
			}
		});
		this.eventsSubscription.add(subscription);
	}
	resetRootComponentType(rootComponentType) {
		this.routerState.root.component = rootComponentType;
		this.navigationTransitions.rootComponentType = rootComponentType;
	}
	initialNavigation() {
		this.setUpLocationChangeListener();
		if (!this.navigationTransitions.hasRequestedNavigation) this.navigateToSyncWithBrowser(this.location.path(true), IMPERATIVE_NAVIGATION, this.stateManager.restoredState(), { replaceUrl: true });
	}
	setUpLocationChangeListener() {
		var _this$nonRouterCurren;
		(_this$nonRouterCurren = this.nonRouterCurrentEntryChangeSubscription) !== null && _this$nonRouterCurren !== void 0 || (this.nonRouterCurrentEntryChangeSubscription = this.stateManager.registerNonRouterCurrentEntryChangeListener((url, state, source, extras, hasUAVisualTransition) => {
			this.navigateToSyncWithBrowser(url, source, state, extras, hasUAVisualTransition);
		}));
	}
	navigateToSyncWithBrowser(url, source, state, extras, hasUAVisualTransition) {
		var _state$ɵrouterUrl;
		const restoredState = (state === null || state === void 0 ? void 0 : state.navigationId) ? state : null;
		const routerUrl = (_state$ɵrouterUrl = state === null || state === void 0 ? void 0 : state.ɵrouterUrl) !== null && _state$ɵrouterUrl !== void 0 ? _state$ɵrouterUrl : url;
		if (state === null || state === void 0 ? void 0 : state.ɵrouterUrl) extras = _objectSpread2(_objectSpread2({}, extras), {}, { browserUrl: url });
		if (state) {
			const stateCopy = _objectSpread2({}, state);
			delete stateCopy.navigationId;
			delete stateCopy.ɵrouterPageId;
			delete stateCopy.ɵrouterUrl;
			if (Object.keys(stateCopy).length !== 0) extras.state = stateCopy;
		}
		const urlTree = this.parseUrl(routerUrl);
		this.scheduleNavigation(urlTree, source, restoredState, extras, hasUAVisualTransition).catch((e) => {
			if (this.disposed) return;
			this.injector.get(INTERNAL_APPLICATION_ERROR_HANDLER)(e);
		});
	}
	get url() {
		return this.serializeUrl(this.currentUrlTree);
	}
	getCurrentNavigation() {
		return untracked(this.navigationTransitions.currentNavigation);
	}
	get lastSuccessfulNavigation() {
		return this.navigationTransitions.lastSuccessfulNavigation;
	}
	resetConfig(config) {
		(typeof ngDevMode === "undefined" || ngDevMode) && validateConfig(config);
		this.config = config.map(standardizeConfig);
		this.navigated = false;
	}
	ngOnDestroy() {
		this.dispose();
	}
	dispose() {
		var _this$nonRouterCurren2;
		this._events.unsubscribe();
		this.navigationTransitions.complete();
		(_this$nonRouterCurren2 = this.nonRouterCurrentEntryChangeSubscription) === null || _this$nonRouterCurren2 === void 0 || _this$nonRouterCurren2.unsubscribe();
		this.nonRouterCurrentEntryChangeSubscription = void 0;
		this.disposed = true;
		this.eventsSubscription.unsubscribe();
	}
	createUrlTree(commands, navigationExtras = {}) {
		const { relativeTo, queryParams, fragment, queryParamsHandling, preserveFragment } = navigationExtras;
		const f = preserveFragment ? this.currentUrlTree.fragment : fragment;
		let q = null;
		switch (queryParamsHandling !== null && queryParamsHandling !== void 0 ? queryParamsHandling : this.options.defaultQueryParamsHandling) {
			case "merge":
				q = _objectSpread2(_objectSpread2({}, this.currentUrlTree.queryParams), queryParams);
				break;
			case "preserve":
				q = this.currentUrlTree.queryParams;
				break;
			default: q = queryParams || null;
		}
		if (q !== null) q = this.removeEmptyProps(q);
		let relativeToUrlSegmentGroup;
		try {
			relativeToUrlSegmentGroup = createSegmentGroupFromRoute(relativeTo ? relativeTo.snapshot : this.routerState.snapshot.root);
		} catch (e) {
			if (typeof commands[0] !== "string" || commands[0][0] !== "/") commands = [];
			relativeToUrlSegmentGroup = this.currentUrlTree.root;
		}
		return createUrlTreeFromSegmentGroup(relativeToUrlSegmentGroup, commands, q, f !== null && f !== void 0 ? f : null, this.urlSerializer);
	}
	navigateByUrl(url, extras = { skipLocationChange: false }) {
		const urlTree = isUrlTree(url) ? url : this.parseUrl(url);
		const mergedTree = this.urlHandlingStrategy.merge(urlTree, this.rawUrlTree);
		return this.scheduleNavigation(mergedTree, IMPERATIVE_NAVIGATION, null, extras);
	}
	navigate(commands, extras = { skipLocationChange: false }) {
		validateCommands(commands);
		return this.navigateByUrl(this.createUrlTree(commands, extras), extras);
	}
	serializeUrl(url) {
		return this.urlSerializer.serialize(url);
	}
	parseUrl(url) {
		try {
			return this.urlSerializer.parse(url);
		} catch (e) {
			this.console.warn(formatRuntimeError(4018, ngDevMode && `Error parsing URL ${url}. Falling back to '/' instead. \n` + e));
			return this.urlSerializer.parse("/");
		}
	}
	isActive(url, matchOptions) {
		let options;
		if (matchOptions === true) options = _objectSpread2({}, exactMatchOptions);
		else if (matchOptions === false) options = _objectSpread2({}, subsetMatchOptions);
		else options = _objectSpread2(_objectSpread2({}, subsetMatchOptions), matchOptions);
		if (isUrlTree(url)) return containsTree(this.currentUrlTree, url, options);
		const urlTree = this.parseUrl(url);
		return containsTree(this.currentUrlTree, urlTree, options);
	}
	removeEmptyProps(params) {
		return Object.entries(params).reduce((result, [key, value]) => {
			if (value !== null && value !== void 0) result[key] = value;
			return result;
		}, {});
	}
	scheduleNavigation(rawUrl, source, restoredState, extras, hasUAVisualTransition, priorPromise) {
		if (this.disposed) return Promise.resolve(false);
		let resolve;
		let reject;
		let promise;
		if (priorPromise) {
			resolve = priorPromise.resolve;
			reject = priorPromise.reject;
			promise = priorPromise.promise;
		} else promise = new Promise((res, rej) => {
			resolve = res;
			reject = rej;
		});
		const taskId = this.pendingTasks.add();
		afterNextNavigation(this, () => {
			queueMicrotask(() => this.pendingTasks.remove(taskId));
		});
		this.navigationTransitions.handleNavigationRequest({
			source,
			restoredState,
			currentUrlTree: this.currentUrlTree,
			currentRawUrl: this.currentUrlTree,
			rawUrl,
			extras,
			hasUAVisualTransition,
			resolve,
			reject,
			promise,
			currentSnapshot: this.routerState.snapshot,
			currentRouterState: this.routerState
		});
		return promise.catch(Promise.reject.bind(Promise));
	}
};
_Router = Router;
_defineProperty(Router, "ɵfac", function Router_Factory(__ngFactoryType__) {
	return new (__ngFactoryType__ || _Router)();
});
_defineProperty(Router, "ɵprov", /*@__PURE__*/ ɵɵdefineService({
	token: _Router,
	factory: _Router.ɵfac
}));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(Router, [{ type: Service }], () => [], null);
})();
function validateCommands(commands) {
	for (let i = 0; i < commands.length; i++) {
		const cmd = commands[i];
		if (cmd == null) throw new RuntimeError(4008, (typeof ngDevMode === "undefined" || ngDevMode) && `The requested path contains ${cmd} segment at index ${i}`);
	}
}
//#endregion
//#region node_modules/@angular/router/fesm2022/_router_module-chunk.mjs
/**
* @license Angular v22.2.0
* (c) 2010-2026 Google LLC. https://angular.dev/
* License: MIT
*/
var _ReactiveRouterState;
var _RouterLink;
var _RouterLinkActive;
var _PreloadAllModules;
var _NoPreloading;
var _RouterPreloader;
var _RouterScroller;
var _NavigationStateManager;
var _RouterModule;
var BLOCKING_SYMBOL = /* @__PURE__ */ Symbol(typeof ngDevMode === "undefined" || ngDevMode ? "__isBlocking" : "");
var SOURCE_RESOURCE_SYMBOL = /* @__PURE__ */ Symbol(typeof ngDevMode === "undefined" || ngDevMode ? "__sourceResource" : "");
function nonBlocking(res) {
	res[BLOCKING_SYMBOL] = false;
	return res;
}
function routerResource(source) {
	ngDevMode && assertInInjectionContext(routerResource);
	const injector = inject(Injector);
	const { snapshot: snapshotSignal, frozenSnapshot } = createTransactionalSnapshot(source, injector.get(Router), injector);
	const res = resourceFromSnapshots(snapshotSignal);
	res[SOURCE_RESOURCE_SYMBOL] = source;
	res[BLOCKING_SYMBOL] = source[BLOCKING_SYMBOL] !== false;
	res.reload = function() {
		var _source$reload, _source$reload2;
		if (frozenSnapshot() !== null) return false;
		return (_source$reload = (_source$reload2 = source.reload) === null || _source$reload2 === void 0 ? void 0 : _source$reload2.call(source)) !== null && _source$reload !== void 0 ? _source$reload : false;
	};
	return res;
}
function createTransactionalSnapshot(source, router, injector) {
	const frozenSnapshot = signal(null, ...ngDevMode ? [{ debugName: "frozenSnapshot" }] : []);
	const isRollbackRecoveryPending = signal(false, ...ngDevMode ? [{ debugName: "isRollbackRecoveryPending" }] : []);
	const sub = router.events.subscribe((e) => {
		if (e instanceof NavigationStart) {
			isRollbackRecoveryPending.set(false);
			if (frozenSnapshot() === null) frozenSnapshot.set(source.snapshot());
		} else if (e instanceof NavigationEnd) {
			frozenSnapshot.set(null);
			isRollbackRecoveryPending.set(false);
		} else if (e instanceof NavigationSkipped) {
			if (frozenSnapshot() !== null) isRollbackRecoveryPending.set(true);
		} else if (e instanceof NavigationCancel || e instanceof NavigationError) {
			if (!(e instanceof NavigationError || e instanceof NavigationCancel && e.code !== NavigationCancellationCode.SupersededByNewNavigation && e.code !== NavigationCancellationCode.Redirect)) return;
			isRollbackRecoveryPending.set(true);
		}
	});
	injector.get(DestroyRef).onDestroy(() => sub.unsubscribe());
	effect(() => {
		if (isRollbackRecoveryPending() && !source.isLoading()) {
			isRollbackRecoveryPending.set(false);
			frozenSnapshot.set(null);
		}
	}, { injector });
	return {
		snapshot: computed(() => {
			var _frozenSnapshot;
			return (_frozenSnapshot = frozenSnapshot()) !== null && _frozenSnapshot !== void 0 ? _frozenSnapshot : source.snapshot();
		}),
		frozenSnapshot
	};
}
function createResourceOutletBindingEffects(componentRef, route) {
	const createdEffects = [];
	const handledKeys = [];
	const mirror = route.component ? reflectComponentType(route.component) : null;
	const resources = route.resources;
	if (!mirror || !resources) return {
		createdEffects,
		handledKeys
	};
	for (const { templateName } of mirror.inputs) {
		const resource = resources[templateName];
		if (!resource || !resource[BLOCKING_SYMBOL]) continue;
		const effectRef = effect(() => {
			componentRef.setInput(templateName, resource.value());
		}, _objectSpread2(_objectSpread2({}, ngDevMode ? { debugName: "effectRef" } : {}), {}, { injector: componentRef.injector }));
		createdEffects.push(effectRef);
		handledKeys.push(templateName);
	}
	return {
		createdEffects,
		handledKeys
	};
}
var ReactiveRouterState = class {
	constructor() {
		var _this$router$events;
		_defineProperty(this, "router", inject(Router));
		_defineProperty(this, "stateManager", inject(StateManager));
		_defineProperty(this, "fragment", signal("", ...ngDevMode ? [{ debugName: "fragment" }] : []));
		_defineProperty(this, "queryParams", signal({}, ...ngDevMode ? [{ debugName: "queryParams" }] : []));
		_defineProperty(this, "path", signal("", ...ngDevMode ? [{ debugName: "path" }] : []));
		_defineProperty(this, "serializer", inject(UrlSerializer));
		this.updateState();
		(_this$router$events = this.router.events) === null || _this$router$events === void 0 || _this$router$events.subscribe((e) => {
			if (e instanceof NavigationEnd) this.updateState();
		});
	}
	updateState() {
		const { fragment, root, queryParams } = this.stateManager.getCurrentUrlTree();
		this.fragment.set(fragment);
		this.queryParams.set(queryParams);
		this.path.set(this.serializer.serialize(new UrlTree(root)));
	}
};
_ReactiveRouterState = ReactiveRouterState;
_defineProperty(ReactiveRouterState, "ɵfac", function ReactiveRouterState_Factory(__ngFactoryType__) {
	return new (__ngFactoryType__ || _ReactiveRouterState)();
});
_defineProperty(ReactiveRouterState, "ɵprov", /*@__PURE__*/ ɵɵdefineService({
	token: _ReactiveRouterState,
	factory: _ReactiveRouterState.ɵfac
}));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(ReactiveRouterState, [{ type: Service }], () => [], null);
})();
var RouterLink = class {
	get href() {
		return untracked(this.reactiveHref);
	}
	set href(value) {
		this.reactiveHref.set(value);
	}
	set target(value) {
		this._target.set(value);
	}
	get target() {
		return untracked(this._target);
	}
	set queryParams(value) {
		this._queryParams.set(value);
	}
	get queryParams() {
		return untracked(this._queryParams);
	}
	set fragment(value) {
		this._fragment.set(value);
	}
	get fragment() {
		return untracked(this._fragment);
	}
	set queryParamsHandling(value) {
		this._queryParamsHandling.set(value);
	}
	get queryParamsHandling() {
		return untracked(this._queryParamsHandling);
	}
	set state(value) {
		this._state.set(value);
	}
	get state() {
		return untracked(this._state);
	}
	set info(value) {
		this._info.set(value);
	}
	get info() {
		return untracked(this._info);
	}
	set relativeTo(value) {
		this._relativeTo.set(value);
	}
	get relativeTo() {
		return untracked(this._relativeTo);
	}
	set preserveFragment(value) {
		this._preserveFragment.set(value);
	}
	get preserveFragment() {
		return untracked(this._preserveFragment);
	}
	set skipLocationChange(value) {
		this._skipLocationChange.set(value);
	}
	get skipLocationChange() {
		return untracked(this._skipLocationChange);
	}
	set replaceUrl(value) {
		this._replaceUrl.set(value);
	}
	get replaceUrl() {
		return untracked(this._replaceUrl);
	}
	constructor(router, route, tabIndexAttribute, renderer, el, locationStrategy) {
		var _el$nativeElement$tag, _customElements$get, _customElements$get$i;
		_defineProperty(this, "router", void 0);
		_defineProperty(this, "route", void 0);
		_defineProperty(this, "tabIndexAttribute", void 0);
		_defineProperty(this, "renderer", void 0);
		_defineProperty(this, "el", void 0);
		_defineProperty(this, "locationStrategy", void 0);
		_defineProperty(this, "hrefAttributeValue", inject(new HostAttributeToken("href"), { optional: true }));
		_defineProperty(this, "reactiveHref", linkedSignal(() => {
			if (!this.isAnchorElement) return this.hrefAttributeValue;
			return this.computeHref(this._urlTree());
		}, ...ngDevMode ? [{ debugName: "reactiveHref" }] : []));
		_defineProperty(this, "_target", signal(void 0, ...ngDevMode ? [{ debugName: "_target" }] : []));
		_defineProperty(this, "_queryParams", signal(void 0, _objectSpread2(_objectSpread2({}, ngDevMode ? { debugName: "_queryParams" } : {}), {}, { equal: () => false })));
		_defineProperty(this, "_fragment", signal(void 0, ...ngDevMode ? [{ debugName: "_fragment" }] : []));
		_defineProperty(this, "_queryParamsHandling", signal(void 0, ...ngDevMode ? [{ debugName: "_queryParamsHandling" }] : []));
		_defineProperty(this, "_state", signal(void 0, _objectSpread2(_objectSpread2({}, ngDevMode ? { debugName: "_state" } : {}), {}, { equal: () => false })));
		_defineProperty(this, "_info", signal(void 0, _objectSpread2(_objectSpread2({}, ngDevMode ? { debugName: "_info" } : {}), {}, { equal: () => false })));
		_defineProperty(this, "_relativeTo", signal(void 0, ...ngDevMode ? [{ debugName: "_relativeTo" }] : []));
		_defineProperty(this, "_preserveFragment", signal(false, ...ngDevMode ? [{ debugName: "_preserveFragment" }] : []));
		_defineProperty(this, "_skipLocationChange", signal(false, ...ngDevMode ? [{ debugName: "_skipLocationChange" }] : []));
		_defineProperty(this, "_replaceUrl", signal(false, ...ngDevMode ? [{ debugName: "_replaceUrl" }] : []));
		_defineProperty(this, "browserUrl", input(void 0, ...ngDevMode ? [{ debugName: "browserUrl" }] : []));
		_defineProperty(this, "isAnchorElement", void 0);
		_defineProperty(this, "onChanges", new Subject());
		_defineProperty(this, "applicationErrorHandler", inject(INTERNAL_APPLICATION_ERROR_HANDLER));
		_defineProperty(this, "options", inject(ROUTER_CONFIGURATION, { optional: true }));
		_defineProperty(this, "reactiveRouterState", inject(ReactiveRouterState));
		_defineProperty(this, "routerLinkInput", signal(null, ...ngDevMode ? [{ debugName: "routerLinkInput" }] : []));
		_defineProperty(this, "_urlTree", computed(() => {
			var _this$options;
			this.reactiveRouterState.path();
			if (this._preserveFragment()) this.reactiveRouterState.fragment();
			const shouldTrackParams = (handling) => handling === "preserve" || handling === "merge";
			if (shouldTrackParams(this._queryParamsHandling()) || shouldTrackParams((_this$options = this.options) === null || _this$options === void 0 ? void 0 : _this$options.defaultQueryParamsHandling)) this.reactiveRouterState.queryParams();
			const routerLinkInput = this.routerLinkInput();
			if (routerLinkInput === null || !this.router.createUrlTree) return null;
			else if (isUrlTree(routerLinkInput)) return routerLinkInput;
			return this.router.createUrlTree(routerLinkInput, {
				relativeTo: this._relativeTo() !== void 0 ? this._relativeTo() : this.route,
				queryParams: this._queryParams(),
				fragment: this._fragment(),
				queryParamsHandling: this._queryParamsHandling(),
				preserveFragment: this._preserveFragment()
			});
		}, _objectSpread2(_objectSpread2({}, ngDevMode ? { debugName: "_urlTree" } : {}), {}, { equal: (a, b) => this.computeHref(a) === this.computeHref(b) })));
		this.router = router;
		this.route = route;
		this.tabIndexAttribute = tabIndexAttribute;
		this.renderer = renderer;
		this.el = el;
		this.locationStrategy = locationStrategy;
		const tagName = (_el$nativeElement$tag = el.nativeElement.tagName) === null || _el$nativeElement$tag === void 0 ? void 0 : _el$nativeElement$tag.toLowerCase();
		this.isAnchorElement = tagName === "a" || tagName === "area" || !!(typeof customElements === "object" && ((_customElements$get = customElements.get(tagName)) === null || _customElements$get === void 0 || (_customElements$get = _customElements$get.observedAttributes) === null || _customElements$get === void 0 || (_customElements$get$i = _customElements$get.includes) === null || _customElements$get$i === void 0 ? void 0 : _customElements$get$i.call(_customElements$get, "href")));
		if (typeof ngDevMode !== "undefined" && ngDevMode) effect(() => {
			if (isUrlTree(this.routerLinkInput()) && (this._fragment() !== void 0 || this._queryParams() || this._queryParamsHandling() || this._preserveFragment() || this._relativeTo())) throw new RuntimeError(4017, "Cannot configure queryParams or fragment when using a UrlTree as the routerLink input value.");
		});
	}
	setTabIndexIfNotOnNativeEl(newTabIndex) {
		if (this.tabIndexAttribute != null || this.isAnchorElement) return;
		this.applyAttributeValue("tabindex", newTabIndex);
	}
	ngOnChanges(changes) {
		this.onChanges.next(this);
	}
	set routerLink(commandsOrUrlTree) {
		if (commandsOrUrlTree == null) {
			this.routerLinkInput.set(null);
			this.setTabIndexIfNotOnNativeEl(null);
		} else {
			if (isUrlTree(commandsOrUrlTree)) this.routerLinkInput.set(commandsOrUrlTree);
			else this.routerLinkInput.set(Array.isArray(commandsOrUrlTree) ? commandsOrUrlTree : [commandsOrUrlTree]);
			this.setTabIndexIfNotOnNativeEl("0");
		}
	}
	onClick(button, ctrlKey, shiftKey, altKey, metaKey) {
		var _this$router$navigate;
		const urlTree = this._urlTree();
		if (urlTree === null) return true;
		if (this.isAnchorElement) {
			if (button !== 0 || ctrlKey || shiftKey || altKey || metaKey) return true;
			if (typeof this.target === "string" && this.target != "_self") return true;
		}
		const browserUrl = this.browserUrl();
		const extras = _objectSpread2({
			skipLocationChange: this.skipLocationChange,
			replaceUrl: this.replaceUrl,
			state: this.state,
			info: this.info
		}, browserUrl !== void 0 && { browserUrl });
		(_this$router$navigate = this.router.navigateByUrl(urlTree, extras)) === null || _this$router$navigate === void 0 || _this$router$navigate.catch((e) => {
			this.applicationErrorHandler(e);
		});
		return !this.isAnchorElement;
	}
	ngOnDestroy() {}
	applyAttributeValue(attrName, attrValue) {
		const renderer = this.renderer;
		const nativeElement = this.el.nativeElement;
		if (attrValue !== null) renderer.setAttribute(nativeElement, attrName, attrValue);
		else renderer.removeAttribute(nativeElement, attrName);
	}
	get urlTree() {
		return untracked(this._urlTree);
	}
	computeHref(urlTree) {
		var _this$locationStrateg, _this$locationStrateg2;
		return urlTree !== null && this.locationStrategy ? (_this$locationStrateg = (_this$locationStrateg2 = this.locationStrategy) === null || _this$locationStrateg2 === void 0 ? void 0 : _this$locationStrateg2.prepareExternalUrl(this.router.serializeUrl(urlTree))) !== null && _this$locationStrateg !== void 0 ? _this$locationStrateg : "" : null;
	}
};
_RouterLink = RouterLink;
_defineProperty(RouterLink, "ɵfac", function RouterLink_Factory(__ngFactoryType__) {
	return new (__ngFactoryType__ || _RouterLink)(ɵɵdirectiveInject(Router), ɵɵdirectiveInject(ActivatedRoute), ɵɵinjectAttribute("tabindex"), ɵɵdirectiveInject(Renderer2), ɵɵdirectiveInject(ElementRef), ɵɵdirectiveInject(LocationStrategy));
});
_defineProperty(RouterLink, "ɵdir", /*@__PURE__*/ ɵɵdefineDirective({
	type: _RouterLink,
	selectors: [[
		"",
		"routerLink",
		""
	]],
	hostVars: 2,
	hostBindings: function RouterLink_HostBindings(rf, ctx) {
		if (rf & 1) ɵɵlistener("click", function RouterLink_click_HostBindingHandler($event) {
			return ctx.onClick($event.button, $event.ctrlKey, $event.shiftKey, $event.altKey, $event.metaKey);
		});
		if (rf & 2) ɵɵattribute("href", ctx.reactiveHref(), ɵɵsanitizeUrlOrResourceUrl)("target", ctx._target());
	},
	inputs: {
		target: "target",
		queryParams: "queryParams",
		fragment: "fragment",
		queryParamsHandling: "queryParamsHandling",
		state: "state",
		info: "info",
		relativeTo: "relativeTo",
		preserveFragment: [
			2,
			"preserveFragment",
			"preserveFragment",
			booleanAttribute
		],
		skipLocationChange: [
			2,
			"skipLocationChange",
			"skipLocationChange",
			booleanAttribute
		],
		replaceUrl: [
			2,
			"replaceUrl",
			"replaceUrl",
			booleanAttribute
		],
		browserUrl: [1, "browserUrl"],
		routerLink: "routerLink"
	},
	features: [ɵɵNgOnChangesFeature]
}));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(RouterLink, [{
		type: Directive,
		args: [{
			selector: "[routerLink]",
			host: {
				"[attr.href]": "reactiveHref()",
				"[attr.target]": "_target()"
			}
		}]
	}], () => [
		{ type: Router },
		{ type: ActivatedRoute },
		{
			type: void 0,
			decorators: [{
				type: Attribute,
				args: ["tabindex"]
			}]
		},
		{ type: Renderer2 },
		{ type: ElementRef },
		{ type: LocationStrategy }
	], {
		target: [{ type: Input }],
		queryParams: [{ type: Input }],
		fragment: [{ type: Input }],
		queryParamsHandling: [{ type: Input }],
		state: [{ type: Input }],
		info: [{ type: Input }],
		relativeTo: [{ type: Input }],
		preserveFragment: [{
			type: Input,
			args: [{ transform: booleanAttribute }]
		}],
		skipLocationChange: [{
			type: Input,
			args: [{ transform: booleanAttribute }]
		}],
		replaceUrl: [{
			type: Input,
			args: [{ transform: booleanAttribute }]
		}],
		browserUrl: [{
			type: Input,
			args: [{
				isSignal: true,
				alias: "browserUrl",
				required: false
			}]
		}],
		routerLink: [{ type: Input }],
		onClick: [{
			type: HostListener,
			args: ["click", [
				"$event.button",
				"$event.ctrlKey",
				"$event.shiftKey",
				"$event.altKey",
				"$event.metaKey"
			]]
		}]
	});
})();
var RouterLinkActive = class {
	get isActive() {
		return this._isActive;
	}
	constructor(router, element, renderer, cdr) {
		_defineProperty(this, "router", void 0);
		_defineProperty(this, "element", void 0);
		_defineProperty(this, "renderer", void 0);
		_defineProperty(this, "cdr", void 0);
		_defineProperty(this, "links", void 0);
		_defineProperty(this, "classes", []);
		_defineProperty(this, "routerEventsSubscription", void 0);
		_defineProperty(this, "linkInputChangesSubscription", void 0);
		_defineProperty(this, "_isActive", false);
		_defineProperty(this, "routerLinkActiveOptions", { exact: false });
		_defineProperty(this, "ariaCurrentWhenActive", void 0);
		_defineProperty(this, "isActiveChange", new EventEmitter());
		_defineProperty(this, "link", inject(RouterLink, { optional: true }));
		this.router = router;
		this.element = element;
		this.renderer = renderer;
		this.cdr = cdr;
		this.routerEventsSubscription = router.events.subscribe((s) => {
			if (s instanceof NavigationEnd) this.update();
		});
	}
	ngAfterContentInit() {
		of(this.links.changes, of(null)).pipe(mergeAll()).subscribe((_) => {
			this.update();
			this.subscribeToEachLinkOnChanges();
		});
	}
	subscribeToEachLinkOnChanges() {
		var _this$linkInputChange;
		(_this$linkInputChange = this.linkInputChangesSubscription) === null || _this$linkInputChange === void 0 || _this$linkInputChange.unsubscribe();
		const allLinkChanges = [...this.links.toArray(), this.link].filter((link) => !!link).map((link) => link.onChanges);
		this.linkInputChangesSubscription = from(allLinkChanges).pipe(mergeAll()).subscribe((link) => {
			if (this._isActive !== this.isLinkActive(this.router)(link)) this.update();
		});
	}
	set routerLinkActive(data) {
		if (data == null) {
			this.classes = [];
			return;
		}
		const classes = Array.isArray(data) ? data : data.split(" ");
		this.classes = classes.filter((c) => !!c);
	}
	ngOnChanges(changes) {
		this.update();
	}
	ngOnDestroy() {
		var _this$linkInputChange2;
		this.routerEventsSubscription.unsubscribe();
		(_this$linkInputChange2 = this.linkInputChangesSubscription) === null || _this$linkInputChange2 === void 0 || _this$linkInputChange2.unsubscribe();
	}
	update() {
		if (!this.links || !this.router.navigated) return;
		if (this.routerLinkActiveOptions === null && !this._isActive) return;
		queueMicrotask(() => {
			const hasActiveLinks = this.hasActiveLinks();
			this.classes.forEach((c) => {
				if (hasActiveLinks) this.renderer.addClass(this.element.nativeElement, c);
				else this.renderer.removeClass(this.element.nativeElement, c);
			});
			if (hasActiveLinks && this.ariaCurrentWhenActive !== void 0) this.renderer.setAttribute(this.element.nativeElement, "aria-current", this.ariaCurrentWhenActive.toString());
			else this.renderer.removeAttribute(this.element.nativeElement, "aria-current");
			if (this._isActive !== hasActiveLinks) {
				this._isActive = hasActiveLinks;
				this.cdr.markForCheck();
				this.isActiveChange.emit(hasActiveLinks);
			}
		});
	}
	isLinkActive(router) {
		var _opts$exact;
		const opts = this.routerLinkActiveOptions;
		if (opts === null) return () => false;
		let options;
		if (opts === void 0) options = _objectSpread2({}, subsetMatchOptions);
		else if (isActiveMatchOptions(opts)) options = opts;
		else if ((_opts$exact = opts.exact) !== null && _opts$exact !== void 0 ? _opts$exact : false) options = _objectSpread2({}, exactMatchOptions);
		else options = _objectSpread2({}, subsetMatchOptions);
		return (link) => {
			const urlTree = link.urlTree;
			return urlTree ? untracked(isActive(urlTree, router, options)) : false;
		};
	}
	hasActiveLinks() {
		const isActiveCheckFn = this.isLinkActive(this.router);
		return this.link && isActiveCheckFn(this.link) || this.links.some(isActiveCheckFn);
	}
};
_RouterLinkActive = RouterLinkActive;
_defineProperty(RouterLinkActive, "ɵfac", function RouterLinkActive_Factory(__ngFactoryType__) {
	return new (__ngFactoryType__ || _RouterLinkActive)(ɵɵdirectiveInject(Router), ɵɵdirectiveInject(ElementRef), ɵɵdirectiveInject(Renderer2), ɵɵdirectiveInject(ChangeDetectorRef));
});
_defineProperty(RouterLinkActive, "ɵdir", /*@__PURE__*/ ɵɵdefineDirective({
	type: _RouterLinkActive,
	selectors: [[
		"",
		"routerLinkActive",
		""
	]],
	contentQueries: function RouterLinkActive_ContentQueries(rf, ctx, dirIndex) {
		if (rf & 1) ɵɵcontentQuery(dirIndex, RouterLink, 5);
		if (rf & 2) {
			let _t = void 0;
			ɵɵqueryRefresh(_t = ɵɵloadQuery()) && (ctx.links = _t);
		}
	},
	inputs: {
		routerLinkActiveOptions: "routerLinkActiveOptions",
		ariaCurrentWhenActive: "ariaCurrentWhenActive",
		routerLinkActive: "routerLinkActive"
	},
	outputs: { isActiveChange: "isActiveChange" },
	exportAs: ["routerLinkActive"],
	features: [ɵɵNgOnChangesFeature]
}));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(RouterLinkActive, [{
		type: Directive,
		args: [{
			selector: "[routerLinkActive]",
			exportAs: "routerLinkActive"
		}]
	}], () => [
		{ type: Router },
		{ type: ElementRef },
		{ type: Renderer2 },
		{ type: ChangeDetectorRef }
	], {
		links: [{
			type: ContentChildren,
			args: [RouterLink, { descendants: true }]
		}],
		routerLinkActiveOptions: [{ type: Input }],
		ariaCurrentWhenActive: [{ type: Input }],
		isActiveChange: [{ type: Output }],
		routerLinkActive: [{ type: Input }]
	});
})();
function isActiveMatchOptions(options) {
	const o = options;
	return !!(o.paths || o.matrixParams || o.queryParams || o.fragment);
}
function setupAndRunResources(abortSignal) {
	return pipe(switchTap(({ newlyCreatedRoutes, targetRouterState }) => {
		if (!newlyCreatedRoutes || !targetRouterState || abortSignal.aborted) return;
		const resourceSetupPromises = [];
		const blockingResourcePromises = [];
		const traverse = (stateNode) => {
			const route = stateNode.value;
			if (route) {
				initializeActivatedRoute(route);
				processRoute(route, newlyCreatedRoutes, resourceSetupPromises, abortSignal, blockingResourcePromises);
			}
			for (const childState of stateNode.children) traverse(childState);
		};
		traverse(targetRouterState._root);
		return Promise.all(resourceSetupPromises).then(() => Promise.all(blockingResourcePromises));
	}));
}
function processRoute(route, newlyCreatedRoutes, resourceSetupPromises, abortSignal, blockingResourcePromises) {
	var _route$routeConfig;
	const resources = (_route$routeConfig = route.routeConfig) === null || _route$routeConfig === void 0 ? void 0 : _route$routeConfig.resources;
	if (!resources) return;
	if (newlyCreatedRoutes.has(route)) resourceSetupPromises.push(setupNewRouterResources(route, resources, abortSignal, blockingResourcePromises));
	else updateExistingResources(route, blockingResourcePromises, abortSignal);
}
function setupNewRouterResources(_x, _x2, _x3, _x4) {
	return _setupNewRouterResources.apply(this, arguments);
}
function _setupNewRouterResources() {
	_setupNewRouterResources = _asyncToGenerator(function* (route, resourcesFn, abortSignal, blockingResourcePromises) {
		const parentInjector = route._futureSnapshot._environmentInjector;
		let childInjector = route._localInjector;
		if (!childInjector) {
			childInjector = createEnvironmentInjector([], parentInjector);
			route._localInjector = childInjector;
		}
		const context = {
			params: route.paramsSignal,
			queryParams: route.queryParamsSignal,
			fragment: route.fragmentSignal,
			data: route.dataSignal
		};
		const resourceResult = yield runInInjectionContext(childInjector, () => resourcesFn(context));
		if (abortSignal.aborted || !resourceResult) return;
		const wrappedResult = {};
		runInInjectionContext(childInjector, () => {
			for (const [key, res] of Object.entries(resourceResult)) {
				if ((typeof ngDevMode === "undefined" || ngDevMode) && (!res || typeof res !== "object" || typeof res.snapshot !== "function")) throw new Error(`Invalid resource returned for key "${key}". Expected a Resource, but got ${res === null ? "null" : typeof res}.`);
				wrappedResult[key] = routerResource(res);
			}
		});
		route.resources = route._futureSnapshot.resources = wrappedResult;
		setupBlocking(route, wrappedResult, blockingResourcePromises, abortSignal);
	});
	return _setupNewRouterResources.apply(this, arguments);
}
function updateExistingResources(route, blockingResourcePromises, abortSignal) {
	var _route$snapshot;
	const currentResources = (_route$snapshot = route.snapshot) === null || _route$snapshot === void 0 ? void 0 : _route$snapshot.resources;
	if (!currentResources) return;
	for (const r of Object.values(currentResources)) {
		const underlyingRes = r[SOURCE_RESOURCE_SYMBOL];
		if (underlyingRes.status() === "error") {
			var _underlyingRes$reload;
			(_underlyingRes$reload = underlyingRes.reload) === null || _underlyingRes$reload === void 0 || _underlyingRes$reload.call(underlyingRes);
		}
	}
	route._futureSnapshot.resources = currentResources;
	setupBlocking(route, currentResources, blockingResourcePromises, abortSignal);
}
function setupBlocking(route, resourceResult, blockingResourcePromises, abortSignal) {
	if (abortSignal.aborted) return;
	const childInjector = route._localInjector;
	if (!childInjector || !resourceResult) return;
	for (const res of Object.values(resourceResult)) {
		const internalRes = res;
		if (internalRes[BLOCKING_SYMBOL] !== false) blockingResourcePromises.push(waitForResource(internalRes, childInjector, abortSignal));
	}
}
function waitForResource(resource, injector, abortSignal) {
	return new Promise((resolve, reject) => {
		const underlyingRes = resource[SOURCE_RESOURCE_SYMBOL];
		let isDestroyed = false;
		let unregisterDestroy;
		const cleanup = () => {
			isDestroyed = true;
			blockingEffect.destroy();
			unregisterDestroy === null || unregisterDestroy === void 0 || unregisterDestroy();
			abortSignal.removeEventListener("abort", onDone);
		};
		const onDone = () => {
			cleanup();
			resolve();
		};
		abortSignal.addEventListener("abort", onDone, { once: true });
		const blockingEffect = effect(() => {
			if (isDestroyed) return;
			if (underlyingRes.status() === "error") {
				cleanup();
				reject(underlyingRes.error());
			} else if (!underlyingRes.isLoading()) {
				cleanup();
				resolve();
			}
		}, _objectSpread2(_objectSpread2({}, ngDevMode ? { debugName: "blockingEffect" } : {}), {}, {
			injector,
			manualCleanup: true
		}));
		unregisterDestroy = injector.get(DestroyRef).onDestroy(onDone);
	});
}
var PreloadingStrategy = class {};
var PreloadAllModules = class {
	preload(route, fn) {
		return fn().pipe(catchError(() => of(null)));
	}
};
_PreloadAllModules = PreloadAllModules;
_defineProperty(PreloadAllModules, "ɵfac", function PreloadAllModules_Factory(__ngFactoryType__) {
	return new (__ngFactoryType__ || _PreloadAllModules)();
});
_defineProperty(PreloadAllModules, "ɵprov", /*@__PURE__*/ ɵɵdefineService({
	token: _PreloadAllModules,
	factory: _PreloadAllModules.ɵfac
}));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(PreloadAllModules, [{ type: Service }], null, null);
})();
var NoPreloading = class {
	preload(route, fn) {
		return of(null);
	}
};
_NoPreloading = NoPreloading;
_defineProperty(NoPreloading, "ɵfac", function NoPreloading_Factory(__ngFactoryType__) {
	return new (__ngFactoryType__ || _NoPreloading)();
});
_defineProperty(NoPreloading, "ɵprov", /*@__PURE__*/ ɵɵdefineService({
	token: _NoPreloading,
	factory: _NoPreloading.ɵfac
}));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(NoPreloading, [{ type: Service }], null, null);
})();
var RouterPreloader = class {
	constructor(router, injector, preloadingStrategy, loader) {
		_defineProperty(this, "router", void 0);
		_defineProperty(this, "injector", void 0);
		_defineProperty(this, "preloadingStrategy", void 0);
		_defineProperty(this, "loader", void 0);
		_defineProperty(this, "subscription", void 0);
		this.router = router;
		this.injector = injector;
		this.preloadingStrategy = preloadingStrategy;
		this.loader = loader;
	}
	setUpPreloading() {
		this.subscription = this.router.events.pipe(filter((e) => e instanceof NavigationEnd), concatMap(() => this.preload())).subscribe(() => {});
	}
	preload() {
		return this.processRoutes(this.injector, this.router.config);
	}
	ngOnDestroy() {
		var _this$subscription;
		(_this$subscription = this.subscription) === null || _this$subscription === void 0 || _this$subscription.unsubscribe();
	}
	processRoutes(injector, routes) {
		const res = [];
		for (const route of routes) {
			var _route$_injector, _route$_loadedInjecto;
			if (route.providers && !route._injector) route._injector = createEnvironmentInjector(route.providers, injector, typeof ngDevMode === "undefined" || ngDevMode ? `Route: ${route.path}` : "");
			const injectorForCurrentRoute = (_route$_injector = route._injector) !== null && _route$_injector !== void 0 ? _route$_injector : injector;
			if (route._loadedNgModuleFactory && !route._loadedInjector) route._loadedInjector = route._loadedNgModuleFactory.create(injectorForCurrentRoute).injector;
			const injectorForChildren = (_route$_loadedInjecto = route._loadedInjector) !== null && _route$_loadedInjecto !== void 0 ? _route$_loadedInjecto : injectorForCurrentRoute;
			if (route.loadChildren && !route._loadedRoutes && route.canLoad === void 0 || route.loadComponent && !route._loadedComponent) res.push(this.preloadConfig(injectorForCurrentRoute, route));
			if (route.children || route._loadedRoutes) {
				var _route$children;
				res.push(this.processRoutes(injectorForChildren, (_route$children = route.children) !== null && _route$children !== void 0 ? _route$children : route._loadedRoutes));
			}
		}
		return from(res).pipe(mergeAll());
	}
	preloadConfig(injector, route) {
		return this.preloadingStrategy.preload(route, () => {
			if (injector.destroyed) return of(null);
			let loadedChildren$;
			if (route.loadChildren && route.canLoad === void 0) loadedChildren$ = from(this.loader.loadChildren(injector, route));
			else loadedChildren$ = of(null);
			const recursiveLoadChildren$ = loadedChildren$.pipe(mergeMap((config) => {
				var _config$injector;
				if (config === null) return of(void 0);
				route._loadedRoutes = config.routes;
				route._loadedInjector = config.injector;
				route._loadedNgModuleFactory = config.factory;
				return this.processRoutes((_config$injector = config.injector) !== null && _config$injector !== void 0 ? _config$injector : injector, config.routes);
			}));
			if (route.loadComponent && !route._loadedComponent) {
				const loadComponent$ = this.loader.loadComponent(injector, route);
				return from([recursiveLoadChildren$, loadComponent$]).pipe(mergeAll());
			} else return recursiveLoadChildren$;
		});
	}
};
_RouterPreloader = RouterPreloader;
_defineProperty(RouterPreloader, "ɵfac", function RouterPreloader_Factory(__ngFactoryType__) {
	return new (__ngFactoryType__ || _RouterPreloader)(ɵɵinject(Router), ɵɵinject(EnvironmentInjector), ɵɵinject(PreloadingStrategy), ɵɵinject(RouterConfigLoader));
});
_defineProperty(RouterPreloader, "ɵprov", /*@__PURE__*/ ɵɵdefineInjectable({
	token: _RouterPreloader,
	factory: _RouterPreloader.ɵfac,
	providedIn: "root"
}));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(RouterPreloader, [{
		type: Injectable,
		args: [{ providedIn: "root" }]
	}], () => [
		{ type: Router },
		{ type: EnvironmentInjector },
		{ type: PreloadingStrategy },
		{ type: RouterConfigLoader }
	], null);
})();
var ROUTER_SCROLLER = new InjectionToken(typeof ngDevMode !== "undefined" && ngDevMode ? "Router Scroller" : "");
var RouterScroller = class {
	constructor(options) {
		var _inject, _this$options2, _this$options3;
		_defineProperty(this, "options", void 0);
		_defineProperty(this, "routerEventsSubscription", void 0);
		_defineProperty(this, "scrollEventsSubscription", void 0);
		_defineProperty(this, "lastId", 0);
		_defineProperty(this, "lastSource", IMPERATIVE_NAVIGATION);
		_defineProperty(this, "restoredId", 0);
		_defineProperty(this, "store", {});
		_defineProperty(this, "isHydrating", (_inject = inject(IS_HYDRATION_DOM_REUSE_ENABLED, { optional: true })) !== null && _inject !== void 0 ? _inject : false);
		_defineProperty(this, "urlSerializer", inject(UrlSerializer));
		_defineProperty(this, "zone", inject(NgZone));
		_defineProperty(this, "viewportScroller", inject(ViewportScroller));
		_defineProperty(this, "transitions", inject(NavigationTransitions));
		this.options = options;
		(_this$options2 = this.options).scrollPositionRestoration || (_this$options2.scrollPositionRestoration = "disabled");
		(_this$options3 = this.options).anchorScrolling || (_this$options3.anchorScrolling = "disabled");
		if (this.isHydrating) inject(ApplicationRef).whenStable().then(() => {
			this.isHydrating = false;
		});
	}
	init() {
		if (this.options.scrollPositionRestoration !== "disabled") this.viewportScroller.setHistoryScrollRestoration("manual");
		this.routerEventsSubscription = this.createScrollEvents();
		this.scrollEventsSubscription = this.consumeScrollEvents();
	}
	createScrollEvents() {
		return this.transitions.events.subscribe((e) => {
			if (e instanceof NavigationStart) {
				this.store[this.lastId] = this.viewportScroller.getScrollPosition();
				this.lastSource = e.navigationTrigger;
				this.restoredId = e.restoredState ? e.restoredState.navigationId : 0;
			} else if (e instanceof NavigationEnd) {
				this.lastId = e.id;
				this.scheduleScrollEvent(e, this.urlSerializer.parse(e.urlAfterRedirects).fragment);
			} else if (e instanceof NavigationSkipped && e.code === NavigationSkippedCode.IgnoredSameUrlNavigation) {
				this.lastSource = void 0;
				this.restoredId = 0;
				this.scheduleScrollEvent(e, this.urlSerializer.parse(e.url).fragment);
			}
		});
	}
	consumeScrollEvents() {
		return this.transitions.events.subscribe((e) => {
			if (!(e instanceof Scroll) || e.scrollBehavior === "manual") return;
			const instantScroll = { behavior: "instant" };
			if (e.position) {
				if (this.options.scrollPositionRestoration === "top") this.viewportScroller.scrollToPosition([0, 0], instantScroll);
				else if (this.options.scrollPositionRestoration === "enabled") this.viewportScroller.scrollToPosition(e.position, instantScroll);
			} else if (e.anchor && this.options.anchorScrolling === "enabled") this.viewportScroller.scrollToAnchor(e.anchor);
			else if (this.options.scrollPositionRestoration !== "disabled") this.viewportScroller.scrollToPosition([0, 0]);
		});
	}
	scheduleScrollEvent(routerEvent, anchor) {
		var _this = this;
		var _untracked;
		if (this.isHydrating) return;
		const scroll = (_untracked = untracked(this.transitions.currentNavigation)) === null || _untracked === void 0 ? void 0 : _untracked.extras.scroll;
		this.zone.runOutsideAngular(_asyncToGenerator(function* () {
			yield new Promise((resolve) => {
				setTimeout(resolve);
				if (typeof requestAnimationFrame !== "undefined") requestAnimationFrame(resolve);
			});
			_this.zone.run(() => {
				_this.transitions.events.next(new Scroll(routerEvent, _this.lastSource === "popstate" ? _this.store[_this.restoredId] : null, anchor, scroll));
			});
		}));
	}
	ngOnDestroy() {
		var _this$routerEventsSub, _this$scrollEventsSub;
		(_this$routerEventsSub = this.routerEventsSubscription) === null || _this$routerEventsSub === void 0 || _this$routerEventsSub.unsubscribe();
		(_this$scrollEventsSub = this.scrollEventsSubscription) === null || _this$scrollEventsSub === void 0 || _this$scrollEventsSub.unsubscribe();
	}
};
_RouterScroller = RouterScroller;
_defineProperty(RouterScroller, "ɵfac", function RouterScroller_Factory(__ngFactoryType__) {
	ɵɵinvalidFactory();
});
_defineProperty(RouterScroller, "ɵprov", /*@__PURE__*/ ɵɵdefineInjectable({
	token: _RouterScroller,
	factory: _RouterScroller.ɵfac
}));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(RouterScroller, [{ type: Injectable }], () => [{ type: void 0 }], null);
})();
function getLoadedRoutes(route) {
	return route._loadedRoutes;
}
function getRouterInstance(injector) {
	return injector.get(Router, null, { optional: true });
}
function navigateByUrl(router, url) {
	if (!(router instanceof Router)) throw new Error("The provided router is not an Angular Router.");
	return router.navigateByUrl(url);
}
var NavigationStateManager = class extends StateManager {
	get registered() {
		return this.nonRouterEntryChangeListener !== void 0 && !this.nonRouterEntryChangeListener.closed;
	}
	constructor() {
		var _this$location$prepar, _this$location$prepar2, _this$location;
		super();
		_defineProperty(this, "injector", inject(EnvironmentInjector));
		_defineProperty(this, "navigation", inject(PlatformNavigation));
		_defineProperty(this, "inMemoryScrollingEnabled", inject(ROUTER_SCROLLER, { optional: true }) !== null);
		_defineProperty(this, "base", new URL(inject(PlatformLocation).href).origin);
		_defineProperty(this, "appRootUrl", new URL((_this$location$prepar = (_this$location$prepar2 = (_this$location = this.location).prepareExternalUrl) === null || _this$location$prepar2 === void 0 ? void 0 : _this$location$prepar2.call(_this$location, "/")) !== null && _this$location$prepar !== void 0 ? _this$location$prepar : "/", this.base));
		_defineProperty(this, "precommitHandlerSupported", inject(PRECOMMIT_HANDLER_SUPPORTED));
		_defineProperty(this, "activeHistoryEntry", this.navigation.currentEntry);
		_defineProperty(this, "currentNavigation", {});
		_defineProperty(this, "nonRouterCurrentEntryChangeSubject", new Subject());
		_defineProperty(this, "nonRouterEntryChangeListener", void 0);
		const navigateListener = (event) => {
			this.handleNavigate(event);
		};
		this.navigation.addEventListener("navigate", navigateListener);
		inject(DestroyRef).onDestroy(() => this.navigation.removeEventListener("navigate", navigateListener));
	}
	registerNonRouterCurrentEntryChangeListener(listener) {
		this.activeHistoryEntry = this.navigation.currentEntry;
		this.nonRouterEntryChangeListener = this.nonRouterCurrentEntryChangeSubject.subscribe(({ path, state, hasUAVisualTransition }) => {
			listener(path, state, "popstate", !this.precommitHandlerSupported ? { replaceUrl: true } : {}, hasUAVisualTransition);
		});
		return this.nonRouterEntryChangeListener;
	}
	handleRouterEvent(e, transition) {
		var _this2 = this;
		return _asyncToGenerator(function* () {
			_this2.currentNavigation = _objectSpread2(_objectSpread2({}, _this2.currentNavigation), {}, { routerTransition: transition });
			if (e instanceof NavigationStart) {
				_this2.updateStateMemento();
				if (_this2.precommitHandlerSupported) _this2.maybeCreateNavigationForTransition(transition);
			} else if (e instanceof NavigationSkipped) {
				_this2.finishNavigation();
				_this2.commitTransition(transition);
			} else if (e instanceof BeforeRoutesRecognized) transition.routesRecognizeHandler.deferredHandle = new Promise(function() {
				var _ref = _asyncToGenerator(function* (resolve) {
					if (_this2.urlUpdateStrategy === "eager") try {
						var _this$currentNavigati, _this$currentNavigati2;
						_this2.maybeCreateNavigationForTransition(transition);
						yield (_this$currentNavigati = (_this$currentNavigati2 = _this2.currentNavigation).commitUrl) === null || _this$currentNavigati === void 0 ? void 0 : _this$currentNavigati.call(_this$currentNavigati2);
					} catch (_unused) {
						return;
					}
					resolve();
				});
				return function(_x5) {
					return _ref.apply(this, arguments);
				};
			}());
			else if (e instanceof BeforeActivateRoutes) transition.beforeActivateHandler.deferredHandle = new Promise(function() {
				var _ref2 = _asyncToGenerator(function* (resolve) {
					if (_this2.urlUpdateStrategy === "deferred") try {
						var _this$currentNavigati3, _this$currentNavigati4;
						_this2.maybeCreateNavigationForTransition(transition);
						yield (_this$currentNavigati3 = (_this$currentNavigati4 = _this2.currentNavigation).commitUrl) === null || _this$currentNavigati3 === void 0 ? void 0 : _this$currentNavigati3.call(_this$currentNavigati4);
					} catch (_unused2) {
						return;
					}
					_this2.commitTransition(transition);
					resolve();
				});
				return function(_x6) {
					return _ref2.apply(this, arguments);
				};
			}());
			else if (e instanceof NavigationCancel || e instanceof NavigationError) {
				if (e instanceof NavigationCancel && e.code === NavigationCancellationCode.Redirect && !!_this2.currentNavigation.commitUrl) return;
				_this2.cancel(transition, e);
			} else if (e instanceof NavigationEnd) {
				const { resolveHandler, removeAbortListener } = _this2.currentNavigation;
				_this2.currentNavigation = {};
				removeAbortListener === null || removeAbortListener === void 0 || removeAbortListener();
				_this2.activeHistoryEntry = _this2.navigation.currentEntry;
				afterNextRender({ read: () => resolveHandler === null || resolveHandler === void 0 ? void 0 : resolveHandler() }, { injector: _this2.injector });
			}
		})();
	}
	maybeCreateNavigationForTransition(transition) {
		var _this$currentNavigati5, _this$currentNavigati6;
		const { navigationEvent, commitUrl } = this.currentNavigation;
		if (commitUrl || navigationEvent && navigationEvent.navigationType === "traverse" && this.eventAndRouterDestinationsMatch(navigationEvent, transition)) return;
		(_this$currentNavigati5 = (_this$currentNavigati6 = this.currentNavigation).removeAbortListener) === null || _this$currentNavigati5 === void 0 || _this$currentNavigati5.call(_this$currentNavigati6);
		const path = this.createBrowserPath(transition);
		this.navigate(path, transition);
	}
	navigate(internalPath, transition) {
		const path = transition.extras.skipLocationChange ? this.navigation.currentEntry.url : this.location.prepareExternalUrl(internalPath);
		const state = _objectSpread2(_objectSpread2({}, transition.extras.state), this.generateNgRouterState(transition));
		const info = { ɵrouterInfo: { intercept: true } };
		if (!this.navigation.transition && this.currentNavigation.navigationEvent) transition.extras.replaceUrl = false;
		const history = this.location.isCurrentPathEqualTo(path) || transition.extras.replaceUrl || transition.extras.skipLocationChange ? "replace" : "push";
		handleResultRejections(this.navigation.navigate(path, {
			state,
			history,
			info
		}));
	}
	finishNavigation() {
		var _this$currentNavigati7, _this$currentNavigati8, _this$currentNavigati9, _this$currentNavigati10;
		(_this$currentNavigati7 = (_this$currentNavigati8 = this.currentNavigation).commitUrl) === null || _this$currentNavigati7 === void 0 || _this$currentNavigati7.call(_this$currentNavigati8);
		(_this$currentNavigati9 = this.currentNavigation) === null || _this$currentNavigati9 === void 0 || (_this$currentNavigati10 = _this$currentNavigati9.resolveHandler) === null || _this$currentNavigati10 === void 0 || _this$currentNavigati10.call(_this$currentNavigati9);
		this.currentNavigation = {};
	}
	cancel(transition, cause) {
		var _this3 = this;
		return _asyncToGenerator(function* () {
			var _this$currentNavigati11, _this$currentNavigati12;
			(_this$currentNavigati11 = (_this$currentNavigati12 = _this3.currentNavigation).rejectNavigateEvent) === null || _this$currentNavigati11 === void 0 || _this$currentNavigati11.call(_this$currentNavigati12);
			const clearedState = {};
			_this3.currentNavigation = clearedState;
			if (isRedirectingEvent(cause)) return;
			const isTraversalReset = _this3.canceledNavigationResolution === "computed" && _this3.navigation.currentEntry.key !== _this3.activeHistoryEntry.key;
			_this3.resetInternalState(transition.finalUrl, isTraversalReset);
			if (_this3.navigation.currentEntry.id === _this3.activeHistoryEntry.id) return;
			if (cause instanceof NavigationCancel && cause.code === NavigationCancellationCode.Aborted) {
				yield Promise.resolve();
				if (_this3.currentNavigation !== clearedState) return;
			}
			if (isTraversalReset) handleResultRejections(_this3.navigation.traverseTo(_this3.activeHistoryEntry.key, { info: { ɵrouterInfo: { intercept: false } } }));
			else {
				const internalPath = _this3.urlSerializer.serialize(_this3.getCurrentUrlTree());
				const pathOrUrl = _this3.location.prepareExternalUrl(internalPath);
				handleResultRejections(_this3.navigation.navigate(pathOrUrl, {
					state: _this3.activeHistoryEntry.getState(),
					history: "replace",
					info: { ɵrouterInfo: { intercept: false } }
				}));
			}
		})();
	}
	resetInternalState(finalUrl, traversalReset) {
		this.routerState = this.stateMemento.routerState;
		this.currentUrlTree = this.stateMemento.currentUrlTree;
		this.rawUrlTree = traversalReset ? this.stateMemento.rawUrlTree : this.urlHandlingStrategy.merge(this.currentUrlTree, finalUrl !== null && finalUrl !== void 0 ? finalUrl : this.rawUrlTree);
	}
	handleNavigate(event) {
		var _this4 = this;
		var _event$info, _this$currentNavigati15, _this$currentNavigati16;
		if (!event.canIntercept || event.navigationType === "reload") return;
		const routerInfo = event === null || event === void 0 || (_event$info = event.info) === null || _event$info === void 0 ? void 0 : _event$info.ɵrouterInfo;
		if (routerInfo && !routerInfo.intercept) return;
		const isTriggeredByRouterTransition = !!routerInfo;
		if (!isTriggeredByRouterTransition) {
			var _this$currentNavigati13;
			const { pathname: destPathname, origin: destOrigin } = new URL(event.destination.url);
			const { pathname: rootPathname, origin: appOrigin } = this.appRootUrl;
			const rootPath = rootPathname.endsWith("/") ? rootPathname : rootPathname + "/";
			if (destOrigin !== appOrigin || destPathname !== rootPathname && !destPathname.startsWith(rootPath)) return;
			(_this$currentNavigati13 = this.currentNavigation.routerTransition) === null || _this$currentNavigati13 === void 0 || _this$currentNavigati13.abort();
			if (!this.registered) {
				this.finishNavigation();
				return;
			}
		}
		this.currentNavigation = _objectSpread2({}, this.currentNavigation);
		this.currentNavigation.navigationEvent = event;
		const abortHandler = () => {
			var _this$currentNavigati14;
			(_this$currentNavigati14 = this.currentNavigation.routerTransition) === null || _this$currentNavigati14 === void 0 || _this$currentNavigati14.abort();
		};
		event.signal.addEventListener("abort", abortHandler);
		this.currentNavigation.removeAbortListener = () => event.signal.removeEventListener("abort", abortHandler);
		const interceptOptions = { scroll: this.inMemoryScrollingEnabled ? "manual" : (_this$currentNavigati15 = (_this$currentNavigati16 = this.currentNavigation.routerTransition) === null || _this$currentNavigati16 === void 0 ? void 0 : _this$currentNavigati16.extras.scroll) !== null && _this$currentNavigati15 !== void 0 ? _this$currentNavigati15 : "after-transition" };
		const { promise: handlerPromise, resolve: resolveHandler, reject: rejectHandler } = promiseWithResolvers();
		const { promise: precommitHandlerPromise, resolve: resolvePrecommitHandler, reject: rejectPrecommitHandler } = promiseWithResolvers();
		this.currentNavigation.rejectNavigateEvent = () => {
			event.signal.removeEventListener("abort", abortHandler);
			rejectPrecommitHandler();
			rejectHandler();
		};
		this.currentNavigation.resolveHandler = () => {
			var _this$currentNavigati17, _this$currentNavigati18;
			(_this$currentNavigati17 = (_this$currentNavigati18 = this.currentNavigation).removeAbortListener) === null || _this$currentNavigati17 === void 0 || _this$currentNavigati17.call(_this$currentNavigati18);
			resolveHandler();
		};
		handlerPromise.catch(() => {});
		precommitHandlerPromise.catch(() => {});
		interceptOptions.handler = () => handlerPromise;
		if (this.deferredCommitSupported(event)) {
			const redirect = new Promise((resolve) => {
				interceptOptions.precommitHandler = (controller) => {
					var _this$navigation$tran;
					if (((_this$navigation$tran = this.navigation.transition) === null || _this$navigation$tran === void 0 ? void 0 : _this$navigation$tran.navigationType) === "traverse") resolve(() => {});
					else resolve(controller.redirect.bind(controller));
					return precommitHandlerPromise;
				};
			});
			this.currentNavigation.commitUrl = _asyncToGenerator(function* () {
				var _this$navigation$tran2;
				_this4.currentNavigation.commitUrl = void 0;
				const transition = _this4.currentNavigation.routerTransition;
				if (transition && !transition.extras.skipLocationChange) {
					const internalPath = _this4.createBrowserPath(transition);
					const history = _this4.location.isCurrentPathEqualTo(internalPath) || !!transition.extras.replaceUrl ? "replace" : "push";
					const state = _objectSpread2(_objectSpread2({}, transition.extras.state), _this4.generateNgRouterState(transition));
					const pathOrUrl = _this4.location.prepareExternalUrl(internalPath);
					(yield redirect)(pathOrUrl, {
						state,
						history
					});
				}
				resolvePrecommitHandler();
				return yield (_this$navigation$tran2 = _this4.navigation.transition) === null || _this$navigation$tran2 === void 0 ? void 0 : _this$navigation$tran2.committed;
			});
		}
		event.intercept(interceptOptions);
		if (!isTriggeredByRouterTransition) this.handleNavigateEventTriggeredOutsideRouterAPIs(event);
	}
	handleNavigateEventTriggeredOutsideRouterAPIs(event) {
		const path = event.destination.url.substring(this.appRootUrl.href.length - 1);
		const state = event.destination.getState();
		this.nonRouterCurrentEntryChangeSubject.next({
			path,
			state,
			hasUAVisualTransition: event.hasUAVisualTransition
		});
	}
	eventAndRouterDestinationsMatch(navigateEvent, transition) {
		const internalPath = this.createBrowserPath(transition);
		const eventDestination = new URL(navigateEvent.destination.url);
		const routerDestination = new URL(this.location.prepareExternalUrl(internalPath), eventDestination.origin);
		eventDestination.searchParams.sort();
		routerDestination.searchParams.sort();
		const { pathname: destPathname, search: destSearch, hash: hashDest } = routerDestination;
		const { pathname: eventDestPathname, search: eventDestSearch, hash: eventDestHash } = eventDestination;
		return destSearch === eventDestSearch && hashDest === eventDestHash && Location.stripTrailingSlash(destPathname) === Location.stripTrailingSlash(eventDestPathname);
	}
	generateNgRouterState(transition) {
		return _objectSpread2(_objectSpread2({}, this.routerUrlState(transition)), {}, { navigationId: transition.id });
	}
	deferredCommitSupported(event) {
		return this.precommitHandlerSupported && event.cancelable;
	}
};
_NavigationStateManager = NavigationStateManager;
_defineProperty(NavigationStateManager, "ɵfac", function NavigationStateManager_Factory(__ngFactoryType__) {
	return new (__ngFactoryType__ || _NavigationStateManager)();
});
_defineProperty(NavigationStateManager, "ɵprov", /*@__PURE__*/ ɵɵdefineService({
	token: _NavigationStateManager,
	factory: _NavigationStateManager.ɵfac
}));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(NavigationStateManager, [{ type: Service }], () => [], null);
})();
function handleResultRejections(result) {
	var _result$finished, _result$committed;
	(_result$finished = result.finished) === null || _result$finished === void 0 || _result$finished.catch(() => {});
	(_result$committed = result.committed) === null || _result$committed === void 0 || _result$committed.catch(() => {});
	return result;
}
function provideRouter(routes, ...features) {
	if (typeof ngDevMode === "undefined" || ngDevMode) {
		publishNonCoreGlobalUtil("ɵgetLoadedRoutes", getLoadedRoutes);
		publishNonCoreGlobalUtil("ɵgetRouterInstance", getRouterInstance);
		publishNonCoreGlobalUtil("ɵnavigateByUrl", navigateByUrl);
	}
	return makeEnvironmentProviders([
		{
			provide: ROUTES,
			multi: true,
			useValue: routes
		},
		{
			provide: ActivatedRoute,
			useFactory: rootRoute
		},
		{
			provide: APP_BOOTSTRAP_LISTENER,
			multi: true,
			useFactory: getBootstrapListener
		},
		features.map((feature) => feature.ɵproviders)
	]);
}
function rootRoute() {
	return inject(Router).routerState.root;
}
function routerFeature(kind, providers) {
	return {
		ɵkind: kind,
		ɵproviders: providers
	};
}
function withInMemoryScrolling(options = {}) {
	return routerFeature(4, [{
		provide: ROUTER_SCROLLER,
		useFactory: () => new RouterScroller(options)
	}]);
}
function withExperimentalPlatformNavigation() {
	const devModeLocationCheck = typeof ngDevMode === "undefined" || ngDevMode ? [provideEnvironmentInitializer(() => {
		const locationInstance = inject(Location);
		if (!(locationInstance instanceof NavigationAdapterForLocation)) {
			const locationConstructorName = locationInstance.constructor.name;
			let message = `'withExperimentalPlatformNavigation' provides a 'Location' implementation that ensures navigation APIs are consistently used. An instance of ${locationConstructorName} was found instead.`;
			if (locationConstructorName === "SpyLocation") message += ` One of 'RouterTestingModule' or 'provideLocationMocks' was likely used. 'withExperimentalPlatformNavigation' does not work with these because they override the Location implementation.`;
			throw new Error(message);
		}
	})] : [];
	return routerFeature(11, [
		{
			provide: StateManager,
			useExisting: NavigationStateManager
		},
		{
			provide: Location,
			useClass: NavigationAdapterForLocation
		},
		devModeLocationCheck
	]);
}
function getBootstrapListener() {
	const injector = inject(Injector);
	return (bootstrappedComponentRef) => {
		var _injector$get, _injector$get2;
		const ref = injector.get(ApplicationRef);
		if (bootstrappedComponentRef !== ref.components[0]) return;
		const router = injector.get(Router);
		const bootstrapDone = injector.get(BOOTSTRAP_DONE);
		if (injector.get(INITIAL_NAVIGATION) === 1) router.initialNavigation();
		(_injector$get = injector.get(ROUTER_PRELOADER, null, { optional: true })) === null || _injector$get === void 0 || _injector$get.setUpPreloading();
		(_injector$get2 = injector.get(ROUTER_SCROLLER, null, { optional: true })) === null || _injector$get2 === void 0 || _injector$get2.init();
		router.resetRootComponentType(ref.componentTypes[0]);
		if (!bootstrapDone.closed) {
			bootstrapDone.next();
			bootstrapDone.complete();
			bootstrapDone.unsubscribe();
		}
	};
}
var BOOTSTRAP_DONE = new InjectionToken(typeof ngDevMode === "undefined" || ngDevMode ? "bootstrap done indicator" : "", { factory: () => {
	return new Subject();
} });
var INITIAL_NAVIGATION = new InjectionToken(typeof ngDevMode === "undefined" || ngDevMode ? "initial navigation" : "", { factory: () => 1 });
function withEnabledBlockingInitialNavigation() {
	return routerFeature(2, [
		{
			provide: IS_ENABLED_BLOCKING_INITIAL_NAVIGATION,
			useValue: true
		},
		{
			provide: INITIAL_NAVIGATION,
			useValue: 0
		},
		provideAppInitializer(() => {
			const injector = inject(Injector);
			return injector.get(LOCATION_INITIALIZED, Promise.resolve()).then(() => {
				return new Promise((resolve) => {
					const router = injector.get(Router);
					const bootstrapDone = injector.get(BOOTSTRAP_DONE);
					afterNextNavigation(router, () => {
						resolve(true);
					});
					injector.get(NavigationTransitions).afterPreactivation = () => {
						resolve(true);
						return bootstrapDone.closed ? of(void 0) : bootstrapDone;
					};
					router.initialNavigation();
				});
			});
		})
	]);
}
function withDisabledInitialNavigation() {
	return routerFeature(3, [provideAppInitializer(() => {
		inject(Router).setUpLocationChangeListener();
	}), {
		provide: INITIAL_NAVIGATION,
		useValue: 2
	}]);
}
function withDebugTracing() {
	let providers = [];
	if (typeof ngDevMode === "undefined" || ngDevMode) providers = [{
		provide: ENVIRONMENT_INITIALIZER,
		multi: true,
		useFactory: () => {
			const router = inject(Router);
			return () => router.events.subscribe((e) => {
				var _console$group, _console, _console$groupEnd, _console2;
				(_console$group = (_console = console).group) === null || _console$group === void 0 || _console$group.call(_console, `Router Event: ${e.constructor.name}`);
				console.log(stringifyEvent(e));
				console.log(e);
				(_console$groupEnd = (_console2 = console).groupEnd) === null || _console$groupEnd === void 0 || _console$groupEnd.call(_console2);
			});
		}
	}];
	else providers = [];
	return routerFeature(1, providers);
}
var ROUTER_PRELOADER = new InjectionToken(typeof ngDevMode === "undefined" || ngDevMode ? "router preloader" : "");
function withPreloading(preloadingStrategy) {
	return routerFeature(0, [{
		provide: ROUTER_PRELOADER,
		useExisting: RouterPreloader
	}, {
		provide: PreloadingStrategy,
		useExisting: preloadingStrategy
	}]);
}
function withRouterConfig(options) {
	return routerFeature(5, [{
		provide: ROUTER_CONFIGURATION,
		useValue: options
	}]);
}
function withHashLocation() {
	return routerFeature(6, [{
		provide: LocationStrategy,
		useClass: HashLocationStrategy
	}]);
}
function withNavigationErrorHandler(handler) {
	return routerFeature(7, [{
		provide: NAVIGATION_ERROR_HANDLER,
		useValue: handler
	}]);
}
function withAutoCleanupInjectors() {
	return routerFeature(10, [{
		provide: ROUTE_INJECTOR_CLEANUP,
		useValue: routeInjectorCleanup
	}]);
}
function withExperimentalAutoCleanupInjectors() {
	return withAutoCleanupInjectors();
}
function withComponentInputBinding(options = {}) {
	return routerFeature(8, [{
		provide: INPUT_BINDER,
		useFactory: () => new RoutedComponentInputBinder(options, inject(ROUTER_RESOURCES_FEATURE, { optional: true }))
	}]);
}
function withViewTransitions(options) {
	performanceMarkFeature("NgRouterViewTransitions");
	return routerFeature(9, [{
		provide: CREATE_VIEW_TRANSITION,
		useValue: createViewTransition
	}, {
		provide: VIEW_TRANSITION_OPTIONS,
		useValue: _objectSpread2({ skipNextTransition: !!(options === null || options === void 0 ? void 0 : options.skipInitialTransition) }, options)
	}]);
}
function withRouterResources() {
	return routerFeature(12, [{
		provide: ROUTER_RESOURCES_FEATURE,
		useValue: {
			setupAndRunResources,
			createResourceOutletBindingEffects
		}
	}]);
}
var ROUTER_DIRECTIVES = [
	RouterOutlet,
	RouterLink,
	RouterLinkActive,
	ɵEmptyOutletComponent
];
var ROUTER_FORROOT_GUARD = new InjectionToken(typeof ngDevMode === "undefined" || ngDevMode ? "router duplicate forRoot guard" : "");
var ROUTER_PROVIDERS = [
	Location,
	{
		provide: UrlSerializer,
		useClass: DefaultUrlSerializer
	},
	Router,
	ChildrenOutletContexts,
	{
		provide: ActivatedRoute,
		useFactory: rootRoute
	},
	RouterConfigLoader
];
var RouterModule = class RouterModule {
	constructor() {
		if (typeof ngDevMode === "undefined" || ngDevMode) inject(ROUTER_FORROOT_GUARD, { optional: true });
	}
	static forRoot(routes, config) {
		return {
			ngModule: RouterModule,
			providers: [
				ROUTER_PROVIDERS,
				typeof ngDevMode === "undefined" || ngDevMode ? (config === null || config === void 0 ? void 0 : config.enableTracing) ? withDebugTracing().ɵproviders : [] : [],
				{
					provide: ROUTES,
					multi: true,
					useValue: routes
				},
				typeof ngDevMode === "undefined" || ngDevMode ? {
					provide: ROUTER_FORROOT_GUARD,
					useFactory: provideForRootGuard
				} : [],
				(config === null || config === void 0 ? void 0 : config.errorHandler) ? {
					provide: NAVIGATION_ERROR_HANDLER,
					useValue: config.errorHandler
				} : [],
				{
					provide: ROUTER_CONFIGURATION,
					useValue: config ? config : {}
				},
				(config === null || config === void 0 ? void 0 : config.useHash) ? provideHashLocationStrategy() : providePathLocationStrategy(),
				provideRouterScroller(),
				(config === null || config === void 0 ? void 0 : config.preloadingStrategy) ? withPreloading(config.preloadingStrategy).ɵproviders : [],
				(config === null || config === void 0 ? void 0 : config.initialNavigation) ? provideInitialNavigation(config) : [],
				(config === null || config === void 0 ? void 0 : config.bindToComponentInputs) ? withComponentInputBinding(typeof config.bindToComponentInputs === "object" ? config.bindToComponentInputs : {}).ɵproviders : [],
				(config === null || config === void 0 ? void 0 : config.enableViewTransitions) ? withViewTransitions().ɵproviders : [],
				provideRouterInitializer()
			]
		};
	}
	static forChild(routes) {
		return {
			ngModule: RouterModule,
			providers: [{
				provide: ROUTES,
				multi: true,
				useValue: routes
			}]
		};
	}
};
_RouterModule = RouterModule;
_defineProperty(RouterModule, "ɵfac", function RouterModule_Factory(__ngFactoryType__) {
	return new (__ngFactoryType__ || _RouterModule)();
});
_defineProperty(RouterModule, "ɵmod", /*@__PURE__*/ ɵɵdefineNgModule({
	type: _RouterModule,
	imports: [
		RouterOutlet,
		RouterLink,
		RouterLinkActive,
		ɵEmptyOutletComponent
	],
	exports: [
		RouterOutlet,
		RouterLink,
		RouterLinkActive,
		ɵEmptyOutletComponent
	]
}));
_defineProperty(RouterModule, "ɵinj", /*@__PURE__*/ ɵɵdefineInjector({}));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(RouterModule, [{
		type: NgModule,
		args: [{
			imports: ROUTER_DIRECTIVES,
			exports: ROUTER_DIRECTIVES
		}]
	}], () => [], null);
})();
function provideRouterScroller() {
	return {
		provide: ROUTER_SCROLLER,
		useFactory: () => {
			const viewportScroller = inject(ViewportScroller);
			const config = inject(ROUTER_CONFIGURATION);
			if (config.scrollOffset) viewportScroller.setOffset(config.scrollOffset);
			return new RouterScroller(config);
		}
	};
}
function provideHashLocationStrategy() {
	return {
		provide: LocationStrategy,
		useClass: HashLocationStrategy
	};
}
function providePathLocationStrategy() {
	return {
		provide: LocationStrategy,
		useClass: PathLocationStrategy
	};
}
function provideForRootGuard() {
	if (inject(Router, {
		optional: true,
		skipSelf: true
	})) throw new RuntimeError(4007, "The Router was provided more than once. This can happen if 'forRoot' is used outside of the root injector. Lazy loaded modules should use RouterModule.forChild() instead.");
	return "guarded";
}
function provideInitialNavigation(config) {
	return [config.initialNavigation === "disabled" ? withDisabledInitialNavigation().ɵproviders : [], config.initialNavigation === "enabledBlocking" ? withEnabledBlockingInitialNavigation().ɵproviders : []];
}
var ROUTER_INITIALIZER = new InjectionToken(typeof ngDevMode === "undefined" || ngDevMode ? "Router Initializer" : "");
function provideRouterInitializer() {
	return [{
		provide: ROUTER_INITIALIZER,
		useFactory: getBootstrapListener
	}, {
		provide: APP_BOOTSTRAP_LISTENER,
		multi: true,
		useExisting: ROUTER_INITIALIZER
	}];
}
//#endregion
//#region node_modules/@angular/router/fesm2022/router.mjs
/**
* @license Angular v22.2.0
* (c) 2010-2026 Google LLC. https://angular.dev/
* License: MIT
*/
function mapToCanMatch(providers) {
	return providers.map((provider) => (...params) => inject(provider).canMatch(...params));
}
function mapToCanActivate(providers) {
	return providers.map((provider) => (...params) => inject(provider).canActivate(...params));
}
function mapToCanActivateChild(providers) {
	return providers.map((provider) => (...params) => inject(provider).canActivateChild(...params));
}
function mapToCanDeactivate(providers) {
	return providers.map((provider) => (...params) => inject(provider).canDeactivate(...params));
}
function mapToResolve(provider) {
	return (...params) => inject(provider).resolve(...params);
}
var VERSION = /* @__PURE__ */ new Version("22.2.0");
//#endregion
export { ActivatedRoute, ActivatedRouteSnapshot, ActivationEnd, ActivationStart, BaseRouteReuseStrategy, ChildActivationEnd, ChildActivationStart, ChildrenOutletContexts, DefaultTitleStrategy, DefaultUrlSerializer, EventType, GuardsCheckEnd, GuardsCheckStart, NavigationCancel, NavigationCancellationCode, NavigationEnd, NavigationError, NavigationSkipped, NavigationSkippedCode, NavigationStart, NoPreloading, OutletContext, PRIMARY_OUTLET, PreloadAllModules, PreloadingStrategy, ROUTER_CONFIGURATION, ROUTER_INITIALIZER, ROUTER_OUTLET_DATA, ROUTES, RedirectCommand, ResolveEnd, ResolveStart, RouteConfigLoadEnd, RouteConfigLoadStart, RouteReuseStrategy, Router, RouterEvent, RouterLink, RouterLink as RouterLinkWithHref, RouterLinkActive, RouterModule, RouterOutlet, RouterPreloader, RouterState, RouterStateSnapshot, RoutesRecognized, Scroll, TitleStrategy, UrlHandlingStrategy, UrlSegment, UrlSegmentGroup, UrlSerializer, UrlTree, VERSION, containsTree, convertToParamMap, createUrlTreeFromSnapshot, defaultUrlMatcher, destroyDetachedRouteHandle, isActive, mapToCanActivate, mapToCanActivateChild, mapToCanDeactivate, mapToCanMatch, mapToResolve, nonBlocking, provideRouter, withAutoCleanupInjectors, withComponentInputBinding, withDebugTracing, withDisabledInitialNavigation, withEnabledBlockingInitialNavigation, withExperimentalAutoCleanupInjectors, withExperimentalPlatformNavigation, withHashLocation, withInMemoryScrolling, withNavigationErrorHandler, withPreloading, withRouterConfig, withRouterResources, withViewTransitions, ɵEmptyOutletComponent, ROUTER_PROVIDERS as ɵROUTER_PROVIDERS, afterNextNavigation as ɵafterNextNavigation, loadChildren as ɵloadChildren };
