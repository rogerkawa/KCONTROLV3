import usuarioModel from "../models/usuarioModel.js";
import auditoriaModel from "../models/auditoriaModel.js";
import bcrypt from "bcryptjs";

const usuarioController = {
  async listar(req, res) {
    try {
      const usuarios = await usuarioModel.listar(req.user.id_empresa);

      return res.status(200).json({ usuarios });
    } catch (error) {
      console.error(error);

      return res.status(500).json({
        mensagem: "Erro ao listar usuários.",
      });
    }
  },

  async buscarPorId(req, res) {
    try {
      const { id } = req.params;

      const usuario = await usuarioModel.buscarPorId(id, req.user.id_empresa);

      if (!usuario) {
        return res.status(404).json({
          mensagem: "Usuário não encontrado.",
        });
      }

      return res.status(200).json({ usuario });
    } catch (error) {
      console.error(error);

      return res.status(500).json({
        mensagem: "Erro ao buscar usuário.",
      });
    }
  },

  async criar(req, res) {
    try {
      const { nome, email, senha, role } = req.body;

      if (!nome || !email || !senha) {
        return res.status(400).json({
          mensagem: "Preencha nome, email e senha.",
        });
      }

      const nomeLimpo = nome.trim();
      const emailLimpo = email.trim().toLowerCase();

      if (nomeLimpo.length < 2) {
        return res.status(400).json({
          mensagem: "O nome deve ter pelo menos 2 caracteres.",
        });
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailLimpo)) {
        return res.status(400).json({
          mensagem: "Informe um email válido.",
        });
      }

      if (senha.length < 6) {
        return res.status(400).json({
          mensagem: "A senha deve ter pelo menos 6 caracteres.",
        });
      }

      if (role && !["admin", "user"].includes(role)) {
        return res.status(400).json({
          mensagem: "Cargo inválido.",
        });
      }

      const emailExistente = await usuarioModel.buscarPorEmail(emailLimpo);

      if (emailExistente) {
        return res.status(409).json({
          mensagem: "Este email já está cadastrado.",
        });
      }

      const senhaHash = await bcrypt.hash(senha, 12);

      const id_usuario = await usuarioModel.criar({
        id_empresa: req.user.id_empresa,
        nome: nomeLimpo,
        email: emailLimpo,
        senha: senhaHash,
        role: role || "user",
      });
      await auditoriaModel.registrar(
        req.user.id_empresa,
        req.user.id_usuario,
        "usuario.criado",
        `Cadastrou o usuário ${nomeLimpo}.`,
      );

      return res.status(201).json({
        mensagem: "Usuário cadastrado com sucesso!",
        id_usuario,
      });
    } catch (error) {
      console.error(error);

      if (error.code === "ER_DUP_ENTRY") {
        return res.status(409).json({
          mensagem: "Este email já está cadastrado.",
        });
      }

      return res.status(500).json({
        mensagem: "Erro ao cadastrar usuário.",
      });
    }
  },

  async atualizar(req, res) {
    try {
      const { id } = req.params;
      const { nome, email, role } = req.body;

      if (!nome || !email || !role) {
        return res.status(400).json({
          mensagem: "Preencha nome, email e cargo.",
        });
      }

      const nomeLimpo = nome.trim();
      const emailLimpo = email.trim().toLowerCase();

      if (nomeLimpo.length < 2) {
        return res.status(400).json({
          mensagem: "Nome inválido.",
        });
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailLimpo)) {
        return res.status(400).json({
          mensagem: "Email inválido.",
        });
      }

      if (!["admin", "user"].includes(role)) {
        return res.status(400).json({
          mensagem: "Cargo inválido.",
        });
      }

      const usuario = await usuarioModel.buscarPorId(id, req.user.id_empresa);

      if (!usuario) {
        return res.status(404).json({
          mensagem: "Usuário não encontrado.",
        });
      }

      if (Number(id) === Number(req.user.id_usuario)) {
        if (role !== req.user.role) {
          return res.status(403).json({
            mensagem: "Você não pode alterar seu próprio cargo.",
          });
        }
      }

      const emailExistente = await usuarioModel.buscarPorEmail(emailLimpo);

      if (emailExistente && Number(emailExistente.id_usuario) !== Number(id)) {
        return res.status(409).json({
          mensagem: "Este email já está sendo utilizado.",
        });
      }

      await usuarioModel.atualizar(id, req.user.id_empresa, {
        nome: nomeLimpo,
        email: emailLimpo,
        role,
      });

      await auditoriaModel.registrar(
        req.user.id_empresa,
        req.user.id_usuario,
        "usuario.atualizado",
        `Atualizou os dados do usuário ${nomeLimpo}.`,
      );

      return res.status(200).json({
        mensagem: "Usuário atualizado com sucesso!",
      });
    } catch (error) {
      console.error(error);

      if (error.code === "ER_DUP_ENTRY") {
        return res.status(409).json({
          mensagem: "Este email já está sendo utilizado.",
        });
      }

      return res.status(500).json({
        mensagem: "Erro ao atualizar usuário.",
      });
    }
  },

  async atualizarStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!["ativo", "inativo"].includes(status)) {
        return res.status(400).json({
          mensagem: "Status inválido.",
        });
      }

      if (Number(id) === Number(req.user.id_usuario)) {
        return res.status(403).json({
          mensagem: "Você não pode alterar seu próprio status.",
        });
      }

      const usuario = await usuarioModel.buscarPorId(id, req.user.id_empresa);

      if (!usuario) {
        return res.status(404).json({
          mensagem: "Usuário não encontrado.",
        });
      }

      if (usuario.role === "admin" && req.user.role !== "admin") {
        return res.status(403).json({
          mensagem: "Você não tem permissão para alterar este usuário.",
        });
      }

      await usuarioModel.atualizarStatus(id, req.user.id_empresa, status);
      await auditoriaModel.registrar(
        req.user.id_empresa,
        req.user.id_usuario,
        status === "ativo" ? "usuario.ativado" : "usuario.desativado",
        `Alterou o status do usuário ${usuario.nome} para ${status}.`,
      );

      return res.status(200).json({
        mensagem: `Usuário ${status === "ativo" ? "ativado" : "desativado"} com sucesso!`,
      });
    } catch (error) {
      console.error(error);

      return res.status(500).json({
        mensagem: "Erro ao atualizar status do usuário.",
      });
    }
  },
};

export default usuarioController;
