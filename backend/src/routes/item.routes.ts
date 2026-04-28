import { Router } from 'express'
import multer from 'multer'
import { itemController } from '../controllers/item.controller'
import { authenticate } from '../middleware/auth.middleware'
import { validate } from '../middleware/validate.middleware'
import { itemSchema, itemUpdateSchema } from '../utils/validation-schemas'

const router = Router()
const upload = multer({ storage: multer.memoryStorage() })

router.use(authenticate)
router.post('/', validate(itemSchema), itemController.create)
router.post('/import', upload.single('file'), itemController.import)
router.get('/', itemController.list)
router.get('/:id', itemController.getById)
router.put('/:id', validate(itemUpdateSchema), itemController.update)
router.delete('/:id', itemController.delete)

export default router
