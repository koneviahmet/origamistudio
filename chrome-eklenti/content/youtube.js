// YouTube Studio: yükleme penceresini açar, MP4'ü seçer, başlık / açıklama / etiketleri doldurur,
// "Görünürlük" adımına kadar ilerler. Son "Yayınla / Kaydet" tıklaması kullanıcıya bırakılır.
// Seçiciler kaydedilmiş Studio sayfalarından alındı (ytcp-uploads-dialog[workflow-step], #title-textarea, #next-button…).
(async () => {
  if (window.__osYt) return;
  window.__osYt = true;
  const { OS } = window;
  const job = await OS.isAl('youtube');
  if (!job) return;

  const ui = OS.panel('YouTube’a hazırlanıyor', 'youtube', 'İptal edildi; otomatik doldurma durdu. MP4 YouTube’a verildiyse Studio’daki yükleme penceresini kendin kapat (✕ → Sil).');
  const $ = (sel, root = document) => root.querySelector(sel);
  const dlg = () => $('ytcp-uploads-dialog');
  const adim = () => dlg()?.getAttribute('workflow-step');
  const uyarilar = [];

  try {
    ui.adim('Video sunucudan alınıyor');
    const dosyaSoz = OS.dosyaIndir('youtube', (f) => ui.ilerleme(f * 0.5));

    ui.adim('Yükleme penceresi açılıyor');
    let input = $('input[type="file"][name="Filedata"]');
    if (!input) {
      const olustur = await OS.waitFor(() => $('#create-icon') || $('[aria-label="Oluştur"]') || $('[aria-label="Create"]'), { timeout: 60000, what: 'Oluştur düğmesi' });
      OS.tikla(olustur);
      const yukle = await OS.waitFor(() => $('tp-yt-paper-item[test-id="upload"]'), { what: 'Video yükle menüsü' });
      OS.tikla(yukle);
      input = await OS.waitFor(() => $('input[type="file"][name="Filedata"]'), { what: 'dosya seçici' });
    }
    ui.bitir('Yükleme penceresi açılıyor');

    const file = await dosyaSoz;
    ui.bitir('Video sunucudan alınıyor').ilerleme(0.5);

    ui.adim('MP4 YouTube’a veriliyor');
    OS.kontrol();
    OS.dosyaVer(input, file);
    await OS.asama('youtube', 'dosya-secildi'); // sayfa yenilenirse işi tekrar başlatma
    await OS.waitFor(() => adim() === 'DETAILS' && $('#title-textarea #textbox') && $('#description-textarea #textbox'), { timeout: 90000, what: 'ayrıntılar adımı' });
    ui.bitir('MP4 YouTube’a veriliyor').ilerleme(0.7);

    ui.adim('Başlık ve açıklama dolduruluyor');
    const baslikEl = $('#title-textarea #textbox', dlg());
    const aciklamaEl = $('#description-textarea #textbox', dlg());
    await OS.yaz(baslikEl, job.baslik);
    await OS.yaz(aciklamaEl, job.aciklama);
    if (!OS.metin(baslikEl).startsWith(job.baslik.slice(0, 12))) uyarilar.push('Başlık doğrulanamadı');
    if (!OS.metin(aciklamaEl).startsWith(job.aciklama.slice(0, 12))) uyarilar.push('Açıklama doğrulanamadı');
    ui.bitir('Başlık ve açıklama dolduruluyor');

    ui.adim('Çocuklara özel değil işaretleniyor');
    const cocuk = await OS.waitFor(() => $('tp-yt-paper-radio-button[name="VIDEO_MADE_FOR_KIDS_NOT_MFK"]', dlg()), { timeout: 8000 }).catch(() => null);
    if (cocuk) {
      if (cocuk.getAttribute('aria-checked') !== 'true') OS.tikla(cocuk);
      ui.bitir('Çocuklara özel değil işaretleniyor');
    } else uyarilar.push('“Çocuklara özel değil” seçilemedi');

    if (job.etiketler?.length) {
      ui.adim('Etiketler giriliyor');
      try {
        const tags = () => $('#tags-container input', dlg()) || $('ytcp-chip-bar input', dlg());
        if (!tags()) {
          const ac = $('#toggle-button', dlg());
          if (ac) OS.tikla(ac);
        }
        const tagInput = await OS.waitFor(tags, { timeout: 8000, what: 'etiket alanı' });
        for (const t of job.etiketler) {
          tagInput.focus();
          document.execCommand('insertText', false, `${t},`);
          await OS.sleep(90);
        }
        ui.bitir('Etiketler giriliyor');
      } catch {
        ui.hata('Etiketler giriliyor');
        uyarilar.push('Etiketler girilemedi (panelden kopyalayıp “Daha fazla göster → Etiketler”e yapıştır)');
        ui.kopyala('Etiketleri kopyala', job.etiketler.join(', '));
      }
    }

    ui.adim('Görünürlük adımına ilerleniyor').ilerleme(0.85);
    const bitti = () => {
      const d = $('#done-button', dlg());
      return d && !d.hasAttribute('hidden');
    };
    for (let i = 0; i < 6 && !bitti(); i++) {
      const next = $('#next-button', dlg());
      await OS.waitFor(() => !OS.devreDisi(next), { timeout: 30000, what: 'İleri düğmesi' });
      const onceki = adim();
      OS.tikla(next);
      await OS.waitFor(() => adim() !== onceki || bitti(), { timeout: 30000, what: 'sonraki adım' });
      await OS.sleep(500);
    }

    const gorunurluk = job.gorunurluk || 'PUBLIC';
    const radyo = await OS.waitFor(() => $(`tp-yt-paper-radio-button[name="${gorunurluk}"]`, dlg()), { timeout: 8000 }).catch(() => null);
    if (radyo) OS.tikla(radyo);
    else uyarilar.push('Görünürlük seçilemedi, elle seç');
    ui.bitir('Görünürlük adımına ilerleniyor').ilerleme(1);

    OS.kontrol();
    const done = $('#done-button', dlg());
    OS.vurgula(done);
    await OS.asama('youtube', 'bitti');
    ui.mesaj(`Hazır. Sadece yeşil çerçeveli “${OS.metin(done) || 'Yayınla'}” düğmesine bas.${uyarilar.length ? `\n\nDikkat:\n• ${uyarilar.join('\n• ')}` : ''}`, 'hazir');
  } catch (e) {
    if (OS.iptalMi()) return; // panel iptal mesajını zaten gösterdi
    ui.mesaj(`Otomatik doldurma durdu: ${e.message}\nAşağıdan metinleri kopyalayıp elle yapıştırabilirsin.`, 'hata');
  }
  ui.kopyala('Başlığı kopyala', job.baslik).kopyala('Açıklamayı kopyala', job.aciklama);
})();
