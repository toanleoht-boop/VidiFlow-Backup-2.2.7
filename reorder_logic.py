import re

with open('src/server/services/imageGeneratorService.ts', 'r', encoding='utf-8') as f:
    content = f.read()

upload_block = """          if (options.referenceImage) {
            await uploadReferenceImage(getPlaywrightPage(), options.referenceImage, 'labs');
          }"""

if upload_block in content:
    # Remove it from the original place
    content = content.replace(upload_block, "")
    
    # Add it before model selection
    target = "// Robust model selection for Google Labs before typing"
    new_target = upload_block + "\n\n          " + target
    
    content = content.replace(target, new_target)

with open('src/server/services/imageGeneratorService.ts', 'w', encoding='utf-8') as f:
    f.write(content)
print("done")
