// ---------- ピクセと さっきょく：ドットのピアノロールで、自分だけの BGM を作る ----------
// 曲は 4 小節（8 分音符 32 個）× 12 音の単音メロディ。ベースはコード進行から自動。
// 作った曲はこのブラウザに保存して BGM にできる。?song=◯◯ の URL で人に送れる。
const composer = (() => {
  // 上から順に高い音（ミ〜ラ）。ハ長調／イ短調の音だけなので、どこに置いてもそれらしく聞こえる
  const ROWS = [88, 86, 84, 83, 81, 79, 77, 76, 74, 72, 71, 69];
  const NAMES = ["ミ", "レ", "ド", "シ", "ラ", "ソ", "ファ", "ミ", "レ", "ド", "シ", "ラ"];
  const STEPS = 32;
  const CHORDS = [
    { name: "Am → F → C → G", bass: [45, 41, 48, 43], tones: [[69, 72, 76], [65, 69, 72], [72, 76, 79], [67, 71, 74]] },
    { name: "C → G → Am → F", bass: [48, 43, 45, 41], tones: [[72, 76, 79], [67, 71, 74], [69, 72, 76], [65, 69, 72]] },
    { name: "F → G → Em → Am", bass: [41, 43, 40, 45], tones: [[65, 69, 72], [67, 71, 74], [64, 67, 71], [69, 72, 76]] },
    { name: "C → Am → F → G", bass: [48, 45, 41, 43], tones: [[72, 76, 79], [69, 72, 76], [65, 69, 72], [67, 71, 74]] },
    { name: "Dm → G → C → Am", bass: [38, 43, 48, 45], tones: [[74, 77, 81], [67, 71, 74], [72, 76, 79], [69, 72, 76]] },
  ];
  const BPMS = [100, 110, 120, 130, 140, 150, 160, 170, 180];
  const SAVE_KEY = "warpix-song";

  // ---------- 曲 ⇄ 文字列（URL で送れる短い形） ----------
  // "1" ＋ コード番号 1 けた ＋ テンポ番号 1 けた ＋ 32 音ぶんの 16 進（0 は休符、1〜c は上から何番目の音か）
  const encode = (s) => `1${s.chord.toString(16)}${BPMS.indexOf(s.bpm).toString(16)}${s.steps.map((n) => n.toString(16)).join("")}`;
  function decode(code) {
    if (!/^1[0-9a-f]{34}$/i.test(code ?? "")) return null;
    const chord = parseInt(code[1], 16);
    const bpm = BPMS[parseInt(code[2], 16)];
    const steps = [...code.slice(3)].map((c) => parseInt(c, 16));
    if (!CHORDS[chord] || !bpm || steps.some((n) => n > ROWS.length)) return null;
    return { chord, bpm, steps };
  }

  // いまの BGM（ふつうの曲や季節の曲）を、ピアノロールの形に直す
  function fromSong(song, bpm = 140) {
    const steps = song.lead.slice(0, STEPS).map((n) => {
      if (!n) return 0;
      let best = 0;
      ROWS.forEach((r, i) => { if (Math.abs(r - n) < Math.abs(ROWS[best] - n)) best = i; });
      return best + 1;
    });
    const chord = Math.max(0, CHORDS.findIndex((c) => c.bass.join() === song.bass.join()));
    return { chord, bpm, steps };
  }
  const toSong = (s) => ({ lead: s.steps.map((n) => (n ? ROWS[n - 1] : null)), bass: CHORDS[s.chord].bass });
  const builtIn = () => fromSong(season.song ?? sound.defaultSong);

  function apply(s) {
    sound.setSong(toSong(s));
    sound.setBpm(s.bpm);
  }

  // 保存してある自分の曲があれば、最初から BGM にする（季節の曲より優先）
  let saved = decode(store.get(SAVE_KEY, null));
  if (saved) apply(saved);
  let current = saved ?? builtIn(); // いま BGM として鳴らす曲

  // ---------- ピクセに まかせる（自動作曲） ----------
  function pixeCompose(chord) {
    const steps = [];
    let prev = 6;
    for (let i = 0; i < STEPS; i++) {
      const bar = Math.floor(i / 8);
      const tones = CHORDS[chord].tones[bar];
      const strong = i % 4 === 0;
      if (!strong && Math.random() < 0.28) {
        steps.push(0);
        continue;
      }
      let row;
      if (strong) {
        // 強い拍はコードの音（いちばん近い高さ）
        const pick = tones[Math.floor(Math.random() * tones.length)];
        const cands = ROWS.map((r, j) => [j, r]).filter(([, r]) => r % 12 === pick % 12);
        row = cands.reduce((a, b) => (Math.abs(b[0] - prev) < Math.abs(a[0] - prev) ? b : a))[0];
      } else {
        // 弱い拍は、となりの音へ少し動く
        row = Math.max(0, Math.min(ROWS.length - 1, prev + [-2, -1, -1, 1, 1, 2][Math.floor(Math.random() * 6)]));
      }
      prev = row;
      steps.push(row + 1);
    }
    steps[STEPS - 1] = 0;
    return steps;
  }

  // ---------- 画面 ----------
  const dialog = document.getElementById("composer");
  const canvas = document.getElementById("roll");
  const c = canvas.getContext("2d");
  const status = document.getElementById("roll-status");
  const msg = document.getElementById("composer-msg");
  const playBtn = document.getElementById("compose-play");
  const chordSel = document.getElementById("compose-chord");
  const bpmEl = document.getElementById("compose-bpm");
  CHORDS.forEach((ch, i) => chordSel.add(new Option(ch.name, String(i))));

  let draft = null; // 作曲中の曲
  let cursor = { col: 0, row: 5 };
  let cell = { w: 10, h: 14 };
  let raf = 0;
  let wasPlaying = false;
  const LABEL_W = 28;

  function size() {
    const avail = Math.min(dialog.clientWidth - 40, 520) - LABEL_W;
    cell = { w: Math.max(8, Math.floor(avail / STEPS)), h: 14 };
    const w = LABEL_W + cell.w * STEPS;
    const h = cell.h * ROWS.length;
    const dpr = devicePixelRatio || 1;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function draw() {
    const css = getComputedStyle(document.body);
    const v = (n) => css.getPropertyValue(n).trim();
    const W = LABEL_W + cell.w * STEPS;
    c.fillStyle = v("--bg");
    c.fillRect(0, 0, W, cell.h * ROWS.length);
    // 行（ドの行は少し明るく）とラベル
    ROWS.forEach((r, i) => {
      if (r % 12 === 0) {
        c.fillStyle = v("--btn");
        c.fillRect(LABEL_W, i * cell.h, cell.w * STEPS, cell.h);
      }
      c.fillStyle = v("--muted");
      c.font = '10px "DotGothic16", monospace';
      c.textBaseline = "middle";
      c.fillText(NAMES[i], 4, i * cell.h + cell.h / 2 + 1);
    });
    // 拍と小節の線
    for (let col = 0; col <= STEPS; col++) {
      c.fillStyle = col % 8 === 0 ? v("--accent-2") : col % 2 === 0 ? v("--btn-hover") : v("--btn");
      c.fillRect(LABEL_W + col * cell.w, 0, col % 8 === 0 ? 2 : 1, cell.h * ROWS.length);
    }
    // 再生中の位置
    const pos = dialog.open && sound.playing() ? sound.position() : -1;
    if (pos >= 0) {
      c.fillStyle = "rgba(255, 216, 74, 0.25)";
      c.fillRect(LABEL_W + pos * cell.w, 0, cell.w, cell.h * ROWS.length);
    }
    // 音符
    draft.steps.forEach((n, col) => {
      if (!n) return;
      c.fillStyle = col === pos ? v("--gold") : v("--accent");
      c.fillRect(LABEL_W + col * cell.w + 1, (n - 1) * cell.h + 2, cell.w - 1, cell.h - 3);
    });
    // キーボード操作のカーソル
    if (document.activeElement === canvas) {
      c.strokeStyle = v("--accent-2");
      c.lineWidth = 2;
      c.strokeRect(LABEL_W + cursor.col * cell.w + 1, cursor.row * cell.h + 1, cell.w - 1, cell.h - 1);
    }
  }

  function loop() {
    draw();
    raf = dialog.open ? requestAnimationFrame(loop) : 0;
  }

  function say(text) {
    msg.textContent = text;
  }

  function describe() {
    const n = draft.steps[cursor.col];
    status.textContent = `${Math.floor(cursor.col / 8) + 1}しょうせつめ ${(cursor.col % 8) + 1}こめ：${n ? NAMES[n - 1] : "やすみ"}`;
  }

  // マスを押す：同じ音ならけす、ちがう音ならその音にする（1 拍に 1 音）
  function setCell(col, row, mode) {
    const want = mode === "erase" ? 0 : row + 1;
    if (draft.steps[col] === want) return;
    draft.steps[col] = want;
    if (want) sound.preview(ROWS[row]);
    if (sound.playing()) apply(draft);
  }

  function cellAt(e) {
    const r = canvas.getBoundingClientRect();
    const col = Math.floor((e.clientX - r.left - LABEL_W) / cell.w);
    const row = Math.floor((e.clientY - r.top) / cell.h);
    return col >= 0 && col < STEPS && row >= 0 && row < ROWS.length ? { col, row } : null;
  }

  let paint = null;
  canvas.addEventListener("pointerdown", (e) => {
    const at = cellAt(e);
    if (!at) return;
    canvas.setPointerCapture(e.pointerId);
    paint = draft.steps[at.col] === at.row + 1 ? "erase" : "draw";
    cursor = at;
    setCell(at.col, at.row, paint);
    describe();
  });
  canvas.addEventListener("pointermove", (e) => {
    if (!paint) return;
    const at = cellAt(e);
    if (at) setCell(at.col, at.row, paint);
  });
  ["pointerup", "pointercancel"].forEach((t) => canvas.addEventListener(t, () => (paint = null)));

  canvas.addEventListener("keydown", (e) => {
    const moves = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
    if (moves[e.key]) {
      e.preventDefault();
      cursor.col = (cursor.col + moves[e.key][0] + STEPS) % STEPS;
      cursor.row = Math.max(0, Math.min(ROWS.length - 1, cursor.row + moves[e.key][1]));
      describe();
    } else if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      setCell(cursor.col, cursor.row, draft.steps[cursor.col] === cursor.row + 1 ? "erase" : "draw");
      describe();
    }
  });
  canvas.addEventListener("focus", describe);

  function renderControls() {
    chordSel.value = String(draft.chord);
    bpmEl.textContent = String(draft.bpm);
    playBtn.textContent = sound.playing() ? "■ とめる" : "▶ きく";
  }

  playBtn.addEventListener("click", () => {
    if (sound.playing()) sound.bgmStop();
    else {
      apply(draft);
      sound.bgmPlay();
    }
    renderControls();
  });
  document.getElementById("compose-pixe").addEventListener("click", () => {
    draft.steps = pixeCompose(draft.chord);
    if (sound.playing()) apply(draft);
    say(["ピクセ「こんな かんじ どう？」", "ピクセ「できた！ ……たぶん めいきょく。」", "ピクセ「ふんふーん♪」"][Math.floor(Math.random() * 3)]);
  });
  document.getElementById("compose-clear").addEventListener("click", () => {
    draft.steps = Array(STEPS).fill(0);
    if (sound.playing()) apply(draft);
    say("ピクセ「まっしろに なった。」");
  });
  chordSel.addEventListener("change", () => {
    draft.chord = Number(chordSel.value);
    if (sound.playing()) apply(draft);
  });
  document.getElementById("compose-slower").addEventListener("click", () => {
    draft.bpm = BPMS[Math.max(0, BPMS.indexOf(draft.bpm) - 1)];
    if (sound.playing()) apply(draft);
    renderControls();
  });
  document.getElementById("compose-faster").addEventListener("click", () => {
    draft.bpm = BPMS[Math.min(BPMS.length - 1, BPMS.indexOf(draft.bpm) + 1)];
    if (sound.playing()) apply(draft);
    renderControls();
  });

  document.getElementById("compose-save").addEventListener("click", () => {
    saved = { ...draft, steps: [...draft.steps] };
    current = saved;
    store.set(SAVE_KEY, encode(saved));
    apply(saved);
    say("ピクセ「BGM に したよ！ いい きょく。」");
    achievements.unlock("composer");
    grow.write("song", "いっしょに きょくを つくった。");
    renderShelf();
  });
  document.getElementById("compose-reset").addEventListener("click", () => {
    saved = null;
    store.set(SAVE_KEY, null);
    current = builtIn();
    draft = { ...current, steps: [...current.steps] };
    apply(current);
    sound.setBpm(140);
    say("ピクセ「もとの BGM に もどしたよ。」");
    renderControls();
    renderShelf();
  });
  document.getElementById("compose-share").addEventListener("click", async () => {
    const url = new URL(location.href);
    url.search = "";
    url.searchParams.set("song", encode(draft));
    try {
      if (navigator.share && matchMedia("(pointer: coarse)").matches) {
        await navigator.share({ title: "WARPIX LINK の きょく", url: url.href });
        say("ピクセ「おくったよ！」");
      } else {
        await navigator.clipboard.writeText(url.href);
        say("ピクセ「きょくの リンクを コピーしたよ！ だれかに おくってみて。」");
      }
    } catch {
      say(`ピクセ「この リンクを おくってね：${url.href}」`);
    }
  });

  // v1.59：いりぐちは ピクセの へやの レコードプレーヤー（みぎうえの ♪ は けした）。とじると へやに もどる
  function open() {
    room.leave();
    wasPlaying = sound.playing();
    draft = { ...current, steps: [...current.steps] };
    dialog.showModal();
    size();
    renderControls();
    say("ピクセ「マスを おして おとを おいてね。もういちど おすと けせるよ。」");
    describe();
    if (!raf) loop();
  }

  // 閉じたら、BGM にしていない作曲中の曲はしまって、いつもの曲に戻す
  dialog.addEventListener("close", () => {
    apply(current);
    if (!saved && !received) sound.setBpm(140);
    const bgmOn = document.getElementById("bgm-toggle").getAttribute("aria-pressed") === "true";
    if (sound.playing() && !(wasPlaying && bgmOn)) sound.bgmStop();
    if (!sound.playing() && wasPlaying && bgmOn) sound.bgmPlay();
    room.back();
  });
  document.getElementById("composer-close").addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (e) => e.target === dialog && dialog.close());
  addEventListener("resize", () => dialog.open && size());
  cheats.add("compose", open);

  // ---------- レコードだな：つくった曲を 6 まいまで しまっておける ----------
  // 曲の名前は、ピクセが曲の中身から つける（同じ曲なら いつも同じ名前）
  const SHELF_KEY = "warpix-shelf";
  const SHELF_MAX = 6;
  const WORDS_A = ["ほしの", "よるの", "ピコピコ", "まよなかの", "ちいさな", "ワープする", "ねむい", "ひかる", "ドットの", "とおくの"];
  const WORDS_B = ["マーチ", "ワルツ", "ブルース", "ララバイ", "テーマ", "ポルカ", "ファンファーレ", "うた", "ダンス", "ソナタ"];
  function titleOf(code) {
    let h = 7;
    for (const ch of code) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    return `${WORDS_A[h % WORDS_A.length]} ${WORDS_B[Math.floor(h / WORDS_A.length) % WORDS_B.length]}`;
  }
  let shelf = (store.get(SHELF_KEY, []) ?? []).filter((c) => decode(c)).slice(0, SHELF_MAX);
  const shelfList = document.getElementById("shelf-list");
  const shelfEmpty = document.getElementById("shelf-empty");
  const saveShelf = () => store.set(SHELF_KEY, shelf);

  function renderShelf() {
    shelfList.replaceChildren(...shelf.map((code, i) => {
      const s = decode(code);
      const li = document.createElement("li");
      const name = document.createElement("span");
      name.className = "shelf-name";
      name.textContent = `${titleOf(code)}`;
      const info = document.createElement("small");
      info.textContent = ` ${CHORDS[s.chord].name.split(" → ")[0]}・${s.bpm}`;
      name.append(info);
      if (saved && encode(saved) === code) {
        const now = document.createElement("b");
        now.className = "shelf-now";
        now.textContent = " ♪BGM";
        name.append(now);
      }
      const btn = (label, aria, fn) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "c-btn c-small";
        b.textContent = label;
        b.setAttribute("aria-label", `${titleOf(code)}を ${aria}`);
        b.addEventListener("click", fn);
        return b;
      };
      li.append(
        name,
        btn("ひらく", "ひらく", () => {
          draft = { ...s, steps: [...s.steps] };
          if (sound.playing()) apply(draft);
          renderControls();
          say(`ピクセ「『${titleOf(code)}』を ひらいたよ。」`);
        }),
        btn("BGM", "BGM に する", () => {
          draft = { ...s, steps: [...s.steps] };
          document.getElementById("compose-save").click();
          renderControls();
        }),
        btn("✕", "たなから だす", () => {
          shelf.splice(i, 1);
          saveShelf();
          renderShelf();
          say(`ピクセ「『${titleOf(code)}』を たなから だしたよ。」`);
          shelfList.querySelector("button")?.focus() ?? document.getElementById("shelf-add").focus();
        }),
      );
      return li;
    }));
    shelfEmpty.hidden = shelf.length > 0;
  }

  // たなに しまう。"ok"・"dup"（もうある）・"full"（いっぱい）を返す
  function shelve(code) {
    if (shelf.includes(code)) return "dup";
    if (shelf.length >= SHELF_MAX) return "full";
    shelf.push(code);
    saveShelf();
    renderShelf();
    grow.write("shelf", `きょく『${titleOf(code)}』を たなに しまった。`);
    if (shelf.length >= 3) achievements.unlock("collector");
    return "ok";
  }
  document.getElementById("shelf-add").addEventListener("click", () => {
    const code = encode(draft);
    if (draft.steps.every((n) => !n)) return say("ピクセ「まだ おとが ひとつも ないよ。」");
    const res = shelve(code);
    if (res === "dup") return say(`ピクセ「その きょくは もう たなに あるよ。『${titleOf(code)}』。」`);
    if (res === "full") return say(`ピクセ「たなが いっぱい（${SHELF_MAX}まい）。✕ で ひとつ だしてね。」`);
    say(`ピクセ「『${titleOf(code)}』って なまえに したよ。たなに しまった！」`);
  });
  renderShelf();

  // ---------- だれかから届いた曲（?song=◯◯） ----------
  let received = null;
  const code = new URLSearchParams(location.search).get("song");
  const gift = decode(code);
  on("boot", () => {
    if (!gift) return;
    const wait = () => {
      if (!npc.ready() || playing() || npc.isAway()) return setTimeout(wait, 1000);
      // きょくの リンクで きた 人は、それが めあて。はじめての 人にも、ほかの 話より さきに きく（v1.52）
      npc.turn({ evenFirst: true });
      npc.ask("だれかから きょくが\nとどいてる！ きいてみる？", ["きく", "あとで"]).then((i) => {
        if (i === 1) npc.say(["じゃあ また あとでね。"]);
        if (i !== 0) return;
        received = gift;
        current = gift;
        apply(gift);
        sound.bgmPlay();
        achievements.unlock("listener");
        grow.write("gift", "だれかから きょくが とどいた。");
        npc.say(["♪♪♪", "ずっと きくなら、おへやの レコードプレーヤーで\n「これを BGM に する」を おしてね。"]);
      });
    };
    setTimeout(wait, 1200);
  });

  // ほかのファイルから使う：ピクセの自動作曲・ためしに鳴らす・もとに戻す
  const make = () => {
    const chord = Math.floor(Math.random() * CHORDS.length);
    return encode({ chord, bpm: BPMS[2 + Math.floor(Math.random() * 4)], steps: pixeCompose(chord) });
  };
  function play(code) {
    const s = decode(code);
    if (!s) return;
    apply(s);
    sound.bgmPlay();
  }
  // ためしに鳴らした曲をしまって、いつもの BGM に戻す（もともと止まっていたら止める）
  function restore(wasPlaying) {
    apply(current);
    if (!saved && !received) sound.setBpm(140);
    const bgmOn = document.getElementById("bgm-toggle").getAttribute("aria-pressed") === "true";
    if (sound.playing() && !(wasPlaying && bgmOn)) sound.bgmStop();
  }

  return { encode, decode, open, titleOf, make, play, restore, shelve, current: () => current, shelf: () => [...shelf] };
})();
