// ホームがめんに いれる（v1.37）：「このページについて」に きかいごとの やりかた。いまの きかいに しるし
async function open(t, { ua, init = "" } = {}) {
  const server = await t.startServer();
  const b = await t.launchBrowser();
  const p = await b.firstPage();
  if (ua) await p.send("Emulation.setUserAgentOverride", { userAgent: ua, platform: ua.includes("iPhone") ? "iPhone" : "Linux armv8l" });
  if (init) await p.send("Page.addScriptToEvaluateOnNewDocument", { source: init });
  await p.goto(server.url);
  await p.ev(`localStorage.clear()`);
  await p.goto(server.url + "?simple=1");
  await p.ev(`document.getElementById("about-btn").click()`);
  await t.sleep(300);
  return { server, p };
}
const here = (p) => p.ev(`[...document.querySelectorAll("#home-steps dt.here")].map((e) => e.dataset.os).join()`);
const status = (p) => p.ev(`document.getElementById("home-status").textContent`);
const shown = (p, id) => p.ev(`!document.getElementById(${JSON.stringify(id)}).hidden`);
const IPHONE = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";
const ANDROID = "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36";

export default {
  async "パソコンでは パソコンの やりかたに しるし。ボタンは いれられる ときだけ"(t) {
    const { server, p } = await open(t);
    t.eq(await here(p), "pc", "しるしの ばしょ");
    t.ok((await p.ev(`document.querySelector('#home-steps dt[data-os="pc"]').textContent`)).includes("この きかい"), "（この きかい）が ない");
    t.ok((await status(p)).includes("アプリに すると"), `ひとこと: ${await status(p)}`);
    // ヘッドレスの Chrome も ほんとうに「いれられる」と いう ことが ある → ボタンは それに あわせる
    t.eq(await shown(p, "home-install"), await p.ev(`pocket.canInstall()`), "ボタンと いれられるか が あわない");
    t.ok(!(await shown(p, "home-ios-note")), "iPhone の ちゅうい が でた");
    t.noErrors(p);
    await server.close();
  },

  async "iPhone では iPhone に しるしと、Safari と きろくが べつ の ちゅうい"(t) {
    const { server, p } = await open(t, { ua: IPHONE });
    t.eq(await here(p), "ios", "しるしの ばしょ");
    t.ok(await shown(p, "home-ios-note"), "ちゅういが ない");
    t.noErrors(p);
    await server.close();
  },

  async "ブラウザが いれられる ときは ボタンで いれる。アプリで ひらいて いる ときは そう いう"(t) {
    // Chrome の beforeinstallprompt の かわり
    const fake = `addEventListener("load", () => setTimeout(() => {
      const e = new Event("beforeinstallprompt");
      e.prompt = () => { window.__prompted = true; };
      e.userChoice = Promise.resolve({ outcome: "accepted" });
      dispatchEvent(e);
    }, 100));`;
    let { server, p } = await open(t, { ua: ANDROID, init: fake });
    t.eq(await here(p), "android", "しるしの ばしょ");
    t.ok(await shown(p, "home-install"), "ボタンが ない");
    await p.ev(`document.getElementById("home-install").click()`);
    await t.sleep(300);
    t.ok(await p.ev(`window.__prompted === true`), "ブラウザに たのまない");
    t.ok(!(await shown(p, "home-install")), "いれた あとも ボタン");
    t.noErrors(p);
    await server.close();
    await t.closeAll();

    ({ server, p } = await open(t, { ua: IPHONE, init: `Object.defineProperty(navigator, "standalone", { value: true });` }));
    t.ok((await status(p)).includes("ホームがめんの アプリで ひらいているよ"), `ひとこと: ${await status(p)}`);
    t.ok(!(await shown(p, "home-ios-note")), "アプリなのに ちゅうい");
    t.noErrors(p);
    await server.close();
  },
};
