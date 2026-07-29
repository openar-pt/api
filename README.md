<img src="banner.svg" alt="openAR" width="100%"/>

API REST de dados abertos para a Assembleia da República.

Os dados são obtidos através do programa [AR dados abertos](https://www.parlamento.pt/Cidadania/Paginas/DadosAbertos.aspx), normalizados numa base de dados PostgreSQL e disponibilizados via uma API Hono. Um processo ETL corre diariamente para manter a legislatura actual actualizada.

**Documentação:** [api.openar.pt](https://api.openar.pt)

## Início rápido

```bash
# 1. Configurar as credenciais do Infisical
cp .env.infisical.example .env.infisical
$EDITOR .env.infisical            # preencher CLIENT_ID e CLIENT_SECRET

# 2. Aplicar migrações
pnpm run db:migrate

# 3. Carregar uma legislatura
./scripts/with-secrets.sh tsx src/etl/load.ts --leg XVII

# 4. Iniciar a API
pnpm run dev
# → http://localhost:3000
```

A base de dados de desenvolvimento não é criada por este repositório — o
`DATABASE_URL` do ambiente `dev` no Infisical aponta para uma instância
existente. Os scripts carregam `.env.infisical` automaticamente, não é preciso
exportar nada.

## ETL

```bash
# Carregar todas as legislaturas (carga inicial — demora algum tempo)
pnpm run etl:all

# Actualizar apenas a legislatura actual (para cron)
pnpm run etl:current

# Carregar uma legislatura específica
./scripts/with-secrets.sh tsx src/etl/load.ts --leg XIII
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
`updated_since`, `sort`. O detalhe devolve as comissões (com relatores) e os documentos.

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


O host precisa de ter `INFISICAL_DOMAIN`, `INFISICAL_PROJECT_ID`,
`INFISICAL_CLIENT_ID` e `INFISICAL_CLIENT_SECRET` no ambiente — o
`docker compose` recusa arrancar sem eles.

```bash
docker compose up -d

# Aplicar migrações
docker compose exec api pnpm run db:migrate:prod

# Carga inicial — todas as legislaturas
docker compose exec api ./scripts/with-secrets.sh node dist/etl/load.js --all
```

## Desenvolvimento

```bash
pnpm install
cp .env.infisical.example .env.infisical   # credenciais da machine identity
set -a && . ./.env.infisical && set +a

pnpm run db:generate    # gerar migrações após alterações ao schema
pnpm run db:migrate     # aplicar migrações
pnpm run dev            # modo watch com tsx
pnpm test               # testes da API (precisa de base de dados)
pnpm run test:scripts   # testes dos scripts (sem rede nem credenciais)
```

## Schema

58 tabelas, agrupadas assim:

| Grupo | Tabelas |
|---|---|
| Núcleo | `legislaturas`, `sessoes_legislativas`, `grupos_parlamentares`, `circulos_eleitorais` |
| Deputados | `deputados`, `mandatos`, `deputado_cargos`, `deputado_situacoes` |
| Registo biográfico | `bio_habilitacoes`, `bio_titulos`, `bio_cargos_funcoes`, `bio_condecoracoes`, `bio_obras_publicadas` |
| Iniciativas | `iniciativas`, `autores_iniciativas`, `eventos`, `votacoes`, `publicacoes`, `votacao_publicacoes`, `anexos`, `iniciativas_relacionadas`, `iniciativas_conjuntas`, `peticoes_conjuntas`, `propostas_alteracao`, `proposta_publicacoes` |
| Debates | `intervencoesdebates`, `oradores`, `orador_publicacoes` |
| Comissões | `comissoes`, `comissoes_fases`, `comissao_relatores`, `comissao_votacoes`, `comissao_votacao_publicacoes`, `comissao_documentos`, `comissao_audicoes`, `comissao_remessas`, `comissao_publicacoes` |
| Petições | `peticoes`, `peticao_comissoes`, `peticao_relatores`, `peticao_documentos` |
| Actividade dos deputados | `ativ_*` (17 tabelas — espelho 1:1 do JSON `AtividadeDeputado`) |

Ver [`src/db/schema.ts`](src/db/schema.ts) para o schema completo.

## Segredos

Todos os segredos — `DATABASE_URL` e as credenciais `R2_*` — vivem numa
instância self-hosted do [Infisical](https://infisical.com). Nenhum processo lê
um ficheiro `.env`.

`scripts/with-secrets.sh` autentica-se com uma machine identity (Universal
Auth), obtém um token e injecta os segredos como variáveis de ambiente antes de
o Node arrancar. Todos os scripts que tocam na base de dados passam por ele:

```bash
./scripts/with-secrets.sh <comando>
```

Quatro variáveis vivem fora do Infisical — em `.env.infisical` localmente
(ignorado pelo git) e no ambiente do host em produção:

| Variável | |
|---|---|
| `INFISICAL_DOMAIN` | URL da instância |
| `INFISICAL_PROJECT_ID` | Projecto a ler |
| `INFISICAL_CLIENT_ID` | Machine identity (Universal Auth) |
| `INFISICAL_CLIENT_SECRET` | |

Nenhuma delas está no repositório: nem sequer a URL da instância ou o id do
projecto, para que este repositório público não revele infraestrutura.
`INFISICAL_ENV` escolhe o ambiente (`dev` ou `prod`, por omissão `dev`).

Requer a [CLI do Infisical](https://infisical.com/docs/cli/overview) instalada
localmente e no runner self-hosted. A imagem Docker instala-a automaticamente.

Para testar a configuração sem arrancar a aplicação:

```bash
./scripts/with-secrets.sh printenv DATABASE_URL
```

O wrapper tem testes que correm sem rede nem credenciais:

```bash
pnpm run test:wrapper
```

## Licença

MIT
