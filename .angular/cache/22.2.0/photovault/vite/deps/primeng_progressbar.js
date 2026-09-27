import { n as _defineProperty, t as _objectSpread2 } from "./objectSpread2-weooBxVk.js";
import { A as contentChild, Bt as computed, Co as ɵɵelementStart, Da as ɵɵconditionalCreate, Dr as ViewEncapsulation, Fn as Injectable, Hs as ɵɵstyleProp, In as Input, Ml as ɵɵdefineInjectable, Nl as ɵɵdefineInjector, O as booleanAttribute, Sa as ɵɵclassMap, So as ɵɵelementEnd, Ta as ɵɵconditional, Wi as setClassMetadata, X as input, Xs as ɵɵtextInterpolate2, an as ChangeDetectionStrategy, ao as ɵɵdefineNgModule, bs as ɵɵqueryAdvance, ca as ɵɵInheritDefinitionFeature, cn as Component, da as ɵɵadvance, es as ɵɵnextContext, i as ContentChild, jc as InjectionToken, jo as ɵɵgetInheritedFactory, ka as ɵɵcontentQuerySignal, ls as ɵɵproperty, pl as inject, qn as NgModule, qs as ɵɵtext, ro as ɵɵdefineComponent, rt as numberAttribute, sa as ɵɵHostDirectivesFeature, ua as ɵɵProvidersFeature, vo as ɵɵelement, ya as ɵɵattribute, yo as ɵɵelementContainer } from "./core-C91JEChX.js";
import "./common-C2OsAfsp.js";
import { r as NgTemplateOutlet } from "./_common_module-chunk-BJJFMmtK.js";
import { t as Bind } from "./primeng-bind-lNQcJjFS.js";
import { o as BaseStyle } from "./primeng-config-E0BbIPgU.js";
import { n as PARENT_INSTANCE, t as BaseComponent } from "./primeng-basecomponent-CBJdRorB.js";
import { SharedModule } from "./primeng_api.js";
//#region node_modules/@primeuix/styles/dist/progressbar/index.mjs
var style = "\n    .p-progressbar {\n        display: block;\n        position: relative;\n        overflow: hidden;\n        height: dt('progressbar.height');\n        background: dt('progressbar.background');\n        border-radius: dt('progressbar.border.radius');\n    }\n\n    .p-progressbar-value {\n        margin: 0;\n        background: dt('progressbar.value.background');\n    }\n\n    .p-progressbar-label {\n        color: dt('progressbar.label.color');\n        font-size: dt('progressbar.label.font.size');\n        font-weight: dt('progressbar.label.font.weight');\n    }\n\n    .p-progressbar-determinate .p-progressbar-value {\n        height: 100%;\n        width: 0%;\n        position: absolute;\n        display: none;\n        display: flex;\n        align-items: center;\n        justify-content: center;\n        overflow: hidden;\n        transition: width 1s ease-in-out;\n    }\n\n    .p-progressbar-determinate .p-progressbar-label {\n        display: inline-flex;\n    }\n\n    .p-progressbar-indeterminate .p-progressbar-value::before {\n        content: '';\n        position: absolute;\n        background: inherit;\n        inset-block-start: 0;\n        inset-inline-start: 0;\n        inset-block-end: 0;\n        will-change: inset-inline-start, inset-inline-end;\n        animation: p-progressbar-indeterminate-anim 2.1s cubic-bezier(0.65, 0.815, 0.735, 0.395) infinite;\n    }\n\n    .p-progressbar-indeterminate .p-progressbar-value::after {\n        content: '';\n        position: absolute;\n        background: inherit;\n        inset-block-start: 0;\n        inset-inline-start: 0;\n        inset-block-end: 0;\n        will-change: inset-inline-start, inset-inline-end;\n        animation: p-progressbar-indeterminate-anim-short 2.1s cubic-bezier(0.165, 0.84, 0.44, 1) infinite;\n        animation-delay: 1.15s;\n    }\n\n    @keyframes p-progressbar-indeterminate-anim {\n        0% {\n            inset-inline-start: -35%;\n            inset-inline-end: 100%;\n        }\n        60% {\n            inset-inline-start: 100%;\n            inset-inline-end: -90%;\n        }\n        100% {\n            inset-inline-start: 100%;\n            inset-inline-end: -90%;\n        }\n    }\n    @-webkit-keyframes p-progressbar-indeterminate-anim {\n        0% {\n            inset-inline-start: -35%;\n            inset-inline-end: 100%;\n        }\n        60% {\n            inset-inline-start: 100%;\n            inset-inline-end: -90%;\n        }\n        100% {\n            inset-inline-start: 100%;\n            inset-inline-end: -90%;\n        }\n    }\n\n    @keyframes p-progressbar-indeterminate-anim-short {\n        0% {\n            inset-inline-start: -200%;\n            inset-inline-end: 100%;\n        }\n        60% {\n            inset-inline-start: 107%;\n            inset-inline-end: -8%;\n        }\n        100% {\n            inset-inline-start: 107%;\n            inset-inline-end: -8%;\n        }\n    }\n    @-webkit-keyframes p-progressbar-indeterminate-anim-short {\n        0% {\n            inset-inline-start: -200%;\n            inset-inline-end: 100%;\n        }\n        60% {\n            inset-inline-start: 107%;\n            inset-inline-end: -8%;\n        }\n        100% {\n            inset-inline-start: 107%;\n            inset-inline-end: -8%;\n        }\n    }\n";
//#endregion
//#region node_modules/primeng/fesm2022/primeng-progressbar.mjs
var _ProgressBarStyle;
var _ProgressBar;
var _ProgressBarModule;
var classes = {
	root: ({ instance }) => {
		const mode = instance.mode();
		return ["p-progressbar p-component", {
			"p-progressbar-determinate": mode === "determinate",
			"p-progressbar-indeterminate": mode === "indeterminate"
		}];
	},
	value: "p-progressbar-value",
	label: "p-progressbar-label"
};
var ProgressBarStyle = class extends BaseStyle {
	constructor(..._args) {
		super(..._args);
		_defineProperty(this, "name", "progressbar");
		_defineProperty(this, "style", style);
		_defineProperty(this, "classes", classes);
	}
};
_ProgressBarStyle = ProgressBarStyle;
_defineProperty(ProgressBarStyle, "ɵfac", /*@__PURE__*/ (() => {
	let ɵProgressBarStyle_BaseFactory = void 0;
	return function ProgressBarStyle_Factory(__ngFactoryType__) {
		return (ɵProgressBarStyle_BaseFactory || (ɵProgressBarStyle_BaseFactory = ɵɵgetInheritedFactory(_ProgressBarStyle)))(__ngFactoryType__ || _ProgressBarStyle);
	};
})());
_defineProperty(ProgressBarStyle, "ɵprov", /*@__PURE__*/ ɵɵdefineInjectable({
	token: _ProgressBarStyle,
	factory: _ProgressBarStyle.ɵfac
}));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(ProgressBarStyle, [{ type: Injectable }], null, null);
})();
/**
*
* ProgressBar is a process status indicator.
*
* [Live Demo](https://www.primeng.org/progressbar)
*
* @module progressbarstyle
*
*/
var ProgressBarClasses;
(function(ProgressBarClasses) {
	/**
	* Class name of the root element
	*/
	ProgressBarClasses["root"] = "p-progressbar";
	/**
	* Class name of the value element
	*/
	ProgressBarClasses["value"] = "p-progressbar-value";
	/**
	* Class name of the label element
	*/
	ProgressBarClasses["label"] = "p-progressbar-label";
})(ProgressBarClasses || (ProgressBarClasses = {}));
var PROGRESSBAR_INSTANCE = new InjectionToken("PROGRESSBAR_INSTANCE");
/**
* ProgressBar is a process status indicator.
* @group Components
*/
var ProgressBar = class extends BaseComponent {
	constructor(..._args2) {
		var _inject;
		super(..._args2);
		_defineProperty(this, "componentName", "ProgressBar");
		_defineProperty(this, "$pcProgressBar", (_inject = inject(PROGRESSBAR_INSTANCE, {
			optional: true,
			skipSelf: true
		})) !== null && _inject !== void 0 ? _inject : void 0);
		_defineProperty(this, "bindDirectiveInstance", inject(Bind, { self: true }));
		_defineProperty(
			this,
			/**
			* Current value of the progress.
			* @group Props
			*/
			"value",
			input(void 0, _objectSpread2(_objectSpread2({}, ngDevMode ? { debugName: "value" } : /* istanbul ignore next */ {}), {}, { transform: numberAttribute }))
		);
		_defineProperty(
			this,
			/**
			* Whether to display the progress bar value.
			* @group Props
			*/
			"showValue",
			input(true, _objectSpread2(_objectSpread2({}, ngDevMode ? { debugName: "showValue" } : /* istanbul ignore next */ {}), {}, { transform: booleanAttribute }))
		);
		_defineProperty(
			this,
			/**
			* Style class of the value element.
			* @group Props
			*/
			"valueStyleClass",
			input(...ngDevMode ? [void 0, { debugName: "valueStyleClass" }] : /* istanbul ignore next */ [])
		);
		_defineProperty(
			this,
			/**
			* Unit sign appended to the value.
			* @group Props
			*/
			"unit",
			input("%", ...ngDevMode ? [{ debugName: "unit" }] : /* istanbul ignore next */ [])
		);
		_defineProperty(
			this,
			/**
			* Defines the mode of the progress
			* @defaultValue 'determinate'
			* @group Props
			*/
			"mode",
			input("determinate", ...ngDevMode ? [{ debugName: "mode" }] : /* istanbul ignore next */ [])
		);
		_defineProperty(
			this,
			/**
			* Color for the background of the progress.
			* @group Props
			*/
			"color",
			input(...ngDevMode ? [void 0, { debugName: "color" }] : /* istanbul ignore next */ [])
		);
		_defineProperty(
			this,
			/**
			* Template of the content.
			* @param {ProgressBarContentTemplateContext} context - content context.
			* @see {@link ProgressBarContentTemplateContext}
			* @group Templates
			*/
			"contentTemplate",
			contentChild("content", _objectSpread2(_objectSpread2({}, ngDevMode ? { debugName: "contentTemplate" } : /* istanbul ignore next */ {}), {}, { descendants: false }))
		);
		_defineProperty(this, "_componentStyle", inject(ProgressBarStyle));
		_defineProperty(this, "dataP", computed(() => this.cn({
			determinate: this.mode() === "determinate",
			indeterminate: this.mode() === "indeterminate"
		}), ...ngDevMode ? [{ debugName: "dataP" }] : /* istanbul ignore next */ []));
		_defineProperty(this, "ariaLevel", computed(() => this.value() + this.unit(), ...ngDevMode ? [{ debugName: "ariaLevel" }] : /* istanbul ignore next */ []));
		_defineProperty(this, "contentTemplateContext", computed(() => ({ $implicit: this.value() }), ...ngDevMode ? [{ debugName: "contentTemplateContext" }] : /* istanbul ignore next */ []));
		_defineProperty(this, "showLabel", computed(() => this.showValue() && !this.contentTemplate(), ...ngDevMode ? [{ debugName: "showLabel" }] : /* istanbul ignore next */ []));
		_defineProperty(this, "labelDisplay", computed(() => this.value() != null && this.value() !== 0 ? "flex" : "none", ...ngDevMode ? [{ debugName: "labelDisplay" }] : /* istanbul ignore next */ []));
	}
	onAfterViewChecked() {
		this.bindDirectiveInstance.setAttrs(this.ptms(["host", "root"]));
	}
};
_ProgressBar = ProgressBar;
_defineProperty(ProgressBar, "ɵfac", /*@__PURE__*/ (() => {
	let ɵProgressBar_BaseFactory = void 0;
	return function ProgressBar_Factory(__ngFactoryType__) {
		return (ɵProgressBar_BaseFactory || (ɵProgressBar_BaseFactory = ɵɵgetInheritedFactory(_ProgressBar)))(__ngFactoryType__ || _ProgressBar);
	};
})());
_defineProperty(ProgressBar, "ɵcmp", (function() {
	const _c0 = ["content"];
	function ProgressBar_Conditional_0_Conditional_2_Template(rf, ctx) {
		if (rf & 1) {
			ɵɵelementStart(0, "div");
			ɵɵtext(1);
			ɵɵelementEnd();
		}
		if (rf & 2) {
			const ctx_r0 = ɵɵnextContext(2);
			ɵɵstyleProp("display", ctx_r0.labelDisplay());
			ɵɵadvance();
			ɵɵtextInterpolate2("", ctx_r0.value(), "", ctx_r0.unit());
		}
	}
	function ProgressBar_Conditional_0_Template(rf, ctx) {
		if (rf & 1) {
			ɵɵelementStart(0, "div", 2)(1, "div", 2);
			ɵɵconditionalCreate(2, ProgressBar_Conditional_0_Conditional_2_Template, 2, 4, "div", 3);
			ɵɵelementContainer(3, 4);
			ɵɵelementEnd()();
		}
		if (rf & 2) {
			const ctx_r0 = ɵɵnextContext();
			ɵɵclassMap(ctx_r0.cn(ctx_r0.cx("value"), ctx_r0.valueStyleClass()));
			ɵɵstyleProp("width", ctx_r0.value() + "%")("display", "flex")("background", ctx_r0.color());
			ɵɵproperty("pBind", ctx_r0.ptm("value"));
			ɵɵattribute("data-p", ctx_r0.dataP());
			ɵɵadvance();
			ɵɵclassMap(ctx_r0.cx("label"));
			ɵɵproperty("pBind", ctx_r0.ptm("label"));
			ɵɵattribute("data-p", ctx_r0.dataP());
			ɵɵadvance();
			ɵɵconditional(ctx_r0.showLabel() ? 2 : -1);
			ɵɵadvance();
			ɵɵproperty("ngTemplateOutlet", ctx_r0.contentTemplate())("ngTemplateOutletContext", ctx_r0.contentTemplateContext());
		}
	}
	function ProgressBar_Conditional_1_Template(rf, ctx) {
		if (rf & 1) ɵɵelement(0, "div", 2);
		if (rf & 2) {
			const ctx_r0 = ɵɵnextContext();
			ɵɵclassMap(ctx_r0.cn(ctx_r0.cx("value"), ctx_r0.valueStyleClass()));
			ɵɵstyleProp("background", ctx_r0.color());
			ɵɵproperty("pBind", ctx_r0.ptm("value"));
			ɵɵattribute("data-p", ctx_r0.dataP());
		}
	}
	return /*@__PURE__*/ ɵɵdefineComponent({
		type: _ProgressBar,
		selectors: [["p-progressbar"], ["p-progress-bar"]],
		contentQueries: function ProgressBar_ContentQueries(rf, ctx, dirIndex) {
			if (rf & 1) ɵɵcontentQuerySignal(dirIndex, ctx.contentTemplate, _c0, 4);
			if (rf & 2) ɵɵqueryAdvance();
		},
		hostAttrs: ["role", "progressbar"],
		hostVars: 7,
		hostBindings: function ProgressBar_HostBindings(rf, ctx) {
			if (rf & 2) {
				ɵɵattribute("aria-valuemin", 0)("aria-valuenow", ctx.value())("aria-valuemax", 100)("aria-level", ctx.ariaLevel())("data-p", ctx.dataP());
				ɵɵclassMap(ctx.cx("root"));
			}
		},
		inputs: {
			value: [1, "value"],
			showValue: [1, "showValue"],
			valueStyleClass: [1, "valueStyleClass"],
			unit: [1, "unit"],
			mode: [1, "mode"],
			color: [1, "color"]
		},
		features: [
			ɵɵProvidersFeature([
				ProgressBarStyle,
				{
					provide: PROGRESSBAR_INSTANCE,
					useExisting: _ProgressBar
				},
				{
					provide: PARENT_INSTANCE,
					useExisting: _ProgressBar
				}
			]),
			ɵɵHostDirectivesFeature([Bind]),
			ɵɵInheritDefinitionFeature
		],
		decls: 2,
		vars: 2,
		consts: [
			[
				3,
				"class",
				"pBind",
				"width",
				"display",
				"background"
			],
			[
				3,
				"class",
				"pBind",
				"background"
			],
			[3, "pBind"],
			[3, "display"],
			[
				3,
				"ngTemplateOutlet",
				"ngTemplateOutletContext"
			]
		],
		template: function ProgressBar_Template(rf, ctx) {
			if (rf & 1) {
				ɵɵconditionalCreate(0, ProgressBar_Conditional_0_Template, 4, 17, "div", 0);
				ɵɵconditionalCreate(1, ProgressBar_Conditional_1_Template, 1, 6, "div", 1);
			}
			if (rf & 2) {
				ɵɵconditional(ctx.mode() === "determinate" ? 0 : -1);
				ɵɵadvance();
				ɵɵconditional(ctx.mode() === "indeterminate" ? 1 : -1);
			}
		},
		dependencies: [
			NgTemplateOutlet,
			SharedModule,
			Bind
		],
		encapsulation: 2
	});
})());
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(ProgressBar, [{
		type: Component,
		args: [{
			selector: "p-progressbar, p-progress-bar",
			standalone: true,
			imports: [
				NgTemplateOutlet,
				SharedModule,
				Bind
			],
			template: `
        @if (mode() === 'determinate') {
            <div [class]="cn(cx('value'), valueStyleClass())" [pBind]="ptm('value')" [style.width]="value() + '%'" [style.display]="'flex'" [style.background]="color()" [attr.data-p]="dataP()">
                <div [class]="cx('label')" [pBind]="ptm('label')" [attr.data-p]="dataP()">
                    @if (showLabel()) {
                        <div [style.display]="labelDisplay()">{{ value() }}{{ unit() }}</div>
                    }
                    <ng-container [ngTemplateOutlet]="contentTemplate()!" [ngTemplateOutletContext]="contentTemplateContext()"></ng-container>
                </div>
            </div>
        }
        @if (mode() === 'indeterminate') {
            <div [class]="cn(cx('value'), valueStyleClass())" [pBind]="ptm('value')" [style.background]="color()" [attr.data-p]="dataP()"></div>
        }
    `,
			changeDetection: ChangeDetectionStrategy.OnPush,
			encapsulation: ViewEncapsulation.None,
			providers: [
				ProgressBarStyle,
				{
					provide: PROGRESSBAR_INSTANCE,
					useExisting: ProgressBar
				},
				{
					provide: PARENT_INSTANCE,
					useExisting: ProgressBar
				}
			],
			host: {
				role: "progressbar",
				"[attr.aria-valuemin]": "0",
				"[attr.aria-valuenow]": "value()",
				"[attr.aria-valuemax]": "100",
				"[attr.aria-level]": "ariaLevel()",
				"[class]": "cx('root')",
				"[attr.data-p]": "dataP()"
			},
			hostDirectives: [Bind]
		}]
	}], null, {
		value: [{
			type: Input,
			args: [{
				isSignal: true,
				alias: "value",
				required: false
			}]
		}],
		showValue: [{
			type: Input,
			args: [{
				isSignal: true,
				alias: "showValue",
				required: false
			}]
		}],
		valueStyleClass: [{
			type: Input,
			args: [{
				isSignal: true,
				alias: "valueStyleClass",
				required: false
			}]
		}],
		unit: [{
			type: Input,
			args: [{
				isSignal: true,
				alias: "unit",
				required: false
			}]
		}],
		mode: [{
			type: Input,
			args: [{
				isSignal: true,
				alias: "mode",
				required: false
			}]
		}],
		color: [{
			type: Input,
			args: [{
				isSignal: true,
				alias: "color",
				required: false
			}]
		}],
		contentTemplate: [{
			type: ContentChild,
			args: ["content", _objectSpread2(_objectSpread2({}, { descendants: false }), {}, { isSignal: true })]
		}]
	});
})();
var ProgressBarModule = class {};
_ProgressBarModule = ProgressBarModule;
_defineProperty(ProgressBarModule, "ɵfac", function ProgressBarModule_Factory(__ngFactoryType__) {
	return new (__ngFactoryType__ || _ProgressBarModule)();
});
_defineProperty(ProgressBarModule, "ɵmod", /*@__PURE__*/ ɵɵdefineNgModule({
	type: _ProgressBarModule,
	imports: [ProgressBar, SharedModule],
	exports: [ProgressBar, SharedModule]
}));
_defineProperty(ProgressBarModule, "ɵinj", /*@__PURE__*/ ɵɵdefineInjector({ imports: [
	ProgressBar,
	SharedModule,
	SharedModule
] }));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(ProgressBarModule, [{
		type: NgModule,
		args: [{
			imports: [ProgressBar, SharedModule],
			exports: [ProgressBar, SharedModule]
		}]
	}], null, null);
})();
//#endregion
export { ProgressBar, ProgressBarClasses, ProgressBarModule, ProgressBarStyle };
