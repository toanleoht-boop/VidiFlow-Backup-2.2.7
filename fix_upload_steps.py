import re

with open('src/server/services/imageGeneratorService.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace uploadReferenceImage function completely
old_upload = """async function uploadReferenceImage(page: Page, base64OrPath: string, platform: 'gemini' | 'labs') {
  if (platform !== 'labs') return;
  if (!base64OrPath) return;

  appLog("[Playwright] Uploading reference image natively on labs...");
  try {
    const attachBtn = page.locator('button, div[role="button"]').filter({ has: page.locator('i').filter({ hasText: 'add' }) }).first();
    let isUploadClicked = false;
    let fileChooserPromise = page.waitForEvent('filechooser', { timeout: 10000 }).catch(() => null);
    
    // Google Labs has an "upload media" button inside the picker OR directly
    const directUploadBtn = page.locator('button').filter({ hasText: /Tải nội dung nghe nhìn lên/i }).first();
    if (await directUploadBtn.isVisible()) {
       await directUploadBtn.click();
       isUploadClicked = true;
    } else {
       // Need to click attach button to open the Media Picker
       if (await attachBtn.isVisible()) {
           await attachBtn.click();
           await page.waitForTimeout(1000);
           const popupUploadBtn = page.locator('button').filter({ hasText: /Tải nội dung nghe nhìn lên/i }).first();
           if (await popupUploadBtn.isVisible()) {
               await popupUploadBtn.click();
               isUploadClicked = true;
           }
       }
    }

    if (isUploadClicked) {
      let cleanBase64 = base64OrPath;
      if (cleanBase64.includes(",")) cleanBase64 = cleanBase64.split(",")[1];
      const buffer = Buffer.from(cleanBase64, 'base64');
      
      
      const tempPath = path.join(process.cwd(), 'temp_ref.png');
      fs.writeFileSync(tempPath, buffer);

      const fileChooser = await fileChooserPromise;
      if (fileChooser) {
         await fileChooser.setFiles(tempPath);
         appLog("[Playwright] Uploaded file via FileChooser.");
      } else {
         appLog("[Playwright] No fileChooser event detected after clicking upload!");
      }

      await page.waitForTimeout(2000);
      const addBtn = page.locator('button').filter({ hasText: /Thêm vào câu lệnh/i }).first();
      if (await addBtn.isVisible()) {
         await addBtn.click();
         appLog("[Playwright] Clicked 'Thêm vào câu lệnh' in Labs.");
      }
    } else {
      // Maybe the image is already in the library!
      appLog("[Playwright] Image already in Labs library. Attempting to re-use it.");
      const libraryImage = page.locator('img[src*="getMediaUrlRedirect"]').first();
      if (await libraryImage.isVisible()) {
        await libraryImage.click();
        await page.waitForTimeout(1000);
        const addBtn = page.locator('button').filter({ hasText: /Thêm vào câu lệnh/i }).first();
        if (await addBtn.isVisible()) {
           await addBtn.click();
           appLog("[Playwright] Clicked 'Thêm vào câu lệnh' for existing image in Labs.");
        }
      }
    }
  } catch (e: any) {
    appLog("[Playwright] Failed to upload reference image: " + e.message);
  }
}"""

new_upload = """async function uploadReferenceImage(page: Page, base64OrPath: string, platform: 'gemini' | 'labs') {
  if (platform !== 'labs') return;
  if (!base64OrPath) return;

  appLog("[Playwright] Uploading reference image natively on labs...");
  try {
    // Write file to temp
    let cleanBase64 = base64OrPath;
    if (cleanBase64.includes(",")) cleanBase64 = cleanBase64.split(",")[1];
    const buffer = Buffer.from(cleanBase64, 'base64');
    const tempPath = path.join(process.cwd(), 'temp_ref.png');
    fs.writeFileSync(tempPath, buffer);

    let isUploadClicked = false;
    let fileChooserPromise = page.waitForEvent('filechooser', { timeout: 10000 }).catch(() => null);
    
    // Tìm nút + (Tải nội dung nghe nhìn lên) theo aria-label hoặc title
    const attachBtn = page.locator('button[aria-label*="nghe nhìn" i], button[title*="nghe nhìn" i], button[aria-label*="Tải" i], button').filter({ has: page.locator('i').filter({ hasText: 'add' }) }).first();
    
    // Nếu có sẵn nút có chữ "Tải nội dung nghe nhìn lên" thì click luôn
    const directUploadBtn = page.locator('button').filter({ hasText: /Tải nội dung nghe nhìn lên|Upload media/i }).first();
    
    if (await directUploadBtn.isVisible()) {
       await directUploadBtn.click({ force: true });
       isUploadClicked = true;
    } else if (await attachBtn.isVisible()) {
       await attachBtn.click({ force: true });
       await page.waitForTimeout(500);
       // Click nút tải lên bên trong menu
       const popupUploadBtn = page.locator('button, [role="menuitem"]').filter({ hasText: /Tải nội dung nghe nhìn lên|Upload media/i }).first();
       if (await popupUploadBtn.isVisible()) {
           await popupUploadBtn.click({ force: true });
           isUploadClicked = true;
       } else {
           isUploadClicked = true; // Assume attachBtn directly triggers file chooser
       }
    }

    if (isUploadClicked) {
      const fileChooser = await fileChooserPromise;
      if (fileChooser) {
         await fileChooser.setFiles(tempPath);
         appLog("[Playwright] Uploaded file via FileChooser.");
      } else {
         appLog("[Playwright] No fileChooser event detected after clicking upload!");
      }

      await page.waitForTimeout(2000);
      const addBtn = page.locator('button').filter({ hasText: /Thêm vào câu lệnh|Add to prompt/i }).first();
      if (await addBtn.isVisible()) {
         await addBtn.click({ force: true });
         appLog("[Playwright] Clicked 'Thêm vào câu lệnh' in Labs.");
      }
    }
  } catch (e: any) {
    appLog("[Playwright] Failed to upload reference image: " + e.message);
  }
}"""

content = content.replace(old_upload, new_upload)

with open('src/server/services/imageGeneratorService.ts', 'w', encoding='utf-8') as f:
    f.write(content)
print("done")
