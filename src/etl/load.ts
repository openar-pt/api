import { sql, inArray, eq } from "drizzle-orm";
import { existsSync, readFileSync } from "fs";
import { join } from "path";
import { db } from "../db/index.js";
import * as t from "../db/schema.js";
import {
  INFORMACAO_BASE,
  INICIATIVAS,
  ATIVIDADE_DEPUTADO,
  PETICOES,
  REGISTO_BIOGRAFICO,
  LEGISLATURAS_METADATA,
  CURRENT_LEGISLATURA,
} from "./sources.js";
import { normalizeInformacaoBase } from "./normalize/informacao-base.js";
import { normalizeRegistoBiografico } from "./normalize/registo-biografico.js";
import { normalizePeticoes } from "./normalize/peticoes.js";
import { normalizeAtividadeDeputado } from "./normalize/atividade-deputado.js";
import { syncPhotos } from "./photos.js";
import {
  normalizeIniciativa,
  normalizeAutores,
  normalizeEventos,
  normalizeAnexos,
  normalizePropostasAlteracao,
  normalizeRelacionadas,
} from "./normalize/iniciativas.js";

// ── Helpers ───────────────────────────────────────────────────────────────────

function chunks<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

import { fetchJson } from "./http.js";

function log(msg: string) {
  console.log(`[${new Date().toISOString().slice(11, 19)}] ${msg}`);
}

// ── Legislaturas ──────────────────────────────────────────────────────────────

async function upsertLegislaturas() {
  for (const leg of LEGISLATURAS_METADATA) {
    await db
      .insert(t.legislaturas)
      .values(leg)
      .onConflictDoUpdate({
        target: t.legislaturas.id,
        set: { nome: leg.nome, dataInicio: leg.dataInicio, dataFim: leg.dataFim },
      });
  }
  log(`✓ ${LEGISLATURAS_METADATA.length} legislaturas`);
}

// ── Informação Base ───────────────────────────────────────────────────────────

async function loadInformacaoBase(legId: string): Promise<number[]> {
  const url = INFORMACAO_BASE[legId];
  if (!url) {
    log(`  ! No InformacaoBase URL for ${legId} — skipping`);
    return [];
  }

  log(`  Fetching InformacaoBase ${legId}…`);

  const raw = await fetchJson<any>(url);
  const { deputados, mandatos, situacoes, cargos, grupos, circulos, sessoes, detalhe } = normalizeInformacaoBase(raw, legId);

  // Enrich legislaturas table with AR internal IDs from DetalheLegislatura
  if (detalhe) {
    await db
      .update(t.legislaturas)
      .set({ arId: detalhe.arId, siglaAntiga: detalhe.siglaAntiga })
      .where(eq(t.legislaturas.id, legId));
  }

  for (const chunk of chunks(grupos, 500)) {
    if (!chunk.length) continue;
    await db
      .insert(t.gruposParlamentares)
      .values(chunk)
      .onConflictDoUpdate({
        target: [t.gruposParlamentares.legislaturaId, t.gruposParlamentares.sigla],
        set: { nome: sql`excluded.nome` },
      });
  }

  for (const chunk of chunks(circulos, 500)) {
    if (!chunk.length) continue;
    await db
      .insert(t.circulosEleitorais)
      .values(chunk)
      .onConflictDoUpdate({
        target: [t.circulosEleitorais.legislaturaId, t.circulosEleitorais.cpId],
        set: { nome: sql`excluded.nome` },
      });
  }

  for (const chunk of chunks(deputados, 500)) {
    if (!chunk.length) continue;
    await db
      .insert(t.deputados)
      .values(chunk)
      .onConflictDoUpdate({
        target: t.deputados.id,
        set: {
          nomeCompleto: sql`excluded.nome_completo`,
          nomeParlamentar: sql`excluded.nome_parlamentar`,
          videos: sql`excluded.videos`,
        },
      });
  }

  await db.transaction(async (tx) => {
    await tx.delete(t.mandatos).where(eq(t.mandatos.legislaturaId, legId));
    for (const chunk of chunks(mandatos, 500)) {
      if (!chunk.length) continue;
      await tx.insert(t.mandatos).values(chunk);
    }

    await tx.delete(t.sessoesLegislativas).where(eq(t.sessoesLegislativas.legislaturaId, legId));
    for (const chunk of chunks(sessoes, 500)) {
      if (!chunk.length) continue;
      await tx.insert(t.sessoesLegislativas).values(chunk);
    }

    await tx.delete(t.deputadoSituacoes).where(eq(t.deputadoSituacoes.legislaturaId, legId));
    for (const chunk of chunks(situacoes, 500)) {
      if (!chunk.length) continue;
      await tx.insert(t.deputadoSituacoes).values(chunk);
    }

    await tx.delete(t.deputadoCargos).where(eq(t.deputadoCargos.legislaturaId, legId));
    for (const chunk of chunks(cargos, 200)) {
      if (!chunk.length) continue;
      await tx.insert(t.deputadoCargos).values(chunk);
    }
  });

  log(
    `  ✓ ${deputados.length} deputados · ${mandatos.length} mandatos · ` +
      `${situacoes.length} situações · ${cargos.length} cargos · ` +
      `${grupos.length} grupos · ${circulos.length} círculos · ${sessoes.length} sessões`
  );

  return deputados.map((d) => d.id);
}

// ── Iniciativas ───────────────────────────────────────────────────────────────

