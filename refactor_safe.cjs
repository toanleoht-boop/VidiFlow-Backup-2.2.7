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
content = content.replace(/\bactiveFlowProjectId\b = /g, 'activeFlowProjectIdByPort.set(portContext.getStore() || 9222, ');
content = content.replace(/\bactiveFlowProjectId\b/g, 'activeFlowProjectIdByPort.get(portContext.getStore() || 9222)');

content = content.replace(/let globalBatchPages: Page\[\] = \[\];/, 'const globalBatchPagesByPort = new Map<number, Page[]>();');
content = content.replace(/\bglobalBatchPages\b = /g, 'globalBatchPagesByPort.set(portContext.getStore() || 9222, ');
content = content.replace(/\bglobalBatchPages\b\.push/g, '(() => { const p = portContext.getStore() || 9222; const arr = globalBatchPagesByPort.get(p) || []; if(!globalBatchPagesByPort.has(p)) globalBatchPagesByPort.set(p, arr); return arr; })().push');
content = content.replace(/\bglobalBatchPages\b/g, '(globalBatchPagesByPort.get(portContext.getStore() || 9222) || [])');

// 4. Update ImageGeneratorOptions
content = content.replace("  referenceImage?: string;\n}", "  referenceImage?: string;\n  chromeProfiles?: any;\n}");

// Fix the missing parens in ByPort.set (because regex replace removed parens when replacing assignments)
// My earlier fix didn't address the fact that `globalBatchPages = [];` gets replaced with `.set(port, [];`
// Let's actually fix this properly!
// When we do: `globalBatchPages = ` -> `globalBatchPagesByPort.set(port, `
// we need to close the `)` at the end of the line!
// Since JS is complex, let's just do a manual replace of those specific lines:
content = content.replace("activeFlowProjectIdByPort.set(portContext.getStore() || 9222, \"\";", "activeFlowProjectIdByPort.set(portContext.getStore() || 9222, \"\");");
content = content.replace("globalBatchPagesByPort.set(portContext.getStore() || 9222, [];", "globalBatchPagesByPort.set(portContext.getStore() || 9222, []);");
content = content.replace("globalBatchPagesByPort.set(portContext.getStore() || 9222, (globalBatchPagesByPort.get(portContext.getStore() || 9222) || []).filter((p) => !p.isClosed());", "globalBatchPagesByPort.set(portContext.getStore() || 9222, (globalBatchPagesByPort.get(portContext.getStore() || 9222) || []).filter((p) => !p.isClosed()));");
content = content.replace("activeFlowProjectIdByPort.set(portContext.getStore() || 9222, projectId;", "activeFlowProjectIdByPort.set(portContext.getStore() || 9222, projectId);");

// 5. Replace globalPlaywrightPage
content = content.replace(/\bglobalPlaywrightPage\b/g, 'getPlaywrightPage()');
content = content.replace(/getPlaywrightPage\(\)\.isClosed/g, '(getPlaywrightPage()?.isClosed || (() => false))');
content = content.replace(/!getPlaywrightPage\(\)/g, '!getPlaywrightPage()');

// 6. Rename functions
content = content.replace(/export async function generateImageWithPlaywright/g, 'async function generateImageWithPlaywright_Internal');
content = content.replace(/export async function generateImageWithGeminiChat/g, 'async function generateImageWithGeminiChat_Internal');
content = content.replace(/export async function generateBatchImagesWithGoogleLabs/g, 'async function generateBatchImagesWithGoogleLabs_Internal');
content = content.replace(/export async function generateBatchImagesWithGeminiChat/g, 'async function generateBatchImagesWithGeminiChat_Internal');

