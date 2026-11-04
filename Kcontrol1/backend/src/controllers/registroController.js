import registroModel from "../models/registroModel.js";
import auditoriaModel from "../models/auditoriaModel.js";

const registroController = {
  async listar(req, res) {
    try {
      const registros = await registroModel.listar(req.user.id_empresa);

      return res.status(200).json({ registros });
    } catch (error) {
      console.error(error);

      return res.status(500).json({
        mensagem: "Erro ao listar registros.",
      });
    }
  },

  async listarMeus(req, res) {
    try {
      const registros = await registroModel.listarMeus(
        req.user.id_empresa,
        req.user.id_usuario,
      );

      return res.status(200).json({ registros });
    } catch (error) {
      console.error(error);

      return res.status(500).json({
        mensagem: "Erro ao listar seus registros.",
      });
    }
  },

  async buscarPorId(req, res) {
    try {
      const id = Number(req.params.id);

      if (!Number.isSafeInteger(id) || id <= 0) {
        return res.status(400).json({
          mensagem: "ID do registro inválido.",
        });
      }

      const registro = await registroModel.buscarPorId(id, req.user.id_empresa);

      if (!registro) {
        return res.status(404).json({
          mensagem: "Registro não encontrado.",
        });
      }

      // Usuário comum só pode consultar os próprios registros.
      if (
        req.user.role !== "admin" &&
        Number(registro.id_usuario) !== Number(req.user.id_usuario)
      ) {
        return res.status(403).json({
          mensagem: "Você não tem permissão para consultar este registro.",
        });
      }

      return res.status(200).json({ registro });
    } catch (error) {
      console.error(error);

      return res.status(500).json({
        mensagem: "Erro ao buscar registro.",
      });
    }
  },

  async criar(req, res) {
    try {
      const {
        id_setor,
        id_sala,
        responsavel,
        turno,
        data_retirada,
        hora_retirada,
      } = req.body;

      const setorId = Number(id_setor);
      const salaId = Number(id_sala);

      if (
        !Number.isSafeInteger(setorId) ||
        setorId <= 0 ||
        !Number.isSafeInteger(salaId) ||
        salaId <= 0
      ) {
        return res.status(400).json({
          mensagem: "Informe um setor e uma sala válidos.",
        });
      }

      if (
        typeof responsavel !== "string" ||
        responsavel.trim().length < 2 ||
        responsavel.trim().length > 100
      ) {
        return res.status(400).json({
          mensagem: "Informe um responsável válido.",
        });
      }

      if (!["M", "T", "N"].includes(turno)) {
        return res.status(400).json({
          mensagem: "Turno inválido. Utilize M, T ou N.",
        });
      }

      // Valida o formato e a existência da data.
      if (
        typeof data_retirada !== "string" ||
        !/^\d{4}-\d{2}-\d{2}$/.test(data_retirada) ||
        Number.isNaN(Date.parse(`${data_retirada}T00:00:00Z`)) ||
        new Date(`${data_retirada}T00:00:00Z`).toISOString().slice(0, 10) !==
        data_retirada
      ) {
        return res.status(400).json({
          mensagem: "Informe uma data válida no formato AAAA-MM-DD.",
        });
      }

      if (
        typeof hora_retirada !== "string" ||
        !/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/.test(hora_retirada)
      ) {
        return res.status(400).json({
          mensagem: "Informe um horário válido no formato HH:MM.",
        });
      }

      const id_registro = await registroModel.criar({
        id_empresa: req.user.id_empresa,
        id_usuario: req.user.id_usuario,
        id_setor: setorId,
        id_sala: salaId,
        responsavel: responsavel.trim(),
        turno,
        data_retirada,
        hora_retirada,
      });
      await auditoriaModel.registrar(
        req.user.id_empresa,
        req.user.id_usuario,
        "registro.retirada",
        `Registrou a retirada da sala ${id_sala}, no turno ${turno}.`,
      );

      return res.status(201).json({
        mensagem: "Retirada registrada com sucesso!",
        id_registro,
      });
    } catch (error) {
      console.error(error);

      const erros = {
        SETOR_NAO_ENCONTRADO: [404, "Setor não encontrado nesta empresa."],
        SALA_NAO_ENCONTRADA: [404, "Sala não encontrada nesta empresa."],
        SALA_INDISPONIVEL: [
          409,
          "Esta sala não está disponível para retirada.",
        ],
        RETIRADA_JA_EXISTE: [
          409,
          "Já existe uma retirada ativa para esta sala, data e turno.",
        ],
        SETOR_INATIVO: [
          409,
          "Este setor está inativo e não pode receber novos registros.",
        ],
      };

      if (erros[error.message]) {
        const [status, mensagem] = erros[error.message];

        return res.status(status).json({ mensagem });
      }

      return res.status(500).json({
        mensagem: "Erro ao registrar retirada.",
      });
    }
  },

  async devolver(req, res) {
    try {
      const id = Number(req.params.id);

      if (!Number.isSafeInteger(id) || id <= 0) {
        return res.status(400).json({
          mensagem: "ID do registro inválido.",
        });
      }

      const registro = await registroModel.buscarPorId(id, req.user.id_empresa);

      if (!registro) {
        return res.status(404).json({
          mensagem: "Registro não encontrado.",
        });
      }

      // Admin pode devolver qualquer registro da empresa.
      // User só pode devolver o próprio registro.
      if (
        req.user.role !== "admin" &&
        Number(registro.id_usuario) !== Number(req.user.id_usuario)
      ) {
        return res.status(403).json({
          mensagem: "Você não tem permissão para devolver este registro.",
        });
      }

      await registroModel.devolver(id, req.user.id_empresa);
      await auditoriaModel.registrar(
        req.user.id_empresa,
        req.user.id_usuario,
        "registro.devolucao",
        `Registrou a devolução do registro ${id}.`,
      );

      return res.status(200).json({
        mensagem: "Devolução registrada com sucesso!",
      });
    } catch (error) {
      console.error(error);

      if (error.message === "REGISTRO_NAO_ENCONTRADO") {
        return res.status(404).json({
          mensagem: "Registro não encontrado.",
        });
      }

      if (error.message === "REGISTRO_JA_DEVOLVIDO") {
        return res.status(409).json({
          mensagem: "Este registro já foi devolvido.",
        });
      }

      return res.status(500).json({
        mensagem: "Erro ao registrar devolução.",
      });
    }
  },
};

export default registroController;
