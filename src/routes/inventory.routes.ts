import { Router } from 'express';
import { inventoryController } from '../controllers/inventory.controller.js';
import { authenticate } from '../middlewares/authenticate.js';
import { authorize } from '../middlewares/authorize.js';
import { validate } from '../middlewares/validate.js';
import { updateInventorySchema, createInventorySchema } from '../models/inventory.schema.js';

const router = Router();

router.use(authenticate);

router.get('/', inventoryController.getAllInventory);
router.post('/', authorize(['manager', 'admin']), validate(createInventorySchema), inventoryController.createInventoryItem);
router.get('/alerts', inventoryController.getLowStockAlerts);
router.get('/:id', inventoryController.getInventoryById);
router.patch('/:id', authorize(['manager', 'chef']), validate(updateInventorySchema), inventoryController.updateInventoryQuantity);
router.delete('/:id', authorize(['manager', 'admin']), inventoryController.deleteInventoryItem);

export default router;
