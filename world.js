// ---------- v1.3「ページの外まで遊び場」：きせかえ、ファビコン、月、タブ、気づくピクセ、認定証、エンディング ----------

// grow.js は あとで よむ。そだつ とちゅう（grow を つくって いる さいちゅう）に よばれても こわれない ように（v1.57）
const growState = () => {
  try {
    return grow.state;
  } catch {
    return null;
  }
};

// ---------- きせかえ（実績のごほうび） ----------
const wardrobe = (() => {
  // top = 何行目から重ねるか。"." は透明
  const HATS = {
    crown: {
      name: "おうかん", unlock: "master", top: 0,
      rows: [
        "....y..yy..y....",
        "....yy.yy.yy....",
        "....yyyyyyyy....",
        "....ypyycyyy....",
      ],
    },
    party: {
      name: "パーティーハット", unlock: "party", top: 0,
      rows: [
        ".......cc.......",
        ".......pp.......",
        "......pwwp......",
        ".....pwpwpp.....",
      ],
    },
    nightcap: {
      name: "ナイトキャップ", unlock: "sleepy", top: 0,
      rows: [
        "......cccc..w...",
        ".....cccccccww..",
        "....wwwwwwww....",
      ],
    },
    ufo: {
      name: "UFO", unlock: "ufo", top: 0,
      rows: [
        "......cccc......",
        "....wwwwwwww....",
        ".....w.ww.w.....",
      ],
    },
    star: {
      name: "ほしの アンテナ", unlock: "shooting-star", top: 0,
      rows: [
        ".......yy.......",
        "......yyyy......",
        ".......yy.......",
      ],
    },
  };

  const listEl = document.getElementById("wardrobe-list");
  // 季節の帽子はあとから足されるので、ここでは知らない ID でも消さない
  let current = store.get("warpix-hat", null);
  // サングラスは v1.57 から アクセサリー（closet が きろくを うつす）
  if (current === "shades") current = null;

  // 季節イベント中は、帽子を選んでいなければ季節の帽子をかぶる
  let seasonal = null;
  const seen = new Set(store.get("warpix-season-hats", []));
  // もらいかた（unlock）：なし＝さいしょから・"days:N"＝N にち あう・"season:…"＝その きせつに あう・それ いがい＝じっせき（v1.57）
  const days = () => (growState() ?? store.get("warpix-pixe", null))?.days?.length ?? 0;
  const unlocked = (u) => !u || (u.startsWith("days:") ? days() >= Number(u.slice(5)) : u.startsWith("season:") ? seen.has(u) : achievements.has(u));
  const hintOf = (u) => (!u ? "" : u.startsWith("days:") ? `${u.slice(5)}にち あうと もらえる` : u.startsWith("season:") ? SEASON_HINT[u] ?? "きせつで もらえる" : `じっせき「${achievements.nameOf(u)}」で もらえる`);
  const SEASON_HINT = {
    "season:autumn": "あきに あえるかも",
    "season:winter": "ふゆに あえるかも",
    "season:spring": "はるに あえるかも",
    "season:tsuyu": "つゆの じきに あえるかも",
    "season:summer": "なつに あえるかも",
    "season:halloween": "ハロウィンの じきに あえるかも",
    "season:christmas": "クリスマスの じきに あえるかも",
    "season:newyear": "おしょうがつに あえるかも",
    "season:tanabata": "たなばたに あえるかも",
  };
  const isOpen = (hat) => unlocked(hat.unlock);

  // きんの アンテナ（もとは ぼうしの したに かさなって いた もの）は、きせつの ぼうしや あめの かさに ゆずる（v1.57）
  const shown = () => (current === "antenna" ? seasonal : null) ?? current ?? seasonal;
  function apply() {
    const id = shown();
    npc.setHat(id && HATS[id] ? HATS[id] : null);
    emit("hat", { id });
  }

  // ならべるのは クローゼット（closet）が する（v1.57）。ここは かぶった あと えを かきなおす だけ
  function render() {
    if (!listEl) return typeof closet !== "undefined" && closet.render();
    listEl.innerHTML = "";
    const options = [[null, { name: "なし" }], ...Object.entries(HATS)];
    for (const [id, hat] of options) {
      const open = isOpen(hat);
      const b = document.createElement("button");
      b.type = "button";
      b.className = "wardrobe-item";
      b.setAttribute("aria-pressed", String(current === id));
      b.title = open ? hat.name : hat.unlock.startsWith("season:") ? hat.hint : `じっせき「${achievements.nameOf(hat.unlock)}」で もらえる`;
      b.disabled = !open;
      b.innerHTML = open ? pixelSvg(dress(NPC.idle, id ? hat : null)) : "?";
      b.addEventListener("click", () => {
        wear(id);
        sound.sfx.coin();
      });
      listEl.append(b);
    }
  }

  // quiet：きろくを うつす とき（closet の はじめ）は、じっせきも おしらせも なし
  function wear(id, { quiet = false } = {}) {
    current = id;
    store.set("warpix-hat", current);
    apply();
    if (quiet) return;
    render();
    emit("wear", { id, name: id ? HATS[id]?.name : "なし" });
    if (id) achievements.unlock("fashion");
  }

  apply();
  return {
    render,
    // 季節の帽子を足す（unlock は "season:名前"。その季節を一度見たらずっと使える）
    addHat(id, hat) {
      HATS[id] = hat;
      if (current === id) apply();
    },
    seeSeason(key) {
      seen.add(key);
      store.set("warpix-season-hats", [...seen]);
    },
    wearSeasonal(id) {
      seasonal = id;
      apply();
    },
    wear,
    hats: () => HATS,
    opened: (id) => !!HATS[id] && isOpen(HATS[id]),
    // いま みえて いる ぼうし（きせつ・かさ も こみ）と、じぶんで えらんだ ぼうし
    currentId: () => shown(),
    chosenId: () => current,
    seen: (key) => seen.has(key),
    unlocked,
    hintOf,
  };
})();

