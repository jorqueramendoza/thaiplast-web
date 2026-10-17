import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { createHash } from 'node:crypto';

fs.mkdirSync('artifacts/drive-originals', { recursive: true });
if (process.stdin.isTTY) process.stdin.setRawMode(true);
const input = readline.createInterface({ input: process.stdin, terminal: false });
for await (const line of input) {
  const files = JSON.parse(line);
  for (const file of files) {
    try {
      if (!/^[a-zA-Z0-9_-]+$/.test(file.id)) throw new Error('ID inválido');
      const target = path.join('artifacts/drive-originals', file.id);
      if (fs.existsSync(target)) continue;
      const url = new URL(file.url);
      if (url.protocol !== 'https:' || !url.hostname.endsWith('.oaiusercontent.com')) throw new Error('Origen no permitido');
      const response = await fetch(url, { signal: AbortSignal.timeout(90000) });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const bytes = Buffer.from(await response.arrayBuffer());
      if (bytes.length > 20 * 1024 * 1024) throw new Error('Archivo demasiado grande');
      fs.writeFileSync(target, bytes);
      console.log(JSON.stringify({ id: file.id, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') }));
    } catch (error) {
      console.log(JSON.stringify({ id: file.id, error: error.message }));
    }
  }
  console.log('BATCH_COMPLETE');
}
