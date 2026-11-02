
const API_URL = import.meta.env.VITE_API_URL;

async function request(endpoint, options = {}) {
    const token = localStorage.getItem('token');
    const isFormData = options.body instanceof FormData;

    const config = {
        ...options,
        headers: {
            ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
            ...(token && {
                Authorization: `Bearer ${token}`
            }),
            ...options.headers
        }
    };

    const resposta = await fetch(`${API_URL}${endpoint}`, config);
    const dados = await resposta.json().catch(() => ({}));

    if (!resposta.ok) {
        throw new Error(
            dados.mensagem ||
            dados.message ||
            'Ocorreu um erro na requisição.'
        );
    }

    return dados;
}

const api = {
    get(endpoint) {
        return request(endpoint);
    },

    post(endpoint, dados) {
        return request(endpoint, {
            method: 'POST',
            body: dados instanceof FormData
                ? dados
                : JSON.stringify(dados)
        });
    },

    put(endpoint, dados) {
        return request(endpoint, {
            method: 'PUT',
            body: dados instanceof FormData
                ? dados
                : JSON.stringify(dados)
        });
    },

    patch(endpoint, dados) {
        return request(endpoint, {
            method: 'PATCH',
            body: dados instanceof FormData
                ? dados
                : JSON.stringify(dados)
        });
    },

    delete(endpoint) {
        return request(endpoint, {
            method: 'DELETE'
        });
    }
};

export default api;
