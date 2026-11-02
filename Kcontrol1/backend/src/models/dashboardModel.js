import conect from '../config/database.js';

const dashboardModel = {
    // Indicadores principais
    async buscarResumo(id_empresa) {
        const [resultado] = await conect.execute(
            `SELECT
                (SELECT COUNT(*)
                 FROM sala
                 WHERE id_empresa = ?) AS total_salas,

                (SELECT COUNT(*)
                 FROM sala
                 WHERE id_empresa = ?
                 AND status = 'disponivel') AS salas_disponiveis,

                (SELECT COUNT(*)
                 FROM registros
                 WHERE id_empresa = ?
                 AND status = 'retirada') AS retiradas_ativas,

                (SELECT COUNT(*)
                 FROM usuarios
                 WHERE id_empresa = ?
                 AND status = 'ativo') AS membros_ativos`,
            [id_empresa, id_empresa, id_empresa, id_empresa]
        );

        return resultado[0];
    },

    // Retiradas do período atual e do anterior
    async buscarRetiradasPorDia(id_empresa, periodo) {
    // Recupera a data atual do MySQL.
    const [[dataBanco]] = await conect.execute(
        `SELECT DATE_FORMAT(CURDATE(), '%Y-%m-%d') AS hoje`
    );

    // Busca o período atual e o anterior.
    const diasBusca = (periodo * 2) - 1;

    const [resultado] = await conect.execute(
        `SELECT
            DATEDIFF(CURDATE(), DATE(data_retirada)) AS dias_atras,
            COUNT(*) AS total
         FROM registros
         WHERE id_empresa = ?
         AND data_retirada >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
         AND data_retirada < DATE_ADD(CURDATE(), INTERVAL 1 DAY)
         GROUP BY
            DATEDIFF(CURDATE(), DATE(data_retirada))
         ORDER BY dias_atras DESC`,
        [id_empresa, diasBusca]
    );

    const totaisPorDia = {};

    resultado.forEach((item) => {
        totaisPorDia[Number(item.dias_atras)] = Number(item.total);
    });

    const hoje = new Date(`${dataBanco.hoje}T00:00:00Z`);

    const serie = [];

    for (let index = 0; index < periodo; index++) {
        const diasAtras = periodo - 1 - index;

        const data = new Date(hoje);
        data.setUTCDate(data.getUTCDate() - diasAtras);

        const dataFormatada = data.toISOString().slice(0, 10);

        const diasAtrasAnterior = periodo + diasAtras;

        serie.push({
            data: dataFormatada,
            total: totaisPorDia[diasAtras] || 0,
            total_anterior: totaisPorDia[diasAtrasAnterior] || 0
        });
    }

    return serie;
},

    // Salas mais utilizadas
    async buscarSalasMaisUtilizadas(id_empresa) {
        const [resultado] = await conect.execute(
            `SELECT
                s.id_sala,
                s.nome,
                COUNT(r.id_registro) AS total_retiradas
             FROM sala s
             INNER JOIN registros r
                ON r.id_sala = s.id_sala
                AND r.id_empresa = s.id_empresa
             WHERE s.id_empresa = ?
             GROUP BY s.id_sala, s.nome
             ORDER BY total_retiradas DESC
             LIMIT 5`,
            [id_empresa]
        );

        return resultado;
    },

    // Atividades recentes
    async buscarAtividadesRecentes(id_empresa) {
        const [resultado] = await conect.execute(
            `SELECT
                a.id_auditoria,
                a.acao,
                a.descricao,
                a.created_at,
                u.nome AS nome_usuario
             FROM auditoria a
             LEFT JOIN usuarios u
                ON a.id_usuario = u.id_usuario
             WHERE a.id_empresa = ?
             ORDER BY a.created_at DESC, a.id_auditoria DESC
             LIMIT 8`,
            [id_empresa]
        );

        return resultado;
    }
};

export default dashboardModel;