"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.itemCatalogService = void 0;
const prisma_1 = require("../config/prisma");
const grocery_catalog_1 = require("../data/grocery-catalog");
const qr_1 = require("../utils/qr");
const seedSku = (name, index) => `CAT${Date.now().toString().slice(-6)}${index.toString().padStart(3, '0')}${name.replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).toUpperCase()}`;
exports.itemCatalogService = {
    syncCatalogToDatabase: async () => {
        let created = 0;
        let existing = 0;
        for (const category of grocery_catalog_1.groceryCatalog) {
            const categoryRow = await prisma_1.prisma.category.upsert({
                where: { name: category.name },
                update: {},
                create: { name: category.name },
            });
            for (const [index, itemName] of category.items.entries()) {
                const alreadyExists = await prisma_1.prisma.item.findFirst({
                    where: { name: itemName },
                    select: { id: true },
                });
                if (alreadyExists) {
                    existing += 1;
                    continue;
                }
                const sku = seedSku(itemName, index);
                await prisma_1.prisma.item.create({
                    data: {
                        name: itemName,
                        sku,
                        quantity: 0,
                        reservedQty: 0,
                        price: 0,
                        supplier: 'Catalog Seed',
                        location: 'General',
                        description: 'Seeded from grocery catalog',
                        categoryId: categoryRow.id,
                        qrValue: (0, qr_1.generateQrValue)(),
                        barcodeValue: (0, qr_1.generateBarcodeValue)(sku),
                        categories: {
                            create: [{ categoryId: categoryRow.id }],
                        },
                    },
                });
                created += 1;
            }
        }
        return { created, existing, totalCatalogItems: grocery_catalog_1.groceryCatalog.reduce((acc, cat) => acc + cat.items.length, 0) };
    },
    listCatalogItemNames: async () => {
        const names = await prisma_1.prisma.item.findMany({
            select: { name: true },
            distinct: ['name'],
            orderBy: { name: 'asc' },
        });
        return names.map((row) => row.name);
    },
};
