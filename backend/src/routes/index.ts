import { Router } from 'express'
import authRoutes from './auth.routes'
import itemRoutes from './item.routes'
import categoryRoutes from './category.routes'
import qrRoutes from './qr.routes'
import scanRoutes from './scan.routes'
import reportRoutes from './report.routes'
import stockRoutes from './stock.routes'
import adminRoutes from './admin.routes'

const router = Router()

router.use('/auth', authRoutes)
router.use('/items', itemRoutes)
router.use('/categories', categoryRoutes)
router.use('/qr', qrRoutes)
router.use('/scan', scanRoutes)
router.use('/reports', reportRoutes)
router.use('/stock', stockRoutes)
router.use('/admin', adminRoutes)

export default router