async function loadIniciativas(legId: string) {
  const url = INICIATIVAS[legId];
  if (!url) {
    log(`  ! No Iniciativas URL for ${legId} — skipping`);
    return;
  }

  log(`  Fetching Iniciativas ${legId}…`);

  const rawList = await fetchJson<any[]>(url);
  log(`  ${rawList.length} iniciativas`);

  const normalized = rawList.map((raw) => {
    const { eventos: evts, votacoes: vots, votacaoPublicacoes: votPubs, publicacoes: pubs, intervencoes: intvs, anexosFase: anxFase, iniciativasConjuntas: ics, peticoesConjuntas: pcs, comissoesFases: cfs } = normalizeEventos(raw);
    return {
      iniciativa: normalizeIniciativa(raw),
      autores: normalizeAutores(raw),
      evts,
      vots,
      votPubs,
      pubs,
      intvs,
      anxFase,
      ics,
      pcs,
      cfs,
      relacionadas: normalizeRelacionadas(raw),
      anexos: normalizeAnexos(raw),
      propostas: normalizePropostasAlteracao(raw),
      rawId: raw.IniId as number,
    };
  });

  const allIds = normalized.map((n) => n.rawId);

  // 1. Upsert iniciativas
  for (const chunk of chunks(normalized.map((n) => n.iniciativa), 500)) {
    await db
      .insert(t.iniciativas)
      .values(chunk)
      .onConflictDoUpdate({
        target: t.iniciativas.id,
        set: {
          titulo: sql`excluded.titulo`,
          epigrafe: sql`excluded.epigrafe`,
          estado: sql`excluded.estado`,
          dataEntrada: sql`excluded.data_entrada`,
          dataFim: sql`excluded.data_fim`,
          linkTexto: sql`excluded.link_texto`,
          textoSubstituido: sql`excluded.texto_substituido`,
          textoSubstCampo: sql`excluded.texto_subst_campo`,
          obs: sql`excluded.obs`,
          sel: sql`excluded.sel`,
          links: sql`excluded.links`,
          updatedAt: sql`CASE
            WHEN iniciativas.estado IS DISTINCT FROM excluded.estado
              OR iniciativas.data_fim IS DISTINCT FROM excluded.data_fim
              OR iniciativas.titulo IS DISTINCT FROM excluded.titulo
              OR iniciativas.sel IS DISTINCT FROM excluded.sel
            THEN NOW()
            ELSE iniciativas.updated_at
          END`,
        },
      })
      .catch((e) => {
      
        const cause = (e as any)?.cause;
        log(`  ✗ iniciativas upsert error: ${e?.message?.slice(0, 200)}`);
        if (cause) log(`  ✗ cause: ${cause?.message ?? String(cause)}`);
        throw e;
      });
  }

  // 1b. Pre-upsert canonical comissoes — fail before deleting anything if DB state is wrong
  const comissaoNomeToId = new Map<string, number>();
  {
    const uniqueComissoes = new Map<string, { nome: string; sigla: string | null }>();
    for (const n of normalized) {
      for (const cf of n.cfs) {
        if (!cf.nome) continue;
        const key = cf.nome.trim().toLowerCase();
        if (!uniqueComissoes.has(key)) uniqueComissoes.set(key, { nome: cf.nome.trim(), sigla: cf.sigla ?? null });
      }
    }
    for (const chunk of chunks(Array.from(uniqueComissoes.values()), 200)) {
      const returned = await db
        .insert(t.comissoes)
        .values(chunk)
        .onConflictDoUpdate({
          target: t.comissoes.nome,
          set: { sigla: sql`COALESCE(EXCLUDED.sigla, comissoes.sigla)` },
        })
        .returning({ id: t.comissoes.id, nome: t.comissoes.nome });
      for (const r of returned) comissaoNomeToId.set(r.nome.trim().toLowerCase(), r.id);
    }
  }

  // 2. Delete dependents in FK-safe order (deepest first)
  for (const chunk of chunks(allIds, 1000)) {
    // comissoes_fases cascade-deletes: comissao_votacoes, comissao_votacao_publicacoes,
    //   comissao_relatores, comissao_documentos, comissao_audicoes, comissao_remessas, comissao_publicacoes
    await db.delete(t.comissoesFases).where(inArray(t.comissoesFases.iniciativaId, chunk));
    await db.delete(t.iniciativasConjuntas).where(inArray(t.iniciativasConjuntas.iniciativaId, chunk));
    await db.delete(t.peticoesConjuntas).where(inArray(t.peticoesConjuntas.iniciativaId, chunk));
    // intervencoesdebates cascade-deletes: oradores (and orador_publicacoes, orador_deputados)
    await db.delete(t.intervencoesdebates).where(inArray(t.intervencoesdebates.iniciativaId, chunk));
    await db.delete(t.anexos).where(inArray(t.anexos.iniciativaId, chunk));
    await db.delete(t.publicacoes).where(inArray(t.publicacoes.iniciativaId, chunk));
    await db.delete(t.votacaoPublicacoes).where(inArray(t.votacaoPublicacoes.votacaoIniId, chunk));
    await db.delete(t.votacoes).where(inArray(t.votacoes.iniciativaId, chunk));
    await db.delete(t.eventos).where(inArray(t.eventos.iniciativaId, chunk));
    await db.delete(t.autoresIniciativas).where(inArray(t.autoresIniciativas.iniciativaId, chunk));
    await db.delete(t.iniciativasRelacionadas).where(inArray(t.iniciativasRelacionadas.iniciativaId, chunk));
    // propostas_alteracao cascade-deletes: proposta_publicacoes
    await db.delete(t.propostasAlteracao).where(inArray(t.propostasAlteracao.iniciativaId, chunk));
  }

  // autores_iniciativas.deputado_id, comissao_relatores.deputado_id and
  // orador_deputados.deputado_id are real FKs — an id the DB has never seen (a
  // partial --leg load, or a deputy absent from InformacaoBase) becomes null
  // instead of aborting the run.
  const knownDeputadoIds = new Set(
    (await db.select({ id: t.deputados.id }).from(t.deputados)).map((r) => r.id)
  );
  const resolveDeputado = (id: number | null | undefined): number | null =>
    id != null && knownDeputadoIds.has(id) ? id : null;

  // 3. Insert autores & relacionadas
  const allAutores = normalized
    .flatMap((n) => n.autores)
    .map((a) => ({ ...a, deputadoId: resolveDeputado(a.deputadoId) }));
  for (const chunk of chunks(allAutores, 500)) {
    if (!chunk.length) continue;
    await db.insert(t.autoresIniciativas).values(chunk);
  }
  const allRelacionadas = normalized.flatMap((n) => n.relacionadas);
  for (const chunk of chunks(allRelacionadas, 500)) {
    if (!chunk.length) continue;
    await db.insert(t.iniciativasRelacionadas).values(chunk);
  }

  // 4. Insert propostas de alteração + their publicacoes (legs II–VII)
  const allPropostas = normalized.flatMap((n) => n.propostas);
  const returnedPropostaIds: number[] = [];
  for (const chunk of chunks(allPropostas.map(({ publicacoes: _, ...p }) => p), 500)) {
    if (!chunk.length) continue;
    const returned = await db.insert(t.propostasAlteracao).values(chunk).returning({ id: t.propostasAlteracao.id });
    for (const r of returned) returnedPropostaIds.push(r.id);
  }
  const allPropostaPubs = allPropostas.flatMap((p, i) =>
    p.publicacoes.map((pub) => ({
      propostaAlteracaoId: returnedPropostaIds[i],
      iniciativaId: p.iniciativaId,
      ...pub,
    }))
  );
  for (const chunk of chunks(allPropostaPubs, 200)) {
    if (!chunk.length) continue;
    await db.insert(t.propostaPublicacoes).values(chunk);
  }

  // 5. Insert eventos, collect returned IDs
  const allEvts = normalized.flatMap((n) => n.evts);
  const eventoLookup = new Map<string, number>(); // "${iniciativaId}:${oevId}:${evtId}" → id

  for (const chunk of chunks(allEvts, 200)) {
    if (!chunk.length) continue;
    const returned = await db
      .insert(t.eventos)
      .values(chunk)
      .returning({
        id: t.eventos.id,
        iniciativaId: t.eventos.iniciativaId,
        oevId: t.eventos.oevId,
        evtId: t.eventos.evtId,
      });
    for (const r of returned) {
      eventoLookup.set(`${r.iniciativaId}:${r.oevId}:${r.evtId}`, r.id);
    }
  }

  // 6. Insert votações + their publicacoes
  const allVots = normalized.flatMap((n) =>
    n.vots.map((v) => {
      const eventoId = eventoLookup.get(`${v.iniciativaId}:${v.eventoOevId}:${v.eventoEvtId}`);
      if (eventoId === undefined)
        throw new Error(`eventoId not found for votacao ${v.id} (iniciativa ${v.iniciativaId})`);
      const { eventoOevId: _o, eventoEvtId: _e, ...rest } = v;
      return { ...rest, eventoId };
    })
  );
  for (const chunk of chunks(allVots, 200)) {
    if (!chunk.length) continue;
    await db.insert(t.votacoes).values(chunk).onConflictDoNothing();
  }

  const allVotPubs = normalized.flatMap((n) =>
    n.votPubs.map((vp) => {
      const eventoId = eventoLookup.get(`${vp.votacaoIniId}:${vp.eventoOevId}:${vp.eventoEvtId}`);
      if (eventoId === undefined)
        throw new Error(`eventoId not found for votacao publicacao (iniciativa ${vp.votacaoIniId})`);
      return { votacaoIniId: vp.votacaoIniId, votacaoId: vp.votacaoId, eventoId, ...vp.pub };
    })
  );
  for (const chunk of chunks(allVotPubs, 200)) {
    if (!chunk.length) continue;
    await db.insert(t.votacaoPublicacoes).values(chunk);
  }

  // 7. Insert publicações (event-level)
  const allPubs = normalized.flatMap((n) =>
    n.pubs.map((p) => {
      const eventoId = eventoLookup.get(`${p.iniciativaId}:${p.eventoOevId}:${p.eventoEvtId}`);
      if (eventoId === undefined)
        throw new Error(`eventoId not found for publicacao (iniciativa ${p.iniciativaId})`);
      const { eventoOevId: _o, eventoEvtId: _e, ...rest } = p;
      return { ...rest, eventoId };
    })
  );
  for (const chunk of chunks(allPubs, 200)) {
    if (!chunk.length) continue;
    await db.insert(t.publicacoes).values(chunk);
  }

  // 8. Insert intervencoesdebates + oradores + orador publicacoes
  const allIntvs = normalized.flatMap((n) =>
    n.intvs.map((intv) => {
      const eventoId = eventoLookup.get(`${intv.iniciativaId}:${intv.eventoOevId}:${intv.eventoEvtId}`);
      if (eventoId === undefined)
        throw new Error(`eventoId not found for intervencao (iniciativa ${intv.iniciativaId})`);
      return {
        eventoId,
        iniciativaId: intv.iniciativaId,
        dataReuniao: intv.dataReuniao,
        _oradores: intv.oradores,
      };
    })
  );

  const intvRows = allIntvs.map(({ _oradores: _, ...row }) => row);
  const returnedIntvIds: number[] = [];
  for (const chunk of chunks(intvRows, 200)) {
    if (!chunk.length) continue;
    const returned = await db
      .insert(t.intervencoesdebates)
      .values(chunk)
      .returning({ id: t.intervencoesdebates.id });
    for (const r of returned) returnedIntvIds.push(r.id);
  }

  const allOradores = allIntvs.flatMap((intv, i) =>
    intv._oradores.map((o) => ({ ...o, intervencaoId: returnedIntvIds[i] }))
  );

  const returnedOradorIds: number[] = [];
  for (const chunk of chunks(allOradores.map(({ publicacoes: _, _deputadosOradores: __, ...o }) => o), 200)) {
    if (!chunk.length) continue;
    const returned = await db.insert(t.oradores).values(chunk).returning({ id: t.oradores.id });
    for (const r of returned) returnedOradorIds.push(r.id);
  }

  // Speakers → deputies, the link the ETL used to drop entirely.
  const allOradorDeputados: typeof t.oradorDeputados.$inferInsert[] = allOradores.flatMap((o, i) =>
    o._deputadosOradores.map((d) => {
      const cad = d.cadastroId ? parseInt(d.cadastroId, 10) : NaN;
      return {
        oradorId: returnedOradorIds[i],
        cadastroId: d.cadastroId,
        deputadoId: resolveDeputado(isNaN(cad) ? null : cad),
        nome: d.nome,
        gp: d.gp,
      };
    })
  );
  for (const chunk of chunks(allOradorDeputados, 500)) {
    if (!chunk.length) continue;
    await db.insert(t.oradorDeputados).values(chunk);
  }

  const allOradorPubsFlat: typeof t.oradorPublicacoes.$inferInsert[] = [];
  let oradorIdx = 0;
  for (let intvIdx = 0; intvIdx < allIntvs.length; intvIdx++) {
    const intv = allIntvs[intvIdx];
    for (const o of intv._oradores) {
      const oradorId = returnedOradorIds[oradorIdx++];
      for (const pub of o.publicacoes) {
        allOradorPubsFlat.push({
          oradorId,
          eventoId: intv.eventoId,
          iniciativaId: intv.iniciativaId,
          ...pub,
        });
      }
    }
  }
  for (const chunk of chunks(allOradorPubsFlat, 200)) {
    if (!chunk.length) continue;
    await db.insert(t.oradorPublicacoes).values(chunk);
  }

  // 9. Insert anexosFase (event-level attachments, XII–XIV)
  const allAnexosFase = normalized.flatMap((n) =>
    n.anxFase.map((a) => {
      const eventoId = eventoLookup.get(`${a.iniciativaId}:${a.eventoOevId}:${a.eventoEvtId}`);
      if (eventoId === undefined)
        throw new Error(`eventoId not found for anexoFase (iniciativa ${a.iniciativaId})`);
      const { eventoOevId: _o, eventoEvtId: _e, ...rest } = a;
      return { ...rest, eventoId };
    })
  );
  for (const chunk of chunks(allAnexosFase, 500)) {
    if (!chunk.length) continue;
    await db.insert(t.anexos).values(chunk);
  }

  // 10. Insert IniAnexos (initiative-level attachments, no eventoId)
  const allAnexosIni = normalized.flatMap((n) => n.anexos);
  for (const chunk of chunks(allAnexosIni, 500)) {
    if (!chunk.length) continue;
    await db.insert(t.anexos).values(chunk);
  }

  // 11. Insert iniciativas_conjuntas
  const allICs = normalized.flatMap((n) =>
    n.ics.map((ic) => {
      const eventoId = eventoLookup.get(`${ic.iniciativaId}:${ic.eventoOevId}:${ic.eventoEvtId}`);
      if (eventoId === undefined)
        throw new Error(`eventoId not found for iniciativaConjunta (iniciativa ${ic.iniciativaId})`);
      const { eventoOevId: _o, eventoEvtId: _e, ...rest } = ic;
      return { ...rest, eventoId };
    })
  );
  for (const chunk of chunks(allICs, 500)) {
    if (!chunk.length) continue;
    await db.insert(t.iniciativasConjuntas).values(chunk);
  }

  // 12. Insert peticoes_conjuntas
  const allPCs = normalized.flatMap((n) =>
    n.pcs.map((pc) => {
      const eventoId = eventoLookup.get(`${pc.iniciativaId}:${pc.eventoOevId}:${pc.eventoEvtId}`);
      if (eventoId === undefined)
        throw new Error(`eventoId not found for peticaoConjunta (iniciativa ${pc.iniciativaId})`);
      const { eventoOevId: _o, eventoEvtId: _e, ...rest } = pc;
      return { ...rest, eventoId };
    })
  );
  for (const chunk of chunks(allPCs, 200)) {
    if (!chunk.length) continue;
    await db.insert(t.peticoesConjuntas).values(chunk);
  }

  // 13. Insert comissoes_fases + all child tables (multi-pass for IDs)
  const allCFs = normalized.flatMap((n) =>
    n.cfs.map((cf) => {
      const eventoId = eventoLookup.get(`${cf.iniciativaId}:${cf.eventoOevId}:${cf.eventoEvtId}`);
      if (eventoId === undefined)
        throw new Error(`eventoId not found for comissaoFase (iniciativa ${cf.iniciativaId})`);
      return { ...cf, eventoId };
    })
  );

  const returnedCFIds: number[] = [];
  for (const chunk of chunks(allCFs.map(({ eventoOevId: _o, eventoEvtId: _e, _votacoes: _v, _relatores: _r, _documentos: _d, _audicoes: _a, _remessas: _rm, _publicacoes: _p, ...cf }) => ({
    ...cf,
    comissaoId: cf.nome ? (comissaoNomeToId.get(cf.nome.trim().toLowerCase()) ?? null) : null,
  })), 100)) {
    if (!chunk.length) continue;
    const returned = await db.insert(t.comissoesFases).values(chunk).returning({ id: t.comissoesFases.id });
    for (const r of returned) returnedCFIds.push(r.id);
  }

  // Child tables of comissoes_fases
  const allComissaoVotacoesRaw: { comissaoFaseId: number; eventoId: number; iniciativaId: number; _votacao: (typeof allCFs)[0]["_votacoes"][0] }[] = [];
  const allComissaoRelatores: typeof t.comissaoRelatores.$inferInsert[] = [];
  const allComissaoDocumentos: typeof t.comissaoDocumentos.$inferInsert[] = [];
  const allComissaoAudicoes: typeof t.comissaoAudicoes.$inferInsert[] = [];
  const allComissaoRemessas: typeof t.comissaoRemessas.$inferInsert[] = [];
  const allComissaoPublicacoes: typeof t.comissaoPublicacoes.$inferInsert[] = [];

  for (let i = 0; i < allCFs.length; i++) {
    const cf = allCFs[i];
    const comissaoFaseId = returnedCFIds[i];

    for (const v of cf._votacoes) {
      allComissaoVotacoesRaw.push({ comissaoFaseId, eventoId: cf.eventoId, iniciativaId: cf.iniciativaId, _votacao: v });
    }
    for (const r of cf._relatores) {
      allComissaoRelatores.push({
        comissaoFaseId, eventoId: cf.eventoId, iniciativaId: cf.iniciativaId,
        ...r,
        deputadoId: resolveDeputado(r.deputadoId),
      });
    }
    for (const d of cf._documentos) {
      allComissaoDocumentos.push({ comissaoFaseId, eventoId: cf.eventoId, iniciativaId: cf.iniciativaId, ...d });
    }
    for (const a of cf._audicoes) {
      allComissaoAudicoes.push({ comissaoFaseId, eventoId: cf.eventoId, iniciativaId: cf.iniciativaId, ...a });
    }
    for (const rm of cf._remessas) {
      allComissaoRemessas.push({ comissaoFaseId, eventoId: cf.eventoId, iniciativaId: cf.iniciativaId, ...rm });
    }
    for (const p of cf._publicacoes) {
      allComissaoPublicacoes.push({ comissaoFaseId, eventoId: cf.eventoId, iniciativaId: cf.iniciativaId, tipoRef: p.tipoRef, ...p.pub });
    }
  }

  const returnedCVIds: number[] = [];
  for (const chunk of chunks(allComissaoVotacoesRaw.map(({ _votacao: v, comissaoFaseId, eventoId, iniciativaId }) => ({
    comissaoFaseId, eventoId, iniciativaId,
    votacaoId: v.votacaoId,
    data: v.data,
    resultado: v.resultado,
    unanime: v.unanime,
    reuniao: v.reuniao,
    tipoReuniao: v.tipoReuniao,
    descricao: v.descricao,
    detalhe: v.detalhe,
    aFavor: v.aFavor,
    contra: v.contra,
    abstencao: v.abstencao,
    ausencias: v.ausencias,
  })), 200)) {
    if (!chunk.length) continue;
    const returned = await db.insert(t.comissaoVotacoes).values(chunk).returning({ id: t.comissaoVotacoes.id });
    for (const r of returned) returnedCVIds.push(r.id);
  }

  const allCVPubs: typeof t.comissaoVotacaoPublicacoes.$inferInsert[] = [];
  for (let i = 0; i < allComissaoVotacoesRaw.length; i++) {
    const { _votacao: v, eventoId, iniciativaId } = allComissaoVotacoesRaw[i];
    const comissaoVotacaoId = returnedCVIds[i];
    for (const pub of v._publicacoes) {
      allCVPubs.push({ comissaoVotacaoId, eventoId, iniciativaId, ...pub });
    }
  }
  for (const chunk of chunks(allCVPubs, 200)) {
    if (!chunk.length) continue;
    await db.insert(t.comissaoVotacaoPublicacoes).values(chunk);
  }

  for (const chunk of chunks(allComissaoRelatores, 200)) {
    if (!chunk.length) continue;
    await db.insert(t.comissaoRelatores).values(chunk);
  }
  for (const chunk of chunks(allComissaoDocumentos, 200)) {
    if (!chunk.length) continue;
    await db.insert(t.comissaoDocumentos).values(chunk);
  }
  for (const chunk of chunks(allComissaoAudicoes, 200)) {
    if (!chunk.length) continue;
    await db.insert(t.comissaoAudicoes).values(chunk);
  }
  for (const chunk of chunks(allComissaoRemessas, 200)) {
    if (!chunk.length) continue;
    await db.insert(t.comissaoRemessas).values(chunk);
  }
  for (const chunk of chunks(allComissaoPublicacoes, 200)) {
    if (!chunk.length) continue;
    await db.insert(t.comissaoPublicacoes).values(chunk);
  }

  log(
    `  ✓ ${normalized.length} iniciativas · ${allAutores.length} autores · ` +
      `${allEvts.length} eventos · ${allVots.length} votações (${allVotPubs.length} pub.) · ` +
      `${allPubs.length} publicações · ${allRelacionadas.length} relacionadas · ` +
      `${allIntvs.length} debates · ${allOradorPubsFlat.length} orador.pub. · ` +
      `${allOradorDeputados.length} orador.dep. · ` +
      `${allAnexosFase.length + allAnexosIni.length} anexos · ${allPropostas.length} propostas · ` +
      `${allICs.length} conj. · ${allPCs.length} peticoes · ` +
      `${allCFs.length} comissões (${allComissaoVotacoesRaw.length} vot. · ${allComissaoRelatores.length} rel. · ${allComissaoDocumentos.length} doc.)`
  );
}

