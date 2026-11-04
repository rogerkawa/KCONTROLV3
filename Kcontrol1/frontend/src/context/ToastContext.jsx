
import {
    createContext,
    useContext,
    useState,
    useCallback,
    useRef,
    useEffect
} from 'react';

import Toast from '../components/toast/Toast';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);
    const timers = useRef({});

    const removerToast = useCallback((id) => {
        clearTimeout(timers.current[id]);

        delete timers.current[id];

        setToasts(prev => prev.filter(toast => toast.id !== id));
    }, []);

    const mostrarToast = useCallback((mensagem, tipo = 'success', duracao = 3500) => {
        const id = Date.now() + Math.random();

        const novoToast = {
            id,
            mensagem,
            tipo
        };

        setToasts(prev => [...prev, novoToast]);

        timers.current[id] = setTimeout(() => {
            removerToast(id);
        }, duracao);

        return id;
    }, [removerToast]);

    useEffect(() => {
        return () => {
            Object.values(timers.current).forEach(clearTimeout);
        };
    }, []);

    return (
        <ToastContext.Provider value={{ mostrarToast }}>
            {children}

            <div className="toast-container">
                {toasts.map(toast => (
                    <Toast
                        key={toast.id}
                        mensagem={toast.mensagem}
                        tipo={toast.tipo}
                        onClose={() => removerToast(toast.id)}
                    />
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);

    if (!context) {
        throw new Error('useToast precisa estar dentro de ToastProvider');
    }

    return context;
}
