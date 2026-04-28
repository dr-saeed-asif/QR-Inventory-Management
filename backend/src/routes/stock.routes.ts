import { Router } from 'express'
import { stockController } from '../controllers/stock.controller'
import { authenticate } from '../middleware/auth.middleware'
import { validate } from '../middleware/validate.middleware'
import {
  stockAdjustmentSchema,
  stockInSchema,
  stockOutSchema,
  stockTransferSchema,
} from '../utils/validation-schemas'

const router = Router()

router.use(authenticate)
router.post('/in', validate(stockInSchema), stockController.stockIn)
router.post('/out', validate(stockOutSchema), stockController.stockOut)
router.post('/transfer', validate(stockTransferSchema), stockController.transfer)
router.post('/adjustment', validate(stockAdjustmentSchema), stockController.adjust)
router.get('/history', stockController.history)

export default router
