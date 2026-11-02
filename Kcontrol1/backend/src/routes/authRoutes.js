
import express from 'express';

import authController from '../controllers/authController.js';

import authMiddleware from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/login', authController.login);

router.get('/me', authMiddleware, (req, res) => {
    return res.status(200).json({
        usuario: req.user
    });
});

export default router;
