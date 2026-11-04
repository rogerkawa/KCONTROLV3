
import { useEffect, useMemo, useState } from 'react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import './Empresas.css';

const filtros = [
    { label: 'Todas', value: 'todas' },
    { label: 'Ativas', value: 'ativa' },
    { label: 'Suspensas', value: 'suspensa' },
    { label: 'Inativas', value: 'inativa' }
];

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

function formatarNumero(valor) {
    return Number(valor || 0).toLocaleString('pt-BR');
}

function Empresas() {
    const { mostrarToast } = useToast();
    const [empresas, setEmpresas] = useState([]);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState('');

    const [busca, setBusca] = useState('');
    const [filtroAtivo, setFiltroAtivo] = useState('todas');

    const [empresaSelecionada, setEmpresaSelecionada] = useState(null);
    const [carregandoDetalhes, setCarregandoDetalhes] = useState(false);

    const [empresaAcao, setEmpresaAcao] = useState(null);
    const [novoStatus, setNovoStatus] = useState('');
    const [atualizandoStatus, setAtualizandoStatus] = useState(false);

    const [erroAcao, setErroAcao] = useState('');

    async function carregarEmpresas() {
        setCarregando(true);
        setErro('');

        try {
            const resposta = await api.get('/empresas');
            setEmpresas(resposta.empresas || []);
        } catch (error) {
            setErro(error.message || 'Não foi possível carregar as empresas.');
        } finally {
            setCarregando(false);
        }
    }

    useEffect(() => {
        carregarEmpresas();
    }, []);

    const estatisticas = useMemo(() => {
        return {
            total: empresas.length,
            ativa: empresas.filter(e => e.status === 'ativa').length,
            suspensa: empresas.filter(e => e.status === 'suspensa').length,
            inativa: empresas.filter(e => e.status === 'inativa').length
        };
    }, [empresas]);

    const empresasFiltradas = useMemo(() => {
        return empresas.filter(empresa => {
            const termo = busca.toLowerCase().trim();

            const correspondeBusca =
                !termo ||
                empresa.nome?.toLowerCase().includes(termo) ||
                empresa.email?.toLowerCase().includes(termo) ||
                empresa.cnpj?.toLowerCase().includes(termo);

            const correspondeStatus =
                filtroAtivo === 'todas' ||
                empresa.status === filtroAtivo;

            return correspondeBusca && correspondeStatus;
        });
    }, [empresas, busca, filtroAtivo]);

    async function abrirDetalhes(id) {
        setEmpresaSelecionada(null);
        setCarregandoDetalhes(true);
        setErroAcao('');

        try {
            const resposta = await api.get(`/empresas/${id}`);
            setEmpresaSelecionada(resposta.empresa);
        } catch (error) {
            setErroAcao(error.message || 'Não foi possível carregar os detalhes.');
        } finally {
            setCarregandoDetalhes(false);
        }
    }

    function prepararAlteracao(empresa) {
        const statusDestino =
            empresa.status === 'ativa' ? 'suspensa' : 'ativa';

        setEmpresaAcao(empresa);
        setNovoStatus(statusDestino);
        setErroAcao('');
    }

    async function confirmarAlteracao() {
        if (!empresaAcao || !novoStatus) return;

        setAtualizandoStatus(true);
        setErroAcao('');

        try {
            await api.patch(
                `/empresas/${empresaAcao.id_empresa}/status`,
                { status: novoStatus }
            );

            setEmpresas(lista =>
                lista.map(empresa =>
                    empresa.id_empresa === empresaAcao.id_empresa
                        ? { ...empresa, status: novoStatus }
                        : empresa
                )
            );

            if (
                empresaSelecionada?.id_empresa === empresaAcao.id_empresa
            ) {
                setEmpresaSelecionada(atual =>
                    atual ? { ...atual, status: novoStatus } : atual
                );
            }

            mostrarToast(
                novoStatus === 'ativa'
                    ? 'Empresa ativada com sucesso!'
                    : 'Empresa suspensa com sucesso!',
                'success'
            );

            setEmpresaAcao(null);

        } catch (error) {
            mostrarToast(error.message || 'Não foi possível alterar o status da empresa.', 'error');
        } finally {
            setAtualizandoStatus(false);
        }
    }

    function fecharDetalhes() {
        setEmpresaSelecionada(null);
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
        const nomes = {
            ativa: 'Ativa',
            suspensa: 'Suspensa',
            inativa: 'Inativa'
        };

        return (
            <span className={`empresa-status status-${status}`}>
                <span className="status-indicator"></span>
                {nomes[status] || status}
            </span>
        );
    }

    return (
        <section className="empresas-page">

            <header className="empresas-header">
                <div>
                    <span className="empresas-eyebrow">
                        ADMINISTRAÇÃO DA PLATAFORMA
                    </span>

                    <h1>Empresas</h1>

                    <p>
                        Gerencie as organizações cadastradas no KControl.
                    </p>
                </div>

                <button
                    className="empresas-refresh"
                    onClick={carregarEmpresas}
                    disabled={carregando}
                    title="Atualizar empresas"
                >
                    <i className={`bi bi-arrow-clockwise ${carregando ? 'rotating' : ''}`}></i>
                    <span>Atualizar</span>
                </button>
            </header>

            <div className="empresas-stats">

                <article className="empresa-stat-card">
                    <div className="empresa-stat-top">
                        <span>Total de empresas</span>
                        <i className="bi bi-buildings"></i>
                    </div>
                    <strong>{formatarNumero(estatisticas.total)}</strong>
                    <small>Organizações cadastradas</small>
                </article>

                <article className="empresa-stat-card">
                    <div className="empresa-stat-top">
                        <span>Empresas ativas</span>
                        <i className="bi bi-check-circle"></i>
                    </div>
                    <strong>{formatarNumero(estatisticas.ativa)}</strong>
                    <small>Com status ativo</small>
                </article>

                <article className="empresa-stat-card">
                    <div className="empresa-stat-top">
                        <span>Empresas suspensas</span>
                        <i className="bi bi-pause-circle"></i>
                    </div>
                    <strong>{formatarNumero(estatisticas.suspensa)}</strong>
                    <small>Com status suspenso</small>
                </article>

                <article className="empresa-stat-card">
                    <div className="empresa-stat-top">
                        <span>Empresas inativas</span>
                        <i className="bi bi-x-circle"></i>
                    </div>
                    <strong>{formatarNumero(estatisticas.inativa)}</strong>
                    <small>Com status inativo</small>
                </article>

            </div>

            <div className="empresas-content">

                <div className="empresas-content-header">
                    <div>
                        <h2>Organizações</h2>
                        <span>
                            {empresasFiltradas.length} empresa(s) encontrada(s)
                        </span>
                    </div>
                </div>

                <div className="empresas-toolbar">

                    <div className="empresas-search">
                        <i className="bi bi-search"></i>

                        <input
                            type="search"
                            placeholder="Buscar por nome, CNPJ ou e-mail..."
                            value={busca}
                            onChange={e => setBusca(e.target.value)}
                        />

                        {busca && (
                            <button onClick={() => setBusca('')} title="Limpar busca">
                                <i className="bi bi-x"></i>
                            </button>
                        )}
                    </div>

                    <div className="empresas-filters">
                        {filtros.map(filtro => (
                            <button
                                key={filtro.value}
                                className={filtroAtivo === filtro.value ? 'active' : ''}
                                onClick={() => setFiltroAtivo(filtro.value)}
                            >
                                {filtro.label}
                            </button>
                        ))}
                    </div>

                </div>

                {erro && (
                    <div className="empresas-state">
                        <i className="bi bi-exclamation-circle"></i>
                        <h3>Não foi possível carregar as empresas</h3>
                        <p>{erro}</p>
                        <button onClick={carregarEmpresas}>
                            Tentar novamente
                        </button>
                    </div>
                )}

                {carregando && (
                    <div className="empresas-state">
                        <span className="empresas-spinner"></span>
                        <p>Carregando empresas...</p>
                    </div>
                )}

                {!carregando && !erro && empresasFiltradas.length === 0 && (
                    <div className="empresas-state">
                        <i className="bi bi-building"></i>
                        <h3>Nenhuma empresa encontrada</h3>
                        <p>
                            {busca || filtroAtivo !== 'todas'
                                ? 'Tente alterar sua busca ou os filtros.'
                                : 'As empresas cadastradas aparecerão aqui.'}
                        </p>
                    </div>
                )}

                {!carregando && !erro && empresasFiltradas.length > 0 && (
                    <div className="empresas-table-wrapper">
                        <table className="empresas-table">
                            <thead>
                                <tr>
                                    <th>Empresa</th>
                                    <th>CNPJ</th>
                                    <th>Usuários</th>
                                    <th>Cadastro</th>
                                    <th>Status</th>
                                    <th></th>
                                </tr>
                            </thead>

                            <tbody>
                                {empresasFiltradas.map(empresa => (
                                    <tr key={empresa.id_empresa}>
                                        <td>
                                            <div className="empresa-identity">
                                                <div className="empresa-avatar">
                                                    {obterIniciais(empresa.nome)}
                                                </div>

                                                <div>
                                                    <strong>{empresa.nome}</strong>
                                                    <span>{empresa.email}</span>
                                                </div>
                                            </div>
                                        </td>

                                        <td className="empresa-cnpj">
                                            {formatarCNPJ(empresa.cnpj)}
                                        </td>

                                        <td>
                                            {formatarNumero(empresa.total_usuarios)}
                                        </td>

                                        <td>
                                            {formatarData(empresa.created_at)}
                                        </td>

                                        <td>{renderStatus(empresa.status)}</td>

                                        <td>
                                            <button
                                                className="empresa-detail-button"
                                                onClick={() => abrirDetalhes(empresa.id_empresa)}
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

            {(carregandoDetalhes || empresaSelecionada) && (
                <div className="empresa-modal-overlay" onMouseDown={e => {
                    if (e.target === e.currentTarget) fecharDetalhes();
                }}>
                    <div className="empresa-modal">

                        <div className="empresa-modal-header">
                            <div>
                                <span>DETALHES DA ORGANIZAÇÃO</span>
                                <h2>
                                    {carregandoDetalhes
                                        ? 'Carregando...'
                                        : empresaSelecionada?.nome}
                                </h2>
                            </div>

                            <button onClick={fecharDetalhes}>
                                <i className="bi bi-x-lg"></i>
                            </button>
                        </div>

                        {carregandoDetalhes ? (
                            <div className="empresa-modal-loading">
                                <span className="empresas-spinner"></span>
                                <p>Buscando informações...</p>
                            </div>
                        ) : empresaSelecionada && (
                            <>
                                <div className="empresa-modal-profile">
                                    <div className="empresa-modal-avatar">
                                        {obterIniciais(empresaSelecionada.nome)}
                                    </div>

                                    <div>
                                        <strong>{empresaSelecionada.nome}</strong>
                                        {renderStatus(empresaSelecionada.status)}
                                    </div>
                                </div>

                                <div className="empresa-detail-grid">
                                    <div>
                                        <span>CNPJ</span>
                                        <strong>{formatarCNPJ(empresaSelecionada.cnpj)}</strong>
                                    </div>

                                    <div>
                                        <span>E-mail</span>
                                        <strong>{empresaSelecionada.email}</strong>
                                    </div>

                                    <div>
                                        <span>Telefone</span>
                                        <strong>{empresaSelecionada.telefone || 'Não informado'}</strong>
                                    </div>

                                    <div>
                                        <span>Data de cadastro</span>
                                        <strong>{formatarData(empresaSelecionada.created_at)}</strong>
                                    </div>
                                </div>

                                <div className="empresa-modal-stats">
                                    <div>
                                        <i className="bi bi-people"></i>
                                        <strong>{formatarNumero(empresaSelecionada.total_usuarios)}</strong>
                                        <span>Usuários</span>
                                    </div>

                                    <div>
                                        <i className="bi bi-door-open"></i>
                                        <strong>{formatarNumero(empresaSelecionada.total_salas)}</strong>
                                        <span>Salas</span>
                                    </div>

                                    <div>
                                        <i className="bi bi-diagram-3"></i>
                                        <strong>{formatarNumero(empresaSelecionada.total_setores)}</strong>
                                        <span>Setores</span>
                                    </div>

                                    <div>
                                        <i className="bi bi-arrow-left-right"></i>
                                        <strong>{formatarNumero(empresaSelecionada.total_registros)}</strong>
                                        <span>Registros</span>
                                    </div>
                                </div>

                                <div className="empresa-modal-footer">
                                    <button
                                        className="empresa-secondary-button"
                                        onClick={fecharDetalhes}
                                    >
                                        Fechar
                                    </button>

                                    <button
                                        className={
                                            empresaSelecionada.status === 'ativa'
                                                ? 'empresa-danger-button'
                                                : 'empresa-primary-button'
                                        }
                                        onClick={() => prepararAlteracao(empresaSelecionada)}
                                    >
                                        <i className={`bi ${
                                            empresaSelecionada.status === 'ativa'
                                                ? 'bi-pause-circle'
                                                : 'bi-check-circle'
                                        }`}></i>

                                        {empresaSelecionada.status === 'ativa'
                                            ? 'Suspender empresa'
                                            : 'Ativar empresa'}
                                    </button>
                                </div>
                            </>
                        )}

                    </div>
                </div>
            )}

            {empresaAcao && (
                <div className="empresa-modal-overlay" onMouseDown={e => {
                    if (e.target === e.currentTarget && !atualizandoStatus) {
                        setEmpresaAcao(null);
                    }
                }}>
                    <div className="empresa-confirm-modal">
                        <div className="empresa-confirm-icon">
                            <i className={`bi ${
                                novoStatus === 'ativa'
                                    ? 'bi-check-circle'
                                    : 'bi-exclamation-triangle'
                            }`}></i>
                        </div>

                        <h2>
                            {novoStatus === 'ativa'
                                ? 'Ativar empresa?'
                                : 'Suspender empresa?'}
                        </h2>

                        <p>
                            Você está prestes a alterar o status de
                            <strong> {empresaAcao.nome}</strong>.
                        </p>

                        <div className="empresa-confirm-actions">
                            <button
                                className="empresa-secondary-button"
                                onClick={() => setEmpresaAcao(null)}
                                disabled={atualizandoStatus}
                            >
                                Cancelar
                            </button>

                            <button
                                className="empresa-primary-button"
                                onClick={confirmarAlteracao}
                                disabled={atualizandoStatus}
                            >
                                {atualizandoStatus
                                    ? 'Atualizando...'
                                    : 'Confirmar alteração'}
                            </button>
                        </div>

                        {erroAcao && (
                            <p className="empresa-action-error">{erroAcao}</p>
                        )}
                    </div>
                </div>
            )}

            {erroAcao && !empresaAcao && (
                <div className="empresas-alert erro">
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

export default Empresas;
