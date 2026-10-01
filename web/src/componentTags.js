// Bileşen etiket sistemi (saf modül: tarayıcı, sunucu ve CLI aynı kodu kullanır).
//   doc.etiketler = { amac: [], konu: [], ton: [], stil: [], icerik: [], yerlesim: [], boyut: [], gereksinim: [], anahtar: [] }
// Sözlük (facet → değer → {ad, es}) data/bilesen-etiketleri.json içindedir; yoksa DEFAULT_TAXONOMY kullanılır.
// `es` = Türkçe/İngilizce eş anlamlılar: "kaç kişi izledi" → sayaç, "premium plan" → fiyat kartı gibi aramaları yakalar.

import { WIDGET2_TYPES, widget2Size } from './engine/widgets2.js';

const V = (ad, es = '') => ({ ad, es });

export const FACET_ORDER = ['amac', 'konu', 'ton', 'stil', 'icerik', 'yerlesim', 'boyut', 'gereksinim'];

export const DEFAULT_TAXONOMY = {
  amac: {
    ad: 'Amaç',
    ipucu: 'Bileşen videoda ne işe yarar?',
    degerler: {
      'veri-hikayesi': V('Veri hikâyesi', 'data statistics numbers chart views viewers subscribers istatistik rakam sayı veri grafik izlenme görüntülenme izleyici abone kaç kişi'),
      karsilastirma: V('Karşılaştırma', 'compare versus vs compare fark kıyas sıralama ranking'),
      'ilerleme-takip': V('İlerleme / takip', 'progress tracking trend growth büyüme gelişim yüzde'),
      'vurgu-dikkat': V('Vurgu / dikkat çekme', 'highlight emphasis attention spotlight öne çıkar vurgula büyük rakam milestone dönüm noktası'),
      'zaman-sayim': V('Zaman / geri sayım', 'countdown timer clock deadline süre sayaç saat'),
      tanitim: V('Ürün / uygulama tanıtımı', 'product app promo showcase demo tanıtım ürün uygulama'),
      'gorsel-sergi': V('Görsel sergileme', 'photo image gallery showcase fotoğraf resim görsel'),
      'egitim-anlatim': V('Eğitim / anlatım', 'education tutorial how to steps explain adım nasıl öğretici'),
      'liste-ozet': V('Liste / özet', 'list summary checklist recap özet madde liste'),
      'sosyal-kanit': V('Sosyal kanıt', 'rating review testimonial trust puan yorum güven'),
      fiyatlandirma: V('Fiyatlandırma', 'pricing plan subscription cost fiyat paket abonelik'),
      'cagri-eylem': V('Harekete geçirici çağrı', 'cta call to action button buy join düğme satın al katıl'),
      'kimlik-tanitim': V('Kişi / marka tanıtımı', 'person name title lower third speaker profile isim unvan konuşmacı marka'),
      'bildirim-uyari': V('Bildirim / uyarı', 'notification alert warning toast mesaj uyarı bildirim'),
      'alinti-soz': V('Alıntı / söz', 'quote saying testimonial motto söz alıntı özlü'),
      'kod-teknik': V('Kod / teknik gösterim', 'code terminal programming developer command kod komut yazılım'),
      'ses-muzik': V('Ses / müzik görselleştirme', 'audio music sound waveform equalizer ses müzik ekolayzer'),
      'sohbet-diyalog': V('Sohbet / diyalog', 'chat dialog conversation speech bubble konuşma sohbet mesajlaşma'),
      'ic-ses-duygu': V('İç ses / duygu / düşünce', 'thought bubble feeling emotion inner voice think düşünce iç ses duygu merak hayret'),
      'ipucu-yonlendirme': V('İpucu / yönlendirme', 'tip hint tooltip callout annotation pointer ipucu ok işaret yönlendir açıklama'),
      'not-hatirlatma': V('Not / hatırlatma', 'note reminder sticky memo not hatırlatma post-it'),
      'anlatici-gecis': V('Anlatıcı / sahne geçişi', 'narrator caption transition scene comic anlatıcı altyazı sahne geçişi'),
      'yorum-etkilesim': V('Yorum / etkileşim', 'comment reaction like emoji interaction yorum tepki beğeni etkileşim'),
      'etkinlik-tarih': V('Etkinlik / tarih', 'event date calendar schedule etkinlik tarih takvim gün'),
    },
  },
  konu: {
    ad: 'Konu / sektör',
    ipucu: 'Hangi tür videolara yakışır?',
    degerler: {
      genel: V('Genel', 'any general generic her konu'),
      teknoloji: V('Teknoloji', 'technology tech digital dijital teknoloji'),
      yazilim: V('Yazılım / geliştirici', 'software developer programming coding yazılım kodlama geliştirici'),
      'finans-is': V('Finans / iş', 'finance business money revenue sales gelir para satış iş ekonomi'),
      'e-ticaret': V('E-ticaret / pazarlama', 'ecommerce shop marketing campaign sale indirim kampanya mağaza pazarlama'),
      'sosyal-medya': V('Sosyal medya', 'social media instagram youtube tiktok followers takipçi paylaşım'),
      haber: V('Haber / gündem', 'news breaking headline haber son dakika gündem'),
      egitim: V('Eğitim / okul', 'education school learning course eğitim okul ders'),
      'saglik-spor': V('Sağlık / spor', 'health fitness sport workout sağlık spor egzersiz'),
      'muzik-eglence': V('Müzik / eğlence', 'music entertainment fun party müzik eğlence'),
      'uygulama-urun': V('Uygulama / ürün', 'app product saas mobile uygulama ürün'),
      'etkinlik-organizasyon': V('Etkinlik / organizasyon', 'event conference meetup schedule etkinlik konferans'),
    },
  },
  ton: {
    ad: 'Ton / his',
    ipucu: 'Videoya nasıl bir hava katar?',
    degerler: {
      'ciddi-kurumsal': V('Ciddi / kurumsal', 'serious corporate professional formal ciddi kurumsal profesyonel'),
      eglenceli: V('Eğlenceli / oyunsu', 'fun playful cheerful colorful eğlenceli neşeli oyunsu'),
      'premium-sik': V('Premium / şık', 'premium elegant luxury stylish şık lüks zarif'),
      minimal: V('Minimal / sade', 'minimal clean simple sade temiz'),
      enerjik: V('Enerjik / hareketli', 'energetic dynamic fast bold enerjik hareketli canlı'),
      sakin: V('Sakin / yumuşak', 'calm soft gentle quiet sakin yumuşak huzurlu'),
      'dikkat-cekici': V('Dikkat çekici', 'eye catching loud bold striking dikkat çekici çarpıcı'),
      sinematik: V('Sinematik / dramatik', 'cinematic dramatic moody film sinematik dramatik'),
      nostaljik: V('Nostaljik / samimi', 'nostalgic vintage retro memory nostaljik samimi anı'),
      komik: V('Komik / çizgi film', 'comic cartoon funny humor çizgi film komik mizah'),
      teknik: V('Teknik / mühendis', 'technical geek engineering developer teknik mühendis'),
    },
  },
  stil: {
    ad: 'Görünüm',
    ipucu: 'Renk ve yüzey',
    degerler: {
      koyu: V('Koyu zemin', 'dark night black koyu karanlık gece'),
      acik: V('Açık zemin', 'light white bright açık beyaz aydınlık'),
      renkli: V('Renkli / vurgulu', 'colorful vivid accent renkli canlı vurgu'),
      kartli: V('Kart zeminli', 'card panel surface kart panel gölgeli'),
      kartsiz: V('Kartsız / şeffaf', 'transparent no card borderless kartsız şeffaf'),
      yuvarlak: V('Yuvarlak hatlı', 'round circle pill rounded yuvarlak daire'),
      keskin: V('Keskin / düz hatlı', 'sharp square flat keskin kare düz'),
      golgeli: V('Gölgeli / derinlikli', 'shadow depth elevated gölge derinlik'),
    },
  },
  icerik: {
    ad: 'İçerik türü',
    ipucu: 'Bileşenin içinde ne gösterilir?',
    degerler: {
      sayi: V('Sayı / rakam', 'number digit count sayı rakam'),
      metin: V('Metin', 'text sentence quote metin cümle yazı'),
      liste: V('Liste', 'list items bullets liste madde'),
      tablo: V('Tablo', 'table rows columns tablo satır sütun'),
      grafik: V('Grafik', 'chart graph plot grafik çizelge'),
      gorsel: V('Görsel / fotoğraf', 'image photo picture görsel fotoğraf resim'),
      video: V('Video', 'video clip movie video klip'),
      ses: V('Ses', 'audio sound music ses müzik'),
      zaman: V('Zaman', 'time clock timer zaman süre'),
      kod: V('Kod / komut', 'code command terminal kod komut'),
      emoji: V('Emoji / tepki', 'emoji reaction heart like tepki beğeni kalp'),
      simge: V('Simge / rozet', 'icon badge sticker stamp simge rozet damga'),
      kisi: V('Kişi / profil', 'person avatar profile kişi avatar profil'),
    },
  },
  yerlesim: {
    ad: 'Yerleşim',
    ipucu: 'Ekranda nereye / hangi formata uyar?',
    degerler: {
      'dikey-uyumlu': V('Dikey format uyumlu', 'portrait vertical reels shorts tiktok dikey'),
      'yatay-uyumlu': V('Yatay format uyumlu', 'landscape horizontal youtube yatay geniş'),
      'kare-uyumlu': V('Kare / her format', 'square any format kare'),
      'orta-odak': V('Ortada odak', 'center focus hero orta odak'),
      'alt-bant': V('Alt bant', 'lower third bottom strip alt bant'),
      'ust-bildirim': V('Üstte beliren', 'top toast notification üst bildirim'),
      'kose-etiket': V('Köşe / etiket', 'corner badge sticker köşe etiket'),
      'tam-genislik': V('Tam genişlik', 'full width wide banner tam genişlik'),
    },
  },
  boyut: {
    ad: 'Boyut',
    ipucu: 'Kapladığı alan',
    degerler: { kucuk: V('Küçük', 'small compact küçük'), orta: V('Orta', 'medium orta'), buyuk: V('Büyük', 'large big büyük') },
  },
  gereksinim: {
    ad: 'Gereksinim',
    ipucu: 'Kullanırken ne sağlamalısın?',
    degerler: {
      'metin-gerek': V('Metin ver', 'needs text provide text metin yaz'),
      'veri-gerek': V('Veri ver', 'needs data provide data veri değer ver'),
      'medya-gerek': V('Medya dosyası ver', 'needs media file src dosya resim ver'),
      'ses-gerek': V('Müzik izi gerekli', 'needs audio track müzik izi gerekli'),
      'liste-gerek': V('Satır listesi ver', 'needs lines list satır liste ver'),
      'kendi-basina': V('Hazır kullanılır', 'ready standalone hazır'),
    },
  },
};

