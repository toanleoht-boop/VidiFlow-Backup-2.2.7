import { AspectRatio } from "../types.js";
import { SPLIT_STRATEGY_CONFIGS } from "./strategies.js";
import { SplitStrategy } from "./enums.js";

export const NO_FRAME_RULE = `CRITICAL RULE - NO FRAMES OR BORDERS: The generated image must be a direct, full-bleed view of the scene. NEVER use words like "framed", "painting in a frame", "picture frame", "canvas border", or "museum display". Explicitly append the keywords "borderless, no frame, no borders" at the very end of every image prompt you generate.`;

export const CINEMATIC_PROMPT_RULES = `CRITICAL PROMPT DESIGN RULES & STEPS (To translate narration/storyline into visual prompts):
1. NARRATION ALIGNMENT PIPELINE (CRITICAL):
   To ensure the generated image perfectly matches the narration, you MUST follow this three-step pipeline:
   - Step 1: Deep Narration Analysis: Carefully analyze the narration/script segment to identify the exact setting (where and when), and the character details if present (who they are, what they are doing, and their precise emotional state/expression).
   - Step 2: Storyline Fidelity: Strictly adhere to the core storyline. Do NOT invent, add, or introduce foreign visual details or characters that dilute, distract, or diverge from the main narration narrative.
   - Step 3: Prompt Visual Optimization: Generate image prompts rich in highly descriptive, concrete visual keywords. Ensure that when a viewer looks at the generated image, they can instantly recognize and connect it directly to the exact spoken words and content of that scene's narration.

2. STRUCTURAL FORMULA MANDATE (CRITICAL - ALWAYS PUT ART STYLE/MEDIUM FIRST):
   To ensure consistent visual styling and prevent style drift (especially in close-ups or character-focused shots), the prompt MUST follow this strict order of priority from left to right:
   - IF the scene contains characters: [Art style/Medium (e.g., "An oil painting of", "A cinematic photorealistic shot of")] + [Main Character/Subject] + [Action/Expression] + [Clothing details/Identifying features] + [Surrounding background] + [Lighting/Atmosphere] + [Camera angle/composition/lens].
   - IF the scene does NOT contain characters (e.g., landscapes, objects, abstract events, scenery): [Art style/Medium (e.g., "An oil painting of", "A cinematic photorealistic shot of")] + [Main Subject (Object/Environment/Landscape/Phenomenon)] + [Details/Action/State] + [Surrounding background] + [Lighting/Atmosphere] + [Camera angle/composition/lens].

3. CHARACTER CONDITIONAL MANDATE (CRITICAL):
   - Do NOT force or invent a character in the scene if they are not explicitly mentioned in the scene's narration/script or logically required.
   - If a scene is describing scenery, weather, a close-up of an object, or an event with no characters, the Main Subject MUST be that object, environment, or event. You MUST NOT inject or describe any human characters or character physical traits.
   - ONLY when a character is explicitly present in the narration should you include character descriptions, actions, expressions, and clothing.

4. STEPS TO DECONSTRUCT STORYLINE INTO VISUAL PROMPTS:
   - Step 1: Determine if there is a character in the scene based on the narration text.
   - Step 2: Extract visual keywords from the text (Colors, sizes & shapes, space/environment).
   - Step 3: Specialize the main subject:
     * If character exists: Detail their age, gender, ethnicity/race (e.g., "A young Asian woman, around 20 years old"), facial expression, clothing, and traits.
     * If NO character exists: Detail the key object, environment, landscape, or event itself. Do NOT say generic things. Describe textures, states, or specific forms (e.g., "an ancient moss-covered stone sundial").
   - Step 4: Establish setting and lighting. Light defines 80% of the emotion:
     * Lighting style (e.g., "neon lights reflecting on wet puddles").
     * Atmosphere/Theme (e.g., "Moody atmosphere, cyberpunk aesthetic").
   - Step 5: Define Art Style/Medium and Camera. Specify:
     * Realistic/Cinematic: "A cinematic photorealistic 8k shot on 35mm lens of..."
     * Animation/Comic: "A Studio Ghibli style anime illustration of...", "A dark fantasy comic book art of..."

5. REFERENCE EXAMPLES (Story to English Prompt translation):
   - Example 1 (With Character):
     * Story/Script: "Under the heavy rain of the futuristic city, a girl named Linh stands holding a bright red umbrella."
     * Target English Prompt: "A cinematic photorealistic 8k shot of a young Asian woman holding a bright red umbrella, standing in a rainy cyberpunk city street. She has a sad and longing expression on her face. Heavy rain, neon lights reflecting on wet puddles on the ground. Cinematic lighting, moody atmosphere, cyberpunk aesthetic. --ar 16:9"
   - Example 2 (Without Character):
     * Story/Script: "Lightning flashes across the dark storm clouds, illuminating the ancient castle on the cliff."
     * Target English Prompt: "An epic wide-angle oil painting of an ancient stone castle perched precariously on a jagged cliff, with fierce lightning flashing across dark, churning storm clouds in the background. Dramatic high-contrast lighting, visible textured brushstrokes. --ar 16:9"

 6. STRICT ALIGNMENT WITH NARRATION (MANDATORY): The generated visual prompt MUST strictly align and match the literal meaning and core subjects of the scene's narration text. Do NOT deviate from the storyline or introduce foreign elements. Every visual element described in the prompt must serve to visually represent the spoken words of that scene. Do NOT generalize or skip key visual facts from the narration. Ensure that when looking at the image, the viewer immediately understands the content of the narration.
 7. NO METAPHORICAL, ABSTRACT, OR INVISIBLE CONCEPTS (CRITICAL): Translate abstract narration, emotional states, and invisible/metaphorical concepts into tangible, physically drawable objects, actions, and body language. Never use words like "invisible", "unseen", or abstract concepts (e.g., avoid "engaged in a conversation with an invisible party", "invisible force", "loss of opportunity"). Instead, describe physical signs and observable details: for conversation with an unseen party, use "looking slightly off-camera, gesturing with a hand as if speaking to someone just out of frame"; for "loss of opportunity", describe concrete items like "a broken military sword half-buried in dry dust next to an abandoned uniform".
 8. NO FRAMES OR BORDERS: The prompt must yield full-bleed images.
 9. CHARACTER DIVERSITY (MANDATORY): Characters within the same scene must not look identical. Create reasonable distinctions in face, age, body build, hair, facial hair, clothing, and gear (appropriate to the context) while remaining context-appropriate.
 10. CLEARLY DEFINE COMBATANTS IN CONFLICT SCENES (MANDATORY): When a scene involves battle, combat, or conflict, you MUST clearly define the opposing sides so that the image generator creates the correct characters, clothing, uniforms, armor, weapons, formations, and settings for each respective side.
 11. MANDATORY LANDSCAPE EXTRACTION & ENVIRONMENT DETAIL (100% REQUIREMENT): Every single image prompt must strictly incorporate landscape extraction, ensuring the environment, terrain, background, weather, lighting, and overall setting are fully described in detail, even for close-ups. Never omit the environmental context.
 12. HISTORICAL CONTEXT ENRICHMENT & ACCURACY (MANDATORY): For historical themes, you MUST explicitly specify the historical context, such as the conflict/war, the era or specific year, the country, the participating factions/sides, the military units/armies, and the types of soldiers or historical figures. Costumes, weapons, flags, insignia, vehicles, architecture, and cultural details must strictly adhere to the historical facts of the specified context, with absolutely no mixing of periods or countries.
 13. CHARACTER REFERENCE & CONSISTENCY (MANDATORY): Every single scene containing a character MUST include their detailed character description and strictly apply Character Reference. If a character has appeared in previous scenes, you MUST maintain consistent identifying features including face, age, gender, body build, hair style, clothing, accessories, and other key identifying traits. Only modify these traits when explicitly required by the narrative progression or a clear scene transition.
 14. SCENE-TO-SCENE VISUAL CONTINUITY & PROGRESSION: Successive scenes must maintain consistency in characters, environment, time of day, weather, lighting, clothing, environmental damage, and key props. Only change these elements during explicit scene transitions or logical narrative progression.
 15. CINEMATIC QUALITY & CAMERA DIRECTION: Always prioritize cinematic visual quality by describing camera angles, shot size, composition, focus point, depth of field, lighting, and the emotional tone of the scene to ensure an engaging and cohesive cinematic flow.
 16. VISUAL STYLE & ARTISTIC CONSISTENCY: All scenes within the same video must maintain a highly unified art style, color palette, lighting scheme, level of detail, and overall image quality to avoid abrupt or disruptive stylistic shifts.
 17. SEAMLESS TRANSITION LINKING: When consecutive scenes depict the same location or event, keep key elements (character positions, movement direction, composition, lighting, weather) consistent to ensure smooth and natural video editing transitions.
 18. FOCUS ON THE CORE SUBJECT: The prompt must focus strictly on the main subject and action of the scene. Avoid adding unrelated minor details that could distract the image generator and dilute the core visual focus.
 19. STRICT HISTORICAL ACCURACY & ANACHRONISM PREVENTION: Do not mix costumes, weapons, vehicles, architecture, flags, symbols, military ranks, or technology from different eras or countries, unless explicitly required by the story.
 20. DYNAMIC ACTION & EXPRESSION: When characters are present, always describe their specific actions, direction of gaze, facial expressions, and physical interaction with the environment to create a dynamic, lifelike feel instead of static poses.
 21. ANATOMICAL FIDELITY & QUANTITY STRICTNESS (CRITICAL): Prevent extra limbs, floating arms, or merged/fused bodies. Ensure the number of main characters generated strictly matches the singular or plural count specified in the scene's script. If the script describes 'a panicked soldier' (singular), do NOT generate two or more soldiers in the foreground. Maintain a clear, physical separation between characters to prevent the AI from fusing their torsos, shoulders, or clothing. Maintain realistic scale and proportions.
 22. CONSISTENT TIME OF DAY: If the narrative flows continuously, maintain a consistent time of day (e.g., dawn, midday, sunset, night) across consecutive scenes, and only change it when a new timeframe is explicitly introduced in the script.
 23. EDIT-FRIENDLY COMPOSITION: Each prompt should be designed like a single film frame with a clear focal point, minimal clutter, and sufficient detail to ensure that consecutive clips can be stitched together into a smooth, seamless video.
 24. PROMPT BLOAT PREVENTION & ARTISTIC CONCISENESS: Do NOT repeat general art styles, camera lens specs, or border rules multiple times in a single prompt. State them exactly once. Eliminate redundant style synonyms (e.g., write "oil-on-canvas painting style" instead of "oil painting, painterly texture, canvas art, oil-on-canvas finish"). Avoid repeating long physical descriptions of the same character multiple times in a single prompt; define key features once and clearly to prevent token bloat and AI confusion.
 25. SHOT SIZE VARIATION & VISUAL PROGRESSION (CRITICAL): Prevent consecutive scenes from yielding near-identical images by explicitly altering camera shot sizes and perspectives (e.g., alternate "close-up shot", "medium shot", "wide-angle cinematic shot", "low-angle shot", "over-the-shoulder shot") and shifting the character's precise pose, hand gestures, head tilt, or facial expressions.
 26. CROWD ANATOMY DEFECT PREVENTION (LARGE-SCALE SCENES): In massive scene battles or large crowds (e.g., "hundreds of soldiers clashing", "thousands of tents"), establish a clear foreground focus on 1 to 3 distinct, well-drawn characters or key objects. Describe the vast crowd/army in the background using terms like "silhouettes in the distant hazy dust", "indistinct figures obscured by gunpowder smoke", or "soft-focus background" to prevent mutated limbs or facial distortions.
 27. AVOID COMPLEX DIVERGENT OR MULTI-DIRECTIONAL ACTIONS (CRITICAL): Do not ask the image generator to depict multiple characters or groups performing different or opposite actions simultaneously (e.g., "two groups of soldiers riding away from each other in opposite directions"). AI generators struggle with dual-subject focus and will merge the directions. Instead, focus the prompt on one primary direction of movement or a single focal group's perspective (e.g., "A group of soldiers riding away down a ravine, seen from the perspective of another group stationary on a hill").`;

