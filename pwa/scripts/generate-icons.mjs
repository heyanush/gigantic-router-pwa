// Dependency-free PNG icon generator: primary-blue tile with a white WiFi glyph.
import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const outDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'public');
mkdirSync(outDir, { recursive: true });

const PRIMARY = [0x3f, 0x51, 0xb5];
const WHITE = [0xff, 0xff, 0xff];

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}
function chunk(type, data) {
  const t = Buffer.from(type, 'ascii');
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(Buffer.concat([t, data])));
  return Buffer.concat([len, t, data, crc]);
}

function png(size) {
  const cx = size / 2;
  const cy = size * 0.66;          // glyph origin near lower-middle
  const r0 = size * 0.07;          // dot radius
  const bands = [[0.20, 0.27], [0.34, 0.41], [0.48, 0.55]].map(([a, b]) => [a * size, b * size]);

  const raw = Buffer.alloc(size * (size * 3 + 1));
  let p = 0;
  for (let y = 0; y < size; y++) {
    raw[p++] = 0; // filter: none
    for (let x = 0; x < size; x++) {
      let col = PRIMARY;
      const dx = x - cx, dy = y - cy;
      const dist = Math.hypot(dx, dy);
      const up = dy <= 2; // only upper hemisphere for arcs
      if (dist <= r0) {
        col = WHITE; // center dot
      } else if (up) {
        for (const [inner, outer] of bands) {
          if (dist >= inner && dist <= outer) { col = WHITE; break; }
        }
      }
      raw[p++] = col[0]; raw[p++] = col[1]; raw[p++] = col[2];
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 2; // 8-bit, truecolor RGB
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}

for (const s of [192, 512]) {
  writeFileSync(join(outDir, `icon-${s}.png`), png(s));
  console.log(`wrote icon-${s}.png`);
}

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
<rect width="64" height="64" rx="14" fill="#3f51b5"/>
<g fill="none" stroke="#fff" stroke-width="4.5" stroke-linecap="round">
<path d="M18 34a20 20 0 0 1 28 0"/><path d="M24 40a12 12 0 0 1 16 0"/></g>
<circle cx="32" cy="46" r="3.4" fill="#fff"/></svg>`;
writeFileSync(join(outDir, 'favicon.svg'), svg);
console.log('wrote favicon.svg');
