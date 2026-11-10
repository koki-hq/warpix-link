// リンク（v2.0）：URL だけで いい・なまえは サイトの なまえ・12 こ まで・あぶない URL は だめ・おすと きろくして ワープ
import { openApp, groupsData, BAND, noNavigate, sleep } from "./lib/app.mjs";

const fill = (p, url, name = "") => p.ev(`(() => {
  const u = document.getElementById("link-url"); u.value = ${JSON.stringify(url)}; u.dispatchEvent(new Event("input"));
  const n = document.getElementById("link-name"); n.value = ${JSON.stringify(name)}; n.dispatchEvent(new Event("input"));
})()`);
const saved = (p) => p.ev(`JSON.parse(localStorage.getItem("warpix-v2-groups"))[0].links.map((l) => [l.url, l.name])`);

export default {
  async "「＋ リンクを ついか」→ URL だけで いれられる（https:// は じどう、なまえは サイトの なまえ）"(t) {
    const { server, p } = await openApp(t, { storage: { "warpix-v2-groups": groupsData([["すきなバンド", []]]) } });
    await p.click("#add-link");
    await sleep(200);
    t.ok(await p.ev(`document.getElementById("link-dialog").open`), "リンクの まどが ひらかない");
    t.eq(await p.ev(`document.getElementById("link-group").textContent`), "すきなバンド", "どの グループか でない");
    await fill(p, "www.youtube.com/@band");
    t.eq(await p.ev(`document.querySelector("#link-preview .tile-name").textContent`), "youtube.com", "みほんに サイトの なまえが でない");
    await p.ev(`document.getElementById("link-form").requestSubmit()`);
    await sleep(200);
    t.eq(await saved(p), [["https://www.youtube.com/@band", "youtube.com"]], "URL か なまえが ちがう");
    const tile = await p.ev(`(() => { const a = document.querySelector(".links a.tile"); return { href: a.href, target: a.target, rel: a.rel, icon: a.querySelector(".tile-icon").textContent }; })()`);
    t.eq(tile, { href: "https://www.youtube.com/@band", target: "_blank", rel: "noopener noreferrer", icon: "Y" }, "リンクの タイルが ちがう");
    t.ok((await p.text()).includes("ワープ"), `はじめての リンクで ピクセが よろこばない：${await p.text()}`);
    // なまえ つき
    await p.click("#add-link");
    await sleep(100);
    await fill(p, "https://open.spotify.com/artist/x", "Spotify");
    await p.ev(`document.getElementById("link-form").requestSubmit()`);
    t.eq((await saved(p))[1], ["https://open.spotify.com/artist/x", "Spotify"], "なまえ つきで はいらない");
    t.noErrors(p);
    await server.close();
  },

  async "URL が から・へん・javascript: は いれられない"(t) {
    const { server, p } = await openApp(t, { storage: { "warpix-v2-groups": groupsData([["A", []]]) } });
    for (const bad of ["", "   ", "javascript:alert(1)", "data:text/html,x", "あいう", "ftp://example.com"]) {
      await p.click("#add-link");
      await sleep(100);
      await fill(p, bad);
      await p.ev(`document.getElementById("link-form").requestSubmit()`);
      t.ok(await p.ev(`!document.getElementById("link-error").hidden && document.getElementById("link-dialog").open`), `「${bad}」で エラーに ならない`);
      await p.ev(`document.getElementById("link-cancel").click()`);
    }
    t.eq(await saved(p), [], "へんな URL が はいった");
    t.noErrors(p);
    await server.close();
  },

  async "1 グループ 12 こ まで。なまえの もじは そのまま でる（タグに ならない）"(t) {
    const { server, p } = await openApp(t, { storage: { "warpix-v2-groups": groupsData([["A", BAND.slice(0, 11)]]) } });
    t.ok(await p.ev(`!!document.getElementById("add-link")`), "11 こ なのに ＋ が ない");
    await p.click("#add-link");
    await sleep(100);
    await fill(p, "example.com", "<b>太</b>&");
    await p.ev(`document.getElementById("link-form").requestSubmit()`);
    await sleep(100);
    t.ok(await p.ev(`!document.getElementById("add-link")`), "12 こ でも ＋ が のこる");
    t.eq(await p.ev(`document.querySelectorAll(".links a.tile").length`), 12, "12 こ ない");
    t.eq(await p.ev(`document.querySelectorAll(".links a.tile")[11].querySelector(".tile-name").textContent`), "<b>太</b>&", "なまえが タグに なった");
    t.ok(await p.ev(`!document.querySelector(".links b")`), "なまえが タグに なった");
    t.eq(await p.ev(`groups.addLink(groups.list()[0].id, { url: "x.com" })`), null, "13 こめが はいった");
    t.noErrors(p);
    await server.close();
  },

  async "✏️ の「なおす」で URL と なまえを なおせる"(t) {
    const { server, p } = await openApp(t, { storage: { "warpix-v2-groups": groupsData([["A", ["まえ"]]]) } });
    await p.click("#group-edit");
    await sleep(100);
    await p.ev(`document.querySelector('#edit-links [data-act="edit"]').click()`);
    await sleep(100);
    t.ok(await p.ev(`document.getElementById("link-dialog").open && !document.getElementById("edit-dialog").open`), "なおす まどが ひらかない");
    t.eq(await p.ev(`document.getElementById("link-name").value`), "まえ", "いまの なまえが はいって いない");
    t.eq(await p.ev(`document.getElementById("link-save").textContent`), "ほぞん", "ボタンが「ほぞん」で ない");
    await fill(p, "https://new.example.org/", "あと");
    await p.ev(`document.getElementById("link-form").requestSubmit()`);
    await sleep(100);
    t.eq(await saved(p), [["https://new.example.org/", "あと"]], "なおらない");
    t.ok(await p.ev(`document.getElementById("edit-dialog").open`), "なおした あと へんしゅうの まどに もどらない");
    t.noErrors(p);
    await server.close();
  },

  async "リンクを おすと きろくして ピクセが ワープ。キーの ◀ ▶ でも きりかえ"(t) {
    const { server, p } = await openApp(t, { query: "?date=2026-11-10", storage: { "warpix-v2-groups": groupsData([["A", ["a1", "a2"]], ["B", ["b1"]]]) } });
    await noNavigate(p);
    await p.click(".links a.tile");
    await sleep(150);
    t.ok(await p.ev(`document.getElementById("pixe").classList.contains("away") && !!document.querySelector(".warp-hole")`), "ピクセが ワープしない");
    const log = await p.ev(`JSON.parse(localStorage.getItem("warpix-v2-log"))`);
    t.eq(log.days["2026-11-10"], { "https://example1-0.com/": 1 }, "きろく されない");
    t.eq([log.names["https://example1-0.com/"], log.groups["https://example1-0.com/"]], ["a1", "A"], "なまえと グループが のこらない");
    await sleep(3500);
    t.ok(await p.ev(`!document.getElementById("pixe").classList.contains("away")`), "ピクセが もどらない");
    await p.key("ArrowRight");
    t.eq(await p.ev(`document.getElementById("group-title").textContent`), "B", "→ キーで きりかわらない");
    t.noErrors(p);
    await server.close();
  },
};
