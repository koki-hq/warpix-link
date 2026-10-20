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
    const entry = { date: ymdOf(today()), colors, hats: Array.from({ length: n }, (_, i) => hats[i] ?? null) };
    remember(entry);
    setTimeout(() => {
      show(entry);
      npc.say(["みて！ そらの ほしが つながって……", `きょうの ${n}にんの せいざが できた！\nROOM の WORLD RECORD に のこしたよ。`]);
      grow.write("seiza", `しゅうらいの よるに、${n}この ほしの せいざが できた。`, { force: true });
      offerPhoto(entry);
    }, 3200);
  });

  // ---------- 3. きねんしゃしん（v1.45）：せいざの したに、いっしょに たたかった みんなの ピクセ ----------
  // まんなかが じぶん（育った すがたと いまの ぼうし）。ほかの ひとは おなじ そらで かぶって いた ぼうし
  async function photo(entry) {
    await postcard.fontsReady();
    const W = 1200;
    const H = 630;
    const css = getComputedStyle(document.body);
    const v = (n) => css.getPropertyValue(n).trim();
    const pal = { o: "#000000", w: v("--fg"), p: v("--accent"), c: v("--accent-2"), y: v("--gold"), k: v("--pumpkin"), v: v("--muted") };
    const cv = document.createElement("canvas");
    cv.width = W;
    cv.height = H;
    const c = cv.getContext("2d");
    c.fillStyle = v("--bg");
    c.fillRect(0, 0, W, H);
    c.fillStyle = v("--bg-grid");
    for (let x = 0; x < W; x += 40) c.fillRect(x, 0, 2, H);
    for (let y = 0; y < H; y += 40) c.fillRect(0, y, W, 2);
    // そらの せいざ（100×50 の ならびを ひろげて）
    const pts = points(`warpix-seiza-${entry.date}`, entry.colors.length).map(([x, y]) => [x * 12, 30 + y * 4.4]);
    c.strokeStyle = "rgba(244,244,244,0.55)";
    c.lineWidth = 3;
    c.setLineDash([6, 8]);
    c.beginPath();
    pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
    c.stroke();
    c.setLineDash([]);
    pts.forEach(([x, y], i) => {
      c.fillStyle = entry.colors[i];
      c.fillRect(x - 8, y - 8, 16, 16);
    });
    // みんなの ピクセ（まんなかが じぶん）
    const hats = wardrobe.hats();
    const others = (entry.hats ?? entry.colors.map(() => null)).slice(1);
    const half = Math.ceil(others.length / 2);
    const people = [...others.slice(0, half), "me", ...others.slice(half)];
    const px = people.length <= 6 ? 8 : people.length <= 9 ? 6 : 5;
    const gap = px * 16 + 14;
    const left = Math.round((W - (people.length * gap - 14)) / 2);
    const top = 400 - px * 16;
    c.fillStyle = "rgba(255,216,74,0.18)";
    c.fillRect(0, 400, W, 14);
    people.forEach((h, i) => {
      const rows = h === "me" ? dress(NPC.idle) : dress(NPC.idle, hats[h] ?? null, []);
      postcard.drawSprite(c, rows, left + i * gap, top - (h === "me" ? 12 : 0), px, pal);
    });
    // かんばん
    c.textBaseline = "top";
    c.textAlign = "center";
    c.font = '40px "DotGothic16", monospace';
    const d = `${Number(entry.date.slice(5, 7))}/${Number(entry.date.slice(8, 10))}`;
    const title = `${d} しゅうらいの よる`;
    c.fillStyle = "#000";
    c.fillText(title, W / 2 + 4, 448);
    c.fillStyle = pal.y;
    c.fillText(title, W / 2, 444);
    c.font = '28px "DotGothic16", monospace';
    c.fillStyle = pal.w;
    c.fillText(`${entry.colors.length}にんで だい マザーシップを のりきった！`, W / 2, 504);
    c.textAlign = "left";
    c.font = '18px "Press Start 2P", monospace';
    c.fillStyle = pal.v;
    c.fillText("RAID NIGHT", 60, 572);
    if (ticket.has()) {
      c.font = '22px "DotGothic16", monospace';
      c.fillStyle = pal.y;
      c.fillText("★1きせい", 280, 568);
    }
    c.textAlign = "right";
    c.font = '18px "Press Start 2P", monospace';
    c.fillStyle = pal.v;
    c.fillText("link.warpix.app", W - 60, 572);
    return cv;
  }
  async function openPhoto(entry) {
    document.getElementById("diary").close();
    await postcard.show(await photo(entry), {
      name: `warpix-raid-night-${entry.date}.png`,
      title: "しゅうらいの よるの きねんしゃしん",
      alt: `${entry.date} しゅうらいの よるの きねんしゃしん：${entry.colors.length}にんの ピクセと せいざ`,
    });
    grow.write("kinen", "しゅうらいの よるの きねんしゃしんを とった。", { force: true });
  }
  // せいざの あと、ピクセが ひまに なったら さそう
  function offerPhoto(entry) {
    const timer = setInterval(() => {
      if (playing() || npc.busy() || simple.on || postcard.isOpen() || document.querySelector(".credits, dialog[open]")) return;
      clearInterval(timer);
      npc.ask("みんなで きねんしゃしん とろう！", ["とる", "いい"]).then((i) => {
        if (i === 0) openPhoto(entry);
        else if (i === 1) npc.say(["わかった！"]);
      });
    }, 800);
    setTimeout(() => clearInterval(timer), 60000);
  }

  // ---------- WORLD RECORD の なかの せいざの ならび ----------
  function renderList() {
    const box = document.getElementById("seiza-list");
    if (!box) return;
    const list = saved();
    box.hidden = !list.length;
    box.querySelector(".seiza-items").innerHTML = list
      .map((e, i) => `<li><button type="button" class="seiza-btn" data-i="${i}" aria-label="${Number(e.date.slice(5, 7))}/${Number(e.date.slice(8, 10))} しゅうらいの よるの きねんしゃしんを みる">${svg(e)}</button><span>${Number(e.date.slice(5, 7))}/${Number(e.date.slice(8, 10))}・${e.colors.length}にん</span></li>`)
      .join("");
  }
  renderList();
  // せいざを おすと、その よるの きねんしゃしん
  document.getElementById("seiza-list")?.addEventListener("click", (e) => {
    const b = e.target.closest(".seiza-btn");
    if (b) openPhoto(saved()[Number(b.dataset.i)]);
  });

  cheats.add("seiza", () => show({ date: ymdOf(today()), colors: COLORS.slice(0, 5) }));
  return { show, svg, points, saved, photo, openPhoto };
})();