// ---------- クローゼット（v1.57）：アイテムが ずらっと ならんで いて、おすと おおきな ピクセが ためしに きる。「これに する」で きまり ----------
// だい 4 かいの はなしあい：ぶんるいは「ぼうし」と「コスチューム」、1 つずつ。あたまの てっぺんに かかわる ものは ぜんぶ ぼうし
// （ヘッドホン・リボン・きんの アンテナ も）。コスチューム だけ あか・みどり・ちゃいろ・こん を つかって いい（PALETTE の R G D B N）。
// もらいかたは unlock（なし＝さいしょから・"days:N"・"season:…"・じっせき）。ベレー だけ とくべつに いろを えらべる（4 しょく、さいしょから）。
// あたらしく もらった ものが あると へやの ハンガーラックが ひかり、その アイテムに NEW（ためしに きると きえる）。
const closet = (() => {
  const KINDS = [
    { id: "hat", name: "ぼうし" },
    { id: "cos", name: "コスチューム" },
  ];
  const stage = () => (growState() ?? store.get("warpix-pixe", null))?.stage ?? 0;
  // コスチューム（1 つ だけ きられる）
  const ITEMS = {
    glasses: { name: "まるめがね", layer: { top: 6, rows: ["...yyyy..yyyy...", "...y..yyyy..y...", "...y..y..y..y...", "...yyyy..yyyy..."] } },
    scarf: { name: "スカーフ", unlock: "days:3", layer: { top: 12, rows: ["..cccccccccccc..", ".........ccc...."] } },
    cape: { name: "マント", unlock: "days:7", layer: { top: 6, rows: ["p..............p", "p..............p", "p..............p", "p..............p", "p..............p", "p..............p", "p..............p", "pp............pp"] } },
    overalls: { name: "オーバーオール", unlock: "days:20", layer: { top: 10, rows: ["....N......N....", ".oNNyNNNNNNyNNo.", "..oNNNNNNNNNNo..", "...ooNNNNNNoo..."] } },
    suit: { name: "スーツ", unlock: "days:50", layer: { top: 11, rows: [".oNNNNwwwwNNNNo.", "..oNNNwRRwNNNo..", "...ooNNRRNNoo..."] } },
    muffler: { name: "あきの マフラー", unlock: "season:autumn", layer: { top: 11, rows: ["...kkkkkkkkkk...", "..kkykkykkykkk..", "..........kyk...", "..........kkk..."] } },
    sweater: { name: "あきの セーター", unlock: "season:autumn", layer: { top: 11, rows: [".oBBBBBBBBBBBBo.", "..oBkBBkBBkBBo..", "...ooBBBBBBoo..."] } },
    santa: { name: "サンタの ふく", unlock: "season:christmas", layer: { top: 11, rows: [".oRRRRRRRRRRRRo.", "..oRRRoyyoRRRo..", "...oowwwwwwoo..."] } },
    raincoat: { name: "レインコート", unlock: "season:tsuyu", layer: { top: 3, rows: ["....yyyyyyyy....", "..yy........yy..", ".y............y.", "y..............y", "y..............y", "y..............y", "y..............y", "y..............y", ".y............y.", "..yyyyyyyyyyyy..", "...yyywyyyyyy..."] } },
    yukata: { name: "ゆかた", unlock: "season:summer", layer: { top: 11, rows: [".oNwNNNwNNNwNNo.", "..oRRRRRRRRRRo..", "...ooNwNNwNoo..."] } },
    shades: { name: "サングラス", unlock: "hacker", layer: { top: 7, rows: ["...oooooooooo...", "...oooo..oooo..."] } },
    necklace: { name: "ネックレス", unlock: "enikki", layer: { top: 11, rows: ["...y........y...", "....yyyyyyyy....", ".......cc......."] } },
    bowtie: { name: "ちょうネクタイ", unlock: "postcard", layer: { top: 12, rows: ["......p...p.....", "......ppppp.....", "......p...p....."] } },
  };
  // ぼうし（ぼうしの たなは wardrobe。ここで たす）。variantOf：いろちがい（ならびには もとの 1 つ だけ、いろは まるで えらぶ）
  const beret = (c) => ["........X.......", "....XXXXXXXX....", "...XXXXXXXXXX...", "....XXXXXXXX...."].map((r) => r.replaceAll("X", c));
  const HATS = {
    beret: { name: "ベレーぼう", color: "あか", swatch: "R", top: 1, rows: beret("R") },
    "beret-deep": { name: "ベレーぼう", color: "ふかい みどり", swatch: "D", variantOf: "beret", top: 1, rows: beret("D") },
    "beret-navy": { name: "ベレーぼう", color: "こん", swatch: "N", variantOf: "beret", top: 1, rows: beret("N") },
    "beret-light": { name: "ベレーぼう", color: "あかるい みどり", swatch: "G", variantOf: "beret", top: 1, rows: beret("G") },
    catears: { name: "ねこみみ", unlock: "days:2", top: 2, rows: ["..oo........oo..", "..opo......opo..", "..oppo....oppo.."] },
    ribbon: { name: "リボン", unlock: "days:5", top: 1, rows: ["....RRR..RRR....", "....RRRRRRRR....", "....RRR..RRR...."] },
    headphones: { name: "ヘッドホン", unlock: "days:10", top: 2, rows: [".....cccccc.....", "...cc......cc...", "..c..........c..", ".cc..........cc.", ".cc..........cc.", ".cc..........cc."] },
    antenna: { name: "きんの アンテナ", unlock: "days:14", top: 0, rows: ["......yyyy......", ".......yy.......", ".......yy......."] },
    tophat: { name: "シルクハット", unlock: "days:30", top: 0, rows: ["....oooooooo....", "....oooooooo....", "....RRRRRRRR....", "..oooooooooooo.."] },
    acorn: { name: "どんぐりの ぼうし", unlock: "season:autumn", top: 1, rows: [".......BB.......", ".....BBBBBB.....", "....BkBkBkBk....", "....BBBBBBBB...."] },
    knit: { name: "ニットぼう", unlock: "season:winter", top: 0, rows: [".......ww.......", ".....GGGGGG.....", "....GwGwGwGw....", "...wwwwwwwwww..."] },
    straw: { name: "むぎわら ぼうし", unlock: "season:summer", top: 1, rows: [".....yyyyyy.....", "....yyyyyyyy....", "....RRRRRRRR....", "..yyyyyyyyyyyy.."] },
    chef: { name: "コックさんの ぼうし", unlock: "composer", top: 0, rows: ["....wwwwwwww....", "...wwwwwwwwww...", "....wwwwwwww....", "....vvvvvvvv...."] },
  };
  for (const [id, hat] of Object.entries(HATS)) wardrobe.addHat(id, hat);

  // きせつ（その きせつに 1 かい あえば、ずっと もらえる）。テストは ?date= の とき だけ
  const m = today().getMonth() + 1;
  const SEASONS = { autumn: [9, 10, 11], winter: [12, 1, 2], spring: [3, 4, 5], tsuyu: [6], summer: [7, 8] };
  if (eventDays()) for (const [k, months] of Object.entries(SEASONS)) if (months.includes(m)) wardrobe.seeSeason(`season:${k}`);

  const KEY = "warpix-wear";
  // まだ きろくが ない 人（v1.56 まで）：そだって もらった ものを きた まま（コスチュームは 1 つ なので あたらしい ほう）。
  // ぼうしの サングラスは コスチュームへ。14 にちの きんの アンテナは ぼうしに（ほかの ぼうしを かぶって いなければ）
  let worn = store.get(KEY, null);
  if (!worn) {
    worn = { cos: stage() >= 2 ? "cape" : stage() >= 1 ? "scarf" : null };
    if (store.get("warpix-hat", null) === "shades") {
      worn.cos = "shades";
      store.set("warpix-hat", null);
    }
    if (stage() >= 3 && !store.get("warpix-hat", null)) wardrobe.wear("antenna", { quiet: true });
  }

  // ---------- NEW（もらった けど まだ ためして いない もの） ----------
  const SEEN = "warpix-closet-seen";
  const owned = () => [
    ...Object.entries(wardrobe.hats()).filter(([id, h]) => !h.variantOf && id !== "mine" && wardrobe.opened(id)).map(([id]) => `h:${id}`),
    ...Object.entries(ITEMS).filter(([, it]) => wardrobe.unlocked(it.unlock)).map(([id]) => `c:${id}`),
  ];
  // はじめて この しくみに であった ときは、もう もって いる ものは みた ことに する（いきなり ぜんぶ NEW に ならない）
  let seenSet = null;
  const seenList = () => (seenSet ??= new Set(store.get(SEEN, null) ?? (store.set(SEEN, owned()), owned())));
  const isNew = (key) => !seenList().has(key);
  function markSeen(key) {
    if (!isNew(key)) return;
    seenList().add(key);
    store.set(SEEN, [...seenList()]);
  }

  const layerOf = (id) => (ITEMS[id] ? [ITEMS[id].layer] : []);
  // さいしょ（init）は ファビコンが まだ できて いない ので よばない（あとで じぶんで dress を よむ）
  function apply(init = false) {
    wearLayers = layerOf(worn.cos);
    npc.refresh();
    if (!init) favicon.refresh();
  }
  function wear(id) {
    worn = { cos: id };
    store.set(KEY, worn);
    apply();
    emit("wear", { id, name: id ? ITEMS[id].name : "なし" });
    if (id) achievements.unlock("fashion");
  }

  // ---------- まど（ROOM の クローゼット） ----------
  const previewEl = document.getElementById("closet-preview");
  const nameEl = document.getElementById("closet-name");
  const colorsEl = document.getElementById("closet-colors");
  const decideBtn = document.getElementById("closet-decide");
  const kindsEl = document.getElementById("closet-kinds");
  const listEl = document.getElementById("closet-list");
  const atelierBtn = document.getElementById("atelier-btn");
  let kind = "hat";
  let trying = null; // { hat: id か null } または { cos: id か null }

  const hats = () => wardrobe.hats();
  const hatNow = () => wardrobe.currentId() ?? null;
  // クローゼットの「きてる」は じぶんで えらんだ ぼうし（あめの かさ などで かくれて いても）
  const hatMine = () => wardrobe.chosenId() ?? wardrobe.currentId() ?? null;
  const familyOf = (id) => hats()[id]?.variantOf ?? id;
  const same = (a, b) => !!a && !!b && a.hat === b.hat && a.cos === b.cos;
  const isWorn = (t) => ("hat" in t ? hatMine() === t.hat : (worn.cos ?? null) === t.cos);
  function lookOf(t) {
    const hat = t && "hat" in t ? t.hat : hatNow();
    const cos = t && "cos" in t ? t.cos : worn.cos;
    return dress(NPC.idle, hat ? hats()[hat] ?? null : null, [...layerOf(cos), ...growthLayers]);
  }
  const nameOf = (t) => ("hat" in t ? (t.hat ? hats()[t.hat]?.name : "ぼうし なし") : t.cos ? ITEMS[t.cos].name : "コスチューム なし");

  function renderTop() {
    previewEl.innerHTML = pixelSvg(lookOf(trying));
    colorsEl.innerHTML = "";
    if (!trying) {
      nameEl.textContent = "きせかえる ものを えらんでね";
      decideBtn.hidden = true;
      return;
    }
    nameEl.textContent = nameOf(trying);
    // いろちがいが ある ぼうしは、したに いろの まる
    const fam = trying.hat && familyOf(trying.hat);
    const variants = fam ? Object.entries(hats()).filter(([id, h]) => id === fam || h.variantOf === fam) : [];
    if (variants.length > 1) {
      colorsEl.innerHTML = variants
        .map(([id, h]) => {
          const open = wardrobe.opened(id);
          return `<button type="button" class="closet-color" data-hat="${id}" aria-pressed="${id === trying.hat}" ${open ? "" : "disabled"} aria-label="${open ? h.color : `？（${wardrobe.hintOf(h.unlock)}）`}" title="${open ? h.color : wardrobe.hintOf(h.unlock)}">${open ? `<span style="background:${PALETTE[h.swatch]}"></span>` : "？"}</button>`;
        })
        .join("");
    }
    decideBtn.hidden = false;
    const on = isWorn(trying);
    decideBtn.textContent = on ? "きてるよ" : "これに する";
    decideBtn.disabled = on;
  }

  function render() {
    kindsEl.innerHTML = KINDS.map((k) => `<button type="button" class="closet-kind" data-kind="${k.id}" aria-pressed="${k.id === kind}">${k.name}</button>`).join("");
    atelierBtn.hidden = kind !== "hat";
    const options =
      kind === "hat"
        ? [[null, { name: "なし" }], ...Object.entries(hats()).filter(([, h]) => !h.variantOf)].map(([id, h]) => ({ t: { hat: id }, name: h.name, open: id === null || wardrobe.opened(id), hint: wardrobe.hintOf(h.unlock), family: id }))
        : [[null, { name: "なし" }], ...Object.entries(ITEMS)].map(([id, it]) => ({ t: { cos: id }, name: it.name, open: id === null || wardrobe.unlocked(it.unlock), hint: wardrobe.hintOf(it.unlock) }));
    listEl.innerHTML = "";
    for (const o of options) {
      const b = document.createElement("button");
      b.type = "button";
      // いろちがいの どれかを かぶって いれば、もとの ぼうしに きてる しるし
      const on = "hat" in o.t ? o.t.hat !== null && familyOf(hatMine()) === o.family : isWorn(o.t);
      b.className = `wardrobe-item${on ? " worn" : ""}`;
      b.setAttribute("aria-pressed", String(!!trying && ("hat" in o.t ? "hat" in trying && familyOf(trying.hat) === o.family : same(trying, o.t))));
      b.setAttribute("aria-label", o.open ? `${o.name}${on ? "（きてる）" : ""}` : `？（${o.hint}）`);
      b.title = o.open ? o.name : o.hint;
      b.disabled = !o.open;
      b.dataset.id = o.t.hat ?? o.t.cos ?? "none";
      const key = "hat" in o.t ? `h:${o.t.hat}` : `c:${o.t.cos}`;
      const fresh = o.open && o.t[kind === "hat" ? "hat" : "cos"] !== null && isNew(key);
      b.innerHTML = (o.open ? pixelSvg(lookOf(o.t)) : "?") + (fresh ? '<span class="closet-new">NEW</span>' : "");
      b.addEventListener("click", () => {
        markSeen(key);
        // ぼうしは、いま かぶって いる いろちがいが あれば その いろから
        trying = "hat" in o.t && o.t.hat && familyOf(hatMine()) === o.family ? { hat: hatMine() } : o.t;
        sound.sfx.hover();
        render();
      });
      listEl.append(b);
    }
    renderTop();
  }

  colorsEl.addEventListener("click", (e) => {
    const b = e.target.closest(".closet-color");
    if (!b || b.disabled) return;
    trying = { hat: b.dataset.hat };
    sound.sfx.hover();
    renderTop();
  });
  // きめたら、いまの すがたに もどして「〜を きた！」
  decideBtn.addEventListener("click", () => {
    if (!trying) return;
    let msg;
    if ("hat" in trying) {
      wardrobe.wear(trying.hat);
      const h = hats()[trying.hat];
      msg = trying.hat ? `${h?.name}${h?.color && h.variantOf ? `（${h.color}）` : ""}を かぶった！` : "ぼうしを ぬいだ。";
    } else {
      wear(trying.cos);
      msg = trying.cos ? `${ITEMS[trying.cos].name}を きた！` : "コスチュームを ぬいだ。";
    }
    sound.sfx.coin();
    npc.jump();
    trying = null;
    render();
    nameEl.textContent = msg;
  });
  kindsEl.addEventListener("click", (e) => {
    const b = e.target.closest(".closet-kind");
    if (!b) return;
    kind = b.dataset.kind;
    trying = null;
    sound.sfx.select();
    render();
  });
  on("notebook-tab", ({ which }) => {
    if (which !== "hat") return;
    trying = null;
    render();
  });

  apply(true);
  return {
    // そだって もらった とき（grow.js）：きる・かぶる
    gift(id) {
      if (ITEMS[id]) wear(id);
      else if (hats()[id]) wardrobe.wear(id);
    },
    wear,
    worn: () => ({ ...worn }),
    // へやの ハンガーラックを ひからせる
    hasNew: () => owned().some(isNew),
    ITEMS,
    HATS,
    render,
  };
})();

