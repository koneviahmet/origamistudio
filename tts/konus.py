"""Metinden ses üretir (VoxCPM2, yerel GPU).

Tek seferlik:
  tts\.venv\Scripts\python.exe tts\konus.py "Merhaba dünya" cikti.wav
  tts\.venv\Scripts\python.exe tts\konus.py --dosya metin.txt cikti.wav

Toplu (modeli bir kez yükler; scripts/seslendir.mjs bunu kullanır):
  tts\.venv\Scripts\python.exe tts\konus.py --is isler.json
  isler.json = [{"text": "...", "out": "yol.wav"}, ...]; bitince her kayda "dur" (sn) yazılır.
"""
import json
import sys

import soundfile as sf
from voxcpm import VoxCPM

args = sys.argv[1:]
if args and args[0] == "--is":
    yol = args[1]
    isler = json.load(open(yol, encoding="utf-8"))
elif args and args[0] == "--dosya":
    isler = [{"text": open(args[1], encoding="utf-8").read().strip(), "out": args[2] if len(args) > 2 else "cikti.wav"}]
    yol = None
else:
    isler = [{"text": args[0], "out": args[1] if len(args) > 1 else "cikti.wav"}]
    yol = None

model = VoxCPM.from_pretrained("openbmb/VoxCPM2")
sr = model.tts_model.sample_rate
for i, is_ in enumerate(isler, 1):
    wav = model.generate(text=is_["text"])
    sf.write(is_["out"], wav, sr)
    is_["dur"] = round(len(wav) / sr, 3)
    print(f"[{i}/{len(isler)}] yazıldı: {is_['out']} ({is_['dur']} sn)", file=sys.stderr)
    if yol:  # ilerleme kaybolmasın
        json.dump(isler, open(yol, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
