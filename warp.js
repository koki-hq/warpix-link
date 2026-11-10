// ---------- ワープ ダイブ（v1.27）：リンクを おすと、ピクセが ワープあなに とびこんで いっしょに いく ----------
// リンクは いつもどおり すぐ ひらく（ここは かざりだけ）。このタブに もどってくると、
// おした リンクの あなから ピクセが とびだして、むこうの せかいの おみやげばなしを する（ことばは cassette.js の back）。
// v2.0 も いっしょに ワープ（2026-11-10 本人「一旦ピクセとワープする設定で　進めておk」）
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
  const WAIT = 2200; // タブを うつらなかった ときは、これだけ たったら もどる

  let trip = null; // { id, btn, flying, timer, left }

  const center = (el) => {
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  };

  // リンクの みぎはしに あなを あける。いろは その リンクの たなで かわる（v1.30）
  function openHole(btn, id) {
    const r = btn.getBoundingClientRect();
    const hole = document.createElement("div");
    hole.className = "warp-hole";
    hole.dataset.shelf = CASSETTES.shelfOf(id);
    hole.setAttribute("aria-hidden", "true");
    hole.innerHTML = pixelSvg(HOLE, { ...PALETTE, ...CASSETTES.GIFTS[hole.dataset.shelf].hole });
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
    el.innerHTML = pixe.look();
    el.style.left = `${from.x - 32}px`;
    el.style.top = `${from.y - 32}px`;
    document.body.append(el);
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const a = el.animate(frames(dx, dy), { duration, easing: "steps(14)", fill: "forwards" });
    return a.finished.then(() => el.remove(), () => el.remove());
  }

  function dive(btn, id) {
    stars.warp(900);
    sound.sfx.powerup();
    if (reduceMotion || trip || pixe.isAway()) return false;
    const sprite = document.getElementById("npc");
    if (!sprite.getClientRects().length) return false;
    const from = center(sprite);
    const hole = openHole(btn, id);
    const to = center(hole);
    pixe.setAway(true);
    trip = { id, btn, left: document.hidden, timer: null };
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
    // おなじ リンクが まだ みえて いれば、その あなから もどる（グループを かえて いたら そのまま もどる）
    const btn = document.querySelector(`.links .pixel-btn[data-id="${t.id}"]`);
    if (btn && btn.getClientRects().length && sprite.getClientRects().length) {
      const hole = openHole(btn, t.id);
      sound.sfx.coin();
      await fly(center(hole), center(sprite), (dx, dy) => [
        { transform: "translate(0, 0) scale(0) rotate(-540deg)" },
        { transform: `translate(${dx * 0.5}px, ${dy * 0.5 - 90}px) scale(0.9) rotate(-180deg)` },
        { transform: `translate(${dx}px, ${dy}px) scale(1) rotate(0deg)` },
      ], 650);
      closeHole(hole);
    }
    pixe.setAway(false);
    trip = null;
    // ほんとうに むこうへ いって もどってきた ときだけ、おみやげばなし
    if (t.left) pixe.say(pixe.backLine(t.id));
  }

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
