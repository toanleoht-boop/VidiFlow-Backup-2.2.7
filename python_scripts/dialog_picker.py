import ctypes
import json
import os
import sys
import tkinter as tk
from tkinter import filedialog


def emit(payload):
    print(json.dumps(payload, ensure_ascii=False), flush=True)


def pick(mode, title="Chọn", icon_path=""):
    if os.name == "nt":
        try:
            ctypes.windll.shcore.SetProcessDpiAwareness(1)
        except Exception:
            try:
                ctypes.windll.user32.SetProcessDPIAware()
            except Exception:
                pass

    root = tk.Tk()
    root.title("VidiFlow OneClick Content Studio")
    root.withdraw()
    root.attributes("-topmost", True)

    icon = None
    if icon_path and os.path.isfile(icon_path):
        try:
            icon = tk.PhotoImage(file=icon_path)
            root.iconphoto(True, icon)
        except Exception:
            icon = None

    root.update_idletasks()
    options = {"parent": root, "title": title}
    if mode == "file":
        selected = filedialog.askopenfilename(**options)
    else:
        selected = filedialog.askdirectory(mustexist=True, **options)

    root.destroy()
    emit({"success": bool(selected), "path": os.path.normpath(selected) if selected else ""})


if __name__ == "__main__":
    if "--probe" in sys.argv:
        emit({"success": True, "python": sys.executable, "tk": tk.TkVersion})
        raise SystemExit(0)
    picker_mode = sys.argv[1] if len(sys.argv) > 1 else "file"
    picker_title = sys.argv[2] if len(sys.argv) > 2 else "Chọn"
    picker_icon = sys.argv[3] if len(sys.argv) > 3 else ""
    pick(picker_mode, picker_title, picker_icon)
