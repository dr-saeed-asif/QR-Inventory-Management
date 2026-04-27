import { Router } from 'express'
import { itemController } from '../controllers/item.controller'
import { authenticate } from '../middleware/auth.middleware'
import { validate } from '../middleware/validate.middleware'
import { itemSchema } from '../utils/validation-schemas'

const router = Router()

router.use(authenticate)
router.post('/', validate(itemSchema), itemController.create)
router.get('/', itemController.list)
router.get('/:id', itemController.getById)
router.put('/:id', itemController.update)
router.delete('/:id', itemController.delete)

export default router
