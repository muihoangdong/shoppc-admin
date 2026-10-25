import React from 'react';
import { useLocation } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';

/**
 * Hiệu ứng chuyển trang: trang mới hiện dần + trượt nhẹ lên, kèm thanh tiến trình mảnh trên đỉnh màn hình.
 * Chỉ chạy khi đổi đường dẫn (đổi ?type=, ?search= trên cùng trang thì không). Tắt khi máy bật "giảm chuyển động".
 */
const EASE = [0.22, 1, 0.36, 1] as const;

const PageTransition: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { pathname } = useLocation();
  const reduce = useReducedMotion();

  if (reduce) return <>{children}</>;

  return (
    <>
      <motion.div
        key={`bar-${pathname}`}
        aria-hidden="true"
        className="pointer-events-none fixed left-0 right-0 top-0 z-[70] h-0.5 origin-left bg-gradient-to-r from-sky-400 via-blue-500 to-blue-700"
        initial={{ scaleX: 0, opacity: 1 }}
        animate={{ scaleX: 1, opacity: 0 }}
        transition={{ scaleX: { duration: 0.45, ease: EASE }, opacity: { duration: 0.25, delay: 0.4 } }}
      />
      <motion.div key={pathname} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.32, ease: EASE }}>
        {children}
      </motion.div>
    </>
  );
};

export default PageTransition;
