// クローゼット（v1.57）：ぼうし と コスチューム を 1 つずつ。おすと おおきな ピクセが ためしに きて「これに する」。
// もらいかたは さいしょから・あえた ひ・きせつ・じっせき。ベレーは いろちがいを きせつで 1 しょくずつ（いろの まる）
const pixe = (stage, days, born = days[0]) => `localStorage.setItem("warpix-pixe", JSON.stringify({ born: "${born}", days: ${JSON.stringify(days)}, last: "${days.at(-1)}", stage: ${stage}, sulk: false, pokeMark: 0, diary: [] }))`;
const daysUpTo = (n, end = "2026-10-23") => Array.from({ length: n }, (_, i) => { const d = new Date(`${end}T12:00:00`); d.setDate(d.getDate() - (n - 1 - i)); return d.toISOString().slice(0, 10); });
const item = (p, id) => p.ev(`document.querySelector('#closet-list [data-id="${id}"]').click()`);
const kindTab = (p, k) => p.ev(`document.querySelector('.closet-kind[data-kind="${k}"]').click()`);
const open_ = (p) => p.ev(`[...document.querySelectorAll("#closet-list .wardrobe-item:not(:disabled)")].map((b) => b.dataset.id)`);

async function open(t, { url = "", before = "" } = {}) {
  const server = await t.startServer();
  const b = await t.launchBrowser();
  const p = await b.firstPage();
  await p.goto(server.url + url);
  await p.ev(`localStorage.clear(); ${before}`);
  await p.goto(server.url + url);
  await p.boot();
  return { server, p };
}
async function toCloset(t, p) {
  await p.click("#room-btn");
  await t.sleep(300);
  await p.click(".rs-closet");
  await t.sleep(300);
}

