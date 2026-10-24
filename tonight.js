// ---------- きょうの かず（v1.29 の「こんやの 3ぎょう」の のこり）：ピクセの てがみ（letter.js）が よむ ----------
// ひるの あいだ、ワープ・つつかれた かず・UFO・とった じっせきを かぞえておく（warpix-today。ひづけが かわったら はじめから）。
// 3 ぎょうの にっきと ROOM の つきの しるしは v1.55 で やめた（ピクセの つぶやきと かぶる、かずを いうのは みはられて いる かんじ）。
// ?hour=21 のように つけると、その じこくの つもりで みられる（sky.js と おなじ）。
const tonight = (() => {
  const KEY = "warpix-today";
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
    if (id === "diary") return; // つぶやきを ひらいた ことは かぞえない
    tally.ach.push(name);
    save();
  });

  // きょうまでの かず（のこした ひ ＋ きょう）
  const history = () => [...store.get(DAYS, []).filter((d) => d.date < ymd), tally];
  return { hourNow, ymd, tally: () => tally, history };
})();
