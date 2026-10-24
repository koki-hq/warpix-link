// すうじキーで ワープ（v1.35）：1〜6 で その ばんごうの リンクへ。うっている とき・まどが ひらいている ときは はんのう しない
// リンクは ほんとうには ひらかない（いちばん さいごに ページが とめて、どこへ いこうと したかを おぼえる）
const catchLinks = (p) => p.ev(`window.__went = []; addEventListener("click", (e) => { const a = e.target.closest(".pixel-btn"); if (a) { __went.push(a.href); e.preventDefault(); } })`);

async function open(t, query = "", { boot = true, before = "" } = {}) {
  const server = await t.startServer();
  const b = await t.launchBrowser({ width: 1100, height: 800 });
  const p = await b.firstPage();
  await p.goto(server.url);
  await p.ev(`localStorage.clear(); ${before}`);
  await p.goto(server.url + query);
  if (boot) await p.boot();
  await catchLinks(p);
  return { server, p };
}

export default {
  async "1〜6 で その ばんごうの リンクへ。いれかえた カセットでも"(t) {
    const { server, p } = await open(t, "", { before: `localStorage.setItem("warpix-cassette", JSON.stringify(["youtube", "twitter", "instagram", "studyplus", "tumblr", "spotify"]))` });
    await p.key("4");
    await t.sleep(200);
    t.eq(await p.ev(`__went`), ["https://www.studyplus.jp/"], "4 で STUDYPLUS に いかない");
    t.ok(await p.ev(`achievements.has("keywarp")`), "実績「すうじで ワープ」");
    t.eq(await p.ev(`JSON.parse(localStorage.getItem("warpix-links")).studyplus.n`), 1, "ふつうに おしたのと おなじに かぞえない");
    await p.key("7");
    await p.key("0");
    t.eq((await p.ev(`__went`)).length, 1, "7 や 0 で なにか ひらいた");
    t.noErrors(p);
    await server.close();
  },

  async "もじを うっている とき・まどが ひらいている とき・スタートまえは はんのう しない"(t) {
    const { server, p } = await open(t, "", { boot: false });
    await p.key("1");
    t.eq(await p.ev(`__went`), [], "スタートまえに ひらいた");
    await p.boot();
    await p.ev(`cassetteUi.open()`);
    await p.key("2");
    t.eq(await p.ev(`__went`), [], "まどが ひらいているのに ひらいた");
    await p.ev(`document.getElementById("cassette").close(); room.open("trophy"); document.getElementById("cheat-input").focus()`);
    await p.key("3");
    t.eq(await p.ev(`__went`), [], "CHEAT CODE に うっているのに ひらいた");
    await p.ev(`document.getElementById("diary").close(); document.activeElement.blur()`);
    await p.ev(`document.querySelector(".pixel-btn").focus()`);
    await p.key("1");
    await t.sleep(200);
    t.eq(await p.ev(`__went`), ["https://www.youtube.com/"], "ふつうの ときに ひらかない");
    t.noErrors(p);
    await server.close();
  },

  async "シンプルモードでも つかえる。パソコンでは ばんごうが みえ、スマホでは みえない"(t) {
    const { server, p } = await open(t, "?simple=1", { boot: false });
    await p.key("6");
    t.eq(await p.ev(`__went`), ["https://open.spotify.com/"], "シンプルモードで ひらかない");
    t.eq(await p.ev(`[...document.querySelectorAll(".link-key")].map((k) => k.textContent).join("")`), "123456", "ばんごう");
    t.ok(await p.ev(`getComputedStyle(document.querySelector(".link-key")).display !== "none"`), "パソコンで ばんごうが みえない");
    t.eq(await p.ev(`linkLabel(document.querySelectorAll(".pixel-btn")[1])`), "TWITTER", "なまえに ばんごうが まざった");
    // スマホ（ゆびで さわる がめん）では みえない：ふだんは display: none で、マウスの ある がめんの ときだけ みせる
    // （テストの ブラウザでは ゆびの がめんに きりかえられないので、CSS の きまりを みる）
    t.ok(await p.ev(`(() => {
      const rules = [...document.styleSheets].flatMap((s) => { try { return [...s.cssRules]; } catch { return []; } });
      const base = rules.some((r) => r.selectorText === ".link-key" && r.style.display === "none");
      const onPc = rules.some((r) => r.media?.mediaText.includes("hover: hover") && r.media.mediaText.includes("pointer: fine") && [...r.cssRules].some((x) => x.selectorText === ".link-key" && x.style.display === "block"));
      return base && onPc;
    })()`), "スマホで かくす きまりが ない");
    t.noErrors(p);
    await server.close();
  },
};
