
import { useCallback, useEffect, useMemo, useState } from "react";
import  api  from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import "./Reservas.css";

const TURNOS = [
    { value: "M", label: "Manhã", horario: "07h às 12h" },
    { value: "T", label: "Tarde", horario: "13h às 18h" },
    { value: "N", label: "Noite", horario: "18h às 22h" },
];

const STATUS = {
    pendente: { label: "Pendente", className: "pendente" },
    aprovada: { label: "Aprovada", className: "aprovada" },
    recusada: { label: "Recusada", className: "recusada" },
    cancelada: { label: "Cancelada", className: "cancelada" },
    concluida: { label: "Concluída", className: "concluida" },
};

function dataLocalAtual() {
    const agora = new Date();
    const ano = agora.getFullYear();
    const mes = String(agora.getMonth() + 1).padStart(2, "0");
    const dia = String(agora.getDate()).padStart(2, "0");

    return `${ano}-${mes}-${dia}`;
}

function formatarData(data) {
    if (!data) return "—";

    const valor = String(data).slice(0, 10);
    const [ano, mes, dia] = valor.split("-");

    if (!ano || !mes || !dia) return "—";

    return `${dia}/${mes}/${ano}`;
}

function obterTurnos(turnos) {
    if (!turnos) return [];

    if (Array.isArray(turnos)) return turnos;

    return String(turnos)
        .split(",")
        .map((turno) => turno.trim())
        .filter(Boolean);
}

function Icone({ nome, className = "" }) {
    return (
        <i
            className={`bi ${nome} ${className}`}
            aria-hidden="true"
        />
    );
}

