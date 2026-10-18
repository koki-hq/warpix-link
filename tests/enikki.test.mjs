// ピクセの ワープえにっき（v1.44）：ワープさきから もどるたびに、その せかいの えにっきを 1 ページ
async function page(t) {
  const server = await t.startServer();
  const b = await t.launchBrowser();
  const p = await b.firstPage();
  await p.goto(server.url);
  await p.ev(`localStorage.clear()`);
  await p.goto(server.url + "?away=0");
  await p.boot();
  return { server, p };
}
const back = (p, icon, line, left = true) => p.ev(`emit("warp-back", { icon: "${icon}", left: ${left}, label: "${icon.toUpperCase()}", line: ${JSON.stringify(line)} })`);

export default {
  async "ほんとうに いって もどると 1 ページ。おなじ せかいは 1 日 1 ページ、いかなかった ときは なし"(t) {
    const { server, p } = await page(t);
    await back(p, "spotify", "ただいま！ おんがくの せかいで\nずっと ゆれてた♪");
    await back(p, "spotify", "ただいま！ もう いっかい");
    await back(p, "youtube", "ただいま！", false);
    const saved = await p.ev(`JSON.parse(localStorage.getItem("warpix-enikki"))`);
    t.eq(saved.map((s) => [s.icon, s.shelf]), [["spotify", "default"]], "ページ");
    t.eq(saved[0].line, "ただいま！ おんがくの せかいで\nずっと ゆれてた♪", "セリフ");
    await p.ev(`room.open("diary")`);
    await t.sleep(500);
    t.eq(await p.ev(`document.querySelectorAll(".enikki-btn img").length`), 1, "にっきに ページが ない");
    t.ok((await p.ev(`document.querySelector(".enikki-btn").getAttribute("aria-label")`)).includes("SPOTIFY の せかいの えにっき"), "よみあげの なまえ");
    await p.ev(`document.querySelector(".enikki-btn").click()`);
    await t.sleep(1200);
    t.eq(await p.ev(`document.querySelector(".postcard")?.getAttribute("aria-label")`), "ピクセの ワープえにっき", "大きく みられない");
    t.ok(await p.ev(`document.querySelector(".postcard-save").download.startsWith("warpix-enikki-")`), "ほぞんの なまえ");
    t.noErrors(p);
    await server.close();
  },

  async "5 ページ たまると 実績「ワープえにっき」。えは 600×420"(t) {
    const { server, p } = await page(t);
    for (const icon of ["youtube", "twitter", "instagram", "booth"]) await back(p, icon, "ただいま！");
    t.ok(!(await p.ev(`achievements.has("enikki")`)), "4 ページで とれた");
    await back(p, "key", "ただいま！ ひみつの こうじょうを\nのぞいてきた。コードが いっぱい！");
    t.ok(await p.ev(`achievements.has("enikki")`), "5 ページで とれない");
    t.eq(await p.ev(`(() => { const cv = enikki.draw(enikki.pages()[0]); return [cv.width, cv.height, enikki.pages()[0].shelf, enikki.pages()[0].label]; })()`), [600, 420, "secret", "ひみつの こうじょう"], "え");
    t.noErrors(p);
    await server.close();
  },

  async "ほんものの ワープ ダイブで もどると、その ときの セリフで ページが できる"(t) {
    const { server, p } = await page(t);
    await p.ev(`(() => { window.__hidden = false; Object.defineProperty(document, "hidden", { get: () => window.__hidden }); })()`);
    await p.ev(`window.open = () => null; document.querySelectorAll(".pixel-btn").forEach((a) => a.addEventListener("click", (e) => e.preventDefault()))`);
    await p.ev(`document.querySelector('.pixel-btn [data-icon="youtube"]').closest(".pixel-btn").click()`);
    await t.sleep(900);
    await p.ev(`window.__hidden = true; document.dispatchEvent(new Event("visibilitychange"))`);
    await t.sleep(500);
    await p.ev(`window.__hidden = false; document.dispatchEvent(new Event("visibilitychange"))`);
    let pages = [];
    for (let i = 0; i < 30 && !pages.length; i++) {
      await t.sleep(200);
      pages = await p.ev(`enikki.pages()`);
    }
    t.eq(pages.map((x) => x.icon), ["youtube"], "ページが できない");
    t.ok(pages[0].line.startsWith("ただいま！"), `セリフ: ${pages[0].line}`);
    t.noErrors(p);
    await server.close();
  },
};
