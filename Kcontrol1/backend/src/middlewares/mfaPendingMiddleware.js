
import jwt from 'jsonwebtoken';
import authModel from '../models/authModel.js';

async function mfaPendingMiddleware(req, res, next) {
    try {
        const token = req.cookies?.kcontrol_mfa_pending;

        if (!token) {
            return res.status(401).json({
                message: 'Pré-autenticação não encontrada. Faça login novamente.'
            });
        }

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        // Aceita exclusivamente tokens de pré-autenticação MFA.
        if (
            decoded.mfa_pending !== true ||
            !decoded.id_usuario
        ) {
            return res.status(401).json({
                message: 'Token de pré-autenticação inválido.'
            });
        }

        const usuario = await authModel.buscarPorId(
            decoded.id_usuario
        );

        // Confirma que a conta continua sendo um SuperAdmin ativo.
        if (
            !usuario ||
            usuario.status_usuario !== 'ativo' ||
            usuario.role !== 'superadmin' ||
            usuario.id_empresa !== null
        ) {
            return res.status(403).json({
                message: 'Acesso não autorizado à configuração MFA.'
            });
        }

        req.mfaUser = {
            id_usuario: usuario.id_usuario,
            nome: usuario.nome,
            email: usuario.email,
            role: usuario.role,
            mfa_enabled: usuario.mfa_enabled
        };

        next();

    } catch (error) {
        if (
            error.name === 'JsonWebTokenError' ||
            error.name === 'TokenExpiredError'
        ) {
            return res.status(401).json({
                message: 'Pré-autenticação inválida ou expirada. Faça login novamente.'
            });
        }

        console.error('Erro na pré-autenticação MFA:', error);

        return res.status(500).json({
            message: 'Erro interno na pré-autenticação MFA.'
        });
    }
}

export default mfaPendingMiddleware;
