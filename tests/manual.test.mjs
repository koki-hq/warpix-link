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
    // v2.1：はじめては うしろを まっくらに（リンクの 画面が 一瞬 見えない）。ピクセは 説明書を とじてから しゃべる
    t.ok(await p.ev(`document.getElementById("manual").classList.contains("first")`), "はじめての しるしが ない");
    t.eq(await p.ev(`getComputedStyle(document.getElementById("manual"), "::backdrop").backgroundColor`), "rgb(15, 11, 30)", "うしろが すけて 見える");
    t.eq(await p.ev(`document.getElementById("dialog-text").textContent`), "", "説明書の うしろで ピクセが しゃべって いる");
    const text = await p.ev(`document.getElementById("manual").textContent`);
    for (const w of ["＋", "グループ", "リンクを 追加", "こんな人におすすめ", "自分のタイミング", "使い方はあなた次第", "空間", "きろく"]) t.ok(text.includes(w), `「${w}」の せつめいが ない`);
    t.ok(!/12 ?文字|もじ まで|いっしょに ワープしよう|たな|ワンタップ/.test(text), "説明書に いらない ことが のこる");
    t.ok(!/ROOM|ミニゲーム|おみくじ|パーティ/.test(text), "なくした ものの せつめいが のこる");
    await p.shot("v2-manual.png");
    for (let i = 0; i < 6 && (await p.ev(`document.getElementById("manual").open`)); i++) await p.click("#manual-next");
    await sleep(200);
    t.ok(await p.ev(`!document.getElementById("manual").open`), "はじめる で とじない");
    t.ok((await p.text()).includes("「グループを つくる」"), "とじた あと ピクセが 案内しない");
    await p.goto(await p.ev("location.href"), 500);
    t.ok(await p.ev(`!document.getElementById("manual").open`), "2 かいめも でる");
    t.noErrors(p);
    await server.close();
  },
};
