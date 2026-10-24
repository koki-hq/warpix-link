// テスト用の道具箱：静的サーバー、ヘッドレス Chrome（無音）、ページ操作、後片付け。
// 外部ライブラリなし（Node 22 以上の fetch / WebSocket と、Chrome DevTools Protocol だけ）。
import { spawn, execFileSync } from "node:child_process";
import { createServer } from "node:http";
import { readFileSync, existsSync, mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, extname, resolve } from "node:path";

export const ROOT = resolve(import.meta.dirname, "..", "..");
export const OUT = join(ROOT, "tests", ".output");
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------- Chrome をさがす ----------
export function findChrome() {
  const candidates = [
    process.env.CHROME_PATH,
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
  ].filter(Boolean);
  const found = candidates.find((p) => existsSync(p));
  if (!found) throw new Error("Chrome が見つかりません。環境変数 CHROME_PATH に場所を入れてください。");
  return found;
}

// ---------- 静的サーバー ----------
// online: false（ふつう）のときは config.js を空にして配る → 本物の Supabase につながず、世界の記録も増やさない
const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".png": "image/png",
  ".webmanifest": "application/manifest+json",
  ".json": "application/json",
  ".woff2": "font/woff2",
};
export async function startServer({ online = false, port = 0 } = {}) {
  const server = createServer((req, res) => {
    const path = decodeURIComponent(new URL(req.url, "http://x").pathname);
    if (path === "/config.js" && !online) {
      res.writeHead(200, { "content-type": TYPES[".js"] });
      // おしらせも 本物は よまない（テストで つかう ときは、さきに window.WARPIX_NEWS を いれておく）
      // はじめての 人への せつめいしょ（manual.js）も ふだんは 出さない（つかう テストは さきに window.WARPIX_MANUAL = true）
      // オープニング（prologue.js）も おなじ（つかう テストは さきに window.WARPIX_PROLOGUE = true）
      // はじめての 日（firstDay、v1.54）と よむ じかんの まち（WARPIX_READ_MS）も ふだんは なし
      // きせつの イベント・オープン きねんも ?date= の ない テストでは ださない（WARPIX_EVENT_DAYS）
      return res.end('window.WARPIX_ONLINE = {}; window.WARPIX_NEWS ??= "tests/fixtures/no-news.json"; window.WARPIX_MANUAL ??= false; window.WARPIX_PROLOGUE ??= false; window.WARPIX_FIRSTDAY ??= false; window.WARPIX_READ_MS ??= 0; window.WARPIX_EVENT_DAYS ??= false;');
    }
    const file = join(ROOT, path === "/" ? "index.html" : path);
    if (!file.startsWith(ROOT) || !existsSync(file)) {
      res.writeHead(404).end();
      return;
    }
    // GitHub Pages と おなじく、ほかの じゅうしょからも よめる（ひっこしの テストで つかう）
    res.writeHead(200, { "content-type": TYPES[extname(file)] ?? "application/octet-stream", "access-control-allow-origin": "*" });
    res.end(readFileSync(file));
  });
  await new Promise((r) => server.listen(port, "127.0.0.1", r));
  const url = `http://127.0.0.1:${server.address().port}/`;
  return { url, close: () => new Promise((r) => server.close(r)) };
}

// ---------- ヘッドレス Chrome ----------
// 何人かで 同時に ながすときは、ワーカーごとに ポートの はばを わける（WARPIX_PORT_BASE）
let nextPort = Number(process.env.WARPIX_PORT_BASE) || 9400 + Math.floor(Math.random() * 400);
const live = new Set();

export async function launchBrowser({ width = 480, height = 1000 } = {}) {
  const port = nextPort++;
  const profile = mkdtempSync(join(tmpdir(), "warpix-test-"));
  const proc = spawn(findChrome(), [
    "--headless=new",
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profile}`,
    `--window-size=${width},${height}`,
    "--mute-audio", // テスト中に音を鳴らさない
    "--no-first-run",
    "--no-default-browser-check",
    // GitHub Actions（Linux）では サンドボックスと きょうゆう メモリが つかえない ことが ある（v1.62.1）
    // マウスも がめんも ない ので、そのままだと「マウスの ない たんまつ」あつかいに なる。てもとの パソコンと おなじ に する
    ...(process.env.CI ? ["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu", "--blink-settings=primaryPointerType=4,availablePointerTypes=4,primaryHoverType=2,availableHoverTypes=2"] : []),
    "about:blank",
  ], { stdio: "ignore" });
  const browser = { port, profile, proc, pages: [] };
  live.add(browser);

  let targets = null;
  for (let i = 0; i < 100 && !targets; i++) {
    try {
      targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
    } catch {
      await sleep(100);
    }
  }
  if (!targets) throw new Error("Chrome に接続できませんでした");

  browser.firstPage = () => connectPage(browser, targets.find((t) => t.type === "page").webSocketDebuggerUrl);
  browser.newPage = async (url = "about:blank") => {
    const t = await (await fetch(`http://127.0.0.1:${port}/json/new?${url}`, { method: "PUT" })).json();
    return connectPage(browser, t.webSocketDebuggerUrl);
  };
  browser.close = () => closeBrowser(browser);
  return browser;
}

