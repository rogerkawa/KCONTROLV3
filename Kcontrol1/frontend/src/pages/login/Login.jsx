import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./Login.css";

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();

    setErro("");
    setCarregando(true);

    try {
      const usuarioLogado = await login(email, senha);

      if (usuarioLogado.role === "user") {
        navigate("/registros", { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
    } catch (error) {
      setErro(error.message || 'Não foi possível entrar na plataforma.');
    } finally {
      setCarregando(false);
    }
  }

  return (
    <main className="login-page">
      <div className="login-background">
        <div className="background-glow"></div>
        <div className="background-grid"></div>
      </div>

      <section className="login-container">
        <div className="login-brand">
          <div className="brand-symbol">
            <i className="bi bi-grid-1x2-fill"></i>
          </div>

          <span>
            KControl<span className="brand-version">.</span>
          </span>
        </div>

        <div className="login-content">
          <div className="login-heading">
            <span className="login-eyebrow">ACESSO À PLATAFORMA</span>

            <h1>
              Bem-vindo
              <br />
              <span>de volta.</span>
            </h1>

            <p>
              Entre com suas credenciais para acessar o ambiente da sua empresa.
            </p>
          </div>

          <form className="login-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">E-mail</label>

              <div className="input-wrapper">
                <i className="bi bi-envelope"></i>

                <input
                  type="email"
                  id="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <div className="password-label">
                <label htmlFor="senha">Senha</label>
              </div>

              <div className="input-wrapper">
                <i className="bi bi-lock"></i>

                <input
                  type={mostrarSenha ? "text" : "password"}
                  id="senha"
                  placeholder="Digite sua senha"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  autoComplete="current-password"
                  required
                />

                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setMostrarSenha(!mostrarSenha)}
                  aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
                >
                  <i
                    className={`bi ${mostrarSenha ? "bi-eye-slash" : "bi-eye"}`}
                  ></i>
                </button>
              </div>
            </div>

            {erro && (
              <div className="login-error" role="alert">
                <i className="bi bi-exclamation-circle"></i>
                <span>{erro}</span>
              </div>
            )}

            <button
              type="submit"
              className="login-button"
              disabled={carregando}
            >
              {carregando ? (
                <>
                  <span className="button-spinner"></span>
                  Entrando...
                </>
              ) : (
                <>
                  Entrar na plataforma
                  <i className="bi bi-arrow-up-right"></i>
                </>
              )}
            </button>
          </form>

          <div className="login-footer">
            <span>Não possui acesso?</span>
            <Link to="/solicitar-acesso">Solicitar acesso</Link>
          </div>
        </div>

        <div className="login-bottom">
          <span>© {new Date().getFullYear()} KControl</span>
          <span>Gestão inteligente de ambientes</span>
        </div>
      </section>

      <aside className="login-aside">
        <div className="aside-top">
          <span className="aside-indicator"></span>
          <span>GESTÃO • ORGANIZAÇÃO • EFICIÊNCIA</span>
        </div>

        <div className="aside-content">
          <span className="aside-number">01 / 03</span>

          <h2>
            Tudo sob
            <br />
            <span>controle.</span>
          </h2>

          <p>
            Uma maneira mais inteligente de gerenciar acessos, ambientes e
            operações da sua empresa.
          </p>

          <div className="aside-decoration">
            <div className="decoration-line"></div>
            <div className="decoration-circle">
              <i className="bi bi-arrow-up-right"></i>
            </div>
          </div>
        </div>

        <div className="aside-bottom">
          <span>PLATAFORMA KCONTROL V3</span>
          <span className="aside-status">
            <i className="bi bi-circle-fill"></i>
            SISTEMA ONLINE
          </span>
        </div>
      </aside>
    </main>
  );
}

export default Login;
