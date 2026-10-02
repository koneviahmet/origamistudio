// Simülasyon katmanı (media katmanı + `sim` alanı) için kare üretici — ana sayfa tarafı.
// Her sim katmanı için gizli bir iframe (/sim-onizleme.html?video=1) açılır; JSON zaman çizelgesi (`kontrol`)
// iframe'e verilir, her kare için `git(t)` çağrılır ve tuval ImageBitmap olarak alınır (bkz. sim-kontrol.js).
// renderFrame yine senkron/saf kalır: kare res.mediaFrames içinden okunur (prepareMedia doldurur).
const entries = new Map(); // key → { iframe, slug, w, h, win, imza, son }
const TIMEOUT = 90000;

function kur(slug, w, h) {
  const iframe = document.createElement('iframe');
  iframe.setAttribute('aria-hidden', 'true');
  iframe.style.cssText = `position:fixed;left:-99999px;top:0;width:${w}px;height:${h}px;border:0;visibility:hidden;pointer-events:none`;
  iframe.src = `/sim-onizleme.html?slug=${encodeURIComponent(slug)}&video=1`;
  const ready = new Promise((resolve, reject) => {
    iframe.onload = () => resolve(iframe.contentWindow);
    iframe.onerror = () => reject(new Error(`Simülasyon yüklenemedi: ${slug}`));
  });
  document.body.appendChild(iframe);
  return { iframe, slug, w, h, ready, imza: null, son: Date.now() };
}

/** Sim katmanı için t anındaki kareyi üret → { source: ImageBitmap, w, h } */
function ensure(layer, key) {
  const slug = layer.sim;
  const w = Math.max(64, Math.round((layer.width || 960) * (layer.kalite || 1)));
  const h = Math.max(64, Math.round((layer.height || 540) * (layer.kalite || 1)));
  let e = entries.get(key);
  if (e && (e.slug !== slug || e.w !== w || e.h !== h)) {
    e.iframe.remove();
    entries.delete(key);
    e = null;
  }
  if (!e) {
    e = kur(slug, w, h);
    entries.set(key, e);
  }
  e.son = Date.now();
  return e;
}

/** Aynı iframe'e gelen git/kare istekleri sırayla çalışır (ön yükleme ile oynatma yarışmasın) */
function sirala(e, fn) {
  const p = (e.kuyruk || Promise.resolve()).then(fn, fn);
  e.kuyruk = p.catch(() => {});
  return p;
}

/** Iframe hazır + zaman çizelgesi kurulu mu → { win, k } */
async function hazirla(e, layer) {
  const win = await e.ready;
  const k = win.__simKontrol;
  if (!k) throw new Error(`Simülasyon video modunu desteklemiyor: ${layer.sim}`);
  const imza = JSON.stringify(layer.kontrol || []);
  if (e.imza !== imza) {
    k.kur(layer.kontrol || []);
    e.imza = imza;
  }
  return { win, k };
}

/**
 * Sahnedeki TÜM simülasyonları önceden yükler (iframe + doku + shader derleme + ilk kare) ve kalıcı tutar;
 * oynatırken yüklenme anı görünmez. onIlerleme(biten, toplam).
 */
export async function simOnYukle(scene, onIlerleme) {
  const list = (scene.layers || []).filter((l) => l.type === 'media' && l.sim);
  let biten = 0;
  onIlerleme?.(0, list.length);
  await Promise.all(list.map(async (l) => {
    try {
      const e = ensure(l, l.id);
      e.kalici = true;
      const { k } = await hazirla(e, l);
      await sirala(e, () => k.git(0)); // ilk kareyi çiz: dokular GPU'ya yüklenir, shader'lar derlenir
    } catch (err) {
      console.warn('[sim ön yükleme]', err);
    }
    onIlerleme?.(++biten, list.length);
  }));
}

/** Ön yüklenen tüm simülasyonları bırak (sayfadan çıkarken) */
export function simBirak() {
  for (const e of entries.values()) e.iframe.remove();
  entries.clear();
}

/** Sim katmanı için t anındaki kareyi üret → { source: ImageBitmap, w, h } */
export async function simKare(layer, key, t) {
  const slug = layer.sim;
  const e = ensure(layer, key);
  const run = async () => {
    const { win, k } = await hazirla(e, layer);
    return sirala(e, async () => {
      await k.git(Math.max(0, t - (layer.start ?? 0)));
      const canvas = k.kare();
      const source = await win.createImageBitmap(canvas);
      return { source, w: canvas.width, h: canvas.height };
    });
  };
  return Promise.race([run(), new Promise((_, rej) => setTimeout(() => rej(new Error(`Simülasyon zaman aşımı: ${slug}`)), TIMEOUT))]);
}

/** Kullanılmayan iframe'leri kapat (WebGL bağlam sınırı). hepsi: dışa aktarım — aktif olmayanı hemen at. */
export function simTemizle(aktif, hepsi = false) {
  const now = Date.now();
  for (const [key, e] of entries) {
    if (aktif.has(key) || e.kalici) continue;
    if (hepsi || now - e.son > 4000) {
      e.iframe.remove();
      entries.delete(key);
    }
  }
}
