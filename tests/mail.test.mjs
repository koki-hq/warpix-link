// おしらせ（v2.0）：右上の ✉️。よんで いない ものが あれば しるし、ひらくと よんだ ことに なる
import { openApp, sleep } from "./lib/app.mjs";

export default {
  async "よんで いない おしらせが あると しるし。ひらいて よむと きえる。v1 の おしらせは でない"(t) {
    const { server, p } = await openApp(t, { query: "?date=2026-11-10" });
    t.ok(await p.ev(`!document.querySelector(".mail-dot").hidden && document.getElementById("mail-btn").classList.contains("has-new")`), "しるしが ない");
    await p.click("#mail-btn");
    await sleep(200);
    t.ok(await p.ev(`document.getElementById("mail").open`), "✉️ で ひらかない");
    const titles = await p.ev(`[...document.querySelectorAll(".mail-title")].map((x) => x.textContent)`);
    t.ok(titles.includes("ようこそ、WARPIX LINK へ"), `ようこそ が ない：${titles}`);
    t.ok(!titles.some((x) => /ROOM|コスチューム|パーティ|リリースしました/.test(x)), `v1 の おしらせが のこる：${titles}`);
    for (const id of await p.ev(`[...document.querySelectorAll(".mail-item")].map((b) => b.dataset.id)`)) {
      await p.ev(`document.querySelector('.mail-item[data-id="${id}"]').click()`);
      t.ok(await p.ev(`!document.getElementById("mail-read").hidden && document.getElementById("mail-read").textContent.includes("WARPIX製作所")`), `${id} が よめない`);
      await p.ev(`document.getElementById("mail-back").click()`);
    }
    t.ok(await p.ev(`document.querySelector(".mail-dot").hidden`), "ぜんぶ よんでも しるしが のこる");
    await p.goto(await p.ev("location.href"), 400);
    t.ok(await p.ev(`document.querySelector(".mail-dot").hidden`), "ひらきなおすと また しるし");
    t.noErrors(p);
    await server.close();
  },

  async "みらいの ひづけの おしらせは その ひまで でない"(t) {
    const { server, p } = await openApp(t, { query: "?date=2026-11-01" });
    const ids = await p.ev(`mail.list().map((m) => m.id)`);
    t.ok(ids.every((id) => id === "welcome" || mail.MAILS.find?.((m) => m.id === id)), "へんな おしらせ");
    t.ok(await p.ev(`mail.list().every((m) => m.date <= "2026-11-01")`), "みらいの おしらせが でた");
    t.noErrors(p);
    await server.close();
  },
};
