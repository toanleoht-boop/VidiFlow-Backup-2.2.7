const fs = require('fs');

let content = fs.readFileSync('src/server/services/imageGeneratorService.ts', 'utf8');

// 1. Update imports
content = content.replace(/import \{ globalPlaywrightPage,/g, 'import { getPlaywrightPage, portContext,');

// 2. Replace Mutex definition
const mutexRegex = /export class SimpleMutex \{[\s\S]*?export const imageGenMutex = new SimpleMutex\(\);/;
const profileManagerCode = `export class ProfileManager {
  private activeCounts = new Map<number, number>();
  private queue: { resolve: (port: number) => void, configs: any[] }[] = [];

  async acquire(profilesConfig?: any): Promise<{ port: number, release: () => void }> {
    const profiles = (profilesConfig?.enabled && profilesConfig?.profiles?.length > 0) 
      ? profilesConfig.profiles.filter((p: any) => p.active)
      : [{ port: 9222, concurrency: 1 }];
      
    if (profiles.length === 0) profiles.push({ port: 9222, concurrency: 1 });

    const tryAcquire = () => {
      for (const p of profiles) {
        const count = this.activeCounts.get(p.port) || 0;
        if (count < p.concurrency) {
          this.activeCounts.set(p.port, count + 1);
          return p.port;
        }
      }
      return null;
    };

    let port = tryAcquire();
    if (port !== null) {
      return { port, release: () => this.release(port as number) };
    }

    return new Promise((resolve) => {
      this.queue.push({ resolve, configs: profiles });
    }).then((p: any) => ({
      port: p,
      release: () => this.release(p)
    }));
  }

  private release(port: number) {
    const count = this.activeCounts.get(port) || 0;
    this.activeCounts.set(port, Math.max(0, count - 1));

    for (let i = 0; i < this.queue.length; i++) {
      const item = this.queue[i];
      const matchingProfile = item.configs.find((c: any) => c.port === port);
      if (matchingProfile) {
        const newCount = this.activeCounts.get(port) || 0;
        if (newCount < matchingProfile.concurrency) {
          this.activeCounts.set(port, newCount + 1);
          this.queue.splice(i, 1);
          item.resolve(port);
          return;
        }
      }
    }
  }
}

export const profileManager = new ProfileManager();`;

content = content.replace(mutexRegex, profileManagerCode);

// 3. Update ImageGeneratorOptions
content = content.replace(/referenceImage\?: string;\n\}/g, 'referenceImage?: string;\n  chromeProfiles?: any;\n}');

// 4. Wrap function bodies
function wrapFunction(funcName) {
  const startIdx = content.indexOf("export async function " + funcName);
  if (startIdx === -1) return;
  
  // Find the acquire statement
  const acquireStr = 'const release = await imageGenMutex.acquire();';
  const acquireIdx = content.indexOf(acquireStr, startIdx);
  if (acquireIdx === -1) return;
  
  // Replace acquire with new logic
  const wrapperStart = "const __profileConfig = (typeof options !== 'undefined' ? options.chromeProfiles : undefined) || (typeof visualConfig !== 'undefined' ? (visualConfig as any).chromeProfiles : undefined);\n" +
  "  const { port, release } = await profileManager.acquire(__profileConfig);\n" +
  "  return await portContext.run(port, async () => {";
  
  content = content.substring(0, acquireIdx) + wrapperStart + content.substring(acquireIdx + acquireStr.length);
  
  // Find the end of the function by counting braces
  let braceCount = 0;
  let inFunction = false;
  let endIdx = -1;
  
  for (let i = startIdx; i < content.length; i++) {
    if (content[i] === '{') {
      braceCount++;
      inFunction = true;
    } else if (content[i] === '}') {
      braceCount--;
      if (inFunction && braceCount === 0) {
        endIdx = i;
        break;
      }
    }
  }
  
  if (endIdx !== -1) {
    // Insert '});' right before the final '}'
    content = content.substring(0, endIdx) + '});\n' + content.substring(endIdx);
  }
}

wrapFunction('generateImageWithPlaywright');
wrapFunction('generateImageWithGeminiChat');
wrapFunction('generateBatchImagesWithGoogleLabs');
wrapFunction('generateBatchImagesWithGeminiChat');

// 6. Replace globalPlaywrightPage with getPlaywrightPage()
content = content.replace(/globalPlaywrightPage/g, 'getPlaywrightPage()');
content = content.replace(/getPlaywrightPage\(\)\.isClosed/g, '(getPlaywrightPage()?.isClosed || (() => false))');
content = content.replace(/!getPlaywrightPage\(\)/g, '!getPlaywrightPage()');

fs.writeFileSync('src/server/services/imageGeneratorService.ts', content, 'utf8');
console.log('Refactor script written!');
