// ---------- オープニング（v1.54）：はじめての 人を WARPIX の せかいに ひきこむ ----------
// 本人「ゲームの はじまり みたいな かんじ。そこで いっきに ひきこむ、せかいかんに。とくべつ えいぞう」
// 「さいしょは アプリとか ウェブサイト って より、ゲームの せかいが はじまった……なんだろう って かんじ。わくわく」
// 「で、やあ ぼくは ピクセ って かんじ。もちろん スキップ できる」（2026-10-22 だい 2 かい かいぎ）。
// ながれ：PRESS START → せつめいしょ →「はじめる」→ ここ → そのまま いつもの がめん（ボタンが ならぶ きどうの えんしゅつ）へ。
// べつの がめんでは なく、ほんものの がめんの うえで ながす。ほしぞらは ほんものの ほしぞら、ひかりの すじは ほんものの ワープ、
// しろくて まるい ものは ほんものの ピクセの はこに おちて、そのまま いつもの ピクセに なる。
// はじめての 1 かい だけ（「このページについて」から もういちど みられる）。うごきを へらす せっていの 人は、ゆれと くるくるを やめる
const prologue = (() => {
  const KEY = "warpix-prologue";
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const asked = new URLSearchParams(location.search).get("go") === "prologue";
  // テストでは WARPIX_PROLOGUE = false で とめる
  const should = () => window.WARPIX_PROLOGUE !== false && !simple.on && (asked || (window.WARPIX_FIRST && !store.get(KEY, false)));

  // こうじょう（32×24）。g かべ・s えんとつの さき・y まど・p とびら・d じめん
  const FACTORY = [
    "......................ss........",
    "......................ss........",
    ".....................gssg.......",
    ".....................gggg.......",
    "............gggg.....gggg.......",
    "...........gggggg....gggg.......",
    "..........gggggggg...gggg.......",
    ".........gggggggggg..gggg.......",
    "........gggggggggggggggggg......",
    ".......ggggggggggggggggggggg....",
    "......ggggggggggggggggggggggg...",
    ".....ggggggggggggggggggggggggg..",
    "....ggggggggggggggggggggggggggg.",
    "....ggggggggggggggggggggggggggg.",
    "....gggggggggggggggggggggggggggg",
    "....gggggggggggggggggggggggggggg",
    "....ggyyggyyggppppppggyyggyyggg.",
    "....ggyyggyyggppppppggyyggyyggg.",
    "....ggggggggggppppppgggggggggg..",
    "....ggggggggggppppppgggggggggg..",
    "....ggggggggggppppppgggggggggg..",
    "....ggggggggggppppppgggggggggg..",
    "dddddddddddddddddddddddddddddddd",
    "dddddddddddddddddddddddddddddddd",
  ];
  const COL = { g: "#2a2058", s: "#5a4fa0", y: "#ffd84a", p: "#ff4fa3", d: "#1a1433" };
  // タイムライン（びょう）
  const T = { line1: 1.4, line2: 3.2, factory: 5.8, pon: 8.6, warp: 9.4, land: 11.4, look: 13.4, end: 14.2 };
  const ease = (t) => (t < 0 ? 0 : t > 1 ? 1 : t * t * (3 - 2 * t));
  const seg = (t, a, b) => ease((t - a) / (b - a));

  // ---------- おと（この ばめん だけの ちいさな おと。こうかおんの おおきさに あわせる） ----------
  let ac = null;
  const N = (n) => 440 * Math.pow(2, (n - 69) / 12);
  function tone(freq, at, dur, { type = "square", vol = 0.06, slide = 0 } = {}) {
    if (!ac) return;
    const se = sound.volumes().se ?? 1;
    if (!se) return;
    const t0 = ac.currentTime + at;
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t0);
    if (slide) o.frequency.exponentialRampToValueAtTime(freq * slide, t0 + dur);
    g.gain.setValueAtTime(vol * se, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g).connect(ac.destination);
    o.start(t0);
    o.stop(t0 + dur + 0.02);
  }
  const SFX = {
    twinkle: (i) => tone(N(84 + [0, 4, 7, 12][i % 4]), 0, 0.3, { type: "triangle", vol: 0.04 }),
    pon: () => tone(N(60), 0, 0.14, { vol: 0.08, slide: 2.5 }),
    warp: () => tone(N(48), 0, 1.8, { type: "sawtooth", vol: 0.03, slide: 6 }),
    land: () => tone(N(43), 0, 0.18, { type: "triangle", vol: 0.12, slide: 0.6 }),
    blip: () => tone(N(88), 0, 0.06, { vol: 0.03 }),
    logo: () => {
      [72, 76, 79, 84].forEach((n, i) => tone(N(n), i * 0.09, 0.4, { vol: 0.06 }));
      tone(N(48), 0, 0.6, { type: "triangle", vol: 0.12 });
    },
  };

  function run(done) {
    try {
      ac = new (window.AudioContext || window.webkitAudioContext)();
      ac.resume?.();
    } catch {}
    const body = document.body;
    body.classList.add("prologue");
    const cv = document.createElement("canvas");
    cv.className = "prologue-film";
    cv.setAttribute("aria-hidden", "true");
    const skip = document.createElement("button");
    skip.type = "button";
    skip.className = "prologue-skip";
    skip.textContent = "SKIP ▶";
    const story = document.createElement("p");
    story.className = "sr-only";
    story.setAttribute("aria-live", "polite");
    body.append(cv, skip, story);
    const c = cv.getContext("2d");
    let w = 0;
    let h = 0;
    const size = () => {
      const r = devicePixelRatio || 1;
      w = innerWidth;
      h = innerHeight;
      cv.width = Math.round(w * r);
      cv.height = Math.round(h * r);
      c.setTransform(r, 0, 0, r, 0, 0);
      c.imageSmoothingEnabled = false;
    };
    size();
    addEventListener("resize", size);
    const sprite = document.getElementById("npc");
    const text = (str, x, y, a, px = 18, col = "#f4f4f4") => {
      if (a <= 0) return;
      c.globalAlpha = a;
      c.font = `${px}px "DotGothic16", monospace`;
      c.textAlign = "center";
      c.textBaseline = "middle";
      c.fillStyle = col;
      c.fillText(str, x, y);
      c.globalAlpha = 1;
    };
    const fired = new Set();
    const once = (k, fn) => !fired.has(k) && (fired.add(k), fn());
    const t0 = performance.now();
    let raf = 0;
    let finished = false;

    function finish() {
      if (finished) return;
      finished = true;
      cancelAnimationFrame(raf);
      removeEventListener("resize", size);
      cv.remove();
      skip.remove();
      story.remove();
      store.set(KEY, true);
      npc.sleep(false);
      body.classList.remove("prologue", "prologue-npc", "shake");
      body.classList.add("prologue-done");
      SFX.logo();
      done();
    }
    skip.addEventListener("click", finish);

    function frame(now) {
      const t = (now - t0) / 1000;
      c.clearRect(0, 0, w, h);
      // まっくらから、ほしぞらが ともる
      const veil = 1 - seg(t, 0, 2.2);
      if (veil > 0) {
        c.fillStyle = `rgba(15, 11, 30, ${0.92 * veil})`;
        c.fillRect(0, 0, w, h);
      }
      [0.3, 0.9, 1.5].forEach((at, i) => t >= at && once(`tw${i}`, () => SFX.twinkle(i)));

      // ものがたり
      const out = 1 - seg(t, T.factory - 0.8, T.factory);
      const cy = h * 0.38;
      // 「なにか」で ひっぱって、えんとつから でて くる ピクセが こたえに なる（本人が えらんだ A）
      text("ずっと とおくの ほしぞらの かたすみで", w / 2, cy, seg(t, T.line1, T.line1 + 1) * out, 17);
      text("ちいさな こうじょうが きょうも", w / 2, cy + 42, seg(t, T.line2, T.line2 + 1) * out, 17);
      text("なにかを つくっています。", w / 2, cy + 72, seg(t, T.line2, T.line2 + 1) * out, 17);
      if (t >= T.line1) once("s1", () => (story.textContent = "ずっと とおくの ほしぞらの かたすみで"));
      if (t >= T.line2) once("s2", () => (story.textContent = "ちいさな こうじょうが きょうも なにかを つくっています。"));

      // こうじょう（したから のぼって きて、ワープで しずむ）
      const px = Math.max(5, Math.min(9, Math.floor(w / 46)));
      const fw = 32 * px;
      const fx = Math.round(w / 2 - fw / 2);
      const fIn = seg(t, T.factory, T.factory + 1.4);
      const fOut = seg(t, T.warp + 0.2, T.warp + 1.2);
      const fy = Math.round(h - 24 * px * fIn + fOut * 24 * px);
      if (fIn > 0 && fOut < 1) {
        c.globalAlpha = 1 - fOut;
        FACTORY.forEach((row, j) => [...row].forEach((ch, i) => {
          if (!COL[ch]) return;
          c.fillStyle = COL[ch];
          c.fillRect(fx + i * px, fy + j * px, px, px);
        }));
        // かんばん
        const sa = (1 - fOut) * seg(t, T.factory + 1, T.factory + 1.8);
        c.globalAlpha = sa;
        c.fillStyle = "#1a1433";
        c.fillRect(fx + 5 * px, fy + 12 * px, 25 * px, 3 * px);
        c.strokeStyle = "#ffd84a";
        c.lineWidth = 2;
        c.strokeRect(fx + 5 * px, fy + 12 * px, 25 * px, 3 * px);
        c.globalAlpha = 1;
        text("WARPIX製作所", fx + 17.5 * px, fy + 13.5 * px + 1, sa, Math.round(px * 1.9), "#ffd84a");
        if (t >= T.factory + 1) once("s3", () => (story.textContent = "WARPIX製作所"));
        // けむり
        for (let k = 0; k < 4; k++) {
          const p = (t * 0.5 + k / 4) % 1;
          c.globalAlpha = (1 - fOut) * (1 - p) * 0.6;
          c.fillStyle = "#8a80b8";
          const s = px + p * px;
          c.fillRect(fx + 22.5 * px + p * 30, fy - p * 70, s, s);
        }
        c.globalAlpha = 1;
      }

      // ぽん：えんとつから しろくて まるい ものが とびだして、ワープの ひかりの なかを ピクセの はこへ
      if (t >= T.pon) once("pon", SFX.pon);
      if (t >= T.warp) {
        once("warp", () => {
          SFX.warp();
          stars.warp(1800);
        });
      }
      if (t >= T.pon && t < T.land) {
        const r = sprite.getBoundingClientRect();
        const sx = fx + 23 * px;
        const sy = fy;
        const tx = r.left + r.width / 2;
        const ty = r.top + r.height / 2;
        const p = (t - T.pon) / (T.land - T.pon);
        const x = sx + (tx - sx) * ease(p);
        const up = Math.sin(Math.min(1, p * 2.2) * Math.PI) * Math.min(220, h * 0.3);
        const y = sy - up + (ty - sy) * ease(Math.max(0, (p - 0.35) / 0.65));
        const rad = 3 + (r.width * 0.3 - 3) * ease(p);
        c.save();
        c.translate(x, y);
        if (!reduce) c.rotate(p * Math.PI * 6);
        c.fillStyle = "#f4f4f4";
        c.beginPath();
        c.arc(0, 0, rad, 0, Math.PI * 2);
        c.fill();
        c.fillStyle = "#ff4fa3";
        c.fillRect(-2, -rad - 3, 4, 4);
        c.restore();
      }

      // ぽすっ：ピクセの はこに おちる。めを とじて いる
      if (t >= T.land) {
        once("land", () => {
          SFX.land();
          npc.sleep(true);
          body.classList.add("prologue-npc");
          if (!reduce) {
            body.classList.remove("shake");
            void body.offsetWidth;
            body.classList.add("shake");
          }
        });
      }
      // ま……まばたき……こちらに きづいて ぴょん
      if (t >= T.land + 1.3) once("b1", () => npc.sleep(false));
      if (t >= T.land + 1.45) once("b2", () => npc.sleep(true));
      if (t >= T.land + 1.8) once("b3", () => npc.sleep(false));
      if (t >= T.land + 1.95) once("b4", () => npc.sleep(true));
      if (t >= T.look) {
        once("look", () => {
          npc.sleep(false);
          npc.jump();
          SFX.blip();
        });
      }
      if (t >= T.end) return finish();
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);
  }

  // 「このページについて」から もういちど
  document.getElementById("about-prologue")?.addEventListener("click", () => {
    location.href = `${location.pathname}?go=prologue`;
  });

  return { should, run, T };
})();
