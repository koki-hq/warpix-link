// けんさく と AI むけ：canonical、入口は けんさくに ださない、アプリの なふだ（無料・登録なし）、よくある しつもん、llms.txt、sitemap の lastmod、robots
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ROOT } from "./lib/harness.mjs";

const read = (f) => readFileSync(join(ROOT, f), "utf8");
const lds = (html) => [...html.matchAll(/<script type="application\/ld\+json">([\s\S]+?)<\/script>/g)].map((m) => JSON.parse(m[1]));

export default {
  async "トップは canonical、入口（x ig tt yt）は noindex で かぞえる しくみは そのまま"(t) {
    t.ok(read("index.html").includes('<link rel="canonical" href="https://link.warpix.app/">'), "トップに canonical が ない");
    for (const d of ["x", "ig", "tt", "yt"]) {
      const h = read(`${d}/index.html`);
      t.ok(h.includes('<meta name="robots" content="noindex">'), `${d} に noindex が ない`);
      t.ok(!h.includes('rel="canonical"'), `${d} に canonical が ある`);
      t.ok(h.includes('<script src="../count.js"></script>') && h.includes('location.replace("../")'), `${d} の かぞえて とぶ しくみが ない`);
    }
  },

  async "なふだ：アプリ（無料）・WARPIX製作所（sameAs）・WARPIX の 一部・よくある しつもん"(t) {
    const all = lds(read("index.html"));
    const site = all.find((o) => o["@type"] === "WebSite");
    const app = all.find((o) => o["@type"] === "WebApplication");
    const faq = all.find((o) => o["@type"] === "FAQPage");
    t.ok(site && app && faq, "WebSite・WebApplication・FAQPage が そろって いない");
    t.eq(site.publisher?.sameAs, ["https://x.com/warpix_app", "https://www.youtube.com/@warpix_app", "https://www.tiktok.com/@warpix_app"], "sameAs");
    t.eq(site.publisher?.url, "https://warpix.app/", "WARPIX製作所の url");
    t.eq(site.isPartOf?.url, "https://warpix.app/", "WARPIX の 一部");
    t.eq(app.url, "https://link.warpix.app/", "アプリの url");
    t.eq(app.offers?.price, "0", "無料");
    t.ok(app.alternateName?.includes("ワーピックス・リンク"), "アプリの 別名");
    t.eq(app.publisher?.["@id"], site.publisher?.["@id"], "アプリの publisher が WARPIX製作所 で ない");
    t.ok(faq.mainEntity.length >= 5 && faq.mainEntity.every((q) => q["@type"] === "Question" && q.name && q.acceptedAnswer?.text), "よくある しつもんの かたち");
    const text = JSON.stringify(all);
    for (const w of ["子ども", "子供", "親子"]) t.ok(!text.includes(w), `なふだに ${w}`);
  },

  async "llms.txt・sitemap の lastmod・robots は AI を ふさがない"(t) {
    const llms = read("llms.txt");
    t.ok(llms.startsWith("# WARPIX LINK\n\n> "), "llms.txt の はじまり（# なまえ と > ひとこと）");
    for (const w of ["ワーピックス・リンク", "https://link.warpix.app/", "https://warpix.app/", "無料", "登録なし"]) t.ok(llms.includes(w), `llms.txt に ${w} が ない`);
    for (const w of ["子ども", "子供", "親子"]) t.ok(!llms.includes(w), `llms.txt に ${w}`);
    t.ok(/<lastmod>\d{4}-\d{2}-\d{2}<\/lastmod>/.test(read("sitemap.xml")), "sitemap に lastmod が ない");
    const robots = read("robots.txt");
    t.ok(/User-agent: \*\nAllow: \//.test(robots) && !/Disallow: \/\s*$/m.test(robots), "robots が ふさいで いる");
  },
};
