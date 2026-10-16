// こんやの 3ぎょう（v1.29）：よるに なると、ピクセが きょう いちにちを 3 ぎょうの にっきに まとめる
const ymd = (p) => p.ev(`(() => { const d = today(), z = (n) => String(n).padStart(2, "0"); return d.getFullYear() + "-" + z(d.getMonth() + 1) + "-" + z(d.getDate()); })()`);
const card = (p) => p.ev(`(() => { const c = document.querySelector("#diary-body .tonight"); return c ? { waiting: c.classList.contains("waiting"), lines: [...c.querySelectorAll("li")].map((li) => li.textContent), text: c.textContent.trim() } : null; })()`);

async function open(t, { hour, before = "", boot = true } = {}) {
  const server = await t.startServer();
  const b = await t.launchBrowser();
  const p = await b.firstPage();
  await p.goto(server.url);
  // よなか（0〜5時）に ながすと、ひらいた だけで「よふかし」が とれて 1 ぎょうめが かわる。さきに もっている ことに する
  await p.ev(`localStorage.clear(); localStorage.setItem("warpix-achievements", JSON.stringify(["night-owl"])); ${before}`);
  await p.goto(`${server.url}?hour=${hour}`);
  if (boot) await p.boot();
  return { server, p };
}

export default {
  async "ひるに かぞえて、よるに おへやの にっきの いちばん うえに 3 ぎょう"(t) {
    const { server, p } = await open(t, { hour: 21 });
    await p.ev(`addEventListener("click", (e) => e.target.closest(".pixel-btn") && e.preventDefault())`);
    // スポティファイに 2 かい、ユーチューブに 1 かい、ピクセを 3 かい つつく、UFO 1 き
    await p.ev(`const b = (i) => document.querySelector('.pixel-btn [data-icon="' + i + '"]').closest("a"); b("spotify").click(); b("youtube").click(); b("spotify").click();`);
    await t.sleep(3200); // ピクセは ワープあなに とびこんで るす。もどってから つつく
    for (let i = 0; i < 3; i++) { await p.ev(`document.getElementById("npc").click()`); await t.sleep(80); }
    await p.ev(`emit("ufo-down")`);
    t.eq(await p.ev(`(({ warps, pokes, ufos }) => ({ warps, pokes, ufos }))(JSON.parse(localStorage.getItem("warpix-today")))`), { warps: { spotify: 2, youtube: 1 }, pokes: 3, ufos: 1 }, "かぞえかた");
    // はじめての ワープで もらった 実績も かぞえている。ここでは リンクの ぎょうを みたいので、いちど からに
    t.ok((await p.ev(`tonight.tally().ach`)).includes("はじめての ワープ"), "とった 実績を かぞえていない");
    await p.ev(`tonight.tally().ach.length = 0`);
    await p.click("#room-btn");
    await t.sleep(300);
    const c = await card(p);
    t.ok(c && !c.waiting, "よるなのに 3 ぎょうが ない");
    t.eq(c?.lines.slice(0, 2), ["きょうは SPOTIFYへ 2かい ワープした。", "ワープ 3かい・つつかれた 3かい・UFO 1き。"], "1・2 ぎょうめ");
    t.ok(await p.ev(`["あしたも ここで まってるね。", "ほしが きれいな よる。おやすみ。", "きみと あえて よかった。", "あしたは どの せかいへ いこうか。", "ねむく なってきた……zzz"].includes(${JSON.stringify(c?.lines[2])})`), `3 ぎょうめ: ${c?.lines[2]}`);
    t.ok(await p.ev(`document.querySelector("#diary-body .diary-head + .tonight") !== null`), "なまえの したに ない");
    t.ok(await p.ev(`achievements.has("tonight")`), "実績「よるの 3ぎょう」");
    // じっせきを とった ひは、それが いちばん（にっきを ひらいた・よんだ 実績は かぞえない）
    await p.ev(`achievements.unlock("konami")`);
    await p.ev(`document.getElementById("tab-zukan").click(); document.getElementById("tab-diary").click()`);
    t.eq((await card(p))?.lines[0], "きょうは じっせき「でんせつの コマンド」を とった ひ！", "じっせきの ひ");
    t.noErrors(p);
    await server.close();
  },

  async "ひるは よこくだけで、実績は まだ"(t) {
    const { server, p } = await open(t, { hour: 12 });
    await p.click("#room-btn");
    await t.sleep(300);
    const c = await card(p);
    t.ok(c?.waiting && c.text.startsWith("よるに なると"), `よこくが ない: ${JSON.stringify(c)}`);
    t.ok(await p.ev(`!achievements.has("tonight")`), "ひるなのに 実績");
    t.noErrors(p);
    await server.close();
  },

  async "ひづけが かわると はじめから。なにも ない ひと、たくさん ワープした ひ"(t) {
    let { server, p } = await open(t, { hour: 22, before: `localStorage.setItem("warpix-today", JSON.stringify({ date: "2000-01-01", warps: { youtube: 9 }, pokes: 9, ufos: 9, ach: ["X"] }))` });
    await p.click("#room-btn");
    await t.sleep(300);
    t.eq((await card(p))?.lines.slice(0, 2), ["きょうは のんびり ほしを みてた。", "かずは ぜんぶ 0。それも いい ひ。"], "きのうの かずが のこっている");
    await server.close();
    const day = await ymd(p);
    ({ server, p } = await open(t, { hour: 23, before: `localStorage.setItem("warpix-today", JSON.stringify({ date: "${day}", warps: { tiktok: 7, key: 4 }, pokes: 0, ufos: 0, ach: [] }))` }));
    await p.click("#room-btn");
    await t.sleep(300);
    t.eq((await card(p))?.lines, ["きょうは TIKTOKへ 7かい ワープした。", "ワープ 11かい。", "たくさん ワープして つかれたね。ゆっくり ねてね。"], "たくさん ワープした ひ");
    t.noErrors(p);
    await server.close();
  },

  async "よるは ROOM に つきの しるし。3 ぎょうを よむと きえて、ひるは でない"(t) {
    const { server, p } = await open(t, { hour: 20 });
    const moon = () => p.ev(`!document.querySelector("#room-btn .room-moon").hidden`);
    t.ok(await moon(), "よるなのに しるしが ない");
    await p.click("#room-btn");
    await t.sleep(300);
    t.ok(!(await moon()), "よんだのに きえない");
    t.eq(await p.ev(`localStorage.getItem("warpix-tonight-read")`), JSON.stringify(await ymd(p)), "よんだ ひを おぼえていない");
    await p.goto(`${server.url}?hour=20`);
    await p.boot();
    t.ok(!(await moon()), "よんだのに また でた");
    t.noErrors(p);
    await server.close();
    const day = await open(t, { hour: 10 });
    t.ok(await day.p.ev(`document.querySelector("#room-btn .room-moon").hidden`), "ひるなのに しるし");
    await day.server.close();
  },
};
