import { n as _defineProperty, t as _objectSpread2 } from "./objectSpread2-weooBxVk.js";
import { Bt as computed, Dl as signal, Fn as Injectable, In as Input, Ml as ɵɵdefineInjectable, Nl as ɵɵdefineInjector, O as booleanAttribute, Qo as ɵɵlistener, Sa as ɵɵclassMap, Wi as setClassMetadata, X as input, ao as ɵɵdefineNgModule, ca as ɵɵInheritDefinitionFeature, io as ɵɵdefineDirective, jc as InjectionToken, jo as ɵɵgetInheritedFactory, kn as HostListener, ol as effect, pl as inject, qn as NgModule, sa as ɵɵHostDirectivesFeature, ua as ɵɵProvidersFeature, wn as Directive, ya as ɵɵattribute } from "./core-C91JEChX.js";
import { N as NgControl } from "./forms-Bjuwkoys.js";
import { t as Bind } from "./openng-optimus-ui-bind-D2jYyy13.js";
import { s as a } from "./dist-CbKW6MfK.js";
import { a as BaseStyle } from "./openng-optimus-ui-config-BMpCoNuW.js";
import { n as PARENT_INSTANCE, t as BaseComponent } from "./openng-optimus-ui-basecomponent-BY4sBzp9.js";
import { t as Fluid } from "./openng-optimus-ui-fluid-Czy1s8rx.js";
//#region node_modules/@openng/optimus-ui/fesm2022/openng-optimus-ui-basemodelholder.mjs
var _BaseModelHolder;
var BaseModelHolder = class extends BaseComponent {
	constructor(..._args) {
		super(..._args);
		_defineProperty(this, "modelValue", signal(void 0, ...ngDevMode ? [{ debugName: "modelValue" }] : /* istanbul ignore next */ []));
		_defineProperty(this, "$filled", computed(() => a(this.modelValue()), ...ngDevMode ? [{ debugName: "$filled" }] : /* istanbul ignore next */ []));
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
//#region node_modules/@openng/optimus-ui-styles/dist/inputtext/index.mjs
var style$1 = `
    .p-inputtext {
        font-family: inherit;
        font-feature-settings: inherit;
        font-size: 1rem;
        color: dt('inputtext.color');
        background: dt('inputtext.background');
        padding-block: dt('inputtext.padding.y');
        padding-inline: dt('inputtext.padding.x');
        border: 1px solid dt('inputtext.border.color');
        transition:
            background dt('inputtext.transition.duration'),
            color dt('inputtext.transition.duration'),
            border-color dt('inputtext.transition.duration'),
            outline-color dt('inputtext.transition.duration'),
            box-shadow dt('inputtext.transition.duration');
        appearance: none;
        border-radius: dt('inputtext.border.radius');
        outline-color: transparent;
        box-shadow: dt('inputtext.shadow');
    }

    .p-inputtext:enabled:hover {
        border-color: dt('inputtext.hover.border.color');
    }

    .p-inputtext:enabled:focus {
        border-color: dt('inputtext.focus.border.color');
        box-shadow: dt('inputtext.focus.ring.shadow');
        outline: dt('inputtext.focus.ring.width') dt('inputtext.focus.ring.style') dt('inputtext.focus.ring.color');
        outline-offset: dt('inputtext.focus.ring.offset');
    }

    .p-inputtext.p-invalid {
        border-color: dt('inputtext.invalid.border.color');
    }

    .p-inputtext.p-variant-filled {
        background: dt('inputtext.filled.background');
    }

    .p-inputtext.p-variant-filled:enabled:hover {
        background: dt('inputtext.filled.hover.background');
    }

    .p-inputtext.p-variant-filled:enabled:focus {
        background: dt('inputtext.filled.focus.background');
    }

    .p-inputtext:disabled {
        opacity: 1;
        background: dt('inputtext.disabled.background');
        color: dt('inputtext.disabled.color');
    }

    .p-inputtext::placeholder {
        color: dt('inputtext.placeholder.color');
    }

    .p-inputtext.p-invalid::placeholder {
        color: dt('inputtext.invalid.placeholder.color');
    }

    .p-inputtext-sm {
        font-size: dt('inputtext.sm.font.size');
        padding-block: dt('inputtext.sm.padding.y');
        padding-inline: dt('inputtext.sm.padding.x');
    }

    .p-inputtext-lg {
        font-size: dt('inputtext.lg.font.size');
        padding-block: dt('inputtext.lg.padding.y');
        padding-inline: dt('inputtext.lg.padding.x');
    }

    .p-inputtext-fluid {
        width: 100%;
    }
`;
//#endregion
//#region node_modules/@openng/optimus-ui/fesm2022/openng-optimus-ui-inputtext.mjs
var _InputTextStyle;
var _InputText;
var _InputTextModule;
var style = `
    ${style$1}

    /* For Optimus */
   .p-inputtext.ng-invalid.ng-dirty {
        border-color: dt('inputtext.invalid.border.color');
    }

    .p-inputtext.ng-invalid.ng-dirty::placeholder {
        color: dt('inputtext.invalid.placeholder.color');
    }
`;
var classes = { root: ({ instance }) => ["p-inputtext p-component", {
	"p-filled": instance.$filled(),
	"p-inputtext-sm": instance.pSize === "small",
	"p-inputtext-lg": instance.pSize === "large",
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
* [Live Demo](https://optimus.openng.org/inputtext/)
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
	constructor() {
		var _inject;
		super();
		_defineProperty(this, "componentName", "InputText");
		_defineProperty(this, "hostName", "");
		_defineProperty(
			this,
			/**
			* Used to pass attributes to DOM elements inside the InputText component.
			* @defaultValue undefined
			* @deprecated use pInputTextPT instead.
			* @group Props
			*/
			"ptInputText",
			input(...ngDevMode ? [void 0, { debugName: "ptInputText" }] : /* istanbul ignore next */ [])
		);
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
			void 0
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
		_defineProperty(this, "$variant", computed(() => this.variant() || this.config.inputStyle() || this.config.inputVariant(), ...ngDevMode ? [{ debugName: "$variant" }] : /* istanbul ignore next */ []));
		_defineProperty(this, "_componentStyle", inject(InputTextStyle));
		effect(() => {
			const pt = this.ptInputText() || this.pInputTextPT();
			pt && this.directivePT.set(pt);
		});
		effect(() => {
			this.pInputTextUnstyled() && this.directiveUnstyled.set(this.pInputTextUnstyled());
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
	get hasFluid() {
		var _this$fluid;
		return (_this$fluid = this.fluid()) !== null && _this$fluid !== void 0 ? _this$fluid : !!this.pcFluid;
	}
	get dataP() {
		return this.cn({
			invalid: this.invalid(),
			fluid: this.hasFluid,
			filled: this.$variant() === "filled",
			[this.pSize]: this.pSize
		});
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
			ɵɵattribute("data-p", ctx.dataP);
			ɵɵclassMap(ctx.cx("root"));
		}
	},
	inputs: {
		hostName: "hostName",
		ptInputText: [1, "ptInputText"],
		pInputTextPT: [1, "pInputTextPT"],
		pInputTextUnstyled: [1, "pInputTextUnstyled"],
		pSize: "pSize",
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
				"[attr.data-p]": "dataP"
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
		hostName: [{ type: Input }],
		ptInputText: [{
			type: Input,
			args: [{
				isSignal: true,
				alias: "ptInputText",
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
			args: ["pSize"]
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
		}],
		onInput: [{
			type: HostListener,
			args: ["input"]
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
