import { chromium } from 'playwright';
import { createHash } from 'node:crypto';
import { mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const BASE = process.env.AGROWAY_FIELD_BASE_URL || 'http://127.0.0.1:4173';
const EVIDENCE_DIR = process.env.AGROWAY_PLAYWRIGHT_EVIDENCE || '/tmp/agroway-playwright-evidence';
const results = [];
const consoleErrors = [];
const pageErrors = [];

function check(name, condition, detail = '') {
  if (!condition) throw new Error(`FAIL ${name}${detail ? ` :: ${detail}` : ''}`);
  results.push(name);
  console.log(`PASS ${name}${detail ? ` :: ${detail}` : ''}`);
}
function sha256(bytes) { return createHash('sha256').update(bytes).digest('hex'); }
function validIso(value) { return typeof value === 'string' && Number.isFinite(Date.parse(value)); }
async function jsonStorage(page, key) {
  return page.evaluate(k => { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch { return null; } }, key);
}
async function resetBackend(request) {
  const response = await request.post(`${BASE}/api/dev/_test/reset`);
  check('backend test reset accepted', response.ok(), `HTTP ${response.status()}`);
}
async function waitBackendOnline(page, selector) {
  await page.waitForFunction(sel => document.querySelector(sel)?.dataset.online === 'true', selector, { timeout: 8000 });
}
async function assertNoOverflow(page, label) {
  const metrics = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, innerWidth: window.innerWidth }));
  check(`${label} no horizontal overflow`, metrics.scrollWidth <= metrics.innerWidth + 1, JSON.stringify(metrics));
}
async function attachDiagnostics(page, label) {
  page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(`${label}: ${msg.text()}`); });
  page.on('pageerror', err => pageErrors.push(`${label}: ${err.message}`));
}

