import api from './api';
import { ApiResponse } from '../types';
import { Role } from '../utils/roles';

export interface ManagedUser {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: Role;
  status: 'active' | 'inactive';
  last_login?: string | null;
  created_at?: string;
}

export interface NewUserInput {
  username: string;
  password: string;
  email: string;
  full_name: string;
  role: Role;
}

const messageOf = (error: any, fallback: string): Error =>
  new Error(error?.response?.data?.message || fallback);

/** Quản lý tài khoản (chỉ admin; backend kiểm tra lại quyền). */
export const userService = {
  async getUsers(): Promise<ManagedUser[]> {
    try {
      const response = await api.get<ApiResponse<ManagedUser[]>>('/users');
      return response.data.data;
    } catch (error: any) {
      throw messageOf(error, 'Không thể tải danh sách tài khoản');
    }
  },

  async createUser(input: NewUserInput): Promise<void> {
    try {
      await api.post('/users', input);
    } catch (error: any) {
      throw messageOf(error, 'Không thể tạo tài khoản');
    }
  },

  async updateUser(id: number, data: Partial<Pick<ManagedUser, 'role' | 'status' | 'full_name' | 'email'>>): Promise<void> {
    try {
      await api.put(`/users/${id}`, data);
    } catch (error: any) {
      throw messageOf(error, 'Không thể cập nhật tài khoản');
    }
  },

  async deleteUser(id: number): Promise<void> {
    try {
      await api.delete(`/users/${id}`);
    } catch (error: any) {
      throw messageOf(error, 'Không thể xóa tài khoản');
    }
  },
};
