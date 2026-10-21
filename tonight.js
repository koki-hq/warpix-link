// ---------- こんやの 3ぎょう（v1.29）：よるに なると、ピクセが きょう いちにちを 3 ぎょうの にっきに まとめる ----------
// ひるの あいだは、ワープ・つつかれた かず・UFO・とった じっせきを かぞえておく（warpix-today。ひづけが かわったら はじめから）。
// よる（19:30〜4:00）に おへやの「にっき」を ひらくと、いちばん うえに 3 ぎょう。ひるは「よるに なると……」の よこくだけ。
// よるの あいだ、まだ よんでいなければ ROOM ボタンに ちいさな つきの しるし（しゃべって おしえると、ほかの だいじな ひとことに かぶるので）。
// ?hour=21 のように つけると、その じこくの つもりで みられる（sky.js と おなじ）。
const tonight = (() => {
  const KEY = "warpix-today";
  const READ = "warpix-tonight-read"; // 3 ぎょうを よんだ ひ
  const preview = new URLSearchParams(location.search).has("date");
  const q = new URLSearchParams(location.search).get("hour");
  const fixedHour = q !== null && /^\d{1,2}(\.\d+)?$/.test(q) && Number(q) < 24 ? Number(q) : null;
  const pad2 = (n) => String(n).padStart(2, "0");
  const d = today();
  const ymd = `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

  const hourNow = () => {
    if (fixedHour !== null) return fixedHour;
    const n = new Date();
    return n.getHours() + n.getMinutes() / 60;
  };
  const isNight = () => {
    const h = hourNow();
    return h >= 19.5 || h < 4;
  };

  const fresh = () => ({ date: ymd, warps: {}, pokes: 0, ufos: 0, ach: [] });
  // ひづけが かわったら、まえの ひの かずは warpix-days に のこす（さいきん 14 にちぶん。ピクセの てがみ v1.33 が よむ）
  const DAYS = "warpix-days";
  let tally = store.get(KEY, null);
  if (!tally || tally.date !== ymd) {
    if (tally?.date && tally.date < ymd && !preview) {
      const days = store.get(DAYS, []).filter((d) => d.date !== tally.date);
      days.push(tally);
      days.sort((a, b) => (a.date < b.date ? -1 : 1));
      store.set(DAYS, days.slice(-14));
    }
    tally = fresh();
  }
  const save = () => !preview && store.set(KEY, tally);

  on("link", ({ icon }) => {
    if (!icon) return;
    tally.warps[icon] = (tally.warps[icon] ?? 0) + 1;
    save();
  });
  on("poke", () => {
    tally.pokes++;
    save();
  });
  on("ufo-down", () => {
    tally.ufos++;
    save();
  });
  on("achievement", ({ id, name }) => {
    if (id === "diary" || id === "tonight") return; // にっきを ひらいた・よんだ ことは まとめに いれない
    tally.ach.push(name);
    save();
  });

  // ---------- 3 ぎょうを かく ----------
  const FEELINGS = [
    "あしたも ここで まってるね。",
    "ほしが きれいな よる。おやすみ。",
    "きみと あえて よかった。",
    "あしたは どの せかいへ いこうか。",
    "ねむく なってきた……zzz",
  ];
  function lines() {
    const warps = Object.values(tally.warps).reduce((a, b) => a + b, 0);

    // 1. いちばんの できごと
    let first;
    if (tally.ach.length === 1) first = `きょうは じっせき「${tally.ach[0]}」を とった ひ！`;
    else if (tally.ach.length > 1) first = `きょうは じっせきを ${tally.ach.length}こも とった ひ！`;
    else if (warps) first = "きょうも いっしょに ワープした。"; // いきさきの なまえは いわない。かずは 2 ぎょうめ（v1.52.1）
    else if (tally.pokes) first = `きょうは ${tally.pokes}かい つつかれた。`;
    else first = "きょうは のんびり ほしを みてた。";

    // 2. かず（0 の ものは いわない）
    const parts = [];
    if (warps) parts.push(`ワープ ${warps}かい`);
    if (tally.pokes) parts.push(`つつかれた ${tally.pokes}かい`);
    if (tally.ufos) parts.push(`UFO ${tally.ufos}き`);
    const second = parts.length ? `${parts.join("・")}。` : "かずは ぜんぶ 0。それも いい ひ。";

    // 3. きもち（ひづけで きまる。たくさん ワープした ひは とくべつ）
    const seed = [...ymd].reduce((a, c) => a + c.charCodeAt(0), 0);
    const third = warps >= 10 ? "たくさん ワープして つかれたね。ゆっくり ねてね。" : FEELINGS[seed % FEELINGS.length];
    return [first, second, third];
  }

  // ---------- にっきの いちばん うえに ----------
  const MOON = ["..yyy.", ".yy...", "yy....", "yy....", ".yy...", "..yyy."];
  function card() {
    const body = document.getElementById("diary-body");
    body.querySelector(".tonight")?.remove();
    const el = document.createElement("section");
    el.className = "tonight";
    if (isNight()) {
      el.innerHTML = `<h3><span class="tonight-moon">${pixelSvg(MOON)}</span>こんやの 3ぎょう</h3>
        <ol>${lines().map((t) => `<li>${t}</li>`).join("")}</ol>`;
      achievements.unlock("tonight");
      if (!preview) store.set(READ, ymd);
      mark();
    } else {
      el.classList.add("waiting");
      el.innerHTML = `<p>よるに なると、ここに ぼくが きょうの 3ぎょうを かくよ。</p>`;
    }
    // ピクセの なまえの したに
    const head = body.querySelector(".diary-head");
    head ? head.after(el) : body.prepend(el);
  }
  on("notebook-tab", ({ which }) => which === "diary" && card());

  // ROOM ボタンの つきの しるし（よるで、こんやは まだ よんでいない とき）
  const moon = document.createElement("span");
  moon.className = "room-moon";
  moon.innerHTML = `${pixelSvg(MOON)}<span class="sr-only">こんやの にっき あり</span>`;
  document.getElementById("room-btn").append(moon);
  function mark() {
    moon.hidden = !isNight() || store.get(READ, null) === ymd;
  }
  mark();
  setInterval(mark, 60000); // よるに なったら でる（1 ぷんに いちど みるだけ）

  // きょうまでの かず（のこした ひ ＋ きょう）
  const history = () => [...store.get(DAYS, []).filter((d) => d.date < ymd), tally];
  return { lines, isNight, hourNow, ymd, tally: () => tally, history };
})();
