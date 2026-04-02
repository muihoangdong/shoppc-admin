/**
 * Định dạng số tiền sang VND
 * @param price - Số tiền cần định dạng
 * @returns Chuỗi đã định dạng (VD: 1,000,000đ)
 */
export const formatPrice = (price: number): string => {
  if (isNaN(price) || price === null || price === undefined) {
    return '0đ';
  }
  
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
};

/**
 * Định dạng số với dấu phân cách hàng nghìn
 * @param num - Số cần định dạng
 * @returns Chuỗi đã định dạng (VD: 1,000,000)
 */
export const formatNumber = (num: number): string => {
  if (isNaN(num) || num === null || num === undefined) {
    return '0';
  }
  
  return new Intl.NumberFormat('vi-VN').format(num);
};

/**
 * Định dạng ngày tháng
 * @param date - Ngày cần định dạng (Date object hoặc string)
 * @param format - Định dạng mong muốn (default: 'dd/MM/yyyy')
 * @returns Chuỗi ngày đã định dạng
 */
export const formatDate = (date: Date | string, format: string = 'dd/MM/yyyy'): string => {
  if (!date) return '';
  
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear().toString();
  const hours = d.getHours().toString().padStart(2, '0');
  const minutes = d.getMinutes().toString().padStart(2, '0');
  const seconds = d.getSeconds().toString().padStart(2, '0');
  
  return format
    .replace('dd', day)
    .replace('MM', month)
    .replace('yyyy', year)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds);
};

/**
 * Định dạng ngày giờ đầy đủ
 * @param date - Ngày cần định dạng
 * @returns Chuỗi ngày giờ (VD: 01/01/2024 14:30:00)
 */
export const formatDateTime = (date: Date | string): string => {
  return formatDate(date, 'dd/MM/yyyy HH:mm:ss');
};

/**
 * Định dạng ngày ngắn gọn
 * @param date - Ngày cần định dạng
 * @returns Chuỗi ngày (VD: 01/01/2024)
 */
export const formatShortDate = (date: Date | string): string => {
  return formatDate(date, 'dd/MM/yyyy');
};

/**
 * Cắt ngắn văn bản
 * @param text - Văn bản cần cắt
 * @param maxLength - Độ dài tối đa
 * @returns Văn bản đã cắt (VD: "Văn bản dài..." )
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

/**
 * Định dạng phần trăm
 * @param value - Giá trị cần định dạng
 * @param decimals - Số chữ số thập phân
 * @returns Chuỗi phần trăm (VD: 25.5%)
 */
export const formatPercent = (value: number, decimals: number = 0): string => {
  if (isNaN(value)) return '0%';
  return `${value.toFixed(decimals)}%`;
};

/**
 * Định dạng số điện thoại Việt Nam
 * @param phone - Số điện thoại cần định dạng
 * @returns Số điện thoại đã định dạng (VD: 090 123 4567)
 */
export const formatPhone = (phone: string): string => {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return cleaned.replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3');
  }
  if (cleaned.length === 11) {
    return cleaned.replace(/(\d{4})(\d{3})(\d{4})/, '$1 $2 $3');
  }
  return phone;
};

/**
 * Định dạng mã đơn hàng
 * @param code - Mã đơn hàng
 * @returns Mã đã định dạng (VD: #ORD-001)
 */
export const formatOrderCode = (code: string): string => {
  if (!code) return '';
  return code.startsWith('#') ? code : `#${code}`;
};

/**
 * Định dạng tên sản phẩm (viết hoa chữ cái đầu)
 * @param name - Tên sản phẩm
 * @returns Tên đã định dạng
 */
