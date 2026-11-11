
const reservaHistoricoModel = {

    async registrar(
        conexao,
        id_reserva,
        id_usuario,
        acao,
        descricao
    ) {
        await conexao.execute(
            `INSERT INTO reserva_historico (
                id_reserva,
                id_usuario,
                acao,
                descricao
            ) VALUES (?, ?, ?, ?)`,
            [
                id_reserva,
                id_usuario,
                acao,
                descricao
            ]
        );
    },
    async listar(id_reserva, id_empresa) {
    const [historico] = await conect.execute(
        `SELECT
            h.id_historico,
            h.id_reserva,
            h.id_usuario,
            u.nome AS usuario,
            h.acao,
            h.descricao,
            h.created_at
        FROM reserva_historico h
        INNER JOIN reservas r
            ON r.id_reserva = h.id_reserva
        LEFT JOIN usuarios u
            ON u.id_usuario = h.id_usuario
        WHERE h.id_reserva = ?
          AND r.id_empresa = ?
        ORDER BY h.created_at DESC`,
        [id_reserva, id_empresa]
    );

    return historico;
}

};

export default reservaHistoricoModel;
