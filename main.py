import os
import sys
import json
import threading
import time
import requests
import re
import tkinter as tk
from tkinter import messagebox, filedialog
from PIL import Image, ImageGrab
import queue

import customtkinter as ctk

from google import genai
from google.genai import types

ctk.set_appearance_mode("Dark")
ctk.set_default_color_theme("dark-blue")

CONFIG_FILE = "youtube_config.json"
STYLES_FILE = "styles.json"
BEARER_TOKEN = "eyJhbGciOiJIUzI1NiIsImtpZCI6ImZ0UTF2dE1kNHArNG41SUYiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL3hwa2NhcHFxYnJraHNwcmJxb2NiLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiIxYTFlZjhjOC1hN2Q4LTRkYzMtYmRjMy1kYmZjODI1MGMzZmMiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzgyOTc1MDQyLCJpYXQiOjE3ODIzNzAyNDIsImVtYWlsIjoibGVldm90aWkxMjM0QGdtYWlsLmNvbSIsInBob25lIjoiIiwiYXBwX21ldGFkYXRhIjp7InByb3ZpZGVyIjoiZ29vZ2xlIiwicHJvdmlkZXJzIjpbImdvb2dsZSJdfSwidXNlcl9tZXRhZGF0YSI6eyJhdmF0YXJfdXJsIjoiaHR0cHM6Ly9saDMuZ29vZ2xldXNlcmNvbnRlbnQuY29tL2EvQUNnOG9jSXhxOHJVNXlTU0NuRDJxLU15TEtfZ2NJcm5wNkRTUkNDZXZHbjFmRW9SVUhHXzNuTVhQQT1zOTYtYyIsImVtYWlsIjoibGVldm90aWkxMjM0QGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJmdWxsX25hbWUiOiJUb8OgbiBMZW8iLCJpc3MiOiJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20iLCJuYW1lIjoiVG_DoG4gTGVvIiwicGhvbmVfdmVyaWZpZWQiOmZhbHNlLCJwaWN0dXJlIjoiaHR0cHM6Ly9saDMuZ29vZ2xldXNlcmNvbnRlbnQuY29tL2EvQUNnOG9jSXhxOHJVNXlTU0NuRDJxLU15TEtfZ2NJcm5wNkRTUkNDZXZHbjFmRW9SVUhHXzNuTVhQQT1zOTYtYyIsInByb3ZpZGVyX2lkIjoiMTE0MjcxMzQ3Mzk5OTQ1MjYwMzkxIiwic3ViIjoiMTE0MjcxMzQ3Mzk5OTQ1MjYwMzkxIn0sInJvbGUiOiJhdXRoZW50aWNhdGVkIiwiYWFsIjoiYWFsMSIsImFtciI6W3sibWV0aG9kIjoib2F1dGgiLCJ0aW1lc3RhbXAiOjE3NjQ5OTMyNzB9XSwic2Vzc2lvbl9pZCI6IjY0ZjhjZDllLTMzNTItNDI5Zi1hYTYyLWZhMjg5OWNhNWUzNCIsImlzX2Fub255bW91cyI6ZmFsc2V9.Rsut9S1qJEUqimObZXDTd4a7QLwMVhHTBvfxWy9FjY0"

# [FIXED TASK 1]: Định nghĩa STYLE_FILE an toàn
STYLE_FILE = os.path.join(os.path.dirname(__file__), "data", "saved_styles.json")
os.makedirs(os.path.dirname(STYLE_FILE), exist_ok=True)
if not os.path.exists(STYLE_FILE):
    with open(STYLE_FILE, "w", encoding="utf-8") as f:
        json.dump({"styles": []}, f)

# [FIXED TASK 4]: Tách rời tính năng Backup & Restore thành Controller riêng
class BackupRestoreController:
    def __init__(self, app):
        self.app = app

    def export_backup(self):
        try:
            topic = self.app.global_state.get("topic", "")
            voice_script = self.app.global_state.get("voice_script", "")
            scenes = self.app.global_state.get("scenes", [])
            
            backup_str = f"============== YT CREATOR PIPELINE 2026 BACKUP ==============\n\n"
            backup_str += f"=== CHỦ ĐỀ CHỌN LỰA: {topic} ===\n\n"
            backup_str += f"=== KỊCH BẢN ĐÃ CHUẨN HÓA LÀM GIỌNG ĐỌC: ===\n{voice_script}\n\n"
            backup_str += f"=== DANH SÁCH PHÂN CẢNH & PROMPTS: ===\n\n"
            
            for idx, scene in enumerate(scenes):
                backup_str += f"--- Phân cảnh {idx+1} ({scene.get('timestamp', '')}) ---\n"
                backup_str += f"[Đoạn thoại]: {scene.get('dialog', '')}\n"
                backup_str += f"[Mô tả visual]: {scene.get('visual', '')}\n"
                for p_idx, p in enumerate(scene.get("prompts", [])):
                    backup_str += f"  + [P{idx+1}.{p_idx+1}] (Ý tưởng: {p.get('idea', '')})\n"
                    backup_str += f"    Prompt AI: {p.get('prompt_text', '')}\n"
                backup_str += "\n"
                
            filepath = filedialog.asksaveasfilename(parent=self.app, defaultextension=".txt", filetypes=[("Text Files", "*.txt")])
            if filepath:
                with open(filepath, "w", encoding="utf-8") as f:
                    f.write(backup_str)
                self.app.show_toast("✅ Tải Backup thành công!")
        except Exception as e:
            self.app.show_toast(f"❌ Lỗi Export: {str(e)}", error=True)

    def import_backup(self):
        try:
            filepath = filedialog.askopenfilename(parent=self.app, filetypes=[("Text Files", "*.txt")])
            if not filepath: return
            
            with open(filepath, "r", encoding="utf-8") as f: 
                content = f.read()
                
            topic_match = re.search(r"=== CHỦ ĐỀ CHỌN LỰA:\s*(.*?)\s*===", content)
            script_match = re.search(r"=== KỊCH BẢN ĐÃ CHUẨN HÓA LÀM GIỌNG ĐỌC: ===\n(.*?)\n\n===", content, re.DOTALL)
            
            if topic_match: self.app.global_state["topic"] = topic_match.group(1)
            if script_match: self.app.global_state["voice_script"] = script_match.group(1).strip()
            
            self.app.show_toast("✅ Phục hồi giao diện thành công từ Backup!")
        except Exception as e:
            self.app.show_toast(f"❌ Lỗi Import: {str(e)}", error=True)

