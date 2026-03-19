import { gptText } from "./ai"

/**
 * Sends the situation draft to the configured OpenAI prompt for polishing.
 */
export async function enhanceGeneral(text: string): Promise<string|null> {
  return await gptText(text, "pmpt_69bc580942408194ac7d6c871b5f4f7a067d15a44e935dc1")
}
