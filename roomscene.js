// ---------- ピクセの へや（v1.57）：ROOM を ひらくと、タブの まど では なく ピクセが くらす へやの え ----------
// だい 4 かいの はなしあい：ROOM は「ぜんぶ ふくめて かわいい」ところ。ゲームの かんじ、そだてる かんじ、じぶん だけの ピクセ。
// へやに ある もの が 入口：まど＝つぶやき・カレンダー＝スタンプ・トロフィー＝じっせき・ほんだな＝ずかん・クローゼット＝きせかえ・
// ポスト＝てがみ・カメラ＝ポストカード・カードばこ＝WARPIX カード。あたらしい ものが ある もの だけ ひかる。
// 1きせいの きっぷは かべに かざる。したに そだちの ステータス。
const roomScene = (() => {
  const PAL = { ...PALETTE, n: "var(--bg)", b: "var(--btn-hover)", g: "var(--bg-grid)" };
  const ART = {
    window: [
      "vvvvvvvvvvvvvvvv",
      "vnnnnnnvvnnnnnnv",
      "vnwnnnnvvnnnnyyv",
      "vnnnnnnvvnnnyynv",
      "vnnnnwnvvnnnyynv",
      "vnnnnnnvvnnnnyyv",
      "vvvvvvvvvvvvvvvv",
      "vnnnnnnvvnnnnnnv",
      "vnnnwnnvvnwnnnnv",
      "vnnnnnnvvnnnnnnv",
      "vvvvvvvvvvvvvvvv",
      "bbbbbbbbbbbbbbbb",
    ],
    calendar: [
      "..o....o..",
      "poppppppop",
      "pppppppppp",
      "wwwwwwwwww",
      "wvwvwvwvww",
      "wwwwwwwwww",
      "wvwvwpwvww",
      "wwwwwwwwww",
      "wvwvwvwvww",
      "wwwwwwwwww",
    ],
    shelf: [
      "vvvvvvvvvvvvvv",
      "vpcyywpccvpywv",
      "vpcyywpccvpywv",
      "vpcyywpccvpywv",
      "vpcyywpccvpywv",
      "vvvvvvvvvvvvvv",
      "vcwpyvcwppycwv",
      "vcwpyvcwppycwv",
      "vcwpyvcwppycwv",
      "vcwpyvcwppycwv",
      "vvvvvvvvvvvvvv",
      "vbbbbbbbbbbbbv",
      "vbbbbbbbbbbbbv",
      "vvvvvvvvvvvvvv",
    ],
    // ハンガーラック（とびらの ある はこ だと きんこに みえた）
    closet: [
      "vvvvvvvvvvvvvvvvvv",
      "v..w....w....w...v",
      "vpp.ppcc.cckk.kk.v",
      "vpppppccccckkkkk.v",
      "v.ppp..ccc..kkk..v",
      "v.ppp..ccc..kkk..v",
      "v................v",
      "v................v",
      "vv..............vv",
    ],
    post: [
      "..pppppp..",
      ".pppppppp.",
      ".pwwwwwwp.",
      ".pppppppp.",
      ".pppppppp.",
      ".pppppppp.",
      "....vv....",
      "....vv....",
      "....vv....",
      "...vvvv...",
    ],
    // レコードプレーヤー（さっきょくと レコードだな、v1.59）
    record: [
      "vvvvvvvvvvvvvv",
      "vbbbbbbbbbbbwv",
      "vbbnnnnnnbbbwv",
      "vbnnnpppnnbbwv",
      "vbnnpwwpnnbbvv",
      "vbnnnpppnnbbbv",
      "vbbnnnnnnbbbbv",
      "vbbbbbbbbbbbbv",
      "vvvvvvvvvvvvvv",
      ".v..........v.",
    ],
    camera: [
      "...www......",
      "wwwwwwwwwwww",
      "wvvvvccvvvvw",
      "wvvvcnncvvvw",
      "wvvvcnncvvvw",
      "wvvvvccvvvvw",
      "wwwwwwwwwwww",
    ],
    cardbox: [
      "..yyyy.cccc.",
      "..ypyy.cwwc.",
      "bbbbbbbbbbbb",
      "bvvvvvvvvvvb",
      "bvbbbbbbbbvb",
      "bvvvvvvvvvvb",
      "bbbbbbbbbbbb",
    ],
    ticket: [
      "vvvvvvvvvvvv",
      "vyyyyyyyyyyv",
      "vypyyyyyyyyv",
      "vyyywwwwwyyv",
      "vyyyyyyyyyyv",
      "vvvvvvvvvvvv",
    ],
  };

  // もの：どこに あって、おすと どこへ いくか
  const THINGS = [
    { id: "window", label: "つぶやき", name: "まど", go: () => room.open("diary") },
    { id: "calendar", label: "スタンプ", name: "カレンダー", go: () => room.open("stamp") },
    { id: "trophy", label: "じっせき", name: "トロフィーの たな", go: () => room.open("trophy") },
    { id: "closet", label: "クローゼット", name: "クローゼット", go: () => room.open("hat") },
    { id: "shelf", label: "ずかん", name: "ほんだな", go: () => room.open("zukan") },
    { id: "post", label: "てがみ", name: "ポスト", go: () => room.open("letters"), empty: () => !letter.letters().length },
    { id: "camera", label: "ポストカード", name: "カメラ", go: () => document.getElementById("postcard-btn").click() },
    { id: "record", label: "さっきょく", name: "レコードプレーヤー", go: () => composer.open() },
    { id: "cardbox", label: "カード", name: "カードばこ", go: () => room.open("cards"), empty: () => !cards.state().list.length },
  ];

  const el = document.getElementById("room-scene");
  function render() {
    const s = grow.state;
    const stages = grow.stages();
    const next = stages[s.stage + 1];
    const tweetNew = !grow.readToday();
    const letterNew = letter.letters().some((l) => l.unread);
    const glow = { window: tweetNew, post: letterNew, closet: closet.hasNew() };
    const ticketOn = typeof ticket !== "undefined" && ticket.has();
    el.innerHTML = `
      <div class="rs-room">
        ${THINGS.map((t) => {
          const art = t.id === "trophy" ? pixelSvg(TROPHY) : pixelSvg(ART[t.id], PAL);
          const empty = t.empty?.();
          return `<button type="button" class="rs-thing rs-${t.id}${glow[t.id] ? " glow" : ""}${empty ? " empty" : ""}" data-thing="${t.id}" aria-label="${t.name}（${t.label}）${glow[t.id] ? "、あたらしい ものが あるよ" : ""}${empty ? "、まだ からっぽ" : ""}">
            <span class="rs-art">${art}</span><span class="rs-label">${t.label}</span>${t.id === "trophy" ? `<span class="rs-count">${achievements.count()}</span>` : ""}</button>`;
        }).join("")}
        ${ticketOn ? `<button type="button" class="rs-thing rs-ticket" data-thing="ticket" aria-label="1きせいの きっぷ"><span class="rs-art">${pixelSvg(ART.ticket, PAL)}</span></button>` : ""}
        <button type="button" class="rs-pixe" aria-label="ピクセ">${pixelSvg(dress(NPC.idle))}</button>
        <p class="rs-say" aria-live="polite"></p>
      </div>
      <dl class="rs-status">
        <div><dt>なまえ</dt><dd>${grow.stageName()}</dd></div>
        <div><dt>であって</dt><dd>${grow.age() + 1}にちめ</dd></div>
        <div><dt>あえた ひ</dt><dd>${s.days.length}にち</dd></div>
        <div><dt>ワープした かず</dt><dd>${favorite.total()}かい</dd></div>
        <div><dt>つぎの せいちょう</dt><dd>${next ? `あと ${next.days - s.days.length}にち` : "もう さいこう！"}</dd></div>
      </dl>`;
  }

  const say = (text) => {
    const p = el.querySelector(".rs-say");
    p.textContent = text;
    p.classList.remove("show");
    void p.offsetWidth;
    p.classList.add("show");
  };
  el.addEventListener("click", (e) => {
    const pixe = e.target.closest(".rs-pixe");
    if (pixe) {
      pixe.classList.remove("jump");
      void pixe.offsetWidth;
      pixe.classList.add("jump");
      sound.sfx.coin();
      return;
    }
    const b = e.target.closest(".rs-thing");
    if (!b) return;
    sound.sfx.select();
    if (b.dataset.thing === "ticket") return say(`1きせいの きっぷ。${ticket.since()} に きてくれた しるし。かべに かざって あるんだ。`);
    const thing = THINGS.find((t) => t.id === b.dataset.thing);
    if (thing?.empty?.()) return say("まだ からっぽ。");
    thing?.go();
  });

  on("notebook-tab", ({ which }) => which === "home" && render());
  return { render };
})();
