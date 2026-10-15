// オンライン：同じ空とレイド。本物の Supabase は使わず、にせものを差しこむ（世界の記録も増えない）
const FAKE_CONFIG = `Object.defineProperty(window, "WARPIX_ONLINE", { value: { url: "https://fake.supabase.co", key: "fake" }, writable: false });`;

// 1 ページだけで使う、手で合図を流せるにせもの
const SOLO_FAKE = `${FAKE_CONFIG}
  window.__sent = []; window.__rpc = []; window.__presence = {};
  const handlers = {};
  const ch = {
    on(type, filter, cb) { (handlers[type + ":" + filter.event] ??= []).push(cb); return ch; },
    subscribe(cb) { setTimeout(() => cb("SUBSCRIBED"), 10); return ch; },
    track(p) { window.__tracked = p; return Promise.resolve(); },
    untrack() {},
    send(m) { window.__sent.push(m); return Promise.resolve(); },
    presenceState() { return window.__presence; },
  };
  window.__fire = (key, arg) => (handlers[key] ?? []).forEach((fn) => fn(arg));
  window.supabase = { createClient: () => ({
    channel: (name, opts) => { window.__me = opts.config.presence.key; return ch; },
    from: () => ({ select: async () => ({ data: [{ id: "pokes", value: 12345 }, { id: "warps", value: 678 }, { id: "ufos", value: 9 }], error: null }) }),
    rpc: async (name, args) => { window.__rpc.push([name, args]); return { data: 1 }; },
  }) };`;

// 同じブラウザの中のページどうしを BroadcastChannel でつなぐにせもの ＋ 時計を「次の 5 分の 3 秒前」に進める
const LINKED_FAKE = `${FAKE_CONFIG}
  const realNow = Date.now.bind(Date);
  const P = 5 * 60 * 1000;
  const target = Math.ceil((realNow() + 4000) / P) * P - 3000;
  const offset = target - realNow();
  Date.now = () => realNow() + offset;
  const bc = new BroadcastChannel("fake-sky");
  window.supabase = { createClient: () => ({
    channel: (name, opts) => {
      const handlers = {};
      const ch = {
        on(type, filter, cb) { (handlers[type + ":" + filter.event] ??= []).push(cb); return ch; },
        subscribe(cb) { setTimeout(() => cb("SUBSCRIBED"), 10); return ch; },
        track() { return Promise.resolve(); },
        untrack() {},
        send(m) { bc.postMessage(m); return Promise.resolve(); },
        presenceState() { return {}; },
      };
      bc.onmessage = (e) => (handlers["broadcast:" + e.data.event] ?? []).forEach((fn) => fn({ payload: e.data.payload }));
      return ch;
    },
    from: () => ({ select: async () => ({ data: [], error: null }) }),
    rpc: async () => ({ data: 1 }),
  }) };`;

