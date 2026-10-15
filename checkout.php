<?php
require_once __DIR__ . '/config.php';

$cart = $_SESSION['cart'] ?? [];
$items = [];
$subtotal = 0;

if ($cart) {
    $ids = array_map('intval', array_keys($cart));
    $in = implode(',', array_fill(0, count($ids), '?'));
    $s = db()->prepare("SELECT * FROM products WHERE id IN ($in) AND active=1");
    $s->execute($ids);
    foreach ($s->fetchAll() as $p) {
        $qty = min((int)$cart[$p['id']], (int)$p['stock']);
        if ($p['price'] !== null && (float)$p['price'] > 0 && $qty > 0) {
            $p['qty'] = $qty;
            $p['line'] = (float)$p['price'] * $qty;
            $subtotal += $p['line'];
            $items[] = $p;
        }
    }
}

if (!$items) {
    flash('Add available products to your cart before checkout.', 'error');
    header('Location: /powervault/cart.php');
    exit;
}

$error = '';
$post = $_POST;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    csrf_check();

    $name = trim($post['name'] ?? '');
    $phone = trim($post['phone'] ?? '');
    $email = trim($post['email'] ?? '');
    $address = trim($post['address'] ?? '');
    $city = trim($post['city'] ?? '');
    $postal = trim($post['postal'] ?? '');
    $notes = trim($post['notes'] ?? '');
    $payment = $post['payment'] ?? 'cod';

    $senderName = trim($post['payment_sender_name'] ?? '');
    $senderPhone = trim($post['payment_sender_phone'] ?? '');
    $txnId = trim($post['payment_txn_id'] ?? '');
    $proofName = null;

    $walletMethods = ['easypaisa', 'jazzcash'];

    if (!$name || !$phone || !filter_var($email, FILTER_VALIDATE_EMAIL) || !$address || !$city) {
        $error = 'Please complete all required shipping fields and enter a valid email.';
    } elseif (!in_array($payment, ['cod', 'easypaisa', 'jazzcash'], true)) {
        $error = 'Choose a valid payment method.';
    } elseif (in_array($payment, $walletMethods, true)) {
        if (!$senderName || !$senderPhone || !$txnId) {
            $error = 'Enter your wallet account name, registered phone number, and transaction ID.';
        } elseif (!isset($_FILES['payment_proof']) || ($_FILES['payment_proof']['error'] ?? UPLOAD_ERR_NO_FILE) === UPLOAD_ERR_NO_FILE) {
            $error = 'Please upload your payment screenshot / receipt.';
        } else {
            $file = $_FILES['payment_proof'];
            if (($file['error'] ?? UPLOAD_ERR_OK) !== UPLOAD_ERR_OK) {
                $error = 'Payment screenshot upload failed. Please try again.';
            } else {
                $finfo = new finfo(FILEINFO_MIME_TYPE);
                $mime = $finfo->file($file['tmp_name']) ?: '';
                $allowed = [
                    'image/jpeg' => 'jpg',
                    'image/png' => 'png',
                    'image/webp' => 'webp',
                    'application/pdf' => 'pdf',
                ];
                if (!isset($allowed[$mime])) {
                    $error = 'Payment proof must be JPG, PNG, WEBP or PDF.';
                } elseif (($file['size'] ?? 0) > 5 * 1024 * 1024) {
                    $error = 'Payment proof must be under 5MB.';
                } else {
                    $dir = __DIR__ . '/uploads/payments';
                    if (!is_dir($dir)) {
                        mkdir($dir, 0775, true);
                    }
                    $proofName = 'pay_' . date('ymdHis') . '_' . bin2hex(random_bytes(4)) . '.' . $allowed[$mime];
                    if (!move_uploaded_file($file['tmp_name'], $dir . '/' . $proofName)) {
                        $error = 'Could not save payment screenshot. Check folder permissions.';
                        $proofName = null;
                    }
                }
            }
        }
    }

    if ($error === '') {
        try {
            $pdo = db();
            $pdo->beginTransaction();

            $ids = array_map(fn($i) => (int)$i['id'], $items);
            $in = implode(',', array_fill(0, count($ids), '?'));
            $lock = $pdo->prepare("SELECT * FROM products WHERE id IN ($in) AND active=1 FOR UPDATE");
            $lock->execute($ids);

            $fresh = [];
            $freshSubtotal = 0;
            foreach ($lock->fetchAll() as $p) {
                $qty = (int)($cart[$p['id']] ?? 0);
                if ($p['price'] === null || (float)$p['price'] <= 0 || $qty < 1 || (int)$p['stock'] < $qty) {
                    throw new RuntimeException('A product price or stock changed. Please review your cart.');
                }
                $p['qty'] = $qty;
                $p['line'] = (float)$p['price'] * $qty;
                $freshSubtotal += $p['line'];
                $fresh[] = $p;
            }

            if (count($fresh) !== count($cart)) {
                throw new RuntimeException('One or more cart items are no longer available.');
            }

            $discount = in_array($payment, $walletMethods, true)
                ? round($freshSubtotal * 0.03, 2)
                : 0;
            $shipping = (float)SHIPPING_CHARGE;
            $total = max(0, $freshSubtotal - $discount + $shipping);
            $orderNo = 'PV-' . date('ymd') . '-' . strtoupper(bin2hex(random_bytes(3)));
            $payStatus = $payment === 'cod' ? 'Unpaid' : 'Awaiting manual confirmation';

            $ins = $pdo->prepare(
                'INSERT INTO orders(
                    order_number,user_id,customer_name,phone,email,address,city,postal_code,notes,
                    payment_method,subtotal,discount,shipping,total,status,payment_status,
                    payment_sender_name,payment_sender_phone,payment_txn_id,payment_proof
                ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)'
            );
            $ins->execute([
                $orderNo,
                user()['id'] ?? null,
                $name,
                $phone,
                $email,
                $address,
                $city,
                $postal,
                $notes,
                $payment,
                $freshSubtotal,
                $discount,
                $shipping,
                $total,
                'Pending',
                $payStatus,
                in_array($payment, $walletMethods, true) ? $senderName : null,
                in_array($payment, $walletMethods, true) ? $senderPhone : null,
                in_array($payment, $walletMethods, true) ? $txnId : null,
                $proofName,
            ]);

            $orderId = (int)$pdo->lastInsertId();
            $oi = $pdo->prepare('INSERT INTO order_items(order_id,product_id,product_name,unit_price,quantity,line_total) VALUES(?,?,?,?,?,?)');
            $up = $pdo->prepare('UPDATE products SET stock=stock-? WHERE id=? AND stock>=?');
            $im = $pdo->prepare('INSERT INTO inventory_movements(product_id,change_qty,reason,reference_id) VALUES(?,?,?,?)');

            foreach ($fresh as $p) {
                $oi->execute([$orderId, $p['id'], $p['name'], $p['price'], $p['qty'], $p['line']]);
                $up->execute([$p['qty'], $p['id'], $p['qty']]);
                if (!$up->rowCount()) {
                    throw new RuntimeException('Stock changed. Please retry.');
                }
                $im->execute([$p['id'], -$p['qty'], 'Order placed', $orderNo]);
            }

            $pdo->commit();
            unset($_SESSION['cart']);

            $_SESSION['last_order'] = [
                'id' => $orderId,
                'number' => $orderNo,
                'name' => $name,
                'phone' => $phone,
                'email' => $email,
                'address' => $address . ', ' . $city,
                'payment' => $payment,
                'subtotal' => $freshSubtotal,
                'discount' => $discount,
                'shipping' => $shipping,
                'total' => $total,
                'items' => $fresh,
                'txn_id' => $txnId,
            ];

            $msg = "POWERVAULT ORDER $orderNo\nCustomer: $name\nPhone: $phone\nAddress: $address, $city\nPayment: $payment\n";
            if (in_array($payment, $walletMethods, true)) {
                $msg .= "Wallet Name: $senderName\nWallet Phone: $senderPhone\nTxn ID: $txnId\n";
            }
            foreach ($fresh as $p) {
                $msg .= $p['name'] . ' x ' . $p['qty'] . ' = Rs. ' . number_format($p['line'], 2) . "\n";
            }
            $msg .= 'Subtotal: Rs. ' . number_format($freshSubtotal, 2)
                . "\nDiscount: Rs. " . number_format($discount, 2)
                . "\nShipping: Rs. " . number_format($shipping, 2)
                . "\nTOTAL: Rs. " . number_format($total, 2);

            $_SESSION['whatsapp_message'] = $msg;

            $subject = 'POWERVAULT Order ' . $orderNo;
            $body = "New order: $orderNo\nCustomer: $name\nPhone: $phone\nEmail: $email\nAddress: $address, $city\nPayment: $payment\nTotal: Rs. "
                . number_format($total, 2) . "\n\n$msg";
            $headers = 'From: ' . SUPPORT_EMAIL . "\r\nReply-To: $email";
            @mail(SUPPORT_EMAIL, $subject, $body, $headers);
            @mail($email, 'Your POWERVAULT order ' . $orderNo, $body, 'From: ' . SUPPORT_EMAIL);

            header('Location: /powervault/order-success.php');
            exit;
        } catch (Throwable $ex) {
            if (db()->inTransaction()) {
                db()->rollBack();
            }
            if ($proofName) {
                @unlink(__DIR__ . '/uploads/payments/' . $proofName);
            }
            $error = $ex instanceof RuntimeException
                ? $ex->getMessage()
                : 'Order could not be saved. Check database setup and try again.';
        }
    }
}

