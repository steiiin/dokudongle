// german-hid-map.ts
//
// Character → [HID usage (page 0x07), modifier]
// Works with mbed USBKeyboard.key_code_raw(usage, modifier) on Nano 33 BLE Rev2

// ---- Modifiers (match your Arduino) ----
export const MOD_SHIFT   = 0x02;
export const MOD_ALTGR   = 0x40;   // Right-Alt (AltGr)
export const MOD_LITERAL = 0x80;   // Custom flag: Arduino converts dead key → literal via "dead + Space"

// ---- HID Keyboard/Keypad usages (USB page 0x07) ----
const U = {

  // Letters (US positions)
  A:0x04,B:0x05,C:0x06,D:0x07,E:0x08,F:0x09,G:0x0A,H:0x0B,I:0x0C,J:0x0D,
  K:0x0E,L:0x0F,M:0x10,N:0x11,O:0x12,P:0x13,Q:0x14,R:0x15,S:0x16,T:0x17,
  U:0x18,V:0x19,W:0x1A,X:0x1B,Y:0x1C,Z:0x1D,

  // Digits row
  D1:0x1E,D2:0x1F,D3:0x20,D4:0x21,D5:0x22,D6:0x23,D7:0x24,D8:0x25,D9:0x26,D0:0x27,

  // Controls & space
  ENTER:0x28, ESC:0x29, BKSP:0x2A, TAB:0x2B, SPACE:0x2C,

  // Punctuation (US physical keys; remapped by DE layout)
  MINUS:0x2D,      // DE: ß / ?
  EQUAL:0x2E,      // DE: ´ (dead) / ` (dead+Shift)
  LBRACKET:0x2F,   // DE: ü / Ü
  RBRACKET:0x30,   // DE: + / *
  BACKSLASH:0x31,  // DE: # / '
  SEMICOLON:0x33,  // DE: ö / Ö
  APOSTROPHE:0x34, // DE: ä / Ä
  GRAVE:0x35,      // DE: ^ (dead) / ° (Shift)
  COMMA:0x36, DOT:0x37, SLASH:0x38, // DE: - / _ on SLASH
  NONUS:0x64       // ISO extra key: < > | (left of right shift)

};

