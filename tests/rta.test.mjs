// ピクセ RTA（v1.39）：ぼうけんを クリアすると きろくカード。おなじ そらの タイム。?date= では ほぞん しない
async function page(t, query = "") {
  const server = await t.startServer();
  const b = await t.launchBrowser();
  const p = await b.firstPage();
  await p.goto(server.url);
  await p.ev(`localStorage.clear()`);
  await p.goto(server.url + "?away=0" + query);
  await p.boot();
  return { server, p };
}
const clear = (p, time, vsGhost = null) => p.ev(`emit("adventure-clear", { time: ${time}, best: true, vsGhost: ${vsGhost} })`);

export default {
  async "クリアすると ピクセが きいて、「つくる」で きろくカード。きょうの ベストだけ のこる"(t) {
    const { server, p } = await page(t);
    await clear(p, 21.5, -1.25);
    await t.sleep(2500);
    t.ok((await p.text()).includes("カードに する"), `きかない: ${await p.text()}`);
    await p.ev(`document.querySelector(".dialog-choices button").click()`);
    await t.sleep(1500);
    t.ok(await p.ev(`document.querySelector(".postcard img")?.alt.includes("21.5") ?? false`), `カードが でない: ${await p.ev(`document.querySelector(".postcard img")?.alt`)}`);
    t.eq(await p.ev(`document.querySelector(".postcard").getAttribute("aria-label")`), "ピクセ RTA の きろくカード", "まどの なまえ");
    t.ok(await p.ev(`document.querySelector(".postcard-save").download.startsWith("warpix-rta-")`), "ほぞんの なまえ");
    t.ok(await p.ev(`achievements.has("rta-card")`), "実績");
    const s = await p.ev(`JSON.parse(localStorage.getItem("warpix-rta"))`);
    t.eq([s.best, s.ghostDiff], [21.5, -1.25], "ほぞん");
    await p.ev(`document.querySelector(".postcard-close").click()`);
    // おそい タイムでは かわらない、はやい タイムで かわる
    await clear(p, 30);
    t.eq(await p.ev(`JSON.parse(localStorage.getItem("warpix-rta")).best`), 21.5, "おそいのに かわった");
    await clear(p, 19.25);
    t.eq(await p.ev(`JSON.parse(localStorage.getItem("warpix-rta")).best`), 19.25, "はやいのに かわらない");
    t.noErrors(p);
    await server.close();
  },

  async "カードの 画像に タイムが かかれて いる（canvas の 大きさと 中身）"(t) {
    const { server, p } = await page(t);
    await clear(p, 18.72);
    const info = await p.ev(`rta.render().then((cv) => ({ w: cv.width, h: cv.height, ink: cv.getContext("2d").getImageData(430, 200, 600, 110).data.some((v, i) => i % 4 === 0 && v > 200) }))`);
    t.eq([info.w, info.h], [1200, 630], "大きさ");
    t.ok(info.ink, "タイムの ところに なにも かかれて いない");
    t.noErrors(p);
    await server.close();
  },

  async "おなじ そらの ひとの タイム：きょうの コースで いちばん はやい ときだけ ピクセが いう"(t) {
    const { server, p } = await page(t);
    const today = await p.ev(`rta.state().course`);
    await p.ev(`rta.receive({ course: ${JSON.stringify(today)}, time: 17.5 })`);
    await t.sleep(2500);
    t.ok((await p.text()).includes("だれかが"), `いわない: ${await p.text()}`);
    t.eq(await p.ev(`rta.state().sky`), 17.5, "おぼえない");
    await p.ev(`rta.receive({ course: ${JSON.stringify(today)}, time: 25 })`);
    t.eq(await p.ev(`rta.state().sky`), 17.5, "おそいのに かわった");
    await p.ev(`rta.receive({ course: "2000-01-01", time: 5 })`);
    await p.ev(`rta.receive({ course: ${JSON.stringify(today)}, time: 0.1 })`);
    t.eq(await p.ev(`rta.state().sky`), 17.5, "ちがう 日・ありえない タイムを うけとった");
    t.noErrors(p);
    await server.close();
  },

  async "クリア まえは「まだ」と いう。?date= で のぞいて いる ときは ほぞん しない"(t) {
    let { server, p } = await page(t);
    await p.ev(`rta.open()`);
    await t.sleep(2000);
    t.ok((await p.text()).includes("まだ"), `いわない: ${await p.text()}`);
    t.ok(!(await p.ev(`Boolean(document.querySelector(".postcard"))`)), "カードが でた");
    await server.close();
    await t.closeAll();
    ({ server, p } = await page(t, "&date=2026-12-24"));
    await clear(p, 20);
    t.eq(await p.ev(`localStorage.getItem("warpix-rta")`), null, "のぞいて いるのに ほぞん した");
    t.noErrors(p);
    await server.close();
  },
};
