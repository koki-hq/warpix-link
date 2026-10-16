// ---------- おまけ：実績、隠しコマンド、流れ星、マザーシップ、いろいろ ----------

const TROPHY = [
  "..yyyyyyyy..",
  "yy.yyyyyy.yy",
  "y..yyyyyy..y",
  "y..yyyyyy..y",
  ".y.yyyyyy.y.",
  "..yyyyyyyy..",
  "...yyyyyy...",
  ".....yy.....",
  ".....yy.....",
  "....yyyy....",
  "...yyyyyy...",
  "...yyyyyy...",
];

const MOTHERSHIP = [
  "........cccccccc........",
  "......cccccccccccc......",
  ".....cc.cc.cc.cc.cc.....",
  "..wwwwwwwwwwwwwwwwwwww..",
  ".wwwwwwwwwwwwwwwwwwwwww.",
  "wpwwwpwwwpwwwwpwwwpwwwpw",
  ".wwwwwwwwwwwwwwwwwwwwww.",
  "..wwwwwwwwwwwwwwwwwwww..",
  "....w..w........w..w....",
  "...w...w........w...w...",
];

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
};

// ---------- 実績 ----------
const achievements = (() => {
  const LIST = [
    { id: "first-warp", name: "はじめての ワープ", desc: "リンクを えらんで ワープした", hint: "どこかへ ワープしてみよう" },
    { id: "world-tour", name: "せかい いっしゅう", desc: "6つの せかい ぜんぶへ ワープした", hint: "すべての せかいへ……" },
    { id: "poke-50", name: "ピクセの ともだち", desc: "ピクセを 50かい つついた", hint: "ピクセと なかよく なろう" },
    { id: "warp-zone", name: "ひみつの ワープゾーン", desc: "かくされた ワープゾーンを ひらいた", hint: "ピクセを なんども なんども……" },
    { id: "konami", name: "でんせつの コマンド", desc: "あの コマンドを にゅうりょくした", hint: "うえうえ したした……" },
    { id: "ufo", name: "UFOハンター", desc: "UFOを うちおとした", hint: "そらを みあげて" },
    { id: "mothership", name: "マザーシップ げきつい", desc: "きょだいな UFOを たおした", hint: "UFOを 3き うちおとすと……" },
    { id: "shooting-star", name: "ながれぼしに ねがいを", desc: "ながれぼしを つかまえた", hint: "ほしが ながれたら すかさず" },
    { id: "combo", name: "コンボマスター", desc: "x4 コンボを だした", hint: "テンポよく てんすうを かせごう" },
    { id: "score-10k", name: "ハイスコアラー", desc: "スコア 10000を こえた", hint: "たくさん あそぼう" },
    { id: "gameboy", name: "なつかしの いろ", desc: "ゲームボーイの いろに した", hint: "あの ゲームきの なまえを えいごで" },
    { id: "party", name: "パーティー ピープル", desc: "パーティーを はじめた", hint: "おまつりさわぎを えいごで" },
    { id: "pixe-rain", name: "ピクセの あめ", desc: "ピクセが ふってきた", hint: "ぼくの なまえを ローマじで" },
    { id: "invader", name: "インベーダー ハンター", desc: "ミニゲームで ウェーブ1を クリアした", hint: "いちばん したで コインを いれよう" },
    { id: "invader-pro", name: "エース パイロット", desc: "ミニゲームで 1000てん とった", hint: "ミニゲームで こうとくてんを" },
    { id: "sleepy", name: "おやすみ ピクセ", desc: "ピクセが ねむった", hint: "しばらく なにも しないと……" },
    { id: "night-owl", name: "よふかし", desc: "しんや 0〜5じに あそんだ", hint: "よる おそくに きてみて" },
    { id: "silence", name: "しずかな よる", desc: "BGMを けした", hint: "たまには しずかに" },
    { id: "hacker", name: "ハッカー", desc: "コンソールで ピクセを よんだ", hint: "かいはつしゃツールを のぞくと……" },
    { id: "adventure", name: "ぼうけんの はじまり", desc: "PIXE ADVENTURE を クリアした", hint: "ピクセの おねがいに 「いいよ」と こたえると……" },
    { id: "speedrun", name: "スピードランナー", desc: "ぼうけんを 30びょう いないで クリアした", hint: "ぼうけんを もっと はやく" },
    { id: "stomp", name: "ふみつけ", desc: "ぼうけんで UFOを ふんづけた", hint: "ぼうけんちゅうの UFOは うえから" },
    { id: "parallel", name: "パラレルワールド", desc: "べつの タブにも ピクセが いた", hint: "このページを もうひとつ ひらくと……" },
    { id: "tab-travel", name: "タブを こえて", desc: "ピクセが タブの あいだを いききした", hint: "タブが ふたつ あるとき ピクセを ダブルクリック" },
    { id: "moon", name: "つきみ", desc: "きょうの つきを ながめた", hint: "そらの すみっこに なにか うかんでる" },
    { id: "print", name: "かみに のこす", desc: "このページを いんさつ しようとした", hint: "かみに いんさつ すると……？" },
    { id: "credits", name: "エンディング", desc: "スタッフロールを さいごまで みた", hint: "ぼうけんの さきに……" },
    { id: "demo", name: "だれも いない ゲームセンター", desc: "デモプレイを みた", hint: "ピクセが ねたあとも ほうっておくと……" },
    { id: "fashion", name: "おしゃれさん", desc: "ピクセに ぼうしを かぶせた", hint: "じっせきの ごほうびで きせかえ" },
    { id: "season", name: "きせつの ピクセ", desc: "きせつの イベントに であった", hint: "ハロウィン、クリスマス、おしょうがつ、たなばた……" },
    { id: "pocket", name: "ポケットの ピクセ", desc: "ホームがめんの アプリから ひらいた", hint: "ピクセを ホームがめんに つれていこう" },
    { id: "weather", name: "おてんき ピクセ", desc: "そっちの てんきが ページに ふった", hint: "ピクセに てんきを しらべてもらおう" },
    { id: "gamepad", name: "コントローラー", desc: "ゲームの コントローラーを つないだ", hint: "ゲームきの コントローラーを つないでみて" },
    { id: "online", name: "おなじ そら", desc: "ほかの だれかと おなじ そらを みた", hint: "だれかと おなじ じかんに ここに いると……" },
    { id: "hello", name: "はじめまして", desc: "ほかの だれかと てを ふりあった", hint: "そらに うかぶ ピクセを クリック" },
    { id: "diary", name: "ピクセの にっき", desc: "ピクセの にっきを よんだ", hint: "ピクセは まいにち なにかを かいている" },
    { id: "growup", name: "おおきく なったね", desc: "7にち あって ピクセが マントを てにいれた", hint: "なんにちも あいに くると……" },
    { id: "reunion", name: "ただいま", desc: "ひさしぶりに あいにきて、ピクセと なかなおり した", hint: "しばらく あわないと ピクセは……" },
    { id: "raid", name: "きょうの ヒーローたち", desc: "みんなで マザーシップを たおした", hint: "5ふんおきに みんなの そらに……" },
    { id: "regular", name: "いつもの せかい", desc: "おなじ リンクへ 10かい ワープした", hint: "おなじ せかいに なんども……" },
    { id: "composer", name: "さっきょくか", desc: "じぶんの きょくを BGM に した", hint: "みぎうえの ♪ で……" },
    { id: "collector", name: "レコード コレクター", desc: "レコードだなに きょくを 3まい ならべた", hint: "つくった きょくは、たなに しまえる……" },
    { id: "listener", name: "とどいた きょく", desc: "だれかが つくった きょくを きいた", hint: "きょくの リンクを もらったら……" },
    { id: "omikuji", name: "おみくじ", desc: "ピクセの おみくじを ひいた", hint: "いちばん したに なにか ある" },
    { id: "daikichi", name: "だいきち！", desc: "おみくじで だいきちを ひいた", hint: "まいにち ひいていれば いつか……" },
    { id: "ghost", name: "ゴーストに かて", desc: "ぼうけんで きょうの ゴーストに かった", hint: "おなじ ひに 2かい ぼうけんすると……" },
    { id: "zukan-half", name: "ずかん はんぶん", desc: "ピクセの ずかんを はんぶん うめた", hint: "いろいろな ものに であうと……" },
    { id: "postcard", name: "ポストカード", desc: "ピクセの ポストカードを つくった", hint: "ノートの うえの ほうに……" },
    { id: "boss", name: "ボス げきは", desc: "ミニゲームの ボスを たおした", hint: "ミニゲームで 3ウェーブめまで いくと……" },
    { id: "ranker", name: "なまえを きざめ", desc: "ミニゲームの ランキングに なまえを のこした", hint: "ミニゲームで いい てんを とると……" },
    { id: "rusuban", name: "おるすばん ありがとう", desc: "るすばんした ピクセから おみやげを もらった", hint: "しばらく るすに して、もどってくると……" },
    { id: "streak7", name: "まいにち スタンプ", desc: "7にち つづけて ピクセに あった", hint: "スタンプカードを うめていくと……" },
    { id: "dreamer", name: "ゆめみる ピクセ", desc: "ピクセの ゆめを のぞいた", hint: "ピクセが ねむったら、あたまの うえを……" },
    { id: "master", name: "WARPIX マスター", desc: "すべての じっせきを あつめた", hint: "ぜんぶ あつめると……" },
  ];

  const unlocked = new Set(store.get("warpix-achievements", []));
  const btn = document.getElementById("trophy-btn");
  const countEl = document.getElementById("trophy-count");
  const dialog = document.getElementById("trophies");
  const listEl = document.getElementById("trophy-list");
  const titleCountEl = document.getElementById("trophies-count");
  const toastEl = document.getElementById("toast");

  document.querySelectorAll("[data-trophy]").forEach((el) => (el.innerHTML = pixelSvg(TROPHY)));

  function render() {
    const text = `${unlocked.size}/${LIST.length}`;
    countEl.textContent = text;
    titleCountEl.textContent = text;
    listEl.innerHTML = "";
    for (const a of LIST) {
      const got = unlocked.has(a.id);
      const li = document.createElement("li");
      li.className = got ? "got" : "locked";
      li.innerHTML = `
        <span class="trophy-icon">${got ? pixelSvg(TROPHY) : "?"}</span>
        <span class="trophy-text">
          <b>${got ? a.name : "？？？"}</b>
          <small>${got ? a.desc : `ヒント：${a.hint}`}</small>
        </span>`;
      listEl.append(li);
    }
  }

  // トーストは1つずつ順番に出す
  const queue = [];
  let showing = false;
  function showNext() {
    const a = queue.shift();
    if (!a) {
      showing = false;
      return;
    }
    showing = true;
    toastEl.querySelector(".toast-name").textContent = a.name;
    toastEl.hidden = false;
    toastEl.classList.remove("show");
    void toastEl.offsetWidth;
    toastEl.classList.add("show");
    sound.sfx.fanfare();
    setTimeout(() => {
      toastEl.hidden = true;
      showNext();
    }, 3000);
  }

  function unlock(id) {
    if (unlocked.has(id) || !LIST.some((a) => a.id === id)) return;
    unlocked.add(id);
    store.set("warpix-achievements", [...unlocked]);
    emit("achievement", { id, name: LIST.find((a) => a.id === id).name });
    render();
    queue.push(LIST.find((a) => a.id === id));
    if (!showing) showNext();
    btn.classList.remove("ping");
    void btn.offsetWidth;
    btn.classList.add("ping");
    if (id !== "master" && LIST.every((a) => a.id === "master" || unlocked.has(a.id))) {
      setTimeout(() => {
        unlock("master");
        celebrate();
      }, 1500);
    }
  }

  function celebrate() {
    npc.say(["すごい！ ぜんぶの じっせきを\nあつめちゃった！", "きみこそ ほんものの\nWARPIX マスターだ！", "あそんでくれて ありがとう！"]);
    cheats.run("pixe", { silent: true });
    stars.warp(3000);
  }

  function randomHint() {
    const locked = LIST.filter((a) => !unlocked.has(a.id) && a.id !== "master");
    if (!locked.length) return null;
    return locked[Math.floor(Math.random() * locked.length)].hint;
  }

  btn.addEventListener("click", () => {
    render();
    dialog.showModal();
  });
  document.getElementById("trophies-close").addEventListener("click", () => dialog.close());
  // 外側（背景）をクリックしても閉じる
  dialog.addEventListener("click", (e) => {
    if (e.target === dialog) dialog.close();
  });

  render();
  return {
    unlock,
    has: (id) => unlocked.has(id),
    randomHint,
    count: () => unlocked.size,
    total: LIST.length,
    unlockedNames: () => LIST.filter((a) => unlocked.has(a.id)).map((a) => a.name),
    nameOf: (id) => LIST.find((a) => a.id === id)?.name ?? id,
  };
})();

