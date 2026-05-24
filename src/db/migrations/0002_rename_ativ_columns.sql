-- ativ_ini
ALTER TABLE "ativ_ini" RENAME COLUMN "ini_id" TO "iniciativa_id";
--> statement-breakpoint
ALTER TABLE "ativ_ini" RENAME COLUMN "ini_nr" TO "numero";
--> statement-breakpoint
ALTER TABLE "ativ_ini" RENAME COLUMN "ini_tp" TO "tipo";
--> statement-breakpoint
ALTER TABLE "ativ_ini" RENAME COLUMN "ini_tpdesc" TO "tipo_desc";
--> statement-breakpoint
ALTER TABLE "ativ_ini" RENAME COLUMN "ini_sel_lg" TO "legislatura_ref";
--> statement-breakpoint
ALTER TABLE "ativ_ini" RENAME COLUMN "ini_sel_nr" TO "numero_ref";
--> statement-breakpoint
ALTER TABLE "ativ_ini" RENAME COLUMN "ini_ti" TO "titulo";
--> statement-breakpoint

-- ativ_req
ALTER TABLE "ativ_req" RENAME COLUMN "req_id" TO "requerimento_id";
--> statement-breakpoint
ALTER TABLE "ativ_req" RENAME COLUMN "req_nr" TO "numero";
--> statement-breakpoint
ALTER TABLE "ativ_req" RENAME COLUMN "req_tp" TO "tipo";
--> statement-breakpoint
ALTER TABLE "ativ_req" RENAME COLUMN "req_lg" TO "legislatura";
--> statement-breakpoint
ALTER TABLE "ativ_req" RENAME COLUMN "req_sl" TO "sessao_legislativa";
--> statement-breakpoint
ALTER TABLE "ativ_req" RENAME COLUMN "req_as" TO "assunto";
--> statement-breakpoint
ALTER TABLE "ativ_req" RENAME COLUMN "req_dt" TO "data";
--> statement-breakpoint
ALTER TABLE "ativ_req" RENAME COLUMN "req_per_tp" TO "periodo_tipo";
--> statement-breakpoint

-- ativ_scgt
ALTER TABLE "ativ_scgt" RENAME COLUMN "scm_com_lg" TO "comissao_legislatura";
--> statement-breakpoint
ALTER TABLE "ativ_scgt" RENAME COLUMN "ccm_dscom" TO "comissao_nome";
--> statement-breakpoint
ALTER TABLE "ativ_scgt" RENAME COLUMN "scm_cd" TO "codigo";
--> statement-breakpoint
ALTER TABLE "ativ_scgt" RENAME COLUMN "scm_com_cd" TO "comissao_codigo";
--> statement-breakpoint
ALTER TABLE "ativ_scgt" RENAME COLUMN "cms_cargo" TO "cargo";
--> statement-breakpoint
ALTER TABLE "ativ_scgt" RENAME COLUMN "cms_situacao" TO "situacao";
--> statement-breakpoint

-- ativ_intev
ALTER TABLE "ativ_intev" RENAME COLUMN "int_id" TO "intervencao_id";
--> statement-breakpoint
ALTER TABLE "ativ_intev" RENAME COLUMN "int_te" TO "texto";
--> statement-breakpoint
ALTER TABLE "ativ_intev" RENAME COLUMN "int_su" TO "sumario";
--> statement-breakpoint
ALTER TABLE "ativ_intev" RENAME COLUMN "pub_dar" TO "publicacao_dar";
--> statement-breakpoint
ALTER TABLE "ativ_intev" RENAME COLUMN "pub_dtreu" TO "data_reuniao";
--> statement-breakpoint
ALTER TABLE "ativ_intev" RENAME COLUMN "pub_lg" TO "legislatura";
--> statement-breakpoint
ALTER TABLE "ativ_intev" RENAME COLUMN "pub_nr" TO "publicacao_numero";
--> statement-breakpoint
ALTER TABLE "ativ_intev" RENAME COLUMN "pub_sl" TO "sessao_legislativa";
--> statement-breakpoint
ALTER TABLE "ativ_intev" RENAME COLUMN "pub_tp" TO "publicacao_tipo";
--> statement-breakpoint
ALTER TABLE "ativ_intev" RENAME COLUMN "tin_ds" TO "tipo_intervencao";
--> statement-breakpoint

