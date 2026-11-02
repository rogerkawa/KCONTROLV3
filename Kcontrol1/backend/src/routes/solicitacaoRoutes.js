import express from 'express';

import solicitacaoController from '../controllers/solicitacaoController.js';
import authMiddleware from '../middlewares/authMiddleware.js';
import roleMiddleware from '../middlewares/roleMiddleware.js';

const router = express.Router();

// Rota pública
router.post('/', solicitacaoController.criar);

// Rotas exclusivas do SuperAdmin
router.get(
    '/',
    authMiddleware,
    roleMiddleware('superadmin'),
    solicitacaoController.listar
);

router.get(
    '/:id',
    authMiddleware,
    roleMiddleware('superadmin'),
    solicitacaoController.buscarPorId
);

router.patch(
    '/:id/aprovar',
    authMiddleware,
    roleMiddleware('superadmin'),
    solicitacaoController.aprovar
);

router.patch(
    '/:id/rejeitar',
    authMiddleware,
    roleMiddleware('superadmin'),
    solicitacaoController.rejeitar
);

export default router;