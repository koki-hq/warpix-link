// アーケード：隠しコマンド、マザーシップ、ミニゲーム、実績画面、コナミコマンド、デモプレイ
export default {
  async "隠しコマンド gameboy / party / pixe"(t) {
    const server = await t.startServer();
    const b = await t.launchBrowser();
    const p = await b.firstPage();
    await p.goto(server.url);
    await p.ev(`localStorage.clear()`);
    await p.goto(server.url);
    await p.boot();
    await p.type("gameboy");
    await t.sleep(500);
    t.ok(await p.ev(`document.body.classList.contains("gb")`), "gameboy で配色が変わらない");
    t.eq(await p.ev(`getComputedStyle(document.body).getPropertyValue("--fg").trim()`), "#9bbc0f", "ゲームボーイの文字色");
    t.ok(await p.ev(`!document.getElementById("toast").hidden`), "実績のお知らせが出ない");
    await p.type("gameboy");
    t.ok(await p.ev(`!document.body.classList.contains("gb")`), "もう一度 gameboy で戻らない");
    await p.type("party");
    await t.sleep(300);
    t.ok(await p.ev(`document.body.classList.contains("party")`), "party が始まらない");
    await p.type("pixe");
    await t.sleep(1500);
    t.eq(await p.ev(`document.querySelectorAll(".rain-pixe").length`), 24, "ふってくるピクセの数");
    await p.shot("arcade-party.png");
    t.noErrors(p);
    await server.close();
  },

  async "マザーシップは 10 発で落ちて 1 万点"(t) {
    const server = await t.startServer();
    const b = await t.launchBrowser();
    const p = await b.firstPage();
    await p.goto(server.url);
    await p.boot();
    await p.ev(`mothership()`);
    await t.sleep(1500);
    t.ok(await p.ev(`!!document.querySelector(".mothership")`), "マザーシップが出ない");
    await p.ev(`(() => { const m = document.querySelector(".mothership"); for (let i = 0; i < 10; i++) m.dispatchEvent(new MouseEvent("click", { bubbles: true, clientX: 100, clientY: 100 })); })()`);
    await t.sleep(1200);
    t.ok(await p.ev(`!document.querySelector(".mothership")`), "撃沈しても消えない");
    t.ok(await p.ev(`Number(document.querySelector("[data-score]").textContent) >= 11800`), "点数が足りない（200×9 + 10000）");
    t.ok(await p.ev(`achievements.has("mothership")`), "実績がない");
    t.noErrors(p);
    await server.close();
  },

  async "ミニゲームを開いて遊んで閉じる"(t) {
    const server = await t.startServer();
    const b = await t.launchBrowser();
    const p = await b.firstPage();
    await p.goto(server.url);
    await p.boot();
    await p.ev(`document.getElementById("coin-slot").click()`);
    await t.sleep(1500);
    t.ok(await p.ev(`game.isOpen() && document.body.classList.contains("gaming")`), "ミニゲームが開かない");
    await p.key("ArrowLeft", "down");
    await t.sleep(800);
    await p.key("ArrowLeft", "up");
    await t.sleep(1500);
    await p.shot("arcade-invaders.png");
    await p.key("Escape");
    await t.sleep(300);
    t.ok(await p.ev(`!game.isOpen() && document.getElementById("game").hidden`), "Esc で閉じない");
    t.noErrors(p);
    await server.close();
  },

  async "実績画面と CHEAT CODE 欄、コンソールの pixe()"(t) {
    const server = await t.startServer();
    const b = await t.launchBrowser();
    const p = await b.firstPage();
    await p.goto(server.url);
    await p.boot();
    t.eq(await p.ev(`pixe()`), "🕹 HELLO, HACKER.", "pixe() の返事");
    await p.ev(`document.getElementById("trophy-btn").click()`);
    await t.sleep(300);
    t.ok(await p.ev(`document.getElementById("trophies").open`), "実績画面が開かない");
    t.ok(await p.ev(`document.querySelectorAll("#trophy-list li").length === achievements.total`), "実績の行数が合わない");
    await p.ev(`document.getElementById("cheat-input").value = "nope"; document.getElementById("cheat-form").requestSubmit()`);
    t.ok((await p.ev(`document.getElementById("cheat-msg").textContent`)).includes("ない"), "ないコマンドのメッセージ");
    await p.ev(`document.getElementById("cheat-input").value = "warp"; document.getElementById("cheat-form").requestSubmit()`);
    t.ok(await p.ev(`!document.getElementById("trophies").open`), "コマンドを打つと実績画面が閉じる");
    t.noErrors(p);
    await server.close();
  },

  async "コナミコマンドでワープゾーンが開く"(t) {
    const server = await t.startServer();
    const b = await t.launchBrowser();
    const p = await b.firstPage();
    await p.goto(server.url);
    await p.boot();
    for (const k of ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"]) await p.key(k);
    await t.sleep(400);
    t.ok(await p.ev(`!document.getElementById("secret-link").hidden`), "ワープゾーンのボタンが出ない");
    t.ok(await p.ev(`achievements.has("konami") && achievements.has("warp-zone")`), "実績がない");
    t.noErrors(p);
    await server.close();
  },

  async "ピクセを 10 回つつくとワープゾーン"(t) {
    const server = await t.startServer();
    const b = await t.launchBrowser();
    const p = await b.firstPage();
    await p.goto(server.url);
    await p.boot();
    for (let i = 0; i < 10; i++) { await p.ev(`document.getElementById("npc").click()`); await t.sleep(60); }
    await t.sleep(300);
    t.ok(await p.ev(`!document.getElementById("secret-link").hidden`), "ワープゾーンのボタンが出ない");
    t.noErrors(p);
    await server.close();
  },

  async "デモプレイは点数を入れず、キーを押すと終わる"(t) {
    const server = await t.startServer();
    const b = await t.launchBrowser();
    const p = await b.firstPage();
    await p.goto(server.url);
    await p.boot();
    const before = await p.ev(`document.querySelector("[data-score]").textContent`);
    await p.ev(`game.open({ demo: true })`);
    await t.sleep(4000);
    t.ok(await p.ev(`game.isDemo()`), "デモになっていない");
    await p.shot("arcade-demo.png");
    await p.key("x");
    await t.sleep(300);
    t.ok(await p.ev(`!game.isOpen()`), "キーで終わらない");
    t.eq(await p.ev(`document.querySelector("[data-score]").textContent`), before, "デモの点数がページに入った");
    t.noErrors(p);
    await server.close();
  },
};
