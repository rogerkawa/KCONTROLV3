import express from 'express';
import 'dotenv/config';
import cors from 'cors';

import conect from './config/database.js';
import routes from './routes/index.js';

const app = express();

// Middlewares
const origensPermitidas = process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL.split(',').map(url => url.trim())
    : ['http://localhost:5173'];

app.use(cors({
    origin: origensPermitidas
}));

app.use(express.json());

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

app.listen(porta, () => {
    console.log(`Servidor rodando na porta ${porta}`);
});