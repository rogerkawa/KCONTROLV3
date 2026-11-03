import crypto from 'node:crypto';

const QUANTIDADE_CODIGOS = 10;

export function gerarCodigosRecuperacao() {
    const codigos = [];
    const hashes = [];

    for (let i = 0; i < QUANTIDADE_CODIGOS; i++) {
        const codigo = crypto.randomBytes(8).toString('hex').toUpperCase();

        codigos.push(
            codigo.match(/.{1,4}/g).join('-')
        );

        hashes.push(
            crypto
                .createHash('sha256')
                .update(codigo)
                .digest('hex')
        );
    }

    return { codigos, hashes };
}

export function validarCodigoRecuperacao(codigo, hashesArmazenados) {
    if (!codigo || !Array.isArray(hashesArmazenados)) {
        return null;
    }

    const codigoNormalizado = String(codigo)
        .replace(/-/g, '')
        .trim()
        .toUpperCase();

    if (!/^[A-F0-9]{16}$/.test(codigoNormalizado)) {
        return null;
    }

    const hash = crypto
        .createHash('sha256')
        .update(codigoNormalizado)
        .digest('hex');

    const indice = hashesArmazenados.findIndex(hashArmazenado => {
        const hashBuffer = Buffer.from(hashArmazenado, 'hex');
        const recebidoBuffer = Buffer.from(hash, 'hex');

        return hashBuffer.length === recebidoBuffer.length &&
            crypto.timingSafeEqual(hashBuffer, recebidoBuffer);
    });

    return indice === -1 ? null : indice;
}