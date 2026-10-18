// ピクセの ひっこし（v1.36）：ふるい じゅうしょで ひらくと、あたらしい おうちへ きろくごと はこぶ
// ふるい じゅうしょ・あたらしい じゅうしょを、ポートの ちがう 2 つの サーバーで つくる（ポートが ちがえば きろくも べつ）
async function two(t, { to } = {}) {
  const old = await t.startServer();
  const neu = await t.startServer();
  const b = await t.launchBrowser();
  const p = await b.firstPage();
  const from = new URL(old.url).host;
  await p.send("Page.addScriptToEvaluateOnNewDocument", { source: `window.WARPIX_MOVE = ${JSON.stringify({ from, to: to ?? neu.url })};` });
  const close = async () => { await old.close(); await neu.close(); };
  return { old, neu, p, close };
}
const open = (p) => p.ev(`document.getElementById("move").open`);
const text = (p) => p.ev(`document.getElementById("move-text").textContent`);

export default {
  async "ふるい じゅうしょで「きろくごと ひっこす」と、あたらしい じゅうしょに きろくが そっくり うつる"(t) {
    const { old, neu, p, close } = await two(t);
    await p.goto(old.url + "?away=0");
    await p.ev(`localStorage.clear(); localStorage.setItem("warpix-hi", "12345"); localStorage.setItem("warpix-achievements", JSON.stringify(["ufo", "konami"]))`);
    await p.goto(old.url);
    t.ok(!(await open(p)), "PRESS START の まえに さそった");
    await p.boot();
    await t.sleep(1200);
    t.ok(await open(p), "あたらしい おうちが できているのに さそわない");
    t.ok((await text(p)).includes("あたらしい おうちが できたよ"), `ひとこと: ${await text(p)}`);
    t.eq(await p.ev(`document.getElementById("move-addr").textContent`), new URL(neu.url).host, "あたらしい じゅうしょが でない");
    t.noErrors(p);

    // ひっこす → あたらしい じゅうしょで ほどいて、よみなおす
    const loaded = p.waitFor("Page.loadEventFired", () => true, 15000);
    await p.ev(`document.getElementById("move-yes").click()`);
    await loaded;
    await t.sleep(3000);
    t.eq(await p.ev(`location.origin + "/"`), neu.url, "あたらしい じゅうしょに いかない");
    t.eq(await p.ev(`location.hash`), "", "URL に じゅもんが のこる");
    t.eq(await p.ev(`localStorage.getItem("warpix-hi")`), "12345", "ハイスコアが うつらない");
    t.eq(await p.ev(`JSON.parse(localStorage.getItem("warpix-achievements")).filter((a) => a === "ufo" || a === "konami").length`), 2, "実績が うつらない");
    t.eq(await p.ev(`localStorage.getItem("warpix-moved-out")`), null, "ふるい がわの しるしまで もってきた");
    await p.boot({ readIntro: false });
    const lines = await p.readIntro();
    t.ok(lines.some((l) => l.includes("ひっこし、おつかれさま")), `ピクセが よろこばない: ${JSON.stringify(lines)}`);
    t.ok(!(await open(p)), "まっさらなのに きいた");
    t.noErrors(p);

    // ふるい じゅうしょに もどると「もう あたらしい おうちに いるよ」
    await p.goto(old.url);
    await p.boot();
    await t.sleep(1200);
    t.ok((await text(p)).includes("もう あたらしい おうちに いるよ"), `ひっこした あとの ひとこと: ${await text(p)}`);
    t.eq(await p.ev(`document.getElementById("move-yes").textContent`), "あたらしい おうちへ", "ボタン");
    t.noErrors(p);
    await close();
  },

  async "あたらしい おうちが まだ なければ、なにも いわない"(t) {
    // とどかない じゅうしょ・GitHub の 404 の ような ページ（まだ つないでいない とき）
    for (const to of ["http://127.0.0.1:9/", "nai/"]) {
      const { old, p, close } = await two(t, { to: to.startsWith("http") ? to : undefined });
      if (!to.startsWith("http")) await p.send("Page.addScriptToEvaluateOnNewDocument", { source: `window.WARPIX_MOVE.to = location.origin + "/${to}";` });
      await p.goto(old.url);
      await p.ev(`localStorage.clear()`);
      await p.goto(old.url);
      await p.boot();
      await t.sleep(1500);
      t.ok(!(await open(p)), `とどかないのに さそった（${to}）`);
      t.noErrors(p);
      await close();
      await t.closeAll();
    }
  },

  async "もう きろくが ある ブラウザでは きいてから。こわれた にもつは ほどかない"(t) {
    const { old, neu, p, close } = await two(t);
    // ふるい がわの じゅもんを つくる
    await p.goto(old.url);
    await p.ev(`localStorage.clear(); localStorage.setItem("warpix-hi", "12345")`);
    const code = await p.ev(`save.encode()`);
    // あたらしい がわには もう きろくが ある
    await p.goto(neu.url);
    await p.ev(`localStorage.clear(); localStorage.setItem("warpix-hi", "1")`);
    await p.goto("about:blank", 200);
    await p.goto(`${neu.url}#move=${code}`);
    t.eq(await p.ev(`location.hash`), "", "URL に じゅもんが のこる");
    t.eq(await p.ev(`localStorage.getItem("warpix-hi")`), "1", "きかずに いれかえた");
    await p.boot();
    await t.sleep(1000);
    t.ok(await open(p) && (await text(p)).includes("いれかえる？"), `きかない: ${await text(p)}`);
    await p.ev(`document.getElementById("move-no").click()`);
    t.eq(await p.ev(`localStorage.getItem("warpix-hi")`), "1", "「いまの まま」で かわった");

    // こんどは いれかえる
    await p.goto("about:blank", 200);
    await p.goto(`${neu.url}#move=${code}`);
    await p.boot();
    await t.sleep(1000);
    const loaded = p.waitFor("Page.loadEventFired", () => true, 15000);
    await p.ev(`document.getElementById("move-yes").click()`);
    await loaded;
    await t.sleep(1000);
    t.eq(await p.ev(`localStorage.getItem("warpix-hi")`), "12345", "いれかわらない");
    t.noErrors(p);

    // こわれた にもつ
    await p.goto("about:blank", 200);
    await p.goto(`${neu.url}#move=WARPIX1-zこわれた`);
    await p.boot();
    await t.sleep(1000);
    t.ok((await text(p)).includes("こわれちゃった"), `こわれた ときの ひとこと: ${await text(p)}`);
    t.ok(await p.ev(`document.getElementById("move-yes").hidden`), "こわれたのに ボタンが ある");
    t.eq(await p.ev(`localStorage.getItem("warpix-hi")`), "12345", "こわれた にもつで かわった");
    t.noErrors(p);
    await close();
  },
};
