// v2.2：長押しで へんしゅう ちゅう（ゆらゆら・✕・ドラッグで ならべかえ・おすと へんしゅう）、≡ で ならべかえ、ホーム画面への さそい
import { openApp, groupsData, noNavigate, sleep } from "./lib/app.mjs";

const ids = (p) => p.ev(`CASSETTES.current().ids`);
const center = (p, sel) => p.ev(`(() => { const r = document.querySelector(${JSON.stringify(sel)}).getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; })()`);
const mouse = (p, type, x, y) => p.send("Input.dispatchMouseEvent", { type, x, y, button: "left", buttons: type === "mouseReleased" ? 0 : 1, clickCount: 1 });
// ほんものの マウスで つかんで、すこしずつ うごかして はなす
async function drag(p, from, to, { hold = 0 } = {}) {
  await mouse(p, "mouseMoved", from.x, from.y);
  await mouse(p, "mousePressed", from.x, from.y);
  if (hold) await sleep(hold);
  for (let i = 1; i <= 8; i++) await mouse(p, "mouseMoved", from.x + ((to.x - from.x) * i) / 8, from.y + ((to.y - from.y) * i) / 8);
  await mouse(p, "mouseReleased", to.x, to.y);
  await sleep(100);
}

export default {
  async "リンクを 長押しで へんしゅう ちゅう：おびが 出て ゆらゆら・✕・リンクを ひらかない。おわる で もどる"(t) {
    const { server, p } = await openApp(t, { storage: { "warpix-v2-groups": groupsData([["A", ["youtube", "spotify", "twitter"]]]) } });
    await noNavigate(p);
    const c = await center(p, '.links .pixel-btn[data-id="spotify"]');
    await mouse(p, "mouseMoved", c.x, c.y);
    await mouse(p, "mousePressed", c.x, c.y);
    await sleep(700);
    await mouse(p, "mouseReleased", c.x, c.y);
    await sleep(150);
    const v = await p.ev(`({ on: editMode.on(), band: !document.getElementById("edit-band").hidden, x: document.querySelectorAll(".links .tile-x").length, add: !!document.getElementById("link-add")?.getClientRects().length, anim: getComputedStyle(document.querySelector(".links .pixel-btn")).animationName, log: localStorage.getItem("warpix-v2-log") })`);
    t.eq(v, { on: true, band: true, x: 3, add: false, anim: "wobble", log: null }, "へんしゅう ちゅうに ならない・長押しで ワープして しまう");
    // ✕ で はずす（たしかめなし）
    await p.click('.links .pixel-btn[data-id="twitter"] .tile-x');
    t.eq(await ids(p), ["youtube", "spotify"], "✕ で はずれない");
    t.ok(await p.ev(`!document.getElementById("npc").classList.contains("away")`), "へんしゅう ちゅうに ワープした");
    await p.click("#edit-end");
    t.eq(await p.ev(`[editMode.on(), document.getElementById("edit-band").hidden, document.querySelectorAll(".links .tile-x").length]`), [false, true, 0], "おわる で もどらない");
    t.noErrors(p);
    await server.close();
  },

  async "みじかく おすと ふだんどおり ワープ（へんしゅう ちゅうに ならない）"(t) {
    const { server, p } = await openApp(t, { storage: { "warpix-v2-groups": groupsData([["A", ["youtube", "spotify"]]]) } });
    await noNavigate(p);
    await p.click('.links .pixel-btn[data-id="youtube"]');
    await sleep(150);
    t.ok(await p.ev(`!editMode.on() && !!localStorage.getItem("warpix-v2-log")`), "みじかく おしても ワープしない");
    t.noErrors(p);
    await server.close();
  },

  async "へんしゅう ちゅうに ドラッグで ならべかえ。長押しの まま うごかしても ドラッグ"(t) {
    const { server, p } = await openApp(t, { storage: { "warpix-v2-groups": groupsData([["A", ["youtube", "spotify", "twitter", "instagram"]]]) } });
    await noNavigate(p);
    // 長押しの まま うごかす（youtube → instagram の ところ）
    const a = await center(p, '.links .pixel-btn[data-id="youtube"]');
    const b = await center(p, '.links .pixel-btn[data-id="instagram"]');
    await drag(p, a, b, { hold: 650 });
    t.ok(await p.ev(`editMode.on()`), "長押しで へんしゅう ちゅうに ならない");
    t.eq((await ids(p))[3], "youtube", `ドラッグで うごかない：${await ids(p)}`);
    t.eq(await p.ev(`JSON.parse(localStorage.getItem("warpix-v2-groups")).list[0].ids[3]`), "youtube", "ならびが ほぞん されない");
    // へんしゅう ちゅうの ドラッグ（すぐ つかめる）
    const c = await center(p, '.links .pixel-btn[data-id="twitter"]');
    const d = await center(p, '.links .pixel-btn[data-id="spotify"]');
    await drag(p, c, d);
    const now = await ids(p);
    t.ok(now.indexOf("twitter") < now.indexOf("spotify"), `へんしゅう ちゅうに ドラッグ できない：${now}`);
    t.ok(await p.ev(`!document.getElementById("link-sheet").open && !localStorage.getItem("warpix-v2-log")`), "ドラッグの あとに まどが ひらいた・ワープした");
    t.noErrors(p);
    await server.close();
  },

  async "へんしゅう ちゅうに リンクを おすと 下から まど：じぶんの リンクは なまえ・アドレス・アイコン、リストの リンクは はずす だけ"(t) {
    const { server, p } = await openApp(t, { storage: { "warpix-v2-groups": groupsData([["A", ["youtube"]]]) } });
    await noNavigate(p);
    await p.ev(`(() => { const c = CASSETTES.addMine({ label: "バンド", url: "https://example.com/band", icon: "heart" }); CASSETTES.addLink(CASSETTES.current().id, c.id); groups.render(); editMode.enter(); })()`);
    await p.click('.links .pixel-btn[data-id="my-1"]');
    await sleep(150);
    let v = await p.ev(`({ open: document.getElementById("link-sheet").open, mine: !document.getElementById("sheet-mine").hidden, name: document.getElementById("sheet-name").value, icon: document.querySelector('#sheet-icons [aria-checked="true"]')?.dataset.icon })`);
    t.eq(v, { open: true, mine: true, name: "バンド", icon: "heart" }, "じぶんの リンクの まどが ちがう");
    await p.ev(`document.getElementById("sheet-url").value = "javascript:alert(1)"; document.getElementById("sheet-save").click()`);
    t.ok(await p.ev(`!document.getElementById("sheet-error").hidden && document.getElementById("link-sheet").open`), "へんな アドレスで ほぞん された");
    await p.ev(`document.getElementById("sheet-name").value = "バンドの公式"; document.getElementById("sheet-url").value = "https://example.com/official"; document.getElementById("sheet-save").click()`);
    t.eq(await p.ev(`[CASSETTES.byId("my-1").label, CASSETTES.byId("my-1").url, document.getElementById("link-sheet").open]`), ["バンドの公式", "https://example.com/official", false], "かわらない");
    await p.click('.links .pixel-btn[data-id="youtube"]');
    await sleep(150);
    v = await p.ev(`({ mine: !document.getElementById("sheet-mine").hidden, save: !document.getElementById("sheet-save").hidden })`);
    t.eq(v, { mine: false, save: false }, "リストの リンクで なまえが かえられる");
    await p.ev(`document.getElementById("sheet-out").click()`);
    t.eq(await ids(p), ["my-1"], "はずす で はずれない");
    t.noErrors(p);
    await server.close();
  },

  async "グループの へんしゅう：≡ を ドラッグで リンクと グループを ならべかえ。まえへ・うしろへ と ▲▼ は ない"(t) {
    const { server, p } = await openApp(t, { storage: { "warpix-v2-groups": groupsData([["A", ["youtube", "spotify", "twitter"]], ["B", ["line"]], ["C", []]]) } });
    await p.click("#group-sign");
    await sleep(200);
    t.ok(await p.ev(`!document.getElementById("edit-prev") && !document.querySelector('#edit-rows [data-act="up"]')`), "まえへ・▲ が のこる");
    await drag(p, await center(p, '#edit-rows li[data-id="youtube"] .grip'), await center(p, '#edit-rows li[data-id="twitter"] .grip'));
    t.eq(await ids(p), ["spotify", "twitter", "youtube"], "リンクを ドラッグで ならべかえ られない");
    await drag(p, await center(p, '#group-rows li[data-id="g0"] .grip'), await center(p, '#group-rows li[data-id="g2"] .grip'));
    const v = await p.ev(`({ order: CASSETTES.groups().map((g) => g.title), cur: CASSETTES.current().title })`);
    t.eq(v, { order: ["B", "C", "A"], cur: "A" }, "グループを ドラッグで ならべかえ られない（えらんで いる グループが かわった）");
    t.noErrors(p);
    await server.close();
  },

  async "v2.2.1：はいけい・メニューを おすと へんしゅう おわり（タブでは おわらない）。ピクセは へんしゅうの はなし"(t) {
    const { server, p } = await openApp(t, { storage: { "warpix-v2-groups": groupsData([["A", ["youtube"]], ["B", ["line"]]]) } });
    await p.ev(`editMode.enter()`);
    t.ok((await p.text()).includes("ならびかえ"), "ピクセが へんしゅうの はなしを しない");
    await p.click('#group-tabs [data-i="1"]');
    t.ok(await p.ev(`editMode.on() && document.querySelectorAll(".links .tile-x").length === 1`), "タブで へんしゅうが おわった");
    await mouse(p, "mouseMoved", 200, 600);
    await mouse(p, "mousePressed", 200, 600);
    await mouse(p, "mouseReleased", 200, 600);
    t.ok(await p.ev(`!editMode.on()`), "はいけいを おしても おわらない");
    await p.ev(`editMode.enter()`);
    await p.click("#menu-btn");
    await sleep(150);
    t.ok(await p.ev(`!editMode.on() && document.getElementById("gear").open`), "メニューで おわらない・メニューが ひらかない");
    t.noErrors(p);
    await server.close();
  },

  async "v2.2.1：グループの へんしゅうは 行を 長押しで ドラッグ（すぐ うごかすと ドラッグに ならない）。グループは 行ごとに けせる"(t) {
    const { server, p } = await openApp(t, { storage: { "warpix-v2-groups": groupsData([["A", ["youtube", "spotify", "twitter"]], ["B", ["line"]], ["C", []]]) } });
    await p.ev(`window.WARPIX_ASK = true`);
    await p.click("#group-sign");
    await sleep(200);
    const name = (id) => center(p, `#edit-rows li[data-id="${id}"] .edit-row-name`);
    await drag(p, await name("youtube"), await name("twitter"));
    t.eq(await ids(p), ["youtube", "spotify", "twitter"], "長押し しないで うごいた");
    await drag(p, await name("youtube"), await name("twitter"), { hold: 550 });
    t.eq(await ids(p), ["spotify", "twitter", "youtube"], "行を 長押しで ドラッグ できない");
    t.eq(await p.ev(`getComputedStyle(document.querySelector("#edit-rows li")).userSelect`), "none", "長押しで 文字えらびに なる");
    await p.ev(`document.querySelector('#group-rows li[data-id="g1"] [data-del-group]').click()`);
    await sleep(100);
    t.eq(await p.ev(`[CASSETTES.groups().map((g) => g.title), document.getElementById("edit-dialog").open]`), [["A", "C"], true], "ほかの グループを けせない（まどが とじた）");
    await p.ev(`document.querySelector('#group-rows li[data-id="g0"] [data-del-group]').click()`);
    await sleep(100);
    t.eq(await p.ev(`[CASSETTES.groups().map((g) => g.title), document.getElementById("edit-dialog").open]`), [["C"], false], "ひらいて いる グループを けしたら とじない");
    t.noErrors(p);
    await server.close();
  },

  async "ホーム画面への さそい：はじめて リンクを 入れたら 1 かい、そのあと 5 かい ひらく ごと。やりかたを みる で 説明書"(t) {
    const { server, p } = await openApp(t);
    await p.send("Page.addScriptToEvaluateOnNewDocument", { source: "window.WARPIX_INVITE = true;" });
    await p.goto(await p.ev("location.href"), 600);
    await p.click("#empty-add");
    await sleep(150);
    await p.ev(`document.getElementById("group-name").value = "A"; document.getElementById("group-form").requestSubmit()`);
    await sleep(200);
    await p.ev(`document.getElementById("add-tab-shelf").click(); document.querySelector('.cas-item[data-id="youtube"]').click(); document.getElementById("add-done").click()`);
    await sleep(2000);
    t.ok(await p.ev(`document.getElementById("invite-dialog").open`), "はじめて リンクを 入れても さそわない");
    await p.click("#invite-later");
    const opens = [];
    for (let i = 1; i <= 5; i++) {
      await p.goto(await p.ev("location.href"), 500);
      opens.push(await p.ev(`document.getElementById("invite-dialog").open`));
    }
    t.eq(opens, [false, false, false, false, true], "5 かいめに さそわない");
    await p.click("#invite-how");
    await sleep(150);
    t.ok(await p.ev(`document.getElementById("manual").open && !document.getElementById("invite-dialog").open`), "やりかたを みる で 説明書が ひらかない");
    t.noErrors(p);
    await server.close();
  },

  async "ホーム画面の アプリ（と パソコン）には さそわない。おしらせは ドットの 文字"(t) {
    const { server, p } = await openApp(t, { storage: { "warpix-v2-groups": groupsData([["A", ["youtube"]]]), "warpix-v2-invite": { first: true, opens: 4 } } });
    t.ok(await p.ev(`!document.getElementById("invite-dialog").open`), "パソコンで さそった");
    await p.ev(`mail.open(); document.querySelector('.mail-item').click()`);
    t.ok(/DotGothic16/.test(await p.ev(`getComputedStyle(document.querySelector("#mail-read p")).fontFamily`)), "おしらせが ドットの 文字で ない");
    t.noErrors(p);
    await server.close();
  },
};
