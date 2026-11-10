// リンク（v2.0）：たなから えらぶ（おすと 追加・もう いちど おすと とりけし）・じぶんで つくる・12 こ まで・おすと きろくして ワープ
import { openApp, groupsData, BAND, noNavigate, sleep } from "./lib/app.mjs";

const ids = (p) => p.ev(`CASSETTES.current().ids`);

export default {
  async "たなから えらぶ：おすと グループの さいごに 追加、もう いちど おすと とりけし。X は X"(t) {
    const { server, p } = await openApp(t, { storage: { "warpix-v2-groups": groupsData([["A", ["youtube"]]]) } });
    await p.click("#link-add");
    await sleep(200);
    t.ok(await p.ev(`document.getElementById("add-dialog").open && !document.getElementById("add-shelf").hidden`), "たなが ひらかない");
    t.eq(await p.ev(`document.querySelectorAll(".cas-item").length`), 49, "たなの リンクの かずが ちがう");
    t.eq(await p.ev(`document.querySelector('.cas-item[data-id="youtube"]').getAttribute("aria-pressed")`), "true", "もう はいって いる ものに しるしが ない");
    await p.ev(`document.querySelector('.cas-item[data-id="twitter"]').click()`);
    t.eq(await ids(p), ["youtube", "twitter"], "おしても 追加 されない");
    t.ok((await p.ev(`document.getElementById("add-msg").textContent`)).includes("X"), "追加の ことばが でない");
    t.eq(await p.ev(`document.getElementById("add-count").textContent`), "2 / 12 こ", "かずが かわらない");
    await p.ev(`document.querySelector('.cas-item[data-id="youtube"]').click()`);
    t.eq(await ids(p), ["twitter"], "もう いちど おしても とりけせない");
    await p.ev(`document.getElementById("add-done").click()`);
    const tile = await p.ev(`(() => { const a = document.querySelector(".links .pixel-btn"); return { id: a.dataset.id, text: a.querySelector(".link-label").textContent, href: a.href, target: a.target, icon: !!a.querySelector(".icon svg") }; })()`);
    t.eq(tile, { id: "twitter", text: "X", href: "https://x.com/", target: "_blank", icon: true }, "リンクの ボタンが ちがう（TWITTER では なく X）");
    t.noErrors(p);
    await server.close();
  },

  async "1 グループ 12 こ まで（13 こめは 追加 できない）"(t) {
    const { server, p } = await openApp(t, { storage: { "warpix-v2-groups": groupsData([["A", BAND.slice(0, 11)]]) } });
    await p.click("#link-add");
    await sleep(100);
    await p.ev(`document.querySelector('.cas-item[data-id="netflix"]').click()`);
    t.eq((await ids(p)).length, 12, "12 こめが はいらない");
    await p.ev(`document.querySelector('.cas-item[data-id="hulu"]').click()`);
    t.eq((await ids(p)).length, 12, "13 こめが はいった");
    t.ok((await p.ev(`document.getElementById("add-msg").textContent`)).includes("12"), "いっぱいの ことばが でない");
    await p.ev(`document.getElementById("add-done").click()`);
    t.ok(await p.ev(`!document.getElementById("link-add")`), "12 こ でも「＋ リンクを 追加」が のこる");
    t.noErrors(p);
    await server.close();
  },

  async "じぶんで つくる：なまえ・https・アイコン → けってい で つくって 追加。へんな アドレスは だめ。けすと グループからも はずれる"(t) {
    const { server, p } = await openApp(t, { storage: { "warpix-v2-groups": groupsData([["A", []]]) } });
    await p.ev(`window.WARPIX_ASK = true`);
    await p.click("#link-add");
    await sleep(100);
    await p.click("#add-tab-make");
    t.ok(await p.ev(`!document.getElementById("add-make").hidden && document.getElementById("add-shelf").hidden`), "じぶんで つくる に きりかわらない");
    for (const [name, url] of [["", "https://a.example.com/"], ["なまえ", "http://a.example.com/"], ["なまえ", "javascript:alert(1)"], ["なまえ", "https://www.youtube.com/"]]) {
      await p.ev(`document.getElementById("mylink-name").value = ${JSON.stringify(name)}; document.getElementById("mylink-url").value = ${JSON.stringify(url)}; document.getElementById("add-done").click()`);
      t.ok(await p.ev(`!document.getElementById("mylink-error").hidden && document.getElementById("add-dialog").open`), `「${name} / ${url}」で エラーに ならない`);
    }
    await p.ev(`document.querySelector('#mylink-icons [data-icon="music"]').click()`);
    await p.ev(`document.getElementById("mylink-name").value = "<b>こう</b>"; document.getElementById("mylink-url").value = "https://band.example.jp/"; document.getElementById("add-done").click()`);
    await sleep(200);
    t.ok(await p.ev(`!document.getElementById("add-dialog").open`), "つくっても とじない");
    t.eq(await p.ev(`CASSETTES.mine().map((c) => [c.label, c.url, c.iconKey])`), [["<b>こう</b>", "https://band.example.jp/", "music"]], "じぶんの リンクが できない");
    t.eq(await p.ev(`document.querySelector(".links .pixel-btn .link-label").textContent`), "<b>こう</b>", "なまえが タグに なった・はいって いない");
    t.ok(await p.ev(`!document.querySelector(".links b")`), "なまえが タグに なった");
    // たなの「じぶんの リンク」にも でる → けす
    await p.click("#link-add");
    await sleep(100);
    t.ok(await p.ev(`!!document.querySelector('.cas-item[data-id="my-1"]')`), "じぶんの リンクの たなに でない");
    await p.click("#add-tab-make");
    // かえる（v2.0.2）：いまの なまえ・アドレス・アイコンが はいり、けってい で かわる。グループの なかも かわる
    await p.ev(`document.querySelector('#mylink-list [data-edit="my-1"]').click()`);
    t.eq(await p.ev(`[document.getElementById("mylink-name").value, document.getElementById("mylink-url").value, document.querySelector('#mylink-icons [aria-checked="true"]').dataset.icon, !document.getElementById("mylink-editing").hidden]`), ["<b>こう</b>", "https://band.example.jp/", "music", true], "かえる で いまの ものが はいらない");
    await p.ev(`document.getElementById("mylink-url").value = "https://www.youtube.com/"; document.getElementById("add-done").click()`);
    t.ok(await p.ev(`!document.getElementById("mylink-error").hidden && document.getElementById("add-dialog").open`), "かえる でも へんな アドレスが とおる");
    await p.ev(`document.querySelector('#mylink-icons [data-icon="star"]').click(); document.getElementById("mylink-name").value = "かえた"; document.getElementById("mylink-url").value = "https://band.example.jp/"; document.getElementById("add-done").click()`);
    await sleep(200);
    t.eq(await p.ev(`CASSETTES.mine().map((c) => [c.id, c.label, c.url, c.iconKey])`), [["my-1", "かえた", "https://band.example.jp/", "star"]], "かえられない（おなじ アドレスの まま でも かえられる）");
    t.eq([await ids(p), await p.ev(`document.querySelector(".links .pixel-btn .link-label").textContent`)], [["my-1"], "かえた"], "グループの なかが かわらない");
    await p.click("#link-add");
    await sleep(100);
    await p.click("#add-tab-make");
    t.ok(await p.ev(`document.getElementById("mylink-editing").hidden && document.getElementById("mylink-name").value === ""`), "ひらきなおしても かえる の まま");
    await p.ev(`document.querySelector('#mylink-list [data-del="my-1"]').click()`);
    await sleep(100);
    t.eq([await p.ev(`CASSETTES.mine().length`), await ids(p)], [0, []], "けしても のこる・グループから はずれない");
    t.noErrors(p);
    await server.close();
  },

  async "リンクを おすと きろくして ピクセが ワープ。キーの ← → でも きりかえ"(t) {
    const { server, p } = await openApp(t, { query: "?date=2026-11-10", storage: { "warpix-v2-groups": groupsData([["A", ["youtube", "spotify"]], ["B", ["line"]]]) } });
    await noNavigate(p);
    await p.click(".links .pixel-btn");
    await sleep(150);
    t.ok(await p.ev(`document.getElementById("npc").classList.contains("away") && !!document.querySelector(".warp-hole")`), "ピクセが ワープしない");
    const log = await p.ev(`JSON.parse(localStorage.getItem("warpix-v2-log"))`);
    t.eq([log.days["2026-11-10"], log.names.youtube, log.groups.youtube], [{ youtube: 1 }, "YOUTUBE", "A"], "きろく されない");
    await sleep(3500);
    t.ok(await p.ev(`!document.getElementById("npc").classList.contains("away")`), "ピクセが もどらない");
    await p.key("ArrowRight");
    t.eq(await p.ev(`document.getElementById("group-title").textContent`), "B", "→ キーで きりかわらない");
    t.noErrors(p);
    await server.close();
  },
};
