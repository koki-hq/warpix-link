// せってい：音量、うごきを へらす、よみやすい もじ、キーそうさ
async function openSite(t, query = "") {
  const server = await t.startServer();
  const b = await t.launchBrowser();
  const p = await b.firstPage();
  await p.goto(server.url);
  await p.ev(`localStorage.clear()`);
  await p.goto(server.url + query);
  return { server, p };
}

export default {
  async "フッターから開いて、音量が音に反映され、開き直しても残る"(t) {
    const { server, p } = await openSite(t);
    await p.boot();
    await p.click("#settings-btn");
    await t.sleep(300);
    t.ok(await p.ev(`document.getElementById("settings").open`), "せっていが開かない");
    await p.ev(`const r = document.getElementById("set-bgm"); r.value = 30; r.dispatchEvent(new Event("input"));
      const s = document.getElementById("set-se"); s.value = 60; s.dispatchEvent(new Event("input"));`);
    t.eq(await p.ev(`sound.volumes()`), { bgm: 0.3, se: 0.6 }, "音量が音に反映されない");
    t.eq(await p.ev(`document.getElementById("set-bgm-out").textContent`), "30", "数字の表示");
    await p.shot("settings.png");
    await p.goto(server.url);
    t.eq(await p.ev(`sound.volumes()`), { bgm: 0.3, se: 0.6 }, "開き直すと音量が戻ってしまう");
    t.noErrors(p);
    await server.close();
  },

  async "「うごきを へらす」で、このサイトだけ動きを止める"(t) {
    const { server, p } = await openSite(t);
    await p.boot({ readIntro: false });
    t.ok(!(await p.ev(`reduceMotion`)), "前提：さいしょは動きを減らしていない");
    await p.ev(`document.getElementById("settings-btn").click(); document.getElementById("set-motion").click()`);
    await t.sleep(1500);
    t.ok(await p.ev(`document.documentElement.classList.contains("reduce-motion") && reduceMotion`), "切りかわらない");
    await p.boot({ readIntro: false });
    t.eq(await p.ev(`getComputedStyle(document.querySelector(".cursor")).animationDuration`), "0.001s", "点滅が止まらない");
    t.ok(await p.ev(`getComputedStyle(document.querySelector(".pixel-btn")).opacity === "1"`), "リンクボタンが見えなくなった");
    await p.ev(`document.getElementById("settings-btn").click(); document.getElementById("set-motion").click()`);
    await t.sleep(1500);
    t.ok(await p.ev(`!document.documentElement.classList.contains("reduce-motion")`), "もとに戻らない");
    t.noErrors(p);
    await server.close();
  },

  async "「よみやすい もじ」で、ドットの文字をふつうの文字に"(t) {
    const { server, p } = await openSite(t);
    await p.ev(`document.getElementById("settings-btn").click(); document.getElementById("set-font").click()`);
    await t.sleep(1500);
    t.ok(await p.ev(`document.documentElement.classList.contains("plain-font")`), "切りかわらない");
    t.ok((await p.ev(`getComputedStyle(document.querySelector(".title")).fontFamily`)).includes("system-ui"), "タイトルの文字がかわらない");
    t.noErrors(p);
    await server.close();
  },

  // v1.30.1 から シンプルモードでは「せってい」を かくす（おとも うごきも ないので）。ここでは いつもの ページで みる
  async "キーそうさに ひみつの答えは書いていない"(t) {
    const { server, p } = await openSite(t);
    await p.boot();
    await p.click("#settings-btn");
    await t.sleep(300);
    t.ok(await p.ev(`document.getElementById("settings").open`), "開かない");
    const text = await p.ev(`document.getElementById("settings").innerText.toLowerCase()`);
    t.ok(text.includes("esc") && text.includes("tab"), "キーそうさの一覧がない");
    for (const secret of ["gameboy", "party", "pixe", "invaders", "konami", "↑ ↑ ↓ ↓"]) t.ok(!text.includes(secret), `ひみつ「${secret}」が書いてある`);
    t.noErrors(p);
    await server.close();
  },
};
