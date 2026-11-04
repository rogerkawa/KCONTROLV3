import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import './Setores.css';

function Setores() {
    const { usuario } = useAuth();
    const { mostrarToast } = useToast();
    const invalidToastRef = useRef(false);
    const isAdmin = usuario?.role?.toLowerCase() === 'admin';

    const [setores, setSetores] = useState([]);
    const [busca, setBusca] = useState('');

    const [carregando, setCarregando] = useState(true);
    const [atualizando, setAtualizando] = useState(false);
    const [erro, setErro] = useState('');

    const [modal, setModal] = useState(null);
    const [nome, setNome] = useState('');
    const [salvando, setSalvando] = useState(false);

    const [setorExcluir, setSetorExcluir] = useState(null);
    const [excluindo, setExcluindo] = useState(false);

    const carregarSetores = useCallback(async (silencioso = false) => {
        try {
            if (silencioso) {
                setAtualizando(true);
            } else {
                setCarregando(true);
            }

            setErro('');

            const resposta = await api.get('/setores');
            setSetores(resposta.setores || []);
        } catch (error) {
            setErro(error.message || 'Não foi possível carregar os setores.');
        } finally {
            setCarregando(false);
            setAtualizando(false);
        }
    }, []);

    useEffect(() => {
        carregarSetores();
    }, [carregarSetores]);

    const setoresFiltrados = useMemo(() => {
        return setores.filter(setor =>
            setor.nome?.toLowerCase().includes(busca.toLowerCase())
        );
    }, [setores, busca]);

    const abrirModalCriacao = () => {
        setNome('');
        setModal({ tipo: 'criar' });
    };

    const abrirModalEdicao = setor => {
        setNome(setor.nome || '');
        setModal({ tipo: 'editar', setor });
    };

    const fecharModal = () => {
        if (salvando) return;

        setModal(null);
        setNome('');
    };

    const avisarFormularioInvalido = event => {
        event.preventDefault();

        if (invalidToastRef.current) return;

        invalidToastRef.current = true;
        mostrarToast('Informe o nome do setor.', 'warning');
        window.setTimeout(() => {
            invalidToastRef.current = false;
        }, 1000);
    };

    const salvarSetor = async event => {
        event.preventDefault();

        const nomeFormatado = nome.trim();

        if (!nomeFormatado) {
            mostrarToast('Informe o nome do setor.', 'warning');
            return;
        }

        try {
            setSalvando(true);

            if (modal.tipo === 'criar') {
                await api.post('/setores', {
                    nome: nomeFormatado
                });

                mostrarToast('Setor cadastrado com sucesso!', 'success');
            } else {
                await api.put(`/setores/${modal.setor.id_setor}`, {
                    nome: nomeFormatado
                });

                mostrarToast('Setor atualizado com sucesso!', 'success');
            }

            setModal(null);
            setNome('');

            await carregarSetores(true);
        } catch (error) {
            mostrarToast(
                error.message || 'Não foi possível salvar o setor.',
                'error'
            );
        } finally {
            setSalvando(false);
        }
    };

    const excluirSetor = async () => {
        if (!setorExcluir) return;

        try {
            setExcluindo(true);

            await api.delete(`/setores/${setorExcluir.id_setor}`);

            mostrarToast('Setor excluído com sucesso!', 'success');
            setSetorExcluir(null);

            await carregarSetores(true);
        } catch (error) {
            mostrarToast(
                error.message || 'Não foi possível excluir o setor.',
                'error'
            );
        } finally {
            setExcluindo(false);
        }
    };

    return (
        <section className="setores-page">

            {/* Cabeçalho */}
            <header className="setores-header">
                <div>
                    <span className="setores-eyebrow">
                        <i className="bi bi-diagram-3"></i>
                        GERENCIAMENTO
                    </span>

                    <h1>Setores</h1>

                    <p>
                        Organize os departamentos e áreas da sua empresa
                        em um só lugar.
                    </p>
                </div>

                <div className="setores-header-actions">
                    <button
                        type="button"
                        className="setores-refresh-btn"
                        onClick={() => carregarSetores(true)}
                        disabled={atualizando || carregando}
                        title="Atualizar lista"
                        aria-label="Atualizar lista"
                    >
                        <i className={`bi bi-arrow-clockwise ${atualizando ? 'spinning' : ''}`}></i>
                    </button>

                    {isAdmin && (
                        <button
                            type="button"
                            className="setores-primary-btn"
                            onClick={abrirModalCriacao}
                        >
                            <i className="bi bi-plus-lg"></i>
                            Novo setor
                        </button>
                    )}
                </div>
            </header>

            {/* Indicador */}
            <div className="setores-stats">
                <article className="setor-stat-card">
                    <div className="setor-stat-icon">
                        <i className="bi bi-diagram-3"></i>
                    </div>

                    <div>
                        <span>Total de setores</span>
                        <strong>{setores.length}</strong>
                    </div>
                </article>

                <div className="setores-stats-description">
                    <div className="setores-stats-description-icon">
                        <i className="bi bi-info-circle"></i>
                    </div>

                    <div>
                        <strong>Organização da empresa</strong>
                        <p>
                            Os setores ajudam a identificar a área responsável
                            em cada registro de retirada.
                        </p>
                    </div>
                </div>
            </div>

            {/* Lista */}
            <div className="setores-content">
                <div className="setores-toolbar">
                    <div className="setores-toolbar-title">
                        <h2>Setores cadastrados</h2>
                        <span>{setoresFiltrados.length} resultado(s)</span>
                    </div>

                    <div className="setores-search">
                        <i className="bi bi-search"></i>

                        <input
                            type="search"
                            placeholder="Pesquisar setor..."
                            value={busca}
                            onChange={event => setBusca(event.target.value)}
                        />

                        {busca && (
                            <button
                                type="button"
                                onClick={() => setBusca('')}
                                aria-label="Limpar pesquisa"
                            >
                                <i className="bi bi-x-lg"></i>
                            </button>
                        )}
                    </div>
                </div>

                {carregando ? (
                    <div className="setores-state">
                        <span className="setores-loader"></span>
                        <p>Carregando setores...</p>
                    </div>
                ) : erro ? (
                    <div className="setores-state setores-state-error">
                        <i className="bi bi-exclamation-circle"></i>
                        <h3>Não foi possível carregar os setores</h3>
                        <p>{erro}</p>

                        <button
                            type="button"
                            onClick={() => carregarSetores()}
                        >
                            Tentar novamente
                        </button>
                    </div>
                ) : setoresFiltrados.length === 0 ? (
                    <div className="setores-state">
                        <div className="setores-empty-icon">
                            <i className="bi bi-diagram-3"></i>
                        </div>

                        <h3>
                            {setores.length === 0
                                ? 'Nenhum setor cadastrado'
                                : 'Nenhum setor encontrado'}
                        </h3>

                        <p>
                            {setores.length === 0
                                ? 'Cadastre o primeiro setor para organizar os registros da empresa.'
                                : 'Tente pesquisar utilizando outro nome.'}
                        </p>

                        {isAdmin && setores.length === 0 && (
                            <button
                                type="button"
                                className="setores-primary-btn"
                                onClick={abrirModalCriacao}
                            >
                                <i className="bi bi-plus-lg"></i>
                                Cadastrar primeiro setor
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="setores-table-wrapper">
                        <table className="setores-table">
                            <thead>
                                <tr>
                                    <th>SETOR</th>
                                    <th>IDENTIFICAÇÃO</th>
                                    {isAdmin && (
                                        <th className="setores-actions-heading">
                                            AÇÕES
                                        </th>
                                    )}
                                </tr>
                            </thead>

                            <tbody>
                                {setoresFiltrados.map((setor, index) => (
                                    <tr
                                        key={setor.id_setor}
                                        style={{ '--item-index': index }}
                                    >
                                        <td>
                                            <div className="setor-name-cell">
                                                <div className="setor-row-icon">
                                                    <i className="bi bi-diagram-3"></i>
                                                </div>

                                                <div>
                                                    <strong>{setor.nome}</strong>
                                                    <span>Setor da empresa</span>
                                                </div>
                                            </div>
                                        </td>

                                        <td>
                                            <span className="setor-id">
                                                #{String(setor.id_setor).padStart(3, '0')}
                                            </span>
                                        </td>

                                        {isAdmin && (
                                            <td>
                                                <div className="setor-actions">
                                                    <button
                                                        type="button"
                                                        title="Editar setor"
                                                        aria-label={`Editar ${setor.nome}`}
                                                        onClick={() => abrirModalEdicao(setor)}
                                                    >
                                                        <i className="bi bi-pencil"></i>
                                                    </button>

                                                    <button
                                                        type="button"
                                                        className="delete"
                                                        title="Excluir setor"
                                                        aria-label={`Excluir ${setor.nome}`}
                                                        onClick={() => setSetorExcluir(setor)}
                                                    >
                                                        <i className="bi bi-trash3"></i>
                                                    </button>
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal de cadastro e edição */}
            {modal && (
                <div
                    className="setores-modal-overlay"
                    onMouseDown={event => {
                        if (event.target === event.currentTarget) {
                            fecharModal();
                        }
                    }}
                >
                    <form
                        className="setores-modal"
                        onSubmit={salvarSetor}
                        onInvalidCapture={avisarFormularioInvalido}
                    >
                        <div className="setores-modal-header">
                            <div>
                                <span className="setores-modal-eyebrow">
                                    GERENCIAMENTO DE SETORES
                                </span>

                                <h2>
                                    {modal.tipo === 'criar'
                                        ? 'Novo setor'
                                        : 'Editar setor'}
                                </h2>
                            </div>

                            <button
                                type="button"
                                className="setores-modal-close"
                                onClick={fecharModal}
                                disabled={salvando}
                                aria-label="Fechar modal"
                            >
                                <i className="bi bi-x-lg"></i>
                            </button>
                        </div>

                        <div className="setores-form-group">
                            <label htmlFor="nomeSetor">Nome do setor</label>

                            <input
                                id="nomeSetor"
                                type="text"
                                placeholder="Ex.: Tecnologia da Informação"
                                value={nome}
                                onChange={event => setNome(event.target.value)}
                                maxLength={100}
                                autoFocus
                                required
                            />

                            <span>
                                Informe o nome do departamento ou área da empresa.
                            </span>
                        </div>

                        <div className="setores-modal-actions">
                            <button
                                type="button"
                                className="setores-secondary-btn"
                                onClick={fecharModal}
                                disabled={salvando}
                            >
                                Cancelar
                            </button>

                            <button
                                type="submit"
                                className="setores-primary-btn"
                                disabled={salvando}
                            >
                                {salvando ? (
                                    <>
                                        <span className="setores-button-loader"></span>
                                        Salvando...
                                    </>
                                ) : (
                                    <>
                                        <i className="bi bi-check2"></i>
                                        {modal.tipo === 'criar'
                                            ? 'Cadastrar setor'
                                            : 'Salvar alterações'}
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Confirmação de exclusão */}
            {setorExcluir && (
                <div
                    className="setores-modal-overlay"
                    onMouseDown={event => {
                        if (
                            event.target === event.currentTarget &&
                            !excluindo
                        ) {
                            setSetorExcluir(null);
                        }
                    }}
                >
                    <div className="setores-modal setores-confirm-modal">
                        <div className="setores-confirm-icon">
                            <i className="bi bi-trash3"></i>
                        </div>

                        <h2>Excluir setor?</h2>

                        <p>
                            Você está prestes a excluir{' '}
                            <strong>{setorExcluir.nome}</strong>.
                            Essa ação não poderá ser desfeita.
                        </p>

                        <div className="setores-modal-actions">
                            <button
                                type="button"
                                className="setores-secondary-btn"
                                onClick={() => setSetorExcluir(null)}
                                disabled={excluindo}
                            >
                                Cancelar
                            </button>

                            <button
                                type="button"
                                className="setores-danger-btn"
                                onClick={excluirSetor}
                                disabled={excluindo}
                            >
                                {excluindo ? 'Excluindo...' : 'Sim, excluir'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </section>
    );
}

export default Setores;