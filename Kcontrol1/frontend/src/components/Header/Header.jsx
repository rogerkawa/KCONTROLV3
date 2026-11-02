
import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Header.css';

const titulos = {
    '/dashboard': 'Dashboard',
    '/registros': 'Registros',
    '/salas': 'Salas',
    '/setores': 'Setores',
    '/membros': 'Membros',
    '/auditoria': 'Auditoria',
    '/perfil': 'Meu perfil',
    '/configuracoes': 'Configurações',
    '/empresas': 'Empresas',
    '/solicitacoes': 'Solicitações',
};

function Header({ onToggleSidebar, sidebarCollapsed }) {
    const { usuario } = useAuth();
    const location = useLocation();

    const [menuAberto, setMenuAberto] = useState(false);
    const [tema, setTema] = useState(
        () => localStorage.getItem('theme') || 'dark'
    );

    const menuRef = useRef(null);

    const titulo = titulos[location.pathname] || 'KControl';
    const primeiroNome = usuario?.nome?.split(' ')[0] || 'Usuário';

    const cargo = usuario?.role?.toLowerCase() || 'user';

    const cargoFormatado = {
        superadmin: 'Superadministrador',
        admin: 'Administrador',
        user: 'Usuário',
    }[cargo] || 'Usuário';

    const iniciais = (usuario?.nome || 'U')
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((parte) => parte[0])
        .join('')
        .toUpperCase();

    // Aceita os campos de avatar mais comuns.
    const avatar = usuario?.avatar_url || usuario?.foto_url || usuario?.avatar;

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', tema);
        localStorage.setItem('theme', tema);
    }, [tema]);

    useEffect(() => {
        setMenuAberto(false);
    }, [location.pathname]);

    useEffect(() => {
        function fecharMenu(event) {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setMenuAberto(false);
            }
        }

        function fecharComEsc(event) {
            if (event.key === 'Escape') {
                setMenuAberto(false);
            }
        }

        document.addEventListener('mousedown', fecharMenu);
        document.addEventListener('keydown', fecharComEsc);

        return () => {
            document.removeEventListener('mousedown', fecharMenu);
            document.removeEventListener('keydown', fecharComEsc);
        };
    }, []);

    function alternarTema() {
        setTema((temaAtual) => temaAtual === 'dark' ? 'light' : 'dark');
    }

    useEffect(() => {
    function sincronizarTema(event) {
        setTema(event.detail.theme);
    }

    window.addEventListener('themechange', sincronizarTema);

    return () => {
        window.removeEventListener('themechange', sincronizarTema);
    };
}, []);

    return (
        <header className="main-header">

            <div className="header-left">
                <button
                    type="button"
                    className="header-sidebar-toggle"
                    onClick={onToggleSidebar}
                    aria-label={sidebarCollapsed ? 'Expandir menu' : 'Recolher menu'}
                    title={sidebarCollapsed ? 'Expandir menu' : 'Recolher menu'}
                >
                    <i className="bi bi-layout-sidebar"></i>
                </button>

                <div className="header-page-info">
                    <span className="header-greeting">
                        KCONTROL / AMBIENTE DE TRABALHO
                    </span>

                    <h1>{titulo}</h1>
                </div>
            </div>

            <div className="header-actions">
                <span className="header-welcome">
                    Olá, {primeiroNome}
                </span>

                <div className="header-user-container" ref={menuRef}>

                    <button
                        type="button"
                        className={`header-user ${menuAberto ? 'active' : ''}`}
                        onClick={() => setMenuAberto((aberto) => !aberto)}
                        aria-expanded={menuAberto}
                        aria-haspopup="true"
                    >
                        <span className="header-user-avatar">
                            {avatar ? (
                                <img src={avatar} alt="" />
                            ) : (
                                iniciais
                            )}
                        </span>

                        <span className="header-user-name">
                            {primeiroNome}
                        </span>

                        <i className={`bi bi-chevron-down header-user-chevron ${menuAberto ? 'rotated' : ''}`}></i>
                    </button>

                    {menuAberto && (
                        <div className="user-dropdown">

                            <div className="user-dropdown-profile">
                                <div className="user-dropdown-avatar">
                                    {avatar ? (
                                        <img src={avatar} alt="" />
                                    ) : (
                                        iniciais
                                    )}
                                </div>

                                <div className="user-dropdown-info">
                                    <strong>{usuario?.nome || 'Usuário'}</strong>
                                    <span>{cargoFormatado}</span>
                                    {usuario?.email && (
                                        <small>{usuario.email}</small>
                                    )}
                                </div>
                            </div>

                            <div className="user-dropdown-divider"></div>

                            <nav className="user-dropdown-options">

                                <Link to="/perfil" className="user-dropdown-item">
                                    <i className="bi bi-person"></i>
                                    <span>Meu perfil</span>
                                </Link>

                                <button
                                    type="button"
                                    className="user-dropdown-item"
                                    onClick={alternarTema}
                                >
                                    <i className={`bi ${tema === 'dark' ? 'bi-sun' : 'bi-moon'}`}></i>
                                    <span>Aparência</span>
                                    <small>{tema === 'dark' ? 'Escuro' : 'Claro'}</small>
                                </button>

                                <Link to="/configuracoes" className="user-dropdown-item">
                                    <i className="bi bi-gear"></i>
                                    <span>Configurações</span>
                                </Link>

                            </nav>

                        </div>
                    )}
                </div>
            </div>

        </header>
    );
}

export default Header;
