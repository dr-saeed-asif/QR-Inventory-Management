import { prisma } from '../config/prisma'
import { ApiError } from '../utils/api-error'
import { activityService } from './activity.service'
import { auditService } from './audit.service'

export const categoryService = {
  create: async (name: string, userId?: string) => {
    const category = await prisma.category.create({ data: { name } })
    await activityService.create({
      action: 'CREATE',
      entityType: 'CATEGORY',
      entityId: category.id,
      description: `Category "${name}" created`,
      userId,
    })
    return category
  },

  list: async () => {
    const categories = await prisma.category.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { items: true } } },
    })
    return categories.map((category) => ({
      id: category.id,
      name: category.name,
      itemsCount: category._count.items,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    }))
  },

  update: async (id: string, name: string, userId?: string) => {
    const existing = await prisma.category.findUnique({ where: { id } })
    if (!existing) throw new ApiError(404, 'Category not found')

    const category = await prisma.category.update({ where: { id }, data: { name } })
    await auditService.create({
      entityType: 'CATEGORY',
      entityId: id,
      oldData: existing,
      newData: category,
      userId,
    })
    return category
  },

  delete: async (id: string, userId?: string) => {
    const category = await prisma.category.findUnique({ where: { id } })
    if (!category) throw new ApiError(404, 'Category not found')
    await prisma.category.delete({ where: { id } })
    await activityService.create({
      action: 'DELETE',
      entityType: 'CATEGORY',
      entityId: id,
      description: `Category "${category.name}" deleted`,
      userId,
    })
  },
}
