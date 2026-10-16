// ---------- ピクセの てがみ（v1.33）：にちようの よるに、その しゅうの ことを かいた てがみが とどく ----------
// かずは tonight.js が のこしている きょうまでの かず（warpix-days ＋ きょう）と、あえた ひ（grow）から。
// とどいた てがみは warpix-letters に のこして（さいきん 8 つう）、おへやの「にっき」から いつでも よみかえせる。
// ?date=2026-10-18&hour=21 のように つけると、にちようの よるを のぞける（のぞいている ときは のこさない）。
const letter = (() => {
  const KEY = "warpix-letters";
  const preview = new URLSearchParams(location.search).has("date");
  const pad2 = (n) => String(n).padStart(2, "0");
  const ymdOf = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
  const dayBefore = (ymd, n) => {
    const d = new Date(`${ymd}T12:00:00`);
    d.setDate(d.getDate() - n);
    return ymdOf(d);
  };
  const fmt = (ymd) => `${Number(ymd.slice(5, 7))}/${Number(ymd.slice(8, 10))}`;
  const ymd = tonight.ymd;
  const isSundayNight = () => today().getDay() === 0 && tonight.hourNow() >= 19.5;

  let letters = store.get(KEY, []);
  const labelOf = (icon) => (icon === "key" ? "ひみつの ワープゾーン" : CASSETTES.byId(icon)?.label ?? icon.toUpperCase());

  // ---------- この しゅう（きょうを いれて 7 にち）の てがみを かく ----------
  function write() {
    const from = dayBefore(ymd, 6);
    const week = tonight.history().filter((d) => d.date >= from && d.date <= ymd);
    const met = (grow.state.days ?? []).filter((d) => d >= from && d <= ymd).length;
    const warps = {};
    let pokes = 0;
    let ach = 0;
    for (const d of week) {
      for (const [icon, n] of Object.entries(d.warps ?? {})) warps[icon] = (warps[icon] ?? 0) + n;
      pokes += d.pokes ?? 0;
      ach += d.ach?.length ?? 0;
    }
    const total = Object.values(warps).reduce((a, b) => a + b, 0);
    const [top, topN] = Object.entries(warps).sort((a, b) => b[1] - a[1])[0] ?? [];
    const lines = [
      "きみへ",
      met >= 7 ? "こんしゅうは まいにち あえたね。すごく うれしかった。" : `こんしゅうは ${Math.max(met, 1)}にち あえたね。`,
      top ? `いちばん いった せかいは ${labelOf(top)}（${topN}かい）。` : "こんしゅうは どこにも ワープ しなかったね。",
      total || pokes ? `ワープは ぜんぶで ${total}かい、ぼくが つつかれたのは ${pokes}かい。` : "ふたりで のんびり ほしを みた しゅうだった。",
      ach ? `じっせきを ${ach}こ とったね。その ちょうし！` : "じっせきは おやすみの しゅう。それも いいね。",
      "らいしゅうも いっしょに ワープしようね。",
    ];
    return { week: ymd, from, lines };
  }

  // ---------- とどける（にちようの よる、まだ なければ） ----------
  function deliver() {
    if (!isSundayNight() || letters.some((l) => l.week === ymd)) return null;
    const l = write();
    l.unread = true;
    letters = [l, ...letters].slice(0, 8);
    if (!preview) store.set(KEY, letters); // のぞいている ときは この ページの あいだだけ
    return l;
  }

  // ---------- よむ ----------
  const dialog = document.getElementById("letter");
  const bodyEl = document.getElementById("letter-body");
  function read(week) {
    const l = letters.find((x) => x.week === week);
    if (!l) return;
    const [to, ...rest] = l.lines;
    bodyEl.innerHTML = `<p class="letter-date">${fmt(l.from)} 〜 ${fmt(l.week)}</p>
      <p class="letter-to">${to}</p>
      ${rest.map((t) => `<p>${t}</p>`).join("")}
      <p class="letter-from"><span class="letter-pixe">${pixelSvg(dress(NPC.idle))}</span>ピクセより</p>`;
    dialog.showModal();
    if (l.unread) {
      l.unread = false;
      if (!preview) store.set(KEY, letters);
      achievements.unlock("letter");
      grow.write("letter", "ピクセから てがみが とどいた。");
    }
    card();
  }
  document.getElementById("letter-close").addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (e) => e.target === dialog && dialog.close());

  // ---------- にっきの なか：てがみの たば ----------
  const ENVELOPE = ["wwwwwwwwww", "wpwwwwwwpw", "wwpwwwwpww", "wwwppppwww", "wwwwwwwwww", "wwwwwwwwww", "wwwwwwwwww"];
  function card() {
    const body = document.getElementById("diary-body");
    body.querySelector(".letters")?.remove();
    deliver();
    if (!letters.length) return;
    const el = document.createElement("section");
    el.className = "letters";
    el.innerHTML = `<h3>ピクセからの てがみ</h3>
      <div class="letter-list">${letters
        .map((l) => `<button type="button" class="letter-btn${l.unread ? " unread" : ""}" data-week="${l.week}">
          <span class="letter-env" aria-hidden="true">${pixelSvg(ENVELOPE)}</span>${fmt(l.week)} の てがみ${l.unread ? '<span class="letter-new">NEW</span>' : ""}</button>`)
        .join("")}</div>`;
    el.addEventListener("click", (e) => {
      const b = e.target.closest(".letter-btn");
      if (b) read(b.dataset.week);
    });
    const after = body.querySelector(".tonight") ?? body.querySelector(".diary-head");
    after ? after.after(el) : body.prepend(el);
  }
  on("notebook-tab", ({ which }) => which === "diary" && card());

  return { write, letters: () => letters, read, isSundayNight };
})();
