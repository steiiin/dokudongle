import { gptText } from "./ai"

/**
 * Uses the bleeding-specific OpenAI prompt to clean up the supplied draft text.
 */
export async function enhanceBleeding(text: string): Promise<string|null> {
  return await gptText(text, "pmpt_68a76ec17a148195b07f6231dc810e1c0f762553939a211d")
}