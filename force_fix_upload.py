import re

with open('src/server/services/imageGeneratorService.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Using regex to replace the entire uploadReferenceImage function
pattern = r"async function uploadReferenceImage.*?\}\s*\n"

new_upload = """async function uploadReferenceImage(page: Page, base64OrPath: string, platform: 'gemini' | 'labs') {
  if (!base64OrPath) return;

  appLog(`[Playwright] Uploading reference image natively on ${platform}...`);
  try {
    // Write file to temp
    let cleanBase64 = base64OrPath;
    if (cleanBase64.includes(",")) cleanBase64 = cleanBase64.split(",")[1];
    const buffer = Buffer.from(cleanBase64, 'base64');
    
    // Check if fs exists (should exist in node, but just to be safe)
    const fs = require('fs');
    const path = require('path');
    const tempPath = path.join(process.cwd(), 'temp_ref.png');
    fs.writeFileSync(tempPath, buffer);

    let isUploadClicked = false;
    let fileChooserPromise = page.waitForEvent('filechooser', { timeout: 10000 }).catch(() => null);
    
    // Tìm nút + (Tải nội dung nghe nhìn lên) 
    // Button in lab: <i ...>add_2</i> 
    // Button in gemini: <i ...>add</i>
    // Tải nội dung nghe nhìn lên
    const attachBtn = page.locator('button').filter({ has: page.locator('i').filter({ hasText: /add/i }) }).first();
    
    const directUploadBtn = page.locator('button').filter({ hasText: /Tải nội dung nghe nhìn lên|Upload media/i }).first();
    
    if (await directUploadBtn.isVisible()) {
       await directUploadBtn.click({ force: true });
       isUploadClicked = true;
    } else if (await attachBtn.isVisible()) {
       await attachBtn.click({ force: true });
       await page.waitForTimeout(1000);
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
         appLog("[Playwright] Uploaded file via FileChooser.");
      } else {
         appLog("[Playwright] No fileChooser event detected after clicking upload!");
      }

      await page.waitForTimeout(2000);
      
      if (platform === 'labs') {
        const addBtn = page.locator('button').filter({ hasText: /Thêm vào câu lệnh|Add to prompt/i }).first();
        if (await addBtn.isVisible()) {
           await addBtn.click({ force: true });
           appLog("[Playwright] Clicked 'Thêm vào câu lệnh' in Labs.");
        }
      }
    } else {
      appLog("[Playwright] Image already in library or attach button not found.");
      if (platform === 'labs') {
        const libraryImage = page.locator('img[src*="getMediaUrlRedirect"]').first();
        if (await libraryImage.isVisible()) {
           await libraryImage.click({ force: true });
           await page.waitForTimeout(1000);
           const addBtn = page.locator('button').filter({ hasText: /Thêm vào câu lệnh/i }).first();
           if (await addBtn.isVisible()) await addBtn.click({ force: true });
        }
      }
    }
  } catch (e: any) {
    appLog("[Playwright] Failed to upload reference image: " + e.message);
  }
}
"""

# Try to replace it using a more robust regex that captures until the end of the function.
# The function ends with a catch block and a closing brace.
import re
content = re.sub(r"async function uploadReferenceImage[\s\S]*?(?=\n\nexport async function generateImageWithPlaywright)", new_upload, content)

with open('src/server/services/imageGeneratorService.ts', 'w', encoding='utf-8') as f:
    f.write(content)
print("done")
