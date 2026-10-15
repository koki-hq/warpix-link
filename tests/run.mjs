// テストをまとめて流す。
//   node tests/run.mjs            … ぜんぶ
//   node tests/run.mjs adventure  … 名前に adventure を含むテストだけ
// Chrome の場所は自動でさがす（見つからないときは環境変数 CHROME_PATH）。
// スクリーンショットは tests/.output/ に保存される。
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import * as harness from "./lib/harness.mjs";

const filter = process.argv[2] ?? "";
const dir = join(harness.ROOT, "tests");
const files = readdirSync(dir).filter((f) => f.endsWith(".test.mjs") && f.includes(filter)).sort();

let passed = 0;
let failed = 0;
const started = Date.now();

for (const file of files) {
  const mod = await import(pathToFileURL(join(dir, file)).href);
  const cases = mod.default;
  for (const [name, fn] of Object.entries(cases)) {
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
      console.log(`✗ ${label}  (${sec}s)`);
      for (const p of problems) console.log(`    - ${p}`);
    } else {
      passed++;
      console.log(`✓ ${label}  (${sec}s)`);
    }
  }
}

console.log(`\n${passed} passed, ${failed} failed  (${((Date.now() - started) / 1000).toFixed(0)}s)`);
process.exit(failed ? 1 : 0);
