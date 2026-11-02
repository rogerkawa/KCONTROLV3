
import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import './SolicitarAcesso.css';

const estadoInicial = {
    nome_empresa: '',
    cnpj: '',
    email_empresa: '',
    telefone: '',
    nome_responsavel: '',
    email_responsavel: ''
};

function formatarCNPJ(valor) {
    const cnpj = valor
        .replace(/[^a-zA-Z0-9]/g, '')
        .toUpperCase()
        .slice(0, 14);

    return cnpj
        .replace(/^(.{2})(.{1,3})/, '$1.$2')
        .replace(/^(.{2}\..{3})(.{1,3})/, '$1.$2')
        .replace(/^(.{2}\..{3}\..{3})(.{1,4})/, '$1/$2')
        .replace(/^(.{2}\..{3}\..{3}\/.{4})(.{1,2})/, '$1-$2');
}

function formatarTelefone(valor) {
    const numeros = valor.replace(/\D/g, '').slice(0, 11);

    if (numeros.length <= 2) {
        return numeros.replace(/^(\d{0,2})/, '($1');
    }

    if (numeros.length <= 6) {
        return numeros.replace(/^(\d{2})(\d+)/, '($1) $2');
    }

    if (numeros.length <= 10) {
        return numeros.replace(/^(\d{2})(\d{4})(\d+)/, '($1) $2-$3');
    }

    return numeros.replace(/^(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
}

export default function SolicitarAcesso() {
    const [formulario, setFormulario] = useState(estadoInicial);
    const [carregando, setCarregando] = useState(false);
    const [erro, setErro] = useState('');
    const [sucesso, setSucesso] = useState(false);

    function atualizarCampo(event) {
        const { name, value } = event.target;

        let novoValor = value;

        if (name === 'cnpj') {
            novoValor = formatarCNPJ(value);
        }

        if (name === 'telefone') {
            novoValor = formatarTelefone(value);
        }

        setFormulario(atual => ({
            ...atual,
            [name]: novoValor
        }));

        if (erro) setErro('');
    }

    function validarFormulario() {
        const cnpj = formulario.cnpj.replace(/[^a-zA-Z0-9]/g, '');
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!/^[A-Z0-9]{12}\d{2}$/.test(cnpj)) {
            return 'Informe um CNPJ válido.';
        }

        if (!emailRegex.test(formulario.email_empresa.trim())) {
            return 'Informe um e-mail empresarial válido.';
        }

        if (!emailRegex.test(formulario.email_responsavel.trim())) {
            return 'Informe um e-mail válido para o responsável.';
        }

        if (formulario.nome_empresa.trim().length < 2) {
            return 'Informe o nome da empresa corretamente.';
        }

        if (formulario.nome_responsavel.trim().length < 2) {
            return 'Informe o nome do responsável corretamente.';
        }

        return '';
    }

    async function enviarSolicitacao(event) {
        event.preventDefault();

        const mensagemErro = validarFormulario();

        if (mensagemErro) {
            setErro(mensagemErro);
            return;
        }

        setCarregando(true);
        setErro('');

        try {
            const dados = {
                nome_empresa: formulario.nome_empresa.trim(),
                cnpj: formulario.cnpj.replace(/[^a-zA-Z0-9]/g, '').toUpperCase(),
                email_empresa: formulario.email_empresa.trim().toLowerCase(),
                telefone: formulario.telefone.trim(),
                nome_responsavel: formulario.nome_responsavel.trim(),
                email_responsavel: formulario.email_responsavel.trim().toLowerCase()
            };

            await api.post('/solicitacoes', dados);

            setSucesso(true);
            setFormulario(estadoInicial);

        } catch (error) {
            setErro(error.message || 'Não foi possível enviar sua solicitação.');
        } finally {
            setCarregando(false);
        }
    }

    function novaSolicitacao() {
        setSucesso(false);
        setErro('');
        setFormulario(estadoInicial);
    }

    return (
        <main className="solicitacao-page">
            <div className="solicitacao-container">

                <header className="solicitacao-header">
                    <Link to="/login" className="solicitacao-logo">
                        <span className="solicitacao-logo-icon">K</span>
                        <span>KControl</span>
                    </Link>

                    <Link to="/login" className="solicitacao-voltar">
                        <i className="bi bi-arrow-left"></i>
                        Voltar ao login
                    </Link>
                </header>

                <section className="solicitacao-content">

                    {sucesso ? (
                        <div className="solicitacao-sucesso">
                            <div className="solicitacao-sucesso-icon">
                                <i className="bi bi-check-lg"></i>
                            </div>

                            <span className="solicitacao-eyebrow">
                                Solicitação enviada
                            </span>

                            <h1>Tudo certo por aqui!</h1>

                            <p>
                                Sua solicitação foi recebida com sucesso.
                                Nossa equipe irá analisar os dados enviados.
                            </p>

                            <div className="solicitacao-status">
                                <div className="solicitacao-status-icon">
                                    <i className="bi bi-hourglass-split"></i>
                                </div>

                                <div>
                                    <strong>Em análise</strong>
                                    <span>
                                        Sua solicitação aguarda aprovação.
                                    </span>
                                </div>
                            </div>

                            <Link to="/login" className="solicitacao-btn">
                                Voltar ao login
                                <i className="bi bi-arrow-right"></i>
                            </Link>

                            <button
                                type="button"
                                className="solicitacao-nova"
                                onClick={novaSolicitacao}
                            >
                                Enviar outra solicitação
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="solicitacao-intro">
                                <span className="solicitacao-eyebrow">
                                    Acesso à plataforma
                                </span>

                                <h1>Solicite seu acesso.</h1>

                                <p>
                                    Preencha os dados abaixo para solicitar
                                    o cadastro da sua empresa no KControl.
                                </p>
                            </div>

                            <form
                                className="solicitacao-form"
                                onSubmit={enviarSolicitacao}
                            >
                                <div className="solicitacao-form-section">
                                    <div className="solicitacao-section-title">
                                        <span>01</span>
                                        <div>
                                            <h2>Dados da empresa</h2>
                                            <p>Informações da organização.</p>
                                        </div>
                                    </div>

                                    <div className="solicitacao-grid">
                                        <div className="solicitacao-field full">
                                            <label htmlFor="nome_empresa">
                                                Nome da empresa
                                                <span>*</span>
                                            </label>

                                            <input
                                                id="nome_empresa"
                                                name="nome_empresa"
                                                type="text"
                                                placeholder="Ex.: Empresa Ltda."
                                                value={formulario.nome_empresa}
                                                onChange={atualizarCampo}
                                                minLength={2}
                                                maxLength={150}
                                                required
                                            />
                                        </div>

                                        <div className="solicitacao-field">
                                            <label htmlFor="cnpj">
                                                CNPJ
                                                <span>*</span>
                                            </label>

                                            <input
                                                id="cnpj"
                                                name="cnpj"
                                                type="text"
                                                placeholder="00.000.000/0000-00"
                                                value={formulario.cnpj}
                                                onChange={atualizarCampo}
                                                maxLength={18}
                                                required
                                            />
                                        </div>

                                        <div className="solicitacao-field">
                                            <label htmlFor="telefone">
                                                Telefone
                                                <small>Opcional</small>
                                            </label>

                                            <input
                                                id="telefone"
                                                name="telefone"
                                                type="tel"
                                                placeholder="(00) 00000-0000"
                                                value={formulario.telefone}
                                                onChange={atualizarCampo}
                                            />
                                        </div>

                                        <div className="solicitacao-field full">
                                            <label htmlFor="email_empresa">
                                                E-mail da empresa
                                                <span>*</span>
                                            </label>

                                            <input
                                                id="email_empresa"
                                                name="email_empresa"
                                                type="email"
                                                placeholder="contato@empresa.com.br"
                                                value={formulario.email_empresa}
                                                onChange={atualizarCampo}
                                                maxLength={150}
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="solicitacao-divider"></div>

                                <div className="solicitacao-form-section">
                                    <div className="solicitacao-section-title">
                                        <span>02</span>
                                        <div>
                                            <h2>Responsável pela conta</h2>
                                            <p>
                                                Pessoa que administrará o acesso
                                                inicial da empresa.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="solicitacao-grid">
                                        <div className="solicitacao-field full">
                                            <label htmlFor="nome_responsavel">
                                                Nome completo
                                                <span>*</span>
                                            </label>

                                            <input
                                                id="nome_responsavel"
                                                name="nome_responsavel"
                                                type="text"
                                                placeholder="Nome do responsável"
                                                value={formulario.nome_responsavel}
                                                onChange={atualizarCampo}
                                                minLength={2}
                                                maxLength={100}
                                                required
                                            />
                                        </div>

                                        <div className="solicitacao-field full">
                                            <label htmlFor="email_responsavel">
                                                E-mail do responsável
                                                <span>*</span>
                                            </label>

                                            <input
                                                id="email_responsavel"
                                                name="email_responsavel"
                                                type="email"
                                                placeholder="responsavel@empresa.com.br"
                                                value={formulario.email_responsavel}
                                                onChange={atualizarCampo}
                                                maxLength={150}
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>

                                {erro && (
                                    <div className="solicitacao-erro" role="alert">
                                        <i className="bi bi-exclamation-circle"></i>
                                        {erro}
                                    </div>
                                )}

                                <div className="solicitacao-submit-area">
                                    <p>
                                        Os dados enviados serão utilizados
                                        para análise da solicitação de acesso.
                                    </p>

                                    <button
                                        type="submit"
                                        className="solicitacao-btn"
                                        disabled={carregando}
                                    >
                                        {carregando ? (
                                            <>
                                                <span className="solicitacao-spinner"></span>
                                                Enviando...
                                            </>
                                        ) : (
                                            <>
                                                Enviar solicitação
                                                <i className="bi bi-arrow-right"></i>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </>
                    )}
                </section>

                <footer className="solicitacao-footer">
                    <span>© {new Date().getFullYear()} KControl</span>
                    <span>Solicitação de acesso à plataforma</span>
                </footer>
            </div>
        </main>
    );
}
