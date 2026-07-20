// src/components/ErrorBoundary.jsx
// ✨ MỚI: Bắt lỗi runtime (crash) ở bất kỳ đâu trong cây component con,
// tránh màn hình trắng xóa khi có lỗi JavaScript không lường trước.
// Lưu ý: Error Boundary CHỈ bắt được lỗi lúc render/lifecycle của component,
// không bắt được lỗi trong event handler (onClick...) hay trong Promise - những chỗ đó
// vẫn cần try/catch riêng (project đã có, ví dụ trong handleCheckout, handleAuthSubmit).
import { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('💥 Lỗi runtime chưa được xử lý:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
          <div className="bg-white border border-red-200 rounded-2xl shadow-sm p-8 max-w-md text-center">
            <div className="text-red-500 text-5xl mb-4">⚠️</div>
            <h1 className="text-lg font-bold text-gray-800 mb-2">Đã có lỗi xảy ra</h1>
            <p className="text-sm text-gray-500 mb-6">
              Trang gặp sự cố ngoài ý muốn. Vui lòng tải lại trang để tiếp tục mua sắm.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 bg-black text-white text-xs font-bold uppercase rounded-xl hover:bg-gray-800 transition-colors"
            >
              Tải Lại Trang
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
