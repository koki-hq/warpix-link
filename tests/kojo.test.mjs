import { readFileSync } from "node:fs";
// ひみつの こうじょう（v1.43）：ワープゾーンを おすと、そとへ とばずに アプリの なかの こうじょうへ（おたより #2）
async function page(t, query = "") {
  const server = await t.startServer();
  const b = await t.launchBrowser();
  const p = await b.firstPage();
  await p.goto(server.url);
  await p.ev(`localStorage.clear(); localStorage.setItem("warpix-links", JSON.stringify({ youtube: { n: 3, last: "2026-10-01" }, spotify: { n: 2, last: "2026-10-02" } }))`);
  await p.goto(server.url + "?away=0" + query);
  await p.boot();
  await p.ev(`secret.unlock()`);
  await t.sleep(1500);
  return { server, p };
}
const isOpen = (p) => p.ev(`document.getElementById("kojo").open`);

export default {
  async "ワープゾーンを おすと ピクセが とびこんで、ひみつの こうじょうに つく（そとへは とばない）"(t) {
    const { server, p } = await page(t);
    const before = await p.ev(`location.href`);
    await p.ev(`document.getElementById("secret-link").click()`);
    await t.sleep(1500);
    t.ok(await isOpen(p), "こうじょうが ひらかない");
    t.eq(await p.ev(`location.href`), before, "そとへ とんだ");
    const v = await p.ev(`document.getElementById("kojo-version").textContent`);
    t.ok(/^v\d+\.\d+$/.test(v) && readFileSync(new URL("../sw.js", import.meta.url), "utf8").includes(`warpix-${v}.`), `いまの 版: ${v}`);
    t.eq(await p.ev(`document.getElementById("kojo-warps").textContent`), "5かい", "ワープの かいすう");
    t.ok(await p.ev(`document.querySelector("#kojo-pixe svg path") !== null`), "せっけいずの ピクセが ない");
    // v1.58：ソースコードは みせない。みたい ひと だけ かくしコマンド集
    t.ok(await p.ev(`!document.querySelector('#kojo a[href*="github"]') && document.getElementById("kojo-cheats").hidden`), "ソースコードの リンクが のこって いる");
    await p.click("#kojo-cheats-btn");
    t.ok(await p.ev(`!document.getElementById("kojo-cheats").hidden && document.querySelectorAll("#kojo-list dt").length >= 10`), "かくしコマンド集が でない");
    t.ok((await p.ev(`document.getElementById("kojo-list").textContent`)).includes("gameboy"), "コマンドが ならばない");
    await p.click("#kojo-cheats-back");
    t.ok(await p.ev(`!document.getElementById("kojo-main").hidden`), "こうじょうに もどれない");
    t.noErrors(p);
    await server.close();
  },

  async "「もどる」で とじると、ピクセが かえってくる"(t) {
    const { server, p } = await page(t);
    await p.ev(`document.getElementById("secret-link").click()`);
    await t.sleep(1500);
    await t.sleep(2000); // まえは 2.2 びょうで かってに もどって きた。こうじょうに いる あいだは もどらない
    t.ok(await p.ev(`npc.isAway()`), "こうじょうに いる あいだに もどって きた");
    await p.ev(`document.getElementById("kojo-back").click()`);
    t.ok(!(await isOpen(p)), "とじない");
    let back = "";
    for (let i = 0; i < 40 && !back.includes("ひみつの こうじょう"); i++) {
      await t.sleep(100);
      back = await p.text();
    }
    t.ok(back.includes("ただいま") && back.includes("ひみつの こうじょう"), `もどって こない: ${back}`);
    t.ok(await p.ev(`!npc.isAway()`), "はこに もどらない");
    t.noErrors(p);
    await server.close();
  },

  async "うごきを へらす ときは ダイブ せずに すぐ ひらく。Esc でも とじる"(t) {
    const { server, p } = await page(t);
    await p.ev(`document.documentElement.classList.add("reduce-motion")`);
    await p.ev(`kojo.open()`);
    await t.sleep(300);
    t.ok(await isOpen(p), "ひらかない");
    // dialog の Esc は ほんものの キー（キーコード つき）で ないと きかない
    for (const type of ["rawKeyDown", "keyUp"]) await p.send("Input.dispatchKeyEvent", { type, key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 });
    await t.sleep(300);
    t.ok(!(await isOpen(p)), "Esc で とじない");
    t.noErrors(p);
    await server.close();
  },
};
