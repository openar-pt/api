// Tipos exactos baseados na inspeção dos ficheiros reais

interface RawGP {
  gpDtFim: string | null;
  gpDtInicio: string | null;
  gpId: number;
  gpSigla: string;
}

interface RawSituacao {
  sioDes: string;
  sioDtFim: string | null;
  sioDtInicio: string | null;
}

interface RawCargo {
  carId: number;
  carDes: string;         // Note: source uses "carDes", PDF says "cardes"
  carDtInicio: string | null;
  carDtFim: string | null;
}

interface RawVideo {
  Tipo: string | null;
  url: string | null;
}

interface RawDeputado {
  DepCadId: number;         // float no JSON → cast para int
  DepId: number;            // float no JSON → cast para int
  DepCargo: RawCargo[] | null;  // DadosCargoDeputado[] — 13 deputies in XVI have data
  DepCPDes: string;         // nome do círculo eleitoral
  DepCPId: number;          // float no JSON → cast para int
  DepGP: RawGP[] | null;
  DepNomeCompleto: string;
  DepNomeParlamentar: string;
  DepSituacao: RawSituacao[] | null;
  LegDes: string;           // legislature designation (e.g. "XVI") — context, not stored separately
  Videos: RawVideo[] | null; // DadosVideo[] — always null so far
}

interface RawGrupo {
  nome: string;
  sigla: string;
}

interface RawCirculo {
  cpDes: string;
  cpId: number;
  legDes: string;
}

interface RawSessao {
  dataFim: string | null;
  dataInicio: string;
  numSessao: string;
}

interface RawDetalheLegislatura {
  dtfim: string | null;
  dtini: string;
  id: string;            // AR internal numeric ID (e.g. "107")
  sigla: string;
  siglaAntiga: string | null;
}

interface RawInformacaoBase {
  Deputados: RawDeputado[];
  GruposParlamentares: RawGrupo[];
  CirculosEleitorais: RawCirculo[];
  SessoesLegislativas: RawSessao[];
  DetalheLegislatura: RawDetalheLegislatura;
}

function toInt(v: number | null | undefined): number | null {
  if (v == null) return null;
  return Math.round(v);
}

function toDate(s: string | null | undefined): string | null {
  if (!s) return null;
  return s.slice(0, 10);
}

export function normalizeInformacaoBase(raw: RawInformacaoBase, legislaturaId: string) {
  const deputados = (raw.Deputados ?? [])
    .map((d) => {
      const id = toInt(d.DepCadId);
      if (!id) return null;
      return {
        id,
        depId: toInt(d.DepId),
        nomeCompleto: d.DepNomeCompleto.trim(),
        nomeParlamentar: d.DepNomeParlamentar.trim(),
        videos: d.Videos ?? null,
      };
    })
    .filter(Boolean) as { id: number; depId: number | null; nomeCompleto: string; nomeParlamentar: string; videos: RawVideo[] | null }[];

  type Mandato = {
    deputadoId: number;
    legislaturaId: string;
    grupoParlamentar: string | null;
    gpId: number | null;
    circuloEleitoral: string | null;
    dataInicio: string | null;
    dataFim: string | null;
    situacao: string | null;
  };

  const mandatos = (raw.Deputados ?? []).flatMap((d): Mandato[] => {
    const deputadoId = toInt(d.DepCadId);
    if (!deputadoId) return [];

    const situacao = d.DepSituacao?.[0]?.sioDes ?? null;
    const circulo = d.DepCPDes ?? null;

    const gps = d.DepGP ?? [];
    if (gps.length === 0) {
      return [{
        deputadoId,
        legislaturaId,
        grupoParlamentar: null,
        gpId: null,
        circuloEleitoral: circulo,
        dataInicio: null,
        dataFim: null,
        situacao,
      }];
    }

    return gps.map((gp) => ({
      deputadoId,
      legislaturaId,
      grupoParlamentar: gp.gpSigla,
      gpId: toInt(gp.gpId),
      circuloEleitoral: circulo,
      dataInicio: toDate(gp.gpDtInicio),
      dataFim: toDate(gp.gpDtFim),
      situacao,
    }));
  });

  // Full situacao history per deputy (DadosSituacaoDeputados[])
  type Situacao = {
    deputadoId: number;
    legislaturaId: string;
    sioDes: string | null;
    sioDtInicio: string | null;
    sioDtFim: string | null;
  };

  const situacoes = (raw.Deputados ?? []).flatMap((d): Situacao[] => {
    const deputadoId = toInt(d.DepCadId);
    if (!deputadoId) return [];
    return (d.DepSituacao ?? []).map((s) => ({
      deputadoId,
      legislaturaId,
      sioDes: s.sioDes || null,
      sioDtInicio: toDate(s.sioDtInicio),
      sioDtFim: toDate(s.sioDtFim),
    }));
  });

  // Cargos per deputy (DadosCargoDeputado[])
  type Cargo = {
    deputadoId: number;
    legislaturaId: string;
    carId: number | null;
    carDes: string | null;
    carDtInicio: string | null;
    carDtFim: string | null;
  };

  const cargos = (raw.Deputados ?? []).flatMap((d): Cargo[] => {
    const deputadoId = toInt(d.DepCadId);
    if (!deputadoId) return [];
    return (d.DepCargo ?? []).map((c) => ({
      deputadoId,
      legislaturaId,
      carId: toInt(c.carId),
      carDes: c.carDes || null,
      carDtInicio: toDate(c.carDtInicio),
      carDtFim: toDate(c.carDtFim),
    }));
  });

  const dedupById = <T extends { id: number }>(arr: T[]): T[] =>
    [...new Map(arr.map((v) => [v.id, v])).values()];

  const dedupBySigla = <T extends { sigla: string }>(arr: T[]): T[] =>
    [...new Map(arr.map((v) => [v.sigla, v])).values()];

  const dedupByCpId = <T extends { cpId: number }>(arr: T[]): T[] =>
    [...new Map(arr.map((v) => [v.cpId, v])).values()];

  const grupos = dedupBySigla(
    (raw.GruposParlamentares ?? []).map((g) => ({
      legislaturaId,
      sigla: g.sigla,
      nome: g.nome,
    }))
  );

  const circulos = dedupByCpId(
    (raw.CirculosEleitorais ?? []).map((c) => ({
      legislaturaId,
      cpId: toInt(c.cpId)!,
      nome: c.cpDes,
    }))
  );

  const sessoes = (raw.SessoesLegislativas ?? []).map((s) => ({
    legislaturaId,
    numSessao: s.numSessao || null,
    dataInicio: toDate(s.dataInicio),
    dataFim: toDate(s.dataFim),
  }));

  // DetalheLegislatura — AR internal fields to enrich legislaturas table
  const detalhe = raw.DetalheLegislatura
    ? {
        arId: raw.DetalheLegislatura.id || null,
        siglaAntiga: raw.DetalheLegislatura.siglaAntiga || null,
      }
    : null;

  return { deputados: dedupById(deputados), mandatos, situacoes, cargos, grupos, circulos, sessoes, detalhe };
}
