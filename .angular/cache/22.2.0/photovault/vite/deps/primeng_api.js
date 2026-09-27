import { n as _defineProperty } from "./objectSpread2-weooBxVk.js";
import { Fn as Injectable, Gl as Subject, In as Input, Ml as ɵɵdefineInjectable, Nl as ɵɵdefineInjector, Wi as setClassMetadata, ao as ɵɵdefineNgModule, cn as Component, co as ɵɵdirectiveInject, cs as ɵɵprojectionDef, io as ɵɵdefineDirective, qn as NgModule, ro as ɵɵdefineComponent, ss as ɵɵprojection, vr as TemplateRef, wn as Directive } from "./core-C91JEChX.js";
import "./common-C2OsAfsp.js";
import { t as CommonModule } from "./_common_module-chunk-BJJFMmtK.js";
import { d, f as ee, l as b } from "./dist-DWYgOqP_.js";
//#region node_modules/primeng/fesm2022/primeng-api.mjs
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
				if (filter === void 0 || filter === null || typeof filter === "string" && filter.trim() === "") return true;
				if (value === void 0 || value === null) return false;
				let filterValue = ee(filter.toString()).toLocaleLowerCase(filterLocale);
				return ee(value.toString()).toLocaleLowerCase(filterLocale).slice(0, filterValue.length) === filterValue;
			},
			contains: (value, filter, filterLocale) => {
				if (filter === void 0 || filter === null || typeof filter === "string" && filter.trim() === "") return true;
				if (value === void 0 || value === null) return false;
				let filterValue = ee(filter.toString()).toLocaleLowerCase(filterLocale);
				return ee(value.toString()).toLocaleLowerCase(filterLocale).indexOf(filterValue) !== -1;
			},
			notContains: (value, filter, filterLocale) => {
				if (filter === void 0 || filter === null || typeof filter === "string" && filter.trim() === "") return true;
				if (value === void 0 || value === null) return false;
				let filterValue = ee(filter.toString()).toLocaleLowerCase(filterLocale);
				return ee(value.toString()).toLocaleLowerCase(filterLocale).indexOf(filterValue) === -1;
			},
			endsWith: (value, filter, filterLocale) => {
				if (filter === void 0 || filter === null || typeof filter === "string" && filter.trim() === "") return true;
				if (value === void 0 || value === null) return false;
				let filterValue = ee(filter.toString()).toLocaleLowerCase(filterLocale);
				let stringValue = ee(value.toString()).toLocaleLowerCase(filterLocale);
				return stringValue.indexOf(filterValue, stringValue.length - filterValue.length) !== -1;
			},
			equals: (value, filter, filterLocale) => {
				if (filter === void 0 || filter === null || typeof filter === "string" && filter.trim() === "") return true;
				if (value === void 0 || value === null) return false;
				if (value.getTime && filter.getTime) return value.getTime() === filter.getTime();
				else if (value == filter) return true;
				else return ee(value.toString()).toLocaleLowerCase(filterLocale) == ee(filter.toString()).toLocaleLowerCase(filterLocale);
			},
			notEquals: (value, filter, filterLocale) => {
				if (filter === void 0 || filter === null || typeof filter === "string" && filter.trim() === "") return true;
				if (value === void 0 || value === null) return true;
				if (value.getTime && filter.getTime) return value.getTime() !== filter.getTime();
				else if (value == filter) return false;
				else return ee(value.toString()).toLocaleLowerCase(filterLocale) != ee(filter.toString()).toLocaleLowerCase(filterLocale);
			},
			in: (value, filter) => {
				if (filter === void 0 || filter === null || filter.length === 0) return true;
				for (let i = 0; i < filter.length; i++) if (b(value, filter[i])) return true;
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
			is: (value, filter, filterLocale) => this.filters.equals(value, filter, filterLocale),
			isNot: (value, filter, filterLocale) => this.filters.notEquals(value, filter, filterLocale),
			before: (value, filter, filterLocale) => this.filters.lt(value, filter, filterLocale),
			after: (value, filter, filterLocale) => this.filters.gt(value, filter, filterLocale),
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
			let fieldValue = d(item, field);
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
var PrimeIcons = class {};
_defineProperty(PrimeIcons, "ADDRESS_BOOK", "pi pi-address-book");
_defineProperty(PrimeIcons, "ALIGN_CENTER", "pi pi-align-center");
_defineProperty(PrimeIcons, "ALIGN_JUSTIFY", "pi pi-align-justify");
_defineProperty(PrimeIcons, "ALIGN_LEFT", "pi pi-align-left");
_defineProperty(PrimeIcons, "ALIGN_RIGHT", "pi pi-align-right");
_defineProperty(PrimeIcons, "AMAZON", "pi pi-amazon");
_defineProperty(PrimeIcons, "ANDROID", "pi pi-android");
_defineProperty(PrimeIcons, "ANGLE_DOUBLE_DOWN", "pi pi-angle-double-down");
_defineProperty(PrimeIcons, "ANGLE_DOUBLE_LEFT", "pi pi-angle-double-left");
_defineProperty(PrimeIcons, "ANGLE_DOUBLE_RIGHT", "pi pi-angle-double-right");
_defineProperty(PrimeIcons, "ANGLE_DOUBLE_UP", "pi pi-angle-double-up");
_defineProperty(PrimeIcons, "ANGLE_DOWN", "pi pi-angle-down");
_defineProperty(PrimeIcons, "ANGLE_LEFT", "pi pi-angle-left");
_defineProperty(PrimeIcons, "ANGLE_RIGHT", "pi pi-angle-right");
_defineProperty(PrimeIcons, "ANGLE_UP", "pi pi-angle-up");
_defineProperty(PrimeIcons, "APPLE", "pi pi-apple");
_defineProperty(PrimeIcons, "ARROWS_ALT", "pi pi-arrows-alt");
_defineProperty(PrimeIcons, "ARROW_CIRCLE_DOWN", "pi pi-arrow-circle-down");
_defineProperty(PrimeIcons, "ARROW_CIRCLE_LEFT", "pi pi-arrow-circle-left");
_defineProperty(PrimeIcons, "ARROW_CIRCLE_RIGHT", "pi pi-arrow-circle-right");
_defineProperty(PrimeIcons, "ARROW_CIRCLE_UP", "pi pi-arrow-circle-up");
_defineProperty(PrimeIcons, "ARROW_DOWN", "pi pi-arrow-down");
_defineProperty(PrimeIcons, "ARROW_DOWN_LEFT", "pi pi-arrow-down-left");
_defineProperty(PrimeIcons, "ARROW_DOWN_LEFT_AND_ARROW_UP_RIGHT_TO_CENTER", "pi pi-arrow-down-left-and-arrow-up-right-to-center");
_defineProperty(PrimeIcons, "ARROW_DOWN_RIGHT", "pi pi-arrow-down-right");
_defineProperty(PrimeIcons, "ARROW_LEFT", "pi pi-arrow-left");
_defineProperty(PrimeIcons, "ARROW_RIGHT_ARROW_LEFT", "pi pi-arrow-right-arrow-left");
_defineProperty(PrimeIcons, "ARROW_RIGHT", "pi pi-arrow-right");
_defineProperty(PrimeIcons, "ARROW_UP", "pi pi-arrow-up");
_defineProperty(PrimeIcons, "ARROW_UP_LEFT", "pi pi-arrow-up-left");
_defineProperty(PrimeIcons, "ARROW_UP_RIGHT", "pi pi-arrow-up-right");
_defineProperty(PrimeIcons, "ARROW_UP_RIGHT_AND_ARROW_DOWN_LEFT_FROM_CENTER", "pi pi-arrow-up-right-and-arrow-down-left-from-center");
_defineProperty(PrimeIcons, "ARROWS_H", "pi pi-arrows-h");
_defineProperty(PrimeIcons, "ARROWS_V", "pi pi-arrows-v");
_defineProperty(PrimeIcons, "ASTERISK", "pi pi-asterisk");
_defineProperty(PrimeIcons, "AT", "pi pi-at");
_defineProperty(PrimeIcons, "BACKWARD", "pi pi-backward");
_defineProperty(PrimeIcons, "BAN", "pi pi-ban");
_defineProperty(PrimeIcons, "BARCODE", "pi pi-barcode");
_defineProperty(PrimeIcons, "BARS", "pi pi-bars");
_defineProperty(PrimeIcons, "BELL", "pi pi-bell");
_defineProperty(PrimeIcons, "BELL_SLASH", "pi pi-bell-slash");
_defineProperty(PrimeIcons, "BITCOIN", "pi pi-bitcoin");
_defineProperty(PrimeIcons, "BOLT", "pi pi-bolt");
_defineProperty(PrimeIcons, "BOOK", "pi pi-book");
_defineProperty(PrimeIcons, "BOOKMARK", "pi pi-bookmark");
_defineProperty(PrimeIcons, "BOOKMARK_FILL", "pi pi-bookmark-fill");
_defineProperty(PrimeIcons, "BOX", "pi pi-box");
_defineProperty(PrimeIcons, "BRIEFCASE", "pi pi-briefcase");
_defineProperty(PrimeIcons, "BUILDING", "pi pi-building");
_defineProperty(PrimeIcons, "BUILDING_COLUMNS", "pi pi-building-columns");
_defineProperty(PrimeIcons, "BULLSEYE", "pi pi-bullseye");
_defineProperty(PrimeIcons, "CALCULATOR", "pi pi-calculator");
_defineProperty(PrimeIcons, "CALENDAR", "pi pi-calendar");
_defineProperty(PrimeIcons, "CALENDAR_CLOCK", "pi pi-calendar-clock");
_defineProperty(PrimeIcons, "CALENDAR_MINUS", "pi pi-calendar-minus");
_defineProperty(PrimeIcons, "CALENDAR_PLUS", "pi pi-calendar-plus");
_defineProperty(PrimeIcons, "CALENDAR_TIMES", "pi pi-calendar-times");
_defineProperty(PrimeIcons, "CAMERA", "pi pi-camera");
_defineProperty(PrimeIcons, "CAR", "pi pi-car");
_defineProperty(PrimeIcons, "CARET_DOWN", "pi pi-caret-down");
_defineProperty(PrimeIcons, "CARET_LEFT", "pi pi-caret-left");
_defineProperty(PrimeIcons, "CARET_RIGHT", "pi pi-caret-right");
_defineProperty(PrimeIcons, "CARET_UP", "pi pi-caret-up");
_defineProperty(PrimeIcons, "CART_ARROW_DOWN", "pi pi-cart-arrow-down");
_defineProperty(PrimeIcons, "CART_MINUS", "pi pi-cart-minus");
_defineProperty(PrimeIcons, "CART_PLUS", "pi pi-cart-plus");
_defineProperty(PrimeIcons, "CHART_BAR", "pi pi-chart-bar");
_defineProperty(PrimeIcons, "CHART_LINE", "pi pi-chart-line");
_defineProperty(PrimeIcons, "CHART_PIE", "pi pi-chart-pie");
_defineProperty(PrimeIcons, "CHART_SCATTER", "pi pi-chart-scatter");
_defineProperty(PrimeIcons, "CHECK", "pi pi-check");
_defineProperty(PrimeIcons, "CHECK_CIRCLE", "pi pi-check-circle");
_defineProperty(PrimeIcons, "CHECK_SQUARE", "pi pi-check-square");
_defineProperty(PrimeIcons, "CHEVRON_CIRCLE_DOWN", "pi pi-chevron-circle-down");
_defineProperty(PrimeIcons, "CHEVRON_CIRCLE_LEFT", "pi pi-chevron-circle-left");
_defineProperty(PrimeIcons, "CHEVRON_CIRCLE_RIGHT", "pi pi-chevron-circle-right");
_defineProperty(PrimeIcons, "CHEVRON_CIRCLE_UP", "pi pi-chevron-circle-up");
_defineProperty(PrimeIcons, "CHEVRON_DOWN", "pi pi-chevron-down");
_defineProperty(PrimeIcons, "CHEVRON_LEFT", "pi pi-chevron-left");
_defineProperty(PrimeIcons, "CHEVRON_RIGHT", "pi pi-chevron-right");
_defineProperty(PrimeIcons, "CHEVRON_UP", "pi pi-chevron-up");
_defineProperty(PrimeIcons, "CIRCLE", "pi pi-circle");
_defineProperty(PrimeIcons, "CIRCLE_FILL", "pi pi-circle-fill");
_defineProperty(PrimeIcons, "CLIPBOARD", "pi pi-clipboard");
_defineProperty(PrimeIcons, "CLOCK", "pi pi-clock");
_defineProperty(PrimeIcons, "CLONE", "pi pi-clone");
_defineProperty(PrimeIcons, "CLOUD", "pi pi-cloud");
_defineProperty(PrimeIcons, "CLOUD_DOWNLOAD", "pi pi-cloud-download");
_defineProperty(PrimeIcons, "CLOUD_UPLOAD", "pi pi-cloud-upload");
_defineProperty(PrimeIcons, "CODE", "pi pi-code");
_defineProperty(PrimeIcons, "COG", "pi pi-cog");
_defineProperty(PrimeIcons, "COMMENT", "pi pi-comment");
_defineProperty(PrimeIcons, "COMMENTS", "pi pi-comments");
_defineProperty(PrimeIcons, "COMPASS", "pi pi-compass");
_defineProperty(PrimeIcons, "COPY", "pi pi-copy");
_defineProperty(PrimeIcons, "CREDIT_CARD", "pi pi-credit-card");
_defineProperty(PrimeIcons, "CROWN", "pi pi-crown");
_defineProperty(PrimeIcons, "DATABASE", "pi pi-database");
_defineProperty(PrimeIcons, "DESKTOP", "pi pi-desktop");
_defineProperty(PrimeIcons, "DELETE_LEFT", "pi pi-delete-left");
_defineProperty(PrimeIcons, "DIRECTIONS", "pi pi-directions");
_defineProperty(PrimeIcons, "DIRECTIONS_ALT", "pi pi-directions-alt");
_defineProperty(PrimeIcons, "DISCORD", "pi pi-discord");
_defineProperty(PrimeIcons, "DOLLAR", "pi pi-dollar");
_defineProperty(PrimeIcons, "DOWNLOAD", "pi pi-download");
_defineProperty(PrimeIcons, "EJECT", "pi pi-eject");
_defineProperty(PrimeIcons, "ELLIPSIS_H", "pi pi-ellipsis-h");
_defineProperty(PrimeIcons, "ELLIPSIS_V", "pi pi-ellipsis-v");
_defineProperty(PrimeIcons, "ENVELOPE", "pi pi-envelope");
_defineProperty(PrimeIcons, "EQUALS", "pi pi-equals");
_defineProperty(PrimeIcons, "ERASER", "pi pi-eraser");
_defineProperty(PrimeIcons, "ETHEREUM", "pi pi-ethereum");
_defineProperty(PrimeIcons, "EURO", "pi pi-euro");
_defineProperty(PrimeIcons, "EXCLAMATION_CIRCLE", "pi pi-exclamation-circle");
_defineProperty(PrimeIcons, "EXCLAMATION_TRIANGLE", "pi pi-exclamation-triangle");
_defineProperty(PrimeIcons, "EXPAND", "pi pi-expand");
_defineProperty(PrimeIcons, "EXTERNAL_LINK", "pi pi-external-link");
_defineProperty(PrimeIcons, "EYE", "pi pi-eye");
_defineProperty(PrimeIcons, "EYE_SLASH", "pi pi-eye-slash");
_defineProperty(PrimeIcons, "FACE_SMILE", "pi pi-face-smile");
_defineProperty(PrimeIcons, "FACEBOOK", "pi pi-facebook");
_defineProperty(PrimeIcons, "FAST_BACKWARD", "pi pi-fast-backward");
_defineProperty(PrimeIcons, "FAST_FORWARD", "pi pi-fast-forward");
_defineProperty(PrimeIcons, "FILE", "pi pi-file");
_defineProperty(PrimeIcons, "FILE_ARROW_UP", "pi pi-file-arrow-up");
_defineProperty(PrimeIcons, "FILE_CHECK", "pi pi-file-check");
_defineProperty(PrimeIcons, "FILE_EDIT", "pi pi-file-edit");
_defineProperty(PrimeIcons, "FILE_IMPORT", "pi pi-file-import");
_defineProperty(PrimeIcons, "FILE_PDF", "pi pi-file-pdf");
_defineProperty(PrimeIcons, "FILE_PLUS", "pi pi-file-plus");
_defineProperty(PrimeIcons, "FILE_EXCEL", "pi pi-file-excel");
_defineProperty(PrimeIcons, "FILE_EXPORT", "pi pi-file-export");
_defineProperty(PrimeIcons, "FILE_WORD", "pi pi-file-word");
_defineProperty(PrimeIcons, "FILTER", "pi pi-filter");
_defineProperty(PrimeIcons, "FILTER_FILL", "pi pi-filter-fill");
_defineProperty(PrimeIcons, "FILTER_SLASH", "pi pi-filter-slash");
_defineProperty(PrimeIcons, "FLAG", "pi pi-flag");
_defineProperty(PrimeIcons, "FLAG_FILL", "pi pi-flag-fill");
_defineProperty(PrimeIcons, "FOLDER", "pi pi-folder");
_defineProperty(PrimeIcons, "FOLDER_OPEN", "pi pi-folder-open");
_defineProperty(PrimeIcons, "FOLDER_PLUS", "pi pi-folder-plus");
_defineProperty(PrimeIcons, "FORWARD", "pi pi-forward");
_defineProperty(PrimeIcons, "GAUGE", "pi pi-gauge");
_defineProperty(PrimeIcons, "GIFT", "pi pi-gift");
_defineProperty(PrimeIcons, "GITHUB", "pi pi-github");
_defineProperty(PrimeIcons, "GLOBE", "pi pi-globe");
_defineProperty(PrimeIcons, "GOOGLE", "pi pi-google");
_defineProperty(PrimeIcons, "GRADUATION_CAP", "pi pi-graduation-cap");
_defineProperty(PrimeIcons, "HAMMER", "pi pi-hammer");
_defineProperty(PrimeIcons, "HASHTAG", "pi pi-hashtag");
_defineProperty(PrimeIcons, "HEADPHONES", "pi pi-headphones");
_defineProperty(PrimeIcons, "HEART", "pi pi-heart");
_defineProperty(PrimeIcons, "HEART_FILL", "pi pi-heart-fill");
_defineProperty(PrimeIcons, "HISTORY", "pi pi-history");
_defineProperty(PrimeIcons, "HOME", "pi pi-home");
_defineProperty(PrimeIcons, "HOURGLASS", "pi pi-hourglass");
_defineProperty(PrimeIcons, "ID_CARD", "pi pi-id-card");
_defineProperty(PrimeIcons, "IMAGE", "pi pi-image");
_defineProperty(PrimeIcons, "IMAGES", "pi pi-images");
_defineProperty(PrimeIcons, "INBOX", "pi pi-inbox");
_defineProperty(PrimeIcons, "INDIAN_RUPEE", "pi pi-indian-rupee");
_defineProperty(PrimeIcons, "INFO", "pi pi-info");
_defineProperty(PrimeIcons, "INFO_CIRCLE", "pi pi-info-circle");
_defineProperty(PrimeIcons, "INSTAGRAM", "pi pi-instagram");
_defineProperty(PrimeIcons, "KEY", "pi pi-key");
_defineProperty(PrimeIcons, "LANGUAGE", "pi pi-language");
_defineProperty(PrimeIcons, "LIGHTBULB", "pi pi-lightbulb");
_defineProperty(PrimeIcons, "LINK", "pi pi-link");
_defineProperty(PrimeIcons, "LINKEDIN", "pi pi-linkedin");
_defineProperty(PrimeIcons, "LIST", "pi pi-list");
_defineProperty(PrimeIcons, "LIST_CHECK", "pi pi-list-check");
_defineProperty(PrimeIcons, "LOCK", "pi pi-lock");
_defineProperty(PrimeIcons, "LOCK_OPEN", "pi pi-lock-open");
_defineProperty(PrimeIcons, "MAP", "pi pi-map");
_defineProperty(PrimeIcons, "MAP_MARKER", "pi pi-map-marker");
_defineProperty(PrimeIcons, "MARS", "pi pi-mars");
_defineProperty(PrimeIcons, "MEGAPHONE", "pi pi-megaphone");
_defineProperty(PrimeIcons, "MICROCHIP", "pi pi-microchip");
_defineProperty(PrimeIcons, "MICROCHIP_AI", "pi pi-microchip-ai");
_defineProperty(PrimeIcons, "MICROPHONE", "pi pi-microphone");
_defineProperty(PrimeIcons, "MICROSOFT", "pi pi-microsoft");
_defineProperty(PrimeIcons, "MINUS", "pi pi-minus");
_defineProperty(PrimeIcons, "MINUS_CIRCLE", "pi pi-minus-circle");
_defineProperty(PrimeIcons, "MOBILE", "pi pi-mobile");
_defineProperty(PrimeIcons, "MONEY_BILL", "pi pi-money-bill");
_defineProperty(PrimeIcons, "MOON", "pi pi-moon");
_defineProperty(PrimeIcons, "OBJECTS_COLUMN", "pi pi-objects-column");
_defineProperty(PrimeIcons, "PALETTE", "pi pi-palette");
_defineProperty(PrimeIcons, "PAPERCLIP", "pi pi-paperclip");
_defineProperty(PrimeIcons, "PAUSE", "pi pi-pause");
_defineProperty(PrimeIcons, "PAUSE_CIRCLE", "pi pi-pause-circle");
_defineProperty(PrimeIcons, "PAYPAL", "pi pi-paypal");
_defineProperty(PrimeIcons, "PEN_TO_SQUARE", "pi pi-pen-to-square");
_defineProperty(PrimeIcons, "PENCIL", "pi pi-pencil");
_defineProperty(PrimeIcons, "PERCENTAGE", "pi pi-percentage");
_defineProperty(PrimeIcons, "PHONE", "pi pi-phone");
_defineProperty(PrimeIcons, "PINTEREST", "pi pi-pinterest");
_defineProperty(PrimeIcons, "PLAY", "pi pi-play");
_defineProperty(PrimeIcons, "PLAY_CIRCLE", "pi pi-play-circle");
_defineProperty(PrimeIcons, "PLUS", "pi pi-plus");
_defineProperty(PrimeIcons, "PLUS_CIRCLE", "pi pi-plus-circle");
_defineProperty(PrimeIcons, "POUND", "pi pi-pound");
_defineProperty(PrimeIcons, "POWER_OFF", "pi pi-power-off");
_defineProperty(PrimeIcons, "PRIME", "pi pi-prime");
_defineProperty(PrimeIcons, "PRINT", "pi pi-print");
_defineProperty(PrimeIcons, "QRCODE", "pi pi-qrcode");
_defineProperty(PrimeIcons, "QUESTION", "pi pi-question");
_defineProperty(PrimeIcons, "QUESTION_CIRCLE", "pi pi-question-circle");
_defineProperty(PrimeIcons, "RECEIPT", "pi pi-receipt");
_defineProperty(PrimeIcons, "REDDIT", "pi pi-reddit");
_defineProperty(PrimeIcons, "REFRESH", "pi pi-refresh");
_defineProperty(PrimeIcons, "REPLAY", "pi pi-replay");
_defineProperty(PrimeIcons, "REPLY", "pi pi-reply");
_defineProperty(PrimeIcons, "SAVE", "pi pi-save");
_defineProperty(PrimeIcons, "SEARCH", "pi pi-search");
_defineProperty(PrimeIcons, "SEARCH_MINUS", "pi pi-search-minus");
_defineProperty(PrimeIcons, "SEARCH_PLUS", "pi pi-search-plus");
_defineProperty(PrimeIcons, "SEND", "pi pi-send");
_defineProperty(PrimeIcons, "SERVER", "pi pi-server");
_defineProperty(PrimeIcons, "SHARE_ALT", "pi pi-share-alt");
_defineProperty(PrimeIcons, "SHIELD", "pi pi-shield");
_defineProperty(PrimeIcons, "SHOP", "pi pi-shop");
_defineProperty(PrimeIcons, "SHOPPING_BAG", "pi pi-shopping-bag");
_defineProperty(PrimeIcons, "SHOPPING_CART", "pi pi-shopping-cart");
_defineProperty(PrimeIcons, "SIGN_IN", "pi pi-sign-in");
_defineProperty(PrimeIcons, "SIGN_OUT", "pi pi-sign-out");
_defineProperty(PrimeIcons, "SITEMAP", "pi pi-sitemap");
_defineProperty(PrimeIcons, "SLACK", "pi pi-slack");
_defineProperty(PrimeIcons, "SLIDERS_H", "pi pi-sliders-h");
_defineProperty(PrimeIcons, "SLIDERS_V", "pi pi-sliders-v");
_defineProperty(PrimeIcons, "SORT", "pi pi-sort");
_defineProperty(PrimeIcons, "SORT_ALPHA_DOWN", "pi pi-sort-alpha-down");
_defineProperty(PrimeIcons, "SORT_ALPHA_DOWN_ALT", "pi pi-sort-alpha-down-alt");
_defineProperty(PrimeIcons, "SORT_ALPHA_UP", "pi pi-sort-alpha-up");
_defineProperty(PrimeIcons, "SORT_ALPHA_UP_ALT", "pi pi-sort-alpha-up-alt");
_defineProperty(PrimeIcons, "SORT_ALT", "pi pi-sort-alt");
_defineProperty(PrimeIcons, "SORT_ALT_SLASH", "pi pi-sort-alt-slash");
_defineProperty(PrimeIcons, "SORT_AMOUNT_DOWN", "pi pi-sort-amount-down");
_defineProperty(PrimeIcons, "SORT_AMOUNT_DOWN_ALT", "pi pi-sort-amount-down-alt");
_defineProperty(PrimeIcons, "SORT_AMOUNT_UP", "pi pi-sort-amount-up");
_defineProperty(PrimeIcons, "SORT_AMOUNT_UP_ALT", "pi pi-sort-amount-up-alt");
_defineProperty(PrimeIcons, "SORT_DOWN", "pi pi-sort-down");
_defineProperty(PrimeIcons, "SORT_DOWN_FILL", "pi pi-sort-down-fill");
_defineProperty(PrimeIcons, "SORT_NUMERIC_DOWN", "pi pi-sort-numeric-down");
_defineProperty(PrimeIcons, "SORT_NUMERIC_DOWN_ALT", "pi pi-sort-numeric-down-alt");
_defineProperty(PrimeIcons, "SORT_NUMERIC_UP", "pi pi-sort-numeric-up");
_defineProperty(PrimeIcons, "SORT_NUMERIC_UP_ALT", "pi pi-sort-numeric-up-alt");
_defineProperty(PrimeIcons, "SORT_UP", "pi pi-sort-up");
_defineProperty(PrimeIcons, "SORT_UP_FILL", "pi pi-sort-up-fill");
_defineProperty(PrimeIcons, "SPARKLES", "pi pi-sparkles");
_defineProperty(PrimeIcons, "SPINNER", "pi pi-spinner");
_defineProperty(PrimeIcons, "SPINNER_DOTTED", "pi pi-spinner-dotted");
_defineProperty(PrimeIcons, "STAR", "pi pi-star");
_defineProperty(PrimeIcons, "STAR_FILL", "pi pi-star-fill");
_defineProperty(PrimeIcons, "STAR_HALF", "pi pi-star-half");
_defineProperty(PrimeIcons, "STAR_HALF_FILL", "pi pi-star-half-fill");
_defineProperty(PrimeIcons, "STEP_BACKWARD", "pi pi-step-backward");
_defineProperty(PrimeIcons, "STEP_BACKWARD_ALT", "pi pi-step-backward-alt");
_defineProperty(PrimeIcons, "STEP_FORWARD", "pi pi-step-forward");
_defineProperty(PrimeIcons, "STEP_FORWARD_ALT", "pi pi-step-forward-alt");
_defineProperty(PrimeIcons, "STOP", "pi pi-stop");
_defineProperty(PrimeIcons, "STOP_CIRCLE", "pi pi-stop-circle");
_defineProperty(PrimeIcons, "STOPWATCH", "pi pi-stopwatch");
_defineProperty(PrimeIcons, "SUN", "pi pi-sun");
_defineProperty(PrimeIcons, "SYNC", "pi pi-sync");
_defineProperty(PrimeIcons, "TABLE", "pi pi-table");
_defineProperty(PrimeIcons, "TABLET", "pi pi-tablet");
_defineProperty(PrimeIcons, "TAG", "pi pi-tag");
_defineProperty(PrimeIcons, "TAGS", "pi pi-tags");
_defineProperty(PrimeIcons, "TELEGRAM", "pi pi-telegram");
_defineProperty(PrimeIcons, "TH_LARGE", "pi pi-th-large");
_defineProperty(PrimeIcons, "THUMBS_DOWN", "pi pi-thumbs-down");
_defineProperty(PrimeIcons, "THUMBS_DOWN_FILL", "pi pi-thumbs-down-fill");
_defineProperty(PrimeIcons, "THUMBS_UP", "pi pi-thumbs-up");
_defineProperty(PrimeIcons, "THUMBS_UP_FILL", "pi pi-thumbs-up-fill");
_defineProperty(PrimeIcons, "THUMBTACK", "pi pi-thumbtack");
_defineProperty(PrimeIcons, "TICKET", "pi pi-ticket");
_defineProperty(PrimeIcons, "TIKTOK", "pi pi-tiktok");
_defineProperty(PrimeIcons, "TIMES", "pi pi-times");
_defineProperty(PrimeIcons, "TIMES_CIRCLE", "pi pi-times-circle");
_defineProperty(PrimeIcons, "TRASH", "pi pi-trash");
_defineProperty(PrimeIcons, "TROPHY", "pi pi-trophy");
_defineProperty(PrimeIcons, "TRUCK", "pi pi-truck");
_defineProperty(PrimeIcons, "TURKISH_LIRA", "pi pi-turkish-lira");
_defineProperty(PrimeIcons, "TWITCH", "pi pi-twitch");
_defineProperty(PrimeIcons, "TWITTER", "pi pi-twitter");
_defineProperty(PrimeIcons, "UNDO", "pi pi-undo");
_defineProperty(PrimeIcons, "UNLOCK", "pi pi-unlock");
_defineProperty(PrimeIcons, "UPLOAD", "pi pi-upload");
_defineProperty(PrimeIcons, "USER", "pi pi-user");
_defineProperty(PrimeIcons, "USER_EDIT", "pi pi-user-edit");
_defineProperty(PrimeIcons, "USER_MINUS", "pi pi-user-minus");
_defineProperty(PrimeIcons, "USER_PLUS", "pi pi-user-plus");
_defineProperty(PrimeIcons, "USERS", "pi pi-users");
_defineProperty(PrimeIcons, "VENUS", "pi pi-venus");
_defineProperty(PrimeIcons, "VERIFIED", "pi pi-verified");
_defineProperty(PrimeIcons, "VIDEO", "pi pi-video");
_defineProperty(PrimeIcons, "VIMEO", "pi pi-vimeo");
_defineProperty(PrimeIcons, "VOLUME_DOWN", "pi pi-volume-down");
_defineProperty(PrimeIcons, "VOLUME_OFF", "pi pi-volume-off");
_defineProperty(PrimeIcons, "VOLUME_UP", "pi pi-volume-up");
_defineProperty(PrimeIcons, "WALLET", "pi pi-wallet");
_defineProperty(PrimeIcons, "WAREHOUSE", "pi pi-warehouse");
_defineProperty(PrimeIcons, "WAVE_PULSE", "pi pi-wave-pulse");
_defineProperty(PrimeIcons, "WHATSAPP", "pi pi-whatsapp");
_defineProperty(PrimeIcons, "WIFI", "pi pi-wifi");
_defineProperty(PrimeIcons, "WINDOW_MAXIMIZE", "pi pi-window-maximize");
_defineProperty(PrimeIcons, "WINDOW_MINIMIZE", "pi pi-window-minimize");
_defineProperty(PrimeIcons, "WRENCH", "pi pi-wrench");
_defineProperty(PrimeIcons, "YOUTUBE", "pi pi-youtube");
/**
* @deprecated Use ng-template #header instead.
*/
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
		encapsulation: 2
	});
})());
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(Header, [{
		type: Component,
		args: [{
			selector: "p-header",
			template: "<ng-content></ng-content>",
			standalone: false
		}]
	}], null, null);
})();
/**
* @deprecated Use ng-template #footer instead.
*/
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
		encapsulation: 2
	});
})());
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(Footer, [{
		type: Component,
		args: [{
			selector: "p-footer",
			template: "<ng-content></ng-content>",
			standalone: false
		}]
	}], null, null);
})();
/**
* @deprecated Use ng-template #templateName instead.
*/
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
export { ConfirmEventType, ConfirmationService, ContextMenuService, FilterMatchMode, FilterOperator, FilterService, Footer, Header, MessageService, OverlayService, PrimeIcons, PrimeTemplate, SharedModule, TranslationKeys, TreeDragDropService };
