// Karakter katmanı (type: "karakter") — iskelet (rig) + aksiyon / duygu zaman akışı + çizim.
// Saf ve deterministiktir: renderFrame(ctx, scene, t, res) her zaman aynı kareyi üretir (rastgelelik yok, tohumlu titreme).
//
// Katman: { type:'karakter', karakter:'<id>', x, y (AYAK ucu), scale, yon:1|-1,
//           aksiyon, duygu, akis:[{ t, aksiyon, duygu, siddet, hiz, sure, dx, dy, hedef, bak, yon, gecis, tutar, efekt, faz }],
//           soz:[{ t, sure, metin, tur, taraf }], varyant, renkler, ekler, golge, balon }
// Karakter belgesi: data/characters/<id>.json (görünüm). Aksiyon/duygu kataloğu: characterData.js (tüm karakterlerce paylaşılır).
import { resolveRef } from './theme.js';
import { easings } from './easing.js';
import { POSE0, POSE_KEYS, ACTIONS } from './characterData.js';
import {
  DEG, TAU, clamp, clamp01, lerp, sstep, hashStr,
  beginJitter, shape, strokeLine, fillCircle, fillEllipse, ellipsePts, superPts, eggPts, rrectPts,
} from './characterDraw.js';
import {
  lighter, outlineOf, gradFill, gloss, drawLimb, drawHand, drawFoot, torsoBack, torsoDetails, torsoGloss, headBack, headFront,
} from './characterStyle.js';
import { drawProp } from './characterProps.js';
import { faceOf, blendFace, blinkAt, drawFace, drawFaceFx } from './characterFace.js';
import {
  ekFrame, ekHasBack, drawEkBack, drawEkFront, drawEffect, bubbleLayout, drawBubble,
} from './characterGear.js';

export const CHARACTER_DEFAULTS = {
  rig: 'insan',
  boy: 1,
  olcu: {
    bas: [58, 56], boyun: 4, govde: [80, 128], omuzY: 16, omuzX: 34, kolUst: 56, kolAlt: 52, kalcaX: 20, bacakUst: 54, bacakAlt: 52, el: 11, ayak: [18, 9],
  },
  cizgi: { renk: '#1b1b1b', kalinlik: 5, titrek: 1.4, kaynama: 0.13 },
  renkler: {
    kafa: '#ffffff', govde: '#ffffff', kol: null, bacak: null, el: null, ayak: null, sac: '#222222', goz: '#1b1b1b', agiz: '#7a1f2b', yanak: '#ff8f8f', vurgu: '$vurgu',
  },
  govde: { sekil: 'dikdortgen', yaricap: [16, 16, 4, 4] },
  kafa: { sekil: 'daire' },
  uzuv: { tur: 'cubuk', kalinlik: 5, el: 'parmak', ayak: 'oval' },
  yuz: { goz: 'nokta', boyut: 1, aralik: 1, yukseklik: 0, agizY: 0, agizGen: 1, agizKalinlik: 0.9, kasKalinlik: 1, burun: null },
  ekler: [],
  varyantlar: {},
  golge: true,
  balon: {},
};

const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v);
function merge(a, b) {
  const out = { ...a };
  for (const [k, v] of Object.entries(b || {})) {
    if (v === undefined) continue;
    out[k] = isObj(v) && isObj(out[k]) ? merge(out[k], v) : v;
  }
  return out;
}

/** Karakter belgesi + varyant + katman geçersiz kılmaları → etkin karakter */
export function mergeCharacter(doc, layer = {}) {
  let C = merge(CHARACTER_DEFAULTS, doc);
  const on = new Set((C.ekler || []).filter((e) => e.varsayilan !== false).map((e) => e.id));
  const v = layer.varyant && C.varyantlar?.[layer.varyant];
  if (v) {
    const { ekAc, ekKapat, ...rest } = v;
    C = merge(C, rest);
    (ekAc || []).forEach((id) => on.add(id));
    (ekKapat || []).forEach((id) => on.delete(id));
  }
  if (layer.renkler) C = merge(C, { renkler: layer.renkler });
  if (layer.stil) C = merge(C, layer.stil);
  if (layer.boy != null) C.boy = layer.boy;
  if (Array.isArray(layer.ekler)) layer.ekler.forEach((id) => on.add(id));
  else if (isObj(layer.ekler)) for (const [id, val] of Object.entries(layer.ekler)) (val ? on.add(id) : on.delete(id));
  C.ekAktif = [...(C.ekler || []).filter((e) => on.has(e.id)), ...(layer.ekEkle || [])];
  return C;
}

export function resolveCharacter(layer, res) {
  const doc = res?.characters?.get?.(layer.karakter);
  return doc ? mergeCharacter(doc, layer) : null;
}

// nesne taşıma eli hedefi (gövde oranı: x yarı genişlik dışa, y kalçadan boyuna 0–1)
const CARRY = {
  varsayilan: [0.9, 0.6],
  tabela: [1.9, 0.62], bayrak: [1.9, 0.62], 'balon-gaz': [1.9, 0.62], cicek: [1.6, 0.66], kalem: [1.5, 0.7],
  mikrofon: [0.7, 0.8], telefon: [1.2, 0.68], buyutec: [1.3, 0.66], ampul: [1.3, 0.66],
};
const clipOf = (C, name) => C.aksiyonlar?.[name] || ACTIONS[name] || ACTIONS.bekle;

