// ---------- 開店の よる（v1.42）：1きせいへの とくべつな てがみと、しゅうらいの よるの せいざ ----------
// 1. 正式な 開店の 日（ticket.CUTOFF）いこうに 1きせいが ひらくと、ピクセから「ひらく ひの てがみ」が とどく（1 かい だけ）
// 2. しゅうらいの よる（v1.40）に だい マザーシップを たおすと、がめんに はなび（v1.66.1。まえは せいざ）。
//    きねんしゃしんは WORLD RECORD に のこって、まいつき ひとつずつ ふえていく
const opening = (() => {
  const KEY = "warpix-constellations"; // [{ date, hats }]（さいきん 24。なまえは せいざの ころの まま、まえの きろくは colors）
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
    npc.addIntro("ROOM に、とくべつな\nてがみが とどいてるよ。");
    grow.write("opening-letter", "ひらく ひの てがみを わたした。さいしょの おきゃくさんへ。", { force: true });
  });

  // ---------- 2. しゅうらいの よるの はなび（v1.66.1。v1.66 までは せいざ） ----------
  // だい 11 かい 会議：本人「星座やめよう　なんかやだ　でっかい花火にしよう　きんいろのまざーしっぷげきたいしたんだから」。
  // たおしたら がめんに はなびを うちあげて、きねんしゃしん（はなびの したに その ばに いた ぜんいんの ピクセ）。
  // きろくは KEY のまま { date, colors, hats }。hats[0] が じぶん。ひとの かずは hats（まえの きろくは colors）の ながさ
  const count = (e) => (e.hats ?? e.colors ?? [null]).length;
  const md = (date) => `${Number(date.slice(5, 7))}/${Number(date.slice(8, 10))}`;
  const css = () => {
    const s = getComputedStyle(document.body);
    const v = (n) => s.getPropertyValue(n).trim();
    return { o: "#000000", w: v("--fg"), p: v("--accent"), c: v("--accent-2"), y: v("--gold"), k: v("--pumpkin"), v: v("--muted"), R: v("--cos-red"), G: v("--cos-green"), D: v("--cos-deep"), B: v("--cos-brown"), N: v("--cos-navy"), bg: v("--bg"), grid: v("--bg-grid") };
  };

  // がめんの はなび：したから 5 はつ うちあげ、まんなかに きんいろの おお はなび（しだれ）。6 びょうくらいで きえる
  let showing = null;
  function fireworks() {
    if (simple.on || reduceMotion || showing) return;
    const pal = css();
    const cv = document.createElement("canvas");
    cv.className = "hanabi";
    cv.setAttribute("aria-hidden", "true");
    const W = innerWidth;
    const H = innerHeight;
    cv.width = W;
    cv.height = H;
    document.body.append(cv);
    const c = cv.getContext("2d");
    const sq = (x, y, s, col, a) => {
      if (a <= 0) return;
      c.globalAlpha = Math.min(1, a);
      c.fillStyle = col;
      c.fillRect(Math.round(x - s / 2), Math.round(y - s / 2), s, s);
    };
    const k = Math.min(1.4, Math.max(0.8, W / 390)); // ひろい がめんでは すこし おおきく
    const parts = [];
    const burst = (x, y, col, n, speed, willow, size) => {
      sound.sfx.boom();
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + Math.random() * 0.05;
        const sp = speed * k * (0.85 + Math.random() * 0.3);
        parts.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0, max: willow ? 3.4 : 2.1, col, size, willow, trail: [] });
      }
      for (let i = 0; i < n / 2; i++) {
        const a = (i / (n / 2)) * Math.PI * 2;
        parts.push({ x, y, vx: Math.cos(a) * speed * k * 0.35, vy: Math.sin(a) * speed * k * 0.35, life: 0, max: 1, col: pal.w, size: 2, trail: [] });
      }
    };
    const rockets = [
      { x: W / 2, to: H * 0.28, col: pal.y, at: 0.1, n: 64, speed: 340, willow: true, size: 5 },
      { x: W * 0.24, to: H * 0.4, col: pal.p, at: 0.9, n: 38, speed: 200, size: 4 },
      { x: W * 0.76, to: H * 0.36, col: pal.c, at: 1.2, n: 38, speed: 200, size: 4 },
      { x: W * 0.15, to: H * 0.2, col: pal.c, at: 1.9, n: 22, speed: 120, size: 3 },
      { x: W * 0.85, to: H * 0.22, col: pal.p, at: 2.1, n: 22, speed: 120, size: 3 },
    ];
    const t0 = performance.now();
    let last = t0;
    const step = (now) => {
      const t = (now - t0) / 1000;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      c.clearRect(0, 0, W, H);
      for (const r of rockets) {
        if (r.done || t < r.at) continue;
        const p = Math.min(1, (t - r.at) / 0.7);
        const y = H - (H - r.to) * (1 - (1 - p) * (1 - p));
        for (let i = 0; i < 6; i++) sq(r.x, y + i * 7, 3, r.col, 0.8 - i * 0.13);
        if (p >= 1) {
          r.done = true;
          burst(r.x, r.to, r.col, r.n, r.speed, r.willow, r.size);
        }
      }
      for (const p of parts) {
        p.life += dt;
        const drag = Math.pow(p.willow ? 0.978 : 0.97, dt * 60);
        p.vx *= drag;
        p.vy = p.vy * drag + (p.willow ? 30 : 40) * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.trail.push([p.x, p.y]);
        if (p.trail.length > (p.willow ? 14 : 7)) p.trail.shift();
        const a = 1 - p.life / p.max;
        p.trail.forEach(([x, y], i) => sq(x, y, Math.max(2, p.size - 1), p.col, a * (i / p.trail.length) * 0.6));
        sq(p.x, p.y, p.size, p.life > p.max * 0.6 && Math.random() < 0.3 ? pal.w : p.col, a);
      }
      c.globalAlpha = 1;
      for (let i = parts.length - 1; i >= 0; i--) if (parts[i].life >= parts[i].max) parts.splice(i, 1);
      if (t < 2.5 || parts.length) showing = requestAnimationFrame(step);
      else {
        cv.remove();
        showing = null;
      }
    };
    showing = requestAnimationFrame(step);
  }

  const saved = () => store.get(KEY, []);
  function remember(entry) {
    if (peek()) return;
    const list = saved().filter((e) => e.date !== entry.date);
    store.set(KEY, [entry, ...list].slice(0, 24));
    renderList();
  }

  // たおした とき（うって いなくても、その ばに いた ひとは みんな）。rehearsal は きろくにも にっきにも のこさない
  function celebrate({ players = 1, night, rehearsal = false } = {}) {
    if (!night && !rehearsal) return;
    const hats = online.enabled ? online.hats() : [null];
    const n = Math.max(1, players, hats.length);
    const entry = { date: ymdOf(today()), hats: Array.from({ length: n }, (_, i) => hats[i] ?? null) };
    if (rehearsal) entry.rehearsal = true;
    if (!rehearsal) remember(entry);
    setTimeout(() => {
      fireworks();
      if (!rehearsal) grow.write("hanabi", `しゅうらいの よるに、${n === 1 ? "ひとりで" : `${n}にんで`} はなびを あげた。`, { force: true });
      setTimeout(() => offerPhoto(entry), 2400);
    }, 1200);
  }
  on("raid-win", celebrate);

  // ---------- 3. きねんしゃしん（v1.45、v1.66.1 で はなびに）：はなびの したに、その ばに いた ぜんいんの ピクセ ----------
  // まんなかが じぶん（育った すがたと いまの ぼうし）。ほかの ひとは おなじ そらで かぶって いた ぼうし。
  // 12 にん までは 1 れつ、それより おおいと ひなだん（本人「ぜんいんうつすようにして」）。たおした マザーシップは みぎしたの かんばんの だん
  async function photo(entry) {
    await postcard.fontsReady();
    const W = 1200;
    const H = 630;
    const pal = css();
    const cv = document.createElement("canvas");
    cv.width = W;
    cv.height = H;
    const c = cv.getContext("2d");
    const q = (x, y, s, col, a = 1) => {
      c.globalAlpha = a;
      c.fillStyle = col;
      c.fillRect(Math.round((x - s / 2) / 2) * 2, Math.round((y - s / 2) / 2) * 2, s, s);
      c.globalAlpha = 1;
    };
    // その よるで きまる らんすう（おなじ よるの しゃしんは なんど とっても おなじ）
    let seed = 2166136261;
    for (const ch of `warpix-hanabi-${entry.date}`) seed = Math.imul(seed ^ ch.charCodeAt(0), 16777619);
    const rand = () => ((seed = Math.imul(seed ^ (seed >>> 15), 2246822507) >>> 0) / 4294967296);

    // そら：ゆかに ちかいほど ほんのり ピンク。ほうがんと ちいさな ほし
    c.fillStyle = pal.bg;
    c.fillRect(0, 0, W, H);
    const sky = c.createLinearGradient(0, 0, 0, 420);
    sky.addColorStop(0, "rgba(0,0,0,0.35)");
    sky.addColorStop(1, "rgba(255,79,163,0.10)");
    c.fillStyle = sky;
    c.fillRect(0, 0, W, 420);
    c.fillStyle = pal.grid;
    for (let x = 0; x < W; x += 40) c.fillRect(x, 0, 2, H);
    for (let y = 0; y < H; y += 40) c.fillRect(0, y, W, 2);
    for (let i = 0; i < 60; i++) q(rand() * W, rand() * 360, rand() < 0.2 ? 4 : 2, "#ffffff", 0.25 + rand() * 0.4);

    // ならびかた
    const n = count(entry);
    // だんの かず（1 だんに 12・13・20 にん まで）を きめて、どの だんも おなじ くらいの にんずうに わける（ひとりだけ うしろに のこらない）
    const perRow = n <= 12 ? 12 : n <= 60 ? 13 : 20;
    const rowCount = Math.ceil(n / perRow);
    const px = n === 1 ? 11 : n === 2 ? 10 : n <= 5 ? 8 : n <= 12 ? 6 : n <= 26 ? 5 : n <= 60 ? 4 : 3;
    const cell = px * 16;
    const gapX = n <= 12 ? 18 : Math.round(cell * 0.12);
    const stepY = Math.round(cell * 0.62);
    const floorY = 410;
    const rows = [];
    const others = (entry.hats ?? []).slice(1);
    while (others.length < n - 1) others.push(null);
    const people = ["me", ...others];
    for (let r = 0, k2 = 0; r < rowCount; r++) {
      const take = Math.floor(n / rowCount) + (r < n % rowCount ? 1 : 0); // まえの だんほど 1 にん おおく
      rows.push(people.slice(k2, k2 + take));
      k2 += take;
    }
    const crowdTop = floorY - cell - (rows.length - 1) * stepY;

    // はなび：ひかりの もや → すじ（さきが あかるく、しっぽが うすれる）→ うちがわの わ → まんなかの ひかり
    const burst = (cx, cy, r, main, sub, { rays = 20, dot = 8, willow = false } = {}) => {
      const g = c.createRadialGradient(cx, cy, 0, cx, cy, r * 1.35);
      g.addColorStop(0, `${main}40`);
      g.addColorStop(0.5, `${main}14`);
      g.addColorStop(1, `${main}00`);
      c.fillStyle = g;
      c.fillRect(cx - r * 1.4, cy - r * 1.4, r * 2.8, r * 2.8);
      for (let i = 0; i < rays; i++) {
        const a = (i / rays) * Math.PI * 2 + (i % 2) * 0.07;
        const len = r * (i % 3 === 0 ? 1 : 0.9);
        for (let s = 1; s <= 9; s++) {
          const t = s / 9;
          const size = Math.max(2, Math.round((dot * (0.45 + t * 0.55)) / 2) * 2);
          q(cx + Math.cos(a) * len * t, cy + Math.sin(a) * len * t + t * t * r * 0.14, size, t > 0.82 ? "#ffffff" : t > 0.55 ? main : sub, 0.25 + t * 0.75);
        }
        const hx = cx + Math.cos(a) * len;
        const hy = cy + Math.sin(a) * len + r * 0.14;
        if (i % 4 === 1) for (const [dx, dy] of [[0, -dot], [0, dot], [-dot, 0], [dot, 0]]) q(hx + dx, hy + dy, 2, "#ffffff");
        if (willow) for (let s = 1; s <= 7; s++) q(hx + Math.cos(a) * s * 3, hy + s * s * 1.6, Math.max(2, dot / 2 - s / 2), main, 0.7 - s * 0.09);
      }
      for (let i = 0; i < rays / 2; i++) {
        const a = (i / (rays / 2)) * Math.PI * 2 + 0.2;
        for (let s = 1; s <= 3; s++) q(cx + Math.cos(a) * r * 0.12 * s, cy + Math.sin(a) * r * 0.12 * s, Math.max(2, dot - 4), sub, 0.5 + s * 0.15);
      }
      q(cx, cy, dot + 6, "#ffffff");
      q(cx, cy, dot + 14, main, 0.35);
    };
    const big = Math.min(190, (crowdTop - 20) * 0.62);
    const by = Math.max(big + 16, Math.min(190, crowdTop - big - 6));
    const side = big * 0.55;
    burst(W / 2, by, big, pal.y, pal.w, { rays: 26, dot: big > 140 ? 10 : 8, willow: true });
    burst(W * 0.2, by + big * 0.15, side, pal.p, pal.y, { rays: 18, dot: 6 });
    burst(W * 0.8, by + big * 0.05, side * 0.9, pal.c, pal.w, { rays: 18, dot: 6 });
    if (n >= 5) {
      burst(W * 0.07, by - big * 0.3, side * 0.5, pal.c, pal.w, { rays: 12, dot: 4 });
      burst(W * 0.93, by - big * 0.3, side * 0.5, pal.p, pal.w, { rays: 12, dot: 4 });
    }

    // ゆか と まえの だんの かげ
    c.fillStyle = "rgba(255,216,74,0.16)";
    c.fillRect(0, floorY, W, 14);
    c.fillStyle = "rgba(255,216,74,0.55)";
    c.fillRect(0, floorY, W, 2);
    // みんなの ピクセ（うしろの だんから。じぶんは まえの だんの まんなかで すこし まえ）
    const hats = wardrobe.hats();
    for (let r = rows.length - 1; r >= 0; r--) {
      let row = rows[r];
      if (r === 0) {
        const rest = row.slice(1);
        const half = Math.floor(rest.length / 2);
        row = [...rest.slice(0, half), "me", ...rest.slice(half)];
      }
      const width = row.length * cell + (row.length - 1) * gapX;
      // ひなだんは 1 だんおきに はんぶん ずらす（うしろの ひとの かおが あいだから みえる）
      const shift = rows.length > 1 ? ((r % 2 ? 1 : -1) * (cell + gapX)) / 4 : 0;
      const left = Math.round((W - width) / 2 + shift);
      const top = floorY - cell - r * stepY;
      row.forEach((h, i) => {
        const x = left + i * (cell + gapX);
        if (r === 0) {
          c.fillStyle = "rgba(0,0,0,0.35)";
          c.fillRect(x + px * 3, floorY + 2, px * 10, Math.max(4, px));
        }
        const rowsArt = h === "me" ? dress(NPC.idle) : dress(NPC.idle, hats[h] ?? null, []);
        postcard.drawSprite(c, rowsArt, x, top - (h === "me" ? Math.round(px * 1.5) : 0), px, pal);
      });
    }

    // かんばん
    c.textBaseline = "top";
    c.textAlign = "center";
    c.font = '40px "DotGothic16", monospace';
    const title = `${md(entry.date)} しゅうらいの よる`;
    c.fillStyle = "#000";
    c.fillText(title, W / 2 + 4, 448);
    c.fillStyle = pal.y;
    c.fillText(title, W / 2, 444);
    c.font = '28px "DotGothic16", monospace';
    c.fillStyle = pal.w;
    c.fillText(`${n === 1 ? "ひとりで" : `${n}にんで`} きんいろの マザーシップを たおした！`, W / 2, 504);
    c.textAlign = "left";
    c.font = '18px "Press Start 2P", monospace';
    c.fillStyle = pal.v;
    // としは ひだりしたに（本人「それだわ　てんさい」）
    c.fillText(`RAID NIGHT ${entry.date.slice(0, 4)}`, 60, 572);
    if (ticket.has()) {
      c.font = '22px "DotGothic16", monospace';
      c.fillStyle = pal.y;
      c.fillText("★1きせい", 370, 568);
    }
    c.textAlign = "right";
    c.font = '18px "Press Start 2P", monospace';
    c.fillStyle = pal.v;
    c.fillText("link.warpix.app", W - 60, 572);

    // たおした きんいろの マザーシップ：みぎしたで かたむいて、けむりを ふいて いる（本人「煙このままがよくね？」）
    const ship = MOTHERSHIP.map((r) => r.replace(/w/g, "y").replace(/c/g, "k").replace(/p/g, "o"));
    const sx = 1000;
    const sy = 452;
    [[0, 0, 18], [-22, -16, 16], [-40, -34, 14], [-54, -50, 10], [-64, -64, 8]].forEach(([x, y, s], i) => q(sx + 30 + x, sy + 8 + y, s, "#9a9ab4", 0.5 - i * 0.08));
    c.save();
    c.translate(sx, sy);
    c.rotate(0.22);
    postcard.drawSprite(c, ship, 0, 0, 5, pal);
    c.fillStyle = "#000";
    c.fillRect(45, 15, 5, 15);
    c.fillRect(50, 25, 5, 10);
    c.fillRect(80, 20, 5, 10);
    c.restore();
    [[sx + 130, sy + 18, "#ffffff"], [sx + 142, sy + 4, pal.y], [sx + 118, sy + 40, pal.k], [sx + 8, sy - 6, pal.y]].forEach(([x, y, col]) => q(x, y, 6, col));
    return cv;
  }
  async function openPhoto(entry) {
    room.leave();
    await postcard.show(await photo(entry), {
      name: `warpix-raid-night-${entry.date}.png`,
      title: "しゅうらいの よるの きねんしゃしん",
      alt: `${entry.date} しゅうらいの よるの きねんしゃしん：${count(entry)}にんの ピクセと はなび`,
    });
    if (!entry.rehearsal) grow.write("kinen", "しゅうらいの よるの きねんしゃしんを とった。", { force: true });
  }
  // はなびの あと、ピクセが ひまに なったら さそう
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

  // ---------- WORLD RECORD の なかの しゅうらいの よるの ならび（ちいさな はなびの え） ----------
  function mini() {
    const rays = Array.from({ length: 12 }, (_, i) => {
      const a = (i / 12) * Math.PI * 2;
      return [0.45, 0.75, 1].map((t) => `<rect x="${Math.round(50 + Math.cos(a) * 18 * t) - 1}" y="${Math.round(22 + Math.sin(a) * 18 * t) - 1}" width="2" height="2" fill="${t === 1 ? "var(--fg)" : "var(--gold)"}" />`).join("");
    }).join("");
    return `<svg viewBox="0 0 100 50" aria-hidden="true">${rays}<rect x="48" y="20" width="4" height="4" fill="var(--fg)" /></svg>`;
  }
  function renderList() {
    const box = document.getElementById("seiza-list");
    if (!box) return;
    const list = saved();
    box.hidden = !list.length;
    box.querySelector(".seiza-items").innerHTML = list
      .map((e, i) => `<li><button type="button" class="seiza-btn" data-i="${i}" aria-label="${md(e.date)} しゅうらいの よるの きねんしゃしんを みる">${mini()}</button><span>${e.date.slice(0, 4)}/${md(e.date)}・${count(e)}にん</span></li>`)
      .join("");
  }
  renderList();
  // おすと、その よるの きねんしゃしん
  document.getElementById("seiza-list")?.addEventListener("click", (e) => {
    const b = e.target.closest(".seiza-btn");
    if (b) openPhoto(saved()[Number(b.dataset.i)]);
  });

  cheats.add("hanabi", fireworks);
  return { fireworks, celebrate, saved, photo, openPhoto };
})();
