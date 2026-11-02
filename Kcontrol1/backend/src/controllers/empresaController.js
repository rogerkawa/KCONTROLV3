
import empresaModel from '../models/empresaModel.js';

const empresaController = {

    // Listar empresas
    async listar(req, res) {
        try {
            const { status } = req.query;

            const statusPermitidos = ['ativa', 'suspensa', 'inativa'];

            if (status && !statusPermitidos.includes(status)) {
                return res.status(400).json({
                    message: 'Status informado inválido.'
                });
            }

            const empresas = await empresaModel.listar(status);

            return res.status(200).json({
                empresas
            });

        } catch (error) {
            console.error('Erro ao listar empresas:', error);

            return res.status(500).json({
                message: 'Erro ao buscar empresas.'
            });
        }
    },

    // Buscar empresa específica
    async buscarPorId(req, res) {
        try {
            const { id } = req.params;

            if (!Number.isInteger(Number(id)) || Number(id) <= 0) {
                return res.status(400).json({
                    message: 'ID da empresa inválido.'
                });
            }

            const empresa = await empresaModel.buscarPorId(Number(id));

            if (!empresa) {
                return res.status(404).json({
                    message: 'Empresa não encontrada.'
                });
            }

            return res.status(200).json({
                empresa
            });

        } catch (error) {
            console.error('Erro ao buscar empresa:', error);

            return res.status(500).json({
                message: 'Erro ao buscar empresa.'
            });
        }
    },

    // Alterar status da empresa
    async atualizarStatus(req, res) {
        try {
            const { id } = req.params;
            const { status } = req.body;

            const statusPermitidos = ['ativa', 'suspensa', 'inativa'];

            if (!Number.isInteger(Number(id)) || Number(id) <= 0) {
                return res.status(400).json({
                    message: 'ID da empresa inválido.'
                });
            }

            if (!statusPermitidos.includes(status)) {
                return res.status(400).json({
                    message: 'Status informado inválido.'
                });
            }

            const resultado = await empresaModel.atualizarStatus(
                Number(id),
                status,
                req.user.id_usuario
            );

            return res.status(200).json({
                message: 'Status da empresa atualizado com sucesso.',
                ...resultado
            });

        } catch (error) {
            console.error('Erro ao atualizar empresa:', error);

            if (error.message === 'EMPRESA_NAO_ENCONTRADA') {
                return res.status(404).json({
                    message: 'Empresa não encontrada.'
                });
            }

            if (error.message === 'STATUS_JA_ATUALIZADO') {
                return res.status(400).json({
                    message: 'A empresa já possui esse status.'
                });
            }

            return res.status(500).json({
                message: 'Erro ao atualizar status da empresa.'
            });
        }
    }

};

export default empresaController;
