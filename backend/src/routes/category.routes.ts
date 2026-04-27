import { Router } from 'express'
import { categoryController } from '../controllers/category.controller'
import { authenticate, authorize } from '../middleware/auth.middleware'
import { validate } from '../middleware/validate.middleware'
import { categorySchema } from '../utils/validation-schemas'

const router = Router()

router.use(authenticate)
router.post('/', authorize(['ADMIN']), validate(categorySchema), categoryController.create)
router.get('/', categoryController.list)
router.put('/:id', authorize(['ADMIN']), validate(categorySchema), categoryController.update)
router.delete('/:id', authorize(['ADMIN']), categoryController.delete)

export default router
