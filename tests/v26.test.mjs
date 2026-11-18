// v2.6：つくる まどの「つぎへ ▶」、メニューは はいけい から、画像の しらせは「とじる」だけ、
// じぶんで つくる の かきかけを おぼえる、検索の なふだ（別名・WARPIX の 一部）
import { openApp, groupsData, sleep } from "./lib/app.mjs";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ROOT } from "./lib/harness.mjs";

export default {
  async "グループを つくる まどの ボタンは「つぎへ ▶」、メニューは はいけい から（きろくは 3 ばんめ）"(t) {
    const { server, p } = await openApp(t, { storage: { "warpix-v2-groups": groupsData([["A", ["youtube"]]]) } });
    t.eq(await p.ev(`document.querySelector("#group-dialog button[type=submit]").textContent`), "つぎへ ▶", "ボタンの ことば");
    await p.click("#menu-btn");
    await sleep(200);
    const v = await p.ev(`({ order: [...document.querySelectorAll("#gear [role=tab]")].map((b) => b.textContent), tab: gear.tab(), sky: !document.getElementById("panel-sky").hidden, log: document.getElementById("panel-log").hidden })`);
    t.eq(v, { order: ["はいけい", "おと", "きろく", "ひっこし", "アプリ"], tab: "sky", sky: true, log: true }, "メニューの ならび・さいしょの タブ");
    t.noErrors(p);
    await server.close();
  },

  async "画像が ひらけない ときは しらせる だけ（とじる ひとつ）"(t) {
    const { server, p } = await openApp(t, { storage: { "warpix-v2-groups": groupsData([["A", ["youtube"]]]) } });
    await p.ev(`window.WARPIX_ASK = true`);
    await p.ev(`photoBg.openTrim(new File(["x"], "a.png", { type: "image/png" }))`);
    t.eq(await p.ev(`window.WARPIX_TOLD`), "この がぞうは 開けなかったよ。べつの がぞうを 選んでね。", "tell で しらせて いない");
    await server.close();
  },

  async "じぶんで つくる：かきかけは とじても もどる。つくれたら から"(t) {
    const { server, p } = await openApp(t, { storage: { "warpix-v2-groups": groupsData([["A", ["youtube"]]]) } });
    const form = () => p.ev(`[document.getElementById("mylink-name").value, document.getElementById("mylink-url").value]`);
    await p.click("#link-add");
    await sleep(150);
    await p.ev(`document.getElementById("mylink-name").value = "ライブ"; document.getElementById("mylink-url").value = "https://example.com/live"; document.querySelector('#add-dialog [data-icon="heart"]').click()`);
    await p.click("#add-close");
    await sleep(150);
    await p.click("#link-add");
    await sleep(150);
    t.eq(await form(), ["ライブ", "https://example.com/live"], "かきかけが きえた");
    t.eq(await p.ev(`document.querySelector('#add-dialog [data-icon][aria-checked="true"]')?.dataset.icon`), "heart", "アイコンが もどらない");
    await p.click("#add-done");
    await sleep(150);
    t.eq(await p.ev(`CASSETTES.current().ids`), ["youtube", "my-1"], "つくれない");
    await p.click("#link-add");
    await sleep(150);
    t.eq(await form(), ["", ""], "つくった あとも のこって いる");
    t.noErrors(p);
    await server.close();
  },

  async "検索の なふだ：説明文は WARPIX（ワーピックス）から、別名と WARPIX の 一部、アイコン、robots・sitemap"(t) {
    const html = readFileSync(join(ROOT, "index.html"), "utf8");
    const desc = html.match(/<meta name="description" content="([^"]+)"/)?.[1] ?? "";
    t.ok(desc.startsWith("WARPIX（ワーピックス）の WARPIX LINK（ワーピックス・リンク）は、"), "説明文の はじまり");
    t.ok(/<meta property="og:description" content="よく行くリンクを、/.test(html), "共有カードの 説明文が かわった");
    const ld = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]+?)<\/script>/)?.[1] ?? "{}");
    t.eq(ld.name, "WARPIX LINK", "なまえ");
    for (const a of ["ワーピックス・リンク", "わーぴっくすりんく", "わーぴくすりんく", "WARPIXLINK"]) t.ok(ld.alternateName?.includes(a), `別名に ${a} が ない`);
    t.eq(ld.isPartOf?.url, "https://warpix.app/", "WARPIX の 一部");
    t.eq(ld.publisher?.name, "WARPIX製作所", "つくって いる ところ");
    t.ok(/<link rel="icon" href="icons\/icon-192\.png"/.test(html), "HTML に アイコンが ない");
    t.ok(readFileSync(join(ROOT, "robots.txt"), "utf8").includes("Sitemap: https://link.warpix.app/sitemap.xml"), "robots.txt");
    t.ok(readFileSync(join(ROOT, "sitemap.xml"), "utf8").includes("<loc>https://link.warpix.app/</loc>"), "sitemap.xml");
  },
};
