import { Router } from 'express';
import { inventoryController } from '../controllers/inventory.controller';
import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';
import { validate } from '../middlewares/validate';
import { updateInventorySchema, createInventorySchema } from '../models/inventory.schema';

const router = Router();

router.use(authenticate);

router.get('/', inventoryController.getAllInventory);
router.post('/', authorize(['manager', 'admin']), validate(createInventorySchema), inventoryController.createInventoryItem);
router.get('/alerts', inventoryController.getLowStockAlerts);
router.get('/:id', inventoryController.getInventoryById);
router.patch('/:id', authorize(['manager', 'chef']), validate(updateInventorySchema), inventoryController.updateInventoryQuantity);
router.delete('/:id', authorize(['manager', 'admin']), inventoryController.deleteInventoryItem);

export default router;
