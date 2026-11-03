
import { authenticator } from 'otplib';
import QRCode from 'qrcode';

const ISSUER = 'KControl';

export function gerarSegredoMFA(email) {
    const segredo = authenticator.generateSecret();

    const otpauth = authenticator.keyuri(
        email,
        ISSUER,
        segredo
    );

    return {
        segredo,
        otpauth
    };
}

export async function gerarQRCode(otpauth) {
    return QRCode.toDataURL(otpauth);
}

export function validarCodigoMFA(segredo, codigo) {
    if (!/^\d{6}$/.test(String(codigo))) {
        return false;
    }

    return authenticator.check(
        String(codigo),
        segredo
    );
}
