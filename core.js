// ---------- v2.0 の どだい：保存・日付・ドット絵・アイコン・音・せってい ----------
// v2.0 は v1.66.3 から お遊びを 引き算して、リンクアプリに しぼった（2026-11-10、本人「一つのアプリに目的は一つ」）。
// 見た目と しくみは v1 の まま（script.js・cassette.js・warp.js などから もってきた）。
// 保存は warpix-v2- で はじまる キー だけ。v1 の きろく（warpix-…）は よまない・けさない（べつの アプリで ひろえる かもしれない）

// ---------- 保存 ----------
const store = {
  get(key, fallback) {
    try {
      const v = localStorage.getItem(key);
      return v === null ? fallback : JSON.parse(v);
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {}
  },
  remove(key) {
    try {
      localStorage.removeItem(key);
    } catch {}
  },
};
const KEY = {
  groups: "warpix-v2-groups",
  current: "warpix-v2-current",
  log: "warpix-v2-log",
  settings: "warpix-v2-settings",
  mail: "warpix-v2-mail",
  manual: "warpix-v2-manual",
  pixe: "warpix-v2-pixe",
  mylinks: "warpix-v2-mylinks",
  tips: "warpix-v2-tips",
  invite: "warpix-v2-invite",
  photos: "warpix-v2-photos",
};

// ---------- 日付 ----------
// ?date=2026-12-24 を つけると その日の ページに なる（季節の 衣装の 確認と テスト用）
const today = (() => {
  const q = new URLSearchParams(location.search).get("date");
  const fixed = q && /^\d{4}-\d{2}-\d{2}$/.test(q) ? new Date(`${q}T12:00:00`) : null;
  return () => (fixed && !isNaN(fixed) ? new Date(fixed) : new Date());
})();
const pad2 = (n) => String(n).padStart(2, "0");
const ymdOf = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

// 動きを へらす（OS の 設定）
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

// ---------- ドット絵 ----------
// 多色スプライト用のパレット（o=輪郭 w=白 p=ピンク c=シアン y=金 ほか 衣装の 色）
const PALETTE = {
  "#": "currentColor",
  o: "#000",
  w: "#f4f4f4",
  p: "#ff4fa3",
  c: "#3ee8ff",
  y: "#ffd84a",
  v: "#8a80b8",
  k: "#ff8a1f",
  R: "#e8463c",
  G: "#4caf50",
  D: "#2e7d4f",
  B: "#8a5a2e",
  N: "#2f3f8f",
};

// 同じ色が横にならんだマスは 1 本の線にまとめ、色ごとに 1 つの <path> にする
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

// 画面の ボタンに つかう ドットの しるし
const GLYPH = {
  menu: ["#########", ".........", ".........", "#########", ".........", ".........", "#########"],
  // ＋ は ほそく（ふとい と 赤十字に みえた）
  plus: ["....#....", "....#....", "....#....", "....#....", "#########", "....#....", "....#....", "....#....", "....#...."],
  left: [".....#", "....##", "...###", "..####", ".#####", "..####", "...###", "....##", ".....#"],
  right: ["#.....", "##....", "###...", "####..", "#####.", "####..", "###...", "##....", "#....."],
  mail: ["###########", "##.......##", "#.#.....#.#", "#..#...#..#", "#...#.#...#", "#....#....#", "#.........#", "###########"],
};
document.querySelectorAll("[data-glyph]").forEach((el) => {
  el.innerHTML = pixelSvg(GLYPH[el.dataset.glyph], { ...PALETTE, "#": "currentColor" });
});

// リンクの アイコン（v1 の まま。たなの ほかの アイコンは cassette.js が もつ）
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
  // X：公式の マーク（太い ななめは 中が ぬけた 2 本線、ほそい ななめは とちゅうで きれる）
  twitter: [
    "###........#",
    ".#.#......#.",
    ".#.#.....#..",
    "..#.#...#...",
    "...#.#.#....",
    "....#.#.....",
    "....#.#.....",
    "....##.#....",
    "...#..#.#...",
    "..#....#.#..",
    ".#.....#.#..",
    "#.......###.",
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

// HTML に いれる まえに もじを ふつうの もじに（ユーザーが いれた なまえ・URL）
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

// ---------- ホーム画面に 追加（PWA）と オフライン ----------
const pocket = {
  standalone: () => matchMedia("(display-mode: standalone)").matches || navigator.standalone === true,
};
// 新しい 版が とどいたら 画面で 知らせる（v2.1、本人「みんなはそうじゃない　最新のバージョンがあります。…とかいれてもいいよね」）。
// サービスワーカーが 入れかわった（controllerchange）＝ 新しい ファイルが そろった。もどって きた ときにも 新しい 版を さがす
if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
  const hadController = !!navigator.serviceWorker.controller;
  addEventListener("load", () =>
    navigator.serviceWorker
      .register("sw.js")
      .then((reg) => document.addEventListener("visibilitychange", () => !document.hidden && reg.update().catch(() => {})))
      .catch(() => {})
  );
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (!hadController) return; // はじめて 来た 人は いま 入った だけ
    // まんなかの まどで（v2.1.2、本人「ど真ん中に出していいよ　モーダルとして　絶対更新させるように」）。Esc でも とじない
    const d = document.getElementById("update-dialog");
    if (!d || d.open) return;
    for (const o of document.querySelectorAll("dialog[open]")) o.close();
    d.addEventListener("cancel", (e) => e.preventDefault());
    d.showModal();
  });
  document.getElementById("update-btn")?.addEventListener("click", () => location.reload());
}

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
      // iPhone に「BGM は 背景の 音」と つたえる。Spotify など ほかの 音を とめたり、
      // 音の つかいかたを うばったり しない（マナーモードでは 鳴らない）（v1.50.2）
      try {
        if (navigator.audioSession) navigator.audioSession.type = "ambient";
      } catch {}
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
    // 流れ星（キラキラ下がる）
    twinkle() {
      if (!ensure()) return;
      const t = ctx.currentTime;
      [96, 91, 88, 84, 79].forEach((n, i) => tone({ freq: midi(n), start: t + i * 0.04, dur: 0.12, vol: 0.04 }));
    },
  };

  // BGM：Am → F → C → G の 4 小節ループ（8分音符きざみ、null は休符）。v1 から ずっと ながれて いる 曲。
  // もう 1 きょく（すこし ゆったり）は 本人に 中身を みせてから たす（2026-11-10）
  const SONGS = {
    usual: {
      bpm: 140, wave: "square", leadVol: 0.04, bassVol: 0.12, hat: true,
      lead: [
        76, null, 72, 69, 72, 76, 81, null,
        77, null, 76, 72, 69, 72, 77, null,
        79, null, 76, 72, 76, 79, 84, null,
        83, 81, 79, 74, 71, 74, 79, null,
      ],
      bass: [45, 41, 48, 43],
    },
  };
  let song = SONGS.usual;
  let lastPlayed = -1;

  let timer = null;
  let step = 0;
  let nextTime = 0;
  let stepDur = 60 / song.bpm / 2;

  function scheduleStep(i, t) {
    const n = song.lead[i];
    if (n) tone({ freq: midi(n), start: t, dur: stepDur * 0.9, type: song.wave, vol: song.leadVol, dest: bgmGain });
    const root = song.bass[Math.floor(i / 8)] + (i % 2 ? 12 : 0);
    tone({ freq: midi(root), start: t, dur: stepDur * 0.9, type: "triangle", vol: song.bassVol, dest: bgmGain });
    if (song.hat && i % 2 === 1) noise(t, 0.03, 0.03, bgmGain);
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
        step = (step + 1) % song.lead.length;
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
    setWaiting(false);
    const old = ctx;
    ctx = null;
    old.close().catch(() => {});
    if (!ensure()) return;
    nextTime = ctx.currentTime + 0.05;
    if (timer) bgmGain.gain.setValueAtTime(bgmVol, ctx.currentTime);
    // タップを もらうまで 音を ださせて くれない ときは、つぎの タップで おこす。
    // まつ あいだは BGM ボタンに「TAP」と だす。ON なのに しずかだと、こわれたかと ふあんに なるから（v1.50.2）
    // （つくりたては すこしの あいだ suspended なので、0.5 びょう まって から きめる）
    const now = ctx;
    setTimeout(() => {
      if (now !== ctx || now.state === "running" || document.hidden) return;
      setWaiting(true);
      now.addEventListener("statechange", () => now === ctx && now.state === "running" && setWaiting(false));
    }, 500);
  }
  // iPhone は ゆびを はなした とき（touchend・click）しか 音を おこさせて くれない。
  // pointerdown では むしされて、「TAP」の まま なおらなかった（v1.50.3）
  const wake = () => waiting && ensure();
  addEventListener("touchend", wake, { capture: true, passive: true });
  addEventListener("click", wake, { capture: true });
  let waiting = false;
  let onWaiting = () => {};
  function setWaiting(v) {
    if (waiting === v) return;
    waiting = v;
    onWaiting(v);
  }

  // 曲を えらぶ（せっていの BGM タブ）
  function setSong(id) {
    song = SONGS[id] ?? SONGS.usual;
    stepDur = 60 / song.bpm / 2;
    step = step % song.lead.length;
  }

  return {
    sfx, bgmPlay, bgmStop, pause, resume, setSong, setVolumes,
    waiting: () => waiting,
    onWaiting: (fn) => (onWaiting = fn),
    volumes: () => ({ bgm: bgmVol, se: seVol }),
    songs: SONGS,
    songId: () => Object.keys(SONGS).find((k) => SONGS[k] === song),
    playing: () => !!timer,
    position: () => (timer ? lastPlayed : -1),
  };
})();

