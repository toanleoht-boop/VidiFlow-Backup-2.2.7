import re

with open('src/server/services/imageGeneratorService.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Move uploadReferenceImage OUTSIDE the config block and add a flag to prevent duplicate uploads in the same attempt
old_upload_block = """          if (currentConfigState !== lastPlaywrightConfigState || attempts > 1) {
          if (options.referenceImage) {
            await uploadReferenceImage(getPlaywrightPage()!, options.referenceImage, 'labs');
          }

            appLog(BACKEND_MESSAGES.PLAYWRIGHT_CONFIG_NEW);"""

new_upload_block = """          if (options.referenceImage) {
            await uploadReferenceImage(getPlaywrightPage()!, options.referenceImage, 'labs');
          }

          if (currentConfigState !== lastPlaywrightConfigState || attempts > 1) {
            appLog(BACKEND_MESSAGES.PLAYWRIGHT_CONFIG_NEW);"""
content = content.replace(old_upload_block, new_upload_block)


# 2. Reduce random delays inside generateImageWithPlaywright to speed it up
# For typing the prompt:
content = content.replace('await randomDelay(200, 400);', 'await randomDelay(50, 100);')
content = content.replace('await randomDelay(150, 300);', 'await randomDelay(50, 100);')
content = content.replace('await randomDelay(400, 800);', 'await randomDelay(100, 200);')
content = content.replace('await randomDelay(100, 200);', 'await randomDelay(50, 100);')
content = content.replace('await randomDelay(1500, 3000);', 'await randomDelay(500, 1000);')

with open('src/server/services/imageGeneratorService.ts', 'w', encoding='utf-8') as f:
    f.write(content)
print("done")
