// ピクセの てがみ（v1.33）：にちようの よるに、その しゅうの ことを かいた てがみが とどく
// 2026-10-18 は にちようび。?date= で のぞく（のぞいている ときは のこさない）
const DAYS = [
  { date: "2026-10-13", warps: { spotify: 4, youtube: 1 }, pokes: 3, ufos: 0, ach: ["A"] },
  { date: "2026-10-15", warps: { spotify: 2, studyplus: 5 }, pokes: 1, ufos: 1, ach: [] },
  { date: "2026-10-05", warps: { tiktok: 50 }, pokes: 0, ufos: 0, ach: [] }, // せんしゅうより まえ（かぞえない）
];
const PIXE = { born: "2026-10-01", days: ["2026-10-13", "2026-10-15", "2026-10-17", "2026-10-18"], last: "2026-10-17", stage: 2, sulk: false, pokeMark: 0, diary: [] };

async function open(t, query, { days = DAYS } = {}) {
  const server = await t.startServer();
  const b = await t.launchBrowser();
  const p = await b.firstPage();
  await p.goto(server.url);
  await p.ev(`localStorage.clear(); localStorage.setItem("warpix-days", ${JSON.stringify(JSON.stringify(days))}); localStorage.setItem("warpix-pixe", ${JSON.stringify(JSON.stringify(PIXE))})`);
  await p.goto(server.url + query);
  await p.boot();
  await p.ev(`room.open("letters")`);
  await t.sleep(300);
  return { server, p };
}

export default {
  async "にちようの よる：ポストに てがみが とどき、ひらくと その しゅうの こと"(t) {
    const { server, p } = await open(t, "?date=2026-10-18&hour=21");
    t.ok(await p.ev(`!!document.querySelector("#letters-body .letters .letter-btn.unread")`), "ポストの ページに NEW の てがみが ない");
    await p.ev(`document.querySelector(".letter-btn").click()`);
    await t.sleep(200);
    t.ok(await p.ev(`document.getElementById("letter").open`), "てがみが ひらかない");
    const lines = await p.ev(`[...document.querySelectorAll("#letter-body p")].map((e) => e.textContent)`);
    t.eq(lines.slice(0, 4), ["10/12 〜 10/18", "きみへ", "こんしゅうは 4にち あえたね。", "ワープは ぜんぶで 12かい、ぼくが つつかれたのは 4かい。"], "てがみの なかみ（いきさきの なまえは かかない、v1.52.1）");
    t.ok(/^じっせきを \d+こ とったね。その ちょうし！$/.test(lines[4]), `じっせきの ぎょう: ${lines[4]}`);
    t.eq(lines.slice(5), ["らいしゅうも いっしょに ワープしようね。", "ピクセより"], "おわり");
    t.ok(await p.ev(`achievements.has("letter")`), "実績「ピクセからの てがみ」");
    t.ok(await p.ev(`!document.querySelector(".letter-btn.unread")`), "よんだのに NEW");
    t.eq(await p.ev(`localStorage.getItem("warpix-letters")`), null, "のぞいているのに のこした");
    t.noErrors(p);
    await server.close();
  },

  async "にちようの ひる・どようの よるは とどかない"(t) {
    for (const q of ["?date=2026-10-18&hour=12", "?date=2026-10-17&hour=21"]) {
      const { server, p } = await open(t, q);
      t.ok(await p.ev(`!document.querySelector(".letters")`), `とどいた: ${q}`);
      t.noErrors(p);
      await server.close();
    }
  },

  async "どこにも いかなかった しゅうの てがみ"(t) {
    const { server, p } = await open(t, "?date=2026-10-25&hour=22", { days: [] });
    await p.ev(`tonight.tally().warps = {}; tonight.tally().pokes = 0; tonight.tally().ach = []`);
    t.eq(await p.ev(`letter.write().lines.slice(2, 4)`), ["こんしゅうは どこにも ワープ しなかったね。", "ふたりで のんびり ほしを みた しゅうだった。"], "のんびりの しゅう");
    t.noErrors(p);
    await server.close();
  },

  async "ひづけが かわると、まえの ひの かずを warpix-days に のこす（14 にちぶん）"(t) {
    const server = await t.startServer();
    const b = await t.launchBrowser();
    const p = await b.firstPage();
    await p.goto(server.url);
    const many = Array.from({ length: 14 }, (_, i) => ({ date: `2000-01-${String(i + 1).padStart(2, "0")}`, warps: {}, pokes: 0, ufos: 0, ach: [] }));
    await p.ev(`localStorage.clear(); localStorage.setItem("warpix-days", ${JSON.stringify(JSON.stringify(many))}); localStorage.setItem("warpix-today", JSON.stringify({ date: "2000-02-01", warps: { booth: 2 }, pokes: 1, ufos: 0, ach: [] }))`);
    await p.goto(server.url);
    const days = await p.ev(`JSON.parse(localStorage.getItem("warpix-days"))`);
    t.eq(days.length, 14, "14 にちぶんで ない");
    t.eq([days[0].date, days.at(-1).date, days.at(-1).warps.booth], ["2000-01-02", "2000-02-01", 2], "いちばん ふるい ひを けして、きのうを のこす");
    t.ok(await p.ev(`tonight.history().at(-1).date === tonight.ymd`), "history の さいごが きょう で ない");
    t.noErrors(p);
    await server.close();
  },
};
