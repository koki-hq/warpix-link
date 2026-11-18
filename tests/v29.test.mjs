// v2.9 → v2.11：ひとやすみ。しばらく さわらないと ピクセが ちへいせんに すわり、もっと たつと ねむる。
// v2.10：画面を さわっても もどらない（よびかけ）、ピクセを さわると「もうすこし したら もどるね〜」→ すこし して もどる、
//        リンクを おすと すぐ もどる、ときどき おさんぽ、すわって いても まばたき、z は 3 つ
// v2.11：でる まえに ひとこと → ワープゲート（あな）で いく・もどる。ついて すこし は だまる
import { openApp, groupsData, BAND, sleep } from "./lib/app.mjs";

const G = groupsData([["推し", BAND.slice(0, 3)]]);
// [すわる, ねむる, おさんぽ, もどる] の じかん（ほんとうは 20 びょう・1 ぷん・30 びょう・5 びょう）
async function open(t, settings = {}, idle = [1500, 6000, 600000, 1500]) {
  const r = await openApp(t, { storage: { "warpix-v2-groups": G, "warpix-v2-settings": settings, "warpix-v2-pixe": { born: "2026-11-01", days: 10, last: "2026-11-18" } } });
  await r.p.send("Page.addScriptToEvaluateOnNewDocument", { source: `window.WARPIX_IDLE = ${JSON.stringify(idle)};` });
  await r.p.goto(r.server.url, 800);
  await r.p.ev(`document.querySelectorAll("dialog[open]").forEach((d) => d.close())`);
  return r;
}
const state = (p) => p.ev(`({ rest: pixe.rest(), seat: !document.querySelector(".pixe-seat").hidden, top: getComputedStyle(document.getElementById("npc")).visibility })`);
const bubble = (p) => p.ev(`document.getElementById("dialog-text").textContent`);
// expr が true に なるまで まつ（さいご まで ならなければ false）
async function until(p, expr, ms = 12000) {
  for (let i = 0; i < ms / 100; i++) {
    if (await p.ev(expr)) return true;
    await sleep(100);
  }
  return false;
}
const full = (p, line) => until(p, `document.getElementById("dialog-text").textContent === ${JSON.stringify(line)}`, 4000);

