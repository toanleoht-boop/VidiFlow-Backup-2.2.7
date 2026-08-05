import re

with open('src/server/services/imageGeneratorService.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace setup parameter button locators to use loose regex (no ^ and $ anchors) to prevent icon text interference
old_setup_block = """              // 1. Chọn Tab Hình ảnh hoặc Video (UI Mới)
              const typeTab = getPlaywrightPage()!.locator('button, [role="tab"], div').filter({ hasText: isVideo ? /^Video$/i : /^Hình ảnh$|^Image$/i }).first();
              if (await typeTab.isVisible()) {
                await typeTab.click();
                await getPlaywrightPage()!.waitForTimeout(500);
              }

              // 2. Chọn Tỉ lệ khung hình (Aspect Ratio)
              const targetRatio = visualConfig?.aspectRatio || AspectRatio.SixteenNine;
              const ratioTab = getPlaywrightPage()!.locator('button[role="tab"]').filter({ hasText: new RegExp(`^${targetRatio}$`, "i") }).first();
              if (await ratioTab.isVisible()) {
                await ratioTab.click();
                await getPlaywrightPage()!.waitForTimeout(300);
              }

              // 3. Chọn Số lượng tạo (x2 / 1x)
              const countVal = visualConfig?.generateCount || 1;
              const countLabel = countVal === 1 ? '1x' : `x${countVal}`; 
              const countTab = getPlaywrightPage()!.locator('button[role="tab"]').filter({ hasText: new RegExp(`^${countLabel}$`, "i") }).first();
              if (await countTab.isVisible()) {
                await countTab.click();
                await getPlaywrightPage()!.waitForTimeout(300);
              }

              // 3.5. Chọn Thời lượng (chỉ hiển thị khi là video)
              if (isVideo) {
                const targetDuration = visualConfig?.videoDuration || "8s";
                const durationTab = getPlaywrightPage()!.locator('button, [role="tab"], [role="radio"]').filter({ hasText: new RegExp(`^${targetDuration}$`, "i") }).first();
                if (await durationTab.isVisible()) {
                  await durationTab.click();
                  await getPlaywrightPage()!.waitForTimeout(300);
                }
              }"""

new_setup_block = """              // 1. Chọn Tab Hình ảnh hoặc Video (UI Mới)
              const typeTab = getPlaywrightPage()!.locator('button[role="tab"]').filter({ hasText: isVideo ? /Video/i : /Hình ảnh|Image/i }).first();
              if (await typeTab.isVisible()) {
                await typeTab.click();
                await getPlaywrightPage()!.waitForTimeout(500);
              }

              // 2. Chọn Tỉ lệ khung hình (Aspect Ratio)
              const targetRatio = visualConfig?.aspectRatio || AspectRatio.SixteenNine;
              const ratioTab = getPlaywrightPage()!.locator('button[role="tab"]').filter({ hasText: new RegExp(targetRatio, "i") }).first();
              if (await ratioTab.isVisible()) {
                await ratioTab.click();
                await getPlaywrightPage()!.waitForTimeout(300);
              }

              // 3. Chọn Số lượng tạo (x2 / 1x)
              const countVal = visualConfig?.generateCount || 1;
              const countLabel = countVal === 1 ? '1x' : `x${countVal}`; 
              const countTab = getPlaywrightPage()!.locator('button[role="tab"]').filter({ hasText: new RegExp(countLabel, "i") }).first();
              if (await countTab.isVisible()) {
                await countTab.click();
                await getPlaywrightPage()!.waitForTimeout(300);
              }

              // 3.5. Chọn Thời lượng (chỉ hiển thị khi là video)
              if (isVideo) {
                const targetDuration = visualConfig?.videoDuration || "8s";
                const durationTab = getPlaywrightPage()!.locator('button[role="tab"]').filter({ hasText: new RegExp(targetDuration, "i") }).first();
                if (await durationTab.isVisible()) {
                  await durationTab.click();
                  await getPlaywrightPage()!.waitForTimeout(300);
                }
              }"""

content = content.replace(old_setup_block, new_setup_block)

# Also let's ensure setupBtn locator is robust:
content = content.replace(
    'let actualConfigBtn = configBtnLoc;\n            const tuneBtn = getPlaywrightPage()!.locator("button").filter({ has: getPlaywrightPage()!.locator("i").filter({ hasText: "tune" }) }).first();\n            if (await tuneBtn.isVisible()) actualConfigBtn = tuneBtn;',
    'const actualConfigBtn = getPlaywrightPage()!.locator(\'button[aria-haspopup="menu"]\').first();'
)

with open('src/server/services/imageGeneratorService.ts', 'w', encoding='utf-8') as f:
    f.write(content)
print("done")
