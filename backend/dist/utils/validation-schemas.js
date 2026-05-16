"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminRoleUpdateSchema = exports.adminRoleCreateSchema = exports.adminUserUpdateSchema = exports.adminUserCreateSchema = exports.stockAdjustmentSchema = exports.stockTransferSchema = exports.stockOutSchema = exports.stockInSchema = exports.scanSchema = exports.itemUpdateSchema = exports.itemSchema = exports.locationSchema = exports.warehouseSchema = exports.categorySchema = exports.loginSchema = exports.registerSchema = void 0;
const zod_1 = require("zod");
const dateStringSchema = zod_1.z
    .string()
    .refine((value) => !Number.isNaN(new Date(value).getTime()), 'Invalid date');
exports.registerSchema = zod_1.z.object({
    name: zod_1.z.string().min(2),
    email: zod_1.z.email(),
    password: zod_1.z.string().min(6),
    role: zod_1.z.enum(['ADMIN', 'MANAGER', 'USER']).optional(),
});
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.email(),
    password: zod_1.z.string().min(6),
});
exports.categorySchema = zod_1.z.object({
    name: zod_1.z.string().min(2),
});
exports.warehouseSchema = zod_1.z.object({
    name: zod_1.z.string().min(2),
    code: zod_1.z.string().min(2),
    address: zod_1.z.string().optional(),
});
exports.locationSchema = zod_1.z.object({
    warehouseId: zod_1.z.uuid(),
    name: zod_1.z.string().min(2).optional(),
    shelf: zod_1.z.string().min(1),
    rack: zod_1.z.string().min(1),
    bin: zod_1.z.string().min(1),
});
const generateItemSku = () => `${Date.now()}${Math.floor(100 + Math.random() * 900)}`;
exports.itemSchema = zod_1.z
    .object({
    name: zod_1.z.string().trim().min(2),
    sku: zod_1.z.string().min(2).optional(),
    categoryId: zod_1.z.uuid(),
    locationId: zod_1.z.uuid().optional(),
    categoryIds: zod_1.z.array(zod_1.z.uuid()).optional(),
    tags: zod_1.z.array(zod_1.z.string().min(1)).optional(),
    quantity: zod_1.z.number().int().min(0).optional(),
    reservedQty: zod_1.z.number().int().min(0).optional(),
    expiryDate: dateStringSchema.optional(),
    price: zod_1.z.number().positive(),
    supplier: zod_1.z.string().optional(),
    location: zod_1.z.string().optional(),
    description: zod_1.z.string().optional(),
    lowStockAt: zod_1.z.number().int().min(0).optional(),
    batches: zod_1.z
        .array(zod_1.z.object({
        batchNumber: zod_1.z.string().min(1),
        lotNumber: zod_1.z.string().optional(),
        expiryDate: dateStringSchema.optional(),
        quantity: zod_1.z.number().int().min(0),
    }))
        .optional(),
    variants: zod_1.z
        .array(zod_1.z.object({
        name: zod_1.z.string().optional(),
        sku: zod_1.z.string().min(2),
        size: zod_1.z.string().optional(),
        color: zod_1.z.string().optional(),
        model: zod_1.z.string().optional(),
        quantity: zod_1.z.number().int().min(0).default(0),
        reservedQty: zod_1.z.number().int().min(0).optional(),
        price: zod_1.z.number().min(0).optional(),
    }))
        .optional(),
})
    .transform((data) => ({
    ...data,
    sku: data.sku?.trim() || generateItemSku(),
    quantity: data.quantity ?? 0,
    supplier: data.supplier?.trim() || 'General',
    location: data.location?.trim() || 'General',
}));
exports.itemUpdateSchema = zod_1.z
    .object({
    name: zod_1.z.string().trim().min(2).optional(),
    sku: zod_1.z.string().min(2).optional(),
    categoryId: zod_1.z.uuid().optional(),
    locationId: zod_1.z.uuid().optional(),
    categoryIds: zod_1.z.array(zod_1.z.uuid()).optional(),
    tags: zod_1.z.array(zod_1.z.string().min(1)).optional(),
    quantity: zod_1.z.number().int().min(0).optional(),
    reservedQty: zod_1.z.number().int().min(0).optional(),
    expiryDate: dateStringSchema.optional(),
    price: zod_1.z.number().min(0).optional(),
    supplier: zod_1.z.string().optional(),
    location: zod_1.z.string().optional(),
    description: zod_1.z.string().optional(),
    lowStockAt: zod_1.z.number().int().min(0).optional(),
    batches: zod_1.z
        .array(zod_1.z.object({
        batchNumber: zod_1.z.string().min(1),
        lotNumber: zod_1.z.string().optional(),
        expiryDate: dateStringSchema.optional(),
        quantity: zod_1.z.number().int().min(0),
    }))
        .optional(),
    variants: zod_1.z
        .array(zod_1.z.object({
        name: zod_1.z.string().optional(),
        sku: zod_1.z.string().min(2),
        size: zod_1.z.string().optional(),
        color: zod_1.z.string().optional(),
        model: zod_1.z.string().optional(),
        quantity: zod_1.z.number().int().min(0).default(0),
        reservedQty: zod_1.z.number().int().min(0).optional(),
        price: zod_1.z.number().min(0).optional(),
    }))
        .optional(),
})
    .partial();
