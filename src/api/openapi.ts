export const spec = {
  openapi: "3.1.0",
  info: {
    title: "openAR API",
    version: "0.1.0",
    description:
      "API de dados abertos da Assembleia da República. " +
      "Os dados são publicados pelo programa AR dados abertos e actualizados diariamente.",
    license: { name: "MIT", url: "https://opensource.org/licenses/MIT" },
    contact: { url: "https://openar.pt" },
  },
  servers: [{ url: "https://api.openar.pt", description: "Produção" }],
  tags: [
    { name: "Meta", description: "Metadados para popular filtros (legislaturas, grupos, tipos)" },
    { name: "Legislaturas", description: "Legislaturas da Assembleia da República" },
    { name: "Deputados", description: "Deputados e os seus mandatos" },
    { name: "Iniciativas", description: "Iniciativas legislativas (projectos de lei, resoluções, etc.)" },
    { name: "Votações", description: "Votações em plenário" },
    { name: "Petições", description: "Petições à Assembleia da República" },
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
                    grupos: { type: "array", items: { type: "string" }, example: ["BE", "CH", "CDS-PP", "IL", "L", "PAN", "PCP", "PS", "PSD"] },
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
                    estados: { type: "array", items: { type: "string" }, example: ["Aprovado", "Caducado", "Rejeitado"] },
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
        responses: {
          "200": {
            description: "Array of legislature objects",
            content: {
              "application/json": {
                schema: { type: "array", items: { $ref: "#/components/schemas/Legislatura" } },
              },
            },
          },
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
          { $ref: "#/components/parameters/page" },
          { $ref: "#/components/parameters/limit" },
        ],
        responses: {
          "200": {
            description: "Lista paginada de deputados",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/PaginatedDeputados" },
              },
            },
          },
        },
      },
    },
    "/deputados/{id}/foto": {
      get: {
        operationId: "getDeputadoFoto",
        tags: ["Deputados"],
        summary: "Foto oficial do deputado",
        description: "Proxy da foto oficial do parlamento.pt. Cached 7 dias no servidor — o cliente nunca contacta o parlamento directamente.",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" }, description: "Identificador do deputado (DepCadId)" }],
        responses: {
          "200": { description: "Imagem PNG/JPEG", content: { "image/png": {}, "image/jpeg": {} } },
          "404": { $ref: "#/components/responses/NotFound" },
        },
      },
    },
    "/deputados/{id}": {
      get: {
        operationId: "getDeputado",
        tags: ["Deputados"],
        summary: "Obter um deputado com todos os mandatos",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" }, description: "Identificador do deputado (DepCadId)" }],
        responses: {
          "200": {
            description: "Deputado com array de mandatos",
            content: { "application/json": { schema: { $ref: "#/components/schemas/DeputadoDetail" } } },
          },
          "404": { $ref: "#/components/responses/NotFound" },
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
                    gpa: { type: "array", description: "Grupos parlamentares ad hoc", items: { type: "object" } },
                    dle: { type: "array", description: "Declarações de limitação de exercício", items: { type: "object" } },
                    relIni: { type: "array", description: "Iniciativas relatadas", items: { type: "object" } },
                    relPet: { type: "array", description: "Petições relatadas", items: { type: "object" } },
                    relIniEur: { type: "array", description: "Iniciativas europeias relatadas", items: { type: "object" } },
                    relPareceres: { type: "array", description: "Pareceres emitidos", items: { type: "object" } },
                    parlJovens: { type: "array", description: "Participação no Parlamento dos Jovens", items: { type: "object" } },
                  },
                },
              },
            },
          },
          "404": { $ref: "#/components/responses/NotFound" },
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
            schema: { type: "string", enum: ["R", "P", "J", "D", "S", "A", "I", "C"] },
            description: "`R` Resolução · `P` Proposta de Lei · `J` Projeto de Lei · `D` Decreto · `S` Outros · `A` Apreciação · `I` Iniciativa Europeia · `C` Pergunta/Requerimento",
          },
          { name: "estado", in: "query", schema: { type: "array", items: { type: "string" } }, style: "form", explode: true, description: "Fase actual — pode repetir para múltiplos valores (ex: `?estado=Aprovado&estado=Rejeitado`)" },
          { name: "grupo", in: "query", schema: { type: "string" }, description: "Filtrar por sigla do grupo parlamentar autor" },
          {
            name: "resultado",
            in: "query",
            schema: { type: "string", enum: ["aprovado", "rejeitado", "pendente"] },
            description: "`aprovado` — tem ≥1 votação Aprovado · `rejeitado` — tem ≥1 votação Rejeitado · `pendente` — sem votações registadas",
          },
          { name: "dataEntradaDe", in: "query", schema: { type: "string", format: "date" }, description: "Data de entrada mínima, inclusive (AAAA-MM-DD)" },
          { name: "dataEntradaAte", in: "query", schema: { type: "string", format: "date" }, description: "Data de entrada máxima, inclusive (AAAA-MM-DD)" },
          { name: "deputado", in: "query", schema: { type: "string" }, description: "Filtrar por autor deputado — aceita ID numérico ou nome parlamentar (pesquisa parcial, case-insensitive)" },
          { name: "q", in: "query", schema: { type: "string" }, description: "Pesquisa no título" },
          { $ref: "#/components/parameters/page" },
          { $ref: "#/components/parameters/limit" },
        ],
        responses: {
          "200": {
            description: "Lista paginada de iniciativas",
            content: { "application/json": { schema: { $ref: "#/components/schemas/PaginatedIniciativas" } } },
          },
        },
      },
    },
    "/iniciativas/{id}": {
      get: {
        operationId: "getIniciativa",
        tags: ["Iniciativas"],
        summary: "Obter uma iniciativa com detalhe completo",
        description: "Devolve a iniciativa com `autores`, `eventos` (cada um com `votacoes` e `publicacoes`) e `relacionadas`.",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" }, description: "Identificador da iniciativa (IniId)" }],
        responses: {
          "200": {
            description: "Iniciativa completa",
            content: { "application/json": { schema: { $ref: "#/components/schemas/IniciativaDetail" } } },
          },
          "404": { $ref: "#/components/responses/NotFound" },
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
          { name: "q", in: "query", schema: { type: "string" }, description: "Pesquisa no assunto" },
          { $ref: "#/components/parameters/page" },
          { $ref: "#/components/parameters/limit" },
        ],
        responses: {
          "200": {
            description: "Lista paginada de petições",
            content: { "application/json": { schema: { $ref: "#/components/schemas/PaginatedPeticoes" } } },
          },
        },
      },
    },
    "/peticoes/{id}": {
      get: {
        operationId: "getPeticao",
        tags: ["Petições"],
        summary: "Obter uma petição com comissões e documentos",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" }, description: "Identificador da petição" }],
        responses: {
          "200": {
            description: "Petição com comissões (e relatores) e documentos",
            content: { "application/json": { schema: { $ref: "#/components/schemas/PeticaoDetail" } } },
          },
          "400": { description: "ID inválido", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          "404": { $ref: "#/components/responses/NotFound" },
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
          { name: "resultado", in: "query", schema: { type: "string", enum: ["Aprovado", "Rejeitado"] }, description: "Resultado da votação" },
          { name: "unanime", in: "query", schema: { type: "boolean" }, description: "Filtrar votações unânimes" },
          { name: "data_inicio", in: "query", schema: { type: "string", format: "date" }, description: "Data de início, inclusive (AAAA-MM-DD)" },
          { name: "data_fim", in: "query", schema: { type: "string", format: "date" }, description: "Data de fim, inclusive (AAAA-MM-DD)" },
          { $ref: "#/components/parameters/page" },
          { $ref: "#/components/parameters/limit" },
        ],
        responses: {
          "200": {
            description: "Lista paginada de votações com metadados da iniciativa",
            content: { "application/json": { schema: { $ref: "#/components/schemas/PaginatedVotacoes" } } },
          },
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
          "400": { description: "iniciativa_id não fornecido", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          "404": { $ref: "#/components/responses/NotFound" },
        },
      },
    },
  },
  components: {
    parameters: {
      legislaturaId: { name: "id", in: "path" as const, required: true, schema: { type: "string" }, description: "Identificador da legislatura (ex: `XVII`, `XIII`, `Constituinte`)" },
      page: { name: "page", in: "query" as const, schema: { type: "integer", default: 1, minimum: 1 } },
      limit: { name: "limit", in: "query" as const, schema: { type: "integer", default: 50, minimum: 1, maximum: 200 } },
    },
    responses: {
      NotFound: {
        description: "Recurso não encontrado",
        content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
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
          id: { type: "string", example: "XVII" },
          nome: { type: "string", example: "XVII Legislatura" },
          dataInicio: { type: "string", format: "date", example: "2025-06-03" },
          dataFim: { type: ["string", "null"], format: "date", description: "null para a legislatura em curso" },
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
      DeputadoDetail: {
        type: "object",
        properties: {
          id: { type: "integer" },
          depId: { type: ["integer", "null"] },
          nomeParlamentar: { type: "string" },
          nomeCompleto: { type: "string" },
          mandatos: { type: "array", items: { $ref: "#/components/schemas/Mandato" } },
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
          tipo: { type: "string", enum: ["R", "P", "J", "D", "S", "A", "I", "C"] },
          tipoDesc: { type: "string", example: "Proposta de Lei" },
          titulo: { type: "string" },
          epigrafe: { type: ["string", "null"] },
          dataEntrada: { type: ["string", "null"], format: "date" },
          dataFim: { type: ["string", "null"], format: "date" },
          estado: { type: ["string", "null"], example: "Aprovado" },
          linkTexto: { type: ["string", "null"], description: "URL para o texto integral em PDF" },
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
          resultado: { type: "string", enum: ["Aprovado", "Rejeitado"] },
          unanime: { type: "boolean" },
          reuniao: { type: ["string", "null"] },
          tipoReuniao: { type: ["string", "null"], example: "RP" },
          descricao: { type: ["string", "null"] },
          aFavor: { type: "array", items: { type: "string" }, description: "Siglas dos grupos que votaram a favor" },
          contra: { type: "array", items: { type: "string" }, description: "Siglas dos grupos que votaram contra" },
          abstencao: { type: "array", items: { type: "string" }, description: "Siglas dos grupos que se abstiveram" },
          ausencias: { type: "array", items: { type: "string" } },
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
          iniciativasConjuntas: { description: "JSONB — iniciativas conjuntas, quando aplicável" },
          votacoes: { type: "array", items: { $ref: "#/components/schemas/Votacao" } },
          publicacoes: { type: "array", items: { $ref: "#/components/schemas/Publicacao" } },
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
            properties: {
              textoSubstituido: { type: "boolean" },
              obs: { type: ["string", "null"] },
              autores: { type: "array", items: { $ref: "#/components/schemas/Autor" } },
              eventos: { type: "array", items: { $ref: "#/components/schemas/Evento" } },
              relacionadas: { type: "array", items: { $ref: "#/components/schemas/Relacionada" } },
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
          comissaoId: { type: ["string", "null"] },
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
