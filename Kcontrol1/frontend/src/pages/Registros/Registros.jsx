
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

import './Registro.css';

const formularioInicial = {
    id_setor: '',
    id_sala: '',
    responsavel: '',
    turno: 'T',
    data_retirada: new Date().toLocaleDateString('en-CA'),
    hora_retirada: new Date().toTimeString().slice(0, 5)
};

function Registros() {
    const { usuario } = useAuth();
    const { mostrarToast } = useToast();
    const invalidToastRef = useRef(false);

    const isAdmin = usuario?.role === 'admin';

    const [registros, setRegistros] = useState([]);
    const [salas, setSalas] = useState([]);
    const [setores, setSetores] = useState([]);

    const [carregando, setCarregando] = useState(true);
    const [atualizando, setAtualizando] = useState(false);
    const [erro, setErro] = useState('');
    const [modalAberto, setModalAberto] = useState(false);
    const [registroSelecionado, setRegistroSelecionado] = useState(null);

    const [salvando, setSalvando] = useState(false);
    const [devolvendo, setDevolvendo] = useState(null);

    const [formulario, setFormulario] = useState(formularioInicial);

    const [busca, setBusca] = useState('');
    const [filtroStatus, setFiltroStatus] = useState('todos');
    const [filtroTurno, setFiltroTurno] = useState('todos');
    const [filtroSala, setFiltroSala] = useState('todos');
    const [filtroSetor, setFiltroSetor] = useState('todos');

    const buscarDados = useCallback(async (silencioso = false) => {
        if (silencioso) {
            setAtualizando(true);
        } else {
            setCarregando(true);
        }

        try {
            setErro('');

            const [respostaRegistros, respostaSalas, respostaSetores] =
                await Promise.all([
                    api.get(isAdmin ? '/registros' : '/registros/meus'),
                    api.get('/salas'),
                    api.get('/setores')
                ]);

            setRegistros(respostaRegistros.registros || []);
            setSalas(respostaSalas.salas || []);
            setSetores(respostaSetores.setores || []);
        } catch (error) {
            setErro(error.message || 'Não foi possível carregar os registros.');
        } finally {
            setCarregando(false);
            setAtualizando(false);
        }
    }, [isAdmin]);

    useEffect(() => {
        buscarDados();
    }, [buscarDados]);

    const notificar = (tipo, texto) => {
        const tipos = {
            sucesso: 'success',
            erro: 'error',
            aviso: 'warning',
            informacao: 'info'
        };

        mostrarToast(texto, tipos[tipo] || 'info');
    };

    const avisarFormularioInvalido = event => {
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
    };

    const atualizarFormulario = (campo, valor) => {
        setFormulario((anterior) => ({
            ...anterior,
            [campo]: valor
        }));
    };

    const formatarData = (data) => {
        if (!data) return '--';

        const valor = String(data).slice(0, 10);
        const [ano, mes, dia] = valor.split('-');

        if (!ano || !mes || !dia) return '--';

        return `${dia}/${mes}/${ano}`;
    };

    const formatarHora = (hora) => {
        if (!hora) return '--';

        return String(hora).slice(0, 5);
    };

    const formatarDataHora = (data) => {
        if (!data) return '--';

        const objeto = new Date(data);

        if (Number.isNaN(objeto.getTime())) return '--';

        return objeto.toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const nomeTurno = (turno) => {
        const turnos = {
            M: 'Matutino',
            T: 'Vespertino',
            N: 'Noturno'
        };

        return turnos[turno] || turno || '--';
    };

    const nomeStatus = (status) => {
        return status === 'retirada' ? 'Retirada ativa' : 'Devolvida';
    };

    const registrosFiltrados = useMemo(() => {
        const termo = busca.trim().toLowerCase();

        return registros.filter((registro) => {
            const correspondeBusca = !termo || [
                registro.nome_usuario,
                registro.responsavel,
                registro.nome_sala,
                registro.nome_setor
            ].some((valor) => String(valor || '').toLowerCase().includes(termo));

            const correspondeStatus =
                filtroStatus === 'todos' || registro.status === filtroStatus;

            const correspondeTurno =
                filtroTurno === 'todos' || registro.turno === filtroTurno;

            const correspondeSala =
                filtroSala === 'todos' ||
                String(registro.id_sala) === filtroSala;

            const correspondeSetor =
                filtroSetor === 'todos' ||
                String(registro.id_setor) === filtroSetor;

            return (
                correspondeBusca &&
                correspondeStatus &&
                correspondeTurno &&
                correspondeSala &&
                correspondeSetor
            );
        });
    }, [
        registros,
        busca,
        filtroStatus,
        filtroTurno,
        filtroSala,
        filtroSetor
    ]);

    const totalAtivos = registros.filter(
        (registro) => registro.status === 'retirada'
    ).length;

    const totalDevolvidos = registros.filter(
        (registro) => registro.status === 'devolvida'
    ).length;

    const salasDisponiveis = salas.filter(
        (sala) => sala.status === 'disponivel'
    );

    const abrirModal = () => {
        setFormulario({
            ...formularioInicial,
            data_retirada: new Date().toLocaleDateString('en-CA'),
            hora_retirada: new Date().toTimeString().slice(0, 5)
        });

        setModalAberto(true);
    };

    const fecharModal = () => {
        if (salvando) return;

        setModalAberto(false);
    };

    const registrarRetirada = async (event) => {
        event.preventDefault();

        if (!formulario.id_setor || !formulario.id_sala) {
            notificar('aviso', 'Selecione um setor e uma sala.');
            return;
        }

        if (!formulario.responsavel.trim()) {
            notificar('aviso', 'Informe o nome do responsável.');
            return;
        }

        setSalvando(true);

        try {
            await api.post('/registros', {
                ...formulario,
                id_setor: Number(formulario.id_setor),
                id_sala: Number(formulario.id_sala),
                responsavel: formulario.responsavel.trim()
            });

            setModalAberto(false);

            notificar('sucesso', 'Retirada registrada com sucesso!');

            await buscarDados(true);
        } catch (error) {
            notificar('erro', error.message || 'Não foi possível registrar a retirada.');
        } finally {
            setSalvando(false);
        }
    };

    const registrarDevolucao = async (registro) => {
        const confirmar = window.confirm(
            `Deseja registrar a devolução da ${registro.nome_sala}?`
        );

        if (!confirmar) return;

        setDevolvendo(registro.id_registro);

        try {
            await api.patch(`/registros/${registro.id_registro}/devolver`);

            if (registroSelecionado?.id_registro === registro.id_registro) {
                setRegistroSelecionado(null);
            }

            notificar('sucesso', 'Devolução registrada com sucesso!');

            await buscarDados(true);
        } catch (error) {
            notificar('erro', error.message || 'Não foi possível registrar a devolução.');
        } finally {
            setDevolvendo(null);
        }
    };

    const limparFiltros = () => {
        setBusca('');
        setFiltroStatus('todos');
        setFiltroTurno('todos');
        setFiltroSala('todos');
        setFiltroSetor('todos');
    };

    const possuiFiltros =
        busca ||
        filtroStatus !== 'todos' ||
        filtroTurno !== 'todos' ||
        filtroSala !== 'todos' ||
        filtroSetor !== 'todos';

    if (carregando) {
        return (
            <div className="registros-loading">
                <div className="loading-spinner"></div>
                <span>Carregando registros...</span>
            </div>
        );
    }

    if (erro && registros.length === 0) {
        return (
            <section className="registros-error">
                <div className="registros-error-icon">
                    <i className="bi bi-exclamation-circle"></i>
                </div>

                <h2>Não foi possível carregar os registros</h2>
                <p>{erro}</p>

                <button onClick={() => buscarDados()}>
                    <i className="bi bi-arrow-clockwise"></i>
                    Tentar novamente
                </button>
            </section>
        );
    }

    return (
        <div className="registros-page">

            {/* Cabeçalho */}
            <section className="registros-welcome">
                <div>
                    <span className="registros-eyebrow">
                        GERENCIAMENTO
                    </span>

                    <h2>Registros</h2>

                    <p>
                        Acompanhe as retiradas e devoluções de salas da sua empresa.
                    </p>
                </div>

                <div className="registros-header-actions">
                    <button
                        className={`registros-refresh ${atualizando ? 'is-loading' : ''}`}
                        onClick={() => buscarDados(true)}
                        disabled={atualizando}
                        title="Atualizar registros"
                    >
                        <i className="bi bi-arrow-clockwise"></i>
                        Atualizar
                    </button>

                    <button
                        className="registros-primary-button"
                        onClick={abrirModal}
                    >
                        <i className="bi bi-plus-lg"></i>
                        Nova retirada
                    </button>
                </div>
            </section>

            {erro && (
                <div className="registros-refresh-error">
                    <i className="bi bi-exclamation-circle"></i>
                    {erro}
                </div>
            )}

            {/* Indicadores */}
            <section className="dashboard-stats registros-stats">
                <article className="stat-card">
                    <div className="stat-card-top">
                        <span>Total de registros</span>
                        <div className="stat-icon">
                            <i className="bi bi-journal-text"></i>
                        </div>
                    </div>

                    <strong className="stat-value">{registros.length}</strong>
                    <span className="stat-description">Movimentações registradas</span>
                </article>

                <article className="stat-card">
                    <div className="stat-card-top">
                        <span>Retiradas ativas</span>
                        <div className="stat-icon">
                            <i className="bi bi-arrow-left-right"></i>
                        </div>
                    </div>

                    <strong className="stat-value">{totalAtivos}</strong>
                    <span className="stat-description">Aguardando devolução</span>
                </article>

                <article className="stat-card">
                    <div className="stat-card-top">
                        <span>Devoluções</span>
                        <div className="stat-icon">
                            <i className="bi bi-check-circle"></i>
                        </div>
                    </div>

                    <strong className="stat-value">{totalDevolvidos}</strong>
                    <span className="stat-description">Retiradas finalizadas</span>
                </article>

                <article className="stat-card">
                    <div className="stat-card-top">
                        <span>Salas disponíveis</span>
                        <div className="stat-icon">
                            <i className="bi bi-door-open"></i>
                        </div>
                    </div>

                    <strong className="stat-value">{salasDisponiveis.length}</strong>
                    <span className="stat-description">Disponíveis para retirada</span>
                </article>
            </section>

            {/* Histórico */}
            <section className="dashboard-panel registros-panel">
                <div className="panel-header registros-panel-header">
                    <div>
                        <h3>Histórico de movimentações</h3>
                        <p>
                            {isAdmin
                                ? 'Visualize todas as movimentações da empresa.'
                                : 'Visualize suas retiradas e devoluções.'}
                        </p>
                    </div>

                    <span className="registros-total-label">
                        {registrosFiltrados.length} resultado(s)
                    </span>
                </div>

                {/* Filtros */}
                <div className="registros-filters">
                    <div className="registros-search">
                        <i className="bi bi-search"></i>

                        <input
                            type="search"
                            placeholder="Buscar responsável, sala ou setor..."
                            value={busca}
                            onChange={(event) => setBusca(event.target.value)}
                        />

                        {busca && (
                            <button
                                onClick={() => setBusca('')}
                                aria-label="Limpar pesquisa"
                            >
                                <i className="bi bi-x"></i>
                            </button>
                        )}
                    </div>

                    <select
                        value={filtroStatus}
                        onChange={(event) => setFiltroStatus(event.target.value)}
                        aria-label="Filtrar por status"
                    >
                        <option value="todos">Todos os status</option>
                        <option value="retirada">Retirada ativa</option>
                        <option value="devolvida">Devolvida</option>
                    </select>

                    <select
                        value={filtroTurno}
                        onChange={(event) => setFiltroTurno(event.target.value)}
                        aria-label="Filtrar por turno"
                    >
                        <option value="todos">Todos os turnos</option>
                        <option value="M">Matutino</option>
                        <option value="T">Vespertino</option>
                        <option value="N">Noturno</option>
                    </select>

                    <select
                        value={filtroSala}
                        onChange={(event) => setFiltroSala(event.target.value)}
                        aria-label="Filtrar por sala"
                    >
                        <option value="todos">Todas as salas</option>
                        {salas.map((sala) => (
                            <option key={sala.id_sala} value={String(sala.id_sala)}>
                                {sala.nome}
                            </option>
                        ))}
                    </select>

                    <select
                        value={filtroSetor}
                        onChange={(event) => setFiltroSetor(event.target.value)}
                        aria-label="Filtrar por setor"
                    >
                        <option value="todos">Todos os setores</option>
                        {setores.map((setor) => (
                            <option key={setor.id_setor} value={String(setor.id_setor)}>
                                {setor.nome}
                            </option>
                        ))}
                    </select>

                    {possuiFiltros && (
                        <button
                            className="registros-clear-filters"
                            onClick={limparFiltros}
                        >
                            <i className="bi bi-x-circle"></i>
                            Limpar
                        </button>
                    )}
                </div>

                {/* Tabela */}
                {registrosFiltrados.length > 0 ? (
                    <div className="registros-table-wrapper">
                        <table className="registros-table">
                            <thead>
                                <tr>
                                    <th>Responsável</th>
                                    <th>Sala / Setor</th>
                                    <th>Turno</th>
                                    <th>Data</th>
                                    <th>Horário</th>
                                    <th>Status</th>
                                    <th>Ações</th>
                                </tr>
                            </thead>

                            <tbody>
                                {registrosFiltrados.map((registro) => (
                                    <tr key={registro.id_registro}>
                                        <td>
                                            <div className="registro-user-cell">
                                                <div className="registro-user-avatar">
                                                    {(registro.responsavel || 'U')
                                                        .charAt(0)
                                                        .toUpperCase()}
                                                </div>

                                                <div>
                                                    <strong>{registro.responsavel}</strong>
                                                    <span>
                                                        {registro.nome_usuario || 'Usuário'}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>

                                        <td>
                                            <div className="registro-location-cell">
                                                <strong>{registro.nome_sala}</strong>
                                                <span>{registro.nome_setor}</span>
                                            </div>
                                        </td>

                                        <td>
                                            <span className="registro-shift">
                                                {nomeTurno(registro.turno)}
                                            </span>
                                        </td>

                                        <td>
                                            <span className="registro-date">
                                                {formatarData(registro.data_retirada)}
                                            </span>
                                        </td>

                                        <td>
                                            <div className="registro-time-cell">
                                                <span>
                                                    <i className="bi bi-box-arrow-up-right"></i>
                                                    {formatarHora(registro.hora_retirada)}
                                                </span>

                                                <span>
                                                    <i className="bi bi-box-arrow-in-down-left"></i>
                                                    {formatarHora(registro.hora_entrega)}
                                                </span>
                                            </div>
                                        </td>

                                        <td>
                                            <span className={`registro-status ${
                                                registro.status === 'retirada'
                                                    ? 'status-active'
                                                    : 'status-returned'
                                            }`}>
                                                <i className="bi bi-circle-fill"></i>
                                                {nomeStatus(registro.status)}
                                            </span>
                                        </td>

                                        <td>
                                            <div className="registro-actions">
                                                <button
                                                    className="registro-icon-button"
                                                    onClick={() => setRegistroSelecionado(registro)}
                                                    title="Ver detalhes"
                                                    aria-label="Ver detalhes"
                                                >
                                                    <i className="bi bi-eye"></i>
                                                </button>

                                                {registro.status === 'retirada' && (
                                                    <button
                                                        className="registro-return-button"
                                                        onClick={() => registrarDevolucao(registro)}
                                                        disabled={devolvendo === registro.id_registro}
                                                        title="Registrar devolução"
                                                    >
                                                        {devolvendo === registro.id_registro ? (
                                                            <i className="bi bi-arrow-repeat"></i>
                                                        ) : (
                                                            <i className="bi bi-check2"></i>
                                                        )}
                                                        <span>Devolver</span>
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="registros-empty">
                        <div className="registros-empty-icon">
                            <i className="bi bi-journal-x"></i>
                        </div>

                        <h3>
                            {registros.length === 0
                                ? 'Nenhum registro encontrado'
                                : 'Nenhum resultado para os filtros'}
                        </h3>

                        <p>
                            {registros.length === 0
                                ? 'As retiradas e devoluções aparecerão aqui.'
                                : 'Experimente alterar os filtros ou a pesquisa.'}
                        </p>

                        {possuiFiltros && (
                            <button onClick={limparFiltros}>
                                Limpar filtros
                            </button>
                        )}
                    </div>
                )}
            </section>

            {/* Modal de nova retirada */}
            {modalAberto && (
                <div
                    className="registros-modal-overlay"
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget) fecharModal();
                    }}
                >
                    <section
                        className="registros-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="retirada-modal-title"
                    >
                        <div className="registros-modal-header">
                            <div>
                                <span className="registros-eyebrow">
                                    NOVA MOVIMENTAÇÃO
                                </span>

                                <h2 id="retirada-modal-title">Registrar retirada</h2>

                                <p>Preencha os dados para registrar uma nova retirada.</p>
                            </div>

                            <button
                                className="registros-modal-close"
                                onClick={fecharModal}
                                disabled={salvando}
                                aria-label="Fechar modal"
                            >
                                <i className="bi bi-x-lg"></i>
                            </button>
                        </div>

                        <form
                            onSubmit={registrarRetirada}
                            onInvalidCapture={avisarFormularioInvalido}
                        >
                            <div className="registros-form-grid">
                                <label className="registros-form-field">
                                    <span>Setor</span>

                                    <select
                                        required
                                        value={formulario.id_setor}
                                        onChange={(event) =>
                                            atualizarFormulario('id_setor', event.target.value)
                                        }
                                    >
                                        <option value="">Selecione um setor</option>

                                        {setores.map((setor) => (
                                            <option
                                                key={setor.id_setor}
                                                value={setor.id_setor}
                                            >
                                                {setor.nome}
                                            </option>
                                        ))}
                                    </select>
                                </label>

                                <label className="registros-form-field">
                                    <span>Sala</span>

                                    <select
                                        required
                                        value={formulario.id_sala}
                                        onChange={(event) =>
                                            atualizarFormulario('id_sala', event.target.value)
                                        }
                                    >
                                        <option value="">Selecione uma sala</option>

                                        {salasDisponiveis.map((sala) => (
                                            <option
                                                key={sala.id_sala}
                                                value={sala.id_sala}
                                            >
                                                {sala.nome}
                                            </option>
                                        ))}
                                    </select>

                                    {salasDisponiveis.length === 0 && (
                                        <small>
                                            Nenhuma sala está disponível no momento.
                                        </small>
                                    )}
                                </label>

                                <label className="registros-form-field registros-form-full">
                                    <span>Responsável</span>

                                    <input
                                        type="text"
                                        placeholder="Nome de quem está retirando"
                                        maxLength={100}
                                        minLength={2}
                                        required
                                        value={formulario.responsavel}
                                        onChange={(event) =>
                                            atualizarFormulario('responsavel', event.target.value)
                                        }
                                    />
                                </label>

                                <label className="registros-form-field">
                                    <span>Turno</span>

                                    <select
                                        value={formulario.turno}
                                        onChange={(event) =>
                                            atualizarFormulario('turno', event.target.value)
                                        }
                                    >
                                        <option value="M">Matutino</option>
                                        <option value="T">Vespertino</option>
                                        <option value="N">Noturno</option>
                                    </select>
                                </label>

                                <label className="registros-form-field">
                                    <span>Data da retirada</span>

                                    <input
                                        type="date"
                                        required
                                        value={formulario.data_retirada}
                                        onChange={(event) =>
                                            atualizarFormulario('data_retirada', event.target.value)
                                        }
                                    />
                                </label>

                                <label className="registros-form-field registros-form-full">
                                    <span>Horário da retirada</span>

                                    <input
                                        type="time"
                                        required
                                        value={formulario.hora_retirada}
                                        onChange={(event) =>
                                            atualizarFormulario('hora_retirada', event.target.value)
                                        }
                                    />
                                </label>
                            </div>

                            <div className="registros-modal-footer">
                                <button
                                    type="button"
                                    className="registros-secondary-button"
                                    onClick={fecharModal}
                                    disabled={salvando}
                                >
                                    Cancelar
                                </button>

                                <button
                                    type="submit"
                                    className="registros-primary-button"
                                    disabled={
                                        salvando ||
                                        !salasDisponiveis.length ||
                                        !setores.length
                                    }
                                >
                                    {salvando ? (
                                        <>
                                            <i className="bi bi-arrow-repeat"></i>
                                            Registrando...
                                        </>
                                    ) : (
                                        <>
                                            <i className="bi bi-check2"></i>
                                            Confirmar retirada
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </section>
                </div>
            )}

            {/* Modal de detalhes */}
            {registroSelecionado && (
                <div
                    className="registros-modal-overlay"
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget) {
                            setRegistroSelecionado(null);
                        }
                    }}
                >
                    <section
                        className="registros-modal registros-details-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="registro-details-title"
                    >
                        <div className="registros-modal-header">
                            <div>
                                <span className="registros-eyebrow">
                                    REGISTRO #{registroSelecionado.id_registro}
                                </span>

                                <h2 id="registro-details-title">Detalhes da movimentação</h2>
                                <p>Informações da retirada e da devolução.</p>
                            </div>

                            <button
                                className="registros-modal-close"
                                onClick={() => setRegistroSelecionado(null)}
                                aria-label="Fechar detalhes"
                            >
                                <i className="bi bi-x-lg"></i>
                            </button>
                        </div>

                        <div className="registro-details-status">
                            <span className={`registro-status ${
                                registroSelecionado.status === 'retirada'
                                    ? 'status-active'
                                    : 'status-returned'
                            }`}>
                                <i className="bi bi-circle-fill"></i>
                                {nomeStatus(registroSelecionado.status)}
                            </span>
                        </div>

                        <div className="registro-details-grid">
                            <div>
                                <span>Responsável</span>
                                <strong>{registroSelecionado.responsavel || '--'}</strong>
                            </div>

                            <div>
                                <span>Registrado por</span>
                                <strong>{registroSelecionado.nome_usuario || '--'}</strong>
                            </div>

                            <div>
                                <span>Sala</span>
                                <strong>{registroSelecionado.nome_sala || '--'}</strong>
                            </div>

                            <div>
                                <span>Setor</span>
                                <strong>{registroSelecionado.nome_setor || '--'}</strong>
                            </div>

                            <div>
                                <span>Turno</span>
                                <strong>{nomeTurno(registroSelecionado.turno)}</strong>
                            </div>

                            <div>
                                <span>Data da retirada</span>
                                <strong>{formatarData(registroSelecionado.data_retirada)}</strong>
                            </div>

                            <div>
                                <span>Horário da retirada</span>
                                <strong>{formatarHora(registroSelecionado.hora_retirada)}</strong>
                            </div>

                            <div>
                                <span>Horário da devolução</span>
                                <strong>{formatarHora(registroSelecionado.hora_entrega)}</strong>
                            </div>

                            <div className="registro-details-full">
                                <span>Criado em</span>
                                <strong>{formatarDataHora(registroSelecionado.created_at)}</strong>
                            </div>
                        </div>

                        <div className="registros-modal-footer">
                            <button
                                className="registros-secondary-button"
                                onClick={() => setRegistroSelecionado(null)}
                            >
                                Fechar
                            </button>

                            {registroSelecionado.status === 'retirada' && (
                                <button
                                    className="registros-primary-button"
                                    onClick={() => registrarDevolucao(registroSelecionado)}
                                    disabled={devolvendo === registroSelecionado.id_registro}
                                >
                                    <i className="bi bi-check2"></i>
                                    Registrar devolução
                                </button>
                            )}
                        </div>
                    </section>
                </div>
            )}

        </div>
    );
}

export default Registros;
