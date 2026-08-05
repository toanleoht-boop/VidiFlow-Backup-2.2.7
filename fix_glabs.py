import re
with open('src/server/services/imageGeneratorService.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add cleanPromptText
if 'function cleanPromptText' not in content:
    content = content.replace('export const extractKeywords = (text: string): string => {', 
        'export function cleanPromptText(text: string): string {\n  if (!text) return "";\n  return text.replace(/^(?:Depicting|Dialogue|Subtitle|Text):\\s*".*?"\\s*\\n?/gmi, "").trim();\n}\n\nexport const extractKeywords = (text: string): string => {')

# 2. Add prompt cleaning to functions
content = content.replace('export async function generateImageWithPlaywright(options: ImageGeneratorOptions): Promise<ImageGeneratorResult> {\n  const { prompt, style, visualConfig, sandboxConfig = {} } = options;',
        'export async function generateImageWithPlaywright(options: ImageGeneratorOptions): Promise<ImageGeneratorResult> {\n  let { prompt, style, visualConfig, sandboxConfig = {} } = options;\n  prompt = cleanPromptText(prompt);')

content = content.replace('export async function generateImageWithGeminiChat(options: ImageGeneratorOptions): Promise<ImageGeneratorResult> {\n  const { prompt, style, visualConfig } = options;',
        'export async function generateImageWithGeminiChat(options: ImageGeneratorOptions): Promise<ImageGeneratorResult> {\n  let { prompt, style, visualConfig } = options;\n  prompt = cleanPromptText(prompt);')

content = content.replace('export async function generateImageWithViettheoAPI(options: ImageGeneratorOptions): Promise<ImageGeneratorResult> {\n  const { prompt, style, visualConfig, referenceImage } = options;',
        'export async function generateImageWithViettheoAPI(options: ImageGeneratorOptions): Promise<ImageGeneratorResult> {\n  let { prompt, style, visualConfig, referenceImage } = options;\n  prompt = cleanPromptText(prompt);')

# 3. Fix regex for Flow button
content = re.sub(r'/Dự án mới\|New project\|Tạo dự án\|Create project/i',
                 r'/Dự án mới|New project|Tạo dự án|Create project|Create with Google Flow|Tạo bằng Google Flow|Tạo dự án mới/i', content)

# 4. Fix match url
content = re.sub(r'const match = newUrl.match\(/project\\\\/\(\\\\[a-z0-9\\\\-\\\\]\\+\)/i\);',
                 r'const match = newUrl.match(/(?:project|flow)\\/([a-z0-9\\-]+)/i);', content)

content = content.replace('const match = newUrl.match(/project\\/([a-z0-9\\-]+)/i);', 'const match = newUrl.match(/(?:project|flow)\\/([a-z0-9\\-]+)/i);')

# 5. Fix Model Engine
old_engine = 'const targetEngine = visualConfig?.imageGeneratorEngine || (isVideo ? "Veo 3.1" : "Nano Banana 2");\n                // Escape special regex characters in the user\'s selected engine name\n                const escapedTargetEngine = targetEngine.replace(/[.*+?^${}()|[\\]\\\\]/g, \'\\\\$&\');'
new_engine = 'let targetEngineStr = "Imagen 3";\n                if (visualConfig?.imageGeneratorEngine === ImageGeneratorEngine.Veo3 || isVideo) targetEngineStr = "Veo";\n                else if (visualConfig?.imageGeneratorEngine === ImageGeneratorEngine.Imagen) targetEngineStr = "Imagen 3";\n                \n                // Escape special regex characters in the user\'s selected engine name\n                const escapedTargetEngine = targetEngineStr.replace(/[.*+?^${}()|[\\]\\\\]/g, \'\\\\$&\');'
content = content.replace(old_engine, new_engine)

# Write back
with open('src/server/services/imageGeneratorService.ts', 'w', encoding='utf-8') as f:
    f.write(content)
print("done")
