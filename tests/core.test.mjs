// v2.0 の どだい：いきなり リンクの 画面・v1 の 見た目・1 画面に おさまる・ファイルの もれ・v1 の きろくは さわらない
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
  async "ひらくと いきなり リンクの 画面（起動画面・オープニング なし）。v1 の そら・タイトル・ピクセ・おしらせ"(t) {
    const { server, p } = await openApp(t);
    const s = await p.ev(`({
      start: !!document.getElementById("start-screen"),
      empty: !document.getElementById("empty").hidden,
      bar: ["menu-btn", "mail-btn", "add-group"].every((id) => document.getElementById(id)),
      dialogs: document.querySelectorAll("dialog[open]").length,
      title: document.querySelector(".title").textContent,
      stars: document.getElementById("stars").width > 0,
      pixe: !!document.querySelector("#npc-body svg"),
      foot: document.querySelector(".footer-maker").textContent,
    })`);
    t.ok(!s.start, "起動画面が のこって いる");
    t.ok(s.empty, "グループが ない ときの「グループを つくる」が でない");
    t.ok(s.bar, "うえの だんの ボタン（メニュー・おしらせ・＋）が たりない");
    t.eq(s.dialogs, 0, "なにか まどが ひらいて いる");
    t.ok(s.title.includes("WARPIX") && s.stars && s.pixe, "タイトル・星・ピクセの どれかが ない");
    t.eq(s.foot, "© 2026 WARPIX製作所", "フッターが ちがう");
    // ロゴは だんの まんなか（ボタンで ずれない）
    const mid = await p.ev(`(() => { const r = document.querySelector(".logo-row .title").getBoundingClientRect(); return Math.abs(r.left + r.width / 2 - innerWidth / 2); })()`);
    t.ok(mid <= 3, `ロゴが まんなかに ない（${mid}px ずれ）`);
    t.noErrors(p);
    await server.close();
  },

  async "リンク 12 こ でも 1 画面に おさまり、スクロール しない（いろんな iPhone の おおきさ）"(t) {
    for (const [w, h, name] of SIZES) {
      const { server, p, b } = await openApp(t, { width: w, height: h, storage: { "warpix-v2-groups": groupsData([["すきなバンド", BAND]]) } });
      const m = await p.ev(`(() => {
        const tiles = [...document.querySelectorAll(".links .pixel-btn")];
        const foot = document.querySelector(".footer-maker").getBoundingClientRect();
        return { n: tiles.length, sh: document.documentElement.scrollHeight, sw: document.documentElement.scrollWidth, bottom: Math.max(...tiles.map((x) => x.getBoundingClientRect().bottom)), right: Math.max(...tiles.map((x) => x.getBoundingClientRect().right)), minH: Math.min(...tiles.map((x) => x.getBoundingClientRect().height)), add: !!document.getElementById("link-add"), foot: foot.bottom };
      })()`);
      t.eq(m.n, 12, `${name}：リンクが 12 こ ない`);
      t.ok(!m.add, `${name}：12 こ なのに「＋ リンクを 追加」が ある`);
      t.ok(m.sh <= h && m.sw <= w, `${name}：スクロール できて しまう（${m.sw}×${m.sh}）`);
      t.ok(m.bottom <= h && m.right <= w && m.foot <= h, `${name}：はみでる（リンクの した ${m.bottom}・みぎ ${m.right}・フッター ${m.foot}）`);
      t.ok(m.minH >= (h < 600 ? 34 : 44), `${name}：リンクが ひくすぎて おしにくい（${m.minH}px）`);
      t.noErrors(p);
      await b.close();
      await server.close();
    }
    const { server, p } = await openApp(t, { storage: { "warpix-v2-groups": groupsData([["すきなバンド", BAND], ["まいにち", ["youtube", "twitter"]]]) } });
    await p.shot("v2-main.png");
    await server.close();
  },

  async "v1 の きろく（warpix-…）は よまない・けさない"(t) {
    const { server, p } = await openApp(t, { storage: { "warpix-pixe": { born: "2026-10-01" }, "warpix-parties": { at: 0 }, "warpix-cassette": ["youtube"], "warpix-mylinks": [{ id: "my-1", label: "まえ", url: "https://a.example.com/", icon: "star" }] } });
    t.ok(await p.ev(`!document.getElementById("empty").hidden && CASSETTES.mine().length === 0`), "v1 の きろくを よんで いる");
    await p.ev(`CASSETTES.addGroup("テスト")`);
    const keys = await p.ev(`Object.keys(localStorage).sort()`);
    t.ok(["warpix-pixe", "warpix-parties", "warpix-cassette", "warpix-mylinks"].every((k) => keys.includes(k)), `v1 の きろくが きえた：${keys.join(", ")}`);
    t.eq(keys.filter((k) => k.startsWith("warpix-") && !k.startsWith("warpix-v2-")).length, 4, `v1 の キーに かきこんだ：${keys.join(", ")}`);
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
