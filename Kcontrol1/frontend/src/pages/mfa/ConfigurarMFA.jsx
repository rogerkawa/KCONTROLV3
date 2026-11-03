
import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import './ConfigurarMFA.css';
import './VerificarMFA.css';

function ConfigurarMFA() {
    const navigate = useNavigate();

    const [qrCode, setQrCode] = useState('');
    const [segredo, setSegredo] = useState('');
    const [codigo, setCodigo] = useState('');
    const [codigosRecuperacao, setCodigosRecuperacao] = useState([]);

    const [carregando, setCarregando] = useState(true);
    const [ativando, setAtivando] = useState(false);
    const [erro, setErro] = useState('');
    const [etapa, setEtapa] = useState('configuracao');
    const [copiado, setCopiado] = useState(false);

    useEffect(() => {
        let ativo = true;

        async function carregarConfiguracao() {
            try {
                const resposta = await api.post('/auth/mfa/setup', {});

                if (!ativo) return;

                setQrCode(resposta.qrCode);
                setSegredo(resposta.manualSecret);
            } catch (error) {
                if (ativo) {
                    setErro(error.message || 'Não foi possível iniciar a configuração do MFA.');
                }
            } finally {
                if (ativo) setCarregando(false);
            }
        }

        carregarConfiguracao();

        return () => {
            ativo = false;
        };
    }, []);

    async function handleSubmit(e) {
        e.preventDefault();
        setErro('');

        if (!/^\d{6}$/.test(codigo)) {
            setErro('Digite um código válido de 6 dígitos.');
            return;
        }

        setAtivando(true);

        try {
            const resposta = await api.post('/auth/mfa/ativar', {
                codigo
            });

            setCodigosRecuperacao(
                resposta.recoveryCodes || resposta.codigosRecuperacao || []
            );

            setEtapa('recuperacao');
        } catch (error) {
            setErro(error.message || 'Não foi possível ativar a autenticação.');
        } finally {
            setAtivando(false);
        }
    }

    async function copiarCodigos() {
        try {
            await navigator.clipboard.writeText(
                codigosRecuperacao.join('\n')
            );

            setCopiado(true);
        } catch {
            setErro('Não foi possível copiar os códigos.');
        }
    }

    return (
        <main className="mfa-container">
            <section className="mfa-card mfa-setup-card">

                <div className="mfa-brand">
                    <span className="mfa-brand-icon">
                        <i className="bi bi-shield-lock" />
                    </span>

                    <span>
                        KCONTROL<span className="mfa-brand-version"> V3</span>
                    </span>
                </div>

                {etapa === 'configuracao' ? (
                    <>
                        <div className="mfa-icon">
                            <i className="bi bi-shield-check" />
                        </div>

                        <div className="mfa-heading">
                            <span className="mfa-eyebrow">
                                CONFIGURAÇÃO DE SEGURANÇA
                            </span>

                            <h1>Proteja sua conta</h1>

                            <p>
                                Configure a autenticação em duas etapas para
                                proteger o acesso de superadministrador.
                            </p>
                        </div>

                        {carregando ? (
                            <div className="mfa-loading">
                                <span className="mfa-spinner" />
                                <p>Preparando sua configuração...</p>
                            </div>
                        ) : erro && !qrCode ? (
                            <div className="mfa-error">
                                <i className="bi bi-exclamation-circle" />
                                {erro}
                            </div>
                        ) : (
                            <>
                                <div className="mfa-instructions">
                                    <span className="mfa-step">01</span>

                                    <div>
                                        <strong>Abra seu aplicativo autenticador</strong>
                                        <p>
                                            Utilize Google Authenticator,
                                            Microsoft Authenticator ou outro
                                            aplicativo compatível.
                                        </p>
                                    </div>
                                </div>

                                <div className="mfa-instructions">
                                    <span className="mfa-step">02</span>

                                    <div>
                                        <strong>Escaneie o QR Code</strong>
                                        <p>
                                            Adicione uma nova conta e escaneie
                                            a imagem abaixo.
                                        </p>
                                    </div>
                                </div>

                                {qrCode && (
                                    <div className="mfa-qr-wrapper">
                                        <img
                                            src={qrCode}
                                            alt="QR Code para configurar o MFA"
                                            className="mfa-qr-image"
                                        />
                                    </div>
                                )}

                                <div className="mfa-manual">
                                    <span>Não consegue escanear?</span>

                                    <p>
                                        Insira manualmente esta chave no
                                        aplicativo autenticador:
                                    </p>

                                    <div className="mfa-secret">
                                        <code>{segredo}</code>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                navigator.clipboard.writeText(segredo)
                                            }
                                            title="Copiar chave"
                                        >
                                            <i className="bi bi-copy" />
                                        </button>
                                    </div>
                                </div>

                                <form onSubmit={handleSubmit} className="mfa-form">
                                    <label htmlFor="codigoMFA">
                                        Código do aplicativo
                                    </label>

                                    <input
                                        id="codigoMFA"
                                        type="text"
                                        inputMode="numeric"
                                        autoComplete="one-time-code"
                                        placeholder="000000"
                                        maxLength={6}
                                        value={codigo}
                                        onChange={e =>
                                            setCodigo(
                                                e.target.value
                                                    .replace(/\D/g, '')
                                                    .slice(0, 6)
                                            )
                                        }
                                        required
                                    />

                                    {erro && (
                                        <div className="mfa-error">
                                            <i className="bi bi-exclamation-circle" />
                                            {erro}
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        className="mfa-submit"
                                        disabled={ativando || carregando}
                                    >
                                        {ativando ? (
                                            <>
                                                <span className="mfa-spinner" />
                                                Ativando...
                                            </>
                                        ) : (
                                            <>
                                                Ativar autenticação
                                                <i className="bi bi-arrow-right" />
                                            </>
                                        )}
                                    </button>
                                </form>
                            </>
                        )}
                    </>
                ) : (
                    <>
                        <div className="mfa-icon mfa-success-icon">
                            <i className="bi bi-check-circle" />
                        </div>

                        <div className="mfa-heading">
                            <span className="mfa-eyebrow">
                                MFA ATIVADO
                            </span>

                            <h1>Salve seus códigos</h1>

                            <p>
                                Guarde estes códigos em um local seguro.
                                Eles permitem recuperar o acesso caso
                                você perca seu aplicativo autenticador.
                            </p>
                        </div>

                        <div className="mfa-recovery-list">
                            {codigosRecuperacao.map((item, index) => (
                                <code key={index}>{item}</code>
                            ))}
                        </div>

                        <button
                            type="button"
                            className="mfa-submit"
                            onClick={copiarCodigos}
                        >
                            <i className={`bi ${copiado ? 'bi-check2' : 'bi-copy'}`} />
                            {copiado ? 'Códigos copiados' : 'Copiar códigos'}
                        </button>

                        <button
                            type="button"
                            className="mfa-continue"
                            onClick={() => navigate('/mfa/verificar', { replace: true })}
                        >
                            Continuar para verificação
                            <i className="bi bi-arrow-right" />
                        </button>
                    </>
                )}

                <div className="mfa-footer">
                    <i className="bi bi-lock-fill" />
                    Sua conexão está protegida por criptografia.
                </div>

                <Link to="/login" className="mfa-back">
                    <i className="bi bi-arrow-left" />
                    Voltar ao login
                </Link>

            </section>
        </main>
    );
}

export default ConfigurarMFA;
