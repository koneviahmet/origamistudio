// Metin yerleşimi denetçisi (tarayıcıda çalışır; MP4 render ETMEZ). Stüdyo açıkken (http://localhost:5180/) tarayıcı konsolunda / javascript_tool ile:
//   1) bu dosyanın tamamını yapıştır   2) await __metin('<proje-id>')   → sorun listesi
// Gerçek renderFrame'i 0.5 sn aralıkla çağırır, fillText çağrılarını yakalar (kamera / grup dönüşümleri dahil) ve raporlar:
//   TASMA  = metin ekran kenarından taşıyor (kısmen görünür)   KENAR = kenara 40 px'ten yakın
//   UST    = iki metin kutusu üst üste biniyor                 YAKIN = iki metin neredeyse değiyor
// Bilinen yanlış pozitifler: aynı katmanın dönen çok satırı ("UST|Sence…"), RGB-kaymalı yıl ("YAKIN|19691969…").
// Ek: __grid(id, [sn…], sutun) → data/projects/<id>/snapshots/kontrol.png (kare ızgarası; Read ile incele).
const find = (re) => performance.getEntriesByType('resource').map((e) => e.name).filter((n) => re.test(n)).pop();
const { renderFrame } = await import(find(/\/src\/engine\/renderer\.js/));
const { resources, loadResources } = await import(find(/\/src\/resources\.js/));
const { ensureSceneFonts } = await import(find(/\/src\/fonts\.js/));
await loadResources();
window.__k = { renderFrame, resources, ensureSceneFonts };
window.__metin = async (id, step = 0.5) => {
  const { renderFrame, resources, ensureSceneFonts } = window.__k;
  const R = resources.value;
  const { scene } = await (await fetch('/api/projects/' + id)).json();
  await ensureSceneFonts(scene, R);
  const W = scene.width, H = scene.height;
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const ctx = c.getContext('2d');
  let rec = [];
  const proto = CanvasRenderingContext2D.prototype;
  const of = proto.fillText;
  const cap = function (text, x, y) {
    const m = this.measureText(text), size = parseFloat((this.font.match(/([\d.]+)px/) || [0, 40])[1]);
    const tr = this.getTransform(); const al = this.textAlign; const w = m.width;
    const x0 = al === 'left' || al === 'start' ? x : al === 'right' || al === 'end' ? x - w : x - w / 2;
    const pts = [[x0, y - size / 2], [x0 + w, y - size / 2], [x0 + w, y + size / 2], [x0, y + size / 2]].map(([a, b]) => [tr.a * a + tr.c * b + tr.e, tr.b * a + tr.d * b + tr.f]);
    const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
    rec.push({ text, x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys), size: size * Math.hypot(tr.a, tr.b), a: this.globalAlpha });
  };
  proto.fillText = function (t, x, y, mw) { cap.call(this, t, x, y); return of.call(this, t, x, y, mw); };
  const issues = new Map();
  const note = (k, t, extra) => { const e = issues.get(k) || { k, t0: t, t1: t, n: 0, ...extra }; e.t1 = t; e.n++; issues.set(k, e); };
  try {
    for (let t = 0; t < scene.duration; t += step) {
      rec = []; ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, W, H);
      renderFrame(ctx, scene, t, R);
      const vis = rec.filter((r) => r.a > 0.3 && r.text.trim()).sort((p, q) => p.y0 - q.y0 || p.x0 - q.x0);
      const cl = [];
      for (const r of vis) { // harf harf çizilen metni (reveal / textAnims) tek kutuda birleştir
        const m = cl.find((k) => Math.abs(k.y0 - r.y0) < r.size * 0.3 && Math.abs(k.size - r.size) < 1 && r.x0 - k.x1 < r.size * 0.9 && r.x0 >= k.x0 - 2);
        if (m) { m.x1 = Math.max(m.x1, r.x1); m.text += r.text; m.y1 = Math.max(m.y1, r.y1); } else cl.push({ ...r });
      }
      const onscreen = cl.filter((k) => k.x1 > 0 && k.x0 < W && k.y1 > 0 && k.y0 < H);
      for (const k of onscreen) {
        const bx = [k.x0, k.y0, k.x1, k.y1].map(Math.round);
        if (k.text.length < 3) continue;
        if (k.x0 < -2 || k.x1 > W + 2 || k.y0 < -2 || k.y1 > H + 2) note('TASMA|' + k.text.slice(0, 40), t, { text: k.text, box: bx });
        else if (k.x0 < 40 || k.x1 > W - 40) note('KENAR|' + k.text.slice(0, 40), t, { text: k.text, box: bx });
      }
      for (let i = 0; i < onscreen.length; i++) for (let j = i + 1; j < onscreen.length; j++) {
        const a = onscreen[i], b = onscreen[j];
        if (a.text === b.text || a.text.length < 3 || b.text.length < 3) continue;
        const sameStack = Math.abs(a.size - b.size) < 1 && (Math.abs(a.x0 - b.x0) < 8 || Math.abs((a.x0 + a.x1) / 2 - (b.x0 + b.x1) / 2) < 8 || Math.abs(a.x1 - b.x1) < 8);
        const ah = (a.y1 - a.y0) * 0.12, bh = (b.y1 - b.y0) * 0.12;
        const ox = Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0);
        const oy = Math.min(a.y1 - ah, b.y1 - bh) - Math.max(a.y0 + ah, b.y0 + bh);
        const gap = Math.max(a.y0 - b.y1, b.y0 - a.y1);
        const info = { a: a.text, b: b.text, boxA: [a.x0, a.y0, a.x1, a.y1].map(Math.round), boxB: [b.x0, b.y0, b.x1, b.y1].map(Math.round) };
        if (ox > 6 && oy > 3 && !(sameStack && oy < a.size * 0.35)) note('UST|' + a.text.slice(0, 26) + '|' + b.text.slice(0, 26), t, info);
        else if (ox > 6 && gap >= 0 && gap < Math.min(a.size, b.size) * 0.12 && !sameStack) note('YAKIN|' + a.text.slice(0, 26) + '|' + b.text.slice(0, 26), t, { ...info, gap: Math.round(gap) });
      }
    }
  } finally { proto.fillText = of; }
  return [...issues.values()].filter((e) => e.t1 - e.t0 >= 0.9).map((e) => ({ ...e, t0: +e.t0.toFixed(1), t1: +e.t1.toFixed(1) }));
};
window.__grid = async (id, times, cols = 6, W = 270, H = 480) => {
  const { renderFrame, resources, ensureSceneFonts } = window.__k; const R = resources.value;
  const { scene } = await (await fetch('/api/projects/' + id)).json(); await ensureSceneFonts(scene, R);
  const G = 6; const c = document.createElement('canvas'); c.width = (W + G) * cols; c.height = (H + G) * Math.ceil(times.length / cols);
  const ctx = c.getContext('2d'); ctx.fillStyle = '#888'; ctx.fillRect(0, 0, c.width, c.height);
  times.forEach((t, i) => {
    ctx.save(); ctx.translate((i % cols) * (W + G), Math.floor(i / cols) * (H + G)); ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.clip();
    ctx.scale(W / scene.width, H / scene.height); renderFrame(ctx, scene, t, R); ctx.restore();
    ctx.fillStyle = '#fff'; ctx.font = '12px sans-serif'; ctx.fillText(t + 's', (i % cols) * (W + G) + 4, Math.floor(i / cols) * (H + G) + 14);
  });
  const blob = await new Promise((r) => c.toBlob(r, 'image/png'));
  const r = await fetch('/api/projects/' + id + '/snapshots/kontrol', { method: 'POST', headers: { 'Content-Type': 'image/png' }, body: blob });
  return r.status + ' ' + (await r.text()).slice(0, 200);
};
