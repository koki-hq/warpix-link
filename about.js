// ---------- このページについて：何を保存して、何を送るか。きろくを消すボタン ----------
(() => {
  const dialog = document.getElementById("about");
  const resetBtn = document.getElementById("about-reset");
  const resetMsg = document.getElementById("about-reset-msg");

  document.getElementById("about-btn").addEventListener("click", () => {
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
