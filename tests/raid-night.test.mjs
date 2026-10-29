// しゅうらいの よる（v1.40）：まいつき さいしょの にちようびの 21:00（日本時間）は きんいろの だい マザーシップ
// 本物の Supabase は つかわず、にせものを さしこむ（online.test.mjs と おなじ）。時計は Date.now を ずらす
const FAKE = (at) => `
  Object.defineProperty(window, "WARPIX_ONLINE", { value: { url: "https://fake.supabase.co", key: "fake" }, writable: false });
  const realNow = Date.now.bind(Date);
  const offset = ${at} - realNow();
  Date.now = () => realNow() + offset;
  window.__sent = [];
  const handlers = {};
  const ch = {
    on(type, filter, cb) { (handlers[type + ":" + filter.event] ??= []).push(cb); return ch; },
    subscribe(cb) { setTimeout(() => cb("SUBSCRIBED"), 10); return ch; },
    track() { return Promise.resolve(); },
    untrack() {},
    send(m) { window.__sent.push(m); return Promise.resolve(); },
    presenceState() { return {}; },
  };
  window.supabase = { createClient: () => ({
    channel: (name) => ((window.__channel = name), ch),
    from: () => ({ select: async () => ({ data: [], error: null }) }),
    rpc: async () => ((window.__rpc = (window.__rpc ?? 0) + 1), { data: 1 }),
  }) };`;
const NIGHT = Date.UTC(2026, 10, 1, 12); // 2026-11-01（日）21:00 日本時間
const MORNING = Date.UTC(2026, 10, 1, 1); // おなじ 日の 10:00 日本時間
const ORDINARY = Date.UTC(2026, 10, 8, 12); // 2 しゅうめの にちようび 21:00（ふつうの レイド）

async function open(t, at, url = "?away=0") {
  const server = await t.startServer();
  const b = await t.launchBrowser();
  const p = await b.firstPage();
  await p.send("Page.addScriptToEvaluateOnNewDocument", { source: FAKE(at) });
  await p.goto(server.url);
  await p.ev(`localStorage.clear()`);
  await p.goto(server.url + url);
  return { server, p };
}

