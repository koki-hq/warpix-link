// ---------- 空（v2.0）：ながれる 星・くも・ほんとうの 月 ----------
// 星は v1 の まま（script.js の 流れる星）。くもは v1 の 天気の くも を、天気に かかわらず 空の デザインに した
// （2026-11-10 本人「天気の連携とかもオフでいい　背景に組み込んでいいよ」。ばしょは きかない、どこにも おくらない）。
// ひる・ゆうがた・よる は じぶんで えらぶ（core.js の settings、html の data-sky）。

// ---------- 流れる星（縦スクロールのシューティング風） ----------
const stars = (() => {
  const canvas = document.getElementById("stars");
  const c = canvas.getContext("2d");
  const DEFAULT_COLORS = ["#f4f4f4", "#f4f4f4", "#f4f4f4", "#3ee8ff", "#ff4fa3"];
  let colors = DEFAULT_COLORS;
  let field = [];
  let w = 0;
  let h = 0;
  let warpUntil = 0;
  let warpMs = 1000;

  function makeStar(y) {
    const big = Math.random() < 0.2;
    return {
      x: Math.floor((Math.random() * w) / 2) * 2,
      y,
      size: big ? 4 : 2,
      speed: big ? 0.6 : 0.2 + Math.random() * 0.2,
      color: colors[Math.floor(Math.random() * colors.length)],
    };
  }

  function resize() {
    w = canvas.width = innerWidth;
    h = canvas.height = innerHeight;
    const count = Math.round((w * h) / 9000);
    field = Array.from({ length: count }, () => makeStar(Math.random() * h));
  }

  // ワープ中は 1 → 25 → 1 倍に加速する
  function boost(now) {
    if (now >= warpUntil) return 1;
    const t = 1 - (warpUntil - now) / warpMs;
    return 1 + 24 * Math.sin(Math.PI * t);
  }

  function draw(b = 1) {
    c.clearRect(0, 0, w, h);
    for (const s of field) {
      c.fillStyle = s.color;
      // 加速中は星を縦に伸ばして光の筋にする
      const len = b > 1.5 ? Math.min(Math.round((s.speed * b * 6) / 2) * 2, 64) : s.size;
      // 2px単位にスナップしてドット感を保つ
      c.fillRect(s.x, Math.floor(s.y / 2) * 2, s.size, len);
    }
  }

  // 星は 2px きざみでゆっくり動くだけなので、ふだんは 1 秒に 20 回だけ描きなおす（ワープ中は毎フレーム）。
  // 画面全体の canvas を毎フレーム描くと、何もしていないときでも CPU と電池を食うため
  let lastTick = 0;
  let lastDraw = 0;
  let paused = false;
  function tick(now) {
    if (paused) return;
    const frames = lastTick ? Math.min((now - lastTick) / (1000 / 60), 6) : 1;
    lastTick = now;
    const b = boost(now);
    for (const s of field) {
      s.y += s.speed * b * frames;
      if (s.y > h) Object.assign(s, makeStar(-s.size));
    }
    if (b > 1 || now - lastDraw >= 50) {
      draw(b);
      lastDraw = now;
    }
    requestAnimationFrame(tick);
  }

  addEventListener("resize", () => {
    resize();
    draw();
  });
  resize();
  draw();
  if (!reduceMotion) requestAnimationFrame(tick);

  return {
    // ページが眠るときは止めて、起きたら再開する
    pause() {
      paused = true;
    },
    resume() {
      if (!paused) return;
      paused = false;
      lastTick = 0;
      if (!reduceMotion) requestAnimationFrame(tick);
    },
    isPaused: () => paused,
    warp(ms = 1000) {
      warpMs = ms;
      warpUntil = performance.now() + ms;
    },
    // 星の色を入れかえる（null でもとに戻す）
    setColors(list) {
      colors = list ?? DEFAULT_COLORS;
      for (const s of field) s.color = colors[Math.floor(Math.random() * colors.length)];
      draw();
    },
  };
})();


