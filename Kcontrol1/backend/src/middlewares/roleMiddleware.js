
function roleMiddleware(...rolesPermitidas) {

    return (req, res, next) => {

        if (!req.user) {
            return res.status(401).json({
                message: 'Usuário não autenticado.'
            });
        }

        if (!rolesPermitidas.includes(req.user.role)) {
            return res.status(403).json({
                message: 'Você não possui permissão para acessar este recurso.'
            });
        }

        next();
    };

}

export default roleMiddleware;
