// ドット絵アイコン（12x12、"#" が塗りのピクセル）
const ICONS = {
  youtube: [
    "............",
    "............",
    ".##########.",
    "############",
    "####.#######",
    "####..######",
    "####...#####",
    "####..######",
    "####.#######",
    "############",
    ".##########.",
    "............",
  ],
  twitter: [
    "............",
    ".........##.",
    "#.......####",
    "##.....####.",
    "###...#####.",
    ".##########.",
    ".#########..",
    "..########..",
    "...######...",
    "....####....",
    "#######.....",
    ".#####......",
  ],
  instagram: [
    ".##########.",
    "#..........#",
    "#........#.#",
    "#...####...#",
    "#..#....#..#",
    "#..#....#..#",
    "#..#....#..#",
    "#..#....#..#",
    "#...####...#",
    "#..........#",
    "#..........#",
    ".##########.",
  ],
  booth: [
    "....####....",
    "...#....#...",
    "...#....#...",
    ".##########.",
    ".##.####.##.",
    ".##########.",
    ".##########.",
    ".##########.",
    ".##########.",
    ".##########.",
    ".##########.",
    "............",
  ],
  tumblr: [
    "............",
    "....##......",
    "....##......",
    "..#######...",
    "..#######...",
    "....##......",
    "....##......",
    "....##......",
    "....##......",
    "....###..##.",
    ".....######.",
    "............",
  ],
  spotify: [
    "...######...",
    ".##########.",
    "############",
    "##........##",
    "#.########.#",
    "###......###",
    "##.######.##",
    "####....####",
    "###.####.###",
    "############",
    ".##########.",
    "...######...",
  ],
};

function pixelSvg(rows) {
  const rects = [];
  rows.forEach((row, y) => {
    [...row].forEach((c, x) => {
      if (c === "#") rects.push(`<rect x="${x}" y="${y}" width="1" height="1"/>`);
    });
  });
  return `<svg viewBox="0 0 12 12" fill="currentColor" shape-rendering="crispEdges" aria-hidden="true">${rects.join("")}</svg>`;
}

document.querySelectorAll("[data-icon]").forEach((el) => {
  const rows = ICONS[el.dataset.icon];
  if (rows) el.innerHTML = pixelSvg(rows);
});

// ---------- サウンド（Web Audio API で8bit風に鳴らす） ----------
const sound = (() => {
  let ctx = null;
  let bgmGain = null;
  let noiseBuffer = null;

  // ブラウザの自動再生制限があるので、最初のクリック以降に作る
  function ensure() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      ctx = new AC();
      bgmGain = ctx.createGain();
      bgmGain.gain.value = 0;
      bgmGain.connect(ctx.destination);

      noiseBuffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const data = noiseBuffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    }
    if (ctx.state === "suspended") ctx.resume();
    return true;
  }

  const midi = (n) => 440 * 2 ** ((n - 69) / 12);

  function tone({ freq, start, dur, type = "square", vol = 0.08, slideTo, dest }) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, start + dur);
    gain.gain.setValueAtTime(vol, start);
    gain.gain.exponentialRampToValueAtTime(0.001, start + dur);
    osc.connect(gain).connect(dest ?? ctx.destination);
    osc.start(start);
    osc.stop(start + dur);
  }

  function noise(start, dur, vol, dest) {
    const src = ctx.createBufferSource();
    const gain = ctx.createGain();
    src.buffer = noiseBuffer;
    gain.gain.setValueAtTime(vol, start);
    gain.gain.exponentialRampToValueAtTime(0.001, start + dur);
    src.connect(gain).connect(dest);
    src.start(start, Math.random() * 0.5);
    src.stop(start + dur);
  }

  // 効果音
  const sfx = {
    hover() {
      if (ctx) tone({ freq: 880, start: ctx.currentTime, dur: 0.05 });
    },
    select() {
      if (ensure()) tone({ freq: 440, start: ctx.currentTime, dur: 0.15, slideTo: 1760 });
    },
    // 起動ジングル（ド・ミ・ソ・ド〜）
    start() {
      if (!ensure()) return;
      const t = ctx.currentTime;
      [72, 76, 79].forEach((n, i) => tone({ freq: midi(n), start: t + i * 0.08, dur: 0.08 }));
      tone({ freq: midi(84), start: t + 0.24, dur: 0.4 });
      tone({ freq: midi(48), start: t + 0.24, dur: 0.4, type: "triangle", vol: 0.15 });
    },
  };

  // BGM：Am → F → C → G の4小節ループ（8分音符刻み、null は休符）
  const BPM = 140;
  const STEP = 60 / BPM / 2;
  const LEAD = [
    76, null, 72, 69, 72, 76, 81, null,
    77, null, 76, 72, 69, 72, 77, null,
    79, null, 76, 72, 76, 79, 84, null,
    83, 81, 79, 74, 71, 74, 79, null,
  ];
  const BASS = [45, 41, 48, 43];

  let timer = null;
  let step = 0;
  let nextTime = 0;

  function scheduleStep(i, t) {
    const n = LEAD[i];
    if (n) tone({ freq: midi(n), start: t, dur: STEP * 0.9, vol: 0.04, dest: bgmGain });
    const root = BASS[Math.floor(i / 8)] + (i % 2 ? 12 : 0);
    tone({ freq: midi(root), start: t, dur: STEP * 0.9, type: "triangle", vol: 0.12, dest: bgmGain });
    if (i % 2 === 1) noise(t, 0.03, 0.03, bgmGain);
  }

  function bgmPlay(delay = 0) {
    if (!ensure() || timer) return;
    step = 0;
    nextTime = ctx.currentTime + delay;
    bgmGain.gain.setValueAtTime(1, ctx.currentTime);
    timer = setInterval(() => {
      // タブが裏に回って遅れたときは、まとめて鳴らさず今から再開する
      if (nextTime < ctx.currentTime) nextTime = ctx.currentTime + 0.05;
      while (nextTime < ctx.currentTime + 0.12) {
        scheduleStep(step, nextTime);
        nextTime += STEP;
        step = (step + 1) % LEAD.length;
      }
    }, 25);
  }

  function bgmStop() {
    clearInterval(timer);
    timer = null;
    if (ctx) bgmGain.gain.setValueAtTime(0, ctx.currentTime);
  }

  return { sfx, bgmPlay, bgmStop };
})();

