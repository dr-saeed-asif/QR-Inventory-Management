"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.categoryController = void 0;
const category_service_1 = require("../services/category.service");
exports.categoryController = {
    create: async (req, res, next) => {
        try {
            const category = await category_service_1.categoryService.create(req.body.name, req.user?.userId);
            res.status(201).json(category);
        }
        catch (error) {
            next(error);
        }
    },
    list: async (_req, res, next) => {
        try {
            res.json(await category_service_1.categoryService.list());
        }
        catch (error) {
            next(error);
        }
    },
    update: async (req, res, next) => {
        try {
            res.json(await category_service_1.categoryService.update(String(req.params.id), req.body.name, req.user?.userId));
        }
        catch (error) {
            next(error);
        }
    },
    delete: async (req, res, next) => {
        try {
            await category_service_1.categoryService.delete(String(req.params.id), req.user?.userId);
            res.status(204).send();
        }
        catch (error) {
            next(error);
        }
    },
};
