
import auditoriaModel from '../models/auditoriaModel.js';

const auditoriaController = {

    async listar(req, res) {
        try {
            const pagina = Number(req.query.pagina) || 1;
            const limite = Number(req.query.limite) || 20;

            if (
                !Number.isSafeInteger(pagina) ||
                pagina < 1 ||
                !Number.isSafeInteger(limite) ||
                limite < 1 ||
                limite > 100
            ) {
                return res.status(400).json({
                    mensagem: 'Parâmetros de paginação inválidos.'
                });
            }

            const offset = (pagina - 1) * limite;
            const id_empresa = req.user.id_empresa;

            const registros = await auditoriaModel.listar(
                id_empresa,
                limite,
                offset
            );

            const total = await auditoriaModel.contar(id_empresa);

            return res.status(200).json({
                registros,
                paginacao: {
                    pagina,
                    limite,
                    total,
                    totalPaginas: Math.ceil(total / limite)
                }
            });

        } catch (error) {
            console.error(error);

            return res.status(500).json({
                mensagem: 'Erro ao consultar auditoria.'
            });
        }
    }
};

export default auditoriaController;
