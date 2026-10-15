
<?php
require_once __DIR__ . '/config.php';

$pageTitle = 'Power Up Your Ride';

try {
    $products = db()->query(
        "SELECT * FROM products
         WHERE active=1
         ORDER BY featured DESC, id ASC
         LIMIT 6"
    )->fetchAll();
} catch (Throwable $ex) {
    $products = [];
}

require __DIR__ . '/includes/header.php';
?>

<style>
/* Uploaded product images */
.product-card .product-art {
    position: relative;
    display: block;
    overflow: hidden;
    min-height: 240px;
    background: #06111d;
    border-radius: 18px;
    text-decoration: none;
}

.product-card .product-image {
    position: relative;
    z-index: 1;
    display: block;
    width: 100%;
    height: 250px;
    object-fit: cover;
    object-position: center;
    padding: 0;
    transition: transform .35s ease;
}

.product-card:hover .product-image {
    transform: scale(1.06);
}

.product-card .product-placeholder {
    position: relative;
    z-index: 1;
    margin: 40px auto;
}

.product-card .product-badge {
    z-index: 2;
}

@media (max-width: 575px) {
    .product-card .product-art {
        min-height: 220px;
    }

    .product-card .product-image {
        height: 220px;
    }
}
</style>

<section class="hero-section">
    <img
        class="hero-bg"
        src="/powervault/assets/images/hero-powerbank.jpg"
        alt=""
        aria-hidden="true">
    <div class="hero-bg-shade"></div>

    <div class="container hero-grid">
        <div class="hero-copy reveal">
            <div class="eyebrow">
                <span class="pulse-dot"></span>
                POWERVAULT PREMIUM COLLECTION
            </div>

            <h1>SEE MORE.<br>RIDE <span class="gradient-text">SAFER.</span></h1>

            <p>
                Discover premium lighting and power accessories designed
                for visibility, reliability and everyday performance.
            </p>

            <div class="hero-actions">
                <a class="btn btn-neon" href="/powervault/shop.php">
                    Shop Collection <span>→</span>
                </a>
                <a class="btn btn-outline-glow" href="#features">
                    Explore Features
                </a>
            </div>

            <div class="hero-stats">
                <div>
                    <strong>Premium</strong>
                    <span>Build Quality</span>
                </div>
                <div>
                    <strong>Bright</strong>
                    <span>Illumination</span>
                </div>
                <div>
                    <strong>Everyday</strong>
                    <span>Reliable Power</span>
                </div>
            </div>
        </div>
    </div>
</section>

<section class="benefits">
    <div class="container benefits-grid">
        <div>
            <span class="benefit-icon">↗</span>
            <span><b>Reliable Delivery</b><small>TCS courier support</small></span>
        </div>
        <div>
            <span class="benefit-icon">⌁</span>
            <span><b>Secure Ordering</b><small>Order records stored safely</small></span>
        </div>
        <div>
            <span class="benefit-icon">ϟ</span>
            <span><b>Flexible Payments</b><small>COD, Easypaisa &amp; JazzCash</small></span>
        </div>
        <div>
            <span class="benefit-icon">◎</span>
            <span><b>Customer Support</b><small>WhatsApp and email</small></span>
        </div>
    </div>
</section>

<section class="section-pad" id="products">
    <div class="container">

        <div class="section-heading">
            <div>
                <div class="eyebrow">THE COLLECTION</div>
                <h2>Featured <span class="gradient-text">Products</span></h2>
                <p>
                    Explore our collection of premium accessories.
                    Product images and prices are managed by the administrator.
                </p>
            </div>

            <a href="/powervault/shop.php" class="text-link">
                View all products ↗
            </a>
        </div>

        <div class="row g-4">

            <?php foreach ($products as $p): ?>
                <?php
                $imageName = basename($p['image'] ?? '');
                $imagePath = __DIR__ . '/uploads/products/' . $imageName;
                $imageUrl = '/powervault/uploads/products/'
                    . rawurlencode($imageName);

                $hasImage = $imageName !== ''
                    && is_file($imagePath);
                ?>

                <div class="col-12 col-sm-6 col-lg-4">
                    <div class="product-card">

                        <a
                            class="product-art"
                            href="/powervault/product.php?id=<?= (int)$p['id'] ?>"
                            aria-label="View <?= e($p['name']) ?>">

                            <div class="art-glow"></div>

                            <?php if ($hasImage): ?>
                                <img
                                    class="product-image"
                                    src="<?= e($imageUrl) ?>"
                                    alt="<?= e($p['name']) ?>"
                                    loading="lazy">
                            <?php else: ?>
                                <div class="product-placeholder">
                                    <span class="device-screen"></span>
                                    <span class="device-port"></span>
                                    <span class="device-bolt">ϟ</span>
                                </div>
                            <?php endif; ?>

                            <span class="product-badge">POWERVAULT</span>
                        </a>

                        <div class="product-info">

                            <div class="product-category">
                                <?= e($p['category'] ?: 'TECH ACCESSORY') ?>
                            </div>

                            <h3><?= e($p['name']) ?></h3>

                            <p>
                                <?= e(
                                    $p['description']
                                    ?: 'Premium accessory. Details coming soon.'
                                ) ?>
                            </p>

                            <div class="product-bottom">
                                <strong>
                                    <?= $p['price'] === null
                                        || $p['price'] === ''
                                        ? 'Price not set'
                                        : money($p['price']) ?>
                                </strong>

                                <a
                                    class="btn-mini"
                                    href="/powervault/product.php?id=<?= (int)$p['id'] ?>">
                                    View ↗
                                </a>
                            </div>

                            <?php if (
                                $p['price'] !== null &&
                                (float)$p['price'] > 0 &&
                                (int)$p['stock'] > 0
                            ): ?>
                                <form
                                    method="post"
                                    action="/powervault/cart.php"
                                    class="mt-3">

                                    <input type="hidden" name="csrf"
                                           value="<?= e(csrf_token()) ?>">
                                    <input type="hidden" name="action"
                                           value="add">
                                    <input type="hidden" name="product_id"
                                           value="<?= (int)$p['id'] ?>">

                                    <button type="submit"
                                            class="btn btn-neon w-100">
                                        Add to Cart
                                    </button>
                                </form>
                            <?php else: ?>
                                <button class="btn btn-disabled w-100 mt-3"
                                        disabled>
                                    <?= (int)$p['stock'] === 0
                                        ? 'Out of Stock'
                                        : 'Price Not Set' ?>
                                </button>
                            <?php endif; ?>

                        </div>
                    </div>
                </div>
            <?php endforeach; ?>

            <?php if (!$products): ?>
                <div class="col-12">
                    <div class="empty-state">
                        Products will appear here after database setup.
                        Run setup.php and import database.sql.
                    </div>
                </div>
            <?php endif; ?>

        </div>
    </div>
