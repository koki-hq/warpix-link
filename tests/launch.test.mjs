// 開店の 日の リハーサル（2026-11-01）：朝 7 時の「開店しました」から、21 時の しゅうらいの よる、せいざ、きねんしゃしん まで
// ホームページの tools/open-news.json と おなじ おしらせを、本物の かわりに わたす。オンラインは にせもの、時計は ずらす
import { readFileSync } from "node:fs";

const OPEN_NEWS = {
  id: "2026-11-01-open",
  date: "2026-11-01",
  title: "WARPIX製作所、開店しました",
  body: "warpix-link と ホームページを、あたらしい 住所 warpix.app で 公開しました。X と Instagram も はじめたよ（@warpix_app）。",
  url: "https://warpix.app/",
};
const NEWS = { news: [OPEN_NEWS, { id: "2026-10-18-warp", date: "2026-10-18", title: "ワープが もっと たのしく" }] };
const NIGHT = Date.UTC(2026, 10, 1, 12); // 21:00 日本時間
const FAKE = (at, others) => `
  window.WARPIX_NEWS = "data:application/json,${encodeURIComponent(JSON.stringify(NEWS))}";
  Object.defineProperty(window, "WARPIX_ONLINE", { value: { url: "https://fake.supabase.co", key: "fake" }, writable: false });
  const realNow = Date.now.bind(Date);
  const offset = ${at} - realNow();
  Date.now = () => realNow() + offset;
  window.__presence = {};
  const handlers = {};
  const ch = {
    on(type, filter, cb) { (handlers[type + ":" + filter.event] ??= []).push(cb); return ch; },
    subscribe(cb) { setTimeout(() => { cb("SUBSCRIBED"); window.__presence = { [window.__me]: [{ hat: null }], ${others} }; (handlers["presence:sync"] ?? []).forEach((fn) => fn()); }, 10); return ch; },
    track() { return Promise.resolve(); },
    untrack() {},
    send() { return Promise.resolve(); },
    presenceState() { return window.__presence; },
  };
  window.__fire = (key, arg) => (handlers[key] ?? []).forEach((fn) => fn(arg));
  window.supabase = { createClient: () => ({
    channel: (name, opts) => { window.__me = opts.config.presence.key; return ch; },
    from: () => ({ select: async () => ({ data: [], error: null }) }),
    rpc: async () => ({ data: 1 }),
  }) };`;

async function open(t, { born, at, query, others = "" }) {
  const server = await t.startServer();
  const b = await t.launchBrowser();
  const p = await b.firstPage();
  await p.send("Page.addScriptToEvaluateOnNewDocument", { source: FAKE(at, others) });
  await p.goto(server.url);
  await p.ev(`localStorage.clear(); localStorage.setItem("warpix-pixe", JSON.stringify({ born: "${born}", days: ["${born}"], last: "${born}", stage: 0, sulk: false, pokeMark: 0, diary: [] }))`);
  await p.goto(server.url + "?away=0&" + query);
  return { server, p };
}
// ピクセの セリフを、ひまに なるまで ぜんぶ よむ（えらぶ ボタンが でたら とまる）
async function listen(p, t, ms) {
  const lines = [];
  for (const end = Date.now() + ms; Date.now() < end; ) {
    const s = await p.text();
    if (s && !lines.includes(s)) lines.push(s);
    if (!(await p.ev(`Boolean(document.querySelector(".dialog-choices"))`))) await p.ev(`document.getElementById("dialog").click()`);
    await t.sleep(250);
  }
  return lines.filter((l) => !lines.some((o) => o !== l && o.startsWith(l)));
}

