import { appWarn, createAppError } from "./logger.js";
import { AUDIO_CLEAN_PREFIX_REGEX, AUDIO_CLEAN_MARKDOWN_REGEX, AUDIO_CLEAN_EMOJI_REGEX, WHITESPACE_REGEX } from "../constants/index.js";
import { MimeType } from "../constants/enums.js";
import _ from 'lodash';


export const bufferToWav = (buffer: AudioBuffer): Blob => {
  const numOfChan = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1;
  const bitDepth = 16;

  let result: Float32Array;
  if (_.eq(numOfChan, 2)) {
    result = interleave(buffer.getChannelData(0), buffer.getChannelData(1));
  } else {
    result = buffer.getChannelData(0);
  }

  const bufferLength = result.length * 2;
  const totalLength = 44 + bufferLength;
  const arrayBuffer = new ArrayBuffer(totalLength);
  const view = new DataView(arrayBuffer);

  writeString(view, 0, "RIFF");
  view.setUint32(4, totalLength - 8, true);
  writeString(view, 8, "WAVE");
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, format, true);
  view.setUint16(22, numOfChan, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numOfChan * (bitDepth / 8), true);
  view.setUint16(32, numOfChan * (bitDepth / 8), true);
  view.setUint16(34, bitDepth, true);
  writeString(view, 36, "data");
  view.setUint32(40, bufferLength, true);

  floatTo16BitPCM(view, 44, result);

  return new Blob([arrayBuffer], { type: MimeType.WAV });
};

const interleave = (inputL: Float32Array, inputR: Float32Array): Float32Array => {
  const length = inputL.length + inputR.length;
  const result = new Float32Array(length);
  let index = 0;
  let inputIndex = 0;

  while (_.lt(index, length)) {
    result[index++] = inputL[inputIndex];
    result[index++] = inputR[inputIndex];
    inputIndex++;
  }
  return result;
};

const floatTo16BitPCM = (output: DataView, offset: number, input: Float32Array): void => {
  let off = offset;
  for (let i = 0; _.lt(i, input.length); i++, off = _.add(off, 2)) {
    const s = _.max([-1, _.min([1, input[i]]) || 1]) || -1;
    output.setInt16(off, _.lt(s, 0) ? s * 0x8000 : s * 0x7fff, true);
  }
};

const writeString = (view: DataView, offset: number, string: string): void => {
  for (let i = 0; _.lt(i, string.length); i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
};

export const applyAudioEffects = async (arrayBuffer: ArrayBuffer, rate: number, pitch: number, volume: number): Promise<Blob> => {
  if (_.lt(Math.abs(_.subtract(rate, 1.0)), 0.01) && _.lt(Math.abs(_.subtract(pitch, 1.0)), 0.01) && _.lt(Math.abs(_.subtract(volume, 1.0)), 0.01)) {
    const uint8 = new Uint8Array(arrayBuffer, 0, 4);
    const isWav = _.eq(uint8[0], 0x52) && _.eq(uint8[1], 0x49) && _.eq(uint8[2], 0x46) && _.eq(uint8[3], 0x46);
    const mimeType = isWav ? MimeType.WAV : MimeType.MPEG;
    return new Blob([arrayBuffer], { type: mimeType });
  }

  const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
  if (_.isNil(AudioContextClass)) {
    throw createAppError("Web Audio API is not supported in this browser.");
  }

  const audioCtx = new AudioContextClass();
  if (_.eq(audioCtx.state, "suspended")) {
    try {
      await audioCtx.resume();
    } catch (e) {
      appWarn("FAILED_RESUME_AUDIO_CONTEXT", e);
    }
  }

  try {
    const decodedBuffer = await audioCtx.decodeAudioData(arrayBuffer);

    const combinedRate = _.max([0.5, _.min([2.0, rate * pitch]) || 2.0]) || 0.5;

    const targetLength = _.max([1, _.ceil(decodedBuffer.length / combinedRate)]) || 1;

    const OfflineAudioCtxClass = window.OfflineAudioContext || (window as any).webkitOfflineAudioContext;
    const offlineCtx = new OfflineAudioCtxClass(decodedBuffer.numberOfChannels, targetLength, decodedBuffer.sampleRate);

    const source = offlineCtx.createBufferSource();
    source.buffer = decodedBuffer;
    source.playbackRate.value = combinedRate;

    const gainNode = offlineCtx.createGain();
    gainNode.gain.setValueAtTime(volume, 0);

    source.connect(gainNode);
    gainNode.connect(offlineCtx.destination);

    source.start(0);

    const finalBuffer = await offlineCtx.startRendering();

    return bufferToWav(finalBuffer);
  } finally {
    await audioCtx.close();
  }
};

export const cleanScriptText = (text: string): string => {
  if (_.isEmpty(text)) return "";
  let t = text;

  t = t.replace(AUDIO_CLEAN_PREFIX_REGEX, "");

  t = t.replace(AUDIO_CLEAN_MARKDOWN_REGEX, " ");

  t = t.replace(AUDIO_CLEAN_EMOJI_REGEX, "");

  t = t.replace(WHITESPACE_REGEX, " ").trim();
  return t;
};