// ---------- くも（v1 weather.js の ドット絵の くもが ゆっくり ながれる） ----------
const clouds = (() => {
  const canvas = document.getElementById("clouds");
  const c = canvas.getContext("2d");
  const CLOUD = [
    "....wwww........",
    "..wwwwwwww.www..",
    ".wwwwwwwwwwwwww.",
    "wwwwwwwwwwwwwwww",
    ".ssssssssssssss.",
  ];
  // そらごとの いろ（よるは v1 の まま うすい むらさき、ひるは しろ、ゆうがたは ゆうひいろ）
  const COLOR = {
    night: { w: "rgba(138, 128, 184, 0.35)", s: "rgba(138, 128, 184, 0.35)" },
    day: { w: "#ffffff", s: "#cfe3fa" },
    evening: { w: "#ffc9a8", s: "#c8608a" },
  };
  let list = [];
  function resize() {
    canvas.width = innerWidth;
    canvas.height = innerHeight;
    // いつも おなじ ばしょから（ひらく たびに ばらばらに しない）
    list = [
      { x: 0.05, y: 70, s: 5, v: 0.12 },
      { x: 0.62, y: 150, s: 4, v: 0.09 },
      { x: 0.28, y: 250, s: 3, v: 0.15 },
      { x: 0.8, y: 330, s: 3, v: 0.1 },
    ].map((cl) => ({ ...cl, x: cl.x * canvas.width }));
  }
  function draw() {
    c.clearRect(0, 0, canvas.width, canvas.height);
    const col = COLOR[settings.sky()] ?? COLOR.night;
    for (const cl of list) {
      CLOUD.forEach((row, y) =>
        [...row].forEach((ch, x) => {
          if (ch === ".") return;
          c.fillStyle = col[ch];
          c.fillRect(Math.floor(cl.x) + x * cl.s, cl.y + y * cl.s, cl.s, cl.s);
        })
      );
    }
  }
  // 1 びょうに 10 かい だけ かきなおす（ゆっくり なので じゅうぶん。でんちを くわない）
  let paused = false;
  function step() {
    if (paused || document.hidden) return;
    for (const cl of list) {
      cl.x += cl.v * 6;
      if (cl.x > canvas.width) cl.x = -16 * cl.s;
    }
    draw();
  }
  addEventListener("resize", () => {
    resize();
    draw();
  });
  resize();
  draw();
  if (!reduceMotion) setInterval(step, 100);
  settings.onChange(draw);
  return { draw, pause: () => (paused = true), resume: () => (paused = false) };
})();

// ---------- ほんとうの 月：その日の かたち（ロゴの だんの みぎ はし。ひるは しろい 月） ----------
const moon = (() => {
  const SYN = 29.530588853;
  const NEW_MOON = Date.UTC(2000, 0, 6, 18, 14); // 2000-01-06 18:14 UTC の 新月から かぞえる
  const age = (d = today()) => ((((d.getTime() - NEW_MOON) / 86400000) % SYN) + SYN) % SYN;
  function rows(phase) {
    const out = [];
    const R = 7.5;
    for (let y = 0; y < 16; y++) {
      let row = "";
      for (let x = 0; x < 16; x++) {
        const nx = (x + 0.5 - 8) / R;
        const ny = (y + 0.5 - 8) / R;
        if (nx * nx + ny * ny > 1) {
          row += ".";
          continue;
        }
        const k = Math.cos(2 * Math.PI * phase) * Math.sqrt(1 - ny * ny);
        row += (phase < 0.5 ? nx > k : nx < -k) ? "l" : "d";
      }
      out.push(row);
    }
    return out;
  }
  const COLOR = {
    night: { l: "#fff4c2", d: "rgba(42, 33, 80, 0.9)" },
    evening: { l: "#ffe9c9", d: "rgba(80, 50, 110, 0.5)" },
    day: { l: "#ffffff", d: "rgba(255, 255, 255, 0.18)" },
  };
  const el = document.getElementById("moon");
  function draw() {
    el.innerHTML = pixelSvg(rows(age() / SYN), COLOR[settings.sky()] ?? COLOR.night);
  }
  draw();
  settings.onChange(draw);
  return { age, rows };
})();

