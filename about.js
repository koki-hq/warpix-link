// ---------- このページについて：何を保存して、何を送るか。きろくを消すボタン ----------
(() => {
  const dialog = document.getElementById("about");
  const resetBtn = document.getElementById("about-reset");
  const resetMsg = document.getElementById("about-reset-msg");

  // ---------- ホームがめんに いれる（v1.37） ----------
  const ios = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const os = ios ? "ios" : /Android/.test(navigator.userAgent) ? "android" : "pc";
  const installBtn = document.getElementById("home-install");
  for (const el of document.querySelectorAll(`#home-steps [data-os="${os}"]`)) el.classList.add("here");
  document.querySelector(`#home-steps dt[data-os="${os}"]`).insertAdjacentHTML("beforeend", '<span class="home-here">（この きかい）</span>');
  function showHome() {
    const app = pocket.standalone();
    document.getElementById("home-status").textContent = app
      ? "いまは ホームがめんの アプリで ひらいているよ。"
      : "アプリに すると、ひらくのが はやく なって、きろくも きえにくく なるよ。";
    installBtn.hidden = !pocket.canInstall();
    document.getElementById("home-ios-note").hidden = !ios || app;
  }
  installBtn.addEventListener("click", async () => {
    await pocket.install();
    showHome();
  });

  document.getElementById("about-btn").addEventListener("click", () => {
    showHome();
    resetBtn.textContent = "きろくを ぜんぶ けす";
    resetMsg.textContent = "";
    armed = false;
    dialog.showModal();
  });
  document.getElementById("about-close").addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (e) => e.target === dialog && dialog.close());

  // 2 回押したら消す（1 回目はピクセが止める）。シンプルモードでも使えるよう、窓の中だけで完結させる
  let armed = false;
  let timer = 0;
  resetBtn.addEventListener("click", () => {
    if (!armed) {
      armed = true;
      resetBtn.textContent = "ほんとに けす（もういちど おす）";
      resetMsg.textContent = "ピクセ「ほんとに？ ぼくとの きおくも きえちゃうよ……」";
      clearTimeout(timer);
      timer = setTimeout(() => {
        armed = false;
        resetBtn.textContent = "きろくを ぜんぶ けす";
        resetMsg.textContent = "ピクセ「……よかった。」";
      }, 6000);
      return;
    }
    clearTimeout(timer);
    try {
      Object.keys(localStorage).filter((k) => k.startsWith("warpix-")).forEach((k) => localStorage.removeItem(k));
    } catch {}
    resetMsg.textContent = "ピクセ「……はじめまして？」";
    setTimeout(() => location.reload(), 900);
  });
})();
