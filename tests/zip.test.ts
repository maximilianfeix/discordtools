import { describe, expect, it } from "vitest";
import { crc32, createZip, uniqueNames } from "../src/lib/zip";

const enc = new TextEncoder();

describe("zip", () => {
  it("computes crc32", () => {
    expect(crc32(enc.encode("hello"))).toBe(0x3610a686);
    expect(crc32(new Uint8Array())).toBe(0);
  });
  it("dedupes names", () => {
    expect(uniqueNames(["a.png", "a.png", "A.png", "b"])).toEqual(["a.png", "a (2).png", "A (3).png", "b"]);
  });
  it("writes a valid store-only archive", () => {
    const files = [
      { name: "hello.txt", data: enc.encode("hello"), date: new Date(2026, 9, 27, 12, 0, 0) },
      { name: "ümlaut.txt", data: enc.encode("world!") },
    ];
    const zip = createZip(files);
    const v = new DataView(zip.buffer);
    expect(v.getUint32(0, true)).toBe(0x04034b50);
    expect(v.getUint32(14, true)).toBe(0x3610a686);
    const eocd = zip.length - 22;
    expect(v.getUint32(eocd, true)).toBe(0x06054b50);
    expect(v.getUint16(eocd + 10, true)).toBe(2);
    const cdOffset = v.getUint32(eocd + 16, true);
    expect(v.getUint32(cdOffset, true)).toBe(0x02014b50);
    // second central entry points at the second local header
    const firstNameLen = v.getUint16(cdOffset + 28, true);
    const second = cdOffset + 46 + firstNameLen;
    const off2 = v.getUint32(second + 42, true);
    expect(v.getUint32(off2, true)).toBe(0x04034b50);
    expect(new TextDecoder().decode(zip.slice(off2 + 30, off2 + 30 + v.getUint16(off2 + 26, true)))).toBe("ümlaut.txt");
  });
});
