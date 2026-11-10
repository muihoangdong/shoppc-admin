/** Small RFC 4180 CSV reader: quoted commas, escaped quotes and CRLF/multiline cells. */
export function parseProductCsv(source: string): Record<string, string>[] {
  const text = source.replace(/^\uFEFF/, '');
  const table: string[][] = [];
  let row: string[] = [], cell = '', quoted = false, closed = false;
  const pushRow = () => { row.push(cell); if (row.some((v) => v.trim())) table.push(row); row = []; cell = ''; closed = false; };
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (ch === '"') { quoted = false; closed = true; }
      else cell += ch;
    } else if (ch === '"') {
      if (cell || closed) throw new Error('Dấu ngoặc kép không hợp lệ trong CSV');
      quoted = true;
    } else if (ch === ',') { row.push(cell); cell = ''; closed = false; }
    else if (ch === '\r' || ch === '\n') { if (ch === '\r' && text[i + 1] === '\n') i++; pushRow(); }
    else { if (closed) throw new Error('Ký tự thừa sau dấu ngoặc kép'); cell += ch; }
  }
  if (quoted) throw new Error('CSV thiếu dấu ngoặc kép đóng');
  if (cell || row.length) pushRow();
  if (table.length < 2) throw new Error('File cần dòng tiêu đề và ít nhất một sản phẩm');
  const headers = table.shift()!.map((v) => v.trim().toLowerCase());
  if (new Set(headers).size !== headers.length || headers.some((h) => !h)) throw new Error('Tên cột trống hoặc bị trùng');
  const required = ['sku', 'name', 'category_id', 'price', 'stock'];
  if (required.some((h) => !headers.includes(h))) throw new Error(`Thiếu cột bắt buộc: ${required.filter((h) => !headers.includes(h)).join(', ')}`);
  if (table.length > 500) throw new Error('Mỗi lần nhập tối đa 500 sản phẩm');
  return table.map((cells, i) => {
    if (cells.length !== headers.length) throw new Error(`Dòng ${i + 2} không có đúng ${headers.length} cột`);
    return Object.fromEntries(headers.map((h, index) => [h, cells[index]]));
  });
}

export const PRODUCT_CSV_TEMPLATE = '\uFEFFid,sku,name,category_id,brand_id,spec_template_id,price,stock,warranty_months,serial_required,description,image_url,image_urls,specs\r\n,CPU-DEMO,CPU mẫu (sửa trước khi nhập),1,,,3500000,0,36,0,,,[],{}\r\n';

export function downloadBlob(blob: Blob, name: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url; link.download = name;
  document.body.appendChild(link); link.click(); link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
