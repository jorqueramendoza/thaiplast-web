import fs from 'node:fs';
import { spawn } from 'node:child_process';
import path from 'node:path';

const preview = process.argv.includes('--preview');
const config = JSON.parse(fs.readFileSync('wrangler.jsonc', 'utf8'));
const selected = preview ? config.env?.preview : config;
if (!selected?.d1_databases?.[0]?.database_id || selected.d1_databases[0].database_id.startsWith('00000000-')) throw new Error('Configura el ID real de D1. Consulta docs/DEPLOYMENT.md.');
if (!selected.vars?.ACCESS_TEAM_DOMAIN || !selected.vars?.ACCESS_AUD) throw new Error('Configura Cloudflare Access antes de publicar el administrador.');
const deployment = JSON.parse(fs.readFileSync('.wrangler/deploy/config.json', 'utf8'));
const generatedPath = path.resolve('.wrangler/deploy', deployment.configPath);
const generated = JSON.parse(fs.readFileSync(generatedPath, 'utf8'));
if (generated.name !== selected.name) throw new Error(preview ? 'Ejecuta npm run build:preview antes de publicar preview.' : 'Ejecuta npm run build antes de publicar producción.');
const child = spawn(process.execPath, ['node_modules/wrangler/bin/wrangler.js', 'deploy', '--config', generatedPath], { stdio: 'inherit' });
child.on('exit', code => process.exit(code || 0));
