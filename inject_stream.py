import re

with open('src/server/controllers/pipelineController.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Inject into router.post("/generate-batch-images-stream", ...)
injection_stream = """
    let results;
    let targetPort = 9222;
    if (visualConfig?.chromeProfiles && visualConfig.chromeProfiles.length > 0) {
      targetPort = visualConfig.chromeProfiles[0].port;
    }

    await portContext.run(targetPort, async () => {
      if (visualConfig?.generationMode === "viettheo-api") {
        results = await generateBatchImagesWithViettheoAPI(items, visualConfig, style, onProgress);
      } else if (visualConfig?.generationMode === "labs-flow" || visualConfig?.generationMode === "google_labs") {
        results = await generateBatchImagesWithGoogleLabs(items, visualConfig, style);
      } else {
        results = await generateBatchImagesWithGeminiChat(items, visualConfig, style, onProgress);
      }
    });
"""

old_stream = """
    let results;
    if (visualConfig?.generationMode === "viettheo-api") {
      results = await generateBatchImagesWithViettheoAPI(items, visualConfig, style, onProgress);
    } else if (visualConfig?.generationMode === "labs-flow" || visualConfig?.generationMode === "google_labs") {
      results = await generateBatchImagesWithGoogleLabs(items, visualConfig, style); // Note: Labs might not support onProgress yet
    } else {
      results = await generateBatchImagesWithGeminiChat(items, visualConfig, style, onProgress);
    }
"""

if old_stream in content:
    content = content.replace(old_stream, injection_stream)


with open('src/server/controllers/pipelineController.ts', 'w', encoding='utf-8') as f:
    f.write(content)
print("done")
