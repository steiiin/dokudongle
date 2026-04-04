import { conditionalPrefix } from "../filter";

/**
 * Prepends with "seit" when no keyword is present yet.
 */
export function prefixSeit(draft: string): string {
  return conditionalPrefix(draft, 'seit',
    [
      'seit',
      'vor',
      'gestern', 'vorgestern',
      'heute', 'kürzlich',
      'letzte',
      'montag', 'dienstag', 'mittwoch', 'donnerstag', 'freitag', 'samstag', 'sonntag'
    ]
  )
}

/**
 * Prepends with "vor" when no keyword is present yet.
 */
export function prefixVor(draft: string): string {
  return conditionalPrefix(draft, 'vor',
    [
      'vor',
      'gestern', 'vorgestern',
      'heute', 'kürzlich',
      'letzte',
      'montag', 'dienstag', 'mittwoch', 'donnerstag', 'freitag', 'samstag', 'sonntag'
    ]
  )
}