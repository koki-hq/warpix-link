// ピクセの おみくじ：1 日 1 回、同じ日は同じ結果。ラッキーリンクは v1.52 で やめた
async function openSite(t, storage = "") {
  const server = await t.startServer();
  const b = await t.launchBrowser();
  const p = await b.firstPage();
  await p.goto(server.url);
  await p.ev(`localStorage.clear(); ${storage}`);
  await p.goto(server.url);
  await p.boot();
  return { server, p };
}

export default {
  async "引くと箱がゆれて、運勢とラッキーカラーが出る（ラッキーリンクは ない）"(t) {
    const { server, p } = await openSite(t);
    await p.click("#omikuji-btn");
    await t.sleep(1700);
    const card = await p.ev(`document.querySelector(".omikuji-card").innerText`);
    t.ok(["だいきち", "ちゅうきち", "しょうきち", "きち", "すえきち"].some((f) => card.includes(f)), `運勢がない: ${card}`);
    t.ok(card.includes("ラッキーカラー"), "ラッキーカラーがない");
    t.ok(!card.includes("ラッキーリンク") && !(await p.ev(`Boolean(document.querySelector(".omikuji-link"))`)), "ラッキーリンクが のこって いる");
    t.ok(await p.ev(`achievements.has("omikuji")`), "実績「おみくじ」がない");
    t.ok(await p.ev(`grow.state.diary.some((e) => e.type === "omikuji")`), "日記に書かれない");
    await p.shot("omikuji.png");
    t.noErrors(p);
    await server.close();
  },

  async "同じ日にもう一度引くと、同じ結果（日記も増えない）"(t) {
    const { server, p } = await openSite(t);
    await p.ev(`document.getElementById("omikuji-btn").click()`);
    await t.sleep(1500);
    const first = await p.ev(`document.querySelector(".omikuji-fortune").textContent + "/" + document.querySelector(".omikuji-color").getAttribute("style")`);
    await p.ev(`document.querySelector(".omikuji-close").click()`);
    await p.ev(`document.getElementById("omikuji-btn").click()`);
    await t.sleep(300);
    const second = await p.ev(`document.querySelector(".omikuji-fortune").textContent + "/" + document.querySelector(".omikuji-color").getAttribute("style")`);
    t.eq(second, first, "同じ日なのに結果が変わった");
    t.eq(await p.ev(`grow.state.diary.filter((e) => e.type === "omikuji").length`), 1, "日記が 2 行になった");
    t.noErrors(p);
    await server.close();
  },

  async "日がかわると結果もかわる（同じ日は何度でも同じ）"(t) {
    const { server, p } = await openSite(t);
    const results = await p.ev(`Array.from({ length: 12 }, (_, i) => { const d = "2026-11-" + String(i + 1).padStart(2, "0"); const a = omikuji.draw(d), b = omikuji.draw(d); return [a.fortune.name + a.color.name, b.fortune.name + b.color.name]; })`);
    t.ok(results.every(([a, b]) => a === b), "同じ日なのに結果がちがう");
    t.ok(new Set(results.map(([a]) => a)).size >= 3, "12 日引いても、ほとんど同じ結果しか出ない");
    t.noErrors(p);
    await server.close();
  },
};
