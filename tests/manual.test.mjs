// とりあつかい せつめいしょ（v1.48、おたより #4・#6）：はじめての 人にだけ。なにの アプリか・きみの いつもは？（v1.49）・つかいかた・ホーム画面に 入れる やりかた
const ON = `window.WARPIX_MANUAL = true;`;
const IPHONE = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";
const INSTA = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 350.0.0.0";

async function phone(t, ua) {
  const b = await t.launchBrowser({ width: 390, height: 844 });
  const p = await b.firstPage();
  await p.send("Emulation.setUserAgentOverride", { userAgent: ua, platform: "iPhone" });
  await p.size(390, 844, true);
  await p.send("Page.addScriptToEvaluateOnNewDocument", { source: ON });
  return p;
}
// まっさらな ブラウザ（きろくを けすより たしか。テストが 混んで いても まえの きろくが のこらない）
async function fresh(t) {
  const b = await t.launchBrowser();
  const p = await b.firstPage();
  await p.send("Page.addScriptToEvaluateOnNewDocument", { source: ON });
  return p;
}
const state = (p) => p.ev(`({ open: document.getElementById("manual").open, page: document.getElementById("manual-page").textContent, next: document.getElementById("manual-next").textContent, skip: !document.getElementById("manual-skip").hidden, how: document.getElementById("manual-how").textContent, point: !document.getElementById("manual-point").hidden })`);

