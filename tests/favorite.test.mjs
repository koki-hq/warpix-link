// お気に入りのリンク：覚える、ハート、そっと勧める、押しつけない
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
  async "3 回行くとハートが付き、日記に書かれる"(t) {
    const { server, p } = await open(t);
    await p.boot();
    for (let i = 0; i < 3; i++) await p.ev(`document.querySelector(".pixel-btn").click()`);
    t.eq(await p.ev(`JSON.parse(localStorage.getItem("warpix-links")).youtube.n`), 3, "回数");
    t.ok(await p.ev(`!!document.querySelector(".pixel-btn .fav-mark")`), "ハートが付かない");
    t.ok(await p.ev(`document.querySelectorAll(".pixel-btn")[0].contains(document.querySelector(".fav-mark"))`), "ハートが YOUTUBE に付いていない");
    t.eq(await p.ev(`grow.state.diary.filter((e) => e.type === "warp").map((e) => e.text)`), ["YOUTUBEへ ワープした。"], "日記（1 日 1 行）");
    await p.shot("favorite-heart.png");
    t.noErrors(p);
    await server.close();
  },

  async "次の日、あいさつのあとにそっと勧めて、「いく！」でそのリンクへ"(t) {
    const { server, p } = await open(t, { "warpix-links": { youtube: { n: 5, last: dayAgo(1) }, twitter: { n: 1, last: dayAgo(1) } } });
    await p.boot();
    await t.sleep(2500);
    t.eq(await choices(p), ["いく！", "きょうは ちがう"], "勧めてこない");
    t.ok((await p.text()).includes("YOUTUBE"), "お気に入りの名前を言わない");
    await p.click(".dialog-choices button");
    await t.sleep(300);
    t.eq(await p.ev(`window.__opened`), ["youtube"], "そのリンクへ行かない");
    t.eq(await p.ev(`JSON.parse(localStorage.getItem("warpix-links")).youtube.n`), 6, "行った回数が増えない");
    // 同じ日にもう一度来ても、もう聞かない
    await p.goto(server.url);
    await p.boot();
    await t.sleep(2500);
    t.eq(await choices(p), [], "同じ日に 2 回聞いた");
    t.noErrors(p);
    await server.close();
  },

  async "「いく！」は、ポップアップとして止められずに本当に新しいタブで開く"(t) {
    const server = await t.startServer();
    const b = await t.launchBrowser();
    const p = await b.firstPage();
    await p.goto(server.url);
    await p.ev(`localStorage.clear(); localStorage.setItem("warpix-links", JSON.stringify({ youtube: { n: 5, last: "2000-01-01" } }))`);
    await p.goto(server.url);
    await p.boot();
    await t.sleep(2500);
    const tabs = async () => (await (await fetch(`http://127.0.0.1:${b.port}/json`)).json()).filter((x) => x.type === "page").map((x) => x.url);
    const before = await tabs();
    await p.click(".dialog-choices button"); // 本物のクリック（ユーザーの操作）で選ぶ
    await t.sleep(1500);
    const after = await tabs();
    t.ok(after.length === before.length + 1, `新しいタブが開かない: ${before.length} → ${after.length}`);
    t.ok(after.some((u) => u.includes("youtube.com")), `開いたタブの行き先: ${after.join(", ")}`);
    t.noErrors(p);
    await server.close();
  },

  async "2 回続けて断ると、1 週間は聞かない"(t) {
    const { server, p } = await open(t, {
      "warpix-links": { booth: { n: 4, last: dayAgo(2) } },
      "warpix-fav-ask": { last: dayAgo(1), declines: 1, snoozeUntil: null },
    });
    await p.boot();
    await t.sleep(2500);
    t.eq(await choices(p), ["いく！", "きょうは ちがう"], "勧めてこない");
    await p.ev(`document.querySelectorAll(".dialog-choices button")[1].click()`);
    await t.sleep(2000);
    const ask = await p.ev(`JSON.parse(localStorage.getItem("warpix-fav-ask"))`);
    t.eq(ask.snoozeUntil, (() => { const d = new Date(); d.setDate(d.getDate() + 7); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; })(), "1 週間後まで休む日付");
    t.eq(await p.ev(`window.__opened`), [], "断ったのにリンクへ行った");
    t.ok((await p.text()).startsWith("そっか"), `断ったときのセリフ: ${await p.text()}`);
    t.noErrors(p);
    await server.close();
  },

  async "しばらく行っていないリンクを、ひとこと思い出させる"(t) {
    const { server, p } = await open(t, { "warpix-links": { spotify: { n: 2, last: dayAgo(20) } } });
    await p.boot();
    await t.sleep(2500);
    t.ok((await p.text()).includes("SPOTIFYに いってないね"), `思い出させない: ${await p.text()}`);
    t.eq(await choices(p), [], "勧める質問は出さない（お気に入りはまだない）");
    t.noErrors(p);
    await server.close();
  },

  async "シンプルモードでも数えて、10 回で実績"(t) {
    const { server, p } = await open(t, { "warpix-links": { tumblr: { n: 9, last: dayAgo(1) } } }, "?simple=1");
    await p.ev(`document.querySelectorAll(".pixel-btn")[4].click()`);
    t.eq(await p.ev(`JSON.parse(localStorage.getItem("warpix-links")).tumblr.n`), 10, "シンプルモードで数えない");
    t.ok(await p.ev(`achievements.has("regular")`), "実績「いつもの せかい」がない");
    t.ok(await p.ev(`document.querySelectorAll(".pixel-btn")[4].contains(document.querySelector(".fav-mark"))`), "シンプルモードでもハートが付く");
    t.noErrors(p);
    await server.close();
  },
};