// ---------- 生きているファビコン（タブのアイコンでもピクセがまばたきする） ----------
const favicon = (() => {
  const link = document.getElementById("favicon");
  const cv = document.createElement("canvas");
  cv.width = 16;
  cv.height = 16;
  const cx = cv.getContext("2d");
  const ALERT = Array.from({ length: 16 }, (_, y) =>
    (y >= 1 && y <= 9) || (y >= 12 && y <= 13) ? "......pppp......" : "................"
  );
  let mode = "idle"; // idle | blink | sleep | away | alert
  let lastHref = "";

  function draw(rows) {
    const css = getComputedStyle(document.body);
    const v = (name) => css.getPropertyValue(name).trim();
    const colors = { o: "#000", w: v("--fg"), p: v("--accent"), c: v("--accent-2"), y: v("--gold"), m: v("--muted"), v: v("--muted"), k: v("--pumpkin"), R: v("--cos-red"), G: v("--cos-green"), D: v("--cos-deep"), B: v("--cos-brown"), N: v("--cos-navy") };
    cx.clearRect(0, 0, 16, 16);
    rows.forEach((row, y) =>
      [...row].forEach((ch, x) => {
        if (!colors[ch]) return;
        cx.fillStyle = colors[ch];
        cx.fillRect(x, y, 1, 1);
      })
    );
    const href = cv.toDataURL("image/png");
    if (href !== lastHref) link.href = lastHref = href;
  }

  function render() {
    if (mode === "alert") return draw(ALERT);
    if (mode === "away") return draw(NPC.idle.map((r) => r.replace(/[^.]/g, "m"))); // 影だけ
    draw(dress(mode === "idle" ? NPC.idle : NPC.blink));
  }

  function set(next) {
    mode = next;
    render();
  }

  // ふだんの状態を、ページの様子から決める
  function auto() {
    if (mode === "alert") return;
    set(npc.isAway() ? "away" : document.hidden || document.getElementById("npc").classList.contains("asleep") ? "sleep" : "idle");
  }

  setInterval(() => {
    auto();
    if (mode !== "idle") return;
    set("blink");
    setTimeout(() => mode === "blink" && set("idle"), 150);
  }, 3200);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden && mode === "alert") mode = "idle";
    auto();
  });
  on("hat", auto);
  auto();
  return { alert: () => set("alert"), refresh: auto };
})();

