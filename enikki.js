// ---------- ピクセの ワープえにっき（v1.44）：ワープさきから もどるたびに、その せかいの えにっきを 1 ページ ----------
// ほんとうに むこうへ いって もどって きた とき（ワープ ダイブの「ただいま！」）に、おなじ せかいは 1 日 1 ページ。
// ページは ROOM の にっきに たまって、おすと 大きく みられる（ほぞん・シェアも。SNS の「ワープ日記」と おなじ なまえ）。
// 5 ページ たまると 実績「ワープえにっき」。
const enikki = (() => {
  const KEY = "warpix-enikki"; // [{ icon, label, shelf, date, line }]（あたらしい ものが さき、さいきん 40）
  const W = 600;
  const H = 420;
  const pad2 = (n) => String(n).padStart(2, "0");
  const ymdOf = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
  const peek = () => /[?&]date=/.test(location.search);
  let pages = store.get(KEY, []);

  // ---------- えを かく ----------
  const cssColor = (v, css) => (v.startsWith("var(") ? css.getPropertyValue(v.slice(4, -1)).trim() : v);
  function draw(page) {
    const css = getComputedStyle(document.body);
    const v = (n) => css.getPropertyValue(n).trim();
    const pal = { o: "#000000", w: v("--fg"), p: v("--accent"), c: v("--accent-2"), y: v("--gold"), k: v("--pumpkin"), v: v("--muted") };
    const gift = CASSETTES.GIFTS[page.shelf] ?? CASSETTES.GIFTS.default;
    const hole = { c: cssColor(gift.hole.c, css), p: cssColor(gift.hole.p, css) };
    const cv = document.createElement("canvas");
    cv.width = W;
    cv.height = H;
    const c = cv.getContext("2d");
    let seed = [...`${page.date}${page.icon}`].reduce((a, ch) => (a * 31 + ch.charCodeAt(0)) >>> 0, 7) || 7;
    const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

    // かみ（えにっきの ノート）と、えの わく
    c.fillStyle = "#fff8e7";
    c.fillRect(0, 0, W, H);
    c.fillStyle = "#e9dcc0";
    for (let y = 300; y < H; y += 30) c.fillRect(20, y, W - 40, 2);
    const fx = 30;
    const fy = 52;
    const fw = W - 60;
    const fh = 230;
    // その せかいの そら（たなの いろ）
    c.fillStyle = v("--bg");
    c.fillRect(fx, fy, fw, fh);
    c.fillStyle = hole.c;
    for (let i = 0; i < 26; i++) c.fillRect(fx + Math.floor((rand() * fw) / 4) * 4, fy + Math.floor((rand() * (fh - 70)) / 4) * 4, 4, 4);
    // たなごとの ちいさな もよう：おみやげが ふわふわ
    for (let i = 0; i < 5; i++) {
      postcard.drawSprite(c, gift.rows, fx + 20 + Math.floor(rand() * (fw - 60)), fy + 12 + Math.floor(rand() * 90), 3, pal);
    }
    // じめん
    c.fillStyle = hole.p;
    c.fillRect(fx, fy + fh - 40, fw, 40);
    c.fillStyle = "rgba(0,0,0,0.25)";
    for (let x = fx; x < fx + fw; x += 16) c.fillRect(x, fy + fh - 40, 8, 4);
    // ワープあなと、でてきた ピクセ（おみやげを もって）
    c.fillStyle = "#000";
    c.fillRect(fx + fw - 170, fy + fh - 52, 120, 20);
    c.fillStyle = hole.c;
    c.fillRect(fx + fw - 176, fy + fh - 56, 132, 6);
    c.fillRect(fx + fw - 176, fy + fh - 34, 132, 6);
    postcard.drawSprite(c, dress(NPC.idle), fx + 70, fy + fh - 40 - 16 * 8, 8, pal);
    postcard.drawSprite(c, gift.rows, fx + 70 + 32, fy + fh - 40 - 16 * 8 - 40, 5, pal);
    // わく
    c.strokeStyle = "#2b2f3a";
    c.lineWidth = 4;
    c.strokeRect(fx, fy, fw, fh);

    // もじ
    c.textBaseline = "top";
    c.fillStyle = "#2b2f3a";
    c.font = '22px "DotGothic16", monospace';
    const d = page.date;
    c.fillText(`${Number(d.slice(5, 7))}がつ ${Number(d.slice(8, 10))}にち　${page.label} の せかい`, 30, 16);
    c.font = '24px "DotGothic16", monospace';
    (page.line ?? "").split("\n").forEach((t, i) => c.fillText(t, 36, 300 + 8 + i * 30));
    c.font = '14px "Press Start 2P", monospace';
    c.fillStyle = "#a8713f";
    c.textAlign = "right";
    c.fillText("PIXE", W - 30, H - 26);
    return cv;
  }

  // ---------- ページを ふやす ----------
  on("warp-back", ({ icon, left, label, line }) => {
    if (!left || !icon || !line) return;
    const date = ymdOf(today());
    if (pages.some((p) => p.icon === icon && p.date === date)) return;
    const name = icon === "key" ? "ひみつの こうじょう" : label || icon.toUpperCase(); // ワープゾーンは こうじょう（v1.43）
    pages = [{ icon, label: name, shelf: CASSETTES.shelfOf(icon), date, line }, ...pages].slice(0, 40);
    if (!peek()) store.set(KEY, pages);
    if (pages.length >= 5) achievements.unlock("enikki");
  });

  // ---------- ROOM の にっきの なか ----------
  const thumbs = new Map(); // ページ → がぞう（つくるのは 1 かい）
  const keyOf = (p) => `${p.date}:${p.icon}`;
  function thumb(p) {
    if (!thumbs.has(keyOf(p))) thumbs.set(keyOf(p), draw(p).toDataURL("image/png"));
    return thumbs.get(keyOf(p));
  }
  function card() {
    const body = document.getElementById("diary-body");
    body.querySelector(".enikki")?.remove();
    if (!pages.length) return;
    const el = document.createElement("section");
    el.className = "enikki";
    el.innerHTML = `<h3>ワープえにっき <span class="enikki-count">${pages.length}ページ</span></h3>
      <div class="enikki-list">${pages
        .map((p, i) => `<button type="button" class="enikki-btn" data-i="${i}" aria-label="${Number(p.date.slice(5, 7))}/${Number(p.date.slice(8, 10))} ${p.label} の せかいの えにっき"><img src="${thumb(p)}" alt="" width="150" height="105"></button>`)
        .join("")}</div>`;
    el.addEventListener("click", (e) => {
      const b = e.target.closest(".enikki-btn");
      if (b) open(pages[Number(b.dataset.i)]);
    });
    const after = body.querySelector(".letters") ?? body.querySelector(".tonight") ?? body.querySelector(".diary-head");
    after ? after.after(el) : body.prepend(el);
  }
  async function open(p) {
    await postcard.fontsReady();
    document.getElementById("diary").close();
    await postcard.show(draw(p), {
      name: `warpix-enikki-${p.date}-${p.icon}.png`,
      title: "ピクセの ワープえにっき",
      alt: `${p.date} ${p.label} の せかいの えにっき：${(p.line ?? "").replace(/\n/g, "")}`,
    });
  }
  on("notebook-tab", ({ which }) => which === "diary" && card());

  return { pages: () => pages, draw, open };
})();
