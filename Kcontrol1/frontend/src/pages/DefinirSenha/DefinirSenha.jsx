import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

import api from "../../services/api";
import "./DefinirSenha.css";

const DefinirSenha = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get("token");

  const [carregando, setCarregando] = useState(true);
  const [conviteValido, setConviteValido] = useState(false);
  const [administrador, setAdministrador] = useState(null);
  const [empresa, setEmpresa] = useState(null);

  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");

  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mostrarConfirmacao, setMostrarConfirmacao] = useState(false);

  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const { logout } = useAuth();

  // Validar convite ao abrir a página
  useEffect(() => {
    async function validarConvite() {
      if (!token) {
        setErro("Nenhum convite foi informado.");
        setCarregando(false);
        return;
      }

      try {
        const resposta = await api.post("/convites/validar", {
          token,
        });

        setAdministrador(resposta.administrador);
        setEmpresa(resposta.empresa);
        setConviteValido(true);
      } catch (error) {
        setErro(error.message || "Não foi possível validar seu convite.");
      } finally {
        setCarregando(false);
      }
    }

    validarConvite();
  }, [token]);

  // Ativar conta
  async function handleSubmit(event) {
    event.preventDefault();

    setErro("");

    if (senha.length < 12) {
      setErro("Sua senha deve possuir pelo menos 12 caracteres.");
      return;
    }

    if (senha !== confirmarSenha) {
      setErro("As senhas não coincidem.");
      return;
    }

    try {
      setSalvando(true);

      await api.post("/convites/ativar", {
        token,
        senha,
        confirmarSenha,
      });

      setSucesso(true);
      setConviteValido(false);
    } catch (error) {
      setErro(error.message || "Não foi possível ativar sua conta.");
    } finally {
      setSalvando(false);
    }
  }

  // Carregamento
  if (carregando) {
    return (
      <main className="definir-container">
        <div className="definir-card definir-status">
          <div className="definir-spinner"></div>
          <h2>Verificando convite</h2>
          <p>Aguarde enquanto validamos seu acesso.</p>
        </div>
      </main>
    );
  }

  // Sucesso
  if (sucesso) {
    return (
      <main className="definir-container">
        <div className="definir-card definir-status">
          <div className="definir-status-icon sucesso">
            <i className="bi bi-check-lg"></i>
          </div>

          <span className="definir-eyebrow">CONTA ATIVADA</span>

          <h1>Tudo pronto!</h1>

          <p>
            Sua senha foi cadastrada e sua conta está ativa. Agora você já pode
            acessar o KControl.
          </p>

          <button
            className="definir-button"
            onClick={() => {
              logout();
              navigate("/login", { replace: true });
            }}
          >
            Ir para o login
            <i className="bi bi-arrow-up-right"></i>
          </button>
        </div>
      </main>
    );
  }

  // Convite inválido
  if (!conviteValido) {
    return (
      <main className="definir-container">
        <div className="definir-card definir-status">
          <div className="definir-status-icon erro">
            <i className="bi bi-shield-exclamation"></i>
          </div>

          <span className="definir-eyebrow">ACESSO INDISPONÍVEL</span>

          <h1>Convite inválido</h1>

          <p>{erro}</p>

          <button className="definir-button" onClick={() => navigate("/login")}>
            Ir para o login
            <i className="bi bi-arrow-up-right"></i>
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="definir-container">
      <section className="definir-card">
        <header className="definir-header">
          <div className="definir-logo">
            <span>K</span>
            <strong>CONTROL</strong>
          </div>

          <span className="definir-eyebrow">ATIVAÇÃO DE CONTA</span>

          <h1>Defina sua senha.</h1>

          <p>
            Sua empresa foi aprovada! Crie uma senha para começar a utilizar o
            KControl.
          </p>
        </header>

        <div className="definir-usuario">
          <div className="definir-avatar">
            {administrador?.nome?.charAt(0).toUpperCase()}
          </div>

          <div>
            <strong>{administrador?.nome}</strong>
            <span>{administrador?.email}</span>
            <small>{empresa?.nome}</small>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="definir-field">
            <label htmlFor="senha">Nova senha</label>

            <div className="definir-input-wrapper">
              <i className="bi bi-lock"></i>

              <input
                id="senha"
                type={mostrarSenha ? "text" : "password"}
                placeholder="Digite sua senha"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                minLength={12}
                autoComplete="new-password"
                required
              />

              <button
                type="button"
                className="definir-toggle"
                onClick={() => setMostrarSenha(!mostrarSenha)}
                aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
              >
                <i
                  className={`bi ${mostrarSenha ? "bi-eye-slash" : "bi-eye"}`}
                ></i>
              </button>
            </div>

            <small>Mínimo de 12 caracteres.</small>
          </div>

          <div className="definir-field">
            <label htmlFor="confirmarSenha">Confirmar senha</label>

            <div className="definir-input-wrapper">
              <i className="bi bi-lock"></i>

              <input
                id="confirmarSenha"
                type={mostrarConfirmacao ? "text" : "password"}
                placeholder="Digite novamente sua senha"
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
                autoComplete="new-password"
                required
              />

              <button
                type="button"
                className="definir-toggle"
                onClick={() => setMostrarConfirmacao(!mostrarConfirmacao)}
                aria-label={
                  mostrarConfirmacao ? "Ocultar senha" : "Mostrar senha"
                }
              >
                <i
                  className={`bi ${mostrarConfirmacao ? "bi-eye-slash" : "bi-eye"}`}
                ></i>
              </button>
            </div>
          </div>

          {erro && (
            <div className="definir-alerta">
              <i className="bi bi-exclamation-circle"></i>
              <span>{erro}</span>
            </div>
          )}

          <button type="submit" className="definir-button" disabled={salvando}>
            {salvando ? (
              <>
                <span className="definir-button-spinner"></span>
                Ativando conta...
              </>
            ) : (
              <>
                Ativar minha conta
                <i className="bi bi-arrow-right"></i>
              </>
            )}
          </button>
        </form>

        <footer className="definir-footer">
          <i className="bi bi-shield-check"></i>
          <span>
            Seu acesso é protegido e suas informações são criptografadas.
          </span>
        </footer>
      </section>

      <span className="definir-copyright">
        © {new Date().getFullYear()} KControl. Todos os direitos reservados.
      </span>
    </main>
  );
};

export default DefinirSenha;
