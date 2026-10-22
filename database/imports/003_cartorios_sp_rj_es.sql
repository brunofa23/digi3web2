-- Importação CRM: cartórios das capitais SP (107), RJ (67) e ES (7).
-- Banco de teste local: digi3Web | empresa 1 | responsável: admin.
-- Foram excluídas cinco serventias inativas, uma entrada repetida por e-mail
-- e uma entrada sem denominação/responsável. Total preparado: 181.
-- Requer as migrations do CRM, inclusive 1786690000000_sales_opportunities_expand_name.ts.

SET NAMES utf8mb4;
START TRANSACTION;

SET @crm_company_id := 1;
SET @crm_stage_id := (SELECT id FROM sales_stages WHERE name = 'Novo contato' AND active = 1 LIMIT 1);
SET @crm_assigned_user_id := (
  SELECT id FROM users
  WHERE companies_id = @crm_company_id AND LOWER(username) = 'admin' AND status = 1
  LIMIT 1
);
SET @crm_start_date := CASE
  WHEN WEEKDAY(CURDATE()) = 5 THEN DATE_ADD(CURDATE(), INTERVAL 2 DAY)
  WHEN WEEKDAY(CURDATE()) = 6 THEN DATE_ADD(CURDATE(), INTERVAL 1 DAY)
  ELSE CURDATE()
END;

DROP TEMPORARY TABLE IF EXISTS tmp_crm_cartorios_capitais;
CREATE TEMPORARY TABLE tmp_crm_cartorios_capitais (
  import_order INT UNSIGNED NOT NULL PRIMARY KEY,
  source_code VARCHAR(10) NOT NULL,
  city VARCHAR(100) NOT NULL,
  state CHAR(2) NOT NULL,
  source VARCHAR(80) NOT NULL,
  name VARCHAR(255) NOT NULL,
  contact_name VARCHAR(120) NOT NULL,
  phone VARCHAR(30) NOT NULL,
  phone_digits VARCHAR(20) NOT NULL,
  email VARCHAR(255) NOT NULL,
  notes TEXT NOT NULL,
  INDEX tmp_crm_cartorios_capitais_email_idx (email),
  INDEX tmp_crm_cartorios_capitais_phone_idx (phone_digits)
);

INSERT INTO tmp_crm_cartorios_capitais
  (import_order, source_code, city, state, source, name, contact_name, phone, phone_digits, email, notes)
