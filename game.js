// ---------- ミニゲーム「PIXE INVADERS」 ----------
// 160x144（ゲームボーイと同じ解像度）で描いて、CSSで整数倍に拡大する
const game = (() => {
  const W = 160;
  const H = 144;
  const STEP_MS = 1000 / 60;
  const PLAYER_Y = 126;

  const overlay = document.getElementById("game");
  const canvas = document.getElementById("game-canvas");
  const closeBtn = document.getElementById("game-close");
  const c = canvas.getContext("2d");
  canvas.width = W;
  canvas.height = H;

  const SHIP = [
    "...pp...",
    "...ww...",
    "..wwww..",
    ".wowwow.",
    ".wwwwww.",
    "wwpwwpww",
    "w.wwww.w",
    "..c..c..",
  ];
  const INVADER = [
    [
      "..cccc..",
      ".cccccc.",
      "wwwwwwww",
      "wpwwwwpw",
      ".wwwwww.",
      ".w....w.",
    ],
    [
      "..cccc..",
      ".cccccc.",
      "wwwwwwww",
      "wwpwwpww",
      ".wwwwww.",
      "w......w",
    ],
  ];
  const BURST = [
    "p..p..p.",
    ".p.w.p..",
    "..www...",
    "pwwpwwp.",
    "..www...",
    ".p.w.p..",
    "p..p..p.",
    "........",
  ];
  const HEART = [
    "pp.pp",
    "ppppp",
    ".ppp.",
    "..p..",
  ];

  // スプライトは開くたびに今の配色（CSS変数）で作り直す
  let sprites = {};
  let colors = {};
  function buildSprites() {
    const css = getComputedStyle(document.body);
    const v = (name) => css.getPropertyValue(name).trim();
    colors = { o: v("--shadow"), w: v("--fg"), p: v("--accent"), c: v("--accent-2"), bg: v("--bg"), muted: v("--muted") };
    const make = (rows) => {
      const cv = document.createElement("canvas");
      cv.width = rows[0].length;
      cv.height = rows.length;
      const cx = cv.getContext("2d");
      rows.forEach((row, y) =>
        [...row].forEach((ch, x) => {
          if (!colors[ch]) return;
          cx.fillStyle = colors[ch];
          cx.fillRect(x, y, 1, 1);
        })
      );
      return cv;
    };
    sprites = {
      ship: make(SHIP),
      invader: INVADER.map(make),
      burst: make(BURST),
      heart: make(HEART),
      boss: make(MOTHERSHIP),
    };
  }

  const keys = new Set();
  let target = null;
  let st = null;
  let running = false;
  let raf = 0;
  let last = 0;
  let acc = 0;
  let paid = false;
  let demo = false; // だれも操作しないデモプレイ
  // デモ中は効果音を鳴らさない
  const sfx = (name) => !demo && sound.sfx[name]();

  const bgStars = Array.from({ length: 40 }, () => ({
    x: Math.floor(Math.random() * W),
    y: Math.random() * H,
    s: Math.random() < 0.3 ? 0.5 : 0.2,
  }));

  function spawnWave(wave) {
    const list = [];
    for (let r = 0; r < 3; r++) {
      for (let col = 0; col < 6; col++) {
        list.push({ x: 22 + col * 20, y: 18 + r * 12 + Math.min(wave - 1, 4) * 2, row: r, alive: true });
      }
    }
    return list;
  }

  function reset() {
    st = {
      score: 0,
      lives: 3,
      wave: 1,
      px: 76,
      inv: 0,
      bullets: [],
      ebullets: [],
      enemies: spawnWave(1),
      boss: null,
      dir: 1,
      stepTimer: 0,
      anim: 0,
      fireCd: 30,
      bursts: [],
      phase: "ready",
      phaseTimer: 90,
    };
    paid = false;
  }

  const hit = (ax, ay, aw, ah, bx, by, bw, bh) => ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;

  function payout() {
    if (demo || paid || !st || st.score === 0) return;
    paid = true;
    emit("game-over", { score: st.score, wave: st.wave });
    score.add(st.score, innerWidth / 2, innerHeight / 3);
  }

  function update() {
    for (const s of bgStars) {
      s.y += s.s;
      if (s.y > H) s.y = 0;
    }
    st.bursts = st.bursts.filter((b) => --b.t > 0);

    if (st.phase === "ready" || st.phase === "clear") {
      if (--st.phaseTimer <= 0) {
        if (st.phase === "clear") {
          st.wave++;
          // 3 ウェーブごとに、ふつうの敵の代わりにボス
          const bossWave = st.wave % 3 === 0;
          st.enemies = bossWave ? [] : spawnWave(st.wave);
          st.boss = bossWave ? { x: 56, y: 16, w: 48, h: 20, hp: 20 + st.wave * 2, max: 20 + st.wave * 2, dir: 1, fireCd: 70, flash: 0 } : null;
          st.dir = 1;
          st.ebullets = [];
          st.phase = "ready";
          st.phaseTimer = 60;
        } else {
          st.phase = "play";
        }
      }
      return;
    }
    if (st.phase === "over") {
      st.phaseTimer--;
      if (demo && st.phaseTimer < -90) reset();
      return;
    }

    if (demo) autopilot();

    // 自機の移動
    if (keys.has("left")) st.px -= 1.6;
    if (keys.has("right")) st.px += 1.6;
    if (target !== null) {
      const d = target - st.px;
      st.px += Math.max(-2.5, Math.min(2.5, d));
    }
    st.px = Math.max(2, Math.min(W - 10, st.px));
    if (st.inv > 0) st.inv--;

    // オートショット
    if (--st.fireCd <= 0 && st.bullets.length < 3) {
      st.bullets.push({ x: Math.round(st.px) + 3, y: PLAYER_Y - 3 });
      st.fireCd = 16;
      sfx("shoot");
    }

    // ボス：左右に動きながら、扇形に 3 発ずつ撃つ
    const boss = st.boss;
    if (boss) {
      boss.x += boss.dir * (0.5 + st.wave * 0.05);
      if (boss.x < 4 || boss.x + boss.w > W - 4) boss.dir *= -1;
      if (boss.flash > 0) boss.flash--;
      if (--boss.fireCd <= 0) {
        boss.fireCd = Math.max(36, 80 - st.wave * 4);
        for (const vx of [-0.6, 0, 0.6]) st.ebullets.push({ x: boss.x + boss.w / 2, y: boss.y + boss.h, v: 1.1 + st.wave * 0.05, vx });
      }
    }

    // 敵の行進（残りが少ないほど速くなる）
    const alive = st.enemies.filter((e) => e.alive);
    const interval = Math.max(3, 28 - (18 - alive.length) * 1.4 - st.wave * 2);
    if (alive.length && ++st.stepTimer >= interval) {
      st.stepTimer = 0;
      st.anim ^= 1;
      const minX = Math.min(...alive.map((e) => e.x));
      const maxX = Math.max(...alive.map((e) => e.x));
      if ((st.dir > 0 && maxX + 10 > W - 4) || (st.dir < 0 && minX - 2 < 4)) {
        st.dir *= -1;
        alive.forEach((e) => (e.y += 4));
      } else {
        alive.forEach((e) => (e.x += 2 * st.dir));
      }
      if (Math.random() < 0.25 + st.wave * 0.05) {
        const shooter = alive[Math.floor(Math.random() * alive.length)];
        st.ebullets.push({ x: shooter.x + 4, y: shooter.y + 6, v: 1 + st.wave * 0.15 });
      }
    }

    // 自機の弾
    for (const b of st.bullets) {
      b.y -= 3;
      if (boss && boss.hp > 0 && hit(b.x, b.y, 1, 3, boss.x, boss.y, boss.w, boss.h)) {
        b.y = -10;
        boss.hp--;
        boss.flash = 6;
        st.score += 10 * st.wave;
        sfx("hit");
        if (boss.hp <= 0) {
          for (let i = 0; i < 5; i++) st.bursts.push({ x: boss.x + i * 10, y: boss.y + (i % 2) * 8, t: 24 });
          st.score += 500 * st.wave;
          sfx("boom");
          if (!demo) emit("game-boss", { wave: st.wave });
        }
        continue;
      }
      for (const e of alive) {
        if (e.alive && hit(b.x, b.y, 1, 3, e.x, e.y, 8, 6)) {
          e.alive = false;
          b.y = -10;
          st.score += (3 - e.row) * 10 * st.wave;
          st.bursts.push({ x: e.x, y: e.y - 1, t: 12 });
          sfx("hit");
          break;
        }
      }
    }
    st.bullets = st.bullets.filter((b) => b.y > -4);

    // 敵の弾
    for (const b of st.ebullets) {
      b.y += b.v;
      b.x += b.vx ?? 0;
      if (st.inv === 0 && hit(b.x, b.y, 1, 3, st.px, PLAYER_Y, 8, 8)) {
        b.y = H + 10;
        st.lives--;
        st.inv = 90;
        st.bursts.push({ x: st.px, y: PLAYER_Y, t: 20 });
        sfx("damage");
        if (st.lives <= 0) return gameOver();
      }
    }
    st.ebullets = st.ebullets.filter((b) => b.y < H);

    if (alive.some((e) => e.alive && e.y + 6 >= PLAYER_Y)) return gameOver();

    if (boss ? boss.hp <= 0 : st.enemies.every((e) => !e.alive)) {
      st.boss = null;
      st.score += 100 * st.wave;
      st.phase = "clear";
      st.phaseTimer = 100;
      st.bullets = [];
      sfx("powerup");
      if (!demo) emit("game-wave", { wave: st.wave });
    }
  }

  // デモ用：いちばん近い敵の下へ向かい、真上から来る弾はよける
  function autopilot() {
    const center = st.px + 4;
    const danger = st.ebullets.find((b) => b.y > PLAYER_Y - 40 && Math.abs(b.x - center) < 7);
    if (danger) {
      target = st.px + (danger.x < center ? 20 : -20);
      return;
    }
    if (st.boss) {
      target = st.boss.x + st.boss.w / 2 - 4 + Math.sin(performance.now() / 300) * 6;
      return;
    }
    const alive = st.enemies.filter((e) => e.alive);
    if (!alive.length) return;
    const near = alive.reduce((a, e) => (Math.abs(e.x - st.px) < Math.abs(a.x - st.px) ? e : a));
    target = near.x + Math.sin(performance.now() / 300) * 3;
  }

  function gameOver() {
    st.phase = "over";
    st.phaseTimer = 60;
    sfx("gameover");
    payout();
  }

  function text(str, x, y, color = colors.w, align = "left") {
    c.font = '8px "Press Start 2P", monospace';
    c.textAlign = align;
    c.textBaseline = "top";
    c.fillStyle = colors.o;
    c.fillText(str, x + 1, y + 1);
    c.fillStyle = color;
    c.fillText(str, x, y);
  }

  function draw() {
    c.fillStyle = colors.bg;
    c.fillRect(0, 0, W, H);
    c.fillStyle = colors.muted;
    for (const s of bgStars) c.fillRect(s.x, Math.floor(s.y), 1, 1);

    for (const e of st.enemies) {
      if (e.alive) c.drawImage(sprites.invader[st.anim], e.x, e.y);
    }
    if (st.boss) {
      const b = st.boss;
      if (!(b.flash && b.flash % 2)) c.drawImage(sprites.boss, Math.round(b.x), b.y, b.w, b.h);
      // HP バー
      c.fillStyle = colors.muted;
      c.fillRect(30, 12, 100, 2);
      c.fillStyle = colors.p;
      c.fillRect(30, 12, Math.round((100 * b.hp) / b.max), 2);
    }
    c.fillStyle = colors.c;
    for (const b of st.bullets) c.fillRect(b.x, b.y, 1, 3);
    c.fillStyle = colors.p;
    for (const b of st.ebullets) c.fillRect(Math.round(b.x), Math.round(b.y), 1, 3);
    for (const b of st.bursts) c.drawImage(sprites.burst, b.x, b.y);

    // 無敵中は点滅
    if (st.phase !== "over" && (st.inv === 0 || Math.floor(st.inv / 6) % 2)) {
      c.drawImage(sprites.ship, Math.round(st.px), PLAYER_Y);
    }

    c.fillStyle = colors.c;
    c.fillRect(0, 136, W, 1);
    for (let i = 0; i < st.lives; i++) c.drawImage(sprites.heart, 2 + i * 7, 139);
    text(String(st.score).padStart(6, "0"), 2, 2);
    text(`W${st.wave}`, W - 2, 2, colors.c, "right");

    if (st.phase === "ready") text(st.boss ? "BOSS WAVE!" : `WAVE ${st.wave}`, W / 2, 64, st.boss ? colors.p : colors.w, "center");
    if (st.phase === "clear") text("WAVE CLEAR!", W / 2, 64, colors.c, "center");
    if (demo && Math.floor(performance.now() / 600) % 2) {
      text("DEMO PLAY", W / 2, 88, colors.p, "center");
      text("PRESS ANY KEY", W / 2, 100, colors.w, "center");
    }
    if (st.phase === "over") {
      text("GAME OVER", W / 2, 56, colors.p, "center");
      if (st.phaseTimer <= 0 && Math.floor(performance.now() / 500) % 2) {
        text("TAP TO RETRY", W / 2, 72, colors.w, "center");
      }
    }
  }

  function loop(t) {
    raf = requestAnimationFrame(loop);
    if (!last) last = t;
    acc += Math.min(t - last, 100);
    last = t;
    while (acc >= STEP_MS) {
      update();
      acc -= STEP_MS;
    }
    draw();
  }

  function fit() {
    const scale = Math.max(1, Math.floor(Math.min((innerWidth - 32) / W, (innerHeight - 140) / H)));
    canvas.style.width = `${W * scale}px`;
    canvas.style.height = `${H * scale}px`;
  }

  function retryIfOver() {
    if (st?.phase === "over" && st.phaseTimer <= 0) {
      reset();
      sound.sfx.coin();
      return true;
    }
    return false;
  }

  function open({ demo: isDemo = false } = {}) {
    if (running) return;
    demo = isDemo;
    overlay.classList.toggle("demo", demo);
    buildSprites();
    reset();
    fit();
    overlay.hidden = false;
    document.body.classList.add("gaming");
    running = true;
    last = 0;
    acc = 0;
    keys.clear();
    target = null;
    raf = requestAnimationFrame(loop);
    if (!demo) {
      canvas.focus();
      emit("game-start");
    }
  }

  function close() {
    if (!running) return;
    if (st.phase !== "over") payout();
    demo = false;
    running = false;
    cancelAnimationFrame(raf);
    overlay.hidden = true;
    document.body.classList.remove("gaming");
  }

  const KEYMAP = { ArrowLeft: "left", a: "left", A: "left", ArrowRight: "right", d: "right", D: "right" };
  addEventListener("keydown", (e) => {
    if (!running) return;
    if (e.key === "Escape") return close();
    if (KEYMAP[e.key]) {
      keys.add(KEYMAP[e.key]);
      target = null;
      e.preventDefault();
    }
    if (e.key === " " || e.key === "Enter") {
      retryIfOver();
      e.preventDefault();
    }
  });
  addEventListener("keyup", (e) => {
    if (KEYMAP[e.key]) keys.delete(KEYMAP[e.key]);
  });

  // ドラッグ（タップ）した位置に自機が向かう
  function pointerTarget(e) {
    const r = canvas.getBoundingClientRect();
    target = ((e.clientX - r.left) / r.width) * W - 4;
  }
  canvas.addEventListener("pointerdown", (e) => {
    if (retryIfOver()) return;
    canvas.setPointerCapture(e.pointerId);
    pointerTarget(e);
  });
  canvas.addEventListener("pointermove", (e) => {
    if (e.buttons || e.pointerType !== "mouse") pointerTarget(e);
  });

  closeBtn.addEventListener("click", close);
  addEventListener("resize", () => running && fit());
  document.addEventListener("visibilitychange", () => {
    // 裏に回ったら止めて、戻ったら続きから
    if (!running) return;
    if (document.hidden) cancelAnimationFrame(raf);
    else {
      last = 0;
      raf = requestAnimationFrame(loop);
    }
  });

  return { open, close, isOpen: () => running, isDemo: () => running && demo, state: () => st };
})();
