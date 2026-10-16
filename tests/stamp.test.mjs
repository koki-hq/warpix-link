// ピクセの スタンプカード：ノートの「スタンプ」タブに、あえた ひの スタンプ
const DAYS = ["2026-08-20", "2026-10-08", "2026-10-09", "2026-10-10", "2026-10-11", "2026-10-12", "2026-10-13", "2026-10-14", "2026-10-15"];
const DIARY = [
  ["2026-10-09", "adventure"], ["2026-10-10", "rank"], ["2026-10-12", "ufo"], ["2026-10-13", "song"],
  ["2026-10-14", "boss"], ["2026-10-15", "boss"], ["2026-10-15", "rusuban"],
].map(([date, type]) => ({ date, type, text: type }));
const STATE = { born: "2026-08-20", days: DAYS, last: "2026-10-15", stage: 2, sulk: false, pokeMark: 0, diary: DIARY };

export default {
  async "あえた ひに スタンプ。できごとで しゅるいが かわり、れんぞくも かぞえる"(t) {
    const server = await t.startServer();
    const b = await t.launchBrowser();
    const p = await b.firstPage();
    await p.goto(server.url + "?away=0");
    await p.ev(`localStorage.clear(); localStorage.setItem("warpix-pixe", ${JSON.stringify(JSON.stringify(STATE))})`);
    // ?date= で 2026-10-16（金）に きめて見る（記録は かわらない）
    await p.goto(server.url + "?date=2026-10-16");
    await p.boot();
    await p.click("#diary-btn");
    await t.sleep(300);
    await p.ev(`document.getElementById("tab-stamp").click()`);
    await t.sleep(200);
    const vis = await p.ev(`["diary-body", "zukan-body", "stamp-body"].map((id) => !document.getElementById(id).hidden)`);
    t.eq(vis, [false, false, true], "スタンプの ページだけ 見える");
    t.eq(await p.ev(`document.getElementById("tab-stamp").getAttribute("aria-selected")`), "true", "タブが えらばれていない");
    t.eq(await p.ev(`document.querySelector(".stamp-title").textContent`), "2026ねん 10がつ", "さいしょは きょうの つき");
    t.eq(await p.ev(`document.querySelectorAll(".stamp-cal td.blank").length`), 4, "10/1（木）の まえの あき（31 で ちょうど 5 しゅう）");
    t.eq(await p.ev(`document.querySelectorAll(".stamp-cal td.visited").length`), 9, "10がつの スタンプの かず");
    const kinds = await p.ev(`["2026-10-08", "2026-10-09", "2026-10-10", "2026-10-12", "2026-10-13", "2026-10-14", "2026-10-15", "2026-10-16", "2026-10-07"].map(stamp.stampOf)`);
    t.eq(kinds, ["face", "flag", "crown", "ufo", "note", "star", "gift", "face", null], "スタンプの しゅるい（おみやげ > ボス）");
    t.ok(await p.ev(`document.querySelector('td[aria-current="date"]')?.textContent.includes("16")`), "きょうに しるしが ない");
    t.ok(await p.ev(`document.querySelector('td[aria-current="date"] .sr-only')?.textContent === "あえた ひ"`), "読み上げで スタンプが わからない");
    t.eq(await p.ev(`stamp.streaks()`), { now: 9, best: 9 }, "れんぞく");
    t.ok((await p.ev(`document.querySelector(".stamp-sum").textContent`)).replace(/\s+/g, "").includes("いまのれんぞく9にち"), "れんぞくの 表示");
    t.ok(await p.ev(`achievements.has("streak7")`), "実績「まいにち スタンプ」がない");
    await p.shot("stamp.png");
    // まえの つきへ：9がつ（0）→ 8がつ（1、ここで おわり）→ もどる
    const nav = (d) => p.ev(`document.querySelector('.stamp-nav[data-d="${d}"]').click()`);
    await nav(-1);
    t.eq(await p.ev(`[document.querySelector(".stamp-title").textContent, document.querySelectorAll(".stamp-cal td.visited").length]`), ["2026ねん 9がつ", 0], "9がつ");
    await nav(-1);
    t.eq(await p.ev(`[document.querySelector(".stamp-title").textContent, document.querySelectorAll(".stamp-cal td.visited").length, document.querySelector('.stamp-nav[data-d="-1"]').disabled]`), ["2026ねん 8がつ", 1, true], "8がつで おわり");
    t.ok(await p.ev(`document.activeElement.matches('.stamp-nav[data-d="1"]')`), "はしで フォーカスが きえた");
    await nav(1);
    await nav(1);
    t.ok(await p.ev(`document.querySelector('.stamp-nav[data-d="1"]').disabled`), "みらいの つきへ いける");
    // ?date= なので 記録は かわらない
    t.eq(await p.ev(`JSON.parse(localStorage.getItem("warpix-pixe")).days.length`), DAYS.length, "のぞいただけで 記録が かわった");
    t.noErrors(p);
    await server.close();
  },

  async "はじめての日も ひらけて、きょうに スタンプが 1 つ"(t) {
    const server = await t.startServer();
    const b = await t.launchBrowser();
    const p = await b.firstPage();
    await p.goto(server.url + "?away=0");
    await p.ev(`localStorage.clear()`);
    await p.goto(server.url);
    await p.boot();
    await p.click("#diary-btn");
    await t.sleep(300);
    await p.ev(`document.getElementById("tab-stamp").click()`);
    t.eq(await p.ev(`document.querySelectorAll(".stamp-cal td.visited").length`), 1, "きょうの スタンプ");
    t.ok(await p.ev(`document.querySelector('.stamp-nav[data-d="-1"]').disabled && document.querySelector('.stamp-nav[data-d="1"]').disabled`), "まえも つぎも ないのに おせる");
    t.ok(await p.ev(`!achievements.has("streak7")`), "1 日で 実績が でた");
    // ずかんへ もどれる
    await p.ev(`document.getElementById("tab-zukan").click()`);
    t.eq(await p.ev(`["diary-body", "zukan-body", "stamp-body"].map((id) => !document.getElementById(id).hidden)`), [false, true, false], "ずかんに もどれない");
    t.noErrors(p);
    await server.close();
  },
};
