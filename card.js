// ---------- WARPIX カード（v1.52 → v1.53 レアカード）：ピクセと きみの きねんひん ----------
// v1.51 までの ワープえにっき（もどる たびに せかいごとに 1 ページ）を やめて、ピクセが しゅやくの カードに した（v1.52）。
// v1.53：本人「てに はいっても うれしくないし わくわく しないし 見せびらかしたいとも おもわない」（2026-10-21 だい 2 かい かいぎ）。
// 3 つの わく：
//   ふしめ：ピクセと いっしょに ほんとうに いって もどった ワープの 1・10・100・500・1000 かいめ（かいすうで ランク）
//   ラッキー：ふだんの ワープの かえりに きまぐれ。ピクセが「ポケットが ひかってる」と いったら でる かも。ランクは うん
//   とくべつな ひ：きせつ・しゅうらいの よる・オープン きねん（2026/11/1〜7）・しゅうねん（まいとし 11/1〜7）。ランクの そと
// でる ときは うらむきで おちて きて、タップで めくる（ガチャの かくてい えんしゅつ）。ピクセの はんのうと 音も レアで かわる。
// ピクセの かお・ポーズは かえない（本人「キャラ ほうかい する」）。ラベルの ことば（レア など）は かかない
const cards = (() => {
  const KEY = "warpix-cards"; // { warps, list: [{ kind, n, date, tier, line }]（あたらしい ものが さき）, got: { "christmas-2026": true }, counted: ["card-01"] }
  const W = 420;
  const H = 588;
  const MILESTONES = { 1: "white", 10: "white", 100: "silver", 500: "gold", 1000: "rainbow" };
  const OMEN = 0.05; // ワープの かえりに「ポケットが ひかってる」
  const OMEN_HIT = 0.7; // ひかったら カードが でる（のこりは「きの せい だった」）
  const pad2 = (n) => String(n).padStart(2, "0");
  const ymdOf = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
  const peek = () => /[?&]date=/.test(location.search);
  const state = { warps: 0, list: [], got: {}, counted: [], ...store.get(KEY, {}) };
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
    open: "WARPIX LINK、かいてん！\nきてくれて ありがとう。",
    anniv: (n) => `${n}ねん いっしょ！\nこれからも よろしくね。`,
    lucky: {
      white: ["きょうは なんだか\nいい ひ だね。", "なんでもない ひ だけど\nなんだか うれしい。", "きみが もどって くると\nほっと するんだ。"],
      silver: ["……いま、ながれぼし みえた？", "つきが まるい よる。\nきみと みられて よかった。", "ポケットに ほしが\nひとつ はいってた。"],
      gold: ["ポケットが ひかってたの、\nこれ だったんだ！", "きんいろの ひかり、\nきみの ぶん だよ。"],
      rainbow: ["う、うそ……！\nにじいろ だ！！", "せかいで いちばん\nラッキーな ひ かも！"],
    },
  };
  // ラッキーの ランク（にじは ひかった ときの 2%。ぜんぶで ワープ 1400 かいに 1 まい くらい）
  const rollTier = (r = Math.random()) => (r < 0.02 ? "rainbow" : r < 0.12 ? "gold" : r < 0.4 ? "silver" : "white");
  const pick = (a) => a[Math.floor(Math.random() * a.length)];

  // ---------- カードを ふやす ----------
  function add(kind, tier, { n = null, line, always = false } = {}) {
    const date = ymdOf(today());
    if (!always && state.list.some((c) => c.date === date && c.kind !== "warps")) return null; // ラッキー・きせつ は 1 日 1 まい まで
    const card = { kind, n, date, tier, line };
    state.list = [card, ...state.list];
    save();
    if (state.list.length >= 3) achievements.unlock("enikki");
    grow.write("card", "WARPIX カードが できた。", { force: true });
    counter.got(card);
    reveal(card);
    return card;
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
      const c = add(s, null, { line: LINES[s] });
      if (c) {
        state.got[`${s}-${year}`] = true;
        save();
      }
      return;
    }
    if (Math.random() < OMEN) omen();
  });
  on("raid-win", ({ night, hits }) => night && hits > 0 && add("raid", null, { line: LINES.raid }));

  // オープン きねん・しゅうねん：その しゅうかんに ひらいた ひと ぜんいん
  on("boot", () => {
    const d = today();
    const md = (d.getMonth() + 1) * 100 + d.getDate();
    const y = d.getFullYear();
    if (md < 1101 || md > 1107 || y < 2026) return;
    const key = y === 2026 ? "open" : `anniv-${y}`;
    if (state.got[key]) return;
    state.got[key] = true;
    save();
    setTimeout(() => (y === 2026 ? add("open", null, { line: LINES.open, always: true }) : add("anniv", null, { n: y - 2026, line: LINES.anniv(y - 2026), always: true })), 3000);
  });

  // ---------- 「ポケットが ひかってる」（きまぐれ） ----------
  let omenOn = false;
  function omen() {
    if (omenOn || state.list.some((c) => c.date === ymdOf(today()) && c.kind !== "warps")) return;
    omenOn = true;
    const wait = () => {
      if (!npc.ready() || playing() || npc.isAway()) return setTimeout(wait, 1200);
      sound.sfx.twinkle?.();
      npc.say(["……ん？ ポケットが\nひかってる。"]);
      document.getElementById("npc")?.classList.add("card-omen");
      setTimeout(() => {
        document.getElementById("npc")?.classList.remove("card-omen");
        omenOn = false;
        if (Math.random() < OMEN_HIT) {
          const tier = rollTier();
          add("lucky", tier, { line: pick(LINES.lucky[tier]) });
        } else npc.say(["……きの せい だった。"]);
      }, 2600);
    };
    setTimeout(wait, 2000);
  }

  // ---------- でる しゅんかん：うらむきで おちて きて、タップで めくる ----------
  const REACT = {
    white: ["あっ、カードだ！", "ROOM の にっきに しまって おくね。"],
    silver: ["わあ、ぎんいろ！", "きらきら してる……。"],
    gold: ["えっ……！ き、きんいろ！？", "すごい すごい！ たからものに しよう！"],
    rainbow: ["に、にじいろ……！！", "うそでしょ！？ ほんとに！？", "きょうの こと、ずっと わすれないよ！"],
    event: ["きょう だけの カードだ！", "ROOM の にっきに かざって おくね。"],
    open: ["オープン きねんの カード！", "きてくれて ほんとうに ありがとう！"],
  };
  const glowOf = (card) => (EVENTS[card.kind] ? EVENTS[card.kind].frame[2] : { white: "#ffffff", silver: "#c4ccd8", gold: "#ffd84a", rainbow: "#ff4fa3" }[card.tier] ?? "#ffffff");
  const isHolo = (card) => card.tier === "gold" || card.tier === "rainbow" || !!EVENTS[card.kind]?.holo;
  let revealing = null;
  const reduce = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

  function reveal(card) {
    const wait = () => {
      if (!npc.ready() || playing() || npc.isAway() || revealing || postcard.isOpen() || document.querySelector("dialog[open]")) return setTimeout(wait, 1500);
      show(card);
    };
    setTimeout(wait, 1500);
  }

  async function show(card) {
    await postcard.fontsReady();
    const el = document.createElement("div");
    revealing = el;
    el.className = `card-reveal tier-${card.tier ?? "event"}${card.tier === "rainbow" ? " rainbow" : ""}`;
    el.setAttribute("role", "dialog");
    el.setAttribute("aria-label", "WARPIX カード");
    el.style.setProperty("--glow", glowOf(card));
    el.innerHTML = `
      <button type="button" class="card-flip" aria-label="カードを めくる">
        <span class="card-face card-back"><img src="${back()}" alt="" width="210" height="294"></span>
        <span class="card-face card-front${isHolo(card) ? " holo" : ""}"><img src="${draw(card).toDataURL("image/png")}" alt="${card.date} の WARPIX カード：${(card.line ?? "").replace(/\n/g, "")}" width="210" height="294"></span>
      </button>
      <div class="card-reveal-talk">
        <span class="card-reveal-pixe" aria-hidden="true">${pixelSvg(dress(NPC.idle))}</span>
        <p class="card-reveal-msg" aria-live="polite">タップして めくる</p>
      </div>
      <p class="card-reveal-note" hidden></p>
      <div class="card-reveal-row" hidden>
        <button type="button" class="c-btn card-reveal-save">ほぞん・シェア</button>
        <button type="button" class="c-btn c-main card-reveal-close">とじる</button>
      </div>`;
    const flip = el.querySelector(".card-flip");
    const msg = el.querySelector(".card-reveal-msg");
    const row = el.querySelector(".card-reveal-row");
    const pixe = el.querySelector(".card-reveal-pixe");
    const timers = [];
    const close = () => {
      timers.forEach(clearTimeout);
      el.remove();
      revealing = null;
    };
    // うしろの まくで ピクセが かくれるので、カードの したの ちいさな ピクセが よろこぶ
    const hop = () => {
      pixe.classList.remove("jump");
      void pixe.offsetWidth;
      pixe.classList.add("jump");
    };
    let flipped = false;
    flip.addEventListener("click", () => {
      if (flipped) return;
      flipped = true;
      el.classList.add("flipped");
      flip.setAttribute("aria-label", "WARPIX カード");
      row.hidden = false;
      holoFollow(el.querySelector(".card-front"));
      const t = card.tier;
      if (t === "rainbow") {
        sound.sfx.fanfare();
        setTimeout(() => sound.sfx.fanfare(), 700);
        stars.warp(2500);
      } else if (t === "gold" || EVENTS[card.kind]) sound.sfx.fanfare();
      else if (t === "silver") sound.sfx.powerup();
      else sound.sfx.coin();
      const lines = REACT[card.kind === "open" ? "open" : EVENTS[card.kind] ? "event" : t] ?? REACT.white;
      const hops = t === "rainbow" ? 6 : t === "gold" ? 3 : 1;
      for (let i = 0; i < hops; i++) timers.push(setTimeout(hop, i * 450));
      lines.forEach((line, i) => timers.push(setTimeout(() => (msg.textContent = line), i * 1500)));
      const note = el.querySelector(".card-reveal-note");
      counter.note(card).then((text) => {
        if (!text || !el.isConnected) return;
        note.textContent = text;
        note.hidden = false;
      });
      el.querySelector(".card-reveal-close").focus({ preventScroll: true });
    });
    el.querySelector(".card-reveal-close").addEventListener("click", close);
    el.querySelector(".card-reveal-save").addEventListener("click", () => {
      close();
      open(card);
    });
    el.addEventListener("keydown", (e) => e.key === "Escape" && close());
    document.body.append(el);
    sound.sfx.select();
    flip.focus({ preventScroll: true });
    // うごきを へらす ときは、すぐ めくった ところから
    if (reduce()) flip.click();
  }

  // ホロ：ゆびや マウスの いちで ひかりが うごく（うごきを へらす ときは うごかない）
  function holoFollow(face) {
    if (!face?.classList.contains("holo") || reduce()) return;
    const move = (e) => {
      const r = face.getBoundingClientRect();
      face.style.setProperty("--hx", `${Math.round(((e.clientX - r.left) / r.width) * 100)}%`);
      face.classList.add("follow");
    };
    face.addEventListener("pointermove", move);
  }

  // ---------- もっている ひとの わりあい（Supabase に かずだけ。だれが もって いるかは おくらない） ----------
  const counter = (() => {
    const cfg = window.WARPIX_ONLINE ?? {};
    const on = () => !!(cfg.url && cfg.key) && !peek();
    const headers = () => ({ apikey: cfg.key, Authorization: `Bearer ${cfg.key}`, "Content-Type": "application/json" });
    const bump = (id) => on() && fetch(`${cfg.url}/rest/v1/rpc/bump`, { method: "POST", headers: headers(), body: JSON.stringify({ counter: id, n: 1 }) }).catch(() => {});
    // この ブラウザを 1 にんと して かぞえる（わりあいの ぶんぼ）
    if (on() && !store.get("warpix-card-player", false)) {
      store.set("warpix-card-player", true);
      bump("players");
    }
    const idOf = (card) => `card-${pad2(numberOf(card))}`;
    let cache = null;
    async function load() {
      if (!on()) return null;
      if (cache) return cache;
      try {
        const ctrl = new AbortController();
        setTimeout(() => ctrl.abort(), 2500);
        const res = await fetch(`${cfg.url}/rest/v1/counters?select=id,value&or=(id.eq.players,id.like.card-*)`, { headers: headers(), signal: ctrl.signal });
        if (!res.ok) return null;
        cache = Object.fromEntries((await res.json()).map((r) => [r.id, Number(r.value)]));
        return cache;
      } catch {
        return null;
      }
    }
    return {
      // はじめて その ばんごうを もった ときだけ 1 つ ふやす
      got(card) {
        const id = idOf(card);
        if (numberOf(card) < 1 || state.counted.includes(id)) return;
        state.counted.push(id);
        save();
        bump(id);
        cache = null;
      },
      async note(card) {
        const c = await load();
        const players = c?.players ?? 0;
        const has = c?.[idOf(card)];
        if (!players || players < 20 || !has) return null;
        const pct = (has / players) * 100;
        return `この カードを もっている ひと：ぜんたいの ${pct < 1 ? pct.toFixed(1) : Math.round(pct)}%`;
      },
    };
  })();

  // ---------- えを かく（v1.53：レアカードらしく） ----------
  // 本人「てに はいっても うれしくないし わくわく しないし 見せびらかしたいとも おもわない」（2026-10-21）。
  // ピクセの かお・ポーズは かえない（本人「キャラ ほうかい する」）。レアは せなかの けしき・わく・ひかり で みせる
  //   しろ：いつもの ほしぞら
  //   ぎん：おおきな つきと ほしぐも
  //   きん：きんの ひかりが あふれる うちゅう、キラキラ、ホロ
  //   にじ：オーロラと ながれぼしの あめ、キラキラ、ホロ
  // とくべつな ひ（きせつ・しゅうらいの よる・オープン・しゅうねん）は ランクの そと。その ひ だけの わくと けしき
  const RANKS = {
    // [ふち, まんなか, ひかり]
    white: ["#c9c9c9", "#f4f4f4", "#ffffff"],
    silver: ["#6f7a8c", "#c4ccd8", "#f3f6fb"],
    gold: ["#a8740a", "#f2c230", "#fff3b0"],
  };
  const RAINBOW = ["#ff4fa3", "#ffd84a", "#3ee8ff", "#8bf06a", "#b07cff"];
  // とくべつな ひ：[ふち, まんなか, もよう, もようの かたち]、そら、リボンの もじ
  const EVENTS = {
    halloween: { frame: ["#2a0f3a", "#5a2a7a", "#ff8a1a", "pumpkin"], sky: ["#2a0f3a", "#4a1a3a", "#7a2a1a"], name: "HALLOWEEN", hat: "pumpkin" },
    christmas: { frame: ["#7a0f1f", "#c8243a", "#ffffff", "snow"], sky: ["#0f1a3a", "#1a2a50"], name: "CHRISTMAS", hat: "santa" },
    newyear: { frame: ["#a01a1a", "#ffffff", "#e8303a", "stripe"], sky: ["#1a1a4a", "#5a2a5a", "#c25a3a", "#f2a23a"], name: "HAPPY NEW YEAR", hat: "hachimaki" },
    tanabata: { frame: ["#0a0f2a", "#1a2560", "#ffd84a", "star"], sky: ["#0a0f2a", "#141a40"], name: "TANABATA", hat: "tanzaku" },
    raid: { frame: ["#1a0f2a", "#3a1a5a", "#ffd84a", "star"], sky: ["#1a0f2a", "#2a1440"], name: "RAID NIGHT" },
    open: { frame: ["#a8740a", "#ff4fa3", "#ffd84a", "confetti"], sky: ["#1a1433", "#2a1450"], name: "GRAND OPEN", holo: true },
    anniv: { frame: ["#1a1433", "#3ee8ff", "#ff4fa3", "confetti"], sky: ["#0f0a2a", "#1a1433"], name: "ANNIVERSARY", holo: true },
  };
  const yearOf = (card) => Number(card.date.slice(0, 4));

  // コレクションの ばんごう（しゅるいごとに きまって いる。まだ ない ものは たなに うらむきで ならぶ）
  //   ふしめ No.01〜05、ラッキー No.06〜09（しろ・ぎん・きん・にじ）、とくべつな ひ No.10〜16
  const ORDER = ["warps:1", "warps:10", "warps:100", "warps:500", "warps:1000", "lucky:white", "lucky:silver", "lucky:gold", "lucky:rainbow",
    "halloween", "christmas", "newyear", "tanabata", "raid", "open", "anniv"];
  const slotOf = (card) => (card.kind === "warps" ? `warps:${card.n}` : card.kind === "lucky" ? `lucky:${card.tier}` : card.kind === "rare" ? "lucky:gold" : card.kind);
  const numberOf = (card) => ORDER.indexOf(slotOf(card)) + 1;

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
    const ev = EVENTS[card.kind];
    const tier = ev ? null : RANKS[card.tier] || card.tier === "rainbow" ? card.tier : "white";
    const px = (x, y, s, col) => {
      c.fillStyle = col;
      c.fillRect(Math.round(x), Math.round(y), s, s);
    };
    const slant = (x0, w0, y0, y1, dx, col) => {
      c.fillStyle = col;
      c.beginPath();
      c.moveTo(x0, y0);
      c.lineTo(x0 + w0, y0);
      c.lineTo(x0 + w0 - dx, y1);
      c.lineTo(x0 - dx, y1);
      c.fill();
    };

    // ---------- わく ----------
    if (tier === "rainbow") {
      for (let i = -H; i < W + H; i += 12) slant(i, 12, 0, H, H * 0.6, RAINBOW[Math.floor((i + H) / 12) % RAINBOW.length]);
    } else if (ev) {
      const [edge, mid, mark, shape] = ev.frame;
      c.fillStyle = edge;
      c.fillRect(0, 0, W, H);
      c.fillStyle = mid;
      c.fillRect(6, 6, W - 12, H - 12);
      if (shape === "stripe") for (let i = -H; i < W + H; i += 24) slant(i, 12, 6, H - 6, 40, mark);
      // わくの もよう（そとがわ だけ）
      const PATTERN = {
        pumpkin: [".kk.", "kkkk", "kkkk", ".kk."],
        snow: [".w.", "www", ".w."],
        star: [".y.", "yyy", ".y."],
      };
      if (PATTERN[shape]) {
        const pat = PATTERN[shape];
        const spots = [];
        for (let x = 14; x < W - 14; x += 30) spots.push([x, 14], [x, H - 22]);
        for (let y = 44; y < H - 30; y += 30) spots.push([10, y], [W - 20, y]);
        for (const [x, y] of spots) postcard.drawSprite(c, pat, x, y, 3, { k: mark, w: mark, y: mark });
      }
      if (shape === "confetti") {
        for (let i = 0; i < 90; i++) {
          const x = rand() * W;
          const y = rand() * H;
          if (x > 20 && x < W - 20 && y > 46 && y < H - 20) continue;
          px(x, y, 4, [mark, "#ffffff", "#3ee8ff", "#ffd84a", "#ff4fa3"][i % 5]);
        }
      }
    } else {
      const f = RANKS[tier];
      c.fillStyle = f[0];
      c.fillRect(0, 0, W, H);
      c.fillStyle = f[1];
      c.fillRect(6, 6, W - 12, H - 12);
      // ぎん・きん は きんぞくの ひかり（ななめの すじ）
      if (tier !== "white") for (const [x0, w0] of [[40, 18], [70, 6], [250, 26], [290, 8]]) slant(x0, w0, 6, 46, 140, f[2]);
    }

    // ---------- なかの そら ----------
    const sx = 24;
    const sy = 52;
    const sw = W - 48;
    const sh = 340;
    c.save();
    c.beginPath();
    c.rect(sx, sy, sw, sh);
    c.clip();
    const SKY = { white: ["#1a1433"], silver: ["#141a3a", "#1d2550"], gold: ["#2a1a08", "#4a300a"], rainbow: ["#1a1040", "#14204a", "#102a3a"] };
    const sky = ev ? ev.sky : SKY[tier];
    const band = sh / sky.length;
    sky.forEach((col, i) => {
      c.fillStyle = col;
      c.fillRect(sx, sy + i * band, sw, band + 1);
    });
    // ほし（レアほど おおく）
    const starN = { white: 40, silver: 70, gold: 60, rainbow: 90 }[tier] ?? 40;
    for (let i = 0; i < starN; i++) {
      const s = rand() < 0.15 ? 6 : 3;
      px(sx + rand() * (sw - s), sy + rand() * (sh - 40), s, rand() < 0.2 ? pal.c : rand() < 0.3 ? pal.p : "#f4f4f4");
    }

    // ---------- けしき ----------
    const cx = sx + sw / 2;
    const ground = sy + sh - 120;
    if (tier === "silver") {
      // ほしぐも と おおきな つき
      for (let i = 0; i < 160; i++) {
        const a = rand() * Math.PI * 2;
        const r = rand() * 90;
        px(sx + 90 + Math.cos(a) * r * 1.4, sy + 120 + Math.sin(a) * r * 0.6, 4, ["rgba(176,124,255,0.25)", "rgba(62,232,255,0.18)", "rgba(255,79,163,0.18)"][i % 3]);
      }
      c.fillStyle = "#fff3c4";
      c.beginPath();
      c.arc(sx + sw - 80, sy + 80, 44, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = "rgba(220, 200, 140, 0.5)";
      for (const [mx, my, mr] of [[-14, -10, 8], [10, 12, 6], [-4, 20, 4]]) {
        c.beginPath();
        c.arc(sx + sw - 80 + mx, sy + 80 + my, mr, 0, Math.PI * 2);
        c.fill();
      }
    }
    if (tier === "gold") {
      // ピクセの うしろから きんの ひかりが あふれる
      for (let a = 0; a < 18; a++) {
        const t0 = (a / 18) * Math.PI * 2;
        const t1 = t0 + Math.PI / 30;
        c.fillStyle = a % 2 ? "rgba(255, 216, 74, 0.35)" : "rgba(255, 243, 176, 0.18)";
        c.beginPath();
        c.moveTo(cx, ground);
        c.lineTo(cx + Math.cos(t0) * 400, ground + Math.sin(t0) * 400);
        c.lineTo(cx + Math.cos(t1) * 400, ground + Math.sin(t1) * 400);
        c.fill();
      }
      const glow = c.createRadialGradient(cx, ground, 10, cx, ground, 150);
      glow.addColorStop(0, "rgba(255, 230, 140, 0.7)");
      glow.addColorStop(1, "rgba(255, 216, 74, 0)");
      c.fillStyle = glow;
      c.fillRect(sx, sy, sw, sh);
      for (let i = 0; i < 80; i++) px(sx + rand() * sw, sy + rand() * sh, 2, "rgba(255, 230, 140, 0.9)");
    }
    if (tier === "rainbow") {
      // オーロラ（なみうつ にじの おび）
      RAINBOW.forEach((col, k) => {
        c.fillStyle = col;
        c.globalAlpha = 0.28;
        for (let x = 0; x < sw; x += 4) {
          const y = sy + 70 + k * 16 + Math.sin(x / 40 + k * 0.7) * 22;
          c.fillRect(sx + x, y, 4, 22);
        }
      });
      c.globalAlpha = 1;
      // ながれぼしの あめ
      for (let m = 0; m < 6; m++) {
        const x0 = sx + rand() * sw;
        const y0 = sy + rand() * 160;
        for (let k = 0; k < 10; k++) px(x0 + k * 6, y0 + k * 3, k === 9 ? 6 : 3, k === 9 ? "#ffffff" : RAINBOW[k % 5]);
      }
    }
    if (card.kind === "tanabata") {
      for (let i = 0; i < 260; i++) {
        const t = rand();
        px(sx + t * sw, sy + 40 + t * 160 + (rand() - 0.5) * 70, rand() < 0.1 ? 4 : 2, rand() < 0.3 ? "#bfe8ff" : "#ffffff");
      }
    }
    if (card.kind === "halloween") {
      c.fillStyle = "#ffd36a";
      c.beginPath();
      c.arc(sx + sw - 84, sy + 84, 46, 0, Math.PI * 2);
      c.fill();
      const BAT = ["o.......o", "oo.....oo", "ooo.o.ooo", ".ooooooo.", "..o...o.."];
      for (const [bx, by] of [[sx + sw - 120, sy + 60], [sx + sw - 70, sy + 100], [sx + 40, sy + 50]]) postcard.drawSprite(c, BAT, bx, by, 4, { o: "#14081f" });
    }
    if (card.kind === "newyear") {
      c.fillStyle = "#ff5a3a";
      c.beginPath();
      c.arc(cx, sy + sh - 70, 70, Math.PI, 0);
      c.fill();
      c.fillStyle = "#2a2a5a";
      c.beginPath();
      c.moveTo(sx, sy + sh - 40);
      c.lineTo(sx + 90, sy + sh - 110);
      c.lineTo(sx + 170, sy + sh - 40);
      c.lineTo(sx + 230, sy + sh - 90);
      c.lineTo(sx + sw, sy + sh - 30);
      c.lineTo(sx + sw, sy + sh);
      c.lineTo(sx, sy + sh);
      c.fill();
    }
    if ((card.kind === "raid" || card.kind === "open") && typeof MOTHERSHIP !== "undefined") postcard.drawSprite(c, MOTHERSHIP, cx - 96, sy + 20, 6, { ...pal, p: pal.y });
    if (card.kind === "open" || card.kind === "anniv") {
      // はなび
      for (const [fx, fy, col] of [[sx + 70, sy + 150, "#ff4fa3"], [sx + sw - 70, sy + 140, "#3ee8ff"], ...(card.kind === "anniv" ? [[cx, sy + 80, "#ffd84a"]] : [])]) {
        for (let a = 0; a < 12; a++) for (let r = 14; r < 46; r += 8) px(fx + Math.cos((a / 12) * Math.PI * 2) * r, fy + Math.sin((a / 12) * Math.PI * 2) * r, 4, col);
      }
      // かみふぶき
      for (let i = 0; i < 60; i++) px(sx + rand() * sw, sy + rand() * sh, rand() < 0.5 ? 4 : 3, RAINBOW[i % 5]);
    }
    if (card.kind === "christmas") {
      c.fillStyle = "#eef4ff";
      c.fillRect(sx, sy + sh - 30, sw, 30);
    }

    // ---------- ピクセ（いつもの すがた。かおと ポーズは かえない） ----------
    const scale = 13;
    const hat = ev?.hat && typeof wardrobe !== "undefined" ? wardrobe.hats()[ev.hat] : undefined;
    postcard.drawSprite(c, hat ? dress(NPC.idle, hat) : dress(NPC.idle), Math.round(W / 2 - 8 * scale), sy + sh - 16 * scale - 18, scale, pal);

    // キラキラ（きん・にじ・オープン・しゅうねん）
    if (tier === "gold" || tier === "rainbow" || ev?.holo) {
      const SPARK = ["..w..", "..w..", "wwyww", "..w..", "..w.."];
      for (let i = 0; i < 10; i++) postcard.drawSprite(c, SPARK, sx + 10 + rand() * (sw - 40), sy + 10 + rand() * (sh - 80), 3, { w: "#ffffff", y: pal.y });
    }
    if (card.kind === "christmas") for (let i = 0; i < 70; i++) px(sx + rand() * sw, sy + rand() * sh, rand() < 0.3 ? 5 : 3, "#ffffff");

    // とくべつな ひの リボン（その ひの なまえと とし）
    if (ev) {
      const label = card.kind === "anniv" ? `${card.n ?? 1}${["", "st", "nd", "rd"][card.n ?? 1] ?? "th"} ANNIVERSARY` : `${ev.name} ${yearOf(card)}`;
      c.fillStyle = ev.frame[1];
      c.fillRect(sx, sy + sh - 34, sw, 34);
      c.fillStyle = ev.frame[2];
      c.fillRect(sx, sy + sh - 34, sw, 3);
      c.font = '12px "Press Start 2P", monospace';
      c.textAlign = "center";
      c.textBaseline = "middle";
      c.fillStyle = ev.frame[0];
      c.fillText(label, W / 2 + 1, sy + sh - 15);
      c.fillStyle = card.kind === "newyear" ? "#a01a1a" : "#ffffff";
      c.fillText(label, W / 2, sy + sh - 16);
    }
    c.restore();
    c.strokeStyle = "#1a1433";
    c.lineWidth = 4;
    c.strokeRect(sx, sy, sw, sh);

    // ---------- もじ ----------
    c.textBaseline = "top";
    c.textAlign = "center";
    c.font = '16px "Press Start 2P", monospace';
    const dark = tier === "rainbow" || (ev && card.kind !== "newyear");
    if (dark) {
      c.fillStyle = "#1a1433";
      c.fillText("WARPIX CARD", W / 2 + 2, 22);
    }
    c.fillStyle = dark ? "#ffffff" : tier === "gold" ? "#5a3a00" : "#2b2f3a";
    c.fillText("WARPIX CARD", W / 2, 20);
    c.fillStyle = "#fff8e7";
    c.fillRect(sx, sy + sh + 14, sw, H - (sy + sh + 14) - 24);
    c.fillStyle = "#2b2f3a";
    c.font = '20px "DotGothic16", monospace';
    (card.line ?? "").split("\n").forEach((t, i) => c.fillText(t, W / 2, sy + sh + 32 + i * 30));
    c.font = '12px "Press Start 2P", monospace';
    c.fillStyle = "#8a7f68";
    const no = numberOf(card);
    c.textAlign = "left";
    if (no > 0) c.fillText(`No.${String(no).padStart(2, "0")}`, sx + 14, H - 58);
    c.textAlign = "right";
    c.fillText(card.date.replace(/-/g, "."), sx + sw - 14, H - 58);

    // ---------- ホロ：ななめの ひかりの おび（アプリの なかでは うごく） ----------
    if (tier === "gold" || tier === "rainbow" || ev?.holo) {
      c.save();
      c.globalCompositeOperation = "lighter";
      for (const [x0, w0, a] of [[60, 50, 0.16], [130, 14, 0.12], [300, 70, 0.14]]) slant(x0, w0, 0, H, 200, `rgba(255,248,230,${a})`);
      c.restore();
    }
    return cv;
  }

  // ---------- カードの うら（でる ときと、たなの まだ ない ばしょ） ----------
  let backUrl = null;
  function back() {
    if (backUrl) return backUrl;
    const cv = document.createElement("canvas");
    cv.width = W;
    cv.height = H;
    const c = cv.getContext("2d");
    c.fillStyle = "#ff4fa3";
    c.fillRect(0, 0, W, H);
    c.fillStyle = "#1a1433";
    c.fillRect(8, 8, W - 16, H - 16);
    c.fillStyle = "#2a2058";
    for (let y = 24; y < H - 16; y += 28) for (let x = 24 + ((y / 28) % 2) * 14; x < W - 16; x += 28) c.fillRect(x, y, 4, 4);
    c.strokeStyle = "#3ee8ff";
    c.lineWidth = 4;
    c.strokeRect(22, 22, W - 44, H - 44);
    const sil = NPC.idle.map((r) => r.replace(/[^.]/g, "s"));
    postcard.drawSprite(c, sil, W / 2 - 8 * 12, H / 2 - 150, 12, { s: "#3a2c78" });
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.font = '28px "Press Start 2P", monospace';
    c.fillStyle = "#1a1433";
    c.fillText("WARPIX", W / 2 + 3, H / 2 + 93);
    c.fillStyle = "#ffd84a";
    c.fillText("WARPIX", W / 2, H / 2 + 90);
    c.font = '16px "Press Start 2P", monospace';
    c.fillStyle = "#3ee8ff";
    c.fillText("CARD", W / 2, H / 2 + 130);
    backUrl = cv.toDataURL("image/png");
    return backUrl;
  }

  // ---------- ROOM の にっきの なか：コレクションの たな ----------
  const thumbs = new Map();
  const keyOf = (card) => `${card.date}:${card.kind}:${card.n ?? ""}:${card.tier ?? ""}`; // おなじ ひの 1・10 かいめが おなじ えに ならない ように n も（v1.52.1）
  function thumb(card) {
    if (!thumbs.has(keyOf(card))) {
      const small = document.createElement("canvas");
      small.width = 210;
      small.height = 294;
      small.getContext("2d").drawImage(draw(card), 0, 0, 210, 294);
      thumbs.set(keyOf(card), small.toDataURL("image/png"));
    }
    return thumbs.get(keyOf(card));
  }
  const dateOf = (card) => `${Number(card.date.slice(5, 7))}/${Number(card.date.slice(8, 10))}`;
  // ばんごうごとに いちばん あたらしい 1 まい と、もって いる かず
  function slots() {
    return ORDER.map((slot, i) => {
      const mine = state.list.filter((c) => slotOf(c) === slot);
      return { no: i + 1, card: mine[0] ?? null, count: mine.length };
    });
  }
  function shelf() {
    const body = document.getElementById("diary-body");
    body.querySelector(".cards")?.remove();
    if (!state.list.length) return;
    const all = slots();
    const have = all.filter((s) => s.card).length;
    const el = document.createElement("section");
    el.className = "cards";
    el.innerHTML = `<h3>WARPIX カード <span class="cards-count">${have} / ${ORDER.length}</span></h3>
      <div class="cards-list">${all
        .map((s) =>
          s.card
            ? `<button type="button" class="cards-btn tier-${s.card.tier ?? "event"}${isHolo(s.card) ? " holo" : ""}" data-no="${s.no}" aria-label="No.${pad2(s.no)}、${dateOf(s.card)} の WARPIX カード"><img src="${thumb(s.card)}" alt="" width="105" height="147">${s.count > 1 ? `<span class="cards-n">×${s.count}</span>` : ""}</button>`
            : `<span class="cards-btn cards-none" role="img" aria-label="No.${pad2(s.no)}、まだ ない カード"><img src="${back()}" alt="" width="105" height="147"><span class="cards-no">No.${pad2(s.no)}</span></span>`
        )
        .join("")}</div>`;
    el.addEventListener("click", (e) => {
      const b = e.target.closest("button.cards-btn");
      if (b) open(all[Number(b.dataset.no) - 1].card);
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
      holo: isHolo(card),
    });
    const note = await counter.note(card);
    if (note) postcard.note(note);
  }
  on("notebook-tab", ({ which }) => which === "diary" && shelf());

  return { state: () => state, draw, open, add, show, back, numberOf, rollTier, ORDER };
})();
