// 健康診断：重さ（ファイルのサイズ）、スマホでの速さ、待機中の CPU、アクセシビリティ（axe-core）。
//   node tools/health.mjs
// 結果はターミナルに出す。オンライン機能は切って測る（本物の Supabase には触らない）。
import { startServer, launchBrowser, closeAll, sleep } from "../tests/lib/harness.mjs";

const AXE = "https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.10.2/axe.min.js";
const kb = (n) => `${(n / 1024).toFixed(1)} KB`;
const server = await startServer();
const report = [];
const log = (s = "") => { report.push(s); console.log(s); };

// ---------- 1. 重さ ----------
{
  const b = await launchBrowser();
  const p = await b.firstPage();
  await p.send("Network.enable");
  await p.send("Network.setCacheDisabled", { cacheDisabled: true });
  const reqs = new Map();
  p.on((m) => {
    if (m.method === "Network.responseReceived") reqs.set(m.params.requestId, { url: m.params.response.url, type: m.params.type, bytes: 0 });
    if (m.method === "Network.loadingFinished" && reqs.has(m.params.requestId)) reqs.get(m.params.requestId).bytes = m.params.encodedDataLength;
  });
  await p.goto(server.url, 3000);
  const byType = {};
  let total = 0;
  for (const r of reqs.values()) {
    if (r.url.startsWith("data:")) continue;
    const key = new URL(r.url).host.includes("127.0.0.1") ? r.type : `${r.type}（外部）`;
    byType[key] ??= { n: 0, bytes: 0 };
    byType[key].n++;
    byType[key].bytes += r.bytes;
    total += r.bytes;
  }
  log("## 重さ（はじめて開いたとき、キャッシュなし）");
  for (const [k, v] of Object.entries(byType).sort((a, b) => b[1].bytes - a[1].bytes)) log(`- ${k}: ${v.n} 個, ${kb(v.bytes)}`);
  log(`- 合計: ${reqs.size} リクエスト, ${kb(total)}`);
  const dom = await p.ev(`document.getElementsByTagName("*").length`);
  log(`- DOM の要素数: ${dom}`);
  await closeAll();
}

