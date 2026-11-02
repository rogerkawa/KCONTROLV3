
import conect from '../config/database.js';

const empresaModel = {

    // Listar todas as empresas
    async listar(status) {
        let sql = `
            SELECT
                e.id_empresa,
                e.nome,
                e.cnpj,
                e.email,
                e.telefone,
                e.status,
                e.created_at,

                (
                    SELECT COUNT(*)
                    FROM usuarios u
                    WHERE u.id_empresa = e.id_empresa
                ) AS total_usuarios,

                (
                    SELECT COUNT(*)
                    FROM sala s
                    WHERE s.id_empresa = e.id_empresa
                ) AS total_salas,

                (
                    SELECT COUNT(*)
                    FROM setores st
                    WHERE st.id_empresa = e.id_empresa
                ) AS total_setores

            FROM empresas e
        `;

        const valores = [];

        if (status) {
            sql += ` WHERE e.status = ?`;
            valores.push(status);
        }

        sql += ` ORDER BY e.created_at DESC`;

        const [resultado] = await conect.execute(sql, valores);

        return resultado;
    },

    // Buscar empresa por ID
    async buscarPorId(id) {
        const [resultado] = await conect.execute(
            `SELECT
                e.id_empresa,
                e.nome,
                e.cnpj,
                e.email,
                e.telefone,
                e.status,
                e.created_at,

                (
                    SELECT COUNT(*)
                    FROM usuarios u
                    WHERE u.id_empresa = e.id_empresa
                ) AS total_usuarios,

                (
                    SELECT COUNT(*)
                    FROM sala s
                    WHERE s.id_empresa = e.id_empresa
                ) AS total_salas,

                (
                    SELECT COUNT(*)
                    FROM setores st
                    WHERE st.id_empresa = e.id_empresa
                ) AS total_setores,

                (
                    SELECT COUNT(*)
                    FROM registros r
                    WHERE r.id_empresa = e.id_empresa
                ) AS total_registros

             FROM empresas e
             WHERE e.id_empresa = ?
             LIMIT 1`,
            [id]
        );

        return resultado[0];
    },

    // Alterar status da empresa
    async atualizarStatus(id, status, id_superadmin) {
        const conexao = await conect.getConnection();

        try {
            await conexao.beginTransaction();

            // Verificar se a empresa existe e bloquear durante a alteração
            const [empresas] = await conexao.execute(
                `SELECT id_empresa, nome, status
                 FROM empresas
                 WHERE id_empresa = ?
                 FOR UPDATE`,
                [id]
            );

            if (empresas.length === 0) {
                throw new Error('EMPRESA_NAO_ENCONTRADA');
            }

            const empresa = empresas[0];

            if (empresa.status === status) {
                throw new Error('STATUS_JA_ATUALIZADO');
            }

            // Atualizar status
            await conexao.execute(
                `UPDATE empresas
                 SET status = ?
                 WHERE id_empresa = ?`,
                [status, id]
            );

            // Registrar ação na auditoria global
            await conexao.execute(
                `INSERT INTO auditoria
                    (id_empresa, id_usuario, acao, descricao)
                 VALUES (?, ?, ?, ?)`,
                [
                    id,
                    id_superadmin,
                    'empresa.status_alterado',
                    `Status da empresa "${empresa.nome}" alterado de "${empresa.status}" para "${status}".`
                ]
            );

            await conexao.commit();

            return {
                id_empresa: Number(id),
                status
            };

        } catch (error) {
            await conexao.rollback();
            throw error;

        } finally {
            conexao.release();
        }
    }

};

export default empresaModel;
