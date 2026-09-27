import { n as _defineProperty } from "./objectSpread2-weooBxVk.js";
import { Fn as Injectable, Gl as Subject, In as Input, Ml as ɵɵdefineInjectable, Nl as ɵɵdefineInjector, Wi as setClassMetadata, an as ChangeDetectionStrategy, ao as ɵɵdefineNgModule, cn as Component, co as ɵɵdirectiveInject, cs as ɵɵprojectionDef, io as ɵɵdefineDirective, qn as NgModule, ro as ɵɵdefineComponent, ss as ɵɵprojection, vr as TemplateRef, wn as Directive } from "./core-C91JEChX.js";
import "./common-C2OsAfsp.js";
import { t as CommonModule } from "./_common_module-chunk-CeoAXkM2.js";
import { f as o, p as s, r as N } from "./dist-CbKW6MfK.js";
//#region node_modules/@openng/optimus-ui/fesm2022/openng-optimus-ui-api.mjs
var _ConfirmationService;
var _ContextMenuService;
var _FilterService;
var _MessageService;
var _OverlayService;
var _Header;
var _Footer;
var _PrimeTemplate;
var _SharedModule;
var _TreeDragDropService;
/**
* Type of the confirm event.
*/
var ConfirmEventType;
(function(ConfirmEventType) {
	ConfirmEventType[ConfirmEventType["ACCEPT"] = 0] = "ACCEPT";
	ConfirmEventType[ConfirmEventType["REJECT"] = 1] = "REJECT";
	ConfirmEventType[ConfirmEventType["CANCEL"] = 2] = "CANCEL";
})(ConfirmEventType || (ConfirmEventType = {}));
/**
* Methods used in confirmation service.
* @group Service
*/
var ConfirmationService = class {
	constructor() {
		_defineProperty(this, "requireConfirmationSource", new Subject());
		_defineProperty(this, "acceptConfirmationSource", new Subject());
		_defineProperty(this, "requireConfirmation$", this.requireConfirmationSource.asObservable());
		_defineProperty(this, "accept", this.acceptConfirmationSource.asObservable());
	}
	/**
	* Callback to invoke on confirm.
	* @param {Confirmation} confirmation - Represents a confirmation dialog configuration.
	* @group Method
	*/
	confirm(confirmation) {
		this.requireConfirmationSource.next(confirmation);
		return this;
	}
	/**
	* Closes the dialog.
	* @group Method
	*/
	close() {
		this.requireConfirmationSource.next(null);
		return this;
	}
	/**
	* Accepts the dialog.
	* @group Method
	*/
	onAccept() {
		this.acceptConfirmationSource.next(null);
	}
};
_ConfirmationService = ConfirmationService;
_defineProperty(ConfirmationService, "ɵfac", function ConfirmationService_Factory(__ngFactoryType__) {
	return new (__ngFactoryType__ || _ConfirmationService)();
});
_defineProperty(ConfirmationService, "ɵprov", /*@__PURE__*/ ɵɵdefineInjectable({
	token: _ConfirmationService,
	factory: _ConfirmationService.ɵfac
}));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(ConfirmationService, [{ type: Injectable }], null, null);
})();
var ContextMenuService = class {
	constructor() {
		_defineProperty(this, "activeItemKeyChange", new Subject());
		_defineProperty(this, "activeItemKeyChange$", this.activeItemKeyChange.asObservable());
		_defineProperty(this, "activeItemKey", void 0);
	}
	changeKey(key) {
		this.activeItemKey = key;
		this.activeItemKeyChange.next(this.activeItemKey);
	}
	reset() {
		this.activeItemKey = null;
		this.activeItemKeyChange.next(this.activeItemKey);
	}
};
_ContextMenuService = ContextMenuService;
_defineProperty(ContextMenuService, "ɵfac", function ContextMenuService_Factory(__ngFactoryType__) {
	return new (__ngFactoryType__ || _ContextMenuService)();
});
_defineProperty(ContextMenuService, "ɵprov", /*@__PURE__*/ ɵɵdefineInjectable({
	token: _ContextMenuService,
	factory: _ContextMenuService.ɵfac
}));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(ContextMenuService, [{ type: Injectable }], null, null);
})();
var FilterMatchMode = class {};
_defineProperty(FilterMatchMode, "STARTS_WITH", "startsWith");
_defineProperty(FilterMatchMode, "CONTAINS", "contains");
_defineProperty(FilterMatchMode, "NOT_CONTAINS", "notContains");
_defineProperty(FilterMatchMode, "ENDS_WITH", "endsWith");
_defineProperty(FilterMatchMode, "EQUALS", "equals");
_defineProperty(FilterMatchMode, "NOT_EQUALS", "notEquals");
_defineProperty(FilterMatchMode, "IN", "in");
_defineProperty(FilterMatchMode, "LESS_THAN", "lt");
_defineProperty(FilterMatchMode, "LESS_THAN_OR_EQUAL_TO", "lte");
_defineProperty(FilterMatchMode, "GREATER_THAN", "gt");
_defineProperty(FilterMatchMode, "GREATER_THAN_OR_EQUAL_TO", "gte");
_defineProperty(FilterMatchMode, "BETWEEN", "between");
_defineProperty(FilterMatchMode, "IS", "is");
_defineProperty(FilterMatchMode, "IS_NOT", "isNot");
_defineProperty(FilterMatchMode, "BEFORE", "before");
_defineProperty(FilterMatchMode, "AFTER", "after");
_defineProperty(FilterMatchMode, "DATE_IS", "dateIs");
_defineProperty(FilterMatchMode, "DATE_IS_NOT", "dateIsNot");
_defineProperty(FilterMatchMode, "DATE_BEFORE", "dateBefore");
_defineProperty(FilterMatchMode, "DATE_AFTER", "dateAfter");
var FilterOperator = class {};
_defineProperty(FilterOperator, "AND", "and");
_defineProperty(FilterOperator, "OR", "or");
var FilterService = class {
	constructor() {
		_defineProperty(this, "filters", {
			startsWith: (value, filter, filterLocale) => {
				if (filter === void 0 || filter === null || filter.trim() === "") return true;
				if (value === void 0 || value === null) return false;
				let filterValue = N(filter.toString()).toLocaleLowerCase(filterLocale);
				return N(value.toString()).toLocaleLowerCase(filterLocale).slice(0, filterValue.length) === filterValue;
			},
			contains: (value, filter, filterLocale) => {
				if (filter === void 0 || filter === null || typeof filter === "string" && filter.trim() === "") return true;
				if (value === void 0 || value === null) return false;
				let filterValue = N(filter.toString()).toLocaleLowerCase(filterLocale);
				return N(value.toString()).toLocaleLowerCase(filterLocale).indexOf(filterValue) !== -1;
			},
			notContains: (value, filter, filterLocale) => {
				if (filter === void 0 || filter === null || typeof filter === "string" && filter.trim() === "") return true;
				if (value === void 0 || value === null) return false;
				let filterValue = N(filter.toString()).toLocaleLowerCase(filterLocale);
				return N(value.toString()).toLocaleLowerCase(filterLocale).indexOf(filterValue) === -1;
			},
			endsWith: (value, filter, filterLocale) => {
				if (filter === void 0 || filter === null || filter.trim() === "") return true;
				if (value === void 0 || value === null) return false;
				let filterValue = N(filter.toString()).toLocaleLowerCase(filterLocale);
				let stringValue = N(value.toString()).toLocaleLowerCase(filterLocale);
				return stringValue.indexOf(filterValue, stringValue.length - filterValue.length) !== -1;
			},
			equals: (value, filter, filterLocale) => {
				if (filter === void 0 || filter === null || typeof filter === "string" && filter.trim() === "") return true;
				if (value === void 0 || value === null) return false;
				if (value.getTime && filter.getTime) return value.getTime() === filter.getTime();
				else if (value == filter) return true;
				else return N(value.toString()).toLocaleLowerCase(filterLocale) == N(filter.toString()).toLocaleLowerCase(filterLocale);
			},
			notEquals: (value, filter, filterLocale) => {
				if (filter === void 0 || filter === null || typeof filter === "string" && filter.trim() === "") return false;
				if (value === void 0 || value === null) return true;
				if (value.getTime && filter.getTime) return value.getTime() !== filter.getTime();
				else if (value == filter) return false;
				else return N(value.toString()).toLocaleLowerCase(filterLocale) != N(filter.toString()).toLocaleLowerCase(filterLocale);
			},
			in: (value, filter) => {
				if (filter === void 0 || filter === null || filter.length === 0) return true;
				for (let i = 0; i < filter.length; i++) if (s(value, filter[i])) return true;
				return false;
			},
			between: (value, filter) => {
				if (filter == null || filter[0] == null || filter[1] == null) return true;
				if (value === void 0 || value === null) return false;
				if (value.getTime) return filter[0].getTime() <= value.getTime() && value.getTime() <= filter[1].getTime();
				else return filter[0] <= value && value <= filter[1];
			},
			lt: (value, filter, filterLocale) => {
				if (filter === void 0 || filter === null) return true;
				if (value === void 0 || value === null) return false;
				if (value.getTime && filter.getTime) return value.getTime() < filter.getTime();
				else return value < filter;
			},
			lte: (value, filter, filterLocale) => {
				if (filter === void 0 || filter === null) return true;
				if (value === void 0 || value === null) return false;
				if (value.getTime && filter.getTime) return value.getTime() <= filter.getTime();
				else return value <= filter;
			},
			gt: (value, filter, filterLocale) => {
				if (filter === void 0 || filter === null) return true;
				if (value === void 0 || value === null) return false;
				if (value.getTime && filter.getTime) return value.getTime() > filter.getTime();
				else return value > filter;
			},
			gte: (value, filter, filterLocale) => {
				if (filter === void 0 || filter === null) return true;
				if (value === void 0 || value === null) return false;
				if (value.getTime && filter.getTime) return value.getTime() >= filter.getTime();
				else return value >= filter;
			},
			is: (value, filter, filterLocale) => {
				return this.filters.equals(value, filter, filterLocale);
			},
			isNot: (value, filter, filterLocale) => {
				return this.filters.notEquals(value, filter, filterLocale);
			},
			before: (value, filter, filterLocale) => {
				return this.filters.lt(value, filter, filterLocale);
			},
			after: (value, filter, filterLocale) => {
				return this.filters.gt(value, filter, filterLocale);
			},
			dateIs: (value, filter) => {
				if (filter === void 0 || filter === null) return true;
				if (value === void 0 || value === null) return false;
				return value.toDateString() === filter.toDateString();
			},
			dateIsNot: (value, filter) => {
				if (filter === void 0 || filter === null) return true;
				if (value === void 0 || value === null) return false;
				return value.toDateString() !== filter.toDateString();
			},
			dateBefore: (value, filter) => {
				if (filter === void 0 || filter === null) return true;
				if (value === void 0 || value === null) return false;
				return value.getTime() < filter.getTime();
			},
			dateAfter: (value, filter) => {
				if (filter === void 0 || filter === null) return true;
				if (value === void 0 || value === null) return false;
				value.setHours(0, 0, 0, 0);
				return value.getTime() > filter.getTime();
			}
		});
	}
	filter(value, fields, filterValue, filterMatchMode, filterLocale) {
		let filteredItems = [];
		if (value) for (let item of value) for (let field of fields) {
			let fieldValue = o(item, field);
			if (this.filters[filterMatchMode](fieldValue, filterValue, filterLocale)) {
				filteredItems.push(item);
				break;
			}
		}
		return filteredItems;
	}
	register(rule, fn) {
		this.filters[rule] = fn;
	}
};
_FilterService = FilterService;
_defineProperty(FilterService, "ɵfac", function FilterService_Factory(__ngFactoryType__) {
	return new (__ngFactoryType__ || _FilterService)();
});
_defineProperty(FilterService, "ɵprov", /*@__PURE__*/ ɵɵdefineInjectable({
	token: _FilterService,
	factory: _FilterService.ɵfac,
	providedIn: "root"
}));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(FilterService, [{
		type: Injectable,
		args: [{ providedIn: "root" }]
	}], null, null);
})();
/**
* Message service used in messages and toast components.
* @group Service
*/
var MessageService = class {
	constructor() {
		_defineProperty(this, "messageSource", new Subject());
		_defineProperty(this, "clearSource", new Subject());
		_defineProperty(this, "messageObserver", this.messageSource.asObservable());
		_defineProperty(this, "clearObserver", this.clearSource.asObservable());
	}
	/**
	* Inserts single message.
	* @param {ToastMessageOptions} message - Message to be added.
	* @group Method
	*/
	add(message) {
		if (message) this.messageSource.next(message);
	}
	/**
	* Inserts new messages.
	* @param {Message[]} messages - Messages to be added.
	* @group Method
	*/
	addAll(messages) {
		if (messages && messages.length) this.messageSource.next(messages);
	}
	/**
	* Clears the message with the given key.
	* @param {string} key - Key of the message to be cleared.
	* @group Method
	*/
	clear(key) {
		this.clearSource.next(key || null);
	}
};
_MessageService = MessageService;
_defineProperty(MessageService, "ɵfac", function MessageService_Factory(__ngFactoryType__) {
	return new (__ngFactoryType__ || _MessageService)();
});
_defineProperty(MessageService, "ɵprov", /*@__PURE__*/ ɵɵdefineInjectable({
	token: _MessageService,
	factory: _MessageService.ɵfac
}));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(MessageService, [{ type: Injectable }], null, null);
})();
var OverlayService = class {
	constructor() {
		_defineProperty(this, "clickSource", new Subject());
		_defineProperty(this, "parentDragSource", new Subject());
		_defineProperty(this, "clickObservable", this.clickSource.asObservable());
		_defineProperty(this, "parentDragObservable", this.parentDragSource.asObservable());
	}
	add(event) {
		if (event) this.clickSource.next(event);
	}
	emitParentDrag(container) {
		this.parentDragSource.next(container);
	}
};
_OverlayService = OverlayService;
_defineProperty(OverlayService, "ɵfac", function OverlayService_Factory(__ngFactoryType__) {
	return new (__ngFactoryType__ || _OverlayService)();
});
_defineProperty(OverlayService, "ɵprov", /*@__PURE__*/ ɵɵdefineInjectable({
	token: _OverlayService,
	factory: _OverlayService.ɵfac,
	providedIn: "root"
}));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(OverlayService, [{
		type: Injectable,
		args: [{ providedIn: "root" }]
	}], null, null);
})();
var OpenngIcons = class {};
_defineProperty(OpenngIcons, "ADDRESS_BOOK", "pi pi-address-book");
_defineProperty(OpenngIcons, "ALIGN_CENTER", "pi pi-align-center");
_defineProperty(OpenngIcons, "ALIGN_JUSTIFY", "pi pi-align-justify");
_defineProperty(OpenngIcons, "ALIGN_LEFT", "pi pi-align-left");
_defineProperty(OpenngIcons, "ALIGN_RIGHT", "pi pi-align-right");
_defineProperty(OpenngIcons, "AMAZON", "pi pi-amazon");
_defineProperty(OpenngIcons, "ANDROID", "pi pi-android");
_defineProperty(OpenngIcons, "ANGLE_DOUBLE_DOWN", "pi pi-angle-double-down");
_defineProperty(OpenngIcons, "ANGLE_DOUBLE_LEFT", "pi pi-angle-double-left");
_defineProperty(OpenngIcons, "ANGLE_DOUBLE_RIGHT", "pi pi-angle-double-right");
_defineProperty(OpenngIcons, "ANGLE_DOUBLE_UP", "pi pi-angle-double-up");
_defineProperty(OpenngIcons, "ANGLE_DOWN", "pi pi-angle-down");
_defineProperty(OpenngIcons, "ANGLE_LEFT", "pi pi-angle-left");
_defineProperty(OpenngIcons, "ANGLE_RIGHT", "pi pi-angle-right");
_defineProperty(OpenngIcons, "ANGLE_UP", "pi pi-angle-up");
_defineProperty(OpenngIcons, "APPLE", "pi pi-apple");
_defineProperty(OpenngIcons, "ARROWS_ALT", "pi pi-arrows-alt");
_defineProperty(OpenngIcons, "ARROW_CIRCLE_DOWN", "pi pi-arrow-circle-down");
_defineProperty(OpenngIcons, "ARROW_CIRCLE_LEFT", "pi pi-arrow-circle-left");
_defineProperty(OpenngIcons, "ARROW_CIRCLE_RIGHT", "pi pi-arrow-circle-right");
_defineProperty(OpenngIcons, "ARROW_CIRCLE_UP", "pi pi-arrow-circle-up");
_defineProperty(OpenngIcons, "ARROW_DOWN", "pi pi-arrow-down");
_defineProperty(OpenngIcons, "ARROW_DOWN_LEFT", "pi pi-arrow-down-left");
_defineProperty(OpenngIcons, "ARROW_DOWN_LEFT_AND_ARROW_UP_RIGHT_TO_CENTER", "pi pi-arrow-down-left-and-arrow-up-right-to-center");
_defineProperty(OpenngIcons, "ARROW_DOWN_RIGHT", "pi pi-arrow-down-right");
_defineProperty(OpenngIcons, "ARROW_LEFT", "pi pi-arrow-left");
_defineProperty(OpenngIcons, "ARROW_RIGHT_ARROW_LEFT", "pi pi-arrow-right-arrow-left");
_defineProperty(OpenngIcons, "ARROW_RIGHT", "pi pi-arrow-right");
_defineProperty(OpenngIcons, "ARROW_UP", "pi pi-arrow-up");
_defineProperty(OpenngIcons, "ARROW_UP_LEFT", "pi pi-arrow-up-left");
_defineProperty(OpenngIcons, "ARROW_UP_RIGHT", "pi pi-arrow-up-right");
_defineProperty(OpenngIcons, "ARROW_UP_RIGHT_AND_ARROW_DOWN_LEFT_FROM_CENTER", "pi pi-arrow-up-right-and-arrow-down-left-from-center");
_defineProperty(OpenngIcons, "ARROWS_H", "pi pi-arrows-h");
_defineProperty(OpenngIcons, "ARROWS_V", "pi pi-arrows-v");
_defineProperty(OpenngIcons, "ASTERISK", "pi pi-asterisk");
_defineProperty(OpenngIcons, "AT", "pi pi-at");
_defineProperty(OpenngIcons, "BACKWARD", "pi pi-backward");
_defineProperty(OpenngIcons, "BAN", "pi pi-ban");
_defineProperty(OpenngIcons, "BARCODE", "pi pi-barcode");
_defineProperty(OpenngIcons, "BARS", "pi pi-bars");
_defineProperty(OpenngIcons, "BELL", "pi pi-bell");
_defineProperty(OpenngIcons, "BELL_SLASH", "pi pi-bell-slash");
_defineProperty(OpenngIcons, "BITCOIN", "pi pi-bitcoin");
_defineProperty(OpenngIcons, "BOLT", "pi pi-bolt");
_defineProperty(OpenngIcons, "BOOK", "pi pi-book");
_defineProperty(OpenngIcons, "BOOKMARK", "pi pi-bookmark");
_defineProperty(OpenngIcons, "BOOKMARK_FILL", "pi pi-bookmark-fill");
_defineProperty(OpenngIcons, "BOX", "pi pi-box");
_defineProperty(OpenngIcons, "BRIEFCASE", "pi pi-briefcase");
_defineProperty(OpenngIcons, "BUILDING", "pi pi-building");
_defineProperty(OpenngIcons, "BUILDING_COLUMNS", "pi pi-building-columns");
_defineProperty(OpenngIcons, "BULLSEYE", "pi pi-bullseye");
_defineProperty(OpenngIcons, "CALCULATOR", "pi pi-calculator");
_defineProperty(OpenngIcons, "CALENDAR", "pi pi-calendar");
_defineProperty(OpenngIcons, "CALENDAR_CLOCK", "pi pi-calendar-clock");
_defineProperty(OpenngIcons, "CALENDAR_MINUS", "pi pi-calendar-minus");
_defineProperty(OpenngIcons, "CALENDAR_PLUS", "pi pi-calendar-plus");
_defineProperty(OpenngIcons, "CALENDAR_TIMES", "pi pi-calendar-times");
_defineProperty(OpenngIcons, "CAMERA", "pi pi-camera");
_defineProperty(OpenngIcons, "CAR", "pi pi-car");
_defineProperty(OpenngIcons, "CARET_DOWN", "pi pi-caret-down");
_defineProperty(OpenngIcons, "CARET_LEFT", "pi pi-caret-left");
_defineProperty(OpenngIcons, "CARET_RIGHT", "pi pi-caret-right");
_defineProperty(OpenngIcons, "CARET_UP", "pi pi-caret-up");
_defineProperty(OpenngIcons, "CART_ARROW_DOWN", "pi pi-cart-arrow-down");
_defineProperty(OpenngIcons, "CART_MINUS", "pi pi-cart-minus");
_defineProperty(OpenngIcons, "CART_PLUS", "pi pi-cart-plus");
_defineProperty(OpenngIcons, "CHART_BAR", "pi pi-chart-bar");
_defineProperty(OpenngIcons, "CHART_LINE", "pi pi-chart-line");
_defineProperty(OpenngIcons, "CHART_PIE", "pi pi-chart-pie");
_defineProperty(OpenngIcons, "CHART_SCATTER", "pi pi-chart-scatter");
_defineProperty(OpenngIcons, "CHECK", "pi pi-check");
_defineProperty(OpenngIcons, "CHECK_CIRCLE", "pi pi-check-circle");
_defineProperty(OpenngIcons, "CHECK_SQUARE", "pi pi-check-square");
_defineProperty(OpenngIcons, "CHEVRON_CIRCLE_DOWN", "pi pi-chevron-circle-down");
_defineProperty(OpenngIcons, "CHEVRON_CIRCLE_LEFT", "pi pi-chevron-circle-left");
_defineProperty(OpenngIcons, "CHEVRON_CIRCLE_RIGHT", "pi pi-chevron-circle-right");
_defineProperty(OpenngIcons, "CHEVRON_CIRCLE_UP", "pi pi-chevron-circle-up");
_defineProperty(OpenngIcons, "CHEVRON_DOWN", "pi pi-chevron-down");
_defineProperty(OpenngIcons, "CHEVRON_LEFT", "pi pi-chevron-left");
_defineProperty(OpenngIcons, "CHEVRON_RIGHT", "pi pi-chevron-right");
_defineProperty(OpenngIcons, "CHEVRON_UP", "pi pi-chevron-up");
_defineProperty(OpenngIcons, "CIRCLE", "pi pi-circle");
_defineProperty(OpenngIcons, "CIRCLE_FILL", "pi pi-circle-fill");
_defineProperty(OpenngIcons, "CLIPBOARD", "pi pi-clipboard");
_defineProperty(OpenngIcons, "CLOCK", "pi pi-clock");
_defineProperty(OpenngIcons, "CLONE", "pi pi-clone");
_defineProperty(OpenngIcons, "CLOUD", "pi pi-cloud");
_defineProperty(OpenngIcons, "CLOUD_DOWNLOAD", "pi pi-cloud-download");
_defineProperty(OpenngIcons, "CLOUD_UPLOAD", "pi pi-cloud-upload");
_defineProperty(OpenngIcons, "CODE", "pi pi-code");
_defineProperty(OpenngIcons, "COG", "pi pi-cog");
_defineProperty(OpenngIcons, "COMMENT", "pi pi-comment");
_defineProperty(OpenngIcons, "COMMENTS", "pi pi-comments");
_defineProperty(OpenngIcons, "COMPASS", "pi pi-compass");
_defineProperty(OpenngIcons, "COPY", "pi pi-copy");
_defineProperty(OpenngIcons, "CREDIT_CARD", "pi pi-credit-card");
_defineProperty(OpenngIcons, "CROWN", "pi pi-crown");
_defineProperty(OpenngIcons, "DATABASE", "pi pi-database");
_defineProperty(OpenngIcons, "DESKTOP", "pi pi-desktop");
_defineProperty(OpenngIcons, "DELETE_LEFT", "pi pi-delete-left");
_defineProperty(OpenngIcons, "DIRECTIONS", "pi pi-directions");
_defineProperty(OpenngIcons, "DIRECTIONS_ALT", "pi pi-directions-alt");
_defineProperty(OpenngIcons, "DISCORD", "pi pi-discord");
_defineProperty(OpenngIcons, "DOLLAR", "pi pi-dollar");
_defineProperty(OpenngIcons, "DOWNLOAD", "pi pi-download");
_defineProperty(OpenngIcons, "EJECT", "pi pi-eject");
_defineProperty(OpenngIcons, "ELLIPSIS_H", "pi pi-ellipsis-h");
_defineProperty(OpenngIcons, "ELLIPSIS_V", "pi pi-ellipsis-v");
_defineProperty(OpenngIcons, "ENVELOPE", "pi pi-envelope");
_defineProperty(OpenngIcons, "EQUALS", "pi pi-equals");
_defineProperty(OpenngIcons, "ERASER", "pi pi-eraser");
_defineProperty(OpenngIcons, "ETHEREUM", "pi pi-ethereum");
_defineProperty(OpenngIcons, "EURO", "pi pi-euro");
_defineProperty(OpenngIcons, "EXCLAMATION_CIRCLE", "pi pi-exclamation-circle");
_defineProperty(OpenngIcons, "EXCLAMATION_TRIANGLE", "pi pi-exclamation-triangle");
_defineProperty(OpenngIcons, "EXPAND", "pi pi-expand");
_defineProperty(OpenngIcons, "EXTERNAL_LINK", "pi pi-external-link");
_defineProperty(OpenngIcons, "EYE", "pi pi-eye");
_defineProperty(OpenngIcons, "EYE_SLASH", "pi pi-eye-slash");
_defineProperty(OpenngIcons, "FACE_SMILE", "pi pi-face-smile");
_defineProperty(OpenngIcons, "FACEBOOK", "pi pi-facebook");
_defineProperty(OpenngIcons, "FAST_BACKWARD", "pi pi-fast-backward");
_defineProperty(OpenngIcons, "FAST_FORWARD", "pi pi-fast-forward");
_defineProperty(OpenngIcons, "FILE", "pi pi-file");
_defineProperty(OpenngIcons, "FILE_ARROW_UP", "pi pi-file-arrow-up");
_defineProperty(OpenngIcons, "FILE_CHECK", "pi pi-file-check");
_defineProperty(OpenngIcons, "FILE_EDIT", "pi pi-file-edit");
_defineProperty(OpenngIcons, "FILE_IMPORT", "pi pi-file-import");
_defineProperty(OpenngIcons, "FILE_PDF", "pi pi-file-pdf");
_defineProperty(OpenngIcons, "FILE_PLUS", "pi pi-file-plus");
_defineProperty(OpenngIcons, "FILE_EXCEL", "pi pi-file-excel");
_defineProperty(OpenngIcons, "FILE_EXPORT", "pi pi-file-export");
_defineProperty(OpenngIcons, "FILE_WORD", "pi pi-file-word");
_defineProperty(OpenngIcons, "FILTER", "pi pi-filter");
_defineProperty(OpenngIcons, "FILTER_FILL", "pi pi-filter-fill");
_defineProperty(OpenngIcons, "FILTER_SLASH", "pi pi-filter-slash");
_defineProperty(OpenngIcons, "FLAG", "pi pi-flag");
_defineProperty(OpenngIcons, "FLAG_FILL", "pi pi-flag-fill");
_defineProperty(OpenngIcons, "FOLDER", "pi pi-folder");
_defineProperty(OpenngIcons, "FOLDER_OPEN", "pi pi-folder-open");
_defineProperty(OpenngIcons, "FOLDER_PLUS", "pi pi-folder-plus");
_defineProperty(OpenngIcons, "FORWARD", "pi pi-forward");
_defineProperty(OpenngIcons, "GAUGE", "pi pi-gauge");
_defineProperty(OpenngIcons, "GIFT", "pi pi-gift");
_defineProperty(OpenngIcons, "GITHUB", "pi pi-github");
_defineProperty(OpenngIcons, "GLOBE", "pi pi-globe");
_defineProperty(OpenngIcons, "GOOGLE", "pi pi-google");
_defineProperty(OpenngIcons, "GRADUATION_CAP", "pi pi-graduation-cap");
_defineProperty(OpenngIcons, "HAMMER", "pi pi-hammer");
_defineProperty(OpenngIcons, "HASHTAG", "pi pi-hashtag");
_defineProperty(OpenngIcons, "HEADPHONES", "pi pi-headphones");
_defineProperty(OpenngIcons, "HEART", "pi pi-heart");
_defineProperty(OpenngIcons, "HEART_FILL", "pi pi-heart-fill");
_defineProperty(OpenngIcons, "HISTORY", "pi pi-history");
_defineProperty(OpenngIcons, "HOME", "pi pi-home");
_defineProperty(OpenngIcons, "HOURGLASS", "pi pi-hourglass");
_defineProperty(OpenngIcons, "ID_CARD", "pi pi-id-card");
_defineProperty(OpenngIcons, "IMAGE", "pi pi-image");
_defineProperty(OpenngIcons, "IMAGES", "pi pi-images");
_defineProperty(OpenngIcons, "INBOX", "pi pi-inbox");
_defineProperty(OpenngIcons, "INDIAN_RUPEE", "pi pi-indian-rupee");
_defineProperty(OpenngIcons, "INFO", "pi pi-info");
_defineProperty(OpenngIcons, "INFO_CIRCLE", "pi pi-info-circle");
_defineProperty(OpenngIcons, "INSTAGRAM", "pi pi-instagram");
_defineProperty(OpenngIcons, "KEY", "pi pi-key");
_defineProperty(OpenngIcons, "LANGUAGE", "pi pi-language");
_defineProperty(OpenngIcons, "LIGHTBULB", "pi pi-lightbulb");
_defineProperty(OpenngIcons, "LINK", "pi pi-link");
_defineProperty(OpenngIcons, "LINKEDIN", "pi pi-linkedin");
_defineProperty(OpenngIcons, "LIST", "pi pi-list");
_defineProperty(OpenngIcons, "LIST_CHECK", "pi pi-list-check");
_defineProperty(OpenngIcons, "LOCK", "pi pi-lock");
_defineProperty(OpenngIcons, "LOCK_OPEN", "pi pi-lock-open");
_defineProperty(OpenngIcons, "MAP", "pi pi-map");
_defineProperty(OpenngIcons, "MAP_MARKER", "pi pi-map-marker");
_defineProperty(OpenngIcons, "MARS", "pi pi-mars");
_defineProperty(OpenngIcons, "MEGAPHONE", "pi pi-megaphone");
_defineProperty(OpenngIcons, "MICROCHIP", "pi pi-microchip");
_defineProperty(OpenngIcons, "MICROCHIP_AI", "pi pi-microchip-ai");
_defineProperty(OpenngIcons, "MICROPHONE", "pi pi-microphone");
_defineProperty(OpenngIcons, "MICROSOFT", "pi pi-microsoft");
_defineProperty(OpenngIcons, "MINUS", "pi pi-minus");
_defineProperty(OpenngIcons, "MINUS_CIRCLE", "pi pi-minus-circle");
_defineProperty(OpenngIcons, "MOBILE", "pi pi-mobile");
_defineProperty(OpenngIcons, "MONEY_BILL", "pi pi-money-bill");
_defineProperty(OpenngIcons, "MOON", "pi pi-moon");
_defineProperty(OpenngIcons, "OBJECTS_COLUMN", "pi pi-objects-column");
_defineProperty(OpenngIcons, "PALETTE", "pi pi-palette");
_defineProperty(OpenngIcons, "PAPERCLIP", "pi pi-paperclip");
_defineProperty(OpenngIcons, "PAUSE", "pi pi-pause");
_defineProperty(OpenngIcons, "PAUSE_CIRCLE", "pi pi-pause-circle");
_defineProperty(OpenngIcons, "PAYPAL", "pi pi-paypal");
_defineProperty(OpenngIcons, "PEN_TO_SQUARE", "pi pi-pen-to-square");
_defineProperty(OpenngIcons, "PENCIL", "pi pi-pencil");
_defineProperty(OpenngIcons, "PERCENTAGE", "pi pi-percentage");
_defineProperty(OpenngIcons, "PHONE", "pi pi-phone");
_defineProperty(OpenngIcons, "PINTEREST", "pi pi-pinterest");
_defineProperty(OpenngIcons, "PLAY", "pi pi-play");
_defineProperty(OpenngIcons, "PLAY_CIRCLE", "pi pi-play-circle");
_defineProperty(OpenngIcons, "PLUS", "pi pi-plus");
_defineProperty(OpenngIcons, "PLUS_CIRCLE", "pi pi-plus-circle");
_defineProperty(OpenngIcons, "POUND", "pi pi-pound");
_defineProperty(OpenngIcons, "POWER_OFF", "pi pi-power-off");
_defineProperty(OpenngIcons, "PRIME", "pi pi-prime");
_defineProperty(OpenngIcons, "PRINT", "pi pi-print");
_defineProperty(OpenngIcons, "QRCODE", "pi pi-qrcode");
_defineProperty(OpenngIcons, "QUESTION", "pi pi-question");
_defineProperty(OpenngIcons, "QUESTION_CIRCLE", "pi pi-question-circle");
_defineProperty(OpenngIcons, "RECEIPT", "pi pi-receipt");
_defineProperty(OpenngIcons, "REDDIT", "pi pi-reddit");
_defineProperty(OpenngIcons, "REFRESH", "pi pi-refresh");
_defineProperty(OpenngIcons, "REPLAY", "pi pi-replay");
_defineProperty(OpenngIcons, "REPLY", "pi pi-reply");
_defineProperty(OpenngIcons, "SAVE", "pi pi-save");
_defineProperty(OpenngIcons, "SEARCH", "pi pi-search");
_defineProperty(OpenngIcons, "SEARCH_MINUS", "pi pi-search-minus");
_defineProperty(OpenngIcons, "SEARCH_PLUS", "pi pi-search-plus");
_defineProperty(OpenngIcons, "SEND", "pi pi-send");
_defineProperty(OpenngIcons, "SERVER", "pi pi-server");
_defineProperty(OpenngIcons, "SHARE_ALT", "pi pi-share-alt");
_defineProperty(OpenngIcons, "SHIELD", "pi pi-shield");
_defineProperty(OpenngIcons, "SHOP", "pi pi-shop");
_defineProperty(OpenngIcons, "SHOPPING_BAG", "pi pi-shopping-bag");
_defineProperty(OpenngIcons, "SHOPPING_CART", "pi pi-shopping-cart");
_defineProperty(OpenngIcons, "SIGN_IN", "pi pi-sign-in");
_defineProperty(OpenngIcons, "SIGN_OUT", "pi pi-sign-out");
_defineProperty(OpenngIcons, "SITEMAP", "pi pi-sitemap");
_defineProperty(OpenngIcons, "SLACK", "pi pi-slack");
_defineProperty(OpenngIcons, "SLIDERS_H", "pi pi-sliders-h");
_defineProperty(OpenngIcons, "SLIDERS_V", "pi pi-sliders-v");
_defineProperty(OpenngIcons, "SORT", "pi pi-sort");
_defineProperty(OpenngIcons, "SORT_ALPHA_DOWN", "pi pi-sort-alpha-down");
_defineProperty(OpenngIcons, "SORT_ALPHA_DOWN_ALT", "pi pi-sort-alpha-down-alt");
_defineProperty(OpenngIcons, "SORT_ALPHA_UP", "pi pi-sort-alpha-up");
_defineProperty(OpenngIcons, "SORT_ALPHA_UP_ALT", "pi pi-sort-alpha-up-alt");
_defineProperty(OpenngIcons, "SORT_ALT", "pi pi-sort-alt");
_defineProperty(OpenngIcons, "SORT_ALT_SLASH", "pi pi-sort-alt-slash");
_defineProperty(OpenngIcons, "SORT_AMOUNT_DOWN", "pi pi-sort-amount-down");
_defineProperty(OpenngIcons, "SORT_AMOUNT_DOWN_ALT", "pi pi-sort-amount-down-alt");
_defineProperty(OpenngIcons, "SORT_AMOUNT_UP", "pi pi-sort-amount-up");
_defineProperty(OpenngIcons, "SORT_AMOUNT_UP_ALT", "pi pi-sort-amount-up-alt");
_defineProperty(OpenngIcons, "SORT_DOWN", "pi pi-sort-down");
_defineProperty(OpenngIcons, "SORT_DOWN_FILL", "pi pi-sort-down-fill");
_defineProperty(OpenngIcons, "SORT_NUMERIC_DOWN", "pi pi-sort-numeric-down");
_defineProperty(OpenngIcons, "SORT_NUMERIC_DOWN_ALT", "pi pi-sort-numeric-down-alt");
_defineProperty(OpenngIcons, "SORT_NUMERIC_UP", "pi pi-sort-numeric-up");
_defineProperty(OpenngIcons, "SORT_NUMERIC_UP_ALT", "pi pi-sort-numeric-up-alt");
_defineProperty(OpenngIcons, "SORT_UP", "pi pi-sort-up");
_defineProperty(OpenngIcons, "SORT_UP_FILL", "pi pi-sort-up-fill");
_defineProperty(OpenngIcons, "SPARKLES", "pi pi-sparkles");
_defineProperty(OpenngIcons, "SPINNER", "pi pi-spinner");
_defineProperty(OpenngIcons, "SPINNER_DOTTED", "pi pi-spinner-dotted");
_defineProperty(OpenngIcons, "STAR", "pi pi-star");
_defineProperty(OpenngIcons, "STAR_FILL", "pi pi-star-fill");
_defineProperty(OpenngIcons, "STAR_HALF", "pi pi-star-half");
_defineProperty(OpenngIcons, "STAR_HALF_FILL", "pi pi-star-half-fill");
_defineProperty(OpenngIcons, "STEP_BACKWARD", "pi pi-step-backward");
_defineProperty(OpenngIcons, "STEP_BACKWARD_ALT", "pi pi-step-backward-alt");
_defineProperty(OpenngIcons, "STEP_FORWARD", "pi pi-step-forward");
_defineProperty(OpenngIcons, "STEP_FORWARD_ALT", "pi pi-step-forward-alt");
_defineProperty(OpenngIcons, "STOP", "pi pi-stop");
_defineProperty(OpenngIcons, "STOP_CIRCLE", "pi pi-stop-circle");
_defineProperty(OpenngIcons, "STOPWATCH", "pi pi-stopwatch");
_defineProperty(OpenngIcons, "SUN", "pi pi-sun");
_defineProperty(OpenngIcons, "SYNC", "pi pi-sync");
_defineProperty(OpenngIcons, "TABLE", "pi pi-table");
_defineProperty(OpenngIcons, "TABLET", "pi pi-tablet");
_defineProperty(OpenngIcons, "TAG", "pi pi-tag");
_defineProperty(OpenngIcons, "TAGS", "pi pi-tags");
_defineProperty(OpenngIcons, "TELEGRAM", "pi pi-telegram");
_defineProperty(OpenngIcons, "TH_LARGE", "pi pi-th-large");
_defineProperty(OpenngIcons, "THUMBS_DOWN", "pi pi-thumbs-down");
_defineProperty(OpenngIcons, "THUMBS_DOWN_FILL", "pi pi-thumbs-down-fill");
_defineProperty(OpenngIcons, "THUMBS_UP", "pi pi-thumbs-up");
_defineProperty(OpenngIcons, "THUMBS_UP_FILL", "pi pi-thumbs-up-fill");
_defineProperty(OpenngIcons, "THUMBTACK", "pi pi-thumbtack");
_defineProperty(OpenngIcons, "TICKET", "pi pi-ticket");
_defineProperty(OpenngIcons, "TIKTOK", "pi pi-tiktok");
_defineProperty(OpenngIcons, "TIMES", "pi pi-times");
_defineProperty(OpenngIcons, "TIMES_CIRCLE", "pi pi-times-circle");
_defineProperty(OpenngIcons, "TRASH", "pi pi-trash");
_defineProperty(OpenngIcons, "TROPHY", "pi pi-trophy");
_defineProperty(OpenngIcons, "TRUCK", "pi pi-truck");
_defineProperty(OpenngIcons, "TURKISH_LIRA", "pi pi-turkish-lira");
_defineProperty(OpenngIcons, "TWITCH", "pi pi-twitch");
_defineProperty(OpenngIcons, "TWITTER", "pi pi-twitter");
_defineProperty(OpenngIcons, "UNDO", "pi pi-undo");
_defineProperty(OpenngIcons, "UNLOCK", "pi pi-unlock");
_defineProperty(OpenngIcons, "UPLOAD", "pi pi-upload");
_defineProperty(OpenngIcons, "USER", "pi pi-user");
_defineProperty(OpenngIcons, "USER_EDIT", "pi pi-user-edit");
_defineProperty(OpenngIcons, "USER_MINUS", "pi pi-user-minus");
_defineProperty(OpenngIcons, "USER_PLUS", "pi pi-user-plus");
_defineProperty(OpenngIcons, "USERS", "pi pi-users");
_defineProperty(OpenngIcons, "VENUS", "pi pi-venus");
_defineProperty(OpenngIcons, "VERIFIED", "pi pi-verified");
_defineProperty(OpenngIcons, "VIDEO", "pi pi-video");
_defineProperty(OpenngIcons, "VIMEO", "pi pi-vimeo");
_defineProperty(OpenngIcons, "VOLUME_DOWN", "pi pi-volume-down");
_defineProperty(OpenngIcons, "VOLUME_OFF", "pi pi-volume-off");
_defineProperty(OpenngIcons, "VOLUME_UP", "pi pi-volume-up");
_defineProperty(OpenngIcons, "WALLET", "pi pi-wallet");
_defineProperty(OpenngIcons, "WAREHOUSE", "pi pi-warehouse");
_defineProperty(OpenngIcons, "WAVE_PULSE", "pi pi-wave-pulse");
_defineProperty(OpenngIcons, "WHATSAPP", "pi pi-whatsapp");
_defineProperty(OpenngIcons, "WIFI", "pi pi-wifi");
_defineProperty(OpenngIcons, "WINDOW_MAXIMIZE", "pi pi-window-maximize");
_defineProperty(OpenngIcons, "WINDOW_MINIMIZE", "pi pi-window-minimize");
_defineProperty(OpenngIcons, "WRENCH", "pi pi-wrench");
_defineProperty(OpenngIcons, "YOUTUBE", "pi pi-youtube");
/**
* @deprecated Use `OpenngIcons` instead. This alias is kept for backward compatibility
* with PrimeIcons and will be removed in a future major version.
*/
var PrimeIcons = OpenngIcons;
var Header = class {};
_Header = Header;
_defineProperty(Header, "ɵfac", function Header_Factory(__ngFactoryType__) {
	return new (__ngFactoryType__ || _Header)();
});
_defineProperty(Header, "ɵcmp", (function() {
	return /*@__PURE__*/ ɵɵdefineComponent({
		type: _Header,
		selectors: [["p-header"]],
		standalone: false,
		ngContentSelectors: ["*"],
		decls: 1,
		vars: 0,
		template: function Header_Template(rf, ctx) {
			if (rf & 1) {
				ɵɵprojectionDef();
				ɵɵprojection(0);
			}
		},
		encapsulation: 2,
		changeDetection: 1
	});
})());
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(Header, [{
		type: Component,
		args: [{
			changeDetection: ChangeDetectionStrategy.Eager,
			selector: "p-header",
			template: "<ng-content></ng-content>",
			standalone: false
		}]
	}], null, null);
})();
var Footer = class {};
_Footer = Footer;
_defineProperty(Footer, "ɵfac", function Footer_Factory(__ngFactoryType__) {
	return new (__ngFactoryType__ || _Footer)();
});
_defineProperty(Footer, "ɵcmp", (function() {
	return /*@__PURE__*/ ɵɵdefineComponent({
		type: _Footer,
		selectors: [["p-footer"]],
		standalone: false,
		ngContentSelectors: ["*"],
		decls: 1,
		vars: 0,
		template: function Footer_Template(rf, ctx) {
			if (rf & 1) {
				ɵɵprojectionDef();
				ɵɵprojection(0);
			}
		},
		encapsulation: 2,
		changeDetection: 1
	});
})());
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(Footer, [{
		type: Component,
		args: [{
			changeDetection: ChangeDetectionStrategy.Eager,
			selector: "p-footer",
			template: "<ng-content></ng-content>",
			standalone: false
		}]
	}], null, null);
})();
var PrimeTemplate = class {
	constructor(template) {
		_defineProperty(this, "template", void 0);
		_defineProperty(this, "type", void 0);
		_defineProperty(this, "name", void 0);
		this.template = template;
	}
	getType() {
		return this.name;
	}
};
_PrimeTemplate = PrimeTemplate;
_defineProperty(PrimeTemplate, "ɵfac", function PrimeTemplate_Factory(__ngFactoryType__) {
	return new (__ngFactoryType__ || _PrimeTemplate)(ɵɵdirectiveInject(TemplateRef));
});
_defineProperty(PrimeTemplate, "ɵdir", /*@__PURE__*/ ɵɵdefineDirective({
	type: _PrimeTemplate,
	selectors: [[
		"",
		"pTemplate",
		""
	]],
	inputs: {
		type: "type",
		name: [
			0,
			"pTemplate",
			"name"
		]
	}
}));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(PrimeTemplate, [{
		type: Directive,
		args: [{
			selector: "[pTemplate]",
			standalone: true
		}]
	}], () => [{ type: TemplateRef }], {
		type: [{ type: Input }],
		name: [{
			type: Input,
			args: ["pTemplate"]
		}]
	});
})();
var SharedModule = class {};
_SharedModule = SharedModule;
_defineProperty(SharedModule, "ɵfac", function SharedModule_Factory(__ngFactoryType__) {
	return new (__ngFactoryType__ || _SharedModule)();
});
_defineProperty(SharedModule, "ɵmod", /*@__PURE__*/ ɵɵdefineNgModule({
	type: _SharedModule,
	declarations: [Header, Footer],
	imports: [CommonModule, PrimeTemplate],
	exports: [
		Header,
		Footer,
		PrimeTemplate
	]
}));
_defineProperty(SharedModule, "ɵinj", /*@__PURE__*/ ɵɵdefineInjector({ imports: [CommonModule] }));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(SharedModule, [{
		type: NgModule,
		args: [{
			imports: [CommonModule, PrimeTemplate],
			exports: [
				Header,
				Footer,
				PrimeTemplate
			],
			declarations: [Header, Footer]
		}]
	}], null, null);
})();
var TranslationKeys = class {};
_defineProperty(TranslationKeys, "STARTS_WITH", "startsWith");
_defineProperty(TranslationKeys, "CONTAINS", "contains");
_defineProperty(TranslationKeys, "NOT_CONTAINS", "notContains");
_defineProperty(TranslationKeys, "ENDS_WITH", "endsWith");
_defineProperty(TranslationKeys, "EQUALS", "equals");
_defineProperty(TranslationKeys, "NOT_EQUALS", "notEquals");
_defineProperty(TranslationKeys, "NO_FILTER", "noFilter");
_defineProperty(TranslationKeys, "LT", "lt");
_defineProperty(TranslationKeys, "LTE", "lte");
_defineProperty(TranslationKeys, "GT", "gt");
_defineProperty(TranslationKeys, "GTE", "gte");
_defineProperty(TranslationKeys, "IS", "is");
_defineProperty(TranslationKeys, "IS_NOT", "isNot");
_defineProperty(TranslationKeys, "BEFORE", "before");
_defineProperty(TranslationKeys, "AFTER", "after");
_defineProperty(TranslationKeys, "CLEAR", "clear");
_defineProperty(TranslationKeys, "APPLY", "apply");
_defineProperty(TranslationKeys, "MATCH_ALL", "matchAll");
_defineProperty(TranslationKeys, "MATCH_ANY", "matchAny");
_defineProperty(TranslationKeys, "ADD_RULE", "addRule");
_defineProperty(TranslationKeys, "REMOVE_RULE", "removeRule");
_defineProperty(TranslationKeys, "ACCEPT", "accept");
_defineProperty(TranslationKeys, "REJECT", "reject");
_defineProperty(TranslationKeys, "CHOOSE", "choose");
_defineProperty(TranslationKeys, "UPLOAD", "upload");
_defineProperty(TranslationKeys, "CANCEL", "cancel");
_defineProperty(TranslationKeys, "PENDING", "pending");
_defineProperty(TranslationKeys, "FILE_SIZE_TYPES", "fileSizeTypes");
_defineProperty(TranslationKeys, "DAY_NAMES", "dayNames");
_defineProperty(TranslationKeys, "DAY_NAMES_SHORT", "dayNamesShort");
_defineProperty(TranslationKeys, "DAY_NAMES_MIN", "dayNamesMin");
_defineProperty(TranslationKeys, "MONTH_NAMES", "monthNames");
_defineProperty(TranslationKeys, "MONTH_NAMES_SHORT", "monthNamesShort");
_defineProperty(TranslationKeys, "FIRST_DAY_OF_WEEK", "firstDayOfWeek");
_defineProperty(TranslationKeys, "TODAY", "today");
_defineProperty(TranslationKeys, "WEEK_HEADER", "weekHeader");
_defineProperty(TranslationKeys, "WEAK", "weak");
_defineProperty(TranslationKeys, "MEDIUM", "medium");
_defineProperty(TranslationKeys, "STRONG", "strong");
_defineProperty(TranslationKeys, "PASSWORD_PROMPT", "passwordPrompt");
_defineProperty(TranslationKeys, "EMPTY_MESSAGE", "emptyMessage");
_defineProperty(TranslationKeys, "EMPTY_FILTER_MESSAGE", "emptyFilterMessage");
_defineProperty(TranslationKeys, "SHOW_FILTER_MENU", "showFilterMenu");
_defineProperty(TranslationKeys, "HIDE_FILTER_MENU", "hideFilterMenu");
_defineProperty(TranslationKeys, "SELECTION_MESSAGE", "selectionMessage");
_defineProperty(TranslationKeys, "ARIA", "aria");
_defineProperty(TranslationKeys, "SELECT_COLOR", "selectColor");
_defineProperty(TranslationKeys, "BROWSE_FILES", "browseFiles");
var TreeDragDropService = class {
	constructor() {
		_defineProperty(this, "dragStartSource", new Subject());
		_defineProperty(this, "dragStopSource", new Subject());
		_defineProperty(this, "dragStart$", this.dragStartSource.asObservable());
		_defineProperty(this, "dragStop$", this.dragStopSource.asObservable());
	}
	startDrag(event) {
		this.dragStartSource.next(event);
	}
	stopDrag(event) {
		this.dragStopSource.next(event);
	}
};
_TreeDragDropService = TreeDragDropService;
_defineProperty(TreeDragDropService, "ɵfac", function TreeDragDropService_Factory(__ngFactoryType__) {
	return new (__ngFactoryType__ || _TreeDragDropService)();
});
_defineProperty(TreeDragDropService, "ɵprov", /*@__PURE__*/ ɵɵdefineInjectable({
	token: _TreeDragDropService,
	factory: _TreeDragDropService.ɵfac
}));
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(TreeDragDropService, [{ type: Injectable }], null, null);
})();
//#endregion
export { ConfirmEventType, ConfirmationService, ContextMenuService, FilterMatchMode, FilterOperator, FilterService, Footer, Header, MessageService, OpenngIcons, OverlayService, PrimeIcons, PrimeTemplate, SharedModule, TranslationKeys, TreeDragDropService };