export default {
  async "はじめての 人には ひらいて すぐ せつめいしょ。4 まいめは iPhone の Safari の やりかた、はじめるで そのまま スタート"(t) {
    const server = await t.startServer();
    const p = await phone(t, IPHONE);
    await p.goto(server.url, 100);
    t.eq(await p.ev(`document.querySelector(".start-tagline").textContent`), "いつものアプリを、ちょっと楽しくひらく入口。", "さいしょの 画面の ひとこと");
    // iPhone の はばでは「、」で 2 行。「入」と「口。」が わかれない（v1.48.2）
    const lines = await p.ev(`[...document.querySelectorAll(".start-tagline span")].map((s) => { const r = s.getClientRects(); return [r.length, Math.round(r[0].top)]; })`);
    t.ok(lines.length === 2 && lines[0][0] === 1 && lines[1][0] === 1 && lines[1][1] > lines[0][1], `ひとことの かいぎょう: ${JSON.stringify(lines)}`);
    t.eq((await state(p)).open, false, "テレビの スイッチの まえに 出た");
    await t.sleep(900);
    let s = await state(p);
    t.ok(s.open && s.page === "1/4" && s.next === "つぎへ ▶" && s.skip, `1 まいめ: ${JSON.stringify(s)}`);
    t.ok(await p.ev(`document.getElementById("manual-back").hidden`), "1 まいめに もどる が ある");
    t.ok((await p.ev(`document.querySelector('[data-sheet="what"]').textContent`)).includes("いつものアプリを、ちょっと楽しくひらく入口。"), "なにの アプリか");
    t.ok(await p.ev(`document.querySelectorAll("#manual .ms-pixe svg").length === 3 && !!document.querySelector("#manual .ms-cursor svg")`), "ピクセの え");
    await p.shot("manual-1.png");
    await p.ev(`document.getElementById("manual-next").click()`);
    // 2 まいめ：つかいかた（ワープ）。v1.63 で「きみが いつも いく せかいは？」を やめて、リンクは つかう ぜんてい
    s = await state(p);
    t.ok(s.page === "2/4" && (await p.ev(`document.querySelector('[data-sheet="how"]').textContent`)).includes("ワープ"), `2 まいめ: ${JSON.stringify(s)}`);
    t.ok(await p.ev(`!document.querySelector("[data-where]") && !document.getElementById("manual-door")`), "まえの「いつもは？」が のこって いる");
    // もどる で 1 まいめへ、また つぎへ（v1.49.1）
    t.ok(await p.ev(`!document.getElementById("manual-back").hidden`), "2 まいめに もどる が ない");
    await p.ev(`document.getElementById("manual-back").click()`);
    t.eq([(await state(p)).page, await p.ev(`document.getElementById("manual-back").hidden`)], ["1/4", true], "もどる で 1 まいめに もどらない");
    await p.ev(`document.getElementById("manual-next").click()`);
    await t.sleep(2300); // ピクセが あなに とびこんで「ワープ！」の ところ
    await p.shot("manual-2.png");
    await p.ev(`document.getElementById("manual-next").click()`);
    // 3 まいめ：リンクは じぶん このみに（へんせい・じぶんの リンク・パーティ）
    s = await state(p);
    const links = await p.ev(`document.querySelector('[data-sheet="links"]').textContent`);
    t.ok(s.page === "3/4" && links.includes("リンクの へんせい") && links.includes("じぶんの リンク") && links.includes("パーティ"), `3 まいめ: ${JSON.stringify(s)}`);
    await p.ev(`document.getElementById("manual-next").click()`);
    s = await state(p);
    t.ok(s.page === "4/4" && s.next === "はじめる ▶" && !s.skip, `4 まいめ: ${JSON.stringify(s)}`);
    t.ok(s.how.includes("共有ボタン") && s.how.includes("ホーム画面に追加") && s.point, `Safari の やりかたと ピクセの ゆびさし: ${JSON.stringify(s)}`);
    t.ok(await p.ev(`(() => { const r = document.getElementById("manual-point").getBoundingClientRect(); return r.bottom > innerHeight - 40 && r.bottom <= innerHeight; })()`), "ピクセが 画面の 下に いない");
    await p.shot("manual-3.png");
    await p.ev(`document.getElementById("manual-next").click()`);
    await t.sleep(2600);
    t.ok(await p.ev(`!document.getElementById("manual").open && document.body.classList.contains("booted")`), "はじめるで スタートしない");
    t.ok(await p.ev(`document.getElementById("manual-point").hidden`), "ゆびさしが のこった");
    t.eq(await p.ev(`localStorage.getItem("warpix-manual")`), "true", "よんだ ことを おぼえない");
    await p.goto(server.url);
    await t.sleep(1200);
    t.eq((await state(p)).open, false, "2 かいめも 出た");
    t.noErrors(p);
    await server.close();
  },

  async "前に 来た 人には 出ない。とばす・Esc で とじて、パソコンは 3 まい"(t) {
    const server = await t.startServer();
    let p = await fresh(t);
    await p.goto(server.url);
    await t.sleep(1000);
    let s = await state(p);
    t.ok(s.open && s.page === "1/3", `パソコンは ホーム画面の ページなし: ${JSON.stringify(s)}`);
    await p.ev(`document.getElementById("manual-skip").click()`);
    await t.sleep(300);
    t.ok(await p.ev(`!document.getElementById("manual").open && !document.getElementById("start-screen").hidden && !document.body.classList.contains("booted")`), "とばすと PRESS START に もどらない");
    t.eq(await p.ev(`document.activeElement.id`), "start-btn", "とばしたら PRESS START に フォーカス");
    t.eq(await p.ev(`localStorage.getItem("warpix-manual")`), "true", "とばしても おぼえない");
    // 前に 来た ことが ある 人（せつめいしょが できる まえからの 1期生など）
    p = await fresh(t);
    await p.goto(server.url, 100);
    await p.ev(`localStorage.setItem("warpix-visits", "5")`);
    await p.goto(server.url);
    await t.sleep(1000);
    t.eq((await state(p)).open, false, "前に 来た 人に 出た");
    // Esc で とじる
    p = await fresh(t);
    await p.goto(server.url);
    await t.sleep(1000);
    t.ok((await state(p)).open, "まっさらなのに 出ない");
    await p.send("Input.dispatchKeyEvent", { type: "rawKeyDown", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 });
    await p.send("Input.dispatchKeyEvent", { type: "keyUp", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 });
    await t.sleep(300);
    t.ok(await p.ev(`!document.getElementById("manual").open && localStorage.getItem("warpix-manual") === "true"`), "Esc で とじない・おぼえない");
    // シンプルモードでは 出ない
    p = await fresh(t);
    await p.goto(server.url + "?simple=1");
    await t.sleep(1000);
    t.eq((await state(p)).open, false, "シンプルモードで 出た");
    t.noErrors(p);
    await server.close();
  },

  async "このページについて から よみなおせる。インスタの なかでは さきに ブラウザで ひらく やりかた"(t) {
    const server = await t.startServer();
    const p = await phone(t, INSTA);
    await p.goto(server.url);
    await t.sleep(1000);
    await p.ev(`document.getElementById("manual-skip").click()`);
    await p.boot({ readIntro: false });
    await p.ev(`document.getElementById("about-btn").click()`);
    await t.sleep(200);
    t.ok((await p.ev(`document.getElementById("about").textContent`)).includes("いつものアプリを、ちょっと楽しくひらく入口。"), "このページについて の ひとこと");
    await p.ev(`document.getElementById("about-manual").click()`);
    await t.sleep(200);
    let s = await state(p);
    t.ok(s.open && s.page === "1/4" && !(await p.ev(`document.getElementById("about").open`)), `よみなおし: ${JSON.stringify(s)}`);
    await p.ev(`for (let i = 0; i < 3; i++) document.getElementById("manual-next").click()`);
    s = await state(p);
    t.ok(s.how.includes("ブラウザでひらく") && !s.point && s.next === "とじる", `インスタの なか: ${JSON.stringify(s)}`);
    await p.ev(`document.getElementById("manual-next").click()`);
    await t.sleep(300);
    t.ok(await p.ev(`!document.getElementById("manual").open && document.body.classList.contains("booted")`), "とじられない");
    t.noErrors(p);
    await server.close();
  },

  async "となりの へや（WARPIX ARCADE）の いりぐちは リンク集の したと このページについて に のこる"(t) {
    const server = await t.startServer();
    const p = await fresh(t);
    await p.goto(server.url);
    await t.sleep(1000);
    // リンク集の 下にも となりの へや
    t.eq(await p.ev(`document.querySelector(".arcade-door").href`), "https://arcade.warpix.app/", "となりの へやの いりぐち");
    t.ok(await p.ev(`document.getElementById("about").textContent.includes("WARPIX ARCADE")`), "このページについて に となりの へや が ない");
    t.noErrors(p);
    await server.close();
  },

  async "?go=manual の リンクなら、前に 来た 人にも せつめいしょ（シンプルモードでも）"(t) {
    const server = await t.startServer();
    const b = await t.launchBrowser();
    const p = await b.firstPage();
    await p.goto(server.url, 100);
    await p.ev(`localStorage.setItem("warpix-visits", "5"); localStorage.setItem("warpix-manual", "true")`);
    await p.goto(server.url + "?go=manual");
    await t.sleep(1000);
    let s = await state(p);
    t.ok(s.open && s.page === "1/3" && !(await p.ev(`document.getElementById("start-screen").hidden`)), `?go=manual で ひらかない: ${JSON.stringify(s)}`);
    for (let i = 0; i < 2; i++) await p.ev(`document.getElementById("manual-next").click()`);
    t.eq((await state(p)).next, "はじめる ▶", "さいごは はじめる");
    await p.ev(`document.getElementById("manual-next").click()`);
    await t.sleep(2600);
    t.ok(await p.ev(`document.body.classList.contains("booted")`), "はじめるで スタートしない");
    // ふつうに ひらけば 出ない
    await p.goto(server.url);
    await t.sleep(1000);
    t.eq((await state(p)).open, false, "?go なしで 出た");
    // シンプルモードでも
    await p.goto(server.url + "?simple=1&go=manual");
    await t.sleep(1500);
    t.ok((await state(p)).open, "シンプルモードで ?go=manual が ひらかない");
    t.noErrors(p);
    await server.close();
  },
};
