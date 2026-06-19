# MCP MySQL somente leitura

Este MCP expoe o banco MySQL do backend para consultas de leitura via stdio, sem alterar endpoints, models ou migrations do AdonisJS.

## Como iniciar

```bash
npm run mcp:mysql-readonly
```

Por padrao ele carrega as mesmas variaveis usadas pelo backend:

- `MYSQL_HOST`
- `MYSQL_PORT`
- `MYSQL_USER`
- `MYSQL_PASSWORD`
- `MYSQL_DB_NAME`

Tambem e possivel sobrescrever somente para o MCP usando variaveis com prefixo `MCP_`, por exemplo:

- `MCP_MYSQL_HOST`
- `MCP_MYSQL_PORT`
- `MCP_MYSQL_USER`
- `MCP_MYSQL_PASSWORD`
- `MCP_MYSQL_DB_NAME`

## Configuracao no cliente MCP

Exemplo de configuracao:

```json
{
  "mcpServers": {
    "digi3-mysql-readonly": {
      "command": "npm",
      "args": ["run", "mcp:mysql-readonly"],
      "cwd": "/home/bruno/projetos/digi3/digi3web2"
    }
  }
}
```

## Ferramentas disponiveis

- `mysql_query`: executa SQL de leitura.
- `mysql_tables`: lista tabelas e views do banco configurado.
- `mysql_describe_table`: lista colunas de uma tabela ou view.

## Regras de seguranca

O MCP bloqueia:

- comandos fora de `SELECT`, `WITH`, `SHOW`, `DESCRIBE`, `DESC` e `EXPLAIN`;
- multiplas statements;
- comentarios SQL;
- comandos de escrita ou administracao como `INSERT`, `UPDATE`, `DELETE`, `DROP`, `ALTER`, `CREATE`, `GRANT`, `CALL`, `SET`, `USE`, `LOCK`, `COMMIT` e similares;
- `SELECT INTO OUTFILE`, `SELECT INTO DUMPFILE`, `LOAD_FILE`, `FOR UPDATE` e `LOCK IN SHARE MODE`;
- retorno de `SELECT/WITH` acima de 1000 linhas.

A camada mais importante de seguranca deve estar no MySQL. Crie um usuario exclusivo para o MCP com permissao somente de leitura:

```sql
CREATE USER 'mcp_readonly'@'localhost' IDENTIFIED BY 'senha-forte-aqui';
GRANT SELECT, SHOW VIEW ON nome_do_banco.* TO 'mcp_readonly'@'localhost';
FLUSH PRIVILEGES;
```

Depois configure `MCP_MYSQL_USER` e `MCP_MYSQL_PASSWORD` para esse usuario no ambiente do processo MCP.
