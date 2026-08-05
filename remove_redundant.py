import re

with open('src/server/services/imageGeneratorService.ts', 'r', encoding='utf-8') as f:
    content = f.read()

target_to_remove = """          // Robust model selection for Google Labs before typing
          if (visualConfig?.imageGeneratorEngine) {
            try {
              appLog(`[Playwright] Attempting to select Model ${visualConfig.imageGeneratorEngine}...`);
              const targetEngineStr = visualConfig.imageGeneratorEngine;
              // Wait a bit for UI to settle
              await getPlaywrightPage()!.waitForTimeout(500);
              
              // Find and click any button/option matching the model name
              const modelEls = await getPlaywrightPage()!.$$('button:visible, [role="option"]:visible, [role="menuitem"]:visible');
              let clickedModel = false;
              for (const el of modelEls) {
                const text = await el.innerText();
                if (text && text.toLowerCase().includes(targetEngineStr.toLowerCase())) {
                   await el.scrollIntoViewIfNeeded().catch(() => {});
                   await el.click({ force: true });
                   clickedModel = true;
                   appLog(`[Playwright] Clicked Model: ${text.trim()}`);
                   await getPlaywrightPage()!.waitForTimeout(500);
                   break;
                }
              }
              if (!clickedModel) {
                 appLog(`[Playwright] Could not find any button matching ${targetEngineStr}.`);
              }
            } catch (e: any) {
              appLog(`[Playwright] Model select failed: ${e.message}`);
            }
          }"""

if target_to_remove in content:
    content = content.replace(target_to_remove, "")
else:
    print("Not found! Please check exactly.")

with open('src/server/services/imageGeneratorService.ts', 'w', encoding='utf-8') as f:
    f.write(content)
print("done")
