
import { useEffect, useRef, useState } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import './Perfil.css';

function Perfil() {
    const { usuario, atualizarUsuario } = useAuth();
    const { mostrarToast } = useToast();

    const [perfil, setPerfil] = useState(null);
    const [carregando, setCarregando] = useState(true);
    const [erroCarregamento, setErroCarregamento] = useState('');
    const [salvando, setSalvando] = useState(false);
    const [enviandoFoto, setEnviandoFoto] = useState(false);
    const [removendoFoto, setRemovendoFoto] = useState(false);
    const [alterandoSenha, setAlterandoSenha] = useState(false);

    const [nome, setNome] = useState('');
    const [email, setEmail] = useState('');

    const [senhaAtual, setSenhaAtual] = useState('');
    const [novaSenha, setNovaSenha] = useState('');
    const [confirmarSenha, setConfirmarSenha] = useState('');

    const [mostrarSenhaAtual, setMostrarSenhaAtual] = useState(false);
    const [mostrarNovaSenha, setMostrarNovaSenha] = useState(false);

    const [preview, setPreview] = useState(null);
    const inputAvatarRef = useRef(null);
    const invalidToastRef = useRef(false);

    function notificar(tipo, texto) {
        const tipos = {
            sucesso: 'success',
            erro: 'error',
            aviso: 'warning',
            informacao: 'info'
        };

        mostrarToast(texto, tipos[tipo] || 'info');
    }

    async function carregarPerfil() {
        try {
            setCarregando(true);
            setErroCarregamento('');

            const resposta = await api.get('/perfil');

            setPerfil(resposta.usuario);
            setNome(resposta.usuario.nome || '');
            setEmail(resposta.usuario.email || '');
        } catch (error) {
            setErroCarregamento(error.message || 'Não foi possível carregar seu perfil.');
        } finally {
            setCarregando(false);
        }
    }

    useEffect(() => {
        carregarPerfil();
    }, []);

    useEffect(() => {
        return () => {
            if (preview) {
                URL.revokeObjectURL(preview);
            }

        };
    }, [preview]);

    function obterIniciais(valor) {
        return (valor || 'Usuário')
            .trim()
            .split(/\s+/)
            .slice(0, 2)
            .map(parte => parte[0])
            .join('')
            .toUpperCase();
    }

    function formatarData(data) {
        if (!data) return 'Não informado';

        const dataFormatada = new Date(data);

        if (Number.isNaN(dataFormatada.getTime())) {
            return 'Não informado';
        }

        return dataFormatada.toLocaleDateString('pt-BR');
    }

    function avisarFormularioInvalido(event) {
        event.preventDefault();

        if (invalidToastRef.current) return;

        invalidToastRef.current = true;
        const mensagem = event.target.validity.valueMissing
            ? 'Preencha todos os campos obrigatórios.'
            : 'Verifique os dados informados.';

        mostrarToast(mensagem, 'warning');
        window.setTimeout(() => {
            invalidToastRef.current = false;
        }, 1000);
    }

    const avatar = preview || perfil?.avatar_url || usuario?.avatar_url;

    const cargo = {
        superadmin: 'Superadministrador',
        admin: 'Administrador',
        user: 'Usuário'
    }[perfil?.role || usuario?.role] || 'Usuário';

    async function salvarPerfil(event) {
        event.preventDefault();

        if (nome.trim().length < 3) {
            notificar('aviso', 'O nome deve ter pelo menos 3 caracteres.');
            return;
        }

        try {
            setSalvando(true);

            const resposta = await api.put('/perfil', {
                nome: nome.trim(),
                email: email.trim()
            });

            setPerfil(resposta.usuario);
            atualizarUsuario(resposta.usuario);

            notificar('sucesso', resposta.mensagem || 'Perfil atualizado com sucesso!');
        } catch (error) {
            notificar('erro', error.message);
        } finally {
            setSalvando(false);
        }
    }

    function selecionarAvatar(event) {
        const arquivo = event.target.files?.[0];

        if (!arquivo) return;

        if (!arquivo.type.startsWith('image/')) {
            notificar('aviso', 'Selecione um arquivo de imagem válido.');
            event.target.value = '';
            return;
        }

        if (arquivo.size > 5 * 1024 * 1024) {
            notificar('aviso', 'A imagem deve ter no máximo 5 MB.');
            event.target.value = '';
            return;
        }

        if (preview) {
            URL.revokeObjectURL(preview);
        }

        setPreview(URL.createObjectURL(arquivo));
        enviarAvatar(arquivo);
    }

    async function enviarAvatar(arquivo) {
        try {
            setEnviandoFoto(true);

            const formulario = new FormData();
            formulario.append('avatar', arquivo);

            const resposta = await api.put(
                '/perfil/avatar',
                formulario
            );

            const novosDados = {
                avatar_url: resposta.avatar_url
            };

            setPerfil(atual => ({
                ...atual,
                ...novosDados
            }));

            atualizarUsuario(novosDados);

            setPreview(null);

            notificar('sucesso', resposta.mensagem || 'Foto de perfil atualizada com sucesso!');
        } catch (error) {
            setPreview(null);
            notificar('erro', error.message);
        } finally {
            setEnviandoFoto(false);

            if (inputAvatarRef.current) {
                inputAvatarRef.current.value = '';
            }
        }
    }

    async function removerAvatar() {
        try {
            setRemovendoFoto(true);

            const resposta = await api.delete('/perfil/avatar');

            setPerfil(atual => ({
                ...atual,
                avatar_url: null
            }));

            atualizarUsuario({
                avatar_url: null
            });

            setPreview(null);

            notificar('sucesso', resposta.mensagem || 'Foto de perfil removida com sucesso!');
        } catch (error) {
            notificar('erro', error.message);
        } finally {
            setRemovendoFoto(false);
        }
    }

    async function salvarSenha(event) {
        event.preventDefault();

        if (novaSenha.length < 8) {
            notificar('aviso', 'A nova senha precisa ter pelo menos 8 caracteres.');
            return;
        }

        if (novaSenha !== confirmarSenha) {
            notificar('aviso', 'As senhas não correspondem.');
            return;
        }

        try {
            setAlterandoSenha(true);

            const resposta = await api.patch('/perfil/senha', {
                senhaAtual,
                novaSenha,
                confirmarSenha
            });

            setSenhaAtual('');
            setNovaSenha('');
            setConfirmarSenha('');

            notificar('sucesso', resposta.mensagem || 'Senha atualizada com sucesso!');
        } catch (error) {
            notificar('erro', error.message);
        } finally {
            setAlterandoSenha(false);
        }
    }

    if (carregando) {
        return (
            <div className="perfil-loading">
                <span className="perfil-spinner"></span>
                <p>Carregando seu perfil...</p>
            </div>
        );
    }

    if (!perfil) {
        return (
            <div className="perfil-error">
                <i className="bi bi-exclamation-circle"></i>
                <h3>Não foi possível carregar seu perfil</h3>
                <p>{erroCarregamento}</p>
                <button onClick={carregarPerfil}>Tentar novamente</button>
            </div>
        );
    }

    return (
        <section className="perfil-page">
            <header className="perfil-header">
                <div>
                    <span className="perfil-eyebrow">CONTA</span>
                    <h1>Meu perfil</h1>
                    <p>Gerencie suas informações pessoais e segurança.</p>
                </div>
            </header>

            <div className="perfil-layout">
                <aside className="perfil-sidebar-card">
                    <div className="perfil-avatar-area">
                        <div className="perfil-avatar">
                            {avatar ? (
                                <img src={avatar} alt={`Foto de ${perfil.nome}`} />
                            ) : (
                                <span>{obterIniciais(perfil.nome)}</span>
                            )}

                            {enviandoFoto && (
                                <div className="perfil-avatar-loading">
                                    <span className="perfil-spinner"></span>
                                </div>
                            )}
                        </div>

                        <h2>{perfil.nome}</h2>
                        <p>{perfil.email}</p>

                        <span className="perfil-role">
                            <i className="bi bi-shield-check"></i>
                            {cargo}
                        </span>
                    </div>

                    <div className="perfil-avatar-actions">
                        <button
                            type="button"
                            className="perfil-button-primary"
                            onClick={() => inputAvatarRef.current?.click()}
                            disabled={enviandoFoto}
                        >
                            <i className="bi bi-camera"></i>
                            {enviandoFoto ? 'Enviando...' : 'Alterar foto'}
                        </button>

                        {perfil.avatar_url && (
                            <button
                                type="button"
                                className="perfil-button-ghost"
                                onClick={removerAvatar}
                                disabled={removendoFoto || enviandoFoto}
                            >
                                <i className="bi bi-trash3"></i>
                                {removendoFoto ? 'Removendo...' : 'Remover foto'}
                            </button>
                        )}

                        <input
                            ref={inputAvatarRef}
                            type="file"
                            accept="image/*"
                            hidden
                            onChange={selecionarAvatar}
                        />

                        <small>PNG, JPG ou WEBP. Máximo de 5 MB.</small>
                    </div>

                    <div className="perfil-account-info">
                        <div>
                            <span>Status da conta</span>
                            <strong className="perfil-status">
                                <span></span>
                                {perfil.status || 'Ativo'}
                            </strong>
                        </div>

                        <div>
                            <span>Membro desde</span>
                            <strong>{formatarData(perfil.created_at)}</strong>
                        </div>

                        <div>
                            <span>ID da conta</span>
                            <strong>#{perfil.id_usuario}</strong>
                        </div>
                    </div>
                </aside>

                <div className="perfil-content">
                    <form
                        className="perfil-card"
                        onSubmit={salvarPerfil}
                        onInvalidCapture={avisarFormularioInvalido}
                    >
                        <div className="perfil-card-header">
                            <div className="perfil-card-icon">
                                <i className="bi bi-person"></i>
                            </div>

                            <div>
                                <h3>Informações pessoais</h3>
                                <p>Atualize seus dados de identificação.</p>
                            </div>
                        </div>

                        <div className="perfil-form-grid">
                            <label className="perfil-field">
                                <span>Nome completo</span>
                                <input
                                    type="text"
                                    value={nome}
                                    onChange={event => setNome(event.target.value)}
                                    placeholder="Seu nome"
                                    minLength={3}
                                    maxLength={100}
                                    required
                                />
                            </label>

                            <label className="perfil-field">
                                <span>E-mail</span>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={event => setEmail(event.target.value)}
                                    placeholder="seu@email.com"
                                    maxLength={255}
                                    required
                                />
                            </label>
                        </div>

                        <div className="perfil-card-footer">
                            <span>As alterações serão aplicadas à sua conta.</span>

                            <button
                                type="submit"
                                className="perfil-button-primary"
                                disabled={salvando}
                            >
                                {salvando ? (
                                    <>
                                        <span className="perfil-button-spinner"></span>
                                        Salvando...
                                    </>
                                ) : (
                                    <>
                                        <i className="bi bi-check2"></i>
                                        Salvar alterações
                                    </>
                                )}
                            </button>
                        </div>
                    </form>

                    <form
                        className="perfil-card"
                        onSubmit={salvarSenha}
                        onInvalidCapture={avisarFormularioInvalido}
                    >
                        <div className="perfil-card-header">
                            <div className="perfil-card-icon">
                                <i className="bi bi-lock"></i>
                            </div>

                            <div>
                                <h3>Segurança</h3>
                                <p>Altere a senha utilizada para acessar sua conta.</p>
                            </div>
                        </div>

                        <div className="perfil-password-fields">
                            <label className="perfil-field">
                                <span>Senha atual</span>

                                <div className="perfil-password-input">
                                    <input
                                        type={mostrarSenhaAtual ? 'text' : 'password'}
                                        value={senhaAtual}
                                        onChange={event => setSenhaAtual(event.target.value)}
                                        placeholder="Digite sua senha atual"
                                        autoComplete="current-password"
                                        required
                                    />

                                    <button
                                        type="button"
                                        onClick={() => setMostrarSenhaAtual(value => !value)}
                                        aria-label="Mostrar ou ocultar senha atual"
                                    >
                                        <i className={`bi ${
                                            mostrarSenhaAtual ? 'bi-eye-slash' : 'bi-eye'
                                        }`}></i>
                                    </button>
                                </div>
                            </label>

                            <div className="perfil-form-grid">
                                <label className="perfil-field">
                                    <span>Nova senha</span>

                                    <div className="perfil-password-input">
                                        <input
                                            type={mostrarNovaSenha ? 'text' : 'password'}
                                            value={novaSenha}
                                            onChange={event => setNovaSenha(event.target.value)}
                                            placeholder="Mínimo de 8 caracteres"
                                            autoComplete="new-password"
                                            minLength={8}
                                            required
                                        />

                                        <button
                                            type="button"
                                            onClick={() => setMostrarNovaSenha(value => !value)}
                                            aria-label="Mostrar ou ocultar nova senha"
                                        >
                                            <i className={`bi ${
                                                mostrarNovaSenha ? 'bi-eye-slash' : 'bi-eye'
                                            }`}></i>
                                        </button>
                                    </div>
                                </label>

                                <label className="perfil-field">
                                    <span>Confirmar nova senha</span>
                                    <input
                                        type="password"
                                        value={confirmarSenha}
                                        onChange={event => setConfirmarSenha(event.target.value)}
                                        placeholder="Repita a nova senha"
                                        autoComplete="new-password"
                                        minLength={8}
                                        required
                                    />
                                </label>
                            </div>
                        </div>

                        <div className="perfil-card-footer">
                            <span>Utilize uma senha forte e exclusiva.</span>

                            <button
                                type="submit"
                                className="perfil-button-primary"
                                disabled={alterandoSenha}
                            >
                                {alterandoSenha ? (
                                    <>
                                        <span className="perfil-button-spinner"></span>
                                        Atualizando...
                                    </>
                                ) : (
                                    <>
                                        <i className="bi bi-shield-lock"></i>
                                        Atualizar senha
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </section>
    );
}

export default Perfil;
