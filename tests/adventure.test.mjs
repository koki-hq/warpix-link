// PIXE ADVENTURE：おさそい、移動と着地、地面から戻れる、画面サイズを変えてもずれない、クリアとスタッフロール
const heroInfo = (p) => p.ev(`(() => {
  const h = document.querySelector(".adv-hero");
  if (!h) return null;
  const r = h.getBoundingClientRect();
  const feetY = r.bottom + scrollY, feetX = r.left + r.width / 2;
  const plats = [...document.querySelectorAll(".pixel-btn:not([hidden]), .dialog, .npc-sprite, .title, .subtitle, .coin-slot")];
  const on = plats.find((el) => { const b = el.getBoundingClientRect(); return Math.abs(b.top + scrollY - feetY) < 3 && feetX > b.left && feetX < b.right; });
  const coin = document.querySelector(".coin-slot").getBoundingClientRect();
  return { x: Math.round(r.left + scrollX), feetY: Math.round(feetY), on: on ? on.className.split(" ")[0] + ":" + on.textContent.trim().slice(0, 10) : null, coinX: Math.round(coin.left + coin.width / 2) };
})()`);

// テストだけの近道：デバッガで冒険の中に止まり、式を実行する（製品のコードには何も足さない）
async function insideAdventure(t, p, expr) {
  const line = (await import("node:fs")).readFileSync(t.ROOT + "/adventure.js", "utf8").split("\n").findIndex((l) => l.includes("const box = { x: h.x + 6"));
  const bp = await p.send("Debugger.setBreakpointByUrl", { lineNumber: line, urlRegex: "adventure\\.js$" });
  const paused = await p.waitFor("Debugger.paused");
  const out = await p.send("Debugger.evaluateOnCallFrame", { callFrameId: paused.callFrames[0].callFrameId, expression: expr, returnByValue: true });
  await p.send("Debugger.removeBreakpoint", { breakpointId: bp.result.breakpointId });
  await p.send("Debugger.resume");
  return out.result?.result?.value;
}
// コインとゴールをピクセのところへ寄せて、クリアさせる
async function quickClear(t, p) {
  await p.send("Debugger.enable");
  await insideAdventure(t, p, `coins.forEach((c) => { c.x = h.x + 8; c.y = h.y + 8; }); coins.length`);
  await t.sleep(700);
  await insideAdventure(t, p, `goal && (goal.x = h.x + 4, goal.y = h.y + 4)`);
  await p.send("Debugger.disable");
  await t.sleep(700);
}
const coinSpots = (p) => p.ev(`[...document.querySelectorAll(".adv-coin")].map((c) => c.style.translate).sort().join("|")`);

