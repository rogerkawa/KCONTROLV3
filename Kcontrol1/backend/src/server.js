
import express from 'express';
import 'dotenv/config';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { apiLimiter } from './middlewares/rateLimitMiddleware.js';
import conect from './config/database.js';
import routes from './routes/index.js';

const app = express();
app.set('trust proxy', 1);

const origensPermitidas = process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL.split(',').map(url => url.trim())
    : ['http://localhost:5173'];

app.use(cors({
    origin: origensPermitidas,
    credentials: true
}));

app.use(express.json());
app.use(cookieParser());
app.use((req, res, next) => {
    if (req.path.startsWith('/api')) {
        console.log('--- REQUISIÇÃO RECEBIDA ---');
        console.log('Método:', req.method);
        console.log('Rota:', req.originalUrl);
        console.log('Origem:', req.headers.origin);
        console.log('Dispositivo:', req.headers['user-agent']);
        console.log('Enviou cookie:', Boolean(req.headers.cookie));
    }

    next();
});
app.use('/api', apiLimiter);

// Proteção CSRF por validação da origem
app.use((req, res, next) => {
    const metodosQueAlteramDados = [
        'POST',
        'PUT',
        'PATCH',
        'DELETE'
    ];

    if (!metodosQueAlteramDados.includes(req.method)) {
        return next();
    }

    const origem = req.headers.origin;

    if (!origem || !origensPermitidas.includes(origem)) {
        return res.status(403).json({
            message: 'Origem da requisição não autorizada.'
        });
    }

    next();
});

// Rota inicial
app.get('/', (req, res) => {
    res.status(200).json({
        message: 'API KControl V3 funcionando!'
    });
});

// Verificar conexão com o banco
app.get('/api/health', async (req, res) => {
    try {
        await conect.query('SELECT 1');

        return res.status(200).json({
            status: 'online',
            database: 'connected'
        });

    } catch (error) {
        console.error('Erro na conexão com o banco:', error);

        return res.status(500).json({
            status: 'error',
            database: 'disconnected'
        });
    }
});

// Rotas
routes(app);

// Inicialização
const porta = process.env.PORT || 3333;
const end = process.env.END;

app.listen(porta, () => {
    console.log(`Servidor rodando na porta ${end}:${porta}`);
});