// ── Registo Biográfico ────────────────────────────────────────────────────────

async function loadRegistoBiografico() {
  log("  Fetching RegistoBiografico…");

  const rawList = await fetchJson<any[]>(REGISTO_BIOGRAFICO);
  log(`  ${rawList.length} registos`);

  const {
    deputados: bioUpdates, habilitacoes, titulos, cargosFuncoes, condecoracoes, obrasPublicadas,
    deputadoLegislaturas, orgaos,
  } = normalizeRegistoBiografico(rawList);

  // Get all known deputado IDs from DB to avoid FK violations
  const knownIds = new Set(
    (await db.select({ id: t.deputados.id }).from(t.deputados)).map((r) => r.id)
  );

  const validUpdates = bioUpdates.filter((u) => knownIds.has(u.deputadoId));
  const validIds = new Set(validUpdates.map((u) => u.deputadoId));

  // Upsert scalar bio fields on existing deputados rows
  for (const chunk of chunks(validUpdates, 500)) {
    if (!chunk.length) continue;
    for (const u of chunk) {
      await db
        .update(t.deputados)
        .set({
          dataNascimento: u.dataNascimento,
          sexo: u.sexo,
          profissao: u.profissao,
          updatedAt: sql`CASE
            WHEN deputados.data_nascimento IS DISTINCT FROM ${u.dataNascimento}::date
              OR deputados.sexo IS DISTINCT FROM ${u.sexo}
              OR deputados.profissao IS DISTINCT FROM ${u.profissao}
            THEN NOW()
            ELSE deputados.updated_at
          END`,
        })
        .where(eq(t.deputados.id, u.deputadoId));
    }
  }

  const filter = <T extends { deputadoId: number }>(arr: T[]) => arr.filter((r) => validIds.has(r.deputadoId));

  const validHab = filter(habilitacoes);
  const validTit = filter(titulos);
  const validCar = filter(cargosFuncoes);
  const validCod = filter(condecoracoes);
  const validPub = filter(obrasPublicadas);

  // legislatura_id is a real FK — the registry spans every legislature, but the DB
  // may only hold some of them, so drop the link (not the row) when unknown.
  const knownLegIds = new Set(
    (await db.select({ id: t.legislaturas.id }).from(t.legislaturas)).map((r) => r.id)
  );
  const withLeg = <T extends { legislaturaId: string | null }>(rows: T[]) =>
    rows.map((r) => ({ ...r, legislaturaId: r.legislaturaId && knownLegIds.has(r.legislaturaId) ? r.legislaturaId : null }));

  const validDepLegis = withLeg(filter(deputadoLegislaturas));
  const validOrgaos = withLeg(filter(orgaos));

  // Replace all bio sub-tables (global registry — full replace each run)
  await db.transaction(async (tx) => {
    await tx.delete(t.bioHabilitacoes);
    await tx.delete(t.bioTitulos);
    await tx.delete(t.bioCargosFuncoes);
    await tx.delete(t.bioCondecoracoes);
    await tx.delete(t.bioObrasPublicadas);
    await tx.delete(t.bioDeputadoLegislaturas);
    await tx.delete(t.bioOrgaos);

    for (const chunk of chunks(validHab, 500)) { if (chunk.length) await tx.insert(t.bioHabilitacoes).values(chunk); }
    for (const chunk of chunks(validTit, 500)) { if (chunk.length) await tx.insert(t.bioTitulos).values(chunk); }
    for (const chunk of chunks(validCar, 500)) { if (chunk.length) await tx.insert(t.bioCargosFuncoes).values(chunk); }
    for (const chunk of chunks(validCod, 500)) { if (chunk.length) await tx.insert(t.bioCondecoracoes).values(chunk); }
    for (const chunk of chunks(validPub, 500)) { if (chunk.length) await tx.insert(t.bioObrasPublicadas).values(chunk); }
    for (const chunk of chunks(validDepLegis, 500)) { if (chunk.length) await tx.insert(t.bioDeputadoLegislaturas).values(chunk); }
    for (const chunk of chunks(validOrgaos, 500)) { if (chunk.length) await tx.insert(t.bioOrgaos).values(chunk); }
  });

  log(
    `  ✓ ${validUpdates.length} deputados (${rawList.length - validUpdates.length} skipped — not in DB) · ` +
    `hab:${validHab.length} tit:${validTit.length} car:${validCar.length} cond:${validCod.length} obras:${validPub.length} · ` +
    `legis:${validDepLegis.length} órgãos:${validOrgaos.length}`
  );
}

