// tools/splash.html を iPhone の 画面の 大きさごとに 撮影して icons/splash-<よこ>x<たて>.png に 保存する（v1.47.3）
// ホーム画面アプリの 起動画面（apple-touch-startup-image）。index.html の <link> も ここの SIZES と そろえる
// 使い方: node tools/shoot-splash.mjs "C:/Program Files/Google/Chrome/Application/chrome.exe"
import { spawn, execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

// [CSS の よこ, たて, 倍率]（たての 向き）
export const SIZES = [
  [440, 956, 3], // 16 Pro Max・17 Pro Max
  [430, 932, 3], // 14 Pro Max・15 Plus・15 Pro Max・16 Plus
  [428, 926, 3], // 12 Pro Max・13 Pro Max・14 Plus
  [420, 912, 3], // Air
  [414, 896, 3], // XS Max・11 Pro Max
  [414, 896, 2], // XR・11
  [414, 736, 3], // 6s Plus〜8 Plus
  [402, 874, 3], // 16 Pro・17・17 Pro
  [393, 852, 3], // 14 Pro・15・15 Pro・16
  [390, 844, 3], // 12・13・13 Pro・14
  [375, 812, 3], // X・XS・11 Pro・12 mini・13 mini
  [375, 667, 2], // 6s〜8・SE（第2・第3世代）
  [320, 568, 2], // SE（第1世代）
];

const chromePath = process.argv[2];
const root = resolve(import.meta.dirname, "..");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const profile = mkdtempSync(join(tmpdir(), "splash-"));
const port = 9351;
spawn(chromePath, ["--headless=new", `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, "--mute-audio", "about:blank"]);
// Windows の Chrome は自分を起動し直すので、プロファイル名で探して確実に止める
const cleanup = () => {
  if (process.platform !== "win32") return;
  try {
    execFileSync("powershell", ["-NoProfile", "-Command", `Get-CimInstance Win32_Process -Filter "Name='chrome.exe'" | Where-Object { $_.CommandLine -like '*${profile.split(/[\/]/).pop()}*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }`], { stdio: "ignore" });
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

const links = [];
for (const [w, h, r] of SIZES) {
  await send("Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: r, mobile: true });
  await send("Page.navigate", { url: `${pathToFileURL(join(root, "tools", "splash.html")).href}?w=${w}&h=${h}` });
  await sleep(500);
  const shot = await send("Page.captureScreenshot", { format: "png", clip: { x: 0, y: 0, width: w, height: h, scale: 1 } });
  const name = `splash-${w * r}x${h * r}.png`;
  writeFileSync(join(root, "icons", name), Buffer.from(shot.result.data, "base64"));
  links.push(`  <link rel="apple-touch-startup-image" href="icons/${name}" media="(device-width: ${w}px) and (device-height: ${h}px) and (-webkit-device-pixel-ratio: ${r}) and (orientation: portrait)">`);
  console.log("saved", name);
}
console.log("\n" + links.join("\n"));
await send("Browser.close");
await sleep(500);
cleanup();
process.exit(0);
