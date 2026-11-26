import { useState } from 'react';
import { formatJsonForDisplay, formatXmlForDisplay } from '../utils/parsers';

function formatBodyForView(rawBody, formato, indentar) {
  if (!rawBody) {
    return '(corpo vazio)';
  }
  if (!indentar) {
    return rawBody;
  }
  return formato === 'xml' ? formatXmlForDisplay(rawBody) : formatJsonForDisplay(rawBody);
}

function HttpMetaGrid({ response }) {
  return (
    <dl className="meta-grid">
      <div className="meta-item">
        <dt>Método HTTP</dt>
        <dd className="mono-text">{response.method}</dd>
      </div>
      <div className="meta-item meta-item--wide">
        <dt>URL solicitada</dt>
        <dd className="mono-text">{response.url}</dd>
      </div>
      <div className="meta-item">
        <dt>Accept enviado</dt>
        <dd className="mono-text">{response.acceptHeader}</dd>
      </div>
      <div className="meta-item">
        <dt>Status recebido</dt>
        <dd>
          <span
            className={`status-badge ${
              response.status >= 200 && response.status < 300
                ? 'status-badge--ok'
                : 'status-badge--err'
            }`}
          >
            {response.status} {response.statusText}
          </span>
        </dd>
      </div>
      <div className="meta-item">
        <dt>Content-Type recebido</dt>
        <dd className="mono-text">{response.contentType}</dd>
      </div>
      <div className="meta-item">
        <dt>Vary recebido</dt>
        <dd className="mono-text">{response.vary}</dd>
      </div>
      <div className="meta-item">
        <dt>Tamanho do corpo (UTF-8)</dt>
        <dd className="mono-text strong-bytes">{response.byteSize} bytes</dd>
      </div>
    </dl>
  );
}

