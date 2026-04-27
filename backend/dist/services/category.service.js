"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.categoryService = void 0;
const prisma_1 = require("../config/prisma");
const api_error_1 = require("../utils/api-error");
const activity_service_1 = require("./activity.service");
const audit_service_1 = require("./audit.service");
exports.categoryService = {
    create: async (name, userId) => {
        const category = await prisma_1.prisma.category.create({ data: { name } });
        await activity_service_1.activityService.create({
            action: 'CREATE',
            entityType: 'CATEGORY',
            entityId: category.id,
            description: `Category "${name}" created`,
            userId,
        });
        return category;
    },
    list: async () => {
        const categories = await prisma_1.prisma.category.findMany({
            orderBy: { createdAt: 'desc' },
            include: { _count: { select: { items: true } } },
        });
        return categories.map((category) => ({
            id: category.id,
            name: category.name,
            itemsCount: category._count.items,
            createdAt: category.createdAt,
            updatedAt: category.updatedAt,
        }));
    },
    update: async (id, name, userId) => {
        const existing = await prisma_1.prisma.category.findUnique({ where: { id } });
        if (!existing)
            throw new api_error_1.ApiError(404, 'Category not found');
        const category = await prisma_1.prisma.category.update({ where: { id }, data: { name } });
        await audit_service_1.auditService.create({
            entityType: 'CATEGORY',
            entityId: id,
            oldData: existing,
            newData: category,
            userId,
        });
        return category;
    },
    delete: async (id, userId) => {
        const category = await prisma_1.prisma.category.findUnique({ where: { id } });
        if (!category)
            throw new api_error_1.ApiError(404, 'Category not found');
        await prisma_1.prisma.category.delete({ where: { id } });
        await activity_service_1.activityService.create({
            action: 'DELETE',
            entityType: 'CATEGORY',
            entityId: id,
            description: `Category "${category.name}" deleted`,
            userId,
        });
    },
};