// ---------- 隠しコマンド（キーボードで打つ or 実績画面の CHEAT CODE 欄） ----------
const cheats = (() => {
  const GB_STARS = ["#9bbc0f", "#9bbc0f", "#8bac0f", "#306230"];
  const PARTY_STARS = ["#ff4fa3", "#3ee8ff", "#ffd84a", "#7dff6a", "#b28cff", "#f4f4f4"];
  let partying = false;

  function shake() {
    if (reduceMotion) return;
    document.body.classList.remove("shake");
    void document.body.offsetWidth;
    document.body.classList.add("shake");
  }

  const COMMANDS = {
    gameboy() {
      const on = document.body.classList.toggle("gb");
      if (!partying) stars.setColors(on ? GB_STARS : null);
      sound.sfx.powerup();
      npc.say([on ? "なつかしい いろだね！\nもういちど うつと もどるよ。" : "いつもの いろに もどった！"]);
      achievements.unlock("gameboy");
    },
    party() {
      if (partying) return;
      partying = true;
      document.body.classList.add("party");
      sound.setTempo(1.6);
      sound.sfx.powerup();
      stars.setColors(PARTY_STARS);
      stars.warp(800);
      npc.say(["パーティー タイム！"]);
      const dance = setInterval(npc.jump, 400);
      achievements.unlock("party");
      setTimeout(() => {
        partying = false;
        clearInterval(dance);
        document.body.classList.remove("party");
        sound.setTempo(1);
        stars.setColors(document.body.classList.contains("gb") ? GB_STARS : null);
        npc.say(["……ふう、たのしかった！"]);
      }, 10000);
    },
    pixe({ silent } = {}) {
      rainPixe();
      if (!silent) {
        sound.sfx.powerup();
        npc.say(["わーい！ なかまが いっぱい！\nつかまえてみて！"]);
      }
      achievements.unlock("pixe-rain");
    },
    warp() {
      sound.sfx.select();
      stars.warp(3000);
      shake();
      npc.say(["ハイパー ワープ！"]);
    },
    help() {
      const hint = achievements.randomHint();
      npc.say([hint ? `ヒント：${hint}` : "もう おしえることは\nなにも ないよ！"]);
    },
    invaders() {
      game.open();
    },
  };

  function run(word, opts) {
    const cmd = COMMANDS[word];
    if (!cmd) return false;
    cmd(opts);
    return true;
  }

  // キーボードで直接タイプしたとき（最後に打った文字の並びでチェック）
  let buffer = "";
  document.addEventListener("keydown", (e) => {
    if (!document.body.classList.contains("booted") || playing()) return;
    if (e.target.closest?.("input, textarea, dialog")) return;
    if (!/^[a-z]$/i.test(e.key)) return;
    buffer = (buffer + e.key.toLowerCase()).slice(-12);
    const word = Object.keys(COMMANDS).find((w) => buffer.endsWith(w));
    if (word) {
      buffer = "";
      run(word);
    }
  });

  // 実績画面の入力欄から（スマホ向け）
  const form = document.getElementById("cheat-form");
  const input = document.getElementById("cheat-input");
  const msg = document.getElementById("cheat-msg");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const word = input.value.trim().toLowerCase();
    input.value = "";
    if (!word) return;
    if (COMMANDS[word]) {
      msg.textContent = "OK!";
      document.getElementById("trophies").close();
      run(word);
    } else {
      msg.textContent = "そんな コマンドは ない みたい……";
      sound.sfx.damage();
    }
  });

  // ピクセの雨（つかまえると +50）
  function rainPixe() {
    if (reduceMotion) return;
    for (let i = 0; i < 24; i++) {
      const el = document.createElement("button");
      el.type = "button";
      el.className = "rain-pixe";
      el.setAttribute("aria-label", "ピクセをつかまえる");
      el.innerHTML = pixelSvg(NPC.idle);
      el.style.left = `${Math.floor(Math.random() * 92)}vw`;
      el.style.animationDuration = `${2 + Math.random() * 2}s`;
      el.style.animationDelay = `${Math.random() * 1.5}s`;
      el.addEventListener("click", (e) => {
        sound.sfx.coin();
        score.add(50, e.clientX, e.clientY);
        el.remove();
      });
      el.addEventListener("animationend", () => el.remove());
      document.body.append(el);
    }
  }

  // ほかのファイルからコマンドを足す
  const add = (word, fn) => (COMMANDS[word] = fn);

  return { run, add };
})();