-- ativ_actp
ALTER TABLE "ativ_actp" RENAME COLUMN "act_id" TO "atividade_id";
--> statement-breakpoint
ALTER TABLE "ativ_actp" RENAME COLUMN "act_nr" TO "numero";
--> statement-breakpoint
ALTER TABLE "ativ_actp" RENAME COLUMN "act_tp" TO "tipo";
--> statement-breakpoint
ALTER TABLE "ativ_actp" RENAME COLUMN "act_tpdesc" TO "tipo_desc";
--> statement-breakpoint
ALTER TABLE "ativ_actp" RENAME COLUMN "act_sel_lg" TO "legislatura_ref";
--> statement-breakpoint
ALTER TABLE "ativ_actp" RENAME COLUMN "act_sel_nr" TO "numero_ref";
--> statement-breakpoint
ALTER TABLE "ativ_actp" RENAME COLUMN "act_dtent" TO "data_entrada";
--> statement-breakpoint
ALTER TABLE "ativ_actp" RENAME COLUMN "act_dtdeb" TO "data_debate";
--> statement-breakpoint
ALTER TABLE "ativ_actp" RENAME COLUMN "act_as" TO "assunto";
--> statement-breakpoint

-- ativ_gpa
ALTER TABLE "ativ_gpa" RENAME COLUMN "gpl_id" TO "grupo_id";
--> statement-breakpoint
ALTER TABLE "ativ_gpa" RENAME COLUMN "gpl_no" TO "nome";
--> statement-breakpoint
ALTER TABLE "ativ_gpa" RENAME COLUMN "cga_dtini" TO "data_inicio";
--> statement-breakpoint
ALTER TABLE "ativ_gpa" RENAME COLUMN "cga_dtfim" TO "data_fim";
--> statement-breakpoint
ALTER TABLE "ativ_gpa" RENAME COLUMN "gpl_sel_lg" TO "legislatura";
--> statement-breakpoint
ALTER TABLE "ativ_gpa" RENAME COLUMN "cga_crg" TO "cargo";
--> statement-breakpoint

-- ativ_dlp
ALTER TABLE "ativ_dlp" RENAME COLUMN "dep_id" TO "delegacao_id";
--> statement-breakpoint
ALTER TABLE "ativ_dlp" RENAME COLUMN "dep_no" TO "nome";
--> statement-breakpoint
ALTER TABLE "ativ_dlp" RENAME COLUMN "dep_sel_lg" TO "legislatura";
--> statement-breakpoint
ALTER TABLE "ativ_dlp" RENAME COLUMN "dep_sel_nr" TO "numero";
--> statement-breakpoint
ALTER TABLE "ativ_dlp" RENAME COLUMN "cde_crg" TO "cargo";
--> statement-breakpoint
ALTER TABLE "ativ_dlp" RENAME COLUMN "dep_reunioes" TO "reunioes";
--> statement-breakpoint

-- ativ_dle
ALTER TABLE "ativ_dle" RENAME COLUMN "dev_id" TO "declaracao_id";
--> statement-breakpoint
ALTER TABLE "ativ_dle" RENAME COLUMN "dev_loc" TO "local";
--> statement-breakpoint
ALTER TABLE "ativ_dle" RENAME COLUMN "dev_no" TO "numero";
--> statement-breakpoint
ALTER TABLE "ativ_dle" RENAME COLUMN "dev_sel_lg" TO "legislatura";
--> statement-breakpoint
ALTER TABLE "ativ_dle" RENAME COLUMN "dev_sel_nr" TO "numero_ref";
--> statement-breakpoint
ALTER TABLE "ativ_dle" RENAME COLUMN "dev_dtfim" TO "data_fim";
--> statement-breakpoint
ALTER TABLE "ativ_dle" RENAME COLUMN "dev_dtini" TO "data_inicio";
--> statement-breakpoint
ALTER TABLE "ativ_dle" RENAME COLUMN "dev_tp" TO "tipo";
--> statement-breakpoint

