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

export interface NormalizedBio {
  deputados: BioRecord[];
  habilitacoes: BioHabilitacao[];
  titulos: BioTitulo[];
  cargosFuncoes: BioCargoFuncao[];
  condecoracoes: BioCondecoração[];
  obrasPublicadas: BioObraPublicada[];
}

export function normalizeRegistoBiografico(rawList: Raw[]): NormalizedBio {
  const deputados: BioRecord[] = [];
  const habilitacoes: BioHabilitacao[] = [];
  const titulos: BioTitulo[] = [];
  const cargosFuncoes: BioCargoFuncao[] = [];
  const condecoracoes: BioCondecoração[] = [];
  const obrasPublicadas: BioObraPublicada[] = [];

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
  }

  return { deputados, habilitacoes, titulos, cargosFuncoes, condecoracoes, obrasPublicadas };
}
