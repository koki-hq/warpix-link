// おしらせ（v2.0）：右上の ✉️。よんで いない ものが あれば しるし、ひらくと よんだ ことに なる
import { openApp, sleep } from "./lib/app.mjs";

export default {
  async "よんで いない おしらせが あると しるし。ひらいて よむと きえる。v1 の おしらせは でない"(t) {
    const { server, p } = await openApp(t, { query: "?date=2026-11-10" });
    t.ok(await p.ev(`!document.querySelector(".mail-dot").hidden && document.getElementById("mail-btn").classList.contains("has-new")`), "しるしが ない");
    // ✉️ が みえる（v2.0 では v1 の「起動の あと ふわっと」が のこって ずっと すきとおって いた、v2.0.1）
    t.ok(await p.ev(`(() => { const b = document.getElementById("mail-btn"); const r = b.getBoundingClientRect(); return getComputedStyle(b).opacity === "1" && r.width > 30 && r.height > 24; })()`), "✉️ が みえない");
    await p.click("#mail-btn");
    await sleep(200);
    t.ok(await p.ev(`document.getElementById("mail").open`), "✉️ で ひらかない");
    const titles = await p.ev(`[...document.querySelectorAll(".mail-title")].map((x) => x.textContent)`);
    t.ok(titles.includes("ようこそ、WARPIX LINK へ"), `ようこそ が ない：${titles}`);
    t.ok(!titles.some((x) => /ROOM|コスチューム|パーティ|入荷|ボックス|たな/.test(x)), `へや・クローゼットの おしらせが のこる：${titles}`);
    t.ok(titles.includes("WARPIX LINK が新しくなりました") && titles.includes("WARPIX LINK を リリースしました"), `v2 と リリースの おしらせが ない：${titles}`);
    for (const id of await p.ev(`[...document.querySelectorAll(".mail-item")].map((b) => b.dataset.id)`)) {
      await p.ev(`document.querySelector('.mail-item[data-id="${id}"]').click()`);
      t.ok(await p.ev(`!document.getElementById("mail-read").hidden && document.getElementById("mail-read").textContent.includes("WARPIX製作所")`), `${id} が よめない`);
      t.ok(await p.ev(`document.querySelector("#mail-read .mail-sign")?.textContent === "WARPIX製作所" && !document.getElementById("mail-back").hidden && !document.getElementById("mail-back").closest(".about-top")`), `${id}：署名か したの「◀ いちらんへ」が ない`);
      if (id === "2026-11-10-v2") {
        await p.shot("v2-mail-read.png");
        t.eq(await p.ev(`document.querySelectorAll("#mail-read .mail-points li").length`), 6, "かじょうがきが 1 こずつ に なって いない");
      }
      if (id === "2026-11-10-v2") t.ok(await p.ev(`document.getElementById("mail-read").textContent.includes("今後とも WARPIX LINK をよろしくお願いします。")`), "v2 の おしらせの 文が ちがう");
      await p.ev(`document.getElementById("mail-back").click()`);
    }
    await p.shot("v2-mail-list.png");
    t.ok(await p.ev(`document.querySelector(".mail-dot").hidden`), "ぜんぶ よんでも しるしが のこる");
    await p.goto(await p.ev("location.href"), 400);
    t.ok(await p.ev(`document.querySelector(".mail-dot").hidden`), "ひらきなおすと また しるし");
    t.noErrors(p);
    await server.close();
  },

  async "みらいの ひづけの おしらせは その ひまで でない"(t) {
    const { server, p } = await openApp(t, { query: "?date=2026-11-01" });
    t.eq(await p.ev(`mail.list().map((m) => m.id)`), ["welcome", "2026-11-01-open"], "11/1 の おしらせが ちがう");
    t.ok(await p.ev(`mail.list().every((m) => m.date <= "2026-11-01")`), "みらいの おしらせが でた");
    t.noErrors(p);
    await server.close();
  },
};
