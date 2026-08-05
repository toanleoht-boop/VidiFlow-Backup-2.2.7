import re

with open('src/server/services/imageGeneratorService.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the broken expression
content = content.replace('(getPlaywrightPage()?.isClosed || (() => false))()', 'getPlaywrightPage()?.isClosed()')

with open('src/server/services/imageGeneratorService.ts', 'w', encoding='utf-8') as f:
    f.write(content)
print("done")
