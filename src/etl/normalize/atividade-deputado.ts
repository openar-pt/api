// 1:1 mirror of AtividadeDeputado JSON (ActividadeOut + all sub-arrays).

interface RawGPAtiv {
  GpDtFim: string | null;
  GpDtInicio: string | null;
  GpId: number;
  GpSigla: string;
}

interface RawSituacaoAtiv {
  SioDes: string;
  SioDtFim: string | null;
  SioDtInicio: string | null;
}

interface RawDeputadoAtiv {
  DepCadId: number | string;
  DepCargo: unknown | null;
  DepCPDes: string;
  DepCPId: number;
  DepGP: RawGPAtiv[] | null;
  DepId: number | string;
  DepNomeCompleto: string;
  DepNomeParlamentar: string;
  DepSituacao: RawSituacaoAtiv[] | null;
  LegDes: string;
}

interface RawIni {
  IniId: string;
  IniNr: string;
  IniTp: string;
  IniTpdesc: string;
  IniSelLg: string;
  IniSelNr: string;
  IniTi: string;
}

interface RawReq {
  ReqId: string;
  ReqNr: string;
  ReqTp: string;
  ReqLg: string;
  ReqSl: string;
  ReqAs: string;
  ReqDt: string | null;
  ReqPerTp: string;
}

interface RawScgt {
  ScmComLg: string | null;
  CcmDscom: string | null;
  ScmCd: string | null;
  ScmComCd: string | null;
  CmsCargo: string | null;
  CmsSituacao: string | null;
}

interface RawIntev {
  IntId: string;
  IntTe: string | null;
  IntSu: string | null;
  PubDar: string | null;
  PubDtreu: string | null;
  PubLg: string | null;
  PubNr: string | null;
  PubSl: string | null;
  PubTp: string | null;
  TinDs: string | null;
}

interface RawActp {
  ActId: string;
  ActNr: string | null;
  ActTp: string | null;
  ActTpdesc: string | null;
  ActSelLg: string | null;
  ActSelNr: string | null;
  ActDtent: string | null;  // DD-MM-YYYY format
  ActDtdeb: string | null;  // DD-MM-YYYY format
  ActAs: string | null;
}

interface RawGpa {
  GplId: string;
  GplNo: string | null;
  CgaDtini: string | null;
  CgaDtfim: string | null;
  GplSelLg: string | null;
  CgaCrg: string | null;
}

interface RawReniao {
  RenLoc: string | null;
  RenDtIni: string | null;
  RenDtFim: string | null;
  RenTi: string | null;
}

interface RawDlp {
  DepId: string;
  DepNo: string | null;
  DepSelLg: string | null;
  DepSelNr: string | null;
  CdeCrg: string | null;
  DepReunioes: RawReniao[] | null;
}

interface RawDle {
  DevId: string;
  DevLoc: string | null;
  DevNo: string | null;
  DevSelLg: string | null;
  DevSelNr: string | null;
  DevDtfim: string | null;
  DevDtini: string | null;
  DevTp: string | null;
}

interface RawRelIni {
  IniId: string;
  IniNr: string | null;
  IniTp: string | null;
  IniSelLg: string | null;
  IniTi: string | null;
  RelFase: string | null;
  AccDtrel: string | null;
  IniLink: string | null;
}

interface RawRelPet {
  PetId: string;
  PetNr: string | null;
  PetSelLgPk: string | null;
  PetSelNrPk: string | null;
  PetAspet: string | null;
  PecDtrelf: string | null;
}

interface RawRelContas {
  ActId: string;
  ActAs: string | null;
  ActTp: string | null;
  ActTpCod: string | null;
  ActSelLg: string | null;
  AnoCiv: string | null;
  DtNom: string | null;
}

interface RawRelIniEur {
  IneId: string;
  IneReferencia: string | null;
  IneTitulo: string | null;
  IneTipo: string | null;
  IneDataRelatorio: string | null;
  IneLink: string | null;
  Leg: string | null;
}

interface RawRelParecer {
  ActSelLg: string | null;
  ActAs: string | null;
  ActId: string;
  ActDt: string | null;
  ActTpCod: string | null;
  ActTpDesc: string | null;
}

interface RawRel {
  RelatoresIniciativas: RawRelIni[] | null;
  RelatoresPeticoes: RawRelPet[] | null;
  RelatoresContasPublicas: RawRelContas[] | null;
  RelatoresIniEuropeias: RawRelIniEur[] | null;
  AutoresPareceresIncImu: RawRelParecer[] | null;
}

