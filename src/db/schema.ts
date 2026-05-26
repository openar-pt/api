import {
  pgTable,
  text,
  integer,
  boolean,
  date,
  serial,
  jsonb,
  timestamp,
  index,
  uniqueIndex,
  primaryKey,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ── Comissões (canonical master table) ───────────────────────────────────────

export const comissoes = pgTable(
  "comissoes",
  {
    id:    serial("id").primaryKey(),
    nome:  text("nome").notNull(),   // canonical: trim() of source nome
    sigla: text("sigla"),
  },
  (t) => [
    uniqueIndex("uq_comissoes_nome").on(t.nome),
  ]
);

// ── Legislaturas ─────────────────────────────────────────────────────────────

export const legislaturas = pgTable("legislaturas", {
  id: text("id").primaryKey(),        // "Constituinte", "I", "II", ..., "XVII"
  nome: text("nome").notNull(),
  dataInicio: date("data_inicio"),
  dataFim: date("data_fim"),          // null = legislatura activa
  arId: text("ar_id"),               // DetalheLegislatura.id — AR internal numeric ID (e.g. "107")
  siglaAntiga: text("sigla_antiga"),  // DetalheLegislatura.siglaAntiga
});

// ── Sessões Legislativas ──────────────────────────────────────────────────────

export const sessoesLegislativas = pgTable(
  "sessoes_legislativas",
  {
    id: serial("id").primaryKey(),
    legislaturaId: text("legislatura_id").notNull().references(() => legislaturas.id),
    numSessao: text("num_sessao"),    // SessaoLegislativaOut.numSessao
    dataInicio: date("data_inicio"),  // SessaoLegislativaOut.dataInicio
    dataFim: date("data_fim"),        // SessaoLegislativaOut.dataFim
  },
  (t) => [index("idx_sessoes_legislatura").on(t.legislaturaId)]
);

// ── Grupos Parlamentares ──────────────────────────────────────────────────────

export const gruposParlamentares = pgTable(
  "grupos_parlamentares",
  {
    id: serial("id").primaryKey(),
    legislaturaId: text("legislatura_id").notNull().references(() => legislaturas.id),
    sigla: text("sigla").notNull(),
    nome: text("nome").notNull(),
  },
  (t) => [uniqueIndex("uq_gp_legislatura_sigla").on(t.legislaturaId, t.sigla)]
);

// ── Círculos Eleitorais ───────────────────────────────────────────────────────

export const circulosEleitorais = pgTable(
  "circulos_eleitorais",
  {
    id: serial("id").primaryKey(),
    legislaturaId: text("legislatura_id").notNull().references(() => legislaturas.id),
    cpId: integer("cp_id").notNull(),   // DepCPId cast from float
    nome: text("nome").notNull(),       // DepCPDes
  },
  (t) => [uniqueIndex("uq_circulo_legislatura").on(t.legislaturaId, t.cpId)]
);

// ── Deputados ─────────────────────────────────────────────────────────────────

export const deputados = pgTable("deputados", {
  id: integer("id").primaryKey(),         // DepCadId cast from float
  depId: integer("dep_id"),               // DepId (id interno diferente do DepCadId)
  nomeCompleto: text("nome_completo").notNull(),
  nomeParlamentar: text("nome_parlamentar").notNull(),
  videos: jsonb("videos"),                // DadosVideo[] (tipo, url) — always null so far
  dataNascimento: date("data_nascimento"),
  sexo: text("sexo"),
  profissao: text("profissao"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// ── Registo Biográfico ────────────────────────────────────────────────────────

export const bioHabilitacoes = pgTable("bio_habilitacoes", {
  id: serial("id").primaryKey(),
  deputadoId: integer("deputado_id").notNull().references(() => deputados.id),
  habId: integer("hab_id"),
  descricao: text("descricao"),
  estado: text("estado"),
  tipoId: integer("tipo_id"),
}, (t) => [index("idx_bio_hab_dep").on(t.deputadoId)]);

export const bioTitulos = pgTable("bio_titulos", {
  id: serial("id").primaryKey(),
  deputadoId: integer("deputado_id").notNull().references(() => deputados.id),
  titId: integer("tit_id"),
  descricao: text("descricao"),
  ordem: integer("ordem"),
}, (t) => [index("idx_bio_tit_dep").on(t.deputadoId)]);

export const bioCargosFuncoes = pgTable("bio_cargos_funcoes", {
  id: serial("id").primaryKey(),
  deputadoId: integer("deputado_id").notNull().references(() => deputados.id),
  funId: integer("fun_id"),
  descricao: text("descricao"),
  antiga: boolean("antiga"),
  ordem: integer("ordem"),
}, (t) => [index("idx_bio_cargos_dep").on(t.deputadoId)]);

export const bioCondecoracoes = pgTable("bio_condecoracoes", {
  id: serial("id").primaryKey(),
  deputadoId: integer("deputado_id").notNull().references(() => deputados.id),
  codId: integer("cod_id"),
  descricao: text("descricao"),
  ordem: integer("ordem"),
}, (t) => [index("idx_bio_cond_dep").on(t.deputadoId)]);

export const bioObrasPublicadas = pgTable("bio_obras_publicadas", {
  id: serial("id").primaryKey(),
  deputadoId: integer("deputado_id").notNull().references(() => deputados.id),
  pubId: integer("pub_id"),
  descricao: text("descricao"),
  ordem: integer("ordem"),
}, (t) => [index("idx_bio_obras_dep").on(t.deputadoId)]);

// ── Mandatos ──────────────────────────────────────────────────────────────────

export const mandatos = pgTable(
  "mandatos",
  {
    id: serial("id").primaryKey(),
    deputadoId: integer("deputado_id").notNull().references(() => deputados.id),
    legislaturaId: text("legislatura_id").notNull().references(() => legislaturas.id),
    grupoParlamentar: text("grupo_parlamentar"),  // gpSigla
    gpId: integer("gp_id"),                       // DadosSituacaoGP.gpId (AR internal ID)
    circuloEleitoral: text("circulo_eleitoral"),  // DepCPDes
    dataInicio: date("data_inicio"),              // gpDtInicio
    dataFim: date("data_fim"),                    // gpDtFim
    situacao: text("situacao"),                   // sioDes of first DepSituacao entry (summary)
  },
  (t) => [
    index("idx_mandatos_deputado").on(t.deputadoId),
    index("idx_mandatos_legislatura").on(t.legislaturaId),
    index("idx_mandatos_grupo").on(t.grupoParlamentar),
  ]
);

// ── Cargos de Deputados ───────────────────────────────────────────────────────
// DadosCargoDeputado[] — positions held (e.g. "Secretário"), only 13 deputies in XVI

export const deputadoCargos = pgTable(
  "deputado_cargos",
  {
    id: serial("id").primaryKey(),
    deputadoId: integer("deputado_id").notNull().references(() => deputados.id),
    legislaturaId: text("legislatura_id").notNull().references(() => legislaturas.id),
    carId: integer("car_id"),          // DadosCargoDeputado.carId
    carDes: text("car_des"),           // DadosCargoDeputado.carDes (e.g. "Secretário")
    carDtInicio: date("car_dt_inicio"),// DadosCargoDeputado.carDtInicio
    carDtFim: date("car_dt_fim"),      // DadosCargoDeputado.carDtFim
  },
  (t) => [
    index("idx_dep_cargos_deputado").on(t.deputadoId),
    index("idx_dep_cargos_legislatura").on(t.legislaturaId),
  ]
);

// ── Situações de Deputados ────────────────────────────────────────────────────
// DadosSituacaoDeputados[] — full status history per deputy per legislature
// (109 deputies have multiple entries in XVI; mandatos.situacao only keeps first)

export const deputadoSituacoes = pgTable(
  "deputado_situacoes",
  {
    id: serial("id").primaryKey(),
    deputadoId: integer("deputado_id").notNull().references(() => deputados.id),
    legislaturaId: text("legislatura_id").notNull().references(() => legislaturas.id),
    sioDes: text("sio_des"),          // DadosSituacaoDeputados.sioDes (e.g. "Efetivo", "Suplente")
    sioDtInicio: date("sio_dt_inicio"),
    sioDtFim: date("sio_dt_fim"),
  },
  (t) => [
    index("idx_dep_situacoes_deputado").on(t.deputadoId),
    index("idx_dep_situacoes_legislatura").on(t.legislaturaId),
  ]
);

// ── Iniciativas ───────────────────────────────────────────────────────────────

export const iniciativas = pgTable(
  "iniciativas",
  {
    id: integer("id").primaryKey(),         // IniId cast from float/int
    legislaturaId: text("legislatura_id").notNull().references(() => legislaturas.id),
    numero: text("numero").notNull(),       // IniNr
    tipo: text("tipo").notNull(),           // "R", "J", "P", "D", "S", "A", "I", "C", "F"
    tipoDesc: text("tipo_desc").notNull(),  // "Projeto de Resolução", etc.
    titulo: text("titulo").notNull(),
    epigrafe: text("epigrafe"),
    dataEntrada: date("data_entrada"),      // DataInicioleg
    dataFim: date("data_fim"),
    estado: text("estado"),                 // Fase do último evento
    linkTexto: text("link_texto"),
    textoSubstituido: boolean("texto_substituido").default(false), // IniTextoSubst = "SIM"
    textoSubstCampo: text("texto_subst_campo"),  // IniTextoSubstCampo (~7% fill, XII+)
    obs: text("obs"),                       // IniObs
    sel: text("sel"),                       // IniSel: internal state code "1"|"2"|"3"|"4"
    links: jsonb("links"),                  // DocsOut[] — always null so far
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("idx_iniciativas_legislatura").on(t.legislaturaId),
    index("idx_iniciativas_tipo").on(t.tipo),
    index("idx_iniciativas_estado").on(t.estado),
    index("idx_iniciativas_data").on(t.dataEntrada),
    index("idx_iniciativas_updated_at").on(t.updatedAt),
  ]
);

// ── Autores de Iniciativas ────────────────────────────────────────────────────

export const autoresIniciativas = pgTable(
  "autores_iniciativas",
  {
    id: serial("id").primaryKey(),
    iniciativaId: integer("iniciativa_id").notNull().references(() => iniciativas.id),
    tipo: text("tipo").notNull(),           // "deputado" | "grupo" | "governo" | "outro" | "comissao"
    deputadoId: integer("deputado_id"),
    grupoParlamentar: text("grupo_parlamentar"),
    nome: text("nome"),
  },
  (t) => [
    index("idx_autores_iniciativa").on(t.iniciativaId),
    index("idx_autores_grupo").on(t.grupoParlamentar),
    index("idx_autores_deputado").on(t.deputadoId),
  ]
);

// ── Eventos ───────────────────────────────────────────────────────────────────

export const eventos = pgTable(
  "eventos",
  {
    id: serial("id").primaryKey(),
    iniciativaId: integer("iniciativa_id").notNull().references(() => iniciativas.id),
    oevId: text("oev_id"),                  // OevId
    evtId: text("evt_id"),                  // EvtId
    fase: text("fase").notNull(),
    codigoFase: text("codigo_fase"),        // CodigoFase
    dataFase: date("data_fase"),
    obs: text("obs"),                       // ObsFase
    actId: text("act_id"),                  // ActId
    oevTextId: text("oev_text_id"),         // OevTextId — same as textosAprovados
    recursoDeputados: text("recurso_deputados").array(), // RecursoDeputados (XIII+)
    recursoGp: text("recurso_gp").array(),              // RecursoGP (XIII+)
    textosAprovados: text("textos_aprovados"),           // string ID, e.g. "21302"
    // Unknown/empty structure — stored as JSONB until data appears
    actividadesConjuntas: jsonb("actividades_conjuntas"),  // ActividadesConjuntas
    pcpublicasConjuntas: jsonb("pcpublicas_conjuntas"),    // PcpublicasConjuntas
    links: jsonb("links"),                                 // DocsOut[] — always null so far
  },
  (t) => [
    index("idx_eventos_iniciativa").on(t.iniciativaId),
    index("idx_eventos_fase").on(t.fase),
  ]
);

// ── Votações ──────────────────────────────────────────────────────────────────

export const votacoes = pgTable(
  "votacoes",
  {
    id: text("id").notNull(),               // id único por iniciativa
    eventoId: integer("evento_id").notNull().references(() => eventos.id),
    iniciativaId: integer("iniciativa_id").notNull().references(() => iniciativas.id),
    data: date("data"),
    resultado: text("resultado").notNull(), // "Aprovado" | "Rejeitado"
    unanime: boolean("unanime").default(false),
    reuniao: text("reuniao"),
    tipoReuniao: text("tipo_reuniao"),      // "RP" (Reunião Plenária)
    descricao: text("descricao"),
    detalhe: text("detalhe"),              // raw HTML — source of aFavor/contra/abstencao
    aFavor: text("a_favor").array(),
    contra: text("contra").array(),
    abstencao: text("abstencao").array(),
    ausencias: text("ausencias").array(),
  },
  (t) => [
    primaryKey({ columns: [t.iniciativaId, t.id] }),
    index("idx_votacoes_data").on(t.data),
    index("idx_votacoes_resultado").on(t.resultado),
    index("idx_votacoes_evento").on(t.eventoId),
  ]
);

// ── Publicações de Votações ───────────────────────────────────────────────────
// Votacao[].publicacao[] — publication refs for each plenary vote

export const votacaoPublicacoes = pgTable(
  "votacao_publicacoes",
  {
    id: serial("id").primaryKey(),
    votacaoIniId: integer("votacao_ini_id").notNull().references(() => iniciativas.id),
    votacaoId: text("votacao_id").notNull(),
    eventoId: integer("evento_id").notNull().references(() => eventos.id),
    data: date("data"),
    legislatura: text("legislatura"),
    numero: text("numero"),
    sessaoLegislativa: text("sessao_legislativa"),
    tipo: text("tipo"),
    pubTp: text("pub_tp"),
    paginas: text("paginas").array(),
    supl: text("supl"),
    pagFinalDiarioSupl: text("pag_final_diario_supl"),
    urlDiario: text("url_diario"),
    idPag: text("id_pag"),
    idDeb: text("id_deb"),
    idInt: text("id_int"),
    idAct: text("id_act"),
    debateDtReu: text("debate_dt_reu"),
    obs: text("obs"),
  },
  (t) => [
    index("idx_votacao_pub_votacao").on(t.votacaoIniId, t.votacaoId),
    index("idx_votacao_pub_evento").on(t.eventoId),
  ]
);

// ── Publicações (DAR) ─────────────────────────────────────────────────────────
// IniEventos[].PublicacaoFase[]

export const publicacoes = pgTable(
  "publicacoes",
  {
    id: serial("id").primaryKey(),
    eventoId: integer("evento_id").notNull().references(() => eventos.id),
    iniciativaId: integer("iniciativa_id").notNull().references(() => iniciativas.id),
    data: date("data"),                     // pubdt
    legislatura: text("legislatura"),       // pubLeg
    numero: text("numero"),                 // pubNr
    sessaoLegislativa: text("sessao_legislativa"), // pubSL
    tipo: text("tipo"),                     // pubTipo: "DAR I série", "DAR II série A", etc.
    pubTp: text("pub_tp"),                  // Single-letter code: "D","A","B","H",...
    paginas: text("paginas").array(),       // pag: ["92-92"]
    supl: text("supl"),                     // e.g. "2º Supl."
    pagFinalDiarioSupl: text("pag_final_diario_supl"),
    urlDiario: text("url_diario"),          // URLDiario
    idPag: text("id_pag"),
    idDeb: text("id_deb"),
    idInt: text("id_int"),                  // Intervention ID (debate publications)
    idAct: text("id_act"),
    debateDtReu: text("debate_dt_reu"),
    obs: text("obs"),
  },
  (t) => [
    index("idx_publicacoes_evento").on(t.eventoId),
    index("idx_publicacoes_iniciativa").on(t.iniciativaId),
  ]
);

// ── Relações entre Iniciativas ────────────────────────────────────────────────

export const iniciativasRelacionadas = pgTable(
  "iniciativas_relacionadas",
  {
    id: serial("id").primaryKey(),
    iniciativaId: integer("iniciativa_id").notNull().references(() => iniciativas.id),
    tipo: text("tipo").notNull(),           // "origem" | "originada" | "peticao" | "europeia"
    relId: text("rel_id"),
    relLegislatura: text("rel_legislatura"),
    relNumero: text("rel_numero"),
    relSessao: text("rel_sessao"),          // sessao da iniciativa relacionada
    relTipo: text("rel_tipo"),
    relDescTipo: text("rel_desc_tipo"),     // descrição do tipo (e.g. "Projeto de Resolução")
    relAssunto: text("rel_assunto"),
    relDcl: jsonb("rel_dcl"),              // Iniciativas_DadosGeraisOut.dcl — always null so far
    urlEuropeia: text("url_europeia"),
  },
  (t) => [index("idx_rel_iniciativa").on(t.iniciativaId)]
);

// ── Iniciativas Conjuntas ─────────────────────────────────────────────────────
// IniEventos[].IniciativasConjuntas[] — initiatives debated jointly in the same event

export const iniciativasConjuntas = pgTable(
  "iniciativas_conjuntas",
  {
    id: serial("id").primaryKey(),
    eventoId: integer("evento_id").notNull().references(() => eventos.id),
    iniciativaId: integer("iniciativa_id").notNull().references(() => iniciativas.id),
    conjuntaId: text("conjunta_id"),        // id
    conjuntaLeg: text("conjunta_leg"),      // leg
    conjuntaNr: text("conjunta_nr"),        // nr
    conjuntaTipo: text("conjunta_tipo"),    // tipo
    conjuntaDescTipo: text("conjunta_desc_tipo"), // descTipo
    conjuntaTitulo: text("conjunta_titulo"), // titulo
    conjuntaSel: text("conjunta_sel"),      // sel
    conjuntaDataEntrada: date("conjunta_data_entrada"), // dataEntrada
  },
  (t) => [
    index("idx_iniciativas_conjuntas_evento").on(t.eventoId),
    index("idx_iniciativas_conjuntas_iniciativa").on(t.iniciativaId),
    index("idx_iniciativas_conjuntas_conjunta_id").on(t.conjuntaId),
  ]
);

// ── Petições Conjuntas ────────────────────────────────────────────────────────
// IniEventos[].PeticoesConjuntas[] — petitions discussed jointly with this initiative

export const peticoesConjuntas = pgTable(
  "peticoes_conjuntas",
  {
    id: serial("id").primaryKey(),
    eventoId: integer("evento_id").notNull().references(() => eventos.id),
    iniciativaId: integer("iniciativa_id").notNull().references(() => iniciativas.id),
    peticaoId: text("peticao_id"),          // id
    peticaoLeg: text("peticao_leg"),        // leg
    peticaoNr: text("peticao_nr"),          // nr
    peticaoTipo: text("peticao_tipo"),      // tipo
    peticaoDescTipo: text("peticao_desc_tipo"), // descTipo
    peticaoTitulo: text("peticao_titulo"),  // titulo
    peticaoSel: text("peticao_sel"),        // sel
    peticaoDataEntrada: date("peticao_data_entrada"), // dataEntrada
  },
  (t) => [
    index("idx_peticoes_conjuntas_evento").on(t.eventoId),
    index("idx_peticoes_conjuntas_iniciativa").on(t.iniciativaId),
  ]
);

// ── Anexos ────────────────────────────────────────────────────────────────────
// IniAnexos[] (eventoId null) + IniEventos[].AnexosFase[] (eventoId set, XII–XIV)

export const anexos = pgTable(
  "anexos",
  {
    id: serial("id").primaryKey(),
    iniciativaId: integer("iniciativa_id").notNull().references(() => iniciativas.id),
    eventoId: integer("evento_id").references(() => eventos.id),
    nome: text("nome"),
    url: text("url"),
  },
  (t) => [
    index("idx_anexos_iniciativa").on(t.iniciativaId),
    index("idx_anexos_evento").on(t.eventoId),
  ]
);

// ── Comissões em Fase ─────────────────────────────────────────────────────────
// IniEventos[].Comissao[] — one row per committee assigned to an event

export const comissoesFases = pgTable(
  "comissoes_fases",
  {
    id: serial("id").primaryKey(),
    comissaoId: integer("comissao_id").references(() => comissoes.id),  // FK to canonical comissoes table
    eventoId: integer("evento_id").notNull().references(() => eventos.id),
    iniciativaId: integer("iniciativa_id").notNull().references(() => iniciativas.id),
    accId: text("acc_id"),              // AccId
    sigla: text("sigla"),               // Sigla
    nome: text("nome"),                 // Nome
    numero: text("numero"),             // Numero / IdComissao
    sessao: text("sessao"),             // Sessao
    legislatura: text("legislatura"),   // Legislatura (rarely set)
    competente: boolean("competente"),  // Competente === "S"
    observacao: text("observacao"),
    prorrogado: text("prorrogado"),
    dataEntrada: date("data_entrada"),
    dataRemessa: date("data_remessa"),                  // DataRemessa (top-level, not the sub-table)
    dataRelatorio: date("data_relatorio"),
    dataDistribuicao: date("data_distribuicao"),
    dataInicioApreciacaoPublica: date("data_inicio_apreciacao_publica"),
    dataFimApreciacaoPublica: date("data_fim_apreciacao_publica"),
    dataAgendamentoPlenario: date("data_agendamento_plenario"),
    dataAgendamentoDiscussao: date("data_agendamento_discussao"),
    dataReqAgendamentoPlenario: date("data_req_agendamento_plenario"),
    aguardaAgendamentoPlenario: text("aguarda_agendamento_plenario"),
    gpAgendamentoPlenario: text("gp_agendamento_plenario"),
    motivoNaoParecer: text("motivo_nao_parecer"),
    dataMotivoNaoParecer: date("data_motivo_nao_parecer"),
    remessaRedacaoFinal: text("remessa_redacao_final"),
    distribuicaoSubcomissao: jsonb("distribuicao_subcomissao"), // ComissoesOut[] — list of subcommittees
    dataDistribuicaoSubcomissao: date("data_distribuicao_subcomissao"), // typo in source: DataDistruibuicaoSubcomissao
    pedidosParecer: jsonb("pedidos_parecer"),             // unknown structure, always null so far
    pareceresRecebidos: jsonb("pareceres_recebidos"),     // unknown structure, always null so far
  },
  (t) => [
    index("idx_comissoes_fases_comissao").on(t.comissaoId),
    index("idx_comissoes_fases_evento").on(t.eventoId),
    index("idx_comissoes_fases_iniciativa").on(t.iniciativaId),
    index("idx_comissoes_fases_numero").on(t.numero),
  ]
);

// ── Votações em Comissão ──────────────────────────────────────────────────────
// Comissao[].Votacao[] — committee-level votes (distinct from plenary votes)

export const comissaoVotacoes = pgTable(
  "comissao_votacoes",
  {
    id: serial("id").primaryKey(),
    comissaoFaseId: integer("comissao_fase_id").notNull().references(() => comissoesFases.id, { onDelete: "cascade" }),
    eventoId: integer("evento_id").notNull().references(() => eventos.id),
    iniciativaId: integer("iniciativa_id").notNull().references(() => iniciativas.id),
    votacaoId: text("votacao_id"),      // id field
    data: date("data"),
    resultado: text("resultado"),
    unanime: boolean("unanime"),
    reuniao: text("reuniao"),
    tipoReuniao: text("tipo_reuniao"),
    descricao: text("descricao"),
    detalhe: text("detalhe"),           // raw HTML — source of aFavor/contra/abstencao
    aFavor: text("a_favor").array(),
    contra: text("contra").array(),
    abstencao: text("abstencao").array(),
    ausencias: text("ausencias").array(),
  },
  (t) => [
    index("idx_comissao_votacoes_fase").on(t.comissaoFaseId),
    index("idx_comissao_votacoes_iniciativa").on(t.iniciativaId),
    index("idx_comissao_votacoes_data").on(t.data),
  ]
);

// ── Publicações de Votações em Comissão ───────────────────────────────────────
// Comissao[].Votacao[].publicacao[] — always null so far but spec includes it

export const comissaoVotacaoPublicacoes = pgTable(
  "comissao_votacao_publicacoes",
  {
    id: serial("id").primaryKey(),
    comissaoVotacaoId: integer("comissao_votacao_id").notNull().references(() => comissaoVotacoes.id, { onDelete: "cascade" }),
    eventoId: integer("evento_id").notNull().references(() => eventos.id),
    iniciativaId: integer("iniciativa_id").notNull().references(() => iniciativas.id),
    data: date("data"),
    legislatura: text("legislatura"),
    numero: text("numero"),
    sessaoLegislativa: text("sessao_legislativa"),
    tipo: text("tipo"),
    pubTp: text("pub_tp"),
    paginas: text("paginas").array(),
    supl: text("supl"),
    pagFinalDiarioSupl: text("pag_final_diario_supl"),
    urlDiario: text("url_diario"),
    idPag: text("id_pag"),
    idDeb: text("id_deb"),
    idInt: text("id_int"),
    idAct: text("id_act"),
    debateDtReu: text("debate_dt_reu"),
    obs: text("obs"),
  },
  (t) => [index("idx_comissao_votacao_pub_votacao").on(t.comissaoVotacaoId)]
);

// ── Relatores em Comissão ─────────────────────────────────────────────────────
// Comissao[].Relatores[]

export const comissaoRelatores = pgTable(
  "comissao_relatores",
  {
    id: serial("id").primaryKey(),
    comissaoFaseId: integer("comissao_fase_id").notNull().references(() => comissoesFases.id, { onDelete: "cascade" }),
    eventoId: integer("evento_id").notNull().references(() => eventos.id),
    iniciativaId: integer("iniciativa_id").notNull().references(() => iniciativas.id),
    deputadoId: integer("deputado_id"),
    nome: text("nome"),
    grupoParlamentar: text("grupo_parlamentar"),  // gp
    dataNomeacao: date("data_nomeacao"),
    dataCessacao: date("data_cessacao"),
    motivoCessacao: text("motivo_cessacao"),
  },
  (t) => [
    index("idx_comissao_relatores_fase").on(t.comissaoFaseId),
    index("idx_comissao_relatores_deputado").on(t.deputadoId),
    index("idx_comissao_relatores_iniciativa").on(t.iniciativaId),
  ]
);

// ── Documentos em Comissão ────────────────────────────────────────────────────
// Comissao[].Documentos[]

export const comissaoDocumentos = pgTable(
  "comissao_documentos",
  {
    id: serial("id").primaryKey(),
    comissaoFaseId: integer("comissao_fase_id").notNull().references(() => comissoesFases.id, { onDelete: "cascade" }),
    eventoId: integer("evento_id").notNull().references(() => eventos.id),
    iniciativaId: integer("iniciativa_id").notNull().references(() => iniciativas.id),
    url: text("url"),                       // URL
    dataDocumento: date("data_documento"),  // DataDocumento
    tipoDocumento: text("tipo_documento"),  // TipoDocumento: "Parecer", "Relatório", "Outro"
    tituloDocumento: text("titulo_documento"), // TituloDocumento
  },
  (t) => [
    index("idx_comissao_documentos_fase").on(t.comissaoFaseId),
    index("idx_comissao_documentos_iniciativa").on(t.iniciativaId),
  ]
);

// ── Audições em Comissão ──────────────────────────────────────────────────────
// Comissao[].Audicoes[] and Comissao[].Audiencias[] — same structure, different fonte

export const comissaoAudicoes = pgTable(
  "comissao_audicoes",
  {
    id: serial("id").primaryKey(),
    comissaoFaseId: integer("comissao_fase_id").notNull().references(() => comissoesFases.id, { onDelete: "cascade" }),
    eventoId: integer("evento_id").notNull().references(() => eventos.id),
    iniciativaId: integer("iniciativa_id").notNull().references(() => iniciativas.id),
    fonte: text("fonte").notNull(),         // "Audicoes" | "Audiencias"
    audicaoId: text("audicao_id"),          // id
    data: date("data"),
    tipo: text("tipo"),                     // "AUP" (apreciação pública) | "AUD" (audiência)
  },
  (t) => [
    index("idx_comissao_audicoes_fase").on(t.comissaoFaseId),
    index("idx_comissao_audicoes_iniciativa").on(t.iniciativaId),
  ]
);

// ── Remessas em Comissão ──────────────────────────────────────────────────────
// Comissao[].Remessas[]

export const comissaoRemessas = pgTable(
  "comissao_remessas",
  {
    id: serial("id").primaryKey(),
    comissaoFaseId: integer("comissao_fase_id").notNull().references(() => comissoesFases.id, { onDelete: "cascade" }),
    eventoId: integer("evento_id").notNull().references(() => eventos.id),
    iniciativaId: integer("iniciativa_id").notNull().references(() => iniciativas.id),
    dataRemessa: date("data_remessa"),
    observacoes: text("observacoes"),
    tipoRemessa: text("tipo_remessa"),
    numeroOficio: text("numero_oficio"),
    dataDocumento: date("data_documento"),
  },
  (t) => [index("idx_comissao_remessas_fase").on(t.comissaoFaseId)]
);

// ── Publicações em Comissão ───────────────────────────────────────────────────
// Comissao[].Publicacao[] and Comissao[].PublicacaoRelatorio[] — tipoRef distinguishes them

export const comissaoPublicacoes = pgTable(
  "comissao_publicacoes",
  {
    id: serial("id").primaryKey(),
    comissaoFaseId: integer("comissao_fase_id").notNull().references(() => comissoesFases.id, { onDelete: "cascade" }),
    eventoId: integer("evento_id").notNull().references(() => eventos.id),
    iniciativaId: integer("iniciativa_id").notNull().references(() => iniciativas.id),
    tipoRef: text("tipo_ref").notNull(),    // "publicacao" | "relatorio"
    data: date("data"),
    legislatura: text("legislatura"),
    numero: text("numero"),
    sessaoLegislativa: text("sessao_legislativa"),
    tipo: text("tipo"),
    pubTp: text("pub_tp"),
    paginas: text("paginas").array(),
    supl: text("supl"),
    pagFinalDiarioSupl: text("pag_final_diario_supl"),
    urlDiario: text("url_diario"),
    idPag: text("id_pag"),
    idDeb: text("id_deb"),
    idInt: text("id_int"),
    idAct: text("id_act"),
    debateDtReu: text("debate_dt_reu"),
    obs: text("obs"),
  },
  (t) => [
    index("idx_comissao_publicacoes_fase").on(t.comissaoFaseId),
    index("idx_comissao_publicacoes_iniciativa").on(t.iniciativaId),
  ]
);

// ── Intervenções/Debates ──────────────────────────────────────────────────────
// IniEventos[].Intervencoesdebates[] — plenary debate sessions (XIII+, ~57% of iniciativas)

export const intervencoesdebates = pgTable(
  "intervencoesdebates",
  {
    id: serial("id").primaryKey(),
    eventoId: integer("evento_id").notNull().references(() => eventos.id),
    iniciativaId: integer("iniciativa_id").notNull().references(() => iniciativas.id),
    dataReuniao: date("data_reuniao"),      // dataReuniaoPlenaria
  },
  (t) => [
    index("idx_intervencoes_evento").on(t.eventoId),
    index("idx_intervencoes_iniciativa").on(t.iniciativaId),
  ]
);

// ── Oradores ──────────────────────────────────────────────────────────────────
// One row per speaker within a debate session

export const oradores = pgTable(
  "oradores",
  {
    id: serial("id").primaryKey(),
    intervencaoId: integer("intervencao_id").notNull().references(() => intervencoesdebates.id, { onDelete: "cascade" }),
    faseDebate: text("fase_debate"),        // e.g. "GENERALIDADE"
    faseSessao: text("fase_sessao"),        // "P" (Plenário)
    horaInicio: text("hora_inicio"),
    horaTermo: text("hora_termo"),
    sumario: text("sumario"),
    teor: text("teor"),                      // Peticoes_OradoresOut.teor — always null so far
    linkVideos: text("link_videos").array(), // av.parlamento.pt URLs
    deputados: jsonb("deputados"),           // speaker deputy objects (structure varies by leg)
    membroGovernoNome: text("membro_governo_nome"),
    membroGovernoCargo: text("membro_governo_cargo"),
    membroGovernoGoverno: text("membro_governo_governo"),
    convidadoNome: text("convidado_nome"),
    convidadoCargo: text("convidado_cargo"),
    convidadoPais: text("convidado_pais"),
    convidadoHonra: text("convidado_honra"),
  },
  (t) => [index("idx_oradores_intervencao").on(t.intervencaoId)]
);

// ── Publicações de Oradores ───────────────────────────────────────────────────
// oradores[].publicacao[] — DAR publication refs for each speech

export const oradorPublicacoes = pgTable(
  "orador_publicacoes",
  {
    id: serial("id").primaryKey(),
    oradorId: integer("orador_id").notNull().references(() => oradores.id, { onDelete: "cascade" }),
    eventoId: integer("evento_id").notNull().references(() => eventos.id),
    iniciativaId: integer("iniciativa_id").notNull().references(() => iniciativas.id),
    data: date("data"),
    legislatura: text("legislatura"),
    numero: text("numero"),
    sessaoLegislativa: text("sessao_legislativa"),
    tipo: text("tipo"),
    pubTp: text("pub_tp"),
    paginas: text("paginas").array(),
    supl: text("supl"),
    pagFinalDiarioSupl: text("pag_final_diario_supl"),
    urlDiario: text("url_diario"),
    idPag: text("id_pag"),
    idDeb: text("id_deb"),
    idInt: text("id_int"),
    idAct: text("id_act"),
    debateDtReu: text("debate_dt_reu"),
    obs: text("obs"),
  },
  (t) => [
    index("idx_orador_pub_orador").on(t.oradorId),
    index("idx_orador_pub_iniciativa").on(t.iniciativaId),
  ]
);

// ── Propostas de Alteração ────────────────────────────────────────────────────
// PropostasAlteracao[] — amendments, present only in legs II–VII

export const propostasAlteracao = pgTable(
  "propostas_alteracao",
  {
    id: serial("id").primaryKey(),
    iniciativaId: integer("iniciativa_id").notNull().references(() => iniciativas.id),
    propostaId: text("proposta_id"),
    autor: text("autor"),
    tipo: text("tipo"),
  },
  (t) => [index("idx_propostas_iniciativa").on(t.iniciativaId)]
);

// ── Publicações de Propostas de Alteração ────────────────────────────────────
// PropostasAlteracao[].publicacao[]

export const propostaPublicacoes = pgTable(
  "proposta_publicacoes",
  {
    id: serial("id").primaryKey(),
    propostaAlteracaoId: integer("proposta_alteracao_id").notNull().references(() => propostasAlteracao.id, { onDelete: "cascade" }),
    iniciativaId: integer("iniciativa_id").notNull().references(() => iniciativas.id),
    data: date("data"),
    legislatura: text("legislatura"),
    numero: text("numero"),
    sessaoLegislativa: text("sessao_legislativa"),
    tipo: text("tipo"),
    pubTp: text("pub_tp"),
    paginas: text("paginas").array(),
    supl: text("supl"),
    pagFinalDiarioSupl: text("pag_final_diario_supl"),
    urlDiario: text("url_diario"),
    idPag: text("id_pag"),
    idDeb: text("id_deb"),
    idInt: text("id_int"),
    idAct: text("id_act"),
    debateDtReu: text("debate_dt_reu"),
    obs: text("obs"),
  },
  (t) => [
    index("idx_proposta_pub_proposta").on(t.propostaAlteracaoId),
    index("idx_proposta_pub_iniciativa").on(t.iniciativaId),
  ]
);

// ── Petições ──────────────────────────────────────────────────────────────────

export const peticoes = pgTable("peticoes", {
  id: integer("id").primaryKey(),
  legislaturaId: text("legislatura_id").notNull().references(() => legislaturas.id),
  numero: text("numero"),
  assunto: text("assunto"),
  autor: text("autor"),
  dataEntrada: date("data_entrada"),
  assinaturas: integer("assinaturas"),
  assinaturasInicial: integer("assinaturas_inicial"),
  situacao: text("situacao"),
  sel: text("sel"),
  obs: text("obs"),
  urlTexto: text("url_texto"),
  dataDebate: date("data_debate"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index("idx_peticoes_legislatura").on(t.legislaturaId),
  index("idx_peticoes_situacao").on(t.situacao),
  index("idx_peticoes_updated_at").on(t.updatedAt),
]);

export const peticaoComissoes = pgTable("peticao_comissoes", {
  id: serial("id").primaryKey(),
  peticaoId: integer("peticao_id").notNull().references(() => peticoes.id),
  comissaoId: text("comissao_id"),
  nome: text("nome"),
  numero: text("numero"),
  legislatura: text("legislatura"),
  sessao: text("sessao"),
  situacao: text("situacao"),
  dataAdmissibilidade: date("data_admissibilidade"),
  dataArquivo: date("data_arquivo"),
  dataBaixaComissao: date("data_baixa_comissao"),
  dataEnvioPar: date("data_envio_par"),
  dataReaberta: date("data_reaberta"),
}, (t) => [index("idx_peticao_cms_peticao").on(t.peticaoId)]);

export const peticaoRelatores = pgTable("peticao_relatores", {
  id: serial("id").primaryKey(),
  peticaoId: integer("peticao_id").notNull().references(() => peticoes.id),
  peticaoComissaoId: integer("peticao_comissao_id").notNull().references(() => peticaoComissoes.id, { onDelete: "cascade" }),
  nome: text("nome"),
  gp: text("gp"),
  dataNomeacao: date("data_nomeacao"),
  dataCessacao: date("data_cessacao"),
  motivoCessacao: text("motivo_cessacao"),
}, (t) => [index("idx_peticao_rel_peticao").on(t.peticaoId)]);

export const peticaoDocumentos = pgTable("peticao_documentos", {
  id: serial("id").primaryKey(),
  peticaoId: integer("peticao_id").notNull().references(() => peticoes.id),
  dataDocumento: date("data_documento"),
  tipoDocumento: text("tipo_documento"),
  tituloDocumento: text("titulo_documento"),
  url: text("url"),
}, (t) => [index("idx_peticao_doc_peticao").on(t.peticaoId)]);

// ── Atividade dos Deputados ───────────────────────────────────────────────────
// 1:1 mirror of AtividadeDeputado JSON: all sub-arrays per deputy per legislature.
// Each table FK: deputado_id → deputados.id, legislatura_id → legislaturas.id.

export const ativIni = pgTable(
  "ativ_ini",
  {
    id: serial("id").primaryKey(),
    deputadoId: integer("deputado_id").notNull().references(() => deputados.id),
    legislaturaId: text("legislatura_id").notNull().references(() => legislaturas.id),
    iniciativaId: text("iniciativa_id"),
    numero: text("numero"),
    tipo: text("tipo"),
    tipoDesc: text("tipo_desc"),
    legislaturaRef: text("legislatura_ref"),
    numeroRef: text("numero_ref"),
    titulo: text("titulo"),
  },
  (t) => [
    index("idx_ativ_ini_dep").on(t.deputadoId),
    index("idx_ativ_ini_leg").on(t.legislaturaId),
  ]
);

export const ativReq = pgTable(
  "ativ_req",
  {
    id: serial("id").primaryKey(),
    deputadoId: integer("deputado_id").notNull().references(() => deputados.id),
    legislaturaId: text("legislatura_id").notNull().references(() => legislaturas.id),
    requerimentoId: text("requerimento_id"),
    numero: text("numero"),
    tipo: text("tipo"),
    legislatura: text("legislatura"),
    sessaoLegislativa: text("sessao_legislativa"),
    assunto: text("assunto"),
    data: date("data"),
    periodoTipo: text("periodo_tipo"),
  },
  (t) => [index("idx_ativ_req_dep").on(t.deputadoId)]
);

export const ativScgt = pgTable(
  "ativ_scgt",
  {
    id: serial("id").primaryKey(),
    deputadoId: integer("deputado_id").notNull().references(() => deputados.id),
    legislaturaId: text("legislatura_id").notNull().references(() => legislaturas.id),
    comissaoLegislatura: text("comissao_legislatura"),
    comissaoNome: text("comissao_nome"),
    codigo: text("codigo"),
    comissaoCodigo: text("comissao_codigo"),
    cargo: text("cargo"),
    situacao: text("situacao"),
  },
  (t) => [index("idx_ativ_scgt_dep").on(t.deputadoId)]
);

export const ativIntev = pgTable(
  "ativ_intev",
  {
    id: serial("id").primaryKey(),
    deputadoId: integer("deputado_id").notNull().references(() => deputados.id),
    legislaturaId: text("legislatura_id").notNull().references(() => legislaturas.id),
    intervencaoId: text("intervencao_id"),
    texto: text("texto"),
    sumario: text("sumario"),
    publicacaoDar: text("publicacao_dar"),
    dataReuniao: date("data_reuniao"),
    legislatura: text("legislatura"),
    publicacaoNumero: text("publicacao_numero"),
    sessaoLegislativa: text("sessao_legislativa"),
    publicacaoTipo: text("publicacao_tipo"),
    tipoIntervencao: text("tipo_intervencao"),
  },
  (t) => [index("idx_ativ_intev_dep").on(t.deputadoId)]
);

export const ativActp = pgTable(
  "ativ_actp",
  {
    id: serial("id").primaryKey(),
    deputadoId: integer("deputado_id").notNull().references(() => deputados.id),
    legislaturaId: text("legislatura_id").notNull().references(() => legislaturas.id),
    atividadeId: text("atividade_id"),
    numero: text("numero"),
    tipo: text("tipo"),
    tipoDesc: text("tipo_desc"),
    legislaturaRef: text("legislatura_ref"),
    numeroRef: text("numero_ref"),
    dataEntrada: date("data_entrada"),
    dataDebate: date("data_debate"),
    assunto: text("assunto"),
  },
  (t) => [index("idx_ativ_actp_dep").on(t.deputadoId)]
);

export const ativGpa = pgTable(
  "ativ_gpa",
  {
    id: serial("id").primaryKey(),
    deputadoId: integer("deputado_id").notNull().references(() => deputados.id),
    legislaturaId: text("legislatura_id").notNull().references(() => legislaturas.id),
    grupoId: text("grupo_id"),
    nome: text("nome"),
    dataInicio: date("data_inicio"),
    dataFim: date("data_fim"),
    legislatura: text("legislatura"),
    cargo: text("cargo"),
  },
  (t) => [index("idx_ativ_gpa_dep").on(t.deputadoId)]
);

export const ativDlp = pgTable(
  "ativ_dlp",
  {
    id: serial("id").primaryKey(),
    deputadoId: integer("deputado_id").notNull().references(() => deputados.id),
    legislaturaId: text("legislatura_id").notNull().references(() => legislaturas.id),
    delegacaoId: text("delegacao_id"),
    nome: text("nome"),
    legislatura: text("legislatura"),
    numero: text("numero"),
    cargo: text("cargo"),
    reunioes: jsonb("reunioes"),
  },
  (t) => [index("idx_ativ_dlp_dep").on(t.deputadoId)]
);

export const ativDle = pgTable(
  "ativ_dle",
  {
    id: serial("id").primaryKey(),
    deputadoId: integer("deputado_id").notNull().references(() => deputados.id),
    legislaturaId: text("legislatura_id").notNull().references(() => legislaturas.id),
    declaracaoId: text("declaracao_id"),
    local: text("local"),
    numero: text("numero"),
    legislatura: text("legislatura"),
    numeroRef: text("numero_ref"),
    dataFim: date("data_fim"),
    dataInicio: date("data_inicio"),
    tipo: text("tipo"),
  },
  (t) => [index("idx_ativ_dle_dep").on(t.deputadoId)]
);

export const ativRelIni = pgTable(
  "ativ_rel_ini",
  {
    id: serial("id").primaryKey(),
    deputadoId: integer("deputado_id").notNull().references(() => deputados.id),
    legislaturaId: text("legislatura_id").notNull().references(() => legislaturas.id),
    iniciativaId: text("iniciativa_id"),
    numero: text("numero"),
    tipo: text("tipo"),
    legislatura: text("legislatura"),
    titulo: text("titulo"),
    fase: text("fase"),
    dataRelatorio: date("data_relatorio"),
    link: text("link"),
  },
  (t) => [index("idx_ativ_rel_ini_dep").on(t.deputadoId)]
);

export const ativRelPet = pgTable(
  "ativ_rel_pet",
  {
    id: serial("id").primaryKey(),
    deputadoId: integer("deputado_id").notNull().references(() => deputados.id),
    legislaturaId: text("legislatura_id").notNull().references(() => legislaturas.id),
    peticaoId: text("peticao_id"),
    numero: text("numero"),
    legislatura: text("legislatura"),
    numeroRef: text("numero_ref"),
    assunto: text("assunto"),
    dataRelatorio: date("data_relatorio"),
  },
  (t) => [index("idx_ativ_rel_pet_dep").on(t.deputadoId)]
);

export const ativRelContas = pgTable(
  "ativ_rel_contas",
  {
    id: serial("id").primaryKey(),
    deputadoId: integer("deputado_id").notNull().references(() => deputados.id),
    legislaturaId: text("legislatura_id").notNull().references(() => legislaturas.id),
    atividadeId: text("atividade_id"),
    assunto: text("assunto"),
    tipo: text("tipo"),
    tipoCodigo: text("tipo_codigo"),
    legislatura: text("legislatura"),
    anoCivil: text("ano_civil"),
    dataNomeacao: date("data_nomeacao"),
  },
  (t) => [index("idx_ativ_rel_contas_dep").on(t.deputadoId)]
);

export const ativRelIniEur = pgTable(
  "ativ_rel_ini_eur",
  {
    id: serial("id").primaryKey(),
    deputadoId: integer("deputado_id").notNull().references(() => deputados.id),
    legislaturaId: text("legislatura_id").notNull().references(() => legislaturas.id),
    iniciativaId: text("iniciativa_id"),
    referencia: text("referencia"),
    titulo: text("titulo"),
    tipo: text("tipo"),
    dataRelatorio: date("data_relatorio"),
    link: text("link"),
    legislatura: text("legislatura"),
  },
  (t) => [index("idx_ativ_rel_ini_eur_dep").on(t.deputadoId)]
);

export const ativRelPareceres = pgTable(
  "ativ_rel_pareceres",
  {
    id: serial("id").primaryKey(),
    deputadoId: integer("deputado_id").notNull().references(() => deputados.id),
    legislaturaId: text("legislatura_id").notNull().references(() => legislaturas.id),
    legislatura: text("legislatura"),
    assunto: text("assunto"),
    atividadeId: text("atividade_id"),
    data: date("data"),
    tipoCodigo: text("tipo_codigo"),
    tipoDesc: text("tipo_desc"),
  },
  (t) => [index("idx_ativ_rel_pareceres_dep").on(t.deputadoId)]
);

export const ativAtividadesComissao = pgTable(
  "ativ_atividades_comissao",
  {
    id: serial("id").primaryKey(),
    deputadoId: integer("deputado_id").notNull().references(() => deputados.id),
    legislaturaId: text("legislatura_id").notNull().references(() => legislaturas.id),
    fonte: text("fonte").notNull(), // 'Eventos' | 'Audicoes' | 'Audiencias' | 'Deslocacoes'
    atividadeId: text("atividade_id"),
    assunto: text("assunto"),
    dataDeslocacaoInicio: date("data_deslocacao_inicio"),
    dataDeslocacaoFim: date("data_deslocacao_fim"),
    dataEntrada: date("data_entrada"),
    local: text("local"),
    dataAudicao: date("data_audicao"),
    tipo: text("tipo"),
    nomeEntidadeExterna: text("nome_entidade_externa"),
    tipoDesc: text("tipo_desc"),
    numero: text("numero"),
    legislatura: text("legislatura"),
    comissaoNome: text("comissao_nome"),
    comissaoAbreviatura: text("comissao_abreviatura"),
    tipoEvento: text("tipo_evento"),
    sessaoLegislativa: text("sessao_legislativa"),
  },
  (t) => [
    index("idx_ativ_ac_dep").on(t.deputadoId),
    index("idx_ativ_ac_fonte").on(t.fonte),
  ]
);

export const ativCms = pgTable(
  "ativ_cms",
  {
    id: serial("id").primaryKey(),
    comissaoId: integer("comissao_id").references(() => comissoes.id),  // FK to canonical comissoes table (nullable)
    deputadoId: integer("deputado_id").notNull().references(() => deputados.id),
    legislaturaId: text("legislatura_id").notNull().references(() => legislaturas.id),
    codigo: text("codigo"),
    legislatura: text("legislatura"),
    nome: text("nome"),
    cargo: text("cargo"),
    situacao: text("situacao"),
    subCargo: text("sub_cargo"),
  },
  (t) => [
    index("idx_ativ_cms_dep").on(t.deputadoId),
    index("idx_ativ_cms_comissao").on(t.comissaoId),
  ]
);

export const ativDadosLegis = pgTable(
  "ativ_dados_legis",
  {
    id: serial("id").primaryKey(),
    deputadoId: integer("deputado_id").notNull().references(() => deputados.id),
    legislaturaId: text("legislatura_id").notNull().references(() => legislaturas.id),
    nome: text("nome"),
    legislatura: text("legislatura"),
    grupoParlamentar: text("grupo_parlamentar"),
  },
  (t) => [index("idx_ativ_dados_legis_dep").on(t.deputadoId)]
);

export const ativParlJovens = pgTable(
  "ativ_parl_jovens",
  {
    id: serial("id").primaryKey(),
    deputadoId: integer("deputado_id").notNull().references(() => deputados.id),
    legislaturaId: text("legislatura_id").notNull().references(() => legislaturas.id),
    legislatura: text("legislatura"),
    data: date("data"),
    tipoReuniao: text("tipo_reuniao"),
    estabelecimento: text("estabelecimento"),
    circuloEleitoral: text("circulo_eleitoral"),
    sessao: text("sessao"),
  },
  (t) => [index("idx_ativ_parl_jovens_dep").on(t.deputadoId)]
);

// ── Relations (Drizzle) ───────────────────────────────────────────────────────

export const legislaturasRelations = relations(legislaturas, ({ many }) => ({
  mandatos: many(mandatos),
  iniciativas: many(iniciativas),
  grupos: many(gruposParlamentares),
  circulos: many(circulosEleitorais),
  sessoes: many(sessoesLegislativas),
  deputadoCargos: many(deputadoCargos),
  deputadoSituacoes: many(deputadoSituacoes),
}));

export const deputadosRelations = relations(deputados, ({ many }) => ({
  mandatos: many(mandatos),
  autoriasIniciativas: many(autoresIniciativas),
  relatorias: many(comissaoRelatores),
  cargos: many(deputadoCargos),
  situacoes: many(deputadoSituacoes),
  ativIni: many(ativIni),
  ativReq: many(ativReq),
  ativScgt: many(ativScgt),
  ativIntev: many(ativIntev),
  ativActp: many(ativActp),
  ativGpa: many(ativGpa),
  ativDlp: many(ativDlp),
  ativDle: many(ativDle),
  ativRelIni: many(ativRelIni),
  ativRelPet: many(ativRelPet),
  ativRelContas: many(ativRelContas),
  ativRelIniEur: many(ativRelIniEur),
  ativRelPareceres: many(ativRelPareceres),
  ativAtividadesComissao: many(ativAtividadesComissao),
  ativCms: many(ativCms),
  ativDadosLegis: many(ativDadosLegis),
  ativParlJovens: many(ativParlJovens),
  bioHabilitacoes: many(bioHabilitacoes),
  bioTitulos: many(bioTitulos),
  bioCargosFuncoes: many(bioCargosFuncoes),
  bioCondecoracoes: many(bioCondecoracoes),
  bioObrasPublicadas: many(bioObrasPublicadas),
}));

export const sessoesLegislativasRelations = relations(sessoesLegislativas, ({ one }) => ({
  legislatura: one(legislaturas, { fields: [sessoesLegislativas.legislaturaId], references: [legislaturas.id] }),
}));

export const deputadoCargosRelations = relations(deputadoCargos, ({ one }) => ({
  deputado: one(deputados, { fields: [deputadoCargos.deputadoId], references: [deputados.id] }),
  legislatura: one(legislaturas, { fields: [deputadoCargos.legislaturaId], references: [legislaturas.id] }),
}));

export const deputadoSituacoesRelations = relations(deputadoSituacoes, ({ one }) => ({
  deputado: one(deputados, { fields: [deputadoSituacoes.deputadoId], references: [deputados.id] }),
  legislatura: one(legislaturas, { fields: [deputadoSituacoes.legislaturaId], references: [legislaturas.id] }),
}));

export const iniciativasRelations = relations(iniciativas, ({ one, many }) => ({
  legislatura: one(legislaturas, { fields: [iniciativas.legislaturaId], references: [legislaturas.id] }),
  autores: many(autoresIniciativas),
  eventos: many(eventos),
  votacoes: many(votacoes),
  relacionadas: many(iniciativasRelacionadas),
  anexos: many(anexos),
  propostasAlteracao: many(propostasAlteracao),
  intervencoesdebates: many(intervencoesdebates),
  conjuntas: many(iniciativasConjuntas),
  peticoes: many(peticoesConjuntas),
}));

export const eventosRelations = relations(eventos, ({ one, many }) => ({
  iniciativa: one(iniciativas, { fields: [eventos.iniciativaId], references: [iniciativas.id] }),
  votacoes: many(votacoes),
  publicacoes: many(publicacoes),
  anexos: many(anexos),
  intervencoesdebates: many(intervencoesdebates),
  comissoesFases: many(comissoesFases),
  iniciativasConjuntas: many(iniciativasConjuntas),
  peticoesConjuntas: many(peticoesConjuntas),
}));

export const mandatosRelations = relations(mandatos, ({ one }) => ({
  deputado: one(deputados, { fields: [mandatos.deputadoId], references: [deputados.id] }),
  legislatura: one(legislaturas, { fields: [mandatos.legislaturaId], references: [legislaturas.id] }),
}));

export const autoresIniciativasRelations = relations(autoresIniciativas, ({ one }) => ({
  iniciativa: one(iniciativas, { fields: [autoresIniciativas.iniciativaId], references: [iniciativas.id] }),
  deputado: one(deputados, { fields: [autoresIniciativas.deputadoId], references: [deputados.id] }),
}));

export const votacoesRelations = relations(votacoes, ({ one, many }) => ({
  evento: one(eventos, { fields: [votacoes.eventoId], references: [eventos.id] }),
  iniciativa: one(iniciativas, { fields: [votacoes.iniciativaId], references: [iniciativas.id] }),
  publicacoes: many(votacaoPublicacoes),
}));

export const votacaoPublicacoesRelations = relations(votacaoPublicacoes, ({ one }) => ({
  evento: one(eventos, { fields: [votacaoPublicacoes.eventoId], references: [eventos.id] }),
  votacao: one(votacoes, {
    fields: [votacaoPublicacoes.votacaoIniId, votacaoPublicacoes.votacaoId],
    references: [votacoes.iniciativaId, votacoes.id],
  }),
}));

export const publicacoesRelations = relations(publicacoes, ({ one }) => ({
  evento: one(eventos, { fields: [publicacoes.eventoId], references: [eventos.id] }),
  iniciativa: one(iniciativas, { fields: [publicacoes.iniciativaId], references: [iniciativas.id] }),
}));

export const iniciativasRelacionadasRelations = relations(iniciativasRelacionadas, ({ one }) => ({
  iniciativa: one(iniciativas, { fields: [iniciativasRelacionadas.iniciativaId], references: [iniciativas.id] }),
}));

export const iniciativasConjuntasRelations = relations(iniciativasConjuntas, ({ one }) => ({
  evento: one(eventos, { fields: [iniciativasConjuntas.eventoId], references: [eventos.id] }),
  iniciativa: one(iniciativas, { fields: [iniciativasConjuntas.iniciativaId], references: [iniciativas.id] }),
}));

export const peticoesConjuntasRelations = relations(peticoesConjuntas, ({ one }) => ({
  evento: one(eventos, { fields: [peticoesConjuntas.eventoId], references: [eventos.id] }),
  iniciativa: one(iniciativas, { fields: [peticoesConjuntas.iniciativaId], references: [iniciativas.id] }),
}));

export const anexosRelations = relations(anexos, ({ one }) => ({
  iniciativa: one(iniciativas, { fields: [anexos.iniciativaId], references: [iniciativas.id] }),
  evento: one(eventos, { fields: [anexos.eventoId], references: [eventos.id] }),
}));

export const comissoesRelations = relations(comissoes, ({ many }) => ({
  fases: many(comissoesFases),
  membros: many(ativCms),
}));

export const comissoesFasesRelations = relations(comissoesFases, ({ one, many }) => ({
  comissao: one(comissoes, { fields: [comissoesFases.comissaoId], references: [comissoes.id] }),
  evento: one(eventos, { fields: [comissoesFases.eventoId], references: [eventos.id] }),
  iniciativa: one(iniciativas, { fields: [comissoesFases.iniciativaId], references: [iniciativas.id] }),
  votacoes: many(comissaoVotacoes),
  relatores: many(comissaoRelatores),
  documentos: many(comissaoDocumentos),
  audicoes: many(comissaoAudicoes),
  remessas: many(comissaoRemessas),
  publicacoes: many(comissaoPublicacoes),
}));

export const comissaoVotacoesRelations = relations(comissaoVotacoes, ({ one, many }) => ({
  comissaoFase: one(comissoesFases, { fields: [comissaoVotacoes.comissaoFaseId], references: [comissoesFases.id] }),
  evento: one(eventos, { fields: [comissaoVotacoes.eventoId], references: [eventos.id] }),
  publicacoes: many(comissaoVotacaoPublicacoes),
}));

export const comissaoVotacaoPublicacoesRelations = relations(comissaoVotacaoPublicacoes, ({ one }) => ({
  comissaoVotacao: one(comissaoVotacoes, { fields: [comissaoVotacaoPublicacoes.comissaoVotacaoId], references: [comissaoVotacoes.id] }),
}));

export const comissaoRelatorесRelations = relations(comissaoRelatores, ({ one }) => ({
  comissaoFase: one(comissoesFases, { fields: [comissaoRelatores.comissaoFaseId], references: [comissoesFases.id] }),
  deputado: one(deputados, { fields: [comissaoRelatores.deputadoId], references: [deputados.id] }),
}));

export const comissaoDocumentosRelations = relations(comissaoDocumentos, ({ one }) => ({
  comissaoFase: one(comissoesFases, { fields: [comissaoDocumentos.comissaoFaseId], references: [comissoesFases.id] }),
}));

export const comissaoAudicoesRelations = relations(comissaoAudicoes, ({ one }) => ({
  comissaoFase: one(comissoesFases, { fields: [comissaoAudicoes.comissaoFaseId], references: [comissoesFases.id] }),
}));

export const comissaoRemessasRelations = relations(comissaoRemessas, ({ one }) => ({
  comissaoFase: one(comissoesFases, { fields: [comissaoRemessas.comissaoFaseId], references: [comissoesFases.id] }),
}));

export const comissaoPublicacoesRelations = relations(comissaoPublicacoes, ({ one }) => ({
  comissaoFase: one(comissoesFases, { fields: [comissaoPublicacoes.comissaoFaseId], references: [comissoesFases.id] }),
}));

export const intervencoesdebatesRelations = relations(intervencoesdebates, ({ one, many }) => ({
  evento: one(eventos, { fields: [intervencoesdebates.eventoId], references: [eventos.id] }),
  iniciativa: one(iniciativas, { fields: [intervencoesdebates.iniciativaId], references: [iniciativas.id] }),
  oradores: many(oradores),
}));

export const oradoresRelations = relations(oradores, ({ one, many }) => ({
  intervencao: one(intervencoesdebates, { fields: [oradores.intervencaoId], references: [intervencoesdebates.id] }),
  publicacoes: many(oradorPublicacoes),
}));

export const oradorPublicacoesRelations = relations(oradorPublicacoes, ({ one }) => ({
  orador: one(oradores, { fields: [oradorPublicacoes.oradorId], references: [oradores.id] }),
}));

export const propostasAlteracaoRelations = relations(propostasAlteracao, ({ one, many }) => ({
  iniciativa: one(iniciativas, { fields: [propostasAlteracao.iniciativaId], references: [iniciativas.id] }),
  publicacoes: many(propostaPublicacoes),
}));

export const propostaPublicacoesRelations = relations(propostaPublicacoes, ({ one }) => ({
  proposta: one(propostasAlteracao, { fields: [propostaPublicacoes.propostaAlteracaoId], references: [propostasAlteracao.id] }),
  iniciativa: one(iniciativas, { fields: [propostaPublicacoes.iniciativaId], references: [iniciativas.id] }),
}));

export const ativIniRelations = relations(ativIni, ({ one }) => ({
  deputado: one(deputados, { fields: [ativIni.deputadoId], references: [deputados.id] }),
  legislatura: one(legislaturas, { fields: [ativIni.legislaturaId], references: [legislaturas.id] }),
}));

export const ativReqRelations = relations(ativReq, ({ one }) => ({
  deputado: one(deputados, { fields: [ativReq.deputadoId], references: [deputados.id] }),
  legislatura: one(legislaturas, { fields: [ativReq.legislaturaId], references: [legislaturas.id] }),
}));

export const ativScgtRelations = relations(ativScgt, ({ one }) => ({
  deputado: one(deputados, { fields: [ativScgt.deputadoId], references: [deputados.id] }),
  legislatura: one(legislaturas, { fields: [ativScgt.legislaturaId], references: [legislaturas.id] }),
}));

export const ativIntevRelations = relations(ativIntev, ({ one }) => ({
  deputado: one(deputados, { fields: [ativIntev.deputadoId], references: [deputados.id] }),
  legislatura: one(legislaturas, { fields: [ativIntev.legislaturaId], references: [legislaturas.id] }),
}));

export const ativActpRelations = relations(ativActp, ({ one }) => ({
  deputado: one(deputados, { fields: [ativActp.deputadoId], references: [deputados.id] }),
  legislatura: one(legislaturas, { fields: [ativActp.legislaturaId], references: [legislaturas.id] }),
}));

export const ativGpaRelations = relations(ativGpa, ({ one }) => ({
  deputado: one(deputados, { fields: [ativGpa.deputadoId], references: [deputados.id] }),
  legislatura: one(legislaturas, { fields: [ativGpa.legislaturaId], references: [legislaturas.id] }),
}));

export const ativDlpRelations = relations(ativDlp, ({ one }) => ({
  deputado: one(deputados, { fields: [ativDlp.deputadoId], references: [deputados.id] }),
  legislatura: one(legislaturas, { fields: [ativDlp.legislaturaId], references: [legislaturas.id] }),
}));

export const ativDleRelations = relations(ativDle, ({ one }) => ({
  deputado: one(deputados, { fields: [ativDle.deputadoId], references: [deputados.id] }),
  legislatura: one(legislaturas, { fields: [ativDle.legislaturaId], references: [legislaturas.id] }),
}));

export const ativRelIniRelations = relations(ativRelIni, ({ one }) => ({
  deputado: one(deputados, { fields: [ativRelIni.deputadoId], references: [deputados.id] }),
  legislatura: one(legislaturas, { fields: [ativRelIni.legislaturaId], references: [legislaturas.id] }),
}));

export const ativRelPetRelations = relations(ativRelPet, ({ one }) => ({
  deputado: one(deputados, { fields: [ativRelPet.deputadoId], references: [deputados.id] }),
  legislatura: one(legislaturas, { fields: [ativRelPet.legislaturaId], references: [legislaturas.id] }),
}));

export const ativRelContasRelations = relations(ativRelContas, ({ one }) => ({
  deputado: one(deputados, { fields: [ativRelContas.deputadoId], references: [deputados.id] }),
  legislatura: one(legislaturas, { fields: [ativRelContas.legislaturaId], references: [legislaturas.id] }),
}));

export const ativRelIniEurRelations = relations(ativRelIniEur, ({ one }) => ({
  deputado: one(deputados, { fields: [ativRelIniEur.deputadoId], references: [deputados.id] }),
  legislatura: one(legislaturas, { fields: [ativRelIniEur.legislaturaId], references: [legislaturas.id] }),
}));

export const ativRelPareceresRelations = relations(ativRelPareceres, ({ one }) => ({
  deputado: one(deputados, { fields: [ativRelPareceres.deputadoId], references: [deputados.id] }),
  legislatura: one(legislaturas, { fields: [ativRelPareceres.legislaturaId], references: [legislaturas.id] }),
}));

export const ativAtividadesComissaoRelations = relations(ativAtividadesComissao, ({ one }) => ({
  deputado: one(deputados, { fields: [ativAtividadesComissao.deputadoId], references: [deputados.id] }),
  legislatura: one(legislaturas, { fields: [ativAtividadesComissao.legislaturaId], references: [legislaturas.id] }),
}));

export const ativCmsRelations = relations(ativCms, ({ one }) => ({
  comissao: one(comissoes, { fields: [ativCms.comissaoId], references: [comissoes.id] }),
  deputado: one(deputados, { fields: [ativCms.deputadoId], references: [deputados.id] }),
  legislatura: one(legislaturas, { fields: [ativCms.legislaturaId], references: [legislaturas.id] }),
}));

export const ativDadosLegisRelations = relations(ativDadosLegis, ({ one }) => ({
  deputado: one(deputados, { fields: [ativDadosLegis.deputadoId], references: [deputados.id] }),
  legislatura: one(legislaturas, { fields: [ativDadosLegis.legislaturaId], references: [legislaturas.id] }),
}));

export const ativParlJovensRelations = relations(ativParlJovens, ({ one }) => ({
  deputado: one(deputados, { fields: [ativParlJovens.deputadoId], references: [deputados.id] }),
  legislatura: one(legislaturas, { fields: [ativParlJovens.legislaturaId], references: [legislaturas.id] }),
}));

export const peticoesRelations = relations(peticoes, ({ one, many }) => ({
  legislatura: one(legislaturas, { fields: [peticoes.legislaturaId], references: [legislaturas.id] }),
  comissoes: many(peticaoComissoes),
  documentos: many(peticaoDocumentos),
}));

export const peticaoComissoesRelations = relations(peticaoComissoes, ({ one, many }) => ({
  peticao: one(peticoes, { fields: [peticaoComissoes.peticaoId], references: [peticoes.id] }),
  relatores: many(peticaoRelatores),
}));

export const peticaoRelatorесRelations = relations(peticaoRelatores, ({ one }) => ({
  peticao: one(peticoes, { fields: [peticaoRelatores.peticaoId], references: [peticoes.id] }),
  comissao: one(peticaoComissoes, { fields: [peticaoRelatores.peticaoComissaoId], references: [peticaoComissoes.id] }),
}));

export const peticaoDocumentosRelations = relations(peticaoDocumentos, ({ one }) => ({
  peticao: one(peticoes, { fields: [peticaoDocumentos.peticaoId], references: [peticoes.id] }),
}));

export const bioHabilitacoesRelations = relations(bioHabilitacoes, ({ one }) => ({
  deputado: one(deputados, { fields: [bioHabilitacoes.deputadoId], references: [deputados.id] }),
}));

export const bioTitulosRelations = relations(bioTitulos, ({ one }) => ({
  deputado: one(deputados, { fields: [bioTitulos.deputadoId], references: [deputados.id] }),
}));

export const bioCargosFuncoesRelations = relations(bioCargosFuncoes, ({ one }) => ({
  deputado: one(deputados, { fields: [bioCargosFuncoes.deputadoId], references: [deputados.id] }),
}));

export const bioCondecorаcoesRelations = relations(bioCondecoracoes, ({ one }) => ({
  deputado: one(deputados, { fields: [bioCondecoracoes.deputadoId], references: [deputados.id] }),
}));

export const bioObrasPublicadasRelations = relations(bioObrasPublicadas, ({ one }) => ({
  deputado: one(deputados, { fields: [bioObrasPublicadas.deputadoId], references: [deputados.id] }),
}));
