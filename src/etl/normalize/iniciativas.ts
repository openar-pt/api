// Tipos exactos baseados na inspeção dos ficheiros reais (todas as legislaturas II–XVII)

interface RawAutorDeputado {
  GP: string;
  idCadastro: string;   // string numérica
  nome: string;
}

interface RawAutorOutros {
  iniAutorComissao: string | null;
  nome: string;
  sigla: string;
}

interface RawPublicacao {
  debateDtReu: string | null;
  idAct: string | null;
  idDeb: string | null;
  idInt: string | null;
  idPag: string | null;
  obs: string | null;
  pag: string[] | null;
  pagFinalDiarioSupl: string | null;
  pubdt: string;
  pubLeg: string;
  pubNr: string;
  pubSL: string;
  pubTipo: string;
  pubTp: string;
  supl: string | null;
  URLDiario: string;
}

interface RawVotacao {
  ausencias: string[] | null;
  data: string;
  descricao: string | null;
  detalhe: string | null;
  id: string;
  publicacao: RawPublicacao[] | null;
  resultado: string;
  reuniao: string;
  tipoReuniao: string;
  unanime: string | null;
}

interface RawAnexo {
  anexoNome: string;
  anexoFich: string;
}

interface RawOrador {
  faseDebate: string | null;
  faseSessao: string;
  horaInicio: string;
  horaTermo: string;
  sumario: string | null;
  teor: string | null;      // Peticoes_OradoresOut.teor — always null so far in XVII
  linkVideo: { link: string }[] | null;
  deputados: unknown | null;
  membrosGoverno: { nome: string | null; cargo: string | null; governo: string | null } | null;
  convidados: { nome: string | null; cargo: string | null; pais: string | null; honra: string | null } | null;
  publicacao: RawPublicacao[];
}

interface RawIntervencao {
  dataReuniaoPlenaria: string;
  oradores: RawOrador[] | null;
}

interface RawPropostaAlteracao {
  id: string;
  autor: string;
  tipo: string;
  publicacao: RawPublicacao[] | null;
}

interface RawConjunta {
  dataEntrada: string | null;
  descTipo: string | null;
  id: string;
  leg: string;
  nr: string;
  sel: string | null;
  tipo: string | null;
  titulo: string | null;
}

interface RawComissaoVotacao {
  ausencias: string[] | null;
  data: string;
  descricao: string | null;
  detalhe: string | null;
  id: string;
  publicacao: RawPublicacao[] | null;
  resultado: string;
  reuniao: string;
  tipoReuniao: string | null;
  unanime: string | null;
}

interface RawComissaoRelator {
  dataCessacao: string | null;
  dataNomeacao: string | null;
  gp: string;
  id: string;        // deputado cadastro id
  motivoCessacao: string | null;
  nome: string;
}

interface RawComissaoDocumento {
  URL: string;
  DataDocumento: string | null;
  TipoDocumento: string | null;
  TituloDocumento: string | null;
}

interface RawComissaoAudicao {
  id: string;
  data: string | null;
  tipo: string;
}

interface RawComissaoRemessa {
  dataRemessa: string | null;
  observacoes: string | null;
  tipoRemessa: string | null;
  numeroOficio: string | null;
  dataDocumento: string | null;
}

interface RawComissao {
  AccId: string | null;
  AguardaAgendamentoPlenario: unknown | null;
  Audicoes: RawComissaoAudicao[] | null;
  Audiencias: RawComissaoAudicao[] | null;
  Competente: string | null;             // "S" = lead committee
  DataAgendamentoDiscussao: string | null;
  DataAgendamentoPlenario: string | null;
  DataDistribuicao: string | null;
  DataDistruibuicaoSubcomissao: string | null; // source typo preserved
  DataEntrada: string | null;
  DataMotivoNaoParecer: string | null;
  DataRelatorio: string | null;
  DataRemessa: string | null;
  DataReqAgendamentoPlenario: string | null;
  DatafimApreciacaoPublica: string | null;
  DatainicioApreciacaoPublica: string | null;
  DistribuicaoSubcomissao: RawSubcomissao[] | null;
  Documentos: RawComissaoDocumento[] | null;
  GpAgendamentoPlenario: string | null;
  IdComissao: string | null;
  Legislatura: string | null;
  MotivoNaoParecer: string | null;
  Nome: string | null;
  Numero: string | null;
  Observacao: string | null;
  PareceresRecebidos: unknown | null;
  PedidosParecer: unknown | null;
  Prorrogado: string | null;
  Publicacao: RawPublicacao[] | null;
  PublicacaoRelatorio: RawPublicacao[] | null;
  Relatores: RawComissaoRelator[] | null;
  RemessaRedaccaoFinal: string | null;
  Remessas: RawComissaoRemessa[] | null;
  Sessao: string | null;
  Sigla: string | null;
  Votacao: RawComissaoVotacao[] | null;
}