// ════════════════════════════════════════════════════════════════════════════
//  İSKELET ÖLÇÜLERİ
// ════════════════════════════════════════════════════════════════════════════
export function characterMetrics(C) {
  const o = C.olcu;
  const legLen = o.bacakUst + o.bacakAlt;
  const height = (legLen + o.govde[1] + o.boyun + o.bas[1] * 2 + 6) * C.boy;
  const reach = (o.omuzX + o.kolUst + o.kolAlt) * C.boy;
  const width = Math.max(o.govde[0] * 1.3, o.bas[0] * 2.2, reach * 1.1) * C.boy;
  return { legLen, height, width };
}

/** [genişlik, yükseklik] — katman yerel kutusu (orijin ayak ucu: x ∈ ±w/2, y ∈ −h…0) */
export function characterSize(layer, res) {
  const C = resolveCharacter(layer, res);
  if (!C) return [160, 380];
  const m = characterMetrics(C);
  return [m.width, m.height];
}

// ════════════════════════════════════════════════════════════════════════════
//  KLİP DEĞERLENDİRME
// ════════════════════════════════════════════════════════════════════════════
function evalTrack(spec, ph) {
  if (typeof spec === 'number') return spec;
  if (Array.isArray(spec)) {
    const n = spec.length;
    if (!n) return 0;
    if (ph <= spec[0][0]) return spec[0][1];
    if (ph >= spec[n - 1][0]) return spec[n - 1][1];
    for (let i = 0; i < n - 1; i++) {
      const a = spec[i];
      const b = spec[i + 1];
      if (ph >= a[0] && ph < b[0]) {
        const k = (ph - a[0]) / (b[0] - a[0] || 1);
        const e = b[2] ? easings[b[2]] || sstep : sstep;
        return lerp(a[1], b[1], e(k));
      }
    }
    return spec[n - 1][1];
  }
  if (spec && typeof spec === 'object') return (spec.o || 0) + (spec.a || 0) * Math.sin(TAU * ((spec.f ?? 1) * ph + (spec.p || 0)));
  return 0;
}

function poseAt(clip, tl, hiz, faz) {
  const sure = clip.sure || 1;
  let ph = (tl * hiz) / sure + (faz || 0);
  ph = clip.dongu ? ph - Math.floor(ph) : clamp01(ph);
  const tr = clip.poz || {};
  const P = { ...POSE0 };
  for (const k of POSE_KEYS) {
    const short = /[LR]$/.test(k) ? k.slice(0, -1) : null;
    const spec = tr[k] !== undefined ? tr[k] : short ? tr[short] : undefined;
    if (spec !== undefined) P[k] = evalTrack(spec, ph);
  }
  if (clip.ik) {
    P.ik = {};
    for (const side of ['L', 'R']) {
      const sp = clip.ik[side] || clip.ik.LR;
      if (!sp) continue;
      P['ik' + side + 'W'] = sp.w === undefined ? 1 : evalTrack(sp.w, ph);
      P['ik' + side + 'X'] = evalTrack(sp.x ?? 0, ph);
      P['ik' + side + 'Y'] = evalTrack(sp.y ?? 0, ph);
      P.ik[side] = { ref: sp.ref || 'bas', dirsek: sp.dirsek || 'dis' };
    }
  }
  return P;
}

function lerpPose(a, b, w) {
  const o = {};
  for (const k of POSE_KEYS) o[k] = lerp(a[k], b[k], w);
  o.ik = { L: b.ik?.L || a.ik?.L, R: b.ik?.R || a.ik?.R };
  return o;
}

// açıyı en kısa yoldan karıştır (derece)
const lerpAng = (a, b, w) => a + (((b - a + 540) % 360) - 180) * w;

/** İki kollu ters kinematik. sh, tgt: gövde çerçevesinde noktalar; s: taraf (−1 sol, +1 sağ). → [omuz açısı φ1, dirsek bükümü e] derece */
function solveIK(sh, tgt, l1, l2, s, pref) {
  const dx = tgt[0] - sh[0];
  const dy = tgt[1] - sh[1];
  const dist = Math.hypot(dx, dy) || 1e-6;
  const d = clamp(dist, Math.abs(l1 - l2) + 0.5, l1 + l2 - 0.5);
  const phiT = Math.atan2((dx * s) / dist, dy / dist);
  const A = Math.acos(clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1));
  const cand = [phiT + A, phiT - A].map((p1) => ({ p1, ex: sh[0] + s * Math.sin(p1) * l1, ey: sh[1] + Math.cos(p1) * l1 }));
  const score = (c) => (pref === 'asagi' ? c.ey : pref === 'yukari' ? -c.ey : pref === 'ic' ? -(c.ex - sh[0]) * s : (c.ex - sh[0]) * s);
  const best = score(cand[0]) >= score(cand[1]) ? cand[0] : cand[1];
  const phi2 = Math.atan2((tgt[0] - best.ex) * s, tgt[1] - best.ey);
  let e = (phi2 - best.p1) / DEG;
  e = ((e + 540) % 360) - 180;
  return [best.p1 / DEG, e];
}