// ---------- きせつ（v2.7）：ふゆ ゆき（12〜2 月）・はる はなびら（3〜4 月）・なつ はなび（7〜8 月）・あき おちば（10〜11 月） ----------
const seasonOf = (d = today()) => {
  const m = d.getMonth() + 1;
  return m === 12 || m <= 2 ? "snow" : m <= 4 ? "petal" : m === 7 || m === 8 ? "firework" : m >= 10 ? "leaf" : null;
};

// ---------- ちへいせん（v2.7）：画面の いちばん 下に ドットの まち か おか。きせかえ で えらぶ（なし も） ----------
// 本人「選べるようにすればいいんじゃない？　背景のところで　まちとおか　で」。ひる・ゆうがた・よるで いろが かわる。
// ドットは 4px。いつも おなじ けしき（たねを きめた でたらめ）。よるは ときどき まどの あかりが つく・きえる
const horizon = (() => {
  const P = 4;
  const ROWS = 36;
  const canvas = document.getElementById("horizon");
  const c = canvas.getContext("2d");
  const PAL = {
    night: { far: "#221a48", near: "#2e2560", rim: "#4a3d8f", win: ["#ffd84a", "#3ee8ff", "#ff4fa3", "#ffd84a"], lit: 0.35, hillFar: "#2a2152", hillNear: "#3a2f72", hillRim: "#4f4392" },
    evening: { far: "#5a3380", near: "#2a1a4a", rim: "#7a4a9a", win: ["#ffc766", "#ffd84a"], lit: 0.25, hillFar: "#6c3f94", hillNear: "#3a2560", hillRim: "#8a55a8" },
    day: { far: "#8fb6e8", near: "#5d86c4", rim: "#a9c8ef", win: ["#c4e1fb"], lit: 0.3, hillFar: "#6fbf5a", hillNear: "#3f8f45", hillRim: "#8fd47a" },
  };
  let wins = []; // [x, y, ひかる いろ, ついて いるか]
  let cols = 0;
  const rng = (seed) => () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  function city(pal, snow) {
    const r = rng(2026);
    wins = [];
    // おくの ビル（うすい）
    let x = 0;
    while (x < cols) {
      const w = 4 + Math.floor(r() * 6);
      const h = 9 + Math.floor(r() * 12);
      c.fillStyle = pal.far;
      c.fillRect(x, ROWS - h, w, h);
      x += w + Math.floor(r() * 3);
    }
    // てまえの ビル：ふちの ひかり・アンテナ・やねの タンク・まど
    x = 0;
    while (x < cols) {
      const w = 4 + Math.floor(r() * 6);
      const h = 5 + Math.floor(r() * 24);
      const top = ROWS - h;
      c.fillStyle = pal.near;
      c.fillRect(x, top, w, h);
      const deco = r();
      if (deco < 0.22) c.fillRect(x + Math.floor(w / 2), top - 3 - Math.floor(r() * 3), 1, 6);
      else if (deco < 0.36 && w >= 5) {
        c.fillRect(x + 1, top - 3, 3, 2);
        c.fillRect(x + 1, top - 1, 1, 1);
        c.fillRect(x + 3, top - 1, 1, 1);
      }
      c.fillStyle = snow ? "#f4f4f4" : pal.rim;
      c.fillRect(x, top, w, 1);
      for (let yy = top + 2; yy < ROWS - 2; yy += 3)
        for (let xx = x + 1; xx < x + w - 1; xx += 2) {
          const col = pal.win[Math.floor(r() * pal.win.length)];
          const on = r() < pal.lit;
          wins.push([xx, yy, col, on]);
        }
      x += w;
    }
    if (snow) {
      c.fillStyle = "#f4f4f4";
      c.fillRect(0, ROWS - 1, cols, 1);
    }
    drawWins(pal);
  }
  function drawWins(pal) {
    for (const [wx, wy, col, on] of wins) {
      c.fillStyle = on ? col : pal.near;
      c.fillRect(wx, wy, 1, 1);
    }
  }
  function hills(pal, snow, night) {
    const layer = (color, rim, base, amp, f, ph) => {
      for (let x = 0; x < cols; x++) {
        const h = Math.round(base + amp * Math.sin(x * f + ph) + 2 * Math.sin(x * f * 2.7 + ph));
        c.fillStyle = color;
        c.fillRect(x, ROWS - h, 1, h);
        c.fillStyle = snow ? "#f4f4f4" : rim;
        c.fillRect(x, ROWS - h, 1, 1);
      }
    };
    layer(pal.hillFar, pal.hillFar, 19, 7, 0.06, 1);
    layer(pal.hillNear, pal.hillRim, 9, 5, 0.09, 4);
    const ground = (x) => ROWS - Math.round(9 + 5 * Math.sin(x * 0.09 + 4) + 2 * Math.sin(x * 0.243 + 4));
    // ちいさな いえ（よるは まどに あかり）と き
    for (const hx of [Math.floor(cols * 0.2), Math.floor(cols * 0.66)]) {
      const y = ground(hx + 2);
      c.fillStyle = pal.hillNear;
      c.fillRect(hx, y - 3, 5, 4);
      c.fillRect(hx + 1, y - 4, 3, 1);
      c.fillRect(hx + 2, y - 5, 1, 1);
      c.fillStyle = night ? "#ffd84a" : pal.hillRim;
      c.fillRect(hx + 2, y - 2, 1, 1);
    }
    c.fillStyle = pal.hillNear;
    for (const f of [0.1, 0.42, 0.82, 0.9]) {
      const tx = Math.floor(cols * f);
      const y = ground(tx);
      c.fillRect(tx, y - 5, 1, 5);
      c.fillRect(tx - 1, y - 5, 3, 2);
      c.fillRect(tx, y - 6, 1, 1);
    }
  }
  function draw() {
    const kind = settings.state.horizon;
    cols = Math.ceil(innerWidth / P);
    canvas.width = cols;
    canvas.height = ROWS;
    c.clearRect(0, 0, cols, ROWS);
    if (kind === "none") return;
    const s = settings.sky();
    const pal = PAL[s] ?? PAL.night;
    const snow = seasonOf() === "snow";
    if (kind === "hills") hills(pal, snow, s !== "day");
    else city(pal, snow);
  }
  // よるは 4 びょう ごとに まどの あかりを 1 つ つけたり けしたり（ちいさな canvas なので かるい）
  let paused = false;
  function twinkle() {
    if (paused || document.hidden || settings.state.horizon !== "city" || settings.sky() === "day" || !wins.length) return;
    const w = wins[Math.floor(Math.random() * wins.length)];
    w[3] = !w[3];
    drawWins(PAL[settings.sky()] ?? PAL.night);
  }
  addEventListener("resize", draw);
  draw();
  if (!reduceMotion) setInterval(twinkle, 4000);
  settings.onChange(draw);
  return { draw, pause: () => (paused = true), resume: () => (paused = false), kind: () => settings.state.horizon };
})();

