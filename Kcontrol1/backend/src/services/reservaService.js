
import conect from '../config/database.js';
import reservaHistoricoModel from '../models/reservaHistoricoModel.js';

const reservaService = {

    // =========================================
    // VERIFICAR CONFLITOS DE RESERVA
    // =========================================

    async verificarConflito(
        conexao,
        id_reserva,
        id_sala,
        data_inicio,
        data_fim,
        turnos
    ) {
        const placeholders = turnos.map(() => '?').join(', ');

        const [conflitos] = await conexao.execute(
            `SELECT DISTINCT r.id_reserva, r.titulo
            FROM reservas r

            INNER JOIN reserva_turnos rt
                ON rt.id_reserva = r.id_reserva

            WHERE r.id_sala = ?
            AND r.status = 'aprovada'
            AND r.id_reserva <> ?

            AND r.data_inicio <= ?
            AND r.data_fim_prevista >= ?

            AND rt.turno IN (${placeholders})

            LIMIT 1`,
            [
                id_sala,
                id_reserva,
                data_fim,
                data_inicio,
                ...turnos
            ]
        );

        return conflitos[0] || null;
    },


    // =========================================
    // APROVAR RESERVA
    // =========================================

    async aprovar(id_reserva, id_empresa, id_admin) {
        const conexao = await conect.getConnection();

        try {
            await conexao.beginTransaction();

            // Busca e bloqueia a reserva.
            const [reservas] = await conexao.execute(
                `SELECT *
                FROM reservas
                WHERE id_reserva = ?
                AND id_empresa = ?
                LIMIT 1
                FOR UPDATE`,
                [id_reserva, id_empresa]
            );

            if (!reservas.length) {
                throw new Error('RESERVA_NAO_ENCONTRADA');
            }

            const reserva = reservas[0];

            if (reserva.status !== 'pendente') {
                throw new Error('RESERVA_NAO_ESTA_PENDENTE');
            }

            // Bloqueia a sala para impedir aprovações
            // simultâneas de reservas conflitantes.
            const [salas] = await conexao.execute(
                `SELECT id_sala, status
                FROM sala
                WHERE id_sala = ?
                AND id_empresa = ?
                LIMIT 1
                FOR UPDATE`,
                [reserva.id_sala, id_empresa]
            );

            if (!salas.length) {
                throw new Error('SALA_NAO_ENCONTRADA');
            }

            if (salas[0].status !== 'disponivel') {
                throw new Error('SALA_INDISPONIVEL');
            }

            // Recupera os turnos da reserva.
            const [turnosEncontrados] = await conexao.execute(
                `SELECT turno
                FROM reserva_turnos
                WHERE id_reserva = ?`,
                [id_reserva]
            );

            const turnos = turnosEncontrados.map(item => item.turno);

            if (!turnos.length) {
                throw new Error('RESERVA_SEM_TURNOS');
            }

            // Verifica sobreposição de datas e turnos.
            const conflito = await this.verificarConflito(
                conexao,
                id_reserva,
                reserva.id_sala,
                reserva.data_inicio,
                reserva.data_fim_prevista,
                turnos
            );


            if (conflito) {
                throw new Error('RESERVA_EM_CONFLITO');
            }

            // Verifica se já existem retiradas registradas
            // nos dias e turnos que serão reservados.
            const placeholders = turnos.map(() => "?").join(", ");

            const [registrosConflitantes] = await conexao.execute(
                `SELECT id_registro, data_retirada, turno
                    FROM registros
                    WHERE id_empresa = ?
                    AND id_sala = ?
                    AND status = 'retirada'
                    AND data_retirada BETWEEN ? AND ?
                    AND turno IN (${placeholders})`,
                [
                    id_empresa,
                    reserva.id_sala,
                    reserva.data_inicio,
                    reserva.data_fim_prevista,
                    ...turnos
                ]
            );

            if (registrosConflitantes.length > 0) {
                throw new Error('RESERVA_CONFLITA_COM_RETIRADA');
            }


            // Aprova a reserva.
            await conexao.execute(
                `UPDATE reservas
                SET
                    status = 'aprovada',
                    id_aprovador = ?,
                    data_aprovacao = NOW()
                WHERE id_reserva = ?
                AND id_empresa = ?`,
                [
                    id_admin,
                    id_reserva,
                    id_empresa
                ]
            );

            // Registra no histórico.
            await reservaHistoricoModel.registrar(
                conexao,
                id_reserva,
                id_admin,
                'reserva.aprovada',
                'Reserva aprovada pelo administrador.'
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


    // =========================================
    // RECUSAR RESERVA
    // =========================================

    async recusar(
        id_reserva,
        id_empresa,
        id_admin,
        motivo
    ) {
        const conexao = await conect.getConnection();

        try {
            await conexao.beginTransaction();

            const [reservas] = await conexao.execute(
                `SELECT id_reserva, status
                FROM reservas
                WHERE id_reserva = ?
                AND id_empresa = ?
                LIMIT 1
                FOR UPDATE`,
                [id_reserva, id_empresa]
            );

            if (!reservas.length) {
                throw new Error('RESERVA_NAO_ENCONTRADA');
            }

            if (reservas[0].status !== 'pendente') {
                throw new Error('RESERVA_NAO_ESTA_PENDENTE');
            }

            await conexao.execute(
                `UPDATE reservas
                SET
                    status = 'recusada',
                    id_aprovador = ?,
                    data_aprovacao = NOW(),
                    motivo_recusa = ?
                WHERE id_reserva = ?
                AND id_empresa = ?`,
                [
                    id_admin,
                    motivo,
                    id_reserva,
                    id_empresa
                ]
            );

            await reservaHistoricoModel.registrar(
                conexao,
                id_reserva,
                id_admin,
                'reserva.recusada',
                `Reserva recusada. Motivo: ${motivo}`
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

    // =========================================
    // DISPONIBILIZAR SALA ANTECIPADAMENTE
    // =========================================

    async disponibilizar(
        id_reserva,
        id_empresa,
        id_usuario,
        motivo
    ) {
        const conexao = await conect.getConnection();

        try {
            await conexao.beginTransaction();

            const [reservas] = await conexao.execute(
                `SELECT *
                FROM reservas
                WHERE id_reserva = ?
                AND id_empresa = ?
                AND id_solicitante = ?
                LIMIT 1
                FOR UPDATE`,
                [id_reserva, id_empresa, id_usuario]
            );

            if (!reservas.length) {
                throw new Error('RESERVA_NAO_ENCONTRADA');
            }

            const reserva = reservas[0];

            if (reserva.status !== 'aprovada') {
                throw new Error('RESERVA_NAO_ESTA_APROVADA');
            }

            // Impede disponibilização antes do início.
            const [datas] = await conexao.execute(
                `SELECT CURDATE() AS hoje`
            );

            if (
                new Date(reserva.data_inicio) >
                new Date(datas[0].hoje)
            ) {
                throw new Error('RESERVA_AINDA_NAO_INICIOU');
            }

            // Bloqueia a sala durante a operação.
            await conexao.execute(
                `SELECT id_sala
                FROM sala
                WHERE id_sala = ?
                AND id_empresa = ?
                FOR UPDATE`,
                [reserva.id_sala, id_empresa]
            );

            // Não permite disponibilizar enquanto
            // existir uma retirada sem devolução.
            const [registrosAtivos] = await conexao.execute(
                `SELECT id_registro
                FROM registros
                WHERE id_sala = ?
                AND id_empresa = ?
                AND status = 'retirada'
                LIMIT 1
                FOR UPDATE`,
                [reserva.id_sala, id_empresa]
            );

            if (registrosAtivos.length) {
                throw new Error('SALA_COM_RETIRADA_ATIVA');
            }

            await conexao.execute(
                `UPDATE reservas
                SET
                    status = 'concluida',
                    data_fim_real = CURDATE(),
                    motivo_disponibilizacao = ?
                WHERE id_reserva = ?
                AND id_empresa = ?`,
                [
                    motivo || null,
                    id_reserva,
                    id_empresa
                ]
            );

            await reservaHistoricoModel.registrar(
                conexao,
                id_reserva,
                id_usuario,
                'reserva.disponibilizada',
                `Sala disponibilizada antecipadamente. ${motivo || 'Sem justificativa informada.'
                }`
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


    // =========================================
    // SOLICITAR EXTENSAO
    // =========================================

    async solicitarExtensao(
        id_reserva,
        id_empresa,
        id_usuario,
        data_fim_solicitada,
        justificativa
    ) {
        const conexao = await conect.getConnection();

        try {
            await conexao.beginTransaction();

            const [reservas] = await conexao.execute(
                `SELECT *
                FROM reservas
                WHERE id_reserva = ?
                AND id_empresa = ?
                AND id_solicitante = ?
                LIMIT 1
                FOR UPDATE`,
                [id_reserva, id_empresa, id_usuario]
            );

            if (!reservas.length) {
                throw new Error('RESERVA_NAO_ENCONTRADA');
            }

            const reserva = reservas[0];

            if (reserva.status !== 'aprovada') {
                throw new Error('RESERVA_NAO_ESTA_APROVADA');
            }

            if (
                new Date(data_fim_solicitada) <=
                new Date(reserva.data_fim_prevista)
            ) {
                throw new Error('DATA_EXTENSAO_INVALIDA');
            }

            // Evita múltiplas extensões pendentes.
            const [pendentes] = await conexao.execute(
                `SELECT id_extensao
                FROM reserva_extensoes
                WHERE id_reserva = ?
                AND status = 'pendente'
                LIMIT 1
                FOR UPDATE`,
                [id_reserva]
            );

            if (pendentes.length) {
                throw new Error('EXTENSAO_PENDENTE_EXISTENTE');
            }

            const [resultado] = await conexao.execute(
                `INSERT INTO reserva_extensoes (
                    id_reserva,
                    id_solicitante,
                    data_fim_atual,
                    data_fim_solicitada,
                    justificativa
                ) VALUES (?, ?, ?, ?, ?)`,
                [
                    id_reserva,
                    id_usuario,
                    reserva.data_fim_prevista,
                    data_fim_solicitada,
                    justificativa || null
                ]
            );

            await reservaHistoricoModel.registrar(
                conexao,
                id_reserva,
                id_usuario,
                'reserva.extensao_solicitada',
                `Solicitou extensão até ${data_fim_solicitada}.`
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


    // =========================================
    // DECIDIR EXTENSAO
    // =========================================

    async decidirExtensao(
        id_extensao,
        id_empresa,
        id_admin,
        aprovar,
        justificativa
    ) {
        const conexao = await conect.getConnection();

        try {
            await conexao.beginTransaction();

            const [extensoes] = await conexao.execute(
                `SELECT
                    e.*,
                    r.id_sala,
                    r.data_inicio,
                    r.data_fim_prevista,
                    r.status AS status_reserva

                FROM reserva_extensoes e

                INNER JOIN reservas r
                    ON r.id_reserva = e.id_reserva

                WHERE e.id_extensao = ?
                AND r.id_empresa = ?

                LIMIT 1
                FOR UPDATE`,
                [id_extensao, id_empresa]
            );

            if (!extensoes.length) {
                throw new Error('EXTENSAO_NAO_ENCONTRADA');
            }

            const extensao = extensoes[0];

            if (extensao.status !== 'pendente') {
                throw new Error('EXTENSAO_JA_ANALISADA');
            }

            if (extensao.status_reserva !== 'aprovada') {
                throw new Error('RESERVA_NAO_ESTA_APROVADA');
            }

            if (aprovar) {
                // Bloqueia a sala para evitar aprovações
                // simultâneas que gerem conflitos.
                await conexao.execute(
                    `SELECT id_sala
                    FROM sala
                    WHERE id_sala = ?
                    AND id_empresa = ?
                    FOR UPDATE`,
                    [extensao.id_sala, id_empresa]
                );

                // Confere se a data original não mudou.
                if (
                    new Date(extensao.data_fim_atual).getTime() !==
                    new Date(extensao.data_fim_prevista).getTime()
                ) {
                    throw new Error('EXTENSAO_DESATUALIZADA');
                }

                const [turnosEncontrados] = await conexao.execute(
                    `SELECT turno
                    FROM reserva_turnos
                    WHERE id_reserva = ?`,
                    [extensao.id_reserva]
                );

                const turnos = turnosEncontrados.map(
                    item => item.turno
                );

                const conflito = await this.verificarConflito(
                    conexao,
                    extensao.id_reserva,
                    extensao.id_sala,
                    extensao.data_inicio,
                    extensao.data_fim_solicitada,
                    turnos
                );

                if (conflito) {
                    throw new Error('RESERVA_EM_CONFLITO');
                }

                await conexao.execute(
                    `UPDATE reservas
                    SET data_fim_prevista = ?
                    WHERE id_reserva = ?
                    AND id_empresa = ?`,
                    [
                        extensao.data_fim_solicitada,
                        extensao.id_reserva,
                        id_empresa
                    ]
                );
            }

            const novoStatus = aprovar
                ? 'aprovada'
                : 'recusada';

            await conexao.execute(
                `UPDATE reserva_extensoes
                SET
                    status = ?,
                    id_responsavel = ?,
                    data_decisao = NOW(),
                    justificativa_decisao = ?
                WHERE id_extensao = ?`,
                [
                    novoStatus,
                    id_admin,
                    justificativa || null,
                    id_extensao
                ]
            );

            await reservaHistoricoModel.registrar(
                conexao,
                extensao.id_reserva,
                id_admin,
                aprovar
                    ? 'reserva.extensao_aprovada'
                    : 'reserva.extensao_recusada',
                aprovar
                    ? `Extensão aprovada até ${extensao.data_fim_solicitada}.`
                    : `Extensão recusada. ${justificativa || ''}`
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


    // =========================================
    // CANCELAR RESERVA
    // =========================================

    async cancelar(
        id_reserva,
        id_empresa,
        id_admin,
        motivo
    ) {
        const conexao = await conect.getConnection();

        try {
            await conexao.beginTransaction();

            const [reservas] = await conexao.execute(
                `SELECT id_reserva, status
                FROM reservas
                WHERE id_reserva = ?
                AND id_empresa = ?
                LIMIT 1
                FOR UPDATE`,
                [id_reserva, id_empresa]
            );

            if (!reservas.length) {
                throw new Error('RESERVA_NAO_ENCONTRADA');
            }

            const status = reservas[0].status;

            if (!['pendente', 'aprovada'].includes(status)) {
                throw new Error('RESERVA_NAO_PODE_SER_CANCELADA');
            }

            if (!motivo) {
                throw new Error('MOTIVO_CANCELAMENTO_OBRIGATORIO');
            }

            await conexao.execute(
                `UPDATE reservas
                SET
                    status = 'cancelada',
                    motivo_cancelamento = ?,
                    id_aprovador = ?
                WHERE id_reserva = ?
                AND id_empresa = ?`,
                [
                    motivo,
                    id_admin,
                    id_reserva,
                    id_empresa
                ]
            );

            await reservaHistoricoModel.registrar(
                conexao,
                id_reserva,
                id_admin,
                'reserva.cancelada',
                `Reserva cancelada pelo administrador. Motivo: ${motivo}`
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


    // =========================================
    // CADASTRAR MANUTENCAO
    // =========================================

    async criarManutencao(dados) {
        const conexao = await conect.getConnection();

        try {
            await conexao.beginTransaction();

            const [reservas] = await conexao.execute(
                `SELECT *
                FROM reservas
                WHERE id_reserva = ?
                AND id_empresa = ?
                LIMIT 1
                FOR UPDATE`,
                [
                    dados.id_reserva,
                    dados.id_empresa
                ]
            );

            if (!reservas.length) {
                throw new Error('RESERVA_NAO_ENCONTRADA');
            }

            const reserva = reservas[0];

            if (reserva.status !== 'aprovada') {
                throw new Error('RESERVA_NAO_ESTA_APROVADA');
            }

            // A manutenção precisa estar dentro do
            // período da reserva.
            if (
                new Date(dados.data_inicio) <
                new Date(reserva.data_inicio) ||
                new Date(dados.data_fim) >
                new Date(reserva.data_fim_prevista) ||
                new Date(dados.data_inicio) >
                new Date(dados.data_fim)
            ) {
                throw new Error('PERIODO_MANUTENCAO_INVALIDO');
            }

            await conexao.execute(
                `SELECT id_sala
                FROM sala
                WHERE id_sala = ?
                AND id_empresa = ?
                FOR UPDATE`,
                [reserva.id_sala, dados.id_empresa]
            );

            // A manutenção só pode afetar turnos
            // que pertencem à reserva.
            const [turnosReserva] = await conexao.execute(
                `SELECT turno
                FROM reserva_turnos
                WHERE id_reserva = ?`,
                [dados.id_reserva]
            );

            const turnosPermitidos = turnosReserva.map(
                item => item.turno
            );

            const turnos = [...new Set(dados.turnos)];

            if (
                !turnos.length ||
                turnos.some(turno => !turnosPermitidos.includes(turno))
            ) {
                throw new Error('TURNOS_MANUTENCAO_INVALIDOS');
            }

            // Impede manutenções sobrepostas para
            // a mesma sala e turno.
            const placeholders = turnos.map(() => '?').join(', ');

            const [conflitos] = await conexao.execute(
                `SELECT DISTINCT m.id_manutencao
                FROM reserva_manutencoes m

                INNER JOIN reserva_manutencao_turnos mt
                    ON mt.id_manutencao = m.id_manutencao

                WHERE m.id_sala = ?
                AND m.status = 'agendada'
                AND m.data_inicio <= ?
                AND m.data_fim >= ?
                AND mt.turno IN (${placeholders})
                LIMIT 1`,
                [
                    reserva.id_sala,
                    dados.data_fim,
                    dados.data_inicio,
                    ...turnos
                ]
            );

            if (conflitos.length) {
                throw new Error('MANUTENCAO_EM_CONFLITO');
            }

            const [resultado] = await conexao.execute(
                `INSERT INTO reserva_manutencoes (
                    id_reserva,
                    id_empresa,
                    id_sala,
                    id_responsavel,
                    descricao,
                    data_inicio,
                    data_fim
                ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [
                    dados.id_reserva,
                    dados.id_empresa,
                    reserva.id_sala,
                    dados.id_responsavel,
                    dados.descricao,
                    dados.data_inicio,
                    dados.data_fim
                ]
            );

            const id_manutencao = resultado.insertId;

            for (const turno of turnos) {
                await conexao.execute(
                    `INSERT INTO reserva_manutencao_turnos (
                        id_manutencao,
                        turno
                    ) VALUES (?, ?)`,
                    [id_manutencao, turno]
                );
            }

            await reservaHistoricoModel.registrar(
                conexao,
                dados.id_reserva,
                dados.id_responsavel,
                'reserva.manutencao_criada',
                `Manutenção cadastrada: ${dados.descricao}`
            );

            await conexao.commit();

            return id_manutencao;

        } catch (error) {
            await conexao.rollback();
            throw error;

        } finally {
            conexao.release();
        }
    },


    // =========================================
    // CANCELAR MANUTENCAO
    // =========================================

    async cancelarManutencao(
        id_manutencao,
        id_empresa,
        id_admin
    ) {
        const conexao = await conect.getConnection();

        try {
            await conexao.beginTransaction();

            const [manutencoes] = await conexao.execute(
                `SELECT
                    m.id_manutencao,
                    m.id_reserva,
                    m.status

                FROM reserva_manutencoes m

                WHERE m.id_manutencao = ?
                AND m.id_empresa = ?

                LIMIT 1
                FOR UPDATE`,
                [id_manutencao, id_empresa]
            );

            if (!manutencoes.length) {
                throw new Error('MANUTENCAO_NAO_ENCONTRADA');
            }

            const manutencao = manutencoes[0];

            if (manutencao.status !== 'agendada') {
                throw new Error('MANUTENCAO_NAO_ESTA_AGENDADA');
            }

            await conexao.execute(
                `UPDATE reserva_manutencoes
                SET status = 'cancelada'
                WHERE id_manutencao = ?
                AND id_empresa = ?`,
                [id_manutencao, id_empresa]
            );

            await reservaHistoricoModel.registrar(
                conexao,
                manutencao.id_reserva,
                id_admin,
                'reserva.manutencao_cancelada',
                `Manutenção ${id_manutencao} cancelada pelo administrador.`
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


};

export default reservaService;