// ------------------------------------------------------------------ metin yardımcıları
export const norm = (s) =>
  String(s ?? '')
    .toLocaleLowerCase('tr')
    .replace(/[çğıöşü]/g, (c) => ({ ç: 'c', ğ: 'g', ı: 'i', ö: 'o', ş: 's', ü: 'u' })[c])
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
const STOP = new Set(['ve', 'bir', 'ile', 'icin', 'bu', 'the', 'and', 'with', 'for', 'of', 'to', 'in', 'a', 'an', 'bilesen', 'component', 'video']);
export const tokens = (s) => norm(s).split(' ').filter((t) => t.length > 1 && !STOP.has(t));

/** Sözlük: dosyadaki sözlük varsayılanın üstüne biner (yeni facet / değer eklenebilir). */
export function mergeTaxonomy(custom) {
  const out = JSON.parse(JSON.stringify(DEFAULT_TAXONOMY));
  for (const [f, def] of Object.entries(custom?.facetler || custom || {})) {
    if (!def || typeof def !== 'object') continue;
    out[f] = { ...(out[f] || { ad: f, degerler: {} }), ...def, degerler: { ...(out[f]?.degerler || {}), ...(def.degerler || {}) } };
  }
  return out;
}

// ------------------------------------------------------------------ otomatik etiketleme
const T = (amac, konu, ton, icerik, extra = {}) => ({ amac, konu, ton, icerik, ...extra });
const KIND_TAGS = {
  'chart/bar': T(['veri-hikayesi', 'karsilastirma'], ['finans-is', 'genel'], ['ciddi-kurumsal'], ['grafik', 'sayi'], { gereksinim: ['veri-gerek'] }),
  'chart/yatay': T(['karsilastirma', 'liste-ozet'], ['genel', 'finans-is'], ['ciddi-kurumsal'], ['grafik', 'sayi'], { gereksinim: ['veri-gerek'] }),
  'chart/line': T(['veri-hikayesi', 'ilerleme-takip'], ['finans-is', 'genel'], ['ciddi-kurumsal'], ['grafik', 'sayi'], { gereksinim: ['veri-gerek'] }),
  'chart/pie': T(['veri-hikayesi', 'karsilastirma'], ['finans-is', 'genel'], ['eglenceli', 'ciddi-kurumsal'], ['grafik', 'sayi'], { gereksinim: ['veri-gerek'] }),
  'chart/donut': T(['veri-hikayesi', 'ilerleme-takip', 'vurgu-dikkat'], ['genel', 'finans-is'], ['minimal'], ['grafik', 'sayi'], { gereksinim: ['veri-gerek'] }),
  'chart/sayac': T(['veri-hikayesi', 'vurgu-dikkat'], ['finans-is', 'sosyal-medya'], ['enerjik', 'dikkat-cekici'], ['sayi'], { gereksinim: ['veri-gerek'] }),
  'device/telefon': T(['tanitim', 'gorsel-sergi'], ['uygulama-urun', 'teknoloji'], ['minimal', 'premium-sik'], ['gorsel', 'video'], { gereksinim: ['kendi-basina'] }),
  'device/tablet': T(['tanitim', 'gorsel-sergi'], ['uygulama-urun', 'egitim'], ['minimal'], ['gorsel', 'video'], { gereksinim: ['kendi-basina'] }),
  'device/laptop': T(['tanitim', 'kod-teknik'], ['uygulama-urun', 'teknoloji', 'yazilim'], ['ciddi-kurumsal', 'teknik'], ['gorsel', 'video'], { gereksinim: ['kendi-basina'] }),
  'device/tarayici': T(['tanitim', 'gorsel-sergi'], ['uygulama-urun', 'e-ticaret', 'teknoloji'], ['ciddi-kurumsal'], ['gorsel', 'video'], { gereksinim: ['kendi-basina'] }),
  'media/-': T(['gorsel-sergi'], ['genel'], ['minimal'], ['gorsel', 'video'], { gereksinim: ['medya-gerek'] }),
  'waveform/-': T(['ses-muzik', 'vurgu-dikkat'], ['muzik-eglence', 'sosyal-medya'], ['enerjik', 'dikkat-cekici'], ['ses'], { gereksinim: ['ses-gerek'] }),
  'kart/alinti': T(['alinti-soz', 'sosyal-kanit'], ['genel', 'egitim', 'sosyal-medya'], ['sinematik', 'sakin'], ['metin'], { gereksinim: ['metin-gerek'] }),
  'kart/istatistik': T(['veri-hikayesi', 'vurgu-dikkat'], ['finans-is', 'teknoloji', 'sosyal-medya'], ['ciddi-kurumsal', 'enerjik'], ['sayi'], { gereksinim: ['metin-gerek'] }),
  'kart/fiyat': T(['fiyatlandirma', 'cagri-eylem', 'karsilastirma'], ['e-ticaret', 'uygulama-urun', 'finans-is'], ['premium-sik', 'ciddi-kurumsal'], ['liste', 'sayi'], { gereksinim: ['metin-gerek', 'liste-gerek'] }),
  'kart/profil': T(['kimlik-tanitim', 'sosyal-kanit'], ['sosyal-medya', 'genel'], ['sakin', 'minimal'], ['kisi', 'sayi'], { gereksinim: ['metin-gerek', 'liste-gerek'] }),
  'kart/bildirim': T(['bildirim-uyari', 'sohbet-diyalog'], ['uygulama-urun', 'teknoloji', 'sosyal-medya'], ['dikkat-cekici', 'minimal'], ['metin', 'simge'], { gereksinim: ['metin-gerek'] }),
  'kart/rozet': T(['vurgu-dikkat', 'cagri-eylem'], ['e-ticaret', 'sosyal-medya', 'genel'], ['dikkat-cekici', 'eglenceli'], ['simge', 'metin'], { gereksinim: ['metin-gerek'] }),
  'kart/puan': T(['sosyal-kanit'], ['e-ticaret', 'uygulama-urun'], ['sakin', 'minimal'], ['sayi', 'simge'], { gereksinim: ['metin-gerek'] }),
  'kart/altuc': T(['kimlik-tanitim'], ['haber', 'genel', 'sosyal-medya'], ['ciddi-kurumsal'], ['metin', 'kisi'], { gereksinim: ['metin-gerek'] }),
  'kart/takvim': T(['etkinlik-tarih', 'vurgu-dikkat'], ['etkinlik-organizasyon', 'genel'], ['sakin', 'minimal'], ['sayi', 'metin'], { gereksinim: ['metin-gerek'] }),
  'kart/balon': T(['sohbet-diyalog'], ['sosyal-medya', 'egitim', 'genel'], ['eglenceli', 'sakin'], ['metin'], { gereksinim: ['metin-gerek'] }),
  'liste/kontrol': T(['liste-ozet', 'egitim-anlatim', 'ilerleme-takip'], ['genel', 'egitim', 'uygulama-urun'], ['sakin', 'minimal'], ['liste'], { gereksinim: ['liste-gerek'] }),
  'liste/adimlar': T(['egitim-anlatim', 'ilerleme-takip'], ['egitim', 'genel', 'uygulama-urun'], ['sakin', 'ciddi-kurumsal'], ['liste'], { gereksinim: ['liste-gerek'] }),
  'liste/ilerleme': T(['ilerleme-takip', 'veri-hikayesi', 'karsilastirma'], ['genel', 'egitim', 'saglik-spor'], ['minimal', 'enerjik'], ['sayi', 'grafik'], { gereksinim: ['veri-gerek'] }),
  'liste/tablo': T(['karsilastirma', 'fiyatlandirma', 'liste-ozet'], ['finans-is', 'e-ticaret', 'uygulama-urun'], ['ciddi-kurumsal'], ['tablo'], { gereksinim: ['liste-gerek'] }),
  'kod/terminal': T(['kod-teknik', 'egitim-anlatim'], ['yazilim', 'teknoloji'], ['teknik', 'sinematik'], ['kod'], { gereksinim: ['liste-gerek'] }),
  'kod/editor': T(['kod-teknik', 'egitim-anlatim'], ['yazilim', 'teknoloji', 'egitim'], ['teknik'], ['kod'], { gereksinim: ['liste-gerek'] }),
  'balon/dusunce': T(['ic-ses-duygu', 'sohbet-diyalog'], ['genel', 'egitim', 'sosyal-medya'], ['eglenceli', 'sakin', 'komik'], ['metin'], { gereksinim: ['metin-gerek'] }),
  'balon/bagirma': T(['vurgu-dikkat', 'ic-ses-duygu'], ['genel', 'sosyal-medya', 'muzik-eglence'], ['enerjik', 'dikkat-cekici', 'komik'], ['metin'], { gereksinim: ['metin-gerek'] }),
  'balon/fisilti': T(['ic-ses-duygu', 'sohbet-diyalog'], ['genel', 'sosyal-medya'], ['sakin', 'minimal'], ['metin'], { gereksinim: ['metin-gerek'] }),
  'balon/anlatici': T(['anlatici-gecis'], ['genel', 'haber', 'egitim'], ['sinematik', 'komik', 'nostaljik'], ['metin'], { gereksinim: ['metin-gerek'] }),
  'balon/yaziyor': T(['sohbet-diyalog', 'bildirim-uyari'], ['sosyal-medya', 'uygulama-urun'], ['minimal', 'eglenceli'], ['simge'], { gereksinim: ['kendi-basina'] }),
  'balon/sesmesaji': T(['sohbet-diyalog', 'ses-muzik'], ['sosyal-medya', 'uygulama-urun'], ['minimal', 'sakin'], ['ses', 'metin'], { gereksinim: ['metin-gerek'] }),
  'balon/ipucu': T(['ipucu-yonlendirme'], ['uygulama-urun', 'egitim', 'yazilim'], ['minimal', 'teknik'], ['metin'], { gereksinim: ['metin-gerek'] }),
  'balon/notkagidi': T(['not-hatirlatma'], ['egitim', 'genel'], ['sakin', 'nostaljik', 'eglenceli'], ['metin'], { gereksinim: ['metin-gerek'] }),
  'balon/etiket': T(['ipucu-yonlendirme', 'vurgu-dikkat'], ['uygulama-urun', 'egitim', 'teknoloji'], ['ciddi-kurumsal', 'minimal'], ['metin', 'simge'], { gereksinim: ['metin-gerek'] }),
  'balon/tepki': T(['yorum-etkilesim', 'sosyal-kanit'], ['sosyal-medya'], ['eglenceli', 'enerjik'], ['emoji', 'sayi'], { gereksinim: ['liste-gerek'] }),
  'balon/soru': T(['ic-ses-duygu', 'vurgu-dikkat'], ['genel', 'egitim'], ['eglenceli', 'dikkat-cekici'], ['simge'], { gereksinim: ['metin-gerek'] }),
  'balon/yorum': T(['yorum-etkilesim', 'sosyal-kanit'], ['sosyal-medya', 'e-ticaret'], ['minimal', 'sakin'], ['kisi', 'metin'], { gereksinim: ['metin-gerek'] }),
  'zaman/dijital': T(['zaman-sayim', 'vurgu-dikkat'], ['etkinlik-organizasyon', 'e-ticaret', 'genel'], ['enerjik', 'dikkat-cekici'], ['zaman', 'sayi'], { gereksinim: ['kendi-basina'] }),
  'zaman/halka': T(['zaman-sayim', 'ilerleme-takip'], ['saglik-spor', 'genel', 'egitim'], ['minimal', 'sakin'], ['zaman'], { gereksinim: ['kendi-basina'] }),
  'zaman/saat': T(['zaman-sayim'], ['genel', 'etkinlik-organizasyon'], ['nostaljik', 'sakin'], ['zaman'], { gereksinim: ['kendi-basina'] }),
};
const WAVE_KIND = { cubuk: 'waveform/-', cizgi: 'waveform/-', daire: 'waveform/-', nokta: 'waveform/-' };

