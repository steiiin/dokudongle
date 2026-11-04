import { conditionalPrefix } from "../text";

/**
 * Stellt „seit“ voran, wenn noch kein Schlüsselwort vorhanden ist.
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
 * Stellt „vor“ voran, wenn noch kein Schlüsselwort vorhanden ist.
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