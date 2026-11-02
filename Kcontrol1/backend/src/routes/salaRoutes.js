
import express from 'express';

import salaController from '../controllers/salaController.js';
import authMiddleware from '../middlewares/authMiddleware.js';
import roleMiddleware from '../middlewares/roleMiddleware.js';
import empresaMiddleware from '../middlewares/empresaMidleware.js';

const router = express.Router();

router.use(authMiddleware);
router.use(empresaMiddleware);

// Consultas: admin e user
router.get('/', salaController.listar);
router.get('/:id', salaController.buscarPorId);

// Gerenciamento: somente admin
router.post('/', roleMiddleware('admin'), salaController.criar);
router.put('/:id', roleMiddleware('admin'), salaController.atualizar);
router.patch('/:id/status', roleMiddleware('admin'), salaController.atualizarStatus);
router.delete('/:id', roleMiddleware('admin'), salaController.excluir);

export default router;
