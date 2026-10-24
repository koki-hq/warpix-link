// 1きせいの きっぷ（v1.41）：正式な 開店より まえに はじめて きた ひとへの きねんひん
// 本物の 日付に よらない ように、はじめて きた 日（warpix-pixe の born）を さきに いれて ためす
async function page(t, born) {
  const server = await t.startServer();
  const b = await t.launchBrowser();
  const p = await b.firstPage();
  await p.goto(server.url);
  await p.ev(`localStorage.clear(); localStorage.setItem("warpix-pixe", JSON.stringify({ born: "${born}", days: ["${born}"], last: "${born}", stage: 0, sulk: false, pokeMark: 0, diary: [] }))`);
  await p.goto(server.url + "?away=0");
  return { server, p };
}

export default {
  async "開店まえに きた ひと：ピクセが きっぷを わたし、へやの かべに「1きせいの きっぷ」"(t) {
    const { server, p } = await page(t, "2026-10-12");
    await p.boot({ readIntro: false });
    const lines = await p.readIntro();
    t.ok(lines.some((l) => l.includes("1きせい")), `わたさない: ${JSON.stringify(lines)}`);
    t.ok(await p.ev(`ticket.has()`), "1きせいに ならない");
    await p.ev(`room.open("home")`);
    await t.sleep(300);
    await p.click(".rs-ticket");
    t.ok((await p.ev(`document.querySelector(".rs-say").textContent`)).includes("10/12 に きてくれた"), "かべの きっぷ");
    t.ok(await p.ev(`grow.state.diary.some((e) => e.type === "ticket")`), "にっき");
    t.ok(await p.ev(`Boolean(JSON.parse(localStorage.getItem("warpix-ticket")))`), "ほぞん");
    // 2 かいめは もう いわない
    await p.goto(server.url + "?away=0");
    await p.boot({ readIntro: false });
    t.ok(!(await p.readIntro()).some((l) => l.includes("1きせい")), "2 かいめも いった");
    t.noErrors(p);
    await server.close();
  },

  async "開店の あとに きた ひとには なにも ない"(t) {
    const { server, p } = await page(t, "2026-11-05");
    await p.boot({ readIntro: false });
    t.ok(!(await p.readIntro()).some((l) => l.includes("1きせい")), "わたした");
    t.ok(!(await p.ev(`ticket.has()`)), "1きせいに なった");
    await p.ev(`room.open("diary")`);
    await t.sleep(300);
    t.ok(!(await p.ev(`Boolean(document.querySelector(".diary-ticket"))`)), "プロフィールに でた");
    t.noErrors(p);
    await server.close();
  },

  async "ポストカードと きろくカードに きんいろの「★1きせい」"(t) {
    const gold = (expr) => `${expr}.then((cv) => { const d = cv.getContext("2d").getImageData(250, 545, 700, 45).data; for (let i = 0; i < d.length; i += 4) if (d[i] > 240 && d[i + 1] > 200 && d[i + 1] < 230 && d[i + 2] < 110) return true; return false; })`;
    let { server, p } = await page(t, "2026-10-12");
    await p.boot();
    t.ok(await p.ev(gold(`postcard.render()`)), "ポストカードに しるしが ない");
    await p.ev(`emit("adventure-clear", { time: 20, best: true, vsGhost: null })`);
    t.ok(await p.ev(gold(`rta.render()`)), "きろくカードに しるしが ない");
    t.noErrors(p);
    await server.close();
    await t.closeAll();
    ({ server, p } = await page(t, "2026-11-05"));
    await p.boot();
    t.ok(!(await p.ev(gold(`postcard.render()`))), "開店の あとの ひとの ポストカードに しるし");
    t.noErrors(p);
    await server.close();
  },
};
