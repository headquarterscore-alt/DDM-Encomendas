# Delicias do Mar · Encomendas

Aplicação de demonstração para os postos das Barcas e da Bancada.

## Alterar a app

| Ficheiro | Função |
| --- | --- |
| `src/estilo.css` | Cores, tipografia, espaçamento, cartões e adaptação a telemóvel |
| `src/index.html` | Estrutura da página, navegação e logótipo |
| `src/app.js` | Conteúdo dos painéis, formulários, etapas de preparação e ligação à base de dados |
| `src/install.js`, `src/app.webmanifest` | Instalação, ícones e atalhos dos postos |
| `service-worker.template.js` | Reabertura da app e cache dos ficheiros da interface |

O posto das Barcas recolhe e coze o seu próprio marisco. O posto da Bancada trata do peixe, do marisco vendido em separado e dos congelados. As encomendas de demonstração ficam na base de dados partilhada. As pré-visualizações usam essa mesma base. Usa encomendas fictícias quando experimentares alterações.

## Ligar ao Cloudflare uma vez

1. Cria um repositório privado no GitHub. Extrai o pacote e coloca o seu conteúdo na raiz do repositório. A pasta `src`, o ficheiro `wrangler.jsonc` e o ficheiro `build.mjs` ficam ao mesmo nível.
2. No Cloudflare, abre **Workers & Pages → ddm → Settings → Builds → Connect**. Escolhe o repositório e define `main` como ramo de produção.
3. Usa a raiz do repositório, deixa vazio o campo **Build command** do painel e mantém **Deploy command** como `npx wrangler deploy`. O Wrangler executa a preparação definida em `wrangler.jsonc`. Para veres mudanças antes de as publicar, ativa os builds de pré-visualização para os outros ramos.
4. Guarda uma alteração no repositório após a ligação e acompanha o resultado em **Deployments**. Confirma a abertura dos dois postos e o indicador **Base ligada**.

## Testar uma mudança

Cria um ramo para a alteração e abre um pull request. Abre a pré-visualização no PC da loja e no telemóvel. Junta a alteração a `main` depois de a aprovares.

Para gerar a pasta publicável localmente, usa Node.js 22.12 ou superior e executa `node build.mjs`. Os ficheiros para editar ficam em `src`. Cada alteração ao conteúdo gera uma nova versão da cache da app.
