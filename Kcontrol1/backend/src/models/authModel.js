
import conect from '../config/database.js';

const authModel = {

    async buscarPorEmail(email) {
        const [resultado] = await conect.execute(
            `SELECT
                u.id_usuario,
                u.id_empresa,
                u.nome,
                u.email,
                u.senha,
                u.role,
                u.avatar_url,
                u.status AS status_usuario,
                e.status AS status_empresa
            FROM usuarios u
            LEFT JOIN empresas e
                ON u.id_empresa = e.id_empresa
            WHERE u.email = ?
            LIMIT 1`,
            [email]
        );

        return resultado[0];
    },

    async buscarPorId(id_usuario) {
        const [resultado] = await conect.execute(
            `SELECT
                u.id_usuario,
                u.id_empresa,
                u.nome,
                u.email,
                u.role,
                u.avatar_url,
                u.status AS status_usuario,
                e.status AS status_empresa
            FROM usuarios u
            LEFT JOIN empresas e
                ON u.id_empresa = e.id_empresa
            WHERE u.id_usuario = ?
            LIMIT 1`,
            [id_usuario]
        );

        return resultado[0];
    }

};

export default authModel;