// ---------- ドラッグで ならべかえ（v2.2）----------
// 本人「ドラッグ&ドロップで並び順とか変えたり」。外の ライブラリは つかわない（ポインターの イベントだけ）。
// box の なかの item を つかんで（handle が あれば そこだけ）、8px うごいたら ドラッグ。ゆびの 下の ものと その場で 入れかわる。
// はなすと onEnd(あたらしい じゅんばんの data-id)。canStart() が false なら ドラッグに しない（スクロールや スワイプに まかせる）
// hold（ミリ秒）：handle の そと（行の どこでも）は 長押ししてから つかむ（v2.2.1、本人「タイトルも含めてそのブロックを長押ししたら」）。
// 長押しの まえに うごいたら スクロールに まかせる。つかんだら 画面は スクロールさせない
// edge（v2.5）：{ flip(dir, it) }。つかんだ まま 画面の 左右の はしで 0.5 びょう とまると flip(-1 か 1) を よぶ（iPhone の ホーム画面の ページ めくり）。
// flip は box の なかみを かえて よい（it は けさない こと）。true なら めくれた。はしに いる あいだは 0.5 びょう ごとに つづけて めくる。
// onEnd の 2 つめは つかんで いた もの
function makeSortable(box, { item, handle = null, hold = 0, onEnd, canStart = () => true, edge = null }) {
  let drag = null;
  const EDGE = 36; // はしの はば（px）
  const EDGE_HOLD = 500;
  let edgeTimer = null;
  const place = () => (drag.it.style.translate = `${drag.px - drag.x}px ${drag.py - drag.y}px`);
  function edgeCheck() {
    if (!edge || !drag?.on) return;
    const dir = drag.px < EDGE ? -1 : drag.px > innerWidth - EDGE ? 1 : 0;
    if (dir !== drag.edgeDir) {
      clearTimeout(edgeTimer);
      edgeTimer = null;
      drag.edgeDir = dir;
    }
    if (dir && !edgeTimer) edgeTimer = setTimeout(flipNow, EDGE_HOLD);
  }
  function flipNow() {
    edgeTimer = null;
    if (!drag?.on || !drag.edgeDir) return;
    const before = drag.it.getBoundingClientRect();
    if (!edge.flip(drag.edgeDir, drag.it)) return;
    const after = drag.it.getBoundingClientRect();
    drag.x += after.left - before.left;
    drag.y += after.top - before.top;
    place();
    edgeCheck();
  }
  box.addEventListener("pointerdown", (e) => {
    if (e.button !== 0) return;
    const it = e.target.closest(item);
    if (!it || !box.contains(it)) return;
    const onHandle = !handle || !!e.target.closest(handle);
    if (!onHandle && !hold) return;
    if (!onHandle && e.target.closest("button:not(.grip), a, input")) return; // 行の なかの ボタン（はずす など）は ふつうに
    drag = { it, id: e.pointerId, x: e.clientX, y: e.clientY, on: false, armed: onHandle };
    if (!onHandle)
      drag.timer = setTimeout(() => {
        if (!drag || drag.it !== it) return;
        drag.armed = true;
        it.classList.add("lifted");
        navigator.vibrate?.(10);
        sound.sfx.hover();
      }, hold);
  });
  box.addEventListener("touchmove", (e) => drag?.armed && e.cancelable && e.preventDefault(), { passive: false });
  box.addEventListener("contextmenu", (e) => drag && e.preventDefault());
  addEventListener(
    "pointermove",
    (e) => {
      if (!drag || e.pointerId !== drag.id) return;
      if (!drag.on) {
        if (Math.hypot(e.clientX - drag.x, e.clientY - drag.y) < 8) return;
        if (!drag.armed) {
          clearTimeout(drag.timer);
          return (drag = null);
        }
        if (!canStart(drag.it)) return (drag = null);
        drag.on = true;
        drag.it.classList.add("dragging");
        box.classList.add("sorting");
        sound.sfx.hover();
      }
      e.preventDefault();
      drag.px = e.clientX;
      drag.py = e.clientY;
      place();
      edgeCheck();
      drag.it.style.pointerEvents = "none";
      const under = document.elementFromPoint(e.clientX, e.clientY)?.closest(item);
      drag.it.style.pointerEvents = "";
      if (!under || under === drag.it || !box.contains(under)) return;
      const list = [...box.querySelectorAll(item)];
      const before = drag.it.getBoundingClientRect();
      under[list.indexOf(drag.it) < list.indexOf(under) ? "after" : "before"](drag.it);
      const after = drag.it.getBoundingClientRect();
      // いれかわった ぶん 起点を ずらす（ゆびの 下に いた ままに）
      drag.x += after.left - before.left;
      drag.y += after.top - before.top;
      drag.it.style.translate = `${e.clientX - drag.x}px ${e.clientY - drag.y}px`;
      sound.sfx.hover();
    },
    { passive: false }
  );
  const end = (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const d = drag;
    drag = null;
    clearTimeout(d.timer);
    clearTimeout(edgeTimer);
    edgeTimer = null;
    d.it.classList.remove("lifted");
    if (!d.on) return;
    d.it.classList.remove("dragging");
    box.classList.remove("sorting");
    d.it.style.translate = "";
    // ドラッグの あとの click（リンクを ひらく・まどを ひらく）は むし
    const stop = (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
    };
    addEventListener("click", stop, { capture: true, once: true });
    setTimeout(() => removeEventListener("click", stop, { capture: true }), 0);
    sound.sfx.select();
    onEnd([...box.querySelectorAll(item)].map((x) => x.dataset.id), d.it);
  };
  addEventListener("pointerup", end);
  addEventListener("pointercancel", end);
  return { active: () => !!drag?.on };
}

