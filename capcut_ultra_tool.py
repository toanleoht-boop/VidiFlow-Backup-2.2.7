import os
import json
import random
import uuid
import copy
import argparse
import sqlite3
import glob
from urllib.request import Request, urlopen

def post_json(url, payload):
    request = Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urlopen(request, timeout=60) as response:
        return response.getcode(), json.loads(response.read().decode("utf-8"))

def generate_uuid():
    return str(uuid.uuid4()).upper()

def clean_name(name):
    return name.replace(".wav", "").replace(".mp3", "").strip()

def scan_capcut_db():
    base_path = os.path.expandvars(r"%LOCALAPPDATA%\CapCut\User Data\Cache\ressdk_db")
    transitions = []
    if not os.path.exists(base_path):
        return transitions
        
    db_files = glob.glob(os.path.join(base_path, "*", "rp.db"))
    for db_file in db_files:
        try:
            conn = sqlite3.connect(db_file)
            c = conn.cursor()
            c.execute("SELECT effect_id, title FROM effect WHERE category_name LIKE '%Transition%' OR panel_name LIKE '%Transition%' OR title LIKE '%Fade%' OR title LIKE '%Dissolve%'")
            for row in c.fetchall():
                if row[0]:
                    transitions.append({"effect_id": row[0], "name": row[1]})
            conn.close()
        except Exception:
            pass
    return transitions

def make_common_keyframe(property_type, val_start, val_end, duration):
    return {
        "id": generate_uuid(),
        "material_id": "",
        "property_type": property_type,
        "keyframe_list": [
            {
                "id": generate_uuid(),
                "curveType": "Line",
                "time_offset": 0,
                "left_control": {"x": 0.0, "y": 0.0},
                "right_control": {"x": 0.0, "y": 0.0},
                "values": [val_start],
                "string_value": "",
                "graphID": ""
            },
            {
                "id": generate_uuid(),
                "curveType": "Line",
                "time_offset": duration,
                "left_control": {"x": 0.0, "y": 0.0},
                "right_control": {"x": 0.0, "y": 0.0},
                "values": [val_end],
                "string_value": "",
                "graphID": ""
            }
        ]
    }

