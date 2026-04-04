import { Router } from 'express';
import { reservationController } from '../controllers/reservation.controller.js';
import { authenticate } from '../middlewares/authenticate.js';
import { authorize } from '../middlewares/authorize.js';
import { validate } from '../middlewares/validate.js';
import { createReservationSchema, updateReservationSchema } from '../models/reservation.schema.js';

const router = Router();

router.use(authenticate);

router.get('/', reservationController.getAllReservations);
router.post('/', validate(createReservationSchema), reservationController.createReservation);
router.get('/:id', reservationController.getReservationById);
router.patch('/:id', authorize(['admin','manager', 'waiter']), validate(updateReservationSchema), reservationController.updateReservationStatus);

export default router;
