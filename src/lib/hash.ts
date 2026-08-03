export function fakeSha256(seed?: string): string {
  const s = (seed ?? Math.random().toString()) + Date.now().toString();
  let h = 0x811c9dc5;
  const chars: string[] = [];
  for (let i = 0; i < s.length; i++) {
    h = Math.imul(h ^ s.charCodeAt(i), 0x01000193) >>> 0;
  }
  let state = h >>> 0;
  for (let i = 0; i < 64; i++) {
    state = Math.imul(state ^ (state >>> 15), 0x2c1b3c6d) >>> 0;
    chars.push((state & 0xf).toString(16));
  }
  return chars.join("");
}

export function shortHash(h: string): string {
  return h.slice(0, 4) + "…" + h.slice(-4);
}
