// とりあつかい せつめいしょ（v1.48、おたより #4・#6）：はじめての 人にだけ。なにの アプリか・つかいかた・ホーム画面に 入れる やりかた
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
// ページの そとから きろくを けす（ページの なかで けすと、うつる ときに また かきこまれる）
async function fresh(p, url) {
  await p.goto("about:blank", 100);
  await p.send("Storage.clearDataForOrigin", { origin: url.replace(/\/$/, ""), storageTypes: "local_storage" });
}
const state = (p) => p.ev(`({ open: document.getElementById("manual").open, page: document.getElementById("manual-page").textContent, next: document.getElementById("manual-next").textContent, skip: !document.getElementById("manual-skip").hidden, how: document.getElementById("manual-how").textContent, point: !document.getElementById("manual-point").hidden })`);

export default {
  async "はじめての 人には ひらいて すぐ せつめいしょ。3 まいめは iPhone の Safari の やりかた、はじめるで そのまま スタート"(t) {
    const server = await t.startServer();
    const p = await phone(t, IPHONE);
    await p.goto(server.url, 100);
    t.eq(await p.ev(`document.querySelector(".start-tagline").textContent`), "いつものアプリを、ちょっと楽しくひらく入口。", "さいしょの 画面の ひとこと");
    t.eq((await state(p)).open, false, "テレビの スイッチの まえに 出た");
    await t.sleep(900);
    let s = await state(p);
    t.ok(s.open && s.page === "1/3" && s.next === "つぎへ ▶" && s.skip, `1 まいめ: ${JSON.stringify(s)}`);
    t.ok((await p.ev(`document.querySelector('[data-sheet="what"]').textContent`)).includes("いつものアプリを、ちょっと楽しくひらく入口。"), "なにの アプリか");
    t.ok(await p.ev(`document.querySelectorAll("#manual .ms-pixe svg").length === 3 && !!document.querySelector("#manual .ms-cursor svg")`), "ピクセの え");
    await p.shot("manual-1.png");
    await p.ev(`document.getElementById("manual-next").click()`);
    s = await state(p);
    t.ok(s.page === "2/3" && (await p.ev(`document.querySelector('[data-sheet="how"]').textContent`)).includes("SIMPLE"), `2 まいめ: ${JSON.stringify(s)}`);
    await t.sleep(2300); // ピクセが あなに とびこんで「ワープ！」の ところ
    await p.shot("manual-2.png");
    await p.ev(`document.getElementById("manual-next").click()`);
    s = await state(p);
    t.ok(s.page === "3/3" && s.next === "はじめる ▶" && !s.skip, `3 まいめ: ${JSON.stringify(s)}`);
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

  async "前に 来た 人には 出ない。とばす・Esc で とじて、パソコンは 2 まい"(t) {
    const server = await t.startServer();
    const b = await t.launchBrowser();
    const p = await b.firstPage();
    await p.send("Page.addScriptToEvaluateOnNewDocument", { source: ON });
    await p.goto(server.url);
    await t.sleep(1000);
    let s = await state(p);
    t.ok(s.open && s.page === "1/2", `パソコンは ホーム画面の ページなし: ${JSON.stringify(s)}`);
    await p.ev(`document.getElementById("manual-skip").click()`);
    await t.sleep(300);
    t.ok(await p.ev(`!document.getElementById("manual").open && !document.getElementById("start-screen").hidden && !document.body.classList.contains("booted")`), "とばすと PRESS START に もどらない");
    t.eq(await p.ev(`document.activeElement.id`), "start-btn", "とばしたら PRESS START に フォーカス");
    t.eq(await p.ev(`localStorage.getItem("warpix-manual")`), "true", "とばしても おぼえない");
    // 前に 来た ことが ある 人（せつめいしょが できる まえからの 1期生など）
    await fresh(p, server.url);
    await p.goto(server.url, 100);
    await p.ev(`localStorage.setItem("warpix-visits", "5")`);
    await p.goto(server.url);
    await t.sleep(1000);
    t.eq((await state(p)).open, false, "前に 来た 人に 出た");
    // Esc で とじる
    await fresh(p, server.url);
    await p.goto(server.url);
    await t.sleep(1000);
    t.ok((await state(p)).open, "まっさらなのに 出ない");
    await p.send("Input.dispatchKeyEvent", { type: "rawKeyDown", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 });
    await p.send("Input.dispatchKeyEvent", { type: "keyUp", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 });
    await t.sleep(300);
    t.ok(await p.ev(`!document.getElementById("manual").open && localStorage.getItem("warpix-manual") === "true"`), "Esc で とじない・おぼえない");
    // シンプルモードでは 出ない
    await fresh(p, server.url);
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
    t.ok(s.open && s.page === "1/3" && !(await p.ev(`document.getElementById("about").open`)), `よみなおし: ${JSON.stringify(s)}`);
    await p.ev(`document.getElementById("manual-next").click(); document.getElementById("manual-next").click()`);
    s = await state(p);
    t.ok(s.how.includes("ブラウザでひらく") && !s.point && s.next === "とじる", `インスタの なか: ${JSON.stringify(s)}`);
    await p.ev(`document.getElementById("manual-next").click()`);
    await t.sleep(300);
    t.ok(await p.ev(`!document.getElementById("manual").open && document.body.classList.contains("booted")`), "とじられない");
    t.noErrors(p);
    await server.close();
  },
};
