// v2.9：ひとやすみ。しばらく さわらないと ピクセが ちへいせんに すわり、もっと たつと ねむる。さわると もどる
import { openApp, groupsData, BAND, sleep } from "./lib/app.mjs";

const G = groupsData([["推し", BAND.slice(0, 3)]]);
// 20 びょう・1 ぷん → テストでは 2.5 びょう・4 びょう（たしかめるのは 1 びょう ごと）
async function open(t, settings = {}) {
  const r = await openApp(t, { storage: { "warpix-v2-groups": G, "warpix-v2-settings": settings, "warpix-v2-pixe": { born: "2026-11-01", days: 10, last: "2026-11-18" } } });
  await r.p.send("Page.addScriptToEvaluateOnNewDocument", { source: "window.WARPIX_IDLE = [2500, 4000];" });
  await r.p.goto(r.server.url, 800);
  await r.p.ev(`document.querySelectorAll("dialog[open]").forEach((d) => d.close())`);
  return r;
}
const state = (p) => p.ev(`({ rest: pixe.rest(), seat: !document.querySelector(".pixe-seat").hidden, top: getComputedStyle(document.getElementById("npc")).visibility, text: document.getElementById("dialog-text").textContent })`);

export default {
  async "さわらないと やねに すわって ねむる。さわると もどる"(t) {
    const { server, p } = await open(t, { sky: "night" });
    await sleep(2700);
    let v = await state(p);
    t.eq([v.rest, v.seat, v.top], ["sit", true, "hidden"], "すわらない");
    // あしもとが ちへいせんの なか（画面の 下の ほう）
    t.ok(await p.ev(`document.querySelector(".pixe-seat").getBoundingClientRect().bottom > innerHeight - 150`), "やねに いない");
    await sleep(3800);
    v = await state(p);
    t.eq([v.rest, await p.ev(`document.querySelector(".pixe-seat").classList.contains("sleep")`)], ["sleep", true], "ねむらない");
    await sleep(1600);
    t.eq((await state(p)).text, "……すやすや。", "ねむる ひとこと");
    await p.click("#links");
    v = await state(p);
    t.eq([v.rest, v.seat, v.top], [null, false, "visible"], "さわっても もどらない");
    t.noErrors(p);
    await server.close();
  },

  async "おかでも すわる、ちへいせん なし・まどを ひらいて いる ときは すわらない"(t) {
    const { server, p } = await open(t, { sky: "day", horizon: "hills" });
    await sleep(2700);
    t.eq((await state(p)).rest, "sit", "おかで すわらない");
    await sleep(1400);
    t.eq((await state(p)).text, "おかの うえ、\nかぜが きもちいい。", "おかの ひとこと");
    await p.ev(`settings.set({ horizon: "none" })`);
    await p.click("#links");
    await sleep(3500);
    t.eq((await state(p)).rest, null, "ちへいせん なし でも すわった");
    await p.ev(`settings.set({ horizon: "city" }); document.getElementById("menu-btn").click()`);
    await sleep(3500);
    t.eq((await state(p)).rest, null, "まどを ひらいて いても すわった");
    t.noErrors(p);
    await server.close();
  },
};
