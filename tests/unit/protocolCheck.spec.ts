import type OpenAI from 'openai'
import { webcrypto } from 'node:crypto'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import {
  ProtocolCheckError,
  ProtocolCheckService,
  type ProtocolCheckResult,
} from '@/services/protocol-check'

const validResult: ProtocolCheckResult = {
  status: 'warning',
  issues: [
    {
      type: 'contradiction',
      severity: 'high',
      confidence: 0.93,
      message: 'Die Angaben widersprechen sich.',
      evidence: ['Aussage A', 'Aussage B'],
      check: 'Angaben miteinander abgleichen.',
    },
    {
      type: 'context_gap',
      severity: 'medium',
      confidence: 0.7,
      message: 'Kontext fehlt.',
      evidence: [],
      check: 'Einsatzkontext ergänzen.',
    },
  ],
}

const createService = (outputText: string) => {
  const create = vi.fn().mockResolvedValue({ output_text: outputText })
  const client = { responses: { create } } as unknown as Pick<OpenAI, 'responses'>
  return { service: new ProtocolCheckService(client), create }
}

describe('ProtocolCheckService', () => {
  beforeEach(() => {
    vi.stubGlobal('crypto', webcrypto)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  test.each([
    { status: 'ok', issues: [] },
    validResult,
  ])('reuses a completed $status check for identical text', async result => {
    const { service, create } = createService(JSON.stringify(result))

    expect(await service.getCachedResult('Protocol text')).toBeNull()
    await expect(service.checkProtocol('Protocol text')).resolves.toEqual(result)
    await expect(service.getCachedResult('Protocol text')).resolves.toEqual(result)
    await expect(service.checkProtocol('Protocol text')).resolves.toEqual(result)

    expect(create).toHaveBeenCalledOnce()
  })

  test.each(['Protocol text ', 'Protocol text\n', 'Changed protocol', 'Prötokoll 🩺'])(
    'checks changed text exactly as provided: %j', async changedText => {
      const { service, create } = createService(JSON.stringify(validResult))
      await service.checkProtocol('Protocol text')

      expect(await service.getCachedResult(changedText)).toBeNull()
      await service.checkProtocol(changedText)

      expect(create).toHaveBeenCalledTimes(2)
      expect(create).toHaveBeenLastCalledWith(expect.objectContaining({ input: changedText }))
      expect(await service.getCachedResult('Protocol text')).toBeNull()
      expect(await service.getCachedResult(changedText)).toEqual(validResult)
    },
  )

  test('shares pending requests for identical text', async () => {
    const { service, create } = createService('')
    let resolveCheck!: (response: { output_text: string }) => void
    create.mockReturnValue(new Promise(resolve => { resolveCheck = resolve }))

    const first = service.checkProtocol('Protocol text')
    await vi.waitFor(() => expect(create).toHaveBeenCalledOnce())
    const second = service.checkProtocol('Protocol text')
    expect(await service.getCachedResult('Protocol text')).toBeNull()

    resolveCheck({ output_text: JSON.stringify(validResult) })
    await expect(Promise.all([first, second])).resolves.toEqual([validResult, validResult])
    expect(create).toHaveBeenCalledOnce()
  })

  test('an older response cannot overwrite the latest completed check', async () => {
    const { service, create } = createService(JSON.stringify(validResult))
    let resolveOlder!: (response: { output_text: string }) => void
    create.mockReturnValueOnce(new Promise(resolve => { resolveOlder = resolve }))

    const older = service.checkProtocol('Older text')
    await vi.waitFor(() => expect(create).toHaveBeenCalledOnce())
    await service.checkProtocol('Newer text')
    resolveOlder({ output_text: JSON.stringify({ status: 'ok', issues: [] }) })
    await older

    expect(await service.getCachedResult('Newer text')).toEqual(validResult)
    expect(await service.getCachedResult('Older text')).toBeNull()
  })

  test('retries a failed request for unchanged text', async () => {
    const { service, create } = createService(JSON.stringify(validResult))
    create.mockRejectedValueOnce(new Error('timeout'))

    await expect(service.checkProtocol('Protocol text')).rejects.toBeInstanceOf(ProtocolCheckError)
    expect(await service.getCachedResult('Protocol text')).toBeNull()
    await expect(service.checkProtocol('Protocol text')).resolves.toEqual(validResult)
    expect(create).toHaveBeenCalledTimes(2)
  })

  test('sends the protocol with the configured prompt and exact strict response schema', async () => {
    const { service, create } = createService(JSON.stringify({ status: 'ok', issues: [] }))

    await service.checkProtocol('Protocol text')

    expect(create).toHaveBeenCalledOnce()
    expect(create).toHaveBeenCalledWith({
      prompt: {
        id: 'pmpt_6a86a59a9adc8195b2eb122f911e4ed60f5307a072889169',
      },
      input: 'Protocol text',
      text: {
        format: {
          type: 'json_schema',
          name: 'dd-check-v1',
          strict: true,
          schema: {
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
          },
        },
      },
    })
  })

  test('parses successful and multi-issue responses without changing issue order', async () => {
    const success = createService(JSON.stringify({ status: 'ok', issues: [] }))
    await expect(success.service.checkProtocol('Complete')).resolves.toEqual({ status: 'ok', issues: [] })

    const warning = createService(JSON.stringify(validResult))
    await expect(warning.service.checkProtocol('Warnings')).resolves.toEqual(validResult)
  })

  test.each([
    ['empty output', ''],
    ['whitespace output', '   '],
    ['malformed JSON', '{"status":'],
    ['missing fields', JSON.stringify({ status: 'ok' })],
    ['invalid status', JSON.stringify({ status: 'error', issues: [] })],
    ['invalid issue enum', JSON.stringify({
      ...validResult,
      issues: [{ ...validResult.issues[0], severity: 'critical' }],
    })],
    ['invalid evidence', JSON.stringify({
      ...validResult,
      issues: [{ ...validResult.issues[0], evidence: [42] }],
    })],
    ['additional result property', JSON.stringify({ status: 'ok', issues: [], detail: 'unexpected' })],
    ['additional issue property', JSON.stringify({
      ...validResult,
      issues: [{ ...validResult.issues[0], detail: 'unexpected' }],
    })],
  ])('rejects %s', async (_label, outputText) => {
    const { service, create } = createService(outputText)
    await expect(service.checkProtocol('Protocol')).rejects.toBeInstanceOf(ProtocolCheckError)
    expect(await service.getCachedResult('Protocol')).toBeNull()
    create.mockResolvedValue({ output_text: JSON.stringify(validResult) })
    await expect(service.checkProtocol('Protocol')).resolves.toEqual(validResult)
    expect(create).toHaveBeenCalledTimes(2)
  })

  test('rejects non-finite confidence values after runtime validation', async () => {
    const create = vi.fn().mockResolvedValue({
      output_text: '{"status":"warning","issues":[{"type":"context_gap","severity":"low","confidence":1e400,"message":"Missing","evidence":[],"check":"Review"}]}',
    })
    const client = { responses: { create } } as unknown as Pick<OpenAI, 'responses'>

    await expect(new ProtocolCheckService(client).checkProtocol('Protocol'))
      .rejects.toBeInstanceOf(ProtocolCheckError)
  })

  test('wraps request failures, including timeouts, without swallowing the cause', async () => {
    const timeout = new Error('Request timed out')
    const create = vi.fn().mockRejectedValue(timeout)
    const client = { responses: { create } } as unknown as Pick<OpenAI, 'responses'>
    const service = new ProtocolCheckService(client)

    try {
      await service.checkProtocol('Protocol')
      throw new Error('Expected checkProtocol to reject')
    }
    catch (error) {
      expect(error).toBeInstanceOf(ProtocolCheckError)
      expect((error as ProtocolCheckError).cause).toBe(timeout)
    }
  })
})
