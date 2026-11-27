const brlFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

export function formatCurrencyBRL(value) {
  const num = Number(value);
  if (Number.isNaN(num)) {
    return 'R$ 0,00';
  }
  return brlFormatter.format(num);
}

// Mede o tamanho real em bytes UTF-8 sobre o corpo textual original recebido
// APRESENTACAO 11 — Mede bytes UTF-8 do corpo original, sem cabecalhos ou compressao.
export function getUtf8ByteSize(rawText) {
  if (typeof rawText !== 'string') {
    return 0;
  }
  return new TextEncoder().encode(rawText).length;
}

function normalizeProduto(item) {
  if (!item || typeof item !== 'object') {
    throw new Error('Estrutura de produto inválida.');
  }

  const id = Number(item.id);
  const nome = typeof item.nome === 'string' ? item.nome : '';
  const preco = Number(item.preco);
  const estoque = Number(item.estoque);

  if (Number.isNaN(id) || !nome || Number.isNaN(preco) || Number.isNaN(estoque)) {
    throw new Error('Campos obrigatórios do produto ausentes ou inválidos.');
  }

  return { id, nome, preco, estoque };
}

// Interpreta resposta JSON usando JSON.parse() nativo
export function parseProdutosJson(rawText, isSingle) {
  let parsed;
  try {
    // APRESENTACAO 12 — JSON.parse converte o texto JSON em valores JavaScript.
    parsed = JSON.parse(rawText);
  } catch {
    throw new Error('Falha ao interpretar JSON recebido do servidor (JSON.parse).');
  }

  if (isSingle) {
    return [normalizeProduto(parsed)];
  }

  if (!parsed || !Array.isArray(parsed.produtos)) {
    throw new Error('JSON recebido não contém a lista esperada em "produtos".');
  }

  return parsed.produtos.map(normalizeProduto);
}

function getTagText(parentElement, tagName) {
  const el = parentElement.getElementsByTagName(tagName)[0];
  if (!el) {
    throw new Error(`Elemento XML <${tagName}> não encontrado.`);
  }
  return el.textContent?.trim() ?? '';
}

// Interpreta resposta XML usando DOMParser nativo do navegador
export function parseProdutosXml(rawText, isSingle) {
  // APRESENTACAO 13 — DOMParser interpreta a estrutura XML recebida do servidor.
  const parser = new DOMParser();
  const doc = parser.parseFromString(rawText, 'application/xml');

  const parserError = doc.querySelector('parsererror');
  if (parserError) {
    throw new Error('Falha ao interpretar XML recebido do servidor (DOMParser).');
  }

  const root = doc.documentElement;
  if (!root) {
    throw new Error('Documento XML vazio.');
  }

  let produtoNodes;
  if (isSingle) {
    if (root.nodeName !== 'produto') {
      throw new Error(`Elemento raiz esperado <produto>, mas recebido <${root.nodeName}>.`);
    }
    produtoNodes = [root];
  } else {
    if (root.nodeName !== 'produtos') {
      throw new Error(`Elemento raiz esperado <produtos>, mas recebido <${root.nodeName}>.`);
    }
    produtoNodes = Array.from(root.getElementsByTagName('produto'));
  }

  return produtoNodes.map((node) => {
    const id = Number(getTagText(node, 'id'));
    const nome = getTagText(node, 'nome');
    const preco = Number(getTagText(node, 'preco'));
    const estoque = Number(getTagText(node, 'estoque'));

    if (Number.isNaN(id) || !nome || Number.isNaN(preco) || Number.isNaN(estoque)) {
      throw new Error('Valores inválidos nos elementos do produto XML.');
    }

    return { id, nome, preco, estoque };
  });
}

// Formatação apenas visual (não utilizada para medir bytes)
export function formatJsonForDisplay(rawText) {
  try {
    return JSON.stringify(JSON.parse(rawText), null, 2);
  } catch {
    return rawText;
  }
}

export function formatXmlForDisplay(rawText) {
  try {
    const cleaned = rawText.replace(/>\s*</g, '><').trim();
    const tokens = cleaned.replace(/(>)(<)(\/*)/g, '$1\n$2$3').split('\n');
    let indent = 0;

    return tokens
      .map((line) => {
        if (line.match(/^<\/\w/)) {
          indent = Math.max(indent - 1, 0);
        }
        const padding = '  '.repeat(indent);
        if (line.match(/^<\w[^>]*[^/]>.*<\/\w+>$/)) {
          return `${padding}${line}`;
        }
        if (line.match(/^<\w[^>]*[^/]>$/) && !line.startsWith('<?')) {
          const formatted = `${padding}${line}`;
          indent += 1;
          return formatted;
        }
        return `${padding}${line}`;
      })
      .join('\n');
  } catch {
    return rawText;
  }
}
