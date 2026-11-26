import { useCallback, useEffect, useState } from 'react';
import { CatalogSection } from './components/CatalogSection';
import { RequestLabSection } from './components/RequestLabSection';
import { createProdutoRaw, fetchProdutosRaw } from './services/stockApi';
import { parseProdutosJson, parseProdutosXml } from './utils/parsers';
import './App.css';

function parseResponseByFormat(responseMeta) {
  if (responseMeta.formato === 'xml') {
    return parseProdutosXml(responseMeta.rawBody, responseMeta.isSingle);
  }
  return parseProdutosJson(responseMeta.rawBody, responseMeta.isSingle);
}

function buildHttpErrorMessage(responseMeta) {
  if (responseMeta.status === 404) {
    return 'Produto não encontrado (HTTP 404). Verifique o ID informado.';
  }
  if (responseMeta.status === 406) {
    return 'Formato de resposta não suportado pelo servidor (HTTP 406).';
  }
  if (responseMeta.status === 415) {
    return 'Content-Type enviado não é suportado pelo servidor (HTTP 415).';
  }
  if (responseMeta.status >= 400) {
    return `O servidor retornou erro HTTP ${responseMeta.status}.`;
  }
  return '';
}

function App() {
  const [formato, setFormato] = useState('json');
  const [produtoIdInput, setProdutoIdInput] = useState('');
  const [activeProdutoId, setActiveProdutoId] = useState('');
  const [produtos, setProdutos] = useState([]);
  const [activeFormat, setActiveFormat] = useState('json');
  const [lastResponse, setLastResponse] = useState(null);
  const [comparisonResult, setComparisonResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const executarConsulta = useCallback(async ({ targetFormato, targetId, keepComparison = false }) => {
    setLoading(true);
    setErrorMessage('');
    if (!keepComparison) {
      setComparisonResult(null);
    }

    try {
      const responseMeta = await fetchProdutosRaw({
        formato: targetFormato,
        produtoId: targetId,
      });

      setLastResponse(responseMeta);
      setActiveProdutoId(targetId);

      const httpError = buildHttpErrorMessage(responseMeta);
      if (httpError) {
        setProdutos([]);
        setErrorMessage(httpError);
        return;
      }

      const listaNormalizada = parseResponseByFormat(responseMeta);
      setProdutos(listaNormalizada);
      setActiveFormat(targetFormato);
    } catch (error) {
      setProdutos([]);
      setErrorMessage(error.message || 'Erro inesperado ao consultar o StockService.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const carregarInicial = async () => {
      await executarConsulta({ targetFormato: 'json', targetId: '' });
    };
    carregarInicial();
  }, [executarConsulta]);

  const handleConsultarTodos = () => {
    setProdutoIdInput('');
    executarConsulta({ targetFormato: formato, targetId: '' });
  };

  const handleBuscarPorId = () => {
    const trimmed = produtoIdInput.trim();
    if (!trimmed) {
      setErrorMessage('Informe um ID numérico para buscar um produto específico.');
      return;
    }
    executarConsulta({ targetFormato: formato, targetId: trimmed });
  };

  const handleSolicitarFormato = (targetFormato) => {
    setFormato(targetFormato);
    executarConsulta({ targetFormato, targetId: activeProdutoId });
  };

  const handleCompararFormatos = async () => {
    setLoading(true);
    setErrorMessage('');

    try {
      const [jsonRes, xmlRes] = await Promise.all([
        fetchProdutosRaw({ formato: 'json', produtoId: activeProdutoId }),
        fetchProdutosRaw({ formato: 'xml', produtoId: activeProdutoId }),
      ]);

      setComparisonResult({ json: jsonRes, xml: xmlRes });
      setLastResponse(jsonRes);

      const httpError = buildHttpErrorMessage(jsonRes) || buildHttpErrorMessage(xmlRes);
      if (httpError) {
        setProdutos([]);
        setErrorMessage(httpError);
        return;
      }

      const parsedJson = parseResponseByFormat(jsonRes);
      parseResponseByFormat(xmlRes);
      setProdutos(parsedJson);
      setActiveFormat(formato);
    } catch (error) {
      setErrorMessage(error.message || 'Erro ao comparar formatos JSON e XML.');
    } finally {
      setLoading(false);
    }
  };

  const handleCadastrarProduto = async ({ formato: postFormato, produto }) => {
    setLoading(true);
    setErrorMessage('');
    setComparisonResult(null);

    try {
      const postMeta = await createProdutoRaw({ formato: postFormato, produto });
      setLastResponse(postMeta);

      const httpError = buildHttpErrorMessage(postMeta);
      if (httpError) {
        setErrorMessage(httpError);
        return false;
      }

      parseResponseByFormat(postMeta);

      const listaAtualizada = await fetchProdutosRaw({
        formato: postFormato,
        produtoId: '',
      });
      if (listaAtualizada.status === 200) {
        setProdutos(parseResponseByFormat(listaAtualizada));
        setActiveFormat(postFormato);
        setFormato(postFormato);
        setActiveProdutoId('');
        setProdutoIdInput('');
      }
      return true;
    } catch (error) {
      setErrorMessage(error.message || 'Erro ao enviar POST /produtos.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <h1>WebServicesLab</h1>
          <p className="app-subtitle">
            SalesWeb &rarr; StockService (REST, Negociação de Conteúdo, JSON e XML)
          </p>
        </div>
        <div className="endpoint-chip">
          Endpoint ativo: <code>{activeProdutoId ? `/produtos/${activeProdutoId}` : '/produtos'}</code>
        </div>
      </header>

      <main className="main-content">
        <CatalogSection
          formato={formato}
          onChangeFormato={setFormato}
          produtoIdInput={produtoIdInput}
          onChangeProdutoIdInput={setProdutoIdInput}
          onConsultarTodos={handleConsultarTodos}
          onBuscarPorId={handleBuscarPorId}
          produtos={produtos}
          activeFormat={activeFormat}
          isFilteredById={Boolean(activeProdutoId)}
          loading={loading}
          errorMessage={errorMessage}
        />

        <RequestLabSection
          lastResponse={lastResponse}
          comparisonResult={comparisonResult}
          loadingLab={loading}
          onSolicitarJson={() => handleSolicitarFormato('json')}
          onSolicitarXml={() => handleSolicitarFormato('xml')}
          onCompararFormatos={handleCompararFormatos}
          onCadastrarProduto={handleCadastrarProduto}
        />
      </main>
    </div>
  );
}

export default App;
