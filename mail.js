// ---------- おしらせ（v1.59）：みぎうえの ふうとう。WARPIX製作所からの メールボックス ----------
// だい 5 かいの はなしあい：「いちいち リンクを 踏ませたくない、WARPIX LINK に 集中して もらいたい」。
// ホームページの 製作所だよりは そのまま、こちらは WARPIX LINK の なか だけで おわる しくみ（どこにも よみに いかない）。
// けんめいの いちらん → ひらくと しょうさい。よんで いない ものが あると ふうとうが きんいろに。
// ピクセからの てがみ（にちようの よる）は ピクセからの DM なので、へやの ポストの まま。
const mail = (() => {
  const KEY = "warpix-mail";
  const state = { read: [], got: {}, ...store.get(KEY, null) };
  const save = () => store.set(KEY, state);
  const pad2 = (n) => String(n).padStart(2, "0");
  const ymdOf = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
  const ymd = ymdOf(today());
  const fmt = (s) => `${Number(s.slice(5, 7))}/${Number(s.slice(8, 10))}`;
  const goCloset = { label: "クローゼットを みる", go: () => room.open("hat") };

  // 版ごとに ここへ 1 つう たす。date より まえに であった ひとにも、その ひ から とどく（みらいの ひづけは その ひまで でない）。
  // before: true は まえから きて いる ひと むけの 話（かわった こと）。あとから きた ひとには とどけない（v1.65.3）
  const MAILS = [
    {
      id: "2026-10-24-mailbox",
      date: "2026-10-24",
      before: true,
      title: "おしらせ ボックスが できました",
      body: ["WARPIX製作所からの おしらせは、これからは ここに とどきます。", "あたらしい おしらせが あると、この ふうとうが きんいろに ひかります。"],
    },
    {
      id: "2026-10-24-room",
      date: "2026-10-24",
      title: "ROOM が ピクセの へやに なりました",
      body: ["ROOM を ひらくと、ピクセが くらす へやが あります。", "まど・カレンダー・ほんだな・ポスト……へやの ものを おすと、それぞれの ページが ひらきます。", "あたらしい ものが ある ものは、ひかって おしえて くれます。"],
      action: { label: "へやを みる", go: () => room.open("home") },
    },
    {
      id: "2026-10-24-closet",
      date: "2026-10-24",
      title: "コスチュームが 入庫しました",
      body: ["へやの ハンガーラックで、ピクセの ぼうしと コスチュームを きせかえ できます。", "アイテムを おすと ためしに きられます。きに いったら「これに する」。", "あう ひが ふえたり、きせつが かわったりすると、あたらしい ものが とどきます。"],
      action: goCloset,
    },
    {
      id: "2026-10-24-party",
      date: "2026-10-24",
      title: "リンクの パーティが つくれます",
      body: ["リンクの したの「リンクの へんせい」から、6 この リンクの くみあわせ（パーティ）を 3 つまで つくれます。", "パーティが 2 つ いじょう あると、リンクの したで きりかえられます。"],
    },
    {
      id: "2026-10-25-shelves",
      date: "2026-10-25",
      before: true,
      title: "リンクの たなを ととのえました",
      body: ["「いつもの」の たなは なくして、YOUTUBE や SPOTIFY も それぞれの たなに いれました。", "せいかつの たなに TIMETREE が はいりました。", "パーティを ふやす ときは、6 こ そろった ところで もう できあがります。"],
    },
    {
      id: "2026-11-01-open",
      date: "2026-11-01",
      title: "WARPIX LINK、開店しました",
      body: ["きょうから WARPIX LINK が みんなに ひらきました。", "いつもの せかいへ、ピクセと いっしょに ワープしてね。", "これからも ここで、あたらしい ことを おしらせします。"],
    },
  ];
  // きせつの コスチュームの 入庫（その きせつに はじめて きた ひに とどく）
  const SEASON_MAIL = {
    autumn: ["あきの コスチュームが 入庫しました", "どんぐりの ぼうし・あきの マフラー・あきの セーターが はいりました。"],
    winter: ["ふゆの コスチュームが 入庫しました", "ニットぼうが はいりました。あったかく してね。"],
    christmas: ["クリスマスの コスチュームが 入庫しました", "サンタぼうと サンタの ふくが はいりました。"],
    tsuyu: ["つゆの コスチュームが 入庫しました", "レインコートが はいりました。"],
    summer: ["なつの コスチュームが 入庫しました", "むぎわら ぼうしと ゆかたが はいりました。"],
  };
  function seasonal() {
    // きせつの 入庫は、その ひとが はじめて もらえた とき だけ。まいとしは おくらない（v1.63.2）。
    // はじめて きた ひに もう その きせつ だったら、ようこそ には まぜずに べつの 1 つうで とどく（v1.64）
    const b = born();
    return Object.entries(SEASON_MAIL)
      .map(([k, [title, line]]) => {
        const id = `season-${k}`;
        // v1.63.1 までの「season-autumn-2026」も おなじ もの と して よむ
        const old = Object.keys(state.got).find((x) => x.startsWith(`${id}-`));
        if (!state.got[id] && old) state.got[id] = state.got[old];
        if (!state.got[id] && wardrobe.seen(`season:${k}`) && seasonNow(k)) {
          state.got[id] = ymd;
          save();
        }
        const at = state.got[id];
        return at && at >= b ? { id, date: at, title, body: [line, "へやの ハンガーラックで ためしに きてみてね。"], action: goCloset } : null;
      })
      .filter(Boolean);
  }
  // その ひの きせつの はじまりの ひ（v1.64）：はる 3〜5・つゆ 6・なつ 7〜8・あき 9〜11・ふゆ 12〜2 がつ。
  // ゲームの シーズンの ように、きた きせつに でた おしらせは あとから きた ひとにも とどく（本人「始めたばかりの人に　情報が行き届かないのもなんか違う」）。
  // きた ひで きめるので、きせつが かわっても いちど とどいた ものは きえない
  function seasonStart(s) {
    const m = Number(s.slice(5, 7));
    const first = m >= 12 ? 12 : m >= 9 ? 9 : m >= 7 ? 7 : m === 6 ? 6 : m >= 3 ? 3 : 12;
    const y = Number(s.slice(0, 4)) - (m < 3 ? 1 : 0);
    return `${y}-${pad2(first)}-01`;
  }
  const seasonNow = (k) => {
    const m = today().getMonth() + 1;
    const md = m * 100 + today().getDate();
    return { autumn: [9, 10, 11].includes(m), winter: [12, 1, 2].includes(m), tsuyu: m === 6, summer: [7, 8].includes(m), christmas: md >= 1218 && md <= 1225 }[k];
  };

  // ようこその おしらせ（はじめて きた ひ）。ようこそ だけ、ほかの ことは まぜない（v1.64、本人「ごちゃ付く」）
  const born = () => (growState() ?? store.get("warpix-pixe", null))?.born ?? ymd;
  function list() {
    const b = born();
    const welcome = {
      id: "welcome",
      date: b,
      title: "ようこそ、WARPIX LINK へ",
      body: ["WARPIX製作所です。きてくれて ありがとう。", "いつもの せかいへ、ピクセと いっしょに たのしく ワープしてね。", "あたらしい ことが あったら、ここで おしらせします。"],
    };
    // きた ひ より あと に でた おしらせ（v1.63.2）と、きた きせつに でた おしらせ（v1.64）。みらいの ものは その ひまで でない
    const from = seasonStart(b);
    // きた ひ より まえの ものは きた ひ づけに そろえて、ようこそ を いちばん した（さいしょに とどいた もの）に（v1.65.3、本人「ようこそ の前にすでにメールが届いてるの違和感ある」）
    const later = MAILS.filter((m) => (m.date > b || (m.date >= from && !m.before)) && m.date <= ymd).map((m) => (m.date < b ? { ...m, date: b } : m));
    return [...later, ...seasonal(), welcome].sort((a, b2) => (a.date === b2.date ? 0 : a.date < b2.date ? 1 : -1));
  }
  const unread = () => list().filter((m) => !state.read.includes(m.id));

  // ---------- ふうとう ----------
  const ENVELOPE = ["###########", "##.......##", "#.#.....#.#", "#..#...#..#", "#...#.#...#", "#....#....#", "#.........#", "###########"];
  const btn = document.getElementById("mail-btn");
  btn.innerHTML = `${pixelSvg(ENVELOPE)}<span class="mail-dot" hidden></span><span class="sr-only">おしらせ</span>`;
  function mark() {
    // はじめての 日は ピクセと であう だけ。ひからせない（v1.54）
    const n = firstDay() ? 0 : unread().length;
    btn.classList.toggle("has-new", n > 0);
    btn.querySelector(".mail-dot").hidden = n === 0;
    btn.setAttribute("aria-label", n ? `おしらせ（よんで いない ものが ${n}つう）` : "おしらせ");
  }

  // ---------- まど ----------
  const dialog = document.getElementById("mail");
  const listEl = document.getElementById("mail-list");
  const readEl = document.getElementById("mail-read");
  const backBtn = document.getElementById("mail-back");
  function showList() {
    readEl.hidden = true;
    backBtn.hidden = true;
    listEl.hidden = false;
    const items = list();
    listEl.innerHTML = items.length
      ? items
          .map((m) => {
            const isNew = !state.read.includes(m.id);
            return `<li><button type="button" class="mail-item${isNew ? " unread" : ""}" data-id="${m.id}"><span class="mail-date">${fmt(m.date)}</span><span class="mail-title">${m.title}</span>${isNew ? '<span class="mail-new">NEW</span>' : ""}</button></li>`;
          })
          .join("")
      : `<li class="mail-empty">まだ おしらせは ないよ。</li>`;
  }
  function read(id) {
    const m = list().find((x) => x.id === id);
    if (!m) return;
    listEl.hidden = true;
    readEl.hidden = false;
    backBtn.hidden = false;
    readEl.innerHTML = `<p class="mail-meta">${fmt(m.date)} ・ WARPIX製作所より</p><h3>${m.title}</h3>${m.body.map((t) => `<p>${t}</p>`).join("")}${m.action ? `<button type="button" class="save-btn mail-action">${m.action.label}</button>` : ""}`;
    readEl.querySelector(".mail-action")?.addEventListener("click", () => {
      dialog.close();
      m.action.go();
    });
    if (!state.read.includes(id)) {
      state.read.push(id);
      save();
      mark();
    }
    achievements.unlock("factory");
    backBtn.focus();
  }
  function open() {
    showList();
    dialog.showModal();
    sound.sfx.select();
  }
  btn.addEventListener("click", open);
  listEl.addEventListener("click", (e) => {
    const b = e.target.closest(".mail-item");
    if (b) read(b.dataset.id);
  });
  backBtn.addEventListener("click", () => {
    showList();
    listEl.querySelector(".mail-item")?.focus();
  });
  document.getElementById("mail-close").addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (e) => e.target === dialog && dialog.close());

  on("boot", mark);
  mark();
  cheats.add("mail", open);
  return { open, list, unread, state, MAILS, mark };
})();
