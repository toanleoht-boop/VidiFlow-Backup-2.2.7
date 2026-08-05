import { SceneDensity } from "./enums.js";

export interface SplitStrategyConfig {
  density: SceneDensity;
  instruction: string;
}

export const SPLIT_STRATEGY_CONFIGS: Record<string, SplitStrategyConfig> = {
  ultradense: {
    density: SceneDensity.THEO_TU,
    instruction: `CRITICAL SPLITTING MANDATE: Divide the script into short scenes corresponding to spoken phrases or clauses. MANDATORY SEMANTIC INTEGRITY: Regardless of density, every single scene's script/narration MUST be a grammatically complete, semantically meaningful clause or sentence (containing a clear subject and verb/predicate, expressing a complete thought). Do NOT split sentences into meaningless fragments, individual words, or tiny dangling phrases (e.g., do NOT output 'and then', 'she is', 'in the', 'however'). Each scene's narration must stand alone as a coherent statement so that the generated image perfectly matches the scene.`,
  },
  word: {
    density: SceneDensity.THEO_TU,
    instruction: `CRITICAL SPLITTING MANDATE: Divide the script into short scenes corresponding to spoken phrases or clauses. MANDATORY SEMANTIC INTEGRITY: Regardless of density, every single scene's script/narration MUST be a grammatically complete, semantically meaningful clause or sentence (containing a clear subject and verb/predicate, expressing a complete thought). Do NOT split sentences into meaningless fragments, individual words, or tiny dangling phrases (e.g., do NOT output 'and then', 'she is', 'in the', 'however'). Each scene's narration must stand alone as a coherent statement so that the generated image perfectly matches the scene.`,
  },
  hyperdense: {
    density: SceneDensity.CAU_NGAN,
    instruction: `CRITICAL SPLITTING MANDATE: Split the script into scene chunks corresponding to short sentences or complete clauses. MANDATORY SEMANTIC INTEGRITY: Every single scene's script/narration MUST be a grammatically complete, semantically meaningful clause or sentence (containing a clear subject and verb/predicate, expressing a complete thought). Do NOT split sentences into meaningless fragments or tiny dangling phrases. The narration text for each scene must make complete grammatical and logical sense on its own.`,
  },
  short_sentence: {
    density: SceneDensity.CAU_NGAN,
    instruction: `CRITICAL SPLITTING MANDATE: Split the script into scene chunks corresponding to short sentences or complete clauses. MANDATORY SEMANTIC INTEGRITY: Every single scene's script/narration MUST be a grammatically complete, semantically meaningful clause or sentence (containing a clear subject and verb/predicate, expressing a complete thought). Do NOT split sentences into meaningless fragments or tiny dangling phrases. The narration text for each scene must make complete grammatical and logical sense on its own.`,
  },
  mixed_sentences: {
    density: SceneDensity.CAU_KET_HOP,
    instruction: `CRITICAL SPLITTING MANDATE: You MUST split the script dynamically by combining both short, punchy sentences (3-5 seconds per scene) and standard long sentences (6-8 seconds per scene) based on the dramatic tension and narrative flow. When the action or emotion is high, use short sentences. When explaining details or scenery, use standard long sentences. Keep each scene's narration grammatically complete and semantically meaningful.`,
  },
  highpaced: {
    density: SceneDensity.CAU_NGAN,
    instruction: `CRITICAL SPLITTING MANDATE: Keep a swift, modern pacing. Cut precisely at punctuation boundaries or complete short clause blocks. Every single scene's script/narration MUST be a grammatically complete, semantically meaningful clause or sentence.`,
  },
  sentence: {
    density: SceneDensity.CAU_DAI,
    instruction: `CRITICAL STYLING / SPLITTING MANDATE: To make the video exceptionally dynamic, engaging, and highly visual, you MUST split the script extremely finely. Every single sentence, spoken clause, or individual thought in the script MUST correspond to EXACTLY ONE scene. NEVER combine multiple sentences or long paragraphs into a single scene! Each scene must be approx 6-8 seconds. DO NOT summarize or skip any part of the script. MANDATORY: Never combine multiple sentences into a single scene. Combining sentences will ruin the pacing and rhythm.`,
  },
  long_sentence: {
    density: SceneDensity.CAU_DAI,
    instruction: `CRITICAL STYLING / SPLITTING MANDATE: To make the video exceptionally dynamic, engaging, and highly visual, you MUST split the script extremely finely. Every single sentence, spoken clause, or individual thought in the script MUST correspond to EXACTLY ONE scene. NEVER combine multiple sentences or long paragraphs into a single scene! Each scene must be approx 6-8 seconds. DO NOT summarize or skip any part of the script. MANDATORY: Never combine multiple sentences into a single scene. Combining sentences will ruin the pacing and rhythm.`,
  },
  dramatic: {
    density: SceneDensity.THEO_DOAN,
    instruction: `CRITICAL SPLITTING MANDATE: Keep a punchy, dramatic pacing of 8-10 seconds per scene. Focus heavily on suspenseful chapter transitions and key narrative beats.`,
  },
  paragraph: {
    density: SceneDensity.THEO_DOAN,
    instruction: `CRITICAL SPLITTING MANDATE: Subdivide the script cleanly by entire paragraphs or main thoughts. Keep visual pacing slow and steady. Each scene will be longer (approx 10-15 seconds). Maintain absolute contextual continuity. DO NOT summarize or skip any part. MANDATORY: The visual design MUST strictly align with the exact content of that paragraph.`,
  },
  epic: {
    density: SceneDensity.THEO_DOAN,
    instruction: `CRITICAL SPLITTING MANDATE: Keep an epic, wide pacing of 12-18 seconds per scene. Each scene corresponds to a grand chapter development or emotional crescendo.`,
  },
  cinematic: {
    density: SceneDensity.THEO_DOAN,
    instruction: `CRITICAL SPLITTING MANDATE: Subdivide by main cinematic segments (roughly 15-20 seconds each) to build deep visual atmospheric focus.`,
  },
  artistic: {
    density: SceneDensity.THEO_DOAN,
    instruction: `CRITICAL SPLITTING MANDATE: Keep an artistic, poetic visual rhythm of 20-25 seconds per scene. Focus heavily on details and aesthetic continuity.`,
  },
  slowpaced: {
    density: SceneDensity.THEO_DOAN,
    instruction: `CRITICAL SPLITTING MANDATE: Subdivide by slow-paced narrative blocks (roughly 25-30 seconds each) for documentary or storytelling.`,
  },
  super_slow: {
    density: SceneDensity.THEO_DOAN,
    instruction: `CRITICAL SPLITTING MANDATE: Keep a super-slow, monumental pacing of over 30 seconds per scene. Ideal for slow atmospheric documentaries and deep-focus landscape layouts.`,
  },
};
