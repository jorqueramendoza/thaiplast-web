import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';

const require = createRequire(import.meta.url);
const manifest = require.resolve('astro/package.json');
const entry = JSON.parse(fs.readFileSync(manifest, 'utf8')).bin.astro;
const child = spawn(process.execPath, [path.resolve(path.dirname(manifest), entry), 'build'], { stdio: 'inherit', env: { ...process.env, CLOUDFLARE_ENV: 'preview' } });
child.on('exit', code => process.exit(code || 0));
