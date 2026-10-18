// 日本語の ドット文字（v1.38）：つかう 文字 だけの DotGothic16 を fonts/ に おく。たりない 文字が ない こと、Google に とりに いかない こと
import { missing } from "../tools/fonts.mjs";

export default {
  async "つかって いる 文字は ぜんぶ fonts/dotgothic16.woff2 に はいって いる"(t) {
    const m = missing();
    t.eq(m.join(""), "", `たりない 文字が ある → node tools/fonts.mjs`);
  },

  async "日本語の もじは じぶんの fonts/ から よみ、Google Fonts からは 英字の Press Start 2P だけ"(t) {
    const server = await t.startServer();
    const b = await t.launchBrowser();
    const p = await b.firstPage();
    await p.goto(server.url, 2500);
    await p.boot({ readIntro: false });
    await p.ev(`document.fonts.ready`);
    const urls = await p.ev(`performance.getEntriesByType("resource").map((e) => e.name)`);
    t.ok(urls.some((u) => u.endsWith("/fonts/dotgothic16.woff2")), "じぶんの フォントを よんで いない");
    t.ok(!urls.some((u) => u.includes("DotGothic16") || u.includes("family=DotGothic")), `Google に DotGothic16 を とりに いった: ${urls.filter((u) => u.includes("google")).join(" ")}`);
    t.ok(await p.ev(`document.fonts.check('16px "DotGothic16"', "ピクセ")`), "DotGothic16 が つかえない");
    t.noErrors(p);
    await server.close();
  },
};
