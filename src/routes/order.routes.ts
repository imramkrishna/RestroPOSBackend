import { Router } from 'express';
import { orderController } from '../controllers/order.controller.js';
import { authenticate } from '../middlewares/authenticate.js';
import { authorize } from '../middlewares/authorize.js';
import { validate } from '../middlewares/validate.js';
import {
  createOrderSchema,
  cancelOrderSchema,
  cancelOrderItemSchema,
  createSettlementBatchSchema,
  updateOrderStatusSchema,
  addOrderItemsSchema,
  getOrdersQuerySchema,
  onlineSettlementSummarySchema,
  processPaymentSchema,
} from '../models/order.schema.js';

const router = Router();

router.use(authenticate);

router.get(
  '/',
  authorize(['admin', 'chef', 'manager', 'waiter', 'cashier']),
  validate(getOrdersQuerySchema),
  orderController.getAllOrders
);
router.get(
  '/online/summary',
  authorize(['admin', 'manager', 'cashier']),
  validate(onlineSettlementSummarySchema),
  orderController.getOnlineSettlementSummary
);
router.post(
  '/online/settlements',
  authorize(['admin', 'manager', 'cashier']),
  validate(createSettlementBatchSchema),
  orderController.createSettlementBatch
);
router.post('/', validate(createOrderSchema), orderController.createOrder);
router.get('/:id', orderController.getOrderById);
router.patch('/:id/cancel', authorize(['admin','chef', 'waiter', 'manager']), validate(cancelOrderSchema), orderController.cancelOrder);
router.patch('/:id/items/:itemId/cancel', authorize(['admin','chef', 'waiter', 'manager']), validate(cancelOrderItemSchema), orderController.cancelOrderItem);
router.patch('/:id/status', authorize(['admin','chef', 'waiter', 'manager']), validate(updateOrderStatusSchema), orderController.updateOrderStatus);
router.post('/:id/items', validate(addOrderItemsSchema), orderController.addOrderItems);
router.post('/:id/pay', authorize(['admin','cashier', 'manager']), validate(processPaymentSchema), orderController.processPayment);

export default router;
