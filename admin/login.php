<?php require_once __DIR__ . '/../config.php';
if (user() && user()['role'] === 'admin') {
    header('Location: /powervault/admin/');
    exit;
}
$error = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    csrf_check();
    $s = db()->prepare("SELECT * FROM users WHERE email=? AND role='admin'");
    $s->execute([strtolower(trim($_POST['email'] ?? ''))]);
    $u = $s->fetch();
    if ($u && password_verify($_POST['password'] ?? '', $u['password_hash'])) {
        session_regenerate_id(true);
        $_SESSION['user'] = ['id' => (int) $u['id'], 'name' => $u['name'], 'email' => $u['email'], 'role' => 'admin'];
        header('Location: /powervault/admin/');
        exit;
    } else
        $error = 'Invalid admin credentials.';
}
$pageTitle = 'Admin Login';
require __DIR__ . '/../includes/header.php'; ?>
<section class="section-pad">
    <div class="container auth-wrap">
        <form method="post" class="form-panel auth-card">
            <div class="eyebrow">RESTRICTED ACCESS</div>
            <h1>Admin <span class="gradient-text">Portal</span></h1>
            <p class="muted">Sign in to manage products, inventory and orders.</p>
            <?= $error ? '<div class="alert error">' . e($error) . '</div>' : '' ?><input type="hidden" name="csrf"
                value="<?= e(csrf_token()) ?>"><label class="form-label">Admin Email</label><input
                class="form-control mb-3" name="email" type="email" required><label
                class="form-label">Password</label><input class="form-control mb-4" name="password" type="password"
                required><button class="btn btn-neon w-100">Access Dashboard</button>
        </form>
    </div>
</section><?php require __DIR__ . '/../includes/footer.php'; ?>