// ---------- できごと → 実績 ----------
(() => {
  const visited = new Set(store.get("warpix-visited", []));
  let pokeTotal = store.get("warpix-pokes", 0);
  let ufoDown = 0;

  on("boot", () => {
    if (new Date().getHours() < 5) achievements.unlock("night-owl");
  });
  on("warp", ({ icon }) => {
    achievements.unlock("first-warp");
    if (!icon || icon === "key") return;
    visited.add(icon);
    store.set("warpix-visited", [...visited]);
    if (visited.size >= 6) achievements.unlock("world-tour");
  });
  on("poke", () => {
    store.set("warpix-pokes", ++pokeTotal);
    if (pokeTotal >= 50) achievements.unlock("poke-50");
  });
  on("secret", () => achievements.unlock("warp-zone"));
  on("konami", () => achievements.unlock("konami"));
  on("score", ({ value, mult }) => {
    if (mult >= 4) achievements.unlock("combo");
    if (value >= 10000) achievements.unlock("score-10k");
  });
  on("bgm", ({ on: bgmOn }) => {
    if (!bgmOn) achievements.unlock("silence");
  });
  on("game-wave", () => achievements.unlock("invader"));
  on("game-boss", () => achievements.unlock("boss"));
  on("game-rank", () => achievements.unlock("ranker"));
  on("dream", () => achievements.unlock("dreamer"));
  on("game-over", ({ score: s }) => {
    if (s >= 1000) achievements.unlock("invader-pro");
  });
  on("ufo-down", () => {
    achievements.unlock("ufo");
    // 3機おとすごとにマザーシップ
    if (++ufoDown % 3 === 0) {
      npc.say(["……なにか おおきいのが\nちかづいてくる！"]);
      setTimeout(mothership, 3000);
    }
  });
})();

