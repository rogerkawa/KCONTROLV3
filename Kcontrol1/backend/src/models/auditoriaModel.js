
import conect from '../config/database.js';

const auditoriaModel = {

    async registrar(id_empresa, id_usuario, acao, descricao) {
        try {
            await conect.execute(
                `INSERT INTO auditoria (
                    id_empresa,
                    id_usuario,
                    acao,
                    descricao
                ) VALUES (?, ?, ?, ?)`,
                [
                    id_empresa,
                    id_usuario,
                    acao,
                    descricao
                ]
            );

            return true;

        } catch (error) {
            // Uma falha na auditoria não deve desfazer
            // uma operação de negócio que já foi concluída.
            console.error('Erro ao registrar auditoria:', error);

            return false;
        }
    },

    async listar(id_empresa, limite, offset) {
        const [registros] = await conect.execute(
            `SELECT
                a.id_auditoria,
                a.id_usuario,
                u.nome AS nome_usuario,
                a.acao,
                a.descricao,
                a.created_at
            FROM auditoria a
            LEFT JOIN usuarios u
                ON a.id_usuario = u.id_usuario
            WHERE a.id_empresa = ?
            ORDER BY a.created_at DESC, a.id_auditoria DESC
            LIMIT ? OFFSET ?`,
            [id_empresa, limite, offset]
        );

        return registros;
    },

    async contar(id_empresa) {
        const [resultado] = await conect.execute(
            `SELECT COUNT(*) AS total
            FROM auditoria
            WHERE id_empresa = ?`,
            [id_empresa]
        );

        return Number(resultado[0].total);
    }
};

export default auditoriaModel;
