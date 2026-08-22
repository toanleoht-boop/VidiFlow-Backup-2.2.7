"""Persistent JSON-lines worker for VidiFlow's local VieNeu-TTS provider."""
from __future__ import annotations

import json
import logging
import os
import sys
import traceback
from pathlib import Path

logging.basicConfig(stream=sys.stderr, level=logging.INFO)
_tts = None


def load_tts():
    global _tts
    if _tts is None:
        from vieneu import Vieneu
        _tts = Vieneu(
            mode="v3turbo",
            backend=os.environ.get("VIENEU_BACKEND", "onnx"),
            precision=os.environ.get("VIENEU_PRECISION", "int8"),
            threads=int(os.environ.get("VIENEU_THREADS", "0")),
        )
    return _tts


def handle(message: dict):
    command = message.get("command")
    if command == "probe":
        try:
            import vieneu  # noqa: F401
            return {"installed": True, "loaded": _tts is not None}
        except Exception as exc:
            return {"installed": False, "loaded": False, "error": str(exc)}
    if command == "voices":
        voices = []
        for item in load_tts().list_preset_voices():
            label, voice_id = item if isinstance(item, (tuple, list)) and len(item) == 2 else (item, item)
            voices.append({"id": str(voice_id), "name": str(label)})
        return {"installed": True, "loaded": True, "voices": voices}
    if command == "synthesize":
        text = str(message.get("text") or "").strip()
        if not text:
            raise ValueError("Nội dung tạo giọng không được để trống.")
        output = Path(str(message["outputPath"])).resolve()
        output.parent.mkdir(parents=True, exist_ok=True)
        tts = load_tts()
        kwargs = {
            "text": text,
            "voice": message.get("voice") or None,
            "style": message.get("style") or "tu_nhien",
            "apply_watermark": bool(message.get("applyWatermark", True)),
        }
        reference = message.get("referenceAudioPath")
        if reference:
            kwargs.pop("voice", None)
            kwargs["ref_audio"] = str(Path(str(reference)).resolve())
        audio = tts.infer(**kwargs)
        tts.save(audio, str(output))
        return {"installed": True, "loaded": True, "outputPath": str(output), "sampleRate": int(getattr(tts, "sample_rate", 48000)), "voice": message.get("voice") or "cloned"}
    raise ValueError(f"Lệnh VieNeu không hợp lệ: {command}")


for line in sys.stdin:
    request_id = None
    try:
        message = json.loads(line)
        request_id = message.get("id")
        response = {"id": request_id, "success": True, **handle(message)}
    except Exception as exc:
        traceback.print_exc(file=sys.stderr)
        response = {"id": request_id, "success": False, "error": str(exc)}
    sys.stdout.write(json.dumps(response, ensure_ascii=False) + "\n")
    sys.stdout.flush()
