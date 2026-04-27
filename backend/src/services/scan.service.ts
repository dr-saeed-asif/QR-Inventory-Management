import { prisma } from '../config/prisma'
import { ApiError } from '../utils/api-error'
import { activityService } from './activity.service'

export const scanService = {
  create: async (qrCode: string, note?: string, userId?: string) => {
    const item = await prisma.item.findUnique({ where: { qrValue: qrCode } })
    if (!item) throw new ApiError(404, 'Item not found for provided QR code')

    const scan = await prisma.scanHistory.create({
      data: {
        qrCode,
        note,
        itemId: item.id,
        userId,
      },
    })

    await activityService.create({
      action: 'SCAN',
      entityType: 'ITEM',
      entityId: item.id,
      description: 'QR scan logged',
      userId,
      itemId: item.id,
    })

    return scan
  },
}
