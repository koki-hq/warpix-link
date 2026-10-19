// 基本：起動、あいさつ、リンク、BGM、スマホのレイアウト
export default {
  async "ひらくと テレビの スイッチが はいる。iPhone の 起動画面は ねむっている ピクセ"(t) {
    const server = await t.startServer();
    const b = await t.launchBrowser();
    const p = await b.firstPage();
    await p.goto(server.url);
    t.eq(await p.ev(`getComputedStyle(document.querySelector(".tv-on")).display`), "block", "テレビの スイッチが ない");
    // とちゅうの コマを とめて みる（よこせんが はしる → うえと したに ひらく）
    const at = (ms) => p.ev(`document.getAnimations().filter((a) => a.animationName?.startsWith("tv-on")).forEach((a) => { a.pause(); a.currentTime = ${ms}; })`);
    await at(120);
    await p.shot("tv-on-line.png");
    t.ok(await p.ev(`(() => { const r = document.querySelector(".tv-on i").getBoundingClientRect(); return r.width > innerWidth * 0.5 && r.height < 10; })()`), "よこせんが はしらない");
    await at(320);
    await p.shot("tv-on-open.png");
    await p.ev(`document.getAnimations().forEach((a) => a.play())`);
    await t.sleep(600);
    t.eq(await p.ev(`getComputedStyle(document.querySelector(".tv-on")).visibility`), "hidden", "ひらいた あとも のこっている");
    t.ok(await p.ev(`document.elementFromPoint(innerWidth / 2, innerHeight / 2)?.id === "start-btn" || !!document.elementFromPoint(innerWidth / 2, innerHeight / 2)?.closest("#start-screen")`), "PRESS START を おせない");
    // うごきを へらす ときは でない
    await p.ev(`localStorage.setItem("warpix-settings", JSON.stringify({ motion: "reduce" }))`);
    await p.goto(server.url);
    t.eq(await p.ev(`getComputedStyle(document.querySelector(".tv-on")).display`), "none", "うごきを へらしても でる");
    // 起動画面：13 の 大きさ。どれも とどく
    const hrefs = await p.ev(`[...document.querySelectorAll('link[rel="apple-touch-startup-image"]')].map((l) => l.getAttribute("href"))`);
    t.eq(hrefs.length, 13, "起動画面の かず");
    const codes = await p.ev(`Promise.all(${JSON.stringify(hrefs)}.map((h) => fetch(h).then((r) => r.status)))`);
    t.ok(codes.every((c) => c === 200), `とどかない 起動画面: ${codes.join(",")}`);
    t.noErrors(p);
    await server.close();
  },

  async "起動してピクセがあいさつする"(t) {
    const server = await t.startServer();
    const b = await t.launchBrowser();
    const p = await b.firstPage();
    await p.goto(server.url);
    t.ok(await p.ev(`!document.getElementById("start-screen").hidden`), "PRESS START 画面が出ていない");
    await p.ev(`document.getElementById("start-btn").click()`);
    await t.sleep(2600);
    const intro = await p.readIntro();
    const s = await p.ev(`({
      booted: document.body.classList.contains("booted"),
      icons: document.querySelectorAll(".pixel-btn .icon svg").length,
      links: document.querySelectorAll(".pixel-btn:not([hidden])").length,
      npc: !!document.querySelector("#npc-body svg"),
      title: getComputedStyle(document.querySelector(".title")).opacity,
      favicon: document.getElementById("favicon").href.startsWith("data:image/png"),
    })`);
    t.ok(s.booted, "booted になっていない");
    t.eq(s.links, 6, "リンクボタンの数");
    t.eq(s.icons, 7, "アイコンの数（ワープゾーンの鍵をふくむ）");
    t.ok(s.npc, "ピクセが描かれていない");
    t.eq(s.title, "1", "タイトルが見えていない");
    t.ok(s.favicon, "ファビコンが描かれていない");
    // 1行目は時間帯で変わる（深夜は「よふかし？」）ので、いつも同じ 2行目で確かめる
    t.ok(intro.some((l) => l.includes("ワープできるよ")), `あいさつの 2行目がない: ${intro.join(" / ")}`);
    t.noErrors(p);
    await server.close();
  },

  async "スタートの位置にボタンが来ても、あいさつより先に紹介しない"(t) {
    const server = await t.startServer();
    const b = await t.launchBrowser();
    const p = await b.firstPage();
    await p.goto(server.url);
    const pos = await p.ev(`(() => { const r = document.querySelectorAll(".pixel-btn")[1].getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; })()`);
    await p.ev(`window.__said = []; window.__hovers = 0;
      const sy = npc.say; npc.say = (l) => { window.__said.push(l[0]); sy(l); };
      const it = npc.intro; npc.intro = () => { window.__said.push("[INTRO]"); it(); };
      const h = sound.sfx.hover; sound.sfx.hover = () => { window.__hovers++; h(); };`);
    for (const type of ["mouseMoved", "mousePressed", "mouseReleased"]) {
      await p.send("Input.dispatchMouseEvent", { type, x: pos.x, y: pos.y, button: "left", clickCount: 1 });
    }
    await t.sleep(2600);
    t.ok(await p.ev(`document.querySelectorAll(".pixel-btn")[1].matches(":hover")`), "再現の前提（ボタンがカーソルの下）がくずれている");
    t.eq(await p.ev(`window.__said`), ["[INTRO]"], "あいさつより先に何か言った");
    t.eq(await p.ev(`window.__hovers`), 0, "マウスを動かしていないのにホバー音が鳴った");
    t.noErrors(p);
    await server.close();
  },

  async "リンクを押すと 100 点でワープ、BGM の設定は保存される"(t) {
    const server = await t.startServer();
    const b = await t.launchBrowser();
    const p = await b.firstPage();
    await p.goto(server.url);
    await p.ev(`localStorage.clear()`);
    await p.goto(server.url);
    await p.boot();
    await p.ev(`document.querySelector(".pixel-btn").addEventListener("click", (e) => e.preventDefault(), { once: true }); document.querySelector(".pixel-btn").click()`);
    await t.sleep(200);
    t.eq(await p.ev(`document.querySelector("[data-score]").textContent`), "000100", "スコア");
    t.ok(await p.ev(`achievements.has("first-warp")`), "実績「はじめての ワープ」がない");
    await p.ev(`document.getElementById("bgm-toggle").click()`);
    t.eq(await p.ev(`localStorage.getItem("warpix-bgm")`), "off", "BGM OFF が保存されていない");
    await p.goto(server.url);
    t.eq(await p.ev(`document.getElementById("bgm-toggle").textContent`), "BGM OFF", "開き直すと BGM OFF のまま");
    t.noErrors(p);
    await server.close();
  },

  async "連打する場所は、スマホでダブルタップしても拡大しない設定になっている"(t) {
    // ヘッドレス Chrome ではダブルタップ拡大そのものを再現できないので、設定が効いていることを確かめる
    const server = await t.startServer();
    const b = await t.launchBrowser();
    const p = await b.firstPage();
    await p.goto(server.url);
    await p.boot({ readIntro: false });
    await p.ev(`mothership(); (() => { const el = document.createElement("div"); el.className = "raid"; el.innerHTML = '<button type="button" class="raid-ship"></button>'; document.body.append(el); })()`);
    await t.sleep(300);
    const got = await p.ev(`Object.fromEntries([".raid-ship", "#npc", ".mothership", ".pixel-btn", ".dialog", "#start-btn", ".coin-slot"].map((s) => [s, getComputedStyle(document.querySelector(s)).touchAction]))`);
    for (const [sel, v] of Object.entries(got)) t.eq(v, "manipulation", `${sel} の touch-action`);
    t.noErrors(p);
    await server.close();
  },

  async "スマホの幅で、スコア・月・BGM がタイトルに重ならない"(t) {
    const server = await t.startServer();
    const b = await t.launchBrowser();
    const p = await b.firstPage();
    for (const [w, h] of [[360, 780], [375, 667], [390, 844], [768, 1024]]) {
      await p.size(w, h, w < 600);
      await p.goto(server.url);
      await p.boot({ readIntro: false });
      const r = await p.ev(`(() => {
        const box = (s) => { const b = document.querySelector(s).getBoundingClientRect(); return { l: b.left, t: b.top, r: b.right, b: b.bottom }; };
        const range = document.createRange(); range.selectNodeContents(document.querySelector(".title"));
        const tb = range.getBoundingClientRect(); const title = { l: tb.left, t: tb.top, r: tb.right, b: tb.bottom };
        const hit = (a, b) => a.l < b.r && a.r > b.l && a.t < b.b && a.b > b.t;
        return { hud: hit(box(".hud"), title), moon: hit(box("#moon"), title), bgm: hit(box("#bgm-toggle"), title), simple: hit(box("#simple-toggle"), title) };
      })()`);
      for (const [k, v] of Object.entries(r)) t.ok(!v, `${w}x${h} で ${k} がタイトルに重なっている`);
    }
    t.noErrors(p);
    await server.close();
  },

  async "リンクは 読み上げで「あたらしい タブで ひらく」と伝え、名前は そのまま"(t) {
    const server = await t.startServer();
    const b = await t.launchBrowser();
    const p = await b.firstPage();
    await p.goto(server.url);
    const r = await p.ev(`[...document.querySelectorAll(".pixel-btn:not(.secret)")].map((a) => [linkLabel(a), a.target === "_blank" ? a.querySelector(".sr-only")?.textContent : "-"])`);
    t.eq(r.map(([l]) => l), ["YOUTUBE", "TWITTER", "INSTAGRAM", "BOOTH", "TUMBLR", "SPOTIFY"], "リンクの名前");
    for (const [l, sr] of r) t.eq(sr, "（あたらしい タブで ひらく）", `${l} の読み上げ`);
    t.noErrors(p);
    await server.close();
  },
};
