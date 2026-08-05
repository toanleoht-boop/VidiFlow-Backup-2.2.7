export interface NicheInfo {
  category: string;
  vietnameseTitle: string;
  description: string;
  hotness: "Rất Cao" | "Cao" | "Trung Bình";
  viewSource: "Ngoại Quốc (Nhiều View)" | "Trong Nước" | "Cả hai";
  exampleChannels: string[];
  suggestedStyles: string;
}

export interface BrainstormResult {
  marketInsight: string;
  channelNameOptions: Array<{ name: string; concept: string }>;
  channelProfile: {
    description: string;
    avatarPrompt: string;
    bannerPrompt: string;
  };
  contentDirectives: string[];
}

export interface ImagePrompt {
  code: string;
  vietnameseLabel: string;
  englishPrompt: string;
  subText?: string;
  subText_vi?: string;
  subText_en?: string;
}

export interface Scene {
  sceneNumber: string;
  timeSegment: string;
  text: string;
  visualDescription: string;
  imagePrompts: ImagePrompt[];
  text_vi?: string;
  text_en?: string;
}

export interface Storyboard {
  scenes: Scene[];
  script_vi?: string;
  script_en?: string;
}

export interface SEOResults {
  seoTitle: string;
  titleOptions?: string[];
  seoDescription: string;
  tags: {
    primaryKeyword: string;
    secondaryKeyword: string;
    channelTag: string;
    competitorTags: string[];
  };
  thumbnailConcept: {
    visualIdea: string;
    thumbnailText: string;
    imagePrompt: string;
  };
  seedingComments: Array<{
    accountType: string;
    commentText: string;
  }>;
}

export interface ProductionProgress {
  selectedNiche: string;
  originalTranscript: string;
  standardizedScript: string;
  currentHook: string;
  rewrittenHookOptions: string;
  chosenHook: string;
  storyboard: Storyboard | null;
  seoAndSeeding: SEOResults | null;
  videoTitle: string;
  channelName: string;
  targetKeywords: string;
  voiceTool: string;
  editingTool: string;
  completedSteps: string[];
}

import React from "react";

export enum WizardStep {
  SourceInput = 0,
  Storyboard = 1,
  AssetManager = 2,
  SEOBoost = 3,
  Export = 4,
  IndependentGenerator = 5,
  CapCutUltra = 6,
}

export enum ProjectInputType {
  Script = "script",
  Idea = "idea",
}

export enum ProjectLanguage {
  VI = "vi",
  EN = "en",
}

export enum HookPosition {
  Start = "start",
  Mid = "mid",
  All = "all",
}

export enum AudioType {
  TTS = "tts",
  Clone = "clone",
  Upload = "upload",
  Generated = "generated",
  Simulated = "simulated",
}

export enum Gender {
  Male = "male",
  Female = "female",
  Neutral = "neutral",
}

export enum AgeGroup {
  Child = "child",
  Teen = "teen",
  Adult = "adult",
  Senior = "senior",
}

export enum AssetsMode {
  UserOnly = "user_only",
  UserFirst = "user_first",
  Mixed = "mixed",
}

export enum ImageGeneratorEngine {
  Imagen = "imagen",
  Veo3 = "veo3",
  LabsSandbox = "labs-sandbox",
}

export enum ImageGenerationMode {
  LabsFlow = "labs-flow",
  GeminiChat = "gemini-chat",
}

export enum GenerateType {
  Image = "image",
  Video = "video",
}

export enum PromptInputMethod {
  Type = "type",
  Paste = "paste",
}

export enum AspectRatio {
  SixteenNine = "16:9",
  NineSixteen = "9:16",
  OneOne = "1:1",
  FourThree = "4:3",
  ThreeFour = "3:4",
}

export type AssetType = "image" | "video";

export type TooltipPosition = "top" | "bottom" | "left" | "right";

export type ButtonVariant = "primary" | "secondary" | "danger" | "ghost" | "outline" | "unstyled";

export interface ProjectInput {
  type: ProjectInputType;
  content: string;
}

