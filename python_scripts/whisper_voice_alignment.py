import argparse
import difflib
import json
import re
import string
import sys


def normalize_text(value: str) -> str:
    value = value.lower().translate(str.maketrans('', '', string.punctuation))
    return re.sub(r'\s+', ' ', value).strip()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--audio', required=True)
    parser.add_argument('--scenes', required=True)
    parser.add_argument('--output', required=True)
    parser.add_argument('--model', default='base')
    parser.add_argument('--duration-ms', type=float, default=0)
    args = parser.parse_args()

    try:
        import whisper
        with open(args.scenes, 'r', encoding='utf-8') as handle:
            scenes = json.load(handle)
        if not scenes:
            raise ValueError('Kịch bản không có phân cảnh để khớp voice.')

        print('WHISPER_STATUS:loading', flush=True)
        model = whisper.load_model(args.model)
        print('WHISPER_STATUS:transcribing', flush=True)
        result = model.transcribe(args.audio, word_timestamps=True, fp16=False, verbose=False)

        words = []
        for segment in result.get('segments', []):
            for word in segment.get('words', []):
                normalized = normalize_text(word.get('word', ''))
                if normalized:
                    words.append({
                        'word': normalized,
                        'start': float(word['start']),
                        'end': float(word['end']),
                    })
        if not words:
            raise ValueError('Whisper không nhận diện được từ nào trong file voice.')

        script_words, word_to_scene = [], []
        for scene_index, scene in enumerate(scenes):
            scene_words = normalize_text(scene.get('text', '')).split()
            script_words.extend(scene_words)
            word_to_scene.extend([scene_index] * len(scene_words))

        if not script_words:
            raise ValueError('Kịch bản không có lời thoại để khớp với Whisper.')

        transcript_words = [item['word'] for item in words]
        matcher = difflib.SequenceMatcher(None, script_words, transcript_words, autojunk=False)
        core_times = [{'start': None, 'end': None} for _ in scenes]
        for match in matcher.get_matching_blocks():
            for offset in range(match.size):
                scene_index = word_to_scene[match.a + offset]
                matched_word = words[match.b + offset]
                if core_times[scene_index]['start'] is None:
                    core_times[scene_index]['start'] = matched_word['start']
                core_times[scene_index]['end'] = matched_word['end']

        duration = args.duration_ms / 1000 if args.duration_ms > 0 else float(result.get('segments', [{}])[-1].get('end', words[-1]['end']))
        # Nội suy các cảnh Whisper không khớp hoàn toàn, giữ nguyên mốc từ của
        # những cảnh đã khớp để không làm sai nhịp giọng đọc.
        index = 0
        while index < len(scenes):
            if core_times[index]['start'] is not None:
                index += 1
                continue
            end_index = index
            while end_index < len(scenes) and core_times[end_index]['start'] is None:
                end_index += 1
            left = core_times[index - 1]['end'] if index > 0 else 0.0
            right = core_times[end_index]['start'] if end_index < len(scenes) else duration
            gap = max(0.0, right - left)
            missing = scenes[index:end_index]
            total_chars = sum(max(len(scene.get('text', '')), 1) for scene in missing)
            current = left
            for relative, scene in enumerate(missing):
                part = gap * max(len(scene.get('text', '')), 1) / total_chars
                core_times[index + relative] = {'start': current, 'end': current + part}
                current += part
            index = end_index

        cuts = []
        for index, scene in enumerate(scenes):
            start = core_times[index]['start']
            end = core_times[index]['end']
            if index == 0:
                cut_start = 0.0
            else:
                previous_end = core_times[index - 1]['end']
                gap = max(0.0, start - previous_end)
                previous_length = max(len(scenes[index - 1].get('text', '')), 1)
                current_length = max(len(scene.get('text', '')), 1)
                cut_start = previous_end + gap * previous_length / (previous_length + current_length)
            if index == len(scenes) - 1:
                cut_end = duration
            else:
                next_start = core_times[index + 1]['start']
                gap = max(0.0, next_start - end)
                current_length = max(len(scene.get('text', '')), 1)
                next_length = max(len(scenes[index + 1].get('text', '')), 1)
                cut_end = end + gap * current_length / (current_length + next_length)
            if cut_end <= cut_start:
                cut_end = cut_start + 0.1
            cuts.append({
                'index': index + 1,
                'start': cut_start,
                'end': cut_end,
                'matched': core_times[index]['start'] is not None,
            })

        with open(args.output, 'w', encoding='utf-8') as handle:
            json.dump({'success': True, 'cuts': cuts, 'transcript': result.get('text', '')}, handle, ensure_ascii=False)
        print('WHISPER_STATUS:complete', flush=True)
    except Exception as error:
        with open(args.output, 'w', encoding='utf-8') as handle:
            json.dump({'success': False, 'error': str(error)}, handle, ensure_ascii=False)
        print(f'WHISPER_ERROR:{error}', flush=True)
        sys.exit(1)


if __name__ == '__main__':
    main()
