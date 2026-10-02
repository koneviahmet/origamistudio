// YouTube Studio ve Meta Business Suite sayfa betiklerinin ortak yardımcıları (window.OS).
(() => {
  if (window.OS) return;
  // İptal: arka plan sekmeye {tur:'iptal'} yollar; bayrak kalkınca sleep / waitFor / kontrol() hata fırlatır, akış durur
  let iptalEdildi = false;
  const iptalDinleyiciler = [];
  chrome.runtime.onMessage.addListener((m) => {
    if (m?.tur !== 'iptal' || iptalEdildi) return;
    iptalEdildi = true;
    iptalDinleyiciler.forEach((f) => f());
  });
  const iptalMi = () => iptalEdildi;
  const kontrol = () => {
    if (iptalEdildi) throw new Error('İptal edildi');
  };
  const sleep = (ms) =>
    new Promise((r) => setTimeout(r, ms)).then(() => {
      kontrol();
    });

  async function waitFor(fn, { timeout = 30000, every = 250, what = '' } = {}) {
    const t0 = Date.now();
    for (;;) {
      kontrol();
      let v;
      try {
        v = fn();
      } catch {}
      if (v) return v;
      if (Date.now() - t0 > timeout) throw new Error(`Zaman aşımı${what ? `: ${what}` : ''}`);
      await sleep(every);
    }
  }

  const gorunur = (el) => !!el && !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length);
  const metin = (el) => (el.innerText || el.textContent || '').trim();
  const norm = (s) => s.toLocaleLowerCase('tr').replace(/\s+/g, ' ').trim();

  // Metne göre düğme bul (aria-label ya da görünen yazı); labels küçük harfle tam eşleşir
  function dugme(labels, root = document) {
    const set = labels.map(norm);
    const adaylar = root.querySelectorAll('button, [role="button"], ytcp-button');
    for (const el of adaylar) {
      if (!gorunur(el)) continue;
      const t = norm(el.getAttribute('aria-label') || '') || norm(metin(el));
      if (set.includes(t) || set.includes(norm(metin(el)))) return el;
    }
    return null;
  }
  const devreDisi = (el) => el.getAttribute('aria-disabled') === 'true' || el.disabled || el.hasAttribute('disabled');

  function tikla(el) {
    el.scrollIntoView?.({ block: 'center' });
    el.click();
  }

  // contenteditable alanına metin yaz (satır sonları korunur)
  async function yaz(el, text, { yapistir = false } = {}) {
    el.focus();
    const sel = getSelection();
    const range = document.createRange();
    range.selectNodeContents(el);
    sel.removeAllRanges();
    sel.addRange(range);
    document.execCommand('delete');
    if (yapistir) {
      const dt = new DataTransfer();
      dt.setData('text/plain', text);
      el.dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true }));
    } else {
      text.split('\n').forEach((satir, i) => {
        if (i > 0) document.execCommand('insertLineBreak');
        if (satir) document.execCommand('insertText', false, satir);
      });
    }
    el.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText' }));
    await sleep(150);
  }

  // ------------------------------------------------------------ iş + dosya
  const isAl = (hedef) => chrome.runtime.sendMessage({ tur: 'is-al', hedef });
  const asama = (hedef, a) => chrome.runtime.sendMessage({ tur: 'asama', hedef, asama: a });

  // Arka plan MP4'ü parça parça yollar → File
  function dosyaIndir(hedef, ilerleme) {
    return new Promise((resolve, reject) => {
      const port = chrome.runtime.connect({ name: 'dosya' });
      const parcalar = [];
      let meta = null;
      port.onMessage.addListener((m) => {
        if (m.tur === 'meta') meta = m;
        else if (m.tur === 'parca') {
          const bin = atob(m.b64);
          const u8 = new Uint8Array(bin.length);
          for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
          parcalar[m.i] = u8;
          ilerleme?.((m.i + 1) / meta.n);
        } else if (m.tur === 'bitti') {
          port.disconnect();
          resolve(new File(parcalar, meta.ad, { type: meta.mime }));
        } else if (m.tur === 'hata') {
          port.disconnect();
          reject(new Error(m.mesaj));
        }
      });
      port.onDisconnect.addListener(() => meta === null && reject(new Error('Arka plan bağlantısı koptu')));
      port.postMessage({ hedef });
    });
  }

  function dosyaVer(input, file) {
    const dt = new DataTransfer();
    dt.items.add(file);
    input.files = dt.files;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }

  // ------------------------------------------------------------ küçük ilerleme paneli (Shadow DOM)
  function panel(baslik, hedef, iptalNotu = 'İptal edildi.') {
    const host = document.createElement('div');
    host.style.cssText = 'position:fixed;right:16px;bottom:16px;z-index:2147483647;';
    const root = host.attachShadow({ mode: 'open' });
    root.innerHTML = `
      <style>
        .k{font:13px/1.45 system-ui,sans-serif;width:320px;background:#1d1b2e;color:#f4f1ff;border-radius:14px;padding:12px 14px;box-shadow:0 8px 30px #0008;border:1px solid #6c5ce7}
        .b{display:flex;justify-content:space-between;align-items:center;font-weight:700;margin-bottom:6px}
        .b button{all:unset;cursor:pointer;opacity:.7;padding:0 4px}
        .b .ip{opacity:1;background:#7a2330;padding:2px 9px;border-radius:7px;font-weight:600;margin-right:6px}
        .b .ip:hover{background:#a02f42}
        ul{list-style:none;margin:6px 0;padding:0}
        li{padding:2px 0;color:#b9b3d9}
        li.ok{color:#7ee0a1}li.ok::before{content:'✓ '}
        li.now{color:#fff}li.now::before{content:'… '}
        li.err{color:#ff8a8a}li.err::before{content:'✗ '}
        .m{margin-top:6px;padding:8px;border-radius:8px;background:#2b2850;white-space:pre-wrap}
        .m.hazir{background:#1f6f45;font-weight:600}
        .m.hata{background:#7a2330}
        .bar{height:4px;background:#2b2850;border-radius:2px;overflow:hidden;margin-top:6px}
        .bar i{display:block;height:100%;width:0;background:#a29bfe;transition:width .2s}
        .act{display:flex;gap:6px;margin-top:8px;flex-wrap:wrap}
        .act button{all:unset;cursor:pointer;background:#6c5ce7;padding:4px 10px;border-radius:7px}
      </style>
      <div class="k"><div class="b"><span>🦢 ${baslik}</span><span><button class="ip" title="Aktarımı durdur">İptal</button><button class="kp" title="Kapat">✕</button></span></div>
      <ul></ul><div class="bar"><i></i></div><div class="m" hidden></div><div class="act"></div></div>`;
    document.documentElement.appendChild(host);
    const ul = root.querySelector('ul');
    const m = root.querySelector('.m');
    const bar = root.querySelector('.bar i');
    const act = root.querySelector('.act');
    root.querySelector('.kp').onclick = () => host.remove();
    const ip = root.querySelector('.ip');
    ip.hidden = !hedef;
    ip.onclick = () => {
      ip.disabled = true;
      chrome.runtime.sendMessage({ tur: 'iptal', hedef }).catch(() => {});
    };
    iptalDinleyiciler.push(() => {
      ip.hidden = true;
      bar.style.width = '0';
      m.hidden = false;
      m.textContent = iptalNotu;
      m.className = 'm';
    });
    const adimlar = new Map();
    const api = {
      adim(ad, durum = 'now') {
        let li = adimlar.get(ad);
        if (!li) {
          li = document.createElement('li');
          li.textContent = ad;
          ul.appendChild(li);
          adimlar.set(ad, li);
        }
        li.className = durum;
        return api;
      },
      bitir(ad) { return api.adim(ad, 'ok'); },
      hata(ad) { return api.adim(ad, 'err'); },
      ilerleme(f) { bar.style.width = `${Math.round(f * 100)}%`; },
      mesaj(t, tur = '') {
        m.hidden = !t;
        m.textContent = t;
        m.className = `m ${tur}`;
        if (tur) ip.hidden = true; // hazır / hata: iptal edilecek akış kalmadı
      },
      // İptal sonrası: panelde iptal mesajı zaten gösterildi; kopyala düğmeleri eklenmesin
      iptalMi,
      kopyala(etiket, text) {
        const b = document.createElement('button');
        b.textContent = etiket;
        b.onclick = async () => {
          try { await navigator.clipboard.writeText(text); b.textContent = '✓ Kopyalandı'; } catch { b.textContent = 'Kopyalanamadı'; }
        };
        act.appendChild(b);
        return api;
      },
    };
    return api;
  }

  // Son adımdaki düğmeyi göze çarpan çerçeveyle işaretle (tıklamayı kullanıcı yapar)
  function vurgula(el) {
    if (!el) return;
    el.style.outline = '3px solid #00e676';
    el.style.outlineOffset = '3px';
    el.style.animation = 'osnabiz 1s ease-in-out infinite';
    if (!document.getElementById('os-vurgu')) {
      const st = document.createElement('style');
      st.id = 'os-vurgu';
      st.textContent = '@keyframes osnabiz{50%{outline-color:#fff}}';
      document.head.appendChild(st);
    }
    el.scrollIntoView?.({ block: 'center' });
  }

  window.OS = { iptalMi, kontrol, sleep, waitFor, gorunur, metin, norm, dugme, devreDisi, tikla, yaz, isAl, asama, dosyaIndir, dosyaVer, panel, vurgula };
})();
