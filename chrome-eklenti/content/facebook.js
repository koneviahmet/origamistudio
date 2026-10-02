// Meta Business Suite: Reels oluşturucuyu açar, MP4'ü seçer, açıklamayı (başlık + açıklama + atıf + #etiketler) doldurur,
// "Paylaş" adımına kadar ilerler. Son "Paylaş / Share" tıklaması kullanıcıya bırakılır.
// Oluşturucu (kaydedilmiş sayfadan doğrulandı): 3 adımlı sihirbaz Create → Edit → Share. Üstte adım göstergesi
// (role="list", içinde "Edit" / "Share" adlı devre dışı düğmeler), altta alt çubuk: "Cancel" + "Next" (son adımda "Share").
// Bu yüzden düğmeler tüm sayfada değil, yalnızca alt çubukta (data-surface="…bizweb_create_reel:footer") aranır.
// Sayfada hazır <input type=file> yok: "Add video" tıklanınca oluşur; olmazsa sürükle-bırak olayı gönderilir.
(async () => {
  if (window.__osFb) return;
  window.__osFb = true;
  const { OS } = window;
  const url = new URL(location.href);

  // Her sayfada: asset_id / business_id'yi hatırla (eklenti doğrudan oluşturucuya gitsin)
  const idler = { asset_id: url.searchParams.get('asset_id'), business_id: url.searchParams.get('business_id') };
  if (idler.asset_id) chrome.runtime.sendMessage({ tur: 'fb-idler', idler });

  const job = await OS.isAl('facebook');
  if (!job) return;

  const ui = OS.panel('Facebook’a hazırlanıyor', 'facebook', 'İptal edildi; otomatik doldurma durdu. Reels oluşturucuda video seçildiyse “Cancel” ile çıkabilirsin.');
  const $$ = (sel) => [...document.querySelectorAll(sel)];
  const uyarilar = [];
  const EKLE_YAZI = ['add video', 'video ekle', 'upload video', 'video yükle'];
  const ADIM_YAZI = ['next', 'ileri', 'devam', 'continue'];
  const PAYLAS_YAZI = ['share', 'paylaş', 'publish', 'yayınla', 'share now', 'şimdi paylaş'];

  // Alt çubuğun birincil düğmesi (Cancel'dan sonraki; "Give us feedback" aria-label'lı olduğu için atlanır)
  const altDugme = () => {
    const alt = document.querySelector('[data-surface*="bizweb_create_reel:footer"]');
    if (!alt) return null;
    return $$('[data-surface*="bizweb_create_reel:footer"] [role="button"]')
      .filter((b) => OS.gorunur(b) && !b.getAttribute('aria-label'))
      .at(-1);
  };
  const altYazi = () => {
    const b = altDugme();
    return b ? OS.norm(OS.metin(b)) : '';
  };

  try {
    // Oluşturucu sayfasında değilsek (ana sayfa vb.) kimliklerle oraya git; iş 'bekliyor' kaldığı için yenilemeden sonra devam eder
    if (!/reels_composer/.test(url.pathname)) {
      if (!idler.asset_id) throw new Error('Sayfa kimliği (asset_id) bulunamadı; Business Suite ana sayfasında Sayfanı seçip tekrar dene');
      const q = new URLSearchParams({ asset_id: idler.asset_id });
      if (idler.business_id) q.set('business_id', idler.business_id);
      ui.adim('Reels oluşturucuya gidiliyor');
      location.href = `https://business.facebook.com/latest/reels_composer?${q}`;
      return;
    }

    // Dosya arka planda inerken açıklamayı doldur (kutu ilk adımda zaten var)
    ui.adim('Video sunucudan alınıyor');
    const dosyaSoz = OS.dosyaIndir('facebook', (f) => ui.ilerleme(f * 0.5));
    dosyaSoz.catch(() => {}); // beklemeden önce reddedilirse işlenmemiş hata uyarısı çıkmasın

    ui.adim('Açıklama dolduruluyor');
    const kutu = () =>
      $$('div[role="textbox"][contenteditable="true"], div[contenteditable="true"][aria-label]')
        .filter(OS.gorunur)
        .sort((a, b) => b.offsetWidth * b.offsetHeight - a.offsetWidth * a.offsetHeight)[0];
    const el = await OS.waitFor(kutu, { timeout: 60000, what: 'açıklama kutusu' });
    await OS.yaz(el, job.aciklama, { yapistir: true });
    if (!OS.metin(el).includes(job.aciklama.slice(0, 12))) {
      await OS.yaz(el, job.aciklama); // yapıştırma olayı işlenmediyse klasik yazma
      if (!OS.metin(el).includes(job.aciklama.slice(0, 12))) uyarilar.push('Açıklama doğrulanamadı');
    }
    ui.bitir('Açıklama dolduruluyor');

    const file = await dosyaSoz;
    ui.bitir('Video sunucudan alınıyor').ilerleme(0.5);

    // Video alındı sayılır: "Add video" kayboldu ya da İleri etkinleşti
    ui.adim('Video seçiliyor');
    const kabul = () => !OS.dugme(EKLE_YAZI) || (altDugme() && !OS.devreDisi(altDugme()));
    const gercekTikla = (el) => {
      el.scrollIntoView?.({ block: 'center' });
      for (const t of ['pointerdown', 'mousedown', 'pointerup', 'mouseup', 'click']) {
        const Olay = t.startsWith('pointer') ? PointerEvent : MouseEvent;
        el.dispatchEvent(new Olay(t, { bubbles: true, cancelable: true, view: window, button: 0 }));
      }
    };

    // Yol 1 (asıl): content/facebook-main.js sayfa dünyasında "Add video"nun oluşturduğu dosya alanının .click() çağrısını yakalar
    // ve File'ı doğrudan oraya verir (alan DOM'da olmadığı için bu betikle erişilemez, dosya penceresi de açılmaz)
    window.postMessage({ os: 'fb-dosya', file }, location.origin);
    const ekle = await OS.waitFor(() => OS.dugme(EKLE_YAZI), { timeout: 20000, what: '“Add video” düğmesi' });
    gercekTikla(ekle);
    let alindi = await OS.waitFor(kabul, { timeout: 10000 }).catch(() => false);
    window.postMessage({ os: 'fb-dosya', file: null }, location.origin); // yakalayıcıyı bırak

    // Yol 2: sayfada hazır bir video dosya alanı varsa ona ver
    if (!alindi) {
      const videoMu = (i) => !i.accept || /video|mp4/i.test(i.accept);
      const input = $$('input[type="file"]').find(videoMu);
      if (input) {
        OS.dosyaVer(input, file);
        alindi = await OS.waitFor(kabul, { timeout: 10000 }).catch(() => false);
      }
    }

    // Yol 3: "Media" bölümüne sürükle-bırak
    if (!alindi) {
      const bolum = $$('[role="heading"]').find((h) => /^(media|medya)$/i.test(OS.metin(h)))?.closest('[aria-labelledby]') || document.body;
      const dt = new DataTransfer();
      dt.items.add(file);
      for (const tur of ['dragenter', 'dragover', 'drop']) {
        bolum.dispatchEvent(new DragEvent(tur, { dataTransfer: dt, bubbles: true, cancelable: true }));
      }
      alindi = await OS.waitFor(kabul, { timeout: 10000 }).catch(() => false);
    }
    OS.kontrol();
    if (!alindi) throw new Error('video seçilemedi (yakalayıcı, dosya alanı ve sürükle-bırak denendi); “Add video” ile elle seçebilirsin');
    await OS.asama('facebook', 'dosya-secildi');
    ui.bitir('Video seçiliyor').ilerleme(0.75);

    // Create → Edit → Share: alt çubuk düğmesi "Share" olana kadar "Next"e bas
    ui.adim('Paylaş adımına ilerleniyor');
    for (let i = 0; i < 4 && !PAYLAS_YAZI.includes(altYazi()); i++) {
      const next = await OS.waitFor(() => (ADIM_YAZI.includes(altYazi()) ? altDugme() : null), { timeout: 20000, what: 'İleri düğmesi' });
      await OS.waitFor(() => !OS.devreDisi(next), { timeout: 120000, what: 'video yüklenmesi (İleri etkin olmadı)' });
      const onceki = altYazi();
      OS.tikla(next);
      await OS.waitFor(() => altYazi() !== onceki || PAYLAS_YAZI.includes(altYazi()), { timeout: 6000 }).catch(() => {});
      await OS.sleep(1000);
    }
    const son = await OS.waitFor(() => (PAYLAS_YAZI.includes(altYazi()) ? altDugme() : null), { timeout: 15000, what: 'Paylaş düğmesi' });
    OS.kontrol();
    ui.bitir('Paylaş adımına ilerleniyor').ilerleme(1);
    OS.vurgula(son);
    await OS.asama('facebook', 'bitti');
    ui.mesaj(`Hazır. Yeşil çerçeveli “${OS.metin(son)}” düğmesine sen bas.${uyarilar.length ? `\n\nDikkat:\n• ${uyarilar.join('\n• ')}` : ''}`, 'hazir');
  } catch (e) {
    if (OS.iptalMi()) return; // panel iptal mesajını zaten gösterdi
    ui.mesaj(`Otomatik doldurma durdu: ${e.message}\nAçıklamayı kopyalayıp elle yapıştırabilirsin.`, 'hata');
  }
  ui.kopyala('Açıklamayı kopyala', job.aciklama);
})();