export interface ProjectConfig {
  genre: string;
  language: ProjectLanguage;
  duration: string;
  targetDuration?: string;
  rewriteLevel: number;
  similarityReduction: number;
  creativityLevel: number;
  factCheck: boolean;
  audience: string;
  writingStyle: string;
  format?: string;
  splitStrategy?: string;
}

export interface HookVersion {
  id: string;
  content: string;
  type: string;
  selected: boolean;
}

export interface HookConfig {
  type: string;
  duration: number;
  count: number;
  positions: HookPosition;
  versions: HookVersion[];
}

export interface VoiceConfig {
  provider: string;
  audioType: AudioType;
  voiceName?: string;
  gender: Gender;
  age: AgeGroup;
  emotion: string;
  speed: number;
  pitch?: number;
  volume?: number;
  voiceURI?: string;
  previewUrl?: string;
  audioUrl?: string;
  audioBase64?: string;
  uploadedAudioName?: string;
  subtitleFiles?: string[];
  timingLog?: string;
}

export interface VisualConfig {
  source: string;
  style: string;
  quality: string;
  density: number;
  characterConsistency: boolean;
  assetsMode: AssetsMode;
  stylePreset?: string;
  aspectRatio?: string;
  imageQuality?: string;
  characterConsistencyLevel?: string;
  contextConsistencyLevel?: string;
  negativePrompt?: string;
  imageGeneratorEngine?: ImageGeneratorEngine;
  thumbnailCount?: number;
  thumbnailReferenceImage?: string;
  thumbnailReferenceImages?: string[];
  thumbnailReferencePrompt?: string;
  referenceImage?: string;
  referenceImages?: string[];
  referencePrompt?: string;
  generateType?: GenerateType;
  generateCount?: number;
  promptInputMethod?: PromptInputMethod;
  characterImages?: string[];
  characterPrompt?: string;
  characterAnalysis?: string;
  characterExtracted?: boolean;
  characters?: CharacterConfig[];
  chromeHeadless?: boolean;
  generationMode?: ImageGenerationMode;
  geminiChatSpeed?: GeminiChatSpeed;
  batchDelay?: BatchDelayOption;
}

export interface CharacterConfig {
  id: string;
  name: string;
  description: string;
  images: string[];
  prompt?: string;
  extracted?: boolean;
}

export interface Chapter {
  id: string;
  title: string;
  scriptSegment: string;
}

export interface StoryboardScene {
  id: string;
  chapterId: string;
  startTime: string;
  endTime: string;
  duration: number;
  script: string;
  subtitle: string;
  prompt: string;
  assetName?: string;
  assetType?: AssetType;
  assetUrl?: string;
  assetUrls?: string[];
  audioUrl?: string;
  audioBase64?: string;
  cameraMotion: string;
  effects?: string;
  transition?: string;
}

export interface ThumbnailItem {
  id: string;
  prompt: string;
  style: string;
  hasText: boolean;
  textText?: string;
  layout?: string;
  typography?: string;
  colorSuggestion?: string;
  subjectFocus?: string;
  imageUrl?: string;
}

export interface SEOMetadata {
  text: string;
  searchScore: number;
  ctrScore: number;
  compScore: number;
  seoScore: number;
}

export interface SEOPackage {
  titles: SEOMetadata[];
  descriptions: SEOMetadata[];
  hashtags: string[];
  tags: string[];
}

export interface SavedAsset {
  id: string;
  name: string;
  type: string;
  url: string;
  sceneId?: string;
}

export interface ProjectVersion {
  id: string;
  timestamp: string;
  note: string;
  scriptPreview: string;
}

export interface SEOConfig {
  numTitles: number;
  numDescriptions: number;
  numHashtags: number;
  numTags: number;
}

export interface VideoProject {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  input: ProjectInput;
  config: ProjectConfig;
  hookConfig: HookConfig;
  voiceConfig: VoiceConfig;
  visualConfig: VisualConfig;
  seoConfig?: SEOConfig;
  output?: {
    audioBase64?: string;
  };