// ---------- 本物の月（今日の月齢で欠けかたが変わる） ----------
(() => {
  const el = document.getElementById("moon");
  const SYNODIC = 29.530588853;
  const phase = (((today().getTime() / 86400000 + 2440587.5 - 2451550.1) / SYNODIC) % 1 + 1) % 1;
  const age = phase * SYNODIC;

  // 16x16 の円。満ち欠けの境目を行ごとに計算する
  const rows = Array.from({ length: 16 }, (_, y) => {
    let row = "";
    for (let x = 0; x < 16; x++) {
      const dx = (x + 0.5 - 8) / 7.5;
      const dy = (y + 0.5 - 8) / 7.5;
      if (dx * dx + dy * dy > 1) {
        row += ".";
        continue;
      }
      const w = Math.sqrt(1 - dy * dy);
      const lit = phase < 0.5 ? dx >= w * Math.cos(2 * Math.PI * phase) : dx <= w * Math.cos(2 * Math.PI * (phase - 0.5));
      row += lit ? "y" : "n";
    }
    return row;
  });
  el.innerHTML = pixelSvg(rows, { ...PALETTE, n: "var(--btn)" });

  const NAMES = [
    [1.8, "しんげつ"],
    [5.5, "みかづき"],
    [9.5, "じょうげんの つき"],
    [13.5, "まんげつ ちょっと まえ"],
    [16, "まんげつ"],
    [20, "ちょっと かけた つき"],
    [24, "かげんの つき"],
    [28, "ありあけの つき"],
    [Infinity, "しんげつ"],
  ];
  const name = NAMES.find(([max]) => age < max)[1];
  el.dataset.phase = name; // 図鑑が「きょう見た月」として読む
  el.setAttribute("aria-label", `きょうの つき：${name}`);

  el.addEventListener("click", () => {
    sound.sfx.twinkle();
    const lines = [`きょうの つきは ${name}！\n（げつれい ${age.toFixed(1)}）`];
    if (name === "まんげつ") lines.push("こんやは まんまる。\nUFOも みに きてるかもね。");
    if (name === "しんげつ") lines.push("……くらくて よく みえない。\nほしは よく みえるけどね。");
    npc.say(lines);
    achievements.unlock("moon");
  });
})();

