import api from './api';
import { ApiResponse } from '../types';

export interface BankOption {
  code: string;
  name: string;
  bin: string;
}

export interface PaymentSettings {
  /** Giá trị đã lưu trong trang quản trị (trống nếu chưa lưu) */
  bank_code: string;
  account_no: string;
  account_name: string;
  /** Tài khoản đang được dùng để tạo mã QR cho khách; source = 'settings' (trang này) hoặc 'env' (file .env) */
  active: { bank_name: string; account_no: string; account_name: string; source: 'settings' | 'env' } | null;
  env_configured: boolean;
  banks: BankOption[];
  /** Có bật SePay tự xác nhận khi tiền về không */
  auto_confirm: boolean;
  /** Mã QR thử 10.000đ của tài khoản đang dùng */
  sample_qr: string | null;
}

export const paymentSettingsService = {
  async get(): Promise<PaymentSettings> {
    return (await api.get<ApiResponse<PaymentSettings>>('/payments/settings')).data.data;
  },
  async save(values: { bank_code: string; account_no: string; account_name: string }): Promise<{ message: string; data: PaymentSettings }> {
    const response = await api.put<ApiResponse<PaymentSettings>>('/payments/settings', values);
    return { message: response.data.message || 'Đã lưu', data: response.data.data };
  },
};
