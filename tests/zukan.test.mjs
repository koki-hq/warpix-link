// ピクセの ずかん：出会ったものが記録され、ノートの「ずかん」タブに出る
async function openSite(t, storage = "") {
  const server = await t.startServer();
  const b = await t.launchBrowser();
  const p = await b.firstPage();
  await p.goto(server.url);
  await p.ev(`localStorage.clear(); ${storage}`);
  await p.goto(server.url);
  await p.boot();
  return { server, p };
}
const tiles = (p) => p.ev(`[...document.querySelectorAll("#zukan-body li")].map((li) => li.className + ":" + li.querySelector(".zukan-name").textContent)`);

export default {
  async "きょうの月はさいしょから図鑑に入り、空で出会ったものもふえる"(t) {
    const { server, p } = await openSite(t);
    const moon = await p.ev(`document.getElementById("moon").dataset.phase`);
    t.ok(moon, "月の名前が取れない");
    t.ok(await p.ev(`!!zukan.state.seen["moon:" + ${JSON.stringify(moon)}]`), "きょうの月が図鑑に入らない");
    // UFO（ふつうに飛んでくる）とマザーシップ
    await p.ev(`mothership()`);
    await t.sleep(200);
    t.ok(await p.ev(`!!zukan.state.seen["sky:mothership"]`), "マザーシップが図鑑に入らない");
    await p.ev(`emit("weather", { kind: "snow", temp: -2 })`);
    t.ok(await p.ev(`!!zukan.state.seen["weather:snow"]`), "天気が図鑑に入らない");
    t.ok(await p.ev(`grow.state.diary.some((e) => e.type === "zukan")`), "日記に「ずかんに ◯◯が ふえた」がない");
    t.noErrors(p);
    await server.close();
  },

  async "ノートの「ずかん」タブで、出会ったものは名前、まだのものは ？？？"(t) {
    const { server, p } = await openSite(t);
    await p.ev(`mothership(); document.getElementById("omikuji-btn").click()`);
    await t.sleep(1500);
    await p.ev(`document.querySelector(".omikuji-close")?.click()`);
    await p.click("#room-btn");
    await t.sleep(300);
    t.ok(await p.ev(`!document.getElementById("room-scene").hidden && document.getElementById("zukan-body").hidden`), "最初は へや");
    await p.ev(`document.querySelector('.diary-tab[data-tab="zukan"]').click()`);
    await t.sleep(200);
    t.ok(await p.ev(`document.getElementById("diary-body").hidden && !document.getElementById("zukan-body").hidden`), "ずかんのページに切りかわらない");
    const list = await tiles(p);
    t.ok(list.includes("got:マザーシップ"), "マザーシップが名前で出ない");
    t.ok(list.some((x) => x.startsWith("unknown:？？？")), "まだのものが ？？？ で出ない");
    t.ok(list.filter((x) => x.startsWith("got:")).some((x) => ["だいきち", "ちゅうきち", "しょうきち", "きち", "すえきち"].includes(x.slice(4))), "おみくじの運勢が図鑑に出ない");
    const { got, total } = await p.ev(`zukan.counts()`);
    t.ok((await p.ev(`document.querySelector(".zukan-head").textContent`)).includes(`${got}`) && total >= 40, `かぞえ方: ${got}/${total}`);
    await p.shot("zukan.png");
    // もう一度ひらくと、日記のページから
    await p.ev(`document.getElementById("diary").close()`);
    await p.ev(`document.getElementById("room-btn").click()`);
    t.ok(await p.ev(`!document.getElementById("room-scene").hidden`), "ひらき直すと へやに 戻らない");
    t.noErrors(p);
    await server.close();
  },

  async "半分うめると実績「ずかん はんぶん」"(t) {
    const { server, p } = await openSite(t);
    // v1.57 で ぼうしが ふえた ぶん、きせつの ぼうしと コックさん（さっきょく）も さきに
    await p.ev(`for (const k of ["autumn", "winter", "summer"]) wardrobe.seeSeason("season:" + k); achievements.unlock("composer");
      for (const id of ["ufo", "bat", "mothership", "star", "raid", "visitor", "guest", "adv-ghost"]) emit("seen", { id });
      for (const k of ["clear", "cloudy", "fog", "rain", "snow", "thunder"]) emit("weather", { kind: k, temp: 10 });
      for (const n of ["だいきち", "ちゅうきち", "しょうきち", "きち", "すえきち"]) emit("omikuji", { name: n });
      for (const m of ["しんげつ", "まんげつ", "じょうげんの つき"]) zukan.mark("moon", m);`); // きょうの つきは もう ついて いる ことが ある（2026-10-25 は まんげつ で 1 つ たりなかった）
    const { got, total } = await p.ev(`zukan.counts()`);
    t.ok(got * 2 >= total, `前提：半分以上になっていない ${got}/${total}`);
    t.ok(await p.ev(`achievements.has("zukan-half")`), "実績がない");
    t.noErrors(p);
    await server.close();
  },
};
