
import * as mfaModel from '../models/mfaModel.js';
import { validarCodigoMFA } from '../services/mfaService.js';
import { gerarCodigosRecuperacao } from '../services/mfaRecoveryService.js';

import {
    gerarSegredoMFA,
    gerarQRCode
} from '../services/mfaService.js';

import {
    criptografarSegredo,
    descriptografarSegredo
} from '../services/mfaCrypto.js';

const mfaController = {

    async setup(req, res) {
        try {
            const idUsuario = req.mfaUser.id_usuario;
            const email = req.mfaUser.email;

            const mfa = await mfaModel.buscarMFA(idUsuario);

            if (!mfa) {
                return res.status(404).json({
                    message: 'Configuração MFA do usuário não encontrada.'
                });
            }

            if (Boolean(mfa.mfa_enabled)) {
                return res.status(409).json({
                    message: 'O MFA já está ativado nesta conta.'
                });
            }

            let segredo;
            let otpauth;

            // Reutiliza o segredo pendente se a configuração já começou.
            if (mfa.mfa_pending_secret_encrypted) {
                segredo = descriptografarSegredo(
                    mfa.mfa_pending_secret_encrypted
                );

                const { authenticator } = await import('otplib');

                otpauth = authenticator.keyuri(
                    email,
                    'KControl',
                    segredo
                );
            } else {
                const resultado = gerarSegredoMFA(email);

                segredo = resultado.segredo;
                otpauth = resultado.otpauth;

                const segredoCriptografado = criptografarSegredo(
                    segredo
                );

                await mfaModel.salvarSegredoPendente(
                    idUsuario,
                    segredoCriptografado
                );
            }

            const qrCode = await gerarQRCode(otpauth);

            return res.status(200).json({
                message: 'QR Code gerado com sucesso.',
                qrCode,
                manualSecret: segredo,
                issuer: 'KControl'
            });

        } catch (error) {
            console.error('Erro ao iniciar configuração MFA:', error);

            return res.status(500).json({
                message: 'Não foi possível iniciar a configuração MFA.'
            });
        }
    },
    async ativar(req, res) {
    try {
        const idUsuario = req.mfaUser.id_usuario;
        const codigo = String(req.body?.codigo || '').trim();

        if (!/^\d{6}$/.test(codigo)) {
            return res.status(400).json({
                message: 'Informe um código válido de 6 dígitos.'
            });
        }

        const mfa = await mfaModel.buscarMFA(idUsuario);

        if (!mfa) {
            return res.status(404).json({
                message: 'Dados MFA não encontrados.'
            });
        }

        if (Boolean(mfa.mfa_enabled)) {
            return res.status(409).json({
                message: 'O MFA já está ativado.'
            });
        }

        if (!mfa.mfa_pending_secret_encrypted) {
            return res.status(400).json({
                message: 'Inicie a configuração MFA novamente.'
            });
        }

        const segredo = descriptografarSegredo(
            mfa.mfa_pending_secret_encrypted
        );

        const codigoValido = validarCodigoMFA(
            segredo,
            codigo
        );

        if (!codigoValido) {
            return res.status(400).json({
                message: 'Código incorreto ou expirado.'
            });
        }

        const { codigos, hashes } = gerarCodigosRecuperacao();

        await mfaModel.ativarMFA(
            idUsuario,
            mfa.mfa_pending_secret_encrypted,
            hashes
        );

        return res.status(200).json({
            message: 'MFA ativado com sucesso.',
            recoveryCodes: codigos
        });

    } catch (error) {
        console.error('Erro ao ativar MFA:', error);

        return res.status(500).json({
            message: 'Não foi possível ativar o MFA.'
        });
    }
}

};

export default mfaController;
