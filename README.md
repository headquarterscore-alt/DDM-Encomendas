# Delicias do Mar · Encomendas

Aplicação de encomendas para o **Posto 1 · Peixe-Marisco** e o **Posto 2 · Barcas**. A base partilhada atual continua a ser de demonstração.

## Alterar a app

| Ficheiro | Função |
| --- | --- |
| `src/estilo.css` | Cores, tipografia, espaçamento, cartões e adaptação a telemóvel |
| `src/index.html` | Estrutura da página, navegação e logótipo |
| `src/app.js` | Conteúdo dos painéis, formulários, etapas de preparação e ligação à base de dados |
| `src/install.js`, `src/app.webmanifest` | Instalação, ícones e atalhos dos postos |
| `service-worker.template.js` | Reabertura da app e cache dos ficheiros da interface |

O posto das Barcas recolhe e coze o seu próprio marisco. O posto Peixe-Marisco trata do peixe, do marisco vendido em separado e dos congelados. As encomendas de demonstração ficam na base de dados partilhada. As pré-visualizações usam essa mesma base. Usa encomendas fictícias quando experimentares alterações.

## Ligar ao Cloudflare uma vez

1. Cria um repositório privado no GitHub. Extrai o pacote e coloca o seu conteúdo na raiz do repositório. A pasta `src`, o ficheiro `wrangler.jsonc` e o ficheiro `build.mjs` ficam ao mesmo nível.
2. No Cloudflare, abre **Workers & Pages → ddm-encomendas → Settings → Builds → Connect**. Escolhe o repositório e define `main` como ramo de produção.
3. Usa a raiz do repositório, deixa vazio o campo **Build command** do painel e mantém **Deploy command** como `npx wrangler deploy`. O Wrangler executa a preparação definida em `wrangler.jsonc`. Para veres mudanças antes de as publicar, ativa os builds dos outros ramos com `npx wrangler preview`. O bloco `previews` no ficheiro de configuração permite gerar essas pré-visualizações sem publicar na produção.
4. Guarda uma alteração no repositório após a ligação e acompanha o resultado em **Deployments**. Confirma a abertura dos dois postos e o indicador **Ligado**.

## Testar uma mudança

Cria um ramo para a alteração e abre um pull request. Abre a pré-visualização no PC da loja e no telemóvel. Junta a alteração a `main` depois de a aprovares.

Para gerar a pasta publicável localmente, usa Node.js 22.12 ou superior e executa `npm ci` e `npm run build`. Os ficheiros para editar ficam em `src`. Cada alteração ao conteúdo gera uma nova versão da cache da app.

## Modo posto tátil

Seleciona **Peixe-Marisco** ou **Barcas** e ativa o botão **Modo posto** no cabeçalho. O posto e o modo ficam guardados neste navegador/dispositivo, incluindo ao reabrir a app pelo endereço inicial. Os atalhos específicos da app escolhem e guardam o posto indicado. Sair do ecrã inteiro do navegador mantém o modo posto; o botão da app permite sair desse modo. Num dispositivo novo, abre o Posto 1 · Peixe-Marisco. O identificador interno `bancada` mantém os atalhos e preferências existentes compatíveis.

**Encomendas** (`#encomendas`) abre o posto guardado. Os atalhos `#encomendas/bancada` e `#encomendas/barcas` escolhem o posto. Os antigos atalhos `#preparacao` continuam a abrir a fila. **Histórico** (`#historico`) mostra a lista do dia e **Cliente** (`#cliente`) abre o catálogo.

Toca em **Pronta** quando o trabalho desse posto estiver terminado. O cartão passa de **Por preparar** a **Prontas**. Durante oito segundos, **Desfazer** repõe a preparação anterior desse posto. As tarefas antigas em preparação também terminam num toque. O marisco da barca pertence ao posto Barcas. O levantamento ou a entrega fica disponível quando todos os postos terminam.

Antes de publicar este fluxo, rever e aprovar [a alteração de update_task](migrations/001_fluxo_postos.sql). A função em produção exige os três passos antigos para concluir a barca. A migração preserva as colunas e os pedidos das versões anteriores da app.

As ações ficam bloqueadas durante a gravação ou sem ligação. A confirmação **Alteração guardada** só aparece após a resposta da base e a leitura do estado guardado. Se houver erro, a app atualiza a encomenda e pede para confirmar o estado antes de repetir.

## Duas formas de encomendar

Em **Peixe-Marisco**, **Nova encomenda** abre os artigos. Robalo e Dourada abrem à peça, com número de peixes e peso aproximado por peixe. Gamba da costa abre ao quilo. **Todos os artigos** dá acesso às outras categorias. A equipa também pode escrever o nome de um produto. O segundo ecrã recolhe o cliente, o horário e os dados do levantamento ou entrega.

Em **Barcas**, **Encomendar barca** abre o questionário para levantamento. O número de pessoas é opcional. O valor aparece acima das fotografias e começa em 20 € por pessoa, com um mínimo de 50 €. O deslizador vai de 0 € a 400 €, em incrementos de 10 €, e realça a barca correspondente. O mínimo para confirmar a encomenda é 50 €. A média começa nos 100 € e a grande nos 200 €. O nome é desenhado à mão e aparece no resumo, na fila e no Histórico. As encomendas anteriores com nome escrito continuam a mostrar texto. O telemóvel é opcional.

