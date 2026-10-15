// ---------- ピクセの おみくじ：1 日 1 回。きょうの ラッキーリンクを おしえてくれる ----------
// 結果は「日付 ＋ このブラウザだけの種」で決まるので、同じ日に何回ひらいても同じ。
const omikuji = (() => {
  const KEY = "warpix-omikuji";
  const pad2 = (n) => String(n).padStart(2, "0");
  const ymdOf = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
  const ymd = ymdOf(today());
  const preview = new URLSearchParams(location.search).has("date");

  const FORTUNES = [
    { name: "だいきち", weight: 2, line: "なにを しても うまく いく ひ！ ワープ びより。" },
    { name: "ちゅうきち", weight: 3, line: "いい ことが ちょっと ある。そらを みあげて。" },
    { name: "しょうきち", weight: 3, line: "ちいさな しあわせが まってる。" },
    { name: "きち", weight: 3, line: "いつもどおりが いちばん。" },
    { name: "すえきち", weight: 2, line: "あとから いいこと くるかも。あせらずに。" },
  ];
  const COLORS = [
    { name: "ピンク", css: "var(--accent)" },
    { name: "シアン", css: "var(--accent-2)" },
    { name: "きんいろ", css: "var(--gold)" },
    { name: "しろ", css: "var(--fg)" },
    { name: "むらさき", css: "var(--btn-hover)" },
  ];

  // このブラウザだけの種（はじめて引くときに作る）
  const state = store.get(KEY, null) ?? { seed: Math.floor(Math.random() * 2 ** 31), last: null, count: 0 };
  const save = () => !preview && store.set(KEY, state);

  // 日付と種から決まる乱数（同じ日なら同じ結果）
  function rngFor(day) {
    let h = state.seed ^ 0x9e3779b9;
    for (const ch of day) h = Math.imul(h ^ ch.charCodeAt(0), 2654435761);
    return () => {
      h ^= h >>> 15;
      h = Math.imul(h, 2246822507);
      h ^= h >>> 13;
      h = Math.imul(h, 3266489909);
      h ^= h >>> 16;
      return (h >>> 0) / 4294967296;
    };
  }

  function draw(day = ymd) {
    const r = rngFor(day);
    const total = FORTUNES.reduce((a, f) => a + f.weight, 0);
    let x = r() * total;
    const fortune = FORTUNES.find((f) => (x -= f.weight) < 0) ?? FORTUNES[0];
    // ラッキーリンク：あまり行っていないリンクほど出やすい
    const links = [...document.querySelectorAll(".pixel-btn:not(.secret)")];
    const counts = favorite.stats ?? {};
    const weights = links.map((el) => 1 / (1 + (counts[el.querySelector("[data-icon]").dataset.icon]?.n ?? 0)));
    let y = r() * weights.reduce((a, b) => a + b, 0);
    const link = links.find((_, i) => (y -= weights[i]) < 0) ?? links[0];
    const color = COLORS[Math.floor(r() * COLORS.length)];
    return { fortune, link, label: linkLabel(link), color };
  }

  // ---------- 画面 ----------
  const BOX = [
    "....pppppppp....",
    "....pwwwwwwp....",
    "..pppppppppppp..",
    "..pwwwwwwwwwwp..",
    "..pwwppwwppwwp..",
    "..pwwwwwwwwwwp..",
    "..pwwppwwppwwp..",
    "..pwwwwwwwwwwp..",
    "..pwwppwwppwwp..",
    "..pwwwwwwwwwwp..",
    "..pppppppppppp..",
    "................",
  ];
  const btn = document.getElementById("omikuji-btn");
  let overlay = null;

  function close() {
    overlay?.remove();
    overlay = null;
  }

  function show(result, fresh) {
    close();
    overlay = document.createElement("div");
    overlay.className = "omikuji";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-label", "ピクセの おみくじ");
    overlay.innerHTML = `
      <div class="omikuji-card">
        <div class="omikuji-box ${fresh && !reduceMotion ? "shake" : ""}">${pixelSvg(BOX)}</div>
        <div class="omikuji-result" ${fresh && !reduceMotion ? "hidden" : ""}>
          <p class="omikuji-kicker">きょうの うんせい</p>
          <p class="omikuji-fortune">${result.fortune.name}</p>
          <p class="omikuji-line">${result.fortune.line}</p>
          <dl>
            <dt>ラッキーリンク</dt><dd><button type="button" class="omikuji-link">${result.label} ▶</button></dd>
            <dt>ラッキーカラー</dt><dd><span class="omikuji-color" style="background:${result.color.css}"></span>${result.color.name}</dd>
          </dl>
          <p class="omikuji-from">— ピクセ</p>
        </div>
        <button type="button" class="omikuji-close">とじる</button>
      </div>`;
    overlay.querySelector(".omikuji-close").addEventListener("click", close);
    overlay.addEventListener("click", (e) => e.target === overlay && close());
    overlay.querySelector(".omikuji-link").addEventListener("click", (e) => {
      // おみくじから行くとボーナス（1 日 1 回）
      if (state.bonus !== ymd) {
        state.bonus = ymd;
        save();
        score.add(777, e.clientX, e.clientY);
      }
      close();
      result.link.click();
    });
    document.body.append(overlay);
    overlay.querySelector(".omikuji-close").focus({ preventScroll: true });
    if (fresh && !reduceMotion) {
      sound.sfx.text();
      setTimeout(() => {
        if (!overlay) return;
        overlay.querySelector(".omikuji-box").classList.remove("shake");
        overlay.querySelector(".omikuji-result").hidden = false;
        result.fortune.name === "だいきち" ? sound.sfx.fanfare() : sound.sfx.coin();
      }, 1200);
    }
  }

  function pull() {
    const result = draw();
    const fresh = state.last !== ymd;
    if (fresh) {
      state.last = ymd;
      state.count++;
      save();
      achievements.unlock("omikuji");
      if (result.fortune.name === "だいきち") achievements.unlock("daikichi");
      grow.write("omikuji", `おみくじは ${result.fortune.name}。ラッキーリンクは ${result.label}。`);
    }
    show(result, fresh);
    emit("omikuji", { name: result.fortune.name });
    if (!fresh && npc.ready()) npc.say(["きょうは もう ひいたよ。\nあしたまた ひいてね。"]);
  }

  btn.addEventListener("click", pull);
  cheats.add("omikuji", pull);
  addEventListener("keydown", (e) => e.key === "Escape" && overlay && close());

  return { draw, pull };
})();
