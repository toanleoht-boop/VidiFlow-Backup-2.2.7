import os
import json

def scan_capcut_effects():
    # Đường dẫn đến thư mục Cache chứa hiệu ứng đã tải của CapCut
    # Bạn cần thay 'Username' bằng tên máy tính của bạn
    cache_path = os.path.expanduser(r"~\AppData\Local\CapCut\User Data\Cache\effect")
    
    if not os.path.exists(cache_path):
        print("Không tìm thấy thư mục Cache hiệu ứng.")
        return {}

    effect_database = {}

    # Quét qua tất cả các thư mục con trong thư mục effect
    for root, dirs, files in os.walk(cache_path):
        for file in files:
            # CapCut thường lưu thông tin chi tiết hiệu ứng trong tệp config.json hoặc tương tự bên trong gói hiệu ứng
            if file.endswith("config.json") or file.endswith("info.json"):
                full_path = os.path.join(root, file)
                try:
                    with open(full_path, 'r', encoding='utf-8') as f:
                        data = json.load(f)
                        
                        # Cấu trúc JSON thay đổi tùy phiên bản, nhưng thường sẽ có trường ID và Name
                        # Ví dụ giả định cấu trúc:
                        effect_id = data.get("id") or data.get("effect_id")
                        effect_name = data.get("name") or data.get("title")
                        
                        if effect_id and effect_name:
                            effect_database[effect_name] = effect_id
                except Exception as e:
                    continue
                    
    return effect_database

# Chạy thử và lưu lại thành file DB cho Tool chính của bạn sử dụng
detected_effects = scan_capcut_effects()
with open("my_scanned_effects.json", "w", encoding="utf-8") as out:
    json.dump(detected_effects, out, ensure_ascii=False, indent=4)

print(f"Đã quét và lưu lại {len(detected_effects)} hiệu ứng từ ổ C!")