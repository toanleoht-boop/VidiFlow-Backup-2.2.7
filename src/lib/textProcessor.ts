import { AspectRatio } from "../types.js";
import { SCENE_SPLIT_PROMPTS } from "../constants/texts.js";
import { SCENE_SPLIT_MOTIONS, SCENE_SPLIT_TRANSITIONS } from "../constants/data.js";
import { formatTimeHelper as formatTime } from "../lib/timeUtils.js";
import {
  ABBREVIATIONS,
  CONJUNCTIONS,
  boundaries,
  VIETNAMESE_VALID_CHARS_REGEX,
  SplitStrategy,
  TEXT_PROCESSOR_CONFIGS,
  STRATEGY_WORDS_LIMITS,
  STRATEGY_SENTENCE_CHUNKS,
  LAST_WORD_IN_SENTENCE_REGEX,
  SENTENCE_PUNCTUATION_END_REGEX,
  DIGIT_REGEX,
  ENDS_WITH_DIGIT_REGEX,
  STARTS_WITH_DIGIT_REGEX,
  DEFAULT_STYLE,
  DEFAULT_CHAPTER,
  MIN_PARAGRAPHS_COUNT,
  NEWLINE_CHAR,
  SPACE_CHAR,
  SINGLE_WHITESPACE_REGEX,
  MULTIPLE_NEWLINES_REGEX,
  WHITESPACE_REGEX,
} from "../constants/index.js";
import _ from "lodash";

interface SegmentWithContext {
  text: string;
  context: string;
}

export const smartChunkScript = (
  script: string,
  maxChunkSize: number = TEXT_PROCESSOR_CONFIGS.MAX_CHUNK_SIZE,
  minChunkSize: number = TEXT_PROCESSOR_CONFIGS.MIN_CHUNK_SIZE
): string[] => {
  if (_.isEmpty(_.trim(script))) return [];
  if (_.lte(script.length, maxChunkSize)) return [_.trim(script)];

  const chunks: string[] = [];
  let currentIdx = 0;

  while (_.lt(currentIdx, script.length)) {
    let endIdx = _.add(currentIdx, maxChunkSize);

    if (_.gte(endIdx, script.length)) {
      const finalChunk = _.trim(script.slice(currentIdx));
      if (!_.isEmpty(finalChunk)) chunks.push(finalChunk);
      break;
    }

    let cutPoint = endIdx;
    let foundBoundary = false;

    for (let i = endIdx; _.gt(i, _.add(currentIdx, minChunkSize)); i--) {
      if (_.includes(boundaries, script[i])) {
        cutPoint = _.add(i, 1);
        foundBoundary = true;
        break;
      }
    }

    if (_.eq(foundBoundary, false)) {
      for (let i = endIdx; _.gt(i, currentIdx); i--) {
        if (_.eq(script[i], " ")) {
          cutPoint = i;
          break;
        }
      }
    }

    const chunkVal = _.trim(script.slice(currentIdx, cutPoint));
    if (!_.isEmpty(chunkVal)) {
      chunks.push(chunkVal);
    }

    currentIdx = cutPoint;
  }

  return chunks;
};

export const smartSplitSentences = (text: string): string[] => {
  if (_.isEmpty(text)) return [];
  const sentences: string[] = [];
  let currentSentence = "";

  for (let i = 0; _.lt(i, text.length); i++) {
    const char = text[i];
    currentSentence += char;

    if (_.includes(boundaries, char)) {
      if (_.eq(char, ".")) {
        if (
          _.gt(i, 0) &&
          _.lt(i, _.subtract(text.length, 1)) &&
          DIGIT_REGEX.test(text[i - 1]) &&
          DIGIT_REGEX.test(text[i + 1])
        ) {
          continue;
        }

        const lastWordMatch = currentSentence.slice(0, -1).match(LAST_WORD_IN_SENTENCE_REGEX);
        if (!_.isNil(lastWordMatch)) {
          const lastWord = _.toLower(lastWordMatch[1]);
          if (_.includes(ABBREVIATIONS, lastWord)) {
            continue;
          }
        }
      }

      if (_.eq(char, NEWLINE_CHAR) || _.eq(i, _.subtract(text.length, 1)) || SINGLE_WHITESPACE_REGEX.test(text[i + 1])) {
        const trimmed = _.trim(currentSentence);
        if (!_.isEmpty(trimmed)) {
          sentences.push(trimmed);
        }
        currentSentence = "";
      }
    }
  }

  if (!_.isEmpty(_.trim(currentSentence))) {
    sentences.push(_.trim(currentSentence));
  }

  return sentences;
};

