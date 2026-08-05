import { createAppError } from "./logger.js";
import _ from 'lodash';


export const base64ToArrayBuffer = (base64: string): ArrayBuffer => {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; _.lt(i, len); i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
};

export const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (_.isString(reader.result)) {
        const base64 = reader.result.split(",")[1];
        if (!_.isEmpty(base64)) {
          resolve(base64);
        } else {
          resolve(reader.result);
        }
      } else {
        reject(createAppError("File read error"));
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
};
