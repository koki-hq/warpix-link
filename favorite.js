// ---------- ワープした かず：リンクごとに かぞえる（ハートの しるしは v1.52.1 で やめた） ----------
// 本人「ハートも 正直 いらん」。行き先を かぞえて みせるのは、ピクセが しゅやくで なくなる（2026-10-21 だい 2 かい かいぎ）。
// にっきの プロフィールは「ワープした かず」だけ。かずは 実績「いつもの せかい」にも つかう
// どのリンクに何回行ったかは、このブラウザの中だけに保存する（どこにも送らない）。
// リンクの並び順は変えない。
const favorite = (() => {
  const STATS_KEY = "warpix-links";
  const MIN_FAV = 3; // お気に入りになるのに必要な回数
  const REGULAR = 10; // 実績「いつもの せかい」
  const pad2 = (n) => String(n).padStart(2, "0");
  const ymdOf = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
  const ymd = ymdOf(today());

  const stats = store.get(STATS_KEY, {}); // { icon: { n, last } }
  const saveStats = () => store.set(STATS_KEY, stats);

  // ページにあるリンク（ひみつのワープゾーンは数えない）。カセットを いれかえると かわるので、そのつど よむ
  const linksNow = () => [...document.querySelectorAll(".pixel-btn:not(.secret)")].map((el) => ({
    el,
    icon: el.querySelector("[data-icon]")?.dataset.icon,
    label: linkLabel(el),
  }));
  const byIcon = (icon) => linksNow().find((l) => l.icon === icon);

  // ぜんぶの リンクへ ワープした かず
  const total = () => Object.values(stats).reduce((a, x) => a + (x?.n ?? 0), 0);

  // ---------- 行ったリンクを数える ----------
  on("link", ({ icon }) => {
    const l = byIcon(icon);
    if (!l) return;
    const s = (stats[icon] ??= { n: 0, last: null });
    s.n++;
    s.last = ymd;
    saveStats();
    grow.write("warp", `${l.label}へ ワープした。`);
    if (s.n >= REGULAR) achievements.unlock("regular");
  });

  // v1.51 までは あいさつの あと「きょうも 〜に いく？」「さいきん 〜に いってないね」「〜は まだ いったこと ないよね？」と
  // そっと すすめて いたが、やめた（本人「うざい。行き先は 自分で わかってる」、2026-10-20 チューニング）。

  return { total, stats };
})();
