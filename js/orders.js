(function() {
  'use strict';

  var LS_ORDERS = 'fruit_orders';

  var orders = [];

  function loadOrders() {
    try {
      var data = localStorage.getItem(LS_ORDERS);
      orders = data ? JSON.parse(data) : [];
    } catch (e) {
      orders = [];
    }
  }

  function saveOrders() {
    localStorage.setItem(LS_ORDERS, JSON.stringify(orders));
  }

  // ===== Hook into order creation (called from app.js) =====
  window._fruit._onOrderCreated = function(orderNo, items, total, shipping) {
    var order = {
      id: orderNo,
      items: items.map(function(item) {
        return { name: item.name, emoji: item.emoji, qty: item.qty, subtotal: item.subtotal };
      }),
      total: total,
      shipping: { name: shipping.name, phone: shipping.phone, address: shipping.address },
      createdAt: new Date().toISOString(),
      status: 'ordered'
    };
    orders.unshift(order);
    saveOrders();
  };

  // ===== Helpers =====
  function formatDate(iso) {
    var d = new Date(iso);
    var pad = function(n) { return String(n).padStart(2, '0'); };
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
  }

  function statusLabel(status) {
    var map = {
      ordered: { text: '已下单', cls: 'status-ordered' },
      shipping: { text: '配送中', cls: 'status-shipping' },
      completed: { text: '已完成', cls: 'status-completed' }
    };
    return map[status] || { text: status, cls: '' };
  }

  function truncateItems(items) {
    var names = items.slice(0, 3).map(function(i) { return i.name; }).join('、');
    if (items.length > 3) {
      names += ' 等' + items.length + '件';
    }
    return names;
  }

  function showToast(msg) {
    if (window._fruit.showToast) {
      window._fruit.showToast(msg);
      return;
    }
    // Fallback toast
    var old = document.getElementById('toast');
    if (old) old.remove();
    var toast = document.createElement('div');
    toast.id = 'toast';
    toast.textContent = msg;
    toast.style.cssText = 'position:fixed;bottom:30px;left:50%;transform:translateX(-50%);background:rgba(39,174,96,0.92);color:#fff;padding:10px 24px;border-radius:20px;font-size:0.88rem;z-index:9999;white-space:nowrap;';
    document.body.appendChild(toast);
    setTimeout(function() {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s';
      setTimeout(function() { toast.remove(); }, 300);
    }, 1800);
  }

  // ===== Build UI =====
  function addOrderButton() {
    var headerInner = document.querySelector('.header-inner');
    if (!headerInner) return;

    var orderBtn = document.createElement('button');
    orderBtn.className = 'cart-btn';
    orderBtn.style.marginRight = '8px';
    orderBtn.textContent = '\U0001f4cb 我的订单';
    orderBtn.onclick = openOrderList;

    var cartBtn = headerInner.querySelector('.cart-btn');
    if (cartBtn) {
      headerInner.insertBefore(orderBtn, cartBtn);
    } else {
      headerInner.appendChild(orderBtn);
    }
  }

  function buildModals() {
    // Overlay for order list
    var olOverlay = document.createElement('div');
    olOverlay.className = 'modal-overlay';
    olOverlay.id = 'orderListOverlay';
    olOverlay.onclick = closeOrderList;
    document.body.appendChild(olOverlay);

    // Order list modal
    var olModal = document.createElement('div');
    olModal.className = 'modal order-list-modal';
    olModal.id = 'orderListModal';
    olModal.innerHTML =
      '<div class="modal-header">' +
        '<h3>\U0001f4cb 我的订单</h3>' +
        '<button class="modal-close" onclick="window._fruit.closeOrderList()">✕</button>' +
      '</div>' +
      '<div class="order-list-content" id="orderListContent"></div>';
    document.body.appendChild(olModal);

    // Overlay for order detail
    var odOverlay = document.createElement('div');
    odOverlay.className = 'modal-overlay';
    odOverlay.id = 'orderDetailOverlay';
    odOverlay.onclick = closeOrderDetail;
    document.body.appendChild(odOverlay);

    // Order detail modal
    var odModal = document.createElement('div');
    odModal.className = 'modal order-detail-modal';
    odModal.id = 'orderDetailModal';
    odModal.innerHTML =
      '<div class="modal-header">' +
        '<h3>\U0001f4cb 订单详情</h3>' +
        '<button class="modal-close" onclick="window._fruit.closeOrderDetail()">✕</button>' +
      '</div>' +
      '<div class="order-detail-content" id="orderDetailContent"></div>';
    document.body.appendChild(odModal);
  }

  // ===== Order List =====
  function openOrderList() {
    document.getElementById('orderListOverlay').classList.add('show');
    document.getElementById('orderListModal').classList.add('show');
    renderOrderList();
  }

  function closeOrderList() {
    document.getElementById('orderListOverlay').classList.remove('show');
    document.getElementById('orderListModal').classList.remove('show');
  }

  function renderOrderList() {
    var container = document.getElementById('orderListContent');
    if (orders.length === 0) {
      container.innerHTML = '<div class="order-empty">暂无订单记录</div>';
      return;
    }
    var html = '';
    for (var i = 0; i < orders.length; i++) {
      var o = orders[i];
      var st = statusLabel(o.status);
      html +=
        '<div class="order-card" onclick="window._fruit.openOrderDetail(' + i + ')">' +
          '<div class="order-card-header">' +
            '<span class="order-card-id">#' + o.id.slice(-6) + '</span>' +
            '<span class="order-card-status ' + st.cls + '">' + st.text + '</span>' +
          '</div>' +
          '<div class="order-card-body">' +
            '<span class="order-card-items">' + truncateItems(o.items) + '</span>' +
            '<span class="order-card-total">¥' + o.total.toFixed(2) + '</span>' +
          '</div>' +
          '<div class="order-card-footer">' + formatDate(o.createdAt) + '</div>' +
        '</div>';
    }
    container.innerHTML = html;
  }

  // ===== Order Detail =====
  function openOrderDetail(index) {
    var o = orders[index];
    if (!o) return;
    closeOrderList();

    var content = document.getElementById('orderDetailContent');
    var st = statusLabel(o.status);

    var itemsHtml = '';
    for (var j = 0; j < o.items.length; j++) {
      var item = o.items[j];
      itemsHtml +=
        '<tr>' +
          '<td>' + item.emoji + ' ' + item.name + '</td>' +
          '<td>¥' + (item.subtotal / item.qty).toFixed(2) + '</td>' +
          '<td>' + item.qty + '</td>' +
          '<td class="td-price">¥' + item.subtotal.toFixed(2) + '</td>' +
        '</tr>';
    }

    content.innerHTML =
      '<div class="od-header">' +
        '<span class="od-id">#' + o.id.slice(-6) + '</span>' +
        '<span class="order-card-status ' + st.cls + '">' + st.text + '</span>' +
      '</div>' +
      '<div class="od-time">下单时间：' + formatDate(o.createdAt) + '</div>' +
      '<table class="od-table">' +
        '<thead><tr><th>商品</th><th>单价</th><th>数量</th><th>小计</th></tr></thead>' +
        '<tbody>' + itemsHtml + '</tbody>' +
        '<tfoot><tr><td colspan="3" class="td-label">合计</td><td class="td-price">¥' + o.total.toFixed(2) + '</td></tr></tfoot>' +
      '</table>' +
      '<div class="od-shipping">' +
        '<div class="od-ship-title">收货信息</div>' +
        '<div>' + o.shipping.name + '　' + o.shipping.phone + '</div>' +
        '<div>' + o.shipping.address + '</div>' +
      '</div>' +
      '<button class="btn-reorder" onclick="window._fruit.reorder(' + index + ')">重新购买</button>';

    document.getElementById('orderDetailOverlay').classList.add('show');
    document.getElementById('orderDetailModal').classList.add('show');
  }

  function closeOrderDetail() {
    document.getElementById('orderDetailOverlay').classList.remove('show');
    document.getElementById('orderDetailModal').classList.remove('show');
  }

  // ===== Reorder =====
  function reorder(index) {
    var o = orders[index];
    if (!o) return;
    var stockData = window._fruit.getStock();
    var skipped = [];

    for (var k = 0; k < o.items.length; k++) {
      var item = o.items[k];
      var product = window._fruit.PRODUCTS.find(function(p) { return p.name === item.name; });
      if (!product) { skipped.push(item.name); continue; }

      var stock = stockData[product.id] || 0;
      if (stock <= 0) { skipped.push(item.name); continue; }

      var toAdd = Math.min(item.qty, stock);
      for (var a = 0; a < toAdd; a++) {
        window._fruit.addToCart(product.id);
      }
    }

    if (skipped.length > 0) {
      showToast('以下商品库存不足已跳过：' + skipped.join('、'));
    }

    closeOrderDetail();
  }

  // ===== Init =====
  function init() {
    loadOrders();
    addOrderButton();
    buildModals();

    // Expose public functions
    window._fruit.openOrderDetail = openOrderDetail;
    window._fruit.closeOrderList = closeOrderList;
    window._fruit.closeOrderDetail = closeOrderDetail;
    window._fruit.reorder = reorder;
  }

  init();
})();
