// ---------- ピクセが育つ：会った日数で姿が変わり、気持ちがあり、日記をつける ----------
// 記録はこのブラウザの中だけに保存する（どこにも送らない）。
// ?date= で日付を変えて見ているときは、未来をのぞいているだけなので保存しない。
const grow = (() => {
  const KEY = "warpix-pixe";
  const preview = new URLSearchParams(location.search).has("date");
  const pad2 = (n) => String(n).padStart(2, "0");
  const ymdOf = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
  const dayDiff = (a, b) => Math.round((Date.parse(`${b}T12:00:00`) - Date.parse(`${a}T12:00:00`)) / 86400000);
  const now = today();
  const ymd = ymdOf(now);

  const state = store.get(KEY, null) ?? { born: ymd, days: [], last: null, stage: 0, sulk: false, pokeMark: 0, diary: [] };
  const save = () => !preview && store.set(KEY, state);

  // ---------- 成長の段階（会った日数＝来てくれた日の数） ----------
  const STAGES = [
    { days: 1, name: "ちびピクセ" },
    {
      days: 3, name: "スカーフの ピクセ", item: "スカーフ",
      layer: { top: 12, rows: ["..cccccccccccc..", ".........ccc...."] },
    },
    {
      days: 7, name: "マントの ピクセ", item: "マント",
      layer: {
        top: 6,
        rows: ["p..............p", "p..............p", "p..............p", "p..............p", "p..............p", "p..............p", "p..............p", "pp............pp"],
      },
    },
    {
      days: 14, name: "きんの アンテナの ピクセ", item: "きんの アンテナ",
      layer: { top: 0, rows: ["......yyyy......", ".......yy.......", ".......yy......."] },
    },
    { days: 30, name: "でんせつの ピクセ", item: "かがやき" },
  ];
  const ANGRY = { top: 0, rows: ["............p.p.", ".............p..", "............p.p."] };

  function layers() {
    const list = STAGES.slice(1, state.stage + 1).map((s) => s.layer).filter(Boolean);
    if (state.sulk) list.push(ANGRY);
    return list;
  }
  function applyLooks() {
    growthLayers = layers();
    document.getElementById("npc").classList.toggle("legend", state.stage >= 4);
    npc.refresh();
    favicon?.refresh?.();
  }

  // ---------- 日記 ----------
  const MAX_PER_DAY = 8;
  let badge = null; // 「NEW」の札（ボタンを作ってから入る）
  function write(type, text, { force = false } = {}) {
    const todays = state.diary.filter((e) => e.date === ymd);
    if (todays.some((e) => e.type === type)) return;
    // 上限の外で書いた行（force）は、ほかのできごとの行の枠を使わない
    if (!force && todays.filter((e) => !e.free).length >= MAX_PER_DAY) return;
    state.diary.push(force ? { date: ymd, type, text, free: true } : { date: ymd, type, text });
    if (state.diary.length > 500) state.diary.splice(0, state.diary.length - 500);
    save();
    renderBadge();
  }

  // ---------- 今日の来訪を記録して、気持ち・成長・記念日を決める ----------
  const firstToday = state.last !== ymd;
  const gap = state.last ? dayDiff(state.last, ymd) : null;
  const intro = [];
  let stageUp = null;
  let joy = false;

  if (firstToday) {
    if (!state.days.includes(ymd)) state.days.push(ymd);
    if (state.days.length > 400) state.days.splice(0, state.days.length - 400);

    // 気持ち
    if (gap === null) {
      write("meet", "はじめて あった。ドキドキした。", { force: true });
    } else if (gap >= 30) {
      joy = true;
      intro.push("……え！？ ほんとに きみ！？", `${gap}にちぶり だよ！\nずっと あいたかった！`);
      write("reunion", `${gap}にちぶりに きてくれた！ うれしくて とびはねた。`, { force: true });
    } else if (gap >= 7) {
      state.sulk = true;
      intro.push(`……${gap}にちも まってたんだけど。`, "……ふん。");
      write("sulk", `${gap}にち まった。ちょっと すねた。`, { force: true });
    } else if (gap >= 3) {
      intro.push(`ひさしぶり！ ${gap}にちぶり だね。\nまってたよ。`);
    }

    // 成長
    const reached = STAGES.reduce((acc, s, i) => (state.days.length >= s.days ? i : acc), 0);
    if (reached > state.stage) {
      state.stage = reached;
      stageUp = STAGES[reached];
      if (state.sulk) intro.push(`……${stageUp.item}を てにいれた。`, "……べつに うれしくないし。");
      else intro.push("……からだが あったかい……！", `${stageUp.item}を てにいれた！\n（${stageUp.name}に なった）`);
      write("grow", `${state.days.length}にち あえた。${stageUp.item}を てにいれた！`, { force: true });
    }

    // 記念日（出会ってからの日数）
    const age = dayDiff(state.born, ymd);
    if ([7, 30, 50, 100, 200, 300].includes(age) || (age > 0 && age % 365 === 0) || (age > 365 && age % 100 === 0)) {
      const label = age % 365 === 0 ? `${age / 365}ねん` : `${age}にち`;
      intro.push(`きょうで であって ${label}！\nいつも ありがとう。`);
      write("anniversary", `であって ${label}。おいわいした。`, { force: true });
    }

    // その日のひとこと（季節・時間帯）
    const hour = new Date().getHours();
    if (season.current) {
      const SEASON = { halloween: "ハロウィンの かざりつけを いっしょに みた。", christmas: "ゆきが ふってた。メリー クリスマス。", newyear: "あけまして おめでとう。ことしも よろしく。", tanabata: "あまのがわを みた。ねがいごとは ひみつ。" };
      write("season", SEASON[season.current]);
    } else if (hour < 5) {
      write("night", "よなかに きてくれた。ねむくない？");
    } else if (gap !== null && gap < 3) {
      const DAILY = ["きょうも きてくれた。", "また あえた。", "きょうも ほしが きれいだった。", "きょうは どこへ ワープするのかな。"];
      write("visit", DAILY[state.days.length % DAILY.length]);
    }
    state.last = ymd;
  }
  save();

  // ---------- すねているとき：3回つつくと ゆるしてくれる ----------
  let sulkPokes = 0;
  npc.onPoke(() => {
    if (!state.sulk) return false;
    sulkPokes++;
    if (sulkPokes < 3) {
      npc.say([["……ふん。", "……つついても だめ。"][sulkPokes - 1]]);
      return true;
    }
    state.sulk = false;
    save();
    applyLooks();
    npc.jump();
    sound.sfx.powerup();
    npc.say(["……しょうがないなあ！", "おかえり！\nほんとは すごく うれしい。"]);
    write("forgive", "つつかれて ゆるした。ほんとは うれしかった。", { force: true });
    achievements.unlock("reunion");
    return true;
  });

  applyLooks();
  intro.forEach((line) => npc.addIntro(line));
  on("boot", () => {
    if (stageUp) setTimeout(() => sound.sfx.powerup(), 2200);
    if (joy) {
      achievements.unlock("reunion");
      setTimeout(() => stars.warp(1500), 2000);
    }
    if (state.stage >= 2) achievements.unlock("growup");
  });

  // ---------- できごとを日記に ----------
  const NOTABLE = {
    "warp-zone": "ひみつの ワープゾーンを みつけられた。",
    konami: "あの コマンドを しってる ひとだった。",
    mothership: "マザーシップを たおした！ すごかった。",
    credits: "エンディングを いっしょに みた。",
    print: "にんていしょうを いんさつ してくれた？",
    hello: "しらない だれかと てを ふりあった。",
    master: "じっせきを ぜんぶ あつめた！ でんせつだ。",
  };
  // ほかの行で書いている実績は、二重に書かない
  const COVERED = new Set(["ranker", "collector", "boss", "postcard", "raid", "night-owl", "growup", "adventure", "speedrun", "reunion", "diary", "ufo", "weather", "season", "invader", "invader-pro"]);
  on("achievement", ({ id, name }) => {
    if (NOTABLE[id]) write(`ach-${id}`, NOTABLE[id]);
    else if (!COVERED.has(id)) write("ach", `じっせき「${name}」を とった。`); // ふつうの実績は 1日 1行まで
  });
  on("adventure-clear", ({ time }) => write("adventure", `いっしょに ぼうけんした。タイムは ${adventure.fmtTime(time)}。`));
  on("game-over", ({ score: s }) => s >= 300 && write("invaders", `インベーダーで ${s}てん とった。`));
  on("ufo-down", () => write("ufo", "UFOを うちおとしてくれた。"));
  on("game-rank", ({ rank, name }) => write("rank", `ミニゲームの ランキングで ${rank}いに なった！（${name}）`));
  on("game-boss", ({ wave }) => write("boss", `ミニゲームの ボスを たおした！（ウェーブ ${wave}）`));
  on("raid-win", ({ players }) => write("raid", `みんなで マザーシップを たおした。${players}にんの ヒーロー。`));
  on("wear", ({ id, name }) => write("wear", id ? `${name}を かぶせてもらった。` : "ぼうしを ぬいだ。"));
  on("tab-travel", ({ role }) => write("tab", role === "visit" ? "となりの タブに あそびに いった。" : "となりの タブから ぼくが きた。"));
  on("weather", ({ kind, temp }) => {
    const W = { clear: "はれ", cloudy: "くもり", fog: "きり", rain: "あめ", snow: "ゆき", thunder: "かみなり" };
    write("weather", `そっちは ${W[kind]}。${temp}ど だった。`);
  });
  on("poke", () => {
    const total = store.get("warpix-pokes", 0);
    const mark = Math.floor(total / 100) * 100;
    if (mark >= 100 && mark > state.pokeMark) {
      state.pokeMark = mark;
      write(`poke-${mark}`, `つつかれた かいすうが ${mark}かいを こえた。`, { force: true });
    }
  });

  // ---------- 日記を読む ----------
  const dialog = document.getElementById("diary");
  const body = document.getElementById("diary-body");
  const btn = document.getElementById("diary-btn");
  let readCount = store.get("warpix-diary-read", 0);

  function renderBadge() {
    if (badge) badge.hidden = state.diary.length <= readCount;
  }

  function render() {
    const stage = STAGES[state.stage];
    const age = dayDiff(state.born, ymd);
    const groups = new Map();
    for (const e of state.diary) {
      if (!groups.has(e.date)) groups.set(e.date, []);
      groups.get(e.date).push(e.text);
    }
    const days = [...groups.entries()].reverse();
    const fmtDate = (s) => `${Number(s.slice(5, 7))}/${Number(s.slice(8, 10))}`;
    body.innerHTML = `
      <div class="diary-head">
        <div class="diary-pixe">${pixelSvg(dress(NPC.idle))}</div>
        <dl>
          <dt>なまえ</dt><dd>${stage.name}</dd>
          <dt>であって</dt><dd>${age + 1}にちめ</dd>
          <dt>あえた ひ</dt><dd>${state.days.length}にち</dd>
          <dt>よく いく せかい</dt><dd>${typeof favorite !== "undefined" && favorite.fav() ? `${favorite.fav().label}（${favorite.fav().n}かい）` : "まだ ない"}</dd>
          <dt>つぎの せいちょう</dt><dd>${STAGES[state.stage + 1] ? `あと ${STAGES[state.stage + 1].days - state.days.length}にち` : "もう さいこう！"}</dd>
        </dl>
      </div>
      ${days.length ? days.map(([date, lines]) => `
        <section class="diary-day">
          <h3>${fmtDate(date)}</h3>
          ${lines.map((t) => `<p>${t}</p>`).join("")}
        </section>`).join("") : `<p class="diary-empty">まだ なにも かいてない。</p>`}
      ${preview ? `<p class="diary-preview">（?date= で みらいを のぞいてるので、この ひの にっきは のこらないよ）</p>` : ""}`;
  }

  function open() {
    render();
    dialog.showModal();
    body.scrollTop = 0;
    readCount = state.diary.length;
    store.set("warpix-diary-read", readCount);
    renderBadge();
    achievements.unlock("diary");
  }

  btn.innerHTML = `<span class="diary-icon">${pixelSvg([
    "............",
    ".pppp..pppp.",
    "pwwwwppwwwwp",
    "pwoowppwoowp",
    "pwwwwppwwwwp",
    "pwoowppwoowp",
    "pwwwwppwwwwp",
    "pwoowppwoowp",
    "pwwwwppwwwwp",
    ".pppp..pppp.",
    "............",
    "............",
  ])}</span>DIARY<span class="diary-new" hidden>NEW</span>`;
  badge = btn.querySelector(".diary-new");
  btn.addEventListener("click", open);
  document.getElementById("diary-close").addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (e) => e.target === dialog && dialog.close());
  cheats.add("diary", open);
  renderBadge();

  return { state, open, write, stageName: () => STAGES[state.stage].name };
})();
