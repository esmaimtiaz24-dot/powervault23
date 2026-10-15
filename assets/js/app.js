document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.reveal').forEach((el, i) => {
    el.style.animationDelay = (i * 0.12) + 's';
  });

  const checkout = window.PV_CHECKOUT;
  if (!checkout) return;

  const radios = document.querySelectorAll('input[name="payment"]');
  const panel = document.getElementById('walletPaymentFields');
  const title = document.getElementById('walletTitle');
  const help = document.getElementById('walletHelpText');
  const fields = [
    document.getElementById('payment_sender_name'),
    document.getElementById('payment_sender_phone'),
    document.getElementById('payment_txn_id'),
    document.getElementById('payment_proof'),
  ];

  const fmt = (n) =>
    'Rs. ' +
    Number(n).toLocaleString('en-PK', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const update = () => {
    const method =
      document.querySelector('input[name="payment"]:checked')?.value || 'cod';
    const isWallet = method === 'easypaisa' || method === 'jazzcash';
    const disc = isWallet
      ? Math.round(checkout.subtotal * 0.03 * 100) / 100
      : 0;

    const d = document.getElementById('discountPreview');
    const t = document.getElementById('totalPreview');
    if (d) d.textContent = fmt(disc);
    if (t) t.textContent = fmt(checkout.subtotal - disc + checkout.shipping);

    if (panel) {
      panel.classList.toggle('is-open', isWallet);
    }

    fields.forEach((el) => {
      if (!el) return;
      el.required = isWallet;
      if (!isWallet && el.type !== 'file') {
        // keep values for UX if user switches back
      }
    });

    if (title && help) {
      if (method === 'easypaisa') {
        title.textContent = 'Easypaisa Payment Details';
        help.textContent =
          'Send the discounted total to ' +
          checkout.easypaisa +
          ' from your Easypaisa account using your registered phone number. No card details are needed. Then enter your account details and upload the payment screenshot.';
      } else if (method === 'jazzcash') {
        title.textContent = 'JazzCash Payment Details';
        help.textContent =
          'Send the discounted total to ' +
          checkout.jazzcash +
          ' from your JazzCash account using your registered phone number. No card details are needed. Then enter your account details and upload the payment screenshot.';
      } else {
        title.textContent = 'Mobile Wallet Payment';
        help.textContent =
          'Send the order total to our wallet number from your JazzCash / Easypaisa account (registered phone number). Then enter the transaction details and upload the payment screenshot.';
      }
    }
  };

  radios.forEach((r) => r.addEventListener('change', update));
  update();
});
