
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './VerificarMFA.css';

function VerificarMFA() {
    const { verificarMFA } = useAuth();
    const navigate = useNavigate();

    const [codigo, setCodigo] = useState('');
    const [usarRecuperacao, setUsarRecuperacao] = useState(false);
    const [erro, setErro] = useState('');
    const [carregando, setCarregando] = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();
        setErro('');

        const valor = codigo.trim();

        if (!valor) {
            setErro('Informe o código de autenticação.');
            return;
        }

        if (!usarRecuperacao && !/^\d{6}$/.test(valor)) {
            setErro('Digite os 6 dígitos do aplicativo autenticador.');
            return;
        }

        setCarregando(true);

        try {
            await verificarMFA(valor);
            navigate('/dashboard', { replace: true });
        } catch (error) {
            setErro(error.message || 'Não foi possível verificar o código.');
        } finally {
            setCarregando(false);
        }
    }

    function alternarMetodo() {
        setCodigo('');
        setErro('');
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

                <form onSubmit={handleSubmit} className="mfa-form">

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

                    {erro && (
                        <div className="mfa-error">
                            <i className="bi bi-exclamation-circle"></i>
                            {erro}
                        </div>
                    )}

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
