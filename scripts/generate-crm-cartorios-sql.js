const fs = require('fs')
const path = require('path')

const [, , inputPath, outputPath] = process.argv

if (!inputPath || !outputPath) {
  throw new Error('Uso: node scripts/generate-crm-cartorios-sql.js <entrada.tsv> <saida.sql>')
}

const clean = (value = '') => value.replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim()
const quote = (value) => `'${String(value).replace(/'/g, "''")}'`

const lines = fs.readFileSync(inputPath, 'utf8').replace(/^\uFEFF/, '').split(/\r?\n/).filter(line => line.trim())
const header = lines.shift().split('\t').map(clean)
const expectedHeader = ['CIDADE', 'CARTORIO', 'RESPONSÁVEL', 'TELEFONE', 'EMAIL']

if (expectedHeader.some((column, index) => header[index] !== column)) {
  throw new Error(`Cabeçalho inesperado: ${header.join(' | ')}`)
}

let currentCity = ''
const rows = lines.map((line, index) => {
  const columns = line.split('\t')
  if (columns.length < 5) throw new Error(`Linha ${index + 2} possui menos de 5 colunas`)

  const city = clean(columns[0])
  if (city) currentCity = city

  const row = {
    rowNumber: index + 1,
    city: currentCity,
    name: clean(columns[1]),
    contactName: clean(columns[2]),
    phone: clean(columns[3]),
    email: clean(columns[4]).toLowerCase(),
  }

  if (!row.city || !row.name || !row.phone || !row.email) {
    throw new Error(`Linha ${index + 2} possui campo obrigatório vazio`)
  }
  if (row.name.length > 255) throw new Error(`Linha ${index + 2}: nome excede 255 caracteres`)
  if (row.contactName.length > 120) throw new Error(`Linha ${index + 2}: responsável excede 120 caracteres`)
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) throw new Error(`Linha ${index + 2}: e-mail inválido`)

  row.phoneDigits = row.phone.replace(/\D/g, '')
  if (![10, 11].includes(row.phoneDigits.length)) throw new Error(`Linha ${index + 2}: telefone inválido`)
  return row
})

const values = rows.map(row => `  (${row.rowNumber}, ${quote(row.city)}, ${quote(row.name)}, ${quote(row.contactName)}, ${quote(row.phone)}, ${quote(row.phoneDigits)}, ${quote(row.email)})`).join(',\n')

const sql = `-- Importação CRM: Cartórios de São Paulo
-- Registros preparados: ${rows.length}
-- Empresa: 1 | Responsável CRM: username admin | Lote diário: 20
-- Requer a migration 1786690000000_sales_opportunities_expand_name.ts.

START TRANSACTION;

SET @crm_company_id := 1;
SET @crm_stage_id := (SELECT id FROM sales_stages WHERE name = 'Novo contato' AND active = 1 LIMIT 1);
SET @crm_assigned_user_id := (
  SELECT id
  FROM users
  WHERE companies_id = @crm_company_id AND LOWER(username) = 'admin'
  LIMIT 1
);
SET @crm_start_date := CASE
  WHEN WEEKDAY(CURDATE()) = 5 THEN DATE_ADD(CURDATE(), INTERVAL 2 DAY)
  WHEN WEEKDAY(CURDATE()) = 6 THEN DATE_ADD(CURDATE(), INTERVAL 1 DAY)
  ELSE CURDATE()
END;

SELECT
  @crm_company_id AS companies_id,
  @crm_stage_id AS sales_stage_id,
  @crm_assigned_user_id AS assigned_user_id,
  @crm_start_date AS first_contact_date;

DROP TEMPORARY TABLE IF EXISTS tmp_crm_cartorios_sp;
CREATE TEMPORARY TABLE tmp_crm_cartorios_sp (
  import_order INT UNSIGNED NOT NULL,
  city VARCHAR(100) NOT NULL,
  name VARCHAR(255) NOT NULL,
  contact_name VARCHAR(120) NOT NULL,
  phone VARCHAR(30) NOT NULL,
  phone_digits VARCHAR(20) NOT NULL,
  email VARCHAR(255) NOT NULL,
  PRIMARY KEY (import_order),
  INDEX tmp_crm_cartorios_email_idx (email),
  INDEX tmp_crm_cartorios_phone_idx (phone_digits)
);

INSERT INTO tmp_crm_cartorios_sp
  (import_order, city, name, contact_name, phone, phone_digits, email)
VALUES
${values};

INSERT INTO sales_opportunities (
  companies_id,
  company_id,
  sales_stage_id,
  name,
  city,
  state,
  contact_name,
  phone,
  email,
  whatsapp,
  source,
  next_contact_date,
  next_action,
  assigned_user_id,
  created_at,
  updated_at
)
SELECT
  @crm_company_id,
  NULL,
  @crm_stage_id,
  staged.name,
  staged.city,
  'SP',
  staged.contact_name,
  staged.phone,
  staged.email,
  NULL,
  'Importação - Cartórios SP',
  DATE_ADD(
    @crm_start_date,
    INTERVAL (
      FLOOR((staged.import_order - 1) / 20) +
      2 * FLOOR((WEEKDAY(@crm_start_date) + FLOOR((staged.import_order - 1) / 20)) / 5)
    ) DAY
  ),
  'Realizar primeiro contato',
  @crm_assigned_user_id,
  NOW(),
  NOW()
FROM tmp_crm_cartorios_sp AS staged
WHERE @crm_stage_id IS NOT NULL
  AND @crm_assigned_user_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM sales_opportunities AS existing
    WHERE existing.companies_id = @crm_company_id
      AND (
        LOWER(TRIM(existing.email)) = staged.email
        OR REGEXP_REPLACE(COALESCE(existing.phone, ''), '[^0-9]', '') = staged.phone_digits
        OR REGEXP_REPLACE(COALESCE(existing.whatsapp, ''), '[^0-9]', '') = staged.phone_digits
        OR (
          UPPER(TRIM(existing.name)) = UPPER(staged.name)
          AND UPPER(TRIM(existing.city)) = UPPER(staged.city)
        )
      )
  );

SET @crm_imported_rows := ROW_COUNT();
SET @crm_prepared_rows := (SELECT COUNT(*) FROM tmp_crm_cartorios_sp);

SELECT
  @crm_prepared_rows AS prepared_rows,
  @crm_imported_rows AS imported_rows,
  @crm_prepared_rows - @crm_imported_rows AS ignored_as_duplicate_or_invalid_configuration;

COMMIT;
`

fs.mkdirSync(path.dirname(outputPath), { recursive: true })
fs.writeFileSync(outputPath, sql, 'utf8')
console.log(`SQL gerado: ${outputPath} (${rows.length} registros)`)
