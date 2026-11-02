import { useCallback, useEffect, useMemo, useState } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import './Membros.css';

const cargoInfo = {
    admin: {
        label: 'Administrador',
        icon: 'bi-shield-check'
    },
    user: {
        label: 'Usuário',
        icon: 'bi-person'
    }
};

function Membros() {
    const { usuario } = useAuth();
    const isAdmin = usuario?.role?.toLowerCase() === 'admin';

    const [membros, setMembros] = useState([]);
    const [busca, setBusca] = useState('');
    const [filtroCargo, setFiltroCargo] = useState('todos');
    const [filtroStatus, setFiltroStatus] = useState('todos');

    const [carregando, setCarregando] = useState(true);
    const [atualizando, setAtualizando] = useState(false);
    const [erro, setErro] = useState('');

    const [modal, setModal] = useState(null);
    const [nome, setNome] = useState('');
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [mostrarSenha, setMostrarSenha] = useState(false);
    const [cargo, setCargo] = useState('user');
    const [salvando, setSalvando] = useState(false);

    const [membroStatus, setMembroStatus] = useState(null);
    const [alterandoStatus, setAlterandoStatus] = useState(false);

    const [membroSelecionado, setMembroSelecionado] = useState(null);
    const [toast, setToast] = useState(null);

    const mostrarToast = (mensagem, tipo = 'sucesso') => {
        setToast({ mensagem, tipo });
    };

    useEffect(() => {
        if (!toast) return;

        const timer = setTimeout(() => setToast(null), 3500);
        return () => clearTimeout(timer);
    }, [toast]);

    const carregarMembros = useCallback(async (silencioso = false) => {
        try {
            if (silencioso) {
                setAtualizando(true);
            } else {
                setCarregando(true);
            }

            setErro('');

            const resposta = await api.get('/usuarios');
            setMembros(resposta.usuarios || []);
        } catch (error) {
            setErro(error.message || 'Não foi possível carregar os membros.');
        } finally {
            setCarregando(false);
            setAtualizando(false);
        }
    }, []);

    useEffect(() => {
        carregarMembros();
    }, [carregarMembros]);

    const estatisticas = useMemo(() => ({
        total: membros.length,
        admins: membros.filter(membro => membro.role === 'admin').length,
        usuarios: membros.filter(membro => membro.role === 'user').length,
        ativos: membros.filter(membro => membro.status === 'ativo').length,
        inativos: membros.filter(membro => membro.status === 'inativo').length
    }), [membros]);

    const membrosFiltrados = useMemo(() => {
        return membros.filter(membro => {
            const termo = busca.toLowerCase();

            const correspondeBusca =
                membro.nome?.toLowerCase().includes(termo) ||
                membro.email?.toLowerCase().includes(termo);

            const correspondeCargo =
                filtroCargo === 'todos' || membro.role === filtroCargo;

            const correspondeStatus =
                filtroStatus === 'todos' || membro.status === filtroStatus;

            return correspondeBusca && correspondeCargo && correspondeStatus;
        });
    }, [membros, busca, filtroCargo, filtroStatus]);

    const obterIniciais = nomeCompleto => {
        return (nomeCompleto || 'Usuário')
            .trim()
            .split(/\s+/)
            .slice(0, 2)
            .map(parte => parte[0])
            .join('')
            .toUpperCase();
    };

    const formatarData = data => {
        if (!data) return '—';

        const dataFormatada = new Date(data);

        if (Number.isNaN(dataFormatada.getTime())) return '—';

        return dataFormatada.toLocaleDateString('pt-BR');
    };

    const abrirCriacao = () => {
        setNome('');
        setEmail('');
        setSenha('');
        setCargo('user');
        setMostrarSenha(false);
        setModal({ tipo: 'criar' });
    };

    const abrirEdicao = membro => {
        setNome(membro.nome || '');
        setEmail(membro.email || '');
        setCargo(membro.role || 'user');
        setModal({ tipo: 'editar', membro });
    };

    const fecharModal = () => {
        if (salvando) return;

        setModal(null);
        setNome('');
        setEmail('');
        setSenha('');
    };

    const salvarMembro = async event => {
        event.preventDefault();

        const nomeFormatado = nome.trim();
        const emailFormatado = email.trim();

        if (!nomeFormatado || !emailFormatado) {
            mostrarToast('Preencha todos os campos obrigatórios.', 'erro');
            return;
        }

        if (modal.tipo === 'criar' && senha.length < 6) {
            mostrarToast('A senha deve possuir pelo menos 6 caracteres.', 'erro');
            return;
        }

        try {
            setSalvando(true);

            if (modal.tipo === 'criar') {
                await api.post('/usuarios', {
                    nome: nomeFormatado,
                    email: emailFormatado,
                    senha,
                    role: cargo
                });

                mostrarToast('Membro cadastrado com sucesso!');
            } else {
                await api.put(`/usuarios/${modal.membro.id_usuario}`, {
                    nome: nomeFormatado,
                    email: emailFormatado,
                    role: cargo
                });

                mostrarToast('Membro atualizado com sucesso!');
            }

            setModal(null);
            setNome('');
            setEmail('');
            setSenha('');

            await carregarMembros(true);
        } catch (error) {
            mostrarToast(error.message || 'Não foi possível salvar o membro.', 'erro');
        } finally {
            setSalvando(false);
        }
    };

    const alterarStatus = async () => {
        if (!membroStatus) return;

        const novoStatus = membroStatus.status === 'ativo' ? 'inativo' : 'ativo';

        try {
            setAlterandoStatus(true);

            await api.patch(`/usuarios/${membroStatus.id_usuario}/status`, {
                status: novoStatus
            });

            mostrarToast(
                novoStatus === 'ativo'
                    ? 'Membro ativado com sucesso!'
                    : 'Membro desativado com sucesso!'
            );

            setMembroStatus(null);
            setMembroSelecionado(null);

            await carregarMembros(true);
        } catch (error) {
            mostrarToast(error.message || 'Não foi possível alterar o status.', 'erro');
        } finally {
            setAlterandoStatus(false);
        }
    };

    const abrirDetalhes = membro => {
        setMembroSelecionado(membro);
    };

    const fecharDetalhes = () => {
        setMembroSelecionado(null);
    };

    if (!isAdmin) {
        return (
            <section className="membros-page">
                <div className="membros-state membros-state-error">
                    <i className="bi bi-shield-lock"></i>
                    <h3>Acesso restrito</h3>
                    <p>Somente administradores podem gerenciar os membros da empresa.</p>
                </div>
            </section>
        );
    }

    return (
        <section className="membros-page">

            {/* Cabeçalho */}
            <header className="membros-header">
                <div>
                    <span className="membros-eyebrow">
                        <i className="bi bi-people"></i>
                        GERENCIAMENTO
                    </span>

                    <h1>Membros</h1>

                    <p>
                        Gerencie os usuários, cargos e acessos da sua empresa.
                    </p>
                </div>

                <div className="membros-header-actions">
                    <button
                        type="button"
                        className="membros-refresh-btn"
                        onClick={() => carregarMembros(true)}
                        disabled={atualizando || carregando}
                        title="Atualizar lista"
                        aria-label="Atualizar lista"
                    >
                        <i className={`bi bi-arrow-clockwise ${atualizando ? 'spinning' : ''}`}></i>
                    </button>

                    <button
                        type="button"
                        className="membros-primary-btn"
                        onClick={abrirCriacao}
                    >
                        <i className="bi bi-plus-lg"></i>
                        Novo membro
                    </button>
                </div>
            </header>

            {/* Indicadores */}
            <div className="membros-stats">
                <article className="membro-stat-card">
                    <div className="membro-stat-icon total">
                        <i className="bi bi-people"></i>
                    </div>
                    <div>
                        <span>Total de membros</span>
                        <strong>{estatisticas.total}</strong>
                    </div>
                </article>

                <article className="membro-stat-card">
                    <div className="membro-stat-icon admin">
                        <i className="bi bi-shield-check"></i>
                    </div>
                    <div>
                        <span>Administradores</span>
                        <strong>{estatisticas.admins}</strong>
                    </div>
                </article>

                <article className="membro-stat-card">
                    <div className="membro-stat-icon user">
                        <i className="bi bi-person"></i>
                    </div>
                    <div>
                        <span>Usuários</span>
                        <strong>{estatisticas.usuarios}</strong>
                    </div>
                </article>

                <article className="membro-stat-card">
                    <div className="membro-stat-icon ativo">
                        <i className="bi bi-person-check"></i>
                    </div>
                    <div>
                        <span>Contas ativas</span>
                        <strong>{estatisticas.ativos}</strong>
                    </div>
                </article>
            </div>

            {/* Lista */}
            <div className="membros-content">
                <div className="membros-toolbar">
                    <div className="membros-toolbar-title">
                        <h2>Equipe da empresa</h2>
                        <span>{membrosFiltrados.length} resultado(s)</span>
                    </div>

                    <div className="membros-filters">
                        <div className="membros-search">
                            <i className="bi bi-search"></i>
                            <input
                                type="search"
                                placeholder="Buscar por nome ou e-mail..."
                                value={busca}
                                onChange={event => setBusca(event.target.value)}
                            />

                            {busca && (
                                <button
                                    type="button"
                                    onClick={() => setBusca('')}
                                    aria-label="Limpar pesquisa"
                                >
                                    <i className="bi bi-x-lg"></i>
                                </button>
                            )}
                        </div>

                        <select
                            className="membros-filter-select"
                            value={filtroCargo}
                            onChange={event => setFiltroCargo(event.target.value)}
                            aria-label="Filtrar por cargo"
                        >
                            <option value="todos">Todos os cargos</option>
                            <option value="admin">Administradores</option>
                            <option value="user">Usuários</option>
                        </select>

                        <select
                            className="membros-filter-select"
                            value={filtroStatus}
                            onChange={event => setFiltroStatus(event.target.value)}
                            aria-label="Filtrar por status"
                        >
                            <option value="todos">Todos os status</option>
                            <option value="ativo">Ativos</option>
                            <option value="inativo">Inativos</option>
                        </select>
                    </div>
                </div>

                {carregando ? (
                    <div className="membros-state">
                        <span className="membros-loader"></span>
                        <p>Carregando membros...</p>
                    </div>
                ) : erro ? (
                    <div className="membros-state membros-state-error">
                        <i className="bi bi-exclamation-circle"></i>
                        <h3>Não foi possível carregar os membros</h3>
                        <p>{erro}</p>
                        <button type="button" onClick={() => carregarMembros()}>
                            Tentar novamente
                        </button>
                    </div>
                ) : membrosFiltrados.length === 0 ? (
                    <div className="membros-state">
                        <div className="membros-empty-icon">
                            <i className="bi bi-people"></i>
                        </div>

                        <h3>
                            {membros.length === 0
                                ? 'Nenhum membro cadastrado'
                                : 'Nenhum membro encontrado'}
                        </h3>

                        <p>
                            {membros.length === 0
                                ? 'Adicione pessoas para começar a organizar sua equipe.'
                                : 'Experimente alterar os filtros ou a pesquisa.'}
                        </p>

                        {membros.length === 0 && (
                            <button
                                type="button"
                                className="membros-primary-btn"
                                onClick={abrirCriacao}
                            >
                                <i className="bi bi-plus-lg"></i>
                                Cadastrar primeiro membro
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="membros-table-wrapper">
                        <table className="membros-table">
                            <thead>
                                <tr>
                                    <th>MEMBRO</th>
                                    <th>CARGO</th>
                                    <th>STATUS</th>
                                    <th>CADASTRO</th>
                                    <th className="membros-actions-heading">AÇÕES</th>
                                </tr>
                            </thead>

                            <tbody>
                                {membrosFiltrados.map((membro, index) => {
                                    const cargoAtual = cargoInfo[membro.role] || cargoInfo.user;
                                    const ativo = membro.status === 'ativo';

                                    return (
                                        <tr
                                            key={membro.id_usuario}
                                            style={{ '--item-index': index }}
                                        >
                                            <td>
                                                <button
                                                    type="button"
                                                    className="membro-identity"
                                                    onClick={() => abrirDetalhes(membro)}
                                                >
                                                    <div className="membro-avatar">
                                                        {membro.avatar_url ? (
                                                            <img
                                                                src={membro.avatar_url}
                                                                alt=""
                                                            />
                                                        ) : (
                                                            obterIniciais(membro.nome)
                                                        )}
                                                    </div>

                                                    <span className="membro-identity-info">
                                                        <strong>{membro.nome}</strong>
                                                        <small>{membro.email}</small>
                                                    </span>
                                                </button>
                                            </td>

                                            <td>
                                                <span className={`membro-role ${membro.role}`}>
                                                    <i className={`bi ${cargoAtual.icon}`}></i>
                                                    {cargoAtual.label}
                                                </span>
                                            </td>

                                            <td>
                                                <span className={`membro-status ${ativo ? 'ativo' : 'inativo'}`}>
                                                    <span className="membro-status-dot"></span>
                                                    {ativo ? 'Ativo' : 'Inativo'}
                                                </span>
                                            </td>

                                            <td>
                                                <span className="membro-date">
                                                    {formatarData(membro.created_at)}
                                                </span>
                                            </td>

                                            <td>
                                                <div className="membro-actions">
                                                    <button
                                                        type="button"
                                                        title="Ver detalhes"
                                                        aria-label={`Ver detalhes de ${membro.nome}`}
                                                        onClick={() => abrirDetalhes(membro)}
                                                    >
                                                        <i className="bi bi-eye"></i>
                                                    </button>

                                                    <button
                                                        type="button"
                                                        title="Editar membro"
                                                        aria-label={`Editar ${membro.nome}`}
                                                        onClick={() => abrirEdicao(membro)}
                                                    >
                                                        <i className="bi bi-pencil"></i>
                                                    </button>

                                                    <button
                                                        type="button"
                                                        className={ativo ? 'deactivate' : 'activate'}
                                                        title={ativo ? 'Desativar membro' : 'Ativar membro'}
                                                        aria-label={ativo ? `Desativar ${membro.nome}` : `Ativar ${membro.nome}`}
                                                        onClick={() => setMembroStatus(membro)}
                                                    >
                                                        <i className={`bi ${ativo ? 'bi-person-x' : 'bi-person-check'}`}></i>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal de cadastro e edição */}
            {modal && (
                <div
                    className="membros-modal-overlay"
                    onMouseDown={event => {
                        if (event.target === event.currentTarget) fecharModal();
                    }}
                >
                    <form className="membros-modal" onSubmit={salvarMembro}>
                        <div className="membros-modal-header">
                            <div>
                                <span className="membros-modal-eyebrow">
                                    GERENCIAMENTO DE EQUIPE
                                </span>

                                <h2>
                                    {modal.tipo === 'criar' ? 'Novo membro' : 'Editar membro'}
                                </h2>
                            </div>

                            <button
                                type="button"
                                className="membros-modal-close"
                                onClick={fecharModal}
                                disabled={salvando}
                                aria-label="Fechar modal"
                            >
                                <i className="bi bi-x-lg"></i>
                            </button>
                        </div>

                        <div className="membros-form-group">
                            <label htmlFor="membroNome">Nome completo</label>
                            <input
                                id="membroNome"
                                type="text"
                                placeholder="Ex.: João da Silva"
                                value={nome}
                                onChange={event => setNome(event.target.value)}
                                maxLength={120}
                                autoFocus
                                required
                            />
                        </div>

                        <div className="membros-form-group">
                            <label htmlFor="membroEmail">E-mail</label>
                            <input
                                id="membroEmail"
                                type="email"
                                placeholder="nome@empresa.com"
                                value={email}
                                onChange={event => setEmail(event.target.value)}
                                maxLength={150}
                                required
                            />
                        </div>

                        {modal.tipo === 'criar' && (
                            <div className="membros-form-group">
                                <label htmlFor="membroSenha">Senha inicial</label>

                                <div className="membros-password-field">
                                    <input
                                        id="membroSenha"
                                        type={mostrarSenha ? 'text' : 'password'}
                                        placeholder="Mínimo de 6 caracteres"
                                        value={senha}
                                        onChange={event => setSenha(event.target.value)}
                                        minLength={6}
                                        required
                                    />

                                    <button
                                        type="button"
                                        onClick={() => setMostrarSenha(value => !value)}
                                        aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
                                    >
                                        <i className={`bi ${mostrarSenha ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                                    </button>
                                </div>

                                <span>
                                    O membro poderá utilizar essa senha para acessar a plataforma.
                                </span>
                            </div>
                        )}

                        <div className="membros-form-group">
                            <label htmlFor="membroCargo">Cargo</label>

                            <select
                                id="membroCargo"
                                value={cargo}
                                onChange={event => setCargo(event.target.value)}
                            >
                                <option value="user">Usuário</option>
                                <option value="admin">Administrador</option>
                            </select>

                            <span>
                                Administradores podem gerenciar os membros e os dados da empresa.
                            </span>
                        </div>

                        <div className="membros-modal-actions">
                            <button
                                type="button"
                                className="membros-secondary-btn"
                                onClick={fecharModal}
                                disabled={salvando}
                            >
                                Cancelar
                            </button>

                            <button
                                type="submit"
                                className="membros-primary-btn"
                                disabled={salvando}
                            >
                                {salvando ? (
                                    <>
                                        <span className="membros-button-loader"></span>
                                        Salvando...
                                    </>
                                ) : (
                                    <>
                                        <i className="bi bi-check2"></i>
                                        {modal.tipo === 'criar' ? 'Cadastrar membro' : 'Salvar alterações'}
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Detalhes do membro */}
            {membroSelecionado && (
                <div
                    className="membros-modal-overlay"
                    onMouseDown={event => {
                        if (event.target === event.currentTarget) fecharDetalhes();
                    }}
                >
                    <div className="membros-modal membros-detail-modal">
                        <div className="membros-modal-header">
                            <div>
                                <span className="membros-modal-eyebrow">
                                    PERFIL DA EQUIPE
                                </span>
                                <h2>Detalhes do membro</h2>
                            </div>

                            <button
                                type="button"
                                className="membros-modal-close"
                                onClick={fecharDetalhes}
                                aria-label="Fechar detalhes"
                            >
                                <i className="bi bi-x-lg"></i>
                            </button>
                        </div>

                        <div className="membro-detail-profile">
                            <div className="membro-detail-avatar">
                                {membroSelecionado.avatar_url ? (
                                    <img src={membroSelecionado.avatar_url} alt="" />
                                ) : (
                                    obterIniciais(membroSelecionado.nome)
                                )}
                            </div>

                            <h3>{membroSelecionado.nome}</h3>
                            <span>{membroSelecionado.email}</span>
                        </div>

                        <div className="membro-detail-list">
                            <div>
                                <span>Cargo</span>
                                <strong>
                                    {cargoInfo[membroSelecionado.role]?.label || 'Usuário'}
                                </strong>
                            </div>

                            <div>
                                <span>Status da conta</span>
                                <strong className={membroSelecionado.status === 'ativo' ? 'detail-active' : 'detail-inactive'}>
                                    {membroSelecionado.status === 'ativo' ? 'Ativo' : 'Inativo'}
                                </strong>
                            </div>

                            <div>
                                <span>Data de cadastro</span>
                                <strong>{formatarData(membroSelecionado.created_at)}</strong>
                            </div>

                            <div>
                                <span>Identificação</span>
                                <strong>#{String(membroSelecionado.id_usuario).padStart(3, '0')}</strong>
                            </div>
                        </div>

                        <div className="membros-modal-actions">
                            <button
                                type="button"
                                className="membros-secondary-btn"
                                onClick={fecharDetalhes}
                            >
                                Fechar
                            </button>

                            <button
                                type="button"
                                className="membros-primary-btn"
                                onClick={() => {
                                    const membro = membroSelecionado;
                                    fecharDetalhes();
                                    abrirEdicao(membro);
                                }}
                            >
                                <i className="bi bi-pencil"></i>
                                Editar membro
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Confirmação de ativação/desativação */}
            {membroStatus && (
                <div className="membros-modal-overlay">
                    <div className="membros-modal membros-confirm-modal">
                        <div className={`membros-confirm-icon ${membroStatus.status === 'ativo' ? 'warning' : 'success'}`}>
                            <i className={`bi ${membroStatus.status === 'ativo' ? 'bi-person-x' : 'bi-person-check'}`}></i>
                        </div>

                        <h2>
                            {membroStatus.status === 'ativo' ? 'Desativar membro?' : 'Ativar membro?'}
                        </h2>

                        <p>
                            {membroStatus.status === 'ativo'
                                ? <>O membro <strong>{membroStatus.nome}</strong> perderá o acesso à plataforma.</>
                                : <>O membro <strong>{membroStatus.nome}</strong> poderá voltar a acessar a plataforma.</>}
                        </p>

                        <div className="membros-modal-actions">
                            <button
                                type="button"
                                className="membros-secondary-btn"
                                onClick={() => setMembroStatus(null)}
                                disabled={alterandoStatus}
                            >
                                Cancelar
                            </button>

                            <button
                                type="button"
                                className="membros-primary-btn"
                                onClick={alterarStatus}
                                disabled={alterandoStatus}
                            >
                                {alterandoStatus
                                    ? 'Aguarde...'
                                    : membroStatus.status === 'ativo'
                                        ? 'Sim, desativar'
                                        : 'Sim, ativar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Toast */}
            {toast && (
                <div className={`membros-toast ${toast.tipo}`}>
                    <i className={`bi ${toast.tipo === 'sucesso'
                        ? 'bi-check-circle-fill'
                        : 'bi-exclamation-circle-fill'}`}
                    ></i>

                    <span>{toast.mensagem}</span>

                    <button
                        type="button"
                        onClick={() => setToast(null)}
                        aria-label="Fechar aviso"
                    >
                        <i className="bi bi-x"></i>
                    </button>
                </div>
            )}
        </section>
    );
}

export default Membros;