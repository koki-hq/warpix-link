// ---------- ワープ ダイブ（v1.27 → v2.0）：リンクを おすと、ピクセが ワープあなに とびこんで いっしょに いく ----------
// リンクは いつもどおり すぐ ひらく（ここは かざりだけ）。このタブに もどってくると、
// おした リンクの あなから ピクセが とびだして、ひとこと いう。
// （いっしょに いくか、みおくるか は あとで きめる。2026-11-10 本人「一旦ピクセとワープする設定で　進めておk」）
const warpDive = (() => {
  const HOLE = [
    "....cccccc....",
    "..ccppppppcc..",
    ".cpoooooooopc.",
    ".cpoooooooopc.",
    "..ccppppppcc..",
    "....cccccc....",
  ];
  const WAIT = 2200; // タブを うつらなかった ときは、これだけ たったら もどる
  let trip = null;

  const center = (el) => {
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  };

  function openHole(tile) {
    const r = tile.getBoundingClientRect();
    const hole = document.createElement("div");
    hole.className = "warp-hole";
    hole.setAttribute("aria-hidden", "true");
    hole.innerHTML = pixelSvg(HOLE);
    hole.style.left = `${r.right - 52}px`;
    hole.style.top = `${r.top + r.height / 2 - 10}px`;
    document.body.append(hole);
    hole.animate([{ transform: "scale(0, 0)" }, { transform: "scale(1.2, 0.6)" }, { transform: "scale(1, 1)" }], { duration: 180, easing: "steps(3)" });
    return hole;
  }
  function closeHole(hole, delay = 0) {
    const a = hole.animate([{ transform: "scale(1, 1)" }, { transform: "scale(0, 0)" }], { duration: 180, delay, easing: "steps(3)", fill: "forwards" });
    a.finished.then(() => hole.remove(), () => hole.remove());
  }
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

  function dive(tile, name) {
    sound.sfx.powerup();
    if (reduceMotion || trip || pixe.isAway()) return false;
    const sprite = document.getElementById("pixe");
    const from = center(sprite);
    const hole = openHole(tile);
    const to = center(hole);
    pixe.setAway(true);
    trip = { tile, name, left: document.hidden, timer: null, id: tile.dataset.id };
    trip.flying = fly(from, to, (dx, dy) => [
      { transform: "translate(0, 0) scale(1) rotate(0deg)" },
      { transform: `translate(${dx * 0.5}px, ${dy * 0.5 - 90}px) scale(0.9) rotate(180deg)` },
      { transform: `translate(${dx}px, ${dy}px) scale(0) rotate(540deg)` },
    ], 650).then(() => closeHole(hole, 120));
    trip.timer = setTimeout(() => !document.hidden && back(), WAIT);
    return true;
  }

  async function back() {
    const t = trip;
    if (!t || t.returning) return;
    t.returning = true;
    clearTimeout(t.timer);
    await t.flying;
    const sprite = document.getElementById("pixe");
    // おなじ リンクが まだ みえて いれば、その あなから もどる（グループを かえて いたら そのまま もどる）
    const tile = document.querySelector(`.tile[data-id="${t.id}"]`);
    if (tile && tile.getClientRects().length) {
      const hole = openHole(tile);
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
    // ほんとうに むこうへ いって もどってきた ときだけ、ひとこと
    if (t.left) pixe.say(pixe.backLine(t.name));
  }

  document.addEventListener("visibilitychange", () => {
    if (!trip) return;
    if (document.hidden) {
      trip.left = true;
      clearTimeout(trip.timer);
    } else {
      setTimeout(back, 400);
    }
  });

  return { dive, back, trip: () => trip };
})();