interface RawEvento {
  ActId: string | null;
  ActividadesConjuntas: unknown | null;
  AnexosFase: RawAnexo[] | null;
  CodigoFase: string;
  Comissao: RawComissao[] | null;
  DataFase: string;
  EvtId: string;
  Fase: string;
  IniciativasConjuntas: RawConjunta[] | null;
  Intervencoesdebates: RawIntervencao[] | null;
  Links: unknown | null;   // DocsOut[] — always null so far
  ObsFase: string | null;
  OevId: string;
  OevTextId: string | null;
  PcpublicasConjuntas: unknown | null;
  PeticoesConjuntas: RawConjunta[] | null;
  PublicacaoFase: RawPublicacao[] | null;
  RecursoDeputados: string[] | null;
  RecursoGP: string[] | null;
  TextosAprovados: string | null;
  Votacao: RawVotacao[] | null;
}

interface RawSubcomissao {
  leg: string | null;
  nome: string | null;
  num: string | null;
  orgId: string | null;
  publicacao: RawPublicacao[] | null;
  sigla: string | null;
}

interface RawRelacionada {
  assunto: string | null;
  dcl: unknown | null;     // Iniciativas_DadosGeraisOut.dcl — always null so far
  descTipo: string | null;
  id: string;
  legislatura: string;
  numero: string;
  sessao: string;
  tipo: string | null;
}