export default {
  async "つぎの しゅうらいの よるの 時刻（まいつき さいしょの にちようび 21:00）"(t) {
    const { server, p } = await open(t, Date.UTC(2026, 9, 18, 3));
    t.eq(await p.ev(`new Date(raid.nextNight()).toISOString()`), "2026-11-01T12:00:00.000Z", "11 がつ");
    t.eq(await p.ev(`new Date(raid.nextNight(${Date.UTC(2026, 10, 1, 13)})).toISOString()`), "2026-12-06T12:00:00.000Z", "おわった あとは らいげつ");
    t.ok(await p.ev(`raid.isNight(${NIGHT / 600000})`), "21:00 の わくが しゅうらいの よるに ならない");
    t.ok(!(await p.ev(`raid.isNight(${ORDINARY / 600000})`)), "2 しゅうめの にちようびまで しゅうらいの よるに なった");
    t.ok(!(await p.ev(`raid.isNight(${NIGHT / 600000 + 1})`)), "21:10 まで しゅうらいの よるに なった");
    t.noErrors(p);
    await server.close();
  },

  async "その 日は ひらくと ピクセが 予告する（1 日 1 かい）"(t) {
    const { server, p } = await open(t, MORNING);
    await p.boot({ readIntro: false });
    const lines = await p.readIntro();
    t.ok(lines.some((l) => l.includes("こんや 21じ")), `予告しない: ${JSON.stringify(lines)}`);
    await p.goto(server.url + "?away=0");
    await p.boot({ readIntro: false });
    const again = await p.readIntro();
    t.ok(!again.some((l) => l.includes("こんや 21じ")), "2 かいめも 予告した");
    t.noErrors(p);
    await server.close();
  },

  async "21:00 に きんいろの だい マザーシップ：HP 3 ばい、たおすと 実績「しゅうらいの よる」"(t) {
    const { server, p } = await open(t, NIGHT - 3000);
    await p.boot();
    let hp = "";
    for (let i = 0; i < 20 && !hp.startsWith("HP 90"); i++) {
      await t.sleep(500);
      hp = await p.ev(`document.querySelector(".raid-hp")?.textContent ?? ""`);
    }
    t.eq(hp, "HP 90/90", "HP が 3 ばいに ならない");
    t.ok(await p.ev(`document.querySelector(".raid").classList.contains("night")`), "きんいろに ならない");
    t.ok((await p.ev(`document.querySelector(".raid-title").textContent`)).includes("しゅうらいの よる"), "なまえ");
    t.ok((await p.ev(`document.querySelector(".raid-time").textContent`)).match(/のこり 1[67]\dびょう/), `3 ぷんに ならない: ${await p.ev(`document.querySelector(".raid-time").textContent`)}`);
    for (let i = 0; i < 90; i++) await p.ev(`document.querySelector(".raid:not(.down) .raid-ship")?.click()`);
    await t.sleep(500);
    t.ok(await p.ev(`achievements.has("raid-night") && achievements.has("raid")`), "実績");
    t.ok(await p.ev(`grow.state.diary.some((e) => e.type === "raid-night")`), "にっき");
    t.noErrors(p);
    await server.close();
  },

  async "ふつうの 日は マザーシップが こない（v1.51 で 10 ぷんごとの レイドを やめた）。WORLD RECORD は つぎの しゅうらいの よるの 日"(t) {
    const { server, p } = await open(t, ORDINARY - 3000);
    await p.boot();
    await t.sleep(6000);
    t.ok(!(await p.ev(`Boolean(document.querySelector(".raid"))`)), "ふつうの 日に マザーシップが きた");
    t.ok(!(await p.text()).includes("なにか くる"), "ふつうの 日に 予告した");
    t.eq(await p.ev(`document.getElementById("raid-next").textContent`), "12/6 21:00", "つぎの しゅうらいの よる");
    t.noErrors(p);
    await server.close();
  },

  async "リハーサル（?raid=rehearsal）：べつの そらで すぐ だい マザーシップ。せかいの きろくも ごほうびも ふやさない（v1.66）"(t) {
    // ふつうの ひの ひる。4 ぷんの わくの はじめ
    const at = Math.floor(Date.UTC(2026, 10, 4, 3) / 240000) * 240000 + 2000;
    const { server, p } = await open(t, at, "?away=0&raid=rehearsal");
    await p.boot({ readIntro: false });
    const lines = await p.readIntro();
    t.ok(lines.some((l) => l.includes("リハーサルの そら")), `リハーサルと いわない: ${JSON.stringify(lines)}`);
    let hp = "";
    for (let i = 0; i < 20 && !hp.startsWith("HP 90"); i++) {
      await t.sleep(500);
      hp = await p.ev(`document.querySelector(".raid-hp")?.textContent ?? ""`);
    }
    t.eq(hp, "HP 90/90", "マザーシップが こない");
    t.eq(await p.ev(`window.__channel`), "warpix-sky-rehearsal", "本番の そらに つないだ");
    t.ok((await p.ev(`document.querySelector(".raid-title").textContent`)).includes("リハーサル"), "なまえ");
    await p.ev(`emit("ufo-down", {})`);
    for (let i = 0; i < 90; i++) await p.ev(`document.querySelector(".raid:not(.down) .raid-ship")?.click()`);
    await t.sleep(3500);
    t.ok(!(await p.ev(`achievements.has("raid-night") || achievements.has("raid")`)), "リハーサルで 実績が ついた");
    t.ok(!(await p.ev(`grow.state.diary.some((e) => e.type === "raid-night")`)), "リハーサルが にっきに のった");
    t.ok(!(await p.ev(`window.__rpc`)), "せかいの きろくを ふやした");
    t.noErrors(p);
    await server.close();
  },
};