export const getSceneStyleRewritePrompt = (promptText: string, newStyle: string, isThumbnail: boolean = false, aspectRatio: string = AspectRatio.SixteenNine): string => `You are an elite AI Image Prompt Designer.
Your task is to take the original ${isThumbnail ? "thumbnail" : "image"} generation prompt and rewrite it to perfectly align with the new visual style, while STRICTLY keeping the original meaning, setting, characters, actions, and key identifiers intact.

[VISUAL REFERENCE SOURCE MATERIALS]
- Original Image Prompt: "${promptText}"
- New Target Style: "${newStyle}"

[SOFT STYLE ALIGNMENT DIRECTIVES (CREATIVE CONSISTENCY)]
1. Character & Environment Retention (Soft Alignment):
   Keep all main subjects, characters, actions, facial expressions, and landscape/background details from the original prompt. You MUST NOT delete, ignore, or alter them. Only adapt the artistic styling, rendering descriptors, colors, and lighting to match the new style.
2. Seamless Style Integration:
   Do NOT simply append the new style at the end. You MUST seamlessly weave the aesthetic of the new target style into the [Art style/Medium] and [Lighting/Atmosphere] sections of the blueprint.
3. No Metaphorical Elements: Keep the visualization literal and clear.

STRUCTURE MANDATE: The rewritten prompt MUST strictly follow this structural formula:
- If the scene has a character: [Art style/Medium] of [Main Subject/Character] + [Action/Expression] + [Clothing details/Identifying features] + [Surrounding background] + [Lighting/Atmosphere] + [Camera angle/composition/lens].
- If the scene does NOT have a character: [Art style/Medium] of [Main Subject (Object/Environment/Landscape/Phenomenon)] + [Details/Action/State] + [Surrounding background] + [Lighting/Atmosphere] + [Camera angle/composition/lens].
${CINEMATIC_PROMPT_RULES}
${NO_FRAME_RULE}
- ASPECT RATIO MANDATE: You MUST append the exact parameter "--ar ${aspectRatio}" at the very end of the rewritten prompt.
${!isThumbnail ? "IMPORTANT MANDATE: The rewritten image generation prompt MUST BE ENTIRELY IN ENGLISH, regardless of the language of the original prompt. Do not use Vietnamese in the output.\n" : ""}DO NOT include any commentary, prefixes, or markdown. Output ONLY the raw rewritten prompt string${!isThumbnail ? " in English" : ""}.`;

export const getStyleRewriteBatchPrompt = (newStyle: string, chunkJson: string, aspectRatio: string = AspectRatio.SixteenNine): string => `You are an elite AI Image Prompt Designer.
Your task is to take a list of original image generation prompts and rewrite them so that they perfectly align with the new visual style provided, while STRICTLY keeping the original meaning, setting, characters, actions, and key identifiers intact.

[VISUAL REFERENCE SOURCE MATERIALS]
- New Target Style: "${newStyle}"

[SOFT STYLE ALIGNMENT DIRECTIVES (CREATIVE CONSISTENCY)]
1. Character & Environment Retention (Soft Alignment):
   Keep all main subjects, characters, actions, facial expressions, and landscape/background details from each original prompt intact. Only adapt the artistic styling, rendering descriptors, colors, and lighting to match the new style.
2. Seamless Style Integration:
   Do NOT simply append the new style at the end. You MUST seamlessly weave the aesthetic of the new target style into the [Art style/Medium] and [Lighting/Atmosphere] sections of each prompt.

STRUCTURE MANDATE: The rewritten prompts MUST strictly follow this structural formula:
- If the scene has a character: [Art style/Medium] of [Main Subject/Character] + [Action/Expression] + [Clothing details/Identifying features] + [Surrounding background] + [Lighting/Atmosphere] + [Camera angle/composition/lens].
- If the scene does NOT have a character: [Art style/Medium] of [Main Subject (Object/Environment/Landscape/Phenomenon)] + [Details/Action/State] + [Surrounding background] + [Lighting/Atmosphere] + [Camera angle/composition/lens].
${CINEMATIC_PROMPT_RULES}
${NO_FRAME_RULE}
- ASPECT RATIO MANDATE: For each rewritten prompt, you MUST append the exact parameter "--ar ${aspectRatio}" at the very end of the prompt (e.g. "..., photorealistic 8k, cyberpunk aesthetic. --ar ${aspectRatio}"). Every prompt in the JSON array must strictly end with this parameter.
IMPORTANT MANDATE: The rewritten image generation prompts MUST BE ENTIRELY IN ENGLISH, regardless of the language of the original prompts. Do not use Vietnamese in the output.

Output ONLY a valid JSON array matching the structure: [{"id": "scene_id", "prompt": "rewritten prompt in English"}]. Do not include markdown tags, code blocks, or explanatory text.

Input scenes:
${chunkJson}`;

export const getOptimizePromptsBatchPrompt = (visualStyle: string, referenceStyle: string, chunkJson: string, aspectRatio: string = AspectRatio.SixteenNine, charactersJson?: string): string => `You are an elite AI Image Prompt Designer.
Your task is to analyze, rewrite, and optimize a list of image generation prompts for a video storyboard. You must review the current prompts, correct any style conflicts or formatting issues, clean up redundant keywords, and upgrade them to look highly detailed, cinematic, and visually consistent.

[STYLE & REFERENCE SPECIFICATIONS]
- Overall Visual Style: "${visualStyle}"
- Reference Style / Color Palette: "${referenceStyle || "Not specified"}"
${charactersJson ? `- Character Reference Specs:\n${charactersJson}\n` : ""}

[STRICT OPTIMIZATION DIRECTIVES]
1. NARRATION ALIGNMENT & STORY INTEGRITY (CRITICAL TO PREVENT INACCURACIES):
   - Each input scene contains its 'id', the current 'prompt' (which may be simple or empty), and the 'script' (the exact spoken narration or dialogue for that scene).
   - Your optimized prompt MUST be a direct visual translation of the 'script'.
   - Do NOT introduce foreign visual details, locations, or characters that deviate from or are not mentioned in the 'script'.
   - If the current 'prompt' has elements that contradict the 'script', you MUST correct them to match the 'script'.
   - Every physical object, character action, and setting described in your optimized prompt must serve to visually represent the spoken words of that scene.

2. STYLE INTEGRITY & RESOLUTION OF CONFLICTS (CRITICAL):
   - You MUST seamlessly apply the target visual style ("${visualStyle}") and reference style/palette ("${referenceStyle}") to every rewritten prompt.
   - RESOLVE STYLE CONFLICTS: Detect and remove any contradictory visual styles. For example, if the overall visual style is an "oil painting" or "watercolor", you MUST NOT use photorealistic buzzwords (e.g. "photorealistic", "hyperrealistic", "realistic 8k photo", "shot on 35mm lens") because painting mediums and photography styles are mutually exclusive. Instead, use artistic descriptors (e.g. "thick impasto texture", "expressive brushstrokes", "rich oil pigments", "textured canvas").
   - IF the style is "Cinematic" or "Photorealistic", you may use photography specs (e.g., "shot on 35mm lens, photorealistic 8k, shallow depth of field").

3. PROMPT CLEANUP & REDUNDANCY ELIMINATION:
   - Remove any general instruction phrases or duplicate tags.
   - Clean up terms like "borderless, no frame, no borders" from the middle of the prompt. You will enforce the "NO FRAME OR BORDER" rule exclusively by appending it at the very end of the prompt.
   - Eliminate redundant synonyms (e.g. "oil painting, painterly canvas, oil art style" -> "oil painting style").

4. VISUAL RICHNESS & STORYBOARD PROGRESSION:
   - Ensure each prompt is rich, highly detailed (35-50 words), describing the subject, precise setting, dynamic action/expression, lighting, and camera composition.
   - Vary the shot sizes (e.g. close-up shot, medium shot, wide cinematic shot) between adjacent scenes to create a compelling visual progression and avoid visual monotony.

5. CHARACTER & ENVIRONMENT CONSISTENCY (SOFT ALIGNMENT):
   - If characters are specified, weave their visual traits (e.g. hair style/color, key clothing details) into scenes where they appear, adjusting their pose, action, and facial expression to match the narration.
   - Maintain the environmental backdrop and time of day, but feel free to vary the lighting or camera angles to match the dramatic mood.

6. STRUCTURE MANDATE (THE BLUEPRINT): Every optimized prompt MUST follow this exact structural format from left to right:
   - If it has a character: [Art style/Medium] of [Main Subject/Character] + [Action/Expression] + [Clothing details/Identifying features] + [Surrounding background] + [Lighting/Atmosphere] + [Camera angle/composition/lens].
   - If it does NOT have a character: [Art style/Medium] of [Main Subject (Object/Environment/Landscape/Phenomenon)] + [Details/Action/State] + [Surrounding background] + [Lighting/Atmosphere] + [Camera angle/composition/lens].

7. NO METAPHORICAL OR ABSTRACT CONCEPTS: Translate all emotions, abstract concepts, or symbols into tangible, physically renderable actions, expressions, and objects.

${NO_FRAME_RULE}

- ASPECT RATIO MANDATE: You MUST append the exact parameter "--ar ${aspectRatio}" at the very end of the prompt for every single scene.

IMPORTANT MANDATE: The rewritten image generation prompts MUST BE ENTIRELY IN ENGLISH, regardless of the language of the original prompts. Do not use Vietnamese in the output.

Output ONLY a valid JSON array matching the structure: [{"id": "scene_id", "prompt": "optimized prompt in English"}]. Do not include markdown tags, code blocks, or explanatory text.

Input scenes to optimize (includes current prompt and script):
${chunkJson}`;

export const getHookGeneratorPrompt = (count: number, originalInput: string, genre: string, hookType: string, duration: number, language: string): string => `You are a professional Youtube and TikTok script writer specializing in video layouts.
Generate ${count || 3} different hooks based on this input: "${originalInput}".
Genre/Category context: ${genre || "Storytelling"}.
Hook Style desired: ${hookType || "Auto"} (options: Auto, Mystery, Shock, Drama, Curiosity, Emotional, Historical, Statistical, Question, Story).
Duration context: ${duration || 10} seconds.
Output Language: ${language === "vi" ? "Vietnamese" : "English"}.

You must return a raw JSON Array matching this format perfectly. No markdown code wraps, no introductory text, just the raw JSON:
[
  { "id": "hk_unique_1", "content": "The Hook Line...", "type": "StyleName", "selected": true }
]`;

