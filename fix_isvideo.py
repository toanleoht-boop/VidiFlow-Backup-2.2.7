import re

with open('src/server/services/imageGeneratorService.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace
old_block = """            if (await actualConfigBtn.isVisible()) {
              await actualConfigBtn.click({ force: true });
              await getPlaywrightPage()!.waitForTimeout(1000);

              const isVideo = visualConfig?.generateType === GenerateType.Video || String(visualConfig?.generateType).toLowerCase() === "video";"""

new_block = """            const isVideo = visualConfig?.generateType === GenerateType.Video || String(visualConfig?.generateType).toLowerCase() === "video";
            if (await actualConfigBtn.isVisible()) {
              await actualConfigBtn.click({ force: true });
              await getPlaywrightPage()!.waitForTimeout(1000);"""

if old_block in content:
    content = content.replace(old_block, new_block)

with open('src/server/services/imageGeneratorService.ts', 'w', encoding='utf-8') as f:
    f.write(content)
print("done")
