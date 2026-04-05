/* ============================================================
   Shared UI helpers — toast, copy-to-clipboard, $-helper
   ============================================================ */

export const $ = (id) => document.getElementById(id);
export const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

export function toast(message, duration = 2000) {
  let el = document.querySelector('.toast');
  if (!el) {
    el = document.createElement('div');
    el.className = 'toast';
    document.body.appendChild(el);
  }
  el.textContent = message;
  requestAnimationFrame(() => el.classList.add('show'));
  clearTimeout(toast._t);
  toast._t = setTimeout(() => el.classList.remove('show'), duration);
}

export async function copyText(text) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
    } else {
      // Fallback for older iOS Safari
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.top = '-1000px';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    toast('Copied to clipboard');
    return true;
  } catch (e) {
    toast('Copy failed');
    return false;
  }
}

/** Register a service worker from the hub root. */
export function registerSW(swPath = '/sw.js', scope = '/') {
  if (!('serviceWorker' in navigator)) return;
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(swPath, { scope }).catch((e) => {
      console.warn('SW registration failed', e);
    });
  });
}

// Expose globally
window.$ = $;
window.$$ = $$;
window.toast = toast;
window.copyText = copyText;
