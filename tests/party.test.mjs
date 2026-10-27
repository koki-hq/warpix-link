// リンクの へんせい・パーティ（v1.56）：6 この くみあわせを 3 つまで。2 つ いじょうで はじめて きりかえが でる。じぶんで きりかえる だけ
const icons = (p) => p.ev(`[...document.querySelectorAll(".links .pixel-btn:not(.secret) [data-icon]")].map((el) => el.dataset.icon)`);
const SIX = ["discord", "threads", "bluesky", "pinterest", "twitch", "steam"];

async function open(t, { url = "", before = "" } = {}) {
  const server = await t.startServer();
  const b = await t.launchBrowser();
  const p = await b.firstPage();
  await p.goto(server.url + url);
  await p.ev(`localStorage.clear(); ${before}`);
  await p.goto(server.url + url);
  await p.boot();
  return { server, p };
}
// パーティを ふやす → 6 こ えらぶ → つくる
async function make(p, ids) {
  await p.click("#cassette-btn");
  await p.click("#hensei-add");
  for (const id of ids) await p.ev(`document.querySelector('.cas-item[data-id="${id}"]').click()`);
}

export default {
  async "パーティが 1 つの うちは きりかえが でない。へんせいの メニューは いれかえる・ふやす だけ"(t) {
    const { server, p } = await open(t);
    t.ok(await p.ev(`document.getElementById("party-bar").hidden`), "1 つ なのに きりかえが でた");
    t.eq(await p.ev(`document.getElementById("cassette-btn").textContent.trim()`), "⇄ リンクの へんせい", "ボタンの なまえ");
    await p.click("#cassette-btn");
    t.ok(await p.ev(`document.getElementById("hensei").open`), "メニューが ひらかない");
    t.eq(await p.ev(`[...document.querySelectorAll(".hensei-menu button")].filter((b) => !b.hidden).map((b) => b.textContent)`), ["リンクを いれかえる", "パーティを ふやす"], "メニュー");
    await p.click("#hensei-swap");
    t.ok(await p.ev(`document.getElementById("cassette").open && !document.getElementById("hensei").open`), "いれかえる で カセット えらびに ならない");
    t.ok(await p.ev(`!document.getElementById("cas-share") && !document.getElementById("cas-gift")`), "おすそわけが のこって いる");
    t.noErrors(p);
    await server.close();
  },

  async "ふやすは 6 こ そろった ところで その ばで できる（つくる ボタンは ない、v1.64）。とちゅうで とじたら のこらない。PARTY 2 に なって きりかえが でる"(t) {
    const { server, p } = await open(t);
    const ids = await p.ev(`CASSETTES.LIST.map((c) => c.id).filter((id) => !CASSETTES.current().includes(id)).slice(0, 6)`);
    await make(p, ids.slice(0, 3));
    t.eq(await p.ev(`document.getElementById("cassette-title").textContent`), "PARTY 2 を つくる", "みだし");
    t.eq(await p.ev(`document.querySelectorAll(".cas-slot.empty").length`), 3, "のこりは まだ えらんでない");
    t.ok(await p.ev(`!document.getElementById("cas-make") && CASSETTES.parties().length === 1`), "6 こ そろう まえに できた か、つくる ボタンが ある");
    await p.shot("party-make.png");
    await p.ev(`document.getElementById("cassette").close()`);
    t.eq(await p.ev(`CASSETTES.parties().length`), 1, "つくりかけが のこった");
    await make(p, ids);
    await t.sleep(300);
    t.eq(await p.ev(`CASSETTES.parties().length`), 2, "6 こ そろっても できない");
    t.ok(await p.ev(`document.getElementById("cassette").open && document.getElementById("cassette-title").textContent === "PARTY 2 の リンク"`), "できた あと いれかえの まどに ならない");
    await p.ev(`document.getElementById("cassette-close").click()`);
    t.eq(await icons(p), ids, "あたらしい パーティの リンクに ならない");
    t.ok(!(await p.ev(`document.getElementById("party-bar").hidden`)), "2 つ に なっても きりかえが でない");
    t.eq(await p.ev(`document.getElementById("party-name").textContent`), "PARTY 2", "なまえ");
    await p.shot("party-bar.png");
    // きりかえ
    const first = await p.ev(`CASSETTES.parties()[0].ids`);
    await p.click("#party-prev");
    t.eq(await icons(p), first, "◀ で PARTY 1 に もどらない");
    t.eq(await p.ev(`document.getElementById("party-name").textContent`), "PARTY 1", "なまえ が かわらない");
    // ひらきなおしても いま つかって いる パーティの まま
    await p.click("#party-next");
    await p.goto(server.url);
    await p.boot();
    t.eq(await icons(p), ids, "ひらきなおすと PARTY 1 に もどった");
    t.noErrors(p);
    await server.close();
  },

  async "なまえを かえる・けす（2 かい おし）。3 つ あると もう ふやせない"(t) {
    const more = (n) => JSON.stringify({ at: 1, name: "", more: Array.from({ length: n }, () => ({ name: "", ids: SIX })) });
    const { server, p } = await open(t, { before: `localStorage.setItem("warpix-parties", ${JSON.stringify(more(2))})` });
    t.eq(await p.ev(`CASSETTES.parties().length`), 3, "3 つ よめない");
    await p.click("#cassette-btn");
    t.ok(await p.ev(`document.getElementById("hensei-add").hidden`), "3 つ なのに ふやせる");
    await p.shot("hensei.png");
    t.ok(await p.ev(`getComputedStyle(document.getElementById("hensei-name")).display === "none"`), "なまえの らんが はじめから みえる");
    await p.click("#hensei-rename");
    await p.ev(`document.getElementById("hensei-input").value = "ねるまえ"; document.getElementById("hensei-name").requestSubmit()`);
    t.eq(await p.ev(`document.getElementById("party-name").textContent`), "ねるまえ", "なまえが かわらない");
    t.eq(JSON.parse(await p.ev(`localStorage.getItem("warpix-parties")`)).more[0].name, "ねるまえ", "なまえを おぼえない");
    await p.click("#hensei-remove");
    t.eq(await p.ev(`CASSETTES.parties().length`), 3, "1 かいで けえた");
    await p.click("#hensei-remove");
    t.eq(await p.ev(`CASSETTES.parties().length`), 2, "2 かい おしても けせない");
    t.eq(await p.ev(`CASSETTES.at()`), 0, "けしたら PARTY 1 に もどらない");
    t.ok(!(await p.ev(`document.getElementById("hensei-add").hidden`)), "けしたら また ふやせる");
    t.noErrors(p);
    await server.close();
  },

  async "こわれた パーティは つかわない。1 つに もどると warpix-parties は けす"(t) {
    const bad = JSON.stringify({ at: 5, name: "", more: [{ name: "x", ids: ["youtube"] }, { ids: ["nope", 1, 2, 3, 4, 5] }] });
    const { server, p } = await open(t, { before: `localStorage.setItem("warpix-parties", ${JSON.stringify(bad)})` });
    t.eq(await p.ev(`CASSETTES.parties().length`), 1, "こわれた パーティを よんだ");
    t.eq(await p.ev(`CASSETTES.at()`), 0, "ありえない ばんごう");
    await p.ev(`CASSETTES.addParty(${JSON.stringify(SIX)}); CASSETTES.removeParty(1)`);
    t.eq(await p.ev(`localStorage.getItem("warpix-parties")`), null, "1 つ なのに のこって いる");
    t.noErrors(p);
    await server.close();
  },

  async "うごきを へらす・よみやすい もじ でも、きりかえた あと リンクが みえる（v1.65.1：すけて きえて いた）"(t) {
    const parties = JSON.stringify({ at: 0, name: "", more: [{ name: "", ids: SIX }] });
    const { server, p } = await open(t, { before: `localStorage.setItem("warpix-settings", ${JSON.stringify(JSON.stringify({ motion: "reduce", font: "plain" }))}); localStorage.setItem("warpix-parties", ${JSON.stringify(parties)})` });
    await p.click("#party-next");
    await t.sleep(600);
    t.eq(await icons(p), SIX, "きりかわらない");
    t.eq(await p.ev(`[...document.querySelectorAll(".links .pixel-btn:not(.secret)")].map((e) => getComputedStyle(e).opacity)`), ["1", "1", "1", "1", "1", "1"], "リンクが すけて いる");
    t.noErrors(p);
    await server.close();
  },
};
