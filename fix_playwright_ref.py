import re

with open('src/server/services/imageGeneratorService.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix the imports
import_target = 'import { globalPlaywrightPage, initPlaywright, closePlaywright, closePlaywrightBrowser } from "./audioService.js";'
import_replacement = 'import { getPlaywrightPage, initPlaywright, closePlaywright, closePlaywrightBrowser, globalPlaywrightPages } from "./audioService.js";'
content = content.replace(import_target, import_replacement)

# Replace all globalPlaywrightPage. with getPlaywrightPage()!.
# But we need to handle cases where it's used as a boolean like `!globalPlaywrightPage`
content = content.replace('!globalPlaywrightPage || globalPlaywrightPage.isClosed()', '!getPlaywrightPage() || getPlaywrightPage()!.isClosed()')
content = content.replace('!globalPlaywrightPage', '!getPlaywrightPage()')
content = content.replace('globalPlaywrightPage.', 'getPlaywrightPage()!.')
content = content.replace('globalPlaywrightPage,', 'getPlaywrightPage()!,')
content = content.replace('(globalPlaywrightPage)', '(getPlaywrightPage()!)')
content = content.replace('globalPlaywrightPage\n', 'getPlaywrightPage()!\n')

with open('src/server/services/imageGeneratorService.ts', 'w', encoding='utf-8') as f:
    f.write(content)
print("done")
