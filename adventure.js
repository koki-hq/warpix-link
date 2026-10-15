// ---------- PIXE ADVENTURE：ページそのものがステージになる ----------
// ピクセが箱から飛び出して、本物のリンクボタンやタイトルを足場にして跳びまわる。
// 足場は下からすり抜けられて、上からは乗れる（よくある「すり抜け床」）
const adventure = (() => {
  const SCALE = 2;
  const SIZE = 16 * SCALE;
  const STEP_MS = 1000 / 60;
  const GRAVITY = 0.5;
  const JUMP_V = -10.5;
  const ACCEL = 0.45;
  const MAX_VX = 3.2;
  const FRICTION = 0.78;
  const COIN_COUNT = 8;
  // 地面は「いちばん下の足場のすぐ下」。ジャンプ（約 110px）で必ず届くように
  const GROUND_GAP = 56;
  const PLATFORMS = ".pixel-btn:not([hidden]), .dialog, .npc-sprite, .title, .subtitle, .coin-slot";

  // ピクセの歩き・ジャンプのコマ（足だけ変える）
  const withFeet = (feet) => [...NPC.idle.slice(0, 14), feet, NPC.idle[15]];
  const FRAMES = {
    idle: NPC.idle,
    walk: withFeet("...oo......oo..."),
    jump: withFeet(".....oo..oo....."),
  };
  const COIN = [
    [
      "..yyyy..",
      ".yyyyyy.",
      "yywyyyyy",
      "yywyyyyy",
      "yywyyyyy",
      "yyyyyyyy",
      ".yyyyyy.",
      "..yyyy..",
    ],
    [
      "...yy...",
      "...yy...",
      "...wy...",
      "...wy...",
      "...wy...",
      "...yy...",
      "...yy...",
      "...yy...",
    ],
  ];
  const GOAL = [
    ".....yy.....",
    ".....yy.....",
    "....yyyy....",
    "yyyyyyyyyyyy",
    ".yyyyyyyyyy.",
    "..yyyywyyy..",
    "...yyyyyy...",
    "..yyyyyyyy..",
    "..yyy..yyy..",
    ".yy......yy.",
    "............",
    "............",
  ];

  let active = false;
  let raf = 0;
  let last = 0;
  let acc = 0;
  let frames = 0;
  let plats = [];
  let docW = 0;
  let docH = 0;
  let ground = 0;
  let groundEl = null;
  let screenRect = null;
  let hero = null;
  let coins = [];
  let enemies = [];
  let goal = null;
  let got = 0;
  let hud = null;
  let pad = null;
  let svgCache = {};
  const input = { left: false, right: false, down: false, jumpHeld: false, jumpPressed: false };

  const toClient = (x, y) => [x - scrollX, y - scrollY];
  const overlap = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

  const pageRect = (el) => {
    const r = el.getBoundingClientRect();
    return { el, x: r.left + scrollX, y: r.top + scrollY, w: r.width, h: r.height };
  };

  function collectPlatforms() {
    plats = [...document.querySelectorAll(PLATFORMS)].map(pageRect).filter((p) => p.w > 0 && p.h > 0);
    screenRect = pageRect(document.querySelector(".screen"));
    docW = document.documentElement.scrollWidth;
    docH = document.documentElement.scrollHeight;
    // 大きい画面だと中身が縦のまんなかに寄って、ページの底が遠くなる。地面はいちばん下の足場のすぐ下に置く
    const lowest = Math.max(...plats.map((p) => p.y + p.h));
    ground = Math.min(docH, lowest + GROUND_GAP);
    if (groundEl) {
      groundEl.style.width = `${docW}px`;
      place(groundEl, 0, ground);
    }
  }

  // ---------- 位置は「どの足場から何 px か」で覚える ----------
  // 画面サイズが変わったり、会話ウィンドウの高さが変わって足場が動いても、いっしょについていく
  const rectFor = (el) => (el === screenRect?.el ? screenRect : plats.find((p) => p.el === el));
  const anchorOf = (x, y, base) => ({ el: base.el, dx: x - base.x, dy: y - base.y });
  function fromAnchor(a) {
    const r = a && rectFor(a.el);
    return r ? [r.x + a.dx, r.y + a.dy] : null;
  }

  // 足場を測り直して、ピクセ・コイン・UFO・ゴールを付け直す
  function relayout() {
    collectPlatforms();
    const h = hero;
    const at = fromAnchor(h.anchor);
    if (at) [h.x, h.y] = at;
    h.x = Math.max(0, Math.min(docW - SIZE, h.x));
    h.y = Math.min(h.y, ground - SIZE);
    if (h.standing) h.standing = rectFor(h.standing.el) ?? null;
    for (const c of [...coins, goal].filter(Boolean)) {
      const pos = fromAnchor(c.anchor);
      if (!pos) continue;
      [c.x, c.y] = pos;
      place(c.el, c.x, c.y);
    }
    for (const e of enemies) {
      const np = rectFor(e.p.el);
      if (!np) continue;
      e.x = np.x + (e.x - e.p.x);
      e.p = np;
    }
  }

  function sprite(className, html) {
    const el = document.createElement("div");
    el.className = className;
    el.innerHTML = html;
    document.body.append(el);
    return el;
  }

  const place = (el, x, y) => (el.style.translate = `${Math.round(x)}px ${Math.round(y)}px`);

  // ---------- 準備 ----------
  function spawnCoins() {
    const spots = plats.filter((p) => !p.el.matches(".npc-sprite"));
    // 足場をシャッフルして、上に1枚ずつ置いていく
    for (let i = spots.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [spots[i], spots[j]] = [spots[j], spots[i]];
    }
    coins = Array.from({ length: COIN_COUNT }, (_, i) => {
      const p = spots[i % spots.length];
      const x = p.x + 16 + Math.random() * Math.max(0, p.w - 48);
      const y = p.y - 44;
      const el = sprite("adv-coin", `<span>${pixelSvg(COIN[0])}</span><span>${pixelSvg(COIN[1])}</span>`);
      place(el, x, y);
      return { el, x, y, w: 16, h: 16, anchor: anchorOf(x, y, p) };
    });
  }

  function spawnEnemies() {
    const spots = plats.filter((p) => p.el.matches(".pixel-btn") && p.w > 120);
    enemies = [];
    for (let i = 0; i < 2 && spots.length; i++) {
      const p = spots.splice(Math.floor(Math.random() * spots.length), 1)[0];
      const el = sprite("adv-enemy", pixelSvg(ufoLook));
      enemies.push({ el, p, x: p.x + p.w / 2, y: p.y - 12, w: 24, h: 12, dir: Math.random() < 0.5 ? -1 : 1, alive: true });
    }
  }

  function spawnGoal() {
    const title = plats.find((p) => p.el.matches(".title"));
    const x = title ? title.x + title.w / 2 - 12 : docW / 2;
    const y = title ? title.y - 40 : 40;
    const el = sprite("adv-goal", pixelSvg(GOAL));
    place(el, x, y);
    goal = { el, x, y, w: 24, h: 24, anchor: title ? anchorOf(x, y, title) : null };
    sound.sfx.powerup();
    npc.say(["コイン コンプリート！\nタイトルの うえに ゴールが でたよ！"]);
  }

  function buildHud() {
    hud = document.createElement("div");
    hud.className = "adv-hud";
    hud.innerHTML = `<span class="adv-coins"></span><span class="adv-time"></span><button type="button" class="adv-exit">✕ もどる</button>`;
    hud.querySelector(".adv-exit").addEventListener("click", () => exit(false));
    document.body.append(hud);

    // タッチ端末用のボタン
    pad = document.createElement("div");
    pad.className = "adv-pad";
    pad.innerHTML = `
      <div><button type="button" data-k="left" aria-label="ひだり">◀</button><button type="button" data-k="right" aria-label="みぎ">▶</button></div>
      <div><button type="button" data-k="down" aria-label="おりる">▼</button><button type="button" data-k="jump" class="adv-a" aria-label="ジャンプ">A</button></div>`;
    pad.querySelectorAll("button").forEach((b) => {
      const k = b.dataset.k;
      const down = (e) => {
        e.preventDefault();
        if (k === "jump") {
          input.jumpPressed = true;
          input.jumpHeld = true;
        } else input[k] = true;
      };
      const up = () => (k === "jump" ? (input.jumpHeld = false) : (input[k] = false));
      b.addEventListener("pointerdown", down);
      ["pointerup", "pointercancel", "pointerleave"].forEach((t) => b.addEventListener(t, up));
    });
    document.body.append(pad);
  }

  const fmtTime = (t) => {
    const m = Math.floor(t / 60);
    const s = (t % 60).toFixed(1).padStart(4, "0");
    return `${String(m).padStart(2, "0")}:${s}`;
  };

  function renderHud() {
    hud.querySelector(".adv-coins").textContent = `COIN ${got}/${COIN_COUNT}`;
    hud.querySelector(".adv-time").textContent = fmtTime(frames / 60);
  }

  // ---------- 1フレームの更新 ----------
  function update() {
    frames++;
    if (frames % 30 === 0) relayout();
    const h = hero;

    // 横移動
    if (input.left) h.vx -= ACCEL;
    if (input.right) h.vx += ACCEL;
    if (!input.left && !input.right) h.vx *= FRICTION;
    h.vx = Math.max(-MAX_VX, Math.min(MAX_VX, h.vx));
    if (Math.abs(h.vx) < 0.05) h.vx = 0;
    if (h.vx) h.facing = Math.sign(h.vx);

    // ジャンプ（少し早押し・少し遅押しでも跳べるようにする）
    if (input.jumpPressed) {
      h.buffer = 6;
      input.jumpPressed = false;
    }
    if (h.buffer > 0) h.buffer--;
    h.coyote = h.onGround ? 6 : Math.max(0, h.coyote - 1);
    if (h.buffer > 0 && h.coyote > 0) {
      h.vy = JUMP_V;
      h.onGround = false;
      h.coyote = 0;
      h.buffer = 0;
      jumpSound();
    }
    // ボタンを早く離すと低いジャンプ
    if (!input.jumpHeld && h.vy < -4) h.vy = -4;

    // ▼ で今いる足場から下りる（しばらくその足場には乗らない）
    if (input.down && h.onGround && h.standing) {
      h.dropEl = h.standing.el;
      h.dropTimer = 12;
    }
    if (h.dropTimer > 0) h.dropTimer--;

    h.vy = Math.min(h.vy + GRAVITY, 12);
    h.x = Math.max(0, Math.min(docW - SIZE, h.x + h.vx));
    const prevBottom = h.y + SIZE;
    h.y += h.vy;

    // 着地（足場の上から落ちてきたときだけ乗る）
    const wasOnGround = h.onGround;
    h.onGround = false;
    if (h.vy >= 0) {
      for (const p of plats) {
        if (h.dropTimer > 0 && p.el === h.dropEl) continue;
        const feetL = h.x + 8;
        const feetR = h.x + SIZE - 8;
        if (feetR > p.x && feetL < p.x + p.w && prevBottom <= p.y + 0.5 && h.y + SIZE >= p.y) {
          if (!wasOnGround && h.vy > 7) bump(p);
          h.y = p.y - SIZE;
          h.vy = 0;
          h.onGround = true;
          h.standing = p;
          break;
        }
      }
    }
    if (!h.onGround) h.standing = null;
    if (h.y + SIZE >= ground) {
      h.y = ground - SIZE;
      h.vy = 0;
      h.onGround = true;
    }
    if (h.y < 0) {
      h.y = 0;
      h.vy = 0;
    }
    if (h.inv > 0) h.inv--;

    const box = { x: h.x + 6, y: h.y + 4, w: SIZE - 12, h: SIZE - 4 };

    // コイン
    for (const c of coins) {
      if (c.got || !overlap(box, c)) continue;
      c.got = true;
      c.el.remove();
      got++;
      sound.sfx.coin();
      score.add(100, ...toClient(c.x + 8, c.y));
      if (got === COIN_COUNT) spawnGoal();
    }

    // 敵（UFO）：上から踏むと倒せる、横から当たるとはじかれる
    for (const e of enemies) {
      if (!e.alive) continue;
      e.x += e.dir * 0.7;
      if (e.x < e.p.x || e.x + e.w > e.p.x + e.p.w) e.dir *= -1;
      e.x = Math.max(e.p.x, Math.min(e.p.x + e.p.w - e.w, e.x));
      e.y = e.p.y - e.h - 2 + (Math.floor(frames / 15) % 2) * 2;
      place(e.el, e.x, e.y);
      if (!overlap(box, e)) continue;
      if (h.vy > 0 && h.y + SIZE - e.y < 14) {
        e.alive = false;
        e.el.innerHTML = pixelSvg(BOOM);
        e.el.classList.add("boom");
        setTimeout(() => e.el.remove(), 300);
        h.vy = -7;
        sound.sfx.hit();
        score.add(200, ...toClient(e.x + 12, e.y));
        emit("stomp");
      } else if (h.inv === 0) {
        h.vx = h.x + SIZE / 2 < e.x + e.w / 2 ? -6 : 6;
        h.vy = -5;
        h.inv = 60;
        sound.sfx.damage();
        npc.say(["いてっ！ UFOは うえから\nふんづけるんだ！"]);
      }
    }

    if (goal && overlap(box, goal)) return clear();
    // 今いる足場（空中なら中身の枠）からの位置を覚えておく
    h.anchor = anchorOf(h.x, h.y, h.standing ?? screenRect);
    follow();
  }

  function jumpSound() {
    // 専用の音がないので、短い上昇音で代用
    sound.sfx.shoot();
  }

  // 勢いよく着地したボタンはへこむ
  function bump(p) {
    if (!p.el.matches(".pixel-btn, .coin-slot")) return;
    p.el.classList.add("bumped");
    sound.sfx.hover();
    setTimeout(() => p.el.classList.remove("bumped"), 120);
  }

  // 画面からはみ出しそうになったらスクロールして追いかける
  function follow() {
    const top = hero.y - scrollY;
    if (top < 100) scrollTo(scrollX, hero.y - 100);
    else if (top > innerHeight - 180) scrollTo(scrollX, hero.y - innerHeight + 180);
  }

  function draw() {
    const h = hero;
    const frame = !h.onGround ? "jump" : h.vx && Math.floor(frames / 8) % 2 ? "walk" : "idle";
    if (h.frame !== frame) {
      h.frame = frame;
      h.el.innerHTML = svgCache[frame];
    }
    place(h.el, h.x, h.y);
    h.el.style.scale = h.facing < 0 ? "-1 1" : "1 1";
    h.el.style.visibility = h.inv && Math.floor(h.inv / 5) % 2 ? "hidden" : "visible";
    renderHud();
  }

  function loop(t) {
    raf = requestAnimationFrame(loop);
    if (!last) last = t;
    acc += Math.min(t - last, 100);
    last = t;
    while (acc >= STEP_MS && active) {
      update();
      acc -= STEP_MS;
    }
    if (active) draw();
  }

  // ---------- 入力 ----------
  const KEYS = {
    ArrowLeft: "left", a: "left", A: "left",
    ArrowRight: "right", d: "right", D: "right",
    ArrowDown: "down", s: "down", S: "down",
    ArrowUp: "jump", w: "jump", W: "jump", " ": "jump", z: "jump", Z: "jump",
  };
  addEventListener("keydown", (e) => {
    if (!active) return;
    if (e.key === "Escape") return exit(false);
    const k = KEYS[e.key];
    if (!k) return;
    e.preventDefault();
    if (k === "jump") {
      if (!e.repeat) input.jumpPressed = true;
      input.jumpHeld = true;
    } else input[k] = true;
  });
  addEventListener("keyup", (e) => {
    const k = KEYS[e.key];
    if (!k) return;
    if (k === "jump") input.jumpHeld = false;
    else input[k] = false;
  });
  addEventListener("resize", () => active && relayout());
  document.addEventListener("visibilitychange", () => {
    if (!active) return;
    if (document.hidden) cancelAnimationFrame(raf);
    else {
      last = 0;
      raf = requestAnimationFrame(loop);
    }
  });

  // ---------- 開始・終了 ----------
  function start() {
    if (active || playing() || npc.isAway()) return;
    active = true;
    document.body.classList.add("adventuring");
    Object.assign(input, { left: false, right: false, down: false, jumpHeld: false, jumpPressed: false });
    groundEl = sprite("adv-ground", "");
    collectPlatforms();

    const frame = (rows) => pixelSvg(dress(rows));
    svgCache = { idle: frame(FRAMES.idle), walk: frame(FRAMES.walk), jump: frame(FRAMES.jump) };
    const home = plats.find((p) => p.el.matches(".npc-sprite"));
    hero = {
      el: sprite("adv-hero", ""),
      x: home ? home.x + (home.w - SIZE) / 2 : 40,
      y: home ? home.y + home.h - SIZE : 40,
      vx: 1.5,
      vy: -8,
      facing: 1,
      onGround: false,
      standing: null,
      coyote: 0,
      buffer: 0,
      inv: 0,
      dropEl: null,
      dropTimer: 0,
      frame: null,
    };
    hero.anchor = anchorOf(hero.x, hero.y, screenRect);
    npc.setAway(true);
    got = 0;
    frames = 0;
    goal = null;
    spawnCoins();
    spawnEnemies();
    buildHud();
    jumpSound();
    const touch = matchMedia("(pointer: coarse)").matches;
    npc.say([
      "いってきまーす！",
      touch
        ? "コインを 8まい あつめてね！\nしたの ボタンで うごかしてね。"
        : "コインを 8まい あつめてね！\n←→で いどう、スペースで ジャンプ。",
      "▼(↓)で あしばから おりられるよ。\nUFOは うえから ふんづけて！",
    ]);
    last = 0;
    acc = 0;
    raf = requestAnimationFrame(loop);
    emit("adventure-start");
  }

  function cleanup() {
    active = false;
    cancelAnimationFrame(raf);
    [hero?.el, hud, pad, groundEl, goal?.el, ...coins.map((c) => c.el), ...enemies.map((e) => e.el)].forEach((el) => el?.remove());
    groundEl = null;
    coins = [];
    enemies = [];
    goal = null;
    hero = null;
    document.body.classList.remove("adventuring");
    npc.setAway(false);
  }

  function exit(cleared) {
    if (!active) return;
    cleanup();
    if (!cleared) npc.say(["ただいま！\nまた いっしょに ぼうけん しようね。"]);
  }

  function clear() {
    const time = frames / 60;
    const best = store.get("warpix-adv-best", null);
    const isBest = best === null || time < best;
    if (isBest) store.set("warpix-adv-best", time);
    cleanup();
    sound.sfx.fanfare();
    stars.warp(1500);
    // 速いほどボーナス（60秒をこえたら 0）
    const bonus = 3000 + Math.max(0, Math.round((60 - time) * 50));
    score.add(bonus, innerWidth / 2, innerHeight / 3);
    npc.jump();
    npc.say([
      `ゴール！ タイム ${fmtTime(time)}`,
      isBest ? "じこベスト こうしん！\nぼうけんって たのしいね！" : `ベストは ${fmtTime(best)}。\nつぎは もっと はやく いけるかも！`,
    ]);
    emit("adventure-clear", { time, best: isBest });
  }

  return { start, exit, isActive: () => active, fmtTime };
})();