export function RequestLabSection({
  lastResponse,
  comparisonResult,
  loadingLab,
  onSolicitarJson,
  onSolicitarXml,
  onCompararFormatos,
  onCadastrarProduto,
}) {
  const [indentar, setIndentar] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [novoNome, setNovoNome] = useState('');
  const [novoPreco, setNovoPreco] = useState('');
  const [novoEstoque, setNovoEstoque] = useState('');
  const [postFormato, setPostFormato] = useState('json');
  const [postError, setPostError] = useState('');

  const handleCreateSubmit = async (event) => {
    event.preventDefault();
    setPostError('');

    if (!novoNome.trim() || novoPreco === '' || novoEstoque === '') {
      setPostError('Preencha nome, preço e estoque para enviar o POST.');
      return;
    }

    const ok = await onCadastrarProduto({
      formato: postFormato,
      produto: {
        nome: novoNome.trim(),
        preco: Number(novoPreco),
        estoque: Number(novoEstoque),
      },
    });

    if (ok) {
      setNovoNome('');
      setNovoPreco('');
      setNovoEstoque('');
    }
  };

  const renderByteSummary = () => {
    if (!comparisonResult) {
      return null;
    }
    const jsonBytes = comparisonResult.json.byteSize;
    const xmlBytes = comparisonResult.xml.byteSize;
    const diff = xmlBytes - jsonBytes;
    const percent = jsonBytes > 0 ? ((diff / jsonBytes) * 100).toFixed(1) : '0.0';

    return (
      <div className="comparison-summary">
        <div className="comparison-metrics">
          <span className="metric-chip metric-chip--json">JSON: {jsonBytes} bytes</span>
          <span className="metric-chip metric-chip--xml">XML: {xmlBytes} bytes</span>
          <span className="metric-chip metric-chip--diff">
            Diferença: {diff >= 0 ? `+${diff}` : diff} bytes ({diff >= 0 ? `+${percent}` : percent}%)
          </span>
        </div>
        <p className="method-note">
          Medição realizada com <code>TextEncoder</code> sobre o corpo textual original em UTF-8, sem
          considerar cabeçalhos HTTP ou compressão de rede.
        </p>
      </div>
    );
  };

  return (
    <section className="panel" aria-labelledby="lab-heading">
      <div className="panel-header">
        <div>
          <span className="area-tag">Área 2</span>
          <h2 id="lab-heading">Laboratório de Requisições</h2>
        </div>

        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={indentar}
            onChange={(e) => setIndentar(e.target.checked)}
          />
          Indentar visualização
        </label>
      </div>

      <div className="lab-actions">
        <button
          type="button"
          className="btn btn-json"
          onClick={onSolicitarJson}
          disabled={loadingLab}
        >
          Solicitar JSON
        </button>
        <button
          type="button"
          className="btn btn-xml"
          onClick={onSolicitarXml}
          disabled={loadingLab}
        >
          Solicitar XML
        </button>
        <button
          type="button"
          className="btn btn-primary"
          onClick={onCompararFormatos}
          disabled={loadingLab}
        >
          {loadingLab ? 'Executando...' : 'Comparar formatos'}
        </button>

        <button
          type="button"
          className="btn btn-ghost lab-toggle-post"
          onClick={() => setShowCreateForm((prev) => !prev)}
        >
          {showCreateForm ? 'Ocultar POST /produtos' : 'Testar cadastro (POST /produtos)'}
        </button>
      </div>

      {showCreateForm && (
        <form className="post-box" onSubmit={handleCreateSubmit}>
          <div className="post-box-header">
            <h3>Demonstração de Desserialização (POST /produtos)</h3>
            <div className="segmented-control" role="group" aria-label="Content-Type do POST">
              <button
                type="button"
                className={`seg-btn ${postFormato === 'json' ? 'seg-btn--json-active' : ''}`}
                onClick={() => setPostFormato('json')}
              >
                Content-Type: JSON
              </button>
              <button
                type="button"
                className={`seg-btn ${postFormato === 'xml' ? 'seg-btn--xml-active' : ''}`}
                onClick={() => setPostFormato('xml')}
              >
                Content-Type: XML
              </button>
            </div>
          </div>

          <div className="post-fields">
            <label className="field-group">
              <span>Nome</span>
              <input
                type="text"
                placeholder="Ex: Webcam HD"
                value={novoNome}
                onChange={(e) => setNovoNome(e.target.value)}
                className="text-input"
              />
            </label>
            <label className="field-group">
              <span>Preço (R$)</span>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="249.90"
                value={novoPreco}
                onChange={(e) => setNovoPreco(e.target.value)}
                className="text-input"
              />
            </label>
            <label className="field-group">
              <span>Estoque</span>
              <input
                type="number"
                min="0"
                step="1"
                placeholder="10"
                value={novoEstoque}
                onChange={(e) => setNovoEstoque(e.target.value)}
                className="text-input"
              />
            </label>
            <button type="submit" className="btn btn-primary" disabled={loadingLab}>
              Enviar POST
            </button>
          </div>

          {postError && <p className="post-error">{postError}</p>}
        </form>
      )}

      {comparisonResult ? (
        <div className="comparison-container">
          {renderByteSummary()}

          <div className="comparison-grid">
            <article className="format-card format-card--json">
              <header className="format-card-header">
                <span className="format-pill format-pill--json">JSON</span>
                <span className="mono-text">{comparisonResult.json.byteSize} bytes</span>
              </header>
              <HttpMetaGrid response={comparisonResult.json} />
              <pre className="code-viewer">
                <code>
                  {formatBodyForView(comparisonResult.json.rawBody, 'json', indentar)}
                </code>
              </pre>
            </article>

            <article className="format-card format-card--xml">
              <header className="format-card-header">
                <span className="format-pill format-pill--xml">XML</span>
                <span className="mono-text">{comparisonResult.xml.byteSize} bytes</span>
              </header>
              <HttpMetaGrid response={comparisonResult.xml} />
              <pre className="code-viewer">
                <code>
                  {formatBodyForView(comparisonResult.xml.rawBody, 'xml', indentar)}
                </code>
              </pre>
            </article>
          </div>
        </div>
      ) : lastResponse ? (
        <div className="single-response-box">
          <div className="single-response-header">
            <span className={`format-pill format-pill--${lastResponse.formato}`}>
              {lastResponse.formato.toUpperCase()}
            </span>
            <span className="method-note">
              Tamanho medido com <code>TextEncoder</code> sobre o corpo UTF-8 original (sem
              cabeçalhos HTTP ou compressão).
            </span>
          </div>

          <HttpMetaGrid response={lastResponse} />

          {lastResponse.requestPayload && (
            <div className="payload-sent-box">
              <span className="control-label">
                Corpo enviado ({lastResponse.requestContentType}):
              </span>
              <pre className="code-viewer code-viewer--compact">
                <code>{lastResponse.requestPayload}</code>
              </pre>
            </div>
          )}

          <pre className="code-viewer">
            <code>
              {formatBodyForView(lastResponse.rawBody, lastResponse.formato, indentar)}
            </code>
          </pre>
        </div>
      ) : (
        <div className="empty-state">
          Selecione um formato ou clique em <strong>Comparar formatos</strong> para inspecionar a
          comunicação HTTP.
        </div>
      )}
    </section>
  );
}
