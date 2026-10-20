// ---------- アプリの ショートカット と、ピクセの「きゅうけい しよう」 ----------
// ショートカット：ホーム画面の アイコンを ながおしすると「ミニゲーム」「さっきょく」「おみくじ」（?go=◯◯ で ひらく）。
// ?go=manual（とりあつかい せつめいしょ）は PRESS START の まえに ひらく ので manual.js が うけもつ。
// きゅうけい：rest と うつと、ピクセと 20 びょう とおくを みる（v1.52 から ピクセの ほうからは きかない）。
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
  // v1.51 までは 50 ぷん あそぶと ピクセが「めを やすめない？」と きいて いたが、やめた
  // （本人「いらん すぎる だまれって 感じ」、2026-10-20 チューニング）。とおくを みる がめんは rest と うつと みられる
  const SECONDS = 20;

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

  cheats.add("rest", lookFar);
  return { lookFar };
})();
