import fs from 'node:fs';
import { spawn } from 'node:child_process';

const preview = process.argv.includes('--preview');
const bucket = preview ? 'thaiplast-products-preview' : 'thaiplast-products';
const products = JSON.parse(fs.readFileSync('data/products.json', 'utf8')).filter(product => product.activo);
const files = new Map();
for (const product of products) for (const image of product.imagenes) for (const source of [image.src, image.thumbnail].filter(Boolean)) {
  if (!/^\/media\/catalog\/[a-f0-9]{64}(?:-thumb)?\.webp$/.test(source)) continue;
  files.set(source.slice('/media/'.length), source.replace('/media/catalog/', 'public/img/products/assets/'));
}
for (const [key, file] of files) {
  await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ['node_modules/wrangler/bin/wrangler.js', 'r2', 'object', 'put', `${bucket}/${key}`, '--file', file, '--content-type', 'image/webp', '--remote'], { stdio: 'inherit' });
    child.on('error', reject); child.on('exit', code => code === 0 ? resolve() : reject(new Error(`No se pudo publicar ${key}`)));
  });
}
console.log(`${files.size} archivos publicados en ${bucket}`);
