
import { useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import './VerificarMFA.css';

function VerificarMFA() {
    const { verificarMFA } = useAuth();
    const { mostrarToast } = useToast();
    const navigate = useNavigate();

    const [codigo, setCodigo] = useState('');
    const [usarRecuperacao, setUsarRecuperacao] = useState(false);
    const [carregando, setCarregando] = useState(false);
    const invalidToastRef = useRef(false);

    async function handleSubmit(e) {
        e.preventDefault();

        const valor = codigo.trim();

        if (!valor) {
            mostrarToast('Informe o código de autenticação.', 'warning');
            return;
        }

        if (!usarRecuperacao && !/^\d{6}$/.test(valor)) {
            mostrarToast('Digite os 6 dígitos do aplicativo autenticador.', 'warning');
            return;
        }

        setCarregando(true);

        try {
            await verificarMFA(valor);
            mostrarToast('Autenticação confirmada com sucesso!', 'success');
            navigate('/dashboard', { replace: true });
        } catch (error) {
            mostrarToast(error.message || 'Não foi possível verificar o código.', 'error');
        } finally {
            setCarregando(false);
        }
    }

    function avisarFormularioInvalido(event) {
        event.preventDefault();

        if (invalidToastRef.current) return;

        invalidToastRef.current = true;
        mostrarToast('Informe o código de autenticação.', 'warning');
        window.setTimeout(() => {
            invalidToastRef.current = false;
        }, 1000);
    }

    function alternarMetodo() {
        setCodigo('');
        setUsarRecuperacao(valor => !valor);
    }

    return (
        <main className="mfa-container">
            <section className="mfa-card">

                <div className="mfa-brand">
                    <span className="mfa-brand-icon">
                        <i className="bi bi-shield-lock"></i>
                    </span>

                    <span>KCONTROL<span className="mfa-brand-version"> V3</span></span>
                </div>

                <div className="mfa-icon">
                    <i className={`bi ${usarRecuperacao ? 'bi-key' : 'bi-shield-check'}`}></i>
                </div>

                <div className="mfa-heading">
                    <span className="mfa-eyebrow">SEGURANÇA DA CONTA</span>

                    <h1>
                        {usarRecuperacao
                            ? 'Código de recuperação'
                            : 'Verificação em duas etapas'}
                    </h1>

                    <p>
                        {usarRecuperacao
                            ? 'Digite um dos códigos de recuperação que você salvou durante a configuração do MFA.'
                            : 'Abra seu aplicativo autenticador e informe o código de 6 dígitos para continuar.'}
                    </p>
                </div>

                <form
                    onSubmit={handleSubmit}
                    onInvalidCapture={avisarFormularioInvalido}
                    className="mfa-form"
                >

                    <label htmlFor="mfaCodigo">
                        {usarRecuperacao
                            ? 'Código de recuperação'
                            : 'Código de autenticação'}
                    </label>

                    <input
                        id="mfaCodigo"
                        type="text"
                        value={codigo}
                        onChange={e => {
                            const valor = usarRecuperacao
                                ? e.target.value.toUpperCase()
                                : e.target.value.replace(/\D/g, '').slice(0, 6);

                            setCodigo(valor);
                        }}
                        placeholder={usarRecuperacao ? 'XXXX-XXXX-XXXX-XXXX' : '000000'}
                        maxLength={usarRecuperacao ? 19 : 6}
                        autoComplete="one-time-code"
                        autoFocus
                        required
                    />

                    <button
                        type="submit"
                        className="mfa-submit"
                        disabled={carregando}
                    >
                        {carregando ? (
                            <>
                                <span className="mfa-spinner"></span>
                                Verificando...
                            </>
                        ) : (
                            <>
                                Confirmar identidade
                                <i className="bi bi-arrow-right"></i>
                            </>
                        )}
                    </button>
                </form>

                <button
                    type="button"
                    className="mfa-alternate"
                    onClick={alternarMetodo}
                >
                    <i className={`bi ${usarRecuperacao ? 'bi-phone' : 'bi-key'}`}></i>

                    {usarRecuperacao
                        ? 'Usar aplicativo autenticador'
                        : 'Usar código de recuperação'}
                </button>

                <div className="mfa-footer">
                    <i className="bi bi-lock-fill"></i>
                    Sua conexão está protegida por criptografia.
                </div>

                <Link to="/login" className="mfa-back">
                    <i className="bi bi-arrow-left"></i>
                    Voltar ao login
                </Link>

            </section>
        </main>
    );
}

export default VerificarMFA;
