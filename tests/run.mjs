// テストをまとめて流す。
//   node tests/run.mjs              … ぜんぶ（4 つ同時に）
//   node tests/run.mjs adventure    … 名前に adventure を含むテストだけ
//   node tests/run.mjs --jobs 1     … 1 つずつ順番に（いちばん安定。時間は かかる）
// Chrome の場所は自動でさがす（見つからないときは環境変数 CHROME_PATH）。
// スクリーンショットは tests/.output/ に保存される。
import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";
import { spawn } from "node:child_process";
import { cpus } from "node:os";
import * as harness from "./lib/harness.mjs";

const args = process.argv.slice(2);
const opt = (name) => {
  const i = args.indexOf(name);
  if (i < 0) return null;
  const v = args[i + 1];
  args.splice(i, 2);
  return v;
};
const jobsArg = opt("--jobs");
const only = opt("--files"); // ワーカー用：このファイルだけ（カンマ区切り）
const filter = args[0] ?? "";
const dir = join(harness.ROOT, "tests");
const all = readdirSync(dir).filter((f) => f.endsWith(".test.mjs") && f.includes(filter)).sort();
const files = only ? only.split(",") : all;
const jobs = Math.max(1, Math.min(Number(jobsArg ?? Math.min(4, Math.floor(cpus().length / 2) || 1)), files.length));
const started = Date.now();

// ---------- 1 つの ファイルを ながす（結果の行を かえす） ----------
async function runFile(file) {
  const lines = [];
  let passed = 0;
  let failed = 0;
  const mod = await import(pathToFileURL(join(dir, file)).href);
  for (const [name, fn] of Object.entries(mod.default)) {
    const label = `${file.replace(".test.mjs", "")} › ${name}`;
    const problems = [];
    const t = {
      ...harness,
      ok(cond, msg) { if (!cond) problems.push(msg); },
      eq(actual, expected, msg) {
        if (JSON.stringify(actual) !== JSON.stringify(expected)) problems.push(`${msg}（期待: ${JSON.stringify(expected)} / 実際: ${JSON.stringify(actual)}）`);
      },
      // ページで起きた JavaScript エラーがないこと
      noErrors(...pages) {
        for (const p of pages) for (const e of p.errors) problems.push(`ページのエラー: ${String(e).split("\n")[0]}`);
      },
    };
    const t0 = Date.now();
    try {
      await fn(t);
    } catch (e) {
      problems.push(`例外: ${e?.stack?.split("\n").slice(0, 2).join(" ") ?? e}`);
    } finally {
      await harness.closeAll();
    }
    const sec = ((Date.now() - t0) / 1000).toFixed(1);
    if (problems.length) {
      failed++;
      lines.push(`✗ ${label}  (${sec}s)`, ...problems.map((p) => `    - ${p}`));
    } else {
      passed++;
      lines.push(`✓ ${label}  (${sec}s)`);
    }
  }
  return { lines, passed, failed };
}

if (jobs === 1 || only) {
  // ---------- ひとりで ぜんぶ（ワーカーも ここ） ----------
  let passed = 0;
  let failed = 0;
  for (const file of files) {
    const r = await runFile(file);
    passed += r.passed;
    failed += r.failed;
    // ワーカーのときは、ファイルごとに まとめて 親へ わたす
    if (only) process.stdout.write(JSON.stringify({ file, ...r }) + "\n");
    else console.log(r.lines.join("\n"));
  }
  if (!only) console.log(`\n${passed} passed, ${failed} failed  (${((Date.now() - started) / 1000).toFixed(0)}s)`);
  process.exit(failed ? 1 : 0);
} else {
  // ---------- 何人かで わけて ながす ----------
  // 大きい ファイル（だいたい 長く かかる）から じゅんに、いちばん すいている ワーカーへ
  const size = (f) => statSync(join(dir, f)).size;
  const queues = Array.from({ length: jobs }, () => ({ files: [], load: 0 }));
  for (const f of [...files].sort((a, b) => size(b) - size(a))) {
    const q = queues.reduce((a, b) => (b.load < a.load ? b : a));
    q.files.push(f);
    q.load += size(f);
  }
  const results = new Map();
  const me = fileURLToPath(import.meta.url);
  console.log(`${files.length} ファイルを ${jobs} つ 同時に ながします…`);
  await Promise.all(
    queues.map(
      (q, i) =>
        new Promise((resolve) => {
          // ワーカーごとに Chrome の ポートを ずらして、ぶつからないように する
          const child = spawn(process.execPath, [me, "--files", q.files.join(",")], {
            env: { ...process.env, WARPIX_PORT_BASE: String(9400 + i * 150) },
            stdio: ["ignore", "pipe", "inherit"],
          });
          let buf = "";
          child.stdout.on("data", (d) => {
            buf += d;
            let n;
            while ((n = buf.indexOf("\n")) >= 0) {
              const line = buf.slice(0, n);
              buf = buf.slice(n + 1);
              try {
                const r = JSON.parse(line);
                results.set(r.file, r);
                console.log(r.lines.join("\n"));
              } catch {
                if (line.trim()) console.log(line);
              }
            }
          });
          child.on("close", resolve);
        })
    )
  );
  let passed = 0;
  let failed = 0;
  const missing = files.filter((f) => !results.has(f));
  for (const r of results.values()) {
    passed += r.passed;
    failed += r.failed;
  }
  // 最後に、こけた ものだけ もういちど まとめて みせる
  const fails = [];
  for (const f of files) {
    let inFail = false;
    for (const l of results.get(f)?.lines ?? []) {
      if (!l.startsWith("    - ")) inFail = l.startsWith("✗");
      if (inFail) fails.push(l);
    }
  }
  if (fails.length) console.log(`\n--- こけた テスト ---\n${fails.join("\n")}`);
  for (const f of missing) console.log(`✗ ${f} が さいごまで ながれなかった`);
  console.log(`\n${passed} passed, ${failed + missing.length} failed  (${((Date.now() - started) / 1000).toFixed(0)}s, ${jobs} 並列)`);
  process.exit(failed || missing.length ? 1 : 0);
}
