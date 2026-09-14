import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const outDir = join(here, "..", "icons");

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i += 1) {
    c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([length, body, crc]);
}

function encodePng(size, pixels) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const stride = size * 4;
  const raw = Buffer.alloc((stride + 1) * size);
  for (let y = 0; y < size; y += 1) {
    raw[y * (stride + 1)] = 0;
    pixels.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride);
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function roundedRectInside(px, py, size, radius) {
  const half = size / 2;
  const qx = Math.abs(px - half) - (half - radius);
  const qy = Math.abs(py - half) - (half - radius);
  const outside = Math.hypot(Math.max(qx, 0), Math.max(qy, 0));
  return outside + Math.min(Math.max(qx, qy), 0) - radius <= 0;
}

const FROM = [0x22, 0xd3, 0xee];
const TO = [0x34, 0xd3, 0x99];

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function sparkle(px, py, cx, cy, r) {
  const dx = Math.abs(px - cx) / r;
  const dy = Math.abs(py - cy) / r;
  if (dx > 1 || dy > 1) return false;
  return Math.sqrt(dx) + Math.sqrt(dy) <= 1;
}

function sample(px, py, size, radius) {
  if (!roundedRectInside(px, py, size, radius)) return [0, 0, 0, 0];

  const t = (px + py) / (2 * size);
  let r = Math.round(lerp(FROM[0], TO[0], t));
  let g = Math.round(lerp(FROM[1], TO[1], t));
  let b = Math.round(lerp(FROM[2], TO[2], t));

  const main = sparkle(px, py, size * 0.46, size * 0.5, size * 0.32);
  const small = sparkle(px, py, size * 0.74, size * 0.26, size * 0.14);

  if (main || small) {
    r = 255;
    g = 255;
    b = 255;
  }

  return [r, g, b, 255];
}

function generate(size) {
  const samples = 4;
  const pixels = Buffer.alloc(size * size * 4);
  const radius = size * 0.24;
  const step = 1 / samples;

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      let r = 0;
      let g = 0;
      let b = 0;
      let a = 0;
      for (let sy = 0; sy < samples; sy += 1) {
        for (let sx = 0; sx < samples; sx += 1) {
          const [pr, pg, pb, pa] = sample(
            x + (sx + 0.5) * step,
            y + (sy + 0.5) * step,
            size,
            radius
          );
          const alpha = pa / 255;
          r += pr * alpha;
          g += pg * alpha;
          b += pb * alpha;
          a += pa;
        }
      }
      const total = samples * samples;
      const idx = (y * size + x) * 4;
      const alphaAvg = a / total;
      if (alphaAvg > 0) {
        const weight = a / 255;
        pixels[idx] = Math.round(r / weight);
        pixels[idx + 1] = Math.round(g / weight);
        pixels[idx + 2] = Math.round(b / weight);
      }
      pixels[idx + 3] = Math.round(alphaAvg);
    }
  }

  return encodePng(size, pixels);
}

mkdirSync(outDir, { recursive: true });
for (const size of [16, 32, 48, 128]) {
  const file = join(outDir, `icon${size}.png`);
  writeFileSync(file, generate(size));
  console.log(`wrote ${file}`);
}
