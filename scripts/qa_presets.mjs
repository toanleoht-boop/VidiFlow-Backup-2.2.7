import { AUTOMATION_PRESETS } from "../src/components/PresetAutomationHub.tsx";

const allowed = {
  genre: new Set(["storytelling", "history", "mystery", "education", "review", "affiliate", "news"]),
  seoTone: new Set(["curiosity", "authority", "emotional", "direct"]),
  subtitleStyle: new Set(["modern", "boxed", "minimal", "shorts", "yellow_pop", "karaoke", "news", "neon"]),
  subtitlePosition: new Set(["bottom", "middle", "top"]),
  motionStyle: new Set(["auto", "zoom_in_center", "zoom_out_center", "pan_l_to_r", "pan_r_to_l", "pan_t_to_b", "diagonal_tl_to_br"]),
  motionIntensity: new Set(["gentle", "natural", "dynamic"]),
  aspectRatio: new Set(["16:9", "9:16", "1:1"]),
  generateType: new Set(["image", "video"]),
};

const failures = [];
const ids = new Set();
if (AUTOMATION_PRESETS.length !== 10) failures.push(`Expected 10 presets, found ${AUTOMATION_PRESETS.length}`);

for (const preset of AUTOMATION_PRESETS) {
  if (ids.has(preset.id)) failures.push(`Duplicate id: ${preset.id}`);
  ids.add(preset.id);
  if (!preset.name.trim() || !preset.imageStyle.trim()) failures.push(`${preset.id}: missing name/style`);
  const config = preset.config;
  for (const [key, values] of Object.entries(allowed)) {
    if (config[key] !== undefined && !values.has(String(config[key]))) {
      failures.push(`${preset.id}: unsupported ${key}=${config[key]}`);
    }
  }
  if (!Number.isFinite(Number(config.sceneCount)) || Number(config.sceneCount) < 1) failures.push(`${preset.id}: invalid sceneCount`);
  if (![1, 2, 3].includes(Number(config.promptsPerScene))) failures.push(`${preset.id}: invalid promptsPerScene`);
  if (![1, 2, 3].includes(Number(config.dialogueGroupSize))) failures.push(`${preset.id}: invalid dialogueGroupSize`);
  if (config.generateType === "video" && Number(config.promptsPerScene) !== 1) failures.push(`${preset.id}: video preset must use one prompt per scene`);
  if (config.subtitleEnabled && !config.subtitleStyle) failures.push(`${preset.id}: subtitle enabled without style`);
  if (config.useReferenceImages && config.noText !== true) failures.push(`${preset.id}: character reference preset must disable generated text`);
}

if (failures.length) {
  console.error(failures.map((failure) => `FAIL | ${failure}`).join("\n"));
  process.exit(1);
}

for (const preset of AUTOMATION_PRESETS) {
  console.log(`PASS | ${preset.name} | ${preset.config.generateType} | ${preset.config.sceneCount} cảnh | ${preset.config.promptsPerScene} prompt/cảnh`);
}
console.log(`SUMMARY ${AUTOMATION_PRESETS.length}/${AUTOMATION_PRESETS.length} preset hợp lệ`);
