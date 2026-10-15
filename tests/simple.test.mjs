// シンプルモード：リンクだけの静かなページ
const look = (p) => p.ev(`({
  simple: document.documentElement.classList.contains("simple"),
  start: !document.getElementById("start-screen").hidden && getComputedStyle(document.getElementById("start-screen")).display !== "none",
  booted: document.body.classList.contains("booted"),
  links: getComputedStyle(document.querySelector(".pixel-btn")).opacity,
  npc: getComputedStyle(document.querySelector(".npc")).display !== "none",
  hud: getComputedStyle(document.querySelector(".hud")).display !== "none",
  toggle: document.getElementById("simple-toggle").textContent,
})`);

export default {
  async "?simple=1 でリンクだけがすぐ出て、押しても演出なし"(t) {
    const server = await t.startServer();
    const b = await t.launchBrowser();
    const p = await b.firstPage();
    await p.goto(`${server.url}?simple=1`);
    const s = await look(p);
    t.ok(s.simple && !s.start && !s.booted, "シンプルモードになっていない");
    t.eq(s.links, "1", "リンクがすぐ見えない");
    t.ok(!s.npc && !s.hud, "ピクセや HUD が出ている");
    await p.ev(`document.querySelector(".pixel-btn").addEventListener("click", (e) => e.preventDefault(), { once: true }); document.querySelector(".pixel-btn").click()`);
    t.eq(await p.ev(`document.querySelector("[data-score]").textContent`), "000000", "点数が入った");
    await p.shot("simple.png");
    t.noErrors(p);
    await server.close();
  },

  async "スタート画面から入って、保存され、「▶ あそぶ」で戻る"(t) {
    const server = await t.startServer();
    const b = await t.launchBrowser();
    const p = await b.firstPage();
    await p.goto(server.url);
    await p.ev(`localStorage.clear()`);
    await p.goto(server.url);
    await p.ev(`document.getElementById("simple-enter").click()`);
    await t.sleep(1500);
    t.ok((await look(p)).simple, "スタート画面から入れない");
    await p.send("Page.reload");
    await t.sleep(1200);
    t.ok((await look(p)).simple, "開き直すとシンプルモードでなくなる");
    await p.ev(`document.getElementById("start-btn").click()`);
    await t.sleep(500);
    t.ok(!(await look(p)).booted, "シンプルモードなのに演出が始まった");
    await p.ev(`document.getElementById("simple-toggle").click()`);
    await t.sleep(1500);
    const back = await look(p);
    t.ok(!back.simple && back.start, "「▶ あそぶ」で戻らない");
    t.noErrors(p);
    await server.close();
  },
};
