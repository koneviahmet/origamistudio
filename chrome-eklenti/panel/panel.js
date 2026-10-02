// Yan panel: Origami Studio projelerini ara / önizle, MP4 üret, YouTube ya da Facebook'a gönder.
const $ = (id) => document.getElementById(id);
const VARSAYILAN = { sunucu: 'http://localhost:5180', gorunurluk: 'PUBLIC', aktif: true };

let ayar = { ...VARSAYILAN };
let projeler = [];
let secili = null;
let pollTimer = null;

const norm = (s) => String(s || '').toLocaleLowerCase('tr').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ı/g, 'i');
const sure = (s) => (s ? `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}` : '');
const mb = (b) => `${(b / 1048576).toFixed(1)} MB`;
const base = () => ayar.sunucu.replace(/\/+$/, '');
const baslikOf = (p) => p.publish?.title || p.name;

async function api(path, opts) {
  const res = await fetch(base() + path, opts);
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || `Sunucu ${res.status}`);
  return res.json();
}

// ------------------------------------------------------------------ ayarlar
async function ayarYukle() {
  const kayit = await chrome.storage.local.get(['sunucu', 'gorunurluk', 'aktif']);
  ayar = { ...VARSAYILAN, ...kayit };
  $('sunucu').value = ayar.sunucu;
  $('gorunurluk').value = ayar.gorunurluk;
  aktifUygula();
}
$('ayarBtn').onclick = () => ($('ayar').hidden = !$('ayar').hidden);
$('ayarKaydet').onclick = async () => {
  ayar = { ...ayar, sunucu: $('sunucu').value.trim() || VARSAYILAN.sunucu, gorunurluk: $('gorunurluk').value };
  await chrome.storage.local.set(ayar);
  $('ayar').hidden = true;
  yukle();
};
$('yenileBtn').onclick = () => yukle();

// Aktif / pasif anahtarı: kapalıyken gönder düğmeleri kilitli, arka plan iş başlatmaz / almaz, çalışan işler iptal edilir
function aktifUygula() {
  $('aktif').checked = ayar.aktif !== false;
  $('kapali').hidden = ayar.aktif !== false;
  if (secili) renderSec();
}
$('aktif').onchange = async () => {
  ayar.aktif = $('aktif').checked;
  await chrome.storage.local.set({ aktif: ayar.aktif });
  if (!ayar.aktif) for (const hedef of Object.keys(IPTAL_DUGME)) iptalGoster(hedef, false);
  aktifUygula();
};
chrome.storage.onChanged.addListener((d, alan) => {
  if (alan === 'local' && d.aktif && (d.aktif.newValue !== false) !== (ayar.aktif !== false)) {
    ayar.aktif = d.aktif.newValue !== false;
    aktifUygula();
  }
});

// ------------------------------------------------------------------ liste
async function yukle() {
  try {
    projeler = await api(`/api/ext/projects${$('arsiv').checked ? '?arsiv=1' : ''}`);
    $('durum').classList.add('acik');
    $('durum').title = `Bağlı: ${base()}`;
    if (secili) secili = projeler.find((p) => p.id === secili.id) || null;
  } catch (e) {
    projeler = [];
    $('durum').classList.remove('acik');
    $('durum').title = 'Sunucu kapalı';
    const eski = /API yolu bulunamadı/.test(e.message);
    listeCiz(
      eski
        ? `Sunucu çalışıyor ama eklenti API'sini bilmiyor (eski sürüm).\nÇalışan “npm run dev” sürecini kapatıp yeniden başlat, sonra ⟳'ye bas.`
        : `Origami Studio sunucusuna ulaşılamadı (${base()}).\nProje klasöründe “npm run dev” çalıştır, sonra ⟳'ye bas.\n(${e.message})`,
    );
    return;
  }
  listeCiz();
}

