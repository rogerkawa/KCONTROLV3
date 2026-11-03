import conect from '../config/database.js';

export async function buscarMFA(idUsuario) {
    const [rows] = await conect.execute(
        `SELECT
            mfa_enabled,
            mfa_secret_encrypted,
            mfa_pending_secret_encrypted,
            mfa_recovery_codes
         FROM usuarios
         WHERE id_usuario = ?`,
        [idUsuario]
    );

    return rows[0] || null;
}

export async function salvarSegredoPendente(idUsuario, segredoCriptografado) {
    await conect.execute(
        `UPDATE usuarios
         SET mfa_pending_secret_encrypted = ?
         WHERE id_usuario = ?`,
        [segredoCriptografado, idUsuario]
    );
}

export async function ativarMFA(idUsuario, segredoCriptografado, codigosRecuperacao) {
    await conect.execute(
        `UPDATE usuarios
         SET
            mfa_enabled = 1,
            mfa_secret_encrypted = ?,
            mfa_pending_secret_encrypted = NULL,
            mfa_recovery_codes = ?
         WHERE id_usuario = ?`,
        [segredoCriptografado, JSON.stringify(codigosRecuperacao), idUsuario]
    );
}

export async function limparSegredoPendente(idUsuario) {
    await conect.execute(
        `UPDATE usuarios
         SET mfa_pending_secret_encrypted = NULL
         WHERE id_usuario = ?`,
        [idUsuario]
    );
}