import { readFileSync } from "node:fs";
// ピクセに おてがみ（v1.47）：「このページについて」から メールの アプリで pixe@warpix.app へ。したがきに 版と きかい
async function open(t, ua) {
  const server = await t.startServer();
  const b = await t.launchBrowser();
  const p = await b.firstPage();
  if (ua) await p.send("Emulation.setUserAgentOverride", { userAgent: ua, platform: "iPhone" });
  await p.goto(server.url);
  await p.ev(`localStorage.clear()`);
  await p.goto(server.url + "?away=0");
  await p.boot();
  await p.ev(`document.getElementById("about-btn").click()`);
  await t.sleep(600);
  return { server, p };
}
const mail = (p) => p.ev(`(() => { const u = new URL(document.getElementById("otegami").href); return { to: u.pathname, subject: u.searchParams.get("subject"), body: u.searchParams.get("body") }; })()`);

export default {
  async "あて先は pixe@warpix.app、したがきに いまの 版と きかいの しゅるい"(t) {
    const { server, p } = await open(t);
    const m = await mail(p);
    t.eq([m.to, m.subject], ["pixe@warpix.app", "ピクセに おてがみ"], "あて先と 題");
    const v = readFileSync(new URL("../sw.js", import.meta.url), "utf8").match(/warpix-v(\d+\.\d+(?:\.\d+)?)/)[1].replace(/\.0$/, "");
    t.ok(m.body.includes(`warpix-link v${v}`) && m.body.includes("パソコン（ブラウザ）") && m.body.startsWith("ピクセへ"), `したがき: ${m.body}`);
    // おしたら にっきに（ほんとうに メールの アプリは ひらかない）
    await p.ev(`(() => { const a = document.getElementById("otegami"); a.addEventListener("click", (e) => e.preventDefault()); a.click(); })()`);
    t.ok(await p.ev(`grow.state.diary.some((e) => e.type === "otegami")`), "にっき");
    t.noErrors(p);
    await server.close();
  },

  async "iPhone では iPhone と かく"(t) {
    const { server, p } = await open(t, "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1");
    t.ok((await mail(p)).body.includes("iPhone・iPad（ブラウザ）"), "きかいの しゅるい");
    t.noErrors(p);
    await server.close();
  },
};
