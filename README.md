<img src="banner.svg" alt="openAR" width="100%"/>

API REST de dados abertos para a Assembleia da República.

Os dados são obtidos através do programa [AR dados abertos](https://www.parlamento.pt/Cidadania/Paginas/DadosAbertos.aspx), normalizados numa base de dados PostgreSQL e disponibilizados via uma API Hono. Um processo ETL corre diariamente para manter a legislatura actual actualizada.

**Documentação:** [api.openar.pt](https://api.openar.pt)

## Início rápido

```bash
# 1. Iniciar a base de dados
docker compose up db -d

# 2. Copiar e configurar o env
cp .env.example .env

# 3. Aplicar migrações
npm run db:migrate

# 4. Carregar uma legislatura
npx tsx --env-file=.env src/etl/load.ts --leg XVII

# 5. Iniciar a API
npm run dev
# → http://localhost:3000
```

## ETL

```bash
# Carregar todas as legislaturas (carga inicial — demora algum tempo)
npm run etl:all

# Actualizar apenas a legislatura actual (para cron)
npm run etl:current

# Carregar uma legislatura específica
npx tsx --env-file=.env src/etl/load.ts --leg XIII
```

Legislaturas disponíveis: `Constituinte`, `I` a `XVII`.

Nota: os dados de Iniciativas começam na `II`. `InformacaoBase` (deputados, grupos) está disponível para todas.

## API

Todos os endpoints de listagem suportam `page` (padrão 1) e `limit` (padrão 50, máx. 200).

A documentação completa está disponível em [api.openar.pt](https://api.openar.pt).

### Legislaturas

```
GET /legislaturas
GET /legislaturas/:id
```

`/legislaturas/XVII` devolve o objecto da legislatura com os totais `iniciativasTotal`, `deputadosTotal` e `votacoesTotal`.

### Deputados

```
GET /deputados?legislatura=XVII&grupo=PS&q=António
GET /deputados/:id
```

Parâmetros: `legislatura`, `grupo` (sigla do partido), `q` (pesquisa por nome).

### Iniciativas

```
GET /iniciativas?legislatura=XVII&tipo=P&estado=Aprovado&grupo=PS&q=habitação
GET /iniciativas/:id
```

Parâmetros: `legislatura`, `tipo` (`R` Resolução, `P` Proposta de Lei, `J` Projeto de Lei, `D` Decreto, `S` Outros, `A` Apreciação, `I` Iniciativa Europeia, `C` Pergunta/Requerimento), `estado`, `grupo` (filtra pelo partido autor), `q` (pesquisa no título).

O endpoint de detalhe (`/:id`) devolve a iniciativa completa com `autores`, `eventos` (cada um com `votacoes` e `publicacoes` aninhados) e `relacionadas`.

### Votações

```
GET /votacoes?legislatura=XVII&resultado=Aprovado&unanime=true&data_inicio=2025-01-01&data_fim=2025-12-31
GET /votacoes/:id
```

Parâmetros: `legislatura`, `resultado` (`Aprovado` / `Rejeitado`), `unanime` (`true` / `false`), `data_inicio`, `data_fim` (datas em formato ISO).

## Produção (Docker)

```bash
docker compose up -d

# Aplicar migrações
docker compose exec api npm run db:migrate:prod

# Carga inicial — todas as legislaturas
docker compose exec api node dist/etl/load.js --all
```

## Desenvolvimento

```bash
npm install
cp .env.example .env   # definir DATABASE_URL
npm run db:generate    # gerar migrações após alterações ao schema
npm run db:migrate     # aplicar migrações
npm run dev            # modo watch com tsx
```

## Schema

11 tabelas: `legislaturas`, `grupos_parlamentares`, `circulos_eleitorais`, `deputados`, `mandatos`, `iniciativas`, `autores_iniciativas`, `eventos`, `votacoes`, `publicacoes`, `iniciativas_relacionadas`.

Ver [`src/db/schema.ts`](src/db/schema.ts) para o schema completo.

## Licença

MIT
