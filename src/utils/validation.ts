export const validators = {
  // Kiểm tra email hợp lệ
  email: (email: string): boolean => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  },

  // Kiểm tra số điện thoại Việt Nam
  phone: (phone: string): boolean => {
    const regex = /^(0[3|5|7|8|9])+([0-9]{8})$/;
    return regex.test(phone);
  },

  // Kiểm tra giá trị không âm
  nonNegative: (value: number): boolean => {
    return value >= 0;
  },

  // Kiểm tra số lượng hợp lệ
  quantity: (value: number): boolean => {
    return value > 0 && Number.isInteger(value);
  },

  // Kiểm tra tên sản phẩm
  productName: (name: string): boolean => {
    return name.trim().length >= 3 && name.trim().length <= 200;
  },

  // Kiểm tra giá sản phẩm
  productPrice: (price: number): boolean => {
    return price > 0;
  },
};

export const validateProduct = (product: any) => {
  const errors: string[] = [];
  
  if (!validators.productName(product.name)) {
    errors.push('Tên sản phẩm phải từ 3-200 ký tự');
  }
  
  if (!validators.productPrice(product.price)) {
    errors.push('Giá sản phẩm phải lớn hơn 0');
  }
  
  if (!validators.nonNegative(product.stock)) {
    errors.push('Số lượng tồn kho không được âm');
  }
  
  if (!product.category_id) {
    errors.push('Vui lòng chọn danh mục sản phẩm');
  }
  
  return errors;
};

export const validateCategory = (category: any) => {
  const errors: string[] = [];
  
  if (!category.name || category.name.trim().length < 2) {
    errors.push('Tên danh mục phải có ít nhất 2 ký tự');
  }
  
  if (!category.type) {
    errors.push('Vui lòng chọn loại danh mục');
  }
  
  return errors;
};