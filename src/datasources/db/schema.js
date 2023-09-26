"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
exports.__esModule = true;
// TABLES/RELATIONS/CRUD
__exportStar(require("~/datasources/db/allowedCurrencies"), exports);
__exportStar(require("~/datasources/db/communities"), exports);
__exportStar(require("~/datasources/db/companies"), exports);
__exportStar(require("~/datasources/db/events"), exports);
__exportStar(require("~/datasources/db/eventsCommunities"), exports);
__exportStar(require("~/datasources/db/eventsTags"), exports);
__exportStar(require("~/datasources/db/eventsUsers"), exports);
__exportStar(require("~/datasources/db/salaries"), exports);
__exportStar(require("~/datasources/db/tags"), exports);
__exportStar(require("~/datasources/db/tagsCommunities"), exports);
__exportStar(require("~/datasources/db/tickets"), exports);
__exportStar(require("~/datasources/db/users"), exports);
__exportStar(require("~/datasources/db/usersCommunities"), exports);
__exportStar(require("~/datasources/db/userTickets"), exports);
__exportStar(require("~/datasources/db/workEmail"), exports);
__exportStar(require("~/datasources/db/workRoles"), exports);
