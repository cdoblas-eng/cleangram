// Pixelado/blur de información sensible en capturas, sin dependencias.
//
// Uso:
//   node tools/redact.mjs [config.json]
//
// Por defecto lee tools/redact.config.json. Para cada imagen aplica las
// regiones indicadas (coordenadas relativas 0..1 o píxeles) y escribe el
// resultado en outputDir conservando el nombre.

import { deflateSync, inflateSync } from "node:zlib";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { basename, dirname, isAbsolute, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(here, "..");

// ---------------------------------------------------------------------------
// PNG
// ---------------------------------------------------------------------------

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
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

function paeth(a, b, c) {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  if (pb <= pc) return b;
  return c;
}

// Devuelve { width, height, data: RGBA Uint8Array }.
function decodePng(buf) {
  if (buf.readUInt32BE(0) !== 0x89504e47) throw new Error("No es un PNG");

  let pos = 8;
  let width = 0;
  let height = 0;
  let bitDepth = 0;
  let colorType = 0;
  let interlace = 0;
  let palette = null;
  const idat = [];

  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos);
    pos += 4;
    const type = buf.toString("ascii", pos, pos + 4);
    pos += 4;
    const data = buf.subarray(pos, pos + len);
    pos += len + 4;

    if (type === "IHDR") {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      bitDepth = data[8];
      colorType = data[9];
      interlace = data[12];
    } else if (type === "PLTE") {
      palette = data;
    } else if (type === "IDAT") {
      idat.push(data);
    } else if (type === "IEND") {
      break;
    }
  }

  if (interlace !== 0) throw new Error("PNG entrelazado (Adam7) no soportado");
  if (bitDepth !== 8) throw new Error(`Profundidad ${bitDepth} no soportada (solo 8)`);

  const channelsByType = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 };
  const channels = channelsByType[colorType];
  if (!channels) throw new Error(`Tipo de color ${colorType} no soportado`);

  const raw = inflateSync(Buffer.concat(idat));
  const stride = width * channels;
  const out = Buffer.alloc(height * stride);
  const bpp = channels;

  let rp = 0;
  for (let y = 0; y < height; y += 1) {
    const filter = raw[rp];
    rp += 1;
    const rowStart = y * stride;
    const prevStart = rowStart - stride;
    for (let i = 0; i < stride; i += 1) {
      const x = raw[rp + i];
      const a = i >= bpp ? out[rowStart + i - bpp] : 0;
      const b = y > 0 ? out[prevStart + i] : 0;
      const c = y > 0 && i >= bpp ? out[prevStart + i - bpp] : 0;
      let value;
      switch (filter) {
        case 0: value = x; break;
        case 1: value = x + a; break;
        case 2: value = x + b; break;
        case 3: value = x + ((a + b) >> 1); break;
        case 4: value = x + paeth(a, b, c); break;
        default: throw new Error(`Filtro PNG ${filter} desconocido`);
      }
      out[rowStart + i] = value & 0xff;
    }
    rp += stride;
  }

  const rgba = new Uint8Array(width * height * 4);
  for (let p = 0; p < width * height; p += 1) {
    let r;
    let g;
    let b;
    let a;
    if (colorType === 0) {
      r = g = b = out[p];
      a = 255;
    } else if (colorType === 4) {
      r = g = b = out[p * 2];
      a = out[p * 2 + 1];
    } else if (colorType === 2) {
      r = out[p * 3];
      g = out[p * 3 + 1];
      b = out[p * 3 + 2];
      a = 255;
    } else if (colorType === 6) {
      r = out[p * 4];
      g = out[p * 4 + 1];
      b = out[p * 4 + 2];
      a = out[p * 4 + 3];
    } else {
      const idx = out[p] * 3;
      r = palette[idx];
      g = palette[idx + 1];
      b = palette[idx + 2];
      a = 255;
    }
    rgba[p * 4] = r;
    rgba[p * 4 + 1] = g;
    rgba[p * 4 + 2] = b;
    rgba[p * 4 + 3] = a;
  }

  return { width, height, data: rgba };
}

