// Raw JSON from parlamento.pt has no TypeScript types
type Raw = any;

// Committee vote tallies arrive as HTML in `detalhe` ("A Favor: <I>PS</I>…"),
// identical to the iniciativas feed — reuse that parser rather than a second one.
import { parseDetalhe } from "./iniciativas.js";

function toArr(v: Raw): Raw[] {
  if (!v || v === "None") return [];
  return Array.isArray(v) ? v : [v];
}

function toInt(v: Raw): number | null {
  if (v == null || v === "" || v === "None") return null;
  const n = typeof v === "number" ? Math.round(v) : parseInt(String(v), 10);
  return isNaN(n) ? null : n;
}

function toStr(v: Raw): string | null {
  return v == null || v === "" || v === "None" ? null : String(v);
}

function toDate(v: Raw): string | null {
  const s = toStr(v);
  if (!s) return null;
  // "2025-07-07" already ISO, pass through
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  return null;
}

function toStrArr(v: Raw): string[] | null {
  const arr = toArr(v).map((x: Raw) => toStr(x)).filter((x): x is string => x !== null);
  return arr.length ? arr : null;
}

interface PeticaoPublicacao {
  data: string | null;
  legislatura: string | null;
  numero: string | null;
  sessaoLegislativa: string | null;
  tipo: string | null;
  pubTp: string | null;
  paginas: string[] | null;
  supl: string | null;
  pagFinalDiarioSupl: string | null;
  urlDiario: string | null;
  idPag: string | null;
  idDeb: string | null;
  idInt: string | null;
  idAct: string | null;
  debateDtReu: string | null;
  obs: string | null;
}

function toPublicacao(p: Raw): PeticaoPublicacao {
  return {
    data: toDate(p.pubdt),
    legislatura: toStr(p.pubLeg),
    numero: toStr(p.pubNr),
    sessaoLegislativa: toStr(p.pubSL),
    tipo: toStr(p.pubTipo),
    pubTp: toStr(p.pubTp),
    paginas: toStrArr(p.pag),
    supl: toStr(p.supl),
    pagFinalDiarioSupl: toStr(p.pagFinalDiarioSupl),
    urlDiario: toStr(p.URLDiario),
    idPag: toStr(p.idPag),
    idDeb: toStr(p.idDeb),
    idInt: toStr(p.idInt),
    idAct: toStr(p.idAct),
    debateDtReu: toStr(p.debateDtReu),
    obs: toStr(p.obs),
  };
}

export interface NormalizedPeticoes {
  peticoes: {
    id: number;
    legislaturaId: string;
    numero: string | null;
    assunto: string | null;
    autor: string | null;
    dataEntrada: string | null;
    assinaturas: number | null;
    assinaturasInicial: number | null;
    situacao: string | null;
    sel: string | null;
    obs: string | null;
    urlTexto: string | null;
    dataDebate: string | null;
    actividadeId: string | null;
  }[];
  comissoes: {
    peticaoId: number;
    comissaoCodigo: string | null;
    nome: string | null;
    numero: string | null;
    legislatura: string | null;
    sessao: string | null;
    situacao: string | null;
    dataAdmissibilidade: string | null;
    dataArquivo: string | null;
    dataBaixaComissao: string | null;
    dataEnvioPar: string | null;
    dataReaberta: string | null;
    _relatores: {
      peticaoId: number;
      deputadoId: number | null;
      nome: string | null;
      gp: string | null;
      dataNomeacao: string | null;
      dataCessacao: string | null;
      motivoCessacao: string | null;
    }[];
    _relatorioFinal: {
      peticaoId: number;
      data: string | null;
      votacaoData: string | null;
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
    }[];
    _documentos: {
      peticaoId: number;
      tipoRef: string;
      dataDocumento: string | null;
      tipoDocumento: string | null;
      tituloDocumento: string | null;
      descricao: string | null;
      url: string | null;
    }[];
    _audicoes: {
      peticaoId: number;
      fonte: string;
      audicaoId: string | null;
      data: string | null;
      tipo: string | null;
      titulo: string | null;
      entidades: string[] | null;
    }[];
    _pedidosInformacao: {
      peticaoId: number;
      entidades: string[] | null;
      nrOficio: string | null;
      dataOficio: string | null;
      dataResposta: string | null;
    }[];
  }[];
  documentos: {
    peticaoId: number;
    dataDocumento: string | null;
    tipoDocumento: string | null;
    tituloDocumento: string | null;
    url: string | null;
  }[];
  publicacoes: ({ peticaoId: number } & PeticaoPublicacao)[];
  relacionadas: {
    peticaoId: number;
    tipo: string;
    relId: string | null;
    relNumero: string | null;
    relLegislatura: string | null;
    relSessao: string | null;
    relTipo: string | null;
    relDescTipo: string | null;
    relAssunto: string | null;
  }[];
}

