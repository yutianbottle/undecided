/**
 * 原型用的封条：FNV-1a 变体，不具备密码学安全性，仅用于检测内容改动。
 * 输出 8 位大写 hex，展示为 XXXX·XXXX。
 */
export function sealHash(input: string): string {
  let h1 = 0x811c9dc5 >>> 0;
  let h2 = 0x9e3779b9 >>> 0;
  for (let i = 0; i < input.length; i++) {
    const c = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 0x01000193) >>> 0;
    h2 = Math.imul(h2 + c + i, 0x85ebca6b) >>> 0;
    h2 = (h2 ^ (h2 >>> 13)) >>> 0;
  }
  const a = h1.toString(16).padStart(8, '0').slice(0, 4);
  const b = h2.toString(16).padStart(8, '0').slice(0, 4);
  return (a + b).toUpperCase();
}

export function sealDisplay(hash: string | null): string {
  if (!hash) return '—';
  return `${hash.slice(0, 4)}·${hash.slice(4)}`;
}
