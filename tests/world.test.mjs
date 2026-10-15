// ページの外まで：タブ間のピクセ、月、きせかえ、印刷すると認定証、ピクセが気づく
export default {
  async "となりのタブへ遊びに行って、帰ってくる"(t) {
    const server = await t.startServer();
    const b = await t.launchBrowser();
    const A = await b.firstPage();
    await A.goto(server.url);
    await A.boot();
    const B = await b.newPage(server.url);
    await t.sleep(1200);
    await B.boot();
    await t.sleep(1500);
    t.ok(await A.ev(`achievements.has("parallel")`), "A が B に気づいていない");
    t.ok(await B.ev(`achievements.has("parallel")`), "B が A に気づいていない");
    await A.send("Page.bringToFront");
    await A.ev(`document.getElementById("npc").dispatchEvent(new MouseEvent("dblclick", { bubbles: true }))`);
    await t.sleep(2000);
    t.ok(await A.ev(`npc.isAway()`), "A のピクセが出かけない");
    t.ok(await B.ev(`!!document.querySelector(".npc-guest")`), "B にお客さんが来ない");
    // B は裏のタブ：タイトルとファビコンで知らせる
    t.ok(await B.ev(`document.hidden`), "前提：B は裏のタブ");
    t.ok((await B.ev(`document.title`)).startsWith("❗"), "裏のタブのタイトルで知らせていない");
    await B.send("Page.bringToFront");
    await t.sleep(2500);
    t.ok((await B.text()).includes("おじゃまします"), "手前に出してもあいさつしない");
    await B.ev(`document.querySelector(".npc-guest").click()`);
    await t.sleep(1500);
    t.ok(await A.ev(`!npc.isAway()`), "A のピクセが帰ってこない");
    t.noErrors(A, B);
    await server.close();
  },

  async "月をクリックすると今日の月の名前"(t) {
    const server = await t.startServer();
    const b = await t.launchBrowser();
    const p = await b.firstPage();
    await p.goto(server.url);
    await p.boot();
    await p.click("#moon"); // 本物のクリックで、ほかの要素の下に隠れていないことも確かめる
    await t.sleep(2500);
    t.ok((await p.text()).startsWith("きょうの つきは"), `月のセリフ: ${await p.text()}`);
    t.ok(await p.ev(`achievements.has("moon")`), "実績「つきみ」がない");
    t.noErrors(p);
    await server.close();
  },

  async "きせかえで帽子をかぶり、ファビコンにも反映"(t) {
    const server = await t.startServer();
    const b = await t.launchBrowser();
    const p = await b.firstPage();
    await p.goto(server.url);
    await p.ev(`localStorage.clear()`);
    await p.goto(server.url);
    await p.boot();
    await p.type("party"); // パーティーハットがもらえる
    await t.sleep(500);
    const favBefore = await p.ev(`document.getElementById("favicon").href`);
    await p.ev(`document.getElementById("trophy-btn").click()`);
    await t.sleep(300);
    await p.ev(`[...document.querySelectorAll(".wardrobe-item")].find((b) => b.title === "パーティーハット").click()`);
    await t.sleep(3500);
    t.eq(await p.ev(`wardrobe.currentId()`), "party", "帽子");
    t.ok(await p.ev(`achievements.has("fashion")`), "実績「おしゃれさん」がない");
    t.ok(await p.ev(`document.getElementById("favicon").href`) !== favBefore, "ファビコンが変わらない");
    t.noErrors(p);
    await server.close();
  },

  async "印刷すると認定証になる"(t) {
    const server = await t.startServer();
    const b = await t.launchBrowser();
    const p = await b.firstPage();
    await p.goto(server.url);
    await p.boot();
    await p.ev(`window.dispatchEvent(new Event("beforeprint"))`);
    await p.send("Emulation.setEmulatedMedia", { media: "print" });
    await t.sleep(300);
    const s = await p.ev(`({ cert: getComputedStyle(document.getElementById("certificate")).display, main: getComputedStyle(document.querySelector(".screen")).display, text: document.getElementById("certificate").innerText })`);
    t.eq(s.cert, "block", "認定証が出ない");
    t.eq(s.main, "none", "ふつうのページが隠れない");
    t.ok(s.text.includes("にんていしょう"), "認定証の文字");
    t.ok(await p.ev(`achievements.has("print")`), "実績「かみに のこす」がない");
    await p.shot("world-certificate.png");
    t.noErrors(p);
    await server.close();
  },

  async "コピーするとピクセが気づく"(t) {
    const server = await t.startServer();
    const b = await t.launchBrowser();
    const p = await b.firstPage();
    await p.goto(server.url);
    await p.boot();
    await p.ev(`document.dispatchEvent(new Event("copy"))`);
    await t.sleep(2200);
    t.ok((await p.text()).startsWith("コピーした？"), "コピーに気づかない");
    t.noErrors(p);
    await server.close();
  },
};
