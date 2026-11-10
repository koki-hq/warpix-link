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
  const iosSafari = ios && !inApp && !/CriOS|FxiOS|EdgiOS/.test(ua);

  for (const el of dialog.querySelectorAll(".ms-pixe")) el.innerHTML = pixe.look();

  // ホーム画面の ページは、もう アプリで ひらいて いる 人と パソコンには 出さない
  const homeShown = () => !pocket.standalone() && (ios || android);
  function homeHow() {
    if (inApp) return "いまはアプリの中のブラウザでひらいています。右上か右下の「…」から「ブラウザでひらく」を選んでから、ブラウザのメニューで「ホーム画面に追加」してね。";
    if (iosSafari) return "画面の下の共有ボタン（□に↑）から「ホーム画面に追加」。見つからないときは「…」の中にあります。";
    if (ios) return "共有ボタン（□に↑）から「ホーム画面に追加」。";
    return "ブラウザのメニュー（︙）から「ホーム画面に追加」か「アプリをインストール」。";
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
    if (pages[page].dataset.sheet === "home") document.getElementById("manual-how").textContent = homeHow();
  }
  function open() {
    pages = sheets.filter((s) => s.dataset.sheet !== "home" || homeShown());
    page = 0;
    show();
    if (!dialog.open) dialog.showModal();
    nextBtn.focus();
  }
  function close() {
    if (dialog.open) dialog.close();
    store.set(KEY.manual, true);
  }
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
  dialog.addEventListener("cancel", () => store.set(KEY.manual, true));

  return { open, isOpen: () => dialog.open, seen: () => store.get(KEY.manual, false) === true };
})();

// ---------- はじまり ----------
(() => {
  // ピクセの あいさつ。グループが まだ ない 人には つくる ことを すすめる（はじめての 日の じこしょうかいは そのまま）
  pixe.say(CASSETTES.current() || pixe.firstVisit ? pixe.greeting() : "まだ リンクが ないね。\nいっしょに つくろう！");

  // はじめての 人には せつめいしょ（?go=manual なら だれでも）。テストは WARPIX_MANUAL = false で とめる
  const asked = new URLSearchParams(location.search).get("go") === "manual";
  if (asked || (window.WARPIX_MANUAL !== false && !manual.seen())) setTimeout(manual.open, reduceMotion ? 0 : 400);

  // BGM は さいしょに さわった ときから（ブラウザが かってに 音を ださせて くれない）
  const start = () => {
    if (settings.state.bgm && !sound.playing()) sound.bgmPlay(0.1);
  };
  addEventListener("pointerup", start, { once: true });
  addEventListener("keydown", start, { once: true });

  // うらに まわったら 音を とめ、もどったら つくりなおす
  document.addEventListener("visibilitychange", () => (document.hidden ? sound.pause() : sound.resume()));
})();
