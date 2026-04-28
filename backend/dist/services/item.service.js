"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.itemService = void 0;
const client_1 = require("@prisma/client");
const prisma_1 = require("../config/prisma");
const api_error_1 = require("../utils/api-error");
const qr_1 = require("../utils/qr");
const activity_service_1 = require("./activity.service");
const audit_service_1 = require("./audit.service");
const itemInclude = {
    category: true,
    categories: { include: { category: true } },
    tags: { include: { tag: true } },
    variants: true,
};
const mapItemResponse = (item) => ({
    ...item,
    availableQty: Math.max(0, item.quantity - item.reservedQty),
    categories: item.categories.map((link) => link.category),
    tags: item.tags.map((link) => link.tag),
    variants: item.variants.map((variant) => ({
        ...variant,
        availableQty: Math.max(0, variant.quantity - variant.reservedQty),
    })),
});
exports.itemService = {
    create: async (input, userId) => {
        const categoryIds = Array.from(new Set([input.categoryId, ...(input.categoryIds ?? [])]));
        const categories = await prisma_1.prisma.category.findMany({ where: { id: { in: categoryIds } } });
        const category = categories.find((row) => row.id === input.categoryId);
        if (!category)
            throw new api_error_1.ApiError(404, 'Category not found');
        if (categories.length !== categoryIds.length) {
            throw new api_error_1.ApiError(400, 'One or more categories are invalid');
        }
        const item = await prisma_1.prisma.$transaction(async (tx) => {
            const created = await tx.item.create({
                data: {
                    name: input.name,
                    sku: input.sku,
                    quantity: input.quantity,
                    reservedQty: input.reservedQty ?? 0,
                    price: new client_1.Prisma.Decimal(input.price),
                    supplier: input.supplier,
                    location: input.location,
                    description: input.description,
                    lowStockAt: input.lowStockAt,
                    categoryId: input.categoryId,
                    qrValue: (0, qr_1.generateQrValue)(),
                    barcodeValue: (0, qr_1.generateBarcodeValue)(input.sku),
                    categories: {
                        create: categoryIds.map((categoryId) => ({
                            categoryId,
                        })),
                    },
                    tags: input.tags?.length
                        ? {
                            create: input.tags.map((tagName) => ({
                                tag: {
                                    connectOrCreate: {
                                        where: { name: tagName.trim().toLowerCase() },
                                        create: { name: tagName.trim().toLowerCase() },
                                    },
                                },
                            })),
                        }
                        : undefined,
                    variants: input.variants?.length
                        ? {
                            create: input.variants.map((variant) => ({
                                name: variant.name,
                                sku: variant.sku,
                                size: variant.size,
                                color: variant.color,
                                model: variant.model,
                                quantity: variant.quantity ?? 0,
                                reservedQty: variant.reservedQty ?? 0,
                                price: typeof variant.price === 'number' ? new client_1.Prisma.Decimal(variant.price) : undefined,
                            })),
                        }
                        : undefined,
                },
                include: itemInclude,
            });
            return created;
        });
        await activity_service_1.activityService.create({
            action: 'CREATE',
            entityType: 'ITEM',
            entityId: item.id,
            description: `Item "${item.name}" created`,
            userId,
            itemId: item.id,
        });
        return mapItemResponse(item);
    },
    createManyFromImport: async (rows, userId) => {
        let created = 0;
        let updated = 0;
        for (const row of rows) {
            const categoryName = row.category.trim();
            const category = await prisma_1.prisma.category.upsert({
                where: { name: categoryName },
                update: {},
                create: { name: categoryName },
            });
            const existing = await prisma_1.prisma.item.findUnique({ where: { sku: row.sku } });
            if (existing) {
                await prisma_1.prisma.item.update({
                    where: { sku: row.sku },
                    data: {
                        name: row.name,
                        quantity: row.quantity,
                        reservedQty: row.reservedQty ?? existing.reservedQty,
                        price: new client_1.Prisma.Decimal(row.price),
                        supplier: row.supplier,
                        location: row.location,
                        description: row.description,
                        categoryId: category.id,
                    },
                });
                updated += 1;
            }
            else {
                await prisma_1.prisma.item.create({
                    data: {
                        name: row.name,
                        sku: row.sku,
                        quantity: row.quantity,
                        reservedQty: row.reservedQty ?? 0,
                        price: new client_1.Prisma.Decimal(row.price),
                        supplier: row.supplier,
                        location: row.location,
                        description: row.description,
                        categoryId: category.id,
                        qrValue: (0, qr_1.generateQrValue)(),
                        barcodeValue: (0, qr_1.generateBarcodeValue)(row.sku),
                        categories: {
                            create: [{ categoryId: category.id }],
                        },
                    },
                });
                created += 1;
            }
        }
        await activity_service_1.activityService.create({
            action: 'IMPORT',
            entityType: 'ITEM',
            entityId: 'bulk',
            description: `Imported items: created ${created}, updated ${updated}`,
            userId,
        });
        return { created, updated, total: rows.length };
    },
    list: async (query) => {
        const page = Number(query.page ?? '1');
        const limit = Number(query.limit ?? '10');
        const skip = (page - 1) * limit;
        const where = {
            name: query.search ? { contains: query.search } : undefined,
            categoryId: query.categoryId || undefined,
            location: query.location ? { contains: query.location } : undefined,
            tags: query.tag
                ? {
                    some: {
                        tag: {
                            name: query.tag.trim().toLowerCase(),
                        },
                    },
                }
                : undefined,
        };
        const [data, total] = await Promise.all([
            prisma_1.prisma.item.findMany({
                where,
                include: itemInclude,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            prisma_1.prisma.item.count({ where }),
        ]);
        return { data: data.map(mapItemResponse), total, page, limit };
    },
    getById: async (id) => {
        const item = await prisma_1.prisma.item.findUnique({ where: { id }, include: itemInclude });
        if (!item)
            throw new api_error_1.ApiError(404, 'Item not found');
        return mapItemResponse(item);
    },
    getByCode: async (code) => {
        const item = await prisma_1.prisma.item.findFirst({
            where: {
                OR: [{ qrValue: code }, { barcodeValue: code }],
            },
            include: itemInclude,
        });
        if (!item)
            throw new api_error_1.ApiError(404, 'Item not found for provided code');
        return mapItemResponse(item);
    },
    update: async (id, input, userId) => {
        const existing = await prisma_1.prisma.item.findUnique({ where: { id }, include: itemInclude });
        if (!existing)
            throw new api_error_1.ApiError(404, 'Item not found');
        const categoryIds = input.categoryIds
            ? Array.from(new Set([...(input.categoryId ? [input.categoryId] : []), ...input.categoryIds]))
            : input.categoryId
                ? [input.categoryId]
                : undefined;
        if (categoryIds?.length) {
            const categories = await prisma_1.prisma.category.findMany({ where: { id: { in: categoryIds } } });
            if (categories.length !== categoryIds.length) {
                throw new api_error_1.ApiError(400, 'One or more categories are invalid');
            }
        }
        const updated = await prisma_1.prisma.$transaction(async (tx) => {
            if (categoryIds) {
                await tx.itemCategory.deleteMany({ where: { itemId: id } });
            }
            if (input.tags) {
                await tx.itemTag.deleteMany({ where: { itemId: id } });
            }
            if (input.variants) {
                await tx.itemVariant.deleteMany({ where: { itemId: id } });
            }
            const row = await tx.item.update({
                where: { id },
                data: {
                    name: input.name,
                    sku: input.sku,
                    categoryId: input.categoryId,
                    quantity: input.quantity,
                    reservedQty: input.reservedQty,
                    price: typeof input.price === 'number' ? new client_1.Prisma.Decimal(input.price) : undefined,
                    supplier: input.supplier,
                    location: input.location,
                    description: input.description,
                    lowStockAt: input.lowStockAt,
                    categories: categoryIds
                        ? {
                            create: categoryIds.map((categoryId) => ({
                                categoryId,
                            })),
                        }
                        : undefined,
                    tags: input.tags
                        ? {
                            create: input.tags.map((tagName) => ({
                                tag: {
                                    connectOrCreate: {
                                        where: { name: tagName.trim().toLowerCase() },
                                        create: { name: tagName.trim().toLowerCase() },
                                    },
                                },
                            })),
                        }
                        : undefined,
                    variants: input.variants
                        ? {
                            create: input.variants.map((variant) => ({
                                name: variant.name,
                                sku: variant.sku,
                                size: variant.size,
                                color: variant.color,
                                model: variant.model,
                                quantity: variant.quantity ?? 0,
                                reservedQty: variant.reservedQty ?? 0,
                                price: typeof variant.price === 'number' ? new client_1.Prisma.Decimal(variant.price) : undefined,
                            })),
                        }
                        : undefined,
                },
                include: itemInclude,
            });
            return row;
        });
        await audit_service_1.auditService.create({
            entityType: 'ITEM',
            entityId: id,
            oldData: existing,
            newData: updated,
            userId,
            itemId: id,
        });
        return mapItemResponse(updated);
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
