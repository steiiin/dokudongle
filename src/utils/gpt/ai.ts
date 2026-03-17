import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
  timeout: 10 * 1000, // 20 seconds
})

async function callAI(payload: any): Promise<string|null> {
  try {
    const response = await openai.responses.create({ ...payload })
    return response.output_text
  } catch (error) {
    console.warn(error)
    return null
  }
}

/**
 * Helper around {@link callAI} that passes a prompt identifier/version together with the message.
 */
export async function gptText(message: any, id: any, version?: any): Promise<string|null> {
  return callAI({
    prompt: { id, version },
    input: message
  })
}