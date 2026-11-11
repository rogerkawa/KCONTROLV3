import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useTemaAtual } from '../../hooks/tema';
import "./Sidebar.css";

const menus = {
  superadmin: [
    { label: "Empresas", icon: "bi-buildings", path: "/empresas" },
    { label: "Solicitações", icon: "bi-inbox", path: "/solicitacoes" },
    { label: "Auditoria", icon: "bi-journal-text", path: "/auditoria" },
    { label: "Configurações", icon: "bi-gear", path: "/configuracoes" },
  ],

  admin: [
    { label: "Dashboard", icon: "bi-grid-1x2", path: "/dashboard" },
    { label: "Registros", icon: "bi-arrow-left-right", path: "/registros" },
    { label: "Reservas", icon: "bi-calendar2-check", path: "/reservas" },
    { label: "Salas", icon: "bi-door-open", path: "/salas" },
    { label: "Setores", icon: "bi-diagram-3", path: "/setores" },
    { label: "Membros", icon: "bi-people", path: "/membros" },
    { label: "Auditoria", icon: "bi-journal-text", path: "/auditoria" },
    { label: "Meu perfil", icon: "bi-person", path: "/perfil" },
    { label: "Configurações", icon: "bi-gear", path: "/configuracoes" },
  ],

  user: [
    { label: "Registros", icon: "bi-arrow-left-right", path: "/registros" },
    { label: "Reservas", icon: "bi-calendar2-check", path: "/reservas" },
    { label: "Meu perfil", icon: "bi-person", path: "/perfil" },
    { label: "Configurações", icon: "bi-gear", path: "/configuracoes" },
  ],
};

function Sidebar({ collapsed = false }) {
  const { usuario } = useAuth();

  const cargo = usuario?.role?.toLowerCase() || "user";
  const itensMenu = menus[cargo] || menus.user;

  const nome = usuario?.nome || "Usuário";

  const iniciais = nome
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0])
    .join("")
    .toUpperCase();

  const avatar = usuario?.avatar_url || usuario?.foto_url || usuario?.avatar;

  const cargoFormatado =
    {
      superadmin: "SuperAdministrador",
      admin: "Administrador",
      user: "Usuário",
    }[cargo] || "Usuário";


  const tema = useTemaAtual();
  return (
    <aside className={`sidebar ${collapsed ? "sidebar-collapsed" : ""}`}>
      {/* MARCA */}
      <div className="sidebar-brand">
        <div className="sidebar-logo">
          <img
            src={tema === 'dark'
              ? '/images/logo-branca.png'
              : '/images/logo-preta.png'
            }
            alt="Logo KControl"
          />
        </div>

        <div className="sidebar-brand-text">
          <strong>KControl</strong>
          <span>V3.0</span>
        </div>
      </div>

      {/* NAVEGAÇÃO */}
      <nav className="sidebar-navigation">
        <span className="sidebar-section-title">MENU PRINCIPAL</span>

        <div className="sidebar-links">
          {itensMenu.map((item, index) => (
            <NavLink
              key={item.path}
              to={item.path}
              title={collapsed ? item.label : undefined}
              style={{ "--item-index": index }}
              className={({ isActive }) =>
                [
                  "sidebar-link",
                  isActive && "active",
                  cargo !== "user" &&
                  ["/perfil", "/configuracoes"].includes(item.path) &&
                  "sidebar-mobile-hidden",
                ]
                  .filter(Boolean)
                  .join(" ")
              }
            >
              <i className={`bi ${item.icon}`}></i>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>

      {/* PERFIL */}
      <div className="sidebar-profile">
        <div className="sidebar-avatar">
          {avatar ? <img src={avatar} alt="" /> : iniciais}
        </div>

        <div className="sidebar-profile-info">
          <strong title={nome}>{nome}</strong>
          <span>{cargoFormatado}</span>
        </div>

        <i className="bi bi-three-dots sidebar-profile-more"></i>
      </div>
    </aside>
  );
}

export default Sidebar;
