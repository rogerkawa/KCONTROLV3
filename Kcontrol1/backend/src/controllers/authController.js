
import authModel from '../models/authModel.js';
import * as mfaModel from '../models/mfaModel.js';

import { descriptografarSegredo } from '../services/mfaCrypto.js';
import { validarCodigoMFA } from '../services/mfaService.js';
import { validarCodigoRecuperacao } from '../services/mfaRecoveryService.js';

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const COOKIE_TOKEN = 'kcontrol_token';
const COOKIE_MFA_PENDING = 'kcontrol_mfa_pending';

const opcoesCookie = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    path: '/',
    maxAge: 24 * 60 * 60 * 1000
};

const opcoesCookieMFA = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    path: '/',
    maxAge: 5 * 60 * 1000
};

const authController = {

    async login(req, res) {
        try {
            const { email, senha } = req.body;

            if (!email || !senha) {
                return res.status(400).json({
                    message: 'Informe o e-mail e a senha.'
                });
            }

            const usuario = await authModel.buscarPorEmail(
                email.trim().toLowerCase()
            );

            if (!usuario) {
                return res.status(401).json({
                    message: 'E-mail ou senha incorretos.'
                });
            }

            const senhaValida = await bcrypt.compare(
                senha,
                usuario.senha
            );

            if (!senhaValida) {
                return res.status(401).json({
                    message: 'E-mail ou senha incorretos.'
                });
            }

            if (usuario.status_usuario !== 'ativo') {
                return res.status(403).json({
                    message: 'Sua conta está inativa.'
                });
            }

            if (usuario.role === 'superadmin') {
                if (usuario.id_empresa !== null) {
                    return res.status(403).json({
                        message: 'Configuração de acesso inválida.'
                    });
                }
            } else {
                if (!usuario.id_empresa) {
                    return res.status(403).json({
                        message: 'Usuário sem empresa vinculada.'
                    });
                }

                if (usuario.status_empresa !== 'ativa') {
                    return res.status(403).json({
                        message: 'A empresa não está disponível para acesso.'
                    });
                }
            }

            if (!process.env.JWT_SECRET) {
                throw new Error('JWT_SECRET não configurado.');
            }

            // SuperAdmin: exige MFA antes de liberar a sessão.
            if (usuario.role === 'superadmin') {

                // Remove qualquer sessão anterior deste navegador.
                res.clearCookie(COOKIE_TOKEN, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'lax',
                    path: '/'
                });

                const tokenPendente = jwt.sign(
                    {
                        id_usuario: usuario.id_usuario,
                        mfa_pending: true
                    },
                    process.env.JWT_SECRET,
                    {
                        expiresIn: '5m'
                    }
                );

                res.cookie(
                    COOKIE_MFA_PENDING,
                    tokenPendente,
                    opcoesCookieMFA
                );

                return res.status(200).json({
                    message: 'Verificação adicional necessária.',
                    requiresMfa: true,
                    mfaConfigured: Boolean(usuario.mfa_enabled)
                });
            }

            // Usuários comuns continuam com o login normal.
            res.clearCookie(COOKIE_MFA_PENDING, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                path: '/'
            });

            const token = jwt.sign(
                {
                    id_usuario: usuario.id_usuario
                },
                process.env.JWT_SECRET,
                {
                    expiresIn: '1d'
                }
            );

            res.cookie(
                COOKIE_TOKEN,
                token,
                opcoesCookie
            );

            return res.status(200).json({
                message: 'Login realizado com sucesso!',

                requiresMfa: false,

                usuario: {
                    id_usuario: usuario.id_usuario,
                    id_empresa: usuario.id_empresa,
                    nome: usuario.nome,
                    email: usuario.email,
                    role: usuario.role,
                    avatar_url: usuario.avatar_url
                }
            });

        } catch (error) {
            console.error('Erro no login:', error);

            return res.status(500).json({
                message: 'Erro interno no servidor.'
            });
        }
    },
    async verificarMFA(req, res) {
    try {
        const idUsuario = req.mfaUser.id_usuario;
        const codigo = String(req.body?.codigo || '').trim();

        if (!codigo) {
            return res.status(400).json({
                message: 'Informe o código de autenticação.'
            });
        }

        const usuario = await authModel.buscarPorId(idUsuario);

        if (
            !usuario ||
            usuario.status_usuario !== 'ativo' ||
            usuario.role !== 'superadmin' ||
            usuario.id_empresa !== null
        ) {
            return res.status(403).json({
                message: 'Usuário não autorizado.'
            });
        }

        const mfa = await mfaModel.buscarMFA(idUsuario);

        if (!mfa || !Boolean(mfa.mfa_enabled)) {
            return res.status(403).json({
                message: 'O MFA ainda não está configurado.'
            });
        }

        let codigoValido = false;
        let codigoRecuperacao = false;

        // Verificação pelo aplicativo autenticador.
        if (/^\d{6}$/.test(codigo)) {
            const segredo = descriptografarSegredo(
                mfa.mfa_secret_encrypted
            );

            codigoValido = validarCodigoMFA(
                segredo,
                codigo
            );
        } else {
            // Verificação por código de recuperação.
            const hashes = typeof mfa.mfa_recovery_codes === 'string'
                ? JSON.parse(mfa.mfa_recovery_codes || '[]')
                : (mfa.mfa_recovery_codes || []);

            const indice = validarCodigoRecuperacao(
                codigo,
                hashes
            );

            if (indice !== null) {
                const consumido = await mfaModel.consumirCodigoRecuperacao(
                    idUsuario,
                    hashes,
                    indice
                );

                codigoValido = consumido;
                codigoRecuperacao = consumido;
            }
        }

        if (!codigoValido) {
            return res.status(401).json({
                message: 'Código incorreto, expirado ou já utilizado.'
            });
        }

        // Cria a sessão definitiva somente após validar o MFA.
        const token = jwt.sign(
            {
                id_usuario: usuario.id_usuario,
                mfa_verified: true
            },
            process.env.JWT_SECRET,
            {
                expiresIn: '1d'
            }
        );

        res.cookie(
            COOKIE_TOKEN,
            token,
            opcoesCookie
        );

        res.clearCookie(COOKIE_MFA_PENDING, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/'
        });

        return res.status(200).json({
            message: 'Verificação MFA concluída com sucesso.',
            codigoRecuperacao,
            usuario: {
                id_usuario: usuario.id_usuario,
                id_empresa: usuario.id_empresa,
                nome: usuario.nome,
                email: usuario.email,
                role: usuario.role,
                avatar_url: usuario.avatar_url
            }
        });

    } catch (error) {
        console.error('Erro ao verificar MFA:', error);

        return res.status(500).json({
            message: 'Não foi possível verificar o código MFA.'
        });
    }
},

    logout(req, res) {
        const opcoesLimpeza = {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/'
        };

        res.clearCookie(COOKIE_TOKEN, opcoesLimpeza);
        res.clearCookie(COOKIE_MFA_PENDING, opcoesLimpeza);

        return res.status(200).json({
            message: 'Logout realizado com sucesso.'
        });
    }

};

export default authController;