// ---------- ほかのタブのピクセ（BroadcastChannel） ----------
(() => {
  if (!("BroadcastChannel" in window)) return;
  const ch = new BroadcastChannel("warpix-link");
  const me = Math.random().toString(36).slice(2, 10);
  const others = new Set();
  const sprite = document.getElementById("npc");
  let greeted = false;
  let visitingTo = null;
  let guest = null;

  const post = (type, extra = {}) => ch.postMessage({ type, from: me, ...extra });

  function onOthers() {
    if (greeted || !others.size) return;
    greeted = true;
    achievements.unlock("parallel");
    const tell = () => {
      if (guest) return; // もう本人（お客さん）が来ているなら言うまでもない
      if (!npc.ready() || playing()) return setTimeout(tell, 3000);
      npc.say(["あれ？ ほかの タブにも\nぼくが いる きがする……", "ぼくを ダブルクリックすると\nあそびに いけるかも。"]);
    };
    tell();
  }

  // 自分のピクセを、となりのタブへあそびに行かせる
  sprite.addEventListener("dblclick", () => {
    if (!others.size || npc.isAway() || playing() || visitingTo) return;
    visitingTo = [...others][0];
    npc.say(["ちょっと となりの タブに\nあそびに いってくる！"]);
    setTimeout(() => {
      stars.warp();
      sound.sfx.select();
      npc.setAway(true);
      favicon.refresh();
      post("visit", { to: visitingTo, hat: currentHat });
      achievements.unlock("tab-travel");
      emit("tab-travel", { role: "visit" });
    }, 1200);
  });

  function comeHome(lines) {
    visitingTo = null;
    stars.warp();
    npc.setAway(false);
    favicon.refresh();
    npc.jump();
    npc.say(lines);
  }

  // となりから来たピクセ（お客さん）
  function showGuest(from, hat) {
    if (guest) return;
    emit("seen", { id: "guest" });
    const el = document.createElement("button");
    el.type = "button";
    el.className = "npc-guest";
    el.setAttribute("aria-label", "となりのタブからきたピクセ");
    el.innerHTML = pixelSvg(dress(NPC.idle, hat));
    sprite.after(el);
    guest = { el, from, timer: null };
    achievements.unlock("tab-travel");
    emit("tab-travel", { role: "host" });

    const greet = () => {
      sound.sfx.coin();
      npc.say(["おじゃまします！\nとなりの タブから きたよ。", "わあ、ぼくが ふたり！\n……どっちが ほんもの？"]);
      guest.timer = setTimeout(() => sendHome(), 30000);
    };
    if (document.hidden) {
      // 裏のタブにいるときは、タブのアイコンとタイトルで知らせる
      favicon.alert();
      document.title = "❗ ピクセが きたよ - WARPIX LINK";
      document.addEventListener("visibilitychange", function onShow() {
        if (document.hidden) return;
        document.removeEventListener("visibilitychange", onShow);
        greet();
      });
    } else greet();
    el.addEventListener("click", () => sendHome());
  }

  function sendHome() {
    if (!guest) return;
    clearTimeout(guest.timer);
    guest.el.remove();
    post("home", { to: guest.from });
    guest = null;
    npc.say(["そろそろ かえるね。 またね！"]);
  }

  ch.addEventListener("message", ({ data }) => {
    const { type, from, to } = data;
    if (from === me || (to && to !== me)) return;
    if (type === "hello") {
      others.add(from);
      post("here", { to: from });
      onOthers();
    } else if (type === "here") {
      others.add(from);
      onOthers();
    } else if (type === "bye") {
      others.delete(from);
      if (visitingTo === from) comeHome(["むこうの タブが とじちゃった！\nあわてて かえってきたよ。"]);
      if (guest?.from === from) {
        clearTimeout(guest.timer);
        guest.from = null;
        npc.say(["あれ、かえる タブが\nなくなっちゃった……", "……ここに すんでも いい？"]);
      }
    } else if (type === "visit") {
      showGuest(from, data.hat);
    } else if (type === "home" && visitingTo === from) {
      comeHome(["ただいま！\nむこうの タブも たのしかったよ。"]);
    }
  });

  on("boot", () => post("hello"));
  addEventListener("pagehide", () => post("bye"));
})();