// けす まえに たしかめる まど（v2.0.2）。ブラウザの confirm() は iPhone で 出て いる あいだ 音を とめ、
// とじても BGM が もどらない（本人「けす　ボタンを押して　キャンセルしたらBGMが消えちゃう」「BGM止まったままだよ」）。
// アプリの なかの まどに したので 音は とまらない。はい なら true の Promise。
// テストは window.WARPIX_ASK = true / false で まどを 出さずに こたえる
function ask(msg, yes = "けす") {
  if (typeof window.WARPIX_ASK === "boolean") return Promise.resolve(window.WARPIX_ASK);
  const d = document.getElementById("ask-dialog");
  const y = document.getElementById("ask-yes");
  const n = document.getElementById("ask-no");
  document.getElementById("ask-text").textContent = msg;
  y.textContent = yes;
  return new Promise((resolve) => {
    const done = (v) => {
      d.close();
      sound.sfx.select();
      resolve(v);
    };
    y.onclick = () => done(true);
    n.onclick = () => done(false);
    d.oncancel = (e) => {
      e.preventDefault();
      done(false);
    };
    d.showModal();
    n.focus();
  });
}

// ---------- せってい（背景の そら・BGM・おおきさ） ----------
// 背景は じぶんで えらぶ（本人「自動はだめ　やっぱユーザに何かさせないとだめ」）。さいしょは よる（v1 の そら）
const settings = (() => {
  const DEFAULTS = { sky: "night", bgm: true, se: true, bgmVol: 100, seVol: 100, song: "usual" };
  const state = { ...DEFAULTS, ...store.get(KEY.settings, null) };
  // sky は ひる・ゆうがた・よる か じぶんの がぞう の id（p-…、v2.4）
  if (!["day", "evening", "night"].includes(state.sky) && !/^p-[a-z0-9]+$/.test(state.sky)) state.sky = "night";
  if (!sound.songs[state.song]) state.song = "usual";
  const subs = [];
  const vol = (n) => Math.max(0, Math.min(100, Number(n) || 0)) / 100;
  function set(patch) {
    Object.assign(state, patch);
    store.set(KEY.settings, state);
    apply();
    subs.forEach((fn) => fn(state));
  }
  // いま 見せて いる 空（v2.3）：グループだけの はいけいが あれば そちら。メニューの「はいけい」（state.sky）は かえない
  let shown = null;
  // 月・くもの いろに つかう 空（がぞうの ときは よる）
  const sky = () => shown ?? (["day", "evening", "night"].includes(state.sky) ? state.sky : "night");
  function showSky(s) {
    shown = ["day", "evening", "night"].includes(s) ? s : null;
    document.documentElement.dataset.sky = sky();
    subs.forEach((fn) => fn(state));
  }
  function apply() {
    sound.setVolumes({ bgm: vol(state.bgmVol), se: state.se === false ? 0 : vol(state.seVol) });
    sound.setSong(state.song);
    document.documentElement.dataset.sky = sky();
  }
  apply();
  return { state, set, sky, showSky, onChange: (fn) => subs.push(fn), DEFAULTS };
})();
