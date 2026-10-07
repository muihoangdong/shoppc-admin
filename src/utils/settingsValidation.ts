/** Kiểm tra form Cài đặt tài khoản (hàm thuần, dễ kiểm thử). Backend vẫn kiểm tra lại. */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PASSWORD_MIN = 6;
const PASSWORD_MAX = 72;

/** Kiểm tra hồ sơ; trả về thông báo lỗi theo từng ô (rỗng = hợp lệ). */
export const validateProfile = (p: { full_name: string; email: string }) => {
  const errors: { full_name?: string; email?: string } = {};
  const name = p.full_name.trim();
  if (!name) errors.full_name = 'Vui lòng nhập họ tên';
  else if (name.length > 100) errors.full_name = 'Họ tên tối đa 100 ký tự';
  const email = p.email.trim();
  if (!email) errors.email = 'Vui lòng nhập email';
  else if (!EMAIL_RE.test(email) || email.length > 150) errors.email = 'Email không hợp lệ';
  return errors;
};

/** Kiểm tra đổi mật khẩu. */
export const validatePasswordChange = (p: { current_password: string; new_password: string; confirm: string }) => {
  const errors: { current_password?: string; new_password?: string; confirm?: string } = {};
  if (!p.current_password) errors.current_password = 'Vui lòng nhập mật khẩu hiện tại';
  if (p.new_password.length < PASSWORD_MIN) errors.new_password = `Mật khẩu mới phải có ít nhất ${PASSWORD_MIN} ký tự`;
  else if (p.new_password.length > PASSWORD_MAX) errors.new_password = `Mật khẩu mới tối đa ${PASSWORD_MAX} ký tự`;
  else if (p.new_password === p.current_password) errors.new_password = 'Mật khẩu mới phải khác mật khẩu hiện tại';
  if (!errors.new_password && p.confirm !== p.new_password) errors.confirm = 'Mật khẩu nhập lại không khớp';
  return errors;
};

