// カセット えらび（v1.28）：6 この リンクを、たなの 公式リンクから いれかえる
const links = (p) => p.ev(`[...document.querySelectorAll(".links .pixel-btn:not(.secret)")].map((a) => ({
  href: a.href, label: linkLabel(a), icon: a.querySelector("[data-icon]").dataset.icon, svg: !!a.querySelector(".icon svg"), sub: a.querySelector(".link-sub")?.textContent ?? null,
}))`);
const put = (p, slot, id) => p.ev(`document.querySelector('.cas-slot[data-slot="${slot}"]').click(); document.querySelector('.cas-item[data-id="${id}"]').click()`);

async function open(t, { url = "", before = "", boot = true, width, height } = {}) {
  const server = await t.startServer();
  const b = await t.launchBrowser(width ? { width, height } : undefined);
  const p = await b.firstPage();
  if (width) await p.size(width, height, true);
  await p.goto(server.url + url);
  await p.ev(`localStorage.clear(); ${before}`);
  await p.goto(server.url + url);
  if (boot) await p.boot();
  return { server, p };
}

export default {
  async "さいしょは さいしょの 6 こ。TWITTER の いきさきは x.com で (X) つき"(t) {
    const { server, p } = await open(t);
    const l = await links(p);
    t.eq(l.map((x) => x.icon), ["youtube", "twitter", "instagram", "booth", "tumblr", "spotify"], "いつもの 6 こ");
    t.ok(l.every((x) => x.svg), "アイコンが ない");
    t.eq([l[1].href, l[1].label, l[1].sub], ["https://x.com/", "TWITTER", "(X)"], "TWITTER");
    t.eq(await p.ev(`localStorage.getItem("warpix-cassette")`), null, "いつものままなのに ほぞんした");
    // カタログ：28 こ、URL は https で かぶらない、アイコンは ぜんぶ ある
    t.eq(await p.ev(`CASSETTES.LIST.length`), 49, "カセットの かず");
    t.ok(await p.ev(`CASSETTES.LIST.every((c) => c.url.startsWith("https://") && ICONS[c.id]) && new Set(CASSETTES.LIST.map((c) => c.url)).size === CASSETTES.LIST.length`), "URL か アイコンが おかしい");
    t.ok(await p.ev(`CASSETTES.LIST.filter((c) => !CASSETTES.DEFAULT.includes(c.id)).every((c) => c.hi && c.back)`), "ピクセの しょうかいか おみやげばなしが ない");
    t.noErrors(p);
    await server.close();
  },

  async "スロットを えらんで たなの カセットを おすと いれかわり、ひらきなおしても のこる"(t) {
    const { server, p } = await open(t);
    await p.click("#cassette-btn");
    await p.click("#hensei-swap");
    await t.sleep(300);
    t.ok(await p.ev(`document.getElementById("cassette").open`), "まどが ひらかない");
    t.eq(await p.ev(`document.querySelectorAll(".cas-slot").length + "," + document.querySelectorAll(".cas-item").length`), "6,49", "スロットと カセットの かず");
    await put(p, 3, "studyplus");
    await t.sleep(200);
    let l = await links(p);
    t.eq([l[3].icon, l[3].href, l[3].label, l[3].svg], ["studyplus", "https://www.studyplus.jp/", "STUDYPLUS", true], "4ばんめが STUDYPLUS に ならない");
    t.ok((await p.ev(`document.getElementById("cas-msg").textContent`)).includes("STUDYPLUS"), "メッセージ");
    t.ok(await p.ev(`achievements.has("cassette")`), "実績「カセット こうかん」");
    t.eq(await p.ev(`grow.state.diary.at(-1).text`), "リンクに STUDYPLUS の カセットを いれた。", "にっき");
    t.ok(await p.ev(`document.activeElement.dataset.id === "studyplus"`), "おした カセットに フォーカスが のこらない");
    // もう はいっている カセット（YOUTUBE は 1ばんめ）を 4ばんめに → いれかわる
    await put(p, 3, "youtube");
    await t.sleep(200);
    l = await links(p);
    t.eq(l.map((x) => x.icon), ["studyplus", "twitter", "instagram", "youtube", "tumblr", "spotify"], "いれかえに ならない");
    await put(p, 5, "niconico");
    await t.sleep(200);
    t.eq(await p.ev(`JSON.parse(localStorage.getItem("warpix-cassette"))`), ["studyplus", "twitter", "instagram", "youtube", "tumblr", "niconico"], "ほぞん");
    await p.goto(p.url ?? (await p.ev(`location.href`)));
    l = await links(p);
    t.eq(l.map((x) => x.icon), ["studyplus", "twitter", "instagram", "youtube", "tumblr", "niconico"], "ひらきなおすと もどる");
    t.ok(await p.ev(`document.querySelector('.pixel-btn [data-icon="niconico"]').closest("a").classList.contains("jp-label")`), "にほんごの なまえの しるし");
    // もとに もどす
    await p.boot();
    await p.click("#cassette-btn");
    await p.click("#hensei-swap");
    await t.sleep(200);
    await p.ev(`document.getElementById("cas-reset").click()`);
    t.eq((await links(p)).map((x) => x.icon), ["youtube", "twitter", "instagram", "booth", "tumblr", "spotify"], "もとに もどらない");
    t.eq(await p.ev(`localStorage.getItem("warpix-cassette")`), null, "もどしたのに ほぞんが のこる");
    t.noErrors(p);
    await server.close();
  },

  async "こわれた ほぞんは つかわない（5 こ・かぶり・しらない カセット）"(t) {
    for (const bad of [["youtube", "twitter", "instagram", "booth", "tumblr"], ["youtube", "youtube", "instagram", "booth", "tumblr", "spotify"], ["youtube", "evil", "instagram", "booth", "tumblr", "spotify"]]) {
      const { server, p } = await open(t, { before: `localStorage.setItem("warpix-cassette", ${JSON.stringify(JSON.stringify(bad))})`, boot: false });
      t.eq((await links(p)).map((x) => x.icon), ["youtube", "twitter", "instagram", "booth", "tumblr", "spotify"], `こわれた ほぞんを つかった: ${bad}`);
      t.noErrors(p);
      await server.close();
    }
  },

  async "いれかえた リンクも、ピクセの しょうかい・おきにいり・ワープの おみやげばなしに つながる"(t) {
    const { server, p } = await open(t, { before: `localStorage.setItem("warpix-cassette", JSON.stringify(["duolingo", "twitter", "instagram", "booth", "tumblr", "spotify"]))` });
    await p.ev(`(() => {
      addEventListener("click", (e) => e.target.closest(".pixel-btn") && e.preventDefault());
      let hid = false;
      Object.defineProperty(document, "hidden", { get: () => hid, configurable: true });
      window.__hide = (v) => { hid = v; document.dispatchEvent(new Event("visibilitychange")); };
      // かえりの「ポケットが ひかってる」（card.js、5%）に あたると おみやげばなしが うわがき される（v1.65 で CI が こけた）
      const r = Math.random;
      Math.random = () => Math.max(r(), 0.06);
    })()`);
    const a = `document.querySelector('.pixel-btn [data-icon="duolingo"]').closest("a")`;
    await p.ev(`${a}.dispatchEvent(new Event("mouseenter"))`);
    await t.sleep(1500);
    t.ok((await p.ev(`document.getElementById("dialog-text").textContent`)).startsWith("DUOLINGOは"), "しょうかいしない");
    await p.ev(`${a}.click()`);
    await t.sleep(100);
    await p.ev(`__hide(true)`);
    await t.sleep(900);
    await p.ev(`__hide(false)`);
    await t.sleep(3500); // あなから でてきて、さいごの もじまで うちおわるまで
    t.eq(await p.ev(`document.getElementById("dialog-text").textContent`), "ただいま！ ぼくも ひとこと\nおぼえたよ。HELLO！", "おみやげばなし");
    t.eq(await p.ev(`JSON.parse(localStorage.getItem("warpix-links")).duolingo.n`), 1, "おきにいりの かいすう");
    t.ok((await p.ev(`grow.state.diary.map((e) => e.text).join()`)).includes("DUOLINGOへ ワープした。"), "にっき");
    t.noErrors(p);
    await server.close();
  },

  async "シンプルモードでも えらんだ リンクが でて、いれかえられる"(t) {
    const { server, p } = await open(t, { url: "?simple=1", before: `localStorage.setItem("warpix-cassette", JSON.stringify(["youtube", "twitter", "instagram", "booth", "tumblr", "wikipedia"]))`, boot: false });
    t.eq((await links(p))[5].href, "https://ja.wikipedia.org/", "シンプルモードで えらんだ リンクが でない");
    await p.click("#cassette-btn");
    await p.click("#hensei-swap");
    await t.sleep(200);
    await put(p, 0, "quizlet");
    t.eq((await links(p))[0].icon, "quizlet", "シンプルモードで いれかえられない");
    t.noErrors(p);
    await server.close();
  },

  async "どの カセットも スマホ（360px）の ボタンから はみださない"(t) {
    const { server, p } = await open(t, { width: 360, height: 780 });
    const over = await p.ev(`(() => {
      const bad = [];
      const ids = CASSETTES.LIST.map((c) => c.id);
      const a = document.querySelector(".links .pixel-btn");
      for (const id of ids) {
        CASSETTES.put(0, id);
        CASSETTES.apply();
        if (a.scrollWidth > a.clientWidth + 1) bad.push(id);
      }
      CASSETTES.reset();
      return bad;
    })()`);
    t.eq(over, [], "はみだした カセット");
    await p.click("#cassette-btn");
    await p.click("#hensei-swap");
    await t.sleep(300);
    t.ok(await p.ev(`document.documentElement.scrollWidth <= innerWidth && [...document.querySelectorAll(".cas-slot, .cas-item")].every((b) => b.scrollWidth <= b.clientWidth + 1)`), "まどの なかで はみだした");
    await p.shot("cassette-360.png");
    t.noErrors(p);
    await server.close();
  },

  async "もどった ときの セリフは「？」で おわらない。TIMETREE が せいかつに、「いつもの」の たなは ない（v1.64）"(t) {
    const { server, p } = await open(t);
    t.eq(await p.ev(`CASSETTES.LIST.filter((c) => c.back && (/？$/.test(c.back) || !c.back.startsWith("ただいま！"))).map((c) => c.id)`), [], "「？」で おわる か「ただいま！」で ない");
    t.eq(await p.ev(`CASSETTES.byId("timetree")?.shelf`), "life", "TIMETREE が ない");
    t.ok(await p.ev(`!CASSETTES.SHELVES.some((s) => s.id === "default") && CASSETTES.LIST.every((c) => CASSETTES.SHELVES.some((s) => s.id === c.shelf))`), "いつもの の たなが のこった か、たなが ない カセットが ある");
    t.eq(await p.ev(`CASSETTES.DEFAULT`), ["youtube", "twitter", "instagram", "booth", "tumblr", "spotify"], "さいしょの 6 こ");
    await p.click("#cassette-btn");
    await p.click("#hensei-swap");
    t.eq(await p.ev(`document.getElementById("cas-reset").textContent`), "さいしょの 6 こに もどす", "もどす ボタンの なまえ");
    t.noErrors(p);
    await server.close();
  },

  async "iPhone では GMAIL・TIKTOK を アプリの アドレスで ひらく。ほかの きかいでは ウェブ（v1.64）"(t) {
    const server = await t.startServer();
    const b = await t.launchBrowser();
    const p = await b.firstPage();
    const set = `localStorage.clear(); localStorage.setItem("warpix-cassette", JSON.stringify(["gmail", "tiktok", "instagram", "booth", "tumblr", "spotify"]))`;
    await p.goto(server.url);
    await p.ev(set);
    await p.goto(server.url);
    await p.boot();
    t.eq(await p.ev(`[...document.querySelectorAll(".links .pixel-btn:not(.secret)")].slice(0, 2).map((a) => a.dataset.app ?? null)`), [null, null], "iPhone で ないのに アプリの アドレス");
    await p.send("Emulation.setUserAgentOverride", { userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1", platform: "iPhone" });
    await p.goto(server.url);
    await p.boot();
    const l = await p.ev(`[...document.querySelectorAll(".links .pixel-btn:not(.secret)")].map((a) => [a.dataset.app ?? null, a.href])`);
    t.eq(l.slice(0, 3), [["googlegmail://", "https://mail.google.com/"], ["snssdk1233://", "https://www.tiktok.com/"], [null, "https://www.instagram.com/"]], "アプリの アドレス");
    t.noErrors(p);
    await server.close();
  },
};
