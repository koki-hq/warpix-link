// 端末まわり：オフライン（サービスワーカー）、季節イベント、天気（にせもの）、コントローラー（にせもの）
export default {
  async "一度開けば、オフラインでも開いて遊べる"(t) {
    const server = await t.startServer();
    const b = await t.launchBrowser();
    const p = await b.firstPage();
    await p.goto(server.url, 2000);
    t.ok(await p.ev(`navigator.serviceWorker.ready.then((r) => !!r.active)`), "サービスワーカーが動いていない");
    await p.send("Page.reload");
    await t.sleep(1500);
    t.ok(await p.ev(`!!navigator.serviceWorker.controller`), "サービスワーカーがページを受け持っていない");
    await p.send("Network.enable");
    await p.send("Network.emulateNetworkConditions", { offline: true, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
    await p.goto(server.url, 1500);
    await p.boot({ readIntro: false });
    t.ok(await p.ev(`document.body.classList.contains("booted") && document.querySelectorAll(".pixel-btn").length >= 6`), "オフラインで開けない");
    t.noErrors(p);
    await server.close();
  },

  async "季節イベント（?date= で先取り）"(t) {
    const server = await t.startServer();
    const b = await t.launchBrowser();
    const p = await b.firstPage();
    const cases = [
      ["2026-10-31", "halloween", "pumpkin"],
      ["2026-12-24", "christmas", "santa"],
      ["2027-01-01", "newyear", "hachimaki"],
      ["2026-07-07", "tanabata", "tanzaku"],
    ];
    for (const [date, name, hat] of cases) {
      await p.goto(`${server.url}?date=${date}`);
      await p.boot({ readIntro: false });
      await t.sleep(name === "newyear" ? 2500 : 200);
      const s = await p.ev(`({ cls: document.body.classList.contains("season-${name}"), hat: wardrobe.currentId(), bat: ufoLook !== UFO, fx: document.querySelectorAll(".season-fx").length, nenga: !!document.querySelector(".nenga") })`);
      t.ok(s.cls, `${name} になっていない`);
      t.eq(s.hat, hat, `${name} の帽子`);
      if (name === "halloween") t.ok(s.bat, "ハロウィンなのに UFO がコウモリでない");
      if (name === "christmas" || name === "tanabata") t.eq(s.fx, 1, `${name} の雪・天の川`);
      if (name === "newyear") t.ok(s.nenga, "年賀状が来ない");
      await p.shot(`season-${name}.png`);
    }
    t.noErrors(p);
    await server.close();
  },

  async "天気：聞いてから調べ、雨ならかさ（位置と天気はにせもの）"(t) {
    const server = await t.startServer();
    const b = await t.launchBrowser();
    const p = await b.firstPage();
    await p.send("Browser.grantPermissions", { permissions: ["geolocation"], origin: server.url.slice(0, -1) });
    await p.send("Emulation.setGeolocationOverride", { latitude: 35.6812, longitude: 139.7671, accuracy: 50 });
    await p.send("Fetch.enable", { patterns: [{ urlPattern: "*open-meteo*" }] });
    let asked = null;
    p.on(async (m) => {
      if (m.method !== "Fetch.requestPaused") return;
      asked = m.params.request.url;
      const body = Buffer.from(JSON.stringify({ current: { weather_code: 63, is_day: 1, temperature_2m: 17.4 } })).toString("base64");
      await p.send("Fetch.fulfillRequest", { requestId: m.params.requestId, responseCode: 200, responseHeaders: [{ name: "content-type", value: "application/json" }, { name: "access-control-allow-origin", value: "*" }], body });
    });
    await p.goto(server.url);
    await p.ev(`localStorage.clear()`);
    await p.goto(server.url);
    await p.boot();
    await p.type("weather");
    await t.sleep(2500);
    t.eq(await p.ev(`[...document.querySelectorAll(".dialog-choices button")].map((b) => b.textContent)`), ["いいよ", "やめとく"], "先に聞いてくる");
    await p.ev(`document.querySelector(".dialog-choices button").click()`);
    await t.sleep(3000);
    t.ok(asked?.includes("latitude=35.7&longitude=139.8"), `位置が 0.1 度に丸められていない: ${asked}`);
    t.ok(await p.ev(`document.body.classList.contains("weather-rain")`), "雨が降らない");
    t.eq(await p.ev(`wardrobe.currentId()`), "umbrella", "かさをささない");
    t.ok((await p.text()).includes("17ど"), "気温を言わない");
    t.noErrors(p);
    await server.close();
  },

  async "コントローラー：十字キーで選んで A でワープ、コナミコマンドも（にせもののパッド）"(t) {
    const server = await t.startServer();
    const b = await t.launchBrowser();
    const p = await b.firstPage();
    await p.goto(server.url);
    await p.boot();
    await p.ev(`(() => {
      const btns = Array.from({ length: 17 }, () => ({ pressed: false, value: 0 }));
      window.__pad = { id: "Test Pad", index: 0, connected: true, mapping: "standard", axes: [0, 0, 0, 0], buttons: btns, timestamp: 0 };
      navigator.getGamepads = () => [window.__pad];
      const e = new Event("gamepadconnected"); e.gamepad = window.__pad; dispatchEvent(e);
      window.__tap = (i) => new Promise((r) => { btns[i].pressed = true; setTimeout(() => { btns[i].pressed = false; setTimeout(r, 80); }, 80); });
      window.open = (u) => { window.__opened = u; return {}; };
    })()`);
    await t.sleep(1000);
    t.ok((await p.text()).startsWith("コントローラー みつけた"), "コントローラーに気づかない");
    await p.ev(`__tap(13)`);
    await p.ev(`__tap(13)`);
    t.ok((await p.ev(`document.activeElement.textContent`)).includes("TWITTER"), "十字キーで 2 番目のリンクに行かない");
    await p.ev(`__tap(0)`);
    await t.sleep(300);
    t.eq(await p.ev(`window.__opened`), "https://twitter.com/", "A でリンクが開かない");
    for (const i of [12, 12, 13, 13, 14, 15, 14, 15, 1, 0]) await p.ev(`__tap(${i})`);
    await t.sleep(400);
    t.ok(await p.ev(`!document.getElementById("secret-link").hidden`), "パッドのコナミコマンドでワープゾーンが開かない");
    t.noErrors(p);
    await server.close();
  },
};
