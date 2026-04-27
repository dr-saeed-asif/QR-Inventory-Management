import { Router } from 'express'
import { authenticate } from '../middleware/auth.middleware'
import { validate } from '../middleware/validate.middleware'
import { scanController } from '../controllers/scan.controller'
import { scanSchema } from '../utils/validation-schemas'

const router = Router()

router.post('/', authenticate, validate(scanSchema), scanController.create)

export default router
