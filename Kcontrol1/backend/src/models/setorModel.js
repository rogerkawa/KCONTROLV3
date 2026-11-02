
import conect from '../config/database.js';

const setorModel = {

    async listar(id_empresa) {
        const [setores] = await conect.execute(
            `SELECT
                id_setor,
                nome,
                created_at
            FROM setores
            WHERE id_empresa = ?
            ORDER BY nome ASC`,
            [id_empresa]
        );

        return setores;
    },

    async buscarPorId(id_setor, id_empresa) {
        const [setores] = await conect.execute(
            `SELECT
                id_setor,
                nome,
                created_at
            FROM setores
            WHERE id_setor = ? AND id_empresa = ?
            LIMIT 1`,
            [id_setor, id_empresa]
        );

        return setores[0];
    },

    async criar(id_empresa, nome) {
        const [resultado] = await conect.execute(
            `INSERT INTO setores (id_empresa, nome)
            VALUES (?, ?)`,
            [id_empresa, nome]
        );

        return resultado.insertId;
    },

    async atualizar(id_setor, id_empresa, nome) {
        const [resultado] = await conect.execute(
            `UPDATE setores
            SET nome = ?
            WHERE id_setor = ? AND id_empresa = ?`,
            [nome, id_setor, id_empresa]
        );

        return resultado.affectedRows;
    },

    async verificarVinculos(id_setor, id_empresa) {
        const [resultado] = await conect.execute(
            `SELECT COUNT(*) AS total
            FROM registros
            WHERE id_setor = ? AND id_empresa = ?`,
            [id_setor, id_empresa]
        );

        return Number(resultado[0].total);
    },

    async excluir(id_setor, id_empresa) {
        const [resultado] = await conect.execute(
            `DELETE FROM setores
            WHERE id_setor = ? AND id_empresa = ?`,
            [id_setor, id_empresa]
        );

        return resultado.affectedRows;
    }
};

export default setorModel;
