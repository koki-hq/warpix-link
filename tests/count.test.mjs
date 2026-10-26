// きた ひとの かず（v1.65）：SNS の 入口から 本体へ うつる、かぞえる のは 本番の ホストで トークンが ある とき だけ
// Cloudflare へは ほんとうに おくらない（テストでは ブロックして、おくろうと したかだけ みる）
const ENTRIES = ["x", "ig", "tt", "yt"];

async function watch(p) {
  await p.send("Network.enable");
  await p.send("Network.setBlockedURLs", { urls: ["*cloudflareinsights.com*"] });
  const seen = [];
  p.on((m) => {
    if (m.method === "Network.requestWillBeSent" && m.params.request.url.includes("cloudflareinsights")) seen.push(m.params.request.url);
  });
  return seen;
}

export default {
  async "入口から 本体へ うつる。トークンが なければ かぞえない"(t) {
    const server = await t.startServer();
    const b = await t.launchBrowser();
    const p = await b.firstPage();
    const seen = await watch(p);
    for (const e of ENTRIES) {
      await p.goto(`${server.url}${e}/`, 1500);
      t.ok(await p.ev(`location.pathname === "/"`), `/${e}/ から 本体へ うつらない：${await p.ev("location.pathname")}`);
      t.ok(await p.ev(`!!document.getElementById("about-btn")`), `/${e}/ の あと 本体が ひらかない`);
    }
    await p.boot();
    t.ok(seen.length === 0, `トークンが ないのに かぞえようと した：${seen.join(", ")}`);
    t.noErrors(p);
    await server.close();
  },

  async "トークンと ホストが あえば、入口でも 本体でも かぞえる"(t) {
    const server = await t.startServer();
    const b = await t.launchBrowser();
    const p = await b.firstPage();
    const seen = await watch(p);
    await p.send("Page.addScriptToEvaluateOnNewDocument", { source: `window.WARPIX_COUNT = { token: "TEST", host: "127.0.0.1" };` });
    let beaconOnEntry = false;
    p.on((m) => {
      if (m.method === "Network.requestWillBeSent" && m.params.request.url.includes("beacon.min.js") && m.params.documentURL.endsWith("/ig/")) beaconOnEntry = true;
    });
    await p.goto(`${server.url}ig/`, 1500);
    t.ok(beaconOnEntry, "入口で ビーコンを よまない");
    t.ok(await p.ev(`location.pathname === "/"`), "本体へ うつらない");
    const tag = await p.ev(`(document.querySelector('script[src*="cloudflareinsights"]') || {}).dataset?.cfBeacon ?? ""`);
    t.ok(JSON.parse(tag || "{}").token === "TEST", `本体で ビーコンが ない：${tag}`);
    t.ok(seen.length >= 2, `かぞえる よみこみが たりない：${seen.length}`);
    await server.close();
  },
};
