// ---------- とりあつかい せつめいしょ（v1.48、おたより #4・#6） ----------
// はじめての 人にだけ、ひらいて すぐ（テレビの スイッチの あと）出す。なにの アプリか・つかいかた・ホーム画面に 入れる やりかた。
// いつでも「とばす」。いちど とじたら もう 出ない。前に 来た ことが ある 人（warpix- の きろくが ある 人）には はじめから 出ない。
// 「このページについて」から いつでも よみなおせる。
const manual = (() => {
  const KEY = "warpix-manual";
  const dialog = document.getElementById("manual");
  const sheets = [...dialog.querySelectorAll(".manual-sheet")];
  const pageEl = document.getElementById("manual-page");
  const nextBtn = document.getElementById("manual-next");
  const skipBtn = document.getElementById("manual-skip");
  const installBtn = document.getElementById("manual-install");
  const point = document.getElementById("manual-point");
  const startScreen = document.getElementById("start-screen");

  // どこで ひらいて いるか（ホーム画面の やりかたを かえる）
  const ua = navigator.userAgent;
  const ios = /iPhone|iPad|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const android = /Android/.test(ua);
  const inApp = /Instagram|FBAN|FBAV|Line\//.test(ua); // インスタ・Facebook・LINE の なかの ブラウザ
  const iosSafari = ios && !inApp && !/CriOS|FxiOS|EdgiOS/.test(ua);

  // ピクセの え
  for (const el of dialog.querySelectorAll(".ms-pixe")) el.innerHTML = pixelSvg(NPC.idle);
  dialog.querySelector(".ms-cursor").innerHTML = pixelSvg([
    "o......",
    "oo.....",
    "owo....",
    "owwo...",
    "owwwo..",
    "owwwwo.",
    "owwwwwo",
    "owwoooo",
    "oo.owo.",
    "o...owo",
    "....oo.",
  ]);

  // ホーム画面の ページは、もう アプリで ひらいて いる 人と パソコンには 出さない
  const homeShown = () => !pocket.standalone() && (ios || android);
  function homeHow() {
    installBtn.hidden = ios || !pocket.canInstall();
    point.hidden = true;
    if (inApp) return "いまはアプリの中のブラウザでひらいています。右上か右下の「…」から「ブラウザでひらく」を選んでから、ブラウザのメニューで「ホーム画面に追加」してね。";
    if (iosSafari) {
      point.hidden = false;
      return "画面の下の共有ボタン（□に↑）から「ホーム画面に追加」。見つからないときは「…」の中にあります。";
    }
    if (ios) return "共有ボタン（□に↑）から「ホーム画面に追加」。";
    if (!installBtn.hidden) return "下のボタンを押すか、ブラウザのメニュー（︙）から「ホーム画面に追加」。";
    return "ブラウザのメニュー（︙）から「ホーム画面に追加」か「アプリをインストール」。";
  }

  let pages = [];
  let page = 0;
  let fromStart = false;

  function show() {
    sheets.forEach((s) => (s.hidden = s !== pages[page]));
    pageEl.textContent = `${page + 1}/${pages.length}`;
    const last = page === pages.length - 1;
    nextBtn.textContent = last ? (fromStart ? "はじめる ▶" : "とじる") : "つぎへ ▶";
    skipBtn.hidden = last;
    if (pages[page].dataset.sheet === "home") document.getElementById("manual-how").textContent = homeHow();
    else point.hidden = true;
  }

  function open(first = false) {
    fromStart = first;
    pages = sheets.filter((s) => s.dataset.sheet !== "home" || homeShown());
    page = 0;
    show();
    if (!dialog.open) dialog.showModal();
    nextBtn.focus();
  }

  function close() {
    point.hidden = true;
    if (dialog.open) dialog.close();
    store.set(KEY, true);
  }

  nextBtn.addEventListener("click", () => {
    if (page < pages.length - 1) {
      page++;
      show();
      nextBtn.focus();
      return;
    }
    close();
    // はじめての 人は「はじめる」で そのまま PRESS START と おなじに
    if (fromStart && !startScreen.hidden) document.getElementById("start-btn").click();
  });
  skipBtn.addEventListener("click", () => {
    close();
    if (fromStart) document.getElementById("start-btn").focus();
  });
  // Esc は「とばす」と おなじ
  dialog.addEventListener("cancel", () => store.set(KEY, true));
  dialog.addEventListener("close", () => (point.hidden = true));
  installBtn.addEventListener("click", async () => {
    await pocket.install();
    document.getElementById("manual-how").textContent = homeHow();
  });

  // このページについて から よみなおす
  document.getElementById("about-manual").addEventListener("click", () => {
    document.getElementById("about").close();
    open(false);
  });

  // はじめての 人だけ。テレビの スイッチ（0.45 びょう）が おわってから。テストは WARPIX_MANUAL = false で とめる
  if (window.WARPIX_MANUAL !== false && window.WARPIX_FIRST && !simple.on && !store.get(KEY, false)) {
    setTimeout(() => {
      if (startScreen.hidden || startScreen.classList.contains("leaving")) return; // もう はじめた
      open(true);
    }, reduceMotion ? 0 : 500);
  }

  return { open, isOpen: () => dialog.open };
})();
