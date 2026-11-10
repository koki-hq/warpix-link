// ピクセ（v2.0）：セリフ（はじめまして・なれ・ひさしぶり）、季節・イベントの 衣装は 日付で 自動、つつく、UFO、ワープから もどる
import { openApp, groupsData, noNavigate, sleep } from "./lib/app.mjs";

export default {
  async "はじめては じこしょうかい。グループが ない 2 かいめは「つくろう」、ある ときは あいさつ"(t) {
    const { server, p } = await openApp(t);
    t.ok((await p.text()).includes("はじめまして"), `じこしょうかい しない：${await p.text()}`);
    await p.goto(await p.ev("location.href"), 400);
    t.ok((await p.text()).includes("つくろう"), `グループが ない のに すすめない：${await p.text()}`);
    await p.ev(`CASSETTES.addGroup("A")`);
    await p.goto(await p.ev("location.href"), 400);
    const line = await p.text();
    t.ok(line && !line.includes("つくろう") && !line.includes("はじめまして"), `あいさつで ない：${line}`);
    t.noErrors(p);
    await server.close();
  },

  async "ひさしぶり（7 日 いじょう）は「おぼえてるよ」"(t) {
    const { server, p } = await openApp(t, { query: "?date=2026-11-20", storage: { "warpix-v2-pixe": { born: "2026-11-01", days: 5, last: "2026-11-10" }, "warpix-v2-groups": groupsData([["A", ["youtube"]]]) } });
    const line = await p.text();
    t.ok(line.includes("ひさしぶり") || line.includes("まってた"), `ひさしぶりの あいさつで ない：${line}`);
    t.eq(await p.ev(`pixe.met().days`), 6, "あった 日が ふえない");
    t.noErrors(p);
    await server.close();
  },

  async "衣装は 日付で 自動：クリスマス・ハロウィン・おしょうがつ・たなばた。ふだんは なにも きない"(t) {
    for (const [date, id, word] of [["2026-12-24", "christmas", "クリスマス"], ["2026-10-31", "halloween", "かぼちゃ"], ["2027-01-03", "newyear", "おめでとう"], ["2027-07-07", "tanabata", "たなばた"], ["2026-11-10", null, null]]) {
      const { server, p, b } = await openApp(t, { query: `?date=${date}`, storage: { "warpix-v2-pixe": { born: "2026-11-01", days: 3, last: "2026-11-01" }, "warpix-v2-groups": groupsData([["A", ["youtube"]]]) } });
      t.eq(await p.ev(`pixe.costume()`), id, `${date} の 衣装が ちがう`);
      t.eq(await p.ev(`document.getElementById("npc").dataset.costume ?? null`), id, `${date} の しるしが ちがう`);
      if (word) t.ok((await p.text()).includes(word), `${date} の あいさつが ちがう：${await p.text()}`);
      await p.shot(`v2-costume-${date}.png`);
      t.noErrors(p);
      await b.close();
      await server.close();
    }
  },

  async "リンクに カーソルを のせると 行き先を しょうかい（v1 の まま）"(t) {
    const { server, p } = await openApp(t, { width: 900, height: 900, mobile: false, storage: { "warpix-v2-groups": groupsData([["A", ["youtube", "tiktok"]]]) } });
    await p.text();
    await p.ev(`document.querySelector('.links [data-id="tiktok"]').dispatchEvent(new MouseEvent("mouseover", { bubbles: true }))`);
    t.ok((await p.text()).includes("TIKTOK"), `しょうかい しない：${await p.text()}`);
    t.noErrors(p);
    await server.close();
  },

  async "つつくと ひとこと（おなじ ことを つづけて いわない）"(t) {
    const { server, p } = await openApp(t, { storage: { "warpix-v2-groups": groupsData([["A", ["youtube"]]]) } });
    await p.text();
    const lines = [];
    for (let i = 0; i < 4; i++) {
      await p.click("#npc");
      lines.push(await p.text());
    }
    t.ok(lines.every(Boolean), "つついても しゃべらない");
    t.ok(lines.every((l, i) => i === 0 || l !== lines[i - 1]), `おなじ ことを つづけた：${lines.join(" / ")}`);
    // しゃべって いる とちゅうに つついても、まいかい ジャンプ（v1 の さわりごこち、v2.0.1）
    await p.ev(`pixe.say("ながい ながい おはなしを して いる ところ")`);
    await p.ev(`document.getElementById("npc").classList.remove("jump"); document.getElementById("npc").click()`);
    t.ok(await p.ev(`document.getElementById("npc").classList.contains("jump")`), "しゃべって いる とちゅうだと ジャンプ しない");
    t.noErrors(p);
    await server.close();
  },

  async "UFO：とんで きて、おすと うちおとせる（ピクセが「ナイスショット」）"(t) {
    const { server, p } = await openApp(t);
    await p.ev(`pixe.spawnUfo()`);
    await sleep(200);
    t.ok(await p.ev(`!!document.querySelector(".ufo")`), "UFO が でない");
    await p.ev(`document.querySelector(".ufo").click()`);
    t.ok(await p.ev(`document.querySelector(".ufo").classList.contains("boom")`), "うちおとせない");
    t.ok((await p.text()).includes("ナイスショット"), "ピクセが よろこばない");
    await sleep(600);
    t.ok(await p.ev(`!document.querySelector(".ufo")`), "UFO が きえない");
    t.noErrors(p);
    await server.close();
  },

  async "ワープして もどってくると、その せかいの おみやげばなし（たなの ことば）"(t) {
    const { server, p } = await openApp(t, { storage: { "warpix-v2-groups": groupsData([["A", ["spotify"]]]) } });
    await noNavigate(p);
    await p.click(".links .pixel-btn");
    await sleep(100);
    // むこうへ いった ことに する（タブが うらに まわった）
    await p.ev(`warpDive.trip().left = true`);
    await p.ev(`warpDive.back()`);
    await sleep(1600);
    const line = await p.text(); // もじ送りが おわるのを まつ
    t.ok(await p.ev(`CASSETTES.byId("spotify").back.includes(${JSON.stringify(line)})`), `おみやげばなしで ない：${line}`);
    t.ok(await p.ev(`!document.getElementById("npc").classList.contains("away")`), "ピクセが もどらない");
    t.noErrors(p);
    await server.close();
  },
};
