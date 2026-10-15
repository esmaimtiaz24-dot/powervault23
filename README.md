# POWERVAULT

Premium lighting and power accessories storefront.

## GitHub Pages (static demo)

This repository includes a **static demo** that works on GitHub Pages:

- Home: `index.html`
- Shop / Cart / Login / Checkout / Product: `shop.html`, `cart.html`, `login.html`, `checkout.html`, `product.html?id=1`
- Admin demo (JS): `admin/login.html` → dashboard, products, orders, inventory, settings
- Styles: `style.css`, `pages.css`
- Cart / admin data use browser `localStorage` (not the PHP database)

Demo admin login: `admin@powervault.pk` / `Admin@12345`

### Enable Pages

1. Repo **Settings → Pages**
2. Source: **Deploy from a branch**
3. Branch: `main` / folder: `/ (root)`
4. Save, then visit:  
   `https://esmaimtiaz24-dot.github.io/powervault23/`

> **Important:** GitHub Pages only hosts static files (HTML/CSS/JS).  
> The JS admin/cart demo works on GitHub Pages.  
> Real PHP + MySQL (server-side auth, uploads, email) still needs WAMP/PHP hosting.

## Full PHP store (local)

1. Import `database.sql` (or run `setup.php`)
2. Configure `config.php` DB credentials
3. Open `http://localhost/powervault/` on WAMP/XAMPP

Default admin (after setup):

- Email: `admin@powervault.pk`
- Password: `Admin@12345`