// ---------- きせつの そら（v2.7）：ドットの つぶが ゆっくり ふる。1 びょうに 10 かい だけ かく（でんち） ----------
const season = (() => {
  const P = 4;
  const canvas = document.getElementById("season");
  const c = canvas.getContext("2d");
  const kind = seasonOf();
  const LOOK = {
    snow: { n: 46, colors: ["#f4f4f4", "#f4f4f4", "#dfe8ff"], vy: [0.12, 0.35], vx: 0.05 },
    petal: { n: 30, colors: ["#ff8fbf", "#ff6fae", "#ffb3d1"], vy: [0.1, 0.22], vx: 0.18 },
    leaf: { n: 22, colors: ["#ff8a1f", "#e8463c", "#ffd84a", "#c06a2e"], vy: [0.1, 0.25], vx: 0.1 },
  };
  let w = 0;
  let h = 0;
  let bits = [];
  let fires = [];
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  function makeBit(y) {
    const L = LOOK[kind];
    return { x: Math.random() * w, y, vy: L.vy[0] + Math.random() * (L.vy[1] - L.vy[0]), ph: Math.random() * 6.28, col: pick(L.colors), big: Math.random() < 0.3 };
  }
  function resize() {
    w = canvas.width = Math.ceil(innerWidth / P);
    h = canvas.height = Math.ceil(innerHeight / P);
    bits = LOOK[kind] ? Array.from({ length: LOOK[kind].n }, () => makeBit(Math.random() * h)) : [];
  }
  let t = 0;
  function draw() {
    c.clearRect(0, 0, w, h);
    for (const b of bits) {
      const x = Math.round(b.x);
      const y = Math.round(b.y);
      c.fillStyle = b.col;
      if (kind === "snow") {
        c.fillRect(x, y, 1, 1);
        if (b.big) {
          c.fillRect(x - 1, y, 3, 1);
          c.fillRect(x, y - 1, 1, 3);
        }
      } else if (kind === "petal") {
        c.fillRect(x, y, 2, 1);
        if (b.big) c.fillRect(x + 1, y + 1, 1, 1);
      }
      else {
        c.fillRect(x, y, 2, 1);
        c.fillRect(x + (Math.sin(t / 6 + b.ph) > 0 ? 1 : 0), y + 1, 1, 1);
      }
    }
    // はなび：ドットの わが ひろがって きえる
    for (const f of fires) {
      const k = f.age / f.life;
      const r = 2 + k * f.size;
      c.globalAlpha = Math.max(0, 1 - k * k);
      c.fillStyle = f.col;
      for (let i = 0; i < 14; i++) {
        const a = (i / 14) * Math.PI * 2;
        c.fillRect(Math.round(f.x + Math.cos(a) * r), Math.round(f.y + Math.sin(a) * r), 1, 1);
      }
      if (k < 0.3) c.fillRect(f.x, f.y, 1, 1);
      c.globalAlpha = 1;
    }
  }
  let paused = false;
  function step() {
    if (paused || document.hidden) return;
    t++;
    const L = LOOK[kind];
    for (const b of bits) {
      b.y += b.vy;
      b.x += L.vx * (kind === "petal" ? 1 : Math.sin(t / 10 + b.ph));
      if (b.y > h || b.x > w + 2) Object.assign(b, makeBit(-2));
    }
    if (kind === "firework") {
      for (const f of fires) f.age++;
      fires = fires.filter((f) => f.age < f.life);
      if (t % 28 === 6 && fires.length < 2) fires.push({ x: Math.floor(w * (0.15 + Math.random() * 0.7)), y: Math.floor(h * (0.08 + Math.random() * 0.3)), age: 0, life: 14, size: 5 + Math.random() * 4, col: pick(["#ff4fa3", "#3ee8ff", "#ffd84a", "#f4f4f4"]) });
    }
    draw();
  }
  addEventListener("resize", () => {
    resize();
    draw();
  });
  resize();
  draw();
  if (kind && !reduceMotion) setInterval(step, 100);
  return { kind: () => kind, pause: () => (paused = true), resume: () => (paused = false) };
})();

// うらに まわったら 星と くもを とめる（でんち）
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    stars.pause();
    clouds.pause();
    horizon.pause();
    season.pause();
  } else {
    stars.resume();
    clouds.resume();
    horizon.resume();
    season.resume();
  }
});
