import axios from 'axios';
import { getUtf8ByteSize } from '../utils/parsers';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080').replace(/\/+$/, '');

const httpClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 8000,
});

export const ACCEPT_HEADERS = {
  json: 'application/json',
  xml: 'application/xml',
};

function normalizeAxiosError(error) {
  if (error.code === 'ECONNABORTED') {
    return new Error('Tempo limite excedido ao aguardar resposta do StockService.');
  }
  if (!error.response) {
    return new Error(
      `API indisponível em ${API_BASE_URL}. Verifique se o StockService está em execução na porta 8080.`
    );
  }
  return new Error(`Erro HTTP ${error.response.status} ao comunicar com o servidor.`);
}

function buildResponseMeta({ method, path, acceptHeader, requestContentType, response }) {
  const rawBody = typeof response.data === 'string' ? response.data : String(response.data ?? '');
  const contentType = response.headers['content-type'] ?? '(não informado)';
  const vary = response.headers['vary'] ?? '(não informado)';

  return {
    method,
    url: `${API_BASE_URL}${path}`,
    path,
    acceptHeader,
    requestContentType: requestContentType ?? null,
    status: response.status,
    statusText: response.statusText || '',
    contentType,
    vary,
    rawBody,
    byteSize: getUtf8ByteSize(rawBody),
  };
}

export async function fetchProdutosRaw({ formato, produtoId = '' }) {
  const acceptHeader = ACCEPT_HEADERS[formato] ?? ACCEPT_HEADERS.json;
  const trimmedId = String(produtoId).trim();
  const path = trimmedId ? `/produtos/${encodeURIComponent(trimmedId)}` : '/produtos';

  try {
    const response = await httpClient.get(path, {
      headers: {
        Accept: acceptHeader,
      },
      // Preserva o corpo textual exato sem conversão automática do Axios
      responseType: 'text',
      transformResponse: [(data) => data],
      validateStatus: () => true,
    });

    return {
      ...buildResponseMeta({
        method: 'GET',
        path,
        acceptHeader,
        response,
      }),
      formato,
      isSingle: Boolean(trimmedId),
    };
  } catch (error) {
    throw normalizeAxiosError(error);
  }
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function createProdutoRaw({ formato, produto }) {
  const mediaType = ACCEPT_HEADERS[formato] ?? ACCEPT_HEADERS.json;
  const path = '/produtos';

  const payload =
    formato === 'xml'
      ? `<produto><nome>${escapeXml(produto.nome)}</nome><preco>${Number(produto.preco).toFixed(2)}</preco><estoque>${Number(produto.estoque)}</estoque></produto>`
      : JSON.stringify({
          nome: produto.nome,
          preco: Number(produto.preco),
          estoque: Number(produto.estoque),
        });

  try {
    const response = await httpClient.post(path, payload, {
      headers: {
        'Content-Type': mediaType,
        Accept: mediaType,
      },
      responseType: 'text',
      transformResponse: [(data) => data],
      validateStatus: () => true,
    });

    return {
      ...buildResponseMeta({
        method: 'POST',
        path,
        acceptHeader: mediaType,
        requestContentType: mediaType,
        response,
      }),
      formato,
      isSingle: true,
      requestPayload: payload,
    };
  } catch (error) {
    throw normalizeAxiosError(error);
  }
}
