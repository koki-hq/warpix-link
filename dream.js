// ---------- ピクセの ゆめ：ねむっている あいだ、あたまの うえに ゆめの ふきだし ----------
// さいきん いっしょに した こと（日記）が ゆめに でる。なければ ひつじを かぞえる。
// おこすと「……◯◯の ゆめ みてた」と おしえてくれる。
const dream = (() => {
  const W = 24;
  const H = 14;
  const FRAME_MS = 650;
  const SCENE_MS = 4200;

  // 小さな ドット絵（2 コマ）。[名前, ゆめの なまえ, 1 コマめ, 2 コマめ]
  const blank = () => Array.from({ length: H }, () => Array(W).fill("."));
  const put = (g, rows, x, y) =>
    rows.forEach((row, j) => [...row].forEach((ch, i) => {
      if (ch !== "." && g[y + j] && x + i >= 0 && x + i < W) g[y + j][x + i] = ch;
    }));
  const done = (g) => g.map((r) => r.join(""));

  const SHEEP = [".wwwww...", "wwwwwwwvv", "wwwwwwwvv", ".wwwwww..", ".v.v.v.v."];
  const FENCE = ["y...y...y", "yyyyyyyyy", "y...y...y", "yyyyyyyyy", "y...y...y"];
  const MOON = ["..yyy.", ".yyy..", "yyy...", "yyy...", ".yyy..", "..yyy."];
  const SHIP = ["..cccccc..", ".cccccccc.", "wwwwwwwwww", "wpwwpwwpww", ".w......w."];
  const NOTE = ["..cc", "..cp", "..c.", "ccc.", "cc.."];
  const FLAG = ["cc...", "cccc.", "cc...", "c....", "c...."];
  const COIN = [".yy.", "yyyy", "yyyy", ".yy."];
  const CROWN = ["y.yy.y", "yyyyyy", "ypyypy", "yyyyyy"];
  const STAR = [".y.", "yyy", ".y."];

  const SCENES = {
    sheep: {
      name: "ひつじを かぞえる",
      frames: [0, 1].map((f) => {
        const g = blank();
        put(g, FENCE, 8, 9);
        put(g, SHEEP, f ? 11 : 1, f ? 2 : 9);
        return done(g);
      }),
    },
    moon: {
      name: "おつきさまに いく",
      frames: [0, 1].map((f) => {
        const g = blank();
        put(g, MOON, 15, 2);
        put(g, STAR, f ? 3 : 7, f ? 8 : 3);
        put(g, ["w"], f ? 9 : 2, f ? 2 : 10);
        return done(g);
      }),
    },
    boss: {
      name: "ボスと たたかう",
      frames: [0, 1].map((f) => {
        const g = blank();
        put(g, SHIP, f ? 9 : 5, 1);
        put(g, ["c", "c"], 11, f ? 8 : 10);
        put(g, ["..w..", ".www.", "wwwww"], 9, 11);
        return done(g);
      }),
    },
    ufo: {
      name: "UFOに のる",
      frames: [0, 1].map((f) => {
        const g = blank();
        put(g, SHIP, 7, f ? 3 : 4);
        put(g, ["c..c..c", ".c.c.c."], 8, f ? 9 : 10);
        return done(g);
      }),
    },
    song: {
      name: "きょくを つくる",
      frames: [0, 1].map((f) => {
        const g = blank();
        put(g, NOTE, 4, f ? 3 : 5);
        put(g, NOTE, 11, f ? 6 : 2);
        put(g, NOTE, 18, f ? 2 : 6);
        return done(g);
      }),
    },
    adventure: {
      name: "ぼうけんする",
      frames: [0, 1].map((f) => {
        const g = blank();
        put(g, ["vvvvvvvvvvvvvvvvvvvvvvvv"], 0, 13);
        put(g, FLAG, 19, 8);
        put(g, COIN, f ? 6 : 10, f ? 3 : 5);
        put(g, ["..w..", ".www.", "wwwww"], f ? 2 : 4, 10);
        return done(g);
      }),
    },
    rank: {
      name: "ランキング 1いに なる",
      frames: [0, 1].map((f) => {
        const g = blank();
        put(g, CROWN, 9, f ? 2 : 3);
        put(g, ["yyyyyy", "y....y", "yyyyyy"], 9, 9);
        put(g, STAR, f ? 2 : 19, 2);
        return done(g);
      }),
    },
  };
  // 日記の できごと → ゆめ
  const FROM_DIARY = { boss: "boss", raid: "boss", ufo: "ufo", song: "song", shelf: "song", gift: "song", adventure: "adventure", ghost: "adventure", rank: "rank" };

  // いちばん よく行く リンクの ゆめ（行ったことが あれば）
  function linkScene() {
    const stats = store.get("warpix-links", {}) ?? {};
    const icon = Object.entries(stats).sort((a, b) => (b[1]?.n ?? 0) - (a[1]?.n ?? 0))[0]?.[0];
    const link = icon && document.querySelector(`.pixel-btn:not(.secret) [data-icon="${icon}"]`)?.closest("a");
    if (!link || !ICONS[icon]) return null;
    const rows = ICONS[icon].map((r) => r.replaceAll("#", "p"));
    return {
      name: `${linkLabel(link)}へ ワープする`,
      frames: [0, 1].map((f) => {
        const g = blank();
        put(g, rows, 6, 1);
        put(g, STAR, f ? 2 : 20, f ? 9 : 2);
        return done(g);
      }),
    };
  }

  // こんかいの ゆめ（さいきん 2 しゅうかんの 日記から、さいだい 3 つ。たりなければ ひつじと つき）
  function pickScenes() {
    const since = Date.now() - 14 * 86400000;
    const recent = grow.state.diary.filter((e) => Date.parse(`${e.date}T00:00:00`) >= since).reverse();
    const ids = [];
    for (const e of recent) {
      const id = FROM_DIARY[e.type];
      if (id && !ids.includes(id)) ids.push(id);
    }
    const list = ids.slice(0, 3).map((id) => SCENES[id]);
    const link = linkScene();
    if (link) list.splice(1, 0, link);
    if (list.length < 2) list.push(SCENES.sheep, SCENES.moon);
    return list.slice(0, 4);
  }

  // ---------- ふきだし ----------
  const sprite = document.querySelector(".npc-sprite");
  const bubble = document.createElement("span");
  bubble.className = "dream";
  bubble.setAttribute("aria-hidden", "true");
  bubble.hidden = true;
  sprite.append(bubble);

  let scenes = [];
  let scene = 0;
  let frame = 0;
  let timer = 0;
  let sceneTimer = 0;
  let lastDream = null;

  const drawFrame = () => (bubble.innerHTML = pixelSvg(scenes[scene].frames[frame]));
  function start() {
    if (document.body.classList.contains("simple")) return;
    scenes = pickScenes();
    scene = 0;
    frame = 0;
    bubble.hidden = false;
    drawFrame();
    lastDream = scenes[0].name;
    clearInterval(timer);
    clearInterval(sceneTimer);
    if (reduceMotion) return; // うごきを へらす ときは、1 まいの え だけ
    timer = setInterval(() => {
      frame = 1 - frame;
      drawFrame();
    }, FRAME_MS);
    sceneTimer = setInterval(() => {
      scene = (scene + 1) % scenes.length;
      lastDream = scenes[scene].name;
      drawFrame();
    }, SCENE_MS);
  }
  // ページごと ねむるときは とめる（え は のこす）
  function pause() {
    clearInterval(timer);
    clearInterval(sceneTimer);
  }
  // おきたとき：ふきだしを けして、みていた ゆめの なまえを かえす（みていなければ null）
  function stop() {
    pause();
    bubble.hidden = true;
    const d = lastDream;
    lastDream = null;
    if (d) {
      emit("dream", { name: d });
      grow.write("dream", `${d} ゆめを みたって。`);
    }
    return d;
  }

  return { start, pause, stop, pickScenes, SCENES, isOpen: () => !bubble.hidden };
})();
