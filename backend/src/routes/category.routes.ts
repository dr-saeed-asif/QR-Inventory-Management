import { Router } from 'express'
import { categoryController } from '../controllers/category.controller'
import { authenticate, authorizePermission } from '../middleware/auth.middleware'
import { validate } from '../middleware/validate.middleware'
import { categorySchema } from '../utils/validation-schemas'

const router = Router()

router.use(authenticate)
router.post('/', authorizePermission('categories.manage'), validate(categorySchema), categoryController.create)
router.get('/', authorizePermission('categories.read'), categoryController.list)
router.put('/:id', authorizePermission('categories.manage'), validate(categorySchema), categoryController.update)
router.delete('/:id', authorizePermission('categories.manage'), categoryController.delete)

export default router
