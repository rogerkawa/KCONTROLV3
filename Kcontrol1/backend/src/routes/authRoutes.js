
import express from 'express';

import authController from '../controllers/authController.js';
import authMiddleware from '../middlewares/authMiddleware.js';
import { loginLimiter } from '../middlewares/rateLimitMiddleware.js';

const router = express.Router();

router.post('/login', loginLimiter, authController.login);

router.post('/logout', authController.logout);

router.get('/me', authMiddleware, (req, res) => {
    return res.status(200).json({
        usuario: req.user
    });
});

export default router;