// ---------- マザーシップ（10発で撃沈） ----------
function mothership() {
  if (document.querySelector(".mothership")) return;
  emit("seen", { id: "mothership" });
  const HP = 10;
  let hp = HP;
  const el = document.createElement("button");
  el.type = "button";
  el.className = `mothership ${Math.random() < 0.5 ? "ltr" : "rtl"}`;
  el.setAttribute("aria-label", "マザーシップをうつ");
  el.style.top = `${60 + Math.floor(Math.random() * 100)}px`;
  el.innerHTML = `<span class="hp"><span class="hp-fill"></span></span>${pixelSvg(MOTHERSHIP)}`;
  const fill = el.querySelector(".hp-fill");

  el.addEventListener("click", (e) => {
    if (hp <= 0) return;
    hp--;
    fill.style.width = `${(hp / HP) * 100}%`;
    el.classList.remove("hurt");
    void el.offsetWidth;
    el.classList.add("hurt");
    if (hp > 0) {
      sound.sfx.hit();
      score.add(200, e.clientX, e.clientY);
      return;
    }
    // 撃沈：その場で止めて大爆発
    el.style.left = `${el.getBoundingClientRect().left}px`;
    el.classList.add("boom");
    el.innerHTML = pixelSvg(BOOM) + pixelSvg(BOOM) + pixelSvg(BOOM);
    [0, 200, 400].forEach((d) => setTimeout(sound.sfx.boom, d));
    stars.warp(1500);
    score.add(10000, e.clientX, e.clientY);
    achievements.unlock("mothership");
    npc.say(["やったー！\nマザーシップを たおした！"]);
    setTimeout(() => el.remove(), 900);
  });
  el.addEventListener("animationend", (e) => {
    if (!e.animationName.startsWith("mother-")) return;
    el.remove();
    npc.say(["にげられた……\nまた くるかも。"]);
  });
  document.body.append(el);
}

