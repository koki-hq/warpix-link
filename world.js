// ---------- v1.3「ページの外まで遊び場」：きせかえ、ファビコン、月、タブ、気づくピクセ、認定証、エンディング ----------

// ---------- きせかえ（実績のごほうび） ----------
const wardrobe = (() => {
  // top = 何行目から重ねるか。"." は透明
  const HATS = {
    crown: {
      name: "おうかん", unlock: "master", top: 0,
      rows: [
        "....y..yy..y....",
        "....yy.yy.yy....",
        "....yyyyyyyy....",
        "....ypyycyyy....",
      ],
    },
    party: {
      name: "パーティーハット", unlock: "party", top: 0,
      rows: [
        ".......cc.......",
        ".......pp.......",
        "......pwwp......",
        ".....pwpwpp.....",
      ],
    },
    nightcap: {
      name: "ナイトキャップ", unlock: "sleepy", top: 0,
      rows: [
        "......cccc..w...",
        ".....cccccccww..",
        "....wwwwwwww....",
      ],
    },
    ufo: {
      name: "UFO", unlock: "ufo", top: 0,
      rows: [
        "......cccc......",
        "....wwwwwwww....",
        ".....w.ww.w.....",
      ],
    },
    star: {
      name: "ほしの アンテナ", unlock: "shooting-star", top: 0,
      rows: [
        ".......yy.......",
        "......yyyy......",
        ".......yy.......",
      ],
    },
    shades: {
      name: "サングラス", unlock: "hacker", top: 7,
      rows: [
        "...oooooooooo...",
        "...oooo..oooo...",
      ],
    },
  };

  const listEl = document.getElementById("wardrobe-list");
  // 季節の帽子はあとから足されるので、ここでは知らない ID でも消さない
  let current = store.get("warpix-hat", null);

  // 季節イベント中は、帽子を選んでいなければ季節の帽子をかぶる
  let seasonal = null;
  const seen = new Set(store.get("warpix-season-hats", []));
  const isOpen = (hat) => !hat.unlock || achievements.has(hat.unlock) || seen.has(hat.unlock);

  function apply() {
    const id = current ?? seasonal;
    npc.setHat(id && HATS[id] ? HATS[id] : null);
    emit("hat", { id });
  }

  function render() {
    listEl.innerHTML = "";
    const options = [[null, { name: "なし" }], ...Object.entries(HATS)];
    for (const [id, hat] of options) {
      const open = isOpen(hat);
      const b = document.createElement("button");
      b.type = "button";
      b.className = "wardrobe-item";
      b.setAttribute("aria-pressed", String(current === id));
      b.title = open ? hat.name : hat.unlock.startsWith("season:") ? hat.hint : `じっせき「${achievements.nameOf(hat.unlock)}」で もらえる`;
      b.disabled = !open;
      b.innerHTML = open ? pixelSvg(dress(NPC.idle, id ? hat : null)) : "?";
      b.addEventListener("click", () => {
        wear(id);
        sound.sfx.coin();
      });
      listEl.append(b);
    }
  }

  function wear(id) {
    current = id;
    store.set("warpix-hat", current);
    apply();
    render();
    emit("wear", { id, name: id ? HATS[id]?.name : "なし" });
    if (id) achievements.unlock("fashion");
  }

  on("notebook-tab", ({ which }) => which === "hat" && render());
  apply();
  return {
    render,
    // 季節の帽子を足す（unlock は "season:名前"。その季節を一度見たらずっと使える）
    addHat(id, hat) {
      HATS[id] = hat;
      if (current === id) apply();
    },
    seeSeason(key) {
      seen.add(key);
      store.set("warpix-season-hats", [...seen]);
    },
    wearSeasonal(id) {
      seasonal = id;
      apply();
    },
    wear,
    hats: () => HATS,
    opened: (id) => !!HATS[id] && isOpen(HATS[id]),
    currentId: () => current ?? seasonal,
  };
})();

