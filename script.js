// ページ内のできごとを他のファイル（game.js / extras.js）に知らせるためのイベントバス
const bus = new EventTarget();
const emit = (type, detail = {}) => bus.dispatchEvent(new CustomEvent(type, { detail }));
const on = (type, fn) => bus.addEventListener(type, (e) => fn(e.detail));

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
  key: [
    "............",
    "............",
    "............",
    ".###........",
    "#...#.......",
    "#...########",
    "#...#...#.#.",
    ".###....#.#.",
    "............",
    "............",
    "............",
    "............",
  ],
};

// 多色スプライト用のパレット（o=輪郭 w=白 p=ピンク c=シアン y=金）
// CSS変数で塗るので、配色モードが変わるとスプライトの色もいっしょに変わる
const PALETTE = {
  "#": "currentColor",
  o: "var(--shadow)",
  w: "var(--fg)",
  p: "var(--accent)",
  c: "var(--accent-2)",
  y: "var(--gold)",
};

// ナビゲーター「ピクセ」（16x16）。目を閉じたコマと2枚
const NPC = {
  idle: [
    ".......pp.......",
    ".......ww.......",
    ".......ww.......",
    ".....oooooo.....",
    "...oowwwwwwoo...",
    "..owwwwwwwwwwo..",
    ".owwwwwwwwwwwwo.",
    ".owwcowwwwcowwo.",
    ".owwoowwwwoowwo.",
    ".owppwwwwwwppwo.",
    ".owwwwwoowwwwwo.",
    ".owwwwwwwwwwwwo.",
    "..owwwwwwwwwwo..",
    "...oowwwwwwoo...",
    "....oo....oo....",
    "................",
  ],
  blink: [
    ".......pp.......",
    ".......ww.......",
    ".......ww.......",
    ".....oooooo.....",
    "...oowwwwwwoo...",
    "..owwwwwwwwwwo..",
    ".owwwwwwwwwwwwo.",
    ".owwwwwwwwwwwwo.",
    ".owwoowwwwoowwo.",
    ".owppwwwwwwppwo.",
    ".owwwwwoowwwwwo.",
    ".owwwwwwwwwwwwo.",
    "..owwwwwwwwwwo..",
    "...oowwwwwwoo...",
    "....oo....oo....",
    "................",
  ],
};

const UFO = [
  "....cccc....",
  "...cccccc...",
  ".wwwwwwwwww.",
  "wpwwpwwpwwpw",
  ".wwwwwwwwww.",
  "...w....w...",
];

const BOOM = [
  ".....pp.....",
  ".p...pp...p.",
  "..p..ww..p..",
  "...p.ww.p...",
  "....wwww....",
  "ppwwwwwwwwpp",
  "ppwwwwwwwwpp",
  "....wwww....",
  "...p.ww.p...",
  "..p..ww..p..",
  ".p...pp...p.",
  ".....pp.....",
];

function pixelSvg(rows, palette = PALETTE) {
  const rects = [];
  rows.forEach((row, y) => {
    [...row].forEach((ch, x) => {
      const fill = palette[ch];
      if (fill) rects.push(`<rect x="${x}" y="${y}" width="1" height="1" style="fill:${fill}"/>`);
    });
  });
  return `<svg viewBox="0 0 ${rows[0].length} ${rows.length}" shape-rendering="crispEdges" aria-hidden="true">${rects.join("")}</svg>`;
}

document.querySelectorAll("[data-icon]").forEach((el) => {
  const rows = ICONS[el.dataset.icon];
  if (rows) el.innerHTML = pixelSvg(rows);
});

