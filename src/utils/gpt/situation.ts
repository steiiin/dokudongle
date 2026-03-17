import { gptText } from "./ai"

/**
 * Sends the situation draft to the configured OpenAI prompt for polishing.
 */
export async function enhanceSituation(text: string): Promise<string|null> {
  return await gptText(text, "pmpt_696df8ee18a881908a83590480a8bef9098a79d4b247a464")
}