export default {
  async "ほかの人が来ると空に浮かび、手を振り合える"(t) {
    const server = await t.startServer();
    const b = await t.launchBrowser();
    const p = await b.firstPage();
    await p.send("Page.addScriptToEvaluateOnNewDocument", { source: SOLO_FAKE });
    await p.goto(server.url);
    await p.boot();
    t.ok(await p.ev(`online.enabled`), "オンライン機能が動いていない");
    await p.ev(`window.__presence = { [window.__me]: [{ hat: null }], stranger: [{ hat: "party" }] }; __fire("presence:sync")`);
    await t.sleep(300);
    t.eq(await p.ev(`document.querySelector("#online-count b").textContent`), "2", "ONLINE の人数");
    t.eq(await p.ev(`document.querySelectorAll(".ghost").length`), 1, "浮かぶピクセの数");
    const box = await p.ev(`(() => { const r = document.querySelector(".ghost").getBoundingClientRect(); return { t: r.top, b: r.bottom, l: r.left, r: r.right }; })()`);
    t.ok(box.t >= 0 && box.b <= innerHeightGuess(), `浮かぶピクセが画面の外: ${JSON.stringify(box)}`);
    await p.ev(`document.querySelector(".ghost").click()`);
    t.eq(await p.ev(`window.__sent.filter((m) => m.event === "wave").map((m) => m.payload.to)`), ["stranger"], "手を振る合図");
    await p.ev(`__fire("broadcast:wave", { payload: { from: "stranger", to: window.__me } })`);
    // 吹き出しは文字を打ちながら次の行へ進むので、出ているあいだを短い間隔で見る
    let noticed = false;
    for (let i = 0; i < 40 && !noticed; i++) {
      noticed = (await p.text()).includes("てを");
      if (!noticed) await t.sleep(100);
    }
    t.ok(noticed, "振り返されたことに気づかない");
    for (let i = 0; i < 3; i++) await p.ev(`document.getElementById("npc").click()`);
    await t.sleep(3500);
    t.eq(await p.ev(`window.__rpc`), [["bump", { counter: "pokes", n: 3 }]], "つついた回数をまとめて送る");
    await p.ev(`document.getElementById("trophy-btn").click()`);
    await t.sleep(400);
    t.eq(await p.ev(`document.querySelector('[data-counter="pokes"]').textContent`), "12,345", "世界の記録");
    await p.ev(`window.__presence = { [window.__me]: [{ hat: null }] }; __fire("presence:sync")`);
    await t.sleep(600);
    t.eq(await p.ev(`document.querySelectorAll(".ghost").length`), 0, "帰った人のピクセが残っている");
    t.noErrors(p);
    await server.close();
  },

  async "みんなでマザーシップ：ふたりで同じ HP を削って倒す"(t) {
    const server = await t.startServer();
    // 同じブラウザのページを 2 つ横にならべる（どちらも「見えている」状態にするため、iframe で）
    const b = await t.launchBrowser({ width: 1000, height: 900 });
    const p = await b.firstPage();
    await p.send("Page.addScriptToEvaluateOnNewDocument", { source: LINKED_FAKE });
    await p.goto(`${server.url}tests/fixtures/pair.html`, 2500);
    const inFrame = (i, expr) => p.ev(`document.querySelectorAll("iframe")[${i}].contentWindow.eval(${JSON.stringify(expr)})`);
    for (const i of [0, 1]) await inFrame(i, `document.getElementById("start-btn").click()`);
    // 時計は「次の 5 分の 3 秒前」から始まっている。レイドが始まって HP がそろうまで待つ
    let ready = false;
    for (let k = 0; k < 20 && !ready; k++) {
      await t.sleep(500);
      ready = (await inFrame(0, `document.querySelector(".raid-hp")?.textContent ?? ""`)).startsWith("HP 30") &&
        (await inFrame(1, `document.querySelector(".raid-hp")?.textContent ?? ""`)).startsWith("HP 30");
    }
    t.ok(ready, "ふたりの画面に HP 30 のマザーシップが出ない");
    await p.shot("online-raid-pair.png");
    for (let i = 0; i < 5; i++) { await inFrame(0, `document.querySelector(".raid-ship").click()`); await t.sleep(40); }
    await t.sleep(800);
    t.eq(await inFrame(1, `document.querySelector(".raid-hp").textContent`), "HP 25/30", "相手の攻撃が届かない");
    for (let i = 0; i < 40; i++) {
      const left = await inFrame(1, `(() => { const s = document.querySelector(".raid:not(.down) .raid-ship"); if (!s) return -1; s.click(); return 1; })()`);
      if (left < 0) break;
      await t.sleep(30);
    }
    await t.sleep(1500);
    for (const i of [0, 1]) {
      t.ok(await inFrame(i, `achievements.has("raid")`), `${i + 1} 人目に実績「きょうの ヒーローたち」がない`);
      t.ok(await inFrame(i, `!raid.active()`), `${i + 1} 人目のレイドが終わらない`);
    }
    t.ok((await inFrame(0, `grow.state.diary.at(-1)?.text ?? ""`)).includes("みんなで マザーシップ"), "日記に書かれない");
    t.noErrors(p);
    await server.close();
  },
};

function innerHeightGuess() {
  return 1000; // launchBrowser の既定の高さ
}