// ---------- ピクセが気づく ----------
(() => {
  // あいさつを言い終えていて、ほかに何もしていないときだけしゃべる
  const notice = (lines) => {
    if (!npc.ready() || npc.isAway() || playing()) return false;
    npc.say(lines);
    return true;
  };
  const once = new Set();
  const noticeOnce = (key, lines) => !once.has(key) && notice(lines) && once.add(key);

  // 何回目の来訪か
  on("boot", () => {
    const visits = store.get("warpix-visits", 0) + 1;
    store.set("warpix-visits", visits);
    // まいかい かぞえると くどいので、ふしめの かいだけ（v1.50）
    if (visits >= 100 && visits % 100 === 0) npc.addIntro(`${visits}かいめ！？\nもう ここに すんでるでしょ。`);
    else if (visits === 10 || visits === 50) npc.addIntro(`もう ${visits}かいめ！\nすっかり じょうれんさん だね。`);
    else if (visits === 2) npc.addIntro("また きてくれたんだ！\n2かいめ だね。");
  });

  // 別のタブに行って、戻ってきたとき
  let hiddenAt = 0;
  let lastBack = -1;
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) return (hiddenAt = Date.now());
    const sec = (Date.now() - hiddenAt) / 1000;
    // しつもんの とちゅうなら わりこまない（v1.52.1）
    if (!hiddenAt || sec < 30 || npc.busy()) return;
    // いつも おなじ だと くどいので、まえと ちがう いいかたで（v1.50）
    // じかんは いわない。かぞえて いる かんじは こわい（v1.52.1）
    const BACK = ["あ、もどってきた！", "おかえりー！", "おかえり。\nちょっと さみしかった。", "あ、おかえり！"];
    const i = lastBack < 0 ? Math.floor(Math.random() * BACK.length) : (lastBack + 1 + Math.floor(Math.random() * (BACK.length - 1))) % BACK.length;
    if (notice([BACK[i]])) lastBack = i;
  });

  document.addEventListener("copy", () => noticeOnce("copy", ["コピーした？\nなにを もっていくの？"]));

  let resizeTimer = 0;
  addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (innerWidth < 380) noticeOnce("narrow", ["せ、せまい……！"]);
      if (innerWidth > 1600) noticeOnce("wide", ["ひろーい！\nほしが いっぱい みえる。"]);
    }, 400);
  });

  addEventListener("keydown", (e) => {
    if (/^[a-z]$/i.test(e.key) && e.getModifierState?.("CapsLock")) {
      noticeOnce("caps", ["CAPS LOCK が ついてるよ！\n……おおきな こえ だね。"]);
    }
  });

  const sprite = document.getElementById("npc");
  let stareTimer = 0;
  sprite.addEventListener("mouseenter", () => {
    stareTimer = setTimeout(() => noticeOnce("stare", ["……そんなに じっと\nみられると てれる。"]), 3000);
  });
  sprite.addEventListener("mouseleave", () => clearTimeout(stareTimer));
  sprite.addEventListener("contextmenu", () => notice(["みぎクリックは\nくすぐったいよ！"]));

  // マウスが画面の上へ出ていったとき（タブを閉じようとしている？）
  document.addEventListener("mouseout", (e) => {
    if (!e.relatedTarget && e.clientY <= 0) noticeOnce("leave", ["もう いっちゃうの？\n……また きてね。"]);
  });
})();