-- ativ_rel_ini
ALTER TABLE "ativ_rel_ini" RENAME COLUMN "ini_id" TO "iniciativa_id";
--> statement-breakpoint
ALTER TABLE "ativ_rel_ini" RENAME COLUMN "ini_nr" TO "numero";
--> statement-breakpoint
ALTER TABLE "ativ_rel_ini" RENAME COLUMN "ini_tp" TO "tipo";
--> statement-breakpoint
ALTER TABLE "ativ_rel_ini" RENAME COLUMN "ini_sel_lg" TO "legislatura";
--> statement-breakpoint
ALTER TABLE "ativ_rel_ini" RENAME COLUMN "ini_ti" TO "titulo";
--> statement-breakpoint
ALTER TABLE "ativ_rel_ini" RENAME COLUMN "rel_fase" TO "fase";
--> statement-breakpoint
ALTER TABLE "ativ_rel_ini" RENAME COLUMN "acc_dtrel" TO "data_relatorio";
--> statement-breakpoint
ALTER TABLE "ativ_rel_ini" RENAME COLUMN "ini_link" TO "link";
--> statement-breakpoint

-- ativ_rel_pet
ALTER TABLE "ativ_rel_pet" RENAME COLUMN "pet_id" TO "peticao_id";
--> statement-breakpoint
ALTER TABLE "ativ_rel_pet" RENAME COLUMN "pet_nr" TO "numero";
--> statement-breakpoint
ALTER TABLE "ativ_rel_pet" RENAME COLUMN "pet_sel_lg_pk" TO "legislatura";
--> statement-breakpoint
ALTER TABLE "ativ_rel_pet" RENAME COLUMN "pet_sel_nr_pk" TO "numero_ref";
--> statement-breakpoint
ALTER TABLE "ativ_rel_pet" RENAME COLUMN "pet_aspet" TO "assunto";
--> statement-breakpoint
ALTER TABLE "ativ_rel_pet" RENAME COLUMN "pec_dtrelf" TO "data_relatorio";
--> statement-breakpoint

-- ativ_rel_contas
ALTER TABLE "ativ_rel_contas" RENAME COLUMN "act_id" TO "atividade_id";
--> statement-breakpoint
ALTER TABLE "ativ_rel_contas" RENAME COLUMN "act_as" TO "assunto";
--> statement-breakpoint
ALTER TABLE "ativ_rel_contas" RENAME COLUMN "act_tp" TO "tipo";
--> statement-breakpoint
ALTER TABLE "ativ_rel_contas" RENAME COLUMN "act_tp_cod" TO "tipo_codigo";
--> statement-breakpoint
ALTER TABLE "ativ_rel_contas" RENAME COLUMN "act_sel_lg" TO "legislatura";
--> statement-breakpoint
ALTER TABLE "ativ_rel_contas" RENAME COLUMN "ano_civ" TO "ano_civil";
--> statement-breakpoint
ALTER TABLE "ativ_rel_contas" RENAME COLUMN "dt_nom" TO "data_nomeacao";
--> statement-breakpoint

-- ativ_rel_ini_eur
ALTER TABLE "ativ_rel_ini_eur" RENAME COLUMN "ine_id" TO "iniciativa_id";
--> statement-breakpoint
ALTER TABLE "ativ_rel_ini_eur" RENAME COLUMN "ine_referencia" TO "referencia";
--> statement-breakpoint
ALTER TABLE "ativ_rel_ini_eur" RENAME COLUMN "ine_titulo" TO "titulo";
--> statement-breakpoint
ALTER TABLE "ativ_rel_ini_eur" RENAME COLUMN "ine_tipo" TO "tipo";
--> statement-breakpoint
ALTER TABLE "ativ_rel_ini_eur" RENAME COLUMN "ine_data_relatorio" TO "data_relatorio";
--> statement-breakpoint
ALTER TABLE "ativ_rel_ini_eur" RENAME COLUMN "ine_link" TO "link";
--> statement-breakpoint
ALTER TABLE "ativ_rel_ini_eur" RENAME COLUMN "leg" TO "legislatura";
--> statement-breakpoint

