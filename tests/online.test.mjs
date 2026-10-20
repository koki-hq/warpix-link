// オンライン：同じ空とレイド。本物の Supabase は使わず、にせものを差しこむ（世界の記録も増えない）
const FAKE_CONFIG = `Object.defineProperty(window, "WARPIX_ONLINE", { value: { url: "https://fake.supabase.co", key: "fake" }, writable: false });`;

// 1 ページだけで使う、手で合図を流せるにせもの。
// v1.52 から おなじ そらに つながるのは しゅうらいの よる だけ なので、時計は 2026-11-01 20:55（日本時間）から（いつでも かえられる）
const SOLO_FAKE = `${FAKE_CONFIG}
  const __realNow = Date.now.bind(Date);
  window.__clock = Date.UTC(2026, 10, 1, 11, 55) - __realNow();
  Date.now = () => __realNow() + window.__clock;
  window.__sent = []; window.__rpc = []; window.__presence = {};
  const handlers = {};
  const ch = {
    on(type, filter, cb) { (handlers[type + ":" + filter.event] ??= []).push(cb); return ch; },
    subscribe(cb) { setTimeout(() => cb("SUBSCRIBED"), 10); return ch; },
    track(p) { window.__tracked = p; window.__tracks = (window.__tracks ?? 0) + 1; return Promise.resolve(); },
    untrack() { window.__untracks = (window.__untracks ?? 0) + 1; },
    send(m) { window.__sent.push(m); return Promise.resolve(); },
    presenceState() { return window.__presence; },
  };
  window.__fire = (key, arg) => (handlers[key] ?? []).forEach((fn) => fn(arg));
  window.supabase = { createClient: () => ({
    channel: (name, opts) => { window.__me = opts.config.presence.key; return ch; },
    from: () => ({ select: async () => ({ data: [{ id: "pokes", value: 12345 }, { id: "warps", value: 678 }, { id: "ufos", value: 9 }], error: null }) }),
    rpc: async (name, args) => { window.__rpc.push([name, args]); return { data: 1 }; },
  }) };`;

