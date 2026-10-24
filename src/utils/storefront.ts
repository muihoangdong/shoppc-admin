/** Địa chỉ trang cửa hàng (nút "Xem Storefront", link xem sản phẩm, file 3D đặt trong public/models của cửa hàng). */
export const STOREFRONT_URL = (import.meta.env.VITE_STOREFRONT_URL || 'http://localhost:3001').replace(/\/$/, '');

/** Link dạng "/models/x.glb" là file nằm trên trang cửa hàng: đổi thành link đầy đủ để trang admin tải được. */
export const storefrontAsset = (url: string): string => (url.startsWith('/') && !url.startsWith('//') ? `${STOREFRONT_URL}${url}` : url);