// 7. Append Wrappers
const wrappers = `

export async function generateImageWithPlaywright(options: ImageGeneratorOptions): Promise<ImageGeneratorResult> {
  const profileConfig = options?.visualConfig ? (options.visualConfig as any)?.chromeProfiles : options?.chromeProfiles;
  const profiles = (profileConfig?.enabled && profileConfig?.profiles?.length > 0)
    ? profileConfig.profiles.filter((p: any) => p.active)
    : [{ port: 9222, concurrency: 1 }];
  const validProfiles = profiles.length > 0 ? profiles : [{ port: 9222, concurrency: 1 }];
  const randomProfile = validProfiles[Math.floor(Math.random() * validProfiles.length)];
  return portContext.run(randomProfile.port, () => generateImageWithPlaywright_Internal(options));
}

export async function generateImageWithGeminiChat(options: ImageGeneratorOptions): Promise<ImageGeneratorResult> {
  const profileConfig = options?.visualConfig ? (options.visualConfig as any)?.chromeProfiles : options?.chromeProfiles;
  const profiles = (profileConfig?.enabled && profileConfig?.profiles?.length > 0)
    ? profileConfig.profiles.filter((p: any) => p.active)
    : [{ port: 9222, concurrency: 1 }];
  const validProfiles = profiles.length > 0 ? profiles : [{ port: 9222, concurrency: 1 }];
  const randomProfile = validProfiles[Math.floor(Math.random() * validProfiles.length)];
  return portContext.run(randomProfile.port, () => generateImageWithGeminiChat_Internal(options));
}

export async function generateBatchImagesWithGoogleLabs(items: BatchImageItem[], visualConfig: any, style?: string, onProgress?: (result: BatchImageResult) => void): Promise<BatchImageResult[]> {
  const profileConfig = (visualConfig as any)?.chromeProfiles;
  const profiles = (profileConfig?.enabled && profileConfig?.profiles?.length > 0)
    ? profileConfig.profiles.filter((p: any) => p.active)
    : [{ port: 9222, concurrency: visualConfig?.threadCount || 1 }];
  if (profiles.length === 0) profiles.push({ port: 9222, concurrency: visualConfig?.threadCount || 1 });

  const chunkedItems: BatchImageItem[][] = Array.from({ length: profiles.length }, () => []);
  items.forEach((item, index) => {
    chunkedItems[index % profiles.length].push(item);
  });

  const promises = profiles.map((profile: any, index: number) => {
    const profileItems = chunkedItems[index];
    if (profileItems.length === 0) return Promise.resolve([]);
    const pVisualConfig = { ...visualConfig, threadCount: profile.concurrency };
    return portContext.run(profile.port, () => generateBatchImagesWithGoogleLabs_Internal(profileItems, pVisualConfig, style, onProgress));
  });

  const results = await Promise.all(promises);
  return results.flat();
}

export async function generateBatchImagesWithGeminiChat(items: BatchImageItem[], visualConfig: any, style?: string, onProgress?: (result: BatchImageResult) => void): Promise<BatchImageResult[]> {
  const profileConfig = (visualConfig as any)?.chromeProfiles;
  const profiles = (profileConfig?.enabled && profileConfig?.profiles?.length > 0)
    ? profileConfig.profiles.filter((p: any) => p.active)
    : [{ port: 9222, concurrency: visualConfig?.threadCount || 1 }];
  if (profiles.length === 0) profiles.push({ port: 9222, concurrency: visualConfig?.threadCount || 1 });

  const chunkedItems: BatchImageItem[][] = Array.from({ length: profiles.length }, () => []);
  items.forEach((item, index) => {
    chunkedItems[index % profiles.length].push(item);
  });

  const promises = profiles.map((profile: any, index: number) => {
    const profileItems = chunkedItems[index];
    if (profileItems.length === 0) return Promise.resolve([]);
    const pVisualConfig = { ...visualConfig, threadCount: profile.concurrency };
    return portContext.run(profile.port, () => generateBatchImagesWithGeminiChat_Internal(profileItems, pVisualConfig, style, onProgress));
  });

  const results = await Promise.all(promises);
  return results.flat();
}
`;

content += wrappers;

fs.writeFileSync(filePath, content, 'utf8');
console.log('Safe refactor v4 applied!');