// ════════════════════════════════════════════════════════════════════════════
//  ZAMAN AKIŞI — akis dizisini (ve soz'den gelen otomatik jestleri) parçalara çevirir
// ════════════════════════════════════════════════════════════════════════════
export const speechDur = (e) => (e.sure != null ? e.sure : Math.max(1.6, [...String(e.metin || '')].length / 14 + 0.9));
const speechType = (e) => Math.min(speechDur(e) * 0.82, [...String(e.metin || '')].length / (e.hiz || 26));

export function buildTimeline(layer, C, scene, lookup, t) {
  const idle = layer.bekleme || 'bekle';
  const dur = scene?.duration || 10;
  const src = (layer.akis || []).map((s) => ({ ...s, t0: s.t || 0 })).sort((a, b) => a.t0 - b.t0);
  if (!src.length || src[0].t0 > 0) src.unshift({ t0: 0, aksiyon: layer.aksiyon || idle, gecis: 0 });
  src.forEach((s) => { if (!s.aksiyon) s.aksiyon = idle; });
  let segs = src;

  // 'sure' verilmiş ve sonraki parça daha geç başlıyorsa → süre bitince bekleme pozuna dön
  const withIdle = [];
  segs.forEach((s, i) => {
    withIdle.push(s);
    const next = segs[i + 1];
    if (s.sure != null && (!next || next.t0 > s.t0 + s.sure + 0.05) && s.t0 + s.sure < dur) withIdle.push({ t0: s.t0 + s.sure, aksiyon: idle, gecis: 0.3, auto: true, _ret: true });
  });
  segs = withIdle.sort((a, b) => a.t0 - b.t0);

  // söz → bekleme türü aksiyonda otomatik konuşma jesti
  const talks = (layer.soz || [])
    .filter((e) => e.metin != null && e.otoJest !== false)
    .map((e) => [e.t || 0, (e.t || 0) + Math.min(speechDur(e), speechType(e) + 0.5)])
    .sort((a, b) => a[0] - b[0]);
  const merged = [];
  for (const iv of talks) {
    const last = merged[merged.length - 1];
    if (last && iv[0] - last[1] < 0.8) last[1] = Math.max(last[1], iv[1]);
    else merged.push([...iv]);
  }
  const extra = [];
  for (const [a, b] of merged) {
    let idx = 0;
    segs.forEach((s, i) => { if (s.t0 <= a + 1e-6) idx = i; });
    const cur = segs[idx];
    if (!clipOf(C, cur.aksiyon)?.bekle || cur.aksiyon === 'konus') continue;
    extra.push({ t0: a, aksiyon: 'konus', gecis: 0.3, auto: true });
    const nextT = segs[idx + 1]?.t0 ?? Infinity;
    if (nextT > b + 0.3) extra.push({ t0: b + 0.12, aksiyon: cur.aksiyon, hiz: cur.hiz, faz: cur.faz, gecis: 0.4, auto: true });
  }
  // çakışan parçaları ele: konuşma aralığındaki otomatik 'bekle'ye dönüşleri at
  segs = [...segs, ...extra].sort((a, b) => a.t0 - b.t0 || (a.auto ? -1 : 1));
  segs = segs.filter((s, i) => !(s._ret && merged.some(([a, b]) => s.t0 > a && s.t0 < b + 0.05)) || i === 0);

  // yapışkan alanlar, hareket kümülatifi, yön
  let yon = layer.yon ?? 1;
  let duygu = layer.duygu || C.duygu || 'notr';
  let siddet = 1;
  let bak = layer.bak ?? null;
  let tutar = layer.tutar ?? null;
  let cx = 0;
  let cy = 0;
  const base = lookup?.self;
  segs.forEach((s, i) => {
    const next = segs[i + 1];
    s.clip = clipOf(C, s.aksiyon);
    s.gecis = s.gecis ?? (i === 0 ? 0 : 0.25);
    s.span = s.sure ?? ((next ? next.t0 : Math.max(dur, s.t0 + 0.01)) - s.t0);
    if (s.duygu !== undefined) duygu = s.duygu || 'notr';
    if (s.siddet !== undefined) siddet = s.siddet;
    if (s.bak !== undefined) bak = s.bak;
    if (s.tutar !== undefined) tutar = s.tutar;
    // yön: açıkça verilen > hedefe dönük > hareket yönü > önceki
    let ny = s.yon;
    if (ny == null && s.hedef != null && s.clip.isaret && base && lookup?.target) {
      const tp = lookup.target(s.hedef);
      if (tp && Math.abs(tp.x - (base.x + cx)) > 24) ny = Math.sign(tp.x - (base.x + cx));
    }
    if (ny == null && s.dx) ny = Math.sign(s.dx);
    s.yonPrev = yon;
    if (ny != null && ny !== 0) yon = ny;
    s.yonVal = yon;
    s.duyguVal = duygu;
    s.siddetVal = siddet;
    s.bakVal = bak;
    s.tutarVal = tutar;
    s.moveDur = Math.max(0.01, s.sure ?? s.span);
    s.cx0 = cx;
    s.cy0 = cy;
    cx += s.dx || 0;
    cy += s.dy || 0;
  });
  return segs;
}

function segIndexAt(segs, t) {
  let k = 0;
  for (let i = 0; i < segs.length; i++) if (segs[i].t0 <= t + 1e-6) k = i;
  return k;
}

