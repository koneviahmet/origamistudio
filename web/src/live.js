// Sunucudaki dosya değişikliklerini (SSE) dinler. Tek bağlantı, çok abone.
import { onBeforeUnmount } from 'vue';

let source = null;
const subs = new Set();

function ensure() {
  if (source) return;
  source = new EventSource('/api/events');
  source.onmessage = (e) => {
    let evt;
    try {
      evt = JSON.parse(e.data);
    } catch {
      return;
    }
    for (const fn of subs) fn(evt);
  };
}

/** Uygulama ömrü boyunca abone olur (modül düzeyi depolar için). */
export function onLive(fn) {
  ensure();
  subs.add(fn);
}

/** Bileşen içinde kullanılır; bileşen kapanınca aboneliği bırakır. */
export function useLive(fn) {
  ensure();
  subs.add(fn);
  onBeforeUnmount(() => subs.delete(fn));
}
