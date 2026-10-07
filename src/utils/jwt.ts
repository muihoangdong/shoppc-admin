/** Đọc hạn dùng (exp, tính bằng giây) từ JWT ở phía trình duyệt. Chỉ để biết khi nào hết phiên; KHÔNG dùng để xác thực. */
export const getTokenExpiry = (token: string | null): number | null => {
  if (!token) return null;
  try {
    const payload = token.split('.')[1];
    const json = decodeURIComponent(
      atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
        .split('')
        .map((c) => `%${c.charCodeAt(0).toString(16).padStart(2, '0')}`)
        .join('')
    );
    const exp = JSON.parse(json).exp;
    return typeof exp === 'number' ? exp : null;
  } catch {
    return null;
  }
};

export const isTokenExpired = (token: string | null, now: number = Date.now()): boolean => {
  const exp = getTokenExpiry(token);
  return exp !== null && exp * 1000 <= now;
};
