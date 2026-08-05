import sys
import os
import json
import argparse
import inspect

sys.stdout.reconfigure(encoding='utf-8')

def run_cli():
    parser = argparse.ArgumentParser()
    parser.add_argument('--action', required=True, choices=['slice', 'sync', 'automix'])
    parser.add_argument('--script', type=str, default='')
    parser.add_argument('--audio', type=str, default='')
    parser.add_argument('--outdir', type=str, default='')
    parser.add_argument('--json', type=str, default='')
    parser.add_argument('--imgdir', type=str, default='')
    parser.add_argument('--template', type=str, default='')
    parser.add_argument('--name', type=str, default='')
    parser.add_argument('--skip_slice', type=str, default='false')
    parser.add_argument('--mix_voices', type=str, default='')
    
    args = parser.parse_args()

    # Read capcut_batch_tool.py
    base_file = os.path.join(os.path.dirname(__file__), '..', 'capcut_batch_tool.py')
    if not os.path.exists(base_file):
        print(json.dumps({"success": False, "error": f"Không tìm thấy file capcut_batch_tool.py tại {base_file}"}))
        sys.exit(1)
        
    with open(base_file, 'r', encoding='utf-8') as f:
        code = f.read()
        
    # Hack to prevent GUI execution
    code = code.replace('if __name__ == "__main__":', 'if False:')
    code = code.replace('messagebox.showinfo', 'print')
    code = code.replace('messagebox.showerror', 'print')
    
    # Execute capcut_batch_tool.py
    namespace = {'__file__': base_file}
    try:
        exec(code, namespace)
    except Exception as e:
        print(json.dumps({"success": False, "error": f"Lỗi load capcut_batch_tool.py: {str(e)}"}))
        sys.exit(1)
        
    if 'CapCutBatchTool' not in namespace:
        print(json.dumps({"success": False, "error": "Không tìm thấy class CapCutBatchTool trong capcut_batch_tool.py"}))
        sys.exit(1)
        
    CapCutBatchTool = namespace['CapCutBatchTool']

    # Create headless mixer instance
    class HeadlessMixer:
        pass
        
    mixer = HeadlessMixer()
    
    # Mock log function to output JSON for Node.js
    def mock_log(msg, clear=False):
        # We prefix logs so Node can stream them
        print(f"[[LOG]]: {msg}")
        sys.stdout.flush()
        
    mixer.log = mock_log
    
    # Mock UI entries accessed by internal methods
    class MockEntry:
        def __init__(self, val):
            self.val = val
        def get(self):
            return self.val
            
    mixer.entry_img_dir = MockEntry(args.imgdir)
    mixer.entry_template_proj = MockEntry(args.template)
    mixer.entry_new_proj_name = MockEntry(args.name)
    mixer.entry_slice_script = MockEntry(args.script)
    mixer.entry_slice_audio = MockEntry(args.audio)
    mixer.entry_slice_out = MockEntry(args.outdir)
    mixer.entry_mix_voices = MockEntry(args.mix_voices)
    mixer.entry_sync_json = MockEntry(args.json)

    # Mock missing checkboxes and buttons
    class MockCheckbox:
        def __init__(self, val):
            self.val = val
        def get(self):
            return self.val
            
    class MockButton:
        def configure(self, **kwargs):
            pass

    mixer.chk_tele_automix = MockCheckbox(0)
    mixer.chk_restart_automix = MockCheckbox(0)
    mixer.btn_run_automix = MockButton()
    mixer.btn_run_sync = MockButton()
    mixer.btn_run_cut = MockButton()
    
    # Bind all methods from CapCutBatchTool to mixer EXCEPT __init__
    for name, method in inspect.getmembers(CapCutBatchTool, predicate=inspect.isfunction):
        if name != "__init__":
            try:
                setattr(mixer, name, method.__get__(mixer))
            except Exception:
                pass
                
    # Re-apply mock log function so it overwrites the bound original one
    def mock_log(msg, clear=False):
        print(f"[[LOG]]: {msg}")
        sys.stdout.flush()
    mixer.log = mock_log
                
    try:
        if args.action == 'slice':
            mixer._process_audio_slicing(args.script, args.audio, args.outdir)
            print(json.dumps({"success": True}))
        elif args.action == 'sync':
            mixer._process_sync_timeline(args.json)
            print(json.dumps({"success": True}))
        elif args.action == 'automix':
            skip_slice_bool = (args.skip_slice.lower() == 'true')
            mixer._process_automix_workflow(
                txt_path=args.script, 
                audio_path=args.audio, 
                out_voice_dir=args.outdir, 
                base_dir=args.imgdir, 
                new_name=args.name, 
                skip_slice=skip_slice_bool, 
                mix_voices=args.mix_voices
            )
            print(json.dumps({"success": True}))
    except Exception as e:
        import traceback
        print(json.dumps({"success": False, "error": str(e), "trace": traceback.format_exc()}))
        sys.exit(1)

if __name__ == "__main__":
    run_cli()
