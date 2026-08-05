import { LogLang, getFriendlyActionName, LOG_DICTIONARY, LogKey } from "../constants";

let currentLang: LogLang = "vi";

export const setLogLanguage = (lang: LogLang) => {
  currentLang = lang;
};

export const getLogLanguage = (): LogLang => {
  return currentLang;
};

export const formatLogMessage = (template: string, ...args: any[]): string => {
  let result = template;
  args.forEach((arg, index) => {
    const val = arg !== undefined && arg !== null ? String(arg) : "";
    result = result.split(`{${index}}`).join(val);
  });
  return result;
};

export const getMessage = (key: LogKey | string, lang?: LogLang, ...args: any[]): string => {
  const dictionaryKey = key as LogKey;
  if (LOG_DICTIONARY[dictionaryKey]) {
    const activeLang = lang || currentLang;
    const template = LOG_DICTIONARY[dictionaryKey][activeLang] || LOG_DICTIONARY[dictionaryKey]["en"];

    if (dictionaryKey === "SYSTEM_ACTION_START" && args.length > 0) {
      const friendlyAction = getFriendlyActionName(args[0], activeLang);
      return formatLogMessage(template, friendlyAction);
    }

    return formatLogMessage(template, ...args);
  }
  return formatLogMessage(String(key), ...args);
};

export const getBilingualMessage = (key: LogKey | string, ...args: any[]): string => {
  const dictionaryKey = key as LogKey;
  if (LOG_DICTIONARY[dictionaryKey]) {
    if (dictionaryKey === "SYSTEM_ACTION_START" && args.length > 0) {
      const viMsg = formatLogMessage(LOG_DICTIONARY[dictionaryKey]["vi"], getFriendlyActionName(args[0], "vi"));
      const enMsg = formatLogMessage(LOG_DICTIONARY[dictionaryKey]["en"], getFriendlyActionName(args[0], "en"));
      if (viMsg === enMsg) return viMsg;
      return `${viMsg} | ${enMsg}`;
    }

    const viMsg = formatLogMessage(LOG_DICTIONARY[dictionaryKey]["vi"], ...args);
    const enMsg = formatLogMessage(LOG_DICTIONARY[dictionaryKey]["en"], ...args);
    if (viMsg === enMsg) return viMsg;
    return `${viMsg} | ${enMsg}`;
  }
  return formatLogMessage(String(key), ...args);
};

export const logger = {
  log: (key: LogKey | string, ...args: any[]) => {
    if (typeof window === "undefined") {
      console.log(getBilingualMessage(key, ...args));
    } else {
      console.log(getMessage(key, undefined, ...args));
    }
  },
  info: (key: LogKey | string, ...args: any[]) => {
    if (typeof window === "undefined") {
      console.info(getBilingualMessage(key, ...args));
    } else {
      console.info(getMessage(key, undefined, ...args));
    }
  },
  warn: (key: LogKey | string, ...args: any[]) => {
    if (typeof window === "undefined") {
      console.warn(getBilingualMessage(key, ...args));
    } else {
      console.warn(getMessage(key, undefined, ...args));
    }
  },
  error: (key: LogKey | string, ...args: any[]) => {
    if (typeof window === "undefined") {
      console.error(getBilingualMessage(key, ...args));
    } else {
      console.error(getMessage(key, undefined, ...args));
    }
  },

  logVi: (key: LogKey | string, ...args: any[]) => {
    console.log(getMessage(key, "vi", ...args));
  },

  logEn: (key: LogKey | string, ...args: any[]) => {
    console.log(getMessage(key, "en", ...args));
  },
};

export const appLog = (keyOrMessage: LogKey | string, ...args: any[]): void => {
  logger.log(keyOrMessage, ...args);
};

export const appError = (keyOrMessage: LogKey | string, ...args: any[]): void => {
  logger.error(keyOrMessage, ...args);
};

export const appWarn = (keyOrMessage: LogKey | string, ...args: any[]): void => {
  logger.warn(keyOrMessage, ...args);
};

export const appLogStep = (message: string, logsArray?: string[]): void => {
  appLog(message);
  if (logsArray && Array.isArray(logsArray)) {
    logsArray.push(message);
  }
};

export const createAppError = (keyOrMessage: LogKey | string, ...args: any[]): Error => {
  const errMsg = typeof keyOrMessage === "string" && LOG_DICTIONARY[keyOrMessage as LogKey] ? getMessage(keyOrMessage, undefined, ...args) : formatLogMessage(String(keyOrMessage), ...args);

  appError(errMsg);
  return new Error(errMsg);
};
