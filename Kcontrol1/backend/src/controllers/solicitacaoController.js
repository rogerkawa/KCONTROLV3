import solicitacaoModel from '../models/solicitacaoModel.js';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';

const solicitacaoController = {

    // Cadastro público de empresa
    async criar(req, res) {
        try {
            let {
                nome_empresa,
                cnpj,
                email_empresa,
                telefone,
                nome_responsavel,
                email_responsavel
            } = req.body;

            if (
                !nome_empresa ||
                !cnpj ||
                !email_empresa ||
                !nome_responsavel ||
                !email_responsavel
            ) {
                return res.status(400).json({
                    message: 'Preencha todos os campos obrigatórios.'
                });
            }

            nome_empresa = nome_empresa.trim();
            cnpj = cnpj.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
            email_empresa = email_empresa.trim().toLowerCase();
            nome_responsavel = nome_responsavel.trim();
            email_responsavel = email_responsavel.trim().toLowerCase();
            telefone = telefone?.trim() || null;

            if (nome_empresa.length < 2 || nome_responsavel.length < 2) {
                return res.status(400).json({
                    message: 'Informe nomes válidos.'
                });
            }

            if (!/^[A-Z0-9]{12}[0-9]{2}$/.test(cnpj)) {
                return res.status(400).json({
                    message: 'Informe um CNPJ válido.'
                });
            }

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

            if (
                !emailRegex.test(email_empresa) ||
                !emailRegex.test(email_responsavel)
            ) {
                return res.status(400).json({
                    message: 'Informe e-mails válidos.'
                });
            }

            const duplicidade = await solicitacaoModel.verificarDuplicidade(cnpj);

            if (duplicidade === 'empresa') {
                return res.status(409).json({
                    message: 'Esta empresa já está cadastrada.'
                });
            }

            if (duplicidade === 'solicitacao') {
                return res.status(409).json({
                    message: 'Já existe uma solicitação pendente para este CNPJ.'
                });
            }

            const id_solicitacao = await solicitacaoModel.criar({
                nome_empresa,
                cnpj,
                email_empresa,
                telefone,
                nome_responsavel,
                email_responsavel
            });

            return res.status(201).json({
                message: 'Solicitação enviada com sucesso!',
                id_solicitacao
            });

        } catch (error) {
            console.error('Erro ao criar solicitação:', error);

            return res.status(500).json({
                message: 'Erro interno ao enviar a solicitação.'
            });
        }
    },

    // Listar solicitações
    async listar(req, res) {
        try {
            const { status } = req.query;

            const statusPermitidos = [
                'pendente',
                'aprovada',
                'rejeitada'
            ];

            if (status && !statusPermitidos.includes(status)) {
                return res.status(400).json({
                    message: 'Filtro de status inválido.'
                });
            }

            const solicitacoes = await solicitacaoModel.listar(status);

            return res.status(200).json({
                solicitacoes
            });

        } catch (error) {
            console.error('Erro ao listar solicitações:', error);

            return res.status(500).json({
                message: 'Erro ao buscar solicitações.'
            });
        }
    },

    // Buscar detalhes de uma solicitação
    async buscarPorId(req, res) {
        try {
            const id = Number(req.params.id);

            if (!Number.isInteger(id) || id <= 0) {
                return res.status(400).json({
                    message: 'ID de solicitação inválido.'
                });
            }

            const solicitacao = await solicitacaoModel.buscarPorId(id);

            if (!solicitacao) {
                return res.status(404).json({
                    message: 'Solicitação não encontrada.'
                });
            }

            return res.status(200).json({
                solicitacao
            });

        } catch (error) {
            console.error('Erro ao buscar solicitação:', error);

            return res.status(500).json({
                message: 'Erro ao buscar solicitação.'
            });
        }
    },

    // Aprovar solicitação
    async aprovar(req, res) {
        try {
            const id = Number(req.params.id);

            if (!Number.isInteger(id) || id <= 0) {
                return res.status(400).json({
                    message: 'ID de solicitação inválido.'
                });
            }

            // Gerar token seguro para o convite
            const token = crypto.randomBytes(32).toString('hex');

            // Armazenar somente o hash do token
            const tokenHash = crypto
                .createHash('sha256')
                .update(token)
                .digest('hex');

            // Criar senha aleatória inicial para a conta inativa
            const senhaInicial = crypto.randomBytes(48).toString('hex');

            const senhaHash = await bcrypt.hash(senhaInicial, 12);

            const resultado = await solicitacaoModel.aprovar(
                id,
                req.user.id_usuario,
                senhaHash,
                tokenHash
            );

            const frontend = (process.env.FRONTEND_URL || '')
                .split(',')[0]
                .trim()
                .replace(/\/$/, '');

            const conviteUrl = frontend
                ? `${frontend}/definir-senha?token=${token}`
                : null;

            return res.status(200).json({
                message: 'Empresa aprovada e administrador criado!',
                empresa: {
                    id_empresa: resultado.id_empresa
                },
                administrador: {
                    id_usuario: resultado.id_usuario
                },
                convite: {
                    token,
                    url: conviteUrl,
                    validade_horas: 24
                }
            });

        } catch (error) {
            console.error('Erro ao aprovar solicitação:', error);

            const erros = {
                SOLICITACAO_NAO_ENCONTRADA: [404, 'Solicitação não encontrada.'],
                SOLICITACAO_JA_ANALISADA: [409, 'Esta solicitação já foi analisada.'],
                EMPRESA_JA_CADASTRADA: [409, 'Esta empresa já está cadastrada.'],
                EMAIL_JA_CADASTRADO: [409, 'O e-mail do responsável já está em uso.']
            };

            if (erros[error.message]) {
                const [status, message] = erros[error.message];

                return res.status(status).json({ message });
            }

            return res.status(500).json({
                message: 'Erro ao aprovar solicitação.'
            });
        }
    },

    // Rejeitar solicitação
    async rejeitar(req, res) {
        try {
            const id = Number(req.params.id);
            const { motivo } = req.body;

            if (!Number.isInteger(id) || id <= 0) {
                return res.status(400).json({
                    message: 'ID de solicitação inválido.'
                });
            }

            if (!motivo || motivo.trim().length < 5) {
                return res.status(400).json({
                    message: 'Informe um motivo de rejeição válido.'
                });
            }

            await solicitacaoModel.rejeitar(
                id,
                req.user.id_usuario,
                motivo.trim()
            );

            return res.status(200).json({
                message: 'Solicitação rejeitada com sucesso.'
            });

        } catch (error) {
            console.error('Erro ao rejeitar solicitação:', error);

            const erros = {
                SOLICITACAO_NAO_ENCONTRADA: [404, 'Solicitação não encontrada.'],
                SOLICITACAO_JA_ANALISADA: [409, 'Esta solicitação já foi analisada.']
            };

            if (erros[error.message]) {
                const [status, message] = erros[error.message];

                return res.status(status).json({ message });
            }

            return res.status(500).json({
                message: 'Erro ao rejeitar solicitação.'
            });
        }
    }

};

export default solicitacaoController;