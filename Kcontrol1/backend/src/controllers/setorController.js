import setorModel from "../models/setorModel.js";
import auditoriaModel from "../models/auditoriaModel.js";

const setorController = {
  async listar(req, res) {
    try {
      const setores = await setorModel.listar(req.user.id_empresa);

      return res.status(200).json({ setores });
    } catch (error) {
      console.error(error);

      return res.status(500).json({
        mensagem: "Erro ao listar setores.",
      });
    }
  },

  async buscarPorId(req, res) {
    try {
      const id = Number(req.params.id);

      if (!Number.isSafeInteger(id) || id <= 0) {
        return res.status(400).json({
          mensagem: "ID do setor inválido.",
        });
      }

      const setor = await setorModel.buscarPorId(id, req.user.id_empresa);

      if (!setor) {
        return res.status(404).json({
          mensagem: "Setor não encontrado.",
        });
      }

      return res.status(200).json({ setor });
    } catch (error) {
      console.error(error);

      return res.status(500).json({
        mensagem: "Erro ao buscar setor.",
      });
    }
  },

  async criar(req, res) {
    try {
      const { nome } = req.body;

      if (typeof nome !== "string" || !nome.trim()) {
        return res.status(400).json({
          mensagem: "Informe o nome do setor.",
        });
      }

      const nomeLimpo = nome.trim();

      if (nomeLimpo.length < 2 || nomeLimpo.length > 100) {
        return res.status(400).json({
          mensagem: "O nome deve ter entre 2 e 100 caracteres.",
        });
      }

      const id_setor = await setorModel.criar(req.user.id_empresa, nomeLimpo);
      await auditoriaModel.registrar(
        req.user.id_empresa,
        req.user.id_usuario,
        "setor.criado",
        `Criou o setor ${nomeLimpo}.`,
      );

      return res.status(201).json({
        mensagem: "Setor criado com sucesso!",
        id_setor,
      });
    } catch (error) {
      console.error(error);

      if (error.code === "ER_DUP_ENTRY") {
        return res.status(409).json({
          mensagem: "Já existe um setor com esse nome.",
        });
      }

      return res.status(500).json({
        mensagem: "Erro ao criar setor.",
      });
    }
  },

  async atualizar(req, res) {
    try {
      const id = Number(req.params.id);
      const { nome } = req.body;

      if (!Number.isSafeInteger(id) || id <= 0) {
        return res.status(400).json({
          mensagem: "ID do setor inválido.",
        });
      }

      if (typeof nome !== "string" || !nome.trim()) {
        return res.status(400).json({
          mensagem: "Informe o nome do setor.",
        });
      }

      const nomeLimpo = nome.trim();

      if (nomeLimpo.length < 2 || nomeLimpo.length > 100) {
        return res.status(400).json({
          mensagem: "O nome deve ter entre 2 e 100 caracteres.",
        });
      }

      const setor = await setorModel.buscarPorId(id, req.user.id_empresa);

      if (!setor) {
        return res.status(404).json({
          mensagem: "Setor não encontrado.",
        });
      }

      await setorModel.atualizar(id, req.user.id_empresa, nomeLimpo);
      await auditoriaModel.registrar(
        req.user.id_empresa,
        req.user.id_usuario,
        "setor.atualizado",
        `Atualizou o setor ${setor.nome} para ${nomeLimpo}.`,
      );

      return res.status(200).json({
        mensagem: "Setor atualizado com sucesso!",
      });
    } catch (error) {
      console.error(error);

      if (error.code === "ER_DUP_ENTRY") {
        return res.status(409).json({
          mensagem: "Já existe outro setor com esse nome.",
        });
      }

      return res.status(500).json({
        mensagem: "Erro ao atualizar setor.",
      });
    }
  },
  async alterarStatus(req, res) {
    try {
        const id = Number(req.params.id);
        const { status } = req.body;

        if (!Number.isSafeInteger(id) || id <= 0) {
            return res.status(400).json({
                mensagem: "ID do setor inválido.",
            });
        }

        if (!["ativo", "inativo"].includes(status)) {
            return res.status(400).json({
                mensagem: "Status inválido.",
            });
        }

        const setor = await setorModel.buscarPorId(
            id,
            req.user.id_empresa
        );

        if (!setor) {
            return res.status(404).json({
                mensagem: "Setor não encontrado.",
            });
        }

        if (setor.status === status) {
            return res.status(200).json({
                mensagem: `Este setor já está ${status}.`,
            });
        }

        await setorModel.atualizarStatus(
            id,
            req.user.id_empresa,
            status
        );

        await auditoriaModel.registrar(
            req.user.id_empresa,
            req.user.id_usuario,
            status === "ativo" ? "setor.ativado" : "setor.desativado",
            `${status === "ativo" ? "Ativou" : "Desativou"} o setor ${setor.nome}.`,
        );

        return res.status(200).json({
            mensagem: status === "ativo"
                ? "Setor ativado com sucesso!"
                : "Setor desativado com sucesso!",
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            mensagem: "Erro ao alterar status do setor.",
        });
    }
},

  async excluir(req, res) {
    try {
      const id = Number(req.params.id);

      if (!Number.isSafeInteger(id) || id <= 0) {
        return res.status(400).json({
          mensagem: "ID do setor inválido.",
        });
      }

      const setor = await setorModel.buscarPorId(id, req.user.id_empresa);

      if (!setor) {
        return res.status(404).json({
          mensagem: "Setor não encontrado.",
        });
      }

      const vinculos = await setorModel.verificarVinculos(
        id,
        req.user.id_empresa,
      );

      if (vinculos > 0) {
        return res.status(409).json({
          mensagem:
            "Não é possível excluir este setor porque existem registros vinculados a ele.",
        });
      }

      await setorModel.excluir(id, req.user.id_empresa);
      await auditoriaModel.registrar(
        req.user.id_empresa,
        req.user.id_usuario,
        "setor.excluido",
        `Excluiu o setor ${setor.nome}.`,
      );

      return res.status(200).json({
        mensagem: "Setor excluído com sucesso!",
      });
    } catch (error) {
      console.error(error);

      // Proteção adicional caso exista um vínculo criado
      // entre a verificação e a tentativa de exclusão.
      if (error.code === "ER_ROW_IS_REFERENCED_2") {
        return res.status(409).json({
          mensagem:
            "Não é possível excluir este setor porque existem registros vinculados a ele.",
        });
      }

      return res.status(500).json({
        mensagem: "Erro ao excluir setor.",
      });
    }
  },
};

export default setorController;
