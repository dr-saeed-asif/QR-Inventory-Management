import { Router } from 'express'
import { adminController } from '../controllers/admin.controller'
import { authenticate, authorize } from '../middleware/auth.middleware'
import { validate } from '../middleware/validate.middleware'
import {
	adminRoleCreateSchema,
	adminRoleUpdateSchema,
	adminUserCreateSchema,
	adminUserUpdateSchema,
} from '../utils/validation-schemas'

const router = Router()

router.use(authenticate, authorize(['ADMIN']))
router.get('/users', adminController.users)
router.post('/users', validate(adminUserCreateSchema), adminController.createUser)
router.put('/users/:id', validate(adminUserUpdateSchema), adminController.updateUser)
router.delete('/users/:id', adminController.deleteUser)
router.get('/roles', adminController.roles)
router.post('/roles', validate(adminRoleCreateSchema), adminController.createRole)
router.put('/roles/:id', validate(adminRoleUpdateSchema), adminController.updateRole)
router.delete('/roles/:id', adminController.deleteRole)

export default router