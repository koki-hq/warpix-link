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
  async "ROOM に きょうの つぶやき。こなかった 日の ぶんも さいきん 7 にち、であう まえの 日は ない。ひづけで きまる"(t) {
    const { server, p } = await open(t, { date: "2026-10-20", before: born("2026-10-01") });
    t.ok(await p.ev(`!document.querySelector("#room-btn .diary-new").hidden`), "よむ まえに NEW が ない");
    await p.click("#room-btn");
    await t.sleep(300);
    await p.click(".rs-window");
    await t.sleep(200);
    const list = await shown(p);
    t.eq(list.length, 7, "7 にち ぶん");
    t.eq(list.map(([d]) => d), ["10/20", "10/19", "10/18", "10/17", "10/16", "10/15", "10/14"], "あたらしい じゅん");
    const want = await p.ev(`["2026-10-20", "2026-10-19"].map((d) => tsubuyaki.of(d))`);
    t.eq(list.slice(0, 2).map(([, s]) => s), want, "ひづけの つぶやき");
    t.ok(want[0] !== want[1], "となりの 日が おなじ");
    t.ok(await p.ev(`document.getElementById("tab-diary").textContent === "つぶやき"`), "タブの なまえ");
    t.ok(await p.ev(`!document.querySelector(".tonight") && !document.querySelector(".room-moon")`), "こんやの 3ぎょう・つきの しるしが のこって いる");
    t.ok(await p.ev(`achievements.has("diary")`), "実績「ピクセの つぶやき」が ない");
    await p.shot("tsubuyaki.png");
    await p.ev(`document.getElementById("diary").close()`);
    t.ok(await p.ev(`document.querySelector("#room-btn .diary-new").hidden`), "よんでも NEW が きえない");
    // ?date= の あいだは よんだ ことを のこさない ので、ここまで。であって 3 日めなら 3 こ
    await server.close();
    const again = await open(t, { date: "2026-10-03", before: born("2026-10-01") });
    await again.p.click("#room-btn");
    await t.sleep(300);
    await again.p.click(".rs-window");
    await t.sleep(200);
    t.eq((await shown(again.p)).map(([d]) => d), ["10/3", "10/2", "10/1"], "であう まえの 日が ある");
    t.noErrors(again.p);
    await again.server.close();
  },

  async "きまった 日は きまった つぶやき（ハロウィン）。60 こ ぜんぶ でて くる"(t) {
    const { server, p } = await open(t, { date: "2026-10-31", before: born("2026-10-01") });
    await p.ev(`room.open("diary")`);
    await t.sleep(300);
    t.ok((await shown(p))[0][1].startsWith("トリック オア トリート！"), "ハロウィンの つぶやき で ない");
    // 60 にち つづけると 60 こ ぜんぶ 1 かいずつ（きまった 日は のぞく）
    const seen = await p.ev(`(() => { const s = new Set(); for (let i = 0; i < tsubuyaki.LIST.length; i++) { const d = new Date(Date.UTC(2027, 1, 1 + i, 12)); s.add(tsubuyaki.LIST.indexOf(tsubuyaki.of(d.toISOString().slice(0, 10)))); } return s.size; })()`);
    t.eq(seen, await p.ev(`tsubuyaki.LIST.length`), "でて こない つぶやきが ある");
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
