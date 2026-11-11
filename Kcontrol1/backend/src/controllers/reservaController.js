
import reservaModel from "../models/reservaModel.js";
import reservaService from "../services/reservaService.js";
import reservaHistoricoModel from "../models/reservaHistoricoModel.js";

const errosReserva = {
    RESERVA_NAO_ENCONTRADA: [404, "Reserva não encontrada."],
    RESERVA_NAO_ESTA_PENDENTE: [409, "Esta reserva não está pendente."],
    RESERVA_NAO_ESTA_APROVADA: [409, "Esta reserva não está aprovada."],
    RESERVA_AINDA_NAO_INICIOU: [409, "Esta reserva ainda não começou."],
    SALA_NAO_ENCONTRADA: [404, "Sala não encontrada."],
    SALA_INDISPONIVEL: [409, "Esta sala não está disponível."],
    SALA_COM_RETIRADA_ATIVA: [409, "Existe uma retirada ativa nesta sala. Registre a devolução antes de disponibilizá-la."],
    RESERVA_EM_CONFLITO: [409, "Já existe uma reserva aprovada para esta sala, período e turno."],
    DATA_EXTENSAO_INVALIDA: [400, "A nova data precisa ser posterior à data atual de término."],
    EXTENSAO_PENDENTE_EXISTENTE: [409, "Já existe uma solicitação de extensão pendente."],
    EXTENSAO_NAO_ENCONTRADA: [404, "Solicitação de extensão não encontrada."],
    EXTENSAO_JA_ANALISADA: [409, "Esta solicitação de extensão já foi analisada."],
    EXTENSAO_DESATUALIZADA: [409, "A reserva foi alterada desde a solicitação desta extensão."],
    RESERVA_NAO_PODE_SER_CANCELADA: [409, "Esta reserva não pode ser cancelada."],
    MOTIVO_CANCELAMENTO_OBRIGATORIO: [400, "Informe o motivo do cancelamento."],
    PERIODO_MANUTENCAO_INVALIDO: [400, "O período da manutenção é inválido ou está fora da reserva."],
    TURNOS_MANUTENCAO_INVALIDOS: [400, "Os turnos informados não pertencem à reserva."],
    MANUTENCAO_EM_CONFLITO: [409, "Já existe uma manutenção agendada neste período e turno."],
    RESERVA_CONFLITA_COM_RETIRADA: [409, "Não é possível aprovar: existem retiradas registradas nesta sala durante o período e os turnos selecionados."
],
};

function responderErro(res, error, mensagemPadrao) {
    console.error(error);

    const erro = errosReserva[error.message];

    if (erro) {
        return res.status(erro[0]).json({ mensagem: erro[1] });
    }

    return res.status(500).json({ mensagem: mensagemPadrao });
}

function validarId(valor) {
    const id = Number(valor);
    return Number.isSafeInteger(id) && id > 0 ? id : null;
}

function validarData(data) {
    if (typeof data !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(data)) {
        return false;
    }

    const dataObj = new Date(`${data}T00:00:00Z`);

    return !Number.isNaN(dataObj.getTime()) &&
        dataObj.toISOString().slice(0, 10) === data;
}

