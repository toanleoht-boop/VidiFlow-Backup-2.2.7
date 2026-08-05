import re

with open('src/server/services/imageGeneratorService.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Fix the prompt cleaning (Depicting: "...")
prompt_clean_target = "        const targetPrompt = finalPrompt || prompt;\n        if (targetPrompt && targetPrompt.length > 0) {"
prompt_clean_replacement = """        let targetPrompt = finalPrompt || prompt;
        if (targetPrompt) {
          targetPrompt = targetPrompt.replace(/Depicting:\\s*["“”']?[^"“”'.]+["“”']?\\.?\\s*/ig, '');
          targetPrompt = targetPrompt.replace(/Depicting:.+?(?=[A-Za-z])/ig, '');
          targetPrompt = targetPrompt.replace(/Depicting:\\s*/ig, '');
        }
        if (targetPrompt && targetPrompt.length > 0) {"""
content = content.replace(prompt_clean_target, prompt_clean_replacement)


# 2. Fix the Submit Button Locator
submit_target = """        const submitBtnLocator = globalPlaywrightPage
          .locator("button")
          .filter({
            has: globalPlaywrightPage.locator("i").filter({ hasText: PLAYWRIGHT_SUBMIT_ICON_REGEX }),
          })
          .filter({ hasText: PLAYWRIGHT_SUBMIT_TEXT_REGEX })
          .last();"""
submit_replacement = """        // Match both older and newer Labs Submit buttons
        const submitBtnLocator = globalPlaywrightPage.locator("button").filter({
            has: globalPlaywrightPage.locator("i").filter({ hasText: /spark|send|magic_button|arrow_forward/i }),
        }).or(globalPlaywrightPage.locator('button').filter({ hasText: /Video \\u00B7|T\\u1EA1o \\u1EA3nh|T\\u1EA1o|Create/i })).last();"""
content = content.replace(submit_target, submit_replacement)

# 3. Add uploadReferenceImage BEFORE the config setup
upload_target = """            appLog(BACKEND_MESSAGES.PLAYWRIGHT_CONFIG_NEW);"""
upload_replacement = """          if (options.referenceImage) {
            await uploadReferenceImage(globalPlaywrightPage, options.referenceImage, 'labs');
          }

            appLog(BACKEND_MESSAGES.PLAYWRIGHT_CONFIG_NEW);"""
content = content.replace(upload_target, upload_replacement)


# 4. Fix Model Selection to read the correct model name
model_target = """                const targetEngine = visualConfig?.imageGeneratorEngine || (isVideo ? "Veo 3.1" : "Nano Banana 2");
                // Escape special regex characters in the user's selected engine name"""
model_replacement = """                let targetEngine = visualConfig?.imageGeneratorEngine;
                if (!targetEngine) targetEngine = isVideo ? "Omni Flash" : "Nano Banana Pro";
                // Escape special regex characters in the user's selected engine name"""
content = content.replace(model_target, model_replacement)


# 5. Native Video Download for Labs instead of canvas extraction
# The wait block ends around line 530. Let's find it.
wait_target = """        const base64Data = await globalPlaywrightPage.waitForFunction(
          ([oldIdsList, getImgIdStr]) => {
            const getImgId = new Function("return " + getImgIdStr)();
            const imgs = Array.from(document.querySelectorAll("img"));
            const genImgs = imgs.filter((img) => img.src && img.src.includes("getMediaUrlRedirect"));

            const newImg = [...genImgs].reverse().find((img) => {
              const imgId = getImgId(img.src);
              return imgId && !oldIdsList.includes(imgId);
            });

            if (newImg) {
              try {
                newImg.scrollIntoView({
                  behavior: "instant",
                  block: "center",
                });
              } catch (e) { }

              if (!newImg.complete || newImg.naturalWidth === 0) return null;

              const canvas = document.createElement("canvas");
              canvas.width = newImg.naturalWidth;
              canvas.height = newImg.naturalHeight;
              canvas.getContext("2d")?.drawImage(newImg, 0, 0);
              try {
                const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
                if (dataUrl.length > 1000) return dataUrl;
              } catch (e) { }
            }
            return null;
          },
          [oldIds, getImgIdSafe.toString()] as const,
          { timeout: 150000 },
        );

        const finalBase64 = await base64Data.jsonValue();"""

wait_replacement = """        const isVideo = visualConfig?.generateType === "video" || visualConfig?.generateType === 1;

        const base64Data = await globalPlaywrightPage.waitForFunction(
          ([oldIdsList, getImgIdStr, isVideoArg]) => {
            // Wait for generation to finish. If we see "đang tạo" / "generating", we must wait.
            const statusElements = Array.from(document.querySelectorAll("span, div, p"));
            const isGenerating = statusElements.some(el => {
              const text = (el.textContent || "").trim();
              if (/^\\d+%$/.test(text)) return true;
              const lower = text.toLowerCase();
              return lower === 'đang t\\u1EA1o' || lower === 'generating' || lower === 'creating' || lower === 'đang t\\u1EA1o...';
            });
            if (isGenerating) return null;

            const getImgId = new Function("return " + getImgIdStr)();
            const medias = Array.from(document.querySelectorAll("img, video"));
            const genMedias = medias.filter((el) => {
              const src = (el as HTMLImageElement | HTMLVideoElement).src;
              if (!src) return false;
              if (isVideoArg) return el.tagName.toLowerCase() === 'video';
              if (el.tagName.toLowerCase() === 'video') return true;
              return src.includes("getMediaUrlRedirect");
            });

            const newMedia = genMedias.find((el) => {
              const src = (el as HTMLImageElement | HTMLVideoElement).src;
              const mediaId = getImgId(src);
              return mediaId && !oldIdsList.includes(mediaId);
            });

            if (newMedia) {
              try {
                newMedia.scrollIntoView({ behavior: "instant", block: "center" });
              } catch (e) { }

              if (newMedia.tagName.toLowerCase() === 'video') {
                 (window as any).__foundVideoEl = newMedia;
                 return "video_found";
              }

              const newImg = newMedia as HTMLImageElement;
              if (!newImg.complete || newImg.naturalWidth === 0) return null;

              const canvas = document.createElement("canvas");
              canvas.width = newImg.naturalWidth;
              canvas.height = newImg.naturalHeight;
              canvas.getContext("2d")?.drawImage(newImg, 0, 0);
              try {
                const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
                if (dataUrl.length > 1000) return dataUrl;
              } catch (e) { }
            }
            return null;
          },
          [oldIds, getImgIdSafe.toString(), isVideo] as const,
          { timeout: 150000 },
        );

        let finalBase64 = await base64Data.jsonValue();
        if (finalBase64 === "video_found") {
           appLog("[Playwright] Phát hiện kết quả là Video. Đang kích hoạt Tải Xuống Native...");
           // Native download logic for video!
           try {
               await globalPlaywrightPage.waitForTimeout(2000);
               
               // Hover the found video so the download button appears
               const videoLoc = globalPlaywrightPage.locator('video').last();
               if (await videoLoc.isVisible()) {
                   await videoLoc.hover();
                   await globalPlaywrightPage.waitForTimeout(1000);
               }
               
               // Find native download button
               const downloadBtn = globalPlaywrightPage.locator('button').filter({ has: globalPlaywrightPage.locator('i').filter({ hasText: /download|t\\u1ea3i xu\\u1ed1ng/i }) }).first();
               if (await downloadBtn.isVisible()) {
                   appLog("[Playwright] Clicked Native Download button on video.");
                   const [download] = await Promise.all([
                       globalPlaywrightPage.waitForEvent('download', { timeout: 60000 }),
                       downloadBtn.click({ force: true })
                   ]);
                   const downloadPath = await download.path();
                   if (downloadPath) {
                       const buffer = require('fs').readFileSync(downloadPath);
                       finalBase64 = "data:video/mp4;base64," + buffer.toString("base64");
                   } else {
                       throw new Error("Download returned null path");
                   }
               } else {
                   // Fallback to script fetch if native button not found
                   appLog("[Playwright] Native download button not found. Fallback to fetch script...");
                   const videoBase64 = await globalPlaywrightPage.evaluate(async () => {
                       const videoEl = (window as any).__foundVideoEl as HTMLVideoElement;
                       let s = videoEl.src || videoEl.querySelector("source")?.src;
                       if (!s) return "ERROR: no src found";
                       const res = await fetch(s);
                       const buffer = await res.arrayBuffer();
                       const bytes = new Uint8Array(buffer);
                       let binary = '';
                       for (let i = 0; i < bytes.length; i += 8192) {
                         binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + 8192)));
                       }
                       return "data:video/mp4;base64," + btoa(binary);
                   });
                   if (videoBase64 && videoBase64.startsWith("ERROR:")) throw new Error(videoBase64);
                   finalBase64 = videoBase64;
               }
           } catch (e: any) {
               throw new Error("Native Download Failed: " + e.message);
           }
        }"""
content = content.replace(wait_target, wait_replacement)

with open('src/server/services/imageGeneratorService.ts', 'w', encoding='utf-8') as f:
    f.write(content)
print("done")