function stateAt(segs, t) {
  const k = segIndexAt(segs, t);
  const s = segs[k];
  const e = easings[s.hareketEase || 'linear'] || ((x) => x);
  const m = (s.dx || s.dy) ? e(clamp01((t - s.t0) / s.moveDur)) : 0;
  const turnK = sstep((t - s.t0) / 0.2);
  const flip = s.yonVal === s.yonPrev ? s.yonVal : lerp(s.yonPrev, s.yonVal, turnK);
  return { k, seg: s, dx: s.cx0 + (s.dx || 0) * m, dy: s.cy0 + (s.dy || 0) * m, flip };
}

/** Katmanın t anındaki kayması + yönü (renderer.layerBox ve oklar için) */
export function characterState(layer, t, scene, res) {
  const C = resolveCharacter(layer, res);
  if (!C || !(layer.akis || layer.soz)) return { dx: 0, dy: 0, flip: layer.yon ?? 1 };
  const segs = buildTimeline(layer, C, scene, null, t);
  const s = stateAt(segs, t);
  return { dx: s.dx, dy: s.dy, flip: s.flip };
}

// ════════════════════════════════════════════════════════════════════════════
//  İSKELET KİNEMATİĞİ
// ════════════════════════════════════════════════════════════════════════════
const rotv = (x, y, a) => [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)];
const dirv = (s, phi) => [s * Math.sin(phi * DEG), Math.cos(phi * DEG)];

function buildRig(C, P) {
  const o = C.olcu;
  const [hrx, hry] = o.bas;
  const th = o.govde[1];
  const tau = (P.rot + P.govde) * DEG;
  // bacaklar (pelvis orijinli)
  const legs = {};
  for (const [side, s] of [['L', -1], ['R', 1]]) {
    const ang = (side === 'L' ? P.bacL : P.bacR) + s * P.acik;
    const a1 = ang * DEG;
    const a2 = (ang - (side === 'L' ? P.dizL : P.dizR)) * DEG;
    const hip = [s * o.kalcaX, 0];
    const knee = [hip[0] + Math.sin(a1) * o.bacakUst, hip[1] + Math.cos(a1) * o.bacakUst];
    const foot = [knee[0] + Math.sin(a2) * o.bacakAlt, knee[1] + Math.cos(a2) * o.bacakAlt];
    legs[side] = { hip, knee, foot };
  }
  const sole = o.ayak[1] * 0.6;
  const groundY = -(Math.max(legs.L.foot[1], legs.R.foot[1]) + sole);
  const px = P.x;
  const py = groundY + P.y;
  const T = (u, v) => {
    const [a, b] = rotv(u, v, tau);
    return [px + a, py + b];
  };
  const rig = { tau, px, py, T, legs: {}, hrx, hry, th, tw: o.govde[0] };
  for (const side of ['L', 'R']) {
    const l = legs[side];
    rig.legs[side] = { hip: [px + l.hip[0], py + l.hip[1]], knee: [px + l.knee[0], py + l.knee[1]], foot: [px + l.foot[0], py + l.foot[1]] };
  }
  // baş (kollar IK için baş konumunu bilmeli)
  const hAng = tau + P.bas * DEG;
  const neck = T(0, -th);
  const [hx, hy] = rotv(0, -(o.boyun + hry), hAng);
  rig.head = [neck[0] + hx + P.basX, neck[1] + hy + P.basY];
  rig.headAng = hAng;
  rig.neck = neck;
  const headLocal = rotv(rig.head[0] - px, rig.head[1] - py, -tau);
  // kollar (gövde çerçevesinde hesaplanır)
  rig.arms = {};
  for (const [side, s] of [['L', -1], ['R', 1]]) {
    let phi = side === 'L' ? P.kolL : P.kolR;
    let e = side === 'L' ? P.dirL : P.dirR;
    const sh = [s * o.omuzX, -th + o.omuzY - P.omuz];
    const ikw = clamp01(P['ik' + side + 'W']);
    const spec = P.ik?.[side];
    if (ikw > 0.001 && spec) {
      const X = P['ik' + side + 'X'];
      const Y = P['ik' + side + 'Y'];
      let tg;
      if (spec.ref === 'govde') tg = [s * X * (o.govde[0] / 2), -th * Y];
      else {
        const off = rotv(s * X * hrx, Y * hry, P.bas * DEG);
        tg = [headLocal[0] + off[0], headLocal[1] + off[1]];
      }
      const [p1, ee] = solveIK(sh, tg, o.kolUst, o.kolAlt, s, spec.dirsek);
      phi = lerpAng(phi, p1, ikw);
      e = lerpAng(e, ee, ikw);
    }
    // yukarı kalkmış kol kafayı delmesin: dirsek / el baş elipsinin içine giriyorsa kolu dışa aç (yüze temas pozlarına — IK / onL-onR — dokunma)
    if (phi > 100 && ikw < 0.3 && (side === 'L' ? P.onL : P.onR) < 0.5) {
      const inside = (pt) => {
        const q = T(...pt);
        const dx = (q[0] - rig.head[0]) / (hrx * 1.1);
        const dy = (q[1] - rig.head[1]) / (hry * 1.1);
        return dx * dx + dy * dy < 1;
      };
      const pts = (p) => {
        const w1 = dirv(s, p);
        const w2 = dirv(s, p + e);
        const elb = [sh[0] + w1[0] * o.kolUst, sh[1] + w1[1] * o.kolUst];
        return [elb, [elb[0] + w2[0] * o.kolAlt, elb[1] + w2[1] * o.kolAlt]];
      };
      for (let k = 0; k <= 14; k++) {
        const [elb, hnd] = pts(phi - k * 5);
        if (!inside(elb) && !inside(hnd)) {
          phi -= k * 5;
          break;
        }
      }
    }
    const v1 = dirv(s, phi);
    const el = [sh[0] + v1[0] * o.kolUst, sh[1] + v1[1] * o.kolUst];
    const v2 = dirv(s, phi + e);
    const hd = [el[0] + v2[0] * o.kolAlt, el[1] + v2[1] * o.kolAlt];
    const handW = T(...hd);
    // el başın üstüne biniyorsa kol başın önünde çizilir (başın arkasında kalmasın); aksi hâlde arkada
    const hx = (handW[0] - rig.head[0]) / (hrx * 1.18);
    const hy = (handW[1] - rig.head[1]) / (hry * 1.18);
    rig.arms[side] = { sh: T(...sh), el: T(...el), hand: handW, ang: phi + e, s, front: (side === 'L' ? P.onL : P.onR) > 0.5 || hx * hx + hy * hy < 1 };
  }
  return rig;
}