await mkdir(EVIDENCE_DIR, { recursive: true });
const browser = await chromium.launch({ headless: true });
try {
  const desktop = await browser.newContext({ viewport: { width: 1440, height: 900 }, acceptDownloads: true });
  await resetBackend(desktop.request);
  const page = await desktop.newPage();
  await attachDiagnostics(page, 'desktop');
  const documentResponse = await page.goto(BASE, { waitUntil: 'networkidle', timeout: 20000 });
  check('desktop document HTTP 200', documentResponse?.status() === 200, `HTTP ${documentResponse?.status()}`);
  const headers = documentResponse?.headers() || {};
  check('nosniff response header', headers['x-content-type-options'] === 'nosniff');
  check('frame deny response header', headers['x-frame-options'] === 'DENY');
  check('no-referrer response header', headers['referrer-policy'] === 'no-referrer');
  check('localhost is secure context', await page.evaluate(() => window.isSecureContext === true));
  await assertNoOverflow(page, 'desktop');

  const manifestResponse = await desktop.request.get(`${BASE}/manifest.webmanifest`);
  check('manifest served over real HTTP', manifestResponse.status() === 200);
  const sw = await page.evaluate(async () => {
    if (!('serviceWorker' in navigator)) return { supported: false };
    const registration = await Promise.race([
      navigator.serviceWorker.ready,
      new Promise((_, reject) => setTimeout(() => reject(new Error('SERVICE_WORKER_READY_TIMEOUT')), 8000))
    ]);
    return { supported: true, active: Boolean(registration.active), scriptURL: registration.active?.scriptURL || '' };
  });
  check('Service Worker API supported', sw.supported === true);
  check('Service Worker active on real origin', sw.active === true, sw.scriptURL);
  check('Service Worker script is canonical asset', sw.scriptURL.endsWith('/service-worker.js'), sw.scriptURL);

  const statusResponse = await desktop.request.get(`${BASE}/api/dev/status`);
  const status = await statusResponse.json();
  check('dev backend status HTTP 200', statusResponse.ok());
  check('dev backend trust boundary explicit', status.trust === 'LOCAL_DEV_BACKEND_NOT_PRODUCTION', status.trust);

  await page.click('#profileButton');
  await waitBackendOnline(page, '#devBackendAccountStatus');
  const inviteEmail = 'playwright.field@elporvenir.demo';
  await page.fill('#inviteEmail', inviteEmail);
  await page.selectOption('#inviteRole', 'OPERATOR');
  await page.click('#inviteForm button[type="submit"]');
  await page.waitForFunction(() => document.querySelector('#inviteResult')?.textContent?.includes('Persistida en LOCAL_DEV_BACKEND'), null, { timeout: 8000 });
  const invitations = await jsonStorage(page, 'agroway.field.demo.invitations.v1');
  const invitation = invitations?.find(x => x.email === inviteEmail);
  check('invitation exists in native localStorage', Boolean(invitation));
  check('invitation marked backend persisted', invitation?.backendPersisted === true);
  check('invitation is no longer local-only after server receipt', invitation?.localOnly === false);
  check('invitation delivery remains NOT_SENT_DEV', invitation?.deliveryState === 'NOT_SENT_DEV');
  check('invitation server received-time valid', validIso(invitation?.serverReceivedAt), invitation?.serverReceivedAt);
  const statusAfterInvite = await (await desktop.request.get(`${BASE}/api/dev/status`)).json();
  check('server persisted invitation', Number(statusAfterInvite.persisted?.invitations) >= 1);

  await page.click('#requestTenantExportButton');
  await page.waitForFunction(() => document.querySelector('#exportLedger .export-state')?.textContent === 'READY', null, { timeout: 8000 });
  const exports = await jsonStorage(page, 'agroway.field.demo.export-requests.v1');
  const fullExport = exports?.find(x => x.scope === 'FULL_TENANT_DATA' && x.state === 'READY');
  check('full tenant export becomes READY only with server artifact', Boolean(fullExport?.objectRef && fullExport?.digestSha256));
  check('full tenant export digest is SHA-256', /^[a-f0-9]{64}$/.test(fullExport?.digestSha256 || ''));
  const exportApiResponse = await desktop.request.get(`${BASE}${fullExport.objectRef}`);
  const exportApiBytes = Buffer.from(await exportApiResponse.body());
  const exportHeaderDigest = exportApiResponse.headers()['x-agroway-sha256'];
  check('export HTTP download endpoint succeeds', exportApiResponse.ok());
  check('export header digest matches UI state', exportHeaderDigest === fullExport.digestSha256);
  check('export HTTP bytes digest matches UI state', sha256(exportApiBytes) === fullExport.digestSha256);
  const downloadPromise = page.waitForEvent('download');
  await page.locator('#exportLedger a[download]').first().click();
  const download = await downloadPromise;
  const savedDownload = path.join(EVIDENCE_DIR, download.suggestedFilename());
  await download.saveAs(savedDownload);
  const downloadedBytes = await readFile(savedDownload);
  check('browser download bytes match server SHA-256', sha256(downloadedBytes) === fullExport.digestSha256, savedDownload);

  const eventTime = new Date(Date.now() - 10_000).toISOString();
  const envelope = {
    id: 'env-http-playwright-ready-01',
    kind: 'LOCAL_TASK_EVIDENCE_CAPTURED',
    title: 'Playwright HTTP ready envelope',
    tenantId: 'tenant-demo',
    taskId: 't1',
    createdAt: eventTime,
    localOnly: true,
    canonicalMutated: false
  };
  await page.evaluate(env => localStorage.setItem('agroway.field.demo.queue.v1', JSON.stringify([env])), envelope);
  await page.reload({ waitUntil: 'networkidle' });
  await page.click('#queueButton');
  await page.click('#syncReviewButton');
  await waitBackendOnline(page, '#devBackendSyncStatus');
  const readyCard = page.locator(`[data-sync-envelope="${envelope.id}"][data-sync-status="READY_FOR_SERVER_SUBMISSION"]`);
  check('real browser renders ready sync assessment', await readyCard.count() === 1);
  await readyCard.locator('.sync-review-action').click();
  await page.waitForFunction(() => {
    const q = JSON.parse(localStorage.getItem('agroway.field.demo.queue.v1') || '[]');
    return q.length === 0;
  }, null, { timeout: 8000 });
  const acks = await jsonStorage(page, 'agroway.field.demo.server-acks.v1');
  const ack = acks?.find(x => x.envelopeId === envelope.id && x.ackId);
  check('outbox clears only after server ACK', Boolean(ack));
  check('ACK state accepted', ack?.state === 'ACCEPTED');
  check('ACK preserves event-time', ack?.eventTime === eventTime, `${ack?.eventTime} vs ${eventTime}`);
  check('ACK has valid received-time', validIso(ack?.receivedAt), ack?.receivedAt);
  check('ACK received-time not before event-time', Date.parse(ack.receivedAt) >= Date.parse(eventTime));
  check('ACK digest present', /^[a-f0-9]{64}$/.test(ack?.ackSha256 || ''));
  check('sync ledger renders server ACK', (await page.locator('#syncActionLedger .server-ack').count()) >= 1);
  const statusAfterSync = await (await desktop.request.get(`${BASE}/api/dev/status`)).json();
  check('server persisted sync receipt', Number(statusAfterSync.persisted?.syncReceipts) >= 1);
  check('server persisted sync ACK', Number(statusAfterSync.persisted?.syncAcks) >= 1);
  await page.screenshot({ path: path.join(EVIDENCE_DIR, 'field-http-desktop-1440x900.png'), fullPage: false });
  await desktop.close();

  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, acceptDownloads: true });
  const mobilePage = await mobile.newPage();
  await attachDiagnostics(mobilePage, 'mobile');
  const mobileResponse = await mobilePage.goto(BASE, { waitUntil: 'networkidle', timeout: 20000 });
  check('mobile document HTTP 200', mobileResponse?.status() === 200);
  await assertNoOverflow(mobilePage, 'mobile');
  const mobileTarget = await mobilePage.locator('#mobileActivityButton').boundingBox();
  check('mobile primary action has >=44px touch target', Boolean(mobileTarget && mobileTarget.width >= 44 && mobileTarget.height >= 44), JSON.stringify(mobileTarget));
  check('mobile uses native localStorage', await mobilePage.evaluate(() => { localStorage.setItem('__agroway_probe', 'ok'); const v = localStorage.getItem('__agroway_probe'); localStorage.removeItem('__agroway_probe'); return v === 'ok'; }));
  const mobileSw = await mobilePage.evaluate(async () => {
    const registration = await Promise.race([
      navigator.serviceWorker.ready,
      new Promise((_, reject) => setTimeout(() => reject(new Error('MOBILE_SW_TIMEOUT')), 8000))
    ]);
    return Boolean(registration.active);
  });
  check('mobile Service Worker active', mobileSw === true);
  await mobilePage.screenshot({ path: path.join(EVIDENCE_DIR, 'field-http-mobile-390x844.png'), fullPage: false });
  await mobile.close();

  check('browser console has zero errors', consoleErrors.length === 0, consoleErrors.join(' | '));
  check('browser pageerror has zero errors', pageErrors.length === 0, pageErrors.join(' | '));
  console.log(`PASS_NATIVE_FIELD_HTTP_PLAYWRIGHT ${results.length}/${results.length}`);
} finally {
  await browser.close();
}
