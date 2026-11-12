// v2.3 → v2.4：はいけい（ひる・ゆうがた・よる＋じぶんの がぞう 6 まいまで、メニューと グループで おなじ 一覧）・トリミング
import { openApp, groupsData, sleep } from "./lib/app.mjs";

const sky = (p) => p.ev(`({ sky: document.documentElement.dataset.sky, photo: document.documentElement.classList.contains("has-photo"), menu: settings.state.sky })`);
// テスト用の がぞう（たて ながの いろ わけ）を つくって トリミングに わたす
const pickPhoto = (p, where = "group", replace = null) =>
  p.ev(`(async () => { const c = document.createElement("canvas"); c.width = 300; c.height = 600; const x = c.getContext("2d"); x.fillStyle = "#ff4fa3"; x.fillRect(0, 0, 300, 300); x.fillStyle = "#3ee8ff"; x.fillRect(0, 300, 300, 300); const b = await new Promise((r) => c.toBlob(r, "image/png")); await photoBg.openTrim(new File([b], "a.png", { type: "image/png" }), { where: ${JSON.stringify(where)}, replace: ${JSON.stringify(replace)} }); })()`);
const cards = (p, id) => p.ev(`[...document.querySelectorAll("#${id} .bg-card")].map((b) => b.dataset.bg.startsWith("p-") ? "p" : b.dataset.bg)`);

