
import crypto from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';

function obterChave() {
    const chaveHex = process.env.MFA_ENCRYPTION_KEY;

    if (!chaveHex || !/^[a-fA-F0-9]{64}$/.test(chaveHex)) {
        throw new Error(
            'MFA_ENCRYPTION_KEY inválida. Informe uma chave hexadecimal de 32 bytes.'
        );
    }

    return Buffer.from(chaveHex, 'hex');
}

export function criptografarSegredo(segredo) {
    const chave = obterChave();

    const iv = crypto.randomBytes(12);

    const cipher = crypto.createCipheriv(
        ALGORITHM,
        chave,
        iv
    );

    const criptografado = Buffer.concat([
        cipher.update(segredo, 'utf8'),
        cipher.final()
    ]);

    const tag = cipher.getAuthTag();

    return [
        iv.toString('hex'),
        tag.toString('hex'),
        criptografado.toString('hex')
    ].join(':');
}

export function descriptografarSegredo(valor) {
    const chave = obterChave();

    const partes = valor.split(':');

    if (partes.length !== 3) {
        throw new Error('Formato do segredo MFA inválido.');
    }

    const [ivHex, tagHex, conteudoHex] = partes;

    const iv = Buffer.from(ivHex, 'hex');
    const tag = Buffer.from(tagHex, 'hex');
    const conteudo = Buffer.from(conteudoHex, 'hex');

    if (
        iv.length !== 12 ||
        tag.length !== 16 ||
        conteudo.length === 0
    ) {
        throw new Error('Dados criptográficos inválidos.');
    }

    const decipher = crypto.createDecipheriv(
        ALGORITHM,
        chave,
        iv
    );

    decipher.setAuthTag(tag);

    const resultado = Buffer.concat([
        decipher.update(conteudo),
        decipher.final()
    ]);

    return resultado.toString('utf8');
}
