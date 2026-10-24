// なれ（v1.50）：はじめての 人には ていねいに、なれた 人には みじかく。おなじ セリフを まいかい いわない
const dayAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
// days 日 会って いて、さいごに 来たのは last 日まえ（0 なら きょう）
const pixe = (days, last) =>
  JSON.stringify({ born: dayAgo(days + 1), days: Array.from({ length: days }, (_, i) => dayAgo(i + last)), last: dayAgo(last), stage: 0, sulk: false, pokeMark: 0, diary: [] });

async function visit(t, storage) {
  const server = await t.startServer();
  const b = await t.launchBrowser();
  const p = await b.firstPage();
  await p.goto(server.url);
  await p.ev(`localStorage.clear(); ${storage}`);
  await p.goto(server.url + "?away=0");
  await p.boot({ readIntro: false });
  return { server, p, intro: await p.readIntro() };
}
const again = async (p, server) => {
  await p.goto(server.url + "?away=0");
  await p.boot({ readIntro: false });
  return p.readIntro();
};
const intro = (l) => l.includes("ぼくは ピクセ") || l.includes("したの ボタンを");

export default {
  async "はじめての 人には じこしょうかいと ボタンの せつめい、2 かいめからは いわない"(t) {
    const { server, p, intro: first } = await visit(t, "");
    t.ok(first.some((l) => l.includes("したの ボタンを")), `はじめてなのに せつめいが ない: ${JSON.stringify(first)}`);
    const second = await again(p, server);
    t.ok(!second.some(intro), `2 かいめも せつめいした: ${JSON.stringify(second)}`);
    t.ok(second.some((l) => l.includes("2かいめ")), `2 かいめの よろこびが ない: ${JSON.stringify(second)}`);
    const third = await again(p, server);
    t.ok(third.length >= 1 && !third.some(intro) && !third.some((l) => l.includes("かいめ")), `3 かいめ: ${JSON.stringify(third)}`);
    t.noErrors(p);
    await server.close();
  },

  async "なかよしの 人には みじかい あいさつ。おなじ 日に また 来たら べつの ことば"(t) {
    const { server, p, intro: first } = await visit(t, `localStorage.setItem("warpix-pixe", ${JSON.stringify(pixe(20, 1))}); localStorage.setItem("warpix-visits", "56")`);
    t.ok(first.length >= 1 && !first.some(intro), `なかよしに せつめいした: ${JSON.stringify(first)}`);
    t.ok(!first.some((l) => l.includes("57かいめ")), `まいかい かずを いった: ${JSON.stringify(first)}`);
    // おなじ 日に 何かいも 来ても、つづけて おなじ あいさつに ならない
    let prev = first[0];
    for (let i = 0; i < 4; i++) {
      const lines = await again(p, server);
      t.eq(lines.length, 1, `おなじ 日の あいさつは 1 ぎょう: ${JSON.stringify(lines)}`);
      t.ok(lines[0] !== prev, `おなじ あいさつが つづいた: ${lines[0]}`);
      prev = lines[0];
    }
    t.noErrors(p);
    await server.close();
  },

  async "来た かいすうは ふしめ だけ（100 かいめ）"(t) {
    // だいじな はなし（そだつ・きっぷ・じゅもん）が おおい ひは かるい わだいを いわない（v1.60）ので、それらは すんだ ことに
    const { server, p, intro: lines } = await visit(t, `localStorage.setItem("warpix-pixe", ${JSON.stringify({ ...pixe(20, 1), stage: 3 })}); localStorage.setItem("warpix-visits", "99"); localStorage.setItem("warpix-ticket", JSON.stringify({ got: "2026-10-01" })); localStorage.setItem("warpix-save-told", "true")`);
    t.ok(lines.some((l) => l.includes("100かいめ")), `100 かいめを いわない: ${JSON.stringify(lines)}`);
    t.ok(!(await again(p, server)).some((l) => l.includes("かいめ")), "101 かいめも いった");
    t.noErrors(p);
    await server.close();
  },

  async "てんきの ひとことは おなじ 日に おなじ 天気なら 1 かいだけ（かさは まいかい）"(t) {
    // 天気は さっき しらべた ことに して（キャッシュ）、外には とりに いかない
    const rain = `localStorage.setItem("warpix-weather", JSON.stringify("yes")); localStorage.setItem("warpix-weather-cache", JSON.stringify({ at: Date.now(), code: 63, day: true, temp: 17 }))`;
    const { server, p } = await visit(t, `localStorage.setItem("warpix-pixe", ${JSON.stringify(pixe(20, 1))}); localStorage.setItem("warpix-visits", "30"); ${rain}`);
    await t.sleep(4500);
    t.ok(String(await p.ev(`store.get("warpix-weather-said", null)`)).endsWith(":rain"), "1 かいめに いわない");
    await p.goto(server.url + "?away=0");
    await p.ev(`window.__lines = []; on("npc-line", ({ line }) => __lines.push(line))`);
    await p.boot();
    await t.sleep(4500);
    t.ok(await p.ev(`document.body.classList.contains("weather-rain")`), "2 かいめに 雨が ふらない");
    t.eq(await p.ev(`wardrobe.currentId()`), "umbrella", "2 かいめに かさを ささない");
    const said = await p.ev(`__lines`);
    t.ok(!said.some((l) => l.includes("あめ")), `2 かいめも 天気を いった: ${JSON.stringify(said)}`);
    t.noErrors(p);
    await server.close();
  },
};
