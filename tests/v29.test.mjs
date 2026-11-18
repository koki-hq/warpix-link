// v2.9 → v2.10：ひとやすみ。しばらく さわらないと ピクセが ちへいせんに すわり、もっと たつと ねむる。
// v2.10：画面を さわっても もどらない（よびかけ）、ピクセを さわると「もうすこし したら もどるね〜」→ すこし して もどる、
// リンクを おすと すぐ もどる、ときどき おさんぽ、すわって いても まばたき、z は 3 つ
import { openApp, groupsData, BAND, sleep } from "./lib/app.mjs";

const G = groupsData([["推し", BAND.slice(0, 3)]]);
// [すわる, ねむる, おさんぽ, もどる] の じかん（ほんとうは 20 びょう・1 ぷん・30 びょう・5 びょう）。たしかめるのは 1 びょう ごと
async function open(t, settings = {}, idle = [2500, 4000, 600000, 1500]) {
  const r = await openApp(t, { storage: { "warpix-v2-groups": G, "warpix-v2-settings": settings, "warpix-v2-pixe": { born: "2026-11-01", days: 10, last: "2026-11-18" } } });
  await r.p.send("Page.addScriptToEvaluateOnNewDocument", { source: `window.WARPIX_IDLE = ${JSON.stringify(idle)};` });
  await r.p.goto(r.server.url, 800);
  await r.p.ev(`document.querySelectorAll("dialog[open]").forEach((d) => d.close())`);
  return r;
}
const state = (p) => p.ev(`({ rest: pixe.rest(), seat: !document.querySelector(".pixe-seat").hidden, top: getComputedStyle(document.getElementById("npc")).visibility })`);
const text = (p) => p.ev(`new Promise((r) => setTimeout(() => r(document.getElementById("dialog-text").textContent), 1500))`);

export default {
  async "すわって ねむる（z は 3 つ）。画面を さわると おきて よびかけ、ピクセを さわると すこし して もどる"(t) {
    const { server, p } = await open(t, { sky: "night" }, [2500, 4000, 600000, 3000]);
    await sleep(2700);
    let v = await state(p);
    t.eq([v.rest, v.seat, v.top], ["sit", true, "hidden"], "すわらない");
    t.ok(await p.ev(`(() => { const r = document.querySelector(".pixe-seat").getBoundingClientRect(); return r.bottom > innerHeight - 150 && Math.round(r.width) === 30; })()`), "やねに 30px で いない");
    await sleep(3800);
    t.eq([(await state(p)).rest, await p.ev(`document.querySelectorAll(".pixe-seat.sleep .pixe-z i").length`)], ["sleep", 3], "ねむらない・z が 3 つ ない");
    t.eq(await text(p), "……すやすや。", "ねむる ひとこと");
    // 画面を さわる：おきる けど もどらない
    await p.click(".footer-maker");
    t.eq([(await state(p)).rest, await text(p)], ["sit", "……ん？ ねてないよ。"], "おきない・もどって しまう");
    await p.click(".footer-maker");
    t.eq([(await state(p)).rest, await text(p)], ["sit", "おーい、ここだよ ここ。\nした みてみて〜"], "よびかけ が ない");
    // ピクセを さわる：もうすこし したら もどる
    await p.click(".pixe-seat");
    t.eq([(await state(p)).rest, await text(p)], ["sit", "もうすこし したら\nもどるね〜"], "すぐ もどった・ひとこと が ない");
    await sleep(1800);
    v = await state(p);
    t.eq([v.rest, v.seat, v.top], [null, false, "visible"], "もどらない");
    t.eq(await text(p), "ただいま〜", "もどった ひとこと");
    t.noErrors(p);
    await server.close();
  },

  async "リンクを おすと すぐ もどる"(t) {
    const { server, p } = await open(t, { sky: "night" });
    await p.ev(`document.addEventListener("click", (e) => { if (e.target.closest(".links a.pixel-btn")) e.preventDefault(); }, true)`);
    await sleep(2700);
    t.eq((await state(p)).rest, "sit", "すわらない");
    await p.click('.links .pixel-btn[data-id="youtube"]');
    t.eq((await state(p)).rest, null, "リンクで もどらない");
    t.noErrors(p);
    await server.close();
  },

  async "すわって いても まばたき、ときどき となりの やねへ おさんぽ"(t) {
    const { server, p } = await open(t, { sky: "night" }, [1000, 600000, 2000, 1500]);
    await sleep(2200);
    t.eq((await state(p)).rest, "sit", "すわらない");
    await p.ev(`window._blinks = 0; new MutationObserver(() => window._blinks++).observe(document.querySelector(".pixe-seat"), { childList: true, subtree: true })`);
    const x0 = await p.ev(`document.querySelector(".pixe-seat").style.left`);
    // おさんぽ か ひとりごと は はんぶんずつ。なんかいか まって どこかで うごけば いい
    let moved = false;
    for (let i = 0; i < 12 && !moved; i++) {
      await sleep(1000);
      moved = (await p.ev(`document.querySelector(".pixe-seat").style.left`)) !== x0;
    }
    t.ok(moved, "おさんぽ しない");
    await sleep(4300);
    t.ok((await p.ev(`window._blinks`)) >= 2, "まばたき しない");
    t.eq((await state(p)).rest, "sit", "とちゅうで かわった");
    t.noErrors(p);
    await server.close();
  },

  async "おかでも すわる、ちへいせん なし・まどを ひらいて いる ときは すわらない"(t) {
    const { server, p } = await open(t, { sky: "day", horizon: "hills" });
    await sleep(2700);
    t.eq((await state(p)).rest, "sit", "おかで すわらない");
    t.eq(await text(p), "おかの うえ、\nかぜが きもちいい。", "おかの ひとこと");
    await p.click(".pixe-seat");
    await sleep(1700);
    t.eq((await state(p)).rest, null, "もどらない");
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
