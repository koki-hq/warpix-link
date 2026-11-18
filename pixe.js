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
      day: ["あ、きてくれた！", "きょうは どこへ\nワープする？", "あ、きみだ！", "おひるは もう たべた？"],
      evening: ["あ、ほしが\nでてきた。", "きょうも\nおつかれさま。", "よるの そら、\nきれい だよ。"],
    },
    // あって 7 日から（なかよし）。みじかく
    close: {
      late: ["……ふあ。\nきみも ねむれないの？", "よふかし なかま だね。"],
      morning: ["おはよ！", "あ、おはよう。\nまってたよ。", "おはよー。\nきょうも いこっか。"],
      day: ["や！", "きたきた！", "おっ、きみか。", "ちょっと ひとやすみ？"],
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
    // v2.8（本人と えらんだ もの）
    "くすぐったいよ〜",
    "ぼく、ちょっと ねむい。",
    "なにか いいこと あった？",
    "ここ、おちつくね。",
    "……ぼーっと してた。",
  ];
  // v2.8：きせつ・けしき・ようび の ひとこと
  const SEASON = {
    snow: ["ゆきだ！\nやねが まっしろ。", "さむいね。\nぼくの アンテナも ひえひえ。"],
    petal: ["はなびら、\nつかまえられた？"],
    firework: ["あ、はなび！\nいま おおきいの あがったよ。"],
    leaf: ["はっぱが ひらひら。\nどこまで とんでいくのかな。"],
  };
  const WEEK = { 1: "げつようび。\nゆっくり いこうね。", 5: "きんようび だ！\nあと ちょっと。", 6: "おやすみの ひ だね。", 0: "おやすみの ひ だね。" };
  // つついた とき、いまの けしきに あう もの（ちへいせん・そら）
  function sceneLines() {
    const h = settings.state.horizon;
    const sky = settings.sky();
    if (document.documentElement.classList.contains("has-photo")) return [];
    const out = [];
    if (h === "city" && sky !== "day") out.push("あの まどの あかり、\nいま きえた。");
    if (h === "city" && sky === "night") out.push("まちの ひと、もう ねたかな。");
    if (h === "city" && sky === "evening") out.push("ゆうやけの まち、\nちょっと すき。");
    if (h === "hills") out.push("おかの うえの いえ、\nだれが すんでるんだろう。");
    return out;
  }
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
    if (firstVisit) return "はじめまして！ ぼくは ピクセ。\nしたの「グループを つくる」から\nはじめよう！";
    return "まだ グループが ないね。\nしたの「グループを つくる」を\nおしてみて！";
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
    // v2.8：その 日 はじめての ときに ときどき きせつ か ようび の ひとこと
    const season = typeof seasonOf === "function" ? seasonOf() : null;
    const roll = Math.random();
    if (season && roll < 0.35) return pick(SEASON[season], "warpix-v2-greet");
    const week = WEEK[today().getDay()];
    if (week && roll < 0.55) return week;
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
      // v2.9.1：すわって いる ときも まばたき（本人：まがおで つったって いると あつを かんじる）
      if (rest === "sit") {
        seatBlink("blink");
        setTimeout(() => rest === "sit" && seatBlink("idle"), 160);
      }
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

  let lastChatter = null;
  // つつくと ジャンプ＋コインの 音（v1 の さわりごこち。本人「ピクセタッチした時に感触変えた？前の方が良かった」）。
  // +10 の かずは コインゲームと いっしょに なくした
  sprite.addEventListener("click", () => {
    if (away) return;
    sound.sfx.coin();
    sprite.classList.remove("jump");
    void sprite.offsetWidth;
    sprite.classList.add("jump");
    // v2.8：つづけて なんかいも つつくと（3 びょうに 5 かい）
    const now = performance.now();
    taps = taps.filter((x) => now - x < 3000).concat(now);
    if (taps.length >= 5) {
      taps = [];
      return say("もう、\nわかった わかった。");
    }
    const pool = [...CHATTER, ...sceneLines()];
    let i;
    do i = Math.floor(Math.random() * pool.length);
    while (pool[i] === lastChatter && pool.length > 1);
    lastChatter = pool[i];
    say(pool[i]);
  });
  let taps = [];

  // ワープで いなく なって いる あいだ
  let away = false;
  function setAway(v) {
    away = v;
    sprite.classList.toggle("away", v);
    favicon?.refresh();
  }

  // ---------- ひとやすみ（v2.9）：しばらく さわらないと ちへいせんの やね・おかに すわる、もっと たつと ねむる ----------
  // 本人「可愛い　いいね」。20 びょうで すわる・さらに 1 ぷんで ねむる（本人「案のでいいとおもう」）。
  // ふきだしは のこす（本人「消したらどうやってセリフ見せるの」）。
  // v2.10：ちいさく 30px（とおくに いる かんじ）・まばたき・z は 3 つ。画面を さわっても すぐには もどらない（ぼうけん）。
  //   画面を さわると よびかけ、ピクセを さわると「もうすこし したら もどるね〜」で 5 びょう あとに もどる。
  //   リンクを おす・アプリを はなれる と すぐ もどる。ときどき となりの やねへ おさんぽ・ひとりごと
  const [SIT_MS, SLEEP_MS, WALK_MS = 30000, BACK_MS = 5000] = window.WARPIX_IDLE ?? [20000, 60000];
  const seatEl = document.createElement("div");
  seatEl.className = "pixe-seat";
  seatEl.setAttribute("aria-hidden", "true");
  seatEl.hidden = true;
  document.body.append(seatEl);
  let rest = null; // null・"sit"・"sleep"
  // z は 3 つ（本人「Zは定番の３つの方がいい」）。ちいさい じゅんに ななめ うえへ、じゅんばんに うかぶ
  const ZZZ = `<span class="pixe-z"><i>z</i><i>z</i><i>z</i></span>`;
  const seatBlink = (frame) => {
    const svg = seatEl.querySelector("svg");
    if (svg) svg.outerHTML = look(frame);
  };
  let idleAt = performance.now();
  let fx = 0.72; // いま すわって いる ばしょ（画面の よこの わりあい）
  let nextWalk = 0;
  let calledAt = -Infinity;
  let backTimer = null;
  const SPOTS = [0.16, 0.32, 0.5, 0.72, 0.86];
  const MURMUR = ["ここから みると、\nそらが ひろい。", "かぜが きもちいい〜"];
  function sitLine() {
    const s = typeof seasonOf === "function" ? seasonOf() : null;
    if (settings.state.horizon === "hills") return "おかの うえ、\nかぜが きもちいい。";
    if (s === "snow") return "ゆきの やね、\nつめたい！";
    if (settings.sky() === "evening") return "ゆうやけ、\nここから だと よく みえる。";
    return "やねの うえ、\nきもちいい〜";
  }
  function canRest() {
    return !away && !document.hidden && !document.querySelector("dialog[open]") && !document.body.classList.contains("editing") && !document.body.classList.contains("no-groups") && typeof horizon !== "undefined";
  }
  function place(at) {
    seatEl.style.left = `${Math.round(at.x)}px`;
    seatEl.style.top = `${Math.round(at.y)}px`;
  }
  function sit() {
    fx = settings.state.horizon === "hills" ? 0.5 : 0.72;
    const at = horizon.seat(fx);
    if (!at) return false;
    seatEl.innerHTML = look() + ZZZ;
    place(at);
    seatEl.hidden = false;
    seatEl.classList.remove("sleep");
    sprite.classList.add("down");
    rest = "sit";
    nextWalk = performance.now() + WALK_MS;
    say(sitLine());
    return true;
  }
  function sleep() {
    rest = "sleep";
    seatEl.innerHTML = look("blink") + ZZZ;
    seatEl.classList.add("sleep");
    say("……すやすや。");
  }
  // おきる（ねて いる とき だけ）。すわった まま
  function rouse(line) {
    if (rest !== "sleep") return;
    rest = "sit";
    seatEl.innerHTML = look() + ZZZ;
    seatEl.classList.remove("sleep");
    if (line) say(line);
  }
  // うえに もどる
  function comeBack(line = null) {
    clearTimeout(backTimer);
    backTimer = null;
    idleAt = performance.now();
    if (!rest) return;
    rest = null;
    seatEl.hidden = true;
    seatEl.classList.remove("hop");
    sprite.classList.remove("down");
    if (line) {
      sprite.classList.remove("jump");
      void sprite.offsetWidth;
      sprite.classList.add("jump");
      say(line);
    }
  }
  // となりの やねへ おさんぽ（0.8 びょうの ジャンプ）
  function walk() {
    const others = SPOTS.filter((x) => Math.abs(x - fx) > 0.1);
    const to = others[Math.floor(Math.random() * others.length)];
    const from = horizon.seat(fx);
    const at = horizon.seat(to);
    if (!from || !at) return;
    say(Math.random() < 0.5 ? "となりの やねまで\nいってみよう。" : "よいしょっと。");
    fx = to;
    if (reduceMotion) return place(at);
    const t0 = performance.now();
    const step = (now) => {
      if (rest !== "sit") return;
      const k = Math.min(1, (now - t0) / 800);
      place({ x: from.x + (at.x - from.x) * k, y: from.y + (at.y - from.y) * k - Math.sin(Math.PI * k) * 40 });
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
  // さわった とき
  addEventListener(
    "pointerdown",
    (e) => {
      idleAt = performance.now();
      if (!rest) return;
      // ピクセを さわる：もうすこし したら もどる（本人「もう少ししたら戻るね〜とか入れるか」→ A）
      if (e.target.closest?.(".pixe-seat")) {
        if (backTimer) return;
        const sleeping = rest === "sleep";
        rouse();
        seatEl.classList.remove("hop");
        void seatEl.offsetWidth;
        seatEl.classList.add("hop");
        say(sleeping ? "……ん？ ねてないよ。" : "もうすこし したら\nもどるね〜");
        backTimer = setTimeout(() => comeBack("ただいま〜"), BACK_MS);
        return;
      }
      // リンクを おす：いっしょに ワープ するので すぐ もどる
      if (e.target.closest?.(".links a.pixel-btn")) return comeBack();
      // ほかの ところ：よびかけ（なんども いわない）
      if (rest === "sleep") return rouse("……ん？ ねてないよ。");
      if (!backTimer && performance.now() - calledAt > 8000 && !e.target.closest?.("dialog")) {
        calledAt = performance.now();
        say("おーい、ここだよ ここ。\nした みてみて〜");
      }
    },
    { capture: true, passive: true }
  );
  for (const ev of ["keydown", "wheel"]) addEventListener(ev, () => (idleAt = performance.now()), { capture: true, passive: true });
  document.addEventListener("visibilitychange", () => comeBack());
  addEventListener("resize", () => {
    if (!rest) return;
    const at = horizon.seat(fx);
    if (at) place(at);
    else comeBack();
  });
  setInterval(() => {
    const now = performance.now();
    const idle = now - idleAt;
    if (!rest && idle >= SIT_MS) {
      if (!canRest() || !sit()) idleAt = now;
      return;
    }
    if (rest !== "sit" || backTimer) return;
    if (idle >= SIT_MS + SLEEP_MS) return sleep();
    // ときどき おさんぽ か ひとりごと
    if (now >= nextWalk) {
      nextWalk = now + WALK_MS * (0.7 + Math.random() * 0.6);
      if (Math.random() < 0.5) walk();
      else {
        const lines = settings.state.horizon === "city" ? [...MURMUR, "まちの あかり、\nちかくで みると きれい。"] : MURMUR;
        say(lines[Math.floor(Math.random() * lines.length)]);
      }
    }
  }, 1000);

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
    if (!c || c.id === lastHi || away || typing || document.body.classList.contains("editing")) return;
    lastHi = c.id;
    if (c.hi) say(c.hi);
  };
  links.addEventListener("mouseover", hi);
  links.addEventListener("focusin", hi);

  // ---------- 生きている ファビコン（v1 の まま。v2.2.1 で もどした、本人「PCのブックマークバーのアイコン消したでしょ！かわいいんだから」）----------
  // タブ・ブックマークバーの アイコンでも ピクセが まばたき。ワープで いない あいだは かげ だけ。季節の 衣装も きる
  const favicon = (() => {
    const link = document.getElementById("favicon");
    const cv = document.createElement("canvas");
    cv.width = 16;
    cv.height = 16;
    const cx = cv.getContext("2d");
    let lastHref = "";
    function draw(rows) {
      const css = getComputedStyle(document.documentElement);
      const v = (name) => css.getPropertyValue(name).trim();
      const colors = { ...PALETTE, w: v("--fg") || PALETTE.w, p: v("--accent") || PALETTE.p, c: v("--accent-2") || PALETTE.c, y: v("--gold") || PALETTE.y, m: v("--muted") || "#8a80b8" };
      delete colors["#"];
      cx.clearRect(0, 0, 16, 16);
      const ox = Math.floor((16 - rows[0].length) / 2);
      const oy = Math.floor((16 - rows.length) / 2);
      rows.forEach((row, y) =>
        [...row].forEach((ch, x) => {
          if (!colors[ch]) return;
          cx.fillStyle = colors[ch];
          cx.fillRect(x + ox, y + oy, 1, 1);
        })
      );
      const href = cv.toDataURL("image/png");
      if (href !== lastHref) link.href = lastHref = href;
    }
    const idle = () => (away ? draw(FRAME.idle.map((r) => r.replace(/[^.]/g, "m"))) : draw(dress(FRAME.idle)));
    if (link) {
      idle();
      setInterval(() => {
        if (document.hidden || away) return idle();
        draw(dress(FRAME.blink));
        setTimeout(idle, 150);
      }, 3200);
    }
    return { refresh: () => link && idle() };
  })();

  return {
    rest: () => rest,
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
