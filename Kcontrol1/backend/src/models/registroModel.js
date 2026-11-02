
import conect from '../config/database.js';

const registroModel = {

    async listar(id_empresa) {
        const [registros] = await conect.execute(
            `SELECT
                r.id_registro,
                r.id_usuario,
                u.nome AS nome_usuario,
                r.id_setor,
                s.nome AS nome_setor,
                r.id_sala,
                sa.nome AS nome_sala,
                r.responsavel,
                r.turno,
                r.data_retirada,
                r.hora_retirada,
                r.hora_entrega,
                r.status,
                r.created_at
            FROM registros r
            INNER JOIN usuarios u ON r.id_usuario = u.id_usuario
            INNER JOIN setores s ON r.id_setor = s.id_setor
            INNER JOIN sala sa ON r.id_sala = sa.id_sala
            WHERE r.id_empresa = ?
            ORDER BY r.created_at DESC`,
            [id_empresa]
        );

        return registros;
    },

    async listarMeus(id_empresa, id_usuario) {
        const [registros] = await conect.execute(
            `SELECT
                r.id_registro,
                r.id_usuario,
                u.nome AS nome_usuario,
                r.id_setor,
                s.nome AS nome_setor,
                r.id_sala,
                sa.nome AS nome_sala,
                r.responsavel,
                r.turno,
                r.data_retirada,
                r.hora_retirada,
                r.hora_entrega,
                r.status,
                r.created_at
            FROM registros r
            INNER JOIN usuarios u ON r.id_usuario = u.id_usuario
            INNER JOIN setores s ON r.id_setor = s.id_setor
            INNER JOIN sala sa ON r.id_sala = sa.id_sala
            WHERE r.id_empresa = ?
            AND r.id_usuario = ?
            ORDER BY r.created_at DESC`,
            [id_empresa, id_usuario]
        );

        return registros;
    },

    async buscarPorId(id_registro, id_empresa) {
        const [registros] = await conect.execute(
            `SELECT
                r.id_registro,
                r.id_usuario,
                u.nome AS nome_usuario,
                r.id_setor,
                s.nome AS nome_setor,
                r.id_sala,
                sa.nome AS nome_sala,
                r.responsavel,
                r.turno,
                r.data_retirada,
                r.hora_retirada,
                r.hora_entrega,
                r.status,
                r.created_at
            FROM registros r
            INNER JOIN usuarios u ON r.id_usuario = u.id_usuario
            INNER JOIN setores s ON r.id_setor = s.id_setor
            INNER JOIN sala sa ON r.id_sala = sa.id_sala
            WHERE r.id_registro = ?
            AND r.id_empresa = ?
            LIMIT 1`,
            [id_registro, id_empresa]
        );

        return registros[0];
    },

    async criar(dados) {
        const conexao = await conect.getConnection();

        try {
            await conexao.beginTransaction();

            // Verifica se o setor pertence à empresa.
            const [setores] = await conexao.execute(
                `SELECT id_setor
                FROM setores
                WHERE id_setor = ?
                AND id_empresa = ?
                LIMIT 1`,
                [dados.id_setor, dados.id_empresa]
            );

            if (!setores.length) {
                throw new Error('SETOR_NAO_ENCONTRADO');
            }

            // Bloqueia a sala durante a operação.
            const [salas] = await conexao.execute(
                `SELECT id_sala, status
                FROM sala
                WHERE id_sala = ?
                AND id_empresa = ?
                LIMIT 1
                FOR UPDATE`,
                [dados.id_sala, dados.id_empresa]
            );

            if (!salas.length) {
                throw new Error('SALA_NAO_ENCONTRADA');
            }

            if (salas[0].status !== 'disponivel') {
                throw new Error('SALA_INDISPONIVEL');
            }

            // Verifica se já existe uma retirada ativa
            // para a mesma sala e turno.
            const [registrosAtivos] = await conexao.execute(
                `SELECT id_registro
                FROM registros
                WHERE id_sala = ?
                AND id_empresa = ?
                AND turno = ?
                AND status = 'retirada'
                LIMIT 1`,
                [
                    dados.id_sala,
                    dados.id_empresa,
                    dados.turno
                ]
            );

            if (registrosAtivos.length) {
                throw new Error('RETIRADA_JA_EXISTE');
            }

            const [resultado] = await conexao.execute(
                `INSERT INTO registros (
                    id_empresa,
                    id_usuario,
                    id_setor,
                    id_sala,
                    responsavel,
                    turno,
                    data_retirada,
                    hora_retirada,
                    status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'retirada')`,
                [
                    dados.id_empresa,
                    dados.id_usuario,
                    dados.id_setor,
                    dados.id_sala,
                    dados.responsavel,
                    dados.turno,
                    dados.data_retirada,
                    dados.hora_retirada
                ]
            );

            await conexao.execute(
                `UPDATE sala
                SET status = 'retirada'
                WHERE id_sala = ?
                AND id_empresa = ?`,
                [dados.id_sala, dados.id_empresa]
            );

            await conexao.commit();

            return resultado.insertId;

        } catch (error) {
            await conexao.rollback();
            throw error;

        } finally {
            conexao.release();
        }
    },

    
async devolver(id_registro, id_empresa) {
    const conexao = await conect.getConnection();

    try {
        await conexao.beginTransaction();

        // Primeiro descobrimos a sala vinculada ao registro.
        const [consulta] = await conexao.execute(
            `SELECT id_sala
            FROM registros
            WHERE id_registro = ?
            AND id_empresa = ?
            LIMIT 1`,
            [id_registro, id_empresa]
        );

        if (!consulta.length) {
            throw new Error('REGISTRO_NAO_ENCONTRADO');
        }

        const id_sala = consulta[0].id_sala;

        // Bloqueamos primeiro a sala, seguindo a mesma ordem
        // utilizada na criação de uma retirada.
        const [salas] = await conexao.execute(
            `SELECT id_sala
            FROM sala
            WHERE id_sala = ?
            AND id_empresa = ?
            LIMIT 1
            FOR UPDATE`,
            [id_sala, id_empresa]
        );

        if (!salas.length) {
            throw new Error('SALA_NAO_ENCONTRADA');
        }

        // Agora bloqueamos o registro.
        const [registros] = await conexao.execute(
            `SELECT id_registro, id_sala, status
            FROM registros
            WHERE id_registro = ?
            AND id_empresa = ?
            LIMIT 1
            FOR UPDATE`,
            [id_registro, id_empresa]
        );

        if (!registros.length) {
            throw new Error('REGISTRO_NAO_ENCONTRADO');
        }

        const registro = registros[0];

        if (registro.status === 'devolvida') {
            throw new Error('REGISTRO_JA_DEVOLVIDO');
        }

        await conexao.execute(
            `UPDATE registros
            SET status = 'devolvida',
                hora_entrega = CURRENT_TIME()
            WHERE id_registro = ?
            AND id_empresa = ?`,
            [id_registro, id_empresa]
        );

        const [ativos] = await conexao.execute(
            `SELECT COUNT(*) AS total
            FROM registros
            WHERE id_sala = ?
            AND id_empresa = ?
            AND status = 'retirada'`,
            [id_sala, id_empresa]
        );

        if (Number(ativos[0].total) === 0) {
            await conexao.execute(
                `UPDATE sala
                SET status = 'disponivel'
                WHERE id_sala = ?
                AND id_empresa = ?
                AND status = 'retirada'`,
                [id_sala, id_empresa]
            );
        }

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

export default registroModel;
