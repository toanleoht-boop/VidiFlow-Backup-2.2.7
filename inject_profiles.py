import re

with open('src/components/pipeline/usePipelineWizard.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Read from localStorage inside handleGenerateAllImages
injection = """
      let activeProfiles = [];
      try {
        const stored = localStorage.getItem("chrome_profiles_config");
        if (stored) {
          const config = JSON.parse(stored);
          if (config.enabled && config.profiles) {
            activeProfiles = config.profiles.filter((p: any) => p.active);
          }
        }
      } catch (e) {}
      
      const response = await fetch("/api/pipeline/generate-batch-images", {
"""
content = content.replace('const response = await fetch("/api/pipeline/generate-batch-images", {', injection)

# Add chromeProfiles to payload
payload_injection = """
          items,
          visualConfig: {
            ...project.visualConfig,
            chromeProfiles: activeProfiles
          },
          style: project.visualConfig?.style
"""
content = content.replace('items,\n          visualConfig: project.visualConfig,\n          style: project.visualConfig?.style', payload_injection)

# Also update handleGenerateImage (single image generation)
single_injection = """
      let activeProfiles = [];
      try {
        const stored = localStorage.getItem("chrome_profiles_config");
        if (stored) {
          const config = JSON.parse(stored);
          if (config.enabled && config.profiles) {
            activeProfiles = config.profiles.filter((p: any) => p.active);
          }
        }
      } catch (e) {}

      const response = await fetch("/api/pipeline/generate-image", {
"""
content = content.replace('const response = await fetch("/api/pipeline/generate-image", {', single_injection)

single_payload_injection = """
          engine: project.visualConfig?.imageGeneratorEngine || "Veo3",
          visualConfig: {
            ...project.visualConfig,
            chromeProfiles: activeProfiles
          },
          referenceImage: refImg,
"""
content = content.replace('engine: project.visualConfig?.imageGeneratorEngine || "Veo3",\n          visualConfig: project.visualConfig,\n          referenceImage: refImg,', single_payload_injection)

with open('src/components/pipeline/usePipelineWizard.ts', 'w', encoding='utf-8') as f:
    f.write(content)
print("done")
