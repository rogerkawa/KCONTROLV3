import conviteModel from '../models/conviteModel.js';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';

const conviteController = {

    // Validar convite
    async validar(req, res) {
        try {
            const { token } = req.body;

            if (!token || !/^[a-f0-9]{64}$/i.test(token)) {
                return res.status(400).json({
                    message: 'Token de convite inválido.'
                });
            }

            const tokenHash = crypto
                .createHash('sha256')
                .update(token)
                .digest('hex');

            const convite = await conviteModel.buscarValido(tokenHash);

            if (!convite) {
                return res.status(400).json({
                    message: 'Este convite é inválido, expirou ou já foi utilizado.'
                });
            }

            if (convite.status_usuario !== 'inativo') {
                return res.status(400).json({
                    message: 'Esta conta já foi ativada.'
                });
            }

            if (convite.role !== 'admin') {
                return res.status(400).json({
                    message: 'Convite não autorizado.'
                });
            }

            if (convite.status_empresa !== 'ativa') {
                return res.status(403).json({
                    message: 'A empresa não está disponível para acesso.'
                });
            }

            return res.status(200).json({
                message: 'Convite válido!',
                administrador: {
                    nome: convite.nome,
                    email: convite.email
                },
                empresa: {
                    nome: convite.nome_empresa
                },
                expires_at: convite.expires_at
            });

        } catch (error) {
            console.error('Erro ao validar convite:', error);

            return res.status(500).json({
                message: 'Erro ao validar convite.'
            });
        }
    },

    // Ativar conta do administrador
    async ativar(req, res) {
        try {
            const { token, senha, confirmarSenha } = req.body;

            if (!token || !/^[a-f0-9]{64}$/i.test(token)) {
                return res.status(400).json({
                    message: 'Token de convite inválido.'
                });
            }

            if (!senha || !confirmarSenha) {
                return res.status(400).json({
                    message: 'Informe e confirme sua senha.'
                });
            }

            if (senha.length < 12) {
                return res.status(400).json({
                    message: 'A senha deve possuir pelo menos 12 caracteres.'
                });
            }

            if (senha !== confirmarSenha) {
                return res.status(400).json({
                    message: 'As senhas não coincidem.'
                });
            }

            const tokenHash = crypto
                .createHash('sha256')
                .update(token)
                .digest('hex');

            // Verificar convite antes de gerar o hash da senha
            const convite = await conviteModel.buscarValido(tokenHash);

            if (!convite) {
                return res.status(400).json({
                    message: 'Este convite é inválido, expirou ou já foi utilizado.'
                });
            }

            if (convite.status_usuario !== 'inativo') {
                return res.status(400).json({
                    message: 'Esta conta já foi ativada.'
                });
            }

            if (convite.role !== 'admin') {
                return res.status(400).json({
                    message: 'Convite não autorizado.'
                });
            }

            if (convite.status_empresa !== 'ativa') {
                return res.status(403).json({
                    message: 'A empresa não está disponível para acesso.'
                });
            }

            const senhaHash = await bcrypt.hash(senha, 12);

            await conviteModel.ativar(tokenHash, senhaHash);

            return res.status(200).json({
                message: 'Conta ativada com sucesso! Você já pode fazer login.'
            });

        } catch (error) {
            console.error('Erro ao ativar conta:', error);

            const erros = {
                CONVITE_INVALIDO: [
                    400,
                    'Este convite é inválido, expirou ou já foi utilizado.'
                ],
                CONTA_JA_ATIVADA: [
                    409,
                    'Esta conta já foi ativada.'
                ],
                USUARIO_INVALIDO: [
                    403,
                    'Este convite não pertence a um administrador válido.'
                ],
                EMPRESA_INDISPONIVEL: [
                    403,
                    'A empresa não está disponível para acesso.'
                ]
            };

            if (erros[error.message]) {
                const [status, message] = erros[error.message];

                return res.status(status).json({ message });
            }

            return res.status(500).json({
                message: 'Erro interno ao ativar a conta.'
            });
        }
    }

};

export default conviteController;