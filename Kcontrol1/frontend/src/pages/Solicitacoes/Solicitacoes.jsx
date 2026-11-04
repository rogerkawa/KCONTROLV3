
import { useEffect, useMemo, useState } from 'react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import './Solicitacoes.css';

const filtros = [
    { label: 'Todas', value: 'todas' },
    { label: 'Pendentes', value: 'pendente' },
    { label: 'Aprovadas', value: 'aprovada' },
    { label: 'Rejeitadas', value: 'rejeitada' }
];

const statusNomes = {
    pendente: 'Pendente',
    aprovada: 'Aprovada',
    rejeitada: 'Rejeitada'
};

function formatarCNPJ(valor = '') {
    const cnpj = String(valor).replace(/\D/g, '');

    return cnpj.replace(
        /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
        '$1.$2.$3/$4-$5'
    );
}

function formatarData(data) {
    if (!data) return '—';

    const dataFormatada = new Date(data);

    if (Number.isNaN(dataFormatada.getTime())) return '—';

    return dataFormatada.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
}

function formatarDataHora(data) {
    if (!data) return '—';

    const dataFormatada = new Date(data);

    if (Number.isNaN(dataFormatada.getTime())) return '—';

    return dataFormatada.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function Solicitacoes() {
    const { mostrarToast } = useToast();
    const [solicitacoes, setSolicitacoes] = useState([]);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState('');

    const [busca, setBusca] = useState('');
    const [filtroAtivo, setFiltroAtivo] = useState('todas');

    const [solicitacaoSelecionada, setSolicitacaoSelecionada] = useState(null);
    const [carregandoDetalhes, setCarregandoDetalhes] = useState(false);

    const [solicitacaoAcao, setSolicitacaoAcao] = useState(null);
    const [tipoAcao, setTipoAcao] = useState('');
    const [motivo, setMotivo] = useState('');
    const [processando, setProcessando] = useState(false);

    const [conviteGerado, setConviteGerado] = useState(null);
    const [erroAcao, setErroAcao] = useState('');

    async function carregarSolicitacoes() {
        setCarregando(true);
        setErro('');

        try {
            const resposta = await api.get('/solicitacoes');
            setSolicitacoes(resposta.solicitacoes || []);
        } catch (error) {
            setErro(error.message || 'Não foi possível carregar as solicitações.');
        } finally {
            setCarregando(false);
        }
    }

    useEffect(() => {
        carregarSolicitacoes();
    }, []);

    const estatisticas = useMemo(() => ({
        total: solicitacoes.length,
        pendente: solicitacoes.filter(s => s.status === 'pendente').length,
        aprovada: solicitacoes.filter(s => s.status === 'aprovada').length,
        rejeitada: solicitacoes.filter(s => s.status === 'rejeitada').length
    }), [solicitacoes]);

    const solicitacoesFiltradas = useMemo(() => {
        return solicitacoes.filter(solicitacao => {
            const termo = busca.toLowerCase().trim();

            const correspondeBusca =
                !termo ||
                solicitacao.nome_empresa?.toLowerCase().includes(termo) ||
                solicitacao.cnpj?.toLowerCase().includes(termo) ||
                solicitacao.nome_responsavel?.toLowerCase().includes(termo) ||
                solicitacao.email_responsavel?.toLowerCase().includes(termo) ||
                solicitacao.email_empresa?.toLowerCase().includes(termo);

            const correspondeStatus =
                filtroAtivo === 'todas' ||
                solicitacao.status === filtroAtivo;

            return correspondeBusca && correspondeStatus;
        });
    }, [solicitacoes, busca, filtroAtivo]);

    async function abrirDetalhes(id) {
        setSolicitacaoSelecionada(null);
        setCarregandoDetalhes(true);
        setErroAcao('');

        try {
            const resposta = await api.get(`/solicitacoes/${id}`);
            setSolicitacaoSelecionada(resposta.solicitacao);
        } catch (error) {
            setErroAcao(error.message || 'Não foi possível carregar os detalhes.');
        } finally {
            setCarregandoDetalhes(false);
        }
    }

    function prepararAcao(solicitacao, tipo) {
        setSolicitacaoAcao(solicitacao);
        setTipoAcao(tipo);
        setMotivo('');
        setErroAcao('');
    }

    function fecharAcao() {
        if (processando) return;

        setSolicitacaoAcao(null);
        setTipoAcao('');
        setMotivo('');
        setErroAcao('');
    }

    async function confirmarAcao() {
        if (!solicitacaoAcao || processando) return;

        if (tipoAcao === 'rejeitar' && motivo.trim().length < 5) {
            mostrarToast('Informe um motivo com pelo menos 5 caracteres.', 'warning');
            return;
        }

        setProcessando(true);
        setErroAcao('');

        try {
            let resposta;

            if (tipoAcao === 'aprovar') {
                resposta = await api.patch(
                    `/solicitacoes/${solicitacaoAcao.id_solicitacao}/aprovar`,
                    {}
                );

                // A resposta do backend fornece a URL do convite.
                // Guardamos o objeto completo para exibir os dados retornados.
                setConviteGerado(resposta);
            } else {
                resposta = await api.patch(
                    `/solicitacoes/${solicitacaoAcao.id_solicitacao}/rejeitar`,
                    { motivo: motivo.trim() }
                );
            }

            const novoStatus = tipoAcao === 'aprovar'
                ? 'aprovada'
                : 'rejeitada';

            setSolicitacoes(lista =>
                lista.map(solicitacao =>
                    solicitacao.id_solicitacao === solicitacaoAcao.id_solicitacao
                        ? {
                            ...solicitacao,
                            status: novoStatus,
                            motivo_rejeicao: tipoAcao === 'rejeitar'
                                ? motivo.trim()
                                : null,
                            data_analise: new Date().toISOString()
                        }
                        : solicitacao
                )
            );

            if (
                solicitacaoSelecionada?.id_solicitacao ===
                solicitacaoAcao.id_solicitacao
            ) {
                setSolicitacaoSelecionada(atual => ({
                    ...atual,
                    status: novoStatus,
                    motivo_rejeicao: tipoAcao === 'rejeitar'
                        ? motivo.trim()
                        : null,
                    data_analise: new Date().toISOString()
                }));
            }

            mostrarToast(
                tipoAcao === 'aprovar'
                    ? 'Solicitação aprovada com sucesso!'
                    : 'Solicitação rejeitada com sucesso!',
                'success'
            );

            setSolicitacaoAcao(null);
            setTipoAcao('');

        } catch (error) {
            mostrarToast(
                error.message || 'Não foi possível processar a solicitação.',
                'error'
            );
        } finally {
            setProcessando(false);
        }
    }

    function fecharDetalhes() {
        setSolicitacaoSelecionada(null);
        setConviteGerado(null);
        setErroAcao('');
    }

    function obterIniciais(nome = '') {
        return nome
            .split(' ')
            .filter(Boolean)
            .slice(0, 2)
            .map(parte => parte[0])
            .join('')
            .toUpperCase();
    }

    function renderStatus(status) {
        return (
            <span className={`solicitacao-status status-${status}`}>
                <span className="status-indicator"></span>
                {statusNomes[status] || status}
            </span>
        );
    }

    return (
        <section className="solicitacoes-page">

            <header className="solicitacoes-header">
                <div>
                    <span className="solicitacoes-eyebrow">
                        ADMINISTRAÇÃO DA PLATAFORMA
                    </span>

                    <h1>Solicitações</h1>

                    <p>
                        Analise e gerencie os pedidos de acesso ao KControl.
                    </p>
                </div>

                <button
                    className="solicitacoes-refresh"
                    onClick={carregarSolicitacoes}
                    disabled={carregando}
                    title="Atualizar solicitações"
                >
                    <i className={`bi bi-arrow-clockwise ${carregando ? 'rotating' : ''}`}></i>
                    <span>Atualizar</span>
                </button>
            </header>

            <div className="solicitacoes-stats">

                <article className="solicitacao-stat-card">
                    <div className="solicitacao-stat-top">
                        <span>Total de solicitações</span>
                        <i className="bi bi-inbox"></i>
                    </div>
                    <strong>{estatisticas.total}</strong>
                    <small>Pedidos recebidos</small>
                </article>

                <article className="solicitacao-stat-card">
                    <div className="solicitacao-stat-top">
                        <span>Pendentes</span>
                        <i className="bi bi-clock-history"></i>
                    </div>
                    <strong>{estatisticas.pendente}</strong>
                    <small>Aguardando análise</small>
                </article>

                <article className="solicitacao-stat-card">
                    <div className="solicitacao-stat-top">
                        <span>Aprovadas</span>
                        <i className="bi bi-check-circle"></i>
                    </div>
                    <strong>{estatisticas.aprovada}</strong>
                    <small>Acessos autorizados</small>
                </article>

                <article className="solicitacao-stat-card">
                    <div className="solicitacao-stat-top">
                        <span>Rejeitadas</span>
                        <i className="bi bi-x-circle"></i>
                    </div>
                    <strong>{estatisticas.rejeitada}</strong>
                    <small>Pedidos recusados</small>
                </article>

            </div>

            <div className="solicitacoes-content">

                <div className="solicitacoes-content-header">
                    <div>
                        <h2>Pedidos recebidos</h2>
                        <span>
                            {solicitacoesFiltradas.length} solicitação(ões) encontrada(s)
                        </span>
                    </div>
                </div>

                <div className="solicitacoes-toolbar">

                    <div className="solicitacoes-search">
                        <i className="bi bi-search"></i>

                        <input
                            type="search"
                            placeholder="Buscar empresa, CNPJ ou responsável..."
                            value={busca}
                            onChange={e => setBusca(e.target.value)}
                        />

                        {busca && (
                            <button onClick={() => setBusca('')}>
                                <i className="bi bi-x"></i>
                            </button>
                        )}
                    </div>

                    <div className="solicitacoes-filters">
                        {filtros.map(filtro => (
                            <button
                                key={filtro.value}
                                className={filtroAtivo === filtro.value ? 'active' : ''}
                                onClick={() => setFiltroAtivo(filtro.value)}
                            >
                                {filtro.label}
                                {filtro.value === 'pendente' && estatisticas.pendente > 0 && (
                                    <span>{estatisticas.pendente}</span>
                                )}
                            </button>
                        ))}
                    </div>

                </div>

                {erro && (
                    <div className="solicitacoes-state">
                        <i className="bi bi-exclamation-circle"></i>
                        <h3>Não foi possível carregar as solicitações</h3>
                        <p>{erro}</p>
                        <button onClick={carregarSolicitacoes}>
                            Tentar novamente
                        </button>
                    </div>
                )}

                {carregando && (
                    <div className="solicitacoes-state">
                        <span className="solicitacoes-spinner"></span>
                        <p>Carregando solicitações...</p>
                    </div>
                )}

                {!carregando && !erro && solicitacoesFiltradas.length === 0 && (
                    <div className="solicitacoes-state">
                        <i className="bi bi-inbox"></i>
                        <h3>Nenhuma solicitação encontrada</h3>
                        <p>
                            {busca || filtroAtivo !== 'todas'
                                ? 'Tente alterar sua busca ou os filtros.'
                                : 'Os novos pedidos de acesso aparecerão aqui.'}
                        </p>
                    </div>
                )}

                {!carregando && !erro && solicitacoesFiltradas.length > 0 && (
                    <div className="solicitacoes-table-wrapper">
                        <table className="solicitacoes-table">
                            <thead>
                                <tr>
                                    <th>Empresa</th>
                                    <th>Responsável</th>
                                    <th>Solicitação</th>
                                    <th>Status</th>
                                    <th></th>
                                </tr>
                            </thead>

                            <tbody>
                                {solicitacoesFiltradas.map(solicitacao => (
                                    <tr key={solicitacao.id_solicitacao}>
                                        <td>
                                            <div className="solicitacao-identity">
                                                <div className="solicitacao-avatar">
                                                    {obterIniciais(solicitacao.nome_empresa)}
                                                </div>

                                                <div>
                                                    <strong>{solicitacao.nome_empresa}</strong>
                                                    <span>{solicitacao.email_empresa}</span>
                                                </div>
                                            </div>
                                        </td>

                                        <td>
                                            <div className="solicitacao-responsavel">
                                                <strong>{solicitacao.nome_responsavel}</strong>
                                                <span>{solicitacao.email_responsavel}</span>
                                            </div>
                                        </td>

                                        <td>
                                            {formatarData(solicitacao.data_solicitacao)}
                                        </td>

                                        <td>{renderStatus(solicitacao.status)}</td>

                                        <td>
                                            <button
                                                className="solicitacao-detail-button"
                                                onClick={() => abrirDetalhes(solicitacao.id_solicitacao)}
                                                title="Ver detalhes"
                                            >
                                                <i className="bi bi-arrow-up-right"></i>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

            </div>

            {(carregandoDetalhes || solicitacaoSelecionada) && (
                <div
                    className="solicitacao-modal-overlay"
                    onMouseDown={e => {
                        if (e.target === e.currentTarget) fecharDetalhes();
                    }}
                >
                    <div className="solicitacao-modal">

                        <div className="solicitacao-modal-header">
                            <div>
                                <span>ANÁLISE DE SOLICITAÇÃO</span>
                                <h2>
                                    {carregandoDetalhes
                                        ? 'Carregando...'
                                        : solicitacaoSelecionada?.nome_empresa}
                                </h2>
                            </div>

                            <button onClick={fecharDetalhes}>
                                <i className="bi bi-x-lg"></i>
                            </button>
                        </div>

                        {carregandoDetalhes ? (
                            <div className="solicitacao-modal-loading">
                                <span className="solicitacoes-spinner"></span>
                                <p>Buscando informações...</p>
                            </div>
                        ) : solicitacaoSelecionada && (
                            <>
                                <div className="solicitacao-modal-profile">
                                    <div className="solicitacao-modal-avatar">
                                        {obterIniciais(solicitacaoSelecionada.nome_empresa)}
                                    </div>

                                    <div>
                                        <strong>{solicitacaoSelecionada.nome_empresa}</strong>
                                        {renderStatus(solicitacaoSelecionada.status)}
                                    </div>
                                </div>

                                <div className="solicitacao-detail-section">
                                    <h3>
                                        <i className="bi bi-building"></i>
                                        Dados da empresa
                                    </h3>

                                    <div className="solicitacao-detail-grid">
                                        <div>
                                            <span>Razão social / nome</span>
                                            <strong>{solicitacaoSelecionada.nome_empresa}</strong>
                                        </div>

                                        <div>
                                            <span>CNPJ</span>
                                            <strong>{formatarCNPJ(solicitacaoSelecionada.cnpj)}</strong>
                                        </div>

                                        <div>
                                            <span>E-mail empresarial</span>
                                            <strong>{solicitacaoSelecionada.email_empresa}</strong>
                                        </div>

                                        <div>
                                            <span>Telefone</span>
                                            <strong>{solicitacaoSelecionada.telefone || 'Não informado'}</strong>
                                        </div>
                                    </div>
                                </div>

                                <div className="solicitacao-detail-section">
                                    <h3>
                                        <i className="bi bi-person"></i>
                                        Responsável pela conta
                                    </h3>

                                    <div className="solicitacao-detail-grid">
                                        <div>
                                            <span>Nome do responsável</span>
                                            <strong>{solicitacaoSelecionada.nome_responsavel}</strong>
                                        </div>

                                        <div>
                                            <span>E-mail do responsável</span>
                                            <strong>{solicitacaoSelecionada.email_responsavel}</strong>
                                        </div>
                                    </div>
                                </div>

                                <div className="solicitacao-timeline">
                                    <div>
                                        <span className="timeline-dot"></span>
                                        <div>
                                            <strong>Solicitação enviada</strong>
                                            <small>{formatarDataHora(solicitacaoSelecionada.data_solicitacao)}</small>
                                        </div>
                                    </div>

                                    {solicitacaoSelecionada.data_analise && (
                                        <div>
                                            <span className="timeline-dot analisada"></span>
                                            <div>
                                                <strong>
                                                    {statusNomes[solicitacaoSelecionada.status]}
                                                </strong>
                                                <small>{formatarDataHora(solicitacaoSelecionada.data_analise)}</small>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {solicitacaoSelecionada.motivo_rejeicao && (
                                    <div className="solicitacao-rejection-reason">
                                        <strong>Motivo da rejeição</strong>
                                        <p>{solicitacaoSelecionada.motivo_rejeicao}</p>
                                    </div>
                                )}

                                {conviteGerado && (
                                    <div className="solicitacao-invite-result">
                                        <div>
                                            <i className="bi bi-check-circle"></i>
                                            <strong>Empresa aprovada!</strong>
                                        </div>

                                        <p>
                                            O administrador inicial foi criado.
                                            Compartilhe o convite com o responsável.
                                        </p>

                                        {(conviteGerado.url || conviteGerado.convite?.url) && (
                                            <div className="solicitacao-invite-link">
                                                <input
                                                    readOnly
                                                    value={
                                                        conviteGerado.url ||
                                                        conviteGerado.convite?.url
                                                    }
                                                />
                                                <button
                                                    onClick={() => navigator.clipboard.writeText(
                                                        conviteGerado.url ||
                                                        conviteGerado.convite?.url
                                                    )}
                                                    title="Copiar convite"
                                                >
                                                    <i className="bi bi-copy"></i>
                                                </button>
                                            </div>
                                        )}

                                        <small>
                                            Validade: {conviteGerado.validade_horas ||
                                                conviteGerado.convite?.validade_horas || 24} horas.
                                        </small>
                                    </div>
                                )}

                                {solicitacaoSelecionada.status === 'pendente' && (
                                    <div className="solicitacao-modal-footer">
                                        <button
                                            className="solicitacao-reject-button"
                                            onClick={() => prepararAcao(solicitacaoSelecionada, 'rejeitar')}
                                        >
                                            <i className="bi bi-x-circle"></i>
                                            Rejeitar
                                        </button>

                                        <button
                                            className="solicitacao-approve-button"
                                            onClick={() => prepararAcao(solicitacaoSelecionada, 'aprovar')}
                                        >
                                            <i className="bi bi-check-circle"></i>
                                            Aprovar solicitação
                                        </button>
                                    </div>
                                )}
                            </>
                        )}

                    </div>
                </div>
            )}

            {solicitacaoAcao && (
                <div
                    className="solicitacao-modal-overlay"
                    onMouseDown={e => {
                        if (e.target === e.currentTarget) fecharAcao();
                    }}
                >
                    <div className="solicitacao-confirm-modal">

                        <div className={`solicitacao-confirm-icon ${tipoAcao}`}>
                            <i className={`bi ${
                                tipoAcao === 'aprovar'
                                    ? 'bi-check-circle'
                                    : 'bi-exclamation-triangle'
                            }`}></i>
                        </div>

                        <h2>
                            {tipoAcao === 'aprovar'
                                ? 'Aprovar solicitação?'
                                : 'Rejeitar solicitação?'}
                        </h2>

                        <p>
                            {tipoAcao === 'aprovar'
                                ? `A empresa ${solicitacaoAcao.nome_empresa} será cadastrada e um administrador inicial será criado.`
                                : `A solicitação de ${solicitacaoAcao.nome_empresa} será rejeitada.`}
                        </p>

                        {tipoAcao === 'rejeitar' && (
                            <div className="solicitacao-reason-field">
                                <label htmlFor="motivo-rejeicao">
                                    Motivo da rejeição
                                </label>

                                <textarea
                                    id="motivo-rejeicao"
                                    value={motivo}
                                    onChange={e => setMotivo(e.target.value)}
                                    placeholder="Explique o motivo da rejeição..."
                                    rows={4}
                                    maxLength={1000}
                                />

                                <small>{motivo.length}/1000 caracteres</small>
                            </div>
                        )}

                        {erroAcao && (
                            <div className="solicitacao-action-error">
                                <i className="bi bi-exclamation-circle"></i>
                                {erroAcao}
                            </div>
                        )}

                        <div className="solicitacao-confirm-actions">
                            <button
                                className="solicitacao-cancel-button"
                                onClick={fecharAcao}
                                disabled={processando}
                            >
                                Cancelar
                            </button>

                            <button
                                className={
                                    tipoAcao === 'aprovar'
                                        ? 'solicitacao-approve-button'
                                        : 'solicitacao-reject-button'
                                }
                                onClick={confirmarAcao}
                                disabled={processando}
                            >
                                {processando
                                    ? 'Processando...'
                                    : tipoAcao === 'aprovar'
                                        ? 'Confirmar aprovação'
                                        : 'Confirmar rejeição'}
                            </button>
                        </div>

                    </div>
                </div>
            )}

            {erroAcao && !solicitacaoAcao && !solicitacaoSelecionada && (
                <div className="solicitacoes-alert erro">
                    <i className="bi bi-exclamation-circle"></i>
                    {erroAcao}
                    <button onClick={() => setErroAcao('')}>
                        <i className="bi bi-x"></i>
                    </button>
                </div>
            )}

        </section>
    );
}

export default Solicitacoes;