// ── Petições ──────────────────────────────────────────────────────────────────

async function loadPeticoes(legId: string) {
  const url = PETICOES[legId];
  if (!url) {
    log(`  ! No Peticoes URL for ${legId} — skipping`);
    return;
  }

  log(`  Fetching Peticoes ${legId}…`);

  const rawList = await fetchJson<any[]>(url);
  if (!rawList.length) { log(`  ! Peticoes ${legId}: empty — skipping`); return; }

  const { peticoes, comissoes, documentos, publicacoes, relacionadas } = normalizePeticoes(rawList, legId);

  // Link petition committees to the canonical comissoes table by normalized name,
  // the same join used for comissoes_fases and ativ_cms.
  const comissaoNomeToId = new Map(
    (await db.select({ id: t.comissoes.id, nome: t.comissoes.nome }).from(t.comissoes))
      .map((r) => [r.nome.trim().toLowerCase(), r.id] as const)
  );
  const knownDeputadoIds = new Set(
    (await db.select({ id: t.deputados.id }).from(t.deputados)).map((r) => r.id)
  );

  let relatorCount = 0;
  let relFinalCount = 0;
  let cmsDocCount = 0;
  let audicaoCount = 0;
  let pedidoCount = 0;

  await db.transaction(async (tx) => {
    const existingIds = (
      await tx.select({ id: t.peticoes.id }).from(t.peticoes).where(eq(t.peticoes.legislaturaId, legId))
    ).map((r) => r.id);

    if (existingIds.length) {
      for (const chunk of chunks(existingIds, 500)) {
        await tx.delete(t.peticaoDocumentos).where(inArray(t.peticaoDocumentos.peticaoId, chunk));
        await tx.delete(t.peticaoPublicacoes).where(inArray(t.peticaoPublicacoes.peticaoId, chunk));
        await tx.delete(t.peticaoRelacionadas).where(inArray(t.peticaoRelacionadas.peticaoId, chunk));
        // peticao_comissoes cascade-deletes: peticao_relatores, peticao_relatorio_final,
        //   peticao_comissao_documentos, peticao_audicoes, peticao_pedidos_informacao
        await tx.delete(t.peticaoComissoes).where(inArray(t.peticaoComissoes.peticaoId, chunk));
      }
    }

    for (const chunk of chunks(peticoes, 500)) {
      if (!chunk.length) continue;
      await tx.insert(t.peticoes).values(chunk).onConflictDoUpdate({
        target: t.peticoes.id,
        set: {
          numero: sql`excluded.numero`,
          assunto: sql`excluded.assunto`,
          autor: sql`excluded.autor`,
          dataEntrada: sql`excluded.data_entrada`,
          assinaturas: sql`excluded.assinaturas`,
          assinaturasInicial: sql`excluded.assinaturas_inicial`,
          situacao: sql`excluded.situacao`,
          sel: sql`excluded.sel`,
          obs: sql`excluded.obs`,
          urlTexto: sql`excluded.url_texto`,
          dataDebate: sql`excluded.data_debate`,
          actividadeId: sql`excluded.actividade_id`,
          updatedAt: sql`CASE
            WHEN peticoes.assinaturas IS DISTINCT FROM excluded.assinaturas
              OR peticoes.situacao IS DISTINCT FROM excluded.situacao
            THEN NOW()
            ELSE peticoes.updated_at
          END`,
        },
      });
    }

    const allRelatores: (typeof t.peticaoRelatores.$inferInsert)[] = [];
    const allRelFinal: (typeof t.peticaoRelatorioFinal.$inferInsert)[] = [];
    const allCmsDocs: (typeof t.peticaoComissaoDocumentos.$inferInsert)[] = [];
    const allAudicoes: (typeof t.peticaoAudicoes.$inferInsert)[] = [];
    const allPedidos: (typeof t.peticaoPedidosInformacao.$inferInsert)[] = [];

    const cmsRows = comissoes.map(
      ({ _relatores: _r, _relatorioFinal: _rf, _documentos: _d, _audicoes: _a, _pedidosInformacao: _p, ...c }) => ({
        ...c,
        comissaoId: c.nome ? (comissaoNomeToId.get(c.nome.trim().toLowerCase()) ?? null) : null,
      })
    );
    let cmsOffset = 0;
    for (const chunk of chunks(cmsRows, 200)) {
      if (!chunk.length) continue;
      const returned = await tx.insert(t.peticaoComissoes).values(chunk).returning({ id: t.peticaoComissoes.id });
      for (let i = 0; i < returned.length; i++) {
        const src = comissoes[cmsOffset + i];
        const peticaoComissaoId = returned[i].id;
        for (const rel of src._relatores) {
          allRelatores.push({
            ...rel,
            peticaoComissaoId,
            deputadoId: rel.deputadoId != null && knownDeputadoIds.has(rel.deputadoId) ? rel.deputadoId : null,
          });
        }
        for (const rf of src._relatorioFinal) allRelFinal.push({ ...rf, peticaoComissaoId });
        for (const d of src._documentos) allCmsDocs.push({ ...d, peticaoComissaoId });
        for (const a of src._audicoes) allAudicoes.push({ ...a, peticaoComissaoId });
        for (const p of src._pedidosInformacao) allPedidos.push({ ...p, peticaoComissaoId });
      }
      cmsOffset += chunk.length;
    }

    for (const chunk of chunks(allRelatores, 200)) {
      if (!chunk.length) continue;
      await tx.insert(t.peticaoRelatores).values(chunk);
    }
    for (const chunk of chunks(allRelFinal, 200)) {
      if (!chunk.length) continue;
      await tx.insert(t.peticaoRelatorioFinal).values(chunk);
    }
    for (const chunk of chunks(allCmsDocs, 500)) {
      if (!chunk.length) continue;
      await tx.insert(t.peticaoComissaoDocumentos).values(chunk);
    }
    for (const chunk of chunks(allAudicoes, 500)) {
      if (!chunk.length) continue;
      await tx.insert(t.peticaoAudicoes).values(chunk);
    }
    for (const chunk of chunks(allPedidos, 500)) {
      if (!chunk.length) continue;
      await tx.insert(t.peticaoPedidosInformacao).values(chunk);
    }

    for (const chunk of chunks(documentos, 500)) {
      if (!chunk.length) continue;
      await tx.insert(t.peticaoDocumentos).values(chunk);
    }
    for (const chunk of chunks(publicacoes, 500)) {
      if (!chunk.length) continue;
      await tx.insert(t.peticaoPublicacoes).values(chunk);
    }
    for (const chunk of chunks(relacionadas, 500)) {
      if (!chunk.length) continue;
      await tx.insert(t.peticaoRelacionadas).values(chunk);
    }

    relatorCount = allRelatores.length;
    relFinalCount = allRelFinal.length;
    cmsDocCount = allCmsDocs.length;
    audicaoCount = allAudicoes.length;
    pedidoCount = allPedidos.length;
  });

  log(
    `  ✓ ${peticoes.length} petições · ${comissoes.length} comissões · ${relatorCount} relatores · ` +
    `${relFinalCount} rel.final · ${documentos.length}+${cmsDocCount} docs · ${audicaoCount} audições · ` +
    `${pedidoCount} ped.info · ${publicacoes.length} pub. · ${relacionadas.length} relacionadas`
  );
}

