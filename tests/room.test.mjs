// ピクセの おへや（v1.26）：にっき・ずかん・スタンプ・じっせき・ぼうしを ひとつの まどに
const panel = (p) => p.ev(`["diary-body", "zukan-body", "stamp-body", "trophy-body", "hat-body"].find((id) => !document.getElementById(id).hidden)`);

export default {
  async "ひだりうえは ROOM ボタン 1 つで、ひらくと にっきから"(t) {
    const server = await t.startServer();
    const b = await t.launchBrowser();
    const p = await b.firstPage();
    await p.goto(server.url);
    await p.ev(`localStorage.clear()`);
    await p.goto(server.url);
    await p.boot();
    const hud = await p.ev(`[...document.querySelectorAll(".hud button")].map((b) => b.id)`);
    t.eq(hud, ["room-btn"], "HUD の ボタンが ROOM だけに なっていない");
    t.ok(await p.ev(`!document.getElementById("trophy-btn") && !document.getElementById("diary-btn") && !document.getElementById("trophies")`), "まえの ボタンや まどが のこっている");
    t.ok(await p.ev(`!!document.querySelector("#room-btn .room-icon svg")`), "おうちの アイコンが ない");
    t.eq(await p.ev(`document.getElementById("trophy-count").textContent`), `0/${await p.ev(`achievements.total`)}`, "じっせきの かず");
    await p.click("#room-btn");
    await t.sleep(300);
    t.ok(await p.ev(`document.getElementById("diary").open`), "おへやが ひらかない");
    t.eq(await panel(p), "diary-body", "さいしょは にっき");
    t.eq(await p.ev(`document.getElementById("diary-title").textContent`), "ピクセの おへや", "みだし");
    t.eq(await p.ev(`[...document.querySelectorAll(".diary-tab")].map((t) => t.textContent)`), ["にっき", "ずかん", "スタンプ", "じっせき", "ぼうし"], "タブ");
    t.ok(await p.ev(`achievements.has("diary")`), "にっきを よんだ じっせきが つかない");

    // じっせき：ぜんぶの じっせきが ならび、ないコマンドには へんじ
    await p.ev(`document.getElementById("tab-trophy").click()`);
    await t.sleep(200);
    t.eq(await panel(p), "trophy-body", "じっせきの ページ");
    t.ok(await p.ev(`document.querySelectorAll("#trophy-list li").length === achievements.total`), "じっせきの 行の かず");
    t.ok(await p.ev(`document.getElementById("trophies-count").textContent === document.getElementById("trophy-count").textContent`), "おへやと ボタンで かずが ちがう");

    // ぼうし：WARDROBE が ならぶ
    await p.ev(`document.getElementById("tab-hat").click()`);
    await t.sleep(200);
    t.eq(await panel(p), "hat-body", "ぼうしの ページ");
    t.ok(await p.ev(`document.querySelectorAll("#hat-body .wardrobe-item").length >= 2`), "ぼうしが ならばない");

    // とじて また ROOM を おすと、にっきに もどる
    await p.ev(`document.getElementById("diary-close").click()`);
    await p.click("#room-btn");
    await t.sleep(200);
    t.eq(await panel(p), "diary-body", "ひらきなおすと にっきに もどらない");
    t.noErrors(p);
    await server.close();
  },

  async "じっせきを とると ROOM が ひかって かずが ふえ、room.open で ページを えらべる"(t) {
    const server = await t.startServer();
    const b = await t.launchBrowser();
    const p = await b.firstPage();
    await p.goto(server.url);
    await p.ev(`localStorage.clear()`);
    await p.goto(server.url);
    await p.boot();
    await p.ev(`achievements.unlock("fashion")`);
    await t.sleep(100);
    t.ok(await p.ev(`document.getElementById("room-btn").classList.contains("ping")`), "ROOM が ひからない");
    t.ok((await p.ev(`document.getElementById("trophy-count").textContent`)).startsWith("1/"), "かずが ふえない");
    await p.ev(`room.open("trophy")`);
    await t.sleep(200);
    t.eq(await panel(p), "trophy-body", "room.open('trophy')");
    await p.ev(`room.open("stamp")`);
    await t.sleep(200);
    t.eq(await panel(p), "stamp-body", "ひらいたまま room.open('stamp')");
    t.noErrors(p);
    await server.close();
  },

  async "コントローラーの START で おへやの じっせきが ひらいて とじる（にせもののパッド）"(t) {
    const server = await t.startServer();
    const b = await t.launchBrowser();
    const p = await b.firstPage();
    await p.goto(server.url);
    await p.boot();
    await p.ev(`(() => {
      const btns = Array.from({ length: 17 }, () => ({ pressed: false, value: 0 }));
      window.__pad = { id: "Test Pad", index: 0, connected: true, mapping: "standard", axes: [0, 0, 0, 0], buttons: btns, timestamp: 0 };
      navigator.getGamepads = () => [window.__pad];
      const e = new Event("gamepadconnected"); e.gamepad = window.__pad; dispatchEvent(e);
      window.__tap = (i) => new Promise((r) => { btns[i].pressed = true; setTimeout(() => { btns[i].pressed = false; setTimeout(r, 80); }, 80); });
    })()`);
    await t.sleep(800);
    await p.ev(`__tap(9)`);
    await t.sleep(300);
    t.ok(await p.ev(`document.getElementById("diary").open`), "START で ひらかない");
    t.eq(await panel(p), "trophy-body", "START は じっせきの ページ");
    // 十字キーは、みえている ボタンと いれる ところだけを めぐる
    await p.ev(`__tap(13)`);
    t.ok(await p.ev(`document.activeElement.getClientRects().length > 0 && !!document.activeElement.closest("#diary")`), "十字キーで みえない ところへ いった");
    await p.ev(`__tap(1)`);
    await t.sleep(300);
    t.ok(await p.ev(`!document.getElementById("diary").open`), "B で とじない");
    t.noErrors(p);
    await server.close();
  },

  async "スマホ（390px）で タブが 1 だんに おさまる"(t) {
    const server = await t.startServer();
    const b = await t.launchBrowser({ width: 390, height: 844 });
    const p = await b.firstPage();
    await p.size(390, 844, true);
    await p.goto(server.url);
    await p.boot();
    await p.click("#room-btn");
    await t.sleep(300);
    const tops = await p.ev(`[...document.querySelectorAll(".diary-tab")].map((t) => Math.round(t.getBoundingClientRect().top))`);
    t.eq(new Set(tops).size, 1, `タブが おりかえしている（${tops}）`);
    t.ok(await p.ev(`(() => { const d = document.getElementById("diary").getBoundingClientRect(); return [...document.querySelectorAll(".diary-tab, .diary-top button:not([hidden])")].every((e) => { const r = e.getBoundingClientRect(); return r.left >= d.left && r.right <= d.right; }); })()`), "タブや ボタンが まどから はみでた");
    await p.shot("room-390.png");
    t.noErrors(p);
    await server.close();
  },
};
