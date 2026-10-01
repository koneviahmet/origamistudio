// Bileşen katmanları için ortak (evrensel) stil katmanı.
//   • textScale / weight: her bileşenin tüm yazı puntosunu / kalınlığını tek alandan değiştirir (çizim koduna dokunmadan).
//   • VARIANTS: tek sözcükle hızlı stil değişimi (koyu, açık, vurgulu, sade, şeffaf, büyük, küçük, kalın, ince).
// Saf modül: tarayıcı, sunucu ve CLI aynı kodu kullanır.

const DARK = '#1f1c2e';
const LIGHT_TXT = '#f4f1ff';
const CARDLESS = ['chart', 'kart', 'liste', 'zaman', 'balon'];

/** Tüm bileşen türlerine eklenen ortak alanlar (denetçi formu + yapay zekâ için alan listesi) */
export const COMMON_FIELDS = [
  { key: 'textScale', label: 'Yazı ölçeği (tüm metinler)', type: 'number', def: 1, step: 0.05, common: true },
  { key: 'weight', label: 'Yazı kalınlığı (tümü)', type: 'select', options: [['', 'Bileşenin kendisi'], ['400', '400 normal'], ['500', '500'], ['600', '600'], ['700', '700 kalın'], ['800', '800'], ['900', '900 siyah']], def: '', common: true },
];

const byType = (map) => (type) => map[type] || (CARDLESS.includes(type) && map._cards) || null;

/** ad → { info, apply(type, props) → eklenecek alanlar | null } */
export const VARIANTS = {
  koyu: {
    info: 'Koyu zemin + açık yazı',
    apply: byType({
      chart: { card: { color: DARK }, textColor: LIGHT_TXT },
      kod: { tema: 'koyu' },
      device: { color: '#0f0e16', screenColor: DARK },
      _cards: { bg: DARK, textColor: LIGHT_TXT },
    }),
  },
  acik: {
    info: 'Beyaz zemin + koyu yazı',
    apply: byType({
      chart: { card: { color: '#ffffff' }, textColor: '#2d2a3e' },
      kod: { tema: 'acik' },
      device: { color: '#e9e6f2', screenColor: '#ffffff' },
      _cards: { bg: '#ffffff', textColor: '#2d2a3e' },
    }),
  },
  vurgulu: {
    info: 'Vurgu rengi zemin + beyaz yazı',
    apply: byType({
      chart: { card: { color: '$vurgu' }, textColor: '#ffffff' },
      _cards: { bg: '$vurgu', textColor: '#ffffff', accent: '#ffffff' },
    }),
  },
  sade: {
    info: 'Gölgesiz, ince çerçeveli düz görünüm',
    apply: byType({ _cards: { shadow: false, border: 2, borderColor: '#00000022' } }),
  },
  seffaf: {
    info: 'Kart zemini yok (sahneye doğrudan oturur)',
    apply: byType({ chart: { card: false }, liste: { card: false }, zaman: { card: false } }),
  },
  buyuk: { info: 'Yazılar %25 büyük', apply: () => ({ textScale: 1.25 }) },
  kucuk: { info: 'Yazılar %15 küçük', apply: () => ({ textScale: 0.85 }) },
  kalin: { info: 'Yazılar kalın (800)', apply: () => ({ weight: '800' }) },
  ince: { info: 'Yazılar ince (500)', apply: () => ({ weight: '500' }) },
};
export const VARIANT_NAMES = Object.keys(VARIANTS);

/** Varyant(lar)ı props'a uygular; yeni nesne döndürür. Bilinmeyen ad → hata. */
export function applyVariant(type, props, names) {
  let out = { ...props };
  for (const n of [].concat(names || [])) {
    const v = VARIANTS[n];
    if (!v) throw new Error(`Bilinmeyen varyant: "${n}". Seçenekler: ${VARIANT_NAMES.join(', ')}`);
    const add = v.apply(type);
    if (add) out = { ...out, ...JSON.parse(JSON.stringify(add)) };
  }
  return out;
}

// ------------------------------------------------------------------ yazı ölçeği / kalınlık
const PX = /(\d+(?:\.\d+)?)px/;
const WEIGHT = /^((?:italic|oblique)\s+)?(\d{3}|bold|normal)\s+/;
function restyleFont(font, scale, weight) {
  let f = String(font);
  if (scale && scale !== 1) f = f.replace(PX, (_, n) => `${Math.max(1, Math.round(parseFloat(n) * scale * 100) / 100)}px`);
  if (weight) {
    if (WEIGHT.test(f)) f = f.replace(WEIGHT, (_, it) => `${it || ''}${weight} `);
    else if (PX.test(f)) f = `${weight} ${f}`;
  }
  return f;
}

/**
 * ctx'i sararak `font` atamalarındaki puntoyu / kalınlığı dönüştürür; ölçme ve çizim aynı değeri görür.
 * textScale = 1 ve weight yoksa ctx'in kendisi döner (sıfır maliyet).
 */
export function styledContext(ctx, layer) {
  const scale = Number(layer.textScale) || 1;
  const weight = layer.weight ? String(layer.weight) : '';
  if (scale === 1 && !weight) return ctx;
  return new Proxy(ctx, {
    get(target, key) {
      const v = target[key];
      return typeof v === 'function' ? v.bind(target) : v;
    },
    set(target, key, value) {
      target[key] = key === 'font' ? restyleFont(value, scale, weight) : value;
      return true;
    },
  });
}
