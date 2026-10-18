// ---------- 開店の よる（v1.42）：1きせいへの とくべつな てがみと、しゅうらいの よるの せいざ ----------
// 1. 正式な 開店の 日（ticket.CUTOFF）いこうに 1きせいが ひらくと、ピクセから「ひらく ひの てがみ」が とどく（1 かい だけ）
// 2. しゅうらいの よる（v1.40）に だい マザーシップを たおすと、そこに いた 人数ぶんの ほしで せいざが うかぶ。
//    ほしの いろは みんなの ぼうしから。せいざは WORLD RECORD に のこって、まいつき ひとつずつ ふえていく
const opening = (() => {
  const KEY = "warpix-constellations"; // [{ date, colors, seed }]（さいきん 24）
  const pad2 = (n) => String(n).padStart(2, "0");
  const ymdOf = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
  const peek = () => /[?&]date=/.test(location.search);

  // ---------- 1. ひらく ひの てがみ ----------
  function letterLines(day) {
    const first = day === ticket.CUTOFF;
    return [
      "さいしょの おきゃくさんへ",
      "まだ だれも しらない ころから きてくれて、ありがとう。",
      first ? "きょうは WARPIX製作所が おみせを ひらく ひ。" : "WARPIX製作所は、ぶじに おみせを ひらいたよ。",
      first ? "よる 9じ、きんいろの だい マザーシップが くるよ。いっしょに そらを まもってね。" : "あたらしい ともだちも、すこしずつ ふえてきた。",
      "きみが さいしょに きてくれた こと、ずっと おぼえてる。",
      "これからも、いっしょに ワープしようね。",
    ];
  }
  on("boot", () => {
    const day = ymdOf(today());
    if (!ticket.has() || day < ticket.CUTOFF || simple.on) return;
    if (!letter.add({ kind: "opening", title: "ひらく ひの てがみ", lines: letterLines(day) })) return;
    npc.addIntro("ROOM の にっきに、とくべつな\nてがみが とどいてるよ。");
    grow.write("opening-letter", "ひらく ひの てがみを わたした。さいしょの おきゃくさんへ。", { force: true });
  });

  // ---------- 2. しゅうらいの よるの せいざ ----------
  const COLORS = ["#ffd84a", "#3ee8ff", "#ff4fa3", "#f4f4f4", "#ff8a1f", "#8affb0"];
  const colorOf = (hatId) => {
    if (!hatId) return COLORS[3];
    let h = 0;
    for (const ch of String(hatId)) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    return COLORS[h % COLORS.length];
  };
  // その 夜の ほしの ならび（日付で きまる。おなじ よるに いた ひとは おなじ かたちに なる）
  function points(seedText, n) {
    let h = 2166136261;
    for (const ch of seedText) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
    const rand = () => ((h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0) / 4294967296);
    const pts = [];
    for (let i = 0; i < n; i++) pts.push([12 + Math.round(rand() * 76), 10 + Math.round(rand() * 30)]);
    return pts.sort((a, b) => a[0] - b[0]); // ひだりから じゅんに つなぐ
  }
  // ドットの ほしと、ほしを つなぐ てんせん（viewBox 100×50）
  function svg({ date, colors }, cls = "") {
    const pts = points(`warpix-seiza-${date}`, colors.length);
    const lines = pts.slice(1).map(([x, y], i) => {
      const [px, py] = pts[i];
      return `<line x1="${px}" y1="${py}" x2="${x}" y2="${y}" />`;
    }).join("");
    const stars = pts.map(([x, y], i) => `<rect x="${x - 2}" y="${y - 2}" width="4" height="4" fill="${colors[i]}" />`).join("");
    return `<svg class="${cls}" viewBox="0 0 100 50" aria-hidden="true"><g class="seiza-lines">${lines}</g>${stars}</svg>`;
  }

  let el = null;
  function show(entry) {
    el?.remove();
    el = document.createElement("div");
    el.className = "seiza";
    el.setAttribute("role", "img");
    el.setAttribute("aria-label", `しゅうらいの よるの せいざ：${entry.colors.length}この ほし`);
    el.innerHTML = svg(entry) + `<p class="seiza-name">${Number(entry.date.slice(5, 7))}/${Number(entry.date.slice(8, 10))} の せいざ</p>`;
    document.body.append(el);
    setTimeout(() => el?.classList.add("gone"), 9000);
    setTimeout(() => { el?.remove(); el = null; }, 10000);
  }

  const saved = () => store.get(KEY, []);
  function remember(entry) {
    if (peek()) return;
    const list = saved().filter((e) => e.date !== entry.date);
    store.set(KEY, [entry, ...list].slice(0, 24));
    renderList();
  }

  on("raid-win", ({ players, night }) => {
    if (!night) return;
    const hats = online.enabled ? online.hats() : [null];
    // 人数ぶんの ほし（12 こ まで）。ぼうしの ほうが すくなければ しろい ほしで うめる
    const n = Math.max(1, Math.min(12, Math.max(players, hats.length)));
    const colors = Array.from({ length: n }, (_, i) => colorOf(hats[i]));
    const entry = { date: ymdOf(today()), colors };
    remember(entry);
    setTimeout(() => {
      show(entry);
      npc.say(["みて！ そらの ほしが つながって……", `きょうの ${n}にんの せいざが できた！\nROOM の WORLD RECORD に のこしたよ。`]);
      grow.write("seiza", `しゅうらいの よるに、${n}この ほしの せいざが できた。`, { force: true });
    }, 3200);
  });

  // ---------- WORLD RECORD の なかの せいざの ならび ----------
  function renderList() {
    const box = document.getElementById("seiza-list");
    if (!box) return;
    const list = saved();
    box.hidden = !list.length;
    box.querySelector(".seiza-items").innerHTML = list
      .map((e) => `<li>${svg(e)}<span>${Number(e.date.slice(5, 7))}/${Number(e.date.slice(8, 10))}・${e.colors.length}にん</span></li>`)
      .join("");
  }
  renderList();

  cheats.add("seiza", () => show({ date: ymdOf(today()), colors: COLORS.slice(0, 5) }));
  return { show, svg, points, saved };
})();
