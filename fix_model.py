import re

with open('src/server/services/imageGeneratorService.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the broken model selection logic with a robust one
old_model_selection = """
              // Find and click any button/option matching the model name
              const modelEls = await getPlaywrightPage().$$('button:visible, [role="option"]:visible, [role="menuitem"]:visible');
              let clickedModel = false;
              for (const el of modelEls) {
                const text = await el.innerText();
                if (text && text.toLowerCase().includes(targetEngineStr.toLowerCase())) {
                   await el.scrollIntoViewIfNeeded().catch(() => {});
                   await el.click({ force: true });
                   clickedModel = true;
                   appLog(`[Playwright] Clicked Model: ${text.trim()}`);
                   await getPlaywrightPage()!.waitForTimeout(500);
                   break;
                }
              }
              if (!clickedModel) {
                 appLog(`[Playwright] Could not find any button matching ${targetEngineStr}.`);
              }
"""

new_model_selection = """
              // Robust model selection: click the dropdown first, then click the option
              const dropdowns = await getPlaywrightPage().$$('button:visible, [role="button"]:visible, [role="combobox"]:visible');
              let dropdownBtn = null;
              for (const el of dropdowns) {
                  const text = await el.innerText();
                  if (text && (text.includes("Imagen") || text.includes("Veo"))) {
                      dropdownBtn = el;
                      break;
                  }
              }

              if (dropdownBtn) {
                  await dropdownBtn.click({ force: true });
                  await getPlaywrightPage()!.waitForTimeout(1000);
                  
                  const options = await getPlaywrightPage().$$('[role="option"]:visible, [role="menuitem"]:visible, li:visible');
                  let clickedModel = false;
                  for (const opt of options) {
                      const optText = await opt.innerText();
                      if (optText && optText.toLowerCase().includes(targetEngineStr.toLowerCase())) {
                          await opt.scrollIntoViewIfNeeded().catch(() => {});
                          await opt.click({ force: true });
                          clickedModel = true;
                          appLog(`[Playwright] Clicked Model Option: ${optText.trim()}`);
                          break;
                      }
                  }
                  if (!clickedModel) {
                      appLog(`[Playwright] Could not find option matching ${targetEngineStr}.`);
                      await getPlaywrightPage()!.keyboard.press("Escape").catch(() => {});
                  }
                  await getPlaywrightPage()!.waitForTimeout(500);
              } else {
                  appLog(`[Playwright] Could not find Model Dropdown Button.`);
              }
"""

if old_model_selection in content:
    content = content.replace(old_model_selection, new_model_selection)

with open('src/server/services/imageGeneratorService.ts', 'w', encoding='utf-8') as f:
    f.write(content)
print("done")
