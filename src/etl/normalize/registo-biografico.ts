// Raw JSON from parlamento.pt has no TypeScript types
type Raw = any;

function toArr(v: Raw): Raw[] {
  if (!v || v === "None") return [];
  return Array.isArray(v) ? v : [v];
}

function toInt(v: Raw): number | null {
  const n = typeof v === "number" ? Math.round(v) : parseInt(String(v), 10);
  return isNaN(n) ? null : n;
}

function toStr(v: Raw): string | null {
  return v == null || v === "" || v === "None" ? null : String(v);
}

export interface BioRecord {
  deputadoId: number;
  dataNascimento: string | null;
  sexo: string | null;
  profissao: string | null;
}

export interface BioHabilitacao {
  deputadoId: number;
  habId: number | null;
  descricao: string | null;
  estado: string | null;
  tipoId: number | null;
}

export interface BioTitulo {
  deputadoId: number;
  titId: number | null;
  descricao: string | null;
  ordem: number | null;
}

export interface BioCargoFuncao {
  deputadoId: number;
  funId: number | null;
  descricao: string | null;
  antiga: boolean | null;
  ordem: number | null;
}

export interface BioCondecoração {
  deputadoId: number;
  codId: number | null;
  descricao: string | null;
  ordem: number | null;
}

export interface BioObraPublicada {
  deputadoId: number;
  pubId: number | null;
  descricao: string | null;
  ordem: number | null;
}

export interface BioDeputadoLegislatura {
  deputadoId: number;
  legDes: string | null;
  legislaturaId: string | null;
  nomeParlamentar: string | null;
  gpSigla: string | null;
  gpDes: string | null;
  partidoSigla: string | null;
  partidoDes: string | null;
  circuloDes: string | null;
  indDes: string | null;
  indData: string | null;
}

export interface BioOrgao {
  deputadoId: number;
  tipo: string;
  orgId: string | null;
  orgSigla: string | null;
  orgDes: string | null;
  legDes: string | null;
  legislaturaId: string | null;
  situacao: string | null;
  cargo: string | null;
}

export interface NormalizedBio {
  deputados: BioRecord[];
  habilitacoes: BioHabilitacao[];
  titulos: BioTitulo[];
  cargosFuncoes: BioCargoFuncao[];
  condecoracoes: BioCondecoração[];
  obrasPublicadas: BioObraPublicada[];
  deputadoLegislaturas: BioDeputadoLegislatura[];
  orgaos: BioOrgao[];
}

// The registry abbreviates the Assembleia Constituinte; every other value already
// matches our legislaturas PK. Unknown values are left null rather than guessed —
// load.ts drops the FK when it cannot resolve them.
function toLegislaturaId(legDes: string | null): string | null {
  if (!legDes) return null;
  return legDes === "Cons" ? "Constituinte" : legDes;
}

function toDate(v: Raw): string | null {
  const s = toStr(v);
  if (!s) return null;
  return /^\d{4}-\d{2}-\d{2}/.test(s) ? s.slice(0, 10) : null;
}

// cargoDes is a list of { tiaDes } — a deputy holds at most one post per organ,
// so join defensively rather than assuming a single entry.
function cargoOf(raw: Raw): string | null {
  const nomes = toArr(raw.cargoDes)
    .map((c: Raw) => toStr(c?.tiaDes)?.trim())
    .filter(Boolean);
  return nomes.length ? nomes.join(", ") : null;
}

export function normalizeRegistoBiografico(rawList: Raw[]): NormalizedBio {
  const deputados: BioRecord[] = [];
  const habilitacoes: BioHabilitacao[] = [];
  const titulos: BioTitulo[] = [];
  const cargosFuncoes: BioCargoFuncao[] = [];
  const condecoracoes: BioCondecoração[] = [];
  const obrasPublicadas: BioObraPublicada[] = [];
  const deputadoLegislaturas: BioDeputadoLegislatura[] = [];
  const orgaos: BioOrgao[] = [];

  for (const raw of rawList) {
    const cadId = toInt(raw.CadId);
    if (!cadId) continue;

    deputados.push({
      deputadoId: cadId,
      dataNascimento: toStr(raw.CadDtNascimento),
      sexo: toStr(raw.CadSexo),
      profissao: toStr(raw.CadProfissao),
    });

    for (const h of toArr(raw.CadHabilitacoes)) {
      habilitacoes.push({
        deputadoId: cadId,
        habId: toInt(h.HabId),
        descricao: toStr(h.HabDes),
        estado: toStr(h.HabEstado),
        tipoId: toInt(h.HabTipoId),
      });
    }

    for (const tit of toArr(raw.CadTitulos)) {
      titulos.push({
        deputadoId: cadId,
        titId: toInt(tit.TitId),
        descricao: toStr(tit.TitDes),
        ordem: toInt(tit.TitOrdem),
      });
    }

    for (const f of toArr(raw.CadCargosFuncoes)) {
      cargosFuncoes.push({
        deputadoId: cadId,
        funId: toInt(f.FunId),
        descricao: toStr(f.FunDes),
        antiga: f.FunAntiga === "S" ? true : f.FunAntiga === "N" ? false : null,
        ordem: toInt(f.FunOrdem),
      });
    }

    for (const cod of toArr(raw.CadCondecoracoes)) {
      condecoracoes.push({
        deputadoId: cadId,
        codId: toInt(cod.CodId),
        descricao: toStr(cod.CodDes),
        ordem: toInt(cod.CodOrdem),
      });
    }

    for (const pub of toArr(raw.CadObrasPublicadas)) {
      obrasPublicadas.push({
        deputadoId: cadId,
        pubId: toInt(pub.PubId),
        descricao: toStr(pub.PubDes),
        ordem: toInt(pub.PubOrdem),
      });
    }

    // Per-legislature history. ParSigla/ParDes is the *party* (or electoral
    // coalition, e.g. "PPD/PSD.CDS-PP") and differs from the GP in mandatos.
    for (const dl of toArr(raw.CadDeputadoLegis)) {
      const legDes = toStr(dl.LegDes);
      deputadoLegislaturas.push({
        deputadoId: cadId,
        legDes,
        legislaturaId: toLegislaturaId(legDes),
        nomeParlamentar: toStr(dl.DepNomeParlamentar),
        gpSigla: toStr(dl.GpSigla),
        gpDes: toStr(dl.GpDes),
        partidoSigla: toStr(dl.ParSigla),
        partidoDes: toStr(dl.ParDes),
        circuloDes: toStr(dl.CeDes),
        indDes: toStr(dl.IndDes),
        indData: toDate(dl.IndData),
      });
    }

    // Committees, working groups and subcommittees share one shape.
    const orgTipos: [string, string][] = [
      ["actividadeCom", "comissao"],
      ["actividadeGT", "grupo_trabalho"],
      ["actividadeSCom", "subcomissao"],
    ];
    for (const [key, tipo] of orgTipos) {
      for (const o of toArr(raw.CadActividadeOrgaos?.[key])) {
        const legDes = toStr(o.legDes);
        orgaos.push({
          deputadoId: cadId,
          tipo,
          orgId: toStr(o.orgId),
          orgSigla: toStr(o.orgSigla)?.trim() ?? null,
          orgDes: toStr(o.orgDes)?.trim() ?? null,
          legDes,
          legislaturaId: toLegislaturaId(legDes),
          situacao: toStr(o.timDes),
          cargo: cargoOf(o),
        });
      }
    }
  }

  return {
    deputados, habilitacoes, titulos, cargosFuncoes, condecoracoes, obrasPublicadas,
    deputadoLegislaturas, orgaos,
  };
}
