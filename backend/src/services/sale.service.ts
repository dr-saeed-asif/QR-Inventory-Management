import { Prisma, TransactionStatus } from '@prisma/client'
import { prisma } from '../config/prisma'
import { ApiError } from '../utils/api-error'
import { parsePagination } from '../utils/pagination'
import { calcLineTotal, calcTotals, nextInvoiceNo, type CommerceLineInput } from '../utils/commerce'
import { activityService } from './activity.service'
import { alertService } from './alert.service'

export interface SaleInput {
  partyId?: string
  saleDate?: string
  discount?: number
  notes?: string
  lines: CommerceLineInput[]
}

const saleInclude = {
  party: true,
  lines: { include: { item: { select: { id: true, name: true, sku: true } } } },
} as const

const mapSale = (sale: Prisma.SaleGetPayload<{ include: typeof saleInclude }>) => ({
  id: sale.id,
  invoiceNo: sale.invoiceNo,
  partyId: sale.partyId,
  party: sale.party
    ? { id: sale.party.id, name: sale.party.name, phone: sale.party.phone, type: sale.party.type }
    : null,
  status: sale.status,
  saleDate: sale.saleDate.toISOString(),
  subtotal: Number(sale.subtotal),
  discount: Number(sale.discount),
  total: Number(sale.total),
  notes: sale.notes,
  lines: sale.lines.map((line) => ({
    id: line.id,
    itemId: line.itemId,
    itemName: line.item.name,
    itemSku: line.item.sku,
    quantity: line.quantity,
    unitPrice: Number(line.unitPrice),
    lineTotal: Number(line.lineTotal),
  })),
  createdAt: sale.createdAt.toISOString(),
})

export const saleService = {
  list: async (query?: { page?: string; limit?: string }) => {
    const { page, limit, skip } = parsePagination(query)

    const [sales, total] = await Promise.all([
      prisma.sale.findMany({
        orderBy: { createdAt: 'desc' },
        include: saleInclude,
        skip,
        take: limit,
      }),
      prisma.sale.count(),
    ])

    return { data: sales.map(mapSale), total, page, limit }
  },

  getById: async (id: string) => {
    const sale = await prisma.sale.findUnique({ where: { id }, include: saleInclude })
    if (!sale) throw new ApiError(404, 'Sale not found')
    return mapSale(sale)
  },

  create: async (input: SaleInput, userId?: string) => {
    if (!input.lines.length) throw new ApiError(400, 'At least one line item is required')

    if (input.partyId) {
      const party = await prisma.party.findUnique({ where: { id: input.partyId } })
      if (!party) throw new ApiError(400, 'Party not found')
    }

    const itemIds = [...new Set(input.lines.map((l) => l.itemId))]
    const items = await prisma.item.findMany({ where: { id: { in: itemIds } } })
    if (items.length !== itemIds.length) throw new ApiError(400, 'One or more items are invalid')

    const itemMap = new Map(items.map((i) => [i.id, i]))
    for (const line of input.lines) {
      const item = itemMap.get(line.itemId)!
      if (line.quantity > item.quantity) {
        throw new ApiError(400, `Insufficient stock for "${item.name}" (available: ${item.quantity})`)
      }
    }

    const { subtotal, discount, total } = calcTotals(input.lines, input.discount ?? 0)
    const invoiceNo = await nextInvoiceNo('SALE', () => prisma.sale.count())
    const saleDate = input.saleDate ? new Date(input.saleDate) : new Date()

    const sale = await prisma.$transaction(async (tx) => {
      const created = await tx.sale.create({
        data: {
          invoiceNo,
          partyId: input.partyId || null,
          status: TransactionStatus.CONFIRMED,
          saleDate,
          subtotal,
          discount,
          total,
          notes: input.notes?.trim() || null,
          createdById: userId || null,
          lines: {
            create: input.lines.map((line) => ({
              itemId: line.itemId,
              quantity: line.quantity,
              unitPrice: line.unitPrice,
              lineTotal: calcLineTotal(line.quantity, line.unitPrice),
            })),
          },
        },
        include: saleInclude,
      })

      for (const line of input.lines) {
        const item = itemMap.get(line.itemId)!
        const beforeQty = item.quantity
        const afterQty = beforeQty - line.quantity
        await tx.item.update({ where: { id: line.itemId }, data: { quantity: afterQty } })
        await tx.stockMovement.create({
          data: {
            itemId: line.itemId,
            type: 'OUT',
            quantity: line.quantity,
            beforeQty,
            afterQty,
            note: `Sale ${invoiceNo}`,
            reference: invoiceNo,
            userId,
          },
        })
        item.quantity = afterQty
      }

      return created
    })

    for (const line of input.lines) {
      await alertService.syncItemAlerts(line.itemId)
    }

    await activityService.create({
      action: 'CREATE',
      entityType: 'SALE',
      entityId: sale.id,
      description: `Sale ${invoiceNo} created (Rs ${Number(total)})`,
      userId,
    })

    return mapSale(sale)
  },

  delete: async (id: string, userId?: string) => {
    const sale = await prisma.sale.findUnique({
      where: { id },
      include: { lines: true },
    })
    if (!sale) throw new ApiError(404, 'Sale not found')
    if (sale.status === TransactionStatus.CANCELLED) {
      throw new ApiError(400, 'Sale is already cancelled')
    }

    await prisma.$transaction(async (tx) => {
      for (const line of sale.lines) {
        const item = await tx.item.findUnique({ where: { id: line.itemId } })
        if (!item) continue
        const beforeQty = item.quantity
        const afterQty = beforeQty + line.quantity
        await tx.item.update({ where: { id: line.itemId }, data: { quantity: afterQty } })
        await tx.stockMovement.create({
          data: {
            itemId: line.itemId,
            type: 'IN',
            quantity: line.quantity,
            beforeQty,
            afterQty,
            note: `Reversal: Sale ${sale.invoiceNo} deleted`,
            reference: sale.invoiceNo,
            userId,
          },
        })
      }
      await tx.sale.delete({ where: { id } })
    })

    for (const line of sale.lines) {
      await alertService.syncItemAlerts(line.itemId)
    }

    await activityService.create({
      action: 'DELETE',
      entityType: 'SALE',
      entityId: id,
      description: `Sale ${sale.invoiceNo} deleted`,
      userId,
    })
  },
}
