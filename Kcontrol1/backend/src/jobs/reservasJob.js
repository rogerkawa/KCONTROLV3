
import cron from "node-cron";
import conect from "../config/database.js";
import reservaHistoricoModel from "../models/reservaHistoricoModel.js";

function obterDataAtual() {
    const partes = new Intl.DateTimeFormat("en-CA", {
        timeZone: "America/Fortaleza",
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
    }).formatToParts(new Date());

    const valores = Object.fromEntries(
        partes.map(({ type, value }) => [type, value])
    );

    return `${valores.year}-${valores.month}-${valores.day}`;
}

async function concluirReservasVencidas() {
    const conexao = await conect.getConnection();

    try {
        await conexao.beginTransaction();

        const dataAtual = obterDataAtual();

        // Bloqueia as reservas vencidas durante o processamento.
        const [reservas] = await conexao.execute(
            `SELECT
                id_reserva,
                data_fim_prevista
            FROM reservas
            WHERE status = 'aprovada'
              AND data_fim_prevista <= ?
            FOR UPDATE`,
            [dataAtual]
        );

        if (reservas.length === 0) {
            await conexao.commit();
            return 0;
        }

        for (const reserva of reservas) {
            await conexao.execute(
                `UPDATE reservas
                SET
                    status = 'concluida',
                    data_fim_real = data_fim_prevista
                WHERE id_reserva = ?
                  AND status = 'aprovada'`,
                [reserva.id_reserva]
            );

            await reservaHistoricoModel.registrar(
                conexao,
                reserva.id_reserva,
                null,
                "reserva.conclusao_automatica",
                `Reserva concluída automaticamente em ${reserva.data_fim_prevista}, conforme a data prevista de término.`
            );
        }

        await conexao.commit();

        console.log(
            `[Reservas] ${reservas.length} reserva(s) concluída(s) automaticamente.`
        );

        return reservas.length;

    } catch (error) {
        await conexao.rollback();

        console.error(
            "[Reservas] Erro ao concluir reservas vencidas:",
            error
        );

        throw error;

    } finally {
        conexao.release();
    }
}

function iniciarReservasJob() {
    // Executa a verificação a cada 5 minutos.
    cron.schedule(
        "*/5 * * * *",
        async () => {
            try {
                await concluirReservasVencidas();
            } catch (error) {
                console.error("[Reservas] Falha na execução automática:", error);
            }
        },
        {
            timezone: "America/Fortaleza"
        }
    );

    // Também verifica as reservas quando o servidor inicia.
    concluirReservasVencidas().catch(error => {
        console.error("[Reservas] Falha na verificação inicial:", error);
    });

    console.log("[Reservas] Job automático iniciado.");
}

export default iniciarReservasJob;
