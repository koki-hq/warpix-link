// tools/og-card.html を 1200x630 で撮影して og.png に保存する（共有カード画像の作り直し用）
// 使い方: node tools/shoot-og.mjs "C:/Program Files/Google/Chrome/Application/chrome.exe"
import { spawn, execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const chromePath = process.argv[2];
const root = resolve(import.meta.dirname, "..");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const profile = mkdtempSync(join(tmpdir(), "og-"));
const port = 9350;
spawn(chromePath, ["--headless=new", `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, "--mute-audio", "about:blank"]);
// Windows の Chrome は自分を起動し直すので、プロファイル名で探して確実に止める
const cleanup = () => {
  if (process.platform !== "win32") return;
  try {
    execFileSync("powershell", ["-NoProfile", "-Command", `Get-CimInstance Win32_Process -Filter "Name='chrome.exe'" | Where-Object { $_.CommandLine -like '*${profile.split(/[\\/]/).pop()}*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }`], { stdio: "ignore" });
  } catch {}
};
process.on("exit", cleanup);

let targets;
for (let i = 0; i < 50; i++) {
  try { targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); break; } catch { await sleep(200); }
}
const ws = new WebSocket(targets.find((t) => t.type === "page").webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));
let id = 0;
const pending = new Map();
ws.onmessage = (m) => {
  const d = JSON.parse(m.data);
  if (d.id && pending.has(d.id)) { pending.get(d.id)(d); pending.delete(d.id); }
};
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });

await send("Emulation.setDeviceMetricsOverride", { width: 1200, height: 630, deviceScaleFactor: 1, mobile: false });
await send("Page.navigate", { url: pathToFileURL(join(root, "tools", "og-card.html")).href });
await sleep(1500);
// フォントの読み込みを待つ
await send("Runtime.evaluate", { expression: "document.fonts.ready.then(() => true)", awaitPromise: true });
await sleep(300);
const shot = await send("Page.captureScreenshot", { format: "png", clip: { x: 0, y: 0, width: 1200, height: 630, scale: 1 } });
writeFileSync(join(root, "og.png"), Buffer.from(shot.result.data, "base64"));
console.log("saved og.png");
await send("Browser.close");
await sleep(500);
cleanup();
process.exit(0);
