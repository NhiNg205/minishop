// src/components/AdminDashboard.jsx
// ✨ MỚI: Giao diện quản trị - dùng lại các API CRUD sản phẩm + quản lý trạng thái đơn hàng
// vốn đã có sẵn ở backend nhưng trước đây phải gọi tay qua Postman.
// Chỉ nên render component này khi đã xác nhận authUser.role === 'admin' (App.jsx tự kiểm tra trước khi mount).
import { useState, useEffect, useCallback } from 'react';
import api from '../api';

const EMPTY_FORM = {
  name: '', price: '', img: '', description: '',
  stock_quantity: 0, category: '', discount_rate: 0, original_price: ''
};

const ORDER_STATUS_LABELS = {
  pending: 'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  shipping: 'Đang giao hàng',
  delivered: 'Đã giao thành công',
  cancelled: 'Đã hủy'
};

export default function AdminDashboard({ onBack, onNotify }) {
  const [tab, setTab] = useState('products'); // 'products' | 'orders'

  // --- State cho tab Sản phẩm ---
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null); // null = đang thêm mới, có giá trị = đang sửa
  const [form, setForm] = useState(EMPTY_FORM);
  const [formSubmitting, setFormSubmitting] = useState(false);

  // --- State cho tab Đơn hàng ---
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  const notify = (type, message) => {
    if (onNotify) onNotify(type, message);
  };

  const fetchProducts = useCallback(async () => {
    setProductsLoading(true);
    try {
      const res = await api.get('/products', { params: { limit: 100 } });
      setProducts(res.data.data || []);
    } catch (err) {
      notify('error', err.response?.data?.message || 'Không tải được danh sách sản phẩm.');
    } finally {
      setProductsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchOrders = useCallback(async () => {
    setOrdersLoading(true);
    try {
      const res = await api.get('/orders', { params: { limit: 50, ...(statusFilter ? { status: statusFilter } : {}) } });
      setOrders(res.data.data || []);
    } catch (err) {
      notify('error', err.response?.data?.message || 'Không tải được danh sách đơn hàng.');
    } finally {
      setOrdersLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);
  useEffect(() => { if (tab === 'orders') fetchOrders(); }, [tab, fetchOrders]);

  const openCreateForm = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEditForm = (product) => {
    setEditingId(product.id);
    setForm({
      name: product.name || '',
      price: product.price ?? '',
      img: product.img || '',
      description: product.description || '',
      stock_quantity: product.stock_quantity ?? 0,
      category: product.category || '',
      discount_rate: product.discount_rate ?? 0,
      original_price: product.original_price ?? ''
    });
    setShowForm(true);
  };

  const handleFormChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormSubmitting(true);
    // Chuẩn hóa dữ liệu: các trường số phải là number thật (không phải string) để khớp validate ở backend
    const payload = {
      name: form.name.trim(),
      price: parseInt(form.price, 10),
      img: form.img.trim() || null,
      description: form.description.trim() || null,
      stock_quantity: parseInt(form.stock_quantity, 10) || 0,
      category: form.category.trim() || null,
      discount_rate: parseInt(form.discount_rate, 10) || 0,
      original_price: form.original_price === '' ? null : parseInt(form.original_price, 10)
    };

    try {
      if (editingId) {
        await api.put(`/products/${editingId}`, payload);
        notify('success', `Đã cập nhật sản phẩm "${payload.name}".`);
      } else {
        await api.post('/products', payload);
        notify('success', `Đã thêm sản phẩm "${payload.name}".`);
      }
      setShowForm(false);
      fetchProducts();
    } catch (err) {
      notify('error', err.response?.data?.message || 'Không thể lưu sản phẩm. Vui lòng kiểm tra lại dữ liệu.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDelete = async (product) => {
    if (!window.confirm(`Xóa sản phẩm "${product.name}"? Hành động này không thể hoàn tác.`)) return;
    try {
      await api.delete(`/products/${product.id}`);
      notify('success', `Đã xóa sản phẩm "${product.name}".`);
      fetchProducts();
    } catch (err) {
      notify('error', err.response?.data?.message || 'Không thể xóa sản phẩm.');
    }
  };

  const handleStatusChange = async (order, newStatus) => {
    try {
      await api.patch(`/orders/${order.order_code}/status`, { status: newStatus });
      setOrders((prev) => prev.map((o) => (o.order_code === order.order_code ? { ...o, status: newStatus } : o)));
      notify('success', `Đã cập nhật đơn ${order.order_code} → "${ORDER_STATUS_LABELS[newStatus]}".`);
    } catch (err) {
      notify('error', err.response?.data?.message || 'Không thể cập nhật trạng thái đơn hàng.');
    }
  };

  return (
    <main className="max-w-6xl mx-auto px-6 py-8 animate-fadeIn">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl font-black text-gray-800">Trang Quản Trị</h1>
          <p className="text-xs text-gray-400 mt-1">Quản lý sản phẩm và đơn hàng của cửa hàng</p>
        </div>
        <button onClick={onBack} className="text-xs font-bold text-gray-500 hover:text-black uppercase">← Về trang chủ</button>
      </div>

      {/* TAB CHUYỂN ĐỔI */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        <button
          onClick={() => setTab('products')}
          className={`px-4 py-2 text-xs font-bold uppercase border-b-2 transition-colors ${tab === 'products' ? 'border-black text-black' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
        >
          Sản phẩm ({products.length})
        </button>
        <button
          onClick={() => setTab('orders')}
          className={`px-4 py-2 text-xs font-bold uppercase border-b-2 transition-colors ${tab === 'orders' ? 'border-black text-black' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
        >
          Đơn hàng
        </button>
      </div>

      {/* ================= TAB SẢN PHẨM ================= */}
      {tab === 'products' && (
        <div>
          <div className="flex justify-end mb-4">
            <button onClick={openCreateForm} className="bg-black text-white text-xs font-bold uppercase px-4 py-2.5 rounded-xl hover:bg-gray-800 transition-colors">
              + Thêm sản phẩm
            </button>
          </div>

          {showForm && (
            <form onSubmit={handleFormSubmit} className="bg-gray-50 border border-gray-200 rounded-2xl p-5 mb-6 grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Tên sản phẩm *</label>
                <input required value={form.name} onChange={(e) => handleFormChange('name', e.target.value)} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Giá bán (đ) *</label>
                <input required type="number" min="1" value={form.price} onChange={(e) => handleFormChange('price', e.target.value)} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Tồn kho</label>
                <input type="number" min="0" value={form.stock_quantity} onChange={(e) => handleFormChange('stock_quantity', e.target.value)} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs" />
              </div>
              <div className="col-span-2">
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Ảnh (URL)</label>
                <input value={form.img} onChange={(e) => handleFormChange('img', e.target.value)} placeholder="https://..." className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs" />
              </div>
              <div className="col-span-2">
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Mô tả</label>
                <textarea value={form.description} onChange={(e) => handleFormChange('description', e.target.value)} rows={2} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Danh mục</label>
                <input value={form.category} onChange={(e) => handleFormChange('category', e.target.value)} placeholder="Thiết Bị Công Nghệ..." className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Giảm giá (%)</label>
                <input type="number" min="0" max="100" value={form.discount_rate} onChange={(e) => handleFormChange('discount_rate', e.target.value)} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs" />
              </div>
              <div className="col-span-2">
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Giá gốc (đ) — chỉ điền nếu có giảm giá</label>
                <input type="number" min="1" value={form.original_price} onChange={(e) => handleFormChange('original_price', e.target.value)} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs" />
              </div>

              <div className="col-span-2 flex gap-2 justify-end pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-xs font-bold uppercase text-gray-500 hover:text-black">Hủy</button>
                <button type="submit" disabled={formSubmitting} className="px-5 py-2 bg-black text-white text-xs font-bold uppercase rounded-xl hover:bg-gray-800 disabled:opacity-50">
                  {formSubmitting ? 'Đang lưu...' : (editingId ? 'Lưu thay đổi' : 'Thêm sản phẩm')}
                </button>
              </div>
            </form>
          )}

          {productsLoading ? (
            <p className="text-xs text-gray-400">Đang tải danh sách sản phẩm...</p>
          ) : (
            <div className="overflow-x-auto border border-gray-100 rounded-2xl">
              <table className="w-full text-xs">
                <thead className="bg-gray-50 text-gray-400 uppercase text-[10px]">
                  <tr>
                    <th className="text-left px-4 py-3">Sản phẩm</th>
                    <th className="text-left px-4 py-3">Danh mục</th>
                    <th className="text-right px-4 py-3">Giá</th>
                    <th className="text-right px-4 py-3">Tồn kho</th>
                    <th className="text-right px-4 py-3">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => (
                    <tr key={p.id} className="border-t border-gray-100">
                      <td className="px-4 py-3 font-bold text-gray-700">{p.name}</td>
                      <td className="px-4 py-3 text-gray-500">{p.category || '—'}</td>
                      <td className="px-4 py-3 text-right">{Number(p.price).toLocaleString('vi-VN')}đ</td>
                      <td className="px-4 py-3 text-right">{p.stock_quantity}</td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => openEditForm(p)} className="text-blue-600 hover:underline mr-3">Sửa</button>
                        <button onClick={() => handleDelete(p)} className="text-red-600 hover:underline">Xóa</button>
                      </td>
                    </tr>
                  ))}
                  {products.length === 0 && (
                    <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-400">Chưa có sản phẩm nào.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ================= TAB ĐƠN HÀNG ================= */}
      {tab === 'orders' && (
        <div>
          <div className="flex justify-end mb-4">
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="text-xs border border-gray-200 rounded-lg px-3 py-2">
              <option value="">Tất cả trạng thái</option>
              {Object.entries(ORDER_STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          {ordersLoading ? (
            <p className="text-xs text-gray-400">Đang tải danh sách đơn hàng...</p>
          ) : (
            <div className="overflow-x-auto border border-gray-100 rounded-2xl">
              <table className="w-full text-xs">
                <thead className="bg-gray-50 text-gray-400 uppercase text-[10px]">
                  <tr>
                    <th className="text-left px-4 py-3">Mã đơn</th>
                    <th className="text-left px-4 py-3">Khách hàng</th>
                    <th className="text-right px-4 py-3">Tổng tiền</th>
                    <th className="text-left px-4 py-3">Ngày đặt</th>
                    <th className="text-right px-4 py-3">Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o.id} className="border-t border-gray-100">
                      <td className="px-4 py-3 font-mono text-gray-700">{o.order_code}</td>
                      <td className="px-4 py-3">{o.customer_name}</td>
                      <td className="px-4 py-3 text-right">{Number(o.total_price).toLocaleString('vi-VN')}đ</td>
                      <td className="px-4 py-3 text-gray-500">{new Date(o.created_at).toLocaleString('vi-VN')}</td>
                      <td className="px-4 py-3 text-right">
                        <select
                          value={o.status}
                          onChange={(e) => handleStatusChange(o, e.target.value)}
                          className="text-xs border border-gray-200 rounded-lg px-2 py-1"
                        >
                          {Object.entries(ORDER_STATUS_LABELS).map(([value, label]) => (
                            <option key={value} value={value}>{label}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                  {orders.length === 0 && (
                    <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-400">Không có đơn hàng nào.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