exports.scanSchema = zod_1.z.object({
    qrCode: zod_1.z.string().min(1),
    note: zod_1.z.string().optional(),
});
exports.stockInSchema = zod_1.z.object({
    itemId: zod_1.z.uuid(),
    quantity: zod_1.z.number().int().positive(),
    note: zod_1.z.string().optional(),
    reference: zod_1.z.string().optional(),
    destinationWarehouse: zod_1.z.string().min(1).optional(),
});
exports.stockOutSchema = zod_1.z.object({
    itemId: zod_1.z.uuid(),
    quantity: zod_1.z.number().int().positive(),
    note: zod_1.z.string().optional(),
    reference: zod_1.z.string().optional(),
    sourceWarehouse: zod_1.z.string().min(1).optional(),
});
exports.stockTransferSchema = zod_1.z.object({
    itemId: zod_1.z.uuid(),
    quantity: zod_1.z.number().int().positive(),
    sourceWarehouse: zod_1.z.string().min(1),
    destinationWarehouse: zod_1.z.string().min(1),
    note: zod_1.z.string().optional(),
    reference: zod_1.z.string().optional(),
});
exports.stockAdjustmentSchema = zod_1.z.object({
    itemId: zod_1.z.uuid(),
    quantity: zod_1.z.number().int().nonnegative(),
    reason: zod_1.z.enum(['DAMAGE', 'LOSS', 'RECOUNT', 'MANUAL']),
    note: zod_1.z.string().optional(),
    reference: zod_1.z.string().optional(),
});
exports.adminUserCreateSchema = zod_1.z.object({
    name: zod_1.z.string().min(2),
    email: zod_1.z.email(),
    password: zod_1.z.string().min(6),
    role: zod_1.z.string().min(1),
});
exports.adminUserUpdateSchema = zod_1.z.object({
    name: zod_1.z.string().min(2).optional(),
    email: zod_1.z.email().optional(),
    password: zod_1.z.string().min(6).optional(),
    role: zod_1.z.string().min(1).optional(),
});
exports.adminRoleCreateSchema = zod_1.z.object({
    name: zod_1.z.string().min(2),
    permissions: zod_1.z.array(zod_1.z.string().min(1)).min(1),
});
exports.adminRoleUpdateSchema = zod_1.z.object({
    name: zod_1.z.string().min(2).optional(),
    permissions: zod_1.z.array(zod_1.z.string().min(1)).min(1).optional(),
});
