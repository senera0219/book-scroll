#!/usr/bin/env node
// 앱 아이콘 PNG를 만든다(설치 없는 순수 Node). 모양을 바꾸면 다시 실행:
//   node scripts/make-icons.mjs
// 그림: 종이색 바탕 위에 펼친 카드 한 장과 글줄 세 줄.

import { writeFileSync, mkdirSync } from 'node:fs';
import { deflateSync, crc32 } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'assets', 'icons');

const PAPER = [0xf4, 0xef, 0xe4];
const INK = [0x2b, 0x26, 0x22];
const CARD = [0xff, 0xfc, 0xf5];
const ACCENT = [0x8a, 0x5a, 0x2b];

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td) >>> 0);
  return Buffer.concat([len, td, crc]);
}

function png(size, pixel) {
  const raw = Buffer.alloc(size * (size * 3 + 1));
  for (let y = 0; y < size; y++) {
    const row = y * (size * 3 + 1);
    raw[row] = 0;
    for (let x = 0; x < size; x++) {
      const [r, g, b] = pixel(x / size, y / size);
      raw.set([r, g, b], row + 1 + x * 3);
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // RGB
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// scale: 1이면 화면을 꽉 채우는 그림, 작을수록 가운데로 모인다(maskable 안전 영역용).
function drawer(scale) {
  const c = (v) => 0.5 + (v - 0.5) * scale;
  const inBox = (x, y, x0, y0, x1, y1) => x >= c(x0) && x <= c(x1) && y >= c(y0) && y <= c(y1);
  return (x, y) => {
    if (inBox(x, y, 0.26, 0.18, 0.74, 0.82)) {
      // 카드 테두리
      if (!inBox(x, y, 0.28, 0.2, 0.72, 0.8)) return INK;
      if (inBox(x, y, 0.35, 0.32, 0.65, 0.355)) return ACCENT;
      if (inBox(x, y, 0.35, 0.45, 0.65, 0.475)) return INK;
      if (inBox(x, y, 0.35, 0.55, 0.65, 0.575)) return INK;
      if (inBox(x, y, 0.35, 0.65, 0.55, 0.675)) return INK;
      return CARD;
    }
    return PAPER;
  };
}

mkdirSync(OUT, { recursive: true });
writeFileSync(join(OUT, 'icon-192.png'), png(192, drawer(1)));
writeFileSync(join(OUT, 'icon-512.png'), png(512, drawer(1)));
writeFileSync(join(OUT, 'icon-maskable-512.png'), png(512, drawer(0.75)));
process.stdout.write(`아이콘 3개를 ${OUT}에 만들었습니다.\n`);
