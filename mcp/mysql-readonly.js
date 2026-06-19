#!/usr/bin/env node

'use strict'

const fs = require('fs')
const path = require('path')
const mysql = require('mysql2/promise')

const SERVER_NAME = 'digi3-mysql-readonly'
const SERVER_VERSION = '1.0.0'
const DEFAULT_LIMIT = 100
const MAX_LIMIT = 1000

loadDotEnv(path.resolve(process.cwd(), '.env'))

let pool

const tools = [
  {
    name: 'mysql_query',
    description: 'Executa uma consulta MySQL somente leitura. Aceita SELECT, WITH, SHOW, DESCRIBE, DESC e EXPLAIN.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'SQL somente leitura. Mutacoes, multiplas statements, comentarios e SELECT INTO OUTFILE sao bloqueados.',
        },
        limit: {
          type: 'number',
          description: `Limite maximo de linhas para SELECT/WITH. Valor padrao: ${DEFAULT_LIMIT}. Maximo: ${MAX_LIMIT}.`,
          minimum: 1,
          maximum: MAX_LIMIT,
        },
      },
      required: ['query'],
      additionalProperties: false,
    },
  },
  {
    name: 'mysql_tables',
    description: 'Lista tabelas e views do banco configurado.',
    inputSchema: {
      type: 'object',
      properties: {
        pattern: {
          type: 'string',
          description: 'Filtro opcional por nome, usando LIKE. Exemplo: clientes%',
        },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'mysql_describe_table',
    description: 'Lista colunas de uma tabela ou view usando information_schema.',
    inputSchema: {
      type: 'object',
      properties: {
        table: {
          type: 'string',
          description: 'Nome exato da tabela ou view.',
        },
      },
      required: ['table'],
      additionalProperties: false,
    },
  },
]

function loadDotEnv(filePath) {
  if (!fs.existsSync(filePath)) return

  const content = fs.readFileSync(filePath, 'utf8')

  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue

    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/)
    if (!match) continue

    const key = match[1]
    if (Object.prototype.hasOwnProperty.call(process.env, key)) continue

    process.env[key] = parseEnvValue(match[2])
  }
}

