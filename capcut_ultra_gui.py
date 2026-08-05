import customtkinter as ctk
from tkinter import filedialog, messagebox
import capcut_ultra_tool
import os

ctk.set_appearance_mode("Dark")
ctk.set_default_color_theme("green")

class CapCutUltraApp(ctk.CTk):
    def __init__(self):
        super().__init__()

        self.title("CapCut Ultra Tool VIP")
        self.geometry("1000x750")
        self.resizable(False, False)

        # Main Layout: 2 Columns
        self.grid_columnconfigure(0, weight=1)
        self.grid_columnconfigure(1, weight=1)
        self.grid_rowconfigure(0, weight=1)

        # State Variables
        self.input_file_path = None
        self.output_file_path = None
        self.sfx_folder_path = None
        
        # --- LEFT PANEL ---
        self.left_frame = ctk.CTkFrame(self, fg_color="transparent")
        self.left_frame.grid(row=0, column=0, padx=20, pady=20, sticky="nsew")

        self.title_label = ctk.CTkLabel(self.left_frame, text="CAPCUT ULTRA TOOL", font=ctk.CTkFont(size=24, weight="bold"))
        self.title_label.pack(pady=(20, 10))
        
        self.subtitle_label = ctk.CTkLabel(self.left_frame, text="Hệ thống tự động hóa & AI Sound Effect", text_color="gray")
        self.subtitle_label.pack(pady=(0, 20))

        # Upload Button
        self.btn_upload = ctk.CTkButton(
            self.left_frame, 
            text="📁 1. CHỌN FILE DRAFT_CONTENT.JSON GỐC", 
            font=ctk.CTkFont(weight="bold"),
            height=40,
            command=self.select_file
        )
        self.btn_upload.pack(fill="x", pady=(10, 5))

        self.lbl_file_path = ctk.CTkLabel(self.left_frame, text="Chưa có file nào được chọn.", text_color="gray", wraplength=400)
        self.lbl_file_path.pack(pady=(0, 10))

        # Delete the redundant outdir button code
        self.lbl_api = ctk.CTkLabel(self.left_frame, text="Google Gemini API Key (Bắt buộc cho AI SFX):", font=ctk.CTkFont(weight="bold"))
        self.lbl_api.pack(anchor="w", pady=(10, 0))
        self.entry_api = ctk.CTkEntry(self.left_frame, placeholder_text="Nhập API Key vào đây...", show="*")
        self.entry_api.pack(fill="x", pady=5)
        
        # SFX Folder Selection
        self.btn_sfx = ctk.CTkButton(
            self.left_frame, 
            text="🎵 3. CHỌN THƯ MỤC SOUND EFFECTS (Tùy chọn)", 
            font=ctk.CTkFont(weight="bold"),
            height=40,
            fg_color="#8b5cf6",
            hover_color="#7c3aed",
            command=self.select_sfx
        )
        self.btn_sfx.pack(fill="x", pady=(20, 5))
        
        self.lbl_sfx_path = ctk.CTkLabel(self.left_frame, text="Chưa chọn thư mục SFX", text_color="gray", wraplength=400)
        self.lbl_sfx_path.pack(pady=(0, 15))

        # Status Label
        self.lbl_status = ctk.CTkLabel(self.left_frame, text="", font=ctk.CTkFont(weight="bold"))
        self.lbl_status.pack(pady=10)

        # Run Button
        self.btn_run = ctk.CTkButton(
            self.left_frame, 
            text="🚀 KÍCH HOẠT XỬ LÝ (RUN TOOL)", 
            font=ctk.CTkFont(size=16, weight="bold"),
            fg_color="#ef4444", 
            hover_color="#dc2626",
            height=60,
            command=self.run_process
        )
        self.btn_run.pack(fill="x", side="bottom", pady=20)


        # --- RIGHT PANEL ---
        self.right_frame = ctk.CTkScrollableFrame(self, label_text="BỘ CÔNG CỤ TỰ ĐỘNG", label_font=ctk.CTkFont(weight="bold"))
        self.right_frame.grid(row=0, column=1, padx=20, pady=20, sticky="nsew")

        # Switches / Checkboxes
        self.options = {
            'sync_image_to_audio': ctk.BooleanVar(value=True),
            'ultra_music_mix': ctk.BooleanVar(value=False),
            'custom_audio_order': ctk.BooleanVar(value=False),
            'randomize_video': ctk.BooleanVar(value=False),
            'dynamic_motion': ctk.BooleanVar(value=True),
            'auto_transition': ctk.BooleanVar(value=True),
            'clear_transitions': ctk.BooleanVar(value=False),
            'auto_fill_canvas': ctk.BooleanVar(value=True),
            'normalize_volume': ctk.BooleanVar(value=True),
            'reverse_timeline': ctk.BooleanVar(value=False),
            'auto_subtitles': ctk.BooleanVar(value=False),
            'ai_sfx_generator': ctk.BooleanVar(value=False)
        }

        # Mapping to display texts
        display_texts = {
            'sync_image_to_audio': "1. Sync Image to Audio (Khớp ảnh theo voice)",
            'ultra_music_mix': "2. Ultra Music Mix (Trộn nhạc nền ngẫu nhiên)",
            'custom_audio_order': "3. Custom Audio Order (Xếp nhạc theo từ khóa)",
            'randomize_video': "4. Randomize Video (Đảo trật tự phân cảnh)",
            'dynamic_motion': "5. Dynamic Motion (Tự động Zoom & Pan ngẫu nhiên)",
            'auto_transition': "6. Auto Transition (Tự động chèn chuyển cảnh ngẫu nhiên)",
            'clear_transitions': "7. Clear Transitions (Xóa toàn bộ hiệu ứng chuyển cảnh)",
            'auto_fill_canvas': "8. Auto Fill Canvas (Phóng to video lấp viền đen)",
            'normalize_volume': "9. Normalize Volume (Chuẩn hóa âm lượng về 0dB)",
            'reverse_timeline': "10. Reverse Timeline (Đảo ngược Timeline cuối lên đầu)",
            'auto_subtitles': "11. Auto Subtitles (Tự động tạo phụ đề từ tên file)",
            'ai_sfx_generator': "12. ⚡ AI Sound Effect Generator (Gọi Google Gemini)"
        }

        for key, text in display_texts.items():
            switch = ctk.CTkSwitch(self.right_frame, text=text, variable=self.options[key], font=ctk.CTkFont(weight="bold"))
            switch.pack(anchor="w", pady=10, padx=10)
            
            # Add entry box for custom audio order right below it
            if key == 'custom_audio_order':
                self.entry_audio_order = ctk.CTkEntry(self.right_frame, placeholder_text="Nhập từ khóa, phân cách bằng dấu phẩy. VD: intro, voice, outro")
                self.entry_audio_order.pack(fill="x", padx=40, pady=(0, 10))

    def select_file(self):
        file_path = filedialog.askopenfilename(
            title="Chọn file draft_content.json",
            filetypes=[("JSON files", "*.json"), ("All files", "*.*")]
        )
        if file_path:
            self.input_file_path = file_path
            self.lbl_file_path.configure(text=f"Đã chọn: {os.path.basename(file_path)}")
            self.lbl_status.configure(text="SẴN SÀNG XỬ LÝ", text_color="#10b981")
            
    def select_sfx(self):
        dir_path = filedialog.askdirectory(title="Chọn thư mục chứa Sound Effects")
        if dir_path:
            self.sfx_folder_path = dir_path
            self.lbl_sfx_path.configure(text=f"Thư mục SFX: {dir_path}")

    def run_process(self):
        if not self.input_file_path:
            messagebox.showerror("Lỗi", "Vui lòng chọn file draft_content.json trước!")
            return

        if self.options['ai_sfx_generator'].get():
            if not self.entry_api.get():
                messagebox.showerror("Lỗi", "Vui lòng nhập Google Gemini API Key để chèn SFX bằng AI!")
                return
            if not self.sfx_folder_path:
                messagebox.showerror("Lỗi", "Vui lòng chọn thư mục chứa Sound Effects trước khi dùng AI!")
                return
        
        # Build options dict
        opts = {k: v.get() for k, v in self.options.items()}
        opts['audio_order_list'] = self.entry_audio_order.get()
        opts['api_key'] = self.entry_api.get()
        opts['sfx_folder'] = self.sfx_folder_path

        self.lbl_status.configure(text="ĐANG XỬ LÝ...", text_color="#f59e0b")
        self.update()

        try:
            # Process in a temporary file first
            temp_output = self.input_file_path + ".tmp"
            capcut_ultra_tool.process_capcut_ultra(self.input_file_path, temp_output, opts)
            
            self.lbl_status.configure(text="XỬ LÝ HOÀN TẤT!", text_color="#10b981")
            self.update()
            
            # Now ask user where to save
            save_path = filedialog.asksaveasfilename(
                title="Lưu file xuất ra ở đâu?",
                defaultextension=".json",
                filetypes=[("JSON files", "*.json"), ("All files", "*.*")],
                initialfile="draft_content.json"
            )
            
            if save_path:
                if os.path.exists(save_path):
                    os.remove(save_path)
                os.rename(temp_output, save_path)
                messagebox.showinfo("Thành công", f"Đã lưu thành công tại:\n{save_path}")
            else:
                # User cancelled save
                os.remove(temp_output)
                self.lbl_status.configure(text="ĐÃ HỦY LƯU FILE", text_color="#f59e0b")
                
        except Exception as e:
            self.lbl_status.configure(text="CÓ LỖI XẢY RA", text_color="#ef4444")
            messagebox.showerror("Lỗi", f"Quá trình xử lý thất bại:\n{str(e)}")

if __name__ == "__main__":
    app = CapCutUltraApp()
    app.mainloop()
