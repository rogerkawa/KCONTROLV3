
import express from 'express';

import registroController from '../controllers/registroController.js';
import authMiddleware from '../middlewares/authMiddleware.js';
import empresaMiddleware from '../middlewares/empresaMidleware.js';
import roleMiddleware from '../middlewares/roleMiddleware.js';

const router = express.Router();

router.use(authMiddleware);
router.use(empresaMiddleware);

// Admin: todos os registros da empresa
router.get(
    '/',
    roleMiddleware('admin'),
    registroController.listar
);

// Admin e user: próprios registros
router.get('/meus', registroController.listarMeus);

// Admin e user: criar retirada
router.post('/', registroController.criar);

// Admin e user: consultar registro (com validação de propriedade)
router.get('/:id', registroController.buscarPorId);

// Admin e user: devolver (com validação de propriedade)
router.patch('/:id/devolver', registroController.devolver);

export default router;