// ---------- ピクセのおねがい → PIXE ADVENTURE ----------
(() => {
  let mine = false; // この かいの はなす ばんを もらった
  function ask() {
    if (!npc.ready() || playing() || npc.isAway() || document.hidden || document.getElementById("npc").classList.contains("asleep")) {
      return setTimeout(ask, 5000);
    }
    // 1 かい ひらいて 1 つ まで。こたえたら 1 しゅうかん あけて、2 かい ことわられたら おわり（v1.52）
    if (!mine && (!npc.mayAsk("adventure") || !npc.turn())) return;
    mine = true;
    npc.ask("ねえ…… ぼく この まどの そとに\nでてみたいな。 いっても いい？", ["いいよ！", "だめ"]).then((i) => {
      if (i >= 0) npc.answered("adventure", i === 0);
      if (i === 0) adventure.start();
      else if (i === 1) npc.say(["そっかあ……", "きが かわったら\nadventure って うってね。"]);
      else setTimeout(ask, 30000); // ほかのセリフに割りこまれたら、あとでもう一回
    });
  }
  on("boot", () => setTimeout(ask, 25000));
  cheats.add("adventure", () => adventure.start());
})();

// ---------- スタッフロール ----------
const credits = (() => {
  let el = null;
  let shownThisVisit = false;

  function stats() {
    const best = store.get("warpix-adv-best", null);
    return [
      ["SCORE", document.querySelector("[data-score]").textContent],
      ["HI-SCORE", document.querySelector("[data-hiscore]").textContent],
      ["じっせき", `${achievements.count()} / ${achievements.total}`],
      ["つついた かいすう", String(store.get("warpix-pokes", 0))],
      ["らいほう かいすう", String(store.get("warpix-visits", 1))],
      ["ぼうけん ベスト", best === null ? "--:--.-" : adventure.fmtTime(best)],
    ];
  }

  function close(finished) {
    if (!el) return;
    el.remove();
    el = null;
    sound.setTempo(1);
    if (finished) {
      achievements.unlock("credits");
      npc.say(["……おしまい？", "ううん、ほしぞらは\nまだまだ つづくよ！"]);
    }
  }

  function roll() {
    if (el) return;
    shownThisVisit = true;
    const row = (a, b) => `<p class="cr-row"><span>${a}</span><span>${b}</span></p>`;
    el = document.createElement("div");
    el.className = "credits";
    el.setAttribute("role", "dialog");
    el.setAttribute("aria-label", "スタッフロール");
    el.innerHTML = `
      <div class="credits-roll">
        <p class="cr-title">WARPIX-LINK</p>
        <p class="cr-head">STAFF</p>
        ${row("STARRING", "PIXE")}
        ${row("UFO", "???")}
        ${row("MOTHERSHIP", "???")}
        ${row("MOON", "THE REAL ONE")}
        ${row("MUSIC", "WEB AUDIO API")}
        ${row("PIXEL ART", "12×12 / 16×16")}
        ${row("PROGRAM", "HTML / CSS / JS")}
        ${row("BUILD TOOL", "NONE")}
        ${row("PRODUCER", "WARPIX製作所")}
        ${row("BUILT WITH", "CLAUDE")}
        ${row("SPECIAL THANKS", "YOU")}
        <p class="cr-head">あなたの きろく</p>
        ${stats().map(([a, b]) => row(a, b)).join("")}
        <p class="cr-head">THANK YOU<br>FOR PLAYING!</p>
        <div class="cr-pixe">${pixelSvg(dress(NPC.idle))}</div>
        <p class="cr-end">THE END ?</p>
        <p class="cr-maker">© 2026 WARPIX製作所</p>
      </div>
      <button type="button" class="credits-skip">SKIP ▶</button>`;
    document.body.append(el);
    sound.setTempo(0.7);

    const rollEl = el.querySelector(".credits-roll");
    // 画面の下から流れてきて、最後の THE END ? が画面のまんなかで止まる
    const from = innerHeight;
    const to = innerHeight / 2 - rollEl.offsetHeight + 60;
    const dist = from - to;
    rollEl.style.setProperty("--from", `${from}px`);
    rollEl.style.setProperty("--to", `${to}px`);
    // 1秒に 40px くらい、4px ずつカクカク進む
    rollEl.style.animationDuration = `${Math.round(dist / 40)}s`;
    rollEl.style.animationTimingFunction = `steps(${Math.round(dist / 4)})`;
    rollEl.addEventListener("animationend", () => setTimeout(() => close(true), 2500));
    // スキップは ボタン（と キー）だけ。スマホで スクロールしようと さわった だけで おわらないように
    el.querySelector(".credits-skip").addEventListener("click", () => close(false));
    addEventListener("keydown", function skip(e) {
      if (!el) return removeEventListener("keydown", skip);
      if (e.key === "Escape" || e.key === "Enter" || e.key === " ") {
        removeEventListener("keydown", skip);
        close(false);
      }
    });
  }

  // はじめてぼうけんをクリアしたら流す
  on("adventure-clear", () => {
    if (!shownThisVisit) setTimeout(roll, 3500);
  });
  cheats.add("credits", roll);
  return { roll };
})();

