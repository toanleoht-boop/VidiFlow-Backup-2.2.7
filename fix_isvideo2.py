import re

with open('src/server/services/imageGeneratorService.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Remove the local definition of isVideo
local_isvideo = '            const isVideo = visualConfig?.generateType === GenerateType.Video || String(visualConfig?.generateType).toLowerCase() === "video";\n'
if local_isvideo in content:
    content = content.replace(local_isvideo, '')

# 2. Add isVideo at the top of the function
target = '  const fallbackUrl = isStickman'
new_target = '  const isVideo = visualConfig?.generateType === GenerateType.Video || String(visualConfig?.generateType).toLowerCase() === "video";\n' + target
if target in content and 'const isVideo = visualConfig?.generateType === GenerateType.Video' not in content[:content.find(target)]:
    content = content.replace(target, new_target)

with open('src/server/services/imageGeneratorService.ts', 'w', encoding='utf-8') as f:
    f.write(content)
print("done")
