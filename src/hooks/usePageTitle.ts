import { useEffect } from 'react';

/** Đặt tiêu đề tab trình duyệt theo từng trang (dễ phân biệt khi mở nhiều tab). */
const usePageTitle = (title: string): void => {
  useEffect(() => {
    const previous = document.title;
    document.title = `${title} · Shoppc Admin`;
    return () => {
      document.title = previous;
    };
  }, [title]);
};

export default usePageTitle;
