
import conect from '../config/database.js';

const salaModel = {

    async listar(id_empresa) {
        const [salas] = await conect.execute(
            `SELECT
                id_sala,
                nome,
                status,
                created_at
            FROM sala
            WHERE id_empresa = ?
            ORDER BY nome ASC`,
            [id_empresa]
        );

        return salas;
    },

    async buscarPorId(id_sala, id_empresa) {
        const [salas] = await conect.execute(
            `SELECT
                id_sala,
                nome,
                status,
                created_at
            FROM sala
            WHERE id_sala = ? AND id_empresa = ?
            LIMIT 1`,
            [id_sala, id_empresa]
        );

        return salas[0];
    },

    async criar(id_empresa, nome) {
        const [resultado] = await conect.execute(
            `INSERT INTO sala (id_empresa, nome)
            VALUES (?, ?)`,
            [id_empresa, nome]
        );

        return resultado.insertId;
    },

    async atualizar(id_sala, id_empresa, nome) {
        const [resultado] = await conect.execute(
            `UPDATE sala
            SET nome = ?
            WHERE id_sala = ? AND id_empresa = ?`,
            [nome, id_sala, id_empresa]
        );

        return resultado.affectedRows;
    },

    async atualizarStatus(id_sala, id_empresa, status) {
        const [resultado] = await conect.execute(
            `UPDATE sala
            SET status = ?
            WHERE id_sala = ? AND id_empresa = ?`,
            [status, id_sala, id_empresa]
        );

        return resultado.affectedRows;
    },

    async verificarVinculos(id_sala, id_empresa) {
        const [resultado] = await conect.execute(
            `SELECT COUNT(*) AS total
            FROM registros
            WHERE id_sala = ? AND id_empresa = ?`,
            [id_sala, id_empresa]
        );

        return Number(resultado[0].total);
    },

    async verificarRetiradaAtiva(id_sala, id_empresa) {
        const [resultado] = await conect.execute(
            `SELECT COUNT(*) AS total
            FROM registros
            WHERE id_sala = ?
            AND id_empresa = ?
            AND status = 'retirada'`,
            [id_sala, id_empresa]
        );

        return Number(resultado[0].total);
    },

    async excluir(id_sala, id_empresa) {
        const [resultado] = await conect.execute(
            `DELETE FROM sala
            WHERE id_sala = ? AND id_empresa = ?`,
            [id_sala, id_empresa]
        );

        return resultado.affectedRows;
    }
};

export default salaModel;
