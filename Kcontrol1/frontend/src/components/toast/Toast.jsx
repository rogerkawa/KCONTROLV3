
import {
    CheckCircle2,
    XCircle,
    AlertTriangle,
    Info,
    X
} from 'lucide-react';

import './Toast.css';

const configuracoes = {
    success: {
        titulo: 'Sucesso',
        icone: CheckCircle2
    },

    error: {
        titulo: 'Erro',
        icone: XCircle
    },

    warning: {
        titulo: 'Atenção',
        icone: AlertTriangle
    },

    info: {
        titulo: 'Informação',
        icone: Info
    }
};

export default function Toast({ mensagem, tipo, onClose }) {
    const config = configuracoes[tipo] || configuracoes.info;
    const Icone = config.icone;

    return (
        <div className={`toast toast-${tipo}`} role="status">
            <div className="toast-icon">
                <Icone size={21} />
            </div>

            <div className="toast-content">
                <strong>{config.titulo}</strong>
                <span>{mensagem}</span>
            </div>

            <button
                className="toast-close"
                onClick={onClose}
                aria-label="Fechar notificação"
            >
                <X size={17} />
            </button>
        </div>
    );
}