interface RawAtividadeComissao {
  ActId: string | null;
  ActAs: string | null;
  ActDtdes1: string | null;
  ActDtdes2: string | null;
  ActDtent: string | null;
  ActLoc: string | null;
  AccDtaud: string | null;
  ActTp: string | null;
  NomeEntidadeExterna: string | null;
  ActTpdesc: string | null;
  ActNr: string | null;
  ActLg: string | null;
  CmsNo: string | null;
  CmsAb: string | null;
  TevTp: string | null;
  ActSl: string | null;
}

interface RawCms {
  CmsCd: string | null;
  CmsLg: string | null;
  CmsNo: string | null;
  CmsCargo: string | null;
  CmsSituacao: string | null;
  CmsSubCargo: string | null;
}

interface RawDadosLegis {
  Nome: string | null;
  Dpl_lg: string | null;
  Dpl_grpar: string | null;
}

interface RawParlJovem {
  Legislatura: string | null;
  Data: string | null;
  TipoReuniao: string | null;
  Estabelecimento: string | null;
  CirculoEleitoral: string | null;
  Sessao: string | null;
}

interface RawActividadeOut {
  Ini: RawIni[] | null;
  Req: RawReq[] | null;
  Scgt: RawScgt[] | null;
  Intev: RawIntev[] | null;
  ActP: RawActp[] | null;
  Gpa: RawGpa[] | null;
  DlP: RawDlp[] | null;
  DlE: RawDle[] | null;
  Rel: RawRel | null;
  Eventos: RawAtividadeComissao[] | null;
  Audicoes: RawAtividadeComissao[] | null;
  Audiencias: RawAtividadeComissao[] | null;
  Deslocacoes: RawAtividadeComissao[] | null;
  Cms: RawCms[] | null;
  DadosLegisDeputado: RawDadosLegis[] | null;
  ParlamentoJovens: RawParlJovem[] | null;
}

interface RawAtividadeItem {
  Deputado: RawDeputadoAtiv;
  AtividadeDeputadoList: RawActividadeOut[];
}

function toDate(s: string | null | undefined): string | null {
  if (!s) return null;
  return s.slice(0, 10);
}

// ActP dates are usually DD-MM-YYYY but some records use YYYY-MM-DD
function toDDMMYYYY(s: string | null | undefined): string | null {
  if (!s) return null;
  const parts = s.slice(0, 10).split("-");
  if (parts.length !== 3) return null;
  if (parts[0].length === 4) return `${parts[0]}-${parts[1]}-${parts[2]}`; // already ISO
  return `${parts[2]}-${parts[1]}-${parts[0]}`;
}

function toInt(v: number | string | null | undefined): number | null {
  if (v == null) return null;
  const n = typeof v === "string" ? parseInt(v, 10) : Math.round(v);
  return isNaN(n) ? null : n;
}

export function normalizeAtividadeDeputado(raw: RawAtividadeItem[], legislaturaId: string) {
  const ini: ReturnType<typeof buildIni>[] = [];
  const req: ReturnType<typeof buildReq>[] = [];
  const scgt: ReturnType<typeof buildScgt>[] = [];
  const intev: ReturnType<typeof buildIntev>[] = [];
  const actp: ReturnType<typeof buildActp>[] = [];
  const gpa: ReturnType<typeof buildGpa>[] = [];
  const dlp: ReturnType<typeof buildDlp>[] = [];
  const dle: ReturnType<typeof buildDle>[] = [];
  const relIni: ReturnType<typeof buildRelIni>[] = [];
  const relPet: ReturnType<typeof buildRelPet>[] = [];
  const relContas: ReturnType<typeof buildRelContas>[] = [];
  const relIniEur: ReturnType<typeof buildRelIniEur>[] = [];
  const relPareceres: ReturnType<typeof buildRelPareceres>[] = [];
  const atividadesComissao: ReturnType<typeof buildAtividadeComissao>[] = [];
  const cms: ReturnType<typeof buildCms>[] = [];
  const dadosLegis: ReturnType<typeof buildDadosLegis>[] = [];
  const parlJovens: ReturnType<typeof buildParlJovens>[] = [];

  for (const item of raw) {
    const deputadoId = toInt(item.Deputado?.DepCadId);
    if (!deputadoId) continue;

    const act = item.AtividadeDeputadoList?.[0];
    if (!act) continue;

    const ctx = { deputadoId, legislaturaId };

    for (const x of act.Ini ?? []) ini.push(buildIni(ctx, x));
    for (const x of act.Req ?? []) req.push(buildReq(ctx, x));
    for (const x of act.Scgt ?? []) scgt.push(buildScgt(ctx, x));
    for (const x of act.Intev ?? []) intev.push(buildIntev(ctx, x));
    for (const x of act.ActP ?? []) actp.push(buildActp(ctx, x));
    for (const x of act.Gpa ?? []) gpa.push(buildGpa(ctx, x));
    for (const x of act.DlP ?? []) dlp.push(buildDlp(ctx, x));
    for (const x of act.DlE ?? []) dle.push(buildDle(ctx, x));

    const rel = act.Rel;
    if (rel) {
      for (const x of rel.RelatoresIniciativas ?? []) relIni.push(buildRelIni(ctx, x));
      for (const x of rel.RelatoresPeticoes ?? []) relPet.push(buildRelPet(ctx, x));
      for (const x of rel.RelatoresContasPublicas ?? []) relContas.push(buildRelContas(ctx, x));
      for (const x of rel.RelatoresIniEuropeias ?? []) relIniEur.push(buildRelIniEur(ctx, x));
      for (const x of rel.AutoresPareceresIncImu ?? []) relPareceres.push(buildRelPareceres(ctx, x));
    }

    for (const x of act.Eventos ?? []) atividadesComissao.push(buildAtividadeComissao(ctx, "Eventos", x));
    for (const x of act.Audicoes ?? []) atividadesComissao.push(buildAtividadeComissao(ctx, "Audicoes", x));
    for (const x of act.Audiencias ?? []) atividadesComissao.push(buildAtividadeComissao(ctx, "Audiencias", x));
    for (const x of act.Deslocacoes ?? []) atividadesComissao.push(buildAtividadeComissao(ctx, "Deslocacoes", x));

    for (const x of act.Cms ?? []) cms.push(buildCms(ctx, x));
    for (const x of act.DadosLegisDeputado ?? []) dadosLegis.push(buildDadosLegis(ctx, x));
    for (const x of act.ParlamentoJovens ?? []) parlJovens.push(buildParlJovens(ctx, x));
  }

  return { ini, req, scgt, intev, actp, gpa, dlp, dle, relIni, relPet, relContas, relIniEur, relPareceres, atividadesComissao, cms, dadosLegis, parlJovens };
}

