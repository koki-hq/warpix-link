// v1.50.2：一日 つかって みて こわれて いた ところ（2026-10-20 第 1 回 会議）
async function page(t) {
  const server = await t.startServer();
  const b = await t.launchBrowser();
  const p = await b.firstPage();
  await p.goto(server.url);
  await p.ev(`localStorage.clear()`);
  await p.goto(server.url + "?away=0");
  await p.boot();
  return { server, p };
}

export default {
  async "ことわると ピクセが ひとこと いって、きいた ことばが のこらない"(t) {
    const { server, p } = await page(t);
    await p.ev(`emit("adventure-clear", { time: 21.5, best: true, vsGhost: null })`);
    await t.sleep(2500);
    t.ok((await p.text()).includes("カードに する"), `きかない: ${await p.text()}`);
    await p.ev(`document.querySelectorAll(".dialog-choices button")[1].click()`);
    await t.sleep(800);
    t.eq(await p.text(), "わかった！", "きいた ことばが のこった");
    t.ok(!(await p.ev(`Boolean(document.querySelector(".postcard"))`)), "カードが でた");
    t.noErrors(p);
    await server.close();
  },

  async "もどって 音が タップまち なら BGM ボタンが「TAP」。おしても OFF に ならず 音が もどる"(t) {
    const { server, p } = await page(t);
    t.eq(await p.ev(`document.getElementById("bgm-toggle").textContent`), "BGM ON", "はじめ");
    // iPhone の ように、ゆびを はなした とき（click・touchend）しか 音を おこさない AudioContext に する。
    // pointerdown では おきない（v1.50.2 は これで「TAP」の まま だった）
    await p.ev(`(() => {
      const AC = window.AudioContext;
      window.AudioContext = class extends AC {
        constructor() { super(); super.suspend(); }
        resume() { return ["click", "touchend"].includes(window.event?.type) ? super.resume() : Promise.resolve(); }
      };
      let hid = false;
      Object.defineProperty(document, "hidden", { get: () => hid, configurable: true });
      window.__away = (v) => { hid = v; document.dispatchEvent(new Event("visibilitychange")); };
    })()`);
    await p.ev(`__away(true)`);
    await p.ev(`__away(false)`);
    await t.sleep(1200);
    t.eq(await p.ev(`document.getElementById("bgm-toggle").textContent`), "BGM TAP!", "タップまちを みせない");
    t.ok(await p.ev(`document.getElementById("bgm-toggle").classList.contains("waiting")`), "クラス");
    await p.click("#bgm-toggle");
    // パソコンが こんで いると 音が おきるのが おそい（5 並列で 0.8 びょうでは まにあわなかった）。4 びょう まで まつ
    for (let i = 0; i < 20 && (await p.ev(`sound.waiting()`)); i++) await t.sleep(200);
    t.eq(await p.ev(`document.getElementById("bgm-toggle").textContent`), "BGM ON", "音が もどらない／OFF に なった");
    t.ok(await p.ev(`sound.playing()`), "BGM が とまった");
    t.ok((await p.ev(`localStorage.getItem("warpix-bgm")`)) !== "off", "OFF を ほぞん した");
    t.noErrors(p);
    await server.close();
  },

  async "てんき：ばしょは 1 にち つかいまわして、なんども きかない"(t) {
    const { server, p } = await page(t);
    await p.send("Fetch.enable", { patterns: [{ urlPattern: "*open-meteo*" }] });
    const asked = [];
    p.on(async (m) => {
      if (m.method !== "Fetch.requestPaused") return;
      asked.push(m.params.request.url);
      const body = Buffer.from(JSON.stringify({ current: { weather_code: 0, is_day: 1, temperature_2m: 20 } })).toString("base64");
      await p.send("Fetch.fulfillRequest", { requestId: m.params.requestId, responseCode: 200, responseHeaders: [{ name: "content-type", value: "application/json" }, { name: "access-control-allow-origin", value: "*" }], body });
    });
    await p.ev(`(() => {
      window.__located = 0;
      navigator.geolocation.getCurrentPosition = (ok) => { window.__located++; ok({ coords: { latitude: 43.06, longitude: 141.35 } }); };
      const old = Date.now() - 2 * 3600000;
      localStorage.setItem("warpix-weather-cache", JSON.stringify({ at: old, code: 0, day: true, temp: 10, lat: 35.7, lon: 139.8, placeAt: Date.now() - 3600000 }));
    })()`);
    await p.ev(`weather.check({ quiet: true })`);
    t.eq(await p.ev(`window.__located`), 0, "1 にち たって いないのに ばしょを きいた");
    t.ok(asked.at(-1)?.includes("latitude=35.7&longitude=139.8"), `とっておいた ばしょを つかわない: ${asked.at(-1)}`);
    // 1 にち たったら きく
    await p.ev(`(() => { const c = JSON.parse(localStorage.getItem("warpix-weather-cache")); c.at -= 3 * 3600000; c.placeAt -= 25 * 3600000; localStorage.setItem("warpix-weather-cache", JSON.stringify(c)); })()`);
    await p.ev(`weather.check({ quiet: true })`);
    t.eq(await p.ev(`window.__located`), 1, "1 にち たったのに きかない");
    t.ok(asked.at(-1)?.includes("latitude=43.1&longitude=141.4"), `あたらしい ばしょを つかわない: ${asked.at(-1)}`);
    t.noErrors(p);
    await server.close();
  },

  async "スマホの「ほぞん」は 共有の まど（画像だけ）を ひらく。写真に いれられる ように"(t) {
    const { server, p } = await page(t);
    await p.ev(`(() => {
      const mm = window.matchMedia.bind(window);
      window.matchMedia = (q) => (q === "(pointer: coarse)" ? { matches: true, addEventListener() {}, removeEventListener() {} } : mm(q));
      navigator.canShare = (d) => Boolean(d.files?.length);
      navigator.share = async (d) => { window.__shared = { files: d.files.map((f) => f.type), text: d.text ?? null, url: d.url ?? null }; };
    })()`);
    await p.ev(`postcard.open()`);
    await t.sleep(1500);
    await p.ev(`document.querySelector(".postcard-save").click()`);
    await t.sleep(300);
    t.eq(await p.ev(`window.__shared`), { files: ["image/png"], text: null, url: null }, "共有の まどに 画像だけ わたさない");
    t.noErrors(p);
    await server.close();
  },
};
