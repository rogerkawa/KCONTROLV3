
import { rateLimit } from 'express-rate-limit';

// Limite geral para as rotas da API
export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    limit: 300,
    standardHeaders: true,
    legacyHeaders: false,

    message: {
        message: 'Muitas requisições. Aguarde alguns minutos e tente novamente.'
    }
});

// Limite específico para tentativas de login
export const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    limit: 10,
    standardHeaders: true,
    legacyHeaders: false,

    message: {
        message: 'Muitas tentativas de login. Aguarde 15 minutos antes de tentar novamente.'
    }
});
