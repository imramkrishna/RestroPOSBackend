import { Router } from 'express';
import { tableController } from '../controllers/table.controller.js';
import { authenticate } from '../middlewares/authenticate.js';

const router = Router();

router.use(authenticate);

router.get('/', tableController.getAllTables);
router.get('/:id', tableController.getTableById);
router.post('/', tableController.createTable);
router.patch('/:id/status', tableController.updateTableStatus);

export default router;
