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

  // 版ごとに ここへ 1 つう たす。みらいの ひづけは その ひまで でない。
  // 開店（2026-11-01）からは 掲示板（だい 11 かい 会議、本人「掲示板みたいにしたほうがいいのかもね」）：
  // ほんとうの ひづけの まま、いつ きた ひとにも ぜんぶ みえる。あとから きた ひとが よんでも へんに ならない ように かく
  // （「〜に なりました」で なく「〜が 入荷しました」）。pre: true は プレリリース中の もの。開店の ひから でない
  const OPEN = "2026-11-01";
  const MAILS = [
    {
      id: "2026-10-24-mailbox",
      date: "2026-10-24",
      pre: true,
      title: "おしらせ ボックスが できました",
      body: ["WARPIX製作所からの おしらせは、これからは ここに とどきます。", "あたらしい おしらせが あると、この ふうとうが きんいろに ひかります。"],
    },
    {
      id: "2026-10-24-room",
      date: "2026-10-24",
      pre: true,
      title: "ROOM が ピクセの へやに なりました",
      body: ["ROOM を ひらくと、ピクセが くらす へやが あります。", "まど・カレンダー・ほんだな・ポスト……へやの ものを おすと、それぞれの ページが ひらきます。", "あたらしい ものが ある ものは、ひかって おしえて くれます。"],
      action: { label: "へやを みる", go: () => room.open("home") },
    },
    {
      id: "2026-10-24-closet",
      date: "2026-10-24",
      pre: true,
      title: "コスチュームが 入庫しました",
      body: ["へやの ハンガーラックで、ピクセの ぼうしと コスチュームを きせかえ できます。", "アイテムを おすと ためしに きられます。きに いったら「これに する」。", "あう ひが ふえたり、きせつが かわったりすると、あたらしい ものが とどきます。"],
      action: goCloset,
    },
    {
      id: "2026-10-24-party",
      date: "2026-10-24",
      pre: true,
      title: "リンクの パーティが つくれます",
      body: ["リンクの したの「リンクの へんせい」から、6 この リンクの くみあわせ（パーティ）を 3 つまで つくれます。", "パーティが 2 つ いじょう あると、リンクの したで きりかえられます。"],
    },
    {
      id: "2026-10-25-shelves",
      date: "2026-10-25",
      pre: true,
      title: "リンクの たなを ととのえました",
      body: ["「いつもの」の たなは なくして、YOUTUBE や SPOTIFY も それぞれの たなに いれました。", "せいかつの たなに TIMETREE が はいりました。", "パーティを ふやす ときは、6 こ そろった ところで もう できあがります。"],
    },
    {
      id: "2026-11-01-open",
      date: OPEN,
      title: "WARPIX LINK、開店しました",
      body: ["11/1、WARPIX LINK が みんなに ひらきました。", "いつもの せかいへ、ピクセと いっしょに ワープしてね。", "あたらしい ことは、ここで おしらせします。"],
    },
    // きせつの コスチュームの 入荷は、ひとごとに とどけず 掲示板に 1 かい はる（だい 11 かい 会議）。
    // あきは 開店の あと（本人「最初からアイテム多すぎるのさめる」）。ひにちは closet の RESTOCK と そろえる
    {
      id: "2026-11-15-autumn",
      date: "2026-11-15",
      title: "あきの コスチュームが 入荷しました",
      body: ["どんぐりの ぼうし・あきの マフラー・あきの セーターが はいりました。", "11 がつ の うちに あうと もらえます。", "へやの ハンガーラックで ためしに きてみてね。"],
      action: goCloset,
    },
    {
      id: "2026-12-01-winter",
      date: "2026-12-01",
      title: "ふゆの コスチュームが 入荷しました",
      body: ["ニットぼうが はいりました。2 がつ まで に あうと もらえます。", "あったかく してね。"],
      action: goCloset,
    },
    {
      id: "2026-12-18-christmas",
      date: "2026-12-18",
      title: "クリスマスの コスチュームが 入荷しました",
      body: ["サンタぼうと サンタの ふくが はいりました。12/25 まで に あうと もらえます。"],
      action: goCloset,
    },
  ];

  // ようこそ（はじめて きた ひ）は いちばん うえに ピンどめ。ひづけの ならびには いれない（だい 11 かい 会議）
  const born = () => (growState() ?? store.get("warpix-pixe", null))?.born ?? ymd;
  function list() {
    const welcome = {
      id: "welcome",
      date: born(),
      pin: true,
      title: "ようこそ、WARPIX LINK へ",
      body: ["WARPIX製作所です。きてくれて ありがとう。", "いつもの せかいへ、ピクセと いっしょに たのしく ワープしてね。", "あたらしい ことが あったら、ここで おしらせします。"],
    };
    const board = MAILS.filter((m) => m.date <= ymd && !(m.pre && ymd >= OPEN)).sort((x, y) => (x.date === y.date ? 0 : x.date < y.date ? 1 : -1));
    return [welcome, ...board];
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
            return `<li><button type="button" class="mail-item${isNew ? " unread" : ""}${m.pin ? " pin" : ""}" data-id="${m.id}"><span class="mail-date">${m.pin ? "PIN" : fmt(m.date)}</span><span class="mail-title">${m.title}</span>${isNew ? '<span class="mail-new">NEW</span>' : ""}</button></li>`;
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
