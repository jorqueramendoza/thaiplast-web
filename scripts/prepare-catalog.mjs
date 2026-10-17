import fs from 'node:fs';
import { createHash } from 'node:crypto';
import sharp from 'sharp';
import PDFDocument from 'pdfkit';
import { finished } from 'node:stream/promises';
import { normalizeProduct, imageStatus } from '../src/lib/catalog-model.ts';
import { createWorkbook } from '../src/lib/workbook.ts';

const read = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const save = (file, value) => fs.writeFileSync(file, JSON.stringify(value, null, 2) + '\n');
const normalize = value => String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const slugify = value => normalize(value).replace(/ /g, '-');
const legacyKey = value => normalize(value.replace(/c\/tapa/gi, 'con tapa').replace(/\bgramos\b/gi, 'gr').replace(/\bkilos?\b/gi, 'kg').replace(/\bpl[aá]stic[oa]\b/gi, '').replace(/^bolsa (?=polietileno|polipropileno)/i, '')).replace(/(\d)\s+(cc|kg|gr)\b/g, '$1$2').split(' ').sort().join(' ');
const escapeTable = value => String(value ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ');
const output = 'entregables';
fs.mkdirSync(output, { recursive: true });
fs.mkdirSync('artifacts', { recursive: true });
fs.mkdirSync('public/img/products/assets', { recursive: true });
if (!fs.existsSync('data/products-legacy.json')) fs.copyFileSync('data/products.json', 'data/products-legacy.json');
const legacy = read('data/products-legacy.json');
const definitions = read('data/category-map.json').grupos;
const inventory = read('data/drive-inventory.json');
const folderMap = new Map(inventory.folders.map(folder => [normalize(folder.name), folder]));
const media = fs.existsSync('data/image-manifest.json') ? read('data/image-manifest.json') : {};
const sourceFiles = new Map(inventory.folders.flatMap(folder => (folder.files || []).filter(file => file.mime_type?.startsWith('image/')).map(file => [file.id, file])));
let processed = 0;
for (const [id, file] of sourceFiles) {
  const source = `artifacts/drive-originals/${id}`;
  if (!fs.existsSync(source)) { media[id] = { error: 'No se pudo descargar' }; continue; }
  if (media[id]?.sha256 && fs.existsSync(`public/img/products/assets/${media[id].sha256}.webp`)) continue;
  try {
    const bytes = fs.readFileSync(source);
    const hash = createHash('sha256').update(bytes).digest('hex');
    const metadata = await sharp(bytes, { limitInputPixels: 50000000 }).metadata();
    await sharp(bytes).rotate().resize(1200, 1200, { fit: 'inside', withoutEnlargement: true }).webp({ quality: 84 }).toFile(`public/img/products/assets/${hash}.webp`);
    await sharp(bytes).rotate().resize(240, 240, { fit: 'inside', withoutEnlargement: true }).webp({ quality: 78 }).toFile(`public/img/products/assets/${hash}-thumb.webp`);
    media[id] = { driveId: id, sha256: hash, src: `/media/catalog/${hash}.webp`, thumbnail: `/media/catalog/${hash}-thumb.webp`, originalFile: source, mime: file.mime_type, width: metadata.width, height: metadata.height };
  } catch (error) { media[id] = { error: error.message }; }
  processed++;
  if (processed % 30 === 0) { save('data/image-manifest.json', media); console.log(`Imágenes optimizadas: ${processed}`); }
}
save('data/image-manifest.json', media);

const lines = fs.readFileSync('data/catalogo-oficial.txt', 'utf8').split(/\r?\n/).filter(Boolean);
const products = [];
const sections = [];
const usedLegacy = new Set();
const usedSlugs = new Set(legacy.map(product => product.slug));
let section;
let row = 0;
const now = new Date().toISOString();
for (const line of lines) {
  if (line.startsWith('@')) {
    const [page, title, category, group, iva] = line.slice(1).split('|');
    section = { page: Number(page), title, category, group, iva, products: [] };
    sections.push(section); row = 0; continue;
  }
  if (!section) throw new Error('Fila sin página');
  const fields = line.split('|');
  if (fields.length !== 6) throw new Error(`La fila debe tener seis campos: ${line}`);
  const [name, measure, presentation, price, aliases, notes] = fields;
  if (!/^\d+$/.test(price) || Number(price) <= 0) throw new Error(`Precio inválido: ${line}`);
  row++;
  const rawMatches = legacy.filter(product => !usedLegacy.has(product.id) && product.grupo === section.group && legacyKey(product.nombre) === legacyKey(name));
  const quantity = value => value.match(/\d+/)?.[0];
  const matches = rawMatches.length > 1 ? rawMatches.filter(product => quantity(product.presentacion) === quantity(presentation)) : rawMatches;
  const previous = matches.length === 1 ? matches[0] : undefined;
  if (previous) usedLegacy.add(previous.id);
  const id = previous?.id || `cat2026-p${section.page}-r${row}`;
  let slug = previous?.slug || slugify(name);
  if (!previous) {
    const base = slug;
    let suffix = 2;
    while (usedSlugs.has(slug)) slug = `${base}-${suffix++}`;
    usedSlugs.add(slug);
  }
  const folders = aliases ? aliases.split(';').map(alias => {
    const folder = folderMap.get(normalize(alias));
    if (!folder) throw new Error(`Carpeta desconocida: ${alias}`);
    return folder;
  }) : [];
  const files = folders.flatMap(folder => folder.files || []).filter(file => file.mime_type?.startsWith('image/')).sort((first, second) => {
    const generic = title => /^\d+\.(png|jpe?g|webp)$/i.test(title) ? 1 : 0;
    return generic(first.title) - generic(second.title) || (second.modified_time || '').localeCompare(first.modified_time || '') || first.title.localeCompare(second.title);
  });
  const unique = new Map();
  for (const file of files) if (media[file.id]?.sha256) unique.set(media[file.id].sha256, { src: media[file.id].src, thumbnail: media[file.id].thumbnail, driveId: file.id, sha256: media[file.id].sha256, alt: name });
  const images = [...unique.values()].slice(0, 4);
  const review = /revisar antes de asociar|confirmar material de la fotografía/.test(notes) || folders.some(folder => folder.error) || files.some(file => media[file.id]?.error);
  const group = definitions.find(group => group.slug === section.group);
  let material = '';
  if (/kraft|cartón|papel blanco|polipapel/i.test(name)) material = /kraft/i.test(name) ? 'Kraft' : /cartón/i.test(name) ? 'Cartón' : /polipapel/i.test(name) ? 'Polipapel' : 'Papel';
  if (/polietileno|polipropileno|aluminio|bambú|madera|vinilo|látex|nitrilo|algodón/i.test(name)) material = name.match(/polietileno|polipropileno|aluminio|bambú|madera|vinilo|látex|nitrilo|algodón/i)[0];
  if (/PET/i.test(name)) material = 'PET';
  if (/bombilla.*papel/i.test(name)) material = 'Papel';
  if (/bombilla.*plástica/i.test(name)) material = 'Plástico';
  const color = /\bnegro\b/.test(name) ? 'Negro' : /\bblanco\b/.test(name) ? 'Blanco' : /\brojo\b/.test(name) ? 'Rojo' : '';
  const product = normalizeProduct({ id, sku: previous?.sku || `TP26-${String(section.page).padStart(2, '0')}-${String(row).padStart(2, '0')}`, nombre: name, slug, categoria: section.category, grupo: section.group, grupo_nombre: group?.nombre || section.category, medida: measure, presentacion: presentation, color, material, uso: '', descripcion: `${name}. Presentación: ${presentation}.`, precio: Number(price), imagenes: images, imagen: images[0]?.src || `/img/products/_placeholder/${section.group}.svg`, imagenes_compartidas: /Foto compartida/.test(notes), estado_imagenes: imageStatus(images, review), carpetas_drive: folders.map(folder => folder.url), pagina_catalogo: section.page, iva: section.iva, notas: [notes, unique.size > 4 ? `${unique.size} imágenes distintas en Drive; se publican cuatro.` : ''].filter(Boolean).join(' '), unidad_venta: presentation, stock: null, activo: true, version: 1, fecha_creacion: previous?.fecha_creacion || now, fecha_actualizacion: now });
  products.push(product); section.products.push(product);
}
if (sections.length !== 45 || sections.some((section, index) => section.page !== index + 4)) throw new Error('Deben existir las 45 páginas de productos, de la 4 a la 48');
const inactive = legacy.filter(product => !usedLegacy.has(product.id)).map(product => normalizeProduct({ ...product, activo: false, imagenes: [], notas: 'Registro anterior sin correspondencia inequívoca con el catálogo oficial. Conservado para revisión.', fecha_actualizacion: now }));
const all = [...products, ...inactive];
save('data/products.json', all);
save('data/catalog-reconciliation.json', { generatedAt: now, officialProducts: products.length, legacyRetained: usedLegacy.size, legacyInactive: inactive.length, noImages: products.filter(product => !product.imagenes.length).length, imageStates: Object.fromEntries(['sin_imagenes', 'galeria_incompleta', 'galeria_completa', 'pendiente_verificacion'].map(state => [state, products.filter(product => product.estado_imagenes === state).length])), pages: sections.map(section => ({ page: section.page, title: section.title, products: section.products.length })), unmatchedDriveFolders: inventory.folders.filter(folder => !products.some(product => product.carpetas_drive.includes(folder.url))).map(folder => ({ name: folder.name, url: folder.url })) });

const markdown = ['# Catálogo ThaiPlast 2026', '', 'Fuente oficial: ThaiPlast_Catalogo_2026(1).pdf (49 páginas). Transcripción de las tablas revisada visualmente contra cada página. Las filas que agrupan variantes se desglosan sin alterar sus precios. Las notas explican ambigüedades del original. Los números de página corresponden al orden del PDF, incluyendo portada e índice.', '', '## Página 1 — Portada', '', 'Todo en desechables para tu negocio. Calidad en cada producto. Cercanía que construye confianza. Soluciones que impulsan tu negocio.', '', '## Página 2 — Índice', '', ...sections.map(section => `- Página ${section.page}: ${section.title}.`), '', '## Página 3 — Quiénes somos', '', 'En ThaiPlast acompañamos a emprendedores, cafeterías, restaurantes y negocios gastronómicos con soluciones prácticas de packaging, descartables y artículos esenciales para el día a día. Nos enfocamos en la variedad, la atención cercana y una respuesta ágil para ayudarte a crecer con confianza.', '', 'Creemos que cada detalle cuenta. Por eso ofrecemos productos funcionales, una presentación cuidada y un servicio comprometido con las necesidades reales de tu negocio.', '', 'Cercanía: atención cercana y humana, siempre que la necesites. Variedad: amplia gama de productos para cada tipo de negocio. Compromiso: calidad, presentación y servicio en cada entrega.', ''];
for (const section of sections) {
  markdown.push(`## Página ${section.page} — ${section.title}`, '', `IVA: ${section.iva}.`, '', '| Producto | Medida / capacidad | Presentación | Precio CLP | Notas |', '|---|---|---|---:|---|');
  for (const product of section.products) markdown.push(`| ${[product.nombre, product.medida, product.presentacion, product.precio_formato, product.notas].map(escapeTable).join(' | ')} |`);
  markdown.push('');
}
markdown.push('## Página 49 — Contacto', '', 'Gracias por preferirnos. Acompañamos a tu negocio con soluciones prácticas, variedad y atención cercana.', '', '- WhatsApp: +56 9 5789 6128', '- Correo: thaiplast.spa@gmail.com', '- Instagram: @ThaiPlast', '- Sitio: www.thaiplast.cl', '', 'Esta transcripción conserva datos comerciales y contenido institucional; las ilustraciones y frases decorativas se consultan en el PDF original.', '');
fs.writeFileSync(`${output}/ThaiPlast_Catalogo_2026.md`, markdown.join('\n'));

const workbook = await createWorkbook([{ name: 'Productos', products }, { name: 'Anteriores inactivos', products: inactive }]);
await workbook.xlsx.writeFile(`${output}/ThaiPlast_Productos_2026.xlsx`);
const missing = products.filter(product => !product.imagenes.length);
const incomplete = products.filter(product => product.estado_imagenes === 'galeria_incompleta');
const review = products.filter(product => product.estado_imagenes === 'pendiente_verificacion');
const pending = await createWorkbook([{ name: 'Sin imágenes', products: missing }, { name: 'Galerías incompletas', products: incomplete }, { name: 'Por verificar', products: review }]);
for (const tab of pending.worksheets) {
  tab.getCell(1, 25).value = 'Imágenes disponibles'; tab.getColumn(25).width = 22;
  tab.getCell(1, 26).value = 'Imágenes faltantes'; tab.getColumn(26).width = 22;
  tab.eachRow((row, number) => { if (number > 1) { const images = JSON.parse(String(row.getCell(24).value)); row.getCell(25).value = images.length; row.getCell(26).value = Math.max(0, 4 - images.length); } });
}
await pending.xlsx.writeFile(`${output}/ThaiPlast_Imagenes_Pendientes.xlsx`);

const document = new PDFDocument({ size: 'A4', margin: 44, bufferPages: true, info: { Title: 'ThaiPlast — Productos sin imágenes' } });
const stream = fs.createWriteStream(`${output}/ThaiPlast_Productos_Sin_Imagenes.pdf`); document.pipe(stream);
document.fillColor('#0b1b45').fontSize(23).text('ThaiPlast');
document.fontSize(17).text('Productos sin imágenes'); document.moveDown();
document.fillColor('#333333').fontSize(10).text(`Auditoría: ${now.slice(0, 10)}. Catálogo oficial: ${products.length} variantes.`);
document.text(`${missing.length} variantes sin fotografías asociadas; ${incomplete.length} con galería incompleta; ${review.length} requieren verificación.`);
document.moveDown().text('Se revisaron archivos reales de ambas carpetas de Drive. Las fotografías impresas en el PDF no cuentan como archivos disponibles. Las asociaciones dudosas se indican en Notas y en la hoja Por verificar.');
let category = '';
for (const product of missing) {
  if (document.y > 700) document.addPage();
  if (category !== product.categoria) { category = product.categoria; if (document.y > 655) document.addPage(); document.moveDown().fillColor('#0a3f95').fontSize(12).text(category); }
  if (document.y > 670) document.addPage();
  document.fillColor('#222222').fontSize(10).text(`${product.nombre} — ${product.presentacion}`);
  document.fillColor('#555555').fontSize(8).text(`ID: ${product.id} · PDF: página ${product.pagina_catalogo}${product.estado_imagenes === 'pendiente_verificacion' ? ' · Por verificar' : ''}`);
  if (product.notas) document.text(product.notas);
  document.moveDown(.4);
}
const range = document.bufferedPageRange();
for (let index = 0; index < range.count; index++) { document.switchToPage(index); document.fillColor('#777777').fontSize(8).text(`ThaiPlast · ${index + 1} / ${range.count}`, 44, 795, { lineBreak: false }); }
document.end(); await finished(stream);
fs.writeFileSync('artifacts/catalog-seed.sql', all.map(product => `INSERT OR IGNORE INTO products(id,slug,active,version,data) VALUES(${[product.id, product.slug, product.activo ? 1 : 0, product.version, JSON.stringify(product)].map(value => typeof value === 'number' ? value : `'${value.replace(/'/g, "''")}'`).join(',')});`).join('\n') + '\n');
console.log(JSON.stringify({ products: products.length, inactive: inactive.length, retained: usedLegacy.size, missing: missing.length, incomplete: incomplete.length, review: review.length, mediaErrors: Object.values(media).filter(image => image.error).length }, null, 2));
