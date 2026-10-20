// ---------- ピクセの さとがえり（v1.46）：ときどき「うまれた こうじょう」へ あそびに いって、むこうの はなしを もって かえる ----------
// うまれた こうじょう＝WARPIX製作所（ホームページ warpix.app の 町工場）。むこうの 世界には はいりこまず、
// ピクセが 里帰りして きいてきた はなしを してくれる だけ（ホームページの ひみつ「製品ごとに、すこしずつ ちがう ピクセが いるらしい」に そっと こたえる）。
// 1 日 1 かい まで。はじめて きた 日・あそんで いる とちゅう・しゅうらいの よるの まえあと・シンプルモードでは いかない。
const satogaeri = (() => {
  const KEY = "warpix-satogaeri"; // { last: 日付, n: かいすう }
  const WAIT = 4 * 60 * 1000; // ひらいてから これだけ たって、ひまなら いく
  const AWAY = 30 * 1000; // るすに する じかん
  const pad2 = (n) => String(n).padStart(2, "0");
  const ymdOf = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
  const peek = () => /[?&]date=/.test(location.search);
  const sprite = document.getElementById("npc");
  let state = store.get(KEY, { last: null, n: 0 });
  let out = false;
  let scheduled = false; // きょう いく よていが ある

  // むこうで きいてきた はなし（ホームページの なかまたち）
  const STORIES = [
    ["ヘルメットを かぶった ピクセに あったよ。", "ぼくに そっくりで、いとこ みたいだった。"],
    ["ゲンさんの おべんとうの からあげを、", "スズメが ねらってた。"],
    ["3じの おやつは たいやき だった。", "しっぽまで あんこ……！"],
    ["そらを ソラマメ号が ゆっくり とんでた。", "まどの おくで、だれかが てを ふった きがする。"],
    ["トタンやねの うえで 入道雲を みたよ。", "むこうは いつも はれてるんだ。"],
    ["じめんの したに、", "ふしぎな いせきが あるって うわさ……"],
  ];

  // しゅうらいの よる（まいつき さいしょの 日曜 21:00）の まえあと 20 ぷんは いかない
  const nearRaidNight = () => {
    const at = raid.nextNight?.(Date.now() - 20 * 60 * 1000);
    return at !== null && at !== undefined && Math.abs(Date.now() - at) < 20 * 60 * 1000;
  };
  const free = () =>
    document.body.classList.contains("booted") && !simple.on && !playing() && !dozing() && npc.ready() && !npc.busy() &&
    !npc.isAway() && !adventure.isActive() && !(raid.active?.() ?? false) && !postcard.isOpen() && !document.querySelector("dialog[open], .credits");

  function go({ away = AWAY } = {}) {
    if (out) return false;
    out = true;
    const day = ymdOf(today());
    state = { last: day, n: (state.n ?? 0) + 1 };
    if (!peek()) store.set(KEY, state);
    npc.say(["ちょっと うまれた こうじょうに\nあそびに いってくる！", "すぐ もどるね。"]);
    setTimeout(() => {
      npc.setAway(true);
      sprite.classList.add("satogaeri");
      sprite.setAttribute("aria-label", "ピクセは WARPIX製作所へ おでかけ ちゅう");
    }, 2600);
    setTimeout(back, 2600 + away);
    return true;
  }

  function back() {
    // ぼうけんや ワープの とちゅうなら、おわるまで まつ
    if (adventure.isActive() || (typeof warpDive !== "undefined" && warpDive.trip())) return setTimeout(back, 2000);
    out = false;
    sprite.classList.remove("satogaeri");
    sprite.setAttribute("aria-label", "ナビゲーターのピクセルをつつく");
    npc.setAway(false);
    npc.jump();
    sound.sfx.coin?.();
    const story = STORIES[(state.n - 1 + STORIES.length) % STORIES.length];
    // 「こうじょう」が つづかない ように（v1.47.1）
    npc.say(["ただいま！ むこうで ね、", story.join("\n"), "むこうの ようすは、いちばん したの\n「製作所だより」の さきで みられるよ。"]);
    grow.write("satogaeri", `うまれた こうじょうに さとがえり。${story.join("")}`, { force: true });
    achievements.unlock("satogaeri");
  }

  // ひらいて しばらく たったら、ひまな ときに 1 かいだけ
  on("boot", () => {
    if (simple.on) return;
    const day = ymdOf(today());
    if (state.last === day || (grow.state.days?.length ?? 0) < 2) return;
    scheduled = true;
    setTimeout(function tryGo() {
      if (state.last === day || out) return;
      if (!free() || nearRaidNight()) return setTimeout(tryGo, 30000);
      if (npc.turn()) go(); // 1 かい ひらいて 1 つ まで（v1.52）。ほかの 話を したら この かいは いかない
    }, WAIT);
  });

  cheats.add("satogaeri", () => free() && go());
  return { go, back, free, stories: () => STORIES, state: () => state, scheduled: () => scheduled };
})();
