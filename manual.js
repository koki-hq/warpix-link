// ---------- とりあつかい せつめいしょ（v1.48 → v2.0） ----------
// はじめての 人にだけ、リンクの 画面の うえに かさねて 出す（v2.0 で 起動画面は なくした。本人「いきなりリンクの画面でおけ」）。
// なにの アプリか・つかいかた（グループの かんばんを おすと へんしゅう、も ここで おしえる）・ホーム画面に 入れる やりかた。
// いつでも「とばす」。いちど とじたら もう 出ない。メニューの「アプリ」から いつでも よみなおせる。
const manual = (() => {
  const dialog = document.getElementById("manual");
  const sheets = [...dialog.querySelectorAll(".manual-sheet")];
  const pageEl = document.getElementById("manual-page");
  const nextBtn = document.getElementById("manual-next");
  const skipBtn = document.getElementById("manual-skip");
  const backBtn = document.getElementById("manual-back");

  const ua = navigator.userAgent;
  const ios = /iPhone|iPad|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const android = /Android/.test(ua);
  const inApp = /Instagram|FBAN|FBAV|Line\//.test(ua); // インスタ・Facebook・LINE の なかの ブラウザ

  for (const el of dialog.querySelectorAll(".ms-pixe")) el.innerHTML = pixe.look();

  // ホーム画面の ページは、もう アプリで ひらいて いる 人と パソコンには 出さない
  const homeShown = () => !pocket.standalone() && (ios || android);
  // iPhone と Android の りょうほうを 出す（v2.1.2、本人「なんで iphoneだけなん」）。いま つかって いる ほうを うえに
  function homeHow() {
    const iphone = "iPhone：Safari の共有ボタンから「ホーム画面に追加」。見つからないときは「…」の中にあります。";
    const droid = "Android：Chrome のメニュー（︙）から「ホーム画面に追加」か「アプリをインストール」。";
    const lines = android ? [droid, iphone] : [iphone, droid];
    if (inApp) lines.unshift("いまはアプリの中のブラウザで開いています。右上か右下の「…」から「ブラウザで開く」を選んでから、下のやりかたで追加してね。");
    return lines;
  }
  let pages = [];
  let page = 0;
  function show() {
    sheets.forEach((s) => (s.hidden = s !== pages[page]));
    pageEl.textContent = `${page + 1}/${pages.length}`;
    const last = page === pages.length - 1;
    nextBtn.textContent = last ? "はじめる ▶" : "つぎへ ▶";
    skipBtn.hidden = last;
    backBtn.hidden = page === 0;
    if (pages[page].dataset.sheet === "home") {
      const how = document.getElementById("manual-how");
      how.replaceChildren(...homeHow().map((t) => Object.assign(document.createElement("p"), { textContent: t })));
    }
  }
  let onClose = null;
  // first：はじめての 人。うしろの 画面を まっくらに して、リンクの 画面が 一瞬 見えない ように（v2.1）
  function open({ first = false, then = null, at = null } = {}) {
    dialog.classList.toggle("first", first);
    onClose = then;
    pages = sheets.filter((s) => s.dataset.sheet !== "home" || homeShown());
    page = Math.max(0, pages.findIndex((s) => s.dataset.sheet === at));
    show();
    if (!dialog.open) dialog.showModal();
    nextBtn.focus();
  }
  function close() {
    if (dialog.open) dialog.close();
  }
  dialog.addEventListener("close", () => {
    store.set(KEY.manual, true);
    dialog.classList.remove("first");
    const fn = onClose;
    onClose = null;
    fn?.();
  });
  nextBtn.addEventListener("click", () => {
    if (page < pages.length - 1) {
      page++;
      show();
      nextBtn.focus();
      return;
    }
    close();
    sound.sfx.select();
  });
  backBtn.addEventListener("click", () => {
    if (page === 0) return;
    page--;
    show();
    (backBtn.hidden ? nextBtn : backBtn).focus();
  });
  skipBtn.addEventListener("click", close);

  return { open, homeHow, phone: () => ios || android, isOpen: () => dialog.open, seen: () => store.get(KEY.manual, false) === true };
})();

// ---------- ホーム画面への さそい（v2.2）----------
// 本人「ホーム画面に追加しないで使われるのこっちも嫌なんよね」「ブラウザで見てる人には定期的に入れたい」「回数でいい気がする」。
// ブラウザで ひらいて いる スマホの 人だけ。はじめて リンクを 入れた とき に 1 かい、そのあとは 5 かい ひらく ごとに。
// 「もう出さない」は おかない（あとで だけ）。テストは window.WARPIX_INVITE = true / false で 出す・出さないを きめる
const invite = (() => {
  const EVERY = 5;
  const d = document.getElementById("invite-dialog");
  document.getElementById("invite-pixe").innerHTML = pixe.look();
  const st = { first: false, opens: 0, ...store.get(KEY.invite, null) };
  const save = () => store.set(KEY.invite, st);
  const can = () => (typeof window.WARPIX_INVITE === "boolean" ? window.WARPIX_INVITE : !pocket.standalone() && manual.phone());
  function show() {
    if (d.open || document.querySelector("dialog[open]")) return false;
    d.showModal();
    sound.sfx.select();
    return true;
  }
  // はじめて グループに リンクを 入れた とき
  function first() {
    if (!can() || st.first) return false;
    st.first = true;
    save();
    return show();
  }
  // ひらいた とき（はじめての さそいの あと、5 かいに 1 かい）
  function boot() {
    if (!can() || !st.first) return false;
    st.opens += 1;
    save();
    return st.opens % EVERY === 0 && show();
  }
  document.getElementById("invite-later").addEventListener("click", () => d.close());
  document.getElementById("invite-how").addEventListener("click", () => {
    d.close();
    manual.open({ at: "home" });
  });
  d.addEventListener("click", (e) => e.target === d && d.close());
  return { first, boot, state: () => ({ ...st }), EVERY };
})();

// ---------- はじまり ----------
(() => {
  // ピクセの あいさつ。グループが まだ ない 人には、つくる ところまで 案内する（v2.1 ナビゲーター）
  const hello = () => pixe.say(CASSETTES.current() ? pixe.greeting() : pixe.guide());

  // はじめての 人には 説明書（?go=manual なら だれでも）。テストは WARPIX_MANUAL = false で とめる。
  // 起動して すぐ 出す（v2.0 は 0.4 びょう まって いたので、リンクの 画面が 一瞬 見えた。本人「このラグ無理なんかな」）。
  // ピクセの あいさつは 説明書を とじてから
  const asked = new URLSearchParams(location.search).get("go") === "manual";
  if (asked || (window.WARPIX_MANUAL !== false && !manual.seen())) manual.open({ first: !manual.seen(), then: hello });
  else {
    hello();
    invite.boot();
  }

  // BGM は さいしょに さわった ときから（ブラウザが かってに 音を ださせて くれない）
  const start = () => {
    if (settings.state.bgm && !sound.playing()) sound.bgmPlay(0.1);
  };
  addEventListener("pointerup", start, { once: true });
  addEventListener("keydown", start, { once: true });

  // うらに まわったら 音を とめ、もどったら つくりなおす
  document.addEventListener("visibilitychange", () => (document.hidden ? sound.pause() : sound.resume()));
})();
