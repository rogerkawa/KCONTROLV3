
import jwt from 'jsonwebtoken';
import authModel from '../models/authModel.js';

async function authMiddleware(req, res, next) {
    try {
        const token = req.cookies?.kcontrol_token;

        if (!token) {
            return res.status(401).json({
                message: 'Sessão não encontrada.'
            });
        }

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );
        if (decoded.mfa_pending === true) {
            return res.status(401).json({
                message: 'Conclua a verificação MFA para acessar a plataforma.'
            });
        }

        const usuario = await authModel.buscarPorId(
            decoded.id_usuario
        );

        if (!usuario || usuario.status_usuario !== 'ativo') {
            return res.status(401).json({
                message: 'Usuário não autorizado.'
            });
        }

        req.user = {
            id_usuario: usuario.id_usuario,
            id_empresa: usuario.id_empresa,
            nome: usuario.nome,
            email: usuario.email,
            role: usuario.role,
            avatar_url: usuario.avatar_url,
            status_empresa: usuario.status_empresa
        };

        next();

    } catch (error) {
        if (
            error.name === 'JsonWebTokenError' ||
            error.name === 'TokenExpiredError'
        ) {
            return res.status(401).json({
                message: 'Sessão inválida ou expirada.'
            });
        }

        console.error('Erro na autenticação:', error);

        return res.status(500).json({
            message: 'Erro interno na autenticação.'
        });
    }
}

export default authMiddleware;