export const splitSentenceSafely = (
  sent: string,
  maxWords: number = TEXT_PROCESSOR_CONFIGS.DEFAULT_MAX_WORDS_SAFE
): string[] => {
  const safeMaxWords = _.max([TEXT_PROCESSOR_CONFIGS.DEFAULT_MAX_WORDS_SAFE, maxWords]) || TEXT_PROCESSOR_CONFIGS.DEFAULT_MAX_WORDS_SAFE;
  const words = _.compact(_.split(sent, WHITESPACE_REGEX));
  if (_.lte(words.length, safeMaxWords)) {
    return [sent];
  }

  const len = words.length;
  const startIdx = _.floor(len * TEXT_PROCESSOR_CONFIGS.SENTENCE_SPLIT_MIN_RATIO);
  const endIdx = _.ceil(len * TEXT_PROCESSOR_CONFIGS.SENTENCE_SPLIT_MAX_RATIO);

  for (let i = startIdx; _.lte(i, endIdx); i++) {
    const word = words[i];
    if (SENTENCE_PUNCTUATION_END_REGEX.test(word)) {
      if (_.endsWith(word, ".")) {
        const cleanWord = _.toLower(word.slice(0, -1)).replace(VIETNAMESE_VALID_CHARS_REGEX, "");
        if (_.includes(ABBREVIATIONS, cleanWord)) {
          continue;
        }
        if (ENDS_WITH_DIGIT_REGEX.test(cleanWord) && _.lt(i, _.subtract(len, 1)) && STARTS_WITH_DIGIT_REGEX.test(words[i + 1])) {
          continue;
        }
      }

      const part1 = _.join(_.slice(words, 0, _.add(i, 1)), SPACE_CHAR);
      const part2 = _.join(_.slice(words, _.add(i, 1)), SPACE_CHAR);
      return _.concat(splitSentenceSafely(part1, safeMaxWords), splitSentenceSafely(part2, safeMaxWords));
    }
  }

  for (let i = startIdx; _.lte(i, endIdx); i++) {
    const word = _.toLower(words[i]).replace(VIETNAMESE_VALID_CHARS_REGEX, "");
    if (_.includes(CONJUNCTIONS, word)) {
      const part1 = _.join(_.slice(words, 0, i), SPACE_CHAR);
      const part2 = _.join(_.slice(words, i), SPACE_CHAR);
      return _.concat(splitSentenceSafely(part1, safeMaxWords), splitSentenceSafely(part2, safeMaxWords));
    }
  }

  const mid = _.ceil(len / 2);
  const part1 = _.join(_.slice(words, 0, mid), SPACE_CHAR);
  const part2 = _.join(_.slice(words, mid), SPACE_CHAR);
  return _.concat(splitSentenceSafely(part1, safeMaxWords), splitSentenceSafely(part2, safeMaxWords));
};

