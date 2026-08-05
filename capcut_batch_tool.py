import os
import json
import random
import shutil
import uuid
import copy
import re
import threading
import time
import subprocess
import ctypes
import sys
import urllib.request
import urllib.parse
import difflib
import string
import warnings
from datetime import datetime
import customtkinter as ctk
from tkinter import filedialog, messagebox

# --- INJECT FOLDER PATHS FOR ULTRA TOOL ---
curr_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(curr_dir)
sys.path.append(os.path.dirname(curr_dir))
try:
    import capcut_ultra_tool
    HAS_ULTRA_TOOL = True
except ImportError:
    HAS_ULTRA_TOOL = False

# --- INJECT SYSTEM SITE-PACKAGES ---
# (Removed because it is brittle. We now use subprocess for heavy system libs)

def _install_packages(packages):
    try:
        subprocess.run(['pip', 'install'] + packages, check=True, creationflags=subprocess.CREATE_NO_WINDOW)
        return True
    except Exception as e:
        messagebox.showerror("Lỗi Cài Đặt", f"Không thể tự động cài đặt thư viện: {e}")
        return False

# --- FIX LỖI POPUP CMD KHI DÙNG WHISPER / PYDUB / FFMPEG TRÊN WINDOWS ---
if os.name == 'nt':
    import subprocess
    _old_popen = subprocess.Popen
    class _HiddenPopen(_old_popen):
        def __init__(self, *args, **kwargs):
            if 'startupinfo' not in kwargs:
                startupinfo = subprocess.STARTUPINFO()
                startupinfo.dwFlags |= subprocess.STARTF_USESHOWWINDOW
                kwargs['startupinfo'] = startupinfo
            super().__init__(*args, **kwargs)
    subprocess.Popen = _HiddenPopen

# Tắt cảnh báo Whisper
warnings.filterwarnings("ignore", category=UserWarning)
warnings.filterwarnings("ignore", category=FutureWarning)

# === [QUAN TRỌNG] BẬT DPI AWARENESS ===
try:
    ctypes.windll.shcore.SetProcessDpiAwareness(2)
except Exception:
    try:
        ctypes.windll.user32.SetProcessDPIAware()
    except Exception:
        pass

def _import_base_libraries():
    try:
        global ctk, keyboard, pyautogui, pyperclip, cv2, np, Image, AudioSegment
        import customtkinter as ctk
        import keyboard
        import pyautogui
        import pyperclip
        import cv2
        import numpy as np
        from PIL import Image
        from pydub import AudioSegment
        
        # Test imports for new dependencies to trigger installation if missing
        import edge_tts
        return True
    except ImportError:
        return False

if not _import_base_libraries():
    if getattr(sys, 'frozen', False):
        messagebox.showerror("Lỗi Thư Viện", "Một số thư viện bị thiếu trong bản build. Vui lòng liên hệ nhà phát triển.")
        sys.exit()
    else:
        messagebox.showinfo("Cài đặt Thư viện", "Phần mềm đang cài đặt các thư viện cần thiết. Vui lòng chờ vài phút...")
        if _install_packages(['mutagen', 'pyautogui', 'pyperclip', 'keyboard', 'opencv-python', 'numpy', 'Pillow', 'requests', 'pydub', 'edge-tts', 'openai-whisper']):
            if not _import_base_libraries():
                messagebox.showerror("Lỗi", "Đã cài đặt nhưng không thể tải thư viện. Vui lòng khởi động lại ứng dụng.")
                sys.exit()
        else:
            sys.exit()

import mutagen
import pyautogui
import pyperclip 
import keyboard
import cv2
import numpy as np
from PIL import ImageGrab
from pydub import AudioSegment
pyautogui.FAILSAFE = True

# Whisper is now called via system python subprocess to avoid PyInstaller bloat and DLL conflicts

# --- CẤU HÌNH LƯU TRỮ ---
app_data_path = os.path.join(os.environ.get('APPDATA', os.path.expanduser('~')), 'CapCutBatchTool')
if not os.path.exists(app_data_path):
    os.makedirs(app_data_path)
CONFIG_FILE = os.path.join(app_data_path, "capcut_batch_config.json")
CONFIG_PROMPT_RENAME = os.path.join(app_data_path, "rules_prompt_history.txt")
CONFIG_REPLACE_RENAME = os.path.join(app_data_path, "rules_replace_history.txt")

# --- HÀM HỖ TRỢ CHUNG ---
def clean_song_name(raw_name):
    name = raw_name.replace(".wav", "").replace(".mp3", "").strip()
    name = re.sub(r'^\d+[\.\-\s]+', '', name)
    name = re.sub(r'\s*\(\d+\)$|\s*\[\d+\]$', '', name).strip()
    return name

def get_audio_duration_micros(filepath):
    try:
        audio = mutagen.File(filepath)
        if audio is not None and getattr(audio, 'info', None): return int(audio.info.length * 1000000)
    except Exception: pass
        
    try:
        if filepath.lower().endswith('.mp3'):
            from mutagen.mp3 import MP3
            audio = MP3(filepath)
            if getattr(audio, 'info', None): return int(audio.info.length * 1000000)
    except Exception: pass

    try:
        if filepath.lower().endswith('.wav'):
            import wave
            import contextlib
            with contextlib.closing(wave.open(filepath, 'r')) as f:
                frames = f.getnframes()
                rate = f.getframerate()
                return int((frames / float(rate)) * 1000000)
    except Exception: pass
    return 0

def format_time_tracklist(micros):
    total_seconds = micros // 1000000
    hours = total_seconds // 3600
    mins = (total_seconds % 3600) // 60
    secs = total_seconds % 60
    if hours > 0: return f"{hours:02d}:{mins:02d}:{secs:02d}"
    return f"{mins:02d}:{secs:02d}"

def format_time_youtube(micros):
    total_seconds = micros // 1000000
    hours = total_seconds // 3600
    mins = (total_seconds % 3600) // 60
    secs = total_seconds % 60
    return f"{hours:02d}:{mins:02d}:{secs:02d}"

def restart_capcut():
    try:
        os.system("taskkill /f /im capcut.exe >nul 2>&1")
        time.sleep(1.5) 
        local_app_data = os.environ.get('LOCALAPPDATA', '')
        capcut_path = os.path.join(local_app_data, 'CapCut', 'Apps', 'CapCut.exe')
        if os.path.exists(capcut_path): os.startfile(capcut_path)
    except Exception: pass

def clear_capcut_cache_files():
    local_app = os.environ.get('LOCALAPPDATA', '')
    cache_paths = [
        os.path.join(local_app, 'CapCut', 'User Data', 'Cache'),
        os.path.join(local_app, 'CapCut', 'User Data', 'Proxy')
    ]
    cleared_size = 0
    for p in cache_paths:
        if os.path.exists(p):
            for root, dirs, files in os.walk(p):
                for f in files:
                    try:
                        fp = os.path.join(root, f)
                        cleared_size += os.path.getsize(fp)
                        os.remove(fp)
                    except: pass
    return cleared_size / (1024 * 1024) # MB

def send_telegram_msg(token, chat_id, msg):
    if not token or not chat_id: return
    try:
        url = f"https://api.telegram.org/bot{token}/sendMessage?chat_id={chat_id}&text={urllib.parse.quote(msg)}"
        urllib.request.urlopen(url, timeout=3)
    except Exception: pass

# --- HÀM HỖ TRỢ TIỆN ÍCH KHÁC ---
def util_natural_sort_key(s):
    return [int(text) if text.isdigit() else text.lower() for text in re.split(r'(\d+)', s)]

def util_get_filename_from_path(path):
    path = path.replace('\\', '/')
    return os.path.basename(path)

def smart_shuffle_list(items, key_func):
    if not items: return []
    pool = list(items)
    random.shuffle(pool)
    spaced_pool = []
    last_key = None
    
    while pool:
        idx_to_pick = 0
        for i, item in enumerate(pool):
            if key_func(item) != last_key:
                idx_to_pick = i
                break
        chosen = pool.pop(idx_to_pick)
        spaced_pool.append(chosen)
        last_key = key_func(chosen)
    return spaced_pool

