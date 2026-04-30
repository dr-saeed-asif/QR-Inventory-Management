"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const register_module_routes_1 = require("../modules/register-module-routes");
const router = (0, express_1.Router)();
(0, register_module_routes_1.registerModuleRoutes)(router);
exports.default = router;
