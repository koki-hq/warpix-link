// きろくを まもる・ひっこす：ふっかつの じゅもんで きろくを もちはこぶ、ピクセの ひとこと
async function page(t, size) {
  const server = await t.startServer();
  const b = await t.launchBrowser(size);
  const p = await b.firstPage();
  await p.goto(server.url + "?away=0");
  await p.ev(`localStorage.clear()`);
  return { server, p };
}
const msg = (p) => p.ev(`document.getElementById("save-msg").textContent`);

export default {
  async "じゅもんを コピーして、べつの ブラウザで ふっかつ すると、きろくが そっくり もどる"(t) {
    let { server, p } = await page(t);
    // あそんだ ことに する
    await p.ev(`localStorage.setItem("warpix-hi", "12345"); localStorage.setItem("warpix-achievements", JSON.stringify(["ufo", "konami"])); localStorage.setItem("warpix-song", JSON.stringify("10430000000000000000000000000000000")); localStorage.setItem("warpix-lastseen", JSON.stringify(Date.now() - 9e6)); localStorage.setItem("other-site", "x")`);
    await p.goto(server.url);
    await p.boot();
    await p.ev(`document.getElementById("about-btn").click()`);
    await p.ev(`document.getElementById("save-copy").click()`);
    await t.sleep(500);
    const code = await p.ev(`document.getElementById("save-input").value`);
    t.ok(code.startsWith("WARPIX1-z") && !/[^A-Za-z0-9_-]/.test(code.slice(8)), `じゅもんの かたち: ${code.slice(0, 20)}`);
    t.ok((await msg(p)).includes("じゅもん"), "コピーの ひとこと");
    t.ok(await p.ev(`achievements.has("spell")`), "実績「ふっかつの じゅもん」がない");
    const box = await p.ev(`save.decode(${JSON.stringify(code)})`);
    t.eq(box.data["warpix-hi"], "12345", "じゅもんの なかみ");
    t.ok(!("warpix-lastseen" in box.data) && !("other-site" in box.data), "もちはこばない ものが はいっている");
    t.noErrors(p);
    await server.close();
    await t.closeAll();

    // べつの ブラウザ（まっさら）で ふっかつ
    ({ server, p } = await page(t));
    await p.goto(server.url);
    await p.boot();
    await p.ev(`document.getElementById("about-btn").click()`);
    await p.ev(`(() => { const i = document.getElementById("save-input"); i.value = ${JSON.stringify("  " + code.slice(0, 30) + "\n" + code.slice(30) + "  ")}; i.dispatchEvent(new Event("input")); })()`);
    await p.ev(`document.getElementById("save-load").click()`);
    await t.sleep(300);
    t.ok((await msg(p)).includes("いれかわるよ") && (await p.ev(`document.getElementById("save-load").textContent`)).includes("もういちど"), "1 かいめで たしかめない");
    t.eq(await p.ev(`localStorage.getItem("warpix-hi")`), null, "1 かいめで いれかわった");
    await p.ev(`document.getElementById("save-load").click()`);
    await t.sleep(2500);
    t.eq(await p.ev(`localStorage.getItem("warpix-hi")`), "12345", "ハイスコアが もどらない");
    t.eq(await p.ev(`JSON.parse(localStorage.getItem("warpix-achievements")).filter((a) => a === "ufo" || a === "konami").length`), 2, "実績が もどらない");
    await p.boot({ readIntro: false });
    const lines = await p.readIntro();
    t.ok(lines.some((l) => l.includes("おもいだした")), `ピクセが よろこばない: ${JSON.stringify(lines)}`);
    t.ok(await p.ev(`grow.state.diary.some((e) => e.type === "moved")`), "にっきに ひっこしの ひ が ない");
    t.eq(await p.ev(`localStorage.getItem("warpix-moved")`), null, "ひっこしの しるしが のこる");
    t.noErrors(p);
    await server.close();
  },

  async "まちがった じゅもんでは なにも かわらない"(t) {
    const { server, p } = await page(t);
    await p.goto(server.url);
    await p.boot({ readIntro: false });
    await p.ev(`localStorage.setItem("warpix-hi", "777")`);
    await p.ev(`document.getElementById("about-btn").click()`);
    for (const bad of ["", "ふっかつ", "WARPIX1-zあ", "WARPIX1-jeyJ2IjoyfQ", "WARPIX1-x" + "A".repeat(20)]) {
      await p.ev(`document.getElementById("save-input").value = ${JSON.stringify(bad)}`);
      await p.ev(`document.getElementById("save-load").click()`);
      await t.sleep(200);
      t.ok((await msg(p)).includes("じゅもんが ちがいます"), `まちがいに きづかない: ${bad}`);
    }
    // ほかの サイトの きろくを かきこもうと しても だめ
    const evil = await p.ev(`save.encode({ "not-warpix": "x" })`);
    t.eq(await p.ev(`save.decode(${JSON.stringify(evil)})`), null, "warpix- いがいの きろくを うけいれた");
    t.eq(await p.ev(`localStorage.getItem("warpix-hi")`), "777", "きろくが かわった");
    t.noErrors(p);
    await server.close();
  },

  async "ファイルに ほぞんして、ファイルから よめる"(t) {
    const { server, p } = await page(t);
    await p.goto(server.url);
    await p.boot({ readIntro: false });
    await p.ev(`localStorage.setItem("warpix-hi", "4242")`);
    await p.ev(`window.__saved = null; HTMLAnchorElement.prototype.click = function () { if (this.download) window.__saved = { name: this.download, href: this.href }; }`);
    await p.ev(`document.getElementById("about-btn").click(); document.getElementById("save-file").click()`);
    await t.sleep(500);
    const saved = await p.ev(`window.__saved`);
    t.ok(/^warpix-save-\d{4}-\d{2}-\d{2}\.txt$/.test(saved?.name ?? ""), `ファイルの なまえ: ${saved?.name}`);
    const text = await p.ev(`fetch(${JSON.stringify(saved?.href ?? "")}).then((r) => r.text())`);
    t.ok(text.startsWith("WARPIX1-"), "ファイルの なかみ");
    // ファイルから よむ（input に ファイルを いれた ことに する）
    await p.ev(`(() => { const dt = new DataTransfer(); dt.items.add(new File([${JSON.stringify(text)}], "warpix-save.txt", { type: "text/plain" })); const f = document.getElementById("save-file-input"); f.files = dt.files; f.dispatchEvent(new Event("change")); })()`);
    await t.sleep(500);
    t.ok((await msg(p)).includes("いれかわるよ"), "ファイルを よんでも たしかめない");
    t.noErrors(p);
    await server.close();
  },

  async "3 日 あったら ピクセが いちどだけ きおくの ことを はなす"(t) {
    const { server, p } = await page(t);
    await p.ev(`localStorage.setItem("warpix-pixe", JSON.stringify({ born: "2026-10-01", days: ["2026-10-01", "2026-10-02", "2026-10-03"], last: "2026-10-03", stage: 0, sulk: false, pokeMark: 0, diary: [] }))`);
    await p.goto(server.url + "?date=2026-10-04");
    await p.boot({ readIntro: false });
    const lines = await p.readIntro();
    t.ok(lines.some((l) => l.includes("きおくは この ブラウザの なかに")), `はなさない: ${JSON.stringify(lines)}`);
    t.ok(lines.some((l) => l.includes("ふっかつの じゅもん")), "じゅもんの ことを いわない");
    await p.goto(server.url + "?date=2026-10-05");
    await p.boot({ readIntro: false });
    const again = await p.readIntro();
    t.ok(!again.some((l) => l.includes("きおくは この ブラウザの なかに")), "2 かい いった");
    t.noErrors(p);
    await server.close();
  },
};
