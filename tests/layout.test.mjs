// 通し稽古（v1.34）：スマホ・よこむき・タブレット・パソコンで、ぜんぶの まどを ひらいて、はみださない・かさならないかを みる
const DIALOGS = [
  ["にっき", `room.open("diary")`], ["ずかん", `room.open("zukan")`], ["スタンプ", `room.open("stamp")`], ["じっせき", `room.open("trophy")`], ["ぼうし", `room.open("hat")`],
  ["カセット", `cassetteUi.open()`], ["へんせい", `cassetteUi.openMenu()`], ["パーティを つくる", `cassetteUi.open({ fresh: true })`],
  ["このページについて", `document.getElementById("about-btn").click()`],
  ["せってい", `document.getElementById("settings-btn").click()`],
  ["さっきょく", `document.getElementById("compose-btn").click()`],
  ["アトリエ", `atelier.open()`],
  ["てがみ", `room.open("diary"); letter.letters().unshift({ week: "2026-10-18", from: "2026-10-12", lines: letter.write().lines, unread: false }); letter.read("2026-10-18")`],
];
// まどが がめんに おさまり、なかみが まどの よこから はみださない
const FITS = `(() => {
  const out = [];
  for (const d of document.querySelectorAll("dialog[open]")) {
    const r = d.getBoundingClientRect();
    if (r.left < -1 || r.right > innerWidth + 1 || r.top < -1 || r.bottom > innerHeight + 1) out.push("まどが がめんの そと");
    for (const el of d.querySelectorAll("*")) {
      if (!el.getClientRects().length || el.matches(".sr-only")) continue;
      const e = el.getBoundingClientRect();
      if (e.width && (e.right > r.right + 1 || e.left < r.left - 1)) out.push("はみだし:" + (el.id || el.className || el.tagName).toString().slice(0, 24));
    }
  }
  if (document.documentElement.scrollWidth > innerWidth + 1) out.push("ページが よこに はみだした");
  return [...new Set(out)];
})()`;
// うえの ボタンたちが、ちゃんと おせる（ほかの ものに かくれていない）
// （リンクの いれかえは がめんの したに かくれている ことが あるので、みえている ときだけ）
const PRESSABLE = `[...document.querySelectorAll("#room-btn, .compose-btn, .simple-toggle, .bgm-toggle, #cassette-btn")].filter((el) => {
  const r = el.getBoundingClientRect();
  if (r.bottom > innerHeight) return false;
  const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
  return !(hit === el || el.contains(hit));
}).map((el) => el.id || el.className)`;

async function rehearse(t, w, h) {
  const server = await t.startServer();
  const b = await t.launchBrowser({ width: w, height: h });
  const p = await b.firstPage();
  await p.size(w, h, true);
  await p.goto(server.url);
  // いちばん ながい なまえの カセットと、にほんごの カセットを いれておく
  await p.ev(`localStorage.clear(); localStorage.setItem("warpix-cassette", JSON.stringify(["ytmusic", "twitter", "studysapuri", "niconico", "applemusic", "pinterest"]))`);
  await p.goto(server.url);
  await p.boot();
  await t.sleep(1200);
  t.eq(await p.ev(FITS), [], `${w}×${h} いつもの がめん`);
  t.eq(await p.ev(PRESSABLE), [], `${w}×${h} かくれて おせない ボタン`);
  for (const [name, js] of DIALOGS) {
    await p.ev(`document.querySelectorAll("dialog[open]").forEach((d) => d.close()); ${js}`);
    await t.sleep(250);
    t.eq(await p.ev(FITS), [], `${w}×${h} ${name}`);
    if (name === "カセット") t.eq(await p.ev(`getComputedStyle(document.querySelector(".cas-head")).position`), h >= 600 ? "sticky" : "static", `${w}×${h} いまの 6 この はりつき`);
  }
  t.noErrors(p);
  await server.close();
}

export default {
  async "スマホ（360×640・390×844）"(t) {
    await rehearse(t, 360, 640);
    await rehearse(t, 390, 844);
  },
  async "スマホの よこむき（667×375）：カセットの たなが みえる"(t) {
    const server = await t.startServer();
    const b = await t.launchBrowser({ width: 667, height: 375 });
    const p = await b.firstPage();
    await p.size(667, 375, true);
    await p.goto(server.url);
    await p.boot();
    await p.ev(`cassetteUi.open()`);
    await t.sleep(300);
    t.eq(await p.ev(`getComputedStyle(document.querySelector(".cas-head")).position`), "static", "ひくい がめんで いまの 6 こが うえに はりついている");
    // たなを いちばん したまで スクロールしたら、たなが みえる
    await p.ev(`document.querySelector("#cassette .about-body").scrollTop = 400`);
    t.ok(await p.ev(`(() => { const s = document.querySelector(".cas-shelf:nth-of-type(2)").getBoundingClientRect(), d = document.getElementById("cassette").getBoundingClientRect(); return s.top < d.bottom && s.bottom > d.top; })()`), "たなが みえない");
    t.noErrors(p);
    await server.close();
    await rehearse(t, 667, 375);
  },
  async "タブレット（768×1024）と パソコン（1280×720）。たかい がめんでは いまの 6 こが うえに のこる"(t) {
    await rehearse(t, 768, 1024);
    await rehearse(t, 1280, 720);
  },
};
