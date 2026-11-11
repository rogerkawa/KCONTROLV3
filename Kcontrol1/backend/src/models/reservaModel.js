
import conect from '../config/database.js';
import reservaHistoricoModel from './reservaHistoricoModel.js';

const reservaModel = {

    // =========================================
    // CRIAR SOLICITACAO DE RESERVA
    // =========================================

    async criar(dados) {
        const conexao = await conect.getConnection();

        try {
            await conexao.beginTransaction();

            // Bloqueia a sala durante a operação.
            const [salas] = await conexao.execute(
                `SELECT id_sala, status
                FROM sala
                WHERE id_sala = ?
                AND id_empresa = ?
                LIMIT 1
                FOR UPDATE`,
                [
                    dados.id_sala,
                    dados.id_empresa
                ]
            );

            if (!salas.length) {
                throw new Error('SALA_NAO_ENCONTRADA');
            }

            if (salas[0].status !== 'disponivel') {
                throw new Error('SALA_INDISPONIVEL');
            }

            // Cria a reserva como pendente.
            const [resultado] = await conexao.execute(
                `INSERT INTO reservas (
                    id_empresa,
                    id_sala,
                    id_solicitante,
                    titulo,
                    descricao,
                    data_inicio,
                    data_fim_prevista,
                    status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, 'pendente')`,
                [
                    dados.id_empresa,
                    dados.id_sala,
                    dados.id_solicitante,
                    dados.titulo,
                    dados.descricao || null,
                    dados.data_inicio,
                    dados.data_fim_prevista
                ]
            );

            const id_reserva = resultado.insertId;

            // Salva os turnos selecionados.
            for (const turno of dados.turnos) {
                await conexao.execute(
                    `INSERT INTO reserva_turnos (
                        id_reserva,
                        turno
                    ) VALUES (?, ?)`,
                    [
                        id_reserva,
                        turno
                    ]
                );
            }

            // Registra no histórico.
            await reservaHistoricoModel.registrar(
                conexao,
                id_reserva,
                dados.id_solicitante,
                'reserva.solicitada',
                `Solicitou uma reserva para a sala ${dados.id_sala}.`
            );

            await conexao.commit();

            return id_reserva;

        } catch (error) {
            await conexao.rollback();
            throw error;

        } finally {
            conexao.release();
        }
    },


    // =========================================
    // LISTAR RESERVAS DA EMPRESA
    // =========================================

    async listar(id_empresa) {
        const [reservas] = await conect.execute(
            `SELECT
                r.*,
                sa.nome AS nome_sala,
                u.nome AS nome_solicitante,
                ap.nome AS nome_aprovador,

                (
                    SELECT GROUP_CONCAT(
                        rt.turno
                        ORDER BY FIELD(rt.turno, 'M', 'T', 'N')
                    )
                    FROM reserva_turnos rt
                    WHERE rt.id_reserva = r.id_reserva
                ) AS turnos

            FROM reservas r

            INNER JOIN sala sa
                ON sa.id_sala = r.id_sala

            INNER JOIN usuarios u
                ON u.id_usuario = r.id_solicitante

            LEFT JOIN usuarios ap
                ON ap.id_usuario = r.id_aprovador

            WHERE r.id_empresa = ?

            ORDER BY r.created_at DESC`,
            [id_empresa]
        );

        return reservas;
    },


    // =========================================
    // LISTAR RESERVAS DO USUARIO
    // =========================================

    async listarMinhas(id_empresa, id_usuario) {
        const [reservas] = await conect.execute(
            `SELECT
                r.*,
                sa.nome AS nome_sala,

                (
                    SELECT GROUP_CONCAT(
                        rt.turno
                        ORDER BY FIELD(rt.turno, 'M', 'T', 'N')
                    )
                    FROM reserva_turnos rt
                    WHERE rt.id_reserva = r.id_reserva
                ) AS turnos

            FROM reservas r

            INNER JOIN sala sa
                ON sa.id_sala = r.id_sala

            WHERE r.id_empresa = ?
            AND r.id_solicitante = ?

            ORDER BY r.created_at DESC`,
            [
                id_empresa,
                id_usuario
            ]
        );

        return reservas;
    },


    // =========================================
    // BUSCAR RESERVA POR ID
    // =========================================

    async buscarPorId(id_reserva, id_empresa) {
        const [reservas] = await conect.execute(
            `SELECT
                r.*,
                sa.nome AS nome_sala,
                u.nome AS nome_solicitante,
                ap.nome AS nome_aprovador,

                (
                    SELECT GROUP_CONCAT(
                        rt.turno
                        ORDER BY FIELD(rt.turno, 'M', 'T', 'N')
                    )
                    FROM reserva_turnos rt
                    WHERE rt.id_reserva = r.id_reserva
                ) AS turnos

            FROM reservas r

            INNER JOIN sala sa
                ON sa.id_sala = r.id_sala

            INNER JOIN usuarios u
                ON u.id_usuario = r.id_solicitante

            LEFT JOIN usuarios ap
                ON ap.id_usuario = r.id_aprovador

            WHERE r.id_reserva = ?
            AND r.id_empresa = ?

            LIMIT 1`,
            [
                id_reserva,
                id_empresa
            ]
        );

        return reservas[0];
    }

};

export default reservaModel;
