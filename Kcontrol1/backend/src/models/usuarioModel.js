
import conect from '../config/database.js';

const usuarioModel = {

    async listar(id_empresa) {
        const [usuarios] = await conect.execute(
            `SELECT 
                id_usuario,
                nome,
                email,
                role,
                avatar_url,
                status,
                created_at
            FROM usuarios
            WHERE id_empresa = ?
            ORDER BY nome ASC`,
            [id_empresa]
        );

        return usuarios;
    },

    async buscarPorId(id_usuario, id_empresa) {
        const [usuarios] = await conect.execute(
            `SELECT 
                id_usuario,
                nome,
                email,
                role,
                avatar_url,
                status,
                created_at
            FROM usuarios
            WHERE id_usuario = ? AND id_empresa = ?
            LIMIT 1`,
            [id_usuario, id_empresa]
        );

        return usuarios[0];
    },

    async buscarPorEmail(email) {
        const [usuarios] = await conect.execute(
            `SELECT id_usuario
            FROM usuarios
            WHERE email = ?
            LIMIT 1`,
            [email]
        );

        return usuarios[0];
    },

    async criar(dados) {
        const [resultado] = await conect.execute(
            `INSERT INTO usuarios (
                id_empresa,
                nome,
                email,
                senha,
                role,
                status
            ) VALUES (?, ?, ?, ?, ?, 'ativo')`,
            [
                dados.id_empresa,
                dados.nome,
                dados.email,
                dados.senha,
                dados.role
            ]
        );

        return resultado.insertId;
    },

    async atualizar(id_usuario, id_empresa, dados) {
        const [resultado] = await conect.execute(
            `UPDATE usuarios
            SET nome = ?, email = ?, role = ?
            WHERE id_usuario = ? AND id_empresa = ?`,
            [
                dados.nome,
                dados.email,
                dados.role,
                id_usuario,
                id_empresa
            ]
        );

        return resultado.affectedRows;
    },

    async atualizarStatus(id_usuario, id_empresa, status) {
        const [resultado] = await conect.execute(
            `UPDATE usuarios
            SET status = ?
            WHERE id_usuario = ? AND id_empresa = ?`,
            [status, id_usuario, id_empresa]
        );

        return resultado.affectedRows;
    }
};

export default usuarioModel;
