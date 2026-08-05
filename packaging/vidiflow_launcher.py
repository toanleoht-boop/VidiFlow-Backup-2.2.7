"""Nuitka entry point for the portable VidiFlow desktop package."""
from __future__ import annotations

import json
import os
import socket
import subprocess
import sys
import time
import urllib.request
import webbrowser
from pathlib import Path

APP_NAME = "VidiFlow OneClick Content Studio"
PORTS = range(3102, 3123)


def show_error(message: str) -> None:
    try:
        import ctypes
        ctypes.windll.user32.MessageBoxW(0, message, APP_NAME, 0x10)
    except Exception:
        pass


def available_port() -> int:
    for port in PORTS:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as probe:
            if probe.connect_ex(("127.0.0.1", port)) != 0:
                return port
    raise RuntimeError("No free local port was found for VidiFlow.")


def existing_vidiflow_url() -> str | None:
    """Reuse a live VidiFlow server instead of starting one per click."""
    for port in PORTS:
        try:
            with urllib.request.urlopen(
                f"http://127.0.0.1:{port}/api/launcher/status", timeout=0.45
            ) as response:
                payload = json.loads(response.read().decode("utf-8"))
                if response.status == 200 and payload.get("app") == "vidiflow-oneclick":
                    return f"http://127.0.0.1:{port}/"
        except Exception:
            continue
    return None


def main() -> int:
    root = Path(sys.argv[0]).resolve().parent
    app_root = root / "app"
    node = app_root / "runtime" / "node" / "node.exe"
    server = app_root / "dist" / "server.cjs"
    if not node.exists() or not server.exists():
        show_error("The VidiFlow package is incomplete. Extract the entire folder before running it.")
        return 2

    running = existing_vidiflow_url()
    if running:
        webbrowser.open(running, new=1)
        return 0

    data_root = Path(os.environ.get("LOCALAPPDATA", str(root))) / "VidiFlowOneClick"
    data_root.mkdir(parents=True, exist_ok=True)
    version = "1.0.0"
    try:
        version = str(json.loads((app_root / "version.json").read_text(encoding="utf-8")).get("version") or version)
    except Exception:
        pass

    port = available_port()
    log_path = data_root / "launcher.log"
    env = os.environ.copy()
    env.update(
        {
            "PORT": str(port),
            "NODE_ENV": "production",
            "DISABLE_HMR": "true",
            "PLAYWRIGHT_BROWSERS_PATH": str(app_root / "runtime" / "playwright-browsers"),
            "VIDIFLOW_DATA_DIR": str(data_root),
            "VIDIFLOW_APP_VERSION": version,
            "VIDIFLOW_LAUNCHER_MODE": "1",
            "VIDIFLOW_LAUNCHER_IDLE_TIMEOUT_MS": "900000",
        }
    )
    with log_path.open("a", encoding="utf-8") as log:
        flags = getattr(subprocess, "CREATE_NEW_PROCESS_GROUP", 0) | getattr(subprocess, "CREATE_NO_WINDOW", 0)
        process = subprocess.Popen(
            [str(node), str(server)], cwd=str(app_root), env=env,
            stdout=log, stderr=subprocess.STDOUT, creationflags=flags,
        )
        url = f"http://127.0.0.1:{port}/"
        for _ in range(240):
            if process.poll() is not None:
                break
            try:
                with urllib.request.urlopen(url, timeout=1.5) as response:
                    if 200 <= response.status < 500:
                        webbrowser.open(url, new=1)
                        return 0
            except Exception:
                time.sleep(0.5)

    show_error(f"VidiFlow could not start. Read the log at:\n{log_path}")
    return 3


if __name__ == "__main__":
    raise SystemExit(main())
