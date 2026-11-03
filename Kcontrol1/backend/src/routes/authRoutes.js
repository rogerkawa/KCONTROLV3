
import express from 'express';

import authController from '../controllers/authController.js';
import authMiddleware from '../middlewares/authMiddleware.js';
import { loginLimiter } from '../middlewares/rateLimitMiddleware.js';
import mfaController from '../controllers/mfaController.js';
import mfaPendingMiddleware from '../middlewares/mfaPendingMiddleware.js';

const router = express.Router();

router.post('/login', loginLimiter, authController.login);

router.post('/logout', authController.logout);
router.post('/mfa/setup', mfaPendingMiddleware, mfaController.setup);
router.post('/mfa/ativar', mfaPendingMiddleware, mfaController.ativar);
router.post('/mfa/verificar', mfaPendingMiddleware, authController.verificarMFA);
router.get('/me', authMiddleware, (req, res) => {
    return res.status(200).json({
        usuario: req.user
    });
});

export default router;