// ---------- 2. スマホでの速さ（遅めの 4G ＋ CPU 4 倍遅く） ----------
{
  const b = await launchBrowser({ width: 390, height: 844 });
  const p = await b.firstPage();
  await p.size(390, 844, true);
  await p.send("Network.enable");
  await p.send("Network.setCacheDisabled", { cacheDisabled: true });
  await p.send("Network.emulateNetworkConditions", { offline: false, latency: 150, downloadThroughput: (1.6 * 1024 * 1024) / 8, uploadThroughput: (750 * 1024) / 8 });
  await p.send("Emulation.setCPUThrottlingRate", { rate: 4 });
  const t0 = Date.now();
  await p.send("Page.navigate", { url: server.url });
  await p.waitFor("Page.loadEventFired", () => true, 60000);
  const loadMs = Date.now() - t0;
  const timing = await p.ev(`(() => { const n = performance.getEntriesByType("navigation")[0]; const fcp = performance.getEntriesByName("first-contentful-paint")[0]; return { dcl: Math.round(n.domContentLoadedEventEnd), fcp: fcp ? Math.round(fcp.startTime) : null }; })()`);
  await p.ev(`document.fonts.ready.then(() => true)`);
  const fontsMs = Date.now() - t0;
  log("\n## スマホでの速さ（遅めの 4G：150ms・1.6Mbps、CPU 4 倍遅く）");
  log(`- 最初に何か描かれるまで（FCP）: ${timing.fcp} ms`);
  log(`- HTML の読み込みが終わるまで（DOMContentLoaded）: ${timing.dcl} ms`);
  log(`- 全部読み終わるまで（load）: ${loadMs} ms`);
  log(`- ドットのフォントがそろうまで: ${fontsMs} ms`);

  // ---------- 3. 待機中の CPU ----------
  await p.send("Network.emulateNetworkConditions", { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
  await p.boot({ readIntro: true });
  await p.send("Performance.enable");
  const metric = async () => Object.fromEntries((await p.send("Performance.getMetrics")).result.metrics.map((m) => [m.name, m.value]));
  const a = await metric();
  await sleep(10000);
  const z = await metric();
  const busy = (z.TaskDuration - a.TaskDuration) / (z.Timestamp - a.Timestamp);
  log("\n## 待機中の CPU（スマホ相当、10 秒なにもしない）");
  log(`- メインスレッドが動いていた割合: ${(busy * 100).toFixed(1)} %`);
  log(`- そのうちスクリプト: ${(((z.ScriptDuration - a.ScriptDuration) / (z.Timestamp - a.Timestamp)) * 100).toFixed(1)} %`);
  log(`- JS のメモリ: ${kb(z.JSHeapUsedSize)}`);

  // 放っておかれて「ページごと眠った」あと（寝る 40 秒 → デモ 20 秒後に開始 → 30 秒で眠る）
  await p.ev(`(() => { const real = performance.now.bind(performance); let extra = 0; performance.now = () => real() + extra; window.__skip = (ms) => (extra += ms); })()`);
  for (const ms of [41000, 21000, 31000]) { await p.ev(`__skip(${ms})`); await sleep(1500); }
  const dozing = await p.ev(`document.body.classList.contains("dozing")`);
  const c = await metric();
  await sleep(10000);
  const d = await metric();
  log(`- ページごと眠ったあと（${dozing ? "眠っている" : "※眠っていない"}）: ${(((d.TaskDuration - c.TaskDuration) / (d.Timestamp - c.Timestamp)) * 100).toFixed(1)} %`);
  log("  ※ GPU を使わないヘッドレス Chrome で測っているので、実機より重く出る");
  await closeAll();
}

// ---------- 4. アクセシビリティ（axe-core） ----------
async function axe(p, label, setup = "") {
  if (setup) { await p.ev(setup); await sleep(400); }
  await p.ev(`new Promise((ok, ng) => { if (window.axe) return ok(); const s = document.createElement("script"); s.src = ${JSON.stringify(AXE)}; s.onload = ok; s.onerror = ng; document.head.append(s); })`);
  const res = await p.ev(`axe.run(document, { resultTypes: ["violations"] }).then((r) => r.violations.map((v) => ({ id: v.id, impact: v.impact, help: v.help, n: v.nodes.length, where: v.nodes.slice(0, 3).map((n) => n.target.join(" ")) })))`);
  log(`\n### ${label}: ${res.length ? `${res.length} 種類の問題` : "問題なし"}`);
  for (const v of res) log(`- [${v.impact}] ${v.id}（${v.n} か所）${v.help}\n    例: ${v.where.join(" ／ ")}`);
  return res;
}
{
  log("\n## アクセシビリティ（axe-core 4.10.2）");
  const b = await launchBrowser();
  const p = await b.firstPage();
  await p.goto(server.url);
  await axe(p, "PRESS START 画面");
  await p.boot();
  await axe(p, "いつもの画面（起動後）");
  await axe(p, "実績画面", `document.getElementById("trophy-btn").click()`);
  await p.ev(`document.getElementById("trophies").close()`);
  await axe(p, "日記", `document.getElementById("diary-btn").click()`);
  await axe(p, "ずかん", `document.querySelector('.diary-tab[data-tab="zukan"]').click()`);
  await p.ev(`document.getElementById("diary").close()`);
  await axe(p, "このページについて", `document.getElementById("about-btn").click()`);
  await p.ev(`document.getElementById("about").close()`);
  await axe(p, "せってい", `document.getElementById("settings-btn").click()`);
  await p.ev(`document.getElementById("settings").close()`);
  await axe(p, "さっきょく（レコードだな）", `localStorage.setItem("warpix-shelf", JSON.stringify(["10430000000000000000000000000000000", "10450000000000000000000000000000000"])); document.getElementById("compose-btn").click()`);
  await p.ev(`document.getElementById("composer").close()`);
  await p.goto(`${server.url}?simple=1`);
  await axe(p, "シンプルモード");
  await closeAll();
}

await server.close();
process.exit(0);