function parseEnvValue(value) {
  const trimmed = value.trim()
  const quote = trimmed[0]

  if ((quote === '"' || quote === "'") && trimmed[trimmed.length - 1] === quote) {
    return trimmed.slice(1, -1)
  }

  const commentIndex = trimmed.search(/\s+#/)
  return commentIndex >= 0 ? trimmed.slice(0, commentIndex).trim() : trimmed
}

function getEnv(name, fallbackName) {
  return process.env[`MCP_${name}`] || process.env[name] || (fallbackName ? process.env[fallbackName] : undefined)
}

function getRequiredEnv(name, fallbackName) {
  const value = getEnv(name, fallbackName)
  if (!value) {
    throw new Error(`Variavel de ambiente ausente: MCP_${name} ou ${name}`)
  }
  return value
}

function getConnectionPool() {
  if (pool) return pool

  pool = mysql.createPool({
    host: getRequiredEnv('MYSQL_HOST', 'MYSQL_HOST'),
    port: Number(getEnv('MYSQL_PORT', 'MYSQL_PORT') || 3306),
    user: getRequiredEnv('MYSQL_USER', 'MYSQL_USER'),
    password: getEnv('MYSQL_PASSWORD', 'MYSQL_PASSWORD') || '',
    database: getRequiredEnv('MYSQL_DB_NAME', 'MYSQL_DB_NAME'),
    waitForConnections: true,
    connectionLimit: Number(process.env.MCP_MYSQL_CONNECTION_LIMIT || 3),
    queueLimit: 0,
    multipleStatements: false,
    timezone: 'Z',
  })

  return pool
}

function normalizeLimit(value) {
  const parsed = Number(value || DEFAULT_LIMIT)

  if (!Number.isFinite(parsed) || parsed < 1) return DEFAULT_LIMIT
  return Math.min(Math.floor(parsed), MAX_LIMIT)
}

function normalizeSql(query) {
  if (typeof query !== 'string' || !query.trim()) {
    throw new Error('A consulta SQL e obrigatoria.')
  }

  const sql = query.trim()

  if (sql.includes('\0')) {
    throw new Error('Consulta invalida.')
  }

  if (/--|#|\/\*/.test(sql)) {
    throw new Error('Comentarios SQL nao sao permitidos neste MCP.')
  }

  const semicolonMatches = sql.match(/;/g) || []
  if (semicolonMatches.length > 1 || (semicolonMatches.length === 1 && !sql.endsWith(';'))) {
    throw new Error('Multiplas statements nao sao permitidas.')
  }

  return sql.endsWith(';') ? sql.slice(0, -1).trim() : sql
}

function assertReadOnlySql(query) {
  const sql = normalizeSql(query)
  const firstKeyword = sql.match(/^[\s(]*([A-Za-z]+)/)
  const allowedFirstKeywords = ['select', 'with', 'show', 'describe', 'desc', 'explain']

  if (!firstKeyword || !allowedFirstKeywords.includes(firstKeyword[1].toLowerCase())) {
    throw new Error('Apenas comandos de leitura sao permitidos.')
  }

  const blockedPatterns = [
    /\b(insert|update|delete|replace|drop|alter|create|truncate|rename|grant|revoke)\b/i,
    /\b(call|do|set|use|handler|lock|unlock|flush|kill|reset|start|commit|rollback|savepoint)\b/i,
    /\b(analyze|optimize|repair|checksum)\s+table\b/i,
    /\binto\s+(outfile|dumpfile)\b/i,
    /\bfor\s+update\b/i,
    /\block\s+in\s+share\s+mode\b/i,
    /\bload_file\s*\(/i,
  ]

  for (const pattern of blockedPatterns) {
    if (pattern.test(sql)) {
      throw new Error('Consulta bloqueada por regra de seguranca somente leitura.')
    }
  }

  return sql
}

function isSelectLike(sql) {
  return /^(select|with)\b/i.test(sql)
}

async function executeReadOnlyQuery(args) {
  const sql = assertReadOnlySql(args.query)
  const limit = normalizeLimit(args.limit)
  const connection = getConnectionPool()

  if (isSelectLike(sql)) {
    const [rows, fields] = await connection.query(`SELECT * FROM (${sql}) AS mcp_readonly_result LIMIT ?`, [limit])

    return {
      rowCount: rows.length,
      limit,
      columns: fields.map((field) => field.name),
      rows,
    }
  }

  const [rows, fields] = await connection.query(sql)

  return {
    rowCount: Array.isArray(rows) ? rows.length : 0,
    columns: Array.isArray(fields) ? fields.map((field) => field.name) : [],
    rows,
  }
}

async function listTables(args) {
  const database = getRequiredEnv('MYSQL_DB_NAME', 'MYSQL_DB_NAME')
  const params = [database]
  let patternSql = ''

  if (args.pattern) {
    patternSql = 'AND TABLE_NAME LIKE ?'
    params.push(args.pattern)
  }

  const [rows] = await getConnectionPool().query(
    `SELECT TABLE_NAME AS tableName,
            TABLE_TYPE AS tableType,
            TABLE_ROWS AS estimatedRows
       FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = ?
        ${patternSql}
      ORDER BY TABLE_NAME
      LIMIT 500`,
    params
  )

  return rows
}

async function describeTable(args) {
  if (!args.table || typeof args.table !== 'string') {
    throw new Error('Informe o nome da tabela.')
  }

  const [rows] = await getConnectionPool().query(
    `SELECT COLUMN_NAME AS columnName,
            COLUMN_TYPE AS columnType,
            IS_NULLABLE AS isNullable,
            COLUMN_KEY AS columnKey,
            COLUMN_DEFAULT AS columnDefault,
            EXTRA AS extra
       FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = ?
        AND TABLE_NAME = ?
      ORDER BY ORDINAL_POSITION`,
    [getRequiredEnv('MYSQL_DB_NAME', 'MYSQL_DB_NAME'), args.table]
  )

  return rows
}

async function callTool(name, args = {}) {
  if (name === 'mysql_query') return executeReadOnlyQuery(args)
  if (name === 'mysql_tables') return listTables(args)
  if (name === 'mysql_describe_table') return describeTable(args)

  throw new Error(`Ferramenta desconhecida: ${name}`)
}

function send(message) {
  process.stdout.write(`${JSON.stringify(message)}\n`)
}

function resultResponse(id, result) {
  send({ jsonrpc: '2.0', id, result })
}

function errorResponse(id, error) {
  send({
    jsonrpc: '2.0',
    id,
    error: {
      code: -32000,
      message: error.message || 'Erro interno no MCP.',
    },
  })
}

async function handleMessage(message) {
  if (!message || message.jsonrpc !== '2.0') return
  if (message.method && message.method.startsWith('notifications/')) return

  try {
    if (message.method === 'initialize') {
      resultResponse(message.id, {
        protocolVersion: message.params && message.params.protocolVersion ? message.params.protocolVersion : '2024-11-05',
        capabilities: {
          tools: {},
        },
        serverInfo: {
          name: SERVER_NAME,
          version: SERVER_VERSION,
        },
      })
      return
    }

    if (message.method === 'ping') {
      resultResponse(message.id, {})
      return
    }

    if (message.method === 'tools/list') {
      resultResponse(message.id, { tools })
      return
    }

    if (message.method === 'tools/call') {
      const toolResult = await callTool(message.params.name, message.params.arguments || {})
      resultResponse(message.id, {
        content: [
          {
            type: 'text',
            text: JSON.stringify(toolResult, null, 2),
          },
        ],
      })
      return
    }

    send({
      jsonrpc: '2.0',
      id: message.id,
      error: {
        code: -32601,
        message: `Metodo nao suportado: ${message.method}`,
      },
    })
  } catch (error) {
    errorResponse(message.id, error)
  }
}

let buffer = ''

process.stdin.setEncoding('utf8')
process.stdin.on('data', (chunk) => {
  buffer += chunk

  const lines = buffer.split(/\r?\n/)
  buffer = lines.pop() || ''

  for (const line of lines) {
    if (!line.trim()) continue

    try {
      handleMessage(JSON.parse(line)).catch((error) => errorResponse(null, error))
    } catch (error) {
      errorResponse(null, error)
    }
  }
})

process.on('SIGINT', closePoolAndExit)
process.on('SIGTERM', closePoolAndExit)

async function closePoolAndExit() {
  if (pool) await pool.end()
  process.exit(0)
}
