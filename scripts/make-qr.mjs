/**
 * make-qr.mjs — genera un QR del sitio para imprimir (mostrador, bolsas, volantes).
 * Uso: node scripts/make-qr.mjs
 * Apunta a site.url. Salida: public/img/brand/qr-thaiplast.png
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import QRCode from 'qrcode';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const URL = 'https://thaiplast.cl';
const OUT = path.join(ROOT, 'public', 'img', 'brand', 'qr-thaiplast.png');

await QRCode.toFile(OUT, URL, {
  width: 900,
  margin: 2,
  errorCorrectionLevel: 'H', // tolerante a desgaste de impresión
  color: { dark: '#0b1b45', light: '#ffffff' }, // navy de marca sobre blanco
});

console.log(`✔ QR -> ${OUT}  (${URL})`);
