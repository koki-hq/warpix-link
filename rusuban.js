// ---------- ピクセの おるすばん：しばらく るすにして もどると、るすばん中に つくった「え」と「きょく」を くれる ----------
// 3 時間いじょう あいだが あいたら（ページを とじていても、タブを うらに していても）、あいさつの あとに そっと見せる。
// え は その日と まった時間から きまる（同じ おみやげは いつも同じ え）。きょくは ピクセの 自動作曲。
// ?away=分 を付けると、そのぶん まっていたことにして すぐ見られる。
const rusuban = (() => {
  const SEEN_KEY = "warpix-lastseen";
  const KEY = "warpix-rusuban";
  const MIN_AWAY = 180; // 分
  const W = 64;
  const H = 48;
  const params = new URLSearchParams(location.search);
  const forced = /^\d{1,5}$/.test(params.get("away") ?? "") ? Number(params.get("away")) : null;
  const preview = params.has("date") || forced !== null;

  // ---------- るすの時間をはかる ----------
  const prevSeen = Number(store.get(SEEN_KEY, 0)) || 0;
  const touch = () => !preview && store.set(SEEN_KEY, Date.now());
  touch();
  setInterval(() => !document.hidden && touch(), 60000);
  addEventListener("pagehide", touch);
  let hiddenAt = 0;
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      hiddenAt = Date.now();
      touch();
      return;
    }
    touch();
    const mins = hiddenAt ? (Date.now() - hiddenAt) / 60000 : 0;
    if (mins >= MIN_AWAY && document.body.classList.contains("booted")) offer(Math.round(mins));
  });

  // ---------- きまった乱数（同じ たねなら 同じ え） ----------
  function rng(seed) {
    let a = seed >>> 0;
    return () => {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // ---------- え：ピクセが クレヨンで かいた ドット絵 ----------
  // [名前, かきかた]。かきかたは (c, r, pal) で 64x48 に かく
  const pick = (r, list) => list[Math.floor(r() * list.length)];
  function sprite(c, rows, x, y, pal, r, scale = 1) {
    rows.forEach((row, j) => {
      const wob = r() < 0.18 ? (r() < 0.5 ? -1 : 1) : 0; // クレヨンなので、ときどき 1 マス ずれる
      [...row].forEach((ch, i) => {
        const col = ch === "#" ? pal.p : pal[ch];
        if (!col) return;
        c.fillStyle = col;
        c.fillRect(x + (i + wob) * scale, y + j * scale, scale, scale);
      });
    });
  }
  const SUBJECTS = [
    ["ぼくの じがぞう", (c, r, pal) => sprite(c, NPC.idle, 24, 12, pal, r, 1)],
    ["UFOと ぼく", (c, r, pal) => {
      sprite(c, UFO, 8 + Math.floor(r() * 30), 4, pal, r, 1);
      sprite(c, NPC.idle, 34, 22, pal, r, 1);
    }],
    ["ねむい ぼく", (c, r, pal) => {
      sprite(c, NPC.blink, 24, 18, pal, r, 1);
      c.fillStyle = pal.c;
      for (const [x, y, s] of [[42, 12, 3], [47, 7, 4], [53, 2, 5]]) {
        c.fillRect(x, y, s, 1);
        for (let i = 1; i < s - 1; i++) c.fillRect(x + s - 1 - i, y + i, 1, 1);
        c.fillRect(x, y + s - 1, s, 1);
      }
    }],
    ["おおきな おつきさま", (c, r, pal) => {
      const cx = 32 + Math.floor(r() * 10) - 5;
      c.fillStyle = pal.y;
      for (let y = -11; y <= 11; y++) for (let x = -11; x <= 11; x++) if (x * x + y * y <= 121 + r() * 8) c.fillRect(cx + x, 18 + y, 1, 1);
      c.fillStyle = pal.k;
      for (let i = 0; i < 4; i++) c.fillRect(cx - 6 + Math.floor(r() * 12), 12 + Math.floor(r() * 12), 2, 2);
      sprite(c, NPC.idle, 4, 30, pal, r, 1);
    }],
    ["ながれぼしの よる", (c, r, pal) => {
      for (let k = 0; k < 3; k++) {
        const x0 = 10 + Math.floor(r() * 40);
        const y0 = 2 + Math.floor(r() * 12);
        for (let i = 0; i < 9; i++) {
          c.fillStyle = i < 2 ? pal.w : i < 5 ? pal.c : pal.v;
          c.fillRect(x0 - i, y0 + Math.floor(i / 2), 1, 1);
        }
      }
      sprite(c, NPC.idle, 40, 26, pal, r, 1);
    }],
    ["きみの すきな せかい", (c, r, pal) => {
      sprite(c, ICONS[favoriteIcon()], 16, 14, pal, r, 2);
      sprite(c, NPC.idle, 44, 28, pal, r, 1);
      c.fillStyle = pal.p;
      for (const [x, y] of [[12, 8], [44, 6], [50, 14]]) c.fillRect(x, y, 2, 2);
    }],
  ];

  // いちばん よく行くリンクの アイコン名（まだなければ null）
  function favoriteIcon() {
    const stats = store.get("warpix-links", {}) ?? {};
    return Object.entries(stats).sort((a, b) => (b[1]?.n ?? 0) - (a[1]?.n ?? 0))[0]?.[0] ?? null;
  }

  function palette() {
    const css = getComputedStyle(document.body);
    const v = (n) => css.getPropertyValue(n).trim();
    return { o: "#000000", w: v("--fg"), p: v("--accent"), c: v("--accent-2"), y: v("--gold"), k: v("--pumpkin"), v: v("--muted"), bg: v("--bg"), grid: v("--bg-grid") };
  }

  // たね → [え の canvas, だいめい]
  function draw(seed) {
    const r = rng(seed);
    const pal = palette();
    const cv = document.createElement("canvas");
    cv.width = W;
    cv.height = H;
    const c = cv.getContext("2d");
    c.fillStyle = pal.bg;
    c.fillRect(0, 0, W, H);
    c.fillStyle = pal.w;
    for (let i = 0; i < 14; i++) c.fillRect(Math.floor(r() * W), Math.floor(r() * 30), 1, 1);
    // じめん（でこぼこ）
    c.fillStyle = pick(r, [pal.grid, pal.v]);
    let gy = 40;
    for (let x = 0; x < W; x++) {
      if (r() < 0.25) gy = Math.max(37, Math.min(43, gy + (r() < 0.5 ? -1 : 1)));
      c.fillRect(x, gy, 1, H - gy);
    }
    // すきな リンクが まだ ないうちは、その え は かかない
    const [title, paint] = pick(r, ICONS[favoriteIcon()] ? SUBJECTS : SUBJECTS.slice(0, -1));
    paint(c, r, pal);
    // がくぶち と、すみっこの ハート（ピクセの サイン）
    c.fillStyle = pal.y;
    c.fillRect(0, 0, W, 1);
    c.fillRect(0, H - 1, W, 1);
    c.fillRect(0, 0, 1, H);
    c.fillRect(W - 1, 0, 1, H);
    c.fillStyle = pal.p;
    for (const [x, y, w] of [[57, 42, 1], [59, 42, 1], [56, 43, 5], [57, 44, 3], [58, 45, 1]]) c.fillRect(x, y, w, 1);
    return [cv, title];
  }

  // ---------- おみやげ ----------
  const fmtAway = (mins) => {
    const h = Math.floor(mins / 60);
    const d = Math.floor(h / 24);
    if (d >= 1) return `${d}にち ${h % 24}じかん`;
    return `${h}じかん ${mins % 60}ふん`;
  };

  function makeGift(mins) {
    const d = today();
    const seed = (d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate()) * 7 + Math.floor(mins / 30);
    return { seed, mins, code: composer.make(), date: d.toISOString().slice(0, 10) };
  }

  let dialog = null;
  let wasPlaying = false;
  let listening = false;

  function stopListening() {
    if (!listening) return;
    listening = false;
    composer.restore(wasPlaying);
  }

  function show(gift) {
    const [cv, title] = draw(gift.seed);
    const song = composer.titleOf(gift.code);
    dialog?.remove();
    dialog = document.createElement("dialog");
    dialog.className = "rusuban";
    dialog.setAttribute("aria-labelledby", "rusuban-title");
    dialog.innerHTML = `
      <div class="rusuban-box">
        <h2 id="rusuban-title">おるすばん レポート</h2>
        <p class="rusuban-away">まってた じかん：<b>${fmtAway(gift.mins)}</b></p>
        <figure class="rusuban-art">
          <img alt="ピクセが クレヨンで かいた え「${title}」" width="${W * 4}" height="${H * 4}">
          <figcaption>え「${title}」</figcaption>
        </figure>
        <ul class="rusuban-stats">
          <li>かぞえた ほし：${(gift.mins * 3).toLocaleString("ja-JP")}こ</li>
          <li>うたた ねした かいすう：${Math.max(1, Math.floor(gift.mins / 90))}かい</li>
          <li>つくった きょく：『${song}』</li>
        </ul>
        <div class="rusuban-row">
          <button type="button" class="c-btn c-main rusuban-play">▶ きく</button>
          <button type="button" class="c-btn rusuban-shelf">たなに しまう</button>
          <a class="c-btn rusuban-save" download="warpix-pixe-art-${gift.date}.png">えを ほぞん</a>
          <button type="button" class="c-btn rusuban-close">とじる</button>
        </div>
        <p class="rusuban-msg" aria-live="polite"></p>
      </div>`;
    const img = dialog.querySelector("img");
    const url = cv.toDataURL("image/png");
    img.src = url;
    const save = dialog.querySelector(".rusuban-save");
    save.href = url;
    cv.toBlob((blob) => blob && postcard.saveLink(save, blob, save.getAttribute("download")), "image/png");
    const msg = dialog.querySelector(".rusuban-msg");
    const play = dialog.querySelector(".rusuban-play");
    play.addEventListener("click", () => {
      if (listening) {
        stopListening();
        play.textContent = "▶ きく";
        return;
      }
      wasPlaying = sound.playing();
      listening = true;
      composer.play(gift.code);
      play.textContent = "■ とめる";
    });
    dialog.querySelector(".rusuban-shelf").addEventListener("click", () => {
      const res = composer.shelve(gift.code);
      msg.textContent = res === "ok" ? `ピクセ「『${song}』を たなに しまったよ。♪ から いつでも きけるよ。」` : res === "dup" ? "ピクセ「もう たなに あるよ。」" : "ピクセ「たなが いっぱい。♪ の たなから ひとつ だしてね。」";
    });
    dialog.querySelector(".rusuban-close").addEventListener("click", () => dialog.close());
    dialog.addEventListener("click", (e) => e.target === dialog && dialog.close());
    dialog.addEventListener("close", () => {
      stopListening();
      dialog.remove();
      dialog = null;
    });
    document.body.append(dialog);
    dialog.showModal();
    sound.sfx.fanfare();
    achievements.unlock("rusuban");
    grow.write("rusuban", `るすばんの あいだに え「${title}」と きょく『${song}』を つくった。`);
    return { title, song };
  }

  // あいさつの あとに「おみやげ あるよ」と聞く
  function offer(mins) {
    if (simple.on) return;
    const gift = makeGift(mins);
    lastGift = gift;
    if (!preview) store.set(KEY, gift);
    giftBtn.hidden = false;
    const wait = () => {
      if (!npc.ready() || playing() || npc.isAway() || document.querySelector("dialog[open]")) return setTimeout(wait, 1500);
      // 1 かい ひらいて 1 つ まで（v1.52）。ほかの 話が さきなら きかない（おみやげは ROOM に かざって ある）
      // おみやげが ある のは まえに きた 人 だけ なので、はじめての 日の しばりは いらない
      if (!npc.turn({ evenFirst: true })) return;
      npc.ask(`おかえり！ ${fmtAway(mins)}\nまってたよ。おみやげ あるんだ。`, ["みる！", "あとで"]).then((i) => {
        if (i === 0) show(gift);
        else if (i === 1) npc.say(["じゃあ おへやに かざっておくね。\n（ROOM の「おみやげ」から みられるよ）"]);
      });
    };
    setTimeout(wait, 1500);
  }

  addEventListener("keydown", (e) => e.key === "Escape" && dialog?.open && dialog.close());

  // おへやの「おみやげ」から、いちばん新しい おみやげを もう一度 見られる
  const giftBtn = document.getElementById("gift-btn");
  let lastGift = store.get(KEY, null);
  giftBtn.hidden = !lastGift;
  giftBtn.addEventListener("click", () => {
    if (!lastGift) return;
    document.getElementById("diary").close();
    show(lastGift);
  });

  on("boot", () => {
    const mins = forced ?? (prevSeen ? Math.round((Date.now() - prevSeen) / 60000) : 0);
    if (mins >= MIN_AWAY) offer(mins);
  });

  return { draw, show, offer, last: () => lastGift, MIN_AWAY };
})();
