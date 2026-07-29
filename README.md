<img src="banner.svg" alt="openAR" width="100%"/>

API REST de dados abertos para a Assembleia da República.

Os dados são obtidos através do programa [AR dados abertos](https://www.parlamento.pt/Cidadania/Paginas/DadosAbertos.aspx), normalizados numa base de dados PostgreSQL e disponibilizados via uma API Hono. Um processo ETL corre diariamente para manter a legislatura actual actualizada.

**Documentação:** [api.openar.pt](https://api.openar.pt)

## Início rápido

```bash
# 1. Instalar dependências
pnpm install

# 2. Iniciar a base de dados
docker compose --profile local up db -d

# 3. Configurar o ambiente
cp .env.example .env              # DATABASE_URL para a base de dados local

# 4. Aplicar migrações
pnpm run db:migrate

# 5. Carregar uma legislatura (demora alguns minutos)
pnpm run etl -- --leg XVII

# 6. Iniciar a API
pnpm run dev
# → http://localhost:3000
```

Correr os testes:

```bash
pnpm test               # testes da API (usa o DATABASE_URL do .env)
pnpm run test:scripts   # testes dos scripts (sem rede nem base de dados)
```

## ETL

```bash
# Carregar uma legislatura específica
pnpm run etl -- --leg XIII

# Carregar todas as legislaturas (carga inicial — demora algum tempo)
pnpm run etl -- --all

# Actualizar apenas a legislatura actual
pnpm run etl -- --current

# Limitar a um tipo de fonte
pnpm run etl -- --leg XVII --source peticoes
```

Legislaturas disponíveis: `Constituinte`, `I` a `XVII`.

Nota: os dados de Iniciativas começam na `II`. `InformacaoBase` (deputados, grupos) está disponível para todas.

## API

**Todas as rotas são prefixadas com `/v1`** — em produção, `https://api.openar.pt/v1`.

A documentação completa e interactiva está em [api.openar.pt](https://api.openar.pt);
a especificação OpenAPI em [api.openar.pt/openapi.json](https://api.openar.pt/openapi.json).

Convenções comuns:

| | |
|---|---|
| Paginação | `page` (padrão 1) e `limit` (padrão 50, máx. 200) em todas as listagens excepto `/legislaturas`. Respostas no formato `{ data, total, page, limit }`. |
| Ordenação | `sort=asc\|desc`. Listagens por data usam `desc` por omissão; as ordenadas por nome (`/deputados`, `/comissoes`) usam `asc`. |
| Datas | `data_inicio` e `data_fim`, inclusive, em `AAAA-MM-DD`. |
| Pesquisa | `q` — parcial, case-insensitive, máx. 100 caracteres. |
| Sincronização | `updated_since` em `/deputados`, `/iniciativas` e `/peticoes`. |
| Limites | 100 pedidos/min por IP. Excedido devolve `429` com `Retry-After`. |
| Cache | `Cache-Control` em todas as respostas; `ETag` nos detalhes de iniciativas e petições (use `If-None-Match` para obter `304`). |

### Meta

```
GET /v1/meta?legislatura=XVII
```

Valores válidos para os filtros, derivados dos dados: `legislaturas`, `grupos`, `tipos`, `estados`.
Útil para popular dropdowns sem hardcoding. `grupos` inclui os autores institucionais
`Governo`, `PAR`, `Madeira`, `Açores` e `Mesa` — aceites em `/iniciativas` e `/votacoes`,
mas não em `/deputados`.

### Legislaturas

```
GET /v1/legislaturas
GET /v1/legislaturas/:id
```

`/legislaturas` devolve um array simples (sem paginação). `/legislaturas/XVII` devolve a
legislatura com os totais `iniciativasTotal`, `deputadosTotal` e `votacoesTotal`.

### Deputados

```
GET /v1/deputados?legislatura=XVII&grupo=PS&situacao=ativo&q=António
GET /v1/deputados/:id
GET /v1/deputados/:id/atividade?legislatura=XVII
GET /v1/deputados/:id/foto
GET /v1/deputados/carreiras?limit=50
```

Parâmetros da listagem: `legislatura`, `grupo` (sigla do partido), `situacao`, `q` (nome
parlamentar), `updated_since`, `sort`. Cada deputado aparece uma só vez, com os dados do
mandato mais recente que corresponde aos filtros.

`situacao=ativo` é um atalho para Efetivo + Efetivo Temporário + Efetivo Definitivo — os 230
lugares. Deputados `Impedido` estão em funções governativas e o lugar é ocupado pelo suplente.

O detalhe (`/:id`) devolve mandatos, cargos, situações, o registo biográfico completo em `bio`,
estatísticas de autoria em `stats` e as 20 iniciativas mais recentes.

Dentro de `bio`, `legislaturas` traz o percurso por legislatura com o **partido**
(`partidoSigla`, ex. `PPD/PSD.CDS-PP`) — que é distinto do grupo parlamentar em `mandatos` —
e `orgaos` traz comissões, grupos de trabalho e subcomissões, com o cargo e a situação.

`/atividade` devolve toda a actividade parlamentar registada — iniciativas, requerimentos,
intervenções, comissões, relatorias, delegações e mais. Sem `legislatura` devolve o histórico completo.

`/foto` **redirecciona (302)** para a imagem no CDN; não devolve a imagem directamente.

`/carreiras` ordena os deputados por número de legislaturas servidas, com agregados em `stats`.

### Iniciativas

```
GET /v1/iniciativas?legislatura=XVII&tipo=P&resultado=aprovado&grupo=PS&q=habitação
GET /v1/iniciativas/:id?include=autores,eventos.votacoes
```

Parâmetros: `legislatura`, `tipo`, `estado` (repetível), `grupo`, `resultado`, `deputado`,
`data_inicio`, `data_fim`, `updated_since`, `q`, `sort`.

- `tipo` — `R` Resolução, `P` Proposta de Lei, `J` Projeto de Lei, `D` Decreto, `S` Outros,
  `A` Apreciação, `I` Iniciativa Europeia, `C` Pergunta/Requerimento, `F` Outros
- `estado` — fase actual do processo, **não** um veredicto. Pode repetir-se:
  `?estado=Lei (Publicação DR)&estado=Iniciativa Caducada`. Valores exactos em `/meta`
  (`Aprovado` não é um deles — para aprovação use `resultado`)
- `grupo` — sigla do partido autor, ou `Governo` / `PAR` / `Madeira` / `Açores` / `Mesa`
- `resultado` — `aprovado` (≥1 votação aprovada), `rejeitado`, `pendente` (sem votações)
- `deputado` — ID numérico ou nome parlamentar (pesquisa parcial)

`dataEntradaDe` e `dataEntradaAte` continuam a funcionar como alias obsoletos de
`data_inicio` / `data_fim`.

#### `?include=` — respostas parciais

Sem `include`, `/iniciativas/:id` devolve **tudo**, o que para iniciativas muito debatidas
chega às centenas de KB. Use `include` para pedir só as relações necessárias:

```
GET /v1/iniciativas/123?include=                          # só campos escalares
GET /v1/iniciativas/123?include=autores,eventos.votacoes  # autores + votações
GET /v1/iniciativas/123?include=autores,votacoes          # forma curta equivalente
```

Relações de topo: `autores`, `eventos`, `relacionadas`, `anexos`, `conjuntas`, `peticoes`,
`propostasAlteracao`.

Sub-relações de eventos: `eventos.votacoes`, `eventos.publicacoes`, `eventos.comissoesFases`,
`eventos.intervencoesdebates`, `eventos.iniciativasConjuntas`, `eventos.peticoesConjuntas`,
`eventos.anexos`.

Pedir `eventos` traz todas as sub-relações; pedir uma sub-relação traz `eventos`
automaticamente. Todas as sub-relações aceitam a forma curta sem prefixo, excepto
`eventos.anexos` — `anexos` sozinho refere-se sempre à relação de topo. Uma chave
desconhecida devolve `400` com a lista de chaves válidas.

### Votações

```
GET /v1/votacoes?legislatura=XVII&resultado=Aprovado&unanime=true&a_favor=PS
GET /v1/votacoes/:id?iniciativa_id=123
```

Parâmetros: `legislatura`, `resultado` (`Aprovado` / `Rejeitado` / `Prejudicado`), `unanime`
(`true`/`false`/`1`/`0`), `iniciativa`, `tipo`, `grupo` (partido autor da iniciativa),
`a_favor` / `contra` / `abstencao` (sigla que votou nesse sentido), `data_inicio`,
`data_fim`, `sort`.

`iniciativa_id` é **obrigatório** no detalhe: o id de uma votação só é único dentro da
sua iniciativa (chave primária composta).

### Petições

```
GET /v1/peticoes?legislatura=XVII&situacao=Admitida&q=saúde
GET /v1/peticoes/:id
```

Parâmetros: `legislatura`, `situacao`, `q` (assunto), `data_inicio`, `data_fim`,
`updated_since`, `sort`.

O detalhe devolve tudo por omissão e aceita `?include=` como `/iniciativas/:id`.
Relações de topo: `comissoes`, `documentos`, `publicacoes`, `relacionadas`.
Sub-relações de comissões: `comissoes.relatores`, `comissoes.relatorioFinal`,
`comissoes.documentos`, `comissoes.audicoes`, `comissoes.pedidosInformacao` — todas
aceitam a forma curta excepto `comissoes.documentos`, porque `documentos` sozinho
refere-se sempre à relação de topo.

`relatorioFinal` inclui a votação em comissão (`resultado`, `unanime`, `aFavor`,
`contra`, `abstencao`, `ausencias`).

### Comissões

```
GET /v1/comissoes?legislatura=XVII&q=saude
GET /v1/comissoes/:id?legislatura=XVII&tipo=J
```

`/comissoes` devolve a tabela canónica, cada comissão com um `id` numérico estável.
`/comissoes/:id` aceita **apenas o id numérico** e devolve a comissão com a lista paginada
de iniciativas que por ela passaram, cada uma com as respectivas fases em comissão
(relatores, votações, documentos, audições, remessas e publicações).

## Produção (Docker)

O stack tem três serviços permanentes e dois jobs pontuais:

| Serviço | Papel |
|---|---|
| `api` | A API HTTP |
| `worker` | Aplica migrações e corre o ETL uma vez por dia |
| `migrate` | Job pontual — só migrações |
| `etl` | Job pontual — ETL com argumentos à escolha |

`migrate` e `etl` estão no profile `tools`, por isso não arrancam com
`docker compose up`. Correm sob pedido:

```bash
docker compose run --rm migrate
docker compose run --rm etl                     # --current (omissão)
docker compose run --rm etl --leg XVII
docker compose run --rm etl --all --source peticoes
docker compose run --rm etl --photos
```

O `worker` corre à hora definida por `ETL_AT` (`HH:MM` UTC, omissão `00:00`)
com o modo em `ETL_MODE` (omissão `--current`). Uma hora inválida faz o
contentor falhar imediatamente, em vez de parecer saudável e nunca disparar.
`ETL_RUN_ON_BOOT=true` força uma execução no arranque.

Todos partilham a imagem da API, por isso correm exactamente o build que está
em produção e ficam na mesma rede — é assim que o hostname interno da base de
dados resolve.


O host precisa de ter as variáveis descritas em [Segredos](#segredos) — o
`docker compose` recusa arrancar sem elas.

```bash
docker compose up -d

# Aplicar migrações
docker compose exec api pnpm run db:migrate:prod

# Carga inicial — todas as legislaturas
docker compose exec api ./scripts/with-secrets.sh node dist/etl/load.js --all
```

## Desenvolvimento

```bash
pnpm run db:generate    # gerar migrações após alterações ao schema
pnpm run db:migrate     # aplicar migrações
pnpm run dev            # modo watch com tsx
pnpm test               # testes da API
pnpm run test:scripts   # testes dos scripts (sem rede nem base de dados)
```

Todos usam o `DATABASE_URL` do `.env`. Os comandos equivalentes com o sufixo
`:remote` (`dev:remote`, `test:remote`, `db:migrate:remote`) obtêm as
credenciais do gestor de segredos e são usados apenas pela manutenção.

## Schema

67 tabelas, agrupadas assim:

| Grupo | Tabelas |
|---|---|
| Núcleo | `legislaturas`, `sessoes_legislativas`, `grupos_parlamentares`, `circulos_eleitorais` |
| Deputados | `deputados`, `mandatos`, `deputado_cargos`, `deputado_situacoes` |
| Registo biográfico | `bio_habilitacoes`, `bio_titulos`, `bio_cargos_funcoes`, `bio_condecoracoes`, `bio_obras_publicadas`, `bio_deputado_legislaturas`, `bio_orgaos` |
| Iniciativas | `iniciativas`, `autores_iniciativas`, `eventos`, `votacoes`, `publicacoes`, `votacao_publicacoes`, `anexos`, `iniciativas_relacionadas`, `iniciativas_conjuntas`, `peticoes_conjuntas`, `propostas_alteracao`, `proposta_publicacoes` |
| Debates | `intervencoesdebates`, `oradores`, `orador_publicacoes`, `orador_deputados` |
| Comissões | `comissoes`, `comissoes_fases`, `comissao_relatores`, `comissao_votacoes`, `comissao_votacao_publicacoes`, `comissao_documentos`, `comissao_audicoes`, `comissao_remessas`, `comissao_publicacoes` |
| Petições | `peticoes`, `peticao_comissoes`, `peticao_relatores`, `peticao_documentos`, `peticao_relatorio_final`, `peticao_comissao_documentos`, `peticao_audicoes`, `peticao_pedidos_informacao`, `peticao_publicacoes`, `peticao_relacionadas` |
| Actividade dos deputados | `ativ_*` (17 tabelas — espelho 1:1 do JSON `AtividadeDeputado`) |

Ver [`src/db/schema.ts`](src/db/schema.ts) para o schema completo.

### Cobertura da fonte

O que ingerimos é medido contra a estrutura real dos ficheiros da AR, não contra o XSD nem
o PDF que a AR publica (ambos descrevem a exportação **XML**, que difere do JSON que
consumimos — e o PDF é de 2017).

- [`docs/ar-source-schema.json`](docs/ar-source-schema.json) — inventário de todos os campos
  da fonte, com tipos, cardinalidade, taxas de preenchimento e enums.
- [`docs/ar-schema-gaps.json`](docs/ar-schema-gaps.json) — o que a fonte tem e nós não lemos.

Regenerar:

```bash
npx tsx scripts/download-latest-sources.ts --all-legs   # ficheiros de todas as legislaturas
npx tsx scripts/inventory-source-schema.ts              # → docs/ar-source-schema.json
npx tsx scripts/schema-gap-report.ts                    # → docs/ar-schema-gaps.json
npx tsx scripts/schema-gap-report.ts --assert           # falha se aparecerem campos por ler
```

O modo `--assert` corre no CI: quando a AR acrescenta ou renomeia um campo, a build falha
em vez de o ignorar em silêncio.

## Segredos

Em desenvolvimento, o `DATABASE_URL` vem do `.env` e não é preciso mais nada.

Em produção, os segredos (`DATABASE_URL` e as credenciais `R2_*` do CDN) são
injectados no processo por um gestor de segredos externo, antes de o Node
arrancar — nenhum segredo é lido de ficheiros no repositório nem passa pelo
código da aplicação. `scripts/with-secrets.sh` trata dessa injecção e é usado
pelos comandos com sufixo `:remote` e pelos contentores.

O gestor de segredos é configurado por quatro variáveis de ambiente
(`INFISICAL_DOMAIN`, `INFISICAL_PROJECT_ID`, `INFISICAL_CLIENT_ID`,
`INFISICAL_CLIENT_SECRET`), fornecidas pelo host em produção e por
`.env.infisical` — ignorado pelo git — na manutenção. Nenhum endereço,
identificador ou credencial está neste repositório. `INFISICAL_ENV` escolhe o
ambiente (`dev` ou `prod`, por omissão `dev`).

O wrapper tem testes que correm sem rede nem credenciais:

```bash
pnpm run test:scripts
```

## Licença

MIT