export default {
  async "開店の 朝：1きせいには てがみと こんやの 予告、そして「開店しました」の おしらせ"(t) {
    const { server, p } = await open(t, { born: "2026-10-12", at: Date.UTC(2026, 9, 31, 23), query: "date=2026-11-01&hour=8" });
    await p.ev(`document.getElementById("start-btn").click()`);
    await t.sleep(2600);
    const lines = await listen(p, t, 14000);
    const all = lines.join(" / ");
    t.ok(all.includes("とくべつな"), `ひらく ひの てがみの しらせが ない: ${all}`);
    t.ok(all.includes("こんや 21じ"), `しゅうらいの よるの 予告が ない: ${all}`);
    // 開店の おしらせは ピクセが いうのでは なく、みぎうえの ふうとうに とどく（v1.59）
    t.ok(await p.ev(`mail.unread().some((m) => m.id === "2026-11-01-open")`), "開店の おしらせが ふうとうに ない");
    t.ok(await p.ev(`letter.letters().some((l) => l.kind === "opening" && l.lines.join("").includes("おみせを ひらく ひ"))`), "てがみが 開店の 日の ことばに ならない");
    t.ok(await p.ev(`document.getElementById("mail-btn").classList.contains("has-new")`), "ふうとうが ひからない");
    t.noErrors(p);
    await server.close();
  },

  async "開店の 夜（SNS から はじめて 来た 人）：予告 → 21:00 の だい マザーシップ → せいざ → きねんしゃしん"(t) {
    const others = `a: [{ hat: "crown" }], b: [{ hat: "party" }]`;
    const { server, p } = await open(t, { born: "2026-11-01", at: NIGHT - 25000, query: "date=2026-11-01&hour=20", others });
    await p.ev(`document.getElementById("start-btn").click()`);
    await t.sleep(2600);
    const before = (await listen(p, t, 9000)).join(" / ");
    t.ok(!(await p.ev(`ticket.has()`)) && !before.includes("1きせい") && !before.includes("とくべつな"), `あたらしい 人に 1きせいの もの: ${before}`);
    t.ok(before.includes("こんや 21じ"), `予告が ない: ${before}`);
    // 21:00 まで まつ
    let hp = "";
    for (let i = 0; i < 80 && !hp.startsWith("HP 270"); i++) {
      await t.sleep(250);
      hp = await p.ev(`document.querySelector(".raid.night .raid-hp")?.textContent ?? ""`);
    }
    t.eq(hp, "HP 270/270", "3 にんぶんの だい マザーシップが こない");
    // みんなで うつ
    for (let i = 0; i < 300; i++) {
      const left = await p.ev(`(() => { const s = document.querySelector(".raid:not(.down) .raid-ship"); if (!s) return -1; s.click(); return 1; })()`);
      if (left < 0) break;
      if (i % 3 === 0) await p.ev(`__fire("broadcast:raid-hit", { payload: { slot: Math.floor(Date.now() / 600000), n: 12, from: "a" } })`);
    }
    t.ok(await p.ev(`achievements.has("raid-night")`), "たおせない");
    const after = (await listen(p, t, 9000)).join(" / ");
    t.ok(after.includes("3にんで のりきった"), `たおした あとの ことば（3 にんで）: ${after}`);
    t.ok(await p.ev(`grow.state.diary.some((e) => e.type === "seiza" && e.text.includes("3この ほし"))`), "3 この ほしの せいざが できない");
    t.ok(await p.ev(`Boolean(document.querySelector(".seiza"))`) || after.includes("きねんしゃしん"), "せいざが でない");
    t.ok(after.includes("きねんしゃしん"), `きねんしゃしんに さそわない: ${after}`);
    await p.ev(`document.querySelector(".dialog-choices button")?.click()`);
    await t.sleep(1500);
    t.eq(await p.ev(`document.querySelector(".postcard")?.getAttribute("aria-label")`), "しゅうらいの よるの きねんしゃしん", "しゃしんが でない");
    t.noErrors(p);
    await server.close();
  },

  async "開店の おしらせの 文字は ぜんぶ ドットの もじに ある"(t) {
    const have = new Set([...readFileSync(new URL("../fonts/chars.txt", import.meta.url), "utf8")]);
    const missing = [...new Set(OPEN_NEWS.title)].filter((ch) => !have.has(ch));
    t.eq(missing.join(""), "", "おしらせの 題に ドットの もじが ない 文字");
  },
};
