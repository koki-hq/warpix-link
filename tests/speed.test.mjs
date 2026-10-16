// ワープを はやく（v1.31）：config.js と cassette.js いがいは defer。そろう まえに PRESS START を おされたら まつ
export default {
  async "スクリプトは config.js・cassette.js だけ すぐ よみ、ほかは defer（じゅんばんは そのまま）"(t) {
    const server = await t.startServer();
    const b = await t.launchBrowser();
    const p = await b.firstPage();
    await p.goto(server.url);
    const list = await p.ev(`[...document.querySelectorAll("script[src]")].map((s) => [s.getAttribute("src"), s.defer])`);
    t.eq(list.slice(0, 3), [["config.js", false], ["cassette.js", false], ["script.js", true]], "さいしょの 3 つ");
    t.ok(list.slice(2).every(([, d]) => d), "defer に なっていない ものが ある");
    t.ok(list.length >= 30, `スクリプトの かず: ${list.length}`);
    t.noErrors(p);
    await server.close();
  },

  async "ファイルが そろう まえに PRESS START を おすと NOW LOADING。そろったら はじまる"(t) {
    const server = await t.startServer();
    const b = await t.launchBrowser();
    const p = await b.firstPage();
    // （さきに いちど ひらくと サービスワーカーが ファイルを ためて、おくらせられない。まっさらな ブラウザで いきなり）
    // さいごの ファイルだけ わざと おそく する（それまで HTML は「よみこみ中」）
    await p.send("Fetch.enable", { patterns: [{ urlPattern: "*about.js*", requestStage: "Request" }] });
    let held = null;
    p.on((m) => m.method === "Fetch.requestPaused" && (held = m.params.requestId));
    await p.send("Page.navigate", { url: server.url });
    let state = null;
    for (let i = 0; i < 100; i++) {
      state = await p.ev(`({ ready: document.readyState, start: document.getElementById("start-screen")?.hidden === false })`).catch(() => null);
      if (state?.start) break;
      await t.sleep(50);
    }
    // さいごの ファイル（about.js）は まだ なので、ぜんぶは そろっていない
    t.ok(state?.start && state.ready !== "complete", `よみこみ中に PRESS START が でない: ${JSON.stringify(state)}`);
    await p.ev(`document.getElementById("start-btn").click()`);
    t.eq(await p.ev(`document.getElementById("start-btn").textContent`), "NOW LOADING...", "NOW LOADING に ならない");
    t.ok(await p.ev(`!document.body.classList.contains("booted")`), "そろう まえに はじまった");
    // おくらせていた ファイルを とおす
    for (let i = 0; i < 40 && !held; i++) await t.sleep(50);
    if (held) await p.send("Fetch.continueRequest", { requestId: held });
    await p.send("Fetch.disable");
    await t.sleep(1500);
    t.ok(await p.ev(`document.body.classList.contains("booted")`), "そろっても はじまらない");
    t.eq(await p.ev(`document.getElementById("start-btn").textContent`), "PRESS START", "もじが もどらない");
    t.noErrors(p);
    await server.close();
  },
};
