// v2.8：ピクセの セリフ（きせつ・ようび・けしき・きせかえ・つつきすぎ・はりつける・ひるの あいさつ）
import { openApp, groupsData, BAND, sleep } from "./lib/app.mjs";

const G = groupsData([["推し", BAND.slice(0, 3)]]);
const textOf = (p) => p.ev(`new Promise((r) => setTimeout(() => r(document.getElementById("dialog-text").textContent), 1500))`);

export default {
  async "その 日 はじめての あいさつ：ときどき きせつ・ようび、ほかは いつもの"(t) {
    // 2027-01-17 は にちようび・ふゆ（行事の 衣装の ない 日）
    const { server, p } = await openApp(t, { query: "?date=2027-01-17", storage: { "warpix-v2-groups": G, "warpix-v2-pixe": { born: "2026-12-01", days: 3, last: "2027-01-15" } } });
    const greet = (r) => p.ev(`(() => { const m = Math.random; Math.random = () => ${r}; const g = pixe.greeting(); Math.random = m; return g; })()`);
    t.ok(["ゆきだ！\nやねが まっしろ。", "さむいね。\nぼくの アンテナも ひえひえ。"].includes(await greet(0.1)), "きせつの ひとこと に ならない");
    t.eq(await greet(0.4), "おやすみの ひ だね。", "ようびの ひとこと に ならない");
    t.ok(!(await greet(0.9)).includes("ゆき"), "いつもの あいさつ に ならない");
    await server.close();
  },

  async "つつく：けしきの ひとこと、つづけて 5 かい で「もう、わかった わかった。」"(t) {
    const { server, p } = await openApp(t, { storage: { "warpix-v2-groups": G, "warpix-v2-settings": { sky: "day", horizon: "hills" } } });
    await p.ev(`document.querySelectorAll("dialog[open]").forEach((d) => d.close())`);
    await sleep(1600);
    await p.ev(`(() => { const m = Math.random; Math.random = () => 0.999; document.getElementById("npc").click(); Math.random = m; })()`);
    t.eq(await textOf(p), "おかの うえの いえ、\nだれが すんでるんだろう。", "けしきの ひとこと が ない");
    await sleep(3100);
    for (let i = 0; i < 5; i++) await p.ev(`document.getElementById("npc").click()`);
    t.eq(await textOf(p), "もう、\nわかった わかった。", "つつきすぎ");
    t.noErrors(p);
    await server.close();
  },

  async "きせかえ：ネオンに すると 1 かい だけ ひとこと、はりつけると「ぺたっ。」"(t) {
    const { server, p } = await openApp(t, { storage: { "warpix-v2-groups": G } });
    await p.ev(`document.querySelectorAll("dialog[open]").forEach((d) => d.close())`);
    await p.click("#menu-btn");
    await sleep(200);
    await p.click('#tiles-pick [data-tiles="neon"]');
    t.eq(await textOf(p), "わ、まぶしい！\nネオン、にあってる。", "ネオンの ひとこと");
    t.ok(await p.ev(`JSON.parse(localStorage.getItem("warpix-v2-tips")).includes("dress-neon")`), "1 かい だけ に ならない");
    await p.click("#gear-close");
    await p.click("#link-add");
    await sleep(150);
    await p.ev(`Object.defineProperty(navigator, "clipboard", { configurable: true, value: { readText: async () => "https://www.someblog.jp/a" } })`);
    await p.click("#mylink-paste");
    t.eq(await textOf(p), "ぺたっ。\nアドレス、はいったよ。", "はりつけた ひとこと");
    t.noErrors(p);
    await server.close();
  },
};