// Windows の Chrome は起動直後に自分を起動し直すので、起動した pid では止まらない。
// CDP で閉じたうえで、プロファイルのフォルダ名でプロセスを探して確実に止める。
async function closeBrowser(browser) {
  if (!live.has(browser)) return;
  live.delete(browser);
  const page = browser.pages.find((p) => p.ws.readyState === 1);
  try {
    await Promise.race([page?.send("Browser.close"), sleep(1500)]);
  } catch {}
  for (const p of browser.pages) try { p.ws.close(); } catch {}
  await sleep(300);
  killProfile(browser.profile);
  try { rmSync(browser.profile, { recursive: true, force: true }); } catch {}
}

function killProfile(profile) {
  const name = profile.split(/[\\/]/).pop();
  try {
    if (process.platform === "win32") {
      execFileSync("powershell", ["-NoProfile", "-Command",
        `Get-CimInstance Win32_Process -Filter "Name='chrome.exe' OR Name='msedge.exe'" | Where-Object { $_.CommandLine -like '*${name}*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }`], { stdio: "ignore" });
    } else {
      execFileSync("pkill", ["-f", name], { stdio: "ignore" });
    }
  } catch {}
}

export async function closeAll() {
  for (const b of [...live]) await closeBrowser(b);
}
process.on("exit", () => { for (const b of live) killProfile(b.profile); });

// ---------- ページ ----------
async function connectPage(browser, wsUrl) {
  const ws = new WebSocket(wsUrl);
  await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
  let id = 0;
  const pending = new Map();
  const listeners = new Set();
  const page = { ws, errors: [], browser };
  ws.onmessage = (m) => {
    const msg = JSON.parse(m.data);
    if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); }
    if (msg.method === "Runtime.exceptionThrown") page.errors.push(msg.params.exceptionDetails.exception?.description ?? msg.params.exceptionDetails.text);
    if (msg.method === "Runtime.consoleAPICalled" && msg.params.type === "error") page.errors.push("console.error: " + msg.params.args.map((a) => a.value ?? a.description).join(" "));
    for (const fn of listeners) fn(msg);
  };
  page.send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  page.on = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };
  page.waitFor = (method, test = () => true, ms = 10000) => new Promise((resolve, reject) => {
    const off = page.on((m) => { if (m.method === method && test(m.params)) { off(); resolve(m.params); } });
    setTimeout(() => { off(); reject(new Error(`${method} を待ちきれませんでした`)); }, ms);
  });
  // ページの中で式を評価して、結果を返す（Promise も待つ）
  page.ev = async (expr) => {
    const r = await page.send("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true });
    if (r.result?.exceptionDetails) {
      const msg = r.result.exceptionDetails.exception?.description ?? r.result.exceptionDetails.text;
      page.errors.push("evaluate: " + msg);
      throw new Error(msg);
    }
    return r.result?.result?.value;
  };
  // 読みこみ（load）を まってから、さらに wait だけ まつ（同時に ながして 重い ときも、読みこみ前に さわらない）
  page.goto = async (url, wait = 1200) => {
    const loaded = page.waitFor("Page.loadEventFired", () => true, 15000).catch(() => null);
    await page.send("Page.navigate", { url });
    await loaded;
    await sleep(wait);
  };
  page.size = (width, height, mobile = false) => page.send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile });
  // 本物のマウス操作でクリック（要素のまんなか）
  // ほんものの マウスで おす。画面の そとに あれば、人と おなじように スクロールして から
  page.click = async (selector) => {
    const p = await page.ev(`(() => { const el = document.querySelector(${JSON.stringify(selector)}); if (!el) return null; el.scrollIntoView({ block: "nearest" }); const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; })()`);
    if (!p) throw new Error(`${selector} が見つかりません`);
    for (const type of ["mouseMoved", "mousePressed", "mouseReleased"]) {
      await page.send("Input.dispatchMouseEvent", { type, x: p.x, y: p.y, button: "left", clickCount: 1 });
    }
  };
  const codeOf = (k) => (k.length === 1 ? (k === " " ? "Space" : `Key${k.toUpperCase()}`) : k);
  page.key = async (k, type = "press") => {
    const down = { type: "keyDown", key: k, code: codeOf(k), text: k.length === 1 ? k : undefined };
    if (type !== "up") await page.send("Input.dispatchKeyEvent", down);
    if (type !== "down") await page.send("Input.dispatchKeyEvent", { type: "keyUp", key: k, code: codeOf(k) });
  };
  page.type = async (word) => { for (const ch of word) await page.key(ch); };
  page.shot = async (name) => {
    mkdirSync(OUT, { recursive: true });
    const r = await page.send("Page.captureScreenshot", { format: "png" });
    writeFileSync(join(OUT, name), Buffer.from(r.result.data, "base64"));
  };
  // PRESS START を押して、あいさつを最後まで読む
  page.boot = async ({ readIntro = true } = {}) => {
    await page.ev(`document.getElementById("start-btn").click()`);
    await sleep(2600);
    if (readIntro) await page.readIntro();
  };
  page.readIntro = async () => {
    const lines = [];
    for (let i = 0; i < 20; i++) {
      const t = await page.ev(`document.getElementById("dialog-text").textContent`);
      if (t && !lines.includes(t)) lines.push(t);
      if (await page.ev(`npc.ready()`)) break;
      await page.ev(`document.getElementById("dialog").click()`);
      await sleep(250);
    }
    // 文字送りの途中の行は捨てる
    return lines.filter((l) => !lines.some((o) => o !== l && o.startsWith(l)));
  };
  page.text = () => page.ev(`document.getElementById("dialog-text").textContent`);
  await page.send("Runtime.enable");
  await page.send("Page.enable");
  browser.pages.push(page);
  return page;
}
