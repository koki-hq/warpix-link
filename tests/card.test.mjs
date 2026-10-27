// WARPIX カード（v1.52 → v1.53 レアカード）：ピクセと きみの きねんひん
// 3 つの わく：ふしめ（1・10・100・500・1000 かいめ）・ラッキー（「ポケットが ひかってる」）・とくべつな ひ（きせつ・しゅうらい・オープン・しゅうねん）
async function page(t, query = "") {
  const server = await t.startServer();
  const b = await t.launchBrowser();
  const p = await b.firstPage();
  await p.goto(server.url);
  await p.ev(`localStorage.clear()`);
  await p.goto(server.url + "?away=0" + query);
  await p.boot();
  // ラッキーは テストでは でない ように（ひつような ときだけ かえる）
  await p.ev(`Math.random = () => 0.5`);
  return { server, p };
}
// リンクを おして ワープした（favorite.js が かぞえる。プロフィールの「ワープした かず」と おなじ）
const link = (p, times = 1) => p.ev(`for (let i = 0; i < ${times}; i++) emit("link", { icon: "youtube" })`);
const back = (p, left = true) => p.ev(`emit("warp-back", { icon: "youtube", left: ${left}, label: "YOUTUBE", line: "ただいま！" })`);
// でて きた カードを とじる（めくらずに）
const closeReveal = (p) => p.ev(`document.querySelectorAll(".card-reveal-close").forEach((b) => b.click())`);
async function waitReveal(t, p, ms = 8000) {
  for (let i = 0; i < ms / 200; i++) {
    if (await p.ev(`!!document.querySelector(".card-reveal")`)) return true;
    await t.sleep(200);
  }
  return false;
}

