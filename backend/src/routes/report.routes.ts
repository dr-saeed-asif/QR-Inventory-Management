import { Router } from 'express'
import { reportController } from '../controllers/report.controller'
import { authenticate, authorize } from '../middleware/auth.middleware'

const router = Router()

router.use(authenticate)
router.get('/export-csv', authorize(['ADMIN']), reportController.exportCsv)
router.get('/export-excel', authorize(['ADMIN']), reportController.exportExcel)
router.get('/low-stock', reportController.lowStock)
router.get('/recent', reportController.recent)

export default router
