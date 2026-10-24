// ピクセの へや（v1.57）：ROOM を ひらくと まず へやの え。もの を おすと その ページ、「◀ へや」で もどる
export default {
  async "ROOM を ひらくと へや。まどで つぶやき、◀ へや で もどる"(t) {
    const server = await t.startServer();
    const b = await t.launchBrowser();
    const p = await b.firstPage();
    await p.goto(server.url);
    await p.ev(`localStorage.clear()`);
    await p.goto(server.url);
    await p.boot();
    await p.click("#room-btn");
    await t.sleep(400);
    t.ok(await p.ev(`!document.getElementById("room-scene").hidden`), "へやが でない");
    t.ok(await p.ev(`document.querySelector(".rs-window").classList.contains("glow")`), "よんで いない つぶやきで まどが ひからない");
    await p.shot("roomscene.png");
    await p.click(".rs-window");
    await t.sleep(300);
    t.ok(await p.ev(`!document.getElementById("diary-body").hidden && !document.getElementById("room-back").hidden`), "まどで つぶやきに ならない");
    await p.click("#room-back");
    await t.sleep(300);
    t.ok(await p.ev(`!document.getElementById("room-scene").hidden`), "◀ へや で もどらない");
    t.ok(await p.ev(`!document.querySelector(".rs-window").classList.contains("glow")`), "よんだ あとも まどが ひかる");
    t.noErrors(p);
    await server.close();
  },

  async "てがみ・カードが ない ときは くらくて ひらかない（「まだ からっぽ。」）。あれば それ だけの ページ。つぶやきの ページは つぶやき だけ"(t) {
    const server = await t.startServer();
    const b = await t.launchBrowser();
    const p = await b.firstPage();
    await p.goto(server.url);
    await p.ev(`localStorage.clear()`);
    await p.goto(server.url);
    await p.boot();
    await p.click("#room-btn");
    await t.sleep(400);
    t.ok(await p.ev(`document.querySelector(".rs-post").classList.contains("empty") && document.querySelector(".rs-cardbox").classList.contains("empty")`), "からっぽ なのに くらく ない");
    await p.click(".rs-post");
    await t.sleep(200);
    t.ok(await p.ev(`!document.getElementById("room-scene").hidden`), "からっぽ なのに ひらいた");
    t.eq(await p.ev(`document.querySelector(".rs-say").textContent`), "まだ からっぽ。", "ひとこと");
    t.eq(await p.ev(`[...document.querySelectorAll(".rs-status dt")].map((d) => d.textContent)`), ["であって", "あえた ひ", "ワープした かず", "つぎの プレゼント"], "ステータス");
    // てがみが とどくと ポストが ひかって、ひらくと てがみ だけ
    await p.ev(`letter.add({ kind: "test", title: "ためしの てがみ", lines: ["きみへ", "やあ"] }); document.getElementById("room-back").click()`);
    await t.sleep(300);
    t.ok(await p.ev(`document.querySelector(".rs-post").classList.contains("glow")`), "てがみで ポストが ひからない");
    await p.click(".rs-post");
    await t.sleep(300);
    t.ok(await p.ev(`!document.getElementById("letters-body").hidden && document.querySelectorAll("#letters-body .letter-btn").length === 1`), "ポストで てがみの ページに ならない");
    t.ok(await p.ev(`!document.querySelector("#letters-body .tsubuyaki")`), "てがみの ページに つぶやきが でた");
    t.eq(await p.ev(`document.getElementById("diary-title").textContent`), "てがみ", "みだし");
    // つぶやきの ページに プロフィールは もう ない
    await p.ev(`room.open("diary")`);
    await t.sleep(200);
    t.ok(await p.ev(`!document.querySelector("#diary-body .diary-head") && !!document.querySelector("#diary-body .tsubuyaki")`), "つぶやきの ページに プロフィールが ある");
    await p.ev(`room.open("home")`);
    await t.sleep(300);
    await p.shot("roomscene-status.png");
    t.noErrors(p);
    await server.close();
  },
};
