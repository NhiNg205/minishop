import React, { useState, useEffect, useRef } from 'react';

// URL của Backend API (Cổng 5000)
const API_BASE_URL = 'http://localhost:5000/api'; 

function App() {
  // Trạng thái điều hướng trang: 'home' hoặc 'notifications'
  const [activePage, setActivePage] = useState('home');

  const [products, setProducts] = useState([]); 
  const [notifications, setNotifications] = useState([]); 
  const [cart, setCart] = useState([]); 
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tất Cả Đồ Dùng'); 
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false); 
  const [loading, setLoading] = useState(true);
  const [loadingNotify, setLoadingNotify] = useState(true); 
  const [customerName, setCustomerName] = useState(''); 

  // MỚI: Trạng thái bật/tắt popup thông báo nhỏ tại Chuông
  const [isNotifyDropdownOpen, setIsNotifyDropdownOpen] = useState(false);

  // Trạng thái Đăng ký - Đăng nhập
  const [isAuthOpen, setIsAuthOpen] = useState(false); 
  const [authMode, setAuthMode] = useState('login'); 
  
  // Tab hiện tại trong trang thông báo chính thức ('all', 'sale', 'new', 'order')
  const [activeNotifyTab, setActiveNotifyTab] = useState('all');

  const dropdownRef = useRef(null);
  // MỚI: Ref dùng để bắt sự kiện click ra ngoài để đóng hộp thông báo chuông
  const notifyDropdownRef = useRef(null);

  // Tự động đổi tên trên Tab trình duyệt thành MiniShop khi ứng dụng chạy
  useEffect(() => {
    document.title = "MiniShop";
  }, []);

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
      // Đóng popup thông báo nhỏ nếu click ra ngoài khu vực chuông
      if (notifyDropdownRef.current && !notifyDropdownRef.current.contains(event.target)) {
        setIsNotifyDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // LẤY SẢN PHẨM TỪ BACKEND DATABASE
  useEffect(() => {
    const fetchProductsFromBackend = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE_URL}/products`);
        const result = await response.json();
        if (result.status === "success") {
          setProducts(result.data); 
        }
        setLoading(false);
      } catch (error) {
        console.error("Lỗi khi kết nối với backend:", error);
        setLoading(false);
      }
    };
    fetchProductsFromBackend();
  }, []);

  // TỰ ĐỘNG CẬP NHẬT THÔNG BÁO TỪ DATABASE LÊN WEBSITE
  useEffect(() => {
    const fetchNotificationsFromBackend = async () => {
      try {
        setLoadingNotify(true);
        const response = await fetch(`${API_BASE_URL}/notifications`); 
        const result = await response.json();
        if (result.status === "success") {
          setNotifications(result.data); 
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
    setCart(cart.map(item => {
      if (item.id === productId) {
        const newQty = item.quantity + delta;
        return newQty > 0 ? { ...item, quantity: newQty } : item;
      }
      return item;
    }));
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return alert("Hãy thêm sản phẩm vào giỏ trước khi đặt hàng!");
    if (!customerName.trim()) return alert("Vui lòng nhập tên của bạn trước khi xác nhận đặt hàng!");

    const orderData = {
      customer_name: customerName,
      items: cart.map(item => ({
        product_id: item.id,
        quantity: item.quantity
      }))
    };

    try {
      const response = await fetch(`${API_BASE_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      });

      const result = await response.json();

      if (response.ok && result.status === "success") {
        alert(`🎉 Đặt hàng thành công!\nMã đơn hàng bảo mật là: ${result.order.order_code}`);
        setCart([]);
        setCustomerName('');
        setIsCartOpen(false);
      } else {
        alert(`Lỗi hệ thống: ${result.message}`);
      }
    } catch (error) {
      console.error("Lỗi kết nối đặt hàng:", error);
      alert("Không thể kết nối tới máy chủ Backend!");
    }
  };

  const totalCartPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    if (selectedCategory === 'Tất Cả Đồ Dùng') return matchesSearch;
    if (selectedCategory === 'SẢN PHẨM MỚI') return matchesSearch; 
    if (selectedCategory === 'SALE CỰC LỚN') {
      return matchesSearch && product.discount_rate > 0;
    }
    return matchesSearch && product.category === selectedCategory;
  });

  const filteredNotifications = notifications.filter(n => {
    if (activeNotifyTab === 'all') return true;
    return n.type === activeNotifyTab;
  });

  // MỚI: Lấy ra danh sách tối đa 3 thông báo mới nhất phục vụ cho việc hiển thị nhanh ở Chuông
  const quickNotifications = notifications.slice(0, 3);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans antialiased">
      
      {/* HEADER CHÍNH */}
      <header className="bg-blue-600 text-white shadow-sm">
        <div className="px-8 py-4 flex justify-between items-center max-w-7xl mx-auto w-full">
          
          {/* Logo chữ hiển thị giao diện thành MiniShop */}
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

          {/* Nút Chuông thông báo & Giỏ hàng */}
          <div className="flex items-center gap-6">
            
            {/* SỬA ĐỔI: Bọc Chuông trong div tương đối để ghim Popup thông báo nhỏ */}
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

              {/* MỚI: POPUP POPUP THÔNG BÁO NHỎ KHI NHẤN VÀO CHUÔNG */}
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
                            <span className="text-[9px] text-gray-400">{notify.time || 'Vừa xong'}</span>
                          </div>
                          <h4 className="text-xs font-black text-gray-900 truncate">{notify.title}</h4>
                          <p className="text-[11px] text-gray-500 line-clamp-1 font-medium">{notify.desc}</p>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Nút Xem chi tiết chuyển hướng sang mục thông báo lớn */}
                  <button 
                    onClick={() => {
                      setActivePage('notifications');
                      setIsNotifyDropdownOpen(false); // Đóng hộp thoại nhỏ lại
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

      {/* THANH MENU NGANG CHÍNH */}
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
            <button className="hover:text-blue-600 transition-colors uppercase mr-4">Liên Hệ</button>
            
            <div className="flex items-center text-xs font-bold gap-2 border-l border-gray-300 pl-6 text-gray-800">
              <button onClick={() => { setAuthMode('login'); setIsAuthOpen(true); }} className="hover:text-blue-600 transition-colors uppercase">Đăng nhập</button>
              <span className="text-gray-300">/</span>
              <button onClick={() => { setAuthMode('register'); setIsAuthOpen(true); }} className="hover:text-blue-600 transition-colors uppercase">Đăng ký</button>
            </div>
          </div>
        </div>
      </nav>

      {/* ĐIỀU HƯỚNG GIAO DIỆN */}
      {activePage === 'home' ? (
        /* ==================== TRANG CHỦ BAN ĐẦU ==================== */
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

          {/* CÁC TAB PHÍM TẮT NHANH */}
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

          {/* GRID HIỂN THỊ SẢN PHẨM */}
          <section>
            <div className="mb-6 border-b border-gray-200 pb-2">
              <h3 className="text-base font-black text-gray-800 tracking-tight uppercase">
                {selectedCategory.toUpperCase()} ({filteredProducts.length})
              </h3>
            </div>
            
            {loading ? (
              <div className="text-center py-16 text-gray-400 font-bold animate-pulse text-xs">Đang nạp dữ liệu từ máy chủ database...</div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-200 text-gray-400 text-xs">
                Không có sản phẩm nào trong nhóm danh mục này.
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-6">
                {filteredProducts.map(product => {
                  const hasDiscount = product.discount_rate && product.discount_rate > 0;
                  return (
                    <div key={product.id} className="border border-gray-100 rounded-2xl p-4 bg-white shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative group">
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
                        <button onClick={() => addToCart(product)} disabled={product.stock_quantity <= 0} className={`w-full mt-3 border text-[10px] font-black py-2.5 rounded-xl transition-all transform active:scale-95 uppercase tracking-wider ${product.stock_quantity <= 0 ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' : 'bg-white text-black border-gray-900 hover:bg-black hover:text-white shadow-sm'}`}>
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
      ) : (
        /* ==================== MỤC THÔNG BÁO CHÍNH THỨC TOÀN MÀN HÌNH ==================== */
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

          {/* THANH TAB PHÂN LOẠI */}
          <div className="flex bg-gray-200/70 p-1 rounded-2xl mb-6 gap-1 border border-gray-200">
            <button 
              onClick={() => setActiveNotifyTab('all')}
              className={`flex-1 py-3 text-xs font-black rounded-xl uppercase transition-all cursor-pointer ${activeNotifyTab === 'all' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
            >
              Tất cả ({notifications.length})
            </button>
            <button 
              onClick={() => setActiveNotifyTab('sale')}
              className={`flex-1 py-3 text-xs font-black rounded-xl uppercase transition-all cursor-pointer ${activeNotifyTab === 'sale' ? 'bg-white text-red-500 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
            >
              🔥 Sản phẩm Sale
            </button>
            <button 
              onClick={() => setActiveNotifyTab('new')}
              className={`flex-1 py-3 text-xs font-black rounded-xl uppercase transition-all cursor-pointer ${activeNotifyTab === 'new' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
            >
              ✨ Sản phẩm mới
            </button>
            <button 
              onClick={() => setActiveNotifyTab('order')}
              className={`flex-1 py-3 text-xs font-black rounded-xl uppercase transition-all cursor-pointer ${activeNotifyTab === 'order' ? 'bg-white text-amber-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
            >
              📦 Đơn hàng & Khách hàng
            </button>
          </div>

          <div className="space-y-4">
            {loadingNotify ? (
              <div className="text-center py-16 text-gray-400 font-bold animate-pulse text-xs">Đang đồng bộ dữ liệu thông báo mới nhất...</div>
            ) : filteredNotifications.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200 text-gray-400 text-xs">
                Không có dữ liệu thông báo nào trong danh mục này.
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
                        <span className="text-[10px] text-gray-400 font-medium">{notify.time || notify.created_at}</span>
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

      {/* MODAL ĐĂNG KÝ / ĐĂNG NHẬP */}
      {isAuthOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl relative text-gray-800">
            <button onClick={() => setIsAuthOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 font-bold text-sm cursor-pointer">✕</button>
            <div className="flex gap-4 border-b border-gray-100 pb-3 mb-5">
              <button onClick={() => setAuthMode('login')} className={`text-sm font-black pb-1 uppercase tracking-wider cursor-pointer ${authMode === 'login' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-400'}`}>Đăng nhập</button>
              <button onClick={() => setAuthMode('register')} className={`text-sm font-black pb-1 uppercase tracking-wider cursor-pointer ${authMode === 'register' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-400'}`}>Đăng ký</button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); alert('Tính năng xác thực dữ liệu sẽ được xử lý tiếp ở Backend!'); setIsAuthOpen(false); }} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Tài khoản / Email</label>
                <input type="text" required placeholder="Nhập tên tài khoản..." className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Mật khẩu</label>
                <input type="password" required placeholder="••••••••" className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <button type="submit" className="w-full bg-white text-black border-2 border-gray-900 hover:bg-black hover:text-white py-2.5 rounded-xl font-bold text-xs transition-all uppercase tracking-wide pt-3 cursor-pointer">
                {authMode === 'login' ? 'Đăng Nhập Ngay' : 'Tạo Tài Khoản Mới'}
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
    </div>
  );
}

export default App;