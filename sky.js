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
    const col = COLOR[settings.state.sky] ?? COLOR.night;
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
    el.innerHTML = pixelSvg(rows(age() / SYN), COLOR[settings.state.sky] ?? COLOR.night);
  }
  draw();
  settings.onChange(draw);
  return { age, rows };
})();

// うらに まわったら 星と くもを とめる（でんち）
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    stars.pause();
    clouds.pause();
  } else {
    stars.resume();
    clouds.resume();
  }
});
