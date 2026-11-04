
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Configuracoes.css';

function Configuracoes() {
    const { usuario, logout } = useAuth();
    const navigate = useNavigate();

    const [tema, setTema] = useState(
        () => localStorage.getItem('theme') || 'dark'
    );

    const [animacoes, setAnimacoes] = useState(
        () => localStorage.getItem('animations') !== 'false'
    );

    const [confirmarSaida, setConfirmarSaida] = useState(false);

    function alterarTema(novoTema) {
        setTema(novoTema);

        localStorage.setItem('theme', novoTema);
        document.documentElement.setAttribute('data-theme', novoTema);

        window.dispatchEvent(
            new CustomEvent('themechange', {
                detail: { theme: novoTema }
            })
        );
    }

    function alterarAnimacoes(ativo) {
        setAnimacoes(ativo);

        localStorage.setItem('animations', String(ativo));

        document.documentElement.setAttribute(
            'data-motion',
            ativo ? 'normal' : 'reduced'
        );
    }

    function sairDaConta() {
        logout();
        navigate('/login', { replace: true });
    }

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', tema);
        document.documentElement.setAttribute(
            'data-motion',
            animacoes ? 'normal' : 'reduced'
        );
    }, []);

    const cargo = {
        superadmin: 'Superadministrador',
        admin: 'Administrador',
        user: 'Usuário'
    }[usuario?.role?.toLowerCase()] || 'Usuário';

    return (
        <section className="config-page">
            <header className="config-header">
                <div>
                    <span className="config-eyebrow">PERSONALIZAÇÃO</span>
                    <h1>Configurações</h1>
                    <p>Personalize sua experiência no KControl.</p>
                </div>

                <div className="config-header-icon">
                    <i className="bi bi-sliders2"></i>
                </div>
            </header>

            <div className="config-content">

                {/* APARÊNCIA */}
                <section className="config-section">
                    <div className="config-section-heading">
                        <div className="config-section-icon">
                            <i className="bi bi-palette"></i>
                        </div>

                        <div>
                            <h2>Aparência</h2>
                            <p>Escolha como o KControl será exibido.</p>
                        </div>
                    </div>

                    <div className="config-option">
                        <div className="config-option-info">
                            <strong>Tema da interface</strong>
                            <span>Selecione a aparência que deseja utilizar.</span>
                        </div>

                        <div className="config-theme-options">
                            <button
                                type="button"
                                className={`config-theme-option ${tema === 'light' ? 'selected' : ''}`}
                                onClick={() => alterarTema('light')}
                                aria-pressed={tema === 'light'}
                            >
                                <div className="config-theme-preview light">
                                    <span></span>
                                    <span></span>
                                    <span></span>
                                </div>

                                <span>
                                    <i className="bi bi-sun"></i>
                                    Claro
                                </span>
                            </button>

                            <button
                                type="button"
                                className={`config-theme-option ${tema === 'dark' ? 'selected' : ''}`}
                                onClick={() => alterarTema('dark')}
                                aria-pressed={tema === 'dark'}
                            >
                                <div className="config-theme-preview dark">
                                    <span></span>
                                    <span></span>
                                    <span></span>
                                </div>

                                <span>
                                    <i className="bi bi-moon-stars"></i>
                                    Escuro
                                </span>
                            </button>
                        </div>
                    </div>

                    <div className="config-divider"></div>

                    <div className="config-option">
                        <div className="config-option-info">
                            <strong>Preferência atual</strong>
                            <span>O tema escolhido será aplicado em todo o sistema.</span>
                        </div>

                        <span className="config-current-theme">
                            <i className={`bi ${tema === 'dark' ? 'bi-moon-fill' : 'bi-sun-fill'}`}></i>
                            {tema === 'dark' ? 'Modo escuro' : 'Modo claro'}
                        </span>
                    </div>
                </section>

                {/* INTERFACE */}
                <section className="config-section">
                    <div className="config-section-heading">
                        <div className="config-section-icon">
                            <i className="bi bi-display"></i>
                        </div>

                        <div>
                            <h2>Interface</h2>
                            <p>Personalize os comportamentos visuais do sistema.</p>
                        </div>
                    </div>

                    <div className="config-option">
                        <div className="config-option-info">
                            <strong>Animações da interface</strong>
                            <span>
                                Controla transições, efeitos de entrada e movimentos.
                            </span>
                        </div>

                        <button
                            type="button"
                            className={`config-switch ${animacoes ? 'active' : ''}`}
                            onClick={() => alterarAnimacoes(!animacoes)}
                            role="switch"
                            aria-checked={animacoes}
                            aria-label="Ativar animações da interface"
                        >
                            <span></span>
                        </button>
                    </div>
                </section>

                {/* SESSÃO */}
                <section className="config-section">
                    <div className="config-section-heading">
                        <div className="config-section-icon">
                            <i className="bi bi-shield-lock"></i>
                        </div>

                        <div>
                            <h2>Sessão e segurança</h2>
                            <p>Informações sobre sua conta e acesso.</p>
                        </div>
                    </div>

                    <div className="config-session">
                        <div className="config-session-avatar">
                            {usuario?.avatar_url ? (
                                <img src={usuario.avatar_url} alt="" />
                            ) : (
                                <span>
                                    {(usuario?.nome || 'U')
                                        .trim()
                                        .split(/\s+/)
                                        .slice(0, 2)
                                        .map(parte => parte[0])
                                        .join('')
                                        .toUpperCase()}
                                </span>
                            )}
                        </div>

                        <div className="config-session-info">
                            <strong>{usuario?.nome || 'Usuário'}</strong>
                            <span>{usuario?.email || 'E-mail não informado'}</span>
                            <small>{cargo}</small>
                        </div>

                        <span className="config-session-status">
                            <span></span>
                            Conectado
                        </span>
                    </div>

                    <div className="config-divider"></div>

                    <div className="config-option">
                        <div className="config-option-info">
                            <strong>Alterar senha</strong>
                            <span>Gerencie sua senha e proteja sua conta.</span>
                        </div>

                        <button
                            type="button"
                            className="config-action-button"
                            onClick={() => navigate('/perfil')}
                        >
                            Meu perfil
                            <i className="bi bi-arrow-up-right"></i>
                        </button>
                    </div>

                    <div className="config-option config-logout-option">
                        <div className="config-option-info">
                            <strong>Sair da conta</strong>
                            <span>Encerre sua sessão neste dispositivo.</span>
                        </div>

                        <button
                            type="button"
                            className="config-logout-button"
                            onClick={() => setConfirmarSaida(true)}
                        >
                            <i className="bi bi-box-arrow-right"></i>
                            Sair
                        </button>
                    </div>
                </section>

                {/* SOBRE */}
                <section className="config-section config-about">
                    <div className="config-section-heading">
                        <div className="config-section-icon">
                            <i className="bi bi-info-circle"></i>
                        </div>

                        <div>
                            <h2>Sobre o KControl</h2>
                            <p>Informações da plataforma.</p>
                        </div>
                    </div>

                    <div className="config-about-content">
                        <div className="config-about-brand">
                            <div className="config-about-logo">
                                <img src="./images/logokcontrol.png" alt="Logo KControl" />
                            </div>

                            <div>
                                <strong>KControl</strong>
                                <span>Gestão inteligente de acessos.</span>
                            </div>
                        </div>

                        <span className="config-version">VERSÃO 3.0</span>
                    </div>

                    <p className="config-about-description">
                        Uma plataforma para gerenciamento de salas, usuários
                        e registros de acesso, com organização e segurança
                        para sua empresa.
                    </p>
                </section>
            </div>

            {/* CONFIRMAÇÃO DE SAÍDA */}
            {confirmarSaida && (
                <div
                    className="config-modal-overlay"
                    onMouseDown={event => {
                        if (event.target === event.currentTarget) {
                            setConfirmarSaida(false);
                        }
                    }}
                >
                    <div
                        className="config-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="config-modal-title"
                    >
                        <div className="config-modal-icon">
                            <i className="bi bi-box-arrow-right"></i>
                        </div>

                        <h3 id="config-modal-title">Deseja sair da sua conta?</h3>

                        <p>
                            Sua sessão será encerrada e você precisará entrar
                            novamente para acessar o KControl.
                        </p>

                        <div className="config-modal-actions">
                            <button
                                type="button"
                                className="config-action-button"
                                onClick={() => setConfirmarSaida(false)}
                            >
                                Cancelar
                            </button>

                            <button
                                type="button"
                                className="config-logout-button"
                                onClick={sairDaConta}
                            >
                                <i className="bi bi-box-arrow-right"></i>
                                Sair da conta
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}

export default Configuracoes;
