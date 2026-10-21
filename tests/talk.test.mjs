// v1.52 チューニング：ピクセが むこうから 話しかける のは 1 かい ひらいて 1 つ まで。おさそいは 2 かい ことわられたら おわり
// 本人「次から 次へ 別の 話題が 降って くる。バグってる 感じ、機械的」（2026-10-20）
async function open(t, storage = {}, query = "") {
  const server = await t.startServer();
  const b = await t.launchBrowser();
  const p = await b.firstPage();
  await p.goto(server.url);
  const sets = Object.entries(storage).map(([k, v]) => `localStorage.setItem(${JSON.stringify(k)}, ${JSON.stringify(JSON.stringify(v))});`).join("");
  await p.ev(`localStorage.clear(); ${sets}`);
  await p.goto(server.url + query);
  await p.boot();
  return { server, p };
}

export default {
  async "はじめての 日は おさそい なし（きょくの リンクは べつ）。2 かいめ からは 1 つだけ"(t) {
    let { server, p } = await open(t, {}, "?away=0");
    t.eq(await p.ev(`store.get("warpix-visits", 0)`), 1, "前提：はじめて");
    t.ok(!(await p.ev(`npc.turn()`)), "はじめてなのに 話す ばんが きた");
    t.ok(await p.ev(`npc.turn({ evenFirst: true })`), "きょくの リンクで きた 人にも 話せない");
    await server.close();
    await t.closeAll();
    ({ server, p } = await open(t, { "warpix-visits": 4 }, "?away=0"));
    t.ok(await p.ev(`npc.turn()`), "2 かいめ いこうなのに 話せない");
    t.ok(!(await p.ev(`npc.turn()`)), "1 かい ひらいて 2 つめも 話せた");
    // 10 ぷん いじょう はなれて もどったら、また 1 つ
    await p.ev(`(() => {
      let hid = false;
      Object.defineProperty(document, "hidden", { get: () => hid, configurable: true });
      const realNow = Date.now.bind(Date);
      window.__shift = 0;
      Date.now = () => realNow() + window.__shift;
      hid = true; document.dispatchEvent(new Event("visibilitychange"));
      window.__shift = 5 * 60000;
      hid = false; document.dispatchEvent(new Event("visibilitychange"));
    })()`);
    t.ok(!(await p.ev(`npc.turn()`)), "5 ふんで また 話せた");
    await p.ev(`(() => {
      Object.defineProperty(document, "hidden", { get: () => true, configurable: true }); document.dispatchEvent(new Event("visibilitychange"));
      window.__shift += 11 * 60000;
      Object.defineProperty(document, "hidden", { get: () => false, configurable: true }); document.dispatchEvent(new Event("visibilitychange"));
    })()`);
    t.ok(await p.ev(`npc.turn()`), "11 ぷん はなれて もどっても 話せない");
    t.noErrors(p);
    await server.close();
  },

  async "おさそいの へんじ：こたえたら 1 しゅうかん きかない、2 かい ことわられたら もう きかない"(t) {
    const { server, p } = await open(t, { "warpix-visits": 4 }, "?away=0");
    await p.ev(`(() => { const realNow = Date.now.bind(Date); window.__shift = 0; Date.now = () => realNow() + window.__shift; })()`);
    const day = 24 * 60 * 60000;
    t.ok(await p.ev(`npc.mayAsk("adventure")`), "まだ きいて いないのに きけない");
    await p.ev(`npc.answered("adventure", false)`);
    t.ok(!(await p.ev(`npc.mayAsk("adventure")`)), "ことわった すぐ あとに きけた");
    await p.ev(`window.__shift = ${6 * day}`);
    t.ok(!(await p.ev(`npc.mayAsk("adventure")`)), "6 日で きけた");
    await p.ev(`window.__shift = ${8 * day}`);
    t.ok(await p.ev(`npc.mayAsk("adventure")`), "1 しゅうかん たっても きけない");
    await p.ev(`npc.answered("adventure", false)`);
    await p.ev(`window.__shift = ${200 * day}`);
    t.ok(!(await p.ev(`npc.mayAsk("adventure")`)), "2 かい ことわったのに また きけた");
    // 「いいよ」は かぞえない（1 しゅうかん あける だけ）
    await p.ev(`npc.answered("install", true)`);
    t.ok(!(await p.ev(`npc.mayAsk("install")`)), "こたえた すぐ あとに きけた");
    await p.ev(`window.__shift = ${208 * day}`);
    t.ok(await p.ev(`npc.mayAsk("install")`), "「いいよ」の あと 1 しゅうかん たっても きけない");
    t.eq(await p.ev(`JSON.parse(localStorage.getItem("warpix-asked")).adventure.no`), 2, "ことわった かず");
    t.noErrors(p);
    await server.close();
  },

  async "ことわった ぼうけんは 1 しゅうかん きかない。v1.51 までに てんきを ことわった 人は 1 かい ことわった ことに"(t) {
    const { server, p } = await open(t, { "warpix-visits": 4, "warpix-weather": "no", "warpix-asked": { adventure: { no: 1, next: Date.now() + 86400000 } } }, "?away=0");
    t.eq(await p.ev(`JSON.parse(localStorage.getItem("warpix-asked")).weather?.no`), 1, "てんきの ことわりを かぞえない");
    await t.sleep(27000);
    t.ok(!(await p.text()).includes("そとに"), "1 しゅうかん たって いないのに ぼうけんに さそった");
    t.noErrors(p);
    await server.close();
  },
};
