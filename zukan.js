// ---------- ピクセの ずかん：これまでに出会ったものを、日記のノートに集めていく ----------
// 記録はこのブラウザの中だけ。まだ出会っていないものは、黒いシルエットと「？？？」。
const zukan = (() => {
  const KEY = "warpix-zukan";
  const preview = new URLSearchParams(location.search).has("date");
  const pad2 = (n) => String(n).padStart(2, "0");
  const ymd = (() => { const d = today(); return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`; })();
  const state = store.get(KEY, null) ?? { seen: {} }; // { "sky:ufo": "2026-10-16", ... }
  const save = () => !preview && store.set(KEY, state);

  // ---------- 絵 ----------
  const STAR = [
    "............",
    ".....yy.....",
    ".....yy.....",
    "....yyyy....",
    "yyyyywwyyyyy",
    ".yyyywwyyyy.",
    "..yyyyyyyy..",
    "..yyyyyyyy..",
    ".yyyy..yyyy.",
    ".yyy....yyy.",
    ".y........y.",
    "............",
  ];
  const WEATHER = {
    clear: ["............", ".....yy.....", ".y..yyyy..y.", "..yyyyyyyy..", "..yyyyyyyy..", ".yyyyyyyyyy.", ".yyyyyyyyyy.", "..yyyyyyyy..", "..yyyyyyyy..", ".y..yyyy..y.", ".....yy.....", "............"],
    cloudy: ["............", "............", "....wwww....", "..wwwwwwww..", ".wwwwwwwwww.", "wwwwwwwwwwww", "wwwwwwwwwwww", ".wwwwwwwwww.", "............", "............", "............", "............"],
    fog: ["............", "............", "wwwwwwww....", "............", "...wwwwwwwww", "............", "wwwwwwwww...", "............", "...wwwwwwww.", "............", "wwwwwww.....", "............"],
    rain: ["....wwww....", "..wwwwwwww..", ".wwwwwwwwww.", "wwwwwwwwwwww", ".wwwwwwwwww.", "............", "..c...c...c.", "..c...c...c.", "............", ".c...c...c..", ".c...c...c..", "............"],
    snow: ["............", ".w....w....w", "............", "....w....w..", "..w.........", ".......w....", ".w.........w", "....w.......", ".........w..", "..w....w....", "............", ".....w....w."],
    thunder: ["....wwww....", "..wwwwwwww..", ".wwwwwwwwww.", "wwwwwwwwwwww", ".wwwwyywwww.", ".....yy.....", "....yy......", "...yyyyy....", ".....yy.....", "....yy......", "...yy.......", "............"],
  };
  function moonRows(phase) {
    return Array.from({ length: 16 }, (_, y) => {
      let row = "";
      for (let x = 0; x < 16; x++) {
        const dx = (x + 0.5 - 8) / 7.5;
        const dy = (y + 0.5 - 8) / 7.5;
        if (dx * dx + dy * dy > 1) { row += "."; continue; }
        const w = Math.sqrt(1 - dy * dy);
        const lit = phase < 0.5 ? dx >= w * Math.cos(2 * Math.PI * phase) : dx <= w * Math.cos(2 * Math.PI * (phase - 0.5));
        row += lit ? "y" : "n";
      }
      return row;
    });
  }
  const pixeIn = (palette) => (rows) => pixelSvg(rows, { ...PALETTE, ...palette });
  const hatOn = (id) => () => pixelSvg(dress(NPC.idle, wardrobe.hats()[id] ?? null, []));

  // ---------- 図鑑の中身 ----------
  const SECTIONS = [
    {
      id: "sky", title: "そらで であった もの",
      entries: [
        { id: "ufo", name: "UFO", draw: () => pixelSvg(UFO) },
        { id: "bat", name: "コウモリ", draw: () => pixelSvg(season.bat) },
        { id: "mothership", name: "マザーシップ", draw: () => pixelSvg(MOTHERSHIP) },
        { id: "star", name: "ながれぼし", draw: () => pixelSvg(STAR) },
        { id: "raid", name: "みんなの マザーシップ", draw: () => pixelSvg(MOTHERSHIP, { ...PALETTE, c: "var(--accent)" }) },
        { id: "visitor", name: "だれかの ピクセ", draw: () => pixeIn({ w: "var(--muted)" })(NPC.idle) },
        { id: "guest", name: "となりの タブの ぼく", draw: () => pixelSvg(NPC.idle) },
        { id: "adv-ghost", name: "ぼうけんの ゴースト", draw: () => pixeIn({ o: "var(--accent-2)", w: "var(--accent-2)", p: "var(--accent-2)", c: "var(--bg)" })(NPC.idle) },
      ],
    },
    {
      id: "moon", title: "みた つき",
      entries: [
        ["しんげつ", 0.02], ["みかづき", 0.12], ["じょうげんの つき", 0.25], ["まんげつ ちょっと まえ", 0.4],
        ["まんげつ", 0.5], ["ちょっと かけた つき", 0.6], ["かげんの つき", 0.75], ["ありあけの つき", 0.88],
      ].map(([name, ph]) => ({ id: name, name, draw: () => pixelSvg(moonRows(ph), { ...PALETTE, n: "var(--btn)" }) })),
    },
    {
      id: "skycolor", title: "そらの いろ",
      entries: [
        ["night", "よる", ["nnnnnnnnnnnn", "nnwnnnnnnwnn", "nnnnnnwnnnnn", "nwnnnnnnnnnn", "nnnnnwnnnnwn", "nnnnnnnnnnnn", "nnnwnnnnnnnn", "nnnnnnnnwnnn", "nwnnnnnnnnnn", "nnnnnnwnnnnn", "nnnnnnnnnnwn", "nnnnnnnnnnnn"]],
        ["dawn", "あさやけ", ["nnnnnnnnnnnn", "nnnnnnnnnnnn", "vvvvvvvvvvvv", "vvvvvvvvvvvv", "vvvvvvvvvvvv", "pppppppppppp", "pppppppppppp", "pppppyyppppp", "ppppyyyypppp", "pppyyyyyyppp", "pppppppppppp", "pppppppppppp"]],
        ["day", "ひる", ["vvvvvvvvvvvv", "vvvvvvvvyyvv", "vvvvvvvyyyyv", "vvvvvvvyyyyv", "vvvvvvvvyyvv", "vvvvvvvvvvvv", "cccccccccccc", "cccccccccccc", "cccccccccccc", "cccccccccccc", "cccccccccccc", "cccccccccccc"]],
        ["dusk", "ゆうやけ", ["nnnnnnnnnnnn", "nnnnnnnnnnnn", "pppppppppppp", "pppppppppppp", "kkkkkkkkkkkk", "kkkkkkkkkkkk", "kkkkyyyykkkk", "kkkyyyyyykkk", "kkkkkkkkkkkk", "kkkkkkkkkkkk", "nnnnnnnnnnnn", "nnnnnnnnnnnn"]],
      ].map(([id, name, rows]) => ({ id, name, draw: () => pixelSvg(rows, { ...PALETTE, n: "var(--btn)" }) })),
    },
    {
      id: "weather", title: "そっちの てんき",
      entries: [["clear", "はれ"], ["cloudy", "くもり"], ["fog", "きり"], ["rain", "あめ"], ["snow", "ゆき"], ["thunder", "かみなり"]]
        .map(([id, name]) => ({ id, name, draw: () => pixelSvg(WEATHER[id]) })),
    },
    {
      id: "season", title: "きせつ",
      entries: [["halloween", "ハロウィン", "pumpkin"], ["christmas", "クリスマス", "santa"], ["newyear", "おしょうがつ", "hachimaki"], ["tanabata", "たなばた", "tanzaku"]]
        .map(([id, name, hat]) => ({ id, name, draw: hatOn(hat), has: () => store.get("warpix-season-hats", []).includes(`season:${id}`) })),
    },
    {
      id: "fortune", title: "おみくじ",
      entries: [["だいきち", "大吉"], ["ちゅうきち", "中吉"], ["しょうきち", "小吉"], ["きち", "吉"], ["すえきち", "末吉"]].map(([name, text]) => ({ id: name, name, text })),
    },
    {
      id: "hat", title: "ぼうし",
      entries: Object.entries(wardrobe.hats()).filter(([, hat]) => !hat.variantOf).map(([id, hat]) => ({ id, name: hat.name, draw: hatOn(id), has: () => wardrobe.opened(id) })),
    },
  ];
  // 帽子は季節・天気の帽子があとから足されるので、ひらくたびに作り直す
  function hatSection() {
    const s = SECTIONS.find((x) => x.id === "hat");
    s.entries = Object.entries(wardrobe.hats()).filter(([, hat]) => !hat.variantOf).map(([id, hat]) => ({ id, name: hat.name, draw: hatOn(id), has: () => wardrobe.opened(id) }));
  }

  const has = (section, entry) => (entry.has ? entry.has() : !!state.seen[`${section.id}:${entry.id}`]);
  function counts() {
    hatSection();
    let got = 0;
    let total = 0;
    for (const s of SECTIONS) for (const e of s.entries) { total++; if (has(s, e)) got++; }
    return { got, total };
  }

  // ---------- 記録する ----------
  function mark(section, id) {
    const key = `${section}:${id}`;
    if (state.seen[key]) return;
    state.seen[key] = ymd;
    save();
    const s = SECTIONS.find((x) => x.id === section);
    const e = s?.entries.find((x) => x.id === id);
    // 1 日 1 行だけなので、日記の 1 日の上限（できごとの行）には数えない
    if (e) grow.write("zukan", `ずかんに「${e.name}」が ふえた。`, { force: true });
    const { got, total } = counts();
    if (got * 2 >= total) achievements.unlock("zukan-half");
  }
  on("seen", ({ id }) => mark("sky", id));
  on("weather", ({ kind }) => mark("weather", kind));
  on("omikuji", ({ name }) => mark("fortune", name));
  on("boot", () => {
    const phase = document.getElementById("moon").dataset.phase;
    if (phase) mark("moon", phase);
  });

  // ---------- 画面（日記のノートの「ずかん」タブ） ----------
  const body = document.getElementById("zukan-body");
  function render() {
    const { got, total } = counts();
    const silhouette = (svg) => svg.replace(/style="fill:[^"]+"/g, 'style="fill:#3d3460"'); // 暗いマスの上で、形だけうっすら見える
    body.innerHTML = `
      <div class="zukan-head">
        <p>あつめた かず <b>${got}</b> / ${total}</p>
        <div class="zukan-bar"><span style="width:${Math.round((got / total) * 100)}%"></span></div>
      </div>
      ${SECTIONS.map((s) => `
        <section class="zukan-section">
          <h3>${s.title}</h3>
          <ul class="zukan-grid">
            ${s.entries.map((e) => {
              const ok = has(s, e);
              const pic = e.text ? `<span class="zukan-text">${ok ? e.text : "？"}</span>` : ok ? e.draw() : silhouette(e.draw());
              return `<li class="${ok ? "got" : "unknown"}"><span class="zukan-pic">${pic}</span><span class="zukan-name">${ok ? e.name : "？？？"}</span></li>`;
            }).join("")}
          </ul>
        </section>`).join("")}`;
  }

  // タブの切りかえ
  const tabs = [...document.querySelectorAll(".diary-tab")];
  function show(which) {
    for (const t of tabs) t.setAttribute("aria-selected", String(t.dataset.tab === which));
    for (const t of tabs) document.getElementById(t.getAttribute("aria-controls")).hidden = t.dataset.tab !== which;
    if (which === "zukan") render();
    // へやに いる ときは タイトルだけ、ページの ときは「◀ へや」で もどれる（v1.57）
    const dlg = document.getElementById("diary");
    dlg.classList.toggle("at-home", which === "home");
    document.getElementById("room-back").hidden = which === "home";
    const t = tabs.find((x) => x.dataset.tab === which);
    document.getElementById("diary-title").textContent = which === "home" ? "ピクセの おへや" : t?.textContent ?? "ピクセの おへや";
    emit("notebook-tab", { which });
  }
  tabs.forEach((t) => t.addEventListener("click", () => show(t.dataset.tab)));
  // ←→ で となりの タブへ、Home/End で はしへ（えらんだ タブだけ Tab キーで とまる）
  const syncTabStops = () => tabs.forEach((t) => (t.tabIndex = t.getAttribute("aria-selected") === "true" ? 0 : -1));
  syncTabStops();
  on("notebook-tab", syncTabStops);
  tabs.forEach((t, i) =>
    t.addEventListener("keydown", (e) => {
      const j = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 }[e.key];
      if (j === undefined) return;
      e.preventDefault();
      const next = tabs[(j + tabs.length) % tabs.length];
      show(next.dataset.tab);
      next.focus();
    })
  );
  document.getElementById("room-btn").addEventListener("click", () => room.open("home"));
  document.getElementById("room-back").addEventListener("click", () => {
    sound.sfx.select();
    show("home");
  });
  cheats.add("zukan", () => room.open("zukan"));

  return { mark, counts, show, state };
})();

// ---------- ピクセの おへや：にっき・ずかん・スタンプ・じっせき・ぼうしを ひとつの まどに ----------
const room = {
  // tab："diary" | "zukan" | "stamp" | "trophy" | "hat"
  open(tab = "diary") {
    if (!document.getElementById("diary").open) grow.open();
    zukan.show(tab);
  },
  // おへやから ポストカード・カード・ぼうし・きねんしゃしんを ひらく ときは、とじたら おへやに もどる（v1.52.1）
  // 本人「閉じたら リンクの 画面に 戻るの なんか やだ。おへやに いたいのに」
  backTab: null,
  leave() {
    const d = document.getElementById("diary");
    if (!d.open) return;
    room.backTab = document.querySelector('.diary-tab[aria-selected="true"]')?.dataset.tab ?? "diary";
    d.close();
  },
  back() {
    const tab = room.backTab;
    if (!tab) return false;
    room.backTab = null;
    room.open(tab);
    return true;
  },
};
