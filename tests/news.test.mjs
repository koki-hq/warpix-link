// 製作所だより：WARPIX製作所の おしらせを よんで、ピクセが 1 かいだけ おしえる。フッターに NEW
const FIXTURE = `window.WARPIX_NEWS = "tests/fixtures/news.json";`;

async function page(t, source = FIXTURE) {
  const server = await t.startServer();
  const b = await t.launchBrowser();
  const p = await b.firstPage();
  if (source) await p.send("Page.addScriptToEvaluateOnNewDocument", { source });
  await p.goto(server.url + "?away=0");
  await p.ev(`localStorage.clear()`);
  return { server, p };
}
// もじおくりが おわるまで まつ
const waitTold = async (t, p) => {
  for (let i = 0; i < 25; i++) {
    if ((await p.ev(`document.getElementById("dialog-text").textContent`)).includes("できました」")) return true;
    await t.sleep(400);
  }
  return false;
};

export default {
  async "あたらしい おしらせを ピクセが 1 かいだけ おしえて、ひらくと NEW が きえる"(t) {
    const { server, p } = await page(t);
    await p.goto(server.url + "?date=2026-10-20");
    await p.boot();
    t.ok(await waitTold(t, p), "ピクセが おしらせを いわない");
    t.ok((await p.ev(`document.getElementById("dialog-text").textContent`)).includes("あたらしい こうじょう できました"), "いちばん あたらしい ものを いわない");
    t.ok(await p.ev(`!document.querySelector("#news-link .news-new").hidden && document.getElementById("news-link").classList.contains("has-new")`), "NEW が ない");
    t.eq(await p.ev(`news.state.told`), ["fresh"], "おしえた きろく");
    // ひらきなおしても、もう いわない（NEW は ひらくまで のこる）
    await p.goto(server.url + "?date=2026-10-20");
    await p.boot();
    await t.sleep(3500);
    t.ok(!(await p.ev(`document.getElementById("dialog-text").textContent`)).includes("製作所から"), "2 かいめも いった");
    t.ok(await p.ev(`!document.querySelector("#news-link .news-new").hidden`), "ひらく まえに NEW が きえた");
    // ひらく（あたらしい タブには いかせない）
    await p.ev(`document.getElementById("news-link").addEventListener("click", (e) => e.preventDefault()); document.getElementById("news-link").click()`);
    t.ok(await p.ev(`document.querySelector("#news-link .news-new").hidden && !document.getElementById("news-link").classList.contains("has-new")`), "ひらいても NEW が きえない");
    t.ok(await p.ev(`achievements.has("factory")`), "実績「せいさくしょ けんがく」がない");
    t.eq(await p.ev(`JSON.parse(localStorage.getItem("warpix-news")).opened`), ["fresh"], "ひらいた きろく");
    t.eq(await p.ev(`document.getElementById("news-link").href`), "https://warpix.app/#news", "とびさき");
    t.noErrors(p);
    await server.close();
  },

  async "ふるい おしらせだけなら なにも いわない。よめない ときも しずか"(t) {
    let { server, p } = await page(t);
    await p.goto(server.url + "?date=2026-12-31");
    await p.boot();
    await t.sleep(3500);
    t.ok(!(await p.ev(`document.getElementById("dialog-text").textContent`)).includes("製作所から"), "ふるいのに いった");
    t.ok(await p.ev(`document.querySelector("#news-link .news-new").hidden`), "ふるいのに NEW");
    t.noErrors(p);
    await server.close();
    await t.closeAll();

    ({ server, p } = await page(t, null)); // テストの config.js の まま（ない ファイル）
    await p.goto(server.url + "?date=2026-10-20");
    await p.boot();
    t.eq(await p.ev(`news.ready.then((x) => x.length)`), 0, "よめない ときの おしらせ");
    t.ok(await p.ev(`document.querySelector("#news-link .news-new").hidden`), "よめないのに NEW");
    t.noErrors(p);
    await server.close();
  },

  async "シンプルモードでは ピクセは いわないが、NEW は でる"(t) {
    const { server, p } = await page(t);
    await p.goto(server.url + "?simple=1&date=2026-10-20");
    await t.sleep(3500);
    t.eq(await p.ev(`news.state.told`), [], "シンプルモードで いった");
    t.ok(await p.ev(`!document.querySelector("#news-link .news-new").hidden && getComputedStyle(document.getElementById("news-link")).display !== "none"`), "シンプルモードで NEW が みえない");
    t.noErrors(p);
    await server.close();
  },
};