type Ctx = { deputadoId: number; legislaturaId: string };

function buildIni(ctx: Ctx, x: RawIni) {
  return {
    ...ctx,
    iniciativaId: x.IniId || null,
    numero: x.IniNr || null,
    tipo: x.IniTp || null,
    tipoDesc: x.IniTpdesc || null,
    legislaturaRef: x.IniSelLg || null,
    numeroRef: x.IniSelNr || null,
    titulo: x.IniTi || null,
  };
}

function buildReq(ctx: Ctx, x: RawReq) {
  return {
    ...ctx,
    requerimentoId: x.ReqId || null,
    numero: x.ReqNr || null,
    tipo: x.ReqTp || null,
    legislatura: x.ReqLg || null,
    sessaoLegislativa: x.ReqSl || null,
    assunto: x.ReqAs || null,
    data: toDate(x.ReqDt),
    periodoTipo: x.ReqPerTp || null,
  };
}

function buildScgt(ctx: Ctx, x: RawScgt) {
  return {
    ...ctx,
    comissaoLegislatura: x.ScmComLg || null,
    comissaoNome: x.CcmDscom || null,
    codigo: x.ScmCd || null,
    comissaoCodigo: x.ScmComCd || null,
    cargo: x.CmsCargo || null,
    situacao: x.CmsSituacao || null,
  };
}

function buildIntev(ctx: Ctx, x: RawIntev) {
  return {
    ...ctx,
    intervencaoId: x.IntId || null,
    texto: x.IntTe || null,
    sumario: x.IntSu || null,
    publicacaoDar: x.PubDar || null,
    dataReuniao: toDate(x.PubDtreu),
    legislatura: x.PubLg || null,
    publicacaoNumero: x.PubNr || null,
    sessaoLegislativa: x.PubSl || null,
    publicacaoTipo: x.PubTp || null,
    tipoIntervencao: x.TinDs || null,
  };
}

function buildActp(ctx: Ctx, x: RawActp) {
  return {
    ...ctx,
    atividadeId: x.ActId || null,
    numero: x.ActNr || null,
    tipo: x.ActTp || null,
    tipoDesc: x.ActTpdesc || null,
    legislaturaRef: x.ActSelLg || null,
    numeroRef: x.ActSelNr || null,
    dataEntrada: toDDMMYYYY(x.ActDtent),
    dataDebate: toDDMMYYYY(x.ActDtdeb),
    assunto: x.ActAs || null,
  };
}

function buildGpa(ctx: Ctx, x: RawGpa) {
  return {
    ...ctx,
    grupoId: x.GplId || null,
    nome: x.GplNo || null,
    dataInicio: toDate(x.CgaDtini),
    dataFim: toDate(x.CgaDtfim),
    legislatura: x.GplSelLg || null,
    cargo: x.CgaCrg || null,
  };
}

