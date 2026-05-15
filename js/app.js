(function() {
  'use strict';

  // ===== 商品数据 =====
  const PRODUCTS = [
    { id: 1, name: '苹果', emoji: '🍎', price: 5.00,  stock: 100 },
    { id: 2, name: '橙子', emoji: '🍊', price: 4.00,  stock: 80  },
    { id: 3, name: '葡萄', emoji: '🍇', price: 12.00, stock: 50  },
    { id: 4, name: '香蕉', emoji: '🍌', price: 3.00,  stock: 120 },
    { id: 5, name: '草莓', emoji: '🍓', price: 15.00, stock: 60  },
    { id: 6, name: '西瓜', emoji: '🍉', price: 8.00,  stock: 40  },
  ];

  const LS_STOCK = 'fruit_stock';
  const LS_CART  = 'fruit_cart';

  let stockData = {};
  let cartData  = [];
  let lastOrderSnapshot = [];

  // ===== 初始化 =====
  function init() {
    loadStock();
    loadCart();
    renderProducts();
    updateCartBadge();
    updateCartSidebar();
  }

  // ===== 库存 =====
  function loadStock() {
    const saved = localStorage.getItem(LS_STOCK);
    if (saved) {
      stockData = JSON.parse(saved);
    } else {
      PRODUCTS.forEach(p => { stockData[p.id] = p.stock; });
      saveStock();
    }
  }

  function saveStock() { localStorage.setItem(LS_STOCK, JSON.stringify(stockData)); }

  // ===== 购物车 =====
  function loadCart() {
    const saved = localStorage.getItem(LS_CART);
    if (saved) cartData = JSON.parse(saved);
  }

  function saveCart() { localStorage.setItem(LS_CART, JSON.stringify(cartData)); }

  function cartIndex(id) { return cartData.findIndex(item => item.id === id); }
  function getCartCount() { return cartData.reduce((s, item) => s + item.quantity, 0); }
  function getCartTotal()  { return cartData.reduce((s, item) => s + item.price * item.quantity, 0); }

  // ===== 商品渲染 =====
  function renderProducts() {
    const grid = document.getElementById('productGrid');
    grid.innerHTML = '';
    PRODUCTS.forEach(p => {
      const stock = stockData[p.id] ?? p.stock;
      const outOfStock = stock <= 0;

      const div = document.createElement('div');
      div.className = 'product-card' + (outOfStock ? ' out-of-stock' : '');
      div.innerHTML = `
        <div class="card-emoji">${p.emoji}</div>
        <div class="card-body">
          <div class="card-name">${p.name}</div>
          <div class="card-price">¥${p.price.toFixed(2)}</div>
          <div class="card-stock ${outOfStock ? 'empty' : ''}">库存：${outOfStock ? '缺货' : stock + '件'}</div>
          <button class="btn-add" onclick="window._fruit.addToCart(${p.id})" ${outOfStock ? 'disabled' : ''}>
            ${outOfStock ? '缺货' : '加入购物车'}
          </button>
        </div>`;
      grid.appendChild(div);
    });
  }

  // ===== 购物车操作 =====

  // Bug防护：addToCart 验证库存上限
  function addToCart(id) {
    const stock = stockData[id] ?? 0;
    const idx = cartIndex(id);
    const current = idx >= 0 ? cartData[idx].quantity : 0;
    if (current >= stock) {
      const p = PRODUCTS.find(x => x.id === id);
      showToast(p.name + ' 已达库存上限 (' + stock + '件)');
      return;
    }
    const product = PRODUCTS.find(x => x.id === id);
    if (idx >= 0) {
      cartData[idx].quantity++;
    } else {
      cartData.push({ id, name: product.name, emoji: product.emoji, price: product.price, quantity: 1 });
    }
    saveCart(); updateCartBadge(); updateCartSidebar(); renderProducts();
    showToast('已加入购物车 ✓');
  }

  // Bug防护：updateQuantity 验证库存上限
  function updateQuantity(id, delta) {
    const stock = stockData[id] ?? 0;
    const idx = cartIndex(id);
    if (idx < 0) return;
    const next = cartData[idx].quantity + delta;
    if (next <= 0) { removeFromCart(id); return; }
    if (next > stock) {
      const p = PRODUCTS.find(x => x.id === id);
      showToast(p.name + ' 数量不能超过库存 (' + stock + '件)');
      return;
    }
    cartData[idx].quantity = next;
    saveCart(); updateCartSidebar(); updateCartBadge(); renderProducts();
  }

  function removeFromCart(id) {
    cartData = cartData.filter(item => item.id !== id);
    saveCart(); updateCartBadge(); updateCartSidebar(); renderProducts();
  }

  function clearCart() {
    if (cartData.length === 0) return;
    if (!confirm('确定要清空购物车吗？此操作不可撤销。')) return;
    cartData = [];
    saveCart(); updateCartBadge(); updateCartSidebar(); renderProducts();
    showToast('购物车已清空');
  }

  // ===== UI 更新 =====
  function updateCartBadge() {
    const badge = document.getElementById('cartBadge');
    const count = getCartCount();
    badge.textContent = count;
    badge.className = 'cart-badge' + (count === 0 ? ' zero' : '');
  }

  function updateCartSidebar() {
    const container = document.getElementById('cartItems');
    const totalEl = document.getElementById('totalPrice');
    const checkoutBtn = document.getElementById('checkoutBtn');
    if (cartData.length === 0) {
      container.innerHTML = '<div class="cart-empty">购物车是空的，快去挑选水果吧~</div>';
      totalEl.textContent = '¥0.00'; checkoutBtn.disabled = true; return;
    }
    checkoutBtn.disabled = false;
    container.innerHTML = '';
    cartData.forEach(item => {
      const stock = stockData[item.id] ?? 0;
      const el = document.createElement('div');
      el.className = 'cart-item';
      el.innerHTML = `
        <span class="cart-item-emoji">${item.emoji}</span>
        <div class="cart-item-info">
          <div class="cart-item-name">${item.name}</div>
          <div class="cart-item-price">¥${(item.price * item.quantity).toFixed(2)}</div>
        </div>
        <div class="cart-item-controls">
          <button class="qty-btn" onclick="window._fruit.updateQuantity(${item.id}, -1)" ${item.quantity <= 1 ? 'disabled' : ''}>−</button>
          <span class="qty-num">${item.quantity}</span>
          <button class="qty-btn" onclick="window._fruit.updateQuantity(${item.id}, 1)" ${item.quantity >= stock ? 'disabled' : ''}>+</button>
        </div>
        <button class="btn-delete" onclick="window._fruit.removeFromCart(${item.id})">🗑</button>`;
      container.appendChild(el);
    });
    totalEl.textContent = '¥' + getCartTotal().toFixed(2);
  }

  function toggleCart() {
    document.getElementById('cartSidebar').classList.toggle('open');
    document.getElementById('cartOverlay').classList.toggle('show');
  }

  // ===== 结算 =====
  function openCheckout() {
    if (cartData.length === 0) return;
    for (const item of cartData) {
      const stock = stockData[item.id] ?? 0;
      if (item.quantity > stock) { showToast('部分商品库存不足，请调整购物车'); return; }
    }
    toggleCart();
    document.getElementById('summaryCount').textContent = getCartCount();
    document.getElementById('summaryTotal').textContent = '¥' + getCartTotal().toFixed(2);
    document.getElementById('checkoutForm').reset(); clearErrors();
    document.getElementById('modalOverlay').classList.add('show');
    document.getElementById('checkoutModal').classList.add('show');
  }

  function closeCheckout() {
    document.getElementById('modalOverlay').classList.remove('show');
    document.getElementById('checkoutModal').classList.remove('show');
  }

  function submitOrder(e) {
    e.preventDefault();
    if (!validateForm()) return;
    for (const item of cartData) {
      const stock = stockData[item.id] ?? 0;
      if (item.quantity > stock) { showToast('库存不足，订单无法提交'); return; }
    }

    // 订单快照
    lastOrderSnapshot = cartData.map(item => ({
      name: item.name, emoji: item.emoji,
      qty: item.quantity, subtotal: item.price * item.quantity,
    }));

    // 扣减库存
    cartData.forEach(item => {
      stockData[item.id] = (stockData[item.id] ?? 0) - item.quantity;
    });
    saveStock();

    const orderNo = 'FR' + Date.now();
    // Notify order persistence hook
    if (window._fruit._onOrderCreated) {
      window._fruit._onOrderCreated(
        orderNo,
        lastOrderSnapshot,
        getCartTotal(),
        {
          name: document.getElementById('userName').value.trim(),
          phone: document.getElementById('userPhone').value.trim(),
          address: document.getElementById('userAddress').value.trim(),
        }
      );
    }
    cartData = []; saveCart();

    closeCheckout(); updateCartBadge(); updateCartSidebar(); renderProducts();

    document.getElementById('orderNo').textContent = '订单编号：' + orderNo;
    document.getElementById('successOverlay').classList.add('show');
    document.getElementById('successModal').classList.add('show');
  }

  function closeSuccess() {
    document.getElementById('successOverlay').classList.remove('show');
    document.getElementById('successModal').classList.remove('show');
    lastOrderSnapshot = [];
  }

  // ===== 表单验证 =====
  function validateForm() {
    let valid = true; clearErrors();
    const name = document.getElementById('userName').value.trim();
    const phone = document.getElementById('userPhone').value.trim();
    const address = document.getElementById('userAddress').value.trim();
    if (!name) { showError('userName', 'errorName', '请输入收货人姓名'); valid = false; }
    if (!phone) { showError('userPhone', 'errorPhone', '请输入手机号'); valid = false; }
    else if (!/^1[3-9]\d{9}$/.test(phone)) { showError('userPhone', 'errorPhone', '手机号格式不正确'); valid = false; }
    if (!address) { showError('userAddress', 'errorAddress', '请输入收货地址'); valid = false; }
    else if (address.length < 5) { showError('userAddress', 'errorAddress', '地址太短，请填写完整'); valid = false; }
    return valid;
  }

  function showError(inputId, errorId, msg) {
    document.getElementById(inputId).classList.add('error');
    document.getElementById(errorId).textContent = msg;
  }

  function clearErrors() {
    ['userName', 'userPhone', 'userAddress'].forEach(id => document.getElementById(id).classList.remove('error'));
    ['errorName', 'errorPhone', 'errorAddress'].forEach(id => document.getElementById(id).textContent = '');
  }

  // ===== Toast =====
  function showToast(msg) {
    const old = document.getElementById('toast');
    if (old) old.remove();
    const toast = document.createElement('div');
    toast.id = 'toast';
    toast.textContent = msg;
    toast.style.cssText = 'position:fixed;bottom:30px;left:50%;transform:translateX(-50%);background:rgba(39,174,96,0.92);color:#fff;padding:10px 24px;border-radius:20px;font-size:0.88rem;z-index:9999;white-space:nowrap;';
    document.body.appendChild(toast);
    setTimeout(() => { toast.style.opacity = '0'; toast.style.transition = 'opacity 0.3s'; setTimeout(() => toast.remove(), 300); }, 1800);
  }

  // ===== 暴露关键函数到 window =====
  window._fruit = { addToCart, updateQuantity, removeFromCart, clearCart, toggleCart, openCheckout, closeCheckout, submitOrder, closeSuccess, renderProducts, PRODUCTS, getStock: () => stockData, showToast };

  init();

})();