// ════════════════════════════════════════════════════════════════════════════
//  ANA ÇİZİM
// ════════════════════════════════════════════════════════════════════════════
function placeholder(ctx, layer, t, st) {
  ctx.save();
  ctx.globalAlpha = 0.85 * st.opacity;
  ctx.strokeStyle = '#e11d48';
  ctx.setLineDash([8, 6]);
  ctx.lineWidth = 3;
  ctx.strokeRect(-70, -300, 140, 300);
  ctx.setLineDash([]);
  ctx.fillStyle = '#e11d48';
  ctx.font = '600 26px system-ui';
  ctx.textAlign = 'center';
  ctx.fillText(`? ${layer.karakter}`, 0, -150);
  ctx.restore();
  return { x0: -70, y0: -300, x1: 70, y1: 0 };
}

const TARGET_LOOK = { ileri: [0, 0], sag: [1, 0], sol: [-1, 0], yukari: [0, -1], asagi: [0, 0.9] };

/**
 * Karakteri çizer. ctx: dünya çerçevesi (kamera uygulanmış). Katman dönüşümünü (konum, dönme, ölçek) kendisi kurar.
 * lookup(id) → { cx, cy } (sahne px) hedef katman merkezi (işaret / bakış için).
 * @returns {{ bbox, matrix }} yerel kutu + katman matrisi
 */