export function generateMockStoryboard(
  rewrittenScript: string,
  chapters: any[],
  isVi: boolean,
  style: string,
  density: number,
  voiceDuration?: number,
  splitStrategy?: string,
  aspectRatio: string = AspectRatio.SixteenNine
) {
  const defaultStrategy = (text: string) => {
    const sentences = smartSplitSentences(text || "");
    return _.map(sentences, (sent) => ({ text: sent, context: sent }));
  };

  const getWordSplitStrategy = (limit: number) => (text: string): SegmentWithContext[] => {
    const res: SegmentWithContext[] = [];
    const sents = smartSplitSentences(text);
    _.forEach(sents, (sent) => {
      const clauses = splitSentenceSafely(sent, limit);
      _.forEach(clauses, (clause) => res.push({ text: clause, context: sent }));
    });
    return res;
  };

  const getSentenceChunkStrategy = (chunkSize: number) => (text: string): SegmentWithContext[] => {
    const res: SegmentWithContext[] = [];
    const sentences = smartSplitSentences(text);
    _.forEach(_.chunk(sentences, chunkSize), (batch) => {
      const chunkText = _.join(batch, ". ");
      res.push({ text: chunkText, context: chunkText });
    });
    return res;
  };

  const SLICE_STRATEGIES: Record<string, (text: string) => SegmentWithContext[]> = {
    [SplitStrategy.MIXED_SENTENCES]: getWordSplitStrategy(STRATEGY_WORDS_LIMITS.mixed_sentences),
    [SplitStrategy.ULTRADENSE]: getWordSplitStrategy(STRATEGY_WORDS_LIMITS.ultradense),
    [SplitStrategy.WORD]: getWordSplitStrategy(STRATEGY_WORDS_LIMITS.word),
    [SplitStrategy.HYPERDENSE]: getWordSplitStrategy(STRATEGY_WORDS_LIMITS.hyperdense),
    [SplitStrategy.SHORT_SENTENCE]: getWordSplitStrategy(STRATEGY_WORDS_LIMITS.short_sentence),
    [SplitStrategy.HIGHPACED]: getWordSplitStrategy(STRATEGY_WORDS_LIMITS.highpaced),

    [SplitStrategy.DRAMATIC]: getSentenceChunkStrategy(STRATEGY_SENTENCE_CHUNKS.dramatic),
    [SplitStrategy.EPIC]: getSentenceChunkStrategy(STRATEGY_SENTENCE_CHUNKS.epic),
    [SplitStrategy.CINEMATIC]: getSentenceChunkStrategy(STRATEGY_SENTENCE_CHUNKS.cinematic),
    [SplitStrategy.ARTISTIC]: getSentenceChunkStrategy(STRATEGY_SENTENCE_CHUNKS.artistic),
    [SplitStrategy.SLOWPACED]: getSentenceChunkStrategy(STRATEGY_SENTENCE_CHUNKS.slowpaced),
    [SplitStrategy.SUPER_SLOW]: getSentenceChunkStrategy(STRATEGY_SENTENCE_CHUNKS.super_slow),

    [SplitStrategy.PARAGRAPH]: (text) => {
      const res: SegmentWithContext[] = [];
      const paragraphs = _.filter(
        _.map(_.split(text || "", MULTIPLE_NEWLINES_REGEX), _.trim),
        (p) => _.gt(p.length, TEXT_PROCESSOR_CONFIGS.MIN_PARAGRAPH_LENGTH)
      );
      _.forEach(paragraphs, (para) => res.push({ text: para, context: para }));
      if (_.lt(res.length, MIN_PARAGRAPHS_COUNT)) {
        return getSentenceChunkStrategy(STRATEGY_SENTENCE_CHUNKS.paragraph)(text);
      }
      return res;
    },
  };

  const pList: SegmentWithContext[] = (SLICE_STRATEGIES[splitStrategy || ""] || defaultStrategy)(rewrittenScript || "");
  const totalWords = _.sumBy(pList, (p) => _.compact(_.split(p.text, /\s+/)).length);
  const maxScenes = TEXT_PROCESSOR_CONFIGS.MAX_SCENES_LIMIT;
  const scenesCount = _.min([maxScenes, _.gt(pList.length, 0) ? pList.length : TEXT_PROCESSOR_CONFIGS.DEFAULT_FALLBACK_SCENES_COUNT]) || TEXT_PROCESSOR_CONFIGS.DEFAULT_FALLBACK_SCENES_COUNT;
  const scenes: any[] = [];
  let currentTime = 0;

  const styleStr = style || DEFAULT_STYLE;
  const defaultChapters = !_.isEmpty(chapters) ? chapters : [{ id: DEFAULT_CHAPTER.id, title: isVi ? DEFAULT_CHAPTER.titleVi : DEFAULT_CHAPTER.titleEn }];
  const promptConfig = isVi ? SCENE_SPLIT_PROMPTS.VN : SCENE_SPLIT_PROMPTS.EN;

  for (let i = 0; _.lt(i, scenesCount); i++) {
    const chapter = defaultChapters[i % defaultChapters.length];
    const segment = pList[i];
    const scriptText = segment ? segment.text : promptConfig.DEFAULT_SCRIPT(_.add(i, 1));
    const contextText = segment ? segment.context : scriptText;

    const wordsCount = _.compact(_.split(scriptText, /\s+/)).length;
    let duration: number = TEXT_PROCESSOR_CONFIGS.DEFAULT_SCENE_DURATION;
    if (voiceDuration && _.gt(totalWords, 0)) {
      duration = _.round((wordsCount / totalWords) * voiceDuration);
      if (_.lt(duration, TEXT_PROCESSOR_CONFIGS.MIN_LAST_SCENE_DURATION)) {
        duration = TEXT_PROCESSOR_CONFIGS.MIN_LAST_SCENE_DURATION;
      }
    } else {
      duration =
        _.max([
          TEXT_PROCESSOR_CONFIGS.MIN_SCENE_DURATION,
          _.min([
            TEXT_PROCESSOR_CONFIGS.MAX_SCENE_DURATION,
            _.ceil(wordsCount / TEXT_PROCESSOR_CONFIGS.WORDS_PER_SECOND_RATIO),
          ]) || TEXT_PROCESSOR_CONFIGS.MAX_SCENE_DURATION,
        ]) || TEXT_PROCESSOR_CONFIGS.MIN_SCENE_DURATION;
    }

    if (voiceDuration && _.eq(i, _.subtract(scenesCount, 1))) {
      duration = _.max([TEXT_PROCESSOR_CONFIGS.MIN_LAST_SCENE_DURATION, _.subtract(voiceDuration, currentTime)]) || TEXT_PROCESSOR_CONFIGS.MIN_LAST_SCENE_DURATION;
    }

    const startTimeSeconds = currentTime;
    const endTimeSeconds = _.add(currentTime, duration);
    currentTime = endTimeSeconds;

    const motion = SCENE_SPLIT_MOTIONS[i % SCENE_SPLIT_MOTIONS.length];
    const effects = promptConfig.EFFECTS(styleStr);
    const transition = SCENE_SPLIT_TRANSITIONS[i % SCENE_SPLIT_TRANSITIONS.length];

    scenes.push({
      id: `sc_${_.add(i, 1)}`,
      chapterId: chapter.id,
      startTime: formatTime(startTimeSeconds),
      endTime: formatTime(endTimeSeconds),
      duration,
      script: scriptText,
      subtitle: scriptText,
      prompt: promptConfig.PROMPT(contextText, styleStr, aspectRatio),
      cameraMotion: motion,
      effects,
      transition,
    });
  }

  return { scenes };
}