interface RawIniciativa {
  DataFimleg: string | null;
  DataInicioleg: string | null;
  IniAnexos: RawAnexo[] | null;
  IniAutorDeputados: RawAutorDeputado[] | null;
  IniAutorGruposParlamentares: { GP: string }[] | null;
  IniAutorOutros: RawAutorOutros | null;
  IniciativasEuropeias: string[] | null;
  IniciativasOrigem: RawRelacionada[] | null;
  IniciativasOriginadas: RawRelacionada[] | null;
  IniDescTipo: string;
  IniEpigrafe: string | null;
  IniEventos: RawEvento[] | null;
  IniId: number;
  IniLeg: string;
  IniLinkTexto: string | null;
  IniNr: string;
  IniObs: string | null;
  IniSel: number;
  IniTextoSubst: string | null;
  IniTextoSubstCampo: string | null;
  IniTipo: string;
  IniTitulo: string;
  Links: unknown | null;   // DocsOut[] — always null so far
  Peticoes: RawRelacionada[] | null;
  PropostasAlteracao: RawPropostaAlteracao[] | null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function toDate(s: string | null | undefined): string | null {
  if (!s) return null;
  // Guard against the source's "0001-01-01T00:00:00" sentinel
  if (s.startsWith("0001-")) return null;
  return s.slice(0, 10);
}

export function parseDetalhe(html: string | null): {
  aFavor: string[];
  contra: string[];
  abstencao: string[];
} {
  const empty = { aFavor: [] as string[], contra: [] as string[], abstencao: [] as string[] };
  if (!html) return empty;

  const extract = (s: string) =>
    [...s.matchAll(/<I>([^<]+)<\/I>/gi)].map((m) => m[1].trim()).filter(Boolean);

  const lines = html.replace(/<BR>/gi, "\n").split("\n");
  const result = { ...empty };

  for (const line of lines) {
    const low = line.toLowerCase();
    if (low.includes("a favor")) result.aFavor = extract(line);
    else if (low.includes("contra")) result.contra = extract(line);
    else if (low.includes("absten")) result.abstencao = extract(line);
  }

  return result;
}

function normalizePublicacao(pub: RawPublicacao) {
  return {
    data: toDate(pub.pubdt),
    legislatura: pub.pubLeg || null,
    numero: pub.pubNr || null,
    sessaoLegislativa: pub.pubSL || null,
    tipo: pub.pubTipo || null,
    pubTp: pub.pubTp || null,
    paginas: pub.pag ?? [],
    supl: pub.supl || null,
    pagFinalDiarioSupl: pub.pagFinalDiarioSupl || null,
    urlDiario: pub.URLDiario,
    idPag: pub.idPag || null,
    idDeb: pub.idDeb || null,
    idInt: pub.idInt || null,
    idAct: pub.idAct || null,
    debateDtReu: pub.debateDtReu || null,
    obs: pub.obs || null,
  };
}

function estadoFromEventos(eventos: RawEvento[] | null): string | null {
  if (!eventos) return null;
  for (let i = eventos.length - 1; i >= 0; i--) {
    if (eventos[i].Fase) return eventos[i].Fase;
  }
  return null;
}

// ── Normalização ──────────────────────────────────────────────────────────────

export function normalizeIniciativa(raw: RawIniciativa) {
  return {
    id: raw.IniId,
    legislaturaId: raw.IniLeg,
    numero: raw.IniNr,
    tipo: raw.IniTipo,
    tipoDesc: raw.IniDescTipo,
    titulo: raw.IniTitulo.trim(),
    epigrafe: raw.IniEpigrafe?.trim() || null,
    dataEntrada: toDate(raw.DataInicioleg),
    dataFim: toDate(raw.DataFimleg),
    estado: estadoFromEventos(raw.IniEventos),
    linkTexto: raw.IniLinkTexto || null,
    textoSubstituido: raw.IniTextoSubst === "SIM",
    textoSubstCampo: raw.IniTextoSubstCampo || null,
    obs: raw.IniObs || null,
    sel: raw.IniSel != null ? String(raw.IniSel) : null,
    links: raw.Links ?? null,
  };
}

export function normalizeAutores(raw: RawIniciativa) {
  const autores: {
    iniciativaId: number;
    tipo: string;
    deputadoId: number | null;
    grupoParlamentar: string | null;
    nome: string | null;
  }[] = [];

  for (const dep of raw.IniAutorDeputados ?? []) {
    autores.push({
      iniciativaId: raw.IniId,
      tipo: "deputado",
      deputadoId: parseInt(dep.idCadastro, 10) || null,
      grupoParlamentar: dep.GP || null,
      nome: dep.nome || null,
    });
  }

  for (const gp of raw.IniAutorGruposParlamentares ?? []) {
    autores.push({
      iniciativaId: raw.IniId,
      tipo: "grupo",
      deputadoId: null,
      grupoParlamentar: gp.GP,
      nome: gp.GP,
    });
  }

  const outro = raw.IniAutorOutros;
  if (outro) {
    const tipo =
      outro.sigla === "GOV" || outro.nome?.toLowerCase().includes("governo")
        ? "governo"
        : outro.iniAutorComissao
        ? "comissao"
        : "outro";
    autores.push({
      iniciativaId: raw.IniId,
      tipo,
      deputadoId: null,
      grupoParlamentar: null,
      nome: outro.nome || outro.sigla,
    });
  }

  return autores;
}

export function normalizeEventos(raw: RawIniciativa) {
  const eventos: {
    iniciativaId: number;
    oevId: string;
    evtId: string;
    fase: string;
    codigoFase: string | null;
    dataFase: string | null;
    obs: string | null;
    actId: string | null;
    oevTextId: string | null;
    recursoDeputados: string[];
    recursoGp: string[];
    textosAprovados: string | null;
    actividadesConjuntas: unknown;
    pcpublicasConjuntas: unknown;
    links: unknown;
  }[] = [];

  const votacoes: {
    id: string;
    iniciativaId: number;
    eventoOevId: string;
    eventoEvtId: string;
    data: string | null;
    resultado: string;
    unanime: boolean;
    reuniao: string | null;
    tipoReuniao: string | null;
    descricao: string | null;
    detalhe: string | null;
    aFavor: string[];
    contra: string[];
    abstencao: string[];
    ausencias: string[];
  }[] = [];

  const votacaoPublicacoes: {
    votacaoIniId: number;
    votacaoId: string;
    eventoOevId: string;
    eventoEvtId: string;
    pub: ReturnType<typeof normalizePublicacao>;
  }[] = [];

  const publicacoes: {
    iniciativaId: number;
    eventoOevId: string;
    eventoEvtId: string;
    data: string | null;
    legislatura: string | null;
    numero: string | null;
    sessaoLegislativa: string | null;
    tipo: string | null;
    pubTp: string | null;
    paginas: string[];
    supl: string | null;
    pagFinalDiarioSupl: string | null;
    urlDiario: string;
    idPag: string | null;
    idDeb: string | null;
    idInt: string | null;
    idAct: string | null;
    debateDtReu: string | null;
    obs: string | null;
  }[] = [];

  const intervencoes: {
    iniciativaId: number;
    eventoOevId: string;
    eventoEvtId: string;
    dataReuniao: string | null;
    oradores: {
      faseDebate: string | null;
      faseSessao: string;
      horaInicio: string;
      horaTermo: string;
      sumario: string | null;
      teor: string | null;
      linkVideos: string[];
      deputados: unknown | null;
      membroGovernoNome: string | null;
      membroGovernoCargo: string | null;
      membroGovernoGoverno: string | null;
      convidadoNome: string | null;
      convidadoCargo: string | null;
      convidadoPais: string | null;
      convidadoHonra: string | null;
      publicacoes: ReturnType<typeof normalizePublicacao>[];
    }[];
  }[] = [];

  const anexosFase: {
    iniciativaId: number;
    eventoOevId: string;
    eventoEvtId: string;
    nome: string;
    url: string;
  }[] = [];

  const iniciativasConjuntas: {
    eventoOevId: string;
    eventoEvtId: string;
    iniciativaId: number;
    conjuntaId: string;
    conjuntaLeg: string;
    conjuntaNr: string;
    conjuntaTipo: string | null;
    conjuntaDescTipo: string | null;
    conjuntaTitulo: string | null;
    conjuntaSel: string | null;
    conjuntaDataEntrada: string | null;
  }[] = [];

  const peticoesConjuntas: {
    eventoOevId: string;
    eventoEvtId: string;
    iniciativaId: number;
    peticaoId: string;
    peticaoLeg: string;
    peticaoNr: string;
    peticaoTipo: string | null;
    peticaoDescTipo: string | null;
    peticaoTitulo: string | null;
    peticaoSel: string | null;
    peticaoDataEntrada: string | null;
  }[] = [];

  // comissoes: one entry per RawComissao per event
  const comissoesFases: {
    eventoOevId: string;
    eventoEvtId: string;
    iniciativaId: number;
    accId: string | null;
    sigla: string | null;
    nome: string | null;
    numero: string | null;
    sessao: string | null;
    legislatura: string | null;
    competente: boolean | null;
    observacao: string | null;
    prorrogado: string | null;
    dataEntrada: string | null;
    dataRemessa: string | null;
    dataRelatorio: string | null;
    dataDistribuicao: string | null;
    dataInicioApreciacaoPublica: string | null;
    dataFimApreciacaoPublica: string | null;
    dataAgendamentoPlenario: string | null;
    dataAgendamentoDiscussao: string | null;
    dataReqAgendamentoPlenario: string | null;
    aguardaAgendamentoPlenario: string | null;
    gpAgendamentoPlenario: string | null;
    motivoNaoParecer: string | null;
    dataMotivoNaoParecer: string | null;
    remessaRedacaoFinal: string | null;
    distribuicaoSubcomissao: RawSubcomissao[] | null;
    dataDistribuicaoSubcomissao: string | null;
    pedidosParecer: unknown;
    pareceresRecebidos: unknown;
    // child arrays resolved after eventoId/faseId are known
    _votacoes: {
      votacaoId: string | null;
      data: string | null;
      resultado: string | null;
      unanime: boolean | null;
      reuniao: string | null;
      tipoReuniao: string | null;
      descricao: string | null;
      detalhe: string | null;
      aFavor: string[];
      contra: string[];
      abstencao: string[];
      ausencias: string[];
      _publicacoes: ReturnType<typeof normalizePublicacao>[];
    }[];
    _relatores: {
      deputadoId: number | null;
      nome: string | null;
      grupoParlamentar: string | null;
      dataNomeacao: string | null;
      dataCessacao: string | null;
      motivoCessacao: string | null;
    }[];
    _documentos: {
      url: string | null;
      dataDocumento: string | null;
      tipoDocumento: string | null;
      tituloDocumento: string | null;
    }[];
    _audicoes: {
      fonte: string;
      audicaoId: string | null;
      data: string | null;
      tipo: string | null;
    }[];
    _remessas: {
      dataRemessa: string | null;
      observacoes: string | null;
      tipoRemessa: string | null;
      numeroOficio: string | null;
      dataDocumento: string | null;
    }[];
    _publicacoes: { tipoRef: string; pub: ReturnType<typeof normalizePublicacao> }[];
  }[] = [];

  for (const ev of raw.IniEventos ?? []) {
    eventos.push({
      iniciativaId: raw.IniId,
      oevId: ev.OevId,
      evtId: ev.EvtId,
      fase: ev.Fase,
      codigoFase: ev.CodigoFase || null,
      dataFase: toDate(ev.DataFase),
      obs: ev.ObsFase || null,
      actId: ev.ActId || null,
      oevTextId: ev.OevTextId || null,
      recursoDeputados: ev.RecursoDeputados ?? [],
      recursoGp: ev.RecursoGP ?? [],
      textosAprovados: ev.TextosAprovados || null,
      actividadesConjuntas: ev.ActividadesConjuntas ?? null,
      pcpublicasConjuntas: ev.PcpublicasConjuntas ?? null,
      links: ev.Links ?? null,
    });

    for (const vot of ev.Votacao ?? []) {
      const { aFavor, contra, abstencao } = parseDetalhe(vot.detalhe);
      votacoes.push({
        id: vot.id,
        iniciativaId: raw.IniId,
        eventoOevId: ev.OevId,
        eventoEvtId: ev.EvtId,
        data: toDate(vot.data),
        resultado: vot.resultado,
        unanime: vot.unanime === "unanime",
        reuniao: vot.reuniao || null,
        tipoReuniao: vot.tipoReuniao || null,
        descricao: vot.descricao || null,
        detalhe: vot.detalhe || null,
        aFavor,
        contra,
        abstencao,
        ausencias: vot.ausencias ?? [],
      });

      for (const pub of vot.publicacao ?? []) {
        votacaoPublicacoes.push({
          votacaoIniId: raw.IniId,
          votacaoId: vot.id,
          eventoOevId: ev.OevId,
          eventoEvtId: ev.EvtId,
          pub: normalizePublicacao(pub),
        });
      }
    }

    for (const pub of ev.PublicacaoFase ?? []) {
      publicacoes.push({
        iniciativaId: raw.IniId,
        eventoOevId: ev.OevId,
        eventoEvtId: ev.EvtId,
        ...normalizePublicacao(pub),
      });
    }

    for (const intv of ev.Intervencoesdebates ?? []) {
      intervencoes.push({
        iniciativaId: raw.IniId,
        eventoOevId: ev.OevId,
        eventoEvtId: ev.EvtId,
        dataReuniao: toDate(intv.dataReuniaoPlenaria),
        oradores: (intv.oradores ?? []).map((o) => ({
          faseDebate: o.faseDebate ?? null,
          faseSessao: o.faseSessao,
          horaInicio: o.horaInicio,
          horaTermo: o.horaTermo,
          sumario: o.sumario ?? null,
          teor: o.teor ?? null,
          linkVideos: (o.linkVideo ?? []).map((lv) => lv.link),
          deputados: o.deputados ?? null,
          membroGovernoNome: o.membrosGoverno?.nome ?? null,
          membroGovernoCargo: o.membrosGoverno?.cargo ?? null,
          membroGovernoGoverno: o.membrosGoverno?.governo ?? null,
          convidadoNome: o.convidados?.nome ?? null,
          convidadoCargo: o.convidados?.cargo ?? null,
          convidadoPais: o.convidados?.pais ?? null,
          convidadoHonra: o.convidados?.honra ?? null,
          publicacoes: (o.publicacao ?? []).map(normalizePublicacao),
        })),
      });
    }

    for (const anx of ev.AnexosFase ?? []) {
      anexosFase.push({
        iniciativaId: raw.IniId,
        eventoOevId: ev.OevId,
        eventoEvtId: ev.EvtId,
        nome: anx.anexoNome,
        url: anx.anexoFich,
      });
    }

    for (const ic of ev.IniciativasConjuntas ?? []) {
      iniciativasConjuntas.push({
        eventoOevId: ev.OevId,
        eventoEvtId: ev.EvtId,
        iniciativaId: raw.IniId,
        conjuntaId: ic.id,
        conjuntaLeg: ic.leg,
        conjuntaNr: ic.nr,
        conjuntaTipo: ic.tipo || null,
        conjuntaDescTipo: ic.descTipo || null,
        conjuntaTitulo: ic.titulo || null,
        conjuntaSel: ic.sel || null,
        conjuntaDataEntrada: toDate(ic.dataEntrada),
      });
    }

    for (const pc of ev.PeticoesConjuntas ?? []) {
      peticoesConjuntas.push({
        eventoOevId: ev.OevId,
        eventoEvtId: ev.EvtId,
        iniciativaId: raw.IniId,
        peticaoId: pc.id,
        peticaoLeg: pc.leg,
        peticaoNr: pc.nr,
        peticaoTipo: pc.tipo || null,
        peticaoDescTipo: pc.descTipo || null,
        peticaoTitulo: pc.titulo || null,
        peticaoSel: pc.sel || null,
        peticaoDataEntrada: toDate(pc.dataEntrada),
      });
    }

    for (const c of ev.Comissao ?? []) {
      const cvotacoes = (c.Votacao ?? []).map((v) => {
        const { aFavor, contra, abstencao } = parseDetalhe(v.detalhe);
        return {
          votacaoId: v.id || null,
          data: toDate(v.data),
          resultado: v.resultado || null,
          unanime: v.unanime != null ? v.unanime === "unanime" : null,
          reuniao: v.reuniao || null,
          tipoReuniao: v.tipoReuniao || null,
          descricao: v.descricao || null,
          detalhe: v.detalhe || null,
          aFavor,
          contra,
          abstencao,
          ausencias: v.ausencias ?? [],
          _publicacoes: (v.publicacao ?? []).map(normalizePublicacao),
        };
      });

      const audicoes = [
        ...(c.Audicoes ?? []).map((a) => ({ fonte: "Audicoes", audicaoId: a.id || null, data: toDate(a.data), tipo: a.tipo || null })),
        ...(c.Audiencias ?? []).map((a) => ({ fonte: "Audiencias", audicaoId: a.id || null, data: toDate(a.data), tipo: a.tipo || null })),
      ];

      comissoesFases.push({
        eventoOevId: ev.OevId,
        eventoEvtId: ev.EvtId,
        iniciativaId: raw.IniId,
        accId: c.AccId || null,
        sigla: c.Sigla || null,
        nome: c.Nome || null,
        numero: c.Numero || c.IdComissao || null,
        sessao: c.Sessao || null,
        legislatura: c.Legislatura || null,
        competente: c.Competente != null ? c.Competente === "S" : null,
        observacao: c.Observacao || null,
        prorrogado: c.Prorrogado || null,
        dataEntrada: toDate(c.DataEntrada),
        dataRemessa: toDate(c.DataRemessa),
        dataRelatorio: toDate(c.DataRelatorio),
        dataDistribuicao: toDate(c.DataDistribuicao),
        dataInicioApreciacaoPublica: toDate(c.DatainicioApreciacaoPublica),
        dataFimApreciacaoPublica: toDate(c.DatafimApreciacaoPublica),
        dataAgendamentoPlenario: toDate(c.DataAgendamentoPlenario),
        dataAgendamentoDiscussao: toDate(c.DataAgendamentoDiscussao),
        dataReqAgendamentoPlenario: toDate(c.DataReqAgendamentoPlenario),
        aguardaAgendamentoPlenario: c.AguardaAgendamentoPlenario != null ? String(c.AguardaAgendamentoPlenario) : null,
        gpAgendamentoPlenario: c.GpAgendamentoPlenario || null,
        motivoNaoParecer: c.MotivoNaoParecer || null,
        dataMotivoNaoParecer: toDate(c.DataMotivoNaoParecer),
        remessaRedacaoFinal: c.RemessaRedaccaoFinal || null,
        distribuicaoSubcomissao: c.DistribuicaoSubcomissao ?? null,
        dataDistribuicaoSubcomissao: toDate(c.DataDistruibuicaoSubcomissao),
        pedidosParecer: c.PedidosParecer ?? null,
        pareceresRecebidos: c.PareceresRecebidos ?? null,
        _votacoes: cvotacoes,
        _relatores: (c.Relatores ?? []).map((r) => ({
          deputadoId: parseInt(r.id, 10) || null,
          nome: r.nome || null,
          grupoParlamentar: r.gp || null,
          dataNomeacao: toDate(r.dataNomeacao),
          dataCessacao: toDate(r.dataCessacao),
          motivoCessacao: r.motivoCessacao || null,
        })),
        _documentos: (c.Documentos ?? []).map((d) => ({
          url: d.URL || null,
          dataDocumento: toDate(d.DataDocumento),
          tipoDocumento: d.TipoDocumento || null,
          tituloDocumento: d.TituloDocumento || null,
        })),
        _audicoes: audicoes,
        _remessas: (c.Remessas ?? []).map((r) => ({
          dataRemessa: toDate(r.dataRemessa),
          observacoes: r.observacoes || null,
          tipoRemessa: r.tipoRemessa || null,
          numeroOficio: r.numeroOficio || null,
          dataDocumento: toDate(r.dataDocumento),
        })),
        _publicacoes: [
          ...(c.Publicacao ?? []).map((p) => ({ tipoRef: "publicacao" as const, pub: normalizePublicacao(p) })),
          ...(c.PublicacaoRelatorio ?? []).map((p) => ({ tipoRef: "relatorio" as const, pub: normalizePublicacao(p) })),
        ],
      });
    }
  }

  return { eventos, votacoes, votacaoPublicacoes, publicacoes, intervencoes, anexosFase, iniciativasConjuntas, peticoesConjuntas, comissoesFases };
}

export function normalizeAnexos(raw: RawIniciativa) {
  return (raw.IniAnexos ?? []).map((a) => ({
    iniciativaId: raw.IniId,
    eventoId: null as null,
    nome: a.anexoNome,
    url: a.anexoFich,
  }));
}

export function normalizePropostasAlteracao(raw: RawIniciativa) {
  const propostas: {
    iniciativaId: number;
    propostaId: string | null;
    autor: string | null;
    tipo: string | null;
    publicacoes: ReturnType<typeof normalizePublicacao>[];
  }[] = [];

  for (const p of raw.PropostasAlteracao ?? []) {
    propostas.push({
      iniciativaId: raw.IniId,
      propostaId: p.id || null,
      autor: p.autor || null,
      tipo: p.tipo || null,
      publicacoes: (p.publicacao ?? []).map(normalizePublicacao),
    });
  }

  return propostas;
}

export function normalizeRelacionadas(raw: RawIniciativa) {
  const rel: {
    iniciativaId: number;
    tipo: string;
    relId: string | null;
    relLegislatura: string | null;
    relNumero: string | null;
    relSessao: string | null;
    relTipo: string | null;
    relDescTipo: string | null;
    relAssunto: string | null;
    relDcl: unknown | null;
    urlEuropeia: string | null;
  }[] = [];

  for (const r of raw.IniciativasOrigem ?? []) {
    rel.push({ iniciativaId: raw.IniId, tipo: "origem", relId: r.id, relLegislatura: r.legislatura, relNumero: r.numero, relSessao: r.sessao || null, relTipo: r.tipo, relDescTipo: r.descTipo || null, relAssunto: r.assunto, relDcl: r.dcl ?? null, urlEuropeia: null });
  }
  for (const r of raw.IniciativasOriginadas ?? []) {
    rel.push({ iniciativaId: raw.IniId, tipo: "originada", relId: r.id, relLegislatura: r.legislatura, relNumero: r.numero, relSessao: r.sessao || null, relTipo: r.tipo, relDescTipo: r.descTipo || null, relAssunto: r.assunto, relDcl: r.dcl ?? null, urlEuropeia: null });
  }
  for (const r of raw.Peticoes ?? []) {
    rel.push({ iniciativaId: raw.IniId, tipo: "peticao", relId: r.id, relLegislatura: r.legislatura, relNumero: r.numero, relSessao: r.sessao || null, relTipo: r.tipo, relDescTipo: r.descTipo || null, relAssunto: r.assunto, relDcl: r.dcl ?? null, urlEuropeia: null });
  }
  for (const url of raw.IniciativasEuropeias ?? []) {
    rel.push({ iniciativaId: raw.IniId, tipo: "europeia", relId: null, relLegislatura: null, relNumero: null, relSessao: null, relTipo: null, relDescTipo: null, relAssunto: null, relDcl: null, urlEuropeia: url });
  }

  return rel;
}
