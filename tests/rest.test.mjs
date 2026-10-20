// アプリの ショートカット（?go=）と、とおくを みる きゅうけい（rest）
import { readFileSync } from "node:fs";

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

  async "ピクセは きゅうけいを すすめない（v1.52）。rest と うつと 20 びょう とおくを みる"(t) {
    const server = await t.startServer();
    const b = await t.launchBrowser();
    const p = await b.firstPage();
    await p.goto(server.url + "?away=0");
    await p.ev(`localStorage.clear()`);
    await p.goto(server.url);
    await p.boot();
    t.ok(await p.ev(`rest.tick === undefined && rest.state === undefined`), "きゅうけいを かぞえる しかけが のこって いる");
    await p.type("rest");
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
    t.noErrors(p);
    await server.close();
  },
};
