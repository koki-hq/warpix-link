// せつめいしょ（v1.48 → v2.0）：はじめての 人だけ、リンクの 画面の うえに かさねる。「はじめる」で とじて、もう でない
import { openApp, sleep } from "./lib/app.mjs";

export default {
  async "はじめての 人には せつめいしょ。はじめる で とじて、つぎからは でない"(t) {
    const { server, p } = await openApp(t);
    await p.ev(`localStorage.clear()`);
    await p.send("Page.addScriptToEvaluateOnNewDocument", { source: "window.WARPIX_MANUAL = true;" });
    await p.goto(await p.ev("location.href"), 500);
    t.ok(await p.ev(`document.getElementById("manual").open`), "せつめいしょが でない");
    t.ok(await p.ev(`!document.getElementById("empty").hidden`), "うしろに リンクの 画面が ない");
    const text = await p.ev(`document.getElementById("manual").textContent`);
    for (const w of ["＋", "グループ", "リンクを 追加", "12", "かんばん", "ワープ"]) t.ok(text.includes(w), `「${w}」の せつめいが ない`);
    t.ok(!/ROOM|ミニゲーム|おみくじ|パーティ/.test(text), "なくした ものの せつめいが のこる");
    await p.shot("v2-manual.png");
    for (let i = 0; i < 4 && (await p.ev(`document.getElementById("manual").open`)); i++) await p.click("#manual-next");
    await sleep(200);
    t.ok(await p.ev(`!document.getElementById("manual").open`), "はじめる で とじない");
    await p.goto(await p.ev("location.href"), 500);
    t.ok(await p.ev(`!document.getElementById("manual").open`), "2 かいめも でる");
    t.noErrors(p);
    await server.close();
  },
};
