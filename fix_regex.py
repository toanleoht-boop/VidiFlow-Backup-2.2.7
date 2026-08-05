import re

with open('src/server/services/imageGeneratorService.ts', 'r', encoding='utf-8') as f:
    content = f.read()

old_regex = """          // Luôn luôn loại bỏ hoàn toàn câu 'Depicting: "..."' khỏi prompt
          targetPrompt = targetPrompt.replace(/Depicting:\\s*"[^"]+"\\.\\s*/ig, '');
          targetPrompt = targetPrompt.replace(/Depicting:\\s*"[^"]+"/ig, '');
          targetPrompt = targetPrompt.replace(/Depicting:\\s*/ig, '');"""

new_regex = """          // Luôn luôn loại bỏ hoàn toàn câu 'Depicting: "..."' khỏi prompt
          targetPrompt = targetPrompt.replace(/Depicting:\\s*["“”']?[^"“”'.]+["“”']?\\.?\\s*/ig, '');
          targetPrompt = targetPrompt.replace(/Depicting:.+?(?=[A-Za-z])/ig, '');
          targetPrompt = targetPrompt.replace(/Depicting:\\s*/ig, '');"""

if old_regex in content:
    content = content.replace(old_regex, new_regex)

with open('src/server/services/imageGeneratorService.ts', 'w', encoding='utf-8') as f:
    f.write(content)
print("done")
