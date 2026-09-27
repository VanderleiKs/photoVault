import { n as _defineProperty } from "./objectSpread2-weooBxVk.js";
import { Dr as ViewEncapsulation, Fn as Injectable, Ml as ɵɵdefineInjectable, Nl as ɵɵdefineInjector, Sa as ɵɵclassMap, Wi as setClassMetadata, an as ChangeDetectionStrategy, ao as ɵɵdefineNgModule, ca as ɵɵInheritDefinitionFeature, cn as Component, cs as ɵɵprojectionDef, jc as InjectionToken, jo as ɵɵgetInheritedFactory, pl as inject, qn as NgModule, ro as ɵɵdefineComponent, sa as ɵɵHostDirectivesFeature, ss as ɵɵprojection, ua as ɵɵProvidersFeature } from "./core-C91JEChX.js";
import { t as Bind } from "./openng-optimus-ui-bind-D2jYyy13.js";
import { a as BaseStyle } from "./openng-optimus-ui-config-BMpCoNuW.js";
import { n as PARENT_INSTANCE, t as BaseComponent } from "./openng-optimus-ui-basecomponent-BY4sBzp9.js";
//#region node_modules/@openng/optimus-ui/fesm2022/openng-optimus-ui-fluid.mjs
var _FluidStyle;
var _Fluid;
var _FluidModule;
var classes = { root: "p-fluid" };
var FluidStyle = class extends BaseStyle {
	constructor(..._args) {
		super(..._args);
		_defineProperty(this, "name", "fluid");
		_defineProperty(this, "classes", classes);
	}
};
_FluidStyle = FluidStyle;
_defineProperty(FluidStyle, "ɵfac", /*@__PURE__*/ (() => {
	let ɵFluidStyle_BaseFactory = void 0;
	return function FluidStyle_Factory(__ngFactoryType__) {
		return (ɵFluidStyle_BaseFactory || (ɵFluidStyle_BaseFactory = ɵɵgetInheritedFactory(_FluidStyle)))(__ngFactoryType__ || _FluidStyle);
	};
})());
_defineProperty(FluidStyle, "ɵprov", /*@__PURE__*/ ɵɵdefineInjectable({
	token: _FluidStyle,
	factory: _FluidStyle.ɵfac
}));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(FluidStyle, [{ type: Injectable }], null, null);
})();
/**
*
* Fluid is a layout component to make descendant components span full width of their container.
*
* [Live Demo](https://optimus.openng.org/fluid/)
*
* @module fluidstyle
*
*/
var FluidClasses;
(function(FluidClasses) {
	/**
	* Class name of the root element
	*/
	FluidClasses["root"] = "p-fluid";
})(FluidClasses || (FluidClasses = {}));
var FLUID_INSTANCE = new InjectionToken("FLUID_INSTANCE");
/**
* Fluid is a layout component to make descendant components span full width of their container.
* @group Components
*/
var Fluid = class extends BaseComponent {
	constructor(..._args2) {
		var _inject;
		super(..._args2);
		_defineProperty(this, "componentName", "Fluid");
		_defineProperty(this, "$pcFluid", (_inject = inject(FLUID_INSTANCE, {
			optional: true,
			skipSelf: true
		})) !== null && _inject !== void 0 ? _inject : void 0);
		_defineProperty(this, "bindDirectiveInstance", inject(Bind, { self: true }));
		_defineProperty(this, "_componentStyle", inject(FluidStyle));
	}
	onAfterViewChecked() {
		this.bindDirectiveInstance.setAttrs(this.ptms(["host", "root"]));
	}
};
_Fluid = Fluid;
_defineProperty(Fluid, "ɵfac", /*@__PURE__*/ (() => {
	let ɵFluid_BaseFactory = void 0;
	return function Fluid_Factory(__ngFactoryType__) {
		return (ɵFluid_BaseFactory || (ɵFluid_BaseFactory = ɵɵgetInheritedFactory(_Fluid)))(__ngFactoryType__ || _Fluid);
	};
})());
_defineProperty(Fluid, "ɵcmp", (function() {
	return /*@__PURE__*/ ɵɵdefineComponent({
		type: _Fluid,
		selectors: [["p-fluid"]],
		hostVars: 2,
		hostBindings: function Fluid_HostBindings(rf, ctx) {
			if (rf & 2) ɵɵclassMap(ctx.cx("root"));
		},
		features: [
			ɵɵProvidersFeature([
				FluidStyle,
				{
					provide: FLUID_INSTANCE,
					useExisting: _Fluid
				},
				{
					provide: PARENT_INSTANCE,
					useExisting: _Fluid
				}
			]),
			ɵɵHostDirectivesFeature([Bind]),
			ɵɵInheritDefinitionFeature
		],
		ngContentSelectors: ["*"],
		decls: 1,
		vars: 0,
		template: function Fluid_Template(rf, ctx) {
			if (rf & 1) {
				ɵɵprojectionDef();
				ɵɵprojection(0);
			}
		},
		encapsulation: 2
	});
})());
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(Fluid, [{
		type: Component,
		args: [{
			selector: "p-fluid",
			template: ` <ng-content></ng-content> `,
			standalone: true,
			imports: [],
			changeDetection: ChangeDetectionStrategy.OnPush,
			encapsulation: ViewEncapsulation.None,
			providers: [
				FluidStyle,
				{
					provide: FLUID_INSTANCE,
					useExisting: Fluid
				},
				{
					provide: PARENT_INSTANCE,
					useExisting: Fluid
				}
			],
			host: { "[class]": "cx('root')" },
			hostDirectives: [Bind]
		}]
	}], null, null);
})();
var FluidModule = class {};
_FluidModule = FluidModule;
_defineProperty(FluidModule, "ɵfac", function FluidModule_Factory(__ngFactoryType__) {
	return new (__ngFactoryType__ || _FluidModule)();
});
_defineProperty(FluidModule, "ɵmod", /*@__PURE__*/ ɵɵdefineNgModule({
	type: _FluidModule,
	imports: [Fluid],
	exports: [Fluid]
}));
_defineProperty(FluidModule, "ɵinj", /*@__PURE__*/ ɵɵdefineInjector({}));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(FluidModule, [{
		type: NgModule,
		args: [{
			imports: [Fluid],
			exports: [Fluid]
		}]
	}], null, null);
})();
//#endregion
export { Fluid as t };
