import React, { useState } from "react";
import { 
  FileJson, 
  HelpCircle, 
  AlertCircle, 
  Sparkles, 
  Copy, 
  Check, 
  Download, 
  CheckCircle2, 
  RefreshCw,
  FolderOpen,
  Info,
  Upload,
  Scissors,
  AudioLines,
  Volume2,
  Play,
  Pause,
  Settings,
  Music,
  FileAudio,
  PlusCircle,
  Trash2
} from "lucide-react";
import JSZip from "jszip";
import { Storyboard } from "../types";

// Hàm bổ trợ phân tích văn bản phân cảnh thô (qua dạng văn bản dán ở prompt)
export function parseStoryboardFromText(text: string): Storyboard | null {
  if (!text || !text.includes("Phân cảnh")) return null;
  
  const scenes: any[] = [];
  // Tách khối dựa vào Phân cảnh
  const blocks = text.split(/(?:---|--- |^- |^\s*|Phân cảnh|Phan canh)\s*(?:Phân cảnh|Phan canh)\s*/gi);
  
  blocks.forEach(block => {
    if (!block.trim()) return;
    
    const lines = block.split("\n");
    const firstLine = lines[0];
    
    // Trích xuất mã số cảnh
    const numMatch = firstLine.match(/(\d+)/);
    if (!numMatch) return;
    const sceneNum = numMatch[1];
    
    // Phân tích định dạng thời gian: (00:00 - 00:25) hoặc (00:15 - 00:40) -> ra đơn vị mili giây của CapCut (1s = 1000000)
    let parsedStartMs: number | null = null;
    let parsedEndMs: number | null = null;
    const timeMatch = firstLine.match(/(\d{1,2})[\s:.]+(\d{2})\s*[-–—]\s*(\d{1,2})[\s:.]+(\d{2})/);
    if (timeMatch) {
      const startMin = parseInt(timeMatch[1], 10);
      const startSec = parseInt(timeMatch[2], 10);
      const endMin = parseInt(timeMatch[3], 10);
      const endSec = parseInt(timeMatch[4], 10);
      
      parsedStartMs = (startMin * 60 + startSec) * 1000000;
      parsedEndMs = (endMin * 60 + endSec) * 1000000;
    }
    
    // Trích xuất đoạn thoại
    let dialogue = "";
    const dialogueMatch = block.match(/\[Đoạn thoại\]:\s*([\s\S]*?)(?=\[Mô tả|$)/i) || 
                           block.match(/\[Thoại\]:\s*([\s\S]*?)(?=\[Mô tả|$)/i) ||
                           block.match(/:\s*([\s\S]*?)(?=\[Mô tả|$)/i);
    if (dialogueMatch) {
      dialogue = dialogueMatch[1].trim();
    } else {
      const fallbackLine = lines.slice(1).find(line => {
        const l = line.trim();
        return l.length > 15 && !l.startsWith("+") && !l.includes("[") && !l.toLowerCase().includes("prompt");
      });
      if (fallbackLine) {
        dialogue = fallbackLine.trim();
      }
    }
    
    scenes.push({
      sceneNumber: sceneNum,
      text: dialogue,
      timeSegment: firstLine.includes("-") ? firstLine.match(/\((.*?)\)/)?.[1] || undefined : undefined,
      parsedStartMs,
      parsedEndMs,
      imagePrompts: []
    });
  });
  
  if (scenes.length > 0) {
    return { scenes };
  }
  return null;
}

// Hàm đồng bộ chính
interface SyncResult {
  success: boolean;
  message: string;
  matchedImagesCount: number;
  matchedSubtitlesCount: number;
  totalDurationSeconds: number;
  scenesReport: Array<{
    sceneNum: string;
    subtitlesCount: number;
    imagesCount: number;
    startSec: number;
    endSec: number;
    imageNames: string[];
  }>;
  updatedJsonString: string;
}

function getBaseFileName(pathOrName: string): string {
  if (!pathOrName) return "";
  const parts = pathOrName.split(/[\\/]/);
  return parts[parts.length - 1];
}

function runCapCutSync(draftJson: string, storyboard: Storyboard | null, customText?: string, dialogueSplitEnabled?: boolean): SyncResult {
  try {
    const draft = JSON.parse(draftJson);
    if (!draft || typeof draft !== "object") {
      throw new Error("Dữ liệu nhập vào không đúng định dạng JSON.");
    }

    // Ưu tiên nạp kịch bản từ text người dùng dán vào, nếu không có mới dùng từ Bước 3
    let activeStoryboard = storyboard;
    if (customText && customText.trim()) {
      const parsed = parseStoryboardFromText(customText);
      if (parsed && parsed.scenes.length > 0) {
        activeStoryboard = parsed;
      }
    }

    if (!activeStoryboard || !activeStoryboard.scenes || activeStoryboard.scenes.length === 0) {
      throw new Error("Không thể xác định danh sách phân cảnh. Vui lòng hoàn thành phần chia cảnh ở Bước 2 hoặc dán danh sách phân cảnh thoại vào ô cấu trúc!");
    }

    // 1. Phân tích văn bản phụ đề vật liệu
    const textMaterialsMap = new Map<string, string>();
    if (draft.materials && Array.isArray(draft.materials.texts)) {
      draft.materials.texts.forEach((txt: any) => {
        if (txt && txt.id && typeof txt.content === "string") {
          // Xử lý các tag màu hoặc định dạng CapCut: [color=#ffffff]phụ đề[/color]
          const cleanedText = txt.content.replace(/\[\/?.*?\]/g, "").trim();
          textMaterialsMap.set(txt.id, cleanedText);
        }
      });
    }

    // Ghép nốt phụ đề từ timeline
    const subtitles: Array<{
      id: string;
      start: number;
      duration: number;
      end: number;
      text: string;
    }> = [];

    if (Array.isArray(draft.tracks)) {
      draft.tracks.forEach((track: any) => {
        if (track && track.type === "text" && Array.isArray(track.segments)) {
          track.segments.forEach((seg: any) => {
            if (seg && seg.target_timerange) {
              const s = Number(seg.target_timerange.start) || 0;
              const d = Number(seg.target_timerange.duration) || 0;
              const text = (seg.material_id ? textMaterialsMap.get(seg.material_id) : "") || "";
              subtitles.push({
                id: seg.id,
                start: s,
                duration: d,
                end: s + d,
                text
              });
            }
          });
        }
      });
    }

    // Sắp xếp phụ đề theo thời gian tăng dần
    subtitles.sort((a, b) => a.start - b.start);

    // Xác định thời gian tối đa
    const maxTime = subtitles.reduce((max, sub) => Math.max(max, sub.end), 0);

    // Xác định thời gian tối đa tuyệt đối dựa trên cả phụ đề và các segments âm thanh/hình ảnh khác (để tránh nhạc nền quá dài nhưng vẫn ôm trọn voiceover)
    let absoluteMaxTime = maxTime;
    if (Array.isArray(draft.tracks)) {
      draft.tracks.forEach((track: any) => {
        if (track && (track.type === "text" || track.type === "audio" || track.type === "video")) {
          if (Array.isArray(track.segments)) {
            track.segments.forEach((seg: any) => {
              if (seg && seg.target_timerange) {
                const s = Number(seg.target_timerange.start) || 0;
                const d = Number(seg.target_timerange.duration) || 0;
                if (s + d > absoluteMaxTime) {
                  absoluteMaxTime = s + d;
                }
              }
            });
          }
        }
      });
    }

    const finalLimit = Math.max(maxTime, absoluteMaxTime);

    // 2. So khớp phụ đề với các Storyboard Scenes
    const cleanWords = (txt: string): string[] => {
      return txt
        .toLowerCase()
        .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"\n\r]/g, " ")
        .split(/\s+/)
        .filter((w) => w.length > 1);
    };

    const sceneWordsList = activeStoryboard.scenes.map((scene) => ({
      wordsSet: new Set(cleanWords(scene.text)),
      rawText: scene.text
    }));

    const numSubs = subtitles.length;
    const numScenes = activeStoryboard.scenes.length;
    let subMappings = Array(numSubs).fill(-1);

    if (numSubs > 0 && numScenes > 0) {
      if (numSubs >= numScenes) {
        // Mô hình DP căn biên tối ưu chuẩn (Contiguous Sequence Alignment)
        // dp[i][s] là chi phí/điểm số tích lũy tối ưu gán phụ đề i cho cảnh s
        // Để tránh chồng chéo nhảy cóc, sPrev chỉ có thể là s (ở lại cảnh s) hoặc s - 1 (vừa chuyển sang s)
        const dp = Array.from({ length: numSubs }, () => Array(numScenes).fill(-Infinity));
        const parent = Array.from({ length: numSubs }, () => Array(numScenes).fill(-1));

        // Khởi tạo phụ đề thứ nhất chỉ có thể nằm ở Cảnh 0
        const subWords0 = cleanWords(subtitles[0].text);
        let overlap0 = 0;
        subWords0.forEach((w) => {
          if (sceneWordsList[0].wordsSet.has(w)) overlap0++;
        });
        const progressBias0 = 1.0; // Khoảng cách lý thuyết bằng 0
        dp[0][0] = overlap0 * 4.0 + progressBias0 * 3.0;
        parent[0][0] = -1;

        // Tiến trình quy hoạch động
        for (let i = 1; i < numSubs; i++) {
          const subWords = cleanWords(subtitles[i].text);
          
          // Tính điểm số trùng khớp & bias phân bố đều đặn lý thuyết
          const matchScores = Array(numScenes).fill(0);
          for (let s = 0; s < numScenes; s++) {
            let overlap = 0;
            subWords.forEach((w) => {
              if (sceneWordsList[s].wordsSet.has(w)) overlap++;
            });
            const progressBias = 1.0 - Math.abs((i / numSubs) - (s / numScenes));
            matchScores[s] = overlap * 4.0 + progressBias * 3.0;
          }

          for (let s = 0; s < numScenes; s++) {
            let maxVal = -Infinity;
            let bestPrev = -1;

            // Lựa chọn 1: Tiếp tục ở cảnh cũ s
            if (dp[i - 1][s] > maxVal) {
              maxVal = dp[i - 1][s];
              bestPrev = s;
            }
            // Lựa chọn 2: Chuyển tiếp từ cảnh s - 1 trước đó
            if (s > 0 && dp[i - 1][s - 1] > maxVal) {
              maxVal = dp[i - 1][s - 1];
              bestPrev = s - 1;
            }

            if (maxVal !== -Infinity) {
              dp[i][s] = matchScores[s] + maxVal;
              parent[i][s] = bestPrev;
            }
          }
        }

        // Truy vết ngược, mặc định kết thúc tối ưu ở phân cảnh cuối cùng
        let bestEndScene = numScenes - 1;
        if (dp[numSubs - 1][bestEndScene] === -Infinity) {
          let maxFinalScore = -Infinity;
          for (let s = 0; s < numScenes; s++) {
            if (dp[numSubs - 1][s] > maxFinalScore) {
              maxFinalScore = dp[numSubs - 1][s];
              bestEndScene = s;
            }
          }
        }

        let currScene = bestEndScene;
        for (let i = numSubs - 1; i >= 0; i--) {
          subMappings[i] = currScene;
          if (currScene !== -1 && parent[i][currScene] !== undefined && parent[i][currScene] !== -1) {
            currScene = parent[i][currScene];
          } else {
            currScene = Math.max(0, currScene - 1);
          }
        }
      } else {
        // Trường hợp khẩn cấp: Ít câu thoại hơn số lượng cảnh
        subMappings = subtitles.map((_, i) => {
          return Math.min(Math.floor((i / numSubs) * numScenes), numScenes - 1);
        });
      }
    }

    // Phân tách ảo các phụ đề dài chứa từ khóa của cả hai phân cảnh (Boundary detection & splits)
    const virtualSubtitles: Array<{
      id: string;
      start: number;
      duration: number;
      end: number;
      text: string;
      mappedSceneIdx: number;
    }> = [];

    const getWordsWithOffsets = (text: string) => {
      const words: Array<{ word: string; start: number; end: number }> = [];
      const regex = /[^\s.,\/#!$%\^&\*;:{}=\-_`~()?"']+/g;
      let match;
      while ((match = regex.exec(text)) !== null) {
        words.push({
          word: match[0].toLowerCase(),
          start: match.index,
          end: match.index + match[0].length
        });
      }
      return words;
    };

    const trySplitSubtitle = (subText: string, setA: Set<string>, setB: Set<string>) => {
      const words = getWordsWithOffsets(subText);
      if (words.length < 2) return null;

      let bestP = -1;
      let maxScore = -Infinity;
      let bestDist = Infinity;

      for (let p = 1; p < words.length; p++) {
        let score = 0;
        let hasLeftMatch = false;
        let hasRightMatch = false;

        for (let j = 0; j < words.length; j++) {
          const w = words[j].word;
          const isA = setA.has(w);
          const isB = setB.has(w);

          if (j < p) {
            if (isA && !isB) {
              score += 2;
              hasLeftMatch = true;
            } else if (isB && !isA) {
              score -= 2;
            }
          } else {
            if (isB && !isA) {
              score += 2;
              hasRightMatch = true;
            } else if (isA && !isB) {
              score -= 2;
            }
          }
        }

        if (hasLeftMatch && hasRightMatch && score > 0) {
          const dist = Math.abs(p - words.length / 2);
          if (score > maxScore || (score === maxScore && dist < bestDist)) {
            maxScore = score;
            bestP = p;
            bestDist = dist;
          }
        }
      }

      if (bestP !== -1) {
        const splitCharIdx = words[bestP - 1].end;
        return { splitCharIdx, score: maxScore };
      }
      return null;
    };

    subtitles.forEach((sub, i) => {
      const S = subMappings[i];
      if (S === -1) {
        virtualSubtitles.push({
          id: sub.id,
          start: sub.start,
          duration: sub.duration,
          end: sub.end,
          text: sub.text,
          mappedSceneIdx: -1
        });
        return;
      }

      let bestSplit: { S_a: number; S_b: number; splitCharIdx: number; score: number } | null = null;

      // Thử split giữa S-1 và S
      if (S - 1 >= 0) {
        const setA = sceneWordsList[S - 1].wordsSet;
        const setB = sceneWordsList[S].wordsSet;
        const splitRes = trySplitSubtitle(sub.text, setA, setB);
        if (splitRes) {
          bestSplit = { S_a: S - 1, S_b: S, splitCharIdx: splitRes.splitCharIdx, score: splitRes.score };
        }
      }

      // Thử split giữa S và S+1
      if (S + 1 < numScenes) {
        const setA = sceneWordsList[S].wordsSet;
        const setB = sceneWordsList[S + 1].wordsSet;
        const splitRes = trySplitSubtitle(sub.text, setA, setB);
        if (splitRes && (!bestSplit || splitRes.score > bestSplit.score)) {
          bestSplit = { S_a: S, S_b: S + 1, splitCharIdx: splitRes.splitCharIdx, score: splitRes.score };
        }
      }

      if (bestSplit) {
        const splitRatio = Math.max(0.1, Math.min(0.9, bestSplit.splitCharIdx / sub.text.length));
        const splitTime = sub.start + Math.round(splitRatio * sub.duration);
        
        virtualSubtitles.push({
          id: `${sub.id}-partA`,
          start: sub.start,
          duration: splitTime - sub.start,
          end: splitTime,
          text: sub.text.substring(0, bestSplit.splitCharIdx).trim(),
          mappedSceneIdx: bestSplit.S_a
        });

        virtualSubtitles.push({
          id: `${sub.id}-partB`,
          start: splitTime,
          duration: sub.end - splitTime,
          end: sub.end,
          text: sub.text.substring(bestSplit.splitCharIdx).trim(),
          mappedSceneIdx: bestSplit.S_b
        });
      } else {
        virtualSubtitles.push({
          id: sub.id,
          start: sub.start,
          duration: sub.duration,
          end: sub.end,
          text: sub.text,
          mappedSceneIdx: S
        });
      }
    });

    // Thiết lập điểm đầu & điểm cuối thời gian cho mỗi Cảnh
    const sceneRanges = activeStoryboard.scenes.map((scene: any, idx) => {
      return {
        sceneIndex: idx,
        start: (scene.parsedStartMs !== undefined && scene.parsedStartMs !== null) ? scene.parsedStartMs : -1,
        end: (scene.parsedEndMs !== undefined && scene.parsedEndMs !== null) ? scene.parsedEndMs : -1,
        subtitlesCount: 0
      };
    });

    // Điền mốc thời gian phụ đề khớp từ thuật toán
    virtualSubtitles.forEach((sub) => {
      const idx = sub.mappedSceneIdx;
      if (idx !== -1 && idx < sceneRanges.length) {
        sceneRanges[idx].subtitlesCount++;
        
        // Cập nhật lại dải biên
        if (sceneRanges[idx].start === -1 || sub.start < sceneRanges[idx].start) {
          sceneRanges[idx].start = sub.start;
        }
        if (sceneRanges[idx].end === -1 || sub.end > sceneRanges[idx].end) {
          sceneRanges[idx].end = sub.end;
        }
      }
    });

    // Điền khoảng trống các cảnh không có phụ đề trực tiếp (Căn lấp nốt ranh giới)
    for (let i = 0; i < sceneRanges.length; i++) {
      if (sceneRanges[i].start === -1) {
        const prevEnd = i > 0 ? sceneRanges[i - 1].end : 0;
        let nextStart = finalLimit || 30000000; 
        for (let j = i + 1; j < sceneRanges.length; j++) {
          if (sceneRanges[j].start !== -1) {
            nextStart = sceneRanges[j].start;
            break;
          }
        }
        sceneRanges[i].start = prevEnd;
        sceneRanges[i].end = Math.max(prevEnd, nextStart);
      }
    }

    // Đảm bảo không có cảnh nào bị cóp ép quá mức nhỏ hơn định mức tối thiểu
    const minDur = Math.max(1500000, Math.floor((finalLimit || 30000000) / (sceneRanges.length * 2))); 
    for (let i = 0; i < sceneRanges.length; i++) {
      let segmentDuration = sceneRanges[i].end - sceneRanges[i].start;
      if (segmentDuration < minDur) {
        sceneRanges[i].end = sceneRanges[i].start + minDur;
      }
    }

    // Nối biên nối liền mạch và bảo vệ thời lượng tối thiểu của cảnh tiếp theo
    for (let i = 0; i < sceneRanges.length - 1; i++) {
      sceneRanges[i + 1].start = sceneRanges[i].end;
      if (sceneRanges[i + 1].end < sceneRanges[i + 1].start + minDur) {
        sceneRanges[i + 1].end = sceneRanges[i + 1].start + minDur;
      }
    }

    if (sceneRanges.length > 0) {
      sceneRanges[0].start = 0;
      if (finalLimit > 0) {
        sceneRanges[sceneRanges.length - 1].end = finalLimit;
      }
    }

    // 3. Quét tệp ảnh vật liệu đã nạp trong CapCut
    const assets: Array<{
      id: string;
      name: string;
      sceneIndex: number;
      promptIndex: number;
    }> = [];

    const searchMaterials = (list: any[]) => {
      if (!Array.isArray(list)) return;
      list.forEach((mat: any) => {
        if (!mat || !mat.id) return;

        // Độ ưu tiên quét tên nhãn trùng khớp
        const candidateNames: string[] = [];
        const prioritizedKeys = ["name", "file_name", "file_Name", "material_name", "path"];
        
        prioritizedKeys.forEach((key) => {
          if (typeof mat[key] === "string" && mat[key]) {
            candidateNames.push(mat[key]);
          }
        });

        Object.keys(mat).forEach((key) => {
          if (!prioritizedKeys.includes(key) && typeof mat[key] === "string" && mat[key]) {
            candidateNames.push(mat[key]);
          } else if (mat[key] && typeof mat[key] === "object") {
            Object.keys(mat[key]).forEach((subKey) => {
              if (typeof mat[key][subKey] === "string" && mat[key][subKey]) {
                candidateNames.push(mat[key][subKey]);
              }
            });
          }
        });

        const displayName = mat.name || mat.file_name || mat.file_Name || mat.material_name || mat.path || mat.id;
        let foundMatch = false;

        for (const rawName of candidateNames) {
          if (foundMatch) break;
          const nm = getBaseFileName(rawName).toLowerCase();
          
          // Pattern regex siêu bền cho P1.2, P1_2, [P1-1], P1 1 hay Cảnh 1 Prompt 1
          const match = nm.match(/(?:^|[^a-z0-9])p0*(\d+)[._-\s]+0*(\d+)/i) || 
                        nm.match(/p0*(\d+)[._-]0*(\d+)/i) || 
                        nm.match(/p0*(\d+)0*(\d+)/i) || 
                        nm.match(/phân cảnh\s*0*(\d+).*?prompt\s*0*(\d+)/i) ||
                        nm.match(/cảnh\s*0*(\d+).*?prompt\s*0*(\d+)/i);
                        
          if (match) {
            const scNum = parseInt(match[1], 10);
            const prNum = parseInt(match[2], 10);
            if (scNum >= 1 && scNum <= activeStoryboard!.scenes.length) {
              assets.push({
                id: mat.id,
                name: getBaseFileName(displayName),
                sceneIndex: scNum - 1,
                promptIndex: prNum
              });
              foundMatch = true;
            }
          } else {
            // Khớp dự phòng rộng theo cụm P1
            const broadMatch = nm.match(/(?:^|[^a-z0-9])p0*(\d+)(?:[^a-z0-9]|$)/i) || nm.match(/p0*(\d+)/i);
            if (broadMatch) {
              const scNum = parseInt(broadMatch[1], 10);
              if (scNum >= 1 && scNum <= activeStoryboard!.scenes.length) {
                assets.push({
                  id: mat.id,
                  name: getBaseFileName(displayName),
                  sceneIndex: scNum - 1,
                  promptIndex: 99
                });
                foundMatch = true;
              }
            }
          }
        }
      });
    };

    if (draft.materials) {
      if (Array.isArray(draft.materials)) {
        searchMaterials(draft.materials);
      } else if (typeof draft.materials === "object") {
        Object.keys(draft.materials).forEach((key) => {
          const val = draft.materials[key];
          if (Array.isArray(val)) {
            searchMaterials(val);
          } else if (val && typeof val === "object") {
            const children = Object.values(val);
            const looksLikeAssetList = children.some((c: any) => c && typeof c === "object" && c.id);
            if (looksLikeAssetList) {
              searchMaterials(children);
            } else {
              children.forEach((child: any) => {
                if (Array.isArray(child)) {
                  searchMaterials(child);
                }
              });
            }
          }
        });
      }
    }

    if (assets.length === 0) {
      throw new Error("Không tìm thấy tài nguyên ảnh AI nào có nhãn phân cảnh dạng [P1.1], P1.2, [P2.1]... trong CapCut project. Hãy kéo thả tất cả ảnh đã tải về máy vào thư viện Media của CapCut trước khi thực hiện xuất file JSON!");
    }

    // gom nhóm ảnh theo phân cảnh
    const sceneAssets: Array<typeof assets> = activeStoryboard.scenes.map(() => []);
    assets.forEach((asset) => {
      sceneAssets[asset.sceneIndex].push(asset);
    });

    sceneAssets.forEach((subList) => {
      subList.sort((a, b) => a.promptIndex - b.promptIndex);
    });

    // 4. Cấu hình lại trục thời gian trong track Video của CapCut
    if (!Array.isArray(draft.tracks)) {
      draft.tracks = [];
    }

    const imageAssetIdsMap = new Set(assets.map((a) => a.id));

    // Tìm khuôn mẫu Segment cũ để giữ lại cài đặt Scale, Transform, Speed... cho người dùng
    const segmentTemplates = new Map<string, any>();
    draft.tracks.forEach((track: any) => {
      if (track && track.type === "video" && Array.isArray(track.segments)) {
        track.segments.forEach((seg: any) => {
          if (seg && seg.material_id && imageAssetIdsMap.has(seg.material_id)) {
            if (!segmentTemplates.has(seg.material_id)) {
              segmentTemplates.set(seg.material_id, JSON.parse(JSON.stringify(seg)));
            }
          }
        });
      }
    });

    // Tìm track video (Track chính có nhiều ảnh nhất)
    let videoTrack: any = null;
    let maxImageSegments = -1;

    if (Array.isArray(draft.tracks)) {
      draft.tracks.forEach((track: any) => {
        if (track && track.type === "video" && Array.isArray(track.segments)) {
          let count = 0;
          track.segments.forEach((seg: any) => {
            if (seg && seg.material_id && imageAssetIdsMap.has(seg.material_id)) {
              count++;
            }
          });
          if (count > maxImageSegments) {
            maxImageSegments = count;
            videoTrack = track;
          }
        }
      });
    }

    if (!videoTrack) {
      videoTrack = draft.tracks.find((t: any) => t && t.type === "video");
    }

    if (!videoTrack) {
      videoTrack = {
        id: "generated-video-track-id",
        type: "video",
        segments: []
      };
      draft.tracks.push(videoTrack);
    }

    // Dọn các segment cũ liên kết với các ảnh này để tự động chèn đồng bộ phẳng không chồng chéo
    const otherSegments = (videoTrack.segments || []).filter(
      (seg: any) => seg && !imageAssetIdsMap.has(seg.material_id)
    );

    const newPictureSegments: any[] = [];
    const generateSegmentId = () => {
      return "SGM-" + Math.random().toString(36).substr(2, 9).toUpperCase();
    };

    const scenesReport: any[] = [];

    activeStoryboard.scenes.forEach((scene, sIdx) => {
      const range = sceneRanges[sIdx];
      const matchImages = sceneAssets[sIdx];
      const subCount = range.subtitlesCount;

      scenesReport.push({
        sceneNum: scene.sceneNumber || (sIdx + 1).toString(),
        subtitlesCount: subCount,
        imagesCount: matchImages.length,
        startSec: Number((range.start / 1000000).toFixed(2)),
        endSec: Number((range.end / 1000000).toFixed(2)),
        imageNames: matchImages.map((a) => a.name)
      });

      if (matchImages.length === 0) return;

      let segTimes: Array<{ start: number; duration: number }> = [];

      if (dialogueSplitEnabled) {
        // Tìm các câu phụ đề đã được map vào phân cảnh này
        const sSubs = virtualSubtitles
          .filter((sub) => sub.mappedSceneIdx === sIdx)
          .sort((a, b) => a.start - b.start);

        if (sSubs.length > 0) {
          // Tính thời điểm bắt đầu cho từng ảnh để bám khít sát câu thoại
          const starts: number[] = [];
          matchImages.forEach((_, jIdx) => {
            if (jIdx === 0) {
              starts.push(range.start);
            } else {
              // Phân bổ đều ảnh theo các câu phụ đề trong phân cảnh
              const subIdx = Math.min(
                Math.floor((jIdx / matchImages.length) * sSubs.length),
                sSubs.length - 1
              );
              starts.push(sSubs[subIdx].start);
            }
          });

          // Tính độ dài kéo giãn phủ kín không để khoảng đen (gap) giữa các ảnh
          matchImages.forEach((_, jIdx) => {
            const s = starts[jIdx];
            const nextS = (jIdx < matchImages.length - 1) ? starts[jIdx + 1] : range.end;
            const d = Math.max(100000, nextS - s); // Cam kết tối thiểu 100ms
            segTimes.push({ start: s, duration: d });
          });
        }
      }

      // Fallback chia đều bình thường khi tắt tính năng nâng cao hoặc cảnh không có subtitles
      if (segTimes.length === 0) {
        const duration = range.end - range.start;
        const slotDuration = Math.round(duration / matchImages.length);
        matchImages.forEach((_, jIdx) => {
          const s = range.start + jIdx * slotDuration;
          const d = (jIdx === matchImages.length - 1) ? (range.end - s) : slotDuration;
          segTimes.push({ start: s, duration: d });
        });
      }

      matchImages.forEach((img, jIdx) => {
        const { start: segStart, duration: actualSlotDur } = segTimes[jIdx];

        const template = segmentTemplates.get(img.id);

        const newSeg = template ? {
          ...template,
          id: generateSegmentId(),
          target_timerange: {
            duration: actualSlotDur,
            start: segStart
          },
          source_timerange: {
            duration: actualSlotDur,
            start: template.source_timerange ? (template.source_timerange.start || 0) : 0
          }
        } : {
          id: generateSegmentId(),
          material_id: img.id,
          target_timerange: {
            duration: actualSlotDur,
            start: segStart
          },
          source_timerange: {
            duration: actualSlotDur,
            start: 0
          },
          extra_material_refs: [],
          render_level: 0,
          scale: { "x": 1.0, "y": 1.0 },
          speed: 1.0,
          volume: 1.0,
          visible: true
        };

        newPictureSegments.push(newSeg);
      });
    });

    const combinedSegments = [...otherSegments, ...newPictureSegments];
    combinedSegments.sort((a, b) => {
      const startA = a?.target_timerange?.start || 0;
      const startB = b?.target_timerange?.start || 0;
      return startA - startB;
    });

    videoTrack.segments = combinedSegments;

    // Cập nhật lại thời lượng và tổng tài nguyên
    return {
      success: true,
      message: "Tuyệt vời! Đã đồng bộ thành công timeline phân bổ ảnh đều khớp rảnh âm thoại!",
      matchedImagesCount: assets.length,
      matchedSubtitlesCount: subtitles.length,
      totalDurationSeconds: Number((finalLimit / 1000000).toFixed(2)),
      scenesReport,
      updatedJsonString: JSON.stringify(draft, null, 2)
    };

  } catch (err: any) {
    return {
      success: false,
      message: err.message || "Xảy ra lỗi không thể đọc tệp CapCut JSON.",
      matchedImagesCount: 0,
      matchedSubtitlesCount: 0,
      totalDurationSeconds: 0,
      scenesReport: [],
      updatedJsonString: ""
    };
  }
}

// ================= HELPERS FOR VOICE MERGING & SCRIPTS CORRELATING =================

export function mergeAudioBuffers(buffers: AudioBuffer[], ctx: AudioContext): AudioBuffer {
  if (buffers.length === 0) {
    throw new Error("Không có dữ liệu âm thanh để gộp.");
  }
  if (buffers.length === 1) return buffers[0];

  const totalLength = buffers.reduce((sum, b) => sum + b.length, 0);
  const sampleRate = buffers[0].sampleRate;
  const numberOfChannels = buffers[0].numberOfChannels;

  const mergedBuffer = ctx.createBuffer(numberOfChannels, totalLength, sampleRate);

  for (let channel = 0; channel < numberOfChannels; channel++) {
    let offset = 0;
    const channelData = mergedBuffer.getChannelData(channel);
    for (let i = 0; i < buffers.length; i++) {
      const b = buffers[i];
      if (channel < b.numberOfChannels) {
        channelData.set(b.getChannelData(channel), offset);
      } else {
        channelData.set(b.getChannelData(0), offset);
      }
      offset += b.length;
    }
  }
  return mergedBuffer;
}

export function getTimelineTextParts(storyboard: any): string[] {
  if (!storyboard || !storyboard.scenes) return [];
  const parts: string[] = [];
  storyboard.scenes.forEach((scene: any) => {
    const prompts = scene.imagePrompts || [];
    if (prompts.length <= 1) {
      const p0 = prompts[0];
      if (p0 && p0.subText) {
        parts.push(p0.subText);
      } else {
        parts.push(scene.text || `Phân cảnh ${scene.sceneNumber || ""}`);
      }
    } else {
      prompts.forEach((p: any, idx: number) => {
        if (p.subText) {
          parts.push(p.subText);
        } else if (p.vietnameseLabel) {
          parts.push(p.vietnameseLabel);
        } else {
          parts.push(`${scene.text || ""} (Đoạn ${idx + 1})`);
        }
      });
    }
  });
  return parts;
}

export function splitVoiceProportionalWithSilenceAlignment(
  audioBuffer: AudioBuffer,
  textParts: string[],
  silenceThreshold: number
): Array<{ start: number; end: number }> {
  const totalDuration = audioBuffer.duration;
  const sampleRate = audioBuffer.sampleRate;
  const channelData = audioBuffer.getChannelData(0);
  const totalLength = channelData.length;

  if (textParts.length === 0) return [];

  // Tính số từ tiếng Việt trong mỗi phần kịch bản để làm trọng số (gốc từ Bước 3)
  const cleanAndCount = (t: string) => {
    return t.replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "").trim().split(/\s+/).filter(Boolean).length || 5;
  };

  const weights = textParts.map(t => cleanAndCount(t));
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);

  // Sinh ra các mốc thời gian lý tưởng hoàn hảo dựa trên tỷ lệ chữ
  const idealTimes: number[] = [0];
  let elapsed = 0;
  for (let i = 0; i < textParts.length - 1; i++) {
    const duration = totalDuration * (weights[i] / totalWeight);
    elapsed += duration;
    idealTimes.push(elapsed);
  }
  idealTimes.push(totalDuration);

  // Điều chỉnh mốc cắt sao cho rơi vào khoảng lặng thực sự, tránh băm vụn hoặc cắt trúng từ đang phát âm
  const finalCutPoints: number[] = [0];
  const scanWindowSec = 1.2; // Tăng lên 1.2s để tăng vùng tìm kiếm khoảng lặng tối ưu xung quanh điểm chia lý tưởng
  const frameSize = Math.floor(sampleRate * 0.02); // Khung 20ms để tính toán RMS chuẩn xác

  for (let idx = 1; idx < idealTimes.length - 1; idx++) {
    const idealTime = idealTimes[idx];
    const prevCutPoint = finalCutPoints[finalCutPoints.length - 1];

    // Xác định khoảng thời gian tối thiểu cho phân cảnh trước đó dựa vào số lượng từ tiếng Việt
    // Chẳng hạn, một từ mất ít nhất 0.16s để phát âm. Nếu câu có 5 từ thì tối thiểu phải tốn 0.8 giây.
    const minWords = weights[idx - 1] || 4;
    const minDurationAllowed = Math.max(0.7, Math.min(1.8, minWords * 0.18));

    const idealSample = Math.floor(idealTime * sampleRate);
    const startSample = Math.max(
      Math.floor((prevCutPoint + minDurationAllowed) * sampleRate),
      idealSample - Math.floor(scanWindowSec * sampleRate)
    );
    const endSample = Math.min(
      totalLength - frameSize,
      idealSample + Math.floor(scanWindowSec * sampleRate)
    );

    let minRMS = Infinity;
    let bestCutSample = idealSample;

    // Quét tìm khoảng im lặng mượt nhất trong vùng cho phép
    for (let sample = startSample; sample <= endSample; sample += Math.floor(frameSize / 2)) {
      let sum = 0;
      for (let j = 0; j < frameSize; j++) {
        const val = channelData[sample + j];
        sum += val * val;
      }
      const rms = Math.sqrt(sum / frameSize);
      
      // Ưu tiên các điểm có cường độ âm thanh thấp nhất (khoảng lặng lấy hơi/ngưng giọng)
      if (rms < minRMS) {
        minRMS = rms;
        bestCutSample = sample + Math.floor(frameSize / 2);
      }
    }

    const adjustedTime = bestCutSample / sampleRate;

    // Ràng buộc bảo vệ: Điểm cắt không được quá sát điểm cắt trước để triệt tiêu các file voice siêu ngắn 0.1s - 0.4s
    if (adjustedTime - prevCutPoint >= minDurationAllowed) {
      finalCutPoints.push(adjustedTime);
    } else {
      // Nếu bị ép quá, chúng ta sẽ lùi điểm cắt đến mức tối thiểu bắt buộc để đảm bảo thời lượng tối mượt
      const fallbackTime = Math.min(totalDuration, prevCutPoint + minDurationAllowed);
      finalCutPoints.push(fallbackTime);
    }
  }
  
  // Đảm bảo điểm kết thúc luôn là điểm cuối video
  finalCutPoints.push(totalDuration);

  // Tạo các phân đoạn (segments) từ mốc cắt đã tối ưu
  const segments: Array<{ start: number; end: number }> = [];
  for (let i = 0; i < finalCutPoints.length - 1; i++) {
    segments.push({
      start: finalCutPoints[i],
      end: finalCutPoints[i + 1]
    });
  }
  return segments;
}

// ================= HELPERS FOR AUDIO PROCESSING & VOICE SLICING =================

export function splitVoiceAudio(
  audioBuffer: AudioBuffer,
  targetCount: number, // 0 for auto-detection
  silenceThreshold: number,
  minSilenceSec: number,
  padSec: number
): Array<{ start: number; end: number }> {
  const sampleRate = audioBuffer.sampleRate;
  const channelData = audioBuffer.getChannelData(0);
  const totalLength = channelData.length;
  
  // Frame size: 20ms
  const frameSize = Math.floor(sampleRate * 0.02);
  const totalFrames = Math.floor(totalLength / frameSize);
  
  // Compute frame RMS
  const frameRMS = new Float32Array(totalFrames);
  for (let i = 0; i < totalFrames; i++) {
    const startIdx = i * frameSize;
    let sum = 0;
    for (let j = 0; j < frameSize; j++) {
      if (startIdx + j < totalLength) {
        const val = channelData[startIdx + j];
        sum += val * val;
      }
    }
    frameRMS[i] = Math.sqrt(sum / frameSize);
  }
  
  // Smooth RMS profile (moving average of 5 frames)
  const smoothedRMS = new Float32Array(totalFrames);
  for (let i = 0; i < totalFrames; i++) {
    let sum = 0;
    let count = 0;
    for (let d = -2; d <= 2; d++) {
      if (i + d >= 0 && i + d < totalFrames) {
        sum += frameRMS[i + d];
        count++;
      }
    }
    smoothedRMS[i] = sum / count;
  }
  
  // Helper to detect segments for a given threshold
  const detectForThreshold = (threshold: number): Array<{ start: number; end: number }> => {
    const segments: Array<{ start: number; end: number }> = [];
    let inSound = false;
    let soundStartFrame = 0;
    let silenceStartFrame = 0;
    
    const minSilenceFrames = Math.max(1, Math.floor(minSilenceSec / 0.02));
    
    for (let i = 0; i < totalFrames; i++) {
      const isSilent = smoothedRMS[i] < threshold;
      
      if (!inSound) {
        if (!isSilent) {
          inSound = true;
          soundStartFrame = i;
        }
      } else {
        if (isSilent) {
          if (silenceStartFrame === 0) {
            silenceStartFrame = i;
          } else if (i - silenceStartFrame >= minSilenceFrames) {
            // Silence has persisted long enough - end current segment
            const finalEndFrame = silenceStartFrame;
            segments.push({
              start: soundStartFrame * 0.02,
              end: finalEndFrame * 0.02
            });
            inSound = false;
            silenceStartFrame = 0;
          }
        } else {
          silenceStartFrame = 0;
        }
      }
    }
    
    // Add final segment if in sound
    if (inSound) {
      segments.push({
        start: soundStartFrame * 0.02,
        end: totalFrames * 0.02
      });
    }
    
    return segments;
  };

  // Find segments
  let rawSegments: Array<{ start: number; end: number }> = [];
  
  if (targetCount > 0) {
    // If exact target segments count requested, try to sweep threshold from 0.002 to 0.12
    let bestThreshold = silenceThreshold;
    let bestDiff = Infinity;
    let bestSegments: Array<{ start: number; end: number }> = [];
    
    for (let th = 0.002; th <= 0.12; th += 0.002) {
      const segs = detectForThreshold(th);
      const diff = Math.abs(segs.length - targetCount);
      if (diff === 0) {
        bestSegments = segs;
        bestDiff = 0;
        bestThreshold = th;
        break;
      }
      if (diff < bestDiff) {
        bestDiff = diff;
        bestSegments = segs;
        bestThreshold = th;
      }
    }
    
    rawSegments = bestSegments;
    console.log(`[VoiceSplitter] Optimal threshold found: ${bestThreshold} with ${rawSegments.length} parts (target ${targetCount})`);
    
    // Adjust rawSegments to match targetCount exactly if mismatch remains
    if (rawSegments.length < targetCount && rawSegments.length > 0) {
      // Need more segments - split the longest segments at their minimum energy frame
      while (rawSegments.length < targetCount) {
        // Find longest segment
        let longestIdx = -1;
        let maxLen = 0;
        for (let i = 0; i < rawSegments.length; i++) {
          const len = rawSegments[i].end - rawSegments[i].start;
          if (len > maxLen) {
            maxLen = len;
            longestIdx = i;
          }
        }
        
        if (longestIdx === -1 || maxLen < 0.5) break; // Can't split too short segments
        
        const segToSplit = rawSegments[longestIdx];
        const startFrame = Math.floor(segToSplit.start / 0.02);
        const endFrame = Math.floor(segToSplit.end / 0.02);
        
        // Find local minimum frame in middle 50% of the segment
        let minVal = Infinity;
        let splitFrame = Math.floor((startFrame + endFrame) / 2);
        const searchStart = startFrame + Math.floor((endFrame - startFrame) * 0.25);
        const searchEnd = startFrame + Math.floor((endFrame - startFrame) * 0.75);
        
        for (let f = searchStart; f <= searchEnd; f++) {
          if (smoothedRMS[f] < minVal) {
            minVal = smoothedRMS[f];
            splitFrame = f;
          }
        }
        
        const splitSec = splitFrame * 0.02;
        rawSegments.splice(longestIdx, 1, 
          { start: segToSplit.start, end: splitSec },
          { start: splitSec, end: segToSplit.end }
        );
      }
    } else if (rawSegments.length > targetCount) {
      // Need fewer segments - merge the ones with loudest/narrowest gaps (minimal silence separation)
      while (rawSegments.length > targetCount) {
        // Find adjacent segments with lowest separation value (i.e. quietest or shortest spacing)
        let bestMergeIdx = -1;
        let minSpacing = Infinity;
        
        for (let i = 0; i < rawSegments.length - 1; i++) {
          const space = rawSegments[i+1].start - rawSegments[i].end;
          if (space < minSpacing) {
            minSpacing = space;
            bestMergeIdx = i;
          }
        }
        
        if (bestMergeIdx === -1) break;
        
        const mergedSeg = {
          start: rawSegments[bestMergeIdx].start,
          end: rawSegments[bestMergeIdx + 1].end
        };
        rawSegments.splice(bestMergeIdx, 2, mergedSeg);
      }
    }
  } else {
    // Standard auto splitting
    const rawDetected = detectForThreshold(silenceThreshold);
    // Tự động gom/gộp các đoạn nói quá nhỏ (< 0.8 giây) để tránh băm vụn 1-2 từ lẻ tẻ
    const minDur = 0.8;
    const processed: Array<{ start: number; end: number }> = [];
    
    if (rawDetected.length > 0) {
      let current = { ...rawDetected[0] };
      for (let i = 1; i < rawDetected.length; i++) {
        const next = rawDetected[i];
        if (current.end - current.start < minDur) {
          // Gộp phân đoạn hiện tại vào phân đoạn tiếp theo
          current.end = next.end;
        } else {
          processed.push(current);
          current = { ...next };
        }
      }
      if (current.end - current.start < minDur && processed.length > 0) {
        processed[processed.length - 1].end = current.end;
      } else {
        processed.push(current);
      }
      rawSegments = processed;
    } else {
      rawSegments = rawDetected;
    }
  }
  
  // Apply padding, ensure no overlaps or out of bounds
  const paddedSegments = rawSegments.map((seg, idx) => {
    let s = seg.start - padSec;
    let e = seg.end + padSec;
    
    // Bounds check with neighbor segments
    if (idx > 0) {
      const prevEnd = rawSegments[idx - 1].end;
      if (s < prevEnd) s = (seg.start + prevEnd) / 2;
    } else {
      if (s < 0) s = 0;
    }
    
    if (idx < rawSegments.length - 1) {
      const nextStart = rawSegments[idx + 1].start;
      if (e > nextStart) e = (seg.end + nextStart) / 2;
    } else {
      const maxTime = totalLength / sampleRate;
      if (e > maxTime) e = maxTime;
    }
    
    return { start: s, end: e };
  });
  
  return paddedSegments;
}

export function makeSegmentsContinuousAndCoverFullDuration(
  segments: Array<{ start: number; end: number }>,
  totalDuration: number
): Array<{ start: number; end: number }> {
  if (segments.length === 0) return [];
  
  const result: Array<{ start: number; end: number }> = [];
  
  for (let i = 0; i < segments.length; i++) {
    const current = segments[i];
    
    // 1. Xác định start mới
    let newStart = 0;
    if (i === 0) {
      newStart = 0;
    } else {
      const prev = segments[i - 1];
      // Điểm bắt đầu mới chính là điểm kết thúc của phân đoạn trước sau khi chia trung điểm khoảng lặng
      newStart = (prev.end + current.start) / 2;
    }
    
    // 2. Xác định end mới
    let newEnd = totalDuration;
    if (i === segments.length - 1) {
      newEnd = totalDuration;
    } else {
      const next = segments[i + 1];
      // Điểm kết thúc mới chính là trung điểm khoảng lặng giữa câu hiện tại và câu kế tiếp
      newEnd = (current.end + next.start) / 2;
    }
    
    const s = Number(Math.max(0, newStart).toFixed(2));
    const e = Number(Math.min(totalDuration, newEnd).toFixed(2));
    
    result.push({ start: s, end: e });
  }
  
  // Đảm bảo trật tự tăng dần nghiêm ngặt, triệt tiêu chồng chéo thời gian
  for (let i = 1; i < result.length; i++) {
    if (result[i].start < result[i - 1].end) {
      result[i].start = result[i - 1].end;
    }
  }
  
  if (result.length > 0 && result[result.length - 1].end > totalDuration) {
    result[result.length - 1].end = totalDuration;
  }
  
  return result;
}

export function copyAudioBufferSegment(
  source: AudioBuffer,
  ctx: AudioContext | OfflineAudioContext,
  startSec: number,
  endSec: number
): AudioBuffer {
  const sampleRate = source.sampleRate;
  const startSample = Math.max(0, Math.min(source.length - 1, Math.floor(startSec * sampleRate)));
  const endSample = Math.max(startSample + 1, Math.min(source.length, Math.floor(endSec * sampleRate)));
  const frameLength = Math.max(1, endSample - startSample);
  
  const destBuffer = ctx.createBuffer(
    source.numberOfChannels,
    frameLength,
    sampleRate
  );
  
  for (let c = 0; c < source.numberOfChannels; c++) {
    const srcData = source.getChannelData(c);
    const destData = destBuffer.getChannelData(c);
    // Copy samples with bounds check
    for (let i = 0; i < frameLength; i++) {
      const srcIdx = startSample + i;
      if (srcIdx >= 0 && srcIdx < srcData.length) {
        destData[i] = srcData[srcIdx];
      } else {
        destData[i] = 0;
      }
    }
  }
  
  return destBuffer;
}

export function audioBufferToWav(buffer: AudioBuffer): ArrayBuffer {
  const numOfChan = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;
  
  let result: Float32Array;
  if (numOfChan === 2) {
    result = interleave(buffer.getChannelData(0), buffer.getChannelData(1));
  } else {
    result = buffer.getChannelData(0);
  }
  
  const bufferLength = result.length * 2;
  const arrayBuffer = new ArrayBuffer(44 + bufferLength);
  const view = new DataView(arrayBuffer);
  
  /* RIFF identifier */
  writeString(view, 0, 'RIFF');
  /* file length */
  view.setUint32(4, 36 + bufferLength, true);
  /* RIFF type */
  writeString(view, 8, 'WAVE');
  /* format chunk identifier */
  writeString(view, 12, 'fmt ');
  /* format chunk length */
  view.setUint32(16, 16, true);
  /* sample format (raw) */
  view.setUint16(20, format, true);
  /* channel count */
  view.setUint16(22, numOfChan, true);
  /* sample rate */
  view.setUint32(24, sampleRate, true);
  /* byte rate (sample rate * block align) */
  view.setUint32(28, sampleRate * numOfChan * (bitDepth / 8), true);
  /* block align (channel count * bytes per sample) */
  view.setUint16(32, numOfChan * (bitDepth / 8), true);
  /* bits per sample */
  view.setUint16(34, bitDepth, true);
  /* data chunk identifier */
  writeString(view, 36, 'data');
  /* data chunk length */
  view.setUint32(40, bufferLength, true);
  
  floatTo16BitPCM(view, 44, result);
  
  return arrayBuffer;
}

function interleave(inputL: Float32Array, inputR: Float32Array): Float32Array {
  const length = inputL.length + inputR.length;
  const result = new Float32Array(length);
  let index = 0;
  let inputIndex = 0;
  
  while (index < length) {
    result[index++] = inputL[inputIndex];
    result[index++] = inputR[inputIndex];
    inputIndex++;
  }
  return result;
}

function floatTo16BitPCM(output: DataView, offset: number, input: Float32Array) {
  for (let i = 0; i < input.length; i++, offset += 2) {
    let s = Math.max(-1, Math.min(1, input[i]));
    output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

export function downsampleAndMonoAudioBuffer(buffer: AudioBuffer, targetSampleRate: number = 16000): { samples: Float32Array; sampleRate: number } {
  const numChannels = buffer.numberOfChannels;
  const originalSampleRate = buffer.sampleRate;
  
  // Mix to mono if multiple channels
  let monoSamples: Float32Array;
  if (numChannels === 1) {
    monoSamples = buffer.getChannelData(0);
  } else {
    const chan0 = buffer.getChannelData(0);
    const chan1 = buffer.getChannelData(1);
    monoSamples = new Float32Array(buffer.length);
    for (let i = 0; i < buffer.length; i++) {
      monoSamples[i] = (chan0[i] + chan1[i]) / 2;
    }
  }
  
  // Resample if sample rate is different
  if (originalSampleRate === targetSampleRate) {
    return { samples: monoSamples, sampleRate: targetSampleRate };
  }
  
  const ratio = originalSampleRate / targetSampleRate;
  const newLength = Math.round(monoSamples.length / ratio);
  const result = new Float32Array(newLength);
  
  for (let i = 0; i < newLength; i++) {
    const originalIdx = i * ratio;
    const indexLow = Math.floor(originalIdx);
    const indexHigh = Math.min(monoSamples.length - 1, Math.ceil(originalIdx));
    const weight = originalIdx - indexLow;
    
    // Linear interpolation resampler
    result[i] = (1 - weight) * monoSamples[indexLow] + weight * monoSamples[indexHigh];
  }
  
  return { samples: result, sampleRate: targetSampleRate };
}

export function resampledMonoToWav(samples: Float32Array, sampleRate: number): ArrayBuffer {
  const format = 1; // PCM
  const bitDepth = 16;
  const numOfChan = 1;
  const bufferLength = samples.length * 2;
  const arrayBuffer = new ArrayBuffer(44 + bufferLength);
  const view = new DataView(arrayBuffer);
  
  /* RIFF identifier */
  writeString(view, 0, 'RIFF');
  /* file length */
  view.setUint32(4, 36 + bufferLength, true);
  /* RIFF type */
  writeString(view, 8, 'WAVE');
  /* format chunk identifier */
  writeString(view, 12, 'fmt ');
  /* format chunk length */
  view.setUint32(16, 16, true);
  /* sample format (raw) */
  view.setUint16(20, format, true);
  /* channel count */
  view.setUint16(22, numOfChan, true);
  /* sample rate */
  view.setUint32(24, sampleRate, true);
  /* byte rate (sample rate * block align) */
  view.setUint32(28, sampleRate * numOfChan * (bitDepth / 8), true);
  /* block align (channel count * bytes per sample) */
  view.setUint16(32, numOfChan * (bitDepth / 8), true);
  /* bits per sample */
  view.setUint16(34, bitDepth, true);
  /* data chunk identifier */
  writeString(view, 36, 'data');
  /* data chunk length */
  view.setUint32(40, bufferLength, true);
  
  floatTo16BitPCM(view, 44, samples);
  
  return arrayBuffer;
}

// Chế độ 2: Đồng bộ trực tiếp theo tên file Voice & Ảnh có chứa số thứ tự (1.wav 1.png, v.v...)
export function runCapCutDirectAudioImageSync(draftJson: string): SyncResult {
  try {
    const draft = JSON.parse(draftJson);
    if (!draft || typeof draft !== "object") {
      throw new Error("Dữ liệu nhập vào không đúng định dạng JSON.");
    }

    // 1. Phân tích Audio Materials và Video (Image) Materials sử dụng Đệ Quy siêu bền
    const audioMaterialsMap = new Map<string, { id: string; name: string; num: number }>();
    const imageMaterialsMap = new Map<string, { id: string; name: string; num: number }>();

    const seenMaterialIds = new Set<string>();
    const scanForMaterials = (obj: any) => {
      if (!obj || typeof obj !== "object") return;
      
      if (Array.isArray(obj)) {
        obj.forEach((item: any) => scanForMaterials(item));
        return;
      }
      
      if (obj.id && !seenMaterialIds.has(obj.id)) {
        const displayName = obj.name || obj.file_name || obj.file_Name || obj.material_name || obj.path;
        if (typeof displayName === "string" && displayName.length > 0) {
          seenMaterialIds.add(obj.id);
          const fileName = getBaseFileName(displayName).toLowerCase();
          
          const cleanedName = fileName.replace(/^[^a-zA-Z0-9]+/, "");
          const match = cleanedName.match(/^0*(\d+)/) || fileName.match(/0*(\d+)/);
          
          if (match) {
            const num = parseInt(match[1], 10);
            const isAudio = (typeof obj.type === "string" && obj.type.includes("audio")) || 
                            fileName.endsWith(".mp3") || fileName.endsWith(".wav") || fileName.endsWith(".m4a") || fileName.endsWith(".ogg");
            
            if (isAudio) {
              audioMaterialsMap.set(obj.id, { id: obj.id, name: getBaseFileName(displayName), num });
            } else {
              imageMaterialsMap.set(obj.id, { id: obj.id, name: getBaseFileName(displayName), num });
            }
          }
        }
      }
      
      Object.keys(obj).forEach((key) => {
        if (key !== "tracks" && key !== "segments") {
          scanForMaterials(obj[key]);
        }
      });
    };

    scanForMaterials(draft);

    if (audioMaterialsMap.size === 0) {
      throw new Error("Không tìm thấy tệp tin Audio nào chứa số thứ tự (ví dụ: 1.wav, 2.wav) trong thư viện của CapCut.");
    }
    if (imageMaterialsMap.size === 0) {
      throw new Error("Không tìm thấy tệp tin Ảnh/Video nào chứa số thứ tự (ví dụ: 1.png, 2.png) trong thư viện của CapCut.");
    }

    // 2. Tìm các Audio Track segments và gom thời gian của từng số thứ tự
    const voiceTimings = new Map<number, { start: number; duration: number; soundName: string }>();

    // Tìm Main Audio Track (track chứa nhiều đoạn âm thanh nằm trong danh sách giọng nói nhất)
    let mainAudioTrack: any = null;
    let maxAudioSegments = -1;

    if (Array.isArray(draft.tracks)) {
      draft.tracks.forEach((track: any) => {
        if (track && track.type === "audio" && Array.isArray(track.segments)) {
          let count = 0;
          track.segments.forEach((seg: any) => {
            if (seg && seg.material_id && audioMaterialsMap.has(seg.material_id)) {
              count++;
            }
          });
          if (count > maxAudioSegments) {
            maxAudioSegments = count;
            mainAudioTrack = track;
          }
        }
      });
    }

    if (mainAudioTrack && Array.isArray(mainAudioTrack.segments)) {
      mainAudioTrack.segments.forEach((seg: any) => {
        if (seg && seg.material_id && seg.target_timerange) {
          const audioMat = audioMaterialsMap.get(seg.material_id);
          if (audioMat) {
            const s = Number(seg.target_timerange.start) || 0;
            const d = Number(seg.target_timerange.duration) || 0;
            voiceTimings.set(audioMat.num, {
              start: s,
              duration: d,
              soundName: audioMat.name
            });
          }
        }
      });
    }

    if (voiceTimings.size === 0) {
      throw new Error("Không tìm thấy đoạn Voice nào chứa số (ví dụ: 1.wav, 2.wav) đã đặt trên Timeline của CapCut. Bạn hãy kéo thả các file voice đã băm vào Timeline trước!");
    }

    // 3. Sắp xếp lại / tạo mới các segment ảnh tương ứng nằm đúng vào timeline của voice tương xứng
    if (!Array.isArray(draft.tracks)) {
      draft.tracks = [];
    }

    const imageAssetIdsMap = new Set(Array.from(imageMaterialsMap.keys()));

    // Lấy track video hiện tại (Track chính có nhiều ảnh nhất)
    let videoTrack: any = null;
    let maxImageSegments = -1;

    if (Array.isArray(draft.tracks)) {
      draft.tracks.forEach((track: any) => {
        if (track && track.type === "video" && Array.isArray(track.segments)) {
          let count = 0;
          track.segments.forEach((seg: any) => {
            if (seg && seg.material_id && imageAssetIdsMap.has(seg.material_id)) {
              count++;
            }
          });
          if (count > maxImageSegments) {
            maxImageSegments = count;
            videoTrack = track;
          }
        }
      });
    }

    if (!videoTrack) {
      videoTrack = draft.tracks.find((t: any) => t && t.type === "video");
    }

    if (!videoTrack) {
      videoTrack = {
        id: "generated-direct-video-track-id",
        type: "video",
        segments: []
      };
      draft.tracks.push(videoTrack);
    }

    // Khởi tạo các khuôn mẫu cài đặt trước từ track video cũ (nếu có segment ảnh cũ)
    const segmentTemplates = new Map<string, any>();
    draft.tracks.forEach((track: any) => {
      if (track && track.type === "video" && Array.isArray(track.segments)) {
        track.segments.forEach((seg: any) => {
          if (seg && seg.material_id) {
            segmentTemplates.set(seg.material_id, JSON.parse(JSON.stringify(seg)));
          }
        });
      }
    });

    // Gom dọn các segment ảnh cũ trên video track để ghi đè phẳng khép kín
    const nonMatchedSegments = (videoTrack.segments || []).filter(
      (seg: any) => seg && !imageAssetIdsMap.has(seg.material_id)
    );

    const newImageSegments: any[] = [];
    const matchedNumbersReport: any[] = [];

    // Duyệt qua tất cả các số thứ tự tìm thấy có audio timings
    const sortedNums = Array.from(voiceTimings.keys()).sort((a, b) => a - b);

    sortedNums.forEach((num) => {
      const timing = voiceTimings.get(num)!;
      
      // Tìm tệp ảnh có số thứ tự trùng khớp (parse leading number)
      const pImage = Array.from(imageMaterialsMap.values()).find((img) => img.num === num);
      
      if (pImage) {
        // Có ảnh ứng với voice! Tạo mới hoặc cập nhật segment
        const template = segmentTemplates.get(pImage.id);
        const generateSegmentId = () => "SGM-DRC-" + Math.random().toString(36).substr(2, 9).toUpperCase();
        
        const newSeg = template ? {
          ...template,
          id: generateSegmentId(),
          target_timerange: {
            start: timing.start,
            duration: timing.duration
          },
          source_timerange: {
            start: template.source_timerange ? (template.source_timerange.start || 0) : 0,
            duration: timing.duration
          }
        } : {
          id: generateSegmentId(),
          material_id: pImage.id,
          target_timerange: {
            start: timing.start,
            duration: timing.duration
          },
          source_timerange: {
            start: 0,
            duration: timing.duration
          },
          extra_material_refs: [],
          render_level: 0,
          scale: { "x": 1.0, "y": 1.0 },
          speed: 1.0,
          volume: 1.0,
          visible: true
        };

        newImageSegments.push(newSeg);

        matchedNumbersReport.push({
          sceneNum: num.toString(),
          subtitlesCount: 1, 
          imagesCount: 1, 
          startSec: Number((timing.start / 1000000).toFixed(2)),
          endSec: Number(((timing.start + timing.duration) / 1000000).toFixed(2)),
          imageNames: [pImage.name]
        });
      }
    });

    const combinedSegments = [...nonMatchedSegments, ...newImageSegments];
    combinedSegments.sort((a, b) => {
      const startA = a?.target_timerange?.start || 0;
      const startB = b?.target_timerange?.start || 0;
      return startA - startB;
    });

    videoTrack.segments = combinedSegments;

    // Tìm điểm thời gian cuối cùng của timeline
    let absoluteMaxTime = 0;
    if (Array.isArray(draft.tracks)) {
      draft.tracks.forEach((track: any) => {
        if (Array.isArray(track.segments)) {
          track.segments.forEach((seg: any) => {
            if (seg && seg.target_timerange) {
              const s = Number(seg.target_timerange.start) || 0;
              const d = Number(seg.target_timerange.duration) || 0;
              if (s + d > absoluteMaxTime) {
                absoluteMaxTime = s + d;
              }
            }
          });
        }
      });
    }

    return {
      success: true,
      message: `Đồng bộ trực tiếp thành công! Khớp tuyệt đối ${newImageSegments.length} tệp ảnh tương thích với các phân lượng đoạn Voice đồng bộ số thứ tự!`,
      matchedImagesCount: newImageSegments.length,
      matchedSubtitlesCount: voiceTimings.size,
      totalDurationSeconds: Number((absoluteMaxTime / 1000000).toFixed(2)),
      scenesReport: matchedNumbersReport,
      updatedJsonString: JSON.stringify(draft, null, 2)
    };

  } catch (err: any) {
    return {
      success: false,
      message: err.message || "Xảy ra lỗi khi đồng bộ trực tiếp Voice - Ảnh.",
      matchedImagesCount: 0,
      matchedSubtitlesCount: 0,
      totalDurationSeconds: 0,
      scenesReport: [],
      updatedJsonString: ""
    };
  }
}

interface CapCutSynchronizerProps {
  storyboard: Storyboard | null;
}

export default function CapCutSynchronizer({ storyboard }: CapCutSynchronizerProps) {
  // Tabs config
  const [activeTab, setActiveTab] = useState<"split" | "sync">(() => {
    const saved = localStorage.getItem("cc_activeTab");
    return (saved as any) || "split";
  });

  // State for sync timeline
  const [jsonInput, setJsonInput] = useState<string>(() => {
    return localStorage.getItem("cc_jsonInput") || "";
  });
  const [customStoryboardText, setCustomStoryboardText] = useState<string>(() => {
    return localStorage.getItem("cc_customStoryboardText") || "";
  });
  const [result, setResult] = useState<SyncResult | null>(() => {
    try {
      const saved = localStorage.getItem("cc_syncResult");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [errorText, setErrorText] = useState<string>("");
  const [copiedDraft, setCopiedDraft] = useState<boolean>(false);
  const [showGuide, setShowGuide] = useState<boolean>(false);
  const [dialogueSplitEnabled, setDialogueSplitEnabled] = useState<boolean>(() => {
    return localStorage.getItem("cc_dialogueSplitEnabled") === "true";
  });
  const [syncMode, setSyncMode] = useState<"text" | "direct">(() => {
    return (localStorage.getItem("cc_syncMode") as any) || "text";
  });

  // State for voice splitting & merging
  const [voiceFile, setVoiceFile] = useState<File | null>(null);
  const [voiceFiles, setVoiceFiles] = useState<File[]>([]);
  const [splitStrategy, setSplitStrategy] = useState<"silence" | "proportional" | "ai_alignment">(() => {
    return (localStorage.getItem("cc_splitStrategy") as any) || "ai_alignment";
  });
  const [targetCountMode, setTargetCountMode] = useState<"step3" | "manual" | "auto_silence">(() => {
    return (localStorage.getItem("cc_targetCountMode") as any) || "step3";
  });

  const [splittingVoice, setSplittingVoice] = useState<boolean>(false);
  const [isGeneratingAIVoices, setIsGeneratingAIVoices] = useState<boolean>(false);
  const [aiVoiceProgress, setAiVoiceProgress] = useState<string>("");
  const [aiVoiceName, setAiVoiceName] = useState<string>(() => {
    return localStorage.getItem("cc_aiVoiceName") || "Zephyr";
  });
  const [splitProgress, setSplitProgress] = useState<number>(0);
  const [silenceThreshold, setSilenceThreshold] = useState<number>(() => {
    const saved = localStorage.getItem("cc_silenceThreshold");
    return saved !== null ? Number(saved) : 0.012;
  });
  const [minSilenceDuration, setMinSilenceDuration] = useState<number>(() => {
    const saved = localStorage.getItem("cc_minSilenceDuration");
    return saved !== null ? Number(saved) : 0.3;
  });
  const [paddingSec, setPaddingSec] = useState<number>(() => {
    const saved = localStorage.getItem("cc_paddingSec");
    return saved !== null ? Number(saved) : 0.12;
  });
  const [targetAudioClips, setTargetAudioClips] = useState<number>(() => {
    const saved = localStorage.getItem("cc_targetAudioClips");
    return saved !== null ? Number(saved) : 0;
  });
  const [clipPreviews, setClipPreviews] = useState<Array<{ index: number; start: number; end: number; duration: number; objectUrl: string }>>(() => {
    try {
      const saved = localStorage.getItem("cc_clipPreviews");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [voiceSplitSuccess, setVoiceSplitSuccess] = useState<string>(() => {
    return localStorage.getItem("cc_voiceSplitSuccess") || "";
  });
  const [voiceSplitError, setVoiceSplitError] = useState<string>("");

  const handleClearAllData = () => {
    // Reset file băm/voice
    setVoiceFile(null);
    setVoiceFiles([]);
    setVoiceSplitSuccess("");
    setVoiceSplitError("");
    setClipPreviews([]);
    setSplitProgress(0);
    setAiVoiceProgress("");
    setIsGeneratingAIVoices(false);
    setSplittingVoice(false);

    // Reset các trường đồng bộ timeline
    setJsonInput("");
    setCustomStoryboardText("");
    setResult(null);
    setErrorText("");

    // Xóa bộ nhớ cache localStorage
    safeRemoveItem("cc_jsonInput");
    safeRemoveItem("cc_customStoryboardText");
    safeRemoveItem("cc_syncResult");
    safeRemoveItem("cc_clipPreviews");
    safeRemoveItem("cc_voiceSplitSuccess");
  };

  const safeSetItem = (key: string, value: string) => {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.warn(`[CapCutSync] Không thể lưu "${key}" vào localStorage (có thể vượt quá 5MB bộ nhớ đệm):`, e);
    }
  };

  const safeRemoveItem = (key: string) => {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.warn(`[CapCutSync] Không thể xóa key "${key}" từ localStorage:`, e);
    }
  };

  // Tự động lưu giữ các state vào localStorage khi thay đổi
  React.useEffect(() => {
    safeSetItem("cc_activeTab", activeTab);
  }, [activeTab]);

  React.useEffect(() => {
    safeSetItem("cc_jsonInput", jsonInput);
  }, [jsonInput]);

  React.useEffect(() => {
    safeSetItem("cc_customStoryboardText", customStoryboardText);
  }, [customStoryboardText]);

  React.useEffect(() => {
    safeSetItem("cc_dialogueSplitEnabled", String(dialogueSplitEnabled));
  }, [dialogueSplitEnabled]);

  React.useEffect(() => {
    safeSetItem("cc_syncMode", syncMode);
  }, [syncMode]);

  React.useEffect(() => {
    safeSetItem("cc_splitStrategy", splitStrategy);
  }, [splitStrategy]);

  React.useEffect(() => {
    safeSetItem("cc_targetCountMode", targetCountMode);
  }, [targetCountMode]);

  React.useEffect(() => {
    safeSetItem("cc_silenceThreshold", String(silenceThreshold));
  }, [silenceThreshold]);

  React.useEffect(() => {
    safeSetItem("cc_minSilenceDuration", String(minSilenceDuration));
  }, [minSilenceDuration]);

  React.useEffect(() => {
    safeSetItem("cc_paddingSec", String(paddingSec));
  }, [paddingSec]);

  React.useEffect(() => {
    safeSetItem("cc_targetAudioClips", String(targetAudioClips));
  }, [targetAudioClips]);

  React.useEffect(() => {
    safeSetItem("cc_aiVoiceName", aiVoiceName);
  }, [aiVoiceName]);

  React.useEffect(() => {
    safeSetItem("cc_voiceSplitSuccess", voiceSplitSuccess);
  }, [voiceSplitSuccess]);

  React.useEffect(() => {
    if (clipPreviews && clipPreviews.length > 0) {
      safeSetItem("cc_clipPreviews", JSON.stringify(clipPreviews));
    } else {
      safeRemoveItem("cc_clipPreviews");
    }
  }, [clipPreviews]);

  React.useEffect(() => {
    if (result) {
      // Vì result có thể chứa updatedJsonString cực kỳ lớn (vượt quá 5MB limit của localStorage),
      // nên chúng ta sẽ lược bỏ updatedJsonString trước khi lưu vào localStorage để tránh QuotaExceededError.
      const liteResult = { ...result, updatedJsonString: "" };
      safeSetItem("cc_syncResult", JSON.stringify(liteResult));
    } else {
      safeRemoveItem("cc_syncResult");
    }
  }, [result]);

  const handleGenerateAIVoices = async () => {
    const textParts = getTimelineTextParts(storyboard);
    if (textParts.length === 0) {
      setVoiceSplitError("Không tìm thấy dữ liệu phân cảnh từ Bước 2 để băm tự động. Vui lòng hoàn thành phần chia cảnh ở Bước 2 trước!");
      return;
    }

    setIsGeneratingAIVoices(true);
    setSplitProgress(0);
    setVoiceSplitSuccess("");
    setVoiceSplitError("");
    setClipPreviews([]);

    const previews: typeof clipPreviews = [];

    try {
      for (let i = 0; i < textParts.length; i++) {
        const text = textParts[i];
        setAiVoiceProgress(`Đang gọi giọng đọc [${aiVoiceName}] đoạn ${i + 1}/${textParts.length}: "${text.slice(0, 40)}..."`);
        setSplitProgress(Math.floor((i / textParts.length) * 100));

        const res = await fetch("/api/generate-tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: text,
            voiceName: aiVoiceName
          })
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || `Lỗi khi tạo thuyết minh ở đoạn ${i + 1}`);
        }

        const data = await res.json();
        if (!data.audioUrl) {
          throw new Error(`Đoạn ${i + 1} không nhận được dữ liệu âm thanh từ máy chủ.`);
        }

        previews.push({
          index: i + 1,
          start: 0,
          end: 0,
          duration: text.length * 0.12, // Visual estimation of duration
          objectUrl: data.audioUrl
        });
      }

      setClipPreviews(previews);
      setSplitProgress(100);
      setVoiceSplitSuccess(`Tạo & Băm thành công ${textParts.length} đoạn voice AI chuẩn xác 100% khớp tuyệt đối kịch bản! Hãy nghe thử và bấm tải file ZIP.`);
    } catch (e: any) {
      console.error(e);
      setVoiceSplitError(e.message || "Xảy ra lỗi khi tự động tạo voice từng phân cảnh.");
    } finally {
      setIsGeneratingAIVoices(false);
      setAiVoiceProgress("");
    }
  };

  const handleSplitVoiceFile = async () => {
    const fileToUse = voiceFiles.length > 0 ? voiceFiles[0] : voiceFile;
    if (!fileToUse && voiceFiles.length === 0) {
      setVoiceSplitError("Vui lòng tải lên tối thiểu 1 tệp âm thanh thuyết minh (WAV/MP3/M4A)!");
      return;
    }
    
    setSplittingVoice(true);
    setSplitProgress(10);
    setVoiceSplitSuccess("");
    setVoiceSplitError("");
    setClipPreviews([]);
    
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) {
        throw new Error("Trình duyệt không hỗ trợ Web Audio API để xử lý cắt ghép.");
      }
      const audioCtx = new AudioContextClass();
      
      let audioBuffer: AudioBuffer;

      // Merging multiple voice files sequentially if provided
      if (voiceFiles.length > 1) {
        setSplitProgress(15);
        const decodedBuffers: AudioBuffer[] = [];
        for (let i = 0; i < voiceFiles.length; i++) {
          const file = voiceFiles[i];
          const arrayBuffer = await file.arrayBuffer();
          const buf = await audioCtx.decodeAudioData(arrayBuffer);
          decodedBuffers.push(buf);
          setSplitProgress(15 + Math.floor((i / voiceFiles.length) * 35));
        }
        audioBuffer = mergeAudioBuffers(decodedBuffers, audioCtx);
      } else {
        const singleFile = voiceFiles[0] || voiceFile;
        if (!singleFile) {
          throw new Error("Không thể tìm thấy tệp tin âm thanh.");
        }
        const arrayBuffer = await singleFile.arrayBuffer();
        setSplitProgress(35);
        audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
      }
      setSplitProgress(55);
      
      // Determine final target count of parts based on selected targetCountMode
      let finalTarget = 0;
      if (targetCountMode === "step3") {
        if (storyboard && storyboard.scenes) {
          finalTarget = storyboard.scenes.reduce((acc, s) => acc + (s.imagePrompts?.length || 0), 0);
        }
      } else if (targetCountMode === "manual") {
        finalTarget = targetAudioClips;
      } else {
        finalTarget = 0; // Pure automatic silence detection
      }
      
      let segments: Array<{ start: number; end: number }> = [];

      if (splitStrategy === "ai_alignment") {
        const textParts = getTimelineTextParts(storyboard);
        if (textParts.length === 0) {
          throw new Error("Không tìm thấy dữ liệu phân cảnh từ Bước 2 để băm bằng AI. Vui lòng hoàn thành phần chia cảnh ở Bước 2 trước!");
        }
        
        setSplitProgress(60);
        // Downsample audio to 16kHz Mono to shrink payload size and maintain maximum Vietnamese voice clarity for Gemini
        const resampled = downsampleAndMonoAudioBuffer(audioBuffer, 16000);
        const wavArrayBuffer = resampledMonoToWav(resampled.samples, resampled.sampleRate);
        
        // Helper chuyển ArrayBuffer thành chuỗi base64
        const arrayBufferToBase64 = (buf: ArrayBuffer): string => {
          let binary = '';
          const bytes = new Uint8Array(buf);
          const len = bytes.byteLength;
          for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
          }
          return window.btoa(binary);
        };
        
        const base64Data = arrayBufferToBase64(wavArrayBuffer);
        
        setSplitProgress(65);
        // Gọi API căn chỉnh giọng nói bằng AI kèm theo kịch bản và tổng thời lượng thực tế
        const res = await fetch("/api/ai-split-voice", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            audioData: base64Data,
            mimeType: "audio/wav",
            textParts: textParts,
            totalDuration: audioBuffer.duration
          })
        });
        
        if (!res.ok) {
          let errMsg = `Lỗi hệ thống (Mã lỗi: ${res.status})`;
          try {
            const errData = await res.json();
            errMsg = errData.error || errMsg;
          } catch {
            try {
              const text = await res.text();
              if (text.includes("Payload Too Large") || res.status === 413) {
                errMsg = "Tệp âm thanh quá lớn để gửi lên AI phân tích. Vui lòng chọn tệp ngắn hơn hoặc dùng phương án Băm theo tỷ lệ chữ (Proportional).";
              } else if (text.length > 0) {
                errMsg = `Lỗi máy chủ (${res.status}): ${text.slice(0, 150)}...`;
              }
            } catch {}
          }
          throw new Error(errMsg);
        }
        
        let data: any;
        try {
          data = await res.json();
        } catch {
          throw new Error("Không thể giải mã dữ liệu trả về từ máy chủ dưới dạng JSON.");
        }

        if (!data || !data.segments || !Array.isArray(data.segments)) {
          throw new Error("Không nhận được kết quả phân tích mốc câu từ AI.");
        }
        
        // Gán mốc bắt đầu/kết thúc chuẩn xác do AI phân tích
        segments = data.segments.map((seg: any) => {
          let s = seg.start;
          let e = seg.end;
          if (s > e) e = s;
          return { start: s, end: e };
        });
      } else if (splitStrategy === "proportional") {
        const textParts = getTimelineTextParts(storyboard);
        if (textParts.length === 0) {
          throw new Error("Không tìm thấy dữ liệu phân cảnh từ Bước 2 để định tỷ lệ băm cắt. Vui lòng hoàn thành phần chia cảnh ở Bước 2 trước!");
        }
        segments = splitVoiceProportionalWithSilenceAlignment(
          audioBuffer,
          textParts,
          silenceThreshold
        );
      } else {
        // Option A or B with silence detection
        segments = splitVoiceAudio(
          audioBuffer,
          finalTarget,
          silenceThreshold,
          minSilenceDuration,
          paddingSec
        );
      }
      
      // Tối ưu hóa phân bổ liên tục để giữ trọn vẹn 100% thời lượng của tệp voice gốc và bảo vệ các khoảng nghỉ ngắt nhịp tự nhiên
      segments = makeSegmentsContinuousAndCoverFullDuration(segments, audioBuffer.duration);
      
      if (segments.length === 0) {
        throw new Error("Không tìm thấy điểm cắt thích hợp. Thử điều chỉnh lại cấu hình hoặc chuyển sang chế độ cắt theo kịch bản!");
      }
      
      setSplitProgress(75);
      
      const previews: typeof clipPreviews = [];
      
      for (let i = 0; i < segments.length; i++) {
        const seg = segments[i];
        const clipBuffer = copyAudioBufferSegment(audioBuffer, audioCtx, seg.start, seg.end);
        
        const wavData = audioBufferToWav(clipBuffer);
        const blob = new Blob([wavData], { type: "audio/wav" });
        const url = URL.createObjectURL(blob);
        
        previews.push({
          index: i + 1,
          start: seg.start,
          end: seg.end,
          duration: seg.end - seg.start,
          objectUrl: url
        });
        
        setSplitProgress(75 + Math.floor((i / segments.length) * 20));
      }
      
      setClipPreviews(previews);
      setSplitProgress(100);
      setVoiceSplitSuccess(`Băm thành công ${segments.length} đoạn voice thoại ngắn từ file gốc, khớp thứ tự từ 1 đến ${segments.length}! Hãy nghe thử và bấm tải file ZIP và up vào CapCut dựng phim.`);
    } catch (e: any) {
      console.error(e);
      setVoiceSplitError(e.message || "Xảy ra lỗi trong quá trình băm tách file âm thanh.");
    } finally {
      setSplittingVoice(false);
    }
  };

  const handleDownloadZip = async () => {
    if (clipPreviews.length === 0) return;
    
    setSplittingVoice(true);
    setSplitProgress(20);
    try {
      const zip = new JSZip();
      
      // Fetch clip blobs from generated objectUrls and package them in 1 click
      for (let i = 0; i < clipPreviews.length; i++) {
        const item = clipPreviews[i];
        const res = await fetch(item.objectUrl);
        const blob = await res.blob();
        zip.file(`${item.index}.wav`, blob);
        setSplitProgress(20 + Math.floor((i / clipPreviews.length) * 70));
      }
      
      setSplitProgress(92);
      const zipBlob = await zip.generateAsync({ type: "blob" });
      setSplitProgress(100);
      
      const downloadUrl = URL.createObjectURL(zipBlob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `voice_split_clips_${clipPreviews.length}_leads.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);
    } catch (e: any) {
      setVoiceSplitError("Lỗi khởi tạo file ZIP: " + e.message);
    } finally {
      setSplittingVoice(false);
    }
  };

  const handleSyncProcess = () => {
    setErrorText("");
    setResult(null);

    if (syncMode === "text") {
      const hasStoredScenes = storyboard && storyboard.scenes && storyboard.scenes.length > 0;
      const hasPastedScenes = customStoryboardText.trim().includes("Phân cảnh");

      if (!hasStoredScenes && !hasPastedScenes) {
        setErrorText("Vui lòng hoàn thành phần chia cảnh ở Bước 2 HOẶC dán danh sách phân cảnh thoại vào ô bên dưới để đồng bộ!");
        return;
      }

      if (!jsonInput.trim()) {
        setErrorText("Vui lòng dán nội dung tệp draft_content.json của dự án CapCut vào ô trống!");
        return;
      }

      const res = runCapCutSync(jsonInput, storyboard, customStoryboardText, dialogueSplitEnabled);
      if (!res.success) {
        setErrorText(res.message);
      } else {
        setResult(res);
      }
    } else {
      // Direct voice - image number alignment mode
      if (!jsonInput.trim()) {
        setErrorText("Vui lòng dán nội dung tệp draft_content.json của dự án CapCut vào ô trống!");
        return;
      }

      const res = runCapCutDirectAudioImageSync(jsonInput);
      if (!res.success) {
        setErrorText(res.message);
      } else {
        setResult(res);
      }
    }
  };

  const handleCopyResult = () => {
    if (!result || !result.updatedJsonString) return;
    navigator.clipboard.writeText(result.updatedJsonString).then(() => {
      setCopiedDraft(true);
      setTimeout(() => setCopiedDraft(false), 2000);
    });
  };

  const handleDownloadResult = () => {
    if (!result || !result.updatedJsonString) return;
    const blob = new Blob([result.updatedJsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "draft_content.json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const loadDemoJson = () => {
    const demo = {
      tracks: [
        { id: "text-track-1", type: "text", segments: [
          { id: "t-0", material_id: "m-t0", target_timerange: { start: 0, duration: 25000000 } },
          { id: "t-1", material_id: "m-t1", target_timerange: { start: 25000000, duration: 25000000 } }
        ]},
        { id: "main-video-track", type: "video", segments: [] }
      ],
      materials: {
        texts: [
          { id: "m-t0", content: "The Battle of the Little Bigghorn was far more brutal than commonly recounted." },
          { id: "m-t1", content: "It was textbook military planning with one critical flaw." }
        ],
        images: [
          { id: "img-1", name: "[P1.1].png", type: "photo" },
          { id: "img-2", name: "[P1.2].png", type: "photo" },
          { id: "img-3", name: "[P2.1].png", type: "photo" }
        ]
      }
    };
    setJsonInput(JSON.stringify(demo, null, 2));
    
    // Nạp sẵn phân cảnh mẫu vào ô cấu trúc phân cảnh để test
    setCustomStoryboardText(
      "--- Phân cảnh 1 (00:00 - 00:25) ---\n" +
      "[Đoạn thoại]: The Battle of the Little Bigghorn was far more brutal than commonly recounted. On a Montana ridge, 210 US cavalrymen encountered...\n" +
      "  + [P1.1] (Ý tưởng: Phác họa 1)\n" +
      "  + [P1.2] (Ý tưởng: Phác họa 2)\n\n" +
      "--- Phân cảnh 2 (00:25 - 00:50) ---\n" +
      "[Đoạn thoại]: It was textbook military planning with one critical flaw. Crook's column had already been repelled...\n" +
      "  + [P2.1] (Ý tưởng: Phác họa 3)"
    );
    setErrorText("");
    setResult(null);
  };

  return (
    <div id="capcut-synchronizer-container" className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6 shadow-sm font-sans text-slate-800">
      
      {/* Title & Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="bg-red-500 text-white p-2.5 rounded-xl shadow-sm">
            <RefreshCw className="w-5 h-5 animate-spin-slow" />
          </div>
          <div>
            <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-1.5 leading-tight">
              🚀 CapCut Timeline & Voice Slicing VIP Studio
            </h4>
            <p className="text-xs text-slate-500 font-bold leading-normal mt-0.5">
              CẮT BĂM VOICE & TỰ ĐỘNG DÀN DỰNG SẮP XẾP TIMELINE ẢNH CHỈ TRONG 1 CLICK
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleClearAllData}
            className="text-xs font-black flex items-center justify-center gap-1.5 text-rose-600 hover:bg-rose-50 border border-rose-200 px-3.5 py-1.5 rounded-lg cursor-pointer transition-colors shadow-2xs active:scale-95"
            title="Xóa toàn bộ các tệp âm thanh đã tải, kịch bản cũ, và dữ liệu CapCut đã dán để làm lại từ đầu"
          >
            <Trash2 className="w-4 h-4 text-rose-600" />
            Xóa dữ liệu cũ & Làm lại
          </button>
          <button
            onClick={() => setShowGuide(!showGuide)}
            className="text-xs font-bold flex items-center justify-center gap-1.5 text-slate-500 hover:text-red-500 hover:bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 cursor-pointer transition-colors"
          >
            <HelpCircle className="w-4 h-4" />
            {showGuide ? "Đóng hướng dẫn" : "Hướng dẫn dùng ra sao?"}
          </button>
        </div>
      </div>

      {showGuide && (
        <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-xl text-xs text-slate-600 space-y-3 leading-relaxed animate-fadeIn">
          <p className="font-extrabold text-slate-900 flex items-center gap-1">
            <Info className="w-4 h-4 text-orange-500" /> Quy trình biên tập tự động hóa tuyệt đối:
          </p>
          <ol className="list-decimal pl-5 space-y-2 text-slate-700">
            <li>
              <b>Bước 1</b>: Chuyển sang Tab <b>🎙️ Trình băm File Voice</b>, kéo thả file voice thuyết minh của bạn vào. Khai báo số đoạn bạn muốn cắt ra (ví dụ 150 câu thoại). Hệ thống sẽ phân tích các khoảng im lặng tự động và xuất file ZIP gồm 150 file voice ngắn đánh số liên tục 1.wav, 2.wav, 3.wav...
            </li>
            <li>
              <b>Bước 2</b>: Tạo ảnh AI bám khít tương ứng, đặt tên ảnh chứa số thứ tự tương ứng (ví dụ: 1.png, 2.png, 3.png...).
            </li>
            <li>
              <b>Bước 3</b>: Tại CapCut, kéo thả toàn bộ các file voice và ảnh vào mục Thư viện đầu vào. Thả toàn bộ voice vào trục âm thanh (Timeline).
            </li>
            <li>
              <b>Bước 4</b>: Đóng dự án rồi tìm tệp lưu nháp <code className="bg-slate-100 px-1.5 py-0.5 rounded font-black text-slate-800 font-mono">draft_content.json</code> tại đường dẫn:
            </li>
          </ol>
          <div className="bg-slate-900 text-slate-100 p-3 rounded-lg space-y-1 text-[10px] font-mono leading-normal shadow-inner select-all">
            <p><span className="text-emerald-400">Windows:</span> %localappdata%\CapCut\User Data\Projects\com.lved.pc\ [Thư_mục_Dự_án] \</p>
            <p><span className="text-emerald-400">Mac OS:</span> ~/Library/Containers/com.lemon.lvonewpc/Data/Library/Application Support/CapCut/User Data/Projects/com.lved.pc/ [Thư_mục_Dự_án] \</p>
          </div>
          <p className="font-medium text-slate-500">
            Dán tệp tin json đó vào Tab 2, chọn <b>Chế độ khớp Theo Số Thứ Tự File (Direct Sequence Match)</b> rồi bấm Đồng Bộ. Toàn bộ ảnh sẽ được kéo thả, sắp đặt thời lượng và vị trí khớp khít khịt vào từng đoạn âm thanh nhỏ 1-to-1!
          </p>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-200 gap-1 select-none">
        <button
          onClick={() => setActiveTab("split")}
          className={`flex items-center gap-2 pb-3 pt-1 px-4 text-xs font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
            activeTab === "split"
              ? "border-red-500 text-red-600"
              : "border-transparent text-slate-400 hover:text-slate-600 hover:border-slate-300"
          }`}
        >
          <Scissors className="w-4 h-4" />
          🎙️ Bước 1: Trình Băm Cắt File Voice
        </button>
        <button
          onClick={() => setActiveTab("sync")}
          className={`flex items-center gap-2 pb-3 pt-1 px-4 text-xs font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
            activeTab === "sync"
              ? "border-red-500 text-red-600"
              : "border-transparent text-slate-400 hover:text-slate-600 hover:border-slate-300"
          }`}
        >
          <RefreshCw className="w-4 h-4" />
          🎬 Bước 2: Đồng Bộ Trục Timeline CapCut
        </button>
      </div>

      {/* TAB 1: VOICE FILE SPLITTER */}
      {activeTab === "split" && (
        <div className="space-y-5 animate-fadeIn">
          
          {/* PHƯƠNG ÁN A: TẠO VOICE AI BĂM SẴN CHUẨN 100% */}
          <div className="bg-gradient-to-br from-red-50/60 to-amber-50/60 border border-red-200/80 p-4.5 rounded-xl space-y-4 shadow-2xs">
            <div className="flex items-center gap-2">
              <span className="text-[10px] bg-red-150 text-red-750 font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider">Khuyên dùng - Chuẩn 100%</span>
              <h5 className="text-xs font-black text-slate-850 uppercase flex items-center gap-1.5">
                🌟 PHƯƠNG ÁN A: Tự động Tạo & Băm Voice AI (Độ Chính Xác Tuyệt Đối 100%)
              </h5>
            </div>
            
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Tuyệt đối không lo băm sai hay mất chữ! Hệ thống sẽ duyệt qua từng câu thoại trong dữ liệu phân cảnh Bước 2, gọi trực tiếp Google AI sinh từng file audio độc lập tương ứng. File số <code className="bg-red-100 text-red-800 px-1 rounded font-mono font-bold font-extrabold">5.wav</code> chắc chắn sẽ đọc chuẩn 100% câu thoại thứ 5 của kịch bản!
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center bg-white p-4 rounded-xl border border-slate-200">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase block tracking-wider">Chọn Giọng Đọc Google:</label>
                <div className="grid grid-cols-3 gap-1">
                  {["Zephyr", "Puck", "Charon", "Kore", "Fenrir", "Aoede"].map((voice) => (
                    <button
                      key={voice}
                      type="button"
                      onClick={() => setAiVoiceName(voice)}
                      className={`py-1.5 rounded text-[10px] font-extrabold border transition-all active:scale-95 ${
                        aiVoiceName === voice 
                          ? "bg-red-50 border-red-500 text-red-700 font-black shadow-2xs" 
                          : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      🗣️ {voice}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase block tracking-wider">Thông tin kịch bản:</label>
                <div className="text-[11px] text-slate-600 font-bold bg-slate-50 p-2.5 rounded-lg border border-slate-150">
                  📄 Tổng số câu thoại: <span className="text-red-600 font-extrabold text-xs">{storyboard?.scenes ? getTimelineTextParts(storyboard).length : 0} câu thoại</span>
                </div>
              </div>

              <div>
                <button
                  type="button"
                  disabled={isGeneratingAIVoices || !storyboard}
                  onClick={handleGenerateAIVoices}
                  className={`w-full font-black py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer shadow-sm ${
                    isGeneratingAIVoices 
                      ? "bg-slate-300 text-slate-500 cursor-not-allowed" 
                      : "bg-red-600 hover:bg-red-700 text-white"
                  }`}
                >
                  {isGeneratingAIVoices ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-white" />
                      Đang sinh Voice AI...
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-4 h-4 text-white" />
                      TẠO GIỌNG ĐỌC BĂM SẴN 100%
                    </>
                  )}
                </button>
              </div>
            </div>

            {isGeneratingAIVoices && (
              <div className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-2.5 animate-fadeIn">
                <div className="flex justify-between items-center text-[10.5px] font-bold text-slate-600">
                  <span className="animate-pulse text-red-600 font-extrabold">{aiVoiceProgress}</span>
                  <span>{splitProgress}%</span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-red-600 h-full transition-all duration-300" style={{ width: `${splitProgress}%` }} />
                </div>
              </div>
            )}
          </div>

          {/* PHƯƠNG ÁN B: BĂM FILE THỦ CÔNG */}
          <div className="bg-slate-50/50 border border-slate-200 p-4.5 rounded-xl space-y-3.5">
            <h5 className="text-xs font-black text-slate-800 uppercase flex items-center gap-1.5">
              📁 PHƯƠNG ÁN B: Băm File Thuyết Minh Tự Tải Lên (Dùng Thuật Toán Tĩnh Âm RMS)
            </h5>
            <p className="text-[11px] text-slate-500 leading-normal font-medium">
              Sử dụng khi bạn tự thâu âm bằng mic ngoài hoặc tải file voice từ bên thứ ba. Hệ thống sẽ quét các khoảng ngắt nghỉ tĩnh âm để băm nhỏ file.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* File audio input selection */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-4 flex flex-col justify-between">
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-700 uppercase tracking-widest block">Chọn File thuyết minh gốc:</label>
                  <div className="border-2 border-dashed border-slate-200 hover:border-red-500 rounded-xl p-4 text-center cursor-pointer bg-slate-50/40 transition-colors relative">
                    <input
                      type="file"
                      accept="audio/*"
                      multiple={true}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      onChange={(e) => {
                        const files: File[] = e.target.files ? Array.from(e.target.files) : [];
                        if (files.length > 0) {
                          const getFirstNumber = (fn: string): number => {
                            const match = fn.match(/\d+/);
                            return match ? parseInt(match[0], 10) : Infinity;
                          };
                          const sorted = [...files].sort((a: File, b: File) => getFirstNumber(a.name) - getFirstNumber(b.name));
                          
                          setVoiceFiles(sorted);
                          setVoiceSplitSuccess("");
                          setVoiceSplitError("");
                          setClipPreviews([]);
                          
                          if (sorted.length === 1) {
                            setVoiceFile(sorted[0]);
                          } else {
                            const totalSize = sorted.reduce((sum: number, f: File) => sum + f.size, 0);
                            const mockFile = new File([], `Gộp_${sorted.length}_file_voice.mp3`, {
                              type: "audio/mp3",
                            });
                            Object.defineProperty(mockFile, 'size', { value: totalSize, writable: false });
                            setVoiceFile(mockFile);
                          }
                        }
                      }}
                    />
                    <div className="flex flex-col items-center justify-center gap-1.5 py-4">
                      <FileAudio className="w-9 h-9 text-slate-400" />
                      {voiceFiles.length > 0 ? (
                        <div className="space-y-0.5">
                          <p className="text-xs font-black text-rose-600">Đã nhận {voiceFiles.length} file voice thành công!</p>
                          <ul className="text-[9px] text-slate-500 font-bold max-h-[80px] overflow-y-auto space-y-0.5 text-left bg-slate-50 p-1.5 rounded border border-slate-100">
                            {voiceFiles.map((f, i) => (
                              <li key={i} className="truncate">
                                {i + 1}. {f.name} ({(f.size / 1024).toFixed(0)} KB)
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : voiceFile ? (
                        <div className="space-y-0.5">
                          <p className="text-xs font-black text-slate-700 line-clamp-1">{voiceFile.name}</p>
                          <p className="text-[10px] text-slate-400 font-bold">{(voiceFile.size / (1024 * 1024)).toFixed(2)} MB • Sẵn sàng xử lý</p>
                        </div>
                      ) : (
                        <div className="space-y-0.5">
                          <p className="text-xs font-extrabold text-slate-650">Kéo & Thả hoặc chọn 1 hoặc nhiều file Voice</p>
                          <p className="text-[9px] text-slate-400 font-medium">Hệ thống tự sắp xếp & gộp theo số đầu tiên của tên file</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Target Parts Controls config */}
                <div className="space-y-3 pt-3 border-t border-slate-200">
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-700 block uppercase">
                      CƠ CHẾ XÁC ĐỊNH SỐ LƯỢNG ĐOẠN KHỚP (TARGET SOURCE):
                    </label>
                    
                    <div className="grid grid-cols-1 gap-1.5 bg-slate-100 p-2 rounded-lg">
                      <label className="flex items-center gap-2 text-[10.5px] font-bold text-slate-700 cursor-pointer">
                        <input
                          type="radio"
                          name="targetCountMode"
                          checked={targetCountMode === "step3"}
                          onChange={() => setTargetCountMode("step3")}
                          className="accent-red-600"
                        />
                        <span>Khớp tự động theo Prompt ở Bước 2 ({storyboard?.scenes ? storyboard.scenes.reduce((acc, s) => acc + (s.imagePrompts?.length || 0), 0) : 0} ảnh)</span>
                      </label>
                      <label className="flex items-center gap-2 text-[10.5px] font-bold text-slate-700 cursor-pointer">
                        <input
                          type="radio"
                          name="targetCountMode"
                          checked={targetCountMode === "manual"}
                          onChange={() => setTargetCountMode("manual")}
                          className="accent-red-600"
                        />
                        <span>Nhập số lượng thủ công</span>
                      </label>
                      <label className="flex items-center gap-2 text-[10.5px] font-bold text-slate-700 cursor-pointer">
                        <input
                          type="radio"
                          name="targetCountMode"
                          checked={targetCountMode === "auto_silence"}
                          onChange={() => setTargetCountMode("auto_silence")}
                          className="accent-red-600"
                        />
                        <span>Băm tự động không giới hạn độ dài</span>
                      </label>
                    </div>

                    {targetCountMode === "manual" && (
                      <div className="space-y-1 mt-1 pl-1">
                        <div className="flex justify-between text-[10px] font-bold text-slate-600">
                          <span>Nhập số đo phân mảnh (Ví dụ: 150):</span>
                          <span>{targetAudioClips} mảnh</span>
                        </div>
                        <input
                          type="number"
                          min="1"
                          value={targetAudioClips || ""}
                          onChange={(e) => setTargetAudioClips(Math.max(1, parseInt(e.target.value, 10)) || 0)}
                          placeholder="Số lượng đoạn cần băm..."
                          className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-mono font-bold focus:outline-none focus:ring-1 focus:ring-red-500"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Advanced splitting sliders */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-4 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <span className="text-[10px] bg-indigo-150 text-indigo-750 font-extrabold px-2 py-0.5 rounded-full uppercase">Chọn chế độ băm</span>
                    <h6 className="text-[11px] font-black text-slate-700 uppercase tracking-widest flex items-center gap-1">
                      <Settings className="w-3.5 h-3.5 text-slate-500" /> CHIẾN LƯỢC BĂM MUSIC/VOICE:
                    </h6>
                    <select
                      value={splitStrategy}
                      onChange={(e) => setSplitStrategy(e.target.value as any)}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-red-500 cursor-pointer"
                    >
                      <option value="ai_alignment">🧠 Băm AI thông minh (Mới - Nghe giọng đọc & khớp chính xác 100%)</option>
                      <option value="silence">🎙️ Trích lọc điểm lặng tự động (Silence-based slice)</option>
                      <option value="proportional">📝 Khớp tỷ lệ từ lời thoại phân cảnh Bước 2 (Optimal proportional slice)</option>
                    </select>
                    <p className="text-[9px] text-slate-400">
                      {splitStrategy === "ai_alignment"
                        ? "🔥 Chế độ đỉnh cao 100%: Gửi âm thanh thuyết minh và kịch bản văn bản lên Google AI để lắng nghe và căn chỉnh thời gian chuẩn xác 100%, không lo băm lệch từ!"
                        : splitStrategy === "proportional" 
                        ? "💡 Chế độ phân chia độ dài các file âm thanh tương ứng hoàn hảo với tỷ lệ độ dài chữ của từng câu thoại ở Sơ đồ đã chia cảnh." 
                        : "💡 Chế độ truyền thống: Quét các khoảng im lặng có cường độ thấp nhất để chia cắt."}
                    </p>
                  </div>
                  <h6 className="text-[11px] font-black text-slate-700 uppercase tracking-widest flex items-center gap-1">
                    <Settings className="w-3.5 h-3.5 text-slate-500" /> Cấu hình Thuật toán Cắt & Tách câu:
                  </h6>
                  
                  <div className="space-y-1 pt-1">
                    <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                      <span>Khối ngưỡng tĩnh âm (Threshold RMS):</span>
                      <span className="font-mono text-red-600 bg-red-50 px-1.5 py-0.5 rounded">{silenceThreshold}</span>
                    </div>
                    <input
                      type="range"
                      min="0.001"
                      max="0.08"
                      step="0.001"
                      value={silenceThreshold}
                      onChange={(e) => setSilenceThreshold(parseFloat(e.target.value))}
                      className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-red-500"
                    />
                    <p className="text-[9px] text-slate-400 leading-tight">Mặc định: 0.012. Tăng giá trị lên nếu muốn cắt nhạy hơn, hạ bớt nếu bị cắt quá đà.</p>
                  </div>

                  <div className="space-y-1 pt-1">
                    <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                      <span>Thời gian lặng tối thiểu (Silence duration):</span>
                      <span className="font-mono text-red-600 bg-red-50 px-1.5 py-0.5 rounded">{minSilenceDuration}s</span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="1.5"
                      step="0.05"
                      value={minSilenceDuration}
                      onChange={(e) => setMinSilenceDuration(parseFloat(e.target.value))}
                      className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-red-500"
                    />
                    <p className="text-[9px] text-slate-400 leading-tight">Mặc định: 0.3s. Khoảng nghỉ lặng duy trì tối thiểu bao nhiêu giây trước khi coi là kết thúc 1 câu.</p>
                  </div>

                  <div className="space-y-1 pt-1">
                    <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                      <span>Định lượng nới rộng biên (Padding):</span>
                      <span className="font-mono text-red-600 bg-red-50 px-1.5 py-0.5 rounded">+{paddingSec}s</span>
                    </div>
                    <input
                      type="range"
                      min="0.0"
                      max="0.4"
                      step="0.02"
                      value={paddingSec}
                      onChange={(e) => setPaddingSec(parseFloat(e.target.value))}
                      className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-red-500"
                    />
                    <p className="text-[9px] text-slate-400 leading-tight">Mặc định: 0.12s. Thêm đệm âm nhỏ cho 2 đầu tệp thoại ngắn tránh mất chữ và mượt tai.</p>
                  </div>
                </div>

                {/* Action trigger button */}
                <button
                  type="button"
                  disabled={splittingVoice || !voiceFile}
                  onClick={handleSplitVoiceFile}
                  className={`w-full text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-all active:scale-98 cursor-pointer mt-4 ${
                    splittingVoice ? "bg-red-400 text-white cursor-not-allowed" : "bg-red-600 hover:bg-red-700 shadow-sm"
                  }`}
                >
                  {splittingVoice ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Đang giải nén & băm âm thanh ({splitProgress}%)
                    </>
                  ) : (
                    <>
                      <Scissors className="w-4 h-4 text-white" />
                      TIẾN HÀNH BĂM TÁCH VOICE THUYẾT MINH
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Feedback states */}
          {voiceSplitError && (
            <div className="bg-red-50 border border-red-200 p-3.5 rounded-xl flex items-start gap-2 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <p className="text-xs text-red-700 font-extrabold leading-normal">{voiceSplitError}</p>
            </div>
          )}

          {voiceSplitSuccess && (
            <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl space-y-3.5 animate-fadeIn">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-xs font-black text-emerald-800 uppercase tracking-widest">{voiceSplitSuccess}</p>
                  <p className="text-[11px] text-emerald-700 font-medium leading-relaxed">
                    Đã chuẩn bị sẵn sàng {clipPreviews.length} đoạn voice. Bạn có thể bấm nút bên dưới để nén ngay tất cả thành 1 file ZIP tải về rồi import vào CapCut.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  onClick={handleDownloadZip}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white hover:shadow-md py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer shadow-sm"
                >
                  <Download className="w-4 h-4 animate-bounce text-white" />
                  Tải Xuống Nén ZIP Âm Thanh Đánh Số
                </button>
              </div>

              {/* Preview Audio Players Grid */}
              <div className="space-y-2 pt-2 border-t border-emerald-200/50">
                <label className="text-[10px] font-black text-slate-600 uppercase tracking-wider block">Nghe thử danh sách tệp đã băm ({clipPreviews.length}):</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-56 overflow-y-auto pr-1">
                  {clipPreviews.map((clip) => (
                    <div key={clip.index} className="bg-white border border-slate-200 rounded-lg p-2.5 flex flex-col justify-between gap-1.5 shadow-2xs hover:border-emerald-300">
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="font-extrabold text-slate-800">🔊 File: {clip.index}.wav</span>
                        <span className="text-[10px] text-slate-400 font-bold">{clip.duration.toFixed(2)} giây</span>
                      </div>
                      <audio controls src={clip.objectUrl} className="w-full h-6 pt-1 focus:outline-none" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* TAB 2: CAPCUT TIMELINE AUTOMATION */}
      {activeTab === "sync" && (
        <div className="space-y-5 animate-fadeIn">
          
          <div className="bg-indigo-50/50 border border-indigo-200/40 p-4 rounded-xl space-y-1.5">
            <span className="text-[10px] bg-indigo-100 text-indigo-700 font-extrabold px-2 py-0.5 rounded-full uppercase">Sắp xếp timeline</span>
            <h5 className="text-xs font-black text-slate-800 uppercase">Dàn dựng và đồng bộ hóa thời lượng ảnh khít khao</h5>
            <p className="text-xs text-slate-500 leading-normal font-medium">
              Sau khi dựng voice trên timeline CapCut, bạn kéo thả các file ảnh tương ứng vào thư viện. Việc của tool là định đoạt chính xác mốc bắt đầu, kết thúc và kéo giãn từng ảnh khớp sát với đúng câu thoại của voice tương đương tương thích.
            </p>
          </div>

          <div className="bg-slate-100/80 p-3 rounded-xl space-y-2 select-none border border-slate-250">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block font-bold">Chọn phương thức đồng bộ thời lượng:</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              
              <div 
                onClick={() => setSyncMode("text")}
                className={`p-3.5 rounded-lg border cursor-pointer flex gap-3 transition-all ${
                  syncMode === "text" 
                    ? "bg-white border-red-500 shadow-sm" 
                    : "bg-slate-50 hover:bg-slate-100 border-slate-200 opacity-75"
                }`}
              >
                <input
                  type="radio"
                  name="syncMode"
                  checked={syncMode === "text"}
                  onChange={() => setSyncMode("text")}
                  className="mt-1 accent-red-500 cursor-pointer"
                />
                <div className="space-y-0.5">
                  <span className="text-xs font-black text-slate-800 flex items-center gap-1.5 uppercase">
                    Chế độ A: Theo phụ đề CapCut 🗣®
                  </span>
                  <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                    Pháp nhận diện ảnh <code className="bg-slate-200 text-red-655 px-1 font-mono font-bold">[P1.1]</code> dựa theo nội dung Subtitle tự động tạo bên trong CapCut. Thích hợp dán dữ liệu phân cảnh của Bước 2.
                  </p>
                </div>
              </div>

              <div 
                onClick={() => setSyncMode("direct")}
                className={`p-3.5 rounded-lg border cursor-pointer flex gap-3 transition-all ${
                  syncMode === "direct" 
                    ? "bg-white border-red-500 shadow-sm" 
                    : "bg-slate-50 hover:bg-slate-100 border-slate-200 opacity-75"
                }`}
              >
                <input
                  type="radio"
                  name="syncMode"
                  checked={syncMode === "direct"}
                  onChange={() => setSyncMode("direct")}
                  className="mt-1 accent-red-500 cursor-pointer"
                />
                <div className="space-y-0.5">
                  <span className="text-xs font-black text-slate-800 flex items-center gap-1.5 uppercase">
                    Chế độ B: Tuần tự Số File (Sau băm voice) 🎙®
                  </span>
                  <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                    Sắp xếp ảnh <code className="bg-slate-200 text-red-655 px-1 font-mono font-bold">i.png</code> có dải thời lượng kéo dẹp ĐÚNG KHỚP khít khao mốc phát của file Voice <code className="bg-slate-200 text-red-655 px-1 font-mono font-bold">i.wav</code> trên timeline của bạn.
                  </p>
                </div>
              </div>

            </div>
          </div>

          {/* Conditional Input Fields depending on Sync Mode */}
          {syncMode === "text" && (
            <div className="space-y-4 animate-fadeIn">
              {/* Custom Storyboard parser */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-slate-700 flex justify-between items-center uppercase tracking-wide">
                  <span>Dán Danh sách Phân cảnh & Prompts (Nếu trống sẽ tự lấy từ Bước 2):</span>
                </label>
                <textarea
                  value={customStoryboardText}
                  onChange={(e) => setCustomStoryboardText(e.target.value)}
                  placeholder={`--- Phân cảnh 1 (00:00 - 00:25) ---\n[Đoạn thoại]: The Battle...\n  + [P1.1]...\n  + [P1.2]...\n\n--- Phân cảnh 2...`}
                  className="w-full h-32 bg-slate-50 text-slate-700 font-mono text-[10.5px] p-3 rounded-xl border border-slate-250 focus:outline-none focus:ring-1 focus:ring-red-500 shadow-inner"
                />
                
                {/* Advanced high-fidelity check */}
                <div className="bg-white border border-slate-200 rounded-xl p-3 flex items-start gap-2.5 shadow-2xs hover:shadow-1xs transition-all my-2">
                  <input
                    id="syncDialogueSplitBoxDirect"
                    type="checkbox"
                    checked={dialogueSplitEnabled}
                    onChange={(e) => setDialogueSplitEnabled(e.target.checked)}
                    className="mt-1 w-4 h-4 rounded border-slate-300 text-red-650 focus:ring-red-500 cursor-pointer"
                  />
                  <div className="space-y-0.5">
                    <label htmlFor="syncDialogueSplitBoxDirect" className="text-xs font-extrabold text-slate-800 cursor-pointer flex items-center gap-1.5">
                      👑 [NÂNG CAO] Khớp thời lượng chặt từng câu nhỏ (Subtitles Split)
                    </label>
                    <p className="text-[10px] text-slate-500 leading-normal font-medium">
                      Khi bật, các ảnh của phân cảnh sẽ không chia thô, mà tự vát cạnh kéo giãn thẳng theo mốc bắt đầu nói của từng câu sub đơn lẻ trên timeline.
                    </p>
                  </div>
                </div>

                <span className="text-[9px] text-slate-400 block leading-tight">
                  💡 Bạn có thể bấm nút <b>Copy Phân Cảnh & Prompts 💎</b> ở sơ đồ phần trước để dán vào đây dễ dàng.
                </span>
              </div>
            </div>
          )}

          {/* Common CapCut Input Area */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-[11px] font-black text-slate-700 uppercase tracking-wider block">
                Nội dung tệp <code className="bg-slate-100 text-slate-800 px-1 font-mono font-bold">draft_content.json</code> dự án CapCut của bạn:
              </label>
              <div className="flex items-center gap-1.5">
                <label className="text-[10px] bg-red-50 border border-red-200 hover:bg-red-100 text-red-700 font-bold px-2.5 py-0.5 rounded-md cursor-pointer flex items-center gap-1.5 transition-colors">
                  <Upload className="w-3.5 h-3.5" />
                  Tải file lên
                  <input
                    type="file"
                    accept=".json"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          const text = event.target?.result as string;
                          setJsonInput(text);
                        };
                        reader.readAsText(file);
                      }
                    }}
                  />
                </label>
                <button 
                  onClick={loadDemoJson}
                  className="text-[10px] bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 text-indigo-700 font-extrabold px-2.5 py-0.5 rounded-md cursor-pointer transition-colors"
                >
                  📋 Nạp Demo mẫu
                </button>
              </div>
            </div>
            <textarea
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder="Mở draft_content.json rồi copy dán toàn bộ vào đây..."
              className="w-full h-40 bg-slate-900 text-teal-400 font-mono text-[10.5px] p-3 rounded-xl border border-slate-700 focus:outline-none focus:ring-1 focus:ring-red-500 shadow-inner"
            />
          </div>

          {errorText && (
            <div className="bg-red-50 border border-red-200/85 p-3 rounded-xl flex items-start gap-2 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-red-650 shrink-0 mt-0.5" />
              <p className="text-xs text-red-700 font-bold leading-normal">{errorText}</p>
            </div>
          )}

          {/* Sync Result Feedback */}
          {result && result.success && (
            <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl space-y-4 animate-fadeIn">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <h5 className="text-xs font-black text-emerald-800 uppercase tracking-widest">{result.message}</h5>
              </div>

              <div className="grid grid-cols-3 gap-2.5 text-center">
                <div className="bg-white p-2.5 rounded-lg border border-emerald-100">
                  <span className="text-[10px] text-slate-400 block font-bold uppercase leading-none">Mốc liên kết</span>
                  <span className="text-xs font-black text-slate-800 block line-clamp-1 mt-1">{result.matchedSubtitlesCount} mốc thoại</span>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-emerald-100">
                  <span className="text-[10px] text-slate-400 block font-bold uppercase leading-none">Ảnh Đã Khớp</span>
                  <span className="text-xs font-black text-slate-800 block line-clamp-1 mt-1">{result.matchedImagesCount} tệp ảnh</span>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-emerald-100">
                  <span className="text-[10px] text-slate-400 block font-bold uppercase leading-none">Độ Dài Dựng</span>
                  <span className="text-xs font-black text-slate-800 block line-clamp-1 mt-1">{result.totalDurationSeconds} giây</span>
                </div>
              </div>

              {/* Grid lists of time layout matches */}
              <div className="space-y-1.5 pt-2 border-t border-emerald-150">
                <span className="text-[10.5px] font-black text-slate-600 uppercase tracking-wider block font-bold">📊 Sơ đồ dàn trải ảnh thực tế trên trục CapCut timeline:</span>
                <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
                  {result.scenesReport.map((rep, idx) => (
                    <div key={idx} className="bg-white p-2.5 rounded-md border border-slate-200/80 text-[11px] flex justify-between items-center gap-3">
                      <div>
                        <span className="font-extrabold text-slate-800">Cọc #{rep.sceneNum}</span>
                        <span className="text-slate-500 font-mono font-bold text-[9px] ml-2 bg-slate-100 px-1.5 py-0.5 rounded">
                          ⏱️ {rep.startSec}s - {rep.endSec}s ({(rep.endSec - rep.startSec).toFixed(1)}s)
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-right">
                        <span className="text-[10px] font-bold text-red-655 bg-red-50 border border-red-100 px-2 py-0.5 rounded-full line-clamp-1 max-w-[150px]">
                          🖼️ Match: {rep.imageNames.join(", ")}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action output buttons */}
              <div className="flex flex-wrap gap-2.5 pt-2">
                <button
                  onClick={handleCopyResult}
                  className={`flex items-center gap-1.5 py-3 px-4 rounded-xl text-xs font-black transition-all active:scale-95 cursor-pointer flex-1 justify-center border ${
                    copiedDraft 
                      ? "bg-emerald-700 border-emerald-700 text-white" 
                      : "bg-emerald-600 border-emerald-600 hover:bg-emerald-700 text-white shadow-3xs"
                  }`}
                >
                  {copiedDraft ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedDraft ? "Đã Copy Thành Công!" : "Copy Toàn Bộ Nội Dung JSON"}
                </button>

                <button
                  onClick={handleDownloadResult}
                  className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-900 border border-slate-800 text-white py-3 px-4 rounded-xl text-xs font-black transition-all active:scale-95 cursor-pointer flex-1 justify-center shadow-3xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  Tải Xuống File Nháp draft_content.json
                </button>
              </div>
            </div>
          )}

          {/* Master sync button */}
          <button
            onClick={handleSyncProcess}
            className="w-full bg-red-600 hover:bg-red-700 text-white hover:shadow-md font-bold py-3.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-all active:scale-98 cursor-pointer shadow-sm uppercase tracking-wider"
          >
            <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
            BẮT ĐẦU PHÂN TÍCH & ĐỒNG BỘ TIMELINE CAPCUT
          </button>

        </div>
      )}

    </div>
  );
}

