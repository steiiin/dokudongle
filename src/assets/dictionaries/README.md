# Editable German dictionary

Edit **de.dic** directly. It starts as an unchanged copy of `dictionary-de@3.0.0`.
The app and its spell-checking worker load this local file; no generation step is
required. Rebuild the app to ship your changes, or reload it during development.

- Add or remove one entry per line. A new word can be a plain line: `Tachykardie`.
- Keep suffixes after `/` on existing entries, e.g. `Patient/FPm`. These flags
  control inflections and compounds; they are not part of the word itself.
- Leave the first line and the indented copyright notice in place. The first line
  is the entry count, which the loader recalculates automatically in memory.
- Hunspell can also recognize words through inflection or composition. To
  explicitly exclude a spelling, replace its entry with `Word/d`, for example
  `Berlin/d`. The existing `d` flag marks that spelling as forbidden. This does
  not exclude every related word or inflected form.

The matching grammar rules (`index.aff`) still come from the pinned
`dictionary-de@3.0.0` development dependency. Only its rules are bundled, not its
original word list. `medical-de.json` and personal/learned dictionaries continue
to add words at runtime, so they may reintroduce a word removed here.

Source: <https://github.com/wooorm/dictionaries/tree/main/dictionaries/de>
(igerman98 20161207). Copyright © 1999–2016 Björn Jacke and contributors.
The dictionary retains its GPL-2.0 or GPL-3.0 license; see
`THIRD_PARTY_NOTICES.md` at the repository root.
Full license texts are shipped from `public/licenses/dictionary-de/`.
