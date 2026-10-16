// アプリの ショートカット（?go=）と、ピクセの「きゅうけい しよう」
import { readFileSync } from "node:fs";

const choose = (p, label) => p.ev(`[...document.querySelectorAll(".dialog-choices button")].find((b) => b.textContent === ${JSON.stringify(label)})?.click()`);
async function waitFor(t, p, expr, ms = 8000) {
  for (let i = 0; i < ms / 200; i++) {
    if (await p.ev(expr)) return true;
    await t.sleep(200);
  }
  return false;
}

export default {
  async "ホーム画面の ショートカットで、ミニゲーム・さっきょく・おみくじが すぐ ひらく"(t) {
    const m = JSON.parse(readFileSync(new URL("../manifest.webmanifest", import.meta.url), "utf8"));
    t.eq(m.shortcuts.map((s) => s.url), ["./?go=game", "./?go=compose", "./?go=omikuji"], "マニフェストの ショートカット");
    const server = await t.startServer();
    const b = await t.launchBrowser();
    const p = await b.firstPage();
    await p.goto(server.url + "?go=game");
    await p.boot({ readIntro: false });
    t.ok(await waitFor(t, p, `game.isOpen() && !game.isDemo()`), "?go=game で ミニゲームが ひらかない");
    await p.key("Escape");
    await p.goto(server.url + "?go=compose");
    await p.boot({ readIntro: false });
    t.ok(await waitFor(t, p, `document.getElementById("composer").open`), "?go=compose で さっきょくが ひらかない");
    await p.key("Escape");
    await p.goto(server.url + "?go=omikuji");
    await p.boot({ readIntro: false });
    t.ok(await waitFor(t, p, `achievements.has("omikuji")`), "?go=omikuji で おみくじを ひかない");
    await p.goto(server.url + "?go=nope");
    await p.boot({ readIntro: false });
    await t.sleep(1500);
    t.ok(await p.ev(`!game.isOpen() && !document.querySelector("dialog[open]")`), "しらない ?go= で なにか ひらいた");
    t.noErrors(p);
    await server.close();
  },

  async "50 ぷん あそぶと きゅうけいを すすめ、20 びょう とおくを みる"(t) {
    const server = await t.startServer();
    const b = await t.launchBrowser();
    const p = await b.firstPage();
    await p.goto(server.url + "?away=0");
    await p.ev(`localStorage.clear()`);
    await p.goto(server.url);
    await p.boot();
    // さわっていない あいだは かぞえない
    await p.ev(`rest.state.lastInput = Date.now() - 6 * 60000; rest.state.lastTick = Date.now() - 15000; rest.tick()`);
    t.eq(await p.ev(`rest.state.active`), 0, "さわっていないのに かぞえた");
    // 50 ぷん あそんだ ことに する
    await p.ev(`rest.state.lastInput = Date.now(); rest.state.active = rest.ASK_AFTER; rest.tick()`);
    t.ok(await waitFor(t, p, `document.body.innerText.includes("めを やすめない") && document.querySelectorAll(".dialog-choices button").length === 2`), "きゅうけいを すすめない");
    t.ok((await p.text()).includes("50ぷん"), "あそんだ 時間を いわない");
    await choose(p, "やすむ");
    await t.sleep(300);
    t.eq(await p.ev(`document.querySelector(".rest .rest-count")?.textContent`), "20", "20 びょうの カウント");
    t.ok(await p.ev(`document.querySelector(".rest").getAttribute("role") === "status" && document.activeElement.classList.contains("rest-stop")`), "読み上げ・フォーカス");
    await p.shot("rest.png");
    await t.sleep(2300);
    t.ok(Number(await p.ev(`document.querySelector(".rest .rest-count").textContent`)) <= 18, "カウントが すすまない");
    await p.key("Escape");
    await t.sleep(200);
    t.ok(await p.ev(`!document.querySelector(".rest")`), "Esc で おわらない");
    t.ok(await waitFor(t, p, `document.getElementById("dialog-text").textContent.includes("また こんど")`, 3000), "とちゅうで やめたときの ひとこと");
    t.ok(await p.ev(`!achievements.has("rest")`), "とちゅうで やめたのに 実績");
    // さいごまで みる
    await p.ev(`rest.lookFar()`);
    await t.sleep(21000);
    t.ok(await p.ev(`!document.querySelector(".rest")`), "20 びょうで おわらない");
    t.ok(await p.ev(`achievements.has("rest") && grow.state.diary.some((e) => e.type === "rest")`), "実績・日記");
    t.ok(await waitFor(t, p, `document.getElementById("dialog-text").textContent.includes("すっきり")`, 3000), "おわりの ひとこと");
    t.ok(await p.ev(`rest.state.active < 60000`), "やすんだら また 0 から");
    t.noErrors(p);
    await server.close();
  },

  async "「まだ だいじょうぶ」なら 20 ぷん あとに また きく"(t) {
    const server = await t.startServer();
    const b = await t.launchBrowser();
    const p = await b.firstPage();
    await p.goto(server.url);
    await p.boot();
    await p.ev(`rest.state.lastInput = Date.now(); rest.state.active = rest.ASK_AFTER; rest.tick()`);
    t.ok(await waitFor(t, p, `document.querySelectorAll(".dialog-choices button").length === 2`), "きかない");
    await choose(p, "まだ だいじょうぶ");
    await t.sleep(300);
    t.eq(await p.ev(`rest.ASK_AFTER - rest.state.active`), 20 * 60000, "つぎまで 20 ぷん");
    t.ok(await p.ev(`!document.querySelector(".rest")`), "やすむ がめんが でた");
    t.noErrors(p);
    await server.close();
  },
};
