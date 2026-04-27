"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.itemController = void 0;
const item_service_1 = require("../services/item.service");
exports.itemController = {
    create: async (req, res, next) => {
        try {
            const item = await item_service_1.itemService.create(req.body, req.user?.userId);
            res.status(201).json(item);
        }
        catch (error) {
            next(error);
        }
    },
    list: async (req, res, next) => {
        try {
            const data = await item_service_1.itemService.list(req.query);
            res.json(data);
        }
        catch (error) {
            next(error);
        }
    },
    getById: async (req, res, next) => {
        try {
            res.json(await item_service_1.itemService.getById(String(req.params.id)));
        }
        catch (error) {
            next(error);
        }
    },
    update: async (req, res, next) => {
        try {
            res.json(await item_service_1.itemService.update(String(req.params.id), req.body, req.user?.userId));
        }
        catch (error) {
            next(error);
        }
    },
    delete: async (req, res, next) => {
        try {
            await item_service_1.itemService.delete(String(req.params.id), req.user?.userId);
            res.status(204).send();
        }
        catch (error) {
            next(error);
        }
    },
};