// ---- Full DE (Germany) character → [usage, modifier] map ----
export const DE_CHAR_TO_HID: Record<string, [number, number?]> = {

  // Controls / whitespace
  '\n': [U.ENTER], '\t': [U.TAB], '\b': [U.BKSP], '\x1B': [U.ESC],
  ' ':  [U.SPACE],

  // Top row (digits & shifted symbols)
  '1':[U.D1], '!':[U.D1, MOD_SHIFT],
  '2':[U.D2], '"':[U.D2, MOD_SHIFT], '²':[U.D2, MOD_ALTGR],
  '3':[U.D3], '§':[U.D3, MOD_SHIFT], '³':[U.D3, MOD_ALTGR],
  '4':[U.D4], '$':[U.D4, MOD_SHIFT],
  '5':[U.D5], '%':[U.D5, MOD_SHIFT],
  '6':[U.D6], '&':[U.D6, MOD_SHIFT],
  '7':[U.D7], '/':[U.D7, MOD_SHIFT], '{':[U.D7, MOD_ALTGR],
  '8':[U.D8], '(':[U.D8, MOD_SHIFT], '[':[U.D8, MOD_ALTGR],
  '9':[U.D9], ')':[U.D9, MOD_SHIFT], ']':[U.D9, MOD_ALTGR],
  '0':[U.D0], '=':[U.D0, MOD_SHIFT], '}':[U.D0, MOD_ALTGR],

  'ß':[U.MINUS], '?':[U.MINUS, MOD_SHIFT], '\\':[U.MINUS, MOD_ALTGR],

  // Dead keys (acute/grave) → mark as literal so Arduino sends "dead + Space"
  '´':[U.EQUAL, MOD_LITERAL],      // acute as literal
  '`':[U.EQUAL, MOD_SHIFT | MOD_LITERAL], // grave as literal (on DE via Shift+´ dead)

  // QWERTZ row + AltGr (€, @)
  'q':[U.Q], 'Q':[U.Q, MOD_SHIFT], '@':[U.Q, MOD_ALTGR],
  'w':[U.W], 'W':[U.W, MOD_SHIFT],
  'e':[U.E], 'E':[U.E, MOD_SHIFT], '€':[U.E, MOD_ALTGR],
  'r':[U.R], 'R':[U.R, MOD_SHIFT],
  't':[U.T], 'T':[U.T, MOD_SHIFT],

  // y/z swap (DE layout)
  'z':[U.Y], 'Z':[U.Y, MOD_SHIFT],  // 'z' lives on US 'Y' usage
  'u':[U.U], 'U':[U.U, MOD_SHIFT],
  'i':[U.I], 'I':[U.I, MOD_SHIFT],
  'o':[U.O], 'O':[U.O, MOD_SHIFT],
  'p':[U.P], 'P':[U.P, MOD_SHIFT],

  'ü':[U.LBRACKET], 'Ü':[U.LBRACKET, MOD_SHIFT],
  '+':[U.RBRACKET], '*':[U.RBRACKET, MOD_SHIFT], '~':[U.RBRACKET, MOD_ALTGR],

  // Home row
  'a':[U.A], 'A':[U.A, MOD_SHIFT],
  's':[U.S], 'S':[U.S, MOD_SHIFT],
  'd':[U.D], 'D':[U.D, MOD_SHIFT],
  'f':[U.F], 'F':[U.F, MOD_SHIFT],
  'g':[U.G], 'G':[U.G, MOD_SHIFT],
  'h':[U.H], 'H':[U.H, MOD_SHIFT],
  'j':[U.J], 'J':[U.J, MOD_SHIFT],
  'k':[U.K], 'K':[U.K, MOD_SHIFT],
  'l':[U.L], 'L':[U.L, MOD_SHIFT],

  'ö':[U.SEMICOLON], 'Ö':[U.SEMICOLON, MOD_SHIFT],
  'ä':[U.APOSTROPHE], 'Ä':[U.APOSTROPHE, MOD_SHIFT],
  '#':[U.BACKSLASH],  '\'':[U.BACKSLASH, MOD_SHIFT],

  // Bottom row + ISO key
  '<':[U.NONUS], '>':[U.NONUS, MOD_SHIFT], '|':[U.NONUS, MOD_ALTGR],

  // y on DE lives on US Z
  'y':[U.Z], 'Y':[U.Z, MOD_SHIFT],
  'x':[U.X], 'X':[U.X, MOD_SHIFT],
  'c':[U.C], 'C':[U.C, MOD_SHIFT],
  'v':[U.V], 'V':[U.V, MOD_SHIFT],
  'b':[U.B], 'B':[U.B, MOD_SHIFT],
  'n':[U.N], 'N':[U.N, MOD_SHIFT],
  'm':[U.M], 'M':[U.M, MOD_SHIFT],
  'µ':[U.M, MOD_ALTGR],

  ',':[U.COMMA], ';':[U.COMMA, MOD_SHIFT],
  '.':[U.DOT],   ':':[U.DOT,   MOD_SHIFT],
  '-':[U.SLASH], '_':[U.SLASH, MOD_SHIFT],   // DE: '-' on US SLASH
  // Caret (dead) and Degree
  '^':[U.GRAVE, MOD_LITERAL],     // caret literal (dead ^ + Space)
  '°':[U.GRAVE, MOD_SHIFT]
};

// pack a string to [key,mod] pairs
/**
 * Converts a string to an array of HID usage/modifier pairs compatible with the DE layout.
 */
export function textToHidEvents(text: string): Array<[number, number]> {
  const out: Array<[number, number]> = [];
  for (const ch of text) {
    const pair = DE_CHAR_TO_HID[ch];
    if (pair)
    {
      out.push([ pair[0], pair[1] ?? 0x00 ]);
    }
  }
  return out
}

const SUPPORTED_INPUT_REGEX = /[^a-zA-Z0-9.,_/*"':;!?@#€%&\-+()~|}{\][=°$\\<>üöäÜÖÄß]/g;

/**
 * Removes diacritics while keeping German umlauts intact.
 */
export function stripNotSupported(input: string): string {
  const nfd = input.normalize('NFD');
  let out = '';
  for (const ch of nfd) {
    const cp = ch.codePointAt(0)!;
    if (cp >= 0x0300 && cp <= 0x036F && cp !== 0x0308) continue;
    out += ch;
  }
  return out.normalize('NFC').replace(SUPPORTED_INPUT_REGEX, '');
}