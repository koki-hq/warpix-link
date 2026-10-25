// このページについて：説明の窓、シンプルモードでも開ける、きろくを ぜんぶ けす（2 回押し）
export default {
  async "フッターから開いて、保存するもの・送るものが書いてある"(t) {
    const server = await t.startServer();
    const b = await t.launchBrowser();
    const p = await b.firstPage();
    await p.goto(server.url);
    await p.boot();
    await p.click("#about-btn");
    await t.sleep(300);
    t.ok(await p.ev(`document.getElementById("about").open`), "窓が開かない");
    // せつめいしょ と オープニング の ボタンは くっつかない（v1.64）
    const gap = await p.ev(`(() => { const a = document.getElementById("about-manual").getBoundingClientRect(), b = document.getElementById("about-prologue").getBoundingClientRect(); return Math.max(b.left - a.right, b.top - a.bottom); })()`);
    t.ok(gap >= 6, `ボタンが くっついて いる：${gap}px`);
    const text = await p.ev(`document.getElementById("about").innerText`);
    for (const want of ["この ブラウザの なかだけ", "10km", "Open-Meteo", "Supabase", "Google Fonts", "IP アドレス", "クッキー"]) {
      t.ok(text.includes(want), `「${want}」の説明がない`);
    }
    await p.shot("about.png");
    t.noErrors(p);
    await server.close();
  },

  async "シンプルモードでも開ける"(t) {
    const server = await t.startServer();
    const b = await t.launchBrowser();
    const p = await b.firstPage();
    await p.goto(`${server.url}?simple=1`);
    t.ok(await p.ev(`getComputedStyle(document.getElementById("about-btn")).display !== "none"`), "シンプルモードでリンクが見えない");
    await p.click("#about-btn");
    await t.sleep(300);
    t.ok(await p.ev(`document.getElementById("about").open`), "シンプルモードで開かない");
    t.noErrors(p);
    await server.close();
  },

  async "きろくを けすは 1 回目で止められ、2 回目で ぜんぶ消えて はじめからになる"(t) {
    const server = await t.startServer();
    const b = await t.launchBrowser();
    const p = await b.firstPage();
    await p.goto(server.url);
    await p.ev(`localStorage.clear(); localStorage.setItem("warpix-hi", "9999"); localStorage.setItem("warpix-links", JSON.stringify({ youtube: { n: 5, last: "2026-01-01" } })); localStorage.setItem("not-ours", "keep")`);
    await p.goto(server.url);
    await p.ev(`document.getElementById("about-btn").click()`);
    await p.ev(`document.getElementById("about-reset").click()`);
    t.ok((await p.ev(`document.getElementById("about-reset-msg").textContent`)).includes("きえちゃうよ"), "1 回目でピクセが止めない");
    t.eq(await p.ev(`localStorage.getItem("warpix-hi")`), "9999", "1 回目で消えてしまった");
    await p.ev(`document.getElementById("about-reset").click()`);
    await t.sleep(2000);
    t.eq(await p.ev(`[localStorage.getItem("warpix-hi"), localStorage.getItem("warpix-links")]`), [null, null], "消す前の記録が残っている");
    // 読みなおした瞬間に始まる記録（新しい出会い、きょうの空・月の図鑑）だけがある。いま見ている時刻は もう のこさない（v1.52.1）
    t.eq(await p.ev(`Object.keys(localStorage).filter((k) => k.startsWith("warpix-") && !["warpix-pixe", "warpix-zukan"].includes(k))`), [], "はじめから以外の記録がある");
    t.eq(await p.ev(`localStorage.getItem("not-ours")`), "keep", "このサイト以外の記録まで消した");
    t.eq(await p.ev(`JSON.parse(localStorage.getItem("warpix-pixe")).diary[0].text`), "はじめて あった。ドキドキした。", "はじめからに なっていない");
    t.noErrors(p);
    await server.close();
  },
};
