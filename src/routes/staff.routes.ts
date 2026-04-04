import { Router } from 'express';
import { staffController } from '../controllers/staff.controller.js';
import { authenticate } from '../middlewares/authenticate.js';
import { authorize } from '../middlewares/authorize.js';
import { validate } from '../middlewares/validate.js';
import { createStaffSchema, updateStaffSchema } from '../models/staff.schema.js';

const router = Router();

router.use(authenticate);

router.get('/', authorize(['admin', 'manager']), staffController.getAllStaff);
router.post('/', authorize(['admin']), validate(createStaffSchema), staffController.createStaff);
router.get('/:id', authorize(['admin', 'manager']), staffController.getStaffById);
router.patch('/:id', authorize(['admin']), validate(updateStaffSchema), staffController.updateStaff);
router.delete('/:id', authorize(['admin']), staffController.deleteStaff);

export default router;