// ---------- 印刷すると、ピクセ公認の「認定証」になる ----------
(() => {
  const cert = document.getElementById("certificate");
  addEventListener("beforeprint", () => {
    if (document.body.classList.contains("booted")) achievements.unlock("print");
    const best = store.get("warpix-adv-best", null);
    const d = new Date();
    const items = [
      ["SCORE", document.querySelector("[data-score]").textContent],
      ["HI-SCORE", document.querySelector("[data-hiscore]").textContent],
      ["じっせき", `${achievements.count()} / ${achievements.total}`],
      ["ピクセを つついた かいすう", `${store.get("warpix-pokes", 0)} かい`],
      ["らいほう かいすう", `${store.get("warpix-visits", 1)} かい`],
      ["ぼうけん ベストタイム", best === null ? "まだ" : adventure.fmtTime(best)],
    ];
    const names = achievements.unlockedNames();
    cert.innerHTML = `
      <div class="cert-frame">
        <p class="cert-kicker">WARPIX-LINK</p>
        <h1 class="cert-title">にんていしょう</h1>
        <div class="cert-pixe">${pixelSvg(dress(NPC.idle))}</div>
        <p class="cert-lead">あなたは ワーピックスの ほしぞらで<br>つぎの きろくを のこしました。</p>
        <table class="cert-table">${items.map(([a, b]) => `<tr><th>${a}</th><td>${b}</td></tr>`).join("")}</table>
        <p class="cert-sub">てにいれた じっせき</p>
        <p class="cert-trophies">${names.length ? names.join(" ／ ") : "これから！"}</p>
        <p class="cert-date">${d.getFullYear()}ねん ${d.getMonth() + 1}がつ ${d.getDate()}にち</p>
        <p class="cert-sign">ワーピックスの ほしぞら あんないにん　ピクセ <span class="cert-stamp">ピ</span></p>
      </div>`;
  });
  cheats.add("print", () => print());
})();

// ---------- できごと → 実績（v1.3 ぶん） ----------
on("adventure-clear", ({ time }) => {
  achievements.unlock("adventure");
  if (time < 30) achievements.unlock("speedrun");
});
on("stomp", () => achievements.unlock("stomp"));
on("demo", () => achievements.unlock("demo"));
