
function empresaMiddleware(req, res, next) {

    if (!req.user) {
        return res.status(401).json({
            message: 'Usuário não autenticado.'
        });
    }

    if (req.user.role === 'superadmin') {
        return res.status(403).json({
            message: 'Esta rota é exclusiva de usuários de empresas.'
        });
    }

    if (!req.user.id_empresa) {
        return res.status(403).json({
            message: 'Nenhuma empresa vinculada ao usuário.'
        });
    }

    if (req.user.status_empresa !== 'ativa') {
        return res.status(403).json({
            message: 'Empresa suspensa ou indisponível.'
        });
    }

    next();
}

export default empresaMiddleware;
