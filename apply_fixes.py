import re

with open('src/server/services/imageGeneratorService.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Remove the upload block from its current location
upload_block = """          if (options.referenceImage) {
            await uploadReferenceImage(getPlaywrightPage(), options.referenceImage, 'labs');
          }"""

if upload_block in content:
    content = content.replace(upload_block, "")

# 2. Insert it before the config setup
target = """            appLog(BACKEND_MESSAGES.PLAYWRIGHT_CONFIG_NEW);"""
new_target = upload_block + "\n\n" + target
content = content.replace(target, new_target)

# 3. Fix the engine name mapping
old_engine_mapping = """                let targetEngineStr = "Imagen 3";
                if (visualConfig?.imageGeneratorEngine === ImageGeneratorEngine.Veo3 || isVideo) targetEngineStr = "Veo";
                else if (visualConfig?.imageGeneratorEngine === ImageGeneratorEngine.Imagen) targetEngineStr = "Imagen 3";"""

new_engine_mapping = """                let targetEngineStr = visualConfig?.imageGeneratorEngine;
                if (!targetEngineStr) targetEngineStr = isVideo ? "Omni Flash" : "Nano Banana Pro";"""

content = content.replace(old_engine_mapping, new_engine_mapping)

with open('src/server/services/imageGeneratorService.ts', 'w', encoding='utf-8') as f:
    f.write(content)
print("done")
