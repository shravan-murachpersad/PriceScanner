// Builds the one-pagers: node sales/build-onepagers.js sales
const fs = require('fs'); const path = require('path');
const { chromium } = require('playwright');
const dir = process.argv[2];
const tpl = fs.readFileSync(path.join(dir, 'onepager-template.html'), 'utf8');
const common = { FREE_MONTHS: '6', CONTACT: '[Phone / WhatsApp] · [Email]' };
const variants = {
  courts: { RETAILER: 'Courts Mammouth', SITE: 'your website',
    HOOK: '<b>Instalments up front.</b> Monthly prices appear next to the cash price, showing what makes Courts different.',
    MOCK_PRODUCT: '55" 4K Smart TV', MOCK_EXTRA: '<div class="inst">or Rs X,XXX / month</div>',
    NEED_EXTRA: ' (plus instalments)' },
  '361': { RETAILER: '361', SITE: '361.mu',
    HOOK: '<b>Your promotions highlighted.</b> Deals and discounted prices are featured in a "Deals this week" section on the home screen.',
    MOCK_PRODUCT: 'Wireless headphones', MOCK_EXTRA: '',
    NEED_EXTRA: '' },
};
(async () => {
  const b = await chromium.launch();
  for (const [k, v] of Object.entries(variants)) {
    const vals = { ...common, ...v };
    const html = tpl.replace(/\{\{(\w+)\}\}/g, (_, n) => vals[n] ?? '');
    const htmlPath = path.join(dir, `MyBuddy-onepager-${k}.html`);
    fs.writeFileSync(htmlPath, html);
    const p = await b.newPage();
    await p.goto('file://' + htmlPath);
    await p.pdf({ path: path.join(dir, `MyBuddy-onepager-${k}.pdf`), format: 'A4', printBackground: true });
    await p.setViewportSize({ width: 794, height: 1123 });
    await p.screenshot({ path: path.join(dir, `preview-${k}.png`) });
    const over = await p.evaluate(() => { const m=document.querySelector('main').getBoundingClientRect(); const f=document.querySelector('footer').getBoundingClientRect(); return [m.bottom, f.top]; });
    console.log(k, 'main bottom vs footer top', over);
  }
  await b.close();
})();