$selectedPayment = $post['payment'] ?? 'cod';
$pageTitle = 'Checkout';
require __DIR__ . '/includes/header.php';
?>

<section class="page-hero compact">
    <div class="container">
        <div class="eyebrow">ALMOST THERE</div>
        <h1>Secure <span class="gradient-text">Checkout</span></h1>
        <p>Enter your delivery details and select a payment method.</p>
    </div>
</section>

<section class="section-pad">
    <div class="container">
        <form method="post" enctype="multipart/form-data" class="row g-4 checkout-form">
            <input type="hidden" name="csrf" value="<?= e(csrf_token()) ?>">

            <div class="col-lg-7">
                <div class="form-panel">
                    <h2>Shipping Information</h2>
                    <?= $error ? '<div class="alert error">' . e($error) . '</div>' : '' ?>

                    <div class="row g-3">
                        <div class="col-12">
                            <label class="form-label">Full Name *</label>
                            <input class="form-control" name="name" required
                                   value="<?= e($post['name'] ?? user()['name'] ?? '') ?>">
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">Phone Number *</label>
                            <input class="form-control" name="phone" required
                                   value="<?= e($post['phone'] ?? '') ?>"
                                   placeholder="03XXXXXXXXX">
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">Email *</label>
                            <input type="email" class="form-control" name="email" required
                                   value="<?= e($post['email'] ?? user()['email'] ?? '') ?>">
                        </div>
                        <div class="col-12">
                            <label class="form-label">Complete Address *</label>
                            <textarea class="form-control" name="address" rows="2" required><?= e($post['address'] ?? '') ?></textarea>
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">City *</label>
                            <input class="form-control" name="city" required
                                   value="<?= e($post['city'] ?? '') ?>">
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">Postal Code</label>
                            <input class="form-control" name="postal"
                                   value="<?= e($post['postal'] ?? '') ?>">
                        </div>
                        <div class="col-12">
                            <label class="form-label">Order Notes</label>
                            <textarea class="form-control" name="notes" rows="2"><?= e($post['notes'] ?? '') ?></textarea>
                        </div>
                    </div>
                </div>

                <div class="form-panel mt-4">
                    <h2>Payment Method</h2>

                    <label class="payment-option">
                        <input type="radio" name="payment" value="cod"
                            <?= $selectedPayment === 'cod' ? 'checked' : '' ?>>
                        <span>
                            <b>Cash on Delivery</b>
                            <small>Pay when your order arrives. No online transfer needed.</small>
                        </span>
                    </label>

                    <label class="payment-option">
                        <input type="radio" name="payment" value="easypaisa"
                            <?= $selectedPayment === 'easypaisa' ? 'checked' : '' ?>>
                        <span>
                            <b>Easypaisa · <?= e(EASYPAISA_NUMBER) ?></b>
                            <small>Send via Easypaisa using your registered mobile number. 3% discount. No card details required.</small>
                        </span>
                    </label>

                    <label class="payment-option">
                        <input type="radio" name="payment" value="jazzcash"
                            <?= $selectedPayment === 'jazzcash' ? 'checked' : '' ?>>
                        <span>
                            <b>JazzCash · <?= e(JAZZCASH_NUMBER) ?></b>
                            <small>Send via JazzCash using your registered mobile number. 3% discount. No card details required.</small>
                        </span>
                    </label>

                    <div id="walletPaymentFields" class="wallet-payment-panel<?= in_array($selectedPayment, ['easypaisa', 'jazzcash'], true) ? ' is-open' : '' ?>">
                        <div class="wallet-help">
                            <strong id="walletTitle">Mobile Wallet Payment</strong>
                            <p id="walletHelpText">
                                Send the order total to our wallet number from your JazzCash / Easypaisa account
                                (registered phone number). Then enter the transaction details and upload the payment screenshot.
                            </p>
                            <div class="wallet-numbers">
                                <span><b>Easypaisa</b> <?= e(EASYPAISA_NUMBER) ?></span>
                                <span><b>JazzCash</b> <?= e(JAZZCASH_NUMBER) ?></span>
                            </div>
                        </div>

                        <div class="row g-3">
                            <div class="col-md-6">
                                <label class="form-label">Account Holder Name *</label>
                                <input class="form-control" name="payment_sender_name" id="payment_sender_name"
                                       value="<?= e($post['payment_sender_name'] ?? '') ?>"
                                       placeholder="Name on JazzCash / Easypaisa">
                            </div>
                            <div class="col-md-6">
                                <label class="form-label">Registered Wallet Phone *</label>
                                <input class="form-control" name="payment_sender_phone" id="payment_sender_phone"
                                       value="<?= e($post['payment_sender_phone'] ?? '') ?>"
                                       placeholder="03XXXXXXXXX">
                            </div>
                            <div class="col-12">
                                <label class="form-label">Transaction ID (TID) *</label>
                                <input class="form-control" name="payment_txn_id" id="payment_txn_id"
                                       value="<?= e($post['payment_txn_id'] ?? '') ?>"
                                       placeholder="e.g. 123456789012">
                            </div>
                            <div class="col-12">
                                <label class="form-label">Payment Screenshot / Receipt *</label>
                                <input class="form-control" type="file" name="payment_proof" id="payment_proof"
                                       accept="image/jpeg,image/png,image/webp,application/pdf">
                                <small class="muted d-block mt-2">
                                    Upload JPG, PNG, WEBP or PDF (max 5MB). This helps us verify your transfer quickly.
                                </small>
                            </div>
                        </div>
                    </div>

                    <p class="muted small mt-3">Courier: TCS. Orders are saved before notifications are attempted.</p>
                </div>
            </div>

            <div class="col-lg-5">
                <div class="summary-card sticky-summary">
                    <h3>Order Summary</h3>
                    <?php foreach ($items as $it): ?>
                        <div class="summary-line">
                            <span><?= e($it['name']) ?> × <?= (int)$it['qty'] ?></span>
                            <b><?= money($it['line']) ?></b>
                        </div>
                    <?php endforeach; ?>
                    <hr>
                    <div class="summary-line"><span>Subtotal</span><b><?= money($subtotal) ?></b></div>
                    <div class="summary-line"><span>Online discount</span><b id="discountPreview">Rs. 0.00</b></div>
                    <div class="summary-line"><span>Shipping</span><b><?= money(SHIPPING_CHARGE) ?></b></div>
                    <div class="summary-line total"><span>Total</span><b id="totalPreview"><?= money($subtotal + SHIPPING_CHARGE) ?></b></div>
                    <p class="muted small">
                        Easypaisa/JazzCash orders receive a 3% discount. Payment is confirmed manually after you send from your registered wallet number.
                    </p>
                    <button class="btn btn-neon w-100 mt-3">Place Order Securely →</button>
                </div>
            </div>
        </form>
    </div>
</section>

<script>
window.PV_CHECKOUT = {
    subtotal: <?= json_encode($subtotal) ?>,
    shipping: <?= json_encode((float)SHIPPING_CHARGE) ?>,
    easypaisa: <?= json_encode(EASYPAISA_NUMBER) ?>,
    jazzcash: <?= json_encode(JAZZCASH_NUMBER) ?>
};
</script>

<?php require __DIR__ . '/includes/footer.php'; ?>
