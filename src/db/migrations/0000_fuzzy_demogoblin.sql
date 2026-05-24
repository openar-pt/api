CREATE TABLE "anexos" (
	"id" serial PRIMARY KEY NOT NULL,
	"iniciativa_id" integer NOT NULL,
	"evento_id" integer,
	"nome" text,
	"url" text
);
--> statement-breakpoint
CREATE TABLE "ativ_actp" (
	"id" serial PRIMARY KEY NOT NULL,
	"deputado_id" integer NOT NULL,
	"legislatura_id" text NOT NULL,
	"act_id" text,
	"act_nr" text,
	"act_tp" text,
	"act_tpdesc" text,
	"act_sel_lg" text,
	"act_sel_nr" text,
	"act_dtent" date,
	"act_dtdeb" date,
	"act_as" text
);
--> statement-breakpoint
CREATE TABLE "ativ_atividades_comissao" (
	"id" serial PRIMARY KEY NOT NULL,
	"deputado_id" integer NOT NULL,
	"legislatura_id" text NOT NULL,
	"fonte" text NOT NULL,
	"act_id" text,
	"act_as" text,
	"act_dtdes1" date,
	"act_dtdes2" date,
	"act_dtent" date,
	"act_loc" text,
	"acc_dtaud" date,
	"act_tp" text,
	"nome_entidade_externa" text,
	"act_tp_desc" text,
	"act_nr" text,
	"act_lg" text,
	"cms_no" text,
	"cms_ab" text,
	"tev_tp" text,
	"act_sl" text
);
--> statement-breakpoint
CREATE TABLE "ativ_cms" (
	"id" serial PRIMARY KEY NOT NULL,
	"deputado_id" integer NOT NULL,
	"legislatura_id" text NOT NULL,
	"cms_cd" text,
	"cms_lg" text,
	"cms_no" text,
	"cms_cargo" text,
	"cms_situacao" text,
	"cms_sub_cargo" text
);
--> statement-breakpoint
CREATE TABLE "ativ_dados_legis" (
	"id" serial PRIMARY KEY NOT NULL,
	"deputado_id" integer NOT NULL,
	"legislatura_id" text NOT NULL,
	"nome" text,
	"dpl_lg" text,
	"dpl_grpar" text
);
--> statement-breakpoint
CREATE TABLE "ativ_dle" (
	"id" serial PRIMARY KEY NOT NULL,
	"deputado_id" integer NOT NULL,
	"legislatura_id" text NOT NULL,
	"dev_id" text,
	"dev_loc" text,
	"dev_no" text,
	"dev_sel_lg" text,
	"dev_sel_nr" text,
	"dev_dtfim" date,
	"dev_dtini" date,
	"dev_tp" text
);
--> statement-breakpoint
CREATE TABLE "ativ_dlp" (
	"id" serial PRIMARY KEY NOT NULL,
	"deputado_id" integer NOT NULL,
	"legislatura_id" text NOT NULL,
	"dep_id" text,
	"dep_no" text,
	"dep_sel_lg" text,
	"dep_sel_nr" text,
	"cde_crg" text,
	"dep_reunioes" jsonb
);
--> statement-breakpoint
CREATE TABLE "ativ_gpa" (
	"id" serial PRIMARY KEY NOT NULL,
	"deputado_id" integer NOT NULL,
	"legislatura_id" text NOT NULL,
	"gpl_id" text,
	"gpl_no" text,
	"cga_dtini" date,
	"cga_dtfim" date,
	"gpl_sel_lg" text,
	"cga_crg" text
);
--> statement-breakpoint
CREATE TABLE "ativ_ini" (
	"id" serial PRIMARY KEY NOT NULL,
	"deputado_id" integer NOT NULL,
	"legislatura_id" text NOT NULL,
	"ini_id" text,
	"ini_nr" text,
	"ini_tp" text,
	"ini_tpdesc" text,
	"ini_sel_lg" text,
	"ini_sel_nr" text,
	"ini_ti" text
);
--> statement-breakpoint
CREATE TABLE "ativ_intev" (
	"id" serial PRIMARY KEY NOT NULL,
	"deputado_id" integer NOT NULL,
	"legislatura_id" text NOT NULL,
	"int_id" text,
	"int_te" text,
	"int_su" text,
	"pub_dar" text,
	"pub_dtreu" date,
	"pub_lg" text,
	"pub_nr" text,
	"pub_sl" text,
	"pub_tp" text,
	"tin_ds" text
);
--> statement-breakpoint
CREATE TABLE "ativ_parl_jovens" (
	"id" serial PRIMARY KEY NOT NULL,
	"deputado_id" integer NOT NULL,
	"legislatura_id" text NOT NULL,
	"legislatura" text,
	"data" date,
	"tipo_reuniao" text,
	"estabelecimento" text,
	"circulo_eleitoral" text,
	"sessao" text
);
--> statement-breakpoint
CREATE TABLE "ativ_rel_contas" (
	"id" serial PRIMARY KEY NOT NULL,
	"deputado_id" integer NOT NULL,
	"legislatura_id" text NOT NULL,
	"act_id" text,
	"act_as" text,
	"act_tp" text,
	"act_tp_cod" text,
	"act_sel_lg" text,
	"ano_civ" text,
	"dt_nom" date
);
--> statement-breakpoint
CREATE TABLE "ativ_rel_ini" (
	"id" serial PRIMARY KEY NOT NULL,
	"deputado_id" integer NOT NULL,
	"legislatura_id" text NOT NULL,
	"ini_id" text,
	"ini_nr" text,
	"ini_tp" text,
	"ini_sel_lg" text,
	"ini_ti" text,
	"rel_fase" text,
	"acc_dtrel" date,
	"ini_link" text
);
--> statement-breakpoint
CREATE TABLE "ativ_rel_ini_eur" (
	"id" serial PRIMARY KEY NOT NULL,
	"deputado_id" integer NOT NULL,
	"legislatura_id" text NOT NULL,
	"ine_id" text,
	"ine_referencia" text,
	"ine_titulo" text,
	"ine_tipo" text,
	"ine_data_relatorio" date,
	"ine_link" text,
	"leg" text
);
--> statement-breakpoint
CREATE TABLE "ativ_rel_pareceres" (
	"id" serial PRIMARY KEY NOT NULL,
	"deputado_id" integer NOT NULL,
	"legislatura_id" text NOT NULL,
	"act_sel_lg" text,
	"act_as" text,
	"act_id" text,
	"act_dt" date,
	"act_tp_cod" text,
	"act_tp_desc" text
);
--> statement-breakpoint
CREATE TABLE "ativ_rel_pet" (
	"id" serial PRIMARY KEY NOT NULL,
	"deputado_id" integer NOT NULL,
	"legislatura_id" text NOT NULL,
	"pet_id" text,
	"pet_nr" text,
	"pet_sel_lg_pk" text,
	"pet_sel_nr_pk" text,
	"pet_aspet" text,
	"pec_dtrelf" date
);
--> statement-breakpoint
CREATE TABLE "ativ_req" (
	"id" serial PRIMARY KEY NOT NULL,
	"deputado_id" integer NOT NULL,
	"legislatura_id" text NOT NULL,
	"req_id" text,
	"req_nr" text,
	"req_tp" text,
	"req_lg" text,
	"req_sl" text,
	"req_as" text,
	"req_dt" date,
	"req_per_tp" text
);
--> statement-breakpoint
CREATE TABLE "ativ_scgt" (
	"id" serial PRIMARY KEY NOT NULL,
	"deputado_id" integer NOT NULL,
	"legislatura_id" text NOT NULL,
	"scm_com_lg" text,
	"ccm_dscom" text,
	"scm_cd" text,
	"scm_com_cd" text,
	"cms_cargo" text,
	"cms_situacao" text
);
--> statement-breakpoint
CREATE TABLE "autores_iniciativas" (
	"id" serial PRIMARY KEY NOT NULL,
	"iniciativa_id" integer NOT NULL,
	"tipo" text NOT NULL,
	"deputado_id" integer,
	"grupo_parlamentar" text,
	"nome" text
);
--> statement-breakpoint
CREATE TABLE "circulos_eleitorais" (
	"id" serial PRIMARY KEY NOT NULL,
	"legislatura_id" text NOT NULL,
	"cp_id" integer NOT NULL,
	"nome" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "comissao_audicoes" (
	"id" serial PRIMARY KEY NOT NULL,
	"comissao_fase_id" integer NOT NULL,
	"evento_id" integer NOT NULL,
	"iniciativa_id" integer NOT NULL,
	"fonte" text NOT NULL,
	"audicao_id" text,
	"data" date,
	"tipo" text
);
--> statement-breakpoint
CREATE TABLE "comissao_documentos" (
	"id" serial PRIMARY KEY NOT NULL,
	"comissao_fase_id" integer NOT NULL,
	"evento_id" integer NOT NULL,
	"iniciativa_id" integer NOT NULL,
	"url" text,
	"data_documento" date,
	"tipo_documento" text,
	"titulo_documento" text
);
--> statement-breakpoint
CREATE TABLE "comissao_publicacoes" (
	"id" serial PRIMARY KEY NOT NULL,
	"comissao_fase_id" integer NOT NULL,
	"evento_id" integer NOT NULL,
	"iniciativa_id" integer NOT NULL,
	"tipo_ref" text NOT NULL,
	"data" date,
	"legislatura" text,
	"numero" text,
	"sessao_legislativa" text,
	"tipo" text,
	"pub_tp" text,
	"paginas" text[],
	"supl" text,
	"pag_final_diario_supl" text,
	"url_diario" text,
	"id_pag" text,
	"id_deb" text,
	"id_int" text,
	"id_act" text,
	"debate_dt_reu" text,
	"obs" text
);
--> statement-breakpoint
CREATE TABLE "comissao_relatores" (
	"id" serial PRIMARY KEY NOT NULL,
	"comissao_fase_id" integer NOT NULL,
	"evento_id" integer NOT NULL,
	"iniciativa_id" integer NOT NULL,
	"deputado_id" integer,
	"nome" text,
	"grupo_parlamentar" text,
	"data_nomeacao" date,
	"data_cessacao" date,
	"motivo_cessacao" text
);
--> statement-breakpoint
CREATE TABLE "comissao_remessas" (
	"id" serial PRIMARY KEY NOT NULL,
	"comissao_fase_id" integer NOT NULL,
	"evento_id" integer NOT NULL,
	"iniciativa_id" integer NOT NULL,
	"data_remessa" date,
	"observacoes" text,
	"tipo_remessa" text,
	"numero_oficio" text,
	"data_documento" date
);
--> statement-breakpoint
CREATE TABLE "comissao_votacao_publicacoes" (
	"id" serial PRIMARY KEY NOT NULL,
	"comissao_votacao_id" integer NOT NULL,
	"evento_id" integer NOT NULL,
	"iniciativa_id" integer NOT NULL,
	"data" date,
	"legislatura" text,
	"numero" text,
	"sessao_legislativa" text,
	"tipo" text,
	"pub_tp" text,
	"paginas" text[],
	"supl" text,
	"pag_final_diario_supl" text,
	"url_diario" text,
	"id_pag" text,
	"id_deb" text,
	"id_int" text,
	"id_act" text,
	"debate_dt_reu" text,
	"obs" text
);
--> statement-breakpoint
CREATE TABLE "comissao_votacoes" (
	"id" serial PRIMARY KEY NOT NULL,
	"comissao_fase_id" integer NOT NULL,
	"evento_id" integer NOT NULL,
	"iniciativa_id" integer NOT NULL,
	"votacao_id" text,
	"data" date,
	"resultado" text,
	"unanime" boolean,
	"reuniao" text,
	"tipo_reuniao" text,
	"descricao" text,
	"detalhe" text,
	"a_favor" text[],
	"contra" text[],
	"abstencao" text[],
	"ausencias" text[]
);
--> statement-breakpoint
CREATE TABLE "comissoes_fases" (
	"id" serial PRIMARY KEY NOT NULL,
	"evento_id" integer NOT NULL,
	"iniciativa_id" integer NOT NULL,
	"acc_id" text,
	"sigla" text,
	"nome" text,
	"numero" text,
	"sessao" text,
	"legislatura" text,
	"competente" boolean,
	"observacao" text,
	"prorrogado" text,
	"data_entrada" date,
	"data_remessa" date,
	"data_relatorio" date,
	"data_distribuicao" date,
	"data_inicio_apreciacao_publica" date,
	"data_fim_apreciacao_publica" date,
	"data_agendamento_plenario" date,
	"data_agendamento_discussao" date,
	"data_req_agendamento_plenario" date,
	"aguarda_agendamento_plenario" text,
	"gp_agendamento_plenario" text,
	"motivo_nao_parecer" text,
	"data_motivo_nao_parecer" date,
	"remessa_redacao_final" text,
	"distribuicao_subcomissao" jsonb,
	"data_distribuicao_subcomissao" date,
	"pedidos_parecer" jsonb,
	"pareceres_recebidos" jsonb
);
--> statement-breakpoint
CREATE TABLE "deputado_cargos" (
	"id" serial PRIMARY KEY NOT NULL,
	"deputado_id" integer NOT NULL,
	"legislatura_id" text NOT NULL,
	"car_id" integer,
	"car_des" text,
	"car_dt_inicio" date,
	"car_dt_fim" date
);
--> statement-breakpoint
CREATE TABLE "deputado_situacoes" (
	"id" serial PRIMARY KEY NOT NULL,
	"deputado_id" integer NOT NULL,
	"legislatura_id" text NOT NULL,
	"sio_des" text,
	"sio_dt_inicio" date,
	"sio_dt_fim" date
);
--> statement-breakpoint
CREATE TABLE "deputados" (
	"id" integer PRIMARY KEY NOT NULL,
	"dep_id" integer,
	"nome_completo" text NOT NULL,
	"nome_parlamentar" text NOT NULL,
	"videos" jsonb
);
--> statement-breakpoint
CREATE TABLE "eventos" (
	"id" serial PRIMARY KEY NOT NULL,
	"iniciativa_id" integer NOT NULL,
	"oev_id" text,
	"evt_id" text,
	"fase" text NOT NULL,
	"codigo_fase" text,
	"data_fase" date,
	"obs" text,
	"act_id" text,
	"oev_text_id" text,
	"recurso_deputados" text[],
	"recurso_gp" text[],
	"textos_aprovados" text,
	"actividades_conjuntas" jsonb,
	"pcpublicas_conjuntas" jsonb,
	"links" jsonb
);
--> statement-breakpoint
CREATE TABLE "grupos_parlamentares" (
	"id" serial PRIMARY KEY NOT NULL,
	"legislatura_id" text NOT NULL,
	"sigla" text NOT NULL,
	"nome" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "iniciativas" (
	"id" integer PRIMARY KEY NOT NULL,
	"legislatura_id" text NOT NULL,
	"numero" text NOT NULL,
	"tipo" text NOT NULL,
	"tipo_desc" text NOT NULL,
	"titulo" text NOT NULL,
	"epigrafe" text,
	"data_entrada" date,
	"data_fim" date,
	"estado" text,
	"link_texto" text,
	"texto_substituido" boolean DEFAULT false,
	"texto_subst_campo" text,
	"obs" text,
	"sel" text,
	"links" jsonb
);
--> statement-breakpoint
CREATE TABLE "iniciativas_conjuntas" (
	"id" serial PRIMARY KEY NOT NULL,
	"evento_id" integer NOT NULL,
	"iniciativa_id" integer NOT NULL,
	"conjunta_id" text,
	"conjunta_leg" text,
	"conjunta_nr" text,
	"conjunta_tipo" text,
	"conjunta_desc_tipo" text,
	"conjunta_titulo" text,
	"conjunta_sel" text,
	"conjunta_data_entrada" date
);
--> statement-breakpoint
CREATE TABLE "iniciativas_relacionadas" (
	"id" serial PRIMARY KEY NOT NULL,
	"iniciativa_id" integer NOT NULL,
	"tipo" text NOT NULL,
	"rel_id" text,
	"rel_legislatura" text,
	"rel_numero" text,
	"rel_sessao" text,
	"rel_tipo" text,
	"rel_desc_tipo" text,
	"rel_assunto" text,
	"rel_dcl" jsonb,
	"url_europeia" text
);
--> statement-breakpoint
CREATE TABLE "intervencoesdebates" (
	"id" serial PRIMARY KEY NOT NULL,
	"evento_id" integer NOT NULL,
	"iniciativa_id" integer NOT NULL,
	"data_reuniao" date
);
--> statement-breakpoint
CREATE TABLE "legislaturas" (
	"id" text PRIMARY KEY NOT NULL,
	"nome" text NOT NULL,
	"data_inicio" date,
	"data_fim" date,
	"ar_id" text,
	"sigla_antiga" text
);
--> statement-breakpoint
CREATE TABLE "mandatos" (
	"id" serial PRIMARY KEY NOT NULL,
	"deputado_id" integer NOT NULL,
	"legislatura_id" text NOT NULL,
	"grupo_parlamentar" text,
	"gp_id" integer,
	"circulo_eleitoral" text,
	"data_inicio" date,
	"data_fim" date,
	"situacao" text
);
--> statement-breakpoint
CREATE TABLE "orador_publicacoes" (
	"id" serial PRIMARY KEY NOT NULL,
	"orador_id" integer NOT NULL,
	"evento_id" integer NOT NULL,
	"iniciativa_id" integer NOT NULL,
	"data" date,
	"legislatura" text,
	"numero" text,
	"sessao_legislativa" text,
	"tipo" text,
	"pub_tp" text,
	"paginas" text[],
	"supl" text,
	"pag_final_diario_supl" text,
	"url_diario" text,
	"id_pag" text,
	"id_deb" text,
	"id_int" text,
	"id_act" text,
	"debate_dt_reu" text,
	"obs" text
);
--> statement-breakpoint
CREATE TABLE "oradores" (
	"id" serial PRIMARY KEY NOT NULL,
	"intervencao_id" integer NOT NULL,
	"fase_debate" text,
	"fase_sessao" text,
	"hora_inicio" text,
	"hora_termo" text,
	"sumario" text,
	"teor" text,
	"link_videos" text[],
	"deputados" jsonb,
	"membro_governo_nome" text,
	"membro_governo_cargo" text,
	"membro_governo_governo" text,
	"convidado_nome" text,
	"convidado_cargo" text,
	"convidado_pais" text,
	"convidado_honra" text
);
--> statement-breakpoint
CREATE TABLE "peticoes_conjuntas" (
	"id" serial PRIMARY KEY NOT NULL,
	"evento_id" integer NOT NULL,
	"iniciativa_id" integer NOT NULL,
	"peticao_id" text,
	"peticao_leg" text,
	"peticao_nr" text,
	"peticao_tipo" text,
	"peticao_desc_tipo" text,
	"peticao_titulo" text,
	"peticao_sel" text,
	"peticao_data_entrada" date
);
--> statement-breakpoint
CREATE TABLE "proposta_publicacoes" (
	"id" serial PRIMARY KEY NOT NULL,
	"proposta_alteracao_id" integer NOT NULL,
	"iniciativa_id" integer NOT NULL,
	"data" date,
	"legislatura" text,
	"numero" text,
	"sessao_legislativa" text,
	"tipo" text,
	"pub_tp" text,
	"paginas" text[],
	"supl" text,
	"pag_final_diario_supl" text,
	"url_diario" text,
	"id_pag" text,
	"id_deb" text,
	"id_int" text,
	"id_act" text,
	"debate_dt_reu" text,
	"obs" text
);
--> statement-breakpoint
CREATE TABLE "propostas_alteracao" (
	"id" serial PRIMARY KEY NOT NULL,
	"iniciativa_id" integer NOT NULL,
	"proposta_id" text,
	"autor" text,
	"tipo" text
);
--> statement-breakpoint
CREATE TABLE "publicacoes" (
	"id" serial PRIMARY KEY NOT NULL,
	"evento_id" integer NOT NULL,
	"iniciativa_id" integer NOT NULL,
	"data" date,
	"legislatura" text,
	"numero" text,
	"sessao_legislativa" text,
	"tipo" text,
	"pub_tp" text,
	"paginas" text[],
	"supl" text,
	"pag_final_diario_supl" text,
	"url_diario" text,
	"id_pag" text,
	"id_deb" text,
	"id_int" text,
	"id_act" text,
	"debate_dt_reu" text,
	"obs" text
);
--> statement-breakpoint
CREATE TABLE "sessoes_legislativas" (
	"id" serial PRIMARY KEY NOT NULL,
	"legislatura_id" text NOT NULL,
	"num_sessao" text,
	"data_inicio" date,
	"data_fim" date
);
--> statement-breakpoint
CREATE TABLE "votacao_publicacoes" (
	"id" serial PRIMARY KEY NOT NULL,
	"votacao_ini_id" integer NOT NULL,
	"votacao_id" text NOT NULL,
	"evento_id" integer NOT NULL,
	"data" date,
	"legislatura" text,
	"numero" text,
	"sessao_legislativa" text,
	"tipo" text,
	"pub_tp" text,
	"paginas" text[],
	"supl" text,
	"pag_final_diario_supl" text,
	"url_diario" text,
	"id_pag" text,
	"id_deb" text,
	"id_int" text,
	"id_act" text,
	"debate_dt_reu" text,
	"obs" text
);
--> statement-breakpoint
CREATE TABLE "votacoes" (
	"id" text NOT NULL,
	"evento_id" integer NOT NULL,
	"iniciativa_id" integer NOT NULL,
	"data" date,
	"resultado" text NOT NULL,
	"unanime" boolean DEFAULT false,
	"reuniao" text,
	"tipo_reuniao" text,
	"descricao" text,
	"detalhe" text,
	"a_favor" text[],
	"contra" text[],
	"abstencao" text[],
	"ausencias" text[],
	CONSTRAINT "votacoes_iniciativa_id_id_pk" PRIMARY KEY("iniciativa_id","id")
);
--> statement-breakpoint
ALTER TABLE "anexos" ADD CONSTRAINT "anexos_iniciativa_id_iniciativas_id_fk" FOREIGN KEY ("iniciativa_id") REFERENCES "public"."iniciativas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "anexos" ADD CONSTRAINT "anexos_evento_id_eventos_id_fk" FOREIGN KEY ("evento_id") REFERENCES "public"."eventos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ativ_actp" ADD CONSTRAINT "ativ_actp_deputado_id_deputados_id_fk" FOREIGN KEY ("deputado_id") REFERENCES "public"."deputados"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ativ_actp" ADD CONSTRAINT "ativ_actp_legislatura_id_legislaturas_id_fk" FOREIGN KEY ("legislatura_id") REFERENCES "public"."legislaturas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ativ_atividades_comissao" ADD CONSTRAINT "ativ_atividades_comissao_deputado_id_deputados_id_fk" FOREIGN KEY ("deputado_id") REFERENCES "public"."deputados"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ativ_atividades_comissao" ADD CONSTRAINT "ativ_atividades_comissao_legislatura_id_legislaturas_id_fk" FOREIGN KEY ("legislatura_id") REFERENCES "public"."legislaturas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ativ_cms" ADD CONSTRAINT "ativ_cms_deputado_id_deputados_id_fk" FOREIGN KEY ("deputado_id") REFERENCES "public"."deputados"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ativ_cms" ADD CONSTRAINT "ativ_cms_legislatura_id_legislaturas_id_fk" FOREIGN KEY ("legislatura_id") REFERENCES "public"."legislaturas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ativ_dados_legis" ADD CONSTRAINT "ativ_dados_legis_deputado_id_deputados_id_fk" FOREIGN KEY ("deputado_id") REFERENCES "public"."deputados"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ativ_dados_legis" ADD CONSTRAINT "ativ_dados_legis_legislatura_id_legislaturas_id_fk" FOREIGN KEY ("legislatura_id") REFERENCES "public"."legislaturas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ativ_dle" ADD CONSTRAINT "ativ_dle_deputado_id_deputados_id_fk" FOREIGN KEY ("deputado_id") REFERENCES "public"."deputados"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ativ_dle" ADD CONSTRAINT "ativ_dle_legislatura_id_legislaturas_id_fk" FOREIGN KEY ("legislatura_id") REFERENCES "public"."legislaturas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ativ_dlp" ADD CONSTRAINT "ativ_dlp_deputado_id_deputados_id_fk" FOREIGN KEY ("deputado_id") REFERENCES "public"."deputados"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ativ_dlp" ADD CONSTRAINT "ativ_dlp_legislatura_id_legislaturas_id_fk" FOREIGN KEY ("legislatura_id") REFERENCES "public"."legislaturas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ativ_gpa" ADD CONSTRAINT "ativ_gpa_deputado_id_deputados_id_fk" FOREIGN KEY ("deputado_id") REFERENCES "public"."deputados"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ativ_gpa" ADD CONSTRAINT "ativ_gpa_legislatura_id_legislaturas_id_fk" FOREIGN KEY ("legislatura_id") REFERENCES "public"."legislaturas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ativ_ini" ADD CONSTRAINT "ativ_ini_deputado_id_deputados_id_fk" FOREIGN KEY ("deputado_id") REFERENCES "public"."deputados"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ativ_ini" ADD CONSTRAINT "ativ_ini_legislatura_id_legislaturas_id_fk" FOREIGN KEY ("legislatura_id") REFERENCES "public"."legislaturas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ativ_intev" ADD CONSTRAINT "ativ_intev_deputado_id_deputados_id_fk" FOREIGN KEY ("deputado_id") REFERENCES "public"."deputados"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ativ_intev" ADD CONSTRAINT "ativ_intev_legislatura_id_legislaturas_id_fk" FOREIGN KEY ("legislatura_id") REFERENCES "public"."legislaturas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ativ_parl_jovens" ADD CONSTRAINT "ativ_parl_jovens_deputado_id_deputados_id_fk" FOREIGN KEY ("deputado_id") REFERENCES "public"."deputados"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ativ_parl_jovens" ADD CONSTRAINT "ativ_parl_jovens_legislatura_id_legislaturas_id_fk" FOREIGN KEY ("legislatura_id") REFERENCES "public"."legislaturas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ativ_rel_contas" ADD CONSTRAINT "ativ_rel_contas_deputado_id_deputados_id_fk" FOREIGN KEY ("deputado_id") REFERENCES "public"."deputados"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ativ_rel_contas" ADD CONSTRAINT "ativ_rel_contas_legislatura_id_legislaturas_id_fk" FOREIGN KEY ("legislatura_id") REFERENCES "public"."legislaturas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ativ_rel_ini" ADD CONSTRAINT "ativ_rel_ini_deputado_id_deputados_id_fk" FOREIGN KEY ("deputado_id") REFERENCES "public"."deputados"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ativ_rel_ini" ADD CONSTRAINT "ativ_rel_ini_legislatura_id_legislaturas_id_fk" FOREIGN KEY ("legislatura_id") REFERENCES "public"."legislaturas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ativ_rel_ini_eur" ADD CONSTRAINT "ativ_rel_ini_eur_deputado_id_deputados_id_fk" FOREIGN KEY ("deputado_id") REFERENCES "public"."deputados"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ativ_rel_ini_eur" ADD CONSTRAINT "ativ_rel_ini_eur_legislatura_id_legislaturas_id_fk" FOREIGN KEY ("legislatura_id") REFERENCES "public"."legislaturas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ativ_rel_pareceres" ADD CONSTRAINT "ativ_rel_pareceres_deputado_id_deputados_id_fk" FOREIGN KEY ("deputado_id") REFERENCES "public"."deputados"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ativ_rel_pareceres" ADD CONSTRAINT "ativ_rel_pareceres_legislatura_id_legislaturas_id_fk" FOREIGN KEY ("legislatura_id") REFERENCES "public"."legislaturas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ativ_rel_pet" ADD CONSTRAINT "ativ_rel_pet_deputado_id_deputados_id_fk" FOREIGN KEY ("deputado_id") REFERENCES "public"."deputados"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ativ_rel_pet" ADD CONSTRAINT "ativ_rel_pet_legislatura_id_legislaturas_id_fk" FOREIGN KEY ("legislatura_id") REFERENCES "public"."legislaturas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ativ_req" ADD CONSTRAINT "ativ_req_deputado_id_deputados_id_fk" FOREIGN KEY ("deputado_id") REFERENCES "public"."deputados"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ativ_req" ADD CONSTRAINT "ativ_req_legislatura_id_legislaturas_id_fk" FOREIGN KEY ("legislatura_id") REFERENCES "public"."legislaturas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ativ_scgt" ADD CONSTRAINT "ativ_scgt_deputado_id_deputados_id_fk" FOREIGN KEY ("deputado_id") REFERENCES "public"."deputados"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ativ_scgt" ADD CONSTRAINT "ativ_scgt_legislatura_id_legislaturas_id_fk" FOREIGN KEY ("legislatura_id") REFERENCES "public"."legislaturas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "autores_iniciativas" ADD CONSTRAINT "autores_iniciativas_iniciativa_id_iniciativas_id_fk" FOREIGN KEY ("iniciativa_id") REFERENCES "public"."iniciativas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "autores_iniciativas" ADD CONSTRAINT "autores_iniciativas_deputado_id_deputados_id_fk" FOREIGN KEY ("deputado_id") REFERENCES "public"."deputados"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "circulos_eleitorais" ADD CONSTRAINT "circulos_eleitorais_legislatura_id_legislaturas_id_fk" FOREIGN KEY ("legislatura_id") REFERENCES "public"."legislaturas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comissao_audicoes" ADD CONSTRAINT "comissao_audicoes_comissao_fase_id_comissoes_fases_id_fk" FOREIGN KEY ("comissao_fase_id") REFERENCES "public"."comissoes_fases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comissao_audicoes" ADD CONSTRAINT "comissao_audicoes_evento_id_eventos_id_fk" FOREIGN KEY ("evento_id") REFERENCES "public"."eventos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comissao_audicoes" ADD CONSTRAINT "comissao_audicoes_iniciativa_id_iniciativas_id_fk" FOREIGN KEY ("iniciativa_id") REFERENCES "public"."iniciativas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comissao_documentos" ADD CONSTRAINT "comissao_documentos_comissao_fase_id_comissoes_fases_id_fk" FOREIGN KEY ("comissao_fase_id") REFERENCES "public"."comissoes_fases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comissao_documentos" ADD CONSTRAINT "comissao_documentos_evento_id_eventos_id_fk" FOREIGN KEY ("evento_id") REFERENCES "public"."eventos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comissao_documentos" ADD CONSTRAINT "comissao_documentos_iniciativa_id_iniciativas_id_fk" FOREIGN KEY ("iniciativa_id") REFERENCES "public"."iniciativas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comissao_publicacoes" ADD CONSTRAINT "comissao_publicacoes_comissao_fase_id_comissoes_fases_id_fk" FOREIGN KEY ("comissao_fase_id") REFERENCES "public"."comissoes_fases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comissao_publicacoes" ADD CONSTRAINT "comissao_publicacoes_evento_id_eventos_id_fk" FOREIGN KEY ("evento_id") REFERENCES "public"."eventos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comissao_publicacoes" ADD CONSTRAINT "comissao_publicacoes_iniciativa_id_iniciativas_id_fk" FOREIGN KEY ("iniciativa_id") REFERENCES "public"."iniciativas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comissao_relatores" ADD CONSTRAINT "comissao_relatores_comissao_fase_id_comissoes_fases_id_fk" FOREIGN KEY ("comissao_fase_id") REFERENCES "public"."comissoes_fases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comissao_relatores" ADD CONSTRAINT "comissao_relatores_evento_id_eventos_id_fk" FOREIGN KEY ("evento_id") REFERENCES "public"."eventos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comissao_relatores" ADD CONSTRAINT "comissao_relatores_iniciativa_id_iniciativas_id_fk" FOREIGN KEY ("iniciativa_id") REFERENCES "public"."iniciativas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comissao_relatores" ADD CONSTRAINT "comissao_relatores_deputado_id_deputados_id_fk" FOREIGN KEY ("deputado_id") REFERENCES "public"."deputados"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comissao_remessas" ADD CONSTRAINT "comissao_remessas_comissao_fase_id_comissoes_fases_id_fk" FOREIGN KEY ("comissao_fase_id") REFERENCES "public"."comissoes_fases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comissao_remessas" ADD CONSTRAINT "comissao_remessas_evento_id_eventos_id_fk" FOREIGN KEY ("evento_id") REFERENCES "public"."eventos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comissao_remessas" ADD CONSTRAINT "comissao_remessas_iniciativa_id_iniciativas_id_fk" FOREIGN KEY ("iniciativa_id") REFERENCES "public"."iniciativas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comissao_votacao_publicacoes" ADD CONSTRAINT "comissao_votacao_publicacoes_comissao_votacao_id_comissao_votacoes_id_fk" FOREIGN KEY ("comissao_votacao_id") REFERENCES "public"."comissao_votacoes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comissao_votacao_publicacoes" ADD CONSTRAINT "comissao_votacao_publicacoes_evento_id_eventos_id_fk" FOREIGN KEY ("evento_id") REFERENCES "public"."eventos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comissao_votacao_publicacoes" ADD CONSTRAINT "comissao_votacao_publicacoes_iniciativa_id_iniciativas_id_fk" FOREIGN KEY ("iniciativa_id") REFERENCES "public"."iniciativas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comissao_votacoes" ADD CONSTRAINT "comissao_votacoes_comissao_fase_id_comissoes_fases_id_fk" FOREIGN KEY ("comissao_fase_id") REFERENCES "public"."comissoes_fases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comissao_votacoes" ADD CONSTRAINT "comissao_votacoes_evento_id_eventos_id_fk" FOREIGN KEY ("evento_id") REFERENCES "public"."eventos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comissao_votacoes" ADD CONSTRAINT "comissao_votacoes_iniciativa_id_iniciativas_id_fk" FOREIGN KEY ("iniciativa_id") REFERENCES "public"."iniciativas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comissoes_fases" ADD CONSTRAINT "comissoes_fases_evento_id_eventos_id_fk" FOREIGN KEY ("evento_id") REFERENCES "public"."eventos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comissoes_fases" ADD CONSTRAINT "comissoes_fases_iniciativa_id_iniciativas_id_fk" FOREIGN KEY ("iniciativa_id") REFERENCES "public"."iniciativas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deputado_cargos" ADD CONSTRAINT "deputado_cargos_deputado_id_deputados_id_fk" FOREIGN KEY ("deputado_id") REFERENCES "public"."deputados"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deputado_cargos" ADD CONSTRAINT "deputado_cargos_legislatura_id_legislaturas_id_fk" FOREIGN KEY ("legislatura_id") REFERENCES "public"."legislaturas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deputado_situacoes" ADD CONSTRAINT "deputado_situacoes_deputado_id_deputados_id_fk" FOREIGN KEY ("deputado_id") REFERENCES "public"."deputados"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deputado_situacoes" ADD CONSTRAINT "deputado_situacoes_legislatura_id_legislaturas_id_fk" FOREIGN KEY ("legislatura_id") REFERENCES "public"."legislaturas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "eventos" ADD CONSTRAINT "eventos_iniciativa_id_iniciativas_id_fk" FOREIGN KEY ("iniciativa_id") REFERENCES "public"."iniciativas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grupos_parlamentares" ADD CONSTRAINT "grupos_parlamentares_legislatura_id_legislaturas_id_fk" FOREIGN KEY ("legislatura_id") REFERENCES "public"."legislaturas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "iniciativas" ADD CONSTRAINT "iniciativas_legislatura_id_legislaturas_id_fk" FOREIGN KEY ("legislatura_id") REFERENCES "public"."legislaturas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "iniciativas_conjuntas" ADD CONSTRAINT "iniciativas_conjuntas_evento_id_eventos_id_fk" FOREIGN KEY ("evento_id") REFERENCES "public"."eventos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "iniciativas_conjuntas" ADD CONSTRAINT "iniciativas_conjuntas_iniciativa_id_iniciativas_id_fk" FOREIGN KEY ("iniciativa_id") REFERENCES "public"."iniciativas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "iniciativas_relacionadas" ADD CONSTRAINT "iniciativas_relacionadas_iniciativa_id_iniciativas_id_fk" FOREIGN KEY ("iniciativa_id") REFERENCES "public"."iniciativas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "intervencoesdebates" ADD CONSTRAINT "intervencoesdebates_evento_id_eventos_id_fk" FOREIGN KEY ("evento_id") REFERENCES "public"."eventos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "intervencoesdebates" ADD CONSTRAINT "intervencoesdebates_iniciativa_id_iniciativas_id_fk" FOREIGN KEY ("iniciativa_id") REFERENCES "public"."iniciativas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mandatos" ADD CONSTRAINT "mandatos_deputado_id_deputados_id_fk" FOREIGN KEY ("deputado_id") REFERENCES "public"."deputados"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mandatos" ADD CONSTRAINT "mandatos_legislatura_id_legislaturas_id_fk" FOREIGN KEY ("legislatura_id") REFERENCES "public"."legislaturas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orador_publicacoes" ADD CONSTRAINT "orador_publicacoes_orador_id_oradores_id_fk" FOREIGN KEY ("orador_id") REFERENCES "public"."oradores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orador_publicacoes" ADD CONSTRAINT "orador_publicacoes_evento_id_eventos_id_fk" FOREIGN KEY ("evento_id") REFERENCES "public"."eventos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orador_publicacoes" ADD CONSTRAINT "orador_publicacoes_iniciativa_id_iniciativas_id_fk" FOREIGN KEY ("iniciativa_id") REFERENCES "public"."iniciativas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "oradores" ADD CONSTRAINT "oradores_intervencao_id_intervencoesdebates_id_fk" FOREIGN KEY ("intervencao_id") REFERENCES "public"."intervencoesdebates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "peticoes_conjuntas" ADD CONSTRAINT "peticoes_conjuntas_evento_id_eventos_id_fk" FOREIGN KEY ("evento_id") REFERENCES "public"."eventos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "peticoes_conjuntas" ADD CONSTRAINT "peticoes_conjuntas_iniciativa_id_iniciativas_id_fk" FOREIGN KEY ("iniciativa_id") REFERENCES "public"."iniciativas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposta_publicacoes" ADD CONSTRAINT "proposta_publicacoes_proposta_alteracao_id_propostas_alteracao_id_fk" FOREIGN KEY ("proposta_alteracao_id") REFERENCES "public"."propostas_alteracao"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposta_publicacoes" ADD CONSTRAINT "proposta_publicacoes_iniciativa_id_iniciativas_id_fk" FOREIGN KEY ("iniciativa_id") REFERENCES "public"."iniciativas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "propostas_alteracao" ADD CONSTRAINT "propostas_alteracao_iniciativa_id_iniciativas_id_fk" FOREIGN KEY ("iniciativa_id") REFERENCES "public"."iniciativas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "publicacoes" ADD CONSTRAINT "publicacoes_evento_id_eventos_id_fk" FOREIGN KEY ("evento_id") REFERENCES "public"."eventos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "publicacoes" ADD CONSTRAINT "publicacoes_iniciativa_id_iniciativas_id_fk" FOREIGN KEY ("iniciativa_id") REFERENCES "public"."iniciativas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessoes_legislativas" ADD CONSTRAINT "sessoes_legislativas_legislatura_id_legislaturas_id_fk" FOREIGN KEY ("legislatura_id") REFERENCES "public"."legislaturas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "votacao_publicacoes" ADD CONSTRAINT "votacao_publicacoes_votacao_ini_id_iniciativas_id_fk" FOREIGN KEY ("votacao_ini_id") REFERENCES "public"."iniciativas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "votacao_publicacoes" ADD CONSTRAINT "votacao_publicacoes_evento_id_eventos_id_fk" FOREIGN KEY ("evento_id") REFERENCES "public"."eventos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "votacoes" ADD CONSTRAINT "votacoes_evento_id_eventos_id_fk" FOREIGN KEY ("evento_id") REFERENCES "public"."eventos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "votacoes" ADD CONSTRAINT "votacoes_iniciativa_id_iniciativas_id_fk" FOREIGN KEY ("iniciativa_id") REFERENCES "public"."iniciativas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_anexos_iniciativa" ON "anexos" USING btree ("iniciativa_id");--> statement-breakpoint
CREATE INDEX "idx_anexos_evento" ON "anexos" USING btree ("evento_id");--> statement-breakpoint
CREATE INDEX "idx_ativ_actp_dep" ON "ativ_actp" USING btree ("deputado_id");--> statement-breakpoint
CREATE INDEX "idx_ativ_ac_dep" ON "ativ_atividades_comissao" USING btree ("deputado_id");--> statement-breakpoint
CREATE INDEX "idx_ativ_ac_fonte" ON "ativ_atividades_comissao" USING btree ("fonte");--> statement-breakpoint
CREATE INDEX "idx_ativ_cms_dep" ON "ativ_cms" USING btree ("deputado_id");--> statement-breakpoint
CREATE INDEX "idx_ativ_dados_legis_dep" ON "ativ_dados_legis" USING btree ("deputado_id");--> statement-breakpoint
CREATE INDEX "idx_ativ_dle_dep" ON "ativ_dle" USING btree ("deputado_id");--> statement-breakpoint
CREATE INDEX "idx_ativ_dlp_dep" ON "ativ_dlp" USING btree ("deputado_id");--> statement-breakpoint
CREATE INDEX "idx_ativ_gpa_dep" ON "ativ_gpa" USING btree ("deputado_id");--> statement-breakpoint
CREATE INDEX "idx_ativ_ini_dep" ON "ativ_ini" USING btree ("deputado_id");--> statement-breakpoint
CREATE INDEX "idx_ativ_ini_leg" ON "ativ_ini" USING btree ("legislatura_id");--> statement-breakpoint
CREATE INDEX "idx_ativ_intev_dep" ON "ativ_intev" USING btree ("deputado_id");--> statement-breakpoint
CREATE INDEX "idx_ativ_parl_jovens_dep" ON "ativ_parl_jovens" USING btree ("deputado_id");--> statement-breakpoint
CREATE INDEX "idx_ativ_rel_contas_dep" ON "ativ_rel_contas" USING btree ("deputado_id");--> statement-breakpoint
CREATE INDEX "idx_ativ_rel_ini_dep" ON "ativ_rel_ini" USING btree ("deputado_id");--> statement-breakpoint
CREATE INDEX "idx_ativ_rel_ini_eur_dep" ON "ativ_rel_ini_eur" USING btree ("deputado_id");--> statement-breakpoint
CREATE INDEX "idx_ativ_rel_pareceres_dep" ON "ativ_rel_pareceres" USING btree ("deputado_id");--> statement-breakpoint
CREATE INDEX "idx_ativ_rel_pet_dep" ON "ativ_rel_pet" USING btree ("deputado_id");--> statement-breakpoint
CREATE INDEX "idx_ativ_req_dep" ON "ativ_req" USING btree ("deputado_id");--> statement-breakpoint
CREATE INDEX "idx_ativ_scgt_dep" ON "ativ_scgt" USING btree ("deputado_id");--> statement-breakpoint
CREATE INDEX "idx_autores_iniciativa" ON "autores_iniciativas" USING btree ("iniciativa_id");--> statement-breakpoint
CREATE INDEX "idx_autores_grupo" ON "autores_iniciativas" USING btree ("grupo_parlamentar");--> statement-breakpoint
CREATE INDEX "idx_autores_deputado" ON "autores_iniciativas" USING btree ("deputado_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_circulo_legislatura" ON "circulos_eleitorais" USING btree ("legislatura_id","cp_id");--> statement-breakpoint
CREATE INDEX "idx_comissao_audicoes_fase" ON "comissao_audicoes" USING btree ("comissao_fase_id");--> statement-breakpoint
CREATE INDEX "idx_comissao_audicoes_iniciativa" ON "comissao_audicoes" USING btree ("iniciativa_id");--> statement-breakpoint
CREATE INDEX "idx_comissao_documentos_fase" ON "comissao_documentos" USING btree ("comissao_fase_id");--> statement-breakpoint
CREATE INDEX "idx_comissao_documentos_iniciativa" ON "comissao_documentos" USING btree ("iniciativa_id");--> statement-breakpoint
CREATE INDEX "idx_comissao_publicacoes_fase" ON "comissao_publicacoes" USING btree ("comissao_fase_id");--> statement-breakpoint
CREATE INDEX "idx_comissao_publicacoes_iniciativa" ON "comissao_publicacoes" USING btree ("iniciativa_id");--> statement-breakpoint
CREATE INDEX "idx_comissao_relatores_fase" ON "comissao_relatores" USING btree ("comissao_fase_id");--> statement-breakpoint
CREATE INDEX "idx_comissao_relatores_deputado" ON "comissao_relatores" USING btree ("deputado_id");--> statement-breakpoint
CREATE INDEX "idx_comissao_relatores_iniciativa" ON "comissao_relatores" USING btree ("iniciativa_id");--> statement-breakpoint
CREATE INDEX "idx_comissao_remessas_fase" ON "comissao_remessas" USING btree ("comissao_fase_id");--> statement-breakpoint
CREATE INDEX "idx_comissao_votacao_pub_votacao" ON "comissao_votacao_publicacoes" USING btree ("comissao_votacao_id");--> statement-breakpoint
CREATE INDEX "idx_comissao_votacoes_fase" ON "comissao_votacoes" USING btree ("comissao_fase_id");--> statement-breakpoint
CREATE INDEX "idx_comissao_votacoes_iniciativa" ON "comissao_votacoes" USING btree ("iniciativa_id");--> statement-breakpoint
CREATE INDEX "idx_comissao_votacoes_data" ON "comissao_votacoes" USING btree ("data");--> statement-breakpoint
CREATE INDEX "idx_comissoes_fases_evento" ON "comissoes_fases" USING btree ("evento_id");--> statement-breakpoint
CREATE INDEX "idx_comissoes_fases_iniciativa" ON "comissoes_fases" USING btree ("iniciativa_id");--> statement-breakpoint
CREATE INDEX "idx_comissoes_fases_numero" ON "comissoes_fases" USING btree ("numero");--> statement-breakpoint
CREATE INDEX "idx_dep_cargos_deputado" ON "deputado_cargos" USING btree ("deputado_id");--> statement-breakpoint
CREATE INDEX "idx_dep_cargos_legislatura" ON "deputado_cargos" USING btree ("legislatura_id");--> statement-breakpoint
CREATE INDEX "idx_dep_situacoes_deputado" ON "deputado_situacoes" USING btree ("deputado_id");--> statement-breakpoint
CREATE INDEX "idx_dep_situacoes_legislatura" ON "deputado_situacoes" USING btree ("legislatura_id");--> statement-breakpoint
CREATE INDEX "idx_eventos_iniciativa" ON "eventos" USING btree ("iniciativa_id");--> statement-breakpoint
CREATE INDEX "idx_eventos_fase" ON "eventos" USING btree ("fase");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_gp_legislatura_sigla" ON "grupos_parlamentares" USING btree ("legislatura_id","sigla");--> statement-breakpoint
CREATE INDEX "idx_iniciativas_legislatura" ON "iniciativas" USING btree ("legislatura_id");--> statement-breakpoint
CREATE INDEX "idx_iniciativas_tipo" ON "iniciativas" USING btree ("tipo");--> statement-breakpoint
CREATE INDEX "idx_iniciativas_estado" ON "iniciativas" USING btree ("estado");--> statement-breakpoint
CREATE INDEX "idx_iniciativas_data" ON "iniciativas" USING btree ("data_entrada");--> statement-breakpoint
CREATE INDEX "idx_iniciativas_conjuntas_evento" ON "iniciativas_conjuntas" USING btree ("evento_id");--> statement-breakpoint
CREATE INDEX "idx_iniciativas_conjuntas_iniciativa" ON "iniciativas_conjuntas" USING btree ("iniciativa_id");--> statement-breakpoint
CREATE INDEX "idx_iniciativas_conjuntas_conjunta_id" ON "iniciativas_conjuntas" USING btree ("conjunta_id");--> statement-breakpoint
CREATE INDEX "idx_rel_iniciativa" ON "iniciativas_relacionadas" USING btree ("iniciativa_id");--> statement-breakpoint
CREATE INDEX "idx_intervencoes_evento" ON "intervencoesdebates" USING btree ("evento_id");--> statement-breakpoint
CREATE INDEX "idx_intervencoes_iniciativa" ON "intervencoesdebates" USING btree ("iniciativa_id");--> statement-breakpoint
CREATE INDEX "idx_mandatos_deputado" ON "mandatos" USING btree ("deputado_id");--> statement-breakpoint
CREATE INDEX "idx_mandatos_legislatura" ON "mandatos" USING btree ("legislatura_id");--> statement-breakpoint
CREATE INDEX "idx_mandatos_grupo" ON "mandatos" USING btree ("grupo_parlamentar");--> statement-breakpoint
CREATE INDEX "idx_orador_pub_orador" ON "orador_publicacoes" USING btree ("orador_id");--> statement-breakpoint
CREATE INDEX "idx_orador_pub_iniciativa" ON "orador_publicacoes" USING btree ("iniciativa_id");--> statement-breakpoint
CREATE INDEX "idx_oradores_intervencao" ON "oradores" USING btree ("intervencao_id");--> statement-breakpoint
CREATE INDEX "idx_peticoes_conjuntas_evento" ON "peticoes_conjuntas" USING btree ("evento_id");--> statement-breakpoint
CREATE INDEX "idx_peticoes_conjuntas_iniciativa" ON "peticoes_conjuntas" USING btree ("iniciativa_id");--> statement-breakpoint
CREATE INDEX "idx_proposta_pub_proposta" ON "proposta_publicacoes" USING btree ("proposta_alteracao_id");--> statement-breakpoint
CREATE INDEX "idx_proposta_pub_iniciativa" ON "proposta_publicacoes" USING btree ("iniciativa_id");--> statement-breakpoint
CREATE INDEX "idx_propostas_iniciativa" ON "propostas_alteracao" USING btree ("iniciativa_id");--> statement-breakpoint
CREATE INDEX "idx_publicacoes_evento" ON "publicacoes" USING btree ("evento_id");--> statement-breakpoint
CREATE INDEX "idx_publicacoes_iniciativa" ON "publicacoes" USING btree ("iniciativa_id");--> statement-breakpoint
CREATE INDEX "idx_sessoes_legislatura" ON "sessoes_legislativas" USING btree ("legislatura_id");--> statement-breakpoint
CREATE INDEX "idx_votacao_pub_votacao" ON "votacao_publicacoes" USING btree ("votacao_ini_id","votacao_id");--> statement-breakpoint
CREATE INDEX "idx_votacao_pub_evento" ON "votacao_publicacoes" USING btree ("evento_id");--> statement-breakpoint
CREATE INDEX "idx_votacoes_data" ON "votacoes" USING btree ("data");--> statement-breakpoint
CREATE INDEX "idx_votacoes_resultado" ON "votacoes" USING btree ("resultado");--> statement-breakpoint
CREATE INDEX "idx_votacoes_evento" ON "votacoes" USING btree ("evento_id");