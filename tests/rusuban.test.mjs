// ピクセの おるすばん：しばらく るすにして もどると、え と きょくの おみやげ
const askText = (p) => p.ev(`document.querySelector(".dialog-text, #dialog-text")?.textContent ?? document.body.innerText`);
const choose = (p, label) => p.ev(`[...document.querySelectorAll(".dialog-choices button")].find((b) => b.textContent === ${JSON.stringify(label)})?.click()`);

async function waitAsk(t, p, ms = 12000) {
  for (let i = 0; i < ms / 250; i++) {
    if (await p.ev(`document.querySelectorAll(".dialog-choices button").length > 0 && document.body.innerText.includes("おかえり")`)) return true;
    await t.sleep(250);
  }
  return false;
}

export default {
  async "3 時間いじょう るすにすると、もどったときに え と きょくを くれる"(t) {
    const server = await t.startServer();
    const b = await t.launchBrowser();
    const p = await b.firstPage();
    // ふつうのページは 閉じるときに「いま」を記録するので、準備は 記録しない ?away=0 のページで
    await p.goto(server.url + "?away=0");
    await p.ev(`localStorage.clear(); localStorage.setItem("warpix-lastseen", JSON.stringify(Date.now() - (8 * 60 + 20) * 60000))`);
    await p.goto(server.url);
    t.ok(await p.ev(`Date.now() - JSON.parse(localStorage.getItem("warpix-lastseen")) < 60000`), "もどった時間を おぼえていない");
    await p.boot();
    t.ok(await waitAsk(t, p), "おかえりの おさそいが ない");
    t.ok((await p.text()).includes("8じかん 20ふん"), "まってた時間が ちがう");
    await choose(p, "みる！");
    await t.sleep(900);
    const s = await p.ev(`(() => { const d = document.querySelector("dialog.rusuban"); const img = d?.querySelector("img"); return { open: d?.open, w: img?.naturalWidth, h: img?.naturalHeight, alt: img?.alt, text: d?.innerText, href: d?.querySelector(".rusuban-save")?.href.startsWith("data:image/png") }; })()`);
    t.ok(s.open, "おみやげの まどが ひらかない");
    t.eq([s.w, s.h], [64, 48], "え の大きさ");
    t.ok(/^ピクセが クレヨンで かいた え「.+」$/.test(s.alt), `え の説明: ${s.alt}`);
    t.ok(s.text.includes("8じかん 20ふん") && s.text.includes("1,500こ"), `レポートの中身: ${s.text}`);
    t.ok(s.href, "え を保存できない");
    await p.shot("rusuban.png");
    t.ok(await p.ev(`achievements.has("rusuban")`), "実績「おるすばん ありがとう」がない");
    t.ok(await p.ev(`JSON.stringify(grow.state).includes("るすばんの あいだに")`), "日記に ない");
    // きょく：きいて、とめて、たなに しまう
    const song = await p.ev(`composer.encode(composer.current())`);
    await p.ev(`document.querySelector(".rusuban-play").click()`);
    t.ok(await p.ev(`sound.playing()`), "きょくが ならない");
    t.eq(await p.ev(`document.querySelector(".rusuban-play").textContent`), "■ とめる", "とめるボタン");
    await p.ev(`document.querySelector(".rusuban-shelf").click()`);
    t.eq(await p.ev(`composer.shelf().length`), 1, "たなに しまえない");
    t.ok(await p.ev(`composer.shelf()[0] === rusuban.last().code`), "しまった きょくが おみやげと ちがう");
    await p.key("Escape");
    await t.sleep(300);
    t.ok(await p.ev(`!document.querySelector("dialog.rusuban")`), "Esc で とじない");
    t.eq(await p.ev(`composer.encode(composer.current())`), song, "とじたら いつもの BGM に もどらない");
    // ノートの「おみやげ」から もう一度
    await p.click("#room-btn");
    await t.sleep(300);
    t.ok(await p.ev(`!document.getElementById("gift-btn").hidden`), "ノートに おみやげボタンが ない");
    await p.click("#gift-btn");
    await t.sleep(500);
    t.ok(await p.ev(`document.querySelector("dialog.rusuban")?.open && !document.getElementById("diary").open`), "ノートから おみやげが ひらかない");
    await p.key("Escape");
    t.noErrors(p);
    await server.close();
  },

  async "1 時間の るすでは なにも言わない。はじめての日も言わない"(t) {
    const server = await t.startServer();
    const b = await t.launchBrowser();
    const p = await b.firstPage();
    await p.goto(server.url);
    await p.ev(`localStorage.clear()`);
    await p.goto(server.url);
    await p.boot();
    t.ok(!(await waitAsk(t, p, 4000)), "はじめての日に おかえりと言った");
    await p.goto(server.url + "?away=0");
    await p.ev(`localStorage.setItem("warpix-lastseen", JSON.stringify(Date.now() - 60 * 60000))`);
    await p.goto(server.url);
    await p.boot();
    t.ok(!(await waitAsk(t, p, 4000)), "1 時間で おかえりと言った");
    t.ok(await p.ev(`document.getElementById("gift-btn").hidden`), "おみやげが ないのに ボタンが ある");
    t.noErrors(p);
    await server.close();
  },

  async "同じ たねなら 同じ え。?away= で のぞいても 記録しない。シンプルモードでは 出さない"(t) {
    const server = await t.startServer();
    const b = await t.launchBrowser();
    const p = await b.firstPage();
    await p.goto(server.url + "?away=0");
    await p.ev(`localStorage.clear()`);
    await p.goto(server.url + "?away=300");
    t.ok(await p.ev(`(() => { const [a, ta] = rusuban.draw(12345); const [b, tb] = rusuban.draw(12345); return a.toDataURL() === b.toDataURL() && ta === tb; })()`), "同じ たねで え が かわる");
    t.ok(await p.ev(`new Set(Array.from({ length: 40 }, (_, i) => rusuban.draw(i * 97)[1])).size >= 4`), "え の しゅるいが すくない");
    await p.boot();
    t.ok(await waitAsk(t, p), "?away= で おさそいが ない");
    t.eq(await p.ev(`localStorage.getItem("warpix-lastseen")`), null, "のぞいただけで もどった時間を記録した");
    t.eq(await p.ev(`localStorage.getItem("warpix-rusuban")`), null, "のぞいただけで おみやげを記録した");
    await p.goto(server.url + "?away=300&simple=1");
    await t.sleep(3000);
    t.ok(await p.ev(`!document.querySelector(".dialog-choices button") && !document.querySelector("dialog.rusuban")`), "シンプルモードで出た");
    t.noErrors(p);
    await server.close();
  },
};
