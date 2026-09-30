"""Yerel TTS motoru: VoxCPM2'yi bir kez yükler, HTTP ile istek alır (yalnızca 127.0.0.1).

  tts\.venv\Scripts\python.exe tts\sunucu.py [--port 5181]
  GET  /saglik  → {"ok": true}           (model yüklendikten sonra yanıt verir)
  POST /uret    → {"text", "out", "ref"?} ses dosyasını `out`a yazar, {"dur": sn} döner
                  ref = referans ses dosyası yolu (ses klonlama; seçilen sesin kaydı)
server/tts.js bu süreci başlatır ve durdurur.
"""
import argparse
import json
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

import soundfile as sf
from voxcpm import VoxCPM

ap = argparse.ArgumentParser()
ap.add_argument("--port", type=int, default=5181)
port = ap.parse_args().port

model = VoxCPM.from_pretrained("openbmb/VoxCPM2")
sr = model.tts_model.sample_rate
kilit = threading.Lock()  # GPU'da tek seferde tek üretim


class Isleyici(BaseHTTPRequestHandler):
    def _yanit(self, kod, obj):
        veri = json.dumps(obj, ensure_ascii=False).encode("utf-8")
        self.send_response(kod)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(veri)))
        self.end_headers()
        self.wfile.write(veri)

    def do_GET(self):
        if self.path == "/saglik":
            self._yanit(200, {"ok": True})
        else:
            self._yanit(404, {"error": "yok"})

    def do_POST(self):
        if self.path != "/uret":
            return self._yanit(404, {"error": "yok"})
        try:
            istek = json.loads(self.rfile.read(int(self.headers.get("Content-Length", 0))).decode("utf-8"))
            kw = {"text": istek["text"]}
            if istek.get("ref"):
                kw["reference_wav_path"] = istek["ref"]
            with kilit:
                wav = model.generate(**kw)
            sf.write(istek["out"], wav, sr)
            self._yanit(200, {"dur": round(len(wav) / sr, 3)})
        except Exception as e:  # noqa: BLE001 — hata metni arayüze gider
            self._yanit(500, {"error": f"{type(e).__name__}: {e}"})

    def log_message(self, *_):
        pass


print("TTS hazır", flush=True)
ThreadingHTTPServer(("127.0.0.1", port), Isleyici).serve_forever()
