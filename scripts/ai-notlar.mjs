// "Notları uygula" — uygulama içinden Claude API ile (AI4).
//   ANTHROPIC_API_KEY=… node scripts/ai-notlar.mjs <proje-id> [--kuru]
// Açık notları + (varsa) not karelerini ve sahneyi Claude'a gönderir; güncellenmiş scene.json'u yazar, notları
// `done` + somut `reply` ile kapatır. Stüdyoda "Notlar → Claude ile uygula" düğmesi aynı işlevi sunucudan çağırır.
// Model: ANTHROPIC_MODEL (varsayılan claude-opus-5-5). --kuru: API'ye gitmeden istek boyutunu gösterir.
// Her değişiklik otomatik sürüm olur (Geçmiş sekmesi) — beğenilmezse geri alınır.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const API = 'https://api.anthropic.com/v1/messages';

const read = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');

export function sistemMetni() {
  const rehber = read('docs/prompt-rehberi.md');
  const kurallar = rehber.slice(rehber.indexOf('```text') + 7, rehber.indexOf('```', rehber.indexOf('```text') + 7));
  const katalog = read('docs/katalog.md').slice(0, 40000);
  return [
    'Sen Origami Studio sahnelerini düzenleyen bir yardımcısın. Kullanıcı bir videoya zamana/katmana iğnelenmiş NOTLAR bıraktı.',
    'Görevin: her notu sahne JSON\'unda somut bir değişiklikle uygulamak ve SAHNENİN TAMAMINI geri vermek.',
    '',
    'ÇIKTI BİÇİMİ — yalnızca tek bir JSON nesnesi (kod çiti yok, açıklama yok):',
    '{ "scene": { …güncellenmiş TAM scene.json… }, "replies": { "<notId>": "yapılan değişikliğin somut Türkçe özeti", … } }',
    '',
    'KURALLAR:',
    '- Notta istenmeyen hiçbir şeyi değiştirme; katman id\'lerini, grupları, sesleri koru.',
    '- Yalnızca katalogda olan modelleri / efektleri / temaları / metin stillerini kullan.',
    '- Keyframe = {t, v} dizisi; anims/textAnims keyframe değildir. Geçişte t = kesme anıdır.',
    '- Bir notu uygulayamıyorsan reply\'de nedenini yaz ve sahneyi o not için değiştirme.',
    '',
    '── PROJE KURALLARI ──',
    kurallar,
    '── ŞEMA ──',
    read('docs/schema.md'),
    '── KATALOG ──',
    katalog,
  ].join('\n');
}

/**
 * @param {{scene: object, notes: object[], snapshots?: Record<string, Buffer>, apiKey: string, model?: string}} o
 * @returns {Promise<{scene: object, replies: Record<string,string>, usage: object}>}
 */
export async function notlariUygula({ scene, notes, snapshots = {}, apiKey, model, kuru = false }) {
  const content = [];
  content.push({ type: 'text', text: `SAHNE (scene.json):\n${JSON.stringify(scene)}\n\nNOTLAR:` });
  for (const n of notes) {
    const where = [`t=${n.t}s`, n.layerId ? `katman=${n.layerId}` : null, n.pos ? `nokta=(${Math.round(n.pos[0])},${Math.round(n.pos[1])})` : null].filter(Boolean).join(' ');
    content.push({ type: 'text', text: `\n[${n.id}] ${where}\n${n.text}` });
    const png = snapshots[n.id];
    if (png) content.push({ type: 'image', source: { type: 'base64', media_type: 'image/png', data: Buffer.from(png).toString('base64') } });
  }
  const body = {
    model: model || process.env.ANTHROPIC_MODEL || 'claude-opus-5-5',
    max_tokens: 32000,
    system: [{ type: 'text', text: sistemMetni(), cache_control: { type: 'ephemeral' } }],
    messages: [{ role: 'user', content }],
  };
  if (kuru) return { scene, replies: {}, usage: { bytes: JSON.stringify(body).length, model: body.model } };
  const res = await fetch(API, {
    method: 'POST',
    headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Claude API hatası (${res.status}): ${data.error?.message || JSON.stringify(data)}`);
  if (data.stop_reason === 'max_tokens') throw new Error('Yanıt token sınırında kesildi (sahne çok büyük). Notları tek tek uygula ya da sahneyi böl.');
  let text = (data.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('').trim();
  text = text.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '');
  let out;
  try {
    out = JSON.parse(text);
  } catch (e) {
    throw new Error(`Claude yanıtı JSON değil: ${e.message}`);
  }
  const s = out.scene;
  if (!s || !Array.isArray(s.layers) || !s.width || !s.height || !s.duration) throw new Error('Yanıttaki sahne geçersiz (width/height/duration/layers gerekli).');
  if (s.width !== scene.width || s.height !== scene.height) throw new Error('Yanıt sahne boyutunu değiştirdi; reddedildi.');
  return { scene: s, replies: out.replies || {}, usage: data.usage };
}

// ─── CLI ─────────────────────────────────────────────────────────────────────
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const id = process.argv.slice(2).find((a) => !a.startsWith('--'));
  if (!id) {
    console.log('Kullanım: ANTHROPIC_API_KEY=… node scripts/ai-notlar.mjs <proje-id> [--kuru]');
    process.exit(1);
  }
  const dir = path.join(ROOT, 'data', 'projects', id);
  const scene = JSON.parse(fs.readFileSync(path.join(dir, 'scene.json'), 'utf8'));
  const nf = path.join(dir, 'notes.json');
  const all = JSON.parse(fs.readFileSync(nf, 'utf8'));
  const open = all.filter((n) => n.status !== 'done');
  if (!open.length) {
    console.log('Açık not yok.');
    process.exit(0);
  }
  const snapshots = {};
  for (const n of open) {
    const f = path.join(dir, 'snapshots', `${n.id}.png`);
    if (fs.existsSync(f)) snapshots[n.id] = fs.readFileSync(f);
  }
  const kuru = process.argv.includes('--kuru');
  if (!kuru && !process.env.ANTHROPIC_API_KEY) {
    console.error('ANTHROPIC_API_KEY tanımlı değil.');
    process.exit(1);
  }
  console.log(`${open.length} açık not Claude'a gönderiliyor…`);
  const r = await notlariUygula({ scene, notes: open, snapshots, apiKey: process.env.ANTHROPIC_API_KEY, kuru });
  if (kuru) {
    console.log(`kuru çalıştırma: istek ${(r.usage.bytes / 1024).toFixed(0)} KB, model ${r.usage.model}`);
    process.exit(0);
  }
  fs.writeFileSync(path.join(dir, 'scene.json'), JSON.stringify(r.scene, null, 2) + '\n');
  const now = new Date().toISOString();
  for (const n of all) {
    if (n.status === 'done' || !(n.id in r.replies)) continue;
    n.status = 'done';
    n.reply = r.replies[n.id];
    n.updatedAt = now;
  }
  fs.writeFileSync(nf, JSON.stringify(all, null, 2) + '\n');
  for (const n of open) console.log(`  ${n.id}: ${r.replies[n.id] || '(cevapsız — açık kaldı)'}`);
  console.log(`ok — kullanım: ${JSON.stringify(r.usage)}`);
}
