// v2.0 の どだい：いきなり リンクの 画面・1 画面に おさまる・ファイルの もれ・v1 の きろくは さわらない
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { openApp, groupsData, BAND } from "./lib/app.mjs";

const SIZES = [
  [375, 548, "iPhone SE（Safari）"],
  [375, 667, "iPhone SE（ホーム画面）"],
  [390, 664, "iPhone 15（Safari）"],
  [390, 844, "iPhone 15（ホーム画面）"],
  [430, 932, "iPhone Pro Max"],
  [320, 568, "いちばん ちいさい"],
];

export default {
  async "ひらくと いきなり リンクの 画面（起動画面・オープニング なし）。エラーも ない"(t) {
    const { server, p } = await openApp(t);
    const s = await p.ev(`({
      start: !!document.getElementById("start-screen"),
      empty: !document.getElementById("empty").hidden,
      bar: !!document.getElementById("gear-btn") && !!document.getElementById("mail-btn") && !!document.getElementById("add-group"),
      dialogs: document.querySelectorAll("dialog[open]").length,
      title: document.querySelector(".logo").textContent,
    })`);
    t.ok(!s.start, "起動画面が のこって いる");
    t.ok(s.empty, "グループが ない ときの「グループを つくる」が でない");
    t.ok(s.bar, "うえの だんの ボタン（⚙️・✉️・＋）が たりない");
    t.eq(s.dialogs, 0, "なにか まどが ひらいて いる");
    t.ok(s.title.includes("WARPIX"), "ロゴが ない");
    t.noErrors(p);
    await server.close();
  },

  async "リンク 12 こ でも 1 画面に おさまり、スクロール しない（いろんな iPhone の おおきさ）"(t) {
    for (const [w, h, name] of SIZES) {
      const { server, p, b } = await openApp(t, { width: w, height: h, storage: { "warpix-v2-groups": groupsData([["すきなバンド", BAND]]) } });
      const m = await p.ev(`(() => {
        const tiles = [...document.querySelectorAll(".links .tile")];
        const last = tiles.at(-1).getBoundingClientRect();
        return { n: tiles.length, sh: document.documentElement.scrollHeight, sw: document.documentElement.scrollWidth, bottom: last.bottom, right: Math.max(...tiles.map((x) => x.getBoundingClientRect().right)), minH: Math.min(...tiles.map((x) => x.getBoundingClientRect().height)), add: !!document.getElementById("add-link") };
      })()`);
      t.eq(m.n, 12, `${name}：リンクが 12 こ ない`);
      t.ok(!m.add, `${name}：12 こ なのに「＋ リンクを ついか」が ある`);
      t.ok(m.sh <= h && m.sw <= w, `${name}：スクロール できて しまう（${m.sw}×${m.sh}）`);
      t.ok(m.bottom <= h && m.right <= w, `${name}：リンクが 画面から はみでる（下 ${m.bottom}・右 ${m.right}）`);
      t.ok(m.minH >= (h < 600 ? 36 : 44), `${name}：リンクが ひくすぎて おしにくい（${m.minH}px）`);
      t.noErrors(p);
      await b.close();
      await server.close();
    }
    await p_shot(t);
  },

  async "v1 の きろく（warpix-…）は よまない・けさない"(t) {
    const { server, p } = await openApp(t, { storage: { "warpix-pixe": { born: "2026-10-01" }, "warpix-party": { parties: [] }, "warpix-score": 1234 } });
    await p.ev(`groups.addGroup("テスト")`);
    const keys = await p.ev(`Object.keys(localStorage).sort()`);
    t.ok(["warpix-pixe", "warpix-party", "warpix-score"].every((k) => keys.includes(k)), `v1 の きろくが きえた：${keys.join(", ")}`);
    t.ok(keys.filter((k) => k.startsWith("warpix-") && !k.startsWith("warpix-v2-")).length === 3, `v1 の キーに かきこんだ：${keys.join(", ")}`);
    t.ok(await p.ev(`!document.getElementById("empty").hidden || groups.list().length === 1`), "v1 の きろくを よんで いる");
    t.noErrors(p);
    await server.close();
  },

  async "サービスワーカーの FILES と index.html の スクリプトが そろって いる"(t) {
    const root = join(import.meta.dirname, "..");
    const sw = readFileSync(join(root, "sw.js"), "utf8");
    const files = [...sw.matchAll(/^\s+"([^"]+)",$/gm)].map((m) => m[1]);
    for (const f of files) if (f !== "./") t.ok(existsSync(join(root, f)), `sw.js の ${f} が ない`);
    const html = readFileSync(join(root, "index.html"), "utf8");
    for (const [, src] of html.matchAll(/<script src="([^"]+)"/g)) t.ok(files.includes(src), `${src} が sw.js の FILES に ない`);
    t.ok(/const VERSION = "warpix-v2\.\d+\.\d+";/.test(sw), "sw.js の VERSION が v2 で ない");
  },
};

// スクリーンショット（見た目の 確認用。tests/.output/）
async function p_shot(t) {
  const { server, p } = await openApp(t, { storage: { "warpix-v2-groups": groupsData([["すきなバンド", BAND], ["しごと", ["メール", "カレンダー"]]]) } });
  await p.shot("v2-main.png");
  await server.close();
}