// 同じブラウザの中のページどうしを BroadcastChannel でつなぐにせもの ＋ 時計を「しゅうらいの よる（2026-11-01 21:00）の 3 秒前」に する
// （v1.51 から ふだんの 10 ぷんごとの レイドは ない）
const LINKED_FAKE = `${FAKE_CONFIG}
  const realNow = Date.now.bind(Date);
  const target = Date.UTC(2026, 10, 1, 12) - 3000;
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

// 裏に まわる ふりと、音の そうちの みはり（つくった かず・おこした かず）
const HIDE_AND_AUDIO = `
  let hid = false;
  Object.defineProperty(document, "hidden", { get: () => hid, configurable: true });
  window.__hide = (v) => { hid = v; document.dispatchEvent(new Event("visibilitychange")); };
  window.__ctxs = [];
  const RealAC = window.AudioContext;
  window.AudioContext = class extends RealAC {
    constructor(...a) { super(...a); this.__resumes = 0; window.__ctxs.push(this); }
    resume() { this.__resumes++; return super.resume(); }
  };`;

export default {
  async "ふだんは おなじ そらに つながらない（だれも うかばない）。しゅうらいの よるの 10 ぷん まえから つながる"(t) {
    const server = await t.startServer();
    const b = await t.launchBrowser();
    const p = await b.firstPage();
    // 2 しゅうめの にちようびの ひる
    await p.send("Page.addScriptToEvaluateOnNewDocument", { source: SOLO_FAKE + `; window.__clock = Date.UTC(2026, 10, 8, 3) - __realNow();` });
    await p.goto(server.url);
    await p.boot();
    await t.sleep(1500);
    t.ok(await p.ev(`online.enabled && !online.isOpen()`), "ふだんなのに つながった");
    t.eq(await p.ev(`window.__me ?? null`), null, "ふだんなのに チャンネルを つくった");
    t.ok(await p.ev(`document.getElementById("online-count").hidden`), "ONLINE の 人数が でて いる");
    // せかいの きろく（かず だけ）は ふだんも かぞえる
    for (let i = 0; i < 2; i++) await p.ev(`document.getElementById("npc").click()`);
    await t.sleep(3500);
    t.eq(await p.ev(`window.__rpc`), [["bump", { counter: "pokes", n: 2 }]], "つついた かずを おくらない");
    // しゅうらいの よる（12/6 21:00）の 9 ふん まえ → つながる。おわったら はなれる
    await p.ev(`window.__clock = Date.UTC(2026, 11, 6, 11, 51) - __realNow()`);
    await t.sleep(1500);
    t.ok(await p.ev(`online.isOpen()`), "しゅうらいの よるの まえに つながらない");
    await p.ev(`window.__presence = { [window.__me]: [{ hat: null }], stranger: [{ hat: "party" }] }; __fire("presence:sync")`);
    await t.sleep(300);
    t.eq(await p.ev(`document.querySelectorAll(".ghost").length`), 1, "しゅうらいの よるに だれも うかばない");
    await p.ev(`window.__clock = Date.UTC(2026, 11, 6, 12, 4) - __realNow()`);
    await t.sleep(1500);
    t.ok(await p.ev(`!online.isOpen() && document.querySelectorAll(".ghost").length === 0 && document.getElementById("online-count").hidden`), "おわっても そらに のこった");
    t.noErrors(p);
    await server.close();
  },

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
    // 吹き出しは文字を打ちながら次の行へ進むので、出ているあいだを短い間隔で見る。
    // 「ほかにも だれかが みてる」の おはなし中なら、おわってから いう（v1.48.2）
    let noticed = false;
    for (let i = 0; i < 160 && !noticed; i++) {
      noticed = (await p.text()).includes("ふって くれた");
      if (!noticed) {
        if (i % 10 === 9) await p.ev(`document.getElementById("dialog").click()`); // おはなしを すすめる
        await t.sleep(100);
      }
    }
    t.ok(noticed, "振り返されたことに気づかない");
    for (let i = 0; i < 3; i++) await p.ev(`document.getElementById("npc").click()`);
    await t.sleep(3500);
    t.eq(await p.ev(`window.__rpc`), [["bump", { counter: "pokes", n: 3 }]], "つついた回数をまとめて送る");
    await p.ev(`room.open("trophy")`);
    await t.sleep(400);
    t.eq(await p.ev(`document.querySelector('[data-counter="pokes"]').textContent`), "12,345", "世界の記録");
    await p.ev(`window.__presence = { [window.__me]: [{ hat: null }] }; __fire("presence:sync")`);
    await t.sleep(600);
    t.eq(await p.ev(`document.querySelectorAll(".ghost").length`), 0, "帰った人のピクセが残っている");
    t.noErrors(p);
    await server.close();
  },

  async "てを ふるのは おなじ 人に 10 びょうに 1 かい。ふって もらっても おはなしに わりこまず、あとで まとめて いう"(t) {
    const server = await t.startServer();
    const b = await t.launchBrowser();
    const p = await b.firstPage();
    await p.send("Page.addScriptToEvaluateOnNewDocument", { source: SOLO_FAKE });
    await p.goto(server.url);
    await p.boot();
    await p.ev(`window.__presence = { [window.__me]: [{ hat: null }], stranger: [{ hat: "party" }] }; __fire("presence:sync")`);
    await t.sleep(300);
    const waves = () => p.ev(`window.__sent.filter((m) => m.event === "wave").length`);
    await p.ev(`document.querySelector(".ghost").click()`);
    const score = await p.ev(`document.querySelector("[data-score]").textContent`);
    for (let i = 0; i < 5; i++) await p.ev(`document.querySelector(".ghost").click()`);
    t.eq(await waves(), 1, "れんだで なんども 合図が とぶ");
    t.eq(await p.ev(`document.querySelector("[data-score]").textContent`), score, "れんだで スコアが ふえる");
    t.ok(await p.ev(`document.querySelector(".ghost").classList.contains("tired")`), "てが つかれた かおに ならない");
    await p.shot("ghost-tired.png");
    await t.sleep(1000);
    t.ok(await p.ev(`!document.querySelector(".ghost").classList.contains("tired")`), "つかれた かおが もどらない");

    // ピクセが おはなし中：わりこまない。ふるい ばんからの れんだは 1 かいに かぞえる
    await p.ev(`npc.say(["いま おはなし ちゅう だよ。", "まだ つづくよ。"])`);
    for (let i = 0; i < 4; i++) await p.ev(`__fire("broadcast:wave", { payload: { from: "stranger", to: window.__me } })`);
    await p.ev(`__fire("broadcast:wave", { payload: { from: "other", to: window.__me } })`);
    await t.sleep(300);
    t.ok(!(await p.text()).includes("てを"), "おはなしに わりこんだ");
    for (let i = 0; i < 6 && !(await p.ev(`npc.ready()`)); i++) {
      await p.ev(`document.getElementById("dialog").click()`);
      await t.sleep(600);
    }
    let told = "";
    for (let i = 0; i < 80 && !told.includes("2かい"); i++) {
      told = await p.text();
      await t.sleep(100);
    }
    t.ok(told.includes("さっき 2かい"), "あとで まとめて いわない");
    t.noErrors(p);
    await server.close();
  },

  async "見ていない画面は空から消え、裏では音を起こさない。もどると音の装置を作りなおす"(t) {
    const server = await t.startServer();
    const b = await t.launchBrowser();
    const p = await b.firstPage();
    await p.send("Page.addScriptToEvaluateOnNewDocument", { source: SOLO_FAKE + HIDE_AND_AUDIO });
    await p.goto(server.url);
    await p.boot();
    await t.sleep(300);
    t.eq(await p.ev(`window.__tracks`), 1, "つないだら そらに うかぶ");
    t.ok(await p.ev(`sound.playing()`), "BGM が なっていない（はじめの じょうたい）");
    await p.ev(`window.__presence = { [window.__me]: [{ hat: null }], stranger: [{ hat: null }] }; __fire("presence:sync")`);
    t.eq(await p.ev(`__ctxs.length`), 1, "音の そうちは 1 つ");

    // 裏に まわる → そらから きえる。てを ふられても 音は おきない
    await p.ev(`__hide(true)`);
    t.eq(await p.ev(`window.__untracks ?? 0`), 1, "裏に まわっても そらに のこる");
    await t.sleep(200);
    const resumes = await p.ev(`__ctxs[0].__resumes`);
    await p.ev(`__fire("broadcast:wave", { payload: { from: "stranger", to: window.__me } })`);
    await p.ev(`sound.sfx.coin(); sound.bgmPlay()`);
    await t.sleep(300);
    t.eq(await p.ev(`[__ctxs.length, __ctxs[0].__resumes, __ctxs[0].state]`), [1, resumes, "suspended"], "裏に いるのに 音が おきた");
    await p.ev(`emit("hat", { id: "party" })`);
    t.eq(await p.ev(`window.__tracks`), 1, "裏に いるのに ぼうしを かえたら そらに もどった");

    // もどる → そらに もどる（ぼうしも あたらしく）。音の そうちは つくりなおして、BGM は つづく
    await p.ev(`__hide(false)`);
    await t.sleep(300);
    t.eq(await p.ev(`[window.__tracks, window.__tracked.hat]`), [2, "party"], "もどっても そらに もどらない");
    t.eq(await p.ev(`[__ctxs.length, __ctxs[0].state]`), [2, "closed"], "もどっても 音の そうちを つくりなおさない");
    t.ok(await p.ev(`sound.playing() && __ctxs[1].state !== "closed"`), "つくりなおしたら BGM が とまった");
    await p.ev(`sound.sfx.coin()`);
    t.eq(await p.ev(`__ctxs.length`), 2, "チャリンで また 音の そうちが ふえた");
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
    // 時計は「しゅうらいの よるの 3 秒前」から始まっている。レイドが始まって HP がそろうまで待つ
    let ready = false;
    let hp = "";
    for (let k = 0; k < 20 && !ready; k++) {
      await t.sleep(500);
      hp = await inFrame(0, `document.querySelector(".raid-hp")?.textContent ?? ""`);
      ready = /^HP \d+\/\d+$/.test(hp) && hp === (await inFrame(1, `document.querySelector(".raid-hp")?.textContent ?? ""`));
    }
    t.ok(ready, `ふたりの画面に おなじ HP の マザーシップが出ない: ${hp}`);
    const max = Number(hp.split("/")[1]);
    t.ok(max === 90 || max === 180, `HP が ひとり 90 で ない: ${max}`);
    await p.shot("online-raid-pair.png");
    for (let i = 0; i < 5; i++) { await inFrame(0, `document.querySelector(".raid-ship").click()`); await t.sleep(40); }
    await t.sleep(800);
    t.eq(await inFrame(1, `document.querySelector(".raid-hp").textContent`), `HP ${max - 5}/${max}`, "相手の攻撃が届かない");
    for (let i = 0; i < max + 20; i++) {
      const left = await inFrame(1, `(() => { const s = document.querySelector(".raid:not(.down) .raid-ship"); if (!s) return -1; s.click(); return 1; })()`);
      if (left < 0) break;
      await t.sleep(30);
    }
    await t.sleep(1500);
    for (const i of [0, 1]) {
      t.ok(await inFrame(i, `achievements.has("raid")`), `${i + 1} 人目に実績「きょうの ヒーローたち」がない`);
      t.ok(await inFrame(i, `!raid.active()`), `${i + 1} 人目のレイドが終わらない`);
    }
    t.ok(await inFrame(0, `grow.state.diary.some((d) => d.text.includes("マザーシップ"))`), "日記に書かれない");
    t.noErrors(p);
    await server.close();
  },
};

function innerHeightGuess() {
  return 1000; // launchBrowser の既定の高さ
}
