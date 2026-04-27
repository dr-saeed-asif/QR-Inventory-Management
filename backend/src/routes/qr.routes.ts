import { Router } from 'express'
import { authenticate } from '../middleware/auth.middleware'
import { qrController } from '../controllers/qr.controller'

const router = Router()

router.get('/:code', authenticate, qrController.getItemByCode)

export default router