export default {
  async "ふしめ：ワープの 1・10 かいめに しろ、100 で ぎん。かずは プロフィールの「ワープした かず」と おなじ（v1.53.1）"(t) {
    const { server, p } = await page(t);
    await back(p);
    t.eq(await p.ev(`cards.state().list.length`), 0, "ダイブの かえりで ふしめが でた");
    await link(p);
    t.eq(await p.ev(`cards.state().list.map((c) => [c.kind, c.n, c.tier])`), [["warps", 1, "white"]], "1 かいめ");
    await link(p, 8);
    t.eq(await p.ev(`cards.state().list.length`), 1, "2〜9 かいめに できた");
    await link(p);
    t.eq(await p.ev(`cards.state().list.map((c) => [c.n, c.tier])`), [[10, "white"], [1, "white"]], "10 かいめ（おなじ 日でも できる）");
    await link(p, 90);
    t.eq(await p.ev(`[cards.state().list[0].n, cards.state().list[0].tier, favorite.total()]`), [100, "silver", 100], "100 かいめ");
    t.ok(await p.ev(`achievements.has("enikki")`), "3 まいで 実績「WARPIX カード」");
    t.ok(!(await p.ev(`JSON.stringify(cards.state().list)`)).includes("YOUTUBE"), "せかいの なまえが カードに はいった");
    t.eq(await p.ev(`cards.state().list.map(cards.numberOf)`), [3, 2, 1], "コレクションの ばんごう");
    t.noErrors(p);
    await server.close();
  },

  async "もう すぎた ふしめは、ひらいた とき 1・10・100 の じゅんに 1 まいずつ うらむきで でる（v1.53.1）"(t) {
    const { server, p } = await page(t);
    await p.ev(`localStorage.setItem("warpix-links", JSON.stringify({ youtube: { n: 120, last: "2026-10-01" } }))`);
    await p.goto(server.url + "?away=0");
    await p.boot();
    t.eq(await p.ev(`cards.state().list.map((c) => c.n)`), [100, 10, 1], "さかのぼって もらえない");
    const seen = [];
    for (let i = 0; i < 3; i++) {
      t.ok(await waitReveal(t, p), `${i + 1} まいめが でない`);
      t.eq(await p.ev(`document.querySelectorAll(".card-reveal").length`), 1, "いっぺんに でた");
      seen.push(await p.ev(`document.querySelector(".card-front img").alt.includes("はじめての") ? 1 : document.querySelector(".card-front img").alt.includes("100かいめ") ? 100 : 10`));
      await closeReveal(p);
    }
    t.eq(seen, [1, 10, 100], "でる じゅんばん");
    await p.goto(server.url + "?away=0");
    await p.boot();
    t.eq(await p.ev(`cards.state().list.length`), 3, "もう いちど ひらくと また でた");
    t.noErrors(p);
    await server.close();
  },

  async "ラッキー：ポケットが ひかって、カードが でる（ランクは うん）。1 日 1 まい"(t) {
    const { server, p } = await page(t);
    t.eq(await p.ev(`[0.01, 0.05, 0.2, 0.9].map((r) => cards.rollTier(r))`), ["rainbow", "gold", "silver", "white"], "ランクの きまり");
    await p.ev(`Math.random = () => 0.01`);
    await back(p);
    let said = false;
    for (let i = 0; i < 40 && !said; i++) {
      await t.sleep(250);
      said = (await p.ev(`document.getElementById("dialog-text").textContent`)).includes("ひかってる");
    }
    t.ok(said, "ポケットが ひかってる と いわない");
    for (let i = 0; i < 30 && (await p.ev(`cards.state().list.length`)) < 1; i++) await t.sleep(250);
    t.eq(await p.ev(`[cards.state().list[0].kind, cards.state().list[0].tier]`), ["lucky", "rainbow"], "ラッキーの カード");
    t.eq(await p.ev(`cards.numberOf(cards.state().list[0])`), 9, "にじの ラッキーは No.09");
    await back(p);
    await t.sleep(5500);
    t.eq(await p.ev(`cards.state().list.length`), 1, "おなじ 日に ラッキーが 2 まい");
    await closeReveal(p);
    // とじた あと、ふきだしが「ひかってる」の ままに ならない（v1.65.1）
    let after = "";
    for (let i = 0; i < 20 && !after.includes("カード だったね"); i++) {
      await t.sleep(200);
      after = await p.ev(`document.getElementById("dialog-text").textContent`);
    }
    t.ok(after.includes("カード だったね"), `とじた あとの ひとこと：${after}`);
    t.noErrors(p);
    await server.close();
  },

  async "とくべつな ひ：クリスマスは ランクの そと、その としに 1 まい。しゅうらいの よるに たおすと 1 まい"(t) {
    const { server, p } = await page(t, "&date=2026-12-24");
    await p.ev(`localStorage.setItem("warpix-links", JSON.stringify({ youtube: { n: 5 } }))`);
    await link(p);
    t.eq(await p.ev(`cards.state().list.filter((c) => c.kind !== "warps").map((c) => [c.kind, c.tier])`), [["christmas", null]], "クリスマスの カード");
    t.ok(await p.ev(`cards.state().got["christmas-2026"] === true`), "その としに もらった しるし");
    t.eq(await p.ev(`localStorage.getItem("warpix-cards")`), null, "?date= で のぞいて いるのに ほぞん した");
    await server.close();
    await t.closeAll();
    const r = await page(t);
    await r.p.ev(`emit("raid-win", { players: 3, hits: 5, night: true })`);
    t.eq(await r.p.ev(`cards.state().list.map((c) => [c.kind, c.tier])`), [["raid", null]], "しゅうらいの よるの カード");
    t.noErrors(r.p);
    await r.server.close();
  },

  async "オープン きねん（2026/11/1〜7）と しゅうねん（まいとし）は、ひらいた ひと ぜんいん"(t) {
    let { server, p } = await page(t, "&date=2026-11-03");
    for (let i = 0; i < 30 && !(await p.ev(`cards.state().list.length`)); i++) await t.sleep(200);
    t.eq(await p.ev(`cards.state().list.map((c) => [c.kind, cards.numberOf(c)])`), [["open", 15]], "オープン きねん");
    await server.close();
    await t.closeAll();
    ({ server, p } = await page(t, "&date=2027-11-01"));
    for (let i = 0; i < 30 && !(await p.ev(`cards.state().list.length`)); i++) await t.sleep(200);
    t.eq(await p.ev(`cards.state().list.map((c) => [c.kind, c.n, c.line.split("\\n")[0]])`), [["anniv", 1, "1ねん いっしょ！"]], "1 しゅうねん");
    await server.close();
    await t.closeAll();
    ({ server, p } = await page(t, "&date=2026-11-08"));
    await t.sleep(4000);
    t.eq(await p.ev(`cards.state().list.length`), 0, "きかんの あとに でた");
    t.noErrors(p);
    await server.close();
  },

  async "でる しゅんかん：うらむきで ひかって、タップで めくると ピクセが よろこぶ"(t) {
    const { server, p } = await page(t);
    await p.ev(`cards.add("lucky", "gold", { line: "きんいろの ひかり、\\nきみの ぶん だよ。" })`);
    t.ok(await waitReveal(t, p), "うらむきの カードが でない");
    t.eq(await p.ev(`document.querySelector(".card-reveal .card-reveal-msg").textContent`), "タップして めくる", "めくる まえ");
    t.ok(await p.ev(`document.querySelector(".card-reveal").style.getPropertyValue("--glow") === "#ffd84a"`), "きんの ひかり");
    await p.shot("card-back.png");
    await p.ev(`document.querySelector(".card-flip").click()`);
    await t.sleep(900);
    t.ok(await p.ev(`document.querySelector(".card-reveal").classList.contains("flipped") && !document.querySelector(".card-reveal-row").hidden`), "めくれない");
    t.ok(await p.ev(`document.querySelector(".card-front").classList.contains("holo")`), "きんに ホロが ない");
    t.eq(await p.ev(`document.querySelector(".card-reveal-msg").textContent`), "えっ……！ き、きんいろ！？", "ピクセが よろこばない");
    t.ok(await p.ev(`document.querySelector(".card-reveal-pixe svg") !== null`), "カードの したに ピクセが いない");
    await p.shot("card-front.png");
    await p.ev(`document.querySelector(".card-reveal-close").click()`);
    t.ok(await p.ev(`!document.querySelector(".card-reveal")`), "とじない");
    t.noErrors(p);
    await server.close();
  },

  async "ROOM の カードばこに コレクションの たな（16 ばん）。もって いない ばんごうは うら。え は 840×1176、わくの いろ。とじると おへやに もどる"(t) {
    const { server, p } = await page(t);
    await link(p);
    t.eq(await p.ev(`(() => { const cv = cards.draw(cards.state().list[0]); return [cv.width, cv.height]; })()`), [840, 1176], "えの 大きさ");
    t.eq(await p.ev(`(() => { const d = cards.draw({ kind: "lucky", tier: "gold", date: "2026-11-01", line: "x" }).getContext("2d").getImageData(2, 2, 1, 1).data; return [d[0], d[1], d[2]]; })()`), [0xa8, 0x74, 0x0a], "きんの わく");
    await p.ev(`room.open("cards")`);
    await t.sleep(500);
    t.eq(await p.ev(`document.querySelectorAll(".cards-list > *").length`), 16, "たなの ばんごうの かず");
    t.eq(await p.ev(`document.querySelectorAll("button.cards-btn").length`), 1, "もって いる カード");
    t.eq(await p.ev(`document.querySelector(".cards-count").textContent`), "1 / 16", "あつめた かず");
    t.ok((await p.ev(`document.querySelector("button.cards-btn").getAttribute("aria-label")`)).endsWith("の WARPIX カード"), "よみあげの なまえ");
    t.eq(await p.ev(`document.querySelectorAll(".cards-none")[0].getAttribute("aria-label")`), "No.02、まだ ない カード", "まだ ない ばんごう");
    await p.ev(`document.querySelector("button.cards-btn").click()`);
    await t.sleep(1200);
    t.eq(await p.ev(`document.querySelector(".postcard")?.getAttribute("aria-label")`), "WARPIX カード", "大きく みられない");
    t.ok(await p.ev(`document.querySelector(".postcard-save").download.startsWith("warpix-card-")`), "ほぞんの なまえ");
    await p.shot("card.png");
    await p.ev(`document.querySelector(".postcard-close").click()`);
    await t.sleep(300);
    t.ok(await p.ev(`document.getElementById("diary").open`), "とじたら おへやに もどらない");
    t.eq(await p.ev(`document.querySelector('.diary-tab[aria-selected="true"]').dataset.tab`), "cards", "もどった タブ");
    t.noErrors(p);
    await server.close();
  },

  async "おなじ 日の 1 かいめと 10 かいめは、べつの えに なる（v1.52.1）"(t) {
    const { server, p } = await page(t);
    await link(p, 10);
    await p.ev(`room.open("cards")`);
    await t.sleep(500);
    const srcs = await p.ev(`[...document.querySelectorAll("button.cards-btn img")].map((i) => i.src)`);
    t.eq(srcs.length, 2, "カードが 2 まい ない");
    t.ok(srcs[0] !== srcs[1], "2 まいが おなじ え");
    t.noErrors(p);
    await server.close();
  },

  async "ほんものの ワープ ダイブで もどると、はじめての カードが うらむきで でる"(t) {
    const { server, p } = await page(t);
    await p.ev(`(() => { window.__hidden = false; Object.defineProperty(document, "hidden", { get: () => window.__hidden }); })()`);
    await p.ev(`window.open = () => null; document.querySelectorAll(".pixel-btn").forEach((a) => a.addEventListener("click", (e) => e.preventDefault()))`);
    await p.ev(`document.querySelector('.pixel-btn [data-icon="youtube"]').closest(".pixel-btn").click()`);
    await t.sleep(900);
    await p.ev(`window.__hidden = true; document.dispatchEvent(new Event("visibilitychange"))`);
    await t.sleep(500);
    await p.ev(`window.__hidden = false; document.dispatchEvent(new Event("visibilitychange"))`);
    let shown = false;
    for (let i = 0; i < 50 && !shown; i++) {
      await t.sleep(200);
      shown = await p.ev(`!!document.querySelector(".card-reveal")`);
      if (!shown && i % 8 === 7) await p.ev(`document.getElementById("dialog").click()`);
    }
    t.eq(await p.ev(`cards.state().list.map((c) => c.n)`), [1], "カードが できない");
    t.ok(shown, "うらむきの カードが でない");
    t.noErrors(p);
    await server.close();
  },
};
