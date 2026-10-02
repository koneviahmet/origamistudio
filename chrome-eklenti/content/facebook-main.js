// Meta Business Suite — SAYFANIN KENDİ DÜNYASINDA (world: MAIN) çalışır, document_start'ta.
// Neden: "Add video" tıklanınca Facebook <input type="file"> öğesini DOM'a koymadan oluşturup .click() çağırıyor; eklentinin
// izole dünyası bu öğeyi göremez ve tarayıcı kullanıcı etkileşimi olmadan dosya penceresini açmaz.
// Burada .click() / showPicker() çağrısı yakalanır, hazırlanan File doğrudan o alana verilir ve change olayı gönderilir.
// Yalnızca content/facebook.js "silahlandırınca" ({os:'fb-dosya', file}) devreye girer; aksi hâlde sayfa normal çalışır.
(() => {
  if (window.__osFbMain) return;
  window.__osFbMain = true;
  let bekleyen = null;

  window.addEventListener('message', (e) => {
    if (e.source !== window || e.data?.os !== 'fb-dosya') return;
    bekleyen = e.data.file || null; // file yoksa silahı bırak
  });

  const dosyaAlani = (el) => el instanceof HTMLInputElement && el.type === 'file';

  function ver(input) {
    const dt = new DataTransfer();
    dt.items.add(bekleyen);
    input.files = dt.files;
    bekleyen = null;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
    window.postMessage({ os: 'fb-dosya-verildi' }, window.location.origin);
  }

  // click, HTMLInputElement'te değil HTMLElement.prototype'ta tanımlı
  const click = HTMLElement.prototype.click;
  HTMLElement.prototype.click = function () {
    if (bekleyen && dosyaAlani(this)) return void ver(this);
    return click.apply(this, arguments);
  };
  if (HTMLInputElement.prototype.showPicker) {
    const showPicker = HTMLInputElement.prototype.showPicker;
    HTMLInputElement.prototype.showPicker = function () {
      if (bekleyen && dosyaAlani(this)) return void ver(this);
      return showPicker.apply(this, arguments);
    };
  }
})();
