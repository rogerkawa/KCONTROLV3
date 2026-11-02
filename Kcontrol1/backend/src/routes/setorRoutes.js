
import express from 'express';

import setorController from '../controllers/setorController.js';
import authMiddleware from '../middlewares/authMiddleware.js';
import roleMiddleware from '../middlewares/roleMiddleware.js';
import empresaMiddleware from '../middlewares/empresaMidleware.js';

const router = express.Router();

router.use(authMiddleware);
router.use(empresaMiddleware);

// Consulta: admin e user
router.get('/', setorController.listar);
router.get('/:id', setorController.buscarPorId);

// Gerenciamento: somente admin
router.post('/', roleMiddleware('admin'), setorController.criar);
router.put('/:id', roleMiddleware('admin'), setorController.atualizar);
router.delete('/:id', roleMiddleware('admin'), setorController.excluir);

export default router;