const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

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
    // コイン（シ→ミ）
    coin() {
      if (!ensure()) return;
      const t = ctx.currentTime;
      tone({ freq: midi(83), start: t, dur: 0.07, vol: 0.06 });
      tone({ freq: midi(88), start: t + 0.07, dur: 0.25, vol: 0.06 });
    },
    // 会話の文字送り
    text() {
      if (ctx) tone({ freq: 1200, start: ctx.currentTime, dur: 0.02, vol: 0.02 });
    },
    boom() {
      if (!ensure()) return;
      const t = ctx.currentTime;
      noise(t, 0.4, 0.15, ctx.destination);
      tone({ freq: 220, start: t, dur: 0.4, type: "triangle", vol: 0.2, slideTo: 40 });
    },
    // パワーアップ（駆け上がるアルペジオ）
    powerup() {
      if (!ensure()) return;
      const t = ctx.currentTime;
      [60, 64, 67, 72, 76, 79, 84, 88].forEach((n, i) =>
        tone({ freq: midi(n), start: t + i * 0.05, dur: 0.1, vol: 0.06 })
      );
    },
    // ミニゲームの自機ショット
    shoot() {
      if (ctx) tone({ freq: 1400, start: ctx.currentTime, dur: 0.08, vol: 0.03, slideTo: 500 });
    },
    // 敵に当たった（短いノイズ）
    hit() {
      if (ctx) noise(ctx.currentTime, 0.12, 0.08, ctx.destination);
    },
    // 自機がやられた
    damage() {
      if (!ctx) return;
      const t = ctx.currentTime;
      noise(t, 0.5, 0.12, ctx.destination);
      tone({ freq: 440, start: t, dur: 0.5, vol: 0.06, slideTo: 55 });
    },
    // 実績解除のファンファーレ（ソ・ソ・ソ・ド〜）
    fanfare() {
      if (!ensure()) return;
      const t = ctx.currentTime;
      [79, 79, 79].forEach((n, i) => tone({ freq: midi(n), start: t + i * 0.09, dur: 0.07, vol: 0.05 }));
      tone({ freq: midi(84), start: t + 0.27, dur: 0.5, vol: 0.06 });
      tone({ freq: midi(88), start: t + 0.27, dur: 0.5, vol: 0.04 });
    },
    // 流れ星（キラキラ下がる）
    twinkle() {
      if (!ensure()) return;
      const t = ctx.currentTime;
      [96, 91, 88, 84, 79].forEach((n, i) => tone({ freq: midi(n), start: t + i * 0.04, dur: 0.12, vol: 0.04 }));
    },
    // ゲームオーバー（下がっていくメロディ）
    gameover() {
      if (!ensure()) return;
      const t = ctx.currentTime;
      [72, 67, 64, 60].forEach((n, i) => tone({ freq: midi(n), start: t + i * 0.18, dur: 0.17, vol: 0.06 }));
      tone({ freq: midi(36), start: t + 0.72, dur: 0.6, type: "triangle", vol: 0.15 });
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
  let stepDur = STEP; // setTempo でテンポを変えられる

  function scheduleStep(i, t) {
    const n = LEAD[i];
    if (n) tone({ freq: midi(n), start: t, dur: stepDur * 0.9, vol: 0.04, dest: bgmGain });
    const root = BASS[Math.floor(i / 8)] + (i % 2 ? 12 : 0);
    tone({ freq: midi(root), start: t, dur: stepDur * 0.9, type: "triangle", vol: 0.12, dest: bgmGain });
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
        nextTime += stepDur;
        step = (step + 1) % LEAD.length;
      }
    }, 25);
  }

  function bgmStop() {
    clearInterval(timer);
    timer = null;
    if (ctx) bgmGain.gain.setValueAtTime(0, ctx.currentTime);
  }

  // タブが裏にいる間は一時停止
  const pause = () => ctx?.suspend();
  const resume = () => ctx?.resume();

  // 1 = ふつう、1.5 = 1.5倍速
  const setTempo = (mult) => (stepDur = STEP / mult);

  return { sfx, bgmPlay, bgmStop, pause, resume, setTempo };
})();

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

  function tick(now) {
    const b = boost(now);
    for (const s of field) {
      s.y += s.speed * b;
      if (s.y > h) Object.assign(s, makeStar(-s.size));
    }
    draw(b);
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

// ---------- スコア ----------
const score = (() => {
  let value = 0;
  let hi = 0;
  try {
    hi = Number(localStorage.getItem("warpix-hi")) || 0;
  } catch {}

  const fmt = (n) => String(Math.min(n, 999999)).padStart(6, "0");

  function render() {
    document.querySelectorAll("[data-score]").forEach((el) => (el.textContent = fmt(value)));
    document.querySelectorAll("[data-hiscore]").forEach((el) => (el.textContent = fmt(hi)));
  }

  function popup(text, x, y) {
    const el = document.createElement("div");
    el.className = "score-pop";
    el.textContent = text;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    document.body.append(el);
    setTimeout(() => el.remove(), 900);
  }

  // 1.5秒以内に続けて点を取るとコンボ。5コンボごとに倍率が上がる（最大x4）
  let combo = 0;
  let lastAdd = 0;

  function add(points, x, y) {
    const now = performance.now();
    combo = now - lastAdd < 1500 ? combo + 1 : 0;
    lastAdd = now;
    const mult = Math.min(1 + Math.floor(combo / 5), 4);
    points *= mult;
    value += points;
    if (value > hi) {
      hi = value;
      try {
        localStorage.setItem("warpix-hi", String(hi));
      } catch {}
    }
    render();
    popup(mult > 1 ? `+${points} x${mult}` : `+${points}`, x, y);
    emit("score", { value, mult });
  }

  render();
  return { add };
})();

// クリック位置（キーボード操作のときは要素の上端中央）
function pointOf(e, el) {
  if (e?.clientX || e?.clientY) return [e.clientX, e.clientY];
  const r = el.getBoundingClientRect();
  return [r.left + r.width / 2, r.top];
}

// ---------- ナビゲーター「ピクセ」 ----------
const npc = (() => {
  const sprite = document.getElementById("npc");
  const body = document.getElementById("npc-body");
  const box = document.getElementById("dialog");
  const textEl = document.getElementById("dialog-text");

  const hour = new Date().getHours();
  const GREETING =
    hour < 5 ? "こんな じかんに……\nもしかして よふかし？" :
    hour < 10 ? "おはよう！ ぼくは ピクセ。\nここは ワーピクスの ほしぞら。" :
    hour < 17 ? "こんにちは！ ぼくは ピクセ。\nここは ワーピクスの ほしぞら。" :
    "こんばんは！ ぼくは ピクセ。\nここは ワーピクスの ほしぞら。";
  const INTRO = [
    GREETING,
    "したの ボタンを えらぶと\nその せかいへ ワープできるよ。",
    "……そういえば ときどき\nそらを なにかが とんでるんだ。",
  ];
  const CHATTER = [
    "いてっ！",
    "コインを みつけた！",
    "きょうも いい ほしぞらだね。",
    "BGMは みぎうえで\nけせるよ。",
    "うえうえ したした……\nつづき なんだっけ？",
    "ハイスコア こうしんを\nめざそう！",
    "ぼくを なんども なんども\nつつくと……？",
    "UFOを うちおとすと\nいいこと あるかも。",
  ];

  let queue = [];
  let full = "";
  let shown = 0;
  let typing = null;
  let lastChatter = -1;
  let introStarted = false;

  function render() {
    box.classList.toggle("more", !typing && queue.length > 0);
  }

  function finish() {
    clearInterval(typing);
    typing = null;
    textEl.textContent = full;
    render();
  }

  function type(line) {
    clearInterval(typing);
    full = line;
    shown = 0;
    textEl.textContent = "";
    typing = setInterval(() => {
      shown++;
      textEl.textContent = full.slice(0, shown);
      if (shown % 2) sound.sfx.text();
      if (shown >= full.length) finish();
    }, 45);
    render();
  }

  function next() {
    const line = queue.shift();
    if (line) type(line);
  }

  function say(lines) {
    queue = [...lines];
    next();
  }

  function chatter() {
    let i;
    do i = Math.floor(Math.random() * CHATTER.length);
    while (i === lastChatter);
    lastChatter = i;
    say([CHATTER[i]]);
  }

  box.addEventListener("click", () => (typing ? finish() : next()));

  // まばたき（ねているあいだは目を閉じたまま）
  let asleep = false;
  const face = () => (body.innerHTML = pixelSvg(asleep ? NPC.blink : NPC.idle));
  face();
  setInterval(() => {
    if (asleep) return;
    body.innerHTML = pixelSvg(NPC.blink);
    setTimeout(face, 150);
  }, 3200);

  function jump() {
    sprite.classList.remove("jump");
    void sprite.offsetWidth; // アニメーションを最初からやり直す
    sprite.classList.add("jump");
  }

  // つつくとジャンプしてコイン。10回つづけてつつくと……
  let pokes = 0;
  let lastPoke = 0;
  sprite.addEventListener("click", (e) => {
    jump();
    sound.sfx.coin();
    score.add(10, ...pointOf(e, sprite));

    const now = performance.now();
    pokes = now - lastPoke < 1500 ? pokes + 1 : 1;
    lastPoke = now;
    emit("poke", { streak: pokes });
    if (pokes >= 10) {
      pokes = 0;
      secret.unlock();
    } else if (pokes === 5) {
      say(["……なんだか からだが\nむずむず してきた。"]);
    } else if (pokes < 5) {
      chatter();
    }
  });

  return {
    say,
    jump,
    intro() {
      introStarted = true;
      say(INTRO);
    },
    busy: () => !!typing || queue.length > 0,
    // あいさつを最後まで言い終えたか
    ready: () => introStarted && !typing && queue.length === 0,
    sleep(on) {
      asleep = on;
      sprite.classList.toggle("asleep", on);
      face();
    },
  };
})();

// ---------- ひみつのワープゾーン（コナミコマンド or ピクセを10連打） ----------
const secret = (() => {
  const link = document.getElementById("secret-link");
  const CODE = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];
  let pos = 0;
  let open = false;

  function unlock() {
    if (open) return;
    open = true;
    sound.sfx.powerup();
    stars.warp();
    document.body.classList.add("secret-mode");
    link.style.setProperty("--i", -5); // 出現アニメーションを待たせない
    link.hidden = false;
    score.add(5000, innerWidth / 2, innerHeight / 3);
    npc.say(["ひみつの ワープゾーンが\nひらいた！", "いちばん したの ボタンを\nみてごらん。"]);
    emit("secret");
  }

  document.addEventListener("keydown", (e) => {
    if (!document.body.classList.contains("booted") || document.body.classList.contains("gaming")) return;
    if (e.target.closest?.("input, textarea")) return;
    const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    pos = key === CODE[pos] ? pos + 1 : key === CODE[0] ? 1 : 0;
    if (pos === CODE.length) {
      pos = 0;
      emit("konami");
      unlock();
    }
  });

  return { unlock };
})();