// ---------- 流れ星（つかまえると +500） ----------
(() => {
  const WISHES = [
    "ねがいごと した？",
    "ぼくは「もっと コインが\nほしい」って ねがった！",
    "ながれぼし キャッチ！\nいいこと ありそう。",
    "3かい となえられた？\nぼくは まにあわなかった……",
  ];

  function spawn() {
    if (document.hidden || playing() || dozing()) return;
    const el = document.createElement("button");
    el.type = "button";
    el.className = "shooting-star";
    emit("seen", { id: "star" });
    el.setAttribute("aria-label", "ながれぼしをつかまえる");
    el.style.top = `${Math.floor(innerHeight * (0.05 + Math.random() * 0.25))}px`;
    el.style.left = `${Math.floor(innerWidth * (0.5 + Math.random() * 0.45))}px`;
    el.addEventListener("click", (e) => {
      sound.sfx.twinkle();
      score.add(500, e.clientX, e.clientY);
      npc.say([WISHES[Math.floor(Math.random() * WISHES.length)]]);
      achievements.unlock("shooting-star");
      el.remove();
    });
    el.addEventListener("animationend", () => el.remove());
    document.body.append(el);
  }

  function schedule(delay) {
    setTimeout(() => {
      spawn();
      schedule(25000 + Math.random() * 25000);
    }, delay);
  }

  on("boot", () => {
    if (!reduceMotion) schedule(25000);
  });
})();

