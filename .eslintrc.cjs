// Trước đây thiếu file này nên "npm run lint" của admin báo lỗi ngay khi chạy.
module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['dist', 'node_modules', '.eslintrc.cjs'],
  parser: '@typescript-eslint/parser',
  plugins: ['react-refresh'],
  rules: {
    // Dashboard bắt lỗi API dạng `catch (err: any)` ở nhiều nơi (đọc err.message) — cho phép thay vì sửa ~60 chỗ
    '@typescript-eslint/no-explicit-any': 'off',
    // Vài component xuất kèm hàm tiện ích (VD pageWindow, couponState) để test/tái dùng — chỉ ảnh hưởng hot-reload khi dev
    'react-refresh/only-export-components': 'off',
  },
}
