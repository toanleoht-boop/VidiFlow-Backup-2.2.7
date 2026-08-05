import argparse
import json
import os
import sys


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--videos', required=True)
    parser.add_argument('--output', required=True)
    parser.add_argument('--model', default='base')
    args = parser.parse_args()

    try:
        import whisper
        with open(args.videos, 'r', encoding='utf-8') as handle:
            videos = json.load(handle)
        if not isinstance(videos, list) or not videos:
            raise ValueError('Không có video để Whisper phân tích.')

        print('WHISPER_STATUS:loading', flush=True)
        model = whisper.load_model(args.model)
        results = []
        for index, video_path in enumerate(videos):
            print(f'WHISPER_STATUS:transcribing:{index + 1}/{len(videos)}', flush=True)
            if not os.path.exists(video_path):
                results.append({'index': index, 'speechStart': None, 'speechEnd': None, 'words': 0})
                continue
            transcript = model.transcribe(video_path, word_timestamps=True, fp16=False, verbose=False)
            words = [
                word for segment in transcript.get('segments', [])
                for word in segment.get('words', [])
                if str(word.get('word', '')).strip()
            ]
            if words:
                results.append({
                    'index': index,
                    'speechStart': float(words[0]['start']),
                    'speechEnd': float(words[-1]['end']),
                    'words': len(words),
                })
            else:
                results.append({'index': index, 'speechStart': None, 'speechEnd': None, 'words': 0})

        with open(args.output, 'w', encoding='utf-8') as handle:
            json.dump({'success': True, 'videos': results}, handle, ensure_ascii=False)
        print('WHISPER_STATUS:complete', flush=True)
    except Exception as error:
        with open(args.output, 'w', encoding='utf-8') as handle:
            json.dump({'success': False, 'error': str(error)}, handle, ensure_ascii=False)
        print(f'WHISPER_ERROR:{error}', flush=True)
        sys.exit(1)


if __name__ == '__main__':
    main()
