import { stringify } from 'csv-stringify/sync'
import { prisma } from '../config/prisma'

export const reportService = {
  exportCsv: async () => {
    const items = await prisma.item.findMany({ include: { category: true } })
    return stringify(
      items.map((item) => ({
        name: item.name,
        sku: item.sku,
        category: item.category.name,
        quantity: item.quantity,
        location: item.location,
        supplier: item.supplier,
      })),
      { header: true },
    )
  },

  lowStock: async () =>
    prisma.$queryRaw`
      SELECT i.*, c.name as categoryName
      FROM Item i
      JOIN Category c ON i.categoryId = c.id
      WHERE i.quantity <= i.lowStockAt
      ORDER BY i.quantity ASC
    `,

  recent: async () =>
    prisma.item.findMany({
      include: { category: true },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
}