</section>

<section class="feature-band" id="features">
    <div class="container feature-inner">
        <div>
            <div class="eyebrow">WHY POWERVAULT</div>
            <h2>
                Designed for your<br>
                <span class="gradient-text">everyday momentum.</span>
            </h2>
            <p>
                Clean design, dependable support and a smooth shopping
                experience—from browsing to delivery.
            </p>
        </div>

        <div class="feature-cards">
            <div class="feature-tile">
                <span>ϟ</span>
                <h3>Modern Design</h3>
                <p>Premium dark interface with electric-blue accents.</p>
            </div>

            <div class="feature-tile">
                <span>◈</span>
                <h3>Easy Checkout</h3>
                <p>Cart, shipping details and payment options in one flow.</p>
            </div>

            <div class="feature-tile">
                <span>◎</span>
                <h3>Helpful Support</h3>
                <p>Reach the team through WhatsApp or email.</p>
            </div>
        </div>
    </div>
</section>

<section class="section-pad payment-strip">
    <div class="container">
        <div class="payment-intro">
            <div class="eyebrow">POWERVAULT.PK</div>
            <h2>Payment &amp; Delivery <span class="gradient-text">Options</span></h2>
            <p>Choose your preferred payment &amp; delivery method</p>
        </div>

        <div class="payment-methods">
            <article class="payment-card">
                <span class="payment-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M19 7V6a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v1"/><rect width="20" height="14" x="2" y="7" rx="2"/><path d="M12 12h.01"/><path d="M16 12a4 4 0 0 1-8 0"/></svg>
                </span>
                <div>
                    <h3>EP • Easypaisa</h3>
                    <p>Pay at Checkout</p>
                </div>
            </article>

            <article class="payment-card">
                <span class="payment-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="20" x="5" y="2" rx="2"/><path d="M12 18h.01"/></svg>
                </span>
                <div>
                    <h3>JC • JazzCash</h3>
                    <p>Pay at Checkout</p>
                </div>
            </article>

            <article class="payment-card">
                <span class="payment-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M11 15h2a2 2 0 1 0 0-4h-3c-.6 0-1.1.2-1.4.6L3 17"/><path d="m7 21 1.6-1.4c.3-.4.8-.6 1.2-.6h4c1.1 0 2.1-.4 2.8-1.2l4.6-4.4a2 2 0 0 0-2.75-2.91l-4.2 3.9"/><path d="m2 16 6 6"/><circle cx="16" cy="6" r="1"/><circle cx="19" cy="9" r="1"/><circle cx="13" cy="5" r="1"/></svg>
                </span>
                <div>
                    <h3>COD • Cash on Delivery</h3>
                    <p>Pay on Delivery</p>
                </div>
            </article>

            <article class="payment-card">
                <span class="payment-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.62l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/></svg>
                </span>
                <div>
                    <h3>FS • Fast Shipping</h3>
                    <p>Delivery in 2–3 Days via TCS &amp; Leopards</p>
                </div>
            </article>
        </div>

        <p class="payment-trust">
            <span>✓</span> Secure Checkout • Trusted by Pakistan Customers
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M12 2 4 5v6c0 5.2 3.4 10 8 11 4.6-1 8-5.8 8-11V5l-8-3zm-1.2 14.4-3.5-3.5 1.4-1.4 2.1 2.1 4.5-4.5 1.4 1.4-5.9 5.9z"/></svg>
        </p>
    </div>
</section>

<?php require __DIR__ . '/includes/footer.php'; ?>
