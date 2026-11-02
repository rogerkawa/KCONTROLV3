
import { useCallback, useEffect, useMemo, useState } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import './Auditoria.css';

const LIMITE = 20;

const modulos = [
    { value: 'todos', label: 'Todos os módulos' },
    { value: 'usuario', label: 'Usuários' },
    { value: 'setor', label: 'Setores' },
    { value: 'sala', label: 'Salas' },
    { value: 'registro', label: 'Registros' },
];

const acoes = {
    'usuario.criado': {
        label: 'Usuário criado',
        icon: 'bi-person-plus',
        tipo: 'success',
    },
    'usuario.atualizado': {
        label: 'Usuário atualizado',
        icon: 'bi-person-gear',
        tipo: 'info',
    },
    'usuario.ativado': {
        label: 'Usuário ativado',
        icon: 'bi-person-check',
        tipo: 'success',
    },
    'usuario.desativado': {
        label: 'Usuário desativado',
        icon: 'bi-person-x',
        tipo: 'warning',
    },
    'setor.criado': {
        label: 'Setor criado',
        icon: 'bi-diagram-3',
        tipo: 'success',
    },
    'setor.atualizado': {
        label: 'Setor atualizado',
        icon: 'bi-pencil-square',
        tipo: 'info',
    },
    'setor.excluido': {
        label: 'Setor excluído',
        icon: 'bi-trash3',
        tipo: 'danger',
    },
    'sala.criada': {
        label: 'Sala criada',
        icon: 'bi-door-open',
        tipo: 'success',
    },
    'sala.atualizada': {
        label: 'Sala atualizada',
        icon: 'bi-pencil-square',
        tipo: 'info',
    },
    'sala.status_alterado': {
        label: 'Status da sala alterado',
        icon: 'bi-arrow-repeat',
        tipo: 'warning',
    },
    'sala.excluida': {
        label: 'Sala excluída',
        icon: 'bi-trash3',
        tipo: 'danger',
    },
    'registro.retirada': {
        label: 'Retirada registrada',
        icon: 'bi-box-arrow-up-right',
        tipo: 'info',
    },
    'registro.devolucao': {
        label: 'Devolução registrada',
        icon: 'bi-box-arrow-in-left',
        tipo: 'success',
    },
};

function formatarData(data) {
    if (!data) return '—';

    const dataObj = new Date(data);

    if (Number.isNaN(dataObj.getTime())) return '—';

    return dataObj.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
}

function formatarHora(data) {
    if (!data) return '—';

    const dataObj = new Date(data);

    if (Number.isNaN(dataObj.getTime())) return '—';

    return dataObj.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
    });
}

function obterAcao(acao) {
    return acoes[acao] || {
        label: acao?.replaceAll('.', ' ').replaceAll('_', ' ') || 'Evento',
        icon: 'bi-activity',
        tipo: 'default',
    };
}

function obterModulo(acao) {
    return acao?.split('.')[0] || 'outros';
}

