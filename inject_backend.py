import re

with open('src/server/controllers/pipelineController.ts', 'r', encoding='utf-8') as f:
    content = f.read()

if 'import { portContext } from "../services/audioService.js";' not in content:
    content = content.replace('import { uploadToCatbox } from "../services/catboxUploader.js";',
                              'import { uploadToCatbox } from "../services/catboxUploader.js";\nimport { portContext } from "../services/audioService.js";')

# Inject into router.post("/generate-batch-images", ...)
injection_batch = """
    let results;
    let targetPort = 9222;
    if (visualConfig?.chromeProfiles && visualConfig.chromeProfiles.length > 0) {
      targetPort = visualConfig.chromeProfiles[0].port;
    }

    await portContext.run(targetPort, async () => {
      if (visualConfig?.generationMode === "viettheo-api") {
        results = await generateBatchImagesWithViettheoAPI(items, visualConfig, style);
      } else if (visualConfig?.generationMode === "labs-flow" || visualConfig?.generationMode === "google_labs") {
        results = await generateBatchImagesWithGoogleLabs(items, visualConfig, style);
      } else {
        results = await generateBatchImagesWithGeminiChat(items, visualConfig, style);
      }
    });
"""

# Replace the existing block
old_batch = """
    let results;
    if (visualConfig?.generationMode === "viettheo-api") {
      results = await generateBatchImagesWithViettheoAPI(items, visualConfig, style);
    } else if (visualConfig?.generationMode === "labs-flow" || visualConfig?.generationMode === "google_labs") {
      results = await generateBatchImagesWithGoogleLabs(items, visualConfig, style);
    } else {
      results = await generateBatchImagesWithGeminiChat(items, visualConfig, style);
    }
"""

if old_batch in content:
    content = content.replace(old_batch, injection_batch)


# Inject into router.post("/generate-image", ...)
injection_single = """
    let result: any;
    let targetPort = 9222;
    if (visualConfig?.chromeProfiles && visualConfig.chromeProfiles.length > 0) {
      targetPort = visualConfig.chromeProfiles[0].port;
    }

    await portContext.run(targetPort, async () => {
      const mode = visualConfig?.generationMode || "gemini-chat";
      if (mode === "viettheo-api") {
        result = await generateImageWithViettheoAPI({ prompt, visualConfig, style, referenceImage });
      } else {
        result = await generateImageWithPlaywright({ prompt, style, resolution, sandboxConfig, visualConfig, referenceImage });
      }
    });
"""

old_single = """
    let result: any;
    const mode = visualConfig?.generationMode || "gemini-chat";
    
    if (mode === "viettheo-api") {
      result = await generateImageWithViettheoAPI({ prompt, visualConfig, style, referenceImage });
    } else {
      result = await generateImageWithPlaywright({ prompt, style, resolution, sandboxConfig, visualConfig, referenceImage });
    }
"""

if old_single in content:
    content = content.replace(old_single, injection_single)


with open('src/server/controllers/pipelineController.ts', 'w', encoding='utf-8') as f:
    f.write(content)
print("done")