// ---------- ほうっておくとピクセが寝る ----------
(() => {
  const IDLE_MS = 40000;
  const DEMO_MS = 20000; // 寝てからデモプレイが始まるまで
  const DEMO_RUN_MS = 30000; // デモプレイを流す長さ。そのあとはページごと眠る
  let lastInput = performance.now();
  let sleeping = false;
  let sleptAt = 0;
  let demoAt = 0;

  // ページごと眠る：開きっぱなしで放っておかれたスマホの電池を食わないよう、星も点滅も止める
  function doze() {
    if (dozing()) return;
    if (game.isDemo()) game.close();
    document.body.classList.add("dozing");
    stars.pause();
    dream.pause();
  }

  function wake() {
    lastInput = performance.now();
    if (game.isDemo()) game.close();
    if (dozing()) {
      document.body.classList.remove("dozing");
      stars.resume();
    }
    if (!sleeping) return;
    sleeping = false;
    npc.sleep(false);
    const dreamt = dream.stop();
    npc.say(["はっ！ ねてないよ！\nねてないってば！", ...(dreamt ? [`……${dreamt} ゆめ なんて\nみてないってば。`] : [])]);
  }

  ["pointerdown", "pointermove", "keydown", "wheel", "touchstart"].forEach((type) =>
    addEventListener(type, wake, { passive: true })
  );

  setInterval(() => {
    if (document.hidden || !document.body.classList.contains("booted")) return;
    const now = performance.now();
    // ゲームセンターの筐体みたいに、だれもいないとデモプレイが始まり、しばらくするとページごと眠る
    if (sleeping) {
      if (dozing()) return;
      if (game.isDemo()) {
        if (now - demoAt > DEMO_RUN_MS) doze();
      } else if (now - sleptAt > DEMO_MS && !playing()) {
        if (reduceMotion) return doze();
        game.open({ demo: true });
        demoAt = now;
        emit("demo");
      }
      return;
    }
    if (playing() || npc.isAway() || now - lastInput < IDLE_MS) return;
    sleeping = true;
    sleptAt = now;
    npc.sleep(true);
    npc.say(["ふあぁ……\nちょっと ねむく なってきた。", "すやすや……"]);
    dream.start();
    achievements.unlock("sleepy");
  }, 1000);
})();

