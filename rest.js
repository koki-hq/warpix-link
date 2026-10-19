// ---------- アプリの ショートカット と、ピクセの「きゅうけい しよう」 ----------
// ショートカット：ホーム画面の アイコンを ながおしすると「ミニゲーム」「さっきょく」「おみくじ」（?go=◯◯ で ひらく）。
// ?go=manual（とりあつかい せつめいしょ）は PRESS START の まえに ひらく ので manual.js が うけもつ。
// きゅうけい：ずっと あそんで 50 ぷん たつと、ピクセが めを やすめようと いう。「やすむ」で 20 びょう とおくを みる。
const rest = (() => {
  // ---------- ショートカット ----------
  const GO = {
    game: () => game.open(),
    compose: () => composer.open(),
    omikuji: () => omikuji.pull(),
  };
  const go = new URLSearchParams(location.search).get("go");
  on("boot", () => {
    if (!GO[go]) return;
    setTimeout(() => {
      if (!playing() && !document.querySelector("dialog[open]")) GO[go]();
    }, reduceMotion ? 300 : 1200);
  });

  // ---------- きゅうけい ----------
  const ASK_AFTER = 50 * 60000; // つづけて あそんだ 時間
  const IDLE_GAP = 5 * 60000; // これより 長く さわらなければ、「あそんでいない」
  const RESET_GAP = 10 * 60000; // これより 長く はなれたら、もう やすんだ ことに する
  const SECONDS = 20;
  const state = { active: 0, lastInput: Date.now(), lastTick: Date.now(), asking: false };

  ["pointerdown", "keydown", "wheel", "touchstart"].forEach((type) =>
    addEventListener(type, () => {
      const now = Date.now();
      if (now - state.lastInput > RESET_GAP) state.active = 0;
      state.lastInput = now;
    }, { passive: true })
  );
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden && Date.now() - state.lastTick > RESET_GAP) state.active = 0;
  });

  function tick() {
    const now = Date.now();
    const dt = Math.min(now - state.lastTick, 60000);
    state.lastTick = now;
    if (document.hidden || !document.body.classList.contains("booted") || simple.on) return;
    if (now - state.lastInput > IDLE_GAP) return;
    state.active += dt;
    if (state.active >= ASK_AFTER && !state.asking) offer();
  }
  setInterval(tick, 15000);

  function offer() {
    state.asking = true;
    const wait = () => {
      if (!npc.ready() || playing() || npc.isAway() || document.querySelector("dialog[open]")) return setTimeout(wait, 5000);
      const mins = Math.round(state.active / 60000);
      npc.ask(`もう ${mins}ぷん いっしょに いるね。\nちょっと めを やすめない？`, ["やすむ", "まだ だいじょうぶ"]).then((i) => {
        state.asking = false;
        if (i === 0) return lookFar();
        state.active = ASK_AFTER - 20 * 60000; // つぎは 20 ぷん あとに また きく
        if (i === 1) npc.say(["わかった。\nむりは しないでね。"]);
      });
    };
    wait();
  }

  // 20 びょう、とおくを みる（ピクセも めを とじる）
  let box = null;
  function lookFar() {
    if (box) return;
    box = document.createElement("div");
    box.className = "rest";
    box.setAttribute("role", "status");
    box.innerHTML = `
      <p class="rest-title">とおくを みてね</p>
      <p class="rest-count" aria-hidden="true">${SECONDS}</p>
      <p class="rest-hint">まどの そとや、へやの いちばん とおくを みよう</p>
      <p class="sr-only rest-live">${SECONDS}びょう、とおくを みよう</p>
      <button type="button" class="c-btn rest-stop">おわる</button>`;
    document.body.append(box);
    npc.sleep(true);
    npc.say(["……（ぼくも とおくを みてる）"]);
    const count = box.querySelector(".rest-count");
    const live = box.querySelector(".rest-live");
    let left = SECONDS;
    const timer = setInterval(() => {
      left--;
      count.textContent = String(left);
      if (left === 10) live.textContent = "あと 10びょう";
      if (left <= 0) finish(true);
    }, 1000);
    const early = (e) => {
      if (e.type === "keydown" && !["Escape", "Enter", " "].includes(e.key)) return;
      finish(false);
    };
    function finish(done) {
      if (!box) return; // Enter で おわると click も くるので、2 かいめは なにもしない
      clearInterval(timer);
      removeEventListener("keydown", early, true);
      box.remove();
      box = null;
      npc.sleep(false);
      state.active = 0;
      state.lastInput = Date.now();
      if (done) {
        sound.sfx.powerup();
        npc.say(["おつかれさま！\nめが すっきり したね。"]);
        achievements.unlock("rest");
        grow.write("rest", "いっしょに とおくを みて、めを やすめた。");
      } else {
        npc.say(["また こんど やすもうね。"]);
      }
    }
    box.querySelector(".rest-stop").addEventListener("click", () => finish(false));
    addEventListener("keydown", early, true);
    box.querySelector(".rest-stop").focus({ preventScroll: true });
  }

  return { state, tick, lookFar, ASK_AFTER };
})();