// ---------- 生きているファビコン（タブのアイコンでもピクセがまばたきする） ----------
const favicon = (() => {
  const link = document.getElementById("favicon");
  const cv = document.createElement("canvas");
  cv.width = 16;
  cv.height = 16;
  const cx = cv.getContext("2d");
  const ALERT = Array.from({ length: 16 }, (_, y) =>
    (y >= 1 && y <= 9) || (y >= 12 && y <= 13) ? "......pppp......" : "................"
  );
  let mode = "idle"; // idle | blink | sleep | away | alert
  let lastHref = "";

  function draw(rows) {
    const css = getComputedStyle(document.body);
    const v = (name) => css.getPropertyValue(name).trim();
    const colors = { o: "#000", w: v("--fg"), p: v("--accent"), c: v("--accent-2"), y: v("--gold"), m: v("--muted") };
    cx.clearRect(0, 0, 16, 16);
    rows.forEach((row, y) =>
      [...row].forEach((ch, x) => {
        if (!colors[ch]) return;
        cx.fillStyle = colors[ch];
        cx.fillRect(x, y, 1, 1);
      })
    );
    const href = cv.toDataURL("image/png");
    if (href !== lastHref) link.href = lastHref = href;
  }

  function render() {
    if (mode === "alert") return draw(ALERT);
    if (mode === "away") return draw(NPC.idle.map((r) => r.replace(/[^.]/g, "m"))); // 影だけ
    draw(dress(mode === "idle" ? NPC.idle : NPC.blink));
  }

  function set(next) {
    mode = next;
    render();
  }

  // ふだんの状態を、ページの様子から決める
  function auto() {
    if (mode === "alert") return;
    set(npc.isAway() ? "away" : document.hidden || document.getElementById("npc").classList.contains("asleep") ? "sleep" : "idle");
  }

  setInterval(() => {
    auto();
    if (mode !== "idle") return;
    set("blink");
    setTimeout(() => mode === "blink" && set("idle"), 150);
  }, 3200);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden && mode === "alert") mode = "idle";
    auto();
  });
  on("hat", auto);
  auto();
  return { alert: () => set("alert"), refresh: auto };
})();

// ---------- 本物の月（今日の月齢で欠けかたが変わる） ----------
(() => {
  const el = document.getElementById("moon");
  const SYNODIC = 29.530588853;
  const phase = (((today().getTime() / 86400000 + 2440587.5 - 2451550.1) / SYNODIC) % 1 + 1) % 1;
  const age = phase * SYNODIC;

  // 16x16 の円。満ち欠けの境目を行ごとに計算する
  const rows = Array.from({ length: 16 }, (_, y) => {
    let row = "";
    for (let x = 0; x < 16; x++) {
      const dx = (x + 0.5 - 8) / 7.5;
      const dy = (y + 0.5 - 8) / 7.5;
      if (dx * dx + dy * dy > 1) {
        row += ".";
        continue;
      }
      const w = Math.sqrt(1 - dy * dy);
      const lit = phase < 0.5 ? dx >= w * Math.cos(2 * Math.PI * phase) : dx <= w * Math.cos(2 * Math.PI * (phase - 0.5));
      row += lit ? "y" : "n";
    }
    return row;
  });
  el.innerHTML = pixelSvg(rows, { ...PALETTE, n: "var(--btn)" });

  const NAMES = [
    [1.8, "しんげつ"],
    [5.5, "みかづき"],
    [9.5, "じょうげんの つき"],
    [13.5, "まんげつ ちょっと まえ"],
    [16, "まんげつ"],
    [20, "ちょっと かけた つき"],
    [24, "かげんの つき"],
    [28, "ありあけの つき"],
    [Infinity, "しんげつ"],
  ];
  const name = NAMES.find(([max]) => age < max)[1];
  el.dataset.phase = name; // 図鑑が「きょう見た月」として読む
  el.setAttribute("aria-label", `きょうの つき：${name}`);

  el.addEventListener("click", () => {
    sound.sfx.twinkle();
    const lines = [`きょうの つきは ${name}！\n（げつれい ${age.toFixed(1)}）`];
    if (name === "まんげつ") lines.push("こんやは まんまる。\nUFOも みに きてるかもね。");
    if (name === "しんげつ") lines.push("……くらくて よく みえない。\nほしは よく みえるけどね。");
    npc.say(lines);
    achievements.unlock("moon");
  });
})();

