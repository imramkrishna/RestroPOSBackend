import { Router } from 'express';
import authRoutes from './auth.routes';
import staffRoutes from './staff.routes';
import menuRoutes from './menu.routes';
import orderRoutes from './order.routes';
import tableRoutes from './table.routes';
import reservationRoutes from './reservation.routes';
import inventoryRoutes from './inventory.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/staff', staffRoutes);
router.use('/menu', menuRoutes);
router.use('/orders', orderRoutes);
router.use('/tables', tableRoutes);
router.use('/reservations', reservationRoutes);
router.use('/inventory', inventoryRoutes);

export default router;
