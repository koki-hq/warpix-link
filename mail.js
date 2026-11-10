// ---------- おしらせ（v1.59）：みぎうえの ふうとう。WARPIX製作所からの メールボックス ----------
// だい 5 かいの はなしあい：「いちいち リンクを 踏ませたくない、WARPIX LINK に 集中して もらいたい」。
// ホームページの 製作所だよりは そのまま、こちらは WARPIX LINK の なか だけで おわる しくみ（どこにも よみに いかない）。
// けんめいの いちらん → ひらくと しょうさい。よんで いない ものが あると ふうとうが きんいろに。
// v2.0：へや・クローゼット・パーティの おしらせ（プレリリース中の もの と あき・ふゆ・クリスマスの 入荷）は はずした。
// v2.0 から おしらせは ふつうの 日本語（本人「お知らせはピクセ口調やめるよ　分かりにくいからね」）
const mail = (() => {
  const state = { read: [], ...store.get(KEY.mail, null) };
  const save = () => store.set(KEY.mail, state);
  const ymd = ymdOf(today());
  // ひづけは とし から（v1.66.3、本人「お知らせの日付は年も入れてほしい」）
  const fmt = (s) => `${s.slice(0, 4)}/${Number(s.slice(5, 7))}/${Number(s.slice(8, 10))}`;

  // 版ごとに ここへ 1 つう たす。みらいの ひづけは その ひまで でない。
  // 開店（2026-11-01）からは 掲示板（だい 11 かい 会議、本人「掲示板みたいにしたほうがいいのかもね」）：
  // ほんとうの ひづけの まま、いつ きた ひとにも ぜんぶ みえる。あとから きた ひとが よんでも へんに ならない ように かく
  // （「〜に なりました」で なく「〜が 入荷しました」）。pre: true は プレリリース中の もの。開店の ひから でない
  const MAILS = [
    {
      id: "2026-11-01-open",
      date: "2026-11-01",
      // v1.66.3：本人の ことばで かきなおした もの（v2.0 でも そのまま のこす）
      title: "WARPIX LINK を リリースしました",
      body: [
        "WARPIX製作所の 製品 だい 1 だんです。",
        "ドット絵の「ピクセ」という キャラクターと、いろんな せかいへ ワープする。そんな ことを かんがえて、公式サイトへの リンク集に してみました。",
        "コンセプトは「いつもの アプリを、ちょっと たのしく ひらく 入口。」です。",
        "べんりで つかいやすい アプリでは ないかもしれません。「きょうは ここを とおってみようかな」。そんな よりみちの きもちで つかってくれたら うれしいです。",
      ],
    },
    {
      // v2.0（本人と きめた 文面、2026-11-10）
      id: "2026-11-10-v2",
      date: "2026-11-10",
      title: "WARPIX LINK が新しくなりました",
      body: [
        "リンクアプリとして、もっと使いやすくするために作り直しました。",
        // v2.0.1：かじょうがきは 1 こずつ あいだを あける（本人「改行とかも入れて読みやすくしていいよ　なんか文字が詰まってる感じがする」）
        `<ul class="mail-points"><li>よく行くリンクを「グループ」にまとめられます。<br>右上の「＋」から作れます。</li><li>リンクは、棚から選ぶことも、自分で作ることもできます。</li><li>グループの名前を押すと、名前や並び順を変えられます。</li><li>左上のメニューから、ワープの記録を見たり、背景の空の色を選んだりできます。</li></ul>`,
        "以下の機能はなくなりました。",
        `<ul class="mail-points"><li>ピクセの部屋（日記・図鑑・実績・クローゼット・つぶやき・手紙）</li><li>ミニゲーム・おみくじ</li></ul>`,
        "今後とも WARPIX LINK をよろしくお願いします。",
      ],
    },
  ];

  // ようこそ（はじめて きた ひ）も きた ひの ひづけで ならべる。おなじ ひは ようこそ が うえ（あとから とどいた もの）。
  // v1.66 は ピンどめ だったが やめた（本人「ピン止めする意味なくね？だって１１/１に開店でしょ？　それがお知らせの第一投目じゃん？」）
  const born = () => pixe.met().born ?? ymd;
  function list() {
    const welcome = {
      id: "welcome",
      date: born(),
      title: "ようこそ、WARPIX LINK へ",
      body: ["WARPIX製作所です。きてくれて ありがとう。", "いつもの せかいへ、ピクセと いっしょに たのしく ワープしてね。", "あたらしい ことが あったら、ここで おしらせします。"],
    };
    const board = MAILS.filter((m) => m.date <= ymd);
    // あたらしい じゅん。おなじ ひなら ようこそ が うえ（sort は おなじ ものの じゅんを かえない）
    return [welcome, ...board].sort((x, y) => (x.date === y.date ? 0 : x.date < y.date ? 1 : -1));
  }
  const unread = () => list().filter((m) => !state.read.includes(m.id));

  // ---------- ふうとう ----------
  const ENVELOPE = ["###########", "##.......##", "#.#.....#.#", "#..#...#..#", "#...#.#...#", "#....#....#", "#.........#", "###########"];
  const btn = document.getElementById("mail-btn");
  btn.innerHTML = `${pixelSvg(ENVELOPE)}<span class="mail-dot" hidden></span><span class="sr-only">おしらせ</span>`;
  function mark() {
    const n = unread().length;
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
    readEl.innerHTML = `<p class="mail-meta">${fmt(m.date)} ・ WARPIX製作所より</p><h3>${m.title}</h3>${m.body.map((t) => (t.startsWith("<") ? t : `<p>${t}</p>`)).join("")}<p class="mail-sign">WARPIX製作所</p>`;
    // さいごに 署名（v2.0.1、本人「最後に　WARPIX製作所　とか入れてもいいね　丁寧な感じで」）
    if (!state.read.includes(id)) {
      state.read.push(id);
      save();
      mark();
    }
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

  mark();
  return { open, list, unread, state, MAILS, mark };
})();
