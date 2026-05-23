/**
 * Paywall gate for /pro/ page.
 *
 * How it works:
 * - On page load: check sessionStorage for a valid unlocked flag.
 * - If already unlocked, show content immediately (no flash).
 * - If not unlocked, show the gate and wait for password entry.
 * - On correct password: store flag in sessionStorage + localStorage (30-day window), show content.
 * - On incorrect password: show error message.
 *
 * To change the password:
 * 1. Update PRO_PASSWORD below to your desired password.
 * 2. Redeploy the site.
 * 3. Update your Gumroad/LemonSqueezy delivery email with the new password.
 *
 * Security note:
 * This is a client-side soft gate — adequate for a digital product sold on Gumroad.
 * The real protection is that buyers are the only ones who receive the password.
 * Do not use this for highly sensitive content.
 */

(function () {
  // ─── CONFIGURATION ─────────────────────────────────────────────────────────
  // Change this to your desired password before launching.
  const PRO_PASSWORD = 'visapro2026';

  // How long to remember the unlock (days). Set to 0 to require re-entry each session.
  const REMEMBER_DAYS = 30;

  // Storage key
  const STORAGE_KEY = 'vj_pro_unlocked';
  // ───────────────────────────────────────────────────────────────────────────

  const gate = document.getElementById('paywall-gate');
  const content = document.getElementById('pro-content');
  const input = document.getElementById('paywall-input');
  const submitBtn = document.getElementById('paywall-submit');
  const errorMsg = document.getElementById('paywall-error');

  if (!gate || !content) return;

  function unlock() {
    gate.remove();
    content.classList.remove('hidden');
    // Store in sessionStorage (current tab) + localStorage (cross-session)
    try {
      sessionStorage.setItem(STORAGE_KEY, '1');
      if (REMEMBER_DAYS > 0) {
        const expiry = Date.now() + REMEMBER_DAYS * 24 * 60 * 60 * 1000;
        localStorage.setItem(STORAGE_KEY, expiry.toString());
      }
    } catch (_) {
      // storage blocked — still unlocked for this page view
    }
  }

  function isAlreadyUnlocked() {
    try {
      if (sessionStorage.getItem(STORAGE_KEY)) return true;
      const expiry = localStorage.getItem(STORAGE_KEY);
      if (expiry && Date.now() < parseInt(expiry, 10)) return true;
    } catch (_) {}
    return false;
  }

  // Check on load
  if (isAlreadyUnlocked()) {
    unlock();
    return;
  }

  // Handle submit
  function attempt() {
    const val = (input.value || '').trim();
    if (val === PRO_PASSWORD) {
      errorMsg.classList.add('hidden');
      unlock();
    } else {
      errorMsg.classList.remove('hidden');
      input.value = '';
      input.focus();
      // Shake animation
      input.classList.add('animate-pulse');
      setTimeout(() => input.classList.remove('animate-pulse'), 600);
    }
  }

  submitBtn.addEventListener('click', attempt);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') attempt();
    if (errorMsg && !errorMsg.classList.contains('hidden')) {
      errorMsg.classList.add('hidden');
    }
  });

  // Auto-focus the input
  setTimeout(() => input.focus(), 100);
})();
