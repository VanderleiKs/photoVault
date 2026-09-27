import { n as _defineProperty } from "./objectSpread2-weooBxVk.js";
import { $o as ɵɵloadQuery, Co as ɵɵelementStart, Da as ɵɵconditionalCreate, Dl as signal, Dr as ViewEncapsulation, Fn as Injectable, Gs as ɵɵtemplate, In as Input, Ml as ɵɵdefineInjectable, Nl as ɵɵdefineInjector, Oa as ɵɵcontentQuery, Sa as ɵɵclassMap, So as ɵɵelementEnd, Ta as ɵɵconditional, Vs as ɵɵstyleMap, Wi as setClassMetadata, Ys as ɵɵtextInterpolate1, a as ContentChildren, an as ChangeDetectionStrategy, ao as ɵɵdefineNgModule, ca as ɵɵInheritDefinitionFeature, cn as Component, cs as ɵɵprojectionDef, da as ɵɵadvance, es as ɵɵnextContext, i as ContentChild, jc as InjectionToken, jo as ɵɵgetInheritedFactory, ls as ɵɵproperty, pl as inject, qn as NgModule, qs as ɵɵtext, ro as ɵɵdefineComponent, sa as ɵɵHostDirectivesFeature, ss as ɵɵprojection, ua as ɵɵProvidersFeature, xs as ɵɵqueryRefresh, yo as ɵɵelementContainer } from "./core-C91JEChX.js";
import "./common-C2OsAfsp.js";
import { i as NgTemplateOutlet, t as CommonModule } from "./_common_module-chunk-CeoAXkM2.js";
import { n as BindModule, t as Bind } from "./openng-optimus-ui-bind-D2jYyy13.js";
import { p as s } from "./dist-CbKW6MfK.js";
import { a as BaseStyle } from "./openng-optimus-ui-config-BMpCoNuW.js";
import { n as PARENT_INSTANCE, t as BaseComponent } from "./openng-optimus-ui-basecomponent-BY4sBzp9.js";
import { Footer, Header, PrimeTemplate, SharedModule } from "./@openng_optimus-ui_api.js";
//#region node_modules/@openng/optimus-ui-styles/dist/card/index.mjs
var style$1 = `
    .p-card {
        background: dt('card.background');
        color: dt('card.color');
        box-shadow: dt('card.shadow');
        border-radius: dt('card.border.radius');
        display: flex;
        flex-direction: column;
    }

    .p-card-caption {
        display: flex;
        flex-direction: column;
        gap: dt('card.caption.gap');
    }

    .p-card-body {
        padding: dt('card.body.padding');
        display: flex;
        flex-direction: column;
        gap: dt('card.body.gap');
    }

    .p-card-title {
        font-size: dt('card.title.font.size');
        font-weight: dt('card.title.font.weight');
    }

    .p-card-subtitle {
        color: dt('card.subtitle.color');
    }
`;
//#endregion
//#region node_modules/@openng/optimus-ui/fesm2022/openng-optimus-ui-card.mjs
var _CardStyle;
var _Card;
var _CardModule;
var style = `
    ${style$1}

    .p-card {
        display: block;
    }
`;
var classes = {
	root: "p-card p-component",
	header: "p-card-header",
	body: "p-card-body",
	caption: "p-card-caption",
	title: "p-card-title",
	subtitle: "p-card-subtitle",
	content: "p-card-content",
	footer: "p-card-footer"
};
var CardStyle = class extends BaseStyle {
	constructor(..._args) {
		super(..._args);
		_defineProperty(this, "name", "card");
		_defineProperty(this, "style", style);
		_defineProperty(this, "classes", classes);
	}
};
_CardStyle = CardStyle;
_defineProperty(CardStyle, "ɵfac", /*@__PURE__*/ (() => {
	let ɵCardStyle_BaseFactory = void 0;
	return function CardStyle_Factory(__ngFactoryType__) {
		return (ɵCardStyle_BaseFactory || (ɵCardStyle_BaseFactory = ɵɵgetInheritedFactory(_CardStyle)))(__ngFactoryType__ || _CardStyle);
	};
})());
_defineProperty(CardStyle, "ɵprov", /*@__PURE__*/ ɵɵdefineInjectable({
	token: _CardStyle,
	factory: _CardStyle.ɵfac
}));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(CardStyle, [{ type: Injectable }], null, null);
})();
/**
*
* Card is a flexible container component.
*
* [Live Demo](https://optimus.openng.org/card/)
*
* @module cardstyle
*
*/
var CardClasses;
(function(CardClasses) {
	/**
	* Class name of the root element
	*/
	CardClasses["root"] = "p-card";
	/**
	* Class name of the header element
	*/
	CardClasses["header"] = "p-card-header";
	/**
	* Class name of the body element
	*/
	CardClasses["body"] = "p-card-body";
	/**
	* Class name of the caption element
	*/
	CardClasses["caption"] = "p-card-caption";
	/**
	* Class name of the title element
	*/
	CardClasses["title"] = "p-card-title";
	/**
	* Class name of the subtitle element
	*/
	CardClasses["subtitle"] = "p-card-subtitle";
	/**
	* Class name of the content element
	*/
	CardClasses["content"] = "p-card-content";
	/**
	* Class name of the footer element
	*/
	CardClasses["footer"] = "p-card-footer";
})(CardClasses || (CardClasses = {}));
var CARD_INSTANCE = new InjectionToken("CARD_INSTANCE");
/**
* Card is a flexible container component.
* @group Components
*/
var Card = class extends BaseComponent {
	constructor(..._args2) {
		var _inject;
		super(..._args2);
		_defineProperty(this, "componentName", "Card");
		_defineProperty(this, "$pcCard", (_inject = inject(CARD_INSTANCE, {
			optional: true,
			skipSelf: true
		})) !== null && _inject !== void 0 ? _inject : void 0);
		_defineProperty(this, "bindDirectiveInstance", inject(Bind, { self: true }));
		_defineProperty(this, "_componentStyle", inject(CardStyle));
		_defineProperty(
			this,
			/**
			* Header of the card.
			* @group Props
			*/
			"header",
			void 0
		);
		_defineProperty(
			this,
			/**
			* Subheader of the card.
			* @group Props
			*/
			"subheader",
			void 0
		);
		_defineProperty(
			this,
			/**
			* Class of the element.
			* @deprecated since v20.0.0, use `class` instead.
			* @group Props
			*/
			"styleClass",
			void 0
		);
		_defineProperty(this, "headerFacet", void 0);
		_defineProperty(this, "footerFacet", void 0);
		_defineProperty(
			this,
			/**
			* Custom header template.
			* @group Templates
			*/
			"headerTemplate",
			void 0
		);
		_defineProperty(
			this,
			/**
			* Custom title template.
			* @group Templates
			*/
			"titleTemplate",
			void 0
		);
		_defineProperty(
			this,
			/**
			* Custom subtitle template.
			* @group Templates
			*/
			"subtitleTemplate",
			void 0
		);
		_defineProperty(
			this,
			/**
			* Custom content template.
			* @group Templates
			*/
			"contentTemplate",
			void 0
		);
		_defineProperty(
			this,
			/**
			* Custom footer template.
			* @group Templates
			*/
			"footerTemplate",
			void 0
		);
		_defineProperty(this, "_headerTemplate", void 0);
		_defineProperty(this, "_titleTemplate", void 0);
		_defineProperty(this, "_subtitleTemplate", void 0);
		_defineProperty(this, "_contentTemplate", void 0);
		_defineProperty(this, "_footerTemplate", void 0);
		_defineProperty(this, "_style", signal(null, ...ngDevMode ? [{ debugName: "_style" }] : /* istanbul ignore next */ []));
		_defineProperty(this, "templates", void 0);
	}
	onAfterViewChecked() {
		this.bindDirectiveInstance.setAttrs(this.ptms(["host", "root"]));
	}
	/**
	* Inline style of the element.
	* @group Props
	*/
	set style(value) {
		if (!s(this._style(), value)) {
			var _this$el;
			this._style.set(value);
			if ((_this$el = this.el) === null || _this$el === void 0 ? void 0 : _this$el.nativeElement) {
				if (value) Object.keys(value).forEach((key) => {
					this.el.nativeElement.style[key] = value[key];
				});
			}
		}
	}
	get style() {
		return this._style();
	}
	getBlockableElement() {
		return this.el.nativeElement;
	}
	onAfterContentInit() {
		this.templates.forEach((item) => {
			switch (item.getType()) {
				case "header":
					this._headerTemplate = item.template;
					break;
				case "title":
					this._titleTemplate = item.template;
					break;
				case "subtitle":
					this._subtitleTemplate = item.template;
					break;
				case "content":
					this._contentTemplate = item.template;
					break;
				case "footer":
					this._footerTemplate = item.template;
					break;
				default: this._contentTemplate = item.template;
			}
		});
	}
};
_Card = Card;
_defineProperty(Card, "ɵfac", /*@__PURE__*/ (() => {
	let ɵCard_BaseFactory = void 0;
	return function Card_Factory(__ngFactoryType__) {
		return (ɵCard_BaseFactory || (ɵCard_BaseFactory = ɵɵgetInheritedFactory(_Card)))(__ngFactoryType__ || _Card);
	};
})());
_defineProperty(Card, "ɵcmp", (function() {
	const _c0 = ["header"];
	const _c1 = ["title"];
	const _c2 = ["subtitle"];
	const _c3 = ["content"];
	const _c4 = ["footer"];
	const _c5 = [
		"*",
		[["p-header"]],
		[["p-footer"]]
	];
	const _c6 = [
		"*",
		"p-header",
		"p-footer"
	];
	function Card_Conditional_0_ng_container_2_Template(rf, ctx) {
		if (rf & 1) ɵɵelementContainer(0);
	}
	function Card_Conditional_0_Template(rf, ctx) {
		if (rf & 1) {
			ɵɵelementStart(0, "div", 1);
			ɵɵprojection(1, 1);
			ɵɵtemplate(2, Card_Conditional_0_ng_container_2_Template, 1, 0, "ng-container", 2);
			ɵɵelementEnd();
		}
		if (rf & 2) {
			const ctx_r0 = ɵɵnextContext();
			ɵɵclassMap(ctx_r0.cx("header"));
			ɵɵproperty("pBind", ctx_r0.ptm("header"));
			ɵɵadvance(2);
			ɵɵproperty("ngTemplateOutlet", ctx_r0.headerTemplate || ctx_r0._headerTemplate);
		}
	}
	function Card_Conditional_2_Conditional_1_Template(rf, ctx) {
		if (rf & 1) ɵɵtext(0);
		if (rf & 2) {
			const ctx_r0 = ɵɵnextContext(2);
			ɵɵtextInterpolate1(" ", ctx_r0.header, " ");
		}
	}
	function Card_Conditional_2_ng_container_2_Template(rf, ctx) {
		if (rf & 1) ɵɵelementContainer(0);
	}
	function Card_Conditional_2_Template(rf, ctx) {
		if (rf & 1) {
			ɵɵelementStart(0, "div", 1);
			ɵɵconditionalCreate(1, Card_Conditional_2_Conditional_1_Template, 1, 1);
			ɵɵtemplate(2, Card_Conditional_2_ng_container_2_Template, 1, 0, "ng-container", 2);
			ɵɵelementEnd();
		}
		if (rf & 2) {
			const ctx_r0 = ɵɵnextContext();
			ɵɵclassMap(ctx_r0.cx("title"));
			ɵɵproperty("pBind", ctx_r0.ptm("title"));
			ɵɵadvance();
			ɵɵconditional(ctx_r0.header && !ctx_r0._titleTemplate && !ctx_r0.titleTemplate ? 1 : -1);
			ɵɵadvance();
			ɵɵproperty("ngTemplateOutlet", ctx_r0.titleTemplate || ctx_r0._titleTemplate);
		}
	}
	function Card_Conditional_3_Conditional_1_Template(rf, ctx) {
		if (rf & 1) ɵɵtext(0);
		if (rf & 2) {
			const ctx_r0 = ɵɵnextContext(2);
			ɵɵtextInterpolate1(" ", ctx_r0.subheader, " ");
		}
	}
	function Card_Conditional_3_ng_container_2_Template(rf, ctx) {
		if (rf & 1) ɵɵelementContainer(0);
	}
	function Card_Conditional_3_Template(rf, ctx) {
		if (rf & 1) {
			ɵɵelementStart(0, "div", 1);
			ɵɵconditionalCreate(1, Card_Conditional_3_Conditional_1_Template, 1, 1);
			ɵɵtemplate(2, Card_Conditional_3_ng_container_2_Template, 1, 0, "ng-container", 2);
			ɵɵelementEnd();
		}
		if (rf & 2) {
			const ctx_r0 = ɵɵnextContext();
			ɵɵclassMap(ctx_r0.cx("subtitle"));
			ɵɵproperty("pBind", ctx_r0.ptm("subtitle"));
			ɵɵadvance();
			ɵɵconditional(ctx_r0.subheader && !ctx_r0._subtitleTemplate && !ctx_r0.subtitleTemplate ? 1 : -1);
			ɵɵadvance();
			ɵɵproperty("ngTemplateOutlet", ctx_r0.subtitleTemplate || ctx_r0._subtitleTemplate);
		}
	}
	function Card_ng_container_6_Template(rf, ctx) {
		if (rf & 1) ɵɵelementContainer(0);
	}
	function Card_Conditional_7_ng_container_2_Template(rf, ctx) {
		if (rf & 1) ɵɵelementContainer(0);
	}
	function Card_Conditional_7_Template(rf, ctx) {
		if (rf & 1) {
			ɵɵelementStart(0, "div", 1);
			ɵɵprojection(1, 2);
			ɵɵtemplate(2, Card_Conditional_7_ng_container_2_Template, 1, 0, "ng-container", 2);
			ɵɵelementEnd();
		}
		if (rf & 2) {
			const ctx_r0 = ɵɵnextContext();
			ɵɵclassMap(ctx_r0.cx("footer"));
			ɵɵproperty("pBind", ctx_r0.ptm("footer"));
			ɵɵadvance(2);
			ɵɵproperty("ngTemplateOutlet", ctx_r0.footerTemplate || ctx_r0._footerTemplate);
		}
	}
	return /*@__PURE__*/ ɵɵdefineComponent({
		type: _Card,
		selectors: [["p-card"]],
		contentQueries: function Card_ContentQueries(rf, ctx, dirIndex) {
			if (rf & 1) ɵɵcontentQuery(dirIndex, Header, 5)(dirIndex, Footer, 5)(dirIndex, _c0, 4)(dirIndex, _c1, 4)(dirIndex, _c2, 4)(dirIndex, _c3, 4)(dirIndex, _c4, 4)(dirIndex, PrimeTemplate, 4);
			if (rf & 2) {
				let _t = void 0;
				ɵɵqueryRefresh(_t = ɵɵloadQuery()) && (ctx.headerFacet = _t.first);
				ɵɵqueryRefresh(_t = ɵɵloadQuery()) && (ctx.footerFacet = _t.first);
				ɵɵqueryRefresh(_t = ɵɵloadQuery()) && (ctx.headerTemplate = _t.first);
				ɵɵqueryRefresh(_t = ɵɵloadQuery()) && (ctx.titleTemplate = _t.first);
				ɵɵqueryRefresh(_t = ɵɵloadQuery()) && (ctx.subtitleTemplate = _t.first);
				ɵɵqueryRefresh(_t = ɵɵloadQuery()) && (ctx.contentTemplate = _t.first);
				ɵɵqueryRefresh(_t = ɵɵloadQuery()) && (ctx.footerTemplate = _t.first);
				ɵɵqueryRefresh(_t = ɵɵloadQuery()) && (ctx.templates = _t);
			}
		},
		hostVars: 4,
		hostBindings: function Card_HostBindings(rf, ctx) {
			if (rf & 2) {
				ɵɵstyleMap(ctx._style());
				ɵɵclassMap(ctx.cn(ctx.cx("root"), ctx.styleClass));
			}
		},
		inputs: {
			header: "header",
			subheader: "subheader",
			style: "style",
			styleClass: "styleClass"
		},
		features: [
			ɵɵProvidersFeature([
				CardStyle,
				{
					provide: CARD_INSTANCE,
					useExisting: _Card
				},
				{
					provide: PARENT_INSTANCE,
					useExisting: _Card
				}
			]),
			ɵɵHostDirectivesFeature([Bind]),
			ɵɵInheritDefinitionFeature
		],
		ngContentSelectors: _c6,
		decls: 8,
		vars: 11,
		consts: [
			[
				3,
				"pBind",
				"class"
			],
			[3, "pBind"],
			[4, "ngTemplateOutlet"]
		],
		template: function Card_Template(rf, ctx) {
			if (rf & 1) {
				ɵɵprojectionDef(_c5);
				ɵɵconditionalCreate(0, Card_Conditional_0_Template, 3, 4, "div", 0);
				ɵɵelementStart(1, "div", 1);
				ɵɵconditionalCreate(2, Card_Conditional_2_Template, 3, 5, "div", 0);
				ɵɵconditionalCreate(3, Card_Conditional_3_Template, 3, 5, "div", 0);
				ɵɵelementStart(4, "div", 1);
				ɵɵprojection(5);
				ɵɵtemplate(6, Card_ng_container_6_Template, 1, 0, "ng-container", 2);
				ɵɵelementEnd();
				ɵɵconditionalCreate(7, Card_Conditional_7_Template, 3, 4, "div", 0);
				ɵɵelementEnd();
			}
			if (rf & 2) {
				ɵɵconditional(ctx.headerFacet || ctx.headerTemplate || ctx._headerTemplate ? 0 : -1);
				ɵɵadvance();
				ɵɵclassMap(ctx.cx("body"));
				ɵɵproperty("pBind", ctx.ptm("body"));
				ɵɵadvance();
				ɵɵconditional(ctx.header || ctx.titleTemplate || ctx._titleTemplate ? 2 : -1);
				ɵɵadvance();
				ɵɵconditional(ctx.subheader || ctx.subtitleTemplate || ctx._subtitleTemplate ? 3 : -1);
				ɵɵadvance();
				ɵɵclassMap(ctx.cx("content"));
				ɵɵproperty("pBind", ctx.ptm("content"));
				ɵɵadvance(2);
				ɵɵproperty("ngTemplateOutlet", ctx.contentTemplate || ctx._contentTemplate);
				ɵɵadvance();
				ɵɵconditional(ctx.footerFacet || ctx.footerTemplate || ctx._footerTemplate ? 7 : -1);
			}
		},
		dependencies: [
			CommonModule,
			NgTemplateOutlet,
			SharedModule,
			BindModule,
			Bind
		],
		encapsulation: 2
	});
})());
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(Card, [{
		type: Component,
		args: [{
			selector: "p-card",
			standalone: true,
			imports: [
				CommonModule,
				SharedModule,
				BindModule
			],
			template: `
        @if (headerFacet || headerTemplate || _headerTemplate) {
            <div [pBind]="ptm('header')" [class]="cx('header')">
                <ng-content select="p-header"></ng-content>
                <ng-container *ngTemplateOutlet="headerTemplate || _headerTemplate"></ng-container>
            </div>
        }
        <div [pBind]="ptm('body')" [class]="cx('body')">
            @if (header || titleTemplate || _titleTemplate) {
                <div [pBind]="ptm('title')" [class]="cx('title')">
                    @if (header && !_titleTemplate && !titleTemplate) {
                        {{ header }}
                    }
                    <ng-container *ngTemplateOutlet="titleTemplate || _titleTemplate"></ng-container>
                </div>
            }
            @if (subheader || subtitleTemplate || _subtitleTemplate) {
                <div [pBind]="ptm('subtitle')" [class]="cx('subtitle')">
                    @if (subheader && !_subtitleTemplate && !subtitleTemplate) {
                        {{ subheader }}
                    }
                    <ng-container *ngTemplateOutlet="subtitleTemplate || _subtitleTemplate"></ng-container>
                </div>
            }
            <div [pBind]="ptm('content')" [class]="cx('content')">
                <ng-content></ng-content>
                <ng-container *ngTemplateOutlet="contentTemplate || _contentTemplate"></ng-container>
            </div>
            @if (footerFacet || footerTemplate || _footerTemplate) {
                <div [pBind]="ptm('footer')" [class]="cx('footer')">
                    <ng-content select="p-footer"></ng-content>
                    <ng-container *ngTemplateOutlet="footerTemplate || _footerTemplate"></ng-container>
                </div>
            }
        </div>
    `,
			changeDetection: ChangeDetectionStrategy.OnPush,
			encapsulation: ViewEncapsulation.None,
			providers: [
				CardStyle,
				{
					provide: CARD_INSTANCE,
					useExisting: Card
				},
				{
					provide: PARENT_INSTANCE,
					useExisting: Card
				}
			],
			host: {
				"[class]": "cn(cx('root'), styleClass)",
				"[style]": "_style()"
			},
			hostDirectives: [Bind]
		}]
	}], null, {
		header: [{ type: Input }],
		subheader: [{ type: Input }],
		style: [{ type: Input }],
		styleClass: [{ type: Input }],
		headerFacet: [{
			type: ContentChild,
			args: [Header]
		}],
		footerFacet: [{
			type: ContentChild,
			args: [Footer]
		}],
		headerTemplate: [{
			type: ContentChild,
			args: ["header", { descendants: false }]
		}],
		titleTemplate: [{
			type: ContentChild,
			args: ["title", { descendants: false }]
		}],
		subtitleTemplate: [{
			type: ContentChild,
			args: ["subtitle", { descendants: false }]
		}],
		contentTemplate: [{
			type: ContentChild,
			args: ["content", { descendants: false }]
		}],
		footerTemplate: [{
			type: ContentChild,
			args: ["footer", { descendants: false }]
		}],
		templates: [{
			type: ContentChildren,
			args: [PrimeTemplate]
		}]
	});
})();
var CardModule = class {};
_CardModule = CardModule;
_defineProperty(CardModule, "ɵfac", function CardModule_Factory(__ngFactoryType__) {
	return new (__ngFactoryType__ || _CardModule)();
});
_defineProperty(CardModule, "ɵmod", /*@__PURE__*/ ɵɵdefineNgModule({
	type: _CardModule,
	imports: [
		Card,
		SharedModule,
		BindModule
	],
	exports: [
		Card,
		SharedModule,
		BindModule
	]
}));
_defineProperty(CardModule, "ɵinj", /*@__PURE__*/ ɵɵdefineInjector({ imports: [
	Card,
	SharedModule,
	BindModule,
	SharedModule,
	BindModule
] }));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(CardModule, [{
		type: NgModule,
		args: [{
			imports: [
				Card,
				SharedModule,
				BindModule
			],
			exports: [
				Card,
				SharedModule,
				BindModule
			]
		}]
	}], null, null);
})();
//#endregion
export { Card, CardClasses, CardModule, CardStyle };
