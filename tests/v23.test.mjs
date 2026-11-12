// v2.3：グループだけの はいけい（スイッチ・ひる／ゆうがた／よる・じぶんの がぞう・トリミング）
import { openApp, groupsData, sleep } from "./lib/app.mjs";

const sky = (p) => p.ev(`({ sky: document.documentElement.dataset.sky, photo: document.documentElement.classList.contains("has-photo"), menu: settings.state.sky })`);
// テスト用の がぞう（たて ながの いろ わけ）を つくって トリミングに わたす
const pickPhoto = (p) =>
  p.ev(`(async () => { const c = document.createElement("canvas"); c.width = 300; c.height = 600; const x = c.getContext("2d"); x.fillStyle = "#ff4fa3"; x.fillRect(0, 0, 300, 300); x.fillStyle = "#3ee8ff"; x.fillRect(0, 300, 300, 300); const b = await new Promise((r) => c.toBlob(r, "image/png")); await photoBg.openTrim(new File([b], "a.png", { type: "image/png" })); })()`);

export default {
  async "スイッチ OFF は メニューの はいけい、ON で グループごとに ひる・ゆうがた・よる。グループを かえると それぞれ"(t) {
    const { server, p } = await openApp(t, { storage: { "warpix-v2-groups": groupsData([["A", ["youtube"]], ["B", ["line"]]]) } });
    await p.click("#group-sign");
    await sleep(200);
    t.eq(await p.ev(`[document.getElementById("gbg-switch").textContent, !document.getElementById("gbg-off").hidden, document.getElementById("gbg").hidden]`), ["OFF", true, true], "はじめは OFF で ない");
    await p.click("#gbg-switch");
    await p.click('[data-gbg="day"]');
    t.eq(await sky(p), { sky: "day", photo: false, menu: "night" }, "ON で ひるに ならない（メニューまで かわった）");
    await p.ev(`document.getElementById("edit-done").click()`);
    await p.click('#group-tabs [data-i="1"]');
    t.eq((await sky(p)).sky, "night", "ほかの グループに うつっても ひるの まま");
    await p.click('#group-tabs [data-i="0"]');
    t.eq((await sky(p)).sky, "day", "もどっても ひるに ならない");
    // メニューで ゆうがたに しても、ON の グループは ひるの まま。OFF の グループは ゆうがた
    await p.ev(`settings.set({ sky: "evening" })`);
    t.eq((await sky(p)).sky, "day", "メニューで かわって しまった");
    await p.click('#group-tabs [data-i="1"]');
    t.eq((await sky(p)).sky, "evening", "OFF の グループが メニューの はいけいに ならない");
    await p.goto(await p.ev("location.href"), 500);
    t.eq(await p.ev(`CASSETTES.groups()[0].bg`), { own: true, sky: "day", photo: false }, "ほぞん されない");
    t.noErrors(p);
    await server.close();
  },

  async "じぶんの がぞう：えらぶと トリミング（点線・つまみ）→ けってい で はいけいに。ひらきなおしても のこる。けす で よるに"(t) {
    const { server, p } = await openApp(t, { storage: { "warpix-v2-groups": groupsData([["A", ["youtube"]], ["B", ["line"]]]) } });
    await p.ev(`window.WARPIX_ASK = true`);
    await p.click("#group-sign");
    await sleep(200);
    await pickPhoto(p);
    await sleep(200);
    const tr = await p.ev(`({ open: document.getElementById("trim-dialog").open, ghosts: document.querySelectorAll("#trim-ghosts span").length, w: document.getElementById("trim-img").getBoundingClientRect().width, box: document.getElementById("trim-stage").getBoundingClientRect().width })`);
    t.ok(tr.open && tr.ghosts >= 4 && tr.box < 390 && tr.box > 150 && tr.w >= tr.box, `トリミングが ちがう：${JSON.stringify(tr)}`);
    await p.ev(`(() => { const z = document.getElementById("trim-zoom"); z.value = 200; z.dispatchEvent(new Event("input")); })()`);
    t.ok((await p.ev(`document.getElementById("trim-img").getBoundingClientRect().width`)) > tr.w * 1.8, "つまみで 大きく ならない");
    await p.click("#trim-yes");
    await sleep(500);
    let v = await sky(p);
    t.ok(v.photo && v.sky === "night", `はいけいが がぞうに ならない：${JSON.stringify(v)}`);
    t.eq(await p.ev(`CASSETTES.current().bg`), { own: true, sky: "photo", photo: true }, "ON・がぞうに ならない");
    t.ok(await p.ev(`document.getElementById("gbg-thumb").classList.contains("has") && !document.getElementById("gbg-photo-btns").hidden`), "がぞうの みほん・ボタンが ない");
    // ひるに しても がぞうは のこる → また がぞうに
    await p.click('[data-gbg="day"]');
    t.eq(await sky(p), { sky: "day", photo: false, menu: "night" }, "ひるに ならない");
    await p.click('[data-gbg="photo"]');
    await sleep(200);
    t.ok((await sky(p)).photo, "がぞうに もどせない（きえた）");
    await p.goto(await p.ev("location.href"), 800);
    t.ok((await sky(p)).photo, "ひらきなおすと がぞうが きえる");
    // けす
    await p.ev(`window.WARPIX_ASK = true`);
    await p.click("#group-sign");
    await sleep(200);
    await p.click("#gbg-del");
    await sleep(300);
    t.eq(await sky(p), { sky: "night", photo: false, menu: "night" }, "けしても がぞうの まま");
    t.eq(await p.ev(`CASSETTES.current().bg`), { own: true, sky: "night", photo: false }, "けした あと の きろくが ちがう");
    t.noErrors(p);
    await server.close();
  },

  async "やめる で なにも かわらない。グループを けすと がぞうも けす"(t) {
    const { server, p } = await openApp(t, { storage: { "warpix-v2-groups": groupsData([["A", ["youtube"]], ["B", ["line"]]]) } });
    await p.ev(`window.WARPIX_ASK = true`);
    await p.click("#group-sign");
    await sleep(200);
    await pickPhoto(p);
    await sleep(200);
    await p.click("#trim-no");
    t.ok(!(await p.ev(`document.getElementById("trim-dialog").open || !!CASSETTES.current().bg?.photo`)), "やめる で がぞうに なった");
    await pickPhoto(p);
    await sleep(200);
    await p.click("#trim-yes");
    await sleep(500);
    const gid = await p.ev(`CASSETTES.current().id`);
    await p.ev(`document.querySelector('#group-rows li[data-id="${gid}"] [data-del-group]').click()`);
    await sleep(400);
    const left = await p.ev(`photoBg.urlOf(${JSON.stringify(gid)})`);
    t.eq(left, null, "グループを けしても がぞうが のこる");
    t.ok(!(await sky(p)).photo, "けした グループの がぞうが はいけいに のこる");
    t.noErrors(p);
    await server.close();
  },
};
