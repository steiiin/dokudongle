import { conditionalPrefix } from "../filter";

/**
 * Prepends with "seit" when no keyword is present yet.
 */
export function prefixSeit(draft: string): string {
  return conditionalPrefix(draft, 'seit',
    [
      'seit',
      'vor',
    ]
  )
}
