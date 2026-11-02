import conect from '../config/database.js';

const solicitacaoModel = {

    // Verificar duplicidade de CNPJ
    async verificarDuplicidade(cnpj) {
        const [empresa] = await conect.execute(
            `SELECT id_empresa
             FROM empresas
             WHERE cnpj = ?
             LIMIT 1`,
            [cnpj]
        );

        if (empresa.length > 0) return 'empresa';

        const [solicitacao] = await conect.execute(
            `SELECT id_solicitacao
             FROM solicitacoes_empresa
             WHERE cnpj = ?
             AND status = 'pendente'
             LIMIT 1`,
            [cnpj]
        );

        if (solicitacao.length > 0) return 'solicitacao';

        return null;
    },

    // Criar solicitação pública
    async criar(dados) {
        const {
            nome_empresa,
            cnpj,
            email_empresa,
            telefone,
            nome_responsavel,
            email_responsavel
        } = dados;

        const [resultado] = await conect.execute(
            `INSERT INTO solicitacoes_empresa
                (
                    nome_empresa,
                    cnpj,
                    email_empresa,
                    telefone,
                    nome_responsavel,
                    email_responsavel
                )
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
                nome_empresa,
                cnpj,
                email_empresa,
                telefone || null,
                nome_responsavel,
                email_responsavel
            ]
        );

        return resultado.insertId;
    },

    // Listar solicitações
    async listar(status) {
        let sql = `
            SELECT
                id_solicitacao,
                nome_empresa,
                cnpj,
                email_empresa,
                telefone,
                nome_responsavel,
                email_responsavel,
                status,
                data_solicitacao,
                data_analise,
                motivo_rejeicao,
                id_empresa,
                analisado_por
            FROM solicitacoes_empresa
        `;

        const valores = [];

        if (status) {
            sql += ` WHERE status = ?`;
            valores.push(status);
        }

        sql += ` ORDER BY data_solicitacao DESC`;

        const [resultado] = await conect.execute(sql, valores);

        return resultado;
    },

    // Buscar solicitação específica
    async buscarPorId(id) {
        const [resultado] = await conect.execute(
            `SELECT *
             FROM solicitacoes_empresa
             WHERE id_solicitacao = ?
             LIMIT 1`,
            [id]
        );

        return resultado[0];
    },

    // Aprovar solicitação e criar empresa + administrador
    async aprovar(id, id_superadmin, senhaHash, tokenHash) {
        const conexao = await conect.getConnection();

        try {
            await conexao.beginTransaction();

            // Bloquear solicitação durante a aprovação
            const [solicitacoes] = await conexao.execute(
                `SELECT *
                 FROM solicitacoes_empresa
                 WHERE id_solicitacao = ?
                 FOR UPDATE`,
                [id]
            );

            if (solicitacoes.length === 0) {
                throw new Error('SOLICITACAO_NAO_ENCONTRADA');
            }

            const solicitacao = solicitacoes[0];

            if (solicitacao.status !== 'pendente') {
                throw new Error('SOLICITACAO_JA_ANALISADA');
            }

            // Verificar se o CNPJ já foi cadastrado
            const [empresas] = await conexao.execute(
                `SELECT id_empresa
                 FROM empresas
                 WHERE cnpj = ?
                 LIMIT 1`,
                [solicitacao.cnpj]
            );

            if (empresas.length > 0) {
                throw new Error('EMPRESA_JA_CADASTRADA');
            }

            // Verificar se o e-mail do responsável já está em uso
            const [usuarios] = await conexao.execute(
                `SELECT id_usuario
                 FROM usuarios
                 WHERE email = ?
                 LIMIT 1`,
                [solicitacao.email_responsavel]
            );

            if (usuarios.length > 0) {
                throw new Error('EMAIL_JA_CADASTRADO');
            }

            // Criar empresa
            const [empresa] = await conexao.execute(
                `INSERT INTO empresas
                    (nome, cnpj, email, telefone)
                 VALUES (?, ?, ?, ?)`,
                [
                    solicitacao.nome_empresa,
                    solicitacao.cnpj,
                    solicitacao.email_empresa,
                    solicitacao.telefone
                ]
            );

            const id_empresa = empresa.insertId;

            // Criar primeiro administrador
            const [usuario] = await conexao.execute(
                `INSERT INTO usuarios
                    (id_empresa, nome, email, senha, role, status)
                 VALUES (?, ?, ?, ?, 'admin', 'inativo')`,
                [
                    id_empresa,
                    solicitacao.nome_responsavel,
                    solicitacao.email_responsavel,
                    senhaHash
                ]
            );

            const id_usuario = usuario.insertId;

            // Criar convite com validade de 24 horas
            await conexao.execute(
                `INSERT INTO convites_admin
                    (id_usuario, token_hash, expires_at)
                 VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 24 HOUR))`,
                [id_usuario, tokenHash]
            );

            // Atualizar solicitação
            await conexao.execute(
                `UPDATE solicitacoes_empresa
                 SET
                    status = 'aprovada',
                    id_empresa = ?,
                    analisado_por = ?,
                    data_analise = NOW()
                 WHERE id_solicitacao = ?`,
                [id_empresa, id_superadmin, id]
            );

            await conexao.commit();

            return {
                id_empresa,
                id_usuario
            };

        } catch (error) {
            await conexao.rollback();
            throw error;

        } finally {
            conexao.release();
        }
    },

    // Rejeitar solicitação
    async rejeitar(id, id_superadmin, motivo) {
        const conexao = await conect.getConnection();

        try {
            await conexao.beginTransaction();

            const [solicitacoes] = await conexao.execute(
                `SELECT status
                 FROM solicitacoes_empresa
                 WHERE id_solicitacao = ?
                 FOR UPDATE`,
                [id]
            );

            if (solicitacoes.length === 0) {
                throw new Error('SOLICITACAO_NAO_ENCONTRADA');
            }

            if (solicitacoes[0].status !== 'pendente') {
                throw new Error('SOLICITACAO_JA_ANALISADA');
            }

            await conexao.execute(
                `UPDATE solicitacoes_empresa
                 SET
                    status = 'rejeitada',
                    motivo_rejeicao = ?,
                    analisado_por = ?,
                    data_analise = NOW()
                 WHERE id_solicitacao = ?`,
                [motivo, id_superadmin, id]
            );

            await conexao.commit();

            return true;

        } catch (error) {
            await conexao.rollback();
            throw error;

        } finally {
            conexao.release();
        }
    },
    // Ativar administrador através do convite
async ativarAdministrador(tokenHash, senhaHash) {
    const conexao = await conect.getConnection();

    try {
        await conexao.beginTransaction();

        // Buscar e bloquear o convite durante a validação
        const [convites] = await conexao.execute(
            `SELECT
                id_usuario,
                token_hash,
                expires_at,
                used_at
             FROM convites_admin
             WHERE token_hash = ?
             LIMIT 1
             FOR UPDATE`,
            [tokenHash]
        );

        if (convites.length === 0) {
            throw new Error('CONVITE_INVALIDO');
        }

        const convite = convites[0];

        if (convite.used_at) {
            throw new Error('CONVITE_UTILIZADO');
        }

        const [expirado] = await conexao.execute(
            `SELECT expires_at <= NOW() AS expirado
             FROM convites_admin
             WHERE token_hash = ?`,
            [tokenHash]
        );

        if (expirado[0].expirado) {
            throw new Error('CONVITE_EXPIRADO');
        }

        // Ativar administrador e salvar senha
        const [usuario] = await conexao.execute(
            `UPDATE usuarios
             SET senha = ?, status = 'ativo'
             WHERE id_usuario = ?
             AND status = 'inativo'`,
            [senhaHash, convite.id_usuario]
        );

        if (usuario.affectedRows === 0) {
            throw new Error('USUARIO_JA_ATIVADO');
        }

        // Marcar convite como utilizado
        await conexao.execute(
            `UPDATE convites_admin
             SET used_at = NOW()
             WHERE token_hash = ?
             AND used_at IS NULL`,
            [tokenHash]
        );

        await conexao.commit();

        return true;

    } catch (error) {
        await conexao.rollback();
        throw error;

    } finally {
        conexao.release();
    }
}

};

export default solicitacaoModel;