export default {
  async "でる まえに ひとこと → ゲートで やねへ → だまって から ひとこと → ねむる（z 3 つ）"(t) {
    const { server, p } = await open(t, { sky: "night" });
    t.ok(await full(p, "ちょっと おさんぽ\nしてくるね。"), "でる まえの ひとこと が ない");
    t.ok(await until(p, `!!document.querySelector(".pixe-hole")`, 3000), "ゲートが あかない");
    t.ok(await until(p, `pixe.rest() === "sit"`), "すわらない");
    let v = await state(p);
    t.eq([v.seat, v.top, await bubble(p)], [true, "hidden", ""], "ついて すぐ しゃべった");
    t.ok(await p.ev(`(() => { const r = document.querySelector(".pixe-seat").getBoundingClientRect(); return r.bottom > innerHeight - 150 && Math.round(r.width) === 30; })()`), "やねに 30px で いない");
    t.ok(await full(p, "やねの うえ、\nきもちいい〜"), "ついた ひとこと が ない");
    t.ok(await until(p, `pixe.rest() === "sleep"`, 9000), "ねむらない");
    t.eq(await p.ev(`document.querySelectorAll(".pixe-seat.sleep .pixe-z i").length`), 3, "z が 3 つ ない");
    t.eq(await p.ev(`document.querySelectorAll(".pixe-hole, .pixe-fly").length`), 0, "ゲートが のこって いる");
    t.noErrors(p);
    await server.close();
  },

  async "画面を さわると よびかけ、ピクセを さわると ゲートで もどって「ただいま〜」"(t) {
    const { server, p } = await open(t, { sky: "night" }, [1500, 600000, 600000, 1500]);
    t.ok(await until(p, `pixe.rest() === "sit"`), "すわらない");
    await p.click(".footer-maker");
    t.ok(await full(p, "おーい、ここだよ ここ。\nした みてみて〜"), "よびかけ が ない");
    t.eq((await state(p)).rest, "sit", "さわったら もどった");
    await p.click(".pixe-seat");
    t.ok(await full(p, "もうすこし したら\nもどるね〜"), "もうすこし したら が ない");
    t.ok(await until(p, `!!document.querySelector(".pixe-hole")`, 4000), "もどる ゲートが あかない");
    t.ok(await until(p, `pixe.rest() === null`, 6000), "もどらない");
    const v = await state(p);
    t.eq([v.seat, v.top], [false, "visible"], "うえに いない");
    t.ok(await full(p, "ただいま〜"), "ただいま が ない");
    t.noErrors(p);
    await server.close();
  },

  async "でる まえに さわると やめる、リンクを おすと すぐ もどる"(t) {
    const { server, p } = await open(t, { sky: "night" }, [1500, 600000, 600000, 1500]);
    await p.ev(`document.addEventListener("click", (e) => { if (e.target.closest(".links a.pixel-btn")) e.preventDefault(); }, true)`);
    t.ok(await until(p, `pixe.rest() === "go"`, 4000), "でかけない");
    await p.click(".footer-maker");
    await sleep(400);
    t.eq([(await state(p)).rest, await p.ev(`document.querySelectorAll(".pixe-hole").length`), await p.ev(`document.getElementById("npc").classList.contains("down")`)], [null, 0, false], "でる まえに さわっても いって しまう");
    t.ok(await until(p, `pixe.rest() === "sit"`), "すわらない");
    await p.click('.links .pixel-btn[data-id="youtube"]');
    const v = await state(p);
    // うえに もどって、そのまま いつもの ワープ（ワープ ちゅうは うえの ピクセも かくれる）
    t.eq([v.rest, v.seat, await p.ev(`document.getElementById("npc").classList.contains("down")`)], [null, false, false], "リンクで すぐ もどらない");
    t.noErrors(p);
    await server.close();
  },

  async "すわって いても まばたき、ときどき となりの やねへ おさんぽ"(t) {
    const { server, p } = await open(t, { sky: "night" }, [1000, 600000, 2000, 1500]);
    t.ok(await until(p, `pixe.rest() === "sit"`), "すわらない");
    await p.ev(`window._blinks = 0; new MutationObserver(() => window._blinks++).observe(document.querySelector(".pixe-seat"), { childList: true, subtree: true })`);
    const x0 = await p.ev(`document.querySelector(".pixe-seat").style.left`);
    t.ok(await until(p, `document.querySelector(".pixe-seat").style.left !== ${JSON.stringify(x0)}`, 14000), "おさんぽ しない");
    t.ok(await until(p, `window._blinks >= 2`, 9000), "まばたき しない");
    t.eq((await state(p)).rest, "sit", "とちゅうで かわった");
    t.noErrors(p);
    await server.close();
  },

  async "おかでも すわる、ちへいせん なし・まどを ひらいて いる ときは でかけない"(t) {
    const { server, p } = await open(t, { sky: "day", horizon: "hills" }, [1500, 600000, 600000, 1500]);
    t.ok(await until(p, `pixe.rest() === "sit"`), "おかで すわらない");
    t.ok(await full(p, "おかの うえ、\nかぜが きもちいい。"), "おかの ひとこと");
    await p.ev(`settings.set({ horizon: "none" })`);
    t.eq((await state(p)).rest, null, "ちへいせんが なく なっても もどらない");
    await sleep(3500);
    t.eq((await state(p)).rest, null, "ちへいせん なし でも でかけた");
    await p.ev(`settings.set({ horizon: "city" }); document.getElementById("menu-btn").click()`);
    await sleep(3500);
    t.eq((await state(p)).rest, null, "まどを ひらいて いても でかけた");
    t.noErrors(p);
    await server.close();
  },
};
