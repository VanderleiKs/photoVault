import { n as _defineProperty, t as _objectSpread2 } from "./objectSpread2-weooBxVk.js";
import { $l as Subscription, $n as Output, Ac as InjectionToken, Bt as computed, Ca as ɵɵclassProp, Dn as Host, El as signal, En as ElementRef, Gl as createOperatorSubscriber, Hl as map, In as Input, Ml as ɵɵdefineInjector, Mr as afterNextRender, O as booleanAttribute, Pn as Inject, Qn as Optional, Qo as ɵɵlistener, Wi as setClassMetadata, Wl as Subject, Zc as Version, aa as ɵɵControlFeature, al as effect, ao as ɵɵdefineNgModule, bi as isSubscribable, ca as ɵɵInheritDefinitionFeature, co as ɵɵdirectiveInject, dr as Service, fl as inject, io as ɵɵdefineDirective, ir as Renderer2, jc as Injector, jo as ɵɵgetInheritedFactory, la as ɵɵNgOnChangesFeature, ol as formatRuntimeError, pr as SkipSelf, qc as RuntimeError, ql as Observable, qn as NgModule, qt as untracked, r as ChangeDetectorRef, sl as forwardRef, so as ɵɵdefineService, tn as ApplicationRef, ua as ɵɵProvidersFeature, ur as Self, wc as EventEmitter, wn as Directive, ya as ɵɵattribute, yc as DestroyRef, yi as isPromise } from "./core-CsmqiORA.js";
import { _ as from, b as popResultSelector, h as getDOM, y as innerFrom } from "./common-ObWzeG3O.js";
import { n as argsArgArrayOrObject, r as mapOneOrManyArgs, t as createObject } from "./createObject-D152ZMZv.js";
//#region node_modules/rxjs/dist/esm5/internal/observable/forkJoin.js
function forkJoin() {
	var args = [];
	for (var _i = 0; _i < arguments.length; _i++) args[_i] = arguments[_i];
	var resultSelector = popResultSelector(args);
	var _a = argsArgArrayOrObject(args), sources = _a.args, keys = _a.keys;
	var result = new Observable(function(subscriber) {
		var length = sources.length;
		if (!length) {
			subscriber.complete();
			return;
		}
		var values = new Array(length);
		var remainingCompletions = length;
		var remainingEmissions = length;
		var _loop_1 = function(sourceIndex) {
			var hasValue = false;
			innerFrom(sources[sourceIndex]).subscribe(createOperatorSubscriber(subscriber, function(value) {
				if (!hasValue) {
					hasValue = true;
					remainingEmissions--;
				}
				values[sourceIndex] = value;
			}, function() {
				return remainingCompletions--;
			}, void 0, function() {
				if (!remainingCompletions || !hasValue) {
					if (!remainingEmissions) subscriber.next(keys ? createObject(keys, values) : values);
					subscriber.complete();
				}
			}));
		};
		for (var sourceIndex = 0; sourceIndex < length; sourceIndex++) _loop_1(sourceIndex);
	});
	return resultSelector ? result.pipe(mapOneOrManyArgs(resultSelector)) : result;
}
//#endregion
//#region node_modules/@angular/forms/fesm2022/forms.mjs
/**
* @license Angular v22.2.0
* (c) 2010-2026 Google LLC. https://angular.dev/
* License: MIT
*/
var _BaseControlValueAccessor;
var _BuiltInControlValueAccessor;
var _CheckboxControlValueAccessor;
var _DefaultValueAccessor;
var _AbstractValidatorDirective;
var _MaxValidator;
var _MinValidator;
var _RequiredValidator;
var _CheckboxRequiredValidator;
var _EmailValidator;
var _MinLengthValidator;
var _MaxLengthValidator;
var _PatternValidator;
var _NgControlStatus;
var _NgControlStatusGroup;
var _NgForm;
var _AbstractFormGroupDirective;
var _NgModelGroup;
var _AbstractFormDirective;
var _FormGroupDirective;
var _NgModel;
var _ɵNgNoValidate;
var _NumberValueAccessor;
var _RadioControlRegistry;
var _RadioControlValueAccessor;
var _RangeValueAccessor;
var _FormArrayDirective;
var _FormControlDirective;
var _FormGroupName;
var _FormArrayName;
var _FormControlName;
var _SelectControlValueAccessor;
var _NgSelectOption;
var _SelectMultipleControlValueAccessor;
var _ɵNgSelectMultipleOption;
var _ɵInternalFormsSharedModule;
var _FormBuilder;
var _NonNullableFormBuilder;
var _UntypedFormBuilder;
var _FormsModule;
var _ReactiveFormsModule;
var BaseControlValueAccessor = class {
	constructor(_renderer, _elementRef) {
		_defineProperty(this, "_renderer", void 0);
		_defineProperty(this, "_elementRef", void 0);
		_defineProperty(this, "onChange", (_) => {});
		_defineProperty(this, "onTouched", () => {});
		this._renderer = _renderer;
		this._elementRef = _elementRef;
	}
	setProperty(key, value) {
		this._renderer.setProperty(this._elementRef.nativeElement, key, value);
	}
	registerOnTouched(fn) {
		this.onTouched = fn;
	}
	registerOnChange(fn) {
		this.onChange = fn;
	}
	setDisabledState(isDisabled) {
		this.setProperty("disabled", isDisabled);
	}
};
_BaseControlValueAccessor = BaseControlValueAccessor;
_defineProperty(BaseControlValueAccessor, "ɵfac", function BaseControlValueAccessor_Factory(__ngFactoryType__) {
	return new (__ngFactoryType__ || _BaseControlValueAccessor)(ɵɵdirectiveInject(Renderer2), ɵɵdirectiveInject(ElementRef));
});
_defineProperty(BaseControlValueAccessor, "ɵdir", /*@__PURE__*/ ɵɵdefineDirective({ type: _BaseControlValueAccessor }));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(BaseControlValueAccessor, [{ type: Directive }], () => [{ type: Renderer2 }, { type: ElementRef }], null);
})();
var BuiltInControlValueAccessor = class extends BaseControlValueAccessor {};
_BuiltInControlValueAccessor = BuiltInControlValueAccessor;
_defineProperty(BuiltInControlValueAccessor, "ɵfac", /*@__PURE__*/ (() => {
	let ɵBuiltInControlValueAccessor_BaseFactory = void 0;
	return function BuiltInControlValueAccessor_Factory(__ngFactoryType__) {
		return (ɵBuiltInControlValueAccessor_BaseFactory || (ɵBuiltInControlValueAccessor_BaseFactory = ɵɵgetInheritedFactory(_BuiltInControlValueAccessor)))(__ngFactoryType__ || _BuiltInControlValueAccessor);
	};
})());
_defineProperty(BuiltInControlValueAccessor, "ɵdir", /*@__PURE__*/ ɵɵdefineDirective({
	type: _BuiltInControlValueAccessor,
	features: [ɵɵInheritDefinitionFeature]
}));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(BuiltInControlValueAccessor, [{ type: Directive }], null, null);
})();
var NG_VALUE_ACCESSOR = new InjectionToken(typeof ngDevMode !== "undefined" && ngDevMode ? "NgValueAccessor" : "");
var CHECKBOX_VALUE_ACCESSOR = {
	provide: NG_VALUE_ACCESSOR,
	useExisting: forwardRef(() => CheckboxControlValueAccessor),
	multi: true
};
var CheckboxControlValueAccessor = class extends BuiltInControlValueAccessor {
	writeValue(value) {
		this.setProperty("checked", value);
	}
};
_CheckboxControlValueAccessor = CheckboxControlValueAccessor;
_defineProperty(CheckboxControlValueAccessor, "ɵfac", /*@__PURE__*/ (() => {
	let ɵCheckboxControlValueAccessor_BaseFactory = void 0;
	return function CheckboxControlValueAccessor_Factory(__ngFactoryType__) {
		return (ɵCheckboxControlValueAccessor_BaseFactory || (ɵCheckboxControlValueAccessor_BaseFactory = ɵɵgetInheritedFactory(_CheckboxControlValueAccessor)))(__ngFactoryType__ || _CheckboxControlValueAccessor);
	};
})());
_defineProperty(CheckboxControlValueAccessor, "ɵdir", /*@__PURE__*/ ɵɵdefineDirective({
	type: _CheckboxControlValueAccessor,
	selectors: [
		[
			"input",
			"type",
			"checkbox",
			"formControlName",
			"",
			3,
			"ngNoCva",
			""
		],
		[
			"input",
			"type",
			"checkbox",
			"formControl",
			"",
			3,
			"ngNoCva",
			""
		],
		[
			"input",
			"type",
			"checkbox",
			"ngModel",
			"",
			3,
			"ngNoCva",
			""
		]
	],
	hostBindings: function CheckboxControlValueAccessor_HostBindings(rf, ctx) {
		if (rf & 1) ɵɵlistener("change", function CheckboxControlValueAccessor_change_HostBindingHandler($event) {
			return ctx.onChange($event.target.checked);
		})("blur", function CheckboxControlValueAccessor_blur_HostBindingHandler() {
			return ctx.onTouched();
		});
	},
	standalone: false,
	features: [ɵɵProvidersFeature([CHECKBOX_VALUE_ACCESSOR]), ɵɵInheritDefinitionFeature]
}));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(CheckboxControlValueAccessor, [{
		type: Directive,
		args: [{
			selector: "input[type=checkbox]:not([ngNoCva])[formControlName],input[type=checkbox]:not([ngNoCva])[formControl],input[type=checkbox]:not([ngNoCva])[ngModel]",
			host: {
				"(change)": "onChange($any($event.target).checked)",
				"(blur)": "onTouched()"
			},
			providers: [CHECKBOX_VALUE_ACCESSOR],
			standalone: false
		}]
	}], null, null);
})();
var DEFAULT_VALUE_ACCESSOR = {
	provide: NG_VALUE_ACCESSOR,
	useExisting: forwardRef(() => DefaultValueAccessor),
	multi: true
};
function _isAndroid() {
	const userAgent = getDOM() ? getDOM().getUserAgent() : "";
	return /android (\d+)/.test(userAgent.toLowerCase());
}
var COMPOSITION_BUFFER_MODE = new InjectionToken(typeof ngDevMode !== "undefined" && ngDevMode ? "CompositionEventMode" : "");
var DefaultValueAccessor = class extends BaseControlValueAccessor {
	constructor(renderer, elementRef, _compositionMode) {
		super(renderer, elementRef);
		_defineProperty(this, "_compositionMode", void 0);
		_defineProperty(this, "_composing", false);
		this._compositionMode = _compositionMode;
		if (this._compositionMode == null) this._compositionMode = !_isAndroid();
	}
	writeValue(value) {
		const normalizedValue = value == null ? "" : value;
		this.setProperty("value", normalizedValue);
	}
	_handleInput(value) {
		if (!this._compositionMode || this._compositionMode && !this._composing) this.onChange(value);
	}
	_compositionStart() {
		this._composing = true;
	}
	_compositionEnd(value) {
		this._composing = false;
		this._compositionMode && this.onChange(value);
	}
};
_DefaultValueAccessor = DefaultValueAccessor;
_defineProperty(DefaultValueAccessor, "ɵfac", function DefaultValueAccessor_Factory(__ngFactoryType__) {
	return new (__ngFactoryType__ || _DefaultValueAccessor)(ɵɵdirectiveInject(Renderer2), ɵɵdirectiveInject(ElementRef), ɵɵdirectiveInject(COMPOSITION_BUFFER_MODE, 8));
});
_defineProperty(DefaultValueAccessor, "ɵdir", /*@__PURE__*/ ɵɵdefineDirective({
	type: _DefaultValueAccessor,
	selectors: [
		[
			"input",
			"formControlName",
			"",
			3,
			"type",
			"checkbox",
			3,
			"ngNoCva",
			""
		],
		[
			"textarea",
			"formControlName",
			"",
			3,
			"ngNoCva",
			""
		],
		[
			"input",
			"formControl",
			"",
			3,
			"type",
			"checkbox",
			3,
			"ngNoCva",
			""
		],
		[
			"textarea",
			"formControl",
			"",
			3,
			"ngNoCva",
			""
		],
		[
			"input",
			"ngModel",
			"",
			3,
			"type",
			"checkbox",
			3,
			"ngNoCva",
			""
		],
		[
			"textarea",
			"ngModel",
			"",
			3,
			"ngNoCva",
			""
		],
		[
			"",
			"ngDefaultControl",
			""
		]
	],
	hostBindings: function DefaultValueAccessor_HostBindings(rf, ctx) {
		if (rf & 1) ɵɵlistener("input", function DefaultValueAccessor_input_HostBindingHandler($event) {
			return ctx._handleInput($event.target.value);
		})("blur", function DefaultValueAccessor_blur_HostBindingHandler() {
			return ctx.onTouched();
		})("compositionstart", function DefaultValueAccessor_compositionstart_HostBindingHandler() {
			return ctx._compositionStart();
		})("compositionend", function DefaultValueAccessor_compositionend_HostBindingHandler($event) {
			return ctx._compositionEnd($event.target.value);
		});
	},
	standalone: false,
	features: [ɵɵProvidersFeature([DEFAULT_VALUE_ACCESSOR]), ɵɵInheritDefinitionFeature]
}));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(DefaultValueAccessor, [{
		type: Directive,
		args: [{
			selector: "input:not([type=checkbox]):not([ngNoCva])[formControlName],textarea:not([ngNoCva])[formControlName],input:not([type=checkbox]):not([ngNoCva])[formControl],textarea:not([ngNoCva])[formControl],input:not([type=checkbox]):not([ngNoCva])[ngModel],textarea:not([ngNoCva])[ngModel],[ngDefaultControl]",
			host: {
				"(input)": "_handleInput($any($event.target).value)",
				"(blur)": "onTouched()",
				"(compositionstart)": "_compositionStart()",
				"(compositionend)": "_compositionEnd($any($event.target).value)"
			},
			providers: [DEFAULT_VALUE_ACCESSOR],
			standalone: false
		}]
	}], () => [
		{ type: Renderer2 },
		{ type: ElementRef },
		{
			type: void 0,
			decorators: [{ type: Optional }, {
				type: Inject,
				args: [COMPOSITION_BUFFER_MODE]
			}]
		}
	], null);
})();
function isEmptyInputValue(value) {
	return value == null || lengthOrSize(value) === 0;
}
function lengthOrSize(value) {
	if (value == null) return null;
	else if (Array.isArray(value) || typeof value === "string") return value.length;
	else if (value instanceof Set) return value.size;
	return null;
}
var NG_VALIDATORS = new InjectionToken(typeof ngDevMode !== "undefined" && ngDevMode ? "NgValidators" : "");
var NG_ASYNC_VALIDATORS = new InjectionToken(typeof ngDevMode !== "undefined" && ngDevMode ? "NgAsyncValidators" : "");
var EMAIL_REGEXP = /^(?=.{1,254}$)(?=.{1,64}@)[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+)*@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
var Validators = class {
	static min(min) {
		return minValidator(min);
	}
	static max(max) {
		return maxValidator(max);
	}
	static required(control) {
		return requiredValidator(control);
	}
	static requiredTrue(control) {
		return requiredTrueValidator(control);
	}
	static email(control) {
		return emailValidator(control);
	}
	static minLength(minLength) {
		return minLengthValidator(minLength);
	}
	static maxLength(maxLength) {
		return maxLengthValidator(maxLength);
	}
	static pattern(pattern) {
		return patternValidator(pattern);
	}
	static nullValidator(control) {
		return nullValidator();
	}
	static compose(validators) {
		return compose(validators);
	}
	static composeAsync(validators) {
		return composeAsync(validators);
	}
};
function minValidator(min) {
	return (control) => {
		if (control.value == null || min == null) return null;
		const value = parseFloat(control.value);
		return !isNaN(value) && value < min ? { "min": {
			"min": min,
			"actual": control.value
		} } : null;
	};
}
function maxValidator(max) {
	return (control) => {
		if (control.value == null || max == null) return null;
		const value = parseFloat(control.value);
		return !isNaN(value) && value > max ? { "max": {
			"max": max,
			"actual": control.value
		} } : null;
	};
}
function requiredValidator(control) {
	return isEmptyInputValue(control.value) ? { "required": true } : null;
}
function requiredTrueValidator(control) {
	return control.value === true ? null : { "required": true };
}
function emailValidator(control) {
	if (isEmptyInputValue(control.value)) return null;
	return EMAIL_REGEXP.test(control.value) ? null : { "email": true };
}
function minLengthValidator(minLength) {
	return (control) => {
		var _control$value$length, _control$value;
		const length = (_control$value$length = (_control$value = control.value) === null || _control$value === void 0 ? void 0 : _control$value.length) !== null && _control$value$length !== void 0 ? _control$value$length : lengthOrSize(control.value);
		if (length === null || length === 0) return null;
		return length < minLength ? { "minlength": {
			"requiredLength": minLength,
			"actualLength": length
		} } : null;
	};
}
function maxLengthValidator(maxLength) {
	return (control) => {
		var _control$value$length2, _control$value2;
		const length = (_control$value$length2 = (_control$value2 = control.value) === null || _control$value2 === void 0 ? void 0 : _control$value2.length) !== null && _control$value$length2 !== void 0 ? _control$value$length2 : lengthOrSize(control.value);
		if (length !== null && length > maxLength) return { "maxlength": {
			"requiredLength": maxLength,
			"actualLength": length
		} };
		return null;
	};
}
function patternValidator(pattern) {
	if (!pattern) return nullValidator;
	let regex;
	let regexStr;
	if (typeof pattern === "string") {
		regexStr = "";
		if (pattern.charAt(0) !== "^") regexStr += "^";
		regexStr += pattern;
		if (pattern.charAt(pattern.length - 1) !== "$") regexStr += "$";
		regex = new RegExp(regexStr);
	} else {
		regexStr = pattern.toString();
		regex = pattern;
	}
	return (control) => {
		if (isEmptyInputValue(control.value)) return null;
		const value = control.value;
		return regex.test(value) ? null : { "pattern": {
			"requiredPattern": regexStr,
			"actualValue": value
		} };
	};
}
function nullValidator(control) {
	return null;
}
function isPresent(o) {
	return o != null;
}
function toObservable(value) {
	const obs = isPromise(value) ? from(value) : value;
	if ((typeof ngDevMode === "undefined" || ngDevMode) && !isSubscribable(obs)) {
		let errorMessage = `Expected async validator to return Promise or Observable.`;
		if (typeof value === "object") errorMessage += " Are you using a synchronous validator where an async validator is expected?";
		throw new RuntimeError(-1101, errorMessage);
	}
	return obs;
}
function mergeErrors(arrayOfErrors) {
	let res = {};
	arrayOfErrors.forEach((errors) => {
		res = errors != null ? _objectSpread2(_objectSpread2({}, res), errors) : res;
	});
	return Object.keys(res).length === 0 ? null : res;
}
function executeValidators(control, validators) {
	return validators.map((validator) => validator(control));
}
function isValidatorFn(validator) {
	return !validator.validate;
}
function normalizeValidators(validators) {
	return validators.map((validator) => {
		return isValidatorFn(validator) ? validator : (c) => validator.validate(c);
	});
}
function compose(validators) {
	if (!validators) return null;
	const presentValidators = validators.filter(isPresent);
	if (presentValidators.length == 0) return null;
	return function(control) {
		return mergeErrors(executeValidators(control, presentValidators));
	};
}
function composeValidators(validators) {
	return validators != null ? compose(normalizeValidators(validators)) : null;
}
function composeAsync(validators) {
	if (!validators) return null;
	const presentValidators = validators.filter(isPresent);
	if (presentValidators.length == 0) return null;
	return function(control) {
		return forkJoin(executeValidators(control, presentValidators).map(toObservable)).pipe(map(mergeErrors));
	};
}
function composeAsyncValidators(validators) {
	return validators != null ? composeAsync(normalizeValidators(validators)) : null;
}
function mergeValidators(controlValidators, dirValidator) {
	if (controlValidators === null) return [dirValidator];
	return Array.isArray(controlValidators) ? [...controlValidators, dirValidator] : [controlValidators, dirValidator];
}
function getControlValidators(control) {
	return control._rawValidators;
}
function getControlAsyncValidators(control) {
	return control._rawAsyncValidators;
}
function makeValidatorsArray(validators) {
	if (!validators) return [];
	return Array.isArray(validators) ? validators : [validators];
}
function hasValidator(validators, validator) {
	return Array.isArray(validators) ? validators.includes(validator) : validators === validator;
}
function addValidators(validators, currentValidators) {
	const current = makeValidatorsArray(currentValidators);
	makeValidatorsArray(validators).forEach((v) => {
		if (!hasValidator(current, v)) current.push(v);
	});
	return current;
}
function removeValidators(validators, currentValidators) {
	return makeValidatorsArray(currentValidators).filter((v) => !hasValidator(validators, v));
}
var AbstractControlDirective = class {
	constructor() {
		_defineProperty(this, "_composedValidatorFn", void 0);
		_defineProperty(this, "_composedAsyncValidatorFn", void 0);
		_defineProperty(this, "_rawValidators", []);
		_defineProperty(this, "_rawAsyncValidators", []);
		_defineProperty(this, "_onDestroyCallbacks", []);
	}
	get value() {
		return this.control ? this.control.value : null;
	}
	get valid() {
		return this.control ? this.control.valid : null;
	}
	get invalid() {
		return this.control ? this.control.invalid : null;
	}
	get pending() {
		return this.control ? this.control.pending : null;
	}
	get disabled() {
		return this.control ? this.control.disabled : null;
	}
	get enabled() {
		return this.control ? this.control.enabled : null;
	}
	get errors() {
		return this.control ? this.control.errors : null;
	}
	get pristine() {
		return this.control ? this.control.pristine : null;
	}
	get dirty() {
		return this.control ? this.control.dirty : null;
	}
	get touched() {
		return this.control ? this.control.touched : null;
	}
	get status() {
		return this.control ? this.control.status : null;
	}
	get untouched() {
		return this.control ? this.control.untouched : null;
	}
	get statusChanges() {
		return this.control ? this.control.statusChanges : null;
	}
	get valueChanges() {
		return this.control ? this.control.valueChanges : null;
	}
	get path() {
		return null;
	}
	_setValidators(validators) {
		this._rawValidators = validators || [];
		this._composedValidatorFn = composeValidators(this._rawValidators);
	}
	_setAsyncValidators(validators) {
		this._rawAsyncValidators = validators || [];
		this._composedAsyncValidatorFn = composeAsyncValidators(this._rawAsyncValidators);
	}
	get validator() {
		return this._composedValidatorFn || null;
	}
	get asyncValidator() {
		return this._composedAsyncValidatorFn || null;
	}
	_registerOnDestroy(fn) {
		this._onDestroyCallbacks.push(fn);
	}
	_invokeOnDestroyCallbacks() {
		this._onDestroyCallbacks.forEach((fn) => fn());
		this._onDestroyCallbacks = [];
	}
	reset(value = void 0) {
		var _this$control;
		(_this$control = this.control) === null || _this$control === void 0 || _this$control.reset(value);
	}
	hasError(errorCode, path) {
		return this.control ? this.control.hasError(errorCode, path) : false;
	}
	getError(errorCode, path) {
		return this.control ? this.control.getError(errorCode, path) : null;
	}
};
var ControlContainer = class extends AbstractControlDirective {
	constructor(..._args) {
		super(..._args);
		_defineProperty(this, "name", void 0);
	}
	get formDirective() {
		return null;
	}
	get path() {
		return null;
	}
};
var formControlNameExample = `
  <div [formGroup]="myGroup">
    <input formControlName="firstName">
  </div>

  In your class:

  this.myGroup = new FormGroup({
      firstName: new FormControl()
  });`;
var formGroupNameExample = `
  <div [formGroup]="myGroup">
      <div formGroupName="person">
        <input formControlName="firstName">
      </div>
  </div>

  In your class:

  this.myGroup = new FormGroup({
      person: new FormGroup({ firstName: new FormControl() })
  });`;
var formArrayNameExample = `
  <div [formGroup]="myGroup">
    <div formArrayName="cities">
      <div *ngFor="let city of cityArray.controls; index as i">
        <input [formControlName]="i">
      </div>
    </div>
  </div>

  In your class:

  this.cityArray = new FormArray([new FormControl('SF')]);
  this.myGroup = new FormGroup({
    cities: this.cityArray
  });`;
var ngModelGroupExample = `
  <form>
      <div ngModelGroup="person">
        <input [(ngModel)]="person.name" name="firstName">
      </div>
  </form>`;
