/**
 * Generates the Open Graph images (public/og/og-es.jpg, public/og/og-en.jpg).
 *
 * Renders an HTML card with the local fonts in headless Chrome, then encodes it
 * as a JPEG under 300 KB with sharp. Run it only when the copy changes:
 *
 *   CHROME_PATH="C:/Program Files/Google/Chrome/Application/chrome.exe" node scripts/generate-og.mjs
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import sharp from 'sharp';

const root = resolve(import.meta.dirname, '..');
const chrome = process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const outDir = join(root, 'public', 'og');
mkdirSync(outDir, { recursive: true });

const font = (pkg, file) => pathToFileURL(join(root, 'node_modules', '@fontsource-variable', pkg, 'files', file)).href;
const photo = `data:image/webp;base64,${readFileSync(join(root, 'src', 'assets', 'photo', 'osmar-liera.webp')).toString('base64')}`;

const cards = {
  es: {
    kicker: 'solicitud → agente → herramientas → aprobación → resultado',
    role: 'Applied AI Engineer · Backend / Full-Stack',
    lead: 'Agentes LLM, servidores MCP y salidas estructuradas en producción, con aprobación humana.',
    meta: 'La Paz, BCS, México · Remoto o híbrido',
  },
  en: {
    kicker: 'request → agent → tools → approval → result',
    role: 'Applied AI Engineer · Backend / Full-Stack',
    lead: 'LLM agents, MCP servers and structured outputs in production, with human approval.',
    meta: 'La Paz, BCS, Mexico · Remote or hybrid',
  },
};

const html = (card) => `<!doctype html>
<html><head><meta charset="utf-8"><style>
@font-face { font-family: 'Display'; src: url('${font('bricolage-grotesque', 'bricolage-grotesque-latin-opsz-normal.woff2')}') format('woff2'); font-weight: 200 800; }
@font-face { font-family: 'Body'; src: url('${font('instrument-sans', 'instrument-sans-latin-wght-normal.woff2')}') format('woff2'); font-weight: 400 700; }
@font-face { font-family: 'Mono'; src: url('${font('jetbrains-mono', 'jetbrains-mono-latin-wght-normal.woff2')}') format('woff2'); font-weight: 100 800; }
* { margin: 0; box-sizing: border-box; }
html, body { width: 1200px; height: 630px; overflow: hidden; }
body { position: relative; background: #05090d; color: #edf3f6; font-family: 'Body'; }
body::before { content: ''; position: absolute; inset: 0;
  background: radial-gradient(700px 420px at 90% 0%, rgba(47,201,230,.22), transparent 60%),
              radial-gradient(circle at 1px 1px, rgba(147,169,181,.16) 1px, transparent 0) 0 0 / 26px 26px; }
.photo { position: absolute; right: 0; top: 0; width: 470px; height: 630px; object-fit: cover; object-position: 30% 0;
  -webkit-mask-image: linear-gradient(to right, transparent 0%, #000 35%), linear-gradient(to top, transparent 0%, #000 30%);
  -webkit-mask-composite: source-in; mask-composite: intersect; }
.box { position: absolute; left: 782px; top: 44px; width: 214px; height: 226px; border: 2px solid rgba(95,224,245,.7); border-radius: 4px; }
.box span { position: absolute; left: -2px; top: -28px; background: #5fe0f5; color: #02161c; font: 600 15px 'Mono'; padding: 3px 8px; border-radius: 3px; }
.content { position: absolute; left: 72px; top: 64px; width: 760px; }
.kicker { font: 500 18px 'Mono'; color: #5fe0f5; letter-spacing: .01em; }
h1 { margin-top: 30px; font-family: 'Display'; font-weight: 750; font-size: 150px; line-height: .84; letter-spacing: -.045em; }
h1 span { display: block; color: #5fe0f5; padding-left: 36px; }
.role { margin-top: 34px; font-family: 'Display'; font-size: 36px; font-weight: 650; letter-spacing: -.015em; }
.lead { margin-top: 14px; font-size: 25px; line-height: 1.35; color: #b6c6cf; width: 680px; }
.meta { position: absolute; left: 72px; bottom: 44px; font: 500 18px 'Mono'; color: #93a9b5; }
.meta b { color: #74e8ad; font-weight: 500; }
.url { position: absolute; right: 48px; bottom: 44px; font: 600 18px 'Mono'; color: #edf3f6; background: rgba(5,9,13,.7); padding: 6px 12px; border-radius: 8px; border: 1px solid #2a4352; }
</style></head><body>
<img class="photo" src="${photo}" alt="">
<div class="box"><span>osmar_liera</span></div>
<div class="content">
  <p class="kicker">${card.kicker}</p>
  <h1>Osmar<span>Liera</span></h1>
  <p class="role">${card.role}</p>
  <p class="lead">${card.lead}</p>
</div>
<p class="meta"><b>●</b> ${card.meta}</p>
<p class="url">osmarlg.elroi.cloud</p>
</body></html>`;

const work = mkdtempSync(join(tmpdir(), 'og-'));
try {
  for (const [lang, card] of Object.entries(cards)) {
    const page = join(work, `og-${lang}.html`);
    const png = join(work, `og-${lang}.png`);
    writeFileSync(page, html(card));
    execFileSync(chrome, [
      '--headless=new',
      '--disable-gpu',
      '--hide-scrollbars',
      '--allow-file-access-from-files',
      '--force-device-scale-factor=1',
      '--window-size=1200,630',
      '--virtual-time-budget=3000',
      `--screenshot=${png}`,
      pathToFileURL(page).href,
    ]);
    const out = join(outDir, `og-${lang}.jpg`);
    await sharp(png).resize(1200, 630, { fit: 'cover', position: 'top' }).jpeg({ quality: 84, mozjpeg: true }).toFile(out);
    console.log(`${out} — ${Math.round(statSync(out).size / 1024)} KB`);
  }
} finally {
  rmSync(work, { recursive: true, force: true });
}
