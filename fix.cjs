const fs = require('fs');
let code = fs.readFileSync('src/server/services/imageGeneratorService.ts', 'utf8');

const targetStart = '    if (isVideo) {';
const targetEnd = '  const headers = {';

const startIndex = code.indexOf(targetStart);
const endIndex = code.indexOf(targetEnd);

const replacement = `    if (isVideo) {
      let vq = visualConfig?.viettheoVideoQuality || 'HIGH';
      if ((visualConfig?.aspectRatio === '9:16' || visualConfig?.aspectRatio === '1:1') && !visualConfig?.viettheoVideoQuality) {
        vq = 'LITE';
      }
      payload.config.videoQuality = vq;
      payload.config.video_mode = visualConfig?.viettheoVideoMode || 'frame';

      const globalRefImages = visualConfig?.globalReferenceImages || [];
      if (globalRefImages.length > 1) {
        payload.referenceimages = globalRefImages.slice(0, 3);
        payload.config.video_mode = 'component';
      } else if (referenceImage) {
        payload.startImage = referenceImage;
      } else if (globalRefImages.length > 0) {
        payload.startImage = globalRefImages[0];
      } else if (autoStartImage) {
        payload.startImage = autoStartImage;
      }
    } else {
      const apiModel = model === 'NANO_BANANA_PRO' || model === 'NANO_BANANA' ? model : 'NANO_BANANA_PRO';
      payload.config.imageModel = apiModel;
      
      const globalRefImages = visualConfig?.globalReferenceImages || [];
      if (referenceImage) {
        payload.referenceImage = referenceImage;
      } else if (globalRefImages.length > 0) {
        payload.referenceImage = globalRefImages[0];
      }
    }
  }

`;

code = code.substring(0, startIndex) + replacement + code.substring(endIndex);
fs.writeFileSync('src/server/services/imageGeneratorService.ts', code, 'utf8');
console.log('Fixed imageGeneratorService.ts');
