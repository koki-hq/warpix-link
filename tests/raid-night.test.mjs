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
    channel: () => ch,
    from: () => ({ select: async () => ({ data: [], error: null }) }),
    rpc: async () => ({ data: 1 }),
  }) };`;
const NIGHT = Date.UTC(2026, 10, 1, 12); // 2026-11-01（日）21:00 日本時間
const MORNING = Date.UTC(2026, 10, 1, 1); // おなじ 日の 10:00 日本時間
const ORDINARY = Date.UTC(2026, 10, 8, 12); // 2 しゅうめの にちようび 21:00（ふつうの レイド）

async function open(t, at) {
  const server = await t.startServer();
  const b = await t.launchBrowser();
  const p = await b.firstPage();
  await p.send("Page.addScriptToEvaluateOnNewDocument", { source: FAKE(at) });
  await p.goto(server.url);
  await p.ev(`localStorage.clear()`);
  await p.goto(server.url + "?away=0");
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

  async "ふつうの にちようびの 21:00 は いつもの マザーシップ（HP 30・60 びょう）"(t) {
    const { server, p } = await open(t, ORDINARY - 3000);
    await p.boot();
    let hp = "";
    for (let i = 0; i < 20 && !hp.startsWith("HP 30"); i++) {
      await t.sleep(500);
      hp = await p.ev(`document.querySelector(".raid-hp")?.textContent ?? ""`);
    }
    t.eq(hp, "HP 30/30", "いつもの HP");
    t.ok(!(await p.ev(`document.querySelector(".raid").classList.contains("night")`)), "きんいろに なった");
    t.noErrors(p);
    await server.close();
  },
};