// ---------- ときどき飛んでくるUFO ----------
const ufo = (() => {
  function spawn() {
    if (document.hidden) return;
    const el = document.createElement("button");
    el.type = "button";
    el.className = `ufo ${Math.random() < 0.5 ? "ltr" : "rtl"}`;
    el.setAttribute("aria-label", "UFOをうつ");
    el.style.top = `${40 + Math.floor(Math.random() * 160)}px`;
    el.innerHTML = pixelSvg(UFO);

    el.addEventListener("click", (e) => {
      // 飛んでいた位置で止めてから爆発させる
      el.style.left = `${el.getBoundingClientRect().left}px`;
      el.innerHTML = pixelSvg(BOOM);
      el.classList.add("boom");
      sound.sfx.boom();
      score.add(1000, ...pointOf(e, el));
      npc.say(["ナイスショット！"]);
      emit("ufo-down");
      setTimeout(() => el.remove(), 450);
    });
    el.addEventListener("animationend", (e) => {
      if (e.animationName.startsWith("ufo-")) el.remove();
    });
    document.body.append(el);
  }

  function schedule(delay) {
    setTimeout(() => {
      spawn();
      schedule(20000 + Math.random() * 20000);
    }, delay);
  }

  return {
    start() {
      if (!reduceMotion) schedule(15000);
    },
  };
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
    btn.addEventListener("mouseenter", () => pointerMoved && sound.sfx.hover());
    btn.addEventListener("focus", sound.sfx.hover);
    // リンクを押すとワープ（新しいタブで開くので、このページはそのまま）
    btn.addEventListener("click", (e) => {
      sound.sfx.select();
      stars.warp();
      score.add(100, ...pointOf(e, btn));
      emit("warp", { icon: btn.querySelector("[data-icon]")?.dataset.icon });
      if (!reduceMotion) {
        document.body.classList.remove("shake");
        void document.body.offsetWidth;
        document.body.classList.add("shake");
      }
    });
  });

  bgmToggle.addEventListener("click", () => {
    bgmOn = !bgmOn;
    renderToggle();
    try {
      localStorage.setItem("warpix-bgm", bgmOn ? "on" : "off");
    } catch {}
    if (bgmOn) sound.bgmPlay();
    else sound.bgmStop();
    emit("bgm", { on: bgmOn });
  });

  // よそ見するとポーズ
  const baseTitle = document.title;
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      document.title = "PAUSE ⏸ " + baseTitle;
      sound.pause();
    } else {
      document.title = baseTitle;
      sound.resume();
    }
  });

  // スタートをクリックした位置にボタンが滑り込んでくると、マウスを動かしていなくても
  // mouseenter が起きてしまう。実際にマウスが動くまではホバー音を鳴らさない
  let pointerMoved = false;
  let startX = null;
  let startY = null;
  addEventListener("pointermove", (e) => {
    if (startX === null || e.clientX !== startX || e.clientY !== startY) pointerMoved = true;
  });

  let started = false;
  function start(e) {
    if (started) return;
    started = true;
    pointerMoved = false;
    startX = e?.clientX ?? null;
    startY = e?.clientY ?? null;
    sound.sfx.start();
    if (bgmOn) sound.bgmPlay(0.8);
    startScreen.classList.add("leaving");
    setTimeout(() => {
      startScreen.hidden = true;
      document.body.classList.add("booted");
      setTimeout(npc.intro, reduceMotion ? 0 : 1600);
      ufo.start();
      emit("boot");
    }, 450);
  }

  startScreen.hidden = false;
  startScreen.addEventListener("click", start);
  startBtn.focus();
})();
