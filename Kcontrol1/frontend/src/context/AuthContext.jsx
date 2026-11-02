
import {
    createContext,
    useContext,
    useEffect,
    useState
} from 'react';

import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [usuario, setUsuario] = useState(null);
    const [carregando, setCarregando] = useState(true);

    useEffect(() => {
        async function verificarAutenticacao() {
            const token = localStorage.getItem('token');

            if (!token) {
                setCarregando(false);
                return;
            }

            try {
                const resposta = await api.get('/auth/me');
                setUsuario(resposta.usuario);
            } catch (error) {
                localStorage.removeItem('token');
                setUsuario(null);
            } finally {
                setCarregando(false);
            }
        }

        verificarAutenticacao();
    }, []);

    async function login(email, senha) {
        const resposta = await api.post('/auth/login', {
            email,
            senha
        });

        const { token, usuario } = resposta;

        localStorage.setItem('token', token);
        setUsuario(usuario);

        return usuario;
    }

    function atualizarUsuario(dados) {
        setUsuario(usuarioAtual => ({
            ...usuarioAtual,
            ...dados
        }));
    }

    function logout() {
        localStorage.removeItem('token');
        setUsuario(null);
    }

    return (
        <AuthContext.Provider
            value={{
                usuario,
                carregando,
                autenticado: Boolean(usuario),
                login,
                logout,
                atualizarUsuario
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const contexto = useContext(AuthContext);

    if (!contexto) {
        throw new Error(
            'useAuth deve ser utilizado dentro de AuthProvider'
        );
    }

    return contexto;
}