// ---------- 流れる星（縦スクロールのシューティング風） ----------
(() => {
  const canvas = document.getElementById("stars");
  const c = canvas.getContext("2d");
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const COLORS = ["#f4f4f4", "#f4f4f4", "#f4f4f4", "#3ee8ff", "#ff4fa3"];
  let stars = [];
  let w = 0;
  let h = 0;

  function makeStar(y) {
    const big = Math.random() < 0.2;
    return {
      x: Math.floor((Math.random() * w) / 2) * 2,
      y,
      size: big ? 4 : 2,
      speed: big ? 0.6 : 0.2 + Math.random() * 0.2,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
    };
  }

  function resize() {
    w = canvas.width = innerWidth;
    h = canvas.height = innerHeight;
    const count = Math.round((w * h) / 9000);
    stars = Array.from({ length: count }, () => makeStar(Math.random() * h));
  }

  function draw() {
    c.clearRect(0, 0, w, h);
    for (const s of stars) {
      c.fillStyle = s.color;
      // 2px単位にスナップしてドット感を保つ
      c.fillRect(s.x, Math.floor(s.y / 2) * 2, s.size, s.size);
    }
  }

  function tick() {
    for (const s of stars) {
      s.y += s.speed;
      if (s.y > h) Object.assign(s, makeStar(-s.size));
    }
    draw();
    requestAnimationFrame(tick);
  }

  addEventListener("resize", () => {
    resize();
    draw();
  });
  resize();
  draw();
  if (!reduceMotion) requestAnimationFrame(tick);
})();

// ---------- PRESS START → 起動演出 ----------
(() => {
  const startScreen = document.getElementById("start-screen");
  const startBtn = document.getElementById("start-btn");
  const bgmToggle = document.getElementById("bgm-toggle");

  let bgmOn = true;
  try {
    bgmOn = localStorage.getItem("warpix-bgm") !== "off";
  } catch {}

  function renderToggle() {
    bgmToggle.textContent = bgmOn ? "BGM ON" : "BGM OFF";
    bgmToggle.setAttribute("aria-pressed", String(bgmOn));
  }
  renderToggle();

  document.querySelectorAll(".pixel-btn").forEach((btn, i) => {
    btn.style.setProperty("--i", i);
    btn.addEventListener("mouseenter", sound.sfx.hover);
    btn.addEventListener("focus", sound.sfx.hover);
    btn.addEventListener("click", sound.sfx.select);
  });

  bgmToggle.addEventListener("click", () => {
    bgmOn = !bgmOn;
    renderToggle();
    try {
      localStorage.setItem("warpix-bgm", bgmOn ? "on" : "off");
    } catch {}
    if (bgmOn) sound.bgmPlay();
    else sound.bgmStop();
  });

  let started = false;
  function start() {
    if (started) return;
    started = true;
    sound.sfx.start();
    if (bgmOn) sound.bgmPlay(0.8);
    startScreen.classList.add("leaving");
    setTimeout(() => {
      startScreen.hidden = true;
      document.body.classList.add("booted");
    }, 450);
  }

  startScreen.hidden = false;
  startScreen.addEventListener("click", start);
  startBtn.focus();
})();