const uniq = (a) => [...new Set(a)];
const isDark = (c) => {
  const m = /^#([0-9a-f]{6})$/i.exec(String(c || ''));
  if (!m) return false;
  const n = parseInt(m[1], 16);
  return ((n >> 16) * 299 + ((n >> 8) & 255) * 587 + (n & 255) * 114) / 1000 < 90;
};

// Bileşenin yaklaşık kapladığı alan (motorun varsayılanlarıyla)
const DEVICE_H = { telefon: 2.05, tablet: 0.72, laptop: 0.64, tarayici: 0.66 };
export const componentSize = (doc) => sizeOf(doc, doc.props || doc);
function sizeOf(doc, p) {
  if (WIDGET2_TYPES.includes(doc.type)) return widget2Size({ ...p, type: doc.type });
  if (doc.type === 'chart') return [p.width || 820, p.height || 560];
  if (doc.type === 'device') {
    const w = p.width || 460;
    return [w, w * (DEVICE_H[p.frame || 'telefon'] || 2.05)];
  }
  if (doc.type === 'waveform') return [p.width || 800, p.height || 240];
  const w = p.width || 800;
  return [w, p.height || w * 0.7]; // media
}

/** Bileşenin türüne ve ayarlarına bakarak etiket önerir. Kullanıcı etiketlerini ezmez; yalnızca öneri döndürür. */
export function autoTags(doc) {
  const p = doc.props || {};
  const sub = doc.type === 'device' ? p.frame || 'telefon' : doc.type === 'media' || doc.type === 'waveform' ? '-' : p.kind || { chart: 'bar', kart: 'alinti', liste: 'kontrol', kod: 'terminal', zaman: 'dijital', balon: 'dusunce' }[doc.type];
  const base = KIND_TAGS[`${doc.type}/${sub}`] || KIND_TAGS[`${WAVE_KIND[p.style] ? 'waveform/-' : `${doc.type}/-`}`] || T(['vurgu-dikkat'], ['genel'], ['minimal'], ['metin'], { gereksinim: ['kendi-basina'] });
  const tags = {
    amac: [...base.amac],
    konu: [...base.konu],
    ton: [...base.ton],
    icerik: [...base.icerik],
    gereksinim: [...(base.gereksinim || [])],
    stil: [],
    yerlesim: [],
    boyut: [],
    anahtar: [],
  };
  // görünüm
  const bg = p.bg || p.card?.color || p.color;
  const dark = isDark(bg) || p.tema === 'koyu' || doc.type === 'kod' && p.tema !== 'acik' || (doc.type === 'kart' && sub === 'altuc');
  tags.stil.push(dark ? 'koyu' : 'acik');
  if (p.card === false) tags.stil.push('kartsiz');
  else if (['chart', 'kart', 'liste', 'zaman'].includes(doc.type) && !['rozet', 'altuc', 'balon'].includes(sub)) tags.stil.push('kartli');
  if ((p.radius ?? 0) >= 200 || ['halka', 'saat', 'rozet', 'donut', 'pie'].includes(sub) || p.style === 'daire') tags.stil.push('yuvarlak');
  if (p.radius === 0) tags.stil.push('keskin');
  if (p.accent && /^#/.test(p.accent)) tags.stil.push('renkli');
  if (p.shadow === false) tags.stil = tags.stil.filter((x) => x !== 'golgeli');
  // yerleşim + boyut
  const [w, h] = sizeOf(doc, p);
  if (sub === 'altuc') tags.yerlesim.push('alt-bant', 'tam-genislik');
  else if (sub === 'bildirim') tags.yerlesim.push('ust-bildirim');
  else if (sub === 'rozet') tags.yerlesim.push('kose-etiket');
  else tags.yerlesim.push('orta-odak');
  if (w > h * 1.5) tags.yerlesim.push('yatay-uyumlu');
  else if (h > w * 1.25) tags.yerlesim.push('dikey-uyumlu');
  else tags.yerlesim.push('kare-uyumlu');
  const side = Math.max(w, h);
  tags.boyut.push(side <= 560 ? 'kucuk' : side <= 860 ? 'orta' : 'buyuk');
  // özel durumlar
  const hay = norm(`${doc.id || ''} ${doc.name || ''}`);
  if (/polaroid|klasik|saat/.test(hay)) tags.ton.push('nostaljik');
  if (/koyu|sinema/.test(hay)) tags.ton.push('sinematik');
  if (/uyari|dusus|indirim|haber/.test(hay)) tags.ton.push('dikkat-cekici');
  if (/mesaj|sohbet/.test(hay)) tags.amac.push('sohbet-diyalog');
  if (doc.type === 'balon' && ['dusunce', 'bagirma', 'anlatici', 'notkagidi'].includes(sub)) tags.stil.push('keskin');
  if (doc.type === 'device' && p.src) tags.gereksinim = ['kendi-basina'];
  tags.anahtar = uniq(tokens(`${doc.name || ''} ${doc.id || ''}`).filter((t) => t.length > 2)).slice(0, 8);
  for (const k of Object.keys(tags)) tags[k] = uniq(tags[k]);
  return tags;
}

/** Var olan etiketlerin üstüne eksik facet'leri otomatik doldurur (kullanıcı değerlerine dokunmaz). */
export function withAutoTags(doc) {
  const auto = autoTags(doc);
  const cur = doc.etiketler || {};
  const out = {};
  for (const k of [...FACET_ORDER, 'anahtar']) out[k] = cur[k]?.length ? cur[k] : auto[k] || [];
  return out;
}

// ------------------------------------------------------------------ arama
const facetText = (taxonomy, facet, value) => {
  const v = taxonomy?.[facet]?.degerler?.[value];
  return v ? `${value} ${v.ad} ${v.es || ''}` : value;
};

/** Bir bileşenin aranabilir metni (ad, açıklama, tür, etiketler + eş anlamlılar). Ağırlıklı parçalar döner. */
export function searchParts(doc, taxonomy = DEFAULT_TAXONOMY) {
  const et = doc.etiketler || {};
  const tagStr = [];
  for (const f of FACET_ORDER) for (const v of et[f] || []) tagStr.push(facetText(taxonomy, f, v));
  return {
    ad: norm(`${doc.name || ''} ${doc.id || ''}`),
    tur: norm(`${doc.type} ${doc.props?.kind || ''} ${doc.props?.frame || ''} ${doc.props?.style || ''}`),
    etiket: norm(tagStr.join(' ')),
    anahtar: norm((et.anahtar || []).join(' ')),
    aciklama: norm(doc.description || ''),
  };
}

/**
 * Süzgeç + sorgu eşleşmesi. filters: { facet: [değer, …] } — facet içinde OR, facetler arasında AND.
 * Sorgu boşsa skor 1 döner. Sorgu varsa en az bir sözcük eşleşmeli; skor yüksek = daha iyi.
 */
export function matchComponent(doc, query, filters = {}, taxonomy = DEFAULT_TAXONOMY) {
  const et = doc.etiketler || {};
  for (const [f, vals] of Object.entries(filters)) {
    if (!vals?.length) continue;
    if (f === 'tur') {
      if (!vals.includes(doc.type)) return 0;
    } else if (f === 'kind') {
      if (!vals.includes(doc.props?.kind || doc.props?.frame || doc.props?.style)) return 0;
    } else if (!vals.some((v) => (et[f] || []).includes(v))) return 0;
  }
  const qt = tokens(query);
  if (!qt.length) return 1;
  const parts = searchParts(doc, taxonomy);
  let score = 0;
  let hit = 0;
  for (const t of qt) {
    let s = 0;
    if (parts.ad.includes(t)) s += 5;
    if (parts.tur.includes(t)) s += 4;
    if (parts.anahtar.includes(t)) s += 3;
    if (parts.etiket.includes(t)) s += 2.5;
    if (parts.aciklama.includes(t)) s += 1.5;
    if (s) hit++;
    score += s;
  }
  return hit ? score * (0.6 + (0.4 * hit) / qt.length) : 0;
}

/** Sözlükte kullanılan değerlerin kaç bileşende geçtiği: { facet: { değer: n } } */
export function tagCounts(docs) {
  const out = {};
  for (const d of docs) for (const f of FACET_ORDER) for (const v of d.etiketler?.[f] || []) ((out[f] ||= {})[v] = (out[f][v] || 0) + 1);
  return out;
}
