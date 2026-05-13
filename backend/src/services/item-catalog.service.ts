import { prisma } from '../config/prisma'
import { groceryCatalog } from '../data/grocery-catalog'
import { generateBarcodeValue, generateQrValue } from '../utils/qr'

const seedSku = (name: string, index: number) =>
  `CAT${Date.now().toString().slice(-6)}${index.toString().padStart(3, '0')}${name.replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).toUpperCase()}`

export const itemCatalogService = {
  syncCatalogToDatabase: async () => {
    let created = 0
    let existing = 0

    for (const category of groceryCatalog) {
      const categoryRow = await prisma.category.upsert({
        where: { name: category.name },
        update: {},
        create: { name: category.name },
      })

      for (const [index, itemName] of category.items.entries()) {
        const alreadyExists = await prisma.item.findFirst({
          where: { name: itemName },
          select: { id: true },
        })

        if (alreadyExists) {
          existing += 1
          continue
        }

        const sku = seedSku(itemName, index)
        await prisma.item.create({
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
            qrValue: generateQrValue(),
            barcodeValue: generateBarcodeValue(sku),
            categories: {
              create: [{ categoryId: categoryRow.id }],
            },
          },
        })
        created += 1
      }
    }

    return { created, existing, totalCatalogItems: groceryCatalog.reduce((acc, cat) => acc + cat.items.length, 0) }
  },

  listCatalogItemNames: async () => {
    const names = await prisma.item.findMany({
      select: { name: true },
      distinct: ['name'],
      orderBy: { name: 'asc' },
    })
    return names.map((row) => row.name)
  },
}

