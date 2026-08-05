import { chromium } from 'playwright';

async function run() {
  try {
    const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
    const contexts = browser.contexts();
    const pages = contexts[0].pages();
    const page = pages.find(p => p.url().includes('gemini.google.com') || p.url().includes('labs.google'));
    
    if (!page) {
      console.log('Gemini or Labs page not found.');
      process.exit(1);
    }

    console.log('Found page:', page.url());

    // Evaluate in browser to find file inputs
    const inputs = await page.evaluate(() => {
      const els = document.querySelectorAll('input[type="file"]');
      return Array.from(els).map(e => ({
        id: e.id,
        className: e.className,
        accept: e.getAttribute('accept'),
        multiple: e.getAttribute('multiple')
      }));
    });
    console.log('File inputs:', inputs);

    // Evaluate in browser to find model dropdowns/buttons
    const buttons = await page.evaluate(() => {
      const els = document.querySelectorAll('button, [role="button"], [role="combobox"], [role="menuitem"], [role="option"]');
      const results = [];
      for(let i=0; i<els.length; i++) {
          const text = els[i].innerText || '';
          if (text.includes('Gemini') || text.includes('Imagen') || text.includes('Veo') || text.includes('Flash') || text.includes('Advanced')) {
              results.push({
                  text: text.trim().substring(0, 50),
                  role: els[i].getAttribute('role'),
                  ariaLabel: els[i].getAttribute('aria-label')
              });
          }
      }
      return results;
    });
    console.log('Potential Model Selectors:', buttons);

    process.exit(0);
  } catch (err) {
    console.error('Error connecting:', err.message);
  }
}

run();
