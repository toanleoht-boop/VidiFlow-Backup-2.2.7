import re

with open('src/server/services/imageGeneratorService.ts', 'r', encoding='utf-8') as f:
    content = f.read()

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
        
        const directUploadBtn = page.locator('button').filter({ hasText: /Tải nội dung nghe nhìn lên|Upload media/i }).first();
        const attachBtn = page.locator('button').filter({ has: page.locator('i').filter({ hasText: /add/i }) }).first();
        
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

          // Explicitly select the temp_ref.png card from library to show it in preview pane
          const tempRefCard = page.locator('div, button, span').filter({ hasText: "temp_ref.png" }).first();
          if (await tempRefCard.isVisible()) {
             await tempRefCard.click({ force: true });
             appLog("[Playwright] Explicitly clicked temp_ref.png in Labs library to select it.");
             await page.waitForTimeout(1500);
          }

          // Wait robustly for "Thêm vào câu lệnh" button to appear and become visible/enabled
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
          const tempRefCard = page.locator('div, button, span').filter({ hasText: "temp_ref.png" }).first();
          if (await tempRefCard.isVisible()) {
             await tempRefCard.click({ force: true });
             await page.waitForTimeout(1500);
             const addBtn = page.locator('button').filter({ hasText: /Thêm vào câu lệnh/i }).first();
             if (await addBtn.isVisible()) {
                await addBtn.click({ force: true });
                appLog("[Playwright] Clicked 'Thêm vào câu lệnh' from library in Labs.");
             }
          }
        }
    }
  } catch (e: any) {
    appLog("[Playwright] Failed to upload reference image: " + e.message);
  }
}
"""

content = re.sub(r"async function uploadReferenceImage[\s\S]*?(?=\n\nexport async function generateImageWithPlaywright)", new_upload, content)

with open('src/server/services/imageGeneratorService.ts', 'w', encoding='utf-8') as f:
    f.write(content)
print("done")