// ---------- ほかのタブのピクセ（BroadcastChannel） ----------
(() => {
  if (!("BroadcastChannel" in window)) return;
  const ch = new BroadcastChannel("warpix-link");
  const me = Math.random().toString(36).slice(2, 10);
  const others = new Set();
  const sprite = document.getElementById("npc");
  let greeted = false;
  let visitingTo = null;
  let guest = null;

  const post = (type, extra = {}) => ch.postMessage({ type, from: me, ...extra });

  function onOthers() {
    if (greeted || !others.size) return;
    greeted = true;
    achievements.unlock("parallel");
    const tell = () => {
      if (guest) return; // もう本人（お客さん）が来ているなら言うまでもない
      if (!npc.ready() || playing()) return setTimeout(tell, 3000);
      npc.say(["あれ？ ほかの タブにも\nぼくが いる きがする……", "ぼくを ダブルクリックすると\nあそびに いけるかも。"]);
    };
    tell();
  }

  // 自分のピクセを、となりのタブへあそびに行かせる
  sprite.addEventListener("dblclick", () => {
    if (!others.size || npc.isAway() || playing() || visitingTo) return;
    visitingTo = [...others][0];
    npc.say(["ちょっと となりの タブに\nあそびに いってくる！"]);
    setTimeout(() => {
      stars.warp();
      sound.sfx.select();
      npc.setAway(true);
      favicon.refresh();
      post("visit", { to: visitingTo, hat: currentHat });
      achievements.unlock("tab-travel");
      emit("tab-travel", { role: "visit" });
    }, 1200);
  });

  function comeHome(lines) {
    visitingTo = null;
    stars.warp();
    npc.setAway(false);
    favicon.refresh();
    npc.jump();
    npc.say(lines);
  }

  // となりから来たピクセ（お客さん）
  function showGuest(from, hat) {
    if (guest) return;
    emit("seen", { id: "guest" });
    const el = document.createElement("button");
    el.type = "button";
    el.className = "npc-guest";
    el.setAttribute("aria-label", "となりのタブからきたピクセ");
    el.innerHTML = pixelSvg(dress(NPC.idle, hat));
    sprite.after(el);
    guest = { el, from, timer: null };
    achievements.unlock("tab-travel");
    emit("tab-travel", { role: "host" });

    const greet = () => {
      sound.sfx.coin();
      npc.say(["おじゃまします！\nとなりの タブから きたよ。", "わあ、ぼくが ふたり！\n……どっちが ほんもの？"]);
      guest.timer = setTimeout(() => sendHome(), 30000);
    };
    if (document.hidden) {
      // 裏のタブにいるときは、タブのアイコンとタイトルで知らせる
      favicon.alert();
      document.title = "❗ ピクセが きたよ - WARPIX LINK";
      document.addEventListener("visibilitychange", function onShow() {
        if (document.hidden) return;
        document.removeEventListener("visibilitychange", onShow);
        greet();
      });
    } else greet();
    el.addEventListener("click", () => sendHome());
  }

  function sendHome() {
    if (!guest) return;
    clearTimeout(guest.timer);
    guest.el.remove();
    post("home", { to: guest.from });
    guest = null;
    npc.say(["そろそろ かえるね。 またね！"]);
  }

  ch.addEventListener("message", ({ data }) => {
    const { type, from, to } = data;
    if (from === me || (to && to !== me)) return;
    if (type === "hello") {
      others.add(from);
      post("here", { to: from });
      onOthers();
    } else if (type === "here") {
      others.add(from);
      onOthers();
    } else if (type === "bye") {
      others.delete(from);
      if (visitingTo === from) comeHome(["むこうの タブが とじちゃった！\nあわてて かえってきたよ。"]);
      if (guest?.from === from) {
        clearTimeout(guest.timer);
        guest.from = null;
        npc.say(["あれ、かえる タブが\nなくなっちゃった……", "……ここに すんでも いい？"]);
      }
    } else if (type === "visit") {
      showGuest(from, data.hat);
    } else if (type === "home" && visitingTo === from) {
      comeHome(["ただいま！\nむこうの タブも たのしかったよ。"]);
    }
  });

  on("boot", () => post("hello"));
  addEventListener("pagehide", () => post("bye"));
})();

