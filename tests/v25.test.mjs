// v2.5：タブの ＋ で ワンタップ・なまえは なくても いい、へんしゅう ちゅうに はしで となりの グループへ、
// 作った リンクは「じぶんで つくる」の 一覧で 追加、画像の 読みこみ ちゅう
import { openApp, groupsData, noNavigate, sleep } from "./lib/app.mjs";

const center = (p, sel) => p.ev(`(() => { const r = document.querySelector(${JSON.stringify(sel)}).getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; })()`);
const mouse = (p, type, x, y) => p.send("Input.dispatchMouseEvent", { type, x, y, button: "left", buttons: type === "mouseReleased" ? 0 : 1, clickCount: 1 });
const groupIds = (p) => p.ev(`CASSETTES.groups().map((g) => [g.title, g.ids])`);
// へんしゅう ちゅうに して、つかんで はしへ。wait ミリ秒 まって、x2 で はなす
async function dragToEdge(p, id, { side = 1, wait = 700, drop = null } = {}) {
  await p.ev(`editMode.enter()`);
  await sleep(100);
  const a = await center(p, `.links .pixel-btn[data-id="${id}"]`);
  await mouse(p, "mouseMoved", a.x, a.y);
  await mouse(p, "mousePressed", a.x, a.y);
  const ex = side > 0 ? 385 : 5;
  for (let i = 1; i <= 8; i++) await mouse(p, "mouseMoved", a.x + ((ex - a.x) * i) / 8, a.y);
  await sleep(wait);
  const to = drop ?? { x: ex, y: a.y };
  await mouse(p, "mouseMoved", (ex + to.x) / 2, (a.y + to.y) / 2);
  await mouse(p, "mouseMoved", to.x, to.y);
  await mouse(p, "mouseReleased", to.x, to.y);
  await sleep(150);
}

