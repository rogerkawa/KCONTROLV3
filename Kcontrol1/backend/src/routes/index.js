import authRoutes from './authRoutes.js';
import solicitacaoRoutes from './solicitacaoRoutes.js';
import registroRoutes from './registroRoutes.js';
import usuarioRoutes from './usuarioRoutes.js';
import conviteRoutes from './conviteRoutes.js';
import setorRoutes from './setorRoutes.js';
import salaRoutes from './salaRoutes.js';
import auditoriaRoutes from './auditoriaRoutes.js';
import dashboardRoutes from './dashboardRoutes.js';
import perfilRoutes from './perfilRoutes.js';
import empresaRoutes from './empresaRoutes.js';
import reservaRoutes from './reservaRoutes.js';

const routes = (app) => {

    app.use('/api/auth', authRoutes);
    app.use('/api/solicitacoes', solicitacaoRoutes);
    app.use('/api/convites', conviteRoutes);
    app.use('/api/usuarios', usuarioRoutes);
    app.use('/api/setores', setorRoutes);
    app.use('/api/salas', salaRoutes);
    app.use('/api/registros', registroRoutes);
    app.use('/api/auditoria', auditoriaRoutes);
    app.use('/api/dashboard', dashboardRoutes);
    app.use('/api/perfil', perfilRoutes);
    app.use('/api/empresas', empresaRoutes);
    app.use('/api/reservas', reservaRoutes);

};

export default routes;