// ---------- ピクセが気づく ----------
(() => {
  // あいさつを言い終えていて、ほかに何もしていないときだけしゃべる
  const notice = (lines) => {
    if (!npc.ready() || npc.isAway() || playing()) return false;
    npc.say(lines);
    return true;
  };
  const once = new Set();
  const noticeOnce = (key, lines) => !once.has(key) && notice(lines) && once.add(key);

  // 何回目の来訪か
  on("boot", () => {
    const visits = store.get("warpix-visits", 0) + 1;
    store.set("warpix-visits", visits);
    // まいかい かぞえると くどいので、ふしめの かいだけ（v1.50）
    if (visits >= 100 && visits % 100 === 0) npc.addIntro(`${visits}かいめ！？\nもう ここに すんでるでしょ。`);
    else if (visits === 10 || visits === 50) npc.addIntro(`もう ${visits}かいめ！\nすっかり じょうれんさん だね。`);
    else if (visits === 2) npc.addIntro("また きてくれたんだ！\n2かいめ だね。");
  });

  // 別のタブに行って、戻ってきたとき
  let hiddenAt = 0;
  let lastBack = -1;
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) return (hiddenAt = Date.now());
    const sec = (Date.now() - hiddenAt) / 1000;
    if (!hiddenAt || sec < 30) return;
    const span = sec < 60 ? `${Math.round(sec)}びょう` : sec < 3600 ? `${Math.round(sec / 60)}ふん` : `${Math.round(sec / 3600)}じかん`;
    // いつも おなじ だと くどいので、まえと ちがう いいかたで（v1.50）
    const BACK = [`おかえり！ ${span}も\nどこ いってたの？`, `おかえり。${span}、\nちょっと さみしかった。`, "あ、もどってきた！", "おかえりー！"];
    const i = lastBack < 0 ? Math.floor(Math.random() * BACK.length) : (lastBack + 1 + Math.floor(Math.random() * (BACK.length - 1))) % BACK.length;
    if (notice([BACK[i]])) lastBack = i;
  });

  document.addEventListener("copy", () => noticeOnce("copy", ["コピーした？\nなにを もっていくの？"]));

  let resizeTimer = 0;
  addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (innerWidth < 380) noticeOnce("narrow", ["せ、せまい……！"]);
      if (innerWidth > 1600) noticeOnce("wide", ["ひろーい！\nほしが いっぱい みえる。"]);
    }, 400);
  });

  addEventListener("keydown", (e) => {
    if (/^[a-z]$/i.test(e.key) && e.getModifierState?.("CapsLock")) {
      noticeOnce("caps", ["CAPS LOCK が ついてるよ！\n……おおきな こえ だね。"]);
    }
  });

  const sprite = document.getElementById("npc");
  let stareTimer = 0;
  sprite.addEventListener("mouseenter", () => {
    stareTimer = setTimeout(() => noticeOnce("stare", ["……そんなに じっと\nみられると てれる。"]), 3000);
  });
  sprite.addEventListener("mouseleave", () => clearTimeout(stareTimer));
  sprite.addEventListener("contextmenu", () => notice(["みぎクリックは\nくすぐったいよ！"]));

  // マウスが画面の上へ出ていったとき（タブを閉じようとしている？）
  document.addEventListener("mouseout", (e) => {
    if (!e.relatedTarget && e.clientY <= 0) noticeOnce("leave", ["もう いっちゃうの？\n……また きてね。"]);
  });
})();

// ---------- ピクセのおねがい → PIXE ADVENTURE ----------
(() => {
  let asked = false;
  function ask() {
    if (asked) return;
    if (!npc.ready() || playing() || npc.isAway() || document.hidden || document.getElementById("npc").classList.contains("asleep")) {
      return setTimeout(ask, 5000);
    }
    asked = true;
    npc.ask("ねえ…… ぼく この まどの そとに\nでてみたいな。 いっても いい？", ["いいよ！", "だめ"]).then((i) => {
      if (i === 0) adventure.start();
      else if (i === 1) npc.say(["そっかあ……", "きが かわったら\nadventure って うってね。"]);
      else {
        // ほかのセリフに割りこまれたら、あとでもう一回
        asked = false;
        setTimeout(ask, 30000);
      }
    });
  }
  on("boot", () => setTimeout(ask, 25000));
  cheats.add("adventure", () => adventure.start());
})();