export default {
  async "スイッチ OFF は メニューの はいけい、ON で グループごと。グループを かえると それぞれ。見出しは スイッチだけ"(t) {
    const { server, p } = await openApp(t, { storage: { "warpix-v2-groups": groupsData([["A", ["youtube"]], ["B", ["line"]]]) } });
    await p.click("#group-sign");
    await sleep(200);
    t.eq(await p.ev(`[document.getElementById("gbg-switch").textContent, !document.getElementById("gbg-off").hidden, document.getElementById("gbg").hidden]`), ["OFF", true, true], "はじめは OFF で ない");
    t.ok(!(await p.ev(`[...document.querySelectorAll("#edit-dialog .win-label")].some((x) => x.textContent.trim() === "はいけい")`)), "「はいけい」の 見出しが のこる");
    await p.click("#gbg-switch");
    t.eq(await cards(p, "group-lib"), ["day", "evening", "night", "add"], "ON の 一覧が ちがう");
    await p.click('#group-lib [data-bg="day"]');
    t.eq(await sky(p), { sky: "day", photo: false, menu: "night" }, "ON で ひるに ならない（メニューまで かわった）");
    t.ok(await p.ev(`document.getElementById("group-lib-btns").hidden`), "ひる で がぞうの ボタンが でる");
    await p.ev(`document.getElementById("edit-done").click()`);
    await p.click('#group-tabs [data-i="1"]');
    t.eq((await sky(p)).sky, "night", "ほかの グループに うつっても ひるの まま");
    await p.click('#group-tabs [data-i="0"]');
    t.eq((await sky(p)).sky, "day", "もどっても ひるに ならない");
    await p.ev(`settings.set({ sky: "evening" })`);
    t.eq((await sky(p)).sky, "day", "メニューで かわって しまった");
    await p.click('#group-tabs [data-i="1"]');
    t.eq((await sky(p)).sky, "evening", "OFF の グループが メニューの はいけいに ならない");
    await p.goto(await p.ev("location.href"), 500);
    t.eq(await p.ev(`CASSETTES.groups()[0].bg`), { own: true, sky: "day" }, "ほぞん されない");
    t.noErrors(p);
    await server.close();
  },

  async "メニューで がぞうを ついか（トリミング）→ グループでも おなじ がぞうが えらべる。9 まいで ＋ が きえる。ボタンは がぞうの ときだけ"(t) {
    const { server, p } = await openApp(t, { storage: { "warpix-v2-groups": groupsData([["A", ["youtube"]], ["B", ["line"]]]) } });
    await p.ev(`gear.open("sky")`);
    await sleep(200);
    t.eq(await cards(p, "menu-lib"), ["day", "evening", "night", "add"], "メニューの 一覧が ちがう");
    t.eq(await p.ev(`getComputedStyle(document.getElementById("menu-lib")).gridTemplateColumns.split(" ").length`), 3, "3 れつ で ない");
    t.ok(await p.ev(`document.getElementById("menu-lib-btns").hidden`), "よる で がぞうの ボタンが でる");
    await pickPhoto(p, "menu");
    await sleep(200);
    const tr = await p.ev(`({ open: document.getElementById("trim-dialog").open, ghosts: document.querySelectorAll("#trim-ghosts span").length, box: document.getElementById("trim-stage").getBoundingClientRect().width, w: document.getElementById("trim-img").getBoundingClientRect().width })`);
    t.ok(tr.open && tr.ghosts >= 4 && tr.box < 390 && tr.box > 150 && tr.w >= tr.box, `トリミングが ちがう：${JSON.stringify(tr)}`);
    await p.ev(`(() => { const z = document.getElementById("trim-zoom"); z.value = 200; z.dispatchEvent(new Event("input")); })()`);
    t.ok((await p.ev(`document.getElementById("trim-img").getBoundingClientRect().width`)) > tr.w * 1.8, "つまみで 大きく ならない");
    await p.click("#trim-yes");
    await sleep(500);
    let v = await sky(p);
    t.ok(v.photo && v.sky === "night" && v.menu.startsWith("p-"), `メニューの はいけいが がぞうに ならない：${JSON.stringify(v)}`);
    t.eq(await cards(p, "menu-lib"), ["day", "evening", "night", "p", "add"], "がぞうが 一覧に はいらない");
    t.ok(await p.ev(`!document.getElementById("menu-lib-btns").hidden`), "がぞうの とき ボタンが でない");
    // グループでも おなじ がぞう
    await p.ev(`document.getElementById("gear").close()`);
    await p.click("#group-sign");
    await sleep(200);
    await p.click("#gbg-switch");
    t.eq(await cards(p, "group-lib"), ["day", "evening", "night", "p", "add"], "グループの 一覧に メニューの がぞうが ない");
    // 9 まいに すると ＋ が きえる
    for (let i = 0; i < 8; i++) {
      await pickPhoto(p, "group");
      await sleep(200);
      await p.click("#trim-yes");
      await sleep(400);
    }
    t.eq((await cards(p, "group-lib")).filter((x) => x === "p").length, 9, "9 まい はいらない");
    t.eq(await p.ev(`getComputedStyle(document.getElementById("group-lib")).gridTemplateColumns.split(" ").length`), 4, "グループの へんしゅうが 4 れつ で ない");
    t.ok(!(await cards(p, "group-lib")).includes("add"), "9 まいでも ＋ が のこる");
    await p.goto(await p.ev("location.href"), 800);
    t.eq(await p.ev(`photoBg.list().length`), 9, "ひらきなおすと がぞうが きえる");
    t.noErrors(p);
    await server.close();
  },

  async "がぞうを けすと、使って いた メニューと グループは よる に。かえる で おなじ ところの がぞうが かわる。やめる で なにも かわらない"(t) {
    const { server, p } = await openApp(t, { storage: { "warpix-v2-groups": groupsData([["A", ["youtube"]], ["B", ["line"]]]) } });
    await p.ev(`window.WARPIX_ASK = true`);
    await pickPhoto(p, "menu");
    await sleep(200);
    await p.click("#trim-no");
    t.ok(!(await p.ev(`document.getElementById("trim-dialog").open || photoBg.list().length > 0`)), "やめる で がぞうが はいった");
    await pickPhoto(p, "menu");
    await sleep(200);
    await p.click("#trim-yes");
    await sleep(400);
    const id = await p.ev(`settings.state.sky`);
    await p.ev(`CASSETTES.setBg(CASSETTES.current().id, { own: true, sky: ${JSON.stringify(id)} }); photoBg.apply()`);
    // かえる：id は おなじ まま
    await p.ev(`gear.open("sky")`);
    await sleep(200);
    await pickPhoto(p, "menu", id);
    await sleep(200);
    await p.click("#trim-yes");
    await sleep(400);
    t.eq(await p.ev(`[photoBg.list().length, photoBg.list()[0] === ${JSON.stringify(id)}, settings.state.sky === ${JSON.stringify(id)}]`), [1, true, true], "かえる で ふえた・かわった");
    await p.click('#menu-lib-btns [data-lib-act="delete"]');
    await sleep(400);
    t.eq(await p.ev(`[photoBg.list().length, settings.state.sky, CASSETTES.current().bg.sky]`), [0, "night", "night"], "けしても よるに もどらない");
    t.ok(!(await sky(p)).photo, "けした がぞうが はいけいに のこる");
    t.noErrors(p);
    await server.close();
  },

  async "v2.3 の グループの がぞうは 一覧に うつる"(t) {
    const { server, p } = await openApp(t, { storage: { "warpix-v2-groups": { at: 0, list: [{ id: "g0", title: "A", ids: ["youtube"], bg: { own: true, sky: "photo", photo: true } }] } } });
    // v2.3 の ほぞん（グループの id で IndexedDB）を つくって から ひらきなおす
    await p.ev(`(async () => { const c = document.createElement("canvas"); c.width = 10; c.height = 20; const b = await new Promise((r) => c.toBlob(r, "image/png")); await new Promise((res) => { const r = indexedDB.open("warpix-v2-photos", 1); r.onupgradeneeded = () => r.result.createObjectStore("photos"); r.onsuccess = () => { const t = r.result.transaction("photos", "readwrite"); t.objectStore("photos").put(b, "g0"); t.oncomplete = () => { r.result.close(); res(); }; }; }); })()`);
    // さいしょに ひらいた ときに うつしかえが 走って いるので、v2.3 の きろくを もう いちど おく
    await p.ev(`localStorage.setItem("warpix-v2-groups", JSON.stringify({ at: 0, list: [{ id: "g0", title: "A", ids: ["youtube"], bg: { own: true, sky: "photo", photo: true } }] })); localStorage.removeItem("warpix-v2-photos")`);
    await p.goto(await p.ev("location.href"), 800);
    await p.ev(`photoBg.ready()`);
    const v = await p.ev(`({ list: photoBg.list().length, bg: CASSETTES.current().bg })`);
    t.ok(v.list === 1 && v.bg.own && v.bg.sky === (await p.ev(`photoBg.list()[0]`)) && !("photo" in v.bg), `うつらない：${JSON.stringify(v)}`);
    t.noErrors(p);
    await server.close();
  },

  async "v2.4.1：中身の ない がぞうは 一覧から はずし、それを 使って いた グループは スイッチ OFF（メニューの はいけいが 出る）。メニューの はいけいは 全部の グループに"(t) {
    const { server, p } = await openApp(t, { storage: { "warpix-v2-groups": { at: 0, list: [{ id: "g0", title: "A", ids: ["youtube"] }, { id: "g1", title: "B", ids: ["line"], bg: { own: true, sky: "p-broken1" } }, { id: "g2", title: "C", ids: [], bg: { own: true, sky: "p-broken2" } }] }, "warpix-v2-photos": ["p-broken1", "p-broken2"] } });
    await p.ev(`photoBg.ready()`);
    await sleep(200);
    t.eq(await p.ev(`[photoBg.list().length, CASSETTES.groups().map((g) => g.bg?.own ?? false)]`), [0, [false, false, false]], "こわれた がぞうが のこる・スイッチが ON の まま");
    await p.ev(`settings.set({ sky: "evening" })`);
    for (const i of [1, 2, 0]) {
      await p.click(`#group-tabs [data-i="${i}"]`);
      t.eq(await p.ev(`document.documentElement.dataset.sky`), "evening", `${i} ばんめの グループに メニューの はいけいが 出ない`);
    }
    t.ok((await p.ev(`document.querySelector("#panel-sky .about-note").textContent`)).includes("表示されます"), "メニューの 文が ちがう");
    t.noErrors(p);
    await server.close();
  },

  async "v2.4.1：がぞうは 中身（ArrayBuffer）で ほぞん。ひらきなおしても 読める"(t) {
    const { server, p } = await openApp(t, { storage: { "warpix-v2-groups": groupsData([["A", ["youtube"]]]) } });
    await pickPhoto(p, "menu");
    await sleep(200);
    await p.click("#trim-yes");
    await sleep(500);
    const id = await p.ev(`settings.state.sky`);
    const raw = await p.ev(`new Promise((res) => { const r = indexedDB.open("warpix-v2-photos", 1); r.onsuccess = () => { const q = r.result.transaction("photos").objectStore("photos").get(${JSON.stringify(id)}); q.onsuccess = () => { const v = q.result; res({ blob: v instanceof Blob, buf: v?.buf instanceof ArrayBuffer, size: v?.buf?.byteLength ?? 0 }); r.result.close(); }; }; })`);
    t.ok(!raw.blob && raw.buf && raw.size > 100, `中身で ほぞん されて いない：${JSON.stringify(raw)}`);
    await p.goto(await p.ev("location.href"), 800);
    await p.ev(`photoBg.ready()`);
    t.ok(await p.ev(`document.documentElement.classList.contains("has-photo") && photoBg.list().length === 1`), "ひらきなおすと 読めない");
    t.noErrors(p);
    await server.close();
  },
};
