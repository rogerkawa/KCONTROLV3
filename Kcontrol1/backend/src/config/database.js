import mysql from 'mysql2/promise';
import 'dotenv/config';

const variaveisObrigatorias = [
    'DB_HOST',
    'DB_USER',
    'DB_PASSWORD',
    'DB_NAME'
];

for (const variavel of variaveisObrigatorias) {
    if (!process.env[variavel]) {
        throw new Error(
            `Variável de ambiente obrigatória não configurada: ${variavel}`
        );
    }
}

const conect = mysql.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,

    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

export default conect;