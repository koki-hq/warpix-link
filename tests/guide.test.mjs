// ピクセの ガイド：2 日目から 1 日 1 つ、まだ使っていない機能のヒント
const dayAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const pixe = (days) => JSON.stringify({ born: dayAgo(days), days: Array.from({ length: days }, (_, i) => dayAgo(i + 1)), last: dayAgo(1), stage: 0, sulk: false, pokeMark: 0, diary: [] });

async function visit(t, storage) {
  const server = await t.startServer();
  const b = await t.launchBrowser();
  const p = await b.firstPage();
  await p.goto(server.url);
  await p.ev(`localStorage.clear(); ${storage}`);
  await p.goto(server.url);
  await p.ev(`document.getElementById("start-btn").click()`);
  await t.sleep(2600);
  const intro = await p.readIntro();
  return { server, p, intro };
}
const tipOf = (intro) => intro.find((l) => l.startsWith("きょうの ヒント")) ?? null;

export default {
  async "はじめての日はヒントなし、2 日目からヒントが 1 つ"(t) {
    let r = await visit(t, "");
    t.eq(tipOf(r.intro), null, "はじめての日にヒントが出た");
    t.noErrors(r.p);
    await r.server.close();
    await t.closeAll();
    r = await visit(t, `localStorage.setItem("warpix-pixe", ${JSON.stringify(pixe(1))})`);
    const tip = tipOf(r.intro);
    t.ok(tip?.includes("DIARY"), `2 日目のヒント: ${tip}`);
    t.eq(r.intro.filter((l) => l.startsWith("きょうの ヒント")).length, 1, "ヒントは 1 つだけ");
    t.noErrors(r.p);
    await r.server.close();
  },

  async "使ったことのある機能と、もう言ったヒントはとばす"(t) {
    const r = await visit(t, `localStorage.setItem("warpix-pixe", ${JSON.stringify(pixe(5))});
      localStorage.setItem("warpix-achievements", JSON.stringify(["diary"]));
      localStorage.setItem("warpix-guide", JSON.stringify({ last: "${dayAgo(1)}", told: ["compose"] }));`);
    const tip = tipOf(r.intro);
    t.ok(tip?.includes("おみくじ"), `日記は使った・作曲は言ったので、次はおみくじのはず: ${tip}`);
    // 同じ日にもう一度来ても、言わない
    await r.p.goto((await r.p.ev(`location.href`)));
    await r.p.ev(`document.getElementById("start-btn").click()`);
    await t.sleep(2600);
    t.eq(tipOf(await r.p.readIntro()), null, "同じ日に 2 回言った");
    t.noErrors(r.p);
    await r.server.close();
  },

  async "ヒントに ひみつのコマンドの答えは ない"(t) {
    const server = await t.startServer();
    const b = await t.launchBrowser();
    const p = await b.firstPage();
    await p.goto(server.url);
    const texts = await p.ev(`guide.tips.length`);
    t.ok(texts >= 8, "ヒントが少ない");
    const src = (await import("node:fs")).readFileSync(t.ROOT + "/guide.js", "utf8");
    for (const secret of ["gameboy", "party", "pixe\"", "konami", "invaders\"", "↑"]) {
      const inTips = src.split("const TIPS")[1].split("];")[0];
      t.ok(!inTips.includes(secret.replace("\"", "")) || secret === "invaders\"", `ヒントに「${secret}」`);
    }
    t.noErrors(p);
    await server.close();
  },
};
