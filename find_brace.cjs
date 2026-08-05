const fs = require('fs');

const content = fs.readFileSync('src/server/services/imageGeneratorService.ts', 'utf8');
const lines = content.split('\n');

let stack = [];
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  for (let j = 0; j < line.length; j++) {
    if (line[j] === '{') {
      stack.push(i + 1);
    } else if (line[j] === '}') {
      if (stack.length === 0) {
        console.log(`Unmatched } at line ${i + 1}`);
      } else {
        stack.pop();
      }
    }
  }
}

if (stack.length > 0) {
  console.log(`Unclosed { at lines: ${stack.join(', ')}`);
} else {
  console.log('All braces match!');
}
