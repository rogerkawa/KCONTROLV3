import salaModel from "../models/salaModel.js";
import auditoriaModel from "../models/auditoriaModel.js";

const salaController = {
  async listar(req, res) {
    try {
      const salas = await salaModel.listar(req.user.id_empresa);

      return res.status(200).json({ salas });
    } catch (error) {
      console.error(error);

      return res.status(500).json({
        mensagem: "Erro ao listar salas.",
      });
    }
  },

  async buscarPorId(req, res) {
    try {
      const id = Number(req.params.id);

      if (!Number.isSafeInteger(id) || id <= 0) {
        return res.status(400).json({
          mensagem: "ID da sala inválido.",
        });
      }

      const sala = await salaModel.buscarPorId(id, req.user.id_empresa);

      if (!sala) {
        return res.status(404).json({
          mensagem: "Sala não encontrada.",
        });
      }

      return res.status(200).json({ sala });
    } catch (error) {
      console.error(error);

      return res.status(500).json({
        mensagem: "Erro ao buscar sala.",
      });
    }
  },

  async criar(req, res) {
    try {
      const { nome } = req.body;

      if (typeof nome !== "string" || !nome.trim()) {
        return res.status(400).json({
          mensagem: "Informe o nome da sala.",
        });
      }

      const nomeLimpo = nome.trim();

      if (nomeLimpo.length < 2 || nomeLimpo.length > 100) {
        return res.status(400).json({
          mensagem: "O nome deve ter entre 2 e 100 caracteres.",
        });
      }

      const id_sala = await salaModel.criar(req.user.id_empresa, nomeLimpo);
      await auditoriaModel.registrar(
        req.user.id_empresa,
        req.user.id_usuario,
        "sala.criada",
        `Criou a sala ${nomeLimpo}.`,
      );

      return res.status(201).json({
        mensagem: "Sala criada com sucesso!",
        id_sala,
      });
    } catch (error) {
      console.error(error);

      if (error.code === "ER_DUP_ENTRY") {
        return res.status(409).json({
          mensagem: "Já existe uma sala com esse nome.",
        });
      }

      return res.status(500).json({
        mensagem: "Erro ao criar sala.",
      });
    }
  },

  async atualizar(req, res) {
    try {
      const id = Number(req.params.id);
      const { nome } = req.body;

      if (!Number.isSafeInteger(id) || id <= 0) {
        return res.status(400).json({
          mensagem: "ID da sala inválido.",
        });
      }

      if (typeof nome !== "string" || !nome.trim()) {
        return res.status(400).json({
          mensagem: "Informe o nome da sala.",
        });
      }

      const nomeLimpo = nome.trim();

      if (nomeLimpo.length < 2 || nomeLimpo.length > 100) {
        return res.status(400).json({
          mensagem: "O nome deve ter entre 2 e 100 caracteres.",
        });
      }

      const sala = await salaModel.buscarPorId(id, req.user.id_empresa);

      if (!sala) {
        return res.status(404).json({
          mensagem: "Sala não encontrada.",
        });
      }

      await salaModel.atualizar(id, req.user.id_empresa, nomeLimpo);
      await auditoriaModel.registrar(
        req.user.id_empresa,
        req.user.id_usuario,
        "sala.atualizada",
        `Atualizou a sala ${sala.nome} para ${nomeLimpo}.`,
      );

      return res.status(200).json({
        mensagem: "Sala atualizada com sucesso!",
      });
    } catch (error) {
      console.error(error);

      if (error.code === "ER_DUP_ENTRY") {
        return res.status(409).json({
          mensagem: "Já existe outra sala com esse nome.",
        });
      }

      return res.status(500).json({
        mensagem: "Erro ao atualizar sala.",
      });
    }
  },

  async atualizarStatus(req, res) {
    try {
      const id = Number(req.params.id);
      const { status } = req.body;

      if (!Number.isSafeInteger(id) || id <= 0) {
        return res.status(400).json({
          mensagem: "ID da sala inválido.",
        });
      }

      const statusPermitidos = ["disponivel", "manutencao", "inativa"];

      if (!statusPermitidos.includes(status)) {
        return res.status(400).json({
          mensagem:
            "Status inválido. Utilize disponivel, manutencao ou inativa.",
        });
      }

      const sala = await salaModel.buscarPorId(id, req.user.id_empresa);

      if (!sala) {
        return res.status(404).json({
          mensagem: "Sala não encontrada.",
        });
      }

      const retiradaAtiva = await salaModel.verificarRetiradaAtiva(
        id,
        req.user.id_empresa,
      );

      if (retiradaAtiva > 0) {
        return res.status(409).json({
          mensagem:
            "Não é possível alterar o status enquanto existir uma retirada ativa nesta sala.",
        });
      }

      await salaModel.atualizarStatus(id, req.user.id_empresa, status);
      await auditoriaModel.registrar(
        req.user.id_empresa,
        req.user.id_usuario,
        "sala.status_alterado",
        `Alterou o status da sala ${sala.nome} para ${status}.`,
      );

      return res.status(200).json({
        mensagem: "Status da sala atualizado com sucesso!",
      });
    } catch (error) {
      console.error(error);

      return res.status(500).json({
        mensagem: "Erro ao atualizar status da sala.",
      });
    }
  },

  async excluir(req, res) {
    try {
      const id = Number(req.params.id);

      if (!Number.isSafeInteger(id) || id <= 0) {
        return res.status(400).json({
          mensagem: "ID da sala inválido.",
        });
      }

      const sala = await salaModel.buscarPorId(id, req.user.id_empresa);

      if (!sala) {
        return res.status(404).json({
          mensagem: "Sala não encontrada.",
        });
      }

      const vinculos = await salaModel.verificarVinculos(
        id,
        req.user.id_empresa,
      );

      if (vinculos > 0) {
        return res.status(409).json({
          mensagem:
            "Não é possível excluir esta sala porque existem registros vinculados a ela.",
        });
      }

      await salaModel.excluir(id, req.user.id_empresa);
      await auditoriaModel.registrar(
        req.user.id_empresa,
        req.user.id_usuario,
        "sala.excluida",
        `Excluiu a sala ${sala.nome}.`,
      );

      return res.status(200).json({
        mensagem: "Sala excluída com sucesso!",
      });
    } catch (error) {
      console.error(error);

      if (error.code === "ER_ROW_IS_REFERENCED_2") {
        return res.status(409).json({
          mensagem:
            "Não é possível excluir esta sala porque existem registros vinculados a ela.",
        });
      }

      return res.status(500).json({
        mensagem: "Erro ao excluir sala.",
      });
    }
  },
};

export default salaController;
