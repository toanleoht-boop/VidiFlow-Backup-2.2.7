import re

with open('src/server/services/imageGeneratorService.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Replace uploadReferenceImage
new_upload = """async function uploadReferenceImage(page: Page, base64OrPath: string, platform: 'gemini' | 'labs') {
  if (!base64OrPath) return;

  appLog(`[Playwright] Uploading reference image natively on ${platform}...`);
  try {
    let cleanBase64 = base64OrPath;
    if (cleanBase64.includes(",")) cleanBase64 = cleanBase64.split(",")[1];
    const buffer = Buffer.from(cleanBase64, 'base64');
    
    const tempPath = path.join(process.cwd(), 'temp_ref.png');
    fs.writeFileSync(tempPath, buffer);

    if (platform === 'gemini') {
        // ALWAYS use the click plus (+) -> click "Tải tệp lên" flow with FileChooser for Gemini Chat
        let fileChooserPromise = page.waitForEvent('filechooser', { timeout: 15000 }).catch(() => null);
        const geminiAttachBtn = page.locator('button[aria-label*="Nội dung tải lên" i], button[aria-label*="Nội dung tải lên và công cụ" i]').first();
        
        if (await geminiAttachBtn.isVisible()) {
            await geminiAttachBtn.click({ force: true });
            appLog("[Playwright] Clicked plus (+) attach button in Gemini.");
            await page.waitForTimeout(1500);
            
            const uploadFileBtn = page.locator('button, [role="menuitem"]').filter({ hasText: /Tải tệp lên|Upload/i }).first();
            if (await uploadFileBtn.isVisible()) {
                await uploadFileBtn.click({ force: true });
                appLog("[Playwright] Clicked 'Tải tệp lên' button in Gemini.");
                const fileChooser = await fileChooserPromise;
                if (fileChooser) {
                   await fileChooser.setFiles(tempPath);
                   appLog("[Playwright] Uploaded file via FileChooser in Gemini.");
                   await page.waitForTimeout(3000);
                } else {
                   appLog("[Playwright] FileChooser not detected in Gemini!");
                }
            } else {
                appLog("[Playwright] 'Tải tệp lên' option not found in attach menu.");
            }
        } else {
            appLog("[Playwright] Gemini attach button (+) not found or not visible.");
        }

        // Check and handle Gemini's disclaimer dialog
        const agreeBtn = page.locator('button[data-test-id="upload-image-agree-button"], button').filter({ hasText: /Đồng ý|Agree/i }).first();
        if (await agreeBtn.isVisible()) {
            await agreeBtn.click({ force: true });
            appLog("[Playwright] Clicked 'Đồng ý' on Gemini disclaimer dialog.");
            await page.waitForTimeout(2000);
        }
    } else {
        let isUploadClicked = false;
        let fileChooserPromise = page.waitForEvent('filechooser', { timeout: 15000 }).catch(() => null);
        
        // Exact locators from HTML
        const attachBtn = page.locator('button[aria-haspopup="dialog"]').filter({ has: page.locator('i').filter({ hasText: /add_2|add/ }) }).first();
        const directUploadBtn = page.locator('button').filter({ hasText: /Tải nội dung nghe nhìn lên|Upload media/i }).first();
        
        if (await directUploadBtn.isVisible()) {
           await directUploadBtn.click({ force: true });
           isUploadClicked = true;
        } else if (await attachBtn.isVisible()) {
           await attachBtn.click({ force: true });
           await page.waitForTimeout(1500);
           const popupUploadBtn = page.locator('button, [role="menuitem"], li, span').filter({ hasText: /Tải nội dung nghe nhìn lên|Upload media/i }).first();
           if (await popupUploadBtn.isVisible()) {
               await popupUploadBtn.click({ force: true });
               isUploadClicked = true;
           } else {
               isUploadClicked = true;
           }
        }

        if (isUploadClicked) {
          const fileChooser = await fileChooserPromise;
          if (fileChooser) {
             await fileChooser.setFiles(tempPath);
             appLog("[Playwright] Uploaded file via FileChooser in Labs.");
          } else {
             appLog("[Playwright] No fileChooser event detected after clicking upload!");
          }

          await page.waitForTimeout(4000); // Give Labs time to process upload

          // Re-click the plus button (+) to open library to choose the newly uploaded image
          appLog("[Playwright] Re-clicking attach button (+) to open library in Labs...");
          if (await attachBtn.isVisible()) {
             await attachBtn.click({ force: true });
             await page.waitForTimeout(2000);
          }

          // Switch to tab "Tệp tải lên" (Upload files) first for faster file listing
          const uploadsTab = page.locator('button[role="tab"]').filter({ hasText: /Tệp tải lên/i }).first();
          if (await uploadsTab.isVisible()) {
             await uploadsTab.click({ force: true });
             appLog("[Playwright] Switched to 'Tệp tải lên' tab in Labs.");
             await page.waitForTimeout(1500);
          }

          appLog("[Playwright] Waiting up to 15s for uploaded temp_ref.png option in library...");
          const tempRefCard = page.locator('div[role="option"]').filter({ hasText: "temp_ref.png" }).first();
          try {
             await tempRefCard.waitFor({ state: 'visible', timeout: 15000 });
             await tempRefCard.click({ force: true });
             appLog("[Playwright] Selected temp_ref.png option from Labs list.");
             await page.waitForTimeout(1500);
          } catch (e: any) {
             appLog("[Playwright] temp_ref.png option did not become visible: " + e.message);
          }

          // Wait robustly for "Thêm vào câu lệnh" button to appear and click it
          const addBtn = page.locator('button').filter({ hasText: /Thêm vào câu lệnh|Add to prompt/i }).first();
          try {
             appLog("[Playwright] Waiting up to 15s for 'Thêm vào câu lệnh' button to be visible...");
             await addBtn.waitFor({ state: 'visible', timeout: 15000 });
             await addBtn.click({ force: true });
             appLog("[Playwright] Clicked 'Thêm vào câu lệnh' in Labs.");
          } catch (err: any) {
             appLog("[Playwright] 'Thêm vào câu lệnh' button not visible/found: " + err.message);
          }
        } else {
          appLog("[Playwright] Image already in library or attach button not found.");
          const uploadsTab = page.locator('button[role="tab"]').filter({ hasText: /Tệp tải lên/i }).first();
          if (await uploadsTab.isVisible()) {
             await uploadsTab.click({ force: true });
             await page.waitForTimeout(1000);
          }
          const tempRefCard = page.locator('div[role="option"]').filter({ hasText: "temp_ref.png" }).first();
          try {
             await tempRefCard.waitFor({ state: 'visible', timeout: 10000 });
             await tempRefCard.click({ force: true });
             await page.waitForTimeout(1500);
             const addBtn = page.locator('button').filter({ hasText: /Thêm vào câu lệnh/i }).first();
             if (await addBtn.isVisible()) {
                await addBtn.click({ force: true });
                appLog("[Playwright] Clicked 'Thêm vào câu lệnh' from library in Labs.");
             }
          } catch (e: any) {
             appLog("[Playwright] temp_ref.png already in library but could not click it: " + e.message);
          }
        }
    }
  } catch (e: any) {
    appLog("[Playwright] Failed to upload reference image: " + e.message);
  }
}
"""

content = re.sub(r"async function uploadReferenceImage[\s\S]*?(?=\n\nexport async function generateImageWithPlaywright)", new_upload, content)

# 2. Fix model dropdown locator and generate count label in generateImageWithPlaywright
# First, let's find the model dropdown section
old_dropdown_section = """              // 4. Chọn Model (Engine)
              const engineDropdownBtn = getPlaywrightPage()!.locator('[role="dialog"] button[aria-haspopup="menu"], .cdk-overlay-pane button[aria-haspopup="menu"]').first();
              
              if (await engineDropdownBtn.isVisible()) {
                await engineDropdownBtn.click({ force: true });
                await getPlaywrightPage()!.waitForTimeout(500);
                
                let targetEngine = visualConfig?.imageGeneratorEngine;
                if (!targetEngine) targetEngine = isVideo ? "Omni Flash" : "Nano Banana Pro";
                // Escape special regex characters in the user's selected engine name
                const escapedTargetEngine = targetEngine.replace(/[.*+?^${}()|[\\\]\\\\]/g, '\\\\$&');
                const engineRegex = new RegExp(escapedTargetEngine, "i");
                
                let optionBtn = getPlaywrightPage()!.locator('[role="menuitem"]' + ':visible').filter({ hasText: engineRegex }).first();"""

new_dropdown_section = """              // 4. Chọn Model (Engine)
              const engineDropdownBtn = getPlaywrightPage()!.locator('button[aria-haspopup="menu"]').filter({ has: getPlaywrightPage()!.locator('i').filter({ hasText: /arrow_drop_down/ }) }).first();
              
              if (await engineDropdownBtn.isVisible()) {
                await engineDropdownBtn.click({ force: true });
                await getPlaywrightPage()!.waitForTimeout(500);
                
                let targetEngine = visualConfig?.imageGeneratorEngine;
                if (!targetEngine) targetEngine = isVideo ? "Omni Flash" : "Nano Banana Pro";
                // Escape special regex characters in the user's selected engine name
                const escapedTargetEngine = targetEngine.replace(/[.*+?^${}()|[\\\]\\\\]/g, '\\\\$&');
                const engineRegex = new RegExp(escapedTargetEngine, "i");
                
                let optionBtn = getPlaywrightPage()!.locator('[role="menuitem"], button').filter({ hasText: engineRegex }).first();"""

content = content.replace(old_dropdown_section, new_dropdown_section)

# 3. Fix quantity/generate count label selection
old_count_section = """              // 3. Chọn Số lượng tạo (1x)
              const countLabel = `1x`; 
              const countTab = getPlaywrightPage()!.locator('button, [role="tab"], div').filter({ hasText: new RegExp(`^${countLabel}$`, "i") }).first();"""

new_count_section = """              // 3. Chọn Số lượng tạo (x2 / 1x)
              const countVal = visualConfig?.generateCount || 1;
              const countLabel = countVal === 1 ? '1x' : `x${countVal}`; 
              const countTab = getPlaywrightPage()!.locator('button, [role="tab"], div').filter({ hasText: new RegExp(`^${countLabel}$`, "i") }).first();"""

content = content.replace(old_count_section, new_count_section)

with open('src/server/services/imageGeneratorService.ts', 'w', encoding='utf-8') as f:
    f.write(content)
print("done")
