import { appLog, appError, createAppError } from "./logger";
import { STORAGE_KEYS, LOG_ERROR_SYMBOLS, LOG_WARN_SYMBOLS } from "../constants";
import { BatchDelayOption } from "../types";
import _ from 'lodash';


export const getStoredApiKey = (keyName: typeof STORAGE_KEYS.GEMINI_API_KEY | typeof STORAGE_KEYS.AI33_API_KEY): string => {
  if (!_.eq(typeof window, "undefined")) {
    return window.localStorage.getItem(keyName) || "";
  }
  return "";
};

export const safeSystemFetch = async (url: string, payload: any) => {
  try {
    const geminiKey = getStoredApiKey("GEMINI_API_KEY");
    const ai33Key = getStoredApiKey("AI33_API_KEY");

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-gemini-api-key": geminiKey,
        "x-ai33-api-key": ai33Key,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => null);

    if (!_.isNil(data) && _.isArray(data.rotationLogs)) {
      _.forEach(data.rotationLogs, (log: string) => {
        if (_.some(LOG_ERROR_SYMBOLS, (sym) => _.includes(log, sym))) appError(log);
        else if (_.some(LOG_WARN_SYMBOLS, (sym) => _.includes(log, sym))) appLog(log);
        else appLog(log);
      });
    }

    if (_.eq(response.ok, false)) {
      throw createAppError(data?.error || `API Error: ${response.status}`);
    }

    return { success: true, data };
  } catch (error: any) {
    appError("SYSTEM_FLOW_ERROR", url, error);
    return { success: false, error: error.message };
  }
};

export const delayAsync = (ms: number) => new Promise((res) => setTimeout(res, ms));

export const randomDelay = (min: number = 1000, max: number = 2000): Promise<number> => {
  const ms = _.floor(_.add(_.multiply(Math.random(), _.add(_.subtract(max, min), 1)), min));
  return new Promise((resolve) => setTimeout(() => resolve(ms), ms));
};

export const logSystemAction = (actionName: string) => {
  appLog("SYSTEM_ACTION_START", actionName);
};

export const getBatchDelayMs = (option?: BatchDelayOption | string): number => {
  const opt = (option || BatchDelayOption.Default) as BatchDelayOption;
  if (_.eq(opt, BatchDelayOption.OneSecond)) return 1000;
  if (_.eq(opt, BatchDelayOption.TwoSeconds)) return 2000;
  if (_.eq(opt, BatchDelayOption.ThreeSeconds)) return 3000;
  if (_.eq(opt, BatchDelayOption.Random123)) {
    return _.sample([1000, 2000, 3000]) || 1000;
  }
  return _.add(_.floor(_.multiply(Math.random(), 1001)), 1000);
};
