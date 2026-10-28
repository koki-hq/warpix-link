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

  async "あとから きた ひとにも、きた きせつに でた おしらせは とどく。まえの きせつの ものは とどかない（v1.64）"(t) {
    // あき（9〜11 がつ）に きた：10/24 の おしらせも 11/1 の 開店も とどく
    const { server, p } = await open(t, { url: "?date=2026-11-05", before: pixe("2026-11-03") });
    const ids = await p.ev(`mail.list().map((m) => m.id)`);
    t.ok(ids.includes("welcome") && ids.includes("2026-10-24-closet") && ids.includes("2026-11-01-open"), `きた きせつの おしらせが とどかない：${ids}`);
    // ふゆに きた：あきの おしらせは とどかない
    await p.ev(`localStorage.clear(); ${pixe("2026-12-03")}`);
    await p.goto(server.url + "?date=2026-12-05");
    await p.boot();
    t.eq(await p.ev(`mail.list().map((m) => m.id).filter((id) => !id.startsWith("season-"))`), ["welcome"], "まえの きせつの おしらせが とどいた");
    t.noErrors(p);
    await server.close();
  },

  async "あとから きた ひとには、まえからの ひと むけの 話は とどかない。ようこそ が いちばん した で、ひづけは きた ひ（v1.65.3）"(t) {
    const { server, p } = await open(t, { url: "?date=2026-10-28", before: pixe("2026-10-28") });
    const list = await p.ev(`mail.list().map((m) => [m.id, m.date])`);
    const ids = list.map(([id]) => id);
    t.ok(!ids.includes("2026-10-24-mailbox") && !ids.includes("2026-10-25-shelves"), `まえからの ひと むけが とどいた：${ids}`);
    t.ok(["2026-10-24-room", "2026-10-24-closet", "2026-10-24-party"].every((id) => ids.includes(id)), `つかいかたの おしらせが ない：${ids}`);
    t.eq(ids.at(-1), "welcome", "ようこそ が いちばん した に ない");
    t.ok(list.every(([, d]) => d === "2026-10-28"), `きた ひ より まえの ひづけ：${JSON.stringify(list)}`);
    // まえから いる ひとには とどく
    await p.ev(`localStorage.clear(); ${pixe("2026-10-20")}`);
    await p.goto(server.url + "?date=2026-10-28");
    await p.boot();
    const old = await p.ev(`mail.list().map((m) => m.id)`);
    t.ok(old.includes("2026-10-24-mailbox") && old.includes("2026-10-25-shelves") && old.at(-1) === "welcome", `まえから いる ひと：${old}`);
    t.noErrors(p);
    await server.close();
  },

  async "ようこそ は ようこそ だけ。いまの きせつの 入庫は べつの 1 つうで とどき、ふゆに なっても きえない（v1.64）"(t) {
    const { server, p } = await open(t, { url: "?date=2026-10-24", before: pixe("2026-10-24") });
    const welcome = await p.ev(`mail.list().find((m) => m.id === "welcome")`);
    t.ok(!welcome.body.join("").includes("コスチューム") && !welcome.action, `ようこそに ほかの ことが まざった：${welcome.body.join("")}`);
    // つぎの ひ：あきの 入庫が べつに とどく
    await p.goto(server.url + "?date=2026-10-26");
    await p.boot();
    t.ok(await p.ev(`mail.list().some((m) => m.id === "season-autumn")`), "いまの きせつの 入庫が とどかない");
    // ふゆに なったら ふゆの 入庫。あきの ものも きえない
    await p.goto(server.url + "?date=2026-12-02");
    await p.boot();
    t.ok(await p.ev(`mail.list().some((m) => m.id === "season-winter") && mail.list().some((m) => m.id === "season-autumn")`), "ふゆの 入庫が とどかない か、あきの ものが きえた");
    t.noErrors(p);
    await server.close();
  },
};
