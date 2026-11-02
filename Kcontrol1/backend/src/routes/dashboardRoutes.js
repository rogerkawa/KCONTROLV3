import express from 'express';

import dashboardController from '../controllers/dashboardController.js';

import authMiddleware from '../middlewares/authMiddleware.js';
import roleMiddleware from '../middlewares/roleMiddleware.js';
import empresaMiddleware from '../middlewares/empresaMidleware.js';

const router = express.Router();

router.use(authMiddleware);
router.use(empresaMiddleware);
router.use(roleMiddleware('admin'));

router.get('/', dashboardController.buscar);

export default router;