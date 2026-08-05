const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/server/services/imageGeneratorService.ts');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Imports
content = content.replace(/import \{ globalPlaywrightPage,/g, 'import { getPlaywrightPage, portContext,');

// 2. Mutex
content = content.replace(
  /export const imageGenMutex = new SimpleMutex\(\);/,
  "export const profileMutexes = new Map<number, SimpleMutex>();\n" +
  "export function getMutexForPort(port: number) {\n" +
  "  if (!profileMutexes.has(port)) profileMutexes.set(port, new SimpleMutex());\n" +
  "  return profileMutexes.get(port)!;\n" +
  "}"
);
content = content.replace(/imageGenMutex\.acquire\(\)/g, 'getMutexForPort(portContext.getStore() || 9222).acquire()');

// 3. State maps
content = content.replace(/let activeFlowProjectId = "";/, 'const activeFlowProjectIdByPort = new Map<number, string>();');
content = content.replace(/activeFlowProjectId = /g, 'activeFlowProjectIdByPort.set(portContext.getStore() || 9222, ');
content = content.replace(/activeFlowProjectId/g, 'activeFlowProjectIdByPort.get(portContext.getStore() || 9222)');
content = content.replace(/activeFlowProjectIdByPort\.set\(portContext\.getStore\(\) \|\| 9222, ByPort\.get\(portContext\.getStore\(\) \|\| 9222\)/g, 'activeFlowProjectIdByPort.set(portContext.getStore() || 9222, '); // Fix double replace

content = content.replace(/let globalBatchPages: Page\[\] = \[\];/, 'const globalBatchPagesByPort = new Map<number, Page[]>();');
content = content.replace(/globalBatchPages/g, '(globalBatchPagesByPort.get(portContext.getStore() || 9222) || [])');
content = content.replace(/\(globalBatchPagesByPort\.get\(portContext\.getStore\(\) \|\| 9222\) \|\| \[\]\)\.push/g, '(() => { const p = portContext.getStore() || 9222; const arr = globalBatchPagesByPort.get(p) || []; arr.push');
content = content.replace(/\(globalBatchPagesByPort\.get\(portContext\.getStore\(\) \|\| 9222\) \|\| \[\]\) = /g, 'globalBatchPagesByPort.set(portContext.getStore() || 9222, ');

// 4. Wrappers
function injectWrapper(funcName, isBatch) {
  const funcRegexStr = "export async function " + funcName + "\\(options: ImageGeneratorOptions\\): Promise<ImageGeneratorResult> \\{";
  const batchRegexStr = "export async function " + funcName + "\\(items: BatchImageItem\\[\\], visualConfig: any, style\\?: string, onProgress\\?: \\(result: BatchImageResult\\) => void\\): Promise<BatchImageResult\\[\\]> \\{";
  
  const targetRegex = new RegExp(isBatch ? batchRegexStr : funcRegexStr);
  
  if (!targetRegex.test(content)) return;
  
  // Rename internal function
  const internalReplacement = "async function " + funcName + "_Internal(" + (isBatch ? 'items: BatchImageItem[], visualConfig: any, style?: string, onProgress?: (result: BatchImageResult) => void' : 'options: ImageGeneratorOptions') + "): Promise<" + (isBatch ? 'BatchImageResult[]' : 'ImageGeneratorResult') + "> {";
  content = content.replace(targetRegex, internalReplacement);
  
  // Add exported wrapper
  let wrapper = '';
  if (isBatch) {
    wrapper = "\n" +
"export async function " + funcName + "(items: BatchImageItem[], visualConfig: any, style?: string, onProgress?: (result: BatchImageResult) => void): Promise<BatchImageResult[]> {\n" +
"  const profileConfig = (visualConfig as any)?.chromeProfiles;\n" +
"  const profiles = (profileConfig?.enabled && profileConfig?.profiles?.length > 0)\n" +
"    ? profileConfig.profiles.filter((p: any) => p.active)\n" +
"    : [{ port: 9222, concurrency: visualConfig?.threadCount || 1 }];\n" +
"    \n" +
"  if (profiles.length === 0) profiles.push({ port: 9222, concurrency: visualConfig?.threadCount || 1 });\n" +
"\n" +
"  const chunkedItems: BatchImageItem[][] = Array.from({ length: profiles.length }, () => []);\n" +
"  items.forEach((item, index) => {\n" +
"    chunkedItems[index % profiles.length].push(item);\n" +
"  });\n" +
"\n" +
"  const promises = profiles.map((profile: any, index: number) => {\n" +
"    const profileItems = chunkedItems[index];\n" +
"    if (profileItems.length === 0) return Promise.resolve([]);\n" +
"    const pVisualConfig = { ...visualConfig, threadCount: profile.concurrency };\n" +
"    return portContext.run(profile.port, () => \n" +
"       " + funcName + "_Internal(profileItems, pVisualConfig, style, onProgress)\n" +
"    );\n" +
"  });\n" +
"\n" +
"  const results = await Promise.all(promises);\n" +
"  return results.flat();\n" +
"}\n";
  } else {
    wrapper = "\n" +
"export async function " + funcName + "(options: ImageGeneratorOptions): Promise<ImageGeneratorResult> {\n" +
"  const profileConfig = options?.visualConfig ? (options.visualConfig as any)?.chromeProfiles : undefined;\n" +
"  const profiles = (profileConfig?.enabled && profileConfig?.profiles?.length > 0)\n" +
"    ? profileConfig.profiles.filter((p: any) => p.active)\n" +
"    : [{ port: 9222, concurrency: 1 }];\n" +
"  \n" +
"  const validProfiles = profiles.length > 0 ? profiles : [{ port: 9222, concurrency: 1 }];\n" +
"  const randomProfile = validProfiles[Math.floor(Math.random() * validProfiles.length)];\n" +
"  \n" +
"  return portContext.run(randomProfile.port, () => " + funcName + "_Internal(options));\n" +
"}\n";
  }
  
  // Insert wrapper before the internal function
  const searchFor = "async function " + funcName + "_Internal";
  content = content.replace(new RegExp(searchFor), wrapper + "\n" + searchFor);
}

injectWrapper('generateImageWithPlaywright', false);
injectWrapper('generateImageWithGeminiChat', false);
injectWrapper('generateBatchImagesWithGoogleLabs', true);
injectWrapper('generateBatchImagesWithGeminiChat', true);

// 5. Replace globalPlaywrightPage
content = content.replace(/globalPlaywrightPage/g, 'getPlaywrightPage()');
content = content.replace(/getPlaywrightPage\(\)\.isClosed/g, '(getPlaywrightPage()?.isClosed || (() => false))');
content = content.replace(/!getPlaywrightPage\(\)/g, '!getPlaywrightPage()');

// Write back
fs.writeFileSync(filePath, content, 'utf8');
console.log('Refactor v2 applied');