// ---------- スタッフロール ----------
const credits = (() => {
  let el = null;
  let shownThisVisit = false;

  function stats() {
    const best = store.get("warpix-adv-best", null);
    return [
      ["SCORE", document.querySelector("[data-score]").textContent],
      ["HI-SCORE", document.querySelector("[data-hiscore]").textContent],
      ["じっせき", `${achievements.count()} / ${achievements.total}`],
      ["つついた かいすう", String(store.get("warpix-pokes", 0))],
      ["らいほう かいすう", String(store.get("warpix-visits", 1))],
      ["ぼうけん ベスト", best === null ? "--:--.-" : adventure.fmtTime(best)],
    ];
  }

  function close(finished) {
    if (!el) return;
    el.remove();
    el = null;
    sound.setTempo(1);
    if (finished) {
      achievements.unlock("credits");
      npc.say(["……おしまい？", "ううん、ほしぞらは\nまだまだ つづくよ！"]);
    }
  }

  function roll() {
    if (el) return;
    shownThisVisit = true;
    const row = (a, b) => `<p class="cr-row"><span>${a}</span><span>${b}</span></p>`;
    el = document.createElement("div");
    el.className = "credits";
    el.setAttribute("role", "dialog");
    el.setAttribute("aria-label", "スタッフロール");
    el.innerHTML = `
      <div class="credits-roll">
        <p class="cr-title">WARPIX-LINK</p>
        <p class="cr-head">STAFF</p>
        ${row("STARRING", "PIXE")}
        ${row("UFO", "???")}
        ${row("MOTHERSHIP", "???")}
        ${row("MOON", "THE REAL ONE")}
        ${row("MUSIC", "WEB AUDIO API")}
        ${row("PIXEL ART", "12×12 / 16×16")}
        ${row("PROGRAM", "HTML / CSS / JS")}
        ${row("BUILD TOOL", "NONE")}
        ${row("PRODUCER", "WARPIX製作所")}
        ${row("BUILT WITH", "CLAUDE")}
        ${row("SPECIAL THANKS", "YOU")}
        <p class="cr-head">あなたの きろく</p>
        ${stats().map(([a, b]) => row(a, b)).join("")}
        <p class="cr-head">THANK YOU<br>FOR PLAYING!</p>
        <div class="cr-pixe">${pixelSvg(dress(NPC.idle))}</div>
        <p class="cr-end">THE END ?</p>
        <p class="cr-maker">© 2026 WARPIX製作所</p>
      </div>
      <button type="button" class="credits-skip">SKIP ▶</button>`;
    document.body.append(el);
    sound.setTempo(0.7);

    const rollEl = el.querySelector(".credits-roll");
    // 画面の下から流れてきて、最後の THE END ? が画面のまんなかで止まる
    const from = innerHeight;
    const to = innerHeight / 2 - rollEl.offsetHeight + 60;
    const dist = from - to;
    rollEl.style.setProperty("--from", `${from}px`);
    rollEl.style.setProperty("--to", `${to}px`);
    // 1秒に 40px くらい、4px ずつカクカク進む
    rollEl.style.animationDuration = `${Math.round(dist / 40)}s`;
    rollEl.style.animationTimingFunction = `steps(${Math.round(dist / 4)})`;
    rollEl.addEventListener("animationend", () => setTimeout(() => close(true), 2500));
    // スキップは ボタン（と キー）だけ。スマホで スクロールしようと さわった だけで おわらないように
    el.querySelector(".credits-skip").addEventListener("click", () => close(false));
    addEventListener("keydown", function skip(e) {
      if (!el) return removeEventListener("keydown", skip);
      if (e.key === "Escape" || e.key === "Enter" || e.key === " ") {
        removeEventListener("keydown", skip);
        close(false);
      }
    });
  }

  // はじめてぼうけんをクリアしたら流す
  on("adventure-clear", () => {
    if (!shownThisVisit) setTimeout(roll, 3500);
  });
  cheats.add("credits", roll);
  return { roll };
})();

// ---------- 印刷すると、ピクセ公認の「認定証」になる ----------
(() => {
  const cert = document.getElementById("certificate");
  addEventListener("beforeprint", () => {
    if (document.body.classList.contains("booted")) achievements.unlock("print");
    const best = store.get("warpix-adv-best", null);
    const d = new Date();
    const items = [
      ["SCORE", document.querySelector("[data-score]").textContent],
      ["HI-SCORE", document.querySelector("[data-hiscore]").textContent],
      ["じっせき", `${achievements.count()} / ${achievements.total}`],
      ["ピクセを つついた かいすう", `${store.get("warpix-pokes", 0)} かい`],
      ["らいほう かいすう", `${store.get("warpix-visits", 1)} かい`],
      ["ぼうけん ベストタイム", best === null ? "まだ" : adventure.fmtTime(best)],
    ];
    const names = achievements.unlockedNames();
    cert.innerHTML = `
      <div class="cert-frame">
        <p class="cert-kicker">WARPIX-LINK</p>
        <h1 class="cert-title">にんていしょう</h1>
        <div class="cert-pixe">${pixelSvg(dress(NPC.idle))}</div>
        <p class="cert-lead">あなたは ワーピックスの ほしぞらで<br>つぎの きろくを のこしました。</p>
        <table class="cert-table">${items.map(([a, b]) => `<tr><th>${a}</th><td>${b}</td></tr>`).join("")}</table>
        <p class="cert-sub">てにいれた じっせき</p>
        <p class="cert-trophies">${names.length ? names.join(" ／ ") : "これから！"}</p>
        <p class="cert-date">${d.getFullYear()}ねん ${d.getMonth() + 1}がつ ${d.getDate()}にち</p>
        <p class="cert-sign">ワーピックスの ほしぞら あんないにん　ピクセ <span class="cert-stamp">ピ</span></p>
      </div>`;
  });
  cheats.add("print", () => print());
})();

// ---------- できごと → 実績（v1.3 ぶん） ----------
on("adventure-clear", ({ time }) => {
  achievements.unlock("adventure");
  if (time < 30) achievements.unlock("speedrun");
});
on("stomp", () => achievements.unlock("stomp"));
on("demo", () => achievements.unlock("demo"));
