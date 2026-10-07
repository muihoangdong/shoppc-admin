/** Kiểm tra form sản phẩm ở phía trình duyệt (backend vẫn kiểm tra lại đầy đủ). Hàm thuần, không phụ thuộc React. */

export interface SpecRow {
  key: string;
  value: string;
}

export interface ProductFormValues {
  name: string;
  categoryId: string; // '' hoặc '0' = chưa chọn
  price: string;
  stock: string;
  imageUrl: string;
  description: string;
  specs: SpecRow[];
}

export type ProductFormErrors = Partial<Record<'name' | 'categoryId' | 'price' | 'stock' | 'imageUrl' | 'description' | 'specs', string>>;

export interface ProductPayload {
  name: string;
  category_id: number;
  price: number;
  stock: number;
  image_url: string;
  description: string;
  specs: Record<string, string>;
  part_type?: string | null;
  build_specs?: Record<string, unknown> | null;
}

export const validateProductForm = (v: ProductFormValues): { errors: ProductFormErrors; payload: ProductPayload | null } => {
  const errors: ProductFormErrors = {};

  const name = v.name.trim();
  if (name.length < 3) errors.name = 'Tên sản phẩm phải có ít nhất 3 ký tự';
  else if (name.length > 255) errors.name = 'Tên sản phẩm tối đa 255 ký tự';

  const categoryId = Number(v.categoryId);
  if (!v.categoryId || !Number.isInteger(categoryId) || categoryId <= 0) errors.categoryId = 'Vui lòng chọn danh mục';

  const priceText = v.price.trim();
  const price = Number(priceText);
  if (!/^\d+$/.test(priceText) || price <= 0 || price > 1e12) {
    errors.price = 'Giá phải là số nguyên VNĐ lớn hơn 0 (chỉ nhập chữ số, ví dụ 15000000)';
  }

  const stockText = v.stock.trim();
  const stock = Number(stockText);
  if (!/^\d+$/.test(stockText) || stock > 1e7) errors.stock = 'Tồn kho phải là số nguyên từ 0 trở lên';

  const imageUrl = v.imageUrl.trim();
  if (imageUrl && (imageUrl.length > 500 || !/^(https?:\/\/|\/)/i.test(imageUrl))) {
    errors.imageUrl = 'Link ảnh phải bắt đầu bằng http://, https:// hoặc / (tối đa 500 ký tự)';
  }

  if (v.description.length > 5000) errors.description = 'Mô tả tối đa 5000 ký tự';

  const specs: Record<string, string> = {};
  for (const row of v.specs) {
    const key = row.key.trim();
    const value = row.value.trim();
    if (!key && !value) continue; // dòng trống: bỏ qua
    if (!key || !value) {
      errors.specs = 'Mỗi thông số cần có cả tên và giá trị (hoặc xóa dòng đó)';
      break;
    }
    if (key.length > 100 || value.length > 500) {
      errors.specs = 'Tên thông số tối đa 100 ký tự, giá trị tối đa 500 ký tự';
      break;
    }
    if (Object.prototype.hasOwnProperty.call(specs, key)) {
      errors.specs = `Thông số "${key}" bị trùng`;
      break;
    }
    specs[key] = value;
  }

  if (Object.keys(errors).length > 0) return { errors, payload: null };
  return {
    errors,
    payload: { name, category_id: categoryId, price, stock, image_url: imageUrl, description: v.description.trim(), specs },
  };
};