// DocumentosPeticao bundles four typed lists of the same shape.
const DOC_BUCKETS: [string, string][] = [
  ["DocsOutros", "outros"],
  ["DocsRelatorioFinal", "relatorio_final"],
  ["DocsPedidoInformacoes", "pedido_informacoes"],
  ["DocsRespostaPedidoInformacoes", "resposta_pedido_informacoes"],
];

// Audições and audiências share a shape; `fonte` keeps them apart, as in comissao_audicoes.
const AUDICAO_FONTES = ["Audicoes", "Audiencias", "AudienciasOutros"];

const RELACIONADA_TIPOS: [string, string][] = [
  ["PeticoesAssociadas", "peticao_associada"],
  ["IniciativasConjuntas", "iniciativa_conjunta"],
  ["Iniciativasoriginadas", "iniciativa_originada"],
];

export function normalizePeticoes(rawList: Raw[], legislaturaId: string): NormalizedPeticoes {
  const peticoes: NormalizedPeticoes["peticoes"] = [];
  const comissoes: NormalizedPeticoes["comissoes"] = [];
  const documentos: NormalizedPeticoes["documentos"] = [];
  const publicacoes: NormalizedPeticoes["publicacoes"] = [];
  const relacionadas: NormalizedPeticoes["relacionadas"] = [];

  for (const raw of rawList) {
    const id = toInt(raw.PetId);
    if (!id) continue;

    peticoes.push({
      id,
      legislaturaId,
      numero: toStr(raw.PetNr),
      assunto: toStr(raw.PetAssunto),
      autor: toStr(raw.PetAutor),
      dataEntrada: toDate(raw.PetDataEntrada),
      assinaturas: toInt(raw.PetNrAssinaturas),
      assinaturasInicial: toInt(raw.PetNrAssinaturasInicial),
      situacao: toStr(raw.PetSituacao),
      sel: toStr(raw.PetSel),
      obs: toStr(raw.PetObs),
      urlTexto: toStr(raw.PetUrlTexto),
      dataDebate: toDate(raw.DataDebate),
      actividadeId: toStr(raw.PetActividadeId),
    });

    for (const cms of toArr(raw.DadosComissao)) {
      const relatores = toArr(cms.Relatores).map((r: Raw) => ({
        peticaoId: id,
        deputadoId: toInt(r.id),   // cadastro id — resolved against deputados in load.ts
        nome: toStr(r.nome),
        gp: toStr(r.gp),
        dataNomeacao: toDate(r.dataNomeacao),
        dataCessacao: toDate(r.dataCessacao),
        motivoCessacao: toStr(r.motivoCessacao),
      }));

      const relatorioFinal = toArr(cms.DadosRelatorioFinal).map((rf: Raw) => {
        const v = rf.votacao ?? {};
        const detalhe = toStr(v.detalhe);
        return {
          peticaoId: id,
          data: toDate(rf.data),
          votacaoData: toDate(v.data),
          resultado: toStr(v.resultado),
          unanime: v.unanime == null ? null : v.unanime === "S",
          reuniao: toStr(v.reuniao),
          tipoReuniao: toStr(v.tipoReuniao),
          descricao: toStr(v.descricao),
          detalhe,
          ...parseDetalhe(detalhe),
          // `ausencias` is its own field in the source, not encoded in the HTML.
          ausencias: toStrArr(v.ausencias) ?? [],
        };
      });

      const docs: NormalizedPeticoes["comissoes"][0]["_documentos"] = [];
      for (const [key, tipoRef] of DOC_BUCKETS) {
        for (const doc of toArr(cms.DocumentosPeticao?.[key])) {
          docs.push({
            peticaoId: id,
            tipoRef,
            dataDocumento: toDate(doc.DataDocumento),
            tipoDocumento: toStr(doc.TipoDocumento),
            tituloDocumento: toStr(doc.TituloDocumento),
            descricao: toStr(doc.Descricao),
            url: toStr(doc.URL),
          });
        }
      }

      const audicoes: NormalizedPeticoes["comissoes"][0]["_audicoes"] = [];
      for (const fonte of AUDICAO_FONTES) {
        for (const a of toArr(cms[fonte])) {
          audicoes.push({
            peticaoId: id,
            fonte,
            audicaoId: toStr(a.id),
            data: toDate(a.data),
            tipo: toStr(a.tipo),
            titulo: toStr(a.titulo),
            entidades: toStrArr(a.entidades),
          });
        }
      }

      const pedidos = toArr(cms.DadosPedidosInformacao).map((p: Raw) => ({
        peticaoId: id,
        entidades: toStrArr(p.entidades),
        nrOficio: toStr(p.nrOficio),
        dataOficio: toDate(p.dataOficio),
        dataResposta: toDate(p.dataResposta),
      }));

      comissoes.push({
        peticaoId: id,
        comissaoCodigo: toStr(cms.IdComissao),
        nome: toStr(cms.Nome),
        numero: toStr(cms.Numero),
        legislatura: toStr(cms.Legislatura),
        sessao: toStr(cms.Sessao),
        situacao: toStr(cms.Situacao),
        dataAdmissibilidade: toDate(cms.DataAdmissibilidade),
        dataArquivo: toDate(cms.DataArquivo),
        dataBaixaComissao: toDate(cms.DataBaixaComissao),
        dataEnvioPar: toDate(cms.DataEnvioPAR),
        dataReaberta: toDate(cms.DataReaberta),
        _relatores: relatores,
        _relatorioFinal: relatorioFinal,
        _documentos: docs,
        _audicoes: audicoes,
        _pedidosInformacao: pedidos,
      });
    }

    for (const doc of toArr(raw.Documentos)) {
      documentos.push({
        peticaoId: id,
        dataDocumento: toDate(doc.DataDocumento),
        tipoDocumento: toStr(doc.TipoDocumento),
        tituloDocumento: toStr(doc.TituloDocumento),
        url: toStr(doc.URL),
      });
    }

    for (const pub of toArr(raw.PublicacaoPeticao)) {
      publicacoes.push({ peticaoId: id, ...toPublicacao(pub) });
    }

    // These arrive as bare id strings in XVII (["34303"]) — accept the object
    // form too, since the same lists carry full records elsewhere in the feed.
    // The source repeats identical ids within one petition, so dedupe.
    for (const [key, tipo] of RELACIONADA_TIPOS) {
      const vistos = new Set<string>();
      for (const rel of toArr(raw[key])) {
        const escalar = typeof rel !== "object";
        const relId = escalar ? toStr(rel) : toStr(rel.id);
        const chave = `${relId}`;
        if (vistos.has(chave)) continue;
        vistos.add(chave);
        relacionadas.push({
          peticaoId: id,
          tipo,
          relId,
          relNumero: escalar ? null : toStr(rel.numero ?? rel.nr),
          relLegislatura: escalar ? null : toStr(rel.legislatura ?? rel.leg),
          relSessao: escalar ? null : toStr(rel.sessao ?? rel.sel),
          relTipo: escalar ? null : toStr(rel.tipo),
          relDescTipo: escalar ? null : toStr(rel.descTipo),
          relAssunto: escalar ? null : toStr(rel.assunto ?? rel.titulo),
        });
      }
    }
  }

  return { peticoes, comissoes, documentos, publicacoes, relacionadas };
}
