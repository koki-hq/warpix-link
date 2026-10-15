// ---------- お気に入りのリンク：ピクセが覚えていて、そっと勧める ----------
// どのリンクに何回行ったかは、このブラウザの中だけに保存する（どこにも送らない）。
// 押しつけないこと：聞くのは 1 日 1 回まで、2 回続けて断られたら 1 週間は聞かない。リンクの並び順は変えない。
const favorite = (() => {
  const STATS_KEY = "warpix-links";
  const ASK_KEY = "warpix-fav-ask";
  const MIN_FAV = 3; // お気に入りになるのに必要な回数
  const REGULAR = 10; // 実績「いつもの せかい」
  const preview = new URLSearchParams(location.search).has("date");
  const pad2 = (n) => String(n).padStart(2, "0");
  const ymdOf = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
  const dayDiff = (a, b) => Math.round((Date.parse(`${b}T12:00:00`) - Date.parse(`${a}T12:00:00`)) / 86400000);
  const ymd = ymdOf(today());

  const stats = store.get(STATS_KEY, {}); // { icon: { n, last } }
  const ask = store.get(ASK_KEY, { last: null, declines: 0, snoozeUntil: null });
  const saveStats = () => store.set(STATS_KEY, stats);
  const saveAsk = () => !preview && store.set(ASK_KEY, ask);

  // ページにあるリンク（ひみつのワープゾーンは数えない）
  const links = [...document.querySelectorAll(".pixel-btn:not(.secret)")].map((el) => ({
    el,
    icon: el.querySelector("[data-icon]")?.dataset.icon,
    label: linkLabel(el),
  }));
  const byIcon = (icon) => links.find((l) => l.icon === icon);

  // いちばん多く行っていて、MIN_FAV 回以上なら「お気に入り」（同点ならなし）
  function fav() {
    const ranked = links.map((l) => ({ ...l, n: stats[l.icon]?.n ?? 0 })).sort((a, b) => b.n - a.n);
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

  // ---------- あいさつのあと、1 日 1 回だけ、そっとひとこと ----------
  function suggest() {
    if (ask.last === ymd) return;
    const f = fav();
    const snoozed = ask.snoozeUntil && ymd < ask.snoozeUntil;

    // 1. お気に入りを勧める
    if (f && !snoozed) {
      ask.last = ymd;
      saveAsk();
      const q = [`きょうも ${f.label}に いく？`, `また ${f.label}の せかい、\nのぞいていく？`][stats[f.icon].n % 2];
      npc.ask(q, ["いく！", "きょうは ちがう"]).then((i) => {
        if (i === 0) {
          ask.declines = 0;
          saveAsk();
          npc.say(["いってらっしゃい！"]);
          f.el.click(); // 選択肢を押した直後なので、新しいタブで開ける
        } else if (i === 1) {
          ask.declines++;
          if (ask.declines >= 2) {
            const d = today();
            d.setDate(d.getDate() + 7);
            ask.snoozeUntil = ymdOf(d);
            ask.declines = 0;
            npc.say(["そっか。", "しばらく きかないで おくね。\nすきな ところへ いってらっしゃい。"]);
          } else {
            npc.say(["そっか、きょうは\nちがう きぶん なんだね。"]);
          }
          saveAsk();
        }
      });
      return;
    }

    // 2. しばらく行っていないリンクを思い出させる（前に 2 回以上行っていて、14 日以上あいた）
    const forgotten = links.find((l) => stats[l.icon]?.n >= 2 && stats[l.icon].last && dayDiff(stats[l.icon].last, ymd) >= 14);
    if (forgotten) {
      ask.last = ymd;
      saveAsk();
      npc.say([`そういえば さいきん\n${forgotten.label}に いってないね。`, "げんきに してるかな。"]);
      return;
    }

    // 3. まだ行ったことのないリンク（3 日以上会っていて、ほかのリンクには行っている）
    const visited = links.filter((l) => stats[l.icon]?.n);
    const unseen = links.filter((l) => !stats[l.icon]?.n);
    if (visited.length && unseen.length && (grow.state.days?.length ?? 0) >= 3) {
      const u = unseen[grow.state.days.length % unseen.length];
      ask.last = ymd;
      saveAsk();
      npc.say([`${u.label}は まだ\nいったこと ないよね？`, "どんな せかい なんだろう。"]);
    }
  }

  on("boot", () => {
    // あいさつを読み終えて手が空いたら（ほかのおさそいより先に）
    const wait = () => {
      if (!npc.ready() || playing() || npc.isAway()) return setTimeout(wait, 1500);
      suggest();
    };
    setTimeout(wait, 1500);
  });

  renderMark();
  return { fav, stats };
})();
