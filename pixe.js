// ---------- ピクセ（v1 の ナビゲーター → v2.0）：ちょこんと いて、しゃべる ----------
// かわいさは セリフ と 季節・イベントの 衣装（日付で 自動）と 背景 だけ（2026-11-10 本人「ピクセの可愛さはもうセリフだけでいい」）。
// なれた 人ほど みじかく。ひさしぶりの 人には「おぼえてるよ」
const pixe = (() => {
  const FRAME = {
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

  // ---------- 季節・イベントの 衣装（ふだんは なにも きない。この 日だけ 自動で きがえる） ----------
  const COSTUMES = [
    { id: "halloween", from: 1024, to: 1031, layers: [{ top: 0, rows: [".......oo.......", ".....kkkkkk.....", "....kkokkokk....", "....kkokkokk...."] }] },
    {
      id: "christmas", from: 1218, to: 1225,
      layers: [
        { top: 11, rows: [".oRRRRRRRRRRRRo.", "..oRRRoyyoRRRo..", "...oowwwwwwoo..."] },
        { top: 0, rows: ["..........ww....", "......RRRRRw....", ".....RRRRRRR....", "....wwwwwwww...."] },
      ],
    },
    { id: "newyear", from: 101, to: 107, layers: [{ top: 5, rows: ["..pppppppppppp..", ".............pw."] }] },
    { id: "tanabata", from: 701, to: 707, layers: [{ top: 0, rows: [".......cc.......", ".......cc.......", ".......cc.......", ".......cc......."] }] },
  ];
  const md = (() => { const d = today(); return (d.getMonth() + 1) * 100 + d.getDate(); })();
  const costume = COSTUMES.find((c) => md >= c.from && md <= c.to) ?? null;
  function dress(frame) {
    const rows = [...frame];
    for (const layer of costume?.layers ?? []) {
      layer.rows.forEach((r, i) => {
        const y = layer.top + i;
        rows[y] = rows[y].split("").map((ch, x) => (r[x] && r[x] !== "." ? r[x] : ch)).join("");
      });
    }
    return rows;
  }
  const look = (name = "idle") => pixelSvg(dress(FRAME[name]));

  // ---------- あった 日の きろく（なれ と ひさしぶり） ----------
  const ymd = ymdOf(today());
  const met = { born: ymd, days: 0, last: null, ...store.get(KEY.pixe, null) };
  const firstVisit = met.days === 0;
  const firstToday = met.last !== ymd;
  const gapDays = met.last ? Math.round((new Date(`${ymd}T12:00:00`) - new Date(`${met.last}T12:00:00`)) / 86400000) : 0;
  if (firstToday) {
    met.days += 1;
    met.last = ymd;
    store.set(KEY.pixe, met);
  }

  // ---------- セリフ ----------
  const hour = today().getHours();
  const TIME = hour < 5 ? "late" : hour < 10 ? "morning" : hour < 17 ? "day" : "evening";
  const HELLO = {
    // あって 2〜6 日
    warm: {
      late: ["こんな じかんに……\nもしかして よふかし？", "しーっ。\nみんな ねてる じかん だよ。"],
      morning: ["おはよう！\nきょうも いい そら。", "おはよう！\nよく ねむれた？", "おはよう！\nきょうは どこへ ワープする？"],
      day: ["あ、きてくれた！", "きょうは どこへ\nワープする？"],
      evening: ["あ、ほしが\nでてきた。", "きょうも\nおつかれさま。", "よるの そら、\nきれい だよ。"],
    },
    // あって 7 日から（なかよし）。みじかく
    close: {
      late: ["……ふあ。\nきみも ねむれないの？", "よふかし なかま だね。"],
      morning: ["おはよ！", "あ、おはよう。\nまってたよ。", "おはよー。\nきょうも いこっか。"],
      day: ["や！", "きたきた！", "おっ、きみか。"],
      evening: ["おつかれ。\nまってたよ。", "おかえり、\nきょうは どうだった？"],
    },
  };
  const AGAIN = ["あ、おかえり！", "さっきぶり！", "おかえりー。"];
  const LONG_TIME = ["ひさしぶり！\nちゃんと おぼえてるよ。", "あ！ きみだ。\nまってたんだよ。"];
  const EVENT = {
    halloween: "トリック オア トリート！\nかぼちゃ、にあう？",
    christmas: "メリー クリスマス！\nこの ふく、どう？",
    newyear: "あけまして おめでとう！\nことしも よろしくね。",
    tanabata: "たなばた だね。\nねがいごと、きまった？",
  };
  const CHATTER = [
    "いてっ！",
    "ん？ よんだ？",
    "きょうも いい そら だね。",
    "ぼくを つついても\nワープは しないよ。",
    "UFO、きょうは くるかな。",
    "えへへ。",
  ];
  // ワープから もどった ときの おみやげばなし は たなの カセットが もつ（cassette.js の back）。ない ときは これ
  const BACK = ["ただいま！ むこうの せかいも\nたのしかったよ。"];

  const pick = (list, key) => {
    const last = store.get(key, null);
    const pool = list.length > 1 ? list.filter((l) => l !== last) : list;
    const line = pool[Math.floor(Math.random() * pool.length)];
    store.set(key, line);
    return line;
  };
  // グループが まだ ない とき（v2.1 ナビゲーター、本人「一応ナビゲーターとして　仕事してもらおうかな」）
  function guide() {
    if (firstVisit) return "はじめまして！ ぼくは ピクセ。\nまずは よく行く リンクを\nまとめる ばしょを つくろう！";
    return "まだ グループが ないね。\nした の ボタンから つくろう！";
  }
  // いちどだけの 案内（おなじ ことは 2 かい いわない。なれた 人ほど みじかく）
  const tips = store.get(KEY.tips, []);
  function tip(id, line) {
    if (tips.includes(id)) return false;
    tips.push(id);
    store.set(KEY.tips, tips);
    say(line);
    return true;
  }
  function greeting() {
    if (firstVisit) return "はじめまして！ ぼくは ピクセ。\nいっしょに ワープしよう！";
    if (firstToday && costume) return EVENT[costume.id];
    if (firstToday && gapDays >= 7) return pick(LONG_TIME, "warpix-v2-greet");
    if (!firstToday) return pick(AGAIN, "warpix-v2-greet");
    return pick(HELLO[met.days >= 7 ? "close" : "warm"][TIME], "warpix-v2-greet");
  }

  // ---------- 画面 ----------
  const sprite = document.getElementById("npc");
  const body = document.getElementById("npc-body");
  const bubble = document.getElementById("dialog-text");
  body.innerHTML = look();
  if (costume) sprite.dataset.costume = costume.id;

  // まばたき
  if (!reduceMotion) {
    setInterval(() => {
      if (document.hidden || away) return;
      body.innerHTML = look("blink");
      setTimeout(() => (body.innerHTML = look()), 160);
    }, 4200);
  }

  let typing = null;
  let full = "";
  function say(line) {
    clearInterval(typing);
    full = line;
    if (reduceMotion) {
      bubble.textContent = full;
      return;
    }
    let shown = 0;
    bubble.textContent = "";
    typing = setInterval(() => {
      shown++;
      bubble.textContent = full.slice(0, shown);
      if (shown % 2) sound.sfx.text();
      if (shown >= full.length) {
        clearInterval(typing);
        typing = null;
      }
    }, 40);
  }

  let lastChatter = -1;
  // つつくと ジャンプ＋コインの 音（v1 の さわりごこち。本人「ピクセタッチした時に感触変えた？前の方が良かった」）。
  // +10 の かずは コインゲームと いっしょに なくした
  sprite.addEventListener("click", () => {
    if (away) return;
    sound.sfx.coin();
    sprite.classList.remove("jump");
    void sprite.offsetWidth;
    sprite.classList.add("jump");
    let i;
    do i = Math.floor(Math.random() * CHATTER.length);
    while (i === lastChatter && CHATTER.length > 1);
    lastChatter = i;
    say(CHATTER[i]);
  });

  // ワープで いなく なって いる あいだ
  let away = false;
  function setAway(v) {
    away = v;
    sprite.classList.toggle("away", v);
  }

  // ---------- UFO：ときどき よこぎる。タップで うちおとせる（実績は なし） ----------
  const UFO = ["....cccc....", "...cccccc...", ".wwwwwwwwww.", "wpwwpwwpwwpw", ".wwwwwwwwww.", "...w....w..."];
  const BOOM = [".....pp.....", ".p...pp...p.", "..p..ww..p..", "...p.ww.p...", "....wwww....", "ppwwwwwwwwpp", "ppwwwwwwwwpp", "....wwww....", "...p.ww.p...", "..p..ww..p..", ".p...pp...p.", ".....pp....."];
  function spawnUfo() {
    if (document.hidden || document.querySelector("dialog[open]")) return;
    const el = document.createElement("button");
    el.type = "button";
    el.className = `ufo ${Math.random() < 0.5 ? "ltr" : "rtl"}`;
    el.setAttribute("aria-label", "UFOを うつ");
    el.style.top = `${56 + Math.floor(Math.random() * 90)}px`;
    el.innerHTML = pixelSvg(UFO);
    el.addEventListener("click", () => {
      el.style.left = `${el.getBoundingClientRect().left}px`;
      el.innerHTML = pixelSvg(BOOM);
      el.classList.add("boom");
      sound.sfx.boom();
      say("ナイスショット！");
      setTimeout(() => el.remove(), 450);
    });
    el.addEventListener("animationend", (e) => e.animationName.startsWith("ufo-") && el.remove());
    document.body.append(el);
  }
  function scheduleUfo(delay) {
    setTimeout(() => {
      spawnUfo();
      scheduleUfo(20000 + Math.random() * 20000);
    }, delay);
  }
  if (!reduceMotion && window.WARPIX_UFO !== false) scheduleUfo(15000);

  // ---------- リンクに カーソルを のせると、ピクセが 行き先を しょうかい（v1 の まま。パソコン） ----------
  let lastHi = null;
  const links = document.getElementById("links");
  const hi = (e) => {
    const a = e.target.closest?.(".pixel-btn[data-id]");
    const c = a && CASSETTES.byId(a.dataset.id);
    if (!c || c.id === lastHi || away || typing) return;
    lastHi = c.id;
    if (c.hi) say(c.hi);
  };
  links.addEventListener("mouseover", hi);
  links.addEventListener("focusin", hi);

  return {
    say,
    greeting,
    guide,
    tip,
    look,
    setAway,
    isAway: () => away,
    backLine: (id) => {
      const b = CASSETTES.byId(id)?.back ?? BACK;
      const list = Array.isArray(b) ? b : [b];
      return list[Math.floor(Math.random() * list.length)];
    },
    costume: () => costume?.id ?? null,
    met: () => ({ ...met }),
    firstVisit,
    spawnUfo,
  };
})();
