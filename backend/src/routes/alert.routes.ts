import { Router } from 'express'
import { alertController } from '../controllers/alert.controller'
import { authenticate, authorizePermission } from '../middleware/auth.middleware'

const router = Router()

router.use(authenticate)
router.get('/summary', authorizePermission('alerts.read'), alertController.summary)
router.get('/', authorizePermission('alerts.read'), alertController.list)
router.post('/refresh', authorizePermission('alerts.read'), alertController.refresh)
router.post('/mark-all-read', authorizePermission('alerts.read'), alertController.markAllRead)
router.post('/:id/read', authorizePermission('alerts.read'), alertController.markRead)

export default router