  scriptRewritten?: string;
  factCheckNotes?: string;
  chapters?: Chapter[];
  storyboard?: StoryboardScene[];
  thumbnails?: ThumbnailItem[];
  seo?: SEOPackage;
  assets?: SavedAsset[];

  creditsUsed: number;
  currentStep?: WizardStep;
  versionHistory?: ProjectVersion[];
  allowBulkDeleteImages?: boolean;
  isRecreatingStoryboard?: boolean;
}

export interface PipelineWizardProps {
  theme?: string;
  currentLang?: string;
  project: VideoProject;
  setProject: (p: VideoProject) => void;
  onSaveProject: (p: VideoProject) => Promise<void> | void;
  onBackToDashboard: () => void;
  costTracker?: any;
  setCostTracker?: any;
  credits?: any;
  setCredits?: any;
}

export interface IBaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string | React.ReactNode;
  children?: React.ReactNode;
  maxWidth?: string;
}

export interface ITooltipProps {
  content: string;
  children: React.ReactNode;
  position?: TooltipPosition;
}

export interface IBaseButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  isLoading?: boolean;
  size?: "xs" | "sm" | "md" | "lg";
}

export interface Voice {
  voiceURI: string;
  name: string;
  lang: string;
  localService: boolean;
  default: boolean;
  gender?: string;
  [key: string]: any;
}

export enum GeminiChatSpeed {
  Slow = "1",
  Normal = "3",
  Fast = "5",
  SuperFast = "7",
  HyperFast = "10",
}

export const GEMINI_CHAT_SPEED_TAB_COUNT: Record<GeminiChatSpeed, number> = {
  [GeminiChatSpeed.Slow]: 1,
  [GeminiChatSpeed.Normal]: 3,
  [GeminiChatSpeed.Fast]: 5,
  [GeminiChatSpeed.SuperFast]: 7,
  [GeminiChatSpeed.HyperFast]: 10,
};

export enum GeminiChatModelName {
  Pro = "Pro",
  Flash = "Flash",
  FlashLite = "Flash-Lite",
}

export enum GeminiChatSelector {
  Input = 'div.ql-editor[contenteditable="true"]',
  InputTextarea = 'div.ql-editor[contenteditable="true"], div[role="textbox"][contenteditable="true"]',
  ModelPickerButton = 'button[data-test-id="bard-mode-menu-button"], button.input-area-switch',
  PlusButton = 'button[aria-label*="tải lên" i], button[aria-label*="công cụ" i], gem-icon-button:has(mat-icon[fonticon="plus"]) button',
  MenuOptions = '.cdk-overlay-pane button, mat-menu button, [role="menuitem"]',
  PlusMenuOptions = '.cdk-overlay-pane button, mat-action-list button, [role="menuitem"], .toolbox-drawer-item-content-wrapper',
  SendButton = 'button[aria-label*="Gửi" i], button[aria-label*="Send" i], gem-icon-button.send-button button, div.send-button-container button',
}

export enum GeminiChatTextOption {
  CreateVideoVi = "Tạo video",
  CreateImageVi = "Tạo hình ảnh",
  CreateVideoRegexStr = "Tạo video|Create video|Generate video|video",
  CreateImageRegexStr = "Tạo hình ảnh|Create image|Generate image|image",
}

export enum ImageModelLabel {
  Veo3 = "VEO 3.0 FLUID",
  Imagen = "IMAGEN 3 BATCH",
  LabsSandbox = "LABS SANDBOX",
}

export enum BatchDelayOption {
  Default = "default",
  OneSecond = "1s",
  TwoSeconds = "2s",
  ThreeSeconds = "3s",
  Random123 = "random123",
}


export interface ChromeProfile {
  id: string;
  name: string;
  port: number;
  concurrency: number;
  active: boolean;
  accountTier?: 'Basic' | 'Pro' | 'Ultra';
}

export interface ChromeProfilesConfig {
  profiles: ChromeProfile[];
  enabled: boolean;
}

