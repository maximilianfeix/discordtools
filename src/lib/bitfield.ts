/**
 * BigInt bitfield helpers shared by the permissions, intents and flags tools.
 * Discord serialises big bitfields as decimal strings; JS numbers lose precision above 2^53,
 * so everything here works on bigint and never goes through Number.
 */

export type ParseError = "empty" | "invalid" | "negative" | "too-large" | "unsafe-number";

export type ParseResult = { ok: true; value: bigint } | { ok: false; error: ParseError };

/** Upper limit we accept (64 bits is what Discord uses for any bitfield). */
export const MAX_BITS = 64;

/**
 * Parses user input into a bitfield. Accepts decimal (`8`, `2 147 483 648`), hex (`0x1F`),
 * binary (`0b101`) and a JSON-quoted string (`"8"`). Separators like spaces, `_`, `'` and `,` are ignored.
 */
export function parseBitfield(raw: string): ParseResult {
  let s = raw.trim().replace(/^["'`]+|["'`]+$/g, "").trim();
  if (!s) return { ok: false, error: "empty" };
  if (s.startsWith("-")) return { ok: false, error: "negative" };
  s = s.replace(/[\s_',]/g, "");
  // `1e+21`-style output from JavaScript means the number was already rounded somewhere.
  if (/^\d+(\.\d+)?e\+?\d+$/i.test(s)) return { ok: false, error: "unsafe-number" };
  if (s.endsWith("n")) s = s.slice(0, -1);
  let value: bigint;
  if (/^0x[0-9a-f]+$/i.test(s)) value = BigInt(s);
  else if (/^0b[01]+$/i.test(s)) value = BigInt(s);
  else if (/^\d+$/.test(s)) value = BigInt(s);
  else return { ok: false, error: "invalid" };
  if (value >= 1n << BigInt(MAX_BITS)) return { ok: false, error: "too-large" };
  return { ok: true, value };
}

export const bit = (n: number): bigint => 1n << BigInt(n);

export function hasBit(value: bigint, n: number): boolean {
  return (value & bit(n)) !== 0n;
}

export function toggleBit(value: bigint, n: number, on?: boolean): bigint {
  const b = bit(n);
  const set = on ?? (value & b) === 0n;
  return set ? value | b : value & ~b;
}

/** All set bit positions, ascending. */
export function bitsOf(value: bigint): number[] {
  const out: number[] = [];
  let v = value;
  let i = 0;
  while (v > 0n) {
    if (v & 1n) out.push(i);
    v >>= 1n;
    i++;
  }
  return out;
}

export function fromBits(bits: Iterable<number>): bigint {
  let v = 0n;
  for (const b of bits) v |= bit(b);
  return v;
}

export function maskOf(bits: Iterable<number>): bigint {
  return fromBits(bits);
}

/** Bits that are set in `value` but not part of `known`. */
export function unknownBits(value: bigint, known: bigint): number[] {
  return bitsOf(value & ~known);
}

export function toHex(value: bigint): string {
  return "0x" + value.toString(16).toUpperCase();
}

export function toBinary(value: bigint): string {
  return value.toString(2);
}

/** True when a decimal string is above Number.MAX_SAFE_INTEGER (would be rounded by JSON.parse / Number). */
export function exceedsSafeInteger(value: bigint): boolean {
  return value > BigInt(Number.MAX_SAFE_INTEGER);
}

export interface BitDiff {
  added: number[];
  removed: number[];
  kept: number[];
}

export function diffBits(from: bigint, to: bigint): BitDiff {
  return {
    added: bitsOf(to & ~from),
    removed: bitsOf(from & ~to),
    kept: bitsOf(from & to),
  };
}

export const PARSE_ERRORS: Record<"de" | "en", Record<ParseError, string>> = {
  de: {
    empty: "Gib eine Zahl ein.",
    invalid: "Das ist keine gültige Zahl. Erlaubt sind Dezimal (z. B. 8), Hex (0x8) oder Binär (0b1000).",
    negative: "Bitfelder sind nie negativ.",
    "too-large": "Die Zahl ist größer als 64 Bit – so etwas schickt Discord nicht.",
    "unsafe-number":
      "Das ist eine gerundete Zahl in Exponent-Schreibweise. Kopiere den Wert als String (in Anführungszeichen) aus dem JSON.",
  },
  en: {
    empty: "Enter a number.",
    invalid: "That is not a valid number. Use decimal (e.g. 8), hex (0x8) or binary (0b1000).",
    negative: "Bitfields are never negative.",
    "too-large": "The number is larger than 64 bits – Discord never sends that.",
    "unsafe-number": "That is a rounded number in exponent notation. Copy the value as a string (in quotes) from the JSON.",
  },
};