function Auditoria() {
    const { usuario } = useAuth();

    const [registros, setRegistros] = useState([]);
    const [paginacao, setPaginacao] = useState({
        pagina: 1,
        limite: LIMITE,
        total: 0,
        totalPaginas: 1,
    });

    const [pagina, setPagina] = useState(1);
    const [busca, setBusca] = useState('');
    const [modulo, setModulo] = useState('todos');

    const [carregando, setCarregando] = useState(true);
    const [atualizando, setAtualizando] = useState(false);
    const [erro, setErro] = useState('');
    const [eventoSelecionado, setEventoSelecionado] = useState(null);

    const isAdmin = usuario?.role?.toLowerCase() === 'admin';

    const carregarAuditoria = useCallback(async (silencioso = false) => {
        try {
            if (silencioso) {
                setAtualizando(true);
            } else {
                setCarregando(true);
            }

            setErro('');

            const resposta = await api.get(
                `/auditoria?pagina=${pagina}&limite=${LIMITE}`
            );

            setRegistros(resposta.registros || []);
            setPaginacao(resposta.paginacao || {
                pagina,
                limite: LIMITE,
                total: 0,
                totalPaginas: 1,
            });
        } catch (error) {
            setErro(error.message || 'Não foi possível carregar a auditoria.');
        } finally {
            setCarregando(false);
            setAtualizando(false);
        }
    }, [pagina]);

    useEffect(() => {
        if (isAdmin) carregarAuditoria();
    }, [carregarAuditoria, isAdmin]);

    const registrosFiltrados = useMemo(() => {
        const termo = busca.trim().toLowerCase();

        return registros.filter((registro) => {
            const correspondeBusca = !termo || [
                registro.nome_usuario,
                registro.descricao,
                registro.acao,
            ].some((valor) => valor?.toLowerCase().includes(termo));

            const correspondeModulo =
                modulo === 'todos' || obterModulo(registro.acao) === modulo;

            return correspondeBusca && correspondeModulo;
        });
    }, [registros, busca, modulo]);

    const mudarPagina = (novaPagina) => {
        if (
            novaPagina < 1 ||
            novaPagina > paginacao.totalPaginas ||
            novaPagina === pagina
        ) return;

        setPagina(novaPagina);
        setEventoSelecionado(null);
    };

    if (!isAdmin) {
        return (
            <section className="auditoria-page">
                <div className="auditoria-access">
                    <div className="auditoria-access-icon">
                        <i className="bi bi-shield-lock"></i>
                    </div>
                    <h2>Acesso restrito</h2>
                    <p>A auditoria está disponível somente para administradores da empresa.</p>
                </div>
            </section>
        );
    }

    return (
        <section className="auditoria-page">
            <header className="auditoria-header">
                <div>
                    <span className="auditoria-eyebrow">
                        <i className="bi bi-shield-check"></i>
                        SEGURANÇA E RASTREABILIDADE
                    </span>

                    <h1>Auditoria</h1>
                    <p>
                        Acompanhe as atividades realizadas pelos membros da sua empresa.
                    </p>
                </div>

                <button
                    className="auditoria-refresh"
                    onClick={() => carregarAuditoria(true)}
                    disabled={atualizando || carregando}
                    title="Atualizar histórico"
                >
                    <i className={`bi bi-arrow-clockwise ${atualizando ? 'girando' : ''}`}></i>
                    <span>Atualizar</span>
                </button>
            </header>

            <div className="auditoria-stats">
                <article className="auditoria-stat">
                    <div className="auditoria-stat-icon">
                        <i className="bi bi-journal-text"></i>
                    </div>
                    <div>
                        <span>Total de eventos</span>
                        <strong>{paginacao.total}</strong>
                    </div>
                </article>

                <article className="auditoria-stat">
                    <div className="auditoria-stat-icon">
                        <i className="bi bi-list-ul"></i>
                    </div>
                    <div>
                        <span>Exibidos nesta página</span>
                        <strong>{registros.length}</strong>
                    </div>
                </article>

                <article className="auditoria-stat">
                    <div className="auditoria-stat-icon">
                        <i className="bi bi-files"></i>
                    </div>
                    <div>
                        <span>Página atual</span>
                        <strong>
                            {paginacao.pagina} <small>de {paginacao.totalPaginas || 1}</small>
                        </strong>
                    </div>
                </article>
            </div>

            <div className="auditoria-content">
                <div className="auditoria-toolbar">
                    <div className="auditoria-search">
                        <i className="bi bi-search"></i>
                        <input
                            type="search"
                            placeholder="Buscar por usuário, ação ou descrição..."
                            value={busca}
                            onChange={(e) => setBusca(e.target.value)}
                        />
                        {busca && (
                            <button onClick={() => setBusca('')} title="Limpar busca">
                                <i className="bi bi-x-lg"></i>
                            </button>
                        )}
                    </div>

                    <div className="auditoria-filter">
                        <i className="bi bi-funnel"></i>
                        <select
                            value={modulo}
                            onChange={(e) => setModulo(e.target.value)}
                        >
                            {modulos.map((item) => (
                                <option key={item.value} value={item.value}>
                                    {item.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {erro && (
                    <div className="auditoria-error">
                        <i className="bi bi-exclamation-circle"></i>
                        <span>{erro}</span>
                        <button onClick={() => carregarAuditoria()}>
                            Tentar novamente
                        </button>
                    </div>
                )}

                {carregando ? (
                    <div className="auditoria-loading">
                        <span className="auditoria-spinner"></span>
                        <p>Carregando histórico de atividades...</p>
                    </div>
                ) : !erro && (
                    <>
                        <div className="auditoria-table-wrapper">
                            <table className="auditoria-table">
                                <thead>
                                    <tr>
                                        <th>Atividade</th>
                                        <th>Usuário</th>
                                        <th>Data</th>
                                        <th>Horário</th>
                                        <th></th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {registrosFiltrados.map((registro) => {
                                        const acao = obterAcao(registro.acao);

                                        return (
                                            <tr key={registro.id_auditoria}>
                                                <td>
                                                    <div className="auditoria-activity">
                                                        <div className={`auditoria-action-icon tipo-${acao.tipo}`}>
                                                            <i className={`bi ${acao.icon}`}></i>
                                                        </div>
                                                        <div className="auditoria-activity-info">
                                                            <strong>{acao.label}</strong>
                                                            <span>{registro.descricao || 'Sem descrição disponível.'}</span>
                                                        </div>
                                                    </div>
                                                </td>

                                                <td>
                                                    <div className="auditoria-user">
                                                        <div className="auditoria-user-avatar">
                                                            {(registro.nome_usuario || 'S')
                                                                .split(' ')
                                                                .filter(Boolean)
                                                                .slice(0, 2)
                                                                .map((parte) => parte[0])
                                                                .join('')
                                                                .toUpperCase()}
                                                        </div>
                                                        <span>{registro.nome_usuario || 'Sistema'}</span>
                                                    </div>
                                                </td>

                                                <td>{formatarData(registro.created_at)}</td>
                                                <td className="auditoria-time">
                                                    {formatarHora(registro.created_at)}
                                                </td>

                                                <td>
                                                    <button
                                                        className="auditoria-detail-btn"
                                                        onClick={() => setEventoSelecionado(registro)}
                                                        title="Ver detalhes"
                                                    >
                                                        <i className="bi bi-arrow-up-right"></i>
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>

                            {registrosFiltrados.length === 0 && (
                                <div className="auditoria-empty">
                                    <i className="bi bi-search"></i>
                                    <strong>Nenhuma atividade encontrada</strong>
                                    <span>
                                        {busca || modulo !== 'todos'
                                            ? 'Tente alterar os filtros da busca.'
                                            : 'Ainda não existem eventos registrados.'}
                                    </span>
                                    {(busca || modulo !== 'todos') && (
                                        <button onClick={() => {
                                            setBusca('');
                                            setModulo('todos');
                                        }}>
                                            Limpar filtros
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>

                        <footer className="auditoria-pagination">
                            <span>
                                Página <strong>{paginacao.pagina}</strong> de{' '}
                                <strong>{paginacao.totalPaginas || 1}</strong>
                                <span className="auditoria-pagination-total">
                                    · {paginacao.total} eventos
                                </span>
                            </span>

                            <div className="auditoria-pagination-actions">
                                <button
                                    onClick={() => mudarPagina(pagina - 1)}
                                    disabled={pagina <= 1}
                                    title="Página anterior"
                                >
                                    <i className="bi bi-chevron-left"></i>
                                </button>

                                <button
                                    onClick={() => mudarPagina(pagina + 1)}
                                    disabled={pagina >= paginacao.totalPaginas}
                                    title="Próxima página"
                                >
                                    <i className="bi bi-chevron-right"></i>
                                </button>
                            </div>
                        </footer>
                    </>
                )}
            </div>

            {eventoSelecionado && (
                <div
                    className="auditoria-modal-overlay"
                    onMouseDown={(e) => {
                        if (e.target === e.currentTarget) setEventoSelecionado(null);
                    }}
                >
                    <div className="auditoria-modal">
                        <div className="auditoria-modal-header">
                            <div>
                                <span>DETALHES DO EVENTO</span>
                                <h2>Registro de auditoria</h2>
                            </div>
                            <button onClick={() => setEventoSelecionado(null)}>
                                <i className="bi bi-x-lg"></i>
                            </button>
                        </div>

                        <div className="auditoria-modal-body">
                            <div className="auditoria-modal-event">
                                <div className={`auditoria-action-icon tipo-${obterAcao(eventoSelecionado.acao).tipo}`}>
                                    <i className={`bi ${obterAcao(eventoSelecionado.acao).icon}`}></i>
                                </div>
                                <div>
                                    <strong>{obterAcao(eventoSelecionado.acao).label}</strong>
                                    <span>{eventoSelecionado.acao}</span>
                                </div>
                            </div>

                            <div className="auditoria-detail-field">
                                <span>Descrição</span>
                                <p>{eventoSelecionado.descricao || 'Sem descrição disponível.'}</p>
                            </div>

                            <div className="auditoria-detail-grid">
                                <div className="auditoria-detail-field">
                                    <span>Usuário responsável</span>
                                    <strong>{eventoSelecionado.nome_usuario || 'Sistema'}</strong>
                                </div>

                                <div className="auditoria-detail-field">
                                    <span>ID do usuário</span>
                                    <strong>{eventoSelecionado.id_usuario ?? '—'}</strong>
                                </div>

                                <div className="auditoria-detail-field">
                                    <span>Data</span>
                                    <strong>{formatarData(eventoSelecionado.created_at)}</strong>
                                </div>

                                <div className="auditoria-detail-field">
                                    <span>Horário</span>
                                    <strong>{formatarHora(eventoSelecionado.created_at)}</strong>
                                </div>

                                <div className="auditoria-detail-field">
                                    <span>ID do evento</span>
                                    <strong>#{eventoSelecionado.id_auditoria}</strong>
                                </div>
                            </div>
                        </div>

                        <div className="auditoria-modal-footer">
                            <button onClick={() => setEventoSelecionado(null)}>
                                Fechar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}

export default Auditoria;
