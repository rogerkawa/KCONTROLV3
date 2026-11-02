import dashboardModel from '../models/dashboardModel.js';

const dashboardController = {
    async buscar(req, res) {
        try {
            const id_empresa = req.user.id_empresa;

            const periodosPermitidos = [7, 30, 90];
            const periodoSolicitado = Number(req.query.periodo);

            const periodo = periodosPermitidos.includes(periodoSolicitado)
                ? periodoSolicitado
                : 7;

            const [
                resumo,
                retiradasPorDia,
                salasMaisUtilizadas,
                atividadesRecentes
            ] = await Promise.all([
                dashboardModel.buscarResumo(id_empresa),
                dashboardModel.buscarRetiradasPorDia(id_empresa, periodo),
                dashboardModel.buscarSalasMaisUtilizadas(id_empresa),
                dashboardModel.buscarAtividadesRecentes(id_empresa)
            ]);

            const retiradasAtuais = retiradasPorDia.reduce(
                (total, dia) => total + dia.total,
                0
            );

            const retiradasAnteriores = retiradasPorDia.reduce(
                (total, dia) => total + dia.total_anterior,
                0
            );

            const variacaoPercentual = retiradasAnteriores > 0
                ? Number(
                    (
                        ((retiradasAtuais - retiradasAnteriores) /
                            retiradasAnteriores) * 100
                    ).toFixed(1)
                )
                : null;

            return res.status(200).json({
                resumo,
                periodo,

                comparativo: {
                    retiradas_atual: retiradasAtuais,
                    retiradas_anterior: retiradasAnteriores,
                    variacao_percentual: variacaoPercentual
                },

                retiradasPorDia,
                salasMaisUtilizadas,
                atividadesRecentes
            });

        } catch (error) {
            console.error('Erro ao buscar dashboard:', error);

            return res.status(500).json({
                mensagem: 'Erro ao carregar os dados do dashboard.'
            });
        }
    }
};

export default dashboardController;