export default function Reservas() {
    const { usuario } = useAuth();
    const { mostrarToast } = useToast();

    const isAdmin = usuario?.role === "admin";

    const [reservas, setReservas] = useState([]);
    const [salas, setSalas] = useState([]);

    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState(false);

    const [filtroStatus, setFiltroStatus] = useState("todas");
    const [busca, setBusca] = useState("");

    const [modalAberto, setModalAberto] = useState(false);
    const [salvando, setSalvando] = useState(false);

    const [formulario, setFormulario] = useState({
        id_sala: "",
        titulo: "",
        descricao: "",
        data_inicio: dataLocalAtual(),
        data_fim_prevista: dataLocalAtual(),
        turnos: ["M"],
    });

    const carregarReservas = useCallback(async () => {
        try {
            setCarregando(true);
            setErro(false);

            const resposta = await api.get(
                isAdmin ? "/reservas" : "/reservas/minhas"
            );

            setReservas(resposta.reservas || []);
        } catch (error) {
            console.error("Erro ao carregar reservas:", error);
            setErro(true);
            mostrarToast("Não foi possível carregar as reservas.", "error");
        } finally {
            setCarregando(false);
        }
    }, [isAdmin, mostrarToast]);

    const carregarSalas = useCallback(async () => {
        try {
            const resposta = await api.get("/salas");
            setSalas(resposta.salas || []);
        } catch (error) {
            console.error("Erro ao carregar salas:", error);
            mostrarToast("Não foi possível carregar as salas.", "error");
        }
    }, [mostrarToast]);

    useEffect(() => {
        carregarReservas();
        carregarSalas();
    }, [carregarReservas, carregarSalas]);

    const reservasFiltradas = useMemo(() => {
        return reservas.filter((reserva) => {
            const correspondeStatus =
                filtroStatus === "todas" ||
                reserva.status === filtroStatus;

            const termo = busca.toLowerCase().trim();

            const correspondeBusca =
                !termo ||
                reserva.titulo?.toLowerCase().includes(termo) ||
                reserva.nome_sala?.toLowerCase().includes(termo) ||
                reserva.nome_solicitante?.toLowerCase().includes(termo);

            return correspondeStatus && correspondeBusca;
        });
    }, [reservas, filtroStatus, busca]);

    const estatisticas = useMemo(() => ({
        total: reservas.length,
        pendentes: reservas.filter((r) => r.status === "pendente").length,
        aprovadas: reservas.filter((r) => r.status === "aprovada").length,
        concluidas: reservas.filter((r) => r.status === "concluida").length,
    }), [reservas]);

    function atualizarCampo(campo, valor) {
        setFormulario((anterior) => ({
            ...anterior,
            [campo]: valor,
        }));
    }

    function alternarTurno(turno) {
        setFormulario((anterior) => {
            const selecionados = anterior.turnos.includes(turno)
                ? anterior.turnos.filter((item) => item !== turno)
                : [...anterior.turnos, turno];

            return {
                ...anterior,
                turnos: selecionados,
            };
        });
    }

    function abrirModal() {
        setFormulario({
            id_sala: "",
            titulo: "",
            descricao: "",
            data_inicio: dataLocalAtual(),
            data_fim_prevista: dataLocalAtual(),
            turnos: ["M"],
        });

        setModalAberto(true);
    }

    function fecharModal() {
        if (salvando) return;
        setModalAberto(false);
    }

    async function solicitarReserva(event) {
        event.preventDefault();

        if (!formulario.id_sala) {
            mostrarToast("Selecione uma sala.", "warning");
            return;
        }

        if (formulario.turnos.length === 0) {
            mostrarToast("Selecione pelo menos um turno.", "warning");
            return;
        }

        if (formulario.data_fim_prevista < formulario.data_inicio) {
            mostrarToast(
                "A data final não pode ser anterior à inicial.",
                "warning"
            );
            return;
        }

        try {
            setSalvando(true);

            const resposta = await api.post("/reservas", {
                id_sala: Number(formulario.id_sala),
                titulo: formulario.titulo.trim(),
                descricao: formulario.descricao.trim(),
                data_inicio: formulario.data_inicio,
                data_fim_prevista: formulario.data_fim_prevista,
                turnos: formulario.turnos,
            });

            mostrarToast(
                resposta.mensagem || "Solicitação enviada com sucesso!",
                "success"
            );

            setModalAberto(false);
            await carregarReservas();
        } catch (error) {
            console.error("Erro ao solicitar reserva:", error);

            mostrarToast(
                error.message || "Não foi possível solicitar a reserva.",
                "error"
            );
        } finally {
            setSalvando(false);
        }
    }

    function renderizarTurnos(turnos) {
        const selecionados = obterTurnos(turnos);

        return (
            <div className="reserva-turnos-lista">
                {selecionados.map((turno) => (
                    <span className="reserva-turno-tag" key={turno}>
                        {turno}
                    </span>
                ))}
            </div>
        );
    }

    return (
        <main className="reservas-page">

            {/* CABEÇALHO */}
            <header className="reservas-header">
                <div>
                    <span className="reservas-eyebrow">
                        <Icone nome="bi-calendar2-check" />
                        GESTÃO DE ESPAÇOS
                    </span>

                    <h1>Reservas</h1>

                    <p>
                        {isAdmin
                            ? "Gerencie as solicitações e acompanhe as reservas da sua empresa."
                            : "Solicite espaços e acompanhe suas reservas."}
                    </p>
                </div>

                <button
                    className="reserva-btn-primary"
                    onClick={abrirModal}
                >
                    <Icone nome="bi-plus-lg" />
                    Nova reserva
                </button>
            </header>

            {/* INDICADORES */}
            <section className="reservas-stats">
                <article className="reserva-stat-card">
                    <div className="reserva-stat-icon">
                        <Icone nome="bi-calendar3" />
                    </div>

                    <div>
                        <span>Total de reservas</span>
                        <strong>{estatisticas.total}</strong>
                    </div>
                </article>

                <article className="reserva-stat-card">
                    <div className="reserva-stat-icon pendente">
                        <Icone nome="bi-hourglass-split" />
                    </div>

                    <div>
                        <span>Pendentes</span>
                        <strong>{estatisticas.pendentes}</strong>
                    </div>
                </article>

                <article className="reserva-stat-card">
                    <div className="reserva-stat-icon aprovada">
                        <Icone nome="bi-check2-circle" />
                    </div>

                    <div>
                        <span>Aprovadas</span>
                        <strong>{estatisticas.aprovadas}</strong>
                    </div>
                </article>

                <article className="reserva-stat-card">
                    <div className="reserva-stat-icon concluida">
                        <Icone nome="bi-calendar2-check" />
                    </div>

                    <div>
                        <span>Concluídas</span>
                        <strong>{estatisticas.concluidas}</strong>
                    </div>
                </article>
            </section>

            {/* CONTEÚDO */}
            <section className="reservas-content">

                <div className="reservas-content-header">
                    <div>
                        <h2>{isAdmin ? "Reservas da empresa" : "Minhas reservas"}</h2>
                        <p>
                            Acompanhe os períodos e o andamento das solicitações.
                        </p>
                    </div>

                    <span className="reservas-total-label">
                        {reservasFiltradas.length} resultado(s)
                    </span>
                </div>

                {/* FILTROS */}
                <div className="reservas-toolbar">
                    <div className="reservas-search">
                        <Icone nome="bi-search" />

                        <input
                            type="search"
                            placeholder="Buscar por título ou sala..."
                            value={busca}
                            onChange={(e) => setBusca(e.target.value)}
                        />
                    </div>

                    <select
                        value={filtroStatus}
                        onChange={(e) => setFiltroStatus(e.target.value)}
                        aria-label="Filtrar reservas por status"
                    >
                        <option value="todas">Todos os status</option>
                        <option value="pendente">Pendentes</option>
                        <option value="aprovada">Aprovadas</option>
                        <option value="recusada">Recusadas</option>
                        <option value="cancelada">Canceladas</option>
                        <option value="concluida">Concluídas</option>
                    </select>

                    <button
                        className="reserva-btn-icon"
                        onClick={carregarReservas}
                        title="Atualizar reservas"
                        aria-label="Atualizar reservas"
                    >
                        <Icone nome="bi-arrow-clockwise" />
                    </button>
                </div>

                {/* LISTAGEM */}
                {carregando ? (
                    <div className="reservas-feedback">
                        <span className="reservas-spinner" />
                        <p>Carregando reservas...</p>
                    </div>
                ) : erro ? (
                    <div className="reservas-feedback">
                        <Icone nome="bi-exclamation-circle" />
                        <h3>Não foi possível carregar os dados</h3>
                        <p>Verifique sua conexão e tente novamente.</p>

                        <button
                            className="reserva-btn-secondary"
                            onClick={carregarReservas}
                        >
                            Tentar novamente
                        </button>
                    </div>
                ) : reservasFiltradas.length === 0 ? (
                    <div className="reservas-empty">
                        <div className="reservas-empty-icon">
                            <Icone nome="bi-calendar2-x" />
                        </div>

                        <h3>
                            {reservas.length === 0
                                ? "Nenhuma reserva por aqui"
                                : "Nenhum resultado encontrado"}
                        </h3>

                        <p>
                            {reservas.length === 0
                                ? "Comece solicitando uma reserva para um dos espaços disponíveis."
                                : "Tente alterar os filtros ou o termo da busca."}
                        </p>

                        {reservas.length === 0 && (
                            <button
                                className="reserva-btn-primary"
                                onClick={abrirModal}
                            >
                                <Icone nome="bi-plus-lg" />
                                Solicitar reserva
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="reservas-table-wrapper">
                        <table className="reservas-table">
                            <thead>
                                <tr>
                                    <th>Reserva</th>
                                    {isAdmin && <th>Solicitante</th>}
                                    <th>Período</th>
                                    <th>Turnos</th>
                                    <th>Status</th>
                                    <th>Solicitada em</th>
                                    <th />
                                </tr>
                            </thead>

                            <tbody>
                                {reservasFiltradas.map((reserva) => {
                                    const status =
                                        STATUS[reserva.status] || STATUS.pendente;

                                    return (
                                        <tr key={reserva.id_reserva}>
                                            <td>
                                                <div className="reserva-table-title">
                                                    <strong>{reserva.titulo}</strong>
                                                    <span>
                                                        {reserva.nome_sala}
                                                    </span>
                                                </div>
                                            </td>

                                            {isAdmin && (
                                                <td>
                                                    <span className="reserva-solicitante">
                                                        {reserva.nome_solicitante || "—"}
                                                    </span>
                                                </td>
                                            )}

                                            <td>
                                                <div className="reserva-periodo">
                                                    <span>
                                                        {formatarData(reserva.data_inicio)}
                                                    </span>
                                                    <Icone nome="bi-arrow-right" />
                                                    <span>
                                                        {formatarData(reserva.data_fim_prevista)}
                                                    </span>
                                                </div>
                                            </td>

                                            <td>
                                                {renderizarTurnos(reserva.turnos)}
                                            </td>

                                            <td>
                                                <span className={`reserva-status ${status.className}`}>
                                                    <span />
                                                    {status.label}
                                                </span>
                                            </td>

                                            <td>
                                                <span className="reserva-data-criacao">
                                                    {formatarData(reserva.created_at)}
                                                </span>
                                            </td>

                                            <td>
                                                <button
                                                    className="reserva-btn-icon"
                                                    title="Detalhes em breve"
                                                    aria-label={`Detalhes da reserva ${reserva.titulo}`}
                                                    disabled
                                                >
                                                    <Icone nome="bi-three-dots" />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            {/* MODAL DE NOVA RESERVA */}
            {modalAberto && (
                <div
                    className="reserva-modal-overlay"
                    onMouseDown={(e) => {
                        if (e.target === e.currentTarget) fecharModal();
                    }}
                >
                    <section
                        className="reserva-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="reserva-modal-title"
                    >
                        <header className="reserva-modal-header">
                            <div>
                                <span className="reservas-eyebrow">
                                    NOVA SOLICITAÇÃO
                                </span>

                                <h2 id="reserva-modal-title">
                                    Solicitar reserva
                                </h2>

                                <p>
                                    Preencha os dados para solicitar a utilização de uma sala.
                                </p>
                            </div>

                            <button
                                type="button"
                                className="reserva-modal-close"
                                onClick={fecharModal}
                                disabled={salvando}
                                aria-label="Fechar modal"
                            >
                                <Icone nome="bi-x-lg" />
                            </button>
                        </header>

                        <form onSubmit={solicitarReserva}>
                            <div className="reserva-form-group">
                                <label htmlFor="reserva-titulo">
                                    Título da reserva
                                </label>

                                <input
                                    id="reserva-titulo"
                                    type="text"
                                    placeholder="Ex.: Aula de informática"
                                    minLength={3}
                                    maxLength={150}
                                    value={formulario.titulo}
                                    onChange={(e) =>
                                        atualizarCampo("titulo", e.target.value)
                                    }
                                    required
                                />
                            </div>

                            <div className="reserva-form-group">
                                <label htmlFor="reserva-sala">
                                    Sala
                                </label>

                                <select
                                    id="reserva-sala"
                                    value={formulario.id_sala}
                                    onChange={(e) =>
                                        atualizarCampo("id_sala", e.target.value)
                                    }
                                    required
                                >
                                    <option value="">Selecione uma sala</option>

                                    {salas
                                        .filter((sala) => sala.status === "disponivel")
                                        .map((sala) => (
                                            <option
                                                key={sala.id_sala}
                                                value={sala.id_sala}
                                            >
                                                {sala.nome}
                                            </option>
                                        ))}
                                </select>

                                {salas.filter((sala) => sala.status === "disponivel").length === 0 && (
                                    <small className="reserva-form-hint">
                                        Nenhuma sala disponível para seleção no momento.
                                    </small>
                                )}
                            </div>

                            <div className="reserva-form-row">
                                <div className="reserva-form-group">
                                    <label htmlFor="reserva-data-inicio">
                                        Data inicial
                                    </label>

                                    <input
                                        id="reserva-data-inicio"
                                        type="date"
                                        min={dataLocalAtual()}
                                        value={formulario.data_inicio}
                                        onChange={(e) =>
                                            atualizarCampo("data_inicio", e.target.value)
                                        }
                                        required
                                    />
                                </div>

                                <div className="reserva-form-group">
                                    <label htmlFor="reserva-data-fim">
                                        Data final
                                    </label>

                                    <input
                                        id="reserva-data-fim"
                                        type="date"
                                        min={formulario.data_inicio || dataLocalAtual()}
                                        value={formulario.data_fim_prevista}
                                        onChange={(e) =>
                                            atualizarCampo("data_fim_prevista", e.target.value)
                                        }
                                        required
                                    />
                                </div>
                            </div>

                            <div className="reserva-form-group">
                                <label>Turnos de utilização</label>

                                <div className="reserva-turnos-options">
                                    {TURNOS.map((turno) => {
                                        const selecionado =
                                            formulario.turnos.includes(turno.value);

                                        return (
                                            <button
                                                type="button"
                                                key={turno.value}
                                                className={`reserva-turno-option ${selecionado ? "selected" : ""}`}
                                                onClick={() => alternarTurno(turno.value)}
                                                aria-pressed={selecionado}
                                            >
                                                <span className="reserva-turno-checkbox">
                                                    {selecionado && (
                                                        <Icone nome="bi-check-lg" />
                                                    )}
                                                </span>

                                                <span>
                                                    <strong>{turno.label}</strong>
                                                    <small>{turno.horario}</small>
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="reserva-form-group">
                                <label htmlFor="reserva-descricao">
                                    Descrição
                                    <span className="reserva-label-optional">
                                        Opcional
                                    </span>
                                </label>

                                <textarea
                                    id="reserva-descricao"
                                    placeholder="Explique brevemente a finalidade da reserva..."
                                    rows={3}
                                    value={formulario.descricao}
                                    onChange={(e) =>
                                        atualizarCampo("descricao", e.target.value)
                                    }
                                />
                            </div>

                            <div className="reserva-modal-info">
                                <Icone nome="bi-info-circle" />
                                <span>
                                    Sua solicitação será enviada para aprovação do administrador.
                                </span>
                            </div>

                            <footer className="reserva-modal-footer">
                                <button
                                    type="button"
                                    className="reserva-btn-secondary"
                                    onClick={fecharModal}
                                    disabled={salvando}
                                >
                                    Cancelar
                                </button>

                                <button
                                    type="submit"
                                    className="reserva-btn-primary"
                                    disabled={salvando || salas.filter((sala) => sala.status === "disponivel").length === 0}
                                >
                                    {salvando ? (
                                        <>
                                            <span className="reserva-btn-spinner" />
                                            Enviando...
                                        </>
                                    ) : (
                                        <>
                                            <Icone nome="bi-send" />
                                            Enviar solicitação
                                        </>
                                    )}
                                </button>
                            </footer>
                        </form>
                    </section>
                </div>
            )}
        </main>
    );
}