export default {
  async "タブの ＋：ワンタップで「ぐるーぷN」（あいて いる ばんごう）。右上は から でも つくれる"(t) {
    const { server, p } = await openApp(t, { storage: { "warpix-v2-groups": groupsData([["ぐるーぷ1", ["youtube"]], ["ぐるーぷ3", []]]) } });
    await p.click("#group-new");
    await sleep(150);
    t.eq(await p.ev(`[CASSETTES.current().title, CASSETTES.groups().length, document.getElementById("group-title").textContent]`), ["ぐるーぷ2", 3, "ぐるーぷ2"], "あいて いる ばんごうで できない・きりかわらない");
    await p.click("#add-group");
    await sleep(150);
    t.eq(await p.ev(`document.getElementById("group-name").placeholder`), "ぐるーぷ4", "うすい 字が つぎの なまえで ない");
    await p.ev(`document.getElementById("group-form").requestSubmit()`);
    await sleep(200);
    t.eq(await p.ev(`CASSETTES.current().title`), "ぐるーぷ4", "から で つくれない");
    t.ok(await p.ev(`document.getElementById("add-dialog").open`), "右上は リンクの まどへ すすまない");
    t.noErrors(p);
    await server.close();
  },

  async "へんしゅう ちゅうに つかんで はしで まつと となりの グループへ うつせる。はしより さきは ない"(t) {
    const { server, p } = await openApp(t, { storage: { "warpix-v2-groups": groupsData([["A", ["youtube", "spotify"]], ["B", ["line"]], ["C", ["discord"]]]) } });
    await noNavigate(p);
    // 右の はしで 0.7 びょう → B へ（1 かい だけ めくる）
    await dragToEdge(p, "spotify", { wait: 700 });
    t.eq(await groupIds(p), [["A", ["youtube"]], ["B", ["line", "spotify"]], ["C", ["discord"]]], "となりへ うつらない");
    t.eq(await p.ev(`CASSETTES.current().title`), "B", "うつした さきが ひらいて いない");
    t.ok(await p.ev(`editMode.on() && !document.getElementById("link-sheet").open`), "へんしゅう ちゅうが おわった・まどが ひらいた");
    t.eq(await p.ev(`JSON.parse(localStorage.getItem("warpix-v2-groups")).list.map((g) => g.ids)`), [["youtube"], ["line", "spotify"], ["discord"]], "ほぞん されない");
    // はしで まちつづけると つぎ つぎ（B → C → さきは ない）
    await dragToEdge(p, "line", { wait: 1700 });
    t.eq(await groupIds(p), [["A", ["youtube"]], ["B", ["spotify"]], ["C", ["discord", "line"]]], "つづけて めくれない・はしを こえた");
    // 左へ 2 つ もどす
    await dragToEdge(p, "line", { side: -1, wait: 1200 });
    t.eq((await groupIds(p))[0], ["A", ["youtube", "line"]], "左へ うつらない");
    // すぐ はなす（0.5 びょう まで いない）なら うつらない
    await dragToEdge(p, "line", { side: 1, wait: 100 });
    t.eq(await p.ev(`CASSETTES.current().title`), "A", "はしに ちょっと ふれた だけで めくれた");
    t.noErrors(p);
    await server.close();
  },

  async "うつした さきに もう ある・いっぱい なら もどす"(t) {
    const full = ["youtube", "spotify", "twitter", "instagram", "tiktok", "ytmusic", "applemusic", "line", "discord", "soundcloud", "niconico", "booth"];
    const { server, p } = await openApp(t, { storage: { "warpix-v2-groups": groupsData([["A", ["youtube", "note"]], ["B", ["youtube"]], ["C", full]]) } });
    await noNavigate(p);
    const before = await groupIds(p);
    await dragToEdge(p, "youtube", { wait: 700 });
    t.eq(await groupIds(p), before, "もう ある のに うつった");
    t.eq(await p.ev(`CASSETTES.current().title`), "A", "もとの グループに もどらない");
    t.ok((await p.ev(`document.getElementById("dialog-text").textContent`)).length > 0, "ピクセが いわない");
    // B を とおりこして いっぱいの C へ
    await dragToEdge(p, "note", { wait: 1700 });
    t.eq(await groupIds(p), before, "いっぱい なのに うつった");
    t.eq(await p.ev(`CASSETTES.current().title`), "A", "もとの グループに もどらない");
    t.noErrors(p);
    await server.close();
  },

  async "作った リンクは「じぶんで つくる」の 下の 一覧：おすと 追加・もう いちど で とりけし。おなじ アドレスは その 行を ひからせる"(t) {
    const { server, p } = await openApp(t, {
      storage: {
        "warpix-v2-groups": groupsData([["A", ["my-1"]], ["B", []]], 1),
        "warpix-v2-mylinks": [{ id: "my-1", label: "バンド", url: "https://band.example.jp/", icon: "music" }],
      },
    });
    await p.click("#link-add");
    await sleep(150);
    // あたらしく つくる が うえ、一覧は した
    const order = await p.ev(`document.getElementById("mylink-name").compareDocumentPosition(document.getElementById("mylink-list")) & Node.DOCUMENT_POSITION_FOLLOWING`);
    t.ok(order > 0, "一覧が つくる より うえ");
    t.eq(await p.ev(`document.querySelector('#mylink-list [data-pick="my-1"]').getAttribute("aria-pressed")`), "false", "B に はいって いる ことに なって いる");
    await p.ev(`document.querySelector('#mylink-list [data-pick="my-1"]').click()`);
    t.eq(await p.ev(`[CASSETTES.current().ids, document.querySelector('#mylink-list [data-pick="my-1"]').getAttribute("aria-pressed"), document.querySelector('#mylink-list [data-pick="my-1"] .cas-check').textContent]`), [["my-1"], "true", "✓"], "おしても 追加 されない");
    await p.ev(`document.querySelector('#mylink-list [data-pick="my-1"]').click()`);
    t.eq(await p.ev(`CASSETTES.current().ids`), [], "もう いちど おしても とりけせない");
    // おなじ アドレスを つくろうと すると
    await p.ev(`document.getElementById("mylink-name").value = "べつ"; document.getElementById("mylink-url").value = "https://band.example.jp"; document.getElementById("add-done").click()`);
    await sleep(100);
    t.eq(await p.ev(`document.getElementById("mylink-error").textContent`), "もう作ってあるよ。下の一覧から押してね。", "ことばが ちがう");
    t.ok(await p.ev(`document.querySelector('#mylink-list [data-pick="my-1"]').closest(".mylink-row").classList.contains("flash")`), "行が ひからない");
    t.eq(await p.ev(`CASSETTES.mine().length`), 1, "おなじ ものが できた");
    t.noErrors(p);
    await server.close();
  },

  async "画像の 読みこみ：はやければ 出さない、0.3 びょう より かかると ピクセと「画像を読み込み中…」、出したら 0.6 びょうは のこす"(t) {
    const { server, p } = await openApp(t, { storage: { "warpix-v2-groups": groupsData([["A", ["youtube"]]]) } });
    // decode を おそく する
    await p.ev(`window.__slow = 0; const d = HTMLImageElement.prototype.decode; HTMLImageElement.prototype.decode = function () { return new Promise((r) => setTimeout(r, window.__slow)).then(() => d.call(this)); }`);
    const file = `(async () => { const c = document.createElement("canvas"); c.width = 40; c.height = 80; c.getContext("2d").fillRect(0, 0, 40, 80); const b = await new Promise((r) => c.toBlob(r, "image/png")); return new File([b], "a.png", { type: "image/png" }); })()`;
    await p.ev(`(async () => { window.__seen = false; const o = new MutationObserver(() => document.getElementById("busy-dialog").open && (window.__seen = true)); o.observe(document.getElementById("busy-dialog"), { attributes: true }); await photoBg.openTrim(await ${file}, { where: "menu", replace: null }); })()`);
    t.ok(await p.ev(`!window.__seen && document.getElementById("trim-dialog").open`), "はやいのに 出た");
    await p.ev(`document.getElementById("trim-dialog").close()`);
    await p.ev(`window.__log = []; const bd = document.getElementById("busy-dialog"); new MutationObserver(() => __log.push(["busy", bd.open, Math.round(performance.now())])).observe(bd, { attributes: true }); const td = document.getElementById("trim-dialog"); new MutationObserver(() => __log.push(["trim", td.open, Math.round(performance.now())])).observe(td, { attributes: true }); __log.push(["start", Math.round(performance.now())])`);
    await p.ev(`window.__slow = 400; window.__p = (async () => photoBg.openTrim(await ${file}, { where: "menu", replace: null }))()`);
    await p.ev(`window.__p`);
    t.eq(await p.ev(`[document.getElementById("busy-text").textContent, !!document.querySelector("#busy-pixe svg")]`), ["画像を読み込み中…", true], "ことば・ピクセが ちがう");
    const log = await p.ev(`__log`);
    const at = (name, open) => log.find((x) => x[0] === name && x[1] === open)?.[2];
    const start = log[0][1];
    const on = at("busy", true);
    const off = at("busy", false);
    t.ok(on && on - start >= 290, `0.3 びょう より まえに 出た・出ない：${JSON.stringify(log)}`);
    t.ok(off && off - on >= 590, `0.6 びょう のこらない（チラッと なる）：${JSON.stringify(log)}`);
    t.ok(at("trim", true) >= off, `きえる まえに トリミングが 出た：${JSON.stringify(log)}`);
    t.noErrors(p);
    await server.close();
  },
};
