import conect from '../config/database.js';

const perfilModel = {
  async buscarPorId(id_usuario) {
    const [resultado] = await conect.execute(
      `SELECT
        id_usuario,
        id_empresa,
        nome,
        email,
        role,
        avatar_url,
        status,
        created_at
       FROM usuarios
       WHERE id_usuario = ?
       LIMIT 1`,
      [id_usuario]
    );

    return resultado[0];
  },

  async atualizar(id_usuario, nome, email) {
  await conect.execute(
    `UPDATE usuarios
     SET nome = ?, email = ?
     WHERE id_usuario = ?`,
    [nome, email, id_usuario]
  );

  return true;
},
async buscarSenha(id_usuario) {
  const [resultado] = await conect.execute(
    `SELECT senha
     FROM usuarios
     WHERE id_usuario = ?
     LIMIT 1`,
    [id_usuario]
  );

  return resultado[0];
},

async atualizarSenha(id_usuario, senhaHash) {
  await conect.execute(
    `UPDATE usuarios
     SET senha = ?
     WHERE id_usuario = ?`,
    [senhaHash, id_usuario]
  );

  return true;
},

async buscarAvatar(id_usuario) {
  const [resultado] = await conect.execute(
    `SELECT avatar_public_id
     FROM usuarios
     WHERE id_usuario = ?
     LIMIT 1`,
    [id_usuario]
  );

  return resultado[0];
},

async atualizarAvatar(id_usuario, avatar_url, avatar_public_id) {
  await conect.execute(
    `UPDATE usuarios
     SET avatar_url = ?, avatar_public_id = ?
     WHERE id_usuario = ?`,
    [avatar_url, avatar_public_id, id_usuario]
  );

  return true;
},

async removerAvatar(id_usuario) {
  await conect.execute(
    `UPDATE usuarios
     SET avatar_url = NULL, avatar_public_id = NULL
     WHERE id_usuario = ?`,
    [id_usuario]
  );

  return true;
}
};

export default perfilModel;