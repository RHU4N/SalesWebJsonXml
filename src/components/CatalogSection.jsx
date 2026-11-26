import { formatCurrencyBRL } from '../utils/parsers';

export function CatalogSection({
  formato,
  onChangeFormato,
  produtoIdInput,
  onChangeProdutoIdInput,
  onConsultarTodos,
  onBuscarPorId,
  produtos,
  activeFormat,
  isFilteredById,
  loading,
  errorMessage,
}) {
  const handleIdSubmit = (event) => {
    event.preventDefault();
    onBuscarPorId();
  };

  return (
    <section className="panel" aria-labelledby="catalog-heading">
      <div className="panel-header">
        <div>
          <span className="area-tag">Área 1</span>
          <h2 id="catalog-heading">Catálogo de Produtos</h2>
        </div>

        {activeFormat && !errorMessage && (
          <span className={`format-pill format-pill--${activeFormat}`}>
            Dados obtidos via {activeFormat.toUpperCase()}
          </span>
        )}
      </div>

      <div className="controls-bar">
        <div className="control-group">
          <span className="control-label">Formato da requisição:</span>
          <div className="segmented-control" role="group" aria-label="Formato da requisição">
            <button
              type="button"
              className={`seg-btn ${formato === 'json' ? 'seg-btn--json-active' : ''}`}
              onClick={() => onChangeFormato('json')}
              disabled={loading}
            >
              JSON
            </button>
            <button
              type="button"
              className={`seg-btn ${formato === 'xml' ? 'seg-btn--xml-active' : ''}`}
              onClick={() => onChangeFormato('xml')}
              disabled={loading}
            >
              XML
            </button>
          </div>

          <button
            type="button"
            className="btn btn-primary"
            onClick={onConsultarTodos}
            disabled={loading}
          >
            {loading ? 'Consultando...' : 'Consultar produtos'}
          </button>
        </div>

        <form className="id-search-form" onSubmit={handleIdSubmit}>
          <label htmlFor="produto-id-input" className="control-label">
            Consultar por ID:
          </label>
          <input
            id="produto-id-input"
            type="number"
            min="1"
            step="1"
            placeholder="Ex: 1"
            value={produtoIdInput}
            onChange={(e) => onChangeProdutoIdInput(e.target.value)}
            className="text-input text-input--small"
            disabled={loading}
          />
          <button type="submit" className="btn btn-secondary" disabled={loading}>
            Buscar ID
          </button>
          {isFilteredById && (
            <button
              type="button"
              className="btn btn-ghost"
              onClick={onConsultarTodos}
              disabled={loading}
            >
              Ver todos
            </button>
          )}
        </form>
      </div>

      {errorMessage && (
        <div className="alert alert-error" role="alert">
          {errorMessage}
        </div>
      )}

      {loading && <div className="loading-bar">Carregando dados do StockService...</div>}

      {!loading && !errorMessage && produtos.length === 0 && (
        <div className="empty-state">Nenhum produto encontrado para exibição.</div>
      )}

      {produtos.length > 0 && (
        <div className="table-wrapper">
          <table className="products-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nome do produto</th>
                <th className="align-right">Preço</th>
                <th className="align-right">Estoque</th>
              </tr>
            </thead>
            <tbody>
              {produtos.map((produto) => (
                <tr key={produto.id}>
                  <td className="mono-cell">#{produto.id}</td>
                  <td className="product-name">{produto.nome}</td>
                  <td className="align-right price-cell">{formatCurrencyBRL(produto.preco)}</td>
                  <td className="align-right">
                    <span className="stock-badge">{produto.estoque} un.</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
