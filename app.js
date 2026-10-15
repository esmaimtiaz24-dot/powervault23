(() => {
  const CART_KEY = 'powervault_cart';
  const SHIPPING = 250;

  const PRODUCTS = {
    1: {
      id: 1,
      name: 'Smart Bicycle Headlight',
      category: 'Bike Lights',
      price: 2499,
      image: 'f77b22d53571463d91aa7141d075ac3a.jpg',
      description: 'Premium bicycle headlight for night rides and city commuting.'
    },
    2: {
      id: 2,
      name: 'Front & Rear Safety Set',
      category: 'Bike Lights',
      price: 3200,
      image: '2824bfbbccdcdd29c4dc5604ca1d7723.jpg',
      description: 'Complete dual light set for maximum road visibility.'
    },
    3: {
      id: 3,
      name: 'Compact Portable Power Bank',
      category: 'Power Banks',
      price: 1699,
      image: 'hero.jpeg',
      description: 'Everyday portable power for phones and accessories.'
    },
    4: {
      id: 4,
      name: 'Rugged Solar Power Bank',
      category: 'Power Banks',
      price: 3999,
      image: '136ea0e628e029f032f540b158a3200e.jpg',
      description: 'Outdoor-ready power bank with solar assist and multi-cable support.'
    },
    5: {
      id: 5,
      name: 'USB Rechargeable Tail Light',
      category: 'Bike Lights',
      price: 1299,
      image: '1545401f1a33bb52e7a4ac5f03d18677.jpg',
      description: 'Bright rear safety light for night commuting.'
    },
    6: {
      id: 6,
      name: 'Magnetic Wireless Power Bank',
      category: 'Power Banks',
      price: 4599,
      image: '918424739554059021ddf39990c0cbd8.jpg',
      description: 'Slim magnetic charging for compatible phones on the go.'
    }
  };

  const money = (n) =>
    'Rs. ' + Number(n).toLocaleString('en-PK', { maximumFractionDigits: 0 });

  const getCart = () => {
    try {
      return JSON.parse(localStorage.getItem(CART_KEY) || '{}') || {};
    } catch {
      return {};
    }
  };

  const setCart = (cart) => {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    updateCartBadges();
  };

  const cartCount = () =>
    Object.values(getCart()).reduce((sum, qty) => sum + Number(qty || 0), 0);

  const updateCartBadges = () => {
    const count = cartCount();
    document.querySelectorAll('[data-cart-count]').forEach((el) => {
      el.textContent = String(count);
    });
  };

  const addToCart = (id, qty = 1) => {
    const product = PRODUCTS[id];
    if (!product) return;
    const cart = getCart();
    cart[id] = Math.min(99, (Number(cart[id]) || 0) + qty);
    setCart(cart);
  };

  const toast = (message) => {
    let el = document.getElementById('pvToast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'pvToast';
      el.className = 'pv-toast';
      document.body.appendChild(el);
    }
    el.textContent = message;
    el.classList.add('is-visible');
    clearTimeout(el._timer);
    el._timer = setTimeout(() => el.classList.remove('is-visible'), 1800);
  };

  const renderCartPage = () => {
    const root = document.getElementById('cartRoot');
    if (!root) return;

    const cart = getCart();
    const items = Object.entries(cart)
      .map(([id, qty]) => {
        const product = PRODUCTS[id];
        if (!product || qty < 1) return null;
        return { ...product, qty: Number(qty), line: product.price * Number(qty) };
      })
      .filter(Boolean);

    if (!items.length) {
      root.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">⌑</div>
          <h2>Your cart is waiting.</h2>
          <p>Add a product from the shop to get started.</p>
          <a class="btn btn-neon mt-3" href="shop.html">Explore Products</a>
        </div>`;
      return;
    }

    const subtotal = items.reduce((sum, item) => sum + item.line, 0);

    root.innerHTML = `
      <div class="row g-4">
        <div class="col-lg-8" id="cartItems">
          ${items
            .map(
              (item) => `
            <div class="cart-row" data-id="${item.id}">
              <div class="cart-thumb">
                <img src="${item.image}" alt="${item.name}">
              </div>
              <div class="cart-item-copy">
                <h3>${item.name}</h3>
                <p>${item.category}</p>
                <strong>${money(item.price)}</strong>
              </div>
              <div class="cart-qty">
                <label>Qty</label>
                <input type="number" min="1" max="99" value="${item.qty}" class="form-control cart-qty-input" data-id="${item.id}">
              </div>
              <div class="cart-line">
                ${money(item.line)}
                <button type="button" class="remove-link" data-remove="${item.id}">Remove</button>
              </div>
            </div>`
            )
            .join('')}
        </div>
        <div class="col-lg-4">
          <div class="summary-card sticky-summary">
            <h3>Order Summary</h3>
            <div class="summary-line"><span>Subtotal</span><b>${money(subtotal)}</b></div>
            <div class="summary-line"><span>Shipping</span><b>${money(SHIPPING)}</b></div>
            <div class="summary-line total"><span>Estimated total</span><b>${money(subtotal + SHIPPING)}</b></div>
            <p class="muted small">Demo cart runs in your browser. Full checkout works on PHP hosting.</p>
            <a class="btn btn-neon w-100" href="checkout.html">Proceed to Checkout →</a>
          </div>
        </div>
      </div>`;

    root.querySelectorAll('.cart-qty-input').forEach((input) => {
      input.addEventListener('change', () => {
        const id = input.getAttribute('data-id');
        const qty = Math.max(1, Math.min(99, Number(input.value) || 1));
        const next = getCart();
        next[id] = qty;
        setCart(next);
        renderCartPage();
      });
    });

    root.querySelectorAll('[data-remove]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-remove');
        const next = getCart();
        delete next[id];
        setCart(next);
        renderCartPage();
        toast('Item removed from cart.');
      });
    });
  };

  const renderCheckoutPage = () => {
    const summary = document.getElementById('checkoutSummary');
    const form = document.getElementById('checkoutForm');
    if (!summary || !form) return;

    const cart = getCart();
    const items = Object.entries(cart)
      .map(([id, qty]) => {
        const product = PRODUCTS[id];
        if (!product || qty < 1) return null;
        return { ...product, qty: Number(qty), line: product.price * Number(qty) };
      })
      .filter(Boolean);

    if (!items.length) {
      summary.innerHTML = `
        <div class="empty-state">
          <h2>Cart is empty</h2>
          <p>Add products before checkout.</p>
          <a class="btn btn-neon mt-3" href="shop.html">Go to Shop</a>
        </div>`;
      form.classList.add('d-none');
      return;
    }

    const subtotal = items.reduce((sum, item) => sum + item.line, 0);
    summary.innerHTML = `
      <div class="summary-card sticky-summary">
        <h3>Order Summary</h3>
        ${items
          .map(
            (item) => `
          <div class="summary-line">
            <span>${item.name} × ${item.qty}</span>
            <b>${money(item.line)}</b>
          </div>`
          )
          .join('')}
        <div class="summary-line"><span>Shipping</span><b>${money(SHIPPING)}</b></div>
        <div class="summary-line total"><span>Total</span><b>${money(subtotal + SHIPPING)}</b></div>
      </div>`;

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      localStorage.removeItem(CART_KEY);
      updateCartBadges();
      window.location.href = 'order-success.html';
    });
  };

  const bindShop = () => {
    document.querySelectorAll('[data-add-cart]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = Number(btn.getAttribute('data-add-cart'));
        addToCart(id, 1);
        toast('Added to cart.');
      });
    });

    const searchInput = document.getElementById('shopSearch');
    const clearBtn = document.getElementById('shopClear');
    const cards = [...document.querySelectorAll('[data-product-card]')];
    const resultText = document.getElementById('shopResultText');

    const applySearch = () => {
      const q = (searchInput?.value || '').trim().toLowerCase();
      let visible = 0;
      cards.forEach((card) => {
        const hay = (card.getAttribute('data-search') || '').toLowerCase();
        const show = !q || hay.includes(q);
        card.classList.toggle('d-none', !show);
        if (show) visible += 1;
      });
      if (resultText) {
        resultText.textContent = q
          ? `${visible} product${visible === 1 ? '' : 's'} found for "${searchInput.value.trim()}".`
          : `${visible} products in the collection.`;
      }
      if (clearBtn) clearBtn.classList.toggle('d-none', !q);
    };

    searchInput?.addEventListener('input', applySearch);
    document.getElementById('shopSearchBtn')?.addEventListener('click', applySearch);
    clearBtn?.addEventListener('click', () => {
      if (searchInput) searchInput.value = '';
      applySearch();
    });
  };

  const bindLogin = () => {
    const form = document.getElementById('loginForm');
    const notice = document.getElementById('loginNotice');
    if (!form) return;
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      if (notice) {
        notice.classList.remove('d-none');
        notice.textContent =
          'This GitHub Pages demo cannot verify accounts. Full login works on your WAMP/PHP host.';
      }
    });
  };

  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.reveal').forEach((el, i) => {
      el.style.animationDelay = `${i * 0.12}s`;
    });
    updateCartBadges();
    bindShop();
    renderCartPage();
    renderCheckoutPage();
    bindLogin();
  });

  window.PV = { PRODUCTS, getCart, addToCart, money, cartCount };
})();
