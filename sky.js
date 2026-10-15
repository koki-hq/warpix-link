// ---------- じかんの そら：本物の時刻で、夜空にうすい色のベールを重ねる ----------
// 明け方は ピンクと むらさき、昼は 少し明るい紺（星がうすくなる）、夕方は 地平線が かぼちゃ色、夜は いつもの夜空。
// 色は決めてあるパレットの色だけ。1 分ごとに、なめらかに次の色へ。?hour=18 のように付けると、その時刻の空を先取りできる。
const skytime = (() => {
  // [時刻, 上の色, 下の色]（色は [r, g, b, 不透明度]）
  const NIGHT = [[42, 33, 80, 0], [15, 11, 30, 0]];
  const DAWN = [[61, 47, 120, 0.3], [255, 79, 163, 0.22]];
  const DAY = [[42, 33, 80, 0.55], [62, 232, 255, 0.12]];
  const DUSK = [[61, 47, 120, 0.2], [255, 138, 31, 0.26]];
  const KEYS = [
    [0, NIGHT], [4.5, NIGHT], [5.5, DAWN], [7, DAWN], [8.5, DAY],
    [16, DAY], [17.5, DUSK], [19, DUSK], [20, NIGHT], [24, NIGHT],
  ];

  const q = new URLSearchParams(location.search).get("hour");
  const fixedHour = q !== null && /^\d{1,2}(\.\d+)?$/.test(q) && Number(q) < 24 ? Number(q) : null;
  const hourNow = () => {
    if (fixedHour !== null) return fixedHour;
    const d = new Date();
    return d.getHours() + d.getMinutes() / 60;
  };

  // 図鑑に入れる「そらの いろ」の名前
  const nameOf = (h) => (h >= 4.5 && h < 7.75 ? "dawn" : h >= 7.75 && h < 16.75 ? "day" : h >= 16.75 && h < 19.5 ? "dusk" : "night");

  function colorAt(h) {
    const i = KEYS.findIndex(([t], j) => h >= t && h < KEYS[j + 1]?.[0]);
    const [t0, a] = KEYS[i];
    const [t1, b] = KEYS[i + 1];
    const k = (h - t0) / (t1 - t0);
    const mix = (x, y) => x.map((v, n) => (n < 3 ? Math.round(v + (y[n] - v) * k) : +(v + (y[n] - v) * k).toFixed(3)));
    return [mix(a[0], b[0]), mix(a[1], b[1])];
  }

  const el = document.createElement("div");
  el.className = "sky-tint";
  el.setAttribute("aria-hidden", "true");
  document.getElementById("stars").after(el);

  let last = null;
  function update() {
    const h = hourNow();
    const [top, bottom] = colorAt(h);
    el.style.background = `linear-gradient(to bottom, rgba(${top.join(",")}), rgba(${bottom.join(",")}))`;
    const name = nameOf(h);
    document.documentElement.dataset.sky = name;
    if (name !== last) {
      last = name;
      zukan.mark("skycolor", name);
    }
  }

  update();
  setInterval(update, 60000);
  return { colorAt, nameOf, update };
})();