export function drawCharacter(ctx, layer, t, st, scene, res, th, lookup) {
  const C = resolveCharacter(layer, res);
  const W = scene.width;
  const H = scene.height;
  const col = (c) => resolveRef(c, th);

  const self = { x: st.x, y: st.y };
  const tgt = (id) => {
    if (Array.isArray(id)) return { x: id[0], y: id[1] };
    if (id && typeof id === 'object') return { x: id.x, y: id.y };
    const b = lookup?.(id);
    return b ? { x: b.cx, y: b.cy } : null;
  };
  const baseX = st.x;
  const baseY = st.y;

  ctx.save();
  if (!C) {
    ctx.translate(baseX, baseY);
    ctx.rotate(st.rotation * DEG);
    ctx.scale(st.scale * st.scaleX, st.scale * st.scaleY);
    const matrix = ctx.getTransform();
    const bbox = placeholder(ctx, layer, t, st);
    ctx.restore();
    return { bbox, matrix };
  }

  const metrics = characterMetrics(C);
  const boy = C.boy;
  const segs = buildTimeline(layer, C, scene, { self, target: tgt }, t);
  const S = stateAt(segs, t);
  const seg = S.seg;
  const k = S.k;
  const Sc = Math.abs(st.scale) || 1;

  // ---- konum + dönüşüm
  const ox = baseX + S.dx;
  const oy = baseY + S.dy;
  ctx.translate(ox, oy);
  ctx.rotate(st.rotation * DEG);
  ctx.scale(st.scale * st.scaleX, st.scale * st.scaleY);
  const matrix = ctx.getTransform();
  ctx.globalAlpha *= st.opacity;
  ctx.save(); // gövde çerçevesi (balon bunun dışında çizilir)
  if (st.fold < 1) {
    const pop = easings.outBack(clamp01(st.fold));
    ctx.globalAlpha *= clamp01(st.fold * 2.2);
    ctx.scale(0.6 + 0.4 * pop, 0.6 + 0.4 * pop);
  }

  // ---- poz
  const hizOf = (s) => {
    if (s.hiz != null) return s.hiz;
    if (s.clip.adim && (s.dx || s.dy)) {
      const speed = Math.hypot(s.dx || 0, s.dy || 0) / s.moveDur;
      const stride = s.clip.adim * metrics.legLen * boy * Sc;
      return clamp((speed / Math.max(1, stride)) * (s.clip.sure || 1), 0.4, 3.2);
    }
    return 1;
  };
  const evalSeg = (s) => {
    const tl = Math.max(0, t - s.t0);
    const P = poseAt(s.clip, tl, hizOf(s), s.faz);
    if (s.clip.isaret && s.hedef != null) {
      const tp = tgt(s.hedef);
      if (tp) {
        const o = C.olcu;
        const shx = ox + (o.omuzX * 0.9 * S.flip) * boy * Sc;
        const shy = oy - (metrics.legLen + o.govde[1] - o.omuzY) * boy * Sc;
        const dxs = (tp.x - shx) * (S.flip < 0 ? -1 : 1);
        const dys = tp.y - shy;
        const phi = Math.atan2(Math.abs(dxs), dys) / DEG;
        const rest = 10;
        const full = s.clip.poz?.kolR ? evalTrack(s.clip.poz.kolR, 1) : 100;
        const r = (P.kolR - rest) / Math.max(1, full - rest);
        P.kolR = rest + (phi - rest) * r;
        P.dirR = 0;
      }
    }
    return P;
  };
  let P = evalSeg(seg);
  if (k > 0 && t - seg.t0 < seg.gecis) {
    P = lerpPose(evalSeg(segs[k - 1]), P, sstep((t - seg.t0) / seg.gecis));
  }
  if (layer.nefes !== false) {
    P.sq *= 1 + 0.012 * Math.sin(t * 1.9);
    P.bas += 0.8 * Math.sin(t * 1.3);
  }
  // bakış
  const look = [0, 0];
  const lookSrc = seg.bakVal;
  if (lookSrc != null) {
    let v = null;
    if (typeof lookSrc === 'string' && TARGET_LOOK[lookSrc]) v = TARGET_LOOK[lookSrc];
    else if (Array.isArray(lookSrc) && typeof lookSrc[0] === 'number' && Math.abs(lookSrc[0]) <= 1.5 && Math.abs(lookSrc[1]) <= 1.5) v = lookSrc;
    else {
      const tp = tgt(lookSrc);
      if (tp) {
        const hx = ox + (S.flip * 0);
        const dxs = (tp.x - hx) * (S.flip < 0 ? -1 : 1);
        const dys = tp.y - (oy - metrics.height * 0.8 * Sc);
        const n = Math.hypot(dxs, dys) || 1;
        const mag = clamp(n / (W * 0.25), 0, 1);
        v = [(dxs / n) * mag, (dys / n) * mag];
      }
    }
    if (v) {
      look[0] = v[0];
      look[1] = v[1];
      P.bas += v[0] * 3;
      P.basX += v[0] * 3;
    }
  }

  // ---- yüz
  const emoNow = faceOf(C, seg.duyguVal, seg.siddetVal);
  let face = emoNow;
  if (k > 0 && t - seg.t0 < Math.max(0.2, seg.gecis)) {
    const pv = segs[k - 1];
    if (pv.duyguVal !== seg.duyguVal || pv.siddetVal !== seg.siddetVal) {
      face = blendFace(faceOf(C, pv.duyguVal, pv.siddetVal), emoNow, sstep((t - seg.t0) / Math.max(0.2, seg.gecis)));
    }
  }
  face = { ...face, bakis: [face.bakis[0] + look[0], face.bakis[1] + look[1]] };
  const seed = hashStr(layer.id || layer.karakter);
  // konuşma
  let talk = null;
  let talkGen = 0;
  const speeches = (layer.soz || []).filter((e) => e.metin != null);
  let cur = null;
  for (const e of speeches) {
    const a = e.t || 0;
    if (t >= a && t <= a + speechDur(e)) cur = e;
  }
  if (cur && t - (cur.t || 0) < speechType(cur) + 0.4) {
    const x = t * 11 + (seed % 5);
    talk = 0.18 + 0.82 * Math.abs(Math.sin(x) * (0.65 + 0.35 * Math.sin(t * 3.7 + 1)));
    talkGen = 0.5 + 0.5 * Math.sin(t * 7.3 + 2);
  }
  const blink = blinkAt(t, seed);

  // ---- renkler
  const R = C.renkler;
  const lineC = col(C.cizgi.renk);
  const colors = {
    cizgi: lineC,
    goz: col(R.goz || lineC),
    agiz: col(R.agiz || '#7a1f2b'),
    yanak: col(R.yanak || '#ff8f8f'),
    burun: col(R.burun || R.yanak || '#ff8f8f'),
    iris: col(R.iris || R.goz || lineC),
    irisLight: lighter(col(R.iris || R.goz || lineC), 0.35),
    led: col(R.led || R.goz || lineC),
  };
  const fillOf = (name) => col(R[name] || (name === 'kol' || name === 'bacak' ? R.govde : name === 'el' ? R.kol || R.govde : name === 'ayak' ? R.bacak || R.govde : R.govde));
  beginJitter(C.cizgi.titrek || 0, C.cizgi.kaynama ? Math.floor(t / C.cizgi.kaynama) : 0, seed);

  // nesne tutan kol serbestse (aksiyon o kolu kullanmıyorsa) nesneyi taşıyacak şekilde IK ile kaldır
  const held = seg.tutarVal;
  const heldOn = !!(held && (held.nesne || held.tur));
  const heldSide = heldOn ? (held.el === 'L' ? 'L' : 'R') : null;
  if (heldOn && P['kol' + heldSide] < 40 && (P['ik' + heldSide + 'W'] || 0) < 0.1) {
    const cr = CARRY[held.nesne || held.tur] || CARRY.varsayilan;
    P['ik' + heldSide + 'W'] = 1;
    P['ik' + heldSide + 'X'] = cr[0];
    P['ik' + heldSide + 'Y'] = cr[1];
    P.ik = { ...(P.ik || {}), [heldSide]: { ref: 'govde', dirsek: 'asagi' } };
  }
  const rig = buildRig(C, P);
  const o = C.olcu;
  const lw = C.cizgi.kalinlik;
  const env = { C, hrx: rig.hrx, hry: rig.hry, tw: rig.tw, th: rig.th, lw, line: outlineOf(C, fillOf('kafa'), lineC), col, t, font: C.balon?.font || layer.balon?.font };

  // ---- gövde dönüşümü: boy, yön (flip), ezilme
  const flip = S.flip;
  ctx.scale(boy * (Math.abs(flip) < 0.02 ? (flip < 0 ? -0.02 : 0.02) : flip), boy);
  const sqy = P.sq;
  const sqx = 1 / Math.sqrt(Math.max(0.3, sqy));
  ctx.scale(sqx, sqy);

  // yer gölgesi
  if (layer.golge ?? C.golge) {
    const lift = clamp01(-P.y / 160);
    ctx.save();
    ctx.globalAlpha *= 0.22 * (1 - lift * 0.6);
    ctx.fillStyle = '#2a1a10';
    ctx.beginPath();
    ctx.ellipse(P.x, 3, (o.govde[0] * 0.75) * (1 - lift * 0.3), 10 * (1 - lift * 0.3), 0, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  const headC = rig.head;
  const inFrame = (frame, fn) => {
    ctx.save();
    if (frame === 'kafa') {
      ctx.translate(headC[0], headC[1]);
      ctx.rotate(rig.headAng);
    } else {
      ctx.translate(rig.px, rig.py);
      ctx.rotate(rig.tau);
    }
    fn();
    ctx.restore();
  };
  const eks = C.ekAktif || [];

  // 1) arka ekler
  for (const ek of eks) {
    if (ekHasBack(ek)) inFrame(ekFrame(ek), () => drawEkBack(ctx, ek, env));
  }

  inFrame('govde', () => torsoBack(ctx, C, col, o.govde[0], o.govde[1], lineC, lw));

  // 2) bacaklar + ayaklar
  const limbW = C.uzuv.kalinlik;
  const tube = C.uzuv.tur === 'tup' || C.uzuv.tur === 'kalin';
  const limb = (pts, fill, w) => drawLimb(ctx, C, pts, fill, w, lineC, lw, tube);
  const legW = tube ? limbW * 1.7 : limbW;
  for (const side of ['L', 'R']) {
    const l = rig.legs[side];
    limb([l.hip, l.knee, l.foot], fillOf('bacak'), legW);
    drawFoot(ctx, C, l.foot, side === 'L' ? -1 : 1, fillOf('ayak'), lineC, lw);
  }

  // 3) gövde
  ctx.save();
  ctx.translate(rig.px, rig.py);
  ctx.rotate(rig.tau);
  const [tw, tH] = o.govde;
  if (o.boyun >= 4) {
    const nw = (o.boyunGen ?? 12) / 2;
    shape(ctx, rrectPts(-nw, -tH - o.boyun - 6, nw, -tH + 6, 2), fillOf('kafa'), outlineOf(C, fillOf('kafa'), lineC), lw);
  }
  const rad = C.govde.yaricap;
  const gsh = C.govde.sekil;
  let tpts;
  if (gsh === 'elbise') {
    const q = [[-tw * 0.34, -tH], [tw * 0.34, -tH], [tw * 0.78, 0], [-tw * 0.78, 0]];
    tpts = q.flatMap((p) => [p, p, p]); // köşeler keskin kalsın (yumuşatma yarıçapı küçülür)
  }
  else if (gsh === 'yumurta') tpts = eggPts(tw / 2, tH / 2, 32).map(([x, y]) => [x, y - tH / 2]);
  else if (gsh === 'kapsul') tpts = rrectPts(-tw / 2, -tH, tw / 2, 0, tw / 2);
  else if (gsh === 'kutu') tpts = rrectPts(-tw / 2, -tH, tw / 2, 0, 9);
  else tpts = rrectPts(-tw / 2, -tH, tw / 2, 0, rad);
  shape(ctx, tpts, gradFill(ctx, C, tpts, fillOf('govde')), outlineOf(C, fillOf('govde'), lineC), lw);
  torsoDetails(ctx, C, col, tpts, tw, tH, lineC, lw, t);
  torsoGloss(ctx, C, tw, tH);
  ctx.restore();
  // gövde önü ekler
  for (const ek of eks) {
    if (ekFrame(ek) === 'govde' && !ekHasBack(ek)) inFrame('govde', () => drawEkFront(ctx, ek, env));
  }

  // 4) kollar + eller + tutulan nesne (front=true olanlar başın önünde, 5'ten sonra çizilir)
  const armW = tube ? limbW * 1.6 : limbW;
  const drawArms = (front) => {
    for (const side of ['L', 'R']) {
      const a = rig.arms[side];
      if (a.front !== front) continue;
      limb([a.sh, a.el, a.hand], fillOf('kol'), armW);
      drawHand(ctx, C, a.hand, a.ang, a.s, rig.tau, fillOf('el'), lineC, lw);
    }
  };
  drawArms(false);

  // 5) baş
  ctx.save();
  ctx.translate(headC[0], headC[1]);
  ctx.rotate(rig.headAng);
  const [hrx, hry] = o.bas;
  const ksh = C.kafa.sekil;
  let hpts;
  if (ksh === 'yumurta') hpts = eggPts(hrx, hry, 40);
  else if (ksh === 'kutu') hpts = rrectPts(-hrx, -hry, hrx, hry, Math.min(hrx, hry) * 0.32, 8);
  else if (ksh === 'yumusak-kare') hpts = superPts(hrx, hry, 3.6, 44);
  else hpts = ellipsePts(hrx, hry, 40);
  headBack(ctx, C, col, hrx, hry, lineC, lw);
  shape(ctx, hpts, gradFill(ctx, C, hpts, fillOf('kafa')), outlineOf(C, fillOf('kafa'), lineC), lw);
  headFront(ctx, C, col, hrx, hry, lineC, lw, hpts);
  const fo = { t, blink, look: face.bakis, talk, talkGen, c: colors };
  drawFace(ctx, C, face, hrx, hry, fo);
  for (const ek of eks) {
    if (ekFrame(ek) === 'kafa') drawEkFront(ctx, ek, env);
  }
  drawFaceFx(ctx, C, face, hrx, hry, fo);
  ctx.restore();
  drawArms(true);
  if (heldOn) {
    const a = rig.arms[heldSide];
    ctx.save();
    ctx.translate(a.hand[0], a.hand[1]);
    ctx.rotate(rig.tau * 0.3 + (held.donme || 0) * DEG);
    drawProp(ctx, held, { ...env, dir: heldSide === 'L' ? -1 : 1 });
    ctx.restore();
    drawHand(ctx, C, a.hand, a.ang, a.s, rig.tau, fillOf('el'), lineC, lw); // el nesnenin üstünde
  }

  // 6) efekt (başın üstü)
  const efektName = seg.efekt !== undefined ? seg.efekt : seg.clip.efekt;
  if (efektName) {
    drawEffect(ctx, efektName, { x: headC[0] + hrx * 1.25, y: headC[1] - hry * 1.5, age: t - seg.t0, t, s: hry * 0.9, line: lineC });
  }
  ctx.restore(); // gövde çerçevesi sonu

  // ---- konuşma balonu: katman uzayında ama ölçeksiz (sahne pikseli), yön çevirmesinden bağımsız
  const bub = speeches.filter((e) => t >= (e.t || 0) - 0.001 && t <= (e.t || 0) + speechDur(e));
  const bubble = bub[bub.length - 1];
  if (bubble && !(layer.balon && layer.balon.gizle)) { // balon.gizle: balon çizilmez (ağız yine konuşur; altyazıyı üreteç ayrı katmanla verir)
    const b = { ...C.balon, ...layer.balon };
    const baseFsz = b.boyut ?? clamp(Math.min(W, H) * 0.047, 26, 66);
    const text = String(bubble.metin);
    ctx.save();
    ctx.scale(1 / (st.scale * st.scaleX || 1), 1 / (st.scale * st.scaleY || 1));
    // uzun metin: balon genişler, yazı kontrollü küçülür (kafanın üstündeki boşluğa sığana dek)
    const nChars = [...text].length;
    const longK = clamp((nChars - 40) / 120, 0, 1);
    const maxW = b.genislik ?? Math.min(W * (0.46 + 0.2 * longK), 640 + 260 * longK);
    const availH = Math.max(120, (headC[1] - o.bas[1] * 1.12) * boy * P.sq * Sc + oy - H * 0.04);
    let fsz = baseFsz;
    let L = bubbleLayout(ctx, text, bubble.tur, fsz, maxW, b.font, b.agirlik || 700);
    if (b.boyut == null) {
      const minF = baseFsz * 0.62;
      while (L.h > availH * 0.9 && fsz > minF) {
        fsz = Math.max(minF, fsz * 0.93);
        L = bubbleLayout(ctx, text, bubble.tur, fsz, maxW, b.font, b.agirlik || 700);
      }
    }
    const age = t - (bubble.t || 0);
    const total = [...text].length;
    const shown = Math.min(total, Math.ceil(total * clamp01(age / Math.max(0.2, speechType(bubble)))));
    const endIn = (bubble.t || 0) + speechDur(bubble) - t;
    const side = bubble.taraf === 'sol' ? -1 : bubble.taraf === 'sag' ? 1 : (ox < W / 2 ? 1 : -1);
    const ax = headC[0] * S.flip * boy * P.sq ** -0.5 * Sc;
    const ay = (headC[1] - o.bas[1] * 1.12) * boy * P.sq * Sc;
    drawBubble(ctx, {
      text, tur: bubble.tur, fsz, font: b.font, weight: b.agirlik || 700,
      zemin: col(b.zemin || '#ffffff'), cizgi: col(b.cizgi || C.cizgi.renk), yazi: col(b.yazi || '#1f1c2e'), lw: Math.max(2.5, fsz * 0.085),
      ax, ay, side, L, age, shown, out: endIn < 0.18 ? 1 - endIn / 0.18 : 0,
      bounds: { x0: -ox, x1: W - ox, y0: -oy },
    });
    ctx.restore();
  }

  ctx.restore();
  const half = metrics.width / 2;
  return { bbox: { x0: -half, y0: -metrics.height, x1: half, y1: 0 }, matrix };
}

