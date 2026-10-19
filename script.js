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

// カセット えらびの アイコン（cassette.js）も いっしょに
for (const c of CASSETTES.LIST) if (c.icon) ICONS[c.id] = c.icon;

// 多色スプライト用のパレット（o=輪郭 w=白 p=ピンク c=シアン y=金）
// CSS変数で塗るので、配色モードが変わるとスプライトの色もいっしょに変わる
const PALETTE = {
  "#": "currentColor",
  o: "var(--shadow)",
  w: "var(--fg)",
  p: "var(--accent)",
  c: "var(--accent-2)",
  y: "var(--gold)",
  v: "var(--muted)",
  k: "var(--pumpkin)",
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

// ピクセに帽子などを重ねる。hat = { top: 何行目から, rows: [...] }、"." は透明
let currentHat = null;
// 成長して手に入れたもの（スカーフ・マントなど。grow.js が決める）も、帽子の下に重ねる
let growthLayers = [];
function overlay(frame, layer) {
  return frame.map((row, y) => {
    const over = layer.rows[y - layer.top];
    if (!over) return row;
    return [...row].map((ch, x) => (over[x] && over[x] !== "." ? over[x] : ch)).join("");
  });
}
function dress(frame, hat = currentHat, layers = growthLayers) {
  let rows = frame;
  for (const layer of layers) rows = overlay(rows, layer);
  return hat ? overlay(rows, hat) : rows;
}

// 放っておかれて、ページごと眠っているとき（星も点滅も止めて、電池をつかわない）
const dozing = () => document.body.classList.contains("dozing");

// リンクボタンの名前（YOUTUBE など）。▶・アイコン・読み上げ用の文字・ハートは除いて、ボタン自身の文字だけ
const linkLabel = (el) => [...el.childNodes].filter((n) => n.nodeType === Node.TEXT_NODE).map((n) => n.textContent).join("").trim();

// ミニゲーム・ぼうけん中など、キー入力をページ側で使わないとき
const playing = () =>
  document.body.classList.contains("gaming") || document.body.classList.contains("adventuring");

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

// 同じ色が横にならんだマスは 1 本の線にまとめ、色ごとに 1 つの <path> にする
// （1 マス 1 要素だと、アイコンとピクセだけでページの部品が千を超えてしまう）
function pixelSvg(rows, palette = PALETTE) {
  const paths = new Map(); // 色 → d
  rows.forEach((row, y) => {
    for (let x = 0; x < row.length; ) {
      const ch = row[x];
      let end = x + 1;
      while (end < row.length && row[end] === ch) end++;
      const fill = palette[ch];
      if (fill) paths.set(fill, `${paths.get(fill) ?? ""}M${x} ${y}h${end - x}v1h${x - end}z`);
      x = end;
    }
  });
  const body = [...paths].map(([fill, d]) => `<path d="${d}" style="fill:${fill}"/>`).join("");
  return `<svg viewBox="0 0 ${rows[0].length} ${rows.length}" shape-rendering="crispEdges" aria-hidden="true">${body}</svg>`;
}

document.querySelectorAll("[data-icon]").forEach((el) => {
  const rows = ICONS[el.dataset.icon];
  if (rows) el.innerHTML = pixelSvg(rows);
});

// 動きを減らす：OS の設定か、このサイトの「せってい」で選んだとき（<head> で html に reduce-motion クラスがつく）
const reduceMotion =
  matchMedia("(prefers-reduced-motion: reduce)").matches || document.documentElement.classList.contains("reduce-motion");

// きょうの日付。?date=2026-10-31 のように付けると、その日のページを先取りできる（季節イベントの確認用）
const today = (() => {
  const q = new URLSearchParams(location.search).get("date");
  const fixed = q && /^\d{4}-\d{2}-\d{2}$/.test(q) ? new Date(`${q}T12:00:00`) : null;
  return () => (fixed && !isNaN(fixed) ? new Date(fixed) : new Date());
})();

// UFO の見た目（季節イベントでコウモリなどに変わる）
let ufoLook = UFO;

// ---------- サウンド（Web Audio API で8bit風に鳴らす） ----------
const sound = (() => {
  let ctx = null;
  let bgmGain = null;
  let noiseBuffer = null;

  // ブラウザの自動再生制限があるので、最初のクリック以降に作る
  function ensure() {
    // 裏に いる ページは 音を おこさない。だれかに てを ふられても、ポケットの なかで BGM が なりださないように（v1.47.2）
    if (document.hidden) return false;
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      ctx = new AC();
      bgmGain = ctx.createGain();
      bgmGain.gain.value = 0;
      bgmGain.connect(ctx.destination);
      // 効果音はまとめてこのつまみを通す（せっていの「こうかおん」の音量）
      sfxGain = ctx.createGain();
      sfxGain.gain.value = seVol;
      sfxGain.connect(ctx.destination);

      noiseBuffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const data = noiseBuffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    }
    // iPhone には「suspended」の ほかに「interrupted」も ある。どちらでも おこす
    if (ctx.state !== "running") ctx.resume().catch(() => {});
    return true;
  }

  // 音量（0〜1）。せっていで変えられる
  let sfxGain = null;
  let bgmVol = 1;
  let seVol = 1;
  function setVolumes({ bgm = bgmVol, se = seVol }) {
    bgmVol = bgm;
    seVol = se;
    if (!ctx) return;
    sfxGain.gain.setValueAtTime(seVol, ctx.currentTime);
    if (timer) bgmGain.gain.setValueAtTime(bgmVol, ctx.currentTime);
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
    osc.connect(gain).connect(dest ?? sfxGain);
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
      noise(t, 0.4, 0.15, sfxGain);
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
      if (ctx) noise(ctx.currentTime, 0.12, 0.08, sfxGain);
    },
    // 自機がやられた
    damage() {
      if (!ctx) return;
      const t = ctx.currentTime;
      noise(t, 0.5, 0.12, sfxGain);
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
    // かみなりのゴロゴロ（低い三角波とノイズ）
    rumble() {
      if (!ctx) return;
      const t = ctx.currentTime;
      noise(t, 1.2, 0.05, sfxGain);
      tone({ freq: 70, start: t, dur: 1.2, type: "triangle", vol: 0.15, slideTo: 35 });
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
  const DEFAULT_SONG = {
    lead: [
      76, null, 72, 69, 72, 76, 81, null,
      77, null, 76, 72, 69, 72, 77, null,
      79, null, 76, 72, 76, 79, 84, null,
      83, 81, 79, 74, 71, 74, 79, null,
    ],
    bass: [45, 41, 48, 43],
  };
  let LEAD = DEFAULT_SONG.lead;
  let BASS = DEFAULT_SONG.bass;
  let lastPlayed = -1; // いま鳴っている 8分音符の番号（作曲画面の再生位置の表示用）

  let timer = null;
  let step = 0;
  let nextTime = 0;
  let stepDur = STEP; // setTempo でテンポを変えられる
  let baseMult = 1; // 自分の曲のテンポ（setBpm）。setTempo の倍率はこれにかける

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
    bgmGain.gain.setValueAtTime(bgmVol, ctx.currentTime);
    timer = setInterval(() => {
      if (!ctx) return;
      // タブが裏に回って遅れたときは、まとめて鳴らさず今から再開する
      if (nextTime < ctx.currentTime) nextTime = ctx.currentTime + 0.05;
      while (nextTime < ctx.currentTime + 0.12) {
        scheduleStep(step, nextTime);
        const at = step;
        setTimeout(() => (lastPlayed = at), Math.max(0, (nextTime - ctx.currentTime) * 1000));
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
  const pause = () => ctx?.suspend().catch(() => {});
  // もどったら 音の そうちを つくりなおす。iPhone では リンク先で 動画などが 音を つかうと、
  // もどった あとの 音が ゆっくり・かさなって くずれる ことが ある（v1.47.2）。せっていと BGM は ひきつぐ
  function resume() {
    if (!ctx) return;
    const old = ctx;
    ctx = null;
    old.close().catch(() => {});
    if (!ensure()) return;
    nextTime = ctx.currentTime + 0.05;
    if (timer) bgmGain.gain.setValueAtTime(bgmVol, ctx.currentTime);
    // タップを もらうまで 音を ださせて くれない ときは、つぎの タップで おこす
    if (ctx.state !== "running") addEventListener("pointerdown", () => ctx?.state !== "running" && ctx?.resume().catch(() => {}), { once: true, capture: true });
  }

  // 1 = ふつう、1.5 = 1.5倍速（パーティーやスタッフロールで一時的に変える。自分の曲のテンポにかけ算する）
  let tempoMult = 1;
  const applyTempo = () => (stepDur = STEP / (baseMult * tempoMult));
  const setTempo = (mult) => {
    tempoMult = mult;
    applyTempo();
  };
  // 曲そのもののテンポ（BPM）。作曲した曲で使う
  const setBpm = (bpm) => {
    baseMult = bpm / BPM;
    applyTempo();
  };

  // 曲を差しかえる（季節イベント・作曲）。lead は 8分音符ごと、bass は 1小節ごと（lead の長さ ÷ 8 個）
  function setSong({ lead, bass }) {
    LEAD = lead;
    BASS = bass;
    step = step % LEAD.length;
  }

  return {
    sfx, bgmPlay, bgmStop, pause, resume, setTempo, setBpm, setSong, setVolumes,
    volumes: () => ({ bgm: bgmVol, se: seVol }),
    defaultSong: DEFAULT_SONG,
    song: () => ({ lead: LEAD, bass: BASS }),
    playing: () => !!timer,
    position: () => (timer ? lastPlayed : -1),
    // 作曲画面で音を確かめる（1 音だけ鳴らす）
    preview(n) {
      if (ensure()) tone({ freq: midi(n), start: ctx.currentTime, dur: 0.18, vol: 0.06 });
    },
  };
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

  // ---------- なれ（v1.50）：はじめての 人には ていねいに、なれた 人には みじかく ----------
  // じこしょうかいと ボタンの せつめいは、はじめて きた ときだけ。そのあとは あいさつ 1 ぎょうで、
  // 会った 日が ふえるほど くだけて いく。おなじ ことばが 2 かい つづかない よう、まえの を おぼえておく
  const TIME = hour < 5 ? "late" : hour < 10 ? "morning" : hour < 17 ? "day" : "evening";
  const HELLO = {
    // 会って 2〜6 日
    warm: {
      late: ["こんな じかんに……\nもしかして よふかし？", "しーっ。\nみんな ねてる じかん だよ。"],
      morning: ["おはよう！\nきょうも いい そら。", "おはよう！\nよく ねむれた？", "おはよう！\nきょうは どこへ ワープする？"],
      day: ["こんにちは！\nきょうも きてくれたね。", "こんにちは！\nきょうは どこへ ワープする？", "あ、こんにちは！\nちょうど ひまだったんだ。"],
      evening: ["こんばんは！\nほしが でてきたよ。", "こんばんは！\nきょうも おつかれさま。", "こんばんは！\nよるの そらへ ようこそ。"],
    },
    // 会って 7 日から（なかよし）
    close: {
      late: ["……ふあ。\nきみも ねむれないの？", "よふかし なかま だね。"],
      morning: ["おはよ！", "あ、おはよう。\nまってたよ。", "おはよー。\nきょうも いこっか。"],
      day: ["や！", "きたきた！", "おっ、きみか。"],
      evening: ["こんばんは。\nきょうも おつかれ。", "おかえり、\nきょうは どうだった？", "よるの ぶ、はじまり！"],
    },
  };
  // おなじ 日に もう いちど 来た とき
  const AGAIN = ["あ、おかえり！", "さっきぶり！", "おっ、また きたね。", "おかえりー。"];
  // ときどき（なかよしに なってから、その 日 はじめての ときだけ）
  const RARE = [
    "きみが くると、ほしが\nちょっと ふえる きがする。",
    "……あ、ねてないよ！\nおきてたよ！",
    "きょうの ぼく、ちょっと\nかっこよくない？",
  ];

  function pickFresh(list, key) {
    const last = store.get(key, null);
    const pool = list.length > 1 ? list.filter((l) => l !== last) : list;
    const line = pool[Math.floor(Math.random() * pool.length)];
    store.set(key, line);
    return line;
  }

  function greeting() {
    const visits = store.get("warpix-visits", 1);
    const days = grow.state.days?.length ?? 1;
    if (visits <= 1) return INTRO;
    if (!grow.firstToday) return [pickFresh(AGAIN, "warpix-greet")];
    const lines = [pickFresh(HELLO[days >= 7 ? "close" : "warm"][TIME], "warpix-greet")];
    if (days >= 7 && Math.random() < 0.12) lines.push(pickFresh(RARE, "warpix-greet-rare"));
    return lines;
  }

  let queue = [];
  let full = "";
  let shown = 0;
  let typing = null;
  let lastChatter = -1;
  let introStarted = false;
  let pokeHook = null;
  const extraIntro = [];

  function render() {
    box.classList.toggle("more", !typing && queue.length > 0);
  }

  function finish() {
    clearInterval(typing);
    typing = null;
    textEl.textContent = full;
    render();
    if (pending && !pending.shown && queue.length === 0) {
      pending.shown = true;
      showChoices();
    }
  }

  function type(line) {
    clearInterval(typing);
    emit("npc-line", { line });
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

  // 選択肢つきの質問。答えの番号で解決する（ほかのセリフに割りこまれたら -1）
  let pending = null;
  function cancelAsk() {
    if (!pending) return;
    box.querySelector(".dialog-choices")?.remove();
    const p = pending;
    pending = null;
    p.resolve(-1);
  }
  function showChoices() {
    const wrap = document.createElement("div");
    wrap.className = "dialog-choices";
    pending.choices.forEach((label, i) => {
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = label;
      b.addEventListener("click", (e) => {
        e.stopPropagation();
        wrap.remove();
        const p = pending;
        pending = null;
        sound.sfx.select();
        p.resolve(i);
      });
      wrap.append(b);
    });
    box.append(wrap);
    wrap.querySelector("button").focus({ preventScroll: true });
  }
  function ask(line, choices) {
    cancelAsk();
    return new Promise((resolve) => {
      queue = [];
      type(line);
      pending = { choices, resolve, shown: false };
    });
  }

  function say(lines) {
    cancelAsk();
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
  let away = false;
  const face = () => (body.innerHTML = away ? "" : pixelSvg(dress(asleep ? NPC.blink : NPC.idle)));
  face();
  setInterval(() => {
    if (asleep || away) return;
    body.innerHTML = pixelSvg(dress(NPC.blink));
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
    if (away) return;
    jump();
    sound.sfx.coin();
    score.add(10, ...pointOf(e, sprite));

    const now = performance.now();
    pokes = now - lastPoke < 1500 ? pokes + 1 : 1;
    lastPoke = now;
    emit("poke", { streak: pokes });
    // ほかのファイルが反応を引き受けたら（すねている時など）、いつものひとことは言わない
    if (pokeHook?.(pokes)) return;
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
    ask,
    intro() {
      introStarted = true;
      say([...greeting(), ...extraIntro]);
    },
    // あいさつの最後に1行足す（boot のときに呼ぶ）
    addIntro: (line) => extraIntro.push(line),
    busy: () => !!typing || queue.length > 0 || !!pending,
    // あいさつを最後まで言い終えたか
    ready: () => introStarted && !typing && queue.length === 0 && !pending,
    sleep(on) {
      asleep = on;
      sprite.classList.toggle("asleep", on);
      face();
    },
    // ぼうけんやタブ旅行で箱を留守にする
    setAway(on) {
      away = on;
      sprite.classList.toggle("away", on);
      face();
    },
    isAway: () => away,
    setHat(hat) {
      currentHat = hat;
      face();
    },
    // 見た目を描き直す（成長したとき）
    refresh: () => face(),
    // つついたときの反応を横取りする（true を返すと、いつものひとことは言わない）
    onPoke(fn) {
      pokeHook = fn;
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
    if (!document.body.classList.contains("booted") || playing()) return;
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
    if (document.hidden || dozing()) return;
    const el = document.createElement("button");
    el.type = "button";
    el.className = `ufo ${Math.random() < 0.5 ? "ltr" : "rtl"}`;
    el.setAttribute("aria-label", "UFOをうつ");
    el.style.top = `${40 + Math.floor(Math.random() * 160)}px`;
    el.innerHTML = pixelSvg(ufoLook);
    emit("seen", { id: ufoLook === UFO ? "ufo" : "bat" });

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

// ---------- シンプルモード ----------
// 切りかえはページを読みなおして行う（動いている演出や音を、まるごと止めるため）
const simple = (() => {
  const on = document.documentElement.classList.contains("simple");
  const toggle = document.getElementById("simple-toggle");
  toggle.textContent = on ? "▶ あそぶ" : "SIMPLE";
  toggle.setAttribute("aria-label", on ? "いつもの ページに もどる" : "リンクだけの シンプルな ページに する");

  function set(next) {
    try {
      localStorage.setItem("warpix-simple", next ? "on" : "off");
    } catch {}
    const url = new URL(location.href);
    url.searchParams.delete("simple");
    location.replace(url.href);
  }

  toggle.addEventListener("click", () => set(!on));
  document.getElementById("simple-enter").addEventListener("click", () => set(true));
  return { on };
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
      // どのリンクに行ったかは、シンプルモードでも知らせる（お気に入りを覚えるため）
      emit("link", { icon: btn.querySelector("[data-icon]")?.dataset.icon });
      if (simple.on) return; // シンプルモードでは、ふつうにリンクを開くだけ
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
  // ほかの ファイルは あとから よむ（defer）。defer の ファイルが うごいている あいだは readyState が
  // もう "interactive" なので、DOMContentLoaded（defer が ぜんぶ おわった あいず）を じぶんで おぼえておく
  let allLoaded = false;
  document.addEventListener("DOMContentLoaded", () => (allLoaded = true), { once: true });
  let waiting = false;
  function start(e) {
    if (started || simple.on) return;
    // そろう まえに おされたら、そろってから はじめる
    // （そうしないと、あとの ファイルが「はじまった」合図を うけとりそこねる）
    if (!allLoaded) {
      if (waiting) return;
      waiting = true;
      startBtn.textContent = "NOW LOADING...";
      document.addEventListener("DOMContentLoaded", () => {
        startBtn.textContent = "PRESS START";
        start(e);
      }, { once: true });
      return;
    }
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

  // シンプルモードなら、スタート画面も演出も出さずにリンクだけ
  if (simple.on) return;
  startScreen.hidden = false;
  startScreen.addEventListener("click", (e) => {
    if (!e.target.closest(".simple-enter")) start(e);
  });
  startBtn.focus();
})();
