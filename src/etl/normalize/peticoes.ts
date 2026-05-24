// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = any;

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
  }[];
  comissoes: {
    peticaoId: number;
    comissaoId: string | null;
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
      nome: string | null;
      gp: string | null;
      dataNomeacao: string | null;
      dataCessacao: string | null;
      motivoCessacao: string | null;
    }[];
  }[];
  documentos: {
    peticaoId: number;
    dataDocumento: string | null;
    tipoDocumento: string | null;
    tituloDocumento: string | null;
    url: string | null;
  }[];
}

export function normalizePeticoes(rawList: Raw[], legislaturaId: string): NormalizedPeticoes {
  const peticoes: NormalizedPeticoes["peticoes"] = [];
  const comissoes: NormalizedPeticoes["comissoes"] = [];
  const documentos: NormalizedPeticoes["documentos"] = [];

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
    });

    for (const cms of toArr(raw.DadosComissao)) {
      const relatores = toArr(cms.Relatores).map((r: Raw) => ({
        peticaoId: id,
        nome: toStr(r.nome),
        gp: toStr(r.gp),
        dataNomeacao: toDate(r.dataNomeacao),
        dataCessacao: toDate(r.dataCessacao),
        motivoCessacao: toStr(r.motivoCessacao),
      }));

      comissoes.push({
        peticaoId: id,
        comissaoId: toStr(cms.IdComissao),
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
  }

  return { peticoes, comissoes, documentos };
}
