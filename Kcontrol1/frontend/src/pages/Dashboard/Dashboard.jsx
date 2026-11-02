import { useCallback, useEffect, useRef, useState } from 'react';

import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

import './Dashboard.css';

function Dashboard() {
    const { usuario } = useAuth();

    const [dados, setDados] = useState(null);
    const [carregando, setCarregando] = useState(true);
    const [atualizando, setAtualizando] = useState(false);
    const [erro, setErro] = useState('');
    const possuiDados = useRef(false);

    const [periodo, setPeriodo] = useState(7);

    // Impede que duas requisições sejam executadas simultaneamente.
    const buscaEmAndamento = useRef(false);

    const buscarDashboard = useCallback(async () => {
        if (buscaEmAndamento.current) return;

        buscaEmAndamento.current = true;

        if (!possuiDados.current) {
    setCarregando(true);
} else {
    setAtualizando(true);
}

        try {
            setErro('');

            const resposta = await api.get(
                `/dashboard?periodo=${periodo}`
            );

            setDados(resposta);
            possuiDados.current = true;

        } catch (error) {
            setErro(
                error.message || 'Não foi possível carregar o dashboard.'
            );
        } finally {
            setCarregando(false);
            setAtualizando(false);
            buscaEmAndamento.current = false;
        }
    }, [periodo]);

    // Busca os dados ao abrir a página e atualiza a cada 60 segundos.
    useEffect(() => {
        buscarDashboard();

        const intervalo = setInterval(() => {
            buscarDashboard();
        }, 60000);

        return () => clearInterval(intervalo);
    }, [buscarDashboard]);

    const formatarData = (data) => {
        if (!data) return '--';

        const [ano, mes, dia] = String(data).slice(0, 10).split('-');

        if (!ano || !mes || !dia) return '--';

        return `${dia}/${mes}`;
    };

    const formatarDataHora = (data) => {
        if (!data) return '--';

        const dataObjeto = new Date(data);

        if (Number.isNaN(dataObjeto.getTime())) return '--';

        return dataObjeto.toLocaleString('pt-BR', {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const resumo = dados?.resumo || {};

    const comparativo = dados?.comparativo || {};

    const retiradasPorDia = dados?.retiradasPorDia || [];

    const salasMaisUtilizadas = dados?.salasMaisUtilizadas || [];

    const atividadesRecentes = dados?.atividadesRecentes || [];

    // Maior valor entre os dois períodos para manter a mesma escala.
    const maiorRetirada = Math.max(
        ...retiradasPorDia.flatMap((item) => [
            Number(item.total) || 0,
            Number(item.total_anterior) || 0
        ]),
        1
    );

    const indicadores = [
        {
            titulo: 'Total de salas',
            valor: resumo.total_salas ?? 0,
            descricao: 'Salas cadastradas',
            icone: 'bi-door-open'
        },
        {
            titulo: 'Salas disponíveis',
            valor: resumo.salas_disponiveis ?? 0,
            descricao: 'Disponíveis para utilização',
            icone: 'bi-check-circle'
        },
        {
            titulo: 'Retiradas ativas',
            valor: resumo.retiradas_ativas ?? 0,
            descricao: 'Aguardando devolução',
            icone: 'bi-arrow-left-right'
        },
        {
            titulo: 'Membros ativos',
            valor: resumo.membros_ativos ?? 0,
            descricao: 'Usuários da empresa',
            icone: 'bi-people'
        }
    ];

    const variacao = comparativo.variacao_percentual;

    const textoVariacao = variacao === null || variacao === undefined
        ? 'Sem comparação anterior'
        : `${variacao > 0 ? '+' : ''}${variacao}% em relação ao período anterior`;

    const classeVariacao = variacao > 0
        ? 'variation-positive'
        : variacao < 0
            ? 'variation-negative'
            : 'variation-neutral';

    if (carregando) {
        return (
            <div className="dashboard-loading">
                <div className="loading-spinner"></div>
                <span>Carregando informações...</span>
            </div>
        );
    }

    if (erro && !dados) {
        return (
            <section className="dashboard-error">
                <div className="dashboard-error-icon">
                    <i className="bi bi-exclamation-circle"></i>
                </div>

                <h2>Não foi possível carregar o dashboard</h2>

                <p>{erro}</p>

                <button onClick={buscarDashboard}>
                    <i className="bi bi-arrow-clockwise"></i>
                    Tentar novamente
                </button>
            </section>
        );
    }

    return (
        <div className="dashboard-page">

            {/* Boas-vindas */}
            <section className="dashboard-welcome">
                <div>
                    <span className="dashboard-eyebrow">
                        VISÃO GERAL
                    </span>

                    <h2>
                        Bem-vindo de volta, {usuario?.nome?.split(' ')[0] || 'usuário'}.
                    </h2>

                    <p>
                        Aqui está o resumo das atividades da sua empresa.
                    </p>
                </div>

                <button
                    className={`dashboard-refresh ${atualizando ? 'is-loading' : ''}`}
                    onClick={buscarDashboard}
                    disabled={atualizando}
                    title="Atualizar informações"
                    aria-label="Atualizar informações"
                >
                    <i className="bi bi-arrow-clockwise"></i>
                    {atualizando ? 'Atualizando...' : 'Atualizar'}
                </button>
            </section>

            {erro && (
                <div className="dashboard-refresh-error">
                    <i className="bi bi-exclamation-circle"></i>
                    Não foi possível atualizar os dados. Exibindo a última consulta.
                </div>
            )}

            {/* Indicadores */}
            <section className="dashboard-stats">
                {indicadores.map((item) => (
                    <article className="stat-card" key={item.titulo}>
                        <div className="stat-card-top">
                            <span>{item.titulo}</span>

                            <div className="stat-icon">
                                <i className={`bi ${item.icone}`}></i>
                            </div>
                        </div>

                        <strong className="stat-value">
                            {item.valor}
                        </strong>

                        <span className="stat-description">
                            {item.descricao}
                        </span>
                    </article>
                ))}
            </section>

            {/* Gráficos */}
            <section className="dashboard-charts">

                {/* Movimentações */}
                <article className="dashboard-panel chart-panel">
                    <div className="panel-header chart-panel-header">
                        <div>
                            <h3>Movimentações</h3>
                            <p>
                                Comparação de retiradas entre períodos
                            </p>
                        </div>

                        <div className="period-filter">
                            {[7, 30, 90].map((dias) => (
                                <button
                                    key={dias}
                                    className={periodo === dias ? 'active' : ''}
                                    onClick={() => setPeriodo(dias)}
                                    aria-pressed={periodo === dias}
                                >
                                    {dias} dias
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="chart-summary">
                        <div>
                            <span className="chart-summary-label">
                                Retiradas no período
                            </span>

                            <strong>
                                {comparativo.retiradas_atual ?? 0}
                            </strong>

                            <span className={`chart-variation ${classeVariacao}`}>
                                <i className={`bi ${
                                    variacao > 0
                                        ? 'bi-trending-up'
                                        : variacao < 0
                                            ? 'bi-trending-down'
                                            : 'bi-dash'
                                }`}></i>

                                {textoVariacao}
                            </span>
                        </div>
                    </div>

                    <div className="chart-legend">
                        <span>
                            <i className="legend-current"></i>
                            Período atual
                        </span>

                        <span>
                            <i className="legend-previous"></i>
                            Período anterior
                        </span>
                    </div>

                    {retiradasPorDia.length > 0 ? (
                        <div className="chart-area chart-comparison-area">
                            <div className="chart-y-axis">
                                <span>{maiorRetirada}</span>
                                <span>{Math.ceil(maiorRetirada * 0.66)}</span>
                                <span>{Math.ceil(maiorRetirada * 0.33)}</span>
                                <span>0</span>
                            </div>

                            <div className="chart-scroll">
                                <div className="chart-dual-bars">
                                    {retiradasPorDia.map((item, index) => {
                                        const atual = Number(item.total) || 0;
                                        const anterior = Number(item.total_anterior) || 0;

                                        const alturaAtual = atual > 0
                                            ? Math.max((atual / maiorRetirada) * 100, 3)
                                            : 0;

                                        const alturaAnterior = anterior > 0
                                            ? Math.max((anterior / maiorRetirada) * 100, 3)
                                            : 0;

                                        const mostrarLabel =
                                            periodo === 7 ||
                                            index % (periodo === 30 ? 3 : 7) === 0 ||
                                            index === retiradasPorDia.length - 1;

                                        return (
                                            <div
                                                className="chart-dual-column"
                                                key={`${item.data}-${index}`}
                                            >
                                                <div className="chart-dual-bar-container">
                                                    <div
                                                        className="chart-dual-bar chart-bar-previous"
                                                        style={{ height: `${alturaAnterior}%` }}
                                                        title={`Período anterior: ${anterior} retiradas`}
                                                    ></div>

                                                    <div
                                                        className="chart-dual-bar chart-bar-current"
                                                        style={{ height: `${alturaAtual}%` }}
                                                        title={`Período atual: ${atual} retiradas`}
                                                    ></div>
                                                </div>

                                                <span className="chart-dual-label">
                                                    {mostrarLabel ? formatarData(item.data) : ''}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="dashboard-empty">
                            <i className="bi bi-bar-chart"></i>
                            <span>
                                Nenhuma movimentação encontrada neste período.
                            </span>
                        </div>
                    )}
                </article>

                {/* Salas mais utilizadas */}
                <article className="dashboard-panel rooms-panel">
                    <div className="panel-header">
                        <div>
                            <h3>Salas mais utilizadas</h3>
                            <p>Ranking de utilização</p>
                        </div>

                        <i className="bi bi-three-dots"></i>
                    </div>

                    {salasMaisUtilizadas.length > 0 ? (
                        <div className="rooms-ranking">
                            {salasMaisUtilizadas.map((sala, index) => {
                                const maiorSala = Math.max(
                                    ...salasMaisUtilizadas.map(
                                        (item) => Number(item.total_retiradas) || 0
                                    ),
                                    1
                                );

                                const total = Number(sala.total_retiradas) || 0;

                                return (
                                    <div className="room-ranking-item" key={sala.id_sala}>
                                        <div className="room-ranking-info">
                                            <div className="room-ranking-name">
                                                <span className="room-position">
                                                    {String(index + 1).padStart(2, '0')}
                                                </span>

                                                <strong>{sala.nome}</strong>
                                            </div>

                                            <span>{total} retiradas</span>
                                        </div>

                                        <div className="room-progress">
                                            <div
                                                className="room-progress-fill"
                                                style={{
                                                    width: `${(total / maiorSala) * 100}%`
                                                }}
                                            ></div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="dashboard-empty">
                            <i className="bi bi-door-closed"></i>
                            <span>Nenhuma sala encontrada.</span>
                        </div>
                    )}
                </article>

            </section>

            {/* Atividades recentes */}
            <section className="dashboard-panel activity-panel">
                <div className="panel-header">
                    <div>
                        <h3>Atividades recentes</h3>
                        <p>Acompanhe as últimas movimentações do sistema</p>
                    </div>
                </div>

                {atividadesRecentes.length > 0 ? (
                    <div className="activity-list">
                        {atividadesRecentes.map((atividade) => (
                            <article
                                className="activity-item"
                                key={atividade.id_auditoria}
                            >
                                <div className="activity-icon">
                                    <i className="bi bi-clock-history"></i>
                                </div>

                                <div className="activity-info">
                                    <strong>
                                        {atividade.descricao || atividade.acao}
                                    </strong>

                                    <span>
                                        {atividade.nome_usuario || 'Usuário'}
                                    </span>
                                </div>

                                <time>
                                    {formatarDataHora(atividade.created_at)}
                                </time>
                            </article>
                        ))}
                    </div>
                ) : (
                    <div className="dashboard-empty">
                        <i className="bi bi-clock"></i>
                        <span>Nenhuma atividade recente encontrada.</span>
                    </div>
                )}
            </section>

        </div>
    );
}

export default Dashboard;