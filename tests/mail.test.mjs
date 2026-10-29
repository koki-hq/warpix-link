// おしらせ（v1.59）：みぎうえの ふうとう。けんめいの いちらん → しょうさい。よんで いない ものが あると きんいろ。どこにも よみに いかない
const pixe = (born) => `localStorage.setItem("warpix-pixe", JSON.stringify({ born: "${born}", days: ["${born}"], last: "${born}", stage: 0, sulk: false, pokeMark: 0, diary: [] }))`;

async function open(t, { url = "", before = "" } = {}) {
  const server = await t.startServer();
  const b = await t.launchBrowser();
  const p = await b.firstPage();
  await p.goto(server.url + url);
  await p.ev(`localStorage.clear(); ${before}`);
  await p.goto(server.url + url);
  await p.boot();
  return { server, p };
}

export default {
  async "ふうとうが ひかり、いちらん → しょうさい。よむと NEW が きえ、ぜんぶ よむと ひからない"(t) {
    const { server, p } = await open(t, { url: "?date=2026-10-25", before: pixe("2026-10-20") });
    t.ok(await p.ev(`document.getElementById("mail-btn").classList.contains("has-new")`), "ふうとうが ひからない");
    t.ok(await p.ev(`!document.getElementById("news-link") && !document.getElementById("compose-btn") && !document.getElementById("simple-enter")`), "まえの ボタンが のこって いる");
    await p.click("#mail-btn");
    await t.sleep(200);
    const titles = await p.ev(`[...document.querySelectorAll(".mail-item .mail-title")].map((e) => e.textContent)`);
    t.ok(titles.includes("コスチュームが 入庫しました") && titles.includes("ようこそ、WARPIX LINK へ"), `いちらん：${titles}`);
    t.ok(!titles.includes("WARPIX LINK、開店しました"), "みらいの おしらせが でた");
    t.eq(titles.at(-1), "ようこそ、WARPIX LINK へ", "まえから いる ひとの ようこそ が いちばん したに ない");
    await p.shot("mail.png");
    await p.ev(`[...document.querySelectorAll(".mail-item")].find((b) => b.textContent.includes("コスチュームが 入庫")).click()`);
    await t.sleep(200);
    t.ok(await p.ev(`!document.getElementById("mail-read").hidden && document.getElementById("mail-read").textContent.includes("ハンガーラック")`), "しょうさいが でない");
    t.ok(await p.ev(`achievements.has("factory")`), "実績「せいさくしょ けんがく」が ない");
    // ボタンで クローゼットへ
    await p.click(".mail-action");
    await t.sleep(300);
    t.ok(await p.ev(`document.getElementById("diary").open && !document.getElementById("hat-body").hidden`), "クローゼットに いかない");
    await p.ev(`document.getElementById("diary").close(); mail.list().forEach((m) => mail.state.read.includes(m.id) || mail.state.read.push(m.id)); mail.mark()`);
    t.ok(!(await p.ev(`document.getElementById("mail-btn").classList.contains("has-new")`)), "ぜんぶ よんでも ひかる");
    // ひらく ひ（11/1）には 開店の おしらせ
    await p.goto(server.url + "?date=2026-11-01");
    await p.boot();
    t.ok(await p.ev(`mail.unread().map((m) => m.id).includes("2026-11-01-open")`), "開店の おしらせが とどかない");
    t.noErrors(p);
    await server.close();
  },

  async "開店からは 掲示板：プレリリースの おしらせは きえ、ほんとうの ひづけで いつ きた ひとにも みえる。ようこそ も きた ひの ひづけ（v1.66.1）"(t) {
    // プレリリース中（10/28）：まえからの おしらせも ある
    const { server, p } = await open(t, { url: "?date=2026-10-28", before: pixe("2026-10-28") });
    const pre = await p.ev(`mail.list().map((m) => m.id)`);
    t.eq(pre[0], "welcome", "ようこそ が いちばん うえに ない");
    t.ok(pre.includes("2026-10-24-room") && pre.includes("2026-10-25-shelves"), `プレリリースの おしらせ：${pre}`);
    // 開店の ひ：プレリリースの ものは きえて、ようこそ と 開店 だけ（まえから きて いる ひとも）
    await p.ev(`localStorage.clear(); ${pixe("2026-10-20")}`);
    await p.goto(server.url + "?date=2026-11-01");
    await p.boot();
    t.eq(await p.ev(`mail.list().map((m) => m.id)`), ["2026-11-01-open", "welcome"], "開店の ひの おしらせ（まえから いる ひとの ようこそ は した）");
    // 11/1 に はじめて きた ひと：開店が さいしょの 1 つう、ようこそ が その あと（おなじ ひは ようこそ が うえ）
    await p.ev(`localStorage.clear(); ${pixe("2026-11-01")}`);
    await p.goto(server.url + "?date=2026-11-01");
    await p.boot();
    t.eq(await p.ev(`mail.list().map((m) => m.id)`), ["welcome", "2026-11-01-open"], "11/1 に きた ひとの おしらせ");
    await p.click("#mail-btn");
    await t.sleep(200);
    t.eq(await p.ev(`document.querySelector(".mail-item .mail-date").textContent`), "11/1", "ようこそ に ひづけが ない");
    await p.ev(`document.getElementById("mail").close()`);
    // 12 がつに はじめて きた ひと：あきの 入荷も 開店も ほんとうの ひづけで みえる。あたらしい じゅん
    await p.ev(`localStorage.clear(); ${pixe("2026-12-20")}`);
    await p.goto(server.url + "?date=2026-12-20");
    await p.boot();
    const later = await p.ev(`mail.list().map((m) => [m.id, m.date])`);
    t.eq(later.map(([id]) => id), ["welcome", "2026-12-18-christmas", "2026-12-01-winter", "2026-11-15-autumn", "2026-11-01-open"], "12 がつに きた ひとの 掲示板");
    t.eq(later.at(-1)[1], "2026-11-01", "ひづけが ほんとうの ひ で ない");
    t.noErrors(p);
    await server.close();
  },
};
