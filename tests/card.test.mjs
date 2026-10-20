// WARPIX カード（v1.52）：ワープえにっきを やめて、ピクセと きみの きねんひん。めったに こない
// ふしめ（1・10・100・500・1000 かいめ）・とくべつな ひ・ごく まれ（2%）。レアは わくの いろ
async function page(t, query = "") {
  const server = await t.startServer();
  const b = await t.launchBrowser();
  const p = await b.firstPage();
  await p.goto(server.url);
  await p.ev(`localStorage.clear()`);
  await p.goto(server.url + "?away=0" + query);
  await p.boot();
  // ごく まれ は テストでは でない ように（ひつような ときだけ かえる）
  await p.ev(`Math.random = () => 0.5`);
  return { server, p };
}
const back = (p, left = true) => p.ev(`emit("warp-back", { icon: "youtube", left: ${left}, label: "YOUTUBE", line: "ただいま！" })`);

export default {
  async "ふしめ：ほんとうに もどった 1・10 かいめに しろ、100 で ぎん。あいだは なし。いかなかった ときは かぞえない"(t) {
    const { server, p } = await page(t);
    await back(p, false);
    t.eq(await p.ev(`cards.state().warps`), 0, "いかなかったのに かぞえた");
    await back(p);
    t.eq(await p.ev(`cards.state().list.map((c) => [c.kind, c.n, c.tier])`), [["warps", 1, "white"]], "1 かいめ");
    for (let i = 0; i < 8; i++) await back(p);
    t.eq(await p.ev(`cards.state().list.length`), 1, "2〜9 かいめに できた");
    await back(p);
    t.eq(await p.ev(`cards.state().list.map((c) => [c.n, c.tier])`), [[10, "white"], [1, "white"]], "10 かいめ（おなじ 日でも できる）");
    await p.ev(`(() => { const s = JSON.parse(localStorage.getItem("warpix-cards")); s.warps = 99; localStorage.setItem("warpix-cards", JSON.stringify(s)); })()`);
    await p.goto(server.url + "?away=0");
    await p.boot();
    await p.ev(`Math.random = () => 0.5`);
    await back(p);
    t.eq(await p.ev(`[cards.state().list[0].n, cards.state().list[0].tier]`), [100, "silver"], "100 かいめ");
    t.ok(await p.ev(`achievements.has("enikki")`), "3 まいで 実績「WARPIX カード」");
    t.ok(!(await p.ev(`JSON.stringify(cards.state().list)`)).includes("YOUTUBE"), "せかいの なまえが カードに はいった");
    t.noErrors(p);
    await server.close();
  },

  async "ごく まれ（2%）は きん。とくべつな ひ・ごく まれ は 1 日 1 まい"(t) {
    const { server, p } = await page(t);
    await back(p); // 1 かいめ（ふしめ）
    await p.ev(`Math.random = () => 0.01`);
    await back(p);
    t.eq(await p.ev(`cards.state().list.length`), 1, "ふしめと おなじ 日に ごく まれ が できた");
    await p.ev(`(() => { const s = JSON.parse(localStorage.getItem("warpix-cards")); s.list.forEach((c) => (c.date = "2026-01-01")); localStorage.setItem("warpix-cards", JSON.stringify(s)); })()`);
    await p.goto(server.url + "?away=0");
    await p.boot();
    await p.ev(`Math.random = () => 0.01`);
    await back(p);
    t.eq(await p.ev(`[cards.state().list[0].kind, cards.state().list[0].tier]`), ["rare", "gold"], "ごく まれ が きん で ない");
    await back(p);
    t.eq(await p.ev(`cards.state().list.length`), 2, "おなじ 日に 2 まい");
    t.noErrors(p);
    await server.close();
  },

  async "とくべつな ひ（クリスマスの しゅうかん）は ぎん、その としに 1 まい。しゅうらいの よるに たおすと ぎん"(t) {
    const { server, p } = await page(t, "&date=2026-12-24");
    await p.ev(`cards.state().warps = 5`);
    await back(p);
    t.eq(await p.ev(`cards.state().list.map((c) => [c.kind, c.tier])`), [["christmas", "silver"]], "クリスマスの カード");
    t.ok(await p.ev(`cards.state().got["christmas-2026"] === true`), "その としに もらった しるし");
    t.eq(await p.ev(`localStorage.getItem("warpix-cards")`), null, "?date= で のぞいて いるのに ほぞん した");
    await server.close();
    await t.closeAll();
    const r = await page(t);
    await r.p.ev(`emit("raid-win", { players: 3, hits: 5, night: true })`);
    t.eq(await r.p.ev(`cards.state().list.map((c) => [c.kind, c.tier])`), [["raid", "silver"]], "しゅうらいの よるの カード");
    t.noErrors(r.p);
    await r.server.close();
  },

  async "ROOM の にっきに たまって、おすと 大きく みられる。え は 420×588、わくの いろ"(t) {
    const { server, p } = await page(t);
    await back(p);
    t.eq(await p.ev(`(() => { const cv = cards.draw(cards.state().list[0]); return [cv.width, cv.height]; })()`), [420, 588], "えの 大きさ");
    t.eq(await p.ev(`(() => { const d = cards.draw({ kind: "rare", tier: "gold", date: "2026-11-01", line: "x" }).getContext("2d").getImageData(2, 2, 1, 1).data; return [d[0], d[1], d[2]]; })()`), [0xc9, 0x96, 0x1a], "きんの わく");
    await p.ev(`room.open("diary")`);
    await t.sleep(500);
    t.eq(await p.ev(`document.querySelectorAll(".cards-btn img").length`), 1, "にっきに カードが ない");
    t.ok((await p.ev(`document.querySelector(".cards-btn").getAttribute("aria-label")`)).endsWith("の WARPIX カード"), "よみあげの なまえ");
    await p.ev(`document.querySelector(".cards-btn").click()`);
    await t.sleep(1200);
    t.eq(await p.ev(`document.querySelector(".postcard")?.getAttribute("aria-label")`), "WARPIX カード", "大きく みられない");
    t.ok(await p.ev(`document.querySelector(".postcard-save").download.startsWith("warpix-card-")`), "ほぞんの なまえ");
    await p.shot("card.png");
    t.noErrors(p);
    await server.close();
  },

  async "ほんものの ワープ ダイブで もどると、はじめての カードが できて ピクセが いう"(t) {
    const { server, p } = await page(t);
    await p.ev(`(() => { window.__hidden = false; Object.defineProperty(document, "hidden", { get: () => window.__hidden }); })()`);
    await p.ev(`window.open = () => null; document.querySelectorAll(".pixel-btn").forEach((a) => a.addEventListener("click", (e) => e.preventDefault()))`);
    await p.ev(`document.querySelector('.pixel-btn [data-icon="youtube"]').closest(".pixel-btn").click()`);
    await t.sleep(900);
    await p.ev(`window.__hidden = true; document.dispatchEvent(new Event("visibilitychange"))`);
    await t.sleep(500);
    await p.ev(`window.__hidden = false; document.dispatchEvent(new Event("visibilitychange"))`);
    let told = false;
    for (let i = 0; i < 50 && !told; i++) {
      await t.sleep(200);
      told = (await p.text()).includes("WARPIX カード");
      if (!told && i % 8 === 7) await p.ev(`document.getElementById("dialog").click()`);
    }
    t.eq(await p.ev(`cards.state().list.map((c) => c.n)`), [1], "カードが できない");
    t.ok(told, "ピクセが いわない");
    t.noErrors(p);
    await server.close();
  },
};
