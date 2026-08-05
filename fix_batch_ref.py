import re

with open('src/server/services/imageGeneratorService.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix batch missing reference image
old_batch = "const res = await generateImageWithPlaywright({ prompt: item.prompt, style, visualConfig });"
new_batch = """let refImg = item.referenceImage || "";
      if (!refImg && visualConfig?.globalReferenceImages && visualConfig.globalReferenceImages.length > 0) {
        refImg = visualConfig.globalReferenceImages[0];
      }
      const res = await generateImageWithPlaywright({ prompt: item.prompt, style, visualConfig, referenceImage: refImg });"""

content = content.replace(old_batch, new_batch)

with open('src/server/services/imageGeneratorService.ts', 'w', encoding='utf-8') as f:
    f.write(content)
print("done")
