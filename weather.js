// ---------- 本物の天気：今いる街の天気がページに降ってくる ----------
// 天気は Open-Meteo（無料・キー不要）から取る。位置は 0.1 度（約 10km）に丸めてから送る
const weather = (() => {
  const CACHE_MS = 30 * 60 * 1000;
  const PLACE_MS = 24 * 60 * 60 * 1000;
  const UMBRELLA = {
    name: "かさ", top: 0,
    rows: [
      ".....cccccc.....",
      "...cccccccccc...",
      "..c.c.c.c.c.c...",
    ],
  };

  // WMO の天気コード → ページでの天気
  function kindOf(code) {
    if (code >= 95) return "thunder";
    if ((code >= 71 && code <= 77) || code === 85 || code === 86) return "snow";
    if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return "rain";
    if (code === 45 || code === 48) return "fog";
    if (code >= 1 && code <= 3) return "cloudy";
    return "clear";
  }

  const LINES = {
    clear: (t, day) => [day ? `いい てんき！ いま ${t}ど。\nそとも きもちよさそう。` : `よく はれた よる。いま ${t}ど。\nそっちでも ほし、みえてる？`],
    cloudy: (t) => [`そっちは くもり みたい。\nいま ${t}ど だって。`],
    fog: (t) => [`きりが でてるね。\nあしもとに きをつけて。（${t}ど）`],
    rain: (t) => [`そっちは あめ なんだね。\nいま ${t}ど。`, "かさ、もってる？\nぼくは もってる！"],
    snow: (t) => [`ゆき！？ いま ${t}ど。\nあったかく してね。`],
    thunder: (t) => [`かみなり なってる……！\nいま ${t}ど。`, "ちょっと こわいから\nここに いても いい？"],
  };

  // ---------- 降らせる ----------
  function layer() {
    const cv = document.createElement("canvas");
    cv.className = "season-fx weather-fx";
    cv.setAttribute("aria-hidden", "true");
    document.getElementById("stars").after(cv);
    const fit = () => {
      cv.width = innerWidth;
      cv.height = innerHeight;
    };
    fit();
    addEventListener("resize", fit);
    return cv;
  }

  function animate(cv, step) {
    const c = cv.getContext("2d");
    const tick = () => {
      c.clearRect(0, 0, cv.width, cv.height);
      step(c);
      if (!reduceMotion) requestAnimationFrame(tick);
    };
    tick();
  }

  function rain(heavy) {
    const cv = layer();
    const drops = Array.from({ length: heavy ? 140 : 90 }, () => ({
      x: Math.random() * innerWidth,
      y: Math.random() * innerHeight,
      v: 6 + Math.random() * 4,
    }));
    animate(cv, (c) => {
      c.fillStyle = "rgba(62, 232, 255, 0.55)";
      for (const d of drops) {
        c.fillRect(Math.floor(d.x / 2) * 2, Math.floor(d.y / 2) * 2, 2, 8);
        d.y += d.v;
        d.x -= 0.8;
        if (d.y > cv.height) Object.assign(d, { y: -10, x: Math.random() * (cv.width + 60) });
      }
    });
  }

  function snowfall() {
    const cv = layer();
    const flakes = Array.from({ length: 80 }, () => ({
      x: Math.random() * innerWidth,
      y: Math.random() * innerHeight,
      s: Math.random() < 0.3 ? 4 : 2,
      v: 0.5 + Math.random() * 0.7,
      p: Math.random() * 6,
    }));
    animate(cv, (c) => {
      c.fillStyle = "#f4f4f4";
      for (const f of flakes) {
        c.fillRect(Math.floor((f.x + Math.sin(f.p) * 6) / 2) * 2, Math.floor(f.y / 2) * 2, f.s, f.s);
        f.y += f.v;
        f.p += 0.02;
        if (f.y > cv.height) Object.assign(f, { y: -4, x: Math.random() * cv.width });
      }
    });
  }

  // ドット絵の雲がゆっくり流れる
  function clouds(count) {
    const cv = layer();
    const CLOUD = [
      "....wwww........",
      "..wwwwwwww.www..",
      ".wwwwwwwwwwwwww.",
      "wwwwwwwwwwwwwwww",
      ".wwwwwwwwwwwwww.",
    ];
    const list = Array.from({ length: count }, (_, i) => ({
      x: Math.random() * innerWidth,
      y: 40 + i * 90 + Math.random() * 40,
      s: 4 + Math.floor(Math.random() * 3),
      v: 0.08 + Math.random() * 0.1,
    }));
    animate(cv, (c) => {
      c.fillStyle = "rgba(138, 128, 184, 0.35)";
      for (const cl of list) {
        CLOUD.forEach((row, y) =>
          [...row].forEach((ch, x) => ch === "w" && c.fillRect(Math.floor(cl.x) + x * cl.s, cl.y + y * cl.s, cl.s, cl.s))
        );
        cl.x += cl.v;
        if (cl.x > cv.width) cl.x = -16 * cl.s;
      }
    });
  }

  function fog() {
    const cv = layer();
    animate(cv, (c) => {
      for (let y = 0; y < cv.height; y += 8) {
        c.fillStyle = `rgba(138, 128, 184, ${0.04 + 0.04 * Math.sin(y / 40 + performance.now() / 4000)})`;
        c.fillRect(0, y, cv.width, 8);
      }
    });
  }

  // かみなり：画面は光らせず（点滅しない）、ドットの稲妻と低いゴロゴロ
  function thunder() {
    rain(true);
    const BOLT = ["..yy", ".yy.", "yyyy", "..y.", ".y..", "y..."];
    setInterval(() => {
      if (document.hidden || reduceMotion) return;
      const el = document.createElement("div");
      el.className = "bolt";
      el.innerHTML = pixelSvg(BOLT);
      el.style.left = `${10 + Math.random() * 80}vw`;
      document.body.append(el);
      setTimeout(() => el.remove(), 600);
      sound.sfx.rumble();
    }, 9000 + Math.random() * 6000);
  }

  const EFFECTS = {
    clear: (day) => !day && stars.setColors(["#f4f4f4", "#f4f4f4", "#f4f4f4", "#f4f4f4", "#3ee8ff", "#ff4fa3", "#ffd84a"]),
    cloudy: () => clouds(3),
    fog: () => fog(),
    rain: () => rain(false),
    snow: () => snowfall(),
    thunder: () => thunder(),
  };

  let applied = false;
  // asked：じぶんで「いいよ」と こたえた すぐ あと。その へんじ なので「1 かい 1 つ」には かぞえない
  function apply(data, { asked = false } = {}) {
    if (applied) return;
    applied = true;
    const kind = kindOf(data.code);
    document.body.classList.add(`weather-${kind}`);
    EFFECTS[kind](data.day);
    if (kind === "rain" || kind === "thunder") wardrobe.wearSeasonal("umbrella");
    achievements.unlock("weather");
    emit("weather", { kind, temp: Math.round(data.temp) });
    // おなじ 日に おなじ 天気なら もう いわない。そらと かさで わかる（v1.50）
    const d = today();
    const said = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}:${kind}`;
    if (store.get("warpix-weather-said", null) === said) return;
    const say = () => {
      if (!npc.ready() || playing()) return setTimeout(say, 4000);
      if (!asked && !npc.turn()) return; // 1 かい ひらいて 1 つ まで（v1.52）。いえなかったら、つぎに きた ときに
      store.set("warpix-weather-said", said);
      npc.say(LINES[kind](Math.round(data.temp), data.day));
    };
    say();
  }

  // ---------- 取ってくる ----------
  function locate() {
    return new Promise((resolve, reject) =>
      navigator.geolocation.getCurrentPosition(
        (p) => resolve({ lat: Math.round(p.coords.latitude * 10) / 10, lon: Math.round(p.coords.longitude * 10) / 10 }),
        reject,
        { enableHighAccuracy: false, timeout: 15000, maximumAge: 3600000 }
      )
    );
  }

  async function fetchWeather() {
    const cached = store.get("warpix-weather-cache", null);
    if (cached && Date.now() - cached.at < CACHE_MS) return cached;
    // ばしょは 1 にち つかいまわす。iPhone の アプリだと、ききに いく たびに「ばしょを つかう？」が 出て しまうから（v1.50.2）
    const fresh = cached?.lat != null && Date.now() - cached.placeAt < PLACE_MS;
    const { lat, lon } = fresh ? cached : await locate();
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=weather_code,is_day,temperature_2m&timezone=auto`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`weather ${res.status}`);
    const j = await res.json();
    const data = {
      at: Date.now(), code: j.current.weather_code, day: j.current.is_day === 1, temp: j.current.temperature_2m,
      lat, lon, placeAt: fresh ? cached.placeAt : Date.now(),
    };
    store.set("warpix-weather-cache", data);
    return data;
  }

  async function check({ quiet = false } = {}) {
    if (!("geolocation" in navigator)) {
      if (!quiet) npc.say(["この ブラウザだと\nばしょが わからない みたい。"]);
      return;
    }
    try {
      apply(await fetchWeather(), { asked: !quiet });
    } catch {
      if (!quiet) npc.say(["てんきが わからなかった……\nまた こんど ためしてみてね。"]);
    }
  }

  function ask() {
    npc.ask("そっちの てんき、しらべても いい？\n（ばしょの じょうほうを つかうよ）", ["いいよ", "やめとく"]).then((i) => {
      if (i >= 0) npc.answered("weather", i === 0);
      if (i === 0) {
        store.set("warpix-weather", "yes");
        check();
      } else if (i === 1) {
        store.set("warpix-weather", "no");
        npc.say(["わかった！\nきが かわったら weather って うってね。"]);
      } else setTimeout(() => offer(true), 30000);
    });
  }

  // 1 かい ひらいて 1 つ まで。ことわられたら 1 しゅうかん あけて もう 1 かい、2 かいで おわり（v1.52）
  function offer(mine = false) {
    if (!npc.ready() || playing() || npc.isAway()) return setTimeout(() => offer(mine), 8000);
    if (!mine && !npc.turn()) return;
    ask();
  }

  wardrobe.addHat("umbrella", { ...UMBRELLA, unlock: "weather", hint: "" });

  on("boot", () => {
    const consent = store.get("warpix-weather", null);
    if (consent === "yes") check({ quiet: true });
    if (consent === "yes" || !("geolocation" in navigator)) return;
    // v1.51 までに ことわった 人は、1 かい ことわった ことに する
    if (consent === "no" && !store.get("warpix-asked", {}).weather) npc.answered("weather", false);
    // 冒険のおさそい（25 秒後）より あとに 聞く
    if (npc.mayAsk("weather")) setTimeout(offer, 60000);
  });
  cheats.add("weather", () => {
    store.set("warpix-weather", null);
    store.set("warpix-weather-cache", null);
    ask();
  });

  return { check, kindOf };
})();