def process_capcut_ultra(input_path, output_path, options):
    with open(input_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    if 'materials' not in data:
        data['materials'] = {}
    
    materials = data['materials']
    if 'videos' not in materials: materials['videos'] = []
    if 'audios' not in materials: materials['audios'] = []
    if 'transitions' not in materials: materials['transitions'] = []
    if 'texts' not in materials: materials['texts'] = []

    tracks = data.get('tracks', [])
    video_tracks = [t for t in tracks if t.get('type') == 'video']
    audio_tracks = [t for t in tracks if t.get('type') == 'audio']
    text_tracks = [t for t in tracks if t.get('type') == 'text']

    # 1. CLEAR TRANSITIONS
    if options.get('clear_transitions'):
        materials['transitions'] = []
        for track in video_tracks:
            for seg in track.get('segments', []):
                if 'transition' in seg:
                    del seg['transition']

    # 2. AUTO FILL CANVAS
    if options.get('auto_fill_canvas'):
        for vid in materials['videos']:
            if vid.get('type') in ['photo', 'video']:
                vid['crop'] = {"scale": 1.56, "x": 0.0, "y": 0.0}

    # 3. DYNAMIC MOTION (Mathematically Exact Edge-Aligned Presets with optional Gemini AI Guidance)
    ai_motion_map = {}
    if options.get('dynamic_motion') and options.get('api_key') and text_tracks:
        # Try to gather subtitles and map them to video segments to query Gemini
        try:
            sub_track = text_tracks[0]
            sub_segs = sub_track.get('segments', [])
            txt_dict = {m['id']: m for m in materials['texts']}
            
            # Extract clean text and time range for subtitles
            sub_list = []
            for s in sub_segs:
                m_id = s.get('material_id')
                if m_id in txt_dict:
                    try:
                        content = json.loads(txt_dict[m_id].get('content', '{}'))
                        text_val = content.get('text', '')
                        start = s.get('target_timerange', {}).get('start', 0)
                        duration = s.get('target_timerange', {}).get('duration', 0)
                        sub_list.append({"text": text_val, "start": start, "end": start + duration})
                    except Exception:
                        pass
            
            # Map video segments to subtitles
            video_seg_prompts = []
            for idx, track in enumerate(video_tracks):
                for s_idx, seg in enumerate(track.get('segments', [])):
                    seg_dur = seg.get('target_timerange', {}).get('duration', 0)
                    if seg_dur < 1000000:
                        continue # Skip short clips under 1 second from AI logic
                    
                    seg_start = seg.get('target_timerange', {}).get('start', 0)
                    seg_end = seg_start + seg_dur
                    
                    # Find overlapping subtitles
                    overlapping_txts = []
                    for sub in sub_list:
                        if max(seg_start, sub['start']) < min(seg_end, sub['end']):
                            overlapping_txts.append(sub['text'])
                    
                    combined_txt = " | ".join(overlapping_txts) if overlapping_txts else "No text"
                    video_seg_prompts.append({
                        "index": f"{idx}_{s_idx}",
                        "text": combined_txt,
                        "duration_sec": round(seg_dur / 1000000.0, 1)
                    })
            
            # Query Gemini API in chunks if too many segments
            if video_seg_prompts:
                prompt = f"""
Analyze the narration text for each video clip segment and recommend the best camera motion style to match the mood of the scene.
Available Motion Styles:
- "zoom_in_center": Best for focusing on a central subject, introduction of a character, or dramatic realization.
- "zoom_out_center": Best for revealing a grand landscape, showing scale, isolation, or concluding a scene.
- "zoom_in_corner": Best for focusing on detail in a corner or adding complex movement.
- "zoom_out_corner": Best for starting on a detail in a corner and pulling back to reveal the full picture.
- "pan_l_to_r" / "pan_r_to_l": Best for showing scenery, progress, passage of time, or moving characters.
- "pan_t_to_b" / "pan_b_to_t": Best for high towers, vertical structures, descending/ascending mood.
- "diagonal_tl_to_br" / "diagonal_bl_to_tr": Best for epic battlefields, dynamic historical action, or grand cinematic movement.

Input segments (Index, Subtitle Text, Duration):
{json.dumps(video_seg_prompts[:60], ensure_ascii=False)}

Return ONLY a JSON object where keys are the segment index strings and values are the chosen Motion Style string. No other text.
"""
                url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={options['api_key']}"
                payload = {
                    "contents": [{"parts": [{"text": prompt}]}],
                    "generationConfig": {"temperature": 0.2, "responseMimeType": "application/json"}
                }
                status_code, response_data = post_json(url, payload)
                if status_code == 200:
                    ai_text = response_data['candidates'][0]['content']['parts'][0]['text']
                    ai_motion_map = json.loads(ai_text.strip())
        except Exception as e:
            print("Lỗi khi gợi ý Motion từ Gemini:", e)

    if options.get('dynamic_motion'):
        for track_idx, track in enumerate(video_tracks):
            for s_idx, seg in enumerate(track.get('segments', [])):
                duration = seg.get('target_timerange', {}).get('duration', 3000000)
                dur_sec = duration / 1000000.0
                
                # Rule 1: No motion if clip is under 1 second
                # Rule 2: 40% chance of staying static to avoid visual fatigue (not too dense)
                if dur_sec < 1.0 or random.random() < 0.40:
                    if 'common_keyframes' in seg:
                        del seg['common_keyframes']
                    continue
                
                # Try to get AI recommended style, fallback to random duration-based preset
                seg_key = f"{track_idx}_{s_idx}"
                if seg_key in ai_motion_map:
                    style = ai_motion_map[seg_key]
                else:
                    if dur_sec < 2.5:
                        style = random.choice(["zoom_in_center", "zoom_out_center", "pan_l_to_r", "pan_r_to_l"])
                    elif dur_sec >= 4.5:
                        style = random.choice([
                            "zoom_in_corner", "zoom_out_corner", 
                            "diagonal_tl_to_br", "diagonal_bl_to_tr", 
                            "pan_l_to_r", "pan_r_to_l"
                        ])
                    else:
                        style = random.choice([
                            "zoom_in_center", "zoom_out_center", 
                            "zoom_in_corner", "zoom_out_corner",
                            "pan_l_to_r", "pan_r_to_l", 
                            "pan_t_to_b", "pan_b_to_t"
                        ])

                # Default values (Limiting max zoom scale to 1.12 to prevent blur/cropping)
                scale_start, scale_end = 1.0, 1.0
                pan_x_start, pan_x_end = 0.0, 0.0
                pan_y_start, pan_y_end = 0.0, 0.0
                
                max_scale_val = round(random.uniform(1.08, 1.12), 4)
                
                if style == "zoom_in_center":
                    scale_start = 1.0
                    scale_end = max_scale_val
                elif style == "zoom_out_center":
                    scale_start = max_scale_val
                    scale_end = 1.0
                elif style == "zoom_in_corner":
                    scale_start = 1.0
                    scale_end = max_scale_val
                    # Align to a random corner at the end
                    sign_x = random.choice([-1.0, 1.0])
                    sign_y = random.choice([-1.0, 1.0])
                    pan_x_end = round(sign_x * (scale_end - 1.0), 6)
                    pan_y_end = round(sign_y * (scale_end - 1.0), 6)
                elif style == "zoom_out_corner":
                    scale_start = max_scale_val
                    scale_end = 1.0
                    # Start aligned to a random corner, return to center
                    sign_x = random.choice([-1.0, 1.0])
                    sign_y = random.choice([-1.0, 1.0])
                    pan_x_start = round(sign_x * (scale_start - 1.0), 6)
                    pan_y_start = round(sign_y * (scale_start - 1.0), 6)
                elif style == "pan_l_to_r":
                    scale_start = scale_end = max_scale_val
                    limit = scale_start - 1.0
                    pan_x_start = round(-limit, 6)
                    pan_x_end = round(limit, 6)
                elif style == "pan_r_to_l":
                    scale_start = scale_end = max_scale_val
                    limit = scale_start - 1.0
                    pan_x_start = round(limit, 6)
                    pan_x_end = round(-limit, 6)
                elif style == "pan_t_to_b":
                    scale_start = scale_end = max_scale_val
                    limit = scale_start - 1.0
                    pan_y_start = round(limit, 6)
                    pan_y_end = round(-limit, 6)
                elif style == "pan_b_to_t":
                    scale_start = scale_end = max_scale_val
                    limit = scale_start - 1.0
                    pan_y_start = round(-limit, 6)
                    pan_y_end = round(limit, 6)
                elif style == "diagonal_tl_to_br":
                    scale_start = scale_end = max_scale_val
                    limit = scale_start - 1.0
                    pan_x_start, pan_y_start = round(-limit, 6), round(limit, 6)
                    pan_x_end, pan_y_end = round(limit, 6), round(-limit, 6)
                elif style == "diagonal_bl_to_tr":
                    scale_start = scale_end = max_scale_val
                    limit = scale_start - 1.0
                    pan_x_start, pan_y_start = round(-limit, 6), round(-limit, 6)
                    pan_x_end, pan_y_end = round(limit, 6), round(limit, 6)

                # Inject real common_keyframes array exactly like CapCut
                seg['common_keyframes'] = [
                    make_common_keyframe("KFTypeScaleX", scale_start, scale_end, duration),
                    make_common_keyframe("KFTypePositionY", pan_y_start, pan_y_end, duration),
                    make_common_keyframe("KFTypePositionX", pan_x_start, pan_x_end, duration)
                ]
                
                if 'clip' not in seg:
                    seg['clip'] = {}
                if 'scale' not in seg['clip']:
                    seg['clip']['scale'] = {"x": 1.0, "y": 1.0}
                seg['clip']['scale']['x'] = scale_end
                seg['clip']['scale']['y'] = scale_end
                
                if 'transform' not in seg['clip']:
                    seg['clip']['transform'] = {"x": 0.0, "y": 0.0}
                seg['clip']['transform']['x'] = pan_x_end
                seg['clip']['transform']['y'] = pan_y_end
                
                seg['clip']['rotation'] = 0.0
                seg['clip']['flip'] = {"vertical": False, "horizontal": False}
                seg['clip']['alpha'] = 1.0
                seg['uniform_scale'] = {"on": True, "value": 1.0}

    # 4. ULTRA MUSIC MIX
    if options.get('ultra_music_mix') and audio_tracks:
        main_audio = audio_tracks[0]
        segments = main_audio.get('segments', [])
        random.shuffle(segments)
        curr_time = 0
        for seg in segments:
            dur = seg.get('target_timerange', {}).get('duration', 3000000)
            seg['target_timerange']['start'] = curr_time
            curr_time += dur

    # 5. CUSTOM AUDIO ORDER
    if options.get('custom_audio_order') and options.get('audio_order_list') and audio_tracks:
        main_audio = audio_tracks[0]
        segments = main_audio.get('segments', [])
        order_list = [x.strip().lower() for x in options['audio_order_list'].split(',') if x.strip()]
        
        aud_dict = {m['id']: m for m in materials['audios']}
        def get_seg_name(s):
            m = aud_dict.get(s.get('material_id'))
            return clean_name(m.get('name', '')) if m else ''

        ordered_segs = []
        remaining = list(segments)
        for target_name in order_list:
            for seg in list(remaining):
                if target_name in get_seg_name(seg).lower():
                    ordered_segs.append(seg)
                    remaining.remove(seg)
                    break
        ordered_segs.extend(remaining)
        main_audio['segments'] = ordered_segs
        
        curr_time = 0
        for seg in ordered_segs:
            dur = seg.get('target_timerange', {}).get('duration', 3000000)
            seg['target_timerange']['start'] = curr_time
            curr_time += dur

    # 6. RANDOMIZE VIDEO
    if options.get('randomize_video') and video_tracks:
        main_vid = video_tracks[0]
        segments = main_vid.get('segments', [])
        random.shuffle(segments)
        curr_time = 0
        for seg in segments:
            dur = seg.get('target_timerange', {}).get('duration', 3000000)
            seg['target_timerange']['start'] = curr_time
            curr_time += dur

    # 7. REVERSE TIMELINE
    if options.get('reverse_timeline') and video_tracks:
        main_vid = video_tracks[0]
        segments = main_vid.get('segments', [])
        segments.reverse()
        curr_time = 0
        for seg in segments:
            dur = seg.get('target_timerange', {}).get('duration', 3000000)
            seg['target_timerange']['start'] = curr_time
            curr_time += dur

    # 8. SYNC IMAGE TO AUDIO
    if options.get('sync_image_to_audio') and video_tracks and audio_tracks:
        main_vid = video_tracks[0]
        main_aud = audio_tracks[0]
        vid_segs = main_vid.get('segments', [])
        aud_segs = main_aud.get('segments', [])

        vid_dict = {m['id']: m for m in materials['videos']}
        limit = min(len(vid_segs), len(aud_segs))
        curr_time = 0
        for i in range(limit):
            v_seg = vid_segs[i]
            a_seg = aud_segs[i]
            
            duration = a_seg.get('target_timerange', {}).get('duration', 3000000)
            v_seg['target_timerange']['start'] = curr_time
            v_seg['target_timerange']['duration'] = duration
            
            m_id = v_seg.get('material_id')
            if m_id in vid_dict and vid_dict[m_id].get('type') == 'photo':
                vid_dict[m_id]['duration'] = duration
                if 'source_timerange' in v_seg:
                    v_seg['source_timerange']['duration'] = duration
                    v_seg['source_timerange']['start'] = 0
            curr_time += duration
        
        main_vid['segments'] = vid_segs[:limit]
        data['duration'] = curr_time

    # 9. AUTO TRANSITION (Using DB Scanner & fixed extra_material_refs linkage)
    if options.get('auto_transition') and video_tracks:
        valid_transitions = scan_capcut_db()
        main_vid = video_tracks[0]
        segments = main_vid.get('segments', [])
        
        for i in range(len(segments) - 1):
            seg = segments[i]
            if 'transition' not in seg:
                trans_id = generate_uuid()
                
                if valid_transitions:
                    choice = random.choice(valid_transitions)
                    name = choice['name']
                    effect_id = choice['effect_id']
                else:
                    name = "Dissolve"
                    effect_id = "10001"
                
                materials['transitions'].append({
                    "id": trans_id,
                    "name": name,
                    "type": "transition",
                    "effect_id": effect_id,
                    "resource_id": effect_id,
                    "duration": 500000
                })
                seg['transition'] = {
                    "duration": 500000,
                    "id": trans_id
                }
                # CRITICAL: Transition ID must be added to extra_material_refs for CapCut to display it
                if 'extra_material_refs' not in seg:
                    seg['extra_material_refs'] = []
                seg['extra_material_refs'].append(trans_id)

    # 10. NORMALIZE VOLUME
    if options.get('normalize_volume'):
        for track in audio_tracks:
            for seg in track.get('segments', []):
                seg['volume'] = 0.0
        for track in video_tracks:
            for seg in track.get('segments', []):
                seg['volume'] = 0.0

    # 11. AUTO SUBTITLES
    if options.get('auto_subtitles') and audio_tracks:
        aud_dict = {m['id']: m for m in materials['audios']}
        main_audio = audio_tracks[0]
        segments = main_audio.get('segments', [])
        
        sub_track = None
        for track in text_tracks:
            if track.get('name') == 'Subtitles':
                sub_track = track
                break
        
        if not sub_track:
            sub_track = {
                "id": generate_uuid(),
                "name": "Subtitles",
                "type": "text",
                "segments": []
            }
            tracks.append(sub_track)

        sub_track['segments'] = []
        for seg in segments:
            m = aud_dict.get(seg.get('material_id'))
            if m:
                clean_text = clean_name(m.get('name', ''))
                text_id = generate_uuid()
                content_dict = {
                    "text": clean_text,
                    "styles": [{"range": [0, len(clean_text)], "font_size": 8.0}]
                }
                materials['texts'].append({
                    "id": text_id,
                    "name": clean_text,
                    "type": "text",
                    "content": json.dumps(content_dict, ensure_ascii=False)
                })
                
                sub_track['segments'].append({
                    "id": generate_uuid(),
                    "material_id": text_id,
                    "target_timerange": copy.deepcopy(seg['target_timerange']),
                    "source_timerange": {"start": 0, "duration": seg['target_timerange']['duration']}
                })

    # 12. AI SOUND EFFECTS GENERATOR
    if options.get('ai_sfx_generator') and options.get('api_key') and options.get('sfx_folder') and video_tracks:
        sfx_folder = options['sfx_folder']
        sfx_files = [f for f in os.listdir(sfx_folder) if f.lower().endswith(('.mp3', '.wav'))]
        
        if sfx_files:
            # Gather transition points from video segments (start times)
            transition_times = []
            curr_time = 0
            main_vid = video_tracks[0]
            for seg in main_vid.get('segments', []):
                dur = seg.get('target_timerange', {}).get('duration', 3000000)
                transition_times.append(curr_time)
                curr_time += dur
                
            prompt = f"""
I am editing a video. Here are the microsecond timestamps where a scene transition occurs: {transition_times[1:]}.
Here are the available sound effects in my folder: {sfx_files}.
Pick a suitable sound effect for EACH transition timestamp (e.g. whoosh, swoosh for transitions, or pop for sudden changes).
Return ONLY a valid JSON array of objects, with each object containing 'time_offset' (the exact microsecond timestamp) and 'sfx_file' (the exact filename). Do not include any other text.
"""
            try:
                # Call Google Gemini API
                url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={options['api_key']}"
                payload = {
                    "contents": [{"parts": [{"text": prompt}]}],
                    "generationConfig": {"temperature": 0.2}
                }
                _, res_data = post_json(url, payload)
                ai_text = res_data['candidates'][0]['content']['parts'][0]['text']
                ai_text = ai_text.replace('```json', '').replace('```', '').strip()
                sfx_mapping = json.loads(ai_text)
                
                # Create SFX Track with all standard CapCut properties
                sfx_track = {
                    "id": generate_uuid(),
                    "name": "AI SFX Track",
                    "type": "audio",
                    "segments": [],
                    "flag": 0,
                    "attribute": 0,
                    "is_default_name": True
                }
                tracks.append(sfx_track)
                
                # Add SFX to materials and segments
                for mapping in sfx_mapping:
                    t_offset = mapping.get('time_offset', 0)
                    filename = mapping.get('sfx_file')
                    if filename in sfx_files:
                        sfx_id = generate_uuid()
                        file_path = os.path.join(sfx_folder, filename)
                        
                        materials['audios'].append({
                            "id": sfx_id,
                            "type": "extract_music",
                            "name": filename,
                            "path": file_path,
                            "duration": 2000000,
                            "unique_id": "",
                            "category_name": "local",
                            "wave_points": [],
                            "check_flag": 1
                        })
                        
                        sfx_track['segments'].append({
                            "id": generate_uuid(),
                            "material_id": sfx_id,
                            "target_timerange": {
                                "start": max(0, t_offset - 200000), # slightly before transition
                                "duration": 1000000
                            },
                            "source_timerange": {
                                "start": 0,
                                "duration": 1000000
                            },
                            "render_timerange": {"start": 0, "duration": 0},
                            "volume": 1.0,
                            "speed": 1.0,
                            "clip": None,
                            "uniform_scale": None,
                            "enable_lut": False,
                            "enable_adjust": False,
                            "visible": True,
                            "track_attribute": 0,
                            "extra_material_refs": []
                        })
            except Exception as e:
                print("Lỗi khi gọi API Gemini:", e)

    for track in tracks:
        if 'segments' in track:
            track['segments'].sort(key=lambda s: s.get('target_timerange', {}).get('start', 0))

    max_duration = 0
    for track in tracks:
        for seg in track.get('segments', []):
            end_time = seg.get('target_timerange', {}).get('start', 0) + seg.get('target_timerange', {}).get('duration', 0)
            if end_time > max_duration:
                max_duration = end_time
    data['duration'] = max_duration

    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, separators=(',', ':'))

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument('--input', required=True)
    parser.add_argument('--output', required=True)
    parser.add_argument('--sync_image_to_audio', action='store_true')
    parser.add_argument('--ultra_music_mix', action='store_true')
    parser.add_argument('--custom_audio_order', action='store_true')
    parser.add_argument('--audio_order_list', type=str, default='')
    parser.add_argument('--randomize_video', action='store_true')
    parser.add_argument('--dynamic_motion', action='store_true')
    parser.add_argument('--auto_transition', action='store_true')
    parser.add_argument('--clear_transitions', action='store_true')
    parser.add_argument('--auto_fill_canvas', action='store_true')
    parser.add_argument('--normalize_volume', action='store_true')
    parser.add_argument('--reverse_timeline', action='store_true')
    parser.add_argument('--auto_subtitles', action='store_true')
    parser.add_argument('--ai_sfx_generator', action='store_true')
    parser.add_argument('--api_key', type=str, default='')
    parser.add_argument('--sfx_folder', type=str, default='')

    args = parser.parse_args()
    options = vars(args)
    
    process_capcut_ultra(args.input, args.output, options)