VALUES
  (1, '', 'São Paulo', 'SP', 'Importação - Cartórios SP Capital', '10º Oficial de Registro de Imóveis de São Paulo', 'FLAVIANO GALHARDO', '(11)5186-2800', '1151862800', '10risp@10risp.com.br', 'Atribuições: Registro de Imóveis
Endereço: Rua Inácio Pereira da Rocha, 142
Bairro: Vila Madalena
Data de envio informada no texto: 26/02/25'),
  (2, '', 'São Paulo', 'SP', 'Importação - Cartórios SP Capital', '10º OFICIAL DE REGISTRO DE TÍTULOS E DOCUMENTOS E CIVIL DAS PESSOAS JURÍDICAS', 'THIAGO PEDRO PAGLIUCA DOS SANTOS', '(11)3115-0282', '1131150282', 'oficial@10rtd.com.br', 'Atribuições: Registro de Títulos e Documentos e Civis das Pessoas Jurídicas
Endereço: AVENIDA ANGÉLICA, 2510
Bairro: CONSOLAÇÃO'),
  (3, '', 'São Paulo', 'SP', 'Importação - Cartórios SP Capital', '10º TABELIÃO DE NOTAS DA CAPITAL', 'MARIA PAULA PACHI MONTEIRO DA SILVA', '(11)5904-9330', '1159049330', 'contato@10cartorio.com.br', 'Atribuições: Notas
Endereço: RUA PEDRO DE TOLEDO, 214
Bairro: VILA CLEMENTINO'),
  (4, '', 'São Paulo', 'SP', 'Importação - Cartórios SP Capital', '10º TABELIÃO DE PROTESTO DE LETRAS E TÍTULOS DE SÃO PAULO-SP', 'JOSÉ OTÁVIO DOS SANTOS PINTO', '(11)3293-1010', '1132931010', 'tabeliao@10tpsp.com.br', 'Atribuições: Protesto de Títulos
Endereço: PRAÇA DR. JOÃO MENDES Nº 48
Bairro: CENTRO'),
  (5, '', 'São Paulo', 'SP', 'Importação - Cartórios SP Capital', '11º OFICIAL DE REGISTRO DE IMÓVEIS DE SÃO PAULO', 'PLINIO ANTONIO CHAGAS', '(11)3779-0000', '1137790000', 'sac@11ri.com.br', 'Atribuições: Registro de Imóveis
Endereço: RUA NELSON GAMA DE OLIVEIRA 235 e 365
Bairro: VILA ANDRADE'),
  (6, '', 'São Paulo', 'SP', 'Importação - Cartórios SP Capital', '12º Oficio de Registro de Imóveis', 'BENEDITO JOSé MORAIS DIAS', '(11)3218-0092', '1132180092', '12ri@12ri.com.br', 'Atribuições: Registro de Imóveis
Endereço: Rua Major Angelo Zanchi n.623
Bairro: Penha de França'),
  (7, '', 'São Paulo', 'SP', 'Importação - Cartórios SP Capital', '13º TABELIÃO DE NOTAS DE SÃO PAULO-SP', 'AVELINO LUIS MARQUES', '(11)5042-6500', '1150426500', 'avelino@13tabeliao.com.br', 'Atribuições: Notas
Endereço: AVENIDA PROFESSOR VICENTE RAO, 1405
Bairro: JARDIM PETROPOLIS'),
  (8, '', 'São Paulo', 'SP', 'Importação - Cartórios SP Capital', '14º Oficial de Registro de Imóveis', 'RICARDO NAHAT', '(11)3052-3010', '1130523010', 'oficial@14ri.com.br', 'Atribuições: Registro de Imóveis
Endereço: Rua Jundiaí, 50, 7º andar
Bairro: Ibirapuera'),
  (9, '', 'São Paulo', 'SP', 'Importação - Cartórios SP Capital', 'OFICIAL DE REGISTRO CIVIL DAS PESSOAS NATURAIS - 15º SUBDISTRITO - BOM RETIRO, DA COMARCA DA CAPITAL – SP', 'AMANDA DE REZENDE COUTO PINHEIRO', '(11)3228-3744', '1132283744', 'contato@cartoriobomretiro.com.br', 'Atribuições: Registro Civil das Pessoas Naturais e de Interdições e Tutelas
Endereço: Rua Amazonas, nº 57
Bairro: Bom Retiro'),
  (10, '11.125-2', 'São Paulo', 'SP', 'Importação - Cartórios SP Capital', '15º. OFICIAL DE REGISTRO DE IMOVEIS DE SAO PAULO', 'ROSVALDO CASSARO', '(11)3120-9884', '1131209884', 'sac@decimoquinto.com.br', 'Código da serventia: 11.125-2
Atribuições: Registro de Imóveis
Endereço: RUA CONSELHEIRO CRISPINIANO, 29 - 3. ANDAR
Bairro: CENTRO'),
  (11, '11.126-0', 'São Paulo', 'SP', 'Importação - Cartórios SP Capital', '16° Tabelião de Notas de São Paulo', 'FABIO TADEU BISOGNIN', '(11)3544-1600', '1135441600', '16tabeliao@16tabeliao.com.br', 'Código da serventia: 11.126-0
Atribuições: Notas
Endereço: Rua Augusta, 1638
Bairro: Cerqueira Cesar'),
  (12, '11.127-8', 'São Paulo', 'SP', 'Importação - Cartórios SP Capital', '16º OFICIAL DE REGISTRO DE IMÓVEIS', 'VANDA MARIA DE OLIVEIRA PENNA ANTUNES DA CRUZ', '(11)3572-0580', '1135720580', '16ri@16ri.com.br', 'Código da serventia: 11.127-8
Atribuições: Registro de Imóveis
Endereço: RUA PAMPLONA Nº 1593
Bairro: JARDIM PAULISTA'),
  (13, '11.128-6', 'São Paulo', 'SP', 'Importação - Cartórios SP Capital', '17º OFICIAL DE REGISTRO CIVIL SUBDISTRITO BELA VISTA', 'FLAVIA BENITO TEIXEIRA', '(11)3284-9000', '1132849000', 'cartorio17belavista@gmail.com', 'Código da serventia: 11.128-6
Atribuições: Registro Civil das Pessoas Naturais e de Interdições e Tutelas
Endereço: AVENIDA BRIGADEIRO LUIS ANTONIO, 1702
Bairro: BELA VISTA'),
  (14, '11.129-4', 'São Paulo', 'SP', 'Importação - Cartórios SP Capital', '17º Oficial de Registro de Imóveis de São Paulo-SP', 'FRANCISCO VENTURA DE TOLEDO', '(11)3105-5725', '1131055725', '17ri.sp@uol.com.br', 'Código da serventia: 11.129-4
Atribuições: Registro de Imóveis
Endereço: Rua Japurá, nº 43
Bairro: Bela Vista'),
  (15, '11.130-2', 'São Paulo', 'SP', 'Importação - Cartórios SP Capital', '17º Tabelião de Notas da Capital', 'JUSSARA CITRONI MODANEZE', '(11)3291-2500', '1132912500', 'contato@17tabeliao.com.br', 'Código da serventia: 11.130-2
Atribuições: Notas
Endereço: Rua Vergueiro, 128
Bairro: Liberdade'),
  (16, '11.131-0', 'São Paulo', 'SP', 'Importação - Cartórios SP Capital', '18º REGISTRO CIVIL IPIRANGA', 'KARINE MARIA FAMER ROCHA BOSELLI', '(11)2063-4581', '1120634581', 'cartorio@cartorioipiranga.com.br', 'Código da serventia: 11.131-0
Atribuições: Notas -> Registro Civil das Pessoas Naturais e de Interdições e Tutelas
Endereço: RUA DOS SOROCABANOS, 249
Bairro: IPIRANGA'),
  (17, '', 'São Paulo', 'SP', 'Importação - Cartórios SP Capital', '18º TABELIÃO DE NOTAS DE SÃO PAULO-SP', 'LUCIANA DE VITA ARRUDA', '(11)2068-9002', '1120689002', 'contato@18notas.com.br', 'Atribuições: Notas
Endereço: AVENIDA PAES DE BARROS, Nº 3287
Bairro: VILA PRUDENTE
Data de envio informada no texto: 27/02/25'),
  (18, '11.134-4', 'São Paulo', 'SP', 'Importação - Cartórios SP Capital', '19º Tabelião de Notas da Capital', 'ANDRÉ MEDEIROS TOLEDO', '(11)3815-9855', '1138159855', 'tabeliao@cartoriotoledo.com.br', 'Código da serventia: 11.134-4
Atribuições: Notas
Endereço: Avenida Rebouças 3839
Bairro: Jardim Paulistano'),
  (19, '11.145-0', 'São Paulo', 'SP', 'Importação - Cartórios SP Capital', '1º Oficial de Registro de Imóveis de São Paulo - SP', 'FLAUZILINO ARAúJO DOS SANTOS', '(11)3291-6455', '1132916455', 'oficial@primeirosp.combr', 'Código da serventia: 11.145-0
Atribuições: Registro de Imóveis
Endereço: Rua Tabatinguera, 140 - Loja 1
Bairro: Centro'),
  (20, '11.159-1', 'São Paulo', 'SP', 'Importação - Cartórios SP Capital', '1º Oficial de Registro de Títulos e Documentos e Civil de Pessoas Jurídicas de São Paulo', 'PAULO ROBERTO DE CARVALHO RêGO', '(11)3104-8770', '1131048770', 'corregedoria@1rtd.com.br', 'Código da serventia: 11.159-1
Atribuições: Registro de Títulos e Documentos e Civis das Pessoas Jurídicas
Endereço: Rua Doutor Miguel Couto nº 44
Bairro: Centro'),
  (21, '11.216-9', 'São Paulo', 'SP', 'Importação - Cartórios SP Capital', '1º Tabelião de Protesto de Letras e Títulos de São Paulo', 'JOSE CARLOS ALVES', '(11)3113-6916', '1131136916', 'tabeliao@primeiroprotestosp.com.br', 'Código da serventia: 11.216-9
Atribuições: Protesto de Títulos
Endereço: Av. Brigadeiro Luiz Antônio, 371
Bairro: Bela Vista'),
  (22, '11.228-4', 'São Paulo', 'SP', 'Importação - Cartórios SP Capital', '20º Tabelião de Notas da Capital', 'ANDRé RIBEIRO JEREMIAS', '(11)3078-1836', '1130781836', 'cartorio@20cartorio.com.br', 'Código da serventia: 11.228-4
Atribuições: Notas
Endereço: Rua Joaquim Floriano, n. 889
Bairro: Itaim Bibi'),
  (23, '11.229-2', 'São Paulo', 'SP', 'Importação - Cartórios SP Capital', '21° TABELIÃO DE NOTAS DA COMARCA DE SÃO PAULO - CAPITAL', 'LUIZ AFFONSO SPAGNUOLO MEDINA', '(11)3291-9500', '1132919500', '21tabeliao@21tabeliao.com.br', 'Código da serventia: 11.229-2
Atribuições: Notas
Endereço: RUA LIBERO BADARÓ, 100
Bairro: CENTRO'),
  (24, '11.230-0', 'São Paulo', 'SP', 'Importação - Cartórios SP Capital', '22º Tabelião de Notas da Capital', 'ANA PAULA FRONTINI', '(11)3056-6766', '1130566766', '22tabeliaodenotas@gmail.com', 'Código da serventia: 11.230-0
Atribuições: Notas
Endereço: avenida brigadeiro luiz antonio, 3745
Bairro: jardim paulista'),
  (25, '11.231-8', 'São Paulo', 'SP', 'Importação - Cartórios SP Capital', '23o Tabelião de Notas da Capital', 'GISELLE DIAS RODRIGUES OLIVEIRA DE BARROS', '(11)4837-4999', '1148374999', 'tabelia@23tabeliao.com.br', 'Código da serventia: 11.231-8
Atribuições: Notas
Endereço: Rua Duarte Azevedo, 190
Bairro: Santana'),
  (26, '11.232-6', 'São Paulo', 'SP', 'Importação - Cartórios SP Capital', '24º Tabelião de Notas da Capital', 'NUBIA MARA PEREIRA BARBOSA', '(11)3242-1400', '1132421400', 'administrativo@cartoriobarbosasp.com.br', 'Código da serventia: 11.232-6
Atribuições: Notas
Endereço: Av. Engenheiro Luís Carlos Berrini, 1775
Bairro: Itaim Bibi'),
  (27, '', 'São Paulo', 'SP', 'Importação - Cartórios SP Capital', '25º TABELIÃO DE NOTAS', 'LETICIA ARAUJO FARIA', '(11)3647-3340', '1136473340', 'tabelia@25tabnotas.com.br', 'Atribuições: Notas
Endereço: RUA ROMA, Nº 553
Bairro: LAPA'),
  (28, '11.234-2', 'São Paulo', 'SP', 'Importação - Cartórios SP Capital', '26º Tabelionato de Notas de São Paulo', 'PAULO ROBERTO GAIGER FERREIRA', '(11)3111-9700', '1131119700', 'tabeliao@26notas.com.br', 'Código da serventia: 11.234-2
Atribuições: Notas
Endereço: Praça João Mendes 42
Bairro: Centro'),
  (29, '11.235-9', 'São Paulo', 'SP', 'Importação - Cartórios SP Capital', '27º TABELIONATO DE NOTAS DA CAPITAL', 'ALEXANDRE GONçALVES KASSAMA', '(11)3124-5000', '1131245000', 'expediente@27cartorio.com.br', 'Código da serventia: 11.235-9
Atribuições: Notas
Endereço: AVENIDA SÃO LUIS 59
Bairro: CENTRO'),
  (30, '11.236-7', 'São Paulo', 'SP', 'Importação - Cartórios SP Capital', '28. Tabelião de Notas da Capital', 'CARLA WATANABE', '(11)2095-2800', '1120952800', '28tabeliao@28tabeliao.com.br', 'Código da serventia: 11.236-7
Atribuições: Notas
Endereço: Rua Coelho Lisboa, 233
Bairro: Tatuapé'),
  (31, '11.237-5', 'São Paulo', 'SP', 'Importação - Cartórios SP Capital', '28º Oficial de Registro Civil Jardim Paulista', 'KATIA CRISTINA SILENCIO POSSAR', '(11)3845-8424', '1138458424', 'contato@cartoriojardimpaulista.com.br', 'Código da serventia: 11.237-5
Atribuições: Notas -> Registro Civil das Pessoas Naturais e de Interdições e Tutelas
Endereço: Rua Dr. Alceu de Campos Rodrigues, 320
Bairro: Vila Nova Conceição'),
  (32, '11.238-3', 'São Paulo', 'SP', 'Importação - Cartórios SP Capital', '29ª Tabeliã de Notas de São Paulo', 'PRISCILA DE CASTRO TEIXEIRA PINTO LOPES AGAPITO', '(11)2102-0129', '1121020129', 'tabelia@29notas.com.br', 'Código da serventia: 11.238-3
Atribuições: Notas
Endereço: Avenida Açocê, 308
Bairro: Indianópolis
Data de envio informada no texto: 28/02/25'),
  (33, '11.248-2', 'São Paulo', 'SP', 'Importação - Cartórios SP Capital', '2º Oficial de Registro de Imóveis da Capital de São Paulo', 'JERSÉ RODRIGUES DA SILVA', '(11)3660-4993', '1136604993', '2ri.sp@arisp.com.br', 'Código da serventia: 11.248-2
Atribuições: Registro de Imóveis
Endereço: RUA VITORINO CARMILO, 576
Bairro: BARRA FUNDA'),
  (34, '11.264-9', 'São Paulo', 'SP', 'Importação - Cartórios SP Capital', '2º Oficial de Registro de Títulos e Documentos e Civil de Pessoa Jurídica', 'GENTIL DOMINGUES DOS SANTOS', '(11)3101-5631', '1131015631', 'gdomingues@2rtd.com.br', 'Código da serventia: 11.264-9
Atribuições: Registro de Títulos e Documentos e Civis das Pessoas Jurídicas
Endereço: Rua Senador Paulo Egídio, 72
Bairro: Centro'),
  (35, '11.272-2', 'São Paulo', 'SP', 'Importação - Cartórios SP Capital', '2º TABELIÃO DE NOTAS DE SÃO PAULO', 'ANDERSON HENRIQUE TEIXEIRA NOGUEIRA', '(11)3357-8844', '1133578844', 'contato@cartoriopaulista.com.br', 'Código da serventia: 11.272-2
Atribuições: Notas
Endereço: Avenida Paulista, 1776 - Térreo, 2º e 3º andares
Bairro: Bela Vista'),
  (36, '11.308-4', 'São Paulo', 'SP', 'Importação - Cartórios SP Capital', '2º Tabelião de Protesto de São Paulo', 'ALEXANDRE AUGUSTO ARCARO', '(11)3293-7210', '1132937210', '2protestosp@segundoprotestosp.com.br', 'Código da serventia: 11.308-4
Atribuições: Protesto de Títulos
Endereço: Avenida Brigadeiro Luis Antonio, nº 319
Bairro: Jardim Bela Vista'),
  (37, '', 'São Paulo', 'SP', 'Importação - Cartórios SP Capital', '3º Oficial de Registro de Titulos e Documentos e Civil de Pessoas Juridicas', 'JOSé MARIA SIVIERO', '(11)3116-3070', '1131163070', 'frl@3rtd.com.br', 'Atribuições: Registro de Títulos e Documentos e Civis das Pessoas Jurídicas
Endereço: Pça. Padre Manoel da Nobrega, n. 16
Bairro: Centro'),
  (38, '11.321-7', 'São Paulo', 'SP', 'Importação - Cartórios SP Capital', '30º TABELIÃO DE NOTAS', 'FERNANDO DOMINGOS CARVALHO BLASCO', '(11)3881-5050', '1138815050', 'tabeliao@cartorioblasco.com.br', 'Código da serventia: 11.321-7
Atribuições: Notas
Endereço: Avenida Brigadeiro Faria Lima 2859
Bairro: Itaim Bibi'),
  (39, '11.322-5', 'São Paulo', 'SP', 'Importação - Cartórios SP Capital', '37º Registro Civil das Pessoas Naturais Subdistrito Aclimação', 'JAMILLE MORAIS DE SIQUEIRA', '(11)3275-2069', '1132752069', 'rcpn37sub@gmail.com', 'Código da serventia: 11.322-5
Atribuições: Registro Civil das Pessoas Naturais e de Interdições e Tutelas
Endereço: Rua Pires da Mota, 984
Bairro: Aclimação'),
  (40, '11.323-3', 'São Paulo', 'SP', 'Importação - Cartórios SP Capital', '38º Oficial de Registro Ciivl Vila Matilde', 'AMILTON NAVARRO', '(11)2651-0856', '1126510856', 'cartoriovilamatilde@gmail.com', 'Código da serventia: 11.323-3
Atribuições: Registro Civil das Pessoas Naturais e de Interdições e Tutelas
Endereço: RUA DOUTOR JOSÉ PAULO, 104/106
Bairro: VILA MATILDE'),
  (41, '11.324-1', 'São Paulo', 'SP', 'Importação - Cartórios SP Capital', '39º Oficial de Registro Civil das Pessoas Naturais da Capital - subdistrito da vila madalena', 'ANDREIA RUZZANTE GAGLIARDI', '(11)3816-7700', '1138167700', 'andreia@cartoriofarialima.com.br', 'Código da serventia: 11.324-1
Atribuições: Notas -> Registro Civil das Pessoas Naturais e de Interdições e Tutelas
Endereço: Rua dos Pinheiros, 1065
Bairro: Pinheiros'),
  (42, '11.328-2', 'São Paulo', 'SP', 'Importação - Cartórios SP Capital', '3º Registro de Imóveis de São Paulo', 'GEORGE TAKEDA', '(11)3292-2180', '1132922180', 'contato@3risp.com.br', 'Código da serventia: 11.328-2
Atribuições: Registro de Imóveis
Endereço: Rua Jacarei, 23
Bairro: Bela Vista'),
  (43, '11.334-0', 'São Paulo', 'SP', 'Importação - Cartórios SP Capital', '3º TABELIÃO DE NOTAS DE SÃO PAULO', 'LUCAS DOS SANTOS PAVIONE', '(11)3120-8600', '1131208600', 'contato@3tn.com.br', 'Código da serventia: 11.334-0
Atribuições: Notas
Endereço: Avenida São Luís 192
Bairro: CONSOLAÇÃO'),
  (44, '11.338-1', 'São Paulo', 'SP', 'Importação - Cartórios SP Capital', '3º Tabelião de Protesto de Letras e Títulos', 'CLAUDIO MARçAL FREIRE', '(11)3105-9849', '1131059849', '3protesto@3protesto-sp.com.br', 'Código da serventia: 11.338-1
Atribuições: Protesto de Títulos
Endereço: Largo Sao Francisco, 34
Bairro: Centro'),
  (45, '11.343-1', 'São Paulo', 'SP', 'Importação - Cartórios SP Capital', 'Oficial de Registro Civil das Pessoas Naturais do 40º subdistrito da Comarca da Capital, SP - Brasilândia', 'WILLIAN SANTANA DE BARROS', '(11)3859-5533', '1138595533', 'atendimento@cartoriobrasilandia.com.br', 'Código da serventia: 11.343-1
Atribuições: Registro Civil das Pessoas Naturais e de Interdições e Tutelas
Endereço: Av. Deputado Cantídio Sampaio, 1457
Bairro: Vila Brasilândia'),
  (46, '11.344-9', 'São Paulo', 'SP', 'Importação - Cartórios SP Capital', '41º SUBDISTRITO DE SÃO PAULO - CANGAIBA', 'MARIO LUIS MIGOTTO', '(11)2641-8309', '1126418309', 'rc.cangaiba@gmail.com', 'Código da serventia: 11.344-9
Atribuições: Registro Civil das Pessoas Naturais e de Interdições e Tutelas
Endereço: AVENIDA CANGAIBA Nº 950
Bairro: CANGAIBA'),
  (47, '', 'São Paulo', 'SP', 'Importação - Cartórios SP Capital', '4o Tabelionato de Notas da Capital', 'OSVALDO CANHEO', '(11)3050-9797', '1130509797', '4tnsp@4tnsp.com.br', 'Atribuições: Notas
Endereço: Avenida 9 de Julho n. 4.407
Bairro: Jardim Paulista
Data de envio informada no texto: 05/03/25'),
  (48, '11.348-0', 'São Paulo', 'SP', 'Importação - Cartórios SP Capital', '4º Oficial de Registro de Títulos e Documentos e Civil de Pessoa Jurídica da Capital', 'ROBSON DE ALVARENGA', '(11)3777-4040', '1137774040', 'contato@4rtd.com.br', 'Código da serventia: 11.348-0
Atribuições: Registro de Títulos e Documentos e Civis das Pessoas Jurídicas
Endereço: Rua Libero Badaró nº 425, 28º andar
Bairro: CENTRO'),
  (49, '11.349-8', 'São Paulo', 'SP', 'Importação - Cartórios SP Capital', '4º Registro de Imóveis de São Paulo', 'IVAN JACOPETTI DO LAGO', '(11)3054-5655', '1130545655', 'info@4risp.com.br', 'Código da serventia: 11.349-8
Atribuições: Registro de Imóveis
Endereço: Al. Vicente PInzon, 173, 11º andar
Bairro: Vila Olimpia'),
  (50, '11.354-8', 'São Paulo', 'SP', 'Importação - Cartórios SP Capital', '4º Tabelião de Protesto de Letras e Títulos de São Paulo', 'ANDRÉ DECHICHI GROSSI', '(11)3186-7254', '1131867254', 'adm@quartoprotestosp.com.br', 'Código da serventia: 11.354-8
Atribuições: Protesto de Títulos
Endereço: Av. Brigadeiro Luis Antonio, 319
Bairro: Bela Vista'),
  (51, '11.357-1', 'São Paulo', 'SP', 'Importação - Cartórios SP Capital', '5 Registro de Imóveis de São Paulo', 'SERGIO JACOMINO', '(11)3218-0526', '1132180526', 'oficial@quinto.com.br', 'Código da serventia: 11.357-1
Atribuições: Registro de Imóveis
Endereço: Rua Marquês de Paranaguá, 359
Bairro: Consolação'),
  (52, '11.358-9', 'São Paulo', 'SP', 'Importação - Cartórios SP Capital', '5º Oficial de Registro de Títulos e Documentos e Civil de Pessoa Jurídica', 'PAULA DA SILVA PEREIRA ZACCARON', '(11)3295-5555', '1132955555', '5rtd@5rtd.com.br', 'Código da serventia: 11.358-9
Atribuições: Registro de Títulos e Documentos e Civis das Pessoas Jurídicas
Endereço: Rua Líbero Badaró, 425
Bairro: Centro'),
  (53, '11.361-3', 'São Paulo', 'SP', 'Importação - Cartórios SP Capital', '5º Tabelião de Protesto de Letras e Títulos', 'RUBEM GARCIA', '(11)3118-5050', '1131185050', 'juridico@5protesto.com.br', 'Código da serventia: 11.361-3
Atribuições: Protesto de Títulos
Endereço: Rua da Glória nº 168
Bairro: Liberdade'),
  (54, '11.363-9', 'São Paulo', 'SP', 'Importação - Cartórios SP Capital', '5º tabelionato de Notas da Capital -SP', 'ALEXSANDRO SILVA TRINDADE', '(11)5188-2300', '1151882300', 'contato@quintocartorio.com.br', 'Código da serventia: 11.363-9
Atribuições: Notas
Endereço: Rua Alexandre Dumas, 1.711
Bairro: CHACARA SANTO ANTONIO'),
  (55, '11.365-4', 'São Paulo', 'SP', 'Importação - Cartórios SP Capital', '6º Oficial de Registro de Títulos e Documentos e Civil de Pessoa Jurídica', 'RADISLAU LAMOTTA', '(11)3107-0031', '1131070031', 'oficial6rtd@6rtd.com.br', 'Código da serventia: 11.365-4
Atribuições: Registro de Títulos e Documentos e Civis das Pessoas Jurídicas
Endereço: Rua Benjamin Constant, 152
Bairro: Centro-Sé'),
  (56, '11.368-8', 'São Paulo', 'SP', 'Importação - Cartórios SP Capital', '6º Tabelião de Protesto de Letras e Títulos', 'RICARDO RAGE FERRO', '(11)3119-6060', '1131196060', 'protesto@6protsp.com.br', 'Código da serventia: 11.368-8
Atribuições: Protesto de Títulos
Endereço: Rua Francisca Miquelina, 325
Bairro: Bela Vista'),
  (57, '', 'São Paulo', 'SP', 'Importação - Cartórios SP Capital', '7° Tabelião de Notas da Comarca da Capital', 'EDUARDO MARTINES JÚNIOR', '(11)3249-5500', '1132495500', 'setimo@setimotabelionato.com.br', 'Atribuições: Notas
Endereço: Alameda Santos, 1362
Bairro: Jardim Paulista
Data de envio informada no texto: 06/03/25'),
  (58, '11.371-2', 'São Paulo', 'SP', 'Importação - Cartórios SP Capital', '7º Oficial de Registro de Títulos e Documentos e Civil de Pessoa Jurídica', 'VLADIMIR SEGALLA AFANASIEFF', '(11)3116-7600', '1131167600', 'cartorio@7rtd.com.br', 'Código da serventia: 11.371-2
Atribuições: Registro de Títulos e Documentos e Civis das Pessoas Jurídicas
Endereço: Avenida Paulista, nº 2001, 2º andar
Bairro: Bela Vista'),
  (59, '11.373-8', 'São Paulo', 'SP', 'Importação - Cartórios SP Capital', '7º TABELIÃO DE PROTESTO DE LETRAS E TITULOS DE SÃO PAULO', 'MARCOS CLARO DA SILVA', '(11)3111-7070', '1131117070', 'tabeliao@setimoprotestosp.com.br', 'Código da serventia: 11.373-8
Atribuições: Protesto de Títulos
Endereço: RUA DA GLÓRIA, 152
Bairro: LIBERDADE'),
  (60, '11.374-6', 'São Paulo', 'SP', 'Importação - Cartórios SP Capital', '8º OFICIAL DE REGISTRO DE IMÓVEIS', 'JOELCIO ESCOBAR', '(11)3291-8080', '1132918080', 'oitavo@oitavo.com.br', 'Código da serventia: 11.374-6
Atribuições: Registro de Imóveis
Endereço: RUA BENTO DE FREITAS, 256
Bairro: REPÚBLICA'),
  (61, '11.375-3', 'São Paulo', 'SP', 'Importação - Cartórios SP Capital', '8º OFICIAL DE REGISTRO DE TÍTULOS E DOCUMENTOS E CIVIL DE PESSOA JURÍDICA DA CAPITAL', 'CRISTIANO ASSUNçãO DUARTE', '(11)3107-0111', '1131070111', '8rtd@8rtd.com.br', 'Código da serventia: 11.375-3
Atribuições: Registro de Títulos e Documentos e Civis das Pessoas Jurídicas
Endereço: PRAÇA PADRE MANUEL DA NOBREGA, Nº 21
Bairro: CENTRO'),
  (62, '11.376-1', 'São Paulo', 'SP', 'Importação - Cartórios SP Capital', '9 OFICIAL DE REGISTRO DE TITULOS E DOCUMENTOS E CIVIL DE PESSOA JURIDICA', 'ALFREDO CRISTIANO CARVALHO HOMEM', '(11)3101-4501', '1131014501', 'oficial@9rtd.com.br', 'Código da serventia: 11.376-1
Atribuições: Registro de Títulos e Documentos e Civis das Pessoas Jurídicas
Endereço: RUA BOA VISTA 314
Bairro: CENTRO'),
  (63, '11.377-9', 'São Paulo', 'SP', 'Importação - Cartórios SP Capital', '9º Oficial de Registro de Imóveis de São Paulo - SP', 'FRANCISCO RAYMUNDO', '(11)3122-0020', '1131220020', 'contato@9risp.com.br', 'Código da serventia: 11.377-9
Atribuições: Registro de Imóveis
Endereço: Rua Augusta, 1058
Bairro: Cerqueira Cesar'),
  (64, '11.378-7', 'São Paulo', 'SP', 'Importação - Cartórios SP Capital', '9º Tabelião de Notas da Capital', 'PAULO ROBERTO FERNANDES', '(11)2174-6850', '1121746850', 'tecnologia@nonocartorio.com.br', 'Código da serventia: 11.378-7
Atribuições: Notas
Endereço: Rua Marconi, 124
Bairro: Republica'),
  (65, '', 'São Paulo', 'SP', 'Importação - Cartórios SP Capital', 'CARTORIO DO 11º TABELIÃO DE NOTAS', 'PAULO AUGUSTO RODRIGUES CRUZ', '(11)5085-5755', '1150855755', 'pauloaugustocruz@hotmail.com', 'Atribuições: Notas
Endereço: RUA DOMINGOS DE MORAIS 1062
Bairro: VILA MARIANA'),
  (66, '', 'São Paulo', 'SP', 'Importação - Cartórios SP Capital', '12º TABELIÃO DE NOTAS DA COMARCA DA CAPITAL', 'SANDRO MACIEL CARVALHO', '(11)3549-6277', '1135496277', 'tabeliao@12tabeliao.com.br', 'Atribuições: Notas
Endereço: Alameda Santos, 1470
Bairro: Cerqueira Cesar'),
  (67, '11.447-0', 'São Paulo', 'SP', 'Importação - Cartórios SP Capital', '1º Tabelionato de Notas de São Paulo - SP', 'RENATA COELHO PADILHA', '(11)5531-0001', '1155310001', 'contato@primeirocartoriosp.com.br', 'Código da serventia: 11.447-0
Atribuições: Notas
Endereço: Rua Princesa Isabel, 363
Bairro: Brooklin'),
  (68, '11.451-2', 'São Paulo', 'SP', 'Importação - Cartórios SP Capital', '8º Tabelião de Notas de São Paulo', 'RAFAEL GIL CIMINO', '(11)3138-4696', '1131384696', 'sac@8tabeliao.com.br', 'Código da serventia: 11.451-2
Atribuições: Notas
Endereço: Rua das Palmeiras, 353
Bairro: Vila Buarque'),
  (69, '11.503-0', 'São Paulo', 'SP', 'Importação - Cartórios SP Capital', 'Oficial de Registro Civil das Pessoas Naturais - 24º Subdistrito Indianópolis', 'ANDRÉ MACHADO DE SOUZA', '(11)4306-7888', '1143067888', 'oficial@24cartorio.com.br', 'Código da serventia: 11.503-0
Atribuições: Notas -> Registro Civil das Pessoas Naturais e de Interdições e Tutelas
Endereço: Avenida dos Eucaliptos nº 679
Bairro: Indianópolis'),
  (70, '', 'São Paulo', 'SP', 'Importação - Cartórios SP Capital', 'OFICIAL DE REGISTRO CIVIL DAS PESSOAS NATURAIS DO 21º SUBDISTRITO DA SAÚDE - CARTÓRIO SAÚDE', 'GIOVANNA TRUFFI RINALDI', '(11)5585-9822', '1155859822', 'atendimento@cartoriosaude.com.br', 'Atribuições: Registro Civil das Pessoas Naturais e de Interdições e Tutelas
Endereço: AVENIDA JABAQUARA, 1336
Bairro: SAÚDE'),
  (71, '11.506-3', 'São Paulo', 'SP', 'Importação - Cartórios SP Capital', 'Oficial de Registro Civil das Pessoas Naturais 36º subdistrito Vila Maria', 'SILVIA MARIA COSTA TYMONCZAK', '(11)2954-4033', '1129544033', 'saopaulo36@arpensp.org.br', 'Código da serventia: 11.506-3
Atribuições: Registro Civil das Pessoas Naturais e de Interdições e Tutelas
Endereço: Rua Curuça, 361
Bairro: Vila Maria'),
  (72, '11.507-1', 'São Paulo', 'SP', 'Importação - Cartórios SP Capital', 'OFICIAL DE REGISTRO CIVIL DAS PESSOAS NATURAIS - 06º SUBDISTRITO – BRÁS, DA COMARCA DA CAPITAL – SP', 'VIRGILIO MAURICIO DE MATTOS BARROSO FILHO', '(11)2693-0871', '1126930871', 'cartoriodobras.certidao@gmail.com', 'Código da serventia: 11.507-1
Atribuições: Notas -> Registro Civil das Pessoas Naturais e de Interdições e Tutelas
Endereço: RUA CASEMIRO DE ABREU, 89
Bairro: BRÁS
Data de envio informada no texto: 07/03/25'),
  (73, '', 'São Paulo', 'SP', 'Importação - Cartórios SP Capital', 'OFICIAL DE REGISTRO CIVIL DAS PESSOAS NATURAIS DO 10º SUBDISTRITO - BELENZINHO, SÃO PAULO/CAPITAL', 'JESSE ALVES DOS SANTOS', '(11)2694-4328', '1126944328', 'cartoriodobelenzinho@terra.com.br', 'Atribuições: Registro Civil das Pessoas Naturais e de Interdições e Tutelas
Endereço: RUA CONSELHEIRO COTEGIPE 468
Bairro: BELENZINHO'),
  (74, '11.514-7', 'São Paulo', 'SP', 'Importação - Cartórios SP Capital', 'OFICIAL DE REGISTRO CIVIL DAS PESSOAS NATURAIS DO 11º SUBDISTRITO DE SANTA CECÍLIA', 'FERNANDO NAVARRO', '(11)3667-2642', '1136672642', 'registrosantacecilia@terra.com.br', 'Código da serventia: 11.514-7
Atribuições: Registro Civil das Pessoas Naturais e de Interdições e Tutelas
Endereço: AVENIDA PACAEMBU, 1.207
Bairro: SANTA CECÍLIA'),
  (75, '11.515-4', 'São Paulo', 'SP', 'Importação - Cartórios SP Capital', 'Oficial de Registro Civil das Pessoas Naturais do 12º Subº Cambuci', 'LETÍCIA ARAÚJO FERREIRA', '(11)3207-1086', '1132071086', 'administrativo@cartoriocambuci.com.br', 'Código da serventia: 11.515-4
Atribuições: Registro Civil das Pessoas Naturais e de Interdições e Tutelas
Endereço: Avenida Lacerda Franco, 852
Bairro: Cambuci'),
  (76, '11.516-2', 'São Paulo', 'SP', 'Importação - Cartórios SP Capital', 'OFICIAL DE REGISTRO CIVIL DAS PESSOAS NATURAIS DO 13 SUBDISTRITO DO BUTANTÃ', 'EVANDRO DA CUNHA', '(11)3092-1188', '1130921188', 'cartoriodobutanta@uol.com.br', 'Código da serventia: 11.516-2
Atribuições: Notas -> Registro Civil das Pessoas Naturais e de Interdições e Tutelas
Endereço: RUA PIRAJUSSARA 432
Bairro: BUTANTÃ'),
  (77, '11.517-0', 'São Paulo', 'SP', 'Importação - Cartórios SP Capital', 'OFICIAL DE REGISTRO CIVIL DAS PESSOAS NATURAIS DO 14º SUBDISTRITO - LAPA', 'JULIANA PATU REBELLO PINHO', '(11)3647-5600', '1136475600', 'contato@cartoriodalapa.com.br', 'Código da serventia: 11.517-0
Atribuições: Registro Civil das Pessoas Naturais e de Interdições e Tutelas
Endereço: Rua Coriolano, 2030
Bairro: Lapa'),
  (78, '11.518-8', 'São Paulo', 'SP', 'Importação - Cartórios SP Capital', 'Oficial de Registro Civil das Pessoas Naturais do 16º Subdistrito - Mooca da Comarca da Capital', 'LUIZ ORLANDO DE BARROS SEGALA', '(11)2679-2300', '1126792300', 'cartoriodamooca@cartoriodamooca.com.br', 'Código da serventia: 11.518-8
Atribuições: Registro Civil das Pessoas Naturais e de Interdições e Tutelas
Endereço: Rua da Mooca 2338
Bairro: Mooca'),
  (79, '11.529-5', 'São Paulo', 'SP', 'Importação - Cartórios SP Capital', 'OFICIAL DE REGISTRO CIVIL DAS PESSOAS NATURAIS DO 33º SUBDISTRITO ALTO DA MOOCA', 'ILZETE VERDERAMO MARQUES', '(11)2532-0948', '1125320948', 'rcpnamooca@uol.com.br', 'Código da serventia: 11.529-5
Atribuições: Registro Civil das Pessoas Naturais e de Interdições e Tutelas
Endereço: RUA DA MOOCA 3878
Bairro: ALTO DA MOOCA'),
  (80, '11.530-3', 'São Paulo', 'SP', 'Importação - Cartórios SP Capital', 'Oficial de Registro Civil das Pessoas Naturais do 34º Subdistrito Cerqueira César', 'ADOLPHO JOSé BASTOS DA CUNHA', '(11)3155-1433', '1131551433', 'adm@cartoriocerqueiracesar.com.br', 'Código da serventia: 11.530-3
Atribuições: Registro Civil das Pessoas Naturais e de Interdições e Tutelas
Endereço: Rua Frei Caneca, nº 371
Bairro: Cerqueira César'),
  (81, '11.532-9', 'São Paulo', 'SP', 'Importação - Cartórios SP Capital', 'OFICIAL DE REGISTRO CIVIL DAS PESSOAS NATURAIS DO 46º SUBDISTRITO DE VILA FORMOSA-CAPITAL', 'DJALMA SEMEGHINI TOMBI', '(11)2674-7501', '1126747501', 'cart46@uol.com.br', 'Código da serventia: 11.532-9
Atribuições: Notas -> Registro Civil das Pessoas Naturais e de Interdições e Tutelas
Endereço: AV. DR. EDUARDO COTCHING, 1649
Bairro: VILA FORMOSA'),
  (82, '11.533-7', 'São Paulo', 'SP', 'Importação - Cartórios SP Capital', 'Oficial de Registro Civil das Pessoas Naturais do 5º Subdistrito Santa Efigênia', 'BIANCA CAROLINE LUZENTE', '(11)3228-3071', '1132283071', 'certidao@5rcpn.com.br', 'Código da serventia: 11.533-7
Atribuições: Registro Civil das Pessoas Naturais e de Interdições e Tutelas
Endereço: AV. IPIRANGA, Nº 1092
Bairro: SANTA EFIGENIA'),
  (83, '', 'São Paulo', 'SP', 'Importação - Cartórios SP Capital', 'OFICIAL DE REGISTRO CIVIL DAS PESSOAS NATURAIS DO DISTRITO DE SÃO MATEUS', 'DANIELA SILVA MROZ', '(11)2014-7373', '1120147373', 'danielamroz@hotmail.com', 'Atribuições: Notas -> Registro Civil das Pessoas Naturais e de Interdições e Tutelas
Endereço: AVENIDA RAGUEB CHOHFI,370
Bairro: SAO MATEUS'),
  (84, '11.536-0', 'São Paulo', 'SP', 'Importação - Cartórios SP Capital', 'Oficial de Registro Civil das Pessoas Naturais do Distrito de Sapopemba', 'ALFREDO DE OLIVEIRA SANTOS NETO', '(11)5977-6364', '1159776364', 'contato@cartoriosapopemba.com.br', 'Código da serventia: 11.536-0
Atribuições: Registro Civil das Pessoas Naturais e de Interdições e Tutelas
Endereço: AV. VILA EMA, Nº 5.956
Bairro: VILA EMA'),
  (85, '11.814-1', 'São Paulo', 'SP', 'Importação - Cartórios SP Capital', 'Oficial de Registro Civil das Pessoas Naturais e Tabelião de Notas do Distrito de Parelheiros', 'ODELIO ANTONIO DE LIMA', '(11)5938-0668', '1159380668', 'cartoriolima@uol.com.br', 'Código da serventia: 11.814-1
Atribuições: Notas -> Registro Civil das Pessoas Naturais e de Interdições e Tutelas
Endereço: Estrada Ecoturistica de Parelheiros, 1762
Bairro: Jardim Paulo Afonso'),
  (86, '11.819-0', 'São Paulo', 'SP', 'Importação - Cartórios SP Capital', 'Oficial de Registro Civil das Pessoas Naturais e Tabelião de Notas do Distrito de São Miguel Paulista - São Paulo - SP', 'ANDREA SANTOS GIGLIOTTI', '(11)3054-3838', '1130543838', 'rcsaomiguel@gmail.com', 'Código da serventia: 11.819-0
Atribuições: Notas -> Registro Civil das Pessoas Naturais e de Interdições e Tutelas
Endereço: Avenida Marechal Tito 108
Bairro: São Miguel Paulista
Data de envio informada no texto: 10/03/25'),
  (87, '', 'São Paulo', 'SP', 'Importação - Cartórios SP Capital', 'OFICIAL DE REGISTRO CIVIL DE PESSOAS NATURAIS DO DISTRITO DE CAPÃO REDONDO', 'CLAUDINEI JOSE PIRES', '(11)5511-8601', '1155118601', 'atendimento@cartoriocapaoredondo.com.br', 'Atribuições: Registro Civil das Pessoas Naturais e de Interdições e Tutelas
Endereço: ESTRADA DE ITAPECERICA, 3.732
Bairro: CAPÃO REDONDO'),
  (88, '11.914-9', 'São Paulo', 'SP', 'Importação - Cartórios SP Capital', 'Oficial de Registro Civil de Pessoas Naturais do 8º Subdistrito Santana', 'VINíCIUS BARBOSA OLIVEIRA', '(11)2344-1717', '1123441717', 'administrativo@cartoriosantana.com.br', 'Código da serventia: 11.914-9
Atribuições: Notas -> Registro Civil das Pessoas Naturais e de Interdições e Tutelas
Endereço: Rua Voluntários da Pátria, 2182 Recepção / Rua Duarte de Azevedo 30 Estacionamento
Bairro: Santana'),
  (89, '', 'São Paulo', 'SP', 'Importação - Cartórios SP Capital', '35º OFICIAL DO REGISTRO CIVIL DAS PESSOAS NATURAIS SUBDISTRITO BARRA FUNDA', 'MICHELLE MESSIAS ESTEVAM RENOSTO', '(11)3825-4884', '1138254884', 'contato@cartoriobarrafunda.com.br', 'Atribuições: Notas -> Registro Civil das Pessoas Naturais e de Interdições e Tutelas
Endereço: AVENIDA MARQUÊS DE SÃO VICENTE, Nº 587
Bairro: BARRA FUNDA'),
  (90, '12.133-5', 'São Paulo', 'SP', 'Importação - Cartórios SP Capital', 'Oficial do Registro Civil das Pessoas Naturais do Distrito do Jardim São Luís, município e Comarca de São Paulo - SP', 'EVANICE CALLADO RODRIGUES DOS SANTOS', '(11)5512-1928', '1155121928', 'oficial@cartoriodojardimsaoluis.com.br', 'Código da serventia: 12.133-5
Atribuições: Registro Civil das Pessoas Naturais e de Interdições e Tutelas
Endereço: Estrada de Itapecerica, 305
Bairro: Vila das Belezas'),
  (91, '12.204-4', 'São Paulo', 'SP', 'Importação - Cartórios SP Capital', 'Oficial Reg Civ Pess Nat 9º subdis Vl Mariana', 'JOãO BAPTISTA MARTELLETTO', '(11)3059-2211', '1130592211', 'contato@cartoriovilamariana.com.br', 'Código da serventia: 12.204-4
Atribuições: Notas -> Registro Civil das Pessoas Naturais e de Interdições e Tutelas
Endereço: Praça Oswaldo Cruz, 39
Bairro: Paraiso'),
  (92, '12.212-7', 'São Paulo', 'SP', 'Importação - Cartórios SP Capital', 'OFICIO DE REGISTRO CIVIL DAS PESSOAS NATURAIS DO 47º SUBDISTRTITO DA CAPITAL DE SÃO PAULO VILA GUILHERME', 'ERICA BARBOSA E SILVA', '(11)3995-6010', '1139956010', 'vilaguilherme47@gmail.com', 'Código da serventia: 12.212-7
Atribuições: Registro Civil das Pessoas Naturais e de Interdições e Tutelas
Endereço: AVENIDA GENERAL ATALIBA LEONEL 1498
Bairro: CARANDIRU'),
  (93, '', 'São Paulo', 'SP', 'Importação - Cartórios SP Capital', '8º TABELIÃO DE PROTESTO DE LETRAS E TÍTULOS DA CAPITAL – SÃO PAULO', 'JOSE ROBERTO FERREIRA GOUVÊA', '(11)3245-8500', '1132458500', 'contato@8tpsp.com.br', 'Atribuições: Protesto de Títulos
Endereço: Rua 15 de Novembro nº 331
Bairro: Centro'),
  (94, '12.226-7', 'São Paulo', 'SP', 'Importação - Cartórios SP Capital', 'RCPN e Tab. de Notas do Distrito do Jaraguá', 'MONETE HIPóLITO SERRA', '(11)3944-6400', '1139446400', 'cartoriojaragua@cartoriojaragua.com.br', 'Código da serventia: 12.226-7
Atribuições: Notas -> Registro Civil das Pessoas Naturais e de Interdições e Tutelas
Endereço: Avenida Raimundo Pereira de Magalhães nº 11001
Bairro: Jaraguá'),
  (95, '12.258-0', 'São Paulo', 'SP', 'Importação - Cartórios SP Capital', 'Oficial de RCPN e Tabelião de Notas do 31º Subdistrito - Pirituba', 'DEBORAH CIOCCI', '(11)3901-7035', '1139017035', 'atende@cartoriopiritubasp.com.br', 'Código da serventia: 12.258-0
Atribuições: Notas -> Registro Civil das Pessoas Naturais e de Interdições e Tutelas
Endereço: Avenida Mutinga, 201
Bairro: Pirituba'),
  (96, '12.272-1', 'São Paulo', 'SP', 'Importação - Cartórios SP Capital', 'Oficial de Registro Civil das Pessoas Naturais do 20º Subdistrito - Jardim América', 'LIANA VARZELLA MIMARY', '(11)3081-9388', '1130819388', 'diretoria@cartoriojardimamerica.com.br', 'Código da serventia: 12.272-1
Atribuições: Notas -> Registro Civil das Pessoas Naturais e de Interdições e Tutelas
Endereço: Rua Henrique Schaumann, 518
Bairro: Pinheiros'),
  (97, '12.273-9', 'São Paulo', 'SP', 'Importação - Cartórios SP Capital', 'REGISTRO CIVIL DAS PESSOAS NATURAIS DO 25º SUBDISTRITO PARI - SP', 'CAROLINA MOURA DE ALMEIDA BUENO', '(11)3311-8646', '1133118646', 'saopaulo25@arpensp.org.br', 'Código da serventia: 12.273-9
Atribuições: Registro Civil das Pessoas Naturais e de Interdições e Tutelas
Endereço: RUA RIO BONITO, 1478
Bairro: PARI'),
  (98, '12.274-7', 'São Paulo', 'SP', 'Importação - Cartórios SP Capital', 'Cartório Vila Prudente', 'RENATO LUIZ DE PAULA SOUSA JUNIOR', '(11)2271-3300', '1122713300', 'certidao@cartoriovilaprudente.com.br', 'Código da serventia: 12.274-7
Atribuições: Registro Civil das Pessoas Naturais e de Interdições e Tutelas
Endereço: RUA IBITIRAMA 614
Bairro: VILA PRUDENTE'),
  (99, '12.278-8', 'São Paulo', 'SP', 'Importação - Cartórios SP Capital', 'Registro Civil das Pessoas Naturais do 42º Subdistrito (Jabaquara) da Comarca da Capital do Estado de São Paulo', 'JÚLIA CLÁUDIA RODRIGUES DA CUNHA MOTA', '(11)5585-9603', '1155859603', 'certidoes@cartoriojabaquara.com.br', 'Código da serventia: 12.278-8
Atribuições: Notas -> Registro Civil das Pessoas Naturais e de Interdições e Tutelas
Endereço: Avenida Fagundes Filho, 343
Bairro: Vila Monte Alegre'),
  (100, '12.279-6', 'São Paulo', 'SP', 'Importação - Cartórios SP Capital', 'Registro Civil das Pessoas Naturais do 44º Subdistrito-Limão, nesta Capital', 'CARLOS ALBERTO GALLEGO', '(11)3858-5461', '1138585461', '44regcivil@uol.com.br', 'Código da serventia: 12.279-6
Atribuições: Registro Civil das Pessoas Naturais e de Interdições e Tutelas
Endereço: Av.Mandaqui nº 98
Bairro: Limão'),
  (101, '12.280-4', 'São Paulo', 'SP', 'Importação - Cartórios SP Capital', 'Registro Civil das Pessoas Naturais do Segundo Subdistrito - Liberdade', 'SILVANA MITIKO KOTI', '(11)2614-4989', '1126144989', 'oficial@registroliberdade.com.br', 'Código da serventia: 12.280-4
Atribuições: Registro Civil das Pessoas Naturais e de Interdições e Tutelas
Endereço: Rua Tamandaré, 768
Bairro: Liberdade
Data de envio informada no texto: 11/03/25'),
  (102, '', 'São Paulo', 'SP', 'Importação - Cartórios SP Capital', 'Registro Civil do 23º Subdistrito Casa Verde', 'STAEL BAHIENSE DE ARAÚJO', '(11)3966-0062', '1139660062', 'cartorio@cartoriocasaverde.com.br', 'Atribuições: Registro Civil das Pessoas Naturais e de Interdições e Tutelas
Endereço: Avenida Baruel, 294 e 302
Bairro: Casa Verde'),
  (103, '', 'São Paulo', 'SP', 'Importação - Cartórios SP Capital', 'Serviço de Registro Civil e Tabelionato de Notas do Distrito de Guaianases, Comarca da Capital de São Paulo', 'SORAYA PINA BASTOS', '(11)2552-7741', '1125527741', 'diretoria@cartorioguaianases.com.br', 'Atribuições: Notas -> Registro Civil das Pessoas Naturais e de Interdições e Tutelas
Endereço: Rua Evaldo Calabrez, 120
Bairro: Guaianases'),
  (104, '12.459-4', 'São Paulo', 'SP', 'Importação - Cartórios SP Capital', 'Sétimo Oficial de Registro de Imóveis', 'ADEMAR FIORANELLI', '(11)3138-1415', '1131381415', '7ri.sp@terra.com.br', 'Código da serventia: 12.459-4
Atribuições: Registro de Imóveis
Endereço: Rua Augusta n. 356
Bairro: Consolação'),
  (105, '12.462-8', 'São Paulo', 'SP', 'Importação - Cartórios SP Capital', '6º TABELIÃO DE NOTAS DE SÃO PAULO - SP', 'HENRIQUE DE ALMEIDA PRADO FRANCESCHI', '(11)3861-7600', '1138617600', 'henrique@sextotabeliao.com.br', 'Código da serventia: 12.462-8
Atribuições: Notas
Endereço: Avenida Francisco Matarazzo 682
Bairro: Água Branca'),
  (106, '', 'São Paulo', 'SP', 'Importação - Cartórios SP Capital', '6º OFICIAL DE REGISTRO DE IMÓVEIS DA CAPITAL – SÃO PAULO', 'RAFAEL RICARDO GRUBER', '(11)5080-3100', '1150803100', '6risp@6risp.com.br', 'Atribuições: Registro de Imóveis
Endereço: Av. Francisco Mesquita, 1000
Bairro: Central Plaza Shopping'),
  (107, '', 'São Paulo', 'SP', 'Importação - Cartórios SP Capital', '27º CARTÓRIO DO TATUAPÉ', 'FLAVIO APARECIDO RODRIGUES GUMIERI', '(11)2942-1010', '1129421010', 'flavio@cartoriotatuape.com.br', 'Atribuições: Notas -> Registro Civil das Pessoas Naturais e de Interdições e Tutelas
Endereço: Rua Coronel Luiz Americano, 242
Bairro: Tatuapé'),
  (108, '08.852-6', 'Rio de Janeiro', 'RJ', 'Importação - Cartórios RJ Capital', '1 OFICIO DO REGISTRO DE TITULOS E DOCUMENTOS', 'GERALDO CALMON COSTA JUNIOR', '(21)2221-2209', '2122212209', 'rtd1rj@hotmail.com', 'Código da serventia: 08.852-6
Atribuições: Registro de Títulos e Documentos e Civis das Pessoas Jurídicas
Endereço: RUA SÃO JOSÉ, 90 / 1808
Bairro: CENTRO'),
  (109, '08.854-2', 'Rio de Janeiro', 'RJ', 'Importação - Cartórios RJ Capital', '10º Ofício de Registro de Imóveis', 'MARIO GONçALVES', '(21)3197-0540', '2131970540', 'cartorio@10ri-rj.com.br', 'Código da serventia: 08.854-2
Atribuições: Registro de Imóveis
Endereço: Travessa do Paço, 23, sala 1103
Bairro: Centro'),
  (110, '08.855-9', 'Rio de Janeiro', 'RJ', 'Importação - Cartórios RJ Capital', '10º serviço notarial', 'CLAUDIO ANTONIO MATTOS DE SOUZA', '(21)2272-1950', '2122721950', '10.notarial@gmail.com', 'Código da serventia: 08.855-9
Atribuições: Notas
Endereço: AV. NILO PEÇANHA, 26
Bairro: CENTRO'),
  (111, '08.856-7', 'Rio de Janeiro', 'RJ', 'Importação - Cartórios RJ Capital', '11º REGISTRO CIVIL DAS PESSOAS NATURAIS', 'RAQUEL VIEIRA ABRÃO REZENDE', '(21)3439-6507', '2134396507', 'cartorio@11rcpnrj.com.br', 'Código da serventia: 08.856-7
Atribuições: Registro Civil das Pessoas Naturais e de Interdições e Tutelas
Endereço: AV. DOM HÉLDER CÂMARA , Nº 6991
Bairro: PILARES'),
  (112, '08.858-3', 'Rio de Janeiro', 'RJ', 'Importação - Cartórios RJ Capital', '11º OFICIO DO REGISTRO DE IMÓVEIS', 'MARIA ESTHER WANDERLEY SILVA', '(21)2018-0376', '2120180376', 'cartorio11rgi@11rirj.com.br', 'Código da serventia: 08.858-3
Atribuições: Registro de Imóveis
Endereço: RUA SETE DE SETEMBRO, 32 - 4º ANDAR
Bairro: CENTRO'),
  (113, '08.859-1', 'Rio de Janeiro', 'RJ', 'Importação - Cartórios RJ Capital', '12º OFÍCIO DE NOTAS', 'PEDRO CASTILHO', '(21)3852-4000', '2138524000', '12oficiodenotas@gmail.com', 'Código da serventia: 08.859-1
Atribuições: Notas
Endereço: Rua do Rosário, 134
Bairro: Centro'),
  (114, '08.862-5', 'Rio de Janeiro', 'RJ', 'Importação - Cartórios RJ Capital', '14º Registro Civil das Pessoas Naturais e Tabelionato', 'TADEU BAGUINHO DINIZ', '(21)3495-7985', '2134957985', 'atendimento@cartoriomadureira14.com.br', 'Código da serventia: 08.862-5
Atribuições: Registro Civil das Pessoas Naturais e de Interdições e Tutelas
Endereço: estrada do portela, 222.
Bairro: Madureira'),
  (115, '08.863-3', 'Rio de Janeiro', 'RJ', 'Importação - Cartórios RJ Capital', '14º Oficio de Notas', 'CONCELINA HENRIQUE DE SOUZA', '(21)2257-1985', '2122571985', '14onrj@gmail.com', 'Código da serventia: 08.863-3
Atribuições: Notas
Endereço: Rua Constante Ramos, 29 loja A
Bairro: Copacabana'),
  (116, '08.864-1', 'Rio de Janeiro', 'RJ', 'Importação - Cartórios RJ Capital', '15° Ofício de Notas da Comarca da Capital do Estado do Rio de Janeiro', 'FERNANDA DE FREITAS LEITÃO', '(21)3233-2600', '2132332600', 'faleconosco@cartorio15.com.br', 'Código da serventia: 08.864-1
Atribuições: Notas
Endereço: Rua do Ouvidor, 89
Bairro: Centro'),
  (117, '08.865-8', 'Rio de Janeiro', 'RJ', 'Importação - Cartórios RJ Capital', '16 oficio de notas', 'OLIVIA MOTTA SCISINIO DIAS', '(21)2247-8995', '2122478995', 'cartorio16notas@gmail.com', 'Código da serventia: 08.865-8
Atribuições: Notas
Endereço: rua visconde de piraja 82, SALA 208
Bairro: Ipanema'),
  (118, '08.867-4', 'Rio de Janeiro', 'RJ', 'Importação - Cartórios RJ Capital', '17o.Oficio de Notas da Comarca da Capital', 'CARLOS ALBERTO FIRMO OLIVEIRA', '(21)2107-9800', '2121079800', '17oficiocarlosfirmo@gmail.com', 'Código da serventia: 08.867-4
Atribuições: Notas
Endereço: Rua do Carmo,63
Bairro: Centro'),
  (119, '08.868-2', 'Rio de Janeiro', 'RJ', 'Importação - Cartórios RJ Capital', '18º OFICIO DE NOTAS', 'LUIS VITORIANO VIEIRA TEIXEIRA', '(21)2507-6151', '2125076151', 'luispaulo@18oficiodenotas.com.br', 'Código da serventia: 08.868-2
Atribuições: Notas
Endereço: AVENIDA PRESIDENTE VARGAS, 435
Bairro: CENTRO'),
  (120, '08.870-8', 'Rio de Janeiro', 'RJ', 'Importação - Cartórios RJ Capital', '1º Ofício do RCPN do Rio de Janeiro', 'JÚLIO CESAR MACEDÔNIO BUYS II', '(21)3386-1504', '2133861504', 'atendimento@1rcpn.com.br', 'Código da serventia: 08.870-8
Atribuições: Registro Civil das Pessoas Naturais e de Interdições e Tutelas
Endereço: PRAIA DA OLARIA, Nº 155 www.1rcpn.com.br
Bairro: COCOTÁ'),
  (121, '08.887-2', 'Rio de Janeiro', 'RJ', 'Importação - Cartórios RJ Capital', '1º OFICIO DE NOTAS DA CAPITAL', 'JOSÉ DE BRITTO FREIRE FILHO', '(21)2505-4350', '2125054350', 'oficio@1oficio.com.br', 'Código da serventia: 08.887-2
Atribuições: Notas
Endereço: RUA DA QUITANDA 50
Bairro: CENTRO'),
  (122, '08.890-6', 'Rio de Janeiro', 'RJ', 'Importação - Cartórios RJ Capital', '2 OFÍCIO DE NOTAS DO RIO DE JANEIRO', 'ADILSON WAGNER FIRMINO', '(21)3827-8011', '2138278011', 'adm@2oficiojpa.com.br', 'Código da serventia: 08.890-6
Atribuições: Notas
Endereço: ESTRADA DOS BANDEIRANTES 209
Bairro: TAQUARA'),
  (123, '08.891-4', 'Rio de Janeiro', 'RJ', 'Importação - Cartórios RJ Capital', '2. OFÍCIO DO REGISTRO DE IMÓVEIS', 'FERNANDO BEZERRA FALCÃO', '(21)2533-4180', '2125334180', 'cartorio@2rgi-rj.com.br', 'Código da serventia: 08.891-4
Atribuições: Registro de Imóveis
Endereço: AVENIDA NILO PEÇANHA, 26, 5o. ANDAR
Bairro: CENTRO'),
  (124, '08.892-2', 'Rio de Janeiro', 'RJ', 'Importação - Cartórios RJ Capital', '20º OFÍCIO DE NOTAS DA CAPITAL', 'JOSÉ CLAUDIO LOPES DA SILVA', '(21)3546-2220', '2135462220', 'contatocartorio20@gmail.com', 'Código da serventia: 08.892-2
Atribuições: Notas
Endereço: Praça do Gado, 33
Bairro: Santa Cruz'),
  (125, '08.893-0', 'Rio de Janeiro', 'RJ', 'Importação - Cartórios RJ Capital', '21º OFÍCIO DE NOTAS', 'VANELE ROCHA FALCÃO CÉSAR', '(21)2532-2121', '2125322121', 'contato@cartorio21.com.br', 'Código da serventia: 08.893-0
Atribuições: Notas
Endereço: AV DAS AMERICAS
Bairro: BARRA DA TIJUCA'),
  (126, '08.894-8', 'Rio de Janeiro', 'RJ', 'Importação - Cartórios RJ Capital', '22° Oficio de Notas da Comarca da Capital', 'JOSÉ WILHAMI FERNANDES DE OLIVEIRA', '(21)2544-0277', '2125440277', 'juridico@22oficiodenotas.com.br', 'Código da serventia: 08.894-8
Atribuições: Notas
Endereço: Rua Senador Dantas, 39
Bairro: Centro'),
  (127, '08.895-5', 'Rio de Janeiro', 'RJ', 'Importação - Cartórios RJ Capital', '2o Ofício do Registro de Títulos e Documentos', 'SILVIA RENATA DE OLIVEIRA PENCHEL', '(21)2531-1304', '2125311304', 'segundortdrj@gmail.com', 'Código da serventia: 08.895-5
Atribuições: Registro de Títulos e Documentos e Civis das Pessoas Jurídicas
Endereço: RUA SÃO JOSÉ, 90
Bairro: Centro'),
  (128, '08.915-1', 'Rio de Janeiro', 'RJ', 'Importação - Cartórios RJ Capital', '3º OFICIO DE REGISTRO DE IMOVEIS', 'ANTONIO MARINS PEIXOTO FILHO', '(21)2533-9620', '2125339620', 'c3ofrirj@3ri-rj.com.br', 'Código da serventia: 08.915-1
Atribuições: Registro de Imóveis
Endereço: AV. PRESIDENTE ANTONIO CARLOS 607 9º ANDAR
Bairro: CENTRO'),
  (129, '08.916-9', 'Rio de Janeiro', 'RJ', 'Importação - Cartórios RJ Capital', '3º Oficio de Registro de Títulos e Documentos', 'RAULITO ALVES DA SILVA', '(21)2221-2005', '2122212005', 'cartorio3rtdrj@ig.com.br', 'Código da serventia: 08.916-9
Atribuições: Registro de Títulos e Documentos e Civis das Pessoas Jurídicas
Endereço: Rua da Quitanda 52 - 3º andar
Bairro: Centrro'),
  (130, '08.922-7', 'Rio de Janeiro', 'RJ', 'Importação - Cartórios RJ Capital', '4º Ofício de Notas do Rio de Janeiro', 'HAMILTON LIMA BARROS', '(21)3434-9400', '2134349400', 'tabelionato@cartoriohbarros.com.br', 'Código da serventia: 08.922-7
Atribuições: Notas
Endereço: AVENIDA DAS AMÉRICAS 16.401
Bairro: BARRA DA TIJUCA'),
  (131, '08.923-5', 'Rio de Janeiro', 'RJ', 'Importação - Cartórios RJ Capital', '4º REGISTRO DE TITULOS E DOCUMENTOS DA COMARCA DA CAPITAL-RJ', 'JAIRO VASCONCELOS RODRIGUES CARMO', '(21)2221-0770', '2122210770', 'jvc@4rtd-rio.com.br', 'Código da serventia: 08.923-5
Atribuições: Registro de Títulos e Documentos e Civis das Pessoas Jurídicas
Endereço: Av. Rio Branco, 109, sala 1702
Bairro: CENTRO'),
  (132, '08.924-3', 'Rio de Janeiro', 'RJ', 'Importação - Cartórios RJ Capital', '5o Ofício de Registro de Títulos e Documentos do Rio de Janeiro', 'DURVAL HALE', '(21)2507-5197', '2125075197', 'durvalhale@gmail.com', 'Código da serventia: 08.924-3
Atribuições: Registro de Títulos e Documentos e Civis das Pessoas Jurídicas
Endereço: Avenida Rio Branco, 109 sala 202
Bairro: Centro - Rio de Janeiro'),
  (133, '08.925-0', 'Rio de Janeiro', 'RJ', 'Importação - Cartórios RJ Capital', '5º REGISTRO CIVIL DE PESSOAS NATURAIS DA CAPITAL DO RIO DE JANEIRO', 'ALAN JOSÉ DOS SANTOS BORGES', '(21)3195-2530', '2131952530', 'faleconosco@cartoriocopacabana.com.br', 'Código da serventia: 08.925-0
Atribuições: Registro Civil das Pessoas Naturais e de Interdições e Tutelas
Endereço: RUA SÃO JOÃO BATISTA, 28
Bairro: BOTAFOGO'),
  (134, '08.927-6', 'Rio de Janeiro', 'RJ', 'Importação - Cartórios RJ Capital', '5º OFÍCIO DE REGISTRO DE IMÓVEIS - RJ', 'MARINA ARAÚJO CAMPOS CARDOSO', '(21)3529-7966', '2135297966', '5rgi.rj@bol.com.br', 'Código da serventia: 08.927-6
Atribuições: Registro de Imóveis
Endereço: Avenida Atlântica, 1130, 4º andar
Bairro: Copacabana'),
  (135, '08.928-4', 'Rio de Janeiro', 'RJ', 'Importação - Cartórios RJ Capital', '5º OFÍCIO DO REGISTRO DE DISTRIBUIÇÃO', 'DULCINÉA DAFLON FERRO CARNOTA', '(21)2509-5543', '2125095543', 'cartorio@5registrodedistribuicao.com.br', 'Código da serventia: 08.928-4
Atribuições: Registro de Distribuição
Endereço: AVENIDA RIO BRANCO, 131, 11 ANDAR
Bairro: CENTRO'),
  (136, '08.934-2', 'Rio de Janeiro', 'RJ', 'Importação - Cartórios RJ Capital', '7º Registro Civil de Pessoas Naturais e Notas', 'JOSé MAURO CAVALCANTI', '(21)2502-3913', '2125023913', 'cartorio@setimoregistrocivil.com.br', 'Código da serventia: 08.934-2
Atribuições: Notas -> Registro Civil das Pessoas Naturais e de Interdições e Tutelas
Endereço: Rua Joaquim Palhares nº 267, loja B
Bairro: Cidade Nova'),
  (137, '08.939-1', 'Rio de Janeiro', 'RJ', 'Importação - Cartórios RJ Capital', '8º OFICIO DE NOTAS', 'GUSTAVO BANDEIRA DA ROCHA OLIVEIRA', '(21)2463-2958', '2124632958', 'contato@8oficio.com.br', 'Código da serventia: 08.939-1
Atribuições: Notas
Endereço: Avenida Ataulfo de Paiva 135, loja J, Loja 221 e Loja 319 Adm
Bairro: Leblon'),
  (138, '08.942-5', 'Rio de Janeiro', 'RJ', 'Importação - Cartórios RJ Capital', '9º OFICIO DE REGISTRO DE IMOVEIS', 'ADILSON ALVES MENDES', '(21)2533-6430', '2125336430', 'cnj@9rgirj.com.br', 'Código da serventia: 08.942-5
Atribuições: Registro de Imóveis
Endereço: AV NILO PECANHA, 12
Bairro: CENTRO'),
  (139, '08.960-7', 'Rio de Janeiro', 'RJ', 'Importação - Cartórios RJ Capital', 'CARTÓRIO 24º OFICIO DE NOTAS', 'JOSÉ MARIO PINHEIRO PINTO', '(21)3553-6021', '2135536021', 'cartorio@24oficio.com.br', 'Código da serventia: 08.960-7
Atribuições: Notas
Endereço: AVENIDA ALMIRANTE BARROS, 139- LOJA C -SOBRELOJA 503
Bairro: CENTRO'),
  (140, '08.970-6', 'Rio de Janeiro', 'RJ', 'Importação - Cartórios RJ Capital', 'Cartório 6º Ofício de Notas', 'CARLOS ALEXANDRE BRITO SOUSA', '(21)2558-0117', '2125580117', 'cartorio@sextooficiorj.com.br', 'Código da serventia: 08.970-6
Atribuições: Notas
Endereço: Rua. Artur Bernardes,14
Bairro: Catete'),
  (141, '08.972-2', 'Rio de Janeiro', 'RJ', 'Importação - Cartórios RJ Capital', 'CARTORIO 8º OFICIO DE REGISTRO DE IMOVEIS', 'ARNALDO COLOCCI NETTO', '(21)2224-7723', '2122247723', 'oitavoficio@hotmail.com', 'Código da serventia: 08.972-2
Atribuições: Registro de Imóveis
Endereço: RUA DA ALFANDEGA, Nº 91
Bairro: CENTRO'),
  (142, '08.973-0', 'Rio de Janeiro', 'RJ', 'Importação - Cartórios RJ Capital', '9º OFICIO DE NOTAS DA CAPITAL', 'MARIA ISABELA RIBEIRO', '(21)99004-7573', '21990047573', '9notascapital@gmail.com', 'Código da serventia: 08.973-0
Atribuições: Notas
Endereço: RUA DAGMAR DA FONSECA, 97, LOJA B
Bairro: MADUREIRA'),
  (143, '09.068-8', 'Rio de Janeiro', 'RJ', 'Importação - Cartórios RJ Capital', '3º Ofício de Notas da Capital', 'VICTOR HUGO FONSECA CARVALHO', '(21)2035-1461', '2120351461', '3oficiodenotasrj@gmail.com', 'Código da serventia: 09.068-8
Atribuições: Notas
Endereço: Rua Beneditinos, 30
Bairro: Centro'),
  (144, '09.081-1', 'Rio de Janeiro', 'RJ', 'Importação - Cartórios RJ Capital', 'CARTORIO DO 8º OFICIO DO REGISTRO DE DISTRIBUIÇÃO DO RIO DE JANEIRO', 'LUIZA OLIVEIRA GUEDES', '(21)2531-2309', '2125312309', 'distribuidoroitavo@gmail.com', 'Código da serventia: 09.081-1
Atribuições: Registro de Distribuição
Endereço: RUA DA ASSEMBLEIA Nº 10
Bairro: Centro'),
  (145, '09.216-3', 'Rio de Janeiro', 'RJ', 'Importação - Cartórios RJ Capital', 'Ofício de Notas e Registro de Contratos Marítimos', 'ALOIR MELCHIADES DE SOUZA', '(21)3993-1954', '2139931954', 'fabio@cartoriomaritimo.com.br', 'Código da serventia: 09.216-3
Atribuições: Notas -> Registro de Contratos Marítimos
Endereço: Av. Embaixador Abelardo Bueno, n. 1
Bairro: Barra da Tijuca'),
  (146, '09.234-6', 'Rio de Janeiro', 'RJ', 'Importação - Cartórios RJ Capital', 'PRIMEIRO SERVIÇO REGISTRAL DE IMÓVEIS - CAPITAL - RJ.', 'LELIO GABRIEL HELIODORO DOS SANTOS', '(21)2581-1942', '2125811942', 'cartorio@1sri-rj.com.br', 'Código da serventia: 09.234-6
Atribuições: Registro de Imóveis
Endereço: RUA ARQUIAS CORDEIRO Nº 486
Bairro: MEIER'),
  (147, '09.313-8', 'Rio de Janeiro', 'RJ', 'Importação - Cartórios RJ Capital', '09º RCPN E TABELIONATO', 'ALAOR MELLO', '(21)2589-8262', '2125898262', 'cartoriosaocristovao@cartoriosaocristovao.com.br', 'Código da serventia: 09.313-8
Atribuições: Notas -> Registro Civil das Pessoas Naturais e de Interdições e Tutelas
Endereço: Rua São Cristóvão, 489
Bairro: São Cristóvão'),
  (148, '09.314-6', 'Rio de Janeiro', 'RJ', 'Importação - Cartórios RJ Capital', 'OITAVO REGISTRO CIVIL E TABELIONATO DA COMARCA DA CAPITAL - RJ', 'DANIEL NILSON RIBEIRO', '(21)2298-2022', '2122982022', 'cartorio@8rcpn.com.br', 'Código da serventia: 09.314-6
Atribuições: Notas -> Registro Civil das Pessoas Naturais e de Interdições e Tutelas
Endereço: RUA DR. PEREIRA DOS SANTOS, 25
Bairro: TIJUCA'),
  (149, '09.324-5', 'Rio de Janeiro', 'RJ', 'Importação - Cartórios RJ Capital', 'Registro Civil das Pessoas Jurídicas do Rio de Janeiro', 'RODOLFO PINHEIRO DE MORAES', '(21)3520-5902', '2135205902', 'rodolforcpj@gmail.com', 'Código da serventia: 09.324-5
Atribuições: Registro de Títulos e Documentos e Civis das Pessoas Jurídicas
Endereço: Rua Mexico 148
Bairro: Centro'),
  (150, '09.325-2', 'Rio de Janeiro', 'RJ', 'Importação - Cartórios RJ Capital', '4º REGISTRO CIVIL DE PESSOAS NATURAIS DO RIO DE JANEIRO', 'PRISCILLA MACHADO SOARES MILHOMEM', '(21)2556-5113', '2125565113', 'cartorio@cartoriocatete.com.br', 'Código da serventia: 09.325-2
Atribuições: Registro Civil das Pessoas Naturais e de Interdições e Tutelas
Endereço: Rua Correia Dutra, 75-B
Bairro: Flamengo'),
  (151, '09.332-8', 'Rio de Janeiro', 'RJ', 'Importação - Cartórios RJ Capital', 'RIO DE JANEIRO 7 OFICIO DE NOTAS DA CAPITAL', 'EDYANNE MOURA DA FROTA CORDEIRO', '(21)3078-1122', '2130781122', 'adm@7oficiodenotas.com', 'Código da serventia: 09.332-8
Atribuições: Notas
Endereço: RUA SANTA SOFIA 139
Bairro: TIJUCA'),
  (152, '09.334-4', 'Rio de Janeiro', 'RJ', 'Importação - Cartórios RJ Capital', '4o Ofício de Registro de Imóveis do Rio de Janeiro', 'ALEXIS MENDONÇA CAVICHINI TEIXEIRA DE SIQUEIRA', '(21)3401-7252', '2134017252', 'cartorio@4rgirj.com.br', 'Código da serventia: 09.334-4
Atribuições: Registro de Imóveis
Endereço: Rua do Prado, 41, loja 101
Bairro: Santa Cruz'),
  (153, '09.335-1', 'Rio de Janeiro', 'RJ', 'Importação - Cartórios RJ Capital', 'RIO DE JANEIRO CARTÓRIO DO 23° OFÍCIO DE NOTAS', 'DEBORA DOS SANTOS PIMENTEL VIEGAS', '(21)2509-2665', '2125092665', 'deboraviegas@23notasrj.com', 'Código da serventia: 09.335-1
Atribuições: Notas
Endereço: AVENIDA PRESIDENTE ANTONIO CARLOS, 607
Bairro: CENTRO'),
  (154, '09.336-9', 'Rio de Janeiro', 'RJ', 'Importação - Cartórios RJ Capital', 'Rio de Janeiro Cartório do 2º Ofício do Registro de Interdições e Tutelas', 'MARIA DA GLORIA MARTINS DE CARVALHO', '(21)2533-1812', '2125331812', 'cartinter2@mundivox.com.br', 'Código da serventia: 09.336-9
Atribuições: Registro Civil das Pessoas Naturais e de Interdições e Tutelas
Endereço: Rua da Assembleia nº 19
Bairro: Centro'),
  (155, '09.337-7', 'Rio de Janeiro', 'RJ', 'Importação - Cartórios RJ Capital', 'RIO DE JANEIRO CARTORIO DO 6° OFICIO DE REGISTRO DE TITULOS E DOCUMENTOS', 'SONIA MARIA ANDRADE DOS SANTOS', '(21)2233-7878', '2122337878', 'substituto@6rtd-rj.com.br', 'Código da serventia: 09.337-7
Atribuições: Registro de Títulos e Documentos e Civis das Pessoas Jurídicas
Endereço: Avenida Afonso Arinos de Melo Franco, nº 222, bloco 2A, sala 301
Bairro: Barra da Tijuca'),
  (156, '09.338-5', 'Rio de Janeiro', 'RJ', 'Importação - Cartórios RJ Capital', 'RJ-Cartório do 7º Ofício de Registro de Imóveis', 'DÉCIO LUIZ GOMES', '(21)2232-9744', '2122329744', 'contato@7ri-rj.com.br', 'Código da serventia: 09.338-5
Atribuições: Registro de Imóveis
Endereço: Rua Sete de Setembro, 32 - 3º andar
Bairro: Centro'),
  (157, '09.353-4', 'Rio de Janeiro', 'RJ', 'Importação - Cartórios RJ Capital', '13º Registro Civil das Pessoas Naturais da Comarca da Capital/RJ', 'PIERRE OLIVEIRA BATISTA SAIDLER', '(21)3579-0062', '2135790062', 'administracao@13rcpn.com.br', 'Código da serventia: 09.353-4
Atribuições: Registro Civil das Pessoas Naturais e de Interdições e Tutelas
Endereço: Av. Cesário de Melo, nº 3600
Bairro: Campo Grande'),
  (158, '09.360-9', 'Rio de Janeiro', 'RJ', 'Importação - Cartórios RJ Capital', 'SERVIÇO REGISTRAL 6º OFÍCIO DO REGISTRO DE DISTRIBUIÇÃO', 'DOMINGOS HENRIQUE LEAL BRAUNE', '(21)2262-9543', '2122629543', '6ord@6ord.com.br', 'Código da serventia: 09.360-9
Atribuições: Registro de Distribuição
Endereço: AV. ERASMO BRAGA 227
Bairro: CENTRO'),
  (159, '09.361-7', 'Rio de Janeiro', 'RJ', 'Importação - Cartórios RJ Capital', '6º REGISTRO DE IMOVEIS', 'HERMES VALVERDE DA CUNHA VASCONCELLOS FILHO', '(21)2223-0481', '2122230481', 'cartorio@6ri-rj.com.br', 'Código da serventia: 09.361-7
Atribuições: Registro de Imóveis
Endereço: AVENIDA RIO BRANCO Nº39/7ANDAR
Bairro: PRAÇA MAUÁ-CENTRO'),
  (160, '09.364-1', 'Rio de Janeiro', 'RJ', 'Importação - Cartórios RJ Capital', 'Tabelionato do 1º Ofício de Protesto de Títulos do Rio de Janeiro', 'LéO BARROS ALMADA', '(21)2531-1687', '2125311687', '1protestorj@gmail.com', 'Código da serventia: 09.364-1
Atribuições: Protesto de Títulos
Endereço: Av. Erasmo Braga, 227
Bairro: Centro'),
  (161, '09.365-8', 'Rio de Janeiro', 'RJ', 'Importação - Cartórios RJ Capital', 'TABELIONATO DO 2º OFICIO DE PROTESTO DE TÍTULOS DA CAPITAL-RJ', 'RONAN CARDOSO NAVES NETO', '(21)2038-1038', '2120381038', 'administrativo@2protestorj.com.br', 'Código da serventia: 09.365-8
Atribuições: Protesto de Títulos
Endereço: RUA DO CARMO nº 9, 3º e 4º ANDARES
Bairro: CENTRO'),
  (162, '09.366-6', 'Rio de Janeiro', 'RJ', 'Importação - Cartórios RJ Capital', 'TABELIONATO DO 3º OFICIO DE PROTESTO DE TITULOS', 'VALTER DA SLVA BEZZE', '(21)96583-8171', '21965838171', 'terceirodeprotesto@gmail.com', 'Código da serventia: 09.366-6
Atribuições: Protesto de Títulos
Endereço: RUA DA ASSEMBLEIA, Nº10 SALA 2104
Bairro: CENTRO'),
  (163, '09.367-4', 'Rio de Janeiro', 'RJ', 'Importação - Cartórios RJ Capital', 'TABELIONATO DO 4º OFICIO DE PROTESTO DE TITULOS', 'MONICA DANTAS FERREIRA', '(21)3553-1603', '2135531603', 'quatrodeprotesto@gmail.com', 'Código da serventia: 09.367-4
Atribuições: Protesto de Títulos
Endereço: RUA DA ASSEMBLEIA, 10 SALAS 2114 A 2122
Bairro: CENTRO'),
  (164, '09.368-2', 'Rio de Janeiro', 'RJ', 'Importação - Cartórios RJ Capital', '3º Registro Civil de Pessoas Naturais da Comarca da Capital - RJ', 'INGRID WALTER DE SOUSA', '(21)2215-5109', '2122155109', 'cartorio@cartoriocentro.com.br', 'Código da serventia: 09.368-2
Atribuições: Registro Civil das Pessoas Naturais e de Interdições e Tutelas
Endereço: Av. Graça Aranha, nº 416, Sala 601
Bairro: Centro'),
  (165, '15.774-3', 'Rio de Janeiro', 'RJ', 'Importação - Cartórios RJ Capital', '12º REGISTRO CIVIL DE PESSOAS NATURAIS DA COMARCA DA CAPITAL', 'BENJAMIN MEDEIROS DA SILVA', '(21)3576-1269', '2135761269', 'cartorio@12rc.com.br', 'Código da serventia: 15.774-3
Atribuições: Registro Civil das Pessoas Naturais e de Interdições e Tutelas
Endereço: AVENIDA DAS AMÉRICAS, 3939, BLOCO 1, LOJA T.
Bairro: BARRA DA TIJUCA'),
  (166, '15.775-0', 'Rio de Janeiro', 'RJ', 'Importação - Cartórios RJ Capital', '06º REGISTRO CIVIL DE PESSOAS NATURAIS DA COMARCA DA CAPITAL', 'FÁBIA SOUSA PRESSER', '(21)3392-1596', '2133921596', 'cartorio6rcpn@gmail.com', 'Código da serventia: 15.775-0
Atribuições: Registro Civil das Pessoas Naturais e de Interdições e Tutelas
Endereço: AV. GEREMÁRIO DANTAS, Nº 142
Bairro: TANQUE - JACAREPAGUÁ'),
  (167, '15.776-8', 'Rio de Janeiro', 'RJ', 'Importação - Cartórios RJ Capital', '02º REGISTRO CIVIL DE PESSOAS NATURAIS DA COMARCA DA CAPITAL', 'ALESSANDRA LAPOENTE DA SILVA', '(21)3563-2864', '2135632864', 'rcpnsantacruz@hotmail.com', 'Código da serventia: 15.776-8
Atribuições: Registro Civil das Pessoas Naturais e de Interdições e Tutelas
Endereço: RUA DO PRADO Nº41
Bairro: SANTA CRUZ'),
  (168, '15.777-6', 'Rio de Janeiro', 'RJ', 'Importação - Cartórios RJ Capital', '12º Registro de Imóveis do Rio de Janeiro', 'SERGIO ÁVILA DORIA MARTINS', '(21)3217-2030', '2132172030', 'contato@12registro.com.br', 'Código da serventia: 15.777-6
Atribuições: Registro de Imóveis
Endereço: Av. maria teresa 260 Loja F, Campo Grande
Bairro: Campo Grande'),
  (169, '15.783-4', 'Rio de Janeiro', 'RJ', 'Importação - Cartórios RJ Capital', '29º OFÍCIO DE NOTAS DA COMARCA DA CAPITAL', 'ADRIANO LORIERI RIBEIRO FURTADO', '(21)4040-1160', '2140401160', 'contato@cartorio29.com.br', 'Código da serventia: 15.783-4
Atribuições: Notas
Endereço: Estrada de Jacarepaguá, 6069, Loja SS-106/A
Bairro: Jacarepaguá'),
  (170, '15.785-9', 'Rio de Janeiro', 'RJ', 'Importação - Cartórios RJ Capital', '31º OFÍCIO DE NOTAS DA COMARCA DA CAPITAL', 'MARCOS AURELIO RIBEIRO RAMOS', '(21)3333-7926', '2133337926', '31oficiodenotas@gmail.com', 'Código da serventia: 15.785-9
Atribuições: Notas
Endereço: RUA FRANCISCO REAL, Nº. 1647
Bairro: BANGU'),
  (171, '15.786-7', 'Rio de Janeiro', 'RJ', 'Importação - Cartórios RJ Capital', '32º OFÍCIO DE NOTAS DA COMARCA DA CAPITAL', 'VÍRGINIA VIANA ARRAIS', '(21)97402-1202', '21974021202', 'administrativo@cartorio32rj.com.br', 'Código da serventia: 15.786-7
Atribuições: Notas
Endereço: Avenida Vicente de Carvalho, 909
Bairro: Vicente de Carvalho'),
  (172, '15.787-5', 'Rio de Janeiro', 'RJ', 'Importação - Cartórios RJ Capital', '33º OFÍCIO DE NOTAS DA COMARCA DA CAPITAL', 'ANA LÚCIA MARAGA WATZL', '(21)2018-1900', '2120181900', '33oficiodenotas@gmail.com', 'Código da serventia: 15.787-5
Atribuições: Notas
Endereço: Rua Viúva Dantas nº 100, Loja 232, Passeio Shopping
Bairro: Campo Grande'),
  (173, '15.788-3', 'Rio de Janeiro', 'RJ', 'Importação - Cartórios RJ Capital', '34º OFÍCIO DE NOTAS DA COMARCA DA CAPITAL', 'PAULO VITOR ORLANDI DE LIMA', '(21)3173-1334', '2131731334', '34notas@gmail.com', 'Código da serventia: 15.788-3
Atribuições: Notas
Endereço: Av. Dom Hélder Câmara 5474 - Norte Shopping - loja 1301
Bairro: Cachambi'),
  (174, '15.789-1', 'Rio de Janeiro', 'RJ', 'Importação - Cartórios RJ Capital', '35º OFÍCIO DE NOTAS DA COMARCA DA CAPITAL', 'JOSE RENATO VILARNOVO GARCIA', '(21)3353-6717', '2133536717', 'administracao@cartorio35rj.com.br', 'Código da serventia: 15.789-1
Atribuições: Notas
Endereço: Estrada do Galeão, nº 2315
Bairro: Ilha do Governador'),
  (175, '02.136-0', 'Vitória', 'ES', 'Importação - Cartórios Vitória ES', 'Cartório do 1º Ofício Tabelionato de Notas da Comarca de Vitória', 'ROSANA FERREIRA TREVIZAN', '(27)3029-2774', '2730292774', 'contato@1notasvitoria.com.br', 'Código da serventia: 02.136-0
Atribuições: Notas
Endereço: Rua Professor Almeida Cousin, nº 50
Bairro: Enseada do Suá
Data de envio informada no texto: 24/03/25'),
  (176, '02.173-3', 'Vitória', 'ES', 'Importação - Cartórios Vitória ES', 'CARTÓRIO DO REGISTRO CIVIL E TABELIONATO DE NOTAS DO DISTRITO DE GOIABEIRAS DO JUÍZO DE VITÓRIA COMARCA DA CAPITAL', 'PAULA CECíLIA DA LUZ RODRIGUES', '(27)3019-0049', '2730190049', 'atendimento@cartoriogoiabeiras.com.br', 'Código da serventia: 02.173-3
Atribuições: Notas -> Registro Civil das Pessoas Naturais e de Interdições e Tutelas -> Registro de Distribuição
Endereço: Av. Anísio Fernandes Coelho, 1850, Loja 08, 09 e 10
Bairro: Jardim da Penha'),
  (177, '02.274-9', 'Vitória', 'ES', 'Importação - Cartórios Vitória ES', 'CARTÓRIO DE REGISTRO DE TÍTULOS E DOCUMENTOS', 'MYRIAN CASTELLO MIGUEL', '(27)3223-0051', '2732230051', 'cartorio@vitoriartd.com.br', 'Código da serventia: 02.274-9
Atribuições: Registro de Títulos e Documentos e Civis das Pessoas Jurídicas
Endereço: PRAÇA GETÚLIO VARGAS, 35 - SALA 913
Bairro: CENTRO'),
  (178, '02.313-5', 'Vitória', 'ES', 'Importação - Cartórios Vitória ES', 'CARTORIO DO 2º OFICIO TABELIONATO DE NOTAS DO JUIZO DE VITORIA DA COMARCA DA CAPITAL', 'RODRIGO REIS CYRINO', '(27)3024-9600', '2730249600', 'tabeliao@2notasvitoria.com.br', 'Código da serventia: 02.313-5
Atribuições: Notas
Endereço: RUA FILOGÔNIO MOTA, Nº 137
Bairro: JARDIM CAMBURI'),
  (179, '02.321-8', 'Vitória', 'ES', 'Importação - Cartórios Vitória ES', 'CARTÓRIO CAPIXABA - CARTÓRIO DO 4º OFICIO DE NOTAS DE VITÓRIA', 'MARLA DAYANE SILVA CAMILO', '(27)3376-2108', '2733762108', 'marlacamilo@cartoriocapixaba.com.br', 'Código da serventia: 02.321-8
Atribuições: Notas
Endereço: Av. Dante Michelini, 293
Bairro: Jardim da Penha'),
  (180, '02.444-8', 'Vitória', 'ES', 'Importação - Cartórios Vitória ES', 'Registro Geral de Imóveis (2ª Zona de Vitória)', 'HELVéCIO DUIA CASTELLO', '(27)3022-8888', '2730228888', 'protocolo@cartoriocastello.com.br', 'Código da serventia: 02.444-8
Atribuições: Registro de Imóveis
Endereço: Avenida Nossa Senhora dos Navegantes, 955/1.401
Bairro: Enseada do Suá'),
  (181, '02.466-1', 'Vitória', 'ES', 'Importação - Cartórios Vitória ES', 'CARTÓRIO DO REGISTRO CIVIL DAS PESSOAS NATURAIS E PESSOAS JURÍDICAS E TABELIONATO DE NOTAS DA 1ª ZONA DO JUÍZO DE VITÓRIA DA COMARCA DA CAPITAL', 'RODRIGO SARLO ANTONIO', '(27)2124-9500', '2721249500', 'tabeliao@cartoriosarlo.com.br', 'Código da serventia: 02.466-1
Atribuições: Notas -> Registro Civil das Pessoas Naturais e de Interdições e Tutelas -> Registro de Títulos e Documentos e Civis das Pessoas Jurídicas
Endereço: Avenida Nossa Senhora da Penha, 555, Ed. Urbi Office
Bairro: Santa Lúcia');

-- Revisão das coincidências encontradas antes da inserção.
SELECT staged.source_code, staged.city, staged.name AS incoming_name,
  existing.id AS existing_id, existing.name AS existing_name,
  existing.email AS existing_email, existing.phone AS existing_phone
FROM tmp_crm_cartorios_capitais AS staged
JOIN sales_opportunities AS existing ON existing.companies_id = @crm_company_id
  AND (
    LOWER(TRIM(existing.email)) = staged.email
    OR REGEXP_REPLACE(COALESCE(existing.phone, ''), '[^0-9]', '') = staged.phone_digits
    OR REGEXP_REPLACE(COALESCE(existing.whatsapp, ''), '[^0-9]', '') = staged.phone_digits
    OR (UPPER(TRIM(existing.name)) = UPPER(staged.name)
        AND UPPER(TRIM(existing.city)) = UPPER(staged.city))
  )
ORDER BY staged.import_order, existing.id;

INSERT INTO sales_opportunities (
  companies_id, company_id, sales_stage_id, name, city, state,
  contact_name, phone, email, whatsapp, source, notes,
  next_contact_date, next_action, assigned_user_id, created_at, updated_at
)
SELECT
  @crm_company_id, NULL, @crm_stage_id, staged.name, staged.city, staged.state,
  staged.contact_name, staged.phone, staged.email, NULL, staged.source, staged.notes,
  DATE_ADD(
    @crm_start_date,
    INTERVAL (
      FLOOR((staged.import_order - 1) / 20) +
      2 * FLOOR((WEEKDAY(@crm_start_date) + FLOOR((staged.import_order - 1) / 20)) / 5)
    ) DAY
  ),
  CASE WHEN staged.state = 'SP'
    THEN 'Verificar envio anterior e realizar acompanhamento'
    ELSE 'Realizar primeiro contato'
  END,
  @crm_assigned_user_id, NOW(), NOW()
FROM tmp_crm_cartorios_capitais AS staged
WHERE @crm_stage_id IS NOT NULL AND @crm_assigned_user_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM sales_opportunities AS existing
    WHERE existing.companies_id = @crm_company_id
      AND (
        LOWER(TRIM(existing.email)) = staged.email
        OR REGEXP_REPLACE(COALESCE(existing.phone, ''), '[^0-9]', '') = staged.phone_digits
        OR REGEXP_REPLACE(COALESCE(existing.whatsapp, ''), '[^0-9]', '') = staged.phone_digits
        OR (UPPER(TRIM(existing.name)) = UPPER(staged.name)
            AND UPPER(TRIM(existing.city)) = UPPER(staged.city))
      )
  );

SET @crm_imported_rows := ROW_COUNT();
SET @crm_prepared_rows := (SELECT COUNT(*) FROM tmp_crm_cartorios_capitais);
SELECT @crm_prepared_rows AS prepared_rows,
  @crm_imported_rows AS imported_rows,
  @crm_prepared_rows - @crm_imported_rows
    AS ignored_as_duplicate_or_invalid_configuration;

COMMIT;
