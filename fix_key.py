import re

with open('src/components/pipeline/usePipelineWizard.ts', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('localStorage.getItem("chrome_profiles_config")', 'localStorage.getItem("capcut_ultra_chrome_profiles")')

with open('src/components/pipeline/usePipelineWizard.ts', 'w', encoding='utf-8') as f:
    f.write(content)
print("done")
