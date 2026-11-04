
import {
    createContext,
    useContext,
    useEffect,
    useState
} from 'react';

import api from '../services/api';
import { useToast } from './ToastContext';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const { mostrarToast } = useToast();
    const [usuario, setUsuario] = useState(null);
    const [carregando, setCarregando] = useState(true);

    useEffect(() => {
        async function verificarAutenticacao() {
            try {
                const resposta = await api.get('/auth/me');
                setUsuario(resposta.usuario);
            } catch {
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

        if (resposta.requiresMfa) {
            setUsuario(null);
            return resposta;
        }

        if (!resposta.usuario) {
            throw new Error('Resposta de autenticação inválida.');
        }

        setUsuario(resposta.usuario);

        return resposta;
    }

    async function verificarMFA(codigo) {
        const resposta = await api.post('/auth/mfa/verificar', {
            codigo
        });

        if (!resposta.usuario) {
            throw new Error('Resposta de verificação MFA inválida.');
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

    async function logout({ silencioso = false } = {}) {
        try {
            await api.post('/auth/logout', {});

            if (!silencioso) {
                mostrarToast('Sessão encerrada com sucesso!', 'success');
            }
        } catch (error) {
            console.error('Erro ao encerrar sessão:', error);

            if (!silencioso) {
                mostrarToast(
                    error.message || 'Não foi possível encerrar a sessão.',
                    'error'
                );
            }
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
                verificarMFA,
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