// ── Atividade dos Deputados ───────────────────────────────────────────────────


function toArr(v: any): any[] {
  if (!v || v === "None") return [];
  return Array.isArray(v) ? v : [v];
}

function none(v: string | null | undefined): string | null {
  return v == null || v === "None" ? null : v;
}

// Older legislatures store actDtdeb as YYYY-MM-DD HH:MM:SS; normalizer expects DD-MM-YYYY input.
function normActDate(s: string | null | undefined): string | null {
  const v = none(s);
  if (!v) return null;
  if (/^\d{4}-/.test(v)) {
    const p = v.slice(0, 10).split("-");
    return `${p[2]}-${p[1]}-${p[0]}`;
  }
  return v;
}


function adaptLegacyAtividade(raw: any): any[] {
  const deps = toArr(raw?.ArrayOfAtividadeDeputado?.AtividadeDeputado);


  return deps.map((dep: any) => {
    const d = dep.deputado ?? {};

    const gpRaw = toArr(d.depGP?.["pt_ar_wsgode_objectos_DadosSituacaoGP"] ?? d.depGP);
    const DepGP = gpRaw.map((g: any) => ({
      GpId: g.gpId, GpSigla: g.gpSigla,
      GpDtInicio: none(g.gpDtInicio), GpDtFim: none(g.gpDtFim),
    }));

    const sitRaw = toArr(d.depSituacao?.["pt_ar_wsgode_objectos_DadosSituacaoDeputado"] ?? d.depSituacao);
    const DepSituacao = sitRaw.map((s: any) => ({
      SioDes: s.sioDes, SioDtInicio: none(s.sioDtInicio), SioDtFim: none(s.sioDtFim),
    }));

    const actRaw = dep.AtividadeDeputadoList?.["pt_gov_ar_wsar_objectos_ActividadeOut"] ?? {};

    const Ini = toArr(actRaw.ini?.["pt_gov_ar_wsar_objectos_IniciativasOut"] ?? actRaw.ini)
      .map((x: any) => ({
        IniId: x.iniId, IniNr: x.iniNr, IniTp: x.iniTp,
        IniTpdesc: none(x.iniTpdesc), IniSelLg: x.iniSelLg, IniSelNr: x.iniSelNr, IniTi: none(x.iniTi),
      }));

    const Intev = toArr(actRaw.intev?.["pt_gov_ar_wsar_objectos_IntervencoesOut"] ?? actRaw.intev)
      .map((x: any) => ({
        IntId: x.intId, IntTe: none(x.intTe), IntSu: none(x.intSu),
        PubDar: none(x.pubDar), PubDtreu: none(x.pubDtreu), PubLg: none(x.pubLg),
        PubNr: none(x.pubNr), PubSl: none(x.pubSl), PubTp: none(x.pubTp), TinDs: none(x.tinDs),
      }));

    const ActP = toArr(actRaw.actP?.["pt_gov_ar_wsar_objectos_ActividadesParlamentaresOut"] ?? actRaw.actP)
      .map((x: any) => ({
        ActId: x.actId, ActNr: none(x.actNr), ActTp: none(x.actTp), ActTpdesc: none(x.actTpdesc),
        ActSelLg: none(x.actSelLg), ActSelNr: none(x.actSelNr),
        ActDtent: none(x.actDtent),       // already DD-MM-YYYY in legacy
        ActDtdeb: normActDate(x.actDtdeb), // may be ISO — convert to DD-MM-YYYY
        ActAs: none(x.actAs),
      }));

    const relRaw = actRaw.rel ?? {};
    const RelatoresIniciativas = toArr(
      relRaw.relatoresIniciativas?.["pt_gov_ar_wsar_objectos_RelatoresIniciativasOut"] ?? relRaw.relatoresIniciativas
    ).map((x: any) => ({
      IniId: x.iniId, IniNr: none(x.iniNr), IniTp: none(x.iniTp), IniSelLg: none(x.iniSelLg),
      IniTi: none(x.iniTi), RelFase: none(x.relFase), AccDtrel: null, IniLink: null,
    }));

    const DadosLegisDeputado = toArr(
      actRaw.dadosLegisDeputado?.["pt_gov_ar_wsar_objectos_DadosLegisDeputado"] ?? actRaw.dadosLegisDeputado
    ).map((x: any) => ({ Nome: none(x.nome), Dpl_lg: none(x.dpl_lg), Dpl_grpar: none(x.dpl_grpar) }));

    return {
      Deputado: {
        DepId: d.depId, DepCadId: d.depCadId,
        DepNomeParlamentar: d.depNomeParlamentar,
        DepNomeCompleto: none(d.depNomeCompleto) ?? d.depNomeParlamentar,
        DepGP: DepGP.length ? DepGP : null, DepCPId: d.depCPId, DepCPDes: none(d.depCPDes),
        DepSituacao: DepSituacao.length ? DepSituacao : null, LegDes: d.legDes ?? null, DepCargo: null,
      },
      AtividadeDeputadoList: [{
        Ini: Ini.length ? Ini : null, Req: null, Scgt: null,
        Intev: Intev.length ? Intev : null, ActP: ActP.length ? ActP : null,
        Gpa: null, DlP: null, DlE: null,
        Rel: { RelatoresIniciativas, RelatoresPeticoes: [], RelatoresContasPublicas: [], RelatoresIniEuropeias: [], AutoresPareceresIncImu: [] },
        Eventos: null, Audicoes: null, Audiencias: null, Deslocacoes: null,
        Cms: null, DadosLegisDeputado: DadosLegisDeputado.length ? DadosLegisDeputado : null, ParlamentoJovens: null,
      }],
    };
  });
}

