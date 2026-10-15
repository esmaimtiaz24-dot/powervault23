# POWERVAULT

Premium lighting and power accessories storefront.

## GitHub Pages (static demo)

This repository includes a **static demo** that works on GitHub Pages:

- Home: `index.html`
- Shop / Cart / Login / Checkout: `shop.html`, `cart.html`, `login.html`, `checkout.html`
- Styles: `style.css`, `pages.css`
- Cart demo uses browser `localStorage` (not the PHP database)

### Enable Pages

1. Repo **Settings → Pages**
2. Source: **Deploy from a branch**
3. Branch: `main` / folder: `/ (root)`
4. Save, then visit:  
   `https://esmaimtiaz24-dot.github.io/powervault23/`

> **Important:** GitHub Pages only hosts static files (HTML/CSS/JS).  
> Real PHP login, admin, and database cart **cannot run** on GitHub Pages.  
> Use local XAMPP/WAMP or PHP hosting for the full store.

## Full PHP store (local)

1. Import `database.sql` (or run `setup.php`)
2. Configure `config.php` DB credentials
3. Open `http://localhost/powervault/` on WAMP/XAMPP

Default admin (after setup):

- Email: `admin@powervault.pk`
- Password: `Admin@12345`
