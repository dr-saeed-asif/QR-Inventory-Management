"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stockController = void 0;
const stock_service_1 = require("../services/stock.service");
exports.stockController = {
    stockIn: async (req, res, next) => {
        try {
            const data = await stock_service_1.stockService.stockIn(req.body, req.user?.userId);
            res.status(201).json(data);
        }
        catch (error) {
            next(error);
        }
    },
    stockOut: async (req, res, next) => {
        try {
            const data = await stock_service_1.stockService.stockOut(req.body, req.user?.userId);
            res.status(201).json(data);
        }
        catch (error) {
            next(error);
        }
    },
    transfer: async (req, res, next) => {
        try {
            const data = await stock_service_1.stockService.transfer(req.body, req.user?.userId);
            res.status(201).json(data);
        }
        catch (error) {
            next(error);
        }
    },
    adjust: async (req, res, next) => {
        try {
            const data = await stock_service_1.stockService.adjust(req.body, req.user?.userId);
            res.status(201).json(data);
        }
        catch (error) {
            next(error);
        }
    },
    history: async (req, res, next) => {
        try {
            const data = await stock_service_1.stockService.history(req.query.itemId);
            res.json(data);
        }
        catch (error) {
            next(error);
        }
    },
};
