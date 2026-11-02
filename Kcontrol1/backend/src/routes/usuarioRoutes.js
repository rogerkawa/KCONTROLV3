
import express from 'express';
import usuarioController from '../controllers/usuarioController.js';
import authMiddleware from '../middlewares/authMiddleware.js';
import roleMiddleware from '../middlewares/roleMiddleware.js';
import empresaMiddleware from '../middlewares/empresaMidleware.js';

const router = express.Router();

router.use(authMiddleware);
router.use(empresaMiddleware);
router.use(roleMiddleware('admin'));

router.get('/', usuarioController.listar);
router.get('/:id', usuarioController.buscarPorId);
router.post('/', usuarioController.criar);
router.put('/:id', usuarioController.atualizar);
router.patch('/:id/status', usuarioController.atualizarStatus);

export default router;
