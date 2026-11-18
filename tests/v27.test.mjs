// v2.7：きせかえ（ちへいせん・リンクの がら）、きせつの そら、アイコンの いろ、カセットの タブ、グループの てんてん、はりつける
import { openApp, groupsData, BAND, sleep } from "./lib/app.mjs";

const G = groupsData([["推し", BAND.slice(0, 4)], ["しごと", ["youtube"]], ["ライブ", []]]);

export default {
  async "きせかえ：さいしょは まち と ブロック。えらぶと かわって のこる"(t) {
    const { server, p } = await openApp(t, { storage: { "warpix-v2-groups": G } });
    const now = () => p.ev(`[document.documentElement.dataset.horizon, document.documentElement.dataset.tiles, getComputedStyle(document.getElementById("horizon")).display]`);
    t.eq(await now(), ["city", "block", "block"], "さいしょが ちがう");
    await p.click("#menu-btn");
    await sleep(200);
    t.eq(await p.ev(`document.getElementById("tab-sky").textContent`), "きせかえ", "タブの なまえ");
    await p.click('#horizon-pick [data-horizon="hills"]');
    await p.click('#tiles-pick [data-tiles="neon"]');
    t.eq(await now(), ["hills", "neon", "block"], "えらんでも かわらない");
    t.eq(await p.ev(`[...document.querySelectorAll("#horizon-pick [aria-pressed=true], #tiles-pick [aria-pressed=true]")].map((b) => b.textContent)`), ["おか", "ネオン"], "えらんだ しるし");
    await p.click('#horizon-pick [data-horizon="none"]');
    t.eq(await now(), ["none", "neon", "none"], "なし で きえない");
    t.eq(await p.ev(`(({ horizon, tiles }) => [horizon, tiles])(JSON.parse(localStorage.getItem("warpix-v2-settings")))`), ["none", "neon"], "のこらない");
    t.noErrors(p);
    await server.close();
  },

  async "きせつの そら：12〜2 月 ゆき・3〜4 月 はなびら・7〜8 月 はなび・10〜11 月 おちば・ほかは なし"(t) {
    const { server, p } = await openApp(t, { storage: { "warpix-v2-groups": G } });
    const cases = { "2026-12-20": "snow", "2027-02-28": "snow", "2027-03-01": "petal", "2027-04-30": "petal", "2027-05-10": null, "2027-07-01": "firework", "2027-08-31": "firework", "2027-09-15": null, "2027-10-01": "leaf", "2027-11-30": "leaf" };
    t.eq(await p.ev(`Object.fromEntries(${JSON.stringify(Object.keys(cases))}.map((d) => [d, seasonOf(new Date(d + "T12:00:00"))]))`), cases, "きせつが ちがう");
    await server.close();
  },

  async "アイコンの いろ：じぶんで つくる で えらぶと タイルの いろ。けすと いろも きえる"(t) {
    const { server, p } = await openApp(t, { storage: { "warpix-v2-groups": G } });
    await p.click("#link-add");
    await sleep(150);
    t.eq(await p.ev(`document.querySelectorAll("#mylink-colors [data-color]").length`), 5, "いろが 5 つ ない");
    await p.ev(`document.getElementById("mylink-name").value = "ライブ"; document.getElementById("mylink-url").value = "https://example.com/live"`);
    await p.click('#mylink-colors [data-color="gold"]');
    t.eq(await p.ev(`getComputedStyle(document.querySelector("#mylink-icons .mylink-icon")).color`), "rgb(255, 216, 74)", "アイコンの ならびが その いろに ならない");
    await p.click("#add-done");
    await sleep(150);
    t.eq(await p.ev(`[CASSETTES.colorOf("my-1"), document.querySelector('.links .pixel-btn[data-id="my-1"]').style.getPropertyValue("--c").trim()]`), ["gold", "#ffd84a"], "いろが つかない");
    await p.ev(`CASSETTES.removeMine("my-1")`);
    t.eq(await p.ev(`localStorage.getItem("warpix-v2-colors")`), null, "けしても いろが のこる");
    t.noErrors(p);
    await server.close();
  },

  async "はりつける：コピーした アドレスと なまえ・アイコン。リストの サイトは その なまえ、ない ときは しらせる"(t) {
    const { server, p } = await openApp(t, { storage: { "warpix-v2-groups": G } });
    await p.click("#link-add");
    await sleep(150);
    const paste = async (text) => {
      await p.ev(`document.getElementById("mylink-name").value = ""; document.getElementById("mylink-url").value = ""; Object.defineProperty(navigator, "clipboard", { configurable: true, value: { readText: async () => ${JSON.stringify(text)} } })`);
      await p.click("#mylink-paste");
      await sleep(100);
      return p.ev(`[document.getElementById("mylink-url").value, document.getElementById("mylink-name").value, document.querySelector('#mylink-icons [aria-checked="true"]').dataset.icon, document.getElementById("mylink-error").hidden]`);
    };
    t.eq(await paste("これ見て https://www.youtube.com/@band って"), ["https://www.youtube.com/@band", "YOUTUBE", "film", true], "リストの サイト");
    t.eq(await paste("https://www.someblog.jp/n/abc"), ["https://www.someblog.jp/n/abc", "someblog", "star", true], "ほかの サイト");
    t.eq(await paste("アドレス なし"), ["", "", "star", false], "ない ときに しらせない");
    // じぶんで 書いた なまえは けさない
    await p.ev(`document.getElementById("mylink-error").hidden = true; document.getElementById("mylink-name").value = "推しの公式"; Object.defineProperty(navigator, "clipboard", { configurable: true, value: { readText: async () => "https://example.com/x" } })`);
    await p.click("#mylink-paste");
    await sleep(100);
    t.eq(await p.ev(`[document.getElementById("mylink-url").value, document.getElementById("mylink-name").value]`), ["https://example.com/x", "推しの公式"], "書いた なまえが きえた");
    t.noErrors(p);
    await server.close();
  },

  async "タブは カセット、下の すきまに グループの てんてん（いま いる ところが 金）"(t) {
    const { server, p } = await openApp(t, { storage: { "warpix-v2-groups": G } });
    t.eq(await p.ev(`[...document.querySelectorAll(".group-tab:not(.plus) .cas-in")].map((x) => x.textContent)`), ["推し", "しごと", "ライブ"], "タブの ラベル");
    const tall = await p.ev(`[document.getElementById("group-sign").offsetHeight, document.querySelector(".group-tab[data-i]").offsetHeight]`);
    t.ok(tall[0] > tall[1], "えらんで いる タブが たかく ない");
    const dots = () => p.ev(`[document.getElementById("group-dots").hidden, document.querySelectorAll("#group-dots span").length, [...document.querySelectorAll("#group-dots span")].findIndex((s) => s.classList.contains("on"))]`);
    t.eq(await dots(), [false, 3, 0], "てんてん");
    await p.click('.group-tab[data-i="2"]');
    t.eq(await dots(), [false, 3, 2], "きりかえても かわらない");
    t.noErrors(p);
    await server.close();
  },

  async "下の すきまを よこに スワイプしても グループが かわる"(t) {
    const { server, p } = await openApp(t, { storage: { "warpix-v2-groups": G } });
    const swipe = async (x0, x1, y) => {
      await p.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: x0, y }] });
      for (let i = 1; i <= 5; i++) await p.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: x0 + ((x1 - x0) * i) / 5, y }] });
      await p.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
      await sleep(150);
    };
    await swipe(300, 120, 700);
    t.eq(await p.ev(`CASSETTES.at()`), 1, "すきまの スワイプで かわらない");
    await swipe(120, 300, 700);
    t.eq(await p.ev(`CASSETTES.at()`), 0, "もどらない");
    t.noErrors(p);
    await server.close();
  },
};
