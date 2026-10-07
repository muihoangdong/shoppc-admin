import React from 'react';

interface State {
  hasError: boolean;
}

/** Chặn lỗi hiển thị bất ngờ để không bị trắng màn hình; cho người dùng tải lại trang. */
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error('UI error:', error);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="max-w-md rounded-2xl bg-white p-8 text-center shadow">
          <h1 className="text-xl font-bold text-gray-800">Đã xảy ra lỗi hiển thị</h1>
          <p className="mt-2 text-sm text-gray-600">Trang gặp sự cố ngoài ý muốn. Dữ liệu của bạn không bị ảnh hưởng.</p>
          <div className="mt-6 flex justify-center gap-3">
            <button
              onClick={() => window.location.reload()}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
            >
              Tải lại trang
            </button>
            <a href="/admin" className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
              Về tổng quan
            </a>
          </div>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