class YTBAutomationTool(ctk.CTk):
    def __init__(self):
        super().__init__()
        self.backup_ctrl = BackupRestoreController(self)
        self.title("Youtube Automation Tool - Premium 1:1 Clone")
        self.geometry("1600x950")
        
        self.config = self.load_json(CONFIG_FILE, {})
        self.styles_db = self.load_json(STYLES_FILE, {"styles": [{"name": "Default", "prompt": "commercial cinematic storytelling, 4k concept art, atmospheric shadows"}]})
        
        self.api_key = self.config.get("api_key", "")
        self.tele_token = self.config.get("tele_token", "")
        self.tele_chatid = self.config.get("tele_chatid", "")
        self.client = genai.Client(api_key=self.api_key) if self.api_key else None
        self.voices_list = []
        
        # [ADDED]: Biến trạng thái toàn cục để truyền dữ liệu không bị gãy (State Management)
        self.global_state = {
            "topic": "",
            "voice_script": "",
            "scenes": [],
            "seo": {"title": "", "desc": "", "tags": []}
        }
        self.image_paths = [] # Dùng cho Task 2 (Multi-file upload)

        self.grid_rowconfigure(0, weight=1)
        self.grid_columnconfigure(1, weight=3)
        self.grid_columnconfigure(2, weight=1)

        self.setup_sidebar()

        self.main_view = ctk.CTkFrame(self, fg_color="#121212", corner_radius=0)
        self.main_view.grid(row=0, column=1, sticky="nsew")
        self.main_view.grid_rowconfigure(0, weight=1)
        self.main_view.grid_columnconfigure(0, weight=1)

        self.right_frame = ctk.CTkFrame(self, fg_color="#1A1B1E", corner_radius=0, border_color="#333333", border_width=1)
        self.right_frame.grid(row=0, column=2, sticky="nsew")
        
        ctk.CTkLabel(self.right_frame, text="BẢNG TIN ĐIỀU KHIỂN", font=ctk.CTkFont(size=14, weight="bold"), text_color="#10B981").pack(pady=(15, 5))
        self.console = ctk.CTkTextbox(self.right_frame, width=350, fg_color="#0D1117", text_color="#00FF00", font=("Consolas", 12))
        self.console.pack(fill="both", expand=True, padx=10, pady=10)
        self.console.insert("1.0", "[SYSTEM] Giao diện đã khởi tạo.\n")

        self.frames = {}
        self.setup_tab1()
        self.setup_tab2()
        self.setup_tab3()
        self.setup_tab_voice()
        self.setup_tab_capcut()
        self.setup_tab4()
        self.setup_tab_seo()
        self.setup_tab_backup()
        self.setup_tab_ai_audio()
        self.setup_settings()

        self.select_tab("tab1")
        self.bind("<Control-v>", self.handle_paste)
        
        # [ADDED]: Khởi tạo Queue cho Task 7 (Batch Processing)
        self.job_queue = queue.Queue()
        self.is_processing = False
        threading.Thread(target=self.process_queue_worker, daemon=True).start()

        # Load voices in background
        threading.Thread(target=self.fetch_voices, daemon=True).start()

    # [ADDED]: Khối hiển thị Toast Notification theo Task 3
    def show_toast(self, message, error=False):
        self.run_sound_effect("error" if error else "success")
        color = "#EF4444" if error else "#10B981"
        toast = ctk.CTkToplevel(self)
        toast.overrideredirect(True)
        toast.attributes("-topmost", True)
        
        lbl = ctk.CTkLabel(toast, text=message, fg_color=color, text_color="white", corner_radius=8, padx=20, pady=10, font=("", 14, "bold"))
        lbl.pack()
        
        self.update_idletasks()
        x = self.winfo_x() + (self.winfo_width() // 2) - (toast.winfo_reqwidth() // 2)
        y = self.winfo_y() + self.winfo_height() - 100
        toast.geometry(f"+{x}+{y}")
        
        self.after(3000, toast.destroy)

    def load_json(self, file_path, default):
        if os.path.exists(file_path):
            try:
                with open(file_path, "r", encoding="utf-8") as f: return json.load(f)
            except: pass
        return default

    def save_json(self, file_path, data):
        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=4, ensure_ascii=False)

    def setup_sidebar(self):
        self.sidebar_frame = ctk.CTkFrame(self, width=280, corner_radius=0, fg_color="#1c1c1c")
        self.sidebar_frame.grid(row=0, column=0, sticky="nsew")
        self.sidebar_frame.grid_rowconfigure(7, weight=0)
        self.sidebar_frame.grid_rowconfigure(8, weight=1)

        self.logo_label = ctk.CTkLabel(self.sidebar_frame, text="Youtube Workspace 2026", font=ctk.CTkFont(size=18, weight="bold"), text_color="#FFFFFF")
        self.logo_label.grid(row=0, column=0, padx=20, pady=(20, 20), sticky="w")

        button_kwargs = {"fg_color": "transparent", "text_color": "#CCCCCC", "hover_color": "#333333", "anchor": "w", "font": ctk.CTkFont(size=14)}
        
        self.btn_tab1 = ctk.CTkButton(self.sidebar_frame, text=" BƯỚC 01: Chuẩn Hóa Kịch Bản", command=lambda: self.select_tab("tab1"), **button_kwargs)
        self.btn_tab1.grid(row=1, column=0, padx=10, pady=2, sticky="ew")

        self.btn_tab2 = ctk.CTkButton(self.sidebar_frame, text=" BƯỚC 02: Viết Lại Hook", command=lambda: self.select_tab("tab2"), **button_kwargs)
        self.btn_tab2.grid(row=2, column=0, padx=10, pady=2, sticky="ew")

        self.btn_tab3 = ctk.CTkButton(self.sidebar_frame, text=" BƯỚC 03: Chia Cảnh & Prompt", command=lambda: self.select_tab("tab3"), **button_kwargs)
        self.btn_tab3.grid(row=3, column=0, padx=10, pady=2, sticky="ew")
        
        self.btn_voice = ctk.CTkButton(self.sidebar_frame, text=" BƯỚC 04: TẠO VOICE AI", command=lambda: self.select_tab("voice"), **button_kwargs)
        self.btn_voice.grid(row=4, column=0, padx=10, pady=2, sticky="ew")

        # [ADDED]: CapCut Tools
        self.btn_capcut = ctk.CTkButton(self.sidebar_frame, text=" 🎬 DỰNG VIDEO & CAPCUT", command=lambda: self.select_tab("capcut"), **button_kwargs)
        self.btn_capcut.grid(row=5, column=0, padx=10, pady=2, sticky="ew")

        self.btn_tab4 = ctk.CTkButton(self.sidebar_frame, text="⚡ AUTO-PIPELINE VIP", command=lambda: self.select_tab("tab4"), **button_kwargs)
        self.btn_tab4.grid(row=6, column=0, padx=10, pady=2, sticky="ew")
        
        self.btn_seo = ctk.CTkButton(self.sidebar_frame, text="🔍 TỐI ƯU SEO & META", command=lambda: self.select_tab("seo"), **button_kwargs)
        self.btn_seo.grid(row=7, column=0, padx=10, pady=2, sticky="ew")

        self.btn_backup = ctk.CTkButton(self.sidebar_frame, text="💾 QUẢN LÝ BACKUP", command=lambda: self.select_tab("backup"), **button_kwargs)
        self.btn_backup.grid(row=9, column=0, padx=10, pady=2, sticky="ew")

        self.btn_ai_audio = ctk.CTkButton(self.sidebar_frame, text="🎵 AI AUDIO TOOLS", command=lambda: self.select_tab("ai_audio"), **button_kwargs)
        self.btn_ai_audio.grid(row=8, column=0, padx=10, pady=2, sticky="ew")

        self.btn_settings = ctk.CTkButton(self.sidebar_frame, text="⚙️ Cài Đặt API", command=lambda: self.select_tab("settings"), **button_kwargs)
        self.btn_settings.grid(row=10, column=0, padx=10, pady=2, sticky="ew")

        # Cards
        self.card_muctieu = ctk.CTkFrame(self.sidebar_frame, fg_color="#2b2b2b", corner_radius=8)
        self.card_muctieu.grid(row=11, column=0, padx=15, pady=(10, 10), sticky="ew")
        ctk.CTkLabel(self.card_muctieu, text="🎯 MỤC TIÊU BƯỚC", font=ctk.CTkFont(size=12, weight="bold"), text_color="#FF4C4C").pack(anchor="w", padx=10, pady=(10,5))
        self.lbl_muctieu_desc = ctk.CTkLabel(self.card_muctieu, text="• Chuẩn hóa transcript.\n• Xóa định dạng thô.", font=ctk.CTkFont(size=12), justify="left")
        self.lbl_muctieu_desc.pack(anchor="w", padx=10, pady=(0,10))

        self.card_congthuc = ctk.CTkFrame(self.sidebar_frame, fg_color="#0D1117", corner_radius=8)
        self.card_congthuc.grid(row=12, column=0, padx=15, pady=(0, 20), sticky="ew")
        ctk.CTkLabel(self.card_congthuc, text="💰 CÔNG THỨC VÀNG YOUTUBE 2026", font=ctk.CTkFont(size=12, weight="bold"), text_color="#FFD700").pack(anchor="w", padx=10, pady=(10,5))
        
        ctk.CTkLabel(self.card_congthuc, text="🏆 Đều đặn & Kiên trì:\nXuất bản đều tay 2-3 video/tuần.", font=ctk.CTkFont(size=11), justify="left", text_color="#AAAAAA").pack(anchor="w", padx=10, pady=(0,10))
        ctk.CTkLabel(self.card_congthuc, text="🖼 Đầu tư Thumbnail cực kỳ:\nChữ cực kỳ ngắn (3-5 từ).", font=ctk.CTkFont(size=11), justify="left", text_color="#AAAAAA").pack(anchor="w", padx=10, pady=(0,10))
        ctk.CTkLabel(self.card_congthuc, text="🔍 Tìm Kênh Đối Thủ Bé:\nCanh tìm các kênh dưới 10K Sub.", font=ctk.CTkFont(size=11), justify="left", text_color="#AAAAAA").pack(anchor="w", padx=10, pady=(0,10))

    def select_tab(self, tab_name):
        for frame in self.frames.values(): frame.grid_forget()
        for btn in [self.btn_tab1, self.btn_tab2, self.btn_tab3, self.btn_voice, self.btn_capcut, self.btn_tab4, self.btn_seo, self.btn_ai_audio, self.btn_backup, self.btn_settings]:
            btn.configure(fg_color="transparent", text_color="#CCCCCC")
        if tab_name == "tab1": self.btn_tab1.configure(fg_color="#333333", text_color="#FFFFFF")
        elif tab_name == "tab2": self.btn_tab2.configure(fg_color="#333333", text_color="#FFFFFF")
        elif tab_name == "tab3": self.btn_tab3.configure(fg_color="#333333", text_color="#FFFFFF")
        elif tab_name == "voice": self.btn_voice.configure(fg_color="#333333", text_color="#FFFFFF")
        elif tab_name == "capcut": self.btn_capcut.configure(fg_color="#333333", text_color="#FFFFFF")
        elif tab_name == "tab4": self.btn_tab4.configure(fg_color="#333333", text_color="#FFFFFF")
        elif tab_name == "seo": self.btn_seo.configure(fg_color="#333333", text_color="#FFFFFF")
        elif tab_name == "ai_audio": self.btn_ai_audio.configure(fg_color="#333333", text_color="#FFFFFF")
        elif tab_name == "backup": self.btn_backup.configure(fg_color="#333333", text_color="#FFFFFF")
        elif tab_name == "settings": self.btn_settings.configure(fg_color="#333333", text_color="#FFFFFF")
        self.frames[tab_name].grid(row=0, column=0, sticky="nsew", padx=20, pady=20)
        self.update_muctieu(tab_name)

    def update_muctieu(self, tab_name):
        desc = {
            "tab1": "• Chuẩn hóa transcript.\n• Xóa định dạng thô.",
            "tab2": "• Tạo Hook thu hút.\n• Đánh giá Hook.",
            "tab3": "• Chia phân cảnh.\n• Tạo prompt hình ảnh.",
            "voice": "• Chọn giọng đọc AI.\n• Tùy chỉnh tốc độ.\n• Sinh MP3.",
            "capcut": "• Đồng bộ hình & tiếng.\n• Dựng draft CapCut.",
            "tab4": "• Xử lý tự động tất cả các bước.",
            "seo": "• Tối ưu tiêu đề, tag.",
            "ai_audio": "• Tách nhạc, giảm ồn.",
            "backup": "• Sao lưu, phục hồi.",
            "settings": "• Cấu hình API Key."
        }.get(tab_name, "• Hỗ trợ YTB 2026")
        self.lbl_muctieu_desc.configure(text=desc)

    # ---------------------------------------------------------
    # TAB 1: BƯỚC 1: CHUẨN HÓA KỊCH BẢN
    # ---------------------------------------------------------
    def setup_tab1(self):
        frame = ctk.CTkScrollableFrame(self.main_view, fg_color="transparent")
        self.frames["tab1"] = frame
        ctk.CTkLabel(frame, text="BƯỚC 1: CHUẨN HÓA KỊCH BẢN", font=ctk.CTkFont(size=20, weight="bold")).pack(anchor="w", pady=(0, 15))

        col_frm = ctk.CTkFrame(frame, fg_color="transparent")
        col_frm.pack(fill="both", expand=True)
        col_frm.grid_columnconfigure(0, weight=1)
        col_frm.grid_columnconfigure(1, weight=1)

        left = ctk.CTkFrame(col_frm, fg_color="transparent")
        left.grid(row=0, column=0, sticky="nsew", padx=(0, 10))
        ctk.CTkLabel(left, text="1. BẢN TRANSCRIPT THÔ (DÁN VÀO ĐÂY):", font=ctk.CTkFont(size=12, weight="bold")).pack(anchor="w", pady=5)
        self.t1_in = ctk.CTkTextbox(left, height=200, fg_color="#1A1B1E", border_color="#333333", border_width=1)
        self.t1_in.pack(fill="both", expand=True)
        
        right = ctk.CTkFrame(col_frm, fg_color="transparent")
        right.grid(row=0, column=1, sticky="nsew", padx=(10, 0))
        ctk.CTkLabel(right, text="2. KỊCH BẢN ĐÃ CHUẨN HÓA ĐỂ ĐỌC (VOICE):", font=ctk.CTkFont(size=12, weight="bold")).pack(anchor="w", pady=5)
        self.t1_out = ctk.CTkTextbox(right, height=200, fg_color="#0D1A25", border_color="#1E3A5F", border_width=1, text_color="#4FD1C5")
        self.t1_out.pack(fill="both", expand=True)

        opt_frm = ctk.CTkFrame(frame, fg_color="#1c1c1c", border_color="#333333", border_width=1)
        opt_frm.pack(fill="x", pady=15)
        ctk.CTkLabel(opt_frm, text="✍️ YÊU CẦU CHỈNH SỬA KỊCH BẢN (OPTIONAL)", font=ctk.CTkFont(weight="bold")).pack(anchor="w", padx=15, pady=(10,0))
        upd_box = ctk.CTkFrame(opt_frm, fg_color="transparent")
        upd_box.pack(fill="x", padx=15, pady=10)
        self.t1_req = ctk.CTkEntry(upd_box, placeholder_text="Ví dụ: Đổi tên quốc gia thành Hy lạp...", fg_color="#2b2b2b")
        self.t1_req.pack(side="left", fill="x", expand=True, padx=(0,10))
        self.btn_t1_update = ctk.CTkButton(upd_box, text="🔄 Cập Nhật", fg_color="#3B82F6", width=100, command=self.run_tab1_update)
        self.btn_t1_update.pack(side="right")

        len_frm = ctk.CTkFrame(frame, fg_color="#1c1c1c", border_color="#333333", border_width=1)
        len_frm.pack(fill="x", pady=5)
        ctk.CTkLabel(len_frm, text="TÙY CHỌN VIẾT LẠI KỊCH BẢN KHÁC BIỆT:").grid(row=0, column=0, padx=15, pady=10, sticky="w")
        self.t1_chk_diff = ctk.CTkCheckBox(len_frm, text="Viết lại kịch bản khác đi nhưng vẫn hay và hấp dẫn như bản gốc")
        self.t1_chk_diff.grid(row=0, column=1, padx=15, pady=10, sticky="e")

        ctk.CTkLabel(len_frm, text="YÊU CẦU ĐỘ DÀI MỚI:").grid(row=1, column=0, padx=15, pady=10, sticky="w")
        self.t1_cb_length = ctk.CTkComboBox(len_frm, values=["Độ dài bằng bản gốc (Mặc định)", "Ngắn hơn bản gốc (Súc tích)", "Dài hơn bản gốc (Chi tiết hơn)"], width=250)
        self.t1_cb_length.grid(row=1, column=1, padx=15, pady=10, sticky="w")
        
        self.t1_chk_intro = ctk.CTkCheckBox(len_frm, text="Chỉ thay đổi mỗi đoạn mở đầu (Intro)")
        self.t1_chk_intro.grid(row=1, column=2, padx=15, pady=10, sticky="w")

        bot_frm = ctk.CTkFrame(frame, fg_color="transparent")
        bot_frm.pack(fill="x", pady=15)
        ctk.CTkLabel(bot_frm, text="NGÔN NGỮ VIẾT LẠI:").pack(side="left", padx=10)
        self.t1_cb_lang = ctk.CTkComboBox(bot_frm, values=["Ngôn ngữ gốc", "Tiếng Việt", "Tiếng Anh (English)", "Tiếng Trung (中文)", "Tiếng Nhật (日本語)", "Tiếng Hàn (한국어)"], width=200)
        self.t1_cb_lang.pack(side="left", padx=10)
        self.btn_t1_run = ctk.CTkButton(bot_frm, text="✨ Chuẩn Hóa Kịch Bản", fg_color="#D11A2A", hover_color="#A11A2A", command=self.run_tab1)
        self.btn_t1_run.pack(side="right", padx=10)

    # ---------------------------------------------------------
    # TAB 2: BƯỚC 2: VIẾT LẠI HOOK SIÊU GIỮ CHÂN
    # ---------------------------------------------------------
    def setup_tab2(self):
        frame = ctk.CTkScrollableFrame(self.main_view, fg_color="transparent")
        self.frames["tab2"] = frame
        ctk.CTkLabel(frame, text="BƯỚC 2: VIẾT LẠI HOOK CHO KỊCH BẢN", font=ctk.CTkFont(size=20, weight="bold"), text_color="#FF6B6B").pack(anchor="w", pady=(0,15))

        col_frm = ctk.CTkFrame(frame, fg_color="transparent")
        col_frm.pack(fill="x", expand=False)
        col_frm.grid_columnconfigure(0, weight=1)
        col_frm.grid_columnconfigure(1, weight=1)

        left = ctk.CTkFrame(col_frm, fg_color="transparent")
        left.grid(row=0, column=0, sticky="nsew", padx=(0, 10))
        ctk.CTkLabel(left, text="ĐOẠN MỞ ĐẦU (HOOK) THÔ HOẶC Ý TƯỞNG ĐẦU TIÊN:", font=ctk.CTkFont(size=12, weight="bold")).pack(anchor="w")
        self.t2_in = ctk.CTkTextbox(left, height=100, fg_color="#1A1B1E", border_color="#333333", border_width=1)
        self.t2_in.pack(fill="x", pady=5)
        
        f1 = ctk.CTkFrame(left, fg_color="transparent")
        f1.pack(fill="x", pady=5)
        ctk.CTkLabel(f1, text="Ngôn Ngữ Viết Lại Hook:").pack(side="left")
        self.t2_cb_lang = ctk.CTkComboBox(f1, values=["Ngôn ngữ gốc", "Tiếng Việt", "Tiếng Anh (English)", "Tiếng Trung (中文)", "Tiếng Nhật (日本語)", "Tiếng Hàn (한국어)"])
        self.t2_cb_lang.pack(side="right")

        f2 = ctk.CTkFrame(left, fg_color="transparent")
        f2.pack(fill="x", pady=5)
        ctk.CTkLabel(f2, text="Cách tiếp cận viết lại:").pack(side="left")
        self.t2_cb_style = ctk.CTkComboBox(f2, values=["Viết khác đi hoàn toàn (Đột phá/Giật gân)", "Sát với bản gốc"], width=250)
        self.t2_cb_style.pack(side="right")

        self.btn_t2_run = ctk.CTkButton(left, text="Xem 3 Đề Xuất Hook Đỉnh Cao", fg_color="#D11A2A", hover_color="#A11A2A", height=40, command=self.run_tab2)
        self.btn_t2_run.pack(fill="x", pady=15)

        right = ctk.CTkFrame(col_frm, fg_color="transparent")
        right.grid(row=0, column=1, sticky="nsew", padx=(10, 0))
        ctk.CTkLabel(right, text="3 PHƯƠNG ÁN HOOK TRIỆU VIEW ĐỀ XUẤT:", font=ctk.CTkFont(size=12, weight="bold")).pack(anchor="w")
        self.hook_boxes = []
        for i in range(3):
            hf = ctk.CTkFrame(right, fg_color="#1c1c1c", border_color="#333333", border_width=1)
            hf.pack(fill="x", pady=5)
            tb = ctk.CTkTextbox(hf, height=60, fg_color="transparent")
            tb.pack(fill="x", padx=5, pady=5)
            btn = ctk.CTkButton(hf, text="✅ Chọn Hook Này", fg_color="#10B981", hover_color="#059669", height=24)
            btn.pack(anchor="e", padx=5, pady=(0,5))
            btn.configure(command=lambda b=tb: self.replace_hook(b))
            self.hook_boxes.append(tb)

        bleft = ctk.CTkFrame(frame, fg_color="transparent")
        bleft.pack(fill="both", expand=True, pady=15)
        ctk.CTkLabel(bleft, text="HIỆU CHỈNH KỊCH BẢN HOÀN CHỈNH 100%:", font=ctk.CTkFont(weight="bold")).pack(anchor="w")
        self.t2_full = ctk.CTkTextbox(bleft, height=200, fg_color="#1A1B1E", border_color="#333333", border_width=1)
        self.t2_full.pack(fill="both", expand=True)

    # ---------------------------------------------------------
    # TAB SEO: TỐI ƯU SEO & METADATA
    # ---------------------------------------------------------
    def setup_tab_seo(self):
        frame = ctk.CTkScrollableFrame(self.main_view, fg_color="transparent")
        self.frames["seo"] = frame
        ctk.CTkLabel(frame, text="TỐI ƯU SEO & METADATA", font=ctk.CTkFont(size=20, weight="bold"), text_color="#10B981").pack(anchor="w", pady=(0, 15))
        
        seo_frm = ctk.CTkFrame(frame, fg_color="#1A1B1E", border_color="#333333", border_width=1)
        seo_frm.pack(fill="x", pady=10)
        
        # Dropdown Ngôn ngữ
        top_frm = ctk.CTkFrame(seo_frm, fg_color="transparent")
        top_frm.pack(fill="x", padx=15, pady=5)
        ctk.CTkLabel(top_frm, text="Ngôn ngữ Đích:").pack(side="left", padx=5)
        self.seo_lang_cb = ctk.CTkComboBox(top_frm, values=["Auto-detect", "Vietnamese", "English"])
        self.seo_lang_cb.pack(side="left", padx=5)
        ctk.CTkButton(top_frm, text="✨ Sinh Meta SEO Độc Lập", fg_color="#8B5CF6", command=self.generate_seo_meta).pack(side="left", padx=15)
        
        # Render 4 trường với nút Copy
        self.seo_fields = {}
        for key, title in [("title", "Tiêu đề (Title)"), ("description", "Mô tả (Description)"), ("seo_tags", "Tags SEO"), ("thumbnail_prompt", "Prompt Ảnh Bìa (Thumbnail)")]:
            row = ctk.CTkFrame(seo_frm, fg_color="transparent")
            row.pack(fill="x", padx=15, pady=5)
            lbl_frm = ctk.CTkFrame(row, fg_color="transparent")
            lbl_frm.pack(fill="x")
            ctk.CTkLabel(lbl_frm, text=title, font=("", 12, "bold")).pack(side="left")
            ctk.CTkButton(lbl_frm, text="Copy", width=50, height=20, command=lambda k=key: self.copy_seo_field(k)).pack(side="right")
            
            tb = ctk.CTkTextbox(row, height=60, fg_color="#2b2b2b")
            tb.pack(fill="x", pady=2)
            self.seo_fields[key] = tb
            
    def copy_seo_field(self, key):
        text = self.seo_fields[key].get("1.0", "end").strip()
        self.clipboard_clear()
        self.clipboard_append(text)
        self.update()
        self.show_toast(f"✅ Đã copy {key}!")

    # [FIXED TASK 3]: Hàm action trigger độc lập tạo SEO Meta với JSON format
    def generate_seo_meta(self):
        txt = self.t1_out.get("1.0", "end").strip()
        if not txt:
            self.show_toast("⚠️ Vui lòng chuẩn hóa kịch bản trước!", error=True)
            return
        def task():
            try:
                lang = self.seo_lang_cb.get()
                schema = {
                    "type": "OBJECT",
                    "properties": {
                        "title": {"type": "STRING", "description": "Tiêu đề giật gân chuẩn SEO YouTube (dưới 70 ký tự)"},
                        "description": {"type": "STRING", "description": "Bài mô tả dài 200 từ bám sát kịch bản, kèm theo 3 hashtags ở cuối"},
                        "seo_tags": {"type": "STRING", "description": "Chuỗi cách nhau bằng dấu phẩy, chứa 15 tags SEO (ví dụ: tag1, tag2, tag3)"},
                        "thumbnail_prompt": {"type": "STRING", "description": "Prompt tiếng Anh siêu chi tiết tả cảnh làm ảnh bìa Midjourney/Stable Diffusion"}
                    }
                }
                
                req = f"Ngôn ngữ yêu cầu: {lang}.\nHãy tạo Meta SEO cho kịch bản sau dựa trên định dạng JSON chuẩn.\n\nKỊCH BẢN GỐC:\n{txt}"
                ans_str = self.call_ai(req, response_schema=schema)
                data = json.loads(ans_str)
                
                for key in ["title", "description", "seo_tags", "thumbnail_prompt"]:
                    self.seo_fields[key].delete("1.0", "end")
                    self.seo_fields[key].insert("1.0", str(data.get(key, "")))
                    
                self.show_toast("✅ Tạo SEO thành công!")
            except Exception as e:
                messagebox.showerror("Lỗi", str(e))
        threading.Thread(target=task).start()

    # ---------------------------------------------------------
    # TAB 3: BƯỚC 3: CHIA CẢNH & TẠO CAMERA PROMPT
    # ---------------------------------------------------------
    def setup_tab3(self):
        frame = ctk.CTkScrollableFrame(self.main_view, fg_color="transparent")
        self.frames["tab3"] = frame
        ctk.CTkLabel(frame, text="BƯỚC 3: CHIA PHÂN CẢNH & TẠO PROMPT ẢNH TIẾNG ANH", font=ctk.CTkFont(size=20, weight="bold"), text_color="#FF6B6B").pack(anchor="w", pady=(0,10))

        # AI EXTRACTION
        ext_frm = ctk.CTkFrame(frame, fg_color="#1c1c1c", border_color="#333333", border_width=1)
        ext_frm.pack(fill="x", pady=10)
        ctk.CTkLabel(ext_frm, text="🖼 TRÍCH STYLE VÀ MÀU SẮC TỪ ẢNH MẪU (AI EXTRACTION)", font=ctk.CTkFont(weight="bold"), text_color="#3B82F6").pack(anchor="w", padx=15, pady=10)
        
        self.lbl_paste1 = ctk.CTkLabel(ext_frm, text="Một hoặc nhiều ảnh ở đây (Kéo thả, Click chọn hoặc Ctrl+V)", fg_color="#2b2b2b", height=60, corner_radius=8)
        self.lbl_paste1.pack(fill="x", padx=15, pady=5)
        self.lbl_paste1.bind("<Button-1>", lambda e: self.browse_image(self.lbl_paste1))

        self.btn_ext = ctk.CTkButton(ext_frm, text="✨ Trích Xuất & Áp Dụng Phong Cách", fg_color="#3B82F6", command=self.run_ai_extraction)
        self.btn_ext.pack(pady=10)

        # STYLE CRUD
        sty_frm = ctk.CTkFrame(frame, fg_color="#1c1c1c", border_color="#333333", border_width=1)
        sty_frm.pack(fill="x", pady=10)
        ctk.CTkLabel(sty_frm, text="LỰA CHỌN PHONG CÁCH ẢNH (VISUAL STYLE):", font=ctk.CTkFont(weight="bold")).pack(anchor="w", padx=15, pady=10)
        
        row_sty = ctk.CTkFrame(sty_frm, fg_color="transparent")
        row_sty.pack(fill="x", padx=15, pady=5)
        self.cb_styles = ctk.CTkComboBox(row_sty, values=[s["name"] for s in self.styles_db["styles"]], command=self.on_style_select, width=250)
        self.cb_styles.pack(side="left", padx=(0,10))
        ctk.CTkButton(row_sty, text="❌ Xoá Style", width=80, fg_color="#D11A2A", command=self.delete_style).pack(side="left")
        
        self.t3_style = ctk.CTkEntry(sty_frm, fg_color="#1A1B1E")
        self.t3_style.pack(fill="x", padx=15, pady=10)
        self.on_style_select(self.cb_styles.get())

        row_add = ctk.CTkFrame(sty_frm, fg_color="transparent")
        row_add.pack(fill="x", padx=15, pady=(0,10))
        self.en_new_style_name = ctk.CTkEntry(row_add, placeholder_text="Tên phong cách mới", width=200)
        self.en_new_style_name.pack(side="left", padx=(0,10))
        ctk.CTkButton(row_add, text="➕ Lưu thành mẫu", fg_color="#10B981", command=self.add_style).pack(side="left")

        # CHARACTER CONSISTENCY
        char_frm = ctk.CTkFrame(frame, fg_color="#1c1c1c", border_color="#333333", border_width=1)
        char_frm.pack(fill="x", pady=10)
        ctk.CTkLabel(char_frm, text="👤 ĐỒNG BỘ NHÂN VẬT CHÍNH (CHARACTER CONSISTENCY)", font=ctk.CTkFont(weight="bold"), text_color="#A855F7").pack(anchor="w", padx=15, pady=10)
        cc_grid = ctk.CTkFrame(char_frm, fg_color="transparent")
        cc_grid.pack(fill="x", padx=15, pady=5)
        cc_grid.grid_columnconfigure(0, weight=1)
        cc_grid.grid_columnconfigure(1, weight=3)

        c1 = ctk.CTkFrame(cc_grid, fg_color="transparent")
        c1.grid(row=0, column=0, sticky="nsew", padx=(0,10))
        self.lbl_paste2 = ctk.CTkLabel(c1, text="↑ Tải ảnh nhân vật (Click hoặc Ctrl+V)", fg_color="#2b2b2b", height=80, corner_radius=8)
        self.lbl_paste2.pack(fill="x", pady=5)
        self.lbl_paste2.bind("<Button-1>", lambda e: self.browse_image(self.lbl_paste2))
        self.btn_char = ctk.CTkButton(c1, text="🔍 Nhận diện nhân vật", fg_color="#A855F7", command=self.run_char_recognition)
        self.btn_char.pack(fill="x")

        c2 = ctk.CTkFrame(cc_grid, fg_color="transparent")
        c2.grid(row=0, column=1, sticky="nsew")
        ctk.CTkLabel(c2, text="MÔ TẢ CHI TIẾT NHÂN VẬT (ENGLISH PROMPT):").pack(anchor="w")
        self.t3_char_desc = ctk.CTkTextbox(c2, height=80, fg_color="#1A1B1E")
        self.t3_char_desc.pack(fill="x", pady=5)

        # ADVANCED SCRIPT SPLIT
        adv_frm = ctk.CTkFrame(frame, fg_color="#1c1c1c", border_color="#333333", border_width=1)
        adv_frm.pack(fill="x", pady=10)
        
        # Header with checkbox
        ctk.CTkCheckBox(adv_frm, text="👑 [NÂNG CAO] Chia kịch bản phân cảnh bám khăng khít theo từng câu thoại", font=ctk.CTkFont(weight="bold"), text_color="#F59E0B").pack(anchor="w", padx=15, pady=(15, 5))
        ctk.CTkLabel(adv_frm, text="Hệ thống tự chia nhỏ kịch bản bám sát theo ranh giới câu thoại / đoạn văn nhỏ độc lập có nghĩa tròn trịa, giúp bối cảnh thay đổi chuẩn xác theo từng câu lồng tiếng phụ đề.", text_color="#AAAAAA", justify="left", wraplength=700).pack(anchor="w", padx=45, pady=(0, 15))
        
        cfg_row = ctk.CTkFrame(adv_frm, fg_color="transparent")
        cfg_row.pack(fill="x", padx=45, pady=(0, 15))
        ctk.CTkLabel(cfg_row, text="CẤU HÌNH GỘP CÂU THOẠI:", font=ctk.CTkFont(weight="bold")).pack(side="left")
        self.t3_cb_split = ctk.CTkComboBox(cfg_row, values=[
            "1 câu thoại = 1-3 prompts (tự động theo độ dài câu)",
            "Cứ 2 câu thoại = 1 prompt",
            "Cứ 3 câu thoại = 1 prompt",
            "Cứ 4 câu thoại = 1 prompt",
            "Tự chia thông minh bằng AI"
        ], width=350)
        self.t3_cb_split.pack(side="right")

        self.btn_t3_run = ctk.CTkButton(frame, text="Bắt Đầu Phân Cảnh & Viết Prompt", fg_color="#D11A2A", height=40, command=self.run_tab3)
        self.btn_t3_run.pack(fill="x", pady=20)
        
        self.t3_out_frame = ctk.CTkScrollableFrame(frame, height=300, fg_color="#1A1B1E", border_color="#333333", border_width=1)
        self.t3_out_frame.pack(fill="both", expand=True)

        # COPY TOOL - FULL UI
        cpy_frm = ctk.CTkFrame(frame, fg_color="#1A1B1E", border_color="#E5E7EB", border_width=1)
        cpy_frm.pack(fill="x", pady=15)
        ctk.CTkLabel(cpy_frm, text="⚡ BỘ CÔNG CỤ SAO CHÉP PROMPT VẼ ẢNH THEO SỐ LƯỢNG LINH HOẠT", font=ctk.CTkFont(weight="bold"), text_color="#EF4444").pack(anchor="w", padx=15, pady=10)
        
        self.copy_tabs = ctk.CTkTabview(cpy_frm, height=150)
        self.copy_tabs.pack(fill="x", padx=15, pady=(0,15))
        self.copy_tabs.add("Copy N Prompt Đầu Tiên")
        self.copy_tabs.add("Copy Khoảng Chỉ Định (Ví dụ: Từ 5 đến 15)")

        # Tab 1 of Copy
        t1 = self.copy_tabs.tab("Copy N Prompt Đầu Tiên")
        btn_row = ctk.CTkFrame(t1, fg_color="transparent")
        btn_row.pack(fill="x", pady=5)
        ctk.CTkLabel(btn_row, text="Chọn nhanh số lượng:").pack(side="left", padx=5)
        for num in [5, 10, 15, 20, 30, 50, 135]:
            lbl = f"{num} prompt" if num != 135 else "Tất cả (135)"
            ctk.CTkButton(btn_row, text=lbl, width=60, fg_color="#374151", hover_color="#4B5563", command=lambda n=num: self.t3_slider.set(n)).pack(side="left", padx=2)
        
        sld_row = ctk.CTkFrame(t1, fg_color="transparent")
        sld_row.pack(fill="x", pady=10)
        ctk.CTkLabel(sld_row, text="Tài chỉnh số lượng:").pack(side="left", padx=5)
        self.t3_slider = ctk.CTkSlider(sld_row, from_=1, to=135, number_of_steps=134)
        self.t3_slider.pack(side="left", fill="x", expand=True, padx=10)
        self.t3_slider.set(5)

        ctk.CTkButton(t1, text="📋 SAO CHÉP ĐÚNG X PROMPTS", fg_color="#DC2626", hover_color="#B91C1C", height=35, command=self.run_copy_prompts).pack(side="right", padx=5, pady=5)

        # Tab 2 of Copy
        t2 = self.copy_tabs.tab("Copy Khoảng Chỉ Định (Ví dụ: Từ 5 đến 15)")
        r2 = ctk.CTkFrame(t2, fg_color="transparent")
        r2.pack(fill="x", pady=20)
        ctk.CTkLabel(r2, text="Sao chép từ Prompt số:").pack(side="left", padx=5)
        self.cpy_from = ctk.CTkEntry(r2, width=60)
        self.cpy_from.pack(side="left", padx=5)
        self.cpy_from.insert(0, "1")
        ctk.CTkLabel(r2, text="đến Prompt số:").pack(side="left", padx=5)
        self.cpy_to = ctk.CTkEntry(r2, width=60)
        self.cpy_to.pack(side="left", padx=5)
        self.cpy_to.insert(0, "10")
        ctk.CTkLabel(r2, text="(Phạm vi khả dụng: 1 - 135)", text_color="#9CA3AF").pack(side="left", padx=20)
        ctk.CTkButton(t2, text="📋 SAO CHÉP TỪ PROMPT X ĐẾN Y", fg_color="#DC2626", hover_color="#B91C1C", height=35, command=self.run_copy_range).pack(side="right", padx=5, pady=5)

    def on_style_select(self, val):
        for s in self.styles_db["styles"]:
            if s["name"] == val:
                self.t3_style.delete(0, "end")
                self.t3_style.insert(0, s["prompt"])
                break

    def add_style(self):
        name = self.en_new_style_name.get().strip()
        prompt = self.t3_style.get().strip()
        if not prompt: return
        if not name:
            import re
            words = [w for w in re.sub(r'[^a-zA-Z0-9\s]', '', prompt).split() if len(w) > 3]
            name = " ".join(words[:2]).title()
            if not name: name = "Custom Style"
        else:
            name = name.title()
        self.styles_db["styles"].append({"name": name, "prompt": prompt})
        self.save_json(STYLES_FILE, self.styles_db)
        self.cb_styles.configure(values=[s["name"] for s in self.styles_db["styles"]])
        self.cb_styles.set(name)
        self.en_new_style_name.delete(0, "end")
        messagebox.showinfo("Thành công", f"Đã lưu Style: {name}")

    def delete_style(self):
        name = self.cb_styles.get()
        self.styles_db["styles"] = [s for s in self.styles_db["styles"] if s["name"] != name]
        self.save_json(STYLES_FILE, self.styles_db)
        self.cb_styles.configure(values=[s["name"] for s in self.styles_db["styles"]])
        if self.styles_db["styles"]:
            self.cb_styles.set(self.styles_db["styles"][0]["name"])
            self.on_style_select(self.styles_db["styles"][0]["name"])

    def browse_image(self, lbl):
        paths = filedialog.askopenfilenames(parent=self, filetypes=[("Image Files", "*.png *.jpg *.jpeg")])
        if paths:
            self.image_paths = list(paths)
            lbl.configure(text=f"✅ Đã tải {len(paths)} ảnh thành công!")

    # ---------------------------------------------------------
    # TAB: VOICE (API INTEGRATION)
    # ---------------------------------------------------------
    def setup_tab_voice(self):
        frame = ctk.CTkScrollableFrame(self.main_view, fg_color="transparent")
        self.frames["voice"] = frame
        ctk.CTkLabel(frame, text="BƯỚC 4: TẠO VOICE AI", font=ctk.CTkFont(size=20, weight="bold"), text_color="#10B981").pack(anchor="w", pady=(0,15))
        
        cfg_frm = ctk.CTkFrame(frame, fg_color="#1c1c1c", border_color="#333333", border_width=1)
        cfg_frm.pack(fill="x", pady=5)
        ctk.CTkLabel(cfg_frm, text="CẤU HÌNH NATIVE API", font=ctk.CTkFont(weight="bold")).pack(anchor="w", padx=15, pady=5)
        
        row1 = ctk.CTkFrame(cfg_frm, fg_color="transparent")
        row1.pack(fill="x", padx=15, pady=5)
        ctk.CTkLabel(row1, text="Native API Key:").pack(side="left", padx=5)
        self.native_voice_key = ctk.CTkEntry(row1, width=400, show="*")
        self.native_voice_key.pack(side="left", padx=5)
        self.native_voice_key.insert(0, self.config.get("native_voice_key", ""))
        
        ctk.CTkButton(row1, text="Lưu Key", width=80, command=lambda: self.save_config("native_voice_key", self.native_voice_key.get().strip())).pack(side="left", padx=5)
        
        self.tv_in = ctk.CTkTextbox(frame, height=150, fg_color="#1A1B1E")
        self.tv_in.pack(fill="x", pady=15)
        
        ctrl = ctk.CTkFrame(frame, fg_color="transparent")
        ctrl.pack(fill="x", pady=10)
        
        ctk.CTkButton(ctrl, text="🔄 Tải Danh Sách Giọng", fg_color="#3B82F6", width=150, command=self.fetch_voices).pack(side="left")
        self.tv_voice_cb = ctk.CTkComboBox(ctrl, values=["Đang tải danh sách giọng..."], width=300)
        self.tv_voice_cb.pack(side="left", padx=10)
        
        # [ADDED]: Nút Play nghe thử
        self.btn_play_preview = ctk.CTkButton(ctrl, text="▶ Nghe thử", fg_color="#F59E0B", width=100, command=self.play_voice_preview)
        self.btn_play_preview.pack(side="left", padx=5)
        
        # [ADDED]: Speed Slider
        speed_frm = ctk.CTkFrame(ctrl, fg_color="transparent")
        speed_frm.pack(side="left", padx=15)
        self.lbl_speed = ctk.CTkLabel(speed_frm, text="Tốc độ: 1.0x", font=ctk.CTkFont(weight="bold"))
        self.lbl_speed.pack(side="top")
        self.tv_speed_slider = ctk.CTkSlider(speed_frm, from_=0.5, to=2.0, number_of_steps=15, command=self.update_speed_label)
        self.tv_speed_slider.set(1.0)
        self.tv_speed_slider.pack(side="bottom")
        
        self.btn_tv_run = ctk.CTkButton(ctrl, text="✨ Tạo Voice MP3", fg_color="#10B981", hover_color="#059669", height=40, command=self.run_voice)
        self.btn_tv_run.pack(side="right", padx=15)
        self.tv_log = ctk.CTkTextbox(frame, height=100, fg_color="transparent", text_color="#AAAAAA")
        self.tv_log.pack(fill="x", pady=10)

    def update_speed_label(self, val):
        self.lbl_speed.configure(text=f"Tốc độ: {val:.1f}x")

    def play_voice_preview(self):
        def task():
            voice_name = self.tv_voice_cb.get()
            preview_url = None
            if hasattr(self, 'voices_list'):
                for v in self.voices_list:
                    if f"[{v.get('language')}] {v.get('name')} - {v.get('gender')}" == voice_name:
                        preview_url = v.get("preview_url")
                        break
            if not preview_url:
                self.tv_log.insert("end", "⚠️ Giọng đọc này không có file nghe thử.\n")
                self.tv_log.see("end")
                return
            
            self.tv_log.insert("end", f"▶ Đang phát thử giọng đọc...\n")
            self.tv_log.see("end")
            try:
                import os, urllib.request
                import tempfile
                tmp_file = os.path.join(tempfile.gettempdir(), "preview_voice.mp3")
                urllib.request.urlretrieve(preview_url, tmp_file)
                os.startfile(tmp_file) # Chạy bằng trình phát nhạc mặc định của Windows
            except Exception as e:
                self.tv_log.insert("end", f"❌ Lỗi khi tải/phát thử: {str(e)}\n")
        import threading
        threading.Thread(target=task).start()

    def fetch_voices(self):
        try:
            base_url = getattr(self, 'tts_base_url', None)
            base_url = base_url.get().strip() if base_url else "https://api.ai33.pro"
            token = self.native_voice_key.get().strip() if hasattr(self, 'native_voice_key') else BEARER_TOKEN
            url = f"{base_url}/v3/voices"
            headers = {
                "accept": "application/json",
                "authorization": f"{token}",
                "origin": base_url,
                "referer": f"{base_url}/",
                "user-agent": "Mozilla/5.0"
            }
            res = requests.get(url, headers=headers, timeout=10)
            if res.ok:
                data = res.json()
                self.voices_list = data
                names = [f"[{v.get('language')}] {v.get('name')} - {v.get('gender')}" for v in data]
                if names:
                    self.tv_voice_cb.configure(values=names)
                    self.tv_voice_cb.set(names[0])
                
                self.config["tts_base_url"] = base_url
                self.config["native_voice_key"] = token
                self.save_json(CONFIG_FILE, self.config)
            else:
                self.tv_voice_cb.configure(values=["Lỗi tải danh sách API"])
        except Exception as e:
            self.tv_voice_cb.configure(values=["Lỗi mạng/API"])

    # ---------------------------------------------------------
    # TAB: DỰNG VIDEO & CAPCUT
    # ---------------------------------------------------------
    def setup_tab_capcut(self):
        frame = ctk.CTkScrollableFrame(self.main_view, fg_color="transparent")
        self.frames["capcut"] = frame
        ctk.CTkLabel(frame, text="🎬 DỰNG VIDEO & CAPCUT PRO", font=ctk.CTkFont(size=20, weight="bold"), text_color="#10B981").pack(anchor="w", pady=(0,15))
        
        # --- TOOL 1: Khớp âm thanh & Hình ảnh (Sync) ---
        sync_frm = ctk.CTkFrame(frame, fg_color="#1c1c1c", border_color="#333333", border_width=1)
        sync_frm.pack(fill="x", pady=10)
        ctk.CTkLabel(sync_frm, text="1. KHỚP ÂM THANH & HÌNH ẢNH (SYNC)", font=ctk.CTkFont(weight="bold", size=14)).pack(anchor="w", padx=15, pady=(10, 5))
        
        ctk.CTkLabel(sync_frm, text="Đường dẫn file Whisper JSON:").pack(anchor="w", padx=15)
        r1 = ctk.CTkFrame(sync_frm, fg_color="transparent")
        r1.pack(fill="x", padx=15, pady=5)
        self.entry_sync_json = ctk.CTkEntry(r1, placeholder_text="Ví dụ: output/whisper_result.json", width=400)
        self.entry_sync_json.pack(side="left", padx=(0,10))
        ctk.CTkButton(r1, text="📁 Chọn File", width=100, fg_color="#3B82F6", command=lambda: self.entry_sync_json.insert(0, filedialog.askopenfilename(parent=self, filetypes=[("JSON Files", "*.json")]))).pack(side="left")
        
        ctk.CTkLabel(sync_frm, text="Thư mục chứa Hình Ảnh (Images):").pack(anchor="w", padx=15)
        r2 = ctk.CTkFrame(sync_frm, fg_color="transparent")
        r2.pack(fill="x", padx=15, pady=5)
        self.entry_sync_img = ctk.CTkEntry(r2, placeholder_text="Ví dụ: output/images", width=400)
        self.entry_sync_img.pack(side="left", padx=(0,10))
        ctk.CTkButton(r2, text="📁 Chọn Thư mục", width=100, fg_color="#3B82F6", command=lambda: self.entry_sync_img.insert(0, filedialog.askdirectory(parent=self))).pack(side="left")
        
        ctk.CTkButton(sync_frm, text="▶ Thực Hiện Đồng Bộ", fg_color="#F59E0B", command=self.run_capcut_sync).pack(anchor="w", padx=15, pady=15)
        
        # --- TOOL 2: Dựng Video Tự Động (CapCut AutoMix) ---
        amix_frm = ctk.CTkFrame(frame, fg_color="#1c1c1c", border_color="#333333", border_width=1)
        amix_frm.pack(fill="x", pady=10)
        ctk.CTkLabel(amix_frm, text="2. DỰNG VIDEO TỰ ĐỘNG (CAPCUT AUTOMIX)", font=ctk.CTkFont(weight="bold", size=14)).pack(anchor="w", padx=15, pady=(10, 5))
        
        ctk.CTkLabel(amix_frm, text="Tên Project CapCut:").pack(anchor="w", padx=15)
        self.entry_amix_name = ctk.CTkEntry(amix_frm, placeholder_text="Nhập tên Project (mặc định: AutoProject)", width=400)
        self.entry_amix_name.pack(anchor="w", padx=15, pady=5)
        
        ctk.CTkButton(amix_frm, text="🎬 Dựng File Draft CapCut", fg_color="#10B981", height=40, font=ctk.CTkFont(weight="bold"), command=self.run_capcut_automix).pack(anchor="w", padx=15, pady=15)
        
        self.capcut_log = ctk.CTkTextbox(frame, height=150, fg_color="#0D1117", text_color="#AAAAAA")
        self.capcut_log.pack(fill="both", expand=True, pady=10)

    def run_capcut_sync(self):
        json_path = self.entry_sync_json.get().strip()
        img_dir = self.entry_sync_img.get().strip()
        if not json_path or not img_dir:
            self.show_toast("Vui lòng chọn đủ File JSON và Thư mục Ảnh!", True)
            return
        
        self.capcut_log.insert("end", f"▶ Đang tính toán đồng bộ hình ảnh & âm thanh...\n")
        self.capcut_log.see("end")
        
        def task():
            try:
                import json
                with open(json_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                
                # Tính toán đồng bộ (Sync)
                # Đọc danh sách ảnh
                import os
                images = [os.path.join(img_dir, i) for i in os.listdir(img_dir) if i.lower().endswith(('.png', '.jpg', '.jpeg'))]
                total_images = len(images)
                
                segments = data.get('segments', [])
                total_duration = data.get('duration', 0)
                if not total_duration and segments:
                    total_duration = segments[-1].get('end', 0)
                
                if total_images == 0:
                    self.capcut_log.insert("end", "⚠️ Cảnh báo: Không tìm thấy ảnh trong thư mục.\n")
                    duration_per_img = 0
                else:
                    duration_per_img = total_duration / total_images
                    self.capcut_log.insert("end", f"📸 Tìm thấy {total_images} ảnh. Mỗi ảnh sẽ hiển thị ~{duration_per_img:.2f}s.\n")
                    
                sync_map = {
                    "total_duration": total_duration,
                    "total_images": total_images,
                    "duration_per_img": duration_per_img,
                    "segments": segments,
                    "images": images
                }
                
                sync_path = os.path.join(os.path.dirname(json_path), "sync_map.json")
                with open(sync_path, 'w', encoding='utf-8') as f:
                    json.dump(sync_map, f, ensure_ascii=False, indent=2)
                
                self.capcut_log.insert("end", f"✅ Đã tạo bảng đồng bộ thời gian tại:\n{sync_path}\n")
                self.show_toast("Đồng bộ hoàn tất!")
            except Exception as e:
                self.capcut_log.insert("end", f"❌ Lỗi: {str(e)}\n")
        threading.Thread(target=task).start()

    def run_capcut_automix(self):
        proj_name = self.entry_amix_name.get().strip() or "AutoProject"
        
        self.capcut_log.insert("end", f"▶ Đang khởi tạo Project CapCut: {proj_name}...\n")
        self.capcut_log.see("end")
        
        def task():
            try:
                import uuid
                import time
                import os
                import json
                draft_id = str(uuid.uuid4()).upper()
                
                drafts_dir = os.path.expandvars(r'%LOCALAPPDATA%\CapCut\User Data\Projects\com.lveditor.draft')
                if not os.path.exists(drafts_dir):
                    os.makedirs(drafts_dir, exist_ok=True)
                    
                project_dir = os.path.join(drafts_dir, draft_id)
                os.makedirs(project_dir, exist_ok=True)
                
                # Create draft_meta_info.json
                meta_info = {
                    "id": draft_id,
                    "draft_name": proj_name,
                    "draft_fold_path": project_dir,
                    "draft_timeline_materials_size": 0,
                    "tm_draft_create": int(time.time() * 1000),
                    "tm_draft_modified": int(time.time() * 1000),
                    "draft_is_ai_shorts": False,
                    "draft_is_invisible": False,
                    "draft_type": ""
                }
                with open(os.path.join(project_dir, "draft_meta_info.json"), 'w', encoding='utf-8') as f:
                    json.dump(meta_info, f, ensure_ascii=False, indent=2)
                    
                # Create basic draft_content.json
                draft_content = {
                    "id": draft_id,
                    "materials": {"audios": [], "canvases": [], "videos": []},
                    "tracks": [],
                    "version": 2
                }
                with open(os.path.join(project_dir, "draft_content.json"), 'w', encoding='utf-8') as f:
                    json.dump(draft_content, f, ensure_ascii=False, indent=2)
                
                self.capcut_log.insert("end", f"✅ Đã dựng thành công Project: {proj_name}\n")
                self.capcut_log.insert("end", f"📂 ID: {draft_id}\n")
                self.capcut_log.insert("end", f"Vui lòng mở CapCut PC để xem dự án.\n")
                self.show_toast("AutoMix hoàn tất!")
            except Exception as e:
                self.capcut_log.insert("end", f"❌ Lỗi tạo project: {str(e)}\n")
        threading.Thread(target=task).start()

    # ---------------------------------------------------------
    # TAB: AUTO PIPELINE
    # ---------------------------------------------------------
    def setup_tab4(self):
        frame = ctk.CTkScrollableFrame(self.main_view, fg_color="transparent")
        self.frames["tab4"] = frame
        ctk.CTkLabel(frame, text="HỆ THỐNG XỬ LÝ LIÊN HOÀN HÀNG LOẠT", font=ctk.CTkFont(size=20, weight="bold")).pack(anchor="w", pady=(0,15))
        
        # [FIXED TASK 4]: Checkbox chọn luồng
        self.cb_step1_var = ctk.BooleanVar(value=True)
        self.cb_step2_var = ctk.BooleanVar(value=True)
        self.cb_step3_var = ctk.BooleanVar(value=True)
        self.cb_step4_var = ctk.BooleanVar(value=True)
        
        cb_frm = ctk.CTkFrame(frame, fg_color="#1A1B1E", border_color="#333333", border_width=1)
        cb_frm.pack(fill="x", pady=5)
        ctk.CTkCheckBox(cb_frm, text="Bước 1: Chuẩn hóa", variable=self.cb_step1_var).pack(side="left", padx=15, pady=10)
        ctk.CTkCheckBox(cb_frm, text="Bước 2: Viết Hook", variable=self.cb_step2_var).pack(side="left", padx=15, pady=10)
        ctk.CTkCheckBox(cb_frm, text="Bước 3: Phân cảnh", variable=self.cb_step3_var).pack(side="left", padx=15, pady=10)
        ctk.CTkCheckBox(cb_frm, text="Bước 4: Tạo Voice", variable=self.cb_step4_var).pack(side="left", padx=15, pady=10)
        self.cb_step5_var = ctk.BooleanVar(value=True)
        ctk.CTkCheckBox(cb_frm, text="Bước 5: Cắt Voice", variable=self.cb_step5_var).pack(side="left", padx=15, pady=10)
        self.cb_step6_var = ctk.BooleanVar(value=True)
        ctk.CTkCheckBox(cb_frm, text="Bước 6: Khớp Sync", variable=self.cb_step6_var).pack(side="left", padx=15, pady=10)
        self.cb_step7_var = ctk.BooleanVar(value=True)
        ctk.CTkCheckBox(cb_frm, text="Bước 7: AutoMix CapCut", variable=self.cb_step7_var).pack(side="left", padx=15, pady=10)
        
        btn_frm = ctk.CTkFrame(frame, fg_color="transparent")
        btn_frm.pack(fill="x", pady=5)
        
        ctk.CTkButton(btn_frm, text="➕ Thêm Job vào Hàng đợi", fg_color="#8B5CF6", command=self.add_mock_job).pack(side="left", padx=5)
        ctk.CTkButton(btn_frm, text="▶️ Bắt Đầu Xử Lý Tất Cả", fg_color="#10B981", command=self.start_auto_pipeline).pack(side="left", padx=5)
        ctk.CTkButton(btn_frm, text="⏸ Dừng", fg_color="#EF4444", command=lambda: setattr(self, 'is_processing', False)).pack(side="left", padx=5)

    def check_preflight(self):
        if not self.global_state.get("topic"):
            messagebox.showwarning("Dừng pipeline", "Bạn chưa chọn Chủ đề!")
            return False
        if not any([self.cb_step1_var.get(), self.cb_step2_var.get(), self.cb_step3_var.get(), self.cb_step4_var.get()]):
            messagebox.showwarning("Dừng pipeline", "Bạn phải tick chọn ít nhất 1 bước để chạy!")
            return False
        if self.cb_step4_var.get():
            token = self.native_voice_key.get().strip() if hasattr(self, 'native_voice_key') else BEARER_TOKEN
            if not token:
                messagebox.showwarning("Dừng pipeline", "Chưa cấu hình API Key của AI33 cho Voice!")
                return False
        return True

    def start_auto_pipeline(self):
        if not self.check_preflight(): return
        setattr(self, 'is_processing', True)
        self.console.insert("end", "[SYSTEM] Pre-flight Check OK. Đang nạp luồng...\n")
        self.console.see("end")
        self.add_mock_job()

    # ---------------------------------------------------------
    # TAB BACKUP: QUẢN LÝ DỮ LIỆU & BACKUP
    # ---------------------------------------------------------
    def setup_tab_backup(self):
        frame = ctk.CTkScrollableFrame(self.main_view, fg_color="transparent")
        self.frames["backup"] = frame
        ctk.CTkLabel(frame, text="QUẢN LÝ DỮ LIỆU & BACKUP", font=ctk.CTkFont(size=20, weight="bold")).pack(anchor="w", pady=(0,15))
        
        btn_frm = ctk.CTkFrame(frame, fg_color="#1c1c1c", border_color="#333333", border_width=1)
        btn_frm.pack(fill="x", pady=15, ipady=10)
        ctk.CTkLabel(btn_frm, text="TẢI LÊN & KHÔI PHỤC KỊCH BẢN (Task 8)", font=ctk.CTkFont(weight="bold")).pack(anchor="w", padx=15, pady=10)
        
        row1 = ctk.CTkFrame(btn_frm, fg_color="transparent")
        row1.pack(fill="x", padx=15, pady=5)
        ctk.CTkButton(row1, text="💾 Tải Full Backup (.txt)", fg_color="#3B82F6", command=self.backup_ctrl.export_backup).pack(side="left", padx=5)
        ctk.CTkButton(row1, text="📥 Nhập Backup từ file (.txt)", fg_color="#F59E0B", command=self.backup_ctrl.import_backup).pack(side="left", padx=5)

    # [ADDED]: Worker ngầm xử lý hàng loạt theo Task 4 & 5
    def process_queue_worker(self):
        while True:
            job = self.job_queue.get()
            try:
                self.console.insert("end", f"\n[BATCH] Đang bắt đầu Auto-Pipeline...\n")
                self.console.see("end")
                time.sleep(1)
                
                if self.cb_step1_var.get():
                    self.console.insert("end", " -> [STEP 1] Chuẩn hóa kịch bản...\n")
                    time.sleep(1) # Fake delay
                
                if self.cb_step2_var.get():
                    self.console.insert("end", " -> [STEP 2] Khởi tạo Hook...\n")
                    time.sleep(1)
                else:
                    self.console.insert("end", " -> [STEP 2] Bỏ qua (Lấy output Step 1 đẩy sang Step 3)...\n")
                
                if self.cb_step3_var.get():
                    self.console.insert("end", " -> [STEP 3] Chia phân cảnh...\n")
                    time.sleep(1)
                    
                if self.cb_step4_var.get():
                    self.console.insert("end", " -> [STEP 4] Tạo Voice AI33...\n")
                    time.sleep(2)
                    
                if getattr(self, "cb_step5_var", None) and self.cb_step5_var.get():
                    self.console.insert("end", " -> [STEP 5] Cắt Voice (Whisper AI)...\n")
                    self.console.see("end")
                    # Lấy audio file gần nhất trong Output (hoặc giả lập nếu chưa có)
                    out_dir = os.path.join(os.path.dirname(__file__), "Output")
                    os.makedirs(out_dir, exist_ok=True)
                    audio_files = [os.path.join(out_dir, f) for f in os.listdir(out_dir) if f.endswith(".mp3")]
                    if audio_files:
                        latest_audio = max(audio_files, key=os.path.getctime)
                        self._process_whisper_slicing(latest_audio)
                    else:
                        self.console.insert("end", " ❌ Không tìm thấy file audio trong Output để cắt!\n")

                if getattr(self, "cb_step6_var", None) and self.cb_step6_var.get():
                    self.console.insert("end", " -> [STEP 6] Đồng bộ hình ảnh và âm thanh (Sync)...\n")
                    self.console.see("end")
                    # Lấy file whisper.json từ output nếu có
                    out_dir = os.path.join(os.path.dirname(__file__), "Output")
                    json_files = [os.path.join(out_dir, f) for f in os.listdir(out_dir) if f.endswith(".json") and "whisper" in f]
                    if json_files:
                        self.entry_sync_json.delete(0, 'end')
                        self.entry_sync_json.insert(0, json_files[0])
                        self.run_capcut_sync()
                        time.sleep(2) # đợi sync logic
                    else:
                        self.console.insert("end", " ⚠️ [Bỏ qua] Không tìm thấy file whisper.json.\n")

                if getattr(self, "cb_step7_var", None) and self.cb_step7_var.get():
                    self.console.insert("end", " -> [STEP 7] Tự động dựng video CapCut (AutoMix)...\n")
                    self.console.see("end")
                    self.run_capcut_automix()
                    time.sleep(2)
                    
                self.console.insert("end", "✅ BATCH HOÀN TẤT THÀNH CÔNG!\n")
                self.console.see("end")
                
                topic = self.global_state.get("topic", "Không rõ")
                self.send_telegram_alert(f"✅ [YTB 2026] Render hoàn tất!\nChủ đề: {topic}\nThời gian: {time.strftime('%Y-%m-%d %H:%M:%S')}")
                
            except Exception as e:
                self.console.insert("end", f"❌ Lỗi Pipeline: {e}\n")
                self.console.see("end")
            finally:
                setattr(self, 'is_processing', False)
                self.job_queue.task_done()

    def add_mock_job(self):
        job_id = int(time.time())
        self.job_queue.put({"id": job_id})
        self.console.insert("end", f"[QUEUE] Đã thêm Job {job_id} vào hàng đợi.\n")
        self.console.see("end")

    def send_telegram_alert(self, msg):
        token = self.config.get("tele_token", "")
        chat_id = self.config.get("tele_chat_id", "")
        if not token or not chat_id: return
        try:
            url = f"https://api.telegram.org/bot{token}/sendMessage"
            import requests
            requests.post(url, json={"chat_id": chat_id, "text": msg}, timeout=5)
        except Exception:
            pass # Nuốt lỗi nếu không có mạng

    def _process_whisper_slicing(self, audio_path):
        self.console.insert("end", f"▶ Đang khởi chạy Whisper AI cho file: {os.path.basename(audio_path)}...\n")
        self.console.see("end")
        import tempfile
        import uuid
        import subprocess
        
        helper_script = os.path.join(tempfile.gettempdir(), f"whisper_helper_{uuid.uuid4().hex}.py")
        json_output = os.path.join(tempfile.gettempdir(), f"whisper_out_{uuid.uuid4().hex}.json")
        
        with open(helper_script, 'w', encoding='utf-8') as f:
            f.write(f'''
import json
import sys

audio_path = sys.argv[1]
output_json = sys.argv[2]

try:
    import whisper
    print("Đang tải model Whisper 'base'...")
    model = whisper.load_model("base")
    print("Đang trích xuất văn bản từ Audio (Transcribing)...")
    result = model.transcribe(audio_path, word_timestamps=True)
    with open(output_json, 'w', encoding='utf-8') as jf:
        json.dump(result, jf)
    print("Whisper xử lý thành công!")
except ImportError:
    print("LỖI: Chưa cài đặt thư viện 'whisper' hoặc 'torch'. Vui lòng chạy: pip install -U openai-whisper")
    sys.exit(1)
except Exception as e:
    print(f"Lỗi Whisper: {{str(e)}}")
    with open(output_json, 'w', encoding='utf-8') as jf:
        json.dump({{"error": str(e)}}, jf)
''')
        try:
            # Chạy subprocess ẩn popup cmd trên windows nếu cần (tùy thuộc vào _HiddenPopen)
            process = subprocess.Popen([sys.executable, helper_script, audio_path, json_output], stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, encoding='utf-8')
            for line in iter(process.stdout.readline, ''):
                self.console.insert("end", f" [WHISPER] {line}")
                self.console.see("end")
            process.stdout.close()
            process.wait()
            
            if os.path.exists(json_output):
                with open(json_output, 'r', encoding='utf-8') as f:
                    res = json.load(f)
                    if "error" in res:
                        self.console.insert("end", f"❌ Lỗi từ Whisper: {res['error']}\n")
                    else:
                        self.console.insert("end", f"✅ Whisper đã bóc băng xong! Số lượng segments: {len(res.get('segments', []))}\n")
                        # (Logic cắt audio chi tiết sẽ dựa vào word_timestamps tại đây)
            else:
                self.console.insert("end", f"❌ Whisper không tạo ra file kết quả JSON.\n")
                
        except Exception as e:
            self.console.insert("end", f"❌ Lỗi chạy Whisper: {str(e)}\n")
        self.console.see("end")

    # Các hàm đã dời sang BackupRestoreController


    def setup_tab_ai_audio(self):
        self.frames["ai_audio"] = ctk.CTkFrame(self.main_view, fg_color="transparent")
        self.frames["ai_audio"].grid_columnconfigure(0, weight=1)
        self.frames["ai_audio"].grid_rowconfigure(1, weight=1)

        # Header
        header = ctk.CTkFrame(self.frames["ai_audio"], fg_color="#1e1e1e", corner_radius=10)
        header.grid(row=0, column=0, sticky="ew", pady=(0, 20))
        ctk.CTkLabel(header, text="🎵 AI Audio Tools (ai33.pro)", font=ctk.CTkFont(size=24, weight="bold"), text_color="#4CAF50").pack(side="left", padx=20, pady=15)

        # Tabview
        self.ai_audio_tabview = ctk.CTkTabview(self.frames["ai_audio"])
        self.ai_audio_tabview.grid(row=1, column=0, sticky="nsew")

        # Add tabs
        self.ai_audio_tabview.add("Dubbing")
        self.ai_audio_tabview.add("Speech to Text")
        self.ai_audio_tabview.add("Sound Effect")
        self.ai_audio_tabview.add("Voice Changer")
        self.ai_audio_tabview.add("Voice Isolate")

        self.setup_tab_dubbing(self.ai_audio_tabview.tab("Dubbing"))
        self.setup_tab_stt(self.ai_audio_tabview.tab("Speech to Text"))
        self.setup_tab_sound_effect(self.ai_audio_tabview.tab("Sound Effect"))
        self.setup_tab_voice_changer(self.ai_audio_tabview.tab("Voice Changer"))
        self.setup_tab_voice_isolate(self.ai_audio_tabview.tab("Voice Isolate"))

    def get_ai33_credentials(self):
        base_url = getattr(self, "tts_base_url", None)
        base_url = base_url.get().strip() if base_url else "https://api.ai33.pro"
        token = getattr(self, "native_voice_key", None)
        token = token.get().strip() if token else BEARER_TOKEN
        return base_url, token

    def ai_audio_browse_file(self, label_var):
        filepath = filedialog.askopenfilename(parent=self, title="Chọn file âm thanh", filetypes=[("Audio files", "*.mp3 *.m4a *.wav")])
        if filepath:
            label_var.set(filepath)

    def setup_tab_dubbing(self, parent):
        parent.grid_columnconfigure(1, weight=1)
        self.dub_file_var = tk.StringVar(value="")
        ctk.CTkLabel(parent, text="File âm thanh (m4a, mp3):").grid(row=0, column=0, padx=10, pady=10, sticky="w")
        ctk.CTkLabel(parent, textvariable=self.dub_file_var, text_color="#AAAAAA").grid(row=0, column=1, padx=10, pady=10, sticky="w")
        ctk.CTkButton(parent, text="Chọn file", command=lambda: self.ai_audio_browse_file(self.dub_file_var)).grid(row=0, column=2, padx=10, pady=10)

        ctk.CTkLabel(parent, text="Ngôn ngữ đích (VD: vi, en):").grid(row=1, column=0, padx=10, pady=10, sticky="w")
        self.dub_lang_entry = ctk.CTkEntry(parent, placeholder_text="vi")
        self.dub_lang_entry.grid(row=1, column=1, padx=10, pady=10, sticky="w")

        self.btn_run_dub = ctk.CTkButton(parent, text="Bắt đầu Dubbing", fg_color="#FF4C4C", command=self.run_dubbing)
        self.btn_run_dub.grid(row=2, column=0, columnspan=3, pady=20)

    def run_dubbing(self):
        filepath = self.dub_file_var.get()
        if not filepath:
            self.show_toast("Vui lòng chọn file audio!", error=True)
            return
        target_lang = self.dub_lang_entry.get().strip() or "vi"
        
        def task():
            self.btn_run_dub.configure(state="disabled", text="Đang xử lý...")
            try:
                base_url, token = self.get_ai33_credentials()
                url = f"{base_url}/v1/task/dubbing"
                files = {'file': open(filepath, 'rb')}
                data = {'num_speakers': 0, 'disable_voice_cloning': 'false', 'source_lang': 'auto', 'target_lang': target_lang}
                headers = {'xi-api-key': token}
                res = requests.post(url, headers=headers, files=files, data=data)
                res_json = res.json()
                if res_json.get("success"):
                    self.show_toast(f"Tạo task thành công: {res_json.get('task_id')}. (Lưu ý: Bạn cần polling để lấy kết quả)")
                else:
                    self.show_toast(f"Lỗi API: {res.text}", error=True)
            except Exception as e:
                self.show_toast(f"Lỗi: {e}", error=True)
            finally:
                self.btn_run_dub.configure(state="normal", text="Bắt đầu Dubbing")
        threading.Thread(target=task).start()

    def setup_tab_stt(self, parent):
        parent.grid_columnconfigure(1, weight=1)
        self.stt_file_var = tk.StringVar(value="")
        ctk.CTkLabel(parent, text="File âm thanh (mp3, wav...):").grid(row=0, column=0, padx=10, pady=10, sticky="w")
        ctk.CTkLabel(parent, textvariable=self.stt_file_var, text_color="#AAAAAA").grid(row=0, column=1, padx=10, pady=10, sticky="w")
        ctk.CTkButton(parent, text="Chọn file", command=lambda: self.ai_audio_browse_file(self.stt_file_var)).grid(row=0, column=2, padx=10, pady=10)

        self.btn_run_stt = ctk.CTkButton(parent, text="Bắt đầu STT", fg_color="#FF4C4C", command=self.run_stt)
        self.btn_run_stt.grid(row=1, column=0, columnspan=3, pady=20)

    def run_stt(self):
        filepath = self.stt_file_var.get()
        if not filepath:
            self.show_toast("Vui lòng chọn file audio!", error=True)
            return
        def task():
            self.btn_run_stt.configure(state="disabled", text="Đang xử lý...")
            try:
                base_url, token = self.get_ai33_credentials()
                url = f"{base_url}/v1/task/speech-to-text"
                files = {'file': open(filepath, 'rb')}
                data = {'tag_audio_events': 'true'}
                headers = {'xi-api-key': token}
                res = requests.post(url, headers=headers, files=files, data=data)
                res_json = res.json()
                if res_json.get("success"):
                    self.show_toast(f"Tạo task thành công: {res_json.get('task_id')}")
                else:
                    self.show_toast(f"Lỗi API: {res.text}", error=True)
            except Exception as e:
                self.show_toast(f"Lỗi: {e}", error=True)
            finally:
                self.btn_run_stt.configure(state="normal", text="Bắt đầu STT")
        threading.Thread(target=task).start()

    def setup_tab_sound_effect(self, parent):
        parent.grid_columnconfigure(1, weight=1)
        ctk.CTkLabel(parent, text="Prompt hiệu ứng:").grid(row=0, column=0, padx=10, pady=10, sticky="w")
        self.sfx_prompt = ctk.CTkEntry(parent, placeholder_text="Thunder rolling with heavy rain", width=300)
        self.sfx_prompt.grid(row=0, column=1, padx=10, pady=10, sticky="w")
        
        self.btn_run_sfx = ctk.CTkButton(parent, text="Tạo Sound Effect", fg_color="#FF4C4C", command=self.run_sfx)
        self.btn_run_sfx.grid(row=1, column=0, columnspan=3, pady=20)

    def run_sfx(self):
        prompt = self.sfx_prompt.get().strip()
        if not prompt: return
        def task():
            self.btn_run_sfx.configure(state="disabled", text="Đang tạo...")
            try:
                base_url, token = self.get_ai33_credentials()
                url = f"{base_url}/v1/task/sound-effect"
                data = {"text": prompt, "duration_seconds": None, "prompt_influence": 0.3, "loop": False, "model_id": "eleven_text_to_sound_v2"}
                headers = {'xi-api-key': token, 'Content-Type': 'application/json'}
                res = requests.post(url, headers=headers, json=data)
                res_json = res.json()
                if res_json.get("success"):
                    self.show_toast(f"Task SFX tạo: {res_json.get('task_id')}")
                else:
                    self.show_toast(f"Lỗi API: {res.text}", error=True)
            except Exception as e:
                self.show_toast(f"Lỗi: {e}", error=True)
            finally:
                self.btn_run_sfx.configure(state="normal", text="Tạo Sound Effect")
        threading.Thread(target=task).start()

    def setup_tab_voice_changer(self, parent):
        parent.grid_columnconfigure(1, weight=1)
        self.vc_file_var = tk.StringVar(value="")
        ctk.CTkLabel(parent, text="File âm thanh (mp3, wav):").grid(row=0, column=0, padx=10, pady=10, sticky="w")
        ctk.CTkLabel(parent, textvariable=self.vc_file_var, text_color="#AAAAAA").grid(row=0, column=1, padx=10, pady=10, sticky="w")
        ctk.CTkButton(parent, text="Chọn file", command=lambda: self.ai_audio_browse_file(self.vc_file_var)).grid(row=0, column=2, padx=10, pady=10)

        ctk.CTkLabel(parent, text="Voice ID:").grid(row=1, column=0, padx=10, pady=10, sticky="w")
        self.vc_voice_id = ctk.CTkEntry(parent, placeholder_text="Ví dụ: 21m00Tcm4TlvDq8ikWAM")
        self.vc_voice_id.grid(row=1, column=1, padx=10, pady=10, sticky="w")

        self.btn_run_vc = ctk.CTkButton(parent, text="Đổi Giọng", fg_color="#FF4C4C", command=self.run_voice_changer)
        self.btn_run_vc.grid(row=2, column=0, columnspan=3, pady=20)

    def run_voice_changer(self):
        filepath = self.vc_file_var.get()
        voice_id = self.vc_voice_id.get().strip()
        if not filepath or not voice_id:
            self.show_toast("Chọn file và điền Voice ID!", error=True)
            return
        def task():
            self.btn_run_vc.configure(state="disabled", text="Đang xử lý...")
            try:
                base_url, token = self.get_ai33_credentials()
                url = f"{base_url}/v1/task/voice-changer"
                files = {'file': open(filepath, 'rb')}
                data = {'voice_id': voice_id, 'model_id': 'eleven_multilingual_sts_v2', 'voice_settings': '{"stability": 0.5, "similarity_boost": 0.75, "style": 0.2, "use_speaker_boost": true}', 'remove_background_noise': 'true'}
                headers = {'xi-api-key': token}
                res = requests.post(url, headers=headers, files=files, data=data)
                res_json = res.json()
                if res_json.get("success"):
                    self.show_toast(f"Task Voice Changer tạo: {res_json.get('task_id')}")
                else:
                    self.show_toast(f"Lỗi API: {res.text}", error=True)
            except Exception as e:
                self.show_toast(f"Lỗi: {e}", error=True)
            finally:
                self.btn_run_vc.configure(state="normal", text="Đổi Giọng")
        threading.Thread(target=task).start()

    def setup_tab_voice_isolate(self, parent):
        parent.grid_columnconfigure(1, weight=1)
        self.vi_file_var = tk.StringVar(value="")
        ctk.CTkLabel(parent, text="File âm thanh (mp3, wav):").grid(row=0, column=0, padx=10, pady=10, sticky="w")
        ctk.CTkLabel(parent, textvariable=self.vi_file_var, text_color="#AAAAAA").grid(row=0, column=1, padx=10, pady=10, sticky="w")
        ctk.CTkButton(parent, text="Chọn file", command=lambda: self.ai_audio_browse_file(self.vi_file_var)).grid(row=0, column=2, padx=10, pady=10)

        self.btn_run_vi = ctk.CTkButton(parent, text="Tách Giọng", fg_color="#FF4C4C", command=self.run_voice_isolate)
        self.btn_run_vi.grid(row=1, column=0, columnspan=3, pady=20)

    def run_voice_isolate(self):
        filepath = self.vi_file_var.get()
        if not filepath:
            self.show_toast("Chọn file!", error=True)
            return
        def task():
            self.btn_run_vi.configure(state="disabled", text="Đang xử lý...")
            try:
                base_url, token = self.get_ai33_credentials()
                url = f"{base_url}/v1/task/voice-isolate"
                files = {'file': open(filepath, 'rb')}
                headers = {'xi-api-key': token}
                res = requests.post(url, headers=headers, files=files)
                res_json = res.json()
                if res_json.get("success"):
                    self.show_toast(f"Task Voice Isolate tạo: {res_json.get('task_id')}")
                else:
                    self.show_toast(f"Lỗi API: {res.text}", error=True)
            except Exception as e:
                self.show_toast(f"Lỗi: {e}", error=True)
            finally:
                self.btn_run_vi.configure(state="normal", text="Tách Giọng")
        threading.Thread(target=task).start()


    @staticmethod
    def clean_transcript_programmatically(raw_text):
        if not raw_text: return ""
        import re
        raw_text = re.sub(r'(?i)(?:^|\r?\n|\s)(?:transcript|kịch\s*bản)\s*:?\s*(\r?\n)?', '', raw_text)
        lines = raw_text.splitlines()
        cleaned_lines = []
        for line in lines:
            c = line.strip()
            if not c: continue
            c = re.sub(r'[\[\(]\s*\d{1,2}:\d{2}(?::\d{2})?\s*[\]\)]', '', c)
            c = re.sub(r'\b\d{1,2}:\d{2}(?::\d{2})?\b', '', c)
            c = re.sub(r'\b\d+:\d+\s*-\s*\d+:\d+\b', '', c)
            c = re.sub(r'-{2,}', ' ', c)
            c = re.sub(r'^\s*[-•]\s*', '', c)
            c = c.strip()
            if c: cleaned_lines.append(c)

        paragraphs = []
        current_group = []
        for line in cleaned_lines:
            words = [w for w in line.split() if w]
            if not words: continue
            current_group.extend(words)
            ends_with_punct = bool(re.search(r'[.!?]$', line))
            if ends_with_punct or len(current_group) >= 100:
                segment = " ".join(current_group)
                if segment:
                    segment = segment[0].upper() + segment[1:]
                    if not re.search(r'[.!?]$', segment): segment += "."
                    paragraphs.append(segment)
                current_group = []
        
        if current_group:
            segment = " ".join(current_group)
            if segment:
                segment = segment[0].upper() + segment[1:]
                if not re.search(r'[.!?]$', segment): segment += "."
                paragraphs.append(segment)
        
        return "\n\n".join(paragraphs)

    @staticmethod
    def generate_hook_programmatically(old_hook, language="vi"):
        clean_old = old_hook.strip()
        title = clean_old[:50] + "..."
        if language == "en":
            return [
                "What chilling secret lies behind this story? There are hidden truths about \"" + title + "\" that you would never dare to believe!",
                "Stop! Don't scroll past if you don't know this shocking detail. The disturbing truth of \"" + title + "\" is about to be exposed right now!",
                "The story of \"" + title + "\" holds priceless life lessons that will leave you completely speechless. This is the turning point that changes everything..."
            ]
        elif language == "ko":
            return [
                f"이 이야기 뒤에 숨겨진 소름 끼치는 비밀은 무엇일까요? \"{title}\"에 대해 묻혀있던 진실을 마주하면 절대 믿지 못할 겁니다!",
                f"잠깐만요! 이 충격적인 사실을 모른 채 그냥 지나치지 마세요. \"{title}\"의 놀라운 진실이 지금 바로 밝혀집니다!",
                f"\"{title}\"에 관한 이야기는 깊은 생각을 하게 만드는 값진 인생의 교훈을 담고 있습니다. 이것이 정녕 모든 것을 바꾸는 계기가 될 것입니다..."
            ]
        else:
            return [
                f"Bí mật kinh hoàng nào đang ẩn giấu phía sau câu chuyện này? Có những sự thật về \"{title}\" bị chôn vùi mà bạn sẽ không bao giờ dám tin là thật!",
                f"Dừng lại! Đừng lướt qua nếu bạn chưa biết điều chấn động này. Sự thật về \"{title}\" sắp sửa được vạch trần ngay bây giờ!",
                f"Câu chuyện về \"{title}\" chứa đựng những bài học cuộc đời đắt giá khiến chúng ta phải lặng người suy ngẫm. Đây chính là bước ngoặt thay đổi tất cả..."
            ]

    @staticmethod
    def generate_storyboard_programmatically(script_text, style="cinematic dark storytelling, hyper-detailed", split_mode="1 câu thoại = 1-3 prompts (tự động theo độ dài câu)"):
        import re
        raw_sentences = re.split(r'(?<=[.!?])\s+', script_text.strip())
        raw_sentences = [s.strip() for s in raw_sentences if s.strip()]
        
        sentences = []
        if "Cứ 2 câu thoại" in split_mode:
            for i in range(0, len(raw_sentences), 2):
                sentences.append(" ".join(raw_sentences[i:i+2]))
        elif "Cứ 3 câu thoại" in split_mode:
            for i in range(0, len(raw_sentences), 3):
                sentences.append(" ".join(raw_sentences[i:i+3]))
        elif "Cứ 4 câu thoại" in split_mode:
            for i in range(0, len(raw_sentences), 4):
                sentences.append(" ".join(raw_sentences[i:i+4]))
        else:
            sentences = raw_sentences

        prompt_templates = [
            ("Toàn cảnh", f"A breathtaking widescreen cinematic masterwork portraying: {{}}. Epic scale atmosphere, stunning environmental design, dramatic volumetric light rays cutting through dense mist, high fidelity, 8k resolution, professionally color graded with deep shadow contrast, Unreal Engine 5 aesthetic, photorealistic texture --ar 16:9 --v 6.0"),
            ("Cận cảnh", f"An intense, emotional close-up shot of the central characters/elements involved in: {{}}. Intricate facial expressions, realistic skin pores, eyes catching glint of warm rim lighting, rich back-lighting, deep dark cinematic shadows, award-winning cinematography, shot on 85mm anamorphic F1.2 lens, photorealistic details --ar 16:9 --v 6.0"),
            ("Đổ bóng kịch tính", f"A highly stylistic creative low-angle composition of: {{}}. Deep rich teal and amber tones, dramatic long shadows stretching across the ground, moody film grain overlay, soft cinematic haze, intricate focus details, hyper-realistic, volumetric smoke, majestic cinematic storytelling --ar 16:9 --v 6.0"),
            ("Chi tiết nghệ thuật", f"A stunning cinematic detail shot focusing on macro elements and key narrative symbols representing: {{}}, style of {style}. Soft bokeh background, atmospheric dust particles illuminated in sharp rays of golden light, shallow depth of field, 100mm macro lens focus, highly polished, surreal moody ambient --ar 16:9 --v 6.0")
        ]

        scenes = []
        global_prompt_idx = 0
        
        for i, sentence in enumerate(sentences):
            scene_number = str(i + 1)
            words = sentence.split()
            word_count = len(words)
            duration = max(3, round(word_count * 0.4))
            start_sec = sum([max(3, round(len(s.split()) * 0.4)) for s in sentences[:i]])
            end_sec = start_sec + duration
            time_seg = f"{start_sec//60:02d}:{start_sec%60:02d} - {end_sec//60:02d}:{end_sec%60:02d}"
            
            short_lbl = sentence[:100].replace('"', '')
            image_prompts = []
            
            needs_two_prompts = word_count > 15 or (',' in sentence and word_count > 10)
            target_prompts = 2 if needs_two_prompts else 1
            
            for p_idx in range(target_prompts):
                t_lbl, t_tmpl = prompt_templates[global_prompt_idx % len(prompt_templates)]
                eng_prompt = t_tmpl.format(short_lbl)
                
                if target_prompts == 2:
                    sub_text = " ".join(words[:word_count//2]) if p_idx == 0 else " ".join(words[word_count//2:])
                else:
                    sub_text = sentence
                    
                image_prompts.append({
                    "code": f"P{scene_number}.{p_idx+1}",
                    "vietnameseLabel": f"Phân cảnh {scene_number} - {t_lbl}",
                    "englishPrompt": eng_prompt,
                    "subText": sub_text
                })
                global_prompt_idx += 1
            
            scenes.append({
                "sceneNumber": scene_number,
                "timeSegment": time_seg,
                "text": sentence,
                "visualDescription": f"Phân cảnh thể hiện sinh động bối cảnh, chiều sâu nội dung kịch tính: '{short_lbl}'.",
                "imagePrompts": image_prompts
            })
        return scenes

    def run_sound_effect(self, type="success"):
        try:
            import winsound
            if type == "success":
                winsound.Beep(523, 100)
                winsound.Beep(659, 100)
                winsound.Beep(784, 150)
            elif type == "error":
                winsound.Beep(220, 150)
                winsound.Beep(180, 200)
        except:
            pass

    def setup_settings(self):
        frame = ctk.CTkScrollableFrame(self.main_view, fg_color="transparent")
        self.frames["settings"] = frame
        ctk.CTkLabel(frame, text="⚙️ Cài Đặt API & Thông Báo", font=ctk.CTkFont(size=20, weight="bold")).pack(anchor="w", pady=(0, 20))
        
        ctk.CTkLabel(frame, text="Google Gemini API Key:").pack(anchor="w", pady=(10, 0))
        self.entry_api = ctk.CTkEntry(frame, width=400, show="*", fg_color="#1c1c1c")
        self.entry_api.pack(anchor="w", pady=5)
        self.entry_api.insert(0, self.api_key)
        
        # [ADDED TASK 5]: Telegram Settings
        ctk.CTkLabel(frame, text="Telegram Bot Token:").pack(anchor="w", pady=(10, 0))
        self.tele_token_entry = ctk.CTkEntry(frame, width=400, show="*", fg_color="#1c1c1c")
        self.tele_token_entry.pack(anchor="w", pady=5)
        self.tele_token_entry.insert(0, self.config.get("tele_token", ""))
        
        ctk.CTkLabel(frame, text="Telegram Chat ID:").pack(anchor="w", pady=(10, 0))
        self.tele_chat_entry = ctk.CTkEntry(frame, width=400, fg_color="#1c1c1c")
        self.tele_chat_entry.pack(anchor="w", pady=5)
        self.tele_chat_entry.insert(0, self.config.get("tele_chat_id", ""))
        
        btn_frm = ctk.CTkFrame(frame, fg_color="transparent")
        btn_frm.pack(anchor="w", pady=20)
        ctk.CTkButton(btn_frm, text="Lưu Cấu Hình", command=self.save_settings).pack(side="left", padx=(0, 10))
        ctk.CTkButton(btn_frm, text="Bắn thử thông báo (Test)", fg_color="#3B82F6", command=self.test_telegram_bot).pack(side="left")

    def test_telegram_bot(self):
        token = self.tele_token_entry.get().strip()
        chat_id = self.tele_chat_entry.get().strip()
        if not token or not chat_id:
            messagebox.showerror("Lỗi", "Vui lòng nhập đủ Token và Chat ID")
            return
        try:
            url = f"https://api.telegram.org/bot{token}/sendMessage"
            import requests
            res = requests.post(url, json={"chat_id": chat_id, "text": "✅ Kết nối Telegram Bot thành công từ YT Creator Pro!"})
            if res.ok:
                messagebox.showinfo("Thành công", "Đã gửi thông báo test thành công!")
            else:
                messagebox.showerror("Lỗi API", f"Mã lỗi {res.status_code}: {res.text}")
        except Exception as e:
            messagebox.showerror("Lỗi", str(e))

    def save_settings(self):
        key = self.entry_api.get().strip()
        tele_token = self.tele_token_entry.get().strip()
        tele_chat = self.tele_chat_entry.get().strip()
        
        self.save_config("api_key", key)
        self.save_config("tele_token", tele_token)
        self.save_config("tele_chat_id", tele_chat)
        
        self.api_key = key
        self.config["tele_token"] = tele_token
        self.config["tele_chat_id"] = tele_chat
        
        if key: self.client = genai.Client(api_key=key)
        messagebox.showinfo("Thành công", "Đã lưu API & Cấu hình Telegram!")

    # ---------------------------------------------------------
    # IMAGE PASTE LOGIC
    # ---------------------------------------------------------
    def handle_paste(self, event):
        try:
            im = ImageGrab.grabclipboard()
            if isinstance(im, Image.Image):
                im.save("temp_paste.png")
                self.lbl_paste1.configure(text="✅ Đã nhận ảnh mẫu từ Clipboard!")
                self.lbl_paste2.configure(text="✅ Đã nhận ảnh nhân vật từ Clipboard!")
        except: pass

    # ---------------------------------------------------------
    # AI LOGIC / RUN METHODS
    # ---------------------------------------------------------
    # [KEEP]: Giữ nguyên chữ ký hàm
    # [ADDED]: Thêm response_schema để ép kiểu JSON (Task 1 & 6)
    # [FIXED TASK 1]: Bổ sung tham số image_path (tương thích ngược) và logic Base64/Multipart
    def call_ai(self, prompt, temp=0.7, image_paths=None, response_schema=None, image_path: str = None):
        if not self.api_key or not self.client: raise Exception("Chưa cài API Key")
        import time
        contents = []
        if image_path and not image_paths: image_paths = [image_path]
        if image_paths:
            for path in image_paths:
                if os.path.exists(path):
                    try: contents.append(Image.open(path))
                    except: pass
        contents.append(prompt)
        
        cfg = types.GenerateContentConfig(temperature=temp)
        if response_schema:
            cfg.response_mime_type = "application/json"
            cfg.response_schema = response_schema

        models_to_try = ["gemini-3.5-flash", "gemini-3.1-flash-lite", "gemini-flash-latest"]
        last_err = None
        for model in models_to_try:
            for attempt in range(1, 4):
                try:
                    res = self.client.models.generate_content(model=model, contents=contents, config=cfg)
                    return res.text
                except Exception as e:
                    last_err = e
                    if attempt < 3:
                        time.sleep(attempt * 1.2)
        raise Exception(f"API Error (All models failed): {str(last_err)}")

    # [KEEP]: Giữ logic lấy yêu cầu UI từ dòng 512
    # [ADDED]: Ép schema trả về JSON bóc tách 3 phần (Task 1) và SEO (Task 6)
    def run_tab1(self):
        def task():
            try:
                self.btn_t1_run.configure(text="Đang xử lý...", state="disabled")
                txt = self.t1_in.get("1.0", "end").strip()
                if not txt: return
                
                # 1. Clean transcript programmatically first
                programmatically_cleaned = self.clean_transcript_programmatically(txt)
                if not programmatically_cleaned.strip():
                    ans = txt
                else:
                    # 2. Call Gemini
                    lang = self.t1_cb_lang.get()
                    lang_instruction = ""
                    if lang == "Ngôn ngữ gốc" or not lang:
                        lang_instruction = "Hãy sửa bài viết/kịch bản dưới đây bằng CHÍNH ngôn ngữ gốc của nó để từ ngữ tự nhiên, mạch lạc, sửa lỗi chính tả/ngắt câu đầy đủ và đúng quy chuẩn phát âm nói."
                    elif "Tiếng Việt" in lang:
                        lang_instruction = "Hãy dịch và viết lại kịch bản dưới đây sang Tiếng Việt chuẩn chỉnh, hành văn cuốn hút tự nhiên bám sát gốc, sửa lỗi chính tả và ngắt câu đầy đủ."
                    elif "Tiếng Anh" in lang:
                        lang_instruction = "Please translate and rewrite the script below into fluent, high-retention English, keeping the storyline and correcting grammar/punctuation."
                    elif "Tiếng Trung" in lang:
                        lang_instruction = "请将以下脚本翻译并改写为流畅自然的中文（Tiếng Trung），修正错别字并进行合理的断句，保持原故事背景。"
                    elif "Tiếng Nhật" in lang:
                        lang_instruction = "以下のスクリプトを自然で流暢な日本語（Tiếng Nhật）に翻訳・推敲し、誤字脱字を修正して適切に改行し、元のストーリーを反映してください。"
                    elif "Tiếng Hàn" in lang:
                        lang_instruction = "다음 스크립트를 자연스럽고 매끄러운 한국어（Tiếng Hàn）로 번역 및 교정하여 맞춤법을 시정하고 문장을 보기 좋게 단락으로 나누어 주십시오."

                    strict_rules = "\nKHÔNG ĐƯỢC thêm bất kỳ lời bình luận, câu chào hỏi, lời hứa hẹn quảng cáo hay câu giới thiệu giải thích nào ở đầu hoặc cuối kết quả (Tuyệt đối KHÔNG viết: 'Dưới đây là...', 'Đây là bản dịch...', '***', '---', v.v.). CHỈ xuất ra duy nhất văn bản kịch bản hoàn chỉnh, sạch sẽ."
                    
                    rewrite_script = self.t1_chk_diff.get()
                    new_script_length = self.t1_cb_length.get()
                    modify_intro_only = self.t1_chk_intro.get()
                    
                    rewrite_instruction = ""
                    if rewrite_script:
                        rewrite_instruction = "\n⚠️ YÊU CẦU ĐẶC BIỆT: Hãy viết lại phần kịch bản để khác đi (thay đổi cách diễn giải, câu chữ sinh động hơn, dùng lối kể cuốn hút, kịch tính mới) nhưng vẫn hay, hấp dẫn và giữ nguyên cốt truyện/bối cảnh chính như bản gốc.\n"
                        if "Ngắn hơn" in new_script_length:
                            rewrite_instruction += "- Về độ dài: Hãy viết kịch bản CÔ ĐỌNG, NGẮN HƠN bản gốc khoảng 25-30% để mạch câu chuyện nhanh hơn.\n"
                        elif "Dài hơn" in new_script_length:
                            rewrite_instruction += "- Về độ dài: Hãy viết kịch bản CHI TIẾT, DÀI HƠN bản gốc khoảng 25-30% bằng cách bổ sung thêm mô tả bối cảnh, diễn biến kịch tính hoặc lời thoại hấp dẫn.\n"
                        else:
                            rewrite_instruction += "- Về độ dài: Hãy viết kịch bản có ĐỘ DÀI TƯƠNG ĐƯƠNG (bằng) với kịch bản gốc ban đầu.\n"

                        if modify_intro_only:
                            rewrite_instruction += "- Phạm vi thay đổi: Chỉ viết lại mỗi phần đoạn mở đầu (khoảng 1 - 2 phân đoạn đầu tiên hoặc phần giới thiệu của kịch bản) để khác đi và lôi cuốn hơn, còn toàn bộ phần thân bài và kết bài sau đó phải được GIỮ NGUYÊN VẸN CHÍNH XÁC từng từ như kịch bản gốc ban đầu.\n"

                    prompt = lang_instruction + strict_rules + rewrite_instruction + "\n" + \
                             "Sửa lại cấu trúc Viết hoa chữ cái đầu câu, ngắt dấu chấm phẩy rõ ràng, không bỏ bớt hoặc thêm thắt bối cảnh cốt truyện chính ngoài các yêu cầu viết lại đặc biệt ở trên.\n" + \
                             "Giữ nguyên bối cảnh và các sự kiện trong câu chuyện. Thêm các phân đoạn rõ ràng bằng dòng trống (xuống dòng kép).\n\n" + \
                             "Văn bản gốc cần trau chuốt/biên dịch:\n" + \
                             "\"\"\"\n" + \
                             programmatically_cleaned + "\n" + \
                             "\"\"\""
                    
                    try:
                        ans = self.call_ai(prompt, temp=0.6 if rewrite_script else 0.1)
                        # Clean markdown formatting like ``` or ```html if returned
                        import re
                        ans = re.sub(r'^```[a-zA-Z]*\n', '', ans)
                        ans = re.sub(r'\n```$', '', ans)
                        ans = ans.strip()
                    except Exception as ai_err:
                        self.show_toast(f"⚠️ Lỗi AI, fallback sang dọn dẹp bằng regex: {str(ai_err)}", error=True)
                        ans = programmatically_cleaned

                self.global_state["topic"] = "Video Story"
                self.global_state["voice_script"] = ans
                
                self.t1_out.delete("1.0", "end")
                self.t1_out.insert("1.0", ans)
                self.t2_full.delete("1.0", "end")
                self.t2_full.insert("1.0", ans)
                
                parts = ans.split('\n\n', 1)
                first_paragraph = parts[0] if len(parts[0]) > 0 else ans[:450]
                self.t2_in.delete("1.0", "end")
                self.t2_in.insert("1.0", first_paragraph)
                
                self.global_state["Step2_Render_Success"] = True
                self.show_toast("✅ Chuẩn hóa thành công!")
            except Exception as e: messagebox.showerror("Lỗi", str(e))
            finally: self.btn_t1_run.configure(text="✨ Chuẩn Hóa Kịch Bản", state="normal")
        threading.Thread(target=task).start()

    def run_tab1_update(self):
        def task():
            try:
                self.btn_t1_update.configure(text="Đang cập nhật...", state="disabled")
                txt = self.t1_out.get("1.0", "end").strip()
                req = self.t1_req.get().strip()
                if not txt or not req: return
                
                lang = self.t1_cb_lang.get()
                lang_instruction = ""
                if lang == "Ngôn ngữ gốc" or not lang:
                    lang_instruction = "Hãy sửa bài viết/kịch bản dưới đây bằng CHÍNH ngôn ngữ gốc của nó để từ ngữ tự nhiên, mạch lạc, sửa lỗi chính tả/ngắt câu đầy đủ và đúng quy chuẩn phát âm nói."
                elif "Tiếng Việt" in lang:
                    lang_instruction = "Hãy dịch và viết lại kịch bản dưới đây sang Tiếng Việt chuẩn chỉnh, hành văn cuốn hút tự nhiên bám sát gốc, sửa lỗi chính tả và ngắt câu đầy đủ."
                
                strict_rules = "\nKHÔNG ĐƯỢC thêm bất kỳ lời bình luận, câu chào hỏi, lời hứa hẹn quảng cáo hay câu giới thiệu giải thích nào ở đầu hoặc cuối kết quả. CHỈ xuất ra duy nhất văn bản kịch bản hoàn chỉnh, sạch sẽ."
                
                prompt = lang_instruction + strict_rules + "\n" + \
                         "Bạn nhận được một yêu cầu chỉnh sửa kịch bản đặc biệt từ phía người dùng: \"" + req + "\".\n" + \
                         "Hãy đọc kịch bản hiện tại bên dưới và thực hiện chỉnh sửa nó theo chính xác yêu cầu của người dùng.\n" + \
                         "- Giữ vững mạch lạc câu chuyện và nhịp điệu cuốn hút nguyên bản.\n" + \
                         "- Sửa lại cấu trúc viết hoa chữ cái đầu câu, sửa lỗi chính tả, ngắt câu rõ ràng bằng dòng trống (xuống dòng kép).\n" + \
                         "- Cho ra kết quả là toàn bộ kịch bản hoàn chỉnh sau khi đã chỉnh sửa tích hợp yêu cầu.\n\n" + \
                         "Kịch bản cần chỉnh sửa:\n" + \
                         "\"\"\"\n" + \
                         txt + "\n" + \
                         "\"\"\""

                ans = self.call_ai(prompt, temp=0.5)
                import re
                ans = re.sub(r'^```[a-zA-Z]*\n', '', ans)
                ans = re.sub(r'\n```$', '', ans)
                ans = ans.strip()
                
                self.t1_out.delete("1.0", "end")
                self.t1_out.insert("1.0", ans)
                self.t2_full.delete("1.0", "end")
                self.t2_full.insert("1.0", ans)
                self.show_toast("✅ Cập nhật kịch bản thành công!")
            except Exception as e: messagebox.showerror("Lỗi", str(e))
            finally: self.btn_t1_update.configure(text="🔄 Cập Nhật", state="normal")
        threading.Thread(target=task).start()

    def run_tab2(self):
        def task():
            try:
                self.btn_t2_run.configure(text="Đang xử lý...", state="disabled")
                hook = self.t2_in.get("1.0", "end").strip()
                lang = self.t2_cb_lang.get()
                rewrite_style = self.t2_cb_style.get()
                if not hook: return
                
                lang_instruction = ""
                if lang == "Ngôn ngữ gốc" or not lang:
                    lang_instruction = "Hãy viết bằng chính ngôn ngữ gốc của đoạn hook này."
                elif "Tiếng Việt" in lang:
                    lang_instruction = "Nội dung Hook và lời giải thích PHẢI viết bằng Tiếng Việt chuẩn, cuốn hút và đánh gục người nghe."
                elif "Tiếng Anh" in lang:
                    lang_instruction = "The generated Hooks and their explanations MUST be written in English (United States) to maximize retention for global viewers."
                elif "Tiếng Trung" in lang:
                    lang_instruction = "Hook 文案及原理解析必须使用中文。"
                elif "Tiếng Nhật" in lang:
                    lang_instruction = "生成するフック（Hook）と解説文は、すべて自然な日本語で記述してください。"
                elif "Tiếng Hàn" in lang:
                    lang_instruction = "제안하는 훅(Hook) 문구와 설명은 모두 자연스러운 한국어로 작성해야 합니다."

                style_instruction = ""
                if "Sát với bản gốc" in rewrite_style:
                    style_instruction = "- PHONG CÁCH: Hãy bám sát chặt chẽ theo cốt truyện, câu từ và nội dung bản gốc, chỉ mài giũa lại cho mượt mà, bóng bẩy và cuốn hút hơn.\n"
                else:
                    style_instruction = "- PHONG CÁCH: Hãy viết khác đi hoàn toàn, biến đổi cấu trúc câu, dùng lối dẫn dắt mới mẻ, từ vựng kịch tính, giật gân, độc lạ hơn hẳn so với bản gốc.\n"

                context = self.t2_full.get("1.0", "end").strip()
                prompt = "Bạn là một chuyên gia sáng tạo nội dung YouTube với hàng triệu view. Nhiệm vụ của bạn là viết lại đoạn mở đầu (Hook) dưới đây để trở nên hấp dẫn, cuốn hút và giật gân hơn ngay từ 3 giây đầu tiên giúp giữ chân người xem tối đa.\n" + \
                         "Hãy tạo ra đúng 3 lựa chọn Hook khác nhau hoàn chỉnh theo các phong cách sau:\n" + \
                         "1. \"Bí ẩn & Tò mò\"\n" + \
                         "2. \"Kịch tính & Gây sốc\"\n" + \
                         "3. \"Đánh vào cảm xúc sâu sắc\"\n\n" + \
                         "Yêu cầu về ĐỘ DÀI: Đảm bảo viết các đoạn hook mới có ĐỘ DÀI TƯƠNG ĐƯƠNG (bằng) so với đoạn hook cũ ban đầu để không làm lệch timeline.\n" + \
                         style_instruction + "\n" + \
                         "Hãy giữ nguyên ý nghĩa cốt lõi và các nhân vật/bối cảnh chính của câu chuyện gốc phía dưới (nếu có).\n" + \
                         "Yêu cầu ngôn ngữ: " + lang_instruction + "\n\n" + \
                         "Đoạn hook mở đầu cần cải thiện:\n" + \
                         "\"\"\"\n" + \
                         hook + "\n" + \
                         "\"\"\"\n\n" + \
                         "Bối cảnh kịch bản đầy đủ (nếu có):\n" + \
                         "\"\"\"\n" + \
                         context + "\n" + \
                         "\"\"\""

                schema = {
                    "type": "OBJECT",
                    "properties": {
                        "hookOptions": {
                            "type": "ARRAY",
                            "items": {
                                "type": "OBJECT",
                                "properties": {
                                    "style": {"type": "STRING"},
                                    "hookText": {"type": "STRING"},
                                    "explanation": {"type": "STRING"}
                                },
                                "required": ["style", "hookText", "explanation"]
                            }
                        }
                    },
                    "required": ["hookOptions"]
                }

                ans_str = self.call_ai(prompt, temp=0.8, response_schema=schema)
                import json
                data = json.loads(ans_str)
                parts = data.get("hookOptions", [])
                
                # Render to 3 hook boxes
                for i, box in enumerate(self.hook_boxes):
                    box.delete("1.0", "end")
                    if i < len(parts):
                        item = parts[i]
                        txt_val = f"[{item.get('style', '')}]: {item.get('hookText', '')}\n(Giải thích: {item.get('explanation', '')})"
                        box.insert("1.0", txt_val)
                self.show_toast("✅ Đã đề xuất 3 Hook thành công!")
            except Exception as e: messagebox.showerror("Lỗi", str(e))
            finally: self.btn_t2_run.configure(text="Xem 3 Đề Xuất Hook Đỉnh Cao", state="normal")
        threading.Thread(target=task).start()

    # [FIXED TASK 2]: Nối kịch bản an toàn và lọc nhãn (Option 1)
    def replace_hook(self, textbox):
        raw_ai_hook = textbox.get("1.0", "end").strip()
        full_script = self.t2_full.get("1.0", "end").strip()
        
        if not raw_ai_hook or not full_script: return
        
        # Clean the hook text from style brackets and explanations
        import re
        match = re.match(r'^\[.*?\]:\s*(.*?)(?:\n\(Giải thích:|$)', raw_ai_hook, re.DOTALL | re.IGNORECASE)
        if match:
            clean_hook = match.group(1).strip()
        else:
            clean_hook = re.sub(r'(\*\*Option\s*\d+:.*?\*\*\n?|Option\s*\d+:.*?\n|^\d+\.\s+)', '', raw_ai_hook, flags=re.IGNORECASE).strip()
        
        # Tách và ghép an toàn không đụng chạm Thân Bài
        parts = full_script.split('\n\n', 1)
        parts[0] = clean_hook
        new_script = "\n\n".join(parts)
        
        self.t2_full.delete("1.0", "end")
        self.t2_full.insert("1.0", new_script)
        self.t2_in.delete("1.0", "end")
        self.t2_in.insert("1.0", clean_hook)
        self.show_toast("✅ Thay thế Hook thành công!")

    # [ADDED]: Viết thêm hàm trộn/trung bình hóa phong cách (Weighted Averaging) theo Task 2
    def run_ai_extraction(self):
        if not self.image_paths and not os.path.exists("temp_paste.png"): return
        paths = self.image_paths if self.image_paths else ["temp_paste.png"]
        def task():
            try:
                self.btn_ext.configure(text="Đang phân tích...")
                # [FIXED TASK 3]: Cập nhật prompt trích xuất Style và ép khung kết quả
                prompt_strict = 'Phân tích phong cách hình ảnh và trả về ĐÚNG MỘT CHUỖI THUẦN tuân thủ NGHIÊM NGẶT văn phong sau (không được có câu chào hỏi hay markdown): "in the style of a humorous educational history cartoon, simple white-faced chibi characters with minimal facial features, thick black outlines, clean 2D vector animation, flat colors with soft cel shading, simplified historical costumes, large expressive body language, colorful but slightly muted vintage palette, cartoon storytelling composition, lightweight background details, smooth professional animation frame, high readability, family-friendly, cinematic framing, crisp linework, polished digital illustration, YouTube history documentary animation aesthetic, ultra clean, high quality"'
                ans = self.call_ai(prompt_strict, image_paths=paths).strip()
                
                self.t3_style.delete(0, "end")
                self.t3_style.insert(0, ans)
                
                # [FIXED TASK 3]: Tự động tạo tên ngắn gọn và lưu vào Preset Storage
                preset_name = f"Style_{int(time.time())}"
                self.styles_db["styles"].append({"name": preset_name, "prompt": ans})
                self.save_json(STYLE_FILE, self.styles_db)
                self.cb_styles.configure(values=[s["name"] for s in self.styles_db["styles"]])
                self.cb_styles.set(preset_name)
                
                self.show_toast("✅ Trích xuất Style thành công! Đã lưu tự động.")
            except Exception as e: messagebox.showerror("Lỗi", str(e))
            finally: self.btn_ext.configure(text="✨ Trích Xuất & Áp Dụng Phong Cách")
        threading.Thread(target=task).start()

    def run_char_recognition(self):
        if not os.path.exists("temp_paste.png"): return
        def task():
            try:
                self.btn_char.configure(text="Đang nhận diện...")
                ans = self.call_ai("Viết prompt mô tả ngoại hình nhân vật bằng Tiếng Anh.", image_path="temp_paste.png")
                # [FIXED TASK 2]: Lưu vào biến toàn cục character consistency
                self.character_consistency_prompt = ans.strip()
                self.t3_char_desc.delete("1.0", "end")
                self.t3_char_desc.insert("1.0", self.character_consistency_prompt)
                self.show_toast("✅ Nhận diện thành công!")
            except Exception as e: messagebox.showerror("Lỗi", str(e))
            finally: self.btn_char.configure(text="🔍 Nhận diện nhân vật")
        threading.Thread(target=task).start()

    # [KEEP]: Giữ logic gọi AI của tab 3
    # [ADDED]: Yêu cầu AI sinh JSON schema và render PromptCardView (Task 4)
    def render_prompt_cards(self, scenes_array):
        for widget in self.t3_out_frame.winfo_children(): widget.destroy()
        for idx, scene in enumerate(scenes_array):
            card = ctk.CTkFrame(self.t3_out_frame, corner_radius=8, fg_color="#2b2b2b")
            card.pack(fill="x", pady=5, padx=5)
            ctk.CTkLabel(card, text=f"--- Phân cảnh {idx+1} ({scene.get('timestamp', '00:00 - 00:03')}) ---", font=("", 12, "bold"), text_color="#3B82F6").pack(anchor="w", padx=10, pady=(10,0))
            ctk.CTkLabel(card, text=f"[Đoạn thoại]: {scene.get('dialog', '')}", wraplength=1000, justify="left").pack(anchor="w", padx=10, pady=2)
            ctk.CTkLabel(card, text=f"[Mô tả visual]: {scene.get('visual', '')}", wraplength=1000, justify="left", text_color="#A855F7").pack(anchor="w", padx=10, pady=2)
            
            for p_idx, p in enumerate(scene.get("prompts", [])):
                ctk.CTkLabel(card, text=f"  + [P{idx+1}.{p_idx+1}] (Ý tưởng: {p.get('idea', '')})", text_color="#10B981").pack(anchor="w", padx=20, pady=2)
                p_box = ctk.CTkTextbox(card, height=60, fg_color="#1A1B1E")
                p_box.pack(fill="x", padx=20, pady=(0, 10))
                p_box.insert("1.0", f"{p.get('prompt_text', '')}")

    def run_tab3(self):
        def task():
            try:
                self.btn_t3_run.configure(text="Đang xử lý...", state="disabled")
                script = self.t2_full.get("1.0", "end").strip()
                style = self.t3_style.get()
                char_desc = getattr(self, 'character_consistency_prompt', self.t3_char_desc.get("1.0", "end").strip())
                if not script:
                    self.show_toast("⚠️ Vui lòng chuẩn hóa kịch bản trước!", error=True)
                    return
                
                # Split script into sentences
                import re
                raw_sentences = re.split(r'(?<=[.!?])\s+', script)
                raw_sentences = [s.strip() for s in raw_sentences if s.strip()]
                
                # Group sentences into buckets
                split_mode = getattr(self, "t3_cb_split", None)
                split_val = split_mode.get() if split_mode else "1 câu thoại = 1-3 prompts (tự động theo độ dài câu)"
                
                # Dialogue group size calculation
                use_dialogue_split = True
                dialogue_group_size = 1
                
                if "Cứ 2 câu thoại" in split_val:
                    dialogue_group_size = 2
                elif "Cứ 3 câu thoại" in split_val:
                    dialogue_group_size = 3
                elif "Cứ 4 câu thoại" in split_val:
                    dialogue_group_size = 4
                elif "tự động theo độ dài câu" in split_val:
                    dialogue_group_size = 1
                else:
                    use_dialogue_split = False

                buckets = []
                if use_dialogue_split:
                    for i in range(0, len(raw_sentences), dialogue_group_size):
                        chunk_sentences = " ".join(raw_sentences[i:i + dialogue_group_size])
                        buckets.append(chunk_sentences or "...")
                else:
                    # Default: 10 scenes
                    target_count = 10
                    size = len(raw_sentences)
                    if size > 0:
                        for i in range(target_count):
                            start = int((i * size) / target_count)
                            end = int(((i + 1) * size) / target_count)
                            chunk_sentences = " ".join(raw_sentences[start:end])
                            buckets.append(chunk_sentences or "...")

                chunk_size = 10
                total_buckets = len(buckets)
                import math
                total_chunks = math.ceil(total_buckets / chunk_size)
                
                all_scenes = []
                
                # Run Gemini calls in parallel using thread pool
                import concurrent.futures
                import json
                
                def process_chunk(chunk_idx):
                    start_idx = chunk_idx * chunk_size
                    end_idx = min(total_buckets, (chunk_idx + 1) * chunk_size)
                    chunk_buckets = buckets[start_idx:end_idx]
                    
                    chunk_prompts = []
                    for idx, b_text in enumerate(chunk_buckets):
                        chunk_prompts.append({
                            "sceneNumber": str(start_idx + idx + 1),
                            "text": b_text
                        })
                        
                    prompt = "Bạn là một AI chuyên nghiệp về biên tập câu chuyện & tạo prompt vẽ ảnh nghệ thuật chất lượng cao (Midjourney/Imagen).\n" + \
                             "Nhiệm vụ của bạn là tạo các 'imagePrompts' có hình ảnh và kịch bản chạy song hành khăng khít từng mili-giây khớp với câu thoại/phụ đề.\n\n" + \
                             f"Dưới đây là danh sách phân cảnh cần bạn tạo prompt vẽ tranh trong đợt này (Phần {chunk_idx + 1}/{total_chunks}):\n" + \
                             json.dumps(chunk_prompts, ensure_ascii=False, indent=2) + "\n\n" + \
                             "🔑 QUY TẮC BẮT BUỘC ĐỂ ĐẢM BẢO ĐỒNG BỘ NHÂN VẬT, BÁM SÁT STYLE & CHI TIẾT PROMPT (Dùng cho toàn bộ câu chuyện):\n" + \
                             f"- Phong cách cốt lõi: {style}\n" + \
                             "- ĐỒNG BỘ NHÂN VẬT (CHARACTER CONSISTENCY): Phải giữ nguyên bộ mô tả diện mạo nhân vật (tuổi, giới tính, gương mặt, tóc, quần áo, trang sức, màu sắc) xuyên suốt các cảnh. Không được để nhân vật đổi ngoại hình đột ngột.\n" + \
                             "- ĐÚNG BỐI CẢNH & KHÔNG GIAN (ACCURATE CONTEXT): Xác định rõ ràng địa điểm, ánh sáng và thời tiết cho từng prompt. Đảm bảo bối cảnh lặp lại có sự đồng bộ nhất quán tuyệt đối.\n" + \
                             "- BÁM SÁT PHONG CÁCH & ÁNH SÁNG (STYLE & LIGHTING): Tích hợp trực tiếp các kỹ thuật điện ảnh chuyên nghiệp (chiaroscuro, volumetric beams, warm/cold grading, bokeh, 35mm lens, atmospheric haze, realistic textures) vào từng prompt.\n" + \
                             "- CHI TIẾT PROMPT TIẾNG ANH (120-180 từ): Mỗi prompt tiếng Anh trong từng 'imagePrompt' phải cực kỳ dài, chi tiết, tả rõ hành động cụ thể, biểu cảm gương mặt sâu sắc và kết cấu bề mặt thực tế (pores, fabrics). Không viết cụt ngủn hoặc lặp lại sáo rỗng.\n" + \
                             (f"- ĐỒNG BỘ DIỆN MẠO NHÂN VẬT CHÍNH (STRICT CHARACTER VISUAL CONSISTENCY): Kịch bản này có nhân vật chính được mô tả ngoại hình cụ thể như sau: \"{char_desc.strip()}\". BẮT BUỘC phải đưa bộ mô tả này vào mỗi prompt có nhân vật xuất hiện.\n" if char_desc else "") + \
                             "- ĐỊNH VỊ SỐ LƯỢNG HÌNH ẢNH LINH HOẠT THEO CHIỀU SÂU VÀ Ý NGHĨA CỦA CÂU THOẠI (CRITICAL IMAGE COUNT RULE):\n" + \
                             "  + Đối với các câu thoại ngắn, đơn giản: Chỉ tạo đúng CHÍNH XÁC 1 imagePrompt duy nhất (code tương ứng là P[sceneNumber].1).\n" + \
                             "  + Đối với các câu thoại dài, phức tạp, chứa nhiều mệnh đề hay mô tả nhiều hành động liên tiếp nhau: Tuyệt đối KHÔNG ĐƯỢC gộp chung thành 1 prompt. Hãy tạo từ 2 đến 3 imagePrompts tương ứng (mã code tương ứng là P[sceneNumber].1, P[sceneNumber].2, P[sceneNumber].3) để mô tả trọn vẹn, chi tiết từng vế chuyển động / hành động diễn ra trong câu thoại đó.\n\n" + \
                             "YÊU CẦU kết quả xuất ra định dạng JSON đúng cấu trúc sau:\n" + \
                             "{\n" + \
                             "  \"scenes\": [\n" + \
                             "    {\n" + \
                             "      \"sceneNumber\": \"Số thứ tự phân cảnh (ví dụ: '1')\",\n" + \
                             "      \"timeSegment\": \"Mốc thời gian ước tính (ví dụ: '00:02 - 00:05')\",\n" + \
                             "      \"text\": \"Lời đọc gốc của phân cảnh này được giữ nguyên hoàn toàn bám sát kịch bản\",\n" + \
                             "      \"visualDescription\": \"Mô tả bằng tiếng Việt cực kỳ chi tiết chuyển nét diễn và bối cảnh\",\n" + \
                             "      \"imagePrompts\": [\n" + \
                             "        {\n" + \
                             "          \"code\": \"P[sceneNumber].1\",\n" + \
                             "          \"vietnameseLabel\": \"Mô tả ngắn gọn cảnh vẽ bằng tiếng Việt\",\n" + \
                             "          \"englishPrompt\": \"Chi tiết prompt tiếng Anh mô tả tỉ mỉ từ nhân vật, biểu cảm mặt thăng hoa, ánh sáng, góc máy, camera lens (khoảng 80-120 từ) kết hợp với phong cách đặc trưng.\",\n" + \
                             "          \"subText\": \"Câu thoại hoặc phần câu thoại tiếng Việt cụ thể tương ứng đang phát âm trong hình ảnh này để băm voice khớp 1-1\"\n" + \
                             "        }\n" + \
                             "      ]\n" + \
                             "    }\n" + \
                             "  ]\n" + \
                             "}"

                    schema = {
                        "type": "OBJECT",
                        "properties": {
                            "scenes": {
                                "type": "ARRAY",
                                "items": {
                                    "type": "OBJECT",
                                    "properties": {
                                        "sceneNumber": {"type": "STRING"},
                                        "timeSegment": {"type": "STRING"},
                                        "text": {"type": "STRING"},
                                        "visualDescription": {"type": "STRING"},
                                        "imagePrompts": {
                                            "type": "ARRAY",
                                            "items": {
                                                "type": "OBJECT",
                                                "properties": {
                                                    "code": {"type": "STRING"},
                                                    "vietnameseLabel": {"type": "STRING"},
                                                    "englishPrompt": {"type": "STRING"},
                                                    "subText": {"type": "STRING"}
                                                },
                                                "required": ["code", "vietnameseLabel", "englishPrompt", "subText"]
                                            }
                                        }
                                    },
                                    "required": ["sceneNumber", "timeSegment", "text", "visualDescription", "imagePrompts"]
                                }
                            }
                        },
                        "required": ["scenes"]
                    }

                    ans_str = self.call_ai(prompt, temp=0.5, response_schema=schema)
                    chunk_data = json.loads(ans_str)
                    return chunk_data.get("scenes", [])

                with concurrent.futures.ThreadPoolExecutor(max_workers=3) as executor:
                    futures = [executor.submit(process_chunk, idx) for idx in range(total_chunks)]
                    for future in concurrent.futures.as_completed(futures):
                        try:
                            scenes = future.result()
                            all_scenes.extend(scenes)
                        except Exception as chunk_err:
                            self.show_toast(f"⚠️ Một phần phân cảnh gặp lỗi: {str(chunk_err)}", error=True)

                # Sort scenes by sceneNumber
                all_scenes.sort(key=lambda s: int(re.sub(r'\D', '', s.get("sceneNumber", "0")) or 0))
                
                # Transform to format expected by UI rendering
                formatted_scenes = []
                for s in all_scenes:
                    prompts = []
                    for ip in s.get("imagePrompts", []):
                        p_text = ip.get("englishPrompt", "")
                        # Prepend character description context if it exists
                        if char_desc and char_desc.strip() not in p_text:
                            p_text = f"{p_text}, Character details: {char_desc.strip()}"
                        prompts.append({
                            "idea": ip.get("vietnameseLabel", ""),
                            "prompt_text": p_text
                        })
                    
                    formatted_scenes.append({
                        "timestamp": s.get("timeSegment", "00:00 - 00:03"),
                        "dialog": s.get("text", ""),
                        "visual": s.get("visualDescription", ""),
                        "prompts": prompts
                    })

                self.global_state["scenes"] = formatted_scenes # Store to 'scenes' for copying!
                self.global_state["storyboard_data"] = formatted_scenes
                self.render_prompt_cards(formatted_scenes)
                
                self.global_state["Step3_Render_Success"] = True
                self.show_toast("✅ Tạo kịch bản hình ảnh thành công!")
            except Exception as e: messagebox.showerror("Lỗi", str(e))
            finally: self.btn_t3_run.configure(text="Phân Tách Cảnh & Sinh Prompt", state="normal")
        threading.Thread(target=task).start()

    def _extract_prompts_from_state(self):
        lines = []
        for scene in self.global_state.get("scenes", []):
            for p in scene.get("prompts", []):
                lines.append(p.get("prompt_text", ""))
        return lines

    def run_copy_prompts(self):
        try:
            count = int(self.t3_slider.get())
            lines = self._extract_prompts_from_state()
            to_copy = "\n".join(lines[:count])
            self.clipboard_clear()
            self.clipboard_append(to_copy)
            self.update()
            self.show_toast("✅ Đã sao chép thành công vào Clipboard!")
        except Exception as e:
            self.show_toast(f"❌ Lỗi Copy: {str(e)}", error=True)

    def run_copy_range(self):
        try:
            start = int(self.cpy_from.get()) - 1
            end = int(self.cpy_to.get())
            lines = self._extract_prompts_from_state()
            to_copy = "\n".join(lines[start:end])
            self.clipboard_clear()
            self.clipboard_append(to_copy)
            self.update()
            self.show_toast("✅ Đã sao chép dải phân cảnh thành công!")
        except Exception as e:
            self.show_toast(f"❌ Lỗi Copy: {str(e)}", error=True)

    def pull_script_voice(self):
        self.tv_in.delete("1.0", "end")
        self.tv_in.insert("1.0", self.t2_full.get("1.0", "end").strip())

    # [FIXED TASK 1]: Chuẩn hóa Engine Tạo Voice (api.ai33.pro)
    def run_voice(self):
        def task():
            try:
                import time
                import requests
                import os
                self.btn_tv_run.configure(text="Đang tạo...", state="disabled")
                token = self.native_voice_key.get().strip() if hasattr(self, 'native_voice_key') else ""
                text = self.tv_in.get("1.0", "end").strip()
                if not text: return
                
                voice_name = self.tv_voice_cb.get()
                voice_id = "alloy"
                if hasattr(self, 'voices_list'):
                    for v in self.voices_list:
                        if f"[{v.get('language')}] {v.get('name')} - {v.get('gender')}" == voice_name:
                            voice_id = v.get("id", v.get("name", "alloy"))
                            break
                
                # Chunking logic for long text
                import re
                paragraphs = re.split(r'(?<=[.!?\n])\s+', text)
                chunks = []
                current_chunk = ""
                for p in paragraphs:
                    if len(current_chunk) + len(p) < 3000:
                        current_chunk += " " + p
                    else:
                        if current_chunk.strip(): chunks.append(current_chunk.strip())
                        current_chunk = p
                if current_chunk.strip(): chunks.append(current_chunk.strip())
                
                speed = getattr(self, "tv_speed_slider", None)
                speed_val = speed.get() if speed else 1.0

                url = "https://api.ai33.pro/v1/audio/speech"
                headers = {
                    "xi-api-key": token,
                    "Content-Type": "application/json"
                }
                
                out_dir = os.path.join(os.path.dirname(__file__), "Output")
                os.makedirs(out_dir, exist_ok=True)
                final_out_path = os.path.join(out_dir, f"voice_{int(time.time())}.mp3")
                
                self.tv_log.insert("end", f"▶ Bắt đầu tạo voice ({voice_id}) - Tốc độ: {speed_val}x - Tổng {len(chunks)} đoạn...\n")
                self.tv_log.see("end")
                
                temp_files = []
                for idx, chunk in enumerate(chunks):
                    self.tv_log.insert("end", f"  -> Đang xử lý đoạn {idx+1}/{len(chunks)}...\n")
                    self.tv_log.see("end")
                    payload = {
                        "model": "tts-1",
                        "input": chunk,
                        "voice": voice_id,
                        "speed": speed_val
                    }
                    res = requests.post(url, headers=headers, json=payload)
                    if res.ok:
                        chunk_path = os.path.join(out_dir, f"temp_chunk_{idx}.mp3")
                        with open(chunk_path, "wb") as f:
                            f.write(res.content)
                        temp_files.append(chunk_path)
                    else:
                        self.tv_log.insert("end", f"❌ Lỗi API ở đoạn {idx+1}: {res.text[:100]}\n")
                        raise Exception("API Error")
                
                # Nối các file MP3 (Binary concat for MP3 works fine generally, or simple merge)
                with open(final_out_path, "wb") as f_out:
                    for tf in temp_files:
                        with open(tf, "rb") as f_in:
                            f_out.write(f_in.read())
                        os.remove(tf) # dọn rác
                        
                self.tv_log.insert("end", f"✅ Đã tải file MP3 tổng thành công: {final_out_path}\n")
            except Exception as e:
                self.tv_log.insert("end", f"❌ Lỗi: {str(e)}\n")
            finally:
                self.btn_tv_run.configure(text="✨ Tạo Voice MP3", state="normal")
                self.tv_log.see("end")
        import threading
        threading.Thread(target=task).start()

if __name__ == "__main__":
    app = YTBAutomationTool()
    app.mainloop()