function encodePng({ width, height, data }) {
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y += 1) {
    raw[y * (stride + 1)] = 0;
    Buffer.from(data.buffer, data.byteOffset + y * stride, stride).copy(
      raw,
      y * (stride + 1) + 1
    );
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// ---------------------------------------------------------------------------
// Redacción
// ---------------------------------------------------------------------------

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function resolveRect(rect, img, padding) {
  const px = rect.px === true;
  const x = (px ? rect.x : rect.x * img.width) - padding;
  const y = (px ? rect.y : rect.y * img.height) - padding;
  const w = (px ? rect.w : rect.w * img.width) + padding * 2;
  const h = (px ? rect.h : rect.h * img.height) + padding * 2;
  return {
    x0: clamp(Math.round(x), 0, img.width),
    y0: clamp(Math.round(y), 0, img.height),
    x1: clamp(Math.round(x + w), 0, img.width),
    y1: clamp(Math.round(y + h), 0, img.height),
  };
}

function pixelate(img, rect, block) {
  const { data, width } = img;
  const b = Math.max(2, Math.round(block));
  for (let by = rect.y0; by < rect.y1; by += b) {
    const yEnd = Math.min(by + b, rect.y1);
    for (let bx = rect.x0; bx < rect.x1; bx += b) {
      const xEnd = Math.min(bx + b, rect.x1);
      let r = 0;
      let g = 0;
      let bl = 0;
      let a = 0;
      let n = 0;
      for (let y = by; y < yEnd; y += 1) {
        for (let x = bx; x < xEnd; x += 1) {
          const i = (y * width + x) * 4;
          r += data[i];
          g += data[i + 1];
          bl += data[i + 2];
          a += data[i + 3];
          n += 1;
        }
      }
      r = Math.round(r / n);
      g = Math.round(g / n);
      bl = Math.round(bl / n);
      a = Math.round(a / n);
      for (let y = by; y < yEnd; y += 1) {
        for (let x = bx; x < xEnd; x += 1) {
          const i = (y * width + x) * 4;
          data[i] = r;
          data[i + 1] = g;
          data[i + 2] = bl;
          data[i + 3] = a;
        }
      }
    }
  }
}

function boxBlur(img, rect, radius) {
  const { data, width } = img;
  const r = Math.max(1, Math.round(radius));
  const w = rect.x1 - rect.x0;
  const h = rect.y1 - rect.y0;
  if (w <= 0 || h <= 0) return;
  const src = new Uint8Array(data);
  const pass = (horizontal) => {
    const tmp = new Uint8Array(data);
    for (let y = rect.y0; y < rect.y1; y += 1) {
      for (let x = rect.x0; x < rect.x1; x += 1) {
        let rr = 0;
        let gg = 0;
        let bb = 0;
        let aa = 0;
        let n = 0;
        for (let k = -r; k <= r; k += 1) {
          const sx = horizontal ? x + k : x;
          const sy = horizontal ? y : y + k;
          if (sx < rect.x0 || sx >= rect.x1 || sy < rect.y0 || sy >= rect.y1) continue;
          const i = (sy * width + sx) * 4;
          rr += src[i];
          gg += src[i + 1];
          bb += src[i + 2];
          aa += src[i + 3];
          n += 1;
        }
        const i = (y * width + x) * 4;
        tmp[i] = Math.round(rr / n);
        tmp[i + 1] = Math.round(gg / n);
        tmp[i + 2] = Math.round(bb / n);
        tmp[i + 3] = Math.round(aa / n);
      }
    }
    data.set(tmp);
  };
  pass(true);
  src.set(data);
  pass(false);
}

function scaleBilinear(image, nw, nh) {
  const { width, height, data } = image;
  const out = new Uint8Array(nw * nh * 4);
  const xr = width / nw;
  const yr = height / nh;
  for (let y = 0; y < nh; y += 1) {
    const sy = (y + 0.5) * yr - 0.5;
    const y0 = clamp(Math.floor(sy), 0, height - 1);
    const y1 = Math.min(height - 1, y0 + 1);
    const wy = clamp(sy - y0, 0, 1);
    for (let x = 0; x < nw; x += 1) {
      const sx = (x + 0.5) * xr - 0.5;
      const x0 = clamp(Math.floor(sx), 0, width - 1);
      const x1 = Math.min(width - 1, x0 + 1);
      const wx = clamp(sx - x0, 0, 1);
      const i00 = (y0 * width + x0) * 4;
      const i01 = (y0 * width + x1) * 4;
      const i10 = (y1 * width + x0) * 4;
      const i11 = (y1 * width + x1) * 4;
      const di = (y * nw + x) * 4;
      for (let c = 0; c < 4; c += 1) {
        const top = data[i00 + c] * (1 - wx) + data[i01 + c] * wx;
        const bot = data[i10 + c] * (1 - wx) + data[i11 + c] * wx;
        out[di + c] = Math.round(top * (1 - wy) + bot * wy);
      }
    }
  }
  return { width: nw, height: nh, data: out };
}

function hexToRgb(hex) {
  const value = hex.replace("#", "");
  return [
    parseInt(value.slice(0, 2), 16),
    parseInt(value.slice(2, 4), 16),
    parseInt(value.slice(4, 6), 16),
  ];
}

// Ajusta la imagen dentro de width x height sin deformar y centra sobre fondo.
function fitToCanvas(image, width, height, background) {
  const scale = Math.min(width / image.width, height / image.height);
  const nw = Math.max(1, Math.round(image.width * scale));
  const nh = Math.max(1, Math.round(image.height * scale));
  const scaled = scaleBilinear(image, nw, nh);
  const [r, g, b] = hexToRgb(background);
  const out = new Uint8Array(width * height * 4);
  for (let i = 0; i < width * height; i += 1) {
    out[i * 4] = r;
    out[i * 4 + 1] = g;
    out[i * 4 + 2] = b;
    out[i * 4 + 3] = 255;
  }
  const ox = Math.floor((width - nw) / 2);
  const oy = Math.floor((height - nh) / 2);
  for (let y = 0; y < nh; y += 1) {
    for (let x = 0; x < nw; x += 1) {
      const si = (y * nw + x) * 4;
      const di = ((oy + y) * width + ox + x) * 4;
      out[di] = scaled.data[si];
      out[di + 1] = scaled.data[si + 1];
      out[di + 2] = scaled.data[si + 2];
      out[di + 3] = 255;
    }
  }
  return { width, height, data: out };
}

function redact(image, rects, config) {
  let count = 0;
  for (const rect of rects) {
    const resolved = resolveRect(rect, image, config.padding ?? 0);
    if (resolved.x1 <= resolved.x0 || resolved.y1 <= resolved.y0) continue;
    const mode = rect.mode ?? config.mode ?? "pixelate";
    if (mode === "blur") {
      boxBlur(image, resolved, rect.radius ?? config.radius ?? 16);
      boxBlur(image, resolved, rect.radius ?? config.radius ?? 16);
    } else {
      pixelate(image, resolved, rect.block ?? config.block ?? 16);
    }
    count += 1;
  }
  return count;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const configPath = resolve(process.argv[2] ?? join(here, "redact.config.json"));
const config = JSON.parse(readFileSync(configPath, "utf8"));
const inputDir = resolve(projectRoot, config.inputDir ?? "screenshots");
const outputDir = resolve(projectRoot, config.outputDir ?? join(inputDir, "redacted"));

mkdirSync(outputDir, { recursive: true });

if (!Array.isArray(config.images)) throw new Error("config.images debe ser un array");

for (const entry of config.images) {
  const regions = entry.regions ?? [];
  if (regions.length === 0 && !config.resize) {
    console.log(`skip  ${entry.file} (sin regiones)`);
    continue;
  }
  const candidate = isAbsolute(entry.file) ? entry.file : join(inputDir, entry.file);
  const input = existsSync(candidate) ? candidate : resolve(projectRoot, entry.file);
  let image = decodePng(readFileSync(input));
  const count = redact(image, regions, config);
  if (config.resize) {
    image = fitToCanvas(
      image,
      config.resize.width,
      config.resize.height,
      config.resize.background ?? "#000000"
    );
  }
  const name = basename(entry.file);
  const output = join(outputDir, name);
  writeFileSync(output, encodePng(image));
  console.log(`ok    ${name}  (${count} regiones, ${image.width}x${image.height})`);
}

console.log(`\nSalida en ${outputDir}`);