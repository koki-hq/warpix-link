// ピクセの ゆめ：ねむると ゆめの ふきだし。さいきんの できごとが ゆめに でて、おこすと おしえてくれる
const FAST = `const __real = performance.now.bind(performance); let __extra = 0; performance.now = () => __real() + __extra; window.__skip = (ms) => (__extra += ms);`;

async function sleepyPage(t, diary = []) {
  const server = await t.startServer();
  const b = await t.launchBrowser();
  const p = await b.firstPage();
  await p.send("Page.addScriptToEvaluateOnNewDocument", { source: FAST });
  await p.goto(server.url + "?away=0");
  await p.ev(`localStorage.clear()`);
  if (diary.length) {
    await p.ev(`(() => { const d = new Date(); const ymd = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); localStorage.setItem("warpix-pixe", JSON.stringify({ born: ymd, days: [ymd], last: ymd, stage: 0, sulk: false, pokeMark: 0, diary: ${JSON.stringify(diary)}.map((type) => ({ date: ymd, type, text: type })) })); })()`);
  }
  await p.goto(server.url);
  await p.boot();
  return { server, p };
}

export default {
  async "ねむると ゆめの ふきだしが でて、おこすと なんの ゆめか いう"(t) {
    const { server, p } = await sleepyPage(t, ["boss", "song"]);
    t.ok(await p.ev(`document.querySelector(".dream").hidden`), "おきているのに ゆめが でている");
    t.eq(await p.ev(`dream.pickScenes().map((s) => s.name)`), ["きょくを つくる", "ボスと たたかう"], "さいきんの できごとの ゆめ（あたらしい じゅん）");
    await p.ev(`__skip(41000)`);
    await t.sleep(1500);
    t.ok(await p.ev(`document.getElementById("npc").classList.contains("asleep") && !document.querySelector(".dream").hidden`), "ねても ゆめが でない");
    t.ok(await p.ev(`!!document.querySelector(".dream svg") && document.querySelector(".dream").getAttribute("aria-hidden") === "true"`), "ゆめの え");
    // 2 コマで うごく（2 びょうの あいだに え が かわる）
    const before = await p.ev(`document.querySelector(".dream").innerHTML`);
    let moved = false;
    for (let i = 0; i < 10 && !moved; i++) {
      await t.sleep(200);
      moved = (await p.ev(`document.querySelector(".dream").innerHTML`)) !== before;
    }
    t.ok(moved, "ゆめが うごかない");
    await p.shot("dream.png");
    await p.send("Input.dispatchMouseEvent", { type: "mouseMoved", x: 20, y: 900 });
    await t.sleep(300);
    t.ok(await p.ev(`document.querySelector(".dream").hidden`), "おきても ゆめが きえない");
    // 「はっ！」の つぎの 行で、みていた ゆめを いう
    await p.ev(`document.getElementById("dialog").click()`);
    await t.sleep(200);
    await p.ev(`document.getElementById("dialog").click()`);
    await t.sleep(1500);
    const line = await p.text();
    t.ok(/^……(きょくを つくる|ボスと たたかう) ゆめ なんて/.test(line), `ゆめの ひとこと: ${line}`);
    t.ok(await p.ev(`achievements.has("dreamer")`), "実績「ゆめみる ピクセ」がない");
    t.ok(await p.ev(`grow.state.diary.some((e) => e.type === "dream")`), "日記に ない");
    t.noErrors(p);
    await server.close();
  },

  async "なにも ない ひは ひつじと つき。うごきを へらすと 1 まいの え"(t) {
    const { server, p } = await sleepyPage(t);
    t.eq(await p.ev(`dream.pickScenes().map((s) => s.name)`), ["ひつじを かぞえる", "おつきさまに いく"], "なにもない ひの ゆめ");
    await p.ev(`document.documentElement.classList.add("reduce-motion")`);
    t.ok(await p.ev(`Object.values(dream.SCENES).every((s) => s.frames.length === 2 && s.frames.every((f) => f.length === 14 && f.every((r) => r.length === 24)))`), "ゆめの え の大きさ");
    t.noErrors(p);
    await server.close();
  },

  async "ノートの タブは ←→ と Home/End で うごける"(t) {
    const server = await t.startServer();
    const b = await t.launchBrowser();
    const p = await b.firstPage();
    await p.goto(server.url);
    await p.boot();
    await p.click("#room-btn");
    await t.sleep(300);
    await p.ev(`document.getElementById("tab-diary").focus()`);
    const state = () => p.ev(`[document.activeElement.id, ["diary-body", "zukan-body", "stamp-body", "trophy-body", "hat-body"].find((id) => !document.getElementById(id).hidden), [...document.querySelectorAll(".diary-tab")].map((t) => t.tabIndex).join()]`);
    await p.key("ArrowRight");
    t.eq(await state(), ["tab-zukan", "zukan-body", "-1,0,-1,-1,-1"], "→ で ずかん");
    await p.key("End");
    t.eq(await state(), ["tab-hat", "hat-body", "-1,-1,-1,-1,0"], "End で ぼうし");
    await p.key("ArrowRight");
    t.eq(await state(), ["tab-diary", "diary-body", "0,-1,-1,-1,-1"], "はしから → で さいしょへ");
    await p.key("ArrowLeft");
    t.eq(await state(), ["tab-hat", "hat-body", "-1,-1,-1,-1,0"], "← で さいごへ");
    await p.key("Home");
    t.eq(await state(), ["tab-diary", "diary-body", "0,-1,-1,-1,-1"], "Home で にっき");
    t.noErrors(p);
    await server.close();
  },
};