export const formatProductName = (name: string): string => {
  if (!name) return '';
  return name
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * Định dạng số lượng (thêm đơn vị)
 * @param quantity - Số lượng
 * @param unit - Đơn vị (default: 'sản phẩm')
 * @returns Chuỗi đã định dạng (VD: 10 sản phẩm)
 */
export const formatQuantity = (quantity: number, unit: string = 'sản phẩm'): string => {
  if (isNaN(quantity)) return `0 ${unit}`;
  return `${formatNumber(quantity)} ${unit}`;
};

/**
 * Định dạng kích thước file
 * @param bytes - Kích thước tính bằng bytes
 * @returns Chuỗi đã định dạng (VD: 1.5 MB)
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Định dạng thời gian tương đối (VD: 5 phút trước)
 * @param date - Ngày cần tính
 * @returns Chuỗi thời gian tương đối
 */
export const formatRelativeTime = (date: Date | string): string => {
  const now = new Date();
  const past = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return `${diffInSeconds} giây trước`;
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} phút trước`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} giờ trước`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) {
    return `${diffInDays} ngày trước`;
  }
  
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths} tháng trước`;
  }
  
  const diffInYears = Math.floor(diffInMonths / 12);
  return `${diffInYears} năm trước`;
};

/**
 * Định dạng trạng thái đơn hàng
 * @param status - Trạng thái đơn hàng
 * @returns Tên trạng thái tiếng Việt
 */
export const formatOrderStatus = (status: string): string => {
  const statusMap: Record<string, string> = {
    pending: 'Chờ xử lý',
    processing: 'Đang xử lý',
    completed: 'Hoàn thành',
    cancelled: 'Đã hủy',
    shipped: 'Đã giao hàng',
    delivered: 'Đã nhận hàng',
  };
  return statusMap[status] || status;
};

/**
 * Định dạng phương thức thanh toán
 * @param method - Phương thức thanh toán
 * @returns Tên phương thức tiếng Việt
 */
export const formatPaymentMethod = (method: string): string => {
  const methodMap: Record<string, string> = {
    cod: 'Thanh toán khi nhận hàng',
    banking: 'Chuyển khoản ngân hàng',
    momo: 'Ví MoMo',
    zalopay: 'ZaloPay',
    vnpay: 'VNPay',
  };
  return methodMap[method] || method;
};

/**
 * Định dạng trạng thái thanh toán
 * @param status - Trạng thái thanh toán
 * @returns Tên trạng thái tiếng Việt
 */
export const formatPaymentStatus = (status: string): string => {
  const statusMap: Record<string, string> = {
    pending: 'Chưa thanh toán',
    paid: 'Đã thanh toán',
    failed: 'Thanh toán thất bại',
    refunded: 'Đã hoàn tiền',
  };
  return statusMap[status] || status;
};

/**
 * Định dạng loại sản phẩm
 * @param type - Loại sản phẩm
 * @returns Tên loại tiếng Việt
 */
export const formatProductType = (type: string): string => {
  const typeMap: Record<string, string> = {
    pc: 'Máy tính',
    component: 'Linh kiện',
    peripheral: 'Phụ kiện',
  };
  return typeMap[type] || type;
};

/**
 * Định dạng mã giảm giá
 * @param code - Mã giảm giá
 * @returns Mã đã định dạng
 */
export const formatDiscountCode = (code: string): string => {
  if (!code) return '';
  return code.toUpperCase();
};

/**
 * Định dạng địa chỉ đầy đủ
 * @param address - Địa chỉ
 * @param ward - Phường/xã
 * @param district - Quận/huyện
 * @param city - Thành phố
 * @returns Địa chỉ đầy đủ
 */
export const formatFullAddress = (
  address: string,
  ward?: string,
  district?: string,
  city?: string
): string => {
  const parts = [address, ward, district, city].filter(Boolean);
  return parts.join(', ');
};

// ==================== HÀM BỔ SUNG ====================

/**
 * Định dạng số thập phân
 * @param value - Giá trị cần định dạng
 * @param decimals - Số chữ số thập phân
 * @returns Chuỗi đã định dạng
 */
export const formatDecimal = (value: number, decimals: number = 2): string => {
  if (isNaN(value)) return '0';
  return value.toFixed(decimals);
};

/**
 * Định dạng số có đơn vị (K, M, B)
 * @param num - Số cần định dạng
 * @returns Chuỗi đã định dạng (VD: 1.5K, 2.3M, 1.2B)
 */
export const formatCompactNumber = (num: number): string => {
  if (num < 1000) return num.toString();
  if (num < 1000000) return (num / 1000).toFixed(1) + 'K';
  if (num < 1000000000) return (num / 1000000).toFixed(1) + 'M';
  return (num / 1000000000).toFixed(1) + 'B';
};

/**
 * Định dạng thời gian (HH:MM:SS)
 * @param seconds - Số giây
 * @returns Chuỗi thời gian đã định dạng
 */
export const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Định dạng ngày theo ngôn ngữ (Việt Nam)
 * @param date - Ngày cần định dạng
 * @returns Chuỗi ngày đã định dạng (VD: Thứ 2, 01/01/2024)
 */
export const formatDateWithWeekday = (date: Date | string): string => {
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  
  const weekdays = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
  const weekday = weekdays[d.getDay()];
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  
  return `${weekday}, ${day}/${month}/${year}`;
};

/**
 * Rút gọn số (thay thế số 0 cuối)
 * @param num - Số cần rút gọn
 * @returns Chuỗi đã rút gọn (VD: 1,000,000 -> 1tr)
 */
export const formatShortNumber = (num: number): string => {
  if (num >= 1000000000) return (num / 1000000000).toFixed(1) + ' tỷ';
  if (num >= 1000000) return (num / 1000000).toFixed(1) + ' tr';
  if (num >= 1000) return (num / 1000).toFixed(1) + ' k';
  return num.toString();
};

// Export default cho dễ dùng
export default {
  formatPrice,
  formatNumber,
  formatDate,
  formatDateTime,
  formatShortDate,
  truncateText,
  formatPercent,
  formatPhone,
  formatOrderCode,
  formatProductName,
  formatQuantity,
  formatFileSize,
  formatRelativeTime,
  formatOrderStatus,
  formatPaymentMethod,
  formatPaymentStatus,
  formatProductType,
  formatDiscountCode,
  formatFullAddress,
  formatDecimal,
  formatCompactNumber,
  formatDuration,
  formatDateWithWeekday,
  formatShortNumber,
};