import { appLog } from '../../lib/logger.js';

/**
 * Uploads a base64 image or video to catbox.moe and returns the public URL.
 * Catbox.moe allows up to 200MB anonymous uploads.
 * 
 * @param base64Data The base64 string (can include data URI prefix)
 * @param filename The desired filename with extension
 * @returns The public URL string
 */
export async function uploadToCatbox(base64Data: string, filename: string = 'image.png'): Promise<string> {
  try {
    // 1. Remove the data URI prefix if it exists
    let mimeType = 'image/png';
    const match = base64Data.match(/^data:(.*?);base64,/);
    if (match) {
      mimeType = match[1];
    }
    const base64Clean = base64Data.replace(/^data:(.*?);base64,/, '');
    
    // Use Node's native fetch, FormData and Blob as one set. Mixing node-fetch
    // with native FormData can produce malformed multipart bodies on Catbox.
    const buffer = Buffer.from(base64Clean, 'base64');
    if (!buffer.length) throw new Error('Reference image is empty.');

    let lastError = '';
    for (let attempt = 1; attempt <= 2; attempt++) {
      const form = new FormData();
      form.append('reqtype', 'fileupload');
      form.append('fileToUpload', new Blob([buffer], { type: mimeType }), filename);
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 25_000);
      try {
        appLog(`[Catbox] Uploading reference (${buffer.length} bytes), attempt ${attempt}/2...`);
        const res = await fetch('https://catbox.moe/user/api.php', {
          method: 'POST', body: form, signal: controller.signal,
        });
        const text = (await res.text()).trim();
        if (res.ok && /^https?:\/\//i.test(text)) {
          appLog(`[Catbox] Upload successful: ${text}`);
          return text;
        }
        lastError = `Catbox API error: ${res.status} ${text}`;
      } finally {
        clearTimeout(timeout);
      }
    }
    throw new Error(lastError || 'Catbox did not return a public image URL.');
  } catch (error: any) {
    appLog(`[Catbox] Upload failed: ${error.message}`);
    return ''; // Return empty string on failure
  }
}
