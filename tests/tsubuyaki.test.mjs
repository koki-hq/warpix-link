// ピクセの つぶやき（v1.55）：にっきの かわりに 1 日 1 こ。その 日は みんな おなじ。こなかった 日の ぶんも 7 にち。「こんやの 3ぎょう」は やめた
const born = (date) => `localStorage.setItem("warpix-pixe", JSON.stringify({ born: "${date}", days: ["${date}"], last: "${date}", stage: 0, sulk: false, pokeMark: 0, diary: [] }))`;

async function open(t, { date, before = "" }) {
  const server = await t.startServer();
  const b = await t.launchBrowser();
  const p = await b.firstPage();
  await p.goto(server.url);
  await p.ev(`localStorage.clear(); ${before}`);
  await p.goto(`${server.url}?date=${date}`);
  await p.boot();
  return { server, p };
}
const shown = (p) => p.ev(`[...document.querySelectorAll("#diary-body .tsubuyaki")].map((s) => [s.querySelector("h3").textContent, s.querySelector("p").innerText])`);

export default {
  async "ROOM に きょうの つぶやき。はじまった 日（10/24）から きょうまで ぜんぶ、であう まえの 日も。ひづけで きまる（v1.66.3）"(t) {
    const { server, p } = await open(t, { date: "2026-11-09", before: born("2026-11-07") });
    t.ok(await p.ev(`!document.querySelector("#room-btn .diary-new").hidden`), "よむ まえに NEW が ない");
    await p.click("#room-btn");
    await t.sleep(300);
    await p.click(".rs-window");
    await t.sleep(200);
    const list = await shown(p);
    t.eq(list.length, 17, "10/24 から 11/9 まで 17 にち ぶん");
    t.eq(list.slice(0, 3).map(([d]) => d), ["2026/11/9", "2026/11/8", "2026/11/7"], "あたらしい じゅん・とし つき");
    t.eq(list.at(-1)[0], "2026/10/24", "はじまった 日まで ない");
    const want = await p.ev(`["2026-11-09", "2026-11-08"].map((d) => tsubuyaki.of(d))`);
    t.eq(list.slice(0, 2).map(([, s]) => s), want, "ひづけの つぶやき");
    t.ok(want[0] !== want[1], "となりの 日が おなじ");
    t.ok(await p.ev(`document.getElementById("tab-diary").textContent === "つぶやき"`), "タブの なまえ");
    t.ok(await p.ev(`!document.querySelector(".tonight") && !document.querySelector(".room-moon")`), "こんやの 3ぎょう・つきの しるしが のこって いる");
    t.ok(await p.ev(`achievements.has("diary")`), "実績「ピクセの つぶやき」が ない");
    await p.shot("tsubuyaki.png");
    await p.ev(`document.getElementById("diary").close()`);
    t.ok(await p.ev(`document.querySelector("#room-btn .diary-new").hidden`), "よんでも NEW が きえない");
    // ?date= の あいだは よんだ ことを のこさない ので、ここまで。10/26 なら であった 日に かかわらず 3 こ
    await server.close();
    const again = await open(t, { date: "2026-10-26", before: born("2026-10-26") });
    await again.p.click("#room-btn");
    await t.sleep(300);
    await again.p.click(".rs-window");
    await t.sleep(200);
    t.eq((await shown(again.p)).map(([d]) => d), ["2026/10/26", "2026/10/25", "2026/10/24"], "はじまった 日から で ない");
    t.noErrors(again.p);
    await again.server.close();
  },

  async "きまった 日は きまった つぶやき（ハロウィン）。1 たい 1 で、ぜんぶ 1 かいずつ でて くる"(t) {
    const { server, p } = await open(t, { date: "2026-10-31", before: born("2026-10-01") });
    await p.ev(`room.open("diary")`);
    await t.sleep(300);
    t.ok((await shown(p))[0][1].startsWith("トリック オア トリート！"), "ハロウィンの つぶやき で ない");
    // 1 たい 1（v1.66.3）：10/24 から ストックの さいごの 日まで、どの つぶやきも 1 かい きりで、ぜんぶ でる（きまった 日は のぞく）
    const use = await p.ev(`(() => { const out = []; for (let i = 0; ; i++) { const d = new Date(Date.UTC(2026, 9, 24 + i, 12)).toISOString().slice(0, 10); if (d > tsubuyaki.lastDay()) return out; if (!tsubuyaki.DAYS[d.slice(5)]) out.push(tsubuyaki.of(d)); } })()`);
    t.eq(new Set(use).size, use.length, "おなじ つぶやきが 2 かい でる");
    t.eq(use.length, await p.ev(`tsubuyaki.LIST.length`), "でて こない つぶやきが ある");
    t.ok(await p.ev(`tsubuyaki.lastDay() >= "2027-02-01"`), "ストックが 2/1 まで もたない");
    // ふやしても（v1.66.3）、もう でた 日の つぶやきは かわらない
    t.ok((await p.ev(`tsubuyaki.of("2026-11-09")`)).startsWith("おなかが すいた"), "11/9 の つぶやきが かわった");
    t.ok((await p.ev(`tsubuyaki.of("2026-11-02")`)).startsWith("100えんだま"), "11/2 の つぶやきが かわった");
    // きれた あとも からに ならない
    t.ok(await p.ev(`tsubuyaki.LIST.includes(tsubuyaki.of("2027-06-01"))`), "きれた あとの 日が から");
    t.noErrors(p);
    await server.close();
  },

  async "やめた 実績（よるの 3ぎょう）は かぞえない。きょうの かずは てがみの ために のこす"(t) {
    const { server, p } = await open(t, { date: "2026-10-20", before: `localStorage.setItem("warpix-achievements", JSON.stringify(["tonight", "first-warp", "night-owl"]))` });
    t.ok(await p.ev(`document.getElementById("trophy-count").textContent.startsWith("2/")`), `かずが あわない：${await p.ev(`document.getElementById("trophy-count").textContent`)}`);
    await p.ev(`document.querySelector(".pixel-btn").addEventListener("click", (e) => e.preventDefault(), { once: true }); emit("link", { icon: "youtube" })`);
    t.eq(await p.ev(`tonight.tally().warps.youtube`), 1, "ワープの かずを かぞえない");
    t.noErrors(p);
    await server.close();
  },
};
