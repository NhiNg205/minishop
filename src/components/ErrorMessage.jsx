// src/components/ErrorMessage.jsx
export default function ErrorMessage({ message, onRetry }) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center max-w-md mx-auto">
      <div className="text-red-500 text-4xl mb-3">⚠️</div>
      <h3 className="text-lg font-semibold text-red-700 mb-2">Đã xảy ra lỗi</h3>
      <p className="text-red-600 mb-4">{message || "Không thể tải dữ liệu. Vui lòng thử lại."}</p>

      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
        >
          Thử lại
        </button>
      )}
    </div>
  );
}
