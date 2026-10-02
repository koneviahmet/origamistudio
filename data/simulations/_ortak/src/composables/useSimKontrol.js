/**
 * Video modu (JSON ile yönetim) kancası.
 * Origami Studio, simülasyonu gizli bir iframe'de `?video=1` ile açar; bu modda `window.__simKontrol` vardır.
 * Simülasyon kendini şu sözleşmeyle kaydeder (hepsi isteğe bağlı değil → uygula zorunlu):
 *   uygula(degisen, tumu)  : zaman çizelgesinden gelen parametreleri uygular (yalnızca değişenler + tümü)
 *   sifirla()              : zaman birikimlerini (dönme açıları vb.) başa alır
 *   cizim(ctx, w, h)       : (ops.) kareye 2B bindirme (etiket vb.) çizer — DOM yerine
 *   hazir                  : (ops.) Promise; doku vb. yüklenince çözülür
 * Video modunda değilse hiçbir şey yapmaz.
 */
export const VIDEO_MOD = typeof window !== 'undefined' && !!window.__simVideo

export function useSimKontrol(spec) {
  if (!VIDEO_MOD || !window.__simKontrol) return false
  window.__simKontrol.kaydet(spec)
  return true
}
