// ---------- WARPIX カード（v1.52）：ピクセと きみの きねんひん。めったに こない ----------
// v1.51 までの ワープえにっき（もどる たびに せかいごとに 1 ページ）を やめて、ピクセが しゅやくの カードに した。
// 本人「おおすぎる」「1 日 1 枚も 多い。記念品って いう ポジションが いい。レアカード感を 出したい」
// 「他の アプリの ために カード 作るの よく わからない」「ピクセに フォーカスしたら しっくり くる」（2026-10-20 チューニング）。
// うまれる のは 3 つの とき だけ（とくべつな ひ・ごく まれ は 1 日 1 まい まで。ふしめ は かならず）。カードに「ふしめ」「レア」などの ことばは かかない。レアは わくの いろ で
//   ふしめ：ピクセと いっしょに ほんとうに いって もどった ワープの 1・10・100・500・1000 かいめ
//   とくべつな ひ：季節の しゅうかん（その としに 1 まい）、しゅうらいの よるに たおした とき
//   ごく まれ：ふつうに もどって きた とき 2%
// わく：しろ（1・10）・ぎん（100・とくべつな ひ）・きん（500・ごく まれ）・にじ（1000 だけ）
const cards = (() => {
  const KEY = "warpix-cards"; // { warps, list: [{ kind, n, date, tier, line }]（あたらしい ものが さき）, got: { "christmas-2026": true } }
  const W = 420;
  const H = 588;
  const MILESTONES = { 1: "white", 10: "white", 100: "silver", 500: "gold", 1000: "rainbow" };
  const RARE = 0.02;
  const pad2 = (n) => String(n).padStart(2, "0");
  const ymdOf = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
  const peek = () => /[?&]date=/.test(location.search);
  const state = { warps: 0, list: [], got: {}, ...store.get(KEY, {}) };
  const save = () => !peek() && store.set(KEY, state);

  // ピクセの ひとこと（カードの したに かく）
  const LINES = {
    1: "はじめての ワープ。\nこれから よろしくね。",
    10: "10かいめの ワープ！\nもう なかよし だね。",
    // ぜんぶ「◯かいめの ワープ」に そろえる（「とぶ」は つかわない）。「ありがとう」は いちばん おもい 1000 だけ（本人）
    100: "100かいめの ワープ！\nもう かぞえきれないね。",
    500: "500かいめの ワープ……！\nそらの ほしより おおいかも。",
    1000: "1000かいめの ワープ。\nずっと いっしょに、ありがとう。",
    christmas: "メリー クリスマス。\nいっしょに いられて うれしい。",
    newyear: "あけまして おめでとう。\nことしも いっしょに ワープしようね。",
    halloween: "トリック オア トリート。\nおかしより きみが いい。",
    tanabata: "たなばたの よる。\nねがいごと、ひとつ かなったよ。",
    raid: "しゅうらいの よる。\nみんなで そらを まもった。",
    rare: [
      "きょうは なんだか\nいい ひ だね。",
      "……いま、ながれぼし みえた？",
      "なんでもない ひ だけど\nなんだか うれしい。",
      "きみが もどって くると\nほっと するんだ。",
    ],
  };

  // ---------- カードを ふやす ----------
  function add(kind, tier, { n = null, line, always = false } = {}) {
    const date = ymdOf(today());
    if (!always && state.list.some((c) => c.date === date)) return null; // 1 日 1 まい まで（ふしめ は べつ）
    const card = { kind, n, date, tier, line };
    state.list = [card, ...state.list];
    save();
    if (state.list.length >= 3) achievements.unlock("enikki");
    grow.write("card", "WARPIX カードが できた。", { force: true });
    tell();
    return card;
  }

  // おかえりの ことばの あとに、ひとこと（じぶんが した ことへの へんじ なので、「1 かい 1 つ」には かぞえない）
  function tell() {
    const wait = () => {
      if (!npc.ready() || playing() || npc.isAway()) return setTimeout(wait, 1500);
      sound.sfx.fanfare?.();
      npc.say(["……あっ！ WARPIX カードが できた。", "ROOM の にっきに しまって おくね。"]);
    };
    setTimeout(wait, 2500);
  }

  on("warp-back", ({ left }) => {
    if (!left) return;
    state.warps++;
    save();
    const n = state.warps;
    if (MILESTONES[n]) return add("warps", MILESTONES[n], { n, line: LINES[n], always: true });
    const s = season.current;
    const year = today().getFullYear();
    if (s && LINES[s] && !state.got[`${s}-${year}`]) {
      const c = add(s, "silver", { line: LINES[s] });
      if (c) {
        state.got[`${s}-${year}`] = true;
        save();
      }
      return;
    }
    if (Math.random() < RARE) add("rare", "gold", { line: LINES.rare[Math.floor(Math.random() * LINES.rare.length)] });
  });
  on("raid-win", ({ night, hits }) => night && hits > 0 && add("raid", "silver", { line: LINES.raid }));

  // ---------- えを かく ----------
  const FRAMES = {
    white: ["#f4f4f4", "#d9d9d9"],
    silver: ["#e3e8ef", "#8d97a8"],
    gold: ["#ffe58a", "#c9961a"],
    rainbow: ["#ff4fa3", "#ffd84a", "#3ee8ff", "#8bf06a", "#b07cff"],
  };
  function draw(card) {
    const css = getComputedStyle(document.body);
    const v = (name) => css.getPropertyValue(name).trim();
    const pal = { o: "#000000", w: v("--fg"), p: v("--accent"), c: v("--accent-2"), y: v("--gold"), k: v("--pumpkin"), v: v("--muted") };
    // 2 ばいの おおきさで かく。スマホで みると もじが ぼやけて いた から（v1.52.1）
    const cv = document.createElement("canvas");
    cv.width = W * 2;
    cv.height = H * 2;
    const c = cv.getContext("2d");
    c.scale(2, 2);
    let seed = [...`${card.date}${card.kind}${card.n ?? ""}`].reduce((a, ch) => (a * 31 + ch.charCodeAt(0)) >>> 0, 7) || 7;
    const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

    // わく（レア度）
    const f = FRAMES[card.tier] ?? FRAMES.white;
    if (card.tier === "rainbow") {
      const band = H / f.length;
      f.forEach((col, i) => {
        c.fillStyle = col;
        c.fillRect(0, i * band, W, band + 1);
      });
    } else {
      c.fillStyle = f[1];
      c.fillRect(0, 0, W, H);
      c.fillStyle = f[0];
      c.fillRect(6, 6, W - 12, H - 12);
    }

    // なかの そら
    const sx = 24;
    const sy = 52;
    const sw = W - 48;
    const sh = 340;
    c.fillStyle = "#1a1433";
    c.fillRect(sx, sy, sw, sh);
    for (let i = 0; i < 40; i++) {
      c.fillStyle = rand() < 0.2 ? pal.c : rand() < 0.3 ? pal.p : "#f4f4f4";
      const s = rand() < 0.15 ? 6 : 3;
      c.fillRect(sx + Math.floor(rand() * (sw - s)), sy + Math.floor(rand() * (sh - 40)), s, s);
    }
    if (card.kind === "christmas") {
      c.fillStyle = "#ffffff";
      for (let i = 0; i < 60; i++) c.fillRect(sx + Math.floor(rand() * sw), sy + Math.floor(rand() * sh), 4, 4);
    }
    if (card.kind === "raid" && typeof MOTHERSHIP !== "undefined") postcard.drawSprite(c, MOTHERSHIP, sx + sw / 2 - 64, sy + 16, 4, { ...pal, p: pal.y });
    // ピクセ（いまの ぼうし）
    const scale = 13;
    postcard.drawSprite(c, dress(NPC.idle), Math.round(W / 2 - 8 * scale), sy + sh - 16 * scale - 18, scale, pal);
    c.strokeStyle = "#1a1433";
    c.lineWidth = 4;
    c.strokeRect(sx, sy, sw, sh);

    // もじ
    const ink = card.tier === "rainbow" ? "#1a1433" : "#2b2f3a";
    c.textBaseline = "top";
    c.textAlign = "center";
    c.fillStyle = ink;
    c.font = '16px "Press Start 2P", monospace';
    c.fillText("WARPIX CARD", W / 2, 20);
    c.fillStyle = "#fff8e7";
    c.fillRect(sx, sy + sh + 14, sw, H - (sy + sh + 14) - 24);
    c.fillStyle = "#2b2f3a";
    c.font = '20px "DotGothic16", monospace';
    (card.line ?? "").split("\n").forEach((t, i) => c.fillText(t, W / 2, sy + sh + 32 + i * 30));
    c.font = '12px "Press Start 2P", monospace';
    c.fillStyle = "#8a7f68";
    c.fillText(card.date.replace(/-/g, "."), W / 2, H - 58);
    return cv;
  }

  // ---------- ROOM の にっきの なか ----------
  const thumbs = new Map();
  const keyOf = (card) => `${card.date}:${card.kind}:${card.n ?? ""}`; // おなじ ひの 1・10 かいめが おなじ えに ならない ように n も（v1.52.1）
  function thumb(card) {
    if (!thumbs.has(keyOf(card))) thumbs.set(keyOf(card), draw(card).toDataURL("image/png"));
    return thumbs.get(keyOf(card));
  }
  const dateOf = (card) => `${Number(card.date.slice(5, 7))}/${Number(card.date.slice(8, 10))}`;
  function shelf() {
    const body = document.getElementById("diary-body");
    body.querySelector(".cards")?.remove();
    if (!state.list.length) return;
    const el = document.createElement("section");
    el.className = "cards";
    el.innerHTML = `<h3>WARPIX カード <span class="cards-count">${state.list.length}まい</span></h3>
      <div class="cards-list">${state.list
        .map((card, i) => `<button type="button" class="cards-btn tier-${card.tier}" data-i="${i}" aria-label="${dateOf(card)} の WARPIX カード"><img src="${thumb(card)}" alt="" width="105" height="147"></button>`)
        .join("")}</div>`;
    el.addEventListener("click", (e) => {
      const b = e.target.closest(".cards-btn");
      if (b) open(state.list[Number(b.dataset.i)]);
    });
    const after = body.querySelector(".letters") ?? body.querySelector(".tonight") ?? body.querySelector(".diary-head");
    after ? after.after(el) : body.prepend(el);
  }
  async function open(card) {
    await postcard.fontsReady();
    room.leave();
    await postcard.show(draw(card), {
      name: `warpix-card-${card.date}.png`,
      title: "WARPIX カード",
      alt: `${card.date} の WARPIX カード：${(card.line ?? "").replace(/\n/g, "")}`,
    });
  }
  on("notebook-tab", ({ which }) => which === "diary" && shelf());

  return { state: () => state, draw, open, add };
})();
