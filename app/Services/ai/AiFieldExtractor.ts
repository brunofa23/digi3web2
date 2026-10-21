import Database from '@ioc:Adonis/Lucid/Database'

export type ExtractedField = { field: string; value: string; evidence: string }
type ExtractionInput = {
  text: string
  documentType: string
  context: string
  fields: string[]
  companiesId: number
  userId: number | null
  useCase: string
}

interface AiProvider {
  name: string
  model: string
  extract(text: string, context: string, fields: string[]): Promise<{
    fields: ExtractedField[]
    inputTokens: number
    outputTokens: number
  }>
}

class OpenAiProvider implements AiProvider {
  public name = 'openai'
  public model = 'gpt-6-luna'

  public async extract(text: string, context: string, fields: string[]) {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) throw new Error('AI_NOT_CONFIGURED')

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 30000)
    try {
      const result = await (globalThis as any).fetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          store: false,
          reasoning: { effort: 'none' },
          max_output_tokens: 1200,
          input: [
            { role: 'system', content: 'Extraia somente informações explícitas do texto OCR de um documento brasileiro. Responda em português. Não invente, deduza nem corrija valores ilegíveis. Para cada valor informe um trecho literal do texto OCR que o comprove. Se não houver evidência, omita o campo. Campos permitidos: ' + fields.join(', ') + '. Datas no formato AAAA-MM-DD quando legíveis. CPF e CEP somente dígitos. Tipo de documento somente RG, CPF, CNH ou Passaporte.' },
            { role: 'user', content: `Contexto: ${context}\nTexto OCR:\n${text}` },
          ],
          text: {
            format: {
              type: 'json_schema',
              name: 'document_fields',
              strict: true,
              schema: {
                type: 'object',
                properties: {
                  fields: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        field: { type: 'string', enum: fields },
                        value: { type: 'string' },
                        evidence: { type: 'string' },
                      },
                      required: ['field', 'value', 'evidence'],
                      additionalProperties: false,
                    },
                  },
                },
                required: ['fields'],
                additionalProperties: false,
              },
            },
          },
        }),
      })
      if (!result.ok) throw new Error('AI_PROVIDER_ERROR')
      const data: any = await result.json()
      if (data.status !== 'completed') throw new Error('AI_PROVIDER_ERROR')
      const outputText = data.output?.flatMap((item: any) => item.content || [])
        .find((item: any) => item.type === 'output_text')?.text
      if (!outputText) throw new Error('AI_PROVIDER_ERROR')
      const parsed = JSON.parse(outputText)
      return {
        fields: Array.isArray(parsed.fields) ? parsed.fields : [],
        inputTokens: Number(data.usage?.input_tokens || 0),
        outputTokens: Number(data.usage?.output_tokens || 0),
      }
    } finally {
      clearTimeout(timeout)
    }
  }
}

export async function extractAiFields(input: ExtractionInput) {
  const provider: AiProvider = new OpenAiProvider()
  const startedAt = Date.now()
  let status = 'success'
  let inputTokens = 0
  let outputTokens = 0

  try {
    const result = await provider.extract(input.text, input.context, input.fields)
    inputTokens = result.inputTokens
    outputTokens = result.outputTokens
    return result.fields
  } catch (error) {
    status = error instanceof Error && error.message === 'AI_NOT_CONFIGURED' ? 'not_configured' : 'provider_error'
    throw error
  } finally {
    await Database.table('ai_usage_events').insert({
      companies_id: input.companiesId,
      user_id: input.userId,
      use_case: input.useCase,
      provider: provider.name,
      model: provider.model,
      document_type: input.documentType,
      status,
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      estimated_cost_usd: (inputTokens * 0.1 + outputTokens * 0.5) / 1000000,
      duration_ms: Date.now() - startedAt,
    })
  }
}
