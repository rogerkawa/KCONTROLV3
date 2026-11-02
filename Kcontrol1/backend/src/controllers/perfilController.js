import perfilModel from '../models/perfilModel.js';
import auditoriaModel from '../models/auditoriaModel.js';
import cloudinary from '../config/cloudinary.js';
import bcrypt from 'bcryptjs';

const perfilController = {
  async buscar(req, res) {
    try {
      const usuario = await perfilModel.buscarPorId(
        req.user.id_usuario
      );

      if (!usuario) {
        return res.status(404).json({
          mensagem: 'Usuário não encontrado.'
        });
      }

      return res.status(200).json({ usuario });

    } catch (error) {
      console.error('Erro ao buscar perfil:', error);

      return res.status(500).json({
        mensagem: 'Erro ao consultar perfil.'
      });
    }
  },

  async atualizar(req, res) {
    try {
      const { nome, email } = req.body;

      const nomeLimpo = nome?.trim();
      const emailLimpo = email?.trim().toLowerCase();

      if (!nomeLimpo || !emailLimpo) {
        return res.status(400).json({
          mensagem: 'Informe o nome e o e-mail.'
        });
      }

      if (nomeLimpo.length < 3 || nomeLimpo.length > 100) {
        return res.status(400).json({
          mensagem: 'O nome deve ter entre 3 e 100 caracteres.'
        });
      }

      if (emailLimpo.length > 255 ||
          !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailLimpo)) {
        return res.status(400).json({
          mensagem: 'Informe um e-mail válido.'
        });
      }

      const usuarioAtual = await perfilModel.buscarPorId(
        req.user.id_usuario
      );

      if (!usuarioAtual) {
        return res.status(404).json({
          mensagem: 'Usuário não encontrado.'
        });
      }

      const atualizado = await perfilModel.atualizar(
        req.user.id_usuario,
        nomeLimpo,
        emailLimpo
      );

      if (!atualizado) {
        return res.status(400).json({
          mensagem: 'Não foi possível atualizar o perfil.'
        });
      }

      await auditoriaModel.registrar(
        req.user.id_empresa,
        req.user.id_usuario,
        'perfil.atualizado',
        'Atualizou os dados pessoais do perfil.'
      );

      const usuario = await perfilModel.buscarPorId(
        req.user.id_usuario
      );

      return res.status(200).json({
        mensagem: 'Perfil atualizado com sucesso!',
        usuario
      });

    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({
          mensagem: 'Este e-mail já está sendo utilizado.'
        });
      }

      console.error('Erro ao atualizar perfil:', error);

      return res.status(500).json({
        mensagem: 'Erro ao atualizar perfil.'
      });
    }
  },

  async atualizarSenha(req, res) {
  try {
    const { senhaAtual, novaSenha, confirmarSenha } = req.body;

    if (!senhaAtual || !novaSenha || !confirmarSenha) {
      return res.status(400).json({
        mensagem: 'Preencha todos os campos.'
      });
    }

    if (novaSenha.length < 8) {
      return res.status(400).json({
        mensagem: 'A nova senha deve ter pelo menos 8 caracteres.'
      });
    }

    if (novaSenha !== confirmarSenha) {
      return res.status(400).json({
        mensagem: 'A confirmação da senha não corresponde.'
      });
    }

    if (senhaAtual === novaSenha) {
      return res.status(400).json({
        mensagem: 'A nova senha deve ser diferente da atual.'
      });
    }

    const usuario = await perfilModel.buscarSenha(
      req.user.id_usuario
    );

    if (!usuario) {
      return res.status(404).json({
        mensagem: 'Usuário não encontrado.'
      });
    }

    const senhaValida = await bcrypt.compare(
      senhaAtual,
      usuario.senha
    );

    if (!senhaValida) {
      return res.status(401).json({
        mensagem: 'A senha atual está incorreta.'
      });
    }

    const senhaHash = await bcrypt.hash(novaSenha, 12);

    await perfilModel.atualizarSenha(
      req.user.id_usuario,
      senhaHash
    );

    await auditoriaModel.registrar(
      req.user.id_empresa,
      req.user.id_usuario,
      'perfil.senha_alterada',
      'Alterou a senha da própria conta.'
    );

    return res.status(200).json({
      mensagem: 'Senha alterada com sucesso!'
    });

  } catch (error) {
    console.error('Erro ao alterar senha:', error);

    return res.status(500).json({
      mensagem: 'Erro ao alterar senha.'
    });
  }
},
async atualizarAvatar(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({
        mensagem: 'Selecione uma imagem para enviar.'
      });
    }

    const id_usuario = req.user.id_usuario;

    const usuarioAtual = await perfilModel.buscarAvatar(id_usuario);

    if (!usuarioAtual) {
      return res.status(404).json({
        mensagem: 'Usuário não encontrado.'
      });
    }

    // Envia a imagem para o Cloudinary
    const resultado = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: 'kcontrol/avatars',
          resource_type: 'image'
        },
        (error, resultado) => {
          if (error) {
            return reject(error);
          }

          resolve(resultado);
        }
      );

      stream.end(req.file.buffer);
    });

    // Atualiza os dados no banco
    await perfilModel.atualizarAvatar(
      id_usuario,
      resultado.secure_url,
      resultado.public_id
    );

    // Remove a foto anterior somente depois da atualização
    if (usuarioAtual.avatar_public_id) {
      try {
        await cloudinary.uploader.destroy(
          usuarioAtual.avatar_public_id
        );
      } catch (error) {
        console.error('Erro ao remover avatar antigo:', error);
      }
    }

    await auditoriaModel.registrar(
      req.user.id_empresa,
      id_usuario,
      'perfil.avatar_atualizado',
      'Atualizou a foto de perfil.'
    );

    return res.status(200).json({
      mensagem: 'Foto de perfil atualizada com sucesso!',
      avatar_url: resultado.secure_url
    });

  } catch (error) {
    console.error('Erro ao atualizar avatar:', error);

    return res.status(500).json({
      mensagem: 'Erro ao atualizar foto de perfil.'
    });
  }
},
async removerAvatar(req, res) {
  try {
    const id_usuario = req.user.id_usuario;

    const usuarioAtual = await perfilModel.buscarAvatar(id_usuario);

    if (!usuarioAtual) {
      return res.status(404).json({
        mensagem: 'Usuário não encontrado.'
      });
    }

    if (!usuarioAtual.avatar_public_id) {
      return res.status(400).json({
        mensagem: 'Você não possui uma foto de perfil.'
      });
    }

    // Primeiro remove a referência do banco
    await perfilModel.removerAvatar(id_usuario);

    // Depois exclui a imagem do Cloudinary
    try {
      await cloudinary.uploader.destroy(
        usuarioAtual.avatar_public_id
      );
    } catch (error) {
      console.error('Erro ao remover imagem do Cloudinary:', error);

      return res.status(200).json({
        mensagem: 'Foto removida do perfil, mas não foi possível excluir o arquivo do Cloudinary.'
      });
    }

    await auditoriaModel.registrar(
      req.user.id_empresa,
      id_usuario,
      'perfil.avatar_removido',
      'Removeu a foto de perfil.'
    );

    return res.status(200).json({
      mensagem: 'Foto de perfil removida com sucesso!'
    });

  } catch (error) {
    console.error('Erro ao remover avatar:', error);

    return res.status(500).json({
      mensagem: 'Erro ao remover foto de perfil.'
    });
  }
}
};

export default perfilController;