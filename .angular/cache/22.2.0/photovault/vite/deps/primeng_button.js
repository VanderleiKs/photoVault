import { n as _defineProperty, t as _objectSpread2 } from "./objectSpread2-weooBxVk.js";
import { $n as Output, A as contentChild, Bl as ɵɵnamespaceSVG, Bt as computed, Ca as ɵɵclassProp, Co as ɵɵelementStart, Da as ɵɵconditionalCreate, Dl as signal, Dr as ViewEncapsulation, En as ElementRef, Fn as Injectable, Gs as ɵɵtemplate, Hs as ɵɵstyleProp, In as Input, Js as ɵɵtextInterpolate, Ml as ɵɵdefineInjectable, Nl as ɵɵdefineInjector, O as booleanAttribute, On as HostBinding, Qo as ɵɵlistener, Sa as ɵɵclassMap, So as ɵɵelementEnd, Ta as ɵɵconditional, Ts as ɵɵrepeaterCreate, Vs as ɵɵstyleMap, Wi as setClassMetadata, X as input, an as ChangeDetectionStrategy, ao as ɵɵdefineNgModule, at as output, bs as ɵɵqueryAdvance, ca as ɵɵInheritDefinitionFeature, cl as forwardRef, cn as Component, cs as ɵɵprojectionDef, da as ɵɵadvance, es as ɵɵnextContext, i as ContentChild, io as ɵɵdefineDirective, jc as InjectionToken, jo as ɵɵgetInheritedFactory, ka as ɵɵcontentQuerySignal, lo as ɵɵdomElement, ls as ɵɵproperty, ol as effect, pl as inject, qn as NgModule, qs as ɵɵtext, ro as ɵɵdefineComponent, rt as numberAttribute, sa as ɵɵHostDirectivesFeature, ss as ɵɵprojection, ua as ɵɵProvidersFeature, vo as ɵɵelement, wn as Directive, ws as ɵɵrepeater, ya as ɵɵattribute, yo as ɵɵelementContainer } from "./core-C91JEChX.js";
import { i as isPlatformBrowser } from "./common-C2OsAfsp.js";
import { r as NgTemplateOutlet } from "./_common_module-chunk-BJJFMmtK.js";
import { r as c, t as Bind } from "./primeng-bind-lNQcJjFS.js";
import { g as p, m as l } from "./dist-DWYgOqP_.js";
import { _ as st, d as Ft, f as L, g as le, h as k, m as W, o as BaseStyle, p as R, v as w, y as zt } from "./primeng-config-E0BbIPgU.js";
import { n as PARENT_INSTANCE, t as BaseComponent } from "./primeng-basecomponent-CBJdRorB.js";
import { SharedModule } from "./primeng_api.js";
import { t as Fluid } from "./primeng-fluid-CRw-L1Qu.js";
//#region node_modules/@primeuix/styles/dist/ripple/index.mjs
var style$4 = "\n    .p-ink {\n        display: block;\n        position: absolute;\n        background: dt('ripple.background');\n        border-radius: 100%;\n        transform: scale(0);\n        pointer-events: none;\n    }\n\n    .p-ink-active {\n        animation: ripple 0.4s linear;\n    }\n\n    @keyframes ripple {\n        100% {\n            opacity: 0;\n            transform: scale(2.5);\n        }\n    }\n";
//#endregion
//#region node_modules/primeng/fesm2022/primeng-ripple.mjs
var _RippleStyle;
var _Ripple;
var _RippleModule;
var style$3 = `
    ${style$4}

    /* For PrimeNG */
    .p-ripple {
        overflow: hidden;
        position: relative;
    }

    .p-ripple-disabled .p-ink {
        display: none !important;
    }

    @keyframes ripple {
        100% {
            opacity: 0;
            transform: scale(2.5);
        }
    }
`;
var classes$2 = { root: "p-ink" };
var RippleStyle = class extends BaseStyle {
	constructor(..._args) {
		super(..._args);
		_defineProperty(this, "name", "ripple");
		_defineProperty(this, "style", style$3);
		_defineProperty(this, "classes", classes$2);
	}
};
_RippleStyle = RippleStyle;
_defineProperty(RippleStyle, "ɵfac", /*@__PURE__*/ (() => {
	let ɵRippleStyle_BaseFactory = void 0;
	return function RippleStyle_Factory(__ngFactoryType__) {
		return (ɵRippleStyle_BaseFactory || (ɵRippleStyle_BaseFactory = ɵɵgetInheritedFactory(_RippleStyle)))(__ngFactoryType__ || _RippleStyle);
	};
})());
_defineProperty(RippleStyle, "ɵprov", /*@__PURE__*/ ɵɵdefineInjectable({
	token: _RippleStyle,
	factory: _RippleStyle.ɵfac
}));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(RippleStyle, [{ type: Injectable }], null, null);
})();
/**
*
* Ripple directive adds ripple effect to the host element.
*
* [Live Demo](https://www.primeng.org/ripple)
*
* @module ripplestyle
*
*/
var RippleClasses;
(function(RippleClasses) {
	/**
	* Class name of the root element
	*/
	RippleClasses["root"] = "p-ink";
})(RippleClasses || (RippleClasses = {}));
/**
* Ripple directive adds ripple effect to the host element.
* @group Components
*/
var Ripple = class extends BaseComponent {
	constructor() {
		super();
		_defineProperty(this, "componentName", "Ripple");
		_defineProperty(this, "_componentStyle", inject(RippleStyle));
		_defineProperty(this, "animationListener", void 0);
		_defineProperty(this, "mouseDownListener", void 0);
		_defineProperty(this, "timeout", void 0);
		effect(() => {
			if (isPlatformBrowser(this.platformId)) {
				if (this.config.ripple()) {
					this.create();
					this.mouseDownListener = this.renderer.listen(this.el.nativeElement, "mousedown", this.onMouseDown.bind(this));
				} else this.remove();
			}
		});
	}
	onMouseDown(event) {
		var _this$document$defaul;
		let ink = this.getInk();
		if (!ink || ((_this$document$defaul = this.document.defaultView) === null || _this$document$defaul === void 0 ? void 0 : _this$document$defaul.getComputedStyle(ink, null).display) === "none") return;
		if (!this.$unstyled()) W(ink, "p-ink-active");
		ink.setAttribute("data-p-ink-active", "false");
		if (!Ft(ink) && !zt(ink)) {
			let d = Math.max(L(this.el.nativeElement), k(this.el.nativeElement));
			ink.style.height = d + "px";
			ink.style.width = d + "px";
		}
		const offset = st(this.el.nativeElement);
		let x = event.pageX - offset.left + this.document.body.scrollTop - zt(ink) / 2;
		let y = event.pageY - offset.top + this.document.body.scrollLeft - Ft(ink) / 2;
		this.renderer.setStyle(ink, "top", y + "px");
		this.renderer.setStyle(ink, "left", x + "px");
		if (!this.$unstyled()) R(ink, "p-ink-active");
		ink.setAttribute("data-p-ink-active", "true");
		this.timeout = setTimeout(() => {
			let ink = this.getInk();
			if (ink) {
				if (!this.$unstyled()) W(ink, "p-ink-active");
				ink.setAttribute("data-p-ink-active", "false");
			}
		}, 401);
	}
	getInk() {
		const children = this.el.nativeElement.children;
		for (let i = 0; i < children.length; i++) if (typeof children[i].className === "string" && children[i].className.indexOf("p-ink") !== -1) return children[i];
		return null;
	}
	resetInk() {
		let ink = this.getInk();
		if (ink) {
			if (!this.$unstyled()) W(ink, "p-ink-active");
			ink.setAttribute("data-p-ink-active", "false");
		}
	}
	onAnimationEnd(event) {
		if (this.timeout) clearTimeout(this.timeout);
		if (!this.$unstyled()) W(event.currentTarget, "p-ink-active");
		event.currentTarget.setAttribute("data-p-ink-active", "false");
	}
	create() {
		let ink = this.renderer.createElement("span");
		this.renderer.addClass(ink, "p-ink");
		this.renderer.appendChild(this.el.nativeElement, ink);
		this.renderer.setAttribute(ink, "data-p-ink", "true");
		this.renderer.setAttribute(ink, "data-p-ink-active", "false");
		this.renderer.setAttribute(ink, "aria-hidden", "true");
		this.renderer.setAttribute(ink, "role", "presentation");
		if (!this.animationListener) this.animationListener = this.renderer.listen(ink, "animationend", this.onAnimationEnd.bind(this));
	}
	remove() {
		let ink = this.getInk();
		if (ink) {
			if (this.mouseDownListener) this.mouseDownListener();
			if (this.animationListener) this.animationListener();
			this.mouseDownListener = null;
			this.animationListener = null;
			le(ink);
		}
	}
	onDestroy() {
		if (this.config && this.config.ripple()) this.remove();
	}
};
_Ripple = Ripple;
_defineProperty(Ripple, "ɵfac", function Ripple_Factory(__ngFactoryType__) {
	return new (__ngFactoryType__ || _Ripple)();
});
_defineProperty(Ripple, "ɵdir", /*@__PURE__*/ ɵɵdefineDirective({
	type: _Ripple,
	selectors: [[
		"",
		"pRipple",
		""
	]],
	hostAttrs: [1, "p-ripple"],
	features: [ɵɵProvidersFeature([RippleStyle]), ɵɵInheritDefinitionFeature]
}));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(Ripple, [{
		type: Directive,
		args: [{
			selector: "[pRipple]",
			host: { class: "p-ripple" },
			standalone: true,
			providers: [RippleStyle]
		}]
	}], () => [], null);
})();
var RippleModule = class {};
_RippleModule = RippleModule;
_defineProperty(RippleModule, "ɵfac", function RippleModule_Factory(__ngFactoryType__) {
	return new (__ngFactoryType__ || _RippleModule)();
});
_defineProperty(RippleModule, "ɵmod", /*@__PURE__*/ ɵɵdefineNgModule({
	type: _RippleModule,
	imports: [Ripple],
	exports: [Ripple]
}));
_defineProperty(RippleModule, "ɵinj", /*@__PURE__*/ ɵɵdefineInjector({}));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(RippleModule, [{
		type: NgModule,
		args: [{
			imports: [Ripple],
			exports: [Ripple]
		}]
	}], null, null);
})();
//#endregion
//#region node_modules/@primeuix/styles/dist/button/index.mjs
var style$2 = "\n    .p-button {\n        display: inline-flex;\n        cursor: pointer;\n        user-select: none;\n        align-items: center;\n        justify-content: center;\n        overflow: hidden;\n        position: relative;\n        color: dt('button.primary.color');\n        background: dt('button.primary.background');\n        border: 1px solid dt('button.primary.border.color');\n        padding: dt('button.padding.y') dt('button.padding.x');\n        font-size: dt('button.font.size');\n        font-weight: dt('button.label.font.weight');\n        transition:\n            background dt('button.transition.duration'),\n            color dt('button.transition.duration'),\n            border-color dt('button.transition.duration'),\n            outline-color dt('button.transition.duration'),\n            box-shadow dt('button.transition.duration');\n        border-radius: dt('button.border.radius');\n        outline-color: transparent;\n        gap: dt('button.gap');\n    }\n\n    .p-button:disabled {\n        cursor: default;\n    }\n\n    .p-button-icon-right {\n        order: 1;\n    }\n\n    .p-button-icon-right:dir(rtl) {\n        order: -1;\n    }\n\n    .p-button:not(.p-button-vertical) .p-button-icon:not(.p-button-icon-right):dir(rtl) {\n        order: 1;\n    }\n\n    .p-button-icon-bottom {\n        order: 2;\n    }\n\n    .p-button-icon-only {\n        width: dt('button.icon.only.width');\n        padding-inline-start: 0;\n        padding-inline-end: 0;\n        gap: 0;\n    }\n\n    .p-button-icon-only.p-button-rounded {\n        border-radius: 50%;\n        height: dt('button.icon.only.width');\n    }\n\n    .p-button-icon-only .p-button-label {\n        visibility: hidden;\n        width: 0;\n    }\n\n    .p-button-icon-only::after {\n        content: \"\xA0\";\n        visibility: hidden;\n        width: 0;\n    }\n\n    .p-button-sm {\n        font-size: dt('button.sm.font.size');\n        padding: dt('button.sm.padding.y') dt('button.sm.padding.x');\n    }\n\n    .p-button-sm .p-button-icon {\n        font-size: dt('button.sm.font.size');\n    }\n\n    .p-button-sm.p-button-icon-only {\n        width: dt('button.sm.icon.only.width');\n    }\n\n    .p-button-sm.p-button-icon-only.p-button-rounded {\n        height: dt('button.sm.icon.only.width');\n    }\n\n    .p-button-lg {\n        font-size: dt('button.lg.font.size');\n        padding: dt('button.lg.padding.y') dt('button.lg.padding.x');\n    }\n\n    .p-button-lg .p-button-icon {\n        font-size: dt('button.lg.font.size');\n    }\n\n    .p-button-lg.p-button-icon-only {\n        width: dt('button.lg.icon.only.width');\n    }\n\n    .p-button-lg.p-button-icon-only.p-button-rounded {\n        height: dt('button.lg.icon.only.width');\n    }\n\n    .p-button-vertical {\n        flex-direction: column;\n    }\n\n    .p-button-label {\n        font-weight: dt('button.label.font.weight');\n    }\n\n    .p-button-fluid {\n        width: 100%;\n    }\n\n    .p-button-fluid.p-button-icon-only {\n        width: dt('button.icon.only.width');\n    }\n\n    .p-button:not(:disabled):hover {\n        background: dt('button.primary.hover.background');\n        border: 1px solid dt('button.primary.hover.border.color');\n        color: dt('button.primary.hover.color');\n    }\n\n    .p-button:not(:disabled):active {\n        background: dt('button.primary.active.background');\n        border: 1px solid dt('button.primary.active.border.color');\n        color: dt('button.primary.active.color');\n    }\n\n    .p-button:focus-visible {\n        box-shadow: dt('button.primary.focus.ring.shadow');\n        outline: dt('button.focus.ring.width') dt('button.focus.ring.style') dt('button.primary.focus.ring.color');\n        outline-offset: dt('button.focus.ring.offset');\n    }\n\n    .p-button .p-badge {\n        min-width: dt('button.badge.size');\n        height: dt('button.badge.size');\n        line-height: dt('button.badge.size');\n    }\n\n    .p-button-raised {\n        box-shadow: dt('button.raised.shadow');\n    }\n\n    .p-button-rounded {\n        border-radius: dt('button.rounded.border.radius');\n    }\n\n    .p-button-secondary {\n        background: dt('button.secondary.background');\n        border: 1px solid dt('button.secondary.border.color');\n        color: dt('button.secondary.color');\n    }\n\n    .p-button-secondary:not(:disabled):hover {\n        background: dt('button.secondary.hover.background');\n        border: 1px solid dt('button.secondary.hover.border.color');\n        color: dt('button.secondary.hover.color');\n    }\n\n    .p-button-secondary:not(:disabled):active {\n        background: dt('button.secondary.active.background');\n        border: 1px solid dt('button.secondary.active.border.color');\n        color: dt('button.secondary.active.color');\n    }\n\n    .p-button-secondary:focus-visible {\n        outline-color: dt('button.secondary.focus.ring.color');\n        box-shadow: dt('button.secondary.focus.ring.shadow');\n    }\n\n    .p-button-success {\n        background: dt('button.success.background');\n        border: 1px solid dt('button.success.border.color');\n        color: dt('button.success.color');\n    }\n\n    .p-button-success:not(:disabled):hover {\n        background: dt('button.success.hover.background');\n        border: 1px solid dt('button.success.hover.border.color');\n        color: dt('button.success.hover.color');\n    }\n\n    .p-button-success:not(:disabled):active {\n        background: dt('button.success.active.background');\n        border: 1px solid dt('button.success.active.border.color');\n        color: dt('button.success.active.color');\n    }\n\n    .p-button-success:focus-visible {\n        outline-color: dt('button.success.focus.ring.color');\n        box-shadow: dt('button.success.focus.ring.shadow');\n    }\n\n    .p-button-info {\n        background: dt('button.info.background');\n        border: 1px solid dt('button.info.border.color');\n        color: dt('button.info.color');\n    }\n\n    .p-button-info:not(:disabled):hover {\n        background: dt('button.info.hover.background');\n        border: 1px solid dt('button.info.hover.border.color');\n        color: dt('button.info.hover.color');\n    }\n\n    .p-button-info:not(:disabled):active {\n        background: dt('button.info.active.background');\n        border: 1px solid dt('button.info.active.border.color');\n        color: dt('button.info.active.color');\n    }\n\n    .p-button-info:focus-visible {\n        outline-color: dt('button.info.focus.ring.color');\n        box-shadow: dt('button.info.focus.ring.shadow');\n    }\n\n    .p-button-warn {\n        background: dt('button.warn.background');\n        border: 1px solid dt('button.warn.border.color');\n        color: dt('button.warn.color');\n    }\n\n    .p-button-warn:not(:disabled):hover {\n        background: dt('button.warn.hover.background');\n        border: 1px solid dt('button.warn.hover.border.color');\n        color: dt('button.warn.hover.color');\n    }\n\n    .p-button-warn:not(:disabled):active {\n        background: dt('button.warn.active.background');\n        border: 1px solid dt('button.warn.active.border.color');\n        color: dt('button.warn.active.color');\n    }\n\n    .p-button-warn:focus-visible {\n        outline-color: dt('button.warn.focus.ring.color');\n        box-shadow: dt('button.warn.focus.ring.shadow');\n    }\n\n    .p-button-help {\n        background: dt('button.help.background');\n        border: 1px solid dt('button.help.border.color');\n        color: dt('button.help.color');\n    }\n\n    .p-button-help:not(:disabled):hover {\n        background: dt('button.help.hover.background');\n        border: 1px solid dt('button.help.hover.border.color');\n        color: dt('button.help.hover.color');\n    }\n\n    .p-button-help:not(:disabled):active {\n        background: dt('button.help.active.background');\n        border: 1px solid dt('button.help.active.border.color');\n        color: dt('button.help.active.color');\n    }\n\n    .p-button-help:focus-visible {\n        outline-color: dt('button.help.focus.ring.color');\n        box-shadow: dt('button.help.focus.ring.shadow');\n    }\n\n    .p-button-danger {\n        background: dt('button.danger.background');\n        border: 1px solid dt('button.danger.border.color');\n        color: dt('button.danger.color');\n    }\n\n    .p-button-danger:not(:disabled):hover {\n        background: dt('button.danger.hover.background');\n        border: 1px solid dt('button.danger.hover.border.color');\n        color: dt('button.danger.hover.color');\n    }\n\n    .p-button-danger:not(:disabled):active {\n        background: dt('button.danger.active.background');\n        border: 1px solid dt('button.danger.active.border.color');\n        color: dt('button.danger.active.color');\n    }\n\n    .p-button-danger:focus-visible {\n        outline-color: dt('button.danger.focus.ring.color');\n        box-shadow: dt('button.danger.focus.ring.shadow');\n    }\n\n    .p-button-contrast {\n        background: dt('button.contrast.background');\n        border: 1px solid dt('button.contrast.border.color');\n        color: dt('button.contrast.color');\n    }\n\n    .p-button-contrast:not(:disabled):hover {\n        background: dt('button.contrast.hover.background');\n        border: 1px solid dt('button.contrast.hover.border.color');\n        color: dt('button.contrast.hover.color');\n    }\n\n    .p-button-contrast:not(:disabled):active {\n        background: dt('button.contrast.active.background');\n        border: 1px solid dt('button.contrast.active.border.color');\n        color: dt('button.contrast.active.color');\n    }\n\n    .p-button-contrast:focus-visible {\n        outline-color: dt('button.contrast.focus.ring.color');\n        box-shadow: dt('button.contrast.focus.ring.shadow');\n    }\n\n    .p-button-outlined {\n        background: transparent;\n        border-color: dt('button.outlined.primary.border.color');\n        color: dt('button.outlined.primary.color');\n    }\n\n    .p-button-outlined:not(:disabled):hover {\n        background: dt('button.outlined.primary.hover.background');\n        border-color: dt('button.outlined.primary.border.color');\n        color: dt('button.outlined.primary.color');\n    }\n\n    .p-button-outlined:not(:disabled):active {\n        background: dt('button.outlined.primary.active.background');\n        border-color: dt('button.outlined.primary.border.color');\n        color: dt('button.outlined.primary.color');\n    }\n\n    .p-button-outlined.p-button-secondary {\n        border-color: dt('button.outlined.secondary.border.color');\n        color: dt('button.outlined.secondary.color');\n    }\n\n    .p-button-outlined.p-button-secondary:not(:disabled):hover {\n        background: dt('button.outlined.secondary.hover.background');\n        border-color: dt('button.outlined.secondary.border.color');\n        color: dt('button.outlined.secondary.color');\n    }\n\n    .p-button-outlined.p-button-secondary:not(:disabled):active {\n        background: dt('button.outlined.secondary.active.background');\n        border-color: dt('button.outlined.secondary.border.color');\n        color: dt('button.outlined.secondary.color');\n    }\n\n    .p-button-outlined.p-button-success {\n        border-color: dt('button.outlined.success.border.color');\n        color: dt('button.outlined.success.color');\n    }\n\n    .p-button-outlined.p-button-success:not(:disabled):hover {\n        background: dt('button.outlined.success.hover.background');\n        border-color: dt('button.outlined.success.border.color');\n        color: dt('button.outlined.success.color');\n    }\n\n    .p-button-outlined.p-button-success:not(:disabled):active {\n        background: dt('button.outlined.success.active.background');\n        border-color: dt('button.outlined.success.border.color');\n        color: dt('button.outlined.success.color');\n    }\n\n    .p-button-outlined.p-button-info {\n        border-color: dt('button.outlined.info.border.color');\n        color: dt('button.outlined.info.color');\n    }\n\n    .p-button-outlined.p-button-info:not(:disabled):hover {\n        background: dt('button.outlined.info.hover.background');\n        border-color: dt('button.outlined.info.border.color');\n        color: dt('button.outlined.info.color');\n    }\n\n    .p-button-outlined.p-button-info:not(:disabled):active {\n        background: dt('button.outlined.info.active.background');\n        border-color: dt('button.outlined.info.border.color');\n        color: dt('button.outlined.info.color');\n    }\n\n    .p-button-outlined.p-button-warn {\n        border-color: dt('button.outlined.warn.border.color');\n        color: dt('button.outlined.warn.color');\n    }\n\n    .p-button-outlined.p-button-warn:not(:disabled):hover {\n        background: dt('button.outlined.warn.hover.background');\n        border-color: dt('button.outlined.warn.border.color');\n        color: dt('button.outlined.warn.color');\n    }\n\n    .p-button-outlined.p-button-warn:not(:disabled):active {\n        background: dt('button.outlined.warn.active.background');\n        border-color: dt('button.outlined.warn.border.color');\n        color: dt('button.outlined.warn.color');\n    }\n\n    .p-button-outlined.p-button-help {\n        border-color: dt('button.outlined.help.border.color');\n        color: dt('button.outlined.help.color');\n    }\n\n    .p-button-outlined.p-button-help:not(:disabled):hover {\n        background: dt('button.outlined.help.hover.background');\n        border-color: dt('button.outlined.help.border.color');\n        color: dt('button.outlined.help.color');\n    }\n\n    .p-button-outlined.p-button-help:not(:disabled):active {\n        background: dt('button.outlined.help.active.background');\n        border-color: dt('button.outlined.help.border.color');\n        color: dt('button.outlined.help.color');\n    }\n\n    .p-button-outlined.p-button-danger {\n        border-color: dt('button.outlined.danger.border.color');\n        color: dt('button.outlined.danger.color');\n    }\n\n    .p-button-outlined.p-button-danger:not(:disabled):hover {\n        background: dt('button.outlined.danger.hover.background');\n        border-color: dt('button.outlined.danger.border.color');\n        color: dt('button.outlined.danger.color');\n    }\n\n    .p-button-outlined.p-button-danger:not(:disabled):active {\n        background: dt('button.outlined.danger.active.background');\n        border-color: dt('button.outlined.danger.border.color');\n        color: dt('button.outlined.danger.color');\n    }\n\n    .p-button-outlined.p-button-contrast {\n        border-color: dt('button.outlined.contrast.border.color');\n        color: dt('button.outlined.contrast.color');\n    }\n\n    .p-button-outlined.p-button-contrast:not(:disabled):hover {\n        background: dt('button.outlined.contrast.hover.background');\n        border-color: dt('button.outlined.contrast.border.color');\n        color: dt('button.outlined.contrast.color');\n    }\n\n    .p-button-outlined.p-button-contrast:not(:disabled):active {\n        background: dt('button.outlined.contrast.active.background');\n        border-color: dt('button.outlined.contrast.border.color');\n        color: dt('button.outlined.contrast.color');\n    }\n\n    .p-button-outlined.p-button-plain {\n        border-color: dt('button.outlined.plain.border.color');\n        color: dt('button.outlined.plain.color');\n    }\n\n    .p-button-outlined.p-button-plain:not(:disabled):hover {\n        background: dt('button.outlined.plain.hover.background');\n        border-color: dt('button.outlined.plain.border.color');\n        color: dt('button.outlined.plain.color');\n    }\n\n    .p-button-outlined.p-button-plain:not(:disabled):active {\n        background: dt('button.outlined.plain.active.background');\n        border-color: dt('button.outlined.plain.border.color');\n        color: dt('button.outlined.plain.color');\n    }\n\n    .p-button-text {\n        background: transparent;\n        border-color: transparent;\n        color: dt('button.text.primary.color');\n    }\n\n    .p-button-text:not(:disabled):hover {\n        background: dt('button.text.primary.hover.background');\n        border-color: transparent;\n        color: dt('button.text.primary.color');\n    }\n\n    .p-button-text:not(:disabled):active {\n        background: dt('button.text.primary.active.background');\n        border-color: transparent;\n        color: dt('button.text.primary.color');\n    }\n\n    .p-button-text.p-button-secondary {\n        background: transparent;\n        border-color: transparent;\n        color: dt('button.text.secondary.color');\n    }\n\n    .p-button-text.p-button-secondary:not(:disabled):hover {\n        background: dt('button.text.secondary.hover.background');\n        border-color: transparent;\n        color: dt('button.text.secondary.color');\n    }\n\n    .p-button-text.p-button-secondary:not(:disabled):active {\n        background: dt('button.text.secondary.active.background');\n        border-color: transparent;\n        color: dt('button.text.secondary.color');\n    }\n\n    .p-button-text.p-button-success {\n        background: transparent;\n        border-color: transparent;\n        color: dt('button.text.success.color');\n    }\n\n    .p-button-text.p-button-success:not(:disabled):hover {\n        background: dt('button.text.success.hover.background');\n        border-color: transparent;\n        color: dt('button.text.success.color');\n    }\n\n    .p-button-text.p-button-success:not(:disabled):active {\n        background: dt('button.text.success.active.background');\n        border-color: transparent;\n        color: dt('button.text.success.color');\n    }\n\n    .p-button-text.p-button-info {\n        background: transparent;\n        border-color: transparent;\n        color: dt('button.text.info.color');\n    }\n\n    .p-button-text.p-button-info:not(:disabled):hover {\n        background: dt('button.text.info.hover.background');\n        border-color: transparent;\n        color: dt('button.text.info.color');\n    }\n\n    .p-button-text.p-button-info:not(:disabled):active {\n        background: dt('button.text.info.active.background');\n        border-color: transparent;\n        color: dt('button.text.info.color');\n    }\n\n    .p-button-text.p-button-warn {\n        background: transparent;\n        border-color: transparent;\n        color: dt('button.text.warn.color');\n    }\n\n    .p-button-text.p-button-warn:not(:disabled):hover {\n        background: dt('button.text.warn.hover.background');\n        border-color: transparent;\n        color: dt('button.text.warn.color');\n    }\n\n    .p-button-text.p-button-warn:not(:disabled):active {\n        background: dt('button.text.warn.active.background');\n        border-color: transparent;\n        color: dt('button.text.warn.color');\n    }\n\n    .p-button-text.p-button-help {\n        background: transparent;\n        border-color: transparent;\n        color: dt('button.text.help.color');\n    }\n\n    .p-button-text.p-button-help:not(:disabled):hover {\n        background: dt('button.text.help.hover.background');\n        border-color: transparent;\n        color: dt('button.text.help.color');\n    }\n\n    .p-button-text.p-button-help:not(:disabled):active {\n        background: dt('button.text.help.active.background');\n        border-color: transparent;\n        color: dt('button.text.help.color');\n    }\n\n    .p-button-text.p-button-danger {\n        background: transparent;\n        border-color: transparent;\n        color: dt('button.text.danger.color');\n    }\n\n    .p-button-text.p-button-danger:not(:disabled):hover {\n        background: dt('button.text.danger.hover.background');\n        border-color: transparent;\n        color: dt('button.text.danger.color');\n    }\n\n    .p-button-text.p-button-danger:not(:disabled):active {\n        background: dt('button.text.danger.active.background');\n        border-color: transparent;\n        color: dt('button.text.danger.color');\n    }\n\n    .p-button-text.p-button-contrast {\n        background: transparent;\n        border-color: transparent;\n        color: dt('button.text.contrast.color');\n    }\n\n    .p-button-text.p-button-contrast:not(:disabled):hover {\n        background: dt('button.text.contrast.hover.background');\n        border-color: transparent;\n        color: dt('button.text.contrast.color');\n    }\n\n    .p-button-text.p-button-contrast:not(:disabled):active {\n        background: dt('button.text.contrast.active.background');\n        border-color: transparent;\n        color: dt('button.text.contrast.color');\n    }\n\n    .p-button-text.p-button-plain {\n        background: transparent;\n        border-color: transparent;\n        color: dt('button.text.plain.color');\n    }\n\n    .p-button-text.p-button-plain:not(:disabled):hover {\n        background: dt('button.text.plain.hover.background');\n        border-color: transparent;\n        color: dt('button.text.plain.color');\n    }\n\n    .p-button-text.p-button-plain:not(:disabled):active {\n        background: dt('button.text.plain.active.background');\n        border-color: transparent;\n        color: dt('button.text.plain.color');\n    }\n\n    .p-button-link {\n        background: transparent;\n        border-color: transparent;\n        color: dt('button.link.color');\n    }\n\n    .p-button-link:not(:disabled):hover {\n        background: transparent;\n        border-color: transparent;\n        color: dt('button.link.hover.color');\n    }\n\n    .p-button-link:not(:disabled):hover .p-button-label {\n        text-decoration: underline;\n    }\n\n    .p-button-link:not(:disabled):active {\n        background: transparent;\n        border-color: transparent;\n        color: dt('button.link.active.color');\n    }\n";
//#endregion
//#region node_modules/@primeicons/core/dist/esm/utils.mjs
function a(n) {
	if (!(n == null || n === "")) return typeof n == "number" || /^\d+(\.\d+)?$/.test(n) ? `${n}px` : `${n}`;
}
//#endregion
//#region node_modules/@primeicons/angular/fesm2022/primeicons-angular-core.mjs
var _CoreIcon;
var ICON_TEMPLATE = `
        @for (node of iconNodes(); track node[1]['key'] || $index) {
            @switch (node[0]) {
                @case ('path') {
                    <svg:path
                        [attr.d]="node[1]['d']"
                        [attr.fill]="node[1]['fill']"
                        [attr.fill-opacity]="node[1]['fillOpacity']"
                        [attr.fill-rule]="node[1]['fillRule']"
                        [attr.clip-rule]="node[1]['clipRule']"
                        [attr.stroke]="node[1]['stroke']"
                        [attr.stroke-width]="node[1]['strokeWidth']"
                        [attr.stroke-opacity]="node[1]['strokeOpacity']"
                        [attr.opacity]="node[1]['opacity']"
                    />
                }
                @case ('circle') {
                    <svg:circle
                        [attr.cx]="node[1]['cx']"
                        [attr.cy]="node[1]['cy']"
                        [attr.r]="node[1]['r']"
                        [attr.fill]="node[1]['fill']"
                        [attr.fill-opacity]="node[1]['fillOpacity']"
                        [attr.opacity]="node[1]['opacity']"
                    />
                }
                @case ('rect') {
                    <svg:rect
                        [attr.x]="node[1]['x']"
                        [attr.y]="node[1]['y']"
                        [attr.width]="node[1]['width']"
                        [attr.height]="node[1]['height']"
                        [attr.rx]="node[1]['rx']"
                        [attr.ry]="node[1]['ry']"
                        [attr.fill]="node[1]['fill']"
                        [attr.fill-opacity]="node[1]['fillOpacity']"
                        [attr.opacity]="node[1]['opacity']"
                    />
                }
                @case ('line') {
                    <svg:line
                        [attr.x1]="node[1]['x1']"
                        [attr.y1]="node[1]['y1']"
                        [attr.x2]="node[1]['x2']"
                        [attr.y2]="node[1]['y2']"
                        [attr.stroke]="node[1]['stroke']"
                        [attr.stroke-opacity]="node[1]['strokeOpacity']"
                        [attr.opacity]="node[1]['opacity']"
                    />
                }
                @case ('polyline') {
                    <svg:polyline
                        [attr.points]="node[1]['points']"
                        [attr.fill]="node[1]['fill']"
                        [attr.fill-opacity]="node[1]['fillOpacity']"
                        [attr.opacity]="node[1]['opacity']"
                    />
                }
                @case ('polygon') {
                    <svg:polygon
                        [attr.points]="node[1]['points']"
                        [attr.fill]="node[1]['fill']"
                        [attr.fill-opacity]="node[1]['fillOpacity']"
                        [attr.opacity]="node[1]['opacity']"
                    />
                }
                @case ('ellipse') {
                    <svg:ellipse
                        [attr.cx]="node[1]['cx']"
                        [attr.cy]="node[1]['cy']"
                        [attr.rx]="node[1]['rx']"
                        [attr.ry]="node[1]['ry']"
                        [attr.fill]="node[1]['fill']"
                        [attr.fill-opacity]="node[1]['fillOpacity']"
                        [attr.opacity]="node[1]['opacity']"
                    />
                }
            }
        }
`;
var CoreIcon = class {
	constructor() {
		_defineProperty(this, "_iconSignal", signal(null, ...ngDevMode ? [{ debugName: "_iconSignal" }] : /* istanbul ignore next */ []));
		_defineProperty(this, "size", input(void 0, ...ngDevMode ? [{ debugName: "size" }] : /* istanbul ignore next */ []));
		_defineProperty(this, "color", input(void 0, ...ngDevMode ? [{ debugName: "color" }] : /* istanbul ignore next */ []));
		_defineProperty(this, "styleClass", input(void 0, ...ngDevMode ? [{ debugName: "styleClass" }] : /* istanbul ignore next */ []));
		_defineProperty(this, "spin", input(void 0, ...ngDevMode ? [{ debugName: "spin" }] : /* istanbul ignore next */ []));
		_defineProperty(this, "iconNodes", computed(() => {
			var _this$_iconSignal$nod, _this$_iconSignal;
			return (_this$_iconSignal$nod = (_this$_iconSignal = this._iconSignal()) === null || _this$_iconSignal === void 0 ? void 0 : _this$_iconSignal.nodes) !== null && _this$_iconSignal$nod !== void 0 ? _this$_iconSignal$nod : [];
		}, ...ngDevMode ? [{ debugName: "iconNodes" }] : /* istanbul ignore next */ []));
		_defineProperty(this, "computedSize", computed(() => {
			var _this$size;
			return (_this$size = this.size()) !== null && _this$size !== void 0 ? _this$size : 20;
		}, ...ngDevMode ? [{ debugName: "computedSize" }] : /* istanbul ignore next */ []));
		_defineProperty(this, "computedClass", computed(() => {
			const icon = this._iconSignal();
			return c("p-icon", (icon === null || icon === void 0 ? void 0 : icon.name) && `p-icon-${icon.name}`, this.spin() && "p-icon-spin", this.styleClass());
		}, ...ngDevMode ? [{ debugName: "computedClass" }] : /* istanbul ignore next */ []));
		_defineProperty(this, "hostAriaHidden", "true");
	}
	get _icon() {
		return this._iconSignal();
	}
	set _icon(value) {
		this._iconSignal.set(value);
	}
	get hostWidth() {
		return this.computedSize();
	}
	get hostHeight() {
		return this.computedSize();
	}
	get hostViewBox() {
		var _this$_iconSignal2;
		return (_this$_iconSignal2 = this._iconSignal()) === null || _this$_iconSignal2 === void 0 || (_this$_iconSignal2 = _this$_iconSignal2.svg) === null || _this$_iconSignal2 === void 0 ? void 0 : _this$_iconSignal2.viewBox;
	}
	get hostFill() {
		var _this$_iconSignal3;
		return (_this$_iconSignal3 = this._iconSignal()) === null || _this$_iconSignal3 === void 0 || (_this$_iconSignal3 = _this$_iconSignal3.svg) === null || _this$_iconSignal3 === void 0 ? void 0 : _this$_iconSignal3.fill;
	}
	get hostXmlns() {
		var _this$_iconSignal4;
		return (_this$_iconSignal4 = this._iconSignal()) === null || _this$_iconSignal4 === void 0 || (_this$_iconSignal4 = _this$_iconSignal4.svg) === null || _this$_iconSignal4 === void 0 ? void 0 : _this$_iconSignal4.xmlns;
	}
	get hostClass() {
		return this.computedClass();
	}
	get hostColor() {
		return this.color() || null;
	}
	get hostIconSize() {
		var _formatIconSize;
		return (_formatIconSize = a(this.size())) !== null && _formatIconSize !== void 0 ? _formatIconSize : null;
	}
};
_CoreIcon = CoreIcon;
_defineProperty(CoreIcon, "ɵfac", function CoreIcon_Factory(__ngFactoryType__) {
	return new (__ngFactoryType__ || _CoreIcon)();
});
_defineProperty(CoreIcon, "ɵdir", /*@__PURE__*/ ɵɵdefineDirective({
	type: _CoreIcon,
	hostVars: 12,
	hostBindings: function CoreIcon_HostBindings(rf, ctx) {
		if (rf & 2) {
			ɵɵattribute("width", ctx.hostWidth)("height", ctx.hostHeight)("viewBox", ctx.hostViewBox)("fill", ctx.hostFill)("xmlns", ctx.hostXmlns)("aria-hidden", ctx.hostAriaHidden);
			ɵɵclassMap(ctx.hostClass);
			ɵɵstyleProp("color", ctx.hostColor)("--%NS%px-icon-size", ctx.hostIconSize);
		}
	},
	inputs: {
		size: [1, "size"],
		color: [1, "color"],
		styleClass: [1, "styleClass"],
		spin: [1, "spin"]
	}
}));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(CoreIcon, [{ type: Directive }], null, {
		size: [{
			type: Input,
			args: [{
				isSignal: true,
				alias: "size",
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
		styleClass: [{
			type: Input,
			args: [{
				isSignal: true,
				alias: "styleClass",
				required: false
			}]
		}],
		spin: [{
			type: Input,
			args: [{
				isSignal: true,
				alias: "spin",
				required: false
			}]
		}],
		hostWidth: [{
			type: HostBinding,
			args: ["attr.width"]
		}],
		hostHeight: [{
			type: HostBinding,
			args: ["attr.height"]
		}],
		hostViewBox: [{
			type: HostBinding,
			args: ["attr.viewBox"]
		}],
		hostFill: [{
			type: HostBinding,
			args: ["attr.fill"]
		}],
		hostXmlns: [{
			type: HostBinding,
			args: ["attr.xmlns"]
		}],
		hostAriaHidden: [{
			type: HostBinding,
			args: ["attr.aria-hidden"]
		}],
		hostClass: [{
			type: HostBinding,
			args: ["class"]
		}],
		hostColor: [{
			type: HostBinding,
			args: ["style.color"]
		}],
		hostIconSize: [{
			type: HostBinding,
			args: ["style.--px-icon-size"]
		}]
	});
})();
//#endregion
//#region node_modules/@primeicons/core/dist/esm/icons/spinner.mjs
var e = {
	name: "spinner",
	meta: { tags: [
		"spinner",
		"loading",
		"process",
		"wait",
		"buffering"
	] },
	svg: {
		xmlns: "http://www.w3.org/2000/svg",
		width: 20,
		height: 20,
		viewBox: "0 0 20 20",
		fill: "none"
	},
	nodes: [["path", {
		d: "M1 10C1 5.02579 5.02579 1 10 1C12.3905 1 14.562 1.9393 16.1738 3.45312C16.4756 3.73669 16.4905 4.21178 16.207 4.51367C15.9235 4.81558 15.4484 4.83039 15.1465 4.54688C13.7983 3.2807 11.9895 2.5 10 2.5C5.85421 2.5 2.5 5.85421 2.5 10C2.5 14.1458 5.85421 17.5 10 17.5C14.1458 17.5 17.5 14.1458 17.5 10C17.5 9.58579 17.8358 9.25 18.25 9.25C18.6642 9.25 19 9.58579 19 10C19 14.9742 14.9742 19 10 19C5.02579 19 1 14.9742 1 10Z",
		fill: "currentColor",
		key: "p4wko0"
	}]]
};
//#endregion
//#region node_modules/@primeicons/angular/fesm2022/primeicons-angular-spinner.mjs
var _Spinner;
var Spinner = class extends CoreIcon {
	constructor() {
		super();
		this._icon = e;
	}
};
_Spinner = Spinner;
_defineProperty(Spinner, "ɵfac", function Spinner_Factory(__ngFactoryType__) {
	return new (__ngFactoryType__ || _Spinner)();
});
_defineProperty(Spinner, "ɵcmp", (function() {
	const _forTrack0 = ($index, $item) => $item[1]["key"] || $index;
	function Spinner_For_1_Case_0_Template(rf, ctx) {
		if (rf & 1) {
			ɵɵnamespaceSVG();
			ɵɵdomElement(0, "path");
		}
		if (rf & 2) {
			const node_r1 = ɵɵnextContext().$implicit;
			ɵɵattribute("d", node_r1[1]["d"])("fill", node_r1[1]["fill"])("fill-opacity", node_r1[1]["fillOpacity"])("fill-rule", node_r1[1]["fillRule"])("clip-rule", node_r1[1]["clipRule"])("stroke", node_r1[1]["stroke"])("stroke-width", node_r1[1]["strokeWidth"])("stroke-opacity", node_r1[1]["strokeOpacity"])("opacity", node_r1[1]["opacity"]);
		}
	}
	function Spinner_For_1_Case_1_Template(rf, ctx) {
		if (rf & 1) {
			ɵɵnamespaceSVG();
			ɵɵdomElement(0, "circle");
		}
		if (rf & 2) {
			const node_r1 = ɵɵnextContext().$implicit;
			ɵɵattribute("cx", node_r1[1]["cx"])("cy", node_r1[1]["cy"])("r", node_r1[1]["r"])("fill", node_r1[1]["fill"])("fill-opacity", node_r1[1]["fillOpacity"])("opacity", node_r1[1]["opacity"]);
		}
	}
	function Spinner_For_1_Case_2_Template(rf, ctx) {
		if (rf & 1) {
			ɵɵnamespaceSVG();
			ɵɵdomElement(0, "rect");
		}
		if (rf & 2) {
			const node_r1 = ɵɵnextContext().$implicit;
			ɵɵattribute("x", node_r1[1]["x"])("y", node_r1[1]["y"])("width", node_r1[1]["width"])("height", node_r1[1]["height"])("rx", node_r1[1]["rx"])("ry", node_r1[1]["ry"])("fill", node_r1[1]["fill"])("fill-opacity", node_r1[1]["fillOpacity"])("opacity", node_r1[1]["opacity"]);
		}
	}
	function Spinner_For_1_Case_3_Template(rf, ctx) {
		if (rf & 1) {
			ɵɵnamespaceSVG();
			ɵɵdomElement(0, "line");
		}
		if (rf & 2) {
			const node_r1 = ɵɵnextContext().$implicit;
			ɵɵattribute("x1", node_r1[1]["x1"])("y1", node_r1[1]["y1"])("x2", node_r1[1]["x2"])("y2", node_r1[1]["y2"])("stroke", node_r1[1]["stroke"])("stroke-opacity", node_r1[1]["strokeOpacity"])("opacity", node_r1[1]["opacity"]);
		}
	}
	function Spinner_For_1_Case_4_Template(rf, ctx) {
		if (rf & 1) {
			ɵɵnamespaceSVG();
			ɵɵdomElement(0, "polyline");
		}
		if (rf & 2) {
			const node_r1 = ɵɵnextContext().$implicit;
			ɵɵattribute("points", node_r1[1]["points"])("fill", node_r1[1]["fill"])("fill-opacity", node_r1[1]["fillOpacity"])("opacity", node_r1[1]["opacity"]);
		}
	}
	function Spinner_For_1_Case_5_Template(rf, ctx) {
		if (rf & 1) {
			ɵɵnamespaceSVG();
			ɵɵdomElement(0, "polygon");
		}
		if (rf & 2) {
			const node_r1 = ɵɵnextContext().$implicit;
			ɵɵattribute("points", node_r1[1]["points"])("fill", node_r1[1]["fill"])("fill-opacity", node_r1[1]["fillOpacity"])("opacity", node_r1[1]["opacity"]);
		}
	}
	function Spinner_For_1_Case_6_Template(rf, ctx) {
		if (rf & 1) {
			ɵɵnamespaceSVG();
			ɵɵdomElement(0, "ellipse");
		}
		if (rf & 2) {
			const node_r1 = ɵɵnextContext().$implicit;
			ɵɵattribute("cx", node_r1[1]["cx"])("cy", node_r1[1]["cy"])("rx", node_r1[1]["rx"])("ry", node_r1[1]["ry"])("fill", node_r1[1]["fill"])("fill-opacity", node_r1[1]["fillOpacity"])("opacity", node_r1[1]["opacity"]);
		}
	}
	function Spinner_For_1_Template(rf, ctx) {
		if (rf & 1) ɵɵconditionalCreate(0, Spinner_For_1_Case_0_Template, 1, 9, ":svg:path")(1, Spinner_For_1_Case_1_Template, 1, 6, ":svg:circle")(2, Spinner_For_1_Case_2_Template, 1, 9, ":svg:rect")(3, Spinner_For_1_Case_3_Template, 1, 7, ":svg:line")(4, Spinner_For_1_Case_4_Template, 1, 4, ":svg:polyline")(5, Spinner_For_1_Case_5_Template, 1, 4, ":svg:polygon")(6, Spinner_For_1_Case_6_Template, 1, 7, ":svg:ellipse");
		if (rf & 2) {
			let tmp_10_0 = void 0;
			const node_r1 = ctx.$implicit;
			ɵɵconditional((tmp_10_0 = node_r1[0]) === "path" ? 0 : tmp_10_0 === "circle" ? 1 : tmp_10_0 === "rect" ? 2 : tmp_10_0 === "line" ? 3 : tmp_10_0 === "polyline" ? 4 : tmp_10_0 === "polygon" ? 5 : tmp_10_0 === "ellipse" ? 6 : -1);
		}
	}
	return /*@__PURE__*/ ɵɵdefineComponent({
		type: _Spinner,
		selectors: [[
			"svg",
			"data-p-icon",
			"spinner"
		]],
		features: [ɵɵInheritDefinitionFeature],
		decls: 2,
		vars: 0,
		template: function Spinner_Template(rf, ctx) {
			if (rf & 1) ɵɵrepeaterCreate(0, Spinner_For_1_Template, 7, 1, null, null, _forTrack0);
			if (rf & 2) ɵɵrepeater(ctx.iconNodes());
		},
		encapsulation: 2,
		changeDetection: 1
	});
})());
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(Spinner, [{
		type: Component,
		args: [{
			selector: "svg[data-p-icon=\"spinner\"]",
			standalone: true,
			template: ICON_TEMPLATE
		}]
	}], () => [], null);
})();
//#endregion
//#region node_modules/primeng/fesm2022/primeng-dom.mjs
/**
* @dynamic is for runtime initializing DomHandler.browser
*
* If delete below comment, we can see this error message:
*  Metadata collected contains an error that will be reported at runtime:
*  Only initialized variables and constants can be referenced
*  because the value of this variable is needed by the template compiler.
*/
var DomHandler = class DomHandler {
	static addClass(element, className) {
		if (element && className) {
			if (element.classList) element.classList.add(className);
			else element.className += " " + className;
		}
	}
	static addMultipleClasses(element, className) {
		if (element && className) {
			if (element.classList) {
				let styles = className.trim().split(" ");
				for (let i = 0; i < styles.length; i++) element.classList.add(styles[i]);
			} else {
				let styles = className.split(" ");
				for (let i = 0; i < styles.length; i++) element.className += " " + styles[i];
			}
		}
	}
	static removeClass(element, className) {
		if (element && className) {
			if (element.classList) element.classList.remove(className);
			else element.className = element.className.replace(new RegExp("(^|\\b)" + className.split(" ").join("|") + "(\\b|$)", "gi"), " ");
		}
	}
	static removeMultipleClasses(element, classNames) {
		if (element && classNames) [classNames].flat().filter(Boolean).forEach((cNames) => cNames.split(" ").forEach((className) => this.removeClass(element, className)));
	}
	static hasClass(element, className) {
		if (element && className) {
			if (element.classList) return element.classList.contains(className);
			else return new RegExp("(^| )" + className + "( |$)", "gi").test(element.className);
		}
		return false;
	}
	static siblings(element) {
		return Array.prototype.filter.call(element.parentNode.children, function(child) {
			return child !== element;
		});
	}
	static find(element, selector) {
		return Array.from(element.querySelectorAll(selector));
	}
	static findSingle(element, selector) {
		return this.isElement(element) ? element.querySelector(selector) : null;
	}
	static index(element) {
		let children = element.parentNode.childNodes;
		let num = 0;
		for (let i = 0; i < children.length; i++) {
			if (children[i] == element) return num;
			if (children[i].nodeType == 1) num++;
		}
		return -1;
	}
	static indexWithinGroup(element, attributeName) {
		let children = element.parentNode ? element.parentNode.childNodes : [];
		let num = 0;
		for (let i = 0; i < children.length; i++) {
			if (children[i] == element) return num;
			if (children[i].attributes && children[i].attributes[attributeName] && children[i].nodeType == 1) num++;
		}
		return -1;
	}
	static appendOverlay(overlay, target, appendTo = "self") {
		if (appendTo !== "self" && overlay && target) this.appendChild(overlay, target);
	}
	static alignOverlay(overlay, target, appendTo = "self", calculateMinWidth = true) {
		if (overlay && target) {
			if (calculateMinWidth) overlay.style.minWidth = `${DomHandler.getOuterWidth(target)}px`;
			if (appendTo === "self") this.relativePosition(overlay, target);
			else this.absolutePosition(overlay, target);
		}
	}
	static relativePosition(element, target, gutter = true) {
		const getClosestRelativeElement = (el) => {
			if (!el) return;
			return getComputedStyle(el).getPropertyValue("position") === "relative" ? el : getClosestRelativeElement(el.parentElement);
		};
		const elementDimensions = element.offsetParent ? {
			width: element.offsetWidth,
			height: element.offsetHeight
		} : this.getHiddenElementDimensions(element);
		const targetHeight = target.offsetHeight;
		const targetOffset = target.getBoundingClientRect();
		const windowScrollTop = this.getWindowScrollTop();
		const windowScrollLeft = this.getWindowScrollLeft();
		const viewport = this.getViewport();
		const relativeElement = getClosestRelativeElement(element);
		const relativeElementOffset = (relativeElement === null || relativeElement === void 0 ? void 0 : relativeElement.getBoundingClientRect()) || {
			top: -1 * windowScrollTop,
			left: -1 * windowScrollLeft
		};
		let top, left, origin = "top";
		if (targetOffset.top + targetHeight + elementDimensions.height > viewport.height) {
			top = targetOffset.top - relativeElementOffset.top - elementDimensions.height;
			origin = "bottom";
			if (targetOffset.top + top < 0) top = -1 * targetOffset.top;
		} else {
			top = targetHeight + targetOffset.top - relativeElementOffset.top;
			origin = "top";
		}
		const horizontalOverflow = targetOffset.left + elementDimensions.width - viewport.width;
		const targetLeftOffsetInSpaceOfRelativeElement = targetOffset.left - relativeElementOffset.left;
		if (elementDimensions.width > viewport.width) left = (targetOffset.left - relativeElementOffset.left) * -1;
		else if (horizontalOverflow > 0) left = targetLeftOffsetInSpaceOfRelativeElement - horizontalOverflow;
		else left = targetOffset.left - relativeElementOffset.left;
		element.style.top = top + "px";
		element.style.left = left + "px";
		element.style.transformOrigin = origin;
		if (gutter) {
			var _getCSSVariableByRege;
			const gutterValue = (_getCSSVariableByRege = w(/-anchor-gutter$/)) === null || _getCSSVariableByRege === void 0 ? void 0 : _getCSSVariableByRege.value;
			element.style.marginTop = origin === "bottom" ? `calc(${gutterValue !== null && gutterValue !== void 0 ? gutterValue : "2px"} * -1)` : gutterValue !== null && gutterValue !== void 0 ? gutterValue : "";
		}
	}
	static absolutePosition(element, target, gutter = true) {
		const elementDimensions = element.offsetParent ? {
			width: element.offsetWidth,
			height: element.offsetHeight
		} : this.getHiddenElementDimensions(element);
		const elementOuterHeight = elementDimensions.height;
		const elementOuterWidth = elementDimensions.width;
		const targetOuterHeight = target.offsetHeight;
		const targetOuterWidth = target.offsetWidth;
		const targetOffset = target.getBoundingClientRect();
		const windowScrollTop = this.getWindowScrollTop();
		const windowScrollLeft = this.getWindowScrollLeft();
		const viewport = this.getViewport();
		let top, left;
		if (targetOffset.top + targetOuterHeight + elementOuterHeight > viewport.height) {
			top = targetOffset.top + windowScrollTop - elementOuterHeight;
			element.style.transformOrigin = "bottom";
			if (top < 0) top = windowScrollTop;
		} else {
			top = targetOuterHeight + targetOffset.top + windowScrollTop;
			element.style.transformOrigin = "top";
		}
		if (targetOffset.left + elementOuterWidth > viewport.width) left = Math.max(0, targetOffset.left + windowScrollLeft + targetOuterWidth - elementOuterWidth);
		else left = targetOffset.left + windowScrollLeft;
		element.style.top = top + "px";
		element.style.left = left + "px";
		if (gutter) element.style.marginTop = origin === "bottom" ? "calc(var(--p-anchor-gutter) * -1)" : "calc(var(--p-anchor-gutter))";
	}
	static getParents(element, parents = []) {
		const parent = element["parentNode"] instanceof ShadowRoot ? element["parentNode"].host : element["parentNode"];
		return parent == null ? parents : this.getParents(parent, parents.concat([parent]));
	}
	static getScrollableParents(element) {
		let scrollableParents = [];
		if (element) {
			let parents = this.getParents(element);
			const overflowRegex = /(auto|scroll)/;
			const overflowCheck = (node) => {
				let styleDeclaration = window["getComputedStyle"](node, null);
				return overflowRegex.test(styleDeclaration.getPropertyValue("overflow")) || overflowRegex.test(styleDeclaration.getPropertyValue("overflowX")) || overflowRegex.test(styleDeclaration.getPropertyValue("overflowY"));
			};
			for (let parent of parents) {
				let scrollSelectors = parent.nodeType === 1 && parent.dataset["scrollselectors"];
				if (scrollSelectors) {
					let selectors = scrollSelectors.split(",");
					for (let selector of selectors) {
						let el = this.findSingle(parent, selector);
						if (el && overflowCheck(el)) scrollableParents.push(el);
					}
				}
				if (parent.nodeType !== 9 && overflowCheck(parent)) scrollableParents.push(parent);
			}
		}
		return scrollableParents;
	}
	static getHiddenElementOuterHeight(element) {
		element.style.visibility = "hidden";
		element.style.display = "block";
		let elementHeight = element.offsetHeight;
		element.style.display = "none";
		element.style.visibility = "visible";
		return elementHeight;
	}
	static getHiddenElementOuterWidth(element) {
		element.style.visibility = "hidden";
		element.style.display = "block";
		let elementWidth = element.offsetWidth;
		element.style.display = "none";
		element.style.visibility = "visible";
		return elementWidth;
	}
	static getHiddenElementDimensions(element) {
		let dimensions = {};
		element.style.visibility = "hidden";
		element.style.display = "block";
		dimensions.width = element.offsetWidth;
		dimensions.height = element.offsetHeight;
		element.style.display = "none";
		element.style.visibility = "visible";
		return dimensions;
	}
	static scrollInView(container, item) {
		let borderTopValue = getComputedStyle(container).getPropertyValue("borderTopWidth");
		let borderTop = borderTopValue ? parseFloat(borderTopValue) : 0;
		let paddingTopValue = getComputedStyle(container).getPropertyValue("paddingTop");
		let paddingTop = paddingTopValue ? parseFloat(paddingTopValue) : 0;
		let containerRect = container.getBoundingClientRect();
		let offset = item.getBoundingClientRect().top + document.body.scrollTop - (containerRect.top + document.body.scrollTop) - borderTop - paddingTop;
		let scroll = container.scrollTop;
		let elementHeight = container.clientHeight;
		let itemHeight = this.getOuterHeight(item);
		if (offset < 0) container.scrollTop = scroll + offset;
		else if (offset + itemHeight > elementHeight) container.scrollTop = scroll + offset - elementHeight + itemHeight;
	}
	static fadeIn(element, duration) {
		element.style.opacity = 0;
		let last = +/* @__PURE__ */ new Date();
		let opacity = 0;
		let tick = function() {
			opacity = +element.style.opacity.replace(",", ".") + ((/* @__PURE__ */ new Date()).getTime() - last) / duration;
			element.style.opacity = opacity;
			last = +/* @__PURE__ */ new Date();
			if (+opacity < 1) {
				if (window.requestAnimationFrame) window.requestAnimationFrame(tick);
				else setTimeout(tick, 16);
			}
		};
		tick();
	}
	static fadeOut(element, ms) {
		let opacity = 1, interval = 50, gap = interval / ms;
		let fading = setInterval(() => {
			opacity = opacity - gap;
			if (opacity <= 0) {
				opacity = 0;
				clearInterval(fading);
			}
			element.style.opacity = opacity;
		}, interval);
	}
	static getWindowScrollTop() {
		let doc = document.documentElement;
		return (window.pageYOffset || doc.scrollTop) - (doc.clientTop || 0);
	}
	static getWindowScrollLeft() {
		let doc = document.documentElement;
		return (window.pageXOffset || doc.scrollLeft) - (doc.clientLeft || 0);
	}
	static matches(element, selector) {
		let p = Element.prototype;
		return (p["matches"] || p.webkitMatchesSelector || p["mozMatchesSelector"] || p["msMatchesSelector"] || function(s) {
			return [].indexOf.call(document.querySelectorAll(s), this) !== -1;
		}).call(element, selector);
	}
	static getOuterWidth(el, margin) {
		let width = el.offsetWidth;
		if (margin) {
			let style = getComputedStyle(el);
			width += parseFloat(style.marginLeft) + parseFloat(style.marginRight);
		}
		return width;
	}
	static getHorizontalPadding(el) {
		let style = getComputedStyle(el);
		return parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
	}
	static getHorizontalMargin(el) {
		let style = getComputedStyle(el);
		return parseFloat(style.marginLeft) + parseFloat(style.marginRight);
	}
	static innerWidth(el) {
		let width = el.offsetWidth;
		let style = getComputedStyle(el);
		width += parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
		return width;
	}
	static width(el) {
		let width = el.offsetWidth;
		let style = getComputedStyle(el);
		width -= parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
		return width;
	}
	static getInnerHeight(el) {
		let height = el.offsetHeight;
		let style = getComputedStyle(el);
		height += parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);
		return height;
	}
	static getOuterHeight(el, margin) {
		let height = el.offsetHeight;
		if (margin) {
			let style = getComputedStyle(el);
			height += parseFloat(style.marginTop) + parseFloat(style.marginBottom);
		}
		return height;
	}
	static getHeight(el) {
		let height = el.offsetHeight;
		let style = getComputedStyle(el);
		height -= parseFloat(style.paddingTop) + parseFloat(style.paddingBottom) + parseFloat(style.borderTopWidth) + parseFloat(style.borderBottomWidth);
		return height;
	}
	static getWidth(el) {
		let width = el.offsetWidth;
		let style = getComputedStyle(el);
		width -= parseFloat(style.paddingLeft) + parseFloat(style.paddingRight) + parseFloat(style.borderLeftWidth) + parseFloat(style.borderRightWidth);
		return width;
	}
	static getViewport() {
		let win = window, d = document, e = d.documentElement, g = d.getElementsByTagName("body")[0];
		return {
			width: win.innerWidth || e.clientWidth || g.clientWidth,
			height: win.innerHeight || e.clientHeight || g.clientHeight
		};
	}
	static getOffset(el) {
		let rect = el.getBoundingClientRect();
		return {
			top: rect.top + (window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0),
			left: rect.left + (window.pageXOffset || document.documentElement.scrollLeft || document.body.scrollLeft || 0)
		};
	}
	static replaceElementWith(element, replacementElement) {
		let parentNode = element.parentNode;
		if (!parentNode) throw `Can't replace element`;
		return parentNode.replaceChild(replacementElement, element);
	}
	static getUserAgent() {
		if (navigator && this.isClient()) return navigator.userAgent;
	}
	static isIE() {
		let ua = window.navigator.userAgent;
		if (ua.indexOf("MSIE ") > 0) return true;
		if (ua.indexOf("Trident/") > 0) return true;
		if (ua.indexOf("Edge/") > 0) return true;
		return false;
	}
	static isIOS() {
		return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window["MSStream"];
	}
	static isAndroid() {
		return /(android)/i.test(navigator.userAgent);
	}
	static isTouchDevice() {
		return "ontouchstart" in window || navigator.maxTouchPoints > 0;
	}
	static appendChild(element, target) {
		if (this.isElement(target)) target.appendChild(element);
		else if (target && target.el && target.el.nativeElement) target.el.nativeElement.appendChild(element);
		else throw "Cannot append " + target + " to " + element;
	}
	static removeChild(element, target) {
		if (this.isElement(target)) target.removeChild(element);
		else if (target.el && target.el.nativeElement) target.el.nativeElement.removeChild(element);
		else throw "Cannot remove " + element + " from " + target;
	}
	static removeElement(element) {
		var _element$parentNode;
		if (!("remove" in Element.prototype)) (_element$parentNode = element.parentNode) === null || _element$parentNode === void 0 || _element$parentNode.removeChild(element);
		else element.remove();
	}
	static isElement(obj) {
		return typeof HTMLElement === "object" ? obj instanceof HTMLElement : obj && typeof obj === "object" && obj !== null && obj.nodeType === 1 && typeof obj.nodeName === "string";
	}
	static calculateScrollbarWidth(el) {
		if (el) {
			let style = getComputedStyle(el);
			return el.offsetWidth - el.clientWidth - parseFloat(style.borderLeftWidth) - parseFloat(style.borderRightWidth);
		} else {
			if (this.calculatedScrollbarWidth !== null) return this.calculatedScrollbarWidth;
			let scrollDiv = document.createElement("div");
			scrollDiv.className = "p-scrollbar-measure";
			document.body.appendChild(scrollDiv);
			let scrollbarWidth = scrollDiv.offsetWidth - scrollDiv.clientWidth;
			document.body.removeChild(scrollDiv);
			this.calculatedScrollbarWidth = scrollbarWidth;
			return scrollbarWidth;
		}
	}
	static calculateScrollbarHeight() {
		if (this.calculatedScrollbarHeight !== null) return this.calculatedScrollbarHeight;
		let scrollDiv = document.createElement("div");
		scrollDiv.className = "p-scrollbar-measure";
		document.body.appendChild(scrollDiv);
		let scrollbarHeight = scrollDiv.offsetHeight - scrollDiv.clientHeight;
		document.body.removeChild(scrollDiv);
		this.calculatedScrollbarWidth = scrollbarHeight;
		return scrollbarHeight;
	}
	static invokeElementMethod(element, methodName, args) {
		element[methodName].apply(element, args);
	}
	static clearSelection() {
		if (window.getSelection && window.getSelection()) {
			var _window$getSelection, _window$getSelection3, _window$getSelection4, _window$getSelection5;
			if ((_window$getSelection = window.getSelection()) === null || _window$getSelection === void 0 ? void 0 : _window$getSelection.empty) {
				var _window$getSelection2;
				(_window$getSelection2 = window.getSelection()) === null || _window$getSelection2 === void 0 || _window$getSelection2.empty();
			} else if (((_window$getSelection3 = window.getSelection()) === null || _window$getSelection3 === void 0 ? void 0 : _window$getSelection3.removeAllRanges) && (((_window$getSelection4 = window.getSelection()) === null || _window$getSelection4 === void 0 ? void 0 : _window$getSelection4.rangeCount) || 0) > 0 && (((_window$getSelection5 = window.getSelection()) === null || _window$getSelection5 === void 0 || (_window$getSelection5 = _window$getSelection5.getRangeAt(0)) === null || _window$getSelection5 === void 0 || (_window$getSelection5 = _window$getSelection5.getClientRects()) === null || _window$getSelection5 === void 0 ? void 0 : _window$getSelection5.length) || 0) > 0) {
				var _window$getSelection6;
				(_window$getSelection6 = window.getSelection()) === null || _window$getSelection6 === void 0 || _window$getSelection6.removeAllRanges();
			}
		} else if (document["selection"] && document["selection"].empty) try {
			document["selection"].empty();
		} catch (_unused) {}
	}
	static getBrowser() {
		if (!this.browser) {
			let matched = this.resolveUserAgent();
			this.browser = {};
			if (matched.browser) {
				this.browser[matched.browser] = true;
				this.browser["version"] = matched.version;
			}
			if (this.browser["chrome"]) this.browser["webkit"] = true;
			else if (this.browser["webkit"]) this.browser["safari"] = true;
		}
		return this.browser;
	}
	static resolveUserAgent() {
		let ua = navigator.userAgent.toLowerCase();
		let match = /(chrome)[ /]([\w.]+)/.exec(ua) || /(webkit)[ /]([\w.]+)/.exec(ua) || /(opera)(?:.*version|)[ /]([\w.]+)/.exec(ua) || /(msie) ([\w.]+)/.exec(ua) || ua.indexOf("compatible") < 0 && /(mozilla)(?:.*? rv:([\w.]+)|)/.exec(ua) || [];
		return {
			browser: match[1] || "",
			version: match[2] || "0"
		};
	}
	static isInteger(value) {
		if (Number.isInteger) return Number.isInteger(value);
		else return typeof value === "number" && isFinite(value) && Math.floor(value) === value;
	}
	static isHidden(element) {
		return !element || element.offsetParent === null;
	}
	static isVisible(element) {
		return element && element.offsetParent != null;
	}
	static isExist(element) {
		return element !== null && typeof element !== "undefined" && element.nodeName && element.parentNode;
	}
	static focus(element, options) {
		if (element && document.activeElement !== element) element.focus(options);
	}
	static getFocusableSelectorString(selector = "") {
		return `button:not([tabindex = "-1"]):not([disabled]):not([style*="display:none"]):not([hidden])${selector},
        [href][clientHeight][clientWidth]:not([tabindex = "-1"]):not([disabled]):not([style*="display:none"]):not([hidden])${selector},
        input:not([tabindex = "-1"]):not([disabled]):not([style*="display:none"]):not([hidden])${selector},
        select:not([tabindex = "-1"]):not([disabled]):not([style*="display:none"]):not([hidden])${selector},
        textarea:not([tabindex = "-1"]):not([disabled]):not([style*="display:none"]):not([hidden])${selector},
        [tabIndex]:not([tabIndex = "-1"]):not([disabled]):not([style*="display:none"]):not([hidden])${selector},
        [contenteditable]:not([tabIndex = "-1"]):not([disabled]):not([style*="display:none"]):not([hidden])${selector},
        .p-inputtext:not([tabindex = "-1"]):not([disabled]):not([style*="display:none"]):not([hidden])${selector},
        .p-button:not([tabindex = "-1"]):not([disabled]):not([style*="display:none"]):not([hidden])${selector}`;
	}
	static getFocusableElements(element, selector = "") {
		let focusableElements = this.find(element, this.getFocusableSelectorString(selector));
		let visibleFocusableElements = [];
		for (let focusableElement of focusableElements) {
			const computedStyle = getComputedStyle(focusableElement);
			if (this.isVisible(focusableElement) && computedStyle.display != "none" && computedStyle.visibility != "hidden") visibleFocusableElements.push(focusableElement);
		}
		return visibleFocusableElements;
	}
	static getFocusableElement(element, selector = "") {
		let focusableElement = this.findSingle(element, this.getFocusableSelectorString(selector));
		if (focusableElement) {
			const computedStyle = getComputedStyle(focusableElement);
			if (this.isVisible(focusableElement) && computedStyle.display != "none" && computedStyle.visibility != "hidden") return focusableElement;
		}
		return null;
	}
	static getFirstFocusableElement(element, selector = "") {
		const focusableElements = this.getFocusableElements(element, selector);
		return focusableElements.length > 0 ? focusableElements[0] : null;
	}
	static getLastFocusableElement(element, selector) {
		const focusableElements = this.getFocusableElements(element, selector);
		return focusableElements.length > 0 ? focusableElements[focusableElements.length - 1] : null;
	}
	static getNextFocusableElement(element, reverse = false) {
		const focusableElements = DomHandler.getFocusableElements(element);
		let index = 0;
		if (focusableElements && focusableElements.length > 0) {
			const focusedIndex = focusableElements.indexOf(focusableElements[0].ownerDocument.activeElement);
			if (reverse) {
				if (focusedIndex == -1 || focusedIndex === 0) index = focusableElements.length - 1;
				else index = focusedIndex - 1;
			} else if (focusedIndex != -1 && focusedIndex !== focusableElements.length - 1) index = focusedIndex + 1;
		}
		return focusableElements[index];
	}
	static generateZIndex() {
		this.zindex = this.zindex || 999;
		return ++this.zindex;
	}
	static getSelection() {
		var _window$getSelection7, _document$getSelectio;
		if (window.getSelection) return (_window$getSelection7 = window.getSelection()) === null || _window$getSelection7 === void 0 ? void 0 : _window$getSelection7.toString();
		else if (document.getSelection) return (_document$getSelectio = document.getSelection()) === null || _document$getSelectio === void 0 ? void 0 : _document$getSelectio.toString();
		else if (document["selection"]) return document["selection"].createRange().text;
		return null;
	}
	static getTargetElement(target, el) {
		if (!target) return null;
		switch (target) {
			case "document": return document;
			case "window": return window;
			case "@next": return el === null || el === void 0 ? void 0 : el.nextElementSibling;
			case "@prev": return el === null || el === void 0 ? void 0 : el.previousElementSibling;
			case "@parent": return el === null || el === void 0 ? void 0 : el.parentElement;
			case "@grandparent":
				var _el$parentElement;
				return el === null || el === void 0 || (_el$parentElement = el.parentElement) === null || _el$parentElement === void 0 ? void 0 : _el$parentElement.parentElement;
			default: {
				const type = typeof target;
				if (type === "string") return document.querySelector(target);
				else if (type === "object" && Object.prototype.hasOwnProperty.call(target, "nativeElement")) return this.isExist(target.nativeElement) ? target.nativeElement : void 0;
				const isFunction = (obj) => !!(obj && obj.constructor && obj.call && obj.apply);
				const element = isFunction(target) ? target() : target;
				return element && element.nodeType === 9 || this.isExist(element) ? element : null;
			}
		}
	}
	static isClient() {
		return !!(typeof window !== "undefined" && window.document && window.document.createElement);
	}
	static getAttribute(element, name) {
		if (element) {
			const value = element.getAttribute(name);
			if (!isNaN(value)) return +value;
			if (value === "true" || value === "false") return value === "true";
			return value;
		}
	}
	static calculateBodyScrollbarWidth() {
		return window.innerWidth - document.documentElement.offsetWidth;
	}
	static blockBodyScroll(className = "p-overflow-hidden") {
		document.body.style.setProperty("--px-scrollbar-width", this.calculateBodyScrollbarWidth() + "px");
		this.addClass(document.body, className);
	}
	static unblockBodyScroll(className = "p-overflow-hidden") {
		document.body.style.removeProperty("--px-scrollbar-width");
		this.removeClass(document.body, className);
	}
	static createElement(type, attributes = {}, ...children) {
		if (type) {
			const element = document.createElement(type);
			this.setAttributes(element, attributes);
			element.append(...children);
			return element;
		}
	}
	static setAttribute(element, attribute = "", value) {
		if (this.isElement(element) && value !== null && value !== void 0) element.setAttribute(attribute, value);
	}
	static setAttributes(element, attributes = {}) {
		if (this.isElement(element)) {
			const computedStyles = (rule, value) => {
				var _element$$attrs, _element$$attrs2;
				const styles = (element === null || element === void 0 || (_element$$attrs = element.$attrs) === null || _element$$attrs === void 0 ? void 0 : _element$$attrs[rule]) ? [element === null || element === void 0 || (_element$$attrs2 = element.$attrs) === null || _element$$attrs2 === void 0 ? void 0 : _element$$attrs2[rule]] : [];
				return [value].flat().reduce((cv, v) => {
					if (v !== null && v !== void 0) {
						const type = typeof v;
						if (type === "string" || type === "number") cv.push(v);
						else if (type === "object") {
							const _cv = Array.isArray(v) ? computedStyles(rule, v) : Object.entries(v).map(([_k, _v]) => rule === "style" && (!!_v || _v === 0) ? `${_k.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase()}:${_v}` : _v ? _k : void 0);
							cv = _cv.length ? cv.concat(_cv.filter((c) => !!c)) : cv;
						}
					}
					return cv;
				}, styles);
			};
			Object.entries(attributes).forEach(([key, value]) => {
				if (value !== void 0 && value !== null) {
					const matchedEvent = key.match(/^on(.+)/);
					if (matchedEvent) element.addEventListener(matchedEvent[1].toLowerCase(), value);
					else if (key === "pBind") this.setAttributes(element, value);
					else {
						value = key === "class" ? [...new Set(computedStyles("class", value))].join(" ").trim() : key === "style" ? computedStyles("style", value).join(";").trim() : value;
						if (element.$attrs = element.$attrs || {}) element.$attrs[key] = value;
						element.setAttribute(key, value);
					}
				}
			});
		}
	}
	static isFocusableElement(element, selector = "") {
		return this.isElement(element) ? element.matches(`button:not([tabindex = "-1"]):not([disabled]):not([style*="display:none"]):not([hidden])${selector},
                [href][clientHeight][clientWidth]:not([tabindex = "-1"]):not([disabled]):not([style*="display:none"]):not([hidden])${selector},
                input:not([tabindex = "-1"]):not([disabled]):not([style*="display:none"]):not([hidden])${selector},
                select:not([tabindex = "-1"]):not([disabled]):not([style*="display:none"]):not([hidden])${selector},
                textarea:not([tabindex = "-1"]):not([disabled]):not([style*="display:none"]):not([hidden])${selector},
                [tabIndex]:not([tabIndex = "-1"]):not([disabled]):not([style*="display:none"]):not([hidden])${selector},
                [contenteditable]:not([tabIndex = "-1"]):not([disabled]):not([style*="display:none"]):not([hidden])${selector}`) : false;
	}
};
_defineProperty(DomHandler, "zindex", 1e3);
_defineProperty(DomHandler, "calculatedScrollbarWidth", null);
_defineProperty(DomHandler, "calculatedScrollbarHeight", null);
_defineProperty(DomHandler, "browser", void 0);
//#endregion
//#region node_modules/primeng/fesm2022/primeng-autofocus.mjs
var _AutoFocus;
var _AutoFocusModule;
/**
* AutoFocus manages focus on focusable element on load.
* @group Components
*/
var AutoFocus = class extends BaseComponent {
	constructor(..._args) {
		super(..._args);
		_defineProperty(
			this,
			/**
			* When present, it specifies that the component should automatically get focus on load.
			* @group Props
			*/
			"autofocus",
			input(false, _objectSpread2(_objectSpread2({}, ngDevMode ? { debugName: "autofocus" } : /* istanbul ignore next */ {}), {}, {
				alias: "pAutoFocus",
				transform: booleanAttribute
			}))
		);
		_defineProperty(this, "focused", false);
		_defineProperty(this, "host", inject(ElementRef));
	}
	onAfterContentChecked() {
		if (this.autofocus() === false) this.host.nativeElement.removeAttribute("autofocus");
		else this.host.nativeElement.setAttribute("autofocus", true);
		if (!this.focused) this.autoFocus();
	}
	onAfterViewChecked() {
		if (!this.focused) this.autoFocus();
	}
	autoFocus() {
		if (isPlatformBrowser(this.platformId) && this.autofocus()) setTimeout(() => {
			var _this$host;
			const focusableElements = DomHandler.getFocusableElements((_this$host = this.host) === null || _this$host === void 0 ? void 0 : _this$host.nativeElement);
			if (focusableElements.length === 0) this.host.nativeElement.focus();
			if (focusableElements.length > 0) focusableElements[0].focus();
			this.focused = true;
		});
	}
};
_AutoFocus = AutoFocus;
_defineProperty(AutoFocus, "ɵfac", /*@__PURE__*/ (() => {
	let ɵAutoFocus_BaseFactory = void 0;
	return function AutoFocus_Factory(__ngFactoryType__) {
		return (ɵAutoFocus_BaseFactory || (ɵAutoFocus_BaseFactory = ɵɵgetInheritedFactory(_AutoFocus)))(__ngFactoryType__ || _AutoFocus);
	};
})());
_defineProperty(AutoFocus, "ɵdir", /*@__PURE__*/ ɵɵdefineDirective({
	type: _AutoFocus,
	selectors: [[
		"",
		"pAutoFocus",
		""
	]],
	inputs: { autofocus: [
		1,
		"pAutoFocus",
		"autofocus"
	] },
	features: [ɵɵInheritDefinitionFeature]
}));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(AutoFocus, [{
		type: Directive,
		args: [{
			selector: "[pAutoFocus]",
			standalone: true
		}]
	}], null, { autofocus: [{
		type: Input,
		args: [{
			isSignal: true,
			alias: "pAutoFocus",
			required: false
		}]
	}] });
})();
var AutoFocusModule = class {};
_AutoFocusModule = AutoFocusModule;
_defineProperty(AutoFocusModule, "ɵfac", function AutoFocusModule_Factory(__ngFactoryType__) {
	return new (__ngFactoryType__ || _AutoFocusModule)();
});
_defineProperty(AutoFocusModule, "ɵmod", /*@__PURE__*/ ɵɵdefineNgModule({
	type: _AutoFocusModule,
	imports: [AutoFocus],
	exports: [AutoFocus]
}));
_defineProperty(AutoFocusModule, "ɵinj", /*@__PURE__*/ ɵɵdefineInjector({}));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(AutoFocusModule, [{
		type: NgModule,
		args: [{
			imports: [AutoFocus],
			exports: [AutoFocus]
		}]
	}], null, null);
})();
//#endregion
//#region node_modules/@primeuix/styles/dist/badge/index.mjs
var style$1 = "\n    .p-badge {\n        display: inline-flex;\n        border-radius: dt('badge.border.radius');\n        align-items: center;\n        justify-content: center;\n        padding: dt('badge.padding');\n        background: dt('badge.primary.background');\n        color: dt('badge.primary.color');\n        font-size: dt('badge.font.size');\n        font-weight: dt('badge.font.weight');\n        min-width: dt('badge.min.width');\n        height: dt('badge.height');\n    }\n\n    .p-badge-dot {\n        width: dt('badge.dot.size');\n        min-width: dt('badge.dot.size');\n        height: dt('badge.dot.size');\n        border-radius: 50%;\n        padding: 0;\n    }\n\n    .p-badge-circle {\n        padding: 0;\n        border-radius: 50%;\n    }\n\n    .p-badge-secondary {\n        background: dt('badge.secondary.background');\n        color: dt('badge.secondary.color');\n    }\n\n    .p-badge-success {\n        background: dt('badge.success.background');\n        color: dt('badge.success.color');\n    }\n\n    .p-badge-info {\n        background: dt('badge.info.background');\n        color: dt('badge.info.color');\n    }\n\n    .p-badge-warn {\n        background: dt('badge.warn.background');\n        color: dt('badge.warn.color');\n    }\n\n    .p-badge-danger {\n        background: dt('badge.danger.background');\n        color: dt('badge.danger.color');\n    }\n\n    .p-badge-contrast {\n        background: dt('badge.contrast.background');\n        color: dt('badge.contrast.color');\n    }\n\n    .p-badge-sm {\n        font-size: dt('badge.sm.font.size');\n        min-width: dt('badge.sm.min.width');\n        height: dt('badge.sm.height');\n    }\n\n    .p-badge-lg {\n        font-size: dt('badge.lg.font.size');\n        min-width: dt('badge.lg.min.width');\n        height: dt('badge.lg.height');\n    }\n\n    .p-badge-xl {\n        font-size: dt('badge.xl.font.size');\n        min-width: dt('badge.xl.min.width');\n        height: dt('badge.xl.height');\n    }\n";
//#endregion
//#region node_modules/primeng/fesm2022/primeng-badge.mjs
var _BadgeStyle;
var _Badge;
var _BadgeModule;
var style = `
    ${style$1}
`;
var classes$1 = { root: ({ instance }) => {
	const value = instance.value();
	const size = instance.size();
	const badgeSize = instance.badgeSize();
	const severity = instance.severity();
	return ["p-badge p-component", {
		"p-badge-circle": l(value) && String(value).length === 1,
		"p-badge-dot": p(value),
		"p-badge-sm": size === "small" || badgeSize === "small",
		"p-badge-lg": size === "large" || badgeSize === "large",
		"p-badge-xl": size === "xlarge" || badgeSize === "xlarge",
		"p-badge-info": severity === "info",
		"p-badge-success": severity === "success",
		"p-badge-warn": severity === "warn",
		"p-badge-danger": severity === "danger",
		"p-badge-secondary": severity === "secondary",
		"p-badge-contrast": severity === "contrast"
	}];
} };
var BadgeStyle = class extends BaseStyle {
	constructor(..._args) {
		super(..._args);
		_defineProperty(this, "name", "badge");
		_defineProperty(this, "style", style);
		_defineProperty(this, "classes", classes$1);
	}
};
_BadgeStyle = BadgeStyle;
_defineProperty(BadgeStyle, "ɵfac", /*@__PURE__*/ (() => {
	let ɵBadgeStyle_BaseFactory = void 0;
	return function BadgeStyle_Factory(__ngFactoryType__) {
		return (ɵBadgeStyle_BaseFactory || (ɵBadgeStyle_BaseFactory = ɵɵgetInheritedFactory(_BadgeStyle)))(__ngFactoryType__ || _BadgeStyle);
	};
})());
_defineProperty(BadgeStyle, "ɵprov", /*@__PURE__*/ ɵɵdefineInjectable({
	token: _BadgeStyle,
	factory: _BadgeStyle.ɵfac
}));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(BadgeStyle, [{ type: Injectable }], null, null);
})();
/**
*
* Badge represents people using icons, labels and images.
*
* [Live Demo](https://www.primeng.org/badge)
*
* @module badgestyle
*
*/
var BadgeClasses;
(function(BadgeClasses) {
	/**
	* Class name of the root element
	*/
	BadgeClasses["root"] = "p-badge";
})(BadgeClasses || (BadgeClasses = {}));
var BADGE_INSTANCE = new InjectionToken("BADGE_INSTANCE");
/**
* Badge is a small status indicator for another element.
* @group Components
*/
var Badge = class extends BaseComponent {
	constructor(..._args2) {
		var _inject;
		super(..._args2);
		_defineProperty(this, "componentName", "Badge");
		_defineProperty(this, "$pcBadge", (_inject = inject(BADGE_INSTANCE, {
			optional: true,
			skipSelf: true
		})) !== null && _inject !== void 0 ? _inject : void 0);
		_defineProperty(this, "bindDirectiveInstance", inject(Bind, { self: true }));
		_defineProperty(
			this,
			/**
			* Size of the badge, valid options are "large" and "xlarge".
			* @group Props
			*/
			"badgeSize",
			input(...ngDevMode ? [void 0, { debugName: "badgeSize" }] : /* istanbul ignore next */ [])
		);
		_defineProperty(
			this,
			/**
			* Size of the badge, valid options are "large" and "xlarge".
			* @group Props
			*/
			"size",
			input(...ngDevMode ? [void 0, { debugName: "size" }] : /* istanbul ignore next */ [])
		);
		_defineProperty(
			this,
			/**
			* Severity type of the badge.
			* @group Props
			*/
			"severity",
			input(...ngDevMode ? [void 0, { debugName: "severity" }] : /* istanbul ignore next */ [])
		);
		_defineProperty(
			this,
			/**
			* Value to display inside the badge.
			* @group Props
			*/
			"value",
			input(...ngDevMode ? [void 0, { debugName: "value" }] : /* istanbul ignore next */ [])
		);
		_defineProperty(
			this,
			/**
			* When specified, disables the component.
			* @group Props
			*/
			"badgeDisabled",
			input(false, _objectSpread2(_objectSpread2({}, ngDevMode ? { debugName: "badgeDisabled" } : /* istanbul ignore next */ {}), {}, { transform: booleanAttribute }))
		);
		_defineProperty(this, "_componentStyle", inject(BadgeStyle));
		_defineProperty(this, "displayStyle", computed(() => this.badgeDisabled() ? "none" : null, ...ngDevMode ? [{ debugName: "displayStyle" }] : /* istanbul ignore next */ []));
		_defineProperty(this, "dataP", computed(() => {
			const value = this.value();
			const severity = this.severity();
			const size = this.size();
			return this.cn({
				circle: value != null && String(value).length === 1,
				empty: value == null,
				disabled: this.badgeDisabled(),
				[severity]: severity,
				[size]: size
			});
		}, ...ngDevMode ? [{ debugName: "dataP" }] : /* istanbul ignore next */ []));
	}
	onAfterViewChecked() {
		this.bindDirectiveInstance.setAttrs(this.ptms(["host", "root"]));
	}
};
_Badge = Badge;
_defineProperty(Badge, "ɵfac", /*@__PURE__*/ (() => {
	let ɵBadge_BaseFactory = void 0;
	return function Badge_Factory(__ngFactoryType__) {
		return (ɵBadge_BaseFactory || (ɵBadge_BaseFactory = ɵɵgetInheritedFactory(_Badge)))(__ngFactoryType__ || _Badge);
	};
})());
_defineProperty(Badge, "ɵcmp", /*@__PURE__*/ ɵɵdefineComponent({
	type: _Badge,
	selectors: [["p-badge"]],
	hostVars: 5,
	hostBindings: function Badge_HostBindings(rf, ctx) {
		if (rf & 2) {
			ɵɵattribute("data-p", ctx.dataP());
			ɵɵclassMap(ctx.cx("root"));
			ɵɵstyleProp("display", ctx.displayStyle());
		}
	},
	inputs: {
		badgeSize: [1, "badgeSize"],
		size: [1, "size"],
		severity: [1, "severity"],
		value: [1, "value"],
		badgeDisabled: [1, "badgeDisabled"]
	},
	features: [
		ɵɵProvidersFeature([
			BadgeStyle,
			{
				provide: BADGE_INSTANCE,
				useExisting: _Badge
			},
			{
				provide: PARENT_INSTANCE,
				useExisting: _Badge
			}
		]),
		ɵɵHostDirectivesFeature([Bind]),
		ɵɵInheritDefinitionFeature
	],
	decls: 1,
	vars: 1,
	template: function Badge_Template(rf, ctx) {
		if (rf & 1) ɵɵtext(0);
		if (rf & 2) ɵɵtextInterpolate(ctx.value());
	},
	dependencies: [SharedModule],
	encapsulation: 2
}));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(Badge, [{
		type: Component,
		args: [{
			selector: "p-badge",
			template: `{{ value() }}`,
			standalone: true,
			imports: [SharedModule],
			changeDetection: ChangeDetectionStrategy.OnPush,
			encapsulation: ViewEncapsulation.None,
			providers: [
				BadgeStyle,
				{
					provide: BADGE_INSTANCE,
					useExisting: Badge
				},
				{
					provide: PARENT_INSTANCE,
					useExisting: Badge
				}
			],
			host: {
				"[class]": "cx('root')",
				"[style.display]": "displayStyle()",
				"[attr.data-p]": "dataP()"
			},
			hostDirectives: [Bind]
		}]
	}], null, {
		badgeSize: [{
			type: Input,
			args: [{
				isSignal: true,
				alias: "badgeSize",
				required: false
			}]
		}],
		size: [{
			type: Input,
			args: [{
				isSignal: true,
				alias: "size",
				required: false
			}]
		}],
		severity: [{
			type: Input,
			args: [{
				isSignal: true,
				alias: "severity",
				required: false
			}]
		}],
		value: [{
			type: Input,
			args: [{
				isSignal: true,
				alias: "value",
				required: false
			}]
		}],
		badgeDisabled: [{
			type: Input,
			args: [{
				isSignal: true,
				alias: "badgeDisabled",
				required: false
			}]
		}]
	});
})();
var BadgeModule = class {};
_BadgeModule = BadgeModule;
_defineProperty(BadgeModule, "ɵfac", function BadgeModule_Factory(__ngFactoryType__) {
	return new (__ngFactoryType__ || _BadgeModule)();
});
_defineProperty(BadgeModule, "ɵmod", /*@__PURE__*/ ɵɵdefineNgModule({
	type: _BadgeModule,
	imports: [Badge, SharedModule],
	exports: [Badge, SharedModule]
}));
_defineProperty(BadgeModule, "ɵinj", /*@__PURE__*/ ɵɵdefineInjector({ imports: [
	Badge,
	SharedModule,
	SharedModule
] }));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(BadgeModule, [{
		type: NgModule,
		args: [{
			imports: [Badge, SharedModule],
			exports: [Badge, SharedModule]
		}]
	}], null, null);
})();
//#endregion
//#region node_modules/primeng/fesm2022/primeng-button.mjs
var _ButtonStyle;
var _Button;
var _ButtonIcon;
var _ButtonLabel;
var _ButtonDirective;
var _ButtonModule;
var classes = {
	root: ({ instance }) => {
		const hasIcon = instance.hasIcon();
		const label = instance.label();
		const buttonProps = instance.buttonProps();
		const loading = instance.loading();
		const link = instance.link();
		const severity = instance.severity();
		const raised = instance.raised();
		const rounded = instance.rounded();
		const text = instance.text();
		const variant = instance.variant();
		const outlined = instance.outlined();
		const size = instance.size();
		const plain = instance.plain();
		const badge = instance.badge();
		const hasFluid = instance.hasFluid();
		const iconPos = instance.iconPos();
		return ["p-button p-component", {
			"p-button-icon-only": hasIcon && !label && !(buttonProps === null || buttonProps === void 0 ? void 0 : buttonProps.label) && !badge,
			"p-button-vertical": (iconPos === "top" || iconPos === "bottom") && label,
			"p-button-loading": loading || (buttonProps === null || buttonProps === void 0 ? void 0 : buttonProps.loading),
			"p-button-link": link || (buttonProps === null || buttonProps === void 0 ? void 0 : buttonProps.link),
			[`p-button-${severity || (buttonProps === null || buttonProps === void 0 ? void 0 : buttonProps.severity)}`]: severity || (buttonProps === null || buttonProps === void 0 ? void 0 : buttonProps.severity),
			"p-button-raised": raised || (buttonProps === null || buttonProps === void 0 ? void 0 : buttonProps.raised),
			"p-button-rounded": rounded || (buttonProps === null || buttonProps === void 0 ? void 0 : buttonProps.rounded),
			"p-button-text": text || variant === "text" || (buttonProps === null || buttonProps === void 0 ? void 0 : buttonProps.text) || (buttonProps === null || buttonProps === void 0 ? void 0 : buttonProps.variant) === "text",
			"p-button-outlined": outlined || variant === "outlined" || (buttonProps === null || buttonProps === void 0 ? void 0 : buttonProps.outlined) || (buttonProps === null || buttonProps === void 0 ? void 0 : buttonProps.variant) === "outlined",
			"p-button-sm": size === "small" || (buttonProps === null || buttonProps === void 0 ? void 0 : buttonProps.size) === "small",
			"p-button-lg": size === "large" || (buttonProps === null || buttonProps === void 0 ? void 0 : buttonProps.size) === "large",
			"p-button-plain": plain || (buttonProps === null || buttonProps === void 0 ? void 0 : buttonProps.plain),
			"p-button-fluid": hasFluid
		}];
	},
	loadingIcon: "p-button-loading-icon",
	icon: ({ instance }) => {
		const iconPos = instance.iconPos();
		const buttonProps = instance.buttonProps();
		const label = instance.label();
		const icon = instance.icon();
		return [
			"p-button-icon",
			{
				[`p-button-icon-${iconPos || (buttonProps === null || buttonProps === void 0 ? void 0 : buttonProps.iconPos)}`]: label || (buttonProps === null || buttonProps === void 0 ? void 0 : buttonProps.label),
				"p-button-icon-left": (iconPos === "left" || (buttonProps === null || buttonProps === void 0 ? void 0 : buttonProps.iconPos) === "left") && label || (buttonProps === null || buttonProps === void 0 ? void 0 : buttonProps.label),
				"p-button-icon-right": (iconPos === "right" || (buttonProps === null || buttonProps === void 0 ? void 0 : buttonProps.iconPos) === "right") && label || (buttonProps === null || buttonProps === void 0 ? void 0 : buttonProps.label),
				"p-button-icon-top": (iconPos === "top" || (buttonProps === null || buttonProps === void 0 ? void 0 : buttonProps.iconPos) === "top") && label || (buttonProps === null || buttonProps === void 0 ? void 0 : buttonProps.label),
				"p-button-icon-bottom": (iconPos === "bottom" || (buttonProps === null || buttonProps === void 0 ? void 0 : buttonProps.iconPos) === "bottom") && label || (buttonProps === null || buttonProps === void 0 ? void 0 : buttonProps.label)
			},
			icon,
			buttonProps === null || buttonProps === void 0 ? void 0 : buttonProps.icon
		];
	},
	spinnerIcon: ({ instance }) => Object.entries(instance.cx("icon")).filter(([, value]) => !!value).reduce((acc, [key]) => acc + ` ${key}`, "p-button-loading-icon"),
	label: "p-button-label"
};
var ButtonStyle = class extends BaseStyle {
	constructor(..._args) {
		super(..._args);
		_defineProperty(this, "name", "button");
		_defineProperty(this, "style", style$2);
		_defineProperty(this, "classes", classes);
	}
};
_ButtonStyle = ButtonStyle;
_defineProperty(ButtonStyle, "ɵfac", /*@__PURE__*/ (() => {
	let ɵButtonStyle_BaseFactory = void 0;
	return function ButtonStyle_Factory(__ngFactoryType__) {
		return (ɵButtonStyle_BaseFactory || (ɵButtonStyle_BaseFactory = ɵɵgetInheritedFactory(_ButtonStyle)))(__ngFactoryType__ || _ButtonStyle);
	};
})());
_defineProperty(ButtonStyle, "ɵprov", /*@__PURE__*/ ɵɵdefineInjectable({
	token: _ButtonStyle,
	factory: _ButtonStyle.ɵfac
}));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(ButtonStyle, [{ type: Injectable }], null, null);
})();
/**
*
* Button is an extension to standard button element with icons and theming.
*
* [Live Demo](https://www.primeng.org/button/)
*
* @module buttonstyle
*
*/
var ButtonClasses;
(function(ButtonClasses) {
	/**
	* Class name of the root element
	*/
	ButtonClasses["root"] = "p-button";
	/**
	* Class name of the loading icon element
	*/
	ButtonClasses["loadingIcon"] = "p-button-loading-icon";
	/**
	* Class name of the icon element
	*/
	ButtonClasses["icon"] = "p-button-icon";
	/**
	* Class name of the label element
	*/
	ButtonClasses["label"] = "p-button-label";
})(ButtonClasses || (ButtonClasses = {}));
var BUTTON_INSTANCE = new InjectionToken("BUTTON_INSTANCE");
/**
* @deprecated Use the `[pButton]` directive instead.
* @group Components
*/
var Button = class extends BaseComponent {
	constructor(..._args2) {
		var _inject;
		super(..._args2);
		_defineProperty(this, "componentName", "Button");
		_defineProperty(this, "hostName", input("", ...ngDevMode ? [{ debugName: "hostName" }] : /* istanbul ignore next */ []));
		_defineProperty(this, "$pcButton", (_inject = inject(BUTTON_INSTANCE, {
			optional: true,
			skipSelf: true
		})) !== null && _inject !== void 0 ? _inject : void 0);
		_defineProperty(this, "bindDirectiveInstance", inject(Bind, { self: true }));
		_defineProperty(this, "_componentStyle", inject(ButtonStyle));
		_defineProperty(
			this,
			/**
			* Type of the button.
			* @group Props
			*/
			"type",
			input("button", ...ngDevMode ? [{ debugName: "type" }] : /* istanbul ignore next */ [])
		);
		_defineProperty(
			this,
			/**
			* Value of the badge.
			* @group Props
			*/
			"badge",
			input(...ngDevMode ? [void 0, { debugName: "badge" }] : /* istanbul ignore next */ [])
		);
		_defineProperty(
			this,
			/**
			* When present, it specifies that the component should be disabled.
			* @group Props
			*/
			"disabled",
			input(false, _objectSpread2(_objectSpread2({}, ngDevMode ? { debugName: "disabled" } : /* istanbul ignore next */ {}), {}, { transform: booleanAttribute }))
		);
		_defineProperty(
			this,
			/**
			* Add a shadow to indicate elevation.
			* @group Props
			*/
			"raised",
			input(false, _objectSpread2(_objectSpread2({}, ngDevMode ? { debugName: "raised" } : /* istanbul ignore next */ {}), {}, { transform: booleanAttribute }))
		);
		_defineProperty(
			this,
			/**
			* Add a circular border radius to the button.
			* @group Props
			*/
			"rounded",
			input(false, _objectSpread2(_objectSpread2({}, ngDevMode ? { debugName: "rounded" } : /* istanbul ignore next */ {}), {}, { transform: booleanAttribute }))
		);
		_defineProperty(
			this,
			/**
			* Add a textual class to the button without a background initially.
			* @group Props
			*/
			"text",
			input(false, _objectSpread2(_objectSpread2({}, ngDevMode ? { debugName: "text" } : /* istanbul ignore next */ {}), {}, { transform: booleanAttribute }))
		);
		_defineProperty(
			this,
			/**
			* Add a plain textual class to the button without a background initially.
			* @group Props
			*/
			"plain",
			input(false, _objectSpread2(_objectSpread2({}, ngDevMode ? { debugName: "plain" } : /* istanbul ignore next */ {}), {}, { transform: booleanAttribute }))
		);
		_defineProperty(
			this,
			/**
			* Add a border class without a background initially.
			* @group Props
			*/
			"outlined",
			input(false, _objectSpread2(_objectSpread2({}, ngDevMode ? { debugName: "outlined" } : /* istanbul ignore next */ {}), {}, { transform: booleanAttribute }))
		);
		_defineProperty(
			this,
			/**
			* Add a link style to the button.
			* @group Props
			*/
			"link",
			input(false, _objectSpread2(_objectSpread2({}, ngDevMode ? { debugName: "link" } : /* istanbul ignore next */ {}), {}, { transform: booleanAttribute }))
		);
		_defineProperty(
			this,
			/**
			* Add a tabindex to the button.
			* @group Props
			*/
			"tabindex",
			input(0, _objectSpread2(_objectSpread2({}, ngDevMode ? { debugName: "tabindex" } : /* istanbul ignore next */ {}), {}, { transform: numberAttribute }))
		);
		_defineProperty(
			this,
			/**
			* Defines the size of the button.
			* @group Props
			*/
			"size",
			input(...ngDevMode ? [void 0, { debugName: "size" }] : /* istanbul ignore next */ [])
		);
		_defineProperty(
			this,
			/**
			* Specifies the variant of the component.
			* @group Props
			*/
			"variant",
			input(...ngDevMode ? [void 0, { debugName: "variant" }] : /* istanbul ignore next */ [])
		);
		_defineProperty(
			this,
			/**
			* Inline style of the element.
			* @group Props
			*/
			"style",
			input(...ngDevMode ? [void 0, { debugName: "style" }] : /* istanbul ignore next */ [])
		);
		_defineProperty(
			this,
			/**
			* Class of the element.
			* @group Props
			*/
			"styleClass",
			input(...ngDevMode ? [void 0, { debugName: "styleClass" }] : /* istanbul ignore next */ [])
		);
		_defineProperty(
			this,
			/**
			* Severity type of the badge.
			* @group Props
			* @defaultValue secondary
			*/
			"badgeSeverity",
			input("secondary", ...ngDevMode ? [{ debugName: "badgeSeverity" }] : /* istanbul ignore next */ [])
		);
		_defineProperty(
			this,
			/**
			* Used to define a string that autocomplete attribute the current element.
			* @group Props
			*/
			"ariaLabel",
			input(...ngDevMode ? [void 0, { debugName: "ariaLabel" }] : /* istanbul ignore next */ [])
		);
		_defineProperty(
			this,
			/**
			* When present, it specifies that the component should automatically get focus on load.
			* @group Props
			*/
			"autofocus",
			input(false, _objectSpread2(_objectSpread2({}, ngDevMode ? { debugName: "autofocus" } : /* istanbul ignore next */ {}), {}, { transform: booleanAttribute }))
		);
		_defineProperty(
			this,
			/**
			* Position of the icon.
			* @group Props
			*/
			"iconPos",
			input("left", ...ngDevMode ? [{ debugName: "iconPos" }] : /* istanbul ignore next */ [])
		);
		_defineProperty(
			this,
			/**
			* Name of the icon.
			* @group Props
			*/
			"icon",
			input(...ngDevMode ? [void 0, { debugName: "icon" }] : /* istanbul ignore next */ [])
		);
		_defineProperty(
			this,
			/**
			* Text of the button.
			* @group Props
			*/
			"label",
			input(...ngDevMode ? [void 0, { debugName: "label" }] : /* istanbul ignore next */ [])
		);
		_defineProperty(
			this,
			/**
			* Whether the button is in loading state.
			* @group Props
			*/
			"loading",
			input(false, _objectSpread2(_objectSpread2({}, ngDevMode ? { debugName: "loading" } : /* istanbul ignore next */ {}), {}, { transform: booleanAttribute }))
		);
		_defineProperty(
			this,
			/**
			* Icon to display in loading state.
			* @group Props
			*/
			"loadingIcon",
			input(...ngDevMode ? [void 0, { debugName: "loadingIcon" }] : /* istanbul ignore next */ [])
		);
		_defineProperty(
			this,
			/**
			* Defines the style of the button.
			* @group Props
			*/
			"severity",
			input(...ngDevMode ? [void 0, { debugName: "severity" }] : /* istanbul ignore next */ [])
		);
		_defineProperty(
			this,
			/**
			* Used to pass all properties of the ButtonProps to the Button component.
			* @group Props
			*/
			"buttonProps",
			input(...ngDevMode ? [void 0, { debugName: "buttonProps" }] : /* istanbul ignore next */ [])
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
			* Forces icon-only styling regardless of content. When unset, icon-only is inferred from the absence of a label/badge.
			* @group Props
			*/
			"iconOnly",
			input(false, _objectSpread2(_objectSpread2({}, ngDevMode ? { debugName: "iconOnly" } : /* istanbul ignore next */ {}), {}, { transform: booleanAttribute }))
		);
		_defineProperty(
			this,
			/**
			* Callback to execute when button is clicked.
			* This event is intended to be used with the <p-button> component. Using a regular <button> element, use (click).
			* @param {MouseEvent} event - Mouse event.
			* @group Emits
			*/
			"onClick",
			output()
		);
		_defineProperty(
			this,
			/**
			* Callback to execute when button is focused.
			* This event is intended to be used with the <p-button> component. Using a regular <button> element, use (focus).
			* @param {FocusEvent} event - Focus event.
			* @group Emits
			*/
			"onFocus",
			output()
		);
		_defineProperty(
			this,
			/**
			* Callback to execute when button loses focus.
			* This event is intended to be used with the <p-button> component. Using a regular <button> element, use (blur).
			* @param {FocusEvent} event - Focus event.
			* @group Emits
			*/
			"onBlur",
			output()
		);
		_defineProperty(
			this,
			/**
			* Custom content template.
			* @group Templates
			**/
			"contentTemplate",
			contentChild("content", _objectSpread2(_objectSpread2({}, ngDevMode ? { debugName: "contentTemplate" } : /* istanbul ignore next */ {}), {}, { descendants: false }))
		);
		_defineProperty(
			this,
			/**
			* Custom loading icon template.
			* @group Templates
			**/
			"loadingIconTemplate",
			contentChild("loadingicon", _objectSpread2(_objectSpread2({}, ngDevMode ? { debugName: "loadingIconTemplate" } : /* istanbul ignore next */ {}), {}, { descendants: false }))
		);
		_defineProperty(
			this,
			/**
			* Custom icon template.
			* @group Templates
			**/
			"iconTemplate",
			contentChild("icon", _objectSpread2(_objectSpread2({}, ngDevMode ? { debugName: "iconTemplate" } : /* istanbul ignore next */ {}), {}, { descendants: false }))
		);
		_defineProperty(this, "pcFluid", inject(Fluid, {
			optional: true,
			host: true,
			skipSelf: true
		}));
		_defineProperty(this, "hasFluid", computed(() => {
			var _this$fluid;
			return (_this$fluid = this.fluid()) !== null && _this$fluid !== void 0 ? _this$fluid : !!this.pcFluid;
		}, ...ngDevMode ? [{ debugName: "hasFluid" }] : /* istanbul ignore next */ []));
		_defineProperty(this, "$type", computed(() => {
			var _this$buttonProps;
			return this.type() || ((_this$buttonProps = this.buttonProps()) === null || _this$buttonProps === void 0 ? void 0 : _this$buttonProps.type);
		}, ...ngDevMode ? [{ debugName: "$type" }] : /* istanbul ignore next */ []));
		_defineProperty(this, "$ariaLabel", computed(() => {
			var _this$buttonProps2;
			return this.ariaLabel() || ((_this$buttonProps2 = this.buttonProps()) === null || _this$buttonProps2 === void 0 ? void 0 : _this$buttonProps2.ariaLabel);
		}, ...ngDevMode ? [{ debugName: "$ariaLabel" }] : /* istanbul ignore next */ []));
		_defineProperty(this, "mergedStyle", computed(() => {
			var _this$buttonProps3;
			return this.style() || ((_this$buttonProps3 = this.buttonProps()) === null || _this$buttonProps3 === void 0 ? void 0 : _this$buttonProps3.style);
		}, ...ngDevMode ? [{ debugName: "mergedStyle" }] : /* istanbul ignore next */ []));
		_defineProperty(this, "$disabled", computed(() => {
			var _this$buttonProps4;
			return this.disabled() || this.loading() || ((_this$buttonProps4 = this.buttonProps()) === null || _this$buttonProps4 === void 0 ? void 0 : _this$buttonProps4.disabled);
		}, ...ngDevMode ? [{ debugName: "$disabled" }] : /* istanbul ignore next */ []));
		_defineProperty(this, "$severity", computed(() => {
			var _this$buttonProps5;
			return this.severity() || ((_this$buttonProps5 = this.buttonProps()) === null || _this$buttonProps5 === void 0 ? void 0 : _this$buttonProps5.severity);
		}, ...ngDevMode ? [{ debugName: "$severity" }] : /* istanbul ignore next */ []));
		_defineProperty(this, "$tabindex", computed(() => {
			var _this$buttonProps6;
			return this.tabindex() || ((_this$buttonProps6 = this.buttonProps()) === null || _this$buttonProps6 === void 0 ? void 0 : _this$buttonProps6.tabindex);
		}, ...ngDevMode ? [{ debugName: "$tabindex" }] : /* istanbul ignore next */ []));
		_defineProperty(this, "$autofocus", computed(() => {
			var _this$buttonProps7;
			return this.autofocus() || ((_this$buttonProps7 = this.buttonProps()) === null || _this$buttonProps7 === void 0 ? void 0 : _this$buttonProps7.autofocus);
		}, ...ngDevMode ? [{ debugName: "$autofocus" }] : /* istanbul ignore next */ []));
		_defineProperty(this, "$loading", computed(() => {
			var _this$buttonProps8;
			return this.loading() || ((_this$buttonProps8 = this.buttonProps()) === null || _this$buttonProps8 === void 0 ? void 0 : _this$buttonProps8.loading);
		}, ...ngDevMode ? [{ debugName: "$loading" }] : /* istanbul ignore next */ []));
		_defineProperty(this, "$icon", computed(() => {
			var _this$buttonProps9;
			return this.icon() || ((_this$buttonProps9 = this.buttonProps()) === null || _this$buttonProps9 === void 0 ? void 0 : _this$buttonProps9.icon);
		}, ...ngDevMode ? [{ debugName: "$icon" }] : /* istanbul ignore next */ []));
		_defineProperty(this, "$label", computed(() => {
			var _this$buttonProps10;
			return this.label() || ((_this$buttonProps10 = this.buttonProps()) === null || _this$buttonProps10 === void 0 ? void 0 : _this$buttonProps10.label);
		}, ...ngDevMode ? [{ debugName: "$label" }] : /* istanbul ignore next */ []));
		_defineProperty(this, "$badge", computed(() => {
			var _this$buttonProps11;
			return this.badge() || ((_this$buttonProps11 = this.buttonProps()) === null || _this$buttonProps11 === void 0 ? void 0 : _this$buttonProps11.badge);
		}, ...ngDevMode ? [{ debugName: "$badge" }] : /* istanbul ignore next */ []));
		_defineProperty(this, "$loadingIcon", computed(() => {
			var _this$buttonProps12;
			return this.loadingIcon() || ((_this$buttonProps12 = this.buttonProps()) === null || _this$buttonProps12 === void 0 ? void 0 : _this$buttonProps12.loadingIcon);
		}, ...ngDevMode ? [{ debugName: "$loadingIcon" }] : /* istanbul ignore next */ []));
		_defineProperty(this, "$badgeSeverity", computed(() => {
			var _this$buttonProps13;
			return this.badgeSeverity() || ((_this$buttonProps13 = this.buttonProps()) === null || _this$buttonProps13 === void 0 ? void 0 : _this$buttonProps13.badgeSeverity);
		}, ...ngDevMode ? [{ debugName: "$badgeSeverity" }] : /* istanbul ignore next */ []));
		_defineProperty(this, "showLabel", computed(() => !this.contentTemplate() && this.$label(), ...ngDevMode ? [{ debugName: "showLabel" }] : /* istanbul ignore next */ []));
		_defineProperty(this, "showBadge", computed(() => !this.contentTemplate() && this.$badge(), ...ngDevMode ? [{ debugName: "showBadge" }] : /* istanbul ignore next */ []));
		_defineProperty(this, "hasIcon", computed(() => this.$icon() || this.iconTemplate() || this.loadingIcon() || this.loadingIconTemplate(), ...ngDevMode ? [{ debugName: "hasIcon" }] : /* istanbul ignore next */ []));
		_defineProperty(this, "$outlined", computed(() => {
			var _this$buttonProps14, _this$buttonProps15;
			return this.outlined() || this.variant() === "outlined" || ((_this$buttonProps14 = this.buttonProps()) === null || _this$buttonProps14 === void 0 ? void 0 : _this$buttonProps14.outlined) || ((_this$buttonProps15 = this.buttonProps()) === null || _this$buttonProps15 === void 0 ? void 0 : _this$buttonProps15.variant) === "outlined";
		}, ...ngDevMode ? [{ debugName: "$outlined" }] : /* istanbul ignore next */ []));
		_defineProperty(this, "$text", computed(() => {
			var _this$buttonProps16, _this$buttonProps17;
			return this.text() || this.variant() === "text" || ((_this$buttonProps16 = this.buttonProps()) === null || _this$buttonProps16 === void 0 ? void 0 : _this$buttonProps16.text) || ((_this$buttonProps17 = this.buttonProps()) === null || _this$buttonProps17 === void 0 ? void 0 : _this$buttonProps17.variant) === "text";
		}, ...ngDevMode ? [{ debugName: "$text" }] : /* istanbul ignore next */ []));
		_defineProperty(this, "$iconOnly", computed(() => this.iconOnly() || this.hasIcon() && !this.$label() && !this.$badge(), ...ngDevMode ? [{ debugName: "$iconOnly" }] : /* istanbul ignore next */ []));
		_defineProperty(this, "dataP", computed(() => this.cn({
			[this.size()]: this.size(),
			"icon-only": this.$iconOnly(),
			loading: this.$loading(),
			fluid: this.hasFluid(),
			rounded: this.rounded(),
			raised: this.raised(),
			outlined: this.$outlined(),
			text: this.$text(),
			link: this.link(),
			vertical: (this.iconPos() === "top" || this.iconPos() === "bottom") && this.$label()
		}), ...ngDevMode ? [{ debugName: "dataP" }] : /* istanbul ignore next */ []));
		_defineProperty(this, "dataIconP", computed(() => this.cn({
			[this.iconPos()]: this.iconPos(),
			[this.size()]: this.size()
		}), ...ngDevMode ? [{ debugName: "dataIconP" }] : /* istanbul ignore next */ []));
		_defineProperty(this, "dataLabelP", computed(() => this.cn({
			[this.size()]: this.size(),
			"icon-only": this.$iconOnly()
		}), ...ngDevMode ? [{ debugName: "dataLabelP" }] : /* istanbul ignore next */ []));
	}
	onAfterViewChecked() {
		this.bindDirectiveInstance.setAttrs(this.ptm("host"));
	}
	getLoadingIconTemplateContext() {
		return {
			class: this.cx("loadingIcon"),
			pt: this.ptm("loadingIcon")
		};
	}
	getIconTemplateContext() {
		return {
			class: this.cx("icon"),
			pt: this.ptm("icon")
		};
	}
};
_Button = Button;
_defineProperty(Button, "ɵfac", /*@__PURE__*/ (() => {
	let ɵButton_BaseFactory = void 0;
	return function Button_Factory(__ngFactoryType__) {
		return (ɵButton_BaseFactory || (ɵButton_BaseFactory = ɵɵgetInheritedFactory(_Button)))(__ngFactoryType__ || _Button);
	};
})());
_defineProperty(Button, "ɵcmp", (function() {
	const _c0 = ["content"];
	const _c1 = ["loadingicon"];
	const _c2 = ["icon"];
	const _c3 = ["*"];
	function Button_ng_container_2_Template(rf, ctx) {
		if (rf & 1) ɵɵelementContainer(0);
	}
	function Button_Conditional_3_Conditional_0_Conditional_0_Template(rf, ctx) {
		if (rf & 1) ɵɵelement(0, "span", 5);
		if (rf & 2) {
			const ctx_r0 = ɵɵnextContext(3);
			ɵɵclassMap(ctx_r0.cn(ctx_r0.cx("loadingIcon"), "pi-spin", ctx_r0.$loadingIcon()));
			ɵɵproperty("pBind", ctx_r0.ptm("loadingIcon"));
			ɵɵattribute("aria-hidden", true);
		}
	}
	function Button_Conditional_3_Conditional_0_Conditional_1_Template(rf, ctx) {
		if (rf & 1) {
			ɵɵnamespaceSVG();
			ɵɵelement(0, "svg", 6);
		}
		if (rf & 2) {
			const ctx_r0 = ɵɵnextContext(3);
			ɵɵclassMap(ctx_r0.cn(ctx_r0.cx("loadingIcon"), ctx_r0.cx("spinnerIcon")));
			ɵɵproperty("spin", true)("pBind", ctx_r0.ptm("loadingIcon"));
			ɵɵattribute("aria-hidden", true);
		}
	}
	function Button_Conditional_3_Conditional_0_Template(rf, ctx) {
		if (rf & 1) ɵɵconditionalCreate(0, Button_Conditional_3_Conditional_0_Conditional_0_Template, 1, 4, "span", 2)(1, Button_Conditional_3_Conditional_0_Conditional_1_Template, 1, 5, ":svg:svg", 4);
		if (rf & 2) {
			const ctx_r0 = ɵɵnextContext(2);
			ɵɵconditional(ctx_r0.$loadingIcon() ? 0 : 1);
		}
	}
	function Button_Conditional_3_Conditional_1_ng_container_0_Template(rf, ctx) {
		if (rf & 1) ɵɵelementContainer(0);
	}
	function Button_Conditional_3_Conditional_1_Template(rf, ctx) {
		if (rf & 1) ɵɵtemplate(0, Button_Conditional_3_Conditional_1_ng_container_0_Template, 1, 0, "ng-container", 7);
		if (rf & 2) {
			const ctx_r0 = ɵɵnextContext(2);
			ɵɵproperty("ngTemplateOutlet", ctx_r0.loadingIconTemplate())("ngTemplateOutletContext", ctx_r0.getLoadingIconTemplateContext());
		}
	}
	function Button_Conditional_3_Template(rf, ctx) {
		if (rf & 1) ɵɵconditionalCreate(0, Button_Conditional_3_Conditional_0_Template, 2, 1)(1, Button_Conditional_3_Conditional_1_Template, 1, 2, "ng-container");
		if (rf & 2) {
			const ctx_r0 = ɵɵnextContext();
			ɵɵconditional(!ctx_r0.loadingIconTemplate() ? 0 : 1);
		}
	}
	function Button_Conditional_4_Conditional_0_Template(rf, ctx) {
		if (rf & 1) ɵɵelement(0, "span", 5);
		if (rf & 2) {
			const ctx_r0 = ɵɵnextContext(2);
			ɵɵclassMap(ctx_r0.cn(ctx_r0.cx("icon"), ctx_r0.$icon()));
			ɵɵproperty("pBind", ctx_r0.ptm("icon"));
			ɵɵattribute("data-p", ctx_r0.dataIconP());
		}
	}
	function Button_Conditional_4_Conditional_1_ng_container_0_Template(rf, ctx) {
		if (rf & 1) ɵɵelementContainer(0);
	}
	function Button_Conditional_4_Conditional_1_Template(rf, ctx) {
		if (rf & 1) ɵɵtemplate(0, Button_Conditional_4_Conditional_1_ng_container_0_Template, 1, 0, "ng-container", 7);
		if (rf & 2) {
			const ctx_r0 = ɵɵnextContext(2);
			ɵɵproperty("ngTemplateOutlet", ctx_r0.iconTemplate())("ngTemplateOutletContext", ctx_r0.getIconTemplateContext());
		}
	}
	function Button_Conditional_4_Template(rf, ctx) {
		if (rf & 1) {
			ɵɵconditionalCreate(0, Button_Conditional_4_Conditional_0_Template, 1, 4, "span", 2);
			ɵɵconditionalCreate(1, Button_Conditional_4_Conditional_1_Template, 1, 2, "ng-container");
		}
		if (rf & 2) {
			const ctx_r0 = ɵɵnextContext();
			ɵɵconditional(ctx_r0.$icon() && !ctx_r0.iconTemplate() ? 0 : -1);
			ɵɵadvance();
			ɵɵconditional(!ctx_r0.icon() && ctx_r0.iconTemplate() ? 1 : -1);
		}
	}
	function Button_Conditional_5_Template(rf, ctx) {
		if (rf & 1) {
			ɵɵelementStart(0, "span", 5);
			ɵɵtext(1);
			ɵɵelementEnd();
		}
		if (rf & 2) {
			const ctx_r0 = ɵɵnextContext();
			ɵɵclassMap(ctx_r0.cx("label"));
			ɵɵproperty("pBind", ctx_r0.ptm("label"));
			ɵɵattribute("aria-hidden", ctx_r0.$icon() && !ctx_r0.$label())("data-p", ctx_r0.dataLabelP());
			ɵɵadvance();
			ɵɵtextInterpolate(ctx_r0.$label());
		}
	}
	function Button_Conditional_6_Template(rf, ctx) {
		if (rf & 1) ɵɵelement(0, "p-badge", 3);
		if (rf & 2) {
			const ctx_r0 = ɵɵnextContext();
			ɵɵproperty("value", ctx_r0.$badge())("severity", ctx_r0.$badgeSeverity())("pt", ctx_r0.ptm("pcBadge"))("unstyled", ctx_r0.unstyled());
		}
	}
	return /*@__PURE__*/ ɵɵdefineComponent({
		type: _Button,
		selectors: [["p-button"]],
		contentQueries: function Button_ContentQueries(rf, ctx, dirIndex) {
			if (rf & 1) ɵɵcontentQuerySignal(dirIndex, ctx.contentTemplate, _c0, 4)(dirIndex, ctx.loadingIconTemplate, _c1, 4)(dirIndex, ctx.iconTemplate, _c2, 4);
			if (rf & 2) ɵɵqueryAdvance(3);
		},
		inputs: {
			hostName: [1, "hostName"],
			type: [1, "type"],
			badge: [1, "badge"],
			disabled: [1, "disabled"],
			raised: [1, "raised"],
			rounded: [1, "rounded"],
			text: [1, "text"],
			plain: [1, "plain"],
			outlined: [1, "outlined"],
			link: [1, "link"],
			tabindex: [1, "tabindex"],
			size: [1, "size"],
			variant: [1, "variant"],
			style: [1, "style"],
			styleClass: [1, "styleClass"],
			badgeSeverity: [1, "badgeSeverity"],
			ariaLabel: [1, "ariaLabel"],
			autofocus: [1, "autofocus"],
			iconPos: [1, "iconPos"],
			icon: [1, "icon"],
			label: [1, "label"],
			loading: [1, "loading"],
			loadingIcon: [1, "loadingIcon"],
			severity: [1, "severity"],
			buttonProps: [1, "buttonProps"],
			fluid: [1, "fluid"],
			iconOnly: [1, "iconOnly"]
		},
		outputs: {
			onClick: "onClick",
			onFocus: "onFocus",
			onBlur: "onBlur"
		},
		features: [
			ɵɵProvidersFeature([
				ButtonStyle,
				{
					provide: BUTTON_INSTANCE,
					useExisting: _Button
				},
				{
					provide: PARENT_INSTANCE,
					useExisting: _Button
				}
			]),
			ɵɵHostDirectivesFeature([Bind]),
			ɵɵInheritDefinitionFeature
		],
		ngContentSelectors: _c3,
		decls: 7,
		vars: 18,
		consts: [
			[
				"pRipple",
				"",
				3,
				"click",
				"focus",
				"blur",
				"disabled",
				"pAutoFocus",
				"pBind"
			],
			[4, "ngTemplateOutlet"],
			[
				3,
				"class",
				"pBind"
			],
			[
				3,
				"value",
				"severity",
				"pt",
				"unstyled"
			],
			[
				"data-p-icon",
				"spinner",
				3,
				"class",
				"spin",
				"pBind"
			],
			[3, "pBind"],
			[
				"data-p-icon",
				"spinner",
				3,
				"spin",
				"pBind"
			],
			[
				4,
				"ngTemplateOutlet",
				"ngTemplateOutletContext"
			]
		],
		template: function Button_Template(rf, ctx) {
			if (rf & 1) {
				ɵɵprojectionDef();
				ɵɵelementStart(0, "button", 0);
				ɵɵlistener("click", function Button_Template_button_click_0_listener($event) {
					return ctx.onClick.emit($event);
				})("focus", function Button_Template_button_focus_0_listener($event) {
					return ctx.onFocus.emit($event);
				})("blur", function Button_Template_button_blur_0_listener($event) {
					return ctx.onBlur.emit($event);
				});
				ɵɵprojection(1);
				ɵɵtemplate(2, Button_ng_container_2_Template, 1, 0, "ng-container", 1);
				ɵɵconditionalCreate(3, Button_Conditional_3_Template, 2, 1);
				ɵɵconditionalCreate(4, Button_Conditional_4_Template, 2, 2);
				ɵɵconditionalCreate(5, Button_Conditional_5_Template, 2, 6, "span", 2);
				ɵɵconditionalCreate(6, Button_Conditional_6_Template, 1, 4, "p-badge", 3);
				ɵɵelementEnd();
			}
			if (rf & 2) {
				var _ctx$buttonProps;
				ɵɵstyleMap(ctx.mergedStyle());
				ɵɵclassMap(ctx.cn(ctx.cx("root"), ctx.styleClass(), (_ctx$buttonProps = ctx.buttonProps()) === null || _ctx$buttonProps === void 0 ? void 0 : _ctx$buttonProps.styleClass));
				ɵɵproperty("disabled", ctx.$disabled())("pAutoFocus", ctx.$autofocus())("pBind", ctx.ptm("root"));
				ɵɵattribute("type", ctx.$type())("aria-label", ctx.$ariaLabel())("tabindex", ctx.$tabindex())("data-p", ctx.dataP())("data-p-disabled", ctx.$disabled())("data-p-severity", ctx.$severity());
				ɵɵadvance(2);
				ɵɵproperty("ngTemplateOutlet", ctx.contentTemplate());
				ɵɵadvance();
				ɵɵconditional(ctx.$loading() ? 3 : -1);
				ɵɵadvance();
				ɵɵconditional(!ctx.$loading() ? 4 : -1);
				ɵɵadvance();
				ɵɵconditional(ctx.showLabel() ? 5 : -1);
				ɵɵadvance();
				ɵɵconditional(ctx.showBadge() ? 6 : -1);
			}
		},
		dependencies: [
			NgTemplateOutlet,
			Ripple,
			AutoFocus,
			Spinner,
			BadgeModule,
			Badge,
			Bind
		],
		encapsulation: 2
	});
})());
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(Button, [{
		type: Component,
		args: [{
			selector: "p-button",
			standalone: true,
			imports: [
				NgTemplateOutlet,
				Ripple,
				AutoFocus,
				Spinner,
				BadgeModule,
				Bind
			],
			template: `
        <button
            [attr.type]="$type()"
            [attr.aria-label]="$ariaLabel()"
            [style]="mergedStyle()"
            [disabled]="$disabled()"
            [class]="cn(cx('root'), styleClass(), buttonProps()?.styleClass)"
            (click)="onClick.emit($event)"
            (focus)="onFocus.emit($event)"
            (blur)="onBlur.emit($event)"
            pRipple
            [attr.tabindex]="$tabindex()"
            [pAutoFocus]="$autofocus()"
            [pBind]="ptm('root')"
            [attr.data-p]="dataP()"
            [attr.data-p-disabled]="$disabled()"
            [attr.data-p-severity]="$severity()"
        >
            <ng-content />
            <ng-container *ngTemplateOutlet="contentTemplate()" />
            @if ($loading()) {
                @if (!loadingIconTemplate()) {
                    @if ($loadingIcon()) {
                        <span [class]="cn(cx('loadingIcon'), 'pi-spin', $loadingIcon())" [pBind]="ptm('loadingIcon')" [attr.aria-hidden]="true"></span>
                    } @else {
                        <svg data-p-icon="spinner" [class]="cn(cx('loadingIcon'), cx('spinnerIcon'))" [spin]="true" [pBind]="ptm('loadingIcon')" [attr.aria-hidden]="true" />
                    }
                } @else {
                    <ng-container *ngTemplateOutlet="loadingIconTemplate(); context: getLoadingIconTemplateContext()" />
                }
            }
            @if (!$loading()) {
                @if ($icon() && !iconTemplate()) {
                    <span [class]="cn(cx('icon'), $icon())" [pBind]="ptm('icon')" [attr.data-p]="dataIconP()"></span>
                }
                @if (!icon() && iconTemplate()) {
                    <ng-container *ngTemplateOutlet="iconTemplate(); context: getIconTemplateContext()" />
                }
            }
            @if (showLabel()) {
                <span [class]="cx('label')" [attr.aria-hidden]="$icon() && !$label()" [pBind]="ptm('label')" [attr.data-p]="dataLabelP()">{{ $label() }}</span>
            }
            @if (showBadge()) {
                <p-badge [value]="$badge()" [severity]="$badgeSeverity()" [pt]="ptm('pcBadge')" [unstyled]="unstyled()" />
            }
        </button>
    `,
			changeDetection: ChangeDetectionStrategy.OnPush,
			encapsulation: ViewEncapsulation.None,
			providers: [
				ButtonStyle,
				{
					provide: BUTTON_INSTANCE,
					useExisting: Button
				},
				{
					provide: PARENT_INSTANCE,
					useExisting: Button
				}
			],
			hostDirectives: [Bind]
		}]
	}], null, {
		hostName: [{
			type: Input,
			args: [{
				isSignal: true,
				alias: "hostName",
				required: false
			}]
		}],
		type: [{
			type: Input,
			args: [{
				isSignal: true,
				alias: "type",
				required: false
			}]
		}],
		badge: [{
			type: Input,
			args: [{
				isSignal: true,
				alias: "badge",
				required: false
			}]
		}],
		disabled: [{
			type: Input,
			args: [{
				isSignal: true,
				alias: "disabled",
				required: false
			}]
		}],
		raised: [{
			type: Input,
			args: [{
				isSignal: true,
				alias: "raised",
				required: false
			}]
		}],
		rounded: [{
			type: Input,
			args: [{
				isSignal: true,
				alias: "rounded",
				required: false
			}]
		}],
		text: [{
			type: Input,
			args: [{
				isSignal: true,
				alias: "text",
				required: false
			}]
		}],
		plain: [{
			type: Input,
			args: [{
				isSignal: true,
				alias: "plain",
				required: false
			}]
		}],
		outlined: [{
			type: Input,
			args: [{
				isSignal: true,
				alias: "outlined",
				required: false
			}]
		}],
		link: [{
			type: Input,
			args: [{
				isSignal: true,
				alias: "link",
				required: false
			}]
		}],
		tabindex: [{
			type: Input,
			args: [{
				isSignal: true,
				alias: "tabindex",
				required: false
			}]
		}],
		size: [{
			type: Input,
			args: [{
				isSignal: true,
				alias: "size",
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
		style: [{
			type: Input,
			args: [{
				isSignal: true,
				alias: "style",
				required: false
			}]
		}],
		styleClass: [{
			type: Input,
			args: [{
				isSignal: true,
				alias: "styleClass",
				required: false
			}]
		}],
		badgeSeverity: [{
			type: Input,
			args: [{
				isSignal: true,
				alias: "badgeSeverity",
				required: false
			}]
		}],
		ariaLabel: [{
			type: Input,
			args: [{
				isSignal: true,
				alias: "ariaLabel",
				required: false
			}]
		}],
		autofocus: [{
			type: Input,
			args: [{
				isSignal: true,
				alias: "autofocus",
				required: false
			}]
		}],
		iconPos: [{
			type: Input,
			args: [{
				isSignal: true,
				alias: "iconPos",
				required: false
			}]
		}],
		icon: [{
			type: Input,
			args: [{
				isSignal: true,
				alias: "icon",
				required: false
			}]
		}],
		label: [{
			type: Input,
			args: [{
				isSignal: true,
				alias: "label",
				required: false
			}]
		}],
		loading: [{
			type: Input,
			args: [{
				isSignal: true,
				alias: "loading",
				required: false
			}]
		}],
		loadingIcon: [{
			type: Input,
			args: [{
				isSignal: true,
				alias: "loadingIcon",
				required: false
			}]
		}],
		severity: [{
			type: Input,
			args: [{
				isSignal: true,
				alias: "severity",
				required: false
			}]
		}],
		buttonProps: [{
			type: Input,
			args: [{
				isSignal: true,
				alias: "buttonProps",
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
		iconOnly: [{
			type: Input,
			args: [{
				isSignal: true,
				alias: "iconOnly",
				required: false
			}]
		}],
		onClick: [{
			type: Output,
			args: ["onClick"]
		}],
		onFocus: [{
			type: Output,
			args: ["onFocus"]
		}],
		onBlur: [{
			type: Output,
			args: ["onBlur"]
		}],
		contentTemplate: [{
			type: ContentChild,
			args: ["content", _objectSpread2(_objectSpread2({}, { descendants: false }), {}, { isSignal: true })]
		}],
		loadingIconTemplate: [{
			type: ContentChild,
			args: ["loadingicon", _objectSpread2(_objectSpread2({}, { descendants: false }), {}, { isSignal: true })]
		}],
		iconTemplate: [{
			type: ContentChild,
			args: ["icon", _objectSpread2(_objectSpread2({}, { descendants: false }), {}, { isSignal: true })]
		}]
	});
})();
var BUTTON_ICON_INSTANCE = new InjectionToken("BUTTON_ICON_INSTANCE");
/**
* ButtonIcon is a directive to apply icon styling to an element inside a button.
*
* @deprecated Since v21. Place the icon (`<svg>`, `<i>`, or any element) directly
* inside the `[pButton]` host — use the `iconOnly` prop to enable icon-only styling.
* The `pButtonIcon` directive will be removed in a future major release.
*
* @group Directives
*/
var ButtonIcon = class extends BaseComponent {
	constructor() {
		var _inject2;
		super();
		_defineProperty(this, "componentName", "ButtonIcon");
		_defineProperty(
			this,
			/**
			* Used to pass attributes to DOM elements inside the pButtonIcon.
			* @defaultValue undefined
			* @group Props
			*/
			"pButtonIconPT",
			input(...ngDevMode ? [void 0, { debugName: "pButtonIconPT" }] : /* istanbul ignore next */ [])
		);
		_defineProperty(
			this,
			/**
			* Indicates whether the component should be rendered without styles.
			* @defaultValue undefined
			* @group Props
			*/
			"pButtonUnstyled",
			input(...ngDevMode ? [void 0, { debugName: "pButtonUnstyled" }] : /* istanbul ignore next */ [])
		);
		_defineProperty(this, "$pcButtonIcon", (_inject2 = inject(BUTTON_ICON_INSTANCE, {
			optional: true,
			skipSelf: true
		})) !== null && _inject2 !== void 0 ? _inject2 : void 0);
		_defineProperty(this, "bindDirectiveInstance", inject(Bind, { self: true }));
		effect(() => {
			const pt = this.pButtonIconPT();
			if (pt) this.directivePT.set(pt);
		});
		effect(() => {
			if (this.pButtonUnstyled()) this.directiveUnstyled.set(this.pButtonUnstyled());
		});
	}
	onAfterViewChecked() {
		this.bindDirectiveInstance.setAttrs(this.ptms(["host", "root"]));
	}
};
_ButtonIcon = ButtonIcon;
_defineProperty(ButtonIcon, "ɵfac", function ButtonIcon_Factory(__ngFactoryType__) {
	return new (__ngFactoryType__ || _ButtonIcon)();
});
_defineProperty(ButtonIcon, "ɵdir", /*@__PURE__*/ ɵɵdefineDirective({
	type: _ButtonIcon,
	selectors: [[
		"",
		"pButtonIcon",
		""
	]],
	hostVars: 2,
	hostBindings: function ButtonIcon_HostBindings(rf, ctx) {
		if (rf & 2) ɵɵclassProp("p-button-icon", !ctx.$unstyled() && true);
	},
	inputs: {
		pButtonIconPT: [1, "pButtonIconPT"],
		pButtonUnstyled: [1, "pButtonUnstyled"]
	},
	features: [
		ɵɵProvidersFeature([
			ButtonStyle,
			{
				provide: BUTTON_ICON_INSTANCE,
				useExisting: _ButtonIcon
			},
			{
				provide: PARENT_INSTANCE,
				useExisting: _ButtonIcon
			}
		]),
		ɵɵHostDirectivesFeature([Bind]),
		ɵɵInheritDefinitionFeature
	]
}));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(ButtonIcon, [{
		type: Directive,
		args: [{
			selector: "[pButtonIcon]",
			providers: [
				ButtonStyle,
				{
					provide: BUTTON_ICON_INSTANCE,
					useExisting: ButtonIcon
				},
				{
					provide: PARENT_INSTANCE,
					useExisting: ButtonIcon
				}
			],
			standalone: true,
			host: { "[class.p-button-icon]": "!$unstyled() && true" },
			hostDirectives: [Bind]
		}]
	}], () => [], {
		pButtonIconPT: [{
			type: Input,
			args: [{
				isSignal: true,
				alias: "pButtonIconPT",
				required: false
			}]
		}],
		pButtonUnstyled: [{
			type: Input,
			args: [{
				isSignal: true,
				alias: "pButtonUnstyled",
				required: false
			}]
		}]
	});
})();
var BUTTON_LABEL_INSTANCE = new InjectionToken("BUTTON_LABEL_INSTANCE");
/**
* ButtonLabel is a directive to apply label styling to an element inside a button.
*
* @deprecated Since v21. Place the label text directly inside the `[pButton]` host.
* The `pButtonLabel` directive will be removed in a future major release.
*
* @group Directives
*/
var ButtonLabel = class extends BaseComponent {
	constructor() {
		var _inject3;
		super();
		_defineProperty(this, "componentName", "ButtonLabel");
		_defineProperty(
			this,
			/**
			* Used to pass attributes to DOM elements inside the pButtonLabel.
			* @defaultValue undefined
			* @group Props
			*/
			"pButtonLabelPT",
			input(...ngDevMode ? [void 0, { debugName: "pButtonLabelPT" }] : /* istanbul ignore next */ [])
		);
		_defineProperty(
			this,
			/**
			* Indicates whether the component should be rendered without styles.
			* @defaultValue undefined
			* @group Props
			*/
			"pButtonLabelUnstyled",
			input(...ngDevMode ? [void 0, { debugName: "pButtonLabelUnstyled" }] : /* istanbul ignore next */ [])
		);
		_defineProperty(this, "$pcButtonLabel", (_inject3 = inject(BUTTON_LABEL_INSTANCE, {
			optional: true,
			skipSelf: true
		})) !== null && _inject3 !== void 0 ? _inject3 : void 0);
		_defineProperty(this, "bindDirectiveInstance", inject(Bind, { self: true }));
		effect(() => {
			const pt = this.pButtonLabelPT();
			if (pt) this.directivePT.set(pt);
		});
		effect(() => {
			if (this.pButtonLabelUnstyled()) this.directiveUnstyled.set(this.pButtonLabelUnstyled());
		});
	}
	onAfterViewChecked() {
		this.bindDirectiveInstance.setAttrs(this.ptms(["host", "root"]));
	}
};
_ButtonLabel = ButtonLabel;
_defineProperty(ButtonLabel, "ɵfac", function ButtonLabel_Factory(__ngFactoryType__) {
	return new (__ngFactoryType__ || _ButtonLabel)();
});
_defineProperty(ButtonLabel, "ɵdir", /*@__PURE__*/ ɵɵdefineDirective({
	type: _ButtonLabel,
	selectors: [[
		"",
		"pButtonLabel",
		""
	]],
	hostVars: 2,
	hostBindings: function ButtonLabel_HostBindings(rf, ctx) {
		if (rf & 2) ɵɵclassProp("p-button-label", !ctx.$unstyled() && true);
	},
	inputs: {
		pButtonLabelPT: [1, "pButtonLabelPT"],
		pButtonLabelUnstyled: [1, "pButtonLabelUnstyled"]
	},
	features: [
		ɵɵProvidersFeature([
			ButtonStyle,
			{
				provide: BUTTON_LABEL_INSTANCE,
				useExisting: _ButtonLabel
			},
			{
				provide: PARENT_INSTANCE,
				useExisting: _ButtonLabel
			}
		]),
		ɵɵHostDirectivesFeature([Bind]),
		ɵɵInheritDefinitionFeature
	]
}));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(ButtonLabel, [{
		type: Directive,
		args: [{
			selector: "[pButtonLabel]",
			providers: [
				ButtonStyle,
				{
					provide: BUTTON_LABEL_INSTANCE,
					useExisting: ButtonLabel
				},
				{
					provide: PARENT_INSTANCE,
					useExisting: ButtonLabel
				}
			],
			standalone: true,
			host: { "[class.p-button-label]": "!$unstyled() && true" },
			hostDirectives: [Bind]
		}]
	}], () => [], {
		pButtonLabelPT: [{
			type: Input,
			args: [{
				isSignal: true,
				alias: "pButtonLabelPT",
				required: false
			}]
		}],
		pButtonLabelUnstyled: [{
			type: Input,
			args: [{
				isSignal: true,
				alias: "pButtonLabelUnstyled",
				required: false
			}]
		}]
	});
})();
var BUTTON_DIRECTIVE_INSTANCE = new InjectionToken("BUTTON_DIRECTIVE_INSTANCE");
/**
* Button directive is an extension to button component.
* @group Directives
*/
var ButtonDirective = class extends BaseComponent {
	constructor() {
		var _inject4;
		super();
		_defineProperty(this, "componentName", "Button");
		_defineProperty(
			this,
			/**
			* Bound configuration object. Fields win over the individual styling inputs
			* (`text`, `raised`, `severity`, …); unset fields fall back to those inputs.
			* @group Props
			*/
			"pButton",
			input(void 0, ...ngDevMode ? [{ debugName: "pButton" }] : /* istanbul ignore next */ [])
		);
		_defineProperty(
			this,
			/**
			* Used to pass attributes to DOM elements inside the Button component.
			* @group Props
			*/
			"pButtonPT",
			input(...ngDevMode ? [void 0, { debugName: "pButtonPT" }] : /* istanbul ignore next */ [])
		);
		_defineProperty(
			this,
			/**
			* Indicates whether the component should be rendered without styles.
			* @group Props
			*/
			"pButtonUnstyled",
			input(...ngDevMode ? [void 0, { debugName: "pButtonUnstyled" }] : /* istanbul ignore next */ [])
		);
		_defineProperty(
			this,
			/**
			* @group Props
			*/
			"hostName",
			input("", ...ngDevMode ? [{ debugName: "hostName" }] : /* istanbul ignore next */ [])
		);
		_defineProperty(
			this,
			/**
			* Add a textual class to the button without a background initially.
			* @group Props
			*/
			"text",
			input(false, _objectSpread2(_objectSpread2({}, ngDevMode ? { debugName: "text" } : /* istanbul ignore next */ {}), {}, { transform: booleanAttribute }))
		);
		_defineProperty(
			this,
			/**
			* Add a plain textual class to the button without a background initially.
			* @group Props
			*/
			"plain",
			input(false, _objectSpread2(_objectSpread2({}, ngDevMode ? { debugName: "plain" } : /* istanbul ignore next */ {}), {}, { transform: booleanAttribute }))
		);
		_defineProperty(
			this,
			/**
			* Add a shadow to indicate elevation.
			* @group Props
			*/
			"raised",
			input(false, _objectSpread2(_objectSpread2({}, ngDevMode ? { debugName: "raised" } : /* istanbul ignore next */ {}), {}, { transform: booleanAttribute }))
		);
		_defineProperty(
			this,
			/**
			* Defines the size of the button.
			* @group Props
			*/
			"size",
			input(...ngDevMode ? [void 0, { debugName: "size" }] : /* istanbul ignore next */ [])
		);
		_defineProperty(
			this,
			/**
			* Add a border class without a background initially.
			* @group Props
			*/
			"outlined",
			input(false, _objectSpread2(_objectSpread2({}, ngDevMode ? { debugName: "outlined" } : /* istanbul ignore next */ {}), {}, { transform: booleanAttribute }))
		);
		_defineProperty(
			this,
			/**
			* Renders the button as a textual link without background or border.
			* @group Props
			*/
			"link",
			input(false, _objectSpread2(_objectSpread2({}, ngDevMode ? { debugName: "link" } : /* istanbul ignore next */ {}), {}, { transform: booleanAttribute }))
		);
		_defineProperty(
			this,
			/**
			* Add a circular border radius to the button.
			* @group Props
			*/
			"rounded",
			input(false, _objectSpread2(_objectSpread2({}, ngDevMode ? { debugName: "rounded" } : /* istanbul ignore next */ {}), {}, { transform: booleanAttribute }))
		);
		_defineProperty(
			this,
			/**
			* Spans 100% width of the container when enabled.
			* @group Props
			*/
			"fluid",
			input(void 0, _objectSpread2(_objectSpread2({}, ngDevMode ? { debugName: "fluid" } : /* istanbul ignore next */ {}), {}, { transform: booleanAttribute }))
		);
		_defineProperty(
			this,
			/**
			* Visual variant of the button. Equivalent to setting `text` or `outlined` individually.
			* @group Props
			*/
			"variant",
			input(...ngDevMode ? [void 0, { debugName: "variant" }] : /* istanbul ignore next */ [])
		);
		_defineProperty(
			this,
			/**
			* Forces icon-only styling regardless of content. Works with any direct icon child
			* (`<svg>`, `<i>`, custom).
			* @group Props
			*/
			"iconOnly",
			input(false, _objectSpread2(_objectSpread2({}, ngDevMode ? { debugName: "iconOnly" } : /* istanbul ignore next */ {}), {}, { transform: booleanAttribute }))
		);
		_defineProperty(
			this,
			/**
			* Whether the button is in loading state.
			* @deprecated Manage loading state with native `disabled` and a child spinner; this input will be removed in a future release.
			* @group Props
			*/
			"loading",
			input(false, _objectSpread2(_objectSpread2({}, ngDevMode ? { debugName: "loading" } : /* istanbul ignore next */ {}), {}, { transform: booleanAttribute }))
		);
		_defineProperty(
			this,
			/**
			* Defines the style of the button.
			* @group Props
			*/
			"severity",
			input(...ngDevMode ? [void 0, { debugName: "severity" }] : /* istanbul ignore next */ [])
		);
		_defineProperty(this, "$pcButtonDirective", (_inject4 = inject(BUTTON_DIRECTIVE_INSTANCE, {
			optional: true,
			skipSelf: true
		})) !== null && _inject4 !== void 0 ? _inject4 : void 0);
		_defineProperty(this, "bindDirectiveInstance", inject(Bind, { self: true }));
		_defineProperty(this, "pcFluid", inject(Fluid, {
			optional: true,
			host: true,
			skipSelf: true
		}));
		_defineProperty(this, "_componentStyle", inject(ButtonStyle));
		_defineProperty(this, "iconSignal", contentChild(ButtonIcon, _objectSpread2(_objectSpread2({}, ngDevMode ? { debugName: "iconSignal" } : /* istanbul ignore next */ {}), {}, { descendants: false })));
		_defineProperty(this, "labelSignal", contentChild(ButtonLabel, _objectSpread2(_objectSpread2({}, ngDevMode ? { debugName: "labelSignal" } : /* istanbul ignore next */ {}), {}, { descendants: false })));
		_defineProperty(
			this,
			/** @deprecated Use the `iconOnly` input instead. */
			"isIconOnly",
			computed(() => !!(!this.labelSignal() && this.iconSignal()), ...ngDevMode ? [{ debugName: "isIconOnly" }] : /* istanbul ignore next */ [])
		);
		_defineProperty(this, "styleClass", computed(() => {
			var _ref, _o$severity, _o$size, _o$variant, _ref2, _this$fluid2;
			if (this.$unstyled()) return "";
			const v = this.pButton();
			const o = typeof v === "object" && v !== null ? v : {};
			const stringSeverity = typeof v === "string" && v !== "" ? v : void 0;
			const severity = (_ref = (_o$severity = o.severity) !== null && _o$severity !== void 0 ? _o$severity : stringSeverity) !== null && _ref !== void 0 ? _ref : this.severity();
			const size = (_o$size = o.size) !== null && _o$size !== void 0 ? _o$size : this.size();
			const variant = (_o$variant = o.variant) !== null && _o$variant !== void 0 ? _o$variant : this.variant();
			const base = this.cn("p-button", "p-component", {
				"p-button-icon-only": this.iconOnly() || o.iconOnly || this.isIconOnly(),
				"p-button-loading": this.loading(),
				"p-disabled": this.loading(),
				"p-button-text": this.text() || variant === "text" || o.text,
				"p-button-outlined": this.outlined() || variant === "outlined" || o.outlined,
				"p-button-link": this.link() || variant === "link" || o.link,
				"p-button-plain": this.plain() || o.plain,
				"p-button-raised": this.raised() || o.raised,
				"p-button-rounded": this.rounded() || o.rounded,
				"p-button-sm": size === "small",
				"p-button-lg": size === "large",
				"p-button-fluid": (_ref2 = (_this$fluid2 = this.fluid()) !== null && _this$fluid2 !== void 0 ? _this$fluid2 : o.fluid) !== null && _ref2 !== void 0 ? _ref2 : !!this.pcFluid,
				[`p-button-${severity}`]: !!severity
			});
			return o.styleClass ? `${base} ${o.styleClass}` : base;
		}, ...ngDevMode ? [{ debugName: "styleClass" }] : /* istanbul ignore next */ []));
		_defineProperty(this, "hostStyle", computed(() => {
			var _o$style;
			const v = this.pButton();
			return (_o$style = (typeof v === "object" && v !== null ? v : {}).style) !== null && _o$style !== void 0 ? _o$style : null;
		}, ...ngDevMode ? [{ debugName: "hostStyle" }] : /* istanbul ignore next */ []));
		effect(() => {
			const pt = this.pButtonPT();
			if (pt) this.directivePT.set(pt);
		});
		effect(() => {
			const unstyled = this.pButtonUnstyled();
			if (unstyled !== void 0) this.directiveUnstyled.set(unstyled);
		});
	}
	onAfterViewChecked() {
		this.bindDirectiveInstance.setAttrs(this.ptm("root"));
	}
};
_ButtonDirective = ButtonDirective;
_defineProperty(ButtonDirective, "ɵfac", function ButtonDirective_Factory(__ngFactoryType__) {
	return new (__ngFactoryType__ || _ButtonDirective)();
});
_defineProperty(ButtonDirective, "ɵdir", /*@__PURE__*/ ɵɵdefineDirective({
	type: _ButtonDirective,
	selectors: [[
		"",
		"pButton",
		""
	]],
	contentQueries: function ButtonDirective_ContentQueries(rf, ctx, dirIndex) {
		if (rf & 1) ɵɵcontentQuerySignal(dirIndex, ctx.iconSignal, ButtonIcon, 4)(dirIndex, ctx.labelSignal, ButtonLabel, 4);
		if (rf & 2) ɵɵqueryAdvance(2);
	},
	hostVars: 4,
	hostBindings: function ButtonDirective_HostBindings(rf, ctx) {
		if (rf & 2) {
			ɵɵstyleMap(ctx.hostStyle());
			ɵɵclassMap(ctx.styleClass());
		}
	},
	inputs: {
		pButton: [1, "pButton"],
		pButtonPT: [1, "pButtonPT"],
		pButtonUnstyled: [1, "pButtonUnstyled"],
		hostName: [1, "hostName"],
		text: [1, "text"],
		plain: [1, "plain"],
		raised: [1, "raised"],
		size: [1, "size"],
		outlined: [1, "outlined"],
		link: [1, "link"],
		rounded: [1, "rounded"],
		fluid: [1, "fluid"],
		variant: [1, "variant"],
		iconOnly: [1, "iconOnly"],
		loading: [1, "loading"],
		severity: [1, "severity"]
	},
	features: [
		ɵɵProvidersFeature([
			ButtonStyle,
			{
				provide: BUTTON_DIRECTIVE_INSTANCE,
				useExisting: _ButtonDirective
			},
			{
				provide: PARENT_INSTANCE,
				useExisting: _ButtonDirective
			}
		]),
		ɵɵHostDirectivesFeature([Bind, Ripple]),
		ɵɵInheritDefinitionFeature
	]
}));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(ButtonDirective, [{
		type: Directive,
		args: [{
			selector: "[pButton]",
			standalone: true,
			providers: [
				ButtonStyle,
				{
					provide: BUTTON_DIRECTIVE_INSTANCE,
					useExisting: ButtonDirective
				},
				{
					provide: PARENT_INSTANCE,
					useExisting: ButtonDirective
				}
			],
			host: {
				"[class]": "styleClass()",
				"[style]": "hostStyle()"
			},
			hostDirectives: [Bind, Ripple]
		}]
	}], () => [], {
		pButton: [{
			type: Input,
			args: [{
				isSignal: true,
				alias: "pButton",
				required: false
			}]
		}],
		pButtonPT: [{
			type: Input,
			args: [{
				isSignal: true,
				alias: "pButtonPT",
				required: false
			}]
		}],
		pButtonUnstyled: [{
			type: Input,
			args: [{
				isSignal: true,
				alias: "pButtonUnstyled",
				required: false
			}]
		}],
		hostName: [{
			type: Input,
			args: [{
				isSignal: true,
				alias: "hostName",
				required: false
			}]
		}],
		text: [{
			type: Input,
			args: [{
				isSignal: true,
				alias: "text",
				required: false
			}]
		}],
		plain: [{
			type: Input,
			args: [{
				isSignal: true,
				alias: "plain",
				required: false
			}]
		}],
		raised: [{
			type: Input,
			args: [{
				isSignal: true,
				alias: "raised",
				required: false
			}]
		}],
		size: [{
			type: Input,
			args: [{
				isSignal: true,
				alias: "size",
				required: false
			}]
		}],
		outlined: [{
			type: Input,
			args: [{
				isSignal: true,
				alias: "outlined",
				required: false
			}]
		}],
		link: [{
			type: Input,
			args: [{
				isSignal: true,
				alias: "link",
				required: false
			}]
		}],
		rounded: [{
			type: Input,
			args: [{
				isSignal: true,
				alias: "rounded",
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
		variant: [{
			type: Input,
			args: [{
				isSignal: true,
				alias: "variant",
				required: false
			}]
		}],
		iconOnly: [{
			type: Input,
			args: [{
				isSignal: true,
				alias: "iconOnly",
				required: false
			}]
		}],
		loading: [{
			type: Input,
			args: [{
				isSignal: true,
				alias: "loading",
				required: false
			}]
		}],
		severity: [{
			type: Input,
			args: [{
				isSignal: true,
				alias: "severity",
				required: false
			}]
		}],
		iconSignal: [{
			type: ContentChild,
			args: [forwardRef(() => ButtonIcon), _objectSpread2(_objectSpread2({}, { descendants: false }), {}, { isSignal: true })]
		}],
		labelSignal: [{
			type: ContentChild,
			args: [forwardRef(() => ButtonLabel), _objectSpread2(_objectSpread2({}, { descendants: false }), {}, { isSignal: true })]
		}]
	});
})();
var ButtonModule = class {};
_ButtonModule = ButtonModule;
_defineProperty(ButtonModule, "ɵfac", function ButtonModule_Factory(__ngFactoryType__) {
	return new (__ngFactoryType__ || _ButtonModule)();
});
_defineProperty(ButtonModule, "ɵmod", /*@__PURE__*/ ɵɵdefineNgModule({
	type: _ButtonModule,
	imports: [
		ButtonDirective,
		Button,
		ButtonLabel,
		ButtonIcon
	],
	exports: [
		ButtonDirective,
		Button,
		ButtonLabel,
		ButtonIcon
	]
}));
_defineProperty(ButtonModule, "ɵinj", /*@__PURE__*/ ɵɵdefineInjector({ imports: [Button] }));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(ButtonModule, [{
		type: NgModule,
		args: [{
			imports: [
				ButtonDirective,
				Button,
				ButtonLabel,
				ButtonIcon
			],
			exports: [
				ButtonDirective,
				Button,
				ButtonLabel,
				ButtonIcon
			]
		}]
	}], null, null);
})();
//#endregion
export { BUTTON_ICON_INSTANCE, BUTTON_INSTANCE, BUTTON_LABEL_INSTANCE, Button, ButtonClasses, ButtonDirective, ButtonIcon, ButtonLabel, ButtonModule, ButtonStyle };
