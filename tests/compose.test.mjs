// ピクセと さっきょく：ピアノロール、保存、ピクセに まかせる、シェア、とどいた きょく
const ROWS = [88, 86, 84, 83, 81, 79, 77, 76, 74, 72, 71, 69];

async function openComposer(t, query = "", storage = "") {
  const server = await t.startServer();
  const b = await t.launchBrowser({ width: 700, height: 1000 });
  const p = await b.firstPage();
  await p.goto(server.url);
  await p.ev(`localStorage.clear(); ${storage}`);
  await p.goto(server.url + query);
  await p.boot();
  return { server, p };
}

// ピアノロールの (列, 行) のまんなかを、本物のマウスでクリック
async function clickCell(p, col, row) {
  const pt = await p.ev(`(() => { const r = document.getElementById("roll").getBoundingClientRect(); const w = (r.width - 28) / 32, h = r.height / 12; return { x: r.left + 28 + (${col} + 0.5) * w, y: r.top + (${row} + 0.5) * h }; })()`);
  for (const type of ["mouseMoved", "mousePressed", "mouseReleased"]) {
    await p.send("Input.dispatchMouseEvent", { type, x: pt.x, y: pt.y, button: "left", clickCount: 1 });
  }
}
const savedSong = (p) => p.ev(`composer.decode(JSON.parse(localStorage.getItem("warpix-song")))`);

export default {
  async "♪ から開いて、マスを押して曲を作り、BGM にする（開き直しても残る）"(t) {
    const { server, p } = await openComposer(t);
    await p.click("#compose-btn");
    await t.sleep(400);
    t.ok(await p.ev(`document.getElementById("composer").open`), "作曲画面が開かない");
    t.ok(await p.ev(`document.getElementById("roll").getBoundingClientRect().width > 300`), "ピアノロールが小さすぎる");
    await p.ev(`document.getElementById("compose-clear").click()`);
    await clickCell(p, 0, 2); // 1 拍目に「ド」(C6)
    await clickCell(p, 4, 7); // 5 こめに「ミ」(E5)
    await clickCell(p, 8, 9);
    await clickCell(p, 8, 9); // 同じマスをもう一度 → けす
    await p.ev(`document.getElementById("compose-save").click()`);
    const s = await savedSong(p);
    t.eq(s.steps.slice(0, 9), [3, 0, 0, 0, 8, 0, 0, 0, 0], "置いた音");
    t.eq(s.steps.filter(Boolean).length, 2, "置いた音の数");
    t.eq(await p.ev(`sound.song().lead.slice(0, 5)`), [84, null, null, null, 76], "BGM の曲になっていない");
    t.ok(await p.ev(`achievements.has("composer")`), "実績「さっきょくか」がない");
    await p.shot("compose.png");
    await p.ev(`document.getElementById("composer").close()`);
    await p.goto(server.url);
    t.eq(await p.ev(`sound.song().lead.slice(0, 5)`), [84, null, null, null, 76], "開き直すと自分の曲でなくなる");
    t.noErrors(p);
    await server.close();
  },

  async "キーボードだけでも音を置ける"(t) {
    const { server, p } = await openComposer(t);
    await p.ev(`composer.open(); document.getElementById("compose-clear").click(); document.getElementById("roll").focus()`);
    // カーソルは (0 列, 5 行目＝ソ) から。→ 2 回、↑ 1 回 で (2 列, ラ)、スペースで置く
    for (const k of ["ArrowRight", "ArrowRight", "ArrowUp", " "]) await p.key(k);
    t.ok((await p.ev(`document.getElementById("roll-status").textContent`)).includes("ラ"), "読み上げ用の文字に音の名前がない");
    await p.ev(`document.getElementById("compose-save").click()`);
    t.eq((await savedSong(p)).steps[2], 5, "キーボードで置いた音");
    t.noErrors(p);
    await server.close();
  },

  async "ピクセに まかせると、強い拍はコードの音になる"(t) {
    const { server, p } = await openComposer(t);
    await p.ev(`composer.open(); document.getElementById("compose-pixe").click(); document.getElementById("compose-save").click()`);
    const s = await savedSong(p);
    t.ok(s.steps.filter(Boolean).length >= 12, "音が少なすぎる");
    // コード Am→F→C→G の各小節で、1・5 拍目（強い拍）はそのコードの音
    const tones = [[9, 0, 4], [5, 9, 0], [0, 4, 7], [7, 11, 2]];
    for (const i of [0, 4, 8, 12, 16, 20, 24, 28]) {
      const n = s.steps[i];
      t.ok(n && tones[Math.floor(i / 8)].includes(ROWS[n - 1] % 12), `${i} こめが コードの音でない`);
    }
    t.noErrors(p);
    await server.close();
  },

  async "シェアした URL で開くと、とどいた曲を聞ける（保存はしない）"(t) {
    const { server, p } = await openComposer(t);
    await p.ev(`window.__copied = null; navigator.clipboard.writeText = async (s) => { window.__copied = s; };
      composer.open(); document.getElementById("compose-pixe").click(); document.getElementById("compose-faster").click(); document.getElementById("compose-share").click()`);
    await t.sleep(300);
    const url = await p.ev(`window.__copied`);
    t.ok(url?.includes("?song=1"), `シェアの URL: ${url}`);
    const code = new URL(url).searchParams.get("song");
    const sent = await p.ev(`composer.decode(${JSON.stringify(code)})`);
    t.eq(sent.bpm, 150, "テンポも送られる");
    await p.ev(`document.getElementById("composer").close(); localStorage.removeItem("warpix-song")`);
    await p.goto(`${server.url}?song=${code}`);
    await p.boot();
    await t.sleep(2500);
    t.eq(await p.ev(`[...document.querySelectorAll(".dialog-choices button")].map((b) => b.textContent)`), ["きく", "あとで"], "とどいた曲のおさそい");
    await p.ev(`document.querySelector(".dialog-choices button").click()`);
    await t.sleep(300);
    const expected = sent.steps.map((n) => (n ? ROWS[n - 1] : null));
    t.eq(await p.ev(`sound.song().lead`), expected, "とどいた曲が流れない");
    t.ok(await p.ev(`achievements.has("listener")`), "実績「とどいた きょく」がない");
    t.eq(await p.ev(`localStorage.getItem("warpix-song")`), null, "きいただけで保存された");
    t.noErrors(p);
    await server.close();
  },

  async "もとの BGM に もどせる"(t) {
    const { server, p } = await openComposer(t);
    await p.ev(`composer.open(); document.getElementById("compose-pixe").click(); document.getElementById("compose-save").click(); document.getElementById("compose-reset").click()`);
    t.eq(await p.ev(`JSON.parse(localStorage.getItem("warpix-song"))`), null, "保存が消えない");
    t.eq(await p.ev(`JSON.stringify(sound.song().lead) === JSON.stringify(sound.defaultSong.lead)`), true, "もとの曲に戻らない");
    t.noErrors(p);
    await server.close();
  },
};
