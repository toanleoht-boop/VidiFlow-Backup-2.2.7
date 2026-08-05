import re

with open('src/server/services/imageGeneratorService.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the require lines in uploadReferenceImage with clean imports usage
content = content.replace("    const fs = require('fs');\n    const path = require('path');", "")

with open('src/server/services/imageGeneratorService.ts', 'w', encoding='utf-8') as f:
    f.write(content)
print("done")