O rascunho do questionário fica guardado no navegador, incluindo ao fechar e reabrir. O do formulário rápido também fica guardado por conta e dispositivo, incluindo o artigo em edição. Em ambos, a confirmação limpa o rascunho. O número apresentado no fim identifica a encomenda. Os postos mostram o marisco a evitar e o contacto, com destaque quando passa a hora prevista.

Rever [003_questionario.sql](migrations/003_questionario.sql) antes da publicação e aplicar após aprovação. A ocasião da encomenda pode ser Refeição, Evento, Petisco ou Outro. O tipo de serviço do artigo continua limitado a Refeição ou Petisco. O mesmo `client_token` permite repetir uma submissão se a ligação falhar.

## Histórico

Escolhe o dia e filtra por **Todas**, **Por preparar**, **Prontas**, **Entregues** ou **Canceladas**. Abre a encomenda para ver as ações disponíveis.

Depois de confirmar um levantamento ou entrega, **Desfazer** fica disponível durante oito segundos. No Histórico, abre uma encomenda entregue e confirma **Desfazer levantamento** ou **Desfazer entrega** para a devolver a Prontas.

**Cancelar encomenda** pede um motivo. A encomenda sai dos dois postos e mantém o estado de cada preparação. No Histórico, **Reabrir** repõe a encomenda nas filas.

Rever [002_historico.sql](migrations/002_historico.sql) depois de [001_fluxo_postos.sql](migrations/001_fluxo_postos.sql), antes de publicar a interface. As ações de preparação, entrega, cancelamento, reabertura e desfazer acrescentam um evento na mesma transação. O posto do dispositivo fica por preencher quando uma versão antiga da app não o envia.

## Acesso da equipa e publicação em duas fases

A PWA usa o cliente oficial do Supabase Auth para iniciar sessão por e-mail e palavra-passe, guardar a sessão no navegador e renovar o token. Os pedidos de dados e as ações enviam o token da equipa. Ao terminar a sessão ou se a renovação falhar definitivamente, a app mostra **Inicia sessão**. Os postos mantêm a preferência do dispositivo.

1. No projeto Lovable ligado a esta base, abre **More → Users** e as definições de autenticação. Desativa a inscrição pública e o login anónimo, ativa **Email / password** e verifica que as contas existentes com acesso são da equipa. A regra da 004 autoriza o papel `authenticated`. Em **Add user → Create new user**, introduz tu o e-mail e a palavra-passe de cada conta da equipa.
2. Publica primeiro o código de login. O build do Cloudflare não executa os ficheiros SQL. Abre o endereço de **produção** nos dois tablets, inicia sessão, escolhe o posto, recarrega e confirma que aparece **Ligado**. A sessão da pré-visualização pertence a outro endereço.
3. Só após confirmação dos dois tablets, aplicar [004_acesso_equipa.sql](migrations/004_acesso_equipa.sql) e repetir os testes diretos de leitura e das funções na base partilhada. Se for necessário repor o acesso anterior, usar [a reversão](migrations/rollback/004_acesso_equipa.sql). A reversão reabre a leitura pública das encomendas. A [revogação de reset_demo](migrations/003a_revogar_reset_demo.sql) é independente.
4. Quando a equipa precisar de terminar a sessão num tablet, usar **Terminar sessão**. A app não disponibiliza registo público.

A matriz [tests/acessos.cjs](tests/acessos.cjs) foi executada por HTTP contra PostgREST com a opção `db-tx-end=rollback` e PostgreSQL descartável. Anónimo recebeu 401 nas quatro tabelas e nas sete funções. O papel autenticado recebeu 200 em orders, order_items, station_tasks, create_order, update_task, change_order_status, hand_off e lisbon_today; recebeu 403 em order_events, reset_demo e create_order_before_003. A migração e a reversão foram também comparadas quanto a permissões, sequências e políticas RLS.

## Testes dos dois postos

Com Node.js 22.12+ e npm:

```sh
npm install
npx playwright install chromium
npm run build
npm test
```

O teste usa duas sessões de navegador com armazenamento independente e uma API simulada partilhada. Cobre a encomenda mista, unidades por artigo, conclusão independente das Barcas, filtros por estado, bloqueio da entrega, toques repetidos, erro de gravação, perda/recuperação de ligação, reabertura por dispositivo e alvos táteis de pelo menos 56 px. `DDM_BROWSER=chrome` permite usar o Chrome instalado; `msedge` usa o Edge.

Os testes não alteram `docs/`. Para refazer as imagens dos postos, junta `--update-images` (por exemplo `node tests/postos.cjs --update-images`).

O teste live requer uma conta de testes existente, fornecida localmente por `DDM_TEST_EMAIL` e `DDM_TEST_PASSWORD`. `npm run test:live` repete o percurso essencial na base de demonstração: **cria uma encomenda fictícia identificada como TESTE POSTOS**, conclui os dois postos e regista a entrega para a retirar da fila. Não executar contra uma base de produção. As duas sessões só partilham os dados do servidor, nunca o armazenamento local.
