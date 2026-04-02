import { Router } from 'express';
import { orderController } from '../controllers/order.controller';
import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';
import { validate } from '../middlewares/validate';
import {
  createOrderSchema,
  updateOrderStatusSchema,
  addOrderItemsSchema,
  processPaymentSchema,
} from '../models/order.schema';

const router = Router();

router.use(authenticate);

router.get('/', authorize(['admin', 'chef', 'manager', 'waiter', 'cashier']), orderController.getAllOrders);
router.post('/', validate(createOrderSchema), orderController.createOrder);
router.get('/:id', orderController.getOrderById);
router.patch('/:id/status', authorize(['chef', 'waiter', 'manager']), validate(updateOrderStatusSchema), orderController.updateOrderStatus);
router.post('/:id/items', validate(addOrderItemsSchema), orderController.addOrderItems);
router.post('/:id/pay', authorize(['cashier', 'manager']), validate(processPaymentSchema), orderController.processPayment);

export default router;
