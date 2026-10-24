// オープニング（v1.54）：ほんものの がめんの うえで ながれる。とちゅうで したの みえない リンクや ボタンを おせない
const ON = `window.WARPIX_PROLOGUE = true;`;
// ほんとうの「はじめての 日」の はんてい を つかう（テストの ふだんの なし を うけつけない）
const REAL_FIRSTDAY = `Object.defineProperty(window, "WARPIX_FIRSTDAY", { get: () => undefined, set() {}, configurable: true });`;
const NEWS = "";
const said = (p) => p.ev(`document.getElementById("dialog-text").textContent`);

export default {
  async "ながれて いる あいだは、クリックも Tab も したの がめんに とどかない。SKIP で いつもの がめんに もどる"(t) {
    const server = await t.startServer();
    const b = await t.launchBrowser();
    const p = await b.firstPage();
    await p.send("Page.addScriptToEvaluateOnNewDocument", { source: ON });
    await p.goto(`${server.url}?go=prologue`);
    await p.ev(`document.getElementById("start-btn").click()`);
    await t.sleep(1500);
    t.ok(await p.ev(`!!document.querySelector(".prologue-film")`), "オープニングが はじまらない");
    // まんなか・うえ・したの どこを おしても いちばん うえは オープニング（SKIP の ところ だけ SKIP）
    const tops = await p.ev(`[[0.5, 0.5], [0.5, 0.15], [0.5, 0.85], [0.1, 0.5]].map(([x, y]) => document.elementFromPoint(innerWidth * x, innerHeight * y)?.className)`);
    t.ok(tops.every((c) => c === "prologue-film"), `したの ものに とどく：${tops}`);
    const href = await p.ev(`location.href`);
    await p.ev(`document.querySelector(".prologue-film").click()`);
    await t.sleep(300);
    t.eq(await p.ev(`location.href`), href, "クリックで どこかへ とんだ");
    t.ok(await p.ev(`[...document.querySelectorAll("a[href], button")].filter((el) => !el.closest(".prologue-skip") && el.offsetParent).every((el) => el.closest("[inert]"))`), "Tab で とどく リンクが ある");
    await p.click(".prologue-skip");
    await t.sleep(600);
    t.ok(await p.ev(`!document.querySelector(".prologue-film") && !document.querySelector("[inert]")`), "SKIP の あとも おせない まま");
    t.ok(await p.ev(`document.body.classList.contains("booted")`), "SKIP で いつもの がめんに ならない");
    t.noErrors(p);
    await server.close();
  },

  async "まえから いる 人にも まだ みて いなければ 1 かい。おわったら「おかえり」、2 かいめは もう ながれない"(t) {
    const server = await t.startServer();
    const b = await t.launchBrowser();
    const p = await b.firstPage();
    await p.send("Page.addScriptToEvaluateOnNewDocument", { source: ON });
    await p.goto(server.url);
    await p.ev(`localStorage.clear(); localStorage.setItem("warpix-pixe", JSON.stringify({ born: "2026-10-01", days: ["2026-10-01"], last: "2026-10-01", stage: 0, sulk: false, pokeMark: 0, diary: [] })); localStorage.setItem("warpix-visits", "5")`);
    await p.goto(server.url);
    await p.ev(`document.getElementById("start-btn").click()`);
    await t.sleep(1200);
    t.ok(await p.ev(`!!document.querySelector(".prologue-film")`), "まえから いる 人に ながれない");
    await p.click(".prologue-skip");
    await t.sleep(2500);
    t.ok((await said(p)).includes("おかえり"), `「おかえり」に ならない：${await said(p)}`);
    await p.goto(server.url);
    await p.ev(`document.getElementById("start-btn").click()`);
    await t.sleep(1200);
    t.ok(await p.ev(`!document.querySelector(".prologue-film")`), "2 かいめも ながれた");
    t.noErrors(p);
    await server.close();
  },

  async "はじめての 日は じかんの 実績（きせつの ピクセ）も おしらせの ひかり も まだ。つぎの 日には くる"(t) {
    const server = await t.startServer();
    const b = await t.launchBrowser();
    const p = await b.firstPage();
    await p.send("Page.addScriptToEvaluateOnNewDocument", { source: REAL_FIRSTDAY + NEWS });
    await p.goto(server.url + "?date=2026-10-30");
    await p.ev(`localStorage.clear()`);
    await p.goto(server.url + "?date=2026-10-30");
    await p.boot();
    await t.sleep(3500);
    t.ok(await p.ev(`firstDay()`), "はじめての 日に ならない");
    t.ok(!(await p.ev(`achievements.has("season")`)), "はじめての 日に「きせつの ピクセ」");
    t.ok(!(await p.ev(`document.getElementById("mail-btn").classList.contains("has-new")`)), "はじめての 日に ふうとうが ひかる");
    // つぎの 日
    // ?date= の あいだは ピクセの きろくを のこさない ので、きのう うまれた ことに する
    await p.ev(`localStorage.setItem("warpix-pixe", JSON.stringify({ born: "2026-10-29", days: ["2026-10-29"], last: "2026-10-29", stage: 0, sulk: false, pokeMark: 0, diary: [] }))`);
    await p.goto(server.url + "?date=2026-10-30");
    await p.boot();
    t.ok(!(await p.ev(`firstDay()`)), "つぎの 日も はじめての 日");
    t.ok(await p.ev(`achievements.has("season")`), "つぎの 日に「きせつの ピクセ」が こない");
    t.ok(await p.ev(`document.getElementById("mail-btn").classList.contains("has-new")`), "つぎの 日に ふうとうが ひからない");
    t.noErrors(p);
    await server.close();
  },

  async "ピクセが いい おわっても、よむ じかんの あいだは ほかの しかけが わりこまない"(t) {
    const server = await t.startServer();
    const b = await t.launchBrowser();
    const p = await b.firstPage();
    await p.send("Page.addScriptToEvaluateOnNewDocument", { source: `window.WARPIX_READ_MS = 100;` });
    await p.goto(server.url);
    await p.boot({ readIntro: false });
    await p.ev(`npc.say(["したの ボタンを えらぶと その せかいへ ワープできるよ。"])`);
    await p.ev(`document.getElementById("dialog").click()`);
    await t.sleep(100);
    t.ok(!(await p.ev(`npc.ready()`)), "うち おわった すぐ あとに ひま に なる");
    await t.sleep(4500);
    t.ok(await p.ev(`npc.ready()`), "よむ じかんの あとも ひま に ならない");
    t.noErrors(p);
    await server.close();
  },

  async "このページについて から もういちど みられる"(t) {
    const server = await t.startServer();
    const b = await t.launchBrowser();
    const p = await b.firstPage();
    await p.goto(server.url);
    await p.boot();
    await p.click("#about-btn");
    await t.sleep(300);
    t.ok(await p.ev(`document.getElementById("about-prologue").offsetParent !== null`), "もういちど みる ボタンが ない");
    await p.click("#about-prologue");
    await t.sleep(800);
    t.ok((await p.ev(`location.search`)).includes("go=prologue"), "?go=prologue に ならない");
    t.noErrors(p);
    await server.close();
  },
};
