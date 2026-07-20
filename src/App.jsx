import React, { useState, useEffect, useRef } from 'react';
import api from './api';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorMessage from './components/ErrorMessage';
import AdminDashboard from './components/AdminDashboard';

function App() {
  // Trạng thái điều hướng trang: 'home' hoặc 'notifications'
  const [activePage, setActivePage] = useState('home');

  const [products, setProducts] = useState([]); 
  const [notifications, setNotifications] = useState([]); 
  const [cart, setCart] = useState(() => {
    // ✨ MỚI: Đọc giỏ hàng đã lưu từ lần trước (nếu có) để không bị mất khi F5 trang
    try {
      const savedCart = localStorage.getItem('minishop_cart');
      return savedCart ? JSON.parse(savedCart) : [];
    } catch (error) {
      console.error('Không thể đọc giỏ hàng đã lưu, bắt đầu với giỏ hàng trống:', error);
      return [];
    }
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tất Cả Đồ Dùng'); 
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false); 
  const [loading, setLoading] = useState(true);
  const [productsError, setProductsError] = useState(''); // ✨ MỚI: lưu lỗi khi tải sản phẩm thất bại
  const [loadingNotify, setLoadingNotify] = useState(true); 
  const [customerName, setCustomerName] = useState(''); 

  // Trạng thái bật/tắt popup thông báo nhỏ tại Chuông
  const [isNotifyDropdownOpen, setIsNotifyDropdownOpen] = useState(false);

  // Hệ thống thông báo tự chế thay thế cho alert() mặc định
  const [customAlert, setCustomAlert] = useState({ isOpen: false, type: 'info', message: '' });

  // Trạng thái Đăng ký - Đăng nhập
  const [isAuthOpen, setIsAuthOpen] = useState(false); 
  const [authMode, setAuthMode] = useState('login'); 
  
  // Tab hiện tại trong trang thông báo chính thức ('all', 'sale', 'new', 'order')
  const [activeNotifyTab, setActiveNotifyTab] = useState('all');

  // ✨ MỚI: Trạng thái đăng nhập thật - lưu cả token (để gọi API) và thông tin user (để hiển thị)
  // Khôi phục từ localStorage khi tải lại trang để không bị đăng xuất mỗi khi F5
  const [authToken, setAuthToken] = useState(() => localStorage.getItem('minishop_token') || null);
  const [authUser, setAuthUser] = useState(() => {
    try {
      const saved = localStorage.getItem('minishop_user');
      return saved ? JSON.parse(saved) : null;
    } catch (error) {
      return null;
    }
  });
  // Các trường nhập trong form Đăng nhập/Đăng ký (controlled inputs - trước đây form không lưu gì cả)
  const [authName, setAuthName] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authSubmitting, setAuthSubmitting] = useState(false);

  // ✨ MỚI: Sản phẩm đang xem ở trang chi tiết sản phẩm
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [detailQuantity, setDetailQuantity] = useState(1);

  // ✨ MỚI: Trạng thái cho chức năng tra cứu đơn hàng theo mã
  const [orderLookupCode, setOrderLookupCode] = useState('');
  const [orderLookupResult, setOrderLookupResult] = useState(null);
  const [orderLookupError, setOrderLookupError] = useState('');
  const [orderLookupLoading, setOrderLookupLoading] = useState(false);

  const dropdownRef = useRef(null);
  const notifyDropdownRef = useRef(null);

  // Tự động đổi tên trên Tab trình duyệt thành MiniShop khi ứng dụng chạy
  useEffect(() => {
    document.title = "MiniShop";
  }, []);

  // ✨ MỚI: Tự động lưu giỏ hàng vào localStorage mỗi khi có thay đổi (thêm/xóa/sửa số lượng)
  useEffect(() => {
    try {
      localStorage.setItem('minishop_cart', JSON.stringify(cart));
    } catch (error) {
      console.error('Không thể lưu giỏ hàng vào localStorage:', error);
    }
  }, [cart]);

  // ✨ MỚI: Đồng bộ token đăng nhập vào localStorage mỗi khi thay đổi (đăng nhập/đăng xuất)
  useEffect(() => {
    if (authToken) {
      localStorage.setItem('minishop_token', authToken);
    } else {
      localStorage.removeItem('minishop_token');
    }
  }, [authToken]);

  // ✨ MỚI: Đồng bộ thông tin user vào localStorage mỗi khi thay đổi
  useEffect(() => {
    if (authUser) {
      localStorage.setItem('minishop_user', JSON.stringify(authUser));
    } else {
      localStorage.removeItem('minishop_user');
    }
  }, [authUser]);

  // ✨ MỚI: Định dạng thời gian thông báo cho thân thiện, dùng chung cho cả popup nhanh và trang đầy đủ
  const formatNotifyTime = (dateStr) => {
    if (!dateStr) return 'Vừa xong';
    try {
      return new Date(dateStr).toLocaleString('vi-VN', {
        hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit'
      });
    } catch (error) {
      return 'Vừa xong';
    }
  };

  const categories = [
    { name: 'Tất Cả Đồ Dùng' },
    { name: 'Nội Thất & Trang Trí', tag: 'BÁN CHẠY', tagColor: 'bg-red-500' },
    { name: 'Đồ Dùng Nhà Bếp' },
    { name: 'Hộp Đựng & Lưu Trữ' },
    { name: 'Dụng Cụ Học Tập' },
    { name: 'Thiết Bị Công Nghệ' },
    { name: 'Chăm Sóc Cá Nhân' }
  ];

  const quickTabs = [
    { name: 'SẢN PHẨM MỚI', icon: '✨', filterName: 'SẢN PHẨM MỚI' },
    { name: 'NỘI THẤT NHỎ', icon: '🛋️', filterName: 'Nội Thất & Trang Trí' },
    { name: 'DỤNG CỤ BẾP', icon: '🍳', filterName: 'Đồ Dùng Nhà Bếp' },
    { name: 'ĐỒ CÔNG NGHỆ', icon: '🎧', filterName: 'Thiết Bị Công Nghệ' },
    { name: 'CHĂM SÓC NHÀ CỬA', icon: '🧴', filterName: 'Chăm Sóc Cá Nhân' }
  ];

  // Sự kiện đóng các menu khi click ra ngoài vùng hiển thị
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
      if (notifyDropdownRef.current && !notifyDropdownRef.current.contains(event.target)) {
        setIsNotifyDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // LẤY SẢN PHẨM TỪ BACKEND DATABASE
  const fetchProductsFromBackend = async () => {
    try {
      setLoading(true);
      setProductsError(''); // ✨ MỚI: xóa lỗi cũ mỗi lần thử lại
      // Thay thế fetch bằng api.get của Axios
      const firstPage = await api.get('/products', { params: { page: 1, limit: 100 } });
      if (firstPage.data.status === "success") {
        let allProducts = firstPage.data.data;
        const { totalPages } = firstPage.data;

        // ✨ MỚI: Nếu backend báo còn nhiều hơn 1 trang (tương lai có trên 100 sản phẩm),
        // tự động tải nốt các trang còn lại để danh sách sản phẩm luôn đầy đủ, không bị cắt bớt.
        if (totalPages > 1) {
          const remainingPageRequests = [];
          for (let p = 2; p <= totalPages; p++) {
            remainingPageRequests.push(api.get('/products', { params: { page: p, limit: 100 } }));
          }
          const remainingResponses = await Promise.all(remainingPageRequests);
          remainingResponses.forEach(res => {
            if (res.data.status === "success") {
              allProducts = allProducts.concat(res.data.data);
            }
          });
        }

        setProducts(allProducts);
      }
      setLoading(false);
    } catch (error) {
      console.error("Lỗi khi kết nối với backend:", error);
      // ✨ MỚI: Lưu lại thông báo lỗi để hiển thị ErrorMessage kèm nút "Thử lại"
      setProductsError(error.response?.data?.message || 'Không thể tải danh sách sản phẩm. Vui lòng kiểm tra kết nối và thử lại.');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductsFromBackend();
  }, []);

  // TỰ ĐỘNG CẬP NHẬT THÔNG BÁO TỪ DATABASE LÊN WEBSITE
  useEffect(() => {
  const fetchNotificationsFromBackend = async () => {
      try {
        setLoadingNotify(true);
          // Thay thế fetch bằng api.get của Axios
          const response = await api.get('/notifications'); 
          if (response.data.status === "success") {
            setNotifications(response.data.data); 
        } else {
          setNotifications([]);
        }
        setLoadingNotify(false);
      } catch (error) {
        console.error("Chưa kết nối được API thông báo, tạm thời hiển thị trống:", error);
        setLoadingNotify(false);
      }
    };
    fetchNotificationsFromBackend();
    }, []); 

  const addToCart = (product) => {
    const existingItem = cart.find(item => item.id === product.id);
    if (existingItem) {
      setCart(cart.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId, delta) => {
    setCart(prevCart => prevCart
      .map(item => item.id === productId ? { ...item, quantity: item.quantity + delta } : item)
      .filter(item => item.quantity > 0) // ✨ SỬA: Tự động xóa khỏi giỏ nếu số lượng giảm về 0, thay vì kẹt cứng ở mức 1
    );
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      return setCustomAlert({ isOpen: true, type: 'warning', message: 'Hãy thêm sản phẩm vào giỏ trước khi đặt hàng!' });
    }
    if (!customerName.trim()) {
      return setCustomAlert({ isOpen: true, type: 'warning', message: 'Vui lòng nhập tên của bạn trước khi xác nhận đặt hàng!' });
    }

    const orderData = {
      customer_name: customerName,
      items: cart.map(item => ({
        product_id: item.id,
        quantity: item.quantity
      }))
    };

    try {
      // Thay thế fetch bằng api.post của Axios
      const response = await api.post('/orders', orderData);

    if (response.data.status === "success") {
      setCustomAlert({ 
        isOpen: true, 
        type: 'success', 
        message: `🎉 Đặt hàng thành công!\nMã đơn hàng bảo mật của bạn là: ${response.data.order.order_code}`
      });
      setCart([]);
      setCustomerName('');
      setIsCartOpen(false);
    } else {
      setCustomAlert({ 
        isOpen: true, 
        type: 'error', 
        message: response.data.message || 'Lỗi hệ thống: Không thể xử lý đơn hàng.' 
      });
    }
  } catch (error) {
    console.error("Lỗi kết nối đặt hàng:", error);
    // Axios bắt lỗi 400/500 trực tiếp trong catch, đọc thông điệp lỗi từ backend trả về
    const errorMsg = error.response?.data?.message || 'Không thể kết nối tới máy chủ Backend!';
    setCustomAlert({ isOpen: true, type: 'error', message: errorMsg });
  }
};

  // ✨ SỬA: Hàm xử lý khi nhấn nút Đăng nhập / Đăng ký - GIỜ GỌI API THẬT thay vì chỉ hiện thông báo giả
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthSubmitting(true);
    try {
      if (authMode === 'login') {
        const response = await api.post('/auth/login', { email: authEmail, password: authPassword });
        if (response.data.status === 'success') {
          setAuthToken(response.data.token);
          setAuthUser(response.data.user);
          setIsAuthOpen(false);
          setAuthName(''); setAuthEmail(''); setAuthPassword('');
          setCustomAlert({ isOpen: true, type: 'success', message: `Chào mừng trở lại, ${response.data.user.name}!` });
        }
      } else {
        const response = await api.post('/auth/register', { name: authName, email: authEmail, password: authPassword });
        if (response.data.status === 'success') {
          setAuthToken(response.data.token);
          setAuthUser(response.data.user);
          setIsAuthOpen(false);
          setAuthName(''); setAuthEmail(''); setAuthPassword('');
          setCustomAlert({ isOpen: true, type: 'success', message: `Đăng ký thành công! Chào mừng ${response.data.user.name} đến với MiniShop.` });
        }
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Không thể kết nối tới máy chủ. Vui lòng thử lại sau.';
      setCustomAlert({ isOpen: true, type: 'error', message: errorMsg });
    } finally {
      setAuthSubmitting(false);
    }
  };

  // ✨ MỚI: Đăng xuất - xóa token và thông tin user khỏi state (kéo theo xóa khỏi localStorage nhờ useEffect ở trên)
  const handleLogout = () => {
    setAuthToken(null);
    setAuthUser(null);
    setCustomAlert({ isOpen: true, type: 'info', message: 'Bạn đã đăng xuất khỏi tài khoản.' });
  };

  // ✨ MỚI: Mở trang chi tiết cho 1 sản phẩm cụ thể
  const openProductDetail = (product) => {
    setSelectedProduct(product);
    setDetailQuantity(1);
    setActivePage('product-detail');
    window.scrollTo(0, 0);
  };

  // ✨ MỚI: Thêm vào giỏ hàng từ trang chi tiết sản phẩm (có thể chọn số lượng trước khi thêm)
  const addSelectedProductToCart = () => {
    if (!selectedProduct) return;
    const existingItem = cart.find(item => item.id === selectedProduct.id);
    if (existingItem) {
      setCart(cart.map(item => item.id === selectedProduct.id ? { ...item, quantity: item.quantity + detailQuantity } : item));
    } else {
      setCart([...cart, { ...selectedProduct, quantity: detailQuantity }]);
    }
    setCustomAlert({ isOpen: true, type: 'success', message: `Đã thêm ${detailQuantity} "${selectedProduct.name}" vào giỏ hàng!` });
  };

  // ✨ MỚI: Nhãn hiển thị + màu sắc tiếng Việt cho từng trạng thái đơn hàng
  const ORDER_STATUS_LABELS = {
    pending: { label: 'Chờ xác nhận', color: 'bg-amber-50 text-amber-700 border-amber-200' },
    confirmed: { label: 'Đã xác nhận', color: 'bg-blue-50 text-blue-700 border-blue-200' },
    shipping: { label: 'Đang giao hàng', color: 'bg-purple-50 text-purple-700 border-purple-200' },
    delivered: { label: 'Đã giao thành công', color: 'bg-green-50 text-green-700 border-green-200' },
    cancelled: { label: 'Đã hủy', color: 'bg-red-50 text-red-700 border-red-200' }
  };

  // ✨ MỚI: Tra cứu 1 đơn hàng theo mã đơn (order_code) khách hàng nhận được sau khi đặt hàng
  const handleOrderLookup = async (e) => {
    e.preventDefault();
    if (!orderLookupCode.trim()) return;
    setOrderLookupLoading(true);
    setOrderLookupError('');
    setOrderLookupResult(null);
    try {
      const response = await api.get(`/orders/${orderLookupCode.trim()}`);
      if (response.data.status === 'success') {
        setOrderLookupResult(response.data.data);
      }
    } catch (error) {
      setOrderLookupError(error.response?.data?.message || 'Không thể tra cứu đơn hàng lúc này. Vui lòng thử lại.');
    } finally {
      setOrderLookupLoading(false);
    }
  };

  // ✨ MỚI: Lịch sử đơn hàng của tài khoản đang đăng nhập (GET /orders/my)
  const [myOrders, setMyOrders] = useState([]);
  const [myOrdersLoading, setMyOrdersLoading] = useState(false);

  useEffect(() => {
    if (activePage === 'my-orders' && authUser) {
      const fetchMyOrders = async () => {
        setMyOrdersLoading(true);
        try {
          const response = await api.get('/orders/my');
          if (response.data.status === 'success') {
            setMyOrders(response.data.data);
          }
        } catch (error) {
          setCustomAlert({ isOpen: true, type: 'error', message: error.response?.data?.message || 'Không tải được lịch sử đơn hàng.' });
        } finally {
          setMyOrdersLoading(false);
        }
      };
      fetchMyOrders();
    }
  }, [activePage, authUser]);

  const totalCartPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  // ✨ MỚI: Số ngày để một sản phẩm còn được xem là "mới" kể từ lúc tạo (created_at)
  const NEW_PRODUCT_WINDOW_DAYS = 14;

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    if (selectedCategory === 'Tất Cả Đồ Dùng') return matchesSearch;
    if (selectedCategory === 'SẢN PHẨM MỚI') {
      // ✨ SỬA: Lọc thật theo created_at thay vì hiển thị toàn bộ sản phẩm như trước
      if (!product.created_at) return false;
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - NEW_PRODUCT_WINDOW_DAYS);
      return matchesSearch && new Date(product.created_at) >= cutoffDate;
    }
    if (selectedCategory === 'SALE CỰC LỚN') {
      return matchesSearch && product.discount_rate > 0;
    }
    return matchesSearch && product.category === selectedCategory;
  });

  const filteredNotifications = notifications.filter(n => {
    if (activeNotifyTab === 'all') return true;
    return n.type === activeNotifyTab;
  });

  const quickNotifications = notifications.slice(0, 3);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans antialiased">
      
      {/* HEADER CHÍNH */}
      <header className="bg-blue-600 text-white shadow-sm">
        <div className="px-8 py-4 flex justify-between items-center max-w-7xl mx-auto w-full">
          
          <div onClick={() => { setActivePage('home'); setSelectedCategory('Tất Cả Đồ Dùng'); setSearchQuery(''); }} className="flex items-center gap-3 cursor-pointer">
            <span className="bg-white p-2.5 rounded-xl text-2xl text-blue-600 shadow-sm">🛍️</span>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tighter uppercase">MiniShop</h1>
            </div>
          </div>
          
          {/* Tìm kiếm */}
          <div className="relative w-2/5">
            <span className="absolute left-4 top-3.5 text-gray-400 text-sm">🔍</span>
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if(activePage !== 'home') setActivePage('home');
              }}
              placeholder="Tìm kiếm nhanh đồ dùng bạn cần..." 
              className="w-full pl-10 pr-4 py-2.5 bg-white text-gray-900 placeholder-gray-400 border border-gray-200 rounded-full focus:outline-none text-sm shadow-inner"
            />
          </div>

          {/* Góc tiện ích bên phải */}
          <div className="flex items-center gap-6">
            
            <div className="relative" ref={notifyDropdownRef}>
              <button 
                onClick={() => setIsNotifyDropdownOpen(!isNotifyDropdownOpen)}
                className="relative text-xl text-white hover:text-yellow-300 transition-colors p-2 bg-blue-700 rounded-full cursor-pointer focus:outline-none"
                title="Xem thông báo nhanh"
              >
                🔔
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold w-4.5 h-4.5 rounded-full flex items-center justify-center border-2 border-blue-600">
                  {notifications.length}
                </span>
              </button>

              {/* POPUP THÔNG BÁO NHỎ */}
              {isNotifyDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 text-gray-900 overflow-hidden animate-fadeIn">
                  <div className="px-4 py-3 bg-gray-50 border-b border-gray-150 flex justify-between items-center">
                    <span className="text-xs font-black text-gray-800 uppercase tracking-tight">Thông báo mới nhận</span>
                    <span className="bg-blue-100 text-blue-600 font-extrabold text-[10px] px-1.5 py-0.5 rounded-full">{notifications.length}</span>
                  </div>

                  <div className="divide-y divide-gray-100 max-h-64 overflow-y-auto">
                    {loadingNotify ? (
                      <div className="p-4 text-center text-xs text-gray-400 font-bold animate-pulse">Đang đồng bộ...</div>
                    ) : quickNotifications.length === 0 ? (
                      <div className="p-6 text-center text-xs text-gray-400">Không có thông báo mới nào.</div>
                    ) : (
                      quickNotifications.map(notify => (
                        <div key={notify.id} className="p-3.5 hover:bg-gray-50 transition-all space-y-1">
                          <div className="flex items-center justify-between">
                            <span className={`text-[8px] font-black uppercase px-1.5 py-0.2 rounded border ${
                              notify.type === 'sale' ? 'bg-red-50 text-red-600 border-red-100' :
                              notify.type === 'new' ? 'bg-green-50 text-green-600 border-green-100' :
                              'bg-blue-50 text-blue-600 border-blue-100'
                            }`}>
                              {notify.type === 'sale' ? 'Giảm giá' : notify.type === 'new' ? 'Hàng mới' : 'Hệ thống'}
                            </span>
                            <span className="text-[9px] text-gray-400">{formatNotifyTime(notify.time || notify.created_at)}</span>
                          </div>
                          <h4 className="text-xs font-black text-gray-900 truncate">{notify.title}</h4>
                          <p className="text-[11px] text-gray-500 line-clamp-1 font-medium">{notify.desc}</p>
                        </div>
                      ))
                    )}
                  </div>

                  <button 
                    onClick={() => {
                      setActivePage('notifications');
                      setIsNotifyDropdownOpen(false);
                    }}
                    className="w-full text-center py-2.5 bg-gray-50 hover:bg-gray-100 text-blue-600 hover:text-blue-700 font-black text-xs border-t border-gray-150 uppercase tracking-wider block transition-all"
                  >
                    Xem tất cả chi tiết →
                  </button>
                </div>
              )}
            </div>

            <button 
              onClick={() => setIsCartOpen(true)}
              className="flex items-center gap-3 bg-white text-black border-2 border-gray-900 px-5 py-2 rounded-full font-bold text-sm shadow-sm transition-all active:scale-95 hover:bg-black hover:text-white"
            >
              <span>🛒 Giỏ hàng:</span>
              <span className="bg-blue-600 text-white rounded-full px-2 py-0.5 text-xs font-black">
                {cart.reduce((sum, item) => sum + item.quantity, 0)}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* THANH NAV NGANG */}
      <nav className="bg-white border-b border-gray-200 text-xs font-bold text-gray-700 tracking-wide sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-8 flex items-center justify-between h-12">
          
          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="flex items-center gap-2 text-gray-900 cursor-pointer hover:text-blue-600 transition-all py-3 font-black uppercase"
            >
              <span>☰</span>
              <span>Danh mục sản phẩm</span>
            </button>

            {isMenuOpen && (
              <div className="absolute top-full left-0 w-64 bg-white border border-gray-200 rounded-2xl p-2 shadow-xl z-50 mt-1">
                {categories.map((cat, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setActivePage('home');
                      setSelectedCategory(cat.name);
                      setIsMenuOpen(false);
                    }}
                    className={`w-full flex justify-between items-center px-4 py-2.5 text-xs font-bold rounded-xl transition-all ${
                      selectedCategory === cat.name && activePage === 'home' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <span>{cat.name}</span>
                    {cat.tag && (
                      <span className={`${cat.tagColor} text-white text-[8px] font-black px-1.5 py-0.5 rounded-sm`}>
                        {cat.tag}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-8 justify-end flex-1 pr-4">
            <button onClick={() => { setActivePage('home'); setSelectedCategory('Tất Cả Đồ Dùng'); }} className={`uppercase hover:text-blue-600 ${activePage === 'home' && selectedCategory === 'Tất Cả Đồ Dùng' ? 'text-blue-600' : ''}`}>Trang Chủ</button>
            <button onClick={() => { setActivePage('home'); setSelectedCategory('SALE CỰC LỚN'); }} className={`uppercase text-red-500 hover:text-red-600 font-black ${activePage === 'home' && selectedCategory === 'SALE CỰC LỚN' ? 'underline underline-offset-4' : ''}`}>Sale Cực Lớn</button>
            <button onClick={() => setActivePage('notifications')} className={`hover:text-blue-600 transition-colors uppercase ${activePage === 'notifications' ? 'text-blue-600 underline underline-offset-4' : ''}`}>
              Thông báo
            </button>
            {/* ✨ MỚI: Link tra cứu đơn hàng theo mã */}
            <button onClick={() => setActivePage('order-tracking')} className={`hover:text-blue-600 transition-colors uppercase ${activePage === 'order-tracking' ? 'text-blue-600 underline underline-offset-4' : ''}`}>
              Tra Cứu Đơn Hàng
            </button>
            <button className="hover:text-blue-600 transition-colors uppercase mr-4">Liên Hệ</button>
            
            {/* ✨ SỬA: Hiển thị trạng thái đăng nhập THẬT thay vì luôn hiện nút Đăng nhập/Đăng ký */}
            <div className="flex items-center text-xs font-bold gap-2 border-l border-gray-300 pl-6 text-gray-800">
              {authUser ? (
                <>
                  <span className="text-gray-600 normal-case">Xin chào, <span className="font-black text-blue-600">{authUser.name}</span></span>
                  {/* ✨ MỚI: Đơn hàng của tôi - chỉ hiện khi đã đăng nhập */}
                  <span className="text-gray-300">/</span>
                  <button onClick={() => setActivePage('my-orders')} className="hover:text-blue-600 transition-colors uppercase cursor-pointer">Đơn Của Tôi</button>
                  {/* ✨ MỚI: Link Quản Trị - chỉ hiện với tài khoản role admin */}
                  {authUser.role === 'admin' && (
                    <>
                      <span className="text-gray-300">/</span>
                      <button onClick={() => setActivePage('admin')} className="hover:text-purple-600 transition-colors uppercase cursor-pointer">Quản Trị</button>
                    </>
                  )}
                  <span className="text-gray-300">/</span>
                  <button onClick={handleLogout} className="hover:text-red-500 transition-colors uppercase cursor-pointer">Đăng xuất</button>
                </>
              ) : (
                <>
                  <button onClick={() => { setAuthMode('login'); setIsAuthOpen(true); }} className="hover:text-blue-600 transition-colors uppercase cursor-pointer">Đăng nhập</button>
                  <span className="text-gray-300">/</span>
                  <button onClick={() => { setAuthMode('register'); setIsAuthOpen(true); }} className="hover:text-blue-600 transition-colors uppercase cursor-pointer">Đăng ký</button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* NỘI DUNG CHÍNH */}
      {activePage === 'home' && (
        <main className="max-w-7xl mx-auto px-8 py-6">
          {/* BANNER */}
          <div className="w-full border border-blue-100 rounded-3xl p-10 flex justify-between items-center relative overflow-hidden min-h-[300px] mb-6 shadow-sm bg-blue-50/70 text-gray-900">
            <div className="max-w-md z-10">
              <span className="text-[10px] font-black text-blue-600 tracking-widest uppercase block mb-2">Ưu đãi độc quyền</span>
              <h2 className="text-3xl font-black leading-tight mb-4 uppercase tracking-tighter text-gray-950">
                GIÁ SỐC MỖI TUẦN<br/>ĐỒ DÙNG CHO CẢ GIA ĐÌNH
              </h2>
              <p className="text-xs text-gray-600 font-medium">
                Giảm giá lên đến <span className="text-red-500 font-extrabold text-base">45%</span> toàn bộ ngành hàng gia dụng hiện đại tại hệ thống.
              </p>
              <button onClick={() => setSelectedCategory('SALE CỰC LỚN')} className="mt-5 bg-black text-white font-black text-xs px-6 py-2.5 rounded-full hover:bg-blue-600 transition-all shadow-md active:scale-95">
                CLICK NGAY
              </button>
            </div>
            <div className="w-80 h-48 bg-cover bg-center border-2 border-white rounded-2xl shadow-xl z-10 mr-4 relative overflow-hidden"
                 style={{ backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.05), rgba(0,0,0,0.15)), url('https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=400')` }}>
            </div>
          </div>

          {/* TAB PHÍM TẮT NHANH */}
          <div className="flex gap-3 mb-8 overflow-x-auto pb-2">
            {quickTabs.map((tab, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedCategory(tab.filterName)}
                className={`flex items-center gap-2 border px-5 py-2.5 rounded-xl font-bold text-xs transition-all shadow-sm shrink-0 ${selectedCategory === tab.filterName ? 'bg-black text-white border-black' : 'bg-white border-gray-200 text-gray-700 hover:border-gray-900 hover:text-gray-900'}`}
              >
                <span>{tab.icon}</span>
                <span>{tab.name}</span>
              </button>
            ))}
          </div>

          {/* GRID SẢN PHẨM */}
          <section>
            <div className="mb-6 border-b border-gray-200 pb-2">
              <h3 className="text-base font-black text-gray-800 tracking-tight uppercase">
                {selectedCategory.toUpperCase()} ({filteredProducts.length})
              </h3>
            </div>
            
            {loading ? (
              <LoadingSpinner message="Đang tải sản phẩm..." />
            ) : productsError ? (
              <ErrorMessage message={productsError} onRetry={fetchProductsFromBackend} />
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-200 text-gray-400 text-xs">
                Không có sản phẩm nào trong nhóm danh mục này.
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-6">
                {filteredProducts.map(product => {
                  const hasDiscount = product.discount_rate && product.discount_rate > 0;
                  return (
                    <div key={product.id} onClick={() => openProductDetail(product)} className="border border-gray-100 rounded-2xl p-4 bg-white shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative group cursor-pointer">
                      <div>
                        <div className="absolute top-4 left-4 flex flex-col gap-1 z-10 items-start">
                          {product.category && (
                            <span className="bg-gray-900 text-white text-[8px] font-black px-2 py-0.5 rounded shadow-sm uppercase tracking-wider">
                              {product.category}
                            </span>
                          )}
                          {hasDiscount && (
                            <span className="bg-red-500 text-white text-[9px] font-black px-2 py-0.5 rounded shadow-sm">
                              Giảm {product.discount_rate}%
                            </span>
                          )}
                        </div>
                        
                        <div className="overflow-hidden rounded-xl mb-3.5 aspect-square bg-gray-50 relative">
                          <img src={product.img || 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=400'} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                          {product.stock_quantity <= 0 && (
                            <span className="absolute inset-0 bg-black/40 text-white font-bold flex items-center justify-center text-xs">HẾT HÀNG</span>
                          )}
                        </div>
                        <h4 className="text-gray-800 text-xs font-bold leading-snug line-clamp-2 min-h-[36px]">{product.name}</h4>
                      </div>

                      <div>
                        <div className="mt-2 min-h-[42px] flex flex-col justify-end">
                          {hasDiscount ? (
                            <>
                              <span className="text-gray-400 line-through text-[11px] font-medium block leading-none mb-1">
                                {(product.original_price || product.price).toLocaleString('vi-VN')} đ
                              </span>
                              <span className="text-red-500 font-black text-sm block leading-none">
                                {product.price.toLocaleString('vi-VN')} đ
                              </span>
                            </>
                          ) : (
                            <span className="text-gray-900 font-black text-sm block leading-none">{product.price.toLocaleString('vi-VN')} đ</span>
                          )}
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); addToCart(product); }} disabled={product.stock_quantity <= 0} className={`w-full mt-3 border text-[10px] font-black py-2.5 rounded-xl transition-all transform active:scale-95 uppercase tracking-wider ${product.stock_quantity <= 0 ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' : 'bg-white text-black border-gray-900 hover:bg-black hover:text-white shadow-sm'}`}>
                          Thêm Vào Giỏ Hàng
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </main>
      )}

      {/* ✨ MỚI: TRANG CHI TIẾT SẢN PHẨM */}
      {activePage === 'product-detail' && selectedProduct && (
        <main className="max-w-5xl mx-auto px-8 py-8 animate-fadeIn">
          <button onClick={() => setActivePage('home')} className="text-xs font-bold bg-white text-gray-700 border border-gray-200 px-4 py-2 rounded-xl shadow-sm hover:border-gray-900 transition-all flex items-center gap-1 cursor-pointer mb-6">
            <span>←</span> Quay lại danh sách sản phẩm
          </button>

          <div className="grid grid-cols-2 gap-10 bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
            <div className="aspect-square rounded-2xl overflow-hidden bg-gray-50 relative">
              <img src={selectedProduct.img || 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=400'} alt={selectedProduct.name} className="w-full h-full object-cover" />
              {selectedProduct.stock_quantity <= 0 && (
                <span className="absolute inset-0 bg-black/40 text-white font-bold flex items-center justify-center text-sm">HẾT HÀNG</span>
              )}
            </div>

            <div className="flex flex-col">
              <div className="flex flex-col gap-1 mb-3 items-start">
                {selectedProduct.category && (
                  <span className="bg-gray-900 text-white text-[9px] font-black px-2 py-0.5 rounded shadow-sm uppercase tracking-wider">{selectedProduct.category}</span>
                )}
                {selectedProduct.discount_rate > 0 && (
                  <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded shadow-sm">Giảm {selectedProduct.discount_rate}%</span>
                )}
              </div>

              <h2 className="text-2xl font-black text-gray-900 leading-snug mb-3">{selectedProduct.name}</h2>

              <div className="mb-4">
                {selectedProduct.discount_rate > 0 ? (
                  <>
                    <span className="text-gray-400 line-through text-sm font-medium block mb-1">{(selectedProduct.original_price || selectedProduct.price).toLocaleString('vi-VN')} đ</span>
                    <span className="text-red-500 font-black text-3xl block">{selectedProduct.price.toLocaleString('vi-VN')} đ</span>
                  </>
                ) : (
                  <span className="text-gray-900 font-black text-3xl block">{selectedProduct.price.toLocaleString('vi-VN')} đ</span>
                )}
              </div>

              <p className="text-sm text-gray-600 leading-relaxed mb-6 flex-1">
                {selectedProduct.description || 'Sản phẩm chưa có mô tả chi tiết.'}
              </p>

              <div className="text-xs text-gray-500 font-bold mb-5">
                Tình trạng kho:{' '}
                {selectedProduct.stock_quantity > 0 ? (
                  <span className="text-green-600">Còn {selectedProduct.stock_quantity} sản phẩm</span>
                ) : (
                  <span className="text-red-500">Hết hàng</span>
                )}
              </div>

              <div className="flex items-center gap-4 mb-5">
                <span className="text-xs font-bold text-gray-500 uppercase">Số lượng</span>
                <div className="flex items-center gap-3 border border-gray-200 rounded-xl px-3 py-1.5">
                  <button onClick={() => setDetailQuantity(q => Math.max(1, q - 1))} className="w-6 h-6 flex items-center justify-center font-bold text-gray-600 hover:text-gray-900 cursor-pointer">-</button>
                  <span className="text-sm font-black w-6 text-center">{detailQuantity}</span>
                  <button onClick={() => setDetailQuantity(q => Math.min(selectedProduct.stock_quantity || 99, q + 1))} className="w-6 h-6 flex items-center justify-center font-bold text-gray-600 hover:text-gray-900 cursor-pointer">+</button>
                </div>
              </div>

              <button onClick={addSelectedProductToCart} disabled={selectedProduct.stock_quantity <= 0} className={`w-full border-2 text-xs font-black py-3.5 rounded-xl transition-all transform active:scale-95 uppercase tracking-wider ${selectedProduct.stock_quantity <= 0 ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' : 'bg-white text-black border-gray-900 hover:bg-black hover:text-white shadow-sm'}`}>
                Thêm Vào Giỏ Hàng
              </button>
            </div>
          </div>
        </main>
      )}

      {/* ✨ MỚI: TRANG TRA CỨU ĐƠN HÀNG */}
      {activePage === 'order-tracking' && (
        <main className="max-w-2xl mx-auto px-6 py-10 animate-fadeIn">
          <div className="flex justify-between items-center mb-8">
            <div>
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Theo dõi đơn hàng</div>
              <h2 className="text-2xl font-black text-gray-950 tracking-tight uppercase flex items-center gap-2">
                <span>📦</span> TRA CỨU ĐƠN HÀNG
              </h2>
            </div>
            <button onClick={() => setActivePage('home')} className="text-xs font-bold bg-white text-gray-700 border border-gray-200 px-4 py-2 rounded-xl shadow-sm hover:border-gray-900 transition-all flex items-center gap-1 cursor-pointer">
              <span>←</span> Quay lại trang chủ
            </button>
          </div>

          <form onSubmit={handleOrderLookup} className="flex gap-3 mb-8">
            <input
              type="text"
              value={orderLookupCode}
              onChange={(e) => setOrderLookupCode(e.target.value)}
              placeholder="Nhập mã đơn hàng (VD: TN-20260718-X97B)..."
              className="flex-1 px-4 py-3 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button type="submit" disabled={orderLookupLoading} className="bg-black text-white font-black text-xs px-6 py-3 rounded-xl hover:bg-blue-600 transition-all shadow-md active:scale-95 uppercase tracking-wide disabled:opacity-50 cursor-pointer">
              {orderLookupLoading ? 'Đang tra cứu...' : 'Tra cứu'}
            </button>
          </form>

          {orderLookupError && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-xs font-bold p-4 rounded-xl mb-6">
              {orderLookupError}
            </div>
          )}

          {orderLookupResult && (
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex justify-between items-center border-b border-gray-100 pb-4">
                <div>
                  <div className="text-[10px] text-gray-400 font-bold uppercase">Mã đơn hàng</div>
                  <div className="text-sm font-black text-gray-900">{orderLookupResult.order_code}</div>
                </div>
                <span className={`text-[10px] font-black uppercase px-3 py-1.5 rounded-full border ${(ORDER_STATUS_LABELS[orderLookupResult.status] || ORDER_STATUS_LABELS.pending).color}`}>
                  {(ORDER_STATUS_LABELS[orderLookupResult.status] || ORDER_STATUS_LABELS.pending).label}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <div className="text-gray-400 font-bold uppercase text-[10px] mb-1">Khách hàng</div>
                  <div className="font-bold text-gray-800">{orderLookupResult.customer_name}</div>
                </div>
                <div>
                  <div className="text-gray-400 font-bold uppercase text-[10px] mb-1">Tổng tiền</div>
                  <div className="font-black text-red-500">{orderLookupResult.total_price.toLocaleString('vi-VN')} đ</div>
                </div>
                <div className="col-span-2">
                  <div className="text-gray-400 font-bold uppercase text-[10px] mb-1">Thời gian đặt</div>
                  <div className="font-bold text-gray-800">{formatNotifyTime(orderLookupResult.created_at)}</div>
                </div>
              </div>
              <div className="border-t border-gray-100 pt-4">
                <div className="text-gray-400 font-bold uppercase text-[10px] mb-2">Sản phẩm đã đặt</div>
                <div className="space-y-2">
                  {(orderLookupResult.items || []).map((item, idx) => (
                    <div key={idx} className="flex justify-between text-xs">
                      <span className="text-gray-700 font-medium">{item.product_name} x{item.quantity}</span>
                      <span className="text-gray-900 font-bold">{item.subtotal.toLocaleString('vi-VN')} đ</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </main>
      )}

      {/* ✨ MỚI: TRANG "ĐƠN CỦA TÔI" - lịch sử đơn hàng của tài khoản đang đăng nhập */}
      {activePage === 'my-orders' && (
        <main className="max-w-3xl mx-auto px-6 py-10 animate-fadeIn">
          <h2 className="text-lg font-black text-gray-800 mb-6">Đơn Hàng Của Tôi</h2>

          {!authUser ? (
            <p className="text-xs text-gray-400">Bạn cần đăng nhập để xem lịch sử đơn hàng.</p>
          ) : myOrdersLoading ? (
            <LoadingSpinner />
          ) : myOrders.length === 0 ? (
            <p className="text-xs text-gray-400">Bạn chưa có đơn hàng nào. Hãy mua sắm và quay lại đây nhé!</p>
          ) : (
            <div className="space-y-3">
              {myOrders.map((order) => (
                <div key={order.id} className="border border-gray-100 rounded-2xl p-4 bg-white shadow-sm flex justify-between items-center">
                  <div>
                    <div className="text-sm font-black text-gray-900">{order.order_code}</div>
                    <div className="text-[11px] text-gray-400 mt-1">{formatNotifyTime(order.created_at)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-black text-red-500">{Number(order.total_price).toLocaleString('vi-VN')} đ</div>
                    <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full border inline-block mt-1 ${(ORDER_STATUS_LABELS[order.status] || ORDER_STATUS_LABELS.pending).color}`}>
                      {(ORDER_STATUS_LABELS[order.status] || ORDER_STATUS_LABELS.pending).label}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      )}

      {/* ✨ MỚI: TRANG QUẢN TRỊ - chỉ render khi đúng là tài khoản role admin (phòng trường hợp cố tình sửa URL/state) */}
      {activePage === 'admin' && authUser?.role === 'admin' && (
        <AdminDashboard
          onBack={() => setActivePage('home')}
          onNotify={(type, message) => setCustomAlert({ isOpen: true, type, message })}
        />
      )}

      {/* TRANG THÔNG BÁO CHÍNH THỨC */}
      {activePage === 'notifications' && (
        <main className="max-w-4xl mx-auto px-6 py-10 animate-fadeIn">
          <div className="flex justify-between items-center mb-8">
            <div>
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Cập nhật thời gian thực</div>
              <h2 className="text-2xl font-black text-gray-950 tracking-tight uppercase flex items-center gap-2">
                <span>🔔</span> THÔNG BÁO
              </h2>
            </div>
            <button 
              onClick={() => setActivePage('home')}
              className="text-xs font-bold bg-white text-gray-700 border border-gray-200 px-4 py-2 rounded-xl shadow-sm hover:border-gray-900 transition-all flex items-center gap-1 cursor-pointer"
            >
              <span>←</span> Quay lại trang chủ
            </button>
          </div>

          <div className="flex bg-gray-200/70 p-1 rounded-2xl mb-6 gap-1 border border-gray-200">
            <button onClick={() => setActiveNotifyTab('all')} className={`flex-1 py-3 text-xs font-black rounded-xl uppercase transition-all cursor-pointer ${activeNotifyTab === 'all' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}>
              Tất cả ({notifications.length})
            </button>
            <button onClick={() => setActiveNotifyTab('sale')} className={`flex-1 py-3 text-xs font-black rounded-xl uppercase transition-all cursor-pointer ${activeNotifyTab === 'sale' ? 'bg-white text-red-500 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}>
              🔥 Sản phẩm Sale
            </button>
            <button onClick={() => setActiveNotifyTab('new')} className={`flex-1 py-3 text-xs font-black rounded-xl uppercase transition-all cursor-pointer ${activeNotifyTab === 'new' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}>
              ✨ Sản phẩm mới
            </button>
            <button onClick={() => setActiveNotifyTab('order')} className={`flex-1 py-3 text-xs font-black rounded-xl uppercase transition-all cursor-pointer ${activeNotifyTab === 'order' ? 'bg-white text-amber-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}>
              📦 Đơn hàng & Khách
            </button>
          </div>

          <div className="space-y-4">
            {loadingNotify ? (
              <div className="text-center py-16 text-gray-400 font-bold animate-pulse text-xs">Đang đồng bộ dữ liệu thông báo...</div>
            ) : filteredNotifications.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200 text-gray-400 text-xs">
                Không có dữ liệu thông báo nào.
              </div>
            ) : (
              filteredNotifications.map(notify => {
                let categoryColor = "border-l-blue-500";
                let badgeStyle = "bg-blue-50 text-blue-600 border-blue-200";
                let typeLabel = "Hệ thống";

                if (notify.type === 'sale') {
                  categoryColor = "border-l-red-500";
                  badgeStyle = "bg-red-50 text-red-600 border-red-200";
                  typeLabel = "Khuyến mãi";
                } else if (notify.type === 'new') {
                  categoryColor = "border-l-green-500";
                  badgeStyle = "bg-green-50 text-green-600 border-green-200";
                  typeLabel = "Sản phẩm mới";
                } else if (notify.type === 'order') {
                  categoryColor = "border-l-amber-500";
                  badgeStyle = "bg-amber-50 text-amber-600 border-amber-200";
                  typeLabel = "Đơn hàng & Khách";
                }

                return (
                  <div key={notify.id} className={`bg-white border border-gray-200 border-l-4 ${categoryColor} p-5 rounded-2xl shadow-sm hover:shadow-md transition-all flex justify-between items-start gap-4`}>
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 border rounded-md ${badgeStyle}`}>
                          {typeLabel}
                        </span>
                        <span className="text-[10px] text-gray-400 font-medium">{formatNotifyTime(notify.time || notify.created_at)}</span>
                      </div>
                      <h3 className="text-sm font-black text-gray-900 leading-tight">{notify.title}</h3>
                      <p className="text-xs text-gray-600 leading-relaxed font-medium">{notify.desc}</p>
                    </div>
                    {notify.type !== 'order' && (
                      <button 
                        onClick={() => {
                          setActivePage('home');
                          if (notify.type === 'sale') setSelectedCategory('SALE CỰC LỚN');
                          if (notify.type === 'new') setSelectedCategory('SẢN PHẨM MỚI');
                        }}
                        className="text-[10px] font-black border border-gray-900 px-3 py-1.5 rounded-lg hover:bg-black hover:text-white transition-all uppercase tracking-wide shrink-0 cursor-pointer"
                      >
                        Mua ngay
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </main>
      )}

      {/* MODAL ĐĂNG KÝ / ĐĂNG NHẬP (ĐÃ CẬP NHẬT THÊM TRƯỜNG NHẬP) */}
{isAuthOpen && (
  <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
    <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl relative text-gray-800">
      <button onClick={() => setIsAuthOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 font-bold text-sm cursor-pointer">✕</button>
      
      <div className="flex gap-4 border-b border-gray-100 pb-3 mb-5">
        <button onClick={() => setAuthMode('login')} className={`text-sm font-black pb-1 uppercase tracking-wider cursor-pointer ${authMode === 'login' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-400'}`}>Đăng nhập</button>
        <button onClick={() => setAuthMode('register')} className={`text-sm font-black pb-1 uppercase tracking-wider cursor-pointer ${authMode === 'register' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-400'}`}>Đăng ký</button>
      </div>
      
      <form onSubmit={handleAuthSubmit} className="space-y-4">
        {/* ✨ MỚI: Trường Họ tên - CHỈ hiện khi đăng ký, vì API backend yêu cầu bắt buộc trường "name" */}
        {authMode === 'register' && (
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Họ và tên</label>
            <input type="text" required value={authName} onChange={(e) => setAuthName(e.target.value)} placeholder="Nhập họ và tên của bạn..." className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        )}

        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Email</label>
          {/* ✨ SỬA: Kết nối input với state (trước đây không có value/onChange nên form không lưu được gì) */}
          <input type="email" required value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} placeholder="Nhập email của bạn..." className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        
        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Mật khẩu</label>
          <input type="password" required minLength={6} value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} placeholder="Tối thiểu 6 ký tự..." className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        {/* ✨ SỬA: Bỏ trường SĐT/địa chỉ vì API backend hiện chỉ lưu name/email/password - giữ 2 trường này
            sẽ khiến người dùng tưởng nhầm là dữ liệu đó được lưu trong khi thực ra không hề */}

        <button type="submit" disabled={authSubmitting} className="w-full bg-white text-black border-2 border-gray-900 hover:bg-black hover:text-white py-2.5 rounded-xl font-bold text-xs transition-all uppercase tracking-wide pt-3 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
          {authSubmitting ? 'Đang xử lý...' : (authMode === 'login' ? 'Đăng Nhập Ngay' : 'Hoàn Tất Đăng Ký')}
        </button>
      </form>
    </div>
  </div>
)}

      {/* GIỎ HÀNG SIDEBAR */}
      {isCartOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-end">
          <div className="absolute inset-0" onClick={() => setIsCartOpen(false)}></div>
          <div className="w-96 bg-white h-full relative z-10 p-6 flex flex-col justify-between shadow-2xl">
            <div>
              <div className="flex justify-between items-center border-b border-gray-100 pb-4 mb-4">
                <h3 className="text-sm font-black text-gray-800">🛒 Giỏ Hàng Hệ Thống</h3>
                <button onClick={() => setIsCartOpen(false)} className="text-gray-400 hover:text-gray-600 text-sm font-bold cursor-pointer">✕</button>
              </div>
              <div className="mb-4">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Tên khách hàng *</label>
                <input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Nhập họ và tên..." className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="space-y-3 overflow-y-auto max-h-[calc(100vh-280px)] pr-1">
                {cart.length === 0 ? (
                  <p className="text-center text-gray-400 py-12 text-xs">Giỏ hàng rỗng.</p>
                ) : (
                  cart.map(item => (
                    <div key={item.id} className="flex gap-3 bg-gray-50 p-3 rounded-xl border border-gray-100 text-gray-800">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-bold truncate">{item.name}</h4>
                        <p className="text-xs text-red-500 font-black mt-1">{item.price.toLocaleString('vi-VN')} đ</p>
                        <div className="flex items-center gap-2 mt-2">
                          <button onClick={() => updateQuantity(item.id, -1)} className="w-5 h-5 bg-white border border-gray-200 rounded flex items-center justify-center text-xs font-bold cursor-pointer">-</button>
                          <span className="text-xs font-bold px-1">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, 1)} className="w-5 h-5 bg-white border border-gray-200 rounded flex items-center justify-center text-xs font-bold cursor-pointer">+</button>
                        </div>
                      </div>
                      <button onClick={() => removeFromCart(item.id)} className="text-gray-400 hover:text-red-500 self-start text-xs p-1 cursor-pointer">Xóa</button>
                    </div>
                  ))
                )}
              </div>
            </div>
            <div className="border-t border-gray-100 pt-4 bg-white">
              <div className="flex justify-between items-center mb-4 text-gray-800">
                <span className="text-xs font-bold text-gray-500">Tổng tiền:</span>
                <span className="text-base font-black text-red-500">{totalCartPrice.toLocaleString('vi-VN')} đ</span>
              </div>
              <button onClick={handleCheckout} className="w-full bg-white text-black border-2 border-gray-900 hover:bg-black hover:text-white py-3 rounded-xl font-bold text-xs transition-all uppercase tracking-wide cursor-pointer">
                Xác Nhận Đặt Hàng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL THÔNG BÁO TỰ CHẾ ĐỘC QUYỀN MINISHOP THAY THẾ CHO ALERT MẶC ĐỊNH */}
      {customAlert.isOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 flex flex-col items-center text-center text-gray-900 animate-scaleUp">
            
            <div className="mb-4">
              {customAlert.type === 'success' && (
                <div className="w-12 h-12 bg-green-50 text-green-500 border border-green-200 rounded-full flex items-center justify-center text-2xl shadow-sm">✓</div>
              )}
              {customAlert.type === 'error' && (
                <div className="w-12 h-12 bg-red-50 text-red-500 border border-red-200 rounded-full flex items-center justify-center text-2xl font-black shadow-sm">✕</div>
              )}
              {customAlert.type === 'warning' && (
                <div className="w-12 h-12 bg-amber-50 text-amber-500 border border-amber-200 rounded-full flex items-center justify-center text-xl shadow-sm">⚠️</div>
              )}
              {customAlert.type === 'info' && (
                <div className="w-12 h-12 bg-blue-50 text-blue-500 border border-blue-200 rounded-full flex items-center justify-center text-xl shadow-sm">ℹ️</div>
              )}
            </div>

            <h4 className="text-sm font-black uppercase tracking-wider mb-2 text-gray-800">
              {customAlert.type === 'success' && 'Thành công'}
              {customAlert.type === 'error' && 'Thông báo lỗi hệ thống'}
              {customAlert.type === 'warning' && 'Nhắc nhở hệ thống'}
              {customAlert.type === 'info' && 'Thông báo hệ thống'}
            </h4>

            <p className="text-xs text-gray-600 font-medium whitespace-pre-line leading-relaxed mb-5 px-2">
              {customAlert.message}
            </p>

            <button 
              onClick={() => setCustomAlert({ ...customAlert, isOpen: false })} 
              className={`px-8 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wide transition-all shadow-sm active:scale-95 cursor-pointer border ${
                customAlert.type === 'success' ? 'bg-green-600 text-white border-green-700 hover:bg-green-700' :
                customAlert.type === 'error' ? 'bg-red-600 text-white border-red-700 hover:bg-red-700' :
                customAlert.type === 'warning' ? 'bg-amber-500 text-white border-amber-600 hover:bg-amber-600' :
                'bg-blue-600 text-white border-blue-700 hover:bg-blue-700'
              }`}
            >
              Xác nhận & Đóng
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

export default App;