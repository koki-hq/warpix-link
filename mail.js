// ---------- おしらせ（v1.59 → v2.0）：みぎうえの ふうとう。WARPIX製作所からの メールボックス ----------
// v2.0 で 中身を はりかえ（v1 の おしらせは へや・クローゼット・パーティの はなしなので のこさない）。
// 本人「お知らせメール機能は残すよ　ないとダメやろ」「お知らせは画面に出していい　歯車ボタンに入れると導線としてわかりにくい」
// 版ごとに MAILS へ 1 つう たす。みらいの ひづけは その ひまで でない。いつ きた ひとにも ぜんぶ みえる（掲示板）
const mail = (() => {
  const state = { read: [], ...store.get(KEY.mail, null) };
  const save = () => store.set(KEY.mail, state);
  const ymd = ymdOf(today());
  const fmt = (s) => `${s.slice(0, 4)}/${Number(s.slice(5, 7))}/${Number(s.slice(8, 10))}`;

  const MAILS = [
    {
      id: "2026-11-v2",
      date: "2026-11-10",
      title: "WARPIX LINK が あたらしく なりました",
      body: [
        "WARPIX LINK を、リンクアプリとして つかいやすく つくりなおしました。",
        "よく行くサイトを「グループ」に まとめて、ワンタップで ワープできます。右上の ＋ から グループを つくってみてください。",
        "ピクセの へやや ゲームは おやすみに なりました。ピクセは これからも、画面の うえで まっています。",
      ],
    },
  ];

  const born = () => pixe.met().born;
  function list() {
    const welcome = {
      id: "welcome",
      date: born(),
      title: "ようこそ、WARPIX LINK へ",
      body: ["WARPIX製作所です。きてくれて ありがとう。", "あたらしい ことが あったら、ここで おしらせします。"],
    };
    const board = MAILS.filter((m) => m.date <= ymd);
    return [welcome, ...board].sort((x, y) => (x.date === y.date ? 0 : x.date < y.date ? 1 : -1));
  }
  const unread = () => list().filter((m) => !state.read.includes(m.id));

  const btn = document.getElementById("mail-btn");
  const dot = btn.querySelector(".mail-dot");
  function mark() {
    const n = unread().length;
    btn.classList.toggle("has-new", n > 0);
    dot.hidden = n === 0;
    btn.setAttribute("aria-label", n ? `おしらせ（よんで いない ものが ${n}つう）` : "おしらせ");
  }

  const dialog = document.getElementById("mail");
  const listEl = document.getElementById("mail-list");
  const readEl = document.getElementById("mail-read");
  const backBtn = document.getElementById("mail-back");
  function showList() {
    readEl.hidden = true;
    backBtn.hidden = true;
    listEl.hidden = false;
    listEl.innerHTML = list()
      .map((m) => {
        const isNew = !state.read.includes(m.id);
        return `<li><button type="button" class="mail-item${isNew ? " unread" : ""}" data-id="${m.id}"><span class="mail-date">${fmt(m.date)}</span><span class="mail-title">${m.title}</span>${isNew ? '<span class="mail-new">NEW</span>' : ""}</button></li>`;
      })
      .join("");
  }
  function read(id) {
    const m = list().find((x) => x.id === id);
    if (!m) return;
    listEl.hidden = true;
    readEl.hidden = false;
    backBtn.hidden = false;
    readEl.innerHTML = `<p class="mail-meta">${fmt(m.date)} ・ WARPIX製作所より</p><h3>${m.title}</h3>${m.body.map((t) => `<p>${t}</p>`).join("")}`;
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
