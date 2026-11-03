
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
            try {
                const resposta = await api.get('/auth/me');
                setUsuario(resposta.usuario);
            } catch (error) {
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

    // SuperAdmin precisa concluir o MFA antes de receber uma sessão.
    if (resposta.requiresMfa) {
        setUsuario(null);

        return resposta;
    }

    // Usuários comuns recebem a sessão normalmente.
    if (!resposta.usuario) {
        throw new Error('Resposta de autenticação inválida.');
    }

    setUsuario(resposta.usuario);

    return resposta;
}

    function atualizarUsuario(dados) {
        setUsuario(usuarioAtual => ({
            ...usuarioAtual,
            ...dados
        }));
    }

    async function logout() {
        try {
            await api.post('/auth/logout', {});
        } catch (error) {
            console.error('Erro ao encerrar sessão:', error);
        } finally {
            setUsuario(null);
        }
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
