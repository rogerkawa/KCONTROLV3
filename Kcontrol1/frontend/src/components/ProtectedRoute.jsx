
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function ProtectedRoute() {
    const { autenticado, carregando } = useAuth();

    if (carregando) {
        return (
            <div className="loading-screen">
                <div className="loading-spinner"></div>
                <span>Verificando sessão...</span>
            </div>
        );
    }

    return autenticado ? <Outlet /> : <Navigate to="/login" replace />;
}

export default ProtectedRoute;
