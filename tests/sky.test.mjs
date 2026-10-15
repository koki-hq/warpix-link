// じかんの そら：時刻で空のベールが変わり、図鑑に「そらの いろ」が入る
export default {
  async "明け方・昼・夕方・夜で空の色が変わり、図鑑に入る（?hour= で先取り）"(t) {
    const server = await t.startServer();
    const b = await t.launchBrowser();
    const p = await b.firstPage();
    await p.goto(server.url);
    await p.ev(`localStorage.clear()`);
    for (const [hour, name] of [[6, "dawn"], [13, "day"], [18, "dusk"], [23, "night"]]) {
      await p.goto(`${server.url}?hour=${hour}`);
      await p.boot({ readIntro: false });
      const s = await p.ev(`({ sky: document.documentElement.dataset.sky, bg: document.querySelector(".sky-tint").style.background, shown: getComputedStyle(document.querySelector(".sky-tint")).display !== "none", seen: !!zukan.state.seen["skycolor:${name}"] })`);
      t.eq(s.sky, name, `${hour}時の空`);
      t.ok(s.shown, `${hour}時にベールが出ていない`);
      t.ok(s.seen, `${hour}時の空が図鑑に入らない`);
      const alpha = Math.max(...[...s.bg.matchAll(/rgba\([^)]*,\s*([\d.]+)\)/g)].map((m) => Number(m[1])));
      if (name === "night") t.eq(alpha, 0, "夜は ベールが すきとおっている");
      else t.ok(alpha > 0.1, `${hour}時の空に色がない: ${s.bg}`);
      await p.shot(`sky-${name}.png`);
    }
    // 4 つそろうと、図鑑の「そらの いろ」が全部埋まる
    t.eq(await p.ev(`["night", "dawn", "day", "dusk"].filter((n) => zukan.state.seen["skycolor:" + n]).length`), 4, "そらの いろが 4 つそろわない");
    t.noErrors(p);
    await server.close();
  },

  async "時刻の色は なめらかに変わる"(t) {
    const server = await t.startServer();
    const b = await t.launchBrowser();
    const p = await b.firstPage();
    await p.goto(server.url);
    const alphas = await p.ev(`[4, 5, 5.5, 6, 7, 8, 9].map((h) => skytime.colorAt(h)[1][3])`);
    for (let i = 1; i < alphas.length; i++) t.ok(Math.abs(alphas[i] - alphas[i - 1]) <= 0.15, `${alphas[i - 1]} → ${alphas[i]} の変わり方が急`);
    t.noErrors(p);
    await server.close();
  },

  async "シンプルモードとゲームボーイの色では、ベールを出さない"(t) {
    const server = await t.startServer();
    const b = await t.launchBrowser();
    const p = await b.firstPage();
    await p.goto(`${server.url}?simple=1&hour=13`);
    t.eq(await p.ev(`getComputedStyle(document.querySelector(".sky-tint")).display`), "none", "シンプルモードで出ている");
    await p.goto(`${server.url}?hour=13`);
    await p.boot();
    await p.type("gameboy");
    t.eq(await p.ev(`getComputedStyle(document.querySelector(".sky-tint")).display`), "none", "ゲームボーイの色で出ている");
    t.noErrors(p);
    await server.close();
  },
};
