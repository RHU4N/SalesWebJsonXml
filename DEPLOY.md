# SalesWeb em produção

- Aplicação: https://salesweb-xmljson.vercel.app
- API: https://stockservice-xmljson.azurewebsites.net
- Arquitetura, custos, validações HTTP, Postman, reinicialização e remoção Azure: [DEPLOY do StockService](https://github.com/RHU4N/StockServiceXmlJson/blob/main/DEPLOY.md).

## Configuração efetiva

Projeto Vercel `salesweb-xmljson`, equipe `rhu4ns-projects`, plano **Hobby** confirmado pela CLI. Site estático React/Vite com HTTPS, sem Functions ou serviços adicionais. Custo previsto US$ 0 dentro dos [limites do Hobby](https://vercel.com/docs/plans/hobby).

| Item | Valor |
|---|---|
| Repositório privado | `RHU4N/SalesWebJsonXml` |
| Branch de produção | `main` |
| Framework | Vite |
| Node.js | 24.x |
| Install Command | `npm ci` |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| `VITE_API_BASE_URL` (produção e preview) | `https://stockservice-xmljson.azurewebsites.net` |

O CORS do Spring autoriza o domínio definitivo e os aliases estáveis da Vercel, preservando localhost/127.0.0.1 nas portas 5173 e 4173. Novos domínios de preview precisam ser autorizados explicitamente. Não há configuração CORS paralela na Azure.

## Executar e compilar

Com Node 24 LTS:

```powershell
Copy-Item .env.example .env.local
npm ci
npm run dev
```

O `.env.example` aponta para `http://localhost:8080`. Ajuste `.env.local` se necessário; arquivos locais de ambiente são ignorados pelo Git. Nenhum segredo deve ser colocado em variáveis `VITE_*`, pois elas são incorporadas ao bundle público.

Para validar o build com a API publicada:

```powershell
$env:VITE_API_BASE_URL = 'https://stockservice-xmljson.azurewebsites.net'
npm ci
npm run lint
npm run build
```

A URL é resolvida durante o build. Alterar a variável na Vercel requer um novo deployment. O bundle validado usa a URL HTTPS real e não contém a URL local da API.

## Publicação

A integração GitHub/Vercel está ativa: pushes na `main` acionam deployments automáticos. A visibilidade privada do repositório foi preservada. Faça os checks antes de enviar o código:

```powershell
npm run lint
npm run build
git push origin main
```

Para publicação manual com Vercel CLI autenticada, confirme a equipe e o projeto antes de publicar:

```powershell
vercel link --project salesweb-xmljson --scope rhu4ns-projects
vercel project inspect --non-interactive --scope rhu4ns-projects
vercel deploy --prod --scope rhu4ns-projects
```

Não é necessário tornar o repositório público. O back-end utiliza deploy manual de JAR e uma única instância no plano Azure F1 gratuito.

## Validação e evidências

Em 27/11/2026, `npm ci`, lint e build passaram. npm reportou 0 vulnerabilidades. Versões efetivas: Node 24.15.0, npm 11.12.1, Vite 8.3.8, React 19.3.1 e Axios 1.21.1.

No Edge real via Playwright passaram **9 cenários**, com **12 chamadas à API**: catálogo JSON/XML, consulta por ID, bytes, comparação lado a lado, status/cabeçalhos, erro 404 e cadastro JSON/XML com HTTP 201. Nenhum erro de CORS, Mixed Content ou requisição para localhost foi observado. Depois do reinício final, o navegador confirmou os cinco produtos iniciais.

As [capturas reais e relatórios](evidencias-deploy/) registram a execução. [validacao-navegador.json](evidencias-deploy/validacao-navegador.json) contém os cenários e URLs das chamadas; [deploy-manifest.json](evidencias-deploy/deploy-manifest.json) identifica o deployment de implementação validado. Commits posteriores de documentação/evidências recompilam o mesmo código pela integração Git.

A consulta de logs de produção na janela de 15 minutos retornou 0 registros de erro. O site é estático, sem Functions; os testes no navegador são a evidência do funcionamento da interface e da comunicação com a API. Não foram configurados drains ou monitoramento externo.

Não foram simuladas capturas de dashboards de provedores ou da GUI do Postman. Os testes da collection foram executados via Newman: 12 requisições e 37 asserções aprovadas, documentadas no back-end.

## Demonstrar e encerrar

Abra o domínio público antes da apresentação para aquecer a API. Mostre catálogo, ID 1, JSON/XML, comparação de bytes e POST nos dois formatos. Reiniciar o StockService apaga os cadastros e restaura o catálogo inicial. Consulte os comandos no DEPLOY do back-end.

Para remover este site após a apresentação, exclua somente `salesweb-xmljson` nas configurações Vercel ou use `vercel project delete salesweb-xmljson --scope rhu4ns-projects` e confirme o nome. Não execute a remoção durante a demonstração.
