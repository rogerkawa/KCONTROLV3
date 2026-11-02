import conect from '../config/database.js';

const conviteModel = {

    // Buscar convite válido
    async buscarValido(tokenHash) {
        const [resultado] = await conect.execute(
            `SELECT
                c.id_convite,
                c.id_usuario,
                c.expires_at,
                u.nome,
                u.email,
                u.status AS status_usuario,
                u.role,
                e.nome AS nome_empresa,
                e.status AS status_empresa
             FROM convites_admin c
             INNER JOIN usuarios u
                ON c.id_usuario = u.id_usuario
             INNER JOIN empresas e
                ON u.id_empresa = e.id_empresa
             WHERE c.token_hash = ?
                AND c.usado_em IS NULL
                AND c.expires_at > NOW()
             LIMIT 1`,
            [tokenHash]
        );

        return resultado[0];
    },

    // Ativar administrador
    async ativar(tokenHash, senhaHash) {
        const conexao = await conect.getConnection();

        try {
            await conexao.beginTransaction();

            // Bloquear convite durante a operação
            const [convites] = await conexao.execute(
                `SELECT
                    c.id_convite,
                    c.id_usuario,
                    u.status AS status_usuario,
                    u.role,
                    e.status AS status_empresa
                 FROM convites_admin c
                 INNER JOIN usuarios u
                    ON c.id_usuario = u.id_usuario
                 INNER JOIN empresas e
                    ON u.id_empresa = e.id_empresa
                 WHERE c.token_hash = ?
                    AND c.usado_em IS NULL
                    AND c.expires_at > NOW()
                 LIMIT 1
                 FOR UPDATE`,
                [tokenHash]
            );

            if (convites.length === 0) {
                throw new Error('CONVITE_INVALIDO');
            }

            const convite = convites[0];

            if (convite.status_usuario !== 'inativo') {
                throw new Error('CONTA_JA_ATIVADA');
            }

            if (convite.role !== 'admin') {
                throw new Error('USUARIO_INVALIDO');
            }

            if (convite.status_empresa !== 'ativa') {
                throw new Error('EMPRESA_INDISPONIVEL');
            }

            // Atualizar senha e ativar administrador
            await conexao.execute(
                `UPDATE usuarios
                 SET senha = ?, status = 'ativo'
                 WHERE id_usuario = ?`,
                [senhaHash, convite.id_usuario]
            );

            // Marcar convite como utilizado
            await conexao.execute(
                `UPDATE convites_admin
                 SET usado_em = NOW()
                 WHERE id_convite = ?`,
                [convite.id_convite]
            );

            await conexao.commit();

            return {
                id_usuario: convite.id_usuario
            };

        } catch (error) {
            await conexao.rollback();
            throw error;

        } finally {
            conexao.release();
        }
    }

};

export default conviteModel;