const reservaController = {
    // Solicitar uma reserva
    async criar(req, res) {
        try {
            const {
                id_sala,
                titulo,
                descricao,
                data_inicio,
                data_fim_prevista,
                turnos
            } = req.body;

            const salaId = validarId(id_sala);

            if (!salaId) {
                return res.status(400).json({ mensagem: "Informe uma sala válida." });
            }

            if (
                typeof titulo !== "string" ||
                titulo.trim().length < 3 ||
                titulo.trim().length > 150
            ) {
                return res.status(400).json({ mensagem: "Informe um título entre 3 e 150 caracteres." });
            }

            if (!validarData(data_inicio) || !validarData(data_fim_prevista)) {
                return res.status(400).json({ mensagem: "Informe datas válidas no formato AAAA-MM-DD." });
            }

            if (data_fim_prevista < data_inicio) {
                return res.status(400).json({ mensagem: "A data final não pode ser anterior à inicial." });
            }

            if (
                !Array.isArray(turnos) ||
                turnos.length === 0 ||
                turnos.some(turno => !["M", "T", "N"].includes(turno)) ||
                new Set(turnos).size !== turnos.length
            ) {
                return res.status(400).json({ mensagem: "Selecione ao menos um turno válido: M, T ou N." });
            }

            if (descricao !== undefined && typeof descricao !== "string") {
                return res.status(400).json({ mensagem: "Descrição inválida." });
            }

            const id_reserva = await reservaModel.criar({
                id_empresa: req.user.id_empresa,
                id_sala: salaId,
                id_solicitante: req.user.id_usuario,
                titulo: titulo.trim(),
                descricao: descricao?.trim() || null,
                data_inicio,
                data_fim_prevista,
                turnos
            });

            return res.status(201).json({
                mensagem: "Solicitação de reserva enviada com sucesso.",
                id_reserva
            });
        } catch (error) {
            return responderErro(res, error, "Erro ao solicitar reserva.");
        }
    },

    // Listar todas as reservas da empresa (admin)
    async listar(req, res) {
        try {
            const reservas = await reservaModel.listar(req.user.id_empresa);
            return res.status(200).json({ reservas });
        } catch (error) {
            return responderErro(res, error, "Erro ao listar reservas.");
        }
    },

    // Listar reservas do usuário autenticado
    async listarMinhas(req, res) {
        try {
            const reservas = await reservaModel.listarMinhas(
                req.user.id_empresa,
                req.user.id_usuario
            );

            return res.status(200).json({ reservas });
        } catch (error) {
            return responderErro(res, error, "Erro ao listar suas reservas.");
        }
    },

    // Consultar uma reserva específica
    async buscarPorId(req, res) {
        try {
            const id = validarId(req.params.id);

            if (!id) {
                return res.status(400).json({ mensagem: "ID da reserva inválido." });
            }

            const reserva = await reservaModel.buscarPorId(id, req.user.id_empresa);

            if (!reserva) {
                return res.status(404).json({ mensagem: "Reserva não encontrada." });
            }

            if (
                req.user.role !== "admin" &&
                Number(reserva.id_solicitante) !== Number(req.user.id_usuario)
            ) {
                return res.status(403).json({ mensagem: "Você não tem permissão para consultar esta reserva." });
            }

            return res.status(200).json({ reserva });
        } catch (error) {
            return responderErro(res, error, "Erro ao buscar reserva.");
        }
    },

    // Aprovar solicitação (admin)
    async aprovar(req, res) {
        try {
            const id = validarId(req.params.id);

            if (!id) {
                return res.status(400).json({ mensagem: "ID da reserva inválido." });
            }

            await reservaService.aprovar(
                id,
                req.user.id_empresa,
                req.user.id_usuario
            );

            return res.status(200).json({ mensagem: "Reserva aprovada com sucesso." });
        } catch (error) {
            return responderErro(res, error, "Erro ao aprovar reserva.");
        }
    },

    // Recusar solicitação (admin)
    async recusar(req, res) {
        try {
            const id = validarId(req.params.id);
            const { motivo } = req.body;

            if (!id) {
                return res.status(400).json({ mensagem: "ID da reserva inválido." });
            }

            if (typeof motivo !== "string" || motivo.trim().length < 3) {
                return res.status(400).json({ mensagem: "Informe o motivo da recusa." });
            }

            await reservaService.recusar(
                id,
                req.user.id_empresa,
                req.user.id_usuario,
                motivo.trim()
            );

            return res.status(200).json({ mensagem: "Reserva recusada." });
        } catch (error) {
            return responderErro(res, error, "Erro ao recusar reserva.");
        }
    },

    // Funcionário disponibiliza a sala antecipadamente
    async disponibilizar(req, res) {
        try {
            const id = validarId(req.params.id);
            const { motivo } = req.body;

            if (!id) {
                return res.status(400).json({ mensagem: "ID da reserva inválido." });
            }

            if (motivo !== undefined && typeof motivo !== "string") {
                return res.status(400).json({ mensagem: "Motivo inválido." });
            }

            await reservaService.disponibilizar(
                id,
                req.user.id_empresa,
                req.user.id_usuario,
                motivo?.trim() || null
            );

            return res.status(200).json({
                mensagem: "Reserva concluída. A sala foi disponibilizada."
            });
        } catch (error) {
            return responderErro(res, error, "Erro ao disponibilizar sala.");
        }
    },

    // Funcionário solicita extensão
    async solicitarExtensao(req, res) {
        try {
            const id = validarId(req.params.id);
            const { data_fim_solicitada, justificativa } = req.body;

            if (!id) {
                return res.status(400).json({ mensagem: "ID da reserva inválido." });
            }

            if (!validarData(data_fim_solicitada)) {
                return res.status(400).json({ mensagem: "Informe uma data final válida." });
            }

            if (typeof justificativa !== "string" || justificativa.trim().length < 3) {
                return res.status(400).json({ mensagem: "Informe a justificativa da extensão." });
            }

            const id_extensao = await reservaService.solicitarExtensao(
                id,
                req.user.id_empresa,
                req.user.id_usuario,
                data_fim_solicitada,
                justificativa.trim()
            );

            return res.status(201).json({
                mensagem: "Solicitação de extensão enviada.",
                id_extensao
            });
        } catch (error) {
            return responderErro(res, error, "Erro ao solicitar extensão.");
        }
    },

    // Admin aprova ou recusa extensão
    async decidirExtensao(req, res) {
        try {
            const id = validarId(req.params.id);
            const { aprovar, justificativa } = req.body;

            if (!id) {
                return res.status(400).json({ mensagem: "ID da extensão inválido." });
            }

            if (typeof aprovar !== "boolean") {
                return res.status(400).json({ mensagem: "Informe se a extensão será aprovada ou recusada." });
            }

            if (justificativa !== undefined && typeof justificativa !== "string") {
                return res.status(400).json({ mensagem: "Justificativa inválida." });
            }

            await reservaService.decidirExtensao(
                id,
                req.user.id_empresa,
                req.user.id_usuario,
                aprovar,
                justificativa?.trim() || null
            );

            return res.status(200).json({
                mensagem: aprovar ? "Extensão aprovada." : "Extensão recusada."
            });
        } catch (error) {
            return responderErro(res, error, "Erro ao analisar extensão.");
        }
    },

    // Admin cancela reserva
    async cancelar(req, res) {
        try {
            const id = validarId(req.params.id);
            const { motivo } = req.body;

            if (!id) {
                return res.status(400).json({ mensagem: "ID da reserva inválido." });
            }

            if (typeof motivo !== "string" || motivo.trim().length < 3) {
                return res.status(400).json({ mensagem: "Informe o motivo do cancelamento." });
            }

            await reservaService.cancelar(
                id,
                req.user.id_empresa,
                req.user.id_usuario,
                motivo.trim()
            );

            return res.status(200).json({ mensagem: "Reserva cancelada." });
        } catch (error) {
            return responderErro(res, error, "Erro ao cancelar reserva.");
        }
    },

    // Admin cadastra manutenção dentro da reserva
    async criarManutencao(req, res) {
        try {
            const id = validarId(req.params.id);
            const {
                descricao,
                data_inicio,
                data_fim,
                turnos
            } = req.body;

            if (!id) {
                return res.status(400).json({ mensagem: "ID da reserva inválido." });
            }

            if (typeof descricao !== "string" || descricao.trim().length < 3) {
                return res.status(400).json({ mensagem: "Informe a descrição da manutenção." });
            }

            if (!validarData(data_inicio) || !validarData(data_fim)) {
                return res.status(400).json({ mensagem: "Informe datas válidas." });
            }

            if (
                !Array.isArray(turnos) ||
                turnos.length === 0 ||
                turnos.some(turno => !["M", "T", "N"].includes(turno)) ||
                new Set(turnos).size !== turnos.length
            ) {
                return res.status(400).json({ mensagem: "Informe ao menos um turno válido." });
            }

            const id_manutencao = await reservaService.criarManutencao({
                id_reserva: id,
                id_empresa: req.user.id_empresa,
                id_responsavel: req.user.id_usuario,
                descricao: descricao.trim(),
                data_inicio,
                data_fim,
                turnos
            });

            return res.status(201).json({
                mensagem: "Manutenção cadastrada.",
                id_manutencao
            });
        } catch (error) {
            return responderErro(res, error, "Erro ao cadastrar manutenção.");
        }
    },

    // Admin cancela manutenção
    async cancelarManutencao(req, res) {
        try {
            const id = validarId(req.params.id);

            if (!id) {
                return res.status(400).json({ mensagem: "ID da manutenção inválido." });
            }

            await reservaService.cancelarManutencao(
                id,
                req.user.id_empresa,
                req.user.id_usuario
            );

            return res.status(200).json({ mensagem: "Manutenção cancelada." });
        } catch (error) {
            return responderErro(res, error, "Erro ao cancelar manutenção.");
        }
    },

    // Consultar histórico de uma reserva
    async historico(req, res) {
        try {
            const id = validarId(req.params.id);

            if (!id) {
                return res.status(400).json({ mensagem: "ID da reserva inválido." });
            }

            const reserva = await reservaModel.buscarPorId(id, req.user.id_empresa);

            if (!reserva) {
                return res.status(404).json({ mensagem: "Reserva não encontrada." });
            }

            if (
                req.user.role !== "admin" &&
                Number(reserva.id_solicitante) !== Number(req.user.id_usuario)
            ) {
                return res.status(403).json({ mensagem: "Você não tem permissão para consultar este histórico." });
            }

            const historico = await reservaHistoricoModel.listar(
                id,
                req.user.id_empresa
            );

            return res.status(200).json({ historico });
        } catch (error) {
            return responderErro(res, error, "Erro ao consultar histórico.");
        }
    }
};

export default reservaController;
