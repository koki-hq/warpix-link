// ---------- お気に入りのリンク：ピクセが覚えていて、しるしで みせる（すすめない、v1.52） ----------
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

  // いちばん多く行っていて、MIN_FAV 回以上なら「お気に入り」（同点ならなし）
  function fav() {
    const ranked = linksNow().map((l) => ({ ...l, n: stats[l.icon]?.n ?? 0 })).sort((a, b) => b.n - a.n);
    if (ranked[0].n < MIN_FAV || ranked[0].n === ranked[1]?.n) return null;
    return ranked[0];
  }

  // ---------- ハートのしるし ----------
  const HEART = [".pp.pp.", "ppppppp", "ppppppp", ".ppppp.", "..ppp..", "...p..."];
  function renderMark() {
    document.querySelectorAll(".fav-mark").forEach((m) => m.remove());
    const f = fav();
    if (!f) return;
    const mark = document.createElement("span");
    mark.className = "fav-mark";
    mark.title = "よく いく せかい";
    mark.innerHTML = `${pixelSvg(HEART)}<span class="sr-only">（よく いく せかい）</span>`;
    f.el.append(mark);
  }

  // ---------- 行ったリンクを数える ----------
  on("link", ({ icon }) => {
    const l = byIcon(icon);
    if (!l) return;
    const s = (stats[icon] ??= { n: 0, last: null });
    s.n++;
    s.last = ymd;
    saveStats();
    renderMark();
    grow.write("warp", `${l.label}へ ワープした。`);
    if (s.n >= REGULAR) achievements.unlock("regular");
  });

  // v1.51 までは あいさつの あと「きょうも 〜に いく？」「さいきん 〜に いってないね」「〜は まだ いったこと ないよね？」と
  // そっと すすめて いたが、やめた（本人「うざい。行き先は 自分で わかってる」、2026-10-20 チューニング）。
  // おぼえて いる ことは、リンクの しるしで だまって みせる

  on("cassette", renderMark);
  renderMark();
  return { fav, stats };
})();