var ngModelWithFormGroupExample = `
  <div [formGroup]="myGroup">
      <input formControlName="firstName">
      <input [(ngModel)]="showMoreControls" [ngModelOptions]="{standalone: true}">
  </div>
`;
var VERSION = /* @__PURE__ */ new Version("22.2.0");
function controlParentException(nameOrIndex) {
	return new RuntimeError(1050, `formControlName must be used with a parent formGroup or formArray directive. You'll want to add a formGroup/formArray
      directive and pass it an existing FormGroup/FormArray instance (you can create one in your class).

      ${describeFormControl(nameOrIndex)}

    Example:

    ${formControlNameExample}`);
}
function describeFormControl(nameOrIndex) {
	if (nameOrIndex == null || nameOrIndex === "") return "";
	return `Affected Form Control ${typeof nameOrIndex === "string" ? "name" : "index"}: "${nameOrIndex}"`;
}
function ngModelGroupException() {
	return new RuntimeError(1051, `formControlName cannot be used with an ngModelGroup parent. It is only compatible with parents
      that also have a "form" prefix: formGroupName, formArrayName, or formGroup.

      Option 1:  Update the parent to be formGroupName (reactive form strategy)

      ${formGroupNameExample}

      Option 2: Use ngModel instead of formControlName (template-driven strategy)

      ${ngModelGroupExample}`);
}
function missingFormException() {
	return new RuntimeError(1052, `formGroup expects a FormGroup instance. Please pass one in.

      Example:

      ${formControlNameExample}`);
}
function groupParentException() {
	return new RuntimeError(1053, `formGroupName must be used with a parent formGroup directive.  You'll want to add a formGroup
    directive and pass it an existing FormGroup instance (you can create one in your class).

    Example:

    ${formGroupNameExample}`);
}
function arrayParentException() {
	return new RuntimeError(1054, `formArrayName must be used with a parent formGroup directive.  You'll want to add a formGroup
      directive and pass it an existing FormGroup instance (you can create one in your class).

      Example:

      ${formArrayNameExample}`);
}
var disabledAttrWarning = `
  It looks like you're using the disabled attribute with a reactive form directive. If you set disabled to true
  when you set up this control in your component class, the disabled attribute will actually be set in the DOM for
  you. We recommend using this approach to avoid 'changed after checked' errors.

  Example:
  // Specify the \`disabled\` property at control creation time:
  form = new FormGroup({
    first: new FormControl({value: 'Nancy', disabled: true}, Validators.required),
    last: new FormControl('Drew', Validators.required)
  });

  // Controls can also be enabled/disabled after creation:
  form.get('first')?.enable();
  form.get('last')?.disable();
`;
var asyncValidatorsDroppedWithOptsWarning = `
  It looks like you're constructing using a FormControl with both an options argument and an
  async validators argument. Mixing these arguments will cause your async validators to be dropped.
  You should either put all your validators in the options object, or in separate validators
  arguments. For example:

  // Using validators arguments
  fc = new FormControl(42, Validators.required, myAsyncValidator);

  // Using AbstractControlOptions
  fc = new FormControl(42, {validators: Validators.required, asyncValidators: myAV});

  // Do NOT mix them: async validators will be dropped!
  fc = new FormControl(42, {validators: Validators.required}, /* Oops! */ myAsyncValidator);
`;
function ngModelWarning(directiveName) {
	return `
  It looks like you're using ngModel on the same form field as ${directiveName}.
  Support for using the ngModel input property and ngModelChange event with
  reactive form directives has been deprecated in Angular v6 and will be removed
  in a future version of Angular.

  For more information on this, see our API docs here:
  https://${VERSION.major !== "0" ? `v${VERSION.major}.` : ""}angular.dev/api/forms/${directiveName === "formControl" ? "FormControlDirective" : "FormControlName"}
  `;
}
function describeKey(isFormGroup, key) {
	return isFormGroup ? `with name: '${key}'` : `at index: ${key}`;
}
function noControlsError(isFormGroup) {
	return `
    There are no form controls registered with this ${isFormGroup ? "group" : "array"} yet. If you're using ngModel,
    you may want to check next tick (e.g. use setTimeout).
  `;
}
function missingControlError(isFormGroup, key) {
	return `Cannot find form control ${describeKey(isFormGroup, key)}`;
}
function missingControlValueError(isFormGroup, key) {
	return `Must supply a value for form control ${describeKey(isFormGroup, key)}`;
}
var VALID = "VALID";
var INVALID = "INVALID";
var PENDING = "PENDING";
var DISABLED = "DISABLED";
var ControlEvent = class {};
var ValueChangeEvent = class extends ControlEvent {
	constructor(value, source) {
		super();
		_defineProperty(this, "value", void 0);
		_defineProperty(this, "source", void 0);
		this.value = value;
		this.source = source;
	}
};
var PristineChangeEvent = class extends ControlEvent {
	constructor(pristine, source) {
		super();
		_defineProperty(this, "pristine", void 0);
		_defineProperty(this, "source", void 0);
		this.pristine = pristine;
		this.source = source;
	}
};
var TouchedChangeEvent = class extends ControlEvent {
	constructor(touched, source) {
		super();
		_defineProperty(this, "touched", void 0);
		_defineProperty(this, "source", void 0);
		this.touched = touched;
		this.source = source;
	}
};
var StatusChangeEvent = class extends ControlEvent {
	constructor(status, source) {
		super();
		_defineProperty(this, "status", void 0);
		_defineProperty(this, "source", void 0);
		this.status = status;
		this.source = source;
	}
};
var FormSubmittedEvent = class extends ControlEvent {
	constructor(source) {
		super();
		_defineProperty(this, "source", void 0);
		this.source = source;
	}
};
var FormResetEvent = class extends ControlEvent {
	constructor(source) {
		super();
		_defineProperty(this, "source", void 0);
		this.source = source;
	}
};
function pickValidators(validatorOrOpts) {
	return (isOptionsObj(validatorOrOpts) ? validatorOrOpts.validators : validatorOrOpts) || null;
}
function coerceToValidator(validator) {
	return Array.isArray(validator) ? composeValidators(validator) : validator || null;
}
function pickAsyncValidators(asyncValidator, validatorOrOpts) {
	if (typeof ngDevMode === "undefined" || ngDevMode) {
		if (isOptionsObj(validatorOrOpts) && asyncValidator) console.warn(asyncValidatorsDroppedWithOptsWarning);
	}
	return (isOptionsObj(validatorOrOpts) ? validatorOrOpts.asyncValidators : asyncValidator) || null;
}
function coerceToAsyncValidator(asyncValidator) {
	return Array.isArray(asyncValidator) ? composeAsyncValidators(asyncValidator) : asyncValidator || null;
}
function isOptionsObj(validatorOrOpts) {
	return validatorOrOpts != null && !Array.isArray(validatorOrOpts) && typeof validatorOrOpts === "object";
}
function assertControlPresent(parent, isGroup, key) {
	const controls = parent.controls;
	if (!(isGroup ? Object.keys(controls) : controls).length) throw new RuntimeError(1e3, typeof ngDevMode === "undefined" || ngDevMode ? noControlsError(isGroup) : "");
	if (!hasOwnControl(controls, key)) throw new RuntimeError(1001, typeof ngDevMode === "undefined" || ngDevMode ? missingControlError(isGroup, key) : "");
}
function assertAllValuesPresent(control, isGroup, value) {
	control._forEachChild((_, key) => {
		if (value[key] === void 0) throw new RuntimeError(-1002, typeof ngDevMode === "undefined" || ngDevMode ? missingControlValueError(isGroup, key) : "");
	});
}
var AbstractControl = class {
	constructor(validators, asyncValidators) {
		_defineProperty(this, "_pendingDirty", false);
		_defineProperty(this, "_hasOwnPendingAsyncValidator", null);
		_defineProperty(this, "_pendingTouched", false);
		_defineProperty(this, "_onCollectionChange", () => {});
		_defineProperty(this, "_updateOn", void 0);
		_defineProperty(this, "_hasRequired", signal(false, ...ngDevMode ? [{ debugName: "_hasRequired" }] : []));
		_defineProperty(this, "_parent", null);
		_defineProperty(this, "_asyncValidationSubscription", void 0);
		_defineProperty(this, "_composedValidatorFn", void 0);
		_defineProperty(this, "_composedAsyncValidatorFn", void 0);
		_defineProperty(this, "_rawValidators", void 0);
		_defineProperty(this, "_rawAsyncValidators", void 0);
		_defineProperty(this, "value", void 0);
		_defineProperty(this, "_status", computed(() => this.statusReactive(), ...ngDevMode ? [{ debugName: "_status" }] : []));
		_defineProperty(this, "statusReactive", signal(void 0, ...ngDevMode ? [{ debugName: "statusReactive" }] : []));
		_defineProperty(this, "errors", void 0);
		_defineProperty(this, "_pristine", computed(() => this.pristineReactive(), ...ngDevMode ? [{ debugName: "_pristine" }] : []));
		_defineProperty(this, "pristineReactive", signal(true, ...ngDevMode ? [{ debugName: "pristineReactive" }] : []));
		_defineProperty(this, "_touched", computed(() => this.touchedReactive(), ...ngDevMode ? [{ debugName: "_touched" }] : []));
		_defineProperty(this, "touchedReactive", signal(false, ...ngDevMode ? [{ debugName: "touchedReactive" }] : []));
		_defineProperty(this, "_events", new Subject());
		_defineProperty(this, "events", this._events.asObservable());
		_defineProperty(this, "valueChanges", void 0);
		_defineProperty(this, "statusChanges", void 0);
		_defineProperty(this, "_onDisabledChange", []);
		this._assignValidators(validators);
		this._assignAsyncValidators(asyncValidators);
	}
	get validator() {
		return this._composedValidatorFn;
	}
	set validator(validatorFn) {
		this._rawValidators = this._composedValidatorFn = validatorFn;
		this._updateHasRequiredValidator();
	}
	get asyncValidator() {
		return this._composedAsyncValidatorFn;
	}
	set asyncValidator(asyncValidatorFn) {
		this._rawAsyncValidators = this._composedAsyncValidatorFn = asyncValidatorFn;
	}
	get parent() {
		return this._parent;
	}
	get status() {
		return untracked(this.statusReactive);
	}
	set status(v) {
		untracked(() => this.statusReactive.set(v));
	}
	get valid() {
		return this.status === VALID;
	}
	get invalid() {
		return this.status === INVALID;
	}
	get pending() {
		return this.status === PENDING;
	}
	get disabled() {
		return this.status === DISABLED;
	}
	get enabled() {
		return this.status !== DISABLED;
	}
	get pristine() {
		return untracked(this.pristineReactive);
	}
	set pristine(v) {
		untracked(() => this.pristineReactive.set(v));
	}
	get dirty() {
		return !this.pristine;
	}
	get touched() {
		return untracked(this.touchedReactive);
	}
	set touched(v) {
		untracked(() => this.touchedReactive.set(v));
	}
	get untouched() {
		return !this.touched;
	}
	get updateOn() {
		return this._updateOn ? this._updateOn : this.parent ? this.parent.updateOn : "change";
	}
	setValidators(validators) {
		this._assignValidators(validators);
	}
	setAsyncValidators(validators) {
		this._assignAsyncValidators(validators);
	}
	addValidators(validators) {
		this.setValidators(addValidators(validators, this._rawValidators));
	}
	addAsyncValidators(validators) {
		this.setAsyncValidators(addValidators(validators, this._rawAsyncValidators));
	}
	removeValidators(validators) {
		this.setValidators(removeValidators(validators, this._rawValidators));
	}
	removeAsyncValidators(validators) {
		this.setAsyncValidators(removeValidators(validators, this._rawAsyncValidators));
	}
	hasValidator(validator) {
		return hasValidator(this._rawValidators, validator);
	}
	hasAsyncValidator(validator) {
		return hasValidator(this._rawAsyncValidators, validator);
	}
	clearValidators() {
		this.validator = null;
	}
	clearAsyncValidators() {
		this.asyncValidator = null;
	}
	markAsTouched(opts = {}) {
		var _opts$sourceControl;
		const changed = this.touched === false;
		this.touched = true;
		const sourceControl = (_opts$sourceControl = opts.sourceControl) !== null && _opts$sourceControl !== void 0 ? _opts$sourceControl : this;
		if (!opts.onlySelf) {
			var _this$_parent;
			(_this$_parent = this._parent) === null || _this$_parent === void 0 || _this$_parent.markAsTouched(_objectSpread2(_objectSpread2({}, opts), {}, { sourceControl }));
		}
		if (changed && opts.emitEvent !== false) this._events.next(new TouchedChangeEvent(true, sourceControl));
	}
	markAllAsDirty(opts = {}) {
		this.markAsDirty({
			onlySelf: true,
			emitEvent: opts.emitEvent,
			sourceControl: this
		});
		this._forEachChild((control) => control.markAllAsDirty(opts));
	}
	markAllAsTouched(opts = {}) {
		this.markAsTouched({
			onlySelf: true,
			emitEvent: opts.emitEvent,
			sourceControl: this
		});
		this._forEachChild((control) => control.markAllAsTouched(opts));
	}
	markAsUntouched(opts = {}) {
		var _opts$sourceControl2;
		const changed = this.touched === true;
		this.touched = false;
		this._pendingTouched = false;
		const sourceControl = (_opts$sourceControl2 = opts.sourceControl) !== null && _opts$sourceControl2 !== void 0 ? _opts$sourceControl2 : this;
		this._forEachChild((control) => {
			control.markAsUntouched({
				onlySelf: true,
				emitEvent: opts.emitEvent,
				sourceControl
			});
		});
		if (!opts.onlySelf) {
			var _this$_parent2;
			(_this$_parent2 = this._parent) === null || _this$_parent2 === void 0 || _this$_parent2._updateTouched(opts, sourceControl);
		}
		if (changed && opts.emitEvent !== false) this._events.next(new TouchedChangeEvent(false, sourceControl));
	}
	markAsDirty(opts = {}) {
		var _opts$sourceControl3;
		const changed = this.pristine === true;
		this.pristine = false;
		const sourceControl = (_opts$sourceControl3 = opts.sourceControl) !== null && _opts$sourceControl3 !== void 0 ? _opts$sourceControl3 : this;
		if (!opts.onlySelf) {
			var _this$_parent3;
			(_this$_parent3 = this._parent) === null || _this$_parent3 === void 0 || _this$_parent3.markAsDirty(_objectSpread2(_objectSpread2({}, opts), {}, { sourceControl }));
		}
		if (changed && opts.emitEvent !== false) this._events.next(new PristineChangeEvent(false, sourceControl));
	}
	markAsPristine(opts = {}) {
		var _opts$sourceControl4;
		const changed = this.pristine === false;
		this.pristine = true;
		this._pendingDirty = false;
		const sourceControl = (_opts$sourceControl4 = opts.sourceControl) !== null && _opts$sourceControl4 !== void 0 ? _opts$sourceControl4 : this;
		this._forEachChild((control) => {
			control.markAsPristine({
				onlySelf: true,
				emitEvent: opts.emitEvent
			});
		});
		if (!opts.onlySelf) {
			var _this$_parent4;
			(_this$_parent4 = this._parent) === null || _this$_parent4 === void 0 || _this$_parent4._updatePristine(opts, sourceControl);
		}
		if (changed && opts.emitEvent !== false) this._events.next(new PristineChangeEvent(true, sourceControl));
	}
	markAsPending(opts = {}) {
		var _opts$sourceControl5;
		this.status = PENDING;
		const sourceControl = (_opts$sourceControl5 = opts.sourceControl) !== null && _opts$sourceControl5 !== void 0 ? _opts$sourceControl5 : this;
		if (opts.emitEvent !== false) {
			this._events.next(new StatusChangeEvent(this.status, sourceControl));
			this.statusChanges.emit(this.status);
		}
		if (!opts.onlySelf) {
			var _this$_parent5;
			(_this$_parent5 = this._parent) === null || _this$_parent5 === void 0 || _this$_parent5.markAsPending(_objectSpread2(_objectSpread2({}, opts), {}, { sourceControl }));
		}
	}
	disable(opts = {}) {
		var _opts$sourceControl6;
		const skipPristineCheck = this._parentMarkedDirty(opts.onlySelf);
		this.status = DISABLED;
		this.errors = null;
		this._forEachChild((control) => {
			control.disable(_objectSpread2(_objectSpread2({}, opts), {}, { onlySelf: true }));
		});
		this._updateValue();
		const sourceControl = (_opts$sourceControl6 = opts.sourceControl) !== null && _opts$sourceControl6 !== void 0 ? _opts$sourceControl6 : this;
		if (opts.emitEvent !== false) {
			this._events.next(new ValueChangeEvent(this.value, sourceControl));
			this._events.next(new StatusChangeEvent(this.status, sourceControl));
			this.valueChanges.emit(this.value);
			this.statusChanges.emit(this.status);
		}
		this._updateAncestors(_objectSpread2(_objectSpread2({}, opts), {}, { skipPristineCheck }), this);
		this._onDisabledChange.forEach((changeFn) => changeFn(true));
	}
	enable(opts = {}) {
		const skipPristineCheck = this._parentMarkedDirty(opts.onlySelf);
		this.status = VALID;
		this._forEachChild((control) => {
			control.enable(_objectSpread2(_objectSpread2({}, opts), {}, { onlySelf: true }));
		});
		this.updateValueAndValidity({
			onlySelf: true,
			emitEvent: opts.emitEvent
		});
		this._updateAncestors(_objectSpread2(_objectSpread2({}, opts), {}, { skipPristineCheck }), this);
		this._onDisabledChange.forEach((changeFn) => changeFn(false));
	}
	_updateAncestors(opts, sourceControl) {
		if (!opts.onlySelf) {
			var _this$_parent6, _this$_parent8;
			(_this$_parent6 = this._parent) === null || _this$_parent6 === void 0 || _this$_parent6.updateValueAndValidity(opts);
			if (!opts.skipPristineCheck) {
				var _this$_parent7;
				(_this$_parent7 = this._parent) === null || _this$_parent7 === void 0 || _this$_parent7._updatePristine({}, sourceControl);
			}
			(_this$_parent8 = this._parent) === null || _this$_parent8 === void 0 || _this$_parent8._updateTouched({}, sourceControl);
		}
	}
	setParent(parent) {
		this._parent = parent;
	}
	getRawValue() {
		return this.value;
	}
	updateValueAndValidity(opts = {}) {
		var _opts$sourceControl7;
		this._setInitialStatus();
		this._updateValue();
		if (this.enabled) {
			const shouldHaveEmitted = this._cancelExistingSubscription();
			this.errors = this._runValidator();
			this.status = this._calculateStatus();
			if (this.status === VALID || this.status === PENDING) this._runAsyncValidator(shouldHaveEmitted, opts.emitEvent);
		}
		const sourceControl = (_opts$sourceControl7 = opts.sourceControl) !== null && _opts$sourceControl7 !== void 0 ? _opts$sourceControl7 : this;
		if (opts.emitEvent !== false) {
			this._events.next(new ValueChangeEvent(this.value, sourceControl));
			this._events.next(new StatusChangeEvent(this.status, sourceControl));
			this.valueChanges.emit(this.value);
			this.statusChanges.emit(this.status);
		}
		if (!opts.onlySelf) {
			var _this$_parent9;
			(_this$_parent9 = this._parent) === null || _this$_parent9 === void 0 || _this$_parent9.updateValueAndValidity(_objectSpread2(_objectSpread2({}, opts), {}, { sourceControl }));
		}
	}
	_updateTreeValidity(opts = { emitEvent: true }) {
		this._forEachChild((ctrl) => ctrl._updateTreeValidity(opts));
		this.updateValueAndValidity({
			onlySelf: true,
			emitEvent: opts.emitEvent
		});
	}
	_setInitialStatus() {
		this.status = this._allControlsDisabled() ? DISABLED : VALID;
	}
	_runValidator() {
		return this.validator ? this.validator(this) : null;
	}
	_runAsyncValidator(shouldHaveEmitted, emitEvent) {
		if (this.asyncValidator) {
			this.status = PENDING;
			this._hasOwnPendingAsyncValidator = {
				emitEvent: emitEvent !== false,
				shouldHaveEmitted: shouldHaveEmitted !== false
			};
			const obs = toObservable(this.asyncValidator(this));
			this._asyncValidationSubscription = obs.subscribe((errors) => {
				this._hasOwnPendingAsyncValidator = null;
				this.setErrors(errors, {
					emitEvent,
					shouldHaveEmitted
				});
			});
		}
	}
	_cancelExistingSubscription() {
		if (this._asyncValidationSubscription) {
			var _ref, _this$_hasOwnPendingA, _this$_hasOwnPendingA2;
			this._asyncValidationSubscription.unsubscribe();
			const shouldHaveEmitted = (_ref = ((_this$_hasOwnPendingA = this._hasOwnPendingAsyncValidator) === null || _this$_hasOwnPendingA === void 0 ? void 0 : _this$_hasOwnPendingA.emitEvent) || ((_this$_hasOwnPendingA2 = this._hasOwnPendingAsyncValidator) === null || _this$_hasOwnPendingA2 === void 0 ? void 0 : _this$_hasOwnPendingA2.shouldHaveEmitted)) !== null && _ref !== void 0 ? _ref : false;
			this._hasOwnPendingAsyncValidator = null;
			return shouldHaveEmitted;
		}
		return false;
	}
	setErrors(errors, opts = {}) {
		this.errors = errors;
		this._updateControlsErrors(opts.emitEvent !== false, this, opts.shouldHaveEmitted);
	}
	get(path) {
		let currPath = path;
		if (currPath == null) return null;
		if (!Array.isArray(currPath)) currPath = currPath.split(".");
		if (currPath.length === 0) return null;
		return currPath.reduce((control, name) => control && control._find(name), this);
	}
	getError(errorCode, path) {
		const control = path ? this.get(path) : this;
		return (control === null || control === void 0 ? void 0 : control.errors) ? control.errors[errorCode] : null;
	}
	hasError(errorCode, path) {
		return !!this.getError(errorCode, path);
	}
	get root() {
		let x = this;
		while (x._parent) x = x._parent;
		return x;
	}
	_updateControlsErrors(emitEvent, changedControl, shouldHaveEmitted) {
		this.status = this._calculateStatus();
		if (emitEvent) this.statusChanges.emit(this.status);
		if (emitEvent || shouldHaveEmitted) this._events.next(new StatusChangeEvent(this.status, changedControl));
		if (this._parent) this._parent._updateControlsErrors(emitEvent, changedControl, shouldHaveEmitted);
	}
	_initObservables() {
		this.valueChanges = new EventEmitter();
		this.statusChanges = new EventEmitter();
	}
	_calculateStatus() {
		if (this._allControlsDisabled()) return DISABLED;
		if (this.errors) return INVALID;
		if (this._hasOwnPendingAsyncValidator || this._anyControlsHaveStatus(PENDING)) return PENDING;
		if (this._anyControlsHaveStatus(INVALID)) return INVALID;
		return VALID;
	}
	_anyControlsHaveStatus(status) {
		return this._anyControls((control) => control.status === status);
	}
	_anyControlsDirty() {
		return this._anyControls((control) => control.dirty);
	}
	_anyControlsTouched() {
		return this._anyControls((control) => control.touched);
	}
	_updatePristine(opts, changedControl) {
		const newPristine = !this._anyControlsDirty();
		const changed = this.pristine !== newPristine;
		this.pristine = newPristine;
		if (!opts.onlySelf) {
			var _this$_parent10;
			(_this$_parent10 = this._parent) === null || _this$_parent10 === void 0 || _this$_parent10._updatePristine(opts, changedControl);
		}
		if (changed) this._events.next(new PristineChangeEvent(this.pristine, changedControl));
	}
	_updateTouched(opts = {}, changedControl) {
		this.touched = this._anyControlsTouched();
		this._events.next(new TouchedChangeEvent(this.touched, changedControl));
		if (!opts.onlySelf) {
			var _this$_parent11;
			(_this$_parent11 = this._parent) === null || _this$_parent11 === void 0 || _this$_parent11._updateTouched(opts, changedControl);
		}
	}
	_registerOnCollectionChange(fn) {
		this._onCollectionChange = fn;
	}
	_setUpdateStrategy(opts) {
		if (isOptionsObj(opts) && opts.updateOn != null) this._updateOn = opts.updateOn;
	}
	_parentMarkedDirty(onlySelf) {
		var _this$_parent12;
		return !onlySelf && !!((_this$_parent12 = this._parent) === null || _this$_parent12 === void 0 ? void 0 : _this$_parent12.dirty) && !this._parent._anyControlsDirty();
	}
	_find(name) {
		return null;
	}
	_assignValidators(validators) {
		this._rawValidators = Array.isArray(validators) ? validators.slice() : validators;
		this._composedValidatorFn = coerceToValidator(this._rawValidators);
		this._updateHasRequiredValidator();
	}
	_assignAsyncValidators(validators) {
		this._rawAsyncValidators = Array.isArray(validators) ? validators.slice() : validators;
		this._composedAsyncValidatorFn = coerceToAsyncValidator(this._rawAsyncValidators);
	}
	_updateHasRequiredValidator() {
		untracked(() => this._hasRequired.set(this.hasValidator(Validators.required)));
	}
};
function hasOwnControl(controls, name) {
	return Object.hasOwn(controls, name);
}
function isNativeFormElement(element) {
	return element.tagName === "INPUT" || element.tagName === "SELECT" || element.tagName === "TEXTAREA";
}
function elementAcceptsMinMax(element) {
	if (element.tagName !== "INPUT") return false;
	const type = element.type;
	return type === "number" || type === "range" || type === "date" || type === "month";
}
function isTextualFormElement(element) {
	return element.tagName === "INPUT" || element.tagName === "TEXTAREA";
}
function setNativeDomProperty(renderer, element, name, value) {
	switch (name) {
		case "name":
			renderer.setAttribute(element, name, value);
			break;
		case "disabled":
		case "readonly":
		case "required":
			if (value) renderer.setAttribute(element, name, "");
			else renderer.removeAttribute(element, name);
			break;
		case "max":
		case "min":
		case "minLength":
		case "maxLength": if (value !== void 0) renderer.setAttribute(element, name, value.toString());
		else renderer.removeAttribute(element, name);
	}
}
var ReactiveValidationError = class {
	constructor({ kind, context, control }) {
		_defineProperty(this, "kind", void 0);
		_defineProperty(this, "context", void 0);
		_defineProperty(this, "control", void 0);
		_defineProperty(this, "message", void 0);
		this.kind = kind;
		this.context = context;
		this.control = control;
	}
};
function toInteger(value) {
	return typeof value === "number" ? value : parseInt(value, 10);
}
function toFloat(value) {
	return typeof value === "number" ? value : parseFloat(value);
}
var AbstractValidatorDirective = class {
	constructor() {
		_defineProperty(this, "_validator", nullValidator);
		_defineProperty(this, "_onChange", void 0);
		_defineProperty(this, "_enabled", void 0);
	}
	ngOnChanges(changes) {
		if (this.inputName in changes) {
			var _this$_onChange;
			const input = this.normalizeInput(changes[this.inputName].currentValue);
			this._enabled = this.enabled(input);
			this._validator = this._enabled ? this.createValidator(input) : nullValidator;
			(_this$_onChange = this._onChange) === null || _this$_onChange === void 0 || _this$_onChange.call(this);
		}
	}
	validate(control) {
		return this._validator(control);
	}
	registerOnValidatorChange(fn) {
		this._onChange = fn;
	}
	enabled(input) {
		return input != null;
	}
};
_AbstractValidatorDirective = AbstractValidatorDirective;
_defineProperty(AbstractValidatorDirective, "ɵfac", function AbstractValidatorDirective_Factory(__ngFactoryType__) {
	return new (__ngFactoryType__ || _AbstractValidatorDirective)();
});
_defineProperty(AbstractValidatorDirective, "ɵdir", /*@__PURE__*/ ɵɵdefineDirective({
	type: _AbstractValidatorDirective,
	features: [ɵɵNgOnChangesFeature]
}));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(AbstractValidatorDirective, [{ type: Directive }], null, null);
})();
var MAX_VALIDATOR = {
	provide: NG_VALIDATORS,
	useExisting: forwardRef(() => MaxValidator),
	multi: true
};
var MaxValidator = class extends AbstractValidatorDirective {
	constructor(..._args2) {
		super(..._args2);
		_defineProperty(this, "max", void 0);
		_defineProperty(this, "inputName", "max");
		_defineProperty(this, "normalizeInput", (input) => toFloat(input));
		_defineProperty(this, "createValidator", (max) => maxValidator(max));
	}
};
_MaxValidator = MaxValidator;
_defineProperty(MaxValidator, "ɵfac", /*@__PURE__*/ (() => {
	let ɵMaxValidator_BaseFactory = void 0;
	return function MaxValidator_Factory(__ngFactoryType__) {
		return (ɵMaxValidator_BaseFactory || (ɵMaxValidator_BaseFactory = ɵɵgetInheritedFactory(_MaxValidator)))(__ngFactoryType__ || _MaxValidator);
	};
})());
_defineProperty(MaxValidator, "ɵdir", /*@__PURE__*/ ɵɵdefineDirective({
	type: _MaxValidator,
	selectors: [
		[
			"input",
			"type",
			"number",
			"max",
			"",
			"formControlName",
			""
		],
		[
			"input",
			"type",
			"number",
			"max",
			"",
			"formControl",
			""
		],
		[
			"input",
			"type",
			"number",
			"max",
			"",
			"ngModel",
			""
		]
	],
	hostVars: 1,
	hostBindings: function MaxValidator_HostBindings(rf, ctx) {
		if (rf & 2) ɵɵattribute("max", ctx._enabled ? ctx.max : null);
	},
	inputs: { max: "max" },
	standalone: false,
	features: [ɵɵProvidersFeature([MAX_VALIDATOR]), ɵɵInheritDefinitionFeature]
}));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(MaxValidator, [{
		type: Directive,
		args: [{
			selector: "input[type=number][max][formControlName],input[type=number][max][formControl],input[type=number][max][ngModel]",
			providers: [MAX_VALIDATOR],
			host: { "[attr.max]": "_enabled ? max : null" },
			standalone: false
		}]
	}], null, { max: [{ type: Input }] });
})();
var MIN_VALIDATOR = {
	provide: NG_VALIDATORS,
	useExisting: forwardRef(() => MinValidator),
	multi: true
};
var MinValidator = class extends AbstractValidatorDirective {
	constructor(..._args3) {
		super(..._args3);
		_defineProperty(this, "min", void 0);
		_defineProperty(this, "inputName", "min");
		_defineProperty(this, "normalizeInput", (input) => toFloat(input));
		_defineProperty(this, "createValidator", (min) => minValidator(min));
	}
};
_MinValidator = MinValidator;
_defineProperty(MinValidator, "ɵfac", /*@__PURE__*/ (() => {
	let ɵMinValidator_BaseFactory = void 0;
	return function MinValidator_Factory(__ngFactoryType__) {
		return (ɵMinValidator_BaseFactory || (ɵMinValidator_BaseFactory = ɵɵgetInheritedFactory(_MinValidator)))(__ngFactoryType__ || _MinValidator);
	};
})());
_defineProperty(MinValidator, "ɵdir", /*@__PURE__*/ ɵɵdefineDirective({
	type: _MinValidator,
	selectors: [
		[
			"input",
			"type",
			"number",
			"min",
			"",
			"formControlName",
			""
		],
		[
			"input",
			"type",
			"number",
			"min",
			"",
			"formControl",
			""
		],
		[
			"input",
			"type",
			"number",
			"min",
			"",
			"ngModel",
			""
		]
	],
	hostVars: 1,
	hostBindings: function MinValidator_HostBindings(rf, ctx) {
		if (rf & 2) ɵɵattribute("min", ctx._enabled ? ctx.min : null);
	},
	inputs: { min: "min" },
	standalone: false,
	features: [ɵɵProvidersFeature([MIN_VALIDATOR]), ɵɵInheritDefinitionFeature]
}));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(MinValidator, [{
		type: Directive,
		args: [{
			selector: "input[type=number][min][formControlName],input[type=number][min][formControl],input[type=number][min][ngModel]",
			providers: [MIN_VALIDATOR],
			host: { "[attr.min]": "_enabled ? min : null" },
			standalone: false
		}]
	}], null, { min: [{ type: Input }] });
})();
var REQUIRED_VALIDATOR = {
	provide: NG_VALIDATORS,
	useExisting: forwardRef(() => RequiredValidator),
	multi: true
};
var CHECKBOX_REQUIRED_VALIDATOR = {
	provide: NG_VALIDATORS,
	useExisting: forwardRef(() => CheckboxRequiredValidator),
	multi: true
};
var RequiredValidator = class extends AbstractValidatorDirective {
	constructor(..._args4) {
		super(..._args4);
		_defineProperty(this, "required", void 0);
		_defineProperty(this, "inputName", "required");
		_defineProperty(this, "normalizeInput", booleanAttribute);
		_defineProperty(this, "createValidator", (input) => requiredValidator);
	}
	enabled(input) {
		return input;
	}
};
_RequiredValidator = RequiredValidator;
_defineProperty(RequiredValidator, "ɵfac", /*@__PURE__*/ (() => {
	let ɵRequiredValidator_BaseFactory = void 0;
	return function RequiredValidator_Factory(__ngFactoryType__) {
		return (ɵRequiredValidator_BaseFactory || (ɵRequiredValidator_BaseFactory = ɵɵgetInheritedFactory(_RequiredValidator)))(__ngFactoryType__ || _RequiredValidator);
	};
})());
_defineProperty(RequiredValidator, "ɵdir", /*@__PURE__*/ ɵɵdefineDirective({
	type: _RequiredValidator,
	selectors: [
		[
			"",
			"required",
			"",
			"formControlName",
			"",
			3,
			"type",
			"checkbox"
		],
		[
			"",
			"required",
			"",
			"formControl",
			"",
			3,
			"type",
			"checkbox"
		],
		[
			"",
			"required",
			"",
			"ngModel",
			"",
			3,
			"type",
			"checkbox"
		]
	],
	hostVars: 1,
	hostBindings: function RequiredValidator_HostBindings(rf, ctx) {
		if (rf & 2) ɵɵattribute("required", ctx._enabled ? "" : null);
	},
	inputs: { required: "required" },
	standalone: false,
	features: [ɵɵProvidersFeature([REQUIRED_VALIDATOR]), ɵɵInheritDefinitionFeature]
}));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(RequiredValidator, [{
		type: Directive,
		args: [{
			selector: ":not([type=checkbox])[required][formControlName],:not([type=checkbox])[required][formControl],:not([type=checkbox])[required][ngModel]",
			providers: [REQUIRED_VALIDATOR],
			host: { "[attr.required]": "_enabled ? \"\" : null" },
			standalone: false
		}]
	}], null, { required: [{ type: Input }] });
})();
var CheckboxRequiredValidator = class extends RequiredValidator {
	constructor(..._args5) {
		super(..._args5);
		_defineProperty(this, "createValidator", (input) => requiredTrueValidator);
	}
};
_CheckboxRequiredValidator = CheckboxRequiredValidator;
_defineProperty(CheckboxRequiredValidator, "ɵfac", /*@__PURE__*/ (() => {
	let ɵCheckboxRequiredValidator_BaseFactory = void 0;
	return function CheckboxRequiredValidator_Factory(__ngFactoryType__) {
		return (ɵCheckboxRequiredValidator_BaseFactory || (ɵCheckboxRequiredValidator_BaseFactory = ɵɵgetInheritedFactory(_CheckboxRequiredValidator)))(__ngFactoryType__ || _CheckboxRequiredValidator);
	};
})());
_defineProperty(CheckboxRequiredValidator, "ɵdir", /*@__PURE__*/ ɵɵdefineDirective({
	type: _CheckboxRequiredValidator,
	selectors: [
		[
			"input",
			"type",
			"checkbox",
			"required",
			"",
			"formControlName",
			""
		],
		[
			"input",
			"type",
			"checkbox",
			"required",
			"",
			"formControl",
			""
		],
		[
			"input",
			"type",
			"checkbox",
			"required",
			"",
			"ngModel",
			""
		]
	],
	hostVars: 1,
	hostBindings: function CheckboxRequiredValidator_HostBindings(rf, ctx) {
		if (rf & 2) ɵɵattribute("required", ctx._enabled ? "" : null);
	},
	standalone: false,
	features: [ɵɵProvidersFeature([CHECKBOX_REQUIRED_VALIDATOR]), ɵɵInheritDefinitionFeature]
}));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(CheckboxRequiredValidator, [{
		type: Directive,
		args: [{
			selector: "input[type=checkbox][required][formControlName],input[type=checkbox][required][formControl],input[type=checkbox][required][ngModel]",
			providers: [CHECKBOX_REQUIRED_VALIDATOR],
			host: { "[attr.required]": "_enabled ? \"\" : null" },
			standalone: false
		}]
	}], null, null);
})();
var EMAIL_VALIDATOR = {
	provide: NG_VALIDATORS,
	useExisting: forwardRef(() => EmailValidator),
	multi: true
};
var EmailValidator = class extends AbstractValidatorDirective {
	constructor(..._args6) {
		super(..._args6);
		_defineProperty(this, "email", void 0);
		_defineProperty(this, "inputName", "email");
		_defineProperty(this, "normalizeInput", booleanAttribute);
		_defineProperty(this, "createValidator", (input) => emailValidator);
	}
	enabled(input) {
		return input;
	}
};
_EmailValidator = EmailValidator;
_defineProperty(EmailValidator, "ɵfac", /*@__PURE__*/ (() => {
	let ɵEmailValidator_BaseFactory = void 0;
	return function EmailValidator_Factory(__ngFactoryType__) {
		return (ɵEmailValidator_BaseFactory || (ɵEmailValidator_BaseFactory = ɵɵgetInheritedFactory(_EmailValidator)))(__ngFactoryType__ || _EmailValidator);
	};
})());
_defineProperty(EmailValidator, "ɵdir", /*@__PURE__*/ ɵɵdefineDirective({
	type: _EmailValidator,
	selectors: [
		[
			"",
			"email",
			"",
			"formControlName",
			""
		],
		[
			"",
			"email",
			"",
			"formControl",
			""
		],
		[
			"",
			"email",
			"",
			"ngModel",
			""
		]
	],
	inputs: { email: "email" },
	standalone: false,
	features: [ɵɵProvidersFeature([EMAIL_VALIDATOR]), ɵɵInheritDefinitionFeature]
}));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(EmailValidator, [{
		type: Directive,
		args: [{
			selector: "[email][formControlName],[email][formControl],[email][ngModel]",
			providers: [EMAIL_VALIDATOR],
			standalone: false
		}]
	}], null, { email: [{ type: Input }] });
})();
var MIN_LENGTH_VALIDATOR = {
	provide: NG_VALIDATORS,
	useExisting: forwardRef(() => MinLengthValidator),
	multi: true
};
var MinLengthValidator = class extends AbstractValidatorDirective {
	constructor(..._args7) {
		super(..._args7);
		_defineProperty(this, "minlength", void 0);
		_defineProperty(this, "inputName", "minlength");
		_defineProperty(this, "normalizeInput", (input) => toInteger(input));
		_defineProperty(this, "createValidator", (minlength) => minLengthValidator(minlength));
	}
};
_MinLengthValidator = MinLengthValidator;
_defineProperty(MinLengthValidator, "ɵfac", /*@__PURE__*/ (() => {
	let ɵMinLengthValidator_BaseFactory = void 0;
	return function MinLengthValidator_Factory(__ngFactoryType__) {
		return (ɵMinLengthValidator_BaseFactory || (ɵMinLengthValidator_BaseFactory = ɵɵgetInheritedFactory(_MinLengthValidator)))(__ngFactoryType__ || _MinLengthValidator);
	};
})());
_defineProperty(MinLengthValidator, "ɵdir", /*@__PURE__*/ ɵɵdefineDirective({
	type: _MinLengthValidator,
	selectors: [
		[
			"",
			"minlength",
			"",
			"formControlName",
			""
		],
		[
			"",
			"minlength",
			"",
			"formControl",
			""
		],
		[
			"",
			"minlength",
			"",
			"ngModel",
			""
		]
	],
	hostVars: 1,
	hostBindings: function MinLengthValidator_HostBindings(rf, ctx) {
		if (rf & 2) ɵɵattribute("minlength", ctx._enabled ? ctx.minlength : null);
	},
	inputs: { minlength: "minlength" },
	standalone: false,
	features: [ɵɵProvidersFeature([MIN_LENGTH_VALIDATOR]), ɵɵInheritDefinitionFeature]
}));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(MinLengthValidator, [{
		type: Directive,
		args: [{
			selector: "[minlength][formControlName],[minlength][formControl],[minlength][ngModel]",
			providers: [MIN_LENGTH_VALIDATOR],
			host: { "[attr.minlength]": "_enabled ? minlength : null" },
			standalone: false
		}]
	}], null, { minlength: [{ type: Input }] });
})();
var MAX_LENGTH_VALIDATOR = {
	provide: NG_VALIDATORS,
	useExisting: forwardRef(() => MaxLengthValidator),
	multi: true
};
var MaxLengthValidator = class extends AbstractValidatorDirective {
	constructor(..._args8) {
		super(..._args8);
		_defineProperty(this, "maxlength", void 0);
		_defineProperty(this, "inputName", "maxlength");
		_defineProperty(this, "normalizeInput", (input) => toInteger(input));
		_defineProperty(this, "createValidator", (maxlength) => maxLengthValidator(maxlength));
	}
};
_MaxLengthValidator = MaxLengthValidator;
_defineProperty(MaxLengthValidator, "ɵfac", /*@__PURE__*/ (() => {
	let ɵMaxLengthValidator_BaseFactory = void 0;
	return function MaxLengthValidator_Factory(__ngFactoryType__) {
		return (ɵMaxLengthValidator_BaseFactory || (ɵMaxLengthValidator_BaseFactory = ɵɵgetInheritedFactory(_MaxLengthValidator)))(__ngFactoryType__ || _MaxLengthValidator);
	};
})());
_defineProperty(MaxLengthValidator, "ɵdir", /*@__PURE__*/ ɵɵdefineDirective({
	type: _MaxLengthValidator,
	selectors: [
		[
			"",
			"maxlength",
			"",
			"formControlName",
			""
		],
		[
			"",
			"maxlength",
			"",
			"formControl",
			""
		],
		[
			"",
			"maxlength",
			"",
			"ngModel",
			""
		]
	],
	hostVars: 1,
	hostBindings: function MaxLengthValidator_HostBindings(rf, ctx) {
		if (rf & 2) ɵɵattribute("maxlength", ctx._enabled ? ctx.maxlength : null);
	},
	inputs: { maxlength: "maxlength" },
	standalone: false,
	features: [ɵɵProvidersFeature([MAX_LENGTH_VALIDATOR]), ɵɵInheritDefinitionFeature]
}));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(MaxLengthValidator, [{
		type: Directive,
		args: [{
			selector: "[maxlength][formControlName],[maxlength][formControl],[maxlength][ngModel]",
			providers: [MAX_LENGTH_VALIDATOR],
			host: { "[attr.maxlength]": "_enabled ? maxlength : null" },
			standalone: false
		}]
	}], null, { maxlength: [{ type: Input }] });
})();
var PATTERN_VALIDATOR = {
	provide: NG_VALIDATORS,
	useExisting: forwardRef(() => PatternValidator),
	multi: true
};
var PatternValidator = class extends AbstractValidatorDirective {
	constructor(..._args9) {
		super(..._args9);
		_defineProperty(this, "pattern", void 0);
		_defineProperty(this, "inputName", "pattern");
		_defineProperty(this, "normalizeInput", (input) => input);
		_defineProperty(this, "createValidator", (input) => patternValidator(input));
	}
};
_PatternValidator = PatternValidator;
_defineProperty(PatternValidator, "ɵfac", /*@__PURE__*/ (() => {
	let ɵPatternValidator_BaseFactory = void 0;
	return function PatternValidator_Factory(__ngFactoryType__) {
		return (ɵPatternValidator_BaseFactory || (ɵPatternValidator_BaseFactory = ɵɵgetInheritedFactory(_PatternValidator)))(__ngFactoryType__ || _PatternValidator);
	};
})());
_defineProperty(PatternValidator, "ɵdir", /*@__PURE__*/ ɵɵdefineDirective({
	type: _PatternValidator,
	selectors: [
		[
			"",
			"pattern",
			"",
			"formControlName",
			""
		],
		[
			"",
			"pattern",
			"",
			"formControl",
			""
		],
		[
			"",
			"pattern",
			"",
			"ngModel",
			""
		]
	],
	hostVars: 1,
	hostBindings: function PatternValidator_HostBindings(rf, ctx) {
		if (rf & 2) ɵɵattribute("pattern", ctx._enabled ? ctx.pattern : null);
	},
	inputs: { pattern: "pattern" },
	standalone: false,
	features: [ɵɵProvidersFeature([PATTERN_VALIDATOR]), ɵɵInheritDefinitionFeature]
}));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(PatternValidator, [{
		type: Directive,
		args: [{
			selector: "[pattern][formControlName],[pattern][formControl],[pattern][ngModel]",
			providers: [PATTERN_VALIDATOR],
			host: { "[attr.pattern]": "_enabled ? pattern : null" },
			standalone: false
		}]
	}], null, { pattern: [{ type: Input }] });
})();
var ɵFORM_CONTROL_INTEGRATION = new InjectionToken(typeof ngDevMode !== "undefined" && ngDevMode ? "FORM_CONTROL_INTEGRATION" : "");
var CALL_SET_DISABLED_STATE = new InjectionToken(typeof ngDevMode === "undefined" || ngDevMode ? "CallSetDisabledState" : "", { factory: () => setDisabledStateDefault });
var setDisabledStateDefault = "always";
function controlPath(name, parent) {
	return [...parent.path, name];
}
function setUpControlValueAccessor(control, dir, callSetDisabledState = setDisabledStateDefault) {
	if (typeof ngDevMode === "undefined" || ngDevMode) {
		if (!control) _throwError(dir, "Cannot find control with");
		if (!dir.valueAccessor) _throwMissingValueAccessorError(dir);
	}
	setUpValidators(control, dir);
	dir.valueAccessor.writeValue(control.value);
	if (control.disabled || callSetDisabledState === "always") {
		var _dir$valueAccessor$se, _dir$valueAccessor;
		(_dir$valueAccessor$se = (_dir$valueAccessor = dir.valueAccessor).setDisabledState) === null || _dir$valueAccessor$se === void 0 || _dir$valueAccessor$se.call(_dir$valueAccessor, control.disabled);
	}
	setUpViewChangePipeline(control, dir);
	setUpModelChangePipeline(control, dir);
	setUpBlurPipeline(control, dir);
	setUpDisabledChangeHandler(control, dir);
}
function cleanUpControl(control, dir, validateControlPresenceOnChange = true) {
	var _dir$valueAccessor2, _dir$valueAccessor3;
	const noop = () => {
		if (validateControlPresenceOnChange && (typeof ngDevMode === "undefined" || ngDevMode)) _noControlError(dir);
	};
	dir === null || dir === void 0 || (_dir$valueAccessor2 = dir.valueAccessor) === null || _dir$valueAccessor2 === void 0 || _dir$valueAccessor2.registerOnChange(noop);
	dir === null || dir === void 0 || (_dir$valueAccessor3 = dir.valueAccessor) === null || _dir$valueAccessor3 === void 0 || _dir$valueAccessor3.registerOnTouched(noop);
	cleanUpValidators(control, dir);
	if (control) {
		dir._invokeOnDestroyCallbacks();
		control._registerOnCollectionChange(() => {});
	}
}
function registerOnValidatorChange(validators, onChange) {
	validators.forEach((validator) => {
		if (validator.registerOnValidatorChange) validator.registerOnValidatorChange(onChange);
	});
}
function setUpDisabledChangeHandler(control, dir) {
	if (dir.valueAccessor.setDisabledState) {
		const onDisabledChange = (isDisabled) => {
			dir.valueAccessor.setDisabledState(isDisabled);
		};
		control.registerOnDisabledChange(onDisabledChange);
		dir._registerOnDestroy(() => {
			control._unregisterOnDisabledChange(onDisabledChange);
		});
	}
}
function setUpValidators(control, dir) {
	const validators = getControlValidators(control);
	if (dir.validator !== null) control.setValidators(mergeValidators(validators, dir.validator));
	else if (typeof validators === "function") control.setValidators([validators]);
	const asyncValidators = getControlAsyncValidators(control);
	if (dir.asyncValidator !== null) control.setAsyncValidators(mergeValidators(asyncValidators, dir.asyncValidator));
	else if (typeof asyncValidators === "function") control.setAsyncValidators([asyncValidators]);
	const onValidatorChange = () => control.updateValueAndValidity();
	registerOnValidatorChange(dir._rawValidators, onValidatorChange);
	registerOnValidatorChange(dir._rawAsyncValidators, onValidatorChange);
}
function cleanUpValidators(control, dir) {
	let isControlUpdated = false;
	if (control !== null) {
		if (dir.validator !== null) {
			const validators = getControlValidators(control);
			if (Array.isArray(validators) && validators.length > 0) {
				const updatedValidators = validators.filter((validator) => validator !== dir.validator);
				if (updatedValidators.length !== validators.length) {
					isControlUpdated = true;
					control.setValidators(updatedValidators);
				}
			}
		}
		if (dir.asyncValidator !== null) {
			const asyncValidators = getControlAsyncValidators(control);
			if (Array.isArray(asyncValidators) && asyncValidators.length > 0) {
				const updatedAsyncValidators = asyncValidators.filter((asyncValidator) => asyncValidator !== dir.asyncValidator);
				if (updatedAsyncValidators.length !== asyncValidators.length) {
					isControlUpdated = true;
					control.setAsyncValidators(updatedAsyncValidators);
				}
			}
		}
	}
	const noop = () => {};
	registerOnValidatorChange(dir._rawValidators, noop);
	registerOnValidatorChange(dir._rawAsyncValidators, noop);
	return isControlUpdated;
}
function setUpViewChangePipeline(control, dir) {
	dir.valueAccessor.registerOnChange((newValue) => {
		control._pendingValue = newValue;
		control._pendingChange = true;
		control._pendingDirty = true;
		if (control.updateOn === "change") updateControl(control, dir);
	});
}
function setUpBlurPipeline(control, dir) {
	dir.valueAccessor.registerOnTouched(() => {
		control._pendingTouched = true;
		if (control.updateOn === "blur" && control._pendingChange) updateControl(control, dir);
		if (control.updateOn !== "submit") control.markAsTouched();
	});
}
function updateControl(control, dir) {
	if (control._pendingDirty) control.markAsDirty();
	control.setValue(control._pendingValue, { emitModelToViewChange: false });
	dir.viewToModelUpdate(control._pendingValue);
	control._pendingChange = false;
}
function setUpModelChangePipeline(control, dir) {
	const onChange = (newValue, emitModelEvent) => {
		dir.valueAccessor.writeValue(newValue);
		if (emitModelEvent) dir.viewToModelUpdate(newValue);
	};
	control.registerOnChange(onChange);
	dir._registerOnDestroy(() => {
		control._unregisterOnChange(onChange);
	});
}
function setUpFormContainer(control, dir) {
	if (control == null && (typeof ngDevMode === "undefined" || ngDevMode)) _throwError(dir, "Cannot find control with");
	setUpValidators(control, dir);
}
function cleanUpFormContainer(control, dir) {
	return cleanUpValidators(control, dir);
}
function _noControlError(dir) {
	return _throwError(dir, "There is no FormControl instance attached to form control element with");
}
function _throwError(dir, message) {
	const messageEnd = _describeControlLocation(dir);
	throw new Error(`${message} ${messageEnd}`);
}
function _describeControlLocation(dir) {
	const path = dir.path;
	if (path && path.length > 1) return `path: '${path.join(" -> ")}'`;
	if (path === null || path === void 0 ? void 0 : path[0]) return `name: '${path}'`;
	return "unspecified name attribute";
}
function _throwMissingValueAccessorError(dir) {
	const loc = _describeControlLocation(dir);
	throw new RuntimeError(-1203, `No value accessor for form control ${loc}.`);
}
function _throwInvalidValueAccessorError(dir) {
	const loc = _describeControlLocation(dir);
	throw new RuntimeError(1200, `Value accessor was not provided as an array for form control with ${loc}. Check that the \`NG_VALUE_ACCESSOR\` token is configured as a \`multi: true\` provider.`);
}
function isPropertyUpdated(changes, viewModel) {
	if (!Object.hasOwn(changes, "model")) return false;
	const change = changes["model"];
	if (change.isFirstChange()) return true;
	return !Object.is(viewModel, change.currentValue);
}
function isBuiltInAccessor(valueAccessor) {
	return Object.getPrototypeOf(valueAccessor.constructor) === BuiltInControlValueAccessor;
}
function syncPendingControls(form, directives) {
	form._syncPendingControls();
	directives.forEach((dir) => {
		const control = dir.control;
		if (control.updateOn === "submit" && control._pendingChange) {
			dir.viewToModelUpdate(control._pendingValue);
			control._pendingChange = false;
		}
	});
}
function selectValueAccessor(dir, valueAccessors) {
	if (!valueAccessors) return null;
	if (!Array.isArray(valueAccessors) && (typeof ngDevMode === "undefined" || ngDevMode)) _throwInvalidValueAccessorError(dir);
	let defaultAccessor = void 0;
	let builtinAccessor = void 0;
	let customAccessor = void 0;
	valueAccessors.forEach((v) => {
		if (v.constructor === DefaultValueAccessor) defaultAccessor = v;
		else if (isBuiltInAccessor(v)) {
			if (builtinAccessor && (typeof ngDevMode === "undefined" || ngDevMode)) _throwError(dir, "More than one built-in value accessor matches form control with");
			builtinAccessor = v;
		} else {
			if (customAccessor && (typeof ngDevMode === "undefined" || ngDevMode)) _throwError(dir, "More than one custom value accessor matches form control with");
			customAccessor = v;
		}
	});
	if (customAccessor) return customAccessor;
	if (builtinAccessor) return builtinAccessor;
	if (defaultAccessor) return defaultAccessor;
	if (typeof ngDevMode === "undefined" || ngDevMode) _throwError(dir, "No valid value accessor for form control with");
	return null;
}
function removeListItem$1(list, el) {
	const index = list.indexOf(el);
	if (index > -1) list.splice(index, 1);
}
function _ngModelWarning(name, type, instance, warningConfig) {
	if (warningConfig === "never") return;
	if ((warningConfig === null || warningConfig === "once") && !type._ngModelWarningSentOnce || warningConfig === "always" && !instance._ngModelWarningSent) {
		console.warn(ngModelWarning(name));
		type._ngModelWarningSentOnce = true;
		instance._ngModelWarningSent = true;
	}
}
var NG_CONTROL_INTEGRATION_PROVIDER = {
	provide: ɵFORM_CONTROL_INTEGRATION,
	useFactory: () => {
		const control = inject(NgControl, { self: true });
		return {
			setParseErrors: (source) => {
				control.setParseErrorSource(source);
			},
			set onReset(callback) {
				control.onReset = callback;
			}
		};
	}
};
var NgControl = class extends AbstractControlDirective {
	set onReset(callback) {
		var _this$resetSubscripti;
		this.userOnReset = callback;
		(_this$resetSubscripti = this.resetSubscription) === null || _this$resetSubscripti === void 0 || _this$resetSubscripti.unsubscribe();
		this.resetSubscription = void 0;
		if (this.control) {
			var _this$subscription;
			this.resetSubscription = this.control.events.subscribe((event) => {
				if (event instanceof FormResetEvent && this.control) {
					var _this$userOnReset;
					(_this$userOnReset = this.userOnReset) === null || _this$userOnReset === void 0 || _this$userOnReset.call(this, this.control.value);
				}
			});
			(_this$subscription = this.subscription) === null || _this$subscription === void 0 || _this$subscription.add(this.resetSubscription);
		}
	}
	get selectedValueAccessor() {
		var _this$_selectedValueA;
		return (_this$_selectedValueA = this._selectedValueAccessor) !== null && _this$_selectedValueA !== void 0 ? _this$_selectedValueA : this._selectedValueAccessor = selectValueAccessor(this, this.rawValueAccessors);
	}
	constructor(injector, renderer, rawValueAccessors) {
		var _this$injector;
		super();
		_defineProperty(this, "_parent", null);
		_defineProperty(this, "name", null);
		_defineProperty(this, "valueAccessor", null);
		_defineProperty(this, "isCustomControlBased", false);
		_defineProperty(this, "userOnReset", void 0);
		_defineProperty(this, "resetSubscription", void 0);
		_defineProperty(this, "isNativeFormElement", false);
		_defineProperty(this, "rawValueAccessors", void 0);
		_defineProperty(this, "_selectedValueAccessor", null);
		_defineProperty(this, "parseErrorsValidator", null);
		_defineProperty(this, "renderer", void 0);
		_defineProperty(this, "injector", void 0);
		_defineProperty(this, "requiredValidatorViaDi", void 0);
		_defineProperty(this, "subscription", void 0);
		_defineProperty(this, "customControlBindings", null);
		this.injector = injector;
		this.renderer = renderer;
		this.rawValueAccessors = rawValueAccessors;
		(_this$injector = this.injector) === null || _this$injector === void 0 || (_this$injector = _this$injector.get(DestroyRef)) === null || _this$injector === void 0 || _this$injector.onDestroy(() => {
			var _this$subscription2;
			this.removeParseErrorsValidator(this.control);
			(_this$subscription2 = this.subscription) === null || _this$subscription2 === void 0 || _this$subscription2.unsubscribe();
		});
	}
	setupCustomControl() {
		var _this$subscription3, _this$injector2, _this$resetSubscripti2;
		(_this$subscription3 = this.subscription) === null || _this$subscription3 === void 0 || _this$subscription3.unsubscribe();
		const cdr = (_this$injector2 = this.injector) === null || _this$injector2 === void 0 ? void 0 : _this$injector2.get(ChangeDetectorRef);
		if (!this.control || !cdr) return;
		const markForCheck = cdr.markForCheck.bind(cdr);
		this.subscription = new Subscription();
		this.subscription.add(this.control.valueChanges.subscribe(markForCheck));
		this.subscription.add(this.control.statusChanges.subscribe(markForCheck));
		(_this$resetSubscripti2 = this.resetSubscription) === null || _this$resetSubscripti2 === void 0 || _this$resetSubscripti2.unsubscribe();
		this.resetSubscription = void 0;
		if (this.userOnReset) {
			this.resetSubscription = this.control.events.subscribe((event) => {
				if (event instanceof FormResetEvent && this.control) {
					var _this$userOnReset2;
					(_this$userOnReset2 = this.userOnReset) === null || _this$userOnReset2 === void 0 || _this$userOnReset2.call(this, this.control.value);
				}
			});
			this.subscription.add(this.resetSubscription);
		}
		if (this.parseErrorsValidator) this.control.addValidators(this.parseErrorsValidator);
	}
	ngControlCreate(host) {
		var _host$nativeElement$h, _host$nativeElement;
		if (!((_host$nativeElement$h = (_host$nativeElement = host.nativeElement).hasAttribute) === null || _host$nativeElement$h === void 0 ? void 0 : _host$nativeElement$h.call(_host$nativeElement, "ngNoCva")) && (this.rawValueAccessors && this.rawValueAccessors.length > 0 || this.valueAccessor !== null) || !host.customControl) return;
		this.isCustomControlBased = true;
		host.listenToCustomControlModel((value) => {
			var _this$control2, _this$control3;
			(_this$control2 = this.control) === null || _this$control2 === void 0 || _this$control2.markAsDirty();
			(_this$control3 = this.control) === null || _this$control3 === void 0 || _this$control3.setValue(value, { emitModelToViewChange: false });
			this.viewToModelUpdate(value);
		});
		host.listenToCustomControlOutput("touch", () => {
			var _this$control4;
			(_this$control4 = this.control) === null || _this$control4 === void 0 || _this$control4.markAsTouched();
		});
		this.customControlBindings = {};
		this.isNativeFormElement = isNativeFormElement(host.nativeElement);
		this.requiredValidatorViaDi = this._rawValidators.find((v) => v instanceof RequiredValidator);
	}
	ngControlUpdate(host, bindRequired) {
		if (!this.isCustomControlBased) return;
		const control = this.control;
		const bindings = this.customControlBindings;
		if (!Object.is(bindings.value, control.value)) {
			bindings.value = control.value;
			host.setCustomControlModelInput(control.value);
		}
		this.bindControlProperty(host, bindings, "touched", control.touched);
		this.bindControlProperty(host, bindings, "dirty", control.dirty);
		this.bindControlProperty(host, bindings, "valid", control.valid);
		this.bindControlProperty(host, bindings, "invalid", control.invalid);
		this.bindControlProperty(host, bindings, "pending", control.pending);
		this.bindControlProperty(host, bindings, "disabled", control.disabled);
		if (this.shouldBindRequired) this.bindControlProperty(host, bindings, "required", this.isRequired);
		const errorObject = control.errors;
		if (bindings.errors !== errorObject) {
			bindings.errors = errorObject;
			const errorArray = this._convertErrors(errorObject);
			host.setInputOnDirectives("errors", errorArray);
		}
	}
	get isRequired() {
		var _ref2, _this$requiredValidat, _this$control5;
		return (_ref2 = ((_this$requiredValidat = this.requiredValidatorViaDi) === null || _this$requiredValidat === void 0 ? void 0 : _this$requiredValidat._enabled) || ((_this$control5 = this.control) === null || _this$control5 === void 0 ? void 0 : _this$control5._hasRequired())) !== null && _ref2 !== void 0 ? _ref2 : false;
	}
	get shouldBindRequired() {
		return true;
	}
	bindControlProperty(host, bindings, name, value) {
		if (bindings[name] === value) return;
		bindings[name] = value;
		const wasSet = host.setInputOnDirectives(name, value);
		if (this.isNativeFormElement && !wasSet && (name === "disabled" || name === "required") && this.renderer) setNativeDomProperty(this.renderer, host.nativeElement, name, value);
	}
	_convertErrors(errors) {
		if (errors === null) return [];
		const control = this.control;
		return Object.entries(errors).map(([kind, context]) => {
			return new ReactiveValidationError({
				context,
				kind,
				control
			});
		});
	}
	setParseErrorSource(parseErrors) {
		if (parseErrors === void 0) return;
		let convertedErrors = null;
		const convertedParseErrors = computed(() => {
			const rawErrors = parseErrors();
			if (rawErrors.length === 0) return null;
			return rawErrors.reduce((acc, err) => {
				acc[err.kind] = err;
				return acc;
			}, {});
		}, ...ngDevMode ? [{ debugName: "convertedParseErrors" }] : []);
		this.parseErrorsValidator = (() => convertedErrors).bind(this);
		effect(() => {
			var _this$control6;
			convertedErrors = convertedParseErrors();
			(_this$control6 = this.control) === null || _this$control6 === void 0 || _this$control6.updateValueAndValidity({ emitEvent: false });
		}, { injector: this.injector });
	}
	removeParseErrorsValidator(control) {
		if (this.parseErrorsValidator) {
			control === null || control === void 0 || control.removeValidators(this.parseErrorsValidator);
			control === null || control === void 0 || control.updateValueAndValidity({ emitEvent: false });
		}
	}
};
var AbstractControlStatus = class {
	constructor(cd) {
		_defineProperty(this, "_cd", void 0);
		this._cd = cd;
	}
	get isTouched() {
		var _this$_cd, _this$_cd$_touched, _this$_cd2;
		(_this$_cd = this._cd) === null || _this$_cd === void 0 || (_this$_cd = _this$_cd.control) === null || _this$_cd === void 0 || (_this$_cd$_touched = _this$_cd._touched) === null || _this$_cd$_touched === void 0 || _this$_cd$_touched.call(_this$_cd);
		return !!((_this$_cd2 = this._cd) === null || _this$_cd2 === void 0 || (_this$_cd2 = _this$_cd2.control) === null || _this$_cd2 === void 0 ? void 0 : _this$_cd2.touched);
	}
	get isUntouched() {
		var _this$_cd3;
		return !!((_this$_cd3 = this._cd) === null || _this$_cd3 === void 0 || (_this$_cd3 = _this$_cd3.control) === null || _this$_cd3 === void 0 ? void 0 : _this$_cd3.untouched);
	}
	get isPristine() {
		var _this$_cd4, _this$_cd4$_pristine, _this$_cd5;
		(_this$_cd4 = this._cd) === null || _this$_cd4 === void 0 || (_this$_cd4 = _this$_cd4.control) === null || _this$_cd4 === void 0 || (_this$_cd4$_pristine = _this$_cd4._pristine) === null || _this$_cd4$_pristine === void 0 || _this$_cd4$_pristine.call(_this$_cd4);
		return !!((_this$_cd5 = this._cd) === null || _this$_cd5 === void 0 || (_this$_cd5 = _this$_cd5.control) === null || _this$_cd5 === void 0 ? void 0 : _this$_cd5.pristine);
	}
	get isDirty() {
		var _this$_cd6;
		return !!((_this$_cd6 = this._cd) === null || _this$_cd6 === void 0 || (_this$_cd6 = _this$_cd6.control) === null || _this$_cd6 === void 0 ? void 0 : _this$_cd6.dirty);
	}
	get isValid() {
		var _this$_cd7, _this$_cd7$_status, _this$_cd8;
		(_this$_cd7 = this._cd) === null || _this$_cd7 === void 0 || (_this$_cd7 = _this$_cd7.control) === null || _this$_cd7 === void 0 || (_this$_cd7$_status = _this$_cd7._status) === null || _this$_cd7$_status === void 0 || _this$_cd7$_status.call(_this$_cd7);
		return !!((_this$_cd8 = this._cd) === null || _this$_cd8 === void 0 || (_this$_cd8 = _this$_cd8.control) === null || _this$_cd8 === void 0 ? void 0 : _this$_cd8.valid);
	}
	get isInvalid() {
		var _this$_cd9;
		return !!((_this$_cd9 = this._cd) === null || _this$_cd9 === void 0 || (_this$_cd9 = _this$_cd9.control) === null || _this$_cd9 === void 0 ? void 0 : _this$_cd9.invalid);
	}
	get isPending() {
		var _this$_cd10;
		return !!((_this$_cd10 = this._cd) === null || _this$_cd10 === void 0 || (_this$_cd10 = _this$_cd10.control) === null || _this$_cd10 === void 0 ? void 0 : _this$_cd10.pending);
	}
	get isSubmitted() {
		var _this$_cd11, _this$_cd11$_submitte, _this$_cd12;
		(_this$_cd11 = this._cd) === null || _this$_cd11 === void 0 || (_this$_cd11$_submitte = _this$_cd11._submitted) === null || _this$_cd11$_submitte === void 0 || _this$_cd11$_submitte.call(_this$_cd11);
		return !!((_this$_cd12 = this._cd) === null || _this$_cd12 === void 0 ? void 0 : _this$_cd12.submitted);
	}
};
var ngControlStatusHost = {
	"[class.ng-untouched]": "isUntouched",
	"[class.ng-touched]": "isTouched",
	"[class.ng-pristine]": "isPristine",
	"[class.ng-dirty]": "isDirty",
	"[class.ng-valid]": "isValid",
	"[class.ng-invalid]": "isInvalid",
	"[class.ng-pending]": "isPending"
};
var NgControlStatus = class extends AbstractControlStatus {
	constructor(cd) {
		super(cd);
	}
};
_NgControlStatus = NgControlStatus;
_defineProperty(NgControlStatus, "ɵfac", function NgControlStatus_Factory(__ngFactoryType__) {
	return new (__ngFactoryType__ || _NgControlStatus)(ɵɵdirectiveInject(NgControl, 2));
});
_defineProperty(NgControlStatus, "ɵdir", /*@__PURE__*/ ɵɵdefineDirective({
	type: _NgControlStatus,
	selectors: [
		[
			"",
			"formControlName",
			""
		],
		[
			"",
			"ngModel",
			""
		],
		[
			"",
			"formControl",
			""
		]
	],
	hostVars: 14,
	hostBindings: function NgControlStatus_HostBindings(rf, ctx) {
		if (rf & 2) ɵɵclassProp("ng-untouched", ctx.isUntouched)("ng-touched", ctx.isTouched)("ng-pristine", ctx.isPristine)("ng-dirty", ctx.isDirty)("ng-valid", ctx.isValid)("ng-invalid", ctx.isInvalid)("ng-pending", ctx.isPending);
	},
	standalone: false,
	features: [ɵɵInheritDefinitionFeature]
}));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(NgControlStatus, [{
		type: Directive,
		args: [{
			selector: "[formControlName],[ngModel],[formControl]",
			host: ngControlStatusHost,
			standalone: false
		}]
	}], () => [{
		type: NgControl,
		decorators: [{ type: Self }]
	}], null);
})();
var NgControlStatusGroup = class extends AbstractControlStatus {
	constructor(cd) {
		super(cd);
	}
};
_NgControlStatusGroup = NgControlStatusGroup;
_defineProperty(NgControlStatusGroup, "ɵfac", function NgControlStatusGroup_Factory(__ngFactoryType__) {
	return new (__ngFactoryType__ || _NgControlStatusGroup)(ɵɵdirectiveInject(ControlContainer, 10));
});
_defineProperty(NgControlStatusGroup, "ɵdir", /*@__PURE__*/ ɵɵdefineDirective({
	type: _NgControlStatusGroup,
	selectors: [
		[
			"",
			"formGroupName",
			""
		],
		[
			"",
			"formArrayName",
			""
		],
		[
			"",
			"ngModelGroup",
			""
		],
		[
			"",
			"formGroup",
			""
		],
		[
			"",
			"formArray",
			""
		],
		[
			"form",
			3,
			"ngNoForm",
			""
		],
		[
			"",
			"ngForm",
			""
		]
	],
	hostVars: 16,
	hostBindings: function NgControlStatusGroup_HostBindings(rf, ctx) {
		if (rf & 2) ɵɵclassProp("ng-untouched", ctx.isUntouched)("ng-touched", ctx.isTouched)("ng-pristine", ctx.isPristine)("ng-dirty", ctx.isDirty)("ng-valid", ctx.isValid)("ng-invalid", ctx.isInvalid)("ng-pending", ctx.isPending)("ng-submitted", ctx.isSubmitted);
	},
	standalone: false,
	features: [ɵɵInheritDefinitionFeature]
}));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(NgControlStatusGroup, [{
		type: Directive,
		args: [{
			selector: "[formGroupName],[formArrayName],[ngModelGroup],[formGroup],[formArray],form:not([ngNoForm]),[ngForm]",
			host: _objectSpread2(_objectSpread2({}, ngControlStatusHost), {}, { "[class.ng-submitted]": "isSubmitted" }),
			standalone: false
		}]
	}], () => [{
		type: ControlContainer,
		decorators: [{ type: Optional }, { type: Self }]
	}], null);
})();
var FormGroup = class extends AbstractControl {
	constructor(controls, validatorOrOpts, asyncValidator) {
		super(pickValidators(validatorOrOpts), pickAsyncValidators(asyncValidator, validatorOrOpts));
		_defineProperty(this, "controls", void 0);
		(typeof ngDevMode === "undefined" || ngDevMode) && validateFormGroupControls(controls);
		this.controls = controls;
		this._initObservables();
		this._setUpdateStrategy(validatorOrOpts);
		this._setUpControls();
		this.updateValueAndValidity({
			onlySelf: true,
			emitEvent: !!this.asyncValidator
		});
	}
	registerControl(name, control) {
		const existingControl = this._find(name);
		if (existingControl) return existingControl;
		this.controls[name] = control;
		control.setParent(this);
		control._registerOnCollectionChange(this._onCollectionChange);
		return control;
	}
	addControl(name, control, options = {}) {
		this.registerControl(name, control);
		this.updateValueAndValidity({ emitEvent: options.emitEvent });
		this._onCollectionChange();
	}
	removeControl(name, options = {}) {
		const existingControl = this._find(name);
		if (existingControl) existingControl._registerOnCollectionChange(() => {});
		delete this.controls[name];
		this.updateValueAndValidity({ emitEvent: options.emitEvent });
		this._onCollectionChange();
	}
	setControl(name, control, options = {}) {
		const existingControl = this._find(name);
		if (existingControl) existingControl._registerOnCollectionChange(() => {});
		delete this.controls[name];
		if (control) this.registerControl(name, control);
		this.updateValueAndValidity({ emitEvent: options.emitEvent });
		this._onCollectionChange();
	}
	contains(controlName) {
		var _this$_find;
		return ((_this$_find = this._find(controlName)) === null || _this$_find === void 0 ? void 0 : _this$_find.enabled) === true;
	}
	setValue(value, options = {}) {
		untracked(() => {
			assertAllValuesPresent(this, true, value);
			Object.keys(value).forEach((name) => {
				assertControlPresent(this, true, name);
				this.controls[name].setValue(value[name], {
					onlySelf: true,
					emitEvent: options.emitEvent
				});
			});
			this.updateValueAndValidity(options);
		});
	}
	patchValue(value, options = {}) {
		if (value == null) return;
		Object.keys(value).forEach((name) => {
			const existingControl = this._find(name);
			if (existingControl) existingControl.patchValue(value[name], {
				onlySelf: true,
				emitEvent: options.emitEvent
			});
		});
		this.updateValueAndValidity(options);
	}
	reset(value = {}, options = {}) {
		this._forEachChild((control, name) => {
			control.reset(value ? value[name] : null, _objectSpread2(_objectSpread2({}, options), {}, { onlySelf: true }));
		});
		this._updatePristine(options, this);
		this._updateTouched(options, this);
		this.updateValueAndValidity(options);
		if ((options === null || options === void 0 ? void 0 : options.emitEvent) !== false) this._events.next(new FormResetEvent(this));
	}
	getRawValue() {
		return this._reduceChildren({}, (acc, control, name) => {
			acc[name] = control.getRawValue();
			return acc;
		});
	}
	_syncPendingControls() {
		let subtreeUpdated = this._reduceChildren(false, (updated, child) => {
			return child._syncPendingControls() ? true : updated;
		});
		if (subtreeUpdated) this.updateValueAndValidity({ onlySelf: true });
		return subtreeUpdated;
	}
	_forEachChild(cb) {
		Object.keys(this.controls).forEach((key) => {
			const control = this.controls[key];
			control && cb(control, key);
		});
	}
	_setUpControls() {
		this._forEachChild((control) => {
			control.setParent(this);
			control._registerOnCollectionChange(this._onCollectionChange);
		});
	}
	_updateValue() {
		this.value = this._reduceValue();
	}
	_anyControls(condition) {
		for (const [controlName, control] of Object.entries(this.controls)) if (this.contains(controlName) && condition(control)) return true;
		return false;
	}
	_reduceValue() {
		return this._reduceChildren({}, (acc, control, name) => {
			if (control.enabled || this.disabled) acc[name] = control.value;
			return acc;
		});
	}
	_reduceChildren(initValue, fn) {
		let res = initValue;
		this._forEachChild((control, name) => {
			res = fn(res, control, name);
		});
		return res;
	}
	_allControlsDisabled() {
		for (const controlName of Object.keys(this.controls)) if (this.controls[controlName].enabled) return false;
		return Object.keys(this.controls).length > 0 || this.disabled;
	}
	_find(name) {
		return hasOwnControl(this.controls, name) ? this.controls[name] : null;
	}
};
function validateFormGroupControls(controls) {
	const invalidKeys = Object.keys(controls).filter((key) => key.includes("."));
	if (invalidKeys.length > 0) console.warn(`FormGroup keys cannot include \`.\`, please replace the keys for: ${invalidKeys.join(",")}.`);
}
var UntypedFormGroup = FormGroup;
var isFormGroup = (control) => control instanceof FormGroup;
var FormRecord = class extends FormGroup {};
var isFormRecord = (control) => control instanceof FormRecord;
var formDirectiveProvider$2 = {
	provide: ControlContainer,
	useExisting: forwardRef(() => NgForm)
};
var resolvedPromise$1 = (() => Promise.resolve())();
var NgForm = class extends ControlContainer {
	get submitted() {
		return untracked(this.submittedReactive);
	}
	constructor(validators, asyncValidators, callSetDisabledState) {
		super();
		_defineProperty(this, "callSetDisabledState", void 0);
		_defineProperty(this, "_submitted", computed(() => this.submittedReactive(), ...ngDevMode ? [{ debugName: "_submitted" }] : []));
		_defineProperty(this, "submittedReactive", signal(false, ...ngDevMode ? [{ debugName: "submittedReactive" }] : []));
		_defineProperty(this, "_directives", /* @__PURE__ */ new Set());
		_defineProperty(this, "form", void 0);
		_defineProperty(this, "ngSubmit", new EventEmitter());
		_defineProperty(this, "options", void 0);
		this.callSetDisabledState = callSetDisabledState;
		this.form = new FormGroup({}, composeValidators(validators), composeAsyncValidators(asyncValidators));
	}
	ngAfterViewInit() {
		this._setUpdateStrategy();
	}
	get formDirective() {
		return this;
	}
	get control() {
		return this.form;
	}
	get path() {
		return [];
	}
	get controls() {
		return this.form.controls;
	}
	addControl(dir) {
		resolvedPromise$1.then(() => {
			dir.control = this._findContainer(dir.path).registerControl(dir.name, dir.control);
			dir._setupWithForm(this.callSetDisabledState);
			dir.control.updateValueAndValidity({ emitEvent: false });
			this._directives.add(dir);
		});
	}
	getControl(dir) {
		return this.form.get(dir.path);
	}
	removeControl(dir) {
		resolvedPromise$1.then(() => {
			const container = this._findContainer(dir.path);
			container === null || container === void 0 || container.removeControl(dir.name);
			this._directives.delete(dir);
		});
	}
	addFormGroup(dir) {
		resolvedPromise$1.then(() => {
			const container = this._findContainer(dir.path);
			const group = new FormGroup({});
			setUpFormContainer(group, dir);
			container.registerControl(dir.name, group);
			group.updateValueAndValidity({ emitEvent: false });
		});
	}
	removeFormGroup(dir) {
		resolvedPromise$1.then(() => {
			var _container$removeCont;
			const container = this._findContainer(dir.path);
			container === null || container === void 0 || (_container$removeCont = container.removeControl) === null || _container$removeCont === void 0 || _container$removeCont.call(container, dir.name);
		});
	}
	getFormGroup(dir) {
		return this.form.get(dir.path);
	}
	updateModel(dir, value) {
		resolvedPromise$1.then(() => {
			this.form.get(dir.path).setValue(value);
		});
	}
	setValue(value) {
		this.control.setValue(value);
	}
	onSubmit($event) {
		var _$event$target;
		this.submittedReactive.set(true);
		syncPendingControls(this.form, this._directives);
		this.ngSubmit.emit($event);
		this.form._events.next(new FormSubmittedEvent(this.control));
		return ($event === null || $event === void 0 || (_$event$target = $event.target) === null || _$event$target === void 0 ? void 0 : _$event$target.method) === "dialog";
	}
	onReset() {
		this.resetForm();
	}
	resetForm(value = void 0) {
		this.form.reset(value);
		this.submittedReactive.set(false);
	}
	_setUpdateStrategy() {
		if (this.options && this.options.updateOn != null) this.form._updateOn = this.options.updateOn;
	}
	_findContainer(path) {
		path.pop();
		return path.length ? this.form.get(path) : this.form;
	}
};
_NgForm = NgForm;
_defineProperty(NgForm, "ɵfac", function NgForm_Factory(__ngFactoryType__) {
	return new (__ngFactoryType__ || _NgForm)(ɵɵdirectiveInject(NG_VALIDATORS, 10), ɵɵdirectiveInject(NG_ASYNC_VALIDATORS, 10), ɵɵdirectiveInject(CALL_SET_DISABLED_STATE, 8));
});
_defineProperty(NgForm, "ɵdir", /*@__PURE__*/ ɵɵdefineDirective({
	type: _NgForm,
	selectors: [
		[
			"form",
			3,
			"ngNoForm",
			"",
			3,
			"formGroup",
			"",
			3,
			"formArray",
			""
		],
		["ng-form"],
		[
			"",
			"ngForm",
			""
		]
	],
	hostBindings: function NgForm_HostBindings(rf, ctx) {
		if (rf & 1) ɵɵlistener("submit", function NgForm_submit_HostBindingHandler($event) {
			return ctx.onSubmit($event);
		})("reset", function NgForm_reset_HostBindingHandler() {
			return ctx.onReset();
		});
	},
	inputs: { options: [
		0,
		"ngFormOptions",
		"options"
	] },
	outputs: { ngSubmit: "ngSubmit" },
	exportAs: ["ngForm"],
	standalone: false,
	features: [ɵɵProvidersFeature([formDirectiveProvider$2]), ɵɵInheritDefinitionFeature]
}));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(NgForm, [{
		type: Directive,
		args: [{
			selector: "form:not([ngNoForm]):not([formGroup]):not([formArray]),ng-form,[ngForm]",
			providers: [formDirectiveProvider$2],
			host: {
				"(submit)": "onSubmit($event)",
				"(reset)": "onReset()"
			},
			outputs: ["ngSubmit"],
			exportAs: "ngForm",
			standalone: false
		}]
	}], () => [
		{
			type: void 0,
			decorators: [
				{ type: Optional },
				{ type: Self },
				{
					type: Inject,
					args: [NG_VALIDATORS]
				}
			]
		},
		{
			type: void 0,
			decorators: [
				{ type: Optional },
				{ type: Self },
				{
					type: Inject,
					args: [NG_ASYNC_VALIDATORS]
				}
			]
		},
		{
			type: void 0,
			decorators: [{ type: Optional }, {
				type: Inject,
				args: [CALL_SET_DISABLED_STATE]
			}]
		}
	], { options: [{
		type: Input,
		args: ["ngFormOptions"]
	}] });
})();
function removeListItem(list, el) {
	const index = list.indexOf(el);
	if (index > -1) list.splice(index, 1);
}
function isFormControlState(formState) {
	return typeof formState === "object" && formState !== null && Object.keys(formState).length === 2 && "value" in formState && "disabled" in formState;
}
var FormControl = class FormControl extends AbstractControl {
	constructor(formState = null, validatorOrOpts, asyncValidator) {
		super(pickValidators(validatorOrOpts), pickAsyncValidators(asyncValidator, validatorOrOpts));
		_defineProperty(this, "defaultValue", null);
		_defineProperty(this, "_onChange", []);
		_defineProperty(this, "_pendingValue", void 0);
		_defineProperty(this, "_pendingChange", false);
		this._applyFormState(formState);
		this._setUpdateStrategy(validatorOrOpts);
		this._initObservables();
		this.updateValueAndValidity({
			onlySelf: true,
			emitEvent: !!this.asyncValidator
		});
		if (isOptionsObj(validatorOrOpts) && (validatorOrOpts.nonNullable || validatorOrOpts.initialValueIsDefault)) {
			if (isFormControlState(formState)) this.defaultValue = formState.value;
			else this.defaultValue = formState;
		}
	}
	setValue(value, options = {}) {
		untracked(() => {
			this.value = this._pendingValue = value;
			if (this._onChange.length && options.emitModelToViewChange !== false) this._onChange.forEach((changeFn) => changeFn(this.value, options.emitViewToModelChange !== false));
			this.updateValueAndValidity(options);
		});
	}
	patchValue(value, options = {}) {
		this.setValue(value, options);
	}
	reset(formState = this.defaultValue, options = {}) {
		this._applyFormState(formState);
		this.markAsPristine(options);
		this.markAsUntouched(options);
		this.setValue(this.value, options);
		if (options.overwriteDefaultValue) this.defaultValue = this.value;
		this._pendingChange = false;
		if ((options === null || options === void 0 ? void 0 : options.emitEvent) !== false) this._events.next(new FormResetEvent(this));
	}
	_updateValue() {}
	_anyControls(condition) {
		return false;
	}
	_allControlsDisabled() {
		return this.disabled;
	}
	registerOnChange(fn) {
		this._onChange.push(fn);
	}
	_unregisterOnChange(fn) {
		removeListItem(this._onChange, fn);
	}
	registerOnDisabledChange(fn) {
		this._onDisabledChange.push(fn);
	}
	_unregisterOnDisabledChange(fn) {
		removeListItem(this._onDisabledChange, fn);
	}
	_forEachChild(cb) {}
	_syncPendingControls() {
		if (this.updateOn === "submit") {
			if (this._pendingDirty) this.markAsDirty();
			if (this._pendingTouched) this.markAsTouched();
			if (this._pendingChange) {
				this.setValue(this._pendingValue, {
					onlySelf: true,
					emitModelToViewChange: false
				});
				return true;
			}
		}
		return false;
	}
	_applyFormState(formState) {
		if (isFormControlState(formState)) {
			this.value = this._pendingValue = formState.value;
			formState.disabled ? this.disable({
				onlySelf: true,
				emitEvent: false
			}) : this.enable({
				onlySelf: true,
				emitEvent: false
			});
		} else this.value = this._pendingValue = formState;
	}
};
var UntypedFormControl = FormControl;
var isFormControl = (control) => control instanceof FormControl;
var AbstractFormGroupDirective = class extends ControlContainer {
	constructor(..._args10) {
		super(..._args10);
		_defineProperty(this, "_parent", void 0);
	}
	ngOnInit() {
		this._checkParentType();
		this.formDirective.addFormGroup(this);
	}
	ngOnDestroy() {
		var _this$formDirective;
		(_this$formDirective = this.formDirective) === null || _this$formDirective === void 0 || _this$formDirective.removeFormGroup(this);
	}
	get control() {
		return this.formDirective.getFormGroup(this);
	}
	get path() {
		return controlPath(this.name == null ? this.name : this.name.toString(), this._parent);
	}
	get formDirective() {
		return this._parent ? this._parent.formDirective : null;
	}
	_checkParentType() {}
};
_AbstractFormGroupDirective = AbstractFormGroupDirective;
_defineProperty(AbstractFormGroupDirective, "ɵfac", /*@__PURE__*/ (() => {
	let ɵAbstractFormGroupDirective_BaseFactory = void 0;
	return function AbstractFormGroupDirective_Factory(__ngFactoryType__) {
		return (ɵAbstractFormGroupDirective_BaseFactory || (ɵAbstractFormGroupDirective_BaseFactory = ɵɵgetInheritedFactory(_AbstractFormGroupDirective)))(__ngFactoryType__ || _AbstractFormGroupDirective);
	};
})());
_defineProperty(AbstractFormGroupDirective, "ɵdir", /*@__PURE__*/ ɵɵdefineDirective({
	type: _AbstractFormGroupDirective,
	standalone: false,
	features: [ɵɵInheritDefinitionFeature]
}));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(AbstractFormGroupDirective, [{
		type: Directive,
		args: [{ standalone: false }]
	}], null, null);
})();
function modelParentException() {
	return new RuntimeError(1350, `
    ngModel cannot be used to register form controls with a parent formGroup directive.  Try using
    formGroup's partner directive "formControlName" instead.  Example:

    ${formControlNameExample}

    Or, if you'd like to avoid registering this form control, indicate that it's standalone in ngModelOptions:

    Example:

    ${ngModelWithFormGroupExample}`);
}
function formGroupNameException() {
	return new RuntimeError(1351, `
    ngModel cannot be used to register form controls with a parent formGroupName or formArrayName directive.

    Option 1: Use formControlName instead of ngModel (reactive strategy):

    ${formGroupNameExample}

    Option 2:  Update ngModel's parent be ngModelGroup (template-driven strategy):

    ${ngModelGroupExample}`);
}
function ngModelInChildComponentWarning(containerTypeName) {
	return formatRuntimeError(-1354, `ngModel on a form control inside a child component cannot register with the ${containerTypeName} in the parent component because @Host() stops injection at the component boundary. To register this control with the parent form, add viewProviders to the child component: @Component({ ..., viewProviders: [{ provide: ControlContainer, useExisting: ${containerTypeName} }] }). Or, to opt out of form registration, use [ngModelOptions]="{standalone: true}".`);
}
function missingNameException() {
	return new RuntimeError(1352, `If ngModel is used within a form tag, either the name attribute must be set or the form
    control must be defined as 'standalone' in ngModelOptions.

    Example 1: <input [(ngModel)]="person.firstName" name="first">
    Example 2: <input [(ngModel)]="person.firstName" [ngModelOptions]="{standalone: true}">`);
}
function modelGroupParentException() {
	return new RuntimeError(1353, `
    ngModelGroup cannot be used with a parent formGroup directive.

    Option 1: Use formGroupName instead of ngModelGroup (reactive strategy):

    ${formGroupNameExample}

    Option 2:  Use a regular form tag instead of the formGroup directive (template-driven strategy):

    ${ngModelGroupExample}`);
}
var modelGroupProvider = {
	provide: ControlContainer,
	useExisting: forwardRef(() => NgModelGroup)
};
var NgModelGroup = class NgModelGroup extends AbstractFormGroupDirective {
	constructor(parent, validators, asyncValidators) {
		super();
		_defineProperty(this, "name", "");
		this._parent = parent;
		this._setValidators(validators);
		this._setAsyncValidators(asyncValidators);
	}
	_checkParentType() {
		if (!(this._parent instanceof NgModelGroup) && !(this._parent instanceof NgForm) && (typeof ngDevMode === "undefined" || ngDevMode)) throw modelGroupParentException();
	}
};
_NgModelGroup = NgModelGroup;
_defineProperty(NgModelGroup, "ɵfac", function NgModelGroup_Factory(__ngFactoryType__) {
	return new (__ngFactoryType__ || _NgModelGroup)(ɵɵdirectiveInject(ControlContainer, 5), ɵɵdirectiveInject(NG_VALIDATORS, 10), ɵɵdirectiveInject(NG_ASYNC_VALIDATORS, 10));
});
_defineProperty(NgModelGroup, "ɵdir", /*@__PURE__*/ ɵɵdefineDirective({
	type: _NgModelGroup,
	selectors: [[
		"",
		"ngModelGroup",
		""
	]],
	inputs: { name: [
		0,
		"ngModelGroup",
		"name"
	] },
	exportAs: ["ngModelGroup"],
	standalone: false,
	features: [ɵɵProvidersFeature([modelGroupProvider]), ɵɵInheritDefinitionFeature]
}));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(NgModelGroup, [{
		type: Directive,
		args: [{
			selector: "[ngModelGroup]",
			providers: [modelGroupProvider],
			exportAs: "ngModelGroup",
			standalone: false
		}]
	}], () => [
		{
			type: ControlContainer,
			decorators: [{ type: Host }, { type: SkipSelf }]
		},
		{
			type: void 0,
			decorators: [
				{ type: Optional },
				{ type: Self },
				{
					type: Inject,
					args: [NG_VALIDATORS]
				}
			]
		},
		{
			type: void 0,
			decorators: [
				{ type: Optional },
				{ type: Self },
				{
					type: Inject,
					args: [NG_ASYNC_VALIDATORS]
				}
			]
		}
	], { name: [{
		type: Input,
		args: ["ngModelGroup"]
	}] });
})();
var AbstractFormDirective = class extends ControlContainer {
	get submitted() {
		return untracked(this._submittedReactive);
	}
	set submitted(value) {
		this._submittedReactive.set(value);
	}
	constructor(validators, asyncValidators, callSetDisabledState) {
		super();
		_defineProperty(this, "callSetDisabledState", void 0);
		_defineProperty(this, "_submitted", computed(() => this._submittedReactive(), ...ngDevMode ? [{ debugName: "_submitted" }] : []));
		_defineProperty(this, "_submittedReactive", signal(false, ...ngDevMode ? [{ debugName: "_submittedReactive" }] : []));
		_defineProperty(this, "_oldForm", void 0);
		_defineProperty(this, "_onCollectionChange", () => this._updateDomValue());
		_defineProperty(this, "directives", []);
		this.callSetDisabledState = callSetDisabledState;
		this._setValidators(validators);
		this._setAsyncValidators(asyncValidators);
	}
	ngOnChanges(changes) {
		this.onChanges(changes);
	}
	ngOnDestroy() {
		this.onDestroy();
	}
	onChanges(changes) {
		this._checkFormPresent();
		if (Object.hasOwn(changes, "form")) {
			this._updateValidators();
			this._updateDomValue();
			this._updateRegistrations();
			this._oldForm = this.form;
		}
	}
	onDestroy() {
		if (this.form) {
			cleanUpValidators(this.form, this);
			if (this.form._onCollectionChange === this._onCollectionChange) this.form._registerOnCollectionChange(() => {});
		}
	}
	get formDirective() {
		return this;
	}
	get path() {
		return [];
	}
	addControl(dir) {
		const ctrl = this.form.get(dir.path);
		dir._setupWithForm(ctrl, this.callSetDisabledState);
		ctrl.updateValueAndValidity({ emitEvent: false });
		this.directives.push(dir);
		return ctrl;
	}
	getControl(dir) {
		return this.form.get(dir.path);
	}
	removeControl(dir) {
		cleanUpControl(dir.control || null, dir, false);
		removeListItem$1(this.directives, dir);
	}
	addFormGroup(dir) {
		this._setUpFormContainer(dir);
	}
	removeFormGroup(dir) {
		this._cleanUpFormContainer(dir);
	}
	getFormGroup(dir) {
		return this.form.get(dir.path);
	}
	getFormArray(dir) {
		return this.form.get(dir.path);
	}
	addFormArray(dir) {
		this._setUpFormContainer(dir);
	}
	removeFormArray(dir) {
		this._cleanUpFormContainer(dir);
	}
	updateModel(dir, value) {
		this.form.get(dir.path).setValue(value);
	}
	onReset() {
		this.resetForm();
	}
	resetForm(value = void 0, options = {}) {
		this.form.reset(value, options);
		this._submittedReactive.set(false);
	}
	onSubmit($event) {
		var _$event$target2;
		this.submitted = true;
		syncPendingControls(this.form, this.directives);
		this.ngSubmit.emit($event);
		this.form._events.next(new FormSubmittedEvent(this.control));
		return ($event === null || $event === void 0 || (_$event$target2 = $event.target) === null || _$event$target2 === void 0 ? void 0 : _$event$target2.method) === "dialog";
	}
	_updateDomValue() {
		this.directives.forEach((dir) => {
			const oldCtrl = dir.control;
			const newCtrl = this.form.get(dir.path);
			if (oldCtrl !== newCtrl) {
				cleanUpControl(oldCtrl || null, dir);
				if (isFormControl(newCtrl)) dir._setupWithForm(newCtrl, this.callSetDisabledState);
			}
		});
		this.form._updateTreeValidity({ emitEvent: false });
	}
	_setUpFormContainer(dir) {
		const ctrl = this.form.get(dir.path);
		setUpFormContainer(ctrl, dir);
		ctrl.updateValueAndValidity({ emitEvent: false });
	}
	_cleanUpFormContainer(dir) {
		var _this$form;
		const ctrl = (_this$form = this.form) === null || _this$form === void 0 ? void 0 : _this$form.get(dir.path);
		if (ctrl) {
			if (cleanUpFormContainer(ctrl, dir)) ctrl.updateValueAndValidity({ emitEvent: false });
		}
	}
	_updateRegistrations() {
		var _this$_oldForm;
		this.form._registerOnCollectionChange(this._onCollectionChange);
		(_this$_oldForm = this._oldForm) === null || _this$_oldForm === void 0 || _this$_oldForm._registerOnCollectionChange(() => {});
	}
	_updateValidators() {
		setUpValidators(this.form, this);
		if (this._oldForm) cleanUpValidators(this._oldForm, this);
	}
	_checkFormPresent() {
		if (!this.form && (typeof ngDevMode === "undefined" || ngDevMode)) throw missingFormException();
	}
};
_AbstractFormDirective = AbstractFormDirective;
_defineProperty(AbstractFormDirective, "ɵfac", function AbstractFormDirective_Factory(__ngFactoryType__) {
	return new (__ngFactoryType__ || _AbstractFormDirective)(ɵɵdirectiveInject(NG_VALIDATORS, 10), ɵɵdirectiveInject(NG_ASYNC_VALIDATORS, 10), ɵɵdirectiveInject(CALL_SET_DISABLED_STATE, 8));
});
_defineProperty(AbstractFormDirective, "ɵdir", /*@__PURE__*/ ɵɵdefineDirective({
	type: _AbstractFormDirective,
	features: [ɵɵInheritDefinitionFeature, ɵɵNgOnChangesFeature]
}));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(AbstractFormDirective, [{ type: Directive }], () => [
		{
			type: void 0,
			decorators: [
				{ type: Optional },
				{ type: Self },
				{
					type: Inject,
					args: [NG_VALIDATORS]
				}
			]
		},
		{
			type: void 0,
			decorators: [
				{ type: Optional },
				{ type: Self },
				{
					type: Inject,
					args: [NG_ASYNC_VALIDATORS]
				}
			]
		},
		{
			type: void 0,
			decorators: [{ type: Optional }, {
				type: Inject,
				args: [CALL_SET_DISABLED_STATE]
			}]
		}
	], null);
})();
var formDirectiveProvider$1 = {
	provide: ControlContainer,
	useExisting: forwardRef(() => FormGroupDirective)
};
var FormGroupDirective = class extends AbstractFormDirective {
	constructor(..._args11) {
		super(..._args11);
		_defineProperty(this, "form", null);
		_defineProperty(this, "ngSubmit", new EventEmitter());
	}
	get control() {
		return this.form;
	}
};
_FormGroupDirective = FormGroupDirective;
_defineProperty(FormGroupDirective, "ɵfac", /*@__PURE__*/ (() => {
	let ɵFormGroupDirective_BaseFactory = void 0;
	return function FormGroupDirective_Factory(__ngFactoryType__) {
		return (ɵFormGroupDirective_BaseFactory || (ɵFormGroupDirective_BaseFactory = ɵɵgetInheritedFactory(_FormGroupDirective)))(__ngFactoryType__ || _FormGroupDirective);
	};
})());
_defineProperty(FormGroupDirective, "ɵdir", /*@__PURE__*/ ɵɵdefineDirective({
	type: _FormGroupDirective,
	selectors: [[
		"",
		"formGroup",
		""
	]],
	hostBindings: function FormGroupDirective_HostBindings(rf, ctx) {
		if (rf & 1) ɵɵlistener("submit", function FormGroupDirective_submit_HostBindingHandler($event) {
			return ctx.onSubmit($event);
		})("reset", function FormGroupDirective_reset_HostBindingHandler() {
			return ctx.onReset();
		});
	},
	inputs: { form: [
		0,
		"formGroup",
		"form"
	] },
	outputs: { ngSubmit: "ngSubmit" },
	exportAs: ["ngForm"],
	standalone: false,
	features: [ɵɵProvidersFeature([formDirectiveProvider$1]), ɵɵInheritDefinitionFeature]
}));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(FormGroupDirective, [{
		type: Directive,
		args: [{
			selector: "[formGroup]",
			providers: [formDirectiveProvider$1],
			host: {
				"(submit)": "onSubmit($event)",
				"(reset)": "onReset()"
			},
			exportAs: "ngForm",
			standalone: false
		}]
	}], null, {
		form: [{
			type: Input,
			args: ["formGroup"]
		}],
		ngSubmit: [{ type: Output }]
	});
})();
var formControlBinding$1 = {
	provide: NgControl,
	useExisting: forwardRef(() => NgModel)
};
var resolvedPromise = (() => Promise.resolve())();
var NgModel = class extends NgControl {
	constructor(parent, validators, asyncValidators, valueAccessors, _changeDetectorRef, callSetDisabledState, injector, renderer) {
		super(injector, renderer, valueAccessors);
		_defineProperty(this, "_changeDetectorRef", void 0);
		_defineProperty(this, "callSetDisabledState", void 0);
		_defineProperty(this, "control", new FormControl());
		_defineProperty(this, "_registered", false);
		_defineProperty(this, "_ngModelInjector", void 0);
		_defineProperty(this, "viewModel", void 0);
		_defineProperty(this, "name", "");
		_defineProperty(this, "isDisabled", void 0);
		_defineProperty(this, "model", void 0);
		_defineProperty(this, "options", void 0);
		_defineProperty(this, "update", new EventEmitter());
		this._changeDetectorRef = _changeDetectorRef;
		this.callSetDisabledState = callSetDisabledState;
		this._parent = parent;
		if (typeof ngDevMode === "undefined" || ngDevMode) this._ngModelInjector = injector;
		this._setValidators(validators);
		this._setAsyncValidators(asyncValidators);
	}
	ngOnChanges(changes) {
		var _this$options;
		if (!this._registered && (typeof ngDevMode === "undefined" || ngDevMode) && this._parent === null && !((_this$options = this.options) === null || _this$options === void 0 ? void 0 : _this$options.standalone)) {
			var _this$_ngModelInjecto;
			const parentContainer = (_this$_ngModelInjecto = this._ngModelInjector) === null || _this$_ngModelInjecto === void 0 ? void 0 : _this$_ngModelInjecto.get(ControlContainer, null);
			if (parentContainer != null) {
				const typeName = parentContainer instanceof NgForm ? "NgForm" : parentContainer instanceof FormGroupDirective ? "FormGroupDirective" : parentContainer instanceof NgModelGroup ? "NgModelGroup" : parentContainer.constructor.name || "ControlContainer";
				console.warn(ngModelInChildComponentWarning(typeName));
			}
		}
		this._checkForErrors();
		if (!this._registered || "name" in changes) {
			if (this._registered) {
				this._checkName();
				if (this.formDirective) {
					const oldName = changes["name"].previousValue;
					this.formDirective.removeControl({
						name: oldName,
						path: this._getPath(oldName)
					});
				}
			}
			this._setUpControl();
		}
		if ("isDisabled" in changes) this._updateDisabled(changes);
		if (isPropertyUpdated(changes, this.viewModel)) {
			this._updateValue(this.model);
			this.viewModel = this.model;
		}
	}
	ngOnDestroy() {
		var _this$formDirective2;
		(_this$formDirective2 = this.formDirective) === null || _this$formDirective2 === void 0 || _this$formDirective2.removeControl(this);
	}
	ɵngControlCreate(host) {
		super.ngControlCreate(host);
	}
	ɵngControlUpdate(host) {
		super.ngControlUpdate(host, false);
	}
	get shouldBindRequired() {
		return false;
	}
	get path() {
		return this._getPath(this.name);
	}
	get formDirective() {
		return this._parent ? this._parent.formDirective : null;
	}
	viewToModelUpdate(newValue) {
		this.viewModel = newValue;
		this.update.emit(newValue);
	}
	_setUpControl() {
		this._setUpdateStrategy();
		this._isStandalone() ? this._setUpStandalone() : this.formDirective.addControl(this);
		this._registered = true;
	}
	_setUpdateStrategy() {
		if (this.options && this.options.updateOn != null) this.control._updateOn = this.options.updateOn;
	}
	_isStandalone() {
		return !this._parent || !!(this.options && this.options.standalone);
	}
	_setUpStandalone() {
		if (!this.isCustomControlBased) {
			var _this$valueAccessor;
			(_this$valueAccessor = this.valueAccessor) !== null && _this$valueAccessor !== void 0 || (this.valueAccessor = this.selectedValueAccessor);
			setUpControlValueAccessor(this.control, this, this.callSetDisabledState);
		} else this.setupCustomControl();
		this.control.updateValueAndValidity({ emitEvent: false });
	}
	_setupWithForm(callSetDisabledState) {
		if (!this.isCustomControlBased) {
			var _this$valueAccessor2;
			(_this$valueAccessor2 = this.valueAccessor) !== null && _this$valueAccessor2 !== void 0 || (this.valueAccessor = this.selectedValueAccessor);
			setUpControlValueAccessor(this.control, this, callSetDisabledState);
		} else this.setupCustomControl();
	}
	_checkForErrors() {
		if ((typeof ngDevMode === "undefined" || ngDevMode) && !this._isStandalone()) checkParentType$1(this._parent);
		this._checkName();
	}
	_checkName() {
		if (this.options && this.options.name) this.name = this.options.name;
		if (!this._isStandalone() && !this.name && (typeof ngDevMode === "undefined" || ngDevMode)) throw missingNameException();
	}
	_updateValue(value) {
		resolvedPromise.then(() => {
			var _this$_changeDetector;
			this.control.setValue(value, { emitViewToModelChange: false });
			(_this$_changeDetector = this._changeDetectorRef) === null || _this$_changeDetector === void 0 || _this$_changeDetector.markForCheck();
		});
	}
	_updateDisabled(changes) {
		const disabledValue = changes["isDisabled"].currentValue;
		const isDisabled = disabledValue !== 0 && booleanAttribute(disabledValue);
		resolvedPromise.then(() => {
			var _this$_changeDetector2;
			if (isDisabled && !this.control.disabled) this.control.disable();
			else if (!isDisabled && this.control.disabled) this.control.enable();
			(_this$_changeDetector2 = this._changeDetectorRef) === null || _this$_changeDetector2 === void 0 || _this$_changeDetector2.markForCheck();
		});
	}
	_getPath(controlName) {
		return this._parent ? controlPath(controlName, this._parent) : [controlName];
	}
};
_NgModel = NgModel;
_defineProperty(NgModel, "ngAcceptInputType_isDisabled", void 0);
_defineProperty(NgModel, "ɵfac", function NgModel_Factory(__ngFactoryType__) {
	return new (__ngFactoryType__ || _NgModel)(ɵɵdirectiveInject(ControlContainer, 9), ɵɵdirectiveInject(NG_VALIDATORS, 10), ɵɵdirectiveInject(NG_ASYNC_VALIDATORS, 10), ɵɵdirectiveInject(NG_VALUE_ACCESSOR, 10), ɵɵdirectiveInject(ChangeDetectorRef, 8), ɵɵdirectiveInject(CALL_SET_DISABLED_STATE, 8), ɵɵdirectiveInject(Injector, 8), ɵɵdirectiveInject(Renderer2, 8));
});
_defineProperty(NgModel, "ɵdir", /*@__PURE__*/ ɵɵdefineDirective({
	type: _NgModel,
	selectors: [[
		"",
		"ngModel",
		"",
		3,
		"formControlName",
		"",
		3,
		"formControl",
		""
	]],
	inputs: {
		name: "name",
		isDisabled: [
			0,
			"disabled",
			"isDisabled"
		],
		model: [
			0,
			"ngModel",
			"model"
		],
		options: [
			0,
			"ngModelOptions",
			"options"
		]
	},
	outputs: { update: "ngModelChange" },
	exportAs: ["ngModel"],
	standalone: false,
	features: [
		ɵɵProvidersFeature([formControlBinding$1, NG_CONTROL_INTEGRATION_PROVIDER]),
		ɵɵInheritDefinitionFeature,
		ɵɵNgOnChangesFeature,
		ɵɵControlFeature(null)
	]
}));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(NgModel, [{
		type: Directive,
		args: [{
			selector: "[ngModel]:not([formControlName]):not([formControl])",
			providers: [formControlBinding$1, NG_CONTROL_INTEGRATION_PROVIDER],
			exportAs: "ngModel",
			standalone: false
		}]
	}], () => [
		{
			type: ControlContainer,
			decorators: [{ type: Optional }, { type: Host }]
		},
		{
			type: void 0,
			decorators: [
				{ type: Optional },
				{ type: Self },
				{
					type: Inject,
					args: [NG_VALIDATORS]
				}
			]
		},
		{
			type: void 0,
			decorators: [
				{ type: Optional },
				{ type: Self },
				{
					type: Inject,
					args: [NG_ASYNC_VALIDATORS]
				}
			]
		},
		{
			type: void 0,
			decorators: [
				{ type: Optional },
				{ type: Self },
				{
					type: Inject,
					args: [NG_VALUE_ACCESSOR]
				}
			]
		},
		{
			type: ChangeDetectorRef,
			decorators: [{ type: Optional }, {
				type: Inject,
				args: [ChangeDetectorRef]
			}]
		},
		{
			type: void 0,
			decorators: [{ type: Optional }, {
				type: Inject,
				args: [CALL_SET_DISABLED_STATE]
			}]
		},
		{
			type: Injector,
			decorators: [{ type: Optional }]
		},
		{
			type: Renderer2,
			decorators: [{ type: Optional }]
		}
	], {
		name: [{ type: Input }],
		isDisabled: [{
			type: Input,
			args: ["disabled"]
		}],
		model: [{
			type: Input,
			args: ["ngModel"]
		}],
		options: [{
			type: Input,
			args: ["ngModelOptions"]
		}],
		update: [{
			type: Output,
			args: ["ngModelChange"]
		}]
	});
})();
function checkParentType$1(parent) {
	if (!(parent instanceof NgModelGroup) && parent instanceof AbstractFormGroupDirective) throw formGroupNameException();
	else if (!(parent instanceof NgModelGroup) && !(parent instanceof NgForm)) throw modelParentException();
}
var ɵNgNoValidate = class {};
_ɵNgNoValidate = ɵNgNoValidate;
_defineProperty(ɵNgNoValidate, "ɵfac", function ɵNgNoValidate_Factory(__ngFactoryType__) {
	return new (__ngFactoryType__ || _ɵNgNoValidate)();
});
_defineProperty(ɵNgNoValidate, "ɵdir", /*@__PURE__*/ ɵɵdefineDirective({
	type: _ɵNgNoValidate,
	selectors: [[
		"form",
		3,
		"ngNoForm",
		"",
		3,
		"ngNativeValidate",
		""
	]],
	hostAttrs: ["novalidate", ""],
	standalone: false
}));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(ɵNgNoValidate, [{
		type: Directive,
		args: [{
			selector: "form:not([ngNoForm]):not([ngNativeValidate])",
			host: { "novalidate": "" },
			standalone: false
		}]
	}], null, null);
})();
var NUMBER_VALUE_ACCESSOR = {
	provide: NG_VALUE_ACCESSOR,
	useExisting: forwardRef(() => NumberValueAccessor),
	multi: true
};
var NumberValueAccessor = class extends BuiltInControlValueAccessor {
	writeValue(value) {
		const normalizedValue = value == null ? "" : value;
		this.setProperty("value", normalizedValue);
	}
	registerOnChange(fn) {
		this.onChange = (value) => {
			fn(value == "" ? null : parseFloat(value));
		};
	}
};
_NumberValueAccessor = NumberValueAccessor;
_defineProperty(NumberValueAccessor, "ɵfac", /*@__PURE__*/ (() => {
	let ɵNumberValueAccessor_BaseFactory = void 0;
	return function NumberValueAccessor_Factory(__ngFactoryType__) {
		return (ɵNumberValueAccessor_BaseFactory || (ɵNumberValueAccessor_BaseFactory = ɵɵgetInheritedFactory(_NumberValueAccessor)))(__ngFactoryType__ || _NumberValueAccessor);
	};
})());
_defineProperty(NumberValueAccessor, "ɵdir", /*@__PURE__*/ ɵɵdefineDirective({
	type: _NumberValueAccessor,
	selectors: [
		[
			"input",
			"type",
			"number",
			"formControlName",
			"",
			3,
			"ngNoCva",
			""
		],
		[
			"input",
			"type",
			"number",
			"formControl",
			"",
			3,
			"ngNoCva",
			""
		],
		[
			"input",
			"type",
			"number",
			"ngModel",
			"",
			3,
			"ngNoCva",
			""
		]
	],
	hostBindings: function NumberValueAccessor_HostBindings(rf, ctx) {
		if (rf & 1) ɵɵlistener("input", function NumberValueAccessor_input_HostBindingHandler($event) {
			return ctx.onChange($event.target.value);
		})("blur", function NumberValueAccessor_blur_HostBindingHandler() {
			return ctx.onTouched();
		});
	},
	standalone: false,
	features: [ɵɵProvidersFeature([NUMBER_VALUE_ACCESSOR]), ɵɵInheritDefinitionFeature]
}));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(NumberValueAccessor, [{
		type: Directive,
		args: [{
			selector: "input[type=number]:not([ngNoCva])[formControlName],input[type=number]:not([ngNoCva])[formControl],input[type=number]:not([ngNoCva])[ngModel]",
			host: {
				"(input)": "onChange($any($event.target).value)",
				"(blur)": "onTouched()"
			},
			providers: [NUMBER_VALUE_ACCESSOR],
			standalone: false
		}]
	}], null, null);
})();
var RADIO_VALUE_ACCESSOR = {
	provide: NG_VALUE_ACCESSOR,
	useExisting: forwardRef(() => RadioControlValueAccessor),
	multi: true
};
function throwNameError() {
	throw new RuntimeError(1202, `
      If you define both a name and a formControlName attribute on your radio button, their values
      must match. Ex: <input type="radio" formControlName="food" name="food">
    `);
}
var RadioControlRegistry = class {
	constructor() {
		_defineProperty(this, "_accessors", []);
	}
	add(control, accessor) {
		this._accessors.push([control, accessor]);
	}
	remove(accessor) {
		for (let i = this._accessors.length - 1; i >= 0; --i) if (this._accessors[i][1] === accessor) {
			this._accessors.splice(i, 1);
			return;
		}
	}
	select(accessor) {
		this._accessors.forEach((c) => {
			if (this._isSameGroup(c, accessor) && c[1] !== accessor) c[1].fireUncheck(accessor.value);
		});
	}
	_isSameGroup(controlPair, accessor) {
		if (!controlPair[0].control) return false;
		return controlPair[0]._parent === accessor._control._parent && controlPair[1].name === accessor.name;
	}
};
_RadioControlRegistry = RadioControlRegistry;
_defineProperty(RadioControlRegistry, "ɵfac", function RadioControlRegistry_Factory(__ngFactoryType__) {
	return new (__ngFactoryType__ || _RadioControlRegistry)();
});
_defineProperty(RadioControlRegistry, "ɵprov", /*@__PURE__*/ ɵɵdefineService({
	token: _RadioControlRegistry,
	factory: _RadioControlRegistry.ɵfac
}));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(RadioControlRegistry, [{ type: Service }], null, null);
})();
var RadioControlValueAccessor = class extends BuiltInControlValueAccessor {
	constructor(renderer, elementRef, _registry, _injector) {
		var _inject;
		super(renderer, elementRef);
		_defineProperty(this, "_registry", void 0);
		_defineProperty(this, "_injector", void 0);
		_defineProperty(this, "_state", void 0);
		_defineProperty(this, "_control", void 0);
		_defineProperty(this, "_fn", void 0);
		_defineProperty(this, "setDisabledStateFired", false);
		_defineProperty(this, "onChange", () => {});
		_defineProperty(this, "name", void 0);
		_defineProperty(this, "formControlName", void 0);
		_defineProperty(this, "value", void 0);
		_defineProperty(this, "callSetDisabledState", (_inject = inject(CALL_SET_DISABLED_STATE, { optional: true })) !== null && _inject !== void 0 ? _inject : setDisabledStateDefault);
		this._registry = _registry;
		this._injector = _injector;
	}
	ngOnChanges(changes) {
		var _this$_control;
		const control = (_this$_control = this._control) === null || _this$_control === void 0 ? void 0 : _this$_control.control;
		if (changes["value"] && control) this.writeValue(control.value);
	}
	ngOnInit() {
		this._control = this._injector.get(NgControl);
		this._checkName();
		this._registry.add(this._control, this);
	}
	ngOnDestroy() {
		this._registry.remove(this);
	}
	writeValue(value) {
		this._state = value === this.value;
		this.setProperty("checked", this._state);
	}
	registerOnChange(fn) {
		this._fn = fn;
		this.onChange = () => {
			fn(this.value);
			this._registry.select(this);
		};
	}
	setDisabledState(isDisabled) {
		if (this.setDisabledStateFired || isDisabled || this.callSetDisabledState === "whenDisabledForLegacyCode") this.setProperty("disabled", isDisabled);
		this.setDisabledStateFired = true;
	}
	fireUncheck(value) {
		this.writeValue(value);
	}
	_checkName() {
		if (this.name && this.formControlName && this.name !== this.formControlName && (typeof ngDevMode === "undefined" || ngDevMode)) throwNameError();
		if (!this.name && this.formControlName) this.name = this.formControlName;
	}
};
_RadioControlValueAccessor = RadioControlValueAccessor;
_defineProperty(RadioControlValueAccessor, "ɵfac", function RadioControlValueAccessor_Factory(__ngFactoryType__) {
	return new (__ngFactoryType__ || _RadioControlValueAccessor)(ɵɵdirectiveInject(Renderer2), ɵɵdirectiveInject(ElementRef), ɵɵdirectiveInject(RadioControlRegistry), ɵɵdirectiveInject(Injector));
});
_defineProperty(RadioControlValueAccessor, "ɵdir", /*@__PURE__*/ ɵɵdefineDirective({
	type: _RadioControlValueAccessor,
	selectors: [
		[
			"input",
			"type",
			"radio",
			"formControlName",
			"",
			3,
			"ngNoCva",
			""
		],
		[
			"input",
			"type",
			"radio",
			"formControl",
			"",
			3,
			"ngNoCva",
			""
		],
		[
			"input",
			"type",
			"radio",
			"ngModel",
			"",
			3,
			"ngNoCva",
			""
		]
	],
	hostBindings: function RadioControlValueAccessor_HostBindings(rf, ctx) {
		if (rf & 1) ɵɵlistener("change", function RadioControlValueAccessor_change_HostBindingHandler() {
			return ctx.onChange();
		})("blur", function RadioControlValueAccessor_blur_HostBindingHandler() {
			return ctx.onTouched();
		});
	},
	inputs: {
		name: "name",
		formControlName: "formControlName",
		value: "value"
	},
	standalone: false,
	features: [
		ɵɵProvidersFeature([RADIO_VALUE_ACCESSOR]),
		ɵɵInheritDefinitionFeature,
		ɵɵNgOnChangesFeature
	]
}));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(RadioControlValueAccessor, [{
		type: Directive,
		args: [{
			selector: "input[type=radio]:not([ngNoCva])[formControlName],input[type=radio]:not([ngNoCva])[formControl],input[type=radio]:not([ngNoCva])[ngModel]",
			host: {
				"(change)": "onChange()",
				"(blur)": "onTouched()"
			},
			providers: [RADIO_VALUE_ACCESSOR],
			standalone: false
		}]
	}], () => [
		{ type: Renderer2 },
		{ type: ElementRef },
		{ type: RadioControlRegistry },
		{ type: Injector }
	], {
		name: [{ type: Input }],
		formControlName: [{ type: Input }],
		value: [{ type: Input }]
	});
})();
var RANGE_VALUE_ACCESSOR = {
	provide: NG_VALUE_ACCESSOR,
	useExisting: forwardRef(() => RangeValueAccessor),
	multi: true
};
var RangeValueAccessor = class extends BuiltInControlValueAccessor {
	writeValue(value) {
		this.setProperty("value", parseFloat(value));
	}
	registerOnChange(fn) {
		this.onChange = (value) => {
			fn(value == "" ? null : parseFloat(value));
		};
	}
};
_RangeValueAccessor = RangeValueAccessor;
_defineProperty(RangeValueAccessor, "ɵfac", /*@__PURE__*/ (() => {
	let ɵRangeValueAccessor_BaseFactory = void 0;
	return function RangeValueAccessor_Factory(__ngFactoryType__) {
		return (ɵRangeValueAccessor_BaseFactory || (ɵRangeValueAccessor_BaseFactory = ɵɵgetInheritedFactory(_RangeValueAccessor)))(__ngFactoryType__ || _RangeValueAccessor);
	};
})());
_defineProperty(RangeValueAccessor, "ɵdir", /*@__PURE__*/ ɵɵdefineDirective({
	type: _RangeValueAccessor,
	selectors: [
		[
			"input",
			"type",
			"range",
			"formControlName",
			"",
			3,
			"ngNoCva",
			""
		],
		[
			"input",
			"type",
			"range",
			"formControl",
			"",
			3,
			"ngNoCva",
			""
		],
		[
			"input",
			"type",
			"range",
			"ngModel",
			"",
			3,
			"ngNoCva",
			""
		]
	],
	hostBindings: function RangeValueAccessor_HostBindings(rf, ctx) {
		if (rf & 1) ɵɵlistener("change", function RangeValueAccessor_change_HostBindingHandler($event) {
			return ctx.onChange($event.target.value);
		})("input", function RangeValueAccessor_input_HostBindingHandler($event) {
			return ctx.onChange($event.target.value);
		})("blur", function RangeValueAccessor_blur_HostBindingHandler() {
			return ctx.onTouched();
		});
	},
	standalone: false,
	features: [ɵɵProvidersFeature([RANGE_VALUE_ACCESSOR]), ɵɵInheritDefinitionFeature]
}));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(RangeValueAccessor, [{
		type: Directive,
		args: [{
			selector: "input[type=range]:not([ngNoCva])[formControlName],input[type=range]:not([ngNoCva])[formControl],input[type=range]:not([ngNoCva])[ngModel]",
			host: {
				"(change)": "onChange($any($event.target).value)",
				"(input)": "onChange($any($event.target).value)",
				"(blur)": "onTouched()"
			},
			providers: [RANGE_VALUE_ACCESSOR],
			standalone: false
		}]
	}], null, null);
})();
var FormArray = class extends AbstractControl {
	constructor(controls, validatorOrOpts, asyncValidator) {
		super(pickValidators(validatorOrOpts), pickAsyncValidators(asyncValidator, validatorOrOpts));
		_defineProperty(this, "controls", void 0);
		this.controls = controls;
		this._initObservables();
		this._setUpdateStrategy(validatorOrOpts);
		this._setUpControls();
		this.updateValueAndValidity({
			onlySelf: true,
			emitEvent: !!this.asyncValidator
		});
	}
	at(index) {
		return this.controls[this._adjustIndex(index)];
	}
	push(control, options = {}) {
		if (Array.isArray(control)) control.forEach((ctrl) => {
			this.controls.push(ctrl);
			this._registerControl(ctrl);
		});
		else {
			this.controls.push(control);
			this._registerControl(control);
		}
		this.updateValueAndValidity({ emitEvent: options.emitEvent });
		this._onCollectionChange();
	}
	insert(index, control, options = {}) {
		this.controls.splice(index, 0, control);
		this._registerControl(control);
		this.updateValueAndValidity({ emitEvent: options.emitEvent });
	}
	removeAt(index, options = {}) {
		let adjustedIndex = this._adjustIndex(index);
		if (adjustedIndex < 0) adjustedIndex = 0;
		if (this.controls[adjustedIndex]) this.controls[adjustedIndex]._registerOnCollectionChange(() => {});
		this.controls.splice(adjustedIndex, 1);
		this.updateValueAndValidity({ emitEvent: options.emitEvent });
	}
	setControl(index, control, options = {}) {
		let adjustedIndex = this._adjustIndex(index);
		if (adjustedIndex < 0) adjustedIndex = 0;
		if (this.controls[adjustedIndex]) this.controls[adjustedIndex]._registerOnCollectionChange(() => {});
		this.controls.splice(adjustedIndex, 1);
		if (control) {
			this.controls.splice(adjustedIndex, 0, control);
			this._registerControl(control);
		}
		this.updateValueAndValidity({ emitEvent: options.emitEvent });
		this._onCollectionChange();
	}
	get length() {
		return this.controls.length;
	}
	setValue(value, options = {}) {
		untracked(() => {
			assertAllValuesPresent(this, false, value);
			value.forEach((newValue, index) => {
				assertControlPresent(this, false, index);
				this.at(index).setValue(newValue, {
					onlySelf: true,
					emitEvent: options.emitEvent
				});
			});
			this.updateValueAndValidity(options);
		});
	}
	patchValue(value, options = {}) {
		if (value == null) return;
		value.forEach((newValue, index) => {
			if (this.at(index)) this.at(index).patchValue(newValue, {
				onlySelf: true,
				emitEvent: options.emitEvent
			});
		});
		this.updateValueAndValidity(options);
	}
	reset(value = [], options = {}) {
		this._forEachChild((control, index) => {
			control.reset(value[index], _objectSpread2(_objectSpread2({}, options), {}, { onlySelf: true }));
		});
		this._updatePristine(options, this);
		this._updateTouched(options, this);
		this.updateValueAndValidity(options);
		if ((options === null || options === void 0 ? void 0 : options.emitEvent) !== false) this._events.next(new FormResetEvent(this));
	}
	getRawValue() {
		return this.controls.map((control) => control.getRawValue());
	}
	clear(options = {}) {
		if (this.controls.length < 1) return;
		this._forEachChild((control) => control._registerOnCollectionChange(() => {}));
		this.controls.splice(0);
		this.updateValueAndValidity({ emitEvent: options.emitEvent });
	}
	_adjustIndex(index) {
		return index < 0 ? index + this.length : index;
	}
	_syncPendingControls() {
		let subtreeUpdated = this.controls.reduce((updated, child) => {
			return child._syncPendingControls() ? true : updated;
		}, false);
		if (subtreeUpdated) this.updateValueAndValidity({ onlySelf: true });
		return subtreeUpdated;
	}
	_forEachChild(cb) {
		this.controls.forEach((control, index) => {
			cb(control, index);
		});
	}
	_updateValue() {
		this.value = this.controls.filter((control) => control.enabled || this.disabled).map((control) => control.value);
	}
	_anyControls(condition) {
		return this.controls.some((control) => control.enabled && condition(control));
	}
	_setUpControls() {
		this._forEachChild((control) => this._registerControl(control));
	}
	_allControlsDisabled() {
		for (const control of this.controls) if (control.enabled) return false;
		return this.controls.length > 0 || this.disabled;
	}
	_registerControl(control) {
		control.setParent(this);
		control._registerOnCollectionChange(this._onCollectionChange);
	}
	_find(name) {
		var _this$at;
		return (_this$at = this.at(name)) !== null && _this$at !== void 0 ? _this$at : null;
	}
};
var UntypedFormArray = FormArray;
var isFormArray = (control) => control instanceof FormArray;
var formDirectiveProvider = {
	provide: ControlContainer,
	useExisting: forwardRef(() => FormArrayDirective)
};
var FormArrayDirective = class extends AbstractFormDirective {
	constructor(..._args12) {
		super(..._args12);
		_defineProperty(this, "form", null);
		_defineProperty(this, "ngSubmit", new EventEmitter());
	}
	get control() {
		return this.form;
	}
};
_FormArrayDirective = FormArrayDirective;
_defineProperty(FormArrayDirective, "ɵfac", /*@__PURE__*/ (() => {
	let ɵFormArrayDirective_BaseFactory = void 0;
	return function FormArrayDirective_Factory(__ngFactoryType__) {
		return (ɵFormArrayDirective_BaseFactory || (ɵFormArrayDirective_BaseFactory = ɵɵgetInheritedFactory(_FormArrayDirective)))(__ngFactoryType__ || _FormArrayDirective);
	};
})());
_defineProperty(FormArrayDirective, "ɵdir", /*@__PURE__*/ ɵɵdefineDirective({
	type: _FormArrayDirective,
	selectors: [[
		"",
		"formArray",
		""
	]],
	hostBindings: function FormArrayDirective_HostBindings(rf, ctx) {
		if (rf & 1) ɵɵlistener("submit", function FormArrayDirective_submit_HostBindingHandler($event) {
			return ctx.onSubmit($event);
		})("reset", function FormArrayDirective_reset_HostBindingHandler() {
			return ctx.onReset();
		});
	},
	inputs: { form: [
		0,
		"formArray",
		"form"
	] },
	outputs: { ngSubmit: "ngSubmit" },
	exportAs: ["ngForm"],
	standalone: false,
	features: [ɵɵProvidersFeature([formDirectiveProvider]), ɵɵInheritDefinitionFeature]
}));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(FormArrayDirective, [{
		type: Directive,
		args: [{
			selector: "[formArray]",
			providers: [formDirectiveProvider],
			host: {
				"(submit)": "onSubmit($event)",
				"(reset)": "onReset()"
			},
			exportAs: "ngForm",
			standalone: false
		}]
	}], null, {
		form: [{
			type: Input,
			args: ["formArray"]
		}],
		ngSubmit: [{ type: Output }]
	});
})();
var NG_MODEL_WITH_FORM_CONTROL_WARNING = new InjectionToken(typeof ngDevMode !== "undefined" && ngDevMode ? "NgModelWithFormControlWarning" : "");
var formControlBinding = {
	provide: NgControl,
	useExisting: forwardRef(() => FormControlDirective)
};
var FormControlDirective = class FormControlDirective extends NgControl {
	set isDisabled(isDisabled) {
		if (typeof ngDevMode === "undefined" || ngDevMode) console.warn(disabledAttrWarning);
	}
	constructor(validators, asyncValidators, valueAccessors, _ngModelWarningConfig, callSetDisabledState, renderer, injector) {
		super(injector, renderer, valueAccessors);
		_defineProperty(this, "_ngModelWarningConfig", void 0);
		_defineProperty(this, "callSetDisabledState", void 0);
		_defineProperty(this, "viewModel", void 0);
		_defineProperty(this, "form", void 0);
		_defineProperty(this, "model", void 0);
		_defineProperty(this, "update", new EventEmitter());
		_defineProperty(this, "_ngModelWarningSent", false);
		this._ngModelWarningConfig = _ngModelWarningConfig;
		this.callSetDisabledState = callSetDisabledState;
		this._setValidators(validators);
		this._setAsyncValidators(asyncValidators);
	}
	ngOnChanges(changes) {
		if (this._isControlChanged(changes)) {
			const previousForm = changes["form"].previousValue;
			if (previousForm) {
				cleanUpControl(previousForm, this, false);
				this.removeParseErrorsValidator(previousForm);
			}
			if (!this.isCustomControlBased) {
				var _this$valueAccessor3;
				(_this$valueAccessor3 = this.valueAccessor) !== null && _this$valueAccessor3 !== void 0 || (this.valueAccessor = this.selectedValueAccessor);
				setUpControlValueAccessor(this.form, this, this.callSetDisabledState);
			} else this.setupCustomControl();
			this.form.updateValueAndValidity({ emitEvent: false });
		}
		if (isPropertyUpdated(changes, this.viewModel)) {
			if (typeof ngDevMode === "undefined" || ngDevMode) _ngModelWarning("formControl", FormControlDirective, this, this._ngModelWarningConfig);
			this.form.setValue(this.model);
			this.viewModel = this.model;
		}
	}
	ngOnDestroy() {
		if (this.form) cleanUpControl(this.form, this, false);
	}
	get path() {
		return [];
	}
	get control() {
		return this.form;
	}
	viewToModelUpdate(newValue) {
		this.viewModel = newValue;
		this.update.emit(newValue);
	}
	_isControlChanged(changes) {
		return Object.hasOwn(changes, "form");
	}
	ɵngControlCreate(host) {
		super.ngControlCreate(host);
	}
	ɵngControlUpdate(host) {
		super.ngControlUpdate(host, true);
	}
};
_FormControlDirective = FormControlDirective;
_defineProperty(FormControlDirective, "_ngModelWarningSentOnce", false);
_defineProperty(FormControlDirective, "ɵfac", function FormControlDirective_Factory(__ngFactoryType__) {
	return new (__ngFactoryType__ || _FormControlDirective)(ɵɵdirectiveInject(NG_VALIDATORS, 10), ɵɵdirectiveInject(NG_ASYNC_VALIDATORS, 10), ɵɵdirectiveInject(NG_VALUE_ACCESSOR, 10), ɵɵdirectiveInject(NG_MODEL_WITH_FORM_CONTROL_WARNING, 8), ɵɵdirectiveInject(CALL_SET_DISABLED_STATE, 8), ɵɵdirectiveInject(Renderer2, 8), ɵɵdirectiveInject(Injector, 8));
});
_defineProperty(FormControlDirective, "ɵdir", /*@__PURE__*/ ɵɵdefineDirective({
	type: _FormControlDirective,
	selectors: [[
		"",
		"formControl",
		""
	]],
	inputs: {
		form: [
			0,
			"formControl",
			"form"
		],
		isDisabled: [
			0,
			"disabled",
			"isDisabled"
		],
		model: [
			0,
			"ngModel",
			"model"
		]
	},
	outputs: { update: "ngModelChange" },
	exportAs: ["ngForm"],
	standalone: false,
	features: [
		ɵɵProvidersFeature([formControlBinding, NG_CONTROL_INTEGRATION_PROVIDER]),
		ɵɵInheritDefinitionFeature,
		ɵɵNgOnChangesFeature,
		ɵɵControlFeature(null)
	]
}));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(FormControlDirective, [{
		type: Directive,
		args: [{
			selector: "[formControl]",
			providers: [formControlBinding, NG_CONTROL_INTEGRATION_PROVIDER],
			exportAs: "ngForm",
			standalone: false
		}]
	}], () => [
		{
			type: void 0,
			decorators: [
				{ type: Optional },
				{ type: Self },
				{
					type: Inject,
					args: [NG_VALIDATORS]
				}
			]
		},
		{
			type: void 0,
			decorators: [
				{ type: Optional },
				{ type: Self },
				{
					type: Inject,
					args: [NG_ASYNC_VALIDATORS]
				}
			]
		},
		{
			type: void 0,
			decorators: [
				{ type: Optional },
				{ type: Self },
				{
					type: Inject,
					args: [NG_VALUE_ACCESSOR]
				}
			]
		},
		{
			type: void 0,
			decorators: [{ type: Optional }, {
				type: Inject,
				args: [NG_MODEL_WITH_FORM_CONTROL_WARNING]
			}]
		},
		{
			type: void 0,
			decorators: [{ type: Optional }, {
				type: Inject,
				args: [CALL_SET_DISABLED_STATE]
			}]
		},
		{
			type: Renderer2,
			decorators: [{ type: Optional }]
		},
		{
			type: Injector,
			decorators: [{ type: Optional }]
		}
	], {
		form: [{
			type: Input,
			args: ["formControl"]
		}],
		isDisabled: [{
			type: Input,
			args: ["disabled"]
		}],
		model: [{
			type: Input,
			args: ["ngModel"]
		}],
		update: [{
			type: Output,
			args: ["ngModelChange"]
		}]
	});
})();
var formGroupNameProvider = {
	provide: ControlContainer,
	useExisting: forwardRef(() => FormGroupName)
};
var FormGroupName = class extends AbstractFormGroupDirective {
	constructor(parent, validators, asyncValidators) {
		super();
		_defineProperty(this, "name", null);
		this._parent = parent;
		this._setValidators(validators);
		this._setAsyncValidators(asyncValidators);
	}
	_checkParentType() {
		if (hasInvalidParent(this._parent) && (typeof ngDevMode === "undefined" || ngDevMode)) throw groupParentException();
	}
};
_FormGroupName = FormGroupName;
_defineProperty(FormGroupName, "ɵfac", function FormGroupName_Factory(__ngFactoryType__) {
	return new (__ngFactoryType__ || _FormGroupName)(ɵɵdirectiveInject(ControlContainer, 13), ɵɵdirectiveInject(NG_VALIDATORS, 10), ɵɵdirectiveInject(NG_ASYNC_VALIDATORS, 10));
});
_defineProperty(FormGroupName, "ɵdir", /*@__PURE__*/ ɵɵdefineDirective({
	type: _FormGroupName,
	selectors: [[
		"",
		"formGroupName",
		""
	]],
	inputs: { name: [
		0,
		"formGroupName",
		"name"
	] },
	standalone: false,
	features: [ɵɵProvidersFeature([formGroupNameProvider]), ɵɵInheritDefinitionFeature]
}));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(FormGroupName, [{
		type: Directive,
		args: [{
			selector: "[formGroupName]",
			providers: [formGroupNameProvider],
			standalone: false
		}]
	}], () => [
		{
			type: ControlContainer,
			decorators: [
				{ type: Optional },
				{ type: Host },
				{ type: SkipSelf }
			]
		},
		{
			type: void 0,
			decorators: [
				{ type: Optional },
				{ type: Self },
				{
					type: Inject,
					args: [NG_VALIDATORS]
				}
			]
		},
		{
			type: void 0,
			decorators: [
				{ type: Optional },
				{ type: Self },
				{
					type: Inject,
					args: [NG_ASYNC_VALIDATORS]
				}
			]
		}
	], { name: [{
		type: Input,
		args: ["formGroupName"]
	}] });
})();
var formArrayNameProvider = {
	provide: ControlContainer,
	useExisting: forwardRef(() => FormArrayName)
};
var FormArrayName = class extends ControlContainer {
	constructor(parent, validators, asyncValidators) {
		super();
		_defineProperty(this, "_parent", void 0);
		_defineProperty(this, "name", null);
		this._parent = parent;
		this._setValidators(validators);
		this._setAsyncValidators(asyncValidators);
	}
	ngOnInit() {
		if (hasInvalidParent(this._parent) && (typeof ngDevMode === "undefined" || ngDevMode)) throw arrayParentException();
		this.formDirective.addFormArray(this);
	}
	ngOnDestroy() {
		var _this$formDirective3;
		(_this$formDirective3 = this.formDirective) === null || _this$formDirective3 === void 0 || _this$formDirective3.removeFormArray(this);
	}
	get control() {
		return this.formDirective.getFormArray(this);
	}
	get formDirective() {
		return this._parent ? this._parent.formDirective : null;
	}
	get path() {
		return controlPath(this.name == null ? this.name : this.name.toString(), this._parent);
	}
};
_FormArrayName = FormArrayName;
_defineProperty(FormArrayName, "ɵfac", function FormArrayName_Factory(__ngFactoryType__) {
	return new (__ngFactoryType__ || _FormArrayName)(ɵɵdirectiveInject(ControlContainer, 13), ɵɵdirectiveInject(NG_VALIDATORS, 10), ɵɵdirectiveInject(NG_ASYNC_VALIDATORS, 10));
});
_defineProperty(FormArrayName, "ɵdir", /*@__PURE__*/ ɵɵdefineDirective({
	type: _FormArrayName,
	selectors: [[
		"",
		"formArrayName",
		""
	]],
	inputs: { name: [
		0,
		"formArrayName",
		"name"
	] },
	standalone: false,
	features: [ɵɵProvidersFeature([formArrayNameProvider]), ɵɵInheritDefinitionFeature]
}));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(FormArrayName, [{
		type: Directive,
		args: [{
			selector: "[formArrayName]",
			providers: [formArrayNameProvider],
			standalone: false
		}]
	}], () => [
		{
			type: ControlContainer,
			decorators: [
				{ type: Optional },
				{ type: Host },
				{ type: SkipSelf }
			]
		},
		{
			type: void 0,
			decorators: [
				{ type: Optional },
				{ type: Self },
				{
					type: Inject,
					args: [NG_VALIDATORS]
				}
			]
		},
		{
			type: void 0,
			decorators: [
				{ type: Optional },
				{ type: Self },
				{
					type: Inject,
					args: [NG_ASYNC_VALIDATORS]
				}
			]
		}
	], { name: [{
		type: Input,
		args: ["formArrayName"]
	}] });
})();
function hasInvalidParent(parent) {
	return !(parent instanceof FormGroupName) && !(parent instanceof AbstractFormDirective) && !(parent instanceof FormArrayName);
}
var controlNameBinding = {
	provide: NgControl,
	useExisting: forwardRef(() => FormControlName)
};
var FormControlName = class FormControlName extends NgControl {
	set isDisabled(isDisabled) {
		if (typeof ngDevMode === "undefined" || ngDevMode) console.warn(disabledAttrWarning);
	}
	constructor(parent, validators, asyncValidators, valueAccessors, _ngModelWarningConfig, renderer, injector) {
		super(injector, renderer, valueAccessors);
		_defineProperty(this, "_ngModelWarningConfig", void 0);
		_defineProperty(this, "_added", false);
		_defineProperty(this, "viewModel", void 0);
		_defineProperty(this, "control", void 0);
		_defineProperty(this, "name", null);
		_defineProperty(this, "model", void 0);
		_defineProperty(this, "update", new EventEmitter());
		_defineProperty(this, "_ngModelWarningSent", false);
		this._ngModelWarningConfig = _ngModelWarningConfig;
		this._parent = parent;
		this._setValidators(validators);
		this._setAsyncValidators(asyncValidators);
	}
	_setupWithForm(control, callSetDisabledState) {
		this.control = control;
		if (!this.isCustomControlBased) {
			var _this$valueAccessor4;
			(_this$valueAccessor4 = this.valueAccessor) !== null && _this$valueAccessor4 !== void 0 || (this.valueAccessor = this.selectedValueAccessor);
			setUpControlValueAccessor(control, this, callSetDisabledState);
		} else this.setupCustomControl();
	}
	ngOnChanges(changes) {
		if (!this._added) this._setUpControl();
		if (isPropertyUpdated(changes, this.viewModel)) {
			if (typeof ngDevMode === "undefined" || ngDevMode) _ngModelWarning("formControlName", FormControlName, this, this._ngModelWarningConfig);
			this.viewModel = this.model;
			this.formDirective.updateModel(this, this.model);
		}
	}
	ngOnDestroy() {
		var _this$formDirective4;
		(_this$formDirective4 = this.formDirective) === null || _this$formDirective4 === void 0 || _this$formDirective4.removeControl(this);
	}
	viewToModelUpdate(newValue) {
		this.viewModel = newValue;
		this.update.emit(newValue);
	}
	get path() {
		return controlPath(this.name == null ? this.name : this.name.toString(), this._parent);
	}
	get formDirective() {
		return this._parent ? this._parent.formDirective : null;
	}
	_setUpControl() {
		if (typeof ngDevMode === "undefined" || ngDevMode) checkParentType(this._parent, this.name);
		this.control = this.formDirective.addControl(this);
		this._added = true;
	}
	ɵngControlCreate(host) {
		super.ngControlCreate(host);
	}
	ɵngControlUpdate(host) {
		if (!this.isCustomControlBased) return;
		if (!this._added) this._setUpControl();
		super.ngControlUpdate(host, true);
	}
};
_FormControlName = FormControlName;
_defineProperty(FormControlName, "_ngModelWarningSentOnce", false);
_defineProperty(FormControlName, "ɵfac", function FormControlName_Factory(__ngFactoryType__) {
	return new (__ngFactoryType__ || _FormControlName)(ɵɵdirectiveInject(ControlContainer, 13), ɵɵdirectiveInject(NG_VALIDATORS, 10), ɵɵdirectiveInject(NG_ASYNC_VALIDATORS, 10), ɵɵdirectiveInject(NG_VALUE_ACCESSOR, 10), ɵɵdirectiveInject(NG_MODEL_WITH_FORM_CONTROL_WARNING, 8), ɵɵdirectiveInject(Renderer2, 8), ɵɵdirectiveInject(Injector, 8));
});
_defineProperty(FormControlName, "ɵdir", /*@__PURE__*/ ɵɵdefineDirective({
	type: _FormControlName,
	selectors: [[
		"",
		"formControlName",
		""
	]],
	inputs: {
		name: [
			0,
			"formControlName",
			"name"
		],
		isDisabled: [
			0,
			"disabled",
			"isDisabled"
		],
		model: [
			0,
			"ngModel",
			"model"
		]
	},
	outputs: { update: "ngModelChange" },
	standalone: false,
	features: [
		ɵɵProvidersFeature([controlNameBinding, NG_CONTROL_INTEGRATION_PROVIDER]),
		ɵɵInheritDefinitionFeature,
		ɵɵNgOnChangesFeature,
		ɵɵControlFeature(null)
	]
}));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(FormControlName, [{
		type: Directive,
		args: [{
			selector: "[formControlName]",
			providers: [controlNameBinding, NG_CONTROL_INTEGRATION_PROVIDER],
			standalone: false
		}]
	}], () => [
		{
			type: ControlContainer,
			decorators: [
				{ type: Optional },
				{ type: Host },
				{ type: SkipSelf }
			]
		},
		{
			type: void 0,
			decorators: [
				{ type: Optional },
				{ type: Self },
				{
					type: Inject,
					args: [NG_VALIDATORS]
				}
			]
		},
		{
			type: void 0,
			decorators: [
				{ type: Optional },
				{ type: Self },
				{
					type: Inject,
					args: [NG_ASYNC_VALIDATORS]
				}
			]
		},
		{
			type: void 0,
			decorators: [
				{ type: Optional },
				{ type: Self },
				{
					type: Inject,
					args: [NG_VALUE_ACCESSOR]
				}
			]
		},
		{
			type: void 0,
			decorators: [{ type: Optional }, {
				type: Inject,
				args: [NG_MODEL_WITH_FORM_CONTROL_WARNING]
			}]
		},
		{
			type: Renderer2,
			decorators: [{ type: Optional }]
		},
		{
			type: Injector,
			decorators: [{ type: Optional }]
		}
	], {
		name: [{
			type: Input,
			args: ["formControlName"]
		}],
		isDisabled: [{
			type: Input,
			args: ["disabled"]
		}],
		model: [{
			type: Input,
			args: ["ngModel"]
		}],
		update: [{
			type: Output,
			args: ["ngModelChange"]
		}]
	});
})();
function checkParentType(parent, name) {
	if (!(parent instanceof FormGroupName) && parent instanceof AbstractFormGroupDirective) throw ngModelGroupException();
	else if (!(parent instanceof FormGroupName) && !(parent instanceof AbstractFormDirective) && !(parent instanceof FormArrayName)) throw controlParentException(name);
}
var SELECT_VALUE_ACCESSOR = {
	provide: NG_VALUE_ACCESSOR,
	useExisting: forwardRef(() => SelectControlValueAccessor),
	multi: true
};
function _buildValueString$1(id, value) {
	if (id == null) return `${value}`;
	if (value && typeof value === "object") value = "Object";
	return `${id}: ${value}`.slice(0, 50);
}
function _extractId$1(valueString) {
	return valueString.split(":")[0];
}
var SelectControlValueAccessor = class extends BuiltInControlValueAccessor {
	constructor(..._args13) {
		super(..._args13);
		_defineProperty(this, "value", void 0);
		_defineProperty(this, "_optionMap", /* @__PURE__ */ new Map());
		_defineProperty(this, "_idCounter", 0);
		_defineProperty(this, "_compareWith", Object.is);
		_defineProperty(this, "appRefInjector", inject(ApplicationRef).injector);
		_defineProperty(this, "destroyRef", inject(DestroyRef));
		_defineProperty(this, "cdr", inject(ChangeDetectorRef));
		_defineProperty(this, "_queuedWrite", false);
	}
	set compareWith(fn) {
		if (typeof fn !== "function" && (typeof ngDevMode === "undefined" || ngDevMode)) throw new RuntimeError(1201, `compareWith must be a function, but received ${JSON.stringify(fn)}`);
		this._compareWith = fn;
	}
	_writeValueAfterRender() {
		if (this._queuedWrite || this.appRefInjector.destroyed) return;
		this._queuedWrite = true;
		afterNextRender({ write: () => {
			if (this.destroyRef.destroyed) return;
			this._queuedWrite = false;
			this.writeValue(this.value);
		} }, { injector: this.appRefInjector });
	}
	writeValue(value) {
		this.cdr.markForCheck();
		this.value = value;
		const valueString = _buildValueString$1(this._getOptionId(value), value);
		this.setProperty("value", valueString);
	}
	registerOnChange(fn) {
		this.onChange = (valueString) => {
			this.value = this._getOptionValue(valueString);
			fn(this.value);
		};
	}
	_registerOption() {
		return (this._idCounter++).toString();
	}
	_getOptionId(value) {
		for (const id of this._optionMap.keys()) if (this._compareWith(this._optionMap.get(id), value)) return id;
		return null;
	}
	_getOptionValue(valueString) {
		const id = _extractId$1(valueString);
		return this._optionMap.has(id) ? this._optionMap.get(id) : valueString;
	}
};
_SelectControlValueAccessor = SelectControlValueAccessor;
_defineProperty(SelectControlValueAccessor, "ɵfac", /*@__PURE__*/ (() => {
	let ɵSelectControlValueAccessor_BaseFactory = void 0;
	return function SelectControlValueAccessor_Factory(__ngFactoryType__) {
		return (ɵSelectControlValueAccessor_BaseFactory || (ɵSelectControlValueAccessor_BaseFactory = ɵɵgetInheritedFactory(_SelectControlValueAccessor)))(__ngFactoryType__ || _SelectControlValueAccessor);
	};
})());
_defineProperty(SelectControlValueAccessor, "ɵdir", /*@__PURE__*/ ɵɵdefineDirective({
	type: _SelectControlValueAccessor,
	selectors: [
		[
			"select",
			"formControlName",
			"",
			3,
			"multiple",
			"",
			3,
			"ngNoCva",
			""
		],
		[
			"select",
			"formControl",
			"",
			3,
			"multiple",
			"",
			3,
			"ngNoCva",
			""
		],
		[
			"select",
			"ngModel",
			"",
			3,
			"multiple",
			"",
			3,
			"ngNoCva",
			""
		]
	],
	hostBindings: function SelectControlValueAccessor_HostBindings(rf, ctx) {
		if (rf & 1) ɵɵlistener("change", function SelectControlValueAccessor_change_HostBindingHandler($event) {
			return ctx.onChange($event.target.value);
		})("blur", function SelectControlValueAccessor_blur_HostBindingHandler() {
			return ctx.onTouched();
		});
	},
	inputs: { compareWith: "compareWith" },
	standalone: false,
	features: [ɵɵProvidersFeature([SELECT_VALUE_ACCESSOR]), ɵɵInheritDefinitionFeature]
}));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(SelectControlValueAccessor, [{
		type: Directive,
		args: [{
			selector: "select:not([multiple]):not([ngNoCva])[formControlName],select:not([multiple]):not([ngNoCva])[formControl],select:not([multiple]):not([ngNoCva])[ngModel]",
			host: {
				"(change)": "onChange($any($event.target).value)",
				"(blur)": "onTouched()"
			},
			providers: [SELECT_VALUE_ACCESSOR],
			standalone: false
		}]
	}], null, { compareWith: [{ type: Input }] });
})();
var NgSelectOption = class {
	constructor(_element, _renderer, _select) {
		_defineProperty(this, "_element", void 0);
		_defineProperty(this, "_renderer", void 0);
		_defineProperty(this, "_select", void 0);
		_defineProperty(this, "id", void 0);
		this._element = _element;
		this._renderer = _renderer;
		this._select = _select;
		if (this._select) this.id = this._select._registerOption();
	}
	set ngValue(value) {
		if (this._select == null) return;
		this._select._optionMap.set(this.id, value);
		this._setElementValue(_buildValueString$1(this.id, value));
		this._select._writeValueAfterRender();
	}
	set value(value) {
		var _this$_select;
		this._setElementValue(value);
		(_this$_select = this._select) === null || _this$_select === void 0 || _this$_select._writeValueAfterRender();
	}
	_setElementValue(value) {
		this._renderer.setProperty(this._element.nativeElement, "value", value);
	}
	ngOnDestroy() {
		var _this$_select2, _this$_select3;
		(_this$_select2 = this._select) === null || _this$_select2 === void 0 || _this$_select2._optionMap.delete(this.id);
		(_this$_select3 = this._select) === null || _this$_select3 === void 0 || _this$_select3._writeValueAfterRender();
	}
};
_NgSelectOption = NgSelectOption;
_defineProperty(NgSelectOption, "ɵfac", function NgSelectOption_Factory(__ngFactoryType__) {
	return new (__ngFactoryType__ || _NgSelectOption)(ɵɵdirectiveInject(ElementRef), ɵɵdirectiveInject(Renderer2), ɵɵdirectiveInject(SelectControlValueAccessor, 9));
});
_defineProperty(NgSelectOption, "ɵdir", /*@__PURE__*/ ɵɵdefineDirective({
	type: _NgSelectOption,
	selectors: [["option"]],
	inputs: {
		ngValue: "ngValue",
		value: "value"
	},
	standalone: false
}));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(NgSelectOption, [{
		type: Directive,
		args: [{
			selector: "option",
			standalone: false
		}]
	}], () => [
		{ type: ElementRef },
		{ type: Renderer2 },
		{
			type: SelectControlValueAccessor,
			decorators: [{ type: Optional }, { type: Host }]
		}
	], {
		ngValue: [{
			type: Input,
			args: ["ngValue"]
		}],
		value: [{
			type: Input,
			args: ["value"]
		}]
	});
})();
var SELECT_MULTIPLE_VALUE_ACCESSOR = {
	provide: NG_VALUE_ACCESSOR,
	useExisting: forwardRef(() => SelectMultipleControlValueAccessor),
	multi: true
};
function _buildValueString(id, value) {
	if (id == null) return `${value}`;
	if (typeof value === "string") value = `'${value}'`;
	if (value && typeof value === "object") value = "Object";
	return `${id}: ${value}`.slice(0, 50);
}
function _extractId(valueString) {
	return valueString.split(":")[0];
}
var SelectMultipleControlValueAccessor = class extends BuiltInControlValueAccessor {
	constructor(..._args14) {
		super(..._args14);
		_defineProperty(this, "value", void 0);
		_defineProperty(this, "_optionMap", /* @__PURE__ */ new Map());
		_defineProperty(this, "_idCounter", 0);
		_defineProperty(this, "_compareWith", Object.is);
	}
	set compareWith(fn) {
		if (typeof fn !== "function" && (typeof ngDevMode === "undefined" || ngDevMode)) throw new RuntimeError(1201, `compareWith must be a function, but received ${JSON.stringify(fn)}`);
		this._compareWith = fn;
	}
	writeValue(value) {
		this.value = value;
		let optionSelectedStateSetter;
		if (Array.isArray(value)) {
			const ids = value.map((v) => this._getOptionId(v));
			optionSelectedStateSetter = (opt, id) => {
				opt._setSelected(ids.indexOf(id) > -1);
			};
		} else optionSelectedStateSetter = (opt) => {
			opt._setSelected(false);
		};
		this._optionMap.forEach(optionSelectedStateSetter);
	}
	registerOnChange(fn) {
		this.onChange = (element) => {
			const selected = [];
			const selectedOptions = element.selectedOptions;
			if (selectedOptions !== void 0) {
				const options = selectedOptions;
				for (let i = 0; i < options.length; i++) {
					const opt = options[i];
					const val = this._getOptionValue(opt.value);
					selected.push(val);
				}
			} else {
				const options = element.options;
				for (let i = 0; i < options.length; i++) {
					const opt = options[i];
					if (opt.selected) {
						const val = this._getOptionValue(opt.value);
						selected.push(val);
					}
				}
			}
			this.value = selected;
			fn(selected);
		};
	}
	_registerOption(value) {
		const id = (this._idCounter++).toString();
		this._optionMap.set(id, value);
		return id;
	}
	_getOptionId(value) {
		for (const id of this._optionMap.keys()) if (this._compareWith(this._optionMap.get(id)._value, value)) return id;
		return null;
	}
	_getOptionValue(valueString) {
		const id = _extractId(valueString);
		return this._optionMap.has(id) ? this._optionMap.get(id)._value : valueString;
	}
};
_SelectMultipleControlValueAccessor = SelectMultipleControlValueAccessor;
_defineProperty(SelectMultipleControlValueAccessor, "ɵfac", /*@__PURE__*/ (() => {
	let ɵSelectMultipleControlValueAccessor_BaseFactory = void 0;
	return function SelectMultipleControlValueAccessor_Factory(__ngFactoryType__) {
		return (ɵSelectMultipleControlValueAccessor_BaseFactory || (ɵSelectMultipleControlValueAccessor_BaseFactory = ɵɵgetInheritedFactory(_SelectMultipleControlValueAccessor)))(__ngFactoryType__ || _SelectMultipleControlValueAccessor);
	};
})());
_defineProperty(SelectMultipleControlValueAccessor, "ɵdir", /*@__PURE__*/ ɵɵdefineDirective({
	type: _SelectMultipleControlValueAccessor,
	selectors: [
		[
			"select",
			"multiple",
			"",
			"formControlName",
			"",
			3,
			"ngNoCva",
			""
		],
		[
			"select",
			"multiple",
			"",
			"formControl",
			"",
			3,
			"ngNoCva",
			""
		],
		[
			"select",
			"multiple",
			"",
			"ngModel",
			"",
			3,
			"ngNoCva",
			""
		]
	],
	hostBindings: function SelectMultipleControlValueAccessor_HostBindings(rf, ctx) {
		if (rf & 1) ɵɵlistener("change", function SelectMultipleControlValueAccessor_change_HostBindingHandler($event) {
			return ctx.onChange($event.target);
		})("blur", function SelectMultipleControlValueAccessor_blur_HostBindingHandler() {
			return ctx.onTouched();
		});
	},
	inputs: { compareWith: "compareWith" },
	standalone: false,
	features: [ɵɵProvidersFeature([SELECT_MULTIPLE_VALUE_ACCESSOR]), ɵɵInheritDefinitionFeature]
}));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(SelectMultipleControlValueAccessor, [{
		type: Directive,
		args: [{
			selector: "select[multiple]:not([ngNoCva])[formControlName],select[multiple]:not([ngNoCva])[formControl],select[multiple]:not([ngNoCva])[ngModel]",
			host: {
				"(change)": "onChange($event.target)",
				"(blur)": "onTouched()"
			},
			providers: [SELECT_MULTIPLE_VALUE_ACCESSOR],
			standalone: false
		}]
	}], null, { compareWith: [{ type: Input }] });
})();
var ɵNgSelectMultipleOption = class {
	constructor(_element, _renderer, _select) {
		_defineProperty(this, "_element", void 0);
		_defineProperty(this, "_renderer", void 0);
		_defineProperty(this, "_select", void 0);
		_defineProperty(this, "id", void 0);
		_defineProperty(this, "_value", void 0);
		this._element = _element;
		this._renderer = _renderer;
		this._select = _select;
		if (this._select) this.id = this._select._registerOption(this);
	}
	set ngValue(value) {
		if (this._select == null) return;
		this._value = value;
		this._setElementValue(_buildValueString(this.id, value));
		this._select.writeValue(this._select.value);
	}
	set value(value) {
		if (this._select) {
			this._value = value;
			this._setElementValue(_buildValueString(this.id, value));
			this._select.writeValue(this._select.value);
		} else this._setElementValue(value);
	}
	_setElementValue(value) {
		this._renderer.setProperty(this._element.nativeElement, "value", value);
	}
	_setSelected(selected) {
		this._renderer.setProperty(this._element.nativeElement, "selected", selected);
	}
	ngOnDestroy() {
		if (this._select) {
			this._select._optionMap.delete(this.id);
			this._select.writeValue(this._select.value);
		}
	}
};
_ɵNgSelectMultipleOption = ɵNgSelectMultipleOption;
_defineProperty(ɵNgSelectMultipleOption, "ɵfac", function ɵNgSelectMultipleOption_Factory(__ngFactoryType__) {
	return new (__ngFactoryType__ || _ɵNgSelectMultipleOption)(ɵɵdirectiveInject(ElementRef), ɵɵdirectiveInject(Renderer2), ɵɵdirectiveInject(SelectMultipleControlValueAccessor, 9));
});
_defineProperty(ɵNgSelectMultipleOption, "ɵdir", /*@__PURE__*/ ɵɵdefineDirective({
	type: _ɵNgSelectMultipleOption,
	selectors: [["option"]],
	inputs: {
		ngValue: "ngValue",
		value: "value"
	},
	standalone: false
}));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(ɵNgSelectMultipleOption, [{
		type: Directive,
		args: [{
			selector: "option",
			standalone: false
		}]
	}], () => [
		{ type: ElementRef },
		{ type: Renderer2 },
		{
			type: SelectMultipleControlValueAccessor,
			decorators: [{ type: Optional }, { type: Host }]
		}
	], {
		ngValue: [{
			type: Input,
			args: ["ngValue"]
		}],
		value: [{
			type: Input,
			args: ["value"]
		}]
	});
})();
var SHARED_FORM_DIRECTIVES = [
	ɵNgNoValidate,
	NgSelectOption,
	ɵNgSelectMultipleOption,
	DefaultValueAccessor,
	NumberValueAccessor,
	RangeValueAccessor,
	CheckboxControlValueAccessor,
	SelectControlValueAccessor,
	SelectMultipleControlValueAccessor,
	RadioControlValueAccessor,
	NgControlStatus,
	NgControlStatusGroup,
	RequiredValidator,
	MinLengthValidator,
	MaxLengthValidator,
	PatternValidator,
	CheckboxRequiredValidator,
	EmailValidator,
	MinValidator,
	MaxValidator
];
var TEMPLATE_DRIVEN_DIRECTIVES = [
	NgModel,
	NgModelGroup,
	NgForm
];
var REACTIVE_DRIVEN_DIRECTIVES = [
	FormControlDirective,
	FormGroupDirective,
	FormArrayDirective,
	FormControlName,
	FormGroupName,
	FormArrayName
];
var ɵInternalFormsSharedModule = class {};
_ɵInternalFormsSharedModule = ɵInternalFormsSharedModule;
_defineProperty(ɵInternalFormsSharedModule, "ɵfac", function ɵInternalFormsSharedModule_Factory(__ngFactoryType__) {
	return new (__ngFactoryType__ || _ɵInternalFormsSharedModule)();
});
_defineProperty(ɵInternalFormsSharedModule, "ɵmod", /*@__PURE__*/ ɵɵdefineNgModule({
	type: _ɵInternalFormsSharedModule,
	declarations: [
		ɵNgNoValidate,
		NgSelectOption,
		ɵNgSelectMultipleOption,
		DefaultValueAccessor,
		NumberValueAccessor,
		RangeValueAccessor,
		CheckboxControlValueAccessor,
		SelectControlValueAccessor,
		SelectMultipleControlValueAccessor,
		RadioControlValueAccessor,
		NgControlStatus,
		NgControlStatusGroup,
		RequiredValidator,
		MinLengthValidator,
		MaxLengthValidator,
		PatternValidator,
		CheckboxRequiredValidator,
		EmailValidator,
		MinValidator,
		MaxValidator
	],
	exports: [
		ɵNgNoValidate,
		NgSelectOption,
		ɵNgSelectMultipleOption,
		DefaultValueAccessor,
		NumberValueAccessor,
		RangeValueAccessor,
		CheckboxControlValueAccessor,
		SelectControlValueAccessor,
		SelectMultipleControlValueAccessor,
		RadioControlValueAccessor,
		NgControlStatus,
		NgControlStatusGroup,
		RequiredValidator,
		MinLengthValidator,
		MaxLengthValidator,
		PatternValidator,
		CheckboxRequiredValidator,
		EmailValidator,
		MinValidator,
		MaxValidator
	]
}));
_defineProperty(ɵInternalFormsSharedModule, "ɵinj", /*@__PURE__*/ ɵɵdefineInjector({}));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(ɵInternalFormsSharedModule, [{
		type: NgModule,
		args: [{
			declarations: SHARED_FORM_DIRECTIVES,
			exports: SHARED_FORM_DIRECTIVES
		}]
	}], null, null);
})();
function isAbstractControlOptions(options) {
	return !!options && (options.asyncValidators !== void 0 || options.validators !== void 0 || options.updateOn !== void 0);
}
var FormBuilder = class FormBuilder {
	constructor() {
		_defineProperty(this, "useNonNullable", false);
	}
	get nonNullable() {
		const nnfb = new FormBuilder();
		nnfb.useNonNullable = true;
		return nnfb;
	}
	group(controls, options = null) {
		const reducedControls = this._reduceControls(controls);
		let newOptions = {};
		if (isAbstractControlOptions(options)) newOptions = options;
		else if (options !== null) {
			newOptions.validators = options.validator;
			newOptions.asyncValidators = options.asyncValidator;
		}
		return new FormGroup(reducedControls, newOptions);
	}
	record(controls, options = null) {
		return new FormRecord(this._reduceControls(controls), options);
	}
	control(formState, validatorOrOpts, asyncValidator) {
		let newOptions = {};
		if (!this.useNonNullable) return new FormControl(formState, validatorOrOpts, asyncValidator);
		if (isAbstractControlOptions(validatorOrOpts)) newOptions = validatorOrOpts;
		else {
			newOptions.validators = validatorOrOpts;
			newOptions.asyncValidators = asyncValidator;
		}
		return new FormControl(formState, _objectSpread2(_objectSpread2({}, newOptions), {}, { nonNullable: true }));
	}
	array(controls, validatorOrOpts, asyncValidator) {
		return new FormArray(controls.map((c) => this._createControl(c)), validatorOrOpts, asyncValidator);
	}
	_reduceControls(controls) {
		const createdControls = {};
		Object.keys(controls).forEach((controlName) => {
			createdControls[controlName] = this._createControl(controls[controlName]);
		});
		return createdControls;
	}
	_createControl(controls) {
		if (controls instanceof FormControl) return controls;
		else if (controls instanceof AbstractControl) return controls;
		else if (Array.isArray(controls)) {
			const value = controls[0];
			const validator = controls.length > 1 ? controls[1] : null;
			const asyncValidator = controls.length > 2 ? controls[2] : null;
			return this.control(value, validator, asyncValidator);
		} else return this.control(controls);
	}
};
_FormBuilder = FormBuilder;
_defineProperty(FormBuilder, "ɵfac", function FormBuilder_Factory(__ngFactoryType__) {
	return new (__ngFactoryType__ || _FormBuilder)();
});
_defineProperty(FormBuilder, "ɵprov", /*@__PURE__*/ ɵɵdefineService({
	token: _FormBuilder,
	factory: _FormBuilder.ɵfac
}));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(FormBuilder, [{ type: Service }], null, null);
})();
var NonNullableFormBuilder = class {};
_NonNullableFormBuilder = NonNullableFormBuilder;
_defineProperty(NonNullableFormBuilder, "ɵfac", function NonNullableFormBuilder_Factory(__ngFactoryType__) {
	return new (__ngFactoryType__ || _NonNullableFormBuilder)();
});
_defineProperty(NonNullableFormBuilder, "ɵprov", /*@__PURE__*/ ɵɵdefineService({
	token: _NonNullableFormBuilder,
	factory: () => {
		return (() => {
			return inject(FormBuilder).nonNullable;
		})();
	}
}));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(NonNullableFormBuilder, [{
		type: Service,
		args: [{ factory: () => inject(FormBuilder).nonNullable }]
	}], null, null);
})();
var UntypedFormBuilder = class extends FormBuilder {
	group(controlsConfig, options = null) {
		return super.group(controlsConfig, options);
	}
	control(formState, validatorOrOpts, asyncValidator) {
		return super.control(formState, validatorOrOpts, asyncValidator);
	}
	array(controlsConfig, validatorOrOpts, asyncValidator) {
		return super.array(controlsConfig, validatorOrOpts, asyncValidator);
	}
};
_UntypedFormBuilder = UntypedFormBuilder;
_defineProperty(UntypedFormBuilder, "ɵfac", function UntypedFormBuilder_Factory(__ngFactoryType__) {
	return new (__ngFactoryType__ || _UntypedFormBuilder)();
});
_defineProperty(UntypedFormBuilder, "ɵprov", /*@__PURE__*/ ɵɵdefineService({
	token: _UntypedFormBuilder,
	factory: _UntypedFormBuilder.ɵfac
}));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(UntypedFormBuilder, [{ type: Service }], null, null);
})();
var FormsModule = class FormsModule {
	static withConfig(opts) {
		var _opts$callSetDisabled;
		return {
			ngModule: FormsModule,
			providers: [{
				provide: CALL_SET_DISABLED_STATE,
				useValue: (_opts$callSetDisabled = opts.callSetDisabledState) !== null && _opts$callSetDisabled !== void 0 ? _opts$callSetDisabled : setDisabledStateDefault
			}]
		};
	}
};
_FormsModule = FormsModule;
_defineProperty(FormsModule, "ɵfac", function FormsModule_Factory(__ngFactoryType__) {
	return new (__ngFactoryType__ || _FormsModule)();
});
_defineProperty(FormsModule, "ɵmod", /*@__PURE__*/ ɵɵdefineNgModule({
	type: _FormsModule,
	declarations: [
		NgModel,
		NgModelGroup,
		NgForm
	],
	exports: [
		ɵInternalFormsSharedModule,
		NgModel,
		NgModelGroup,
		NgForm
	]
}));
_defineProperty(FormsModule, "ɵinj", /*@__PURE__*/ ɵɵdefineInjector({ imports: [ɵInternalFormsSharedModule] }));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(FormsModule, [{
		type: NgModule,
		args: [{
			declarations: TEMPLATE_DRIVEN_DIRECTIVES,
			exports: [ɵInternalFormsSharedModule, TEMPLATE_DRIVEN_DIRECTIVES]
		}]
	}], null, null);
})();
var ReactiveFormsModule = class ReactiveFormsModule {
	static withConfig(opts) {
		var _opts$warnOnNgModelWi, _opts$callSetDisabled2;
		return {
			ngModule: ReactiveFormsModule,
			providers: [{
				provide: NG_MODEL_WITH_FORM_CONTROL_WARNING,
				useValue: (_opts$warnOnNgModelWi = opts.warnOnNgModelWithFormControl) !== null && _opts$warnOnNgModelWi !== void 0 ? _opts$warnOnNgModelWi : "always"
			}, {
				provide: CALL_SET_DISABLED_STATE,
				useValue: (_opts$callSetDisabled2 = opts.callSetDisabledState) !== null && _opts$callSetDisabled2 !== void 0 ? _opts$callSetDisabled2 : setDisabledStateDefault
			}]
		};
	}
};
_ReactiveFormsModule = ReactiveFormsModule;
_defineProperty(ReactiveFormsModule, "ɵfac", function ReactiveFormsModule_Factory(__ngFactoryType__) {
	return new (__ngFactoryType__ || _ReactiveFormsModule)();
});
_defineProperty(ReactiveFormsModule, "ɵmod", /*@__PURE__*/ ɵɵdefineNgModule({
	type: _ReactiveFormsModule,
	declarations: [
		FormControlDirective,
		FormGroupDirective,
		FormArrayDirective,
		FormControlName,
		FormGroupName,
		FormArrayName
	],
	exports: [
		ɵInternalFormsSharedModule,
		FormControlDirective,
		FormGroupDirective,
		FormArrayDirective,
		FormControlName,
		FormGroupName,
		FormArrayName
	]
}));
_defineProperty(ReactiveFormsModule, "ɵinj", /*@__PURE__*/ ɵɵdefineInjector({ imports: [ɵInternalFormsSharedModule] }));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(ReactiveFormsModule, [{
		type: NgModule,
		args: [{
			declarations: [REACTIVE_DRIVEN_DIRECTIVES],
			exports: [ɵInternalFormsSharedModule, REACTIVE_DRIVEN_DIRECTIVES]
		}]
	}], null, null);
})();
//#endregion
export { AbstractControl, AbstractControlDirective, AbstractFormDirective, AbstractFormGroupDirective, COMPOSITION_BUFFER_MODE, CheckboxControlValueAccessor, CheckboxRequiredValidator, ControlContainer, ControlEvent, DefaultValueAccessor, EmailValidator, FormArray, FormArrayDirective, FormArrayName, FormBuilder, FormControl, FormControlDirective, FormControlName, FormGroup, FormGroupDirective, FormGroupName, FormRecord, FormResetEvent, FormSubmittedEvent, FormsModule, MaxLengthValidator, MaxValidator, MinLengthValidator, MinValidator, NG_ASYNC_VALIDATORS, NG_VALIDATORS, NG_VALUE_ACCESSOR, NgControl, NgControlStatus, NgControlStatusGroup, NgForm, NgModel, NgModelGroup, NgSelectOption, NonNullableFormBuilder, NumberValueAccessor, PatternValidator, PristineChangeEvent, RadioControlValueAccessor, RangeValueAccessor, ReactiveFormsModule, RequiredValidator, SelectControlValueAccessor, SelectMultipleControlValueAccessor, StatusChangeEvent, TouchedChangeEvent, UntypedFormArray, UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, VERSION, Validators, ValueChangeEvent, isFormArray, isFormControl, isFormGroup, isFormRecord, ɵFORM_CONTROL_INTEGRATION, ɵInternalFormsSharedModule, ɵNgNoValidate, ɵNgSelectMultipleOption, elementAcceptsMinMax as ɵelementAcceptsMinMax, isNativeFormElement as ɵisNativeFormElement, isTextualFormElement as ɵisTextualFormElement, selectValueAccessor as ɵselectValueAccessor, setNativeDomProperty as ɵsetNativeDomProperty };
