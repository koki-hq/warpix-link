// ---------- ピクセの スタンプカード：あえた ひに、ピクセが ハンコを おす ----------
// ノートの「スタンプ」タブ。ひと月の カレンダーに、あえた ひの スタンプ。
// その日の できごと（日記）で スタンプが かわる：おみやげ・ボス・ランキング・ぼうけん・おんがく・UFO・ふつう。
const stamp = (() => {
  const STAMPS = {
    gift: { label: "おみやげの ひ", rows: ["..y..y..", "...yy...", "pppyyppp", "pppyyppp", "yyyyyyyy", "pppyyppp", "pppyyppp", "pppyyppp"] },
    star: { label: "ボスを たおした ひ", rows: ["...yy...", "...yy...", "yyyyyyyy", ".yyyyyy.", "..yyyy..", ".yy..yy.", "yy....yy", "........"] },
    crown: { label: "ランキングに はいった ひ", rows: ["........", "y..yy..y", "yy.yy.yy", "yyyyyyyy", "yyyyyyyy", "ypyyyypy", "yyyyyyyy", "........"] },
    flag: { label: "ぼうけんした ひ", rows: ["cc......", "ccccc...", "ccccccc.", "ccccc...", "cc......", "c.......", "c.......", "c......."] },
    note: { label: "おんがくの ひ", rows: ["....ccc.", "....c.cc", "....c...", "....c...", "..ccc...", ".cccc...", ".ccc....", "........"] },
    ufo: { label: "UFOに あった ひ", rows: ["........", "..cccc..", ".cccccc.", "wwwwwwww", "wpwwpwwp", ".wwwwww.", "..w..w..", "........"] },
    face: { label: "あえた ひ", rows: ["..pppp..", ".pppppp.", "pp.pp.pp", "pppppppp", "pppppppp", "pp.pp.pp", ".pp..pp.", "..pppp.."] },
  };
  // 日記の できごと → スタンプ（上のほうが つよい）
  const ORDER = [
    ["gift", ["rusuban"]],
    ["star", ["boss"]],
    ["crown", ["rank"]],
    ["flag", ["adventure", "ghost"]],
    ["note", ["song", "shelf", "gift"]],
    ["ufo", ["ufo", "raid"]],
  ];
  // ノートは クリーム色の かみなので、スタンプは こい インク 1 色（ぬけは かみの色）
  const PAPER = "#fffaf0";
  const INK = { gift: "#d6247a", star: "#c25400", crown: "#9a6a00", flag: "#11707f", note: "#5b3fc4", ufo: "#11707f", face: "#d6247a" };
  const inkOf = (id) => ({ p: INK[id], c: INK[id], y: INK[id], w: INK[id], ...(id === "gift" ? { y: "#9a6a00" } : id === "ufo" || id === "crown" ? { p: PAPER } : {}) });
  const WEEK = ["にち", "げつ", "か", "すい", "もく", "きん", "ど"];

  const pad2 = (n) => String(n).padStart(2, "0");
  const ymdOf = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
  const dateOf = (s) => {
    const [y, m, d] = s.split("-").map(Number);
    return new Date(y, m - 1, d);
  };
  const addDays = (s, n) => {
    const d = dateOf(s);
    d.setDate(d.getDate() + n);
    return ymdOf(d);
  };

  // その日の スタンプ（あっていない日は null）
  function stampOf(date) {
    if (!grow.state.days.includes(date)) return null;
    const types = new Set(grow.state.diary.filter((e) => e.date === date).map((e) => e.type));
    return ORDER.find(([, ts]) => ts.some((x) => types.has(x)))?.[0] ?? "face";
  }

  // れんぞく：きょう（まだなら きのう）から さかのぼった 日数と、いちばん ながい れんぞく
  function streaks() {
    const set = new Set(grow.state.days);
    const sorted = [...set].sort();
    let best = 0;
    let run = 0;
    let prev = null;
    for (const d of sorted) {
      run = prev && addDays(prev, 1) === d ? run + 1 : 1;
      best = Math.max(best, run);
      prev = d;
    }
    let now = 0;
    let d = ymdOf(today());
    if (!set.has(d)) d = addDays(d, -1);
    while (set.has(d)) {
      now++;
      d = addDays(d, -1);
    }
    return { now, best };
  }

  // スタンプの かたむき（日付で きまる。-12〜12 ど）
  const tilt = (date) => {
    let h = 0;
    for (const ch of date) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    return (h % 25) - 12;
  };

  // ---------- 画面 ----------
  const body = document.getElementById("stamp-body");
  let month = null; // 見ている月の 1 日（Date）

  function range() {
    const first = [...grow.state.days].sort()[0] ?? ymdOf(today());
    const a = dateOf(first);
    const b = today();
    return [new Date(a.getFullYear(), a.getMonth(), 1), new Date(b.getFullYear(), b.getMonth(), 1)];
  }

  function render() {
    const [min, max] = range();
    if (!month || month > max) month = max;
    if (month < min) month = min;
    const y = month.getFullYear();
    const m = month.getMonth();
    const todayYmd = ymdOf(today());
    const daysIn = new Date(y, m + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < new Date(y, m, 1).getDay(); i++) cells.push(`<td class="blank"></td>`);
    let count = 0;
    for (let d = 1; d <= daysIn; d++) {
      const date = `${y}-${pad2(m + 1)}-${pad2(d)}`;
      const s = stampOf(date);
      if (s) count++;
      const st = s ? STAMPS[s] : null;
      cells.push(`<td class="${[s ? "visited" : "", date === todayYmd ? "today" : ""].join(" ").trim()}"${date === todayYmd ? ' aria-current="date"' : ""}>
        <span class="stamp-day">${d}</span>${st ? `<span class="stamp-mark" style="transform:rotate(${tilt(date)}deg)">${pixelSvg(st.rows, inkOf(s))}</span><span class="sr-only">${st.label}</span>` : ""}</td>`);
    }
    while (cells.length % 7) cells.push(`<td class="blank"></td>`);
    const weeks = [];
    for (let i = 0; i < cells.length; i += 7) weeks.push(`<tr>${cells.slice(i, i + 7).join("")}</tr>`);
    const { now, best } = streaks();
    const title = `${y}ねん ${m + 1}がつ`;
    body.innerHTML = `
      <div class="stamp-head">
        <button type="button" class="stamp-nav" data-d="-1" aria-label="まえの つき"${month <= min ? " disabled" : ""}>◀</button>
        <h3 class="stamp-title" aria-live="polite">${title}</h3>
        <button type="button" class="stamp-nav" data-d="1" aria-label="つぎの つき"${month >= max ? " disabled" : ""}>▶</button>
      </div>
      <table class="stamp-cal">
        <caption class="sr-only">${title}の スタンプ（あえた ひ ${count}にち）</caption>
        <thead><tr>${WEEK.map((w, i) => `<th scope="col" class="${i === 0 ? "sun" : i === 6 ? "sat" : ""}">${w}</th>`).join("")}</tr></thead>
        <tbody>${weeks.join("")}</tbody>
      </table>
      <p class="stamp-sum"><span>この つき <b>${count}</b>にち</span> ・ <span>いまの れんぞく <b>${now}</b>にち</span> ・ <span>さいちょう <b>${best}</b>にち</span></p>
      <ul class="stamp-legend" aria-label="スタンプの しゅるい">
        ${Object.entries(STAMPS).map(([id, s]) => `<li><span class="stamp-mark">${pixelSvg(s.rows, inkOf(id))}</span>${s.label}</li>`).join("")}
      </ul>`;
    body.querySelectorAll(".stamp-nav").forEach((b) =>
      b.addEventListener("click", () => {
        month = new Date(y, m + Number(b.dataset.d), 1);
        render();
        // 押したボタンが けされても、同じ むきの ボタンに フォーカスを のこす（はしなら もう片方）
        const again = body.querySelector(`.stamp-nav[data-d="${b.dataset.d}"]`);
        (again.disabled ? body.querySelector(".stamp-nav:not([disabled])") : again)?.focus();
      })
    );
  }

  on("notebook-tab", ({ which }) => which === "stamp" && render());

  // 7 にち れんぞくで 実績
  on("boot", () => {
    if (streaks().now >= 7) achievements.unlock("streak7");
  });

  return { stampOf, streaks, render, STAMPS };
})();