export default {
  async "あきの コスチュームは 11/15 の 入荷から。それまでは ヒントで いつか わかる。プレリリースで もらった 人は そのまま（v1.66）"(t) {
    const { server, p } = await open(t, { url: "?date=2026-11-05", before: pixe(0, ["2026-11-05"]) });
    await toCloset(t, p);
    t.ok(!(await open_(p)).includes("acorn"), "入荷まえに どんぐりが ある");
    t.eq(await p.ev(`document.querySelector('#closet-list [data-id="acorn"]').title`), "11/15 に 入荷するよ", "入荷の ヒント");
    // プレリリース（10 がつ）に もらった 人：もった まま。年は おしらせの きろくから
    await p.ev(`localStorage.clear(); ${pixe(0, ["2026-10-24", "2026-11-05"], "2026-10-24")}; localStorage.setItem("warpix-season-hats", JSON.stringify(["season:autumn"])); localStorage.setItem("warpix-mail", JSON.stringify({ read: [], got: { "season-autumn": "2026-10-24" } }))`);
    // （1きせいは 開店の あと ひらく ひの てがみが でるので、ROOM は ひらかず に しらべる）
    await p.goto(server.url + "?date=2026-11-05");
    await p.boot();
    t.ok(await p.ev(`wardrobe.opened("acorn")`), "プレリリースで もらった どんぐりが きえた");
    t.eq(await p.ev(`wardrobe.fromOf("season:autumn")`), "2026年の あきに とどいた", "でどころの 年");
    // 11/15 から：はじめての 人も もらえる
    await p.ev(`localStorage.clear(); ${pixe(0, ["2026-11-15"])}`);
    await p.goto(server.url + "?date=2026-11-15");
    await p.boot();
    await toCloset(t, p);
    t.ok((await open_(p)).includes("acorn"), "11/15 に どんぐりが ない");
    t.noErrors(p);
    await server.close();
  },

  async "ぶんるいは ぼうし と コスチューム。ためしに きて「これに する」、ぼうしと コスチュームは いっしょに きられる"(t) {
    // あきの 入荷（11/15、v1.66）の あと
    const { server, p } = await open(t, { url: "?date=2026-11-16", before: pixe(0, ["2026-11-16"]) });
    await toCloset(t, p);
    t.eq(await p.ev(`document.getElementById("diary-title").textContent`), "クローゼット", "みだし");
    t.eq(await p.ev(`[...document.querySelectorAll(".closet-kind")].map((b) => b.textContent)`), ["ぼうし", "コスチューム"], "ぶんるい");
    // はじめての ひ（あき）：ベレー（あか）＋ あきの どんぐり
    const hats = await open_(p);
    t.ok(hats.includes("beret") && hats.includes("acorn") && !hats.includes("catears") && !hats.includes("beret-deep"), `ぼうしの ならび：${hats}`);
    await item(p, "beret");
    t.eq(await p.ev(`document.getElementById("closet-name").textContent`), "ベレーぼう", "なまえ");
    t.eq(await p.ev(`document.getElementById("closet-from").textContent`), "さいしょから もってる", "でどころ（さいしょから）");
    t.eq(await p.ev(`[...document.querySelectorAll(".closet-color")].map((b) => b.disabled)`), [false, false, false, false], "いろの まる（4 しょく さいしょから）");
    await p.ev(`document.querySelector('.closet-color[data-hat="beret-deep"]').click()`);
    t.eq(await p.ev(`wardrobe.currentId()`), null, "ためした だけで かわった");
    await p.click("#closet-decide");
    t.eq(await p.ev(`wardrobe.currentId()`), "beret-deep", "いろちがいを かぶれない");
    t.ok((await p.ev(`document.getElementById("closet-name").textContent`)).includes("ふかい みどり"), "かぶった ひとこと");
    await kindTab(p, "cos");
    t.eq(await open_(p), ["none", "glasses", "muffler", "sweater"], "コスチュームの ならび（さいしょ・あき）");
    await item(p, "sweater");
    t.eq(await p.ev(`document.getElementById("closet-from").textContent`), "2026年の あきに とどいた", "でどころ（きせつ は 年いり）");
    await p.click("#closet-decide");
    t.eq(await p.ev(`[wardrobe.currentId(), closet.worn().cos]`), ["beret-deep", "sweater"], "いっしょに きられない");
    await p.shot("closet.png");
    // ほかの コスチュームに すると いれかわる
    await item(p, "glasses");
    await p.click("#closet-decide");
    t.eq(await p.ev(`closet.worn().cos`), "glasses", "いれかわらない");
    await p.goto(server.url + "?date=2026-11-16");
    await p.boot();
    t.eq(await p.ev(`[wardrobe.currentId(), closet.worn().cos]`), ["beret-deep", "glasses"], "ひらきなおすと もどる");
    t.noErrors(p);
    await server.close();
  },

  async "まえから そだって いる 人：マント（あたらしい ほう）を きた まま、14 にちの きんの アンテナは ぼうしに。ぼうしの サングラスは コスチュームへ"(t) {
    let { server, p } = await open(t, { url: "?date=2026-10-24", before: pixe(3, daysUpTo(14)) });
    t.eq(await p.ev(`[wardrobe.chosenId() ?? null, closet.worn().cos]`), ["antenna", "cape"], "そだった ぶん");
    await toCloset(t, p);
    const hats = await open_(p);
    for (const id of ["catears", "ribbon", "headphones", "antenna"]) t.ok(hats.includes(id), `${id} が ない（14 にち）`);
    t.ok(!hats.includes("tophat"), "30 にち まえに シルクハット");
    await server.close();
    ({ server, p } = await open(t, { url: "?date=2026-06-10", before: `${pixe(0, ["2026-06-09"])}; localStorage.setItem("warpix-hat", JSON.stringify("shades")); localStorage.setItem("warpix-achievements", JSON.stringify(["hacker"]))` }));
    t.eq(await p.ev(`[wardrobe.currentId() ?? null, closet.worn().cos]`), [null, "shades"], "サングラスが コスチュームに ならない");
    await toCloset(t, p);
    await kindTab(p, "cos");
    t.eq(await open_(p), ["none", "glasses", "raincoat", "shades"], "つゆ（6 がつ）の ならび");
    t.noErrors(p);
    await server.close();
  },

  async "あたらしく もらった ものが あると ハンガーラックが ひかり、その アイテムに NEW。ためすと きえる"(t) {
    // きのうまで 4 にち（ねこみみ まで みた）→ きょう 5 にちめで リボン
    const { server, p } = await open(t, { url: "?date=2026-10-24", before: `${pixe(1, daysUpTo(4))}; localStorage.setItem("warpix-closet-seen", JSON.stringify(["h:beret", "h:catears", "c:glasses", "c:scarf", "h:acorn", "c:muffler", "c:sweater", "h:pumpkin"]))` });
    t.eq(await p.ev(`grow.state.days.length`), 5, "5 にちめ に ならない");
    await p.click("#room-btn");
    await t.sleep(300);
    t.ok(await p.ev(`document.querySelector(".rs-closet").classList.contains("glow")`), "ハンガーラックが ひからない");
    await p.click(".rs-closet");
    await t.sleep(300);
    t.eq(await p.ev(`[...document.querySelectorAll("#closet-list .wardrobe-item")].filter((b) => b.querySelector(".closet-new")).map((b) => b.dataset.id)`), ["ribbon"], "NEW が ついた もの");
    await item(p, "ribbon");
    t.ok(await p.ev(`!document.querySelector("#closet-list .closet-new")`), "ためしても NEW が きえない");
    t.eq(await p.ev(`document.getElementById("closet-from").textContent`), "5にち あえた プレゼント", "でどころ（あえた ひ）");
    await p.click("#room-back");
    await t.sleep(300);
    t.ok(await p.ev(`!document.querySelector(".rs-closet").classList.contains("glow")`), "みた あとも ひかる");
    t.noErrors(p);
    await server.close();
  },

  async "じぶんで えらんだ ぼうし（「なし」も）を まもる。きせつの ぼうし・かさは まだ えらんで いない 人 だけ（v1.64）"(t) {
    const { server, p } = await open(t, { url: "?date=2026-10-28", before: pixe(0, ["2026-10-27", "2026-10-28"]) });
    t.eq(await p.ev(`wardrobe.currentId()`), "pumpkin", "えらんで いない 人に ハロウィンの ぼうしが でない");
    await p.ev(`wardrobe.wear(null)`);
    t.eq(await p.ev(`wardrobe.currentId()`), null, "「なし」に したのに かぼちゃ");
    await p.goto(server.url + "?date=2026-10-28");
    await p.boot();
    t.eq(await p.ev(`wardrobe.currentId()`), null, "ひらきなおすと かぼちゃに もどった");
    await p.ev(`wardrobe.wearSeasonal("umbrella")`);
    t.eq(await p.ev(`wardrobe.currentId()`), null, "「なし」に したのに かさを さした");
    t.noErrors(p);
    await server.close();
  },
};
