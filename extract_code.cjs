const fs = require('fs');
const readline = require('readline');

async function extract() {
  const fileStream = fs.createReadStream('C:\\Users\\PC\\.gemini\\antigravity\\brain\\9cd493ee-9b99-4d87-94ff-b8e60976e136\\.system_generated\\logs\\transcript.jsonl');
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let bestContent = '';
  for await (const line of rl) {
    try {
      const parsed = JSON.parse(line);
      // look for tool outputs
      if (parsed.content) {
        if (parsed.content.includes('generateImageWithGeminiChat') && parsed.content.includes('export async function generateImageWithPlaywright')) {
          if (parsed.content.length > bestContent.length) {
            bestContent = parsed.content;
          }
        }
      }
    } catch (e) {}
  }
  
  if (bestContent) {
    fs.writeFileSync('extracted_content.txt', bestContent, 'utf8');
    console.log('Extracted content length:', bestContent.length);
  } else {
    console.log('Not found');
  }
}

extract();