export const getChapterWriterPrompt = (
  chapterTitle: string,
  chapterDescription: string,
  genre: string,
  writingStyle: string,
  isVi: boolean,
  genreGuideline: string,
  styleGuideline: string,
  chapterWordTarget: number,
  splitStrategy: string
): string => {
  let sentenceLengthDirective = "";

  if (
    [
      SplitStrategy.WORD,
      SplitStrategy.ULTRADENSE,
      SplitStrategy.HYPERDENSE,
      SplitStrategy.SHORT_SENTENCE,
      SplitStrategy.HIGHPACED
    ].includes(splitStrategy as SplitStrategy)
  ) {
    sentenceLengthDirective = `\n[MANDATORY SENTENCE STRUCTURE DIRECTIVE - SHORT SENTENCES]:
- You MUST write the script segments of this chapter using EXTREMELY SHORT, simple, and independent sentences (strictly maximum 10 to 15 words per sentence).
- ABSOLUTELY DO NOT write long complex compound sentences, run-on sentences, or use complex conjunctions to join multiple clauses. Do not use many commas to link separate thoughts.
- Each sentence must express a single visual action or subject with complete standalone meaning so that the AI image generator can easily generate matching images.`;
  } else if (splitStrategy === SplitStrategy.MIXED_SENTENCES) {
    sentenceLengthDirective = `\n[MANDATORY SENTENCE STRUCTURE DIRECTIVE - MIXED SENTENCES]:
- You MUST write the script segments using a dynamic combination of both short, punchy sentences (maximum 10-12 words) and standard long sentences (15-25 words). 
- Alternating sentence lengths creates a natural rhythm and cinematic pacing. Explanations can be longer sentences, while dramatic actions should be short sentences.`;
  } else if (splitStrategy === SplitStrategy.PARAGRAPH) {
    sentenceLengthDirective = `\n[MANDATORY SENTENCE STRUCTURE DIRECTIVE - PARAGRAPH]:
- Normal fluent paragraphs with standard long sentences are allowed, suitable for a slow visual pacing.`;
  }

  return `You are writing ONE CHAPTER of a larger script.
[Chapter Info]:
- Title: ${chapterTitle}
- Description: ${chapterDescription}

[System Configuration]:
- Video Category/Genre: ${genre || "Storytelling"}
- Writing Style: ${writingStyle || "Documentary"}
- Language: ${isVi ? "Vietnamese" : "English"}

[Genre Guideline]:
${genreGuideline}

[Writing Style Guideline]:
${styleGuideline}

[CRITICAL REQUIREMENT - LENGTH & TTS SAFE]:
${
  isVi
    ? `Write [${chapterTitle}] of the script based on the outline, WRITTEN ENTIRELY IN VIETNAMESE (Tiếng Việt). MANDATORY: This section must be at least ${chapterWordTarget} words. Write detailed narration and expand deeply. THIS IS FOR TTS VOICE SYNTHESIS, DO NOT USE: special characters (*, #, _, -, [, ], /), emojis, or complex markdown. Use only basic letters and punctuation.`
    : `Write [${chapterTitle}] based on the outline. The output text MUST be written entirely in English. MANDATORY: This section must be at least ${chapterWordTarget} words. Write detailed narration and expand deeply. THIS IS FOR TTS VOICE SYNTHESIS, DO NOT USE: special characters (*, #, _, -, [, ], /), emojis, or complex markdown. Use only basic letters and punctuation.`
}
${sentenceLengthDirective}

Provide strict output complying EXACTLY with this JSON structure:
{
  "scriptSegment": "Massive, extensive script lines for this chapter contributing to the ${chapterWordTarget}+ word count requirement."
}`;
};

export const getImagePromptDesignerPrompt = (genre: string, rewrittenScript: string): string => `You are an elite AI Image Prompt Designer. Your task is to design ONE highly detailed, standalone image prompt that captures the MOST ICONIC, DEFINING MOMENT of the story script. This image will serve as the master reference visual for the entire storyboard.

[VISUAL REFERENCE SOURCE MATERIALS]
- Genre Theme: ${genre}
- Story Script:
  """
  ${rewrittenScript}
  """

[SOFT STYLE ALIGNMENT & GENRE DIRECTIVES]
1. Genre-Adaptive Realism & Details:
   If the genre is Historical, Documentary, or Science, prioritize visual realism and authentic textures (e.g. era-appropriate outfits, correct technology, proper environment settings). For other genres, adapt accordingly to capture the specific aesthetic mood.
2. Character & Environment Alignment (Soft Alignment):
   Ensure that any main character or primary location mentioned in the script is visualised with clear, distinctive, yet natural features (no generic models). If multiple scenes follow, these visual features must remain recognizable.
3. No Metaphorical Framing: Focus strictly on the physical, visual action of the event. Avoid placing textbooks, screens, or book frames.

STRUCTURE MANDATE (THE BLUEPRINT): The generated prompt MUST strictly follow this exact structural formula from left to right:
- If the scene has a character: [Art style/Medium] of [Main Subject/Character] + [Action/Expression] + [Clothing details/Identifying features] + [Surrounding background] + [Lighting/Atmosphere] + [Camera angle/composition/lens].
- If the scene does NOT have a character: [Art style/Medium] of [Main Subject (Object/Environment/Landscape/Phenomenon)] + [Details/Action/State] + [Surrounding background] + [Lighting/Atmosphere] + [Camera angle/composition/lens].
${CINEMATIC_PROMPT_RULES}
- FOCUS ON NARRATIVE ACTION, AVOID METAPHORICAL FRAMING: Always translate the core subject matter into the visual prompt, completely ignoring metaphorical, introductory, or framing words.
${NO_FRAME_RULE}
Return ONLY the prompt text in English, no explanations, no quotes.`;

export const getVideoDirectorSceneSplitPrompt = (
  chunkIndex: number,
  totalChunks: number,
  genre: string,
  genreVisualGuideline: string,
  splitInstruction: string,
  visualStyle: string,
  referenceStyle: string,
  customSplitRules: string,
  isVi: boolean,
  chunkScript: string,
  chaptersStr: string,
  referenceCharacters?: string,
  aspectRatio: string = AspectRatio.SixteenNine,
  characterSpecs?: string,
  landscapeSpecs?: string,
): string => `You are an elite AI Video Director. Your mission is to split the rewritten script into semantic storytelling scenes and design high-quality, consistent image prompts.

[VISUAL REFERENCE SOURCE MATERIALS (CRITICAL CONTEXT)]
Use the following visual specifications as your core style and identity reference:
- Color Palette & General Style: ${visualStyle} (Reference Style: ${referenceStyle ? referenceStyle : "Not specified"})
- Primary Landscape/Environment Specs:
  ${landscapeSpecs ? landscapeSpecs : "None provided. Dynamically derive the environment, setting, and background details directly from the scene's narration context."}
- Character Specs (Visual Identity Blueprint):
  * Manual/Ref Characters: ${referenceCharacters ? referenceCharacters : "None provided"}
  * Auto-extracted Character Specs: ${characterSpecs ? characterSpecs : "None provided"}
  (If both are provided, merge them logically. If neither is available, dynamically design the character's physical appearance appropriate to the theme).

[SOFT VISUAL ALIGNMENT DIRECTIVES (CREATIVE CONSISTENCY)]
You MUST apply these alignment rules to ensure visual consistency without restricting natural artistic variety:
1. Character Visual Continuity (Soft Alignment):
   When a scene involves any character specified above, you MUST weave their primary visual markers (e.g. hair style/color, key facial features, prominent clothing items or colors) into the scene's image prompt. However, do NOT copy specifications blindly. You MUST change their pose, body action, and facial expression (e.g., happy, shocked, intense, pointing, walking) to match the exact narration.
2. Environment Visual Continuity (Soft Alignment):
   Weave the landscape specifications into the background of the image prompt. You are encouraged to adjust lighting, weather, or time of day (e.g. sunrise, foggy night, storm, bright daylight) to fit the dynamic mood of the current scene, while keeping the core setting (e.g. library, castle, lab) consistent.
3. Genre-Adaptive Visualization:
   Embody this specific guideline for the "${genre}" genre:
   ${genreVisualGuideline}

[STRICT NARRATIVE RELEVANCY & ANCHORING (CRITICAL TO PREVENT DRIFT & OUTLIERS)]
- You MUST only describe settings, landscapes, and objects that are directly mentioned or logically required by the current scene's script segment.
- NEVER invent random fantasy settings, primeval forests, ancient moss-covered ruins, or abstract celestial reliefs if they are not explicitly written in the script segment. Every visual detail MUST serve as an exact, relevant representation of the narration.

[CRITICAL NARRATIVE VISUALIZATION MANDATE - NO METAPHORICAL FRAMING & SYMBOLIC COMPOSITION]
You MUST always translate the core subject matter of the narration into the visual prompt, completely ignoring metaphorical, introductory, or framing words.
* SHIFT THE FOCUS: Move the focus entirely from the physical representation of framing words (like "textbooks", "open books", "screens", "charts") to the actual real-world action or historical event being discussed.
* SYMBOLIC USE OF FRAMING WORDS: If a word like "frame" is used in the script (e.g., "often frame the Battle of the Little Bighorn"), do NOT draw a physical frame or book. Instead, interpret "frame" symbolically/compositionally using natural framing elements in the scene (such as camera angles, terrain, silhouettes of trees, rocks, or dust/smoke).
* DYNAMIC & IMPACTFUL ACTIONS: Emphasize the emotional intensity, chaos, and movement of the actual event rather than static academic setups.
* CRITICAL EXAMPLE: If the script says "History textbooks often frame the Battle of the Little Bighorn", do NOT generate a prompt describing "an open antique history textbook showing an illustration of a battlefield map" or "history books on a desk". Instead, draw the actual battle itself:
  - Good Example: "A wide-angle, low-angle shot of the Battle of the Little Bighorn. In the foreground, a dense thicket of sagebrush and silhouettes of fallen horses create a natural frame around the central action. Beyond this natural frame, Lakota warriors on horseback charge down rolling hills towards US Cavalry soldiers on a dusty ridge. Cinematic lighting, dramatic smoke."
* If the script says "Statistics show that depression is rising...", do NOT draw a bar chart or paper graph. Draw the physical subject matter of those statistics, using composition (like many repeating silhouettes or scale contrast) to symbolically convey the statistical density.
FAILURE TO FOLLOW THIS AND VISUALIZING LITERAL BOOKSHELVES, TEXTBOOKS, OR SCREENS WILL RESULT IN CRITICAL FAILURE.

[FEW-SHOT VISUALIZATION EXAMPLE]
Below is an example of how to combine the Reference Materials and the Scene Script into a natural, highly descriptive English image prompt:
- Reference Character Spec: "An old wizard with a long grey beard, wearing a patched brown robe and round spectacles."
- Reference Landscape Spec: "A dark damp stone library with towering wooden bookshelves filled with glowing ancient books."
- Scene Script: "He carefully reached for the magical book on the shelf."
- Target English Prompt: "A medium shot of the old wizard with a long grey beard, wearing a patched brown robe and round spectacles, as he carefully reaches his hand towards a glowing magical book on a wooden shelf. He is in the dark damp stone library with towering wooden bookshelves in the background. Cinematic lighting, soft dust particles floating in the air, highly detailed, photorealistic 8k. --ar ${aspectRatio}"
(Notice how the prompt naturally integrates the wizard's appearance and the library setting while specifying a concrete camera composition and physical action).

[MULTI-STEP SYSTEM FLOW MANDATE]
You are processing chunk ${chunkIndex} of ${totalChunks}.
You MUST process EVERY SINGLE WORD of this script chunk. DO NOT SKIP, DROP, OR SUMMARIZE ANY PART OF THE NARRATION. The output scenes must perfectly re-assemble into the full script without missing a single word.

${splitInstruction}

Requirements:
1. Strict Sequencing: Traverse the ENTIRE script segment from the first word to the very last word. Do not skip, drop, or summarize any part. Ensure that no sentences at the beginning or end of the chunk are cut off or omitted. Every word must be covered.
2. Highly Descriptive Prompts & Hard Contextual Alignment:
    - STRUCTURE MANDATE (THE BLUEPRINT): The generated "prompt" MUST strictly follow this exact structural formula from left to right:
      - If the scene has a character: [Art style/Medium] of [Main Character/Subject] + [Action/Expression] + [Clothing details/Identifying features] + [Surrounding background] + [Lighting/Atmosphere] + [Camera angle/composition/lens].
      - If the scene does NOT have a character: [Art style/Medium] of [Main Subject (Object/Environment/Landscape/Phenomenon)] + [Details/Action/State] + [Surrounding background] + [Lighting/Atmosphere] + [Camera angle/composition/lens].
    - STRICT ALIGNMENT WITH NARRATION (CRITICAL): The generated prompt for each scene MUST strictly align with the literal text of the scene's script segment. Do NOT deviate from the storyline or introduce foreign elements. The prompt must be a direct visual translation of the narration.
    - MANDATORY SEMANTIC INTEGRITY FOR NARRATION (CRITICAL): Regardless of the chosen split strategy or density, every single scene's script/narration MUST be a grammatically complete, semantically meaningful clause or sentence (always containing a clear subject and verb/predicate, expressing a complete thought). Do NOT split sentences into meaningless fragments, individual words, or tiny dangling phrases (e.g. do NOT output 'and then', 'she is', 'in the', 'however'). Each scene's narration must stand alone as a coherent statement so that the generated image perfectly matches the scene. If a sentence is divided into multiple sub-scenes, rephrase each sub-scene's narration slightly so it remains a complete, meaningful sentence (e.g. carry over the subject).
    - CONTEXT PRESERVATION FOR SPLIT SCENE PROMPTS: The image prompt (prompt) for EACH sub-scene must contain the FULL context of the original complete sentence (subject, action, main setting) so that the generated image is not vague or generic.
      * Example: If the sentence is "In a medieval library, the old wizard reads a glowing book and slowly casts a spell." and it is split into two sub-scenes:
        - Sub-scene 1: Narration: "In a medieval library, the old wizard reads a glowing book." -> Prompt: "A close-up shot of an old wizard with a long white beard reading a glowing leather-bound book in a medieval library filled with tall bookshelves. Cinematic lighting, photorealistic 8k. --ar ${aspectRatio}"
        - Sub-scene 2: Narration: "The wizard slowly casts a spell." -> Prompt: "A medium shot of the old wizard in the medieval library, holding his hand over the glowing book as blue magical particles float in the air. Cinematic lighting, photorealistic 8k. --ar ${aspectRatio}" (Notice that the second sub-scene's narration is rephrased to "The wizard slowly casts a spell." to be a complete sentence with a subject, and the image prompt explicitly carries over all context to prevent a vague image).
      * NEVER generate an image prompt like "glowing particles" or "hands casting a spell" which is extremely vague and lacks a clear subject/setting.
    - ASPECT RATIO MANDATE: You MUST append the exact parameter "--ar ${aspectRatio}" at the very end of the prompt for every single scene. Every prompt must end with this parameter (e.g. "..., photorealistic 8k, cyberpunk aesthetic. --ar ${aspectRatio}").
    - NO GENERIC COPIES & STRICT VISUAL PROGRESSION: Every scene prompt must be highly specific to its script segment. Successive or adjacent scenes MUST NOT have identical or near-identical prompts. Even if the character or location remains the same, you MUST vary the camera shot/distance (e.g., alternate between close-up shot, medium shot, wide shot), camera angle, lighting, or the character's precise action or pose to ensure a clear visual progression and avoid generating identical images.
    - STRICT PROMPT RICHNESS: Ensure the "prompt" is extremely detailed and descriptive (minimum of 35-50 words). Describe the focal subject, precise setting, lighting, and camera specifications.
    - CRITICAL HARD CONTEXTUAL ALIGNMENT DIRECTIVE: What is written in the scene's script segment MUST be displayed exactly in the generated image.
    - MAP TO CHAPTERS (CRITICAL): Each generated scene must be mapped to a chapter ID from the "Chapters structure context". Set the "chapterId" field of the scene to the corresponding chapter's ID. If a scene represents introductory text (such as the hook, intro, or prologue) before Chapter 1, strictly assign it to the ID of the first chapter in the list.
    - ${NO_FRAME_RULE}
3. Dynamic Motion: Specify camera motion (options: Zoom In, Zoom Out, Pan Left, Pan Right, Static), video effects, and transitions.
${customSplitRules ? "4. CUSTOM USER RULE: " + customSplitRules : ""}

Language: ${isVi ? "Vietnamese" : "English"}.

Output must comply EXACTLY with this JSON schema (return only raw JSON, no markdown enclosing code blocks):
{
  "scenes": [
    {
      "id": "sc_1",
      "chapterId": "ch_unique_chapter_id",
      "startTime": "MM:SS",
      "endTime": "MM:SS",
      "duration": 5,
      "script": "The exact single sentence from the rewritten script.",
      "subtitle": "The exact single sentence from the rewritten script.",
      "prompt": "Highly detailed image prompt strictly following the blueprint. If character exists: '[Art style/Medium] of [Main Subject/Character] + [Action/Expression] + [Clothing details/Identifying features] + [Surrounding background] + [Lighting/Atmosphere] + [Camera angle/composition/lens]'. If no character exists: '[Art style/Medium] of [Main Subject (Object/Environment/Landscape/Phenomenon)] + [Details/Action/State] + [Surrounding background] + [Lighting/Atmosphere] + [Camera angle/composition/lens]'. Example of non-character prompt: 'An oil painting of an ancient massive redwood tree standing in the center of a dense misty forest, sunbeams filtering through the foliage, damp moss-covered ground, cinematic wide shot, photorealistic 8k. --ar ${aspectRatio}' THIS PROMPT MUST BE WRITTEN ENTIRELY IN ENGLISH.",
      "cameraMotion": "Zoom In",
      "effects": "Lighting details matching style and mood",
      "transition": "Fade out to black"
    }
  ]
}

Script segment to divide (Part ${chunkIndex} of ${totalChunks}):
${chunkScript}

Chapters structure context:
${chaptersStr}`;

export const getScriptSplitPrompt = (
  script: string,
  chaptersStr: string,
  splitStrategy: string,
  isVi: boolean
): string => {
  const strategyConfig = SPLIT_STRATEGY_CONFIGS[splitStrategy];
  const splitInstruction = strategyConfig?.instruction || "CRITICAL SPLITTING MANDATE: Keep an even, steady pacing. Cut scenes roughly every 5-8 seconds. DO NOT summarize or skip any part of the script.";

  return `You are an elite AI Video Director. Your mission is to split the rewritten script into semantic storytelling scenes.

[CRITICAL RULE - NO MODIFICATIONS AND NO LOSS OF TEXT]:
1. You MUST process the ENTIRE script segment from the first word to the very last word.
2. DO NOT SKIP, DROP, SUMMARIZE, OR REWRITE ANY PART OF THE NARRATION.
3. Every single word in the original script MUST be preserved. The concatenation of all "script" fields in your output JSON must perfectly reconstruct the original script, preserving punctuation and spaces.
4. Each scene segment's "script" and "subtitle" MUST contain the exact text of that segment, written in the original language (${isVi ? "Vietnamese" : "English"}).

[SPLITTING STRATEGY]:
${splitInstruction}

[MAP TO CHAPTERS]:
Each split scene segment must be mapped to a chapter ID from the "Chapters structure context" below. Set the "chapterId" field of the scene to the corresponding chapter's ID. If a scene represents introductory text (such as the hook, intro, or prologue) before Chapter 1, strictly assign it to the ID of the first chapter in the list.

Output must comply EXACTLY with this JSON schema (return only raw JSON, no markdown enclosing code blocks):
{
  "scenes": [
    {
      "id": "sc_1",
      "chapterId": "ch_unique_chapter_id",
      "script": "The exact sentence or clause from the script.",
      "subtitle": "The exact sentence or clause from the script."
    }
  ]
}

Script to divide:
"""
${script}
"""

Chapters structure context:
${chaptersStr}`;
};

export const getSceneDetailBatchPrompt = (
  scenesJson: string,
  visualStyle: string,
  referenceStyle: string,
  characterRef: string | undefined,
  characterSpecs: string | undefined,
  landscapeSpecs: string | undefined,
  isVi: boolean,
  genre: string,
  genreVisualGuideline: string,
  aspectRatio: string
): string => {
  return `You are an elite AI Video Director and Visual Designer.
Your task is to take a batch of storyboard scenes (which already have their script text) and generate high-quality, detailed visual prompts and camera directions for each of them.

[VISUAL REFERENCE SOURCE MATERIALS (CRITICAL CONTEXT)]
Use the following visual specifications as your core style and identity reference:
- General Visual Style: ${visualStyle}
- Color Palette / Reference Style: ${referenceStyle || "Not specified"}
- Primary Landscape/Environment Specs:
  ${landscapeSpecs ? landscapeSpecs : "None provided. Dynamically derive the environment, setting, and background details from each scene's script context."}
- Character Specs (Visual Identity Blueprint):
  * Manual/Ref Characters: ${characterRef ? characterRef : "None provided"}
  * Auto-extracted Character Specs: ${characterSpecs ? characterSpecs : "None provided"}
  (If both are provided, merge them logically. If neither is available, dynamically design the character's physical appearance appropriate to the theme).

[SOFT VISUAL ALIGNMENT DIRECTIVES (CREATIVE CONSISTENCY)]
1. Character Visual Continuity (Soft Alignment):
   When a scene involves any character specified above, you MUST weave their primary visual markers (e.g. hair style/color, key facial features, prominent clothing items) into the scene's image prompt. However, do NOT copy specifications blindly. You MUST change their pose, body action, and facial expression (e.g., happy, shocked, intense, pointing, walking) to match the scene's script/action.
2. Environment Visual Continuity (Soft Alignment):
   Weave the landscape specifications into the background of the image prompt. Adjust lighting, weather, or time of day to fit the mood of the scene, while keeping the core setting consistent.
3. Genre-Adaptive Visualization:
   Embody this guideline for the "${genre}" genre:
   ${genreVisualGuideline}

[STRICT NARRATIVE RELEVANCY & ANCHORING]
- You MUST only describe settings, landscapes, and objects that are directly mentioned or logically required by the scene's script segment. Do NOT invent random unrelated elements.

[CRITICAL NARRATIVE VISUALIZATION MANDATE - NO METAPHORICAL FRAMING & SYMBOLIC COMPOSITION]
- Translate abstract narration, emotional states, and invisible/metaphorical concepts into tangible, physically drawable objects, actions, and body language.
- Never use words like "invisible", "unseen", or draw literal bookshelves/open books for phrases like "History textbooks often frame the Battle of the Little Bighorn". Show the actual battle instead, using natural composition (terrain, smoke, silhouettes) as the frame.

[PROMPT STRUCTURE MANDATE (THE BLUEPRINT)]
The generated "prompt" field for each scene MUST strictly follow this exact structural formula from left to right:
- If the scene has a character: [Art style/Medium] of [Main Character/Subject] + [Action/Expression] + [Clothing details/Identifying features] + [Surrounding background] + [Lighting/Atmosphere] + [Camera angle/composition/lens].
- If the scene does NOT have a character: [Art style/Medium of Main Subject (Object/Environment/Landscape/Phenomenon)] + [Details/Action/State] + [Surrounding background] + [Lighting/Atmosphere] + [Camera angle/composition/lens].
- Every prompt MUST BE ENTIRELY IN ENGLISH, regardless of the language of the original script.
- ASPECT RATIO MANDATE: You MUST append the exact parameter "--ar ${aspectRatio}" at the very end of the prompt for every single scene.

[DYNAMIC MOTION, EFFECTS & TRANSITIONS]
For each scene, specify:
- cameraMotion: Specify camera motion (options: Zoom In, Zoom Out, Pan Left, Pan Right, Static).
- effects: Lighting details matching style and mood.
- transition: Options like Fade out to black, Dissolve, Wipe, Cross zoom, or None.

Output must comply EXACTLY with this JSON schema (return only raw JSON, no markdown enclosing code blocks):
{
  "scenes": [
    {
      "id": "scene_id_matching_input",
      "prompt": "Highly detailed image prompt in English (35-50 words) ending with --ar ${aspectRatio}.",
      "cameraMotion": "Zoom In",
      "effects": "Lighting details matching style and mood",
      "transition": "Fade out to black"
    }
  ]
}

Here are the scenes to process:
${scenesJson}`;
};

export const getSeoMarketerPrompt = (rewrittenScript: string, numTitles: number, numDescriptions: number, numHashtags: number, numTags: number, isVi: boolean): string => `You are a high-impact viral CTR professional SEO analyst and marketing copywriter.
Your task is to analyze this video script and generate fully optimized search and click metadata:
---
${rewrittenScript}
---

Your process MUST complete all of these steps internally:
1. Keyword Analysis: Analyze the content and identify the top 10 search terms (including highly searched long-tail keywords) in ${isVi ? "Vietnamese" : "English"}.
2. Draft SEO Generation: Generate exactly ${numTitles} click-worthy video titles and exactly ${numDescriptions} descriptions. Provide metrics for each title and description (searchScore, ctrScore, compScore, seoScore) on a scale of 0-100. Generate exactly ${numHashtags} hashtags and exactly ${numTags} search tags.
3. SEO Optimization & Refinement: Polish the results so that the keywords are naturally integrated into the text. Avoid dry or clinical styles; optimize titles specifically for high CTR on modern media platforms (e.g. YouTube, TikTok).

You MUST return a valid JSON object matching this schema perfectly. Output ONLY raw JSON, with no markdown code wraps or backticks:
{
  "keywords": ["keyword1", "keyword2"],
  "titles": [
    { "text": "Optimized Title", "searchScore": 95, "ctrScore": 95, "compScore": 25, "seoScore": 96 }
  ],
  "descriptions": [
    { "text": "Optimized description naturally integrating keywords...", "searchScore": 92, "ctrScore": 90, "compScore": 30, "seoScore": 91 }
  ],
  "hashtags": ["hashtag1", "hashtag2"],
  "tags": ["tag1", "tag2"]
}`;

export const getThumbnailLayoutPrompt = (rewrittenScript: string, thumbnailCount: number, refImageStr: string, isVi: boolean, aspectRatio: string = "16:9"): string => `You are an elite YouTube visual strategist and viral click-through rate copywriter.
Your task is to analyze this script and generate EXACTLY ${thumbnailCount} highly engaging, high-contrast ${aspectRatio} visual thumbnail designs.

---
${rewrittenScript}
---

${refImageStr}

Your process MUST complete all steps internally:
1. Concept Brainstorming: Devise visual concepts that use powerful emotional drivers (intense curiosity, dread, wonder, shock, mystery).
2. Layout & Composition (Inspired by high-converting duel/confrontation style):
   - You MUST utilize highly viral YouTube thumbnail layouts, varying them across the generated thumbnails.
   - Dual/Confrontation Layout: Design a split-screen or high-contrast comparison (e.g., two opposing subjects, factions, or choices on the left and right). In the middle/divider of the split-screen, there must be a giant, striking, vibrant symbol to create curiosity, such as a giant red painted question mark (?), a fiery glowing rift, or a bold historic-looking 'VS' divider. Avoid using modern glowing cyberpunk neon symbols in historical or classic settings.
   - Extreme Close-up Reaction: A huge, highly detailed face showing intense emotion taking up one half of the screen, with the object of interest on the other half. If the setting is historical or classic, demand a classic oil painting style or dramatic Rembrandt lighting to make the expression look authentic and cinematic, rather than generic low-quality AI stock photos.
   - The Hidden Secret: A mysterious glowing object or silhouette in the foreground, with blurred cinematic depth behind it.
3. Typography & Text Overlay (100% MANDATORY REQUIREMENT):
   - EVERY single design in the array MUST have hasText: true.
   - The textText must be a highly relevant, click-bait text hook derived from the video script, written in ${isVi ? "Vietnamese (e.g., 'QUYẾT ĐỊNH!', 'SỰ THẬT!', 'SAI LẦM!')" : "English (e.g., 'THE TRUTH!', 'DECISION!', 'WHAT IF?')"} in uppercase, keep it extremely short (1 to 4 words maximum) to avoid clutter.
   - Typography should suggest massive, bold, high-contrast block fonts (like Impact, Arial Black, Montserrat Bold).
   - Underneath the main text, instead of flat game-like buttons, optionally suggest natural thematic elements that simulate interactive choices (e.g., a dusty red flag pointing left and a worn white flag pointing right with choice text, or physical objects placed on a map like a sword vs. shackles).
4. Prompt Design & Text Integration (CRITICAL FOR IMAGE GENERATION):
   - You MUST write the visual image generation prompts in English.
   - CRITICAL DIRECTIVE: You MUST explicitly describe the text overlay and its visual details directly inside the "prompt" field so the AI image generator (like Flux, Midjourney, or Veo) actually renders the text onto the generated image.
   - POSITIONING SAFETY: To prevent UI labels or status overlays from covering the text, specify the text to be placed with a safe margin from the top edge, preferably positioned slightly lower in the upper-center or lower-center areas.
   - Describe the text in the prompt as: "...a bold, massive, high-contrast text overlay reading '[YOUR_TEXT_TEXT]' in uppercase, written in clean blocky typography with a heavy black outline/drop shadow, safely positioned with a top padding to avoid edges...".
   - If there are choices or secondary labels, describe them as physical, in-world rustic objects: "...at the bottom, two physical choice markers represented by weathered items on a table with short text labels 'OPTION A' and 'OPTION B' written clearly beside them...". Avoid flat digital banners or game UI overlays.
   - The overall image style must be highly cinematic, dramatic lighting, high contrast, sharp details, shallow depth of field, with strong color contrast (e.g. warm sunset/dust tones vs. cold shadows).
   - ASPECT RATIO MANDATE: You MUST append the exact parameter "--ar ${aspectRatio}" at the very end of the prompt for every single thumbnail. Every prompt must end with this parameter (e.g. "..., photorealistic 8k, cyberpunk aesthetic. --ar ${aspectRatio}").

You MUST return a valid JSON object matching this schema perfectly. Output ONLY raw JSON, no markdown code wraps or backticks:
{
  "concepts": [
    { "composition": "Visual focus and emotion driver", "textHook": "TEXT" }
  ],
  "thumbnails": [
    {
      "id": "th_1",
      "prompt": "Highly detailed ${aspectRatio} thumbnail prompt in English. Must describe all visual elements, cinematic lighting, explicitly detail the typography text overlay (e.g. '...a bold massive white text overlay safely below the top edge that reads \"THE TRUTH\" with a thick black outline...') so it is rendered by the AI image generator, and you MUST append the exact parameter '--ar ${aspectRatio}' at the very end of the prompt.",
      "style": "Dramatic Cinematic",
      "hasText": true,
      "textText": "${isVi ? "SỰ THẬT!" : "THE TRUTH!"}",
      "layout": "Split-screen confrontation with a giant red question mark (?) in the center",
      "typography": "Impact Bold Sans",
      "colorSuggestion": "Vibrant white text with thick black borders, and safe margins",
      "subjectFocus": "Opposing commanders on left and right sides"
    }
  ]
}`;

export const getOutlineWriterPrompt = (inputTypeContext: string, durationText: string, targetWordCount: number, genre: string, writingStyle: string, isVi: boolean, targetWordCountMin: number): string => `CRITICAL MANDATE: You MUST strictly adhere to all of the following [System Configuration] constraints and guidelines.

${inputTypeContext}

[System Configuration]:
- Target Duration: EXACTLY ${durationText}.
- Target Word Count: EXACTLY ${targetWordCount} words.
- Video Category/Genre: ${genre || "Storytelling"}
- Writing Style: ${writingStyle || "Documentary"}
- Language: ${isVi ? "Vietnamese (Tiếng Việt)" : "English (Tiếng Anh)"}

[Language Constraint - CRITICAL]:
The language requested is ${isVi ? "Vietnamese" : "English"}. 
You MUST write all titles and descriptions in ${isVi ? "Vietnamese" : "English"}.

Your task is to generate ONLY an OUTLINE for a script that will be exactly ${targetWordCount} words long.
Divide the outline into EXACTLY ${Math.max(4, Math.floor(targetWordCountMin / 300))} chapters.
Each chapter will later be expanded to approximately ${Math.ceil(targetWordCount / Math.max(4, Math.floor(targetWordCountMin / 300)))} words.

Provide strict output complying EXACTLY with this JSON structure:
{
  "factCheckNotes": "Fact checking notes based on the original input.",
  "chapters": [
    { "id": "ch_1", "title": "Chapter title", "description": "Brief description of what happens in this chapter to guide the detailed writing later" }
  ]
}`;

export const getDetailedPromptBuilderPrompt = (
  sceneScript: string,
  setting: string,
  time: string,
  character: string,
  costume: string,
  camera: string,
  style: string,
  aspectRatio: string = AspectRatio.SixteenNine,
  characterPrompt?: string,
  referencePrompt?: string,
  currentPrompt?: string,
): string => `You are an elite AI Image Prompt Designer. Your task is to take the user's detailed inputs and combine/refine them into a single, highly descriptive cinematic image generation prompt in English.

[VISUAL REFERENCE SOURCE MATERIALS]
- Base Narrative/Script: "${sceneScript}"
- Current Image Prompt (to refine/regenerate): "${currentPrompt || "Not specified"}"
- Setting/Environment: "${setting || "Not specified"}"
- Time/Lighting: "${time || "Not specified"}"
- Characters/Expression: "${character || "Not specified"}"
- Costumes/Props: "${costume || "Not specified"}"
- Camera Angle/Composition: "${camera || "Not specified"}"
- Visual StylePreset: "${style || "Cinematic"}"
- Global Character Specs (Visual Identity Blueprint): "${characterPrompt || "Not specified"}"
- Global Style/Color Palette Reference: "${referencePrompt || "Not specified"}"

[SOFT STYLE ALIGNMENT DIRECTIVES]
1. Seamless Element Integration & Refinement:
   - Do NOT simply append the inputs or references at the end of the prompt. You MUST seamlessly weave character details, costumes, setting, time, camera, and style into the blueprint structure below.
   - If "Current Image Prompt" is specified, use its visual ideas, core subjects, and detailed descriptions as the foundation. Your goal is to improve, expand, and refine it, rather than throwing it away.
2. Character Visual Consistency (Soft Alignment):
   Ensure character physical specifications and costume markers from "Global Character Specs" (if specified) are aligned nicely with the action and environment. AI can adjust facial expression and body posture to naturally fit the narrative context of the "Base Narrative/Script".
3. Style Consistency (Soft Alignment):
   If "Global Style/Color Palette Reference" is specified, incorporate its color tones, lighting, rendering quality, and visual mood into the atmosphere.
4. No Metaphorical Framing: Focus strictly on the physical, literal visual representation of the scene. Avoid bookshelves, screens, or book frames.

STRUCTURE MANDATE (THE BLUEPRINT): The generated prompt MUST strictly follow this exact structural formula from left to right:
- If it has a character: [Art style/Medium] of [Main Subject/Character] + [Action/Expression] + [Clothing details/Identifying features] + [Surrounding background] + [Lighting/Atmosphere] + [Camera angle/composition/lens].
- If it does NOT have a character: [Art style/Medium] of [Main Subject (Object/Environment/Landscape/Phenomenon)] + [Details/Action/State] + [Surrounding background] + [Lighting/Atmosphere] + [Camera angle/composition/lens].
${CINEMATIC_PROMPT_RULES}
- ASPECT RATIO MANDATE: You MUST append the exact parameter "--ar ${aspectRatio}" at the very end of the generated prompt.
DO NOT include any commentary, prefixes, or markdown. Output ONLY the raw prompt string in English.`;

export const getHookAnalysisPrompt = (originalInput: string, genre: string): string => `You are an expert content strategist. Analyze the following topic/idea: "${originalInput}".
Genre context: ${genre || "Storytelling"}.
Identify the primary target audience, core emotional triggers (curiosity, fear, nostalgia, shock, etc.), and outline 3 completely different narrative angles or hooks that would grab attention in the first 3 seconds on social media.
Output a raw JSON object with this format (no markdown):
{
  "audience": "Description of target audience",
  "triggers": ["trigger 1", "trigger 2"],
  "angles": [
    { "name": "Angle Name (e.g. Mystery)", "rationale": "Why this works" }
  ]
}`;

export const getHookPolishPrompt = (draftsJson: string, language: string): string => `You are a viral copywriting editor. Polish and refine the following draft hooks to make them extremely punchy, catchy, and optimized for TTS text-to-speech voice generation.
Draft Hooks JSON:
${draftsJson}

Rules:
1. Keep the hooks short, highly engaging, and smooth to read out loud.
2. Remove any special characters, emojis, hashtags or markdown.
3. Language of output content: ${language === "vi" ? "Vietnamese" : "English"}.
4. Return ONLY a raw JSON Array matching this schema perfectly (no markdown wrapping):
[
  { "id": "hk_unique_1", "content": "Polished Hook Line...", "type": "Angle Name", "selected": true }
]`;

export const getScriptConceptPrompt = (originalInput: string, genre: string, writingStyle: string, language: string): string => `You are an expert researcher and creative director.
Create a "Concept & Terminology Sheet" for a video script based on:
Input Idea: "${originalInput}"
Genre: "${genre}"
Style: "${writingStyle}"
Language: "${language === "vi" ? "Vietnamese" : "English"}"

Your task is to outline:
1. Concept details and historical/scientific settings.
2. Character Profiles: If characters exist, define their key traits, visual descriptions (clothing, age, style), and consistent naming.
3. Forbidden Terms vs Preferred Terminology: Recommend terms to use and terms to avoid to fit the genre and TTS engines.
Output a raw JSON object matching this schema perfectly (no markdown wrapping):
{
  "theme": "Core theme details",
  "characterSpecs": "Detailed visual descriptions of main characters or entities",
  "keywords": ["keyword1", "keyword2"],
  "preferredTerms": ["term1", "term2"]
}`;

export const getOutlineVerifyPrompt = (outlineJson: string, targetWordCount: number, genre: string): string => `You are a senior script editor. Review this draft outline:
${outlineJson}

Constraints:
- Genre: ${genre}
- Target Word Count: ${targetWordCount}

Critique the outline for:
1. Pacing & Flow: Is there a clear progression?
2. Redundancy: Are there chapters that repeat similar points?
3. Narrative Arc: Does it fit the ${genre} genre?

If there are issues, modify and improve the outline. If it is already perfect, keep it as is.
Output a raw JSON object matching this schema (no markdown wrapping):
{
  "factCheckNotes": "Fact checking notes, updated if needed",
  "chapters": [
    { "id": "ch_1", "title": "Chapter title", "description": "Polished chapter description" }
  ]
}`;

export const getScriptSanitizePrompt = (rawScript: string, isVi: boolean): string => `You are an AI TTS Normalization Service. Your job is to take the raw script and clean it so it can be synthesized by TTS engines flawlessly.
Raw Script:
"""
${rawScript}
"""

Rules:
1. REMOVE all markdown formatting, including bold (**), italics (*), headers (#), lists (-), blockquotes (>), brackets ([]), backticks (\`), and slashes.
2. REMOVE all emojis and special symbols.
3. SCRIPT EXPANSION: Expand any abbreviation or numeric figure into its full spoken word equivalent in ${isVi ? "Vietnamese" : "English"} (e.g., if language is Vietnamese, expand "100%" to "một trăm phần trăm" and "AI" to "trí tuệ nhân tạo"; if English, expand "100%" to "one hundred percent" and "AI" to "artificial intelligence").
4. Maintain the exact flow and paragraph structure.
Output a raw JSON object matching this schema (no markdown wrapping):
{
  "cleanedScript": "The fully cleaned, TTS-safe script text"
}`;

export const getGlobalVisualBiblePrompt = (script: string, genre: string, visualStyle: string, referenceStyle?: string, referenceCharacters?: string): string => {
  let prompt = `You are a cinematic concept artist. Analyze the video script to establish a cohesive Visual Bible.

[CRITICAL NARRATIVE VISUALIZATION MANDATE - NO METAPHORICAL FRAMING & SYMBOLIC COMPOSITION]
You MUST always translate the core subject matter of the narration into the visual specifications, completely ignoring metaphorical, introductory, or framing words.
* SHIFT THE FOCUS: Move the focus entirely from the physical representation of framing words (like "textbooks", "open books", "screens", "charts") to the actual real-world action or historical event being discussed.
* SYMBOLIC USE OF FRAMING WORDS: If a word like "frame" is used in the script (e.g., "often frame the Battle of the Little Bighorn"), do NOT establish "history textbooks" or "libraries" in your visual specs. Instead, interpret "frame" symbolically/compositionally using natural framing elements in the scene (such as camera angles, terrain, silhouettes of trees, rocks, or dust/smoke) to establish environment specifications.
* DYNAMIC & IMPACTFUL ACTIONS: Emphasize the emotional intensity, chaos, and movement of the actual event rather than static academic setups.
* CRITICAL EXAMPLE: If the script says "History textbooks often frame the Battle of the Little Bighorn", do NOT establish visual specifications for "history textbooks" or "libraries". Instead, establish specifications for the actual historical entities/events: "the Battle of the Little Bighorn" itself (e.g., Lakota warriors, cavalry soldiers, dusty grassy battlefields).
* If the script says "Statistics show that depression is rising...", do NOT establish charts, graphs, or screens. Establish specs for a sad/depressed person.
FAILURE TO FOLLOW THIS AND SPECIFYING TEXTBOOKS, SCREENS, OR LIBRARIES INSTEAD OF THE ACTUAL NARRATIVE EVENT WILL CAUSE CRITICAL FAILURE.

Script:
"""
${script}
"""
Target Visual Style: "${visualStyle}"
Genre: "${genre}"`;

  if (referenceStyle) {
    prompt += `\n\nCRITICAL STYLE REFERENCE TO ADHERE TO:\nThe user has extracted/analyzed a specific visual style from reference images: "${referenceStyle}". You MUST deeply align the Color Palette, Environment, and Lighting mood of this Visual Bible with this style reference to ensure consistency.`;
  }

  if (referenceCharacters) {
    prompt += `\n\nCRITICAL CHARACTER REFERENCE TO ADHERE TO:\nThe characters have specific visual/physical appearance guidelines: ${referenceCharacters}. You MUST use these exact visual specifications when defining the character appearance and specs in the Visual Bible.`;
  }

  prompt += `\n\nEstablish:
1. Color Palette: A harmonious color palette (e.g., "dark obsidian tones with accents of electric amber").
2. Character/Subject Appearance: Specific, detailed, consistent descriptions of key characters, objects, or subjects mentioned (e.g. "an old man with thick silver hair, a weathered brown leather vest, round spectacles").
3. Landscape & Environment: Specific, detailed descriptions of key locations, backgrounds, or settings mentioned in the script (e.g., "a misty dense pine forest with towering trees", "a futuristic cyberpunk street with glowing signs").
4. Environment & Lighting: Unified lighting style (e.g., "dramatic chiaroscuro lighting, soft volumetric dust particles").
Output a raw JSON object matching this schema (no markdown wrapping):
{
  "colorPalette": "Description of color palette",
  "characterSpecs": "Consistent appearance descriptors of main subjects (no proper names, just descriptions)",
  "landscapeSpecs": "Consistent description of primary landscapes, environments, and locations",
  "lightingMood": "Volumetric lighting, environment mood descriptions"
}`;

  return prompt;
};

export const getScenePromptRefinePrompt = (scenesJson: string, visualBibleJson: string): string => `You are an elite Image Prompt Refiner. Your goal is to apply a global Visual Bible to individual scene prompts to ensure perfect character and visual consistency across the entire storyboard.

[CRITICAL NARRATIVE VISUALIZATION MANDATE - NO METAPHORICAL FRAMING & SYMBOLIC COMPOSITION]
You MUST always translate the core subject matter of the narration into the visual prompt, completely ignoring metaphorical, introductory, or framing words.
* SHIFT THE FOCUS: Move the focus entirely from the physical representation of framing words (like "textbooks", "open books", "screens", "charts") to the actual real-world action or historical event being discussed.
[VISUAL REFERENCE SOURCE MATERIALS (CRITICAL CONTEXT)]
- Visual Bible Blueprint:
${visualBibleJson}

[SOFT VISUAL ALIGNMENT DIRECTIVES (CREATIVE CONSISTENCY)]
1. Character Visual Continuity (Soft Alignment):
   When a scene involves any character specified in the Visual Bible ("characterSpecs"), you MUST weave their primary visual markers (e.g. hair style/color, key facial features, prominent clothing items or colors) into the scene's image prompt. However, do NOT copy specifications blindly. You MUST change their pose, body action, and facial expression to match the exact scene narration.
2. Environment Visual Continuity (Soft Alignment):
   Weave the landscape/environment specifications ("landscapeSpecs") into the background of the image prompt. You are encouraged to adjust lighting, weather, or time of day to fit the dynamic mood of the current scene, while keeping the core setting consistent.
3. Seamless Blueprint Integration:
   Do NOT simply append the Visual Bible details at the end of the prompt. You MUST seamlessly weave them directly into the blueprint structure:
   - Weave character details ("characterSpecs") into the [Main Subject] and [Action] sections ONLY if a character is present in the scene. If "characterSpecs" is empty, dynamically derive character features.
   - Weave landscape details ("landscapeSpecs") into the [Surrounding background] section.
   - Weave color palette ("colorPalette") and lighting mood ("lightingMood") into the [Lighting/Atmosphere] and [Art style/Camera] sections.

STRUCTURE MANDATE: The refined "prompt" MUST strictly follow this exact structural formula from left to right:
- If the scene has a character: [Main Subject/Character] + [Action/Expression] + [Clothing details/Identifying features] + [Surrounding background] + [Lighting/Atmosphere] + [Art style/Camera].
- If the scene does NOT have a character: [Main Subject (Object/Environment/Landscape/Phenomenon)] + [Details/Action/State] + [Surrounding background] + [Lighting/Atmosphere] + [Art style/Camera].
${CINEMATIC_PROMPT_RULES}
- FOCUS ON NARRATIVE ACTION, AVOID METAPHORICAL FRAMING: Focus directly on the actual core events or entities, ignoring metaphorical, introductory, or framing text.
${NO_FRAME_RULE}
5. SCENE-TO-SCENE CONTINUITY (CRITICAL): Ensure consecutive scenes preserve identical character traits (clothing, face, hair) and environment background features. Only progress the camera shot, angle, and action.
6. Keep the prompt entirely in English.
7. Do not alter the script or timings.
8. Return ONLY the raw JSON array matching this format (no markdown code blocks):
[
  {
    "id": "sc_1",
    "prompt": "Refined English prompt..."
  }
]`;

export const getSeoKeywordAnalysisPrompt = (script: string, isVi: boolean): string => `You are an SEO analyst. Analyze this script:
"""
${script}
"""

Identify the top 10 search terms, including highly searched long-tail keywords, related to this content.
Output a raw JSON object (no markdown wrapping):
{
  "keywords": ["keyword 1", "keyword 2"]
}`;

export const getSeoRefinementPrompt = (draftSeoJson: string, keywordsJson: string, isVi: boolean): string => `You are a high-CTR SEO Optimizer. Take the draft SEO metadata and optimize it using the analyzed keywords list.
Draft SEO:
${draftSeoJson}

Keywords:
${keywordsJson}

Rules:
1. Keep titles highly click-worthy (CTR optimized), under 60 characters if possible.
2. Ensure descriptions naturally integrate at least 3 high-volume keywords.
3. Optimize tags and hashtags.
4. Output language: ${isVi ? "Vietnamese" : "English"}.
5. Return ONLY a raw JSON matching the original schema (no markdown wrapping):
{
  "titles": [
    { "text": "Optimized title", "searchScore": 95, "ctrScore": 95, "compScore": 25, "seoScore": 96 }
  ],
  "descriptions": [
    { "text": "Optimized description...", "searchScore": 92, "ctrScore": 90, "compScore": 30, "seoScore": 91 }
  ],
  "hashtags": ["tag1", "tag2"],
  "tags": ["tag1", "tag2"]
}`;

export const getThumbnailConceptPrompt = (script: string, count: number, isVi: boolean): string => `You are a viral YouTube thumbnail strategist. Brainstorm ${count || 3} high-CTR thumbnail composition concepts for a video based on this script.
Script:
"""
${script}
"""

Each concept should detail:
1. Core focal subject with extreme emotional triggers (shock, extreme curiosity, mystery, fear, awe) to maximize Click-Through Rate (CTR).
2. High-contrast elements, dramatic backlighting, or mysterious glows.
3. Best text hook overlay to place on the thumbnail. This text hook MUST be extremely short, clean, and punchy (strictly 1 to 3 words max, written in ${isVi ? "Vietnamese" : "English"}). For example, "BÍ MẬT!", "SỰ THẬT!", "CẢNH BÁO!", "TRÁNH XA!". Never use full sentences or long phrases to avoid layout clutter.
Output a raw JSON object (no markdown wrapping):
{
  "concepts": [
    { "composition": "Visual description", "textHook": "TEXT OVERLAY" }
  ]
}`;

export const getThumbnailPromptRefinePrompt = (draftThumbsJson: string, conceptsJson: string): string => `You are an expert thumbnail layout editor. Your task is to refine the draft thumbnail generation prompts using the high-CTR composition concepts to meet professional YouTube and Facebook thumbnail layout standards.

[VISUAL REFERENCE SOURCE MATERIALS (CRITICAL CONTEXT)]
- Draft Thumbnails to refine:
${draftThumbsJson}
- High-CTR Concepts to apply:
${conceptsJson}

[SOFT VISUAL ALIGNMENT DIRECTIVES (CREATIVE CONSISTENCY)]
1. Character Visual Continuity (Soft Alignment):
   Ensure that any character specifications present in the concepts/drafts are woven into the prompts using consistent visual markers (hair color, outfits). AI must adjust pose, action, and facial expression (e.g., extremely shocked face, excitement, curiosity) to fit the specific concept and maximize clickability.
2. High CTR Focal Subject:
   Refine the "prompt" field to describe a highly engaging, high-contrast, professional 16:9 design. It must feature a single, dominant focal subject (subject focus) with a blurred background.
3. No Metaphorical Framing: Focus strictly on the literal visual representation of the concept. Avoid framed elements, bookshelves, or TV frames.

CRITICAL THUMBNAIL LAYOUT RULES:
1. STRUCTURE MANDATE (THE BLUEPRINT): The generated "prompt" MUST strictly follow this structural formula:
   - If it has a character: [Main Subject/Character] + [Action/Expression] + [Clothing details/Identifying features] + [Surrounding background] + [Lighting/Atmosphere] + [Art style/Camera].
   - If it does NOT have a character: [Main Subject (Object/Environment/Landscape/Phenomenon)] + [Details/Action/State] + [Surrounding background] + [Lighting/Atmosphere] + [Art style/Camera].
   - CINEMATIC PROMPT RULES:
     ${CINEMATIC_PROMPT_RULES}
   - SEAMLESS INTEGRATION RULE: Do NOT simply append composition or character references at the end. You MUST seamlessly weave the concept's composition, subject focus, and lighting suggestions directly into the corresponding sections of the blueprint.
2. Typography & Text Overlay (100% MANDATORY): EVERY design in the array MUST have hasText: true. The textText must be a highly relevant, click-bait text hook derived from the concepts, written in uppercase, strictly 1 to 4 words max. You MUST explicitly describe the text overlay (e.g. '...a bold massive white text overlay at the bottom that reads "[TEXT]" with a thick black outline...') directly inside the English 'prompt' so the AI image generator renders it on the image.
3. DO NOT place any key visual detail, text overlay, or main subject in the bottom-right corner of the image because that is where video platform timestamps are overlayed.
4. EVERY design in the array MUST have a text overlay (where 'hasText' is true, and layout/typography/colorSuggestion are specified).
5. ${NO_FRAME_RULE}
6. Prompts MUST be in English.

Return ONLY a raw JSON array matching this format (no markdown wrapping, no extra brackets, do not duplicate curly braces):
[
  {
    "id": "th_unique_id",
    "prompt": "Refined English 16:9 thumbnail prompt... (Must explicitly describe the typography text overlay, e.g. '...a bold massive white text overlay at the bottom that reads \"THE TRUTH\" with a thick black outline...')",
    "style": "Style Name",
    "hasText": true,
    "textText": "Clickable text",
    "layout": "Layout description",
    "typography": "Font description",
    "colorSuggestion": "Color suggestion",
    "subjectFocus": "Focal element"
  }
]`;

export const getCharacterAnalysisPrompt = (script: string): string => `Analyze the following script and identify the main characters (maximum 3 characters, ordered by importance).
For each character, identify their name, gender, age group, appearance details mentioned (like hair color, clothing style, facial features), write a concise description in English, and extract/generate a detailed character design prompt in English consisting of keywords and descriptive phrases (max 30 words in total, separated by commas) that can be used directly for AI image generators.

Output ONLY a valid JSON array matching the structure: 
[
  {
    "name": "Character Name", 
    "description": "Character description (1-2 sentences) in English",
    "prompt": "Detailed character design prompt keywords in English (e.g. 'a middle-aged military officer with short dark hair, a mustache, wearing a rumpled blue wool uniform')"
  }
]
containing at most 3 elements. Do not include markdown tags, code blocks, or explanatory text.

Script:
${script}`;

export const getCharacterExtractPrompt = (characterDescription: string): string => `You are an expert prompt engineer. Analyze the provided image(s) showing the same main character, along with their text description: "${characterDescription || ""}".
Extract a highly detailed character design prompt in English that describes this character consistently. Focus on:
- Gender, ethnicity, and approximate age
- Facial features (eyes, nose, expression style)
- Hair style and color
- Wearing apparel/clothing details
- Distinguishing style features

Keep the output as a set of keywords or descriptive phrases separated by commas, max 30 words in total. Only return the English character prompt keywords, with no introductory text or markdown.`;

export const getCharacterRewriteBatchPrompt = (charactersJson: string, chunkJson: string, aspectRatio: string = AspectRatio.SixteenNine): string => `You are an expert prompt engineer for AI image generators. Your task is to rewrite scene prompts to naturally incorporate consistent visual descriptions of characters.

[VISUAL REFERENCE SOURCE MATERIALS (CRITICAL CONTEXT)]
- Character Visual Blueprints:
${charactersJson}

[SOFT VISUAL ALIGNMENT DIRECTIVES (CREATIVE CONSISTENCY)]
1. Character Visual Continuity (Soft Alignment):
   For each scene, identify which characters are present (by their names or descriptions in the scene text/script). If a character is present, you MUST weave their primary visual markers (e.g. hair style/color, key facial features, prominent clothing items or colors) into the rewritten prompt. However, do NOT copy specifications blindly. You MUST change their pose, body action, and facial expression to match the scene's action.
   CRITICAL DIRECTIVE: When a character is present in the scene, you MUST explicitly include the character's exact name at the beginning of their visual description in the rewritten prompt (e.g., "portraying George Armstrong Custer, a male, Caucasian, 50s with..." rather than just "portraying a male, Caucasian, 50s..."). Never omit the character's name.
2. Character Exclusion Rule:
   If a scene does not contain any characters, do NOT force or incorporate any character description; instead, rewrite it to focus purely on the scene's environment, object, or action.
3. No Metaphorical Framing: Focus strictly on the literal visual representation. Avoid books, frames, or screens.

RULES:
1. STRUCTURE MANDATE: The rewritten prompt MUST strictly follow this exact structural formula from left to right:
   - If the scene has a character: [Art style/Medium] of [Main Subject/Character] + [Action/Expression] + [Clothing details/Identifying features] + [Surrounding background] + [Lighting/Atmosphere] + [Camera angle/composition/lens].
   - If the scene does NOT have a character: [Art style/Medium] of [Main Subject (Object/Environment/Landscape/Phenomenon)] + [Details/Action/State] + [Surrounding background] + [Lighting/Atmosphere] + [Camera angle/composition/lens].
   ${CINEMATIC_PROMPT_RULES}
2. SEAMLESS INTEGRATION RULE: Do NOT simply append the character details at the end. You MUST seamlessly weave the characters' physical descriptions, clothing, and details directly into the [Main Subject] and [Action] sections of the blueprint (ONLY if the character is present).
3. Keep the scene's original action, background, setting, lighting, camera angle, and mood in their respective sections. Do NOT change the overall art style.
4. ${NO_FRAME_RULE}
5. ASPECT RATIO MANDATE: For each rewritten prompt, you MUST append the exact parameter "--ar ${aspectRatio}" at the very end of the prompt. Every prompt returned in the JSON must end with this parameter.
6. Output ONLY a valid JSON array matching the structure: [{"id": "scene_id", "prompt": "rewritten prompt"}]. Do not include markdown tags, code blocks, or explanatory text.

Input scenes:
${chunkJson}`;

export const getCharacterRewriteThumbnailsBatchPrompt = (charactersJson: string, chunkJson: string, aspectRatio: string = AspectRatio.SixteenNine): string => `You are an expert prompt engineer for AI image generators. Your task is to rewrite YouTube/TikTok cover thumbnail prompts to naturally incorporate consistent visual descriptions of the main characters.

[VISUAL REFERENCE SOURCE MATERIALS (CRITICAL CONTEXT)]
- Character Visual Blueprints:
${charactersJson}

[VISUAL ALIGNMENT DIRECTIVES (CREATIVE CONSISTENCY)]
1. Mandatory Character Integration:
   The main characters listed in the blueprint are the stars of this video. Therefore, you MUST weave their primary visual markers (e.g. hair style/color, key facial features, clothing items, age) into every rewritten thumbnail prompt. 
   If a thumbnail prompt mentions a general subject like "Union officer", "man", "soldier", "girl", "magician", or "character", you MUST replace or enrich that subject with the detailed appearance of the corresponding main character from the blueprint.
   CRITICAL DIRECTIVE: You MUST explicitly include the character's exact name at the start of their visual description in the rewritten prompt (e.g., "portraying George Armstrong Custer, a male, Caucasian, 50s with..." instead of just "portraying a male, Caucasian, 50s..."). Never omit the character's name.
2. Pose & Action Adaptation:
   Change the character's pose, body action, and facial expression to perfectly match the action described in the original thumbnail prompt.
3. Art Style & Context Preservation:
   Keep the original art style, layout, text/slogan, surrounding background, lighting, and camera angle of each thumbnail. Do NOT change them.
4. No Metaphorical Framing: Focus strictly on the literal visual representation. Avoid books, frames, or screens.

RULES:
1. STRUCTURE MANDATE: The rewritten prompt MUST strictly follow this exact structural formula from left to right:
   - If the thumbnail has a character: [Art style/Medium] of [Main Subject/Character] + [Action/Expression] + [Clothing details/Identifying features] + [Surrounding background] + [Lighting/Atmosphere] + [Camera angle/composition/lens].
   - If the thumbnail does NOT have a character: [Art style/Medium] of [Main Subject (Object/Environment/Landscape/Phenomenon)] + [Details/Action/State] + [Surrounding background] + [Lighting/Atmosphere] + [Camera angle/composition/lens].
   ${CINEMATIC_PROMPT_RULES}
2. SEAMLESS INTEGRATION RULE: Do NOT simply append the character details at the end. You MUST seamlessly weave the characters' physical descriptions, clothing, and details directly into the [Main Subject] and [Action] sections of the prompt.
3. ${NO_FRAME_RULE}
4. ASPECT RATIO MANDATE: For each rewritten prompt, you MUST append the exact parameter "--ar ${aspectRatio}" at the very end of the prompt. Every prompt returned in the JSON must end with this parameter.
5. Output ONLY a valid JSON array matching the structure: [{"id": "thumbnail_id", "prompt": "rewritten prompt"}]. Do not include markdown tags, code blocks, or explanatory text.

Input thumbnails:
${chunkJson}`;

export const STYLE_EXTRACTION_PROMPT = `Analyze the provided image(s) and extract ONLY the core art style and visual aesthetic keywords.
Ignore and DO NOT describe the subject, specific characters, objects, or actions happening in the image.
Focus entirely on visual elements:
- Character Anatomy
- Line art & Expression
- Coloring & Shading

SPECIAL RULE:
If the image shows a stick figure character style (simple sketch with black outlines, large head, exaggerated expressions, flat colors): You MUST return exactly the following style keywords in English:
"Stick figure animation, thin black outline stick figure body, enlarged head and face, thick black outline strokes, highly detailed exaggerated facial expressions, large round eyes showing irises, flat color shading, no shadows, no gradient effects, minimalist rustic color palette"

For other images: Extract and describe the style entirely in English, using short phrases separated by commas, max 3 words per phrase (e.g., "3D animation, bright colors, thick black outlines, flat colors").
Only return the list of English style keywords, with no introductory text or markdown.`;

export const getMultiStepHookPrompt = (originalInput: string, genre: string, hookType: string, duration: number, language: string, count: number): string => `You are an elite YouTube/TikTok viral content strategist and copywriting script writer.
Your mission is to perform a highly strategic 3-step pipeline for the topic: "${originalInput}".

[Genre Context]: ${genre || "Storytelling"}
[Desired Hook Style]: ${hookType || "Auto"} (options: Auto, Mystery, Shock, Drama, Curiosity, Emotional, Historical, Statistical, Question, Story)
[Target Duration Context]: ${duration || 10} seconds
[Output Language]: ${language === "vi" ? "Vietnamese" : "English"}.

Your process MUST complete all 3 steps internally:
STEP 1: Strategic Audience & Angle Analysis
Identify the primary target audience, core emotional triggers (curiosity, fear, nostalgia, shock, etc.), and 3 completely different narrative angles or hooks that grab attention in the first 3 seconds on social media.

STEP 2: Drafting Hooks
Generate exactly ${count || 3} different hooks based on the strategic insights and the topic.

STEP 3: Polish and TTS Normalization
Polish and refine the draft hooks to make them extremely punchy, catchy, smooth to read out loud, and perfect for TTS voice generation. Do NOT use special characters (*, #, _, -, [, ], /), emojis, hashtags, or markdown. Use only basic letters and punctuation.

You MUST return a valid JSON object matching this schema perfectly. Output ONLY raw JSON, with no markdown code wraps, no introductory text, and no backticks:
{
  "audience": "Description of target audience",
  "triggers": ["trigger 1", "trigger 2"],
  "angles": [
    { "name": "Angle Name", "rationale": "Why this works" }
  ],
  "versions": [
    { "id": "hk_1", "content": "Polished, extremely high-retention hook line", "type": "Style/Angle Name" }
  ]
}`;

export const getCombinedScriptPrompt = (
  originalInput: string,
  durationText: string,
  targetWordCount: number,
  genre: string,
  writingStyle: string,
  isVi: boolean,
  selectedHookText: string,
  genreGuideline: string,
  styleGuideline: string,
  audienceGuideline: string,
  targetChapterCount: number,
  hookConfig?: { type: string; duration: number; positions: string },
): string => `You are an elite, professional research director and script outline planner.
Your mission is to perform a highly unified script outline and research process for this input: "${originalInput}".

[System Configuration]:
- Target Duration: ${durationText}
- Target Word Count: EXACTLY ${targetWordCount} words total.
- Video Genre: ${genre || "Storytelling"}
- Writing Style: ${writingStyle || "Documentary"}
- Language: ${isVi ? "Vietnamese (Tiếng Việt)" : "English (Tiếng Anh)"}

[Selected Opening Hook (MANDATORY PRE-PENDED)]: "${selectedHookText || ""}"
${
  hookConfig
    ? `[Hook Retention Strategy]:
- Hook Type: ${hookConfig.type}
- Hook Duration: ${hookConfig.duration}s
- Hook Positions: ${hookConfig.positions === "start" ? "The hook is placed only at the very beginning of the script." : hookConfig.positions === "mid" ? "There must be an opening hook, and a transitional mid-roll retention hook at the beginning of the middle chapters." : "Add retention hooks at the opening, the middle chapters, and a suspenseful/cliffhanger hook at the ending chapter."}`
    : ""
}

[Guidelines]:
- Genre Guidelines: ${genreGuideline}
- Writing Style Guidelines: ${styleGuideline}
- Audience: ${audienceGuideline}

Your workflow MUST execute the following steps internally:
STEP 1: Research & Concept sheet formulation. Determine theme details, main characters visual profiles, core keywords, and preferred terms.
STEP 2: Outline creation. Plan a pacing-optimized structure split into exactly ${targetChapterCount} chapters. Provide a clear title and description for each chapter detailing what narration must cover.

[RECOMMENDED CHAPTER TITLE FORMAT]:
- If chapters/outlines are generated, it is highly recommended to keep chapter titles clean and short (e.g., "Chapter I: [Short Title]" or "Chương I: [Tiêu đề ngắn]").
- Avoid using long narration paragraphs, hook texts, or questions directly as chapter titles to keep the structure clear and readable.

You MUST return a valid JSON object matching this schema perfectly. Output ONLY raw JSON, with no markdown code wraps or backticks:
MANDATORY: You must generate at least 3 chapters in the chapters array. Do not return an empty array or change the key name under any circumstances.
{
  "theme": "Core theme details",
  "characterSpecs": "Detailed visual descriptions of main characters",
  "preferredTerms": ["preferredTerm1", "preferredTerm2"],
  "factCheckNotes": "Polished fact checking notes of the topic",
  "chapters": [
    {
      "id": "ch_1",
      "title": "Chapter I: Title of chapter",
      "description": "Detailed description of what this chapter must cover, scenes, events, and emotional arc"
    }
  ]
}`;

