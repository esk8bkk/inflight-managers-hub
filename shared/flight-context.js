/* ============================================================
   Flight Context — shared state across all plugins
   Persisted to localStorage so data entered in any plugin
   auto-fills the others.
   ============================================================ */

const STORAGE_KEY = 'imh.flightContext.v1';

const DEFAULT_CONTEXT = {
  // Identity
  flightNo: '',
  date: '',

  // Crew
  pic: '',       // Captain / PIC
  fo1: '',       // First Officer 1
  fo2: '',       // First Officer 2
  zs: '',        // ZS / In-flight manager
  codeshare: '', // Codeshare partner airline

  // Route
  dep: { airport: '', time: '', utc: '' },
  arr: { airport: '', time: '', utc: '' },

  // Times
  flightTime: { h: null, m: null },
  taxi: '',
  landing: '', // auto-computed by crew-tools, consumed elsewhere

  // Loads
  pax: { c: 0, y: 0, inf: 0 },
  meals: { c: 0, y: 0, spmlC: 0, spmlY: 0 },
  blankets: { c: 0, y: 0 },
  luggage: 0,

  // Other
  weather: '',
  security: '',
  special: '',

  updatedAt: null,
};

function deepMerge(target, source) {
  if (typeof source !== 'object' || source === null) return source;
  const out = Array.isArray(target) ? [...target] : { ...(target || {}) };
  for (const key of Object.keys(source)) {
    const sVal = source[key];
    if (sVal && typeof sVal === 'object' && !Array.isArray(sVal)) {
      out[key] = deepMerge(out[key] || {}, sVal);
    } else {
      out[key] = sVal;
    }
  }
  return out;
}

export const FlightContext = {
  /** Load the current flight context (merged with defaults). */
  load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { ...DEFAULT_CONTEXT };
      const parsed = JSON.parse(raw);
      return deepMerge(DEFAULT_CONTEXT, parsed);
    } catch (e) {
      console.warn('FlightContext: failed to load', e);
      return { ...DEFAULT_CONTEXT };
    }
  },

  /** Save a full replacement. */
  save(ctx) {
    const next = { ...ctx, updatedAt: new Date().toISOString() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent('flightContext:changed', { detail: next }));
    return next;
  },

  /** Patch — deep-merge partial fields into the stored context. */
  patch(partial) {
    const current = this.load();
    const merged = deepMerge(current, partial);
    return this.save(merged);
  },

  /** Clear back to defaults. */
  clear() {
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new CustomEvent('flightContext:changed', { detail: { ...DEFAULT_CONTEXT } }));
    return { ...DEFAULT_CONTEXT };
  },

  /** Subscribe to changes. Returns an unsubscribe function. */
  subscribe(handler) {
    const wrapped = (e) => handler(e.detail);
    window.addEventListener('flightContext:changed', wrapped);
    return () => window.removeEventListener('flightContext:changed', wrapped);
  },

  /** Bind an input element to a context path. Two-way sync. */
  bindInput(inputEl, path, { transform } = {}) {
    if (!inputEl) return;
    const ctx = this.load();
    const current = getPath(ctx, path);
    if (current !== undefined && current !== null && current !== '') {
      inputEl.value = current;
    }
    inputEl.addEventListener('input', () => {
      const val = transform ? transform(inputEl.value) : inputEl.value;
      this.patch(setPath({}, path, val));
    });
  },
};

function getPath(obj, path) {
  return path.split('.').reduce((acc, k) => (acc == null ? acc : acc[k]), obj);
}

function setPath(obj, path, value) {
  const keys = path.split('.');
  let cur = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    cur[keys[i]] = cur[keys[i]] || {};
    cur = cur[keys[i]];
  }
  cur[keys[keys.length - 1]] = value;
  return obj;
}

// Expose globally for plugins that load as classic scripts
window.FlightContext = FlightContext;