export default {
  async "同じ日はコースが同じで、日がかわるとコースもかわる"(t) {
    const server = await t.startServer();
    const b = await t.launchBrowser();
    const p = await b.firstPage();
    const spotsOn = async (date) => {
      await p.goto(`${server.url}?date=${date}`);
      await p.boot({ readIntro: false });
      await p.ev(`adventure.start()`);
      await t.sleep(300);
      const s = await coinSpots(p);
      await p.ev(`adventure.exit(false)`);
      return s;
    };
    const a1 = await spotsOn("2026-11-01");
    const a2 = await spotsOn("2026-11-01");
    const bDay = await spotsOn("2026-11-02");
    t.eq(a2, a1, "同じ日なのにコインの場所がちがう");
    t.ok(bDay !== a1, "日がかわってもコインの場所が同じ");
    t.noErrors(p);
    await server.close();
  },

  async "クリアした走りがゴーストになり、次の冒険でいっしょに走る"(t) {
    const server = await t.startServer();
    const b = await t.launchBrowser();
    const p = await b.firstPage();
    await p.goto(server.url);
    await p.ev(`localStorage.clear()`);
    await p.goto(server.url);
    await p.boot();
    await p.ev(`adventure.start()`);
    await t.sleep(1500);
    await p.key("ArrowRight", "down");
    await t.sleep(500);
    await p.key("ArrowRight", "up");
    await quickClear(t, p);
    const ghost = await p.ev(`JSON.parse(localStorage.getItem("warpix-adv-ghost"))`);
    t.ok(ghost && ghost.frames.length > 20, "ゴーストが保存されない");
    t.ok(ghost && ghost.keys.length >= 1, "足場の名前が記録されない");
    await p.ev(`document.querySelector(".credits")?.click()`);
    await t.sleep(4500);
    await p.ev(`document.querySelector(".credits")?.click()`);
    await p.ev(`adventure.start()`);
    await t.sleep(200);
    t.ok(await p.ev(`!!document.querySelector(".adv-ghost")`), "2 回目にゴーストが出ない");
    t.ok((await p.ev(`document.querySelector(".adv-hud").textContent`)).includes("GHOST"), "HUD にゴーストのタイムがない");
    const pos1 = await p.ev(`document.querySelector(".adv-ghost").style.translate`);
    await t.sleep(900);
    const pos2 = await p.ev(`document.querySelector(".adv-ghost").style.translate`);
    t.ok(pos1 && pos2 && pos1 !== pos2, `ゴーストが動かない: ${pos1} → ${pos2}`);
    await p.shot("adventure-ghost.png");
    t.noErrors(p);
    await server.close();
  },

  async "ピクセのおさそいに「いいよ」で冒険が始まる"(t) {
    const server = await t.startServer();
    const b = await t.launchBrowser();
    const p = await b.firstPage();
    await p.goto(server.url);
    await p.boot();
    // おさそいは起動 25 秒後。待つかわりに同じ質問を直接出す
    const answer = p.ev(`npc.ask("テスト", ["いいよ！", "だめ"])`);
    await t.sleep(600);
    t.eq(await p.ev(`[...document.querySelectorAll(".dialog-choices button")].map((b) => b.textContent)`), ["いいよ！", "だめ"], "選択肢");
    await p.click(".dialog-choices button");
    t.eq(await answer, 0, "「いいよ！」の番号");
    await p.ev(`adventure.start()`);
    await t.sleep(800);
    const s = await p.ev(`({ active: adventure.isActive(), coins: document.querySelectorAll(".adv-coin").length, enemies: document.querySelectorAll(".adv-enemy").length, away: npc.isAway(), ground: !!document.querySelector(".adv-ground") })`);
    t.ok(s.active, "冒険が始まらない");
    t.ok(s.coins >= 7, `コインが少ない: ${s.coins}`);
    t.eq(s.enemies, 2, "UFO の数");
    t.ok(s.away, "ピクセの箱が留守になっていない");
    t.ok(s.ground, "地面のラインがない");
    await t.sleep(1200);
    const before = await heroInfo(p);
    t.ok(before.on, "ピクセがどこにも着地していない");
    await p.key("ArrowRight", "down");
    await t.sleep(600);
    await p.key("ArrowRight", "up");
    await t.sleep(800);
    const after = await heroInfo(p);
    t.ok(after.x > before.x + 30, `右に動いていない: ${before.x} → ${after.x}`);
    await p.key("Escape");
    await t.sleep(300);
    t.ok(await p.ev(`!adventure.isActive() && !npc.isAway()`), "Esc でやめられない");
    t.noErrors(p);
    await server.close();
  },

  async "大きい画面でいちばん下に落ちても、ジャンプで戻れる"(t) {
    const server = await t.startServer();
    const b = await t.launchBrowser();
    const p = await b.firstPage();
    await p.size(1920, 1080);
    await p.goto(server.url);
    await p.boot({ readIntro: false });
    await p.ev(`adventure.start()`);
    await t.sleep(1500);
    for (let i = 0; i < 12; i++) { await p.key("ArrowDown", "down"); await t.sleep(120); await p.key("ArrowDown", "up"); await t.sleep(300); }
    await t.sleep(800);
    const bottom = await heroInfo(p);
    t.ok(bottom.feetY < 1080, `ページの底まで落ちた: ${bottom.feetY}`);
    for (let i = 0; i < 80; i++) {
      const w = await heroInfo(p);
      const dx = w.coinX - (w.x + 16);
      if (Math.abs(dx) < 6) break;
      const k = dx > 0 ? "ArrowRight" : "ArrowLeft";
      await p.key(k, "down"); await t.sleep(Math.min(250, Math.abs(dx) * 4)); await p.key(k, "up"); await t.sleep(100);
    }
    await p.key(" ", "down"); await t.sleep(400); await p.key(" ", "up");
    await t.sleep(1200);
    const up = await heroInfo(p);
    t.ok(up.on?.startsWith("coin-slot"), `INSERT COIN に乗れていない: ${JSON.stringify(up)}`);
    t.noErrors(p);
    await server.close();
  },

  async "冒険中に画面サイズを変えても、乗っている足場からずれない"(t) {
    const server = await t.startServer();
    const b = await t.launchBrowser();
    const p = await b.firstPage();
    await p.size(1920, 1080);
    await p.goto(server.url);
    await p.boot({ readIntro: false });
    await p.ev(`adventure.start()`);
    await t.sleep(2500);
    const start = await heroInfo(p);
    t.ok(start.on, "最初に着地していない");
    await p.size(900, 640);
    await t.sleep(1200);
    t.eq((await heroInfo(p)).on, start.on, "小さくしたら足場から外れた");
    await p.size(1920, 1080);
    await t.sleep(1200);
    t.eq((await heroInfo(p)).on, start.on, "大きく戻したら足場から外れた");
    t.noErrors(p);
    await server.close();
  },

  async "コインを全部取るとゴールが出て、クリアでスタッフロール"(t) {
    const server = await t.startServer();
    const b = await t.launchBrowser();
    const p = await b.firstPage();
    await p.goto(server.url);
    await p.ev(`localStorage.clear()`);
    await p.goto(server.url);
    await p.boot();
    await p.ev(`adventure.start()`);
    await t.sleep(1500);
    // テストだけの近道：デバッガで冒険の中に止まり、コインとゴールをピクセのところへ寄せる（製品のコードには何も足さない）
    await p.send("Debugger.enable");
    const line = (await import("node:fs")).readFileSync(t.ROOT + "/adventure.js", "utf8").split("\n").findIndex((l) => l.includes("const box = { x: h.x + 6"));
    t.ok(line > 0, "adventure.js の止める場所が見つからない（テストを直す）");
    const inside = async (expr) => {
      const bp = await p.send("Debugger.setBreakpointByUrl", { lineNumber: line, urlRegex: "adventure\\.js$" });
      const paused = await p.waitFor("Debugger.paused");
      const out = await p.send("Debugger.evaluateOnCallFrame", { callFrameId: paused.callFrames[0].callFrameId, expression: expr, returnByValue: true });
      await p.send("Debugger.removeBreakpoint", { breakpointId: bp.result.breakpointId });
      await p.send("Debugger.resume");
      return out.result?.result?.value;
    };
    await inside(`coins.forEach((c) => { c.x = h.x + 8; c.y = h.y + 8; }); coins.length`);
    await t.sleep(800);
    t.ok(await p.ev(`!!document.querySelector(".adv-goal")`), "ゴールが出ない");
    await inside(`goal && (goal.x = h.x + 4, goal.y = h.y + 4)`);
    await p.send("Debugger.disable");
    await t.sleep(800);
    t.ok(await p.ev(`!adventure.isActive() && !npc.isAway()`), "クリアしても冒険が終わらない");
    t.ok((await p.text()).startsWith("ゴール"), "ゴールのセリフ");
    t.ok(await p.ev(`localStorage.getItem("warpix-adv-best") !== null`), "ベストタイムが保存されていない");
    t.ok(await p.ev(`achievements.has("adventure")`), "実績「ぼうけんの はじまり」がない");
    await t.sleep(4000);
    t.ok(await p.ev(`!!document.querySelector(".credits")`), "スタッフロールが流れない");
    await p.shot("adventure-credits.png");
    await p.ev(`document.querySelector(".credits")?.click()`);
    t.noErrors(p);
    await server.close();
  },
};