function buildDlp(ctx: Ctx, x: RawDlp) {
  return {
    ...ctx,
    delegacaoId: x.DepId || null,
    nome: x.DepNo || null,
    legislatura: x.DepSelLg || null,
    numero: x.DepSelNr || null,
    cargo: x.CdeCrg || null,
    reunioes: x.DepReunioes ?? null,
  };
}

function buildDle(ctx: Ctx, x: RawDle) {
  return {
    ...ctx,
    declaracaoId: x.DevId || null,
    local: x.DevLoc || null,
    numero: x.DevNo || null,
    legislatura: x.DevSelLg || null,
    numeroRef: x.DevSelNr || null,
    dataFim: toDate(x.DevDtfim),
    dataInicio: toDate(x.DevDtini),
    tipo: x.DevTp || null,
  };
}

function buildRelIni(ctx: Ctx, x: RawRelIni) {
  return {
    ...ctx,
    iniciativaId: x.IniId || null,
    numero: x.IniNr || null,
    tipo: x.IniTp || null,
    legislatura: x.IniSelLg || null,
    titulo: x.IniTi || null,
    fase: x.RelFase || null,
    dataRelatorio: toDate(x.AccDtrel),
    link: x.IniLink || null,
  };
}

function buildRelPet(ctx: Ctx, x: RawRelPet) {
  return {
    ...ctx,
    peticaoId: x.PetId || null,
    numero: x.PetNr || null,
    legislatura: x.PetSelLgPk || null,
    numeroRef: x.PetSelNrPk || null,
    assunto: x.PetAspet || null,
    dataRelatorio: toDate(x.PecDtrelf),
  };
}

function buildRelContas(ctx: Ctx, x: RawRelContas) {
  return {
    ...ctx,
    atividadeId: x.ActId || null,
    assunto: x.ActAs || null,
    tipo: x.ActTp || null,
    tipoCodigo: x.ActTpCod || null,
    legislatura: x.ActSelLg || null,
    anoCivil: x.AnoCiv || null,
    dataNomeacao: toDate(x.DtNom),
  };
}

function buildRelIniEur(ctx: Ctx, x: RawRelIniEur) {
  return {
    ...ctx,
    iniciativaId: x.IneId || null,
    referencia: x.IneReferencia || null,
    titulo: x.IneTitulo || null,
    tipo: x.IneTipo || null,
    dataRelatorio: toDate(x.IneDataRelatorio),
    link: x.IneLink || null,
    legislatura: x.Leg || null,
  };
}

function buildRelPareceres(ctx: Ctx, x: RawRelParecer) {
  return {
    ...ctx,
    legislatura: x.ActSelLg || null,
    assunto: x.ActAs || null,
    atividadeId: x.ActId || null,
    data: toDate(x.ActDt),
    tipoCodigo: x.ActTpCod || null,
    tipoDesc: x.ActTpDesc || null,
  };
}

function buildAtividadeComissao(ctx: Ctx, fonte: string, x: RawAtividadeComissao) {
  return {
    ...ctx,
    fonte,
    atividadeId: x.ActId || null,
    assunto: x.ActAs || null,
    dataDeslocacaoInicio: toDate(x.ActDtdes1),
    dataDeslocacaoFim: toDate(x.ActDtdes2),
    dataEntrada: toDate(x.ActDtent),
    local: x.ActLoc || null,
    dataAudicao: toDate(x.AccDtaud),
    tipo: x.ActTp || null,
    nomeEntidadeExterna: x.NomeEntidadeExterna || null,
    tipoDesc: x.ActTpdesc || null,
    numero: x.ActNr || null,
    legislatura: x.ActLg || null,
    comissaoNome: x.CmsNo || null,
    comissaoAbreviatura: x.CmsAb || null,
    tipoEvento: x.TevTp || null,
    sessaoLegislativa: x.ActSl || null,
  };
}

function buildCms(ctx: Ctx, x: RawCms) {
  return {
    ...ctx,
    codigo: x.CmsCd || null,
    legislatura: x.CmsLg || null,
    nome: x.CmsNo || null,
    cargo: x.CmsCargo || null,
    situacao: x.CmsSituacao || null,
    subCargo: x.CmsSubCargo || null,
  };
}

function buildDadosLegis(ctx: Ctx, x: RawDadosLegis) {
  return {
    ...ctx,
    nome: x.Nome || null,
    legislatura: x.Dpl_lg || null,
    grupoParlamentar: x.Dpl_grpar || null,
  };
}

function buildParlJovens(ctx: Ctx, x: RawParlJovem) {
  return {
    ...ctx,
    legislatura: x.Legislatura || null,
    data: toDate(x.Data),
    tipoReuniao: x.TipoReuniao || null,
    estabelecimento: x.Estabelecimento || null,
    circuloEleitoral: x.CirculoEleitoral || null,
    sessao: x.Sessao || null,
  };
}
