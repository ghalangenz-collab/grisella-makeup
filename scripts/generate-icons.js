// Script to generate luxury PWA icons in SVG and PNG formats
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const iconsDir = path.join(__dirname, '..', 'public', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// 1. Generate luxury SVG icon
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FAEDF0"/>
      <stop offset="50%" stop-color="#F5DAE0"/>
      <stop offset="100%" stop-color="#C97A7E"/>
    </linearGradient>
    <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#8C4247"/>
      <stop offset="100%" stop-color="#542528"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="128" fill="url(#bg)"/>
  <circle cx="256" cy="256" r="210" fill="none" stroke="#FFFFFF" stroke-width="4" opacity="0.6"/>
  <circle cx="256" cy="256" r="196" fill="none" stroke="#C97A7E" stroke-width="2" stroke-dasharray="8 6"/>
  
  <!-- Sparkles -->
  <path d="M256 80 L266 115 L301 125 L266 135 L256 170 L246 135 L211 125 L246 115 Z" fill="#C97A7E"/>
  <path d="M370 170 L376 195 L401 201 L376 207 L370 232 L364 207 L339 201 L364 195 Z" fill="#C97A7E" opacity="0.8"/>
  <path d="M140 330 L146 350 L166 356 L146 362 L140 382 L134 362 L114 356 L134 350 Z" fill="#C97A7E" opacity="0.8"/>

  <!-- Monogram G -->
  <text x="256" y="325" font-family="'Playfair Display', serif, Georgia" font-size="210" font-weight="bold" fill="url(#gold)" text-anchor="middle">G</text>
  <text x="256" y="415" font-family="'Plus Jakarta Sans', sans-serif" font-size="34" font-weight="600" fill="#8C4247" letter-spacing="8" text-anchor="middle">GRISELLA</text>
  <text x="256" y="445" font-family="'Plus Jakarta Sans', sans-serif" font-size="20" font-weight="500" fill="#C97A7E" letter-spacing="6" text-anchor="middle">MAKEUP ARTIST</text>
</svg>`;

fs.writeFileSync(path.join(iconsDir, 'icon-512.svg'), svgContent);
fs.writeFileSync(path.join(iconsDir, 'icon-192.svg'), svgContent);
fs.writeFileSync(path.join(iconsDir, 'apple-touch-icon.svg'), svgContent);

// Simple minimal valid PNG builder for fallback PNG files
function createSolidPng(width, height, r, g, b, a = 255) {
  function makeChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const chunkType = Buffer.from(type);
    const chunk = Buffer.concat([chunkType, data]);
    const crc = crc32(chunk);
    const crcBuf = Buffer.alloc(4);
    crcBuf.writeInt32BE(crc);
    return Buffer.concat([len, chunk, crcBuf]);
  }

  function crc32(buf) {
    let crc = -1;
    for (let i = 0; i < buf.length; i++) {
      let byte = buf[i];
      for (let j = 0; j < 8; j++) {
        const bit = (byte ^ crc) & 1;
        crc = (crc >>> 1) ^ (bit ? 0xedb88320 : 0);
        byte >>>= 1;
      }
    }
    return (crc ^ -1) | 0;
  }

  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // Bit depth
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0; // Deflate
  ihdr[11] = 0; // Filter
  ihdr[12] = 0; // Interlace

  // Raw image data: filter byte (0) + width * 4 bytes per row
  const rowLen = 1 + width * 4;
  const raw = Buffer.alloc(rowLen * height);
  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowLen;
    raw[rowOffset] = 0; // Filter type 0
    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      raw[pxOffset] = r;
      raw[pxOffset + 1] = g;
      raw[pxOffset + 2] = b;
      raw[pxOffset + 3] = a;
    }
  }

  const compressed = zlib.deflateSync(raw);
  const idat = makeChunk('IDAT', compressed);
  const iend = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, makeChunk('IHDR', ihdr), idat, iend]);
}

// Brand Rose color RGBA: 201, 122, 126, 255 (#C97A7E)
const png192 = createSolidPng(192, 192, 201, 122, 126);
const png512 = createSolidPng(512, 512, 201, 122, 126);
const applePng = createSolidPng(180, 180, 201, 122, 126);

fs.writeFileSync(path.join(iconsDir, 'icon-192.png'), png192);
fs.writeFileSync(path.join(iconsDir, 'icon-512.png'), png512);
fs.writeFileSync(path.join(iconsDir, 'apple-touch-icon.png'), applePng);
fs.writeFileSync(path.join(__dirname, '..', 'public', 'apple-touch-icon.png'), applePng);

console.log('Icons generated successfully!');
