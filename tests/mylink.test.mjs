// じぶんの リンク（v1.61）：なまえ・https の アドレス・よういした アイコンで つくる。18 こまで。えんぴつで なおす・けす（2 かい おし）、パーティに はいって いたら いつもの リンクに もどる
async function open(t, before = "") {
  const server = await t.startServer();
  const b = await t.launchBrowser();
  const p = await b.firstPage();
  await p.goto(server.url);
  await p.ev(`localStorage.clear(); ${before}`);
  await p.goto(server.url);
  await p.boot();
  return { server, p };
}
const links = (p) => p.ev(`[...document.querySelectorAll(".links .pixel-btn:not(.secret)")].map((a) => [a.querySelector("[data-icon]").dataset.icon, a.href])`);
async function toPicker(p) {
  await p.click("#cassette-btn");
  await p.click("#hensei-swap");
}
async function fill(p, { name, url, icon }) {
  await p.ev(`document.getElementById("mylink-name").value = ${JSON.stringify(name)}; document.getElementById("mylink-url").value = ${JSON.stringify(url)}`);
  if (icon) await p.ev(`document.querySelector('.mylink-icon[data-icon-key="${icon}"]').click()`);
  await p.ev(`document.getElementById("mylink-form").requestSubmit()`);
}

export default {
  async "「じぶんの リンク」の たなの「＋ つくる」で つくって、6 こに いれられる。https だけ、ひらきなおしても のこる"(t) {
    const { server, p } = await open(t);
    await toPicker(p);
    t.ok(await p.ev(`!!document.querySelector(".cas-shelf-mine #cas-add")`), "＋ つくる が ない");
    t.ok((await p.ev(`document.querySelector(".cas-shelf-mine h3").textContent`)).includes("0 / 18"), "かず");
    await p.click("#cas-add");
    t.ok(await p.ev(`document.getElementById("mylink").open`), "つくる まどが ひらかない");
    t.eq(await p.ev(`document.querySelectorAll(".mylink-icon").length`), 12, "アイコンの かず");
    await fill(p, { name: "まいにち", url: "javascript:alert(1)" });
    t.ok((await p.ev(`document.getElementById("mylink-msg").textContent`)).includes("https://"), "javascript: を うけつけた");
    await fill(p, { name: "まいにち", url: "http://example.com/" });
    t.ok(await p.ev(`document.getElementById("mylink").open && CASSETTES.mine().length === 0`), "http を うけつけた");
    await fill(p, { name: "まいにち", url: "https://example.com/today", icon: "book" });
    t.ok(await p.ev(`!document.getElementById("mylink").open`), "きめても とじない");
    t.eq(await p.ev(`CASSETTES.mine().map((c) => [c.id, c.label, c.url, c.iconKey])`), [["my-1", "まいにち", "https://example.com/today", "book"]], "つくった リンク");
    await p.shot("mylink-shelf.png");
    // 6 この 3 ばんめに いれる
    await p.ev(`document.querySelector('.cas-slot[data-slot="2"]').click(); document.querySelector('.cas-item[data-id="my-1"]').click()`);
    t.eq((await links(p))[2], ["my-1", "https://example.com/today"], "リンクに ならない");
    t.ok(await p.ev(`!!document.querySelectorAll(".links .pixel-btn")[2].querySelector(".icon svg")`), "アイコンが かかれない");
    // ひらきなおしても のこる
    await p.goto(server.url);
    await p.boot();
    t.eq((await links(p))[2], ["my-1", "https://example.com/today"], "ひらきなおすと きえた");
    t.ok(await p.ev(`!!CASSETTES.byId("my-1").hi && !!CASSETTES.byId("my-1").back`), "ピクセの ひとことが ない");
    t.noErrors(p);
    await server.close();
  },

  async "えんぴつで なおす。けすのは 2 かい おしで、はいって いた パーティは さいしょの リンクに もどる"(t) {
    const mine = JSON.stringify([{ id: "my-1", label: "ノート", url: "https://example.com/n", icon: "book" }]);
    const parties = JSON.stringify({ at: 1, name: "", more: [{ name: "よる", ids: ["my-1", "discord", "threads", "bluesky", "pinterest", "twitch"] }] });
    const { server, p } = await open(t, `localStorage.setItem("warpix-mylinks", ${JSON.stringify(mine)}); localStorage.setItem("warpix-cassette", JSON.stringify(["youtube", "my-1", "instagram", "booth", "tumblr", "spotify"])); localStorage.setItem("warpix-parties", ${JSON.stringify(parties)})`);
    t.eq((await links(p))[0][0], "my-1", "パーティの じぶんの リンクが よめない");
    await toPicker(p);
    await p.click('.cas-edit[data-edit="my-1"]');
    t.eq(await p.ev(`[document.getElementById("mylink-title").textContent, document.getElementById("mylink-name").value]`), ["じぶんの リンクを なおす", "ノート"], "なおす まど");
    await fill(p, { name: "ノート2", url: "https://example.com/n2" });
    t.eq(await p.ev(`[CASSETTES.byId("my-1").label, CASSETTES.byId("my-1").url]`), ["ノート2", "https://example.com/n2"], "なおらない");
    await p.click('.cas-edit[data-edit="my-1"]');
    await p.click("#mylink-delete");
    const warn = await p.ev(`document.getElementById("mylink-msg").textContent`);
    t.ok(warn.includes("PARTY 1") && warn.includes("よる") && warn.includes("さいしょの リンクに もどる"), `パーティの けいこく：${warn}`);
    t.eq(await p.ev(`CASSETTES.mine().length`), 1, "1 かいで けえた");
    await p.click("#mylink-delete");
    t.eq(await p.ev(`CASSETTES.mine().length`), 0, "2 かい おしても けせない");
    t.eq(await p.ev(`CASSETTES.parties().map((x) => x.ids)`), [["youtube", "twitter", "instagram", "booth", "tumblr", "spotify"], ["youtube", "discord", "threads", "bluesky", "pinterest", "twitch"]], "いつもの リンクに もどらない");
    t.noErrors(p);
    await server.close();
  },

  async "18 こまで つくれる（それ いじょうは ＋ つくる が きえる）"(t) {
    const list = JSON.stringify(Array.from({ length: 18 }, (_, i) => ({ id: `my-${i + 1}`, label: `L${i + 1}`, url: `https://example.com/${i}`, icon: "star" })));
    const { server, p } = await open(t, `localStorage.setItem("warpix-mylinks", ${JSON.stringify(list)})`);
    t.eq(await p.ev(`CASSETTES.mine().length`), 18, "18 こ よめない");
    t.eq(await p.ev(`CASSETTES.addMine({ label: "x", url: "https://example.com/x", icon: "star" })`), null, "19 こめが できた");
    await toPicker(p);
    t.ok(await p.ev(`!document.querySelector("#cas-add")`), "18 こ なのに ＋ つくる が ある");
    t.noErrors(p);
    await server.close();
  },

  async "WARPIX LINK じしん・たなと おなじ アドレス・じぶんの リンク どうしの かさなりは つくれない（v1.62）"(t) {
    const { server, p } = await open(t, `localStorage.setItem("warpix-mylinks", JSON.stringify([{ id: "my-1", label: "A", url: "https://example.com/a", icon: "star" }]))`);
    t.eq(await p.ev(`CASSETTES.checkMine("https://link.warpix.app/")`), "それは ぼくの いる ここだよ。", "じぶん");
    t.eq(await p.ev(`CASSETTES.checkMine("https://www.youtube.com")`), "YOUTUBE は もう たなに あるよ。", "たなと おなじ");
    t.eq(await p.ev(`CASSETTES.checkMine("https://www.youtube.com/@warpix")`), null, "おなじ サイトの べつの ページは つくれる");
    t.eq(await p.ev(`CASSETTES.checkMine("https://example.com/a/")`), "おなじ リンクが もう あるよ。", "じぶんの リンク どうし");
    t.eq(await p.ev(`CASSETTES.checkMine("https://example.com/a", "my-1")`), null, "なおす ときは じぶん じしんを のぞく");
    await toPicker(p);
    await p.click("#cas-add");
    await fill(p, { name: "わたし", url: "https://link.warpix.app/" });
    t.eq(await p.ev(`document.getElementById("mylink-msg").textContent`), "それは ぼくの いる ここだよ。", "まどの ひとこと");
    t.eq(await p.ev(`CASSETTES.mine().length`), 1, "つくれて しまった");
    t.noErrors(p);
    await server.close();
  },

  async "たなは さいしょ ぜんぶ ひらいて いて たためる。いま はいって いる かずが みだしに（v1.62・v1.63.2）"(t) {
    const { server, p } = await open(t, `localStorage.setItem("warpix-cassette", JSON.stringify(["youtube", "netflix", "line", "booth", "tumblr", "spotify"]))`);
    await toPicker(p);
    t.eq(await p.ev(`document.querySelectorAll("details.cas-shelf:not([open])").length`), 0, "さいしょから ぜんぶ ひらいて いない（v1.63.2）");
    await p.ev(`document.querySelector('details[data-shelf="video"] summary').click()`);
    t.ok(await p.ev(`!document.querySelector('details[data-shelf="video"]').open`), "たためない");
    t.ok((await p.ev(`document.querySelector('details[data-shelf="video"] summary').textContent`)).includes("・2"), "いま はいって いる かず");
    await p.ev(`document.querySelector('details[data-shelf="video"] summary').click()`);
    await t.sleep(200);
    await p.ev(`document.querySelector('.cas-slot[data-slot="5"]').click(); document.querySelector('.cas-item[data-id="hulu"]').click()`);
    t.ok(await p.ev(`document.querySelector('details[data-shelf="video"]').open`), "いれかえたら たなが とじた");
    t.eq(await p.ev(`CASSETTES.current()[5]`), "hulu", "あたらしい たなから いれられない");
    await p.shot("cas-fold.png");
    t.noErrors(p);
    await server.close();
  },
};
