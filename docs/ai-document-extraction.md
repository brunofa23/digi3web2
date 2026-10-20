# Pré-leitura de anexos do Nascimento

O endpoint autenticado `POST /order-certificates/birth/document-extract` recebe `multipart/form-data` com `file` e `documentType`. Ele devolve sugestões `{ field, value, evidence }` sem criar pedido ou salvar o arquivo. A tela só aplica cada sugestão após uma ação do usuário.

O serviço `app/Services/ai/AiFieldExtractor.ts` define o contrato do provedor. Hoje ele chama `gpt-6-luna` pela Responses API com `store: false`; outro provedor pode implementar o mesmo contrato sem mudar o formulário. A chave `OPENAI_API_KEY` deve ser fornecida pelo ambiente de execução. Não coloque a chave no frontend nem no repositório.

O serviço `BirthDocumentExtraction.ts` define os campos permitidos por anexo, usa o OCR existente e valida evidências e formatos antes de devolver sugestões. A DNV só admite `dnvNumber`. Um comprovante informa `holderName` apenas para conferência; esse nome não é aplicado a uma pessoa automaticamente.

No documento da filiação 1, os pais do titular podem ser sugeridos como avô e avó da filiação 1. O município de nascimento do titular é sugerido para o campo de naturalidade correspondente no formulário. Esses dados dependem de identificação explícita no OCR e continuam sujeitos à conferência do usuário.

A migration `1792195200000_ai_usage_events.ts` cria `ai_usage_events`. Cada chamada ao provedor registra empresa, usuário, caso de uso (`birth_certificate_attachment`), tipo de anexo, provedor, modelo, estado, tokens, tempo e custo estimado. Nenhum texto OCR ou dado pessoal é guardado nessa tabela. O custo usa os preços públicos de US$ 0,10 por milhão de tokens de entrada e US$ 0,50 por milhão de saída; é uma estimativa, não a fatura. O OCR do Vision não está incluído nessa estimativa.

Antes de habilitar a pré-leitura em um ambiente, execute as migrations e configure a chave no serviço backend. Sem chave, a rota responde 503 e o preenchimento manual continua disponível. Para conferir consumo por uso, agregue `ai_usage_events` por `companies_id`, `use_case`, `provider` e período.

```sql
SELECT companies_id, use_case, provider, model, status,
       COUNT(*) AS calls, SUM(input_tokens) AS input_tokens,
       SUM(output_tokens) AS output_tokens,
       SUM(estimated_cost_usd) AS estimated_cost_usd
FROM ai_usage_events
WHERE created_at >= '2026-10-01' AND created_at < '2026-11-01'
GROUP BY companies_id, use_case, provider, model, status;
```