async function loadAtividadeDeputado(legId: string) {
  const url = ATIVIDADE_DEPUTADO[legId];
  if (!url) {
    log(`  ! No AtividadeDeputado URL for ${legId} — skipping`);
    return;
  }

  const localFile = join(process.cwd(), "data", "atividade", `AtividadeDeputado${legId === "Constituinte" ? "Cons" : legId}_json.txt`);

  let raw: any;
  if (existsSync(localFile)) {
    log(`  Loading AtividadeDeputado ${legId} from local file…`);
    raw = JSON.parse(readFileSync(localFile, "utf8"));
  } else {
    log(`  Fetching AtividadeDeputado ${legId}…`);
    raw = await fetchJson<any>(url);
  }


  const rawList: any[] = Array.isArray(raw) ? raw : adaptLegacyAtividade(raw);
  if (!rawList.length) { log(`  ! AtividadeDeputado ${legId}: empty — skipping`); return; }

  // Some legislature URLs serve a different legislature's data — detect and skip.
  const actualLeg = rawList[0]?.Deputado?.LegDes;
  if (actualLeg && actualLeg !== legId) {
    log(`  ! AtividadeDeputado ${legId} serves ${actualLeg} data — skipping`);
    return;
  }

  log(`  ${rawList.length} deputados`);

  const {
    ini, req, scgt, intev, actp, gpa, dlp, dle,
    relIni, relPet, relContas, relIniEur, relPareceres,
    atividadesComissao, cms, dadosLegis, parlJovens,
  } = normalizeAtividadeDeputado(rawList, legId);

  const cmsEnriched = await (async () => {
    if (!cms.length) return cms;
    const allComissoes = await db.select({ id: t.comissoes.id, nome: t.comissoes.nome }).from(t.comissoes);
    const nomeToId = new Map(allComissoes.map(r => [r.nome.trim().toLowerCase(), r.id]));
    return cms.map(c => ({
      ...c,
      comissaoId: c.nome ? (nomeToId.get(c.nome.trim().toLowerCase()) ?? null) : null,
    }));
  })();

  await db.transaction(async (tx) => {
    const insert = async (arr: any[], table: any, chunkSize = 500) => {
      for (const chunk of chunks(arr, chunkSize)) {
        if (!chunk.length) continue;
        try {
          await tx.insert(table).values(chunk);
        } catch (e: any) {
          const cause = e?.cause ?? e;
          throw new Error(`Insert into ${table[Symbol.for("drizzle:Name")] ?? "?"} failed: ${cause?.message ?? cause}`, { cause });
        }
      }
    };

    await tx.delete(t.ativIni).where(eq(t.ativIni.legislaturaId, legId));
    await tx.delete(t.ativReq).where(eq(t.ativReq.legislaturaId, legId));
    await tx.delete(t.ativScgt).where(eq(t.ativScgt.legislaturaId, legId));
    await tx.delete(t.ativIntev).where(eq(t.ativIntev.legislaturaId, legId));
    await tx.delete(t.ativActp).where(eq(t.ativActp.legislaturaId, legId));
    await tx.delete(t.ativGpa).where(eq(t.ativGpa.legislaturaId, legId));
    await tx.delete(t.ativDlp).where(eq(t.ativDlp.legislaturaId, legId));
    await tx.delete(t.ativDle).where(eq(t.ativDle.legislaturaId, legId));
    await tx.delete(t.ativRelIni).where(eq(t.ativRelIni.legislaturaId, legId));
    await tx.delete(t.ativRelPet).where(eq(t.ativRelPet.legislaturaId, legId));
    await tx.delete(t.ativRelContas).where(eq(t.ativRelContas.legislaturaId, legId));
    await tx.delete(t.ativRelIniEur).where(eq(t.ativRelIniEur.legislaturaId, legId));
    await tx.delete(t.ativRelPareceres).where(eq(t.ativRelPareceres.legislaturaId, legId));
    await tx.delete(t.ativAtividadesComissao).where(eq(t.ativAtividadesComissao.legislaturaId, legId));
    await tx.delete(t.ativCms).where(eq(t.ativCms.legislaturaId, legId));
    await tx.delete(t.ativDadosLegis).where(eq(t.ativDadosLegis.legislaturaId, legId));
    await tx.delete(t.ativParlJovens).where(eq(t.ativParlJovens.legislaturaId, legId));

    await insert(ini, t.ativIni);
    await insert(req, t.ativReq);
    await insert(scgt, t.ativScgt);
    await insert(intev, t.ativIntev);
    await insert(actp, t.ativActp);
    await insert(gpa, t.ativGpa);
    await insert(dlp, t.ativDlp);
    await insert(dle, t.ativDle);
    await insert(relIni, t.ativRelIni);
    await insert(relPet, t.ativRelPet);
    await insert(relContas, t.ativRelContas);
    await insert(relIniEur, t.ativRelIniEur);
    await insert(relPareceres, t.ativRelPareceres);
    await insert(atividadesComissao, t.ativAtividadesComissao);
    await insert(cmsEnriched, t.ativCms);
    await insert(dadosLegis, t.ativDadosLegis);
    await insert(parlJovens, t.ativParlJovens);
  });

  log(
    `  ✓ ini:${ini.length} req:${req.length} scgt:${scgt.length} intev:${intev.length} ` +
    `actp:${actp.length} gpa:${gpa.length} dlp:${dlp.length} dle:${dle.length} ` +
    `rel.ini:${relIni.length} rel.pet:${relPet.length} rel.contas:${relContas.length} ` +
    `rel.eur:${relIniEur.length} rel.par:${relPareceres.length} ` +
    `ac:${atividadesComissao.length} cms:${cms.length} legis:${dadosLegis.length} pj:${parlJovens.length}`
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function fullyLoadedLegislaturas(): Promise<Set<string>> {
  const rows = await db
    .selectDistinct({ legId: t.iniciativas.legislaturaId })
    .from(t.iniciativas)
    .innerJoin(t.publicacoes, eq(t.publicacoes.iniciativaId, t.iniciativas.id));
  return new Set(rows.map((r) => r.legId));
}

async function main() {
  const args = process.argv.slice(2);

  const sourceIdx = args.indexOf("--source");
  let sourceFilter: string | null = null;
  if (sourceIdx !== -1) {
    sourceFilter = args[sourceIdx + 1] ?? null;
    if (!sourceFilter || !["informacao", "iniciativas", "atividade", "bio", "peticoes"].includes(sourceFilter)) {
      console.error("--source requires: informacao | iniciativas | atividade | bio | peticoes");
      process.exit(1);
    }
    args.splice(sourceIdx, 2);
  }

  const flag = args[0];
  const legArg = args[1];

  if (sourceFilter === "bio") {
    log("Loading RegistoBiografico…");
    await loadRegistoBiografico();
    log("Done.");
    process.exit(0);
  }

  if (flag === "--photos") {
    log("Syncing all deputy photos to R2…");
    const rows = await db.selectDistinct({ id: t.deputados.id }).from(t.deputados);
    await syncPhotos(rows.map((r) => r.id));
    log("Done.");
    process.exit(0);
  }

  let legs: string[];
  if (flag === "--force-all") {
    legs = LEGISLATURAS_METADATA.map((l) => l.id);
  } else if (flag === "--all") {
    const already = await fullyLoadedLegislaturas();
    legs = LEGISLATURAS_METADATA
      .map((l) => l.id)
      .filter((id) => {
        if (id === CURRENT_LEGISLATURA) return true; // always refresh current
        if (already.has(id)) {
          log(`  ↷ ${id} already loaded — skipping (use --leg ${id} to force)`);
          return false;
        }
        return true;
      });
  } else if (flag === "--current") {
    legs = [CURRENT_LEGISLATURA];
  } else if (flag === "--leg" && legArg) {
    if (!LEGISLATURAS_METADATA.find((l) => l.id === legArg)) {
      console.error(`Unknown legislature: ${legArg}`);
      process.exit(1);
    }
    legs = [legArg];
  } else {
    console.error("Usage: load.ts --all | --force-all | --current | --leg <id> | --photos [--source informacao|iniciativas|atividade]");
    process.exit(1);
  }

  log(`Loading: ${legs.join(", ")}${sourceFilter ? ` (source: ${sourceFilter})` : ""}`);
  await upsertLegislaturas();

  for (const legId of legs) {
    log(`── ${legId} ──`);
    const runAll = !sourceFilter;
    const deputadoIds = (runAll || sourceFilter === "informacao") ? await loadInformacaoBase(legId) : [];
    if (runAll || sourceFilter === "iniciativas") await loadIniciativas(legId);
    if (runAll || sourceFilter === "atividade") await loadAtividadeDeputado(legId);
    if (runAll || sourceFilter === "peticoes") await loadPeticoes(legId);
    if (runAll || sourceFilter === "informacao") await syncPhotos(deputadoIds);
  }

  if (!sourceFilter) {
    log("── Bio ──");
    await loadRegistoBiografico();
  }

  log("Done.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  if (err?.cause) console.error("Caused by:", err.cause);
  process.exit(1);
});
