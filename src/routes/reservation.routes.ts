import { Router } from 'express';
import { reservationController } from '../controllers/reservation.controller';
import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';
import { validate } from '../middlewares/validate';
import { createReservationSchema, updateReservationSchema } from '../models/reservation.schema';

const router = Router();

router.use(authenticate);

router.get('/', reservationController.getAllReservations);
router.post('/', validate(createReservationSchema), reservationController.createReservation);
router.get('/:id', reservationController.getReservationById);
router.patch('/:id', authorize(['admin','manager', 'waiter']), validate(updateReservationSchema), reservationController.updateReservationStatus);

export default router;
