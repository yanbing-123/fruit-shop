(function() {
  'use strict';

  var ORIGINAL_RENDER = window._fruit.renderProducts;
  var PRODUCTS = window._fruit.PRODUCTS;

  // ===== State from URL hash =====
  var params = new URLSearchParams(location.hash.replace('#', ''));
  var keyword = params.get('q') || '';
  var sortBy = params.get('sort') || 'default';
  var priceFilter = params.get('price') || 'all';

  // ===== Filtering & Sorting =====
  function getFilteredProducts() {
    var list = PRODUCTS.slice();

    // keyword filter
    if (keyword.trim()) {
      var kw = keyword.trim().toLowerCase();
      list = list.filter(function(p) { return p.name.toLowerCase().includes(kw); });
    }

    // price filter
    if (priceFilter === 'lt5') {
      list = list.filter(function(p) { return p.price < 5; });
    } else if (priceFilter === '5to10') {
      list = list.filter(function(p) { return p.price >= 5 && p.price <= 10; });
    } else if (priceFilter === 'gt10') {
      list = list.filter(function(p) { return p.price > 10; });
    }

    // sort
    if (sortBy === 'price-asc') {
      list.sort(function(a, b) { return a.price - b.price; });
    } else if (sortBy === 'price-desc') {
      list.sort(function(a, b) { return b.price - a.price; });
    } else if (sortBy === 'name-asc') {
      list.sort(function(a, b) { return a.name.localeCompare(b.name, 'zh'); });
    }

    return list;
  }

  // ===== Badge helper =====
  function getBadges(product, stock) {
    var badges = [];
    // 'new' badge for apple (1) and watermelon (6)
    if (product.id === 1 || product.id === 6) {
      badges.push({ cls: 'new', text: '新品' });
    }
    // 'hot' badge for stock > 80
    if (stock > 80) {
      badges.push({ cls: 'hot', text: '热卖' });
    }
    return badges;
  }

  // ===== Override render =====
  function renderProducts() {
    var grid = document.getElementById('productGrid');
    var filtered = getFilteredProducts();
    var stockData = window._fruit.getStock();

    if (filtered.length === 0) {
      grid.innerHTML = '<div class="empty-state"><div class="empty-icon">\U0001f50d</div><div class="empty-text">未找到相关水果</div></div>';
      return;
    }

    grid.innerHTML = '';
    filtered.forEach(function(p) {
      var stock = stockData[p.id] != null ? stockData[p.id] : p.stock;
      var outOfStock = stock <= 0;
      var badges = getBadges(p, stock);

      var div = document.createElement('div');
      div.className = 'product-card' + (outOfStock ? ' out-of-stock' : '');

      var badgeHtml = '';
      if (badges.length) {
        badgeHtml = ' ' + badges.map(function(b) { return '<span class="card-badge ' + b.cls + '">' + b.text + '</span>'; }).join('');
      }

      div.innerHTML =
        '<div class="card-emoji">' + p.emoji + '</div>' +
        '<div class="card-body">' +
          '<div class="card-name">' + p.name + badgeHtml + '</div>' +
          '<div class="card-price">¥' + p.price.toFixed(2) + '</div>' +
          '<div class="card-stock ' + (outOfStock ? 'empty' : '') + '">库存：' + (outOfStock ? '缺货' : stock + '件') + '</div>' +
          '<button class="btn-add" onclick="window._fruit.addToCart(' + p.id + ')" ' + (outOfStock ? 'disabled' : '') + '>' +
            (outOfStock ? '缺货' : '加入购物车') +
          '</button>' +
        '</div>';
      grid.appendChild(div);
    });
  }

  // ===== URL hash =====
  function updateHash() {
    var p = new URLSearchParams();
    if (keyword) p.set('q', keyword);
    if (sortBy !== 'default') p.set('sort', sortBy);
    if (priceFilter !== 'all') p.set('price', priceFilter);
    var hash = p.toString();
    location.hash = hash ? '#' + hash : '';
  }

  // ===== Debounce =====
  function debounce(fn, ms) {
    var timer;
    return function() {
      var context = this;
      var args = arguments;
      clearTimeout(timer);
      timer = setTimeout(function() { fn.apply(context, args); }, ms);
    };
  }

  // ===== Apply filter & re-render =====
  function apply() {
    updateHash();
    renderProducts();
  }

  function escapeHtml(str) {
    var d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  // ===== Build toolbar DOM =====
  function buildToolbar() {
    var toolbar = document.createElement('div');
    toolbar.className = 'toolbar';
    toolbar.innerHTML =
      '<div class="search-wrap">' +
        '<span class="search-icon">\U0001f50d</span>' +
        '<input type="text" id="searchInput" placeholder="搜索水果..." value="' + escapeHtml(keyword) + '">' +
      '</div>' +
      '<select class="sort-select" id="sortSelect">' +
        '<option value="default"' + (sortBy === 'default' ? ' selected' : '') + '>默认排序</option>' +
        '<option value="price-asc"' + (sortBy === 'price-asc' ? ' selected' : '') + '>价格 ↑</option>' +
        '<option value="price-desc"' + (sortBy === 'price-desc' ? ' selected' : '') + '>价格 ↓</option>' +
        '<option value="name-asc"' + (sortBy === 'name-asc' ? ' selected' : '') + '>名称 A-Z</option>' +
      '</select>' +
      '<div class="price-filters">' +
        '<button class="price-btn' + (priceFilter === 'all' ? ' active' : '') + '" data-price="all">全部</button>' +
        '<button class="price-btn' + (priceFilter === 'lt5' ? ' active' : '') + '" data-price="lt5">¥5以下</button>' +
        '<button class="price-btn' + (priceFilter === '5to10' ? ' active' : '') + '" data-price="5to10">¥5–¥10</button>' +
        '<button class="price-btn' + (priceFilter === 'gt10' ? ' active' : '') + '" data-price="gt10">¥10以上</button>' +
      '</div>';
    return toolbar;
  }

  // ===== Init =====
  function init() {
    var sectionTitle = document.querySelector('.section-title');
    if (!sectionTitle) return;
    sectionTitle.after(buildToolbar());

    // Override render with filtered version
    window._fruit.renderProducts = renderProducts;

    // Search input with IME support + debounce
    var searchInput = document.getElementById('searchInput');
    var isComposing = false;
    searchInput.addEventListener('compositionstart', function() { isComposing = true; });
    searchInput.addEventListener('compositionend', function() {
      isComposing = false;
      keyword = searchInput.value;
      apply();
    });
    searchInput.addEventListener('input', debounce(function() {
      if (isComposing) return;
      keyword = this.value;
      apply();
    }, 300));

    // Sort dropdown
    document.getElementById('sortSelect').addEventListener('change', function() {
      sortBy = this.value;
      apply();
    });

    // Price filter buttons
    document.querySelectorAll('.price-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        document.querySelectorAll('.price-btn').forEach(function(b) { b.classList.remove('active'); });
        this.classList.add('active');
        priceFilter = this.getAttribute('data-price');
        apply();
      });
    });

    // Re-render with current filter state
    renderProducts();
  }

  init();
})();
