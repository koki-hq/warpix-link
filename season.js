// ---------- 季節イベント：日付でページが勝手に変わる ----------
// ?date=2026-10-31 のように付けると、その日のページを先取りできる
const season = (() => {
  const EVENTS = {
    halloween: { from: [10, 24], to: [10, 31] },
    christmas: { from: [12, 18], to: [12, 25] },
    newyear: { from: [1, 1], to: [1, 7] },
    tanabata: { from: [7, 1], to: [7, 7] },
  };

  const d = today();
  const md = (d.getMonth() + 1) * 100 + d.getDate();
  const current = eventDays() && Object.keys(EVENTS).find((k) => {
    const { from, to } = EVENTS[k];
    return md >= from[0] * 100 + from[1] && md <= to[0] * 100 + to[1];
  });

  // ---------- 帽子（その季節を一度見たら、きせかえでいつでも選べる） ----------
  wardrobe.addHat("pumpkin", {
    name: "かぼちゃ", unlock: "season:halloween", hint: "ハロウィンの じきに あえるかも", top: 0,
    rows: [
      ".......oo.......",
      ".....kkkkkk.....",
      "....kkokkokk....",
      "....kkokkokk....",
    ],
  });
  wardrobe.addHat("santa", {
    name: "サンタぼう", unlock: "season:christmas", hint: "クリスマスの じきに あえるかも", top: 0,
    rows: [
      "..........ww....",
      "......RRRRRw....",
      ".....RRRRRRR....",
      "....wwwwwwww....",
    ],
  });
  wardrobe.addHat("hachimaki", {
    name: "はちまき", unlock: "season:newyear", hint: "おしょうがつに あえるかも", top: 5,
    rows: [
      "..pppppppppppp..",
      ".............pw.",
    ],
  });
  wardrobe.addHat("tanzaku", {
    name: "たんざく", unlock: "season:tanabata", hint: "たなばたの じきに あえるかも", top: 0,
    rows: [
      ".......cc.......",
      ".......cc.......",
      ".......cc.......",
      ".......cc.......",
    ],
  });

  const BAT = [
    "v....vv....v",
    "vv..vvvv..vv",
    "vvvvpvvpvvvv",
    ".vvvvvvvvvv.",
    "..v.vvvv.v..",
    ".....vv.....",
  ];

  // ジングルベル（ミ ミ ミー ／ ミ ミ ミー ／ ミ ソ ド レ ／ ミー）
  const JINGLE = {
    lead: [
      76, null, 76, null, 76, null, null, null,
      76, null, 76, null, 76, null, null, null,
      76, null, 79, null, 72, null, 74, null,
      76, null, null, null, null, null, null, null,
    ],
    bass: [48, 48, 48, 43],
  };

  const ETO = ["さる", "とり", "いぬ", "いのしし", "ねずみ", "うし", "とら", "うさぎ", "たつ", "へび", "うま", "ひつじ"];

  // ---------- 雪・天の川を描く canvas（星の上に重ねる） ----------
  function fxCanvas() {
    const cv = document.createElement("canvas");
    cv.className = "season-fx";
    cv.setAttribute("aria-hidden", "true");
    document.getElementById("stars").after(cv);
    const fit = () => {
      cv.width = innerWidth;
      cv.height = innerHeight;
    };
    fit();
    addEventListener("resize", fit);
    return cv;
  }

  function snow() {
    const cv = fxCanvas();
    const c = cv.getContext("2d");
    const flakes = Array.from({ length: 70 }, () => ({
      x: Math.random() * innerWidth,
      y: Math.random() * innerHeight,
      s: Math.random() < 0.3 ? 4 : 2,
      v: 0.4 + Math.random() * 0.6,
      p: Math.random() * Math.PI * 2,
    }));
    const draw = () => {
      c.clearRect(0, 0, cv.width, cv.height);
      c.fillStyle = "#f4f4f4";
      for (const f of flakes) {
        // ゆらゆら揺れながら落ちる。位置は 2px 単位にそろえる
        const x = Math.floor((f.x + Math.sin(f.p) * 6) / 2) * 2;
        c.fillRect(x, Math.floor(f.y / 2) * 2, f.s, f.s);
      }
    };
    const tick = () => {
      for (const f of flakes) {
        f.y += f.v;
        f.p += 0.02;
        if (f.y > cv.height) Object.assign(f, { y: -4, x: Math.random() * cv.width });
      }
      draw();
      requestAnimationFrame(tick);
    };
    draw();
    if (!reduceMotion) requestAnimationFrame(tick);
  }

  // 左下から右上へ斜めにかかる、星がぎっしりの帯
  function milkyWay() {
    const cv = fxCanvas();
    const c = cv.getContext("2d");
    const draw = () => {
      c.clearRect(0, 0, cv.width, cv.height);
      const n = Math.round((cv.width * cv.height) / 900);
      for (let i = 0; i < n; i++) {
        const t = Math.random();
        const off = (Math.random() + Math.random() + Math.random() - 1.5) * 90; // まんなかほど濃い
        const x = t * cv.width + off * 0.6;
        const y = (1 - t) * cv.height + off;
        c.fillStyle = Math.random() < 0.15 ? "#3ee8ff" : Math.random() < 0.1 ? "#ffd84a" : "#f4f4f4";
        c.globalAlpha = 0.25 + Math.random() * 0.55;
        c.fillRect(Math.floor(x / 2) * 2, Math.floor(y / 2) * 2, 2, 2);
      }
      c.globalAlpha = 1;
    };
    draw();
    addEventListener("resize", draw);
  }

  // お正月の年賀状
  function nenga() {
    const year = d.getFullYear();
    const key = `warpix-nenga-${year}`;
    if (store.get(key, false)) return;
    store.set(key, true);
    const el = document.createElement("div");
    el.className = "nenga";
    el.setAttribute("role", "dialog");
    el.setAttribute("aria-label", "ピクセからの ねんがじょう");
    el.innerHTML = `
      <div class="nenga-card">
        <p class="nenga-kicker">HAPPY NEW YEAR ${year}</p>
        <p class="nenga-title">あけまして<br>おめでとう！</p>
        <div class="nenga-pixe">${pixelSvg(dress(NPC.idle))}</div>
        <p class="nenga-body">ことしは ${ETO[year % 12]}どし。<br>ことしも ワーピックスの ほしぞらで<br>いっぱい あそんでね。</p>
        <p class="nenga-from">ピクセより</p>
        <button type="button" class="nenga-close">とじる</button>
      </div>`;
    el.querySelector(".nenga-close").addEventListener("click", () => el.remove());
    el.addEventListener("click", (e) => e.target === el && el.remove());
    document.body.append(el);
    el.querySelector(".nenga-close").focus({ preventScroll: true });
    sound.sfx.fanfare();
  }

  const SETUP = {
    halloween() {
      ufoLook = BAT;
      wardrobe.wearSeasonal("pumpkin");
      npc.addIntro("トリック オア トリート！\nいまは ハロウィン ウィーク だよ。", { topic: "season" });
      npc.addIntro("……そらを とんでるの、\nUFOじゃなくて コウモリ かも。", { topic: "season" });
    },
    christmas() {
      snow();
      wardrobe.wearSeasonal("santa");
      sound.setSong(JINGLE);
      npc.addIntro("メリー クリスマス！\nそとは ゆきが ふってるよ。", { topic: "season" });
    },
    newyear() {
      wardrobe.wearSeasonal("hachimaki");
      npc.addIntro("あけまして おめでとう！\nことしも よろしくね。", { topic: "season" });
    },
    tanabata() {
      milkyWay();
      wardrobe.wearSeasonal("tanzaku");
      npc.addIntro("きょうは たなばた。\nあまのがわが みえるかな？", { topic: "season" });
      npc.addIntro("ねがいごと、こころの なかで\nとなえておいてね。", { topic: "season" });
    },
  };

  if (current) {
    document.body.classList.add(`season-${current}`);
    wardrobe.seeSeason(`season:${current}`);
    SETUP[current]();
    on("boot", () => {
      achievements.unlock("season");
      if (current === "newyear") setTimeout(nenga, 2500);
    });
  }

  // 季節の曲（クリスマスはジングルベル）。作曲画面の「もとの BGM に もどす」で使う
  return { current, song: current === "christmas" ? JINGLE : null, bat: BAT };
})();
