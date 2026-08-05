import re

with open('src/server/services/imageGeneratorService.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update uploadReferenceImage to support Gemini
old_upload = """async function uploadReferenceImage(page: Page, base64OrPath: string, platform: 'gemini' | 'labs') {
  if (platform !== 'labs') return;
  if (!base64OrPath) return;

  appLog("[Playwright] Uploading reference image natively on labs...");"""

new_upload = """async function uploadReferenceImage(page: Page, base64OrPath: string, platform: 'gemini' | 'labs') {
  if (!base64OrPath) return;

  appLog(`[Playwright] Uploading reference image natively on ${platform}...`);"""

content = content.replace(old_upload, new_upload)

# Gemini upload logic
old_labs_logic = """      await page.waitForTimeout(2000);
      const addBtn = page.locator('button').filter({ hasText: /Thêm vào câu lệnh|Add to prompt/i }).first();
      if (await addBtn.isVisible()) {
         await addBtn.click({ force: true });
         appLog("[Playwright] Clicked 'Thêm vào câu lệnh' in Labs.");
      }"""

new_labs_logic = """      await page.waitForTimeout(2000);
      if (platform === 'labs') {
        const addBtn = page.locator('button').filter({ hasText: /Thêm vào câu lệnh|Add to prompt/i }).first();
        if (await addBtn.isVisible()) {
           await addBtn.click({ force: true });
           appLog("[Playwright] Clicked 'Thêm vào câu lệnh' in Labs.");
        }
      }"""

content = content.replace(old_labs_logic, new_labs_logic)

# 2. Inject uploadReferenceImage into generateImageWithGeminiChat
old_gemini_single = """          if (forceSetting) {
            lastGeminiConfigState = currentConfigState;
          }

          await enterGeminiPrompt(getPlaywrightPage()!, finalPrompt, visualConfig);"""

new_gemini_single = """          if (forceSetting) {
            lastGeminiConfigState = currentConfigState;
          }
          
          if (options.referenceImage) {
            await uploadReferenceImage(getPlaywrightPage()!, options.referenceImage, 'gemini');
          }

          await enterGeminiPrompt(getPlaywrightPage()!, finalPrompt, visualConfig);"""

content = content.replace(old_gemini_single, new_gemini_single)

# 3. Inject reference image extraction into generateBatchImagesWithGeminiChat (maxTabs === 1)
old_gemini_batch_1 = """      const result = await generateImageWithGeminiChat({ prompt: item.prompt, style, visualConfig });"""
new_gemini_batch_1 = """      let refImg = item.referenceImage || "";
      if (!refImg && visualConfig?.globalReferenceImages && visualConfig.globalReferenceImages.length > 0) {
        refImg = visualConfig.globalReferenceImages[0];
      }
      const result = await generateImageWithGeminiChat({ prompt: item.prompt, style, visualConfig, referenceImage: refImg });"""

content = content.replace(old_gemini_batch_1, new_gemini_batch_1)

# 4. Inject reference image extraction into generateBatchImagesWithGeminiChat (concurrency)
old_gemini_batch_2 = """              if (forceSetting) batchPagesConfigs.set(page, currentConfigState);

              await enterGeminiPrompt(page, finalPrompt, visualConfig);"""

new_gemini_batch_2 = """              if (forceSetting) batchPagesConfigs.set(page, currentConfigState);

              let refImg = item.referenceImage || "";
              if (!refImg && visualConfig?.globalReferenceImages && visualConfig.globalReferenceImages.length > 0) {
                refImg = visualConfig.globalReferenceImages[0];
              }
              if (refImg) {
                await uploadReferenceImage(page, refImg, 'gemini');
              }

              await enterGeminiPrompt(page, finalPrompt, visualConfig);"""

content = content.replace(old_gemini_batch_2, new_gemini_batch_2)

with open('src/server/services/imageGeneratorService.ts', 'w', encoding='utf-8') as f:
    f.write(content)
print("done")
