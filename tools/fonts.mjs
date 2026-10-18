// 日本語の ドット文字（DotGothic16）を、この サイトで つかう 文字 だけに して fonts/ に おく（v1.38）
//   node tools/fonts.mjs          … つくりなおす（ネットに つないで Google Fonts から もらう）
//   node tools/fonts.mjs --check  … たりない 文字が ないか しらべる（tests/fonts.test.mjs が つかう）
// セリフや 文章で あたらしい 文字を つかったら、かならず ながす。ながさないと、その 文字だけ ふつうの 字に なる。
//
// - 入れる 文字：ASCII ぜんぶ ＋ ひらがな・カタカナ ぜんぶ ＋ index.html と *.js に でてくる 文字。
//   かなを ぜんぶ 入れて おくのは、製作所だより（ホームページの news.json）の 題を ピクセが よむ ため。
//   そこに しか ない 漢字は ふつうの 字に なる（かなが おおい ので めったに ない）
// - DotGothic16 は OFL で、予約された 名前が ない ので、しぼって 置いて いい（fonts/OFL-DotGothic16.txt）。
//   ホームページ（warpix.app）の tools/fonts.mjs と おなじ やりかた
// - Press Start 2P（英字）は 予約された 名前（RFN）つき なので、しぼった ものは 配れない → Google Fonts の まま
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dirname, "..");
const CHARS = join(ROOT, "fonts", "chars.txt");
const WOFF2 = join(ROOT, "fonts", "dotgothic16.woff2");
// Google Fonts は ブラウザを 見て 形式を かえる。woff2 を もらう ために Chrome の ふりを する
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36";

export const sources = () => ["index.html", ...readdirSync(ROOT).filter((f) => f.endsWith(".js")).sort()];

export function usedChars() {
  const set = new Set();
  const range = (a, b) => { for (let c = a; c <= b; c++) set.add(String.fromCodePoint(c)); };
  range(0x20, 0x7e); // ASCII
  range(0x3041, 0x3096); // ひらがな
  range(0x30a1, 0x30fc); // カタカナ（ー まで）
  for (const f of sources()) for (const ch of readFileSync(join(ROOT, f), "utf8")) if (ch.codePointAt(0) > 0x7e) set.add(ch);
  for (const ch of ["﻿", "​"]) set.delete(ch);
  return [...set].sort((a, b) => a.codePointAt(0) - b.codePointAt(0));
}

export function missing() {
  let have;
  try { have = new Set([...readFileSync(CHARS, "utf8").replace(/\r?\n$/, "")]); } catch { return usedChars(); }
  return usedChars().filter((ch) => !have.has(ch));
}

async function build() {
  const chars = usedChars();
  const css = await (await fetch(`https://fonts.googleapis.com/css2?family=DotGothic16&text=${encodeURIComponent(chars.join(""))}`, { headers: { "user-agent": UA } })).text();
  const src = css.match(/url\((https:[^)]+)\) format\('woff2'\)/)?.[1];
  if (!src) throw new Error("Google Fonts から woff2 の 住所が もらえなかった\n" + css.slice(0, 300));
  const font = Buffer.from(await (await fetch(src)).arrayBuffer());
  if (font.subarray(0, 4).toString() !== "wOF2") throw new Error("woff2 では なかった");
  writeFileSync(WOFF2, font);
  writeFileSync(CHARS, chars.join("") + "\n");
  console.log(`fonts/dotgothic16.woff2：${chars.length} 文字、${(font.length / 1024).toFixed(1)} KB`);
}

if (process.argv[1] && import.meta.filename === process.argv[1]) {
  if (process.argv.includes("--check")) {
    const m = missing();
    console.log(m.length ? `たりない 文字 ${m.length}：${m.join("")}\n→ node tools/fonts.mjs` : "たりない 文字は ない");
    process.exit(m.length ? 1 : 0);
  } else {
    await build();
  }
}
