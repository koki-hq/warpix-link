// ワープした かず：リンクごとに かぞえる。ハートは v1.52.1 で やめた。すすめない（v1.52 チューニング）
const dayAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

// 保存された記録を入れてから開く
async function open(t, storage = {}, query = "") {
  const server = await t.startServer();
  const b = await t.launchBrowser();
  const p = await b.firstPage();
  await p.goto(server.url);
  const sets = Object.entries(storage).map(([k, v]) => `localStorage.setItem(${JSON.stringify(k)}, ${JSON.stringify(JSON.stringify(v))});`).join("");
  await p.ev(`localStorage.clear(); ${sets}`);
  await p.goto(server.url + query);
  // リンクを押しても、本当には開かない（押されたかどうかだけ記録）
  await p.ev(`window.__opened = []; document.querySelectorAll(".pixel-btn").forEach((a) => a.addEventListener("click", (e) => { e.preventDefault(); window.__opened.push(a.querySelector("[data-icon]").dataset.icon); }))`);
  return { server, p };
}
const choices = (p) => p.ev(`[...document.querySelectorAll(".dialog-choices button")].map((b) => b.textContent)`);

export default {
  async "3 回 いくと かずが ふえ、にっきに かかれる。ハートは つかない（v1.52.1）"(t) {
    const { server, p } = await open(t);
    await p.boot();
    for (let i = 0; i < 3; i++) await p.ev(`document.querySelector(".pixel-btn").click()`);
    t.eq(await p.ev(`JSON.parse(localStorage.getItem("warpix-links")).youtube.n`), 3, "回数");
    t.ok(await p.ev(`!document.querySelector(".fav-mark")`), "ハートが ついた");
    t.eq(await p.ev(`favorite.total()`), 3, "ワープした かず");
    t.eq(await p.ev(`grow.state.diary.filter((e) => e.type === "warp").map((e) => e.text)`), ["YOUTUBEへ ワープした。"], "日記（1 日 1 行）");
    await p.ev(`room.open("diary")`);
    await t.sleep(300);
    t.ok((await p.ev(`document.querySelector(".diary-head").innerText`)).includes("ワープした かず\n3かい"), "プロフィールに ワープした かず が ない");
    t.ok(!(await p.ev(`document.querySelector(".diary-head").innerText`)).includes("よく いく"), "よく いく せかい が のこって いる");
    t.noErrors(p);
    await server.close();
  },

  async "ピクセは すすめない・思い出させない（v1.52）"(t) {
    // お気に入りが ある・しばらく 行って いない リンクが ある・まだ 行って いない リンクが ある、を ぜんぶ そろえる
    const { server, p } = await open(t, {
      "warpix-visits": 5,
      "warpix-links": { youtube: { n: 5, last: dayAgo(1) }, twitter: { n: 3, last: dayAgo(20) } },
    });
    await p.boot();
    await t.sleep(4000);
    t.eq(await choices(p), [], "きいて きた");
    const text = await p.text();
    t.ok(!/YOUTUBE|TWITTER|いってないね|いったこと ない/.test(text), `すすめた: ${text}`);
    t.noErrors(p);
    await server.close();
  },

  async "シンプルモードでも数えて、10 回で実績"(t) {
    const { server, p } = await open(t, { "warpix-links": { tumblr: { n: 9, last: dayAgo(1) } } }, "?simple=1");
    await p.ev(`document.querySelectorAll(".pixel-btn")[4].click()`);
    t.eq(await p.ev(`JSON.parse(localStorage.getItem("warpix-links")).tumblr.n`), 10, "シンプルモードで数えない");
    t.ok(await p.ev(`achievements.has("regular")`), "実績「いつもの せかい」がない");
    t.noErrors(p);
    await server.close();
  },
};
