"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportService = void 0;
const sync_1 = require("csv-stringify/sync");
const prisma_1 = require("../config/prisma");
exports.reportService = {
    exportCsv: async () => {
        const items = await prisma_1.prisma.item.findMany({ include: { category: true } });
        return (0, sync_1.stringify)(items.map((item) => ({
            name: item.name,
            sku: item.sku,
            category: item.category.name,
            quantity: item.quantity,
            location: item.location,
            supplier: item.supplier,
        })), { header: true });
    },
    lowStock: async () => prisma_1.prisma.$queryRaw `
      SELECT i.*, c.name as categoryName
      FROM Item i
      JOIN Category c ON i.categoryId = c.id
      WHERE i.quantity <= i.lowStockAt
      ORDER BY i.quantity ASC
    `,
    recent: async () => prisma_1.prisma.item.findMany({
        include: { category: true },
        orderBy: { createdAt: 'desc' },
        take: 10,
    }),
};