function listeCiz(hata) {
  const terimler = norm($('ara').value).split(/\s+/).filter(Boolean);
  const mp4 = $('mp4Suzgec').value;
  const sonuc = projeler.filter((p) => {
    if (mp4 === 'var' && !p.renders.length) return false;
    if (mp4 === 'yok' && p.renders.length) return false;
    if (!terimler.length) return true;
    const saman = norm([p.id, p.name, p.publish?.title, p.publish?.description, (p.publish?.tags || []).join(' ')].join(' '));
    return terimler.every((t) => saman.includes(t));
  });
  $('sayi').textContent = hata ? '' : `${sonuc.length} / ${projeler.length} video`;
  const kartlar = $('kartlar');
  kartlar.replaceChildren();
  $('bos').hidden = !!sonuc.length && !hata;
  $('bos').textContent = hata || (projeler.length ? 'Aramaya uyan video yok.' : 'Henüz proje yok.');
  for (const p of sonuc) {
    const k = document.createElement('button');
    k.className = 'kart';
    const h = document.createElement('h3');
    h.textContent = baslikOf(p);
    const meta = document.createElement('div');
    meta.className = 'meta';
    const r = document.createElement('span');
    r.className = `rozet ${p.renders.length ? 'var' : 'yok'}`;
    r.textContent = p.renders.length ? `MP4 ✓ (${p.renders.length})` : 'MP4 yok';
    const bilgi = document.createElement('span');
    bilgi.textContent = [`${p.width}×${p.height}`, sure(p.duration), p.archived ? 'arşiv' : ''].filter(Boolean).join(' · ');
    meta.append(r, bilgi);
    k.append(h, meta);
    if (p.publish?.tags?.length) {
      const e = document.createElement('div');
      e.className = 'etiketler';
      e.textContent = p.publish.tags.map((t) => `#${t}`).join(' ');
      k.append(e);
    }
    k.onclick = () => ac(p);
    kartlar.append(k);
  }
}
$('ara').addEventListener('input', () => listeCiz());
$('mp4Suzgec').onchange = () => listeCiz();
$('arsiv').onchange = () => yukle();

// ------------------------------------------------------------------ ayrıntı
function gorunum(ayrinti) {
  $('liste').hidden = ayrinti;
  $('ayrinti').hidden = !ayrinti;
  if (!ayrinti) {
    $('video').pause();
    secili = null;
    clearTimeout(pollTimer);
  }
}
$('geri').onclick = () => gorunum(false);

function metinleriDoldur(p) {
  $('ytBaslik').value = p.yayin.youtube.baslik;
  $('ytAciklama').value = p.yayin.youtube.aciklama;
  $('ytEtiket').value = p.yayin.youtube.etiketler.join(', ');
  $('fbAciklama').value = p.yayin.facebook.aciklama;
  sayacGuncelle();
}
const sayacGuncelle = () => ($('ytSay').textContent = `${$('ytBaslik').value.length}/100`);
$('ytBaslik').addEventListener('input', sayacGuncelle);
$('sifirlaBtn').onclick = () => secili && metinleriDoldur(secili);

function renderSec() {
  const p = secili;
  const sec = $('mp4Sec');
  sec.replaceChildren();
  for (const r of p.renders) {
    const o = document.createElement('option');
    o.value = r.file;
    o.textContent = `${r.file} · ${mb(r.size)} · ${new Date(r.at).toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' })}`;
    sec.append(o);
  }
  const var1 = p.renders.length > 0;
  sec.hidden = !var1;
  $('videoYok').hidden = var1;
  $('video').hidden = !var1;
  const kapali = ayar.aktif === false;
  for (const id of ['ytBtn', 'fbBtn']) {
    $(id).disabled = !var1 || kapali;
    $(id).title = kapali ? 'Eklenti kapalı (sağ üstteki anahtar)' : var1 ? '' : 'Önce MP4 üret';
  }
  $('uretBtn').textContent = var1 ? 'Yeniden üret' : 'MP4 üret';
  videoYukle();
}
function videoYukle() {
  const f = $('mp4Sec').value;
  const v = $('video');
  if (!f) return void v.removeAttribute('src');
  v.src = `${base()}/api/projects/${encodeURIComponent(secili.id)}/renders/${encodeURIComponent(f)}`;
}
$('mp4Sec').onchange = videoYukle;

function ac(p) {
  secili = p;
  $('aBaslik').textContent = baslikOf(p);
  $('aMeta').textContent = [p.id, `${p.width}×${p.height}`, sure(p.duration)].filter(Boolean).join(' · ');
  $('sonuc').hidden = true;
  for (const hedef of Object.keys(IPTAL_DUGME)) iptalGoster(hedef, false);
  metinleriDoldur(p);
  renderSec();
  gorunum(true);
  isleriIzle();
}

// ------------------------------------------------------------------ MP4 üretimi (sunucu: scripts/render.mjs)
$('uretBtn').onclick = async () => {
  try {
    await api(`/api/ext/projects/${encodeURIComponent(secili.id)}/render`, { method: 'POST' });
    isleriIzle();
  } catch (e) {
    sonuc(e.message, true);
  }
};

