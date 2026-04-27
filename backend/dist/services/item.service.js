"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.itemService = void 0;
const client_1 = require("@prisma/client");
const prisma_1 = require("../config/prisma");
const api_error_1 = require("../utils/api-error");
const qr_1 = require("../utils/qr");
const activity_service_1 = require("./activity.service");
const audit_service_1 = require("./audit.service");
exports.itemService = {
    create: async (input, userId) => {
        const category = await prisma_1.prisma.category.findUnique({ where: { id: input.categoryId } });
        if (!category)
            throw new api_error_1.ApiError(404, 'Category not found');
        const item = await prisma_1.prisma.item.create({
            data: {
                ...input,
                price: new client_1.Prisma.Decimal(input.price),
                qrValue: (0, qr_1.generateQrValue)(),
            },
            include: { category: true },
        });
        await activity_service_1.activityService.create({
            action: 'CREATE',
            entityType: 'ITEM',
            entityId: item.id,
            description: `Item "${item.name}" created`,
            userId,
            itemId: item.id,
        });
        return item;
    },
    list: async (query) => {
        const page = Number(query.page ?? '1');
        const limit = Number(query.limit ?? '10');
        const skip = (page - 1) * limit;
        const where = {
            name: query.search ? { contains: query.search } : undefined,
            categoryId: query.categoryId || undefined,
            location: query.location ? { contains: query.location } : undefined,
        };
        const [data, total] = await Promise.all([
            prisma_1.prisma.item.findMany({
                where,
                include: { category: true },
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            prisma_1.prisma.item.count({ where }),
        ]);
        return { data, total, page, limit };
    },
    getById: async (id) => {
        const item = await prisma_1.prisma.item.findUnique({ where: { id }, include: { category: true } });
        if (!item)
            throw new api_error_1.ApiError(404, 'Item not found');
        return item;
    },
    getByQrCode: async (code) => {
        const item = await prisma_1.prisma.item.findUnique({ where: { qrValue: code }, include: { category: true } });
        if (!item)
            throw new api_error_1.ApiError(404, 'Item not found for QR code');
        return item;
    },
    update: async (id, input, userId) => {
        const existing = await prisma_1.prisma.item.findUnique({ where: { id } });
        if (!existing)
            throw new api_error_1.ApiError(404, 'Item not found');
        const updated = await prisma_1.prisma.item.update({
            where: { id },
            data: {
                ...input,
                price: typeof input.price === 'number' ? new client_1.Prisma.Decimal(input.price) : undefined,
            },
            include: { category: true },
        });
        await audit_service_1.auditService.create({
            entityType: 'ITEM',
            entityId: id,
            oldData: existing,
            newData: updated,
            userId,
            itemId: id,
        });
        return updated;
    },
    delete: async (id, userId) => {
        const existing = await prisma_1.prisma.item.findUnique({ where: { id } });
        if (!existing)
            throw new api_error_1.ApiError(404, 'Item not found');
        await prisma_1.prisma.item.delete({ where: { id } });
        await activity_service_1.activityService.create({
            action: 'DELETE',
            entityType: 'ITEM',
            entityId: id,
            description: `Item "${existing.name}" deleted`,
            userId,
            itemId: id,
        });
    },
};
