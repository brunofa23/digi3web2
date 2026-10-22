-- Importação CRM: cartórios de Belo Horizonte (22 registros).
-- Banco de teste local: digi3Web | empresa 1 | responsável: admin.
-- Requer as migrations do CRM, inclusive 1786690000000_sales_opportunities_expand_name.ts.
-- Conferir o SELECT de duplicidades antes de executar o INSERT em outros ambientes.

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

DROP TEMPORARY TABLE IF EXISTS tmp_crm_cartorios_bh;
CREATE TEMPORARY TABLE tmp_crm_cartorios_bh (
  import_order INT UNSIGNED NOT NULL PRIMARY KEY,
  source_code VARCHAR(10) NOT NULL,
  name VARCHAR(255) NOT NULL,
  contact_name VARCHAR(120) NOT NULL,
  phone VARCHAR(30) NOT NULL,
  phone_digits VARCHAR(20) NOT NULL,
  email VARCHAR(255) NOT NULL,
  notes TEXT NOT NULL,
  INDEX tmp_crm_cartorios_bh_email_idx (email),
  INDEX tmp_crm_cartorios_bh_phone_idx (phone_digits)
);

INSERT INTO tmp_crm_cartorios_bh
  (import_order, source_code, name, contact_name, phone, phone_digits, email, notes)
