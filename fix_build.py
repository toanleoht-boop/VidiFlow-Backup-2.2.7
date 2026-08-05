import re
with open('src/server/services/imageGeneratorService.ts', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('globalPlaywrightPage', 'getPlaywrightPage()')
# Wait, I previously did: `content = content.replace('globalPlaywrightPage.', 'getPlaywrightPage().')`
# This means there are still `globalPlaywrightPage` instances!
# If I replace all `globalPlaywrightPage` with `getPlaywrightPage()`, I will get `getPlaywrightPage()()` if I'm not careful.
# Let's just fix it properly with regex.

content = re.sub(r'\bglobalPlaywrightPage\b', 'getPlaywrightPage()', content)
# But wait, what if `getPlaywrightPage()` is already there?
content = content.replace('getPlaywrightPage()()', 'getPlaywrightPage()')
content = content.replace('getPlaywrightPage().()', 'getPlaywrightPage().')
content = content.replace('getPlaywrightPage(),()', 'getPlaywrightPage(),')
content = content.replace('if (!getPlaywrightPage()()', 'if (!getPlaywrightPage()')

with open('src/server/services/imageGeneratorService.ts', 'w', encoding='utf-8') as f:
    f.write(content)
print("done")
