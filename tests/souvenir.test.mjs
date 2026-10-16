// ワープの おみやげ（v1.30）：たなごとに ワープあなの いろが かわり、もどってきた ピクセが おみやげを もって かえる
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
  async "おんがくの リンクは きんいろの あな。もどると おんぷを もって きて、ずかんに"(t) {
    const { server, p } = await open(t, ["youtube", "twitter", "applemusic", "booth", "tumblr", "spotify"]);
    await p.ev(`${link("applemusic")}.click()`);
    await t.sleep(150);
    t.eq(await p.ev(`document.querySelector(".warp-hole")?.dataset.shelf`), "music", "あなの たな");
    t.ok(await p.ev(`document.querySelector(".warp-hole path[style*='--gold']") !== null`), "あなが きんいろで ない");
    await p.ev(`__hide(true)`);
    await t.sleep(900);
    await p.ev(`__hide(false)`);
    await t.sleep(700);
    t.ok(await p.ev(`!!document.querySelector(".warp-pixe .warp-gift-on")`), "とんでくる ピクセが おみやげを もっていない");
    await t.sleep(900);
    t.ok(await p.ev(`!!document.querySelector(".warp-gift")`), "はこの うえに おみやげが うかばない");
    t.ok(await p.ev(`!!zukan.state.seen["souvenir:music"]`), "ずかんに はいらない");
    // （ずかんの にっきは 1 日 1 ぎょう。きょうは もう「よる」などで かいているので、ここでは みない）
    await t.sleep(2200);
    t.eq(await p.ev(`document.querySelectorAll(".warp-gift, .warp-pixe, .warp-hole").length`), 0, "おみやげや あなが のこっている");
    t.noErrors(p);
    await server.close();
  },

  async "タブを うつらなければ おみやげは ない"(t) {
    const { server, p } = await open(t);
    await p.ev(`${link("youtube")}.click()`);
    await t.sleep(3600);
    t.ok(await p.ev(`!warpDive.trip() && !document.querySelector(".warp-gift")`), "おみやげが でた");
    t.ok(await p.ev(`!Object.keys(zukan.state.seen).some((k) => k.startsWith("souvenir:"))`), "いってないのに ずかんに");
    t.noErrors(p);
    await server.close();
  },

  async "たなと おみやげの きまり（ぜんぶの たなに ある・8×8・ひみつの ワープゾーン）"(t) {
    const { server, p } = await open(t);
    t.ok(await p.ev(`CASSETTES.SHELVES.every((s) => CASSETTES.GIFTS[s.id]) && !!CASSETTES.GIFTS.secret`), "おみやげの ない たな");
    t.ok(await p.ev(`Object.values(CASSETTES.GIFTS).every((g) => g.rows.length === 8 && g.rows.every((r) => r.length === 8) && g.hole.c && g.hole.p)`), "おみやげの え か あなの いろが おかしい");
    t.eq(await p.ev(`["key", "youtube", "tiktok", "studyplus", "nope"].map(CASSETTES.shelfOf)`), ["secret", "default", "sns", "study", "default"], "shelfOf");
    t.eq(await p.ev(`(() => { room.open("zukan"); const h = [...document.querySelectorAll(".zukan-section h3")].find((x) => x.textContent === "ワープの おみやげ"); return h?.parentElement.querySelectorAll("li").length; })()`), 7, "ずかんの おみやげの らん");
    t.noErrors(p);
    await server.close();
  },
};
