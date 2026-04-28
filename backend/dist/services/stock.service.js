"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stockService = void 0;
const prisma_1 = require("../config/prisma");
const api_error_1 = require("../utils/api-error");
const activity_service_1 = require("./activity.service");
const audit_service_1 = require("./audit.service");
exports.stockService = {
    stockIn: async (payload, userId) => {
        const result = await prisma_1.prisma.$transaction(async (tx) => {
            const item = await tx.item.findUnique({ where: { id: payload.itemId } });
            if (!item)
                throw new api_error_1.ApiError(404, 'Item not found');
            const beforeQty = item.quantity;
            const afterQty = beforeQty + payload.quantity;
            const updated = await tx.item.update({
                where: { id: payload.itemId },
                data: { quantity: afterQty },
            });
            const movement = await tx.stockMovement.create({
                data: {
                    itemId: payload.itemId,
                    type: 'IN',
                    quantity: payload.quantity,
                    beforeQty,
                    afterQty,
                    note: payload.note,
                    reference: payload.reference,
                    destinationWarehouse: payload.destinationWarehouse,
                    userId,
                },
            });
            return { updated, movement, beforeQty };
        });
        await activity_service_1.activityService.create({
            action: 'STOCK_IN',
            entityType: 'ITEM',
            entityId: payload.itemId,
            description: `Stock IN ${payload.quantity}`,
            userId,
            itemId: payload.itemId,
        });
        await audit_service_1.auditService.create({
            entityType: 'ITEM',
            entityId: payload.itemId,
            oldData: { quantity: result.beforeQty },
            newData: { quantity: result.updated.quantity },
            userId,
            itemId: payload.itemId,
        });
        return result;
    },
    stockOut: async (payload, userId) => {
        const result = await prisma_1.prisma.$transaction(async (tx) => {
            const item = await tx.item.findUnique({ where: { id: payload.itemId } });
            if (!item)
                throw new api_error_1.ApiError(404, 'Item not found');
            if (payload.quantity > item.quantity)
                throw new api_error_1.ApiError(400, 'Insufficient stock quantity');
            const beforeQty = item.quantity;
            const afterQty = beforeQty - payload.quantity;
            if (afterQty < item.reservedQty) {
                throw new api_error_1.ApiError(400, 'Cannot reduce stock below reserved quantity');
            }
            const updated = await tx.item.update({
                where: { id: payload.itemId },
                data: { quantity: afterQty },
            });
            const movement = await tx.stockMovement.create({
                data: {
                    itemId: payload.itemId,
                    type: 'OUT',
                    quantity: payload.quantity,
                    beforeQty,
                    afterQty,
                    note: payload.note,
                    reference: payload.reference,
                    sourceWarehouse: payload.sourceWarehouse,
                    userId,
                },
            });
            return { updated, movement, beforeQty };
        });
        await activity_service_1.activityService.create({
            action: 'STOCK_OUT',
            entityType: 'ITEM',
            entityId: payload.itemId,
            description: `Stock OUT ${payload.quantity}`,
            userId,
            itemId: payload.itemId,
        });
        await audit_service_1.auditService.create({
            entityType: 'ITEM',
            entityId: payload.itemId,
            oldData: { quantity: result.beforeQty },
            newData: { quantity: result.updated.quantity },
            userId,
            itemId: payload.itemId,
        });
        return result;
    },
    transfer: async (payload, userId) => {
        const result = await prisma_1.prisma.$transaction(async (tx) => {
            const item = await tx.item.findUnique({ where: { id: payload.itemId } });
            if (!item)
                throw new api_error_1.ApiError(404, 'Item not found');
            if (payload.quantity > item.quantity)
                throw new api_error_1.ApiError(400, 'Insufficient stock quantity');
            const beforeQty = item.quantity;
            const afterQty = beforeQty;
            const movement = await tx.stockMovement.create({
                data: {
                    itemId: payload.itemId,
                    type: 'TRANSFER',
                    quantity: payload.quantity,
                    beforeQty,
                    afterQty,
                    note: payload.note,
                    reference: payload.reference,
                    sourceWarehouse: payload.sourceWarehouse,
                    destinationWarehouse: payload.destinationWarehouse,
                    userId,
                },
            });
            return { item, movement };
        });
        await activity_service_1.activityService.create({
            action: 'STOCK_TRANSFER',
            entityType: 'ITEM',
            entityId: payload.itemId,
            description: `Transferred ${payload.quantity} from ${payload.sourceWarehouse} to ${payload.destinationWarehouse}`,
            userId,
            itemId: payload.itemId,
        });
        return result;
    },
    adjust: async (payload, userId) => {
        const result = await prisma_1.prisma.$transaction(async (tx) => {
            const item = await tx.item.findUnique({ where: { id: payload.itemId } });
            if (!item)
                throw new api_error_1.ApiError(404, 'Item not found');
            const beforeQty = item.quantity;
            const afterQty = payload.quantity;
            if (afterQty < item.reservedQty) {
                throw new api_error_1.ApiError(400, 'Adjusted quantity cannot be below reserved quantity');
            }
            const updated = await tx.item.update({
                where: { id: payload.itemId },
                data: { quantity: afterQty },
            });
            const movement = await tx.stockMovement.create({
                data: {
                    itemId: payload.itemId,
                    type: 'ADJUSTMENT',
                    quantity: Math.abs(afterQty - beforeQty),
                    beforeQty,
                    afterQty,
                    adjustmentReason: payload.reason,
                    note: payload.note,
                    reference: payload.reference,
                    userId,
                },
            });
            return { updated, movement, beforeQty };
        });
        await activity_service_1.activityService.create({
            action: 'STOCK_ADJUSTMENT',
            entityType: 'ITEM',
            entityId: payload.itemId,
            description: `Adjusted stock to ${payload.quantity} (${payload.reason})`,
            userId,
            itemId: payload.itemId,
        });
        await audit_service_1.auditService.create({
            entityType: 'ITEM',
            entityId: payload.itemId,
            oldData: { quantity: result.beforeQty },
            newData: { quantity: result.updated.quantity, reason: payload.reason },
            userId,
            itemId: payload.itemId,
        });
        return result;
    },
    history: async (itemId) => prisma_1.prisma.stockMovement.findMany({
        where: itemId ? { itemId } : undefined,
        include: {
            item: { select: { id: true, name: true, sku: true } },
            user: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
    }),
};
