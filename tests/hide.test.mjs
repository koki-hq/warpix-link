// かくれピクセ：まいにち 3 びきの ちびピクセが ページの どこかに。ぜんぶ みつけると 実績
const ymdNow = `(() => { const d = new Date(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); })()`;

export default {
  async "3 びきが のぞいていて、みつけると 50 てん。ぜんぶで 実績。おなじ日は もう でない"(t) {
    const server = await t.startServer();
    const b = await t.launchBrowser();
    const p = await b.firstPage();
    await p.goto(server.url + "?away=0");
    await p.ev(`localStorage.clear()`);
    await p.goto(server.url);
    await p.boot({ readIntro: false });
    await t.sleep(2200);
    const info = await p.ev(`[...document.querySelectorAll(".hide-pixe")].map((b) => { const r = b.getBoundingClientRect(); return { shown: !b.hidden && r.width > 0, label: b.getAttribute("aria-label") }; })`);
    t.eq(info.length, 3, "ちびピクセの かず");
    t.ok(info.every((i) => i.shown && i.label === "かくれている ちびピクセ"), `みえない・なまえが ない: ${JSON.stringify(info)}`);
    // それぞれ、えらばれた ばしょの そばに いる
    const near = await p.ev(`hide.spotsOf(${ymdNow}).map(([id, sel]) => { const a = document.querySelector(sel).getBoundingClientRect(); return [...document.querySelectorAll(".hide-pixe")].some((b) => { const r = b.getBoundingClientRect(); return r.right > a.left - 30 && r.left < a.right + 30 && r.bottom > a.top - 30 && r.top < a.bottom + 30; }); })`);
    t.eq(near, [true, true, true], "ばしょから はなれている");
    // リンクの まんなかは ふさがない
    t.ok(await p.ev(`[...document.querySelectorAll(".pixel-btn:not(.secret)")].every((a) => { const r = a.getBoundingClientRect(); return document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2)?.closest(".pixel-btn") === a; })`), "リンクが おせない");
    await p.shot("hide.png");
    const score0 = Number(await p.ev(`document.querySelector("[data-score]").textContent`));
    await p.ev(`document.querySelector(".hide-pixe").click()`);
    await t.sleep(700);
    t.ok((await p.text()).includes("1/3") || (await p.ev(`document.getElementById("dialog-text").textContent`)).startsWith("みつか"), "1 ぴきめの ひとこと");
    t.eq(Number(await p.ev(`document.querySelector("[data-score]").textContent`)) - score0, 50, "てんすう");
    t.eq(await p.ev(`JSON.parse(localStorage.getItem("warpix-hide")).found.length`), 1, "ほぞん");
    await p.ev(`document.querySelector(".hide-pixe").click()`);
    await t.sleep(700);
    await p.ev(`document.querySelector(".hide-pixe").click()`);
    await t.sleep(700);
    t.ok(await p.ev(`achievements.has("hideseek") && grow.state.diary.some((e) => e.type === "hide")`), "実績・日記");
    t.ok(await p.ev(`document.getElementById("dialog-text").textContent.startsWith("ぜんぶ")`), "ぜんぶの ひとこと");
    t.eq(await p.ev(`document.querySelectorAll(".hide-pixe").length`), 0, "のこっている");
    await p.goto(server.url);
    await p.boot({ readIntro: false });
    await t.sleep(2200);
    t.eq(await p.ev(`document.querySelectorAll(".hide-pixe").length`), 0, "おなじ日に また でた");
    t.noErrors(p);
    await server.close();
  },

  async "ばしょは 日で きまり、いろいろな ところに かくれる。ゲーム中と シンプルモードでは でない"(t) {
    const server = await t.startServer();
    const b = await t.launchBrowser();
    const p = await b.firstPage();
    await p.goto(server.url + "?away=0");
    await p.ev(`localStorage.clear()`);
    await p.goto(server.url);
    const same = await p.ev(`JSON.stringify(hide.spotsOf("2026-10-16")) === JSON.stringify(hide.spotsOf("2026-10-16"))`);
    t.ok(same, "おなじ日で ばしょが かわる");
    const used = await p.ev(`new Set(Array.from({ length: 40 }, (_, i) => hide.spotsOf("2026-11-" + String(i % 30 + 1).padStart(2, "0") + "x" + i).map(([id]) => id)).flat()).size`);
    t.ok(used >= 11, `つかわれる ばしょが すくない: ${used}`);
    t.ok(await p.ev(`Array.from({ length: 30 }, (_, i) => new Set(hide.spotsOf("2026-12-" + String(i + 1).padStart(2, "0")).map(([id]) => id)).size === 3).every(Boolean)`), "おなじ ばしょが 2 かい えらばれた");
    await p.boot({ readIntro: false });
    await t.sleep(2200);
    await p.ev(`document.getElementById("coin-slot").click()`);
    await t.sleep(300);
    t.eq(await p.ev(`getComputedStyle(document.querySelector(".hide-layer")).display`), "none", "ゲーム中に でている");
    await p.key("Escape");
    await p.goto(server.url + "?simple=1");
    await t.sleep(2500);
    t.eq(await p.ev(`document.querySelectorAll(".hide-pixe").length`), 0, "シンプルモードで でた");
    t.noErrors(p);
    await server.close();
  },
};
