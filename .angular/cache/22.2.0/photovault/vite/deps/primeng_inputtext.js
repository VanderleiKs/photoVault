import { n as _defineProperty, t as _objectSpread2 } from "./objectSpread2-weooBxVk.js";
import { Bt as computed, Dl as signal, Fn as Injectable, In as Input, Ml as ɵɵdefineInjectable, Nl as ɵɵdefineInjector, O as booleanAttribute, Qo as ɵɵlistener, Sa as ɵɵclassMap, Wi as setClassMetadata, X as input, ao as ɵɵdefineNgModule, ca as ɵɵInheritDefinitionFeature, io as ɵɵdefineDirective, jc as InjectionToken, jo as ɵɵgetInheritedFactory, ol as effect, pl as inject, qn as NgModule, sa as ɵɵHostDirectivesFeature, ua as ɵɵProvidersFeature, wn as Directive, ya as ɵɵattribute } from "./core-C91JEChX.js";
import { N as NgControl } from "./forms-Bjuwkoys.js";
import { t as Bind } from "./primeng-bind-lNQcJjFS.js";
import { m as l } from "./dist-DWYgOqP_.js";
import { o as BaseStyle } from "./primeng-config-E0BbIPgU.js";
import { n as PARENT_INSTANCE, t as BaseComponent } from "./primeng-basecomponent-CBJdRorB.js";
import { t as Fluid } from "./primeng-fluid-CRw-L1Qu.js";
//#region node_modules/primeng/fesm2022/primeng-basemodelholder.mjs
var _BaseModelHolder;
var BaseModelHolder = class extends BaseComponent {
	constructor(..._args) {
		super(..._args);
		_defineProperty(this, "modelValue", signal(void 0, ...ngDevMode ? [{ debugName: "modelValue" }] : /* istanbul ignore next */ []));
		_defineProperty(this, "$filled", computed(() => l(this.modelValue()), ...ngDevMode ? [{ debugName: "$filled" }] : /* istanbul ignore next */ []));
	}
	writeModelValue(value) {
		this.modelValue.set(value);
	}
};
_BaseModelHolder = BaseModelHolder;
_defineProperty(BaseModelHolder, "ɵfac", /*@__PURE__*/ (() => {
	let ɵBaseModelHolder_BaseFactory = void 0;
	return function BaseModelHolder_Factory(__ngFactoryType__) {
		return (ɵBaseModelHolder_BaseFactory || (ɵBaseModelHolder_BaseFactory = ɵɵgetInheritedFactory(_BaseModelHolder)))(__ngFactoryType__ || _BaseModelHolder);
	};
})());
_defineProperty(BaseModelHolder, "ɵdir", /*@__PURE__*/ ɵɵdefineDirective({
	type: _BaseModelHolder,
	features: [ɵɵInheritDefinitionFeature]
}));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(BaseModelHolder, [{
		type: Directive,
		args: [{ standalone: true }]
	}], null, null);
})();
//#endregion
//#region node_modules/@primeuix/styles/dist/inputtext/index.mjs
var style = "\n    .p-inputtext {\n        font-weight: dt('inputtext.font.weight');\n        font-size: dt('inputtext.font.size');\n        color: dt('inputtext.color');\n        background: dt('inputtext.background');\n        padding-block: dt('inputtext.padding.y');\n        padding-inline: dt('inputtext.padding.x');\n        border: 1px solid dt('inputtext.border.color');\n        transition:\n            background dt('inputtext.transition.duration'),\n            color dt('inputtext.transition.duration'),\n            border-color dt('inputtext.transition.duration'),\n            outline-color dt('inputtext.transition.duration'),\n            box-shadow dt('inputtext.transition.duration');\n        appearance: none;\n        border-radius: dt('inputtext.border.radius');\n        outline-color: transparent;\n        box-shadow: dt('inputtext.shadow');\n    }\n\n    .p-inputtext:enabled:hover {\n        border-color: dt('inputtext.hover.border.color');\n    }\n\n    .p-inputtext:enabled:focus {\n        border-color: dt('inputtext.focus.border.color');\n        box-shadow: dt('inputtext.focus.ring.shadow');\n        outline: dt('inputtext.focus.ring.width') dt('inputtext.focus.ring.style') dt('inputtext.focus.ring.color');\n        outline-offset: dt('inputtext.focus.ring.offset');\n    }\n\n    .p-inputtext.p-invalid {\n        border-color: dt('inputtext.invalid.border.color');\n    }\n\n    .p-inputtext.p-variant-filled {\n        background: dt('inputtext.filled.background');\n    }\n\n    .p-inputtext.p-variant-filled:enabled:hover {\n        background: dt('inputtext.filled.hover.background');\n    }\n\n    .p-inputtext.p-variant-filled:enabled:focus {\n        background: dt('inputtext.filled.focus.background');\n    }\n\n    .p-inputtext:disabled {\n        opacity: 1;\n        background: dt('inputtext.disabled.background');\n        color: dt('inputtext.disabled.color');\n    }\n\n    .p-inputtext::placeholder {\n        color: dt('inputtext.placeholder.color');\n    }\n\n    .p-inputtext.p-invalid::placeholder {\n        color: dt('inputtext.invalid.placeholder.color');\n    }\n\n    .p-inputtext-sm {\n        font-size: dt('inputtext.sm.font.size');\n        padding-block: dt('inputtext.sm.padding.y');\n        padding-inline: dt('inputtext.sm.padding.x');\n    }\n\n    .p-inputtext-lg {\n        font-size: dt('inputtext.lg.font.size');\n        padding-block: dt('inputtext.lg.padding.y');\n        padding-inline: dt('inputtext.lg.padding.x');\n    }\n\n    .p-inputtext-fluid {\n        width: 100%;\n    }\n";
//#endregion
//#region node_modules/primeng/fesm2022/primeng-inputtext.mjs
var _InputTextStyle;
var _InputText;
var _InputTextModule;
var classes = { root: ({ instance }) => ["p-inputtext p-component", {
	"p-filled": instance.$filled(),
	"p-inputtext-sm": instance.pSize() === "small",
	"p-inputtext-lg": instance.pSize() === "large",
	"p-invalid": instance.invalid(),
	"p-variant-filled": instance.$variant() === "filled",
	"p-inputtext-fluid": instance.hasFluid
}] };
var InputTextStyle = class extends BaseStyle {
	constructor(..._args) {
		super(..._args);
		_defineProperty(this, "name", "inputtext");
		_defineProperty(this, "style", style);
		_defineProperty(this, "classes", classes);
	}
};
_InputTextStyle = InputTextStyle;
_defineProperty(InputTextStyle, "ɵfac", /*@__PURE__*/ (() => {
	let ɵInputTextStyle_BaseFactory = void 0;
	return function InputTextStyle_Factory(__ngFactoryType__) {
		return (ɵInputTextStyle_BaseFactory || (ɵInputTextStyle_BaseFactory = ɵɵgetInheritedFactory(_InputTextStyle)))(__ngFactoryType__ || _InputTextStyle);
	};
})());
_defineProperty(InputTextStyle, "ɵprov", /*@__PURE__*/ ɵɵdefineInjectable({
	token: _InputTextStyle,
	factory: _InputTextStyle.ɵfac
}));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(InputTextStyle, [{ type: Injectable }], null, null);
})();
/**
*
* InputText renders a text field to enter data.
*
* [Live Demo](https://www.primeng.org/inputtext/)
*
* @module inputtextstyle
*
*/
var InputTextClasses;
(function(InputTextClasses) {
	/**
	* The class of root element
	*/
	InputTextClasses["root"] = "p-inputtext";
})(InputTextClasses || (InputTextClasses = {}));
var INPUTTEXT_INSTANCE = new InjectionToken("INPUTTEXT_INSTANCE");
/**
* InputText directive is an extension to standard input element with theming.
* @group Components
*/
var InputText = class extends BaseModelHolder {
	get hasFluid() {
		var _this$fluid;
		return (_this$fluid = this.fluid()) !== null && _this$fluid !== void 0 ? _this$fluid : !!this.pcFluid;
	}
	constructor() {
		var _inject;
		super();
		_defineProperty(this, "componentName", "InputText");
		_defineProperty(this, "hostName", input("", ...ngDevMode ? [{ debugName: "hostName" }] : /* istanbul ignore next */ []));
		_defineProperty(
			this,
			/**
			* Used to pass attributes to DOM elements inside the InputText component.
			* @defaultValue undefined
			* @group Props
			*/
			"pInputTextPT",
			input(...ngDevMode ? [void 0, { debugName: "pInputTextPT" }] : /* istanbul ignore next */ [])
		);
		_defineProperty(
			this,
			/**
			* Indicates whether the component should be rendered without styles.
			* @defaultValue undefined
			* @group Props
			*/
			"pInputTextUnstyled",
			input(...ngDevMode ? [void 0, { debugName: "pInputTextUnstyled" }] : /* istanbul ignore next */ [])
		);
		_defineProperty(this, "bindDirectiveInstance", inject(Bind, { self: true }));
		_defineProperty(this, "$pcInputText", (_inject = inject(INPUTTEXT_INSTANCE, {
			optional: true,
			skipSelf: true
		})) !== null && _inject !== void 0 ? _inject : void 0);
		_defineProperty(this, "ngControl", inject(NgControl, {
			optional: true,
			self: true
		}));
		_defineProperty(this, "pcFluid", inject(Fluid, {
			optional: true,
			host: true,
			skipSelf: true
		}));
		_defineProperty(
			this,
			/**
			* Defines the size of the component.
			* @group Props
			*/
			"pSize",
			input(...ngDevMode ? [void 0, { debugName: "pSize" }] : /* istanbul ignore next */ [])
		);
		_defineProperty(
			this,
			/**
			* Specifies the input variant of the component.
			* @defaultValue undefined
			* @group Props
			*/
			"variant",
			input(...ngDevMode ? [void 0, { debugName: "variant" }] : /* istanbul ignore next */ [])
		);
		_defineProperty(
			this,
			/**
			* Spans 100% width of the container when enabled.
			* @defaultValue undefined
			* @group Props
			*/
			"fluid",
			input(void 0, _objectSpread2(_objectSpread2({}, ngDevMode ? { debugName: "fluid" } : /* istanbul ignore next */ {}), {}, { transform: booleanAttribute }))
		);
		_defineProperty(
			this,
			/**
			* When present, it specifies that the component should have invalid state style.
			* @defaultValue false
			* @group Props
			*/
			"invalid",
			input(void 0, _objectSpread2(_objectSpread2({}, ngDevMode ? { debugName: "invalid" } : /* istanbul ignore next */ {}), {}, { transform: booleanAttribute }))
		);
		_defineProperty(this, "$variant", computed(() => this.variant() || this.config.inputVariant() || void 0, ...ngDevMode ? [{ debugName: "$variant" }] : /* istanbul ignore next */ []));
		_defineProperty(this, "_componentStyle", inject(InputTextStyle));
		_defineProperty(this, "dataP", computed(() => this.cn({
			invalid: this.invalid(),
			fluid: this.hasFluid,
			filled: this.$variant() === "filled",
			[this.pSize()]: this.pSize()
		}), ...ngDevMode ? [{ debugName: "dataP" }] : /* istanbul ignore next */ []));
		effect(() => {
			const pt = this.pInputTextPT();
			if (pt) this.directivePT.set(pt);
		});
		effect(() => {
			if (this.pInputTextUnstyled()) this.directiveUnstyled.set(this.pInputTextUnstyled());
		});
	}
	onAfterViewInit() {
		var _this$ngControl$value, _this$ngControl;
		this.writeModelValue((_this$ngControl$value = (_this$ngControl = this.ngControl) === null || _this$ngControl === void 0 ? void 0 : _this$ngControl.value) !== null && _this$ngControl$value !== void 0 ? _this$ngControl$value : this.el.nativeElement.value);
		this.cd.detectChanges();
	}
	onAfterViewChecked() {
		this.bindDirectiveInstance.setAttrs(this.ptm("root"));
	}
	onDoCheck() {
		var _this$ngControl$value2, _this$ngControl2;
		this.writeModelValue((_this$ngControl$value2 = (_this$ngControl2 = this.ngControl) === null || _this$ngControl2 === void 0 ? void 0 : _this$ngControl2.value) !== null && _this$ngControl$value2 !== void 0 ? _this$ngControl$value2 : this.el.nativeElement.value);
	}
	onInput() {
		var _this$ngControl$value3, _this$ngControl3;
		this.writeModelValue((_this$ngControl$value3 = (_this$ngControl3 = this.ngControl) === null || _this$ngControl3 === void 0 ? void 0 : _this$ngControl3.value) !== null && _this$ngControl$value3 !== void 0 ? _this$ngControl$value3 : this.el.nativeElement.value);
	}
};
_InputText = InputText;
_defineProperty(InputText, "ɵfac", function InputText_Factory(__ngFactoryType__) {
	return new (__ngFactoryType__ || _InputText)();
});
_defineProperty(InputText, "ɵdir", /*@__PURE__*/ ɵɵdefineDirective({
	type: _InputText,
	selectors: [[
		"",
		"pInputText",
		""
	]],
	hostVars: 3,
	hostBindings: function InputText_HostBindings(rf, ctx) {
		if (rf & 1) ɵɵlistener("input", function InputText_input_HostBindingHandler() {
			return ctx.onInput();
		});
		if (rf & 2) {
			ɵɵattribute("data-p", ctx.dataP());
			ɵɵclassMap(ctx.cx("root"));
		}
	},
	inputs: {
		hostName: [1, "hostName"],
		pInputTextPT: [1, "pInputTextPT"],
		pInputTextUnstyled: [1, "pInputTextUnstyled"],
		pSize: [1, "pSize"],
		variant: [1, "variant"],
		fluid: [1, "fluid"],
		invalid: [1, "invalid"]
	},
	features: [
		ɵɵProvidersFeature([
			InputTextStyle,
			{
				provide: INPUTTEXT_INSTANCE,
				useExisting: _InputText
			},
			{
				provide: PARENT_INSTANCE,
				useExisting: _InputText
			}
		]),
		ɵɵHostDirectivesFeature([Bind]),
		ɵɵInheritDefinitionFeature
	]
}));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(InputText, [{
		type: Directive,
		args: [{
			selector: "[pInputText]",
			standalone: true,
			host: {
				"[class]": "cx('root')",
				"[attr.data-p]": "dataP()",
				"(input)": "onInput()"
			},
			providers: [
				InputTextStyle,
				{
					provide: INPUTTEXT_INSTANCE,
					useExisting: InputText
				},
				{
					provide: PARENT_INSTANCE,
					useExisting: InputText
				}
			],
			hostDirectives: [Bind]
		}]
	}], () => [], {
		hostName: [{
			type: Input,
			args: [{
				isSignal: true,
				alias: "hostName",
				required: false
			}]
		}],
		pInputTextPT: [{
			type: Input,
			args: [{
				isSignal: true,
				alias: "pInputTextPT",
				required: false
			}]
		}],
		pInputTextUnstyled: [{
			type: Input,
			args: [{
				isSignal: true,
				alias: "pInputTextUnstyled",
				required: false
			}]
		}],
		pSize: [{
			type: Input,
			args: [{
				isSignal: true,
				alias: "pSize",
				required: false
			}]
		}],
		variant: [{
			type: Input,
			args: [{
				isSignal: true,
				alias: "variant",
				required: false
			}]
		}],
		fluid: [{
			type: Input,
			args: [{
				isSignal: true,
				alias: "fluid",
				required: false
			}]
		}],
		invalid: [{
			type: Input,
			args: [{
				isSignal: true,
				alias: "invalid",
				required: false
			}]
		}]
	});
})();
var InputTextModule = class {};
_InputTextModule = InputTextModule;
_defineProperty(InputTextModule, "ɵfac", function InputTextModule_Factory(__ngFactoryType__) {
	return new (__ngFactoryType__ || _InputTextModule)();
});
_defineProperty(InputTextModule, "ɵmod", /*@__PURE__*/ ɵɵdefineNgModule({
	type: _InputTextModule,
	imports: [InputText],
	exports: [InputText]
}));
_defineProperty(InputTextModule, "ɵinj", /*@__PURE__*/ ɵɵdefineInjector({}));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(InputTextModule, [{
		type: NgModule,
		args: [{
			imports: [InputText],
			exports: [InputText]
		}]
	}], null, null);
})();
//#endregion
export { InputText, InputTextClasses, InputTextModule, InputTextStyle };
