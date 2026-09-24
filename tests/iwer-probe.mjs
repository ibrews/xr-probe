import { createReadStream, readFileSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize } from 'node:path';
import { pathToFileURL } from 'node:url';

const root = new URL('..', import.meta.url).pathname.replace(/\/$/, '');
const nm = process.env.NODE_MODULES || '/Users/alex/GH/isle-webxr/node_modules';
const { chromium } = await import(pathToFileURL(`${nm}/playwright/index.mjs`).href);
const iwer = readFileSync(process.env.IWER_JS || `${nm}/iwer/build/iwer.min.js`, 'utf8');
const mode = process.argv[2] || 'hand';
if (!['hand', 'controller'].includes(mode)) throw new Error('Mode must be hand or controller');
const outDir = process.env.TEST_OUTPUT || join(root, 'test-results');
const failures = [];
const check = (name, ok, detail = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
  if (!ok) failures.push(name);
};

const server = createServer((request, response) => {
  const pathname = new URL(request.url, 'http://localhost').pathname;
  if (pathname === '/favicon.ico') {
    response.writeHead(204).end();
    return;
  }
  const relative = pathname === '/' ? 'index.html' : decodeURIComponent(pathname.slice(1));
  const file = normalize(join(root, relative));
  if (!file.startsWith(`${root}/`) || !statSafe(file)) {
    response.writeHead(404).end('Not found');
    return;
  }
  const types = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript' };
  response.writeHead(200, { 'Content-Type': types[extname(file)] || 'application/octet-stream' });
  createReadStream(file).pipe(response);
});
const statSafe = path => { try { return statSync(path).isFile(); } catch { return false; } };
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const { port } = server.address();

const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await context.addInitScript({ content: `${iwer}
window.xrDevice = new IWER.XRDevice(IWER.metaQuest3);
window.xrDevice.installRuntime({ forceInstall: true });
window.xrDevice.stereoEnabled = true;
// Three r170 assumes an XRWebGLBinding whenever depth-sensing is granted; IWER
// grants the feature without the layers state Three uses to create that binding.
const requestSession = navigator.xr.requestSession.bind(navigator.xr);
navigator.xr.requestSession = async (...args) => {
  const session = await requestSession(...args);
  const depthIndex = session.enabledFeatures?.indexOf('depth-sensing') ?? -1;
  if (depthIndex >= 0) session.enabledFeatures.splice(depthIndex, 1);
  return session;
};` });
  const page = await context.newPage();
  page.on('pageerror', error => console.log('pageerror:', error.message));
  page.on('console', message => {
    if (message.type() === 'error' || message.text().startsWith('Error:')) console.log(`console:${message.type()}:`, message.text());
  });
  await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__probe && !document.querySelector('#enter').disabled, null, { timeout: 30000 });
  await page.evaluate(selectedMode => { window.xrDevice.primaryInputMode = selectedMode; }, mode);
  await page.click('#enter');
  try {
    await page.waitForFunction(() => window.__probe.snapshot?.inputSources?.length >= 2, null, { timeout: 30000 });
  } catch (error) {
    console.log('DEBUG', await page.evaluate(() => ({ error: document.querySelector('#error').textContent, snapshot: window.__probe.snapshot, presenting: document.body.classList.contains('presenting'), sources: window.xrDevice?.session?.inputSources?.length })));
    throw error;
  }

  let snapshot = await page.evaluate(() => window.__probe.snapshot);
  check('framebuffer has dimensions', snapshot.framebuffer.width > 0 && snapshot.framebuffer.height > 0, JSON.stringify(snapshot.framebuffer));
  check('two views have finite FOV values', snapshot.views.length === 2 && snapshot.views.every(view => ['left', 'right', 'up', 'down'].every(key => Number.isFinite(view[key]))), JSON.stringify(snapshot.views));
  check('two input sources', snapshot.inputSources.length === 2, String(snapshot.inputSources.length));

  if (mode === 'hand') {
    check('hands use tracked-pointer', snapshot.inputSources.every(source => source.targetRayMode === 'tracked-pointer'));
    check('hands expose 25 joints', snapshot.inputSources.every(source => source.hand.present && source.hand.size === 25), JSON.stringify(snapshot.inputSources.map(source => source.hand)));
    check('hand-tracking feature enabled', snapshot.enabledFeatures.includes('hand-tracking'), JSON.stringify(snapshot.enabledFeatures));
    const before = Object.values(snapshot.eventCounts.selectstart).reduce((sum, count) => sum + count, 0);
    await page.evaluate(() => window.xrDevice.hands.left.updatePinchValue(1));
    await page.waitForFunction(previous => Object.values(window.__probe.snapshot.eventCounts.selectstart).reduce((sum, count) => sum + count, 0) > previous, before, { timeout: 10000 });
    snapshot = await page.evaluate(() => window.__probe.snapshot);
    const after = Object.values(snapshot.eventCounts.selectstart).reduce((sum, count) => sum + count, 0);
    check('left pinch increments selectstart', after === before + 1, `${before} → ${after}`);
  } else {
    check('controllers expose 4 axes', snapshot.inputSources.every(source => source.gamepad?.axes === 4), JSON.stringify(snapshot.inputSources.map(source => source.gamepad)));
  }

  const screenshot = join(outDir, `xr-probe-${mode}.png`);
  await page.screenshot({ path: screenshot });
  console.log(`SCREENSHOT  ${screenshot}`);
  await page.evaluate(() => window.xrDevice.activeSession.end());
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}

console.log(failures.length ? `\n${failures.length} FAILED: ${failures.join(', ')}` : '\nALL PASSED');
process.exit(failures.length ? 1 : 0);
