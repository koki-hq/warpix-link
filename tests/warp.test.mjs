// ワープ ダイブ（v1.27）：リンクを おすと ピクセが ワープあなに とびこみ、もどってくると あなから でてくる
// リンクは ほんとうには ひらかない（いちばん さいごに ページが とめる）。タブを うつったふりは document.hidden を にせもので
const setup = (p) => p.ev(`(() => {
  window.__prevented = [];
  addEventListener("click", (e) => { if (e.target.closest(".pixel-btn")) { __prevented.push(e.defaultPrevented); e.preventDefault(); } });
  let hid = false;
  Object.defineProperty(document, "hidden", { get: () => hid, configurable: true });
  window.__hide = (v) => { hid = v; document.dispatchEvent(new Event("visibilitychange")); };
})()`);
const look = (p) => p.ev(`({
  away: npc.isAway(),
  holes: document.querySelectorAll(".warp-hole").length,
  pixes: document.querySelectorAll(".warp-pixe").length,
  trip: !!warpDive.trip(),
  text: document.getElementById("dialog-text").textContent,
})`);

async function open(t, { before = "" } = {}) {
  const server = await t.startServer();
  const b = await t.launchBrowser();
  const p = await b.firstPage();
  await p.goto(server.url);
  await p.ev(`localStorage.clear(); ${before}`);
  await p.goto(server.url);
  await p.boot();
  await setup(p);
  return { server, p };
}

export default {
  async "おすと あなに とびこみ、タブを うつって もどると あなから でてきて「ただいま」"(t) {
    const { server, p } = await open(t);
    await p.ev(`document.querySelector('.pixel-btn [data-icon="spotify"]').closest(".pixel-btn").click()`);
    t.eq(await p.ev(`__prevented`), [false], "リンクの ひらきかたを じゃました");
    await t.sleep(200);
    let s = await look(p);
    t.ok(s.away && s.holes === 1 && s.pixes === 1, `とびこまない（${JSON.stringify(s)}）`);
    t.ok(await p.ev(`(() => { const h = document.querySelector(".warp-hole").getBoundingClientRect(), b = document.querySelector('[data-icon="spotify"]').closest(".pixel-btn").getBoundingClientRect(); return h.top >= b.top - 4 && h.bottom <= b.bottom + 4 && h.right <= b.right; })()`), "あなが リンクの うえに ない");
    await p.ev(`__hide(true)`);
    await t.sleep(1500);
    s = await look(p);
    t.ok(s.away && s.holes === 0 && s.pixes === 0, `るすの あいだに あなが のこっている（${JSON.stringify(s)}）`);
    await p.ev(`__hide(false)`);
    await t.sleep(700);
    s = await look(p);
    t.ok(s.holes === 1 && s.pixes === 1, `もどっても あなから でてこない（${JSON.stringify(s)}）`);
    await t.sleep(1500);
    s = await look(p);
    t.ok(!s.away && !s.trip && s.holes === 0 && s.pixes === 0, `はこに もどらない（${JSON.stringify(s)}）`);
    t.ok(s.text.startsWith("ただいま！"), `おみやげばなし: ${s.text}`);
    t.ok(await p.ev(`achievements.has("warp-buddy")`), "実績「いっしょに ワープ」");
    t.eq(await p.ev(`grow.state.diary.at(-1).text`), "SPOTIFY の せかいへ いっしょに ワープした。", "にっき");
    t.noErrors(p);
    await server.close();
  },

  async "タブを うつらなければ、だまって はこに もどる"(t) {
    const { server, p } = await open(t);
    await p.ev(`document.querySelectorAll(".pixel-btn")[0].click()`);
    await t.sleep(300);
    t.ok((await look(p)).away, "とびこまない");
    await t.sleep(3600);
    const s = await look(p);
    t.ok(!s.away && !s.trip && s.holes === 0 && s.pixes === 0, `もどらない（${JSON.stringify(s)}）`);
    t.ok(!s.text.startsWith("ただいま"), "いってないのに おみやげばなし");
    t.ok(await p.ev(`!achievements.has("warp-buddy")`), "いってないのに 実績");
    t.noErrors(p);
    await server.close();
  },

  async "れんだしても とびこむのは 1 かいで、リンクは ぜんぶ ワープする"(t) {
    const { server, p } = await open(t);
    await p.ev(`const b = document.querySelectorAll(".pixel-btn"); b[1].click(); b[2].click(); b[1].click();`);
    await t.sleep(200);
    const s = await look(p);
    t.ok(s.holes === 1 && s.pixes === 1, `あなや ピクセが ふえた（${JSON.stringify(s)}）`);
    t.eq(await p.ev(`__prevented`), [false, false, false], "リンクを じゃました");
    t.eq(await p.ev(`document.querySelector("[data-score]").textContent`), "000300", "てんすう");
    t.noErrors(p);
    await server.close();
  },

  async "うごきを へらす せってい・シンプルモードでは とびこまない"(t) {
    for (const before of [`localStorage.setItem("warpix-settings", JSON.stringify({ motion: "reduce" }))`, `localStorage.setItem("warpix-simple", "on")`]) {
      const server = await t.startServer();
      const b = await t.launchBrowser();
      const p = await b.firstPage();
      await p.goto(server.url);
      await p.ev(`localStorage.clear(); ${before}`);
      await p.goto(server.url);
      if (!before.includes("simple")) await p.boot();
      await setup(p);
      await p.ev(`document.querySelectorAll(".pixel-btn")[0].click()`);
      await t.sleep(300);
      const s = await look(p);
      t.ok(!s.away && !s.trip && s.holes === 0, `${before.includes("simple") ? "シンプルモード" : "うごきを へらす"}で とびこんだ`);
      t.eq(await p.ev(`__prevented`), [false], "リンクを じゃました");
      t.noErrors(p);
      await server.close();
    }
  },
};