-- ativ_rel_pareceres
ALTER TABLE "ativ_rel_pareceres" RENAME COLUMN "act_sel_lg" TO "legislatura";
--> statement-breakpoint
ALTER TABLE "ativ_rel_pareceres" RENAME COLUMN "act_as" TO "assunto";
--> statement-breakpoint
ALTER TABLE "ativ_rel_pareceres" RENAME COLUMN "act_id" TO "atividade_id";
--> statement-breakpoint
ALTER TABLE "ativ_rel_pareceres" RENAME COLUMN "act_dt" TO "data";
--> statement-breakpoint
ALTER TABLE "ativ_rel_pareceres" RENAME COLUMN "act_tp_cod" TO "tipo_codigo";
--> statement-breakpoint
ALTER TABLE "ativ_rel_pareceres" RENAME COLUMN "act_tp_desc" TO "tipo_desc";
--> statement-breakpoint

-- ativ_atividades_comissao
ALTER TABLE "ativ_atividades_comissao" RENAME COLUMN "act_id" TO "atividade_id";
--> statement-breakpoint
ALTER TABLE "ativ_atividades_comissao" RENAME COLUMN "act_as" TO "assunto";
--> statement-breakpoint
ALTER TABLE "ativ_atividades_comissao" RENAME COLUMN "act_dtdes1" TO "data_deslocacao_inicio";
--> statement-breakpoint
ALTER TABLE "ativ_atividades_comissao" RENAME COLUMN "act_dtdes2" TO "data_deslocacao_fim";
--> statement-breakpoint
ALTER TABLE "ativ_atividades_comissao" RENAME COLUMN "act_dtent" TO "data_entrada";
--> statement-breakpoint
ALTER TABLE "ativ_atividades_comissao" RENAME COLUMN "act_loc" TO "local";
--> statement-breakpoint
ALTER TABLE "ativ_atividades_comissao" RENAME COLUMN "acc_dtaud" TO "data_audicao";
--> statement-breakpoint
ALTER TABLE "ativ_atividades_comissao" RENAME COLUMN "act_tp" TO "tipo";
--> statement-breakpoint
ALTER TABLE "ativ_atividades_comissao" RENAME COLUMN "act_tp_desc" TO "tipo_desc";
--> statement-breakpoint
ALTER TABLE "ativ_atividades_comissao" RENAME COLUMN "act_nr" TO "numero";
--> statement-breakpoint
ALTER TABLE "ativ_atividades_comissao" RENAME COLUMN "act_lg" TO "legislatura";
--> statement-breakpoint
ALTER TABLE "ativ_atividades_comissao" RENAME COLUMN "cms_no" TO "comissao_nome";
--> statement-breakpoint
ALTER TABLE "ativ_atividades_comissao" RENAME COLUMN "cms_ab" TO "comissao_abreviatura";
--> statement-breakpoint
ALTER TABLE "ativ_atividades_comissao" RENAME COLUMN "tev_tp" TO "tipo_evento";
--> statement-breakpoint
ALTER TABLE "ativ_atividades_comissao" RENAME COLUMN "act_sl" TO "sessao_legislativa";
--> statement-breakpoint

-- ativ_cms
ALTER TABLE "ativ_cms" RENAME COLUMN "cms_cd" TO "codigo";
--> statement-breakpoint
ALTER TABLE "ativ_cms" RENAME COLUMN "cms_lg" TO "legislatura";
--> statement-breakpoint
ALTER TABLE "ativ_cms" RENAME COLUMN "cms_no" TO "nome";
--> statement-breakpoint
ALTER TABLE "ativ_cms" RENAME COLUMN "cms_cargo" TO "cargo";
--> statement-breakpoint
ALTER TABLE "ativ_cms" RENAME COLUMN "cms_situacao" TO "situacao";
--> statement-breakpoint
ALTER TABLE "ativ_cms" RENAME COLUMN "cms_sub_cargo" TO "sub_cargo";
--> statement-breakpoint

-- ativ_dados_legis
ALTER TABLE "ativ_dados_legis" RENAME COLUMN "dpl_lg" TO "legislatura";
--> statement-breakpoint
ALTER TABLE "ativ_dados_legis" RENAME COLUMN "dpl_grpar" TO "grupo_parlamentar";
