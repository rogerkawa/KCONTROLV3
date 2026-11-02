
import express from 'express';

import empresaController from '../controllers/empresaController.js';
import authMiddleware from '../middlewares/authMiddleware.js';
import roleMiddleware from '../middlewares/roleMiddleware.js';

const router = express.Router();

// Todas as rotas exigem autenticação de SuperAdmin
router.use(authMiddleware);
router.use(roleMiddleware('superadmin'));

// Listar empresas
router.get('/', empresaController.listar);

// Buscar empresa específica
router.get('/:id', empresaController.buscarPorId);

// Alterar status
router.patch('/:id/status', empresaController.atualizarStatus);

export default router;
