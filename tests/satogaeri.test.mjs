// ピクセの さとがえり（v1.46）：ときどき うまれた こうじょうへ あそびに いって、はなしを もって かえる
async function page(t, days, query = "", born = "2026-10-10") {
  const server = await t.startServer();
  const b = await t.launchBrowser();
  const p = await b.firstPage();
  await p.goto(server.url);
  await p.ev(`localStorage.clear(); localStorage.setItem("warpix-pixe", JSON.stringify({ born: "${born}", days: ${JSON.stringify(days)}, last: ${JSON.stringify(days.at(-1) ?? null)}, stage: 0, sulk: false, pokeMark: 0, diary: [] }))`);
  await p.goto(server.url + "?away=0" + query);
  await p.boot();
  return { server, p };
}

export default {
  async "いってくる → るすの はこに「おでかけ」→ もどって こうじょうの はなし。にっきと 実績"(t) {
    const { server, p } = await page(t, ["2026-10-10", "2026-10-11"]);
    // 2 日めは ヒントなどを しゃべるので、ひまに なるまで よみすすめる
    let free = false;
    for (let i = 0; i < 60 && !free; i++) {
      free = await p.ev(`satogaeri.free()`);
      if (!free) { await p.ev(`document.querySelector(".dialog-choices button:last-child")?.click() ?? document.getElementById("dialog").click()`); await t.sleep(250); }
    }
    t.ok(free, "ひまに ならない");
    await p.ev(`satogaeri.go({ away: 1500 })`);
    await t.sleep(1500);
    t.ok((await p.text()).includes("うまれた こうじょう"), `いってくると いわない: ${await p.text()}`);
    await t.sleep(1500);
    t.ok(await p.ev(`npc.isAway() && document.getElementById("npc").classList.contains("satogaeri")`), "おでかけ ちゅうに ならない");
    t.eq(await p.ev(`document.getElementById("npc").getAttribute("aria-label")`), "ピクセは WARPIX製作所へ おでかけ ちゅう", "よみあげ");
    t.eq(await p.ev(`getComputedStyle(document.getElementById("npc"), "::after").content`), '"おでかけ"', "はこの ふだ");
    let said = [];
    for (let i = 0; i < 40 && !said.some((l) => l.includes("ヘルメット")); i++) {
      await t.sleep(200);
      const s = await p.text();
      if (s && !said.includes(s)) said.push(s);
      if (said.some((l) => l.startsWith("ただいま！ こうじょうで ね"))) await p.ev(`document.getElementById("dialog").click()`);
    }
    t.ok(said.some((l) => l.includes("ヘルメット")), `はなしが ない: ${JSON.stringify(said)}`);
    t.ok(await p.ev(`!npc.isAway() && !document.getElementById("npc").classList.contains("satogaeri")`), "もどらない");
    t.ok(await p.ev(`grow.state.diary.some((e) => e.type === "satogaeri" && e.text.includes("ヘルメット"))`), "にっき");
    t.ok(await p.ev(`achievements.has("satogaeri")`), "実績");
    t.eq(await p.ev(`JSON.parse(localStorage.getItem("warpix-satogaeri")).n`), 1, "ほぞん");
    t.noErrors(p);
    await server.close();
  },

  async "はじめて きた 日・きょう もう いった 日は いかない。2 日め いこうは いく よてい"(t) {
    const todayYmd = (() => { const d = new Date(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); })();
    let { server, p } = await page(t, [], "", todayYmd); // きょう はじめて きた
    t.ok(!(await p.ev(`satogaeri.scheduled()`)), "はじめての 日に いく よてい");
    await server.close();
    await t.closeAll();
    ({ server, p } = await page(t, ["2026-10-10", "2026-10-11"]));
    t.ok(await p.ev(`satogaeri.scheduled()`), "2 日めなのに いく よていが ない");
    await server.close();
    await t.closeAll();
    const server2 = await t.startServer();
    const b = await t.launchBrowser();
    const q = await b.firstPage();
    await q.goto(server2.url);
    await q.ev(`localStorage.clear(); localStorage.setItem("warpix-pixe", JSON.stringify({ born: "2026-10-10", days: ["2026-10-10", "2026-10-11"], last: "2026-10-11", stage: 0, sulk: false, pokeMark: 0, diary: [] })); localStorage.setItem("warpix-satogaeri", JSON.stringify({ last: (() => { const d = new Date(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); })(), n: 1 }))`);
    await q.goto(server2.url + "?away=0");
    await q.boot();
    t.ok(!(await q.ev(`satogaeri.scheduled()`)), "きょう もう いったのに また いく よてい");
    t.noErrors(q);
    await server2.close();
  },

  async "シンプルモード・ぼうけんの とちゅうは ひまじゃない"(t) {
    let { server, p } = await page(t, ["2026-10-10", "2026-10-11"], "&simple=1");
    t.ok(!(await p.ev(`satogaeri.free()`)) && !(await p.ev(`satogaeri.scheduled()`)), "シンプルモードで いく");
    await server.close();
    await t.closeAll();
    ({ server, p } = await page(t, ["2026-10-10", "2026-10-11"]));
    await p.ev(`adventure.start()`);
    await t.sleep(800);
    t.ok(!(await p.ev(`satogaeri.free()`)), "ぼうけんの とちゅうで ひま");
    await p.ev(`adventure.exit()`);
    t.noErrors(p);
    await server.close();
  },
};
