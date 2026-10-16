// ぼうし アトリエ：じぶんで ドット絵の ぼうしを かいて、ピクセに かぶせる
async function openAtelier(t, p) {
  await p.ev(`document.getElementById("trophy-btn").click()`);
  await t.sleep(300);
  await p.ev(`document.getElementById("atelier-btn").click()`);
  await t.sleep(300);
}
// マスの まんなかを 本物の マウスで
const cellPoint = (p, x, y) => p.ev(`(() => { const r = document.querySelector('.atelier-cell[data-x="${x}"][data-y="${y}"]').getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; })()`);
async function mouse(p, type, pt) {
  await p.send("Input.dispatchMouseEvent", { type, x: pt.x, y: pt.y, button: "left", buttons: type === "mouseReleased" ? 0 : 1, clickCount: 1 });
}

export default {
  async "マスを ぬって なまえを つけ、「かぶる」で ピクセが かぶる（ひらきなおしても のこる）"(t) {
    const server = await t.startServer();
    const b = await t.launchBrowser({ width: 700, height: 1000 });
    const p = await b.firstPage();
    await p.goto(server.url + "?away=0");
    await p.ev(`localStorage.clear()`);
    await p.goto(server.url);
    await p.boot();
    await openAtelier(t, p);
    t.ok(await p.ev(`document.querySelector("dialog.atelier").open && !document.getElementById("trophies").open`), "アトリエが ひらかない");
    t.eq(await p.ev(`document.querySelectorAll(".atelier-cell").length`), 96, "マスの かず");
    t.ok(await p.ev(`document.activeElement.matches('.atelier-cell[data-x="0"][data-y="0"]')`), "さいしょの マスに フォーカス");
    // からっぽでは かぶれない
    await p.ev(`document.querySelector(".atelier-wear").click()`);
    t.ok((await p.ev(`document.querySelector(".atelier-msg").textContent`)).includes("なにも かいてない"), "からっぽで かぶれた");
    // きいろを えらんで、5 だんめを ドラッグで 4 マス ぬる
    await p.ev(`[...document.querySelectorAll(".atelier-color")].find((b) => b.textContent === "きいろ").click()`);
    await mouse(p, "mousePressed", await cellPoint(p, 4, 4));
    for (const x of [5, 6, 7]) await mouse(p, "mouseMoved", await cellPoint(p, x, 4));
    await mouse(p, "mouseReleased", await cellPoint(p, 7, 4));
    t.eq(await p.ev(`[...document.querySelectorAll('.atelier-cell[data-y="4"]')].map((b) => b.dataset.c).join("")`), "....yyyy........", "ドラッグで ぬれない");
    // おなじ いろの マスを おすと けせる
    const pt = await cellPoint(p, 7, 4);
    await mouse(p, "mousePressed", pt);
    await mouse(p, "mouseReleased", pt);
    t.eq(await p.ev(`document.querySelector('.atelier-cell[data-x="7"][data-y="4"]').dataset.c`), ".", "おなじ いろで けせない");
    // キーボード：ピンクに して → で うごいて スペース
    await p.ev(`document.querySelector('.atelier-color[data-c="y"]').focus()`);
    await p.key("ArrowLeft"); await p.key("ArrowLeft");
    t.eq(await p.ev(`document.querySelector('.atelier-color[aria-checked="true"]').dataset.c`), "p", "←で いろが かわらない");
    await p.ev(`document.querySelector('.atelier-cell[data-x="7"][data-y="5"]').focus()`);
    await p.key("ArrowRight");
    await p.key(" ");
    t.eq(await p.ev(`document.querySelector('.atelier-cell[data-x="8"][data-y="5"]').dataset.c`), "p", "キーボードで ぬれない");
    t.ok((await p.ev(`document.activeElement.getAttribute("aria-label")`)).includes("6だんめ 9ばんめ：ピンク"), "マスの 読み上げ");
    t.ok(await p.ev(`document.querySelector(".atelier-preview svg") !== null`), "みほんが ない");
    await p.ev(`document.querySelector(".atelier-name input").value = "おほしさま"`);
    await p.shot("atelier.png");
    await p.ev(`document.querySelector(".atelier-wear").click()`);
    await t.sleep(300);
    t.ok(await p.ev(`!document.querySelector("dialog.atelier").open`), "かぶったら とじない");
    t.eq(await p.ev(`JSON.parse(localStorage.getItem("warpix-myhat"))`), { name: "おほしさま", rows: ["................", "................", "................", "................", "....yyy.........", "........p......."] }, "ほぞんした ぼうし");
    t.eq(await p.ev(`wardrobe.currentId()`), "mine", "かぶっていない");
    t.eq(await p.ev(`dress(NPC.idle)[4].slice(4, 7)`), "yyy", "ピクセの え に ぼうしが ない");
    t.ok(await p.ev(`achievements.has("designer") && achievements.has("fashion")`), "実績");
    t.ok(await p.ev(`document.activeElement.id === "trophy-btn"`), "とじたあと フォーカスが もどらない");
    // ひらきなおしても かぶっている。WARDROBE にも ある
    await p.goto(server.url);
    await p.boot({ readIntro: false });
    t.eq(await p.ev(`[wardrobe.currentId(), wardrobe.hats().mine?.name, dress(NPC.idle)[4].slice(4, 7)]`), ["mine", "おほしさま", "yyy"], "ひらきなおすと きえる");
    await openAtelier(t, p);
    t.eq(await p.ev(`document.querySelector('.atelier-cell[data-x="8"][data-y="5"]').dataset.c`), "p", "つづきから かけない");
    t.noErrors(p);
    await server.close();
  },

  async "こわれた ほぞんデータは むしする"(t) {
    const server = await t.startServer();
    const b = await t.launchBrowser();
    const p = await b.firstPage();
    await p.goto(server.url + "?away=0");
    await p.ev(`localStorage.clear(); localStorage.setItem("warpix-myhat", JSON.stringify({ rows: ["<script>"] })); localStorage.setItem("warpix-hat", JSON.stringify("mine"))`);
    await p.goto(server.url);
    await p.boot({ readIntro: false });
    t.ok(await p.ev(`!wardrobe.hats().mine && atelier.saved() === null`), "こわれた ぼうしを よみこんだ");
    t.noErrors(p);
    await server.close();
  },
};
