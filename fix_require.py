import re

with open('src/server/services/imageGeneratorService.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Fix require('fs') and require('path')
if 'import fs from "fs";' not in content:
    content = content.replace('import { Locator, Page } from "playwright";', 'import { Locator, Page } from "playwright";\nimport fs from "fs";\nimport path from "path";')

content = content.replace("const fs = require('fs');", "")
content = content.replace("const path = require('path');", "")
content = content.replace("const tempPath = path.join(process.cwd(), 'temp_ref.png');", "const tempPath = path.join(process.cwd(), 'temp_ref.png');")

# 2. Fix Video/Image tab selection
content = content.replace(
    "const typeTab = getPlaywrightPage()!.locator('[role=\"tab\"]').filter({ hasText: isVideo ? /Video/i : /Hình ảnh|Image/i }).first();",
    "const typeTab = getPlaywrightPage()!.locator('button, [role=\"tab\"], div').filter({ hasText: isVideo ? /^Video$/i : /^Hình ảnh$|^Image$/i }).first();"
)

content = content.replace(
    "const ratioTab = getPlaywrightPage()!.locator('[role=\"tab\"]').filter({ hasText: new RegExp(targetRatio, \"i\") }).first();",
    "const ratioTab = getPlaywrightPage()!.locator('button, [role=\"tab\"], div').filter({ hasText: new RegExp(`^${targetRatio}$`, \"i\") }).first();"
)

content = content.replace(
    "const countTab = getPlaywrightPage()!.locator('[role=\"tab\"]').filter({ hasText: new RegExp(countLabel, \"i\") }).first();",
    "const countTab = getPlaywrightPage()!.locator('button, [role=\"tab\"], div').filter({ hasText: new RegExp(`^${countLabel}$`, \"i\") }).first();"
)

# 3. Fix closing the popup
old_close = """              const saveBtn = getPlaywrightPage()!
                .locator("button" + ":visible")
                .filter({ hasText: IMAGE_GEN_SAVE_BTN_REGEX })
                .first();
              if (await saveBtn.isVisible()) {
                await saveBtn.click();
              } else {
                await getPlaywrightPage()!.keyboard.press("Escape").catch(() => {});
              }"""

new_close = """              const saveBtn = getPlaywrightPage()!
                .locator("button" + ":visible")
                .filter({ hasText: IMAGE_GEN_SAVE_BTN_REGEX })
                .first();
              if (await saveBtn.isVisible()) {
                await saveBtn.click();
              } else {
                await actualConfigBtn.click({ force: true }).catch(() => {});
                await getPlaywrightPage()!.mouse.click(0, 0).catch(() => {});
              }"""
content = content.replace(old_close, new_close)

# 4. Fix appError logging to include error message
content = content.replace("appError(BACKEND_MESSAGES.PLAYWRIGHT_CONFIG_SKIP, configErr);", "appError(BACKEND_MESSAGES.PLAYWRIGHT_CONFIG_SKIP + ' ' + (configErr as any)?.message);")

with open('src/server/services/imageGeneratorService.ts', 'w', encoding='utf-8') as f:
    f.write(content)
print("done")
