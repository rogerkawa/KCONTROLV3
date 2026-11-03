import { useCallback, useEffect, useMemo, useState } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import './Salas.css';

const statusInfo = {
    disponivel: {
        label: 'Disponível',
        icon: 'bi-check-circle',
        className: 'disponivel'
    },
    retirada: {
        label: 'Em uso',
        icon: 'bi-person-workspace',
        className: 'retirada'
    },
    manutencao: {
        label: 'Em manutenção',
        icon: 'bi-tools',
        className: 'manutencao'
    },
    inativa: {
        label: 'Inativa',
        icon: 'bi-slash-circle',
        className: 'inativa'
    }
};

function Salas() {
    const { usuario } = useAuth();
    const isAdmin = usuario?.role?.toLowerCase() === 'admin';

    const [salas, setSalas] = useState([]);
    const [busca, setBusca] = useState('');
    const [filtroStatus, setFiltroStatus] = useState('todos');

    const [carregando, setCarregando] = useState(true);
    const [atualizando, setAtualizando] = useState(false);
    const [erro, setErro] = useState('');

    const [modal, setModal] = useState(null);
    const [nome, setNome] = useState('');
    const [statusSelecionado, setStatusSelecionado] = useState('disponivel');
    const [salvando, setSalvando] = useState(false);

    const [salaExcluir, setSalaExcluir] = useState(null);
    const [excluindo, setExcluindo] = useState(false);

    const [toast, setToast] = useState(null);

    const mostrarToast = (mensagem, tipo = 'sucesso') => {
        setToast({ mensagem, tipo });
    };

    useEffect(() => {
        if (!toast) return;

        const timer = setTimeout(() => {
            setToast(null);
        }, 3500);

        return () => clearTimeout(timer);
    }, [toast]);

    const carregarSalas = useCallback(async (silencioso = false) => {
        try {
            if (silencioso) {
                setAtualizando(true);
            } else {
                setCarregando(true);
            }

            setErro('');

            const resposta = await api.get('/salas');
            setSalas(resposta.salas || []);
        } catch (error) {
            setErro(error.message || 'Não foi possível carregar as salas.');
        } finally {
            setCarregando(false);
            setAtualizando(false);
        }
    }, []);

    useEffect(() => {
        carregarSalas();
    }, [carregarSalas]);

    const estatisticas = useMemo(() => ({
        total: salas.length,
        disponiveis: salas.filter(sala => sala.status === 'disponivel').length,
        emUso: salas.filter(sala => sala.status === 'retirada').length,
        manutencao: salas.filter(sala =>
            ['manutencao', 'inativa'].includes(sala.status)
        ).length
    }), [salas]);

    const salasFiltradas = useMemo(() => {
        return salas.filter(sala => {
            const correspondeBusca = sala.nome
                ?.toLowerCase()
                .includes(busca.toLowerCase());

            const correspondeStatus =
                filtroStatus === 'todos' || sala.status === filtroStatus;

            return correspondeBusca && correspondeStatus;
        });
    }, [salas, busca, filtroStatus]);

    const abrirModalCriacao = () => {
        setNome('');
        setModal({ tipo: 'criar' });
    };

    const abrirModalEdicao = sala => {
        setNome(sala.nome || '');
        setModal({ tipo: 'editar', sala });
    };

    const abrirModalStatus = sala => {
        setStatusSelecionado(
            ['disponivel', 'manutencao', 'inativa'].includes(sala.status)
                ? sala.status
                : 'disponivel'
        );

        setModal({ tipo: 'status', sala });
    };

    const fecharModal = () => {
        if (salvando) return;

        setModal(null);
        setNome('');
    };

    
const salvarSala = async event => {
    event.preventDefault();

    try {
        setSalvando(true);

        // CADASTRAR SALA
        if (modal.tipo === 'criar') {
            const nomeFormatado = nome.trim();

            if (!nomeFormatado) {
                mostrarToast('Informe o nome da sala.', 'erro');
                return;
            }

            await api.post('/salas', {
                nome: nomeFormatado
            });

            mostrarToast('Sala cadastrada com sucesso!');
        }

        // EDITAR NOME DA SALA
        if (modal.tipo === 'editar') {
            const nomeFormatado = nome.trim();

            if (!nomeFormatado) {
                mostrarToast('Informe o nome da sala.', 'erro');
                return;
            }

            await api.put(`/salas/${modal.sala.id_sala}`, {
                nome: nomeFormatado
            });

            mostrarToast('Sala atualizada com sucesso!');
        }

        // ALTERAR STATUS DA SALA
        if (modal.tipo === 'status') {
            await api.patch(`/salas/${modal.sala.id_sala}/status`, {
                status: statusSelecionado
            });

            mostrarToast('Status atualizado com sucesso!');
        }

        setModal(null);
        setNome('');

        await carregarSalas(true);

    } catch (error) {
        mostrarToast(
            error.message || 'Não foi possível salvar a sala.',
            'erro'
        );
    } finally {
        setSalvando(false);
    }
};


    const excluirSala = async () => {
        if (!salaExcluir) return;

        try {
            setExcluindo(true);

            await api.delete(`/salas/${salaExcluir.id_sala}`);

            mostrarToast('Sala excluída com sucesso!');
            setSalaExcluir(null);

            await carregarSalas(true);
        } catch (error) {
            mostrarToast(error.message || 'Não foi possível excluir a sala.', 'erro');
        } finally {
            setExcluindo(false);
        }
    };

    const formatarStatus = status => {
        return statusInfo[status] || {
            label: status || 'Não informado',
            icon: 'bi-question-circle',
            className: 'inativa'
        };
    };

    return (
        <section className="salas-page">

            {/* Cabeçalho */}
            <header className="salas-header">
                <div>
                    <span className="salas-eyebrow">
                        <i className="bi bi-grid"></i>
                        GERENCIAMENTO
                    </span>

                    <h1>Salas</h1>

                    <p>
                        Gerencie os ambientes e acompanhe a disponibilidade
                        das salas da sua empresa.
                    </p>
                </div>

                <div className="salas-header-actions">
                    <button
                        type="button"
                        className="salas-refresh-btn"
                        onClick={() => carregarSalas(true)}
                        disabled={atualizando || carregando}
                        title="Atualizar lista"
                    >
                        <i className={`bi bi-arrow-clockwise ${atualizando ? 'spinning' : ''}`}></i>
                    </button>

                    {isAdmin && (
                        <button
                            type="button"
                            className="salas-primary-btn"
                            onClick={abrirModalCriacao}
                        >
                            <i className="bi bi-plus-lg"></i>
                            Nova sala
                        </button>
                    )}
                </div>
            </header>

            {/* Indicadores */}
            <div className="salas-stats">
                <article className="sala-stat-card">
                    <div className="sala-stat-icon total">
                        <i className="bi bi-door-open"></i>
                    </div>
                    <div>
                        <span>Total de salas</span>
                        <strong>{estatisticas.total}</strong>
                    </div>
                </article>

                <article className="sala-stat-card">
                    <div className="sala-stat-icon disponivel">
                        <i className="bi bi-check-circle"></i>
                    </div>
                    <div>
                        <span>Disponíveis</span>
                        <strong>{estatisticas.disponiveis}</strong>
                    </div>
                </article>

                <article className="sala-stat-card">
                    <div className="sala-stat-icon retirada">
                        <i className="bi bi-person-workspace"></i>
                    </div>
                    <div>
                        <span>Em uso</span>
                        <strong>{estatisticas.emUso}</strong>
                    </div>
                </article>

                <article className="sala-stat-card">
                    <div className="sala-stat-icon manutencao">
                        <i className="bi bi-tools"></i>
                    </div>
                    <div>
                        <span>Manutenção / inativas</span>
                        <strong>{estatisticas.manutencao}</strong>
                    </div>
                </article>
            </div>

            {/* Conteúdo */}
            <div className="salas-content">

                <div className="salas-toolbar">
                    <div className="salas-toolbar-title">
                        <h2>Lista de salas</h2>
                        <span>{salasFiltradas.length} resultado(s)</span>
                    </div>

                    <div className="salas-filters">
                        <div className="salas-search">
                            <i className="bi bi-search"></i>
                            <input
                                type="search"
                                placeholder="Pesquisar sala..."
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

                        <div className="salas-select-wrapper">
                            <i className="bi bi-funnel"></i>
                            <select
                                value={filtroStatus}
                                onChange={event => setFiltroStatus(event.target.value)}
                                aria-label="Filtrar por status"
                            >
                                <option value="todos">Todos os status</option>
                                <option value="disponivel">Disponíveis</option>
                                <option value="retirada">Em uso</option>
                                <option value="manutencao">Em manutenção</option>
                                <option value="inativa">Inativas</option>
                            </select>
                        </div>
                    </div>
                </div>

                {carregando ? (
                    <div className="salas-state">
                        <span className="salas-loader"></span>
                        <p>Carregando salas...</p>
                    </div>
                ) : erro ? (
                    <div className="salas-state salas-state-error">
                        <i className="bi bi-exclamation-circle"></i>
                        <h3>Não foi possível carregar as salas</h3>
                        <p>{erro}</p>
                        <button onClick={() => carregarSalas()}>
                            Tentar novamente
                        </button>
                    </div>
                ) : salasFiltradas.length === 0 ? (
                    <div className="salas-state">
                        <div className="salas-empty-icon">
                            <i className="bi bi-door-closed"></i>
                        </div>

                        <h3>
                            {salas.length === 0
                                ? 'Nenhuma sala cadastrada'
                                : 'Nenhuma sala encontrada'}
                        </h3>

                        <p>
                            {salas.length === 0
                                ? 'Cadastre a primeira sala para começar a organizar seus ambientes.'
                                : 'Tente alterar a pesquisa ou o filtro selecionado.'}
                        </p>

                        {isAdmin && salas.length === 0 && (
                            <button
                                type="button"
                                className="salas-primary-btn"
                                onClick={abrirModalCriacao}
                            >
                                <i className="bi bi-plus-lg"></i>
                                Cadastrar primeira sala
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="salas-table-wrapper">
                        <table className="salas-table">
                            <thead>
                                <tr>
                                    <th>SALA</th>
                                    <th>IDENTIFICAÇÃO</th>
                                    <th>STATUS</th>
                                    {isAdmin && <th className="salas-actions-heading">AÇÕES</th>}
                                </tr>
                            </thead>

                            <tbody>
                                {salasFiltradas.map(sala => {
                                    const status = formatarStatus(sala.status);

                                    return (
                                        <tr key={sala.id_sala}>
                                            <td>
                                                <div className="sala-name-cell">
                                                    <div className="sala-row-icon">
                                                        <i className="bi bi-door-closed"></i>
                                                    </div>
                                                    <strong>{sala.nome}</strong>
                                                </div>
                                            </td>

                                            <td>
                                                <span className="sala-id">
                                                    #{String(sala.id_sala).padStart(3, '0')}
                                                </span>
                                            </td>

                                            <td>
                                                <span className={`sala-status ${status.className}`}>
                                                    <i className={`bi ${status.icon}`}></i>
                                                    {status.label}
                                                </span>
                                            </td>

                                            {isAdmin && (
                                                <td>
                                                    <div className="sala-actions">
                                                        <button
                                                            type="button"
                                                            title="Editar nome"
                                                            aria-label={`Editar ${sala.nome}`}
                                                            onClick={() => abrirModalEdicao(sala)}
                                                        >
                                                            <i className="bi bi-pencil"></i>
                                                        </button>

                                                        <button
                                                            type="button"
                                                            title="Alterar status"
                                                            aria-label={`Alterar status de ${sala.nome}`}
                                                            onClick={() => abrirModalStatus(sala)}
                                                            disabled={sala.status === 'retirada'}
                                                        >
                                                            <i className="bi bi-arrow-repeat"></i>
                                                        </button>

                                                        <button
                                                            type="button"
                                                            className="delete"
                                                            title="Excluir sala"
                                                            aria-label={`Excluir ${sala.nome}`}
                                                            onClick={() => setSalaExcluir(sala)}
                                                        >
                                                            <i className="bi bi-trash3"></i>
                                                        </button>
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal de cadastro, edição e status */}
            {modal && (
                <div
                    className="salas-modal-overlay"
                    onMouseDown={event => {
                        if (event.target === event.currentTarget) fecharModal();
                    }}
                >
                    <form className="salas-modal" onSubmit={salvarSala}>
                        <div className="salas-modal-header">
                            <div>
                                <span className="salas-modal-eyebrow">
                                    GERENCIAMENTO DE SALAS
                                </span>

                                <h2>
                                    {modal.tipo === 'criar' && 'Nova sala'}
                                    {modal.tipo === 'editar' && 'Editar sala'}
                                    {modal.tipo === 'status' && 'Alterar status'}
                                </h2>
                            </div>

                            <button
                                type="button"
                                className="salas-modal-close"
                                onClick={fecharModal}
                                disabled={salvando}
                                aria-label="Fechar modal"
                            >
                                <i className="bi bi-x-lg"></i>
                            </button>
                        </div>

                        {modal.tipo !== 'status' ? (
                            <div className="salas-form-group">
                                <label htmlFor="nomeSala">Nome da sala</label>
                                <input
                                    id="nomeSala"
                                    type="text"
                                    placeholder="Ex.: Laboratório de informática"
                                    value={nome}
                                    onChange={event => setNome(event.target.value)}
                                    maxLength={100}
                                    autoFocus
                                    required
                                />
                                <span>Escolha um nome fácil de identificar.</span>
                            </div>
                        ) : (
                            <div className="salas-form-group">
                                <label htmlFor="statusSala">Novo status</label>
                                <select
                                    id="statusSala"
                                    value={statusSelecionado}
                                    onChange={event => setStatusSelecionado(event.target.value)}
                                >
                                    <option value="disponivel">Disponível</option>
                                    <option value="manutencao">Em manutenção</option>
                                    <option value="inativa">Inativa</option>
                                </select>
                                <span>
                                    O status “Em uso” é atualizado automaticamente pelos registros.
                                </span>
                            </div>
                        )}

                        <div className="salas-modal-actions">
                            <button
                                type="button"
                                className="salas-secondary-btn"
                                onClick={fecharModal}
                                disabled={salvando}
                            >
                                Cancelar
                            </button>

                            <button
                                type="submit"
                                className="salas-primary-btn"
                                disabled={salvando}
                            >
                                {salvando ? (
                                    <>
                                        <span className="salas-button-loader"></span>
                                        Salvando...
                                    </>
                                ) : (
                                    <>
                                        <i className="bi bi-check2"></i>
                                        {modal.tipo === 'criar' ? 'Cadastrar sala' : 'Salvar alterações'}
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Confirmação de exclusão */}
            {salaExcluir && (
                <div className="salas-modal-overlay">
                    <div className="salas-modal salas-confirm-modal">
                        <div className="salas-confirm-icon">
                            <i className="bi bi-trash3"></i>
                        </div>

                        <h2>Excluir sala?</h2>

                        <p>
                            Você está prestes a excluir <strong>{salaExcluir.nome}</strong>.
                            Essa ação não poderá ser desfeita.
                        </p>

                        <div className="salas-modal-actions">
                            <button
                                type="button"
                                className="salas-secondary-btn"
                                onClick={() => setSalaExcluir(null)}
                                disabled={excluindo}
                            >
                                Cancelar
                            </button>

                            <button
                                type="button"
                                className="salas-danger-btn"
                                onClick={excluirSala}
                                disabled={excluindo}
                            >
                                {excluindo ? 'Excluindo...' : 'Sim, excluir'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Feedback */}
            {toast && (
                <div className={`salas-toast ${toast.tipo}`}>
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

export default Salas;