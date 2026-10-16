// ---------- ワープ ダイブ（v1.27）：リンクを おすと、ピクセが ワープあなに とびこんで いっしょに いく ----------
// リンクは いつもどおり すぐ ひらく（ここは かざりだけ）。このタブに もどってくると、
// おした リンクの あなから ピクセが とびだして、むこうの せかいの おみやげばなしを する。
const warpDive = (() => {
  // ワープあな（ななめから みた だえん）
  const HOLE = [
    "....cccccc....",
    "..ccppppppcc..",
    ".cpoooooooopc.",
    ".cpoooooooopc.",
    "..ccppppppcc..",
    "....cccccc....",
  ];
  const LINES = {
    youtube: ["ただいま！ YOUTUBE の せかいは\nがめんが いっぱい ならんでた。", "ただいま！ どうがの せかいで\nおすすめに ながされそうに なった……"],
    twitter: ["ただいま！ ことりの せかいは\nみんな いっせいに しゃべってた。", "ただいま！ タイムラインが はやくて\nめが まわった〜"],
    instagram: ["ただいま！ しゃしんの せかいは\nきらきら していたよ。", "ただいま！ ぼくも しゃしん\nとって もらえば よかったな。"],
    booth: ["ただいま！ おみせの せかいで\nほしい ものが いっぱい あった。", "ただいま！ ドットの グッズ、\nつい ながめちゃった。"],
    tumblr: ["ただいま！ TUMBLR の せかいは\nふしぎな え が いっぱい。", "ただいま！ むこうは しずかで\nちょっと ねむく なった。"],
    spotify: ["ただいま！ おんがくの せかいで\nずっと ゆれてた♪", "ただいま！ むこうの きょくも いいけど、\nぼくの BGM も わすれないでね。"],
    key: ["ただいま！ ひみつの こうじょうを\nのぞいてきた。コードが いっぱい！"],
  };
  const OTHER = ["ただいま！ むこうの せかいも\nたのしかったよ。"];
  const WAIT = 2200; // タブを うつらなかった ときは、これだけ たったら もどる

  let trip = null; // { icon, label, btn, flying, timer, left }

  const center = (el) => {
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  };

  // リンクの みぎはしに あなを あける
  function openHole(btn) {
    const r = btn.getBoundingClientRect();
    const hole = document.createElement("div");
    hole.className = "warp-hole";
    hole.setAttribute("aria-hidden", "true");
    hole.innerHTML = pixelSvg(HOLE);
    hole.style.left = `${r.right - 72}px`;
    hole.style.top = `${r.top + r.height / 2 - 12}px`;
    document.body.append(hole);
    hole.animate([{ transform: "scale(0, 0)" }, { transform: "scale(1.2, 0.6)" }, { transform: "scale(1, 1)" }], { duration: 180, easing: "steps(3)" });
    return hole;
  }

  function closeHole(hole, delay = 0) {
    const a = hole.animate([{ transform: "scale(1, 1)" }, { transform: "scale(0, 0)" }], { duration: 180, delay, easing: "steps(3)", fill: "forwards" });
    a.finished.then(() => hole.remove(), () => hole.remove());
  }

  // ピクセの コピーを とばす（from → to、からだの まんなか どうし）
  function fly(from, to, frames, duration) {
    const el = document.createElement("div");
    el.className = "warp-pixe";
    el.setAttribute("aria-hidden", "true");
    el.innerHTML = pixelSvg(dress(NPC.idle));
    el.style.left = `${from.x - 32}px`;
    el.style.top = `${from.y - 32}px`;
    document.body.append(el);
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const a = el.animate(frames(dx, dy), { duration, easing: "steps(14)", fill: "forwards" });
    return a.finished.then(() => el.remove(), () => el.remove());
  }

  function dive(btn, icon) {
    if (reduceMotion || simple.on || trip || npc.isAway() || adventure.isActive()) return false;
    const sprite = document.getElementById("npc");
    if (!sprite.getClientRects().length) return false;
    const label = btn.textContent.replace(/（.*）/, "").replace("▶", "").trim();
    const from = center(sprite);
    const hole = openHole(btn);
    const to = center(hole);
    npc.setAway(true);
    sound.sfx.powerup();
    trip = { icon, label, btn, left: document.hidden, timer: null };
    trip.flying = fly(from, to, (dx, dy) => [
      { transform: "translate(0, 0) scale(1) rotate(0deg)" },
      { transform: `translate(${dx * 0.5}px, ${dy * 0.5 - 90}px) scale(0.9) rotate(180deg)` },
      { transform: `translate(${dx}px, ${dy}px) scale(0) rotate(540deg)` },
    ], 650).then(() => closeHole(hole, 120));
    // タブを うつらなかった ときは、すこし したら もどってくる
    trip.timer = setTimeout(() => !document.hidden && back(), WAIT);
    return true;
  }

  async function back() {
    const t = trip;
    if (!t || t.returning) return;
    t.returning = true;
    clearTimeout(t.timer);
    await t.flying;
    const sprite = document.getElementById("npc");
    // リンクが みえなく なっていたら（スクロールや まどの かわり）、あなは ださずに はこへ もどる
    const visible = t.btn.isConnected && t.btn.getClientRects().length && sprite.getClientRects().length;
    if (visible) {
      const hole = openHole(t.btn);
      sound.sfx.coin();
      await fly(center(hole), center(sprite), (dx, dy) => [
        { transform: "translate(0, 0) scale(0) rotate(-540deg)" },
        { transform: `translate(${dx * 0.5}px, ${dy * 0.5 - 90}px) scale(0.9) rotate(-180deg)` },
        { transform: `translate(${dx}px, ${dy}px) scale(1) rotate(0deg)` },
      ], 650);
      closeHole(hole);
    }
    npc.setAway(false);
    trip = null;
    if (t.left) {
      // ほんとうに むこうへ いって もどってきた ときだけ、おみやげばなし
      const lines = LINES[t.icon] ?? (CASSETTES.byId(t.icon)?.back ? [CASSETTES.byId(t.icon).back] : OTHER);
      npc.say([lines[Math.floor(Math.random() * lines.length)]]);
      achievements.unlock("warp-buddy");
      grow.write("dive", `${t.label} の せかいへ いっしょに ワープした。`);
    }
    emit("warp-back", { icon: t.icon, left: t.left });
  }

  on("warp", ({ icon }) => {
    const btn = document.querySelector(`.pixel-btn [data-icon="${icon}"]`)?.closest(".pixel-btn");
    if (btn) dive(btn, icon);
  });
  document.addEventListener("visibilitychange", () => {
    if (!trip) return;
    if (document.hidden) {
      trip.left = true;
      clearTimeout(trip.timer);
    } else {
      // もどった すぐは まだ がめんが おちついて いないので、ひと いき おいてから
      setTimeout(back, 400);
    }
  });

  return { dive, back, trip: () => trip };
})();
