declare module 'nspell' {
  export interface NSpellDictionary {
    aff: string | Uint8Array
    dic: string | Uint8Array
  }

  export interface NSpell {
    correct(word: string): boolean
    suggest(word: string): string[]
    add(word: string, model?: string): NSpell
    remove(word: string): NSpell
  }

  export default function nspell(dictionary: NSpellDictionary): NSpell
}

declare module 'virtual:dictionary-de' {
  const dictionary: { aff: string; dic: string }
  export default dictionary
}
