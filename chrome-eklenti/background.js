// Arka plan: yan paneli açar, yayın işlerini (job) saklar, MP4'ü yerel sunucudan çekip sayfa betiğine parça parça aktarır.
// MP4'ü arka planda çekmek CORS / "yerel ağa erişim" izni sorununu ortadan kaldırır (host_permissions ile doğrudan istek).
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => {});

const HEDEFLER = {
  youtube: { match: 'https://studio.youtube.com/*', url: 'https://studio.youtube.com/' },
  facebook: { match: 'https://business.facebook.com/*', url: 'https://business.facebook.com/latest/home' },
};
const IS_OMRU = 15 * 60 * 1000;
const PARCA = 6 * 1024 * 1024;
const key = (hedef) => `job:${hedef}`;

// Aktif / pasif: yan paneldeki anahtar `aktif` ayarını yazar (varsayılan açık). Kapalıyken iş başlamaz, sayfa betikleri iş almaz.
const aktifMi = async () => (await chrome.storage.local.get('aktif')).aktif !== false;
async function rozetGuncelle() {
  const acik = await aktifMi();
  chrome.action.setBadgeText({ text: acik ? '' : 'KAPALI' }).catch(() => {});
  chrome.action.setBadgeBackgroundColor({ color: '#6b6b80' }).catch(() => {});
  chrome.action.setTitle({ title: acik ? 'Origami Studio videoları' : 'Origami Yayın (kapalı)' }).catch(() => {});
}
rozetGuncelle();
chrome.storage.onChanged.addListener((degisim, alan) => {
  if (alan !== 'local' || !degisim.aktif) return;
  rozetGuncelle();
  if (degisim.aktif.newValue === false) for (const hedef of Object.keys(HEDEFLER)) iptal(hedef); // çalışan işler durdurulur
});

async function facebookUrl() {
  const { fbIds } = await chrome.storage.local.get('fbIds');
  if (fbIds?.asset_id) {
    const q = new URLSearchParams({ asset_id: fbIds.asset_id });
    if (fbIds.business_id) q.set('business_id', fbIds.business_id);
    return `https://business.facebook.com/latest/reels_composer?${q}`;
  }
  return HEDEFLER.facebook.url;
}

async function baslat({ hedef, job }) {
  const h = HEDEFLER[hedef];
  if (!h) return { ok: false, error: 'Bilinmeyen hedef' };
  if (!(await aktifMi())) return { ok: false, error: 'Eklenti kapalı; panelin üstündeki anahtardan aç' };
  const url = hedef === 'facebook' ? await facebookUrl() : h.url;
  // Açık sekme varsa onu kullan (oturum açık, hızlı); yoksa yeni sekme
  const [var1] = await chrome.tabs.query({ url: h.match });
  let tab;
  const kayit = { ...job, hedef, asama: 'bekliyor', olusturma: Date.now() };
  if (var1) {
    kayit.tabId = var1.id;
    await chrome.storage.session.set({ [key(hedef)]: kayit });
    tab = await chrome.tabs.update(var1.id, { url, active: true });
    await chrome.windows.update(tab.windowId, { focused: true }).catch(() => {});
  } else {
    tab = await chrome.tabs.create({ url, active: true });
    kayit.tabId = tab.id;
    await chrome.storage.session.set({ [key(hedef)]: kayit });
  }
  return { ok: true, tabId: tab.id };
}

// Sayfa betiği yüklenince işi ister. Aşama 'bekliyor' ise (dosya henüz seçilmediyse) sayfa yenilense de yeniden verilir.
async function isAl(hedef, tabId) {
  if (!(await aktifMi())) return null;
  const k = key(hedef);
  const job = (await chrome.storage.session.get(k))[k];
  if (!job || job.tabId !== tabId) return null;
  if (Date.now() - job.olusturma > IS_OMRU || job.asama !== 'bekliyor') return null;
  return job;
}

async function asamaYaz(hedef, asama) {
  const k = key(hedef);
  const job = (await chrome.storage.session.get(k))[k];
  if (job && job.asama !== 'iptal') await chrome.storage.session.set({ [k]: { ...job, asama } });
}

// İptal: sunucudan inen MP4'ü keser, işi 'iptal' yapar (sayfa yenilense de yeniden başlamaz), sekmedeki betiğe haber verir
const indirmeler = new Map();
async function iptal(hedef) {
  const k = key(hedef);
  const job = (await chrome.storage.session.get(k))[k];
  indirmeler.get(hedef)?.abort();
  if (!job) return { ok: false, error: 'Bu hedef için çalışan iş yok' };
  await chrome.storage.session.set({ [k]: { ...job, asama: 'iptal' } });
  if (job.tabId != null) await chrome.tabs.sendMessage(job.tabId, { tur: 'iptal', hedef }).catch(() => {});
  return { ok: true };
}

function b64(u8) {
  let s = '';
  for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000));
  return btoa(s);
}

async function dosyaAktar(port, hedef) {
  const ac = new AbortController();
  indirmeler.set(hedef, ac);
  try {
    const k = key(hedef);
    const job = (await chrome.storage.session.get(k))[k];
    if (!job?.dosyaUrl) throw new Error('Aktarılacak dosya yok');
    if (job.asama === 'iptal') throw new Error('İptal edildi');
    // Yalnızca ayarlı sunucunun render MP4'lerini ver
    const u = new URL(job.dosyaUrl);
    if (!/^\/api\/projects\/[^/]+\/renders\/[^/]+\.mp4$/i.test(u.pathname) || !/^(localhost|127\.0\.0\.1)$/.test(u.hostname)) throw new Error('Geçersiz dosya adresi');
    const res = await fetch(job.dosyaUrl, { signal: ac.signal });
    if (!res.ok) throw new Error(`Sunucu ${res.status}`);
    const buf = new Uint8Array(await res.arrayBuffer());
    const n = Math.ceil(buf.length / PARCA);
    port.postMessage({ tur: 'meta', size: buf.length, n, mime: 'video/mp4', ad: job.dosyaAd || 'video.mp4' });
    for (let i = 0; i < n; i++) port.postMessage({ tur: 'parca', i, b64: b64(buf.subarray(i * PARCA, (i + 1) * PARCA)) });
    port.postMessage({ tur: 'bitti' });
  } catch (e) {
    try {
      port.postMessage({ tur: 'hata', mesaj: ac.signal.aborted ? 'İptal edildi' : e.message });
    } catch {}
  } finally {
    if (indirmeler.get(hedef) === ac) indirmeler.delete(hedef);
  }
}

chrome.runtime.onConnect.addListener((port) => {
  if (port.name !== 'dosya') return;
  port.onMessage.addListener((m) => dosyaAktar(port, m.hedef));
});

chrome.runtime.onMessage.addListener((msg, sender, send) => {
  if (msg.tur === 'baslat') baslat(msg).then(send);
  else if (msg.tur === 'iptal') iptal(msg.hedef).then(send);
  else if (msg.tur === 'is-al')isAl(msg.hedef, sender.tab?.id).then(send);
  else if (msg.tur === 'asama') asamaYaz(msg.hedef, msg.asama).then(() => send({ ok: true }));
  else if (msg.tur === 'fb-idler') aktifMi().then((acik) => (acik ? chrome.storage.local.set({ fbIds: msg.idler }) : null)).then(() => send({ ok: true }));
  else return false;
  return true;
});
