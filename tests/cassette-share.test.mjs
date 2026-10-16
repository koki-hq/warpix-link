// カセットの おすそわけ（v1.32）：いまの 6 こを URL で わたす。とどいた URL は かってに いれかえず、きいてから
const icons = (p) => p.ev(`[...document.querySelectorAll(".links .pixel-btn:not(.secret) [data-icon]")].map((e) => e.dataset.icon)`);
const GIFT = "tiktok,discord,ytmusic,studyplus,duolingo,niconico";
const DEFAULT = ["youtube", "twitter", "instagram", "booth", "tumblr", "spotify"];

async function open(t, query, { before = "", boot = true } = {}) {
  const server = await t.startServer();
  const b = await t.launchBrowser();
  const p = await b.firstPage();
  await p.goto(server.url);
  await p.ev(`localStorage.clear(); ${before}`);
  await p.goto(server.url + query);
  if (boot) await p.boot();
  return { server, p };
}

export default {
  async "とどいた URL は PRESS START の あとに きいて、「いれかえる」で いれかわる"(t) {
    const { server, p } = await open(t, `?cassette=${GIFT}`, { boot: false });
    t.eq(await p.ev(`location.search`), "", "URL から けしていない");
    t.ok(await p.ev(`!document.getElementById("cas-gift").open`), "PRESS START の まえに きいた");
    await p.boot();
    await t.sleep(1000);
    t.ok(await p.ev(`document.getElementById("cas-gift").open`), "きかない");
    t.eq(await p.ev(`document.querySelectorAll("#cas-gift-slots .cas-slot svg").length`), 6, "とどいた 6 こが みえない");
    t.eq(await icons(p), DEFAULT, "きく まえに かわった");
    await p.ev(`document.getElementById("cas-gift-yes").click()`);
    t.eq(await icons(p), GIFT.split(","), "いれかわらない");
    t.eq(await p.ev(`JSON.parse(localStorage.getItem("warpix-cassette"))`), GIFT.split(","), "ほぞん");
    t.ok(await p.ev(`achievements.has("cassette-share") && !document.getElementById("cas-gift").open`), "実績か まど");
    t.ok((await p.ev(`grow.state.diary.map((e) => e.text).join()`)).includes("ともだちの カセットを いれた。"), "にっき");
    t.noErrors(p);
    await server.close();
  },

  async "「いまの まま」なら かわらず、ひらきなおしても もう きかない"(t) {
    const { server, p } = await open(t, `?cassette=${GIFT}`);
    await t.sleep(1000);
    await p.ev(`document.getElementById("cas-gift-no").click()`);
    t.eq(await icons(p), DEFAULT, "かわった");
    await p.goto(await p.ev(`location.href`));
    await p.boot();
    await t.sleep(1000);
    t.ok(await p.ev(`!document.getElementById("cas-gift").open`), "また きいた");
    t.noErrors(p);
    await server.close();
  },

  async "こわれた URL・いまと おなじ 6 こは きかない。シンプルモードは すぐ きく"(t) {
    for (const bad of ["youtube,twitter,instagram,booth,tumblr", "youtube,evil,instagram,booth,tumblr,spotify", "youtube,youtube,instagram,booth,tumblr,spotify", DEFAULT.join(",")]) {
      const { server, p } = await open(t, `?cassette=${bad}`);
      await t.sleep(900);
      t.ok(await p.ev(`!document.getElementById("cas-gift").open && location.search === ""`), `きいた か URL が のこった: ${bad}`);
      t.noErrors(p);
      await server.close();
    }
    const { server, p } = await open(t, `?simple=1&cassette=${GIFT}`, { boot: false });
    await t.sleep(300);
    t.ok(await p.ev(`document.getElementById("cas-gift").open`), "シンプルモードで きかない");
    t.eq(await p.ev(`location.search`), "?simple=1", "ほかの パラメータまで けした");
    t.noErrors(p);
    await server.close();
  },

  async "「この 6 こを おすそわけ」で いまの 6 この URL を わたす"(t) {
    const { server, p } = await open(t, "", { before: `localStorage.setItem("warpix-cassette", JSON.stringify(${JSON.stringify(GIFT.split(","))}))` });
    await p.ev(`window.__shared = null; navigator.share = async (d) => { window.__shared = d; }`);
    await p.click("#cassette-btn");
    await t.sleep(300);
    await p.ev(`document.getElementById("cas-share").click()`);
    await t.sleep(200);
    const shared = await p.ev(`window.__shared`);
    t.ok(shared?.url?.endsWith(`/?cassette=${GIFT}`), `URL: ${shared?.url}`);
    t.eq(await p.ev(`document.getElementById("cas-share-msg").textContent`), "おすそわけ したよ。", "メッセージ");
    t.ok(await p.ev(`achievements.has("cassette-share")`), "実績");
    // きょうゆうが ない ブラウザでは、コピーか、URL を みせる
    await p.ev(`delete navigator.share; navigator.share = undefined; document.getElementById("cas-share").click()`);
    await t.sleep(300);
    const msg = await p.ev(`document.getElementById("cas-share-msg").textContent`);
    t.ok(msg.startsWith("URL を コピーしたよ") || msg.includes(`?cassette=${GIFT}`), `メッセージ: ${msg}`);
    t.noErrors(p);
    await server.close();
  },
};
