// ---------- ぼうし アトリエ：じぶんで ドット絵の ぼうしを かいて、ピクセに かぶせる ----------
// 16×6 マスに 5 色で かく。かいた ぼうしは WARDROBE に「じぶんの ぼうし」として ならび、ファビコンや ポストカードにも でる。
const atelier = (() => {
  const W = 16;
  const H = 6;
  const KEY = "warpix-myhat";
  const COLORS = [
    ["w", "しろ"],
    ["p", "ピンク"],
    ["c", "みずいろ"],
    ["y", "きいろ"],
    ["o", "くろ"],
    [".", "けしゴム"],
  ];
  const nameOfColor = (ch) => COLORS.find(([c]) => c === ch)?.[1] ?? "なし";
  const valid = (h) => h && Array.isArray(h.rows) && h.rows.length === H && h.rows.every((r) => typeof r === "string" && /^[wpcyo.]{16}$/.test(r));

  let saved = store.get(KEY, null);
  if (!valid(saved)) saved = null;
  const hatOf = (s) => ({ name: s.name || "じぶんの ぼうし", top: 0, rows: [...s.rows] });
  if (saved) wardrobe.addHat("mine", hatOf(saved));

  // ---------- 画面 ----------
  const dialog = document.createElement("dialog");
  dialog.className = "atelier";
  dialog.setAttribute("aria-labelledby", "atelier-title");
  dialog.innerHTML = `
    <div class="atelier-top">
      <h2 id="atelier-title">ぼうし アトリエ</h2>
      <button type="button" class="atelier-close" aria-label="閉じる">✕</button>
    </div>
    <div class="atelier-body">
      <div class="atelier-main">
        <div class="atelier-grid" role="grid" aria-label="ぼうしの マス（16 × 6）。やじるしキーで うごいて、スペースで ぬる"></div>
        <div class="atelier-preview" aria-hidden="true"></div>
      </div>
      <div class="atelier-colors" role="radiogroup" aria-label="いろ"></div>
      <label class="atelier-name">なまえ <input type="text" maxlength="10" value="じぶんの ぼうし"></label>
      <div class="atelier-row">
        <button type="button" class="c-btn c-save atelier-wear">かぶる</button>
        <button type="button" class="c-btn atelier-clear">ぜんぶ けす</button>
      </div>
      <p class="atelier-msg" aria-live="polite"></p>
    </div>`;
  document.body.append(dialog);
  const gridEl = dialog.querySelector(".atelier-grid");
  const previewEl = dialog.querySelector(".atelier-preview");
  const colorsEl = dialog.querySelector(".atelier-colors");
  const nameEl = dialog.querySelector(".atelier-name input");
  const msg = dialog.querySelector(".atelier-msg");

  let cells = []; // [y][x] の いろ
  let color = "p";
  let focus = [0, 0];
  let painting = null; // ドラッグ中に ぬる いろ

  const cellBtn = (x, y) => gridEl.querySelector(`[data-x="${x}"][data-y="${y}"]`);
  const label = (x, y) => `${y + 1}だんめ ${x + 1}ばんめ：${nameOfColor(cells[y][x])}`;

  function renderPreview() {
    previewEl.innerHTML = pixelSvg(dress(NPC.idle, { top: 0, rows: cells.map((r) => r.join("")) }));
  }

  function paint(x, y, ch) {
    if (cells[y][x] === ch) return;
    cells[y][x] = ch;
    const b = cellBtn(x, y);
    b.dataset.c = ch;
    b.setAttribute("aria-label", label(x, y));
    renderPreview();
  }

  function build() {
    gridEl.innerHTML = "";
    for (let y = 0; y < H; y++) {
      const row = document.createElement("div");
      row.setAttribute("role", "row");
      for (let x = 0; x < W; x++) {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "atelier-cell";
        b.setAttribute("role", "gridcell");
        b.dataset.x = x;
        b.dataset.y = y;
        b.dataset.c = cells[y][x];
        if (NPC.idle[y][x] !== ".") b.classList.add("under"); // ピクセの あたまの ばしょ（うすく みせる）
        b.tabIndex = x === focus[0] && y === focus[1] ? 0 : -1;
        b.setAttribute("aria-label", label(x, y));
        row.append(b);
      }
      gridEl.append(row);
    }
    renderPreview();
  }

  function renderColors() {
    colorsEl.innerHTML = "";
    for (const [ch, name] of COLORS) {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "atelier-color";
      b.dataset.c = ch;
      b.setAttribute("role", "radio");
      b.setAttribute("aria-checked", String(ch === color));
      b.tabIndex = ch === color ? 0 : -1;
      b.textContent = name;
      b.addEventListener("click", () => {
        color = ch;
        renderColors();
        colorsEl.querySelector(`[data-c="${ch}"]`)?.focus();
      });
      colorsEl.append(b);
    }
  }
  // いろは ←→ で えらぶ
  colorsEl.addEventListener("keydown", (e) => {
    const i = COLORS.findIndex(([c]) => c === color);
    const d = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
    if (!d) return;
    e.preventDefault();
    color = COLORS[(i + d + COLORS.length) % COLORS.length][0];
    renderColors();
    colorsEl.querySelector('[aria-checked="true"]').focus();
  });

  // マスを おす：おなじ いろなら けす。ドラッグで つづけて ぬれる
  gridEl.addEventListener("pointerdown", (e) => {
    const b = e.target.closest(".atelier-cell");
    if (!b) return;
    e.preventDefault();
    const x = Number(b.dataset.x);
    const y = Number(b.dataset.y);
    painting = cells[y][x] === color ? "." : color;
    paint(x, y, painting);
    moveFocus(x, y, false);
    gridEl.setPointerCapture?.(e.pointerId);
  });
  gridEl.addEventListener("pointermove", (e) => {
    if (painting === null) return;
    const b = document.elementFromPoint(e.clientX, e.clientY)?.closest?.(".atelier-cell");
    if (b && gridEl.contains(b)) paint(Number(b.dataset.x), Number(b.dataset.y), painting);
  });
  const stopPaint = () => (painting = null);
  gridEl.addEventListener("pointerup", stopPaint);
  gridEl.addEventListener("pointercancel", stopPaint);

  function moveFocus(x, y, doFocus = true) {
    cellBtn(focus[0], focus[1]).tabIndex = -1;
    focus = [x, y];
    const b = cellBtn(x, y);
    b.tabIndex = 0;
    if (doFocus) b.focus();
  }
  // どの やりかたで フォーカスが きても（読み上げソフトの カーソルなど）、いまの 場所を あわせる
  gridEl.addEventListener("focusin", (e) => {
    const b = e.target.closest(".atelier-cell");
    if (b && (Number(b.dataset.x) !== focus[0] || Number(b.dataset.y) !== focus[1])) moveFocus(Number(b.dataset.x), Number(b.dataset.y), false);
  });
  gridEl.addEventListener("keydown", (e) => {
    const [x, y] = focus;
    const to = { ArrowRight: [x + 1, y], ArrowLeft: [x - 1, y], ArrowDown: [x, y + 1], ArrowUp: [x, y - 1], Home: [0, y], End: [W - 1, y] }[e.key];
    if (to) {
      e.preventDefault();
      moveFocus(Math.max(0, Math.min(W - 1, to[0])), Math.max(0, Math.min(H - 1, to[1])));
      return;
    }
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      paint(x, y, cells[y][x] === color ? "." : color);
    }
  });

  dialog.querySelector(".atelier-clear").addEventListener("click", () => {
    cells = Array.from({ length: H }, () => Array(W).fill("."));
    build();
    msg.textContent = "ピクセ「まっしろに なった。」";
  });

  dialog.querySelector(".atelier-wear").addEventListener("click", () => {
    const rows = cells.map((r) => r.join(""));
    if (rows.every((r) => !/[^.]/.test(r))) {
      msg.textContent = "ピクセ「まだ なにも かいてないよ。」";
      return;
    }
    saved = { name: nameEl.value.trim() || "じぶんの ぼうし", rows };
    store.set(KEY, saved);
    wardrobe.addHat("mine", hatOf(saved));
    wardrobe.wear("mine");
    sound.sfx.coin();
    achievements.unlock("designer");
    grow.write("designer", `ぼうし「${saved.name}」を つくって もらった。`);
    dialog.close();
    npc.say([`「${saved.name}」！\nにあう？ にあう？`]);
  });

  dialog.querySelector(".atelier-close").addEventListener("click", () => dialog.close());
  // とじたら、ひらく まえに いた ところ（おへやは とじているので ROOM ボタン）へ フォーカスを もどす
  dialog.addEventListener("close", () => document.getElementById("room-btn").focus({ preventScroll: true }));
  dialog.addEventListener("click", (e) => e.target === dialog && dialog.close());

  function open() {
    document.getElementById("diary").close?.();
    cells = (saved?.rows ?? Array(H).fill(".".repeat(W))).map((r) => [...r]);
    nameEl.value = saved?.name ?? "じぶんの ぼうし";
    focus = [0, 0];
    msg.textContent = saved ? "ピクセ「つづきを かく？」" : "ピクセ「マスを おして、ぼくの ぼうしを かいてね。」";
    build();
    renderColors();
    dialog.showModal();
    cellBtn(0, 0).focus();
  }

  // おへやの「ぼうし」の WARDROBE に「つくる」ボタン
  const makeBtn = document.getElementById("atelier-btn");
  makeBtn.addEventListener("click", open);
  cheats.add("atelier", open);

  return { open, saved: () => saved };
})();
