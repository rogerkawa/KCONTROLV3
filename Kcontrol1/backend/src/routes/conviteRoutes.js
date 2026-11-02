import express from 'express';
import conviteController from '../controllers/conviteController.js';

const router = express.Router();

router.post('/validar', conviteController.validar);

router.post('/ativar', conviteController.ativar);

export default router;