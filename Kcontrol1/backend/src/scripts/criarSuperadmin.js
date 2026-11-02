
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

import conect from '../config/database.js';

dotenv.config();

async function criarSuperadmin() {
    try {
        const nome = process.env.SUPERADMIN_NOME;
        const email = process.env.SUPERADMIN_EMAIL;
        const senha = process.env.SUPERADMIN_SENHA;

        if (!nome || !email || !senha || senha.length < 12) {
            throw new Error(
                'Informe nome, e-mail e senha de pelo menos 12 caracteres.'
            );
        }

        const [existente] = await conect.execute(
            `SELECT id_usuario FROM usuarios WHERE email = ?`,
            [email]
        );

        if (existente.length > 0) {
            throw new Error('Este e-mail já está cadastrado.');
        }

        const hash = await bcrypt.hash(senha, 12);

        await conect.execute(
            `INSERT INTO usuarios
                (nome, email, senha, role, id_empresa)
             VALUES (?, ?, ?, 'superadmin', NULL)`,
            [nome, email, hash]
        );

        console.log('Superadmin criado com sucesso!');

    } catch (error) {
        console.error('Erro:', error.message);
        process.exitCode = 1;

    } finally {
        await conect.end();
    }
}

criarSuperadmin();
