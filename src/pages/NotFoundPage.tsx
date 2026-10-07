import React from 'react';
import { Link } from 'react-router-dom';
import usePageTitle from '../hooks/usePageTitle';

const NotFoundPage: React.FC = () => {
  usePageTitle('Không tìm thấy trang');
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <div className="max-w-md text-center">
        <p className="text-6xl font-bold text-blue-600">404</p>
        <h1 className="mt-4 text-xl font-semibold text-gray-800">Không tìm thấy trang</h1>
        <p className="mt-2 text-sm text-gray-600">Đường dẫn bạn mở không tồn tại hoặc đã được chuyển đi.</p>
        <Link to="/admin" className="mt-6 inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700">
          Về trang tổng quan
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;
