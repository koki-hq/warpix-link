// ワープあなの いろ（v1.30）：たなごとに かわる。ピクセが もって かえる「ワープの おみやげ」は v1.52.1 で やめた
const setup = (p) => p.ev(`(() => {
  addEventListener("click", (e) => e.target.closest(".pixel-btn") && e.preventDefault());
  let hid = false;
  Object.defineProperty(document, "hidden", { get: () => hid, configurable: true });
  window.__hide = (v) => { hid = v; document.dispatchEvent(new Event("visibilitychange")); };
})()`);
const link = (icon) => `document.querySelector('.pixel-btn [data-icon="${icon}"]').closest("a")`;

async function open(t, cassette) {
  const server = await t.startServer();
  const b = await t.launchBrowser();
  const p = await b.firstPage();
  await p.goto(server.url);
  await p.ev(`localStorage.clear(); ${cassette ? `localStorage.setItem("warpix-cassette", ${JSON.stringify(JSON.stringify(cassette))})` : ""}`);
  await p.goto(server.url);
  await p.boot();
  await setup(p);
  return { server, p };
}

export default {
  async "おんがくの リンクは きんいろの あな。もどっても おみやげは もって こない（v1.52.1）"(t) {
    const { server, p } = await open(t, ["youtube", "twitter", "applemusic", "booth", "tumblr", "spotify"]);
    await p.ev(`${link("applemusic")}.click()`);
    await t.sleep(150);
    t.eq(await p.ev(`document.querySelector(".warp-hole")?.dataset.shelf`), "music", "あなの たな");
    t.ok(await p.ev(`document.querySelector(".warp-hole path[style*='--gold']") !== null`), "あなが きんいろで ない");
    await p.ev(`__hide(true)`);
    await t.sleep(900);
    await p.ev(`__hide(false)`);
    await t.sleep(700);
    t.ok(await p.ev(`!!document.querySelector(".warp-pixe") && !document.querySelector(".warp-gift-on, .warp-gift")`), "おみやげを もって きた");
    await t.sleep(3100);
    t.eq(await p.ev(`document.querySelectorAll(".warp-gift, .warp-pixe, .warp-hole").length`), 0, "あなが のこっている");
    t.ok(await p.ev(`(() => { room.open("zukan"); return ![...document.querySelectorAll(".zukan-section h3")].some((x) => x.textContent === "ワープの おみやげ"); })()`), "ずかんに おみやげの らんが ある");
    t.noErrors(p);
    await server.close();
  },

  async "たなと あなの いろの きまり（ぜんぶの たなに ある・ひみつの ワープゾーン）"(t) {
    const { server, p } = await open(t);
    t.ok(await p.ev(`CASSETTES.SHELVES.every((s) => CASSETTES.GIFTS[s.id]) && !!CASSETTES.GIFTS.secret`), "あなの いろが ない たな");
    t.ok(await p.ev(`Object.values(CASSETTES.GIFTS).every((g) => g.hole.c && g.hole.p && !g.rows)`), "あなの いろが おかしい");
    t.eq(await p.ev(`["key", "youtube", "tiktok", "studyplus", "nope"].map(CASSETTES.shelfOf)`), ["secret", "default", "sns", "study", "default"], "shelfOf");
    t.noErrors(p);
    await server.close();
  },
};