VALUES
  (1, '03.184-9', 'CARTORIO REGISTRO CIVIL 3ºSUBDISTRITO DE BELO HORIZONTE', 'LUIZ CARLOS PINTO FONSECA', '(31)2535-3947', '3125353947', 'contato@registrocivil3bh.com.br', 'Código da serventia: 03.184-9
Atribuições: Registro Civil das Pessoas Naturais e de Interdições e Tutelas
Endereço: RUA SÃO PAULO, 1620
Bairro: LOURDES'),
  (2, '03.212-8', '1º OFICIO DE REGISTRO DE IMOVEIS DA COMARCA DE BELO HORIZONTE', 'FERNANDO PEREIRA DO NASCIMENTO', '(31)3207-6400', '3132076400', 'cartorio@1ribh.com.br', 'Código da serventia: 03.212-8
Atribuições: Registro de Imóveis
Endereço: RUA RIO DE JANEIRO, 1611
Bairro: LOURDES'),
  (3, '03.239-1', '1º TABELIONATO DE PROTESTO DE TITULOS DE BELO HORIZONTE', 'LUIZ MÁRCIO FERREIRA DE CARVALHO', '(31)3212-1455', '3132121455', 'contato@1protestobh.com.br', 'Código da serventia: 03.239-1
Atribuições: Protesto de Títulos
Endereço: RUA DA BAHIA, 478 LJ 5/10
Bairro: CENTRO'),
  (4, '03.243-3', '2 Ofício de Registro de Títulos e Documentos', 'GETULIO SERGIO DO AMARAL', '(31)3224-1788', '3132241788', '2rtdbh@rtdbh.com.br', 'Código da serventia: 03.243-3
Atribuições: Registro de Títulos e Documentos e Civis das Pessoas Jurídicas
Endereço: Rua Guajajaras
Bairro: Boa Viagem'),
  (5, '03.283-9', '2º TABELIONATO DE PROTESTO DE TÍTULOS DE BELO HORIZONTE', 'AURENICE DA MOTA TEIXEIRA', '(31)3234-6109', '3132346109', 'aurenice2bh@gmail.com', 'Código da serventia: 03.283-9
Atribuições: Protesto de Títulos
Endereço: Rua Pernambuco, 554 -10º andar
Bairro: Savassi'),
  (6, '03.289-6', '3º Tabelionato de Protesto de Títulos de Belo Horizonte', 'DOMINGO PIETRANGELO RITONDO', '(31)3274-2549', '3132742549', '3protestobh@3protestobh.com.br', 'Código da serventia: 03.289-6
Atribuições: Protesto de Títulos
Endereço: Rua dos Tupis, nº 457
Bairro: Centro'),
  (7, '03.291-2', '4º OFÍCIO DE NOTAS DE BELO HORIZONTE', 'DIRCEU PINTO DE OLIVEIRA', '(31)3226-2514', '3132262514', '4tabelionatobh@gmail.com', 'Código da serventia: 03.291-2
Atribuições: Notas
Endereço: RUA DA BAHIA 917
Bairro: CENTRO'),
  (8, '03.311-8', 'Belo Horizonte Cartorio de Paz e Registro Civil 1 Subd MG', 'JOSE AUGUSTO SILVEIRA', '(31)2531-8100', '3125318100', 'correspondencia@primeirobh.com.br', 'Código da serventia: 03.311-8
Atribuições: Registro Civil das Pessoas Naturais e de Interdições e Tutelas
Endereço: Rua Aquiles Lobo, 535 A e B
Bairro: Floresta'),
  (9, '03.312-6', 'Belo Horizonte Cartório do 3º Ofício de Notas', 'DARLENE SILVA TRIGINELLI', '(31)3273-5744', '3132735744', 'cartorio@cartoriotriginelli.com.br', 'Código da serventia: 03.312-6
Atribuições: Notas
Endereço: Av. Augusto de Lima, 385
Bairro: Centro'),
  (10, '03.313-4', '3º Ofício de Registro de Imóveis de Belo Horizonte', 'MATHEUS CAMPOLINA MOREIRA', '(31)3370-5550', '3133705550', 'atendimento@3ribh.com', 'Código da serventia: 03.313-4
Atribuições: Registro de Imóveis
Endereço: Rua dos Timbiras 2062
Bairro: Lourdes'),
  (11, '03.367-0', 'CARTÓRIO 2º OFICIO DE NOTAS DE BELO HORIZONTE', 'JOãO CARLOS NUNES JúNIOR', '(31)3014-4600', '3130144600', 'cartorio@cartoriojaguarao.com.br', 'Código da serventia: 03.367-0
Atribuições: Notas
Endereço: RUA DA BAHIA, 1.000
Bairro: CENTRO'),
  (12, '03.373-8', 'Cartório 9º Oficio de Notas de Belo Horizonte', 'WALQUíRIA MARA GRACIANO MACHADO RABELO', '(31)3247-3535', '3132473535', 'walquiria@cartorionotas.com.br', 'Código da serventia: 03.373-8
Atribuições: Notas
Endereço: Rua São Paulo nº 1.115 -sobreloja
Bairro: Centro'),
  (13, '04.038-6', 'CARTORIO DO 10º OFICIO DE NOTAS DE BELO HORIZONTE', 'ANTONIO DANIEL DE OLIVEIRA', '(31)3222-8500', '3132228500', 'cartorio@oliveira.not.br', 'Código da serventia: 04.038-6
Atribuições: Notas
Endereço: RUA GUAJAJARAS 602
Bairro: CENTRO'),
  (14, '04.170-7', 'Cartório do 4º Ofício de Registro de Imóveis de Belo Horizonte', 'FRANCISCO JOSé REZENDE DOS SANTOS', '(31)3291-5958', '3132915958', 'cartorio@4ribh.com.br', 'Código da serventia: 04.170-7
Atribuições: Registro de Imóveis
Endereço: Rua Gonçalves Dias, 2.122
Bairro: Lourdes'),
  (15, '04.195-4', 'CARTORIO DO QUINTO OFICIO DE NOTAS', 'CARLOS ALBERTO FAGUNDES AMARAL', '(31)3224-2303', '3132242303', 'contato@cartorioamaral.com', 'Código da serventia: 04.195-4
Atribuições: Notas
Endereço: AVENIDA JOÃO PINHEIRO, 152
Bairro: CENTRO'),
  (16, '04.255-6', 'Tabelionato de Notas e Registro Civil das Pessoas Naturais de Barreiro', 'LETICIA FRANCO MACULAN ASSUMPÇÃO', '(31)3500-8800', '3135008800', 'cartoriodobarreiro@cartoriodobarreiro.com.br', 'Código da serventia: 04.255-6
Atribuições: Notas -> Registro Civil das Pessoas Naturais e de Interdições e Tutelas
Endereço: Av. Afonso Vaz de Melo, 465
Bairro: BARREIRO'),
  (17, '05.002-1', 'OFICIO DO 4º TABELIONATO DE PROTESTOS DE BELO HORIZONTE/MG', 'ELZA TEREZINHA FREIRE', '(31)3275-1315', '3132751315', 'elzatfreire@4protestobh.com', 'Código da serventia: 05.002-1
Atribuições: Protesto de Títulos
Endereço: AV. ALVARES CABRAL, 970
Bairro: LOURDES'),
  (18, '05.003-9', 'Ofício do 6º Tabelionato de Notas', 'JOãO TEODORO DA SILVA', '(31)3224-2966', '3132242966', 'cartorio@6oficiobh.com.br', 'Código da serventia: 05.003-9
Atribuições: Notas
Endereço: Praça Milton Campos, 217
Bairro: Serra'),
  (19, '05.384-3', 'OFICIO DO REGISTRO DE DISTRIBUIÇÃO DE PROTESTO DE TÍTULOS', 'FREDERICO DE ARAUJO MILTON', '(31)3274-3400', '3132743400', 'oficiodistribuidorbh@oficiodistribuidorbh.com.br', 'Código da serventia: 05.384-3
Atribuições: Registro de Distribuição
Endereço: RUA GUAJAJARAS, 329
Bairro: CENTRO'),
  (20, '05.529-3', 'PRIMEIRO OFÍCIO DE REGISTRO DE TITULOS E DOCUMENTOS DE BELO HORIZONTE', 'EMILIO CARNEIRO DE MENEZES GUERRA', '(31)3224-6630', '3132246630', '1rtdbh@1rtdbh.com.br', 'Código da serventia: 05.529-3
Atribuições: Registro de Títulos e Documentos e Civis das Pessoas Jurídicas
Endereço: RUA GUAJAJARAS, 329 -
Bairro: CENTRO'),
  (21, '05.667-1', 'Registro Civil do Quarto Subdistrito', 'ALEXANDRINA DE ALBUQUERQUE REZENDE', '(31)3332-6847', '3133326847', 'cart4bh@uol.com.br', 'Código da serventia: 05.667-1
Atribuições: Registro Civil das Pessoas Naturais e de Interdições e Tutelas
Endereço: Avenida Amazonas, 3262
Bairro: Prado'),
  (22, '05.869-3', 'Cartório do 5º Ofício de Registro de Imóveis de Belo Horizonte', 'SEBASTIãO DE BARROS QUINTãO', '(31)2511-9091', '3125119091', '5oficio.atendimento.pandemia@gmail.com', 'Código da serventia: 05.869-3
Atribuições: Registro de Imóveis
Endereço: Alvarenga Peixoto
Bairro: Lourdes');

-- Contatos já existentes na empresa; devem ser ignorados na inserção.
SELECT staged.source_code, staged.name AS incoming_name, existing.id AS existing_id,
  existing.name AS existing_name, existing.email AS existing_email, existing.phone AS existing_phone
FROM tmp_crm_cartorios_bh AS staged
JOIN sales_opportunities AS existing ON existing.companies_id = @crm_company_id
  AND (
    LOWER(TRIM(existing.email)) = staged.email
    OR REGEXP_REPLACE(COALESCE(existing.phone, ''), '[^0-9]', '') = staged.phone_digits
    OR REGEXP_REPLACE(COALESCE(existing.whatsapp, ''), '[^0-9]', '') = staged.phone_digits
    OR (UPPER(TRIM(existing.name)) = UPPER(staged.name)
        AND UPPER(TRIM(existing.city)) = 'BELO HORIZONTE')
  )
ORDER BY staged.import_order, existing.id;

INSERT INTO sales_opportunities (
  companies_id, company_id, sales_stage_id, name, city, state,
  contact_name, phone, email, whatsapp, source, notes,
  next_contact_date, next_action, assigned_user_id, created_at, updated_at
)
SELECT
  @crm_company_id, NULL, @crm_stage_id, staged.name, 'Belo Horizonte', 'MG',
  staged.contact_name, staged.phone, staged.email, NULL,
  'Importação - Cartórios BH', staged.notes,
  DATE_ADD(
    @crm_start_date,
    INTERVAL (
      FLOOR((staged.import_order - 1) / 20) +
      2 * FLOOR((WEEKDAY(@crm_start_date) + FLOOR((staged.import_order - 1) / 20)) / 5)
    ) DAY
  ),
  'Realizar primeiro contato', @crm_assigned_user_id, NOW(), NOW()
FROM tmp_crm_cartorios_bh AS staged
WHERE @crm_stage_id IS NOT NULL AND @crm_assigned_user_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM sales_opportunities AS existing
    WHERE existing.companies_id = @crm_company_id
      AND (
        LOWER(TRIM(existing.email)) = staged.email
        OR REGEXP_REPLACE(COALESCE(existing.phone, ''), '[^0-9]', '') = staged.phone_digits
        OR REGEXP_REPLACE(COALESCE(existing.whatsapp, ''), '[^0-9]', '') = staged.phone_digits
        OR (UPPER(TRIM(existing.name)) = UPPER(staged.name)
            AND UPPER(TRIM(existing.city)) = 'BELO HORIZONTE')
      )
  );

SET @crm_imported_rows := ROW_COUNT();
SET @crm_prepared_rows := (SELECT COUNT(*) FROM tmp_crm_cartorios_bh);
SELECT @crm_prepared_rows AS prepared_rows,
  @crm_imported_rows AS imported_rows,
  @crm_prepared_rows - @crm_imported_rows
    AS ignored_as_duplicate_or_invalid_configuration;

COMMIT;