// ---------- リンクにカーソルを乗せると、ピクセが行き先を紹介 ----------
(() => {
  const COMMENTS = {
    youtube: "YOUTUBEは うごく えの せかい。\nポップコーンの よういは いい？",
    twitter: "TWITTERは ことりが\nさえずる せかい。",
    instagram: "INSTAGRAMは しゃしんの せかい。\nはい、チーズ！",
    booth: "BOOTHは おみせの せかい。\nなにか かっていく？",
    tumblr: "TUMBLRは ふしぎな\nブログの せかい。",
    spotify: "SPOTIFYは おんがくの せかい。\nこの BGMより いい きょく ある？",
    key: "そこは かくされた ワープゾーン。\nなかみは ひみつ……",
  };
  let lastIcon = null;
  document.querySelectorAll(".pixel-btn").forEach((btn) => {
    const icon = btn.querySelector("[data-icon]")?.dataset.icon;
    const show = () => {
      // あいさつより先に紹介しない（スタート直後にカーソルの下へボタンが出てきたときなど）
      if (icon === lastIcon || !npc.ready() || !COMMENTS[icon]) return;
      lastIcon = icon;
      npc.say([COMMENTS[icon]]);
    };
    btn.addEventListener("mouseenter", show);
    btn.addEventListener("focus", show);
  });
})();

// ---------- マウスのあとに残るキラキラ ----------
(() => {
  if (reduceMotion) return;
  const COLORS = ["var(--fg)", "var(--accent)", "var(--accent-2)", "var(--gold)"];
  let last = 0;
  addEventListener("pointermove", (e) => {
    if (e.pointerType !== "mouse" || game.isOpen()) return;
    const now = performance.now();
    if (now - last < 50) return;
    last = now;
    const el = document.createElement("span");
    el.className = "sparkle";
    el.style.left = `${Math.floor(e.clientX / 4) * 4}px`;
    el.style.top = `${Math.floor(e.clientY / 4) * 4 + 8}px`;
    el.style.background = COLORS[Math.floor(Math.random() * COLORS.length)];
    document.body.append(el);
    setTimeout(() => el.remove(), 500);
  });
})();

// ---------- INSERT COIN（ミニゲームの入り口） ----------
document.getElementById("coin-slot").addEventListener("click", () => {
  sound.sfx.coin();
  game.open();
});

// ---------- 開発者ツールをのぞいた人へ ----------
console.log(
  "%cWARPIX-LINK",
  "font: 24px 'Press Start 2P', monospace; color: #f4f4f4; text-shadow: 3px 0 #ff4fa3, 6px 3px #000; padding: 8px 0;"
);
console.log("%c ここまで のぞきに きたの？ じゃあ pixe() って うってみて。", "color: #3ee8ff;");
window.pixe = () => {
  sound.sfx.coin();
  npc.jump();
  npc.say(["コンソールから よんだ？\nのぞきみは ほどほどに ね。", "ひみつの コマンド：\ngameboy / party / pixe / warp / help"]);
  achievements.unlock("hacker");
  return "🕹 HELLO, HACKER.";
};