async function isleriIzle() {
  clearTimeout(pollTimer);
  if (!secili) return;
  let isler = [];
  try {
    isler = await api('/api/ext/render-jobs');
  } catch {}
  const calisan = isler.find((j) => j.status === 'running');
  const benim = isler.filter((j) => j.projectId === secili.id).at(-1);
  const kutu = $('uretDurum');
  kutu.hidden = !(calisan || (benim && benim.status === 'error'));
  $('uretBtn').disabled = !!calisan;
  if (calisan) {
    kutu.querySelector('i').style.width = `${Math.round(calisan.progress * 100)}%`;
    kutu.querySelector('span').textContent =
      calisan.projectId === secili.id ? `MP4 üretiliyor… %${Math.round(calisan.progress * 100)}` : `Başka proje üretiliyor (${calisan.projectId})…`;
    pollTimer = setTimeout(isleriIzle, 1500);
    window.__renderBeklenen = calisan.projectId;
  } else if (benim?.status === 'error') {
    kutu.querySelector('i').style.width = '0';
    kutu.querySelector('span').textContent = `Üretim hatası: ${benim.error}`;
  }
  if (!calisan && window.__renderBeklenen) {
    window.__renderBeklenen = null;
    await yukle(); // yeni MP4 listeye girsin
    if (secili) renderSec();
  }
}

// ------------------------------------------------------------------ gönderme
function sonuc(metin, hata = false) {
  const s = $('sonuc');
  s.hidden = false;
  s.className = `sonuc${hata ? ' hata' : ''}`;
  s.textContent = metin;
}

async function gonder(hedef) {
  const dosya = $('mp4Sec').value;
  if (!secili || !dosya) return sonuc('Önce MP4 gerekli.', true);
  const etiketler = $('ytEtiket').value.split(',').map((t) => t.replace(/^#+/, '').trim()).filter(Boolean);
  const job = {
    projectId: secili.id,
    dosyaAd: dosya,
    dosyaUrl: `${base()}/api/projects/${encodeURIComponent(secili.id)}/renders/${encodeURIComponent(dosya)}`,
    baslik: $('ytBaslik').value.trim(),
    aciklama: hedef === 'youtube' ? $('ytAciklama').value.trim() : $('fbAciklama').value.trim(),
    etiketler: hedef === 'youtube' ? etiketler : [],
    gorunurluk: ayar.gorunurluk,
  };
  if (hedef === 'youtube' && !job.baslik) return sonuc('YouTube başlığı boş olamaz.', true);
  const r = await chrome.runtime.sendMessage({ tur: 'baslat', hedef, job });
  if (!r?.ok) return sonuc(r?.error || 'Başlatılamadı', true);
  sonuc(`${hedef === 'youtube' ? 'YouTube Studio' : 'Meta Business Suite'} sekmesi açıldı. Sayfanın sağ altındaki yeşil panelden ilerlemeyi izle; sonunda sadece Yayınla'ya bas. Vazgeçersen aşağıdan ya da sayfadaki panelden iptal edebilirsin.`);
  iptalGoster(hedef, true);
}
$('ytBtn').onclick = () => gonder('youtube');
$('fbBtn').onclick = () => gonder('facebook');

// ------------------------------------------------------------------ iptal
const IPTAL_DUGME = { youtube: 'ytIptal', facebook: 'fbIptal' };
function iptalGoster(hedef, ac) {
  $(IPTAL_DUGME[hedef]).hidden = !ac;
  $('iptalSatir').hidden = !Object.values(IPTAL_DUGME).some((id) => !$(id).hidden);
}
for (const hedef of Object.keys(IPTAL_DUGME)) {
  $(IPTAL_DUGME[hedef]).onclick = async () => {
    const r = await chrome.runtime.sendMessage({ tur: 'iptal', hedef }).catch((e) => ({ ok: false, error: e.message }));
    iptalGoster(hedef, false);
    sonuc(r?.ok ? `${hedef === 'youtube' ? 'YouTube' : 'Facebook'} gönderimi iptal edildi; otomatik doldurma durdu. Sayfada açılmış bir yükleme penceresi varsa onu kendin kapat.` : r?.error || 'İptal edilemedi', !r?.ok);
  };
}

// ------------------------------------------------------------------ başlangıç
(async () => {
  await ayarYukle();
  await yukle();
})();
