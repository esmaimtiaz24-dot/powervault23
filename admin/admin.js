(() => {
  const AUTH_KEY = 'powervault_admin_auth';
  const PRODUCTS_KEY = 'powervault_admin_products';
  const ORDERS_KEY = 'powervault_admin_orders';
  const SETTINGS_KEY = 'powervault_admin_settings';
  const MOVES_KEY = 'powervault_admin_moves';

  const DEMO_ADMIN = {
    email: 'admin@powervault.pk',
    password: 'Admin@12345',
    name: 'POWERVAULT Admin'
  };

  const DEFAULT_PRODUCTS = [
    {
      id: 1,
      name: 'Smart Bicycle Headlight',
      category: 'Bike Lights',
      description: 'Premium bicycle headlight for night rides and city commuting.',
      price: 2499,
      cost_price: 1400,
      stock: 18,
      image: '../f77b22d53571463d91aa7141d075ac3a.jpg',
      active: true,
      featured: true
    },
    {
      id: 2,
      name: 'Front & Rear Safety Set',
      category: 'Bike Lights',
      description: 'Complete dual light set for maximum road visibility.',
      price: 3200,
      cost_price: 1800,
      stock: 12,
      image: '../2824bfbbccdcdd29c4dc5604ca1d7723.jpg',
      active: true,
      featured: true
    },
    {
      id: 3,
      name: 'Compact Portable Power Bank',
      category: 'Power Banks',
      description: 'Everyday portable power for phones and accessories.',
      price: 1699,
      cost_price: 900,
      stock: 25,
      image: '../hero.jpeg',
      active: true,
      featured: true
    },
    {
      id: 4,
      name: 'Rugged Solar Power Bank',
      category: 'Power Banks',
      description: 'Outdoor-ready power bank with solar assist and multi-cable support.',
      price: 3999,
      cost_price: 2200,
      stock: 8,
      image: '../136ea0e628e029f032f540b158a3200e.jpg',
      active: true,
      featured: false
    },
    {
      id: 5,
      name: 'USB Rechargeable Tail Light',
      category: 'Bike Lights',
      description: 'Bright rear safety light for night commuting.',
      price: 1299,
      cost_price: 650,
      stock: 30,
      image: '../1545401f1a33bb52e7a4ac5f03d18677.jpg',
      active: true,
      featured: false
    },
    {
      id: 6,
      name: 'Magnetic Wireless Power Bank',
      category: 'Power Banks',
      description: 'Slim magnetic charging for compatible phones on the go.',
      price: 4599,
      cost_price: 2500,
      stock: 10,
      image: '../918424739554059021ddf39990c0cbd8.jpg',
      active: true,
      featured: false
    }
  ];

  const DEFAULT_SETTINGS = {
    store_name: 'POWERVAULT',
    support_email: 'Supportpowervault@gmail.com',
    shipping_charge: 250
  };

  const read = (key, fallback) => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  };

  const write = (key, value) => localStorage.setItem(key, JSON.stringify(value));

  const money = (n) =>
    'Rs. ' +
    Number(n || 0).toLocaleString('en-PK', {
      maximumFractionDigits: 0
    });

  const ensureSeed = () => {
    if (!localStorage.getItem(PRODUCTS_KEY)) write(PRODUCTS_KEY, DEFAULT_PRODUCTS);
    if (!localStorage.getItem(ORDERS_KEY)) write(ORDERS_KEY, []);
    if (!localStorage.getItem(SETTINGS_KEY)) write(SETTINGS_KEY, DEFAULT_SETTINGS);
    if (!localStorage.getItem(MOVES_KEY)) write(MOVES_KEY, []);
  };

  const getProducts = () => {
    ensureSeed();
    return read(PRODUCTS_KEY, DEFAULT_PRODUCTS);
  };

  const setProducts = (products) => write(PRODUCTS_KEY, products);

  const getOrders = () => {
    ensureSeed();
    return read(ORDERS_KEY, []);
  };

  const setOrders = (orders) => write(ORDERS_KEY, orders);

  const getSettings = () => {
    ensureSeed();
    return { ...DEFAULT_SETTINGS, ...read(SETTINGS_KEY, {}) };
  };

  const setSettings = (settings) => write(SETTINGS_KEY, settings);

  const getMoves = () => read(MOVES_KEY, []);
  const setMoves = (moves) => write(MOVES_KEY, moves);

  const isAuthed = () => !!sessionStorage.getItem(AUTH_KEY);

  const requireAuth = () => {
    if (!isAuthed()) {
      window.location.href = 'login.html';
      return false;
    }
    return true;
  };

  const login = (email, password) => {
    if (
      email.trim().toLowerCase() === DEMO_ADMIN.email &&
      password === DEMO_ADMIN.password
    ) {
      sessionStorage.setItem(
        AUTH_KEY,
        JSON.stringify({ email: DEMO_ADMIN.email, name: DEMO_ADMIN.name })
      );
      return true;
    }
    return false;
  };

  const logout = () => {
    sessionStorage.removeItem(AUTH_KEY);
    window.location.href = 'login.html';
  };

  const currentAdmin = () => {
    try {
      return JSON.parse(sessionStorage.getItem(AUTH_KEY) || 'null');
    } catch {
      return null;
    }
  };

  const nextId = (items) =>
    items.reduce((max, item) => Math.max(max, Number(item.id) || 0), 0) + 1;

  const toast = (message, type = 'success') => {
    let el = document.getElementById('adminToast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'adminToast';
      el.className = 'admin-toast';
      document.body.appendChild(el);
    }
    el.className = 'admin-toast is-visible ' + type;
    el.textContent = message;
    clearTimeout(el._t);
    el._t = setTimeout(() => el.classList.remove('is-visible'), 2200);
  };

  const setActiveNav = (page) => {
    document.querySelectorAll('[data-nav]').forEach((link) => {
      link.classList.toggle('active', link.getAttribute('data-nav') === page);
    });
  };

  const bindLogout = () => {
    document.querySelectorAll('[data-logout]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        logout();
      });
    });
  };

  const renderDashboard = () => {
    if (!requireAuth()) return;
    setActiveNav('dashboard');
    bindLogout();

    const products = getProducts();
    const orders = getOrders();
    const revenue = orders
      .filter((o) => o.status !== 'Cancelled')
      .reduce((sum, o) => sum + Number(o.total || 0), 0);
    const pending = orders.filter((o) => o.status === 'Pending').length;
    const activeProducts = products.filter((p) => p.active).length;

    const setText = (id, value) => {
      const el = document.getElementById(id);
      if (el) el.textContent = value;
    };

    setText('statOrders', String(orders.length));
    setText('statRevenue', money(revenue));
    setText('statPending', String(pending));
    setText('statProducts', String(activeProducts));

    const tbody = document.getElementById('recentOrdersBody');
    if (tbody) {
      const recent = [...orders].reverse().slice(0, 8);
      tbody.innerHTML = recent.length
        ? recent
            .map(
              (o) => `
            <tr>
              <td><strong>${o.order_number}</strong><br><small class="muted">${new Date(o.created_at).toLocaleString()}</small></td>
              <td>${o.customer_name}<br><small class="muted">${o.phone}</small></td>
              <td>${o.payment_method}</td>
              <td>${money(o.total)}</td>
              <td><span class="status-pill">${o.status}</span></td>
            </tr>`
            )
            .join('')
        : `<tr><td colspan="5" class="muted">No orders yet. Place a demo order from the store checkout.</td></tr>`;
    }
  };

  const renderProducts = () => {
    if (!requireAuth()) return;
    setActiveNav('products');
    bindLogout();

    const form = document.getElementById('productForm');
    const tableBody = document.getElementById('productsBody');
    const resetBtn = document.getElementById('productReset');
    let editingId = null;

    const paint = () => {
      const products = getProducts();
      tableBody.innerHTML = products
        .map(
          (p) => `
        <tr>
          <td><img class="product-table-image" src="${p.image || ''}" alt=""></td>
          <td>
            <strong>${p.name}</strong><br>
            <small class="muted">${p.category || '—'}</small>
          </td>
          <td>${money(p.price)}</td>
          <td>${p.stock}</td>
          <td><span class="status-pill ${p.active ? '' : 'warning'}">${p.active ? 'Active' : 'Inactive'}</span></td>
          <td>
            <button type="button" class="table-action" data-edit="${p.id}">Edit</button>
            <button type="button" class="table-action" data-toggle="${p.id}">${p.active ? 'Disable' : 'Enable'}</button>
          </td>
        </tr>`
        )
        .join('');
    };

    const fillForm = (product) => {
      form.name.value = product?.name || '';
      form.category.value = product?.category || '';
      form.description.value = product?.description || '';
      form.price.value = product?.price ?? '';
      form.cost_price.value = product?.cost_price ?? '';
      form.stock.value = product?.stock ?? 0;
      form.image.value = product?.image || '';
      editingId = product?.id || null;
      document.getElementById('productFormTitle').textContent = product
        ? 'Edit Product'
        : 'Add Product';
    };

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const products = getProducts();
      const payload = {
        id: editingId || nextId(products),
        name: form.name.value.trim(),
        category: form.category.value.trim(),
        description: form.description.value.trim(),
        price: Number(form.price.value || 0),
        cost_price: Number(form.cost_price.value || 0),
        stock: Number(form.stock.value || 0),
        image: form.image.value.trim() || '../hero.jpeg',
        active: true,
        featured: false
      };
      if (!payload.name) {
        toast('Product name is required.', 'error');
        return;
      }
      if (editingId) {
        const idx = products.findIndex((p) => p.id === editingId);
        if (idx >= 0) products[idx] = { ...products[idx], ...payload, active: products[idx].active };
      } else {
        products.push(payload);
      }
      setProducts(products);
      fillForm(null);
      paint();
      toast(editingId ? 'Product updated.' : 'Product added.');
    });

    resetBtn?.addEventListener('click', () => fillForm(null));

    tableBody.addEventListener('click', (e) => {
      const editId = e.target.getAttribute('data-edit');
      const toggleId = e.target.getAttribute('data-toggle');
      const products = getProducts();
      if (editId) {
        const product = products.find((p) => String(p.id) === String(editId));
        if (product) fillForm(product);
      }
      if (toggleId) {
        const idx = products.findIndex((p) => String(p.id) === String(toggleId));
        if (idx >= 0) {
          products[idx].active = !products[idx].active;
          setProducts(products);
          paint();
          toast('Product status updated.');
        }
      }
    });

    paint();
  };

  const renderOrders = () => {
    if (!requireAuth()) return;
    setActiveNav('orders');
    bindLogout();

    const body = document.getElementById('ordersBody');
    const paint = () => {
      const orders = getOrders();
      body.innerHTML = orders.length
        ? [...orders]
            .reverse()
            .map(
              (o) => `
          <tr>
            <td>
              <strong>${o.order_number}</strong><br>
              <small class="muted">${new Date(o.created_at).toLocaleString()}</small>
            </td>
            <td>
              ${o.customer_name}<br>
              <small class="muted">${o.phone}</small><br>
              <small class="muted">${o.address}, ${o.city}</small>
            </td>
            <td>
              ${o.payment_method}
              <small class="d-block muted">${o.payment_status || ''}</small>
              ${
                o.payment_sender_name
                  ? `<small class="d-block">Name: ${o.payment_sender_name}</small>`
                  : ''
              }
              ${
                o.payment_sender_phone
                  ? `<small class="d-block">Wallet: ${o.payment_sender_phone}</small>`
                  : ''
              }
              ${o.payment_txn_id ? `<small class="d-block">TID: ${o.payment_txn_id}</small>` : ''}
              ${
                o.payment_proof_name
                  ? `<small class="d-block muted">Proof: ${o.payment_proof_name}</small>`
                  : ''
              }
            </td>
            <td>${money(o.total)}</td>
            <td>
              <form class="order-edit" data-order-id="${o.id}">
                <select class="form-select form-select-sm mb-1" name="status">
                  ${['Pending', 'Confirmed', 'Processing', 'Dispatched', 'Delivered', 'Cancelled']
                    .map(
                      (s) =>
                        `<option value="${s}" ${o.status === s ? 'selected' : ''}>${s}</option>`
                    )
                    .join('')}
                </select>
                <input class="form-control form-control-sm mb-1" name="tracking_number" placeholder="TCS tracking #" value="${o.tracking_number || ''}">
                <input class="form-control form-control-sm mb-1" name="tracking_url" placeholder="Tracking URL" value="${o.tracking_url || ''}">
                <button class="btn btn-neon btn-sm w-100" type="submit">Save</button>
              </form>
            </td>
          </tr>`
            )
            .join('')
        : `<tr><td colspan="5" class="muted">No orders yet.</td></tr>`;
    };

    body.addEventListener('submit', (e) => {
      const form = e.target.closest('form.order-edit');
      if (!form) return;
      e.preventDefault();
      const id = Number(form.getAttribute('data-order-id'));
      const orders = getOrders();
      const idx = orders.findIndex((o) => o.id === id);
      if (idx < 0) return;
      orders[idx].status = form.status.value;
      orders[idx].tracking_number = form.tracking_number.value.trim();
      orders[idx].tracking_url = form.tracking_url.value.trim();
      setOrders(orders);
      paint();
      toast('Order updated.');
    });

    paint();
  };

  const renderInventory = () => {
    if (!requireAuth()) return;
    setActiveNav('inventory');
    bindLogout();

    const form = document.getElementById('stockForm');
    const productSelect = document.getElementById('stockProduct');
    const stockBody = document.getElementById('stockBody');
    const movesBody = document.getElementById('movesBody');

    const paint = () => {
      const products = getProducts();
      productSelect.innerHTML = products
        .map((p) => `<option value="${p.id}">${p.name} (stock ${p.stock})</option>`)
        .join('');

      stockBody.innerHTML = products
        .map(
          (p) => `
        <tr>
          <td>${p.name}</td>
          <td>${p.stock}</td>
          <td>${
            p.stock <= 5
              ? '<span class="status-pill warning">Low stock</span>'
              : '<span class="status-pill">OK</span>'
          }</td>
        </tr>`
        )
        .join('');

      const moves = getMoves().slice(0, 30);
      movesBody.innerHTML = moves.length
        ? moves
            .map(
              (m) => `
          <tr>
            <td>${m.product_name}</td>
            <td>${m.change_qty > 0 ? '+' : ''}${m.change_qty}</td>
            <td>${m.reason}</td>
            <td><small class="muted">${new Date(m.created_at).toLocaleString()}</small></td>
          </tr>`
            )
            .join('')
        : `<tr><td colspan="4" class="muted">No stock movements yet.</td></tr>`;
    };

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const products = getProducts();
      const id = Number(form.product_id.value);
      const qty = Number(form.quantity.value || 0);
      const reason = form.reason.value.trim() || 'Manual adjustment';
      const idx = products.findIndex((p) => p.id === id);
      if (idx < 0 || !qty) {
        toast('Choose a product and quantity.', 'error');
        return;
      }
      const before = Number(products[idx].stock);
      const next = Math.max(0, before + qty);
      const diff = next - before;
      products[idx].stock = next;
      setProducts(products);
      const moves = getMoves();
      moves.unshift({
        id: nextId(moves),
        product_id: id,
        product_name: products[idx].name,
        change_qty: diff,
        reason,
        created_at: new Date().toISOString()
      });
      setMoves(moves);
      form.quantity.value = '';
      form.reason.value = '';
      paint();
      toast('Inventory updated.');
    });

    paint();
  };

  const renderSettings = () => {
    if (!requireAuth()) return;
    setActiveNav('settings');
    bindLogout();

    const form = document.getElementById('settingsForm');
    const settings = getSettings();
    form.store_name.value = settings.store_name;
    form.support_email.value = settings.support_email;
    form.shipping_charge.value = settings.shipping_charge;

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      setSettings({
        store_name: form.store_name.value.trim() || 'POWERVAULT',
        support_email: form.support_email.value.trim(),
        shipping_charge: Number(form.shipping_charge.value || 250)
      });
      toast('Settings saved.');
    });
  };

  const renderLogin = () => {
    if (isAuthed()) {
      window.location.href = 'index.html';
      return;
    }
    const form = document.getElementById('adminLoginForm');
    const notice = document.getElementById('adminLoginError');
    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      const ok = login(form.email.value, form.password.value);
      if (ok) {
        window.location.href = 'index.html';
      } else if (notice) {
        notice.classList.remove('d-none');
        notice.textContent = 'Incorrect email or password.';
      }
    });
  };

  /** Called from store checkout to persist demo orders for admin. */
  const saveStoreOrder = (order) => {
    ensureSeed();
    const orders = getOrders();
    const products = getProducts();
    const id = nextId(orders);
    const record = {
      id,
      order_number: order.order_number || `PV-DEMO-${Date.now().toString().slice(-6)}`,
      created_at: new Date().toISOString(),
      customer_name: order.customer_name,
      phone: order.phone,
      email: order.email || '',
      address: order.address,
      city: order.city,
      payment_method: order.payment_method,
      payment_status:
        order.payment_method === 'cod' ? 'Unpaid' : 'Awaiting manual confirmation',
      payment_sender_name: order.payment_sender_name || '',
      payment_sender_phone: order.payment_sender_phone || '',
      payment_txn_id: order.payment_txn_id || '',
      payment_proof_name: order.payment_proof_name || '',
      subtotal: order.subtotal || 0,
      discount: order.discount || 0,
      shipping: order.shipping || 250,
      total: order.total || 0,
      status: 'Pending',
      tracking_number: '',
      tracking_url: '',
      items: order.items || []
    };
    orders.push(record);
    setOrders(orders);

    (order.items || []).forEach((item) => {
      const idx = products.findIndex((p) => Number(p.id) === Number(item.id));
      if (idx >= 0) {
        products[idx].stock = Math.max(0, Number(products[idx].stock) - Number(item.qty || 0));
      }
    });
    setProducts(products);
    return record;
  };

  window.PVAdmin = {
    DEMO_ADMIN,
    money,
    toast,
    getProducts,
    getOrders,
    getSettings,
    saveStoreOrder,
    renderDashboard,
    renderProducts,
    renderOrders,
    renderInventory,
    renderSettings,
    renderLogin
  };

  document.addEventListener('DOMContentLoaded', () => {
    ensureSeed();
    const page = document.body.getAttribute('data-admin-page');
    if (page === 'login') renderLogin();
    if (page === 'dashboard') renderDashboard();
    if (page === 'products') renderProducts();
    if (page === 'orders') renderOrders();
    if (page === 'inventory') renderInventory();
    if (page === 'settings') renderSettings();
  });
})();
