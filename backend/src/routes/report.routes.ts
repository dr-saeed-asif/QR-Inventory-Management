import { Router } from 'express'
import { reportController } from '../controllers/report.controller'
import { authenticate, authorizePermission } from '../middleware/auth.middleware'

const router = Router()

router.use(authenticate)
router.get('/export-csv', authorizePermission('reports.export'), reportController.exportCsv)
router.get('/export-excel', authorizePermission('reports.export'), reportController.exportExcel)
router.get('/low-stock', authorizePermission('reports.read'), reportController.lowStock)
router.get('/recent', authorizePermission('reports.read'), reportController.recent)

export default router
