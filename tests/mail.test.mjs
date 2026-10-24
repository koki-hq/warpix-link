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
    t.ok(titles.includes("あきの コスチュームが 入庫しました"), "あきの 入庫の おしらせが ない");
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

  async "あとから きた ひとには、それより まえの おしらせは とどかない（ようこそ は とどく）"(t) {
    const { server, p } = await open(t, { url: "?date=2026-11-05", before: pixe("2026-11-03") });
    t.eq(await p.ev(`mail.list().map((m) => m.id).filter((id) => !id.startsWith("season-"))`), ["welcome"], "まえの おしらせが とどいた");
    t.noErrors(p);
    await server.close();
  },

  async "じぶんに かんけい ある もの だけ：きた ひと おなじ ひづけの おしらせと、さいしょから もって いる きせつの 入庫は とどかない（v1.63.2）"(t) {
    const { server, p } = await open(t, { url: "?date=2026-10-24", before: pixe("2026-10-24") });
    t.eq(await p.ev(`mail.list().map((m) => m.id)`), ["welcome"], "ようこそ だけ に ならない");
    t.ok((await p.ev(`mail.list()[0].body.join("")`)).includes("あきの コスチューム"), "ようこそに いまの きせつの ひとこと が ない");
    // つぎの ひも あきの 入庫は とどかない（さいしょから もって いる）
    await p.goto(server.url + "?date=2026-10-26");
    await p.boot();
    t.ok(!(await p.ev(`mail.list().some((m) => m.id.startsWith("season-autumn"))`)), "さいしょから もって いる きせつの 入庫が とどいた");
    // ふゆに なったら はじめて もらえる ので とどく。らいねんの あきには とどかない
    await p.goto(server.url + "?date=2026-12-02");
    await p.boot();
    t.ok(await p.ev(`mail.list().some((m) => m.id === "season-winter")`), "ふゆの 入庫が とどかない");
    t.noErrors(p);
    await server.close();
  },
};
