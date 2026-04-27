"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scanSchema = exports.itemSchema = exports.categorySchema = exports.loginSchema = exports.registerSchema = void 0;
const zod_1 = require("zod");
exports.registerSchema = zod_1.z.object({
    name: zod_1.z.string().min(2),
    email: zod_1.z.email(),
    password: zod_1.z.string().min(6),
    role: zod_1.z.enum(['ADMIN', 'USER']).optional(),
});
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.email(),
    password: zod_1.z.string().min(6),
});
exports.categorySchema = zod_1.z.object({
    name: zod_1.z.string().min(2),
});
exports.itemSchema = zod_1.z.object({
    name: zod_1.z.string().min(2),
    sku: zod_1.z.string().min(2),
    categoryId: zod_1.z.uuid(),
    quantity: zod_1.z.number().int().min(0),
    price: zod_1.z.number().min(0),
    supplier: zod_1.z.string().min(2),
    location: zod_1.z.string().min(2),
    description: zod_1.z.string().optional(),
    lowStockAt: zod_1.z.number().int().min(0).optional(),
});
exports.scanSchema = zod_1.z.object({
    qrCode: zod_1.z.string().min(8),
    note: zod_1.z.string().optional(),
});
