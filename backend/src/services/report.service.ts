import { stringify } from 'csv-stringify/sync'
import XLSX from 'xlsx'
import { prisma } from '../config/prisma'

export const reportService = {
  exportCsv: async () => {
    const items = await prisma.item.findMany({
      include: {
        category: true,
        categories: { include: { category: true } },
        tags: { include: { tag: true } },
      },
    })
    return stringify(
      items.map((item) => ({
        name: item.name,
        sku: item.sku,
        category: item.category.name,
        categories: item.categories.map((link) => link.category.name).join('|'),
        tags: item.tags.map((link) => link.tag.name).join('|'),
        quantity: item.quantity,
        reservedQty: item.reservedQty,
        availableQty: Math.max(0, item.quantity - item.reservedQty),
        location: item.location,
        supplier: item.supplier,
      })),
      { header: true },
    )
  },
  exportExcel: async () => {
    const items = await prisma.item.findMany({
      include: {
        category: true,
        categories: { include: { category: true } },
        tags: { include: { tag: true } },
      },
    })
    const rows = items.map((item) => ({
      Name: item.name,
      SKU: item.sku,
      PrimaryCategory: item.category.name,
      Categories: item.categories.map((link) => link.category.name).join(', '),
      Tags: item.tags.map((link) => link.tag.name).join(', '),
      Quantity: item.quantity,
      ReservedQty: item.reservedQty,
      AvailableQty: Math.max(0, item.quantity - item.reservedQty),
      Location: item.location,
      Supplier: item.supplier,
      Price: Number(item.price),
    }))

    const workbook = XLSX.utils.book_new()
    const worksheet = XLSX.utils.json_to_sheet(rows)
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventory')
    return XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' })
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
