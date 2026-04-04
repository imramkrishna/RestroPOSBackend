import { Router } from 'express';
import { menuController } from '../controllers/menu.controller.js';
import { authenticate } from '../middlewares/authenticate.js';
import { authorize } from '../middlewares/authorize.js';
import { validate } from '../middlewares/validate.js';
import { createCategorySchema, createMenuItemSchema, updateMenuItemSchema } from '../models/menu.schema.js';

const router = Router();

router.get('/', menuController.getFullMenu);

router.use(authenticate);

router.post('/categories', authorize(['admin']), validate(createCategorySchema), menuController.createCategory);
router.post('/items', authorize(['admin']), validate(createMenuItemSchema), menuController.createMenuItem);
router.patch('/items/:id', authorize(['admin']), validate(updateMenuItemSchema), menuController.updateMenuItem);
router.delete('/items/:id', authorize(['admin']), menuController.deleteMenuItem);

export default router;
