// 開店の よる（v1.42）：1きせいへの ひらく ひの てがみ、しゅうらいの よるの せいざ
async function page(t, born, query = "") {
  const server = await t.startServer();
  const b = await t.launchBrowser();
  const p = await b.firstPage();
  await p.goto(server.url);
  await p.ev(`localStorage.clear(); localStorage.setItem("warpix-pixe", JSON.stringify({ born: "${born}", days: ["${born}"], last: "${born}", stage: 0, sulk: false, pokeMark: 0, diary: [] }))`);
  await p.goto(server.url + "?away=0" + query);
  return { server, p };
}

export default {
  async "開店の 日に 1きせいが ひらくと、ピクセから ひらく ひの てがみ"(t) {
    const { server, p } = await page(t, "2026-10-12", "&date=2026-11-01&hour=10");
    await p.boot({ readIntro: false });
    const lines = await p.readIntro();
    t.ok(lines.some((l) => l.includes("とくべつな")), `いわない: ${JSON.stringify(lines)}`);
    await p.ev(`room.open("diary")`);
    await t.sleep(400);
    t.ok((await p.ev(`document.querySelector(".letter-btn.special")?.textContent ?? ""`)).includes("ひらく ひの てがみ"), "てがみの たばに ない");
    await p.ev(`document.querySelector(".letter-btn.special").click()`);
    await t.sleep(300);
    const text = await p.ev(`document.getElementById("letter-body").textContent`);
    t.ok(text.includes("さいしょの おきゃくさんへ") && text.includes("おみせを ひらく ひ") && text.includes("よる 9じ"), `なかみ: ${text}`);
    t.ok(await p.ev(`letter.add({ kind: "opening", title: "x", lines: ["x"] }) === null`), "2 かい わたせて しまう");
    t.noErrors(p);
    await server.close();
  },

  async "開店の あとに ひらいた 1きせいには、あとからの ことばで。開店まえ・あとから きた ひとには なし"(t) {
    let { server, p } = await page(t, "2026-10-12", "&date=2026-11-04&hour=10");
    await p.boot();
    t.ok((await p.ev(`letter.read("2026-11-04:opening"), document.getElementById("letter-body").textContent`)).includes("ぶじに おみせを ひらいた"), "あとからの ことばに ならない");
    await server.close();
    await t.closeAll();
    for (const [born, date] of [["2026-10-12", "2026-10-20"], ["2026-11-05", "2026-11-05"]]) {
      ({ server, p } = await page(t, born, `&date=${date}&hour=10`));
      await p.boot();
      t.ok(!(await p.ev(`letter.letters().some((l) => l.kind === "opening")`)), `${born} に きて ${date} に ひらいた ひとに てがみ`);
      t.noErrors(p);
      await server.close();
      await t.closeAll();
    }
  },

  async "しゅうらいの よるに たおすと、人数ぶんの ほしの せいざ。WORLD RECORD に のこる"(t) {
    const { server, p } = await page(t, "2026-10-12");
    await p.boot();
    await p.ev(`emit("raid-win", { players: 4, hits: 10 })`); // ふつうの レイド
    await t.sleep(3800);
    t.ok(!(await p.ev(`Boolean(document.querySelector(".seiza"))`)), "ふつうの レイドで せいざ");
    await p.ev(`emit("raid-win", { players: 4, hits: 10, night: true })`);
    await t.sleep(3800);
    t.eq(await p.ev(`document.querySelectorAll(".seiza svg rect").length`), 4, "ほしの かず");
    t.eq(await p.ev(`document.querySelectorAll(".seiza svg line").length`), 3, "つなぐ せん");
    const saved = await p.ev(`JSON.parse(localStorage.getItem("warpix-constellations"))`);
    t.eq([saved.length, saved[0].colors.length], [1, 4], "ほぞん");
    await p.ev(`room.open("trophy")`);
    await t.sleep(300);
    t.eq(await p.ev(`document.querySelectorAll("#seiza-list li").length`), 1, "WORLD RECORD に ない");
    t.ok(await p.ev(`grow.state.diary.some((e) => e.type === "seiza")`), "にっき");
    // おなじ 日付なら おなじ かたち
    t.eq(await p.ev(`JSON.stringify(opening.points("warpix-seiza-2026-11-01", 4))`), await p.ev(`JSON.stringify(opening.points("warpix-seiza-2026-11-01", 4))`), "かたちが きまらない");
    t.noErrors(p);
    await server.close();
  },

  async "せいざの あと「きねんしゃしん とろう！」→ とる で みんなの ピクセの しゃしん。WORLD RECORD の せいざからも みられる"(t) {
    const { server, p } = await page(t, "2026-10-12");
    await p.boot();
    await p.ev(`emit("raid-win", { players: 3, hits: 10, night: true })`);
    let asked = false;
    for (let i = 0; i < 60 && !asked; i++) {
      await t.sleep(200);
      asked = (await p.text()).includes("きねんしゃしん");
      if (!asked && !(await p.ev(`Boolean(document.querySelector(".dialog-choices"))`))) await p.ev(`document.getElementById("dialog").click()`);
    }
    t.ok(asked, `さそわない: ${await p.text()}`);
    t.eq((await p.ev(`JSON.parse(localStorage.getItem("warpix-constellations"))[0].hats`)).length, 3, "ぼうしを おぼえない");
    await p.ev(`document.querySelector(".dialog-choices button").click()`);
    await t.sleep(1500);
    t.eq(await p.ev(`document.querySelector(".postcard")?.getAttribute("aria-label")`), "しゅうらいの よるの きねんしゃしん", "しゃしんが でない");
    t.ok(await p.ev(`document.querySelector(".postcard-save").download === "warpix-raid-night-" + JSON.parse(localStorage.getItem("warpix-constellations"))[0].date + ".png"`), "ほぞんの なまえ");
    t.ok(await p.ev(`grow.state.diary.some((e) => e.type === "kinen")`), "にっき");
    await p.ev(`document.querySelector(".postcard-close").click()`);
    await p.ev(`room.open("trophy")`);
    await t.sleep(300);
    await p.ev(`document.querySelector("#seiza-list .seiza-btn").click()`);
    await t.sleep(1500);
    t.ok(await p.ev(`Boolean(document.querySelector(".postcard"))`), "WORLD RECORD から みられない");
    const size = await p.ev(`opening.photo(opening.saved()[0]).then((cv) => [cv.width, cv.height])`);
    t.eq(size, [1200, 630], "しゃしんの 大きさ");
    t.noErrors(p);
    await server.close();
  },
};