# --- POPUP CHỌN DRAFT CAPCUT ---
class CapCutDraftSelector(ctk.CTkToplevel):
    def __init__(self, master, callback):
        super().__init__(master)
        self.title("Chọn Dự Án Từ CapCut Drafts")
        self.geometry("650x600")
        self.callback = callback
        self.main_app = master
        self.drafts = []
        
        self.update_idletasks()
        x = master.winfo_x() + (master.winfo_width() // 2) - 325
        y = master.winfo_y() + (master.winfo_height() // 2) - 300
        self.geometry(f"+{x}+{y}")
        self.transient(master)
        self.grab_set()

        self.grid_rowconfigure(1, weight=1)
        self.grid_columnconfigure(0, weight=1)

        top_frame = ctk.CTkFrame(self, fg_color="transparent")
        top_frame.grid(row=0, column=0, sticky="ew", padx=15, pady=(15, 5))
        
        self.search_var = ctk.StringVar()
        self.search_var.trace("w", self.filter_drafts)
        
        search_entry = ctk.CTkEntry(top_frame, placeholder_text="🔍 Tìm tên dự án...", textvariable=self.search_var)
        search_entry.pack(side="left", fill="x", expand=True, padx=(0, 10))

        btn_change_dir = ctk.CTkButton(top_frame, text="📂 Đổi thư mục", width=100, fg_color="#444444", hover_color="#666666", command=self.change_draft_dir)
        btn_change_dir.pack(side="left")

        self.scroll_frame = ctk.CTkScrollableFrame(self)
        self.scroll_frame.grid(row=1, column=0, sticky="nsew", padx=15, pady=10)
        
        self.load_drafts()
        self.populate_list(self.drafts)

    def load_drafts(self):
        self.drafts.clear()
        drafts_path = getattr(self.main_app, "custom_draft_path", "")
        if not drafts_path or not os.path.exists(drafts_path):
            drafts_path = os.path.join(os.environ.get('LOCALAPPDATA', ''), 'CapCut', 'User Data', 'Projects', 'com.lveditor.draft')

        if not os.path.exists(drafts_path): return
            
        for folder in os.listdir(drafts_path):
            full_path = os.path.join(drafts_path, folder)
            if os.path.isdir(full_path):
                meta_path = os.path.join(full_path, "draft_meta_info.json")
                content_path = os.path.join(full_path, "draft_content.json")
                if not os.path.exists(content_path):
                    alt_path = os.path.join(full_path, folder, "draft_content.json")
                    if os.path.exists(alt_path): content_path = alt_path

                if os.path.exists(meta_path) and os.path.exists(content_path):
                    try:
                        with open(meta_path, 'r', encoding='utf-8') as f:
                            meta = json.load(f)
                            name = meta.get("draft_name", folder)
                            mtime = os.path.getmtime(meta_path)
                            self.drafts.append({"name": name, "path": content_path, "time": mtime})
                    except: pass
        self.drafts.sort(key=lambda x: x["time"], reverse=True)

    def change_draft_dir(self):
        path = filedialog.askdirectory(title="Chọn thư mục CapCut Drafts")
        if path:
            self.main_app.custom_draft_path = path
            self.main_app.save_config()
            self.load_drafts()
            self.populate_list(self.drafts)

    def filter_drafts(self, *args):
        query = self.search_var.get().lower()
        if not query: self.populate_list(self.drafts)
        else:
            filtered = [d for d in self.drafts if query in d["name"].lower()]
            self.populate_list(filtered)

    def populate_list(self, drafts_to_show):
        for widget in self.scroll_frame.winfo_children(): widget.destroy()
        if not drafts_to_show:
            msg = "Không tìm thấy dự án nào.\n\nVui lòng bấm '📂 Đổi thư mục' ở trên\nđể chọn lại thư mục lưu trữ của bạn (VD: Ổ D:)."
            ctk.CTkLabel(self.scroll_frame, text=msg, text_color="#AAAAAA", justify="center").pack(pady=40)
            return

        for draft in drafts_to_show:
            btn_text = f"🎬 {draft['name']}\n🕒 {datetime.fromtimestamp(draft['time']).strftime('%d/%m/%Y %H:%M')}"
            btn = ctk.CTkButton(self.scroll_frame, text=btn_text, anchor="w", fg_color="#2B2B2B", hover_color="#444444", text_color="#FFFFFF", command=lambda p=draft['path']: self.select_draft(p))
            btn.pack(fill="x", pady=2, padx=5)

    def select_draft(self, path):
        self.callback(path)
        self.destroy()

# --- HÀM XỬ LÝ LÕI JSON CỦA CAPCUT ---
def process_capcut_project(input_json_path, output_json_path, new_bg_path=None, audio_folder=None, 
                           sequence_index=1, skip_az=False, skip_za=False, 
                           audio_version="Tất cả", max_songs=10, text_format="Tự động (Theo Template)",
                           is_multi_bg=False, bg_list=None, loop_video=False, keep_duplicates=False,
                           random_variants=False, fixed_songs_text="", do_fade=False, do_scale=False, do_pagination=False, shuffle_bg=False):
    bg_replaced = False
    tracklist_data = [] 
    yt_timestamps = []
    
    with open(input_json_path, 'r', encoding='utf-8') as f: data = json.load(f)

    # 1. THAY BACKGROUND
    if new_bg_path and not is_multi_bg:
        new_bg_name = os.path.basename(new_bg_path)
        new_bg_path_formatted = new_bg_path.replace("\\", "/")
        is_video = new_bg_path.lower().endswith(('.mp4', '.mov', '.avi', '.mkv'))
        
        video_tracks = [t for t in data['tracks'] if t['type'] == 'video']
        video_tracks.sort(key=lambda x: x.get('track_render_index', 0))
        
        main_bg_material_id = None
        if video_tracks and video_tracks[0]['segments']: main_bg_material_id = video_tracks[0]['segments'][0].get('material_id')
                
        if main_bg_material_id:
            for video in data['materials']['videos']:
                if video.get('id') == main_bg_material_id: 
                    video['path'] = new_bg_path_formatted
                    video['material_name'] = new_bg_name
                    video['type'] = 'video' if is_video else 'photo'
                    bg_replaced = True
                    break

    # 2. XỬ LÝ NHẠC
    audio_track = None
    max_duration = -1
    for track in data['tracks']:
        if track['type'] == 'audio' and len(track['segments']) > 0:
            track_dur = sum(seg.get('target_timerange', {}).get('duration', 0) for seg in track['segments'])
            if track_dur > max_duration:
                max_duration = track_dur
                audio_track = track

    if not audio_track: raise Exception("Không tìm thấy track nhạc trong Template!")

    song_order_names = []
    song_timings = [] 
    total_duration = 0
    audio_files = []

    if audio_folder and os.path.isdir(audio_folder):
        valid_ext = ('.mp3', '.wav', '.m4a', '.aac', '.flac')
        has_valid_files = False
        all_found_audios = []
        for root_dir, _, files in os.walk(audio_folder):
            for f_name in files:
                if f_name.lower().endswith(valid_ext):
                    has_number_suffix = bool(re.search(r'\(\d+\)\.\w+$', f_name))
                    if audio_version == "Bản gốc (Không có '(1)')" and has_number_suffix: continue
                    if audio_version == "Bản phụ (Có '(1)')" and not has_number_suffix: continue
                    has_valid_files = True
                    full_path = os.path.abspath(os.path.join(root_dir, f_name))
                    duration = get_audio_duration_micros(full_path)
                    if duration > 0:
                        all_found_audios.append({'name': f_name, 'path': full_path.replace("\\", "/"), 'duration': duration, 'clean': clean_song_name(f_name)})
                        
        if has_valid_files and not all_found_audios: raise Exception("Thư mục có file nhạc nhưng Tool không đọc được độ dài!")

        fixed_names = [n.strip() for n in fixed_songs_text.split('\n') if n.strip()]
        fixed_audio_files = []
        random_audio_files = []

        if random_variants or keep_duplicates:
            pool = list(all_found_audios)
            for fname in fixed_names:
                for i, audio in enumerate(pool):
                    if fname.lower() in audio['clean'].lower() or audio['clean'].lower() in fname.lower():
                        fixed_audio_files.append(audio)
                        pool.pop(i)
                        break
            if random_variants: random_audio_files = smart_shuffle_list(pool, key_func=lambda x: x['clean'])
            else: random_audio_files = pool
        else:
            unique_songs = {}
            for audio in all_found_audios:
                c_name = audio['clean']
                if c_name not in unique_songs: unique_songs[c_name] = []
                unique_songs[c_name].append(audio)
                
            for fname in fixed_names:
                match_key = None
                for k in unique_songs.keys():
                    if fname.lower() in k.lower() or k.lower() in fname.lower(): match_key = k; break
                if match_key: fixed_audio_files.append(random.choice(unique_songs[match_key])); del unique_songs[match_key] 
                    
            for c_name, versions in unique_songs.items(): random_audio_files.append(random.choice(versions))

        def natural_sort_key(item): return [int(text) if text.isdigit() else text.lower() for text in re.split(r'(\d+)', item['name'])]
        
        if sequence_index == 1 and not skip_az and not random_variants: random_audio_files.sort(key=natural_sort_key)
        elif sequence_index == 2 and not skip_za and not random_variants: random_audio_files.sort(key=natural_sort_key, reverse=True)
        elif not random_variants: random.shuffle(random_audio_files)

        audio_files = fixed_audio_files + random_audio_files
        if max_songs > 0: audio_files = audio_files[:max_songs]

        template_seg = copy.deepcopy(audio_track['segments'][0])
        template_mat_id = template_seg['material_id']
        template_mat = None
        for mat in data['materials']['audios']:
            if mat['id'] == template_mat_id: template_mat = copy.deepcopy(mat); break
        if not template_mat: template_mat = copy.deepcopy(data['materials']['audios'][0])

        template_extra_refs_map = {}
        for ref_id in template_seg.get('extra_material_refs', []):
            for category, mat_list in data['materials'].items():
                if isinstance(mat_list, list):
                    for mat in mat_list:
                        if isinstance(mat, dict) and mat.get('id') == ref_id:
                            template_extra_refs_map[ref_id] = (category, copy.deepcopy(mat))
                            break

        old_audio_mat_ids = [seg['material_id'] for seg in audio_track['segments']]
        audio_track['segments'] = []
        new_materials = []
        current_time = 0

        for audio in audio_files:
            tracklist_data.append(f"{format_time_tracklist(current_time)} {audio['clean']}")
            yt_timestamps.append(f"{format_time_youtube(current_time)} {audio['clean']}")
            
            new_mat_id = uuid.uuid4().hex.upper()
            new_seg_id = uuid.uuid4().hex.upper()

            new_mat = copy.deepcopy(template_mat)
            new_mat['id'] = new_mat_id
            new_mat['name'] = audio['name']
            new_mat['path'] = audio['path']
            new_mat['duration'] = audio['duration']
            if 'local_material_id' in new_mat: new_mat['local_material_id'] = ""
            
            if do_fade:
                new_mat['fade_in_time'] = 2000000 if audio['duration'] > 4000000 else 0
                new_mat['fade_out_time'] = 2000000 if audio['duration'] > 4000000 else 0
            
            new_materials.append(new_mat)
            
            new_seg = copy.deepcopy(template_seg)
            new_seg['id'] = new_seg_id
            new_seg['material_id'] = new_mat_id
            new_seg['source_timerange'] = {'start': 0, 'duration': audio['duration']}
            new_seg['target_timerange'] = {'start': current_time, 'duration': audio['duration']}
            
            new_extra_refs = []
            for old_ref_id in template_seg.get('extra_material_refs', []):
                if old_ref_id in template_extra_refs_map:
                    category, mat_copy = template_extra_refs_map[old_ref_id]
                    new_ref_id = uuid.uuid4().hex.upper()
                    new_ref_mat = copy.deepcopy(mat_copy)
                    new_ref_mat['id'] = new_ref_id
                    data['materials'][category].append(new_ref_mat)
                    new_extra_refs.append(new_ref_id)
            new_seg['extra_material_refs'] = new_extra_refs
            audio_track['segments'].append(new_seg)

            song_timings.append((current_time, audio['duration']))
            current_time += audio['duration']
            song_order_names.append(audio['clean'])

        data['materials']['audios'] = [m for m in data['materials']['audios'] if m['id'] not in old_audio_mat_ids]
        data['materials']['audios'].extend(new_materials)
        total_duration = current_time

    else:
        audio_materials = {item['id']: item for item in data['materials']['audios']}
        segments = audio_track['segments']
        if sequence_index == 1 and not skip_az: pass 
        elif sequence_index == 2 and not skip_za: segments.reverse() 
        else: random.shuffle(segments) 
        
        current_time = 0
        for seg in segments:
            mat_info = audio_materials.get(seg['material_id'])
            if not mat_info: continue
            tracklist_data.append(f"{format_time_tracklist(current_time)} {clean_song_name(mat_info['name'])}")
            yt_timestamps.append(f"{format_time_youtube(current_time)} {clean_song_name(mat_info['name'])}")
            
            duration = mat_info['duration']
            seg['source_timerange']['start'] = 0
            seg['source_timerange']['duration'] = duration
            seg['target_timerange']['start'] = current_time
            seg['target_timerange']['duration'] = duration
            
            if do_fade:
                mat_info['fade_in_time'] = 2000000 if duration > 4000000 else 0
                mat_info['fade_out_time'] = 2000000 if duration > 4000000 else 0

            song_timings.append((current_time, duration))
            current_time += duration
            song_order_names.append(clean_song_name(mat_info['name']))
        total_duration = current_time

    data['duration'] = total_duration

    # 3. CHỈNH SCALE & ĐỒNG BỘ THỜI GIAN VIDEO/HÌNH ẢNH
    for video in data['materials']['videos']:
        if video.get('type') in ['photo', 'video']:
            video['duration'] = total_duration
            if do_scale: video['crop'] = {"scale": 1.5}

    if loop_video:
        for track in data['tracks']:
            if track['type'] in ['video', 'effect', 'text']:
                segments = track.get('segments', [])
                if not segments: continue
                segments.sort(key=lambda x: x.get('target_timerange', {}).get('start', 0))

                if len(segments) == 1:
                    seg = segments[0]
                    if seg.get('target_timerange') is not None: seg['target_timerange']['duration'] = total_duration
                    if seg.get('source_timerange') is not None: seg['source_timerange']['duration'] = total_duration
                elif len(segments) > 1:
                    valid_segments = []
                    original_pattern = copy.deepcopy(segments)
                    for seg in segments:
                        start_time = seg.get('target_timerange', {}).get('start', 0)
                        dur = seg.get('target_timerange', {}).get('duration', 0)
                        if start_time >= total_duration: continue
                        if start_time + dur > total_duration:
                            dur = total_duration - start_time
                            seg['target_timerange']['duration'] = dur
                            if seg.get('source_timerange') is not None: seg['source_timerange']['duration'] = dur
                        valid_segments.append(seg)
                    if valid_segments:
                        current_end_time = valid_segments[-1]['target_timerange']['start'] + valid_segments[-1]['target_timerange']['duration']
                        if current_end_time < total_duration:
                            pattern_index = 0
                            while current_end_time < total_duration:
                                template_seg = original_pattern[pattern_index % len(original_pattern)]
                                new_seg = copy.deepcopy(template_seg)
                                new_seg['id'] = uuid.uuid4().hex.upper()
                                template_dur = template_seg.get('target_timerange', {}).get('duration', 3000000)
                                add_dur = total_duration - current_end_time if current_end_time + template_dur > total_duration else template_dur
                                new_seg['target_timerange']['start'] = current_end_time
                                new_seg['target_timerange']['duration'] = add_dur
                                if new_seg.get('source_timerange'): new_seg['source_timerange']['duration'] = add_dur
                                valid_segments.append(new_seg)
                                current_end_time += add_dur
                                pattern_index += 1
                    track['segments'] = valid_segments
    else:
        for track in data['tracks']:
            if track['type'] in ['video', 'effect']:
                for seg in track['segments']:
                    if seg.get('target_timerange') and seg['target_timerange'].get('start', 0) == 0: seg['target_timerange']['duration'] = total_duration
                    if seg.get('source_timerange') and seg.get('target_timerange', {}).get('start', 0) == 0: seg['source_timerange']['duration'] = total_duration

    # 4. TÍNH NĂNG MULTI-BG
    if is_multi_bg and bg_list:
        video_tracks = [t for t in data['tracks'] if t['type'] == 'video']
        video_tracks.sort(key=lambda x: x.get('track_render_index', 0))
        if video_tracks:
            main_video_track = video_tracks[0]
            new_video_materials = []
            for p in bg_list:
                is_video = p.lower().endswith(('.mp4', '.mov', '.avi', '.mkv'))
                mat = {
                    "id": uuid.uuid4().hex.upper(),
                    "path": p.replace("\\", "/"),
                    "material_name": os.path.basename(p),
                    "type": "video" if is_video else "photo",
                    "duration": total_duration
                }
                if do_scale: mat['crop'] = {"scale": 1.5}
                new_video_materials.append(mat)
                data['materials']['videos'].append(mat)
            
            segments = main_video_track.get('segments', [])
            segments.sort(key=lambda x: x.get('target_timerange', {}).get('start', 0))
            if new_video_materials and segments:
                last_used_id = None
                for idx, seg in enumerate(segments):
                    if shuffle_bg and len(new_video_materials) > 1:
                        candidates = [m for m in new_video_materials if m['id'] != last_used_id]
                        if not candidates: candidates = new_video_materials
                        chosen_mat = random.choice(candidates)
                    else:
                        chosen_mat = new_video_materials[idx % len(new_video_materials)]
                    
                    seg['material_id'] = chosen_mat['id']
                    last_used_id = chosen_mat['id']
                bg_replaced = True

    # 5. XỬ LÝ TEXT (PHÂN TRANG & THAY TÊN)
    text_materials = data['materials']['texts']
    if text_materials and song_order_names:
        text_tracks = [t for t in data['tracks'] if t['type'] == 'text']
        if text_tracks:
            target_text_track = None
            target_seg = None
            max_len = -1
            
            for track in text_tracks:
                for seg in track['segments']:
                    mat_id = seg['material_id']
                    for text_mat in text_materials:
                        if text_mat['id'] == mat_id:
                            try:
                                content_dict = json.loads(text_mat['content'])
                                text_len = len(content_dict.get('text', ''))
                                if text_len > max_len:
                                    max_len = text_len
                                    target_text_track = track
                                    target_seg = seg
                            except: pass

            if target_text_track and target_seg:
                try:
                    target_mat = next(m for m in text_materials if m['id'] == target_seg['material_id'])
                    content_dict = json.loads(target_mat['content'])
                    original_text = content_dict.get('text', '')
                    
                    is_vertical = False; has_numbers = False
                    if text_format == "Hàng dọc (1. A)": is_vertical = True; has_numbers = True
                    elif text_format == "Hàng ngang (A / B)": is_vertical = False
                    else:
                        if original_text.count('\n') >= 2 and " / " not in original_text:
                            is_vertical = True
                            if any(re.match(r'^\d+[\.\-\)]', line.strip()) for line in original_text.split('\n') if line.strip()): has_numbers = True

                    songs_per_page = 10
                    if do_pagination and len(song_order_names) > songs_per_page:
                        target_text_track['segments'] = [] 
                        chunks = [song_order_names[i:i + songs_per_page] for i in range(0, len(song_order_names), songs_per_page)]
                        
                        current_song_idx = 0
                        for chunk_idx, chunk in enumerate(chunks):
                            start_time = song_timings[current_song_idx][0]
                            end_song_idx = current_song_idx + len(chunk) - 1
                            end_time = song_timings[end_song_idx][0] + song_timings[end_song_idx][1]
                            chunk_duration = end_time - start_time

                            if is_vertical:
                                if has_numbers: display_text = "\n".join([f"{current_song_idx + idx + 1}. {song}" for idx, song in enumerate(chunk)])
                                else: display_text = "\n".join(chunk)
                            else:
                                split_index = len(chunk) // 2 + (1 if len(chunk) % 2 != 0 else 0)
                                l1 = " / ".join(chunk[:split_index]); l2 = " / ".join(chunk[split_index:])
                                display_text = f"{l1}\n{l2}" if l2 else l1

                            new_mat_id = uuid.uuid4().hex.upper()
                            new_mat = copy.deepcopy(target_mat)
                            new_mat['id'] = new_mat_id
                            c_dict = json.loads(new_mat['content'])
                            c_dict['text'] = display_text
                            
                            def update_ranges(obj, n_len):
                                if isinstance(obj, dict):
                                    for k, v in obj.items():
                                        if k == 'range' and isinstance(v, list) and len(v) == 2: v[1] = n_len
                                        elif isinstance(v, (dict, list)): update_ranges(v, n_len)
                                elif isinstance(obj, list):
                                    for item in obj: update_ranges(item, n_len)
                            
                            update_ranges(c_dict, len(display_text))
                            new_mat['content'] = json.dumps(c_dict, ensure_ascii=False)
                            data['materials']['texts'].append(new_mat)

                            new_seg = copy.deepcopy(target_seg)
                            new_seg['id'] = uuid.uuid4().hex.upper()
                            new_seg['material_id'] = new_mat_id
                            new_seg['target_timerange'] = {'start': start_time, 'duration': chunk_duration}
                            if new_seg.get('source_timerange'): new_seg['source_timerange']['duration'] = chunk_duration
                            
                            target_text_track['segments'].append(new_seg)
                            current_song_idx += len(chunk)
                    else:
                        if is_vertical:
                            if has_numbers: display_text = "\n".join([f"{idx + 1}. {song}" for idx, song in enumerate(song_order_names)])
                            else: display_text = "\n".join(song_order_names)
                        else:
                            split_index = len(song_order_names) // 2 + (1 if len(song_order_names) % 2 != 0 else 0)
                            l1 = " / ".join(song_order_names[:split_index]); l2 = " / ".join(song_order_names[split_index:])
                            display_text = f"{l1}\n{l2}" if l2 else l1
                        
                        content_dict['text'] = display_text
                        def update_ranges2(obj, n_len):
                            if isinstance(obj, dict):
                                for k, v in obj.items():
                                    if k == 'range' and isinstance(v, list) and len(v) == 2: v[1] = n_len
                                    elif isinstance(v, (dict, list)): update_ranges2(v, n_len)
                            elif isinstance(obj, list):
                                for item in obj: update_ranges2(item, n_len)
                        update_ranges2(content_dict, len(display_text))
                        target_mat['content'] = json.dumps(content_dict, ensure_ascii=False)
                        if not loop_video:
                            target_seg['target_timerange']['duration'] = total_duration
                            if target_seg.get('source_timerange'): target_seg['source_timerange']['duration'] = total_duration
                except Exception: pass

    with open(output_json_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, separators=(',', ':'))
        
    return bg_replaced, tracklist_data, yt_timestamps

# --- GIAO DIỆN NGƯỜI DÙNG ---
ctk.set_appearance_mode("Dark")
ctk.set_default_color_theme("pitch_black_theme.json")

class LockScreenOverlay(ctk.CTkToplevel):
    def __init__(self, master):
        super().__init__(master)
        self.title("RPA Shield")
        self.attributes('-fullscreen', True)
        self.attributes('-topmost', True)
        self.attributes('-alpha', 0.25)
        self.configure(fg_color="#1A1A1A")
        
        lbl = ctk.CTkLabel(self, text="🛡️ ĐANG AUTO-RENDER - VUI LÒNG KHÔNG ĐỤNG CHUỘT PHÍM!\n(Bấm ESC hoặc chờ Tool xong để tự tắt)", 
                           font=ctk.CTkFont(size=30, weight="bold"), text_color="#FFFFFF", fg_color="#333333", corner_radius=10)
        lbl.place(relx=0.5, rely=0.1, anchor="center")
        
        self.bind("<Escape>", lambda e: self.destroy())

class CapCutBatchTool(ctk.CTk):
    def __init__(self):
        super().__init__()
        self.title("CapCut Auto-Mix Professional (All-in-One Mega Edition)")
        self.geometry("1100x950") 
        try: self.iconbitmap(r"favicon.ico")
        except: pass
        
        # Trạng thái
        self.is_running = False
        self.stop_requested = False
        self.lock_screen = None
        self.profiles = {}
        self.last_profile = ""
        self.custom_draft_path = ""
        self.is_prompt_running = False
        self.prompt_stop_requested = False
        
        self.grid_columnconfigure(0, weight=0) # Sidebar
        self.grid_columnconfigure(1, weight=1) # Main
        self.grid_rowconfigure(1, weight=1)
        
        # ====== GLOBAL STATE (ĐỒNG BỘ DỮ LIỆU) ======
        self.var_draft_json = ctk.StringVar()
        self.var_audio_folder = ctk.StringVar()
        
        # ====== SIDEBAR NAV ======
        self.sidebar_frame = ctk.CTkFrame(self, width=250, corner_radius=0, fg_color="#121214")
        self.sidebar_frame.grid(row=0, column=0, rowspan=3, sticky="nsew")
        self.sidebar_frame.grid_rowconfigure(10, weight=1)

        self.lbl_title = ctk.CTkLabel(self.sidebar_frame, text="CAPCUT PRO", font=ctk.CTkFont(size=26, weight="bold"), text_color="#FFFFFF")
        self.lbl_title.grid(row=0, column=0, padx=20, pady=(25, 30))

        # Main Layout 
        self.main_frame = ctk.CTkFrame(self, fg_color="transparent")
        self.main_frame.grid(row=1, column=1, sticky="nsew", padx=20, pady=10)
        self.main_frame.grid_columnconfigure(0, weight=6)
        self.main_frame.grid_columnconfigure(1, weight=4)
        self.main_frame.grid_rowconfigure(0, weight=1)

        # Tab Content Container
        self.content_frame = ctk.CTkFrame(self.main_frame, fg_color="transparent")
        self.content_frame.grid(row=0, column=0, sticky="nsew", padx=(0, 10))
        self.content_frame.grid_rowconfigure(0, weight=1)
        self.content_frame.grid_columnconfigure(0, weight=1)

        # TẠO CÁC FRAME CHO TỪNG TAB THAY VÌ TABVIEW
        self.tab_basic = ctk.CTkFrame(self.content_frame, fg_color="transparent")
        self.tab_audio_timeline = ctk.CTkFrame(self.content_frame, fg_color="transparent")
        self.tab_ultra = ctk.CTkFrame(self.content_frame, fg_color="transparent")
        self.tab_ai = ctk.CTkFrame(self.content_frame, fg_color="transparent")
        self.tab_utils = ctk.CTkFrame(self.content_frame, fg_color="transparent")
        self.tab_system = ctk.CTkFrame(self.content_frame, fg_color="transparent")

        for f in (self.tab_basic, self.tab_audio_timeline, self.tab_ultra, self.tab_ai, self.tab_utils, self.tab_system):
            f.grid(row=0, column=0, sticky="nsew")

        # SIDEBAR BUTTONS
        self.nav_btns = {}
        def select_tab(name):
            for n, btn in self.nav_btns.items():
                btn.configure(fg_color="#313244" if n == name else "transparent", 
                              text_color="#FFFFFF" if n == name else "#CCCCCC")
            if name == "basic": self.tab_basic.tkraise()
            elif name == "audio": self.tab_audio_timeline.tkraise()
            elif name == "ultra": self.tab_ultra.tkraise()
            elif name == "ai": self.tab_ai.tkraise()
            elif name == "utils": self.tab_utils.tkraise()
            elif name == "system": self.tab_system.tkraise()

        def create_nav_btn(row, name, text, icon=""):
            btn = ctk.CTkButton(self.sidebar_frame, text=f"{icon}  {text}", anchor="w", 
                                font=ctk.CTkFont(size=14, weight="bold"), height=45,
                                fg_color="transparent", text_color="#CCCCCC", hover_color="#313244", 
                                command=lambda: select_tab(name))
            btn.grid(row=row, column=0, sticky="ew", padx=15, pady=5)
            self.nav_btns[name] = btn

        create_nav_btn(1, "basic", "Batch Render", "⚡")
        create_nav_btn(2, "audio", "Audio & Timeline", "🎵")
        create_nav_btn(3, "ultra", "CapCut Ultra", "🚀")
        create_nav_btn(4, "ai", "Auto Prompt AI", "🤖")
        create_nav_btn(5, "utils", "Quản Lý File Pro", "📁")
        create_nav_btn(6, "system", "Hệ Thống & Bot", "⚙️")

        btn_style = {"fg_color": "#313244", "hover_color": "#45475A", "text_color": "#CCCCCC"}
        btn_style_small = {"fg_color": "#313244", "hover_color": "#45475A", "text_color": "#CCCCCC", "height": 28}

        # --- SETUP CÁC TAB CHÍNH ---
        self.setup_basic_tab(btn_style, btn_style_small)
        self.setup_audio_timeline_tab(btn_style)
        self.setup_ultra_tab(btn_style)
        self.setup_ai_tab()
        self.setup_utils_tab(btn_style)
        self.setup_system_tab()
        
        select_tab("basic") # Default tab

        # ====== KHUNG BÊN PHẢI (LOG & PROGRESS) ======
        self.right_frame = ctk.CTkFrame(self.main_frame, fg_color="#1E1E2E", corner_radius=15)
        self.right_frame.grid(row=0, column=1, sticky="nsew", padx=(10, 0))
        self.right_frame.grid_rowconfigure(1, weight=1)

        ctk.CTkLabel(self.right_frame, text="Bảng Tin Điều Khiển", font=ctk.CTkFont(weight="bold", size=15), text_color="#FFFFFF").grid(row=0, column=0, sticky="w", padx=20, pady=(20, 5))
        
        self.log_box = ctk.CTkTextbox(self.right_frame, state="disabled", fg_color="#11111B", text_color="#CCCCCC", border_color="#313244", border_width=1, corner_radius=10)
        self.log_box.grid(row=1, column=0, sticky="nsew", padx=20, pady=5)

        self.progress_bar = ctk.CTkProgressBar(self.right_frame, progress_color="#FFFFFF", fg_color="#404040", height=12)
        self.progress_bar.grid(row=2, column=0, sticky="ew", padx=20, pady=(15, 25))
        self.progress_bar.set(0)

        # ====== FOOTER (Cho Mix & Render) ======
        self.footer_frame = ctk.CTkFrame(self, fg_color="transparent")
        self.footer_frame.grid(row=2, column=1, pady=(5, 20), padx=20, sticky="ew")
        self.footer_frame.grid_columnconfigure(1, weight=7)
        self.footer_frame.grid_columnconfigure(2, weight=3)

        self.btn_preview = ctk.CTkButton(self.footer_frame, text="👀 Xem Thử Danh Sách", height=55, font=ctk.CTkFont(size=14, weight="bold"), 
                                     fg_color="#FFFFFF", hover_color="#CCCCCC", text_color="#000000", command=self.preview_tracklist, corner_radius=12)
        self.btn_preview.grid(row=0, column=0, sticky="ew", padx=(0, 15))

        self.btn_run = ctk.CTkButton(self.footer_frame, text="▶ KHỞI CHẠY BATCH RENDER", height=55, font=ctk.CTkFont(size=16, weight="bold"), 
                                     fg_color="#FFFFFF", hover_color="#CCCCCC", text_color="#000000", command=self.start_thread, corner_radius=12)
        self.btn_run.grid(row=0, column=1, sticky="ew", padx=(0, 15))

        self.btn_stop = ctk.CTkButton(self.footer_frame, text="⏹ DỪNG HỆ THỐNG", height=55, font=ctk.CTkFont(size=16, weight="bold"), 
                                      fg_color="#555555", hover_color="#777777", text_color="#FFFFFF", state="disabled", command=self.stop_thread, corner_radius=12)
        self.btn_stop.grid(row=0, column=2, sticky="ew")

        try: 
            keyboard.add_hotkey('esc', self.stop_all_from_hotkey)
            keyboard.add_hotkey('f9', self.start_prompt_thread_from_hotkey) 
        except Exception: pass

        self.load_config()

    # ==========================================
    # CÁC HÀM SETUP GIAO DIỆN TỪNG TAB
    # ==========================================
    def setup_basic_tab(self, btn_style, btn_style_small):
        self.scroll_basic = ctk.CTkScrollableFrame(self.tab_basic, fg_color="transparent")
        self.scroll_basic.pack(fill="both", expand=True)

        profile_frame = ctk.CTkFrame(self.scroll_basic, fg_color="transparent")
        profile_frame.pack(fill="x", padx=10, pady=(5, 5))
        ctk.CTkLabel(profile_frame, text="Kênh / Tiền tố:", font=ctk.CTkFont(weight="bold"), text_color="#FFFFFF").pack(side="left")
        self.combo_profile = ctk.CTkComboBox(profile_frame, width=150, fg_color="#2B2B2B", border_color="#555555", text_color="#FFFFFF", command=self.on_profile_change)
        self.combo_profile.pack(side="left", padx=(5, 10))
        ctk.CTkButton(profile_frame, text="💾 Lưu", width=50, command=self.save_current_profile_btn, **btn_style_small).pack(side="left", padx=2)
        ctk.CTkButton(profile_frame, text="➕ Thêm", width=50, command=self.add_profile, **btn_style_small).pack(side="left", padx=2)
        ctk.CTkButton(profile_frame, text="❌ Xóa", width=50, fg_color="#444444", hover_color="#666666", text_color="#FFFFFF", height=28, command=self.delete_profile).pack(side="left", padx=2)

        ctk.CTkLabel(self.scroll_basic, text="1. Nguồn Template JSON (Bắt buộc)", font=ctk.CTkFont(weight="bold")).pack(anchor="w", padx=10, pady=(10, 2))
        row_proj = ctk.CTkFrame(self.scroll_basic, fg_color="transparent")
        row_proj.pack(fill="x", padx=10, pady=2)
        self.entry_proj = ctk.CTkEntry(row_proj, placeholder_text="File draft_content.json gốc...", fg_color="#2B2B2B", border_color="#555555", text_color="#FFFFFF", textvariable=self.var_draft_json)
        self.entry_proj.pack(side="left", fill="x", expand=True, padx=(0, 5))
        ctk.CTkButton(row_proj, text="🔍 Chọn từ Draft", width=120, command=self.open_draft_selector, fg_color="#444444", hover_color="#666666", text_color="#FFFFFF").pack(side="left", padx=(0, 5))
        ctk.CTkButton(row_proj, text="Duyệt File", width=80, command=self.browse_project, **btn_style).pack(side="left")

        ctk.CTkLabel(self.scroll_basic, text="2. Thư mục Nhạc ghép mới (Tùy chọn)", font=ctk.CTkFont(weight="bold")).pack(anchor="w", padx=10, pady=(10, 2))
        self.entry_audio = ctk.CTkEntry(self.scroll_basic, placeholder_text="Bỏ trống nếu chỉ muốn trộn lại nhạc cũ...", fg_color="#2B2B2B", border_color="#555555", text_color="#FFFFFF", textvariable=self.var_audio_folder)
        self.entry_audio.pack(fill="x", padx=10, pady=2)
        ctk.CTkButton(self.scroll_basic, text="Chọn Thư Mục Nhạc", command=self.browse_audio, **btn_style).pack(anchor="e", padx=10)
        
        row_audio = ctk.CTkFrame(self.scroll_basic, fg_color="transparent")
        row_audio.pack(fill="x", padx=10, pady=2)
        ctk.CTkLabel(row_audio, text="Phiên bản:", text_color="#CCCCCC").pack(side="left")
        self.combo_audio_ver = ctk.CTkComboBox(row_audio, values=["Tất cả", "Bản gốc (Không có '(1)')", "Bản phụ (Có '(1)')"], width=130, fg_color="#2B2B2B", border_color="#555555", text_color="#FFFFFF")
        self.combo_audio_ver.pack(side="left", padx=5)
        ctk.CTkLabel(row_audio, text="Số bài:", text_color="#CCCCCC").pack(side="left", padx=(10, 0))
        self.entry_max_songs = ctk.CTkEntry(row_audio, width=40, fg_color="#2B2B2B", border_color="#555555", text_color="#FFFFFF")
        self.entry_max_songs.insert(0, "10")
        self.entry_max_songs.pack(side="left", padx=5)

        ctk.CTkLabel(self.scroll_basic, text="Danh sách bài hát CỐ ĐỊNH ở đầu (Mỗi bài 1 dòng):", text_color="#CCCCCC").pack(anchor="w", padx=10, pady=(5, 0))
        self.txt_fixed_songs = ctk.CTkTextbox(self.scroll_basic, height=60, fg_color="#2B2B2B", border_color="#555555", text_color="#FFFFFF")
        self.txt_fixed_songs.pack(fill="x", padx=10, pady=2)

        row_text_format = ctk.CTkFrame(self.scroll_basic, fg_color="transparent")
        row_text_format.pack(fill="x", padx=10, pady=2)
        ctk.CTkLabel(row_text_format, text="Kiểu Text:", text_color="#CCCCCC").pack(side="left")
        self.combo_text_format = ctk.CTkComboBox(row_text_format, values=["Tự động (Theo Template)", "Hàng ngang (A / B)", "Hàng dọc (1. A)"], width=160, fg_color="#2B2B2B", border_color="#555555", text_color="#FFFFFF")
        self.combo_text_format.pack(side="left", padx=5)

        self.chk_random_variants = ctk.CTkCheckBox(self.scroll_basic, text="Lấy random nhiều bản Mix cùng tên (1), (2)... (Có giãn cách)", text_color="#FFFFFF", checkbox_height=18, checkbox_width=18)
        self.chk_random_variants.pack(anchor="w", padx=15, pady=2)
        self.chk_keep_duplicates = ctk.CTkCheckBox(self.scroll_basic, text="Giữ bài (1), (2)... (Tắt để lọc trùng - Chế độ cũ)", text_color="#DDDDDD", checkbox_height=18, checkbox_width=18)
        self.chk_keep_duplicates.pack(anchor="w", padx=15, pady=2)
        self.chk_loop_video = ctk.CTkCheckBox(self.scroll_basic, text="Loop Video: Khớp thời lượng Background với Nhạc", text_color="#DDDDDD", checkbox_height=18, checkbox_width=18)
        self.chk_loop_video.pack(anchor="w", padx=15, pady=2)
        self.chk_multi_bg = ctk.CTkCheckBox(self.scroll_basic, text="Multi-BG: Rải đều Video nền vào phân đoạn", text_color="#DDDDDD", checkbox_height=18, checkbox_width=18)
        self.chk_multi_bg.pack(anchor="w", padx=15, pady=2)
        self.chk_skip_az = ctk.CTkCheckBox(self.scroll_basic, text="Bỏ qua Mix Xuôi (Video 1 random)", text_color="#DDDDDD", checkbox_height=18, checkbox_width=18)
        self.chk_skip_az.pack(anchor="w", padx=15, pady=2)
        self.chk_skip_za = ctk.CTkCheckBox(self.scroll_basic, text="Bỏ qua Mix Ngược (Video 2 random)", text_color="#DDDDDD", checkbox_height=18, checkbox_width=18)
        self.chk_skip_za.pack(anchor="w", padx=15, pady=2)
        
        self.chk_tele_render = ctk.CTkCheckBox(self.scroll_basic, text="📲 Gửi thông báo Telegram khi Render xong", text_color="#FFFFFF", font=ctk.CTkFont(weight="bold"))
        self.chk_tele_render.pack(anchor="w", padx=15, pady=10)
        self.chk_shuffle_bg = ctk.CTkCheckBox(self.scroll_basic, text="Trộn ngẫu nhiên (Shuffle) Video/Ảnh nền (Có giãn cách)", text_color="#DDDDDD", checkbox_height=18, checkbox_width=18)
        self.chk_shuffle_bg.pack(anchor="w", padx=15, pady=2)

        ctk.CTkLabel(self.scroll_basic, text="3. Ảnh/Video nền mới (Tùy chọn)", font=ctk.CTkFont(weight="bold")).pack(anchor="w", padx=10, pady=(10, 2))
        self.entry_bg = ctk.CTkEntry(self.scroll_basic, placeholder_text="Thư mục JPG, MP4...", fg_color="#2B2B2B", border_color="#555555", text_color="#FFFFFF")
        self.entry_bg.pack(fill="x", padx=10, pady=2)
        ctk.CTkButton(self.scroll_basic, text="Chọn Nền Mới", command=self.browse_bg, **btn_style).pack(anchor="e", padx=10)

        ctk.CTkLabel(self.scroll_basic, text="4. Số lượng Tạo & Nơi lưu", font=ctk.CTkFont(weight="bold")).pack(anchor="w", padx=10, pady=(10, 2))
        batch_frame = ctk.CTkFrame(self.scroll_basic, fg_color="transparent")
        batch_frame.pack(fill="x", padx=10, pady=2)
        ctk.CTkLabel(batch_frame, text="Số lượng Dự án:", text_color="#CCCCCC").pack(side="left")
        self.entry_batch = ctk.CTkEntry(batch_frame, width=50, fg_color="#2B2B2B", border_color="#555555", text_color="#FFFFFF")
        self.entry_batch.pack(side="left", padx=5)

        self.entry_tracklist = ctk.CTkEntry(self.scroll_basic, placeholder_text="Mặc định lưu Tracklist cùng thư mục Ảnh nền...", fg_color="#2B2B2B", border_color="#555555", text_color="#FFFFFF")
        self.entry_tracklist.pack(fill="x", padx=10, pady=2)
        ctk.CTkButton(self.scroll_basic, text="Chọn Nơi Lưu Tracklist", command=self.browse_tracklist, **btn_style).pack(anchor="e", padx=10)
        self.chk_export_thumb = ctk.CTkCheckBox(self.scroll_basic, text="Trích xuất Ảnh Bìa (draft_cover.jpg)", text_color="#DDDDDD", checkbox_height=18, checkbox_width=18)
        self.chk_export_thumb.pack(anchor="w", padx=15, pady=5)

        self.chk_show_auto_render = ctk.CTkCheckBox(self.scroll_basic, text="Mở rộng: Cấu hình Auto-Render RPA", font=ctk.CTkFont(weight="bold"), text_color="#FFFFFF", command=self.toggle_auto_render_frame, checkbox_height=20, checkbox_width=20)
        self.chk_show_auto_render.pack(anchor="w", padx=10, pady=(10, 5))

        self.auto_render_frame = ctk.CTkFrame(self.scroll_basic, fg_color="#262626", corner_radius=8)
        
        row_export = ctk.CTkFrame(self.auto_render_frame, fg_color="transparent")
        row_export.pack(fill="x", padx=10, pady=5)
        self.entry_export_dir = ctk.CTkEntry(row_export, placeholder_text="Thư mục dọn Video sau Render...", fg_color="#1E1E1E", border_color="#555555", text_color="#FFFFFF")
        self.entry_export_dir.pack(side="left", fill="x", expand=True, padx=(0,5))
        ctk.CTkButton(row_export, text="Chọn", width=60, command=self.browse_export_dir, **btn_style).pack(side="left")

        self.chk_use_opencv = ctk.CTkCheckBox(self.auto_render_frame, text="Bật OpenCV nhận diện nút bấm", text_color="#FFFFFF", checkbox_height=18, checkbox_width=18)
        self.chk_use_opencv.pack(anchor="w", padx=10, pady=5)

        row_template = ctk.CTkFrame(self.auto_render_frame, fg_color="transparent")
        row_template.pack(fill="x", padx=10, pady=2)
        self.entry_template_dir = ctk.CTkEntry(row_template, placeholder_text="Thư mục ảnh OpenCV...", fg_color="#1E1E1E", border_color="#555555", text_color="#FFFFFF")
        self.entry_template_dir.pack(side="left", fill="x", expand=True, padx=(0,5))
        ctk.CTkButton(row_template, text="Chọn", width=60, command=self.browse_template_dir, **btn_style).pack(side="left")

        row_script = ctk.CTkFrame(self.auto_render_frame, fg_color="transparent")
        row_script.pack(fill="x", padx=10, pady=2)
        self.entry_script = ctk.CTkEntry(row_script, placeholder_text="File kịch bản .txt...", fg_color="#1E1E1E", border_color="#555555", text_color="#FFFFFF")
        self.entry_script.pack(side="left", fill="x", expand=True, padx=(0,5))
        ctk.CTkButton(row_script, text="Chọn", width=60, command=self.browse_script, **btn_style).pack(side="left")
        
        row_get_pos = ctk.CTkFrame(self.auto_render_frame, fg_color="transparent")
        row_get_pos.pack(fill="x", padx=10, pady=2)
        ctk.CTkButton(row_get_pos, text="📍 Lấy tọa độ (F8)", width=120, command=self.start_get_mouse_pos, fg_color="#28a745", hover_color="#218838", text_color="#FFFFFF").pack(side="left")
        
        row_res = ctk.CTkFrame(self.auto_render_frame, fg_color="transparent")
        row_res.pack(fill="x", padx=10, pady=2)
        ctk.CTkLabel(row_res, text="Đổi Tọa Độ:", text_color="#CCCCCC").pack(side="left")
        self.combo_resolution = ctk.CTkComboBox(row_res, values=["Tự động phát hiện", "4K (3840x2160)", "2K (2560x1440)", "Full HD (1920x1080)"], width=140, fg_color="#1E1E1E", border_color="#555555", text_color="#FFFFFF", command=self.on_resolution_change)
        self.combo_resolution.pack(side="left", padx=5)

        self.chk_auto_render = ctk.CTkCheckBox(self.auto_render_frame, text="BẬT Tự động Render sau khi tạo", text_color="#FFFFFF", font=ctk.CTkFont(weight="bold"), checkbox_height=20, checkbox_width=20)
        self.chk_auto_render.pack(anchor="w", padx=10, pady=5)

        wait_frame = ctk.CTkFrame(self.auto_render_frame, fg_color="transparent")
        wait_frame.pack(fill="x", padx=10, pady=5)
        ctk.CTkLabel(wait_frame, text="Chờ Mở:", text_color="#CCCCCC").pack(side="left")
        self.entry_open_wait = ctk.CTkEntry(wait_frame, width=35, fg_color="#1E1E1E", border_color="#555555", text_color="#FFFFFF")
        self.entry_open_wait.pack(side="left", padx=2)
        ctk.CTkLabel(wait_frame, text="Popup:", text_color="#CCCCCC").pack(side="left", padx=(5,0))
        self.entry_popup_wait = ctk.CTkEntry(wait_frame, width=35, fg_color="#1E1E1E", border_color="#555555", text_color="#FFFFFF")
        self.entry_popup_wait.pack(side="left", padx=2)
        ctk.CTkLabel(wait_frame, text="Timeout:", text_color="#CCCCCC").pack(side="left", padx=(5,0))
        self.entry_render_wait = ctk.CTkEntry(wait_frame, width=35, fg_color="#1E1E1E", border_color="#555555", text_color="#FFFFFF")
        self.entry_render_wait.pack(side="left", padx=2)

        self.chk_disable_scale = ctk.CTkCheckBox(self.auto_render_frame, text="Tắt Auto-Scale tọa độ", text_color="#DDDDDD", checkbox_height=18, checkbox_width=18)
        self.chk_disable_scale.pack(anchor="w", padx=10, pady=(0, 10))

    def setup_audio_timeline_tab(self, btn_style):
        self.scroll_audio_tl = ctk.CTkScrollableFrame(self.tab_audio_timeline, fg_color="transparent")
        self.scroll_audio_tl.pack(fill="both", expand=True)

        ctk.CTkLabel(self.scroll_audio_tl, text="🎧 AUDIO & TIMELINE PRO", font=ctk.CTkFont(size=22, weight="bold"), text_color="#FFFFFF").pack(anchor="w", padx=20, pady=(20, 5))

        def create_input_row(parent, label_text, placeholder):
            row = ctk.CTkFrame(parent, fg_color="transparent")
            row.pack(fill="x", padx=20, pady=5)
            row.grid_columnconfigure(1, weight=1)
            ctk.CTkLabel(row, text=label_text, font=ctk.CTkFont(weight="bold"), text_color="#CCCCCC", width=220, anchor="w").grid(row=0, column=0, sticky="w", padx=(0, 10))
            entry = ctk.CTkEntry(row, placeholder_text=placeholder, fg_color="#1E1E2E", text_color="#CCCCCC", border_color="#45475A", height=32)
            entry.grid(row=0, column=1, sticky="ew", padx=(0, 10))
            return entry, row

        # ====== PHẦN 1: CẮT VOICE (LẺ) ======
        frame_cut = ctk.CTkFrame(self.scroll_audio_tl, fg_color="#181825", border_width=1, border_color="#313244", corner_radius=10)
        frame_cut.pack(fill="x", padx=20, pady=10)
        ctk.CTkLabel(frame_cut, text="✂️ 1. CẮT VOICE (CHẠY LẺ)", font=ctk.CTkFont(size=16, weight="bold"), text_color="#FFFFFF").pack(anchor="w", padx=20, pady=(15, 5))
        
        self.entry_slice_script, row_txt = create_input_row(frame_cut, "File Kịch Bản (.txt):", "Đường dẫn kịch bản...")
        ctk.CTkButton(row_txt, text="📂 Chọn", width=80, height=32, command=lambda: self.browse_file_generic(self.entry_slice_script, "Text", "*.txt"), **btn_style).grid(row=0, column=2)
        
        self.entry_slice_audio, row_aud = create_input_row(frame_cut, "Audio Gốc (.mp3/.wav):", "Đường dẫn file Audio gốc...")
        ctk.CTkButton(row_aud, text="📂 Chọn", width=80, height=32, command=lambda: self.browse_file_generic(self.entry_slice_audio, "Audio", "*.mp3 *.wav *.m4a"), **btn_style).grid(row=0, column=2)
        
        self.entry_slice_out, row_out = create_input_row(frame_cut, "Thư mục xuất Voice:", "Nơi lưu các file voice đã cắt...")
        ctk.CTkButton(row_out, text="📂 Chọn", width=80, height=32, command=lambda: self.browse_dir_generic(self.entry_slice_out), **btn_style).grid(row=0, column=2)
        
        self.btn_run_cut = ctk.CTkButton(frame_cut, text="▶ CHẠY CẮT VOICE LẺ", height=35, font=ctk.CTkFont(weight="bold"), fg_color="#313244", hover_color="#45475A", command=self.run_audio_slicing)
        self.btn_run_cut.pack(anchor="w", padx=20, pady=(5, 15))

        # ====== PHẦN 2: ĐỒNG BỘ TIMELINE (LẺ) ======
        frame_sync = ctk.CTkFrame(self.scroll_audio_tl, fg_color="#181825", border_width=1, border_color="#313244", corner_radius=10)
        frame_sync.pack(fill="x", padx=20, pady=10)
        ctk.CTkLabel(frame_sync, text="🛠 2. ĐỒNG BỘ TIMELINE (CHẠY LẺ)", font=ctk.CTkFont(size=16, weight="bold"), text_color="#FFFFFF").pack(anchor="w", padx=20, pady=(15, 5))
        
        self.entry_sync_json, row_sync = create_input_row(frame_sync, "File draft_content.json:", "Chỉ định file JSON của project...")
        ctk.CTkButton(row_sync, text="📂 Chọn", width=80, height=32, command=self.browse_sync_json, **btn_style).grid(row=0, column=2)
        
        self.chk_restart_sync = ctk.CTkCheckBox(frame_sync, text="🔁 Tự động khởi động lại CapCut sau khi đồng bộ", text_color="#FFFFFF", font=ctk.CTkFont(weight="bold"))
        self.chk_restart_sync.pack(anchor="w", padx=20, pady=5)
        
        self.btn_run_sync = ctk.CTkButton(frame_sync, text="▶ CHẠY ĐỒNG BỘ LẺ", height=35, font=ctk.CTkFont(weight="bold"), fg_color="#313244", hover_color="#45475A", command=self.run_sync_timeline)
        self.btn_run_sync.pack(anchor="w", padx=20, pady=(5, 15))

        # ====== PHẦN 3: TẠO PROJECT HOÀN CHỈNH (CHẠY CHUNG) ======
        frame_mix = ctk.CTkFrame(self.scroll_audio_tl, fg_color="#181825", border_width=1, border_color="#313244", corner_radius=10)
        frame_mix.pack(fill="x", padx=20, pady=10)
        ctk.CTkLabel(frame_mix, text="🚀 3. TẠO PROJECT AUTO-MIX (CHẠY CHUNG)", font=ctk.CTkFont(size=16, weight="bold"), text_color="#FFFFFF").pack(anchor="w", padx=20, pady=(15, 5))
        ctk.CTkLabel(frame_mix, text="Sử dụng Script + Audio gốc + Thư mục Ảnh để tự thay thế template và đồng bộ.", text_color="#CCCCCC", justify="left").pack(anchor="w", padx=20, pady=(0, 10))

        self.entry_img_dir, row_img = create_input_row(frame_mix, "Thư mục chứa Ảnh thật:", "Nơi chứa ảnh 1, 2, 3...")
        ctk.CTkButton(row_img, text="📂 Chọn", width=80, height=32, command=lambda: self.browse_dir_generic(self.entry_img_dir), **btn_style).grid(row=0, column=2)

        self.entry_template_proj, row_tpl = create_input_row(frame_mix, "Thư mục Template Project:", "Project mẫu có sẵn dummy ảnh/voice...")
        ctk.CTkButton(row_tpl, text="📂 Chọn", width=80, height=32, command=lambda: self.browse_dir_generic(self.entry_template_proj), **btn_style).grid(row=0, column=2)

        self.entry_new_proj_name, _ = create_input_row(frame_mix, "Tên Project Mới:", "Tên lưu trong CapCut (Sẽ thêm ngày tháng)")

        self.chk_skip_slice = ctk.CTkCheckBox(frame_mix, text="Bỏ qua bước cắt Voice (Sử dụng thư mục Voice cắt sẵn)", text_color="#FFFFFF", command=self.toggle_mix_voices)
        self.chk_skip_slice.pack(anchor="w", padx=20, pady=(10, 0))

        self.entry_mix_voices, self.row_mix_voices = create_input_row(frame_mix, "Thư mục Voice đã cắt:", "Nơi chứa các file voice lẻ...")
        ctk.CTkButton(self.row_mix_voices, text="📂 Chọn", width=80, height=32, command=lambda: self.browse_dir_generic(self.entry_mix_voices), **btn_style).grid(row=0, column=2)
        self.row_mix_voices.pack_forget() # Hide by default

        self.chk_tele_automix = ctk.CTkCheckBox(frame_mix, text="📲 Gửi thông báo Telegram khi tạo xong", text_color="#FFFFFF", font=ctk.CTkFont(weight="bold"))
        self.chk_tele_automix.pack(anchor="w", padx=20, pady=5)
        self.chk_restart_automix = ctk.CTkCheckBox(frame_mix, text="🔁 Tự động khởi động lại CapCut để nhận Project mới", text_color="#FFFFFF", font=ctk.CTkFont(weight="bold"))
        self.chk_restart_automix.pack(anchor="w", padx=20, pady=5)

        self.btn_run_automix = ctk.CTkButton(frame_mix, text="🚀 KHỞI CHẠY TẠO PROJECT & ĐỒNG BỘ", height=45, font=ctk.CTkFont(weight="bold", size=15), fg_color="#313244", hover_color="#45475A", text_color="#FFFFFF", command=self.run_automix_workflow)
        self.btn_run_automix.pack(fill="x", padx=20, pady=(10, 20))

    def toggle_mix_voices(self):
        if self.chk_skip_slice.get() == 1:
            self.row_mix_voices.pack(fill="x", padx=20, pady=5, before=self.chk_tele_automix)
        else:
            self.row_mix_voices.pack_forget()

    def setup_system_tab(self):
        self.scroll_system = ctk.CTkScrollableFrame(self.tab_system, fg_color="transparent")
        self.scroll_system.pack(fill="both", expand=True)
        ctk.CTkLabel(self.scroll_system, text="Tính Năng Bot & Tự Động", font=ctk.CTkFont(size=16, weight="bold"), text_color="#FFCC00").pack(anchor="w", padx=10, pady=(10, 5))
        self.chk_lock_screen = ctk.CTkCheckBox(self.scroll_system, text="Bật Màn hình Khóa (RPA Shield) chặn bấm nhầm khi Render", text_color="#FFFFFF")
        self.chk_lock_screen.pack(anchor="w", padx=20, pady=5)
        self.chk_clear_cache = ctk.CTkCheckBox(self.scroll_system, text="Tự động dọn rác CapCut Cache (Giải phóng Ổ C) sau khi xong", text_color="#FFFFFF")
        self.chk_clear_cache.pack(anchor="w", padx=20, pady=5)
        self.chk_restart_capcut = ctk.CTkCheckBox(self.scroll_system, text="Tự khởi động lại CapCut sau khi hoàn thành toàn bộ", text_color="#FFFFFF")
        self.chk_restart_capcut.pack(anchor="w", padx=20, pady=5)
        self.chk_auto_shutdown = ctk.CTkCheckBox(self.scroll_system, text="Tự động TẮT MÁY TÍNH (Shutdown) khi hoàn thành mẻ", text_color="#FFFFFF", font=ctk.CTkFont(weight="bold"))
        self.chk_auto_shutdown.pack(anchor="w", padx=20, pady=15)
        ctk.CTkLabel(self.scroll_system, text="Telegram Notifications (Nhận tin báo qua đt)", font=ctk.CTkFont(size=14, weight="bold")).pack(anchor="w", padx=10, pady=(20, 5))
        ctk.CTkLabel(self.scroll_system, text="Bot Token:", text_color="#CCCCCC").pack(anchor="w", padx=20)
        self.entry_tele_token = ctk.CTkEntry(self.scroll_system, placeholder_text="123456:ABC-DEF1234...", width=300, fg_color="#2B2B2B", border_color="#555555", text_color="#FFFFFF")
        self.entry_tele_token.pack(anchor="w", padx=20, pady=2)
        ctk.CTkLabel(self.scroll_system, text="Chat ID:", text_color="#CCCCCC").pack(anchor="w", padx=20)
        self.entry_tele_chat = ctk.CTkEntry(self.scroll_system, placeholder_text="Ví dụ: 123456789", width=150, fg_color="#2B2B2B", border_color="#555555", text_color="#FFFFFF")
        self.entry_tele_chat.pack(anchor="w", padx=20, pady=2)
        
        self.btn_test_tele = ctk.CTkButton(self.scroll_system, text="🚀 Test Bot", fg_color="#313244", hover_color="#45475A", text_color="#FFFFFF", command=self.test_telegram_bot)
        self.btn_test_tele.pack(anchor="w", padx=20, pady=10)

    def send_telegram_msg(self, message):
        token = self.entry_tele_token.get().strip()
        chat_id = self.entry_tele_chat.get().strip()
        if not token or not chat_id: return False
        url = f"https://api.telegram.org/bot{token}/sendMessage"
        data = urllib.parse.urlencode({'chat_id': chat_id, 'text': message}).encode('utf-8')
        try:
            req = urllib.request.Request(url, data=data)
            urllib.request.urlopen(req, timeout=5)
            return True
        except Exception as e:
            self.log(f"Lỗi gửi Telegram: {e}")
            return False

    def test_telegram_bot(self):
        threading.Thread(target=self._test_telegram_bot_thread, daemon=True).start()

    def _test_telegram_bot_thread(self):
        self.log("Đang gửi test Telegram...")
        if self.send_telegram_msg("🤖 Xin chào! Bot CapCut Batch Tool đã kết nối thành công tới Telegram của bạn."):
            self.log("Gửi Telegram thành công!")
            messagebox.showinfo("Telegram", "Đã gửi tin nhắn test thành công!")
        else:
            messagebox.showerror("Lỗi", "Gửi test thất bại! Kiểm tra lại Token và Chat ID hoặc kết nối mạng.")

    def setup_ai_tab(self):
        self.scroll_ai = ctk.CTkScrollableFrame(self.tab_ai, fg_color="transparent")
        self.scroll_ai.pack(fill="both", expand=True)
        
        # --- PHẦN 1: AI PROMPT ---
        ctk.CTkLabel(self.scroll_ai, text="🚀 AUTO NHẬP PROMPT CAPCUT", font=ctk.CTkFont(size=18, weight="bold"), text_color="#FFFFFF").pack(pady=(10, 5))
        
        frame_coord = ctk.CTkFrame(self.scroll_ai, fg_color="#262626", border_width=1, border_color="#444444")
        frame_coord.pack(fill="x", padx=10, pady=5)
        ctk.CTkLabel(frame_coord, text="📍 TỌA ĐỘ LÀM VIỆC", font=ctk.CTkFont(weight="bold"), text_color="#FFFFFF").grid(row=0, column=0, columnspan=5, sticky="w", padx=10, pady=10)

        def add_coord_row(parent, row, label_text, default_x, default_y):
            ctk.CTkLabel(parent, text=label_text).grid(row=row, column=0, sticky="e", padx=10, pady=5)
            ctk.CTkLabel(parent, text="X:").grid(row=row, column=1)
            e_x = ctk.CTkEntry(parent, width=60, justify="center")
            e_x.insert(0, default_x)
            e_x.grid(row=row, column=2, padx=5)
            ctk.CTkLabel(parent, text="Y:").grid(row=row, column=3)
            e_y = ctk.CTkEntry(parent, width=60, justify="center")
            e_y.insert(0, default_y)
            e_y.grid(row=row, column=4, padx=5)
            return e_x, e_y

        self.entry_prompt_x1, self.entry_prompt_y1 = add_coord_row(frame_coord, 1, "Bước 1 (Ô nhập Prompt):", "216", "238")
        self.entry_prompt_x2, self.entry_prompt_y2 = add_coord_row(frame_coord, 2, "Bước 2 (Nút Tạo Video):", "649", "745")
        self.entry_prompt_x3, self.entry_prompt_y3 = add_coord_row(frame_coord, 3, "Bước 3 (Click ngoài Timeline):", "2333", "901")

        frame_time = ctk.CTkFrame(self.scroll_ai, fg_color="#262626", border_width=1, border_color="#444444")
        frame_time.pack(fill="x", padx=10, pady=10)
        
        wait_inner = ctk.CTkFrame(frame_time, fg_color="transparent")
        wait_inner.pack(anchor="w", padx=10, pady=10)
        ctk.CTkLabel(wait_inner, text="Thời gian chờ AI tạo xong (giây):", font=ctk.CTkFont(weight="bold"), text_color="#FFFFFF").pack(side="left")
        self.entry_prompt_wait = ctk.CTkEntry(wait_inner, width=60, justify="center")
        self.entry_prompt_wait.insert(0, "45")
        self.entry_prompt_wait.pack(side="left", padx=10)

        ctk.CTkLabel(self.scroll_ai, text="📝 DANH SÁCH PROMPT (Mỗi dòng 1 prompt):", font=ctk.CTkFont(weight="bold"), text_color="#FFFFFF").pack(anchor="w", padx=10, pady=(5, 0))
        self.txt_prompts = ctk.CTkTextbox(self.scroll_ai, height=120, fg_color="#1E1E1E", border_color="#555555", text_color="#FFFFFF")
        self.txt_prompts.pack(fill="x", padx=10, pady=5)
        self.txt_prompts.insert("1.0", '1. {"positive": "Prompt số 1..."}\n\n2. {"positive": "Prompt số 2..."}')

        prompt_btn_frame = ctk.CTkFrame(self.scroll_ai, fg_color="transparent")
        prompt_btn_frame.pack(pady=10)
        self.btn_start_prompt = ctk.CTkButton(prompt_btn_frame, text="▶ CHẠY AUTO (F9)", font=ctk.CTkFont(weight="bold"), fg_color="#2ecc71", hover_color="#27ae60", text_color="#FFFFFF", command=self.start_prompt_thread)
        self.btn_start_prompt.pack(side="left", padx=10)
        self.btn_stop_prompt = ctk.CTkButton(prompt_btn_frame, text="⏹ DỪNG LẠI (ESC)", font=ctk.CTkFont(weight="bold"), fg_color="#e74c3c", hover_color="#c0392b", text_color="#FFFFFF", state="disabled", command=self.stop_prompt_thread)
        self.btn_stop_prompt.pack(side="left", padx=10)

        separator = ctk.CTkFrame(self.scroll_ai, height=2, fg_color="#444444")
        separator.pack(fill="x", padx=20, pady=20)

        # --- PHẦN 2: AI BYPASS WATERMARK ---
        ctk.CTkLabel(self.scroll_ai, text="🔓 AUTO BYPASS WATERMARK 1-CLICK", font=ctk.CTkFont(size=18, weight="bold"), text_color="#e67e22").pack(pady=(5, 5))
        ctk.CTkLabel(self.scroll_ai, text="Tự động sao chép video, ngắt kết nối với AI Folder và Backup JSON", text_color="#AAAAAA").pack(pady=(0, 10))

        f_bypass = ctk.CTkFrame(self.scroll_ai, fg_color="#262626", border_width=1, border_color="#444444")
        f_bypass.pack(fill="x", padx=10, pady=5)
        
        ctk.CTkLabel(f_bypass, text="1. Chọn file dự án (draft_content.json)", font=ctk.CTkFont(size=14, weight="bold"), text_color="#e67e22").pack(anchor="w", padx=10, pady=(10, 5))
        wrap_bypass = ctk.CTkFrame(f_bypass, fg_color="transparent")
        wrap_bypass.pack(fill="x", padx=10, pady=(0, 15))
        
        self.entry_bypass_json = ctk.CTkEntry(wrap_bypass, placeholder_text="Đường dẫn file draft_content.json...", fg_color="#1E1E1E", text_color="#FFFFFF", textvariable=self.var_draft_json)
        self.entry_bypass_json.pack(side="left", fill="x", expand=True, padx=(0, 10))
        ctk.CTkButton(wrap_bypass, text="📂 Duyệt File...", fg_color="#d35400", hover_color="#e67e22", width=100, command=self.browse_bypass_json).pack(side="right")

        ctk.CTkButton(self.scroll_ai, text="⚙️ CHẠY GỠ WATERMARK (1 CLICK)", font=ctk.CTkFont(size=14, weight="bold"), fg_color="#e67e22", hover_color="#d35400", text_color="#FFFFFF", height=40, command=self.run_ai_bypass).pack(fill="x", padx=10, pady=(10, 20))

    def setup_utils_tab(self, btn_style):
        self.scroll_utils = ctk.CTkScrollableFrame(self.tab_utils, fg_color="transparent")
        self.scroll_utils.pack(fill="both", expand=True)

        # ====== PHẦN: ĐỔI TÊN HÀNG LOẠT ======
        frame_rename = ctk.CTkFrame(self.scroll_utils, fg_color="#262626", border_width=1, border_color="#444444")
        frame_rename.pack(fill="x", padx=10, pady=(10, 20))

        ctk.CTkLabel(frame_rename, text="🔄 CÔNG CỤ ĐỔI TÊN ẢNH/NHẠC (AI RENAME PRO)", font=ctk.CTkFont(size=16, weight="bold"), text_color="#FFFFFF").pack(anchor="w", padx=15, pady=(10, 5))

        row_rename_dir = ctk.CTkFrame(frame_rename, fg_color="transparent")
        row_rename_dir.pack(fill="x", padx=15, pady=5)
        self.entry_rename_dir = ctk.CTkEntry(row_rename_dir, placeholder_text="1. Chọn thư mục chứa ảnh/nhạc...", fg_color="#1E1E1E", text_color="#FFFFFF")
        self.entry_rename_dir.pack(side="left", fill="x", expand=True, padx=(0, 10))
        ctk.CTkButton(row_rename_dir, text="📂 Duyệt Thư Mục...", width=120, command=self.browse_rename_dir, **btn_style).pack(side="left")

        # Nested Tabs for Rename Tool
        self.rename_tabs = ctk.CTkTabview(frame_rename, height=250)
        self.rename_tabs.pack(fill="x", padx=15, pady=(10, 15))

        self.tab_rn_prompt = self.rename_tabs.add("Chế Độ 1: Theo Prompt (AI)")
        self.tab_rn_replace = self.rename_tabs.add("Chế Độ 2: Tìm & Thay Thế (Cũ)")

        # Setup Rename Tab 1 (Prompt)
        ctrl_frame = ctk.CTkFrame(self.tab_rn_prompt, fg_color="transparent")
        ctrl_frame.pack(fill="x", pady=(0, 10))
        ctk.CTkLabel(ctrl_frame, text="Cách ghép ảnh với Prompt:").pack(side="left", padx=(0, 5))
        sort_opts = [
            "✨ Ghép Thông Minh (Tự động đối chiếu độ giống nhau)", 
            "Theo Thứ tự Tên File (A-Z)", 
            "Theo Thời Gian Tạo file (Cũ -> Mới)"
        ]
        self.rename_sort_method = ctk.StringVar(value=sort_opts[0])
        ctk.CTkComboBox(ctrl_frame, variable=self.rename_sort_method, values=sort_opts, width=320, fg_color="#1E1E1E").pack(side="left")
        ctk.CTkButton(ctrl_frame, text="🔍 Lọc Ảnh Thiếu/Đủ", width=120, command=self.check_missing_images).pack(side="left", padx=(10, 0))

        ctk.CTkLabel(self.tab_rn_prompt, text="Paste danh sách Prompt của bạn vào đây (Mỗi dòng tương ứng với 1 file):", text_color="#AAAAAA").pack(anchor="w")
        self.txt_rename_prompt = ctk.CTkTextbox(self.tab_rn_prompt, height=120, fg_color="#1E1E1E", border_color="#555555")
        self.txt_rename_prompt.pack(fill="x", expand=True, pady=(5, 0))

        # Setup Rename Tab 2 (Replace)
        ctk.CTkLabel(self.tab_rn_replace, text="Nhập quy tắc (Cú pháp: Tên Cũ -> Tên Mới):", text_color="#AAAAAA").pack(anchor="w")
        self.txt_rename_replace = ctk.CTkTextbox(self.tab_rn_replace, height=150, fg_color="#1E1E1E", border_color="#555555")
        self.txt_rename_replace.pack(fill="x", expand=True, pady=(5, 0))

        # Setup Rename Tab 3 (Format)
        self.tab_rn_format = self.rename_tabs.add("Chế Độ 3: Format Số (Padding)")
        ctk.CTkLabel(self.tab_rn_format, text="Công cụ cắt/ghép số vào đầu tên file (Không làm thay đổi phần đuôi mở rộng):", text_color="#AAAAAA").pack(anchor="w")
        
        row_fmt_del = ctk.CTkFrame(self.tab_rn_format, fg_color="transparent")
        row_fmt_del.pack(fill="x", pady=10)
        ctk.CTkLabel(row_fmt_del, text="1. Xóa bớt ký tự ở đầu tên file (Ví dụ nhập 3: '100_A.jpg' -> '_A.jpg'):").pack(side="left", padx=(0, 10))
        self.entry_fmt_del = ctk.CTkEntry(row_fmt_del, width=80, placeholder_text="0")
        self.entry_fmt_del.pack(side="left")

        row_fmt_add = ctk.CTkFrame(self.tab_rn_format, fg_color="transparent")
        row_fmt_add.pack(fill="x", pady=5)
        ctk.CTkLabel(row_fmt_add, text="2. Thêm số '0' vào đầu (Ví dụ nhập 2: '1.jpg' -> '001.jpg'):").pack(side="left", padx=(0, 10))
        self.entry_fmt_add = ctk.CTkEntry(row_fmt_add, width=80, placeholder_text="0")
        self.entry_fmt_add.pack(side="left")

        # Action Buttons for Rename
        action_frame = ctk.CTkFrame(frame_rename, fg_color="transparent")
        action_frame.pack(fill="x", padx=15, pady=(0, 15))
        
        ctk.CTkButton(action_frame, text="👀 BƯỚC 2: QUÉT & XEM TRƯỚC", fg_color="#555555", hover_color="#777777", command=self.preview_rename).pack(side="left")
        ctk.CTkButton(action_frame, text="⚡ BƯỚC 3: ÁP DỤNG ĐỔI TÊN", font=ctk.CTkFont(weight="bold"), fg_color="#444444", hover_color="#666666", command=self.execute_rename).pack(side="right")

        # Load Rename Histories
        if os.path.exists(CONFIG_PROMPT_RENAME):
            try:
                with open(CONFIG_PROMPT_RENAME, 'r', encoding='utf-8') as f: self.txt_rename_prompt.insert("1.0", f.read())
            except: pass
        if os.path.exists(CONFIG_REPLACE_RENAME):
            try:
                with open(CONFIG_REPLACE_RENAME, 'r', encoding='utf-8') as f: self.txt_rename_replace.insert("1.0", f.read())
            except: pass

    # ==========================================
    # QUẢN LÝ PROFILE VÀ CẤU HÌNH
    # ==========================================
    def get_ui_state(self):
        return {
            "proj": self.entry_proj.get(),
            "audio": self.entry_audio.get(),
            "bg": self.entry_bg.get(),
            "tracklist_dir": self.entry_tracklist.get(),
            "export_dir": self.entry_export_dir.get(),
            "template_dir": self.entry_template_dir.get(),
            "script_file_path": self.entry_script.get(),
            "fixed_songs": self.txt_fixed_songs.get("1.0", "end-1c"),
            "script_resolution": self.combo_resolution.get(),
            "show_auto_render": self.chk_show_auto_render.get() == 1,
            "use_opencv": self.chk_use_opencv.get() == 1,
            "export_thumb": self.chk_export_thumb.get() == 1,
            "audio_ver": self.combo_audio_ver.get(),
            "max_songs": self.entry_max_songs.get(),
            "text_format": self.combo_text_format.get(),
            "random_variants": self.chk_random_variants.get() == 1,
            "keep_duplicates": self.chk_keep_duplicates.get() == 1,
            "multi_bg": self.chk_multi_bg.get() == 1,
            "loop_video": self.chk_loop_video.get() == 1,
            "skip_az": self.chk_skip_az.get() == 1,
            "skip_za": self.chk_skip_za.get() == 1,
            "shuffle_bg": self.chk_shuffle_bg.get() == 1,
            "auto_render": self.chk_auto_render.get() == 1,
            "auto_restart": self.chk_restart_capcut.get() == 1,
            "disable_scale": self.chk_disable_scale.get() == 1,
            "batch": self.entry_batch.get(),
            "render_wait": self.entry_render_wait.get(),
            "open_wait": self.entry_open_wait.get(),
            "popup_wait": self.entry_popup_wait.get(),
            "custom_draft_path": getattr(self, "custom_draft_path", ""),
            "lock_screen": self.chk_lock_screen.get() == 1,
            "clear_cache": self.chk_clear_cache.get() == 1,
            "auto_shutdown": self.chk_auto_shutdown.get() == 1,
            "tele_render": self.chk_tele_render.get() == 1,
            "tele_token": self.entry_tele_token.get(),
            "tele_chat": self.entry_tele_chat.get(),
            # AI Prompt Config
            "prompt_x1": self.entry_prompt_x1.get(), "prompt_y1": self.entry_prompt_y1.get(),
            "prompt_x2": self.entry_prompt_x2.get(), "prompt_y2": self.entry_prompt_y2.get(),
            "prompt_x3": self.entry_prompt_x3.get(), "prompt_y3": self.entry_prompt_y3.get(),
            "prompt_wait": self.entry_prompt_wait.get(),
            "bypass_json": self.entry_bypass_json.get(),
            # Utils Config
            "sync_json": self.entry_sync_json.get(),
            "rename_dir": self.entry_rename_dir.get(),
            "slice_script": getattr(self, "entry_slice_script", ctk.CTkEntry(self)).get(),
            "slice_audio": getattr(self, "entry_slice_audio", ctk.CTkEntry(self)).get(),
            "slice_out": getattr(self, "entry_slice_out", ctk.CTkEntry(self)).get(),
            "img_dir": getattr(self, "entry_img_dir", ctk.CTkEntry(self)).get(),
            "template_proj": getattr(self, "entry_template_proj", ctk.CTkEntry(self)).get(),
            "new_proj_name": getattr(self, "entry_new_proj_name", ctk.CTkEntry(self)).get(),
            "tele_chat": getattr(self, "entry_tele_chat", ctk.CTkEntry(self)).get(),
            "tele_render": getattr(self, "chk_tele_render", ctk.CTkCheckBox(self)).get() == 1,
            "tele_automix": getattr(self, "chk_tele_automix", ctk.CTkCheckBox(self)).get() == 1,
            "skip_slice": getattr(self, "chk_skip_slice", ctk.CTkCheckBox(self)).get() == 1,
            "mix_voices": getattr(self, "entry_mix_voices", ctk.CTkEntry(self)).get(),
            
            # Ultra Config
            "ultra_draft_json": getattr(self, "ultra_input_file_path", ""),
            "ultra_api_key": getattr(self, "entry_ultra_api", ctk.CTkEntry(self)).get() if hasattr(self, 'entry_ultra_api') else "",
            "ultra_sfx_dir": getattr(self, "ultra_sfx_folder_path", ""),
            "ultra_sync_img": getattr(self, "opt_sync_image_to_audio", ctk.BooleanVar(value=True)).get() if hasattr(self, 'opt_sync_image_to_audio') else True,
            "ultra_mix_music": getattr(self, "opt_ultra_music_mix", ctk.BooleanVar(value=False)).get() if hasattr(self, 'opt_ultra_music_mix') else False,
            "ultra_custom_order": getattr(self, "opt_custom_audio_order", ctk.BooleanVar(value=False)).get() if hasattr(self, 'opt_custom_audio_order') else False,
            "ultra_random_vid": getattr(self, "opt_randomize_video", ctk.BooleanVar(value=False)).get() if hasattr(self, 'opt_randomize_video') else False,
            "ultra_dyn_motion": getattr(self, "opt_dynamic_motion", ctk.BooleanVar(value=True)).get() if hasattr(self, 'opt_dynamic_motion') else True,
            "ultra_auto_trans": getattr(self, "opt_auto_transition", ctk.BooleanVar(value=True)).get() if hasattr(self, 'opt_auto_transition') else True,
            "ultra_clear_trans": getattr(self, "opt_clear_transitions", ctk.BooleanVar(value=False)).get() if hasattr(self, 'opt_clear_transitions') else False,
            "ultra_auto_fill": getattr(self, "opt_auto_fill_canvas", ctk.BooleanVar(value=True)).get() if hasattr(self, 'opt_auto_fill_canvas') else True,
            "ultra_norm_vol": getattr(self, "opt_normalize_volume", ctk.BooleanVar(value=True)).get() if hasattr(self, 'opt_normalize_volume') else True,
            "ultra_rev_time": getattr(self, "opt_reverse_timeline", ctk.BooleanVar(value=False)).get() if hasattr(self, 'opt_reverse_timeline') else False,
            "ultra_auto_sub": getattr(self, "opt_auto_subtitles", ctk.BooleanVar(value=False)).get() if hasattr(self, 'opt_auto_subtitles') else False,
            "ultra_ai_sfx": getattr(self, "opt_ai_sfx_generator", ctk.BooleanVar(value=False)).get() if hasattr(self, 'opt_ai_sfx_generator') else False,
            "ultra_audio_order": getattr(self, "entry_ultra_audio_order", ctk.CTkEntry(self)).get() if hasattr(self, 'entry_ultra_audio_order') else "" 
        }

    def set_ui_state(self, data):
        def set_entry(entry, key, default=""):
            if hasattr(self, 'entry_slice_script') or key not in ['slice_script', 'slice_audio', 'slice_out', 'img_dir', 'template_proj', 'new_proj_name']:
                try:
                    entry.delete(0, 'end'); entry.insert(0, data.get(key, default))
                except: pass
            
        def set_check(chk, key, default=False):
            try:
                if data.get(key, default): chk.select()
                else: chk.deselect()
            except: pass
            
        self.custom_draft_path = data.get("custom_draft_path", "")

        set_entry(self.entry_proj, "proj")
        set_entry(self.entry_audio, "audio")
        set_entry(self.entry_bg, "bg")
        set_entry(self.entry_tracklist, "tracklist_dir")
        set_entry(self.entry_export_dir, "export_dir")
        
        t_dir = data.get("template_dir", "")
        if not t_dir:
            base_dir = os.path.dirname(sys.executable) if getattr(sys, 'frozen', False) else os.path.dirname(os.path.abspath(__file__))
            default_img_dir = os.path.join(base_dir, "Bot_Images")
            if os.path.exists(default_img_dir): t_dir = default_img_dir
        set_entry(self.entry_template_dir, "template_dir", t_dir)
        
        script_val = data.get("script_file_path", "")
        if not script_val and "click_script_content" in data:
            base_dir = os.path.dirname(sys.executable) if getattr(sys, 'frozen', False) else os.path.dirname(os.path.abspath(__file__))
            script_val = os.path.join(base_dir, "kich_ban.txt")
            try:
                if not os.path.exists(script_val):
                    with open(script_val, "w", encoding="utf-8") as f: f.write(data.get("click_script_content", ""))
            except: pass
        set_entry(self.entry_script, "script_file_path", script_val)
        
        self.txt_fixed_songs.delete("1.0", "end")
        self.txt_fixed_songs.insert("1.0", data.get("fixed_songs", ""))
        
        set_entry(self.entry_max_songs, "max_songs", "10")
        set_entry(self.entry_batch, "batch", "3")
        set_entry(self.entry_render_wait, "render_wait", "15")
        set_entry(self.entry_open_wait, "open_wait", "20")
        set_entry(self.entry_popup_wait, "popup_wait", "1.5")
        
        set_entry(self.entry_tele_token, "tele_token")
        set_entry(self.entry_tele_chat, "tele_chat")
        
        set_entry(self.entry_prompt_x1, "prompt_x1", "216"); set_entry(self.entry_prompt_y1, "prompt_y1", "238")
        set_entry(self.entry_prompt_x2, "prompt_x2", "497"); set_entry(self.entry_prompt_y2, "prompt_y2", "737")
        set_entry(self.entry_prompt_x3, "prompt_x3", "2333"); set_entry(self.entry_prompt_y3, "prompt_y3", "901")
        set_entry(self.entry_prompt_wait, "prompt_wait", "45")
        set_entry(self.entry_bypass_json, "bypass_json", "")
        
        # Utils configs
        set_entry(self.entry_sync_json, "sync_json", "")
        set_entry(self.entry_rename_dir, "rename_dir", "")
        
        if hasattr(self, 'entry_slice_script'):
            set_entry(self.entry_slice_script, "slice_script", "")
            set_entry(self.entry_slice_audio, "slice_audio", "")
            set_entry(self.entry_slice_out, "slice_out", "")
            set_entry(self.entry_img_dir, "img_dir", "")
            set_entry(self.entry_template_proj, "template_proj", "")
            set_entry(self.entry_new_proj_name, "new_proj_name", "")
            
        if hasattr(self, 'entry_tele_token'):
            set_entry(self.entry_tele_token, "tele_token", "")
            set_entry(self.entry_tele_chat, "tele_chat", "")
            
        if hasattr(self, 'chk_skip_slice'):
            set_check(self.chk_skip_slice, "skip_slice")
            self.toggle_mix_voices()
            set_entry(self.entry_mix_voices, "mix_voices", "")

        if hasattr(self, 'entry_ultra_api'):
            self.ultra_input_file_path = data.get("ultra_draft_json", "")
            if self.ultra_input_file_path:
                self.lbl_ultra_file_path.configure(text=f"Đã chọn: {os.path.basename(self.ultra_input_file_path)}")
            else:
                self.lbl_ultra_file_path.configure(text="Chưa có file nào được chọn.")
            set_entry(self.entry_ultra_api, "ultra_api_key", "")
            set_entry(self.entry_ultra_audio_order, "ultra_audio_order", "")
            self.ultra_sfx_folder_path = data.get("ultra_sfx_dir", "")
            if self.ultra_sfx_folder_path:
                self.lbl_ultra_sfx.configure(text=f"SFX: {self.ultra_sfx_folder_path}")
            else:
                self.lbl_ultra_sfx.configure(text="Chưa chọn thư mục SFX")
            
            self.opt_sync_image_to_audio.set(data.get("ultra_sync_img", True))
            self.opt_ultra_music_mix.set(data.get("ultra_mix_music", False))
            self.opt_custom_audio_order.set(data.get("ultra_custom_order", False))
            self.opt_randomize_video.set(data.get("ultra_random_vid", False))
            self.opt_dynamic_motion.set(data.get("ultra_dyn_motion", True))
            self.opt_auto_transition.set(data.get("ultra_auto_trans", True))
            self.opt_clear_transitions.set(data.get("ultra_clear_trans", False))
            self.opt_auto_fill_canvas.set(data.get("ultra_auto_fill", True))
            self.opt_normalize_volume.set(data.get("ultra_norm_vol", True))
            self.opt_reverse_timeline.set(data.get("ultra_rev_time", False))
            self.opt_auto_subtitles.set(data.get("ultra_auto_sub", False))
            self.opt_ai_sfx_generator.set(data.get("ultra_ai_sfx", False))

        if data.get("script_resolution"): self.combo_resolution.set(data.get("script_resolution"))
        if data.get("audio_ver"): self.combo_audio_ver.set(data.get("audio_ver"))
        if data.get("text_format"): self.combo_text_format.set(data.get("text_format"))
        
        def set_chk(chk, key, default=False):
            if data.get(key, default): chk.select()
            else: chk.deselect()
            
        set_chk(self.chk_show_auto_render, "show_auto_render", False)
        self.toggle_auto_render_frame() 
        
        set_chk(self.chk_use_opencv, "use_opencv", False)
        set_chk(self.chk_export_thumb, "export_thumb", True)
        set_chk(self.chk_random_variants, "random_variants", False)
        set_chk(self.chk_keep_duplicates, "keep_duplicates", False)
        set_chk(self.chk_multi_bg, "multi_bg", False)
        set_chk(self.chk_loop_video, "loop_video", False)
        set_chk(self.chk_skip_az, "skip_az", False)
        set_chk(self.chk_skip_za, "skip_za", False)
        set_chk(self.chk_shuffle_bg, "shuffle_bg", False)
        set_chk(self.chk_auto_render, "auto_render", False)
        set_chk(self.chk_restart_capcut, "auto_restart", True)
        set_chk(self.chk_disable_scale, "disable_scale", False)

        set_chk(self.chk_lock_screen, "lock_screen", False)
        set_chk(self.chk_clear_cache, "clear_cache", False)
        set_chk(self.chk_auto_shutdown, "auto_shutdown", False)

    def load_config(self):
        self.profiles = {"Mặc định": {}}
        self.last_profile = "Mặc định"
        try:
            if os.path.exists(CONFIG_FILE):
                with open(CONFIG_FILE, 'r', encoding='utf-8') as f: data = json.load(f)
                if "profiles" in data:
                    self.profiles = data["profiles"]
                    self.last_profile = data.get("last_profile", list(self.profiles.keys())[0])
                else:
                    prof_name = data.get("prefix", "Mặc định")
                    if prof_name.strip() == "": prof_name = "Mặc định"
                    self.profiles[prof_name] = data
                    self.last_profile = prof_name
        except Exception as e: self.log(f"Lỗi tải cấu hình: {e}")
            
        if not self.profiles: self.profiles["Mặc định"] = {}
        vals = list(self.profiles.keys())
        self.combo_profile.configure(values=vals)
        if self.last_profile not in self.profiles: self.last_profile = vals[0]
        self.combo_profile.set(self.last_profile)
        self.set_ui_state(self.profiles[self.last_profile])

    def save_config(self):
        try:
            current_prof = self.combo_profile.get().strip()
            if not current_prof: 
                current_prof = "Mặc định"
                self.combo_profile.set(current_prof)
            self.profiles[current_prof] = self.get_ui_state()
            data = {"last_profile": current_prof, "profiles": self.profiles}
            with open(CONFIG_FILE, 'w', encoding='utf-8') as f: json.dump(data, f, ensure_ascii=False, indent=4)
        except Exception as e: self.log(f"Lỗi lưu cấu hình: {e}")

    def on_profile_change(self, choice):
        if choice in self.profiles:
            self.set_ui_state(self.profiles[choice])
            self.last_profile = choice
            self.save_config()

    def save_current_profile_btn(self):
        prof_name = self.combo_profile.get().strip()
        if not prof_name: return
        self.profiles[prof_name] = self.get_ui_state()
        if prof_name not in self.combo_profile.cget("values"):
            vals = list(self.combo_profile.cget("values"))
            vals.append(prof_name)
            self.combo_profile.configure(values=vals)
        self.save_config()
        messagebox.showinfo("Thành công", f"Đã lưu các cài đặt hiện tại cho kênh: {prof_name}")

    def add_profile(self):
        dialog = ctk.CTkInputDialog(text="Nhập tên Kênh/Tiền tố mới:", title="Thêm Profile Mới")
        name = dialog.get_input()
        if name:
            name = name.strip()
            if not name: return
            if name in self.profiles:
                messagebox.showwarning("Lỗi", "Tên này đã tồn tại!")
                return
            self.profiles[name] = self.get_ui_state()
            vals = list(self.profiles.keys())
            self.combo_profile.configure(values=vals)
            self.combo_profile.set(name)
            self.last_profile = name
            self.save_config()
            self.log(f"✅ Đã tạo mới profile kênh: {name}")

    def delete_profile(self):
        prof_name = self.combo_profile.get().strip()
        if prof_name in self.profiles:
            if messagebox.askyesno("Xác nhận Xóa", f"Bạn có chắc muốn xóa vĩnh viễn cấu hình của kênh '{prof_name}'?"):
                del self.profiles[prof_name]
                if not self.profiles: self.profiles["Mặc định"] = {}
                vals = list(self.profiles.keys())
                self.combo_profile.configure(values=vals)
                self.combo_profile.set(vals[0])
                self.on_profile_change(vals[0])
                self.save_config()
                self.log(f"🗑️ Đã xóa profile kênh: {prof_name}")

    # --- CÁC HÀM BROWSE CHUNG ---
    def browse_project(self):
        path = filedialog.askopenfilename(title="Chọn file draft_content.json", filetypes=[("JSON Files", "*.json")])
        if path: 
            self.entry_proj.delete(0, ctk.END); self.entry_proj.insert(0, path)
            self.save_config()
    def browse_audio(self):
        path = filedialog.askdirectory(title="Chọn thư mục chứa nhạc mới")
        if path: 
            self.entry_audio.delete(0, ctk.END); self.entry_audio.insert(0, path)
            self.save_config()
    def browse_bg(self):
        path = filedialog.askdirectory(title="Chọn thư mục chứa ảnh/video nền mới")
        if path: 
            self.entry_bg.delete(0, ctk.END); self.entry_bg.insert(0, path)
            self.entry_tracklist.delete(0, ctk.END); self.entry_tracklist.insert(0, path)
            self.save_config()
    def browse_tracklist(self):
        path = filedialog.askdirectory(title="Chọn thư mục xuất file Tracklist")
        if path:
            self.entry_tracklist.delete(0, ctk.END); self.entry_tracklist.insert(0, path)
            self.save_config()
    def browse_export_dir(self):
        path = filedialog.askdirectory(title="Chọn thư mục đích lưu Video Render")
        if path:
            self.entry_export_dir.delete(0, ctk.END); self.entry_export_dir.insert(0, path)
            self.save_config()
    def browse_template_dir(self):
        path = filedialog.askdirectory(title="Chọn thư mục chứa ảnh OpenCV")
        if path:
            self.entry_template_dir.delete(0, ctk.END); self.entry_template_dir.insert(0, path)
            self.save_config()
    def browse_script(self):
        path = filedialog.askopenfilename(title="Chọn file Kịch bản (.txt)", filetypes=[("Text Files", "*.txt")])
        if path:
            self.entry_script.delete(0, ctk.END); self.entry_script.insert(0, path)
            self.save_config()
    def browse_file_generic(self, entry_widget, type_name, exts):
        path = filedialog.askopenfilename(title="Chọn file", filetypes=[(type_name, exts)])
        if path:
            entry_widget.delete(0, ctk.END); entry_widget.insert(0, path)
            self.save_config()
    def browse_dir_generic(self, entry_widget):
        path = filedialog.askdirectory(title="Chọn thư mục")
        if path:
            entry_widget.delete(0, ctk.END); entry_widget.insert(0, path)
            self.save_config()

    def toggle_auto_render_frame(self):
        if self.chk_show_auto_render.get() == 1: self.auto_render_frame.pack(fill="x", padx=10, pady=5, after=self.chk_show_auto_render)
        else: self.auto_render_frame.pack_forget()
    def on_draft_selected(self, path):
        self.entry_proj.delete(0, ctk.END); self.entry_proj.insert(0, path); self.save_config()
    def open_draft_selector(self): CapCutDraftSelector(self, self.on_draft_selected)

    def log(self, message, clear=False):
        self.log_box.configure(state="normal")
        if clear: self.log_box.delete("1.0", "end")
        time_str = datetime.now().strftime("%H:%M:%S")
        self.log_box.insert("end", f"[{time_str}] {message}\n")
        self.log_box.see("end")
        self.log_box.configure(state="disabled")

    def start_get_mouse_pos(self):
        messagebox.showinfo("Lấy tọa độ", "Hãy mở giao diện CapCut, di chuyển chuột đến đúng vị trí bạn muốn lấy tọa độ (Ví dụ: Ô tìm kiếm) và nhấn phím F8.\n\nTọa độ sẽ được tự động lưu nối tiếp vào file Kịch Bản .txt hiện tại.")
        def wait_for_key():
            try:
                keyboard.wait('f8')
                x, y = pyautogui.position()
                step_str = f"\n- Tọa độ: X={x}, Y={y}\n- Hành động: Click vào ({x}, {y})\n------------------------------"
                script_path = self.entry_script.get().strip()
                if not script_path or not os.path.exists(script_path):
                    base_dir = os.path.dirname(sys.executable) if getattr(sys, 'frozen', False) else os.path.dirname(os.path.abspath(__file__))
                    script_path = os.path.join(base_dir, "kich_ban.txt")
                    self.entry_script.delete(0, 'end'); self.entry_script.insert(0, script_path)
                with open(script_path, "a", encoding="utf-8") as f: f.write(step_str)
                self.log(f"📍 Đã thêm tọa độ: X={x}, Y={y} vào file {os.path.basename(script_path)}.")
            except Exception as e: self.log(f"⚠️ Lỗi lấy tọa độ: {e}")
        threading.Thread(target=wait_for_key, daemon=True).start()

    def on_resolution_change(self, choice):
        if "Tự động" in choice: return
        script_path = self.entry_script.get().strip()
        if not script_path or not os.path.exists(script_path): return
        try:
            with open(script_path, "r", encoding="utf-8") as f: script_content = f.read()
        except: return
        lines = script_content.split('\n')
        xs, ys = [], []
        for line in lines:
            match = re.search(r'[Xx]\s*[:=]?\s*(\d+)[^\d]*[Yy]\s*[:=]?\s*(\d+)', line)
            if match: xs.append(int(match.group(1))); ys.append(int(match.group(2)))
        if not xs or not ys: return
        max_x, max_y = max(xs), max(ys)
        
        if max_x > 2560 or max_y > 1440: orig_w, orig_h = 3840, 2160
        elif max_x > 1920 or max_y > 1080: orig_w, orig_h = 2560, 1440
        elif max_x > 1366 or max_y > 768: orig_w, orig_h = 1920, 1080
        else: orig_w, orig_h = 1366, 768
            
        if "4K" in choice: target_w, target_h = 3840, 2160
        elif "2K" in choice: target_w, target_h = 2560, 1440
        elif "Full HD" in choice: target_w, target_h = 1920, 1080
        else: return
            
        if orig_w == target_w and orig_h == target_h: return
        scale_x = target_w / orig_w
        scale_y = target_h / orig_h
        
        new_lines = []
        for line in lines:
            l1 = re.sub(r'([Xx]\s*[:=]?\s*)(\d+)([^\d]*[Yy]\s*[:=]?\s*)(\d+)', lambda m: f"{m.group(1)}{int(int(m.group(2))*scale_x)}{m.group(3)}{int(int(m.group(4))*scale_y)}", line)
            l2 = re.sub(r'(\(\s*)(\d+)(\s*,\s*)(\d+)(\s*\))', lambda m: f"{m.group(1)}{int(int(m.group(2))*scale_x)}{m.group(3)}{int(int(m.group(4))*scale_y)}{m.group(5)}", l1)
            new_lines.append(l2)
            
        try:
            with open(script_path, "w", encoding="utf-8") as f: f.write("\n".join(new_lines))
            self.save_config()
            self.log(f"🔄 Đã tự động thay đổi tọa độ trong file {os.path.basename(script_path)} từ {orig_w}x{orig_h} sang {target_w}x{target_h}!")
        except Exception as e: self.log(f"⚠️ Lỗi lưu kịch bản: {e}")

    def preview_tracklist(self):
        audio_folder = self.entry_audio.get().strip()
        if not audio_folder or not os.path.isdir(audio_folder):
            messagebox.showwarning("Thiếu Nhạc", "Vui lòng chọn thư mục chứa nhạc mới trước khi Preview!")
            return
            
        audio_version = self.combo_audio_ver.get()
        fixed_songs_text = self.txt_fixed_songs.get("1.0", "end-1c")
        try: max_songs = int(self.entry_max_songs.get())
        except: max_songs = 10
        random_variants = (self.chk_random_variants.get() == 1)
        keep_dups = (self.chk_keep_duplicates.get() == 1)
        skip_az = (self.chk_skip_az.get() == 1)

        valid_ext = ('.mp3', '.wav', '.m4a', '.aac', '.flac')
        all_found = []
        for r_dir, _, files in os.walk(audio_folder):
            for f in files:
                if f.lower().endswith(valid_ext):
                    has_num = bool(re.search(r'\(\d+\)\.\w+$', f))
                    if audio_version == "Bản gốc (Không có '(1)')" and has_num: continue
                    if audio_version == "Bản phụ (Có '(1)')" and not has_num: continue
                    all_found.append({'name': f, 'clean': clean_song_name(f)})

        if not all_found:
            messagebox.showwarning("Rỗng", "Không tìm thấy bài hát nào hợp lệ trong thư mục!")
            return

        fixed_names = [n.strip() for n in fixed_songs_text.split('\n') if n.strip()]
        fixed_files = []
        random_files = []

        if random_variants or keep_duplicates:
            pool = list(all_found)
            for fname in fixed_names:
                for i, a in enumerate(pool):
                    if fname.lower() in a['clean'].lower() or a['clean'].lower() in fname.lower():
                        fixed_files.append(a); pool.pop(i); break
            
            if random_variants:
                random_files = smart_shuffle_list(pool, key_func=lambda x: x['clean'])
            else:
                random_files = pool
        else:
            uniq = {}
            for a in all_found:
                if a['clean'] not in uniq: uniq[a['clean']] = []
                uniq[a['clean']].append(a)
            for fname in fixed_names:
                m_key = None
                for k in uniq.keys():
                    if fname.lower() in k.lower() or k.lower() in fname.lower(): m_key = k; break
                if m_key: fixed_files.append(random.choice(uniq[m_key])); del uniq[m_key]
            for c_name, versions in uniq.items(): random_files.append(random.choice(versions))

        def nat_sort(item): return [int(text) if text.isdigit() else text.lower() for text in re.split(r'(\d+)', item['name'])]
        
        if not skip_az and not random_variants: random_files.sort(key=nat_sort)
        elif not random_variants: random.shuffle(random_files)

        final_list = fixed_files + random_files
        if max_songs > 0: final_list = final_list[:max_songs]

        top = ctk.CTkToplevel(self)
        top.title("Preview Tracklist")
        top.geometry("500x600")
        top.transient(self)
        txt = ctk.CTkTextbox(top, font=ctk.CTkFont(size=14))
        txt.pack(fill="both", expand=True, padx=10, pady=10)
        
        mode_str = 'Giữ các bản mix cùng tên (Random)' if random_variants else ('Giữ trùng' if keep_dups else 'Lọc trùng')
        info = f"--- THÔNG TIN MIX ---\n- Chế độ: {mode_str}\n- Sắp xếp: {'A->Z' if not skip_az and not random_variants else 'Ngẫu nhiên (Có giãn cách)'}\n- Tổng bài: {len(final_list)}\n\n--- DANH SÁCH ---\n"
        for idx, s in enumerate(final_list): info += f"{idx+1}. {s['clean']}\n"
        txt.insert("1.0", info)
        txt.configure(state="disabled")

    # =========================================================================
    # LUỒNG ĐIỀU KHIỂN BATCH RENDER & RPA
    # =========================================================================
    def start_thread(self):
        if self.is_running: return
        self.save_config()
        self.is_running = True
        self.stop_requested = False
        self.btn_run.configure(state="disabled", text="⏳ ĐANG XỬ LÝ...")
        self.btn_stop.configure(state="normal", fg_color="#777777")
        self.progress_bar.set(0)
        self.log("BẮT ĐẦU CHẠY BATCH RENDER", clear=True)
        threading.Thread(target=self.run_batch, daemon=True).start()

    def stop_all_from_hotkey(self):
        if self.is_running and not self.stop_requested: self.after(0, self.stop_thread)
        if self.is_prompt_running and not self.prompt_stop_requested: self.after(0, self.stop_prompt_thread)

    def stop_thread(self):
        if self.is_running:
            self.stop_requested = True
            self.btn_stop.configure(state="disabled", text="⏳ ĐANG DỪNG...")
            if self.lock_screen: self.lock_screen.destroy(); self.lock_screen = None
            self.log("⚠️ YÊU CẦU DỪNG BATCH KHẨN CẤP! (Sẽ dừng sau hành động hiện tại)")

    def show_lock_screen(self):
        if self.chk_lock_screen.get() == 1 and not self.lock_screen: self.lock_screen = LockScreenOverlay(self)
    def hide_lock_screen(self):
        if self.lock_screen: self.lock_screen.destroy(); self.lock_screen = None

    def wait_and_get_rendered_file(self, project_name, target_folder, timeout_mins):
        user_profile = os.environ.get('USERPROFILE', '')
        search_paths = []
        if target_folder and os.path.exists(target_folder): search_paths.append(target_folder)
        search_paths.extend([
            os.path.join(user_profile, 'AppData', 'Local', 'CapCut', 'Videos'),
            os.path.join(user_profile, 'Videos', 'CapCut'),
            os.path.join(user_profile, 'Videos'),
            os.path.join(user_profile, 'Desktop'),
            os.path.join(user_profile, 'Documents', 'CapCut')
        ])
        target_files = [f"{project_name}.mp4", f"{project_name}.mov"]
        timeout_secs = int(timeout_mins * 60)
        start_time = time.time()
        self.log(f" -> ⏳ Đang đợi Video xuất hiện (Timeout an toàn: {timeout_mins} phút)...")

        while (time.time() - start_time) < timeout_secs:
            if self.stop_requested: return None
            for path in search_paths:
                if not path or not os.path.exists(path): continue
                for tf in target_files:
                    file_path = os.path.join(path, tf)
                    if os.path.exists(file_path):
                        try:
                            if os.path.getsize(file_path) > 0:
                                time.sleep(3) 
                                self.log(f" -> ✅ Phát hiện Video Render XONG: {tf}")
                                return file_path
                        except: pass
            time.sleep(2)
        self.log(" -> ⚠️ Đã quá thời gian Timeout mà chưa thấy file Video xuất hiện.")
        return None

    def click_via_opencv(self, template_path, threshold=0.8, timeout=4):
        try: import cv2; import numpy as np; from PIL import ImageGrab
        except: return False
            
        template_gray = cv2.imdecode(np.fromfile(template_path, dtype=np.uint8), cv2.IMREAD_GRAYSCALE)
        if template_gray is None: return False
        template_inv = cv2.bitwise_not(template_gray)
        start_time = time.time()
        user32 = ctypes.windll.user32
        vscreen_x = user32.GetSystemMetrics(76); vscreen_y = user32.GetSystemMetrics(77) 
        
        while time.time() - start_time < timeout:
            if self.stop_requested: return False
            screenshot = ImageGrab.grab(all_screens=True)
            screen_gray = cv2.cvtColor(np.array(screenshot), cv2.COLOR_RGB2GRAY)
            
            res_n = cv2.matchTemplate(screen_gray, template_gray, cv2.TM_CCOEFF_NORMED)
            _, max_n, _, loc_n = cv2.minMaxLoc(res_n)
            res_i = cv2.matchTemplate(screen_gray, template_inv, cv2.TM_CCOEFF_NORMED)
            _, max_i, _, loc_i = cv2.minMaxLoc(res_i)
            
            best_val, best_loc, is_inv = (max_n, loc_n, False) if max_n >= max_i else (max_i, loc_i, True)
            
            if best_val >= threshold:
                h, w = template_gray.shape[:2]
                cx = best_loc[0] + w // 2 + vscreen_x
                cy = best_loc[1] + h // 2 + vscreen_y
                pyautogui.moveTo(cx, cy, duration=0.2); time.sleep(0.1); pyautogui.click()
                return True
            time.sleep(0.2)
        return False

    def do_auto_render(self, project_dir, project_name, export_dir=None):
        if self.chk_show_auto_render.get() != 1: return 

        try:
            script_path = self.entry_script.get().strip()
            if not script_path or not os.path.exists(script_path): return
            with open(script_path, "r", encoding="utf-8") as f: script_content = f.read()

            lines = script_content.split('\n')
            click_steps = []
            cx, cy, cimg, cact = None, None, None, None
            for line in lines:
                clean_line = line.strip()
                if not clean_line or clean_line.startswith('---') or clean_line.startswith('Bước'): continue
                m_coord = re.search(r'[Xx]\s*[:=]?\s*(\d+)[^\d]*[Yy]\s*[:=]?\s*(\d+)', clean_line)
                m_img = re.search(r'(?:Ảnh|Hình|Image)\s*[:=]\s*([a-zA-Z0-9_.\-\s]+\.(?:png|jpg|jpeg))', clean_line, re.IGNORECASE)
                m_act = re.search(r'^(?:-\s*)?(?:Hành\s*động|Hành\s*Động|hành\s*động)\s*:\s*(.*)', clean_line, flags=re.IGNORECASE)
                if m_coord:
                    if cx is not None and cact is None: click_steps.append((cx, cy, cimg, f"Thao tác ({cx},{cy})")); cx, cy, cimg = None, None, None
                    cx, cy = int(m_coord.group(1)), int(m_coord.group(2))
                if m_img: cimg = m_img.group(1).strip()
                if m_act: cact = m_act.group(1).strip(); click_steps.append((cx, cy, cimg, cact)); cx, cy, cimg, cact = None, None, None, None
            if cx is not None or cimg is not None: click_steps.append((cx, cy, cimg, cact if cact else "Thao tác cuối"))
        except Exception as e: return

        if len(click_steps) < 4: return

        try:
            local_app_data = os.environ.get('LOCALAPPDATA', '')
            capcut_path = os.path.join(local_app_data, 'CapCut', 'Apps', 'CapCut.exe')
            os.system("taskkill /f /im capcut.exe >nul 2>&1"); time.sleep(2)
            os.startfile(capcut_path); time.sleep(10) 

            capcut_hwnd = 0
            user32 = ctypes.windll.user32
            class RECT(ctypes.Structure): _fields_ = [("left", ctypes.c_long), ("top", ctypes.c_long), ("right", ctypes.c_long), ("bottom", ctypes.c_long)]

            for _ in range(20):
                if self.stop_requested: return
                curr_hwnd = 0
                while True:
                    curr_hwnd = user32.FindWindowExW(0, curr_hwnd, None, "CapCut")
                    if curr_hwnd == 0: break 
                    if user32.IsWindowVisible(curr_hwnd):
                        rect = RECT(); user32.GetWindowRect(curr_hwnd, ctypes.byref(rect))
                        if (rect.right - rect.left) > 500 and (rect.bottom - rect.top) > 300: capcut_hwnd = curr_hwnd; break
                if capcut_hwnd: break
                time.sleep(1)

            if not capcut_hwnd: return
            
            try:
                if user32.IsIconic(capcut_hwnd): user32.ShowWindow(capcut_hwnd, 9) 
                time.sleep(0.5); user32.SetForegroundWindow(capcut_hwnd); time.sleep(0.5)
                user32.ShowWindow(capcut_hwnd, 3); time.sleep(1.5) 
                pyautogui.hotkey('win', 'up'); time.sleep(0.5)
            except: pass
            
            self.show_lock_screen()
            time.sleep(3)

            current_w, current_h = pyautogui.size()
            scale_x, scale_y = 1.0, 1.0
            if self.chk_disable_scale.get() != 1:
                base_res = self.combo_resolution.get()
                if "4K" in base_res: rec_w, rec_h = 3840, 2160
                elif "2K" in base_res: rec_w, rec_h = 2560, 1440
                elif "Full HD" in base_res: rec_w, rec_h = 1920, 1080
                else: rec_w, rec_h = 1920, 1080
                scale_x, scale_y = current_w / rec_w, current_h / rec_h

            open_wait = int(self.entry_open_wait.get() or 20)
            folder_injected = False 
            use_cv = self.chk_use_opencv.get() == 1
            template_dir = self.entry_template_dir.get().strip()
            
            for i, (x, y, img, action) in enumerate(click_steps):
                if self.stop_requested: self.hide_lock_screen(); return
                step = i + 1
                clicked = False

                if step == 3:
                    try: popup_wait = float(self.entry_popup_wait.get())
                    except: popup_wait = 1.5
                    time.sleep(0.3) 
                    if use_cv and img and template_dir:
                        img_path = os.path.join(template_dir, img)
                        if os.path.exists(img_path):
                            clicked = self.click_via_opencv(img_path, threshold=0.7, timeout=popup_wait)
                            if clicked: time.sleep(0.5); continue
                    if not clicked and x is not None and y is not None:
                        if not (use_cv and img):
                            try: pyautogui.moveTo(int(x * scale_x), int(y * scale_y), duration=0.2); pyautogui.click(); time.sleep(1)
                            except: pass
                    continue

                if use_cv and img and template_dir:
                    img_path = os.path.join(template_dir, img)
                    if os.path.exists(img_path): clicked = self.click_via_opencv(img_path, threshold=0.75, timeout=4)

                if not clicked and x is not None and y is not None:
                    try: pyautogui.moveTo(int(x * scale_x), int(y * scale_y), duration=0.5); pyautogui.click()
                    except: pass
                
                if step == 1:
                    time.sleep(0.5); pyautogui.hotkey('ctrl', 'a'); pyautogui.press('backspace')
                    pyperclip.copy(project_name); pyautogui.hotkey('ctrl', 'v'); time.sleep(0.5); pyautogui.press('enter'); time.sleep(2)
                elif step == 2:
                    for w in range(open_wait):
                        if self.stop_requested: self.hide_lock_screen(); return
                        time.sleep(1)
                elif step == len(click_steps): 
                    wait_mins = float(self.entry_render_wait.get() or 15)
                    completed_file = self.wait_and_get_rendered_file(project_name, export_dir, wait_mins)
                    os.system("taskkill /f /im capcut.exe >nul 2>&1"); time.sleep(2)
                    if completed_file and export_dir and os.path.exists(export_dir) and os.path.dirname(completed_file) != os.path.normpath(export_dir):
                        try: shutil.move(completed_file, os.path.join(export_dir, os.path.basename(completed_file)))
                        except: pass
                else:
                    action_lower = action.lower() if action else ""
                    if export_dir and not folder_injected and ("thư mục" in action_lower or "folder" in action_lower or "đường dẫn" in action_lower):
                        time.sleep(1.5); pyautogui.hotkey('alt', 'd'); time.sleep(0.5)
                        pyperclip.copy(os.path.normpath(export_dir)); pyautogui.hotkey('ctrl', 'v')
                        time.sleep(0.5); pyautogui.press('enter'); time.sleep(1)
                        folder_injected = True
                    else: time.sleep(2)

        except Exception as e: self.log(f"❌ Lỗi RPA: {e}")
        finally: self.hide_lock_screen()

    def run_batch(self):
        json_path = self.entry_proj.get()
        audio_folder = self.entry_audio.get().strip()
        bg_folder = self.entry_bg.get().strip()
        fixed_songs_text = self.txt_fixed_songs.get("1.0", "end-1c") 
        raw_prefix = self.combo_profile.get().strip()
        prefix = re.sub(r'[\\/*?:"<>|\n\r]+', ' ', raw_prefix).strip()
        export_dir = self.entry_export_dir.get().strip()
        
        audio_version = self.combo_audio_ver.get()
        text_format = self.combo_text_format.get()
        try: max_songs = int(self.entry_max_songs.get())
        except ValueError: max_songs = 10
        
        random_variants = (self.chk_random_variants.get() == 1)
        keep_dups = (self.chk_keep_duplicates.get() == 1)
        do_loop_video = (self.chk_loop_video.get() == 1)
        is_multi_bg = (self.chk_multi_bg.get() == 1)
        export_thumb = (self.chk_export_thumb.get() == 1)
        skip_az = (self.chk_skip_az.get() == 1)
        skip_za = (self.chk_skip_za.get() == 1)
        shuffle_bg = (self.chk_shuffle_bg.get() == 1)
        do_render = (self.chk_show_auto_render.get() == 1 and self.chk_auto_render.get() == 1)
        
        do_fade = False
        do_scale = False
        do_pagination = False
        do_yt_timestamps = False
        do_clear_cache = (self.chk_clear_cache.get() == 1)
        do_shutdown = (self.chk_auto_shutdown.get() == 1)
        tele_token = self.entry_tele_token.get().strip()
        tele_chat = self.entry_tele_chat.get().strip()
        do_tele_render = (getattr(self, "chk_tele_render", ctk.CTkCheckBox(self)).get() == 1)
        
        try:
            num_copies = int(self.entry_batch.get())
            if num_copies <= 0: raise ValueError
        except ValueError:
            messagebox.showerror("Lỗi", "Số lượng video phải là số nguyên dương!")
            self.reset_ui(); return

        if not os.path.exists(json_path):
            messagebox.showerror("Lỗi", "Không tìm thấy file Template gốc!"); self.reset_ui(); return

        project_dir = os.path.dirname(json_path)
        capcut_drafts_dir = os.path.dirname(project_dir) 
        
        tracklist_out_dir = self.entry_tracklist.get().strip()
        if not tracklist_out_dir: tracklist_out_dir = bg_folder if bg_folder and os.path.isdir(bg_folder) else os.getcwd()
        if not os.path.exists(tracklist_out_dir): os.makedirs(tracklist_out_dir)

        media_files = []
        if bg_folder and os.path.isdir(bg_folder):
            valid_exts = ('.jpg', '.jpeg', '.png', '.webp', '.mp4', '.mov', '.avi', '.mkv')
            media_files = [os.path.join(bg_folder, f) for f in os.listdir(bg_folder) if f.lower().endswith(valid_exts)]
        elif bg_folder and os.path.isfile(bg_folder): media_files = [bg_folder]

        date_str = datetime.now().strftime("%d.%m")
        existing_projects = []
        for item in os.listdir(capcut_drafts_dir):
            if os.path.isdir(os.path.join(capcut_drafts_dir, item)) and item.startswith(f"{prefix} {date_str}-"): existing_projects.append(item)

        start_index = 1
        overwrite_mode = False
        if existing_projects:
            msg = f"Đã tìm thấy {len(existing_projects)} dự án '{prefix} {date_str}-'.\n- [Yes]: Xóa cũ, tạo lại từ 1\n- [No]: Tạo nối tiếp"
            res = messagebox.askyesnocancel("Phát hiện dự án trùng", msg, icon='warning', default='no')
            if res is None: self.reset_ui(); return
            elif res is True: overwrite_mode = True
            else:
                max_idx = 0
                for p in existing_projects:
                    try: 
                        idx = int(p.split('-')[-1])
                        if idx > max_idx: max_idx = idx
                    except: pass
                start_index = max_idx + 1

        self.log(f"Khởi tạo tiến trình nhân bản (Từ #{start_index})...")
        send_telegram_msg(tele_token, tele_chat, f"🚀 Bắt đầu tạo {num_copies} video kênh {prefix}")
        success_count = 0
        bg_pool = []
        last_bg = None

        try:
            for loop_i in range(num_copies):
                if self.stop_requested: break
                current_index = start_index + loop_i
                new_project_name = f"{prefix} {date_str}-{current_index}"
                self.log(f"\n[{loop_i + 1}/{num_copies}] Đang tạo dự án: {new_project_name}")
                
                new_project_dir = os.path.join(capcut_drafts_dir, new_project_name)
                if os.path.exists(new_project_dir) and overwrite_mode:
                    try: shutil.rmtree(new_project_dir)
                    except: pass
                if not os.path.exists(new_project_dir): os.makedirs(new_project_dir)
                
                for item in os.listdir(project_dir):
                    s = os.path.join(project_dir, item); d = os.path.join(new_project_dir, item)
                    if os.path.isdir(s):
                        if not os.path.exists(d): shutil.copytree(s, d)
                    else: shutil.copy2(s, d)
                
                current_bg = None
                current_bg_list = None
                if media_files:
                    if is_multi_bg:
                        current_bg_list = list(media_files)
                    else:
                        if shuffle_bg:
                            if not bg_pool: 
                                bg_pool = list(media_files)
                                random.shuffle(bg_pool)
                                if len(bg_pool) > 1 and bg_pool[-1] == last_bg: bg_pool.insert(0, bg_pool.pop())
                            current_bg = bg_pool.pop()
                            last_bg = current_bg
                        else: current_bg = media_files[loop_i % len(media_files)]

                target_json = os.path.join(new_project_dir, "draft_content.json")
                bg_replaced, tracklist_data, yt_timestamps = process_capcut_project(
                    target_json, target_json, new_bg_path=current_bg, audio_folder=audio_folder if audio_folder else None,
                    sequence_index=current_index, skip_az=skip_az, skip_za=skip_za, audio_version=audio_version,
                    max_songs=max_songs, text_format=text_format, is_multi_bg=is_multi_bg, bg_list=current_bg_list,
                    loop_video=do_loop_video, keep_duplicates=keep_dups, random_variants=random_variants,
                    fixed_songs_text=fixed_songs_text, do_fade=do_fade, do_scale=do_scale, do_pagination=do_pagination,
                    shuffle_bg=shuffle_bg
                )

                if tracklist_data:
                    with open(os.path.join(tracklist_out_dir, f"{new_project_name}.txt"), "w", encoding="utf-8") as f: f.write("\n".join(tracklist_data))
                if do_yt_timestamps and yt_timestamps:
                    with open(os.path.join(tracklist_out_dir, f"{new_project_name}_timestamps.txt"), "w", encoding="utf-8") as f: f.write("\n".join(yt_timestamps))

                if export_thumb:
                    cover_src = os.path.join(new_project_dir, "draft_cover.jpg")
                    if os.path.exists(cover_src): shutil.copy2(cover_src, os.path.join(tracklist_out_dir, f"{new_project_name}.jpg"))

                if do_render and not self.stop_requested:
                    self.do_auto_render(new_project_dir, new_project_name, export_dir)
                    send_telegram_msg(tele_token, tele_chat, f"✅ Đã Render xong: {new_project_name}")

                success_count += 1
                self.progress_bar.set((loop_i + 1) / num_copies)
                time.sleep(0.3)

            if not self.stop_requested:
                self.log(f"\n✅ HOÀN THÀNH! Đã xử lý {success_count} dự án.")
                send_telegram_msg(tele_token, tele_chat, f"🎉 Đã hoàn thành mẻ {success_count} dự án của kênh {prefix}!")
                
                if do_clear_cache:
                    self.log("🧹 Đang dọn dẹp Cache CapCut...")
                    mb_cleared = clear_capcut_cache_files()
                    self.log(f" -> Đã giải phóng {mb_cleared:.1f} MB rác.")
                
                if self.chk_restart_capcut.get() == 1: restart_capcut()
                
                if do_shutdown:
                    self.log("⚠️ MÁY TÍNH SẼ TẮT SAU 60 GIÂY!")
                    os.system("shutdown /s /t 60")
                    messagebox.showwarning("Auto Shutdown", "Máy tính sẽ tự động tắt sau 60 giây.\nBấm Cancel trong hộp thoại Windows (nếu có) hoặc mở CMD gõ 'shutdown -a' để hủy.")
                else:
                    messagebox.showinfo("Thành công", f"Đã xuất xong {success_count} dự án.")

        except Exception as e:
            self.log(f"❌ LỖI: {str(e)}")
            if do_tele_render:
                send_telegram_msg(tele_token, tele_chat, f"❌ Lỗi xảy ra: {str(e)}")
        finally:
            self.hide_lock_screen()
            self.reset_ui()

    def reset_ui(self):
        self.is_running = False
        self.stop_requested = False
        self.btn_run.configure(state="normal", text="▶ KHỞI CHẠY BATCH RENDER")
        self.btn_stop.configure(state="disabled", text="⏹ DỪNG HỆ THỐNG", fg_color="#444444")


    # =========================================================================
    # AUDIO AI & TIMELINE SYNC (TỪ TOOL CŨ SANG)
    # =========================================================================
    def normalize_text(self, text):
        text = text.lower()
        text = text.translate(str.maketrans('', '', string.punctuation))
        return re.sub(r'\s+', ' ', text).strip()

    def extract_script_advanced(self, txt_path):
        scenes = []
        current_scene = None
        pending_dialogue = False
        with open(txt_path, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if not line: continue
                
                if line.startswith('--- Phân cảnh') or line.startswith('--- Scene'):
                    if current_scene: scenes.append(current_scene)
                    current_scene = {'id': len(scenes) + 1, 'text': '', 'prompt_count': 0}
                    pending_dialogue = False
                elif current_scene is not None:
                    if '[Đoạn thoại]' in line or '[Dialogue]' in line:
                        text = re.sub(r'\[(Đoạn thoại|Dialogue)\]\s*:\s*', '', line).strip()
                        if text:
                            current_scene['text'] += text + " "
                        else:
                            pending_dialogue = True
                    elif '$$Đoạn thoại$$' in line:
                        pending_dialogue = True
                    elif pending_dialogue:
                        text = line.lstrip(':').strip()
                        if text and not text.startswith('$$') and not text.startswith('['):
                            current_scene['text'] += text + " "
                        pending_dialogue = False
                    
                    if re.search(r'\+\s*\[P\d+\.\d+\]', line) or re.search(r'\$\$P\d+\.\d+\$\$', line):
                        current_scene['prompt_count'] += 1

        if current_scene: scenes.append(current_scene)
        for s in scenes:
            s['text'] = s['text'].strip()
            if s['prompt_count'] == 0: s['prompt_count'] = 1
        return scenes
        
    def run_audio_slicing(self):
        txt_path = self.entry_slice_script.get().strip()
        audio_path = self.entry_slice_audio.get().strip()
        out_voice_dir = self.entry_slice_out.get().strip()

        if not all([txt_path, audio_path, out_voice_dir]):
            messagebox.showwarning("Lỗi", "Vui lòng nhập đủ Kịch bản, Audio gốc và Thư mục xuất!")
            return
            
        if shutil.which("ffmpeg") is None:
            messagebox.showerror("Thiếu FFmpeg", "Hệ thống phát hiện máy tính chưa có FFmpeg.\nHãy cài đặt FFmpeg để có thể cắt Audio.")
            return

        self.btn_run_cut.configure(state="disabled", text="⏳ ĐANG CẮT VOICE...")
        self.log("BẮT ĐẦU CẮT AUDIO AI WHISPER...", clear=True)
        
        def _thread_wrapper():
            try:
                self._process_audio_slicing(txt_path, audio_path, out_voice_dir)
                messagebox.showinfo("Thành công", "Đã cắt voice hoàn tất!")
            except Exception as e:
                messagebox.showerror("Lỗi", f"Lỗi cắt Voice:\n{str(e)}")
            finally:
                self.btn_run_cut.configure(state="normal", text="▶ CHẠY CẮT VOICE LẺ")
                
        threading.Thread(target=_thread_wrapper, daemon=True).start()

    def _process_audio_slicing(self, txt_path, audio_path, out_voice_dir):
        try:
            scenes = self.extract_script_advanced(txt_path)
            total_prompts = sum(s['prompt_count'] for s in scenes)
            self.log(f"-> Kịch bản: Cần cắt {total_prompts} Audio từ {len(scenes)} phân cảnh.")

            if not os.path.exists(out_voice_dir): os.makedirs(out_voice_dir)

            self.log("-> Đang khởi chạy Whisper AI (Vui lòng đợi vài phút)...")
            
            import tempfile
            helper_script = os.path.join(tempfile.gettempdir(), f"whisper_helper_{uuid.uuid4().hex}.py")
            json_output = os.path.join(tempfile.gettempdir(), f"whisper_out_{uuid.uuid4().hex}.json")
            
            with open(helper_script, 'w', encoding='utf-8') as f:
                f.write(f'''
import whisper
import json
import sys

audio_path = sys.argv[1]
output_json = sys.argv[2]

try:
    model = whisper.load_model("base")
    result = model.transcribe(audio_path, word_timestamps=True)
    with open(output_json, 'w', encoding='utf-8') as jf:
        json.dump(result, jf)
except Exception as e:
    with open(output_json, 'w', encoding='utf-8') as jf:
        json.dump({{"error": str(e)}}, jf)
''')

            # Ensure whisper is installed on system python before running
            try:
                subprocess.run(['python', '-c', 'import whisper'], check=True, capture_output=True, creationflags=subprocess.CREATE_NO_WINDOW)
            except Exception:
                self.log("-> Đang cài đặt thư viện openai-whisper cho hệ thống...")
                _install_packages(['openai-whisper'])

            # Run helper script
            proc = subprocess.run(['python', helper_script, audio_path, json_output], capture_output=True, text=True, creationflags=subprocess.CREATE_NO_WINDOW)
            
            if not os.path.exists(json_output):
                self.log(f"-> Lỗi: Không nhận được kết quả từ Whisper AI. Chi tiết: {proc.stderr}")
                return
                
            with open(json_output, 'r', encoding='utf-8') as f:
                result = json.load(f)
                
            try: os.remove(helper_script); os.remove(json_output)
            except: pass
                
            if 'error' in result:
                self.log(f"-> Lỗi Whisper AI: {result['error']}")
                return
                
            ai_words = []
            for segment in result.get('segments', []):
                for word_info in segment.get('words', []):
                    norm_word = self.normalize_text(word_info['word'])
                    if norm_word: ai_words.append({'word': norm_word, 'start': word_info['start'], 'end': word_info['end']})

            script_words, word_to_scene = [], []
            for idx, scene in enumerate(scenes):
                words = self.normalize_text(scene['text']).split()
                script_words.extend(words)
                word_to_scene.extend([idx] * len(words))

            whisper_text_list = [w['word'] for w in ai_words]
            sm = difflib.SequenceMatcher(None, script_words, whisper_text_list)
            matches = sm.get_matching_blocks()

            scene_core_times = [{'start': None, 'end': None} for _ in range(len(scenes))]
            for match in matches:
                for k in range(match.size):
                    scene_idx = word_to_scene[match.a + k]
                    if scene_core_times[scene_idx]['start'] is None:
                        scene_core_times[scene_idx]['start'] = ai_words[match.b + k]['start']
                    scene_core_times[scene_idx]['end'] = ai_words[match.b + k]['end']

            audio = AudioSegment.from_file(audio_path)
            total_duration_sec = len(audio) / 1000.0

            # 1. Nội suy tỷ lệ cho các phân cảnh không khớp được (unmatched scenes)
            i = 0
            n = len(scenes)
            while i < n:
                if scene_core_times[i]['start'] is None:
                    j = i
                    while j < n and scene_core_times[j]['start'] is None:
                        j += 1
                    
                    prev_end = scene_core_times[i-1]['end'] if i > 0 else 0.0
                    next_start = total_duration_sec
                    for k_idx in range(j, n):
                        if scene_core_times[k_idx]['start'] is not None:
                            next_start = scene_core_times[k_idx]['start']
                            break
                    
                    gap_len = max(0.0, next_start - prev_end)
                    unmatched_scenes = scenes[i:j]
                    total_chars = sum(len(s['text']) for s in unmatched_scenes)
                    
                    current_t = prev_end
                    if total_chars > 0:
                        for idx_unmatched, s_unmatched in enumerate(unmatched_scenes):
                            scene_idx = i + idx_unmatched
                            dur = gap_len * (len(s_unmatched['text']) / total_chars)
                            scene_core_times[scene_idx]['start'] = current_t
                            scene_core_times[scene_idx]['end'] = current_t + dur
                            current_t += dur
                    else:
                        dur = gap_len / len(unmatched_scenes)
                        for idx_unmatched in range(len(unmatched_scenes)):
                            scene_idx = i + idx_unmatched
                            scene_core_times[scene_idx]['start'] = current_t
                            scene_core_times[scene_idx]['end'] = current_t + dur
                            current_t += dur
                    i = j
                else:
                    i += 1

            # 2. Tính toán khoảng cắt (cut start/end) chia hoàn toàn các gap để tổng thời lượng bằng audio gốc
            scene_cuts = []
            for i in range(len(scenes)):
                s_time = scene_core_times[i]['start']
                e_time = scene_core_times[i]['end']
                
                # Xác định thời điểm bắt đầu cắt
                if i == 0:
                    cut_start = 0.0
                else:
                    prev_end = scene_core_times[i-1]['end']
                    gap_prev = max(0.0, s_time - prev_end)
                    len_prev = len(str(scenes[i-1].get('text', '')))
                    len_curr = len(str(scenes[i].get('text', '')))
                    total_len = len_prev + len_curr
                    ratio_prev = len_prev / total_len if total_len > 0 else 0.5
                    cut_start = prev_end + gap_prev * ratio_prev
                
                # Xác định thời điểm kết thúc cắt
                if i == len(scenes) - 1:
                    cut_end = total_duration_sec
                else:
                    next_start = scene_core_times[i+1]['start']
                    gap_next = max(0.0, next_start - e_time)
                    len_curr = len(str(scenes[i].get('text', '')))
                    len_next = len(str(scenes[i+1].get('text', '')))
                    total_len = len_curr + len_next
                    ratio_curr = len_curr / total_len if total_len > 0 else 0.5
                    cut_end = e_time + gap_next * ratio_curr
                
                if cut_start >= cut_end:
                    cut_end = cut_start + 0.1
                        
                scene_cuts.append({'start': cut_start, 'end': cut_end})
            
            file_counter = 1
            self.log("-> Đang xuất file Voice (Chỉ theo thứ tự 1, 2, 3...)...")
            
            for i, scene in enumerate(scenes):
                cut_start = scene_cuts[i]['start']
                cut_end = scene_cuts[i]['end']
                
                # Không cắt nhỏ audio theo prompt_count để tránh lệch nhịp 1-1 với timeline CapCut
                sliced_audio = audio[int(cut_start * 1000) : int(cut_end * 1000)]
                
                file_name = f"{file_counter}_PhanCanh_{scene['id']}_Part1.wav"
                output_path = os.path.join(out_voice_dir, file_name)
                sliced_audio.export(output_path, format="wav")
                file_counter += 1
                    
            self.log(f"✅ HOÀN TẤT BƯỚC 1! Đã cắt {file_counter - 1} file Audio.")
            self.log(f"⭐ HOÀN TẤT BƯỚC 1! Đã cắt {file_counter - 1} file Audio.")
        except Exception as e:
            self.log(f"\n❌ Lỗi: {str(e)}")
            raise e

    def browse_sync_json(self):
        file_path = filedialog.askopenfilename(title="Chọn file draft_content.json", filetypes=[("JSON Files", "*.json")])
        if file_path:
            self.entry_sync_json.delete(0, 'end'); self.entry_sync_json.insert(0, file_path)
            self.save_config()

    def run_automix_workflow(self):
        txt_path = self.entry_slice_script.get().strip()
        audio_path = self.entry_slice_audio.get().strip()
        out_voice_dir = self.entry_slice_out.get().strip()
        base_dir = self.entry_template_proj.get().strip()
        new_name = self.entry_new_proj_name.get().strip()
        img_dir = self.entry_img_dir.get().strip()
        skip_slice = getattr(self, "chk_skip_slice", ctk.CTkCheckBox(self)).get() == 1
        mix_voices = getattr(self, "entry_mix_voices", ctk.CTkEntry(self)).get().strip()
        
        if not skip_slice:
            if not all([txt_path, audio_path, base_dir, new_name, img_dir]):
                messagebox.showwarning("Lỗi", "Vui lòng điền đầy đủ 5 trường thông tin (Kịch bản, Audio, Thư mục Ảnh, Template, Tên mới)!")
                return
        else:
            if not all([base_dir, new_name, img_dir, mix_voices]):
                messagebox.showwarning("Lỗi", "Vui lòng điền Thư mục Ảnh, Thư mục Voice đã cắt, Template và Tên mới!")
                return
            
        if not os.path.isdir(base_dir):
            messagebox.showerror("Lỗi", "Thư mục CapCut gốc không tồn tại hoặc không phải là thư mục!")
            return
            
        if not os.path.exists(os.path.join(base_dir, "draft_content.json")):
            messagebox.showerror("Lỗi", "Thư mục CapCut gốc không chứa file draft_content.json!")
            return
            
        if not skip_slice and shutil.which("ffmpeg") is None:
            messagebox.showerror("Thiếu FFmpeg", "Hệ thống phát hiện máy tính chưa có FFmpeg.\nHãy cài đặt FFmpeg để có thể cắt Audio.")
            return

        self.btn_run_automix.configure(state="disabled", text="⏳ ĐANG CHẠY AUTO-MIX...")
        self.log("BẮT ĐẦU QUY TRÌNH AUTO-MIX...", clear=True)
        threading.Thread(target=self._process_automix_workflow, args=(txt_path, audio_path, out_voice_dir, base_dir, new_name, skip_slice, mix_voices), daemon=True).start()

    def _process_automix_workflow(self, txt_path, audio_path, out_voice_dir, base_dir, new_name, skip_slice, mix_voices):
        try:
            from datetime import datetime
            
            # 1. CLONE PROJECT
            self.log("-> BƯỚC 1: ĐANG CLONE PROJECT CAPCUT...")
            from datetime import datetime
            timestamp = datetime.now().strftime("%d%m")
            new_proj_folder_name = f"{new_name}_{timestamp}"
            parent_dir = os.path.dirname(base_dir)
            new_proj_dir = os.path.join(parent_dir, new_proj_folder_name)
            
            counter = 1
            while os.path.exists(new_proj_dir):
                new_proj_folder_name = f"{new_name} ({counter})"
                new_proj_dir = os.path.join(parent_dir, new_proj_folder_name)
                counter += 1
            
            shutil.copytree(base_dir, new_proj_dir)
            self.log(f"-> Đã clone thành công sang: {new_proj_folder_name}")
            
            # Cập nhật draft_info.json nếu có
            info_file = os.path.join(new_proj_dir, "draft_info.json")
            if os.path.exists(info_file):
                try:
                    with open(info_file, 'r', encoding='utf-8') as f: info_data = json.load(f)
                    info_data['draft_name'] = new_proj_folder_name
                    with open(info_file, 'w', encoding='utf-8') as f: json.dump(info_data, f, ensure_ascii=False, indent=2)
                except Exception as e:
                    self.log(f"-> Cảnh báo: Không thể cập nhật draft_info.json: {e}")
            
            # 2. CẮT AUDIO
            if not skip_slice:
                self.log("\n-> BƯỚC 2: ĐANG CẮT AUDIO BẰNG WHISPER...")
                if not out_voice_dir:
                    out_voice_dir = os.path.join(new_proj_dir, "audio_cuts")
                self._process_audio_slicing(txt_path, audio_path, out_voice_dir)
            else:
                self.log("\n-> BƯỚC 2: BỎ QUA CẮT AUDIO, SỬ DỤNG VOICE CÓ SẴN...")
                out_voice_dir = mix_voices
            
            # 3. CHUẨN BỊ ẢNH VÀ VOICE (NATURAL SORTING)
            self.log("\n-> BƯỚC 3: ĐANG NẠP ẢNH VÀ VOICE...")
            import re
            def atoi(text): return int(text) if text.isdigit() else text
            def natural_keys(text): return [atoi(c) for c in re.split(r'(\d+)', text)]
            
            img_dir = self.entry_img_dir.get().strip()
            
            # Lấy list ảnh
            valid_exts = ['.jpg', '.jpeg', '.png', '.mp4']
            images = [f for f in os.listdir(img_dir) if any(f.lower().endswith(ext) for ext in valid_exts)]
            images.sort(key=natural_keys)
            
            # Lấy list voice
            voices = [f for f in os.listdir(out_voice_dir) if f.lower().endswith('.mp3') or f.lower().endswith('.wav')]
            voices.sort(key=natural_keys)
            
            if not voices: raise Exception("Không tìm thấy file audio nào được cắt ra!")
            if not images: raise Exception("Không tìm thấy ảnh/video nào trong thư mục!")
            
            # 4. AUTO-REPLACE (BƠM FILE VÀO DRAFT CONTENT)
            self.log("-> BƯỚC 4: THAY THẾ TEMPLATE PROJECT BẰNG DỮ LIỆU MỚI...")
            json_file = os.path.join(new_proj_dir, "draft_content.json")
            with open(json_file, 'r', encoding='utf-8') as f: draft_data = json.load(f)
            
            materials = draft_data.get('materials', {})
            videos_mat = materials.get('videos', [])
            audios_mat = materials.get('audios', [])
            
            vid_mat_dict = {m['id']: m for m in videos_mat}
            aud_mat_dict = {m['id']: m for m in audios_mat}
            
            tracks = draft_data.get('tracks', [])
            video_segments = []
            audio_segments = []
            
            video_tracks = [t for t in tracks if t.get('type') == 'video']
            main_video_track = None
            max_media_segs = -1
            
            for t in video_tracks:
                segs = t.get('segments', [])
                media_count = 0
                for s in segs:
                    mid = s.get('material_id')
                    if mid in vid_mat_dict and vid_mat_dict[mid].get('type') in ['photo', 'video']:
                        media_count += 1
                if media_count > max_media_segs:
                    max_media_segs = media_count
                    main_video_track = t
                    
            if main_video_track:
                video_segments = main_video_track.get('segments', [])
            else:
                video_segments = []
                
            audio_tracks = [t for t in tracks if t.get('type') == 'audio']
            main_audio_track = None
            max_audio_segs = -1
            
            for t in audio_tracks:
                segs = t.get('segments', [])
                audio_count = 0
                for s in segs:
                    mid = s.get('material_id')
                    if mid in aud_mat_dict:
                        audio_count += 1
                if audio_count > max_audio_segs:
                    max_audio_segs = audio_count
                    main_audio_track = t
                    
            if main_audio_track:
                audio_segments = main_audio_track.get('segments', [])
            else:
                audio_segments = []
                    
            # Sắp xếp segments theo thời gian bắt đầu
            video_segments.sort(key=lambda s: s.get('target_timerange', {}).get('start', 0))
            audio_segments.sort(key=lambda s: s.get('target_timerange', {}).get('start', 0))
            
            vid_mat_ids_in_order = []
            for seg in video_segments:
                mid = seg.get('material_id')
                if mid and mid not in vid_mat_ids_in_order and mid in vid_mat_dict:
                    vid_mat_ids_in_order.append(mid)
                    
            aud_mat_ids_in_order = []
            for seg in audio_segments:
                mid = seg.get('material_id')
                if mid and mid not in aud_mat_ids_in_order and mid in aud_mat_dict:
                    aud_mat_ids_in_order.append(mid)
            
            # Replace Videos/Images
            img_idx = 0
            for mid in vid_mat_ids_in_order:
                if img_idx < len(images):
                    if vid_mat_dict[mid].get('type') in ['photo', 'video']:
                        vid_mat_dict[mid]['path'] = os.path.join(img_dir, images[img_idx]).replace('\\', '/')
                        vid_mat_dict[mid]['name'] = images[img_idx]
                        img_idx += 1
                        
            # Replace Audios
            aud_idx = 0
            for mid in aud_mat_ids_in_order:
                if aud_idx < len(voices):
                    aud_mat_dict[mid]['path'] = os.path.join(out_voice_dir, voices[aud_idx]).replace('\\', '/')
                    aud_mat_dict[mid]['name'] = voices[aud_idx]
                    aud_idx += 1
            
            self.log(f"-> Đã thay thế {img_idx} Hình ảnh và {aud_idx} Âm thanh vào Template.")
            with open(json_file, 'w', encoding='utf-8') as f: json.dump(draft_data, f, ensure_ascii=False)
            
            # 5. ĐỒNG BỘ TIMELINE (GIÃN HÌNH)
            self.log("\n-> BƯỚC 5: ĐANG ĐỒNG BỘ TIMELINE...")
            self._process_sync_timeline(json_file)
            
            self.log(f"\n🎉 HOÀN TẤT QUY TRÌNH TẠO PROJECT HOÀN CHỈNH!")
            if getattr(self, "chk_tele_automix", ctk.CTkCheckBox(self)).get() == 1:
                self.send_telegram_msg(f"✅ [AUTO-MIX THÀNH CÔNG]\nProject mới: {new_proj_folder_name}\nĐã thay thế {img_idx} ảnh và {aud_idx} audio.")
                
            if getattr(self, "chk_restart_automix", ctk.CTkCheckBox(self)).get() == 1:
                restart_capcut()
                messagebox.showinfo("Thành Công", f"Đã hoàn tất!\nProject mới: {new_proj_folder_name}\nCapCut đã được khởi động lại.")
            else:
                messagebox.showinfo("Thành Công", f"Đã hoàn tất!\nProject mới: {new_proj_folder_name}\nHãy mở CapCut để kiểm tra.")
            
        except Exception as e:
            self.log(f"\n❌ Lỗi Auto-Mix: {str(e)}")
            messagebox.showerror("Lỗi", f"Có lỗi xảy ra trong quá trình Auto-Mix:\n{str(e)}")
        finally:
            self.btn_run_automix.configure(state="normal", text="🚀 KHỞI CHẠY TẠO PROJECT & ĐỒNG BỘ")

    def run_sync_timeline(self):
        json_file = self.entry_sync_json.get().strip()
        if not json_file or not os.path.exists(json_file):
            messagebox.showerror("Lỗi", "Vui lòng chọn file draft_content.json hợp lệ!")
            return

        self.btn_run_sync.configure(state="disabled", text="⏳ ĐANG ĐỒNG BỘ...")
        self.log("BẮT ĐẦU ĐỒNG BỘ TIMELINE CAPCUT (TRÁI -> PHẢI)...", clear=True)
        
        def _thread_wrapper():
            try:
                self._process_sync_timeline(json_file)
                if getattr(self, "chk_restart_sync", ctk.CTkCheckBox(self)).get() == 1:
                    restart_capcut()
                    messagebox.showinfo("Thành công", "Đã đồng bộ Timeline hoàn tất và khởi động lại CapCut!")
                else:
                    messagebox.showinfo("Thành công", "Đã đồng bộ Timeline hoàn tất!")
            except Exception as e:
                messagebox.showerror("Lỗi", f"Lỗi đồng bộ:\n{str(e)}")
            finally:
                self.btn_run_sync.configure(state="normal", text="▶ CHẠY ĐỒNG BỘ LẺ")
                
        threading.Thread(target=_thread_wrapper, daemon=True).start()

    def _process_sync_timeline(self, json_file):
        backup_file = json_file + ".backup"
        shutil.copy2(json_file, backup_file)
        self.log(f"💾 Đã tạo bản sao lưu an toàn: {os.path.basename(backup_file)}")
        
        try:
            with open(json_file, 'r', encoding='utf-8') as f: data = json.load(f)

            materials = data.get('materials', {})
            videos_mat = materials.get('videos', [])
            audios_mat = materials.get('audios', [])

            # CHỈNH SỬA: Chấp nhận cả type = photo và video để không bị xót nếu Timeline có Video
            vid_dict = {m['id']: m for m in videos_mat if m.get('type') in ['photo', 'video']}
            aud_dict = {m['id']: m for m in audios_mat}

            tracks = data.get('tracks', [])
            photo_segments = []
            audio_segments = []

            # TÌM MAIN VIDEO TRACK
            video_tracks = [t for t in tracks if t.get('type') == 'video']
            main_video_track = None
            max_media_segs = -1
            for t in video_tracks:
                segs = t.get('segments', [])
                media_count = sum(1 for s in segs if s.get('material_id') in vid_dict)
                if media_count > max_media_segs:
                    max_media_segs = media_count
                    main_video_track = t
                    
            if main_video_track:
                for seg in main_video_track.get('segments', []):
                    mat_id = seg.get('material_id')
                    if mat_id in vid_dict: photo_segments.append({'segment': seg, 'material': vid_dict[mat_id]})

            # TÌM MAIN AUDIO TRACK
            audio_tracks = [t for t in tracks if t.get('type') == 'audio']
            main_audio_track = None
            max_audio_segs = -1
            for t in audio_tracks:
                segs = t.get('segments', [])
                audio_count = sum(1 for s in segs if s.get('material_id') in aud_dict)
                if audio_count > max_audio_segs:
                    max_audio_segs = audio_count
                    main_audio_track = t
                    
            if main_audio_track:
                for seg in main_audio_track.get('segments', []):
                    mat_id = seg.get('material_id')
                    if mat_id in aud_dict: audio_segments.append({'segment': seg, 'material': aud_dict[mat_id]})

            # SẮP XẾP LẠI THEO THỨ TỰ TỪ TRÁI SANG PHẢI TRÊN TIMELINE
            photo_segments.sort(key=lambda x: x['segment'].get('target_timerange', {}).get('start', 0))
            audio_segments.sort(key=lambda x: x['segment'].get('target_timerange', {}).get('start', 0))

            num_photos = len(photo_segments)
            num_audios = len(audio_segments)
            self.log(f"📷 Tìm thấy {num_photos} Ảnh/Video trên timeline.")
            self.log(f"🎵 Tìm thấy {num_audios} Âm thanh trên timeline.")

            if num_photos == 0 or num_audios == 0:
                self.log("❌ Lỗi: Không tìm thấy ảnh/video hoặc âm thanh trong project này.")
                raise Exception("Không có ảnh/video hoặc âm thanh trong timeline!")

            if num_photos != num_audios: 
                self.log("⚠️ Cảnh báo: Số lượng Ảnh/Video và Âm thanh không khớp nhau! Tool sẽ ghép theo thứ tự 1-1.")
            
            target_count = min(num_photos, num_audios)
            self.log("⏳ Đang đồng bộ thời gian từ Trái sang Phải...")
            
            current_time = 0 
            for i in range(target_count):
                p_item = photo_segments[i]
                a_item = audio_segments[i]

                p_seg = p_item['segment']; a_seg = a_item['segment']
                photo_name = util_get_filename_from_path(p_item['material']['path'])
                audio_name = util_get_filename_from_path(a_item['material']['path'])
                mat_type = p_item['material'].get('type', 'photo')

                # Lấy duration thực tế của Audio từ chính file Audio để khớp siêu chuẩn
                audio_path = a_item['material']['path']
                try:
                    from pydub import AudioSegment
                    real_audio = AudioSegment.from_file(audio_path)
                    audio_duration = len(real_audio) * 1000
                    # Ép CapCut cập nhật đúng duration thật của voice mới
                    a_seg['source_timerange'] = {'start': 0, 'duration': audio_duration}
                    if 'target_timerange' in a_seg:
                        a_seg['target_timerange']['duration'] = audio_duration
                    a_item['material']['duration'] = audio_duration
                except Exception as e:
                    self.log(f"-> Lỗi lấy duration file audio gốc: {e}")
                    audio_duration = a_seg.get('target_timerange', {}).get('duration', 0)
                    if audio_duration == 0:
                        audio_duration = a_seg.get('source_timerange', {}).get('duration', 3000000)

                # 1. Kéo Audio sát lại gần nhau (xóa khoảng trống)
                a_seg['target_timerange']['start'] = current_time
                
                # 2. Khớp Ảnh/Video (Start và Duration)
                p_seg['target_timerange']['start'] = current_time
                p_seg['target_timerange']['duration'] = audio_duration
                
                # CHỈNH SỬA: Xử lý source_timerange an toàn
                if 'source_timerange' not in p_seg:
                    p_seg['source_timerange'] = {'start': 0, 'duration': audio_duration}
                else:
                    p_seg['source_timerange']['start'] = 0
                    # Nếu là Ảnh thì giãn độ dài thoải mái. Nếu là Video thì giãn độ dài có thể gây hỏng/đơ clip
                    if mat_type == 'photo': 
                        p_seg['source_timerange']['duration'] = audio_duration

                # Cập nhật giới hạn vật lý của Material (Chỉ nên ép đối với định dạng Ảnh)
                if mat_type == 'photo':
                    p_item['material']['duration'] = audio_duration

                self.log(f"✅ Đã đồng bộ: {photo_name[:15]}... <=> {audio_name[:15]}...")
                current_time += audio_duration

            # Ép CapCut đọc đúng thứ tự mảng Track (chống lỗi chèn/lộn vị trí)
            for track in tracks:
                if 'segments' in track and isinstance(track['segments'], list):
                    track['segments'].sort(key=lambda s: s.get('target_timerange', {}).get('start', 0))

            data['duration'] = current_time
            with open(json_file, 'w', encoding='utf-8') as f: json.dump(data, f, ensure_ascii=False)
                
            self.log("\n🎉 HOÀN TẤT ĐỒNG BỘ TIMELINE!")
            messagebox.showinfo("Thành công", "Đã đồng bộ thời lượng các cặp Ảnh/Voice thành công theo đúng thứ tự!\nHãy mở lại dự án trong phần mềm CapCut.")

        except Exception as e:
            self.log(f"❌ Lỗi: {e}")
            if os.path.exists(backup_file): shutil.copy2(backup_file, json_file); self.log("Đã khôi phục file dự phòng.")
            raise e


    # =========================================================================
    # AI PROMPT & BYPASS LOGIC
    # =========================================================================
    def start_prompt_thread_from_hotkey(self):
        if not self.is_prompt_running: self.after(0, self.start_prompt_thread)

    def start_prompt_thread(self):
        if self.is_prompt_running: return
        self.save_config()
        prompts_raw = self.txt_prompts.get("1.0", "end").strip().split('\n')
        self.prompts_list = [p.strip() for p in prompts_raw if p.strip()]
        if not self.prompts_list:
            messagebox.showwarning("Cảnh báo", "Vui lòng nhập ít nhất 1 prompt!")
            return

        self.is_prompt_running = True
        self.prompt_stop_requested = False
        self.btn_start_prompt.configure(state="disabled", fg_color="#555555")
        self.btn_stop_prompt.configure(state="normal", fg_color="#e74c3c")
        self.log("BẮT ĐẦU AUTO PROMPT...", clear=True)
        threading.Thread(target=self.prompt_automation_logic, daemon=True).start()

    def stop_prompt_thread(self):
        if self.is_prompt_running:
            self.prompt_stop_requested = True
            self.log("⚠️ Yêu cầu dừng Auto Prompt khẩn cấp...")
            self.btn_stop_prompt.configure(state="disabled")

    def smart_sleep(self, seconds):
        steps = int(seconds * 10)
        for _ in range(steps):
            if self.prompt_stop_requested: return False
            time.sleep(0.1)
        return True

    def prompt_automation_logic(self):
        try:
            x1, y1 = int(self.entry_prompt_x1.get()), int(self.entry_prompt_y1.get())
            x2, y2 = int(self.entry_prompt_x2.get()), int(self.entry_prompt_y2.get())
            x3, y3 = int(self.entry_prompt_x3.get()), int(self.entry_prompt_y3.get())
            wait_time = int(self.entry_prompt_wait.get())
        except ValueError:
            self.log("❌ Lỗi: Tọa độ hoặc thời gian Auto Prompt phải là số nguyên!")
            self.reset_prompt_ui(); return

        self.log("🚀 Bắt đầu quy trình Auto Prompt AI (Chuyển sang CapCut trong 1s)...")
        if not self.smart_sleep(1.0): self.reset_prompt_ui(); return

        total = len(self.prompts_list)
        for idx, prompt in enumerate(self.prompts_list):
            if self.prompt_stop_requested: break
            self.log(f"Đang xử lý Video {idx + 1}/{total}...")
            
            pyautogui.click(x1, y1)
            if not self.smart_sleep(0.5): break
            pyautogui.hotkey('ctrl', 'a')
            if not self.smart_sleep(0.3): break
            pyautogui.press('delete')
            if not self.smart_sleep(0.5): break
            pyperclip.copy(prompt)
            pyautogui.hotkey('ctrl', 'v')
            if not self.smart_sleep(1.0): break

            pyautogui.click(x2, y2)
            for t in range(wait_time, 0, -1):
                if self.prompt_stop_requested: break
                if t % 5 == 0: self.log(f" -> AI đang render video {idx + 1}... ({t}s còn lại)")
                if not self.smart_sleep(1.0): break

            if self.prompt_stop_requested: break
            pyautogui.click(x3, y3)
            if not self.smart_sleep(1.5): break

        if self.prompt_stop_requested: self.log("⏹ ĐÃ DỪNG AUTO PROMPT!")
        else:
            self.log("✅ HOÀN THÀNH TOÀN BỘ DANH SÁCH PROMPT!")
            messagebox.showinfo("Thành công", "Đã chạy xong tất cả các prompt AI!")
            
        self.after(0, self.reset_prompt_ui)

    def reset_prompt_ui(self):
        self.is_prompt_running = False
        self.prompt_stop_requested = False
        self.btn_start_prompt.configure(state="normal", fg_color="#2ecc71")
        self.btn_stop_prompt.configure(state="disabled", fg_color="#e74c3c")

    def browse_bypass_json(self):
        file_path = filedialog.askopenfilename(title="Chọn file draft_content.json", filetypes=[("JSON Files", "*.json")])
        if file_path:
            self.entry_bypass_json.delete(0, 'end'); self.entry_bypass_json.insert(0, file_path)
            self.save_config()

    def run_ai_bypass(self):
        json_path = self.entry_bypass_json.get().strip()
        if not json_path or not os.path.exists(json_path):
            messagebox.showwarning("Cảnh báo", "Vui lòng chọn đúng file draft_content.json hiện có!")
            return

        self.log("Bắt đầu phân tích dự án để gỡ AI Watermark...", clear=True)
        try:
            project_dir = os.path.dirname(json_path)
            ai_material_dir = os.path.join(project_dir, "ai_material")
            bypass_dir_name = "Clean_Media"
            bypass_dir_path = os.path.join(project_dir, bypass_dir_name)
            
            if not os.path.exists(bypass_dir_path):
                os.makedirs(bypass_dir_path)
                self.log(f"✔ Đã tạo thư mục chứa video sạch: {bypass_dir_name}")

            backup_file = os.path.join(project_dir, f"draft_content_backup_{int(time.time())}.json")
            shutil.copy2(json_path, backup_file)
            self.log(f"✔ Đã tạo file Backup an toàn: {os.path.basename(backup_file)}")

            with open(json_path, 'r', encoding='utf-8') as f: draft = json.load(f)

            replaced_count = 0
            file_copied_count = 0
            id_mapping = {}

            target_materials = []
            if "materials" in draft:
                if "videos" in draft["materials"]: target_materials.extend(draft["materials"]["videos"])
                if "images" in draft["materials"]: target_materials.extend(draft["materials"]["images"])

            for item in target_materials:
                path_str = item.get("path", "")
                cat_id = item.get("category_id", "")
                is_ai = False
                if "ai_material" in path_str: is_ai = True
                if "agic_generate" in str(cat_id): is_ai = True
                if item.get("is_ai_generate_content", False) is True: is_ai = True
                if item.get("aigc_type", "none") != "none": is_ai = True

                if is_ai:
                    old_id = item.get("id")
                    original_filename = os.path.basename(path_str.replace('\\', '/'))
                    src_file = os.path.join(ai_material_dir, original_filename)
                    new_filename = f"video_{uuid.uuid4().hex[:6]}_{original_filename}"
                    dst_file = os.path.join(bypass_dir_path, new_filename)

                    if os.path.exists(src_file):
                        if not os.path.exists(dst_file):
                            try:
                                shutil.copy2(src_file, dst_file)
                                file_copied_count += 1
                            except Exception as e: self.log(f"⚠ Lỗi copy file {original_filename}: {e}")
                    else:
                        self.log(f"⚠ Chú ý: Không tìm thấy file gốc {src_file}, sẽ dùng đường dẫn tạm.")
                    
                    abs_new_path = dst_file.replace('\\', '/')
                    item["path"] = abs_new_path
                    new_id = uuid.uuid4().hex.upper()
                    item["id"] = new_id
                    if old_id: id_mapping[old_id] = new_id

                    if "material_name" in item and "AI" in item["material_name"]: item["material_name"] = "Video Local (Đã sạch)"
                    item["category_id"] = "local"; item["category_name"] = "local"
                    item["is_ai_generate_content"] = False; item["aigc_type"] = "none"

                    if "video_algorithm" in item and isinstance(item["video_algorithm"], dict):
                        item["video_algorithm"]["path"] = abs_new_path
                        if "aigc_generate" in item["video_algorithm"]: del item["video_algorithm"]["aigc_generate"]
                        if "algorithms" in item["video_algorithm"]: item["video_algorithm"]["algorithms"] = []
                    
                    for key in ["aigc_generate", "ai_generate_info", "aigc_info"]:
                        if key in item: del item[key]
                    
                    replaced_count += 1
                    self.log(f"  -> Xử lý OK: {original_filename}")

            if replaced_count > 0:
                for track in draft.get("tracks", []):
                    for segment in track.get("segments", []):
                        seg_mat_id = segment.get("material_id")
                        if seg_mat_id in id_mapping: segment["material_id"] = id_mapping[seg_mat_id]
                        extra_refs = segment.get("extra_material_refs", [])
                        for i in range(len(extra_refs)):
                            if extra_refs[i] in id_mapping: extra_refs[i] = id_mapping[extra_refs[i]]

            if replaced_count == 0:
                self.log("⚠ Không tìm thấy video AI nào cần xử lý.")
                messagebox.showinfo("Thông báo", "Không tìm thấy file AI nào để sửa trong Project này.")
                return

            self.log(f"\n=> TỔNG KẾT: Sửa {replaced_count} file JSON | Copy an toàn {file_copied_count} file media.")
            with open(json_path, 'w', encoding='utf-8') as f: json.dump(draft, f, ensure_ascii=False, separators=(',', ':'))
                
            self.log(f"🚀 HOÀN TẤT GỠ WATERMARK!")
            messagebox.showinfo("Tuyệt Vời!", f"Đã gỡ Logo AI thành công cho {replaced_count} video!\n👉 HÃY TẮT PROJECT TRONG CAPCUT VÀ MỞ LẠI là xong.")
        except Exception as e:
            self.log(f"❌ LỖI BYPASS AI: {str(e)}")
            messagebox.showerror("Lỗi", f"Có lỗi xảy ra trong quá trình xử lý:\n{str(e)}")


    # --- AI RENAME PRO LOGIC ---
    def browse_rename_dir(self):
        d = filedialog.askdirectory(title="Chọn thư mục chứa ảnh/nhạc")
        if d:
            self.entry_rename_dir.delete(0, 'end'); self.entry_rename_dir.insert(0, d)
            self.save_config()

    def rename_save_rules(self):
        try:
            with open(CONFIG_PROMPT_RENAME, 'w', encoding='utf-8') as f: f.write(self.txt_rename_prompt.get('1.0', 'end-1c').strip())
            with open(CONFIG_REPLACE_RENAME, 'w', encoding='utf-8') as f: f.write(self.txt_rename_replace.get('1.0', 'end-1c').strip())
        except Exception as e: self.log(f"Lỗi khi lưu Rename rules: {e}")

    def rename_clean_for_match(self, text):
        text = os.path.splitext(text)[0]
        text = re.sub(r'_\d{10,}(?:_\d+)?$', '', text)
        text = re.sub(r'\(\d+\)$', '', text) 
        return re.sub(r'[^a-zA-Z0-9]', '', text).lower()

    def rename_sanitize_filename(self, text):
        text = re.sub(r'[\\/*?:"<>|]', "", text)
        text = text.replace('\n', ' ').replace('\r', '')
        if len(text) > 150: text = text[:147] + "..."
        return text.strip()

    def rename_get_sorted_files(self, dir_path):
        files = [f for f in os.listdir(dir_path) if os.path.isfile(os.path.join(dir_path, f))]
        sort_val = self.rename_sort_method.get()
        if "Thời Gian" in sort_val: files.sort(key=lambda x: os.path.getctime(os.path.join(dir_path, x)))
        else: files.sort()
        return files

    def check_missing_images(self):
        dir_path = self.entry_rename_dir.get().strip()
        prompts_text = self.txt_rename_prompt.get('1.0', 'end-1c').strip()
        
        if not dir_path or not os.path.exists(dir_path):
            messagebox.showwarning("Cảnh báo", "Vui lòng chọn thư mục chứa ảnh trước!")
            return
        if not prompts_text:
            messagebox.showwarning("Thiếu dữ liệu", "Vui lòng nhập danh sách Prompt!")
            return
            
        prompts = [p.strip() for p in prompts_text.split('\n') if p.strip()]
        all_files = [f for f in os.listdir(dir_path) if os.path.isfile(os.path.join(dir_path, f))]
        parsed_prompts = []
        for i, p in enumerate(prompts):
            m = re.search(r'^\s*(\d+)', p)
            num_str = m.group(1) if m else str(i+1)
            parsed_prompts.append({'num': num_str, 'text': p, 'matched': False})
            
        match_val = self.rename_sort_method.get()
        if "Ghép Thông Minh" in match_val:
            available_files = all_files.copy()
            for p_dict in parsed_prompts:
                prompt_text = p_dict['text']
                clean_p = self.rename_clean_for_match(prompt_text)
                m_p = re.search(r'^\s*(\d+)', prompt_text)
                actual_num_p = m_p.group(1) if m_p else None

                best_match = None; best_score = 0
                for f in available_files:
                    m_f = re.search(r'^\s*(\d+)', f)
                    actual_num_f = m_f.group(1) if m_f else None
                    if actual_num_p and actual_num_f and int(actual_num_p) != int(actual_num_f): continue

                    clean_f = self.rename_clean_for_match(f)
                    if clean_p.startswith(clean_f) or clean_f.startswith(clean_p):
                        best_match = f; best_score = 1.0; break
                    score = difflib.SequenceMatcher(None, clean_p[:len(clean_f)], clean_f).ratio()
                    if score > best_score: best_score = score; best_match = f
                if best_match and best_score > 0.4:
                    p_dict['matched'] = True
                    available_files.remove(best_match)
        else:
            sorted_files = self.rename_get_sorted_files(dir_path)
            limit = min(len(sorted_files), len(parsed_prompts))
            for i in range(limit): parsed_prompts[i]['matched'] = True
                
        self.show_filter_results(parsed_prompts)

    def show_filter_results(self, parsed_prompts):
        result_win = ctk.CTkToplevel(self)
        result_win.title("Kết Quả Lọc Phân Tích Prompt & Ảnh")
        result_win.geometry("900x600")
        result_win.transient(self)
        
        missing = [p for p in parsed_prompts if not p['matched']]
        matched = [p for p in parsed_prompts if p['matched']]
        
        notebook = ctk.CTkTabview(result_win)
        notebook.pack(fill="both", expand=True, padx=10, pady=10)
        
        tab_miss = notebook.add(f"❌ CHƯA CÓ ẢNH ({len(missing)})")
        tab_match = notebook.add(f"✅ ĐÃ CÓ ẢNH ({len(matched)})")

        def build_tab(parent, data_list):
            nums = [p['num'] for p in data_list]
            texts = [p['text'] for p in data_list]

            ctk.CTkLabel(parent, text="Dạng 1: Dãy số thứ tự (Copy chuỗi này để chạy lại):", font=ctk.CTkFont(weight="bold")).pack(anchor="w", pady=(5, 5))
            txt_nums = ctk.CTkTextbox(parent, height=60)
            txt_nums.pack(fill="x", pady=(0, 15))
            txt_nums.insert("1.0", ", ".join(nums))

            ctk.CTkLabel(parent, text="Dạng 2: Danh sách Prompt hoàn chỉnh:", font=ctk.CTkFont(weight="bold")).pack(anchor="w", pady=(0, 5))
            txt_texts = ctk.CTkTextbox(parent)
            txt_texts.pack(fill="both", expand=True)
            txt_texts.insert("1.0", "\n".join(texts))

        build_tab(tab_miss, missing)
        build_tab(tab_match, matched)

    def process_prompt_mode(self, is_preview=True):
        dir_path = self.entry_rename_dir.get().strip()
        prompts_text = self.txt_rename_prompt.get('1.0', 'end-1c').strip()
        if not prompts_text:
            messagebox.showwarning("Thiếu dữ liệu", "Vui lòng nhập danh sách Prompt ở Tab 1!")
            return
            
        prompts = [p.strip() for p in prompts_text.split('\n') if p.strip()]
        all_files = [f for f in os.listdir(dir_path) if os.path.isfile(os.path.join(dir_path, f))]
        if not all_files:
            self.log("⚠️ Thư mục trống hoặc không có file hợp lệ.", clear=True); return

        mode_text = "👀 XEM TRƯỚC (CHẾ ĐỘ PROMPT)" if is_preview else "⚡ ĐỔI TÊN THẬT (CHẾ ĐỘ PROMPT)"
        self.log(f"--- {mode_text} ---", clear=True)
        self.log(f"Tìm thấy {len(all_files)} file ảnh và {len(prompts)} dòng prompts.\n")
        
        match_val = self.rename_sort_method.get()
        matched_pairs = []

        if "Ghép Thông Minh" in match_val:
            self.log("🔍 Đang sử dụng thuật toán AI Ghép Thông Minh...")
            available_files = all_files.copy()

            for i, prompt in enumerate(prompts):
                if not available_files: break
                clean_p = self.rename_clean_for_match(prompt)
                m_p = re.search(r'^\s*(\d+)', prompt)
                actual_num_p = m_p.group(1) if m_p else None

                best_match = None; best_score = 0
                for f in available_files:
                    m_f = re.search(r'^\s*(\d+)', f)
                    actual_num_f = m_f.group(1) if m_f else None
                    if actual_num_p and actual_num_f and int(actual_num_p) != int(actual_num_f): continue

                    clean_f = self.rename_clean_for_match(f)
                    if clean_p.startswith(clean_f) or clean_f.startswith(clean_p):
                        best_match = f; best_score = 1.0; break
                    score = difflib.SequenceMatcher(None, clean_p[:len(clean_f)], clean_f).ratio()
                    if score > best_score: best_score = score; best_match = f

                if best_match and best_score > 0.4:
                    available_files.remove(best_match)
                    matched_pairs.append((best_match, prompt, i+1))
                else:
                    self.log(f"⚠️ [BỎ QUA] Không tìm thấy ảnh khớp với Prompt {i+1}: '{prompt[:30]}...'")
        else:
            sorted_files = self.rename_get_sorted_files(dir_path)
            limit = min(len(sorted_files), len(prompts))
            for i in range(limit): matched_pairs.append((sorted_files[i], prompts[i], i+1))
            if len(sorted_files) != len(prompts): self.log("⚠️ LƯU Ý: Số lượng file và prompt không khớp nhau!\n")

        match_count, error_count = 0, 0
        for old_filename, prompt, index in matched_pairs:
            name_part, ext_part = os.path.splitext(old_filename)
            safe_prompt = self.rename_sanitize_filename(prompt)
            new_filename = f"{index} {safe_prompt}{ext_part}"
            
            old_filepath = os.path.join(dir_path, old_filename)
            new_filepath = os.path.join(dir_path, new_filename)
            if old_filename == new_filename: continue
                
            match_count += 1
            if is_preview: self.log(f"[{index}] {old_filename}\n ↳ {new_filename}\n")
            else:
                if os.path.exists(new_filepath):
                    self.log(f"⚠️ [BỎ QUA] Tên đã tồn tại: {new_filename}"); continue
                try:
                    os.rename(old_filepath, new_filepath); self.log(f"✅ Đổi thành công: {new_filename}")
                except Exception as e:
                    self.log(f"❌ Lỗi ở file {old_filename}: {str(e)}"); error_count += 1

        self.log("-" * 40)
        self.log(f"Hoàn thành: Lên lịch {match_count} file. Lỗi: {error_count}.")
        if not is_preview and match_count > 0: messagebox.showinfo("Thành công", f"Đã xử lý xong {match_count - error_count} file ảnh!")

    def parse_replace_mappings(self):
        text = self.txt_rename_replace.get('1.0', 'end-1c')
        lines = text.strip().split('\n')
        rename_map = {}
        i = 0
        while i < len(lines):
            line = lines[i].strip()
            if not line: i += 1; continue
            if '->' in line or '→' in line or '=' in line:
                sep = '->' if '->' in line else ('→' if '→' in line else '=')
                parts = line.split(sep, 1)
                if len(parts) == 2 and parts[0].strip() and parts[1].strip(): rename_map[parts[0].strip()] = parts[1].strip()
            elif i + 1 < len(lines):
                next_line = lines[i+1].strip()
                if next_line.startswith('->') or next_line.startswith('→'):
                    old_name = line; new_name = re.sub(r'^(->|→)\s*', '', next_line).strip()
                    if old_name and new_name: rename_map[old_name] = new_name
                    i += 1
            i += 1
        return rename_map

    def process_replace_mode(self, is_preview=True):
        dir_path = self.entry_rename_dir.get().strip()
        rename_map = self.parse_replace_mappings()
        if not rename_map:
            messagebox.showwarning("Cảnh báo", "Không nhận diện được quy tắc đổi tên nào ở Tab 2!")
            return

        mode_text = "👀 XEM TRƯỚC (CHẾ ĐỘ TÌM & THAY THẾ)" if is_preview else "⚡ ĐỔI TÊN THẬT (CHẾ ĐỘ TÌM & THAY THẾ)"
        self.log(f"--- {mode_text} ---", clear=True)
        self.log(f"Nhận diện được {len(rename_map)} quy tắc chuyển đổi.\n")

        match_count, error_count = 0, 0
        try:
            for filename in os.listdir(dir_path):
                filepath = os.path.join(dir_path, filename)
                if os.path.isfile(filepath):
                    new_filename = filename
                    for old_name, new_name in rename_map.items():
                        if old_name in new_filename: new_filename = new_filename.replace(old_name, new_name); break
                    
                    if new_filename != filename:
                        match_count += 1
                        new_filepath = os.path.join(dir_path, new_filename)
                        if is_preview: self.log(f"🔄 {filename}\n ↳ {new_filename}\n")
                        else:
                            if os.path.exists(new_filepath):
                                self.log(f"⚠️ [BỎ QUA] File đã tồn tại: {new_filename}"); continue
                            try:
                                os.rename(filepath, new_filepath); self.log(f"✅ {filename} -> {new_filename}")
                            except Exception as e:
                                self.log(f"❌ Lỗi: {filename} - {e}"); error_count += 1

            self.log("-" * 40)
            self.log(f"Hoàn thành! Đã tìm thấy {match_count} file khớp quy tắc.")
            if not is_preview and match_count > 0: messagebox.showinfo("Thành công", f"Đã xử lý xong {match_count - error_count} file!")
        except Exception as e: self.log(f"Lỗi hệ thống: {str(e)}")

    def preview_rename(self):
        if not self.entry_rename_dir.get().strip():
            messagebox.showwarning("Cảnh báo", "Vui lòng chọn thư mục chứa ảnh trước!")
            return
        self.rename_save_rules()
        active_tab = self.rename_tabs.get()
        if "Prompt" in active_tab: self.process_prompt_mode(is_preview=True)
        elif "Format" in active_tab: self.process_format_mode(is_preview=True)
        else: self.process_replace_mode(is_preview=True)

    def execute_rename(self):
        if not self.entry_rename_dir.get().strip():
            messagebox.showwarning("Cảnh báo", "Vui lòng chọn thư mục chứa ảnh trước!")
            return
        if messagebox.askyesno("Xác nhận", "Bạn có chắc chắn muốn ÁP DỤNG ĐỔI TÊN cho các file này không?\n\n(Hành động này sẽ làm thay đổi tên file thật trong máy tính của bạn)"):
            self.rename_save_rules()
            active_tab = self.rename_tabs.get()
            if "Prompt" in active_tab: threading.Thread(target=self.process_prompt_mode, args=(False,), daemon=True).start()
            elif "Format" in active_tab: threading.Thread(target=self.process_format_mode, args=(False,), daemon=True).start()
            else: threading.Thread(target=self.process_replace_mode, args=(False,), daemon=True).start()

    def process_format_mode(self, is_preview=False):
        dir_path = self.entry_rename_dir.get().strip()
        if not os.path.isdir(dir_path): return
        
        try: del_count = int(self.entry_fmt_del.get().strip() or "0")
        except: del_count = 0
        try: add_count = int(self.entry_fmt_add.get().strip() or "0")
        except: add_count = 0
        
        if del_count <= 0 and add_count <= 0:
            if not is_preview: messagebox.showinfo("Bỏ qua", "Vui lòng nhập số lượng > 0 để xóa hoặc thêm!")
            return
            
        files = [f for f in os.listdir(dir_path) if os.path.isfile(os.path.join(dir_path, f))]
        import re
        def atoi(text): return int(text) if text.isdigit() else text
        def natural_keys(text): return [atoi(c) for c in re.split(r'(\d+)', text)]
        files.sort(key=natural_keys)

        preview_text = "=== KẾT QUẢ XEM TRƯỚC (FORMAT SỐ) ===\n\n"
        success_count = 0
        
        for f in files:
            name, ext = os.path.splitext(f)
            if del_count > 0: name = name[del_count:]
            if add_count > 0: name = ("0" * add_count) + name
                
            new_f = name + ext
            if new_f == f: continue
            
            if is_preview:
                preview_text += f"📄 {f}\n ↳ {new_f}\n\n"
                success_count += 1
            else:
                try:
                    os.rename(os.path.join(dir_path, f), os.path.join(dir_path, new_f))
                    success_count += 1
                except: pass
                
        if is_preview:
            if success_count == 0: preview_text += "Không có file nào bị thay đổi."
            else: preview_text += f"Tổng cộng: {success_count} file sẽ được đổi tên."
            self.show_preview_window(preview_text)
        else:
            messagebox.showinfo("Thành công", f"Đã format số thành công cho {success_count} file.")

    def setup_ultra_tab(self, btn_style):
        self.tab_ultra.grid_columnconfigure(0, weight=1)
        self.tab_ultra.grid_columnconfigure(1, weight=1)
        self.tab_ultra.grid_rowconfigure(0, weight=1)

        # Trái
        left_frame = ctk.CTkFrame(self.tab_ultra, fg_color="transparent")
        left_frame.grid(row=0, column=0, padx=20, pady=20, sticky="nsew")

        ctk.CTkLabel(left_frame, text="CAPCUT ULTRA TOOL", font=ctk.CTkFont(size=24, weight="bold")).pack(pady=(20, 10))
        ctk.CTkLabel(left_frame, text="Hệ thống tự động hóa & AI Sound Effect", text_color="gray").pack(pady=(0, 20))

        # Upload Button
        self.ultra_input_file_path = ""
        def select_file():
            file_path = filedialog.askopenfilename(
                title="Chọn file draft_content.json",
                filetypes=[("JSON files", "*.json"), ("All files", "*.*")]
            )
            if file_path:
                self.ultra_input_file_path = file_path
                self.lbl_ultra_file_path.configure(text=f"Đã chọn: {os.path.basename(file_path)}")
                self.lbl_ultra_status.configure(text="SẴN SÀNG XỬ LÝ", text_color="#10b981")
                self.save_config()

        self.btn_ultra_upload = ctk.CTkButton(
            left_frame, 
            text="📁 1. CHỌN FILE DRAFT_CONTENT.JSON GỐC", 
            font=ctk.CTkFont(weight="bold"),
            height=40,
            command=select_file
        )
        self.btn_ultra_upload.pack(fill="x", pady=(10, 5))

        self.lbl_ultra_file_path = ctk.CTkLabel(left_frame, text="Chưa có file nào được chọn.", text_color="gray", wraplength=400)
        self.lbl_ultra_file_path.pack(pady=(0, 10))

        # API Key
        ctk.CTkLabel(left_frame, text="Google Gemini API Key (Bắt buộc cho AI SFX):", font=ctk.CTkFont(weight="bold")).pack(anchor="w", pady=(10, 0))
        self.entry_ultra_api = ctk.CTkEntry(left_frame, placeholder_text="Nhập API Key vào đây...", show="*")
        self.entry_ultra_api.pack(fill="x", pady=5)
        
        # SFX Folder Selection
        self.ultra_sfx_folder_path = ""
        def select_sfx():
            dir_path = filedialog.askdirectory(title="Chọn thư mục chứa Sound Effects")
            if dir_path:
                self.ultra_sfx_folder_path = dir_path
                self.lbl_ultra_sfx.configure(text=f"Thư mục SFX: {dir_path}")
                self.save_config()
        
        self.btn_ultra_sfx = ctk.CTkButton(
            left_frame, 
            text="🎵 3. CHỌN THƯ MỤC SOUND EFFECTS (Tùy chọn)", 
            font=ctk.CTkFont(weight="bold"),
            height=40,
            fg_color="#8b5cf6",
            hover_color="#7c3aed",
            command=select_sfx
        )
        self.btn_ultra_sfx.pack(fill="x", pady=(20, 5))
        
        self.lbl_ultra_sfx = ctk.CTkLabel(left_frame, text="Chưa chọn thư mục SFX", text_color="gray", wraplength=400)
        self.lbl_ultra_sfx.pack(pady=(0, 15))

        # Status Label
        self.lbl_ultra_status = ctk.CTkLabel(left_frame, text="", font=ctk.CTkFont(weight="bold"))
        self.lbl_ultra_status.pack(pady=10)

        # Run Button
        def run_ultra():
            if not HAS_ULTRA_TOOL:
                messagebox.showerror("Lỗi", "Không tìm thấy module capcut_ultra_tool.py (Cần ở cùng thư mục chứa script chính)")
                return
            
            if not self.ultra_input_file_path or not os.path.exists(self.ultra_input_file_path):
                messagebox.showerror("Lỗi", "Vui lòng chọn file draft_content.json trước!")
                return

            if self.opt_ai_sfx_generator.get():
                if not self.entry_ultra_api.get():
                    messagebox.showerror("Lỗi", "Vui lòng nhập Google Gemini API Key để chèn SFX bằng AI!")
                    return
                if not self.ultra_sfx_folder_path:
                    messagebox.showerror("Lỗi", "Vui lòng chọn thư mục chứa Sound Effects trước khi dùng AI!")
                    return

            opts = {
                'sync_image_to_audio': self.opt_sync_image_to_audio.get(),
                'ultra_music_mix': self.opt_ultra_music_mix.get(),
                'custom_audio_order': self.opt_custom_audio_order.get(),
                'randomize_video': self.opt_randomize_video.get(),
                'dynamic_motion': self.opt_dynamic_motion.get(),
                'auto_transition': self.opt_auto_transition.get(),
                'clear_transitions': self.opt_clear_transitions.get(),
                'auto_fill_canvas': self.opt_auto_fill_canvas.get(),
                'normalize_volume': self.opt_normalize_volume.get(),
                'reverse_timeline': self.opt_reverse_timeline.get(),
                'auto_subtitles': self.opt_auto_subtitles.get(),
                'ai_sfx_generator': self.opt_ai_sfx_generator.get(),
                'audio_order_list': self.entry_ultra_audio_order.get(),
                'api_key': self.entry_ultra_api.get(),
                'sfx_folder': self.ultra_sfx_folder_path
            }

            self.lbl_ultra_status.configure(text="ĐANG XỬ LÝ...", text_color="#f59e0b")
            self.update()

            def _process():
                try:
                    temp_output = self.ultra_input_file_path + ".tmp"
                    capcut_ultra_tool.process_capcut_ultra(self.ultra_input_file_path, temp_output, opts)
                    
                    self.lbl_ultra_status.configure(text="XỬ LÝ HOÀN TẤT!", text_color="#10b981")
                    self.update()
                    
                    save_path = filedialog.asksaveasfilename(
                        title="Lưu file xuất ra ở đâu?",
                        defaultextension=".json",
                        filetypes=[("JSON files", "*.json"), ("All files", "*.*")],
                        initialfile="draft_content.json"
                    )
                    
                    if save_path:
                        if os.path.exists(save_path):
                            backup_path = save_path + ".backup"
                            try:
                                import shutil
                                shutil.copy2(save_path, backup_path)
                            except Exception as e:
                                print(f"Lỗi tạo backup: {e}")
                            try:
                                os.remove(save_path)
                            except: pass
                        os.rename(temp_output, save_path)
                        messagebox.showinfo("Thành công", f"Đã lưu thành công tại:\n{save_path}\n(File gốc đã được backup tại {save_path}.backup)")
                    else:
                        try:
                            os.remove(temp_output)
                        except: pass
                        self.lbl_ultra_status.configure(text="ĐÃ HỦY LƯU FILE", text_color="#f59e0b")
                except Exception as e:
                    self.lbl_ultra_status.configure(text="CÓ LỖI XẢY RA", text_color="#ef4444")
                    messagebox.showerror("Lỗi", f"Quá trình xử lý Ultra thất bại:\n{str(e)}")

            threading.Thread(target=_process, daemon=True).start()

        self.btn_ultra_run = ctk.CTkButton(
            left_frame, 
            text="🚀 KÍCH HOẠT XỬ LÝ (RUN TOOL)", 
            font=ctk.CTkFont(size=16, weight="bold"),
            fg_color="#ef4444", 
            hover_color="#dc2626",
            height=60,
            command=run_ultra
        )
        self.btn_ultra_run.pack(fill="x", side="bottom", pady=20)

        # Phải
        right_frame = ctk.CTkScrollableFrame(self.tab_ultra, label_text="BỘ CÔNG CỤ TỰ ĐỘNG", label_font=ctk.CTkFont(weight="bold"))
        right_frame.grid(row=0, column=1, padx=20, pady=20, sticky="nsew")

        display_texts = {
            'opt_sync_image_to_audio': "1. Sync Image to Audio (Khớp ảnh theo voice)",
            'opt_ultra_music_mix': "2. Ultra Music Mix (Trộn nhạc nền ngẫu nhiên)",
            'opt_custom_audio_order': "3. Custom Audio Order (Xếp nhạc theo từ khóa)",
            'opt_randomize_video': "4. Randomize Video (Đảo trật tự phân cảnh)",
            'opt_dynamic_motion': "5. Dynamic Motion (Tự động Zoom & Pan ngẫu nhiên)",
            'opt_auto_transition': "6. Auto Transition (Tự động chèn chuyển cảnh ngẫu nhiên)",
            'opt_clear_transitions': "7. Clear Transitions (Xóa toàn bộ hiệu ứng chuyển cảnh)",
            'opt_auto_fill_canvas': "8. Auto Fill Canvas (Phóng to video lấp viền đen)",
            'opt_normalize_volume': "9. Normalize Volume (Chuẩn hóa âm lượng về 0dB)",
            'opt_reverse_timeline': "10. Reverse Timeline (Đảo ngược Timeline cuối lên đầu)",
            'opt_auto_subtitles': "11. Auto Subtitles (Tự động tạo phụ đề từ tên file)",
            'opt_ai_sfx_generator': "12. ⚡ AI Sound Effect Generator (Gọi Google Gemini)"
        }

        self.opt_sync_image_to_audio = ctk.BooleanVar(value=True)
        self.opt_ultra_music_mix = ctk.BooleanVar(value=False)
        self.opt_custom_audio_order = ctk.BooleanVar(value=False)
        self.opt_randomize_video = ctk.BooleanVar(value=False)
        self.opt_dynamic_motion = ctk.BooleanVar(value=True)
        self.opt_auto_transition = ctk.BooleanVar(value=True)
        self.opt_clear_transitions = ctk.BooleanVar(value=False)
        self.opt_auto_fill_canvas = ctk.BooleanVar(value=True)
        self.opt_normalize_volume = ctk.BooleanVar(value=True)
        self.opt_reverse_timeline = ctk.BooleanVar(value=False)
        self.opt_auto_subtitles = ctk.BooleanVar(value=False)
        self.opt_ai_sfx_generator = ctk.BooleanVar(value=False)

        # Thanh chức năng Chọn hết / Bỏ hết
        action_row = ctk.CTkFrame(right_frame, fg_color="transparent")
        action_row.pack(fill="x", pady=(5, 10))
        
        def select_all_ultra():
            for key in display_texts.keys():
                getattr(self, key).set(True)
            self.save_config()
            
        def deselect_all_ultra():
            for key in display_texts.keys():
                getattr(self, key).set(False)
            self.save_config()
            
        ctk.CTkButton(action_row, text="☑ Chọn hết", width=100, height=28, fg_color="#3b82f6", hover_color="#2563eb", command=select_all_ultra).pack(side="left", padx=5)
        ctk.CTkButton(action_row, text="☒ Bỏ hết", width=100, height=28, fg_color="#6b7280", hover_color="#4b5563", command=deselect_all_ultra).pack(side="left", padx=5)

        for key, text in display_texts.items():
            switch = ctk.CTkSwitch(right_frame, text=text, variable=getattr(self, key), font=ctk.CTkFont(weight="bold"))
            switch.pack(anchor="w", pady=10, padx=10)
            
            if key == 'opt_custom_audio_order':
                self.entry_ultra_audio_order = ctk.CTkEntry(right_frame, placeholder_text="Nhập từ khóa, phân cách bằng dấu phẩy. VD: intro, voice, outro")
                self.entry_ultra_audio_order.pack(fill="x", padx=40, pady=(0, 10))

if __name__ == "__main__":
    app = CapCutBatchTool()
    app.mainloop()