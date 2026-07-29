export const spec = {
  openapi: "3.1.0",
  info: {
    title: "openAR API",
    version: "0.1.0",
    description: [
      "API de dados abertos da Assembleia da República.",
      "Os dados são publicados pelo programa AR dados abertos e actualizados diariamente.",
      "",
      "### Autenticação",
      "Nenhuma. Todos os endpoints são públicos e apenas aceitam `GET`, `HEAD` e `OPTIONS`.",
      "",
      "### Limites de utilização",
      "100 pedidos por minuto por IP, em janela deslizante. Cada resposta inclui",
      "`X-RateLimit-Limit` e `X-RateLimit-Remaining`; ao exceder o limite a API devolve",
      "`429` com `Retry-After: 60`.",
      "",
      "### Limites de input",
      "A query string não pode exceder 500 caracteres e `q` não pode exceder 100.",
      "Ambos devolvem `400`.",
      "",
      "### Cache",
      "Todas as respostas trazem `Cache-Control` (`max-age` de 300s, ou 3600s em",
      "`/meta` e `/legislaturas`). Os endpoints de detalhe de `/iniciativas` e",
      "`/peticoes` devolvem também um `ETag` fraco — envie-o em `If-None-Match`",
      "para receber `304 Not Modified`.",
      "",
      "### Sincronização incremental",
      "`/deputados`, `/iniciativas` e `/peticoes` aceitam `updated_since` para obter",
      "apenas os registos alterados desde um instante.",
    ].join("\n"),
    license: { name: "MIT", url: "https://opensource.org/licenses/MIT" },
    contact: { url: "https://openar.pt" },
  },
  servers: [
    { url: "https://api.openar.pt/v1", description: "Produção" },
    { url: "http://localhost:3000/v1", description: "Desenvolvimento local" },
  ],
  tags: [
    { name: "Meta", description: "Metadados para popular filtros (legislaturas, grupos, tipos)" },
    { name: "Legislaturas", description: "Legislaturas da Assembleia da República" },
    { name: "Deputados", description: "Deputados e os seus mandatos" },
    { name: "Iniciativas", description: "Iniciativas legislativas (projectos de lei, resoluções, etc.)" },
    { name: "Votações", description: "Votações em plenário" },
    { name: "Petições", description: "Petições à Assembleia da República" },
    { name: "Comissões", description: "Comissões parlamentares e as iniciativas que nelas foram apreciadas" },
  ],
  paths: {
    "/meta": {
      get: {
        operationId: "getMeta",
        tags: ["Meta"],
        summary: "Valores disponíveis para filtros",
        description: "Devolve as legislaturas, grupos parlamentares e tipos de iniciativa presentes na base de dados, ordenados. Útil para popular dropdowns sem hardcoding.",
        parameters: [
          { name: "legislatura", in: "query", schema: { type: "string" }, description: "Quando fornecida, `grupos` e `tipos` são filtrados a essa legislatura. `legislaturas` é sempre devolvido completo." },
        ],
        responses: {
          "200": {
            description: "Opções de filtro",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    legislaturas: { type: "array", items: { type: "string" }, example: ["XVII", "XVI", "XV"] },
                    grupos: {
                      type: "array",
                      items: { type: "string" },
                      description:
                        "Siglas dos grupos parlamentares, precedidas dos autores institucionais " +
                        "`Governo`, `PAR`, `Madeira`, `Açores` e `Mesa`. Estes cinco só são aceites " +
                        "em `/iniciativas?grupo=` e `/votacoes?grupo=` — **não** em `/deputados?grupo=`.",
                      example: ["Governo", "PAR", "Madeira", "Açores", "Mesa", "BE", "CH", "CDS-PP", "IL", "L", "PAN", "PCP", "PS", "PSD"],
                    },
                    tipos: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          tipo: { type: "string", example: "J" },
                          tipoDesc: { type: "string", example: "Projeto de Lei" },
                        },
                      },
                    },
                    estados: { type: "array", items: { type: "string" }, example: ["Lei (Publicação DR)", "Iniciativa Caducada", "Resolução da AR (Publicação DR)"] },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/legislaturas": {
      get: {
        operationId: "listLegislaturas",
        tags: ["Legislaturas"],
        summary: "Listar todas as legislaturas",
        description: "Devolve um array simples, sem paginação nem envelope — ao contrário dos restantes endpoints de listagem. Ordenado por data de início ascendente.",
        responses: {
          "200": {
            description: "Array de legislaturas, da mais antiga para a mais recente",
            content: {
              "application/json": {
                schema: { type: "array", items: { $ref: "#/components/schemas/Legislatura" } },
              },
            },
          },
          "429": { $ref: "#/components/responses/TooManyRequests" },
        },
      },
    },
    "/legislaturas/{id}": {
      get: {
        operationId: "getLegislatura",
        tags: ["Legislaturas"],
        summary: "Obter uma legislatura com totais",
        parameters: [{ $ref: "#/components/parameters/legislaturaId" }],
        responses: {
          "200": {
            description: "Legislatura com iniciativasTotal, deputadosTotal e votacoesTotal",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/LegislaturaDetail" },
              },
            },
          },
          "404": { $ref: "#/components/responses/NotFound" },
        },
      },
    },
    "/deputados": {
      get: {
        operationId: "listDeputados",
        tags: ["Deputados"],
        summary: "Listar deputados",
        parameters: [
          { name: "legislatura", in: "query", schema: { type: "string" }, description: "Identificador da legislatura (ex: `XVII`)" },
          { name: "grupo", in: "query", schema: { type: "string" }, description: "Sigla do grupo parlamentar (ex: `PS`, `PSD`, `CH`)" },
                { name: "q", in: "query", schema: { type: "string" }, description: "Pesquisa por nome parlamentar" },
          {
            name: "situacao",
            in: "query",
            schema: { type: "string" },
            description: "Situação do mandato. Use `ativo` como atalho para Efetivo + Efetivo Temporário + Efetivo Definitivo (os 230 lugares).",
          },
          { $ref: "#/components/parameters/updatedSince" },
          { $ref: "#/components/parameters/sortNome" },
          { $ref: "#/components/parameters/page" },
          { $ref: "#/components/parameters/limit" },
        ],
        responses: {
          "200": {
            description: "Lista paginada de deputados. Um deputado aparece uma só vez, com os dados do mandato mais recente que corresponde aos filtros.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/PaginatedDeputados" },
              },
            },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "429": { $ref: "#/components/responses/TooManyRequests" },
        },
      },
    },
    "/deputados/carreiras": {
      get: {
        operationId: "listCarreiras",
        tags: ["Deputados"],
        summary: "Ranking de deputados por número de legislaturas",
        description:
          "Devolve os deputados ordenados pelo número de legislaturas em que serviram (uma linha por pessoa), " +
          "acompanhados de estatísticas agregadas para o universo completo. Mandatos com situação `Suplente` são excluídos.",
        parameters: [{ $ref: "#/components/parameters/limit" }],
        responses: {
          "200": {
            description: "Ranking de carreiras com estatísticas agregadas",
            content: { "application/json": { schema: { $ref: "#/components/schemas/Carreiras" } } },
          },
          "429": { $ref: "#/components/responses/TooManyRequests" },
        },
      },
    },
    "/deputados/{id}/foto": {
      get: {
        operationId: "getDeputadoFoto",
        tags: ["Deputados"],
        summary: "Foto oficial do deputado",
        description:
          "Redirecciona (302) para a foto alojada no CDN (`cdn.openar.pt/fotos/{id}`). " +
          "Não devolve a imagem directamente — siga o `Location`, o que a maioria dos clientes HTTP e a tag `<img>` fazem automaticamente. " +
          "Não é verificado se o deputado existe: um id sem foto resulta num 404 do CDN, não desta API.",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" }, description: "Identificador do deputado (DepCadId)" }],
        responses: {
          "302": {
            description: "Redirecção para o CDN",
            headers: { Location: { schema: { type: "string", format: "uri" }, description: "URL da imagem no CDN" } },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "429": { $ref: "#/components/responses/TooManyRequests" },
        },
      },
    },
    "/deputados/{id}": {
      get: {
        operationId: "getDeputado",
        tags: ["Deputados"],
        summary: "Obter um deputado com mandatos, biografia e estatísticas",
        description:
          "Devolve o deputado com `mandatos`, `cargos`, `situacoes`, o registo biográfico completo em `bio`, " +
          "estatísticas de autoria em `stats` e as 20 iniciativas mais recentes de que é autor.",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" }, description: "Identificador do deputado (DepCadId)" }],
        responses: {
          "200": {
            description: "Deputado com mandatos, biografia, estatísticas e iniciativas recentes",
            content: { "application/json": { schema: { $ref: "#/components/schemas/DeputadoDetail" } } },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "404": { $ref: "#/components/responses/NotFound" },
          "429": { $ref: "#/components/responses/TooManyRequests" },
        },
      },
    },
    "/deputados/{id}/atividade": {
      get: {
        operationId: "getDeputadoAtividade",
        tags: ["Deputados"],
        summary: "Actividade parlamentar de um deputado",
        description: "Devolve toda a actividade parlamentar registada para um deputado numa legislatura: iniciativas, requerimentos, intervenções, actividades em plenário, comissões, relatorias, e mais.",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "integer" }, description: "Identificador do deputado (DepCadId)" },
          { name: "legislatura", in: "query", schema: { type: "string" }, description: "Identificador da legislatura (ex: `XVII`). Sem este parâmetro devolve toda a actividade histórica." },
        ],
        responses: {
          "200": {
            description: "Actividade parlamentar do deputado",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    deputado: { type: "object", properties: { id: { type: "integer" }, nomeParlamentar: { type: "string" } } },
                    iniciativas: { type: "array", description: "Iniciativas legislativas de que é autor", items: { type: "object" } },
                    requerimentos: { type: "array", description: "Requerimentos apresentados", items: { type: "object" } },
                    intervencoes: { type: "array", description: "Intervenções em plenário", items: { type: "object" } },
                    actp: { type: "array", description: "Outras actividades em plenário (votos, etc.)", items: { type: "object" } },
                    comissoes: { type: "array", description: "Comissões a que pertence", items: { type: "object" } },
                    atividadesComissao: { type: "array", description: "Actividades em comissão (eventos, audições, deslocações)", items: { type: "object" } },
                    gpa: { type: "array", description: "Grupos parlamentares de amizade, com cargo e datas", items: { type: "object" } },
                    dlp: { type: "array", description: "Delegações parlamentares permanentes, com cargo e reuniões", items: { type: "object" } },
                    dle: { type: "array", description: "Delegações/deslocações eventuais, com local, tipo e datas", items: { type: "object" } },
                    relIni: { type: "array", description: "Iniciativas relatadas", items: { type: "object" } },
                    relPet: { type: "array", description: "Petições relatadas", items: { type: "object" } },
                    relContas: { type: "array", description: "Relatorias de contas públicas", items: { type: "object" } },
                    relIniEur: { type: "array", description: "Iniciativas europeias relatadas", items: { type: "object" } },
                    relPareceres: { type: "array", description: "Pareceres emitidos", items: { type: "object" } },
                    parlJovens: { type: "array", description: "Participação no Parlamento dos Jovens", items: { type: "object" } },
                    dadosLegis: { type: "array", description: "Nome e grupo parlamentar do deputado à data de cada legislatura", items: { type: "object" } },
                    scgt: { type: "array", description: "Subcomissões e grupos de trabalho, com cargo e situação", items: { type: "object" } },
                  },
                },
              },
            },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "404": { $ref: "#/components/responses/NotFound" },
          "429": { $ref: "#/components/responses/TooManyRequests" },
        },
      },
    },
    "/iniciativas": {
      get: {
        operationId: "listIniciativas",
        tags: ["Iniciativas"],
        summary: "Listar iniciativas legislativas",
        parameters: [
          { name: "legislatura", in: "query", schema: { type: "string" }, description: "Identificador da legislatura (ex: `XVII`)" },
          {
            name: "tipo",
            in: "query",
            schema: { type: "string", enum: ["R", "P", "J", "D", "S", "A", "I", "C", "F"] },
            description: "`R` Resolução · `P` Proposta de Lei · `J` Projeto de Lei · `D` Decreto · `S` Outros · `A` Apreciação · `I` Iniciativa Europeia · `C` Pergunta/Requerimento · `F` Outros. Use `/meta` para os tipos efectivamente presentes nos dados.",
          },
          { name: "estado", in: "query", schema: { type: "array", items: { type: "string" } }, style: "form", explode: true, description: "Fase actual do processo, não um veredicto. Pode repetir para múltiplos valores (ex: `?estado=Lei (Publicação DR)&estado=Iniciativa Caducada`). Os valores exactos estão em `/meta` → `estados`; note que `Aprovado` **não** é um deles — para saber se foi aprovada use `resultado=aprovado`." },
          {
            name: "grupo",
            in: "query",
            schema: { type: "string" },
            description:
              "Filtrar pelo autor. Aceita a sigla de um grupo parlamentar (ex: `PS`, `CH`) " +
              "ou um dos autores institucionais: `Governo`, `PAR`, `Madeira`, `Açores`, `Mesa`. " +
              "A lista completa está em `/meta` → `grupos`.",
          },
          {
            name: "resultado",
            in: "query",
            schema: { type: "string", enum: ["aprovado", "rejeitado", "pendente"] },
            description: "`aprovado` — tem ≥1 votação Aprovado · `rejeitado` — tem ≥1 votação Rejeitado · `pendente` — sem votações registadas",
          },
          { $ref: "#/components/parameters/dataInicio" },
          { $ref: "#/components/parameters/dataFim" },
          { name: "dataEntradaDe", in: "query", deprecated: true, schema: { type: "string", format: "date" }, description: "Obsoleto — use `data_inicio`. Ignorado se `data_inicio` for fornecido." },
          { name: "dataEntradaAte", in: "query", deprecated: true, schema: { type: "string", format: "date" }, description: "Obsoleto — use `data_fim`. Ignorado se `data_fim` for fornecido." },
          { name: "deputado", in: "query", schema: { type: "string" }, description: "Filtrar por autor deputado — aceita ID numérico ou nome parlamentar (pesquisa parcial, case-insensitive)" },
          { name: "q", in: "query", schema: { type: "string", maxLength: 100 }, description: "Pesquisa parcial no título (case-insensitive)" },
          { $ref: "#/components/parameters/updatedSince" },
          { name: "sort", in: "query", schema: { type: "string", enum: ["desc", "asc"], default: "desc" }, description: "Ordenação por data de entrada" },
          { $ref: "#/components/parameters/page" },
          { $ref: "#/components/parameters/limit" },
        ],
        responses: {
          "200": {
            description: "Lista paginada de iniciativas",
            content: { "application/json": { schema: { $ref: "#/components/schemas/PaginatedIniciativas" } } },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "429": { $ref: "#/components/responses/TooManyRequests" },
        },
      },
    },
    "/iniciativas/{id}": {
      get: {
        operationId: "getIniciativa",
        tags: ["Iniciativas"],
        summary: "Obter uma iniciativa com detalhe completo",
        description: [
          "Sem `include`, devolve **tudo**: `autores`, `eventos` (cada um com `votacoes`, `publicacoes`,",
          "`comissoesFases`, `intervencoesdebates`, `iniciativasConjuntas`, `peticoesConjuntas` e `anexos`),",
          "`relacionadas`, `anexos`, `conjuntas`, `peticoes` e `propostasAlteracao`.",
          "",
          "Para iniciativas antigas e muito debatidas esta resposta chega às centenas de KB.",
          "Use `?include=` para pedir só o que precisa.",
          "",
          "### `?include=`",
          "Lista separada por vírgulas. Relações de topo:",
          "`autores`, `eventos`, `relacionadas`, `anexos`, `conjuntas`, `peticoes`, `propostasAlteracao`.",
          "",
          "Sub-relações de `eventos` (prefixadas ou na forma curta):",
          "`eventos.votacoes`, `eventos.publicacoes`, `eventos.comissoesFases`,",
          "`eventos.intervencoesdebates`, `eventos.iniciativasConjuntas`, `eventos.peticoesConjuntas`,",
          "`eventos.anexos`. Todas excepto `eventos.anexos` aceitam a forma curta",
          "(`votacoes` ≡ `eventos.votacoes`); `anexos` sem prefixo refere-se sempre à relação de topo.",
          "",
          "Pedir `eventos` traz todas as suas sub-relações. Pedir uma sub-relação traz `eventos`",
          "automaticamente. `?include=` (vazio) devolve apenas os campos escalares.",
          "Uma chave desconhecida devolve `400` com a lista de chaves válidas.",
          "",
          "Exemplos:",
          "`?include=autores,eventos.votacoes` · `?include=autores,relacionadas` · `?include=`",
        ].join("\n"),
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "integer" }, description: "Identificador da iniciativa (IniId)" },
          {
            name: "include",
            in: "query",
            schema: { type: "string" },
            description: "Lista de relações a incluir, separadas por vírgulas. Omitir devolve tudo; string vazia devolve só os campos escalares.",
            examples: {
              tudo: { summary: "Tudo (omitir o parâmetro)", value: undefined },
              escalares: { summary: "Só campos escalares", value: "" },
              votacoes: { summary: "Autores e votações", value: "autores,eventos.votacoes" },
              formaCurta: { summary: "Forma curta equivalente", value: "autores,votacoes" },
            },
          },
          {
            name: "If-None-Match",
            in: "header",
            schema: { type: "string" },
            description: "Envie o `ETag` de uma resposta anterior para receber `304` se nada mudou.",
          },
        ],
        responses: {
          "200": {
            description: "Iniciativa, com as relações pedidas",
            headers: { ETag: { schema: { type: "string" }, description: "ETag fraco derivado de `updatedAt`" } },
            content: { "application/json": { schema: { $ref: "#/components/schemas/IniciativaDetail" } } },
          },
          "304": { $ref: "#/components/responses/NotModified" },
          "400": { $ref: "#/components/responses/BadRequest" },
          "404": { $ref: "#/components/responses/NotFound" },
          "429": { $ref: "#/components/responses/TooManyRequests" },
        },
      },
    },
    "/peticoes": {
      get: {
        operationId: "listPeticoes",
        tags: ["Petições"],
        summary: "Listar petições",
        parameters: [
          { name: "legislatura", in: "query", schema: { type: "string" }, description: "Identificador da legislatura (ex: `XVII`)" },
          { name: "situacao", in: "query", schema: { type: "string" }, description: "Situação da petição (ex: `Admitida`, `Arquivada`)" },
          { name: "q", in: "query", schema: { type: "string", maxLength: 100 }, description: "Pesquisa parcial no assunto (case-insensitive)" },
          { $ref: "#/components/parameters/dataInicio" },
          { $ref: "#/components/parameters/dataFim" },
          { $ref: "#/components/parameters/updatedSince" },
          { name: "sort", in: "query", schema: { type: "string", enum: ["desc", "asc"], default: "desc" }, description: "Ordenação por data de entrada" },
          { $ref: "#/components/parameters/page" },
          { $ref: "#/components/parameters/limit" },
        ],
        responses: {
          "200": {
            description: "Lista paginada de petições",
            content: { "application/json": { schema: { $ref: "#/components/schemas/PaginatedPeticoes" } } },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "429": { $ref: "#/components/responses/TooManyRequests" },
        },
      },
    },
    "/peticoes/{id}": {
      get: {
        operationId: "getPeticao",
        tags: ["Petições"],
        summary: "Obter uma petição com detalhe completo",
        description: [
          "Sem `include`, devolve **tudo**: `comissoes` (cada uma com `relatores`, `relatorioFinal`,",
          "`documentos`, `audicoes` e `pedidosInformacao`), `documentos`, `publicacoes` e `relacionadas`.",
          "",
          "### `?include=`",
          "Lista separada por vírgulas. Relações de topo:",
          "`comissoes`, `documentos`, `publicacoes`, `relacionadas`.",
          "",
          "Sub-relações de `comissoes` (prefixadas ou na forma curta):",
          "`comissoes.relatores`, `comissoes.relatorioFinal`, `comissoes.documentos`,",
          "`comissoes.audicoes`, `comissoes.pedidosInformacao`. Todas excepto",
          "`comissoes.documentos` aceitam a forma curta (`relatores` ≡ `comissoes.relatores`);",
          "`documentos` sem prefixo refere-se sempre à relação de topo.",
          "",
          "Pedir `comissoes` traz todas as suas sub-relações. Pedir uma sub-relação traz",
          "`comissoes` automaticamente. `?include=` (vazio) devolve apenas os campos escalares.",
          "Uma chave desconhecida devolve `400` com a lista de chaves válidas.",
          "",
          "Exemplos:",
          "`?include=comissoes.relatorioFinal` · `?include=documentos,publicacoes` · `?include=`",
        ].join("\n"),
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "integer" }, description: "Identificador da petição" },
          {
            name: "include", in: "query", schema: { type: "string" },
            description: "Lista de relações a incluir, separadas por vírgulas. Omitir devolve tudo.",
            example: "comissoes.relatorioFinal,documentos",
          },
          { name: "If-None-Match", in: "header", schema: { type: "string" }, description: "Envie o `ETag` de uma resposta anterior para receber `304` se nada mudou." },
        ],
        responses: {
          "200": {
            description: "Petição com as relações pedidas",
            headers: { ETag: { schema: { type: "string" }, description: "ETag fraco derivado de `updatedAt`" } },
            content: { "application/json": { schema: { $ref: "#/components/schemas/PeticaoDetail" } } },
          },
          "304": { $ref: "#/components/responses/NotModified" },
          "400": { $ref: "#/components/responses/BadRequest" },
          "404": { $ref: "#/components/responses/NotFound" },
          "429": { $ref: "#/components/responses/TooManyRequests" },
        },
      },
    },
    "/comissoes": {
      get: {
        operationId: "listComissoes",
        tags: ["Comissões"],
        summary: "Listar comissões parlamentares",
        description: "Devolve a tabela canónica de comissões, cada uma com um `id` numérico estável.",
        parameters: [
          { name: "legislatura", in: "query", schema: { type: "string" }, description: "Filtrar pelas legislaturas em que a comissão esteve activa (ex: `XVII`)" },
          { name: "q", in: "query", schema: { type: "string", maxLength: 100 }, description: "Pesquisa parcial no nome da comissão (case-insensitive)" },
          { $ref: "#/components/parameters/sortNome" },
          { $ref: "#/components/parameters/page" },
          { $ref: "#/components/parameters/limit" },
        ],
        responses: {
          "200": {
            description: "Lista paginada de comissões",
            content: { "application/json": { schema: { $ref: "#/components/schemas/PaginatedComissoes" } } },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "429": { $ref: "#/components/responses/TooManyRequests" },
        },
      },
    },
    "/comissoes/{id}": {
      get: {
        operationId: "getComissao",
        tags: ["Comissões"],
        summary: "Obter uma comissão com as suas iniciativas",
        description:
          "Devolve metadados da comissão e a lista paginada de iniciativas que por ela passaram, " +
          "cada uma com as respectivas `comissoesFases` (relatores, votações, documentos, audições, remessas e publicações). " +
          "Use `/comissoes` para obter o `id` a partir do nome.",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "integer" }, description: "ID numérico da comissão (ex: `42`). Obtenha-o em `/comissoes`." },
          { name: "legislatura", in: "query", schema: { type: "string" }, description: "Filtrar iniciativas por legislatura (ex: `XVII`)" },
          { name: "estado", in: "query", schema: { type: "string" }, description: "Estado da iniciativa (ex: `Lei (Publicação DR)`). Valores em `/meta` → `estados`." },
          { name: "tipo", in: "query", schema: { type: "string" }, description: "Tipo de iniciativa (ex: `J`, `P`)" },
          { name: "q", in: "query", schema: { type: "string", maxLength: 100 }, description: "Pesquisa parcial no título da iniciativa (case-insensitive)" },
          { name: "sort", in: "query", schema: { type: "string", enum: ["desc", "asc"], default: "desc" }, description: "Ordenação por data de entrada" },
          { $ref: "#/components/parameters/page" },
          { $ref: "#/components/parameters/limit" },
        ],
        responses: {
          "200": {
            description: "Comissão com iniciativas e relatores",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ComissaoDetail" } } },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "404": { $ref: "#/components/responses/NotFound" },
          "429": { $ref: "#/components/responses/TooManyRequests" },
        },
      },
    },
    "/votacoes": {
      get: {
        operationId: "listVotacoes",
        tags: ["Votações"],
        summary: "Listar votações em plenário",
        parameters: [
          { name: "legislatura", in: "query", schema: { type: "string" }, description: "Identificador da legislatura (ex: `XVII`)" },
          { name: "resultado", in: "query", schema: { type: "string", enum: ["Aprovado", "Rejeitado", "Prejudicado"] }, description: "Resultado da votação (correspondência exacta, sensível a maiúsculas)" },
          { name: "unanime", in: "query", schema: { type: "string", enum: ["true", "false", "1", "0"] }, description: "Filtrar votações unânimes. Qualquer outro valor devolve `400`." },
          { name: "iniciativa", in: "query", schema: { type: "integer" }, description: "Todas as votações de uma iniciativa (IniId)" },
          { name: "tipo", in: "query", schema: { type: "string" }, description: "Tipo da iniciativa votada (ex: `J`, `P`)" },
          {
            name: "grupo",
            in: "query",
            schema: { type: "string" },
            description: "Votações de iniciativas de que este grupo é autor. Mesmos valores de `/iniciativas?grupo=`, incluindo `Governo`, `PAR`, `Madeira`, `Açores` e `Mesa`.",
          },
          { name: "a_favor", in: "query", schema: { type: "string" }, description: "Votações em que esta sigla votou a favor (ex: `PS`)" },
          { name: "contra", in: "query", schema: { type: "string" }, description: "Votações em que esta sigla votou contra (ex: `CH`)" },
          { name: "abstencao", in: "query", schema: { type: "string" }, description: "Votações em que esta sigla se absteve (ex: `IL`)" },
          { $ref: "#/components/parameters/dataInicio" },
          { $ref: "#/components/parameters/dataFim" },
          { name: "sort", in: "query", schema: { type: "string", enum: ["desc", "asc"], default: "desc" }, description: "Ordenação por data da votação" },
          { $ref: "#/components/parameters/page" },
          { $ref: "#/components/parameters/limit" },
        ],
        responses: {
          "200": {
            description: "Lista paginada de votações com metadados da iniciativa",
            content: { "application/json": { schema: { $ref: "#/components/schemas/PaginatedVotacoes" } } },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "429": { $ref: "#/components/responses/TooManyRequests" },
        },
      },
    },
    "/votacoes/{id}": {
      get: {
        operationId: "getVotacao",
        tags: ["Votações"],
        summary: "Obter uma votação",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" }, description: "Identificador da votação" },
          { name: "iniciativa_id", in: "query", required: true, schema: { type: "integer" }, description: "Identificador da iniciativa (obrigatório — o id da votação é único por iniciativa, não globalmente)" },
        ],
        responses: {
          "200": {
            description: "Votação com referência à iniciativa",
            content: { "application/json": { schema: { $ref: "#/components/schemas/VotacaoDetail" } } },
          },
          "400": { description: "`iniciativa_id` em falta ou não numérico", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          "404": { $ref: "#/components/responses/NotFound" },
          "429": { $ref: "#/components/responses/TooManyRequests" },
        },
      },
    },
  },
  components: {
    parameters: {
      legislaturaId: { name: "id", in: "path" as const, required: true, schema: { type: "string" }, description: "Identificador da legislatura (ex: `XVII`, `XIII`, `Constituinte`)" },
      page: { name: "page", in: "query" as const, schema: { type: "integer", default: 1, minimum: 1 }, description: "Valores fora do intervalo são ajustados ao limite mais próximo." },
      limit: { name: "limit", in: "query" as const, schema: { type: "integer", default: 50, minimum: 1, maximum: 200 }, description: "Valores fora do intervalo são ajustados ao limite mais próximo." },
      sort: { name: "sort", in: "query" as const, schema: { type: "string", enum: ["desc", "asc"], default: "desc" }, description: "Ordenação por data (desc = mais recente primeiro)" },
      sortNome: { name: "sort", in: "query" as const, schema: { type: "string", enum: ["asc", "desc"], default: "asc" }, description: "Ordenação alfabética por nome" },
      updatedSince: {
        name: "updated_since",
        in: "query" as const,
        schema: { type: "string", format: "date-time" },
        description: "Devolve apenas registos com `updatedAt` igual ou posterior a este instante. Aceita `AAAA-MM-DD` ou `AAAA-MM-DDTHH:MM:SSZ`. Para sincronização incremental.",
      },
      dataInicio: { name: "data_inicio", in: "query" as const, schema: { type: "string", format: "date" }, description: "Data mínima, inclusive (AAAA-MM-DD)" },
      dataFim: { name: "data_fim", in: "query" as const, schema: { type: "string", format: "date" }, description: "Data máxima, inclusive (AAAA-MM-DD)" },
    },
    responses: {
      NotFound: {
        description: "Recurso não encontrado",
        content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
      },
      BadRequest: {
        description: "Parâmetro inválido (id malformado, data fora de formato, `q` demasiado longo, chave `include` desconhecida)",
        content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
      },
      TooManyRequests: {
        description: "Limite de 100 pedidos/minuto excedido. Ver o cabeçalho `Retry-After`.",
        headers: {
          "Retry-After": { schema: { type: "integer" }, description: "Segundos até poder repetir o pedido" },
        },
        content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
      },
      NotModified: {
        description: "O recurso não mudou desde o `ETag` enviado em `If-None-Match`. Sem corpo.",
      },
    },
    schemas: {
      Error: {
        type: "object",
        properties: { error: { type: "string" } },
        required: ["error"],
      },
      Legislatura: {
        type: "object",
        properties: {
          id: { type: "string", example: "XVII", description: "`Constituinte`, ou numeração romana de `I` a `XVII`" },
          nome: { type: "string", example: "XVII Legislatura" },
          dataInicio: { type: ["string", "null"], format: "date", example: "2025-06-03" },
          dataFim: { type: ["string", "null"], format: "date", description: "null para a legislatura em curso" },
          arId: { type: ["string", "null"], description: "Identificador numérico interno da AR (`DetalheLegislatura.id`)", example: "108" },
          siglaAntiga: { type: ["string", "null"], description: "Sigla usada nos dados de origem", example: "XVII" },
        },
      },
      LegislaturaDetail: {
        allOf: [
          { $ref: "#/components/schemas/Legislatura" },
          {
            type: "object",
            properties: {
              iniciativasTotal: { type: "integer" },
              deputadosTotal: { type: "integer" },
              votacoesTotal: { type: "integer" },
            },
          },
        ],
      },
      Deputado: {
        type: "object",
        properties: {
          id: { type: "integer" },
          nomeParlamentar: { type: "string", example: "Pedro Nuno Santos" },
          nomeCompleto: { type: "string" },
          grupoParlamentar: { type: ["string", "null"], example: "PS" },
          circuloEleitoral: { type: ["string", "null"], example: "Lisboa" },
          legislaturaId: { type: "string" },
          situacao: { type: ["string", "null"], example: "Efetivo" },
          updatedAt: { type: "string", format: "date-time", description: "Última alteração ao registo do deputado — use com `updated_since`" },
        },
      },
      Carreiras: {
        type: "object",
        properties: {
          data: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "integer" },
                nomeParlamentar: { type: "string" },
                totalLegs: { type: "integer", description: "Número de legislaturas distintas em que serviu" },
                firstLegStart: { type: ["string", "null"], format: "date", description: "Data de início da primeira legislatura" },
                lastLegStart: { type: ["string", "null"], format: "date", description: "Data de início da última legislatura" },
                lastParty: { type: ["string", "null"], description: "Grupo parlamentar no mandato mais recente" },
                legIds: { type: "array", items: { type: "string" }, description: "Identificadores das legislaturas servidas" },
              },
            },
          },
          stats: {
            type: ["object", "null"],
            description: "Agregados sobre todos os deputados, não apenas os devolvidos em `data`",
            properties: {
              totalDeputies: { type: "integer" },
              singleTerm: { type: "integer", description: "Deputados com uma só legislatura" },
              avgLegs: { type: "number", description: "Média de legislaturas por deputado" },
            },
          },
        },
      },
      Mandato: {
        type: "object",
        properties: {
          id: { type: "integer" },
          legislaturaId: { type: "string" },
          grupoParlamentar: { type: ["string", "null"] },
          circuloEleitoral: { type: ["string", "null"] },
          dataInicio: { type: ["string", "null"], format: "date" },
          dataFim: { type: ["string", "null"], format: "date" },
          situacao: { type: ["string", "null"] },
        },
      },
      DeputadoStats: {
        type: "object",
        properties: {
          total: { type: "integer", description: "Total de iniciativas em que o deputado é autor" },
          aprovadas: { type: "integer", description: "Iniciativas aprovadas (lei, resolução da AR, publicadas)" },
          por_tipo: {
            type: ["object", "null"],
            additionalProperties: { type: "integer" },
            description: "Contagem por tipo de iniciativa (chave = tipoDesc)",
          },
        },
      },
      BioEntrada: {
        type: "object",
        properties: {
          id: { type: "integer" },
          descricao: { type: ["string", "null"] },
          ordem: { type: ["integer", "null"] },
        },
      },
      DeputadoBio: {
        type: "object",
        description: "Registo biográfico publicado pela AR. Arrays vazios quando não há registo.",
        properties: {
          habilitacoes: { type: "array", items: { $ref: "#/components/schemas/BioEntrada" }, description: "Habilitações literárias" },
          titulos: { type: "array", items: { $ref: "#/components/schemas/BioEntrada" }, description: "Títulos académicos e profissionais" },
          cargosFuncoes: { type: "array", items: { $ref: "#/components/schemas/BioEntrada" }, description: "Cargos e funções exercidos" },
          condecoracoes: { type: "array", items: { $ref: "#/components/schemas/BioEntrada" } },
          obrasPublicadas: { type: "array", items: { $ref: "#/components/schemas/BioEntrada" } },
          legislaturas: {
            type: "array",
            items: { $ref: "#/components/schemas/BioLegislatura" },
            description: "Percurso por legislatura, com o partido (`partidoSigla`) — distinto do grupo parlamentar em `mandatos`",
          },
          orgaos: {
            type: "array",
            items: { $ref: "#/components/schemas/BioOrgao" },
            description: "Comissões, grupos de trabalho e subcomissões, distinguidos por `tipo`",
          },
        },
      },
      BioLegislatura: {
        type: "object",
        properties: {
          id: { type: "integer" },
          legDes: { type: ["string", "null"], description: "Legislatura como publicada (`Cons` para a Constituinte)" },
          legislaturaId: { type: ["string", "null"], description: "FK para `/legislaturas`; `null` quando não resolúvel" },
          nomeParlamentar: { type: ["string", "null"] },
          gpSigla: { type: ["string", "null"], description: "Grupo parlamentar" },
          gpDes: { type: ["string", "null"] },
          partidoSigla: { type: ["string", "null"], description: "Partido ou coligação eleitoral, ex. `PPD/PSD.CDS-PP`", example: "PS" },
          partidoDes: { type: ["string", "null"] },
          circuloDes: { type: ["string", "null"] },
          indDes: { type: ["string", "null"], example: "Independente" },
          indData: { type: ["string", "null"], format: "date" },
        },
      },
      BioOrgao: {
        type: "object",
        properties: {
          id: { type: "integer" },
          tipo: { type: "string", enum: ["comissao", "grupo_trabalho", "subcomissao"] },
          orgId: { type: ["string", "null"], description: "Identificador do órgão na fonte" },
          orgSigla: { type: ["string", "null"], example: "CACDLG" },
          orgDes: { type: ["string", "null"] },
          legDes: { type: ["string", "null"] },
          legislaturaId: { type: ["string", "null"] },
          situacao: { type: ["string", "null"], example: "Efetivo" },
          cargo: { type: ["string", "null"], example: "Presidente" },
        },
      },
      DeputadoDetail: {
        type: "object",
        properties: {
          id: { type: "integer", description: "DepCadId" },
          depId: { type: ["integer", "null"], description: "DepId — identificador interno distinto do DepCadId" },
          nomeParlamentar: { type: "string" },
          nomeCompleto: { type: "string" },
          dataNascimento: { type: ["string", "null"], format: "date" },
          sexo: { type: ["string", "null"] },
          profissao: { type: ["string", "null"] },
          videos: { description: "JSONB — DadosVideo[]; nulo em todos os registos até à data" },
          updatedAt: { type: "string", format: "date-time" },
          mandatos: { type: "array", items: { $ref: "#/components/schemas/Mandato" } },
          cargos: { type: "array", items: { type: "object" }, description: "Cargos exercidos na AR (mesa, presidência de comissão, etc.)" },
          situacoes: { type: "array", items: { type: "object" }, description: "Histórico de situações do mandato, com datas" },
          bio: { $ref: "#/components/schemas/DeputadoBio" },
          stats: { $ref: "#/components/schemas/DeputadoStats" },
          iniciativas: {
            type: "array",
            items: { $ref: "#/components/schemas/Iniciativa" },
            description: "As 20 iniciativas mais recentes de que o deputado é autor",
          },
        },
      },
      PaginatedDeputados: {
        type: "object",
        properties: {
          data: { type: "array", items: { $ref: "#/components/schemas/Deputado" } },
          total: { type: "integer" },
          page: { type: "integer" },
          limit: { type: "integer" },
        },
      },
      Iniciativa: {
        type: "object",
        properties: {
          id: { type: "integer" },
          legislaturaId: { type: "string" },
          numero: { type: "string" },
          tipo: { type: "string", enum: ["R", "P", "J", "D", "S", "A", "I", "C", "F"] },
          tipoDesc: { type: "string", example: "Proposta de Lei" },
          titulo: { type: "string" },
          epigrafe: { type: ["string", "null"] },
          dataEntrada: { type: ["string", "null"], format: "date" },
          dataFim: { type: ["string", "null"], format: "date" },
          estado: { type: ["string", "null"], description: "Fase do último evento registado — não é um veredicto de aprovação", example: "Lei (Publicação DR)" },
          linkTexto: { type: ["string", "null"], description: "URL para o texto integral em PDF" },
          updatedAt: { type: "string", format: "date-time", description: "Última alteração ao registo — use com `updated_since`" },
        },
      },
      Autor: {
        type: "object",
        properties: {
          tipo: { type: "string", enum: ["deputado", "grupo", "governo", "comissao", "outro"] },
          deputadoId: { type: ["integer", "null"] },
          grupoParlamentar: { type: ["string", "null"] },
          nome: { type: ["string", "null"] },
        },
      },
      Publicacao: {
        type: "object",
        properties: {
          data: { type: ["string", "null"], format: "date" },
          legislatura: { type: ["string", "null"] },
          numero: { type: ["string", "null"] },
          sessaoLegislativa: { type: ["string", "null"] },
          tipo: { type: ["string", "null"], example: "DAR II série A" },
          paginas: { type: "array", items: { type: "string" }, example: ["92-95"] },
          urlDiario: { type: ["string", "null"] },
        },
      },
      Votacao: {
        type: "object",
        properties: {
          id: { type: "string" },
          data: { type: ["string", "null"], format: "date" },
          resultado: { type: "string", enum: ["Aprovado", "Rejeitado", "Prejudicado"] },
          unanime: { type: "boolean" },
          reuniao: { type: ["string", "null"] },
          tipoReuniao: { type: ["string", "null"], example: "RP" },
          descricao: { type: ["string", "null"] },
          aFavor: { type: "array", items: { type: "string" }, description: "Siglas dos grupos que votaram a favor" },
          contra: { type: "array", items: { type: "string" }, description: "Siglas dos grupos que votaram contra" },
          abstencao: { type: "array", items: { type: "string" }, description: "Siglas dos grupos que se abstiveram" },
          ausencias: { type: "array", items: { type: "string" } },
          detalhe: { type: ["string", "null"], description: "HTML original da AR de onde `aFavor`/`contra`/`abstencao` são extraídos. Útil para votações nominais, em que o detalhe nomeia deputados individuais." },
        },
      },
      Evento: {
        type: "object",
        properties: {
          id: { type: "integer" },
          fase: { type: "string", example: "Votação na generalidade" },
          codigoFase: { type: ["string", "null"] },
          dataFase: { type: ["string", "null"], format: "date" },
          obs: { type: ["string", "null"] },
          comissao: { description: "JSONB — dados da comissão, quando aplicável" },
          textosAprovados: { description: "JSONB — textos aprovados, quando aplicável" },
          votacoes: { type: "array", items: { $ref: "#/components/schemas/Votacao" } },
          publicacoes: { type: "array", items: { $ref: "#/components/schemas/Publicacao" } },
          comissoesFases: { type: "array", items: { $ref: "#/components/schemas/ComissaoFase" } },
          intervencoesdebates: {
            type: "array",
            items: { type: "object" },
            description: "Intervenções em debate, cada uma com `oradores`, as respectivas `publicacoes` e os `deputados` que intervieram (com `deputadoId` para `/deputados/{id}`). A relação mais pesada — peça-a explicitamente.",
          },
          iniciativasConjuntas: { type: "array", items: { type: "object" }, description: "Iniciativas discutidas em conjunto neste evento" },
          peticoesConjuntas: { type: "array", items: { type: "object" }, description: "Petições discutidas em conjunto neste evento" },
          anexos: { type: "array", items: { type: "object" }, description: "Anexos do evento. Só via `eventos.anexos` — a forma curta `anexos` refere-se à relação de topo." },
        },
      },
      ComissaoRelator: {
        type: "object",
        properties: {
          deputadoId: { type: ["integer", "null"] },
          nome: { type: ["string", "null"] },
          grupoParlamentar: { type: ["string", "null"] },
          dataNomeacao: { type: ["string", "null"], format: "date" },
          dataCessacao: { type: ["string", "null"], format: "date" },
        },
      },
      ComissaoVotacao: {
        type: "object",
        properties: {
          data: { type: ["string", "null"], format: "date" },
          resultado: { type: ["string", "null"] },
          unanime: { type: ["boolean", "null"] },
          descricao: { type: ["string", "null"] },
          aFavor: { type: "array", items: { type: "string" } },
          contra: { type: "array", items: { type: "string" } },
          abstencao: { type: "array", items: { type: "string" } },
          ausencias: { type: "array", items: { type: "string" } },
          publicacoes: {
            type: "array",
            items: {
              type: "object",
              properties: {
                tipoRef: { type: "string" },
                data: { type: ["string", "null"], format: "date" },
                legislatura: { type: ["string", "null"] },
                numero: { type: ["string", "null"] },
                sessaoLegislativa: { type: ["string", "null"] },
                tipo: { type: ["string", "null"] },
                paginas: { type: "array", items: { type: "string" } },
                urlDiario: { type: ["string", "null"] },
              },
            },
          },
        },
      },
      ComissaoFase: {
        type: "object",
        description: "Fase de apreciação de uma iniciativa numa comissão",
        properties: {
          id: { type: "integer" },
          comissaoId: { type: ["integer", "null"], description: "ID da comissão canónica" },
          numero: { type: ["string", "null"], description: "Identificador da comissão no contexto da legislatura" },
          sigla: { type: ["string", "null"] },
          nome: { type: ["string", "null"] },
          competente: { type: ["boolean", "null"], description: "true se for a comissão competente" },
          dataEntrada: { type: ["string", "null"], format: "date" },
          dataRelatorio: { type: ["string", "null"], format: "date" },
          dataDistribuicao: { type: ["string", "null"], format: "date" },
          dataAgendamentoPlenario: { type: ["string", "null"], format: "date" },
          motivoNaoParecer: { type: ["string", "null"] },
          relatores: { type: "array", items: { $ref: "#/components/schemas/ComissaoRelator" } },
          votacoes: { type: "array", items: { $ref: "#/components/schemas/ComissaoVotacao" } },
          documentos: {
            type: "array",
            items: {
              type: "object",
              properties: {
                url: { type: ["string", "null"] },
                dataDocumento: { type: ["string", "null"], format: "date" },
                tipoDocumento: { type: ["string", "null"], example: "Parecer" },
                tituloDocumento: { type: ["string", "null"] },
              },
            },
          },
          audicoes: {
            type: "array",
            items: {
              type: "object",
              properties: {
                fonte: { type: "string", enum: ["Audicoes", "Audiencias"] },
                data: { type: ["string", "null"], format: "date" },
                tipo: { type: ["string", "null"], example: "AUD" },
              },
            },
          },
          remessas: {
            type: "array",
            items: {
              type: "object",
              properties: {
                dataRemessa: { type: ["string", "null"], format: "date" },
                tipoRemessa: { type: ["string", "null"] },
                observacoes: { type: ["string", "null"] },
              },
            },
          },
          publicacoes: {
            type: "array",
            items: {
              type: "object",
              properties: {
                tipoRef: { type: "string", enum: ["publicacao", "relatorio"] },
                data: { type: ["string", "null"], format: "date" },
                legislatura: { type: ["string", "null"] },
                numero: { type: ["string", "null"] },
                sessaoLegislativa: { type: ["string", "null"] },
                tipo: { type: ["string", "null"] },
                paginas: { type: "array", items: { type: "string" } },
                urlDiario: { type: ["string", "null"] },
              },
            },
          },
        },
      },
      Comissao: {
        type: "object",
        properties: {
          id: { type: "integer", description: "Identificador canónico estável" },
          sigla: { type: ["string", "null"] },
          nome: { type: ["string", "null"] },
        },
      },
      ComissaoIniciativa: {
        allOf: [
          { $ref: "#/components/schemas/Iniciativa" },
          {
            type: "object",
            properties: {
              comissoesFases: { type: "array", items: { $ref: "#/components/schemas/ComissaoFase" } },
            },
          },
        ],
      },
      ComissaoDetail: {
        type: "object",
        properties: {
          id: { type: "integer", description: "Identificador canónico estável" },
          sigla: { type: ["string", "null"] },
          nome: { type: ["string", "null"] },
          legislaturas: { type: "array", items: { type: "string" }, description: "Legislaturas em que a comissão esteve activa, da mais recente para a mais antiga" },
          total: { type: "integer" },
          page: { type: "integer" },
          limit: { type: "integer" },
          data: { type: "array", items: { $ref: "#/components/schemas/ComissaoIniciativa" } },
        },
      },
      PaginatedComissoes: {
        type: "object",
        properties: {
          data: { type: "array", items: { $ref: "#/components/schemas/Comissao" } },
          total: { type: "integer" },
          page: { type: "integer" },
          limit: { type: "integer" },
        },
      },
      Relacionada: {
        type: "object",
        properties: {
          tipo: { type: "string", enum: ["origem", "originada", "peticao", "europeia"] },
          relId: { type: ["string", "null"] },
          relLegislatura: { type: ["string", "null"] },
          relNumero: { type: ["string", "null"] },
          relTipo: { type: ["string", "null"] },
          relAssunto: { type: ["string", "null"] },
          urlEuropeia: { type: ["string", "null"] },
        },
      },
      IniciativaDetail: {
        allOf: [
          { $ref: "#/components/schemas/Iniciativa" },
          {
            type: "object",
            description: "Cada relação está presente apenas se pedida via `?include=` (ou se `include` for omitido, caso em que vêm todas).",
            properties: {
              textoSubstituido: { type: "boolean" },
              textoSubstCampo: { type: ["string", "null"] },
              obs: { type: ["string", "null"] },
              sel: { type: ["string", "null"], description: "Código de estado interno: `1`|`2`|`3`|`4`" },
              links: { description: "JSONB — DocsOut[]; nulo em todos os registos até à data" },
              autores: { type: "array", items: { $ref: "#/components/schemas/Autor" } },
              eventos: { type: "array", items: { $ref: "#/components/schemas/Evento" }, description: "Ordenados por `dataFase` ascendente" },
              relacionadas: { type: "array", items: { $ref: "#/components/schemas/Relacionada" } },
              anexos: { type: "array", items: { type: "object" }, description: "Anexos da iniciativa (nome e URL)" },
              conjuntas: { type: "array", items: { type: "object" }, description: "Iniciativas discutidas em conjunto" },
              peticoes: { type: "array", items: { type: "object" }, description: "Petições associadas à iniciativa" },
              propostasAlteracao: {
                type: "array",
                items: { type: "object" },
                description: "Propostas de alteração, cada uma com as suas `publicacoes`",
              },
            },
          },
        ],
      },
      PaginatedIniciativas: {
        type: "object",
        properties: {
          data: { type: "array", items: { $ref: "#/components/schemas/Iniciativa" } },
          total: { type: "integer" },
          page: { type: "integer" },
          limit: { type: "integer" },
        },
      },
      VotacaoList: {
        allOf: [
          { $ref: "#/components/schemas/Votacao" },
          {
            type: "object",
            properties: {
              iniciativaId: { type: "integer" },
              iniciativaTitulo: { type: "string" },
              iniciativaNumero: { type: "string" },
              iniciativaTipo: { type: "string" },
              legislaturaId: { type: "string" },
            },
          },
        ],
      },
      VotacaoDetail: {
        allOf: [
          { $ref: "#/components/schemas/Votacao" },
          {
            type: "object",
            properties: {
              eventoId: { type: "integer" },
              iniciativaId: { type: "integer" },
              iniciativa: {
                type: "object",
                properties: {
                  id: { type: "integer" },
                  titulo: { type: "string" },
                  numero: { type: "string" },
                  tipo: { type: "string" },
                  legislaturaId: { type: "string" },
                },
              },
            },
          },
        ],
      },
      PaginatedVotacoes: {
        type: "object",
        properties: {
          data: { type: "array", items: { $ref: "#/components/schemas/VotacaoList" } },
          total: { type: "integer" },
          page: { type: "integer" },
          limit: { type: "integer" },
        },
      },
      Peticao: {
        type: "object",
        properties: {
          id: { type: "integer" },
          legislaturaId: { type: "string" },
          numero: { type: ["string", "null"] },
          assunto: { type: ["string", "null"] },
          autor: { type: ["string", "null"] },
          dataEntrada: { type: ["string", "null"], format: "date" },
          assinaturas: { type: ["integer", "null"] },
          assinaturasInicial: { type: ["integer", "null"] },
          situacao: { type: ["string", "null"], example: "Admitida" },
          sel: { type: ["string", "null"] },
          obs: { type: ["string", "null"] },
          urlTexto: { type: ["string", "null"] },
          dataDebate: { type: ["string", "null"], format: "date" },
          actividadeId: { type: ["string", "null"], description: "`PetActividadeId` na fonte" },
          updatedAt: { type: "string", format: "date-time", description: "Última alteração ao registo — use com `updated_since`" },
        },
      },
      PeticaoRelator: {
        type: "object",
        properties: {
          id: { type: "integer" },
          nome: { type: ["string", "null"] },
          gp: { type: ["string", "null"] },
          dataNomeacao: { type: ["string", "null"], format: "date" },
          dataCessacao: { type: ["string", "null"], format: "date" },
          motivoCessacao: { type: ["string", "null"] },
        },
      },
      PeticaoComissao: {
        type: "object",
        properties: {
          id: { type: "integer" },
          comissaoId: {
            type: ["integer", "null"],
            description: "FK para `/comissoes` (tabela canónica). Antes de 2026-07 este campo continha o código da fonte, que passou a chamar-se `comissaoCodigo`.",
          },
          comissaoCodigo: { type: ["string", "null"], description: "`IdComissao` na fonte" },
          nome: { type: ["string", "null"] },
          numero: { type: ["string", "null"] },
          legislatura: { type: ["string", "null"] },
          sessao: { type: ["string", "null"] },
          situacao: { type: ["string", "null"] },
          dataAdmissibilidade: { type: ["string", "null"], format: "date" },
          dataArquivo: { type: ["string", "null"], format: "date" },
          dataBaixaComissao: { type: ["string", "null"], format: "date" },
          dataEnvioPar: { type: ["string", "null"], format: "date" },
          dataReaberta: { type: ["string", "null"], format: "date" },
          relatores: { type: "array", items: { $ref: "#/components/schemas/PeticaoRelator" } },
          relatorioFinal: {
            type: "array",
            items: { $ref: "#/components/schemas/PeticaoRelatorioFinal" },
            description: "Relatório final da comissão, com a respectiva votação",
          },
          documentos: {
            type: "array",
            items: { type: "object" },
            description: "Documentos da comissão, tipificados por `tipoRef` (`outros`, `relatorio_final`, `pedido_informacoes`, `resposta_pedido_informacoes`)",
          },
          audicoes: { type: "array", items: { type: "object" }, description: "Audições e audiências, distinguidas por `fonte`" },
          pedidosInformacao: { type: "array", items: { type: "object" }, description: "Pedidos de informação a entidades externas" },
        },
      },
      PeticaoRelatorioFinal: {
        type: "object",
        properties: {
          id: { type: "integer" },
          data: { type: ["string", "null"], format: "date" },
          votacaoData: { type: ["string", "null"], format: "date" },
          resultado: { type: ["string", "null"], example: "Aprovado" },
          unanime: { type: ["boolean", "null"] },
          reuniao: { type: ["string", "null"] },
          tipoReuniao: { type: ["string", "null"] },
          descricao: { type: ["string", "null"] },
          detalhe: { type: ["string", "null"], description: "HTML original da votação, de onde derivam os arrays seguintes" },
          aFavor: { type: "array", items: { type: "string" } },
          contra: { type: "array", items: { type: "string" } },
          abstencao: { type: "array", items: { type: "string" } },
          ausencias: { type: "array", items: { type: "string" } },
        },
      },
      PeticaoDocumento: {
        type: "object",
        properties: {
          id: { type: "integer" },
          nome: { type: ["string", "null"] },
          url: { type: ["string", "null"] },
        },
      },
      PeticaoDetail: {
        allOf: [
          { $ref: "#/components/schemas/Peticao" },
          {
            type: "object",
            properties: {
              comissoes: { type: "array", items: { $ref: "#/components/schemas/PeticaoComissao" } },
              documentos: { type: "array", items: { $ref: "#/components/schemas/PeticaoDocumento" } },
              publicacoes: { type: "array", items: { type: "object" }, description: "Referências ao Diário da AR" },
              relacionadas: {
                type: "array",
                items: { type: "object" },
                description: "Petições associadas e iniciativas conjuntas/originadas, distinguidas por `tipo`",
              },
            },
          },
        ],
      },
      PaginatedPeticoes: {
        type: "object",
        properties: {
          data: { type: "array", items: { $ref: "#/components/schemas/Peticao" } },
          total: { type: "integer" },
          page: { type: "integer" },
          limit: { type: "integer" },
        },
      },
    },
  },
};
