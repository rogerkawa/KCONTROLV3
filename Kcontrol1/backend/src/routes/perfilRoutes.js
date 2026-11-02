import express from 'express';

import perfilController from '../controllers/perfilController.js';
import uploadAvatar from '../middlewares/uploadMiddleware.js';
import authMiddleware from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/', perfilController.buscar);
router.put('/', perfilController.atualizar);
router.patch('/senha', perfilController.atualizarSenha);
router.put('/avatar', uploadAvatar, perfilController.atualizarAvatar);
router.delete('/avatar', perfilController.removerAvatar);

export default router;