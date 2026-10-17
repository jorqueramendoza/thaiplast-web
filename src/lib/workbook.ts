import type { Product } from './catalog-model';

export const workbookColumns = [
  ['id', 'ID', 48], ['version', 'Versión', 10], ['sku', 'SKU', 20], ['nombre', 'Producto', 42], ['categoria', 'Categoría', 28], ['grupo', 'Grupo', 26], ['grupo_nombre', 'Nombre grupo', 28], ['medida', 'Medida/Capacidad', 24], ['presentacion', 'Presentación', 30], ['color', 'Color', 20], ['material', 'Material', 22], ['uso', 'Uso', 25], ['descripcion', 'Descripción', 48], ['precio', 'Precio CLP', 16], ['stock', 'Stock', 12], ['activo', 'Activo', 12], ['iva', 'IVA', 24], ['pagina_catalogo', 'Página catálogo', 15], ['estado_imagenes', 'Estado imágenes', 26], ['imagenes_compartidas', 'Imágenes compartidas', 22], ['carpetas_drive', 'Carpetas Drive', 45], ['notas', 'Notas', 48], ['slug', 'URL', 45], ['imagenes', 'Imágenes (JSON)', 50],
] as const;

export async function createWorkbook(sheets: { name: string; products: Product[] }[]) {
  const { default: ExcelJS } = await import('exceljs');
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'ThaiPlast';
  workbook.created = new Date();
  for (const sheet of sheets) {
    const tab = workbook.addWorksheet(sheet.name, { views: [{ state: 'frozen', ySplit: 1 }] });
    tab.columns = [...workbookColumns.map(([key, header, width]) => ({ key, header, width, hidden: key === 'imagenes' })), { key: 'imagenes_disponibles', header: 'Imágenes disponibles', width: 22, hidden: false }, { key: 'imagenes_faltantes', header: 'Imágenes faltantes', width: 22, hidden: false }];
    for (const product of sheet.products) {
      const row = Object.fromEntries(workbookColumns.map(([key]) => [key, key === 'activo' || key === 'imagenes_compartidas' ? (product[key] ? 'Sí' : 'No') : key === 'imagenes' ? JSON.stringify(product.imagenes) : key === 'carpetas_drive' ? product.carpetas_drive.join('\n') : product[key]]));
      tab.addRow({ ...row, imagenes_disponibles: product.imagenes.length, imagenes_faltantes: Math.max(0, 4 - product.imagenes.length) });
    }
    tab.getRow(1).font = { bold: true };
    tab.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEDEDED' } };
    tab.getRow(1).height = 28;
    tab.autoFilter = { from: 'A1', to: { row: Math.max(1, tab.rowCount), column: workbookColumns.length + 2 } };
    tab.getColumn('precio').numFmt = '"$"#,##0';
    tab.eachRow(row => { row.alignment = { vertical: 'top', wrapText: true }; });
  }
  return workbook;
}

export async function parseWorkbook(bytes: ArrayBuffer) {
  const { default: ExcelJS } = await import('exceljs');
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(bytes);
  const tab = workbook.getWorksheet('Productos') || workbook.worksheets[0];
  if (!tab || tab.rowCount > 1001) throw new Error('La planilla debe contener entre 1 y 1000 productos');
  const headers = new Map<string, number>();
  tab.getRow(1).eachCell((cell, index) => headers.set(String(cell.value), index));
  for (const [, header] of workbookColumns) if (!headers.has(header)) throw new Error(`Falta la columna ${header}. Usa la exportación del panel como plantilla.`);
  const products: Record<string, unknown>[] = [];
  for (let rowNumber = 2; rowNumber <= tab.rowCount; rowNumber++) {
    const row = tab.getRow(rowNumber);
    if (!row.hasValues) continue;
    const product: Record<string, unknown> = {};
    for (const [key, header] of workbookColumns) {
      const value = row.getCell(headers.get(header)!).value;
      if (value && typeof value === 'object') throw new Error(`Fila ${rowNumber}: ${header} debe contener un valor, sin fórmulas ni objetos`);
      if (key === 'precio' || key === 'stock' || key === 'pagina_catalogo' || key === 'version') {
        const text = String(value ?? '').trim();
        if (text && !/^\$?\s*(?:\d+|\d{1,3}(?:\.\d{3})+)$/.test(text)) throw new Error(`Fila ${rowNumber}: ${header} debe ser un número entero`);
        product[key] = text === '' ? key === 'version' ? 0 : null : Number(text.replace(/[$.\s]/g, ''));
      } else if (key === 'activo' || key === 'imagenes_compartidas') {
        const text = String(value ?? '').trim().toLowerCase();
        if (!['sí', 'si', 'no', 'true', 'false', '1', '0'].includes(text)) throw new Error(`Fila ${rowNumber}: ${header} debe ser Sí o No`);
        product[key] = ['sí', 'si', 'true', '1'].includes(text);
      } else if (key === 'imagenes') product[key] = JSON.parse(String(value || '[]'));
      else if (key === 'carpetas_drive') product[key] = String(value || '').split(/\r?\n/).map(value => value.trim()).filter(Boolean);
      else product[key] = String(value ?? '');
    }
    products.push(product);
  }
  return products;
}
