import OpenAI from 'openai'
import type { ResponseCreateParamsNonStreaming } from 'openai/resources/responses/responses'

export type ProtocolCheckStatus = 'ok' | 'warning'

export type ProtocolCheckIssueType =
  | 'contradiction'
  | 'possible_default_value'
  | 'context_gap'
  | 'incomplete_protocol'

export type ProtocolCheckIssueSeverity = 'low' | 'medium' | 'high'

export interface ProtocolCheckIssue {
  type: ProtocolCheckIssueType
  severity: ProtocolCheckIssueSeverity
  confidence: number
  message: string
  evidence: string[]
  check: string
}

export interface ProtocolCheckResult {
  status: ProtocolCheckStatus
  issues: ProtocolCheckIssue[]
}

const PROTOCOL_CHECK_PROMPT_ID = 'pmpt_6a86a59a9adc8195b2eb122f911e4ed60f5307a072889169'

const PROTOCOL_CHECK_SCHEMA = {
  type: 'object',
  properties: {
    status: {
      type: 'string',
      enum: ['ok', 'warning'],
    },
    issues: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            enum: [
              'contradiction',
              'possible_default_value',
              'context_gap',
              'incomplete_protocol',
            ],
          },
          severity: {
            type: 'string',
            enum: ['low', 'medium', 'high'],
          },
          confidence: {
            type: 'number',
          },
          message: {
            type: 'string',
          },
          evidence: {
            type: 'array',
            items: {
              type: 'string',
            },
          },
          check: {
            type: 'string',
          },
        },
        required: ['type', 'severity', 'confidence', 'message', 'evidence', 'check'],
        additionalProperties: false,
      },
    },
  },
  required: ['status', 'issues'],
  additionalProperties: false,
} as const

const PROTOCOL_CHECK_RESPONSE_FORMAT = {
  type: 'json_schema',
  name: 'dd-check-v1',
  strict: true,
  schema: PROTOCOL_CHECK_SCHEMA,
} as const

const ISSUE_TYPES: ReadonlySet<string> = new Set([
  'contradiction',
  'possible_default_value',
  'context_gap',
  'incomplete_protocol',
])

const ISSUE_SEVERITIES: ReadonlySet<string> = new Set(['low', 'medium', 'high'])

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const hasExactKeys = (value: Record<string, unknown>, expectedKeys: string[]): boolean => {
  const keys = Object.keys(value)
  return keys.length === expectedKeys.length && expectedKeys.every((key) => keys.includes(key))
}

const isProtocolCheckIssue = (value: unknown): value is ProtocolCheckIssue => {
  if (!isRecord(value) || !hasExactKeys(value, [
    'type',
    'severity',
    'confidence',
    'message',
    'evidence',
    'check',
  ])) {
    return false
  }

  return typeof value.type === 'string'
    && ISSUE_TYPES.has(value.type)
    && typeof value.severity === 'string'
    && ISSUE_SEVERITIES.has(value.severity)
    && typeof value.confidence === 'number'
    && Number.isFinite(value.confidence)
    && typeof value.message === 'string'
    && Array.isArray(value.evidence)
    && value.evidence.every((item) => typeof item === 'string')
    && typeof value.check === 'string'
}

const isProtocolCheckResult = (value: unknown): value is ProtocolCheckResult => {
  if (!isRecord(value) || !hasExactKeys(value, ['status', 'issues'])) {
    return false
  }

  return (value.status === 'ok' || value.status === 'warning')
    && Array.isArray(value.issues)
    && value.issues.every(isProtocolCheckIssue)
}

export class ProtocolCheckError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options)
    this.name = 'ProtocolCheckError'
  }
}

export class ProtocolCheckService {
  private client?: Pick<OpenAI, 'responses'>

  constructor(client?: Pick<OpenAI, 'responses'>) {
    this.client = client
  }

  async checkProtocol(protocolText: string): Promise<ProtocolCheckResult> {
    let responseText: string

    try {
      responseText = await this.callAI({
        prompt: { id: PROTOCOL_CHECK_PROMPT_ID },
        input: protocolText,
        text: { format: PROTOCOL_CHECK_RESPONSE_FORMAT },
      })
    }
    catch (error) {
      throw new ProtocolCheckError('The protocol check request failed.', { cause: error })
    }

    if (responseText.trim().length === 0) {
      throw new ProtocolCheckError('The protocol check returned an empty response.')
    }

    let parsed: unknown
    try {
      parsed = JSON.parse(responseText)
    }
    catch (error) {
      throw new ProtocolCheckError('The protocol check returned invalid JSON.', { cause: error })
    }

    if (!isProtocolCheckResult(parsed)) {
      throw new ProtocolCheckError('The protocol check response does not match the expected schema.')
    }

    return parsed
  }

  private async callAI(payload: ResponseCreateParamsNonStreaming): Promise<string> {
    const response = await this.getClient().responses.create(payload)
    return response.output_text
  }

  private getClient(): Pick<OpenAI, 'responses'> {
    if (!this.client) {
      this.client = new OpenAI({
        apiKey: import.meta.env.VITE_OPENAI_API_KEY,
        dangerouslyAllowBrowser: true,
        timeout: 10 * 1000,
      })
    }

    return this.client
  }
}

const protocolCheckService = new ProtocolCheckService()

export default protocolCheckService
